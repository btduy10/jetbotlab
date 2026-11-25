"use strict";
/* =====================================================================
   Mô phỏng các thư viện của notebook NVIDIA JetBot "path_following" (data_collection, train_model, run_model)
   để học sinh chạy NGUYÊN VĂN code gốc trên sa bàn ảo:
   ipywidgets · traitlets · IPython.display · jupyter_clickable_image_widget · uuid · os · glob · json
   numpy · cv2 · PIL.Image · torch (+nn, optim, utils.data) · torchvision · torch2trt · open() · lệnh "!zip"
   Tệp nằm trong "ổ đĩa ảo" của trình duyệt (localStorage). Mạng nơ-ron thay cho resnet18 trên GPU:
   ảnh thu về 24×24 màu → lớp ẩn 48 nơ-ron (ReLU) → 2 đầu ra (x, y), huấn luyện bằng Adam ngay trong trình duyệt.
   Dùng chung biến toàn cục của app.js: AI, aiCapture, K, outText, outError, PYLIB, PY_ALLOWED, b64e, b64d, t.
   ===================================================================== */
(() => {
const R = 24, D = 3*R*R, HID = 48;
const PF = window.PF = { objs: new Map(), oid: 0, cams: new Map(), cid: 0, timer: 0, tickBusy: false, widgets: new Map(), wid: 0,
  modules: ["_np", "_ipyw", "_pf", "_torchcore", "_tvm", "_tvt", "_tvf", "_tvd", "_pil", "ipywidgets", "ipywidgets.widgets", "traitlets", "IPython", "IPython.display", "jupyter_clickable_image_widget",
    "uuid", "os", "glob", "json", "numpy", "cv2", "PIL", "PIL.Image", "torch", "torch.nn", "torch.nn.functional", "torch.optim", "torch.utils",
    "torch.utils.data", "torchvision", "torchvision.models", "torchvision.datasets", "torchvision.transforms", "torchvision.transforms.functional", "torch2trt"] };

/* ---------- kho đối tượng (ảnh, tensor, mô hình) ---------- */
function put(o){
  const id = ++PF.oid; PF.objs.set(id, o);
  if (PF.objs.size > 3000) for (const [k, v] of PF.objs){ if (!v.pin){ PF.objs.delete(k); break; } }
  return id;
}
// dùng tới thì đưa lên cuối (LRU): tensor dùng lâu dài như mean/std của hàm tiền xử lý không bị giải phóng
function get(id){ const o = PF.objs.get(id); if (!o) throw new Error("Dữ liệu này đã được giải phóng, hãy chạy lại ô"); if (!o.pin){ PF.objs.delete(id); PF.objs.set(id, o); } return o; }
const prod = s => s.reduce((a, b) => a*b, 1);

/* ---------- khung ảnh camera (dùng chung AI.frames của app.js: ImageData 112×112) ---------- */
function frameImg(fid){ const f = AI.frames.get(fid); if (!f) throw new Error(t("aiOldFrame")); return f.img; }
let cvA, cvB;
function small(img){
  if (!cvA){ cvA = document.createElement("canvas"); cvB = document.createElement("canvas"); cvB.width = cvB.height = R; }
  cvA.width = img.width; cvA.height = img.height; cvA.getContext("2d").putImageData(img, 0, 0);
  const g = cvB.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.clearRect(0, 0, R, R); g.drawImage(cvA, 0, 0, R, R);
  const d = g.getImageData(0, 0, R, R).data, out = new Float32Array(D);
  for (let i = 0; i < R*R; i++) for (let c = 0; c < 3; c++) out[c*R*R + i] = d[i*4 + c]/255;
  return out;
}
function frameCopy(fid){ const src = AI.frames.get(fid); if (!src) throw new Error(t("aiOldFrame")); const id = ++AI.fid; AI.frames.set(id, { img: new ImageData(new Uint8ClampedArray(src.img.data), src.img.width, src.img.height), feat: src.feat }); return id; }
function frameCircle(fid, cx, cy, r, col, th){
  const img = frameImg(fid), k = img.width/224, c = document.createElement("canvas"); c.width = img.width; c.height = img.height;
  const g = c.getContext("2d"); g.putImageData(img, 0, 0);
  g.strokeStyle = `rgb(${col[2]|0},${col[1]|0},${col[0]|0})`; g.lineWidth = Math.max(1, th*k);   // màu cv2 là BGR
  g.beginPath(); g.arc(cx*k, cy*k, Math.max(1, r*k), 0, 2*Math.PI); if (th < 0){ g.fillStyle = g.strokeStyle; g.fill(); } else g.stroke();
  img.data.set(g.getImageData(0, 0, img.width, img.height).data);
}
function drawFrame(canvas, fid){
  const f = AI.frames.get(fid); if (!f) return;
  if (!cvA){ cvA = document.createElement("canvas"); cvB = document.createElement("canvas"); cvB.width = cvB.height = R; }
  cvA.width = f.img.width; cvA.height = f.img.height; cvA.getContext("2d").putImageData(f.img, 0, 0);
  const g = canvas.getContext("2d"); g.imageSmoothingEnabled = true; g.drawImage(cvA, 0, 0, canvas.width, canvas.height);
}

/* ---------- ổ đĩa ảo (localStorage): thư mục, ảnh 24×24, mô hình, văn bản ---------- */
const VK = "jetbotlab.vfs.v1", VF = "jetbotlab.vfs.f:", VCACHE = new Map();
let VIDX = null;
const ls = {
  get(k){ try { return localStorage.getItem(k); } catch (e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, v); } catch (e){ throw new Error("Bộ nhớ trình duyệt đã đầy. Hãy xoá bớt tệp (VD: !rm -r dataset_xy) rồi thử lại."); } },
  del(k){ try { localStorage.removeItem(k); } catch (e){} }
};
function vidx(){ if (!VIDX){ let v = null; try { v = JSON.parse(ls.get(VK)); } catch (e){} VIDX = v && typeof v === "object" ? v : {}; } return VIDX; }
const vsave = () => { ls.set(VK, JSON.stringify(VIDX)); if (PF.fsChanged) PF.fsChanged(); };
function norm(p){
  const parts = [];
  for (const x of String(p).replace(/\\/g, "/").replace(/^~?\/?(home\/jetbot\/(Notebooks\/)?)?/, "").split("/")){ if (!x || x === ".") continue; if (x === "..") parts.pop(); else parts.push(x); }
  return parts.join("/");
}
const parent = p => p.includes("/") ? p.slice(0, p.lastIndexOf("/")) : "";
function vIsDir(p){ p = norm(p); if (!p) return true; const x = vidx(); if (x[p]) return x[p].k === "dir"; return Object.keys(x).some(k => k.startsWith(p + "/")); }
function vExists(p){ p = norm(p); return !p || !!vidx()[p] || vIsDir(p); }
function vMakedirs(p){ p = norm(p); const x = vidx(); let cur = ""; for (const part of p.split("/")){ cur = cur ? cur + "/" + part : part; if (x[cur] && x[cur].k !== "dir") throw new Error("Không tạo được thư mục: đã có tệp " + cur); if (!x[cur]) x[cur] = { k: "dir", t: Date.now() }; } vsave(); }
function vNeedDir(p){ const d = parent(norm(p)); if (d && !vIsDir(d)) throw new Error("No such file or directory: '" + p + "'"); }
function vPut(p, meta, data){
  p = norm(p); vNeedDir(p); const x = vidx();
  if (x[p] && x[p].k === "dir") throw new Error("Is a directory: '" + p + "'");
  if (data !== undefined) ls.set(VF + p, data);
  x[p] = Object.assign({ t: Date.now() }, meta); VCACHE.delete(p); vsave();
}
function vMeta(p){ p = norm(p); const m = vidx()[p]; if (!m || m.k === "dir") throw new Error("No such file or directory: '" + p + "'"); return m; }
function vList(dir){
  dir = norm(dir); if (!vIsDir(dir)) throw new Error("No such file or directory: '" + dir + "'");
  const pre = dir ? dir + "/" : "", out = new Set();
  for (const k of Object.keys(vidx())) if (k.startsWith(pre)){ const rest = k.slice(pre.length); if (rest) out.add(rest.split("/")[0]); }
  return [...out];
}
function vGlob(pat){
  const p = norm(pat), re = new RegExp("^" + p.split("").map(ch => ch === "*" ? "[^/]*" : ch === "?" ? "[^/]" : ch.replace(/[.+^${}()|[\]\\]/g, "\\$&")).join("") + "$");
  return Object.keys(vidx()).filter(k => re.test(k)).sort((a, b) => vidx()[a].t - vidx()[b].t);
}
function vRemove(p, recursive){
  p = norm(p); const x = vidx(), kids = Object.keys(x).filter(k => k.startsWith(p + "/"));
  if (!x[p] && !kids.length) throw new Error("No such file or directory: '" + p + "'");
  if (kids.length && !recursive) throw new Error("Directory not empty: '" + p + "'");
  for (const k of kids.concat(x[p] ? [p] : [])){ ls.del(VF + k); VCACHE.delete(k); delete x[k]; }
  vsave();
}
function vWriteImg(p, fid){
  const d = small(frameImg(fid)), u = new Uint8Array(D); for (let i = 0; i < D; i++) u[i] = Math.round(d[i]*255);
  vPut(p, { k: "img", size: 9000 + (fid % 2000) }, b64e(u));
}
function vReadImg(p){
  p = norm(p); if (VCACHE.has(p)) return VCACHE.get(p);
  const m = vMeta(p); if (m.k !== "img") throw new Error(/\.(jpe?g|png)$/i.test(p) ? "Ảnh rỗng: " + p + " (chụp khi ô camera chưa có hình). Mở bảng Tệp ở thanh bên trái, vào thư mục ảnh, bấm \"Xoá ảnh hỏng\" rồi chạy lại." : "Không đọc được ảnh: " + p);
  const u = b64d(ls.get(VF + p) || ""); if (u.length !== D) throw new Error("Ảnh hỏng: " + p);
  const d = new Float32Array(D); for (let i = 0; i < D; i++) d[i] = u[i]/255; VCACHE.set(p, d); return d;
}
// mô hình: lưu dạng float16 cho nhẹ
const f32b = new Float32Array(1), u32b = new Uint32Array(f32b.buffer);
function toHalf(v){ f32b[0] = v; const x = u32b[0], s = (x >>> 16) & 0x8000, e = ((x >>> 23) & 0xff) - 112, m = x & 0x7fffff; if (e <= 0) return s; if (e >= 31) return s | 0x7bff; return s | (e << 10) | (m >>> 13); }
function fromHalf(h){ const s = h & 0x8000 ? -1 : 1, e = (h >>> 10) & 0x1f, m = h & 0x3ff; return e === 0 ? s*m*Math.pow(2, -24) : s*(1 + m/1024)*Math.pow(2, e - 15); }
const PARAMS = ["W1", "b1", "W2", "b2"];
function vWriteModel(p, st){
  const n = PARAMS.reduce((a, k) => a + st[k].length, 0), h = new Uint16Array(n); let o = 0;
  for (const k of PARAMS) for (const v of st[k]) h[o++] = toHalf(v);
  vPut(p, { k: "model", out: st.out, H: st.H, size: n*2 }, b64e(new Uint8Array(h.buffer)));
}
function vReadModel(p){
  const m = vMeta(p); if (m.k !== "model") throw new Error("Tệp không phải mô hình PyTorch: " + p);
  const u = b64d(ls.get(VF + norm(p)) || ""), h = new Uint16Array(u.buffer, u.byteOffset, u.length >> 1);
  const st = { k: "st", out: m.out, H: m.H, W1: new Float32Array(m.H*D), b1: new Float32Array(m.H), W2: new Float32Array(m.out*m.H), b2: new Float32Array(m.out) };
  let o = 0; for (const k of PARAMS) for (let i = 0; i < st[k].length; i++) st[k][i] = fromHalf(h[o++]);
  return st;
}

/* ---------- PIL / torchvision.transforms trên ảnh 24×24 (kích thước danh nghĩa 224×224) ---------- */
function pil(d, w, h){ return put({ k: "pil", d, w: w || 224, h: h || 224 }); }
function pilFromFrame(fid, bgr){
  const d = small(frameImg(fid)); if (!bgr) return pil(d);
  const o = new Float32Array(D), n = R*R; o.set(d.subarray(2*n, 3*n), 0); o.set(d.subarray(n, 2*n), n); o.set(d.subarray(0, n), 2*n);   // mảng BGR
  return pil(o);
}
function pilFlip(id){ const s = get(id), o = new Float32Array(D); for (let c = 0; c < 3; c++) for (let y = 0; y < R; y++) for (let x = 0; x < R; x++) o[c*R*R + y*R + x] = s.d[c*R*R + y*R + R-1-x]; return pil(o, s.w, s.h); }
const U = (a, b) => a + Math.random()*(b - a);
function pilJitter(id, b, c, s, h){
  const src = get(id), d = new Float32Array(src.d), n = R*R, cl = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const bf = b ? U(Math.max(0, 1 - b), 1 + b) : 1, cf = c ? U(Math.max(0, 1 - c), 1 + c) : 1, sf = s ? U(Math.max(0, 1 - s), 1 + s) : 1, hf = h ? U(-h, h) : 0;
  for (let i = 0; i < D; i++) d[i] = cl(d[i]*bf);
  if (cf !== 1){ let m = 0; for (let i = 0; i < n; i++) m += 0.299*d[i] + 0.587*d[n + i] + 0.114*d[2*n + i]; m /= n; for (let i = 0; i < D; i++) d[i] = cl((d[i] - m)*cf + m); }
  for (let i = 0; i < n; i++){
    let r = d[i], g = d[n + i], bb = d[2*n + i];
    if (sf !== 1){ const gr = 0.299*r + 0.587*g + 0.114*bb; r = cl((r - gr)*sf + gr); g = cl((g - gr)*sf + gr); bb = cl((bb - gr)*sf + gr); }
    if (hf){
      const mx = Math.max(r, g, bb), mn = Math.min(r, g, bb), dl = mx - mn; let hh = 0;
      if (dl){ hh = mx === r ? ((g - bb)/dl) % 6 : mx === g ? (bb - r)/dl + 2 : (r - g)/dl + 4; hh /= 6; }
      hh = ((hh + hf) % 1 + 1) % 1; const sv = mx ? dl/mx : 0, v = mx, k = q => (q + hh*6) % 6, f = q => v - v*sv*Math.max(0, Math.min(k(q), 4 - k(q), 1));
      r = f(5); g = f(3); bb = f(1);
    }
    d[i] = r; d[n + i] = g; d[2*n + i] = bb;
  }
  return pil(d, src.w, src.h);
}

/* ---------- tensor ---------- */
const T = (d, s, extra) => put(Object.assign({ k: "t", d, s }, extra || {}));
function chanBlocks(t){ const C = t.s.length === 4 ? t.s[1] : t.s[0]; return { C, n: t.d.length / (t.s.length === 4 ? t.s[0]*C : C) }; }
function tOp(id, op, other, scalar){
  const a = get(id), d = a.d;
  const f = op === "sub" ? (x, y) => x - y : op === "add" ? (x, y) => x + y : op === "mul" ? (x, y) => x*y : (x, y) => x/y;
  if (other){
    const b = get(other).d;
    if (b.length === d.length) for (let i = 0; i < d.length; i++) d[i] = f(d[i], b[i]);
    else if (b.length === 1) for (let i = 0; i < d.length; i++) d[i] = f(d[i], b[0]);
    else { const { C, n } = chanBlocks(a); if (b.length !== C) throw new Error(`Không phát (broadcast) được tensor ${b.length} phần tử lên ${C} kênh`); for (let i = 0; i < d.length; i++) d[i] = f(d[i], b[Math.floor(i/n) % C]); }
  } else for (let i = 0; i < d.length; i++) d[i] = f(d[i], scalar);
  return id;
}
function tNormalize(id, mean, std){
  const a = get(id), { C, n } = chanBlocks(a); if (mean.length !== C || std.length !== C) throw new Error("normalize: mean/std phải có " + C + " giá trị");
  const d = new Float32Array(a.d.length); for (let i = 0; i < d.length; i++){ const c = Math.floor(i/n) % C; d[i] = (a.d[i] - mean[c])/std[c]; }
  return T(d, a.s.slice(), { img: a.img });
}
function tFlip0(id){ const a = get(id), m = a.s[0], n = a.d.length/m, d = new Float32Array(a.d.length); for (let i = 0; i < m; i++) d.set(a.d.subarray((m-1-i)*n, (m-i)*n), i*n); return T(d, a.s.slice(), { img: a.img }); }
function tStack(ids){
  if (!ids.length) throw new Error("Không có phần tử nào để ghép thành lô (batch)");
  const ts = ids.map(get), n = ts[0].d.length; if (ts.some(t => t.d.length !== n)) throw new Error("stack: các tensor phải cùng kích thước");
  const d = new Float32Array(n*ts.length); ts.forEach((t, i) => d.set(t.d, i*n)); return T(d, [ts.length].concat(ts[0].s), { img: ts[0].img });
}

/* ---------- mô hình (thay resnet18): 24×24×3 → 48 ReLU → out ---------- */
function rnd(){ let u = 0, v = 0; while (!u) u = Math.random(); while (!v) v = Math.random(); return Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v); }
function mNew(out){
  const m = { k: "m", pin: true, out, H: HID, W1: new Float32Array(HID*D), b1: new Float32Array(HID), W2: new Float32Array(out*HID), b2: new Float32Array(out) };
  for (let i = 0; i < m.W1.length; i++) m.W1[i] = rnd()*Math.sqrt(2/D);
  for (let i = 0; i < m.W2.length; i++) m.W2[i] = rnd()*Math.sqrt(1/HID);
  PARAMS.forEach(k => m["g" + k] = new Float32Array(m[k].length));
  return put(m);
}
function mForward(mid, tid){
  const m = get(mid), x = get(tid).d, B = x.length / D;
  if (!Number.isInteger(B) || B < 1) throw new Error("Đầu vào mô hình phải là ảnh 3×224×224 (hoặc lô N×3×224×224)");
  const { H, out, W1, b1, W2, b2 } = m, hs = new Float32Array(B*H), o = new Float32Array(B*out);
  for (let b = 0; b < B; b++){
    const xo = b*D;
    for (let j = 0; j < H; j++){ let s = b1[j]; const w = j*D; for (let i = 0; i < D; i++) s += W1[w + i]*x[xo + i]; hs[b*H + j] = s > 0 ? s : 0; }
    for (let k = 0; k < out; k++){ let s = b2[k]; for (let j = 0; j < H; j++) s += W2[k*H + j]*hs[b*H + j]; o[b*out + k] = s; }
  }
  return T(o, [B, out], { cache: { mid, x, hs, B } });
}
function mse(oid, lid){
  const o = get(oid), l = get(lid); if (o.d.length !== l.d.length) throw new Error(`mse_loss: đầu ra (${o.s}) và nhãn (${l.s}) khác kích thước`);
  const n = o.d.length, g = new Float32Array(n); let s = 0;
  for (let i = 0; i < n; i++){ const e = o.d[i] - l.d[i]; s += e*e; g[i] = 2*e/n; }
  return T(Float32Array.of(s/n), [], { back: { cache: o.cache, g } });
}
function backward(lid){
  const L = get(lid); if (!L.back || !L.back.cache) throw new Error("backward(): giá trị loss này không gắn với mô hình nào");
  const { cache: { mid, x, hs, B }, g } = L.back, m = get(mid), { H, out, W2, gW1, gb1, gW2, gb2 } = m, dh = new Float32Array(H);
  for (let b = 0; b < B; b++){
    dh.fill(0);
    for (let k = 0; k < out; k++){ const go = g[b*out + k]; gb2[k] += go; for (let j = 0; j < H; j++){ gW2[k*H + j] += go*hs[b*H + j]; dh[j] += go*W2[k*H + j]; } }
    const xo = b*D;
    for (let j = 0; j < H; j++){ if (hs[b*H + j] <= 0 || !dh[j]) continue; const d = dh[j], w = j*D; gb1[j] += d; for (let i = 0; i < D; i++) gW1[w + i] += d*x[xo + i]; }
  }
}
function optNew(mid, lr){ const m = get(mid), o = { k: "opt", pin: true, mid, lr: lr || 0.001, t: 0 }; PARAMS.forEach(k => { o["m" + k] = new Float32Array(m[k].length); o["v" + k] = new Float32Array(m[k].length); }); return put(o); }
function optZero(oid){ const m = get(get(oid).mid); PARAMS.forEach(k => m["g" + k].fill(0)); }
function optStep(oid){
  const o = get(oid), m = get(o.mid), b1 = 0.9, b2 = 0.999, eps = 1e-8; o.t++;
  const c1 = 1 - Math.pow(b1, o.t), c2 = 1 - Math.pow(b2, o.t);
  for (const k of PARAMS){ const p = m[k], g = m["g" + k], mm = o["m" + k], vv = o["v" + k];
    for (let i = 0; i < p.length; i++){ const gi = g[i]; if (!gi && !mm[i]) continue; mm[i] = b1*mm[i] + (1 - b1)*gi; vv[i] = b2*vv[i] + (1 - b2)*gi*gi; p[i] -= o.lr*(mm[i]/c1)/(Math.sqrt(vv[i]/c2) + eps); } }
}
function mState(mid){ const m = get(mid), st = { k: "st", out: m.out, H: m.H }; PARAMS.forEach(k => st[k] = new Float32Array(m[k])); return put(st); }
function mLoad(mid, sid){
  const m = get(mid), st = get(sid); if (st.k !== "st") throw new Error("load_state_dict: cần state_dict (từ torch.load hoặc model.state_dict())");
  if (st.out !== m.out || st.H !== m.H) throw new Error(`load_state_dict: mô hình có ${m.out} đầu ra nhưng state_dict có ${st.out}`);
  PARAMS.forEach(k => m[k].set(st[k]));
}
function mFromState(sid){ const st = get(sid), id = mNew(st.out); mLoad(id, sid); return id; }

