// Test: delen via bestand (ADR-019) — iconen in Instellingen, export-sheet met chips,
// info-sheet, en de pure samenvoegregels (mergeShareBundle) vanuit src/app.js.
const path = require("path");
const ROOT = process.env.WEEKMENU_APP_ROOT || path.join(__dirname, "..");
const { loadApp, serialize } = require("./render-harness.cjs");

let failed = 0;
function check(label, ok) {
  console.log((ok ? "PASS" : "FAIL") + " - " + label);
  if (!ok) failed++;
}

// ---------- 1. Instellingen: drie iconen (export, import, info) ----------
{
  const m = loadApp(path.join(ROOT, "src", "app.js"));
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  let tab = null;
  walk(render(), (n) => { if (n && n.type === "button" && String(n.props["aria-label"] || n.props.title || "") === "Instellingen") tab = n; });
  tab.props.onClick();
  const html = JSON.stringify(serialize(render()));
  check("instellingen: export-icoon (📤, title)", html.indexOf("Deelbestand maken (exporteren)") !== -1 && html.indexOf("📤") !== -1);
  check("instellingen: import-icoon (📥, title + file input)", html.indexOf("Bestand overnemen (importeren)") !== -1 && html.indexOf("📥") !== -1);
  check("instellingen: info-icoon (ℹ️, title)", html.indexOf("Uitleg over delen via bestand") !== -1 && html.indexOf("ℹ️") !== -1);
}

// ---------- 2. Export-sheet: chips + toggle + info-sheet ----------
{
  const m = loadApp(path.join(ROOT, "src", "app.js"));
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findBtnByTitle = (tree, title) => {
    let found = null;
    walk(tree, (n) => { if (n && n.type === "button" && n.props && n.props.title === title) found = n; });
    return found;
  };
  let tab = null;
  walk(render(), (n) => { if (n && n.type === "button" && String(n.props["aria-label"] || n.props.title || "") === "Instellingen") tab = n; });
  tab.props.onClick();
  findBtnByTitle(render(), "Deelbestand maken (exporteren)").props.onClick();
  let html = JSON.stringify(serialize(render()));
  check("export-sheet opent met titel 'Delen via bestand'", html.indexOf("Delen via bestand") !== -1);
  check("chip 'Instellingen · vinkjes · verwijderingen' aanwezig", html.indexOf("Instellingen · vinkjes · verwijderingen") !== -1);
  check("chips tellen mee: 'Recepten (' en 'Voorraad ('", html.indexOf("Recepten (") !== -1 && html.indexOf("Voorraad (") !== -1);
  check("Maak deelbestand-knop aanwezig", html.indexOf("Maak deelbestand") !== -1);
  // chip Producten uitzetten: alleen die chip verliest 'on'
  const chipBtn = (needle) => {
    let found = null;
    walk(render(), (n) => {
      if (found || n && n.type !== "button") return;
      const kids = JSON.stringify(n && n.children || []);
      if (n && n.props && typeof n.props.className === "string" && n.props.className.indexOf("chip") === 0 && kids.indexOf(needle) !== -1) found = n;
    });
    return found;
  };
  const prod = chipBtn("Producten");
  check(" producten-chip is aan", !!prod && prod.props.className.indexOf("on") !== -1);
  if (prod) {
    prod.props.onClick();
    check("chip-toggle zet producten uit", chipBtn("Producten").props.className.indexOf("on") === -1);
  }
  // info-sheet via ℹ️
  findBtnByTitle(render(), "Uitleg over delen via bestand").props.onClick();
  html = JSON.stringify(serialize(render()));
  check("info-sheet opent ('Delen: hoe werkt het?')", html.indexOf("Delen: hoe werkt het?") !== -1);
  check("info-sheet legt nieuwste-wint uit", html.indexOf("nieuwste wint") !== -1);
}

