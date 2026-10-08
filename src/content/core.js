/*
 * Mail Skin cho Messenger — lõi dùng chung giữa các module content script.
 *
 * Nguyên tắc chống vỡ khi Meta đổi giao diện:
 *  - Không dựa vào class CSS bị làm rối của Messenger.
 *  - Danh sách thư được dựng lại từ các link đoạn chat (href chứa "/t/") — thứ ổn định nhất.
 *  - Khung đọc thư = chính vùng chat thật của Messenger (tìm qua ô soạn tin contenteditable),
 *    được đặt vào khung trắng kiểu Gmail và đổi màu.
 */
(() => {
  'use strict';
  if (window.top !== window) { GMS.disabled = true; return; }

  GMS.root = document.documentElement;
  GMS.settings = { ...GMS.DEFAULTS };
  GMS.stars = {}; // { [đường dẫn đoạn chat]: 1 }
  GMS.ui = { shell: null };
  GMS.state = {
    mode: 'list', // 'list' | 'thread'
    folder: 'inbox',
    query: '',
    threads: [],
    current: null,
    collapsedManual: false,
    lastHtml: '',
    checked: new Set(),
  };

  GMS.isMsgPage = () =>
    /(^|\.)messenger\.com$/.test(location.hostname) ||
    /^\/messages(\/|$)/.test(location.pathname);
  GMS.active = () => GMS.settings.enabled && GMS.isMsgPage();
})();
