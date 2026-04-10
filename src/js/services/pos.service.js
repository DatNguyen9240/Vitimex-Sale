/**
 * POS Service — Vitimex POS
 * High-level data fetching methods for the UI
 */
window.PosService = (function () {
  'use strict';

  const METHODS = window.API_CONFIG.METHODS;

  /** Search products from SQL */
  async function searchProducts(searchTerm = '', branchId = 'HN01') {
    try {
      const res = await HttpService.execute(METHODS.SEARCH_ITEMS, {
        ChiNhanhID: branchId,
        TuKhoaTimKiem: searchTerm
      });
      const rows = res.data || [];

      // Map SQL rows to UI product objects
      return rows.map(r => ({
        id: r.ItemID,
        code: r.ItemID,
        name: r.ItemName,
        unit: r.Unit,
        price: r.UnitPrice,
        discPct: r.PhanTramGiamGia || 0,
        sizes: r.Size ? r.Size.split(';') : ['F'],
        color: r.MauSac,
        hot: r.IsHot || false
      }));
    } catch (e) {
      return [];
    }
  }

  /** Get customers from SQL */
  async function getCustomers() {
    try {
      const res = await HttpService.execute(METHODS.GET_CUSTOMERS);
      const rows = res.data || [];
      return rows.map(r => ({
        id: r.ObjectID,
        name: r.ObjectName,
        phone: r.Phone || '', // Assuming SQL might return phone
        birthDate: r.NgaySinh
      }));
    } catch (e) {
      return [];
    }
  }

  /** Get branches */
  async function getBranches(userName = '') {
    try {
      const res = await HttpService.execute(METHODS.GET_BRANCHES, { UserName: userName });
      return res.data || [];
    } catch (e) {
      return [];
    }
  }

  /** Get employees */
  async function getEmployees() {
    try {
      const res = await HttpService.execute(METHODS.GET_EMPLOYEES);
      return res.data || [];
    } catch (e) {
      return [];
    }
  }

  /** Save Order to SQL */
  async function saveOrder(order, opts) {
    const calc = OrderManager.calcOrder(order, opts);
    const payload = {
      header: {
        orderId: order.id,
        customerId: order.customer?.id,
        subtotal: calc.subtotal,
        discount: calc.totalDiscount,
        total: calc.total,
        status: order.status,
        note: $('#order-note').val() || ''
      },
      items: order.items.map(item => ({
        itemId: item.product.id,
        qty: item.qty,
        unitPrice: item.unitPrice,
        discPct: item.discPct
      })),
      payments: order.payments
    };

    return await HttpService.execute(METHODS.SAVE_ORDER, {
      DuLieuDonHang: JSON.stringify(payload)
    });
  }

  /** Get payment methods */
  async function getPaymentMethods() {
    try {
      const res = await HttpService.execute(METHODS.GET_PAYMENT_METHODS);
      return res.data || [];
    } catch (e) {
      return [{ id: 'TIENMAT', name: 'Tiền mặt' }];
    }
  }

  /** Get order statuses */
  async function getOrderStatuses() {
    try {
      const res = await HttpService.execute(METHODS.GET_ORDER_STATUSES);
      return res.data || [];
    } catch (e) {
      return [{ id: 'HOAN_THANH', name: 'Hoàn thành' }];
    }
  }

  return {
    searchProducts,
    getCustomers,
    getBranches,
    getEmployees,
    saveOrder,
    getPaymentMethods,
    getOrderStatuses
  };
})();
