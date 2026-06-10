# Phase 10, 11 & 12: Hồ sơ, Lịch sử, Replay và Tương tác xã hội

## Các công việc đã thực hiện:

### Phase 10: Hồ sơ & Cá nhân hóa (Profiles & Customization)
- **Database:** Thêm các cột `avatar_id` và `theme_id` vào bảng `users`.
- **Backend:** 
    - Tạo `userController.js` với API `PUT /api/user/profile` để cập nhật tùy chỉnh của người dùng.
    - Cập nhật `App.tsx` để hỗ trợ Themes (Classic, Dark, GameBoy) toàn ứng dụng.
- **Frontend:** 
    - Tạo component `Profile.tsx`: Cho phép chọn Avatar pixel và Theme.
    - Hiển thị thông tin người dùng tại Header.

### Phase 11: Lịch sử & Xem lại (History & Replay)
- **Database:** Thêm cột `moves_history` vào bảng `matches` để lưu chuỗi các nước đi dưới dạng JSON.
- **Backend:**
    - API `GET /api/matches/history`: Lấy danh sách trận đấu của người dùng.
    - API `GET /api/matches/:id`: Lấy chi tiết một trận đấu (bao gồm cả chuỗi nước đi).
    - Cập nhật `gameHandler.js` để tự động lưu trận đấu vào DB khi kết thúc.
- **Frontend:**
    - Tích hợp danh sách lịch sử trận đấu vào màn hình Profile.
    - Tạo component `Replay.tsx`: Cho phép xem lại từng bước đi của các trận đấu cũ bằng nút Back/Next.

### Phase 12: Tương tác Xã hội (Social & Emotes)
- **Backend:** 
    - Cập nhật `roomHandler.js` để xử lý các sự kiện `send_chat` và `send_emote`.
- **Frontend:**
    - **Chat:** Thêm ô chat real-time trong phòng chơi.
    - **Emotes:** Thêm bảng icon pixel biểu cảm. Khi gửi, emote sẽ hiển thị dạng bong bóng (bubble) phía trên avatar của người chơi trong 2 giây.

## Ghi chú:
- Hệ thống Themes thay đổi toàn bộ cảm giác của trò chơi (đặc biệt là theme GameBoy).
- Replay system giúp người chơi có thể học hỏi từ các ván đấu trước.
- Chat và Emote làm cho môi trường game trở nên sống động và tương tác hơn.
