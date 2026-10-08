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
  };

  const SENT_RE = /^(Bạn|You)\s*:\s*/i;

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
      <div class="gms-tab on">${ico('inbox')}<span>Chính</span></div>
      <div class="gms-tab">${ico('promo')}<span>Quảng cáo</span></div>
      <div class="gms-tab">${ico('social')}<span>Mạng xã hội</span></div>
      <div class="gms-tab">${ico('info')}<span>Nội dung cập nhật</span></div>
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
      ${ib('Lưu trữ', 'archive')}
      ${ib('Báo cáo spam', 'report')}
      ${ib('Xóa', 'del')}
      <span class="gms-sep"></span>
      ${ib('Đánh dấu là chưa đọc', 'unread')}
      ${ib('Tạm ẩn', 'clock')}
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
      ${ib('In tất cả', 'print')}
      ${ib('Trong cửa sổ mới', 'open')}
    </div>
  </div>
</div>`;

  const q = (sel) => ui.shell.querySelector(sel);

  // Khung nằm trong Shadow DOM: CSS của Messenger không thể ảnh hưởng, và ngược lại.
  // ui.host là phần tử ngoài (gắn vào body), ui.shell là gốc nội dung bên trong shadow.
  function buildShell() {
    ui.host = document.createElement('div');
    ui.host.id = 'gms-shell';
    const sr = ui.host.attachShadow({ mode: 'open' });
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = chrome.runtime.getURL('src/styles/shell.css');
    css.addEventListener('load', () => ui.host.classList.add('gms-ready'));
    const el = document.createElement('div');
    el.className = 'gms-app';
    el.innerHTML = SHELL_HTML;
    sr.append(css, el);
    el.addEventListener('click', onShellClick);
    el.addEventListener('keydown', onShellKey);
    el.querySelector('#gms-q').addEventListener('input', (e) => {
      state.query = e.target.value;
      if (state.mode !== 'list') GMS.setMode('list');
      GMS.render(true);
    });
    el.querySelector('#gms-scroll').addEventListener('scroll', (e) => {
      const s = e.currentTarget;
      if (s.scrollTop + s.clientHeight > s.scrollHeight - 120) GMS.loadMore();
    });
    return el;
  }

  GMS.ensureShell = () => {
    if (!document.body) return false;
    if (!ui.shell) ui.shell = buildShell();
    if (!ui.host.isConnected) document.body.appendChild(ui.host);
    syncHostClasses();
    const av = q('#gms-avatar');
    const letter = (GMS.settings.avatar || 'M').trim().charAt(0).toUpperCase() || 'M';
    if (av.textContent !== letter) av.textContent = letter;
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
  };

  function onShellClick(e) {
    const starBtn = e.target.closest('[data-star]');
    if (starBtn) { e.preventDefault(); e.stopPropagation(); toggleStar(starBtn.dataset.star); return; }

    const cb = e.target.closest('.gms-row .gms-cb');
    if (cb) { e.stopPropagation(); toggleChecked(cb.closest('.gms-row').dataset.path); return; }

    if (e.target.closest('.gms-acts')) { e.stopPropagation(); return; }

    const row = e.target.closest('.gms-row');
    if (row) { openThread(row.dataset.path); return; }

    const f = e.target.closest('[data-folder]');
    if (f) { e.preventDefault(); state.folder = f.dataset.folder; GMS.setMode('list'); GMS.render(true); return; }

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

  GMS.render = (force = false) => {
    if (!ui.shell) return;
    const list = visibleThreads();
    const html = list.length
      ? list.map(rowHtml).join('')
      : `<div class="gms-empty">${state.query ? 'Không có thư nào khớp với tìm kiếm của bạn.' : EMPTY[state.folder] || EMPTY.inbox}</div>`;
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
      q('#gms-trange').textContent = i >= 0 ? `${fmtN(i + 1)} trong số ${fmtN(list.length)}` : '';
      q('#gms-subject').textContent = state.current.name;
    }
    GMS.setTitle(unread);
  };

  // ---------- mở đoạn chat / soạn thư / chuyển chế độ ----------
  function openThread(path) {
    const t = state.threads.find((x) => x.path === path) || { path, name: '' };
    const link = GMS.threadLinks().find((x) => x.path === path);
    state.current = t;
    if (link) link.a.click();
    else if (t.href) { location.assign(t.href); return; }
    GMS.setMode('thread');
    GMS.render(true);
  }

  function compose() {
    const a = [...document.querySelectorAll('a[href]')].find((x) =>
      /\/(messages\/)?new\/?$/.test(new URL(x.getAttribute('href'), location.href).pathname) && !ui.shell.contains(x));
    state.current = { path: '', name: 'Thư mới' };
    if (a) { a.click(); GMS.setMode('thread'); GMS.render(true); }
    else location.assign(location.hostname.includes('messenger.com') ? '/new' : '/messages/new');
  }

  GMS.setMode = (m) => {
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
    root.classList.toggle('gms-thread', on && state.mode === 'thread');
    root.classList.toggle('gms-collapsed', on && (state.collapsedManual || narrow));
    syncHostClasses();
  };
})();
