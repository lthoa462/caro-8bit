# Phase 13: Chế độ thi đấu chuyên nghiệp (Turn Timers & Timeout)

## Các công việc đã thực hiện:

### Backend:
- **Khởi tạo Timer trong Room:** Thiết lập mặc định `timer: 30` (30 giây) cho mỗi lượt khi phòng chơi được tạo.
- **Hệ thống Đếm ngược (startTimer):**
    - Sử dụng `setInterval` tại server để đếm ngược từng giây.
    - Phát sự kiện `timer_update` về client mỗi giây để đồng bộ đồng hồ.
- **Xử lý Hết giờ (handleTimeout):**
    - Nếu đồng hồ đếm về `0`, server tự động xử thua cho người chơi hiện tại (`timeout`).
    - Cộng điểm Elo và tăng số trận thắng cho người thắng cuộc, trừ điểm Elo người thua cuộc.
    - Lưu kết quả trận đấu vào cơ sở dữ liệu SQLite.
    - Phát sự kiện `game_over` với lý do (`reason`) là `timeout`.
- **Dọn dẹp tài nguyên:** Tự động hủy (`clearInterval`) bộ đếm giờ khi người chơi đánh quân, rời phòng, hoặc mất kết nối.

### Frontend:
- **Thanh thời gian Pixelated (Timer Bar):**
    - Thiết kế một thanh tiến trình (progress bar) thể hiện thời gian còn lại.
    - Khi thời gian còn dưới 10 giây, thanh thời gian sẽ chuyển sang màu đỏ và nhấp nháy liên tục (`low` state) để cảnh báo.
- **Đồng bộ thời gian:** Lắng nghe sự kiện `timer_update` từ Socket.io để cập nhật giao diện thời gian thực.
- **Xử lý Kết thúc trận do Timeout:** Hiển thị thông báo "YOU WIN / YOU LOSE (TIMEOUT)" sinh động.

## Ghi chú:
- Đảm bảo tính công bằng và tránh việc người chơi cố tình treo máy.
- Thời gian đếm ngược được tính toán trực tiếp từ server để tránh gian lận ở phía client.