/* ---------- widget (ipywidgets) ---------- */
const SAFE_TAGS = /^(h[1-6]|b|i|em|strong|p|br|small|code|span|div|ul|li)$/i;
function safeHtml(s){
  const doc = new DOMParser().parseFromString("<div>" + String(s) + "</div>", "text/html"), root = doc.body.firstChild;
  (function walk(n){ for (const c of [...n.childNodes]){ if (c.nodeType === 1){ if (!SAFE_TAGS.test(c.tagName)){ c.replaceWith(...c.childNodes); walk(n); return; } [...c.attributes].forEach(a => c.removeAttribute(a.name)); walk(c); } else if (c.nodeType !== 3) c.remove(); } })(root);
  return root.innerHTML;
}
function wNew(kind, o){
  o = o || {}; let v = o.value !== undefined ? o.value : null;
  if (v === null && /slider/.test(kind)) v = o.min === undefined ? 0 : +o.min;
  if (v === null && /text/.test(kind)) v = 0;
  const id = ++PF.wid; PF.widgets.set(id, { kind, o, v, kids: [], el: null, cell: null, click: null, self: null }); return id;
}
function wEl(id){
  const w = PF.widgets.get(id); if (w.el) return w.el;
  const o = w.o, mk = (tag, cls) => { const e = document.createElement(tag); if (cls) e.className = cls; return e; };
  let el;
  if (w.kind === "image" || w.kind === "clickimg"){
    const W = +o.width || 224, Hh = +o.height || 224;
    el = mk("div", "pfw-img" + (w.kind === "clickimg" ? " click" : "")); const c = mk("canvas"); c.width = W; c.height = Hh; c.style.width = W + "px"; c.style.height = Hh + "px"; el.appendChild(c);
    if (w.kind === "clickimg") c.addEventListener("click", e => {
      if (!w.click) return;
      const x = Math.max(0, Math.min(W - 1, Math.round(e.offsetX*W/c.clientWidth))), y = Math.max(0, Math.min(Hh - 1, Math.round(e.offsetY*Hh/c.clientHeight)));
      const content = Sk.ffi.remapToPy({ event: "click", eventData: { offsetX: x, offsetY: y } });
      callPy(w.click, [w.self, content, Sk.builtin.none.none$], w.cell);
    });
  } else if (w.kind === "inttext" || w.kind === "floattext"){
    el = mk("label", "pfw-row"); const s = mk("span", "desc"); s.textContent = o.description || ""; const inp = mk("input"); inp.type = "number"; inp.value = w.v === null ? 0 : w.v;
    inp.addEventListener("input", () => { w.v = w.kind === "inttext" ? parseInt(inp.value || "0", 10) : parseFloat(inp.value || "0"); }); el.append(s, inp);
  } else if (w.kind === "floatslider" || w.kind === "intslider"){
    el = mk("label", "pfw-row pfw-slider" + (o.orientation === "vertical" ? " vertical" : "")); const s = mk("span", "desc"); s.textContent = o.description || "";
    const inp = mk("input"); inp.type = "range"; inp.min = o.min === undefined ? 0 : o.min; inp.max = o.max === undefined ? (w.kind === "intslider" ? 100 : 10) : o.max; inp.step = o.step === undefined ? (w.kind === "intslider" ? 1 : 0.1) : o.step;
    if (w.v === null) w.v = +inp.min; inp.value = w.v; const r = mk("span", "readout");
    inp.addEventListener("input", () => { w.v = +inp.value; r.textContent = fmtNum(w); }); el.append(s, inp, r); r.textContent = fmtNum(w);
  } else if (w.kind === "html" || w.kind === "label"){
    el = mk("div", "pfw-html"); if (w.kind === "html") el.innerHTML = safeHtml(w.v || ""); else el.textContent = w.v || "";
  } else {
    el = mk("div", w.kind === "hbox" ? "pfw-hbox" : "pfw-vbox"); w.kids.forEach(k => el.appendChild(wEl(k)));
  }
  w.el = el; paint(id); return el;
}
const fmtNum = w => w.kind === "intslider" ? String(Math.round(w.v)) : (+w.v).toFixed(2);
function paint(id){
  const w = PF.widgets.get(id); if (!w || !w.el) return;
  if (w.kind === "image" || w.kind === "clickimg"){ if (w.v) drawFrame(w.el.firstChild, w.v); }
  else if (w.kind === "inttext" || w.kind === "floattext") w.el.querySelector("input").value = w.v;
  else if (w.kind === "floatslider" || w.kind === "intslider"){ const inp = w.el.querySelector("input"); inp.value = w.v; w.el.querySelector(".readout").textContent = fmtNum(w); }
  else if (w.kind === "html") w.el.innerHTML = safeHtml(w.v || "");
  else if (w.kind === "label") w.el.textContent = w.v || "";
}
function wSet(id, key, v){
  const w = PF.widgets.get(id); if (!w) return;
  if (key === "value"){
    if ((w.kind === "floatslider" || w.kind === "intslider") && typeof v === "number"){ const lo = w.o.min === undefined ? 0 : +w.o.min, hi = w.o.max === undefined ? (w.kind === "intslider" ? 100 : 10) : +w.o.max; v = Math.max(lo, Math.min(hi, v)); if (w.kind === "intslider") v = Math.round(v); }
    w.v = v; paint(id);
  } else if (key === "children"){ w.kids = v; if (w.el){ w.el.replaceChildren(...v.map(wEl)); } }
  else { w.o[key] = v; if (w.el && key === "description"){ const d = w.el.querySelector(".desc"); if (d) d.textContent = v; } }
}
function setCell(id, cell){ const w = PF.widgets.get(id); if (!w) return; w.cell = cell; w.kids.forEach(k => setCell(k, cell)); }
function wDisplay(id){ const cell = K.cb || K.cur; if (!cell) return; const el = wEl(id); setCell(id, cell); cell.out.appendChild(el); }

