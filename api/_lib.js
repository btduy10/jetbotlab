// Dùng chung cho các API (tệp bắt đầu bằng "_" không thành endpoint trên Vercel).
// Nội dung (bài học, sa bàn, ảnh): repo GitHub dữ liệu (GITHUB_TOKEN + GITHUB_DATA_REPO), hoặc thư mục JBL_DATA_DIR khi chạy thử.
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const env = k => (process.env[k] || "").trim();
const REPO = () => env("GITHUB_DATA_REPO") || "btduy10/jetbotlab-data";
const BRANCH = () => env("GITHUB_DATA_BRANCH") || "main";
const LOCAL = () => env("JBL_DATA_DIR");

class HttpError extends Error { constructor(status, msg){ super(msg); this.status = status; } }

async function gh(method, p, body, accept){
  const token = env("GITHUB_TOKEN");
  if (!token) throw new HttpError(500, "Server chưa cấu hình GITHUB_TOKEN");
  const url = `https://api.github.com/repos/${REPO()}/contents/${p.split("/").map(encodeURIComponent).join("/")}` + (method === "GET" ? `?ref=${encodeURIComponent(BRANCH())}` : "");
  return fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, Accept: accept || "application/vnd.github+json", "X-GitHub-Api-Version": "2022-11-28", "User-Agent": "jetbotlab" },
    body: body ? JSON.stringify(body) : undefined
  });
}

// Đọc tệp: { data: Buffer, sha } hoặc null nếu chưa có.
async function readFile(p){
  if (LOCAL()){
    const f = path.join(LOCAL(), p);
    if (!fs.existsSync(f)) return null;
    const data = fs.readFileSync(f);
    return { data, sha: crypto.createHash("sha1").update(data).digest("hex") };
  }
  const meta = await gh("GET", p);
  if (meta.status === 404) return null;
  if (!meta.ok) throw new HttpError(502, `GitHub ${meta.status}`);
  const j = await meta.json();
  if (j.content && j.encoding === "base64") return { data: Buffer.from(j.content, "base64"), sha: j.sha };
  const raw = await gh("GET", p, null, "application/vnd.github.raw");   // tệp > 1 MB
  if (!raw.ok) throw new HttpError(502, `GitHub ${raw.status}`);
  return { data: Buffer.from(await raw.arrayBuffer()), sha: j.sha };
}

// Ghi tệp. sha: bản đang sửa (null = tạo mới). Trả về sha mới. Xung đột → 409.
async function writeFile(p, data, message, sha){
  if (LOCAL()){
    const f = path.join(LOCAL(), p), cur = fs.existsSync(f) ? crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex") : null;
    if ((sha || null) !== cur) throw new HttpError(409, "Dữ liệu đã bị người khác sửa, hãy tải lại trang");
    fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, data);
    return crypto.createHash("sha1").update(data).digest("hex");
  }
  const r = await gh("PUT", p, Object.assign({ message, content: data.toString("base64"), branch: BRANCH() }, sha ? { sha } : {}));
  if (r.status === 409 || r.status === 422) throw new HttpError(409, "Dữ liệu đã bị người khác sửa, hãy tải lại trang");
  if (!r.ok) throw new HttpError(502, `GitHub ${r.status}`);
  return (await r.json()).content.sha;
}

// ---------- phiên đăng nhập: cookie "dữ-liệu.chữ-ký", ký HMAC bằng AUTH_SECRET ----------
// Dữ liệu: { u: id người dùng | "pw" (admin mật khẩu), x: hạn dùng }. Vai trò luôn tính lại khi dùng (currentUser).
const COOKIE = "jbl_s";
const secret = () => { const s = env("AUTH_SECRET"); if (s.length < 16) throw new HttpError(500, "Server chưa cấu hình AUTH_SECRET (≥ 16 ký tự)"); return s; };
const sign = v => crypto.createHmac("sha256", secret()).update(v).digest("base64url");
const same = (a, b) => { const x = crypto.createHash("sha256").update(String(a)).digest(), y = crypto.createHash("sha256").update(String(b)).digest(); return crypto.timingSafeEqual(x, y); };
const isLocal = req => /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(String(req.headers.host || ""));

