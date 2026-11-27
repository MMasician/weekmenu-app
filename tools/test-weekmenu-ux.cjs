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
  const s = addDays(startOfWeek(todayDate(), w), offset * 7);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(s, i)));
}

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

// Vaste klok (wo 2026-11-25 12:00, midden in een za-start week) zodat weekgrens/"vandaag"-tests
// op élke dag van de week groen blijven (op de laatste weekdag was d8K == vandaag -> rood).
const FIXED_NOW = new Date(2026, 10, 25, 12, 0, 0);
const todayDate = () => new Date(FIXED_NOW.getTime());

function make(seed) {
  const m = loadApp(APP, seed, FIXED_NOW);
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
  const ti = keys.indexOf(dateKey(todayDate())); // vandaag: de boodschappenlijst-scope start bij vandaag (ADR-016)
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

// ---------- #37: tag-regels in de regels-sheet + generatie respecteert ze ----------
{
  const yesterday = dateKey(addDays(todayDate(), -1));
  const dayDiff = (a, b) => Math.abs(Math.round((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / 86400000));
  const t = make({
    settings: { householdSize: 4, weekStartDay: 0, fishDays: [], vegaTarget: 2, tagRules: [] },
    recipes: [
      { id: "a1", name: "Stamppot A", cat: "vega", ingredients: ["1 aardappel"], bereiding: "", timeCat: "normaal", tags: ["stamppot"] },
      { id: "a2", name: "Stamppot B", cat: "vega", ingredients: ["1 aardappel"], bereiding: "", timeCat: "normaal", tags: ["stamppot"] },
      { id: "b1", name: "Pasta", cat: "vega", ingredients: ["200 g pasta"], bereiding: "", timeCat: "kort", tags: [] },
      { id: "b2", name: "Rijstschotel", cat: "vlees", ingredients: ["200 g rijst"], bereiding: "", timeCat: "normaal", tags: [] },
    ],
    menuByDate: { [yesterday]: { id: "a1", locked: true } },
  });
  t.findButton("Regels voor het weekmenu").props.onClick();
  let h = t.html();
  check("#37: regels-sheet heeft sectie 'Tag-regels' met lege state", h.indexOf("Tag-regels") !== -1 && h.indexOf("nog geen tag-regels") !== -1);
  const findRuleForm = () => {
    const out = {};
    t.walk(t.render(), (n) => {
      if (n && n.type === "select" && !out.kindSel && JSON.stringify(n.children || []).indexOf("gerecht") !== -1) out.kindSel = n;
      if (n && n.type === "input" && !out.tagInp && n.props.placeholder === "tag…") out.tagInp = n;
      if (n && n.type === "button" && !out.addBtn && String(n.props.title || "") === "Regel toevoegen") out.addBtn = n;
    });
    return out;
  };
  findRuleForm().kindSel.props.onChange({ target: { value: "recipe" } }); // her-render per veld (hooks)
  findRuleForm().tagInp.props.onChange({ target: { value: "Stamppot" } });
  findRuleForm().addBtn.props.onClick();
  const rules = (t.settingsState().tagRules || []);
  check("#37: regel opgeslagen in settings.tagRules (genormaliseerd: kind=recipe, tag lowercase, days=3)",
    rules.length === 1 && rules[0].kind === "recipe" && rules[0].tag === "stamppot" && rules[0].days === 3);
  h = t.html();
  check("#37: regel-rij met chip + stapper + ✕ in de sheet", h.indexOf("stamppot") !== -1 && h.indexOf("Regel verwijderen") !== -1);
  t.findButton("Klaar").props.onClick();
  t.findButton("Genereer weekmenu").props.onClick();
  const mbd = t.menuByDateState();
  const stamps = Object.entries(mbd).filter(([k, e]) => e && e.id && (e.id === "a1" || e.id === "a2") && k !== yesterday);
  check("#37: generatie respecteert gerecht-tag-regel: geen stamppot binnen 3 dagen na gisteren",
    stamps.every(([k]) => dayDiff(k, yesterday) > 3));
  check("#37: gelockte dag van gisteren blijft staan", mbd[yesterday] && mbd[yesterday].id === "a1" && mbd[yesterday].locked === true);
}

// ---------- #38: herhaalregel per gerecht (dishRepeatDays) in regels-sheet + generatie ----------
{
  const t = make({ settings: { householdSize: 4, weekStartDay: 0, fishDays: [], vegaTarget: 2, tagRules: [] } });
  t.findButton("Regels voor het weekmenu").props.onClick();
  const seglLabels = () => {
    const out = [];
    const collect = (n) => {
      if (Array.isArray(n)) { n.forEach(collect); return; }
      if (n && n.type === "button") out.push({ label: String(n.children[0]), on: String(n.props.className || "") === "on", node: n });
    };
    t.walk(t.render(), (n) => {
      if (n && n.type === "div" && String(n.props.className || "") === "segl") (n.children || []).forEach(collect);
    });
    return out;
  };
  const seg = seglLabels();
  check("#38: segmented 'opnieuw plannen na' met volgorde altijd/3/7/14/30", JSON.stringify(seg.map((s) => s.label)) === JSON.stringify(["altijd", "3 dagen", "7 dagen", "14 dagen", "30 dagen"]));
  check("#38: default 7 dagen actief (en geen beschrijvende tekst)", seg.length === 5 && seg[2].on && t.html().indexOf("Standaard: 7 dagen") === -1);
  check("#38: dishRepeatDays default 7 in settings", (t.settingsState().dishRepeatDays || 0) === 7);
  seg[3].node.props.onClick(); // 14 dagen
  check("#38: klik '14 dagen' -> dishRepeatDays 14", t.settingsState().dishRepeatDays === 14);
  seglLabels()[0].node.props.onClick(); // altijd (0)
  check("#38: klik 'altijd' -> dishRepeatDays 0", t.settingsState().dishRepeatDays === 0);
  t.findButton("Klaar").props.onClick();
}
{
  // a1 is het enige vega-gerecht, 20 dagen geleden gelockt: met N=30 mag a1 NOOIT in de week; met N=0 juist wel (via vega-dagen)
  const longAgo = dateKey(addDays(todayDate(), -20));
  const mkRecipes = () => [
    { id: "a1", name: "Enig vega", cat: "vega", ingredients: ["1 aardappel"], bereiding: "", timeCat: "normaal", tags: [] },
    ...["b1", "b2", "b3", "b4", "b5", "b6", "b7", "b8"].map((id, i) => ({ id, name: "Vlees " + i, cat: "vlees", ingredients: ["100 g vlees"], bereiding: "", timeCat: "normaal", tags: [] })),
  ];
  const base = { settings: { householdSize: 4, weekStartDay: 0, fishDays: [], vegaTarget: 2, tagRules: [] }, menuByDate: { [longAgo]: { id: "a1", locked: true } } };

  const t30 = make({ ...base, recipes: mkRecipes(), settings: { ...base.settings, dishRepeatDays: 30 } });
  t30.findButton("Genereer weekmenu").props.onClick();
  const mbd30 = t30.menuByDateState();
  const week30 = weekKeysFor(0, 0).map((k) => mbd30[k] && mbd30[k].id);
  check("#38: N=30 -> a1 (20 dagen geleden) wordt niet opnieuw gepland", week30.every((id) => id !== "a1") && week30.filter(Boolean).length === 7);

  const t0 = make({ ...base, recipes: mkRecipes(), settings: { ...base.settings, dishRepeatDays: 0 } });
  t0.findButton("Genereer weekmenu").props.onClick();
  const mbd0 = t0.menuByDateState();
  const week0 = weekKeysFor(0, 0).map((k) => mbd0[k] && mbd0[k].id);
  check("#38: N=0 (altijd) -> a1 mag opnieuw (enige vega-gerecht staat erin)", week0.filter((id) => id === "a1").length >= 1);
  check("#38: gelockte dag 20 dagen geleden blijft staan", mbd0[longAgo] && mbd0[longAgo].id === "a1" && mbd0[longAgo].locked === true);

  const t7 = make({ ...base, recipes: mkRecipes(), settings: { ...base.settings, dishRepeatDays: 7 } });
  t7.findButton("Genereer weekmenu").props.onClick();
  const mbd7 = t7.menuByDateState();
  const week7 = weekKeysFor(0, 0).map((k) => mbd7[k] && mbd7[k].id);
  check("#38: N=7 -> a1 (20 dagen geleden) mag weer (buiten de 7 dagen)", week7.filter((id) => id === "a1").length >= 1);
}


// ---------- #42: afwijking van het weekplan (🪫 alleen op vandaag; afhaalmaaltijd/instant; shift) ----------
{
  const today = todayDate();
  const todayK = dateKey(today);
  const d1K = dateKey(addDays(today, 1));
  const d2K = dateKey(addDays(today, 2));
  const lastOfWeek = addDays(startOfWeek(today, 0), 6); // laatste dag van de huidige week (weekstart = za)
  const d8K = dateKey(lastOfWeek);
  const d9K = dateKey(addDays(lastOfWeek, 1)); // eerste dag van de volgende week -> weekgrens
  const crossesToday = dateKey(startOfWeek(addDays(today, 1), 0)) !== dateKey(startOfWeek(today, 0));
  const devSeed = () => ({
    settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "AH", defaultShop: true }], takeawayLinks: [{ id: "tl-1", label: "Pizzeria", url: "pizza.example" }] },
    products: [
      { id: "p-soep", name: "Soep", cat: "soep", market: null, unit: "stuks", tags: ["instant-maaltijd"], pack: null },
      { id: "p-noedel", name: "Noedels", cat: "pasta", market: null, unit: "stuks", tags: ["instant-maaltijd"], pack: null },
      { id: "p-pizza", name: "Diepvriespizza", cat: "diepvries", market: null, unit: "stuks", tags: ["instant-maaltijd"], pack: null },
      { id: "p-kaas", name: "Kaas", cat: "zuivel", market: null, unit: null, tags: [], pack: null },
    ],
    recipes: [
      { id: "rA", name: "Gerecht A", cat: "vega", ingredients: ["200 g kaas"], bereiding: "", timeCat: "normaal", tags: [] },
      { id: "rB", name: "Gerecht B", cat: "vlees", ingredients: ["1 blik soep"], bereiding: "", timeCat: "normaal", tags: [] },
    ],
    menuByDate: { [todayK]: { id: "rA", locked: true }, [d1K]: { id: "rB" }, [d8K]: { id: "rB", locked: true } },
    stock: [
      { name: "Soep", pid: "p-soep", loc: "loc-kast", cat: "soep", want: 2, have: 2 },
      { name: "Noedels", pid: "p-noedel", loc: "loc-kast", cat: "pasta", want: 6, have: 6 },
      { name: "Diepvriespizza", pid: "p-pizza", loc: "loc-vriezer", cat: "diepvries", want: 5, have: 0 },
      { name: "Kaas", pid: "p-kaas", loc: "loc-koel", cat: "zuivel", want: 1, have: 1 },
    ],
    extraItems: [],
    checked: { [todayK + "-rA-0"]: true },
  });
  const checkedState = (t) => t.m.hooks.state.find((x) => x && typeof x === "object" && !Array.isArray(x) && Object.keys(x).some((k) => k.indexOf("-rA-") !== -1 || k.indexOf("-rB-") !== -1));
  const stockState = (t) => t.m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "have" in x[0] && "loc" in x[0]);
  const devBtns = (t) => { const out = []; t.walk(t.render(), (n) => { if (n && n.type === "button" && String(n.props.title || "").indexOf("Afwijking van het weekplan") !== -1) out.push(n); }); return out; };
  const devRow = (t, name) => {
    let f = null;
    t.walk(t.render(), (n) => {
      if (f || !n || n.type !== "div" || !n.children) return;
      if (n.children.some((c) => c && c.props && String(c.props.className || "") === "stepper") && JSON.stringify(serialize(n)).indexOf(name) !== -1) f = n;
    });
    return f;
  };

  // --- instant ---
  const t = make(devSeed());
  let h;
  check("#42: 🪫-knop er is precies 1× (alleen op de dag van vandaag)", devBtns(t).length === 1);
  devBtns(t)[0].props.onClick();
  h = t.html();
  check("#42: afwijkings-sheet open met segmented (Instant uit voorraad / Afhaalmaaltijd)", h.indexOf("Afwijking") !== -1 && h.indexOf("Instant uit voorraad") !== -1 && h.indexOf("Afhaalmaaltijd") !== -1);
  check("#42: instant-lijst toont alleen tag instant-maaltijd met have>0 (Noedels, Soep; niet Diepvriespizza/Kaas)", h.indexOf("Noedels") !== -1 && h.indexOf("Soep") !== -1 && h.indexOf("Diepvriespizza") === -1 && h.indexOf("Kaas") === -1);
  check("#42: ℹ️-info bij de instant-lijst", h.indexOf("instant-maaltijd") !== -1);
  const rowSoep = devRow(t, "Soep");
  check("#42: rij Soep heeft stepper (have 2)", !!rowSoep);
  const stepSoep = rowSoep.children.find((c) => c.props.className === "stepper");
  stepSoep.children[2].props.onClick(); // + -> 1× Soep
  const confirm = t.findButton("Bevestig · weekplan schuift 1 dag op");
  check("#42: Bevestig-knop gevonden en enabled na keuze", !!confirm && confirm.props.disabled !== true);
  confirm.props.onClick();
  let mbd = t.menuByDateState();
  check("#42: vandaag wordt vrije tekst 'Instant-maaltijd: 1× Soep' (geen boodschappen)", mbd[todayK] && mbd[todayK].custom === "Instant-maaltijd: 1× Soep");
  check("#42: shift: oude gerecht van vandaag staat nu op morgen (d1K = rA; locked behouden tenzij weekgrens)", mbd[d1K] && mbd[d1K].id === "rA" && mbd[d1K].locked === !crossesToday);
  check("#42: shift: rB van d1K staat nu op d2K", mbd[d2K] && mbd[d2K].id === "rB");
  check("#42: shift over weekgrens: gelockte rB van d8K (laatste dag week) -> d9K en niet meer gelocked (geen vinkje)", mbd[d9K] && mbd[d9K].id === "rB" && mbd[d9K].locked === false);
  const ck = checkedState(t) || {};
  check("#42: vinkjes schuiven mee (todayK-rA-0 -> d1K-rA-0)", ck[d1K + "-rA-0"] === true && !ck[todayK + "-rA-0"]);
  const soep = (stockState(t) || []).find((s2) => s2.pid === "p-soep");
  check("#42: voorraad verlaagd: Soep have 2 -> 1", !!soep && soep.have === 1);

  // --- afhaalmaaltijd via bestellinkje ---
  const t2 = make(devSeed());
  devBtns(t2)[0].props.onClick();
  t2.findButton("🍔 Afhaalmaaltijd").props.onClick();
  let h2 = t2.html();
  check("#42: afhaal-segment toont geconfigureerde bestellinkjes (Pizzeria)", h2.indexOf("Pizzeria") !== -1 && h2.indexOf("pizza.example") !== -1);
  const linkBtn = (() => { let f = null; t2.walk(t2.render(), (n) => { if (!f && n && n.type === "button" && JSON.stringify(n.children || []).indexOf("Pizzeria") !== -1) f = n; }); return f; })();
  linkBtn.props.onClick();
  mbd = t2.menuByDateState();
  check("#42: klik op bestellinkje -> dag wordt 'Afhaalmaaltijd' en weekplan schuift op", mbd[todayK] && mbd[todayK].custom === "Afhaalmaaltijd" && mbd[d1K] && mbd[d1K].id === "rA");
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
