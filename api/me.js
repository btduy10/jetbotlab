const { isAdmin, send, handle } = require("./_lib");

module.exports = handle(async (req, res) => {
  let admin = false;
  try { admin = isAdmin(req); } catch (e) { admin = false; }
  send(res, 200, { admin });
});
