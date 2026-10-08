/*
 * Vùng chat thật của Messenger đóng vai khung đọc thư:
 * tìm vùng đó, gỡ transform ở tổ tiên, đổi bong bóng / ô soạn tin / ẩn thanh tiêu đề.
 */
(() => {
  if (GMS.disabled) return;
  const { root, ui } = GMS;

  const CALL_LABEL_RE = /cuộc gọi|gọi thoại|gọi video|voice call|video call|start a call/i;
  const countLinks = (n) => n.querySelectorAll('a[href*="/t/"]').length;
  const textbox = (scope) => scope.querySelector('[contenteditable="true"][role="textbox"]');

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

  // Gỡ transform/filter ở tổ tiên để position:fixed bám đúng cửa sổ.
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

  // ---------- bong bóng chat -> kiểu chat trong hộp thư ----------
  function isPainted(cs) {
    const bg = cs.backgroundColor;
    const painted = bg && bg !== 'transparent' && !/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*0\s*\)/.test(bg) && !/^rgb\(255,\s*255,\s*255\)$/.test(bg);
    return painted || (cs.backgroundImage && cs.backgroundImage !== 'none' && /gradient/.test(cs.backgroundImage));
  }

  // Leo từ `start` lên tối đa `maxUp` cấp, trả về phần tử đầu tiên bo góc >= `radius` và có màu nền.
  function findPainted(start, stop, maxUp, radius) {
    let node = start;
    for (let i = 0; i < maxUp && node && node !== stop; i++, node = node.parentElement) {
      const cs = getComputedStyle(node);
      if (parseFloat(cs.borderTopLeftRadius) >= radius && isPainted(cs)) return node;
    }
    return null;
  }

  function styleBubbles(m, mr) {
    const mid = mr.left + mr.width / 2;
    let n = 0;
    for (const t of m.querySelectorAll('div[dir="auto"]:not([data-gms-b])')) {
      if (++n > 400) break;
      if (t.closest('[contenteditable="true"]')) continue;
      const bubble = findPainted(t, m, 7, 8);
      if (!bubble) continue;
      t.setAttribute('data-gms-b', '1');
      const r = bubble.getBoundingClientRect();
      if (r.width === 0) { t.removeAttribute('data-gms-b'); continue; }
      bubble.classList.add('gms-bubble');
      bubble.classList.toggle('gms-out', r.left + r.width / 2 > mid && r.right > mr.right - mr.width * 0.25);
    }
  }

  function styleComposer(m) {
    const tb = textbox(m);
    if (!tb || m.querySelector('.gms-composer')) return;
    findPainted(tb.parentElement, m, 8, 12)?.classList.add('gms-composer');
  }

  // Thanh tiêu đề đoạn chat (tên + nút gọi) -> ẩn, đã có tiêu đề thư thay thế.
  function hideThreadHeader(m, mr) {
    if (m.querySelector('.gms-hide')) return;
    const callBtn = [...m.querySelectorAll('[aria-label]')].find((x) => CALL_LABEL_RE.test(x.getAttribute('aria-label')));
    if (!callBtn) return;
    let node = callBtn;
    for (let i = 0; i < 12 && node && node !== m; i++, node = node.parentElement) {
      const r = node.getBoundingClientRect();
      if (r.width >= mr.width * 0.8 && r.height >= 40 && r.height <= 110 && r.top - mr.top < 30) {
        node.classList.add('gms-hide');
        break;
      }
    }
  }

  GMS.styleThread = (m) => {
    if (!m) return;
    const mr = m.getBoundingClientRect();
    if (mr.width < 50) return;
    styleBubbles(m, mr);
    styleComposer(m);
    if (GMS.settings.hideThreadHeader) hideThreadHeader(m, mr);
  };
})();
