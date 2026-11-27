/* Tests voor issue #60 — gerecht-foto's (lokale IndexedDB image-store in src/gerechtFotos.js)
   + de UI-wiring in src/App.jsx (foto-blok in readonly recept-detail, thumbnail in gelockte
   weekmenu-dag, verborgen file-input).
   Node heeft geen indexedDB/canvas: met een fake in-memory IndexedDB + fake canvas testen we
   de module roundtrip (save/get/delete), resizeImageBlob (schaling + quality-lus + guards)
   én de volledige app-flow via loadApp(..., extraGlobals).
   Run: node tools/test-gerecht-fotos.cjs (of via tools/run-tests.cjs; app.js moet gebuild zijn) */
'use strict';
const path = require('path');
const GF = require(path.join(__dirname, '..', 'src', 'gerechtFotos.js'));
const { loadApp, serialize } = require(path.join(__dirname, 'render-harness.cjs'));

const APP = path.join(__dirname, '..', 'src', 'app.js');

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };
const tick = () => new Promise((r) => setTimeout(r, 0));

// ---------- fake in-memory IndexedDB ----------
function makeFakeIDB() {
  const stores = {};
  function req(result) {
    const r = { result, error: null, onsuccess: null, onerror: null };
    queueMicrotask(() => { if (r.onsuccess) r.onsuccess(); });
    return r;
  }
  function storeApi(name) {
    if (!stores[name]) stores[name] = new Map();
    const m = stores[name];
    return {
      put(rec) { m.set(rec.dishId, rec); return req(rec); },
      get(key) { return req(m.has(key) ? m.get(key) : undefined); },
      delete(key) { m.delete(key); return req(undefined); },
    };
  }
  const db = {
    objectStoreNames: { contains: (n) => Object.prototype.hasOwnProperty.call(stores, n) },
    createObjectStore(n) { stores[n] = new Map(); return storeApi(n); },
    transaction() {
      const tx = { oncomplete: null, onerror: null, onabort: null, error: null, objectStore: storeApi };
      queueMicrotask(() => queueMicrotask(() => { if (tx.oncomplete) tx.oncomplete(); }));
      return tx;
    },
    close() {},
  };
  return {
    _stores: stores,
    open() {
      const r = { result: db, error: null, onupgradeneeded: null, onsuccess: null, onerror: null };
      queueMicrotask(() => {
        if (r.onupgradeneeded) r.onupgradeneeded();
        if (r.onsuccess) r.onsuccess();
      });
      return r;
    },
  };
}

// ---------- fake canvas / document / createImageBitmap ----------
// toBlob geeft een blob waarvan de size schaalt met quality (bij q=0.8 -> 3MB, dus > 2MB -> quality-lus loopt)
function makeFakeDoc(opts) {
  opts = opts || {};
  const calls = { toBlob: 0, click: 0 };
  const doc = {
    calls,
    getElementById(id) { return id === "dish-foto-input" ? { click() { calls.click++; } } : null; },
    createElement(tag) {
      if (tag !== "canvas") return { click() {}, style: {} };
      return {
        width: 0, height: 0,
        getContext() { return opts.nullCtx ? null : { drawImage() {} }; },
        toBlob(cb, type, q) {
          calls.toBlob++;
          if (opts.nullBlob) { cb(null); return; }
          cb({ size: Math.round(3 * 1024 * 1024 * (q / 0.8)), type: type || "image/jpeg" });
        },
      };
    },
  };
  return doc;
}
const fakeBitmap = async (file) => ({ width: file.width, height: file.height, close() { this.closed = true; } });

// ---------- datumhelpers (weekstart za, FIXED_NOW = wo 2026-11-25) ----------
const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function startOfWeek(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() + 1) % 7)); // za = 0
  return d;
}
function addDaysD(d, n) { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; }
const FIXED_NOW = new Date(2026, 10, 25, 12, 0, 0);
const WEEK0 = Array.from({ length: 7 }, (_, i) => dateKey(addDaysD(startOfWeek(new Date(FIXED_NOW.getTime())), i)));

function makeApp(seed, extra) {
  const m = loadApp(APP, seed, FIXED_NOW, extra);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findNode = (pred) => { let f = null; walk(render(), (n) => { if (!f && n && pred(n)) f = n; }); return f; };
  const findAll = (pred) => { const out = []; walk(render(), (n) => { if (n && pred(n)) out.push(n); }); return out; };
  const findTab = (label) => findNode((n) => n.type === "button" && String(n.props["aria-label"] || n.props.title || "").indexOf(label) === 0);
  const btnByText = (t) => findNode((n) => n.type === "button" && JSON.stringify(n.children || []).indexOf(t) !== -1);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findNode, findAll, findTab, btnByText, html };
}

