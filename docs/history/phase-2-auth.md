# Phase 2: Xác thực người dùng (Authentication)

## Các công việc đã thực hiện:
- **Backend:**
    - Cài đặt `bcryptjs` và `jsonwebtoken`.
    - Tạo `authController.js` xử lý logic Đăng ký (Hash password) và Đăng nhập (Verify & Generate JWT).
    - Triển khai `authMiddleware.js` để bảo vệ các route cần xác thực.
    - Đã test cơ bản các endpoint `/api/register` và `/api/login`.
- **Frontend:**
    - Tạo component `AuthForm.tsx` với giao diện Pixel Art.
    - Quản lý trạng thái đăng nhập trong `App.tsx`.
    - Lưu trữ Token và thông tin User vào `localStorage`.
    - Giao diện chuyển đổi giữa Đăng ký và Đăng nhập mượt mà.

## Ghi chú:
- JWT Secret được cấu hình trong file `.env`.
- Mật khẩu được mã hóa an toàn với Salt rounds là 10.
- Frontend đã sẵn sàng cho Phase 3 (Quản lý phòng).
