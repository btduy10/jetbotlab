"use strict";
// Trang quản trị JetBot Lab: thêm / sửa bài học và sa bàn, lưu vào repo dữ liệu qua /api.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BUILTIN_MAPS = [["open", "Sân trống · lưới 10 cm"], ["line", "Dò line · đường đua"], ["obst", "Vật cản · Lidar"], ["maze", "Mê cung · bám tường"], ["arena", "Tránh vật cản AI · camera"]];
const ZONE_HEX = { red: "#d8403a", green: "#3fa34d", blue: "#2f6fd0", yellow: "#e8b923" };
let DATA = { version: 1, lessons: [], maps: [] }, SHA = null, TAB = "lessons";

let toastT;
function toast(s){ const el = $("#toast"); el.textContent = s; el.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove("on"), 2600); }
function msg(el, text, kind){ el.textContent = text || ""; el.className = "msg" + (kind ? " " + kind : ""); }
async function api(path, opts = {}){
  const r = await fetch(path, Object.assign({ credentials: "same-origin" }, opts, { headers: Object.assign({ "Content-Type": "application/json" }, opts.headers || {}) }));
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok){ const e = new Error(j.error || "Lỗi " + r.status); e.status = r.status; if (r.status === 401) showLogin(); throw e; }
  return j;
}
const slug = s => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/gi, "d").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "muc";
const uniqueId = (base, list, self) => { let id = base, n = 2; while (list.some(x => x.id === id && x !== self)) id = (base.slice(0, 36) + "-" + n++); return id; };

/* ---------- khung trang ---------- */
const VIEWS = ["vLogin", "vLessons", "vMaps", "vLessonEdit", "vMapEdit", "vTeachers"];
let ME_USER = null;
function show(v){ VIEWS.forEach(id => $("#" + id).hidden = id !== v); window.scrollTo(0, 0); }
function showLogin(text){ $("#tabs").hidden = true; $("#bLogout").hidden = !ME_USER; $("#who").textContent = ME_USER ? ME_USER.email || ME_USER.name : ""; show("vLogin"); if (text) msg($("#loginMsg"), text, "err"); }
function showTab(tab){
  TAB = tab; $("#tabs").hidden = false; $("#bLogout").hidden = false;
  $$("#tabs button").forEach(b => b.setAttribute("aria-pressed", b.dataset.tab === tab));
  if (tab === "lessons"){ renderLessons(); show("vLessons"); }
  else if (tab === "maps"){ renderMaps(); show("vMaps"); }
  else if (tab === "teachers"){ show("vTeachers"); loadTeachers(); }
  else if (window.TEACHER_TABS && TEACHER_TABS[tab]) TEACHER_TABS[tab]();
}
$("#tabs").addEventListener("click", e => { const b = e.target.closest("button"); if (b) showTab(b.dataset.tab); });
$$("[data-close]").forEach(b => b.onclick = () => showTab(TAB));

async function loadData(){
  const j = await api("/api/content?fresh=1");
  DATA = Object.assign({ version: 1, lessons: [], maps: [] }, j.content); SHA = j.sha;
}
async function saveData(){
  try {
    const j = await api("/api/content", { method: "PUT", body: JSON.stringify({ content: DATA, sha: SHA }) });
    SHA = j.sha; DATA = j.content; return true;
  } catch (e){
    toast(e.message);
    if (e.status === 409){ await loadData(); showTab(TAB); }
    return false;
  }
}

$("#fLogin").addEventListener("submit", async e => {
  e.preventDefault();
  const f = new FormData(e.target), btn = e.target.querySelector("button");
  btn.disabled = true; msg($("#loginMsg"), "Đang đăng nhập…");
  try {
    await api("/api/auth?a=login", { method: "POST", body: JSON.stringify({ username: f.get("username"), password: f.get("password") }) });
    e.target.reset(); msg($("#loginMsg"), ""); await boot();
  } catch (x){ msg($("#loginMsg"), x.message, "err"); }
  btn.disabled = false;
});
$("#bLogout").onclick = async () => { try { await api("/api/auth?a=logout", { method: "POST" }); } catch (e) {} ME_USER = null; showLogin(); };

