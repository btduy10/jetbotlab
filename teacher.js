"use strict";
// Khu giáo viên: lớp học, học sinh, giao bài. Dùng chung $, esc, api, toast, msg, show, VIEWS, DATA của admin.js.
const BUILTIN_LESSONS = [["l0", "0. Bài giảng: Tránh vật cản với JetBot"], ["l1", "1. Làm quen: tiến, quay, dừng"], ["l2", "2. Vòng lặp: đi hình vuông"],
  ["l3", "3. Điều khiển từng động cơ"], ["l4", "4. Encoder: đi đúng 50 cm"], ["l5", "5. IMU: quay chính xác 90°"], ["l6", "6. Lidar: đọc bản quét 360°"],
  ["l7", "7. Lidar: tránh vật cản"], ["l8", "8. Camera: dò line"], ["l9", "9. Mê cung: bám tường phải"], ["l10", "10. OLED: hiển thị cảm biến"],
  ["l11", "11. AI tránh vật cản ①: thu thập dữ liệu"], ["l12", "12. AI tránh vật cản ②: huấn luyện"], ["l13", "13. AI tránh vật cản ③: chạy mô hình"]];
VIEWS.push("vClasses", "vClass");
const TC = { classes: [], cls: null, sub: "members" };
const fmtDate = d => d ? new Date(d).toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "";
const toLocalInput = d => { if (!d) return ""; const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset()); return x.toISOString().slice(0, 16); };
const fromLocalInput = v => v ? new Date(v).toISOString() : null;
function lessonTitle(id){
  const b = BUILTIN_LESSONS.find(x => x[0] === id); if (b) return b[1];
  const c = DATA.lessons.find(l => "c-" + l.id === id); return c ? c.title : id;
}
window.TEACHER_TABS = { classes: () => { show("vClasses"); loadClasses(); } };

/* ---------- danh sách lớp ---------- */
async function loadClasses(){
  const el = $("#classList");
  try {
    TC.classes = (await api("/api/class?a=classes")).classes;
    el.innerHTML = TC.classes.length ? TC.classes.map(c => `<div class="row${c.archived ? " off" : ""}" data-id="${c.id}"><div></div>
      <div><b>${esc(c.name)}${c.archived ? '<span class="badge">đã lưu trữ</span>' : ""}${c.gc_course_id ? '<span class="badge">Classroom</span>' : ""}</b>
      <div class="a-meta">${c.members} học sinh · ${c.assignments} bài được giao${ME_USER.role === "admin" && !c.mine ? " · GV " + esc(c.teacher_email) : ""}${c.note ? " · " + esc(c.note) : ""}</div></div>
      <div class="acts"><button data-a="open">Mở lớp</button></div></div>`).join("") : '<div class="empty">Chưa có lớp nào. Nhập tên lớp ở trên để tạo.</div>';
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#fClass").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target;
  try { const j = await api("/api/class?a=classes", { method: "POST", body: JSON.stringify({ name: f.elements.name.value, note: f.elements.note.value }) }); f.reset(); toast("Đã tạo lớp"); await loadClasses(); openClass(j.id); }
  catch (x){ toast(x.message); }
});
$("#classList").addEventListener("click", e => { const b = e.target.closest("button[data-a=open]"); if (b) openClass(+b.closest(".row").dataset.id); });

