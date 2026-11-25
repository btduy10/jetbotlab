# JetBot Lab

Notebook Python kiểu Jupyter để học lập trình JetBot ROS AI Kit trên sa bàn 3D, kèm **trang Giáo viên**:
soạn bài/thử thách có tiêu chí, quản lý lớp như Classroom (mã lớp, link mời, bảng tin), giao bài theo tuần/tiết, học sinh nộp code
+ ảnh (lưu vào Google Drive của giáo viên), theo dõi tiến độ, chấm theo tiêu chí và trả bài, tổ chức tiết học luân phiên robot thật.
Không cần Google Classroom, không dùng quyền Google nhạy cảm.
Python chạy trong trình duyệt (Skulpt 1.2.0), đồ hoạ Three.js r128. Trang không cần build.

## Cấu trúc
- `index.html`, `app.css`, `app.js` – trang học (lab ảo); `student.js` – tài khoản, bài được giao, tự lưu, nộp bài, chấm bài trong lab
- `admin.html`, `admin.css`, `admin.js` – trang Giáo viên `/admin` (cũng mở được bằng `/teacher`): bài học, sa bàn, giáo viên;
  `teacher.js` – lớp học, mã lớp, Google Drive, học sinh, giao bài, tiến độ, trả bài, bảng tin, tiết học
- `api/` – Vercel Functions (Node): `auth.js` (Google OAuth, phiên), `content.js` (bài học + sa bàn), `asset.js` (ảnh),
  `class.js` (mọi thứ về lớp học), `file.js` (ảnh bài làm trên Drive);
  `_lib.js`, `_db.js`, `_schema.js`, `_drive.js` dùng chung (không thành endpoint)
- `lessons/` – ảnh của bài có sẵn; `vendor/` – thư viện tự lưu (không dùng CDN)

## Dữ liệu ở đâu
| Loại | Nơi lưu |
|---|---|
| Bài học, thử thách, sa bàn, ảnh | repo GitHub riêng (mặc định `btduy10/jetbotlab-data`): `content.json` + `assets/` |
| Tài khoản, lớp, học sinh, giao bài, bài làm, lượt chạy, điểm, bảng tin, tiết học | **Neon Postgres** (Vercel → Storage) |
| Ảnh học sinh nộp, tài liệu giáo viên chia sẻ | **Google Drive của giáo viên** chủ lớp (thư mục `JetBot Lab – <tên>`, admin được quyền xem) |
| Notebook học tự do (chưa đăng nhập) | trình duyệt của từng máy |

## Cấu hình một lần (chủ dự án)
### 1. Repo nội dung (đã làm ở giai đoạn 1)
Repo **private** `jetbotlab-data` + fine-grained token chỉ cho repo đó, quyền **Contents: Read and write**.

### 2. Cơ sở dữ liệu Neon
Vercel → dự án → **Storage** → **Create Database** → **Neon (Postgres)** → gắn vào dự án jetbotlab.
Vercel tự thêm biến `DATABASE_URL`.

### 3. Đăng nhập Google (+ Google Drive cho giáo viên)
1. Mở <https://console.cloud.google.com> → tạo dự án (VD *JetBot Lab*).
2. **APIs & Services → Library** → bật **Google Drive API**.
3. **Google Auth Platform → Branding**: tên ứng dụng *JetBot Lab*, email hỗ trợ.
   *App domain*: Application home page `https://<tên-miền>` · Privacy policy `https://<tên-miền>/privacy` ·
   Terms of service `https://<tên-miền>/terms` · Authorized domain: tên miền gốc.
   Xác minh quyền sở hữu tên miền trong Search Console (thẻ meta trong `index.html` hoặc tệp `google….html` ở gốc trang).
   **Không tải logo** (thêm logo buộc Google xét duyệt thương hiệu lâu hơn).
4. **Data Access** → chỉ 4 scope, **đều không nhạy cảm**: `openid`, `email`, `profile`, `https://www.googleapis.com/auth/drive.file`.
   **Audience** → Publishing status **In production**.
5. **Clients → Create client → Web application** → *Authorized redirect URIs*: `https://<tên-miền>/api/auth?a=callback`.
6. Chép **Client ID** và **Client secret**.

> Không dùng quyền nhạy cảm nào nên **không có giới hạn 100 tài khoản**, không cần gửi video xác minh.
> `drive.file` chỉ cho app thấy thư mục và tệp do chính app tạo trong Drive của giáo viên (không đọc được tệp khác).
> Học sinh chỉ đăng nhập cơ bản; chỉ giáo viên bấm *Kết nối Google Drive* (một lần) để học sinh nộp được ảnh.

