"use strict";
// Tài khoản trên trang học (đăng nhập Google), dùng chung biến toàn cục của app.js ($, t, esc, attr, toast…).
const ACC = { me: null, google: false };
const G_ICON = '<svg width="14" height="14" viewBox="0 0 18 18" aria-hidden="true"><path fill="#4285F4" d="M17.6 9.2c0-.6-.1-1.2-.2-1.7H9v3.3h4.8a4.1 4.1 0 0 1-1.8 2.7v2.2h2.9c1.7-1.6 2.7-3.9 2.7-6.5z"/><path fill="#34A853" d="M9 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.5-1.8.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H.9v2.3A9 9 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.9 10.7a5.4 5.4 0 0 1 0-3.4V5H.9a9 9 0 0 0 0 8l3-2.3z"/><path fill="#EA4335" d="M9 3.6c1.3 0 2.5.5 3.5 1.4l2.6-2.6A9 9 0 0 0 .9 5l3 2.3C4.6 5.2 6.6 3.6 9 3.6z"/></svg>';

async function api(path, opts = {}){
  const r = await fetch(path, Object.assign({ credentials: "same-origin" }, opts, { headers: Object.assign({ "Content-Type": "application/json" }, opts.headers || {}) }));
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok){ const e = new Error(j.error || "HTTP " + r.status); e.status = r.status; throw e; }
  return j;
}
function renderUserBox(){
  const el = $("#userBox"), me = ACC.me;
  if (!me){
    const next = encodeURIComponent(location.pathname + location.search);
    el.innerHTML = ACC.google ? `<a class="ubtn" href="/api/auth?a=google&amp;next=${next}">${G_ICON}<span data-i18n="login">${esc(t("login"))}</span></a>` : "";
    return;
  }
  el.innerHTML = (me.role !== "student" ? `<a class="ubtn ghost" href="/admin" data-i18n="teacherArea">${esc(t("teacherArea"))}</a>` : "")
    + `<span class="uname" title="${attr(me.email)}">${esc(me.name || me.email)}</span><button class="ubtn ghost" id="bSignOut" data-i18n="logout">${esc(t("logout"))}</button>`;
  $("#bSignOut").onclick = async () => { try { await api("/api/auth?a=logout", { method: "POST" }); } catch (e) {} ACC.me = null; renderUserBox(); document.dispatchEvent(new Event("jbl:auth")); };
}
async function loadMe(){
  try { const j = await api("/api/auth?a=me"); ACC.me = j.user; ACC.google = j.google; } catch (e) { ACC.me = null; ACC.google = false; }
  renderUserBox(); document.dispatchEvent(new Event("jbl:auth"));
  const err = new URLSearchParams(location.search).get("login_error"); if (err) toast(err);
}
/* ---------- bài được giao ---------- */
const AS = { list: [], cur: null, lastSaved: "", saveT: 0, savedAt: null, saving: false, failed: false, deep: new URLSearchParams(location.search).get("assignment") };
const fmtWhen = d => new Date(d).toLocaleString(LANG === "en" ? "en-GB" : "vi-VN", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
const nbNow = () => CELLS.map(c => c.meta ? [c.type, c.src, null, c.meta] : [c.type, c.src]);
function asState(a){
  if (a.status === "submitted") return a.due_at && a.submitted_at && new Date(a.submitted_at) > new Date(a.due_at) ? ["late", t("asSubmitted") + " · " + t("asOverdue")] : ["sub", t("asSubmitted")];
  if (a.due_at && new Date(a.due_at) < new Date()) return ["late", t("asOverdue")];
  return a.status ? ["", t("asStarted")] : ["", t("asNew")];
}
async function loadAssignments(){
  try { AS.list = ACC.me ? (await api("/api/class?a=my")).assignments : []; } catch (e) { AS.list = []; }
  $("#rAs").hidden = !ACC.me;
  $("#asDot").hidden = !AS.list.some(a => !a.status && !(a.due_at && new Date(a.due_at) < new Date()));
  if (DRAWER === "as") renderDrawer("as");
}
window.renderAssignDrawer = el => {
  if (!AS.list.length){ el.innerHTML = `<h3>${esc(t("asTitle"))}</h3><p class="drawer-empty">${esc(t("asEmpty"))}</p>`; return; }
  const weeks = [...new Set(AS.list.map(a => a.week_label || t("asNoWeek")))];
  el.innerHTML = `<h3>${esc(t("asTitle"))}</h3>` + weeks.map(w => `<h4 class="lvl">${esc(w)}</h4>` + AS.list.filter(a => (a.week_label || t("asNoWeek")) === w).map(a => {
    const [cls, label] = asState(a), title = a.title || (findLesson(a.lesson_id) || {}).title || a.lesson_id;
    return `<button class="lesson asg" data-as="${a.id}"><em>${esc(a.class_name)}${a.period_label ? " · " + esc(a.period_label) : ""}<span class="st ${cls}">· ${esc(label)}</span>${a.completed ? `<span class="st done"> ✓ ${esc(t("asCompleted"))}</span>` : ""}</em>
      <b>${esc(title)}</b><span>${a.due_at ? esc(t("asDue")) + " " + esc(fmtWhen(a.due_at)) : ""}${a.total !== null ? " · " + esc(t("asScore")) + " " + a.total + "/10" : ""}</span></button>`;
  }).join("")).join("");
};
$("#rAs").onclick = () => openDrawer("as");
drawer.addEventListener("click", e => { const b = e.target.closest(".asg"); if (b) openAssignment(+b.dataset.as); });

async function openAssignment(id){
  if (!ACC.me) return toast(t("asNeedLogin"));
  await flushAssignment();
  let j; try { j = await api("/api/class?a=sub&assignment=" + id); } catch (e) { return toast(e.message); }
  await REMOTE_READY;
  const a = j.assignment, s = j.submission, cells = s && s.notebook ? sanitizeCells(s.notebook) : null;
  if (!openLesson(a.lesson_id, cells && cells.length ? cells : null)) return toast(t("asNoLesson"));
  const L = findLesson(a.lesson_id);
  AS.cur = { id: a.id, lesson: a.lesson_id, title: a.title || (L ? lessonIn(L, LANG).title : a.lesson_id), cls: a.class_name, due: a.due_at,
    status: s ? s.status : null, submitted_at: s ? s.submitted_at : null, completed: s ? s.completed : false, total: s ? s.total : null, comment: s ? s.comment : "" };
  AS.lastSaved = JSON.stringify(nbNow()); AS.savedAt = null; AS.failed = false;
  renderAsBar(); if (innerWidth < 900) closeDrawer();
}
function leaveAssignment(){ clearTimeout(AS.saveT); AS.cur = null; renderAsBar(); }
function renderAsBar(){
  const el = $("#asBar"), a = AS.cur;
  if (!a){ el.hidden = true; el.innerHTML = ""; return; }
  const [cls, label] = asState({ status: a.status, due_at: a.due, submitted_at: a.submitted_at });
  el.innerHTML = `<span class="lbl">${esc(t("asLabel"))}</span><b>${esc(a.title)}</b><span class="muted">${esc(a.cls)}${a.due ? " · " + esc(t("asDue")) + " " + esc(fmtWhen(a.due)) : ""}</span>`
    + `<span class="st ${cls}">${esc(label)}</span>${a.completed ? `<span class="st done">✓ ${esc(t("asCompleted"))}</span>` : ""}${a.total !== null && a.total !== undefined ? `<span class="st sub">${esc(t("asScore"))} ${a.total}/10</span>` : ""}`
    + `<span class="grow"></span><span class="saved">${esc(AS.saving ? t("asSaving") : AS.failed ? t("asSaveFail") : AS.savedAt ? t("asSavedAt").replace("{t}", AS.savedAt) : "")}</span>`
    + `<button class="go" id="asSubmit">${esc(t(a.status === "submitted" ? "asResubmit" : "asSubmit"))}</button><button id="asExit">${esc(t("asExit"))}</button>`
    + (a.comment ? `<p class="cmt"><b>${esc(t("asComment"))}:</b> ${esc(a.comment)}</p>` : "");
  el.hidden = false;
  $("#asSubmit").onclick = async () => { if (confirm(t("asSubmitConfirm"))) await saveAssignment(true); };
  $("#asExit").onclick = async () => { await flushAssignment(); leaveAssignment(); };
}
async function saveAssignment(final){
  const a = AS.cur; if (!a) return;
  clearTimeout(AS.saveT);
  const nb = nbNow(), js = JSON.stringify(nb);
  if (!final && js === AS.lastSaved) return;
  AS.saving = true; renderAsBar();
  try {
    const j = await api("/api/class?a=" + (final ? "submit" : "save"), { method: "POST", body: JSON.stringify({ assignment: a.id, notebook: nb }) });
    AS.lastSaved = js; AS.failed = false; AS.savedAt = new Date().toLocaleTimeString(LANG === "en" ? "en-GB" : "vi-VN", { hour: "2-digit", minute: "2-digit" });
    if (AS.cur === a){ a.status = j.submission.status; a.submitted_at = j.submission.submitted_at; }
    if (final){ toast(t("asSubmittedToast")); loadAssignments(); }
  } catch (e){ AS.failed = true; if (final) toast(e.message); else AS.saveT = setTimeout(() => saveAssignment(false), 30000); }
  AS.saving = false; renderAsBar();
}
const flushAssignment = () => AS.cur && JSON.stringify(nbNow()) !== AS.lastSaved ? saveAssignment(false) : Promise.resolve();
document.addEventListener("jbl:save", () => {
  if (RV.d && (!CUR_LESSON || CUR_LESSON.id !== RV.d.submission.lesson_id)){ RV.d = null; $("#asBar").classList.remove("review"); renderAsBar(); }
  if (!AS.cur) return;
  if (!CUR_LESSON || CUR_LESSON.id !== AS.cur.lesson){ leaveAssignment(); return; }   // em đã mở bài khác
  clearTimeout(AS.saveT); AS.saveT = setTimeout(() => saveAssignment(false), 20000);
});
document.addEventListener("jbl:run", () => { if (AS.cur) saveAssignment(false); });
// đóng tab / chuyển tab: gửi nốt bản đang sửa
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState !== "hidden" || !AS.cur) return;
  const nb = nbNow(), js = JSON.stringify(nb); if (js === AS.lastSaved || js.length > 60000) return;
  fetch("/api/class?a=save", { method: "POST", keepalive: true, credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assignment: AS.cur.id, notebook: nb }) }).then(() => { AS.lastSaved = js; }).catch(() => {});
});
/* ---------- tiến độ: gửi lượt chạy + thời gian làm bài ---------- */
let lastAct = Date.now();
for (const ev of ["keydown", "pointerdown", "wheel"]) addEventListener(ev, () => { lastAct = Date.now(); }, { capture: true, passive: true });
document.addEventListener("jbl:run", e => {
  lastAct = Date.now();
  if (!AS.cur || !CUR_LESSON || CUR_LESSON.id !== AS.cur.lesson) return;
  const d = e.detail, a = AS.cur;
  api("/api/class?a=run", { method: "POST", body: JSON.stringify({ assignment: a.id, ok: d.ok, completed: d.completed === true, metrics: d.metrics }) })
    .then(() => { if (d.completed === true && AS.cur === a && !a.completed){ a.completed = true; renderAsBar(); loadAssignments(); } }).catch(() => {});
});
setInterval(() => {
  if (!AS.cur || document.visibilityState !== "visible" || Date.now() - lastAct > 3*60e3) return;
  api("/api/class?a=beat", { method: "POST", body: JSON.stringify({ assignment: AS.cur.id, seconds: 60 }) }).catch(() => {});
}, 60e3);

