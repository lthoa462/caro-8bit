# Kế hoạch Phát triển Caro Pixel - Giai đoạn 16: Âm thanh Nâng cao & Tương thích Mobile

Giai đoạn này tập trung vào việc hoàn thiện hệ thống âm thanh (Audio Experience) để mang lại cảm giác Retro sống động nhất, đồng thời khắc phục triệt để vấn đề không có âm thanh trên các thiết bị di động.

---

## Mục tiêu
- **Phân tách âm nhạc:** Nhạc Sảnh (Lobby) nhẹ nhàng, nhạc Trận đấu (Gameplay) kịch tính hơn.
- **Hiệu ứng UI (SFX):** Thêm âm thanh khi Click nút, Hover (nếu có thể), và các thông báo quan trọng.
- **Fix Mobile Sound:** Đảm bảo âm thanh hoạt động trên iOS/Android (xử lý chính sách Auto-play và Resume AudioContext).
- **Âm thanh chiến thắng/thất bại:** Cải thiện giai điệu cho cảm xúc hơn.

---

## Chi tiết thực hiện

### 1. Sửa lỗi âm thanh trên Mobile (`client/src/App.tsx` & `soundManager.ts`)
- **Vấn đề:** Trình duyệt di động chặn AudioContext khởi tạo tự động. Cần một hành động của người dùng (User Gesture) để "mở khóa".
- **Giải pháp:**
    - Sử dụng `Tone.start()` trong một hàm khởi tạo được kích hoạt bởi sự kiện `click` hoặc `touchstart`.
    - Thêm màn hình "Tap to Start" hoặc lồng ghép vào nút Login/Guest để đảm bảo AudioContext được Resume.
    - Kiểm tra trạng thái `Tone.context.state` trước khi phát âm thanh.

### 2. Quản lý nhạc nền (BGM) đa dạng (`client/src/audio/soundManager.ts`)
- **Lobby BGM:** Giữ phong cách 8-bit vui tươi, nhịp độ vừa phải.
- **Battle BGM:** Tạo một `Tone.Part` mới với giai điệu nhanh hơn, kịch tính hơn (Fast-paced).
- **Cơ chế chuyển đổi:** Khi `room` thay đổi trạng thái từ `null` sang `playing`, tự động dừng nhạc Lobby và phát nhạc Battle.

### 3. Bổ sung hiệu ứng âm thanh UI (SFX)
- **Click Sound:** Một tiếng "Beep" ngắn mỗi khi người chơi nhấn vào bất kỳ Button nào có class `.pixel-border`.
- **Match Start Sound:** Âm thanh đặc biệt khi đối thủ vào phòng hoặc khi ván đấu bắt đầu.
- **Timer Tick:** Âm thanh cảnh báo khi thời gian lượt đi còn dưới 5 giây.

### 4. Cải thiện giai điệu Win/Lose
- Sử dụng các hợp âm phức tạp hơn một chút (Arpeggios) để tăng tính biểu cảm cho âm thanh 8-bit.

---

## Các bước triển khai (Proposed Sequence)
1. **Refactor `soundManager.ts`:** Thêm `playClickSound`, `startBattleMusic`, và cải thiện logic `stop`.
2. **Update `App.tsx`:** 
   - Thêm sự kiện `touchstart` để hỗ trợ Mobile.
   - Thêm logic chuyển đổi nhạc dựa trên trạng thái `room`.
3. **Global Click Listener:** Thêm một listener toàn cục trong `App.tsx` để phát âm thanh click cho các button.
4. **GameRoom integration:** Phát âm thanh cảnh báo khi timer sắp hết.

---
*Kế hoạch dự kiến thực hiện ngay sau khi được phê duyệt.*