/* ---------- một lớp ---------- */
async function openClass(id){
  if (!TC.classes.length) TC.classes = (await api("/api/class?a=classes")).classes;
  TC.cls = TC.classes.find(c => c.id === id); if (!TC.cls) return toast("Không có lớp này");
  $("#clsName").textContent = TC.cls.name; $("#clsArchive").textContent = TC.cls.archived ? "Bỏ lưu trữ" : "Lưu trữ lớp";
  show("vClass"); renderGc(); subTab(TC.sub);
}
/* ---------- Google Classroom ---------- */
function renderGc(){
  const el = $("#gcBox"), c = TC.cls;
  $("#asGcWrap").hidden = !c.gc_course_id;
  if (!ME_USER.classroom){
    el.innerHTML = `<b>Google Classroom</b><span class="muted">Kết nối để nhập danh sách học sinh, đăng bài và trả điểm về Classroom.</span>
      <a class="btn" href="/api/auth?a=google&amp;classroom=1&amp;next=${encodeURIComponent("/admin?tab=classes")}">Kết nối Google Classroom</a><div class="gc-manual">Không kết nối được Classroom? Dùng thủ công: dán danh sách học sinh ở tab <b>Học sinh</b> · bấm <b>Chép link</b> rồi dán vào bài tập Classroom · chấm xong bấm <b>Chép điểm</b> để dán sang Google Sheets / sổ điểm.</div>`;
    return;
  }
  if (!c.gc_course_id){
    el.innerHTML = `<b>Google Classroom</b><span class="muted">Đã kết nối. Chọn khoá học tương ứng với lớp này để nhập học sinh.</span><button class="btn" id="gcPick">Liên kết khoá học…</button><div class="gc-manual">Không kết nối được Classroom? Dùng thủ công: dán danh sách học sinh ở tab <b>Học sinh</b> · bấm <b>Chép link</b> rồi dán vào bài tập Classroom · chấm xong bấm <b>Chép điểm</b> để dán sang Google Sheets / sổ điểm.</div>`;
    $("#gcPick").onclick = pickCourse; return;
  }
  el.innerHTML = `<b>Google Classroom</b><span class="badge">${esc(c.gc_course_name || c.gc_course_id)}</span><span class="grow"></span>
    <button class="btn ghost" id="gcImport">↻ Nhập lại danh sách học sinh</button><button class="btn ghost dangerbtn" id="gcUnlink">Bỏ liên kết</button>`;
  $("#gcImport").onclick = async () => { try { const j = await api("/api/class?a=gc_import", { method: "POST", body: JSON.stringify({ class: c.id }) }); toast(`Đã nhập ${j.imported} học sinh${j.skipped ? `, bỏ qua ${j.skipped} em không có email` : ""}`); if (TC.sub === "members") loadMembers(); } catch (x){ toast(x.message); } };
  $("#gcUnlink").onclick = async () => { if (!confirm("Bỏ liên kết lớp với khoá học Classroom? Học sinh và bài đã đăng vẫn giữ nguyên.")) return; try { await api("/api/class?a=gc_unlink", { method: "POST", body: JSON.stringify({ class: c.id }) }); c.gc_course_id = null; c.gc_course_name = null; renderGc(); } catch (x){ toast(x.message); } };
}
async function pickCourse(){
  const el = $("#gcBox"); el.innerHTML = `<b>Google Classroom</b><span class="muted">Đang tải danh sách khoá học…</span>`;
  let courses; try { courses = (await api("/api/class?a=gc_courses")).courses; } catch (x){ toast(x.message); return renderGc(); }
  if (!courses.length){ el.innerHTML = `<b>Google Classroom</b><span class="muted">Tài khoản này chưa dạy khoá học Classroom nào đang hoạt động.</span>`; return; }
  el.innerHTML = `<b>Google Classroom</b><select id="gcSel">${courses.map(c => `<option value="${esc(c.id)}">${esc(c.name)}${c.section ? " · " + esc(c.section) : ""}</option>`).join("")}</select>
    <button class="btn primary" id="gcLink">Liên kết &amp; nhập học sinh</button><button class="btn ghost" id="gcCancel">Huỷ</button>`;
  $("#gcCancel").onclick = renderGc;
  $("#gcLink").onclick = async () => {
    const c = TC.cls, id = $("#gcSel").value;
    try { const j = await api("/api/class?a=gc_link", { method: "POST", body: JSON.stringify({ class: c.id, course: id }) });
      c.gc_course_id = id; c.gc_course_name = $("#gcSel").selectedOptions[0].textContent; toast(`Đã liên kết, nhập ${j.imported} học sinh${j.skipped ? `, bỏ qua ${j.skipped} em không có email` : ""}`); renderGc(); subTab(TC.sub); }
    catch (x){ toast(x.message); }
  };
}
function subTab(s){
  TC.sub = s; $$("#clsTabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.sub === s));
  $$("#vClass .subpane").forEach(p => p.hidden = p.dataset.sub !== s);
  if (s === "members") loadMembers(); else if (s === "assign") loadAssignments(); else if (window.CLASS_SUBTABS && CLASS_SUBTABS[s]) CLASS_SUBTABS[s](TC.cls);
}
$("#clsTabs").addEventListener("click", e => { const b = e.target.closest("button[data-sub]"); if (b) subTab(b.dataset.sub); });
$("#clsBack").onclick = () => { show("vClasses"); loadClasses(); };
$("#clsArchive").onclick = async () => {
  const c = TC.cls; try { await api("/api/class?a=class_edit", { method: "POST", body: JSON.stringify({ id: c.id, name: c.name, note: c.note, archived: !c.archived }) }); c.archived = !c.archived; toast(c.archived ? "Đã lưu trữ lớp" : "Đã bỏ lưu trữ"); openClass(c.id); } catch (x){ toast(x.message); }
};
$("#clsRename").onclick = async () => {
  const c = TC.cls, name = prompt("Tên lớp mới", c.name); if (!name || name === c.name) return;
  try { await api("/api/class?a=class_edit", { method: "POST", body: JSON.stringify({ id: c.id, name, note: c.note, archived: c.archived }) }); c.name = name; $("#clsName").textContent = name; toast("Đã đổi tên"); } catch (x){ toast(x.message); }
};
$("#clsDelete").onclick = async () => {
  const c = TC.cls; if (!confirm(`Xoá lớp "${c.name}"? Toàn bộ danh sách học sinh, bài được giao, bài làm và điểm của lớp sẽ bị xoá vĩnh viễn.`)) return;
  try { await api("/api/class?a=classes&id=" + c.id, { method: "DELETE" }); toast("Đã xoá lớp"); TC.classes = []; show("vClasses"); loadClasses(); } catch (x){ toast(x.message); }
};

/* ---------- học sinh ---------- */
async function loadMembers(){
  const el = $("#memberList");
  try {
    const m = (await api("/api/class?a=members&class=" + TC.cls.id)).members;
    $("#memberCount").textContent = m.length ? `${m.length} học sinh · ${m.filter(x => x.joined).length} đã đăng nhập` : "";
    el.innerHTML = m.length ? `<table class="tbl"><thead><tr><th>Họ tên</th><th>Email</th><th>Nhóm</th><th>Tài khoản</th><th></th></tr></thead><tbody>`
      + m.map(x => `<tr data-email="${esc(x.email)}"><td><input class="cell-in" data-f="name" value="${esc(x.name)}" aria-label="Họ tên"></td><td>${esc(x.email)}</td>
        <td><input class="cell-in sm" data-f="group" value="${esc(x.group)}" placeholder="—" aria-label="Nhóm"></td>
        <td>${x.joined ? '<span class="ok">✓ đã đăng nhập</span>' : '<span class="muted">chưa đăng nhập</span>'}</td>
        <td><button class="linkbtn danger" data-a="del">Xoá</button></td></tr>`).join("") + "</tbody></table>" : '<div class="empty">Lớp chưa có học sinh. Dán danh sách email ở trên.</div>';
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#fMembers").addEventListener("submit", async e => {
  e.preventDefault(); const ta = e.target.elements.text;
  try { const j = await api("/api/class?a=members", { method: "POST", body: JSON.stringify({ class: TC.cls.id, text: ta.value }) }); ta.value = ""; toast(`Đã thêm ${j.added} học sinh`); loadMembers(); }
  catch (x){ toast(x.message); }
});
$("#memberList").addEventListener("change", async e => {
  const inp = e.target.closest(".cell-in"); if (!inp) return;
  const tr = inp.closest("tr"), get = f => tr.querySelector(`[data-f=${f}]`).value;
  try { await api("/api/class?a=member_edit", { method: "POST", body: JSON.stringify({ class: TC.cls.id, email: tr.dataset.email, name: get("name"), group: get("group") }) }); toast("Đã lưu"); }
  catch (x){ toast(x.message); }
});
$("#memberList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a=del]"); if (!b) return;
  const email = b.closest("tr").dataset.email; if (!confirm(`Xoá ${email} khỏi lớp?`)) return;
  try { await api(`/api/class?a=members&class=${TC.cls.id}&email=${encodeURIComponent(email)}`, { method: "DELETE" }); loadMembers(); } catch (x){ toast(x.message); }
});

