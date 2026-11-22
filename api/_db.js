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
const q = async (text, params) => (await conn())(text, params);

// Tạo / cập nhật bảng. Mỗi lệnh chạy riêng vì Neon HTTP chỉ nhận một lệnh mỗi lần.
async function migrate(){ for (const s of SCHEMA) await q(s); return SCHEMA.length; }

module.exports = { q, migrate };
