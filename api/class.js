// Lớp học: CSDL, giáo viên, lớp, học sinh, giao bài, bài làm, tiến độ, chấm điểm, Classroom, phản hồi.
// Định tuyến bằng ?a=… để gói gọn trong một function (Vercel Hobby giới hạn 12 function).
const { HttpError, env, decrypt, siteOrigin, readJsonBody, requireRole, currentUser, sameOrigin, query, send, handle } = require("./_lib");
const { q, migrate } = require("./_db");

const EMAIL = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,190}\.[a-z]{2,24}$/i;
const LESSON_ID = /^(l\d{1,2}|c-[a-z0-9][a-z0-9-]{0,39})$/;
const STAFF = ["admin", "teacher"];
const ACTIONS = {};
const N = v => v === null || v === undefined ? null : Number(v);
const str = (v, max) => String(v === null || v === undefined ? "" : v).trim().slice(0, max);
const intId = v => { const n = Number(v); if (!Number.isSafeInteger(n) || n <= 0) throw new HttpError(400, "Mã không hợp lệ"); return n; };
const date = v => { if (v === null || v === undefined || v === "") return null; const d = new Date(v); if (isNaN(d)) throw new HttpError(400, "Ngày giờ không hợp lệ"); return d.toISOString(); };

// Giáo viên chỉ thao tác trên lớp của mình; admin được mọi lớp.
async function ownClass(u, classId){
  const rows = await q("SELECT id, teacher_id, name, gc_course_id, gc_course_name FROM classes WHERE id = $1", [classId]);
  if (!rows.length) throw new HttpError(404, "Không có lớp này");
  if (u.role !== "admin" && N(rows[0].teacher_id) !== u.id) throw new HttpError(403, "Đây không phải lớp của bạn");
  return rows[0];
}
async function ownAssignment(u, id){
  const rows = await q("SELECT id, class_id FROM assignments WHERE id = $1", [id]);
  if (!rows.length) throw new HttpError(404, "Không có bài được giao này");
  await ownClass(u, N(rows[0].class_id)); return rows[0];
}
// Học sinh chỉ mở được bài giao cho lớp mình (và đã tới ngày mở).
async function myAssignment(u, id){
  const rows = await q(`SELECT a.id, a.lesson_id, a.title, a.week_label, a.period_label, a.due_at, c.name AS class_name
    FROM assignments a JOIN class_members m ON m.class_id = a.class_id JOIN classes c ON c.id = a.class_id
    WHERE a.id = $1 AND m.user_id = $2 AND NOT c.archived AND (a.open_at IS NULL OR a.open_at <= now())`, [id, u.id]);
  if (!rows.length) throw new HttpError(404, "Không tìm thấy bài được giao (hoặc chưa tới ngày mở)");
  return rows[0];
}
async function needUser(req){ const u = await currentUser(req); if (!u || !u.id) throw new HttpError(401, "Cần đăng nhập Google"); if (req.method !== "GET" && !sameOrigin(req)) throw new HttpError(403, "Sai nguồn yêu cầu"); return u; }
async function needTeacher(req){ const u = await requireRole(req, STAFF); if (!u.id) throw new HttpError(400, "Hãy đăng nhập bằng Google (không dùng mật khẩu admin) để quản lý lớp"); return u; }

// Notebook học sinh: [loại, mã, null, metadata khoá?], tối đa 300 ô và ~400 KB.
function cleanNotebook(nb){
  if (!Array.isArray(nb) || nb.length > 300) throw new HttpError(400, "Notebook không hợp lệ");
  const out = nb.map(c => {
    if (!Array.isArray(c) || (c[0] !== "code" && c[0] !== "md")) throw new HttpError(400, "Ô không hợp lệ");
    const src = String(c[1] === null || c[1] === undefined ? "" : c[1]).slice(0, 100000), m = c[3] && typeof c[3] === "object" ? c[3] : null;
    return m && (m.editable === false || m.deletable === false) ? [c[0], src, null, { editable: m.editable === false ? false : undefined, deletable: m.deletable === false ? false : undefined }] : [c[0], src];
  });
  if (JSON.stringify(out).length > 400000) throw new HttpError(413, "Notebook quá lớn");
  return out;
}

// ---------- quản trị ----------
ACTIONS.migrate = { POST: async (req, res) => { await requireRole(req, ["admin"]); send(res, 200, { ok: true, statements: await migrate() }); } };