/* ---------- tiến độ: bảng học sinh × bài ---------- */
window.CLASS_SUBTABS = Object.assign(window.CLASS_SUBTABS || {}, { progress: loadProgress });
const PG = { d: null, week: "" };
const median = a => { if (!a.length) return 0; const s = [...a].sort((x, y) => x - y), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m])/2; };
const subKey = (aid, email) => aid + "|" + email;
async function loadProgress(target){
  PG.el = target instanceof Element ? target : $("#progressTable");
  const el = PG.el;
  try { PG.d = await api("/api/class?a=progress&class=" + TC.cls.id); } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  const weeks = [...new Set(PG.d.assignments.map(a => a.week_label || "—"))], sel = $("#pgWeek");
  sel.innerHTML = `<option value="">Tất cả các tuần</option>` + weeks.map(w => `<option>${esc(w)}</option>`).join("");
  if (weeks.includes(PG.week)) sel.value = PG.week; else PG.week = "";
  renderProgress();
}
// Cờ gợi ý: cần hỗ trợ / có thể nâng cấp độ (theo các bài đang xem)
function studentFlags(m, as, map, med){
  const now = Date.now(); let help = [], up = 0, graded = [];
  for (const a of as){
    const s = map.get(subKey(a.id, m.email));
    if (a.due_at && new Date(a.due_at) < now && (!s || s.status !== "submitted")) help.push("quá hạn chưa nộp");
    if (s && !s.completed && s.runs_count >= 8) help.push("chạy nhiều lần chưa đạt");
    if (s && !s.completed && med.get(a.id) && s.active_seconds > 2*med.get(a.id) && s.active_seconds > 600) help.push("làm lâu hơn 2× cả lớp");
    if (s && s.total !== null) graded.push(s.total);
    if (s && s.completed && s.runs_count <= Math.max(2, median(PG.d.subs.filter(x => x.assignment_id === a.id && x.completed).map(x => x.runs_count)))) up++;
  }
  const avg = graded.length ? graded.reduce((x, y) => x + y, 0)/graded.length : null;
  if (avg !== null && avg < 5) help.push("điểm TB " + avg.toFixed(1));
  const canUp = !help.length && as.length && up === as.length && (avg === null || avg >= 8);
  return { help: [...new Set(help)], up: canUp };
}
function renderProgress(){
  const d = PG.d, el = PG.el || $("#progressTable"); if (!d) return;
  const as = d.assignments.filter(a => !PG.week || (a.week_label || "—") === PG.week);
  if (!d.members.length || !as.length){ el.innerHTML = `<div class="empty">${!d.members.length ? "Lớp chưa có học sinh." : "Chưa có bài được giao trong tuần này."}</div>`; return; }
  const map = new Map(d.subs.map(s => [subKey(s.assignment_id, s.email), s]));
  const med = new Map(as.map(a => [a.id, median(d.subs.filter(s => s.assignment_id === a.id).map(s => s.active_seconds))]));
  const cell = (a, m) => {
    const s = map.get(subKey(a.id, m.email));
    if (!s) return `<td class="pc none" title="Chưa mở bài">—</td>`;
    const late = s.submitted_at && a.due_at && new Date(s.submitted_at) > new Date(a.due_at);
    const icon = s.completed ? "★" : s.status === "submitted" ? "✓" : "◐", cls = s.completed ? "done" : s.status === "submitted" ? "sub" : "wip";
    const tip = `${s.status === "submitted" ? "Đã nộp" + (late ? " (muộn)" : "") : "Đang làm"} · ${s.runs_count} lần chạy · ${Math.round(s.active_seconds/60)} phút${s.best ? ` · tốt nhất ${(s.best.reachT ?? s.best.time).toFixed(1)} s` : ""}${s.robot_verified ? " · đã kiểm chứng robot thật" : ""}`;
    return `<td class="pc ${cls}${late ? " late" : ""}" title="${esc(tip)}"><a href="/?review=${s.id}" target="_blank" rel="noopener"><span class="ic">${icon}</span>${s.total !== null ? `<b>${s.total}</b>` : ""}<small>${s.runs_count}× · ${Math.round(s.active_seconds/60)}′${s.robot_verified ? " · robot thật ✓" : ""}</small></a></td>`;
  };
  const head = `<tr><th>Nhóm</th><th>Học sinh</th>${as.map(a => `<th title="${esc(lessonTitle(a.lesson_id))}">${esc(a.title || lessonTitle(a.lesson_id))}<small>${esc([a.period_label, a.due_at ? "hạn " + fmtDate(a.due_at) : ""].filter(Boolean).join(" · "))}</small></th>`).join("")}<th>Gợi ý</th></tr>`;
  const rows = d.members.map(m => { const f = studentFlags(m, as, map, med);
    return `<tr><td class="grp">${esc(m.group || "")}</td><td><b>${esc(m.name || m.email)}</b><small>${esc(m.email)}${m.joined ? "" : " · chưa đăng nhập"}</small></td>${as.map(a => cell(a, m)).join("")}
      <td class="flags">${f.help.length ? `<span class="flag help" title="${esc(f.help.join(", "))}">Cần hỗ trợ</span>` : ""}${f.up ? '<span class="flag up">Có thể nâng cấp độ</span>' : ""}</td></tr>`; }).join("");
  const foot = `<tr class="sum"><td></td><td>Tổng</td>${as.map(a => { const ss = d.subs.filter(s => s.assignment_id === a.id); return `<td>${ss.filter(s => s.status === "submitted").length}/${d.members.length} nộp · ${ss.filter(s => s.completed).length} ★</td>`; }).join("")}<td></td></tr>`;
  el.innerHTML = `<div class="tblwrap"><table class="tbl prog"><thead>${head}</thead><tbody>${rows}${foot}</tbody></table></div>
    <p class="a-hint">— chưa mở · ◐ đang làm · ✓ đã nộp · ★ đạt tiêu chí · số đậm là điểm /10 · “3× · 12′” = 3 lần chạy, 12 phút làm bài. Bấm vào ô để xem code, chạy lại và chấm.</p>`;
}
$("#pgWeek").addEventListener("change", e => { PG.week = e.target.value; renderProgress(); });
$("#pgRefresh").onclick = () => loadProgress();
$("#pgCsv").onclick = () => {
  const d = PG.d; if (!d) return;
  const as = d.assignments.filter(a => !PG.week || (a.week_label || "—") === PG.week), map = new Map(d.subs.map(s => [subKey(s.assignment_id, s.email), s]));
  const q = v => `"${String(v === null || v === undefined ? "" : v).replace(/"/g, '""')}"`;
  const head = ["Nhóm", "Họ tên", "Email", ...as.flatMap(a => { const n = a.title || lessonTitle(a.lesson_id); return [n + " · trạng thái", n + " · lần chạy", n + " · phút", n + " · đạt tiêu chí", n + " · điểm"]; })];
  const lines = d.members.map(m => [m.group, m.name, m.email, ...as.flatMap(a => { const s = map.get(subKey(a.id, m.email));
    return s ? [s.status === "submitted" ? "Đã nộp" : "Đang làm", s.runs_count, Math.round(s.active_seconds/60), s.completed ? "Có" : "Không", s.total ?? ""] : ["Chưa mở", 0, 0, "Không", ""]; })]);
  const csv = "﻿" + [head, ...lines].map(r => r.map(q).join(",")).join("\r\n");
  const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  a.download = `tien-do-${TC.cls.name.replace(/[^\p{L}\p{N}]+/gu, "-")}${PG.week ? "-" + PG.week.replace(/\s+/g, "-") : ""}.csv`; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};

