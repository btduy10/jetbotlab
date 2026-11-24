# JetBot Lab

Notebook Python kiểu Jupyter để học lập trình JetBot ROS AI Kit trên sa bàn 3D, kèm **khu giáo viên**:
soạn bài/thử thách có tiêu chí, quản lý lớp (liên kết Google Classroom), giao bài theo tuần/tiết, theo dõi tiến độ,
xem code và chấm theo tiêu chí, tổ chức tiết học luân phiên robot thật.
Python chạy trong trình duyệt (Skulpt 1.2.0), đồ hoạ Three.js r128. Trang không cần build.

## Cấu trúc
- `index.html`, `app.css`, `app.js` – trang học (lab ảo); `student.js` – tài khoản, bài được giao, tự lưu, nộp bài, chấm bài trong lab
- `admin.html`, `admin.css`, `admin.js` – khu giáo viên `/admin` (cũng mở được bằng `/teacher`): bài học, sa bàn, giáo viên;
  `teacher.js` – lớp học, học sinh, giao bài, tiến độ, tiết học, Google Classroom
- `api/` – Vercel Functions (Node): `auth.js` (Google OAuth, phiên), `content.js` (bài học + sa bàn), `asset.js` (ảnh),
  `class.js` (mọi thứ về lớp học); `_lib.js`, `_db.js`, `_schema.js` dùng chung (không thành endpoint)
- `lessons/` – ảnh của bài có sẵn; `vendor/` – thư viện tự lưu (không dùng CDN)

## Dữ liệu ở đâu
| Loại | Nơi lưu |
|---|---|
| Bài học, thử thách, sa bàn, ảnh | repo GitHub riêng (mặc định `btduy10/jetbotlab-data`): `content.json` + `assets/` |
| Tài khoản, lớp, học sinh, giao bài, bài làm, lượt chạy, điểm, tiết học | **Neon Postgres** (Vercel → Storage) |
| Notebook học tự do (chưa đăng nhập) | trình duyệt của từng máy |

## Cấu hình một lần (chủ dự án)
### 1. Repo nội dung (đã làm ở giai đoạn 1)
Repo **private** `jetbotlab-data` + fine-grained token chỉ cho repo đó, quyền **Contents: Read and write**.

### 2. Cơ sở dữ liệu Neon
Vercel → dự án → **Storage** → **Create Database** → **Neon (Postgres)** → gắn vào dự án jetbotlab.
Vercel tự thêm biến `DATABASE_URL`.

### 3. Đăng nhập Google + Classroom
1. Mở <https://console.cloud.google.com> → tạo dự án (VD *JetBot Lab*).
2. **APIs & Services → Library** → bật **Google Classroom API**.
3. **OAuth consent screen**: User type **External**, tên ứng dụng *JetBot Lab*, email hỗ trợ.
   *App domain*: Application home page `https://jetbotlab.vercel.app` · Privacy policy `https://jetbotlab.vercel.app/privacy` ·
   Terms of service `https://jetbotlab.vercel.app/terms` · Authorized domain `jetbotlab.vercel.app`.
   **Không tải logo** (thêm logo buộc Google xét duyệt thương hiệu, mất vài ngày).
   Scopes: `openid`, `email`, `profile` và 6 scope Classroom: `classroom.courses.readonly`, `classroom.rosters.readonly`,
   `classroom.profile.emails`, `classroom.coursework.students`, `classroom.topics` (chủ đề bài tập), `classroom.coursework.me` (học sinh nộp bài). Chuyển **Publishing status → In production**.
4. **Credentials → Create credentials → OAuth client ID → Web application**:
   *Authorized redirect URIs*: `https://jetbotlab.vercel.app/api/auth?a=callback`
5. Chép **Client ID** và **Client secret**.

> Scope Classroom là loại "nhạy cảm": khi **giáo viên** bấm *Kết nối Google Classroom*, Google hiện cảnh báo
> *"Google chưa xác minh ứng dụng này"* → bấm *Nâng cao → Tiếp tục*. Ứng dụng chưa xác minh dùng được tối đa 100 tài khoản
> cho các scope này (đủ cho giáo viên). Học sinh chỉ đăng nhập cơ bản nên **không** gặp cảnh báo. Muốn bỏ cảnh báo:
> gửi Google xác minh ở mục OAuth consent screen.
>
> **Nộp luôn trên Classroom:** khi học sinh bấm *Nộp bài* ở bài có đăng Classroom, lần đầu em được chuyển sang Google
> để cho phép quyền `classroom.coursework.me` (cũng gặp cảnh báo chưa xác minh, tính vào giới hạn 100 tài khoản), sau đó
> mọi lần nộp đều tự nộp trên Classroom. Giáo viên trả điểm thì Classroom tự trả bài cho em.

