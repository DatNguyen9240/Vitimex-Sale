/**
 * AuthService — Quản lý đăng nhập và phiên làm việc
 * Dựa trên cấu trúc Medstand, sử dụng Cookie để lưu Token.
 */
window.AuthService = (function () {
  'use strict';

  const LOGIN_ENDPOINT = window.API_CONFIG.METHODS.LOGIN;

  // ── Cookie Helpers ──────────────────────────────────────────────────────
  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Strict`;
  }

  function getCookie(name) {
    const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : '';
  }

  function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }

  // ── Public API ──────────────────────────────────────────────────────────

  /**
   * Đăng nhập vào hệ thống
   * @param {string} username 
   * @param {string} password 
   */
  async function login(username, password) {
    try {
      const data = await HttpService.execute(LOGIN_ENDPOINT, { username, password });

      // Check code === 0 (Success theo đúng dữ liệu bạn gửi)
      if (data && data.code === 0) {
        const token = data.access_token;
        
        // Lưu toàn bộ thông tin User trả về từ API
        const user = {
          userName: data.UserName,
          displayName: data.DisplayName,
          branchId: data.BranchID,
          group: data.Group,
          employeeId: data.EmployeeID
        };

        if (token) setCookie('auth_token', token, 7); 
        localStorage.setItem('auth_user', JSON.stringify(user));
        
        console.log('[AuthService] Login success. User:', user.displayName);
        return data;
      } else {
        throw new Error(data.msg || 'Tài khoản hoặc mật khẩu không chính xác');
      }
    } catch (e) {
      console.error('[AuthService] Login error:', e);
      throw e;
    }
  }

  /** Đăng xuất */
  function logout() {
    deleteCookie('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = 'login.html';
  }

  /** Kiểm tra đã đăng nhập chưa */
  function isAuthenticated() {
    return !!getCookie('auth_token');
  }

  /** Lấy thông tin user đã lưu */
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('auth_user') || '{}');
    } catch (e) {
      return {};
    }
  }

  return {
    login,
    logout,
    isAuthenticated,
    getUser
  };
})();