/* ---------- giao bài ---------- */
function fillLessonSelect(){
  const sel = $("#asLesson"), cur = sel.value;
  const custom = DATA.lessons.map(l => `<option value="c-${esc(l.id)}">${esc(l.title)}${l.kind === "challenge" ? " (thử thách)" : ""}${l.hidden ? " · ẩn" : ""}</option>`).join("");
  sel.innerHTML = (custom ? `<optgroup label="Bài của giáo viên">${custom}</optgroup>` : "") + `<optgroup label="Bài có sẵn">${BUILTIN_LESSONS.map(([id, t]) => `<option value="${id}">${esc(t)}</option>`).join("")}</optgroup>`;
  if (cur) sel.value = cur;
}
async function loadAssignments(){
  fillLessonSelect(); checkAssign();
  const el = $("#assignList");
  try {
    const list = (await api("/api/class?a=assignments&class=" + TC.cls.id)).assignments;
    if (!list.length){ el.innerHTML = '<div class="empty">Chưa giao bài nào.</div>'; return; }
    const weeks = [...new Set(list.map(a => a.week_label || "Không ghi tuần"))];
    el.innerHTML = weeks.map(w => `<h3 class="wk">${esc(w)}</h3>` + list.filter(a => (a.week_label || "Không ghi tuần") === w).map(a => `<div class="row" data-id="${a.id}"><div></div>
      <div><b>${esc(a.title || lessonTitle(a.lesson_id))}</b><div class="a-meta">${a.period_label ? esc(a.period_label) + " · " : ""}${esc(lessonTitle(a.lesson_id))}${a.open_at ? " · mở " + fmtDate(a.open_at) : ""}${a.due_at ? " · hạn " + fmtDate(a.due_at) : ""} · ${a.submitted} đã nộp · ${a.completed} hoàn thành${a.gc_coursework_id ? " · đã đăng Classroom" : ""}</div></div>
      <div class="acts">${TC.cls.gc_course_id ? (a.gc_coursework_id ? '<button data-a="gcgrade">Trả điểm về Classroom</button>' : '<button data-a="gcpost">Đăng lên Classroom</button>') : ""}<button data-a="link">Chép link</button><button data-a="grades" title="Chép bảng Họ tên · Email · Điểm · Nhận xét để dán vào Google Sheets">Chép điểm</button><button data-a="del" class="danger">Xoá</button></div></div>`).join("")).join("");
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#asLesson").addEventListener("change", () => { const f = $("#fAssign"); if (!f.elements.title.dataset.touched) f.elements.title.value = lessonTitle($("#asLesson").value); });
$("#fAssign").elements.title.addEventListener("input", e => e.target.dataset.touched = "1");
// Kiểm tra form giao bài: báo đỏ dưới ô còn thiếu / sai và khoá nút Giao bài cho tới khi hợp lệ
function checkAssign(){
  const f = $("#fAssign"), v = k => f.elements[k].value.trim(), err = {};
  if (!v("lesson")) err.lesson = "Hãy chọn bài học";
  if (!v("week")) err.week = "Hãy nhập tuần, VD: Tuần 3";
  if (!v("period")) err.period = "Hãy nhập tiết học, VD: Tiết 1–2";
  const op = v("open_at") ? new Date(v("open_at")) : null, due = v("due_at") ? new Date(v("due_at")) : null;
  if (!due) err.due_at = "Hãy chọn hạn nộp";
  else if (due <= new Date()) err.due_at = "Hạn nộp phải sau thời điểm hiện tại";
  else if (op && due <= op) err.due_at = "Hạn nộp phải sau ngày mở";
  for (const el of f.querySelectorAll(".f-err")){ const k = el.dataset.err; el.textContent = err[k] || ""; el.parentElement.classList.toggle("invalid", !!err[k]); }
  const n = Object.keys(err).length;
  $("#asSubmit").disabled = n > 0; $("#asMissing").textContent = n ? `Còn ${n} mục chưa hợp lệ` : "";
  return n === 0;
}
for (const ev of ["input", "change"]) $("#fAssign").addEventListener(ev, checkAssign);
$("#fAssign").addEventListener("submit", async e => {
  e.preventDefault(); if (!checkAssign()) return; const f = e.target, v = k => f.elements[k].value;
  const body = { class: TC.cls.id, lesson: v("lesson"), title: v("title") || lessonTitle(v("lesson")), week: v("week"), period: v("period"), open_at: fromLocalInput(v("open_at")), due_at: fromLocalInput(v("due_at")) };
  try { const j = await api("/api/class?a=assignments", { method: "POST", body: JSON.stringify(body) }); toast("Đã giao bài");
    if (TC.cls.gc_course_id && f.elements.gcpost.checked){ try { await api("/api/class?a=gc_post", { method: "POST", body: JSON.stringify({ assignment: j.id }) }); toast("Đã giao bài và đăng lên Classroom"); } catch (x){ toast("Đã giao bài, nhưng chưa đăng được lên Classroom: " + x.message); } } f.elements.title.value = ""; delete f.elements.title.dataset.touched; loadAssignments(); if (window.afterAssign) afterAssign(); }
  catch (x){ toast(x.message); }
});
$("#assignList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = +b.closest(".row").dataset.id;
  if (b.dataset.a === "gcpost"){ try { await api("/api/class?a=gc_post", { method: "POST", body: JSON.stringify({ assignment: id }) }); toast("Đã đăng lên Classroom"); loadAssignments(); } catch (x){ toast(x.message); } return; }
  if (b.dataset.a === "gcgrade"){
    if (!confirm("Trả điểm các bài đã chấm của bài này về Google Classroom?")) return;
    try { const j = await api("/api/class?a=gc_grade_all", { method: "POST", body: JSON.stringify({ assignment: id }) }); toast(`Đã trả ${j.pushed} điểm${j.failed.length ? `, lỗi ${j.failed.length}: ${j.failed[0].email} – ${j.failed[0].error}` : ""}`); }
    catch (x){ toast(x.message); } return;
  }
  if (b.dataset.a === "grades"){ copyGrades(id); return; }
  if (b.dataset.a === "link"){ const u = location.origin + "/?assignment=" + id; try { await navigator.clipboard.writeText(u); toast("Đã chép link: " + u); } catch (x){ prompt("Link bài được giao", u); } return; }
  if (!confirm("Xoá bài được giao này? Bài làm và điểm của học sinh cho bài này cũng bị xoá.")) return;
  try { await api("/api/class?a=assignments&id=" + id, { method: "DELETE" }); loadAssignments(); } catch (x){ toast(x.message); }
});

// Chép điểm một bài (dạng bảng, phân cách bằng Tab) để dán vào Google Sheets hoặc nhập tay vào sổ điểm Classroom
async function copyGrades(aid){
  let d; try { d = await api("/api/class?a=progress&class=" + TC.cls.id); } catch (x){ toast(x.message); return; }
  const subs = new Map(d.subs.filter(s => s.assignment_id === aid).map(s => [s.email, s]));
  const cell = v => String(v === null || v === undefined ? "" : v).replace(/[\t\r\n]+/g, " ").trim();
  const ms = [...d.members].sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email, "vi"));
  const rows = ms.map(m => { const s = subs.get(m.email);
    return [m.name, m.email, s && s.total !== null ? s.total : "", s && s.comment ? s.comment : (!s || s.status !== "submitted" ? "Chưa nộp" : s.total === null ? "Chưa chấm" : "")].map(cell).join("\t"); });
  const text = ["Họ tên\tEmail\tĐiểm\tNhận xét", ...rows].join("\n");
  const done = () => toast(`Đã chép điểm ${ms.filter(m => { const s = subs.get(m.email); return s && s.total !== null; }).length}/${ms.length} học sinh · dán vào Google Sheets`);
  try { await navigator.clipboard.writeText(text); done(); }
  catch (e){ const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); done(); } catch (x){ toast("Không chép được, hãy dùng Tải CSV ở tab Tiến độ"); } ta.remove(); }
}

