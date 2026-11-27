/*
 * Timetags per product — pure logica (issue #58, ADR-015).
 * Wordt in de browser geladen via src/App.jsx (zet window.Timetags)
 * en in Node (tests) via require() in tools/test-*.cjs.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.Timetags = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const MIN_DAYS = 0; // 0 = geen tag
  const MAX_DAYS = 365;

  // Backwards compatible: missing/corrupt timetag-veld -> null (geen restrictie, geen migratie).
  function normalizeTimetag(raw) {
    if (raw === null || raw === undefined) return null;
    if (typeof raw !== 'object') return null;
    let d = Number(raw.days);
    if (!Number.isFinite(d)) return null;
    d = Math.trunc(d);
    if (d <= MIN_DAYS) return null;
    if (d > MAX_DAYS) d = MAX_DAYS;
    return { days: d };
  }

  // Valideer ruwe invoer uit het productformulier.
  // ok:false -> afwijzen met foutmelding; de oude opgeslagen waarde blijft behouden (callers slaan dan niet op).
  // ok:true  -> timetag (null bij 0 = geen tag); >365 wordt geclamped naar 365 met melding.
  function validateTimetagInput(raw) {
    if (raw === null || raw === undefined || String(raw).trim() === '') {
      return { ok: false, error: 'Timetag: vul een aantal dagen in (0-365). Gebruik 0 voor geen tag.' };
    }
    const s = String(raw).trim();
    if (!/^[0-9]+$/.test(s)) {
      return { ok: false, error: 'Timetag: alleen hele cijfers (0-365) toegestaan.' };
    }
    const n = parseInt(s, 10);
    if (n > MAX_DAYS) {
      return { ok: true, timetag: { days: MAX_DAYS }, clamped: true, message: 'Timetag afgekapt naar maximaal 365 dagen.' };
    }
    if (n === MIN_DAYS) return { ok: true, timetag: null, message: 'Geen timetag ingesteld (0 dagen).' };
    return { ok: true, timetag: { days: n } };
  }

  function toDate(dateStr) {
    const parts = String(dateStr).split('-').map(Number);
    return new Date(Date.UTC(parts[0], (parts[1] || 1) - 1, parts[2] || 1));
  }

  function daysBetween(fromDate, toDateStr) {
    return Math.round((toDate(toDateStr) - toDate(fromDate)) / 86400000);
  }

  function addDays(dateStr, n) {
    const d = toDate(dateStr);
    d.setUTCDate(d.getUTCDate() + n);
    return d.toISOString().slice(0, 10);
  }

  function weekStartOf(dateStr) {
    const d = toDate(dateStr);
    const diff = (d.getUTCDay() + 6) % 7; // maandag = 0
    return addDays(dateStr, -diff);
  }

  // Per-huishouden opslag, zelfde mechanisme als tagRules (#37, ADR-009/010).
  function storageKeyFor(householdId) {
    return 'weekmenu.data.' + householdId;
  }

  // Alle datums waarop een product is gebruikt (history + weekplan).
  function productUsageDates(productId, ctx) {
    const history = (ctx && ctx.history) || [];
    const dishes = (ctx && ctx.dishes) || [];
    const plan = ctx && ctx.plan;
    const dates = [];
    history.forEach(function (h) {
      if (h && h.productId === productId && h.date) dates.push(h.date);
    });
    if (plan && plan.days) {
      Object.keys(plan.days).forEach(function (date) {
        const entry = plan.days[date];
        if (!entry) return;
        const dishIds = entry.dishIds || (entry.dishId ? [entry.dishId] : []);
        const hit = dishIds.some(function (dishId) {
          const dish = dishes.find(function (d) { return d.id === dishId; });
          return !!dish && (dish.productIds || []).indexOf(productId) !== -1;
        });
        if (hit) dates.push(date);
      });
    }
    return dates;
  }

  function lastUseOnOrBefore(productId, date, ctx) {
    const dates = productUsageDates(productId, ctx).filter(function (d) { return d <= date; });
    return dates.length ? dates.sort().slice(-1)[0] : null;
  }

  // Interval-check: is het product op `date` binnen zijn timetag-interval (geblokkeerd)?
  function intervalStatus(product, date, ctx) {
    const timetag = normalizeTimetag(product && product.timetag);
    if (!timetag) return { blocked: false, remainingDays: 0, timetag: null, lastUse: null };
    const lastUse = lastUseOnOrBefore(product.id, date, ctx);
    if (!lastUse) return { blocked: false, remainingDays: 0, timetag: timetag, lastUse: null };
    const elapsed = daysBetween(lastUse, date);
    const remaining = timetag.days - elapsed;
    return {
      blocked: remaining > 0,
      remainingDays: remaining > 0 ? remaining : 0,
      timetag: timetag,
      lastUse: lastUse
    };
  }

  // Resterende dagen voor de inline ⏱-markering in het weekoverzicht (versie B).
  function remainingDaysOn(product, date, ctx) {
    return intervalStatus(product, date, ctx).remainingDays;
  }

  function dishConflicts(dish, products, date, ctx) {
    return (dish.productIds || [])
      .map(function (pid) { return products.find(function (p) { return p.id === pid; }); })
      .filter(Boolean)
      .map(function (p) { return intervalStatus(p, date, ctx); })
      .filter(function (s) { return s.blocked; });
  }

  function dishesForDay(dishes, products, date, ctx) {
    const scored = dishes.map(function (dish) {
      const conflicts = dishConflicts(dish, products, date, ctx);
      return {
        dish: dish,
        conflictCount: conflicts.length,
        maxRemaining: conflicts.reduce(function (m, c) { return Math.max(m, c.remainingDays); }, 0)
      };
    });
    return {
      allowed: scored.filter(function (s) { return s.conflictCount === 0; }).map(function (s) { return s.dish; }),
      conflicts: scored.filter(function (s) { return s.conflictCount > 0; }),
      all: dishes
    };
  }

  // Zachte weekplanner: binnen het timetag-interval wordt een conflicterend product vermeden;
  // conflicteert alles, kies dan het gerecht met de minste conflicten — nooit blokkerend.
  function planWeek(opts) {
    const dishes = opts.dishes || [];
    const products = opts.products || [];
    const history = opts.history || [];
    const startDate = opts.startDate;
    const dayCount = opts.dayCount || 7;
    const days = {};
    for (let i = 0; i < dayCount; i++) {
      const date = addDays(startDate, i);
      const plannedSoFar = { weekStart: startDate, days: Object.assign({}, days) };
      const ctx = { history: history, dishes: dishes, products: products, plan: plannedSoFar };
      const res = dishesForDay(dishes, products, date, ctx);
      let chosen = null;
      let softFallback = false;
      if (res.allowed.length) {
        chosen = res.allowed[Math.floor(Math.random() * res.allowed.length)];
      } else if (dishes.length) {
        const ranked = res.conflicts.slice().sort(function (a, b) {
          return a.conflictCount - b.conflictCount || b.maxRemaining - a.maxRemaining;
        });
        chosen = ranked[0].dish;
        softFallback = true;
      }
      days[date] = { dishId: chosen ? chosen.id : null, softFallback: softFallback };
    }
    return { weekStart: startDate, days: days };
  }

  return {
    MIN_DAYS: MIN_DAYS,
    MAX_DAYS: MAX_DAYS,
    normalizeTimetag: normalizeTimetag,
    validateTimetagInput: validateTimetagInput,
    toDate: toDate,
    daysBetween: daysBetween,
    addDays: addDays,
    weekStartOf: weekStartOf,
    storageKeyFor: storageKeyFor,
    productUsageDates: productUsageDates,
    lastUseOnOrBefore: lastUseOnOrBefore,
    intervalStatus: intervalStatus,
    remainingDaysOn: remainingDaysOn,
    dishConflicts: dishConflicts,
    dishesForDay: dishesForDay,
    planWeek: planWeek
  };
});
