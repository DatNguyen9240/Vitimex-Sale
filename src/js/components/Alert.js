/**
 * Alert — wrapper SweetAlert2 (Medstand Pattern)
 * Tự động fire các thông báo chuẩn hóa.
 */
const Alert = (() => {
  const PRIMARY = '#3c50e0';

  function _fire(icon, title, text, opts) {
    const isMobile = window.innerWidth < 768;
    
    var baseConfig = {
      icon: icon,
      title: title,
      text: text,
      confirmButtonColor: PRIMARY,
      timer: 2000,
      timerProgressBar: true,
      showClass: { popup: '' }, 
      hideClass: { popup: '' }, 
    };

    if (isMobile) {
      Object.assign(baseConfig, {
        toast: true,
        position: 'top',
        showConfirmButton: false,
      });
    }

    if (!window.Swal) {
      console.warn('[Alert] SweetAlert2 not loaded yet. Falling back to alert().');
      alert(text || title);
      return Promise.resolve();
    }

    return Swal.fire(Object.assign(baseConfig, opts || {}));
  }

  function success(text, title) { return _fire('success', title || 'Thành công', text); }
  function error(text, title) { return _fire('error', title || 'Lỗi', text); }
  function warning(text, title) { return _fire('warning', title || 'Cảnh báo', text); }
  function info(text, title) { return _fire('info', title || 'Thông báo', text); }

  function confirm(text, title) {
    if (!window.Swal) return Promise.resolve(window.confirm(text || title));
    return Swal.fire({
      icon: 'question',
      title: title || 'Xác nhận',
      text: text,
      showCancelButton: true,
      confirmButtonColor: PRIMARY,
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
    }).then(function (result) {
      return result.isConfirmed;
    });
  }

  return { success, error, warning, info, confirm };
})();
