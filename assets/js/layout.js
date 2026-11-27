/* ===== Events layout (three shells) + shared component library =====
   Renders a PUBLIC shell (navbar + footer + cart drawer), an APP shell (sidebar +
   topbar) for app-*.html (guarded), or a BLANK shell (auth / 404). Chooses by
   <body data-shell>. Exposes UI.* render helpers (eventCard, ticketTierSelector,
   quantityStepper, cartItem, ticketCard (QR svg), checkinScanner, attendeeRow,
   statusPill, kpiCard, dataTable, tabs, modal, drawer, badge, pagination,
   filterBar, emptyState, toast) and wires theme/lang/menu/cart/qty handlers.
   Mirrors the React layouts. */
(function (global) {
  const SHELL = (document.body.getAttribute('data-shell') || 'public').toLowerCase();

  function t(key, opts) {
    return global.I18n ? global.I18n.t(key, opts) : key;
  }
  function lang() {
    return global.I18n ? global.I18n.getLang() : 'pt-BR';
  }
  function fmt(v) {
    return Data.formatCurrency(v, lang());
  }
  function fmtCompact(v) {
    return Data.formatCompact(v, lang());
  }
  function fmtDate(v) {
    return Data.formatDate(v, lang());
  }
  function fmtDateTime(v) {
    return Data.formatDateTime(v, lang());
  }
  function fmtTime(v) {
    return Data.formatTime(v, lang());
  }
  function fromNow(v) {
    return Data.fromNow(v, lang());
  }

  const LANGS = global.I18n ? global.I18n.LANGUAGES : [{ code: 'pt-BR', flag: '🇧🇷', label: 'Português' }];

  // Load shared scripts once (pwa).
  (function loadScriptsOnce() {
    ['assets/js/pwa.js'].forEach((src) => {
      if (!document.querySelector(`script[src="${src}"]`)) {
        const sc = document.createElement('script');
        sc.src = src;
        document.head.appendChild(sc);
      }
    });
  })();

  // ============================================================
  // Shared render helpers
  // ============================================================
  function langMenu() {
    return LANGS.map(
      (l) =>
        `<button type="button" class="flex w-full items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 ${
          l.code === lang() ? 'font-medium text-brand-600' : 'text-body'
        }" data-action="set-lang" data-lang="${l.code}"><span>${l.flag}</span> ${l.label}${
          l.code === lang() ? icon('check', { size: 14, className: 'ml-auto' }) : ''
        }</button>`
    ).join('');
  }
  function langDropdown(id) {
    return (
      `<div class="relative" id="${id}"><button type="button" data-action="toggle-lang" data-menu="#${id}-menu" aria-label="${t(
        'common.theme'
      )}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-base hover:bg-gray-50 dark:hover:bg-gray-800">${
        LANGS.find((l) => l.code === lang()).flag
      }</button><div id="${id}-menu" class="surface-card absolute right-0 mt-3 w-44 rounded-xl border py-1 shadow-theme-lg hidden z-50">${langMenu()}</div></div>`
    );
  }

  const BADGE_COLORS = {
    success: 'bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-500',
    warning: 'bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-500',
    error: 'bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500',
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400',
    info: 'bg-blue-light-50 text-blue-light-600 dark:bg-blue-light-500/15 dark:text-blue-light-400',
    gray: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
  };
  // badge(label, color, opts) — opts: { icon, solid }
  function badge(label, color, opts) {
    color = color || 'gray';
    opts = opts || {};
    const ic = opts.icon ? icon(opts.icon, { size: 13 }) : '';
    if (opts.solid) {
      const solidBg = { brand: 'bg-brand-500', success: 'bg-success-500', warning: 'bg-warning-500', error: 'bg-error-500', info: 'bg-blue-light-500', gray: 'bg-gray-500' };
      return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold text-white ${solidBg[color] || solidBg.gray}">${ic}${label}</span>`;
    }
    return `<span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE_COLORS[color] || BADGE_COLORS.gray}">${ic}${label}</span>`;
  }

  // statusPill — event status (published/draft/ended) or order status (paid/pending).
  const EVENT_STATUS_COLOR = { published: 'success', draft: 'gray', ended: 'error' };
  const ORDER_STATUS_COLOR = { paid: 'success', pending: 'warning' };
  const CHECKIN_COLOR = { in: 'success', out: 'gray' };
  function statusPill(kind, value) {
    if (kind === 'event') return badge(t('eventStatus.' + value), EVENT_STATUS_COLOR[value] || 'gray');
    if (kind === 'order') return badge(t('orderStatus.' + value), ORDER_STATUS_COLOR[value] || 'gray');
    if (kind === 'checkin') return value ? badge(t('checkin.done'), 'success', { icon: 'check' }) : badge(t('checkin.pending'), 'gray');
    return badge(value, 'gray');
  }

  function emptyState(o) {
    o = o || {};
    return (
      `<div class="surface-card flex flex-col items-center justify-center rounded-2xl border py-16 text-center">` +
      `<span class="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon(o.icon || 'calendar', { size: 28 })}</span>` +
      `<h3 class="mt-5 text-lg font-semibold text-heading">${o.title || ''}</h3>` +
      (o.description ? `<p class="mt-2 max-w-sm text-sm text-muted">${o.description}</p>` : '') +
      (o.action ? `<div class="mt-6">${o.action}</div>` : '') +
      `</div>`
    );
  }

  function breadcrumb(items) {
    const lis = items
      .map((item, i) => {
        const last = i === items.length - 1;
        const content =
          item.href && !last
            ? `<a href="${item.href}" class="text-muted transition hover:text-brand-600 dark:hover:text-brand-400">${item.label}</a>`
            : `<span ${last ? 'aria-current="page"' : ''} class="${last ? 'font-medium text-heading' : 'text-muted'}">${item.label}</span>`;
        const sep = !last ? icon('chevron-right', { size: 14, className: 'text-gray-400' }) : '';
        return `<li class="flex items-center gap-1.5">${content}${sep}</li>`;
      })
      .join('');
    return `<nav aria-label="Breadcrumb"><ol class="flex flex-wrap items-center gap-1.5 text-sm">${lis}</ol></nav>`;
  }

  function pageHeader(o) {
    return (
      `<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">` +
      `<div>` +
      (o.crumbs && o.crumbs.length ? `<div class="mb-2">${breadcrumb(o.crumbs)}</div>` : '') +
      `<h1 class="text-2xl font-bold text-heading">${o.title}</h1>` +
      (o.subtitle ? `<p class="mt-1 text-sm text-muted">${o.subtitle}</p>` : '') +
      `</div>` +
      (o.action ? `<div class="shrink-0">${o.action}</div>` : '') +
      `</div>`
    );
  }

  function switchToggle(checked, attrs) {
    return (
      `<button type="button" role="switch" aria-checked="${!!checked}" ${attrs || ''} class="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-brand-500' : 'bg-gray-300 dark:bg-gray-700'
      }"><span class="inline-block h-4 w-4 transform rounded-full bg-white shadow-theme-xs transition ${
        checked ? 'translate-x-6' : 'translate-x-1'
      }"></span></button>`
    );
  }

  const STATS_ACCENT = {
    brand: 'bg-brand-50 text-brand-500 dark:bg-brand-500/15',
    success: 'bg-success-50 text-success-600 dark:bg-success-500/15',
    warning: 'bg-warning-50 text-warning-600 dark:bg-warning-500/15',
    info: 'bg-blue-light-50 text-blue-light-500 dark:bg-blue-light-500/15',
  };
  function kpiCard(o) {
    const trendUp = o.trend === 'up';
    const trendColor = trendUp ? 'text-success-600' : 'text-error-600';
    const trendIcon = trendUp ? 'trending-up' : 'trending-down';
    return (
      `<div class="surface-card rounded-2xl border p-5">` +
      `<div class="flex items-start justify-between">` +
      `<span class="flex h-11 w-11 items-center justify-center rounded-xl ${STATS_ACCENT[o.accent] || STATS_ACCENT.brand}">${icon(o.icon, { size: 22 })}</span>` +
      (o.trendValue ? `<span class="inline-flex items-center gap-1 text-xs font-medium ${trendColor}">${icon(trendIcon, { size: 14 })}${o.trendValue}</span>` : '') +
      `</div>` +
      `<p class="mt-4 text-sm text-muted">${o.title}</p>` +
      `<p class="mt-1 text-2xl font-bold text-heading">${o.value}</p>` +
      `</div>`
    );
  }

  // ---- QuantityStepper ----
  function quantityStepper(value, opts) {
    opts = opts || {};
    const min = opts.min != null ? opts.min : 0;
    const max = opts.max != null ? opts.max : 99;
    const dim = opts.size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
    const minw = opts.size === 'sm' ? 'min-w-8' : 'min-w-10';
    const id = opts.id || '';
    const cartId = opts.cartId || '';
    return (
      `<div class="inline-flex items-center rounded-lg border border-themed" data-qty data-qty-id="${id}" data-qty-cart="${cartId}" data-qty-min="${min}" data-qty-max="${max}" data-qty-value="${value}">` +
      `<button type="button" data-qty-dec ${value <= min ? 'disabled' : ''} aria-label="-" class="${dim} flex items-center justify-center text-muted transition hover:text-heading disabled:opacity-40">${icon('minus', { size: 16 })}</button>` +
      `<span data-qty-display class="${minw} text-center text-sm font-medium text-heading">${value}</span>` +
      `<button type="button" data-qty-inc ${value >= max ? 'disabled' : ''} aria-label="+" class="${dim} flex items-center justify-center text-muted transition hover:text-heading disabled:opacity-40">${icon('plus', { size: 16 })}</button>` +
      `</div>`
    );
  }

  // ---- EventCard ----
  function eventCard(e) {
    const meta = Data.CATEGORY_META[e.category] || { icon: 'calendar', color: 'brand' };
    const priceFrom = Query.eventPriceFrom(EventsStore.get().tiers, e.id);
    const href = `evento.html?slug=${e.slug}`;
    const priceLabel = priceFrom > 0 ? `<span class="text-xs text-muted">${t('event.from')}</span> <span class="text-base font-bold text-heading">${fmt(priceFrom)}</span>` : `<span class="text-sm font-medium text-error-600">${t('event.soldOut')}</span>`;
    return (
      `<a href="${href}" class="surface-card group flex flex-col overflow-hidden rounded-2xl border transition hover:shadow-theme-md">` +
      `<div class="relative aspect-[16/10] overflow-hidden bg-gray-100 dark:bg-gray-800">` +
      `<img src="${e.cover}" alt="${e.title}" loading="lazy" class="h-full w-full object-cover transition duration-500 group-hover:scale-105"/>` +
      `<div class="absolute left-3 top-3">${badge(t('categories.' + e.category), meta.color, { icon: meta.icon, solid: true })}</div>` +
      `</div>` +
      `<div class="flex flex-1 flex-col p-4">` +
      `<p class="flex items-center gap-1.5 text-xs font-medium text-muted">${icon('calendar', { size: 14 })}${fmtDateTime(e.date)}</p>` +
      `<h3 class="mt-1.5 line-clamp-2 text-base font-semibold text-heading group-hover:text-brand-600">${e.title}</h3>` +
      `<p class="mt-1 flex items-center gap-1.5 text-sm text-muted">${icon('map-pin', { size: 14 })}${e.venue} · ${e.city}</p>` +
      `<div class="mt-auto flex items-center justify-between pt-4">${priceLabel}<span class="flex h-9 items-center gap-1.5 rounded-lg bg-brand-50 px-3 text-xs font-medium text-brand-600 transition group-hover:bg-brand-500 group-hover:text-white dark:bg-brand-500/15">${t('event.buy')}${icon('arrow-right', { size: 14 })}</span></div>` +
      `</div></a>`
    );
  }

  // ---- TicketTierSelector ----
  // tiers + a map of selected quantities (data-tier-qty drives totals on the page).
  function ticketTierSelector(tiers, quantities) {
    quantities = quantities || {};
    if (!tiers.length) return `<p class="py-6 text-center text-sm text-muted">${t('event.soldOut')}</p>`;
    return (
      `<div class="flex flex-col gap-3" data-tier-selector>` +
      tiers
        .map((tier) => {
          const remaining = Query.tierRemaining(tier);
          const closed = !tier.active || remaining <= 0;
          const qty = quantities[tier.id] || 0;
          return (
            `<div class="rounded-xl border border-themed p-4 ${closed ? 'opacity-60' : ''}">` +
            `<div class="flex items-start justify-between gap-3">` +
            `<div><p class="text-sm font-semibold text-heading">${tier.name}</p>` +
            (closed
              ? `<p class="mt-0.5 text-xs font-medium text-error-600">${t('event.soldOut')}</p>`
              : `<p class="mt-0.5 text-xs text-muted">${t('event.remaining', { count: remaining })}</p>`) +
            `</div>` +
            `<span class="text-base font-bold text-heading">${fmt(tier.price)}</span>` +
            `</div>` +
            (closed
              ? ''
              : `<div class="mt-3 flex justify-end">${quantityStepper(qty, { id: tier.id, min: 0, max: Math.min(10, remaining), size: 'sm' })}</div>`) +
            `</div>`
          );
        })
        .join('') +
      `</div>`
    );
  }

  // ---- CartItem (cart page row) ----
  function cartItem(item) {
    return (
      `<div class="flex gap-4 rounded-2xl border border-themed p-4">` +
      `<a href="evento.html?slug=${item.eventSlug}" class="shrink-0"><img src="${item.cover}" alt="${item.eventTitle}" class="h-24 w-32 rounded-xl object-cover"/></a>` +
      `<div class="flex flex-1 flex-col">` +
      `<div class="flex justify-between gap-2"><div><a href="evento.html?slug=${item.eventSlug}" class="text-sm font-semibold text-heading hover:text-brand-600">${item.eventTitle}</a><p class="mt-0.5 text-xs text-muted">${item.tierName}</p></div>` +
      `<button type="button" data-remove-item="${item.id}" class="text-gray-400 hover:text-error-500" aria-label="${t('common.remove')}">${icon('trash', { size: 18 })}</button></div>` +
      `<div class="mt-auto flex items-center justify-between pt-3">${quantityStepper(item.qty, { cartId: item.id, min: 1, max: item.remaining, size: 'sm' })}<span class="text-base font-semibold text-heading">${fmt(item.price * item.qty)}</span></div>` +
      `</div></div>`
    );
  }

  // ---- QR mock (inline SVG grid, deterministic from code) ----
  function qrSvg(code, size) {
    size = size || 132;
    const cells = 21;
    const cell = size / cells;
    // deterministic pseudo-random from the code string
    let seed = 0;
    for (let i = 0; i < code.length; i++) seed = (seed * 31 + code.charCodeAt(i)) >>> 0;
    function rnd() {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      return seed / 0x7fffffff;
    }
    let rects = '';
    function finder(x, y) {
      rects += `<rect x="${x * cell}" y="${y * cell}" width="${cell * 7}" height="${cell * 7}" fill="currentColor"/>`;
      rects += `<rect x="${(x + 1) * cell}" y="${(y + 1) * cell}" width="${cell * 5}" height="${cell * 5}" fill="#fff"/>`;
      rects += `<rect x="${(x + 2) * cell}" y="${(y + 2) * cell}" width="${cell * 3}" height="${cell * 3}" fill="currentColor"/>`;
    }
    function inFinder(c, r) {
      return (
        (c < 7 && r < 7) ||
        (c >= cells - 7 && r < 7) ||
        (c < 7 && r >= cells - 7)
      );
    }
    for (let r = 0; r < cells; r++) {
      for (let c = 0; c < cells; c++) {
        if (inFinder(c, r)) continue;
        if (rnd() > 0.55) rects += `<rect x="${c * cell}" y="${r * cell}" width="${cell}" height="${cell}" fill="currentColor"/>`;
      }
    }
    finder(0, 0);
    finder(cells - 7, 0);
    finder(0, cells - 7);
    return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" class="text-gray-900 dark:text-white" role="img" aria-label="QR ${code}"><rect width="${size}" height="${size}" fill="#fff"/>${rects}</svg>`;
  }

  // ---- TicketCard (with QR mock) ----
  function ticketCard(ticket) {
    return (
      `<div class="surface-card flex flex-col overflow-hidden rounded-2xl border sm:flex-row">` +
      `<div class="flex items-center justify-center border-b border-dashed border-themed bg-gray-50 p-5 dark:bg-gray-900/40 sm:border-b-0 sm:border-r">` +
      `<div class="rounded-xl bg-white p-2 shadow-theme-sm">${qrSvg(ticket.code, 120)}</div>` +
      `</div>` +
      `<div class="flex flex-1 flex-col p-5">` +
      `<div class="flex items-start justify-between gap-3"><h3 class="text-base font-semibold text-heading">${ticket.eventTitle}</h3>${statusPill('checkin', ticket.checkedIn)}</div>` +
      `<p class="mt-1 text-sm text-muted">${ticket.tierName}</p>` +
      `<div class="mt-4 space-y-1.5 text-sm">` +
      `<p class="flex items-center gap-2 text-muted">${icon('user', { size: 15 })}<span class="text-body">${ticket.attendeeName}</span></p>` +
      `<p class="flex items-center gap-2 text-muted">${icon('ticket', { size: 15 })}<span class="font-mono text-body">${ticket.code}</span></p>` +
      `</div></div></div>`
    );
  }

  // ---- CheckinScanner (code input) ----
  function checkinScanner() {
    return (
      `<form data-checkin-form class="surface-card rounded-2xl border p-6">` +
      `<div class="flex items-center gap-3"><span class="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon('scan', { size: 22 })}</span><div><h3 class="text-base font-semibold text-heading">${t('checkin.scannerTitle')}</h3><p class="text-sm text-muted">${t('checkin.scannerDesc')}</p></div></div>` +
      `<div class="mt-5 flex flex-col gap-3 sm:flex-row">` +
      `<input type="text" data-checkin-input placeholder="${t('checkin.placeholder')}" class="h-12 flex-1 rounded-xl border border-themed bg-transparent px-4 font-mono text-sm text-body outline-none focus:border-brand-300 focus-ring" autocomplete="off"/>` +
      `<button type="submit" class="flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 text-sm font-semibold text-white transition hover:bg-brand-600">${icon('check', { size: 18 })}${t('checkin.validate')}</button>` +
      `</div>` +
      `<div data-checkin-result class="mt-4"></div>` +
      `</form>`
    );
  }

  // ---- AttendeeRow (table row builder, used by dataTable render) ----
  function attendeeRow(a) {
    return (
      `<div class="flex items-center gap-3"><span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-500 text-xs font-bold text-white">${(a.name || '?').trim().split(/\s+/).slice(0, 2).map((p) => (p[0] || '').toUpperCase()).join('')}</span><div><p class="text-sm font-medium text-heading">${a.name}</p><p class="text-xs text-muted">${a.email}</p></div></div>`
    );
  }

  // ---- FilterBar (search + select group). Emits input/change to the page. ----
  function filterBar(controls) {
    return `<div class="surface-card flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center" data-filter-bar>${controls}</div>`;
  }
  function searchInput(value, placeholder, name) {
    return (
      `<div class="relative flex-1"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">${icon('search', { size: 18 })}</span>` +
      `<input type="search" data-filter="${name}" value="${value || ''}" placeholder="${placeholder || ''}" class="h-11 w-full rounded-lg border border-themed bg-transparent pl-10 pr-3 text-sm text-body outline-none focus:border-brand-300 focus-ring"/></div>`
    );
  }
  function selectInput(name, options, value) {
    const opts = options.map((o) => `<option value="${o.value}" ${o.value === value ? 'selected' : ''}>${o.label}</option>`).join('');
    return `<select data-filter="${name}" class="h-11 rounded-lg border border-themed bg-transparent px-3 text-sm text-body outline-none focus:border-brand-300 focus-ring">${opts}</select>`;
  }

  // ---- Tabs (self-contained switcher) ----
  function tabs(items, active) {
    active = active || 0;
    const heads = items
      .map(
        (it, i) =>
          `<button type="button" data-tab="${i}" class="-mb-px inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
            i === active ? 'border-brand-500 text-brand-600 dark:text-brand-400' : 'border-transparent text-muted hover:border-gray-300 hover:text-body dark:hover:border-gray-700'
          }">${it.icon ? icon(it.icon, { size: 16 }) : ''}${it.label}</button>`
      )
      .join('');
    return (
      `<div data-tabs><div class="flex gap-1 overflow-x-auto border-b border-themed no-scrollbar" role="tablist">${heads}</div>` +
      `<div data-tab-panel class="pt-5 text-sm text-body" role="tabpanel">${items[active] ? items[active].content : ''}</div></div>`
    );
  }

  // ---- Modal ----
  const MODAL_SIZE = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-5xl' };
  function modal(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[80] hidden" data-modal>` +
      `<div class="absolute inset-0 bg-gray-900/50" data-modal-close></div>` +
      `<div class="relative flex min-h-full items-center justify-center p-4"><div class="surface-card w-full ${MODAL_SIZE[opts.size] || MODAL_SIZE.md} rounded-2xl border shadow-theme-xl">` +
      `<div class="flex items-center justify-between border-b border-themed px-6 py-4"><h2 class="text-lg font-semibold text-heading">${opts.title || ''}</h2><button type="button" data-modal-close class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-heading" aria-label="${t('common.close')}">${icon('x', { size: 20 })}</button></div>` +
      `<div class="px-6 py-5" data-modal-body>${opts.body || ''}</div>` +
      (opts.footer ? `<div class="flex justify-end gap-3 border-t border-themed px-6 py-4" data-modal-footer>${opts.footer}</div>` : '') +
      `</div></div></div>`
    );
  }
  function openModal(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('hidden');
  }
  function closeModal(id) {
    const el = typeof id === 'string' ? document.getElementById(id) : id;
    if (el) el.classList.add('hidden');
  }

  // ---- Drawer (right-side slide-over) ----
  function drawer(id, opts) {
    opts = opts || {};
    return (
      `<div id="${id}" class="fixed inset-0 z-[70] hidden" data-drawer>` +
      `<div class="absolute inset-0 bg-gray-900/40" data-drawer-close></div>` +
      `<aside class="surface-card absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l shadow-theme-xl" role="dialog">` +
      `<div class="flex items-center justify-between border-b border-themed px-5 py-4"><h2 class="text-lg font-semibold text-heading">${opts.title || ''}</h2><button type="button" data-drawer-close class="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:text-heading">${icon('x', { size: 20 })}</button></div>` +
      `<div class="flex-1 overflow-y-auto px-5 py-4" data-drawer-body>${opts.body || ''}</div>` +
      `</aside></div>`
    );
  }

  // ---- DataTable ----
  const TABLES = {};
  function dataTable(opts) {
    TABLES[opts.id] = Object.assign({}, opts, { page: 1, sortKey: null, sortDir: 'asc', search: '' });
    return `<div id="${opts.id}" data-table></div>`;
  }
  function tablePagination(page, pages) {
    if (pages <= 1) return '';
    return (
      `<div class="flex items-center justify-between border-t border-themed px-5 py-3"><span class="text-xs text-muted">${page} / ${pages}</span><div class="flex gap-2"><button type="button" data-table-prev ${
        page <= 1 ? 'disabled' : ''
      } class="flex h-9 items-center gap-1 rounded-lg border border-themed px-3 text-sm text-body disabled:opacity-40">${icon('chevron-right', { size: 14, className: 'rotate-180' })}${t('common.previous')}</button><button type="button" data-table-next ${
        page >= pages ? 'disabled' : ''
      } class="flex h-9 items-center gap-1 rounded-lg border border-themed px-3 text-sm text-body disabled:opacity-40">${t('common.next')}${icon('chevron-right', { size: 14 })}</button></div></div>`
    );
  }
  function renderTable(id) {
    const cfg = TABLES[id];
    const wrap = document.getElementById(id);
    if (!cfg || !wrap) return;
    const pageSize = cfg.pageSize || 10;
    const searchable = cfg.searchable !== false;
    const searchKeys = cfg.searchKeys || cfg.columns.filter((c) => c.key).map((c) => c.key);

    let rows = cfg.rows;
    if (searchable) rows = Query.searchRows(rows, cfg.search, searchKeys);
    rows = Query.sortRows(rows, cfg.sortKey, cfg.sortDir);
    const total = rows.length;
    const pages = Query.pageCount(total, pageSize);
    if (cfg.page > pages) cfg.page = pages;
    const view = Query.paginate(rows, cfg.page, pageSize).items;

    const head = cfg.columns
      .map((c) => {
        const sortable = c.sortable !== false && c.key;
        const arrow = sortable && cfg.sortKey === c.key ? icon(cfg.sortDir === 'asc' ? 'arrow-up' : 'arrow-down', { size: 12 }) : '';
        return `<th class="px-5 py-3.5 text-left font-medium text-muted ${sortable ? 'cursor-pointer select-none' : ''}" ${sortable ? `data-sort="${c.key}"` : ''}><span class="inline-flex items-center gap-1.5">${c.header}${arrow}</span></th>`;
      })
      .join('');

    const body = view.length
      ? view
          .map(
            (row, i) =>
              `<tr class="border-b border-themed last:border-0">` +
              cfg.columns.map((c) => `<td class="px-5 py-3.5 text-sm text-body">${c.render ? c.render(row, i) : row[c.key]}</td>`).join('') +
              `</tr>`
          )
          .join('')
      : `<tr><td colspan="${cfg.columns.length}" class="px-5 py-12 text-center text-sm text-muted">${t('common.noResults')}</td></tr>`;

    wrap.innerHTML =
      (searchable
        ? `<div class="mb-4"><div class="relative max-w-xs"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">${icon('search', { size: 16 })}</span><input type="search" data-table-search value="${cfg.search}" placeholder="${t('common.search')}" class="h-10 w-full rounded-lg border border-themed bg-transparent pl-9 pr-3 text-sm text-body outline-none focus:border-brand-300 focus-ring"/></div></div>`
        : '') +
      `<div class="surface-card overflow-hidden rounded-2xl border"><div class="overflow-x-auto"><table class="w-full text-sm"><thead><tr class="border-b border-themed bg-gray-50/50 dark:bg-gray-900/30">${head}</tr></thead><tbody>${body}</tbody></table></div>${tablePagination(cfg.page, pages)}</div>`;
  }

  // ---- pagination (button group, page links) ----
  function pagination(page, totalPages) {
    if (totalPages <= 1) return '';
    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) pages.push(i);
      else if (pages[pages.length - 1] !== '...') pages.push('...');
    }
    const btn = 'flex h-10 min-w-10 items-center justify-center rounded-lg border border-themed px-3 text-sm font-medium transition disabled:opacity-40';
    let html = `<nav class="flex items-center justify-center gap-2" aria-label="Pagination">`;
    html += `<button type="button" data-page="${page - 1}" ${page <= 1 ? 'disabled' : ''} class="${btn} text-muted hover:text-heading">${icon('chevron-left', { size: 16 })}</button>`;
    pages.forEach((p) => {
      if (p === '...') html += `<span class="px-1 text-muted">…</span>`;
      else html += `<button type="button" data-page="${p}" class="${btn} ${p === page ? 'border-brand-500 bg-brand-500 text-white' : 'text-body hover:text-heading'}">${p}</button>`;
    });
    html += `<button type="button" data-page="${page + 1}" ${page >= totalPages ? 'disabled' : ''} class="${btn} text-muted hover:text-heading">${icon('chevron-right', { size: 16 })}</button>`;
    html += `</nav>`;
    return html;
  }

  // ============================================================
  // Chrome: public navbar / footer / cart drawer
  // ============================================================
  function renderPublicNavbar() {
    const dark = UIState.get().darkMode;
    const isAuth = Auth.isAuthenticated();
    const cartCount = Cart.count();
    const here = window.location.pathname.split('/').pop() || 'index.html';

    const LINKS = [
      { href: 'eventos.html', key: 'nav.events' },
      { href: 'meus-ingressos.html', key: 'nav.myTickets' },
      { href: 'sobre.html', key: 'nav.about' },
      { href: 'contato.html', key: 'nav.contact' },
    ];
    const navLink = (l, mobile) =>
      `<a href="${l.href}" class="${mobile ? 'rounded-lg px-3 py-2.5 text-sm font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800' : 'rounded-lg px-3 py-2 text-sm font-medium transition ' + (l.href === here ? 'text-brand-600 dark:text-brand-400' : 'text-body hover:text-heading')}">${t(l.key)}</a>`;
    const links = LINKS.map((l) => navLink(l, false)).join('');
    const mobileLinks = LINKS.map((l) => navLink(l, true)).join('');

    const cta = isAuth
      ? `<a href="app.html" class="hidden h-10 items-center rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${t('nav.dashboard')}</a>`
      : `<a href="login.html" class="hidden h-10 items-center rounded-lg border border-themed px-4 text-sm font-medium text-body transition hover:bg-gray-50 dark:hover:bg-gray-800 sm:flex">${t('nav.organizer')}</a>`;

    return (
      `<div class="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">` +
      `<button type="button" data-action="toggle-mobile-menu" class="flex h-10 w-10 items-center justify-center rounded-lg text-body lg:hidden" aria-label="Menu">${icon('menu', { size: 22 })}</button>` +
      `<a href="index.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-md">${icon('ticket', { size: 18 })}</span><span class="hidden text-lg font-bold text-heading sm:block">${t('brand')}</span></a>` +
      `<nav class="ml-4 hidden items-center gap-1 lg:flex">${links}</nav>` +
      `<div class="ml-auto flex items-center gap-1 sm:gap-2">` +
      `<button type="button" data-action="toggle-dark" aria-label="${t('common.theme')}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-body transition hover:bg-gray-50 dark:hover:bg-gray-800">${icon(dark ? 'sun' : 'moon', { size: 18 })}</button>` +
      langDropdown('tx-lang') +
      cta +
      `<a href="carrinho.html" aria-label="${t('nav.cart')}" class="relative flex h-10 w-10 items-center justify-center rounded-full bg-brand-500 text-white transition hover:bg-brand-600">${icon('shopping-cart', { size: 18 })}${cartCount > 0 ? `<span class="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error-500 px-1 text-[10px] font-bold text-white">${cartCount}</span>` : ''}</a>` +
      `</div></div>` +
      `<div id="tx-mobile-menu" class="surface-card border-t border-themed lg:hidden hidden"><nav class="flex flex-col gap-1 px-4 py-4 sm:px-6">${mobileLinks}<div class="mt-2 flex flex-col gap-2 border-t border-themed pt-3">${isAuth ? `<a href="app.html" class="flex h-11 items-center justify-center rounded-lg bg-brand-500 text-sm font-medium text-white">${t('nav.dashboard')}</a>` : `<a href="login.html" class="flex h-11 items-center justify-center rounded-lg border border-themed text-sm font-medium text-body">${t('nav.organizer')}</a>`}</div></nav></div>`
    );
  }

  function renderPublicFooter() {
    const year = new Date().getFullYear();
    const cols = [
      { title: 'nav.events', links: [['nav.events', 'eventos.html'], ['nav.myTickets', 'meus-ingressos.html'], ['cart.title', 'carrinho.html']] },
      { title: 'footer.help', links: [['nav.about', 'sobre.html'], ['nav.contact', 'contato.html'], ['footer.help', '#']] },
      { title: 'nav.organizer', links: [['nav.login', 'login.html'], ['auth.registerTitle', 'registro.html'], ['nav.dashboard', 'app.html']] },
    ];
    const colHtml = cols
      .map(
        (c) =>
          `<div><h3 class="text-sm font-semibold text-heading">${t(c.title)}</h3><ul class="mt-4 space-y-3">${c.links
            .map((l) => `<li><a href="${l[1]}" class="text-sm text-muted transition hover:text-brand-600">${t(l[0])}</a></li>`)
            .join('')}</ul></div>`
      )
      .join('');
    const social = ['instagram', 'facebook', 'twitter']
      .map((ic) => `<a href="#" aria-label="${ic}" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted transition hover:bg-gray-50 hover:text-brand-600 dark:hover:bg-gray-800">${icon(ic, { size: 18 })}</a>`)
      .join('');
    return (
      `<div class="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">` +
      `<div class="grid grid-cols-2 gap-8 md:grid-cols-5">` +
      `<div class="col-span-2"><div class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white shadow-theme-md">${icon('ticket', { size: 18 })}</span><span class="text-lg font-bold text-heading">${t('brand')}</span></div><p class="mt-4 max-w-xs text-sm text-muted">${t('footer.tagline')}</p><div class="mt-5 flex gap-2">${social}</div></div>` +
      colHtml +
      `</div>` +
      `<div class="mt-10 flex flex-col items-center justify-between gap-4 border-t border-themed pt-6 sm:flex-row"><p class="text-sm text-muted">© ${year} ${t('brand')}. ${t('footer.rights')}</p><div class="flex items-center gap-4 text-xs text-muted"><a href="#" class="hover:text-brand-500">${t('footer.terms')}</a><a href="#" class="hover:text-brand-500">${t('footer.privacy')}</a></div></div>` +
      `</div>`
    );
  }

  // ============================================================
  // Chrome: app sidebar / topbar / footer
  // ============================================================
  const APP_SECTIONS = [
    { titleKey: 'appNav.main', items: [{ href: 'app.html', labelKey: 'appNav.dashboard', icon: 'dashboard' }] },
    {
      titleKey: 'appNav.operations',
      items: [
        { href: 'app-eventos.html', labelKey: 'appNav.events', icon: 'calendar', match: ['app-eventos.html', 'app-evento.html'] },
        { href: 'app-checkin.html', labelKey: 'appNav.checkin', icon: 'scan' },
        { href: 'app-participantes.html', labelKey: 'appNav.attendees', icon: 'users' },
      ],
    },
    {
      titleKey: 'appNav.insights',
      items: [
        { href: 'app-financeiro.html', labelKey: 'appNav.finance', icon: 'dollar' },
        { href: 'app-configuracoes.html', labelKey: 'appNav.settings', icon: 'settings' },
      ],
    },
  ];

  function renderSidebar() {
    const collapsed = UIState.get().sidebarCollapsed;
    const here = window.location.pathname.split('/').pop() || 'app.html';
    const navCls = (active) =>
      `group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${collapsed ? 'justify-center' : ''} ${active ? 'is-sidebar-active' : 'is-sidebar-inactive'}`;

    const sections = APP_SECTIONS.map(
      (section) =>
        `<nav>${collapsed ? '' : `<h3 class="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider">${t(section.titleKey)}</h3>`}<ul class="flex flex-col gap-1">${section.items
          .map((item) => {
            const active = item.match ? item.match.indexOf(here) !== -1 : item.href === here;
            return `<li><a href="${item.href}" class="${navCls(active)}" ${collapsed ? `title="${t(item.labelKey)}"` : ''}>${icon(item.icon, { size: 20 })}${collapsed ? '' : `<span class="flex-1">${t(item.labelKey)}</span>`}</a></li>`;
          })
          .join('')}</ul></nav>`
    ).join('');

    return (
      `<div class="flex items-center pt-7 pb-6 ${collapsed ? 'justify-center' : 'justify-between'}">` +
      `<a href="app.html" class="flex items-center gap-2.5"><span class="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white shadow-theme-sm">${icon('ticket', { size: 18 })}</span>${collapsed ? '' : `<span class="text-lg font-semibold">${t('brand')}</span>`}</a>` +
      (collapsed ? '' : `<button type="button" data-action="toggle-sidebar" class="is-sidebar-inactive hidden h-8 w-8 items-center justify-center rounded-lg border border-themed lg:flex" title="${t('appNav.collapse')}">${icon('chevron-right', { size: 14, className: 'rotate-180' })}</button>`) +
      `</div>` +
      `<div class="flex flex-col gap-5 overflow-y-auto no-scrollbar pb-4">${sections}</div>` +
      `<div class="mt-auto space-y-3 border-t border-themed py-4">` +
      (collapsed ? '' : `<div class="rounded-xl bg-brand-50 p-4 dark:bg-brand-500/10"><p class="text-xs font-medium text-muted">${t('appNav.proTitle')}</p><p class="mt-0.5 text-sm font-semibold text-heading">${t('appNav.proDesc')}</p><a href="app-eventos.html" class="mt-3 flex h-9 w-full items-center justify-center rounded-lg bg-brand-500 text-xs font-medium text-white transition hover:bg-brand-600">${t('appNav.newEvent')}</a></div>`) +
      `<a href="index.html" class="${navCls(false)} w-full" ${collapsed ? `title="${t('appNav.viewSite')}"` : ''}>${icon('home', { size: 20 })}${collapsed ? '' : `<span>${t('appNav.viewSite')}</span>`}</a>` +
      `<button type="button" data-action="logout" class="${navCls(false)} w-full" ${collapsed ? `title="${t('appNav.logout')}"` : ''}>${icon('logout', { size: 20 })}${collapsed ? '' : `<span>${t('appNav.logout')}</span>`}</button>` +
      `</div>`
    );
  }

  const NOTIFICATIONS = [
    { id: 1, key: 'sale', name: 'Festival Luz 2026', time: 'Há 6 min', read: false },
    { id: 2, key: 'checkin', name: 'Rock na Praça', time: 'Há 32 min', read: false },
    { id: 3, key: 'soldOut', name: 'Baile Neon — VIP', time: 'Há 2 horas', read: true },
  ];

  function renderTopbar() {
    const dark = UIState.get().darkMode;
    const user = Auth.getUser();
    const notifs = NOTIFICATIONS.map(
      (n) =>
        `<li class="flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800"><span class="mt-1 flex h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-gray-300' : 'bg-brand-500'}"></span><div class="flex-1"><p class="text-sm font-medium text-heading">${t('notifications.' + n.key, { name: n.name })}</p><p class="text-xs text-muted">${n.time}</p></div></li>`
    ).join('');

    return (
      `<div class="flex flex-grow items-center justify-between gap-4 px-4 py-3 md:px-6 2xl:px-10">` +
      `<div class="flex items-center gap-3">` +
      `<button type="button" data-action="toggle-sidebar-responsive" class="flex h-10 w-10 items-center justify-center rounded-lg border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="Toggle sidebar">${icon('menu', { size: 20 })}</button>` +
      `<div class="hidden md:block"><div class="relative"><span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">${icon('search', { size: 18 })}</span><input type="text" placeholder="${t('appNav.searchPlaceholder')}" class="h-10 w-[260px] rounded-lg border border-themed bg-gray-50 pl-10 pr-4 text-sm text-body outline-none focus:border-brand-300 focus-ring dark:bg-gray-900 xl:w-[360px]"/></div></div>` +
      `</div>` +
      `<div class="flex items-center gap-2">` +
      `<a href="app-eventos.html" class="hidden h-10 items-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white transition hover:bg-brand-600 sm:flex">${icon('plus', { size: 16 })}${t('appNav.newEvent')}</a>` +
      langDropdown('tx-app-lang') +
      `<button type="button" data-action="toggle-dark" class="flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t('common.theme')}">${icon(dark ? 'sun' : 'moon', { size: 18 })}</button>` +
      `<div class="relative" id="tx-notif"><button type="button" data-action="toggle-menu" data-menu="#tx-notif-menu" class="relative flex h-10 w-10 items-center justify-center rounded-full border border-themed text-muted hover:bg-gray-50 dark:hover:bg-gray-800" aria-label="${t('appNav.notifications')}">${icon('bell', { size: 18 })}<span class="absolute top-1.5 right-1.5 flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-error-400 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-error-500"></span></span></button><div id="tx-notif-menu" class="surface-card absolute right-0 mt-3 w-80 rounded-xl border shadow-theme-lg hidden z-50"><div class="flex items-center justify-between border-b border-themed px-4 py-3"><p class="text-sm font-semibold text-heading">${t('appNav.notifications')}</p></div><ul class="max-h-72 divide-themed overflow-y-auto">${notifs}</ul></div></div>` +
      `<div class="relative" id="tx-profile"><button type="button" data-action="toggle-menu" data-menu="#tx-profile-menu" class="ml-1 flex items-center gap-3"><span class="hidden text-right lg:block"><span class="block text-sm font-medium text-heading">${(user && user.name) || 'Convidado'}</span><span class="block text-xs text-muted">${(user && user.role) || '—'}</span></span><span class="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500 text-sm font-bold text-white">${((user && user.name) || '?').trim().split(/\s+/).slice(0, 2).map((p) => (p[0] || '').toUpperCase()).join('')}</span>${icon('chevron-down', { size: 16, className: 'text-muted' })}</button><div id="tx-profile-menu" class="surface-card absolute right-0 mt-3 w-56 rounded-xl border shadow-theme-lg hidden z-50"><div class="border-b border-themed px-4 py-3"><p class="text-sm font-medium text-heading">${(user && user.name) || 'Convidado'}</p><p class="text-xs text-muted">${(user && user.email) || ''}</p></div><ul class="py-1"><li><a href="app-configuracoes.html" class="flex items-center gap-2 px-4 py-2 text-sm text-body hover:bg-gray-50 dark:hover:bg-gray-800">${icon('settings', { size: 16 })} ${t('appNav.settings')}</a></li></ul><div class="border-t border-themed py-1"><button type="button" data-action="logout" class="flex w-full items-center gap-2 px-4 py-2 text-sm text-error-600 hover:bg-error-50 dark:hover:bg-error-500/10">${icon('logout', { size: 16 })} ${t('appNav.logout')}</button></div></div></div>` +
      `</div></div>`
    );
  }

  function renderAppFooter() {
    const year = new Date().getFullYear();
    return `<div class="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center"><p class="text-xs text-muted">© ${year} ${t('brand')}. ${t('footer.rights')}</p><div class="flex items-center gap-4 text-xs text-muted"><a href="#" class="hover:text-brand-500">${t('footer.help')}</a><a href="contato.html" class="hover:text-brand-500">${t('nav.contact')}</a></div></div>`;
  }

  // ============================================================
  // Cookie banner + toasts
  // ============================================================
  function renderCookieBanner() {
    const ui = UIState.get();
    if (ui.cookiesAccepted && !ui.showCookieBanner) return '';
    if (!ui.showCookieBanner && ui.cookiesAccepted) return '';
    return (
      `<div class="surface-card fixed bottom-4 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border p-5 shadow-theme-xl">` +
      `<div class="flex gap-3"><span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500 dark:bg-brand-500/15">${icon('cookie', { size: 20 })}</span>` +
      `<div class="flex-1"><p class="text-sm font-semibold text-heading">${t('cookie.title')}</p><p class="mt-1 text-xs text-muted">${t('cookie.desc')} <a href="#" class="text-brand-500 hover:underline">${t('cookie.policy')}</a></p>` +
      `<div class="mt-3 flex gap-2"><button type="button" data-action="accept-cookies" class="h-9 rounded-lg bg-brand-500 px-4 text-xs font-medium text-white hover:bg-brand-600">${t('cookie.accept')}</button><button type="button" data-action="decline-cookies" class="h-9 rounded-lg border border-themed px-4 text-xs font-medium text-body hover:bg-gray-50 dark:hover:bg-gray-800">${t('cookie.decline')}</button></div></div></div></div>`
    );
  }
  function updateCookieBanner() {
    const el = document.getElementById('tx-cookie');
    if (el) el.innerHTML = renderCookieBanner();
  }

  const TOAST_STYLES = {
    success: { border: 'border-success-200 dark:border-success-500/30', icon: 'check-circle', color: 'text-success-500' },
    error: { border: 'border-error-200 dark:border-error-500/30', icon: 'x', color: 'text-error-500' },
    warning: { border: 'border-warning-200 dark:border-warning-500/30', icon: 'bell', color: 'text-warning-500' },
    info: { border: 'border-blue-light-200 dark:border-blue-light-500/30', icon: 'bell', color: 'text-blue-light-500' },
  };
  function notify(message, type, duration) {
    type = type || 'info';
    duration = duration || 4000;
    const s = TOAST_STYLES[type] || TOAST_STYLES.info;
    const stack = document.getElementById('tx-toast-stack');
    if (!stack) {
      console.log('[notify]', message);
      return;
    }
    const el = document.createElement('div');
    el.className = 'pointer-events-auto flex w-80 items-start gap-3 rounded-lg border bg-white p-4 shadow-theme-md dark:bg-gray-dark ' + s.border;
    el.innerHTML =
      '<span class="' + s.color + '">' + icon(s.icon, { size: 20 }) + '</span>' +
      '<div class="flex-1"><p class="text-sm font-medium text-heading">' + message + '</p></div>' +
      '<button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">' + icon('x', { size: 16 }) + '</button>';
    el.querySelector('button').addEventListener('click', () => el.remove());
    stack.appendChild(el);
    setTimeout(() => el.remove(), duration);
  }

  // ============================================================
  // DOM update helpers
  // ============================================================
  function updateNavbar() {
    const el = document.getElementById('tx-navbar');
    if (el) el.innerHTML = renderPublicNavbar();
  }
  function updateFooter() {
    const el = document.getElementById('tx-footer');
    if (el) el.innerHTML = renderPublicFooter();
  }
  function updateSidebar() {
    const el = document.getElementById('tx-sidebar');
    if (!el) return;
    el.style.width = UIState.get().sidebarCollapsed ? '90px' : '280px';
    el.innerHTML = renderSidebar();
  }
  function updateTopbar() {
    const el = document.getElementById('tx-topbar');
    if (el) el.innerHTML = renderTopbar();
  }
  function updateAppFooter() {
    const el = document.getElementById('tx-app-footer');
    if (el) el.innerHTML = renderAppFooter();
  }
  function updateSidebarMobile() {
    const el = document.getElementById('tx-sidebar');
    const overlay = document.getElementById('tx-sidebar-overlay');
    if (!el) return;
    const open = UIState.get().sidebarMobileOpen;
    el.classList.toggle('translate-x-0', open);
    el.classList.toggle('-translate-x-full', !open);
    if (overlay) overlay.classList.toggle('hidden', !open);
  }

  // ============================================================
  // Event delegation
  // ============================================================
  function closeAllMenus(except) {
    document.querySelectorAll('[id$="-menu"]').forEach((m) => {
      if (m !== except) m.classList.add('hidden');
    });
  }

  function handleClick(e) {
    const trigger = e.target.closest(
      '[data-action], [data-sort], [data-table-prev], [data-table-next], [data-tab], [data-modal-close], [data-drawer-close], [data-remove-item], [data-page]'
    );

    if (!trigger || ((trigger.getAttribute('data-action') || '').indexOf('toggle-menu') === -1 && trigger.getAttribute('data-action') !== 'toggle-lang')) {
      closeAllMenus();
    }
    if (!trigger) return;

    if (trigger.hasAttribute('data-remove-item')) {
      Cart.remove(trigger.getAttribute('data-remove-item'));
      return;
    }
    if (trigger.hasAttribute('data-page')) {
      if (typeof global.onPageChange === 'function') global.onPageChange(Number(trigger.getAttribute('data-page')));
      return;
    }
    if (trigger.hasAttribute('data-tab')) {
      const wrap = trigger.closest('[data-tabs]');
      if (wrap && typeof global.onTabChange === 'function') global.onTabChange(Number(trigger.getAttribute('data-tab')), wrap);
      return;
    }
    if (trigger.hasAttribute('data-sort')) {
      const wrap = trigger.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      const key = trigger.getAttribute('data-sort');
      if (cfg.sortKey === key) cfg.sortDir = cfg.sortDir === 'asc' ? 'desc' : 'asc';
      else {
        cfg.sortKey = key;
        cfg.sortDir = 'asc';
      }
      renderTable(wrap.id);
      return;
    }
    if (trigger.hasAttribute('data-table-prev') || trigger.hasAttribute('data-table-next')) {
      const wrap = trigger.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      cfg.page += trigger.hasAttribute('data-table-next') ? 1 : -1;
      renderTable(wrap.id);
      return;
    }
    if (trigger.hasAttribute('data-modal-close')) {
      closeModal(trigger.closest('[data-modal]'));
      return;
    }
    if (trigger.hasAttribute('data-drawer-close')) {
      const d = trigger.closest('[data-drawer]');
      if (d) d.classList.add('hidden');
      return;
    }

    const action = trigger.getAttribute('data-action');
    switch (action) {
      case 'toggle-dark':
        UIState.toggleDarkMode();
        if (SHELL === 'public') updateNavbar();
        else if (SHELL === 'app') updateTopbar();
        if (typeof global.onThemeChange === 'function') setTimeout(global.onThemeChange, 50);
        break;
      case 'toggle-lang':
      case 'toggle-menu': {
        e.stopPropagation();
        const sel = trigger.getAttribute('data-menu');
        const menu = sel && document.querySelector(sel);
        closeAllMenus(menu);
        if (menu) menu.classList.toggle('hidden');
        break;
      }
      case 'set-lang':
        e.stopPropagation();
        closeAllMenus();
        if (global.I18n) global.I18n.setLang(trigger.getAttribute('data-lang'));
        break;
      case 'toggle-mobile-menu':
        document.getElementById('tx-mobile-menu') && document.getElementById('tx-mobile-menu').classList.toggle('hidden');
        break;
      case 'toggle-sidebar':
        UIState.toggleSidebar();
        updateSidebar();
        break;
      case 'toggle-sidebar-responsive':
        if (window.innerWidth < 1024) UIState.toggleSidebarMobile();
        else {
          UIState.toggleSidebar();
          updateSidebar();
        }
        break;
      case 'close-sidebar-mobile':
        UIState.toggleSidebarMobile(false);
        break;
      case 'logout':
        Auth.logout();
        window.location.href = 'login.html';
        break;
      case 'accept-cookies':
        UIState.acceptCookies();
        updateCookieBanner();
        break;
      case 'decline-cookies':
        UIState.declineCookies();
        updateCookieBanner();
        break;
      case 'open-cookie-banner':
        UIState.openCookieBanner();
        updateCookieBanner();
        break;
    }
  }

  // Quantity steppers (delegated). Cart steppers carry data-qty-cart; tier
  // selectors carry data-qty-id and dispatch a 'qty:change' event.
  function handleQtyClick(e) {
    const dec = e.target.closest('[data-qty-dec]');
    const inc = e.target.closest('[data-qty-inc]');
    const btn = dec || inc;
    if (!btn) return;
    const wrap = btn.closest('[data-qty]');
    if (!wrap) return;
    const min = Number(wrap.getAttribute('data-qty-min'));
    const max = Number(wrap.getAttribute('data-qty-max'));
    let value = Number(wrap.getAttribute('data-qty-value'));
    value = dec ? Math.max(min, value - 1) : Math.min(max, value + 1);
    const cartId = wrap.getAttribute('data-qty-cart');
    if (cartId) {
      Cart.setQty(cartId, value);
      return; // cart subscribe re-renders
    }
    wrap.setAttribute('data-qty-value', value);
    const disp = wrap.querySelector('[data-qty-display]');
    if (disp) disp.textContent = value;
    wrap.querySelector('[data-qty-dec]').disabled = value <= min;
    wrap.querySelector('[data-qty-inc]').disabled = value >= max;
    document.dispatchEvent(new CustomEvent('qty:change', { detail: { id: wrap.getAttribute('data-qty-id'), value, wrap } }));
  }

  function handleSubmit(e) {
    const checkin = e.target.closest('[data-checkin-form]');
    if (checkin) {
      e.preventDefault();
      if (typeof global.onCheckin === 'function') {
        const input = checkin.querySelector('[data-checkin-input]');
        global.onCheckin((input && input.value) || '', checkin);
      }
      return;
    }
    // Generic page form hook.
    const form = e.target.closest('form[data-page-form]');
    if (form) {
      e.preventDefault();
      if (typeof global.onFormSubmit === 'function') global.onFormSubmit(form.getAttribute('data-page-form'), form);
    }
  }

  function handleInput(e) {
    const tableSearch = e.target.closest('[data-table-search]');
    if (tableSearch) {
      const wrap = tableSearch.closest('[data-table]');
      const cfg = TABLES[wrap.id];
      cfg.search = tableSearch.value;
      cfg.page = 1;
      renderTable(wrap.id);
      const input = document.querySelector(`#${wrap.id} [data-table-search]`);
      if (input) {
        input.focus();
        const v = input.value;
        input.setSelectionRange(v.length, v.length);
      }
      return;
    }
    const filterCtl = e.target.closest('[data-filter]');
    if (filterCtl && typeof global.onFilterChange === 'function') {
      global.onFilterChange(filterCtl.getAttribute('data-filter'), filterCtl.value);
    }
  }

  // ============================================================
  // Init
  // ============================================================
  function buildPublicShell(inner) {
    return (
      `<div class="flex min-h-screen flex-col" style="background-color:var(--tx-body-bg)">` +
      `<header id="tx-navbar" class="surface-header sticky top-0 z-40 border-b border-themed backdrop-blur"></header>` +
      `<main id="tx-main" class="flex-1">${inner}</main>` +
      `<footer id="tx-footer" class="border-t border-themed surface-card"></footer>` +
      `<div id="tx-cookie"></div>` +
      `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }
  function buildAppShell(inner) {
    return (
      `<div class="flex h-screen overflow-hidden" style="background-color:var(--tx-body-bg)">` +
      `<aside id="tx-sidebar" class="surface-sidebar fixed left-0 top-0 z-50 flex h-screen flex-col overflow-y-hidden border-r px-4 transition-transform duration-300 -translate-x-full lg:static lg:translate-x-0" style="width:280px"></aside>` +
      `<div id="tx-sidebar-overlay" class="fixed inset-0 z-40 bg-gray-900/50 lg:hidden hidden" data-action="close-sidebar-mobile"></div>` +
      `<div class="relative flex flex-1 flex-col overflow-x-hidden overflow-y-auto">` +
      `<header id="tx-topbar" class="surface-header sticky top-0 z-30 flex w-full border-b"></header>` +
      `<main class="flex-1"><div class="mx-auto max-w-screen-2xl p-4 md:p-6 2xl:p-10">${inner}</div></main>` +
      `<footer id="tx-app-footer" class="surface-header border-t px-4 py-4 md:px-6 2xl:px-10"></footer>` +
      `</div>` +
      `<div id="tx-cookie"></div>` +
      `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>` +
      `</div>`
    );
  }
  function buildBlankShell(inner) {
    return inner + `<div id="tx-toast-stack" class="pointer-events-none fixed top-4 right-4 z-[100] flex flex-col gap-2"></div>`;
  }

  function init() {
    const app = document.getElementById('app');
    if (!app) return;

    if (SHELL === 'app' || document.body.getAttribute('data-guard') === 'true') {
      if (!Auth.requireAuth()) return;
    }

    const inner = app.innerHTML;
    if (SHELL === 'app') app.outerHTML = buildAppShell(inner);
    else if (SHELL === 'blank') app.outerHTML = buildBlankShell(inner);
    else app.outerHTML = buildPublicShell(inner);

    global.UIToast = notify;
    global.notify = notify;

    const renderChrome = () => {
      if (SHELL === 'public') {
        updateNavbar();
        updateFooter();
        updateCookieBanner();
      } else if (SHELL === 'app') {
        updateSidebar();
        updateTopbar();
        updateAppFooter();
        updateSidebarMobile();
        updateCookieBanner();
      }
    };
    renderChrome();

    document.addEventListener('i18n:changed', () => {
      renderChrome();
      if (typeof global.renderPage === 'function') global.renderPage();
    });

    UIState.subscribe(() => {
      if (SHELL === 'app') updateSidebarMobile();
    });

    // Public navbar cart badge reacts to cart changes.
    if (SHELL === 'public') Cart.subscribe(() => updateNavbar());

    document.addEventListener('click', handleClick);
    document.addEventListener('click', handleQtyClick);
    document.addEventListener('submit', handleSubmit);
    document.addEventListener('input', handleInput);
    document.addEventListener('change', handleInput);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        closeAllMenus();
        document.querySelectorAll('[data-modal]:not(.hidden)').forEach((m) => m.classList.add('hidden'));
        document.querySelectorAll('[data-drawer]:not(.hidden)').forEach((d) => d.classList.add('hidden'));
        if (UIState.get().sidebarMobileOpen) UIState.toggleSidebarMobile(false);
      }
    });

    if (global.I18n) global.I18n.whenReady(() => typeof global.renderPage === 'function' && global.renderPage());
    else if (typeof global.renderPage === 'function') global.renderPage();
  }

  // Expose helpers for pages.
  global.UI = {
    t,
    lang,
    fmt,
    fmtCompact,
    fmtDate,
    fmtDateTime,
    fmtTime,
    fromNow,
    icon,
    notify,
    badge,
    statusPill,
    emptyState,
    breadcrumb,
    pageHeader,
    switchToggle,
    kpiCard,
    quantityStepper,
    eventCard,
    ticketTierSelector,
    cartItem,
    qrSvg,
    ticketCard,
    checkinScanner,
    attendeeRow,
    filterBar,
    searchInput,
    selectInput,
    tabs,
    modal,
    openModal,
    closeModal,
    drawer,
    dataTable,
    renderTable,
    pagination,
  };
  global.Layout = { init, updateSidebar, updateTopbar, updateNavbar, updateFooter };

  if (document.getElementById('app')) init();
  else document.addEventListener('DOMContentLoaded', init);
})(window);
