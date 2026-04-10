/**
 * Modal Helper — Vitimex POS
 * Tiện ích quản lý mở/đóng Modal một cách thống nhất.
 */
window.Modal = (function() {
  'use strict';

  /**
   * Hiển thị Modal
   * @param {string} id - ID của phần tử .modal-overlay
   */
  function show(id) {
    const $modal = $(`#${id}`);
    if (!$modal.length) return;

    $modal.addClass('active');
    $('body').css('overflow', 'hidden');

    // Sự kiện đóng khi nhấn ra ngoài
    $modal.on('click', function(e) {
      if (e.target === this) hide(id);
    });

    // Sự kiện phím Esc
    $(document).on('keydown.modal', function(e) {
      if (e.key === 'Escape') hide(id);
    });
  }

  /**
   * Đóng Modal
   * @param {string} id - ID của phần tử .modal-overlay
   */
  function hide(id) {
    const $modal = $(`#${id}`);
    if (!$modal.length) return;

    $modal.removeClass('active');
    $('body').css('overflow', '');
    $(document).off('keydown.modal');
  }

  return {
    show,
    hide
  };
})();
