/* Hàm tiện ích: escape HTML, bỏ dấu tiếng Việt, định dạng số và thời gian. */
(() => {
  if (GMS.disabled) return;

  const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  GMS.esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);

  GMS.fold = (s) =>
    String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();

  GMS.fmtN = (n) => n.toLocaleString('vi-VN');

  // ---------- thời gian: "2 giờ" -> "14:38", "3 ngày" -> "4 thg 10" ----------
  const pad = (n) => String(n).padStart(2, '0');

  function fmtDate(d) {
    const now = new Date();
    if (d.toDateString() === now.toDateString()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
    if (d.getFullYear() === now.getFullYear()) return `${d.getDate()} thg ${d.getMonth() + 1}`;
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }

  const MS = { minute: 6e4, hour: 36e5, day: 864e5, week: 6048e5, month: 2592e6, year: 31536e6 };
  const UNIT_OF = [
    [/^(phút|m|min|mins)$/, MS.minute],
    [/^(giờ|h|hr|hrs)$/, MS.hour],
    [/^(ngày|d)$/, MS.day],
    [/^(tuần|w|wk)$/, MS.week],
    [/^(tháng|mo)$/, MS.month],
  ];
  const WEEKDAY = {
    cn: 0, 'th 2': 1, 'th 3': 2, 'th 4': 3, 'th 5': 4, 'th 6': 5, 'th 7': 6,
    th2: 1, th3: 2, th4: 3, th5: 4, th6: 5, th7: 6,
    sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
  };

  GMS.toDateLabel = (t) => {
    if (!t) return '';
    const s = t.trim().toLowerCase();
    if (/^(vừa xong|now|just now)$/.test(s)) return fmtDate(new Date());

    const rel = s.match(/^(\d+)\s*(phút|m|min|mins|giờ|h|hr|hrs|ngày|d|tuần|w|wk|tháng|mo|năm|y|yr)$/);
    if (rel) {
      const unit = (UNIT_OF.find(([re]) => re.test(rel[2])) || [, MS.year])[1];
      return fmtDate(new Date(Date.now() - +rel[1] * unit));
    }
    if (s in WEEKDAY) {
      const d = new Date();
      d.setDate(d.getDate() - ((d.getDay() - WEEKDAY[s] + 7) % 7 || 7));
      return fmtDate(d);
    }
    const clock = t.match(/^(\d{1,2}):(\d{2})\s?([AP]M)?/i);
    if (clock) {
      let h = +clock[1];
      if (clock[3]) {
        if (/pm/i.test(clock[3]) && h < 12) h += 12;
        if (/am/i.test(clock[3]) && h === 12) h = 0;
      }
      return `${pad(h)}:${clock[2]}`;
    }
    return t;
  };
})();
