// Lớp học: CSDL, giáo viên, lớp, học sinh, giao bài, bài làm, tiến độ, chấm điểm, Classroom, phản hồi.
// Định tuyến bằng ?a=… để gói gọn trong một function (Vercel Hobby giới hạn 12 function).
const { HttpError, readJsonBody, requireRole, query, send, handle } = require("./_lib");
const { q, migrate } = require("./_db");

const EMAIL = /^[^\s@<>"]{1,64}@[^\s@<>"]{1,190}\.[a-z]{2,24}$/i;
const ACTIONS = {};

// ---------- quản trị ----------
ACTIONS.migrate = { POST: async (req, res) => { await requireRole(req, ["admin"]); send(res, 200, { ok: true, statements: await migrate() }); } };

ACTIONS.teachers = {
  GET: async (req, res) => {
    await requireRole(req, ["admin"]);
    const rows = await q("SELECT id, email, name, last_login FROM users WHERE role = 'teacher' ORDER BY email");
    send(res, 200, { teachers: rows });
  },
  POST: async (req, res) => {
    await requireRole(req, ["admin"]);
    const b = await readJsonBody(req, 4096), email = String(b.email || "").trim().toLowerCase();
    if (!EMAIL.test(email)) throw new HttpError(400, "Email không hợp lệ");
    await q(`INSERT INTO users (email, role) VALUES ($1, 'teacher') ON CONFLICT (email) DO UPDATE SET role = 'teacher'`, [email]);
    send(res, 200, { ok: true });
  },
  DELETE: async (req, res) => {
    await requireRole(req, ["admin"]);
    const email = String(query(req).get("email") || "").toLowerCase();
    await q("UPDATE users SET role = 'student' WHERE email = $1", [email]);
    send(res, 200, { ok: true });
  }
};

module.exports = handle(async (req, res) => {
  const a = query(req).get("a"), h = ACTIONS[a] && ACTIONS[a][req.method];
  if (!h) throw new HttpError(404, "Không có");
  await h(req, res);
});
module.exports.ACTIONS = ACTIONS;
