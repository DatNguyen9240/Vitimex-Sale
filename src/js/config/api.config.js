/**
 * API Configuration — Vitimex POS
 * Mapping Frontend actions to SQL Stored Procedures
 */
window.API_CONFIG = {
  // Base URL (Theo link bạn cung cấp)
  BASE_URL: 'http://vtmtest.bms79.com/api',

  // Procedures mapping
  METHODS: {
    LOGIN: '/login',
    GET_CUSTOMERS: 'API_POS_LayDanhSachKhachHang',
    GET_USERS: 'API_POS_LayDanhSachNguoiDung',
    GET_BRANCHES: 'API_POS_LayDanhSachChiNhanh',
    GET_EMPLOYEES: 'API_POS_LayDanhSachNhanVien',
    SEARCH_ITEMS: 'API_POS_TimKiemHangHoa',
    SAVE_ORDER: 'API_POS_LuuDonHang',
    GET_PAYMENT_METHODS: 'API_POS_LayDanhSachPhuongThucThanhToan',
    GET_ORDER_STATUSES: 'API_POS_LayDanhSachTrangThaiDonHang'
  }
};