/* ---------- gọi hàm Python từ JavaScript (nút bấm ảnh, camera.observe, traitlets.dlink) ---------- */
async function callPy(fn, args, cell){
  K.cb = cell || null;
  try { return await Sk.misceval.asyncToPromise(() => Sk.misceval.callsimOrSuspendArray(fn, args)); }
  catch (e){ if (cell) outError(cell, e); else console.error(e); throw e; }
  finally { K.cb = null; }
}

/* ---------- camera stream: dlink ảnh camera vào widget + observe('value') ---------- */
function cam(cid){ if (!PF.cams.has(cid)) PF.cams.set(cid, { links: [], obs: [] }); return PF.cams.get(cid); }
function ensureTimer(){ if (!PF.timer) PF.timer = setInterval(tick, 100); }
async function tick(){
  if (PF.tickBusy) return;
  const cams = [...PF.cams.values()].filter(c => c.links.length || c.obs.length);
  if (!cams.length){ clearInterval(PF.timer); PF.timer = 0; return; }
  PF.tickBusy = true;
  try {
    for (const c of cams){
      let fid; try { fid = aiCapture(); } catch (e){ return; }
      const frame = () => Sk.misceval.callsimArray(PF.factory, [new Sk.builtin.int_(fid)]);
      for (const l of c.links.slice()){
        const w = PF.widgets.get(l.wid); if (!w || (w.cell && w.el && !w.el.isConnected)){ c.links.splice(c.links.indexOf(l), 1); continue; }
        if (!l.fn){ wSet(l.wid, "value", fid); continue; }
        try { const r = await callPy(l.fn, [frame()], w.cell); const id = Sk.ffi.remapToJs(Sk.abstr.gattr(r, new Sk.builtin.str("_id"))); wSet(l.wid, "value", id); }
        catch (e){ c.links.splice(c.links.indexOf(l), 1); }
      }
      for (const o of c.obs.slice()){
        if (o.busy) continue; o.busy = true;
        try { await callPy(o.fn, [new Sk.builtin.dict([new Sk.builtin.str("new"), frame()])], o.cell); }
        catch (e){ const i = c.obs.indexOf(o); if (i >= 0) c.obs.splice(i, 1); SIM.setMotors(0, 0); }
        o.busy = false;
      }
    }
  } finally { PF.tickBusy = false; }
}
// lỗi Python tương ứng với thông báo (FileNotFoundError, FileExistsError, ValueError)
function pyErr(msg){
  const name = /No such file|not found/i.test(msg) ? "FileNotFoundError" : /File exists/.test(msg) ? "FileExistsError" : /Is a directory/.test(msg) ? "IsADirectoryError" : null;
  const E = name && Sk.builtins[name];
  if (E && E !== Sk.builtin.IOError){ try { return Sk.misceval.callsimArray(E, [new Sk.builtin.str(msg)]); } catch (x){} }
  return name ? new Sk.builtin.IOError(msg) : new Sk.builtin.ValueError(msg);
}
PF.pyErr = pyErr;
// tham số giữ nguyên là đối tượng Python (hàm gọi lại, lớp, widget)
PF.raw = { w_on_click: [1, 2], cam_dlink: [2, 3], cam_observe: [1, 2], cam_unobserve: [1], call_noyield: [0, 1] };
PF.stopAll = () => { PF.cams.clear(); if (PF.timer){ clearInterval(PF.timer); PF.timer = 0; } };

/* ---------- lệnh shell "!..." (như Jupyter) trên ổ đĩa ảo ---------- */
PF.preprocess = src => src.split("\n").map(l => { const m = /^(\s*)!(.*)$/.exec(l); if (!m) return l; return `${m[1]}_shell(f"${m[2].replace(/\\/g, "\\\\").replace(/"/g, '\\"')}")`; }).join("\n");
function shell(cmd){
  const a = (cmd.match(/"[^"]*"|'[^']*'|\S+/g) || []).map(x => x.replace(/^["']|["']$/g, "")), c = a[0] || "", flags = a.filter(x => x.startsWith("-")).join(""), args = a.slice(1).filter(x => !x.startsWith("-"));
  const count = p => vIsDir(p) ? Object.keys(vidx()).filter(k => k.startsWith(norm(p) + "/") && vidx()[k].k !== "dir").length : vExists(p) ? 1 : 0;
  if (c === "zip"){
    if (args.length < 2) return "zip: cú pháp: !zip -r tên.zip thư_mục";
    let out = args[0]; if (!/\.zip$/i.test(out)) out += ".zip";
    const list = [];
    for (const p of args.slice(1)){ if (!vExists(p)) throw new Error("zip warning: name not matched: " + p); for (const k of filesUnder(p)) if (!list.includes(k) && norm(k) !== norm(out)) list.push(k); }
    const n = list.length, size = list.reduce((s, k) => s + (+vidx()[k].size || 0), 0) + 22 + n*80;
    vPut(out, { k: "zip", n, size }, JSON.stringify(list));
    const NL = String.fromCharCode(10);
    return (flags.includes("q") ? "" : list.slice(0, 20).map(k => "  adding: " + k + " (stored 0%)").join(NL) + (n > 20 ? NL + "  …" : "") + NL) + `(mô phỏng) Đã tạo ${norm(out)} gồm ${n} tệp. Xem và tải về ở bảng Tệp (biểu tượng thư mục bên trái).`;
  }
  if (c === "ls"){ const p = args[0] || ""; if (!vIsDir(p)) return vExists(p) ? p : `ls: cannot access '${p}': No such file or directory`;
    const xs = vList(p).sort(); return flags.includes("l") ? xs.map(n => { const k = norm((p ? p + "/" : "") + n), m = vidx()[k]; return `${m && m.k === "dir" || vIsDir(k) ? "d" : "-"} ${String(m && m.size || count(k)).padStart(8)}  ${n}`; }).join("\n") : xs.join("  "); }
  if (c === "rm"){ for (const p of args){ try { vRemove(p, /r/.test(flags)); } catch (e){ if (!/f/.test(flags)) return "rm: " + e.message; } } return ""; }
  if (c === "mkdir"){ for (const p of args){ if (vExists(p) && !/p/.test(flags)) return `mkdir: cannot create directory '${p}': File exists`; vMakedirs(p); } return ""; }
  if (c === "pwd") return "/home/jetbot/Notebooks";
  if (c === "echo") return a.slice(1).join(" ");
  if (c === "du"){ const p = args[0] || "."; return `${count(p)} tệp\t${p}`; }
  return `(mô phỏng) Lệnh "${c}" không chạy trong trình duyệt. Có: ls, rm, mkdir, zip, du, pwd.`;
}

