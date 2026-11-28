/* Tests voor issue #48 — Open Food Facts-koppeling per product:
   - src/openFoodFacts.js (UMD-module): URL-allowlist, img-allowlist, numerieke validatie,
     JSON.parse-only, User-Agent, EAN/restricted-EAN-8, lookup/search/download met geinjecteerde fetch
   - src/gerechtFotos.js: product-images store (v2, keyed per EAN) — gedeelde image-store met #60
   - src/domain/catalog.js: normalizeProducts bewaart/valideert ean, fullName, nutrition, offImageUrl
   - UI-flow via render-harness: product-kaart -> koppelen/zoeken-sheet -> Kies -> product aktualisiert
     + lokale cache (localStorage product + IndexedDB foto, geen nieuwe API-call), detail-sheet,
     restricted EAN-8 multi-match, foutmeldingen, refresh, ontkoppelen, offline zonder fetch.
   Run: node tools/test-open-food-facts.cjs (of via tools/run-tests.cjs; app.js moet gebuild zijn) */
'use strict';
const path = require('path');
const fs = require('fs');
const OFF = require(path.join(__dirname, '..', 'src', 'openFoodFacts.js'));
const GF = require(path.join(__dirname, '..', 'src', 'gerechtFotos.js'));
const { loadApp, serialize } = require(path.join(__dirname, 'render-harness.cjs'));

const APP = path.join(__dirname, '..', 'src', 'app.js');
const IMG = 'https://images.openfoodfacts.org/images/products/871/845/230/4653/front_nl.22.full.jpg';

let fails = 0;
const check = (name, ok) => { console.log((ok ? 'PASS' : 'FAIL') + ' - ' + name); if (!ok) fails++; };
const tick = () => new Promise((r) => setTimeout(r, 0));

// ---------- fake in-memory IndexedDB (zelfde vorm als test-gerecht-fotos.cjs) ----------
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
      put(rec) { m.set(rec.dishId !== undefined ? rec.dishId : rec.ean, rec); return req(rec); },
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

// ---------- fake fetch voor de OFF-API ----------
const PRODUCT_JSON = {
  status: 1,
  product: {
    code: '8718452304653',
    product_name: 'Jumbo Appelstroop 450 g',
    brands: 'Jumbo, BV',
    image_front_url: IMG,
    serving_size: '20 g',
    nutriments: {
      'energy-kcal_100g': 295, fat_100g: 0, carbohydrates_100g: 72, proteins_100g: 0.3, salt_100g: 0.01,
      'energy-kcal_serving': 59, carbohydrates_serving: 14.4, proteins_serving: 0.1,
    },
  },
};
function makeFakeFetch(overrides) {
  overrides = overrides || {};
  const calls = [];
  const f = async (url, opts) => {
    const u = String(url);
    calls.push({ url: u, ua: opts && opts.headers && opts.headers['User-Agent'] });
    if (overrides.throw) throw new Error(overrides.throw);
    if (u.indexOf('/api/v2/product/8718452304653.json') !== -1) {
      return { ok: true, status: 200, text: async () => JSON.stringify(PRODUCT_JSON), blob: async () => ({ size: 1000, type: 'image/jpeg' }) };
    }
    if (u.indexOf('/api/v2/product/') !== -1) {
      return { ok: true, status: 200, text: async () => JSON.stringify({ status: 0 }), blob: async () => null };
    }
    if (u.indexOf('/api/v2/search') !== -1) {
      if (u.indexOf('20662929') !== -1) {
        return { ok: true, status: 200, text: async () => JSON.stringify({ products: [
          PRODUCT_JSON.product,
          { code: '20662929', product_name: 'Duetti hazelnootpasta (Lidl)', brands: 'Lidl', image_front_url: IMG, nutriments: { fat_100g: 55 } },
        ] }), blob: async () => null };
      }
      if (u.indexOf('xyzzyplugh') !== -1) return { ok: true, status: 200, text: async () => JSON.stringify({ products: [] }), blob: async () => null };
      return { ok: true, status: 200, text: async () => JSON.stringify({ products: [PRODUCT_JSON.product, { code: '8710400012345', product_name: 'Appelstroop (huismerk)', brands: 'Huismerk', nutriments: {} }] }), blob: async () => null };
    }
    if (u.indexOf('images.openfoodfacts.org') !== -1) {
      return { ok: true, status: 200, text: async () => '', blob: async () => ({ size: 4321, type: 'image/jpeg' }) };
    }
    return { ok: false, status: 404, text: async () => 'not found', blob: async () => null };
  };
  return { f, calls };
}