/* ---------- giáo viên (chỉ admin) ---------- */
async function loadTeachers(){
  const el = $("#teacherList");
  try {
    const j = await api("/api/class?a=teachers");
    el.innerHTML = j.teachers.length ? j.teachers.map(t => `<div class="row"><div></div><div><b>${esc(t.email)}</b><div class="a-meta">${esc(t.name || "chưa đăng nhập lần nào")}${t.last_login ? " · đăng nhập " + new Date(t.last_login).toLocaleString("vi-VN") : ""}</div></div>
      <div class="acts"><button class="danger" data-email="${esc(t.email)}">Bỏ quyền</button></div></div>`).join("") : '<div class="empty">Chưa có giáo viên nào.</div>';
  } catch (e){ el.innerHTML = `<div class="empty">${esc(e.message)}</div>`; }
}
$("#fTeacher").addEventListener("submit", async e => {
  e.preventDefault(); const email = e.target.elements.email.value.trim();
  try { await api("/api/class?a=teachers", { method: "POST", body: JSON.stringify({ email }) }); e.target.reset(); toast("Đã cấp quyền giáo viên"); loadTeachers(); } catch (x){ toast(x.message); }
});
$("#teacherList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-email]"); if (!b || !confirm("Bỏ quyền giáo viên của " + b.dataset.email + "?")) return;
  try { await api("/api/class?a=teachers&email=" + encodeURIComponent(b.dataset.email), { method: "DELETE" }); loadTeachers(); } catch (x){ toast(x.message); }
});
$("#bMigrate").onclick = async () => {
  const m = $("#dbMsg"); msg(m, "Đang cập nhật…");
  try { const j = await api("/api/class?a=migrate", { method: "POST" }); msg(m, `Xong (${j.statements} lệnh)`, "ok"); } catch (x){ msg(m, x.message, "err"); }
};

/* ---------- ảnh: thu nhỏ nếu quá lớn rồi tải lên /api/asset ---------- */
const b64 = buf => { const u = new Uint8Array(buf); let s = ""; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
async function shrink(blob){
  if (blob.size <= 3.3e6) return blob;
  const bmp = await createImageBitmap(blob), k = Math.min(1, 2800/Math.max(bmp.width, bmp.height));
  const c = document.createElement("canvas"); c.width = Math.round(bmp.width*k); c.height = Math.round(bmp.height*k);
  c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height);
  for (const q of [0.9, 0.8, 0.65]){ const out = await new Promise(r => c.toBlob(r, "image/webp", q)); if (out && out.size <= 3.3e6) return out; }
  throw new Error("Ảnh quá lớn, hãy thu nhỏ trước khi tải lên");
}
async function uploadImage(blob){
  const small = await shrink(blob);
  const j = await api("/api/asset", { method: "POST", body: JSON.stringify({ data: b64(await small.arrayBuffer()) }) });
  return j.url;
}

/* ---------- bài học ---------- */
const mapLabel = id => { const b = BUILTIN_MAPS.find(m => m[0] === id); if (b) return b[1]; const c = DATA.maps.find(m => "c-" + m.id === id); return c ? c.name : id || "Sân trống"; };
function renderLessons(){
  const el = $("#lessonList");
  if (!DATA.lessons.length){ el.innerHTML = '<div class="empty">Chưa có bài học nào. Bấm <b>+ Thêm bài học</b> để tải notebook .ipynb lên.</div>'; return; }
  el.innerHTML = DATA.lessons.map((l, i) => `<div class="row${l.hidden ? " off" : ""}" data-i="${i}">
    <div class="order"><button data-a="up" title="Lên" aria-label="Lên">↑</button><button data-a="down" title="Xuống" aria-label="Xuống">↓</button></div>
    <div><b>${esc(l.title)}${l.hidden ? '<span class="badge">đang ẩn</span>' : ""}</b><div class="a-meta">${l.kind === "challenge" ? "Thử thách" : "Bài học"} · cấp ${l.level || 1}${l.criteria ? " · có tiêu chí" : ""} · ${esc(l.tag || "—")} · ${esc(mapLabel(l.map))} · ${l.cells.length} ô · mã <code>${esc(l.id)}</code></div></div>
    <div class="acts"><button data-a="edit">Sửa</button><a href="/?lesson=c-${encodeURIComponent(l.id)}" target="_blank" rel="noopener">Xem ↗</a><button data-a="hide">${l.hidden ? "Hiện" : "Ẩn"}</button><button data-a="del" class="danger">Xoá</button></div></div>`).join("");
}
$("#lessonList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const i = +b.closest(".row").dataset.i, L = DATA.lessons, a = b.dataset.a;
  if (a === "edit") return editLesson(i);
  if (a === "del" && !confirm(`Xoá bài "${L[i].title}"? Học sinh sẽ không thấy bài này nữa.`)) return;
  const before = JSON.stringify(L);
  if (a === "up" && i > 0) [L[i - 1], L[i]] = [L[i], L[i - 1]];
  else if (a === "down" && i < L.length - 1) [L[i + 1], L[i]] = [L[i], L[i + 1]];
  else if (a === "hide") L[i].hidden = !L[i].hidden;
  else if (a === "del") L.splice(i, 1);
  if (JSON.stringify(L) === before) return;
  if (await saveData()) toast("Đã lưu"); renderLessons();
});

