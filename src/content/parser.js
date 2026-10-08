/* Đọc danh sách đoạn chat từ DOM của Messenger. */
(() => {
  if (GMS.disabled) return;
  const { state, ui } = GMS;

  const THREAD_RE = /\/t\/[^/?#]+\/?$/;
  const NOISE = /^(·|Đang hoạt động|Active now|Đánh dấu là đã đọc|Mark as read|Tùy chọn khác|More options|Đã xem|Seen|Đã gửi|Sent|Đã tắt thông báo|Muted|Tin nhắn chưa đọc:?|Unread message:?|Ghim|Pinned)$/i;
  const TIME_RE = /^(vừa xong|now|just now|\d+\s*(phút|giờ|ngày|tuần|tháng|năm|m|min|mins|h|hr|hrs|d|w|wk|mo|y|yr)|\d{1,2}:\d{2}(\s?[AP]M)?|Th\s?[2-7]|CN|Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{1,2}\s*thg\s*\d{1,2}|\d{1,2}\/\d{1,2}(\/\d{2,4})?|[A-Z][a-z]{2}\s\d{1,2})$/i;
  const UNREAD_RE = /chưa đọc|unread/i;

  GMS.threadLinks = (scope = document) => {
    const out = [];
    const seen = new Set();
    for (const a of scope.querySelectorAll('a[href*="/t/"]')) {
      if (ui.shell && ui.shell.contains(a)) continue;
      if (a.closest('.gms-main')) continue;
      let path;
      try { path = new URL(a.getAttribute('href'), location.href).pathname; } catch { continue; }
      if (!THREAD_RE.test(path) || seen.has(path)) continue;
      seen.add(path);
      out.push({ a, path });
    }
    return out;
  };

  // Chat chưa đọc: có chữ "chưa đọc" hoặc đoạn xem trước được in đậm.
  function looksUnread(a, text, snippet) {
    if (UNREAD_RE.test(text) || UNREAD_RE.test(a.getAttribute('aria-label') || '')) return true;
    if (!snippet) return false;
    const probe = snippet.slice(0, 18);
    for (const sp of a.querySelectorAll('span, div[dir="auto"]')) {
      const t = (sp.textContent || '').trim();
      if (t.length > 2 && (t.startsWith(probe) || snippet.startsWith(t.slice(0, 18))) &&
          parseInt(getComputedStyle(sp).fontWeight, 10) >= 600) return true;
    }
    return false;
  }

  function parseLink({ a, path }) {
    const text = a.innerText || '';
    const lines = text.split('\n').map((s) => s.trim())
      .filter((s) => s && !NOISE.test(s) && !/^(Tin nhắn chưa đọc|Unread message)/i.test(s));
    const name = lines[0] || '(Không có tên)';
    const parts = lines.slice(1).flatMap((s) => s.split(/\s+·\s+/)).map((s) => s.trim()).filter((s) => s && s !== '·');
    let time = '';
    if (parts.length && TIME_RE.test(parts[parts.length - 1])) time = parts.pop();
    const snippet = parts.join(' ').replace(/\s*·\s*$/, '');

    return {
      path,
      href: a.getAttribute('href'),
      name,
      snippet,
      time,
      date: GMS.toDateLabel(time),
      unread: looksUnread(a, text, snippet),
      top: a.getBoundingClientRect().top,
    };
  }

  // Ẩn (opacity 0, vẫn render để còn đọc được chữ) khối danh sách chat gốc của Messenger.
  function hideMessengerList(links) {
    if (links.length < 2) return;
    const main = document.querySelector('.gms-main');
    let node = links[0].a;
    let best = null;
    while (node && node !== document.body) {
      if (main && node.contains(main)) break;
      best = node;
      node = node.parentElement;
    }
    if (best && !best.classList.contains('gms-hidelist')) {
      document.querySelectorAll('.gms-hidelist').forEach((x) => x !== best && x.classList.remove('gms-hidelist'));
      best.classList.add('gms-hidelist');
    }
  }

  GMS.scan = () => {
    const links = GMS.threadLinks();
    state.threads = links.map(parseLink).sort((x, y) => x.top - y.top);
    hideMessengerList(links);
    return state.threads;
  };

  function scrollParent(el) {
    for (let n = el && el.parentElement; n && n !== document.body; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && n.scrollHeight > n.clientHeight + 10) return n;
    }
    return null;
  }

  // Cuộn danh sách gốc xuống cuối để Messenger tải thêm đoạn chat cũ.
  let loadMoreAt = 0;
  GMS.loadMore = () => {
    if (Date.now() - loadMoreAt < 800) return;
    loadMoreAt = Date.now();
    const links = GMS.threadLinks();
    const sp = links.length && scrollParent(links[links.length - 1].a);
    if (sp) sp.scrollTop = sp.scrollHeight;
    setTimeout(() => { GMS.scan(); GMS.render(); }, 900);
  };
})();
