/**
 * Mock Data Service — Vitimex POS
 * Dữ liệu mẫu cho sản phẩm, khách hàng, phương thức thanh toán
 */
const MOCK = (() => {
  const PRODUCTS = [
    { id: 'SP001', code: 'AMO89SS811', name: 'Áo Sơ mi ngắn tay dáng rộng REGULAR', unit: 'Chiếc', price: 365000, color: 'Trắng', sizes: ['38', '40', '42', '44', '46'], img: null, hot: true },
    { id: 'SP002', code: 'AMO89SS827', name: 'Áo Sơ mi ngắn tay VITIMEX dáng rộng', unit: 'Chiếc', price: 325000, color: 'Đen', sizes: ['38', '40', '42', '44'], img: null, hot: true },
    { id: 'SP003', code: 'ASNN89S784', name: 'Áo Sơ mi ngắn tay MLASN dáng rộng', unit: 'Chiếc', price: 365000, color: 'Xanh Navy', sizes: ['38', '40', '42', '44', '46'], img: null, hot: false },
    { id: 'SP004', code: 'MLASN28S84', name: 'Áo Sơ mi ngắn tay MLASN premium', unit: 'Chiếc', price: 720000, color: 'Trắng tinh', sizes: ['38', '40', '42'], img: null, hot: false },
    { id: 'SP005', code: 'TD88P902',   name: 'Áo Tù cổ điển thời trang', unit: 'Chiếc', price: 516000, color: 'Xanh biển', sizes: ['M', 'L', 'XL'], img: null, hot: true },
    { id: 'SP006', code: 'TRP48SR96',  name: 'Áo Polo classic VITIMEX', unit: 'Chiếc', price: 465000, color: 'Navy', sizes: ['M', 'L', 'XL', 'XXL'], img: null, hot: false },
    { id: 'SP007', code: 'KCO88SK721', name: 'Quần Kaki co giãn 4 chiều', unit: 'Chiếc', price: 469000, color: 'Be/Khaki', sizes: ['28', '30', '32', '34', '36'], img: null, hot: true },
    { id: 'SP008', code: 'SRF525A482', name: 'Quần Sooc thể thao form đẹp', unit: 'Chiếc', price: 329000, color: 'Đen', sizes: ['M', 'L', 'XL'], img: null, hot: false },
    { id: 'SP009', code: 'SRF545A413', name: 'Quần Sooc thể thao VITIMEX V2', unit: 'Chiếc', price: 249000, color: 'Xanh', sizes: ['M', 'L', 'XL'], img: null, hot: false },
    { id: 'SP010', code: 'SRF525A493', name: 'Quần Sooc form xuôi nhẹ', unit: 'Chiếc', price: 252000, color: 'Ghi', sizes: ['M', 'L', 'XL'], img: null, hot: false },
    { id: 'SP011', code: 'TRP48SR24',  name: 'Áo Polo trơn basic', unit: 'Chiếc', price: 489000, color: 'Trắng', sizes: ['M', 'L', 'XL', 'XXL'], img: null, hot: true },
    { id: 'SP012', code: 'TRP52SR66',  name: 'Áo Polo cổ cá tính', unit: 'Chiếc', price: 325000, color: 'Đỏ', sizes: ['M', 'L', 'XL'], img: null, hot: false },
  ];

  const CUSTOMERS = [
    { id: 'KH001', name: 'Nguyễn Văn An', phone: '0901234567' },
    { id: 'KH002', name: 'Trần Thị Bình', phone: '0912345678' },
    { id: 'KH003', name: 'Lê Hoàng Cường', phone: '0923456789' },
    { id: 'KH004', name: 'Phạm Thị Dung', phone: '0934567890' },
    { id: 'KH005', name: 'Huỳnh Minh Đức', phone: '0945678901' },
  ];

  const PAYMENT_METHODS = [
    { id: 'TIENMAT', name: 'Tiền mặt' },
    { id: 'CHUYENKHOAN', name: 'Chuyển khoản' },
    { id: 'THE', name: 'Thẻ ATM/Visa' },
    { id: 'MOMO', name: 'MoMo' },
    { id: 'VNPAY', name: 'VNPay' },
  ];

  const ORDER_STATUSES = [
    { id: 'HOAN_THANH', name: 'Hoàn thành' },
    { id: 'CHO_XU_LY', name: 'Chờ xử lý' },
    { id: 'DANG_GIAO', name: 'Đang giao' },
    { id: 'HUY', name: 'Đã hủy' },
  ];

  return {
    getProducts: () => PRODUCTS,
    getHotProducts: () => PRODUCTS.filter(p => p.hot),
    searchProducts: (q) => {
      if (!q) return PRODUCTS;
      const lower = q.toLowerCase();
      return PRODUCTS.filter(p =>
        p.name.toLowerCase().includes(lower) ||
        p.code.toLowerCase().includes(lower) ||
        p.color.toLowerCase().includes(lower)
      );
    },
    findProduct: (id) => PRODUCTS.find(p => p.id === id),
    searchCustomers: (q) => {
      if (!q) return CUSTOMERS;
      const lower = q.toLowerCase();
      return CUSTOMERS.filter(c =>
        c.name.toLowerCase().includes(lower) || c.phone.includes(q)
      );
    },
    getPaymentMethods: () => PAYMENT_METHODS,
    getOrderStatuses: () => ORDER_STATUSES,
  };
})();
