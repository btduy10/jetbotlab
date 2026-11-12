# JetBot Lab — ghi chú cho Claude

Trang web tĩnh (không build, không backend) dạy lập trình JetBot ROS AI Kit: notebook Python kiểu Jupyter
bên trái, sa bàn 3D mô phỏng robot bên phải. Người dùng: giáo viên STEM-Robotics THPT FPT Cần Thơ và học sinh.
Triển khai: Vercel tự deploy khi push lên `main`. Giao tiếp với chủ dự án bằng tiếng Việt.

## Cấu trúc
- `index.html` – markup. Chữ hiển thị gắn `data-i18n`, `data-i18n-title`, `data-i18n-aria`, `data-i18n-html`.
- `app.css` – toàn bộ style. Màu là token trên `:root` + 2 khối dark (`prefers-color-scheme` và `[data-theme=dark]`) – sửa token phải sửa cả 3 chỗ.
- `app.js` – toàn bộ logic, các phần theo thứ tự:
  1. Sa bàn `MAPS` (mét, hệ ROS: x tiến, y trái) 2. Mô phỏng vật lý `SIM` 3. Thư viện Python `jetbot` (chuỗi `JETBOT_PY`, `SIM_JS`, `TIME_JS`)
  4. Bài mẫu `LESSONS` (VI) + `LESSONS_EN` 5. Notebook (ô code / ghi chú, kéo đổi thứ tự) 6. Kernel Skulpt 7. Đồ hoạ Three.js 8. Khởi động
- `vendor/` – Three.js 0.128.0, OrbitControls, Skulpt 1.2.0 (tự lưu, không dùng CDN).
- `vercel.json` – header bảo mật (CSP…).

## Thông số robot (theo robot thật)
Hai bánh chủ động ở giữa, cách nhau 17 cm, bánh Ø 6.5 cm, động cơ DCGM-370 có encoder (giả định 1320 xung/vòng),
2 bánh xoay tự do trước/sau, Lidar RPLIDAR A1 quét ở độ cao 16 cm, camera góc rộng phía trước, OLED 128×32, đế nhôm xanh Ø 20 cm.
Hằng số ở `RB` trong `app.js`; mô hình 3D ở `buildRobot()`.

## Quy ước
- Song ngữ: mọi chữ mới phải thêm key vào cả `I18N.vi` và `I18N.en`, dùng `t("key")`. Bài mẫu mới thêm cả bản `LESSONS_EN`.
- Không chèn HTML chưa qua `esc()` vào `innerHTML`. Không dùng thuộc tính `style="..."` trong HTML (CSP chặn) – dùng class.
- Không thêm thư viện từ CDN; nếu cần, tải bản cố định vào `vendor/`.
- Nút nghe phát âm trong ô ghi chú: `<button data-say="text" data-rate="0.5" data-lang="en-GB">Listen</button>` (`data-say=""` = nút dừng). `cleanTag()` chỉ giữ 3 thuộc tính này, `sayButton()` đọc bằng Web Speech API của trình duyệt.
- Bài mẫu đã chạy thử; đổi thông số vật lý (`RB`) thì chạy lại bài 2, 4, 5, 8.

## Bảo mật sandbox Python (không được nới lỏng)
- Đã gỡ `jseval`, `open`, `file`, `execfile` khỏi `Sk.builtins` trong `initKernel()`.
- `pyRead()` chỉ cho import thư viện trong `PY_ALLOWED`; `document`, `urllib`, `webgl`, `processing`, `image`, `turtle` bị chặn.
- Tệp `.ipynb` mở vào: tối đa 2 MB, 300 ô, 100.000 ký tự/ô (`sanitizeCells`).
- CSP cần `'unsafe-eval'` vì Skulpt biên dịch Python sang JS – đừng thêm `'unsafe-inline'` cho script.

## Chạy thử
`npx serve .` rồi mở http://localhost:3000. Kiểm tra cả giao diện sáng/tối, VI/EN, và màn hình điện thoại (~400 px).

## Việc đang chờ
- Phần lắp ráp robot ảo (chủ dự án sẽ yêu cầu sau).
- Số xung encoder thật của DCGM-370 bản 333 RPM (đang giả định 1320).
- Lưu bài / chấm điểm theo từng học sinh (cần đăng nhập + cơ sở dữ liệu).
