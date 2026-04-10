/**
 * API Configuration — Vitimex POS
 * Mapping Frontend actions to SQL Stored Procedures
 */
window.API_CONFIG = {
  // Base URL 
  BASE_URL: 'http://vtmtest.bms79.com/api',

  // Procedures mapping
  // ─── Endpoints theo domain ─────────────────────────────────────────────────
  ENDPOINTS: {
    // Auth / User
    AUTH: {
      LOGIN: '/login',
      LOGOUT: '/logout',
      USER_INFO: '/API_POS_LayDanhSachNguoiDung', // Map to POS UserInfo SP
    },

    // POS / Bán hàng
    POS: {
      GET_CUSTOMERS: '/API_POS_LayDanhSachKhachHang',
      GET_BRANCHES: '/API_POS_LayDanhSachChiNhanh',
      GET_EMPLOYEES: '/API_POS_LayDanhSachNhanVien',
      SEARCH_ITEMS: '/API_POS_TimKiemHangHoa',
      SAVE_ORDER: '/API_POS_LuuDonHang',
      GET_ORDER_STATUSES: '/API_POS_LayDanhSachTrangThaiDonHang',
      GET_PAYMENT_METHODS: '/API_POS_LayDanhSachPhuongThucThanhToan'
    }
  }
};

// Đóng băng để tránh bị ghi đè ngoài ý muốn
Object.freeze(window.API_CONFIG);
Object.freeze(window.API_CONFIG.ENDPOINTS);
