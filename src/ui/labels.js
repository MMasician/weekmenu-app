// Presentatiemaps voor categorie- en tijdlabels (ADR-013/ADR-018).
// Labels zijn vertaalbaar (ADR-023): CAT_LABEL/TIME_LABEL geven per sleutel de t()-waarde,
// zodat de actieve GUI-taal pas bij lezing wordt opgezocht.
import { t } from "../i18n/index.js";

export const CAT_LABEL = new Proxy({}, { get: (_, k) => t("cat." + String(k)) });
export const CAT_STYLE = {
  vega: "bg-green-100 text-green-800",
  vis: "bg-blue-100 text-blue-800",
  vlees: "bg-red-100 text-red-800",
  extra: "bg-amber-100 text-amber-800",
};
// Bereidingstijd als categorie (ADR-013): kort / normaal / lang ipv minuten.
export const TIME_LABEL = new Proxy({}, { get: (_, k) => t("time." + String(k)) });
export const timeLabelCap = (tc) => {
  const s = t("time." + tc);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
export const TIME_STYLE = {
  kort: "bg-emerald-100 text-emerald-700",
  normaal: "bg-stone-100 text-stone-500",
  lang: "bg-amber-100 text-amber-700",
};
