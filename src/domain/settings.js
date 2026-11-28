// Per-huishouden instellingen (ADR-009): defaults, thema's en normalisatie.
export const FISH_DAYS = [0, 4]; // standaard vis-dagen, relatief t.o.v. de weekstart
// Boodschappenmomenten (runs) zijn vervallen (ADR-016): de boodschappenlijst is van vandaag
// plus een instelbaar aantal dagen, zonder opgeslagen runs.
export const MARKETS = [
  { key: "ah", label: "Albert Heijn" },
  { key: "jumbo", label: "Jumbo" },
  { key: "lidl", label: "Lidl" },
];

// Categorieën van boodschappenartikelen (ADR-015): een categorie zegt waar een artikel in de
// supermarkt ligt (tortilla/kroepoek horen bij "(maaltijd)saus"). De volgorde is de volgorde
// waarop artikelen op de boodschappenlijst staan.
export const SHOP_CATS_DEFAULT = [
  "fruit", "groente", "vlees/vis", "kruiden", "conserven", "(maaltijd)saus",
  "broodbeleg", "zuivel", "diepvries", "lekkers", "brood",
];

import { isLanguage } from "../i18n/index.js";

// Per-huishouden instellingen (ADR-009). De oude constanten zijn de standaardwaarden.
export const DEFAULT_SETTINGS = {
  householdSize: 4,
  weekStartDay: 0, // index in DAY_NAMES (0 = zaterdag)
  fishDays: [...FISH_DAYS],
  vegaTarget: 2,
  markets: MARKETS.map((m) => ({ ...m, defaultShop: true })),
  shopCats: [...SHOP_CATS_DEFAULT],
  tagRules: [], // #37: [{ kind: "product" | "recipe", tag, days }]
  dishRepeatDays: 7, // #38: aantal dagen wachten voordat een gerecht opnieuw gepland mag (0 = volgende dag mag al)
  takeawayLinks: [], // #42: bestelsites voor afhaalmaaltijd [{ id, label, url }]
  theme: "standaard", // #40: thema/weergave ("standaard" | "donker" | "roze" | "sinterklaas" | "kerstmis")
  language: "nl", // GUI-taal (ADR-023): "nl" | "en" | "fr" | "de"; default Nederlands
};

// #40: thema's — "standaard" is de huidige kleurstelling; donker/roze via CSS-variabelen, de
// feestthema's ook met eigen inline-SVG-achtergrond en eigen tabicoontjes (styles.css)
export const THEMES = [
  { key: "standaard", label: "Standaard", dots: ["#fafaf9", "#ffffff", "#292524"] },
  { key: "donker", label: "Donker", dots: ["#1c1917", "#292524", "#a8a29e"] },
  { key: "roze", label: "Roze", dots: ["#fdf2f8", "#ffffff", "#db2777"] },
  { key: "sinterklaas", label: "\uD83C\uDF81 Sinterklaas", dots: ["#2e1065", "#fbbf24", "#f5f3ff"] },
  { key: "kerstmis", label: "\uD83C\uDF84 Kerstmis", dots: ["#7f1d1d", "#166534", "#fbbf24"] },
];
export const THEME_KEYS = THEMES.map((t) => t.key);
export const THEME_TAB_ICONS = {
  standaard: { menu: "\uD83D\uDCC5", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83D\uDED2", settings: "\u2699\uFE0F" },
  sinterklaas: { menu: "\uD83C\uDF81", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83D\uDED2", settings: "\uD83C\uDF85" },
  kerstmis: { menu: "\uD83C\uDF84", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83C\uDF81", settings: "\u2699\uFE0F" },
};
export const THEME_META = { standaard: "#059669", donker: "#1c1917", roze: "#db2777", sinterklaas: "#2e1065", kerstmis: "#7f1d1d" };


export function normalizeDayList(arr, fallback) {
  if (!Array.isArray(arr)) return [...fallback];
  return [...new Set(arr.filter((n) => Number.isInteger(n) && n >= 0 && n < 7).map(Number))];
}

export function normalizeSettings(s) {
  const d = DEFAULT_SETTINGS;
  const src = s && typeof s === "object" ? s : {};
  const out = { ...d, ...src };
  out.householdSize = Math.max(1, Math.floor(Number(out.householdSize) > 0 ? Number(out.householdSize) : d.householdSize));
  out.weekStartDay = Math.min(6, Math.max(0, Math.floor(Number(out.weekStartDay) || 0)));
  out.fishDays = normalizeDayList(out.fishDays, d.fishDays);
  delete out.shopRuns; // boodschappenmomenten worden niet meer in de app opgeslagen (ADR-016)
  out.vegaTarget = Math.max(0, Math.floor(Number(out.vegaTarget) || 0));
  const mkts = Array.isArray(out.markets) && out.markets.length ? out.markets : d.markets;
  out.markets = mkts
    .map((m) => ({
      key: String(m && m.key != null ? m.key : "").trim().toLowerCase(),
      label: String(m && m.label != null ? m.label : ""),
      defaultShop: !m || m.defaultShop !== false, // default geselecteerd op de boodschappenlijst (ADR-016)
    }))
    .filter((m) => m.key)
    .filter((m, i, arr) => arr.findIndex((x) => x.key === m.key) === i);
  if (!out.markets.length) out.markets = d.markets.map((m) => ({ ...m }));
  const cats = Array.isArray(out.shopCats) && out.shopCats.length ? out.shopCats : d.shopCats;
  out.shopCats = [...new Set(cats.map((c) => String(c == null ? "" : c).trim().toLowerCase()).filter(Boolean))];
  if (!out.shopCats.length) out.shopCats = [...d.shopCats];
  // #37: tag-regels normaliseren (kind, lowercase tag, dagen 0..30, dedup per kind+tag)
  out.tagRules = (Array.isArray(out.tagRules) ? out.tagRules : [])
    .map((r) => ({
      kind: r && r.kind === "recipe" ? "recipe" : "product",
      tag: String((r && r.tag) || "").trim().toLowerCase(),
      days: Math.min(30, Math.max(0, Math.floor(Number((r && r.days) || 0)))),
    }))
    .filter((r) => r.tag)
    .filter((r, i, arr) => arr.findIndex((x) => x.kind === r.kind && x.tag === r.tag) === i);
  // #38: herhaalregel per gerecht (0..30, standaard 7 = niet vaker dan 1× per week)
  out.dishRepeatDays = Math.min(30, Math.max(0, Math.floor(Number(out.dishRepeatDays) || 0)));
  // #42: afhaal-linkjes (bestelsites) — label/url trimmen; lege rijen (beide leeg) vallen weg
  out.takeawayLinks = (Array.isArray(out.takeawayLinks) ? out.takeawayLinks : [])
    .map((l, i) => ({
      id: String((l && l.id) || "tl-" + i),
      label: String((l && l.label) || "").trim(),
      url: String((l && l.url) || "").trim(),
    }))
    .filter((l) => l.label || l.url);
  out.theme = THEME_KEYS.includes(out.theme) ? out.theme : d.theme; // #40: ongeldige waarde -> standaard
  out.language = isLanguage(out.language) ? out.language : d.language; // ADR-023: ongeldige/ontbrekende taal -> nl
  return out;
}
