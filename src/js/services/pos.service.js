/**
 * POS Service — Vitimex POS
 * High-level data fetching methods for the UI
 */
window.PosService = (function () {
  'use strict';

  const EP = window.API_CONFIG.ENDPOINTS.POS;

  /** Search products from SQL */
  async function searchProducts(searchTerm = '', branchId = '') {
    const user = AuthService.getUser();
    try {
      const res = await Http.post(EP.SEARCH_ITEMS, {
        ChiNhanhID: user.BranchID || branchId || '',
        UserName: user.UserName || '',
        TuKhoaTimKiem: searchTerm
      }, { silent: true });
      const rows = res.data || res.records || [];

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
      const res = await Http.get(EP.GET_CUSTOMERS, {}, { silent: true });
      const rows = res.data || res.records || [];
      return rows.map(r => {
        const phone = r.Phone || r.ObjectID || '';
        let name = r.ObjectName || '';
        if (!name || name === '-' || name === '?') {
          name = phone;
        }
        return {
          id: r.ObjectID,
          name: name,
          phone: phone,
          birthday: r.NgaySinh || ''
        };
      });
    } catch (e) {
      return [];
    }
  }

  /** Get customer groups from SQL */
  async function getCustomerGroups() {
    try {
      const res = await Http.get(EP.GET_CUSTOMER_GROUPS, {}, { silent: true });
      const rows = res.data || res.records || [];
      return rows.map(r => ({
        id: r.ObjectGroupID,
        name: r.ObjectGroupName
      }));
    } catch (e) {
      return [];
    }
  }

  /** Get provinces from SQL */
  async function getProvinces() {
    try {
      const res = await Http.get(EP.GET_PROVINCES, {}, { silent: true });
      return res.data || res.records || [];
    } catch (e) {
      return [];
    }
  }

  /** Create a new customer */
  async function addCustomer(customerData) {
    const user = AuthService.getUser();
    return await Http.post(EP.CREATE_CUSTOMER, {
      ...customerData,
      UserName: user.UserName || 'admin'
    });
  }

  /** Get branches */
  async function getBranches() {
    const user = AuthService.getUser();
    try {
      const res = await Http.get(EP.GET_BRANCHES, {
        UserName: user.UserName || ''
      });
      return res.data || res.records || [];
    } catch (e) {
      return [];
    }
  }

  /** Get employees */
  async function getEmployees() {
    try {
      const res = await Http.get(EP.GET_EMPLOYEES, {}, { silent: true });
      return res?.data || res?.records || [];
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

    return await Http.post(EP.SAVE_ORDER, {
      DuLieuDonHang: JSON.stringify(payload)
    });
  }

  /** Get order statuses */
  async function getOrderStatuses() {
    try {
      const res = await Http.get(EP.GET_ORDER_STATUSES, {}, { silent: true });
      const rows = res?.data || res?.records || [];
      return rows.map(r => ({
        id: r.id || r.ID || '',
        name: r.name || r.Name || ''
      }));
    } catch (e) {
      return [];
    }
  }

  /** Get payment methods */
  async function getPaymentMethods() {
    try {
      const res = await Http.get(EP.GET_PAYMENT_METHODS, {}, { silent: true });
      const rows = res?.data || res?.records || [];
      return rows.map(r => ({
        id: r.id || r.ID || '',
        name: r.name || r.Name || ''
      }));
    } catch (e) {
      return [];
    }
  }

  /** Get bank list */
  async function getBanks() {
    try {
      const res = await Http.get(EP.GET_BANKS, {}, { silent: true });
      const rows = res?.data || res?.records || [];
      return rows.map(r => ({
        id: (r.id || r.ID || '').toString().trim(),
        name: r.name || r.Name || ''
      }));
    } catch (e) {
      return [];
    }
  }

  return {
    searchProducts,
    getCustomers,
    getCustomerGroups,
    getProvinces,
    addCustomer,
    getBranches,
    getEmployees,
    saveOrder,
    getOrderStatuses,
    getPaymentMethods,
    getBanks
  };
})();
