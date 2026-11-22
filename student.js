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
loadMe();
