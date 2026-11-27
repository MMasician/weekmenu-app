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



// --- validateTimetagInput foutbranches + constanten ---
{
  check("#58: validate('') niet ok (leeg)", !TT.validateTimetagInput("").ok);
  check("#58: validate(null) niet ok", !TT.validateTimetagInput(null).ok);
  check("#58: validate('3.5') niet ok (alleen hele dagen)", !TT.validateTimetagInput("3.5").ok);
  check("#58: MAX_DAYS = 365", TT.MAX_DAYS === 365);
  check("#58: toDate('2026-11-25') -> 25 nov", TT.toDate("2026-11-25").getUTCDate() === 25 && TT.toDate("2026-11-25").getUTCMonth() === 10);
}

// --- weekStartOf / storageKeyFor ---
{
  // weekStartOf gebruikt MAANDAG als weekstart (zie comment in de module: maandag = 0)
  check("#58: weekStartOf('2026-11-25') = '2026-11-23' (ma)", TT.weekStartOf("2026-11-25") === "2026-11-23");
  check("#58: weekStartOf('2026-11-23') = '2026-11-23' (ma zelf)", TT.weekStartOf("2026-11-23") === "2026-11-23");
  check("#58: weekStartOf('2026-11-27') = '2026-11-23' (vr -> ma)", TT.weekStartOf("2026-11-27") === "2026-11-23");
  check("#58: storageKeyFor('hh1') = 'weekmenu.data.hh1'", TT.storageKeyFor("hh1") === "weekmenu.data.hh1");
}

// --- productUsageDates / lastUseOnOrBefore / remainingDaysOn / dishConflicts / dishesForDay / planWeek ---
{
  const ctx = {
    history: [
      { productId: "p1", date: "2026-11-20" },
      { productId: "p2", date: "2026-11-20" },
    ],
    dishes: [
      { id: "r1", productIds: ["p1"] },
      { id: "r2", productIds: ["p2", "p3"] },
    ],
    plan: { days: { "2026-11-23": { dishIds: ["r1"] }, "2026-11-25": { dishId: "r2" }, "2026-11-26": null } },
  };
  check("#58: productUsageDates p1 = history + plan-dag (23-11)", JSON.stringify(TT.productUsageDates("p1", ctx).sort()) === JSON.stringify(["2026-11-20", "2026-11-23"]));
  check("#58: productUsageDates p2 via dishId-enkelvoud (25-11), lege dag negeert", JSON.stringify(TT.productUsageDates("p2", ctx).sort()) === JSON.stringify(["2026-11-20", "2026-11-25"]));
  check("#58: productUsageDates onbekend product -> leeg", TT.productUsageDates("pX", ctx).length === 0);
  check("#58: lastUseOnOrBefore p1 t/m 22-11 = 20-11", TT.lastUseOnOrBefore("p1", "2026-11-22", ctx) === "2026-11-20");
  check("#58: lastUseOnOrBefore p1 t/m 24-11 = 23-11", TT.lastUseOnOrBefore("p1", "2026-11-24", ctx) === "2026-11-23");
  check("#58: lastUseOnOrBefore vo\u00f3r eerste gebruik -> null", TT.lastUseOnOrBefore("p1", "2026-11-19", ctx) === null);
  const products = [
    { id: "p1", name: "Spinazie", timetag: { days: 3 } },
    { id: "p2", name: "Kaas" },
  ];
  check("#58: remainingDaysOn p1 op 25-11 = 1 (laatste gebruik 23-11, elapsed 2)", TT.remainingDaysOn(products[0], "2026-11-25", ctx) === 1);
  check("#58: remainingDaysOn p2 (geen timetag) = 0", TT.remainingDaysOn(products[1], "2026-11-25", ctx) === 0);
  const conflicts = TT.dishConflicts({ id: "r1", productIds: ["p1"] }, products, "2026-11-25", ctx);
  check("#58: dishConflicts r1 op 25-11 -> 1 geblokkeerd conflict", conflicts.length === 1 && conflicts[0].blocked === true);
  const res = TT.dishesForDay([{ id: "r1", productIds: ["p1"] }, { id: "r2", productIds: ["p2"] }], products, "2026-11-25", ctx);
  check("#58: dishesForDay 25-11: r2 allowed, r1 conflict, all=2", res.allowed.length === 1 && res.allowed[0].id === "r2" && res.conflicts.length === 1 && res.all.length === 2);
  const week = TT.planWeek({
    dishes: [{ id: "r1", productIds: ["p1"] }, { id: "r2", productIds: ["p2"] }],
    products, history: [], startDate: "2026-11-21", dayCount: 3,
  });
  const dayKeys = Object.keys(week.days);
  check("#58: planWeek plant 3 dagen, elk met een gerecht", dayKeys.length === 3 && dayKeys.every((k) => ["r1", "r2"].indexOf(week.days[k].dishId) !== -1));
  const week2 = TT.planWeek({
    dishes: [{ id: "r1", productIds: ["p1"] }], products,
    history: [{ productId: "p1", date: "2026-11-21" }], startDate: "2026-11-21", dayCount: 2,
  });
  check("#58: planWeek met conflict -> softFallback (nooit blokkerend)", week2.days["2026-11-21"].softFallback === true && week2.days["2026-11-21"].dishId === "r1");
  check("#58: planWeek zonder gerechten -> dishId null", TT.planWeek({ dishes: [], products: [], history: [], startDate: "2026-11-21", dayCount: 2 }).days["2026-11-21"].dishId === null);
}