let LE = null;   // { index, cells, idTouched }
function fillMapSelect(sel, value){
  sel.innerHTML = '<optgroup label="Sa bàn có sẵn">' + BUILTIN_MAPS.map(([id, n]) => `<option value="${id}">${esc(n)}</option>`).join("") + "</optgroup>"
    + (DATA.maps.length ? '<optgroup label="Sa bàn tự tạo">' + DATA.maps.map(m => `<option value="c-${esc(m.id)}">${esc(m.name)}</option>`).join("") + "</optgroup>" : "");
  sel.value = value || "open"; if (!sel.value) sel.value = "open";
}
function editLesson(i){
  const l = i === null ? { id: "", title: "", titleEn: "", tag: "", tagEn: "", desc: "", descEn: "", map: "open", file: "", hidden: false, cells: [] } : DATA.lessons[i];
  LE = { index: i, cells: l.cells.slice(), file: l.file, idTouched: i !== null };
  const f = $("#fLesson");
  for (const k of ["title", "titleEn", "tag", "tagEn", "desc", "descEn", "id"]) f.elements[k].value = l[k] || "";
  f.elements.id.readOnly = i !== null; f.elements.hidden.checked = !!l.hidden;
  const c = l.criteria || {}, setv = (k, x) => f.elements[k].value = x === null || x === undefined ? "" : x;
  setv("level", l.level || 1); setv("kind", l.kind || "lesson"); setv("cGoal", c.goal || ""); setv("cMaxTime", c.maxTime); setv("cMaxColl", c.maxCollisions);
  f.elements.cInside.checked = !!c.stayInside; setv("cRefTime", c.refTime); setv("cRefDist", c.refDistance);
  fillMapSelect($("#leMap"), l.map);
  $("#leTitle").textContent = i === null ? "Thêm bài học" : "Sửa bài học";
  $("#leFileInfo").textContent = LE.cells.length ? `${LE.file || "notebook"} · ${LE.cells.length} ô` : "Chưa có nội dung";
  $("#lePreview").hidden = i === null; if (i !== null) $("#lePreview").href = "/?lesson=c-" + encodeURIComponent(l.id);
  msg($("#leMsg"), ""); show("vLessonEdit");
}
$("#bNewLesson").onclick = () => editLesson(null);
$("#fLesson").elements.title.addEventListener("input", e => { if (LE && !LE.idTouched) $("#fLesson").elements.id.value = uniqueId(slug(e.target.value), DATA.lessons, null); });
$("#fLesson").elements.id.addEventListener("input", () => { if (LE) LE.idTouched = true; });

