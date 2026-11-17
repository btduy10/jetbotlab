# JetBot Lab

Notebook Python kiểu Jupyter để học lập trình JetBot ROS AI Kit trên sa bàn 3D.
Python chạy trong trình duyệt (Skulpt 1.2.0), đồ hoạ dùng Three.js r128. Trang không cần build.

## Cấu trúc
- `index.html`, `app.css`, `app.js` – trang học
- `admin.html`, `admin.css`, `admin.js` – trang quản trị `/admin` (thêm bài học, sa bàn)
- `api/` – Vercel Serverless Functions (Node, không thư viện ngoài): đăng nhập admin, nội dung, ảnh
- `lessons/` – ảnh của bài mẫu có sẵn
- `vendor/` – thư viện tự lưu (không tải từ CDN bên ngoài)
- `vercel.json` – header bảo mật (CSP, chống nhúng iframe, HSTS…)

## Quản trị nội dung (`/admin`)
Admin thêm / sửa **bài học** (tải notebook `.ipynb`, ảnh nhúng tự đưa lên kho ảnh) và **sa bàn**
(ảnh mặt sa bàn + kích thước thật, đặt điểm xuất phát / vật cản / ô màu bằng chuột) mà không sửa mã nguồn.
Bài học mới hiện ở đầu danh sách Bài mẫu; link thẳng tới bài: `/?lesson=c-<mã bài>`, tới sa bàn: `/?map=c-<mã sa bàn>`.

Dữ liệu lưu trong repo GitHub riêng (private), mặc định `btduy10/jetbotlab-data`:
`content.json` (bài học + sa bàn) và `assets/` (ảnh, tên theo mã băm). Tách repo để mỗi lần sửa nội dung
không làm Vercel build lại trang.

### Cấu hình một lần
1. Tạo repo **private** `jetbotlab-data` trên GitHub (tick *Add a README* để repo có nhánh `main`).
2. Tạo **fine-grained token**: GitHub → Settings → Developer settings → Fine-grained tokens →
   *Repository access*: chỉ `jetbotlab-data`; *Permissions*: **Contents: Read and write**.
3. Vercel → dự án → Settings → Environment Variables, thêm:

   | Biến | Giá trị |
   |---|---|
   | `GITHUB_TOKEN` | token ở bước 2 |
   | `GITHUB_DATA_REPO` | `btduy10/jetbotlab-data` |
   | `ADMIN_USERNAME` | tên đăng nhập admin |
   | `ADMIN_PASSWORD` | mật khẩu admin (≥ 8 ký tự) |
   | `AUTH_SECRET` | chuỗi ngẫu nhiên ≥ 16 ký tự (ký cookie đăng nhập) |

4. **Redeploy** để biến có hiệu lực, rồi mở `/admin`.

## Bảo mật
- Python của học sinh chạy trong sandbox: đã gỡ `jseval`, `open`, `file`, `execfile`; chỉ cho phép
  các thư viện an toàn (jetbot, time, math, random, re, collections…). Các module `document`, `urllib`,
  `webgl`, `processing`, `image`, `turtle` bị chặn.
- Tệp `.ipynb` mở vào bị giới hạn 20 MB, tối đa 300 ô, mỗi ô 100.000 ký tự.
- CSP chỉ cho chạy script cùng tên miền, không cho `style` viết trong HTML. Cần `'unsafe-eval'` vì Skulpt biên dịch Python sang JavaScript.
- Admin: cookie phiên `HttpOnly; Secure; SameSite=Strict` ký HMAC bằng `AUTH_SECRET`, kiểm tra `Origin` khi ghi;
  dữ liệu ghi vào được kiểm tra kiểu / kích thước ở server; ảnh chỉ nhận PNG/JPEG/WebP/GIF (kiểm tra byte đầu tệp).
- Học sinh không cần tài khoản; notebook của học sinh chỉ lưu trong trình duyệt của từng máy.

## Chạy thử trên máy
Trang học: `npx serve .` rồi mở http://localhost:3000 (không có `/api` thì chỉ hiện bài có sẵn).
Thử cả `/admin` và `/api`: chạy bằng `vercel dev`, hoặc một server Node gọi các hàm trong `api/` với biến
`JBL_DATA_DIR=<thư mục tạm>` để lưu dữ liệu ra đĩa thay cho GitHub.

## Triển khai Vercel
Framework Preset **Other**, để trống Build Command.