/* ---------- tiết học: luân phiên robot thật ---------- */
const LV = { st: null, now: null, at: 0, tick: 0, poll: 0 };
window.CLASS_SUBTABS.live = loadLive;
const mmss = s => `${String(Math.floor(s/60)).padStart(2, "0")}:${String(Math.max(0, s % 60)).padStart(2, "0")}`;
async function loadLive(){
  try { const j = await api("/api/class?a=live&class=" + TC.cls.id); LV.st = j.state; LV.now = j.now; LV.at = Date.now(); } catch (e){ toast(e.message); }
  if (!$("#lvGroups").value){
    const m = (await api("/api/class?a=members&class=" + TC.cls.id)).members, gs = [...new Set(m.map(x => x.group).filter(Boolean))];
    $("#lvGroups").value = (LV.st && LV.st.groups && LV.st.groups.length ? LV.st.groups : gs).join(", ");
  }
  if (LV.st && LV.st.minutes) $("#lvMinutes").value = LV.st.minutes;
  renderLive(); loadProgress($("#liveTable"));
  clearInterval(LV.tick); clearInterval(LV.poll);
  LV.tick = setInterval(() => { if ($("#vClass").hidden || TC.sub !== "live"){ clearInterval(LV.tick); clearInterval(LV.poll); return; } renderLive(); }, 1000);
  LV.poll = setInterval(() => { if (TC.sub === "live" && !$("#vClass").hidden && document.visibilityState === "visible") loadProgress($("#liveTable")); }, 10000);
}
function renderLive(){
  const el = $("#lvBoard"), n = LV.now;
  if (!n){ el.hidden = true; return; }
  const passed = Math.floor((Date.now() - LV.at)/1000), slot = n.minutes*60, rem = n.remaining - passed;
  // hết lượt → tự tính nhóm kế tiếp theo đồng hồ
  let i = n.round, r = rem; while (r <= 0){ r += slot; i++; }
  const g = n.groups[i % n.groups.length], nx = n.groups[(i + 1) % n.groups.length];
  el.innerHTML = `<div class="bar-lbl">Đang ở robot thật</div><div class="big">${esc(g)}</div><div class="clock${r <= 60 ? " warn" : ""}">${mmss(r)}</div><div class="muted">Tiếp theo: <b>${esc(nx)}</b> · ${n.minutes} phút mỗi nhóm · thứ tự: ${n.groups.map(esc).join(" → ")}</div>`;
  el.hidden = false;
}
async function saveLive(body){
  try { const j = await api("/api/class?a=live", { method: "POST", body: JSON.stringify(Object.assign({ class: TC.cls.id }, body)) }); LV.st = j.state; LV.now = j.now; LV.at = Date.now(); renderLive(); }
  catch (e){ toast(e.message); }
}
const lvGroups = () => $("#lvGroups").value.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
$("#lvStart").onclick = () => { const g = lvGroups(); if (!g.length) return toast("Hãy nhập thứ tự nhóm (VD: Nhóm 1, Nhóm 2)"); saveLive({ on: true, groups: g, minutes: +$("#lvMinutes").value, startedAt: new Date().toISOString() }); toast("Đã bắt đầu luân phiên robot thật"); };
$("#lvNext").onclick = () => {
  const n = LV.now; if (!n) return toast("Tiết học chưa bắt đầu");
  const passed = Math.floor((Date.now() - LV.at)/1000), slot = n.minutes*60; let i = n.round, r = n.remaining - passed; while (r <= 0){ r += slot; i++; }
  saveLive({ on: true, groups: n.groups, minutes: n.minutes, startedAt: new Date(Date.now() - (i + 1)*slot*1000).toISOString() });
};
$("#lvStop").onclick = () => { if (confirm("Kết thúc tiết học? Học sinh sẽ không còn thấy lịch luân phiên.")) saveLive({ on: false, groups: lvGroups(), minutes: +$("#lvMinutes").value }); };

