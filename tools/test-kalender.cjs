// Tests voor de kalender in het weekmenu (zie docs/SPECS.md "Weekmenu"):
// - bij openen start de app in de huidige week, met vandaag gehighlight (daglijst + kalender)
// - weeknavigatie: 1 of meer weken terug/vooruit via knoppen en via klikken op een kalenderdag
// - vergrendelde gerechten worden per datum opgeslagen (menuByDate) en zijn op die datum later terug te vinden
// - migratie van oude `menu`-array naar menuByDate (ADR-005)
// - de boodschappenlijst volgt de getoonde week
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

// Datumhelpers (zelfde algoritme als in src/App.jsx).
const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const jsDayOf = (w) => (w + 6) % 7;
function startOfWeek(date, w) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() - jsDayOf(w) + 7) % 7));
  return d;
}
function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
function weekKeysFor(w, offset) {
  const s = addDays(startOfWeek(new Date(), w), offset * 7);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(s, i)));
}
const dayShort = (k) => `${k.slice(8)}-${k.slice(5, 7)}`;

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

function make(seed) {
  const m = loadApp(APP, seed);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const findTab = (label) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "button" && n.children && String(n.children[0]).indexOf(label) === 0) found = n; });
    return found;
  };
  const findButton = (text) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "button" && JSON.stringify(n.children).indexOf(text) !== -1) found = n; });
    return found;
  };
  const settingsState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x && "shopRuns" in x);
  const offsetState = () => m.hooks.state.find((x) => typeof x === "number");
  const menuByDateState = () =>
    m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && Object.values(x).some((v) => v && typeof v === "object" && "id" in v));
  const weekStartDay = () => (settingsState() || {}).weekStartDay || 0;
  const weekEntries = () => {
    const keys = weekKeysFor(weekStartDay(), offsetState() || 0);
    const mbd = menuByDateState() || {};
    return keys.map((k) => mbd[k] || null);
  };
  const dayCells = () => {
    const out = [];
    walk(render(), (n) => {
      if (n && n.type === "div" && n.props && String(n.props.className || "").indexOf("w-20 shrink-0") !== -1) out.push(n);
    });
    return out;
  };
  const dayDates = () => dayCells().map((c) => (c.children[1] && c.children[1].children ? c.children[1].children.join("") : ""));
  const calCells = () => {
    const out = [];
    walk(render(), (n) => { if (n && n.type === "button" && n.props && n.props["data-date"]) out.push(n); });
    return out;
  };
  const lockButtons = () => {
    const out = [];
    walk(render(), (n) => {
      if (n && n.type === "button" && n.props && (n.props.title === "Vergrendelen" || n.props.title === "Ontgrendelen")) out.push(n);
    });
    return out;
  };
  const openDateSheet = () => {
    const b = findButton("Kies een datum");
    if (b) b.props.onClick();
  };
  render();
  return { m, render, walk, findTab, findButton, openDateSheet, settingsState, menuByDateState, weekEntries, weekStartDay, dayDates, calCells, lockButtons, html: () => JSON.stringify(serialize(render())) };
}

// 1. Bij openen start het weekmenu in de huidige week; vandaag is gehighlight.
{
  const t = make({});
  const w = t.weekStartDay();
  const keys = weekKeysFor(w, 0);
  const today = dateKey(new Date());
  const dates = t.dayDates();
  check("bij openen toont de week de 7 datums van de huidige week", dates.length === 7 && dates.every((d, i) => d.slice(0, 5) === dayShort(keys[i])));
  check("vandaag gemarkeerd in de daglijst", dates[keys.indexOf(today)].indexOf("vandaag") !== -1);
  check("weekmenu-tab toont alleen vandaag + knop 'Kies een datum'", !!t.findButton("Kies een datum"));
  check("zonder sheet geen kalendercellen op de tab", t.calCells().length === 0);
  t.openDateSheet();
  const cells = t.calCells();
  const inWeekCells = cells.filter((c) => keys.indexOf(c.props["data-date"]) !== -1);
  const todayCell = cells.find((c) => c.props["data-date"] === today);
  check("alle 7 dagen van de week in de kalender gemarkeerd", inWeekCells.length === 7);
  check("vandaag gehighlight in de kalender (bg-emerald-600)", !!todayCell && String(todayCell.props.className).indexOf("bg-emerald-600") !== -1);
  check("weekknoppen aanwezig in de datum-sheet (vorige/volgende week)", !!t.findButton("Vorige week") && !!t.findButton("Volgende week"));
  check("bij offset 0 geen 'Naar deze week'-knop", !t.findButton("Naar deze week"));
  let backdrop = /** @type {any} */ (null);
  t.walk(t.render(), (n) => { if (n && n.type === "div" && n.props.className === "backdrop") backdrop = n; });
  backdrop.props.onClick();
  check("backdrop sluit de datum-sheet (geen kalender meer op de tab)", t.calCells().length === 0);
}

