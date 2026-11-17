// Test van per-huishouden instellingen (ADR-009): defaults, normalisatie, weekmenu, boodschappenruns, winkels.
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

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
  const menuState = () =>
    m.hooks.state.find((x) => Array.isArray(x) && x.length === 7 && x.every((d) => d === null || (d && typeof d === "object" && "id" in d)));
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length > 0 && x[0] && x[0].cat);
  const settingsState = () =>
    m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x && "shopRuns" in x);
  const catOf = (id) => ((recipesState() || []).find((r) => r.id === id) || {}).cat;
  const dayLabels = () => {
    const out = [];
    walk(render(), (n) => {
      if (n && n.type === "div" && n.props && String(n.props.className || "").indexOf("w-20 shrink-0") !== -1) out.push(n.children[0]);
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
    JSON.stringify(st.fishDays) === "[0,4]" && st.vegaTarget === 2 && st.markets.length === 3 && st.shopRuns.length === 2);
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

  t.findTab("Boodschappen").props.onClick();
  const sh = t.html();
  check("boodschappenruns uit instellingen (Run A, Run B)", sh.indexOf("Run A") !== -1 && sh.indexOf("Run B") !== -1 && sh.indexOf("Run A") < sh.indexOf("Run B"));
  check("dagen bij run gekopieerd uit instellingen (Maandag..Zondag)", sh.indexOf("Maandag") !== -1 && sh.indexOf("Zondag") !== -1);

  t.findTab("Prijzen").props.onClick();
  const ph = t.html();
  check("winkels uit instellingen in prijzentab (Plus wel, Jumbo niet)", ph.indexOf("Plus") !== -1 && ph.indexOf("Albert") !== -1 && ph.indexOf("Jumbo") === -1);

  const st = t.settingsState();
  check("settings persisted in state", !!st && st.householdSize === 6 && st.weekStartDay === 2 && st.markets.map((m) => m.key).join(",") === "ah,plus");
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
  let weekSel = null;
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
  let vegaInput = null;
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

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