/* ---------- module JavaScript "_pf" cho các thư viện Python ---------- */
const PF_JS = `var $builtinmodule = function(name){
  var P = window.PF._api, js = Sk.ffi.remapToJs, py = Sk.ffi.remapToPy, N = Sk.builtin.none.none$, m = { __name__: new Sk.builtin.str("_pf") };
  var RAW = window.PF.raw;
  function wrap(name, fn){ var raw = RAW[name] || []; return new Sk.builtin.func(function(){ var a = Array.prototype.map.call(arguments, function(x, i){ return raw.indexOf(i) >= 0 ? x : js(x); });
    try { var r = fn.apply(null, a); return r === undefined || r === null ? N : (r.$py !== undefined ? r.$py : py(r)); }
    catch (e) { if (e instanceof Error) throw window.PF.pyErr(e.message); throw e; } }); }
  for (var k in P) m[k] = wrap(k, P[k]);
  return m;
};`;
PF._api = {
  // khung ảnh
  frame_copy: frameCopy, frame_circle: frameCircle,
  // ổ đĩa ảo
  vfs_exists: p => vExists(p), vfs_isdir: p => vIsDir(p), vfs_isfile: p => { const m = vidx()[norm(p)]; return !!m && m.k !== "dir"; },
  vfs_makedirs: (p, ok) => { if (vExists(p) && !ok) throw new Error("[Errno 17] File exists: '" + p + "'"); vMakedirs(p); },
  vfs_listdir: p => vList(p), vfs_glob: p => vGlob(p), vfs_remove: (p, rec) => vRemove(p, !!rec),
  vfs_write_frame: (p, fid) => vWriteImg(p, fid), vfs_write_text: (p, s) => vPut(p, { k: "text", size: String(s).length }, String(s)),
  vfs_read_text: p => { const m = vMeta(p); return m.k === "text" ? (ls.get(VF + norm(p)) || "") : "<" + m.k + ">"; },
  vfs_save_state: (p, sid) => vWriteModel(p, get(sid)), vfs_load_state: p => put(vReadModel(p)),
  // PIL
  pil_open: p => pil(new Float32Array(vReadImg(p))), pil_fromarray: (fid, bgr) => pilFromFrame(fid, !!bgr), pil_size: id => { const s = get(id); return [s.w, s.h]; },
  pil_hflip: pilFlip, pil_jitter: pilJitter, pil_resize: (id, w, h) => { const s = get(id); return pil(new Float32Array(s.d), w, h); },
  // tensor
  t_new: (flat, shape) => T(Float32Array.from(flat.map(Number)), shape && shape.length ? shape : [flat.length]),
  t_zeros: shape => { const n = prod(shape), big = n > 4*D; return T(new Float32Array(big ? D*Math.max(1, shape.length === 4 ? shape[0] : 1) : n), shape, { img: big }); },
  t_from_pil: id => { const s = get(id); return T(new Float32Array(s.d), [3, s.h, s.w], { img: true }); },
  t_shape: id => get(id).s, t_numel: id => get(id).d.length, t_item: (id, i) => { const d = get(id).d; if (i < 0) i += d.length; if (i < 0 || i >= d.length) throw new Error("index out of range"); return d[i]; },
  t_tolist: id => Array.from(get(id).d), t_copy: id => { const a = get(id); return T(new Float32Array(a.d), a.s.slice(), { img: a.img }); },
  t_view: (id, shape) => { const a = get(id); return T(a.d, shape, { img: a.img, cache: a.cache, back: a.back }); },
  t_flip0: tFlip0, t_op: (id, op, other, scalar) => tOp(id, op, other || 0, scalar), t_normalize: tNormalize, t_stack: tStack,
  // mô hình
  m_new: out => mNew(out), m_forward: mForward, mse_loss: mse, backward: backward, opt_new: optNew, opt_zero: optZero, opt_step: optStep,
  m_state: mState, m_load: mLoad, m_from_state: mFromState, m_out: id => get(id).out,
  // widget
  w_new: (kind, o) => wNew(kind, o), w_set: wSet, w_get: (id, key) => { const w = PF.widgets.get(id); return key === "value" ? w.v : w.o[key]; },
  w_display: wDisplay, w_on_click: (id, fn, self) => { const w = PF.widgets.get(id); w.click = fn; w.self = self; },
  // camera
  cam_new: () => ++PF.cid,
  cam_dlink: (cid, wid, fn, factory) => {
    PF.factory = factory; cam(cid).links.push({ wid, fn: fn === Sk.builtin.none.none$ ? null : fn });
    try { wSet(wid, "value", aiCapture()); } catch (e) {}   // có ảnh ngay, không chờ khung đầu tiên
    ensureTimer();
  },
  cam_observe: (cid, fn, factory) => { PF.factory = factory; cam(cid).obs.push({ fn, cell: K.cb || K.cur, busy: false }); ensureTimer(); },
  cam_unobserve: (cid, fn) => { const c = cam(cid); c.obs = c.obs.filter(o => o.fn !== fn); },
  // camera.stop(): dừng các hàm gọi lại điều khiển robot. Ảnh xem trực tiếp vẫn chạy khi widget còn trên màn hình,
  // vì nút "Chạy" chạy cả notebook: ô camera.stop() ngay bên dưới sẽ làm ảnh để bấm gán nhãn bị đứng.
  cam_stop: cid => { const c = PF.cams.get(cid); if (c) c.obs = []; },
  // khác
  uuid1: () => { const h = n => Array.from(crypto.getRandomValues(new Uint8Array(n)), b => b.toString(16).padStart(2, "0")).join(""); const x = h(16); return `${x.slice(0, 8)}-${x.slice(8, 12)}-1${x.slice(13, 16)}-${x.slice(16, 20)}-${x.slice(20, 32)}`; },
  json_dumps: s => JSON.stringify(s), json_loads: s => JSON.parse(s),
  call_noyield: (fn, arg) => { const yl = Sk.yieldLimit; Sk.yieldLimit = Number.POSITIVE_INFINITY; try { return { $py: Sk.misceval.callsimArray(fn, [arg]) }; } finally { Sk.yieldLimit = yl; } }
};