### 4. Biến môi trường trên Vercel (Settings → Environment Variables)
| Biến | Giá trị |
|---|---|
| `GITHUB_TOKEN`, `GITHUB_DATA_REPO` | repo nội dung ở bước 1 (bài học, sa bàn do giáo viên soạn) |
| `AUTH_SECRET` | chuỗi ngẫu nhiên ≥ 16 ký tự (ký cookie đăng nhập) |
| `ADMIN_USERNAME`, `ADMIN_PASSWORD` | đăng nhập dự phòng bằng mật khẩu (chỉ soạn bài/sa bàn) |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | ở bước 3 |
| `ADMIN_EMAILS` | Gmail của admin, nhiều email cách nhau dấu phẩy (được quyền xem thư mục Drive của mọi giáo viên) |
| `TOKEN_ENC_KEY` | chuỗi ngẫu nhiên ≥ 16 ký tự khác `AUTH_SECRET` (mã hoá token Google Drive của giáo viên) |
| `DATABASE_URL` | Vercel tự thêm ở bước 2 |

Tạo chuỗi ngẫu nhiên (PowerShell): `[Convert]::ToHexString([Security.Cryptography.RandomNumberGenerator]::GetBytes(32)).ToLower()`

### 5. Redeploy rồi kiểm tra
Deployments → Redeploy → mở `/admin` → **Đăng nhập bằng Google** (bằng email trong `ADMIN_EMAILS`). Bảng CSDL tự tạo ở lần đầu.
Tab **Giáo viên** → mục **Kiểm tra cấu hình** phải toàn dấu ✓. Nút **Khởi tạo / cập nhật CSDL** chạy lại an toàn, không mất dữ liệu.

### Triển khai cho trường khác
Fork repo → tạo dự án Vercel từ bản fork (Framework **Other**, không build) → làm lại bước 1–5 với tên miền và dự án Google Cloud
của trường đó. Mỗi trường có CSDL, admin và Drive giáo viên riêng; không phụ thuộc Google Classroom.

## Hướng dẫn nhanh cho giáo viên
1. Admin thêm Gmail giáo viên ở tab **Giáo viên**.
2. Giáo viên mở `/admin` → **Lớp học** → tạo lớp → bấm **Kết nối Google Drive** (một lần, để học sinh nộp được ảnh).
3. **Mời học sinh**: gửi **link mời** (`/?join=MÃ`) hoặc **mã lớp** 6 ký tự; em đăng nhập Google là vào lớp
   (hoặc dán danh sách email ở tab *Học sinh*). Bỏ tick *Cho học sinh tự vào lớp* để khoá lớp; *Đổi mã* nếu lộ mã.
   Cột **Nhóm** dùng cho luân phiên robot thật.
4. **Bài học**: tải `.ipynb`, chọn sa bàn, cấp độ 1–5, loại (bài học/thử thách) và **tiêu chí hoàn thành**
   (ô đích, thời gian tối đa, số va chạm tối đa, không ra khỏi vạch, thời gian/quãng đường chuẩn để chấm tối ưu).
   Khoá ô (🔒) những ô khai báo thư viện/hàm không muốn học sinh sửa.
5. **Giao bài**: chọn bài, Tuần, Tiết, ngày mở, hạn nộp, **hướng dẫn**, tick *Bắt buộc nộp kèm ảnh* nếu cần.
6. Học sinh làm bài, bấm **📷 Thêm ảnh** (chụp bằng điện thoại được, ảnh tự thu nhỏ, lưu vào Drive của giáo viên:
   `JetBot Lab – <giáo viên> / <lớp> / <bài>`), rồi **Nộp bài**.
7. **Tiến độ & chấm bài**: bảng học sinh × bài (◐ đang làm · ✓ đã nộp · ★ đạt tiêu chí, số lần chạy, phút, 📷 số ảnh, điểm),
   cờ *Cần hỗ trợ* / *Có thể nâng cấp độ*, tải CSV. Bấm vào ô để mở code và ảnh của em **trong lab ảo**, chạy lại,
   chấm 3 tiêu chí (có gợi ý điểm), nhận xét → **Lưu điểm** → **Trả bài** (học sinh chỉ thấy điểm sau khi trả).
   Trả cả lớp: tab *Giao bài* → **Trả bài (N)**. **Chép điểm** để dán vào Google Sheets / sổ điểm của trường.
