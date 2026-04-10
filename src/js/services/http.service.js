/**
 * HTTP Service — Vitimex POS
 * Generic wrapper for Fetch API to communicate with SQL Backend
 */
window.HttpService = (function () {
  'use strict';

  /** Lấy token từ cookie auth_token */
  function _getToken() {
    const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /**
   * Execute a Stored Procedure or Auth action
   * @param {string} endpoint - Name of the procedure or API path
   * @param {object} params - Parameters object
   */
  async function execute(endpoint, params = {}) {
    const isDirectApi = endpoint.startsWith('/');
    const url = isDirectApi 
      ? `${window.API_CONFIG.BASE_URL}${endpoint}`
      : `${window.API_CONFIG.BASE_URL}/execute`;
    
    try {
      const token = _getToken();
      const response = await fetch(url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(isDirectApi ? params : {
          procName: endpoint,
          params: params
        })
      });

      if (!response.ok) {
        throw new Error(`Lỗi kết nối: ${response.status}`);
      }

      const res = await response.json();

      // ── Xử lý chuẩn hóa Khung sườn API ───────────────────────────
      // Nếu có trường code, ta mặc định code 0 là thành công
      if (res && typeof res.code !== 'undefined') {
        if (res.code !== 0) {
          // Tự động báo lỗi nếu có Toast utility
          if (typeof Toast !== 'undefined') {
             Toast.error(res.msg || 'Thao tác không thành công');
          }
          throw new Error(res.msg || 'API Error');
        }
      }

      // Trả về toàn bộ đối tượng để linh hoạt (Login cần access_token, SQL cần data)
      return res;
    } catch (error) {
      console.error(`[HttpService] Error calling ${endpoint}:`, error);
      throw error;
    }
  }

  return {
    execute
  };
})();
