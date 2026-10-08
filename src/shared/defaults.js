/* Giá trị mặc định và danh sách giao diện — dùng chung cho content script và popup. */
globalThis.GMS = globalThis.GMS || {};

GMS.DEFAULTS = Object.freeze({
  enabled: true,
  theme: 'gmail',
  titleTpl: 'Hộp thư đến ({n}) - Gmail',
  avatar: 'M',
  favicon: true,
  hideThreadHeader: true,
});

/*
 * Danh sách giao diện. `ready: false` = đang phát triển (hiện mờ trong popup, chưa chọn được).
 * Khi làm xong một giao diện mới: đổi `ready` thành true và nạp CSS/module tương ứng.
 */
GMS.THEMES = Object.freeze([
  { id: 'gmail', name: 'Gmail', desc: 'Hộp thư kiểu Gmail', ready: true },
  { id: 'outlook', name: 'Outlook', desc: 'Hộp thư kiểu Outlook', ready: false },
  { id: 'docs', name: 'Tài liệu', desc: 'Trình soạn thảo văn bản', ready: false },
  { id: 'sheets', name: 'Bảng tính', desc: 'Bảng tính nhiều cột', ready: false },
]);
