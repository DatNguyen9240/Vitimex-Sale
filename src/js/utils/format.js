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
