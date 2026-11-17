// Nội dung do admin quản lý: bài học + sa bàn, lưu trong một tệp content.json của repo dữ liệu.
const { HttpError, readFile, writeFile, requireAdmin, readJsonBody, send, handle } = require("./_lib");

const FILE = "content.json";
const COLORS = ["red", "green", "blue", "yellow"];
const ASSET = /^\/api\/asset\?p=assets\/[a-f0-9]{16,64}\.(png|jpe?g|webp|gif)$/;

const str = (v, max, def = "") => { if (v === undefined || v === null) return def; if (typeof v !== "string") throw new HttpError(400, "Sai kiểu chữ"); if (v.length > max) throw new HttpError(400, "Chữ quá dài"); return v; };
const num = (v, lo, hi) => { const n = Number(v); if (!Number.isFinite(n) || n < lo || n > hi) throw new HttpError(400, "Số ngoài giới hạn"); return Math.round(n*1000)/1000; };
const id = v => { const s = str(v, 40); if (!/^[a-z0-9][a-z0-9-]{0,39}$/.test(s)) throw new HttpError(400, "Mã không hợp lệ"); return s; };
const list = (v, max) => { if (!Array.isArray(v)) throw new HttpError(400, "Sai kiểu danh sách"); if (v.length > max) throw new HttpError(400, "Danh sách quá dài"); return v; };

function cleanCell(c){
  const a = list(c, 4);
  if (a[0] !== "code" && a[0] !== "md") throw new HttpError(400, "Loại ô không hợp lệ");
  const out = [a[0], str(a[1], 100000)];
  const m = a[3] && typeof a[3] === "object" ? a[3] : null, meta = {};
  if (m && m.editable === false) meta.editable = false;
  if (m && m.deletable === false) meta.deletable = false;
  if (Object.keys(meta).length) out.push(null, meta);
  return out;
}
function cleanLesson(l){
  if (!l || typeof l !== "object") throw new HttpError(400, "Bài học không hợp lệ");
  return {
    id: id(l.id), title: str(l.title, 200) || "Bài học", titleEn: str(l.titleEn, 200), tag: str(l.tag, 40), tagEn: str(l.tagEn, 40),
    desc: str(l.desc, 500), descEn: str(l.descEn, 500), map: str(l.map, 60), file: str(l.file, 120).replace(/[\u0000-\u001f<>]/g, ""),
    hidden: l.hidden === true, cells: list(l.cells, 300).map(cleanCell)
  };
}
function cleanMap(m){
  if (!m || typeof m !== "object") throw new HttpError(400, "Sa bàn không hợp lệ");
  const w = num(m.w, 0.5, 4), h = num(m.h, 0.5, 3);
  const image = str(m.image, 200); if (image && !ASSET.test(image)) throw new HttpError(400, "Ảnh sa bàn không hợp lệ");
  const s = m.start || {}, ln = m.line || {};
  return {
    id: id(m.id), name: str(m.name, 80) || "Sa bàn", nameEn: str(m.nameEn, 80), w, h, image,
    start: { x: num(s.x, -w/2, w/2), y: num(s.y, -h/2, h/2), th: num(s.th, -7, 7) },
    boxes: list(m.boxes || [], 60).map(b => ({ x: num(b.x, -w/2, w/2), y: num(b.y, -h/2, h/2), w: num(b.w, 0.02, 2), d: num(b.d, 0.02, 2), h: num(b.h === undefined ? 0.22 : b.h, 0.02, 0.6) })),
    zones: list(m.zones || [], 20).map(z => { if (!COLORS.includes(z.c)) throw new HttpError(400, "Màu ô không hợp lệ"); return { x: num(z.x, -w/2, w/2), y: num(z.y, -h/2, h/2), w: num(z.w, 0.02, 2), h: num(z.h, 0.02, 2), c: z.c }; }),
    line: ln.mode === "color"
      ? { mode: "color", color: /^#[0-9a-f]{6}$/i.test(ln.color || "") ? ln.color.toLowerCase() : "#000000", tol: num(ln.tol === undefined ? 60 : ln.tol, 10, 200) }
      : { mode: "dark", tol: num(ln.tol === undefined ? 80 : ln.tol, 10, 200) }
  };
}
function cleanContent(c){
  if (!c || typeof c !== "object") throw new HttpError(400, "Nội dung không hợp lệ");
  const lessons = list(c.lessons || [], 200).map(cleanLesson), maps = list(c.maps || [], 50).map(cleanMap);
  for (const arr of [lessons, maps]){ const seen = new Set(); for (const x of arr){ if (seen.has(x.id)) throw new HttpError(400, "Trùng mã: " + x.id); seen.add(x.id); } }
  return { version: 1, lessons, maps };
}

module.exports = handle(async (req, res) => {
  if (req.method === "GET"){
    const f = await readFile(FILE);
    const content = f ? JSON.parse(f.data.toString("utf8")) : { version: 1, lessons: [], maps: [] };
    const fresh = /[?&]fresh=/.test(req.url || "");
    return send(res, 200, { content, sha: f ? f.sha : null }, fresh ? {} : { "Cache-Control": "public, max-age=0, s-maxage=20, stale-while-revalidate=300" });
  }
  if (req.method === "PUT"){
    requireAdmin(req);
    const b = await readJsonBody(req, 4e6);
    const content = cleanContent(b.content);
    const sha = await writeFile(FILE, Buffer.from(JSON.stringify(content, null, 1)), "Cập nhật nội dung JetBot Lab", b.sha || null);
    return send(res, 200, { ok: true, sha, content });
  }
  throw new HttpError(405, "Phương thức không hỗ trợ");
});
