# Work Mode Fake

Tiện ích Chrome khoác giao diện kiểu hộp thư Gmail lên Messenger web
(`messenger.com` và `facebook.com/messages`). Chỉ đổi giao diện trên máy bạn, không gửi dữ liệu đi đâu.

## Cài đặt (Chrome / Edge / Cốc Cốc / Brave)

1. Giải nén file `messenger-mail-skin.zip` ra một thư mục cố định (đừng xóa thư mục sau khi cài).
2. Mở `chrome://extensions` (Edge: `edge://extensions`).
3. Bật **Chế độ dành cho nhà phát triển** (Developer mode) ở góc phải trên.
4. Bấm **Tải tiện ích đã giải nén** (Load unpacked) → chọn thư mục vừa giải nén.
5. Mở hoặc tải lại tab Messenger.

## Cách dùng

- Danh sách đoạn chat hiện thành danh sách thư: tên người = người gửi, tin cuối = nội dung, giờ chuyển thành dạng "16:38" / "5 thg 10". Chat chưa đọc in đậm, nền trắng.
- Bấm một dòng để mở đoạn chat như mở thư. Nút ← (hoặc phím `u` / `Esc`) để quay lại hộp thư.
- Ô **Tìm trong thư** lọc theo tên và nội dung (gõ không dấu cũng được). Phím `/` để nhảy vào ô tìm.
- **Có gắn dấu sao**: bấm ngôi sao ở mỗi dòng để gắn; lưu trên máy.
- **Đã gửi**: các đoạn chat mà tin cuối là của bạn.
- **Soạn thư**: mở màn hình tin nhắn mới của Messenger.
- Kéo xuống cuối danh sách (hoặc bấm mũi tên ›) để tải thêm đoạn chat cũ.
- `Alt + Shift + G`: bật/tắt nhanh giao diện.

Bấm icon tiện ích trên thanh công cụ để: bật/tắt, đổi tiêu đề tab (`{n}` = số chat chưa đọc),
đổi chữ trên ảnh đại diện, bật/tắt icon phong bì, ẩn/hiện thanh tên + nút gọi trong đoạn chat.

## Giới hạn cần biết

- Meta thường xuyên đổi cấu trúc trang. Phần danh sách thư dựa trên link đoạn chat nên khá bền;
  phần đổi màu bong bóng chat dựa vào việc dò màu nền nên có thể lệch nếu Meta đổi giao diện.
- Thông báo đẩy (pop-up) của trình duyệt và âm báo vẫn là của Messenger — tắt trong cài đặt Messenger nếu cần.
- Các nút trang trí (Lưu trữ, Xóa, Báo cáo spam, tab Quảng cáo…) không có tác dụng.

## Cấu trúc

Không cần build — nạp thẳng thư mục này vào Chrome là chạy.

| Đường dẫn | Vai trò |
|---|---|
| `manifest.json` | Khai báo tiện ích (Manifest V3), thứ tự nạp các module |
| `src/shared/defaults.js` | Cài đặt mặc định, dùng chung cho content script và popup |
| `src/content/core.js` | Trạng thái dùng chung (`GMS.state`, `GMS.settings`, …) |
| `src/content/icons.js` · `utils.js` · `fonts.js` | Icon/logo, hàm tiện ích (bỏ dấu, định dạng giờ), nhúng font |
| `src/content/parser.js` | Đọc danh sách đoạn chat từ DOM Messenger |
| `src/content/shell.js` | Dựng khung hộp thư, sự kiện, hiển thị danh sách |
| `src/content/thread.js` | Đặt vùng chat thật vào khung đọc thư, đổi bong bóng / ô soạn tin |
| `src/content/page.js` | Tiêu đề tab và favicon |
| `src/content/main.js` | Điểm vào: vòng lặp cập nhật, phím tắt, đồng bộ cài đặt |
| `src/styles/tokens.css` | Design token Material Design 3 (màu, hình dạng, đổ bóng, chuyển động, font) |
| `src/styles/page.css` | Cấp trang: chống nháy lúc khởi động, kích thước khung, phần tử host |
| `src/styles/shell.css` | Giao diện Gmail, nạp vào **Shadow DOM** nên CSS của Messenger không làm vỡ được |
| `src/styles/thread.css` | Đổi màu vùng chat thật của Messenger khi mở như một thư |
| `src/popup/` | Bảng cài đặt (Material 3, hỗ trợ chế độ tối) |
| `fonts/` | Roboto (Apache 2.0) và Be Vietnam Pro (SIL OFL 1.1) đóng gói kèm, có bộ ký tự tiếng Việt |

Các module content script dùng chung một namespace toàn cục `GMS` (không dùng ES module vì content script MV3 không hỗ trợ `import`).

## Đóng góp

Mã nguồn mở theo giấy phép MIT — xem `LICENSE`. Font và icon giữ giấy phép gốc của chúng
(`fonts/LICENSE-*.txt`; icon lấy từ Material Icons, Apache 2.0).

## Lưu ý về nhãn hiệu

Gmail và logo Gmail là nhãn hiệu của Google LLC. Dự án này không liên kết với, và không được Google hay Meta bảo trợ; chỉ là lớp giao diện chạy cục bộ trên máy người dùng.

