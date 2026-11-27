// Google Drive của giáo viên (quyền drive.file: app chỉ thấy các tệp/thư mục do chính app tạo).
// Ảnh học sinh nộp được lưu vào Drive của giáo viên chủ lớp: JetBot Lab – <GV> / <Lớp> / <Bài được giao>.
const { HttpError, env, decrypt, adminEmails } = require("./_lib");
const { q } = require("./_db");

const SCOPE = "https://www.googleapis.com/auth/drive.file";
const API = "https://www.googleapis.com/drive/v3/";
const FOLDER = "application/vnd.google-apps.folder";
const N = v => v === null || v === undefined ? null : Number(v);

async function hasDrive(userId){
  const r = await q("SELECT scopes FROM teacher_tokens WHERE user_id = $1", [userId]);
  return !!(r.length && String(r[0].scopes || "").includes("drive.file"));
}
async function token(userId){
  const rows = await q("SELECT refresh_enc, scopes FROM teacher_tokens WHERE user_id = $1", [userId]);
  if (!rows.length || !String(rows[0].scopes || "").includes("drive.file")) throw new HttpError(409, "Giáo viên chưa kết nối Google Drive để lưu ảnh bài làm");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), refresh_token: decrypt(rows[0].refresh_enc), grant_type: "refresh_token" }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token){
    if (j.error === "invalid_grant"){
      await q("DELETE FROM teacher_tokens WHERE user_id = $1", [userId]);
      throw new HttpError(409, "Kết nối Google Drive của giáo viên đã hết hạn. Giáo viên hãy bấm “Kết nối Google Drive” lại.");
    }
    throw new HttpError(502, "Google không cấp quyền Drive (" + (j.error || r.status) + ")");
  }
  return j.access_token;
}
// Dự án Google Cloud chưa bật Google Drive API: báo cách sửa thay cho câu tiếng Anh dài của Google.
const DISABLED_MSG = "Google Drive API chưa được bật cho dự án Google Cloud của JetBot Lab. Người quản trị vào console.cloud.google.com → APIs & Services → Library → Google Drive API → Enable, đợi vài phút rồi thử lại.";
const apiDisabled = j => { const er = j && j.error; return !!er && (/has not been used in project|is disabled/i.test(er.message || "") || (er.details || []).some(d => d && d.reason === "SERVICE_DISABLED")); };
async function call(tok, method, url, body, headers){
  const r = await fetch(url.startsWith("http") ? url : API + url, { method, headers: Object.assign({ Authorization: "Bearer " + tok }, body && !headers ? { "Content-Type": "application/json" } : {}, headers || {}),
    body: body === undefined || body === null ? undefined : headers ? body : JSON.stringify(body) });
  if (method === "GET" && /alt=media/.test(url)){
    if (!r.ok) throw new HttpError(r.status === 404 ? 404 : 502, "Google Drive: không đọc được tệp (" + r.status + ")");
    return { buf: Buffer.from(await r.arrayBuffer()), mime: r.headers.get("content-type") || "application/octet-stream" };
  }
  const j = r.status === 204 ? {} : await r.json().catch(() => ({}));
  if (!r.ok && apiDisabled(j)) throw new HttpError(503, DISABLED_MSG);
  if (!r.ok){ const e = new HttpError(r.status === 404 ? 404 : r.status === 403 ? 403 : 502, "Google Drive: " + ((j.error && j.error.message) || "lỗi " + r.status)); e.gstatus = r.status; throw e; }
  return j;
}
const createFolder = (tok, name, parent) =>
  call(tok, "POST", "files?fields=id,webViewLink", { name: String(name).slice(0, 200), mimeType: FOLDER, parents: parent ? [parent] : undefined });
async function folderAlive(tok, id){
  try { const f = await call(tok, "GET", `files/${encodeURIComponent(id)}?fields=id,trashed`); return !f.trashed; } catch (e){ if (e.status === 404) return false; throw e; }
}
// Chia sẻ quyền xem (không gửi email thông báo).
async function share(tok, fileId, email){
  await call(tok, "POST", `files/${encodeURIComponent(fileId)}/permissions?sendNotificationEmail=false`, { type: "user", role: "reader", emailAddress: email });
}

