/* Tests voor issue #58 — timetags-module (pure logica in src/timetags.js).
   UI-wiring (timetag-veld in productkaart, ⏱-markering in weekmenu) zit in src/App.jsx.
   Run: node tools/test-timetags.cjs (of via tools/run-tests.cjs) */
'use strict';
const path = require('path');
const TT = require(path.join(__dirname, '..', 'src', 'timetags.js'));

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

// --- normalizeTimetag: backwards compatible ---
{
  check("#58: normalizeTimetag(null/undefined) -> null", TT.normalizeTimetag(null) === null && TT.normalizeTimetag(undefined) === null);
  check("#58: normalizeTimetag({days:3}) -> {days:3}", JSON.stringify(TT.normalizeTimetag({ days: 3 })) === '{"days":3}');
  check("#58: normalizeTimetag({days:0}) -> null (0 = geen tag)", TT.normalizeTimetag({ days: 0 }) === null);
  check("#58: normalizeTimetag(corrupt 'abc') -> null", TT.normalizeTimetag("abc") === null);
  check("#58: normalizeTimetag({days:999}) clamped naar 365", TT.normalizeTimetag({ days: 999 }).days === 365);
}

// --- validateTimetagInput ---
{
  check("#58: validate('5') ok, timetag {days:5}", TT.validateTimetagInput("5").ok && TT.validateTimetagInput("5").timetag.days === 5);
  check("#58: validate('0') ok, timetag null (geen tag)", TT.validateTimetagInput("0").ok && TT.validateTimetagInput("0").timetag === null);
  check("#58: validate('abc') niet ok", !TT.validateTimetagInput("abc").ok);
  check("#58: validate('-3') niet ok", !TT.validateTimetagInput("-3").ok);
  check("#58: validate('400') ok maar clamped naar 365", TT.validateTimetagInput("400").ok && TT.validateTimetagInput("400").timetag.days === 365);
}

// --- intervalStatus met plan-ctx ---
{
  const products = [{ id: "p1", name: "Spinazie", timetag: { days: 3 } }, { id: "p2", name: "Kaas" }];
  const ctx = {
    history: [],
    dishes: [{ id: "r1", productIds: ["p1"] }],
    plan: { days: { "2026-11-23": { dishIds: ["r1"] }, "2026-11-25": { dishIds: ["r1"] } } }, // p1 gebruikt op 23 en 25
  };
  // NB: lastUseOnOrBefore telt de dag zélf mee (d <= date) — op 25-11 is lastUse = 25-11
  const s1 = TT.intervalStatus(products[0], "2026-11-25", ctx);
  check("#58: intervalStatus op 25-11 (gebruik op die dag zelf) -> blocked, remaining 3", s1.blocked && s1.remainingDays === 3 && s1.lastUse === "2026-11-25");
  const s2 = TT.intervalStatus(products[0], "2026-11-27", ctx);
  check("#58: intervalStatus op 27-11 (laatste gebruik 25-11, elapsed 2) -> blocked, remaining 1", s2.blocked && s2.remainingDays === 1);
  const s3 = TT.intervalStatus(products[0], "2026-11-29", ctx);
  check("#58: intervalStatus op 29-11 (4 dagen na laatste gebruik) -> niet blocked", !s3.blocked && s3.remainingDays === 0);
  const s4 = TT.intervalStatus(products[1], "2026-11-25", ctx);
  check("#58: product zonder timetag nooit blocked", !s4.blocked);
  const s5 = TT.intervalStatus(products[0], "2026-11-22", ctx);
  check("#58: vóór eerste gebruik -> niet blocked", !s5.blocked && s5.lastUse === null);
}

// --- date helpers ---
{
  check("#58: daysBetween('2026-11-23','2026-11-25') = 2", TT.daysBetween("2026-11-23", "2026-11-25") === 2);
  check("#58: addDays('2026-11-30', 1) = '2026-12-01' (maandgrens)", TT.addDays("2026-11-30", 1) === "2026-12-01");
}

console.log(fails === 0 ? "\nALLE TIMETAGS-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