async function main() {
  // --- module-exports & limieten ---
  check("#60: module exporteert de API", typeof GF.saveDishImage === "function" && typeof GF.getDishImage === "function" && typeof GF.deleteDishImage === "function" && typeof GF.resizeImageBlob === "function");
  check("#60: limieten: max 1024px, JPEG q0.8, max 2MB", GF.MAX_IMAGE_DIM === 1024 && GF.JPEG_QUALITY === 0.8 && GF.MAX_IMAGE_BYTES === 2 * 1024 * 1024);
  check("#60: image-store keyed per gerecht (dishId)", GF.IMAGE_STORE === "dish-images");

  // --- module roundtrip via fake IndexedDB (Node-zijde: global.indexedDB) ---
  const idb = makeFakeIDB();
  global.indexedDB = idb;
  global.document = makeFakeDoc();
  global.createImageBitmap = fakeBitmap;
  await GF.saveDishImage("r1", { size: 123, type: "image/jpeg" }, 1024, 768);
  const rec = await GF.getDishImage("r1");
  check("#60: saveDishImage -> getDishImage roundtrip (dishId/width/height)", !!rec && rec.dishId === "r1" && rec.width === 1024 && rec.height === 768 && rec.mime === "image/jpeg");
  check("#60: getDishImage onbekend id -> null", (await GF.getDishImage("rX")) === null);
  await GF.deleteDishImage("r1");
  check("#60: deleteDishImage -> weg", (await GF.getDishImage("r1")) === null);

  // --- resizeImageBlob: schaling naar max 1024px + quality-lus tot <= 2MB ---
  {
    const doc = makeFakeDoc();
    global.document = doc;
    const out = await GF.resizeImageBlob({ width: 4000, height: 3000 });
    check("#60: resize 4000x3000 -> 1024x768 (max dim 1024)", out.width === 1024 && out.height === 768);
    check("#60: quality-lus: blob <= 2MB (toBlob vaker aangeroepen)", out.blob && out.blob.size <= GF.MAX_IMAGE_BYTES && doc.calls.toBlob >= 2);
    const small = await GF.resizeImageBlob({ width: 800, height: 600 });
    check("#60: kleine foto (800x600) -> niet opgeschaald (scale=1)", small.width === 800 && small.height === 600);
  }

  // --- resizeImageBlob guards (reliability): null 2d-context / null toBlob ---
  {
    global.document = makeFakeDoc({ nullCtx: true });
    let threw = null;
    try { await GF.resizeImageBlob({ width: 100, height: 100 }); } catch (e) { threw = e; }
    check("#60: getContext('2d') null -> gooit (geen null-deref crash)", !!threw && /2d-canvascontext/.test(threw.message));
    global.document = makeFakeDoc({ nullBlob: true });
    threw = null;
    try { await GF.resizeImageBlob({ width: 100, height: 100 }); } catch (e) { threw = e; }
    check("#60: toBlob null -> gooit (geen null-blob opgeslagen)", !!threw && /toBlob/.test(threw.message));
    global.document = makeFakeDoc();
  }

  // --- App-flow met GF in de sandbox (fake IDB + fake canvas + fake URL) ---
  {
    const seed = {
      settings: { householdSize: 2, weekStartDay: 0, markets: [{ key: "ah", label: "AH", defaultShop: true }] },
      products: [{ id: "p1", name: "Kaas", cat: "zuivel", market: null, unit: "g", tags: [], pack: null }],
      recipes: [
        { id: "rA", name: "Gerecht A", cat: "vega", timeCat: "normaal", tags: [], bereiding: "Bak 20 min.", ingredients: [{ pid: "p1", amount: 200, unit: "g", name: "Kaas" }] },
        { id: "rB", name: "Gerecht B", cat: "vega", timeCat: "snel", tags: [], bereiding: "Roer.", ingredients: [{ pid: "p1", amount: 50, unit: "g", name: "Kaas" }] },
      ],
      menuByDate: { [WEEK0[0]]: { id: "rA", locked: true } },
      stock: [], extraItems: [], checked: {},
    };
    let urlN = 0;
    const fakeURL = { createObjectURL: () => "blob:fake-" + (++urlN), revokeObjectURL() {} };
    const doc = makeFakeDoc();
    const t = makeApp(seed, { indexedDB: idb, document: doc, createImageBitmap: fakeBitmap, URL: fakeURL });

    // pre-seed: rB heeft al een foto in de IDB
    await GF.saveDishImage("rB", { size: 10, type: "image/jpeg" }, 800, 600);

    t.findTab("Recepten").props.onClick();
    // rB-kaart openen -> ensureDishFoto(rB) laadt uit IDB -> img + Vervangen/Verwijderen
    const cardB = t.findNode((n) => n.type === "button" && JSON.stringify(n.children || []).indexOf("Gerecht B") !== -1);
    check("#60 UI: recept-kaart 'Gerecht B' gevonden", !!cardB);
    cardB.props.onClick();
    await tick(); await tick();
    let h = t.html();
    check("#60 UI: foto uit IndexedDB geladen bij openen detail (img + 'Vervangen')", h.indexOf("blob:fake-") !== -1 && h.indexOf("Vervangen") !== -1 && h.indexOf("Foto verwijderen") !== -1);

    // rA-kaart openen -> geen foto -> 'Foto toevoegen'
    const rowA = t.findAll((n) => n.type === "button" && JSON.stringify(n.children || []).indexOf("Gerecht A") !== -1)[0];
    rowA.props.onClick();
    await tick(); await tick();
    h = t.html();
    check("#60 UI: rA zonder foto toont 'Foto toevoegen'", h.indexOf("Foto toevoegen") !== -1);

    // foto kiezen: klik 'Foto toevoegen' -> verborgen input -> onChange met fake file
    const addBtn = t.btnByText("Foto toevoegen");
    check("#60 UI: 'Foto toevoegen'-knop aanwezig", !!addBtn);
    addBtn.props.onClick(); // pickDishFoto(rA) -> setFotoFor + input.click()
    check("#60 UI: verborgen file-input ge-'click't", doc.calls.click >= 1);
    const fileInput = t.findNode((n) => n.type === "input" && n.props.id === "dish-foto-input");
    check("#60 UI: verborgen #dish-foto-input aanwezig in de boom", !!fileInput && fileInput.props.accept === "image/*");
    await fileInput.props.onChange({ target: { files: [{ width: 4000, height: 3000 }], value: "C:\\fake\\foto.jpg" } });
    await tick(); await tick();
    h = t.html();
    check("#60 UI: na onDishFotoFile: img in detail + 'Vervangen' (foto opgeslagen)", h.indexOf("blob:fake-") !== -1 && h.indexOf("Vervangen") !== -1);
    const savedA = await GF.getDishImage("rA");
    check("#60 UI: foto van rA staat in IndexedDB (resize 1024x768, <=2MB)", !!savedA && savedA.width === 1024 && savedA.height === 768 && savedA.blob.size <= GF.MAX_IMAGE_BYTES);

    // verwijderen
    const delBtn = t.btnByText("Foto verwijderen");
    await delBtn.props.onClick();
    await tick(); await tick();
    h = t.html();
    check("#60 UI: 'Foto verwijderen' -> img weg, 'Foto toevoegen' terug", h.indexOf("Foto toevoegen") !== -1 && (await GF.getDishImage("rA")) === null);

    // weekmenu: gelockte dag met rA + foto in IDB -> thumbnail in dag-detail
    await GF.saveDishImage("rA", { size: 10, type: "image/jpeg" }, 800, 600);
    t.findTab("Weekmenu").props.onClick();
    const dishInput = t.findNode((n) => n.type === "input" && String(n.props.className || "").indexOf("dish-input") !== -1);
    dishInput.props.onClick(); // openDay + ensureDishFoto(entry.id)
    await tick(); await tick();
    const imgs = t.findAll((n) => n.type === "img" && String(n.props.src || "").indexOf("blob:fake-") !== -1);
    check("#60 UI: thumbnail van gelockte dag in weekmenu (ensureDishFoto via day-open)", imgs.length >= 1);
  }

  // --- zonder indexedDB: app rendert, foto-knop zichtbaar, geen crash ---
  {
    const seed = {
      settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "AH", defaultShop: true }] },
      products: [{ id: "p1", name: "Kaas", cat: "zuivel", market: null, unit: "g", tags: [], pack: null }],
      recipes: [{ id: "rA", name: "Gerecht A", cat: "vega", ingredients: [{ pid: "p1", amount: 200, unit: "g", name: "Kaas" }], bereiding: "Bak 20 min.", timeCat: "normaal", tags: [] }],
      menuByDate: {}, stock: [], extraItems: [], checked: {},
    };
    const t = makeApp(seed); // GF-module is geladen in de sandbox, maar indexedDB niet
    delete t.m.sandbox.indexedDB; // simuleer: geen IDB beschikbaar
    t.findTab("Recepten").props.onClick();
    const row = t.findAll((n) => n.type === "button" && JSON.stringify(n.children || []).indexOf("Gerecht A") !== -1)[0];
    row.props.onClick();
    await tick(); await tick();
    const h = t.html();
    check("#60 UI: zonder indexedDB: geen crash, 'Foto toevoegen' zichtbaar", h.indexOf("Foto toevoegen") !== -1 && h.indexOf("Bak 20 min.") !== -1);
  }

  console.log(fails === 0 ? "\nALLE GERECHTFOTOS-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error("FATALE TESTFOUT:", e); process.exit(1); });