// Thư mục gốc của giáo viên; tạo mới (và chia sẻ cho admin) nếu chưa có hoặc đã bị xoá.
async function ensureRoot(tok, user){
  const r = await q("SELECT root_folder_id, root_link, shared_with FROM teacher_drive WHERE user_id = $1", [user.id]);
  if (r.length && await folderAlive(tok, r[0].root_folder_id)){ await shareAdmins(tok, user, r[0]); return r[0].root_folder_id; }
  const f = await createFolder(tok, "JetBot Lab – " + (user.name || user.email));
  await q(`INSERT INTO teacher_drive (user_id, root_folder_id, root_link, shared_with) VALUES ($1, $2, $3, '')
    ON CONFLICT (user_id) DO UPDATE SET root_folder_id = EXCLUDED.root_folder_id, root_link = EXCLUDED.root_link, shared_with = '', updated_at = now()`, [user.id, f.id, f.webViewLink || null]);
  await q("UPDATE classes SET drive_folder_id = NULL, drive_link = NULL WHERE teacher_id = $1", [user.id]);
  await q("UPDATE assignments SET drive_folder_id = NULL WHERE class_id IN (SELECT id FROM classes WHERE teacher_id = $1)", [user.id]);
  await shareAdmins(tok, user, { root_folder_id: f.id, shared_with: "" });
  return f.id;
}
// Admin (ADMIN_EMAILS) được quyền xem thư mục gốc của mọi giáo viên.
async function shareAdmins(tok, user, row){
  const done = new Set(String(row.shared_with || "").split(",").filter(Boolean));
  const todo = adminEmails().filter(e => e !== String(user.email).toLowerCase() && !done.has(e));
  for (const e of todo){ try { await share(tok, row.root_folder_id, e); done.add(e); } catch (x){ /* email không có tài khoản Google: bỏ qua */ } }
  if (todo.length) await q("UPDATE teacher_drive SET shared_with = $2, updated_at = now() WHERE user_id = $1", [user.id, [...done].join(",")]);
}
async function ensureClassFolder(tok, teacher, cls){
  if (cls.drive_folder_id && await folderAlive(tok, cls.drive_folder_id)) return cls.drive_folder_id;
  const root = await ensureRoot(tok, teacher), f = await createFolder(tok, cls.name, root);
  await q("UPDATE classes SET drive_folder_id = $2, drive_link = $3 WHERE id = $1", [N(cls.id), f.id, f.webViewLink || null]);
  await q("UPDATE assignments SET drive_folder_id = NULL WHERE class_id = $1", [N(cls.id)]);
  return f.id;
}
async function ensureAssignmentFolder(tok, teacher, cls, a){
  const parent = await ensureClassFolder(tok, teacher, cls);
  const cur = (await q("SELECT drive_folder_id FROM assignments WHERE id = $1", [N(a.id)]))[0];
  if (cur && cur.drive_folder_id && await folderAlive(tok, cur.drive_folder_id)) return cur.drive_folder_id;
  const f = await createFolder(tok, [a.week_label, a.title || a.lesson_id].filter(Boolean).join(" · "), parent);
  await q("UPDATE assignments SET drive_folder_id = $2 WHERE id = $1", [N(a.id), f.id]);
  return f.id;
}
async function upload(tok, parent, name, mime, buf){
  const b = "jbl" + Date.now().toString(36) + Math.random().toString(36).slice(2);
  const meta = JSON.stringify({ name: String(name).slice(0, 200), parents: [parent] });
  const body = Buffer.concat([Buffer.from(`--${b}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${b}\r\nContent-Type: ${mime}\r\n\r\n`), buf, Buffer.from(`\r\n--${b}--`)]);
  return call(tok, "POST", "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", body, { "Content-Type": `multipart/related; boundary=${b}` });
}
const download = (tok, id) => call(tok, "GET", `files/${encodeURIComponent(id)}?alt=media`);
async function remove(tok, id){ try { await call(tok, "DELETE", `files/${encodeURIComponent(id)}`); } catch (e){ if (e.status !== 404) throw e; } }

