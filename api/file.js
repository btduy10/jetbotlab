// Ảnh bài làm của học sinh, lưu trên Google Drive của giáo viên chủ lớp (quyền drive.file).
//   POST   /api/file?a=upload  { assignment, name, data: base64 }  – học sinh thêm ảnh (≤ 3.5 MB, trình duyệt đã thu nhỏ)
//   GET    /api/file?a=view&id=…                                   – xem ảnh (chính em, giáo viên lớp, admin)
//   DELETE /api/file?id=…                                          – xoá ảnh (chính em trước khi được trả bài, hoặc giáo viên)
// Ảnh đi qua máy chủ nên CSP img-src 'self' không phải nới, và người xem không cần quyền trên Drive.
const { HttpError, readJsonBody, currentUser, sameOrigin, query, send, handle } = require("./_lib");
const { q } = require("./_db");
const D = require("./_drive");
const { helpers: H } = require("./class");

const MAX = 3.5 * 1024 * 1024, PER_SUB = 10;
const MIME = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
function sniff(b){
  if (b.length > 8 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return "webp";
  if (b.length > 6 && /^GIF8[79]a$/.test(b.toString("latin1", 0, 6))) return "gif";
  return null;
}
async function user(req){
  const u = await currentUser(req); if (!u || !u.id) throw new HttpError(401, "Cần đăng nhập Google");
  if (req.method !== "GET" && !sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu");
  return u;
}
// Ảnh + ai được xem / xoá. Trả về hàng ảnh kèm teacher_id, student_id, returned.
async function attachment(u, id){
  const r = (await q(`SELECT t.id, t.drive_file_id, t.owner_id, t.mime, t.name, s.user_id AS student_id, c.teacher_id, g.returned_at
    FROM attachments t JOIN submissions s ON s.id = t.submission_id JOIN assignments a ON a.id = s.assignment_id JOIN classes c ON c.id = a.class_id
    LEFT JOIN grades g ON g.submission_id = s.id WHERE t.id = $1`, [id]))[0];
  if (!r) throw new HttpError(404, "Không có ảnh này");
  const mine = H.N(r.student_id) === u.id, teacher = u.role === "admin" || H.N(r.teacher_id) === u.id;
  if (!mine && !teacher) throw new HttpError(404, "Không có ảnh này");
  return { ...r, mine, teacher };
}

module.exports = handle(async (req, res) => {
  const p = query(req), a = p.get("a");

  if (req.method === "POST" && a === "upload"){
    const u = await user(req), b = await readJsonBody(req, 4.8e6), aid = H.intId(b.assignment), asg = await H.myAssignment(u, aid);
    const data = Buffer.from(String(b.data || ""), "base64");
    if (!data.length) throw new HttpError(400, "Thiếu dữ liệu ảnh");
    if (data.length > MAX) throw new HttpError(413, "Ảnh quá lớn (tối đa 3.5 MB)");
    const ext = sniff(data); if (!ext) throw new HttpError(415, "Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF");
    const s = await H.ensureSubmission(u, aid), sid = H.N(s.id);
    if (H.N((await q("SELECT count(*) AS n FROM attachments WHERE submission_id = $1", [sid]))[0].n) >= PER_SUB) throw new HttpError(400, `Tối đa ${PER_SUB} ảnh mỗi bài`);
    const teacherId = H.N(asg.teacher_id), tu = (await q("SELECT id, email, name FROM users WHERE id = $1", [teacherId]))[0];
    if (!(await D.hasDrive(teacherId))) throw new HttpError(409, "Giáo viên chưa bật lưu ảnh (chưa kết nối Google Drive). Em vẫn nộp code bình thường.");
    const tok = await D.token(teacherId);
    const cls = (await q("SELECT id, name, drive_folder_id FROM classes WHERE id = $1", [H.N(asg.class_id)]))[0];
    const folder = await D.ensureAssignmentFolder(tok, { id: teacherId, email: tu.email, name: tu.name }, cls, asg);
    const stamp = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" }).slice(0, 16).replace(":", "h");
    const name = `${(u.name || u.email).replace(/[\\/:*?"<>|]+/g, " ").trim()} – ${stamp}.${ext}`;
    const f = await D.upload(tok, folder, name, MIME[ext], data);
    const r = await q(`INSERT INTO attachments (submission_id, owner_id, drive_file_id, link, name, mime, size) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, size, link, created_at`, [sid, teacherId, f.id, f.webViewLink || null, name, MIME[ext], data.length]);
    await q("UPDATE submissions SET last_at = now() WHERE id = $1", [sid]);
    return send(res, 200, { ok: true, attachment: { ...r[0], id: H.N(r[0].id) } });
  }

  if (req.method === "GET" && a === "view"){
    const u = await user(req), t = await attachment(u, H.intId(p.get("id")));
    const f = await D.download(await D.token(H.N(t.owner_id)), t.drive_file_id);
    const ext = sniff(f.buf); if (!ext) throw new HttpError(415, "Tệp không phải ảnh");
    res.statusCode = 200;
    res.setHeader("Content-Type", MIME[ext]);
    res.setHeader("Cache-Control", "private, max-age=3600");
    res.setHeader("Content-Disposition", "inline");
    return res.end(f.buf);
  }

  if (req.method === "DELETE"){
    const u = await user(req), t = await attachment(u, H.intId(p.get("id")));
    if (!t.teacher && t.returned_at) throw new HttpError(403, "Bài đã được trả, không xoá ảnh được nữa");
    try { await D.remove(await D.token(H.N(t.owner_id)), t.drive_file_id); } catch (e){ if (e.status !== 409) throw e; }
    await q("DELETE FROM attachments WHERE id = $1", [H.N(t.id)]);
    return send(res, 200, { ok: true });
  }
  throw new HttpError(405, "Phương thức không hỗ trợ");
});
