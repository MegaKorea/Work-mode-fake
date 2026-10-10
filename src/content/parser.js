/* Đọc danh sách đoạn chat và parse nội dung tin nhắn từ DOM của Messenger. */
(() => {
  if (GMS.disabled) return;
  const { state, ui } = GMS;

  const THREAD_RE = /\/t\/[^/?#]+\/?$/;
  const NOISE = /^(·|Đang hoạt động|Active now|Đánh dấu là đã đọc|Mark as read|Tùy chọn khác|More options|Đã xem|Seen|Đã gửi|Sent|Đã tắt thông báo|Muted|Tin nhắn chưa đọc:?|Unread message:?|Ghim|Pinned)$/i;
  const TIME_RE = /^(vừa xong|now|just now|\d+\s*(phút|giờ|ngày|tuần|tháng|năm|m|min|mins|h|hr|hrs|d|w|wk|mo|y|yr)|\d{1,2}:\d{2}(\s?[AP]M)?|Th\s?[2-7]|CN|Mon|Tue|Wed|Thu|Fri|Sat|Sun|\d{1,2}\s*thg\s*\d{1,2}|\d{1,2}\/\d{1,2}(\/\d{2,4})?|[A-Z][a-z]{2}\s\d{1,2})$/i;
  const UNREAD_RE = /chưa đọc|unread/i;
  const SIDEBAR_NOISE_RE = /^(Trang cá nhân|Tắt thông báo|Tìm kiếm|Tùy chỉnh đoạn chat|File phương tiện|Quyền riêng tư|Đã nhỡ cuộc gọi|Cuộc gọi video|Gọi lại|Đặt biệt danh|Chỉnh sửa biệt danh|Chủ đề|Đoạn chat được mã hóa|Bạn bè trên Facebook|Tin nhắn và cuộc gọi|End-to-end|Conversation information|Thông tin về đoạn chat|Tạo nhóm|Hạn chế|Chặn|Báo cáo|Rời khỏi nhóm|Xóa đoạn chat|Bắt đầu cuộc trò chuyện|Ghim|Bỏ ghim)/i;
  const STATUS_NOISE_RE = /^(Đã gửi(\s+.*)?|Đang gửi(\.\.\.)?|Đã nhận.*|Đã xem.*|Seen.*|Sent.*|Delivered.*|Sending.*|Nhập.*|Tin nhắn do.*|Gửi lúc.*|Đã gửi lúc.*|Được mã hóa đầu cuối.*|Đoạn chat được mã hóa đầu cuối.*|Nhấn Enter để gửi.*|.*đã trả lời tin của bạn.*|.*replied to.*|Tin không còn nữa|Message unavailable)$/i;

  function isSidebarNoise(text) {
    if (!text) return true;
    const t = text.trim();
    if (SIDEBAR_NOISE_RE.test(t)) return true;
    if (t.includes('Trang cá nhân') && (t.includes('Tắt thông báo') || t.includes('Tùy chỉnh'))) return true;
    if (t.includes('File phương tiện') || t.includes('Quyền riêng tư và hỗ trợ')) return true;
    if (/^Đã nhỡ cuộc gọi(\s*·\s*Gọi lại)?$/i.test(t)) return true;
    if (/^Đoạn chat được mã hóa/i.test(t)) return true;
    return false;
  }

  function isStatusNoise(text) {
    if (!text) return true;
    const t = text.trim();
    if (STATUS_NOISE_RE.test(t)) return true;
    if (/^Đã gửi/i.test(t) || /^Đang gửi/i.test(t) || /^Đã xem/i.test(t) || /^Đã nhận/i.test(t)) return true;
    if (t.includes('Được mã hóa đầu cuối') || t.includes('mã hóa đầu cuối') || t.includes('đã trả lời tin của') || t.includes('Tin không còn nữa')) return true;
    return false;
  }

  GMS.formatReelInfo = (href, rawTitle) => {
    let platform = 'Tệp video / Đa phương tiện';
    let cleanTitle = (rawTitle || '').trim();

    if (/instagram\.com\/(reel|p|tv)\//i.test(href) || /instagram\.com/i.test(href)) {
      platform = 'Instagram Reel';
      if (!cleanTitle || cleanTitle === 'Thước phim / Video đính kèm' || /^instagram$/i.test(cleanTitle)) {
        cleanTitle = 'Thước phim trên Instagram';
      }
    } else if (/facebook\.com\/reel/i.test(href) || /facebook\.com\/watch/i.test(href) || /fb\.watch/i.test(href)) {
      platform = 'Facebook Video';
      if (!cleanTitle || cleanTitle === 'Thước phim / Video đính kèm' || /^facebook$/i.test(cleanTitle)) {
        cleanTitle = 'Thước phim Facebook';
      }
    } else if (/tiktok\.com/i.test(href)) {
      platform = 'TikTok Video';
      if (!cleanTitle || cleanTitle === 'Thước phim / Video đính kèm' || /^tiktok$/i.test(cleanTitle)) {
        cleanTitle = 'Video ngắn trên TikTok';
      }
    } else if (/youtube\.com|youtu\.be/i.test(href)) {
      platform = 'YouTube Video';
      if (!cleanTitle || cleanTitle === 'Thước phim / Video đính kèm' || /^youtube$/i.test(cleanTitle)) {
        cleanTitle = 'Video trên YouTube';
      }
    }

    cleanTitle = cleanTitle.replace(/^(Xem trên Instagram|Watch on Instagram|Watch on Facebook|Xem trên Facebook|Instagram|Facebook)\s*·?\s*/i, '').trim() || platform;

    return {
      href,
      title: cleanTitle,
      platform
    };
  };

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

  function extractAvatarFromElement(el) {
    if (!el) return '';

    // Check SVG ImageElement on el itself
    if (el.tagName === 'image' || el.tagName === 'IMAGE') {
      const src = (el.href && el.href.baseVal) || el.getAttribute('href') || el.getAttribute('xlink:href') || el.getAttributeNS?.('http://www.w3.org/1999/xlink', 'href') || '';
      if (src && !src.startsWith('data:image/svg') && !src.includes('rsrc.php')) return src;
    }

    // Check HTMLImageElement on el itself
    if (el.tagName === 'IMG' && el.src) {
      if (!el.src.startsWith('data:image/svg') && !el.src.includes('rsrc.php') && !el.src.includes('emoji.php')) return el.src;
    }

    // Check descendants for SVG ImageElement
    const svgImgs = el.querySelectorAll('image');
    for (const svgImg of svgImgs) {
      const src = (svgImg.href && svgImg.href.baseVal) || svgImg.getAttribute('href') || svgImg.getAttribute('xlink:href') || svgImg.getAttributeNS?.('http://www.w3.org/1999/xlink', 'href') || '';
      if (src && !src.startsWith('data:image/svg') && !src.includes('rsrc.php')) return src;
    }

    // Check descendants for HTMLImageElement
    const imgs = el.querySelectorAll('img[src]');
    for (const img of imgs) {
      if (img.src && !img.src.startsWith('data:image/svg') && !img.src.includes('rsrc.php') && !img.src.includes('emoji.php')) {
        return img.src;
      }
    }

    // Check CSS background-image
    const bgEl = (el.style && el.style.backgroundImage) ? el : el.querySelector('[style*="background-image"]');
    if (bgEl && bgEl.style && bgEl.style.backgroundImage) {
      const match = bgEl.style.backgroundImage.match(/url\(["']?([^"']+)["']?\)/);
      if (match && match[1] && !match[1].includes('rsrc.php') && !match[1].startsWith('data:image/svg')) {
        return match[1];
      }
    }

    return '';
  }

  GMS.getMyAvatarUrl = () => {
    if (state.myAvatarUrl) return state.myAvatarUrl;

    // 1. Top navigation banner of Facebook / Messenger
    const banner = document.querySelector('div[role="banner"], header[role="banner"]');
    if (banner) {
      const profileButtons = banner.querySelectorAll(
        'div[aria-label*="Trang cá nhân của bạn" i], div[aria-label*="Your profile" i], div[aria-label*="Hồ sơ của bạn" i], div[aria-label*="Tài khoản của bạn" i], div[aria-label*="Cài đặt tài khoản" i], div[aria-label*="Account Controls" i], a[href*="/me/"], a[href*="/me"], a[href*="/profile.php"], [role="button"]'
      );
      for (const btn of profileButtons) {
        const av = extractAvatarFromElement(btn);
        if (av) {
          state.myAvatarUrl = av;
          return av;
        }
      }

      const bannerImgs = banner.querySelectorAll('image, img');
      for (const el of bannerImgs) {
        const r = el.getBoundingClientRect();
        if (r.left > window.innerWidth * 0.6 && r.width >= 24 && r.height >= 24) {
          const av = extractAvatarFromElement(el);
          if (av) {
            state.myAvatarUrl = av;
            return av;
          }
        }
      }
    }

    // 2. Global search for profile aria-labels
    const profileContainers = document.querySelectorAll(
      '[aria-label*="Trang cá nhân của bạn" i], [aria-label*="Your profile" i], [aria-label*="Hồ sơ của bạn" i], [aria-label*="Tài khoản của bạn" i], [aria-label*="Cài đặt tài khoản" i], [aria-label*="Account Controls and Settings" i], a[href*="/me/"], a[href*="/me"]'
    );
    for (const container of profileContainers) {
      const av = extractAvatarFromElement(container);
      if (av) {
        state.myAvatarUrl = av;
        return av;
      }
    }

    // 3. Messenger web left navigation
    const navButtons = document.querySelectorAll('div[role="navigation"] div[role="button"][aria-label*="Tài khoản" i], div[role="navigation"] div[role="button"][aria-label*="Cài đặt" i], div[role="navigation"] div[role="button"][aria-label*="Preferences" i]');
    for (const btn of navButtons) {
      const av = extractAvatarFromElement(btn);
      if (av) {
        state.myAvatarUrl = av;
        return av;
      }
    }

    return '';
  };

  GMS.getContactAvatarUrl = (path, mainEl) => {
    state.contactAvatars = state.contactAvatars || new Map();
    if (path && state.contactAvatars.has(path) && state.contactAvatars.get(path)) {
      return state.contactAvatars.get(path);
    }

    if (state.current?.avatarUrl) {
      if (path) state.contactAvatars.set(path, state.current.avatarUrl);
      return state.current.avatarUrl;
    }

    // 1. Check sidebar thread links
    if (path) {
      const links = GMS.threadLinks();
      const match = links.find((x) => x.path === path);
      if (match) {
        const av = extractAvatarFromElement(match.a);
        if (av) {
          state.contactAvatars.set(path, av);
          return av;
        }
      }
    }

    // 2. Check main header in Messenger
    const m = mainEl || GMS.applyMain() || document.querySelector('[role="main"]');
    if (m) {
      const headerNodes = m.querySelectorAll('header, [role="heading"], h1, h2, h3, [aria-level], [data-scope="messages_table_header"]');
      for (const h of headerNodes) {
        const av = extractAvatarFromElement(h);
        if (av) {
          if (path) state.contactAvatars.set(path, av);
          return av;
        }
      }

      // Check avatars inside incoming message rows on the left side
      const leftAvatars = m.querySelectorAll('svg image, img');
      for (const imgEl of leftAvatars) {
        const r = imgEl.getBoundingClientRect();
        if (r.left < window.innerWidth * 0.5 && r.width >= 20 && r.width <= 60 && r.height >= 20 && r.height <= 60) {
          const av = extractAvatarFromElement(imgEl);
          if (av && !isRealMediaImage(imgEl)) {
            if (path) state.contactAvatars.set(path, av);
            return av;
          }
        }
      }
    }

    // 3. Check complementary right sidebar
    const comp = document.querySelector('[role="complementary"], [aria-label*="Thông tin về đoạn chat" i], [aria-label*="Conversation information" i]');
    if (comp) {
      const av = extractAvatarFromElement(comp);
      if (av) {
        if (path) state.contactAvatars.set(path, av);
        return av;
      }
    }

    return '';
  };

  // Parse từng dòng chat trong danh sách Hộp thư đến (List View)
  function parseLink({ a, path }) {
    const dirSpans = [...a.querySelectorAll('span[dir="auto"], div[dir="auto"]')];
    const leafSpans = dirSpans.filter((s) => !dirSpans.some((other) => other !== s && s.contains(other)));
    const textList = leafSpans.map(extractCleanText).filter((t) => t && !NOISE.test(t) && !isSidebarNoise(t));

    const avatarUrl = extractAvatarFromElement(a);
    state.contactAvatars = state.contactAvatars || new Map();
    if (avatarUrl) {
      state.contactAvatars.set(path, avatarUrl);
    }

    let name = '(Không có tên)';
    let snippet = '';
    let time = '';

    if (textList.length >= 1) {
      name = textList[0];
    }

    if (textList.length >= 2) {
      const rest = textList.slice(1);
      if (TIME_RE.test(rest[rest.length - 1])) {
        time = rest.pop();
      }
      snippet = rest.join(' · ');
    } else {
      const raw = a.innerText || '';
      const lines = raw.split('\n').map((s) => s.trim()).filter(Boolean);
      if (lines.length >= 2) {
        name = lines[0];
        const parts = lines.slice(1).join(' ').split(/\s*·\s*/);
        if (parts.length >= 2) {
          time = parts[parts.length - 1];
          snippet = parts.slice(0, parts.length - 1).join(' · ');
        } else {
          snippet = parts[0];
        }
      } else {
        const parts = raw.split(/\s*·\s*/);
        if (parts.length >= 2) {
          time = parts[parts.length - 1].trim();
          snippet = parts[0].trim();
        }
      }
    }

    snippet = snippet.replace(/^(Đã xem|Đã gửi|Seen|Sent|Đã nhận|Delivered)\s*/i, '').trim();
    if (isSidebarNoise(snippet) || isStatusNoise(snippet)) snippet = '';

    return {
      path,
      href: a.getAttribute('href'),
      name,
      avatarUrl,
      snippet: snippet || name,
      time,
      date: GMS.toDateLabel(time) || 'Hôm nay',
      unread: looksUnread(a, a.innerText || '', snippet),
      top: a.getBoundingClientRect().top,
    };
  }

  // Regex nhận diện mốc thời gian phân cách
  const TIME_SEPARATOR_RE = /^(((hôm nay|hôm qua)\s+(lúc\s+)?)?(\d{1,2}:\d{2}(\s?[ap]m)?|\d{1,2}\s+thg\s+\d{1,2}(,\s*\d{4})?([,·]\s*(lúc\s*)?\d{1,2}:\d{2}(\s?[ap]m)?)?|(th\s?[2-7]|cn|mon|tue|wed|thu|fri|sat|sun)[,·\s]+\d{1,2}\s+thg\s+\d{1,2}([,·]\s*(lúc\s*)?\d{1,2}:\d{2})?))$/i;

  const AV_COLORS = ['#0b57d0', '#c5221f', '#1e8e3e', '#e37400', '#a142f4', '#795548', '#00838f', '#d93025'];
  function hashColor(str) {
    if (!str) return AV_COLORS[0];
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
    return AV_COLORS[Math.abs(hash) % AV_COLORS.length];
  }

  function extractCleanText(el) {
    if (!el) return '';
    let out = '';
    for (const node of el.childNodes) {
      if (node.nodeType === Node.TEXT_NODE) {
        out += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        // Skip aria-hidden / decorative elements (unless it's an img with alt such as emoji)
        if (node.getAttribute('aria-hidden') === 'true' && node.tagName !== 'IMG') {
          continue;
        }
        if (node.tagName === 'IMG') {
          out += node.getAttribute('alt') || '';
        } else if (node.tagName === 'BR') {
          out += '\n';
        } else {
          out += extractCleanText(node);
        }
      }
    }
    return out.trim();
  }

  // Lọc chỉ lấy ảnh/sticker thật sự được gửi trong tin nhắn
  function isRealMediaImage(img) {
    if (!img || !img.src) return false;
    const src = img.src;

    // 1. Loại trừ SVG data URI, scripts, sprite emoji
    if (src.startsWith('data:image/svg') || src.includes('rsrc.php') || src.includes('emoji.php') || src.includes('/images/emoji')) {
      return false;
    }

    // 2. Loại trừ nếu nằm trong header, sidebar thông tin bên phải, footer, toolbar, composer
    if (img.closest('[role="banner"], [role="complementary"], [role="toolbar"], [contenteditable], form, footer, header')) {
      return false;
    }

    // 3. Loại trừ nếu nằm trong phần giới thiệu tài khoản ở đầu lịch sử chat
    if (img.closest('[role="heading"], h2, h3, [aria-level]')) {
      return false;
    }

    // 4. Loại trừ avatar bo tròn của Facebook (SVG mask / circle wrapper)
    if (img.closest('svg, [mask], clipPath, [style*="border-radius: 50%"], [style*="border-radius:50%"]')) {
      return false;
    }

    // 5. Loại trừ qua alt / aria-label
    const alt = (img.getAttribute('alt') || '').toLowerCase();
    const aria = (img.getAttribute('aria-label') || '').toLowerCase();
    if (/ảnh đại diện|avatar|profile picture|user profile/i.test(alt) || /ảnh đại diện|avatar/i.test(aria)) {
      return false;
    }

    // 6. Loại trừ nếu alt trùng với tên đối phương
    const curName = (GMS.state?.current?.name || '').toLowerCase().trim();
    if (curName && (alt === curName || alt.includes(curName))) {
      return false;
    }

    // 7. Loại trừ liên kết hồ sơ cá nhân
    if (img.closest('a[href*="/user/"], a[href*="/profile.php"], [aria-label*="Ảnh đại diện" i], [aria-label*="profile" i]')) {
      return false;
    }

    // 8. Loại trừ icon bày tỏ cảm xúc reaction
    if (img.closest('[aria-label*="bày tỏ cảm xúc" i], [aria-label*="cảm xúc" i], [aria-label*="reaction" i]')) {
      return false;
    }

    // 9. Loại trừ URL CDN thumbnail avatar của Facebook
    if (/\/(p|s)\d+x\d+\//.test(src) && !src.includes('attachment') && !src.includes('stickers')) {
      return false;
    }

    // 10. Kích thước nhỏ <= 60px là avatar hoặc icon
    const r = img.getBoundingClientRect();
    const w = img.naturalWidth || r.width || parseInt(img.getAttribute('width') || 0, 10);
    const h = img.naturalHeight || r.height || parseInt(img.getAttribute('height') || 0, 10);
    if (w > 0 && w <= 60 && h > 0 && h <= 60) {
      return false;
    }

    // 11. Kiểm tra góc bo tròn thực tế
    const cs = getComputedStyle(img);
    if (parseFloat(cs.borderRadius) >= (w / 2) - 4 && w < 100) {
      return false;
    }

    return true;
  }

  GMS.parseMessages = (m) => {
    if (!m) return [];

    const paneRect = m.getBoundingClientRect();
    const midX = paneRect.left + (paneRect.width > 0 ? paneRect.width / 2 : window.innerWidth / 2);

    const currentName = state.current?.name || 'Người gửi';
    const myName = (GMS.settings.avatar || 'M').trim() || 'Tôi';

    // 1. Quét các liên kết chia sẻ Reels / Video / Post trước để tránh trùng thẻ chữ
    const linkNodes = [...m.querySelectorAll('a[href]')]
      .filter((a) => !a.closest('[role="banner"]') && !a.closest('[role="complementary"]') && !a.closest('#gms-shell'));

    const items = [];
    const reelLinks = [];

    for (const a of linkNodes) {
      const href = a.getAttribute('href') || '';
      if (/(reel|instagram\.com|facebook\.com\/watch|fb\.watch|tiktok\.com|youtube\.com|youtu\.be|facebook\.com\/share)/i.test(href)) {
        const text = extractCleanText(a) || 'Thước phim / Video đính kèm';
        const r = a.getBoundingClientRect();
        if (r.width > 0 && !items.some((it) => it.type === 'reel' && it.href === href)) {
          const reelItem = {
            type: 'reel',
            href,
            title: text,
            top: r.top,
            left: r.left,
            right: r.right,
            width: r.width,
            el: a
          };
          items.push(reelItem);
          reelLinks.push(a);
        }
      }
    }

    // 2. Quét các tin nhắn thoại / Voice message / Audio clips trước để loại bỏ text rác
    const audioContainers = [];
    const audioElements = [...m.querySelectorAll('audio, [aria-label*="tin nhắn thoại" i], [aria-label*="voice clip" i], [aria-label*="voice message" i], [aria-label*="đoạn ghi âm" i], [aria-label*="audio clip" i], [data-testid*="audio" i], [data-testid*="voice" i]')];
    const playButtons = [...m.querySelectorAll('[aria-label*="Phát" i], [aria-label*="Play" i], [aria-label*="Tạm dừng" i], [aria-label*="Pause" i]')]
      .filter((btn) => !btn.closest('[role="banner"]') && !btn.closest('[role="complementary"]') && !btn.closest('#gms-shell') && !btn.closest('footer') && !btn.closest('header'));

    const seenAudioContainers = new Set();
    for (const el of [...audioElements, ...playButtons]) {
      const container = el.closest('[role="row"], [role="gridcell"], [data-scope="messages_table"] > div, div[class*="message"]') || el;
      if (seenAudioContainers.has(container)) continue;
      seenAudioContainers.add(container);

      const audTag = container.querySelector('audio') || (el.tagName === 'AUDIO' ? el : null);
      const src = audTag ? (audTag.currentSrc || audTag.src || audTag.querySelector('source')?.src || '') : '';

      let duration = '';
      const textNodes = [...container.querySelectorAll('span, div')].map((s) => (s.textContent || '').trim());
      for (const t of textNodes) {
        if (/^\d{1,2}:\d{2}$/.test(t)) {
          duration = t;
          break;
        }
      }
      if (!duration && audTag && audTag.duration && !isNaN(audTag.duration) && isFinite(audTag.duration)) {
        const mins = Math.floor(audTag.duration / 60);
        const secs = Math.floor(audTag.duration % 60);
        duration = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
      }

      const r = container.getBoundingClientRect();
      if (r.width > 0 || r.height > 0 || audTag) {
        items.push({
          type: 'audio',
          src: src || '',
          duration: duration || '0:30',
          title: 'Tin nhắn thoại',
          top: r.top || 0,
          left: r.left || 0,
          right: r.right || 0,
          width: r.width || 0,
          el: container,
          audioEl: audTag
        });
        audioContainers.push(container);
      }
    }

    // 3. Quét các thẻ chữ trong vùng tin nhắn (loại trừ khung soạn thảo, header/sidebar, reels, và audio)
    const rawTextNodes = [...m.querySelectorAll('div[dir="auto"], span[dir="auto"]')]
      .filter((el) => !el.closest('[contenteditable="true"]') &&
                      !el.closest('[role="banner"]') &&
                      !el.closest('[role="complementary"]') &&
                      !el.closest('form') &&
                      !el.closest('footer') &&
                      !el.closest('[aria-hidden="true"]') &&
                      !el.closest('[aria-label*="Nhập" i]') &&
                      !el.closest('[aria-label*="Thông tin về đoạn chat" i]') &&
                      !el.closest('[aria-label*="Conversation information" i]') &&
                      !reelLinks.some((a) => a.contains(el)) &&
                      !audioContainers.some((c) => c.contains(el)));

    // Lọc lấy các node chữ cấp cao nhất (loại bỏ node con bị lồng bên trong node cha đã chọn)
    const topTextNodes = rawTextNodes.filter((el) => !rawTextNodes.some((parent) => parent !== el && parent.contains(el)));
    const seenBubbleTexts = new Map();
    const seenPosTexts = new Set();

    for (const el of topTextNodes) {
      const text = extractCleanText(el);
      if (!text) continue;

      if (/^(Nhập|Tin nhắn do|Gửi lúc|Đã gửi lúc|Seen|Đã xem)/i.test(text) && text.length < 50) continue;
      if (isSidebarNoise(text) || isStatusNoise(text)) continue;

      const bubble = el.closest('[role="row"], [role="gridcell"], [data-scope="messages_table"] > div, [data-testid*="message"], div[class*="x1n2onr6"]') || el;
      if (!seenBubbleTexts.has(bubble)) {
        seenBubbleTexts.set(bubble, new Set());
      }
      const bubbleSet = seenBubbleTexts.get(bubble);
      if (bubbleSet.has(text)) {
        continue;
      }
      bubbleSet.add(text);

      const r = el.getBoundingClientRect();
      const posKey = `${Math.round(r.top / 6)}_${text}`;
      if (seenPosTexts.has(posKey)) {
        continue;
      }
      seenPosTexts.add(posKey);

      items.push({
        type: 'text',
        text,
        top: r.top,
        left: r.left,
        right: r.right,
        width: r.width,
        el
      });
    }

    // 4. Quét tất cả ảnh gửi thật và sticker (loại trừ ảnh nằm trong reel link)
    const mediaNodes = [...m.querySelectorAll('img')]
      .filter((img) => isRealMediaImage(img) && !reelLinks.some((a) => a.contains(img)));

    for (const img of mediaNodes) {
      const r = img.getBoundingClientRect();
      items.push({
        type: 'media',
        src: img.src,
        top: r.top,
        left: r.left,
        right: r.right,
        width: r.width,
        el: img
      });
    }

    // 4. Sắp xếp theo chiều dọc từ trên xuống dưới
    items.sort((a, b) => a.top - b.top);

    const messages = [];
    let lastTime = '';
    let curGroup = null;

    const contactAv = GMS.getContactAvatarUrl ? GMS.getContactAvatarUrl(state.current?.path, m) : '';
    let myAv = GMS.getMyAvatarUrl ? GMS.getMyAvatarUrl() : '';
    if (myAv && myAv === contactAv) {
      myAv = '';
    }

    GMS.getInitialLetter = (name) => {
      if (!name) return 'U';
      const clean = name.trim().replace(/^[\s·\-_@#*&^%$!~`+=]+/g, '');
      if (!clean) return 'U';
      const ch = clean.charAt(0).toUpperCase();
      return ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '') || ch || 'U';
    };

    function isOutgoingItem(item) {
      const el = item.el;
      if (!el) return item.left > midX - 40;

      // 1. Traverse parent chain for aria-label or flex alignment
      for (let p = el; p && p !== m && p !== document.body; p = p.parentElement) {
        const aria = (p.getAttribute('aria-label') || '').toLowerCase();
        if (aria) {
          if (/^(bạn đã gửi|bạn:|you sent|you:)/i.test(aria) || aria.includes('bạn đã gửi') || aria.includes('you sent') || aria.includes('tin nhắn của bạn') || aria.includes('ảnh của bạn') || aria.includes('your photo')) {
            return true;
          }
          const curName = (currentName || '').toLowerCase().trim();
          if (curName && (aria.startsWith(curName) || aria.includes(curName + ' đã gửi'))) {
            return false;
          }
        }

        const pcs = getComputedStyle(p);
        const isCol = pcs.flexDirection === 'column' || pcs.flexDirection === 'column-reverse';
        const isRow = !isCol;

        if (pcs.flexDirection === 'row-reverse' || pcs.textAlign === 'right') {
          return true;
        }
        if (isRow && (pcs.justifyContent === 'flex-end' || pcs.justifyContent === 'end')) {
          return true;
        }
        if (isCol && (pcs.alignItems === 'flex-end' || pcs.alignItems === 'end')) {
          return true;
        }
        if (pcs.marginLeft === 'auto' && pcs.marginRight !== 'auto') {
          return true;
        }
      }

      // 2. Check for contact avatar on the left
      const row = el.closest('[role="row"], [role="gridcell"], [data-scope="messages_table"] > div, [data-testid*="message"], div[class*="message"]');
      if (row) {
        const leftAv = row.querySelector('svg image, img[alt*="avatar" i], img[alt*="ảnh đại diện" i], [style*="border-radius: 50%"], [style*="border-radius:50%"]');
        if (leftAv && isRealMediaImage(leftAv) === false) {
          const avR = leftAv.getBoundingClientRect();
          if (avR.width > 0 && avR.right <= item.left + 35) {
            return false; // Incoming message has sender avatar on the left
          }
        }
      }

      // 3. Check bubble container background color (Messenger outgoing blue/theme color)
      const bubble = el.closest('[style*="background-color"], [style*="background:"]');
      if (bubble) {
        const bg = bubble.style.backgroundColor || getComputedStyle(bubble).backgroundColor || '';
        if (bg.includes('rgb(0, 132, 255)') || bg.includes('rgb(0, 102, 255)') || bg.includes('rgb(11, 87, 208)')) {
          return true;
        }
      }

      // 4. Coordinates: compare distance from left vs right
      if (paneRect.width > 0) {
        const distFromLeft = item.left - paneRect.left;
        const distFromRight = paneRect.right - item.right;
        if (distFromRight < distFromLeft - 20) return true;
        if (distFromLeft < distFromRight - 20) return false;
      }

      // 5. Fallback
      return item.left > midX - 40;
    }

    for (const item of items) {
      if (item.type === 'text' && TIME_SEPARATOR_RE.test(item.text) && item.text.length < 45) {
        lastTime = item.text;
        continue;
      }

      const isOut = isOutgoingItem(item);
      const sender = isOut ? 'Tôi' : currentName;
      const to = isOut ? currentName : 'tôi';
      const initial = isOut
        ? (GMS.settings.avatar && GMS.settings.avatar !== 'M' ? GMS.getInitialLetter(GMS.settings.avatar) : 'T')
        : GMS.getInitialLetter(currentName);

      let avatarUrl = isOut ? myAv : contactAv;
      if (!isOut && item.el) {
        const rowEl = item.el.closest('[role="row"], [role="gridcell"], [data-scope="messages_table"] > div');
        if (rowEl) {
          const rowAv = extractAvatarFromElement(rowEl);
          if (rowAv && rowAv !== myAv) avatarUrl = rowAv;
        }
      }

      const time = lastTime || new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

      const isSameGroup = curGroup && curGroup.isOut === isOut && (!curGroup.time || !time || curGroup.time === time);

      if (isSameGroup) {
        if (item.type === 'text') {
          const lastText = curGroup.texts[curGroup.texts.length - 1];
          if (lastText !== item.text) {
            curGroup.texts.push(item.text);
          }
        } else if (item.type === 'media' && !curGroup.media.includes(item.src)) {
          curGroup.media.push(item.src);
        } else if (item.type === 'reel' && !curGroup.reels.some((r) => r.href === item.href)) {
          curGroup.reels.push({ href: item.href, title: item.title });
        } else if (item.type === 'audio') {
          curGroup.audios = curGroup.audios || [];
          if (!curGroup.audios.some((a) => a.src && a.src === item.src)) {
            curGroup.audios.push({ src: item.src, duration: item.duration, title: item.title });
          }
        }
        if (avatarUrl && !curGroup.avatarUrl) {
          curGroup.avatarUrl = avatarUrl;
        }
      } else {
        curGroup = {
          id: 'msg-' + messages.length,
          isOut,
          sender,
          to,
          initial,
          avatarUrl,
          color: hashColor(sender),
          time,
          texts: item.type === 'text' ? [item.text] : [],
          media: item.type === 'media' ? [item.src] : [],
          reels: item.type === 'reel' ? [{ href: item.href, title: item.title }] : [],
          audios: item.type === 'audio' ? [{ src: item.src, duration: item.duration, title: item.title }] : []
        };
        messages.push(curGroup);
      }
    }

    return messages;
  };

  // Ẩn khối danh sách chat gốc của Messenger
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
