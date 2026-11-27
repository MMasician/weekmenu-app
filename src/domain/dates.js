// Datumhelpers voor de kalender: datum-sleutel YYYY-MM-DD (lokaal, zonder tijd).
// Dag- en maandnamen komen per taal uit de i18n-laag (src/i18n).
import { dayNames, monthNamesShort, t } from "../i18n/index.js";

export const pad2 = (n) => String(n).padStart(2, "0");
export const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const fmtDay = (k) => `${k.slice(8)}-${k.slice(5, 7)}`; // "YYYY-MM-DD" -> "DD-MM"
export const dayShortOf = (k) =>
  dayNames()[(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))).getDay() + 1) % 7]
    .slice(0, 2)
    .toLowerCase(); // "YYYY-MM-DD" -> "vr"
export const fmtShort = (d) => `${d.getDate()} ${monthNamesShort()[d.getMonth()]}`;
export const jsDayOf = (weekStartDay) => (weekStartDay + 6) % 7; // DAY_NAMES-index (0 = zaterdag) -> Date.getDay()
export function startOfWeek(date, weekStartDay) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() - jsDayOf(weekStartDay) + 7) % 7));
  return d;
}
export function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}
// startdatum (lokaal, middernacht) van de week op `offset` weken t.o.v. de huidige week
export function weekStartFor(weekStartDay, offset) {
  return addDays(startOfWeek(new Date(), weekStartDay), offset * 7);
}
export function weekDateKeys(weekStartDay, offset) {
  const start = weekStartFor(weekStartDay, offset);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
}
// "hoelang geleden" voor een datum-sleutel (ADR-018): null -> "Onbekend"
export function agoLabel(isoKey, todayK) {
  if (!isoKey) return t("Onbekend");
  const p = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const days = Math.round((p(todayK).getTime() - p(isoKey).getTime()) / 86400000);
  if (days <= 0) return t("vandaag");
  if (days === 1) return t("gisteren");
  if (days < 7) return t("{n} dagen geleden", { n: days });
  if (days < 56) return t("{n} wk geleden", { n: Math.floor(days / 7) });
  if (days < 365) return t("{n} mnd geleden", { n: Math.floor(days / 30) });
  return t("{n} jr geleden", { n: Math.floor(days / 365) });
}
// aantal weken tussen de week van fromDate en de week van toDate
export function weeksBetween(fromDate, toDate, weekStartDay) {
  return Math.round((startOfWeek(toDate, weekStartDay).getTime() - startOfWeek(fromDate, weekStartDay).getTime()) / (7 * 24 * 3600 * 1000));
}
// maandrooster voor de kalender; kolommen starten op de ingestelde weekstart
export function monthGrid(year, month, weekStartDay) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let cursor = startOfWeek(first, weekStartDay);
  const weeks = [];
  for (;;) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push({ date: new Date(cursor), key: dateKey(cursor), inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
    if (cursor.getTime() > last.getTime()) break;
  }
  return weeks;
}

