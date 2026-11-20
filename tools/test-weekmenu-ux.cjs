// Tests voor de versimpelde weekmenu-tab en per-dag eters (ADR-012, zie docs/SPECS.md "Weekmenu"):
// - tab toont alleen de datum van vandaag + knop "Kies een datum" (kalender pas in de bottom sheet)
// - knop onderaan opent het regels-sheet (weekstart/visdagen/vega-doel) met directe doorvoering in settings
// - gerecht per dag typen: na >= 2 letters suggestielijst, Enter/klik selecteert; vrije tekst mag ({custom})
// - vrije tekst: tag "geen boodschappen", niet op de boodschappenlijst, eters-icoon uit
// - eters per dag: badge bij afwijking, inline stapper, {eaters} in menuByDate, schaling boodschappenlijst
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

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
    walk(render(), (n) => { if (n && n.type === "button" && n.children && String(n.children[0]).indexOf(label) === 0) found = n; });
    return found;
  };
  const findButton = (text) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "button" && JSON.stringify(n.children).indexOf(text) !== -1) found = n; });
    return found;
  };
  const dishInputs = () => {
    const out = [];
    walk(render(), (n) => { if (n && n.type === "input" && String(n.props.className || "").indexOf("dish-input") !== -1) out.push(n); });
    return out;
  };
  const eatersButtons = () => {
    const out = [];
    walk(render(), (n) => { if (n && n.type === "button" && String(n.props.className || "").indexOf("eatersbtn") !== -1) out.push(n); });
    return out;
  };
  const stepperBtn = (label) => {
    let s = /** @type {any} */ (null);
    walk(render(), (n) => { if (n && n.type === "div" && String(n.props.className || "").indexOf("stepper") !== -1) s = n; });
    return s ? s.children.find((c) => c && c.children && c.children[0] === label) : null;
  };
  const nodesWithClass = (sub) => {
    const out = [];
    walk(render(), (n) => { if (n && n.props && String(n.props.className || "").indexOf(sub) !== -1) out.push(n); });
    return out;
  };
  const tagEatersChildren = () => JSON.stringify((nodesWithClass("tag-eaters")[0] || { children: [] }).children);
  const footnoteChildren = () => {
    const p = nodesWithClass("text-[10px]").find((n) => JSON.stringify(n.children || []).indexOf("geschaald") !== -1);
    return JSON.stringify((p || { children: [] }).children);
  };
  // menuByDate is de 2e useState in App (na `tab`); index-based is robuust ook als de map leeg is
  const menuByDateState = () => m.hooks.state[1];
  const settingsState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x);
  render();
  return { m, render, walk, findTab, findButton, dishInputs, eatersButtons, stepperBtn, nodesWithClass, tagEatersChildren, footnoteChildren, menuByDateState, settingsState, html: () => JSON.stringify(serialize(render())) };
}

// 1. Tab toont alleen vandaag; "Verdeling voor de week" is weg; regels-knop onderaan aanwezig.
{
  const t = make({});
  const h = t.html();
  check("tab toont 'VANDAAG' met datum van vandaag", h.indexOf("VANDAAG") !== -1);
  check("tab toont geen 'Verdeling voor de week' meer", h.indexOf("Verdeling voor de week") === -1);
  check("knop 'Regels voor het weekmenu' aanwezig onderaan", !!t.findButton("Regels voor het weekmenu"));
  check("geen suggestielijst zonder invoer", h.indexOf("suggest-list") === -1);
  check("7 gerecht-invoervelden (één per dag)", t.dishInputs().length === 7);
  check("7 eters-icoontjes (naast elk slot)", t.eatersButtons().length === 7);
  check("standaard geen eters-badge", h.indexOf("ebadge") === -1);
}

