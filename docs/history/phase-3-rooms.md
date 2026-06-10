# Phase 3: Quản lý phòng (Room Management)

## Các công việc đã thực hiện:
- **Backend:**
    - Tạo `roomHandler.js` xử lý logic Socket.io cho phòng chơi.
    - Hỗ trợ các sự kiện: `create_room`, `join_room`, `join_random`, `leave_room`.
    - Tự động dọn dẹp phòng khi người chơi ngắt kết nối (`disconnect`).
    - Quản lý trạng thái phòng (`waiting`, `playing`).
- **Frontend:**
    - Tạo hook `useSocket.ts` để quản lý kết nối Socket.io client-side.
    - Tạo component `GameRoom.tsx` hiển thị thông tin phòng và đối thủ.
    - Tích hợp logic tạo/tham gia phòng vào `App.tsx`.
    - Giao diện chuyển đổi linh hoạt giữa Lobby và Game Room.

## Ghi chú:
- Mỗi phòng tối đa 2 người chơi.
- Người tạo phòng mặc định là quân `X`, người tham gia là quân `O`.
- Hệ thống đã sẵn sàng cho Phase 4 (Logic Game & Bàn cờ).
