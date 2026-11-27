// i18n-laag: GUI-teksten per taal. De Nederlandse tekst is de sleutel (natural keys);
// vertalingen staan in nl.js / en.js / fr.js / de.js. Ontbreekt een sleutel in de actieve
// taal, dan valt t() terug op het Nederlands en uiteindelijk op de sleutel zelf.
import nl from "./nl.js";
import en from "./en.js";
import fr from "./fr.js";
import de from "./de.js";

export const LANGUAGES = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];
export const DEFAULT_LANGUAGE = "nl";

const DICTS = { nl, en, fr, de };
let current = DEFAULT_LANGUAGE;

export function isLanguage(lang) {
  return Object.prototype.hasOwnProperty.call(DICTS, lang);
}
export function setLanguage(lang) {
  if (isLanguage(lang)) current = lang;
}
export function getLanguage() {
  return current;
}

// t("Tekst met {plaatsaanduiding}", { plaatsaanduiding: waarde }) -> vertaalde string
export function t(key, vars) {
  const dict = DICTS[current];
  let s = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
  if (s == null && current !== DEFAULT_LANGUAGE) s = nl[key];
  if (s == null) s = key;
  if (typeof s !== "string") return s;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

// Dagnamen/maandnamen per taal (kalender en weekmenu)
export function dayNames() {
  return (DICTS[current] && DICTS[current].days) || nl.days;
}
export function monthNames() {
  return (DICTS[current] && DICTS[current].months) || nl.months;
}
export function monthNamesShort() {
  return (DICTS[current] && DICTS[current].monthsShort) || nl.monthsShort;
}