// ============================================================
// App-integratie (#58 UI-wiring in src/App.jsx): timetag-veld in de
// productkaart (openProdCard -> saveProductEdit via TT.validateTimetagInput)
// en de \u23f1-markering in de weekmenu-dagkaart (dayTimetagMarks).
// De harness laadt timetags.js in dezelfde vm-context (globalThis.Timetags).
// ============================================================
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));
const APP = path.join(__dirname, "..", "src", "app.js");

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const jsDayOf = (w) => (w + 6) % 7;
function startOfWeek(date, w) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() - jsDayOf(w) + 7) % 7));
  return d;
}
function addDaysD(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
// vaste klok (wo 2026-11-25 12:00) -> week za 2026-11-21 t/m vr 2026-11-27
const FIXED_NOW = new Date(2026, 10, 25, 12, 0, 0);
const WEEK0 = Array.from({ length: 7 }, (_, i) => dateKey(addDaysD(startOfWeek(new Date(FIXED_NOW.getTime()), 0), i)));

function makeApp(seed) {
  const m = loadApp(APP, seed, FIXED_NOW);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findNode = (pred) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && pred(n)) found = n; });
    return found;
  };
  const findAll = (pred) => {
    const out = [];
    walk(render(), (n) => { if (n && pred(n)) out.push(n); });
    return out;
  };
  const findTab = (label) => findNode((n) => n.type === "button" && String(n.props["aria-label"] || n.props.title || "").indexOf(label) === 0);
  const findBtn = (pred) => findNode((n) => n.type === "button" && pred(n));
  const btnByText = (t) => findBtn((n) => JSON.stringify(n.children || []).indexOf(t) !== -1);
  const btnByTitle = (t) => findBtn((n) => String(n.props.title || "").indexOf(t) !== -1);
  const productsState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "unit" in x[0] && "market" in x[0] && "cat" in x[0]);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findNode, findAll, findTab, findBtn, btnByText, btnByTitle, productsState, html };
}

const SEED58 = {
  settings: { householdSize: 2, weekStartDay: 0, markets: [{ key: "ah", label: "Albert Heijn", defaultShop: true }] },
  products: [
    { id: "p-spinazie", name: "Spinazie", cat: "groente", market: null, unit: "g", tags: [], pack: null, timetag: { days: 3 } },
    { id: "p-kaas", name: "Kaas", cat: "zuivel", market: null, unit: "g", tags: [], pack: null },
  ],
  recipes: [
    { id: "r-a", name: "Spinazie A", cat: "vega", timeCat: "snel", tags: [], bereiding: "", ingredients: [{ pid: "p-spinazie", amount: 200, unit: "g", name: "Spinazie" }] },
    { id: "r-b", name: "Spinazie B", cat: "vega", timeCat: "snel", tags: [], bereiding: "", ingredients: [{ pid: "p-spinazie", amount: 300, unit: "g", name: "Spinazie" }] },
  ],
  stock: [],
  extraItems: [],
  // za 21-11: r-a; ma 23-11: r-b (beide met p-spinazie, timetag 3 dagen)
  menuByDate: { [WEEK0[0]]: { id: "r-a", locked: true }, [WEEK0[2]]: { id: "r-b", locked: true } },
  checked: {},
};

