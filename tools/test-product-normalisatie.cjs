/* Tests voor issue #59 — productnormalisatie-module (pure logica in src/productNormalisatie.js).
   De UI-wiring (merge-sheet, badges, tag-chips) zit in src/App.jsx; deze tests dekken de module.
   Run: node tools/test-product-normalisatie.cjs (of via tools/run-tests.cjs) */
'use strict';
const path = require('path');
const PN = require(path.join(__dirname, '..', 'src', 'productNormalisatie.js'));

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

const products = [
  { id: "p1", name: "Melk" },
  { id: "p2", name: "Volle melk" },
  { id: "p3", name: "Melk, 1L" },
  { id: "p4", name: "Kaas" },
];
const recipes = [
  { id: "r1", name: "Gerecht A", ingredients: [{ id: "i1", productId: "p2", amount: 1, unit: "l", tags: [] }] },
  { id: "r2", name: "Gerecht B", ingredients: [{ id: "i2", productId: "p3", amount: 200, unit: "ml", tags: [] }] },
];

// --- duplicaten groeperen ---
{
  const groups = PN.findDuplicateGroups(products);
  check("#59: duplicaatgroep gevonden voor melk-varianten (p1/p2/p3)", groups.length === 1 && groups[0].length === 3);
  check("#59: kaas (p4) is géén duplicaat", !groups.some((g) => g.some((p) => p.id === "p4")));
  const badge = PN.duplicateBadgeMap(products);
  check("#59: badgeMap telt 3 voor de melk-groep", badge.p1 === 3 && badge.p2 === 3 && badge.p3 === 3 && !badge.p4);
}

// --- kanjer-heuristiek ---
{
  const kanjer = PN.pickKanjer([{ id: "p2", name: "Volle melk" }, { id: "p1", name: "Melk" }], []);
  check("#59: kanjer = minste woorden (\"Melk\" wint van \"Volle melk\")", kanjer && kanjer.id === "p1");
  // zelfde aantal woorden én zelfde lengte -> meest gebruikt wint
  const kanjer2 = PN.pickKanjer([{ id: "a", name: "Bief" }, { id: "b", name: "Hond" }], [
    { id: "r9", ingredients: [{ productId: "b" }, { productId: "b" }] },
  ]);
  check("#59: kanjer bij gelijke woorden/lengte = meest gebruikt", kanjer2 && kanjer2.id === "b");
}

// --- deriveTags: alleen logische kwalificaties, geen willekeurige woorden ---
{
  const tags = PN.deriveTags("Melk", "Volle melk");
  check("#59: deriveTags(melk, volle melk) -> [vol]", tags.length === 1 && tags[0] === "vol");
  const wild = PN.deriveTags("Kaas", "Roomboter");
  check("#59: deriveTags zonder gemapte kwalificatie -> leeg (geen 'rood'/'zakje')", wild.length === 0);
}

// --- mergeProducts: remap + tags + verwijder duplicaat + undo ---
{
  const res = PN.mergeProducts({ products, recipes, ids: ["p1", "p2", "p3"], kanjerId: "p1" });
  check("#59: merge houdt alleen de kanjer over", res.products.length === 2 && res.products.some((p) => p.id === "p1") && !res.products.some((p) => p.id === "p2"));
  const r1 = res.recipes.find((r) => r.id === "r1");
  const r2 = res.recipes.find((r) => r.id === "r2");
  check("#59: merge remapt productId naar kanjer (p2/p3 -> p1)", r1.ingredients[0].productId === "p1" && r2.ingredients[0].productId === "p1");
  check("#59: merge voegt per-recept tag 'vol' toe op het p2-ingrediënt", r1.ingredients[0].tags.indexOf("vol") !== -1);
  check("#59: merge laat p3-ingrediënt (naamverschil '1l' niet gemapt) zonder tag", r2.ingredients[0].tags.length === 0);
  check("#59: undo-entry bevat products/recepts van vóór de merge", !!res.undo && res.undo.kanjerId === "p1" && res.undo.productsBefore.length === 4 && res.undo.recipesBefore.length === 2);
  let threw = false;
  try { PN.mergeProducts({ products, recipes, ids: ["p1"] }); } catch (e) { threw = true; }
  check("#59: merge met <2 ids gooit error", threw);
}

