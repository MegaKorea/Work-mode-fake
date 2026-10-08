/* Tiêu đề tab và favicon. */
(() => {
  if (GMS.disabled) return;
  const { state, settings } = GMS;

  let settingTitle = false;
  GMS.setTitle = (unread) => {
    if (!GMS.active()) return;
    const n = unread ?? state.threads.filter((t) => t.unread).length;
    const custom = settings.titleTpl && settings.titleTpl !== GMS.DEFAULTS.titleTpl;
    let t = (custom ? settings.titleTpl : GMS.THEME_TITLES[GMS.theme()]).replace('{n}', GMS.fmtN(n));
    if (!n) t = t.replace(/\s*\(\s*0\s*\)/, '').replace(/\s*\(\)\s*/, ' ');
    if (document.title !== t) { settingTitle = true; document.title = t; settingTitle = false; }
  };

  // Giữ tiêu đề tab không bị Messenger ghi đè "(1) Messenger".
  const titleObs = new MutationObserver(() => { if (!settingTitle && GMS.active()) GMS.setTitle(); });
  GMS.watchTitle = () => {
    if (document.head) titleObs.observe(document.head, { subtree: true, childList: true, characterData: true });
  };

  GMS.setFavicon = () => {
    if (!settings.favicon) { GMS.restoreFavicon(); return; }
    const fav = GMS.FAVICONS[GMS.theme()];
    const ours = Object.values(GMS.FAVICONS);
    const links = document.querySelectorAll('link[rel~="icon"]');
    if (!links.length && document.head) {
      const l = document.createElement('link');
      l.rel = 'icon'; l.dataset.gmsAdded = '1'; l.href = fav;
      document.head.appendChild(l);
      return;
    }
    links.forEach((l) => {
      if (!l.dataset.gmsOrig && !ours.includes(l.href)) l.dataset.gmsOrig = l.href;
      if (l.href !== fav) l.href = fav;
    });
  };

  GMS.restoreFavicon = () => {
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => {
      if (l.dataset.gmsAdded) l.remove();
      else if (l.dataset.gmsOrig) { l.href = l.dataset.gmsOrig; delete l.dataset.gmsOrig; }
    });
  };
})();