// Đọc notebook: ảnh nhúng (attachments) được tải lên kho ảnh và thay đường dẫn.
async function parseNotebook(file, info){
  if (file.size > 25e6) throw new Error("Tệp quá lớn (tối đa 25 MB)");
  let nb; try { nb = JSON.parse(await file.text()); } catch (e) { throw new Error("Tệp .ipynb không hợp lệ"); }
  const src = (Array.isArray(nb.cells) ? nb.cells : []).filter(x => x && (x.cell_type === "code" || x.cell_type === "markdown"));
  if (src.length > 300) throw new Error("Notebook quá 300 ô");
  const total = src.reduce((n, x) => n + Object.keys(x.attachments || {}).length, 0); let done = 0;
  const cells = [];
  for (const x of src){
    let s = Array.isArray(x.source) ? x.source.join("") : String(x.source || "");
    for (const [name, d] of Object.entries(x.attachments || {})){
      const mime = Object.keys(d || {}).find(m => /^image\/(png|jpeg|gif|webp)$/.test(m)); if (!mime) continue;
      info(`Đang tải ảnh ${++done}/${total}…`);
      const bin = Uint8Array.from(atob(String(Array.isArray(d[mime]) ? d[mime].join("") : d[mime]).replace(/\s+/g, "")), ch => ch.charCodeAt(0));
      const url = await uploadImage(new Blob([bin], { type: mime }));
      s = s.split("attachment:" + name).join(url).split("attachment:" + encodeURIComponent(name)).join(url);
    }
    if (s.length > 100000) throw new Error("Có ô dài quá 100.000 ký tự");
    const m = x.metadata || {}, meta = {};
    if (m.editable === false) meta.editable = false;
    if (m.deletable === false) meta.deletable = false;
    const type = x.cell_type === "code" ? "code" : "md";
    cells.push(Object.keys(meta).length ? [type, s, null, meta] : [type, s]);
  }
  if (!cells.length) throw new Error("Notebook không có ô nào");
  return cells;
}
$("#leFile").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file || !LE) return;
  const info = t => $("#leFileInfo").textContent = t;
  try {
    info("Đang đọc notebook…");
    LE.cells = await parseNotebook(file, info); LE.file = file.name.replace(/[\u0000-\u001f<>]/g, "").slice(0, 120);
    info(`${LE.file} · ${LE.cells.length} ô`);
    const f = $("#fLesson");
    if (!f.elements.title.value){ f.elements.title.value = LE.file.replace(/\.ipynb$/i, "").replace(/[_-]+/g, " "); f.elements.title.dispatchEvent(new Event("input")); }
  } catch (x){ info(x.message); toast(x.message); }
});
$("#fLesson").addEventListener("submit", async e => {
  e.preventDefault(); if (!LE) return;
  const f = e.target, v = k => f.elements[k].value.trim(), m = $("#leMsg");
  if (!LE.cells.length) return msg(m, "Hãy chọn tệp notebook .ipynb", "err");
  const id = v("id");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(id)) return msg(m, "Mã bài chỉ gồm chữ thường không dấu, số và dấu gạch ngang", "err");
  if (DATA.lessons.some((l, i) => l.id === id && i !== LE.index)) return msg(m, "Mã bài đã có, hãy đổi mã khác", "err");
  const num = k => v(k) === "" ? null : Number(v(k));
  const criteria = { goal: v("cGoal"), maxTime: num("cMaxTime"), maxCollisions: num("cMaxColl"), stayInside: f.elements.cInside.checked, refTime: num("cRefTime"), refDistance: num("cRefDist") };
  const obj = { id, title: v("title"), titleEn: v("titleEn"), tag: v("tag"), tagEn: v("tagEn"), desc: v("desc"), descEn: v("descEn"), map: $("#leMap").value, file: LE.file || id + ".ipynb", hidden: f.elements.hidden.checked, cells: LE.cells,
    level: Number(v("level")) || 1, kind: v("kind"), criteria };
  const backup = JSON.stringify(DATA.lessons);
  if (LE.index === null) DATA.lessons.unshift(obj); else DATA.lessons[LE.index] = obj;
  f.querySelector("[type=submit]").disabled = true; msg(m, "Đang lưu…");
  const ok = await saveData(); f.querySelector("[type=submit]").disabled = false;
  if (!ok){ DATA.lessons = JSON.parse(backup); return msg(m, "Chưa lưu được", "err"); }
  toast("Đã lưu bài học"); showTab("lessons");
});

