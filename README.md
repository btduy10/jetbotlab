# JetBot Lab

Notebook Python kiểu Jupyter để học lập trình JetBot ROS AI Kit trên sa bàn 3D.
Python chạy trong trình duyệt (Skulpt 1.2.0), đồ hoạ dùng Three.js r128. Trang tĩnh, không cần build.

## Cấu trúc
- `index.html` – giao diện
- `app.css`, `app.js` – mã nguồn của trang
- `vendor/` – thư viện tự lưu (không tải từ CDN bên ngoài)
- `vercel.json` – header bảo mật (CSP, chống nhúng iframe, HSTS…)

## Bảo mật
- Python của học sinh chạy trong sandbox: đã gỡ `jseval`, `open`, `file`, `execfile`; chỉ cho phép
  các thư viện an toàn (jetbot, time, math, random, re, collections…). Các module `document`, `urllib`,
  `webgl`, `processing`, `image`, `turtle` bị chặn.
- Tệp `.ipynb` mở vào bị giới hạn 2 MB, tối đa 300 ô, mỗi ô 100.000 ký tự.
- CSP chỉ cho chạy script cùng tên miền. Cần `'unsafe-eval'` vì Skulpt biên dịch Python sang JavaScript.
- Không có máy chủ, cơ sở dữ liệu hay tài khoản; notebook chỉ lưu trong trình duyệt của từng máy.

## Chạy thử trên máy
`npx serve .` rồi mở http://localhost:3000

## Triển khai Vercel
Framework Preset **Other**, để trống Build Command.
