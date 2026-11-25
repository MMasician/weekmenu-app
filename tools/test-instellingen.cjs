// Test van per-huishouden instellingen (ADR-009): defaults, normalisatie, weekmenu, boodschappenruns, winkels.
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

// Datumhelpers (zelfde algoritme als in src/App.jsx) om de getoonde week te berekenen.
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
    walk(render(), (n) => { if (n && n.type === "button" && String(n.props["aria-label"] || n.props.title || "").indexOf(label) === 0) found = n; });
    return found;
  };
  const findButton = (text) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "button" && JSON.stringify(n.children).indexOf(text) !== -1) found = n; });
    return found;
  };
  const menuByDateState = () =>
    m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && Object.values(x).some((v) => v && typeof v === "object" && "id" in v));
  const offsetState = () => m.hooks.state.find((x) => typeof x === "number");
  const menuState = () => {
    // weekmenu per datum: de 7 entries van de getoonde week
    const w = (settingsState() || {}).weekStartDay || 0;
    const keys = weekKeysFor(w, offsetState() || 0);
    const mbd = menuByDateState() || {};
    return keys.map((k) => mbd[k] || null);
  };
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length > 0 && x[0] && x[0].cat);
  const settingsState = () =>
    m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x);
  const catOf = (id) => ((recipesState() || []).find((r) => r.id === id) || {}).cat;
  const dayLabels = () => {
    const out = [];
    walk(render(), (n) => {
      if (n && n.type === "div" && n.props && String(n.props.className || "").indexOf("w-20 shrink-0") !== -1) {
        const inner = n.children[0];
        out.push(inner && inner.children ? inner.children[0] : n.children[0]);
      }
    });
    return out;
  };
  return { m, render, walk, findTab, findButton, menuState, settingsState, catOf, dayLabels, html: () => JSON.stringify(serialize(render())) };
}

// 1. Defaults bij lege opslag
{
  const t = make({});
  const h = t.html();
  check("tab Instellingen aanwezig", !!t.findTab("Instellingen"));
  check("standaard 4 eters in header", h.indexOf("4 eters") !== -1);
  check("standaard weekstart Zaterdag als eerste dag", t.dayLabels()[0] === "Zaterdag");
  t.findButton("Genereer weekmenu").props.onClick();
  const menu = t.menuState();
  check("standaard vis op dag 0 en 4", t.catOf(menu[0].id) === "vis" && t.catOf(menu[4].id) === "vis");
  const cats = [1, 2, 3, 5, 6].map((d) => t.catOf(menu[d].id));
  check("standaard 2 vega / 3 vlees op overige dagen", cats.filter((c) => c === "vega").length === 2 && cats.filter((c) => c === "vlees").length === 3);
  const st = t.settingsState();
  check("settings genormaliseerd naar defaults", !!st && st.householdSize === 4 && st.weekStartDay === 0 &&
    JSON.stringify(st.fishDays) === "[0,4]" && st.vegaTarget === 2 && st.markets.length === 3 &&
    st.markets.every((m) => m.defaultShop === true) && !("shopRuns" in st));
}