/* ---------- phản hồi của học sinh ---------- */
const FB = { list: [] };
window.CLASS_SUBTABS.feedback = loadFeedback;
async function loadFeedback(){
  const el = $("#fbList");
  try { FB.list = (await api("/api/class?a=feedback&class=" + TC.cls.id)).feedback; } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; return; }
  if (!FB.list.length){ el.innerHTML = '<div class="empty">Chưa có góp ý nào từ học sinh lớp này.</div>'; return; }
  const by = new Map(); for (const f of FB.list){ if (!by.has(f.lesson_id)) by.set(f.lesson_id, []); by.get(f.lesson_id).push(f); }
  el.innerHTML = [...by].map(([lid, fs]) => { const avg = fs.reduce((x, f) => x + f.rating, 0)/fs.length;
    return `<div class="card fb"><div class="fbh"><b>${esc(lessonTitle(lid))}</b><span class="stars">${"★".repeat(Math.round(avg))}${"☆".repeat(5 - Math.round(avg))}</span><span class="muted">${avg.toFixed(1)}/5 · ${fs.length} lượt</span></div>
      <ul>${fs.filter(f => f.text).map(f => `<li><span class="stars sm">${"★".repeat(f.rating)}</span> ${esc(f.text)} <small class="muted">— ${esc(f.who || "")}, ${fmtDate(f.created_at)}</small></li>`).join("") || '<li class="muted">(chỉ chấm sao, không có lời góp ý)</li>'}</ul></div>`; }).join("");
}
$("#fbRefresh").onclick = loadFeedback;
$("#fbCopy").onclick = async () => {
  if (!FB.list.length) return toast("Chưa có góp ý để sao chép");
  const by = new Map(); for (const f of FB.list){ if (!by.has(f.lesson_id)) by.set(f.lesson_id, []); by.get(f.lesson_id).push(f); }
  const lines = [`Phản hồi của học sinh lớp "${TC.cls.name}" về JetBot Lab (${location.origin}):`];
  for (const [lid, fs] of by){
    const avg = fs.reduce((x, f) => x + f.rating, 0)/fs.length;
    lines.push(`\n- Bài "${lessonTitle(lid)}" (mã ${lid}): trung bình ${avg.toFixed(1)}/5 sao, ${fs.length} lượt.`);
    for (const f of fs.filter(f => f.text).slice(0, 25)) lines.push(`  • (${f.rating}★) ${f.text.replace(/\s+/g, " ")}`);
  }
  lines.push("\nYêu cầu: dựa trên các góp ý trên, hãy đề xuất rồi thực hiện cải tiến cho JetBot Lab (bài học, sa bàn, thử thách hoặc tính năng). Ưu tiên vấn đề được nhiều học sinh nhắc tới; giữ quy ước trong CLAUDE.md; thử trên trình duyệt có CSP trước khi commit.");
  const text = lines.join("\n");
  try { await navigator.clipboard.writeText(text); toast("Đã sao chép, dán vào Claude Code để cải tiến"); } catch (e){ prompt("Sao chép đoạn sau", text); }
};