### 4. Biến môi trường trên Vercel (Settings → Environment Variables)
| Biến | Giá trị |
|---|---|
| `GITHUB_TOKEN`, `GITHUB_DATA_REPO` | như giai đoạn 1 |
| `AUTH_SECRET` | chuỗi ngẫu nhiên ≥ 16 ký tự (ký cookie đăng nhập) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | đăng nhập dự phòng bằng mật khẩu (chỉ soạn bài/sa bàn) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ở bước 3 |
| `ADMIN_EMAILS` | Gmail của admin, nhiều email cách nhau dấu phẩy |
| `TOKEN_ENC_KEY` | chuỗi ngẫu nhiên ≥ 16 ký tự khác `AUTH_SECRET` (mã hoá token Classroom) |
| `DATABASE_URL` | Vercel tự thêm ở bước 2 |

Tạo chuỗi ngẫu nhiên (PowerShell): `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()`

### 5. Redeploy rồi khởi tạo CSDL
Deployments → Redeploy → mở `/admin` → **Đăng nhập bằng Google** (bằng email trong `ADMIN_EMAILS`) →
tab **Giáo viên** → **Khởi tạo / cập nhật CSDL**. Bấm lại nút này mỗi khi bản cập nhật có thay đổi CSDL (chạy lại không mất dữ liệu).

## Hướng dẫn nhanh cho giáo viên
1. Admin thêm Gmail giáo viên ở tab **Giáo viên**.
2. **Bài học**: tải `.ipynb`, chọn sa bàn, cấp độ 1–5, loại (bài học/thử thách) và **tiêu chí hoàn thành**
   (ô đích, thời gian tối đa, số va chạm tối đa, không ra khỏi vạch, thời gian/quãng đường chuẩn để chấm tối ưu).
   Khoá ô (🔒) những ô khai báo thư viện/hàm không muốn học sinh sửa.
3. **Lớp học** → tạo lớp → *Kết nối Google Classroom* → *Liên kết khoá học* (nhập học sinh tự động) hoặc dán danh sách email.
   Cột **Nhóm** dùng cho luân phiên robot thật.
4. **Giao bài**: chọn bài, Tuần, Tiết, ngày mở, hạn nộp, tick *Đăng lên Google Classroom*.
5. **Tiến độ & chấm bài**: bảng học sinh × bài (◐ đang làm · ✓ đã nộp · ★ đạt tiêu chí, số lần chạy, phút làm bài, điểm),
   cờ *Cần hỗ trợ* / *Có thể nâng cấp độ*, tải CSV. Bấm vào ô để mở code của em đó **trong lab ảo**, chạy lại,
   chấm 3 tiêu chí (có gợi ý điểm), nhận xét, *Trả điểm về Classroom*.
6. **Tiết học**: đặt thứ tự nhóm + số phút → *Bắt đầu luân phiên*; học sinh thấy nhóm nào đang ở robot thật.

### Dùng không cần API Classroom (thủ công)
Khi chưa kết nối được Google Classroom (Google chưa duyệt, trường không cho cấp quyền…), mọi việc vẫn làm được:
1. **Học sinh**: tab *Học sinh* → dán danh sách, mỗi dòng *Họ tên + email* (chép thẳng từ Google Sheets được).
2. **Giao bài**: *Giao bài* → bấm **Chép link** → dán link vào một bài tập trên Classroom.
3. **Điểm**: chấm trong JetBot Lab → bấm **Chép điểm** ở bài đó → dán vào Google Sheets (cột Họ tên · Email · Điểm · Nhận xét)
   rồi nhập sang sổ điểm Classroom. Bảng tiến độ đầy đủ: *Tiến độ* → *Tải CSV*.

## Bảo mật
- Python của học sinh chạy trong sandbox: đã gỡ `jseval`, `open`, `file`, `execfile`; chỉ cho phép thư viện an toàn.
- CSP chỉ cho script cùng tên miền và **không cho thuộc tính `style` trong HTML** (style phải gán bằng JavaScript).
- Đăng nhập Google phía server (OAuth + PKCE, kiểm `state`, `id_token`), cookie phiên `HttpOnly; Secure; SameSite=Strict`
  ký HMAC; mọi yêu cầu ghi kiểm `Origin`. Vai trò đọc lại từ CSDL mỗi lần (thu hồi quyền có hiệu lực ngay).
- Giáo viên chỉ thấy lớp của mình; học sinh chỉ thấy bài giao cho lớp mình. Refresh token Classroom mã hoá AES-256-GCM.
- Đánh giá tiêu chí chạy trên trình duyệt học sinh nên về lý thuyết có thể bị can thiệp; giáo viên luôn xem lại code và chạy lại khi chấm.

## Chạy thử trên máy
Trang học tĩnh: `npx serve .` (không có `/api` thì chỉ có bài có sẵn).
Thử đầy đủ: một server Node phục vụ trang tĩnh **kèm header CSP của `vercel.json`**, gọi các hàm trong `api/`, với
`JBL_DATA_DIR=<thư mục>` (nội dung ra đĩa), `JBL_PGLITE=<thư mục>` + gói `@electric-sql/pglite` (Postgres trong máy),
`JBL_DEV_LOGIN=1` (đăng nhập giả lập `POST /api/auth?a=dev {email, role}` – chỉ chạy ở localhost, không bao giờ trên Vercel).

## Triển khai Vercel
Framework Preset **Other**, để trống Build Command. Gói Hobby giới hạn 12 Functions – hiện dùng 4.