// 2. Aangepaste instellingen uit localStorage: weekmenu, runs en winkels volgen
{
  const seed = {
    settings: {
      householdSize: 6,
      weekStartDay: 2, // week start op maandag
      fishDays: [1, 5],
      vegaTarget: 3,
      shopRuns: [{ label: "Run A", days: [0, 1, 2] }, { label: "Run B", days: [3, 4, 5, 6] }],
      markets: [{ key: "ah", label: "Albert Heijn" }, { key: "plus", label: "Plus" }],
    },
    menu: Array(7).fill(null),
    extraItems: [],
    prices: {},
  };
  const t = make(seed);
  const h = t.html();
  check("aantal eters 6 in header", h.indexOf("6 eters") !== -1);
  check("weekstart maandag als eerste dag", t.dayLabels()[0] === "Maandag" && t.dayLabels()[6] === "Zondag");
  t.findButton("Genereer weekmenu").props.onClick();
  const menu = t.menuState();
  check("vis op ingestelde dagen 1 en 5", t.catOf(menu[1].id) === "vis" && t.catOf(menu[5].id) === "vis");
  const cats = [0, 2, 3, 4, 6].map((d) => t.catOf(menu[d].id));
  check("vegaTarget 3 -> 3 vega / 2 vlees op overige dagen", cats.filter((c) => c === "vega").length === 3 && cats.filter((c) => c === "vlees").length === 2);

  // seed bevat expres nog shopRuns + prices: die worden genegeerd (ADR-016)
  t.findTab("Boodschappen").props.onClick();
  const sh = t.html();
  check("geen run-labels meer op de boodschappenlijst (Run A/Run B uit seed genegeerd)", sh.indexOf("Run A") === -1 && sh.indexOf("Run B") === -1);
  check("geen Prijzen-tab meer", !t.findTab("Prijzen"));
  t.findTab("Instellingen").props.onClick();
  const ih = t.html();
  check("Instellingen: geen 'Boodschappenmomenten'-sectie meer", ih.indexOf("Boodschappenmomenten") === -1);
  check("Instellingen: 'Supermarkten' met per winkel 'standaard'", ih.indexOf("Supermarkten") !== -1 && ih.indexOf("standaard") !== -1);

  const st = t.settingsState();
  check("settings persisted in state (shopRuns weg, defaultShop aangevuld)", !!st && st.householdSize === 6 && st.weekStartDay === 2 &&
    st.markets.map((m) => m.key).join(",") === "ah,plus" && st.markets.every((m) => m.defaultShop === true) && !("shopRuns" in st));
}

// 3. Normalisatie: onvolledige settings + oude mix wordt genegeerd; vergrendelde dag blijft staan
{
  const seed = {
    settings: { householdSize: 9 },
    mix: { vega: 5, vlees: 0 }, // oud veld zonder settings -> defaults (ADR-009)
    menu: [null, null, null, null, { id: "r25", locked: true }, null, null],
    extraItems: [],
    prices: {},
  };
  const t = make(seed);
  const h = t.html();
  check("gedeeltelijke settings aangevuld: 9 eters", h.indexOf("9 eters") !== -1);
  check("weekstart default (Zaterdag)", t.dayLabels()[0] === "Zaterdag");
  t.findButton("Genereer weekmenu").props.onClick();
  const menu = t.menuState();
  check("vergrendelde dag 4 blijft r25", !!menu[4] && menu[4].id === "r25" && menu[4].locked === true);
  check("default vis op dag 0", t.catOf(menu[0].id) === "vis");
  const cats = [1, 2, 3, 5, 6].map((d) => t.catOf(menu[d].id));
  check("oude mix genegeerd: default 2 vega / 3 vlees op overige dagen", cats.filter((c) => c === "vega").length === 2 && cats.filter((c) => c === "vlees").length === 3);
  const st = t.settingsState();
  check("vegaTarget default 2 (niet 5 uit oude mix)", !!st && st.vegaTarget === 2);
}

// 4. Wijzigingen via de Instellingen-tab gelden direct
{
  const t = make({});
  t.findTab("Instellingen").props.onClick();
  let weekSel = /** @type {any} */ (null);
  t.walk(t.render(), (n) => {
    if (n && n.type === "select" && !weekSel) weekSel = n; // in de Instellingen-tab is dit de weekstart-select
  });
  check("weekstart-select gevonden", !!weekSel);
  weekSel.props.onChange({ target: { value: "2" } });
  let st = t.settingsState();
  check("weekStartDay=2 doorgevoerd in state", !!st && st.weekStartDay === 2);
  t.findTab("Weekmenu").props.onClick();
  check("menu toont week vanaf maandag", t.dayLabels()[0] === "Maandag" && t.dayLabels()[6] === "Zondag");

  t.findTab("Instellingen").props.onClick();
  let vegaInput = /** @type {any} */ (null);
  t.walk(t.render(), (n) => {
    if (n && n.type === "input" && n.props.type === "number" && String(n.props.max) === "7") vegaInput = n;
  });
  check("vegaTarget-input gevonden met default 2", !!vegaInput && vegaInput.props.value === 2);
  vegaInput.props.onChange({ target: { value: "4" } });
  t.findTab("Weekmenu").props.onClick();
  t.findButton("Genereer weekmenu").props.onClick();
  const menu = t.menuState();
  const cats = [1, 2, 3, 5, 6].map((d) => t.catOf(menu[d].id));
  check("na vegaTarget=4: 4 vega / 1 vlees", cats.filter((c) => c === "vega").length === 4 && cats.filter((c) => c === "vlees").length === 1);
}