// 2. Weeknavigatie: 1 of meer weken vooruit en terug.
{
  const t = make({});
  const w = t.weekStartDay();
  t.openDateSheet();
  t.findButton("Volgende week").props.onClick();
  t.findButton("Volgende week").props.onClick();
  let keys = weekKeysFor(w, 2);
  let dates = t.dayDates();
  check("+2 weken: dagdatums schuiven 14 dagen op", dates.length === 7 && dates.every((d, i) => d.slice(0, 5) === dayShort(keys[i])));
  check("bij offset ongelijk 0 verschijnt 'Naar deze week'", !!t.findButton("Naar deze week"));
  t.findButton("Vorige week").props.onClick();
  t.findButton("Vorige week").props.onClick();
  t.findButton("Vorige week").props.onClick();
  keys = weekKeysFor(w, -1);
  dates = t.dayDates();
  check("3x terug vanaf +2 = -1 week: dagdatums kloppen", dates.length === 7 && dates.every((d, i) => d.slice(0, 5) === dayShort(keys[i])));
  t.findButton("Naar deze week").props.onClick();
  keys = weekKeysFor(w, 0);
  dates = t.dayDates();
  check("'Naar deze week' zet terug naar de huidige week", dates.length === 7 && dates.every((d, i) => d.slice(0, 5) === dayShort(keys[i])));
  check("bij offset 0 weer geen 'Naar deze week'-knop", !t.findButton("Naar deze week"));
}

// 3. Klikken op een kalenderdag springt naar de week van die dag.
{
  const t = make({});
  const w = t.weekStartDay();
  const start = startOfWeek(new Date(), w);
  t.openDateSheet();
  const calMonth = addDays(start, 3).getMonth();
  const target = [addDays(start, 7), addDays(start, -7)].find((d) => d.getMonth() === calMonth);
  const cell = t.calCells().find((c) => c.props["data-date"] === dateKey(target));
  check("kalendercel voor een dag in week +/-1 gevonden", !!cell);
  cell.props.onClick();
  const expected = weekKeysFor(w, target > start ? 1 : -1);
  const dates = t.dayDates();
  check("na klik op kalenderdag toont de daglijst die week", dates.length === 7 && dates.every((d, i) => d.slice(0, 5) === dayShort(expected[i])));
}

// 4. Vergrendeld gerecht wordt per datum opgeslagen en is op die datum terug te vinden.
{
  const t = make({});
  const w = t.weekStartDay();
  const keys = weekKeysFor(w, 0);
  t.findButton("Genereer weekmenu").props.onClick();
  t.openDateSheet();
  const locks = t.lockButtons();
  check("7 vergrendelknoppen na genereren", locks.length === 7);
  locks[2].props.onClick();
  const mbd = t.menuByDateState();
  check("vergrendeld gerecht opgeslagen onder de datum van dag 2", !!mbd[keys[2]] && mbd[keys[2]].locked === true && !!mbd[keys[2]].id);
  check("dag toont na vergrendelen 'Ontgrendelen'", t.lockButtons()[2].props.title === "Ontgrendelen");
  t.findButton("Volgende week").props.onClick();
  t.findButton("Volgende week").props.onClick();
  check("twee weken verder is de getoonde week leeg", t.weekEntries().every((e) => e === null));
  t.findButton("Vorige week").props.onClick();
  t.findButton("Vorige week").props.onClick();
  const back = t.weekEntries();
  check("terug in de week staat het vergrendelde gerecht er weer", !!back[2] && back[2].locked === true && back[2].id === mbd[keys[2]].id);
  const cell = t.calCells().find((x) => x.props["data-date"] === keys[2]);
  check("kalendercel van die datum toont een slotje", !!cell && JSON.stringify(serialize(cell)).indexOf("🔒") !== -1);
}

