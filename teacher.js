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
  show("vClass"); subTab(TC.sub);
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
async function loadProgress(){
  const el = $("#progressTable");
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
  const d = PG.d, el = $("#progressTable"); if (!d) return;
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
  fillLessonSelect();
  const el = $("#assignList");
  try {
    const list = (await api("/api/class?a=assignments&class=" + TC.cls.id)).assignments;
    if (!list.length){ el.innerHTML = '<div class="empty">Chưa giao bài nào.</div>'; return; }
    const weeks = [...new Set(list.map(a => a.week_label || "Không ghi tuần"))];
    el.innerHTML = weeks.map(w => `<h3 class="wk">${esc(w)}</h3>` + list.filter(a => (a.week_label || "Không ghi tuần") === w).map(a => `<div class="row" data-id="${a.id}"><div></div>
      <div><b>${esc(a.title || lessonTitle(a.lesson_id))}</b><div class="a-meta">${a.period_label ? esc(a.period_label) + " · " : ""}${esc(lessonTitle(a.lesson_id))}${a.open_at ? " · mở " + fmtDate(a.open_at) : ""}${a.due_at ? " · hạn " + fmtDate(a.due_at) : ""} · ${a.submitted} đã nộp · ${a.completed} hoàn thành${a.gc_coursework_id ? " · đã đăng Classroom" : ""}</div></div>
      <div class="acts"><button data-a="link">Chép link</button><button data-a="del" class="danger">Xoá</button></div></div>`).join("")).join("");
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#asLesson").addEventListener("change", () => { const f = $("#fAssign"); if (!f.elements.title.dataset.touched) f.elements.title.value = lessonTitle($("#asLesson").value); });
$("#fAssign").elements.title.addEventListener("input", e => e.target.dataset.touched = "1");
$("#fAssign").addEventListener("submit", async e => {
  e.preventDefault(); const f = e.target, v = k => f.elements[k].value;
  const body = { class: TC.cls.id, lesson: v("lesson"), title: v("title") || lessonTitle(v("lesson")), week: v("week"), period: v("period"), open_at: fromLocalInput(v("open_at")), due_at: fromLocalInput(v("due_at")) };
  try { await api("/api/class?a=assignments", { method: "POST", body: JSON.stringify(body) }); toast("Đã giao bài"); f.elements.title.value = ""; delete f.elements.title.dataset.touched; loadAssignments(); if (window.afterAssign) afterAssign(); }
  catch (x){ toast(x.message); }
});
$("#assignList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = +b.closest(".row").dataset.id;
  if (b.dataset.a === "link"){ const u = location.origin + "/?assignment=" + id; try { await navigator.clipboard.writeText(u); toast("Đã chép link: " + u); } catch (x){ prompt("Link bài được giao", u); } return; }
  if (!confirm("Xoá bài được giao này? Bài làm và điểm của học sinh cho bài này cũng bị xoá.")) return;
  try { await api("/api/class?a=assignments&id=" + id, { method: "DELETE" }); loadAssignments(); } catch (x){ toast(x.message); }
});