// Tài liệu của lớp: thư mục "Tài liệu" trong thư mục lớp.
async function ensureMaterialsFolder(tok, teacher, cls){
  if (cls.materials_folder_id && await folderAlive(tok, cls.materials_folder_id)) return cls.materials_folder_id;
  const parent = await ensureClassFolder(tok, teacher, cls), f = await createFolder(tok, "Tài liệu", parent);
  await q("UPDATE classes SET materials_folder_id = $2 WHERE id = $1", [N(cls.id), f.id]);
  return f.id;
}
// Tài liệu chung (admin): thư mục "Tài liệu chung" trong thư mục gốc của admin.
async function ensurePublicFolder(tok, user){
  const root = await ensureRoot(tok, user), r = (await q("SELECT public_folder_id FROM teacher_drive WHERE user_id = $1", [user.id]))[0];
  if (r && r.public_folder_id && await folderAlive(tok, r.public_folder_id)) return r.public_folder_id;
  const f = await createFolder(tok, "Tài liệu chung", root);
  await q("UPDATE teacher_drive SET public_folder_id = $2 WHERE user_id = $1", [user.id, f.id]);
  return f.id;
}
// Thư mục con theo "nhóm" do giáo viên tự đặt tên, bên trong thư mục Tài liệu của lớp.
// ID thư mục từng nhóm được cache ở classes.material_groups (JSON: tên nhóm → id thư mục) để không tạo trùng.
async function ensureClassGroupFolder(tok, teacher, cls, name){
  const parent = await ensureMaterialsFolder(tok, teacher, cls);
  const groups = cls.material_groups || {};
  if (groups[name] && await folderAlive(tok, groups[name])) return groups[name];
  const f = await createFolder(tok, name, parent);
  groups[name] = f.id;
  await q("UPDATE classes SET material_groups = $2 WHERE id = $1", [N(cls.id), JSON.stringify(groups)]);
  return f.id;
}
// Thư mục con theo nhóm bên trong "Tài liệu chung" của admin (cache ở teacher_drive.public_material_groups).
async function ensurePublicGroupFolder(tok, user, name){
  const parent = await ensurePublicFolder(tok, user);
  const row = (await q("SELECT public_material_groups FROM teacher_drive WHERE user_id = $1", [user.id]))[0];
  const groups = (row && row.public_material_groups) || {};
  if (groups[name] && await folderAlive(tok, groups[name])) return groups[name];
  const f = await createFolder(tok, name, parent);
  groups[name] = f.id;
  await q("UPDATE teacher_drive SET public_material_groups = $2 WHERE user_id = $1", [user.id, JSON.stringify(groups)]);
  return f.id;
}
// Tải lên kiểu resumable: máy chủ mở phiên (kèm Origin của trang), trình duyệt PUT thẳng tệp lên Google,
// nên tệp lớn (mô hình AI vài chục MB) không đi qua máy chủ Vercel (giới hạn ~4.5 MB mỗi yêu cầu).
async function startResumable(tok, parent, name, mime, size, origin){
  const r = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name,size,mimeType,webViewLink", {
    method: "POST", headers: { Authorization: "Bearer " + tok, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": mime || "application/octet-stream",
      "X-Upload-Content-Length": String(size), Origin: origin },
    body: JSON.stringify({ name: String(name).slice(0, 200), parents: [parent] }) });
  const url = r.headers.get("location");
  if (!r.ok || !url){ const j = await r.json().catch(() => ({})); if (apiDisabled(j)) throw new HttpError(503, DISABLED_MSG); throw new HttpError(502, "Google Drive: không mở được phiên tải lên (" + ((j.error && j.error.message) || r.status) + ")"); }
  return url;
}
const fileInfo = (tok, id) => call(tok, "GET", `files/${encodeURIComponent(id)}?fields=id,name,size,mimeType,parents,webViewLink,trashed`);
// Ai có link đều xem / tải được (để học sinh tải về không cần quyền trên Drive của giáo viên).
const makePublic = (tok, id) => call(tok, "POST", `files/${encodeURIComponent(id)}/permissions`, { type: "anyone", role: "reader" });
const downloadUrl = id => "https://drive.google.com/uc?export=download&id=" + encodeURIComponent(id);

module.exports = { SCOPE, hasDrive, token, ensureRoot, ensureClassFolder, ensureAssignmentFolder, ensureMaterialsFolder, ensurePublicFolder,
  ensureClassGroupFolder, ensurePublicGroupFolder, upload, download, remove, startResumable, fileInfo, makePublic, downloadUrl };