// ---------- #44: productcatalogus inklapbaar (accordion) + A-Z + categorie-chips (versie D) ----------
{

  const t = make({
    products: [
      { id: "p1", name: "Zebra", cat: "overig", market: null, unit: null, tags: [], pack: null },
      { id: "p2", name: "Aap", cat: "overig", market: null, unit: null, tags: [], pack: null },
      { id: "p3", name: "Middel", cat: "zuivel", market: null, unit: "pot", tags: [], pack: null },
    ],
    recipes: [],
  });
  t.findTab("Instellingen").props.onClick();
  let h = t.html();
  check("#44: accordion-rij 'Productcatalogus' met teller en ▸", h.indexOf("Productcatalogus") !== -1 && h.indexOf("▸") !== -1 && h.indexOf("3") !== -1);
  check("#44: initieel ingeklapt — geen prodlink-rijen zichtbaar", !t.walk ? false : (() => { let n = 0; t.walk(t.render(), (x) => { if (x && x.props && x.props.className === "prodlink") n++; }); return n === 0; })());
  const catBtn = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "button" && String(n.props.title || "").indexOf("Productcatalogus in-/uitklappen") !== -1) f = n; }); return f; })();
  catBtn.props.onClick();
  h = t.html();
  const names = [];
  t.walk(t.render(), (n) => { if (n && n.props && n.props.className === "prodlink") names.push(n.children[0]); });
  check("#44: uitgeklapt is de lijst alfabetisch A–Z (Aap, Middel, Zebra)", JSON.stringify(names) === JSON.stringify(["Aap", "Middel", "Zebra"]));
  check("#44: teller '3 van 3 producten · A–Z'", /3," van ",3," producten · A–Z"/.test(h));
  // categorie-chip filter (versie D): klik 'zuivel' -> alleen Middel
  const chipZuivel = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "button" && String(n.props.className || "").indexOf("chip") !== -1 && n.children && n.children[0] === "zuivel") f = n; }); return f; })();
  check("#44: categorie-chip 'zuivel' aanwezig", !!chipZuivel);
  chipZuivel.props.onClick();
  const names2 = [];
  t.walk(t.render(), (n) => { if (n && n.props && n.props.className === "prodlink") names2.push(n.children[0]); });
  h = t.html();
  check("#44: na categorie-filter 'zuivel' alleen Middel zichtbaar + teller '1 van 3'", JSON.stringify(names2) === JSON.stringify(["Middel"]) && /1," van ",3," producten · A–Z"/.test(h));
  chipZuivel.props.onClick(); // weer uit
  // zoekveld filtert binnen de A–Z lijst
  const search = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "input" && String(n.props.placeholder || "").indexOf("Zoek product") !== -1) f = n; }); return f; })();
  search.props.onChange({ target: { value: "aap" } });
  const names3 = [];
  t.walk(t.render(), (n) => { if (n && n.props && n.props.className === "prodlink") names3.push(n.children[0]); });
  check("#44: zoekveld filtert (alleen 'Aap')", JSON.stringify(names3) === JSON.stringify(["Aap"]));
}

