/**
 * Auth Middleware — Vitimex POS
 * Kiểm tra quyền truy cập trước khi render bất kỳ nội dung nào.
 */
(function () {
  'use strict';

  // 1. Chặn ngay lập tức nếu chưa login
  if (!AuthService.isAuthenticated()) {
    console.warn('[Middleware] Unauthenticated access — Redirecting to login...');
    window.location.href = 'login.html';
    return;
  }

  // 2. Nếu đã login, cho phép hiện UI
  if (document.documentElement) {
    document.documentElement.style.display = 'block';
  }

  console.log('[Middleware] Auth check passed ✓');
})();
