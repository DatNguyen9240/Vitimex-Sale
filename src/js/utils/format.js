/**
 * Format utilities — Vitimex POS
 */
const Fmt = {
  currency: (n) => {
    if (isNaN(n)) return '0 ₫';
    return Number(n).toLocaleString('vi-VN') + ' ₫';
  },
  number: (n) => Number(n || 0).toLocaleString('vi-VN'),
  percent: (n) => (parseFloat(n) || 0).toFixed(0) + '%',
  date: (d) => {
    if (!d) return '';
    let date;
    if (typeof d === 'string' && d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        // Assume dd/mm/yyyy
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else {
      date = new Date(d);
    }
    if (isNaN(date)) return d; // Fallback to raw string if still invalid
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  },
  inputDate: (d) => {
    if (!d) return '';
    let date;
    if (typeof d === 'string' && d.includes('/')) {
      const parts = d.split('/');
      if (parts.length === 3) {
        date = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      }
    } else {
      date = new Date(d);
    }
    if (isNaN(date)) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  },
  datetimeShort: () => {
    const d = new Date();
    return d.toLocaleDateString('vi-VN') + ' ' + d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  },
};

/**
 * Toast utility
 */
const Toast = {
  show(msg, type = '') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const t = document.createElement('div');
    t.className = 'toast ' + type;
    t.textContent = msg;
    container.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error:   (msg) => Toast.show(msg, 'error'),
};