/* ---------- các thư viện Python ---------- */
const PY = {};
PY["_torchcore.py"] = `import _pf
import math
import random
import _np

class device(object):
    def __init__(self, kind='cpu'):
        self.type = str(kind).split(':')[0]
    def __repr__(self):
        return "device(type='%s')" % self.type

def _flat(x, out, shape, depth):
    if isinstance(x, (list, tuple)):
        if len(shape) <= depth:
            shape.append(len(x))
        for v in x:
            _flat(v, out, shape, depth + 1)
    elif isinstance(x, Tensor):
        out.extend(x.tolist())
    else:
        out.append(float(x))
    return out

class Tensor(object):
    def __init__(self, data=None, _t=None):
        if _t is not None:
            self._t = _t
        else:
            shape = []
            flat = _flat(data if data is not None else [], [], shape, 0)
            self._t = _pf.t_new(flat, shape)
    # thiết bị / kiểu dữ liệu: mô phỏng chạy trên CPU của trình duyệt, giữ nguyên tensor
    def to(self, *a, **k): return self
    def cuda(self, *a, **k): return self
    def cpu(self): return self
    def half(self): return self
    def float(self): return self
    def double(self): return self
    def detach(self): return self
    def contiguous(self): return self
    def requires_grad_(self, *a): return self
    def numpy(self):
        return _np.ndarray(_t=self._t)
    @property
    def shape(self):
        return tuple(_pf.t_shape(self._t))
    def size(self, dim=None):
        s = self.shape
        return s if dim is None else s[dim]
    def dim(self):
        return len(self.shape)
    def numel(self):
        return _pf.t_numel(self._t)
    def item(self):
        return _pf.t_item(self._t, 0)
    def tolist(self):
        return _pf.t_tolist(self._t)
    def __float__(self):
        return float(_pf.t_item(self._t, 0))
    def __int__(self):
        return int(_pf.t_item(self._t, 0))
    def __len__(self):
        return self.shape[0]
    def _other(self, o):
        return (o._t, 0) if isinstance(o, Tensor) else (None, float(o))
    def sub_(self, o): a, b = self._other(o); _pf.t_op(self._t, 'sub', a, b); return self
    def add_(self, o): a, b = self._other(o); _pf.t_op(self._t, 'add', a, b); return self
    def mul_(self, o): a, b = self._other(o); _pf.t_op(self._t, 'mul', a, b); return self
    def div_(self, o): a, b = self._other(o); _pf.t_op(self._t, 'div', a, b); return self
    def _new(self, op, o):
        r = Tensor(_t=_pf.t_copy(self._t)); a, b = r._other(o); _pf.t_op(r._t, op, a, b); return r
    def __sub__(self, o): return self._new('sub', o)
    def __add__(self, o): return self._new('add', o)
    def __mul__(self, o): return self._new('mul', o)
    def __truediv__(self, o): return self._new('div', o)
    def __getitem__(self, key):
        s = list(self.shape)
        if not isinstance(key, tuple):
            key = (key,)
        if len(key) and key[0] is None:
            return Tensor(_t=_pf.t_view(self._t, [1] + s))
        if len(key) and isinstance(key[0], slice) and all(k is None for k in key[1:]):
            return Tensor(_t=_pf.t_view(self._t, s + [1] * (len(key) - 1)))
        if len(key) == 1 and isinstance(key[0], int):
            if len(s) == 1:
                return _pf.t_item(self._t, key[0])
        raise IndexError("Mô phỏng chỉ hỗ trợ x[None, ...] và x[:, None, None]")
    def backward(self):
        _pf.backward(self._t)
    def __repr__(self):
        n = self.numel()
        if n <= 8:
            return 'tensor(' + str([round(v, 4) for v in self.tolist()]) + ')'
        return 'tensor(shape=' + str(list(self.shape)) + ')'

FloatTensor = Tensor

def tensor(data, **kw):
    return Tensor(data)

def from_numpy(a):
    return Tensor(_t=a._t)

def zeros(*shape, **kw):
    if len(shape) == 1 and isinstance(shape[0], (list, tuple)):
        shape = shape[0]
    return Tensor(_t=_pf.t_zeros([int(v) for v in shape]))

def stack(ts, dim=0):
    return Tensor(_t=_pf.t_stack([t._t for t in ts]))

class _NoGrad(object):
    def __enter__(self): return self
    def __exit__(self, *a): return False

def no_grad():
    return _NoGrad()

class _Cuda(object):
    def is_available(self): return True
    def device_count(self): return 1
cuda = _Cuda()

# ---------- mạng nơ-ron ----------
class Module(object):
    training = True
    def __init__(self, *a, **k):
        pass
    def to(self, *a, **k): return self
    def cuda(self, *a, **k): return self
    def cpu(self): return self
    def half(self): return self
    def float(self): return self
    def train(self, mode=True):
        self.training = mode
        return self
    def eval(self):
        return self.train(False)

class Linear(Module):
    def __init__(self, in_features, out_features, bias=True):
        self.in_features = int(in_features)
        self.out_features = int(out_features)
    def __repr__(self):
        return 'Linear(in_features=%d, out_features=%d, bias=True)' % (self.in_features, self.out_features)

class _Params(object):
    def __init__(self, net):
        self.net = net

class _Net(Module):
    """Mô hình mô phỏng: ảnh 24x24 màu → 48 nơ-ron → số đầu ra của lớp fc"""
    def __init__(self, out=1000):
        self.fc = Linear(512, out)
        self._m = None
    def _core(self):
        if self._m is None or _pf.m_out(self._m) != self.fc.out_features:
            self._m = _pf.m_new(self.fc.out_features)
        return self._m
    def parameters(self):
        return [_Params(self)]
    def __call__(self, x):
        return Tensor(_t=_pf.m_forward(self._core(), x._t))
    def forward(self, x):
        return self(x)
    def state_dict(self):
        return _StateDict(_pf.m_state(self._core()))
    def load_state_dict(self, sd, strict=True):
        if not isinstance(sd, _StateDict):
            raise TypeError('load_state_dict: cần state_dict (từ torch.load hoặc model.state_dict())')
        self.fc = Linear(512, sd.out)
        _pf.m_load(self._core(), sd._s)
        return self
    def __repr__(self):
        return 'ResNet(\\n  (mô phỏng): ảnh 24x24x3 → Linear(1728, 48) → ReLU → Linear(48, %d)\\n  (fc): %r\\n)' % (self.fc.out_features, self.fc)

class _StateDict(object):
    def __init__(self, s, out=None):
        self._s = s
        self.out = _pf.m_out(s) if out is None else out
    def __repr__(self):
        return 'OrderedDict(fc.weight, fc.bias, ... %d đầu ra)' % self.out

def save(obj, path):
    if isinstance(obj, _Net):
        obj = obj.state_dict()
    if not isinstance(obj, _StateDict):
        raise TypeError('Mô phỏng chỉ lưu được model.state_dict()')
    _pf.vfs_save_state(str(path), obj._s)

def load(path, *a, **k):
    return _StateDict(_pf.vfs_load_state(str(path)))

# ---------- hàm mất mát, tối ưu ----------
def mse_loss(input, target, *a, **k):
    return Tensor(_t=_pf.mse_loss(input._t, target._t))

def relu(x, *a, **k):
    return x

class Adam(object):
    def __init__(self, params, lr=0.001, **kw):
        p = list(params)
        if not p or not isinstance(p[0], _Params):
            raise TypeError('optim.Adam(model.parameters())')
        self._o = _pf.opt_new(p[0].net._core(), float(lr))
    def zero_grad(self, *a, **k):
        _pf.opt_zero(self._o)
    def step(self, *a, **k):
        _pf.opt_step(self._o)

SGD = Adam

# ---------- dữ liệu ----------
class Dataset(object):
    def __getitem__(self, i):
        raise NotImplementedError
    def __len__(self):
        raise NotImplementedError

class Subset(Dataset):
    def __init__(self, dataset, indices):
        self.dataset = dataset
        self.indices = indices
    def __getitem__(self, i):
        return self.dataset[self.indices[i]]
    def __len__(self):
        return len(self.indices)

def random_split(dataset, lengths, generator=None):
    n = len(dataset)
    if sum(lengths) != n:
        raise ValueError('Tổng độ dài các phần phải bằng số phần tử của dataset')
    idx = list(range(n))
    random.shuffle(idx)
    out = []
    k = 0
    for L in lengths:
        out.append(Subset(dataset, idx[k:k + L]))
        k += L
    return out

class DataLoader(object):
    def __init__(self, dataset, batch_size=1, shuffle=False, num_workers=0, **kw):
        self.dataset = dataset
        self.batch_size = int(batch_size)
        self.shuffle = shuffle
    def __len__(self):
        return (len(self.dataset) + self.batch_size - 1) // self.batch_size
    def __iter__(self):
        return _LoaderIter(self)

# Bộ lặp kiểu lớp (không dùng generator): Skulpt có thể cắt ngang generator khi tạm dừng chia thời gian.
class _LoaderIter(object):
    def __init__(self, loader):
        self.loader = loader
        self.idx = list(range(len(loader.dataset)))
        if loader.shuffle:
            random.shuffle(self.idx)
        self.k = 0
    def __iter__(self):
        return self
    def __next__(self):
        if self.k >= len(self.idx):
            raise StopIteration
        part = self.idx[self.k:self.k + self.loader.batch_size]
        self.k += self.loader.batch_size
        # dựng lô trong JavaScript với chia thời gian tắt: Skulpt kết thúc vòng for sớm nếu __next__ bị tạm dừng
        return _pf.call_noyield(self._batch, part)
    def _batch(self, part):
        items = []
        for i in part:
            items.append(self.loader.dataset[i])
        cols = []
        for j in range(len(items[0])):
            cols.append(stack([it[j] for it in items]))
        return tuple(cols)
    next = __next__
`;
PY["torch/__init__.py"] = `from _torchcore import *
from _torchcore import _Net, _StateDict
import _torchcore as _c

class _NS(object):
    def __init__(self, **kw):
        for k in kw:
            setattr(self, k, kw[k])

# torch.utils.data dùng được ngay sau "import torch" (như PyTorch thật)
utils = _NS(data=_NS(Dataset=_c.Dataset, DataLoader=_c.DataLoader, Subset=_c.Subset, random_split=_c.random_split))
__version__ = '1.10.0 (mô phỏng JetBot Lab)'
`;
PY["torch/nn/__init__.py"] = `from _torchcore import Module, Linear
`;
PY["torch/nn/functional.py"] = `from _torchcore import mse_loss, relu\n`;
PY["torch/optim.py"] = `from _torchcore import Adam, SGD\n`;
PY["torchvision/__init__.py"] = `__version__ = '0.11.0 (mô phỏng)'
`;
PY["_tvm.py"] = `from _torchcore import _Net

def resnet18(pretrained=False, **kw):
    return _Net(1000)

alexnet = resnet18
resnet34 = resnet18
`;
PY["torchvision/models.py"] = `from _tvm import *
`;
PY["torchvision/datasets.py"] = `from _tvd import *
`;
PY["_tvd.py"] = `class ImageFolder(object):
    def __init__(self, *a, **k):
        raise NotImplementedError('ImageFolder chưa có trong mô phỏng: dùng Dataset tự viết như bài path following')
`;
PY["_tvt.py"] = `import _pf
import _pil
import _tvf
functional = _tvf
from _tvf import to_tensor, normalize

class ColorJitter(object):
    def __init__(self, brightness=0, contrast=0, saturation=0, hue=0):
        self.b = float(brightness); self.c = float(contrast); self.s = float(saturation); self.h = float(hue)
    def __call__(self, img):
        return _pil.Image(_pf.pil_jitter(img._p, self.b, self.c, self.s, self.h))

class Resize(object):
    def __init__(self, size):
        self.size = size
    def __call__(self, img):
        return _tvf.resize(img, self.size)

class ToTensor(object):
    def __call__(self, img):
        return to_tensor(img)

class Normalize(object):
    def __init__(self, mean, std):
        self.mean = mean; self.std = std
    def __call__(self, t):
        return normalize(t, self.mean, self.std)

class Compose(object):
    def __init__(self, ts):
        self.ts = ts
    def __call__(self, x):
        for t in self.ts:
            x = t(x)
        return x
`;
PY["torchvision/transforms/__init__.py"] = `from _tvt import *
import _tvf as functional
`;
PY["torchvision/transforms/functional.py"] = `from _tvf import *
`;
PY["_tvf.py"] = `import _pf
from _torchcore import Tensor
import _pil

def _img(x):
    if not hasattr(x, '_p'):
        raise TypeError('Cần ảnh PIL (PIL.Image.open / PIL.Image.fromarray)')
    return x

def hflip(img):
    return _pil.Image(_pf.pil_hflip(_img(img)._p))

def resize(img, size, *a, **k):
    if isinstance(size, int):
        size = (size, size)
    return _pil.Image(_pf.pil_resize(_img(img)._p, int(size[1]), int(size[0])))

def to_tensor(img):
    return Tensor(_t=_pf.t_from_pil(_img(img)._p))

def normalize(t, mean, std, inplace=False):
    return Tensor(_t=_pf.t_normalize(t._t, [float(v) for v in mean], [float(v) for v in std]))
`;
PY["torch2trt.py"] = `import _pf
from _torchcore import _Net, _StateDict, Linear

class TRTModule(_Net):
    """Mô hình đã tối ưu TensorRT (mô phỏng: dùng chung mạng nơ-ron với PyTorch)"""
    def __init__(self, *a, **k):
        _Net.__init__(self, 2)

def torch2trt(model, inputs, fp16_mode=False, **kw):
    m = TRTModule()
    m.load_state_dict(model.state_dict())
    return m
`;
PY["PIL/__init__.py"] = `# package
`;
PY["_pil.py"] = `import _pf

class Image(object):
    def __init__(self, p):
        self._p = p
    @property
    def size(self):
        s = _pf.pil_size(self._p)
        return (s[0], s[1])
    @property
    def width(self): return self.size[0]
    @property
    def height(self): return self.size[1]
    def __repr__(self):
        return '<PIL.Image.Image image mode=RGB size=%dx%d>' % self.size

def open(fp, *a, **k):
    return Image(_pf.pil_open(str(fp)))

def fromarray(arr, mode=None):
    if not hasattr(arr, '_id'):
        raise TypeError('fromarray: cần ảnh camera (camera.value)')
    return Image(_pf.pil_fromarray(arr._id, getattr(arr, '_bgr', True)))
`;
PY["PIL/Image.py"] = `from _pil import *
from _pil import open, fromarray, Image
`;
PY["_np.py"] = `import _pf
import math
import random as _random

pi = math.pi
float32 = float
float64 = float
uint8 = int

class ndarray(object):
    def __init__(self, _t=None, _l=None):
        self._t = _t
        self._l = _l
    @property
    def shape(self):
        return tuple(_pf.t_shape(self._t)) if self._t is not None else (len(self._l),)
    @property
    def size(self):
        return _pf.t_numel(self._t) if self._t is not None else len(self._l)
    def _vals(self):
        return _pf.t_tolist(self._t) if self._t is not None else list(self._l)
    def __getitem__(self, k):
        if isinstance(k, slice) and k.start is None and k.stop is None and k.step == -1:
            if self._t is not None:
                return ndarray(_t=_pf.t_flip0(self._t))
            return ndarray(_l=self._l[::-1])
        if isinstance(k, int):
            return _pf.t_item(self._t, k) if self._t is not None else self._l[k]
        raise IndexError('Mô phỏng numpy chỉ hỗ trợ a[i] và a[::-1]')
    def copy(self):
        return ndarray(_t=_pf.t_copy(self._t)) if self._t is not None else ndarray(_l=list(self._l))
    def flatten(self):
        return ndarray(_t=_pf.t_view(self._t, [_pf.t_numel(self._t)])) if self._t is not None else self.copy()
    ravel = flatten
    def tolist(self):
        return self._vals()
    def astype(self, t):
        return self
    def __float__(self):
        v = self._vals()
        if len(v) != 1:
            raise TypeError('only size-1 arrays can be converted to Python scalars')
        return float(v[0])
    def __len__(self):
        return self.shape[0]
    def __iter__(self):
        return iter(self._vals())
    def __repr__(self):
        v = self._vals()
        return 'array(' + str([round(x, 4) for x in v[:8]]) + (' ...)' if len(v) > 8 else ')')

class _Random(object):
    def rand(self, *shape):
        n = 1
        for s in shape:
            n *= int(s)
        if not shape:
            return _random.random()
        return ndarray(_l=[_random.random() for i in range(n)])
    def random(self, size=None):
        return self.rand() if size is None else self.rand(size)
    def randint(self, a, b=None, size=None):
        return _random.randrange(a) if b is None else _random.randrange(a, b)
    def uniform(self, a=0.0, b=1.0, size=None):
        return _random.uniform(a, b)
random = _Random()

def array(x, dtype=None):
    if isinstance(x, ndarray):
        return x.copy()
    return ndarray(_l=[float(v) for v in x])

def arctan2(y, x): return math.atan2(float(y), float(x))
def arctan(x): return math.atan(float(x))
def sin(x): return math.sin(float(x))
def cos(x): return math.cos(float(x))
def sqrt(x): return math.sqrt(float(x))
def abs(x): return math.fabs(float(x))
def clip(x, a, b): return max(a, min(b, float(x)))
def mean(x): v = list(x); return sum(v) / len(v)
`;
PY["numpy/__init__.py"] = `from _np import *
from _np import ndarray, random, array, arctan2, pi
`;
PY["cv2.py"] = `import _pf

def circle(img, center, radius, color, thickness=1, *a, **k):
    _pf.frame_circle(img._id, int(center[0]), int(center[1]), int(radius), [int(c) for c in color], int(thickness))
    return img
`;
PY["uuid.py"] = `import _pf

class UUID(object):
    def __init__(self, s):
        self.hex = s.replace('-', '')
        self._s = s
    def __str__(self):
        return self._s
    def __repr__(self):
        return "UUID('" + self._s + "')"

def uuid1(*a, **k):
    return UUID(_pf.uuid1())

uuid4 = uuid1
`;
PY["os.py"] = `import _pf

sep = '/'
name = 'posix'

class _Path(object):
    sep = '/'
    def join(self, a, *p):
        out = str(a)
        for x in p:
            x = str(x)
            if x.startswith('/'):
                out = x
            elif not out or out.endswith('/'):
                out = out + x
            else:
                out = out + '/' + x
        return out
    def basename(self, p):
        return str(p).rstrip('/').split('/')[-1] if '/' in str(p) else str(p)
    def dirname(self, p):
        p = str(p)
        return p[:p.rfind('/')] if '/' in p else ''
    def split(self, p):
        return (self.dirname(p), self.basename(p))
    def splitext(self, p):
        b = self.basename(p)
        i = b.rfind('.')
        if i <= 0:
            return (str(p), '')
        p = str(p)
        return (p[:len(p) - len(b) + i], b[i:])
    def exists(self, p): return _pf.vfs_exists(str(p))
    def isdir(self, p): return _pf.vfs_isdir(str(p))
    def isfile(self, p): return _pf.vfs_isfile(str(p))
    def abspath(self, p): return '/home/jetbot/Notebooks/' + str(p)
path = _Path()

def makedirs(name, mode=511, exist_ok=False):
    _pf.vfs_makedirs(str(name), bool(exist_ok))

def mkdir(name, mode=511):
    if not _pf.vfs_isdir(path.dirname(str(name)) or '.'):
        raise FileNotFoundError("No such file or directory: '" + str(name) + "'")
    _pf.vfs_makedirs(str(name), False)

def listdir(p='.'):
    return _pf.vfs_listdir(str(p))

def remove(p):
    if _pf.vfs_isdir(str(p)):
        raise IsADirectoryError("Is a directory: '" + str(p) + "'")
    _pf.vfs_remove(str(p), False)
unlink = remove

def rmdir(p):
    _pf.vfs_remove(str(p), False)

def getcwd():
    return '/home/jetbot/Notebooks'

environ = {}
`;
PY["glob.py"] = `import _pf

def glob(pathname, recursive=False):
    return _pf.vfs_glob(str(pathname))
`;
PY["json.py"] = `import _pf

def dumps(obj, **kw):
    return _pf.json_dumps(obj)

def loads(s, **kw):
    return _pf.json_loads(str(s))

def dump(obj, fp, **kw):
    fp.write(dumps(obj))

def load(fp, **kw):
    return loads(fp.read())
`;
PY["_ipyw.py"] = `import _pf
import jetbot as _jb

class Widget(object):
    _kind = 'vbox'
    def __init__(self, **kw):
        self._wid = _pf.w_new(self._kind, {k: v for k, v in kw.items() if isinstance(v, (int, float, str, bool))})
        self._obs = []
        if 'value' in kw and not isinstance(kw['value'], (int, float, str, bool)):
            self.value = kw['value']
    def _ipython_display_(self):
        _pf.w_display(self._wid)
    def observe(self, handler, names=None):
        self._obs.append(handler)
    def unobserve(self, handler, names=None):
        self._obs = [h for h in self._obs if h is not handler]
    def _get_value(self):
        return _pf.w_get(self._wid, 'value')
    def _set_value(self, v):
        old = self._get_value()
        _pf.w_set(self._wid, 'value', v)
        for h in self._obs:
            h({'name': 'value', 'old': old, 'new': v, 'owner': self, 'type': 'change'})
    value = property(_get_value, _set_value)
    def _get_desc(self):
        return _pf.w_get(self._wid, 'description')
    def _set_desc(self, v):
        _pf.w_set(self._wid, 'description', str(v))
    description = property(_get_desc, _set_desc)

DOMWidget = Widget

class Image(Widget):
    _kind = 'image'
    def __init__(self, value=b'', format='jpeg', width=224, height=224, **kw):
        Widget.__init__(self, width=int(width), height=int(height))
        self.format = format
        self.width = width
        self.height = height
        if value:
            self.value = value
    def _get_value(self):
        fid = _pf.w_get(self._wid, 'value')
        if not fid:
            return b''
        return _jb.JpegImage(fid)
    def _set_value(self, v):
        if hasattr(v, '_id'):
            _pf.w_set(self._wid, 'value', v._id)
        elif not v:
            _pf.w_set(self._wid, 'value', 0)
        else:
            raise TypeError('Image.value: cần ảnh JPEG (bgr8_to_jpeg(camera.value))')
    value = property(_get_value, _set_value)

class IntText(Widget):
    _kind = 'inttext'
    def __init__(self, value=0, description='', **kw):
        Widget.__init__(self, value=int(value), description=str(description))
    def _set_value(self, v):
        _pf.w_set(self._wid, 'value', int(v))
    value = property(Widget._get_value, _set_value)

class FloatText(Widget):
    _kind = 'floattext'
    def __init__(self, value=0.0, description='', **kw):
        Widget.__init__(self, value=float(value), description=str(description))

class _Slider(Widget):
    def __init__(self, value=None, min=0.0, max=10.0, step=0.1, description='', orientation='horizontal', **kw):
        o = dict(min=float(min), max=float(max), step=float(step), description=str(description), orientation=str(orientation))
        if value is not None:
            o['value'] = float(value)
        Widget.__init__(self, **o)
    def _set_value(self, v):
        Widget._set_value(self, float(v))
    value = property(Widget._get_value, _set_value)

class FloatSlider(_Slider):
    _kind = 'floatslider'

class IntSlider(_Slider):
    _kind = 'intslider'
    def __init__(self, value=None, min=0, max=100, step=1, **kw):
        _Slider.__init__(self, value, min, max, step, **kw)

class HTML(Widget):
    _kind = 'html'
    def __init__(self, value='', **kw):
        Widget.__init__(self, value=str(value))

class Label(Widget):
    _kind = 'label'
    def __init__(self, value='', **kw):
        Widget.__init__(self, value=str(value))

class Box(Widget):
    _kind = 'vbox'
    def __init__(self, children=(), **kw):
        Widget.__init__(self)
        self.children = children
    def _get_children(self):
        return self._children
    def _set_children(self, c):
        self._children = tuple(c)
        _pf.w_set(self._wid, 'children', [w._wid for w in self._children])
    children = property(_get_children, _set_children)

class VBox(Box):
    _kind = 'vbox'

class HBox(Box):
    _kind = 'hbox'

class Layout(object):
    def __init__(self, **kw):
        pass

`;
PY["ipywidgets/__init__.py"] = `from _ipyw import *
from _ipyw import Widget, DOMWidget, Image, IntText, FloatText, FloatSlider, IntSlider, HTML, Label, Box, VBox, HBox, Layout
`;
PY["ipywidgets/widgets.py"] = `from _ipyw import Widget, DOMWidget, Image, IntText, FloatText, FloatSlider, IntSlider, HTML, Label, Box, VBox, HBox, Layout\n`;
PY["jupyter_clickable_image_widget.py"] = `import _pf
from _ipyw import Image

class ClickableImageWidget(Image):
    """Ảnh camera bấm được: mỗi lần bấm gọi hàm on_msg(widget, content, buffers)"""
    _kind = 'clickimg'
    def on_msg(self, callback, remove=False):
        _pf.w_on_click(self._wid, None if remove else callback, self)
`;
PY["traitlets.py"] = `import _pf
import jetbot as _jb

def dlink(source, target, transform=None):
    src, sname = source
    dst, dname = target
    if hasattr(src, '_cam') and sname == 'value' and hasattr(dst, '_wid'):
        _pf.cam_dlink(src._cam(), dst._wid, transform, _jb.CameraImage)
        return
    v = getattr(src, sname)
    setattr(dst, dname, transform(v) if transform else v)

def link(source, target):
    dlink(source, target)

class HasTraits(object):
    pass
`;
PY["IPython/__init__.py"] = `# package
`;
PY["IPython/display.py"] = `import _pf

def display(*objs, **kw):
    for o in objs:
        if hasattr(o, '_wid'):
            _pf.w_display(o._wid)
        elif hasattr(o, 'show'):
            o.show()
        else:
            print(repr(o))

def clear_output(wait=False):
    pass
`;

