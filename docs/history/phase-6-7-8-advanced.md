# Phase 6, 7 & 8: Tính năng nâng cao, Xếp hạng và Hoàn thiện Flow

## Các công việc đã thực hiện:

### Phase 6: Refactor Authentication Flow
- **Frontend:**
    - Cập nhật `AuthForm.tsx` thêm trường "Confirm Password".
    - Thêm logic validate mật khẩu khớp nhau.
    - Đăng ký thành công sẽ xóa form, hiển thị thông báo và tự động chuyển về màn hình Login sau 2 giây.

### Phase 7: Room Management & Visual Polish
- **Phòng chơi:**
    - Thêm ô nhập mã phòng tại Lobby.
    - Người chơi có thể mời bạn bè bằng cách gửi mã Room ID (6 ký tự).
- **Hiệu ứng hình ảnh:**
    - Highlight 5 quân cờ chiến thắng bằng hiệu ứng nhấp nháy vàng.
    - Thêm hiệu ứng rung màn hình (Screen Shake) cho người thua cuộc.
    - Hiển thị Elo của cả hai người chơi trong phòng.

### Phase 8: Hệ thống Xếp hạng (Elo) & Leaderboard
- **Database:** Bổ sung cột `elo_rating` (mặc định 1000) và `total_wins` vào bảng `users`.
- **Backend:**
    - Triển khai thuật toán tính điểm Elo sau mỗi trận đấu (K-factor = 32).
    - Cập nhật điểm Elo và số trận thắng vào Database ngay khi kết thúc trận.
    - Tạo API `/api/leaderboard` lấy Top 10 người chơi.
- **Frontend:**
    - Hiển thị Elo và số trận thắng của bản thân tại Lobby.
    - Tạo component `Leaderboard.tsx` hiển thị danh sách cao thủ.
    - Tự động cập nhật Elo cục bộ sau trận đấu để UI mượt mà.

## Ghi chú:
- Hệ thống Elo đảm bảo tính cạnh tranh công bằng.
- Luồng đăng ký mới giúp giảm thiểu lỗi nhập sai mật khẩu.
- Toàn bộ tính năng nâng cao đã được tích hợp hoàn chỉnh.