// 2. Regels-sheet: openen, visdagen/vega/weekstart wijzigen (direct in settings), Klaar sluit.
{
  const t = make({});
  t.findButton("Regels voor het weekmenu").props.onClick();
  let h = t.html();
  check("regels-sheet opent met weekstart/visdagen/vega", h.indexOf("Weekstart") !== -1 && h.indexOf("Visdagen") !== -1 && h.indexOf("vega") !== -1);
  const fishChips = () => {
    const out = [];
    t.walk(t.render(), (n) => { if (n && n.type === "button" && String(n.props.className || "").indexOf("chip fish") === 0) out.push(n); });
    return out;
  };
  check("7 visdag-chips, za en wo actief", fishChips().length === 7 && fishChips()[0].props.className.indexOf("on") !== -1 && fishChips()[4].props.className.indexOf("on") !== -1);
  fishChips()[2].props.onClick(); // di toevoegen (opnieuw zoeken na her-render)
  let st = t.settingsState();
  check("visdag 'Di' toegevoegd aan fishDays", JSON.stringify(st.fishDays) === JSON.stringify([0, 2, 4]));
  fishChips()[0].props.onClick(); // za uitzetten
  st = t.settingsState();
  check("visdag 'Za' uitgezet", JSON.stringify(st.fishDays) === JSON.stringify([2, 4]));
  t.stepperBtn("+").props.onClick(); // vega 2 -> 3
  st = t.settingsState();
  check("vega-doel via stapper naar 3", st.vegaTarget === 3);
  const weekChips = [];
  t.walk(t.render(), (n) => { if (n && n.type === "button" && /^chip( on)?$/.test(String(n.props.className || ""))) weekChips.push(n); });
  check("7 weekstart-chips", weekChips.length === 7);
  weekChips[2].props.onClick(); // weekstart = maandag
  st = t.settingsState();
  check("weekstart via chip naar 2 (maandag)", st.weekStartDay === 2);
  t.findButton("Klaar").props.onClick();
  check("Klaar sluit het regels-sheet", t.html().indexOf("Regels voor het weekmenu") === -1 || t.html().indexOf("Klaar") === -1);
}

// 3. Gerecht typen: <2 letters geen suggesties; >=2 letters suggestielijst; Enter selecteert; exacte match; vrije tekst; wissen.
{
  const keys = weekKeysFor(0, 0);
  const t = make({ menuByDate: { [keys[0]]: { id: "r25", locked: true } } });
  let inputs = t.dishInputs();
  check("input dag 0 toont de receptnaam", inputs[0].props.value === "Thaise viscurry");
  inputs[0].props.onChange({ target: { value: "z" } });
  check("1 letter: geen suggestielijst", t.html().indexOf("suggest-list") === -1);
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "zal" } });
  let h = t.html();
  check("bij 'zal' verschijnt de suggestielijst", h.indexOf("suggest-list") !== -1);
  check("suggestie 'Zalm tandoori' aanwezig (gemarkeerd: 'Zal' + 'm tandoori')", h.indexOf("m tandoori") !== -1);
  check("gematchte letters gemarkeerd (class mark)", h.indexOf("mark") !== -1);
  check("categorie 'extra' nooit in suggesties (Speelklei bij 'speel')", (() => {
    const tt = t.dishInputs();
    tt[0].props.onChange({ target: { value: "speel" } });
    return t.html().indexOf("suggest-list") === -1;
  })());
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "zal" } });
  inputs = t.dishInputs();
  inputs[0].props.onKeyDown({ key: "Enter", preventDefault() {} });
  let mbd = t.menuByDateState();
  check("Enter selecteert de eerste suggestie (r30 Zalm tandoori)", mbd[keys[0]].id === "r30");
  check("vergrendeling behouden bij suggestiekeuze", mbd[keys[0]].locked === true);
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "Lasagne" } });
  inputs = t.dishInputs();
  inputs[0].props.onKeyDown({ key: "Enter", preventDefault() {} });
  mbd = t.menuByDateState();
  check("exacte match 'Lasagne' -> recept r44", mbd[keys[0]].id === "r44");
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "Eten bij oma in Breda" } });
  inputs = t.dishInputs();
  inputs[0].props.onKeyDown({ key: "Enter", preventDefault() {} });
  mbd = t.menuByDateState();
  check("vrije tekst opgeslagen als {custom}", mbd[keys[0]].custom === "Eten bij oma in Breda");
  check("vergrendeling behouden bij vrije tekst", mbd[keys[0]].locked === true);
  check("tag 'geen boodschappen' getoond bij vrije tekst", t.html().indexOf("geen boodschappen") !== -1);
  t.findTab("Boodschappen").props.onClick();
  check("vrije tekst verschijnt niet op de boodschappenlijst", t.html().indexOf("Eten bij oma in Breda") === -1);
  t.findTab("Weekmenu").props.onClick();
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "" } });
  inputs = t.dishInputs();
  inputs[0].props.onBlur();
  check("leeg veld + blur wist de dag", !t.menuByDateState()[keys[0]]);
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "Pannekoeken" } });
  inputs = t.dishInputs();
  inputs[0].props.onBlur();
  check("blur commit: exacte match -> recept r46", t.menuByDateState()[keys[0]].id === "r46");
  inputs = t.dishInputs();
  inputs[0].props.onChange({ target: { value: "Diner bij vrienden" } });
  inputs = t.dishInputs();
  inputs[0].props.onBlur();
  check("blur commit: onbekende tekst -> {custom}", t.menuByDateState()[keys[0]].custom === "Diner bij vrienden");
}

