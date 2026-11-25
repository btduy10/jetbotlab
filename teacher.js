"use strict";
// Trang Giáo viên: lớp học, học sinh, giao bài. Dùng chung $, esc, api, toast, msg, show, VIEWS, DATA của admin.js.
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
      <div><b>${esc(c.name)}${c.archived ? '<span class="badge">đã lưu trữ</span>' : ""}<span class="badge code">${esc(c.join_code || "")}</span></b>
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
  show("vClass"); renderClsBox(); subTab(TC.sub);
}
/* ---------- mã lớp + lưu ảnh trên Google Drive ---------- */
const joinLink = c => location.origin + "/?join=" + c.join_code;
async function copyText(text, ok){
  try { await navigator.clipboard.writeText(text); toast(ok); }
  catch (e){ const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); toast(ok); } catch (x){ prompt("Sao chép", text); } ta.remove(); }
}
function renderClsBox(){
  const el = $("#clsBox"), c = TC.cls;
  const drive = ME_USER.drive
    ? `<span class="ok">✓ Đã kết nối Google Drive</span>${c.drive_link ? ` · <a href="${esc(c.drive_link)}" target="_blank" rel="noopener">Thư mục ảnh của lớp ↗</a>` : ""}${ME_USER.driveLink ? ` · <a href="${esc(ME_USER.driveLink)}" target="_blank" rel="noopener">Thư mục gốc ↗</a>` : ""}`
    : `<span class="muted">Kết nối Google Drive để học sinh nộp được ảnh (lưu trong Drive của bạn).</span> <a class="btn" href="/api/auth?a=google&amp;drive=1&amp;next=${encodeURIComponent("/admin?tab=classes")}">Kết nối Google Drive</a>`;
  el.innerHTML = `<div class="joinbox"><span class="bar-lbl">Mã lớp</span><b class="jcode">${esc(c.join_code || "——")}</b>
      <button class="btn" id="jcCopyLink">Chép link mời</button><button class="btn ghost" id="jcCopyCode">Chép mã</button>
      <label class="check"><input type="checkbox" id="jcOpen"${c.join_open !== false ? " checked" : ""}> Cho học sinh tự vào lớp</label>
      <button class="btn ghost" id="jcReset">Đổi mã</button></div>
    <div class="drivebox">${drive}</div>`;
  $("#jcCopyLink").onclick = () => copyText(joinLink(c), "Đã chép link mời: " + joinLink(c));
  $("#jcCopyCode").onclick = () => copyText(c.join_code, "Đã chép mã lớp " + c.join_code);
  $("#jcOpen").onchange = async e => { try { const j = await api("/api/class?a=class_code", { method: "POST", body: JSON.stringify({ class: c.id, open: e.target.checked }) }); c.join_open = j.join_open; toast(j.join_open ? "Học sinh có thể tự vào lớp bằng mã" : "Đã khoá: học sinh không tự vào lớp được nữa"); } catch (x){ e.target.checked = !e.target.checked; toast(x.message); } };
  $("#jcReset").onclick = async () => { if (!confirm("Đổi mã lớp? Mã và link mời cũ sẽ không dùng được nữa (học sinh đã vào lớp vẫn giữ nguyên).")) return;
    try { const j = await api("/api/class?a=class_code", { method: "POST", body: JSON.stringify({ class: c.id, reset: true }) }); c.join_code = j.join_code; renderClsBox(); toast("Mã lớp mới: " + j.join_code); } catch (x){ toast(x.message); } };
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
        <td>${x.joined ? '<span class="ok">✓ đã vào lớp</span>' : '<span class="muted">chưa đăng nhập</span>'}</td>
        <td><button class="linkbtn danger" data-a="del">Xoá</button></td></tr>`).join("") + "</tbody></table>" : `<div class="empty">Lớp chưa có học sinh. Gửi <b>link mời</b> hoặc <b>mã lớp ${esc(TC.cls.join_code || "")}</b> cho học sinh, hoặc dán danh sách email ở trên.</div>`;
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
    const tip = `${s.status === "submitted" ? "Đã nộp" + (late ? " (muộn)" : "") : "Đang làm"} · ${s.runs_count} lần chạy · ${Math.round(s.active_seconds/60)} phút${s.photos ? ` · ${s.photos} ảnh` : ""}${s.best ? ` · tốt nhất ${(s.best.reachT ?? s.best.time).toFixed(1)} s` : ""}${s.robot_verified ? " · đã kiểm chứng robot thật" : ""}${s.total !== null ? (s.returned_at ? " · đã trả bài" : " · chưa trả bài") : ""}`;
    return `<td class="pc ${cls}${late ? " late" : ""}" title="${esc(tip)}"><a href="/?review=${s.id}" target="_blank" rel="noopener"><span class="ic">${icon}</span>${s.total !== null ? `<b class="${s.returned_at ? "ret" : "draft"}">${s.total}</b>` : ""}<small>${s.runs_count}× · ${Math.round(s.active_seconds/60)}′${s.photos ? ` · 📷${s.photos}` : ""}${s.robot_verified ? " · robot thật ✓" : ""}</small></a></td>`;
  };
  const head = `<tr><th>Nhóm</th><th>Học sinh</th>${as.map(a => `<th title="${esc(lessonTitle(a.lesson_id))}">${esc(a.title || lessonTitle(a.lesson_id))}<small>${esc([a.period_label, a.due_at ? "hạn " + fmtDate(a.due_at) : ""].filter(Boolean).join(" · "))}</small></th>`).join("")}<th>Gợi ý</th></tr>`;
  const rows = d.members.map(m => { const f = studentFlags(m, as, map, med);
    return `<tr><td class="grp">${esc(m.group || "")}</td><td><b>${esc(m.name || m.email)}</b><small>${esc(m.email)}${m.joined ? "" : " · chưa đăng nhập"}</small></td>${as.map(a => cell(a, m)).join("")}
      <td class="flags">${f.help.length ? `<span class="flag help" title="${esc(f.help.join(", "))}">Cần hỗ trợ</span>` : ""}${f.up ? '<span class="flag up">Có thể nâng cấp độ</span>' : ""}</td></tr>`; }).join("");
  const foot = `<tr class="sum"><td></td><td>Tổng</td>${as.map(a => { const ss = d.subs.filter(s => s.assignment_id === a.id); return `<td>${ss.filter(s => s.status === "submitted").length}/${d.members.length} nộp · ${ss.filter(s => s.completed).length} ★</td>`; }).join("")}<td></td></tr>`;
  el.innerHTML = `<div class="tblwrap"><table class="tbl prog"><thead>${head}</thead><tbody>${rows}${foot}</tbody></table></div>
    <p class="a-hint">— chưa mở · ◐ đang làm · ✓ đã nộp · ★ đạt tiêu chí · số là điểm /10 (<b class="draft">nghiêng</b> = chưa trả bài, học sinh chưa thấy) · “3× · 12′ · 📷2” = 3 lần chạy, 12 phút, 2 ảnh. Bấm vào ô để xem code, ảnh, chạy lại và chấm.</p>`;
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
      <div><b>${esc(a.title || lessonTitle(a.lesson_id))}</b><div class="a-meta">${a.period_label ? esc(a.period_label) + " · " : ""}${esc(lessonTitle(a.lesson_id))}${a.open_at ? " · mở " + fmtDate(a.open_at) : ""}${a.due_at ? " · hạn " + fmtDate(a.due_at) : ""} · ${a.submitted} đã nộp · ${a.completed} hoàn thành · ${a.graded} đã chấm${a.graded ? ` (${a.returned} đã trả)` : ""}${a.need_photo ? " · 📷 cần nộp ảnh" : ""}</div>${a.instructions ? `<div class="a-meta instr">${esc(a.instructions)}</div>` : ""}</div>
      <div class="acts">${a.graded > a.returned ? `<button data-a="return" class="primary">Trả bài (${a.graded - a.returned})</button>` : ""}<button data-a="link">Chép link</button><button data-a="grades" title="Chép bảng Họ tên · Email · Điểm · Nhận xét để dán vào Google Sheets">Chép điểm</button><button data-a="del" class="danger">Xoá</button></div></div>`).join("")).join("");
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
  const body = { class: TC.cls.id, lesson: v("lesson"), title: v("title") || lessonTitle(v("lesson")), week: v("week"), period: v("period"),
    instructions: v("instructions"), need_photo: f.elements.need_photo.checked, open_at: fromLocalInput(v("open_at")), due_at: fromLocalInput(v("due_at")) };
  try { await api("/api/class?a=assignments", { method: "POST", body: JSON.stringify(body) }); toast("Đã giao bài");
    f.elements.title.value = ""; f.elements.instructions.value = ""; delete f.elements.title.dataset.touched; loadAssignments(); if (window.afterAssign) afterAssign(); }
  catch (x){ toast(x.message); }
});
$("#assignList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const id = +b.closest(".row").dataset.id;
  if (b.dataset.a === "return"){
    if (!confirm("Trả bài cho các em đã được chấm? Sau khi trả, học sinh sẽ thấy điểm và nhận xét.")) return;
    try { const j = await api("/api/class?a=return", { method: "POST", body: JSON.stringify({ assignment: id }) }); toast(`Đã trả bài cho ${j.returned} học sinh`); loadAssignments(); } catch (x){ toast(x.message); }
    return;
  }
  if (b.dataset.a === "grades"){ copyGrades(id); return; }
  if (b.dataset.a === "link"){ const u = location.origin + "/?assignment=" + id; try { await navigator.clipboard.writeText(u); toast("Đã chép link: " + u); } catch (x){ prompt("Link bài được giao", u); } return; }
  if (!confirm("Xoá bài được giao này? Bài làm và điểm của học sinh cho bài này cũng bị xoá.")) return;
  try { await api("/api/class?a=assignments&id=" + id, { method: "DELETE" }); loadAssignments(); } catch (x){ toast(x.message); }
});

