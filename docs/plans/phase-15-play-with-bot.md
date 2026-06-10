# Kế hoạch Phát triển Caro Pixel - Giai đoạn 15: Chơi với Bot (Singleplayer / Practice Mode)

Kế hoạch này tập trung vào việc bổ sung chế độ chơi đơn (chơi với máy - Bot) trực tiếp từ Sảnh chờ (Lobby). Chế độ chơi này giúp người chơi luyện tập, cải thiện kỹ năng trước khi tham gia đấu trường mạng.

---

## Mục tiêu
- Tạo trải nghiệm chơi đơn mượt mà, đậm chất Retro Pixel với âm thanh SFX và nhạc nền đầy đủ.
- Xây dựng thuật toán AI thông minh, tối ưu tài nguyên, không gây trễ ở Server.
- Giữ nguyên cơ chế Lưu lịch sử trận đấu (Match History) và Xem lại ván đấu (Replay) của hệ thống bằng cách chạy Bot ở phía Server (Server-Side Bot).
- Tinh chỉnh Bot để có biểu cảm (Emotes) và chat tương tác sống động, giúp Bot trở nên "có hồn".

---

## Chi tiết các bước thực hiện

### 1. Database Seeding (`server/src/models/db.js`)
- Tự động kiểm tra và thêm 3 tài khoản Bot vào bảng `users` lúc khởi tạo:
  - `BOT_PIXEL_EASY` (Elo: 800, Avatar: Robot xanh)
  - `BOT_PIXEL_MEDIUM` (Elo: 1200, Avatar: Robot cam)
  - `BOT_PIXEL_HARD` (Elo: 1600, Avatar: Robot đỏ)
- Việc thêm các Bot này vào DB giúp đảm bảo tính nhất quán dữ liệu (foreign keys) khi lưu lịch sử trận đấu vào bảng `matches` mà không cần chỉnh sửa schema hay các câu lệnh API.

### 2. Định nghĩa phòng chơi đặc biệt & Quản lý kết nối (`server/src/sockets/roomHandler.js`)
- Lắng nghe sự kiện mới từ client: `create_bot_room` với các tham số `{ difficulty, symbol }`.
- Khởi tạo phòng chơi đặc biệt với cờ:
  - `isBotRoom: true`
  - `botDifficulty: difficulty`
  - `status: 'playing'` (bắt đầu ngay lập tức)
- Gán người chơi thật và Bot tương ứng vào mảng `players`.
- Hỗ trợ chọn quân cờ: `X` (đi trước), `O` (đi sau), hoặc `Random` (ngẫu nhiên).
- **Trường hợp Bot đi trước (X):** Tự động gọi hàm kích hoạt nước đi đầu tiên của Bot.

### 3. Phát triển thuật toán Bot AI (`server/src/sockets/gameHandler.js`)
- Sử dụng thuật toán **Heuristic Pattern Matching** (Đánh giá mẫu hình cờ) để chấm điểm mọi ô trống trên bàn cờ.
- Quy đổi các mẫu hình thành điểm số:
  - Thắng (5 liên tiếp): 100,000 điểm.
  - Nguy hiểm (mở 3 hoặc chặn 4): 10,000 điểm.
  - Tiềm năng (mở 2, chặn 3): 1,000 điểm.
  - Cơ bản (mở 1): 100 điểm.
- Công thức điểm ô cờ: 
  $$\text{Total} = W_{attack} \times \text{AttackScore} + W_{defense} \times \text{DefenseScore}$$
- Thiết lập 3 cấp độ:
  - **Easy (Dễ):** Tập trung đi cờ tấn công, ít khi phòng thủ chặn người chơi. Bot chọn ngẫu nhiên nước đi trong Top 3 ô điểm cao nhất để tăng tính "nhân đạo".
  - **Medium (Trung bình):** Cân bằng giữa tấn công và phòng thủ.
  - **Hard (Khó):** Ưu tiên phòng thủ chặn các thế cờ nguy hiểm của đối thủ và chủ động bẫy tạo thế đôi (Double 3, Double 4) để giành chiến thắng.
- Sử dụng `setTimeout` giả lập thời gian suy nghĩ của Bot (500ms - 800ms) để mang lại cảm giác sống động.

### 4. Bot Chat & Emotes
- Viết các mẫu tin nhắn chat và biểu cảm phù hợp với các tình huống:
  - Chào mừng khi bắt đầu trận.
  - Trêu đùa hoặc cười khi chặn được một thế cờ hiểm của người chơi.
  - Kinh ngạc khi người chơi đi nước cờ xuất sắc.
  - Chúc mừng/chào thua khi trận đấu kết thúc.
- Phát các tin nhắn/biểu cảm này thông qua hệ thống socket hiện có (`new_chat`, `new_emote`).

### 5. Giao diện Người dùng (`client/src/...`)
- **Lobby (`App.tsx`):** Thêm nút "PLAY WITH BOT" mang đậm phong cách pixel.
- **Bot Selector Modal:** Form chọn cấp độ khó (Easy, Medium, Hard) và quân cờ (X, O, Random).
- **Game Room (`GameRoom.tsx`):**
  * Tắt bộ đếm giờ đối với lượt đi của Bot.
  * Hiển thị Avatar robot và chỉ số Elo tương ứng của Bot.
  * Hiển thị bong bóng biểu cảm (Emotes) bay lên từ Avatar của Bot khi Bot phát emote.

---
*Kế hoạch phát hành Phase 15 - Không có kiểm thử E2E*
