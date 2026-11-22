// Ảnh do admin tải lên (ảnh trang bài học, ảnh mặt sa bàn). Tên tệp = mã băm nội dung nên cache được vĩnh viễn.
const crypto = require("crypto");
const { HttpError, readFile, writeFile, requireRole, readJsonBody, send, handle } = require("./_lib");

const TYPES = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg", webp: "image/webp", gif: "image/gif" };
const PATH = /^assets\/[a-f0-9]{16,64}\.(png|jpe?g|webp|gif)$/;
const MAX = 3.5 * 1024 * 1024;   // Vercel giới hạn thân yêu cầu ~4.5 MB (base64 to hơn ~33%)

// Nhận dạng ảnh theo byte đầu tệp, không tin phần mở rộng người gửi.
function sniff(b){
  if (b.length > 8 && b[0] === 0x89 && b.toString("latin1", 1, 4) === "PNG") return "png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP") return "webp";
  if (b.length > 6 && /^GIF8[79]a$/.test(b.toString("latin1", 0, 6))) return "gif";
  return null;
}

module.exports = handle(async (req, res) => {
  if (req.method === "GET"){
    const p = new URL(req.url, "http://x").searchParams.get("p") || "";
    if (!PATH.test(p)) throw new HttpError(400, "Đường dẫn ảnh không hợp lệ");
    const f = await readFile(p);
    if (!f) throw new HttpError(404, "Không có ảnh");
    res.statusCode = 200;
    res.setHeader("Content-Type", TYPES[p.split(".").pop()]);
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    res.setHeader("Content-Disposition", "inline");
    return res.end(f.data);
  }
  if (req.method === "POST"){
    await requireRole(req, ["admin", "teacher"]);
    const b = await readJsonBody(req, 4.8e6);
    const data = Buffer.from(String(b.data || ""), "base64");
    if (!data.length) throw new HttpError(400, "Thiếu dữ liệu ảnh");
    if (data.length > MAX) throw new HttpError(413, "Ảnh quá lớn (tối đa 3.5 MB)");
    const ext = sniff(data); if (!ext) throw new HttpError(415, "Chỉ nhận ảnh PNG, JPEG, WebP hoặc GIF");
    const p = `assets/${crypto.createHash("sha256").update(data).digest("hex").slice(0, 32)}.${ext}`;
    if (!(await readFile(p))) await writeFile(p, data, "Thêm ảnh " + p, null);
    return send(res, 200, { url: "/api/asset?p=" + p });
  }
  throw new HttpError(405, "Phương thức không hỗ trợ");
});