/* ---------- sa bàn ---------- */
function renderMaps(){
  const el = $("#mapList");
  if (!DATA.maps.length){ el.innerHTML = '<div class="empty">Chưa có sa bàn tự tạo. Bấm <b>+ Thêm sa bàn</b>, tải ảnh mặt sa bàn và nhập kích thước thật.</div>'; return; }
  el.innerHTML = DATA.maps.map((m, i) => `<div class="row" data-i="${i}">
    ${m.image ? `<img class="thumb" alt="" src="${esc(m.image)}">` : '<div class="thumb"></div>'}
    <div><b>${esc(m.name)}</b><div class="a-meta">${Math.round(m.w*100)} × ${Math.round(m.h*100)} cm · ${m.boxes.length} vật cản · ${m.zones.length} ô màu · vạch ${m.line.mode === "color" ? "màu " + esc(m.line.color) : "tối"} · mã <code>${esc(m.id)}</code></div></div>
    <div class="acts"><button data-a="edit">Sửa</button><a href="/?map=c-${encodeURIComponent(m.id)}" target="_blank" rel="noopener">Xem ↗</a><button data-a="del" class="danger">Xoá</button></div></div>`).join("");
}
$("#mapList").addEventListener("click", async e => {
  const b = e.target.closest("button[data-a]"); if (!b) return;
  const i = +b.closest(".row").dataset.i, m = DATA.maps[i];
  if (b.dataset.a === "edit") return editMap(i);
  const used = DATA.lessons.filter(l => l.map === "c-" + m.id).map(l => l.title);
  if (!confirm(`Xoá sa bàn "${m.name}"?` + (used.length ? `\nCác bài sau sẽ chuyển về Sân trống: ${used.join(", ")}` : ""))) return;
  const backup = JSON.stringify(DATA);
  DATA.maps.splice(i, 1); DATA.lessons.forEach(l => { if (l.map === "c-" + m.id) l.map = "open"; });
  if (!(await saveData())) DATA = JSON.parse(backup); else toast("Đã xoá sa bàn");
  renderMaps();
});

const ME = { index: null, m: null, img: null, pix: null, tool: "start", drag: null, idTouched: false };
const cv = $("#meCanvas"), cx = cv.getContext("2d");
const HINTS = {
  start: "Bấm vào sa bàn để đặt điểm xuất phát; giữ chuột rồi kéo để chọn hướng robot nhìn. Nút ↺ ↻ xoay 15°.",
  box: "Kéo chuột để vẽ vật cản (khối cao 22 cm). Bấm một lần để đặt khối 14 × 14 cm. Bấm vào vật cản để xoá.",
  zone: "Chọn màu rồi kéo chuột để vẽ ô màu (camera.color() đọc được). Bấm vào ô màu để xoá.",
  pick: "Bấm lên vạch trên ảnh để lấy đúng màu vạch dò line."
};
function editMap(i){
  const src = i === null ? { id: "", name: "", nameEn: "", w: 2.4, h: 1.6, image: "", start: { x: 0, y: 0, th: 0 }, boxes: [], zones: [], line: { mode: "dark", tol: 80 } } : DATA.maps[i];
  ME.index = i; ME.m = JSON.parse(JSON.stringify(src)); ME.img = null; ME.pix = null; ME.idTouched = i !== null;
  const f = $("#fMap");
  f.elements.name.value = ME.m.name; f.elements.nameEn.value = ME.m.nameEn || ""; f.elements.id.value = ME.m.id; f.elements.id.readOnly = i !== null;
  f.elements.wcm.value = Math.round(ME.m.w*100); f.elements.hcm.value = Math.round(ME.m.h*100);
  f.querySelector(`[name=lineMode][value=${ME.m.line.mode === "color" ? "color" : "dark"}]`).checked = true;
  f.elements.lineColor.value = ME.m.line.color || "#f5a623"; f.elements.lineTol.value = ME.m.line.tol || 80; $("#tolOut").textContent = f.elements.lineTol.value;
  $("#meFileInfo").textContent = ME.m.image ? "Đã có ảnh" : "Chưa có ảnh";
  $("#meTitle").textContent = i === null ? "Thêm sa bàn" : "Sửa sa bàn";
  $("#mePreview").hidden = i === null; if (i !== null) $("#mePreview").href = "/?map=c-" + encodeURIComponent(ME.m.id);
  msg($("#meMsg"), ""); setTool("start"); show("vMapEdit");
  if (ME.m.image) loadImg(ME.m.image); else { sizeCanvas(); draw(); }
}
$("#bNewMap").onclick = () => editMap(null);
$("#fMap").elements.name.addEventListener("input", e => { if (!ME.idTouched) $("#fMap").elements.id.value = uniqueId(slug(e.target.value), DATA.maps, null); });
$("#fMap").elements.id.addEventListener("input", () => ME.idTouched = true);
$("#fMap").addEventListener("input", e => {
  const f = $("#fMap"), n = e.target.name;
  if (n === "wcm" || n === "hcm"){ const w = +f.elements.wcm.value, h = +f.elements.hcm.value; if (w >= 50 && w <= 400) ME.m.w = w/100; if (h >= 50 && h <= 300) ME.m.h = h/100; sizeCanvas(); }
  if (n === "lineTol") $("#tolOut").textContent = e.target.value;
  ME.m.line = { mode: f.querySelector("[name=lineMode]:checked").value, color: f.elements.lineColor.value, tol: +f.elements.lineTol.value };
  draw();
});
$("#fMap").addEventListener("submit", e => e.preventDefault());

