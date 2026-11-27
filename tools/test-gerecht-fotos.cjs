/* Tests voor issue #60 — gerecht-foto's (lokale IndexedDB image-store in src/gerechtFotos.js).
   In Node is indexedDB niet beschikbaar: hier testen we de module-exports en een
   harness-smoke test (GF = null in de vm -> app rendert zonder crash, foto-knop zichtbaar).
   Run: node tools/test-gerecht-fotos.cjs (of via tools/run-tests.cjs; app.js moet gebuild zijn) */
'use strict';
const path = require('path');
const GF = require(path.join(__dirname, '..', 'src', 'gerechtFotos.js'));

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

// --- module-exports (Node-zijde) ---
check("#60: module exporteert de API", typeof GF.saveDishImage === "function" && typeof GF.getDishImage === "function" && typeof GF.deleteDishImage === "function" && typeof GF.resizeImageBlob === "function");
check("#60: limieten: max 1024px, JPEG q0.8, max 2MB", GF.MAX_IMAGE_DIM === 1024 && GF.JPEG_QUALITY === 0.8 && GF.MAX_IMAGE_BYTES === 2 * 1024 * 1024);
check("#60: image-store keyed per gerecht (dishId)", GF.IMAGE_STORE === "dish-images");

// --- harness-smoke: app rendert met GF=null; foto-knop in readonly recept-detail ---
{
  const { loadApp } = require(path.join(__dirname, "render-harness.cjs"));
  const APP = path.join(__dirname, "..", "src", "app.js");
  const FIXED_NOW = new Date(2026, 10, 25, 12, 0, 0);
  const seed = {
    settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "AH", defaultShop: true }] },
    products: [{ id: "p1", name: "Kaas", cat: "zuivel", market: null, unit: "g", tags: [], pack: null }],
    recipes: [{ id: "rA", name: "Gerecht A", cat: "vega", ingredients: [{ pid: "p1", amount: 200, unit: "g", name: "Kaas" }], bereiding: "Bak 20 min.", timeCat: "normaal", tags: [] }],
    menuByDate: {}, stock: [], extraItems: [], checked: {},
  };
  const m = loadApp(APP, seed, FIXED_NOW);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => { if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; } if (n && n.children) n.children.forEach((x) => walk(x, f)); f(n); };
  const html = () => JSON.stringify(render());
  // tab Recepten openen
  let tabBtn = null;
  walk(render(), (n) => { if (!tabBtn && n && n.type === "button" && String(n.props && n.props.title || "").indexOf("Recepten") !== -1) tabBtn = n; });
  if (!tabBtn) walk(render(), (n) => { if (!tabBtn && n && n.type === "button" && JSON.stringify(n.children || []).indexOf("Recepten") !== -1) tabBtn = n; });
  check("#60: tab Recepten gevonden", !!tabBtn);
  if (tabBtn) tabBtn.props.onClick();
  // recept-kaart van rA openen (readonly detail)
  let cardBtn = null;
  walk(render(), (n) => { if (!cardBtn && n && n.type === "button" && JSON.stringify(n.children || []).indexOf("Gerecht A") !== -1) cardBtn = n; });
  check("#60: recept-kaart van rA gevonden", !!cardBtn);
  if (cardBtn) cardBtn.props.onClick();
  const h = html();
  check("#60: readonly detail toont '📷 Foto toevoegen' (GF=null -> geen crash)", h.indexOf("Foto toevoegen") !== -1);
  check("#60: readonly detail toont bereiding", h.indexOf("Bak 20 min.") !== -1);
}

console.log(fails === 0 ? "\nALLE GERECHTFOTOS-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