ACTIONS.teachers = {
  GET: async (req, res) => {
    await requireRole(req, ["admin"]);
    send(res, 200, { teachers: (await q("SELECT id, email, name, last_login FROM users WHERE role = 'teacher' ORDER BY email")).map(r => ({ ...r, id: N(r.id) })) });
  },
  POST: async (req, res) => {
    await requireRole(req, ["admin"]);
    const b = await readJsonBody(req, 4096), email = str(b.email, 254).toLowerCase();
    if (!EMAIL.test(email)) throw new HttpError(400, "Email không hợp lệ");
    await q(`INSERT INTO users (email, role) VALUES ($1, 'teacher') ON CONFLICT (email) DO UPDATE SET role = 'teacher'`, [email]);
    send(res, 200, { ok: true });
  },
  DELETE: async (req, res) => {
    await requireRole(req, ["admin"]);
    await q("UPDATE users SET role = 'student' WHERE email = $1", [str(query(req).get("email"), 254).toLowerCase()]);
    send(res, 200, { ok: true });
  }
};

// ---------- lớp ----------
ACTIONS.classes = {
  GET: async (req, res) => {
    const u = await needTeacher(req);
    const rows = await q(`SELECT c.id, c.name, c.note, c.gc_course_id, c.gc_course_name, c.archived, c.created_at, u.email AS teacher_email,
        (SELECT count(*) FROM class_members m WHERE m.class_id = c.id) AS members,
        (SELECT count(*) FROM assignments a WHERE a.class_id = c.id) AS assignments
      FROM classes c JOIN users u ON u.id = c.teacher_id
      WHERE ($1::bigint IS NULL OR c.teacher_id = $1) ORDER BY c.archived, c.created_at DESC`, [u.role === "admin" ? null : u.id]);
    send(res, 200, { classes: rows.map(r => ({ ...r, id: N(r.id), members: N(r.members), assignments: N(r.assignments), mine: r.teacher_email === u.email })) });
  },
  POST: async (req, res) => {
    const u = await needTeacher(req), b = await readJsonBody(req, 8192), name = str(b.name, 120);
    if (!name) throw new HttpError(400, "Hãy nhập tên lớp");
    const r = await q("INSERT INTO classes (teacher_id, name, note) VALUES ($1, $2, $3) RETURNING id", [u.id, name, str(b.note, 500)]);
    send(res, 200, { ok: true, id: N(r[0].id) });
  },
  DELETE: async (req, res) => {
    const u = await needTeacher(req), id = intId(query(req).get("id"));
    await ownClass(u, id); await q("DELETE FROM classes WHERE id = $1", [id]); send(res, 200, { ok: true });
  }
};
ACTIONS.class_edit = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 8192), id = intId(b.id); await ownClass(u, id);
  const name = str(b.name, 120); if (!name) throw new HttpError(400, "Hãy nhập tên lớp");
  await q("UPDATE classes SET name = $2, note = $3, archived = $4 WHERE id = $1", [id, name, str(b.note, 500), b.archived === true]);
  send(res, 200, { ok: true });
} };