// --- eenheidsomrekening ---
{
  const c1 = PN.convertAmount(1, "dl", "cl");
  check("#59: 1 dl = 10 cl", c1.ok && c1.amount === 10);
  const c2 = PN.convertAmount(500, "g", "kg");
  check("#59: 500 g = 0,5 kg", c2.ok && Math.abs(c2.amount - 0.5) < 1e-9);
  const c3 = PN.convertAmount(1, "stuk", "g");
  check("#59: stuk -> g niet converteerbaar", !c3.ok);
  const v1 = PN.validateAmount("2.5");
  check("#59: validateAmount('2.5') ok=2.5", v1.ok && v1.value === 2.5);
  const v2 = PN.validateAmount("abc");
  check("#59: validateAmount('abc') niet ok", !v2.ok);
}

// --- findExistingByNormalizedName (dedup bij toevoegen) ---
{
  const hit = PN.findExistingByNormalizedName(products, "volle MELK!");
  check("#59: findExistingByNormalizedName vindt variant", !!hit && (hit.id === "p2" || hit.id === "p1" || hit.id === "p3"));
  const miss = PN.findExistingByNormalizedName(products, "Boter");
  check("#59: findExistingByNormalizedName mist bij nieuwe naam", !miss);
}

// ============================================================
// App-integratie (#59 UI-wiring in src/App.jsx): dup-box + badge in de
// catalogus (Instellingen), merge-sheet + doMerge + undoMerge (toast),
// per-recept tag-chip met × in renderIngRow (bewerkmodus).
// De harness laadt productNormalisatie.js in dezelfde vm-context (globalThis).
// ============================================================
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));
const APP = path.join(__dirname, "..", "src", "app.js");

function makeApp(seed) {
  const m = loadApp(APP, seed);
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
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && x[0].id && "ingredients" in x[0] && "cat" in x[0]);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findNode, findAll, findTab, findBtn, btnByText, btnByTitle, productsState, recipesState, html };
}

const SEED59 = {
  settings: { householdSize: 2, weekStartDay: 0, markets: [{ key: "ah", label: "Albert Heijn", defaultShop: true }] },
  products: [
    { id: "p-melk", name: "Melk", cat: "zuivel", market: null, unit: "l", tags: [], pack: null },
    { id: "p-volle", name: "Volle melk", cat: "zuivel", market: null, unit: "l", tags: [], pack: null },
    { id: "p-kaas", name: "Kaas", cat: "zuivel", market: null, unit: "g", tags: [], pack: null },
  ],
  recipes: [
    {
      id: "r-pasta", name: "Pasta bianco", cat: "vega", timeCat: "snel", tags: [], bereiding: "Kook de pasta.",
      ingredients: [{ pid: "p-volle", amount: 1, unit: "l", name: "Volle melk", tags: ["vol"] }],
    },
  ],
  stock: [],
  extraItems: [],
  menuByDate: {},
  checked: {},
};

