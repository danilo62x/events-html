/* ===== Locale-aware formatting helpers — ports React src/lib/format.ts =====
   Exposed as global.Format. Data.js re-exports the same functions for parity
   with the other vertical templates (Data.formatCurrency, ...). */
(function (global) {
  const LOCALE_MAP = {
    'pt-BR': { locale: 'pt-BR', currency: 'BRL' },
    en: { locale: 'en-US', currency: 'USD' },
    es: { locale: 'es-ES', currency: 'EUR' },
  };

  function cfgFor(lang) {
    return LOCALE_MAP[lang || 'pt-BR'] || LOCALE_MAP['pt-BR'];
  }

  function formatCurrency(value, lang) {
    const cfg = cfgFor(lang);
    return new Intl.NumberFormat(cfg.locale, {
      style: 'currency',
      currency: cfg.currency,
      maximumFractionDigits: value % 1 === 0 ? 0 : 2,
    }).format(value);
  }

  function formatCompact(value, lang) {
    const cfg = cfgFor(lang);
    return new Intl.NumberFormat(cfg.locale, { notation: 'compact', maximumFractionDigits: 1 }).format(value);
  }

  function formatDate(iso, lang) {
    const cfg = cfgFor(lang);
    return new Intl.DateTimeFormat(cfg.locale, { dateStyle: 'medium' }).format(new Date(iso));
  }

  function formatTime(iso, lang) {
    const cfg = cfgFor(lang);
    return new Intl.DateTimeFormat(cfg.locale, { hour: '2-digit', minute: '2-digit' }).format(new Date(iso));
  }

  function formatDateTime(iso, lang) {
    const cfg = cfgFor(lang);
    return new Intl.DateTimeFormat(cfg.locale, {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(iso));
  }

  function fromNow(iso, lang) {
    const cfg = cfgFor(lang);
    const rtf = new Intl.RelativeTimeFormat(cfg.locale, { numeric: 'auto' });
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.round(diff / 60000);
    if (Math.abs(mins) < 60) return rtf.format(-mins, 'minute');
    const hours = Math.round(mins / 60);
    if (Math.abs(hours) < 24) return rtf.format(-hours, 'hour');
    const days = Math.round(hours / 24);
    return rtf.format(-days, 'day');
  }

  global.Format = {
    formatCurrency,
    formatCompact,
    formatDate,
    formatTime,
    formatDateTime,
    fromNow,
  };
})(window);