/* ---------- giáo viên xem và chấm bài làm: /?review=<mã bài làm> ---------- */
const RV = { id: +new URLSearchParams(location.search).get("review") || null, d: null };
const keyT = m => m && (m.reachT !== null && m.reachT !== undefined ? m.reachT : m.time);
function rvSuggest(d){
  const s = d.submission, b = s.best, cr = CUR_LESSON && CUR_LESSON.criteria;
  const task = s.completed ? 4 : b && b.reached ? 3 : s.runs_count > 0 ? 2 : 0;
  let optim = null;
  if (cr && b && (cr.refTime || cr.refDistance)){
    const rs = []; if (cr.refTime) rs.push(cr.refTime/Math.max(0.1, keyT(b))); if (cr.refDistance) rs.push(cr.refDistance/Math.max(0.01, b.dist));
    optim = Math.round(4*Math.min(1, rs.reduce((x, y) => x + y, 0)/rs.length)*2)/2;
  }
  const code = CELLS.filter(c => c.type === "code" && !(c.meta && c.meta.editable === false)).map(c => c.src).join("\n"), lines = code.split("\n").filter(l => l.trim() && !l.trim().startsWith("#"));
  const cq = Math.min(4, 2 + (/\b(def|for|while)\b/.test(code) ? 1 : 0) + (/#/.test(code) ? 0.5 : 0) + (lines.length && lines.length <= 40 ? 0.5 : 0));
  return { task, optim, code: lines.length ? cq : 0 };
}
function renderReview(){
  const el = $("#asBar"), d = RV.d; if (!d){ el.hidden = true; return; }
  const s = d.submission, g = d.grade, sug = rvSuggest(d), b = s.best;
  const sel = (k, v) => `<select data-k="${k}">${[0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map(n => `<option${n === v ? " selected" : ""}>${n}</option>`).join("")}</select>`;
  const cur = g ? g.scores : { task: sug.task, optim: sug.optim === null ? 2 : sug.optim, code: sug.code };
  const late = s.submitted_at && s.due_at && new Date(s.submitted_at) > new Date(s.due_at);
  el.innerHTML = `<span class="lbl">${esc(t("rvLabel"))}</span><b>${esc(s.student.name || s.student.email)}</b><span class="muted">${esc(s.student.email)} · ${esc(s.title || s.lesson_id)}</span>`
    + `<span class="st ${s.status === "submitted" ? (late ? "late" : "sub") : ""}">${esc(s.status === "submitted" ? t("asSubmitted") + " " + fmtWhen(s.submitted_at) + (late ? " · " + t("asOverdue") : "") : t("asStarted"))}</span>`
    + (s.completed ? `<span class="st done">✓ ${esc(t("asCompleted"))}</span>` : "")
    + `<span class="muted">${esc(t("rvStats").replace("{n}", s.runs_count).replace("{m}", Math.round(s.active_seconds/60)))}${b ? " · " + esc(t("rvBest").replace("{t}", (+keyT(b)).toFixed(1)).replace("{d}", (+b.dist).toFixed(2)).replace("{k}", b.coll)) : ""}</span>`
    + `<div class="rubric">`
    + `<label>${esc(t("rvTask"))} ${sel("task", cur.task)}<small>${esc(t("rvSug"))} ${sug.task}</small></label>`
    + `<label>${esc(t("rvOptim"))} ${sel("optim", cur.optim)}<small>${esc(t("rvSug"))} ${sug.optim === null ? "—" : sug.optim}</small></label>`
    + `<label>${esc(t("rvCode"))} ${sel("code", cur.code)}<small>${esc(t("rvSug"))} ${sug.code}</small></label>`
    + `<b class="total" id="rvTotal"></b></div>`
    + `<textarea id="rvComment" rows="2" placeholder="${attr(t("rvCommentPh"))}">${esc(g ? g.comment : "")}</textarea>`
    + `<span class="grow"></span><span class="saved" id="rvMsg">${g ? esc(t("rvGraded").replace("{t}", fmtWhen(g.graded_at))) : ""}</span>`
    + `<button class="go" id="rvSave">${esc(t("rvSave"))}</button>${s.gc ? `<button id="rvPush">${esc(t("rvPush"))}</button>` : ""}`
    + `<details class="runs"><summary>${esc(t("rvRuns"))} (${d.runs.length})</summary><ul>${d.runs.map(r => `<li class="${r.completed ? "ok" : ""}">${esc(fmtWhen(r.at))} · ${r.completed ? "✓" : r.ok ? "•" : "✗"} ${esc(t("critStats").replace("{t}", (+keyT(r.metrics)).toFixed(1)).replace("{d}", (+r.metrics.dist).toFixed(2)).replace("{k}", r.metrics.coll))}</li>`).join("")}</ul></details>`;
  el.hidden = false; el.classList.add("review");
  const total = () => { const v = k => +el.querySelector(`select[data-k=${k}]`).value; $("#rvTotal").textContent = t("rvTotal").replace("{n}", (Math.round((v("task") + v("optim") + v("code"))/12*100)/10).toFixed(1)); };
  el.querySelectorAll("select").forEach(x => x.onchange = total); total();
  $("#rvSave").onclick = async () => {
    const v = k => +el.querySelector(`select[data-k=${k}]`).value;
    try { const j = await api("/api/class?a=grade", { method: "POST", body: JSON.stringify({ submission: s.id, scores: { task: v("task"), optim: v("optim"), code: v("code") }, comment: $("#rvComment").value }) });
      RV.d.grade = { scores: { task: v("task"), optim: v("optim"), code: v("code") }, total: j.total, comment: $("#rvComment").value, graded_at: new Date().toISOString() }; toast(t("rvSaved").replace("{n}", j.total)); renderReview(); }
    catch (e){ toast(e.message); }
  };
  if ($("#rvPush")) $("#rvPush").onclick = () => window.pushGrade && pushGrade(s.id);
}
window.pushGrade = async sid => {
  if (!RV.d || !RV.d.grade) return toast(t("rvPushFirst"));
  try { await api("/api/class?a=gc_grade", { method: "POST", body: JSON.stringify({ submission: sid }) }); toast(t("rvPushed")); } catch (e){ toast(e.message); }
};
async function openReview(){
  if (!ACC.me || ACC.me.role === "student") return toast(t("rvNoRight"));
  let j; try { j = await api("/api/class?a=review&submission=" + RV.id); } catch (e) { return toast(e.message); }
  await REMOTE_READY;
  const cells = j.submission.notebook ? sanitizeCells(j.submission.notebook) : null;
  if (!openLesson(j.submission.lesson_id, cells && cells.length ? cells : null)) return toast(t("asNoLesson"));
  RV.d = j; renderReview();
}

document.addEventListener("jbl:auth", async () => {
  if (RV.id && !RV.d){ openReview(); return; }
  await loadAssignments();
  if (!ACC.me) leaveAssignment();
  if (AS.deep){ const id = +AS.deep; AS.deep = null; if (ACC.me) openAssignment(id); else toast(t("asNeedLogin")); }
});

loadMe();
