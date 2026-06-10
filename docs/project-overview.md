# Tổng quan Dự án Caro Pixel Online

Caro Pixel Online (v1.0.0) là một ứng dụng chơi game Caro (Gomoku) trực tuyến thời gian thực với phong cách đồ họa và âm thanh retro 8-bit. Tài liệu này cung cấp một cái nhìn toàn diện về kiến trúc hệ thống, cấu trúc thư mục, các chức năng cốt lõi và luồng dữ liệu của dự án.

---

## 🗺️ Kiến trúc Hệ thống

Hệ thống được thiết kế theo mô hình **Client-Server** giao tiếp thời gian thực hai chiều thông qua WebSockets (Socket.io).

```
                      +-------------------+
                      |   React Client    |
                      |   (Vite + TS)     |
                      +---------+---------+
                                |  ^
                HTTP (REST APIs)|  | WebSocket (Socket.io)
                Auth / Profile  |  | Game State / Chat / Emotes
                                v  |
                      +---------+---------+
                      |   Node.js Server  |
                      |  (Express + SIO)  |
                      +---------+---------+
                                |
                                | SQL (Better-SQLite3)
                                v
                      +-------------------+
                      |  SQLite Database  |
                      | (database.sqlite) |
                      +-------------------+
```

---

## 📁 Cấu trúc Thư mục & Chức năng các File chính

### 1. Backend Server (`/server`)
Chịu trách nhiệm xác thực người dùng, lưu trữ dữ liệu, quản lý trạng thái phòng chơi và điều phối luồng trò chơi thời gian thực.
*   `src/index.js`: Điểm khởi chạy của server, cấu hình Express, Socket.io và thiết lập các API Route.
*   `src/models/db.js`: Khởi tạo database SQLite (`database.sqlite`) và tạo cấu trúc các bảng (`users`, `matches`).
*   `src/middleware/auth.js`: Middleware xác thực JWT token gửi từ client lên.
*   `src/controllers/authController.js`: Xử lý logic Đăng ký, Đăng nhập (mã hóa mật khẩu bằng Bcrypt) và lấy danh sách bảng xếp hạng (Leaderboard).
*   `src/controllers/userController.js`: Xử lý cập nhật thông tin cá nhân (Avatar, Theme) và truy vấn lịch sử trận đấu (Match History/Replay).
*   `src/sockets/roomHandler.js`: Quản lý các sự kiện liên quan đến phòng chơi: Tạo phòng, tham gia phòng bằng mã Code, tìm phòng ngẫu nhiên và dọn dẹp khi người dùng ngắt kết nối.
*   `src/sockets/gameHandler.js`: Quản lý trực tiếp logic ván cờ: nước đi cờ (`make_move`), kiểm tra thắng thua (`checkWin`), tính toán Elo rating, lưu lịch sử trận đấu và điều phối bộ đếm thời gian (Turn Timers) phía server.

### 2. Frontend Client (`/client`)
Giao diện người dùng tương tác dạng Pixel Art, kết nối WebSocket và phát âm thanh.
*   `src/main.tsx` & `src/index.css`: Điểm khởi chạy ứng dụng và các khai báo style toàn cục phong cách Retro.
*   `src/App.tsx` & `src/App.css`: Component gốc điều phối trạng thái người dùng (Auth, Profile), quản lý kết nối socket chung, xử lý âm thanh nền và định tuyến hiển thị giữa Sảnh chờ và Phòng chơi.
*   `src/hooks/useSocket.ts`: Custom hook quản lý kết nối tự động đến server thông qua Socket.io dựa trên trạng thái xác thực.
*   `src/audio/soundManager.ts`: Bộ quản lý âm thanh sử dụng **Tone.js**. Tự động phát nhạc nền (Lobby BGM) và sinh hiệu ứng SFX (đặt quân, thắng, thua) bằng code âm thanh Chiptune thời gian thực.
*   `src/components/AuthForm.tsx`: Form xử lý Đăng ký và Đăng nhập.
*   `src/components/Profile.tsx`: Component hiển thị thông tin người chơi, hỗ trợ thay đổi Avatar (8 mẫu pixelated) và Theme.
*   `src/components/Leaderboard.tsx`: Bảng xếp hạng Top 10 người chơi có Elo cao nhất.
*   `src/components/GameRoom.tsx`: Bàn cờ chơi Caro 15x15, khu vực thông tin đối thủ, khung Chat, bảng Emotes bong bóng bay, thanh tiến trình đếm ngược thời gian và hiệu ứng rung lắc màn hình khi thua cuộc.
*   `src/components/Replay.tsx`: Giao diện xem lại toàn bộ nước đi của một trận đấu đã lưu trong lịch sử, cho phép chuyển đổi qua lại (`Next`/`Back`) từng nước đi cực kỳ trực quan.

---

## 🛠️ Các Tính năng Kỹ thuật Cốt lõi

