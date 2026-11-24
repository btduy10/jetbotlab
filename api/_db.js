// Kết nối Postgres: Neon (DATABASE_URL) khi chạy thật; PGlite (JBL_PGLITE = thư mục) khi chạy thử cục bộ.
const { HttpError } = require("./_lib");
const SCHEMA = require("./_schema");

let _q = null;
async function conn(){
  if (_q) return _q;
  const dir = (process.env.JBL_PGLITE || "").trim();
  if (dir){
    const { PGlite } = await import(process.env.JBL_PGLITE_MOD || "@electric-sql/pglite");
    const db = new PGlite(dir);
    _q = async (text, params) => (await db.query(text, params || [])).rows;
  } else {
    const url = (process.env.DATABASE_URL || process.env.POSTGRES_URL || "").trim();
    if (!url) throw new HttpError(500, "Server chưa cấu hình DATABASE_URL (Vercel → Storage → Neon Postgres)");
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(url);
    _q = (text, params) => sql.query(text, params || []);
  }
  return _q;
}
const raw = async (text, params) => (await conn())(text, params);

// Tạo / cập nhật bảng. Mỗi lệnh chạy riêng vì Neon HTTP chỉ nhận một lệnh mỗi lần.
async function migrate(){ for (const s of SCHEMA) await raw(s); return SCHEMA.length; }

// CSDL mới (chưa có bảng) hoặc thiếu cột của bản cập nhật: tự chạy migrate một lần rồi thử lại.
// Tránh vòng lặp "phải đăng nhập mới khởi tạo được CSDL, mà đăng nhập lại cần CSDL".
const MISSING = new Set(["42P01", "42703"]); // undefined_table, undefined_column
let autoMig = null;
async function q(text, params){
  try { return await raw(text, params); }
  catch (e){
    if (!e || !MISSING.has(e.code) || autoMig === "done") throw e;
    autoMig = autoMig || migrate();
    try { await autoMig; } finally { autoMig = "done"; }
    return raw(text, params);
  }
}

module.exports = { q, migrate };
