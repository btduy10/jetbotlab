# JetBot Lab — ghi chú cho Claude

Trang web (không build) dạy lập trình JetBot ROS AI Kit: notebook Python kiểu Jupyter bên trái, sa bàn 3D mô phỏng
robot bên phải, cộng khu giáo viên (lớp, giao bài, tiến độ, chấm điểm, Google Classroom).
Người dùng: giáo viên STEM-Robotics THPT FPT Cần Thơ và học sinh. Triển khai: Vercel tự deploy khi push `main`.
Giao tiếp với chủ dự án bằng tiếng Việt. Góp ý của học sinh thu riêng bên ngoài (không có trong app).

## Cấu trúc
- `index.html` – markup trang học. Chữ hiển thị gắn `data-i18n`, `data-i18n-title`, `data-i18n-aria`, `data-i18n-html`.
- `app.css` – style trang học. Màu là token trên `:root` + 2 khối dark (`prefers-color-scheme` và `[data-theme=dark]`) – sửa token phải sửa cả 3 chỗ.
- `app.js` – lab ảo, các phần theo thứ tự:
  1. Sa bàn `MAPS` (mét, hệ ROS: x tiến, y trái) 2. Mô phỏng `SIM` 3. Thư viện Python `jetbot` (`JETBOT_PY`, `SIM_JS`, `TIME_JS`)
  4. Bài mẫu `LESSONS` + `LESSONS_EN` 5. Notebook 6. Kernel Skulpt 7. Three.js 8. Khởi động
  9. Nội dung admin (`applyRemote`, mã có tiền tố `c-`, sa bàn ảnh `MAP.px` để cảm biến đọc màu, `FIELD` đổi theo `useField`)
  10. Tiêu chí hoàn thành: đo mỗi lượt chạy (`runStart/runTrack/runEnd`, `evaluateRun`), phát sự kiện `jbl:run`; `BUILTIN_META` = cấp độ + tiêu chí bài có sẵn.
- `student.js` – nạp sau `app.js`, dùng chung biến toàn cục: tài khoản (`ACC`), bài được giao (`AS`, tự lưu 20 s / sau lượt chạy / khi ẩn tab),
  gửi lượt chạy + nhịp thời gian, chế độ chấm `/?review=<submission>` (`RV`), dải tiết học (`LIVE`), góp ý.
  Sự kiện: `jbl:auth` (đăng nhập xong), `jbl:save` (notebook đổi, từ `save()`), `jbl:run` (kết thúc lượt chạy).
- `admin.html`/`admin.css`/`admin.js` – khu giáo viên `/admin` (+ rewrite `/teacher`), chỉ tiếng Việt: bài học, sa bàn, giáo viên.
  `teacher.js` – lớp học (tab Học sinh, Giao bài, Tiến độ & chấm bài, Tiết học) + Google Classroom; hook vào admin qua `TEACHER_TABS`, `CLASS_SUBTABS`, `VIEWS`.
- `api/` – Vercel Functions Node CommonJS. **Gói Hobby tối đa 12 function**: gom endpoint mới vào function có sẵn, định tuyến bằng `?a=`.
  - `_lib.js` lưu trữ nội dung GitHub (`GITHUB_TOKEN`, `GITHUB_DATA_REPO`) hoặc `JBL_DATA_DIR`; phiên `jbl_s` ký HMAC (`AUTH_SECRET`);
    `currentUser` đọc lại vai trò từ CSDL; `requireRole`; mã hoá token (`TOKEN_ENC_KEY`).
  - `_db.js` Neon (`DATABASE_URL`, `@neondatabase/serverless`) hoặc PGlite (`JBL_PGLITE`) khi thử; `_schema.js` lược đồ idempotent –
    **thêm thay đổi bằng lệnh mới ở cuối (`ALTER TABLE … ADD COLUMN IF NOT EXISTS`), không sửa lệnh cũ**; sau deploy admin bấm "Khởi tạo / cập nhật CSDL".
  - `auth.js` Google OAuth (PKCE, state cookie `jbl_oa`), mật khẩu admin dự phòng, `me`, `logout`, `dev` (chỉ localhost + `JBL_DEV_LOGIN=1`).
  - `content.js` content.json (bài học: `level`, `kind`, `criteria`; sa bàn) – admin + giáo viên ghi. `asset.js` ảnh.
  - `class.js` mọi thứ lớp học: teachers, classes, members, assignments, my/sub/save/submit, run/beat, progress, review/grade, verify,
    live/my_live, gc_* (Classroom). Giáo viên chỉ thao tác lớp của mình (`ownClass`), học sinh chỉ bài lớp mình (`myAssignment`).