// ---------- học sinh trong lớp ----------
// Mỗi dòng một học sinh: "email", "Tên <email>", "email, Tên", "Tên<TAB>email"… (chép từ Excel được)
function parseMembers(text){
  const out = new Map();
  for (const line of String(text || "").split(/\r?\n/).slice(0, 400)){
    const m = line.match(/[^\s<>"',;:()\[\]]+@[^\s<>"',;:()\[\]]+\.[a-z]{2,24}/i); if (!m) continue;
    const email = m[0].toLowerCase(); if (!EMAIL.test(email)) continue;
    const name = line.replace(m[0], "").replace(/[<>"\[\]()\t,;]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
    out.set(email, name);
  }
  return [...out].map(([email, name]) => ({ email, name }));
}
ACTIONS.members = {
  GET: async (req, res) => {
    const u = await needTeacher(req), id = intId(query(req).get("class")); await ownClass(u, id);
    const rows = await q(`SELECT m.email, m.name, m.group_name, m.user_id, u.name AS account_name, u.last_login
      FROM class_members m LEFT JOIN users u ON u.id = m.user_id WHERE m.class_id = $1 ORDER BY m.group_name, m.name, m.email`, [id]);
    send(res, 200, { members: rows.map(r => ({ email: r.email, name: r.name || r.account_name || "", group: r.group_name, joined: r.user_id !== null, last_login: r.last_login })) });
  },
  POST: async (req, res) => {
    const u = await needTeacher(req), b = await readJsonBody(req, 200000), id = intId(b.class); await ownClass(u, id);
    const list = parseMembers(b.text);
    if (!list.length) throw new HttpError(400, "Không tìm thấy email nào");
    for (const m of list){
      await q(`INSERT INTO class_members (class_id, email, name, user_id) VALUES ($1, $2, $3, (SELECT id FROM users WHERE email = $2))
        ON CONFLICT (class_id, email) DO UPDATE SET name = CASE WHEN EXCLUDED.name <> '' THEN EXCLUDED.name ELSE class_members.name END`, [id, m.email, m.name]);
    }
    send(res, 200, { ok: true, added: list.length });
  },
  DELETE: async (req, res) => {
    const u = await needTeacher(req), p = query(req), id = intId(p.get("class")); await ownClass(u, id);
    await q("DELETE FROM class_members WHERE class_id = $1 AND email = $2", [id, str(p.get("email"), 254).toLowerCase()]);
    send(res, 200, { ok: true });
  }
};
ACTIONS.member_edit = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 4096), id = intId(b.class); await ownClass(u, id);
  await q("UPDATE class_members SET name = $3, group_name = $4 WHERE class_id = $1 AND email = $2", [id, str(b.email, 254).toLowerCase(), str(b.name, 120), str(b.group, 40)]);
  send(res, 200, { ok: true });
} };

// ---------- giao bài ----------
function assignmentFields(b){
  const lesson = str(b.lesson, 60); if (!LESSON_ID.test(lesson)) throw new HttpError(400, "Bài học không hợp lệ");
  const open = date(b.open_at), due = date(b.due_at);
  if (open && due && due < open) throw new HttpError(400, "Hạn nộp phải sau ngày mở");
  return [lesson, str(b.title, 160), str(b.week, 40), str(b.period, 40), open, due];
}
ACTIONS.assignments = {
  GET: async (req, res) => {
    const u = await needTeacher(req), id = intId(query(req).get("class")); await ownClass(u, id);
    const rows = await q(`SELECT a.id, a.lesson_id, a.title, a.week_label, a.period_label, a.open_at, a.due_at, a.gc_coursework_id, a.gc_topic, a.created_at,
        (SELECT count(*) FROM submissions s WHERE s.assignment_id = a.id AND s.status = 'submitted') AS submitted,
        (SELECT count(*) FROM submissions s WHERE s.assignment_id = a.id AND s.completed) AS completed
      FROM assignments a WHERE a.class_id = $1 ORDER BY a.week_label, a.period_label, a.created_at`, [id]);
    send(res, 200, { assignments: rows.map(r => ({ ...r, id: N(r.id), submitted: N(r.submitted), completed: N(r.completed) })) });
  },
  POST: async (req, res) => {
    const u = await needTeacher(req), b = await readJsonBody(req, 8192), id = intId(b.class); await ownClass(u, id);
    const r = await q(`INSERT INTO assignments (class_id, lesson_id, title, week_label, period_label, open_at, due_at, gc_topic) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
      [id, ...assignmentFields(b), str(b.topic, 100) || null]);
    send(res, 200, { ok: true, id: N(r[0].id) });
  },
  DELETE: async (req, res) => {
    const u = await needTeacher(req), id = intId(query(req).get("id")); await ownAssignment(u, id);
    await q("DELETE FROM assignments WHERE id = $1", [id]); send(res, 200, { ok: true });
  }
};
ACTIONS.assignment_edit = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 8192), id = intId(b.id); await ownAssignment(u, id);
  await q("UPDATE assignments SET lesson_id = $2, title = $3, week_label = $4, period_label = $5, open_at = $6, due_at = $7 WHERE id = $1", [id, ...assignmentFields(b)]);
  send(res, 200, { ok: true });
} };

// ---------- phía học sinh ----------
ACTIONS.my = { GET: async (req, res) => {
  const u = await needUser(req);
  const rows = await q(`SELECT a.id, a.lesson_id, a.title, a.week_label, a.period_label, a.open_at, a.due_at, c.name AS class_name,
      s.status, s.completed, s.runs_count, s.submitted_at, s.last_at, g.total, g.comment
    FROM class_members m JOIN classes c ON c.id = m.class_id AND NOT c.archived JOIN assignments a ON a.class_id = c.id
    LEFT JOIN submissions s ON s.assignment_id = a.id AND s.user_id = $1 LEFT JOIN grades g ON g.submission_id = s.id
    WHERE m.user_id = $1 AND (a.open_at IS NULL OR a.open_at <= now())
    ORDER BY a.week_label DESC, a.period_label DESC, a.created_at DESC`, [u.id]);
  send(res, 200, { assignments: rows.map(r => ({ ...r, id: N(r.id), runs_count: N(r.runs_count), total: N(r.total) })) });
} };
ACTIONS.sub = { GET: async (req, res) => {
  const u = await needUser(req), id = intId(query(req).get("assignment")), a = await myAssignment(u, id);
  const s = await q(`SELECT s.notebook, s.status, s.completed, s.runs_count, s.submitted_at, g.total, g.scores, g.comment
    FROM submissions s LEFT JOIN grades g ON g.submission_id = s.id WHERE s.assignment_id = $1 AND s.user_id = $2`, [id, u.id]);
  send(res, 200, { assignment: { ...a, id: N(a.id) }, submission: s[0] ? { ...s[0], runs_count: N(s[0].runs_count), total: N(s[0].total) } : null });
} };
async function upsertSubmission(u, id, notebook, submit){
  await myAssignment(u, id);
  const nb = cleanNotebook(notebook);
  const r = await q(`INSERT INTO submissions (assignment_id, user_id, notebook, status, submitted_at, last_at)
      VALUES ($1, $2, $3, CASE WHEN $4 THEN 'submitted' ELSE 'started' END, CASE WHEN $4 THEN now() END, now())
    ON CONFLICT (assignment_id, user_id) DO UPDATE SET notebook = EXCLUDED.notebook, last_at = now(),
      status = CASE WHEN $4 THEN 'submitted' ELSE submissions.status END,
      submitted_at = CASE WHEN $4 THEN now() ELSE submissions.submitted_at END
    RETURNING id, status, submitted_at`, [id, u.id, JSON.stringify(nb), !!submit]);
  return { ...r[0], id: N(r[0].id) };
}
ACTIONS.save = { POST: async (req, res) => {
  const u = await needUser(req), b = await readJsonBody(req, 600000);
  send(res, 200, { ok: true, submission: await upsertSubmission(u, intId(b.assignment), b.notebook, false) });
} };
ACTIONS.submit = { POST: async (req, res) => {
  const u = await needUser(req), b = await readJsonBody(req, 600000);
  send(res, 200, { ok: true, submission: await upsertSubmission(u, intId(b.assignment), b.notebook, true) });
} };

// ---------- tiến độ: lượt chạy, thời gian làm bài ----------
function cleanMetrics(m){
  m = m && typeof m === "object" ? m : {};
  const n = (v, hi) => Number.isFinite(+v) ? Math.max(0, Math.min(hi, +v)) : 0;
  return { time: n(m.time, 86400), dist: n(m.dist, 1e5), coll: Math.round(n(m.coll, 1e5)), reached: m.reached === true,
    reachT: m.reachT === null || m.reachT === undefined ? null : n(m.reachT, 86400), left: m.left === true, err: m.err === true, stopped: m.stopped === true };
}
const keyTime = m => m.reachT !== null ? m.reachT : m.time;
async function ensureSubmission(u, id){
  await myAssignment(u, id);
  const r = await q(`INSERT INTO submissions (assignment_id, user_id) VALUES ($1, $2)
    ON CONFLICT (assignment_id, user_id) DO UPDATE SET last_at = now() RETURNING id, completed, best, runs_count`, [id, u.id]);
  return r[0];
}
ACTIONS.run = { POST: async (req, res) => {
  const u = await needUser(req), b = await readJsonBody(req, 8192), id = intId(b.assignment);
  const s = await ensureSubmission(u, id);
  if (N(s.runs_count) >= 5000) return send(res, 200, { ok: true, ignored: true });
  const m = cleanMetrics(b.metrics), done = b.completed === true && !m.err, best = s.best;
  // kết quả tốt nhất: ưu tiên lượt đạt tiêu chí, rồi thời gian ngắn hơn, rồi quãng đường ngắn hơn
  const better = !best || (done && !best.completed) || (done === !!best.completed && (keyTime(m) < keyTime(best) || (keyTime(m) === keyTime(best) && m.dist < best.dist)));
  await q("INSERT INTO runs (submission_id, ok, completed, metrics) VALUES ($1, $2, $3, $4)", [N(s.id), b.ok !== false && !m.err, done, JSON.stringify(m)]);
  await q(`UPDATE submissions SET runs_count = runs_count + 1, completed = completed OR $2, last_at = now(),
    best = CASE WHEN $3 THEN $4::jsonb ELSE best END WHERE id = $1`, [N(s.id), done, better, JSON.stringify(Object.assign({ completed: done, at: new Date().toISOString() }, m))]);
  send(res, 200, { ok: true });
} };
ACTIONS.beat = { POST: async (req, res) => {
  const u = await needUser(req), b = await readJsonBody(req, 1024), id = intId(b.assignment);
  const sec = Math.round(Math.max(0, Math.min(70, Number(b.seconds) || 0)));   // gửi mỗi phút khi em đang làm bài
  const s = await ensureSubmission(u, id);
  await q("UPDATE submissions SET active_seconds = active_seconds + $2, last_at = now() WHERE id = $1", [N(s.id), sec]);
  send(res, 200, { ok: true });
} };

ACTIONS.progress = { GET: async (req, res) => {
  const u = await needTeacher(req), id = intId(query(req).get("class")); await ownClass(u, id);
  const assignments = (await q(`SELECT id, lesson_id, title, week_label, period_label, open_at, due_at, gc_coursework_id FROM assignments
    WHERE class_id = $1 ORDER BY week_label, period_label, created_at`, [id])).map(r => ({ ...r, id: N(r.id) }));
  const members = (await q(`SELECT m.email, m.name, m.group_name, m.user_id, u.name AS account_name FROM class_members m
    LEFT JOIN users u ON u.id = m.user_id WHERE m.class_id = $1 ORDER BY m.group_name, m.name, m.email`, [id]))
    .map(r => ({ email: r.email, name: r.name || r.account_name || "", group: r.group_name, joined: r.user_id !== null }));
  const subs = await q(`SELECT s.id, s.assignment_id, m.email, s.status, s.completed, s.runs_count, s.active_seconds, s.best, s.robot_verified,
      s.first_at, s.last_at, s.submitted_at, g.total, g.scores, g.comment, g.pushed_gc_at
    FROM submissions s JOIN assignments a ON a.id = s.assignment_id JOIN class_members m ON m.class_id = a.class_id AND m.user_id = s.user_id
    LEFT JOIN grades g ON g.submission_id = s.id WHERE a.class_id = $1`, [id]);
  send(res, 200, { assignments, members, subs: subs.map(s => ({ ...s, id: N(s.id), assignment_id: N(s.assignment_id), runs_count: N(s.runs_count), active_seconds: N(s.active_seconds), total: N(s.total) })) });
} };

// ---------- xem bài làm và chấm ----------
async function ownSubmission(u, sid){
  const rows = await q(`SELECT s.*, a.lesson_id, a.title, a.class_id, a.due_at, a.gc_coursework_id, m.name AS member_name, us.email, us.name AS account_name
    FROM submissions s JOIN assignments a ON a.id = s.assignment_id JOIN users us ON us.id = s.user_id
    LEFT JOIN class_members m ON m.class_id = a.class_id AND m.user_id = s.user_id WHERE s.id = $1`, [sid]);
  if (!rows.length) throw new HttpError(404, "Không có bài làm này");
  await ownClass(u, N(rows[0].class_id)); return rows[0];
}
ACTIONS.review = { GET: async (req, res) => {
  const u = await needTeacher(req), sid = intId(query(req).get("submission")), s = await ownSubmission(u, sid);
  const runs = await q("SELECT at, ok, completed, metrics FROM runs WHERE submission_id = $1 ORDER BY at DESC LIMIT 30", [sid]);
  const g = await q("SELECT scores, total, comment, graded_at, pushed_gc_at FROM grades WHERE submission_id = $1", [sid]);
  send(res, 200, { submission: { id: sid, assignment_id: N(s.assignment_id), lesson_id: s.lesson_id, title: s.title, due_at: s.due_at, class_id: N(s.class_id),
    student: { email: s.email, name: s.member_name || s.account_name || "" }, notebook: s.notebook, status: s.status, completed: s.completed,
    runs_count: N(s.runs_count), active_seconds: N(s.active_seconds), best: s.best, submitted_at: s.submitted_at, first_at: s.first_at, last_at: s.last_at,
    robot_verified: s.robot_verified, gc: !!s.gc_coursework_id }, runs, grade: g[0] ? { ...g[0], total: N(g[0].total) } : null });
} };
ACTIONS.grade = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 16384), sid = intId(b.submission); await ownSubmission(u, sid);
  const sc = b.scores || {}, p = v => { const n = Math.round(Number(v)*2)/2; if (!(n >= 0 && n <= 4)) throw new HttpError(400, "Điểm mỗi tiêu chí từ 0 đến 4"); return n; };
  const scores = { task: p(sc.task), optim: p(sc.optim), code: p(sc.code) }, total = Math.round((scores.task + scores.optim + scores.code)/12*100)/10;
  await q(`INSERT INTO grades (submission_id, scores, total, comment, graded_by, graded_at) VALUES ($1, $2, $3, $4, $5, now())
    ON CONFLICT (submission_id) DO UPDATE SET scores = EXCLUDED.scores, total = EXCLUDED.total, comment = EXCLUDED.comment, graded_by = EXCLUDED.graded_by, graded_at = now()`,
    [sid, JSON.stringify(scores), total, str(b.comment, 4000), u.id]);
  send(res, 200, { ok: true, total });
} };

// ---------- Google Classroom: liên kết khoá học, nhập học sinh, đăng bài, trả điểm ----------
async function gcToken(u){
  const rows = await q("SELECT refresh_enc FROM teacher_tokens WHERE user_id = $1", [u.id]);
  if (!rows.length) throw new HttpError(409, "Chưa kết nối Google Classroom. Bấm “Kết nối Google Classroom” trước.");
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: env("GOOGLE_CLIENT_ID"), client_secret: env("GOOGLE_CLIENT_SECRET"), refresh_token: decrypt(rows[0].refresh_enc), grant_type: "refresh_token" }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token){
    if (j.error === "invalid_grant"){ await q("DELETE FROM teacher_tokens WHERE user_id = $1", [u.id]); throw new HttpError(409, "Kết nối Classroom đã hết hạn hoặc bị thu hồi. Hãy bấm “Kết nối Google Classroom” lại."); }
    throw new HttpError(502, "Google không cấp quyền Classroom (" + (j.error || r.status) + ")");
  }
  return j.access_token;
}
async function gc(token, method, path, body){
  const r = await fetch("https://classroom.googleapis.com/v1/" + path, { method, headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new HttpError(r.status === 404 ? 404 : r.status === 403 ? 403 : 502, "Google Classroom: " + ((j.error && j.error.message) || "lỗi " + r.status));
  return j;
}
const enc = encodeURIComponent;
async function gcRoster(token, courseId){
  const out = []; let page = "", skipped = 0;
  for (let i = 0; i < 20; i++){
    const j = await gc(token, "GET", `courses/${enc(courseId)}/students?pageSize=100${page ? "&pageToken=" + enc(page) : ""}`);
    for (const s of j.students || []){ const p = s.profile || {}; if (p.emailAddress && EMAIL.test(p.emailAddress)) out.push({ email: p.emailAddress.toLowerCase(), name: str(p.name && p.name.fullName, 120) }); else skipped++; }
    if (!j.nextPageToken) break; page = j.nextPageToken;
  }
  return { list: out, skipped };
}
async function importRoster(u, cls){
  const { list, skipped } = await gcRoster(await gcToken(u), cls.gc_course_id);
  for (const m of list) await q(`INSERT INTO class_members (class_id, email, name, user_id) VALUES ($1, $2, $3, (SELECT id FROM users WHERE email = $2))
    ON CONFLICT (class_id, email) DO UPDATE SET name = CASE WHEN class_members.name = '' THEN EXCLUDED.name ELSE class_members.name END`, [N(cls.id), m.email, m.name]);
  return { imported: list.length, skipped };
}
ACTIONS.gc_courses = { GET: async (req, res) => {
  const u = await needTeacher(req), token = await gcToken(u), out = []; let page = "";
  for (let i = 0; i < 5; i++){
    const j = await gc(token, "GET", `courses?teacherId=me&courseStates=ACTIVE&pageSize=100${page ? "&pageToken=" + enc(page) : ""}`);
    for (const c of j.courses || []) out.push({ id: c.id, name: c.name, section: c.section || "" });
    if (!j.nextPageToken) break; page = j.nextPageToken;
  }
  send(res, 200, { courses: out });
} };
ACTIONS.gc_link = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 4096), id = intId(b.class), cls = await ownClass(u, id);
  const course = str(b.course, 40); if (!/^\d{1,30}$/.test(course)) throw new HttpError(400, "Mã khoá học không hợp lệ");
  const c = await gc(await gcToken(u), "GET", "courses/" + enc(course));   // chỉ liên kết khoá học giáo viên này thấy được
  await q("UPDATE classes SET gc_course_id = $2, gc_course_name = $3 WHERE id = $1", [id, course, str(c.name + (c.section ? " · " + c.section : ""), 160)]);
  send(res, 200, { ok: true, ...(await importRoster(u, { ...cls, gc_course_id: course })) });
} };
ACTIONS.gc_import = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), cls = await ownClass(u, intId(b.class));
  if (!cls.gc_course_id) throw new HttpError(400, "Lớp chưa liên kết Google Classroom");
  send(res, 200, { ok: true, ...(await importRoster(u, cls)) });
} };
ACTIONS.gc_unlink = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), id = intId(b.class); await ownClass(u, id);
  await q("UPDATE classes SET gc_course_id = NULL, gc_course_name = NULL WHERE id = $1", [id]); send(res, 200, { ok: true });
} };
// Chủ đề (topic) trong Classroom: tìm theo tên (không phân biệt hoa thường), chưa có thì tạo.
async function gcTopics(token, courseId){
  const out = []; let page = "";
  for (let i = 0; i < 5; i++){
    const j = await gc(token, "GET", `courses/${enc(courseId)}/topics?pageSize=100${page ? "&pageToken=" + enc(page) : ""}`);
    for (const t of j.topic || []) out.push({ id: t.topicId, name: t.name });
    if (!j.nextPageToken) break; page = j.nextPageToken;
  }
  return out;
}
async function gcTopicId(token, courseId, name){
  const key = name.trim().toLowerCase(), hit = (await gcTopics(token, courseId)).find(t => t.name.trim().toLowerCase() === key);
  return hit ? hit.id : (await gc(token, "POST", `courses/${enc(courseId)}/topics`, { name: name.trim() })).topicId;
}
ACTIONS.gc_topics = { GET: async (req, res) => {
  const u = await needTeacher(req), cls = await ownClass(u, intId(query(req).get("class")));
  if (!cls.gc_course_id) return send(res, 200, { topics: [] });
  try { send(res, 200, { topics: (await gcTopics(await gcToken(u), cls.gc_course_id)).map(t => t.name) }); }
  catch (e){ if (e.status === 403) return send(res, 200, { topics: [], needScope: true }); throw e; }
} };
ACTIONS.gc_post = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), id = intId(b.assignment);
  const a = (await q("SELECT * FROM assignments WHERE id = $1", [id]))[0]; if (!a) throw new HttpError(404, "Không có bài được giao này");
  const cls = await ownClass(u, N(a.class_id));
  if (!cls.gc_course_id) throw new HttpError(400, "Lớp chưa liên kết Google Classroom");
  if (a.gc_coursework_id) return send(res, 200, { ok: true, already: true });
  const link = siteOrigin(req) + "/?assignment=" + id;
  const body = { title: str(a.title || a.lesson_id, 160), workType: "ASSIGNMENT", state: "PUBLISHED", maxPoints: 10,
    description: `Làm bài trên JetBot Lab (đăng nhập bằng Gmail này): ${link}${a.week_label ? "\n" + a.week_label : ""}${a.period_label ? " · " + a.period_label : ""}`,
    materials: [{ link: { url: link, title: "Mở bài trên JetBot Lab" } }] };
  if (a.due_at){ const d = new Date(a.due_at); body.dueDate = { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() }; body.dueTime = { hours: d.getUTCHours(), minutes: d.getUTCMinutes() }; }
  const token = await gcToken(u); let warn = null;
  if (a.gc_topic){
    try { body.topicId = await gcTopicId(token, cls.gc_course_id, a.gc_topic); }
    catch (e){ if (e.status !== 403) throw e; warn = "Chưa có quyền tạo Chủ đề: hãy bấm “Kết nối Google Classroom” lại để cấp thêm quyền. Bài đã đăng, chưa gắn chủ đề."; }
  }
  const cw = await gc(token, "POST", `courses/${enc(cls.gc_course_id)}/courseWork`, body);
  await q("UPDATE assignments SET gc_coursework_id = $2, gc_link = $3 WHERE id = $1", [id, String(cw.id), cw.alternateLink || null]);
  send(res, 200, { ok: true, link: cw.alternateLink || null, warn });
} };
// Classroom chỉ cho ứng dụng chấm bài tập do chính ứng dụng tạo (gc_post).
async function pushOne(token, courseId, cwId, email, total){
  const subs = await gc(token, "GET", `courses/${enc(courseId)}/courseWork/${enc(cwId)}/studentSubmissions?userId=${enc(email)}`);
  const s = (subs.studentSubmissions || [])[0]; if (!s) throw new HttpError(404, "Học sinh không có trong khoá học Classroom");
  const base = `courses/${enc(courseId)}/courseWork/${enc(cwId)}/studentSubmissions/${enc(s.id)}`;
  await gc(token, "PATCH", base + "?updateMask=assignedGrade,draftGrade", { assignedGrade: total, draftGrade: total });
  if (s.state !== "RETURNED") await gc(token, "POST", base + ":return", {});
}
async function gradedRows(where, params){
  return q(`SELECT s.id, us.email, g.total, a.gc_coursework_id, c.gc_course_id, a.class_id FROM grades g JOIN submissions s ON s.id = g.submission_id
    JOIN assignments a ON a.id = s.assignment_id JOIN classes c ON c.id = a.class_id JOIN users us ON us.id = s.user_id WHERE ${where}`, params);
}
ACTIONS.gc_grade = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), sid = intId(b.submission);
  const r = (await gradedRows("s.id = $1", [sid]))[0]; if (!r) throw new HttpError(400, "Bài này chưa được chấm");
  await ownClass(u, N(r.class_id));
  if (!r.gc_coursework_id) throw new HttpError(400, "Bài được giao chưa đăng lên Google Classroom (bấm “Đăng lên Classroom” ở tab Giao bài)");
  await pushOne(await gcToken(u), r.gc_course_id, r.gc_coursework_id, r.email, Number(r.total));
  await q("UPDATE grades SET pushed_gc_at = now() WHERE submission_id = $1", [sid]);
  send(res, 200, { ok: true });
} };
ACTIONS.gc_grade_all = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), id = intId(b.assignment); await ownAssignment(u, id);
  const rows = await gradedRows("s.assignment_id = $1", [id]); if (!rows.length) return send(res, 200, { ok: true, pushed: 0, failed: [] });
  if (!rows[0].gc_coursework_id) throw new HttpError(400, "Bài được giao chưa đăng lên Google Classroom");
  const token = await gcToken(u), failed = []; let pushed = 0;
  for (const r of rows){
    try { await pushOne(token, r.gc_course_id, r.gc_coursework_id, r.email, Number(r.total)); await q("UPDATE grades SET pushed_gc_at = now() WHERE submission_id = $1", [N(r.id)]); pushed++; }
    catch (e){ failed.push({ email: r.email, error: e.message }); }
  }
  send(res, 200, { ok: true, pushed, failed });
} };

// ---------- tiết học trực tiếp: luân phiên nhóm dùng robot thật ----------
// state = { on, groups: [tên nhóm theo thứ tự], minutes, startedAt, assignment }. Nhóm hiện tại tính theo đồng hồ, không cần ghi liên tục.
function liveNow(st){
  if (!st || !st.on || !Array.isArray(st.groups) || !st.groups.length || !(st.minutes > 0)) return null;
  const el = Math.max(0, (Date.now() - Date.parse(st.startedAt))/1000), slot = st.minutes*60, i = Math.floor(el/slot);
  return { group: st.groups[i % st.groups.length], next: st.groups[(i + 1) % st.groups.length], remaining: Math.round(slot - el % slot), round: i, minutes: st.minutes, groups: st.groups, assignment: st.assignment || null };
}
ACTIONS.live = {
  GET: async (req, res) => {
    const u = await needTeacher(req), id = intId(query(req).get("class")); await ownClass(u, id);
    const r = await q("SELECT state FROM live WHERE class_id = $1", [id]); const st = r[0] ? r[0].state : null;
    send(res, 200, { state: st, now: liveNow(st) });
  },
  POST: async (req, res) => {
    const u = await needTeacher(req), b = await readJsonBody(req, 8192), id = intId(b.class); await ownClass(u, id);
    const groups = (Array.isArray(b.groups) ? b.groups : []).map(g => str(g, 40)).filter(Boolean).slice(0, 20);
    const st = { on: b.on === true && groups.length > 0, groups, minutes: Math.max(1, Math.min(120, Math.round(Number(b.minutes) || 10))),
      startedAt: date(b.startedAt) || new Date().toISOString(), assignment: b.assignment ? intId(b.assignment) : null };
    await q(`INSERT INTO live (class_id, state, updated_at) VALUES ($1, $2, now()) ON CONFLICT (class_id) DO UPDATE SET state = EXCLUDED.state, updated_at = now()`, [id, JSON.stringify(st)]);
    send(res, 200, { ok: true, state: st, now: liveNow(st) });
  }
};
ACTIONS.my_live = { GET: async (req, res) => {
  const u = await needUser(req);
  const rows = await q(`SELECT c.id, c.name, m.group_name, l.state FROM class_members m JOIN classes c ON c.id = m.class_id AND NOT c.archived
    JOIN live l ON l.class_id = c.id WHERE m.user_id = $1 AND l.updated_at > now() - interval '12 hours'`, [u.id]);
  const out = rows.map(r => ({ class_id: N(r.id), class_name: r.name, my_group: r.group_name, now: liveNow(r.state) })).filter(x => x.now);
  send(res, 200, { live: out });
} };
ACTIONS.verify = { POST: async (req, res) => {
  const u = await needTeacher(req), b = await readJsonBody(req, 1024), sid = intId(b.submission); await ownSubmission(u, sid);
  await q("UPDATE submissions SET robot_verified = $2 WHERE id = $1", [sid, b.value === true]); send(res, 200, { ok: true });
} };


module.exports = handle(async (req, res) => {
  const a = query(req).get("a"), h = ACTIONS[a] && ACTIONS[a][req.method];
  if (!h) throw new HttpError(404, "Không có");
  await h(req, res);
});
module.exports.ACTIONS = ACTIONS;
module.exports.helpers = { q, N, str, intId, ownClass, ownAssignment, myAssignment, needUser, needTeacher, cleanNotebook };