// Chép điểm một bài (dạng bảng, phân cách bằng Tab) để dán vào Google Sheets / sổ điểm của trường
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

/* ---------- bảng tin lớp ---------- */
window.CLASS_SUBTABS.news = loadNews;
async function loadNews(){
  const el = $("#newsList");
  try {
    const list = (await api("/api/class?a=announcements&class=" + TC.cls.id)).list;
    el.innerHTML = list.length ? list.map(n => `<div class="row" data-id="${n.id}"><div></div><div><div class="newstext">${esc(n.text)}</div><div class="a-meta">${esc(fmtDate(n.created_at))}</div></div>
      <div class="acts"><button class="danger" data-a="del">Xoá</button></div></div>`).join("") : '<div class="empty">Chưa có thông báo nào.</div>';
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#fNews").addEventListener("submit", async e => {
  e.preventDefault(); const ta = e.target.elements.text;
  try { await api("/api/class?a=announcements", { method: "POST", body: JSON.stringify({ class: TC.cls.id, text: ta.value }) }); ta.value = ""; toast("Đã đăng thông báo cho lớp"); loadNews(); }
  catch (x){ toast(x.message); }
});
$("#newsList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a=del]"); if (!b || !confirm("Xoá thông báo này?")) return;
  try { await api("/api/class?a=announcements&id=" + b.closest(".row").dataset.id, { method: "DELETE" }); loadNews(); } catch (x){ toast(x.message); }
});