for (const k in PY) PYLIB["src/lib/" + k] = PY[k];
PYLIB["src/lib/_pf.js"] = PF_JS;
for (const m of ["_np", "_ipyw", "_pf", "_torchcore", "_tvm", "_tvt", "_tvf", "_tvd", "_pil", "ipywidgets", "traitlets", "IPython", "jupyter_clickable_image_widget", "uuid", "os", "glob", "json", "numpy", "cv2", "PIL", "torch", "torchvision", "torch2trt"]) PY_ALLOWED.add(m);

/* ---------- nạp sẵn các module theo đúng thứ tự phụ thuộc ----------
   Skulpt chia nhỏ thời gian chạy (yieldLimit); nếu việc tạm dừng rơi vào lúc một module đang nạp module khác qua
   "from X import ...", module cha nhận về module nạp dở. Nạp trước từng module ở cấp cao nhất thì mọi lần import lồng
   nhau sau đó chỉ lấy từ bộ nhớ đệm. */
const PRELOAD = ["_pf", "jetbot", "_np", "numpy", "_torchcore", "torch", "torch.nn", "torch.nn.functional", "torch.optim", "_pil", "PIL", "PIL.Image",
  "_tvf", "_tvt", "_tvm", "_tvd", "torchvision", "torchvision.models", "torchvision.transforms", "torchvision.transforms.functional", "torchvision.datasets",
  "torch2trt", "_ipyw", "ipywidgets", "ipywidgets.widgets", "jupyter_clickable_image_widget", "traitlets", "IPython", "IPython.display", "uuid", "os", "glob", "json", "cv2"];
const NEED = /\b(torch|torchvision|numpy|PIL|cv2|ipywidgets|traitlets|IPython|jupyter_clickable_image_widget|torch2trt|uuid|glob|json|os)\b/;
PF.preloaded = false;
PF.cache = new Map();
// Như Sk.importMainWithBody nhưng giữ lại các module mô phỏng đã nạp (Skulpt xoá sạch sys.modules mỗi lần chạy ô;
// Jupyter thật thì giữ module trong suốt phiên kernel).
PF.runMain = (src, canSuspend = true) => {
  Sk.dateSet = false; Sk.filesLoaded = false; Sk.sysmodules = new Sk.builtin.dict([]); Sk.realsyspath = undefined; Sk.resetCompiler();
  for (const [k, m] of PF.cache) Sk.sysmodules.mp$ass_subscript(new Sk.builtin.str(k), m);
  return Sk.importModuleInternal_("<stdin>", false, "__main__", src, undefined, false, canSuspend);
};
function snapshotModules(){
  const it = Sk.sysmodules.tp$iter();
  for (let k = it.tp$iternext(); k !== undefined; k = it.tp$iternext()){ if (k.v === "__main__") continue; PF.cache.set(k.v, Sk.sysmodules.mp$subscript(k)); }
}
PF.reset = () => { PF.cache.clear(); PF.preloaded = false; };
PF.preload = async src => {
  if (PF.preloaded || !NEED.test(src)) return;
  // nạp từng module một, tắt chia nhỏ thời gian (yieldLimit) để thân lớp lớn (Tensor…) không bị tạm dừng giữa chừng
  const prev = K.cur, yl = Sk.yieldLimit; K.cur = null; Sk.yieldLimit = Number.POSITIVE_INFINITY;
  try {
    for (const m of PRELOAD){ await Sk.misceval.asyncToPromise(() => PF.runMain("import " + m)); snapshotModules(); }
    PF.preloaded = true;
  }
  catch (e){ console.error("preload", e); PF.cache.clear(); }
  finally { K.cur = prev; Sk.yieldLimit = yl; }
};

