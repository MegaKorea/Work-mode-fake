/* Khung giao diện hộp thư: thanh trên, thanh bên, danh sách thư, thanh công cụ khung đọc. */
(() => {
  if (GMS.disabled) return;
  const { state, ui, root, ico, esc, fold, fmtN } = GMS;

  const FOLDERS = [
    ['inbox', 'inbox', 'Hộp thư đến'],
    ['starred', 'star_border', 'Có gắn dấu sao'],
    ['snoozed', 'clock', 'Đã tạm ẩn'],
    ['sent', 'send_o', 'Đã gửi'],
    ['drafts', 'draft_o', 'Thư nháp'],
    ['purchases', 'bag', 'Giao dịch mua'],
  ];

  const EMPTY = {
    inbox: 'Hộp thư đến của bạn trống.',
    starred: 'Không có thư nào được gắn dấu sao. Gắn dấu sao cho thư để dễ dàng tìm lại về sau.',
    snoozed: 'Không có cuộc hội thoại nào bị tạm ẩn.',
    sent: 'Không có thư nào đã gửi! Gửi một thư ngay bây giờ!',
    drafts: 'Bạn không có thư nháp nào đã lưu.',
    purchases: 'Không có thư nào trong mục Giao dịch mua.',
    promotions: 'Không có thư nào trong mục Quảng cáo.',
    social: 'Không có thư nào trong mục Mạng xã hội.',
    updates: 'Không có thư nào trong mục Nội dung cập nhật.',
  };

  const SENT_RE = /^(Bạn|You)(\s*:\s*|\s+đã\s+gửi\s+|\s+sent\s+)/i;

  // Nút icon tròn: ib('Tiêu đề', 'icon', { act, sm, cls, disabled })
  const ib = (title, icon, { act, sm = true, cls = '', disabled = false } = {}) =>
    `<button class="gms-ib${sm ? ' sm' : ''}${cls ? ' ' + cls : ''}"${act ? ` data-act="${act}"` : ''} title="${title}" aria-label="${title}"${disabled ? ' disabled' : ''}>${ico(icon)}</button>`;

  const folderHtml = ([key, icon, title]) =>
    `<a class="gms-folder" href="#" data-folder="${key}" title="${title}">${ico(icon)}<span class="gms-fname">${title}</span><span class="gms-count" data-count="${key}"></span></a>`;

  const SHELL_HTML = `
<div class="gms-top">
  <div class="gms-top-left">
    ${ib('Menu chính', 'menu', { act: 'menu', sm: false })}
    <a class="gms-logo" href="#" data-act="home" title="Gmail">${GMS.LOGO}<span>Gmail</span></a>
  </div>
  <div class="gms-search">
    ${ib('Tìm kiếm', 'search', { sm: false })}
    <input id="gms-q" type="text" placeholder="Tìm kiếm trong thư" aria-label="Tìm kiếm trong thư" autocomplete="off" spellcheck="false">
    ${ib('Hiển thị tùy chọn tìm kiếm', 'tune', { sm: false })}
  </div>
  <div class="gms-top-right">
    ${ib('Hỗ trợ', 'help', { sm: false })}
    ${ib('Cài đặt', 'settings', { sm: false })}
    <button class="gms-ib" title="Gemini" aria-label="Gemini">${GMS.SPARKLE}</button>
    <button class="gms-upgrade" title="Nâng cấp bộ nhớ">Nâng cấp bộ nhớ</button>
    ${ib('Ứng dụng của Google', 'apps', { sm: false })}
    <div class="gms-avatar" id="gms-avatar"></div>
  </div>
</div>
<div class="gms-side">
  <button class="gms-compose" data-act="compose" title="Soạn thư">${ico('edit')}<span>Soạn thư</span></button>
  <nav class="gms-folders">
    ${FOLDERS.map(folderHtml).join('')}
    <a class="gms-folder" href="#" data-act="noop" title="Hiện thêm">${ico('expand')}<span class="gms-fname">Hiện thêm</span></a>
  </nav>
  <div class="gms-labels-h"><span>Nhãn</span>${ib('Tạo nhãn mới', 'add')}</div>
</div>
<div class="gms-gutter-r"></div><div class="gms-gutter-b"></div>
<div class="gms-card">
  <div class="gms-listview">
    <div class="gms-toolbar">
      <span class="gms-cb gms-cb-all" data-act="checkall" title="Chọn"></span>
      ${ib('Chọn', 'drop', { cls: 'gms-caret' })}
      ${ib('Làm mới', 'refresh', { act: 'refresh', cls: 'gms-first' })}
      ${ib('Thêm', 'more')}
      <div class="gms-spacer"></div>
      <span class="gms-range" id="gms-range"></span>
      ${ib('Mới hơn', 'left', { disabled: true })}
      ${ib('Cũ hơn', 'right', { act: 'older' })}
      <button class="gms-ib sm gms-input-tools" title="Công cụ nhập" aria-label="Công cụ nhập"><span>ê</span>${ico('drop')}</button>
    </div>
    <div class="gms-tabs">
      <div class="gms-tab on" data-tab="primary">
        ${ico('inbox')}
        <div class="gms-tab-content">
          <div class="gms-tab-top">
            <span class="gms-tab-title">Chính</span>
          </div>
        </div>
      </div>
      <div class="gms-tab" data-tab="promotions">
        ${ico('promo')}
        <div class="gms-tab-content">
          <div class="gms-tab-top">
            <span class="gms-tab-title">Quảng cáo</span>
            <span class="gms-tab-badge green">50 cuộc trò chuyện mới</span>
          </div>
          <div class="gms-tab-snippet">F2C Labs — Code thuê, thiết kế website...</div>
        </div>
      </div>
      <div class="gms-tab" data-tab="social">
        ${ico('social')}
        <div class="gms-tab-content">
          <div class="gms-tab-top">
            <span class="gms-tab-title">Mạng xã hội</span>
            <span class="gms-tab-badge blue">50 cuộc trò chuyện mới</span>
          </div>
          <div class="gms-tab-snippet">F2C Labs — Dịch vụ thiết kế website...</div>
        </div>
      </div>
      <div class="gms-tab" data-tab="updates">
        ${ico('info')}
        <div class="gms-tab-content">
          <div class="gms-tab-top">
            <span class="gms-tab-title">Nội dung cập nhật</span>
            <span class="gms-tab-badge orange">50 cuộc trò chuyện mới</span>
          </div>
          <div class="gms-tab-snippet">F2C Labs — Tối ưu hệ thống hạ tầng cho doanh nghiệp...</div>
        </div>
      </div>
    </div>
    <div class="gms-scroll" id="gms-scroll">
      <div id="gms-rows"></div>
      <div class="gms-foot">
        <span>Đã dùng 2,31 GB (15%) trong tổng số 15 GB</span>
        <span>Điều khoản · Quyền riêng tư · Chính sách chương trình</span>
        <span>Hoạt động gần đây nhất trên tài khoản: 0 phút trước<br>Chi tiết</span>
      </div>
    </div>
  </div>
  <div class="gms-threadview">
    <div class="gms-toolbar">
      ${ib('Quay lại Hộp thư đến', 'back', { act: 'back' })}
      ${ib('Lưu trữ', 'archive', { act: 'archive' })}
      ${ib('Báo cáo spam', 'report', { act: 'report' })}
      ${ib('Xóa', 'del', { act: 'del' })}
      <span class="gms-sep"></span>
      ${ib('Đánh dấu là chưa đọc', 'unread', { act: 'unread' })}
      ${ib('Tạm ẩn', 'clock', { act: 'snooze' })}
      ${ib('Thêm', 'more')}
      <div class="gms-spacer"></div>
      <span class="gms-range" id="gms-trange"></span>
      ${ib('Mới hơn', 'left', { act: 'prev' })}
      ${ib('Cũ hơn', 'right', { act: 'next' })}
    </div>
    <div class="gms-subjectbar">
      <div class="gms-h2" id="gms-subject"></div>
      <span class="gms-chip">Hộp thư đến<i>×</i></span>
      <div class="gms-spacer"></div>
      ${ib('In tất cả', 'print', { act: 'print' })}
      ${ib('Trong cửa sổ mới', 'open', { act: 'open' })}
    </div>
    <div class="gms-gemini-bar">
      <button class="gms-gemini-summary-btn" data-act="summarize" title="Tóm tắt email này">
        ${GMS.SPARKLE}
        <span>Tóm tắt email này</span>
      </button>
    </div>
    <div class="gms-thread-scroll" id="gms-thread-scroll">
      <div class="gms-thread-rows" id="gms-thread-rows"></div>
      <div class="gms-quick-actions">
        <button class="gms-quick-pill" data-act="reply">${ico('reply')}<span>Trả lời</span></button>
        <button class="gms-quick-pill" data-act="forward">${ico('forward')}<span>Chuyển tiếp</span></button>
        <button class="gms-quick-pill gms-quick-emoji" data-act="emoji" title="Thêm biểu tượng cảm xúc">${ico('mood')}</button>
      </div>
      <div class="gms-reply-dock" id="gms-reply-dock">
        <div class="gms-reply-head">${ico('reply')}<span id="gms-reply-title">Trả lời</span></div>
        <div class="gms-reply-previews" id="gms-reply-previews"></div>
        <textarea id="gms-reply-input" class="gms-reply-input" placeholder="Soạn thư trả lời..." rows="2"></textarea>
        <div class="gms-reply-foot">
          <button id="gms-send-btn" class="gms-send-btn" type="button" data-act="send">Gửi</button>
          <button class="gms-tool-btn" data-act="format" title="Tùy chọn định dạng">${ico('format_color_text')}</button>
          <button class="gms-tool-btn" data-tool="attach" title="Đính kèm tệp">${ico('attach_file')}</button>
          <button class="gms-tool-btn" data-tool="photo" title="Chèn ảnh">${ico('insert_photo')}</button>
          <button class="gms-tool-btn" data-tool="link" title="Chèn liên kết">${ico('insert_link')}</button>
          <button class="gms-tool-btn" data-act="toggle-emoji" title="Chèn biểu tượng cảm xúc">${ico('mood')}</button>
          <div class="gms-spacer"></div>
          <button class="gms-tool-btn" data-act="discard" title="Xóa thư nháp">${ico('del')}</button>
          <button class="gms-tool-btn" title="Tùy chọn khác">${ico('more_vert')}</button>
        </div>
        <input type="file" id="gms-file-input" style="display: none;" multiple accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip">
      </div>
      <div class="gms-emoji-picker" id="gms-emoji-picker">
        <div class="gms-emoji-head">
          <input type="text" id="gms-emoji-search" class="gms-emoji-search" placeholder="Tìm biểu tượng..." autocomplete="off">
        </div>
        <div class="gms-emoji-grid" id="gms-emoji-grid"></div>
      </div>
      <div class="gms-dropzone" id="gms-dropzone">
        <div class="gms-dropzone-box">
          <div class="gms-dropzone-icon">${ico('insert_photo')}</div>
          <div class="gms-dropzone-text">Thả hình ảnh hoặc tệp vào đây để gửi</div>
        </div>
      </div>
    </div>
  </div>
</div>
<div class="gms-workspace-rail">
  ${ib('Lịch', 'calendar', { sm: true })}
  ${ib('Keep', 'keep', { sm: true })}
  ${ib('Tasks', 'tasks', { sm: true })}
  ${ib('Danh bạ', 'contacts', { sm: true })}
  <span class="gms-rail-sep"></span>
  ${ib('Tải tiện ích bổ sung', 'add', { sm: true })}
</div>
<div class="gms-toast" id="gms-toast">
  <span>Đã gửi thư</span>
  <button class="gms-toast-close" data-act="closetoast" title="Đóng">${ico('close')}</button>
</div>`;

  const q = (sel) => ui.shell.querySelector(sel);

  const EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '😉', '😍', '🥰', '😘', '😋', '😜', '🤪', '😎', '🥳',
    '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖', '😫',
    '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳',
    '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤔', '🤭', '🤫',
    '😴', '🤤', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠',
    '😈', '👿', '👻', '💀', '👽', '🤖', '💩', '🤡',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '💪', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '💖',
    '💗', '💓', '💞', '💕', '💌', '💘', '💝', '🔥', '✨', '🌟',
    '💯', '🎉', '🎊', '🐱', '🐶', '🐰', '🦊', '🐻', '🐼', '🌸',
    '🌹', '🌻', '🍀', '🍎', '🍓', '🍕', '🍔', '🍟', '🍦', '☕',
    '🧋', '🍺', '🍻', '🥂', '🚀', '⭐', '⚡'
  ];

  function autoGrow(el) {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = Math.min(Math.max(el.scrollHeight, 48), 220) + 'px';
  }

  function renderEmojiGrid(filter = '') {
    const grid = q('#gms-emoji-grid');
    if (!grid) return;
    const qStr = filter.trim().toLowerCase();
    const list = qStr ? EMOJIS.filter((em) => em.includes(qStr)) : EMOJIS;
    grid.innerHTML = list.map((em) => `<button type="button" class="gms-emoji-btn" data-emoji="${em}" title="${em}">${em}</button>`).join('');
  }

  function toggleEmojiPicker() {
    const picker = q('#gms-emoji-picker');
    if (!picker) return;
    if (picker.classList.contains('on')) {
      picker.classList.remove('on');
      return;
    }
    renderEmojiGrid();
    picker.classList.add('on');
    const searchIn = q('#gms-emoji-search');
    if (searchIn) {
      searchIn.value = '';
      setTimeout(() => searchIn.focus(), 50);
    }
  }

  function closeEmojiPicker() {
    const picker = q('#gms-emoji-picker');
    if (picker) picker.classList.remove('on');
  }

  function insertEmoji(emoji) {
    const input = q('#gms-reply-input');
    if (!input) return;
    state.replyOpen = true;
    const dock = q('#gms-reply-dock');
    const quick = q('#gms-quick-actions');
    if (dock) dock.style.display = 'flex';
    if (quick) quick.style.display = 'none';

    const start = input.selectionStart || input.value.length;
    const end = input.selectionEnd || input.value.length;
    const val = input.value;
    input.value = val.slice(0, start) + emoji + val.slice(end);
    input.focus();
    const nextPos = start + emoji.length;
    input.setSelectionRange(nextPos, nextPos);
    autoGrow(input);
  }

  function forwardFilesToFacebook(files) {
    if (!files || !files.length) return false;

    const dt = new DataTransfer();
    for (const f of files) {
      dt.items.add(f);
    }

    // 1. Primary method: Inject into native file input with React descriptor bypass
    const fileInputs = Array.from(document.querySelectorAll('input[type="file"]'))
      .filter((inp) => !(ui.shell && ui.shell.contains(inp)));

    if (fileInputs.length) {
      for (const input of fileInputs) {
        try {
          const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'files');
          if (descriptor && descriptor.set) {
            descriptor.set.call(input, dt.files);
          } else {
            input.files = dt.files;
          }
          input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
          input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
          return true;
        } catch (e) {
          console.warn('Set files on input failed:', e);
        }
      }
    }

    // 2. Fallback: Dispatch synthetic paste event on textbox only if no file input was found
    const realTb = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('[role="main"] [contenteditable="true"]') ||
                   document.querySelector('[contenteditable="true"]');
    if (realTb && !(ui.shell && ui.shell.contains(realTb))) {
      try {
        realTb.focus();
        const pasteEv = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          composed: true
        });
        Object.defineProperty(pasteEv, 'clipboardData', {
          value: dt,
          writable: false,
          enumerable: true
        });
        realTb.dispatchEvent(pasteEv);
        return true;
      } catch (e) {
        console.warn('Dispatch paste failed:', e);
      }
    }

    return false;
  }

  function handleFiles(files) {
    if (!files || !files.length) return;
    state.pendingFiles = state.pendingFiles || [];

    state.replyOpen = true;
    const dock = q('#gms-reply-dock');
    const quick = q('#gms-quick-actions');
    if (dock) dock.style.display = 'flex';
    if (quick) quick.style.display = 'none';

    for (const f of files) {
      state.pendingFiles.push(f);
    }
    renderPendingPreviews();

    const input = q('#gms-reply-input');
    if (input) input.focus();
  }

  function removePendingFile(idx) {
    if (!state.pendingFiles) return;
    state.pendingFiles.splice(idx, 1);
    renderPendingPreviews();

    // Attempt to remove corresponding attachment from Facebook composer if buttons exist
    const removeBtns = Array.from(document.querySelectorAll(
      '[role="main"] [aria-label*="Xóa" i], [role="main"] [aria-label*="Remove" i], [role="main"] [aria-label*="Gỡ" i], [role="main"] [aria-label*="Delete" i]'
    )).filter((btn) => !(ui.shell && ui.shell.contains(btn)));

    if (removeBtns.length) {
      try {
        const targetBtn = (idx < removeBtns.length ? removeBtns[idx] : removeBtns[removeBtns.length - 1]);
        if (targetBtn) targetBtn.click();
      } catch (e) {}
    }
  }

  function renderPendingPreviews() {
    const container = q('#gms-reply-previews');
    if (!container) return;
    const files = state.pendingFiles || [];
    if (!files.length) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }
    container.style.display = 'flex';
    container.innerHTML = files.map((f, i) => {
      const isImg = f.type && f.type.startsWith('image/');
      const url = isImg ? URL.createObjectURL(f) : '';
      const sizeStr = f.size > 1024 * 1024 ? (f.size / (1024 * 1024)).toFixed(1) + ' MB' : Math.round(f.size / 1024) + ' KB';
      return `
        <div class="gms-preview-item" data-idx="${i}">
          ${isImg ? `<img src="${url}" class="gms-preview-thumb" alt="${esc(f.name)}">` : `<div class="gms-preview-file-icon">${ico('attach_file')}</div>`}
          <div class="gms-preview-info">
            <span class="gms-preview-name">${esc(f.name)}</span>
            <span class="gms-preview-size">${sizeStr}</span>
          </div>
          <button class="gms-preview-remove" data-act="remove-file" data-idx="${i}" title="Xóa tệp">${ico('close')}</button>
        </div>
      `;
    }).join('');
  }

  function triggerFacebookSend() {
    const realTb = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                   document.querySelector('[role="main"] [contenteditable="true"]') ||
                   document.querySelector('[contenteditable="true"]');

    let sent = false;
    const sendButtons = Array.from(document.querySelectorAll(
      '[role="main"] [aria-label="Nhấn Enter để gửi" i], [role="main"] [aria-label="Press Enter to send" i], [role="main"] [aria-label="Gửi" i], [role="main"] [aria-label="Send" i], [data-testid="send_button"]'
    )).filter((btn) => !(ui.shell && ui.shell.contains(btn)));

    if (sendButtons.length) {
      try {
        sendButtons[0].click();
        sent = true;
      } catch (e) {}
    }

    if (!sent && realTb && !(ui.shell && ui.shell.contains(realTb))) {
      realTb.focus();
      const enterEv = {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true,
        composed: true
      };
      realTb.dispatchEvent(new KeyboardEvent('keydown', enterEv));
      realTb.dispatchEvent(new KeyboardEvent('keypress', enterEv));
      realTb.dispatchEvent(new KeyboardEvent('keyup', enterEv));
    }

    return true;
  }

  function sendProxyMessage() {
    if (state.isSending) return;
    const input = q('#gms-reply-input');
    if (!input) return;
    const text = input.value.trim();
    const files = state.pendingFiles ? [...state.pendingFiles] : [];
    if (!text && !files.length) return;

    state.isSending = true;
    setTimeout(() => { state.isSending = false; }, 350);

    state.autoScrollToBottom = true;

    // 1. Optimistic UI update (Instant rendering, 0ms latency)
    if (state.current?.path) {
      state.pendingOptimistic = state.pendingOptimistic || new Map();
      const threadKey = state.current.path;
      const pendingList = state.pendingOptimistic.get(threadKey) || [];

      const myAv = GMS.getMyAvatarUrl ? GMS.getMyAvatarUrl() : '';
      const myInitial = GMS.settings.avatar && GMS.settings.avatar !== 'M'
        ? (GMS.getInitialLetter ? GMS.getInitialLetter(GMS.settings.avatar) : 'T')
        : 'T';

      const optMsg = {
        id: 'opt-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
        isOut: true,
        sender: 'Tôi',
        to: state.current?.name || 'Người nhận',
        initial: myInitial,
        avatarUrl: myAv,
        color: '#0b57d0',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        texts: text ? [text] : [],
        media: files.filter((f) => f.type && f.type.startsWith('image/')).map((f) => URL.createObjectURL(f)),
        reels: [],
        audios: [],
        isOptimistic: true,
        createdAt: Date.now()
      };

      pendingList.push(optMsg);
      state.pendingOptimistic.set(threadKey, pendingList);

      // Render immediately
      GMS.renderThread();
    }

    // 2. Clear input & previews immediately
    input.value = '';
    input.style.height = '48px';
    state.pendingFiles = [];
    renderPendingPreviews();
    state.replyOpen = false;
    const dock = q('#gms-reply-dock');
    const quick = q('#gms-quick-actions');
    if (dock) dock.style.display = 'none';
    if (quick) quick.style.display = 'flex';
    closeEmojiPicker();
    GMS.showToast(files.length && !text ? 'Đã gửi tệp đính kèm' : 'Đã gửi thư');

    // 3. Forward files to Facebook in background
    if (files.length) {
      forwardFilesToFacebook(files);
    }

    // 4. Forward text to Facebook textbox
    if (text) {
      const realTb = document.querySelector('[contenteditable="true"][role="textbox"]') ||
                     document.querySelector('[role="main"] [contenteditable="true"]') ||
                     document.querySelector('[contenteditable="true"]');
      if (realTb && !(ui.shell && ui.shell.contains(realTb))) {
        realTb.focus();
        try {
          // Select all existing text in Facebook's editor and clear it
          const sel = window.getSelection();
          sel.removeAllRanges();
          const range = document.createRange();
          range.selectNodeContents(realTb);
          sel.addRange(range);
          document.execCommand('selectAll', false, null);
          document.execCommand('delete', false, null);

          // Insert text cleanly once (execCommand natively dispatches input events in browser)
          document.execCommand('insertText', false, text);
        } catch (err) {
          console.error('Error inserting text to real textbox:', err);
        }
      }
    }

    // 5. Trigger send once with appropriate delay (350ms for file staging, 70ms for text)
    const sendDelay = files.length ? 350 : 70;
    setTimeout(() => {
      triggerFacebookSend();
    }, sendDelay);
  }

  // Khung nằm trong Shadow DOM: CSS của Messenger không thể ảnh hưởng, và ngược lại.
  function buildShell() {
    ui.host = document.createElement('div');
    ui.host.id = 'gms-shell';
    const sr = ui.host.attachShadow({ mode: 'open' });
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    const outlook = GMS.theme() === 'outlook';
    css.href = chrome.runtime.getURL(outlook ? 'src/styles/outlook.css' : 'src/styles/shell.css');
    css.addEventListener('load', () => ui.host.classList.add('gms-ready'));
    const el = document.createElement('div');
    el.className = 'gms-app';
    el.innerHTML = outlook ? GMS.OUTLOOK.html() : SHELL_HTML;
    sr.append(css, el);

    // Chặn rò rỉ tất cả sự kiện gõ phím / IME / clipboard từ Shadow DOM ra ngoài trang Facebook
    ['keydown', 'keypress', 'keyup', 'input', 'beforeinput', 'compositionstart', 'compositionupdate', 'compositionend', 'paste', 'cut', 'copy'].forEach((evName) => {
      el.addEventListener(evName, (e) => {
        // Cho phép phím tắt Alt+Shift+G và phím điều hướng cấp trang hoạt động bình thường
        if (e.altKey && e.shiftKey && (e.key === 'G' || e.key === 'g' || e.code === 'KeyG')) return;
        e.stopPropagation();
      });
    });

    el.addEventListener('click', onShellClick);
    el.addEventListener('keydown', onShellKey);

    const input = el.querySelector('#gms-reply-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.isComposing || e.keyCode === 229) return;
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendProxyMessage();
        }
      });
      input.addEventListener('input', () => autoGrow(input));
      input.addEventListener('paste', (e) => {
        if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
          e.preventDefault();
          handleFiles(e.clipboardData.files);
        }
      });
    }

    const fileIn = el.querySelector('#gms-file-input');
    if (fileIn) {
      fileIn.addEventListener('change', (e) => {
        if (e.target.files && e.target.files.length) {
          handleFiles(e.target.files);
          e.target.value = '';
        }
      });
    }

    const emojiSearch = el.querySelector('#gms-emoji-search');
    if (emojiSearch) {
      emojiSearch.addEventListener('input', (e) => {
        renderEmojiGrid(e.target.value);
      });
    }

    // Drag & drop files onto shell
    const dropzone = el.querySelector('#gms-dropzone');
    let dragCounter = 0;
    el.addEventListener('dragenter', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
        dragCounter++;
        if (dropzone) dropzone.classList.add('on');
      }
    });

    el.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    });

    ['dragleave', 'dragend'].forEach((evName) => {
      el.addEventListener(evName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter <= 0) {
          dragCounter = 0;
          if (dropzone) dropzone.classList.remove('on');
        }
      });
    });

    el.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter = 0;
      if (dropzone) dropzone.classList.remove('on');
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        handleFiles(e.dataTransfer.files);
      }
    });

    el.addEventListener('paste', (e) => {
      if (e.clipboardData && e.clipboardData.files && e.clipboardData.files.length) {
        e.preventDefault();
        handleFiles(e.clipboardData.files);
      }
    });

    el.querySelector('#gms-q').addEventListener('input', (e) => {
      state.query = e.target.value;
      if (state.mode !== 'list') GMS.setMode('list');
      GMS.render(true);
    });
    el.querySelector('#gms-scroll').addEventListener('scroll', (e) => {
      const s = e.currentTarget;
      if (s.scrollTop + s.clientHeight > s.scrollHeight - 120) GMS.loadMore();
    }, { passive: true });
    const threadScroll = el.querySelector('#gms-thread-scroll');
    if (threadScroll) {
      threadScroll.addEventListener('scroll', (e) => {
        const s = e.currentTarget;
        if (s.scrollTop < 60) {
          GMS.loadOlderThreadMessages();
        }
      }, { passive: true });
    }
    return el;
  }

  GMS.ensureShell = () => {
    if (!document.body) return false;
    if (ui.shell && ui.shellTheme !== GMS.theme()) {
      ui.host.remove();
      ui.shell = null;
      state.lastHtml = '';
    }
    if (!ui.shell) { ui.shell = buildShell(); ui.shellTheme = GMS.theme(); }
    if (!ui.host.isConnected) document.body.appendChild(ui.host);
    const av = q('#gms-avatar');
    const myAv = GMS.getMyAvatarUrl ? GMS.getMyAvatarUrl() : '';
    const myLetter = GMS.settings.avatar && GMS.settings.avatar !== 'M'
      ? (GMS.getInitialLetter ? GMS.getInitialLetter(GMS.settings.avatar) : GMS.settings.avatar.charAt(0).toUpperCase())
      : 'T';
    if (av) {
      if (myAv) {
        if (!av.querySelector('img') || av.querySelector('img').src !== myAv) {
          av.innerHTML = `<img src="${esc(myAv)}" class="gms-avatar-img" alt="Tài khoản Google">`;
        }
      } else if (av.textContent !== myLetter) {
        av.textContent = myLetter;
      }
    }
    return true;
  };

  // ---------- sự kiện ----------
  function toggleStar(path) {
    if (GMS.stars[path]) delete GMS.stars[path]; else GMS.stars[path] = 1;
    chrome.storage.local.set({ gmsStars: GMS.stars });
    GMS.render(true);
  }

  function toggleChecked(path) {
    state.checked.has(path) ? state.checked.delete(path) : state.checked.add(path);
    GMS.render(true);
  }

  function stepThread(dir) {
    const list = visibleThreads();
    const i = list.findIndex((t) => state.current && t.path === state.current.path);
    if (i >= 0 && list[i + dir]) openThread(list[i + dir].path);
  }

  const ACTIONS = {
    home() {
      state.folder = 'inbox';
      state.query = '';
      q('#gms-q').value = '';
      GMS.setMode('list');
      GMS.render(true);
    },
    menu() { state.collapsedManual = !state.collapsedManual; GMS.applyClasses(); },
    back() { GMS.setMode('list'); },
    refresh() { GMS.scan(); GMS.render(true); q('#gms-scroll').scrollTop = 0; },
    older() { GMS.loadMore(); },
    compose() { compose(); },
    checkall() {
      if (state.checked.size) state.checked.clear();
      else visibleThreads().forEach((t) => state.checked.add(t.path));
      GMS.render(true);
    },
    prev() { stepThread(-1); },
    next() { stepThread(1); },
    closetoast() { q('#gms-toast')?.classList.remove('on'); },
    summarize() {
      GMS.showToast('Gemini: Đang tóm tắt cuộc trò chuyện...');
    },
    archive() {
      GMS.showToast('Đã lưu trữ cuộc trò chuyện.');
      GMS.setMode('list');
    },
    report() {
      GMS.showToast('Đã báo cáo spam.');
      GMS.setMode('list');
    },
    del() {
      GMS.showToast('Đã chuyển cuộc trò chuyện vào thùng rác.');
      GMS.setMode('list');
    },
    unread() {
      if (state.current?.path) {
        const t = state.threads.find((x) => x.path === state.current.path);
        if (t) t.unread = true;
      }
      GMS.showToast('Đã đánh dấu là chưa đọc.');
      GMS.setMode('list');
      GMS.render(true);
    },
    snooze() {
      GMS.showToast('Đã tạm ẩn cuộc trò chuyện đến 08:00 sáng mai.');
      GMS.setMode('list');
    },
    print() {
      window.print();
    },
    open() {
      if (state.current?.path) {
        window.open(location.origin + state.current.path, '_blank');
      } else {
        window.open(location.href, '_blank');
      }
    },
    reply() {
      state.replyOpen = true;
      const dock = q('#gms-reply-dock');
      const quick = q('#gms-quick-actions');
      if (dock) dock.style.display = 'flex';
      if (quick) quick.style.display = 'none';
      const input = q('#gms-reply-input');
      const scrollArea = q('#gms-thread-scroll');
      if (input) {
        input.focus();
      }
      if (scrollArea) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
        requestAnimationFrame(() => {
          if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        });
        setTimeout(() => {
          if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
        }, 50);
        setTimeout(() => {
          if (scrollArea) scrollArea.scrollTo({ top: scrollArea.scrollHeight, behavior: 'smooth' });
        }, 120);
      }
    },
    forward() {
      GMS.showToast('Chức năng chuyển tiếp: Chọn người nhận');
    },
    emoji() {
      toggleEmojiPicker();
    },
    'toggle-emoji'() {
      toggleEmojiPicker();
    },
    format() {
      const input = q('#gms-reply-input');
      if (input) {
        input.focus();
        GMS.showToast('Gợi ý định dạng: *in đậm*, _in nghiêng_, ~gạch ngang~');
      }
    },
    send() {
      sendProxyMessage();
    },
    discard() {
      const input = q('#gms-reply-input');
      if (input) {
        input.value = '';
        input.style.height = '48px';
      }
      state.pendingFiles = [];
      renderPendingPreviews();
      state.replyOpen = false;
      const dock = q('#gms-reply-dock');
      const quick = q('#gms-quick-actions');
      if (dock) dock.style.display = 'none';
      if (quick) quick.style.display = 'flex';
      closeEmojiPicker();
      GMS.showToast('Đã xóa thư nháp');
    },
  };

  GMS.showToast = (msg = 'Đã gửi thư') => {
    if (!ui.shell) return;
    const t = q('#gms-toast');
    if (!t) return;
    t.querySelector('span').textContent = msg;
    t.classList.add('on');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('on'), 4000);
  };

  function toSlugEmail(name) {
    if (!name) return 'user@gmail.com';
    const clean = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    return (clean || 'user') + '@gmail.com';
  }

  function formatGmailQuoteDate(timeStr) {
    const now = new Date();
    const days = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const dayName = days[now.getDay()];
    const day = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    
    let time = timeStr;
    const matchTime = (timeStr || '').match(/\d{1,2}:\d{2}/);
    if (matchTime) {
      time = matchTime[0];
    } else {
      time = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    }

    return `${dayName}, ${day} thg ${month}, ${year} vào lúc ${time}`;
  }

  let gmsAudioInstance = null;
  let gmsActiveMid = null;
  let gmsActiveAidx = null;
  let gmsActiveSpeed = 1;

  function stopCurrentAudio() {
    if (gmsAudioInstance) {
      try {
        gmsAudioInstance.pause();
        gmsAudioInstance.currentTime = 0;
      } catch {}
      gmsAudioInstance = null;
    }
    if (gmsActiveMid !== null) {
      const prevPlayBtn = q(`.gms-audio-play[data-mid="${gmsActiveMid}"][data-aidx="${gmsActiveAidx}"]`);
      if (prevPlayBtn) prevPlayBtn.innerHTML = ico('play_arrow');
      const prog = q(`#gms-aprog-${gmsActiveMid}-${gmsActiveAidx}`);
      if (prog) prog.style.width = '0%';
    }
    gmsActiveMid = null;
    gmsActiveAidx = null;
  }

  function handlePlayAudio(btn, src, mid, aidx) {
    if (gmsAudioInstance && gmsActiveMid === mid && gmsActiveAidx === aidx) {
      if (gmsAudioInstance.paused) {
        gmsAudioInstance.play();
        btn.innerHTML = ico('pause');
      } else {
        gmsAudioInstance.pause();
        btn.innerHTML = ico('play_arrow');
      }
      return;
    }

    stopCurrentAudio();

    if (!src) {
      // Fallback: Click native Facebook play button in DOM corresponding to message index
      const main = GMS.applyMain();
      if (main) {
        const nativePlayBtns = Array.from(main.querySelectorAll('[aria-label*="Phát" i], [aria-label*="Play" i], [aria-label*="Tạm dừng" i], [aria-label*="Pause" i]'))
          .filter((b) => !(ui.shell && ui.shell.contains(b)));
        const numIdx = parseInt(aidx, 10);
        const targetBtn = (!isNaN(numIdx) && nativePlayBtns[numIdx]) || nativePlayBtns[0];
        if (targetBtn) targetBtn.click();
      }
      btn.innerHTML = ico('pause');
      setTimeout(() => { btn.innerHTML = ico('play_arrow'); }, 3000);
      return;
    }

    gmsActiveMid = mid;
    gmsActiveAidx = aidx;
    gmsAudioInstance = new Audio(src);
    gmsAudioInstance.playbackRate = gmsActiveSpeed;

    btn.innerHTML = ico('pause');

    const prog = q(`#gms-aprog-${mid}-${aidx}`);
    const timeLabel = q(`#gms-atime-${mid}-${aidx}`);

    gmsAudioInstance.addEventListener('timeupdate', () => {
      if (!gmsAudioInstance || !gmsAudioInstance.duration) return;
      const pct = (gmsAudioInstance.currentTime / gmsAudioInstance.duration) * 100;
      if (prog) prog.style.width = `${pct}%`;
      if (timeLabel) {
        const curM = Math.floor(gmsAudioInstance.currentTime / 60);
        const curS = Math.floor(gmsAudioInstance.currentTime % 60);
        const durM = Math.floor(gmsAudioInstance.duration / 60);
        const durS = Math.floor(gmsAudioInstance.duration % 60);
        timeLabel.textContent = `${curM}:${curS < 10 ? '0' : ''}${curS} / ${durM}:${durS < 10 ? '0' : ''}${durS}`;
      }
    });

    gmsAudioInstance.addEventListener('ended', () => {
      btn.innerHTML = ico('play_arrow');
      if (prog) prog.style.width = '0%';
      stopCurrentAudio();
    });

    gmsAudioInstance.addEventListener('error', () => {
      btn.innerHTML = ico('play_arrow');
      GMS.showToast('Không thể phát tệp âm thanh này.');
      stopCurrentAudio();
    });

    gmsAudioInstance.play().catch((err) => {
      console.warn('Audio play failed:', err);
      btn.innerHTML = ico('play_arrow');
    });
  }

  function handleSeekAudio(track, e, mid, aidx) {
    if (!gmsAudioInstance || gmsActiveMid !== mid || gmsActiveAidx !== aidx || !gmsAudioInstance.duration) return;
    const rect = track.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    gmsAudioInstance.currentTime = pct * gmsAudioInstance.duration;
  }

  function handleSpeedAudio(btn) {
    const speeds = [1, 1.5, 2];
    const curIdx = speeds.indexOf(gmsActiveSpeed);
    gmsActiveSpeed = speeds[(curIdx + 1) % speeds.length];
    btn.textContent = `${gmsActiveSpeed}x`;
    if (gmsAudioInstance) {
      gmsAudioInstance.playbackRate = gmsActiveSpeed;
    }
  }

  function onShellClick(e) {
    const playAudioBtn = e.target.closest('[data-act="play-audio"]');
    if (playAudioBtn) {
      e.preventDefault();
      e.stopPropagation();
      handlePlayAudio(playAudioBtn, playAudioBtn.dataset.src, playAudioBtn.dataset.mid, playAudioBtn.dataset.aidx);
      return;
    }

    const seekAudioTrack = e.target.closest('[data-act="seek-audio"]');
    if (seekAudioTrack) {
      e.preventDefault();
      e.stopPropagation();
      handleSeekAudio(seekAudioTrack, e, seekAudioTrack.dataset.mid, seekAudioTrack.dataset.aidx);
      return;
    }

    const speedAudioBtn = e.target.closest('[data-act="speed-audio"]');
    if (speedAudioBtn) {
      e.preventDefault();
      e.stopPropagation();
      handleSpeedAudio(speedAudioBtn);
      return;
    }

    const starBtn = e.target.closest('[data-star]');
    if (starBtn) { e.preventDefault(); e.stopPropagation(); toggleStar(starBtn.dataset.star); return; }

    const cb = e.target.closest('.gms-row .gms-cb');
    if (cb) { e.stopPropagation(); toggleChecked(cb.closest('.gms-row').dataset.path); return; }

    const emojiBtn = e.target.closest('[data-emoji]');
    if (emojiBtn) {
      e.preventDefault();
      e.stopPropagation();
      insertEmoji(emojiBtn.dataset.emoji);
      return;
    }

    const removeFileBtn = e.target.closest('[data-act="remove-file"]');
    if (removeFileBtn) {
      e.preventDefault();
      e.stopPropagation();
      removePendingFile(parseInt(removeFileBtn.dataset.idx, 10));
      return;
    }

    const actsBtn = e.target.closest('.gms-acts [data-act]');
    if (actsBtn) {
      e.preventDefault();
      e.stopPropagation();
      const row = actsBtn.closest('.gms-row');
      const path = row?.dataset?.path;
      const act = actsBtn.dataset.act;
      if (act === 'markread') {
        if (path) {
          const t = state.threads.find((x) => x.path === path);
          if (t) t.unread = false;
          GMS.render(true);
          GMS.showToast('Đã đánh dấu là đã đọc.');
        }
        return;
      }
      if (act === 'archive') {
        GMS.showToast('Đã lưu trữ cuộc trò chuyện.');
        return;
      }
      if (act === 'del') {
        GMS.showToast('Đã chuyển cuộc trò chuyện vào thùng rác.');
        return;
      }
      if (act === 'clock' || act === 'snooze') {
        GMS.showToast('Đã tạm ẩn cuộc trò chuyện đến 08:00 sáng mai.');
        return;
      }
      if (act === 'pin') {
        if (path) toggleStar(path);
        return;
      }
      return;
    }

    if (e.target.closest('.gms-acts')) { e.stopPropagation(); return; }

    const quoteToggle = e.target.closest('[data-act="toggle-quote"]');
    if (quoteToggle) {
      e.preventDefault();
      e.stopPropagation();
      const mid = quoteToggle.dataset.mid;
      state.showQuotes = state.showQuotes || new Set();
      if (state.showQuotes.has(mid)) {
        state.showQuotes.delete(mid);
      } else {
        state.showQuotes.add(mid);
      }
      GMS.renderThread();
      return;
    }

    const toggleCard = e.target.closest('[data-act="toggle-card"]');
    if (toggleCard) {
      if (e.target.closest('.gms-mail-actions') || e.target.closest('.gms-mail-star-btn') || e.target.closest('.gms-quote-toggle')) return;
      const mid = toggleCard.dataset.mid;
      state.expandedCards = state.expandedCards || new Set();
      if (state.expandedCards.has(mid)) {
        state.expandedCards.delete(mid);
      } else {
        state.expandedCards.add(mid);
      }
      GMS.renderThread();
      return;
    }

    const tool = e.target.closest('[data-tool]');
    if (tool) {
      e.preventDefault();
      const t = tool.dataset.tool;
      if (t === 'attach' || t === 'photo') {
        const fileIn = q('#gms-file-input') || document.querySelector('input[type="file"]');
        if (fileIn) fileIn.click();
      } else if (t === 'link') {
        const url = prompt('Nhập liên kết:');
        if (url) {
          insertEmoji(' ' + url + ' ');
        }
      }
      return;
    }

    if (!e.target.closest('#gms-emoji-picker') && !e.target.closest('[data-act="toggle-emoji"]') && !e.target.closest('[data-act="emoji"]')) {
      closeEmojiPicker();
    }

    const tabEl = e.target.closest('.gms-tab');
    if (tabEl) {
      e.preventDefault();
      ui.shell.querySelectorAll('.gms-tab').forEach((t) => t.classList.remove('on'));
      tabEl.classList.add('on');
      state.activeTab = tabEl.dataset.tab || 'primary';
      GMS.render(true);
      return;
    }

    const row = e.target.closest('.gms-row');
    if (row) { openThread(row.dataset.path); return; }

    const f = e.target.closest('[data-folder]');
    if (f) {
      e.preventDefault();
      state.folder = f.dataset.folder;
      state.activeTab = 'primary';
      ui.shell.querySelectorAll('.gms-tab').forEach((t) => t.classList.toggle('on', t.dataset.tab === 'primary'));
      GMS.setMode('list');
      GMS.render(true);
      return;
    }

    const a = e.target.closest('[data-act]');
    if (!a) return;
    e.preventDefault();
    ACTIONS[a.dataset.act]?.();
  }

  // Bàn phím: Enter / Space trên dòng thư để mở.
  function onShellKey(e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const row = e.target.closest?.('.gms-row');
    if (row && e.target === row) { e.preventDefault(); openThread(row.dataset.path); }
  }

  // ---------- hiển thị ----------
  function visibleThreads() {
    let list = state.threads;
    if (state.folder === 'starred') list = list.filter((t) => GMS.stars[t.path]);
    else if (state.folder === 'sent') list = list.filter((t) => SENT_RE.test(t.snippet));
    else if (state.folder !== 'inbox') list = [];
    else if (state.activeTab && state.activeTab !== 'primary') list = [];
    const query = fold(state.query.trim());
    if (query) list = list.filter((t) => fold(t.name + ' ' + t.snippet).includes(query));
    return list;
  }
  GMS.visibleThreads = visibleThreads;

  function rowHtml(t) {
    const starred = !!GMS.stars[t.path];
    const checked = state.checked.has(t.path);
    const sender = SENT_RE.test(t.snippet) ? `tôi, ${t.name}` : t.name;
    const body = t.snippet.replace(SENT_RE, '') || '(không có nội dung)';
    if (GMS.theme() === 'outlook') {
      const current = state.mode === 'thread' && !!state.current && state.current.path === t.path;
      return GMS.OUTLOOK.row(t, { starred, checked, current, sender, body });
    }
    return `<div class="gms-row${t.unread ? ' is-unread' : ''}${checked ? ' is-checked' : ''}" data-path="${esc(t.path)}" role="button" tabindex="0">
<span class="gms-cb${checked ? ' on' : ''}" title="Chọn"></span>
<button class="gms-star${starred ? ' on' : ''}" data-star="${esc(t.path)}" title="${starred ? 'Có gắn dấu sao' : 'Không gắn dấu sao'}" aria-label="${starred ? 'Bỏ dấu sao' : 'Gắn dấu sao'}">${ico(starred ? 'star' : 'star_border')}</button>
<span class="gms-sender">${esc(sender)}</span>
<span class="gms-line"><span class="gms-subj">${esc(body)}</span></span>
<span class="gms-date">${esc(t.date)}</span>
<span class="gms-acts">
  ${ib('Lưu trữ', 'archive')}${ib('Xóa', 'del')}${ib('Đánh dấu là đã đọc', 'markread')}${ib('Tạm ẩn', 'clock')}
</span></div>`;
  }

  function getMessageSignature(m) {
    if (!m) return '';
    const dir = m.isOut ? 'O' : 'I';
    const texts = (m.texts || []).filter(Boolean).join('\n');
    const media = (m.media || []).map((src) => {
      try { return new URL(src).pathname; } catch { return src; }
    }).join(',');
    const reels = (m.reels || []).map((r) => r.href).join(',');
    const audios = (m.audios || []).map((a) => a.src || a.duration).join(',');
    return `${dir}|||${texts}|||${media}|||${reels}|||${audios}`;
  }

  function extractThreadId(pathOrUrl) {
    if (!pathOrUrl) return '';
    const match = String(pathOrUrl).match(/\/t\/([^/?#]+)/);
    return match ? match[1] : '';
  }

  function isMainReadyForCurrentThread(m) {
    if (!state.current?.path) return false;
    const targetId = extractThreadId(state.current.path);
    const currentUrlId = extractThreadId(location.pathname);
    if (targetId && currentUrlId && targetId !== currentUrlId) {
      return false;
    }
    return true;
  }

  function mergeThreadMessages(history, incoming, threadKey) {
    if (!incoming || !incoming.length) {
      return history || [];
    }
    if (!history || !history.length) {
      return incoming.map((m, idx) => ({ ...m, id: m.isOptimistic ? m.id : ('msg-' + idx) }));
    }

    // 1. Find best overlap between history and incoming
    let matchHistoryIdx = -1;
    let matchIncomingIdx = -1;

    for (let j = 0; j < incoming.length; j++) {
      const incSig = getMessageSignature(incoming[j]);
      const hIdx = history.findIndex((h) => !h.isOptimistic && getMessageSignature(h) === incSig);
      if (hIdx >= 0) {
        matchHistoryIdx = hIdx;
        matchIncomingIdx = j;
        break;
      }
    }

    let merged = [];
    if (matchHistoryIdx >= 0) {
      const olderHistory = history.slice(0, matchHistoryIdx).filter((h) => !h.isOptimistic);
      const overlappingIncoming = incoming.slice(matchIncomingIdx);
      merged = [...olderHistory, ...overlappingIncoming];
    } else {
      // If no overlap found, incoming is newer messages from bottom
      merged = [...history.filter((h) => !h.isOptimistic), ...incoming];
    }

    // Deduplicate consecutive identical messages in merged list
    const deduped = [];
    let prevSig = '';
    for (const m of merged) {
      const sig = getMessageSignature(m);
      if (sig && sig === prevSig) continue;
      prevSig = sig;
      deduped.push(m);
    }

    // 2. Resolve pending optimistic messages
    state.pendingOptimistic = state.pendingOptimistic || new Map();
    const pendingList = (threadKey && state.pendingOptimistic.get(threadKey)) || [];
    const now = Date.now();

    const remainingPending = [];
    for (const opt of pendingList) {
      if (now - opt.createdAt > 12000) continue;
      const isConfirmed = deduped.some((inc) => {
        if (!inc.isOut) return false;
        if (opt.texts && opt.texts.length && opt.texts.some((t) => inc.texts && inc.texts.some((it) => it === t || it.includes(t) || t.includes(it)))) return true;
        if (opt.media && opt.media.length && inc.media && inc.media.length) return true;
        return false;
      });
      if (!isConfirmed) remainingPending.push(opt);
    }

    if (threadKey) state.pendingOptimistic.set(threadKey, remainingPending);

    const finalResult = [...deduped, ...remainingPending];
    return finalResult.map((m, idx) => ({
      ...m,
      id: m.isOptimistic ? m.id : ('msg-' + idx)
    }));
  }

  function linkifyText(rawText) {
    if (!rawText) return '';
    const safe = esc(rawText);
    const withBreaks = safe.replace(/\n/g, '<br>');
    const urlPattern = /(https?:\/\/[^\s<]+[^<.,:;"')\]\s])/g;
    return withBreaks.replace(urlPattern, (url) => {
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="gms-mail-link">${url}</a>`;
    });
  }

  GMS.renderThread = (m) => {
    if (!ui.shell || state.mode !== 'thread' || !state.current?.path) return;
    const container = q('#gms-thread-rows');
    const scrollArea = q('#gms-thread-scroll');
    if (!container) return;

    state.threadsHistory = state.threadsHistory || new Map();
    const threadKey = state.current.path;
    let history = state.threadsHistory.get(threadKey) || [];

    const oldMsgCount = history.length;
    const oldScrollHeight = scrollArea ? scrollArea.scrollHeight : 0;
    const oldScrollTop = scrollArea ? scrollArea.scrollTop : 0;

    const mainEl = m || GMS.applyMain();
    if (mainEl && isMainReadyForCurrentThread(mainEl)) {
      const parsed = GMS.parseMessages(mainEl);
      if (parsed.length) {
        history = mergeThreadMessages(history, parsed, threadKey);
        state.threadsHistory.set(threadKey, history);
      }
    } else if (state.pendingOptimistic && state.pendingOptimistic.has(threadKey)) {
      history = mergeThreadMessages(history, history.filter((h) => !h.isOptimistic), threadKey);
      state.threadsHistory.set(threadKey, history);
    }

    const messages = history;
    if (!messages.length) {
      if (!container.innerHTML.includes('gms-mail-card')) {
        container.innerHTML = `<div class="gms-empty">Đang tải cuộc trò chuyện...</div>`;
      }
      return;
    }

    state.expandedCards = state.expandedCards || new Set();
    const latestId = messages[messages.length - 1].id;
    if (!state.expandedCards.size) {
      state.expandedCards.add(latestId);
    }

    const isStarred = !!GMS.stars[state.current?.path];
    const myEmail = (GMS.settings.email || 'me@gmail.com').trim();
    const contactEmail = toSlugEmail(state.current?.name);

    const html = messages.map((msg, idx) => {
      const isExpanded = state.expandedCards.has(msg.id) || messages.length === 1 || idx === messages.length - 1;
      const emailAddr = msg.isOut ? myEmail : contactEmail;
      let snippet = msg.texts.join(' · ');
      if (!snippet) {
        if (msg.audios && msg.audios.length) {
          snippet = `[Tin nhắn thoại · ${msg.audios[0].duration || '0:30'}]`;
        } else if (msg.reels && msg.reels.length) {
          const rInfo = GMS.formatReelInfo ? GMS.formatReelInfo(msg.reels[0].href, msg.reels[0].title) : { platform: 'Thước phim' };
          snippet = `[Tệp đính kèm: ${rInfo.platform}]`;
        } else if (msg.media && msg.media.length) {
          snippet = '[Hình ảnh đính kèm]';
        }
      }
      const prevMsg = idx > 0 ? messages[idx - 1] : null;

      if (!isExpanded) {
        return `
          <div class="gms-mail-card is-collapsed" data-mid="${esc(msg.id)}">
            <div class="gms-mail-collapsed-row" data-act="toggle-card" data-mid="${esc(msg.id)}">
              <div class="gms-mail-av"${msg.avatarUrl ? '' : ` style="background: ${msg.color}"`}>
                ${msg.avatarUrl ? `<img src="${esc(msg.avatarUrl)}" class="gms-mail-av-img" alt="${esc(msg.sender)}">` : esc(msg.initial)}
              </div>
              <div class="gms-mail-collapsed-info">
                <div class="gms-mail-collapsed-name">${esc(msg.sender)}</div>
                <div class="gms-mail-collapsed-snippet">${esc(snippet)}</div>
              </div>
              <div class="gms-mail-collapsed-meta">
                ${(msg.media.length || (msg.reels && msg.reels.length) || (msg.audios && msg.audios.length)) ? `<span class="gms-mail-collapsed-attach" title="Có tệp đính kèm">${ico('attach_file')}</span>` : ''}
                <span class="gms-mail-collapsed-time">${esc(msg.time)}</span>
                <button class="gms-mail-star-btn${isStarred ? ' on' : ''}" data-star="${esc(state.current?.path || '')}" title="${isStarred ? 'Có gắn dấu sao' : 'Không gắn dấu sao'}">${ico(isStarred ? 'star' : 'star_border')}</button>
              </div>
            </div>
          </div>
        `;
      }

      return `
        <div class="gms-mail-card is-expanded" data-mid="${esc(msg.id)}">
          <div class="gms-mail-head" data-act="toggle-card" data-mid="${esc(msg.id)}">
            <div class="gms-mail-av"${msg.avatarUrl ? '' : ` style="background: ${msg.color}"`}>
              ${msg.avatarUrl ? `<img src="${esc(msg.avatarUrl)}" class="gms-mail-av-img" alt="${esc(msg.sender)}">` : esc(msg.initial)}
            </div>
            <div class="gms-mail-info">
              <div class="gms-mail-sender-row">
                <span class="gms-mail-name">${esc(msg.sender)}</span>
                <span class="gms-mail-email">&lt;${esc(emailAddr)}&gt;</span>
              </div>
              <div class="gms-mail-to">đến ${esc(msg.to)} ${ico('drop')}</div>
            </div>
            <span class="gms-mail-time">${esc(msg.time)}</span>
            <div class="gms-mail-actions">
              <button class="gms-mail-act-btn gms-mail-star-btn${isStarred ? ' on' : ''}" data-star="${esc(state.current?.path || '')}" title="${isStarred ? 'Có gắn dấu sao' : 'Không gắn dấu sao'}">${ico(isStarred ? 'star' : 'star_border')}</button>
              <button class="gms-mail-act-btn" title="Thêm biểu tượng cảm xúc" data-act="emoji">${ico('mood')}</button>
              <button class="gms-mail-act-btn" title="Trả lời" data-act="reply">${ico('reply')}</button>
              <button class="gms-mail-act-btn" title="Khác">${ico('more_vert')}</button>
            </div>
          </div>
          <div class="gms-mail-body">
            ${(msg.audios || []).map((a, aIdx) => `
              <div class="gms-audio-card" data-src="${esc(a.src || '')}" data-mid="${esc(msg.id)}" data-aidx="${aIdx}">
                <button class="gms-audio-play" data-act="play-audio" data-src="${esc(a.src || '')}" data-mid="${esc(msg.id)}" data-aidx="${aIdx}" title="Phát tin nhắn thoại">
                  ${ico('play_arrow')}
                </button>
                <div class="gms-audio-body">
                  <div class="gms-audio-top">
                    <span class="gms-audio-title">${ico('mic')} Tin nhắn thoại</span>
                    <span class="gms-audio-time" id="gms-atime-${esc(msg.id)}-${aIdx}">${esc(a.duration || '0:30')}</span>
                  </div>
                  <div class="gms-audio-track" data-act="seek-audio" data-mid="${esc(msg.id)}" data-aidx="${aIdx}">
                    <div class="gms-audio-progress" id="gms-aprog-${esc(msg.id)}-${aIdx}"></div>
                  </div>
                </div>
                <div class="gms-audio-meta">
                  <button class="gms-audio-speed" data-act="speed-audio" data-mid="${esc(msg.id)}" data-aidx="${aIdx}" title="Tốc độ phát">1x</button>
                </div>
              </div>
            `).join('')}
            ${(msg.reels || []).map((r) => {
              const info = GMS.formatReelInfo ? GMS.formatReelInfo(r.href, r.title) : { title: r.title, platform: 'Video / Reel', href: r.href };
              return `
                <div class="gms-attach-pill">
                  <div class="gms-attach-pill-icon">${ico('video')}</div>
                  <div class="gms-attach-pill-info">
                    <div class="gms-attach-pill-title">${esc(info.title)}</div>
                    <div class="gms-attach-pill-sub">${esc(info.platform)} · Tệp đính kèm</div>
                  </div>
                  <a href="${esc(info.href)}" target="_blank" rel="noopener noreferrer" class="gms-attach-pill-open" title="Mở trong tab mới">
                    ${ico('open')}
                  </a>
                </div>
              `;
            }).join('')}
            ${msg.media.map((src) => `<img src="${esc(src)}" class="gms-mail-img" alt="Ảnh đính kèm">`).join('')}
            ${msg.texts.map((t) => `<p class="gms-mail-p">${linkifyText(t)}</p>`).join('')}
            ${prevMsg ? `
              <div class="gms-quote-block">
                <div class="gms-quote-head">Vào ${formatGmailQuoteDate(prevMsg.time)} ${esc(prevMsg.sender)} &lt;<a href="mailto:${esc(prevMsg.isOut ? myEmail : contactEmail)}" class="gms-quote-email">${esc(prevMsg.isOut ? myEmail : contactEmail)}</a>&gt; đã viết:</div>
                <button class="gms-quote-toggle" data-act="toggle-quote" data-mid="${esc(msg.id)}" title="Hiển thị nội dung bị cắt ngắn">···</button>
                <div class="gms-quoted-body" id="gms-quote-${esc(msg.id)}" style="display: ${state.showQuotes && state.showQuotes.has(msg.id) ? 'block' : 'none'};">
                  ${prevMsg.texts.map((t) => `<p class="gms-quote-p">${linkifyText(t)}</p>`).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');

    const shouldScrollBottom = state.autoScrollToBottom || !state.hasScrolledThreadToBottom;

    if (container._lastHtml !== html) {
      container.innerHTML = html;
      container._lastHtml = html;
    }

    if (shouldScrollBottom && scrollArea && messages.length > 0) {
      scrollArea.scrollTop = scrollArea.scrollHeight;
      requestAnimationFrame(() => {
        if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
      });
      setTimeout(() => {
        if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
      }, 60);
      setTimeout(() => {
        if (scrollArea) scrollArea.scrollTop = scrollArea.scrollHeight;
      }, 220);
      state.autoScrollToBottom = false;
      state.hasScrolledThreadToBottom = true;
    } else if (scrollArea && oldScrollHeight > 0 && messages.length > oldMsgCount && !shouldScrollBottom) {
      const heightDiff = scrollArea.scrollHeight - oldScrollHeight;
      if (heightDiff > 0 && oldScrollTop < 100) {
        scrollArea.scrollTop = oldScrollTop + heightDiff;
      }
    }

    const repTitle = q('#gms-reply-title');
    if (repTitle) repTitle.innerHTML = `Trả lời <strong>${esc(state.current?.name || 'Người nhận')}</strong>`;
  };

  GMS.render = (force = false) => {
    if (!ui.shell) return;
    const list = visibleThreads();
    const empty = GMS.theme() === 'outlook' ? GMS.OUTLOOK.empty : EMPTY;
    const emptyMsg = state.query
      ? 'Không có thư nào khớp với tìm kiếm của bạn.'
      : (state.activeTab && state.activeTab !== 'primary' ? (empty[state.activeTab] || 'Không có thư mới trong danh mục này.') : (empty[state.folder] || empty.inbox));
    const html = list.length
      ? list.map(rowHtml).join('')
      : `<div class="gms-empty">${emptyMsg}</div>`;
    if (force || html !== state.lastHtml) {
      q('#gms-rows').innerHTML = html;
      state.lastHtml = html;
    }
    const unread = state.threads.filter((t) => t.unread).length;
    q('[data-count="inbox"]').textContent = unread ? fmtN(unread) : '';
    q('#gms-range').textContent = list.length ? `1–${fmtN(list.length)} trong số ${fmtN(list.length)}` : '';
    ui.shell.querySelectorAll('.gms-folder[data-folder]').forEach((f) => f.classList.toggle('on', f.dataset.folder === state.folder));
    q('.gms-cb-all').classList.toggle('on', state.checked.size > 0);
    if (state.current) {
      const i = list.findIndex((t) => t.path === state.current.path);
      const trange = q('#gms-trange');
      if (trange) trange.textContent = i >= 0 ? `${fmtN(i + 1)} trong số ${fmtN(list.length)}` : '';
      const subj = q('#gms-subject');
      if (subj) subj.textContent = state.current.name;

      const prevBtn = q('.gms-threadview [data-act="prev"]');
      const nextBtn = q('.gms-threadview [data-act="next"]');
      if (prevBtn) prevBtn.disabled = i <= 0;
      if (nextBtn) nextBtn.disabled = i < 0 || i >= list.length - 1;
    }

    // Refresh profile avatar if found
    const av = q('#gms-avatar');
    const myAv = GMS.getMyAvatarUrl ? GMS.getMyAvatarUrl() : '';
    if (av && myAv) {
      if (!av.querySelector('img') || av.querySelector('img').src !== myAv) {
        av.innerHTML = `<img src="${esc(myAv)}" class="gms-avatar-img" alt="Tài khoản Google">`;
      }
    }

    if (state.mode === 'thread') {
      GMS.renderThread();
    }
    GMS.setTitle(unread);
  };

  function openThread(path) {
    stopCurrentAudio();
    const t = state.threads.find((x) => x.path === path) || { path, name: '' };
    const link = GMS.threadLinks().find((x) => x.path === path);
    state.current = t;
    state.expandedCards = new Set();
    state.autoScrollToBottom = true;
    state.hasScrolledThreadToBottom = false;
    state.threadsHistory = state.threadsHistory || new Map();

    state.replyOpen = false;
    const dock = q('#gms-reply-dock');
    const quick = q('#gms-quick-actions');
    if (dock) dock.style.display = 'none';
    if (quick) quick.style.display = 'flex';

    if (link) {
      link.a.click();
    } else if (t.href) {
      location.assign(t.href);
      return;
    }

    GMS.setMode('thread');
    GMS.render(true);

    let tries = 0;
    const poll = setInterval(() => {
      tries++;
      const m = GMS.applyMain();
      if (m && isMainReadyForCurrentThread(m)) {
        if (GMS.scrollNativeThreadToBottom) GMS.scrollNativeThreadToBottom(m);
        GMS.renderThread(m);
      }
      const scrollArea = q('#gms-thread-scroll');
      if (scrollArea && (!state.hasScrolledThreadToBottom || tries <= 5)) {
        scrollArea.scrollTop = scrollArea.scrollHeight;
      }
      if (tries >= 15) clearInterval(poll);
    }, 120);
  }

  function compose() {
    stopCurrentAudio();
    const a = [...document.querySelectorAll('a[href]')].find((x) =>
      /\/(messages\/)?new\/?$/.test(new URL(x.getAttribute('href'), location.href).pathname) && !ui.shell.contains(x));
    state.current = { path: '', name: 'Thư mới' };
    if (a) { a.click(); GMS.setMode('thread'); GMS.render(true); }
    else location.assign(location.hostname.includes('messenger.com') ? '/new' : '/messages/new');
  }

  GMS.setMode = (m) => {
    if (m !== 'thread') stopCurrentAudio();
    state.mode = m;
    GMS.applyClasses();
    if (m === 'thread') setTimeout(GMS.tick, 300);
  };

  // Class trạng thái nằm trên <html> (cho vùng chat) và được chép sang host (cho CSS trong shadow).
  const STATE_CLASSES = ['gms-thread', 'gms-collapsed'];
  function syncHostClasses() {
    if (!ui.host) return;
    for (const c of STATE_CLASSES) ui.host.classList.toggle(c, root.classList.contains(c));
  }

  GMS.applyClasses = () => {
    const on = GMS.active();
    const narrow = window.innerWidth < 900;
    root.classList.toggle('gms-on', on);
    root.classList.toggle('gms-outlook', on && GMS.theme() === 'outlook');
    root.classList.toggle('gms-thread', on && state.mode === 'thread');
    root.classList.toggle('gms-collapsed', on && (state.collapsedManual || narrow));
    syncHostClasses();
  };
})();
