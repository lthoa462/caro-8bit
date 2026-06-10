# Phase 4: Logic Game & Bàn cờ (Game Logic & Board)

## Các công việc đã thực hiện:
- **Backend:**
    - Tạo `gameHandler.js` xử lý nước đi (`make_move`) và kiểm tra thắng thua.
    - Triển khai thuật toán kiểm tra 5 quân liên tiếp (ngang, dọc, chéo).
    - Quản lý lượt đánh (`currentTurn`) và trạng thái bàn cờ 15x15.
    - Hỗ trợ tính năng chơi lại (`restart_game`).
- **Frontend:**
    - Nâng cấp `GameRoom.tsx` với bàn cờ 15x15 tương tác.
    - Hiển thị lượt đi, quân X/O và thông báo thắng thua.
    - Tích hợp hiệu ứng animation khi tới lượt và khi thắng.
    - Xử lý gửi nước đi thông qua Socket.io.

## Ghi chú:
- Bàn cờ 15x15 là kích thước tiêu chuẩn cho game Caro.
- Logic kiểm tra thắng thua được thực hiện phía Server để đảm bảo công bằng.
- Giao diện đã mang đậm phong cách Pixel Retro.