/* ---------- admin: thư mục Drive của giáo viên + kiểm tra cấu hình ---------- */
window.loadAdminExtras = async () => {
  const dv = $("#driveOverview"), cf = $("#configList");
  try {
    const j = await api("/api/class?a=drive_overview");
    dv.innerHTML = j.teachers.length ? `<table class="tbl"><thead><tr><th>Giáo viên</th><th>Google Drive</th><th>Lớp (thư mục ảnh)</th></tr></thead><tbody>` + j.teachers.map(t => {
      const cls = j.classes.filter(c => c.teacher_id === t.id);
      return `<tr><td><b>${esc(t.name || t.email)}</b><small class="muted"> ${esc(t.email)}</small></td>
        <td>${t.connected ? `<span class="ok">✓ đã kết nối</span>` : '<span class="muted">chưa kết nối</span>'}${t.root_link ? ` · <a href="${esc(t.root_link)}" target="_blank" rel="noopener">Thư mục gốc ↗</a>` : ""}${t.shared.length ? `<small class="muted"> · đã chia sẻ cho ${esc(t.shared.join(", "))}</small>` : ""}</td>
        <td>${cls.length ? cls.map(c => c.drive_link ? `<a href="${esc(c.drive_link)}" target="_blank" rel="noopener">${esc(c.name)} ↗</a>` : `<span class="muted">${esc(c.name)}</span>`).join(" · ") : '<span class="muted">—</span>'}</td></tr>`; }).join("") + "</tbody></table>"
      : '<div class="empty">Chưa có giáo viên nào.</div>';
  } catch (e){ dv.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
  const NAMES = { google: "Đăng nhập Google", db: "Cơ sở dữ liệu (Neon)", auth_secret: "Khoá ký phiên AUTH_SECRET", token_key: "Khoá mã hoá TOKEN_ENC_KEY", admins: "Email admin", content: "Repo nội dung (bài học, sa bàn)" };
  try {
    const j = await api("/api/class?a=config");
    cf.innerHTML = j.checks.map(c => `<li class="${c.ok ? "ok" : "bad"}"><b>${c.ok ? "✓" : "✗"} ${esc(NAMES[c.key] || c.key)}</b>${c.detail ? ` <small class="muted">${esc(c.detail)}</small>` : ""}${c.ok ? "" : `<div class="muted">${esc(c.fix)}</div>`}</li>`).join("");
  } catch (e){ cf.innerHTML = `<li class="bad">${esc(e.message)}</li>`; }
};

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

