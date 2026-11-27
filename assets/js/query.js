/* ===== Query helpers — event search/filter + dashboard metrics + pagination =====
   Ports React src/data/query.ts. Backs the public listing, dashboard and tables. */
(function (global) {
  // ---- Event search & filtering ----
  function searchEvents(list, query) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.organizer.toLowerCase().includes(q)
    );
  }

  function filterEvents(list, f) {
    f = f || {};
    let out = list;
    if (f.query) out = searchEvents(out, f.query);
    if (f.category) out = out.filter((e) => e.category === f.category);
    if (f.city) out = out.filter((e) => e.city === f.city);
    if (f.fromDate) {
      const from = new Date(f.fromDate).getTime();
      out = out.filter((e) => new Date(e.date).getTime() >= from);
    }
    return out;
  }

  function publishedEvents(list) {
    return list.filter((e) => e.status === 'published');
  }
  function featuredEvents(list) {
    return publishedEvents(list).filter((e) => e.featured);
  }
  function upcomingEvents(list, limit) {
    limit = limit || 6;
    const now = Date.now();
    return publishedEvents(list)
      .filter((e) => new Date(e.date).getTime() >= now)
      .sort((a, b) => +new Date(a.date) - +new Date(b.date))
      .slice(0, limit);
  }
  function eventBySlug(list, slug) {
    return list.find((e) => e.slug === slug);
  }
  function eventById(list, id) {
    return list.find((e) => e.id === id);
  }
  function uniqueCities(list) {
    return [...new Set(list.map((e) => e.city))].sort();
  }
  function tiersForEvent(tiers, eventId) {
    return tiers.filter((t) => t.eventId === eventId);
  }
  function tierRemaining(tier) {
    return Math.max(0, tier.total - tier.sold);
  }
  function eventPriceFrom(tiers, eventId) {
    const active = tiersForEvent(tiers, eventId).filter((t) => t.active && tierRemaining(t) > 0);
    if (active.length === 0) return 0;
    return Math.min.apply(null, active.map((t) => t.price));
  }

  // ---- Dashboard metrics ----
  function computeMetrics(orders, tickets) {
    const paid = orders.filter((o) => o.status === 'paid');
    const ticketsSold = paid.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.qty, 0), 0);
    const revenue = paid.reduce((s, o) => s + o.total, 0);
    const checkedIn = tickets.filter((t) => t.checkedIn).length;
    return {
      totalSales: paid.length,
      ticketsSold,
      revenue,
      checkInRate: tickets.length === 0 ? 0 : Math.round((checkedIn / tickets.length) * 100),
    };
  }

  function revenueByCategory(events, orders) {
    const map = new Map();
    const byId = new Map(events.map((e) => [e.id, e]));
    for (const o of orders.filter((o) => o.status === 'paid')) {
      for (const l of o.lines) {
        const ev = byId.get(l.eventId);
        if (!ev) continue;
        const entry = map.get(ev.category) || { events: new Set(), revenue: 0 };
        entry.events.add(ev.id);
        entry.revenue += l.unitPrice * l.qty;
        map.set(ev.category, entry);
      }
    }
    return [...map.entries()].map(([category, v]) => ({ category, events: v.events.size, revenue: v.revenue }));
  }

  function salesSeries() {
    return Data.SALES_SERIES;
  }
  function byCategory() {
    return Data.CATEGORY_DATA;
  }

  function attendeesByEvent(attendees, eventId) {
    return attendees.filter((a) => a.eventId === eventId);
  }
  function ordersForEvent(orders, eventId) {
    return orders.filter((o) => o.lines.some((l) => l.eventId === eventId));
  }
  function recentOrders(orders, limit) {
    limit = limit || 6;
    return [...orders].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, limit);
  }

  // ---- Generic table helpers ----
  function getValue(row, key) {
    return key.split('.').reduce((o, k) => (o == null ? o : o[k]), row);
  }
  function searchRows(list, query, keys) {
    const q = (query || '').trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      keys.some((k) => {
        const v = getValue(row, k);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }
  function sortRows(list, key, dir) {
    if (!key) return list;
    const out = [...list];
    out.sort((a, b) => {
      const av = getValue(a, key);
      const bv = getValue(b, key);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return dir === 'desc' ? bv - av : av - bv;
      const cmp = String(av).localeCompare(String(bv));
      return dir === 'desc' ? -cmp : cmp;
    });
    return out;
  }
  function pageCount(total, perPage) {
    return Math.max(1, Math.ceil(total / perPage));
  }
  // paginate(list, page, perPage) -> { items, page, totalPages, total }
  function paginate(list, page, perPage) {
    const total = list.length;
    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * perPage;
    return { items: list.slice(start, start + perPage), page: safePage, totalPages, total };
  }

  global.Query = {
    searchEvents,
    filterEvents,
    publishedEvents,
    featuredEvents,
    upcomingEvents,
    eventBySlug,
    eventById,
    uniqueCities,
    tiersForEvent,
    tierRemaining,
    eventPriceFrom,
    computeMetrics,
    revenueByCategory,
    salesSeries,
    byCategory,
    attendeesByEvent,
    ordersForEvent,
    recentOrders,
    searchRows,
    sortRows,
    pageCount,
    paginate,
  };
})(window);