8. **Tài liệu**: tải tệp lên (code `.py`/`.ipynb`, mô hình AI `.pth`, PDF, `.zip`…, tối đa 500 MB/tệp), dùng chung cho lớp hoặc gắn
   với một bài. Tệp đi thẳng từ trình duyệt lên Google Drive của giáo viên (`JetBot Lab / Lớp / Tài liệu`), mở quyền *ai có link
   đều tải được*; học sinh thấy ở mục *Bài được giao* → **Tài liệu** (hoặc ngay trong bài) và bấm tải về máy để chép sang robot thật.
9. **Bảng tin**: đăng thông báo, học sinh thấy ở đầu mục *Bài được giao*.

**Admin – Tài liệu chung**: tab *Tài liệu chung* (cần *Kết nối Google Drive* của admin) → tải tệp lên thư mục
`JetBot Lab / Tài liệu chung` trong Drive của admin. Tệp hiện ở đầu mục **Bài mẫu** trên trang học cho **mọi người, kể cả chưa đăng nhập**.
10. **Tiết học**: đặt thứ tự nhóm + số phút → *Bắt đầu luân phiên*; học sinh thấy nhóm nào đang ở robot thật.

## Bài AI: đi theo đường dẫn (bài 14–16)
Ba notebook `path_following` của NVIDIA (`data_collection`, `train_model`, `run_model`) chạy **nguyên văn** trên sa bàn
**Đường dẫn · path following** (4,0 × 2,23 m: nền xám, mép đường cam, tim đường trắng đứt).
- `pfsim.js` mô phỏng các thư viện của notebook: `ipywidgets`, `traitlets`, `IPython.display`, `jupyter_clickable_image_widget`,
  `torch` (+`nn`, `optim`, `utils.data`), `torchvision`, `torch2trt`, `PIL`, `cv2`, `numpy`, `os`, `glob`, `uuid`, `json`, `open()`
  và dòng lệnh `!zip`, `!ls`, `!rm -r`. Tệp (ảnh `dataset_xy/…jpg`, mô hình `.pth`) nằm trong **ổ đĩa ảo** của trình duyệt (localStorage).
- Thay `resnet18` trên GPU bằng mạng nhỏ: ảnh thu về 24×24 màu → 48 nơ-ron → 2 đầu ra (x, y), huấn luyện bằng Adam (70 epoch ≈ 20 giây).
- Bài 14: kéo robot tới nhiều vị trí/góc, bấm vào ảnh camera tại điểm trên tim đường robot nên đi tới (khoảng giữa ảnh); nên có ≥ 80 ảnh.
- Bài 16: `camera.observe(execute)` lái robot mỗi khung hình; bấm **Dừng** để tắt. Robot cua gắt thì giảm *steering gain* còn 0.02–0.03.
- Làm lại từ đầu: `!rm -r dataset_xy`.

## Bảo mật
- Python của học sinh chạy trong sandbox: đã gỡ `jseval`, `open`, `file`, `execfile`; chỉ cho phép thư viện an toàn.
- CSP chỉ cho script cùng tên miền và **không cho thuộc tính `style` trong HTML** (style phải gán bằng JavaScript).
- Đăng nhập Google phía server (OAuth + PKCE, kiểm `state`, `id_token`), cookie phiên `HttpOnly; Secure; SameSite=Strict`
  ký HMAC; mọi yêu cầu ghi kiểm `Origin`. Vai trò đọc lại từ CSDL mỗi lần (thu hồi quyền có hiệu lực ngay).
- Giáo viên chỉ thấy lớp của mình; học sinh chỉ thấy bài giao cho lớp mình. Refresh token Drive mã hoá AES-256-GCM.
- Ảnh đi qua `/api/file` (kiểm quyền: chính em, giáo viên lớp, admin; kiểm byte ảnh), nên CSP `img-src 'self'` không phải nới.
- Đánh giá tiêu chí chạy trên trình duyệt học sinh nên về lý thuyết có thể bị can thiệp; giáo viên luôn xem lại code và chạy lại khi chấm.

## Chạy thử trên máy
Trang học tĩnh: `npx serve .` (không có `/api` thì chỉ có bài có sẵn).
Thử đầy đủ: một server Node phục vụ trang tĩnh **kèm header CSP của `vercel.json`**, gọi các hàm trong `api/`, với
`JBL_DATA_DIR=<thư mục>` (nội dung ra đĩa), `JBL_PGLITE=<thư mục>` + gói `@electric-sql/pglite` (Postgres trong máy),
`JBL_DEV_LOGIN=1` (đăng nhập giả lập `POST /api/auth?a=dev {email, role}` – chỉ chạy ở localhost, không bao giờ trên Vercel).

## Triển khai Vercel
Framework Preset **Other**, để trống Build Command. Gói Hobby giới hạn 12 Functions – hiện dùng 5.
