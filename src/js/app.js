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
  let _orderStatuses = [];  // Loaded async

  // ── Initialization ───────────────────────────────────────────────────────
  async function init() {
    OrderManager.init();
    await Promise.all([
      loadProducts(),
      loadMetadata()
    ]);
    
    // Render user info
    const user = AuthService.getUser();
    if (user && user.displayName) {
      $('#current-branch').after(`
        <div class="topbar-user" style="display:flex; align-items:center; gap:6px; margin-left:12px; color:rgba(255,255,255,0.7); font-size:12px;">
          <span style="opacity:0.5;">|</span>
          <span>👤 ${user.displayName}</span>
        </div>
      `);
    }

    renderAll();
    console.log('[Vitimex POS] App initialized with LIVE API ✓');
  }

  async function loadMetadata() {
    try {
      _orderStatuses = await PosService.getOrderStatuses();
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
        <div style="position:relative;height:100%;">
          <div class="pos-watermark">VITIMEX</div>
          <div class="order-empty">
            <div class="empty-icon">🛍️</div>
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
        <div id="customer-dropdown" class="hidden" style="position:relative;z-index:50;"></div>

        <!-- Status -->
        <div class="status-row">
          <label>Trạng thái</label>
          <select id="order-status" class="form-input form-select" style="flex:1;">${statusOpts}</select>
          <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);">${Fmt.datetimeShort()}</span>
        </div>

        <hr class="divider" style="margin-bottom:8px;">

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
          <div class="bill-row">
            <span class="bill-row-label">Mã giảm giá</span>
            <input class="bill-row-input" id="val-voucher" placeholder="Nhập mã..." style="width:90px;">
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
        <div class="bill-row" style="margin-top:4px;">
          <span class="bill-row-label">Tiền khách trả</span>
          <input class="bill-row-input" id="val-customer-cash" type="number" min="0"
            value="${order.payments[0]?.amount || ''}" placeholder="0" style="width:100px;">
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
            <span class="payment-methods-label">💳 Tài khoản</span>
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
        <button class="btn-print" id="btn-print" title="In hóa đơn">🖨️</button>
        <button class="btn-checkout" id="btn-checkout">
          <span>Thanh toán</span>
          <span style="font-size:0.8em;opacity:0.85;">(${Fmt.currency(calc.total)})</span>
        </button>
      </div>`);
  }

  if (_isLoadingQuick) {
    $('#quick-grid').html('<div class="quick-grid-loader">⏳ Đang tải hàng hóa...</div>');
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
      : `<div class="product-card-img-placeholder">👔</div>`;

    return `
        <div class="product-card" data-product-id="${p.id}">
          ${p.hot ? '<span class="product-card-badge">HOT</span>' : ''}
          ${imgHtml}
          <div class="product-card-info">
            <div class="product-card-name">${p.name}</div>
            <div class="product-card-price">${Fmt.currency(p.price)}</div>
          </div>
          <div class="product-card-sizes">${sizeBtns}</div>
        </div>`;
  }).join('');

  $('#quick-grid').html(`
      <div class="quick-grid-header">
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);font-weight:600;">
          ⚡ SẢN PHẨM BÁN NHANH
        </span>
        <span style="font-size:var(--font-size-xs);color:var(--color-text-muted);">(${_quickProducts.length} sản phẩm)</span>
        <div class="pg-info">
          <button class="pg-btn" id="pg-prev" ${_quickPage === 0 ? 'disabled' : ''}>‹</button>
          <span style="font-size:var(--font-size-xs);">${_quickPage + 1} / ${totalPages}</span>
          <button class="pg-btn" id="pg-next" ${_quickPage >= totalPages - 1 ? 'disabled' : ''}>›</button>
        </div>
      </div>
      <div class="quick-grid-body">${cards}</div>`);


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
    $('#btn-checkout').html(`<span>Thanh toán</span><span style="font-size:0.8em;opacity:0.85;">(${Fmt.currency(calc.total)})</span>`);
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
    $(this).css('background', '#000').css('color', '#fff');
    setTimeout(() => $(this).css('background', '').css('color', ''), 300);
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

  $(document).on('input', '#topbar-search-input', function () {
    const q = $(this).val().trim();
    loadProducts(q);
  });

  // ── F1 shortcut ────────────────────────────────────────────────────────────
  $(document).on('keydown', function (e) {
    if (e.key === 'F1') {
      e.preventDefault();
      $('#topbar-search-input').focus().select();
    }
  });

  // ── Customer search ───────────────────────────────────────────────────────
  $(document).on('input', '#customer-search', async function () {
    const q = $(this).val().trim();
    if (!q) { $('#customer-dropdown').addClass('hidden').html(''); return; }

    // In real app, we might call PosService.getCustomers() filter here
    const results = await PosService.getCustomers();
    const filtered = results.filter(c =>
      c.name.toLowerCase().includes(q.toLowerCase()) || c.phone.includes(q)
    );

    if (!filtered.length) { $('#customer-dropdown').addClass('hidden').html(''); return; }

    let html = `<div style="position:absolute;top:0;left:0;right:0;
      background:#fff;border:1px solid var(--color-border);border-radius:var(--radius-md);
      box-shadow:var(--shadow-md);z-index:100;overflow:hidden;">`;
    filtered.slice(0, 5).forEach(c => {
      html += `<div class="customer-dropdown-item" data-cust-id="${c.id}"
        style="padding:8px 12px;cursor:pointer;font-size:var(--font-size-sm);
        border-bottom:1px solid var(--color-border);transition:background 0.12s;"
        onmouseover="this.style.background='#f5f5f5'" onmouseout="this.style.background=''">
        <div style="font-weight:600;">${c.name}</div>
        <div style="color:var(--color-text-muted);font-size:var(--font-size-xs);">${c.phone}</div>
      </div>`;
    });
    html += '</div>';
    $('#customer-dropdown').removeClass('hidden').html(html);
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
    $btn.prop('disabled', true).text('⌛ Đang xử lý...');

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
    Toast.show('🖨️ Đang gửi lệnh in...', '');
  });

  // ────────────────────────────────────────────────────────────────────────
  //  INITIAL RENDER
  // ────────────────────────────────────────────────────────────────────────
  init();
});