// ---------- app-harness ----------
function makeApp(seed, extra) {
  const m = loadApp(APP, seed, null, extra);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findNode = (pred) => { let f = null; walk(render(), (n) => { if (!f && n && pred(n)) f = n; }); return f; };
  const findAll = (pred) => { const out = []; walk(render(), (n) => { if (n && pred(n)) out.push(n); }); return out; };
  const findTab = (label) => findNode((n) => n.type === 'button' && String(n.props['aria-label'] || n.props.title || '').indexOf(label) === 0);
  const findBtn = (pred) => findNode((n) => n.type === 'button' && pred(n));
  const btnByText = (t) => findBtn((n) => JSON.stringify(n.children || []).indexOf(t) !== -1);
  const btnsByText = (t) => findAll((n) => n.type === 'button' && JSON.stringify(n.children || []).indexOf(t) !== -1);
  const btnByTitle = (t) => findBtn((n) => String(n.props.title || '').indexOf(t) !== -1);
  const inputByPlaceholder = (t) => findNode((n) => n.type === 'input' && String(n.props.placeholder || '').indexOf(t) !== -1);
  const productsState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && 'unit' in x[0] && 'market' in x[0] && 'cat' in x[0]);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findNode, findAll, findTab, findBtn, btnByText, btnsByText, btnByTitle, inputByPlaceholder, productsState, html };
}

const SEED = {
  settings: { householdSize: 2, weekStartDay: 0, markets: [{ key: 'jumbo', label: 'Jumbo', defaultShop: true }] },
  products: [
    { id: 'p1', name: 'appelstroop', cat: 'broodbeleg', market: 'jumbo', unit: 'g', tags: [], pack: null },
    { id: 'p2', name: 'bloemkool', cat: 'groente', market: null, unit: null, tags: [], pack: null },
  ],
  recipes: [], menuByDate: {}, stock: [], extraItems: [], checked: {},
};

function openProductCard(t, name) {
  t.findTab('Instellingen').props.onClick();
  if (!t.findBtn((n) => n.props.className === 'prodlink')) t.btnByTitle('Productcatalogus in-/uitklappen').props.onClick(); // al open? niet opnieuw togglen
  const link = t.findBtn((n) => n.props.className === 'prodlink' && JSON.stringify(n.children || []).indexOf(name) !== -1);
  if (!link) return false;
  link.props.onClick();
  return true;
}

