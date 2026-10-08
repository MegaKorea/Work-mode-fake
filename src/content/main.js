/* Điểm vào: vòng lặp cập nhật, điều hướng SPA, phím tắt, đồng bộ cài đặt. */
(() => {
  if (GMS.disabled) return;
  const { root, state, settings, DEFAULTS } = GMS;

  // Khởi động: tránh nháy giao diện Messenger gốc.
  root.classList.add('gms-boot');
  const bootTimer = setTimeout(() => root.classList.remove('gms-boot'), 1500);

  let tickTimer = null;

  GMS.tick = () => {
    GMS.applyClasses();
    if (!GMS.active()) return;
    GMS.injectFonts();
    if (!GMS.ensureShell()) return;
    const m = GMS.applyMain();
    GMS.scan();
    GMS.render();
    if (state.mode === 'thread') GMS.styleThread(m);
    GMS.setFavicon();
  };

  function teardown() {
    GMS.applyClasses();
    GMS.ui.host?.remove();
    ['gms-main', 'gms-unx', 'gms-hidelist', 'gms-bubble', 'gms-out', 'gms-composer', 'gms-hide'].forEach((c) =>
      document.querySelectorAll('.' + c).forEach((x) => x.classList.remove(c)));
    document.querySelectorAll('[data-gms-b]').forEach((x) => x.removeAttribute('data-gms-b'));
    GMS.restoreFavicon();
  }

  const refresh = () => (GMS.active() ? GMS.tick() : teardown());

  // Theo dõi điều hướng trong SPA của Facebook.
  let lastHref = location.href;
  setInterval(() => {
    if (location.href === lastHref) return;
    const wasMsg = /^\/messages/.test(new URL(lastHref).pathname);
    lastHref = location.href;
    if (!wasMsg && GMS.isMsgPage()) state.mode = 'list';
    refresh();
  }, 400);

  // Phím tắt: Alt+Shift+G bật/tắt; "u" / Esc quay lại hộp thư; "/" tìm kiếm (như Gmail).
  window.addEventListener('keydown', (e) => {
    if (e.altKey && e.shiftKey && (e.key === 'G' || e.key === 'g' || e.code === 'KeyG')) {
      e.preventDefault();
      if (GMS.isMsgPage()) chrome.storage.sync.set({ enabled: !settings.enabled });
      return;
    }
    if (!GMS.active() || e.ctrlKey || e.metaKey || e.altKey) return;
    const tgt = e.composedPath()[0]; // e.target bị retarget thành host khi gõ trong ô tìm kiếm (shadow DOM)
    const typing = tgt && (tgt.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(tgt.tagName));
    if (!typing && state.mode === 'thread' && (e.key === 'u' || e.key === 'Escape') && !document.querySelector('[role="dialog"]')) {
      e.preventDefault(); e.stopPropagation();
      GMS.setMode('list');
    }
    if (!typing && e.key === '/' && state.mode === 'list' && GMS.ui.shell) {
      e.preventDefault();
      GMS.ui.shell.querySelector('#gms-q').focus();
    }
  }, true);

  window.addEventListener('resize', GMS.applyClasses);

  chrome.storage.onChanged.addListener((ch, area) => {
    if (area === 'sync') {
      for (const k of Object.keys(ch)) settings[k] = ch[k].newValue ?? DEFAULTS[k];
      if (!settings.enabled) state.mode = 'list';
      refresh();
    }
    if (area === 'local' && ch.gmsStars) { GMS.stars = ch.gmsStars.newValue || {}; GMS.render(true); }
  });

  Promise.all([
    chrome.storage.sync.get(DEFAULTS),
    chrome.storage.local.get({ gmsStars: {} }),
  ]).then(([s, l]) => {
    Object.assign(settings, s);
    GMS.stars = l.gmsStars || {};
  }).catch(() => {}).finally(() => {
    const start = () => {
      GMS.watchTitle();
      refresh();
      clearTimeout(bootTimer);
      root.classList.remove('gms-boot');
      if (!tickTimer) tickTimer = setInterval(() => { if (GMS.active()) GMS.tick(); }, 700);
    };
    if (document.body) start();
    else document.addEventListener('DOMContentLoaded', start, { once: true });
  });
})();
