/**
 * Productnormalisatie & merge-logica — issue #59 (MMasician/weekmenu-app)
 *
 * Pure logica (geen DOM): in de browser als globalThis.ProductNormalisatie,
 * in Node (tools/test-*.cjs) via module.exports.
 *
 * Owner-besluiten (issue #59):
 * - Kanjer bij samenvoegen: kortste benaming met de minste woorden → bij gelijke
 *   lengte meest gebruikt in recepten → anders alfabetisch eerste.
 * - Per-recept tags worden logisch afgeleid uit het benamingsverschil
 *   (bijv. 'melk' vs 'volle melk' → 'vol'); géén willekeurige woorden zoals
 *   'rood'/'zakje'/'optioneel'. Tags zijn per recept aanpasbaar/verwijderbaar
 *   en zichtbaar in recept én weekmenu-weergave (#60).
 * - Eenheden worden automatisch omgerekend (1 dl = 10 cl); het getal is
 *   handmatig te corrigeren. Ongeldige hoeveelheid → geen opslag.
 * - Undo van een merge alléén binnen dezelfde sessie (in-memory); daarna permanent.
 * - Alles local-first per huishouden (ADR-009/ADR-010), volledig offline.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.ProductNormalisatie = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const SYNC_TOKEN = 'productnormalisatie-#59';

  // Variant-kwalificaties: duiden een variant aan maar beschrijven hetzelfde basisproduct.
  const VARIANT_QUALIFIERS = ['vol', 'volle', 'halfvol', 'mager', 'magere', 'vers', 'verse', 'gedroogd', 'diepvries', 'rood', 'rode', 'geel', 'gele', 'wit', 'witte', 'groen', 'groene', 'oranje', 'paars', 'bruin', 'bruine', 'zwart', 'zwarte', 'pink'];
  // Generieke descriptors: thêmNever als automatische tag-voorstel (owner-besluit #59).
  const GENERIC_DESCRIPTORS = ['optioneel', 'eventueel', 'evt', 'zakje', 'blikje', 'pak', 'pakje', 'doos', 'fles', 'stuk', 'stuks', 'sachet'];

  // Alleen deze kwalificaties worden als LOGISCHE automatische tag voorgesteld.
  const AUTO_TAG_MAP = {
    vol: 'vol', volle: 'vol', halfvol: 'halfvol',
    mager: 'mager', magere: 'mager',
    vers: 'vers', verse: 'vers',
    gedroogd: 'gedroogd', diepvries: 'diepvries'
  };

  // Omrekeningstabellen (volume in ml, massa in g). 1 dl = 10 cl, 1 el = 3 tl.
  const VOLUME_ML = { ml: 1, cl: 10, dl: 100, l: 1000, liter: 1000, el: 15, eetlepel: 15, tl: 5, theelepel: 5 };
  const MASS_G = { mg: 0.001, g: 1, gram: 1, kg: 1000, kilogram: 1000 };

  function baseName(name) {
    // tekst na komma of haakje is een toevoeging (bijv. 'ui, rood' → 'ui')
    return String(name == null ? '' : name).split(/[,(]/)[0].trim();
  }
  function tokens(name) {
    return baseName(name).toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ').split(' ').filter(Boolean);
  }
  function normalizeKey(name) {
    const raw = String(name == null ? '' : name).toLowerCase().trim();
    const t = tokens(name).filter(function (w) {
      return VARIANT_QUALIFIERS.indexOf(w) === -1 && GENERIC_DESCRIPTORS.indexOf(w) === -1;
    });
    const key = t.join(' ');
    return key || raw; // fallback: originele naam als de genormaliseerde sleutel leeg is
  }

  function findDuplicateGroups(products) {
    const byKey = new Map();
    (products || []).forEach(function (p) {
      const k = normalizeKey(p.name);
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push(p);
    });
    const groups = [];
    byKey.forEach(function (list) {
      if (list.length > 1) groups.push(list.slice().sort(function (a, b) { return a.name.localeCompare(b.name, 'nl'); }));
    });
    return groups.sort(function (a, b) { return a[0].name.localeCompare(b[0].name, 'nl'); });
  }

  function duplicateBadgeMap(products) {
    const map = {};
    findDuplicateGroups(products).forEach(function (g) {
      g.forEach(function (p) { map[p.id] = g.length; });
    });
    return map;
  }

  function usageCount(productId, recipes) {
    let n = 0;
    (recipes || []).forEach(function (r) {
      (r.ingredients || []).forEach(function (i) { if (i.productId === productId) n += 1; });
    });
    return n;
  }

  function wordCount(name) { return tokens(name).length; }

  // Kanjer-heuristiek: minste woorden → kortste benaming → meest gebruikt in recepten → alfabetisch.
  function pickKanjer(candidates, recipes) {
    if (!candidates || !candidates.length) return null;
    const sorted = candidates.slice().sort(function (a, b) {
      const wa = wordCount(a.name); const wb = wordCount(b.name);
      if (wa !== wb) return wa - wb;
      const la = baseName(a.name).length; const lb = baseName(b.name).length;
      if (la !== lb) return la - lb;
      const ua = usageCount(a.id, recipes); const ub = usageCount(b.id, recipes);
      if (ua !== ub) return ub - ua;
      return String(a.name).localeCompare(String(b.name), 'nl');
    });
    return sorted[0];
  }

  // Logische tag uit het benamingsverschil; willekeurige woorden worden NIET voorgesteld.
  function deriveTags(nameA, nameB) {
    const ta = tokens(nameA); const tb = tokens(nameB);
    const diff = ta.filter(function (w) { return tb.indexOf(w) === -1; })
      .concat(tb.filter(function (w) { return ta.indexOf(w) === -1; }));
    const tags = [];
    diff.forEach(function (w) {
      const tag = AUTO_TAG_MAP[w];
      if (tag && tags.indexOf(tag) === -1) tags.push(tag);
    });
    return tags;
  }

  function cloneRecipes(recipes) { return JSON.parse(JSON.stringify(recipes || [])); }

  /**
   * Merge van productvarianten naar één kanjer-product.
   * - alle recept-koppelingen gaan over naar de kanjer;
   * - duplicaten verdwijnen uit de productlijst;
   * - per-recept tags (gesuggereerd uit het benamingsverschil, overschrijfbaar via tagsByRecipe)
   *   worden op het ingrediënt opgeslagen en gelden alléén voor dat recept;
   * - retourneert een undo-entry (herstel binnen dezelfde sessie).
   */
  function mergeProducts(opts) {
    const products = (opts.products || []).slice();
    const recipes = cloneRecipes(opts.recipes);
    const ids = (opts.ids || []).slice();
    if (ids.length < 2) throw new Error('merge vereist minstens 2 productvarianten');
    const inGroup = {};
    ids.forEach(function (id) { inGroup[id] = true; });
    const group = products.filter(function (p) { return inGroup[p.id]; });
    if (group.length < 2) throw new Error('geen geldige duplicaatgroep');
    const kanjer = (opts.kanjerId && group.find(function (p) { return p.id === opts.kanjerId; })) || pickKanjer(group, recipes);
    const variantById = {};
    group.forEach(function (p) { variantById[p.id] = p; });
    const tagsByRecipe = opts.tagsByRecipe || {};

    recipes.forEach(function (r) {
      (r.ingredients || []).forEach(function (ing) {
        if (inGroup[ing.productId] && ing.productId !== kanjer.id) {
          const variant = variantById[ing.productId];
          ing.productId = kanjer.id;
          const suggested = variant ? deriveTags(kanjer.name, variant.name) : [];
          const chosen = Object.prototype.hasOwnProperty.call(tagsByRecipe, r.id) ? (tagsByRecipe[r.id] || []) : suggested;
          const merged = (ing.tags || []).slice();
          chosen.forEach(function (t) { if (t && merged.indexOf(t) === -1) merged.push(t); });
          ing.tags = merged;
        }
      });
    });

    const mergedProducts = products.filter(function (p) { return !inGroup[p.id] || p.id === kanjer.id; });
    const undo = {
      type: 'merge',
      ids: ids,
      kanjerId: kanjer.id,
      productsBefore: opts.products || [],
      recipesBefore: opts.recipes || []
    };
    return { products: mergedProducts, recipes: recipes, kanjer: kanjer, undo: undo };
  }

  function canonicalUnit(u) { return String(u == null ? '' : u).trim().toLowerCase(); }
  function roundSmart(v) { return Math.round(v * 100) / 100; }

  // Automatische eenheidsomrekening (1 dl = 10 cl). Handmatige correctie blijft mogelijk in de UI.
  function convertAmount(amount, fromUnit, toUnit) {
    const a = Number(amount);
    if (!isFinite(a) || a <= 0) return { ok: false, error: 'ongeldige-hoeveelheid' };
    const f = canonicalUnit(fromUnit); const t = canonicalUnit(toUnit);
    if (!f || !t) return { ok: false, error: 'ontbrekende-eenheid' };
    if (f === t) return { ok: true, amount: a };
    if (VOLUME_ML[f] != null && VOLUME_ML[t] != null) return { ok: true, amount: roundSmart((a * VOLUME_ML[f]) / VOLUME_ML[t]) };
    if (MASS_G[f] != null && MASS_G[t] != null) return { ok: true, amount: roundSmart((a * MASS_G[f]) / MASS_G[t]) };
    return { ok: false, error: 'niet-converteerbaar' };
  }

  function validateAmount(v) {
    const n = Number(v);
    if (v == null || v === '' || !isFinite(n) || n <= 0) return { ok: false, error: 'ongeldige-hoeveelheid' };
    return { ok: true, value: n };
  }

  function findExistingByNormalizedName(products, name) {
    const k = normalizeKey(name);
    return (products || []).find(function (p) { return normalizeKey(p.name) === k; }) || null;
  }

  // Undo alléén binnen dezelfde sessie (in-memory; na afsluiten is een merge permanent).
  function createUndoStack() {
    const stack = [];
    return {
      push: function (entry) { stack.push(entry); },
      pop: function () { return stack.pop(); },
      get length() { return stack.length; }
    };
  }

  return {
    SYNC_TOKEN: SYNC_TOKEN,
    baseName: baseName,
    tokens: tokens,
    normalizeKey: normalizeKey,
    findDuplicateGroups: findDuplicateGroups,
    duplicateBadgeMap: duplicateBadgeMap,
    usageCount: usageCount,
    pickKanjer: pickKanjer,
    deriveTags: deriveTags,
    mergeProducts: mergeProducts,
    convertAmount: convertAmount,
    validateAmount: validateAmount,
    findExistingByNormalizedName: findExistingByNormalizedName,
    createUndoStack: createUndoStack,
    VOLUME_ML: VOLUME_ML,
    MASS_G: MASS_G
  };
});
