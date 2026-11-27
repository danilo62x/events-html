/* ===== Domain stores — Cart (ev-cart) + EventsStore (ev-events) =====
   Mirrors React src/stores/{cart,events}.ts. Persisted in localStorage with the
   same keys/logic. Both expose subscribe() so the chrome + pages can re-render. */
(function (global) {
  const FEE_RATE = Data.FEE_RATE;

  function round2(v) {
    return Math.round(v * 100) / 100;
  }

  // ============================================================
  // Cart store (ev-cart)
  // ============================================================
  const Cart = (function () {
    const KEY = 'ev-cart';
    let items = [];
    const listeners = new Set();

    try {
      const raw = localStorage.getItem(KEY);
      if (raw) items = JSON.parse(raw).items || [];
    } catch (_) {}

    function persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify({ items }));
      } catch (_) {}
    }
    function emit() {
      persist();
      listeners.forEach((cb) => cb(items));
    }
    function lineKey(eventId, tierId) {
      return `${eventId}|${tierId}`;
    }

    return {
      subscribe(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      items() {
        return items;
      },
      // add(item, qty) — item: { eventId, eventSlug, eventTitle, cover, tierId, tierName, price, remaining }
      add(item, qty) {
        qty = qty || 1;
        const id = lineKey(item.eventId, item.tierId);
        const existing = items.find((i) => i.id === id);
        if (existing) {
          existing.qty = Math.min(existing.remaining, existing.qty + qty);
        } else {
          items.push(Object.assign({}, item, { id, qty: Math.min(item.remaining, qty) }));
        }
        emit();
      },
      remove(id) {
        items = items.filter((i) => i.id !== id);
        emit();
      },
      setQty(id, qty) {
        const i = items.find((x) => x.id === id);
        if (i) i.qty = Math.max(1, Math.min(i.remaining, qty));
        emit();
      },
      increment(id) {
        const i = items.find((x) => x.id === id);
        if (i) this.setQty(id, i.qty + 1);
      },
      decrement(id) {
        const i = items.find((x) => x.id === id);
        if (i) this.setQty(id, i.qty - 1);
      },
      clear() {
        items = [];
        emit();
      },
      count() {
        return items.reduce((s, i) => s + i.qty, 0);
      },
      subtotal() {
        return items.reduce((s, i) => s + i.price * i.qty, 0);
      },
      fee() {
        return round2(this.subtotal() * FEE_RATE);
      },
      total() {
        return this.subtotal() + this.fee();
      },
    };
  })();

  // ============================================================
  // Events store (ev-events) — events/tiers/orders/tickets/attendees
  // ============================================================
  const EventsStore = (function () {
    const KEY = 'ev-events';
    let seq = 9000;
    const nextId = () => ++seq;
    const listeners = new Set();

    function deepCopy(v) {
      return JSON.parse(JSON.stringify(v));
    }

    let state = {
      events: deepCopy(Data.EVENTS),
      tiers: deepCopy(Data.TIERS),
      orders: deepCopy(Data.ORDERS),
      tickets: deepCopy(Data.TICKETS),
      attendees: deepCopy(Data.ATTENDEES),
    };

    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const p = JSON.parse(raw);
        state = {
          events: p.events || state.events,
          tiers: p.tiers || state.tiers,
          orders: p.orders || state.orders,
          tickets: p.tickets || state.tickets,
          attendees: p.attendees || state.attendees,
        };
      }
    } catch (_) {}

    function persist() {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (_) {}
    }
    function emit() {
      persist();
      listeners.forEach((cb) => cb(state));
    }

    function slugify(title) {
      return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    function genCode(prefix) {
      return `${prefix}-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    return {
      subscribe(cb) {
        listeners.add(cb);
        return () => listeners.delete(cb);
      },
      get() {
        return state;
      },

      createEvent(data) {
        const id = nextId();
        const event = {
          id,
          slug: data.slug || slugify(data.title) || `evento-${id}`,
          title: data.title,
          category: data.category,
          date: data.date || new Date().toISOString(),
          endDate: data.endDate,
          venue: data.venue || '',
          city: data.city || '',
          address: data.address || '',
          cover: data.cover || (function() { var ids=['1470229722913-7c0e2dbbafd3','1429962714451-bb934ecdc4ec','1506157786151-b8491531f063','1540575467063-178a50c2df87','1492684223066-81342ee5ff30','1514525253161-7a46d19cd819','1516450360452-9312f5e86fc7','1459749411175-04bf5292ceea','1533174072545-7a4b6ad7a6c3','1561489413-985b06da5bee','1488590528505-98d2b5aba04b','1558618666-fcd25c85cd64']; return 'https://images.unsplash.com/photo-'+ids[id%ids.length]+'?w=800&h=480&fit=crop&q=70&auto=format'; })(),
          description: data.description || '',
          organizer: data.organizer || '',
          status: data.status || 'draft',
          featured: data.featured == null ? false : data.featured,
        };
        state.events = [event].concat(state.events);
        emit();
        return event;
      },
      updateEvent(id, patch) {
        state.events = state.events.map((e) => (e.id === id ? Object.assign({}, e, patch) : e));
        emit();
      },
      publishEvent(id) {
        this.updateEvent(id, { status: 'published' });
      },
      endEvent(id) {
        this.updateEvent(id, { status: 'ended' });
      },

      addTier(eventId, tier) {
        const full = Object.assign({}, tier, { id: `t${eventId}-${nextId()}`, eventId, sold: 0 });
        state.tiers = state.tiers.concat([full]);
        emit();
        return full;
      },
      updateTier(id, patch) {
        state.tiers = state.tiers.map((t) => (t.id === id ? Object.assign({}, t, patch) : t));
        emit();
      },
      removeTier(id) {
        state.tiers = state.tiers.filter((t) => t.id !== id);
        emit();
      },

      // checkout(payload) — payload: { buyerName, buyerEmail, payment, items:[CartLine] }
      checkout(payload) {
        const subtotal = payload.items.reduce((s, i) => s + i.price * i.qty, 0);
        const fee = Math.round(subtotal * FEE_RATE * 100) / 100;
        const orderId = `o-${nextId()}`;
        const lines = payload.items.map((i) => ({
          tierId: i.tierId,
          tierName: i.tierName,
          eventId: i.eventId,
          eventTitle: i.eventTitle,
          unitPrice: i.price,
          qty: i.qty,
        }));
        const order = {
          id: orderId,
          code: genCode('EVT'),
          createdAt: new Date().toISOString(),
          buyerName: payload.buyerName,
          buyerEmail: payload.buyerEmail,
          lines,
          subtotal,
          fee,
          total: subtotal + fee,
          payment: payload.payment,
          status: payload.payment === 'boleto' ? 'pending' : 'paid',
        };

        const newTickets = [];
        const newAttendees = [];
        for (const line of lines) {
          for (let q = 0; q < line.qty; q++) {
            const code = `TK${genCode('').replace('-', '')}-${line.eventId}`;
            newTickets.push({
              id: `tk-${nextId()}`,
              code,
              orderId,
              eventId: line.eventId,
              eventTitle: line.eventTitle,
              tierId: line.tierId,
              tierName: line.tierName,
              attendeeName: payload.buyerName,
              attendeeEmail: payload.buyerEmail,
              checkedIn: false,
            });
            newAttendees.push({
              id: nextId(),
              name: payload.buyerName,
              email: payload.buyerEmail,
              eventId: line.eventId,
              ticketCode: code,
              tierName: line.tierName,
              checkedIn: false,
              purchasedAt: order.createdAt,
            });
          }
        }

        const soldByTier = {};
        for (const l of lines) soldByTier[l.tierId] = (soldByTier[l.tierId] || 0) + l.qty;

        state.orders = [order].concat(state.orders);
        state.tickets = newTickets.concat(state.tickets);
        state.attendees = newAttendees.concat(state.attendees);
        state.tiers = state.tiers.map((t) =>
          soldByTier[t.id] != null ? Object.assign({}, t, { sold: t.sold + soldByTier[t.id] }) : t
        );
        emit();
        return { order, tickets: newTickets };
      },

      checkInTicket(code) {
        const trimmed = (code || '').trim().toUpperCase();
        const ticket = state.tickets.find((t) => t.code.toUpperCase() === trimmed);
        if (!ticket) return { ok: false, reason: 'notfound' };
        if (ticket.checkedIn) return { ok: false, ticket, reason: 'already' };
        const when = new Date().toISOString();
        state.tickets = state.tickets.map((t) =>
          t.id === ticket.id ? Object.assign({}, t, { checkedIn: true, checkedInAt: when }) : t
        );
        state.attendees = state.attendees.map((a) =>
          a.ticketCode === ticket.code ? Object.assign({}, a, { checkedIn: true }) : a
        );
        emit();
        return { ok: true, ticket: Object.assign({}, ticket, { checkedIn: true, checkedInAt: when }) };
      },

      reset() {
        state = {
          events: deepCopy(Data.EVENTS),
          tiers: deepCopy(Data.TIERS),
          orders: deepCopy(Data.ORDERS),
          tickets: deepCopy(Data.TICKETS),
          attendees: deepCopy(Data.ATTENDEES),
        };
        emit();
      },
    };
  })();

  global.Cart = Cart;
  global.EventsStore = EventsStore;
})(window);