function loadImg(url, onload){
  const im = new Image();
  im.onload = () => {
    ME.img = im;
    const c = document.createElement("canvas"); c.width = im.naturalWidth; c.height = im.naturalHeight;
    const g = c.getContext("2d", { willReadFrequently: true }); g.drawImage(im, 0, 0); ME.pix = g;
    if (onload) onload(im); sizeCanvas(); draw();
  };
  im.onerror = () => toast("Không tải được ảnh");
  im.src = url;
}
$("#meFile").addEventListener("change", async e => {
  const file = e.target.files[0]; e.target.value = ""; if (!file) return;
  const info = $("#meFileInfo");
  try {
    info.textContent = "Đang tải ảnh lên…";
    const url = await uploadImage(file); ME.m.image = url;
    loadImg(url, im => {
      // gợi ý chiều dài theo tỉ lệ ảnh, giữ chiều rộng đã nhập
      const f = $("#fMap"), w = +f.elements.wcm.value || 240, h = Math.round(w*im.naturalHeight/im.naturalWidth);
      if (h >= 50 && h <= 300){ f.elements.hcm.value = h; ME.m.h = h/100; }
      ME.m.w = w/100; info.textContent = `Ảnh ${im.naturalWidth} × ${im.naturalHeight} px`;
    });
  } catch (x){ info.textContent = x.message; toast(x.message); }
});