// ---------- App-UI 1: weekmenu-dagkaart toont \u23f1-markering (dayTimetagMarks) ----------
{
  const t = makeApp(SEED58);
  check("#58 UI: timetag behouden na load (normalizeProducts)", (t.productsState().find((p) => p.id === "p-spinazie") || {}).timetag && t.productsState().find((p) => p.id === "p-spinazie").timetag.days === 3);
  const marks = t.findAll((n) => n.type === "span" && String(n.props.className || "").indexOf("chip") !== -1 && String(n.props.title || "").indexOf("binnen de timetag") !== -1);
  check("#58 UI: precies 1 dagkaart met timetag-markering (za 21-11 zelf geen mark)", marks.length === 1);
  check("#58 UI: markering op ma 23-11: 'Spinazie: nog 1 dag(en) binnen de timetag'", marks.length === 1 && marks[0].props.title === "Spinazie: nog 1 dag(en) binnen de timetag");
  check("#58 UI: chip-tekst '1 d'", marks.length === 1 && JSON.stringify(marks[0].children || []).indexOf("1") !== -1);
}

// ---------- App-UI 2: productkaart timetag-veld -> saveProductEdit (validate + bewaar/oude waarde) ----------
{
  const t = makeApp(SEED58);
  t.findTab("Instellingen").props.onClick();
  t.btnByTitle("Productcatalogus").props.onClick();
  const prodlink = t.findBtn((n) => String(n.props.className || "") === "prodlink" && JSON.stringify(n.children || []).indexOf("Spinazie") !== -1);
  check("#58 UI: prodlink 'Spinazie' in catalogus", !!prodlink);
  // openProdCard is een toggle; na Opslaan is de kaart dicht maar openProd staat nog -> klik tot het veld er is
  const ttInputOf = () => t.findNode((n) => n.type === "input" && String(n.props.title || "").indexOf("Minimum aantal dagen") !== -1);
  const openCard = () => {
    for (let i = 0; i < 3 && !ttInputOf(); i++) {
      const b = t.findBtn((n) => String(n.props.className || "") === "prodlink" && JSON.stringify(n.children || []).indexOf("Spinazie") !== -1);
      if (b) b.props.onClick();
    }
    return ttInputOf();
  };
  let ttInput = openCard();
  check("#58 UI: timetag-veld in productkaart, initieel '3'", !!ttInput && ttInput.props.value === "3");
  ttInput.props.onChange({ target: { value: "5" } });
  t.btnByText("Opslaan").props.onClick(); // saveProductEdit
  let p = t.productsState().find((x) => x.id === "p-spinazie");
  check("#58 UI: na Opslaan timetag {days:5} bewaard", p.timetag && p.timetag.days === 5);
  // ongeldige invoer -> oude waarde behouden (catalogus is nog open)
  ttInput = openCard();
  check("#58 UI: heropen: timetagDraft = '5'", !!ttInput && ttInput.props.value === "5");
  ttInput.props.onChange({ target: { value: "abc" } });
  t.btnByText("Opslaan").props.onClick();
  p = t.productsState().find((x) => x.id === "p-spinazie");
  check("#58 UI: ongeldige invoer 'abc' -> oude timetag {days:5} behouden", p.timetag && p.timetag.days === 5);
  // 0 = geen timetag (catalogus nog open)
  ttInput = openCard();
  ttInput.props.onChange({ target: { value: "0" } });
  t.btnByText("Opslaan").props.onClick();
  p = t.productsState().find((x) => x.id === "p-spinazie");
  check("#58 UI: '0' -> timetag null (geen tag)", p.timetag === null || p.timetag == null);
}

console.log(fails === 0 ? "\nALLE TIMETAGS-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