// ---------- #42: afhaalmaaltijden (bestelsites) in Instellingen ----------
{
  const t = make({});
  t.render();
  check("#42: takeawayLinks default leeg in settings", Array.isArray((t.settingsState() || {}).takeawayLinks) && t.settingsState().takeawayLinks.length === 0);
  t.findTab("Instellingen").props.onClick();
  let h = t.html();
  check("#42: kaart 'Afhaalmaaltijden (bestelsites)' aanwezig", h.indexOf("Afhaalmaaltijden") !== -1);
  const addBtn = t.findButton("+ Bestelsite toevoegen");
  check("#42: knop '+ Bestelsite toevoegen'", !!addBtn);
  addBtn.props.onClick();
  let st = t.settingsState();
  check("#42: lege bestelsite-rij toegevoegd aan settings.takeawayLinks", st.takeawayLinks.length === 1);
  // label/url bewerken
  const inputs = [];
  t.walk(t.render(), (n) => {
    if (n && n.type === "input") {
      const ph = String(n.props.placeholder || "");
      if (ph === "URL…" || (ph === "Naam…" && n.props.value === "Nieuwe bestelsite")) inputs.push(n); // niet de supermarkt-"Naam…"
    }
  });
  check("#42: rij met Naam…/URL…-velden", inputs.length === 2);
  inputs[0].props.onChange({ target: { value: "Pizzeria" } });
  const urlInput = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "input" && String(n.props.placeholder || "") === "URL…") f = n; }); return f; })();
  urlInput.props.onChange({ target: { value: "https://pizza.example" } });
  st = t.settingsState();
  check("#42: label+url opgeslagen ({ label: 'Pizzeria', url: 'https://pizza.example' })", st.takeawayLinks[0] && st.takeawayLinks[0].label === "Pizzeria" && st.takeawayLinks[0].url === "https://pizza.example");
  // verwijderen via ✕ (title 'Bestelsite verwijderen')
  const del = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "button" && String(n.props.title || "") === "Bestelsite verwijderen") f = n; }); return f; })();
  del.props.onClick();
  check("#42: bestelsite verwijderd uit settings", t.settingsState().takeawayLinks.length === 0);
}

// ---------- #40: thema's (settings.theme, ADR-021) ----------
{
  const t = make({});
  t.render();
  check("#40: default theme 'standaard' in settings", t.settingsState().theme === "standaard");
  t.findTab("Instellingen").props.onClick();
  const h = t.html();
  check("#40: kaart 'Weergave' met 5 thema-radio's (name=theme)", h.indexOf("Weergave") !== -1 && (h.match(/"name":"theme"/g) || []).length === 5);
  const rootTheme = (() => { let v = null; t.walk(t.render(), (n) => { if (!v && n && n.props && n.props["data-theme"]) v = n.props["data-theme"]; }); return v; })();
  check("#40: root-element draagt data-theme='standaard'", rootTheme === "standaard");
  const radios = [];
  t.walk(t.render(), (n) => { if (n && n.type === "input" && n.props.type === "radio" && n.props.name === "theme") radios.push(n); });
  check("#40: radio 'Standaard' staat aan, 'Donker' uit", radios.length === 5 && radios[0].props.checked === true && radios[1].props.checked === false);
  radios[1].props.onChange({ target: { checked: true } });
  check("#40: kies 'Donker' -> settings.theme = 'donker'", t.settingsState().theme === "donker");
  const rootTheme2 = (() => { let v = null; t.walk(t.render(), (n) => { if (!v && n && n.props && n.props["data-theme"]) v = n.props["data-theme"]; }); return v; })();
  check("#40: data-theme wisselt mee naar 'donker'", rootTheme2 === "donker");
  const t2 = make({ settings: { theme: "kerstmis" } });
  t2.render();
  check("#40: theme 'kerstmis' uit opgeslagen seed geladen", t2.settingsState().theme === "kerstmis");
  const t3 = make({ settings: { theme: "paarse-eend" } });
  t3.render();
  check("#40: ongeldige theme wordt genormaliseerd naar 'standaard'", t3.settingsState().theme === "standaard");
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
