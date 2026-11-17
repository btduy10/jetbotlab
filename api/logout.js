const { HttpError, clearCookie, send, handle } = require("./_lib");

module.exports = handle(async (req, res) => {
  if (req.method !== "POST") throw new HttpError(405, "Chỉ nhận POST");
  send(res, 200, { ok: true }, { "Set-Cookie": clearCookie(req) });
});