/* ---------- open() trên ổ đĩa ảo, lệnh shell, các lỗi tệp của Python 3 ---------- */
function install(){
  if (!window.Sk || !Sk.builtins) return;
  const base = Sk.builtin.IOError || Sk.builtin.Exception;
  for (const n of ["FileNotFoundError", "FileExistsError", "IsADirectoryError", "NotADirectoryError", "PermissionError"])
    if (!Sk.builtins[n]) Sk.builtins[n] = Sk.misceval.buildClass({ __name__: new Sk.builtin.str("builtins") }, function(){}, n, [base]);
  if (!Sk.builtins.OSError) Sk.builtins.OSError = base;
  const js = Sk.ffi.remapToJs, N = Sk.builtin.none.none$, S = s => new Sk.builtin.str(s);
  const File = Sk.misceval.buildClass({ __name__: S("builtins") }, function($gbl, $loc){
    $loc.__init__ = new Sk.builtin.func(function(self, path, mode){
      self.$vp = js(path); self.$vm = mode === undefined ? "r" : js(mode); self.$vbuf = [];
      if (/r/.test(self.$vm) && !vExists(self.$vp)) throw pyErr("[Errno 2] No such file or directory: '" + self.$vp + "'");
      if (/[wa]/.test(self.$vm)){ try { vNeedDir(self.$vp); } catch (e){ throw pyErr("[Errno 2] No such file or directory: '" + self.$vp + "'"); } }
      return N;
    });
    $loc.write = new Sk.builtin.func(function(self, data){
      try {
        if (data && data.tp$getattr && data.tp$getattr(S("_id")) !== undefined){ vWriteImg(self.$vp, js(Sk.abstr.gattr(data, S("_id")))); self.$vimg = true; return new Sk.builtin.int_(9000); }
        const s = js(data); self.$vbuf.push(typeof s === "string" ? s : String(s)); return new Sk.builtin.int_(String(s).length);
      } catch (e){ throw pyErr(e.message); }
    });
    $loc.read = new Sk.builtin.func(function(self){ try { return S(PF._api.vfs_read_text(self.$vp)); } catch (e){ throw pyErr(e.message); } });
    $loc.close = new Sk.builtin.func(function(self){ if (!self.$vclosed && /[wa]/.test(self.$vm) && !self.$vimg){ const prev = /a/.test(self.$vm) && vExists(self.$vp) ? PF._api.vfs_read_text(self.$vp) : ""; vPut(self.$vp, { k: "text", size: 0 }, prev + self.$vbuf.join("")); } self.$vclosed = true; return N; });
    $loc.__enter__ = new Sk.builtin.func(function(self){ return self; });
    $loc.__exit__ = new Sk.builtin.func(function(self){ Sk.misceval.callsimArray(Sk.abstr.gattr(self, S("close")), []); return Sk.builtin.bool.false$; });
  }, "VirtualFile", []);
  Sk.builtins.open = new Sk.builtin.func(function(path, mode){ return Sk.misceval.callsimArray(File, mode === undefined ? [path] : [path, mode]); });
  Sk.builtins._shell = new Sk.builtin.func(function(cmd){
    let out; try { out = shell(js(cmd)); } catch (e){ out = e.message; }
    const c = K.cb || K.cur; if (out && c) outText(c, out + "\n"); return N;
  });
}
/* ---------- bảng "Tệp" ở thanh bên (giống trình duyệt tệp của Jupyter Lab) ---------- */
const FM = { dir: "" };
const L = (vi, en) => (typeof LANG !== "undefined" && LANG === "en") ? en : vi;
const H = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const isImgName = n => /\.(jpe?g|png|webp|bmp|gif)$/i.test(n);
function fmtSize(n){ n = +n || 0; return n < 1024 ? n + " B" : n < 1048576 ? (n/1024).toFixed(1) + " KB" : (n/1048576).toFixed(1) + " MB"; }
function vEntries(dir){
  const pre = dir ? dir + "/" : "", x = vidx(), seen = new Map();
  for (const k of Object.keys(x)){
    if (!k.startsWith(pre) || k === dir) continue;
    const name = k.slice(pre.length).split("/")[0], p = pre + name;
    if (!seen.has(name)) seen.set(name, { name, path: p, dir: x[p] ? x[p].k === "dir" : true, meta: x[p] });
  }
  return [...seen.values()].sort((a, b) => (b.dir - a.dir) || a.name.localeCompare(b.name, undefined, { numeric: true }));
}
const filesUnder = p => { p = norm(p); const x = vidx(); return Object.keys(x).filter(k => (k === p || k.startsWith(p + "/")) && x[k].k !== "dir"); };
const isBroken = (name, m) => !!m && m.k !== "img" && m.k !== "dir" && isImgName(name);
function vUsage(){ let n = 0; try { for (let i = 0; i < localStorage.length; i++){ const k = localStorage.key(i); if (k && k.startsWith("jetbotlab.vfs")) n += k.length + (localStorage.getItem(k) || "").length; } } catch (e){} return n; }
function vRename(from, to){
  from = norm(from); to = norm(to); if (!from || !to || from === to) return;
  if (vExists(to)) throw new Error(L("Đã có tệp/thư mục tên ", "Already exists: ") + to);
  vNeedDir(to); const x = vidx();
  for (const k of Object.keys(x).filter(k => k === from || k.startsWith(from + "/"))){
    const nk = to + k.slice(from.length), d = ls.get(VF + k);
    if (d !== null) ls.set(VF + nk, d);
    ls.del(VF + k); x[nk] = x[k]; delete x[k]; VCACHE.delete(k);
  }
  vsave();
}