function cookies(req){
  const o = {};
  for (const part of String(req.headers.cookie || "").split(";")){ const i = part.indexOf("="); if (i > 0) o[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim()); }
  return o;
}
// Giá trị ký: đọc lại được và không giả mạo được (dùng cho phiên và trạng thái OAuth).
function sealed(obj){ const v = Buffer.from(JSON.stringify(obj)).toString("base64url"); return v + "." + sign(v); }
function unseal(s){
  if (!s || typeof s !== "string") return null;
  const i = s.lastIndexOf("."); if (i < 1) return null;
  const v = s.slice(0, i), sig = s.slice(i + 1);
  try { if (!same(sig, sign(v))) return null; const o = JSON.parse(Buffer.from(v, "base64url").toString("utf8")); return o && typeof o.x === "number" && o.x > Date.now() ? o : null; }
  catch (e) { return null; }
}
function cookieStr(req, name, value, maxAgeSec, sameSite = "Strict"){
  return `${name}=${value}; Path=/; HttpOnly; SameSite=${sameSite}; Max-Age=${Math.max(0, Math.floor(maxAgeSec))}${isLocal(req) ? "" : "; Secure"}`;
}
const session = req => unseal(cookies(req)[COOKIE]);
const sessionCookie = (req, uid, days) => cookieStr(req, COOKIE, sealed({ u: uid, x: Date.now() + days*864e5 }), days*86400);
const clearCookie = (req, name = COOKIE) => cookieStr(req, name, "", 0);

const adminEmails = () => env("ADMIN_EMAILS").toLowerCase().split(/[\s,;]+/).filter(Boolean);
const effectiveRole = (email, dbRole) => adminEmails().includes(String(email).toLowerCase()) ? "admin" : dbRole === "teacher" ? "teacher" : "student";

// Người dùng hiện tại { id, email, name, role } hoặc null. Vai trò đọc lại từ CSDL để thu hồi quyền có hiệu lực ngay.
async function currentUser(req){
  const s = session(req); if (!s) return null;
  if (s.u === "pw") return { id: null, email: "", name: "Admin", role: "admin", password: true };
  if (!Number.isInteger(s.u)) return null;
  const { q } = require("./_db");
  const rows = await q("SELECT id, email, name, role FROM users WHERE id = $1", [s.u]);
  if (!rows.length) return null;
  const u = rows[0];
  return { id: Number(u.id), email: u.email, name: u.name, role: effectiveRole(u.email, u.role) };
}
function checkLogin(user, pass){
  const U = env("ADMIN_USERNAME"), P = env("ADMIN_PASSWORD");
  if (!U || P.length < 8) throw new HttpError(500, "Server chưa cấu hình ADMIN_USERNAME / ADMIN_PASSWORD (mật khẩu ≥ 8 ký tự)");
  return same(user, U) & same(pass, P);
}

// Chặn CSRF: yêu cầu ghi phải đến từ chính trang này.
function sameOrigin(req){
  const o = req.headers.origin; if (!o) return false;
  try { return new URL(o).host === req.headers.host; } catch (e) { return false; }
}
// roles: danh sách vai trò được phép. Trả về người dùng.
async function requireRole(req, roles){
  const u = await currentUser(req);
  if (!u) throw new HttpError(401, "Cần đăng nhập");
  if (!roles.includes(u.role)) throw new HttpError(403, "Tài khoản không có quyền này");
  if (req.method !== "GET" && !sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu");
  return u;
}

async function readJsonBody(req, limit){
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) return req.body;
  let raw = typeof req.body === "string" ? req.body : Buffer.isBuffer(req.body) ? req.body.toString("utf8") : null;
  if (raw === null){
    raw = await new Promise((res, rej) => { let s = "", n = 0; req.on("data", c => { n += c.length; if (n > limit) { rej(new HttpError(413, "Dữ liệu quá lớn")); req.destroy(); } else s += c; }); req.on("end", () => res(s)); req.on("error", rej); });
  }
  if (raw.length > limit) throw new HttpError(413, "Dữ liệu quá lớn");
  try { return JSON.parse(raw || "{}"); } catch (e) { throw new HttpError(400, "JSON không hợp lệ"); }
}
const query = req => new URL(req.url, "http://x").searchParams;

function send(res, status, obj, headers){
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  for (const k in headers || {}) res.setHeader(k, headers[k]);
  res.end(JSON.stringify(obj));
}
function redirect(res, location, headers){
  res.statusCode = 302; res.setHeader("Location", location); res.setHeader("Cache-Control", "no-store");
  for (const k in headers || {}) res.setHeader(k, headers[k]);
  res.end();
}
const handle = fn => async (req, res) => {
  try { await fn(req, res); }
  catch (e) { const st = e.status || 500; if (st >= 500) console.error(e); send(res, st, { error: e.status ? e.message : "Lỗi máy chủ" }); }
};

module.exports = { HttpError, env, readFile, writeFile, sealed, unseal, cookies, cookieStr, session, sessionCookie, clearCookie, isLocal,
  adminEmails, effectiveRole, currentUser, checkLogin, sameOrigin, requireRole, readJsonBody, query, send, redirect, handle };
