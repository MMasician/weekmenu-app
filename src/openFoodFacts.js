/*
 * Open Food Facts-koppeling per product (issue #48, ADR-024).
 * Alleen HTTPS naar world.openfoodfacts.org (API) en images.openfoodfacts.org (foto's);
 * responses alleen via JSON.parse; afbeeldingen alleen via <img src> met URL-allowlist.
 * Browser: geladen via index.html (zet globalThis.OpenFoodFacts).
 * Node (tests): via require() — fetch wordt dan geïnjecteerd (fetchImpl).
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OpenFoodFacts = api;
})(typeof globalThis !== 'undefined' ? globalThis : self, function () {
  'use strict';

  const API_HOST = 'https://world.openfoodfacts.org';
  const IMG_PREFIX = 'https://images.openfoodfacts.org/images/products/';
  const USER_AGENT = 'WeekmenuApp/1.0 (offline-first PWA; productgegevens via Open Food Facts, CC BY-SA 3.0)';
  const SEARCH_PAGE_SIZE = 8;

  function cleanEan(s) {
    return String(s == null ? '' : s).replace(/[\s-]/g, '');
  }
  function isEan(s) {
    return /^\d{8}$|^\d{12,13}$/.test(cleanEan(s));
  }
  // EAN-8 beginnend met 20-29 = "restricted circulation" (o.a. Lidl): niet uniek per product.
  function isRestrictedEan8(s) {
    const c = cleanEan(s);
    return /^2[0-9]\d{6}$/.test(c);
  }

  function productUrl(code) {
    return API_HOST + '/api/v2/product/' + encodeURIComponent(cleanEan(code)) + '.json?fields=code,product_name,brands,image_front_url,image_small_url,serving_size,nutriments,images';
  }
  function searchUrl(terms) {
    const fields = 'code,product_name,brands,image_front_url,image_small_url,serving_size,nutriments';
    return API_HOST + '/api/v2/search?action=process&search_terms=' + encodeURIComponent(String(terms || '').trim()) +
      '&search_simple=1&json=1&page_size=' + SEARCH_PAGE_SIZE + '&fields=' + fields;
  }

  // Alleen https://world.openfoodfacts.org/... (API); geen http, geen andere host.
  function assertApiUrl(u) {
    let parsed;
    try { parsed = new URL(u); } catch (e) { return null; }
    if (parsed.protocol !== 'https:') return null;
    if (parsed.hostname !== 'world.openfoodfacts.org') return null;
    return parsed.href;
  }
  // Alleen OFF-productafbeeldingen via <img src>; nooit object/embed/fetch-verwerking.
  function imgUrlAllowed(u) {
    return typeof u === 'string' && u.startsWith(IMG_PREFIX) && /\.(jpg|jpeg|png)$/i.test(u) && /^https:\/\/images\.openfoodfacts\.org\/images\/products\/[\w./-]+$/i.test(u);
  }
  // 400px-variant van een OFF-afbeelding-URL (bv. front_nl.22.full.jpg -> front_nl.22.400.jpg)
  function toSizedImageUrl(u, size) {
    if (!imgUrlAllowed(u)) return null;
    const s = String(size || 400);
    if (/\.full\.(jpg|jpeg|png)$/i.test(u)) return u.replace(/\.full\.(jpg|jpeg|png)$/i, '.' + s + '.$1');
    if (/\.\d+\.(jpg|jpeg|png)$/i.test(u)) return u.replace(/\.\d+\.(jpg|jpeg|png)$/i, '.' + s + '.$1');
    return u.replace(/\.(jpg|jpeg|png)$/i, '.' + s + '.$1');
  }

  // Numerieke voedingswaarde valideren: finite, >= 0, begrensd; afronden op 2 decimalen.
  function num(v) {
    const n = typeof v === 'string' ? Number(v.replace(',', '.')) : Number(v);
    if (!Number.isFinite(n) || n < 0 || n > 1e6) return null;
    return Math.round(n * 100) / 100;
  }

  const NUTRI_FIELDS = [
    ['energyKcal', 'energy-kcal_100g', 'energy-kcal_serving'],
    ['fat', 'fat_100g', 'fat_serving'],
    ['carbs', 'carbohydrates_100g', 'carbohydrates_serving'],
    ['protein', 'proteins_100g', 'proteins_serving'],
    ['salt', 'salt_100g', 'salt_serving'],
  ];

  // nutriments -> { per100: {...}, servingSize, perServing: {...}|null } (null-waarden weggelaten)
  function parseNutriments(nutriments, servingSizeRaw) {
    if (!nutriments || typeof nutriments !== 'object') return null;
    const per100 = {};
    const perServing = {};
    let any = false;
    NUTRI_FIELDS.forEach(([key, k100, kServing]) => {
      const v100 = num(nutriments[k100]);
      if (v100 != null) { per100[key] = v100; any = true; }
      const vS = num(nutriments[kServing]);
      if (vS != null) { perServing[key] = vS; any = true; }
    });
    if (!any) return null;
    const servingSize = typeof servingSizeRaw === 'string' && servingSizeRaw.trim() ? servingSizeRaw.trim().slice(0, 40) : null;
    return {
      per100,
      servingSize,
      perServing: Object.keys(perServing).length ? perServing : null,
    };
  }

  function parseProduct(p) {
    if (!p || typeof p !== 'object') return null;
    const ean = cleanEan(p.code);
    if (!isEan(ean)) return null;
    const fullName = typeof p.product_name === 'string' && p.product_name.trim() ? p.product_name.trim().slice(0, 160) : null;
    if (!fullName) return null;
    const brand = typeof p.brands === 'string' && p.brands.trim() ? p.brands.trim().split(',')[0].trim().slice(0, 80) : null;
    const imageUrl = imgUrlAllowed(p.image_front_url) ? p.image_front_url : (imgUrlAllowed(p.image_small_url) ? p.image_small_url : null);
    const nutrition = parseNutriments(p.nutriments, p.serving_size);
    return { ean, fullName, brand, imageUrl, nutrition };
  }

  function parseProductResponse(json) {
    if (!json || typeof json !== 'object') return null;
    if (Number(json.status) !== 1) return null; // 0 = onbekend product
    return parseProduct(json.product);
  }

  function parseSearchResponse(json) {
    if (!json || typeof json !== 'object' || !Array.isArray(json.products)) return [];
    return json.products.map(parseProduct).filter(Boolean).slice(0, SEARCH_PAGE_SIZE);
  }

  // JSON alleen via JSON.parse (nooit eval/new Function); altijd User-Agent meesturen.
  async function fetchJson(url, fetchImpl) {
    const safe = assertApiUrl(url);
    if (!safe) throw new Error('URL niet toegestaan: ' + String(url).slice(0, 80));
    const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!f) throw new Error('offline: geen fetch beschikbaar');
    // cache: 'no-store' — zoekopdrachten hebben query-parameters; de HTTP-cache mag
    // nooit een oudere search-response voor een andere query teruggeven (#48-fix)
    const res = await f(safe, { headers: { 'User-Agent': USER_AGENT, 'Accept': 'application/json' }, cache: 'no-store' });
    if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status));
    const text = await res.text();
    return JSON.parse(text);
  }

  async function lookupEan(code, fetchImpl) {
    if (!isEan(code)) return null;
    return parseProductResponse(await fetchJson(productUrl(code), fetchImpl));
  }
  async function searchProducts(terms, fetchImpl) {
    const q = String(terms || '').trim();
    if (q.length < 2) return [];
    return parseSearchResponse(await fetchJson(searchUrl(q), fetchImpl));
  }
  // Productfoto ophalen (alleen images.openfoodfacts.org, als blob — nooit verwerkt als code)
  async function downloadImage(url, fetchImpl, size) {
    const sized = toSizedImageUrl(url, size || 400);
    if (!sized) return null;
    const f = fetchImpl || (typeof fetch !== 'undefined' ? fetch.bind(globalThis) : null);
    if (!f) throw new Error('offline: geen fetch beschikbaar');
    const res = await f(sized, { headers: { 'User-Agent': USER_AGENT } });
    if (!res || !res.ok) throw new Error('HTTP ' + (res && res.status));
    return res.blob();
  }

  return {
    API_HOST, IMG_PREFIX, USER_AGENT, SEARCH_PAGE_SIZE,
    cleanEan, isEan, isRestrictedEan8,
    productUrl, searchUrl, assertApiUrl, imgUrlAllowed, toSizedImageUrl,
    num, parseNutriments, parseProduct, parseProductResponse, parseSearchResponse,
    fetchJson, lookupEan, searchProducts, downloadImage,
  };
});
