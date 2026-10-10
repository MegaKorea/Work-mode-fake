/*
 * Quản lý vùng chat Messenger chạy nền:
 * - Định vị vùng chat thật và giấu ẩn hoàn toàn khỏi màn hình
 * - Theo dõi DOM mutation của Messenger để tự động parse JSON và cập nhật giao diện Gmail trong Shadow DOM
 * - Tự động kích hoạt tải tin nhắn cũ khi cuộn lên trên
 */
(() => {
  if (GMS.disabled) return;
  const { root, ui, state } = GMS;

  const countLinks = (n) => n.querySelectorAll('a[href*="/t/"]').length;

  function pickMain() {
    const tb = [...document.querySelectorAll('[contenteditable="true"][role="textbox"]')]
      .find((x) => !(ui.shell && ui.shell.contains(x)));
    if (tb) {
      const m = tb.closest('[role="main"]');
      if (m && countLinks(m) < 3) return m;
      let node = tb, best = null;
      while (node && node !== document.body) {
        if (countLinks(node) >= 3) break;
        best = node;
        node = node.parentElement;
      }
      return best;
    }
    return [...document.querySelectorAll('[role="main"]')].find((m) => countLinks(m) < 3) || null;
  }

  function needsUnwrap(cs) {
    return cs.transform !== 'none' || cs.filter !== 'none' || cs.perspective !== 'none' ||
      /paint|layout|strict|content/.test(cs.contain) || /transform|filter/.test(cs.willChange) ||
      (cs.backdropFilter && cs.backdropFilter !== 'none');
  }

  GMS.applyMain = () => {
    const m = pickMain();
    document.querySelectorAll('.gms-main').forEach((x) => x !== m && x.classList.remove('gms-main'));
    if (!m) return null;
    m.classList.add('gms-main');
    for (let p = m.parentElement; p && p !== root; p = p.parentElement) {
      if (!p.classList.contains('gms-unx') && needsUnwrap(getComputedStyle(p))) p.classList.add('gms-unx');
    }
    return m;
  };

  GMS.findNativeScrollEl = (m) => {
    if (!m) return null;
    const candidates = [
      ...m.querySelectorAll('[role="grid"], [data-scope="messages_table"], div'),
      m
    ];
    for (const el of candidates) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 10) {
        return el;
      }
    }
    return null;
  };

  GMS.scrollNativeThreadToBottom = (m) => {
    const scrollEl = GMS.findNativeScrollEl(m || GMS.applyMain());
    if (scrollEl) {
      if (scrollEl.scrollTop < scrollEl.scrollHeight - scrollEl.clientHeight - 20) {
        scrollEl.scrollTop = scrollEl.scrollHeight;
        scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    }
  };

  // Cuộn vùng chat nền lên đỉnh để Messenger tự gửi request tải thêm lịch sử tin nhắn cũ
  let loadMoreThreadAt = 0;
  GMS.loadOlderThreadMessages = () => {
    if (Date.now() - loadMoreThreadAt < 1000) return;
    loadMoreThreadAt = Date.now();
    const m = GMS.applyMain();
    if (!m) return;

    const scrollEl = GMS.findNativeScrollEl(m);
    if (scrollEl) {
      scrollEl.scrollTop = 0;
      scrollEl.dispatchEvent(new Event('scroll', { bubbles: true }));
      setTimeout(() => {
        if (state.mode === 'thread') {
          GMS.renderThread(m);
        }
      }, 700);
    }
  };

  let obs = null;
  let lastObserved = null;
  let obsTimer = null;
  let lastRenderedThreadPath = '';

  GMS.styleThread = (m) => {
    if (!m) return;
    if (state.mode === 'thread') {
      GMS.scrollNativeThreadToBottom(m);

      const curPath = state.current?.path || '';
      if (lastRenderedThreadPath !== curPath) {
        lastRenderedThreadPath = curPath;
      }
      GMS.renderThread(m);

      if (obs && lastObserved !== m) {
        obs.disconnect();
        obs = null;
      }

      if (!obs) {
        lastObserved = m;
        obs = new MutationObserver(() => {
          if (state.mode === 'thread') {
            if (obsTimer) clearTimeout(obsTimer);
            obsTimer = setTimeout(() => {
              obsTimer = null;
              if (state.mode === 'thread') {
                GMS.scrollNativeThreadToBottom(m);
                requestAnimationFrame(() => GMS.renderThread(m));
              }
            }, 80);
          }
        });
        obs.observe(m, { childList: true, subtree: true, characterData: true });
      }
    }
  };
})();