// ---------- 3. Pure samenvoegregels vanuit app.js ----------
{
  // Sinds de modulaire split (src/domain/*) zitten de pure functies in aparte modules;
  // de gebundelde app.js exposeert de module-registry als globalThis.__weekmenuModules.
  const m0 = loadApp(path.join(ROOT, "src", "app.js"));
  const loadMod = m0.sandbox.__weekmenuModules;
  const { mergeShareBundle } = loadMod("src/domain/share.js");

  const rec = (id, name, ts, extra) => Object.assign({ id, name, cat: "vega", ingredients: [], bereiding: "", tags: [], timeCat: "normaal", updatedAt: ts }, extra || {});
  const local = () => ({
    recipes: [rec("r1", "Pasta", 100), rec("r2", "Soep", 100)],
    products: [{ id: "p1", name: "Melk", cat: "zuivel", market: null, unit: null, updatedAt: 100 }],
    stock: [{ name: "Melk", loc: "loc-koel", cat: "zuivel", market: null, want: 2, have: 1, pid: "p1", updatedAt: 100 }],
    stockLocations: [{ id: "loc-koel", name: "Koelkast", updatedAt: 100 }],
    extraItems: [{ name: "Chips", cat: "", amount: 1, unit: null, pid: "px", updatedAt: 100 }],
    menuByDate: { "2026-11-24": { id: "r1", locked: true, updatedAt: 100 } },
    checked: { "2026-11-24-p1": true },
    checkedAt: 100,
    settings: { householdSize: 5, updatedAt: 100 },
    deleted: {},
  });

  // nieuwste wint: bron nieuwer => overnemen + conflict met oude waarde
  {
    const bundle = { chips: { recipes: true }, data: { recipes: [rec("r1", "Pasta pesto", 200), rec("r2", "Soep", 100)] } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: nieuwer recept uit bestand wint", r.next.recipes.find((x) => x.id === "r1").name === "Pasta pesto");
    check("merge: gelijke ts = geen wijziging (kept 1)", r.rapport.counts.recipes.kept === 1 && r.rapport.counts.recipes.updated === 1);
    check("merge: conflict zichtbaar (hier vs daar)", r.rapport.conflicts.length === 1 && r.rapport.conflicts[0].hier.indexOf("Pasta") === 0 && r.rapport.conflicts[0].daar.indexOf("Pasta pesto") === 0);
  }
  // lokaal nieuwer => houden
  {
    const bundle = { chips: { recipes: true }, data: { recipes: [rec("r1", "Oude naam", 50)] } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: lokaal nieuwer blijft staan", r.next.recipes.find((x) => x.id === "r1").name === "Pasta" && r.rapport.counts.recipes.updated === 0);
  }
  // nieuw in bestand => toegevoegd
  {
    const bundle = { chips: { recipes: true }, data: { recipes: [rec("r9", "Nieuw gerecht", 300)] } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: nieuw recept wordt toegevoegd (added 1, kept 2)", r.next.recipes.some((x) => x.id === "r9") && r.rapport.counts.recipes.added === 1);
  }
  // verwijderd in bron (tombstone) => weg + markering bewaard voor volgende export
  {
    const bundle = { chips: { recipes: true }, data: { recipes: [rec("r2", "Soep", 100)], deleted: { "recipe:r1": 150 } } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: bron-verwijdering verwijdert lokaal (removed 1)", !r.next.recipes.some((x) => x.id === "r1") && r.rapport.counts.recipes.removed === 1);
    check("merge: verwijderingsmarkering blijft voor eigen export", r.next.deleted["recipe:r1"] === 150);
  }
  // lokaal verwijderd => bron-record niet teruggezet tenzij nieuwer
  {
    const l = local();
    l.deleted["recipe:r1"] = 500;
    const bundle = { chips: { recipes: true }, data: { recipes: [rec("r1", "Pasta", 100)] } };
    const r = mergeShareBundle(l, bundle);
    check("merge: lokaal bewust verwijderd blijft weg", !r.next.recipes.some((x) => x.id === "r1"));
    const bundle2 = { chips: { recipes: true }, data: { recipes: [rec("r1", "Pasta hersteld", 600)] } };
    const r2 = mergeShareBundle(l, bundle2);
    check("merge: nieuwer uit bron haalt verwijdering terug", r2.next.recipes.some((x) => x.id === "r1") && r2.next.deleted["recipe:r1"] === undefined);
  }
  // chips-gates: chip uit = soort ongemoeid laten
  {
    const bundle = { chips: { recipes: false, stock: true }, data: { recipes: [rec("r1", "Pasta pesto", 900)], stock: [{ name: "Melk", loc: "loc-koel", cat: "zuivel", market: null, want: 2, have: 5, pid: "p1", updatedAt: 300 }] } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: chip recepten uit => recepten blijven lokaal", r.next.recipes.find((x) => x.id === "r1").name === "Pasta");
    check("merge: voorraad uit bestand wint (have 5, conflictzichtbaar)", r.next.stock[0].have === 5 && r.rapport.conflicts.some((c) => c.naam.indexOf("Melk") === 0));
  }
  // weekmenu per dag + instellingen/vinkjes als geheel
  {
    const bundle = { chips: { menu: true, settings: true }, data: {
      menuByDate: { "2026-11-24": { id: "r1", locked: true, updatedAt: 200 }, "2026-11-26": { id: "r2", updatedAt: 120 } },
      settings: { householdSize: 4, updatedAt: 250 },
      checked: { "2026-11-24-p1": false, "2026-11-26-p1": true },
      checkedAt: 250,
    } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: nieuwere daginhoud wint, nieuwe dag toegevoegd", r.next.menuByDate["2026-11-26"].id === "r2" && r.rapport.counts.menuByDate.added === 1);
    check("merge: instellingen als geheel (nieuwste wint)", r.next.settings.householdSize === 4 && r.rapport.counts.settings.updated === 1);
    check("merge: vinkjes-set als geheel overgenomen", r.next.checked["2026-11-24-p1"] === false && r.next.checkedAt === 250);
  }
  // settings-chip uit: instellingen en vinkjes blijven lokaal
  {
    const bundle = { chips: { settings: false }, data: { settings: { householdSize: 2, updatedAt: 900 }, checked: {}, checkedAt: 900 } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: chip instellingen uit => alles blijft lokaal", r.next.settings.householdSize === 5 && r.next.checkedAt === 100);
  }
  // deterministisch: zelfde input => zelfde output (geen Date.now in merge)
  {
    const bundle = { chips: {}, data: { recipes: [rec("r1", "Pasta pesto", 200)] } };
    const a = JSON.stringify(mergeShareBundle(local(), bundle));
    const b = JSON.stringify(mergeShareBundle(local(), bundle));
    check("merge: puur/deterministisch", a === b);
  }
  // vinkjes niet meegestuurd => lokaal behouden
  {
    const bundle = { chips: { settings: true }, data: { settings: { householdSize: 5, updatedAt: 100 } } };
    const r = mergeShareBundle(local(), bundle);
    check("merge: zonder vinkjes in bundel blijft lokaal", r.next.checked["2026-11-24-p1"] === true && r.next.checkedAt === 100);
  }
}

console.log(failed === 0 ? "ALLE DELEN-BESTAND-TESTS GESLAAGD" : `${failed} DELEN-BESTAND-TEST(S) GEFAALD`);
process.exit(failed === 0 ? 0 : 1);
