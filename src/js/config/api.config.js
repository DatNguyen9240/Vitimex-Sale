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
    },

    // POS / Bán hàng
    POS: {
      GET_CUSTOMERS: '/API_POS_LayDanhSachKhachHang',
      CREATE_CUSTOMER: '/API_POS_ThemMoiKhachHang',
      GET_CUSTOMER_GROUPS: '/API_POS_LayDanhSachNhomKhachHang',
      GET_PROVINCES: '/API_POS_LayDanhSachTinhThanh',
      GET_BRANCHES: '/API_POS_LayDanhSachChiNhanh',
      GET_EMPLOYEES: '/API_POS_LayDanhSachNhanVien',
      SEARCH_ITEMS: '/API_POS_TimKiemHangHoa',
      SAVE_ORDER: '/API_POS_LuuDonHang',
      GET_ORDER_STATUSES: '/API_POS_LayDanhSachTrangThaiDonHang',
      GET_PAYMENT_METHODS: '/API_POS_LayDanhSachPhuongThucThanhToan',
      GET_BANKS: '/API_POS_LayDanhSachNganHang'
    }
  }
};

// Đóng băng để tránh bị ghi đè ngoài ý muốn
Object.freeze(window.API_CONFIG);
Object.freeze(window.API_CONFIG.ENDPOINTS);