// 5. Later terugvinden op een datum in het verleden: nieuwe app-instance met opgeslagen menuByDate.
{
  const w = 0;
  const pastKeys = weekKeysFor(w, -3);
  const pastDate = pastKeys[4];
  const t = make({ menuByDate: { [pastDate]: { id: "r25", locked: true } } });
  t.openDateSheet();
  t.findButton("Vorige week").props.onClick();
  t.findButton("Vorige week").props.onClick();
  t.findButton("Vorige week").props.onClick();
  const entries = t.weekEntries();
  check("3 weken terug: vergrendeld gerecht staat op die datum", !!entries[4] && entries[4].id === "r25" && entries[4].locked === true);
  const h = t.html();
  check("receptnaam zichtbaar in de daglijst", h.indexOf("Thaise viscurry") !== -1);
  check("kalender van die maand toont een slotje", h.indexOf("🔒") !== -1);
}

// 6. Week genereren behoudt vergrendelde datums van de getoonde week.
{
  const w = 0;
  const keys = weekKeysFor(w, 0);
  const t = make({ menuByDate: { [keys[3]]: { id: "r25", locked: true } } });
  t.findButton("Genereer weekmenu").props.onClick();
  const mbd = t.menuByDateState();
  check("vergrendelde datum blijft staan bij genereren", !!mbd[keys[3]] && mbd[keys[3]].id === "r25" && mbd[keys[3]].locked === true);
  const filled = keys.map((k) => mbd[k] || null).filter(Boolean).length;
  check("alle 7 dagen van de week gevuld na genereren", filled === 7);
}

// 7. Migratie van oude state (menu-array + vinkjes op dagindex) naar menuByDate (ADR-005).
{
  const w = 0;
  const keys = weekKeysFor(w, 0);
  const t = make({
    menu: [null, { id: "r21", locked: true }, null, null, null, null, null],
    checked: { "1-r21-Gerookte makreel": true, "extra-Chips": true },
  });
  const mbd = t.menuByDateState();
  check("oude menu-array gemigreerd naar de datum van de huidige week", !!mbd[keys[1]] && mbd[keys[1]].id === "r21" && mbd[keys[1]].locked === true);
  const checkedState = t.m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "extra-Chips" in x);
  check("vinkjes gemigreerd naar datum-sleutel", !!checkedState && checkedState[`${keys[1]}-r21-Gerookte makreel`] === true && checkedState["extra-Chips"] === true);
  check("gemigreerd gerecht zichtbaar in de daglijst (r21 in het invoerveld)", t.html().indexOf("Burritobowl met tonijn") !== -1);
}

// 8. De boodschappenlijst volgt de getoonde week.
{
  const w = 0;
  const keys = weekKeysFor(w, 0);
  const t = make({ menuByDate: { [keys[0]]: { id: "r25", locked: true } } });
  t.findTab("Boodschappen").props.onClick();
  let h = t.html();
  check("huidige week: boodschappenlijst toont het gerecht van die datum", h.indexOf("Boodschappenlijst zaterdag") !== -1 && h.indexOf("Thaise viscurry") !== -1);
  t.findTab("Weekmenu").props.onClick();
  t.openDateSheet();
  t.findButton("Volgende week").props.onClick();
  t.findTab("Boodschappen").props.onClick();
  h = t.html();
  check("volgende week zonder menu: lege boodschappenlijst", h.indexOf("Stel eerst een weekmenu samen") !== -1 && h.indexOf("Thaise viscurry") === -1);
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
