# Lộ trình Phát triển Caro Pixel (Future Roadmap)

Tài liệu này ghi lại các giai đoạn phát triển dự kiến tiếp theo để hoàn thiện trò chơi Caro Pixel.

---

## Phase 17: Hệ thống Xếp hạng & Mùa giải (Ranked Seasons)
*   **Mục tiêu:** Tăng tính cạnh tranh và giữ chân người chơi lâu dài.
*   **Tính năng chính:**
    *   **Phân bậc Rank:** Chia người chơi thành các bậc (Đồng, Bạc, Vàng, Bạch Kim, Kim Cương, Cao Thủ) dựa trên Elo. Mỗi bậc có icon Pixel Art riêng.
    *   **Mùa giải:** Reset Elo định kỳ (ví dụ: mỗi tháng). Lưu trữ "Hall of Fame" cho những người đứng đầu mùa trước.
    *   **Matchmaking:** Thuật toán tìm trận ưu tiên những người có độ lệch Elo thấp (±50-100).

## Phase 18: Shop & Tùy biến (Customization Shop)
*   **Mục tiêu:** Tạo hệ thống kinh tế và cá nhân hóa trải nghiệm.
*   **Tính năng chính:**
    *   **Pixel Coins:** Đơn vị tiền tệ nhận được khi thắng trận hoặc hoàn thành nhiệm vụ.
    *   **Cửa hàng Quân cờ:** Mua các bộ skin cho quân X và O (Neon, Gỗ, Đá quý, Pixel mờ...).
    *   **Hiệu ứng Đánh cờ:** Hiệu ứng hạt (particles) hoặc rung màn hình khi đặt quân cờ xuống.
    *   **Chủ đề Bàn cờ:** Skin cho toàn bộ giao diện (Dungeon, Space, Retro Cafe).

## Phase 19: Hệ thống Bạn bè & Giao lưu (Social Features)
*   **Mục tiêu:** Kết nối người chơi và xây dựng cộng đồng.
*   **Tính năng chính:**
    *   **Danh sách Bạn bè:** Tìm kiếm người chơi theo ID, gửi yêu cầu kết bạn.
    *   **Trạng thái Online:** Hiển thị ai đang trực tuyến, ai đang trong trận.
    *   **Mời chơi:** Gửi lời mời trực tiếp (Invite) vào phòng thông qua hệ thống Socket.
    *   **Chat riêng:** Hệ thống tin nhắn cá nhân đơn giản.

## Phase 20: Nhiệm vụ & Thành tựu (Quests & Achievements)
*   **Mục tiêu:** Tạo động lực đăng nhập hàng ngày.
*   **Tính năng chính:**
    *   **Nhiệm vụ hàng ngày:** Hệ thống 3 nhiệm vụ mỗi ngày (ví dụ: "Thắng 2 trận với Bot", "Đạt chuỗi 3 trận thắng").
    *   **Hệ thống Level:** Tích lũy EXP từ các trận đấu để lên cấp.
    *   **Thành tựu (Achievements):** Các cột mốc khó (ví dụ: "Thắng trận trong dưới 10 nước đi", "Đạt 2000 Elo").

## Phase 21: PWA & Thông báo (PWA & Mobile Optimization)
*   **Mục tiêu:** Mang lại trải nghiệm như App bản địa trên di động.
*   **Tính năng chính:**
    *   **Progressive Web App (PWA):** Cấu hình Manifest và Service Worker để cài đặt game lên màn hình chính (Add to Home Screen).
    *   **Push Notifications:** Thông báo khi đối thủ đi quân (nếu Tab đang ẩn) hoặc khi được mời chơi.
    *   **Offline Mode:** Cho phép vào sảnh và chơi với Bot khi không có kết nối mạng.
    *   **Splash Screen:** Màn hình chào mang phong cách Pixel Art khi khởi động.

---
*Tài liệu này được tạo vào ngày 10/06/2026 bởi Gemini CLI.*