// ---------- App-UI 1: catalogus toont dup-box + badge; merge-sheet -> doMerge -> undo ----------
{
  const t = makeApp(SEED59);
  check("#59 UI: 3 producten in state na load", t.productsState().length === 3);
  t.findTab("Instellingen").props.onClick();
  const catBtn = t.btnByTitle("Productcatalogus");
  check("#59 UI: catalogus-toggle aanwezig in Instellingen", !!catBtn);
  catBtn.props.onClick();
  let h = t.html();
  check("#59 UI: dup-box met 'duplicaatgroep(en) gevonden'", h.indexOf("duplicaatgroep(en) gevonden") !== -1);
  check("#59 UI: dup-box noemt de varianten (Melk · Volle melk)", h.indexOf("Volle melk") !== -1 && h.indexOf("Melk") !== -1);
  const badges = t.findAll((n) => n.type === "span" && String(n.props.className || "").indexOf("chip") !== -1 && String(n.props.title || "").indexOf("Aantal duplicaten") !== -1);
  check("#59 UI: badge 'x2' op beide duplicaat-producten", badges.length === 2 && badges.every((b) => JSON.stringify(b.children || []).indexOf("2") !== -1));
  const openBtn = t.findBtn((n) => String(n.props.className || "") === "chip" && JSON.stringify(n.children || []).indexOf("Samenvoegen") !== -1);
  check("#59 UI: 'Samenvoegen...'-knop in dup-box", !!openBtn);
  openBtn.props.onClick();
  h = t.html();
  check("#59 UI: merge-sheet open ('Producten samenvoegen')", h.indexOf("Producten samenvoegen") !== -1);
  const radios = t.findAll((n) => n.type === "input" && n.props.type === "radio" && n.props.name === "kanjer");
  check("#59 UI: merge-sheet heeft 2 kanjer-radio's", radios.length === 2);
  check("#59 UI: precies 1 kanjer preselectie", radios.filter((r) => r.props.checked).length === 1);
  const confirm = t.findBtn((n) => String(n.props.className || "").indexOf("btn-primary") !== -1 && JSON.stringify(n.children || []).indexOf("Samenvoegen") !== -1);
  check("#59 UI: bevestig-knop 'Samenvoegen' (btn-primary, enabled)", !!confirm && !confirm.props.disabled);
  confirm.props.onClick();
  const prods = t.productsState();
  check("#59 UI: na merge 2 producten; kanjer p-melk blijft, p-volle weg", prods.length === 2 && prods.some((p) => p.id === "p-melk") && !prods.some((p) => p.id === "p-volle"));
  const r = t.recipesState().find((x) => x.id === "r-pasta");
  check("#59 UI: ingrediënt pid geremapt p-volle -> p-melk", r.ingredients[0].pid === "p-melk");
  check("#59 UI: per-recept tag 'vol' behouden na remap", (r.ingredients[0].tags || []).indexOf("vol") !== -1);
  h = t.html();
  check("#59 UI: merge-sheet dicht + toast 'Samengevoegd naar'", h.indexOf("Producten samenvoegen") === -1 && h.indexOf("Samengevoegd naar") !== -1);
  const undoBtn = t.btnByText("Ongedaan maken");
  check("#59 UI: toast heeft 'Ongedaan maken'-knop", !!undoBtn);
  undoBtn.props.onClick();
  check("#59 UI: undo herstelt 3 producten", t.productsState().length === 3);
  const r2 = t.recipesState().find((x) => x.id === "r-pasta");
  check("#59 UI: undo herstelt pid p-volle op het ingrediënt", r2.ingredients[0].pid === "p-volle");
  check("#59 UI: toast weg na undo", t.html().indexOf("Ongedaan maken") === -1);
}

// ---------- App-UI 2: per-recept tag-chip met × in bewerkmodus (renderIngRow -> setIngTags) ----------
{
  const t = makeApp(SEED59);
  t.findTab("Recepten").props.onClick();
  const editBtn = t.btnByTitle("Recept bewerken");
  check("#59 UI: ✏️ 'Recept bewerken' aanwezig in receptenlijst", !!editBtn);
  editBtn.props.onClick();
  const chip = t.findNode((n) => n.type === "span" && String(n.props.className || "").indexOf("tag") !== -1 && String(n.props.title || "").indexOf("Per-recept tag") !== -1);
  check("#59 UI: tag-chip 'vol' op ingrediënt in bewerkmodus", !!chip && JSON.stringify(chip.children || []).indexOf("vol") !== -1);
  const tagx = t.findNode((n) => n.type === "button" && n.props.className === "tagx" && n.props.title === "Tag verwijderen");
  check("#59 UI: ×-knop (Tag verwijderen) op de ingrediënt-tag", !!tagx);
  tagx.props.onClick();
  const r = t.recipesState().find((x) => x.id === "r-pasta");
  check("#59 UI: tag 'vol' verwijderd uit ingrediënt via × (setIngTags)", (r.ingredients[0].tags || []).length === 0);
  check("#59 UI: tag-chip uit de UI verdwenen", t.html().indexOf("Per-recept tag") === -1);
}

console.log(fails === 0 ? "\nALLE PRODUCTNORMALISATIE-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
