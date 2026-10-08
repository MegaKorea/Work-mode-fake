/* Popup cài đặt: đọc / ghi chrome.storage.sync, mỗi thay đổi áp dụng ngay cho tab Messenger. */
const { DEFAULTS } = GMS;

const input = (key) => document.getElementById(key);
const isCheckbox = (el) => el.type === 'checkbox';

// Chữ, logo và mẫu tiêu đề đổi theo giao diện đang chọn.
const GMAIL_LOGO = '<path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6"/><path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15"/><path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2"/><path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92"/><path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2"/>';
const OUTLOOK_LOGO = '<rect x="10" y="5" width="20" height="22" rx="2.5" fill="#28a8ea"/><path d="M10 9l10 7 10-7v-1.5A2.5 2.5 0 0027.5 5h-15A2.5 2.5 0 0010 7.5z" fill="#50d9ff"/><path d="M10 11l10 7 10-7v14a2 2 0 01-2 2H12a2 2 0 01-2-2z" fill="#0364b8" opacity=".85"/><rect x="1" y="8" width="17" height="16" rx="2.5" fill="#0f6cbd"/><ellipse cx="9.5" cy="16" rx="4" ry="4.6" fill="none" stroke="#fff" stroke-width="2.2"/>';
const THEME_UI = {
  gmail: {
    logo: GMAIL_LOGO, viewBox: '52 42 88 66', size: [40, 30],
    faviconTitle: 'Icon phong bì', faviconDesc: 'Đổi icon tab thành phong bì thư',
  },
  outlook: {
    logo: OUTLOOK_LOGO, viewBox: '0 0 32 32', size: [34, 34],
    faviconTitle: 'Icon Outlook', faviconDesc: 'Đổi icon tab thành logo Outlook',
  },
};
let currentTheme = 'gmail';

function applyThemeUi(id) {
  currentTheme = id;
  const ui = THEME_UI[id] || THEME_UI.gmail;
  const logo = document.getElementById('logo');
  logo.setAttribute('viewBox', ui.viewBox);
  logo.setAttribute('width', ui.size[0]);
  logo.setAttribute('height', ui.size[1]);
  logo.innerHTML = ui.logo;
  document.getElementById('faviconTitle').textContent = ui.faviconTitle;
  document.getElementById('faviconDesc').textContent = ui.faviconDesc;
}

function render(settings) {
  const active = GMS.THEMES.find((t) => t.id === settings.theme && t.ready) || GMS.THEMES[0];
  renderThemes(active.id);
  applyThemeUi(active.id);
  for (const key of Object.keys(DEFAULTS)) {
    const el = input(key);
    if (!el) continue;
    if (isCheckbox(el)) el.checked = !!settings[key];
    // Chưa tự đổi tiêu đề tab -> hiện mẫu mặc định của giao diện đang chọn.
    else if (key === 'titleTpl' && settings[key] === DEFAULTS.titleTpl) el.value = GMS.THEME_TITLES[active.id];
    else el.value = settings[key];
  }
}

for (const key of Object.keys(DEFAULTS)) {
  const el = input(key);
  if (!el) continue;
  el.addEventListener(isCheckbox(el) ? 'change' : 'input', () => {
    let value = isCheckbox(el) ? el.checked : el.value;
    if (!isCheckbox(el) && !String(value).trim()) value = DEFAULTS[key];
    // Giữ nguyên mẫu mặc định của giao diện = lưu giá trị mặc định (tự đổi theo giao diện khi chuyển).
    if (key === 'titleTpl' && value === GMS.THEME_TITLES[currentTheme]) value = DEFAULTS.titleTpl;
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
      applyThemeUi(t.id);
      const tt = input('titleTpl');
      if (tt && Object.values(GMS.THEME_TITLES).includes(tt.value)) tt.value = GMS.THEME_TITLES[t.id];
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