// 4. Eters per dag: inline stapper, badge bij afwijking, {eaters} in menuByDate, schaling op de boodschappenlijst.
{
  const keys = weekKeysFor(0, 0);
  const ti = keys.indexOf(dateKey(new Date())); // vandaag: de boodschappenlijst-scope start bij vandaag (ADR-016)
  const t = make({ menuByDate: { [keys[ti]]: { id: "r38", locked: true } } }); // Chili con carne ("3 tomaten", "1 ui", "1 blik mais", "Gehakt")
  let eb = t.eatersButtons();
  eb[ti].props.onClick(); // regel openklappen
  let h = t.html();
  check("eaters-regel klapt inline open met stapper + standaard/reset", !!t.stepperBtn("+") && h.indexOf("standaard:") !== -1 && h.indexOf("Standaard herstellen") !== -1);
  t.stepperBtn("+").props.onClick();
  t.stepperBtn("+").props.onClick(); // 4 -> 6
  let mbd = t.menuByDateState();
  check("eaters=6 opgeslagen bij de datum (absoluut aantal)", mbd[keys[ti]].eaters === 6 && mbd[keys[ti]].id === "r38");
  h = t.html();
  check("badge met 6 toont bij afwijking", h.indexOf("ebadge") !== -1);
  check("hint met factor 1,5 in de open regel", h.indexOf("boodschappenlijst") !== -1 && h.indexOf("1,5") !== -1);
  t.findTab("Boodschappen").props.onClick();
  h = t.html();
  check("boodschappenlijst is platte lijst per run (geen dagkop-chip meer)", t.tagEatersChildren().indexOf("6") === -1);
  check("'3 tomaten' geschaald naar '5 tomaten' (×1,5, afgerond)", h.indexOf("5 tomaten") !== -1 && h.indexOf("3 tomaten") !== -1);
  check("'1 Ui' geschaald naar '2 Uien' (meervoud via productnaam, ADR-017)", h.indexOf("2 Uien") !== -1 && h.indexOf("1 Ui") !== -1);
  check("'1 blik mais' niet geschaald (vaste verpakking)", h.indexOf("2 blik") === -1);
  check("footnote legt schaling uit (6 eters, factor 1,5)", t.footnoteChildren().indexOf("geschaald") !== -1 && t.footnoteChildren().indexOf("1,5") !== -1);
  t.findTab("Weekmenu").props.onClick();
  t.stepperBtn("−").props.onClick();
  t.stepperBtn("−").props.onClick();
  t.stepperBtn("−").props.onClick();
  t.stepperBtn("−").props.onClick(); // 6 -> 2 (minder eters mag ook)
  mbd = t.menuByDateState();
  check("minder eters mag: eaters=2 opgeslagen", mbd[keys[ti]].eaters === 2);
  t.findTab("Boodschappen").props.onClick();
  h = t.html();
  check("schaling factor 0,5 in footnote en '3 tomaten' -> '2 tomaten'", t.footnoteChildren().indexOf("0,5") !== -1 && h.indexOf("2 tomaten") !== -1);
  t.findTab("Weekmenu").props.onClick();
  t.findButton("Standaard herstellen").props.onClick();
  mbd = t.menuByDateState();
  check("'Standaard herstellen' wist de afwijking (geen eaters meer)", !("eaters" in mbd[keys[ti]]));
  check("daarna geen badge meer", t.html().indexOf("ebadge") === -1);
}

// 5. Vrije-tekst dag: eters-icoon uitgeschakeld (opacity-40) en klik opent geen stapper.
{
  const keys = weekKeysFor(0, 0);
  const t = make({ menuByDate: { [keys[1]]: { custom: "Eten bij oma in Breda" } } });
  const eb = t.eatersButtons();
  check("bij vrije tekst is het eters-icoon gedimd", String(eb[1].props.className).indexOf("opacity-40") !== -1);
  eb[1].props.onClick();
  check("klik op gedimd eters-icoon opent geen stapper", !t.stepperBtn("+"));
  check("vrije tekst heeft géén eters-override", !("eaters" in (t.menuByDateState()[keys[1]] || {})));
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
