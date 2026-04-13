/**
 * TopbarDropdown — Custom dropdown cho topbar Vitimex POS
 * Thay thế <select class="topbar-select"> bằng custom UI đẹp hơn
 */
; (function () {
  'use strict';

  // SVG caret icon
  const CARET_SVG = `<svg class="tb-dropdown-caret" viewBox="0 0 10 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="1 1 5 5 9 1"/></svg>`;

  /**
   * Chuyển đổi 1 <select class="topbar-select"> thành custom dropdown
   */
  function createDropdown(selectEl) {
    const options = Array.from(selectEl.options);
    const label = selectEl.dataset.label || null; // optional header label
    const id = selectEl.id || null;

    // Wrapper
    const wrapper = document.createElement('div');
    wrapper.className = 'tb-dropdown';
    if (id) wrapper.id = 'dd-' + id;

    // Track selected index
    let selectedIdx = selectEl.selectedIndex >= 0 ? selectEl.selectedIndex : 0;

    // ── Trigger button ──────────────────────────────────────
    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'tb-dropdown-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const labelSpan = document.createElement('span');
    labelSpan.textContent = options[selectedIdx]?.text || '';
    trigger.appendChild(labelSpan);
    trigger.insertAdjacentHTML('beforeend', CARET_SVG);

    // ── Menu panel ───────────────────────────────────────────
    const menu = document.createElement('div');
    menu.className = 'tb-dropdown-menu';
    menu.setAttribute('role', 'listbox');

    // Optional header
    if (label) {
      const hdr = document.createElement('div');
      hdr.className = 'tb-dropdown-header';
      hdr.textContent = label;
      menu.appendChild(hdr);
    }

    // Items
    function renderItems() {
      menu.querySelectorAll('.tb-dropdown-item').forEach(el => el.remove());
      options.forEach((opt, idx) => {
        if (opt.dataset.divider !== undefined) {
          const div = document.createElement('div');
          div.className = 'tb-dropdown-divider';
          menu.appendChild(div);
          return;
        }
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'tb-dropdown-item';
        item.dataset.idx = idx;
        item.setAttribute('role', 'option');
        item.textContent = opt.text;
        if (idx === selectedIdx) item.classList.add('active');
        menu.appendChild(item);
      });
    }
    renderItems();

    // ── Open / Close ─────────────────────────────────────────
    function open() {
      wrapper.classList.add('open');
      trigger.setAttribute('aria-expanded', 'true');

      // Backdrop
      let bd = document.getElementById('tb-dropdown-bd');
      if (!bd) {
        bd = document.createElement('div');
        bd.id = 'tb-dropdown-bd';
        bd.className = 'tb-dropdown-backdrop';
        document.body.appendChild(bd);
      }
      bd.addEventListener('click', closeAll, { once: true });

      // Position menu as fixed to escape overflow:hidden of parent
      requestAnimationFrame(() => {
        const wrapRect = wrapper.getBoundingClientRect();
        
        // Cố định vị trí để không bị cắt bởi overflow của thẻ cha
        menu.style.position = 'fixed';
        menu.style.top = (wrapRect.bottom + 4) + 'px';
        
        // Xử lý tràn lề phải
        // Bỏ position tạm để lấy width thực
        menu.style.left = '0'; 
        const menuWidth = menu.offsetWidth;
        
        if (wrapRect.left + menuWidth > window.innerWidth - 8) {
          menu.style.left = 'auto';
          menu.style.right = '8px';
        } else {
          menu.style.left = wrapRect.left + 'px';
          menu.style.right = 'auto';
        }
      });
    }

    function close() {
      wrapper.classList.remove('open');
      trigger.setAttribute('aria-expanded', 'false');
    }

    function closeAll() {
      document.querySelectorAll('.tb-dropdown.open').forEach(el => el.classList.remove('open'));
      document.querySelectorAll('.tb-dropdown-trigger').forEach(el => el.setAttribute('aria-expanded', 'false'));
      const bd = document.getElementById('tb-dropdown-bd');
      if (bd) bd.remove();
      
      const userMenu = document.getElementById('user-menu-wrapper');
      if (userMenu) userMenu.classList.remove('open');
    }

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      closeAll();
      if (!isOpen) open();
    });

    // ── Select item ──────────────────────────────────────────
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.tb-dropdown-item');
      if (!item) return;

      const idx = parseInt(item.dataset.idx, 10);
      selectedIdx = idx;
      selectEl.selectedIndex = idx;

      // Update trigger label
      labelSpan.textContent = options[idx].text;

      // Update active state
      menu.querySelectorAll('.tb-dropdown-item').forEach((el, i) => {
        el.classList.toggle('active', i === idx);
      });

      // Fire change event on original select
      selectEl.dispatchEvent(new Event('change', { bubbles: true }));

      closeAll();
    });

    // ── Keyboard navigation ──────────────────────────────────
    trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (!wrapper.classList.contains('open')) open();
        else {
          const first = menu.querySelector('.tb-dropdown-item');
          first && first.focus();
        }
      }
      if (e.key === 'Escape') closeAll();
    });

    menu.addEventListener('keydown', (e) => {
      const items = [...menu.querySelectorAll('.tb-dropdown-item')];
      const focused = document.activeElement;
      const idx = items.indexOf(focused);
      if (e.key === 'ArrowDown') { e.preventDefault(); items[idx + 1]?.focus(); }
      if (e.key === 'ArrowUp') { e.preventDefault(); items[idx - 1]?.focus() || trigger.focus(); }
      if (e.key === 'Escape') { closeAll(); trigger.focus(); }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focused?.click(); }
    });

    // ── Assemble ─────────────────────────────────────────────
    wrapper.appendChild(trigger);
    wrapper.appendChild(menu);

    // Replace original select
    selectEl.style.display = 'none';
    selectEl.insertAdjacentElement('afterend', wrapper);

    return wrapper;
  }

  // ── Init on DOM ready ─────────────────────────────────────
  function init() {
    document.querySelectorAll('select.topbar-select').forEach(sel => {
      if (!sel.dataset.ddInit) {
        createDropdown(sel);
        sel.dataset.ddInit = '1';
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose for external call if needed
  window.TopbarDropdown = { init, createDropdown };
})();
