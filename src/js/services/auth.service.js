/**
 * AuthService — Vitimex POS (Medstand Pattern)
 * Quản lý đăng nhập, phiên làm việc và hiển thị thông tin người dùng.
 */
const AuthService = (() => {
  const EP = window.API_CONFIG.ENDPOINTS.AUTH;

  // ── Cookie helpers ──────────────────────────────────────────────────────
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
   * Đăng nhập
   * @param {string} username 
   * @param {string} password 
   */
  async function login(username, password) {
    console.log('[Auth] Login attempt:', username);
    try {
      const data = await Http.post(EP.LOGIN, { username, password });
      
      if (data && data.code === 0) {
        const token = data.access_token || '';
        if (token) setCookie('auth_token', token, 7); 

        // Lưu thông tin cơ bản trước
        const basicUser = {
          UserName: data.UserName || username,
          DisplayName: data.DisplayName || username,
          BranchID: data.BranchID || ''
        };
        localStorage.setItem('auth_user', JSON.stringify(basicUser));

        localStorage.setItem('auth_user', JSON.stringify(basicUser));
        
        console.log('[Auth] Login success. User:', username);
        return data;
      } else {
        throw new Error(data.msg || 'Tài khoản hoặc mật khẩu không chính xác');
      }
    } catch (e) {
      console.error('[Auth] Login error:', e);
      throw e;
    }
  }

  /** Đăng xuất */
  async function logout() {
    try {
      await Http.post(EP.LOGOUT);
    } finally {
      deleteCookie('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = 'login.html';
    }
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

  /** 
   * Đồng bộ hiển thị thông tin người dùng lên topbar 
   * @param {string} nameSelector 
   */
  function syncUserDisplay(nameSelector) {
    try {
      const user = getUser();
      if (user.DisplayName && nameSelector) {
        // Rút gọn tên: "Nguyễn Văn Admin" -> "Văn Admin"
        const words = user.DisplayName.trim().split(/\s+/);
        const display = words.length <= 2 ? user.DisplayName : words.slice(-2).join(' ');
        $(nameSelector).text(display);
      }
    } catch (e) {
      console.error('[Auth] Failed to sync user display:', e);
    }
  }

  return {
    login,
    logout,
    isAuthenticated,
    getUser,
    syncUserDisplay
  };
})();
