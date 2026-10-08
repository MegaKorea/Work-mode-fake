/* Nhúng font đóng gói kèm (Roboto cho nội dung, Be Vietnam Pro cho tiêu đề) vào trang. */
(() => {
  if (GMS.disabled) return;

  const RANGES = {
    latin: 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD',
    'latin-ext': 'U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C0,U+2113,U+2C60-2C7F,U+A720-A7FF',
    vietnamese: 'U+0102-0103,U+0110-0111,U+0128-0129,U+0168-0169,U+01A0-01A1,U+01AF-01B0,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+1EA0-1EF9,U+20AB',
  };

  // [tên family, tiền tố file, các độ đậm, các bộ ký tự]
  const FAMILIES = [
    ['GMS Roboto', 'roboto', [400, 500, 700], ['latin', 'latin-ext', 'vietnamese']],
    ['GMS Be Vietnam Pro', 'be-vietnam-pro', [500, 600], ['latin', 'vietnamese']],
  ];

  GMS.injectFonts = () => {
    if (document.getElementById('gms-fonts')) return;
    let css = '';
    for (const [family, file, weights, subsets] of FAMILIES) {
      for (const w of weights) {
        for (const sub of subsets) {
          const url = chrome.runtime.getURL(`fonts/${file}-${sub}-${w}-normal.woff2`);
          css += `@font-face{font-family:"${family}";font-style:normal;font-weight:${w};font-display:swap;src:url("${url}") format("woff2");unicode-range:${RANGES[sub]};}`;
        }
      }
    }
    const st = document.createElement('style');
    st.id = 'gms-fonts';
    st.textContent = css;
    (document.head || GMS.root).appendChild(st);
  };
})();
