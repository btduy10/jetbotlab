const { HttpError, checkLogin, sameOrigin, sessionCookie, readJsonBody, send, handle } = require("./_lib");

module.exports = handle(async (req, res) => {
  if (req.method !== "POST") throw new HttpError(405, "Chỉ nhận POST");
  if (!sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu");
  const b = await readJsonBody(req, 4096);
  if (!checkLogin(String(b.username || ""), String(b.password || ""))){
    await new Promise(r => setTimeout(r, 700));   // làm chậm dò mật khẩu
    throw new HttpError(401, "Sai tên đăng nhập hoặc mật khẩu");
  }
  send(res, 200, { ok: true }, { "Set-Cookie": sessionCookie(req, 7) });
});