function sizeCanvas(){ const W = 960; cv.width = W; cv.height = Math.round(W*ME.m.h/ME.m.w); }
const K = () => cv.width/ME.m.w;
const toPx = (x, y) => [(x + ME.m.w/2)*K(), (ME.m.h/2 - y)*K()];
function toField(ev){ const r = cv.getBoundingClientRect(), px = (ev.clientX - r.left)*cv.width/r.width, py = (ev.clientY - r.top)*cv.height/r.height; return [px/K() - ME.m.w/2, ME.m.h/2 - py/K(), px, py]; }
function rectPx(o, hKey){ const [x0, y0] = toPx(o.x - o.w/2, o.y + o[hKey]/2); return [x0, y0, o.w*K(), o[hKey]*K()]; }
function draw(){
  const m = ME.m, k = K();
  cx.clearRect(0, 0, cv.width, cv.height);
  if (ME.img) cx.drawImage(ME.img, 0, 0, cv.width, cv.height);
  else { cx.fillStyle = "#f3f5f1"; cx.fillRect(0, 0, cv.width, cv.height); }
  cx.strokeStyle = "rgba(0,0,0,.08)"; cx.lineWidth = 1;   // lưới 10 cm
  for (let x = 0; x <= m.w + 1e-6; x += 0.1){ cx.beginPath(); cx.moveTo(x*k, 0); cx.lineTo(x*k, cv.height); cx.stroke(); }
  for (let y = 0; y <= m.h + 1e-6; y += 0.1){ cx.beginPath(); cx.moveTo(0, y*k); cx.lineTo(cv.width, y*k); cx.stroke(); }
  for (const z of m.zones){ const [x, y, w, h] = rectPx(z, "h"); cx.globalAlpha = 0.75; cx.fillStyle = ZONE_HEX[z.c]; cx.fillRect(x, y, w, h); cx.globalAlpha = 1; }
  for (const b of m.boxes){ const [x, y, w, h] = rectPx(b, "d"); cx.fillStyle = "rgba(224,131,58,.85)"; cx.fillRect(x, y, w, h); cx.strokeStyle = "#7a3d10"; cx.lineWidth = 2; cx.strokeRect(x, y, w, h); }
  const d = ME.drag;
  if (d && (d.kind === "box" || d.kind === "zone")){ cx.setLineDash([6, 4]); cx.strokeStyle = "#14201a"; cx.lineWidth = 2; cx.strokeRect(Math.min(d.px0, d.px1), Math.min(d.py0, d.py1), Math.abs(d.px1 - d.px0), Math.abs(d.py1 - d.py0)); cx.setLineDash([]); }
  // robot ở điểm xuất phát: thân Ø 20 cm + mũi tên hướng
  const [sx, sy] = toPx(m.start.x, m.start.y);
  cx.save(); cx.translate(sx, sy); cx.rotate(-m.start.th);
  cx.fillStyle = "rgba(31,168,58,.35)"; cx.strokeStyle = "#467000"; cx.lineWidth = 2.5;
  cx.beginPath(); cx.arc(0, 0, 0.1*k, 0, Math.PI*2); cx.fill(); cx.stroke();
  cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(0.17*k, 0); cx.stroke();
  cx.fillStyle = "#467000"; cx.beginPath(); cx.moveTo(0.2*k, 0); cx.lineTo(0.15*k, -0.03*k); cx.lineTo(0.15*k, 0.03*k); cx.fill();
  cx.restore();
  cx.strokeStyle = "rgba(0,0,0,.35)"; cx.lineWidth = 2; cx.strokeRect(1, 1, cv.width - 2, cv.height - 2);
}
const inRect = (o, hKey, x, y) => Math.abs(x - o.x) <= o.w/2 && Math.abs(y - o.y) <= o[hKey]/2;
const clampF = (v, half) => Math.max(-half, Math.min(half, v));
cv.addEventListener("pointerdown", e => {
  if (!ME.m) return;
  const [x, y, px, py] = toField(e), t = ME.tool; cv.setPointerCapture(e.pointerId);
  if (t === "pick"){
    if (!ME.pix) return toast("Hãy tải ảnh sa bàn trước");
    const ix = Math.floor(px/cv.width*ME.img.naturalWidth), iy = Math.floor(py/cv.height*ME.img.naturalHeight), p = ME.pix.getImageData(ix, iy, 1, 1).data;
    const hex = "#" + [p[0], p[1], p[2]].map(v => v.toString(16).padStart(2, "0")).join("");
    const f = $("#fMap"); f.elements.lineColor.value = hex; f.querySelector("[name=lineMode][value=color]").checked = true;
    ME.m.line = { mode: "color", color: hex, tol: +f.elements.lineTol.value }; toast("Màu vạch: " + hex); return;
  }
  ME.drag = { kind: t, x0: x, y0: y, px0: px, py0: py, px1: px, py1: py, moved: false };
  if (t === "start"){ ME.m.start.x = +clampF(x, ME.m.w/2).toFixed(3); ME.m.start.y = +clampF(y, ME.m.h/2).toFixed(3); draw(); }
});
cv.addEventListener("pointermove", e => {
  const d = ME.drag; if (!d) return;
  const [x, y, px, py] = toField(e); d.px1 = px; d.py1 = py;
  if (Math.hypot(px - d.px0, py - d.py0) > 6) d.moved = true;
  if (d.kind === "start" && d.moved) ME.m.start.th = +Math.atan2(y - d.y0, x - d.x0).toFixed(4);
  draw();
});
cv.addEventListener("pointerup", e => {
  const d = ME.drag; ME.drag = null; if (!d) return;
  const [x, y] = toField(e), m = ME.m;
  if (d.kind === "box" || d.kind === "zone"){
    const arr = d.kind === "box" ? m.boxes : m.zones, hKey = d.kind === "box" ? "d" : "h";
    if (!d.moved){
      const hit = arr.findIndex(o => inRect(o, hKey, x, y));
      if (hit >= 0) arr.splice(hit, 1);
      else if (arr.length < (d.kind === "box" ? 60 : 20)){ const s = d.kind === "box" ? 0.14 : 0.3; arr.push(d.kind === "box" ? { x: +x.toFixed(3), y: +y.toFixed(3), w: s, d: s, h: 0.22 } : { x: +x.toFixed(3), y: +y.toFixed(3), w: s, h: s, c: $("#zoneColor").value }); }
    } else {
      const w = Math.abs(x - d.x0), h = Math.abs(y - d.y0), cxm = (x + d.x0)/2, cym = (y + d.y0)/2;
      if (w >= 0.02 && h >= 0.02 && arr.length < (d.kind === "box" ? 60 : 20))
        arr.push(d.kind === "box" ? { x: +cxm.toFixed(3), y: +cym.toFixed(3), w: +w.toFixed(3), d: +h.toFixed(3), h: 0.22 } : { x: +cxm.toFixed(3), y: +cym.toFixed(3), w: +w.toFixed(3), h: +h.toFixed(3), c: $("#zoneColor").value });
    }
  }
  draw();
});
function setTool(t){ ME.tool = t; $$(".tools [data-tool]").forEach(b => b.setAttribute("aria-pressed", b.dataset.tool === t)); $("#toolHint").textContent = HINTS[t]; }
$(".tools").addEventListener("click", e => {
  const b = e.target.closest("button"); if (!b || !ME.m) return;
  if (b.dataset.tool) setTool(b.dataset.tool);
  if (b.dataset.rot){ ME.m.start.th = +(ME.m.start.th + (+b.dataset.rot)*Math.PI/180).toFixed(4); draw(); }
  if (b.id === "meClearBoxes" && ME.m.boxes.length && confirm("Xoá hết vật cản trên sa bàn này?")){ ME.m.boxes = []; draw(); }
});
$("#meSave").onclick = async () => {
  const f = $("#fMap"), m = ME.m, out = $("#meMsg");
  m.name = f.elements.name.value.trim(); m.nameEn = f.elements.nameEn.value.trim(); m.id = f.elements.id.value.trim();
  if (!m.name) return msg(out, "Hãy nhập tên sa bàn", "err");
  if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(m.id)) return msg(out, "Mã sa bàn chỉ gồm chữ thường không dấu, số và dấu gạch ngang", "err");
  if (DATA.maps.some((x, i) => x.id === m.id && i !== ME.index)) return msg(out, "Mã sa bàn đã có, hãy đổi mã khác", "err");
  const half = (v, h) => Math.abs(v) <= h;
  m.boxes = m.boxes.filter(b => half(b.x, m.w/2) && half(b.y, m.h/2)); m.zones = m.zones.filter(z => half(z.x, m.w/2) && half(z.y, m.h/2));
  m.start.x = clampF(m.start.x, m.w/2); m.start.y = clampF(m.start.y, m.h/2);
  const backup = JSON.stringify(DATA.maps);
  if (ME.index === null) DATA.maps.push(m); else DATA.maps[ME.index] = m;
  $("#meSave").disabled = true; msg(out, "Đang lưu…");
  const ok = await saveData(); $("#meSave").disabled = false;
  if (!ok){ DATA.maps = JSON.parse(backup); return msg(out, "Chưa lưu được", "err"); }
  toast("Đã lưu sa bàn"); showTab("maps");
};

/* ---------- khởi động ---------- */
async function boot(){
  const j = await api("/api/auth?a=me");
  ME_USER = j.user; $("#gLogin").hidden = !j.google;
  const err = new URLSearchParams(location.search).get("login_error");
  if (!ME_USER) return showLogin(err || (j.google ? "" : "Server chưa cấu hình đăng nhập Google; dùng mật khẩu admin."));
  if (ME_USER.role !== "admin" && ME_USER.role !== "teacher") return showLogin("Tài khoản " + ME_USER.email + " chưa được admin cấp quyền giáo viên.");
  $("#who").textContent = ME_USER.email || ME_USER.name;
  $('#tabs [data-tab="teachers"]').hidden = ME_USER.role !== "admin";
  await loadData(); showTab(new URLSearchParams(location.search).get("tab") || "lessons");
}
boot().catch(e => showLogin(e.message));
