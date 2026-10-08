/* Popup cài đặt: đọc / ghi chrome.storage.sync, mỗi thay đổi áp dụng ngay cho tab Messenger. */
const { DEFAULTS } = GMS;

const input = (key) => document.getElementById(key);
const isCheckbox = (el) => el.type === 'checkbox';

function render(settings) {
  const active = GMS.THEMES.find((t) => t.id === settings.theme && t.ready) || GMS.THEMES[0];
  renderThemes(active.id);
  for (const key of Object.keys(DEFAULTS)) {
    const el = input(key);
    if (!el) continue;
    if (isCheckbox(el)) el.checked = !!settings[key];
    else el.value = settings[key];
  }
}

for (const key of Object.keys(DEFAULTS)) {
  const el = input(key);
  if (!el) continue;
  el.addEventListener(isCheckbox(el) ? 'change' : 'input', () => {
    let value = isCheckbox(el) ? el.checked : el.value;
    if (!isCheckbox(el) && !String(value).trim()) value = DEFAULTS[key];
    chrome.storage.sync.set({ [key]: value });
  });
}

// ---------- Chọn giao diện: mục chưa xong hiện "Đang phát triển" và bị khóa ----------
const themesEl = document.getElementById('themes');

function renderThemes(current) {
  themesEl.replaceChildren(...GMS.THEMES.map((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'theme';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(t.id === current));
    b.disabled = !t.ready;
    const name = Object.assign(document.createElement('span'), { className: 'theme-name', textContent: t.name });
    const desc = Object.assign(document.createElement('span'), { className: 'theme-desc', textContent: t.desc });
    b.append(name, desc);
    if (!t.ready) b.append(Object.assign(document.createElement('span'), { className: 'badge', textContent: 'Đang phát triển' }));
    b.addEventListener('click', () => {
      chrome.storage.sync.set({ theme: t.id });
      renderThemes(t.id);
    });
    return b;
  }));
}

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.sync.set({ ...DEFAULTS });
  render(DEFAULTS);
});

document.getElementById('version').textContent = `v${chrome.runtime.getManifest().version}`;

chrome.storage.sync.get(DEFAULTS).then(render);
