/* Giao diện Outlook: khung HTML, danh sách thư mục, dòng thư. Dùng chung id/class "gms-*" với shell.js để tái dùng logic. */
(() => {
  if (GMS.disabled) return;
  const { ico, esc } = GMS;

  // Icon bổ sung (Material Icons, Apache 2.0)
  Object.assign(GMS.ICON_PATHS, {
    calendar: 'M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z',
    task: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
    reply: 'M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
    reply_all: 'M7 8V5l-7 7 7 7v-3l-4-4 4-4zm6 1V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z',
    forward: 'M12 8V4l8 8-8 8v-4H4V8z',
    flag: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6z',
    flag_o: 'M14.4 6L14 4H5v17h2v-7h5.6l.4 2h7V6h-5.6zM18 14h-4.6l-.4-2H7V6h5.6l.4 2H18v6z',
    folder: 'M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z',
    folder_o: 'M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z',
    filter: 'M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z',
    video: 'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
    chat: 'M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z',
    bell: 'M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z',
    sweep: 'M19.36 2.72l1.42 1.42-5.72 5.71c1.07 1.54 1.22 3.39.32 4.59L9.06 8.12c1.2-.9 3.05-.75 4.59.32l5.71-5.72zM5.93 10.5L4.5 9.08l-1.42 1.42 1.42 1.42-2.12 2.12 1.41 1.41 2.13-2.12 1.41 1.41 1.42-1.42-1.42-1.41 2.14-2.12-1.42-1.42z',
    close: 'M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z',
    pin: 'M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z',
    mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
    mail_o: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6h16l-8 5z',
  });

  const ib = (title, icon, { act, cls = '', disabled = false } = {}) =>
    `<button class="o-ib${cls ? ' ' + cls : ''}"${act ? ` data-act="${act}"` : ''} title="${title}" aria-label="${title}"${disabled ? ' disabled' : ''}>${ico(icon)}</button>`;

  // Nút lệnh trên ribbon (chỉ trang trí trừ khi có `act`).
  const cmd = (label, icon, { act, color = '', caret = false } = {}) =>
    `<button class="o-cmd${color ? ' ' + color : ''}"${act ? ` data-act="${act}"` : ' data-act="noop"'} title="${label}">${ico(icon)}<span>${label}</span>${caret ? ico('expand', 'o-caret') : ''}</button>`;

  const FOLDERS = [
    ['inbox', 'inbox', 'Hộp thư đến'],
    ['junk', 'report', 'Thư rác'],
    ['drafts', 'draft_o', 'Bản thảo'],
    ['sent', 'send_o', 'Mục đã gửi'],
    ['deleted', 'del', 'Mục đã xóa'],
    ['archive', 'archive', 'Lưu trữ'],
  ];
  const FAVORITES = [
    ['inbox', 'inbox', 'Hộp thư đến'],
    ['starred', 'flag_o', 'Đã gắn cờ'],
    ['sent', 'send_o', 'Mục đã gửi'],
  ];

  const folderHtml = ([key, icon, title], fav = false) =>
    `<a class="gms-folder" href="#" data-folder="${key}" title="${title}">${ico(icon)}<span class="gms-fname">${title}</span><span class="gms-count"${fav ? '' : ` data-count="${key}"`}></span></a>`;

  const html = () => `
<div class="o-top">
  <button class="o-ib o-waffle" data-act="menu" title="Menu chính" aria-label="Menu chính">${ico('apps')}</button>
  <a class="o-brand" href="#" data-act="home" title="Outlook">${GMS.OUTLOOK_LOGO}<span>Outlook</span></a>
  <div class="o-search">
    ${ico('search')}
    <input id="gms-q" type="text" placeholder="Tìm kiếm" aria-label="Tìm kiếm" autocomplete="off" spellcheck="false">
  </div>
  <div class="o-top-right">
    ${ib('Họp ngay', 'video')}
    ${ib('Teams', 'chat')}
    ${ib('Thông báo', 'bell')}
    ${ib('Cài đặt', 'settings')}
    ${ib('Trợ giúp', 'help')}
    <div class="gms-avatar" id="gms-avatar"></div>
  </div>
</div>

<div class="o-rail">
  <a class="o-rail-i on" href="#" data-act="home" title="Thư">${ico('mail')}</a>
  <a class="o-rail-i" href="#" data-act="noop" title="Lịch">${ico('calendar')}</a>
  <a class="o-rail-i" href="#" data-act="noop" title="Mọi người">${ico('social')}</a>
  <a class="o-rail-i" href="#" data-act="noop" title="To Do">${ico('task')}</a>
</div>

<div class="o-ribbon">
  <div class="o-rtabs"><span class="on">Trang chủ</span><span>Xem</span><span>Trợ giúp</span></div>
  <div class="o-cmds">
    <div class="o-new">
      <button class="o-new-main" data-act="compose" title="Thư mới">${ico('mail_o')}<span>Thư mới</span></button>
      <button class="o-new-drop" data-act="noop" title="Tùy chọn khác" aria-label="Tùy chọn khác">${ico('expand')}</button>
    </div>
    <span class="o-vsep"></span>
    ${cmd('Xóa', 'del')}
    ${cmd('Lưu trữ', 'archive')}
    ${cmd('Báo cáo', 'report', { caret: true })}
    ${cmd('Dọn dẹp', 'sweep')}
    ${cmd('Di chuyển đến', 'folder_o', { caret: true })}
    <span class="o-vsep"></span>
    ${cmd('Trả lời', 'reply', { color: 'blue' })}
    ${cmd('Trả lời tất cả', 'reply_all', { color: 'blue' })}
    ${cmd('Chuyển tiếp', 'forward', { color: 'blue' })}
    <span class="o-vsep"></span>
    ${cmd('Đọc/Chưa đọc', 'unread')}
    ${cmd('Gắn cờ', 'flag_o', { caret: true })}
    ${cmd('Ghim', 'pin')}
    ${ib('Thêm', 'more')}
  </div>
</div>

<div class="o-folders">
  <div class="o-fgroup"><span class="o-fhead">${ico('expand')}<b>Yêu thích</b></span></div>
  <nav>${FAVORITES.map((f) => folderHtml(f, true)).join('')}</nav>
  <div class="o-fgroup"><span class="o-fhead">${ico('expand')}<b>Thư mục</b></span></div>
  <nav>
    ${FOLDERS.map((f) => folderHtml(f)).join('')}
    <a class="gms-folder" href="#" data-act="noop" title="Ghi chú">${ico('folder_o')}<span class="gms-fname">Ghi chú</span></a>
  </nav>
  <div class="o-fgroup"><span class="o-fhead">${ico('right')}<b>Nhóm</b></span></div>
</div>

<div class="o-list">
  <div class="o-lhead">
    <span class="gms-cb gms-cb-all" data-act="checkall" title="Chọn tất cả"></span>
    <div class="o-ltabs"><span class="on">Ưu tiên</span><span>Khác</span></div>
    <div class="gms-spacer"></div>
    <button class="o-filter" data-act="refresh" title="Làm mới">${ico('refresh')}</button>
    <button class="o-filter" data-act="noop" title="Bộ lọc">${ico('filter')}<span>Bộ lọc</span></button>
    <span class="gms-range" id="gms-range"></span>
  </div>
  <div class="gms-scroll" id="gms-scroll">
    <div class="o-group">${ico('expand')}<span>Tất cả thư</span></div>
    <div id="gms-rows"></div>
  </div>
</div>

<div class="o-read">
  <div class="o-empty">
    ${ico('mail_o')}
    <h2>Chọn một mục để đọc</h2>
    <p>Không có mục nào được chọn</p>
  </div>
  <div class="o-subject">
    <span class="o-av" id="gms-sbj-av"></span>
    <div class="o-stext"><div class="o-stitle" id="gms-subject"></div><div class="o-ssub">Hộp thư đến</div></div>
    <span class="gms-range" id="gms-trange"></span>
    ${ib('Trả lời', 'reply')}${ib('Trả lời tất cả', 'reply_all')}${ib('Chuyển tiếp', 'forward')}${ib('Thêm', 'more')}
    ${ib('Đóng', 'close', { act: 'back' })}
  </div>
</div>`;

  // ---------- avatar chữ cái ----------
  const initials = (name) => {
    const w = (name || '').trim().split(/\s+/).filter(Boolean);
    if (!w.length) return '?';
    const first = [...w[0]][0];
    const last = w.length > 1 ? [...w[w.length - 1]][0] : '';
    return (first + last).toUpperCase();
  };
  const colorClass = (name) => {
    let h = 0;
    for (const c of name || '') h = (h * 31 + c.codePointAt(0)) >>> 0;
    return 'o-c' + (h % 10);
  };

  const row = (t, { starred, checked, current, sender, body }) =>
    `<div class="gms-row${t.unread ? ' is-unread' : ''}${checked ? ' is-checked' : ''}${current ? ' is-current' : ''}" data-path="${esc(t.path)}" role="button" tabindex="0">
<span class="o-av ${colorClass(t.name)}"><span class="o-av-t">${esc(initials(t.name))}</span><span class="gms-cb${checked ? ' on' : ''}" title="Chọn"></span></span>
<span class="o-rbody">
  <span class="o-r1"><span class="gms-sender">${esc(sender)}</span><span class="gms-date">${esc(t.date)}</span></span>
  <span class="o-r2"><span class="gms-subj">${esc(body)}</span></span>
</span>
<button class="gms-star o-flag${starred ? ' on' : ''}" data-star="${esc(t.path)}" title="${starred ? 'Bỏ cờ' : 'Gắn cờ'}" aria-label="${starred ? 'Bỏ cờ' : 'Gắn cờ'}">${ico(starred ? 'flag' : 'flag_o')}</button>
<span class="gms-acts">${ib('Xóa', 'del')}${ib('Lưu trữ', 'archive')}${ib('Ghim', 'pin')}</span>
</div>`;

  GMS.OUTLOOK = {
    html,
    row,
    initials,
    colorClass,
    empty: {
      inbox: 'Hộp thư đến của bạn trống.',
      starred: 'Không có thư nào được gắn cờ.',
      sent: 'Không có mục nào trong thư mục Mục đã gửi.',
      drafts: 'Không có bản thảo nào.',
      junk: 'Không có thư rác.',
      deleted: 'Thư mục Mục đã xóa trống.',
      archive: 'Không có thư nào được lưu trữ.',
    },
  };
})();
