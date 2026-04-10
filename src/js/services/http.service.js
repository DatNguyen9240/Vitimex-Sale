/**
 * HTTP Client — Vitimex POS (Medstand Pattern)
 * wrapper dùng chung cho toàn app, xử lý lỗi tập trung, timeout, spinner.
 */
const Http = (() => {
  const TIMEOUT_MS = 15000;
  
  /** Lấy token từ cookie `auth_token` */
  function _getToken() {
    const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
  }

  /** Build URL đầy đủ */
  function _url(endpoint) {
    return window.API_CONFIG.BASE_URL + endpoint;
  }

  /** Headers mặc định */
  function _headers(extra = {}) {
    const token = _getToken();
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...extra,
    };
  }

  /** Xử lý response tập trung */
  async function _handleResponse(res, endpoint) {
    console.log('[HTTP] Response:', res.status, res.url);

    if (res.status === 401) {
      Alert.warning('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.');
      document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      localStorage.removeItem('auth_user');
      window.location.href = 'login.html';
      return;
    }

    const raw = await res.text().catch(() => '');
    let data = null;
    try {
      data = JSON.parse(raw);
    } catch {
      console.log('[HTTP] Raw response (unparseable):', raw.substring(0, 200));
    }

    if (!data) {
      const msg = 'Không nhận được dữ liệu từ máy chủ.';
      Alert.error(msg);
      throw new Error(msg);
    }

    // Xử lý code: 2 (Phiên hết hạn - convention BMS)
    if (data.code === 2) {
      Alert.warning(data.msg || 'Phiên đăng nhập đã hết hạn.');
      document.cookie = 'auth_token=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
      localStorage.removeItem('auth_user');
      window.location.href = 'login.html';
      return;
    }

    // Server trả code lỗi (chỉ số != 0 mới là lỗi)
    if (data.code !== undefined && typeof data.code === 'number' && data.code !== 0) {
      const msg = data.msg || data.message || 'Có lỗi xảy ra từ máy chủ.';
      Alert.error(msg);
      throw new Error(msg);
    }

    if (!res.ok) {
      const msg = data?.msg || data?.message || `Lỗi ${res.status}`;
      Alert.error(msg);
      throw new Error(msg);
    }

    return data;
  }

  async function _fetchWithTimeout(url, options) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(tid);
      return res;
    } catch (err) {
      const isTimeout = err.name === 'AbortError';
      const msg = isTimeout
        ? 'Kết nối quá thời gian chờ. Vui lòng thử lại.'
        : 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
      Alert.error(msg);
      throw new Error(msg);
    }
  }

  // ─── Public methods ────────────────────────────────────────────────────────

  async function get(endpoint, params = {}) {
    const qs = new URLSearchParams(params).toString();
    const url = _url(endpoint) + (qs ? `?${qs}` : '');

    showGlobalSpinner();
    try {
      const res = await _fetchWithTimeout(url, {
        method: 'GET',
        headers: _headers(),
      });
      const data = await _handleResponse(res, endpoint);
      return data;
    } finally {
      hideGlobalSpinner();
    }
  }

  async function post(endpoint, body = {}) {
    showGlobalSpinner();
    try {
      const res = await _fetchWithTimeout(_url(endpoint), {
        method: 'POST',
        headers: _headers(),
        body: JSON.stringify(body),
      });
      const data = await _handleResponse(res, endpoint);
      return data;
    } finally {
      hideGlobalSpinner();
    }
  }

  return { get, post };
})();

// Alias for consistency with other projects
window.Http = Http;
