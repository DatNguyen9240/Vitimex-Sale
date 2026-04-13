/**
 * Order State Manager — Vitimex POS
 * Quản lý trạng thái đa đơn hàng (multi-tab)
 */
const OrderManager = (() => {
  let _orders = [];     // array of order objects
  let _activeId = null; // currently active order ID

  // ── Create a new blank order ────────────────────────────────────────────
  function _newOrder(label) {
    const id = 'order_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5);
    const defLabel = label || ('Đơn hàng ' + (_orders.length + 1));
    return {
      id,
      label: defLabel,
      defaultLabel: defLabel,
      customer: null,
      status: 'HOAN_THANH',
      items: [],          // { product, size, qty, unitPrice, discPct, discAmt, total }
      note: '',
      payments: [{ methodId: 'TIENMAT', amount: 0 }],
      createdAt: new Date(),
    };
  }

  // ── Public API ──────────────────────────────────────────────────────────
  function init() {
    const o = _newOrder('Đơn hàng 1');
    _orders.push(o);
    _activeId = o.id;
  }

  function addOrder() {
    const o = _newOrder();
    _orders.push(o);
    _activeId = o.id;
    return o;
  }

  function removeOrder(id) {
    const idx = _orders.findIndex(o => o.id === id);
    if (idx === -1) return;
    _orders.splice(idx, 1);
    if (_orders.length === 0) {
      const o = _newOrder('Đơn hàng 1');
      _orders.push(o);
    }
    if (_activeId === id) {
      _activeId = _orders[Math.min(idx, _orders.length - 1)].id;
    }
  }

  function setActive(id) { _activeId = id; }

  function getActive() { return _orders.find(o => o.id === _activeId) || _orders[0]; }
  function getOrders() { return _orders; }
  function getActiveId() { return _activeId; }

  // ── Item manipulation ───────────────────────────────────────────────────
  function addItem(product, size) {
    const order = getActive();
    const existing = order.items.find(i => i.product.id === product.id && i.size === size);
    if (existing) {
      existing.qty += 1;
      _recalcItem(existing);
    } else {
      const item = {
        id: 'item_' + Date.now(),
        product,
        size,
        qty: 1,
        unitPrice: product.price,
        discPct: 0,
        discAmt: 0,
        subtotal: product.price,
        total: product.price,
      };
      _recalcItem(item);
      order.items.push(item);
    }
    return order;
  }

  function updateItemQty(orderId, itemId, qty) {
    const order = _orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    item.qty = Math.max(1, parseInt(qty) || 1);
    _recalcItem(item);
  }

  function updateItemDisc(orderId, itemId, discPct) {
    const order = _orders.find(o => o.id === orderId);
    if (!order) return;
    const item = order.items.find(i => i.id === itemId);
    if (!item) return;
    item.discPct = Math.min(100, Math.max(0, parseFloat(discPct) || 0));
    _recalcItem(item);
  }

  function removeItem(orderId, itemId) {
    const order = _orders.find(o => o.id === orderId);
    if (!order) return;
    order.items = order.items.filter(i => i.id !== itemId);
  }

  function _recalcItem(item) {
    item.subtotal = item.qty * item.unitPrice;
    item.discAmt  = Math.round(item.subtotal * item.discPct / 100);
    item.total    = item.subtotal - item.discAmt;
  }

  // ── Bill calculations ───────────────────────────────────────────────────
  function calcOrder(order, opts = {}) {
    const subtotal  = order.items.reduce((s, i) => s + i.total, 0);
    const orderDisc = opts.orderDisc || 0;
    const service   = opts.service   || 0;
    const vat       = opts.vat       || 0;
    const vatAmt    = Math.round((subtotal - orderDisc + service) * vat / 100);
    const total     = subtotal - orderDisc + service + vatAmt;
    const paid      = order.payments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
    const change    = paid - total;  // positive = tiền thừa, negative = nợ
    return { subtotal, orderDisc, service, vat, vatAmt, total, paid, change };
  }

  // ── Payment helpers ─────────────────────────────────────────────────────
  function setPaymentAmount(order, idx, amount) {
    if (order.payments[idx]) {
      order.payments[idx].amount = parseFloat(amount) || 0;
    }
  }
  function addPaymentMethod(order) {
    order.payments.push({ methodId: 'CHUYENKHOAN', amount: 0 });
  }
  function removePaymentMethod(order, idx) {
    if (order.payments.length > 1) order.payments.splice(idx, 1);
  }
  function setPaymentMethod(order, idx, methodId) {
    if (order.payments[idx]) order.payments[idx].methodId = methodId;
  }

  return {
    init, addOrder, removeOrder, setActive, getActive, getOrders, getActiveId,
    addItem, updateItemQty, updateItemDisc, removeItem, calcOrder,
    setPaymentAmount, addPaymentMethod, removePaymentMethod, setPaymentMethod,
  };
})();
