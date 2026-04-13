/**
 * Vitimex POS — Main App
 * Single-page POS: multi-order tabs, product table, payment sidebar, quick-grid
 * Uses Cash.js for DOM manipulation
 */
$(function () {
  'use strict';

  // ── Listen for external re-render triggers ────────────────────────────────
  document.addEventListener('vitimex:rerender', function () {
    renderAll();
    updateTotals();
  });

  // ── Quick-grid pagination ────────────────────────────────────────────────
  let _quickPage = 0;
  const QUICK_PAGE_SIZE = 10;
  let _quickProducts = []; // Loaded async
  let _isLoadingQuick = false;

  // ── Customer search dropdown ─────────────────────────────────────────────
  let _customerDropdownVisible = false;
  let _orderStatuses = [];
  let _paymentMethods = [];

  // ── View Options per tab ─────────────────────────────────────────────────
  // Stores { orderDisc, service, vat } per orderId
  const _displayOpts = {};

  /** Helper to get display options for an order */
  function getOpts(id) {
    if (!_displayOpts[id]) {
      _displayOpts[id] = { orderDisc: 0, service: 0, vat: 0 };
    }
    return _displayOpts[id];
  }

  // ── Initialization ───────────────────────────────────────────────────────
  async function init() {
    OrderManager.init();
    await Promise.all([
      loadProducts(),
      loadMetadata()
    ]).catch(err => {
      console.error('[App] Initialization error:', err);
    });

    // Sync user info to UI (Medstand Pattern)
    AuthService.syncUserDisplay('#current-branch');
    $('.branch-icon').text('👤');

    renderAll();
    console.log('[Vitimex POS] App initialized with LIVE API ✓');
  }

  async function loadMetadata() {
    try {
      const [statuses, methods] = await Promise.all([
        PosService.getOrderStatuses(),
        PosService.getPaymentMethods()
      ]);
      _orderStatuses = statuses;
      _paymentMethods = methods;
    } catch (e) {
      console.error('[App] Failed to load metadata:', e);
    }
  }

  async function loadProducts(q = '') {
    _isLoadingQuick = true;
    renderQuickGrid(); // Show loader
    _quickProducts = await PosService.searchProducts(q);
    _isLoadingQuick = false;
    _quickPage = 0;
    renderQuickGrid();
  }

  // ────────────────────────────────────────────────────────────────────────
  //  RENDER FUNCTIONS
  // ────────────────────────────────────────────────────────────────────────

  /** Render all tabs in #tab-nav */
  function renderTabs() {
    const orders = OrderManager.getOrders();
    const activeId = OrderManager.getActiveId();
    let html = '';
    orders.forEach(o => {
      html += `
        <div class="tab-item ${o.id === activeId ? 'active' : ''}" data-tab-id="${o.id}">
          <span class="tab-name">${o.label}</span>
          <button class="tab-close" data-tab-close="${o.id}" title="Đóng đơn">✕</button>
        </div>`;
    });
    html += `<button class="tab-add" id="btn-add-tab" title="Thêm đơn hàng mới">＋</button>`;
    $('#tab-nav').html(html);
  }

  /** Render order items table */
  function renderOrderTable() {
    const order = OrderManager.getActive();
    const $wrap = $('#order-table-wrap');

    if (!order || order.items.length === 0) {
      $wrap.html(`
        <div class="order-table-empty-wrap">
          <div class="order-empty">
            <div class="empty-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>
            </div>
            <div class="empty-text">Chưa có mặt hàng nào trong danh sách</div>
            <div class="empty-hint">Sử dụng thanh tìm kiếm <kbd>F1</kbd> hoặc chọn sản phẩm bên dưới</div>
          </div>
        </div>`);
      return;
    }

    let rows = '';
    order.items.forEach((item, idx) => {
      rows += `
        <tr data-item-id="${item.id}">
          <td class="row-num">
            <span class="row-idx">${idx + 1}</span>
            <button class="row-del" data-del="${item.id}" title="Xóa dòng">×</button>
          </td>
          <td>${item.product.code}</td>
          <td title="${item.product.name}">${item.product.name}</td>
          <td class="center">${item.product.unit}</td>
          <td class="center">${item.size || '—'}</td>
          <td class="center">
            <input class="qty-input" type="number" min="1"
              data-qty-item="${item.id}" value="${item.qty}">
          </td>
          <td class="num">${Fmt.currency(item.unitPrice)}</td>
          <td class="num">${Fmt.currency(item.subtotal)}</td>
          <td class="center">
            <input class="disc-input" type="number" min="0" max="100"
              data-disc-item="${item.id}" value="${item.discPct}">%
          </td>
          <td class="num text-accent">${item.discPct > 0 ? Fmt.currency(item.discAmt) : '—'}</td>
          <td class="num text-bold">${Fmt.currency(item.total)}</td>
        </tr>`;
    });

    $wrap.html(`
      <table class="order-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Mã hàng</th>
            <th>Tên hàng / dịch vụ</th>
            <th>ĐVT</th>
            <th>Size</th>
            <th>Số lượng</th>
            <th>Đơn giá</th>
            <th>Số tiền</th>
            <th>% Giảm/CK</th>
            <th>Giảm giá/CK</th>
            <th>Tổng tiền</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`);
  }

  /** Render payment sidebar */
  function renderPaymentSidebar() {
    const order = OrderManager.getActive();
    if (!order) return;
    const opts = getOpts(order.id);
    const calc = OrderManager.calcOrder(order, opts);
    const methods = _paymentMethods;
    const statuses = _orderStatuses;

    // customer info
    const custName = order.customer ? order.customer.name : '';

    // Status options
    const statusOpts = statuses.map(s =>
      `<option value="${s.id}" ${order.status === s.id ? 'selected' : ''}>${s.name}</option>`
    ).join('');

    // Payment method rows
    let payRows = '';
    order.payments.forEach((pay, idx) => {
      const opts2 = methods.map(m =>
        `<option value="${m.id}" ${pay.methodId === m.id ? 'selected' : ''}>${m.name}</option>`
      ).join('');
      payRows += `
        <div class="payment-method-item" data-pay-idx="${idx}">
          <select class="form-input form-select pay-method-select" data-pay-method="${idx}">${opts2}</select>
          <input class="form-input pay-method-amount" type="number" min="0"
            data-pay-amount="${idx}" value="${pay.amount || ''}" placeholder="Số tiền">
          <button class="pay-method-del" data-pay-del="${idx}" title="Xóa">×</button>
        </div>`;
    });

    // Change/Debt display
    const changeClass = calc.change >= 0 ? 'positive' : 'negative';
    const changeLabel = calc.change >= 0 ? 'Tiền thừa' : 'Tiền khách nợ';

    $('#payment-sidebar').html(`
      <div class="payment-body">
        <!-- Customer -->
        <div class="customer-search-wrap">
          <input id="customer-search" class="form-input" placeholder="Tìm khách hàng (tên, SĐT)..."
            value="${custName}" autocomplete="off">
          <button class="btn-add-customer" id="btn-add-customer" title="Thêm khách mới">+</button>
        </div>
        <div id="customer-dropdown" class="customer-dropdown hidden"></div>

        <!-- Status -->
        <div class="status-row">
          <label>Trạng thái</label>
          <select id="order-status" class="form-input form-select status-row-select">${statusOpts}</select>
        </div>

        <hr class="divider sidebar-divider">

        <!-- Bill rows -->
        <div class="bill-rows">
          <div class="bill-row">
            <span class="bill-row-label">Tổng tiền hàng</span>
            <span class="bill-row-value" id="val-subtotal">${Fmt.currency(calc.subtotal)}</span>
          </div>
          <div class="bill-row">
            <span class="bill-row-label">Điểm thưởng</span>
            <input class="bill-row-input" id="val-points" type="number" min="0" value="0" placeholder="0">
          </div>
          <div class="bill-row bill-row-voucher-wrap">
            <input class="bill-row-voucher-input" id="val-voucher" placeholder="Nhập mã giảm giá...">
            <span class="bill-row-value" id="val-voucher-amt">—</span>
          </div>
          <div class="bill-row">
            <span class="bill-row-label">Chiết khấu (₫)</span>
            <input class="bill-row-input" id="val-orderdisc" type="number" min="0"
              value="${opts.orderDisc || ''}" placeholder="0">
          </div>
          <div class="bill-row">
            <span class="bill-row-label">
              Phụ thu dịch vụ
              <button class="bill-btn-add" id="btn-add-service" title="Thêm phụ thu">+</button>
            </span>
            <input class="bill-row-input" id="val-service" type="number" min="0"
              value="${opts.service || ''}" placeholder="0">
          </div>
          <div class="bill-row">
            <span class="bill-row-label">
              VAT (%)
              <button class="bill-btn-add" id="btn-add-vat" title="Thêm VAT">+</button>
            </span>
            <input class="bill-row-input" id="val-vat" type="number" min="0" max="100"
              value="${opts.vat || ''}" placeholder="0">
          </div>
        </div>

        <!-- TOTAL -->
        <div class="bill-total-row">
          <span class="bill-total-label">Tổng cộng</span>
          <span class="bill-total-value" id="val-total">${Fmt.currency(calc.total)}</span>
        </div>

        <!-- Customer cash input -->
        <div class="bill-row bill-row-cash">
          <span class="bill-row-label">Tiền khách trả</span>
          <input class="bill-row-input" id="val-customer-cash" type="number" min="0"
            value="${order.payments[0]?.amount || ''}" placeholder="0">
        </div>

        <!-- Denomination buttons -->
        <div class="denomination-wrap">
          <div class="denomination-label">Chọn nhanh mệnh giá</div>
          <div class="denomination-btns">
            ${[1, 2, 5, 10, 20, 50, 100, 200, 500].map(v =>
      `<button class="denom-btn" data-denom="${v * 1000}">${v}k</button>`
    ).join('')}
          </div>
        </div>

        <hr class="divider" style="margin: 8px 0;">

        <!-- Payment methods -->
        <div class="payment-methods">
          <div class="payment-methods-header">
            <span class="payment-methods-label" style="display:flex;align-items:center;gap:6px;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
              Tài khoản
            </span>
            <button class="btn-ghost btn-sm" id="btn-add-payment">+ Thêm</button>
          </div>
          <div id="payment-method-list">${payRows}</div>
        </div>
      </div>

      <!-- Change / Debt -->
      <div class="change-row">
        <span class="change-label">${changeLabel}</span>
        <span class="change-value ${changeClass}" id="val-change">${Fmt.currency(Math.abs(calc.change))}</span>
      </div>

      <!-- Action buttons -->
      <div class="payment-actions">
        <button class="btn-print" id="btn-print" title="In hóa đơn">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        </button>
        <button class="btn-checkout" id="btn-checkout">
          <span>Thanh toán</span>
          <span class="btn-checkout-sub">(${Fmt.currency(calc.total)})</span>
        </button>
      </div>`);
  }

  /** Render quick-select product grid */
  function renderQuickGrid() {
    if (_isLoadingQuick) {
      $('#quick-grid').html('<div class="quick-grid-loader"><svg class="spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg> Đang tải hàng hóa...</div>');
      return;
    }

    const start = _quickPage * QUICK_PAGE_SIZE;
    const pageProducts = _quickProducts.slice(start, start + QUICK_PAGE_SIZE);
    const totalPages = Math.max(1, Math.ceil(_quickProducts.length / QUICK_PAGE_SIZE));

    const cards = pageProducts.map(p => {
      const sizeBtns = p.sizes.map(s =>
        `<button class="size-btn" data-product-id="${p.id}" data-size="${s}">${s}</button>`
      ).join('');
      const imgHtml = p.img
        ? `<img class="product-card-img" src="${p.img}" alt="${p.name}" loading="lazy">`
        : `<div class="product-card-img-placeholder">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.62 1.96V21a1 1 0 001 1h18a1 1 0 001-1V5.42a2 2 0 00-1.62-1.96z"></path><path d="M10 22V7"></path><path d="M14 22V7"></path><path d="M12 7V2"></path></svg>
           </div>`;

      return `
        <div class="product-card" data-product-id="${p.id}">
          <div class="product-card-price">${Fmt.currency(p.price)}</div>
          ${p.hot ? '<span class="product-card-badge">HOT</span>' : ''}
          ${imgHtml}
          <div class="product-card-info">
            <div class="product-card-name">${p.name}</div>
          </div>
          <div class="product-card-sizes">${sizeBtns}</div>
        </div>`;
    }).join('');

    const nowStr = new Date().toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const order = OrderManager.getActive();
    const orderCode = order ? (order.code || '') : ''; // Chỉ hiện code thực tế

    $('#quick-grid').html(`
      <div class="qgt-toolbar">
        <input class="qgt-order-code" id="qgt-order-code" placeholder="Tự động tạo mã (Đơn hàng)" value="${orderCode}" autocomplete="off">

        <div class="qgt-vsep"></div>

        <button class="qgt-btn" id="btn-qgt-note">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Ghi chú
        </button>

        <span class="qgt-datetime" id="qgt-datetime">${nowStr}</span>

        <div class="qgt-vsep"></div>

        <button class="qgt-icon-btn" title="Lịch">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        </button>
        <button class="qgt-icon-btn" title="Lịch sử">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </button>

        <div class="qgt-vsep"></div>

        <button class="pg-btn" id="pg-prev" ${_quickPage === 0 ? 'disabled' : ''}>‹</button>
        <span class="qgt-page-num">${_quickPage + 1} / ${totalPages}</span>
        <button class="pg-btn" id="pg-next" ${_quickPage >= totalPages - 1 ? 'disabled' : ''}>›</button>

        <div class="qgt-vsep"></div>

        <button class="qgt-icon-btn" title="In hóa đơn">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        </button>
        <button class="qgt-icon-btn qgt-icon-btn-accent" title="Tùy chọn">
          <svg width="11" height="11" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1 5 5 9 1"/></svg>
        </button>
      </div>
      <div class="quick-grid-body">${cards}</div>`);
  }


  /** Full re-render everything */
  function renderAll() {
    renderTabs();
    renderOrderTable();
    renderPaymentSidebar();
    renderQuickGrid();
  }

  /** Only update bill totals without full re-render */
  function updateTotals() {
    const order = OrderManager.getActive();
    if (!order) return;
    const opts = getOpts(order.id);
    const calc = OrderManager.calcOrder(order, opts);
    $('#val-subtotal').text(Fmt.currency(calc.subtotal));
    $('#val-total').text(Fmt.currency(calc.total));
    const changeClass = calc.change >= 0 ? 'positive' : 'negative';
    const changeLabel = calc.change >= 0 ? 'Tiền thừa' : 'Tiền khách nợ';
    $('.change-label').text(changeLabel);
    $('#val-change').removeClass('positive negative').addClass(changeClass).text(Fmt.currency(Math.abs(calc.change)));
    $('#btn-checkout').html(`<span>Thanh toán</span><span class="btn-checkout-sub">(${Fmt.currency(calc.total)})</span>`);
    // Sync mobile FAB
    document.dispatchEvent(new CustomEvent('vitimex:fab-update', { detail: { total: Fmt.currency(calc.total) } }));
  }

  // ────────────────────────────────────────────────────────────────────────
  //  EVENT DELEGATION
  // ────────────────────────────────────────────────────────────────────────

  // ── Tab management ───────────────────────────────────────────────────────
  $(document).on('click', '[data-tab-id]', function (e) {
    if ($(e.target).closest('[data-tab-close]').length) return; // handled below
    const id = $(this).data('tab-id');
    OrderManager.setActive(id);
    renderAll();
  });

  $(document).on('click', '[data-tab-close]', function (e) {
    e.stopPropagation();
    const id = $(this).data('tab-close');
    OrderManager.removeOrder(id);
    renderAll();
  });

  $(document).on('click', '#btn-add-tab', function () {
    OrderManager.addOrder();
    renderAll();
    // Scroll tabs to end
    const nav = document.getElementById('tab-nav');
    if (nav) nav.scrollLeft = nav.scrollWidth;
  });

  // ── Product table — qty change ────────────────────────────────────────────
  $(document).on('change', '[data-qty-item]', function () {
    const itemId = $(this).data('qty-item');
    const qty = $(this).val();
    OrderManager.updateItemQty(OrderManager.getActiveId(), itemId, qty);
    renderOrderTable();
    updateTotals();
  });

  // ── Product table — discount change ──────────────────────────────────────
  $(document).on('change', '[data-disc-item]', function () {
    const itemId = $(this).data('disc-item');
    const discPct = $(this).val();
    OrderManager.updateItemDisc(OrderManager.getActiveId(), itemId, discPct);
    renderOrderTable();
    updateTotals();
  });

  // ── Product table — delete row ────────────────────────────────────────────
  $(document).on('click', '[data-del]', function () {
    const itemId = $(this).data('del');
    OrderManager.removeItem(OrderManager.getActiveId(), itemId);
    renderOrderTable();
    updateTotals();
  });

  // ── Quick-grid — size button click (add to order) ─────────────────────────
  $(document).on('click', '.size-btn', function (e) {
    e.stopPropagation();
    const productId = $(this).data('product-id');
    const size = $(this).data('size');
    const product = _quickProducts.find(p => p.id === productId);
    if (!product) return;
    OrderManager.addItem(product, size);
    renderOrderTable();
    updateTotals();
    const $this = $(this);
    $this.addClass('active-flash');
    setTimeout(() => $this.removeClass('active-flash'), 300);
    Toast.success(`Đã thêm ${product.name} (${size})`);
  });

  // ── Quick-grid — card click (add default size) ────────────────────────────
  $(document).on('click', '.product-card', function (e) {
    if ($(e.target).closest('.size-btn').length) return;
    const productId = $(this).data('product-id');
    const product = _quickProducts.find(p => p.id === productId);
    if (!product) return;
    const size = product.sizes[0] || '';
    OrderManager.addItem(product, size);
    renderOrderTable();
    updateTotals();
    Toast.success(`Đã thêm ${product.name} (${size})`);
  });

  // ── Quick grid — pagination ────────────────────────────────────────────────
  $(document).on('click', '#pg-prev', function () {
    if (_quickPage > 0) { _quickPage--; renderQuickGrid(); }
  });
  $(document).on('click', '#pg-next', function () {
    const total = Math.ceil(_quickProducts.length / QUICK_PAGE_SIZE);
    if (_quickPage < total - 1) { _quickPage++; renderQuickGrid(); }
  });

  // ── Topbar Search (Dropdown Predictive) ────────────────────────────────────
  let _topSearchTimeout = null;
  $(document).on('input', '#topbar-search-input', function () {
    const q = $(this).val().trim();
    clearTimeout(_topSearchTimeout);
    _topSearchTimeout = setTimeout(async () => {
      const dd = $('#topbar-search-dropdown');
      if (!q) { dd.addClass('hidden').html(''); return; }
      
      const results = await PosService.searchProducts(q);
      if (!results.length) { dd.addClass('hidden').html(''); return; }

      let html = '';
      // Limit to 6 items to keep dropdown compact
      results.slice(0, 6).forEach(p => {
        const imgHtml = p.img 
          ? `<img class="ts-item-img" src="${p.img}">` 
          : `<div class="ts-item-img" style="display:flex;align-items:center;justify-content:center;font-size:10px;">IMG</div>`;
        html += `
          <div class="topbar-search-item" data-search-prod-id="${p.id}">
            ${imgHtml}
            <div class="ts-item-info">
              <span class="ts-item-name">${p.name}</span>
              <span class="ts-item-code">${p.code}</span>
            </div>
            <div class="ts-item-price">${Fmt.currency(p.price)}</div>
          </div>
        `;
      });
      dd.removeClass('hidden').html(html);
    }, 300);
  });

  // Chọn sản phẩm từ Dropdown
  $(document).on('click', '[data-search-prod-id]', async function () {
    const pId = $(this).data('search-prod-id');
    try {
      const prod = await PosService.getProductDetails(pId);
      const activeId = OrderManager.getActiveId();
      // Mặc định chọn size đầu tiên nếu có để Add nhanh
      const size = prod.sizes && prod.sizes.length > 0 ? prod.sizes[0] : '';
      OrderManager.addItem(activeId, prod, size);
      
      // Update UI
      renderOrderTable();
      updateTotals();
      
      // Đóng dropdown & dọn input
      $('#topbar-search-input').val('');
      $('#topbar-search-dropdown').addClass('hidden').html('');
      Toast.success(`Đã thêm ${prod.name}`);
    } catch(e) {}
  });

  // Đóng dropdown khi click ra ngoài
  $(document).on('click', function (e) {
    if (!$(e.target).closest('.topbar-search').length) {
      $('#topbar-search-dropdown').addClass('hidden');
    }
  });

  // ── F1 shortcut ────────────────────────────────────────────────────────────
  window.addEventListener('keydown', function (e) {
    if (e.key === 'F1' || e.keyCode === 112) {
      e.preventDefault();
      const searchInput = document.getElementById('topbar-search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  });

  // ── Customer search ───────────────────────────────────────────────────────
  let _custSearchTimeout = null;
  $(document).on('input', '#customer-search', function () {
    const q = $(this).val().trim();
    clearTimeout(_custSearchTimeout);
    _custSearchTimeout = setTimeout(async () => {
      if (!q) { $('#customer-dropdown').addClass('hidden').html(''); return; }

      // In real app, we might call PosService.getCustomers() filter here
      const results = await PosService.getCustomers();
      const filtered = results.filter(c =>
        c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
      );

      if (!filtered.length) { $('#customer-dropdown').addClass('hidden').html(''); return; }

      let html = `<div class="customer-dropdown-results">`;
      filtered.slice(0, 5).forEach(c => {
        html += `
        <div class="customer-item" data-cust-id="${c.id}">
          <div class="customer-name-label">${c.name}</div>
          <div class="customer-phone-label">${c.phone}</div>
        </div>`;
      });
      html += '</div>';
      $('#customer-dropdown').removeClass('hidden').html(html);
    }, 300);
  });

  $(document).on('click', '[data-cust-id]', async function () {
    const custId = $(this).data('cust-id');
    const custs = await PosService.getCustomers();
    const cust = custs.find(c => c.id === custId);
    if (cust) {
      OrderManager.getActive().customer = cust;
      $('#customer-search').val(cust.name);
      $('#customer-dropdown').addClass('hidden').html('');
      Toast.success(`Đã chọn khách: ${cust.name}`);
    }
  });

  $(document).on('click', function (e) {
    if (!$(e.target).closest('#customer-search, #customer-dropdown').length) {
      $('#customer-dropdown').addClass('hidden');
    }
  });

  // ── Order status ───────────────────────────────────────────────────────────
  $(document).on('change', '#order-status', function () {
    const order = OrderManager.getActive();
    if (order) order.status = $(this).val();
  });

  // ── Bill inputs ────────────────────────────────────────────────────────────
  $(document).on('input', '#val-orderdisc', function () {
    const opts = getOpts(OrderManager.getActiveId());
    opts.orderDisc = parseFloat($(this).val()) || 0;
    updateTotals();
  });
  $(document).on('input', '#val-service', function () {
    const opts = getOpts(OrderManager.getActiveId());
    opts.service = parseFloat($(this).val()) || 0;
    updateTotals();
  });
  $(document).on('input', '#val-vat', function () {
    const opts = getOpts(OrderManager.getActiveId());
    opts.vat = parseFloat($(this).val()) || 0;
    updateTotals();
  });

  // ── Customer cash input ────────────────────────────────────────────────────
  $(document).on('input', '#val-customer-cash', function () {
    const order = OrderManager.getActive();
    OrderManager.setPaymentAmount(order, 0, $(this).val());
    updateTotals();
  });

  // ── Denomination buttons ──────────────────────────────────────────────────
  $(document).on('click', '.denom-btn', function () {
    const v = parseInt($(this).data('denom'));
    const order = OrderManager.getActive();
    const cur = parseFloat(order.payments[0]?.amount || 0);
    const newVal = cur + v;
    OrderManager.setPaymentAmount(order, 0, newVal);
    $('#val-customer-cash').val(newVal);
    updateTotals();
  });

  // ── Payment methods ────────────────────────────────────────────────────────
  $(document).on('click', '#btn-add-payment', function () {
    const order = OrderManager.getActive();
    OrderManager.addPaymentMethod(order);
    renderPaymentSidebar();
  });
  $(document).on('click', '[data-pay-del]', function () {
    const idx = parseInt($(this).data('pay-del'));
    const order = OrderManager.getActive();
    OrderManager.removePaymentMethod(order, idx);
    renderPaymentSidebar();
  });
  $(document).on('change', '[data-pay-method]', function () {
    const idx = parseInt($(this).data('pay-method'));
    const order = OrderManager.getActive();
    OrderManager.setPaymentMethod(order, idx, $(this).val());
  });
  $(document).on('input', '[data-pay-amount]', function () {
    const idx = parseInt($(this).data('pay-amount'));
    const order = OrderManager.getActive();
    OrderManager.setPaymentAmount(order, idx, $(this).val());
    updateTotals();
  });

  // ── Checkout ───────────────────────────────────────────────────────────────
  $(document).on('click', '#btn-checkout', async function () {
    const order = OrderManager.getActive();
    const opts = getOpts(order.id);
    const calc = OrderManager.calcOrder(order, opts);
    if (order.items.length === 0) { Toast.error('Đơn hàng chưa có sản phẩm!'); return; }
    if (calc.change < 0) { Toast.error('Khách chưa thanh toán đủ!'); return; }

    const $btn = $(this);
    $btn.prop('disabled', true).html(`
      <svg class="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-right:8px;"><line x1="12" y1="2" x2="12" y2="6"></line><line x1="12" y1="18" x2="12" y2="22"></line><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line><line x1="2" y1="12" x2="6" y2="12"></line><line x1="18" y1="12" x2="22" y2="12"></line><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line></svg>
      Đang xử lý...
    `);

    try {
      await PosService.saveOrder(order, opts);
      Toast.success(`✅ Thanh toán thành công! ${Fmt.currency(calc.total)}`);
      // Reset order
      order.items = [];
      order.payments = [{ methodId: 'TIENMAT', amount: 0 }];
      order.customer = null;
      _displayOpts[order.id] = { orderDisc: 0, service: 0, vat: 0 };
      renderAll();
    } catch (e) {
      Toast.error('❌ Lỗi khi lưu đơn hàng!');
    } finally {
      $btn.prop('disabled', false);
      updateTotals();
    }
  });

  // ── Quick grid — order code sync ──────────────────────────────────────────
  $(document).on('input', '#qgt-order-code', function () {
    const order = OrderManager.getActive();
    if (order) {
      const val = $(this).val();
      order.code = val;
      // Nếu xóa mã, quay lại nhãn mặc định (có số) thay vì chữ "Đơn hàng" trống
      order.label = val || order.defaultLabel || 'Đơn hàng';
      renderTabs(); // Cập nhật UI tab ngay lập tức
    }
  });

  // ── Logout ─────────────────────────────────────────────────────────────────
  $(document).on('click', '#btn-logout', function () {
    Swal.fire({
      title: 'Xác nhận đăng xuất?',
      text: "Phiên làm việc của bạn sẽ kết thúc.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#C42027',
      cancelButtonColor: '#444',
      confirmButtonText: 'Đăng xuất ngay',
      cancelButtonText: 'Hủy',
      background: 'var(--color-surface)',
      color: 'var(--color-text)'
    }).then((result) => {
      if (result.isConfirmed) {
        AuthService.logout();
      }
    });
  });

  // ── Print ──────────────────────────────────────────────────────────────────
  $(document).on('click', '#btn-print', function () {
    Toast.show('Đang gửi lệnh in...', '');
  });

  // ────────────────────────────────────────────────────────────────────────
  //  INITIAL RENDER
  // ────────────────────────────────────────────────────────────────────────
  init();
});
