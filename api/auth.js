// Đăng nhập: Google OAuth (mọi người), mật khẩu admin (dự phòng), phiên hiện tại, đăng xuất.
// /api/auth?a=google&next=/…  → Google → /api/auth?a=callback
const crypto = require("crypto");
const { HttpError, env, sealed, unseal, cookies, cookieStr, sessionCookie, clearCookie, isLocal, effectiveRole, currentUser,
  checkLogin, sameOrigin, readJsonBody, query, send, redirect, handle } = require("./_lib");
const { q } = require("./_db");

const OA = "jbl_oa";
const SCOPE_BASIC = "openid email profile";
// Quyền Classroom chỉ xin khi giáo viên bấm "Kết nối Classroom".
const SCOPE_CLASSROOM = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.rosters.readonly",
  "https://www.googleapis.com/auth/classroom.profile.emails",
  "https://www.googleapis.com/auth/classroom.coursework.students"
].join(" ");

const origin = req => `${isLocal(req) ? "http" : "https"}://${req.headers.host}`;
const redirectUri = req => origin(req) + "/api/auth?a=callback";
const safeNext = n => typeof n === "string" && /^\/(?!\/)[\w\-./?=&%#]*$/.test(n) && n.length < 300 ? n : "/";
const b64u = buf => Buffer.from(buf).toString("base64url");

function clientConf(){
  const id = env("GOOGLE_CLIENT_ID"), secret = env("GOOGLE_CLIENT_SECRET");
  if (!id || !secret) throw new HttpError(500, "Server chưa cấu hình GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET");
  return { id, secret };
}

// Mã hoá refresh token của giáo viên trước khi lưu (AES-256-GCM, khoá từ TOKEN_ENC_KEY).
function encKey(){ const k = env("TOKEN_ENC_KEY"); if (k.length < 16) throw new HttpError(500, "Server chưa cấu hình TOKEN_ENC_KEY (≥ 16 ký tự)"); return crypto.createHash("sha256").update(k).digest(); }
function encrypt(text){ const iv = crypto.randomBytes(12), c = crypto.createCipheriv("aes-256-gcm", encKey(), iv); const ct = Buffer.concat([c.update(text, "utf8"), c.final()]); return [b64u(iv), b64u(c.getAuthTag()), b64u(ct)].join("."); }

async function upsertUser({ email, name, sub }){
  email = String(email).toLowerCase().trim();
  let rows = sub ? await q("SELECT id FROM users WHERE google_sub = $1", [sub]) : [];
  if (rows.length) rows = await q("UPDATE users SET email = $2, name = $3, last_login = now() WHERE id = $1 RETURNING id, email, name, role", [rows[0].id, email, name]);
  else rows = await q(`INSERT INTO users (email, name, google_sub, last_login) VALUES ($1, $2, $3, now())
    ON CONFLICT (email) DO UPDATE SET name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE users.name END,
      google_sub = COALESCE(users.google_sub, EXCLUDED.google_sub), last_login = now()
    RETURNING id, email, name, role`, [email, name, sub || null]);
  const u = rows[0];
  // học sinh được thêm vào lớp theo email trước khi đăng nhập: nối tài khoản
  await q("UPDATE class_members SET user_id = $1, name = CASE WHEN name = '' THEN $3 ELSE name END WHERE email = $2 AND user_id IS NULL", [u.id, email, name]);
  return u;
}

module.exports = handle(async (req, res) => {
  const p = query(req), a = p.get("a");

  if (a === "me" && req.method === "GET"){
    let user = null;
    try { user = await currentUser(req); } catch (e) { if (e.status !== 500) throw e; }
    let classroom = false;
    if (user && user.id && (user.role === "teacher" || user.role === "admin")){
      try { classroom = (await q("SELECT 1 FROM teacher_tokens WHERE user_id = $1", [user.id])).length > 0; } catch (e) {}
    }
    return send(res, 200, { user: user && { id: user.id, email: user.email, name: user.name, role: user.role, password: !!user.password, classroom },
      google: !!(env("GOOGLE_CLIENT_ID") && env("GOOGLE_CLIENT_SECRET")) });
  }

  if (a === "google" && req.method === "GET"){
    const { id } = clientConf(), state = b64u(crypto.randomBytes(18)), verifier = b64u(crypto.randomBytes(32));
    const classroom = p.get("classroom") === "1";
    const params = new URLSearchParams({
      client_id: id, redirect_uri: redirectUri(req), response_type: "code", state,
      scope: classroom ? SCOPE_BASIC + " " + SCOPE_CLASSROOM : SCOPE_BASIC,
      code_challenge: b64u(crypto.createHash("sha256").update(verifier).digest()), code_challenge_method: "S256",
      prompt: classroom ? "consent" : "select_account"
    });
    if (classroom){ params.set("access_type", "offline"); params.set("include_granted_scopes", "true"); }
    // Lax: cookie này phải đi kèm lần Google chuyển hướng quay về
    const st = sealed({ s: state, v: verifier, n: safeNext(p.get("next")), c: classroom, x: Date.now() + 10*60e3 });
    return redirect(res, "https://accounts.google.com/o/oauth2/v2/auth?" + params, { "Set-Cookie": cookieStr(req, OA, st, 600, "Lax") });
  }

  if (a === "callback" && req.method === "GET"){
    const st = unseal(cookies(req)[OA]), back = st ? st.n : "/";
    const fail = m => redirect(res, back + (back.includes("?") ? "&" : "?") + "login_error=" + encodeURIComponent(m), { "Set-Cookie": clearCookie(req, OA) });
    if (p.get("error")) return fail("Đã huỷ đăng nhập");
    if (!st || !p.get("state") || p.get("state") !== st.s) return fail("Phiên đăng nhập hết hạn, hãy thử lại");
    const { id, secret } = clientConf();
    const tr = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ code: p.get("code") || "", client_id: id, client_secret: secret, redirect_uri: redirectUri(req), grant_type: "authorization_code", code_verifier: st.v }) });
    const tok = await tr.json().catch(() => ({}));
    if (!tr.ok || !tok.id_token) return fail("Google từ chối đăng nhập");
    // id_token nhận trực tiếp từ Google qua HTTPS: kiểm nơi phát hành, đối tượng, hạn dùng và email đã xác minh
    let c; try { c = JSON.parse(Buffer.from(tok.id_token.split(".")[1], "base64url").toString("utf8")); } catch (e) { return fail("Dữ liệu đăng nhập không hợp lệ"); }
    if (!["https://accounts.google.com", "accounts.google.com"].includes(c.iss) || c.aud !== id || !(c.exp*1000 > Date.now()) || !c.email || c.email_verified !== true)
      return fail("Tài khoản Google chưa xác minh email");
    const u = await upsertUser({ email: c.email, name: String(c.name || "").slice(0, 120), sub: String(c.sub) });
    if (st.c){
      const role = effectiveRole(u.email, u.role);
      if (role !== "teacher" && role !== "admin") return fail("Chỉ giáo viên mới kết nối Google Classroom");
      if (tok.refresh_token) await q(`INSERT INTO teacher_tokens (user_id, refresh_enc, scopes, updated_at) VALUES ($1, $2, $3, now())
        ON CONFLICT (user_id) DO UPDATE SET refresh_enc = EXCLUDED.refresh_enc, scopes = EXCLUDED.scopes, updated_at = now()`, [u.id, encrypt(tok.refresh_token), String(tok.scope || "")]);
    }
    return redirect(res, st.n, { "Set-Cookie": [sessionCookie(req, Number(u.id), 30), clearCookie(req, OA)] });
  }

  if (a === "login" && req.method === "POST"){
    if (!sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu");
    const b = await readJsonBody(req, 4096);
    if (!checkLogin(String(b.username || ""), String(b.password || ""))){ await new Promise(r => setTimeout(r, 700)); throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu"); }
    return send(res, 200, { ok: true }, { "Set-Cookie": cookieStr(req, "jbl_s", sealed({ u: "pw", x: Date.now() + 7*864e5 }), 7*86400) });
  }

  if (a === "logout" && req.method === "POST"){
    if (!sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu");
    return send(res, 200, { ok: true }, { "Set-Cookie": clearCookie(req) });
  }

  // Đăng nhập giả lập để thử ở máy (không bao giờ chạy trên Vercel)
  if (a === "dev" && req.method === "POST"){
    if (env("JBL_DEV_LOGIN") !== "1" || !isLocal(req) || process.env.VERCEL) throw new HttpError(404, "Không có");
    const b = await readJsonBody(req, 4096);
    const u = await upsertUser({ email: String(b.email || ""), name: String(b.name || ""), sub: null });
    if (b.role === "teacher" || b.role === "student") await q("UPDATE users SET role = $2 WHERE id = $1", [u.id, b.role]);
    return send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req, Number(u.id), 1) });
  }

  throw new HttpError(404, "Không có");
});
