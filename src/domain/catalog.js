import { BASE_RECIPES } from "./recipes.js";
import { STOCK_DEFAULT, normalizeExtras } from "./stock.js";
// Productcatalogus (ADR-017): product-sleutels, eenheden, parsing en schalen van ingrediënten.
// Prijzen zijn vervallen (ADR-016 deprecate ADR-008). priceKey blijft: de categorie/winkel-koppeling
// van artikelen (ADR-015) matcht receptingrediënten op genormaliseerde naam.
export const priceKey = (s) => s.trim().toLowerCase();

// ---- productcatalogus (ADR-017) ----
// Een product is de verzamelnaam voor een ingrediënt, voorraadproduct of extra boodschap. Het staat in
// een lokaal bewaarde catalogus (name/cat/market/unit); per recept/voorraad/extra staat alleen het
// aantal (amount + optionele eenheid) los bij het product.
export const UNITS = ["stuks", "g", "kg", "ml", "l", "cl", "blik", "blikje", "pak", "pakje", "zak", "doos", "fles", "pot", "el", "tl", "teen"];
// #35: el = 15 ml, tl = 5 ml (impliciet; dichtheid 1 g/ml) — el/tl horen bij de ml-groep.
export const UNIT_FACTOR = { g: 1, kg: 1000, ml: 1, cl: 10, l: 1000, el: 15, tl: 5 }; // naar basiseenheid (g / ml)
export const UNIT_GROUP = { g: ["g", "kg"], kg: ["g", "kg"], ml: ["ml", "cl", "l", "el", "tl"], cl: ["ml", "cl", "l", "el", "tl"], l: ["ml", "cl", "l", "el", "tl"], el: ["ml", "cl", "l", "el", "tl"], tl: ["ml", "cl", "l", "el", "tl"] };
// Dedup-sleutel: leading hoeveelheid/verpakking/eenheid eraf + enkelvoud (trailing 's/en/s), zodat
// "1 paprika" en "2 paprika's" hetzelfde product zijn.
export function productKey(s) {
  let t = String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return "";
  const orig = t;
  t = t.replace(/^([¼½¾]|\d+(?:[.,]\d+)?)\s+/, "");
  t = t.replace(/^(stuks|g|kg|ml|l|cl|blikje|blik|pakje|pak|zak|doos|fles|pot|el|tl|teen)\s+/i, "");
  t = t.replace(/'s$/, "");
  if (!/(ss|us|is)$/.test(t)) {
    const stem = t.replace(/(en|s)$/, "");
    if (stem.length >= 4) t = stem;
  }
  return t || orig;
}
// Oude ingrediënt-string ("2 paprika's", "1 blik kokosmelk", "200 g sperziebonen", "½ tl komijn")
// -> amount + unit + naam.
export function parseIngredientLabel(s) {
  const t = String(s || "").trim();
  let amount = null, unit = null, name = t;
  const m = /^([¼½¾]|\d+(?:[.,]\d+)?)\s+(.*)$/.exec(t);
  if (m) {
    amount = m[1] === "¼" ? 0.25 : m[1] === "½" ? 0.5 : m[1] === "¾" ? 0.75 : Number(m[1].replace(",", "."));
    const rest = m[2];
    const w = /^([A-Za-z]+)\s+(.+)$/.exec(rest);
    if (w && UNITS.includes(w[1].toLowerCase())) { unit = w[1].toLowerCase(); name = w[2]; }
    else name = rest;
  }
  return { amount, unit, name: name.trim() };
}
export const PLURAL_EX = { ei: "eieren", ui: "uien", tomaat: "tomaten", aardappel: "aardappelen", courgette: "courgettes" };
// Meervoud zonder AI: productnaam is het enkelvoud; amount != 1 -> meervoud via regel + kleine uitzonderingen.
export function pluralOf(name) {
  const k = productKey(name);
  if (PLURAL_EX[k]) {
    const ex = PLURAL_EX[k];
    return name && name[0] === name[0].toUpperCase() ? ex.charAt(0).toUpperCase() + ex.slice(1) : ex;
  }
  return /[aeiouy]$/i.test(name || "") ? name + "'s" : name + "en";
}
export function convertAmount(amount, from, to) {
  if (!(from in UNIT_FACTOR) || !(to in UNIT_FACTOR)) return null;
  const a = Number(amount);
  if (!Number.isFinite(a)) return null;
  return (a * UNIT_FACTOR[from]) / UNIT_FACTOR[to];
}
export const roundAmt = (n) => Math.round(n * 100) / 100;
// Auto-conversie alleen over de 1000-grens (g<->kg, ml<->l); cl alleen handmatig via de eenheid-select.
export function normalizeAmountUnit(amount, unit) {
  const a = Number(amount);
  if (!Number.isFinite(a) || !unit) return { amount: a, unit };
  if (unit === "g" && a >= 1000) return { amount: roundAmt(a / 1000), unit: "kg" };
  if (unit === "kg" && a < 1) return { amount: roundAmt(a * 1000), unit: "g" };
  if (unit === "ml" && a >= 1000) return { amount: roundAmt(a / 1000), unit: "l" };
  if (unit === "l" && a < 1) return { amount: roundAmt(a * 1000), unit: "ml" };
  return { amount: a, unit };
}
// #35: optionele "inhoud per verpakking" op een product (bijv. 1 pot = 500 g -> pack { amount: 500, unit: "g" }).
export function normalizePack(pack) {
  if (!pack || typeof pack !== "object") return null;
  const amount = Number(pack.amount);
  const unit = typeof pack.unit === "string" ? pack.unit.trim().toLowerCase() : "";
  if (!Number.isFinite(amount) || amount <= 0 || !unit) return null;
  return { amount: roundAmt(amount), unit: UNITS.includes(unit) ? unit : unit.slice(0, 8) };
}
// #35: weergave op de boodschappenlijst in winkel-eenheid. Som in basiseenheid (g/ml, dichtheid 1 g/ml);
// als het product een pack heeft -> hele verpakkingen (ceil, alleen hele verpakkingen haalbaar) in de
// product-eenheid (bijv. "1 pot Kwark"); anders g/kg/ml/l met min. 100 g/ml (afronden omhoog). Nooit el/tl.
export function shopDisplayAmount(amount, unit, product) {
  if (amount == null || !Number.isFinite(Number(amount))) return { amount: null, unit: unit || null };
  const a = Number(amount);
  const pack = product && product.pack;
  if (pack && UNIT_FACTOR[pack.unit] != null) {
    const packBase = Number(pack.amount) * UNIT_FACTOR[pack.unit];
    if (packBase > 0) {
      let base = null;
      if (unit && UNIT_FACTOR[unit] != null) base = a * UNIT_FACTOR[unit];
      else if (!unit || unit === (product.unit || null)) base = a * packBase; // aantal verpakkingen
      if (base != null) {
        const n = Math.max(1, Math.ceil(roundAmt(base) / packBase - 1e-9));
        return { amount: n, unit: product.unit || null };
      }
    }
  }
  if (unit && UNIT_FACTOR[unit] != null) {
    const fam = unit === "g" || unit === "kg" ? "g" : "ml";
    let base = roundAmt(a * UNIT_FACTOR[unit]);
    if (base > 0 && base < 100) base = 100; // nooit < 100 g/ml op de lijst
    return normalizeAmountUnit(base, fam);
  }
  return normalizeAmountUnit(a, unit);
}
export function normalizeProducts(arr) {
  const out = [];
  const seen = new Set();
  (arr || []).forEach((p) => {
    if (!p || !p.name) return;
    const key = productKey(p.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      id: String(p.id || "p" + out.length),
      name: String(p.name).trim(),
      cat: typeof p.cat === "string" && p.cat ? p.cat : "overig",
      market: p.market != null && String(p.market) !== "" ? String(p.market) : null,
      unit: UNITS.includes(p.unit) ? p.unit : (typeof p.unit === "string" && p.unit.trim() ? p.unit.trim().slice(0, 8) : null),
      tags: Array.isArray(p.tags) ? [...new Set(p.tags.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean))] : [], // #37
      pack: normalizePack(p.pack), // #35: inhoud per verpakking (bijv. { amount: 500, unit: "g" } = 1 pot)
      ...(typeof p.updatedAt === "number" ? { updatedAt: p.updatedAt } : {}),
      ...(p.timetag != null ? { timetag: p.timetag } : {}), // #58: timetag bewaren (raw; genormaliseerd bij gebruik via TT)
    });
  });
  return out;
}
// Catalogus opbouwen uit bestaande data (BASE_RECIPES + opgeslagen recepten/voorraad/extra's), met dedup.
export function buildCatalog(stored) {
  const map = new Map();
  const ensure = (name, extra) => {
    const key = productKey(name);
    if (!key) return null;
    let p = map.get(key);
    if (!p) {
      p = { id: "p" + (map.size + 1) + "-" + key.slice(0, 10), name: String(name).trim(), cat: (extra && extra.cat) || "overig", market: (extra && extra.market) || null, unit: (extra && extra.unit) || null };
      map.set(key, p);
    } else if (productKey(p.name) !== p.name.toLowerCase() && productKey(name) === String(name).trim().toLowerCase()) {
      p.name = String(name).trim(); // enkelvoudige vorm als Weergavenaam ("1 ui" wint van "2 uien")
    } else {
      if (extra && extra.cat && p.cat === "overig") p.cat = extra.cat;
      if (extra && extra.market && !p.market) p.market = extra.market;
      if (extra && extra.unit && !p.unit) p.unit = extra.unit;
    }
    return p;
  };
  BASE_RECIPES.forEach((r) => (r.ingredients || []).forEach((s) => { const x = parseIngredientLabel(s); ensure(x.name, { unit: x.unit }); }));
  STOCK_DEFAULT.forEach((s) => ensure(s.name, { cat: s.cat }));
  const recs = stored && Array.isArray(stored.recipes) && stored.recipes.length ? stored.recipes : [];
  recs.forEach((r) => (r.ingredients || []).forEach((ing) => {
    if (typeof ing === "string") { const x = parseIngredientLabel(ing); ensure(x.name, { unit: x.unit }); }
    else if (ing && ing.name) ensure(ing.name, { unit: ing.unit });
  }));
  (stored && Array.isArray(stored.stock) ? stored.stock : []).forEach((s) => { if (s && s.name) ensure(s.name, { cat: s.cat, market: s.market }); });
  normalizeExtras(stored && stored.extraItems).forEach((x) => ensure(x.name, { cat: x.cat || null }));
  return [...map.values()];
}
// Oude string-ingrediënten omzetten naar { pid, amount, unit, name } met koppeling aan de catalogus.
export function migrateRecipesIngredients(recs, catalog) {
  const byKey = new Map(catalog.map((p) => [productKey(p.name), p]));
  return (recs || []).map((r) => ({
    ...r,
    ingredients: (r.ingredients || []).map((ing) => {
      if (typeof ing !== "string") return ing;
      const t = ing.trim();
      if (!t) return null;
      const x = parseIngredientLabel(t);
      const p = byKey.get(productKey(x.name));
      if (!p) return t;
      return { pid: p.id, amount: x.amount, unit: x.unit, name: p.name };
    }).filter(Boolean),
  }));
}
export const pidOfName = (catalog, name) => {
  const p = catalog.find((x) => productKey(x.name) === productKey(name));
  return p ? p.id : null;
};
// Eenheid van een ingrediënt: eigen unit wint; alleen bij ontbrekende key de product-standaard.
export function ingUnit(ing, p) {
  if (!ing || typeof ing !== "object") return "";
  return ("unit" in ing ? ing.unit : p && p.unit) || "";
}
// Weergavetekst van een ingrediënt: "5 paprika's", "1 blik kokosmelk", "200 g sperziebonen", "kokosmelk".
export function ingLabel(ing, prodById) {
  if (typeof ing === "string") return ing;
  if (!ing || typeof ing !== "object") return "";
  const p = ing.pid && prodById ? prodById[ing.pid] : null;
  const name = p ? p.name : ing.name || "";
  if (ing.amount == null || ing.amount === "") return name;
  const unit = ingUnit(ing, p);
  const shown = Number(ing.amount) === 1 ? name : pluralOf(name);
  return [String(ing.amount).replace(".", ","), unit, shown].filter(Boolean).join(" ");
}
export function matchProducts(products, q) {
  const list = products.filter((p) => p.name.toLowerCase().includes(q) || productKey(p.name).includes(q));
  list.sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.name.localeCompare(b.name, "nl");
  });
  return list.slice(0, 6);
}
// Schalen per dag (ADR-012) op het gestructureerde ingrediënt: alleen amount schaalt mee, geen eenheid.
export function scaleIng(ing, factor, prodById) {
  if (typeof ing === "string") return scaleIngredient(ing, factor);
  if (!ing || !Number.isFinite(factor) || factor === 1 || ing.amount == null || ing.amount === "") return null;
  const p = ing.pid && prodById ? prodById[ing.pid] : null;
  const unit = ingUnit(ing, p);
  if (NO_SCALE_UNITS.includes(unit)) return null;
  const scaled = Math.max(1, Math.round(Number(ing.amount) * factor));
  if (scaled === Number(ing.amount)) return null;
  return { ...ing, amount: scaled };
}

// ---- gerecht-invoer met autocomplete (ADR-012) ----
// Suggesties na >= 2 letters; exacte (hoofdletterongevoelige) match wint.

export function matchRecipes(recipes, q) {
  const list = recipes.filter((r) => r.cat !== "extra" && r.name.toLowerCase().includes(q));
  list.sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.name.localeCompare(b.name);
  });
  return list.slice(0, 6);
}

export const NO_SCALE_UNITS = ["blik", "pak", "pakje", "zak", "doos", "fles"];
export function scaleIngredient(label, factor) {
  if (!Number.isFinite(factor) || factor === 1) return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s+([A-Za-z\u00e0-\u00ff]+)(.*)$/.exec(label);
  if (!m) return null;
  if (NO_SCALE_UNITS.includes(m[2].toLowerCase())) return null;
  const num = Number(m[1].replace(",", "."));
  const scaled = Math.max(1, Math.round(num * factor));
  const out = `${scaled} ${m[2]}${m[3]}`;
  return out === label ? null : out;
}
export const fmtFactor = (f) => (Math.round(f * 10) / 10).toString().replace(".", ",");