### 1. Multiplayer Real-time & Sảnh chờ
*   **Tạo phòng (Create Room):** Người chơi tạo một phòng mới và nhận một mã code ngẫu nhiên gồm 6 ký tự viết hoa.
*   **Vào phòng theo Code (Join Room):** Người chơi khác nhập mã code để vào chung phòng đấu.
*   **Tìm phòng ngẫu nhiên (Join Random):** Server tự động ghép cặp người chơi đang rảnh với nhau vào một phòng chơi mới.

### 2. Logic Trận đấu & Kiểm tra Thắng thua (`checkWin`)
*   Bàn cờ kích thước 15x15. Trạng thái cờ là mảng 2 chiều lưu giá trị `X` hoặc `O`.
*   Thuật toán duyệt 4 hướng (Ngang, Dọc, Chéo xuôi, Chéo ngược) xuất phát từ nước đi mới nhất để tìm chuỗi 5 quân cờ liên tiếp trở lên.
*   Khi có người thắng, mảng tọa độ thắng (`winningLine`) được trả về để tô sáng trên giao diện.

### 3. Hệ thống Tính Điểm Elo & Xếp hạng
*   Hệ thống áp dụng thuật toán Elo tiêu chuẩn với hệ số K-factor là 32:
    $$\text{ExpectedScore}_{A} = \frac{1}{1 + 10^{(\text{Elo}_{B} - \text{Elo}_{A}) / 400}}$$
    $$\text{NewElo}_{A} = \text{Elo}_{A} + K \times (\text{ActualScore}_{A} - \text{ExpectedScore}_{A})$$
*   Điểm Elo của người thắng sẽ tăng và của người thua sẽ giảm tương ứng.
*   Bảng xếp hạng (Leaderboard) sắp xếp giảm dần theo điểm Elo để chọn ra Top 10.

### 4. Hệ thống Đếm giờ An toàn phía Server (Server-Side Turn Timers)
*   Để chống treo máy gian lận, bộ đếm giờ (mặc định 30 giây) được chạy bằng `setInterval` **trực tiếp trên Server**.
*   Server liên tục gửi thời gian còn lại thông qua sự kiện `timer_update`.
*   Nếu hết giờ mà người chơi không đi cờ, Server tự động xử thua người chơi đó vì lỗi **Timeout**, thực hiện trừ Elo và lưu kết quả trận đấu.

### 5. Xem lại trận đấu (Match Replay)
*   Khi trận đấu kết thúc, toàn bộ mảng lịch sử các bước đi dưới dạng JSON bao gồm: Tên người chơi, Ký hiệu cờ, Tọa độ hàng/cột, và Thời gian thực hiện được ghi lại trong bảng `matches` của database SQLite.
*   Giao diện Replay hỗ trợ dựng lại bàn cờ và giúp người chơi tua đi (`Next`) hoặc tua lại (`Back`) từng bước đi tùy ý.

### 6. Âm thanh Chiptune 8-bit (Tone.js)
*   Nhạc nền sảnh chờ (Lobby BGM) sử dụng `Tone.Part` để tạo vòng lặp giai điệu nhẹ nhàng từ synth tam giác (`triangle oscillator`).
*   Các âm thanh SFX được tạo trực tiếp bằng tần số âm nhạc cổ điển (như nốt `C4` cho tiếng đặt quân; hợp âm rải `C4 -> E4 -> G4 -> C5` cho tiếng thắng cuộc; đi xuống `G3 -> E3 -> C3` cho tiếng thất bại).
*   Hệ thống có cơ chế kiểm tra và lưu trạng thái tắt tiếng (`isMuted`) của người chơi vào `localStorage`.

---

## 🧪 Hệ thống Kiểm thử Tự động (Playwright E2E)

File test `client/tests/game.spec.ts` cung cấp kịch bản kiểm thử toàn diện giả lập hành vi người dùng:
1.  **Auth Flow:** Kiểm tra thông báo lỗi khi nhập mật khẩu đăng ký không khớp, đăng ký thành công tự động chuyển về đăng nhập sau 2 giây, đăng nhập thành công lưu thông tin vào sảnh chờ.
2.  **Room Flow:** Giả lập User A tạo phòng, nhận mã code. User B mở một cửa sổ trình duyệt khác nhập mã code để vào đúng phòng của User A, kích hoạt trạng thái phòng sang `playing`.
3.  **Gameplay & Elo Flow:** Hai trình duyệt giả lập đánh cờ theo danh sách nước đi định sẵn để một bên đạt 5 nước liên tiếp. Kiểm tra hiệu ứng cờ thắng, cập nhật điểm Elo tăng/giảm và hiển thị đúng trên giao diện.
4.  **Timeout Flow:** Giả lập một người chơi treo máy không đánh cờ trong vòng 5 giây (thời gian rút ngắn khi chạy test) và kiểm tra xem server có tự động xử thua do Timeout hay không.
5.  **Replay Flow:** Kiểm tra xem người chơi có truy cập được vào lịch sử trận đấu vừa chơi và bấm Next/Back qua các bước đi một cách chính xác không.

---
*Tài liệu được tổng hợp tự động bởi Gemini CLI - 2026*
