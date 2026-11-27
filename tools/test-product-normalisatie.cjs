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

console.log(fails === 0 ? "\nALLE PRODUCTNORMALISATIE-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
