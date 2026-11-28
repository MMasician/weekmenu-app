// Voorraadmodel (ADR-015): locaties, standaardvoorraad en normalisatie.
// Voorraad (ADR-015): per-huishouden locaties; per product een locatie, categorie (shopCats),
// optionele winkelvoorkeur (marketKey uit settings.markets) en have/want.
export const DEFAULT_LOCATIONS = [
  { id: "loc-kast", name: "Voorraadkast" },
  { id: "loc-koel", name: "Koelkast" },
  { id: "loc-vriezer", name: "Vriezer" },
  { id: "loc-kruiden", name: "Kruidenla" },
  { id: "loc-fruit", name: "Fruitschaal" },
];
// Migratie van het oude model, waarin `cat` de locatie was (kast/koel/fruit/kruiden).
export const OLD_LOC_BY_CAT = { kast: "loc-kast", koel: "loc-koel", fruit: "loc-fruit", kruiden: "loc-kruiden" };
export const OLD_CAT_BY_CAT = { kast: "conserven", koel: "zuivel", fruit: "fruit", kruiden: "kruiden" };
export const STOCK_DEFAULT = [
  { name: "Hagelslag", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Pindakaas", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Jam", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Koffie", loc: "loc-kast", cat: "lekkers", qty: 1 },
  { name: "Thee", loc: "loc-kast", cat: "lekkers", qty: 1 },
  { name: "Olijfolie", loc: "loc-kast", cat: "conserven", qty: 1 },
  { name: "Rijst", loc: "loc-kast", cat: "conserven", qty: 1 },
  { name: "Melk", loc: "loc-koel", cat: "zuivel", qty: 2 },
  { name: "Boter", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Kaas", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Eieren", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Yoghurt", loc: "loc-koel", cat: "zuivel", qty: 2 },
  { name: "Diepvrieserwten", loc: "loc-vriezer", cat: "diepvries", qty: 1 },
  { name: "Zout", loc: "loc-kruiden", cat: "kruiden", qty: 1 },
  { name: "Peper", loc: "loc-kruiden", cat: "kruiden", qty: 1 },
  { name: "Appels", loc: "loc-fruit", cat: "fruit", qty: 4 },
  { name: "Bananen", loc: "loc-fruit", cat: "fruit", qty: 3 },
];
export function defaultStock() {
  return STOCK_DEFAULT.map((d) => ({ name: d.name, loc: d.loc, cat: d.cat, market: null, want: d.qty, have: d.qty }));
}
export function normalizeLocations(arr) {
  const out = (Array.isArray(arr) ? arr : [])
    .filter((l) => l && l.id && String(l.name).trim())
    .map((l) => ({ id: String(l.id), name: String(l.name), ...(typeof l.updatedAt === "number" ? { updatedAt: l.updatedAt } : {}) }));
  return out.length ? out : DEFAULT_LOCATIONS.map((l) => ({ ...l }));
}
export function normalizeStock(arr, locs) {
  const locIds = new Set((locs || DEFAULT_LOCATIONS).map((l) => l.id));
  return (arr || [])
    .filter((s) => s && s.name)
    .map((s) => {
      const loc = locIds.has(s.loc) ? s.loc : OLD_LOC_BY_CAT[s.cat] || "loc-kast";
      const cat = (locIds.has(s.loc) ? (typeof s.cat === "string" && s.cat ? s.cat : "conserven") : OLD_CAT_BY_CAT[s.cat] || "conserven").trim().toLowerCase();
      return {
        name: String(s.name),
        loc,
        cat,
        market: s.market != null && String(s.market) !== "" ? String(s.market) : null,
        want: Math.max(0, Math.floor(Number(s.want ?? s.qty ?? 1) || 0)),
        have: Math.max(0, Math.floor(Number(s.have ?? (s.qty === 0 ? 0 : s.want ?? s.qty ?? 1)) || 0)),
        ...(typeof s.updatedAt === "number" ? { updatedAt: s.updatedAt } : {}),
      };
    });
}
export function normalizeExtras(arr) {
  return (arr || [])
    .map((x) => (typeof x === "string"
      ? { name: x, cat: "" }
      : { name: String((x && x.name) || ""), cat: String((x && x.cat) || "").trim().toLowerCase(), amount: x && x.amount != null ? x.amount : undefined, unit: x && x.unit ? x.unit : null, ...(x && typeof x.updatedAt === "number" ? { updatedAt: x.updatedAt } : {}) }))
    .filter((x) => x.name);
}