- Vai trò: `admin` = email trong `ADMIN_EMAILS` (không lưu CSDL), `teacher` do admin cấp, `student` mặc định.
- `vendor/` – Three.js 0.128.0, OrbitControls, Skulpt 1.2.0. `vercel.json` – CSP, cache, rewrite `/teacher`.

## Thông số robot (theo robot thật)
Hai bánh chủ động ở giữa, cách nhau 17 cm, bánh Ø 6.5 cm, động cơ DCGM-370 có encoder (giả định 1320 xung/vòng),
2 bánh xoay tự do trước/sau, Lidar RPLIDAR A1 quét ở độ cao 16 cm, camera góc rộng phía trước, OLED 128×32, đế nhôm xanh Ø 20 cm.
Hằng số ở `RB` trong `app.js`; mô hình 3D ở `buildRobot()`.

## Quy ước
- Song ngữ trang học: mọi chữ mới thêm key vào cả `I18N.vi` và `I18N.en`, dùng `t("key")`. Bài mẫu mới thêm cả `LESSONS_EN`. Khu giáo viên chỉ tiếng Việt.
- Không chèn HTML chưa qua `esc()` vào `innerHTML`. **Không dùng thuộc tính `style="..."` trong HTML** (CSP chặn) – dùng class,
  hoặc `data-css` rồi `applyCss()`, hoặc gán `element.style` bằng JS.
- Tên class dễ trùng giữa `app.css` và phần mới: `.lbl` (nhãn linh kiện, position absolute), `.hint`, `.bar`, `.meta` – đặt tên khác (`.bar-lbl`, `.a-hint`…).
- `app.js` và `student.js` (cũng như `admin.js` + `teacher.js`) chung phạm vi toàn cục: kiểm tra trùng tên bằng `cat app.js student.js > tmp.js && node --check tmp.js`.
- Không thêm thư viện CDN; frontend tải bản cố định vào `vendor/`. Backend được dùng gói npm (ghim phiên bản, có `package-lock.json`).
- Bài mẫu đã chạy thử; đổi thông số vật lý (`RB`) thì chạy lại bài 2, 4, 5, 7, 8, 9.

## Bảo mật (không được nới lỏng)
- Sandbox Python: đã gỡ `jseval`, `open`, `file`, `execfile` khỏi `Sk.builtins`; `pyRead()` chỉ cho thư viện trong `PY_ALLOWED`.
- Tệp `.ipynb` mở vào: tối đa 20 MB, 300 ô, 100.000 ký tự/ô (`sanitizeCells`); bài làm lưu server ≤ 400 KB (`cleanNotebook`).
- CSP cần `'unsafe-eval'` cho Skulpt – không thêm `'unsafe-inline'`.
- API ghi: kiểm `Origin` (`sameOrigin`), cookie `SameSite=Strict`; luôn kiểm quyền sở hữu lớp/bài trong `class.js`.

## Chạy thử
Thử giao diện phải có header CSP như `vercel.json` (server tĩnh thường che lỗi `style=`). Thử đầy đủ bằng server Node gọi các hàm `api/` với
`JBL_DATA_DIR`, `JBL_PGLITE` (+ `@electric-sql/pglite` cài ngoài repo), `JBL_DEV_LOGIN=1`, các biến `AUTH_SECRET`, `TOKEN_ENC_KEY`, `ADMIN_EMAILS`;
có thể giả lập Google bằng cách thay `global.fetch` cho `oauth2.googleapis.com/token` và `classroom.googleapis.com`.
Kiểm tra sáng/tối, VI/EN, điện thoại (~400 px), và phân quyền (học sinh / giáo viên khác / admin).

## Việc đang chờ
- Phần lắp ráp robot ảo (chủ dự án sẽ yêu cầu sau).
- Số xung encoder thật của DCGM-370 bản 333 RPM (đang giả định 1320).
- Gửi Google xác minh ứng dụng OAuth để giáo viên không còn thấy cảnh báo khi kết nối Classroom.