async function main() {
  // ================= 1. module: exports & constanten =================
  check('#48: module exporteert de API', ['cleanEan', 'isEan', 'isRestrictedEan8', 'productUrl', 'searchUrl', 'assertApiUrl', 'imgUrlAllowed', 'toSizedImageUrl', 'num', 'parseNutriments', 'parseProduct', 'parseProductResponse', 'parseSearchResponse', 'fetchJson', 'lookupEan', 'searchProducts', 'downloadImage'].every((k) => typeof OFF[k] === 'function'));
  check('#48: API host-allowlist constanten', OFF.API_HOST === 'https://world.openfoodfacts.org' && OFF.IMG_PREFIX === 'https://images.openfoodfacts.org/images/products/');
  check('#48: beschrijvende User-Agent', typeof OFF.USER_AGENT === 'string' && OFF.USER_AGENT.indexOf('WeekmenuApp') !== -1 && OFF.USER_AGENT.length > 20);

  // ================= 2. EAN-validatie =================
  check('#48: cleanEan strip spaties/streepjes', OFF.cleanEan(' 871 845-230 4653 ') === '8718452304653');
  check('#48: isEan accepteert 8/12/13 cijfers', OFF.isEan('12345678') && OFF.isEan('123456789012') && OFF.isEan('8718452304653'));
  check('#48: isEan weigert 7/11/14 cijfers of letters', !OFF.isEan('1234567') && !OFF.isEan('12345678901') && !OFF.isEan('12345678901234') && !OFF.isEan('abcdefghijkl'));
  check('#48: isRestrictedEan8 (20-29) herkent Lidl-codes', OFF.isRestrictedEan8('20662929') && OFF.isRestrictedEan8('29999999') && !OFF.isRestrictedEan8('87123456') && !OFF.isRestrictedEan8('12345678'));

  // ================= 3. URL-allowlists (security) =================
  check('#48: assertApiUrl: alleen https world.openfoodfacts.org', OFF.assertApiUrl('https://world.openfoodfacts.org/api/v2/product/1.json') !== null);
  check('#48: assertApiUrl weigert http / andere host / javascript:', OFF.assertApiUrl('http://world.openfoodfacts.org/x') === null && OFF.assertApiUrl('https://evil.com/x') === null && OFF.assertApiUrl('javascript:alert(1)') === null && OFF.assertApiUrl('https://world.openfoodfacts.org.evil.com/') === null);
  check('#48: imgUrlAllowed: alleen https images.openfoodfacts.org ...jpg/png', !!OFF.imgUrlAllowed(IMG) && !!OFF.imgUrlAllowed('https://images.openfoodfacts.org/images/products/a/b/front.400.png'));
  check('#48: imgUrlAllowed weigert http/andere host/niet-afbeelding', !OFF.imgUrlAllowed('http://images.openfoodfacts.org/images/products/x.jpg') && !OFF.imgUrlAllowed('https://evil.com/images/products/x.jpg') && !OFF.imgUrlAllowed('https://images.openfoodfacts.org/images/products/x.gif') && !OFF.imgUrlAllowed('https://images.openfoodfacts.org/other/x.jpg') && !OFF.imgUrlAllowed(null));
  check('#48: toSizedImageUrl: .full.jpg -> .400.jpg; kale extensie -> .400.ext', OFF.toSizedImageUrl(IMG, 400) === IMG.replace('.full.jpg', '.400.jpg') && OFF.toSizedImageUrl('https://images.openfoodfacts.org/images/products/a/x.jpg', 400) === 'https://images.openfoodfacts.org/images/products/a/x.400.jpg' && OFF.toSizedImageUrl('https://evil.com/x.jpg', 400) === null);

  // ================= 4. numerieke validatie voór opslag =================
  check('#48: num: komma-decimaal, afronding 2 dec', OFF.num('12,5') === 12.5 && OFF.num(0.30000000004) === 0.3 && OFF.num(295) === 295);
  check('#48: num weigert NaN/negatief/extreem', OFF.num('abc') === null && OFF.num(-5) === null && OFF.num(2e6) === null && OFF.num(NaN) === null && OFF.num(Infinity) === null);

  // ================= 5. parseNutriments / parseProduct =================
  {
    const n = OFF.parseNutriments({ 'energy-kcal_100g': '295', fat_100g: -1, carbohydrates_100g: 'abc', proteins_100g: 0.3, salt_serving: 0.01 }, ' 20 g ');
    check('#48: parseNutriments: alleen geldige waarden, per100 + perServing + portiegrootte', !!n && n.per100.energyKcal === 295 && n.per100.protein === 0.3 && !('fat' in n.per100) && !('carbs' in n.per100) && n.perServing.salt === 0.01 && n.servingSize === '20 g');
    check('#48: parseNutriments: leeg/onbekend -> null', OFF.parseNutriments(null, null) === null && OFF.parseNutriments({ fat_100g: -1 }, null) === null);
    const p = OFF.parseProduct(PRODUCT_JSON.product);
    check('#48: parseProduct: ean/fullName/brand/imageUrl/nutrition', !!p && p.ean === '8718452304653' && p.fullName === 'Jumbo Appelstroop 450 g' && p.brand === 'Jumbo' && p.imageUrl === IMG && p.nutrition.per100.energyKcal === 295);
    check('#48: parseProduct weigert zonder geldige code of naam', OFF.parseProduct({ code: 'abc', product_name: 'x' }) === null && OFF.parseProduct({ code: '12345678' }) === null && OFF.parseProduct(null) === null);
    check('#48: parseProduct: niet-toegestane afbeeldings-URL -> null (nooit als src)', OFF.parseProduct({ code: '12345678', product_name: 'X', image_front_url: 'https://evil.com/x.jpg' }).imageUrl === null);
    check('#48: parseProductResponse: status 0 (onbekend) -> null', OFF.parseProductResponse({ status: 0 }) === null && OFF.parseProductResponse(PRODUCT_JSON).ean === '8718452304653');
  }

  // ================= 6. fetchJson/lookup/search/download met geinjecteerde fetch =================
  {
    const ff = makeFakeFetch();
    const prod = await OFF.lookupEan('8718452304653', ff.f);
    check('#48: lookupEan via fake fetch -> geparseerd product', !!prod && prod.ean === '8718452304653' && prod.nutrition.perServing.energyKcal === 59);
    check('#48: fetchJson stuurt beschrijvende User-Agent + Accept', ff.calls.length === 1 && ff.calls[0].ua === OFF.USER_AGENT && ff.calls[0].url.indexOf('https://world.openfoodfacts.org/api/v2/product/8718452304653.json') === 0);
    check('#48: lookupEan ongeldige EAN -> null zónder fetch', (await OFF.lookupEan('123', ff.f)) === null && ff.calls.length === 1);
    let threw = null;
    try { await OFF.fetchJson('https://evil.com/x', ff.f); } catch (e) { threw = e; }
    check('#48: fetchJson blokkeert niet-allowlist URL (fetch niet aangeroepen)', !!threw && /niet toegestaan/.test(threw.message) && ff.calls.length === 1);
    const nf = makeFakeFetch();
    nf.f = async () => ({ ok: false, status: 429, text: async () => '', blob: async () => null });
    threw = null;
    try { await OFF.lookupEan('8718452304653', nf.f); } catch (e) { threw = e; }
    check('#48: HTTP-fout (429 rate limit) -> duidelijke fout', !!threw && /HTTP 429/.test(threw.message));
    const sf = makeFakeFetch();
    const res = await OFF.searchProducts('appelstroop', sf.f);
    check('#48: searchProducts parseert resultatenlijst', res.length === 2 && res[0].ean === '8718452304653' && sf.calls[0].url.indexOf('/api/v2/search') !== -1 && sf.calls[0].url.indexOf('search_terms=appelstroop') !== -1);
    check('#48: searchProducts < 2 tekens -> [] zonder fetch', (await OFF.searchProducts('a', sf.f)).length === 0 && sf.calls.length === 1);
    const big = await OFF.searchProducts('xy', async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ products: Array.from({ length: 20 }, (_, i) => ({ code: '1234567' + String(i).padStart(5, '0'), product_name: 'P' + i })) }) }));
    check('#48: searchResults begrensd tot page_size (' + OFF.SEARCH_PAGE_SIZE + ')', big.length === OFF.SEARCH_PAGE_SIZE);
    const df = makeFakeFetch();
    const blob = await OFF.downloadImage(IMG, df.f, 400);
    check('#48: downloadImage vraagt de 400px-variant en geeft een blob', !!blob && blob.size === 4321 && df.calls[0].url === IMG.replace('.full.jpg', '.400.jpg'));
    check('#48: downloadImage weigert niet-allowlist URL zónder fetch', (await OFF.downloadImage('https://evil.com/x.jpg', df.f, 400)) === null && df.calls.length === 1);
  }

  // ================= 7. GF: product-images store (v2, keyed per EAN) =================
  {
    const idb = makeFakeIDB();
    global.indexedDB = /** @type {any} */ (idb);
    await GF.saveProductImage('8718452304653', { size: 10, type: 'image/jpeg' });
    const rec = await GF.getProductImage('8718452304653');
    check('#48: GF product-image roundtrip (ean-keyed)', !!rec && rec.ean === '8718452304653' && rec.mime === 'image/jpeg');
    check('#48: GF DB v2 bevat dish-images én product-images stores', GF.DB_VERSION === 2 && GF.PRODUCT_IMAGE_STORE === 'product-images' && !!idb._stores['dish-images'] && !!idb._stores['product-images']);
    await GF.saveDishImage('r1', { size: 5, type: 'image/jpeg' }, 100, 100);
    check('#48: GF dish-images (#60) blijven werken na upgrade', !!(await GF.getDishImage('r1')));
    await GF.deleteProductImage('8718452304653');
    check('#48: GF deleteProductImage -> weg', (await GF.getProductImage('8718452304653')) === null);
    delete global.indexedDB;
  }

  // ================= 8. catalog: normalizeProducts bewaart/valideert de OFF-velden =================
  {
    const m0 = loadApp(APP, {});
    const catalog = m0.sandbox.__weekmenuModules('src/domain/catalog.js');
    const good = catalog.normalizeProducts([{ id: 'p1', name: 'appelstroop', cat: 'broodbeleg', ean: ' 8718452304653 ', fullName: 'Jumbo Appelstroop 450 g', nutrition: { per100: { energyKcal: 295, fat: -1 }, servingSize: '20 g', perServing: { energyKcal: 59 } }, offImageUrl: IMG }]);
    check('#48: normalizeProducts bewaart geldige ean/fullName/nutrition/offImageUrl (ean genormaliseerd)', good[0].ean === '8718452304653' && good[0].fullName === 'Jumbo Appelstroop 450 g' && good[0].nutrition.per100.energyKcal === 295 && !('fat' in good[0].nutrition.per100) && good[0].nutrition.perServing.energyKcal === 59 && good[0].offImageUrl === IMG);
    const bad = catalog.normalizeProducts([{ id: 'p2', name: 'x', cat: 'overig', ean: 'abc', fullName: '   ', nutrition: { per100: { energyKcal: -5 } }, offImageUrl: 'https://evil.com/x.jpg' }]);
    check('#48: normalizeProducts wist ongeldige ean / lege fullName / ongeldige nutrition / niet-OFF foto-URL', !('ean' in bad[0]) && !('fullName' in bad[0]) && !('nutrition' in bad[0]) && !('offImageUrl' in bad[0]));
    const long = catalog.normalizeProducts([{ id: 'p3', name: 'y', cat: 'overig', fullName: 'x'.repeat(300) }]);
    check('#48: normalizeProducts kapt fullName af op 160 tekens', long[0].fullName.length === 160);
  }

  // ================= 9. UI-flow: kaart -> koppelen/zoeken -> Kies -> cache -> detail -> refresh -> ontkoppelen =================
  {
    const idb = makeFakeIDB();
    global.indexedDB = /** @type {any} */ (idb); // directe GF-aanroepen in dit blok delen dezelfde fake store als de app-sandbox
    const ff = makeFakeFetch();
    let urlN = 0;
    const fakeURL = { createObjectURL: () => 'blob:fake-' + (++urlN), revokeObjectURL() {} };
    const t = makeApp(SEED, { indexedDB: idb, fetch: ff.f, URL: fakeURL });

    check('#48 UI: product-kaart opent vanuit catalogus', openProductCard(t, 'appelstroop'));
    let h = t.html();
    check('#48 UI: zonder EAN: badge "geen EAN gekoppeld" + knop "EAN koppelen / zoeken"', h.indexOf('geen EAN gekoppeld') !== -1 && !!t.btnByText('EAN koppelen / zoeken'));
    check('#48 UI: bron/info-tekst in de kaart (Open Food Facts)', h.indexOf('Via Open Food Facts') !== -1);

    // koppelen/zoeken-sheet openen
    t.btnByText('EAN koppelen / zoeken').props.onClick();
    h = t.html();
    check('#48 UI: sheet EAN koppelen / zoeken met productnaam + categorie', h.indexOf('EAN koppelen / zoeken') !== -1 && h.indexOf('appelstroop') !== -1 && h.indexOf('broodbeleg') !== -1);
    check('#48 UI: EAN-invoerveld + scan-knop + zoekveld + bronvermelding onderaan', !!t.inputByPlaceholder('EAN invoeren') && !!t.btnByText('scan') && h.indexOf('of zoek op productnaam') !== -1 && h.indexOf('Bron: Open Food Facts') !== -1 && h.indexOf('CC BY-SA 3.0') !== -1);

    // scan zonder BarcodeDetector -> fallback-melding (handmatige invoer)
    t.btnByText('scan').props.onClick();
    await tick();
    check('#48 UI: scan zonder ondersteuning -> melding "voer de EAN handmatig in"', t.html().indexOf('Scannen wordt niet ondersteund') !== -1);

    // ongeldige EAN -> validatiefout
    let eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onChange({ target: { value: '12a3' } });
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await tick(); await tick();
    check('#48 UI: ongeldige EAN -> "Geen geldige EAN (8, 12 of 13 cijfers)."', t.html().indexOf('Geen geldige EAN') !== -1 && ff.calls.length === 0);

    // geldige EAN -> lookup -> 1 resultaat met Kies
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onChange({ target: { value: '8718452304653' } });
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await tick(); await tick(); await tick();
    h = t.html();
    check('#48 UI: EAN-lookup -> resultaat "Jumbo Appelstroop 450 g" met Kies-knop', h.indexOf('Jumbo Appelstroop 450 g') !== -1 && !!t.btnByText('Kies'));
    check('#48 UI: lookup alleen naar world.openfoodfacts.org met User-Agent', ff.calls.some((c) => c.url.indexOf('https://world.openfoodfacts.org/api/v2/product/8718452304653.json') === 0 && c.ua === OFF.USER_AGENT));
    check('#48 UI: geen restricted-EAN-8-waarschuwing bij EAN-13', h.indexOf('restricted circulation') === -1);
    check('#48 UI: resultaat-foto alleen via <img src> met OFF-allowlist', t.findAll((n) => n.type === 'img').every((n) => /^https:\/\/images\.openfoodfacts\.org\/images\/products\//.test(n.props.src || '') || /^blob:/.test(n.props.src || '')));

    // Kies -> product gekoppeld + foto gecachet + toast + sheet dicht
    t.btnByText('Kies').props.onClick();
    await tick(); await tick(); await tick(); await tick();
    const p1 = t.productsState().find((p) => p.id === 'p1');
    check('#48 UI: na Kies: product heeft ean/fullName/nutrition/offImageUrl', !!p1 && p1.ean === '8718452304653' && p1.fullName === 'Jumbo Appelstroop 450 g' && p1.nutrition && p1.nutrition.per100.energyKcal === 295 && p1.nutrition.perServing.carbs === 14.4 && p1.offImageUrl === IMG);
    check('#48 UI: OFF-foto lokaal gecachet in de image-store (#60)', !!(await GF.getProductImage('8718452304653')));
    h = t.html();
    check('#48 UI: toast "Product gekoppeld aan Open Food Facts: Jumbo Appelstroop 450 g"', h.indexOf('Product gekoppeld aan Open Food Facts: Jumbo Appelstroop 450 g') !== -1);
    check('#48 UI: sheet gesloten, kaart toont EAN-chip + "Productgegevens"', !t.btnByText('Kies') && h.indexOf('EAN 8718452304653') !== -1 && !!t.btnByText('Productgegevens'));

    // detail-sheet: foto uit cache (blob:), voedingswaarden per 100 g + portie, bronvermelding
    t.btnByText('Productgegevens').props.onClick();
    await tick(); await tick();
    h = t.html();
    check('#48 UI: detail-sheet: fullName + EAN + foto uit lokale cache (blob:) met cache-badge', h.indexOf('Jumbo Appelstroop 450 g') !== -1 && h.indexOf('EAN 8718452304653') !== -1 && t.findAll((n) => n.type === 'img' && /^blob:fake-/.test(n.props.src || '')).length >= 1 && h.indexOf('gecachet · offline') !== -1 && h.indexOf('uit lokale cache · offline beschikbaar · geen nieuwe API-call') !== -1);
    check('#48 UI: detail-sheet: voedingswaarden per 100 g én portie 20 g', h.indexOf('Voedingswaarden') !== -1 && h.indexOf('per 100 g') !== -1 && h.indexOf('portie 20 g') !== -1 && h.indexOf('295') !== -1 && h.indexOf('14,4') !== -1 && h.indexOf('Eiwitten') !== -1);
    check('#48 UI: detail-sheet: bronvermelding CC BY-SA + "foto lokaal gecachet"', h.indexOf('Gegevens & foto\'s: Open Food Facts (CC BY-SA 3.0) · foto lokaal gecachet') !== -1);

    // Waarden opnieuw ophalen -> nieuwe API-call + toast
    const callsBefore = ff.calls.length;
    t.btnByText('Waarden opnieuw ophalen').props.onClick();
    await tick(); await tick(); await tick(); await tick();
    check('#48 UI: "Waarden opnieuw ophalen" doet een nieuwe lookup + toast', ff.calls.length > callsBefore && t.html().indexOf('Waarden opgehaald en lokaal opgeslagen.') !== -1);

    // ontkoppelen -> velden gewist, foto uit IDB, sheet dicht, badge terug
    t.btnByText('Ontkoppelen').props.onClick();
    await tick(); await tick(); await tick();
    const p1b = t.productsState().find((p) => p.id === 'p1');
    check('#48 UI: "Ontkoppelen" wist ean/fullName/nutrition/offImageUrl + foto uit image-store', !!p1b && !p1b.ean && !p1b.fullName && !p1b.nutrition && !p1b.offImageUrl && (await GF.getProductImage('8718452304653')) === null);
    h = t.html();
    check('#48 UI: na ontkoppelen: sheet dicht + badge "geen EAN gekoppeld" terug', !t.btnByText('Ontkoppelen') && h.indexOf('geen EAN gekoppeld') !== -1);

    // restricted EAN-8 (20-29) op p2 -> multi-match warning + alle matches
    check('#48 UI: tweede product (bloemkool) openen', openProductCard(t, 'bloemkool'));
    t.btnByText('EAN koppelen / zoeken').props.onClick();
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onChange({ target: { value: '20662929' } });
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await tick(); await tick(); await tick();
    h = t.html();
    check('#48 UI: restricted EAN-8 (20662929) -> waarschuwing + alle matches ter desambiguatie', h.indexOf('EAN-8 (20–29) is niet uniek') !== -1 && t.btnsByText('Kies').length === 2);

    // EAN niet gevonden (status 0)
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onChange({ target: { value: '8710400099999' } });
    eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await tick(); await tick(); await tick();
    check('#48 UI: onbekende EAN -> "EAN 8710400099999 niet gevonden bij Open Food Facts."', t.html().indexOf('EAN 8710400099999 niet gevonden bij Open Food Facts.') !== -1);

    // zoeken op naam: geen resultaten -> melding; wel -> resultaten
    const qInput = t.findAll((n) => n.type === 'input' && !n.props.placeholder && n.props.autoCapitalize === 'none')[0];
    qInput.props.onChange({ target: { value: 'xyzzyplugh' } });
    await tick(); await tick(); await tick();
    check('#48 UI: lege zoekresultaten -> "Geen resultaten" melding', t.html().indexOf('Geen resultaten') !== -1);
    const qInput2 = t.findAll((n) => n.type === 'input' && !n.props.placeholder && n.props.autoCapitalize === 'none')[0];
    qInput2.props.onChange({ target: { value: 'appelstroop' } });
    await tick(); await tick(); await tick();
    check('#48 UI: zoeken op naam -> OFF-resultaten met Kies (merkloos basisproduct: generieke entries)', t.btnsByText('Kies').length === 2 && t.html().indexOf('Appelstroop (huismerk)') !== -1);
  }

  // ================= 10. offline/geen fetch: duidelijke fout, geen crash =================
  {
    const t = makeApp(SEED, { indexedDB: makeFakeIDB(), URL: { createObjectURL: () => 'blob:x', revokeObjectURL() {} } }); // géén fetch in sandbox
    openProductCard(t, 'appelstroop');
    t.btnByText('EAN koppelen / zoeken').props.onClick();
    const eanInput = t.inputByPlaceholder('EAN invoeren');
    eanInput.props.onChange({ target: { value: '8718452304653' } });
    const eanInput2 = t.inputByPlaceholder('EAN invoeren');
    eanInput2.props.onKeyDown({ key: 'Enter', preventDefault() {} });
    await tick(); await tick(); await tick();
    check('#48 UI: offline (geen fetch) -> foutmelding "Ophalen mislukt (offline of rate limit)"', t.html().indexOf('Ophalen mislukt (offline of rate limit)') !== -1);
  }

  // ================= 11. lokale cache: herladen = geen nieuwe API-call =================
  {
    const idb = makeFakeIDB();
    global.indexedDB = /** @type {any} */ (idb);
    await GF.saveProductImage('8718452304653', { size: 10, type: 'image/jpeg' });
    delete global.indexedDB;
    const ff = makeFakeFetch();
    const seed = {
      settings: SEED.settings,
      products: [{ id: 'p1', name: 'appelstroop', cat: 'broodbeleg', market: 'jumbo', unit: 'g', tags: [], pack: null,
        ean: '8718452304653', fullName: 'Jumbo Appelstroop 450 g',
        nutrition: { per100: { energyKcal: 295, fat: 0, carbs: 72, protein: 0.3, salt: 0.01 }, servingSize: '20 g', perServing: { energyKcal: 59, carbs: 14.4, protein: 0.1 } },
        offImageUrl: IMG }],
      recipes: [], menuByDate: {}, stock: [], extraItems: [], checked: {},
    };
    const t = makeApp(seed, { indexedDB: idb, fetch: ff.f, URL: { createObjectURL: () => 'blob:cached-1', revokeObjectURL() {} } });
    check('#48 UI: herladen: ean/nutrition/offImageUrl uit seed behouden (localStorage-cache)', (() => { const p = t.productsState().find((x) => x.id === 'p1'); return !!p && p.ean === '8718452304653' && p.nutrition.per100.carbs === 72 && p.offImageUrl === IMG; })());
    openProductCard(t, 'appelstroop');
    await tick(); await tick();
    t.btnByText('Productgegevens').props.onClick();
    await tick(); await tick();
    const h = t.html();
    check('#48 UI: herladen: detail uit lokale cache — foto uit IndexedDB (blob:), géén nieuwe API-call', ff.calls.length === 0 && t.findAll((n) => n.type === 'img' && n.props.src === 'blob:cached-1').length >= 1 && h.indexOf('uit lokale cache · offline beschikbaar') !== -1 && h.indexOf('295') !== -1);
  }

  // ================= 12. security: nooit innerHTML/dangerouslySetInnerHTML in de nieuwe code =================
  {
    const src = ['src/ui/components.jsx', 'src/state/store.js', 'src/openFoodFacts.js'].map((f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8'))
      .join('\n')
      .replace(/\/\*[\s\S]*?\*\//g, '') // comments weg, dan alleen echte code controleren
      .replace(/\/\/[^\n]*/g, '');
    check('#48 security: geen innerHTML / dangerouslySetInnerHTML / eval / new Function in UI-store-OFF-code', !/innerHTML|dangerouslySetInnerHTML|\beval\s*\(|new\s+Function/.test(src));
  }

  console.log(fails === 0 ? '\nALLE OPEN-FOOD-FACTS-TESTS GESLAAGD' : `\n${fails} TEST(S) GEFAALD`);
  process.exit(fails === 0 ? 0 : 1);
}

main().catch((e) => { console.error('FATALE TESTFOUT:', e); process.exit(1); });