// ---- zip (không nén khi ghi; đọc được cả kiểu "deflate" bằng DecompressionStream của trình duyệt) ----
let CRC_T = null;
function crc32(u){
  if (!CRC_T){ CRC_T = new Uint32Array(256); for (let n = 0; n < 256; n++){ let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; CRC_T[n] = c >>> 0; } }
  let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = CRC_T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0;
}
function makeZip(files){
  const enc = new TextEncoder(), parts = [], cen = [], d = new Date();
  const dt = ((d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(), tm = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  let off = 0;
  for (const f of files){
    const nm = enc.encode(f.name), crc = crc32(f.data), n = f.data.length, h = new DataView(new ArrayBuffer(30)), c = new DataView(new ArrayBuffer(46));
    h.setUint32(0, 0x04034b50, true); h.setUint16(4, 20, true); h.setUint16(6, 0x0800, true); h.setUint16(10, tm, true); h.setUint16(12, dt, true);
    h.setUint32(14, crc, true); h.setUint32(18, n, true); h.setUint32(22, n, true); h.setUint16(26, nm.length, true);
    c.setUint32(0, 0x02014b50, true); c.setUint16(4, 20, true); c.setUint16(6, 20, true); c.setUint16(8, 0x0800, true); c.setUint16(12, tm, true); c.setUint16(14, dt, true);
    c.setUint32(16, crc, true); c.setUint32(20, n, true); c.setUint32(24, n, true); c.setUint16(28, nm.length, true); c.setUint32(42, off, true);
    parts.push(new Uint8Array(h.buffer), nm, f.data); cen.push(new Uint8Array(c.buffer), nm);
    off += 30 + nm.length + n;
  }
  const csz = cen.reduce((a, b) => a + b.length, 0), e = new DataView(new ArrayBuffer(22));
  e.setUint32(0, 0x06054b50, true); e.setUint16(8, files.length, true); e.setUint16(10, files.length, true); e.setUint32(12, csz, true); e.setUint32(16, off, true);
  return new Blob([...parts, ...cen, new Uint8Array(e.buffer)], { type: "application/zip" });
}
async function readZip(buf){
  const u = new Uint8Array(buf), v = new DataView(buf); let e = -1;
  for (let i = u.length - 22; i >= Math.max(0, u.length - 65558); i--) if (v.getUint32(i, true) === 0x06054b50){ e = i; break; }
  if (e < 0) throw new Error(L("Tệp zip hỏng", "Broken zip file"));
  const n = v.getUint16(e + 10, true), out = []; let p = v.getUint32(e + 16, true);
  for (let i = 0; i < n; i++){
    const m = v.getUint16(p + 10, true), cs = v.getUint32(p + 20, true), nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true), lo = v.getUint32(p + 42, true);
    const name = new TextDecoder().decode(u.subarray(p + 46, p + 46 + nl)); p += 46 + nl + xl + cl;
    if (name.endsWith("/")){ out.push({ name, dir: true }); continue; }
    if (/(^|\/)(__MACOSX|\.ipynb_checkpoints)\//.test(name) || /(^|\/)\.DS_Store$/.test(name)) continue;
    const ds = lo + 30 + v.getUint16(lo + 26, true) + v.getUint16(lo + 28, true); let data = u.subarray(ds, ds + cs);
    if (m === 8) data = new Uint8Array(await new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"))).arrayBuffer());
    else if (m !== 0) throw new Error(L("Zip dùng kiểu nén chưa hỗ trợ: ", "Unsupported zip compression: ") + name);
    out.push({ name, data });
  }
  return out;
}

// ---- chuyển tệp ổ đĩa ảo <-> tệp thật ----
const MODEL_TAG = "jetbotlab-model";
function imgToCanvas(p, size){
  const u = b64d(ls.get(VF + norm(p)) || ""); if (u.length !== D) throw new Error(L("Ảnh hỏng: ", "Broken image: ") + p);
  const a = document.createElement("canvas"); a.width = a.height = R; const g = a.getContext("2d"), im = g.createImageData(R, R);
  for (let i = 0; i < R*R; i++){ for (let c = 0; c < 3; c++) im.data[i*4 + c] = u[c*R*R + i]; im.data[i*4 + 3] = 255; }
  g.putImageData(im, 0, 0); if (!size || size === R) return a;
  const b = document.createElement("canvas"); b.width = b.height = size; const gb = b.getContext("2d"); gb.imageSmoothingEnabled = true; gb.imageSmoothingQuality = "high"; gb.drawImage(a, 0, 0, size, size); return b;
}
async function fileBytes(p){
  const m = vMeta(p), raw = ls.get(VF + norm(p)) || "";
  if (m.k === "img"){ const blob = await new Promise(r => imgToCanvas(p, 224).toBlob(r, /\.png$/i.test(p) ? "image/png" : "image/jpeg", 0.92)); return new Uint8Array(await blob.arrayBuffer()); }
  if (m.k === "model") return new TextEncoder().encode(JSON.stringify({ format: MODEL_TAG, v: 1, out: m.out, H: m.H, data: raw }));
  if (m.k === "zip"){ let list = []; try { list = JSON.parse(raw || "[]"); } catch (e){} return new Uint8Array(await (await zipOf(list.filter(vExists), "")).arrayBuffer()); }
  return new TextEncoder().encode(raw);
}
async function zipOf(paths, base){
  const files = []; for (const p of paths){ if (vIsDir(p)) continue; files.push({ name: base && p.startsWith(base + "/") ? p.slice(base.length + 1) : p, data: await fileBytes(p) }); }
  return makeZip(files);
}
function saveBlob(blob, name){ const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
async function putImageBytes(p, bytes){
  let bmp; try { bmp = await createImageBitmap(new Blob([bytes])); } catch (e){ throw new Error(L("Không đọc được ảnh: ", "Cannot read image: ") + p.split("/").pop()); }
  const c = document.createElement("canvas"); c.width = c.height = R; const g = c.getContext("2d"); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high"; g.drawImage(bmp, 0, 0, R, R);
  const d = g.getImageData(0, 0, R, R).data, u = new Uint8Array(D);
  for (let i = 0; i < R*R; i++) for (let k = 0; k < 3; k++) u[k*R*R + i] = d[i*4 + k];
  vPut(p, { k: "img", size: bytes.length }, b64e(u));
}
async function putBytes(p, bytes){
  p = norm(p); const name = p.split("/").pop();
  if (parent(p) && !vIsDir(parent(p))) vMakedirs(parent(p));
  if (isImgName(name)) return putImageBytes(p, bytes);
  if (/\.(pth|pt)$/i.test(name)){
    let o = null; try { o = JSON.parse(new TextDecoder().decode(bytes)); } catch (e){}
    if (!o || o.format !== MODEL_TAG) throw new Error(L(`${name}: mô hình PyTorch thật (resnet18…) không chạy được trong mô phỏng. Chỉ tải lên được tệp .pth đã tải về từ JetBot Lab.`, `${name}: a real PyTorch model cannot run in the simulator. Only .pth files downloaded from JetBot Lab can be uploaded.`));
    return vPut(p, { k: "model", out: o.out, H: o.H, size: Math.round(o.data.length*0.75) }, o.data);
  }
  if (bytes.length > 300000) throw new Error(L(`${name}: tệp quá lớn cho ổ đĩa ảo (tối đa 300 KB).`, `${name}: too large for the virtual disk (max 300 KB).`));
  const s = new TextDecoder().decode(bytes); vPut(p, { k: "text", size: bytes.length }, s);
}

// ---- giao diện ----
const IC = {
  dir: '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M2.5 6V15a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V7.5a1 1 0 0 0-1-1H9.5L8 4.5H3.5a1 1 0 0 0-1 1.5z" fill="currentColor" opacity=".9"/></svg>',
  model: '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M10 2.5l6.5 3.75v7.5L10 17.5l-6.5-3.75v-7.5z M3.5 6.25L10 10l6.5-3.75M10 10v7.5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  zip: '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M5 2.5h7l3.5 3.5v11.5H5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M9 4h1.5M8 6h1.5M9 8h1.5M8 10h1.5M8 12h2.5v2.5H8z" fill="none" stroke="currentColor" stroke-width="1.2"/></svg>',
  text: '<svg width="18" height="18" viewBox="0 0 20 20"><path d="M5 2.5h7l3.5 3.5v11.5H5z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 10h5M7.5 12.5h5M7.5 15h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>',
  dl: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M10 3.5v9M6.5 9l3.5 3.5L13.5 9M4 14v2h12v-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  ren: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M4 16l1-3.5 8.5-8.5 2.5 2.5L7.5 15zM11.5 6l2.5 2.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  del: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M4.5 6h11M8 6V4h4v2M6 6l.7 10h6.6L14 6" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>',
  up: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M10 13.5v-9M6.5 8L10 4.5 13.5 8M4 14v2h12v-2" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  nd: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M2.5 6V15a1 1 0 0 0 1 1h13a1 1 0 0 0 1-1V7.5a1 1 0 0 0-1-1H9.5L8 4.5H3.5a1 1 0 0 0-1 1.5z M10 9v5M7.5 11.5h5" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/></svg>',
  rf: '<svg width="15" height="15" viewBox="0 0 20 20"><path d="M15.5 10a5.5 5.5 0 1 1-1.8-4.1M15.5 3.5v3h-3" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
const MAXROWS = 300;
PF.renderFiles = el => {
  FM.el = el;
  if (FM.dir && !vIsDir(FM.dir)) FM.dir = "";
  const rows = vEntries(FM.dir), crumbs = [["", "Notebooks"]].concat(FM.dir ? FM.dir.split("/").map((n, i, a) => [a.slice(0, i + 1).join("/"), n]) : []);
  const broken = rows.filter(r => isBroken(r.name, r.meta));
  const row = r => {
    const m = r.meta || {}, bad = isBroken(r.name, m);
    const kind = r.dir ? "dir" : m.k === "img" ? "img" : m.k === "model" ? "model" : m.k === "zip" ? "zip" : "text";
    const info = r.dir ? filesUnder(r.path).length + L(" tệp", " files") : bad ? L("hỏng · ảnh rỗng", "broken · empty image") : fmtSize(m.size || 0);
    return `<li class="fm-row${bad ? " bad" : ""}" data-p="${H(r.path)}" data-k="${kind}">` +
      `<span class="fm-ic">${kind === "img" ? `<canvas width="${R}" height="${R}"></canvas>` : IC[kind]}</span>` +
      `<span class="fm-name" title="${H(r.name)}">${r.dir ? `<button class="fm-open">${H(r.name)}</button>` : H(r.name)}<small>${H(info)}</small></span>` +
      `<span class="fm-act"><button data-fm="dl" title="${L("Tải về máy", "Download")}">${IC.dl}</button><button data-fm="ren" title="${L("Đổi tên", "Rename")}">${IC.ren}</button><button data-fm="del" title="${L("Xoá", "Delete")}">${IC.del}</button></span></li>`;
  };
  const used = vUsage();
  el.innerHTML = `<h3>${L("Tệp · ổ đĩa ảo", "Files · virtual disk")}</h3>
    <div class="fm-bar">
      <button data-fm="upload">${IC.up}<span>${L("Tải lên", "Upload")}</span></button>
      <button data-fm="mkdir">${IC.nd}<span>${L("Thư mục mới", "New folder")}</span></button>
      <button data-fm="refresh" title="${L("Làm mới", "Refresh")}">${IC.rf}</button>
      <input type="file" class="fm-in" multiple>
    </div>
    <nav class="fm-path">${crumbs.map(([p, n], i) => (i ? '<i>/</i>' : "") + `<button data-cd="${H(p)}"${i === crumbs.length - 1 ? ' aria-current="true"' : ""}>${H(n)}</button>`).join("")}</nav>
    ${broken.length ? `<div class="fm-warn">${L(`${broken.length} ảnh rỗng (chụp khi ô camera chưa có hình) sẽ làm lỗi bước huấn luyện.`, `${broken.length} empty images (taken before the camera had a picture) will break training.`)} <button data-fm="clean">${L("Xoá ảnh hỏng", "Delete broken")}</button></div>` : ""}
    <ul class="fm-list">${rows.length ? rows.slice(0, MAXROWS).map(row).join("") : `<li class="fm-empty">${L("Thư mục trống", "Empty folder")}</li>`}
    ${rows.length > MAXROWS ? `<li class="fm-empty">${L(`… và ${rows.length - MAXROWS} mục nữa`, `… and ${rows.length - MAXROWS} more`)}</li>` : ""}</ul>
    <p class="fm-foot">${L("Đã dùng", "Used")} ${fmtSize(used)} / ~5 MB · ${L("Tệp lưu trong trình duyệt của máy này. Ảnh được thu nhỏ còn 24×24; tệp .pth là mô hình của mô phỏng, không dùng cho JetBot thật. Tải lên .zip để giải nén vào thư mục đang mở.", "Files live in this browser. Images are stored at 24×24; .pth files are simulator models, not for the real JetBot. Upload a .zip to extract it here.")}</p>`;
  el.querySelectorAll('.fm-row[data-k="img"] canvas').forEach(c => { try { const s = imgToCanvas(c.closest(".fm-row").dataset.p); c.getContext("2d").drawImage(s, 0, 0); } catch (e){} });
  el.onclick = e => fmClick(e).catch(err => toast(err.message));
  el.querySelector(".fm-in").onchange = e => fmUpload([...e.target.files]).catch(err => toast(err.message)).finally(() => { e.target.value = ""; });
};
const rerender = () => { if (FM.el && !FM.el.hidden && typeof DRAWER !== "undefined" && DRAWER === "files") PF.renderFiles(FM.el); };
async function fmClick(e){
  const cd = e.target.closest("[data-cd]"); if (cd){ FM.dir = cd.dataset.cd; return rerender(); }
  const op = e.target.closest(".fm-open"); if (op){ FM.dir = op.closest(".fm-row").dataset.p; return rerender(); }
  const b = e.target.closest("[data-fm]"); if (!b) return;
  const a = b.dataset.fm, rowEl = b.closest(".fm-row"), p = rowEl && rowEl.dataset.p, name = p && p.split("/").pop();
  const join = n => (FM.dir ? FM.dir + "/" : "") + n;
  if (a === "refresh") return rerender();
  if (a === "upload") return FM.el.querySelector(".fm-in").click();
  if (a === "mkdir"){
    const n = (prompt(L("Tên thư mục mới:", "New folder name:"), "") || "").trim(); if (!n) return;
    if (/[\\/]/.test(n)) throw new Error(L("Tên không được chứa / hoặc \\", "Name cannot contain / or \\"));
    if (vExists(join(n))) throw new Error(L("Đã có: ", "Already exists: ") + n);
    vMakedirs(join(n)); return rerender();
  }
  if (a === "clean"){
    const bad = vEntries(FM.dir).filter(r => isBroken(r.name, r.meta));
    if (!confirm(L(`Xoá ${bad.length} ảnh hỏng trong thư mục này?`, `Delete ${bad.length} broken images in this folder?`))) return;
    bad.forEach(r => vRemove(r.path, false)); toast(L(`Đã xoá ${bad.length} ảnh hỏng`, `Deleted ${bad.length} broken images`)); return rerender();
  }
  if (!p) return;
  if (a === "del"){
    const n = vIsDir(p) ? filesUnder(p).length : 0;
    if (!confirm(n ? L(`Xoá thư mục "${name}" và ${n} tệp bên trong?`, `Delete folder "${name}" and its ${n} files?`) : L(`Xoá "${name}"?`, `Delete "${name}"?`))) return;
    vRemove(p, true); return rerender();
  }
  if (a === "ren"){
    const n = (prompt(L("Tên mới:", "New name:"), name) || "").trim(); if (!n || n === name) return;
    if (/[\\/]/.test(n)) throw new Error(L("Tên không được chứa / hoặc \\", "Name cannot contain / or \\"));
    vRename(p, join(n)); return rerender();
  }
  if (a === "dl"){
    b.disabled = true;
    try {
      if (vIsDir(p)) saveBlob(await zipOf(filesUnder(p), parent(p)), name + ".zip");
      else { const m = vMeta(p); if (isBroken(name, m)) throw new Error(L("Ảnh này rỗng, không tải về được.", "This image is empty.")); saveBlob(new Blob([await fileBytes(p)], { type: m.k === "zip" ? "application/zip" : "application/octet-stream" }), name); }
    } finally { b.disabled = false; }
  }
}
async function fmUpload(files){
  let n = 0; const errs = [];
  for (const f of files){
    try {
      const bytes = new Uint8Array(await f.arrayBuffer());
      if (/\.zip$/i.test(f.name)){
        for (const z of await readZip(bytes.buffer)){
          const dest = norm((FM.dir ? FM.dir + "/" : "") + z.name);
          if (z.dir){ vMakedirs(dest); continue; }
          try { await putBytes(dest, z.data); n++; } catch (e){ errs.push(e.message); }
        }
      } else { await putBytes((FM.dir ? FM.dir + "/" : "") + f.name.replace(/[\\/]/g, "_"), bytes); n++; }
    } catch (e){ errs.push(e.message); }
  }
  rerender();
  toast(errs.length ? errs[0] + (errs.length > 1 ? L(` (+${errs.length - 1} lỗi khác)`, ` (+${errs.length - 1} more)`) : "") : L(`Đã tải lên ${n} tệp`, `Uploaded ${n} files`));
}
PF._fm = { fileBytes, zipOf, readZip, makeZip, putBytes };   // để kiểm thử
// tự làm mới bảng Tệp khi code Python ghi/xoá tệp
let fmT = 0;
PF.fsChanged = () => { clearTimeout(fmT); fmT = setTimeout(rerender, 250); };

install();
})();
