/* ===== Mock data + format helpers — ports React src/data/mock.ts + lib/format.ts =====
   i18n keys render translated labels; raw values (titles, prices, dates) live here.
   Exposed as global.Data. */
(function (global) {
  // Curated Unsplash set — shows, festivais, palcos, plateia (IDs verificados).
  const EV_IMG = ['1470229722913-7c0e2dbbafd3', '1429962714451-bb934ecdc4ec', '1506157786151-b8491531f063', '1540575467063-178a50c2df87', '1492684223066-81342ee5ff30', '1514525253161-7a46d19cd819', '1516450360452-9312f5e86fc7', '1459749411175-04bf5292ceea', '1533174072545-7a4b6ad7a6c3', '1561489413-985b06da5bee', '1488590528505-98d2b5aba04b', '1558618666-fcd25c85cd64'];
  function evHash(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; }
  const cover = (seed) => `https://images.unsplash.com/photo-${EV_IMG[evHash(seed) % EV_IMG.length]}?w=800&h=480&fit=crop&q=70&auto=format`;

  // Build an ISO datetime N days from "now" at a given hour.
  function dayAt(offsetDays, hour) {
    hour = hour == null ? 20 : hour;
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    d.setHours(hour, 0, 0, 0);
    return d.toISOString();
  }

  // ---- Category metadata (icon + accent) ----
  const CATEGORY_META = {
    show: { icon: 'music', color: 'brand' },
    teatro: { icon: 'theater', color: 'warning' },
    curso: { icon: 'book', color: 'info' },
    esporte: { icon: 'trophy', color: 'success' },
    festa: { icon: 'party-popper', color: 'error' },
  };
  const CATEGORIES = ['show', 'teatro', 'curso', 'esporte', 'festa'];

  // ---- Events ----
  const EVENTS = [
    { id: 1, slug: 'festival-luz-2026', title: 'Festival Luz 2026', category: 'show', date: dayAt(18, 18), endDate: dayAt(20, 23), venue: 'Arena Anhembi', city: 'São Paulo', address: 'Av. Olavo Fontoura, 1209 — Santana', cover: cover('festival'), description: 'Três dias de música com mais de 40 atrações nacionais e internacionais espalhadas por quatro palcos. Estrutura completa de gastronomia, área de descanso e ativações.', organizer: 'Luz Produções', status: 'published', featured: true, lat: -23.515, lng: -46.633 },
    { id: 2, slug: 'rock-na-praca', title: 'Rock na Praça', category: 'show', date: dayAt(7, 19), venue: 'Praça da Estação', city: 'Belo Horizonte', address: 'Praça Rui Barbosa, s/n — Centro', cover: cover('rock'), description: 'Uma noite dedicada ao rock independente mineiro, com bandas autorais e DJ set de encerramento.', organizer: 'Coletivo Som da Praça', status: 'published', featured: true, lat: -19.918, lng: -43.939 },
    { id: 3, slug: 'hamlet-revisitado', title: 'Hamlet Revisitado', category: 'teatro', date: dayAt(12, 21), venue: 'Teatro Municipal', city: 'Rio de Janeiro', address: 'Praça Floriano, s/n — Centro', cover: cover('hamlet'), description: 'Releitura contemporânea do clássico de Shakespeare, em montagem premiada que mistura teatro físico e projeções.', organizer: 'Cia. Palco Aberto', status: 'published', featured: true, lat: -22.908, lng: -43.176 },
    { id: 4, slug: 'workshop-react-avancado', title: 'Workshop React Avançado', category: 'curso', date: dayAt(5, 9), endDate: dayAt(5, 18), venue: 'Hub Inovação', city: 'Florianópolis', address: 'Rod. SC-401, 8600 — Sapiens Parque', cover: cover('react'), description: 'Imersão prática de um dia em padrões avançados de React 19, performance, testes e arquitetura de componentes.', organizer: 'DevSchool', status: 'published', lat: -27.43, lng: -48.45 },
    { id: 5, slug: 'maratona-da-serra', title: 'Maratona da Serra', category: 'esporte', date: dayAt(30, 6), venue: 'Parque Estadual', city: 'Campos do Jordão', address: 'Av. Pedro Paulo, km 3 — Capivari', cover: cover('maratona'), description: 'Percursos de 5km, 10km e 21km em meio à Mata Atlântica, com cronometragem oficial e kit do atleta.', organizer: 'Serra Running', status: 'published', featured: true, lat: -22.739, lng: -45.591 },
    { id: 6, slug: 'baile-neon', title: 'Baile Neon', category: 'festa', date: dayAt(3, 23), venue: 'Club Vortex', city: 'São Paulo', address: 'Rua Augusta, 1500 — Consolação', cover: cover('neon'), description: 'A maior festa neon da cidade volta com line-up de DJs residentes, pintura fluorescente e open de drinks até meia-noite.', organizer: 'Vortex Entertainment', status: 'published', lat: -23.554, lng: -46.66 },
    { id: 7, slug: 'sinfonica-classicos', title: 'Sinfônica: Clássicos do Cinema', category: 'show', date: dayAt(22, 20), venue: 'Sala São Paulo', city: 'São Paulo', address: 'Praça Júlio Prestes, 16 — Campos Elíseos', cover: cover('sinfonica'), description: 'Orquestra completa interpretando trilhas inesquecíveis do cinema, com regência convidada e telão.', organizer: 'Filarmônica SP', status: 'published', lat: -23.534, lng: -46.643 },
    { id: 8, slug: 'comedia-stand-up-night', title: 'Stand-Up Comedy Night', category: 'teatro', date: dayAt(9, 21), venue: 'Teatro Rival', city: 'Rio de Janeiro', address: 'Rua Álvaro Alvim, 33 — Cinelândia', cover: cover('standup'), description: 'Quatro comediantes, uma noite de improviso e muito humor afiado. Classificação 16 anos.', organizer: 'Riso Produções', status: 'published', lat: -22.911, lng: -43.176 },
    { id: 9, slug: 'bootcamp-design-ux', title: 'Bootcamp Design UX', category: 'curso', date: dayAt(40, 9), endDate: dayAt(42, 17), venue: 'Espaço Criativo', city: 'Curitiba', address: 'Rua XV de Novembro, 700 — Centro', cover: cover('uxbootcamp'), description: 'Três dias de bootcamp intensivo de UX: pesquisa, prototipação, testes de usabilidade e portfólio.', organizer: 'UX Lab', status: 'draft', lat: -25.428, lng: -49.273 },
    { id: 10, slug: 'classico-regional', title: 'Clássico Regional de Futebol', category: 'esporte', date: dayAt(14, 16), venue: 'Estádio Central', city: 'Porto Alegre', address: 'Av. Padre Cacique, 891 — Praia de Belas', cover: cover('futebol'), description: 'O clássico que para a cidade. Arquibancadas, cadeiras e camarotes disponíveis.', organizer: 'Federação Estadual', status: 'published', lat: -30.071, lng: -51.235 },
    { id: 11, slug: 'reveillon-na-orla', title: 'Réveillon na Orla', category: 'festa', date: dayAt(60, 22), venue: 'Praia de Iracema', city: 'Fortaleza', address: 'Av. Beira Mar, s/n — Meireles', cover: cover('reveillon'), description: 'Virada do ano à beira-mar com shows ao vivo, queima de fogos de 12 minutos e área lounge premium.', organizer: 'Litoral Eventos', status: 'published', featured: true, lat: -3.72, lng: -38.51 },
    { id: 12, slug: 'mostra-jazz-encerrada', title: 'Mostra de Jazz', category: 'show', date: dayAt(-20, 20), venue: 'Centro Cultural', city: 'São Paulo', address: 'Rua Vergueiro, 1000 — Paraíso', cover: cover('jazz'), description: 'Edição encerrada da mostra anual de jazz, com músicos de oito países e jam sessions abertas.', organizer: 'Jazz Coletivo', status: 'ended', lat: -23.571, lng: -46.64 },
  ];

  // ---- Ticket tiers ----
  function tiersFor(eventId, seeds) {
    return seeds.map((s, i) => ({
      id: `t${eventId}-${i + 1}`,
      eventId,
      name: s.name,
      price: s.price,
      total: s.total,
      sold: s.sold,
      active: s.active == null ? true : s.active,
    }));
  }

  const TIERS = [].concat(
    tiersFor(1, [
      { name: '1º Lote', price: 180, total: 2000, sold: 2000, active: false },
      { name: '2º Lote', price: 240, total: 3000, sold: 1820 },
      { name: 'Pista Premium', price: 380, total: 1500, sold: 640 },
      { name: 'VIP', price: 640, total: 400, sold: 210 },
    ]),
    tiersFor(2, [
      { name: 'Pista', price: 60, total: 1200, sold: 540 },
      { name: 'Front Stage', price: 110, total: 300, sold: 96 },
    ]),
    tiersFor(3, [
      { name: 'Plateia', price: 90, total: 600, sold: 410 },
      { name: 'Balcão', price: 60, total: 400, sold: 180 },
      { name: 'Camarote', price: 150, total: 80, sold: 64 },
    ]),
    tiersFor(4, [
      { name: 'Inscrição', price: 320, total: 80, sold: 53 },
      { name: 'Inscrição + Mentoria', price: 520, total: 20, sold: 11 },
    ]),
    tiersFor(5, [
      { name: '5km', price: 90, total: 1500, sold: 980 },
      { name: '10km', price: 120, total: 1200, sold: 760 },
      { name: '21km', price: 160, total: 800, sold: 540 },
    ]),
    tiersFor(6, [
      { name: '1º Lote', price: 50, total: 800, sold: 800, active: false },
      { name: 'Pista', price: 80, total: 1000, sold: 430 },
      { name: 'Open Bar', price: 160, total: 300, sold: 120 },
    ]),
    tiersFor(7, [
      { name: 'Plateia Inferior', price: 140, total: 700, sold: 520 },
      { name: 'Plateia Superior', price: 90, total: 500, sold: 300 },
    ]),
    tiersFor(8, [
      { name: 'Mesa', price: 70, total: 200, sold: 150 },
      { name: 'Cadeira', price: 50, total: 300, sold: 210 },
    ]),
    tiersFor(9, [
      { name: 'Inscrição', price: 890, total: 60, sold: 0 },
      { name: 'Early Bird', price: 690, total: 30, sold: 0, active: false },
    ]),
    tiersFor(10, [
      { name: 'Arquibancada', price: 40, total: 8000, sold: 5200 },
      { name: 'Cadeira', price: 90, total: 3000, sold: 1800 },
      { name: 'Camarote', price: 350, total: 200, sold: 140 },
    ]),
    tiersFor(11, [
      { name: 'Pista', price: 120, total: 5000, sold: 2300 },
      { name: 'Lounge Premium', price: 480, total: 800, sold: 290 },
      { name: 'Open Premium', price: 720, total: 300, sold: 88 },
    ]),
    tiersFor(12, [{ name: 'Inteira', price: 60, total: 500, sold: 500, active: false }])
  );

  // ---- Orders ----
  const BUYERS = [
    ['Mariana Costa', 'mariana.costa@email.com'],
    ['Rafael Lima', 'rafael.lima@email.com'],
    ['Beatriz Souza', 'beatriz.souza@email.com'],
    ['Lucas Pereira', 'lucas.pereira@email.com'],
    ['Camila Rocha', 'camila.rocha@email.com'],
    ['Thiago Alves', 'thiago.alves@email.com'],
    ['Juliana Dias', 'juliana.dias@email.com'],
    ['Pedro Santos', 'pedro.santos@email.com'],
    ['Aline Martins', 'aline.martins@email.com'],
    ['Bruno Ferreira', 'bruno.ferreira@email.com'],
  ];

  const FEE_RATE = 0.1;

  function buildOrders() {
    const orders = [];
    const sellable = TIERS.filter((t) => t.active && t.sold > 0);
    for (let i = 0; i < 30; i++) {
      const tier = sellable[i % sellable.length];
      const event = EVENTS.find((e) => e.id === tier.eventId);
      const buyer = BUYERS[i % BUYERS.length];
      const qty = (i % 3) + 1;
      const subtotal = tier.price * qty;
      const fee = Math.round(subtotal * FEE_RATE * 100) / 100;
      const payment = ['card', 'pix', 'boleto'][i % 3];
      const status = i % 7 === 0 ? 'pending' : 'paid';
      const daysAgo = (i % 25) + 1;
      const created = new Date();
      created.setDate(created.getDate() - daysAgo);
      orders.push({
        id: `o-${1000 + i}`,
        code: `EVT-${(48230 + i * 7).toString()}`,
        createdAt: created.toISOString(),
        buyerName: buyer[0],
        buyerEmail: buyer[1],
        lines: [
          {
            tierId: tier.id,
            tierName: tier.name,
            eventId: event.id,
            eventTitle: event.title,
            unitPrice: tier.price,
            qty,
          },
        ],
        subtotal,
        fee,
        total: subtotal + fee,
        payment,
        status,
      });
    }
    return orders;
  }

  const ORDERS = buildOrders();

  // ---- Emitted tickets (with QR-payload code) ----
  function buildTickets() {
    const tickets = [];
    let n = 0;
    for (const order of ORDERS.filter((o) => o.status === 'paid')) {
      for (const line of order.lines) {
        for (let q = 0; q < line.qty; q++) {
          n++;
          tickets.push({
            id: `tk-${n}`,
            code: `TK${(900000 + n * 13).toString(36).toUpperCase()}-${line.eventId}`,
            orderId: order.id,
            eventId: line.eventId,
            eventTitle: line.eventTitle,
            tierId: line.tierId,
            tierName: line.tierName,
            attendeeName: order.buyerName,
            attendeeEmail: order.buyerEmail,
            checkedIn: n % 3 === 0,
            checkedInAt: n % 3 === 0 ? new Date().toISOString() : undefined,
          });
        }
      }
    }
    return tickets;
  }

  const TICKETS = buildTickets();

  // ---- Attendees ----
  const ATTENDEES = TICKETS.map((tk, i) => ({
    id: 5000 + i,
    name: tk.attendeeName,
    email: tk.attendeeEmail,
    eventId: tk.eventId,
    ticketCode: tk.code,
    tierName: tk.tierName,
    checkedIn: tk.checkedIn,
    purchasedAt: (ORDERS.find((o) => o.id === tk.orderId) || {}).createdAt || new Date().toISOString(),
  }));

  // ---- Dashboard series (last 6 months) ----
  const SALES_SERIES = {
    categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    sales: [320, 410, 380, 520, 610, 740],
    revenue: [42000, 53800, 49200, 71500, 82400, 98600],
  };

  const CATEGORY_DATA = [
    { category: 'show', events: 4, revenue: 156000 },
    { category: 'festa', events: 2, revenue: 88000 },
    { category: 'esporte', events: 2, revenue: 64000 },
    { category: 'teatro', events: 2, revenue: 31000 },
    { category: 'curso', events: 2, revenue: 28000 },
  ];

  // Demo buyer identity shown on the public ticket area.
  const DEMO_BUYER = { name: 'Visitante Demo', email: 'organizador@eventos.com' };

  global.Data = Object.assign(
    {
      FEE_RATE,
      CATEGORY_META,
      CATEGORIES,
      EVENTS,
      TIERS,
      ORDERS,
      TICKETS,
      ATTENDEES,
      SALES_SERIES,
      CATEGORY_DATA,
      DEMO_BUYER,
    },
    global.Format || {}
  );
})(window);
