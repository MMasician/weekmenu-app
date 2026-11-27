// Functionele tests voor ADR-016: boodschappenlijst van vandaag — dagenbereik (0..max gelockte dagen,
// default min(4,max)), supermarktkeuze (verborgen bij andere winkelvoorkeur), één platte categorie-lijst,
// datumchip bij groente/zuivel, afvinken + "Verwerk update" (#34) + gerechtstatus (✅/❗) in het weekmenu.
// Prijzen-tab en boodschappenmomenten (runs) zijn vervallen.
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
function addDays(d, n) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}
const DAY_NAMES = ["Zaterdag", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
const fmtDay = (k) => `${k.slice(8)}-${k.slice(5, 7)}`;
const dayShortOf = (k) =>
  DAY_NAMES[(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))).getDay() + 1) % 7]
    .slice(0, 2)
    .toLowerCase();

// Vaste klok (wo 2026-11-25, midden in een za-start week) zodat weekgrens/"vandaag"-tests
// op élke dag van de week deterministisch groen blijven.
const FIXED_NOW = new Date(2026, 10, 25, 12, 0, 0);
const today = new Date(FIXED_NOW.getTime());
const todayK = dateKey(today);
const d1K = dateKey(addDays(today, 1));
const d2K = dateKey(addDays(today, 2));
const d3K = dateKey(addDays(today, 3));

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

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
  const findBtn = (pred) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "button" && pred(n)) found = n; });
    return found;
  };
  const btnByText = (t) => findBtn((n) => JSON.stringify(n.children || []).indexOf(t) !== -1);
  const chipBtn = (txt) => findBtn((n) => n.children && n.children.length === 1 && n.children[0] === txt && String(n.props.className || "").indexOf("chip") !== -1);
  const daysStepper = () => {
    let s = null;
    walk(render(), (n) => { if (!s && n && n.type === "div" && n.props.className === "stepper") s = n; });
    return s;
  };
  const checkboxes = () => {
    const out = [];
    walk(render(), (n) => { if (n && n.type === "input" && n.props.type === "checkbox") out.push(n); });
    return out;
  };
  const rowWithLabel = (label) => {
    let row = null;
    walk(render(), (n) => {
      if (!row && n && n.type === "label" && JSON.stringify(serialize(n)).indexOf(`"${label}"`) !== -1) row = n;
    });
    return row;
  };
  const setRowChecked = (label, v) => {
    const row = rowWithLabel(label);
    let inp = null;
    walk(row, (n) => { if (!inp && n && n.type === "input" && n.props.type === "checkbox") inp = n; });
    inp.props.onChange({ target: { checked: v } });
  };
  const settingsState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findTab, findBtn, btnByText, chipBtn, daysStepper, checkboxes, rowWithLabel, setRowChecked, settingsState, html };
}

// Base-seed: 3 aaneengesloten gelockte dagen vanaf vandaag (max=3), 4e dag niet gelocked.
// lidl heeft defaultShop=false; Zalm heeft winkelvoorkeur lidl.
const baseSeed = () => ({
  settings: {
    householdSize: 4,
    // weekstart op morgen: dan is morgen (d1K) de eerste dag van de volgende week,
    // los van op welke dag de test draait (anders faalt de 'Volgende week'-check op de
    // meeste dagen van de week)
    weekStartDay: (today.getDay() + 2) % 7, // DAY_NAMES-index van morgen
    markets: [
      { key: "ah", label: "Albert Heijn", defaultShop: true },
      { key: "jumbo", label: "Jumbo", defaultShop: true },
      { key: "lidl", label: "Lidl", defaultShop: false },
    ],
  },
  menuByDate: {
    [todayK]: { id: "r25", locked: true }, // Thaise viscurry: o.a. Zalm, Rivolitomaatjes, Kroepoek
    [d1K]: { id: "r29", locked: true },    // Witte zalmpasta: o.a. Zalm, Rivolitomaatjes, Melk
    [d2K]: { id: "r44", locked: true },    // Lasagne: o.a. (Vega-)gehakt
    [d3K]: { id: "r30" },                  // Zalm tandoori (niet gelocked): o.a. Krieltjes -> buiten scope
  },
  stock: [
    { name: "Zalm", loc: "loc-vriezer", cat: "vlees/vis", market: "lidl", want: 1, have: 1 },
    { name: "Melk", loc: "loc-koel", cat: "zuivel", want: 2, have: 2 },
    { name: "Rivolitomaatjes", loc: "loc-koel", cat: "groente", want: 1, have: 1 },
    { name: "Kroepoek", loc: "loc-kast", cat: "(maaltijd)saus", want: 1, have: 1 },
    { name: "Kaas", loc: "loc-koel", cat: "zuivel", want: 2, have: 0 }, // tekort (2 van 2)
  ],
  extraItems: [{ name: "Chilisaus", cat: "(maaltijd)saus" }, { name: "Kauwgom", cat: "lekkers" }],
  checked: {},
});

// ---------- 1. Tabs, titel, scope (dagen) ----------
{
  const t = make(baseSeed());
  check("tab Boodschappen aanwezig; Prijzen-tab weg", !!t.findTab("Boodschappen") && !t.findTab("Prijzen"));
  t.findTab("Boodschappen").props.onClick();
  let h = t.html();
  check("titel 'Boodschappenlijst · <vandaag>'; geen run-labels meer", h.indexOf("Boodschappenlijst ·") !== -1 && h.indexOf("Boodschappenlijst zaterdag") === -1);
  check("geen prijzen meer (geen 'goedkoopste')", h.indexOf("goedkoopste") === -1);
  check("stapper default = min(4, max=3) = 3 dagen", t.daysStepper().children[1].children[0] === 3);
  check("'+' disabled op maximum (3 aaneengesloten gelockte dagen)", t.daysStepper().children[2].props.disabled === true);
  check("gerecht van 4e dag (niet gelocked) niet op de lijst", h.indexOf("Krieltjes") === -1);
  check("gerechten van de 3 gelockte dagen wel op de lijst", h.indexOf("Rode curry") !== -1 && h.indexOf("Melk") !== -1 && h.indexOf("(Vega-)gehakt") !== -1);
  t.daysStepper().children[0].props.onClick(); // 3 -> 2
  h = t.html();
  check("stapper − naar 2: 3e dag (lasagne) uit de lijst, 2e dag (Melk) blijft", t.daysStepper().children[1].children[0] === 2 && h.indexOf("(Vega-)gehakt") === -1 && h.indexOf("Melk") !== -1);
  t.daysStepper().children[0].props.onClick(); // 2 -> 1
  t.daysStepper().children[0].props.onClick(); // 1 -> 0
  h = t.html();
  check("0 dagen: geen ingrediënt-rijen, wel extra/voorraad", t.daysStepper().children[1].children[0] === 0 && h.indexOf("Melk") === -1 && h.indexOf("Kauwgom") !== -1 && h.indexOf("Kaas") !== -1);
  t.daysStepper().children[2].props.onClick(); // 0 -> 1
  t.daysStepper().children[2].props.onClick(); // 1 -> 2
  t.daysStepper().children[2].props.onClick(); // 2 -> 3
  h = t.html();
  check("terug naar 3 dagen: lasagne-rij terug", t.daysStepper().children[1].children[0] === 3 && h.indexOf("(Vega-)gehakt") !== -1);

  // ---------- 2. Supermarktkeuze (filter) ----------
  check("default selectie = defaultShop (ah+jumbo): Zalm (winkelvoorkeur lidl) verborgen", h.indexOf("Zalm") === -1);
  t.chipBtn("Lidl").props.onClick();
  h = t.html();
  check("Lidl-chip aan -> Zalm zichtbaar met winkel-chip", h.indexOf("Zalm") !== -1 && h.indexOf("chip mkt") !== -1);

  // ---------- 3. Platte lijst: sortering, secties weg, datumchip, tekort ----------
  check("geen sectiekoppen meer ('Extra' / 'Standaardvoorraad aanvullen')", h.indexOf('"Extra"') === -1 && h.indexOf("Standaardvoorraad aanvullen") === -1);
  check("categorie-volgorde: groente < vlees/vis < saus < zuivel < lekkers",
    h.indexOf("Rivolitomaatjes") < h.indexOf("Zalm") &&
    h.indexOf("Zalm") < h.indexOf("Kroepoek") &&
    h.indexOf("Kroepoek") < h.indexOf("Kaas") &&
    h.indexOf("Kaas") < h.indexOf("Kauwgom"));
  check("voorraadtekort Kaas met (2 van 2) in dezelfde platte lijst", h.indexOf("Kaas") !== -1 && h.indexOf("(2 van 2)") !== -1);
  check("datumchip bij groente/zuivel-ingrediënten: precies 3 (2x Rivolitomaatjes + Melk), incl. datum van morgen bij Melk",
    (h.match(/datechip/g) || []).length === 3 && h.indexOf(`${dayShortOf(d1K)} ${fmtDay(d1K)}`) !== -1);

  // ---------- 4. Afvinken, gerechtstatus, klaar-melding ----------
  // harness- gotcha: handlers uit één render delen state; per vinkje her-renderen
  for (let i = 0; i < 60; i++) {
    const unchecked = t.checkboxes().filter((b) => !b.props.checked);
    if (!unchecked.length) break;
    unchecked[0].props.onChange({ target: { checked: true } });
  }
  h = t.html();
  check("alle vinkjes gezet -> rijen doorgestreept", h.indexOf("line-through") !== -1 && t.checkboxes().every((b) => b.props.checked));
  t.findTab("Weekmenu").props.onClick();
  h = t.html();
  check("vandaag in scope + alles gecheckt: ✅ met title 'in huis' (en geen ❗)", h.indexOf("✅") !== -1 && h.indexOf("Alle ingrediënten van dit gerecht zijn in huis") !== -1 && h.indexOf("❗") === -1);
  t.findTab("Boodschappen").props.onClick();
  t.setRowChecked("Melk", false); // uitverkocht
  t.btnByText("Verwerk update").props.onClick();
  h = t.html();
  check("klaar-melding inline: ✅ 2 compleet · ❗ 1 mist nog (lijst blijft afvinkbaar)",
    h.indexOf("✅ 2 gerechten compleet") !== -1 && h.indexOf("❗ 1 mist nog") !== -1 && h.indexOf("lijst blijft afvinkbaar") !== -1);
  check("verwerk-knop is groen (emerald)", t.btnByText("Verwerk update").props.className.indexOf("bg-emerald-600") !== -1);
  t.findTab("Weekmenu").props.onClick();
  t.findBtn((n) => JSON.stringify(n.children || []).indexOf("Kies een datum") !== -1).props.onClick();
  t.findBtn((n) => JSON.stringify(n.children || []).indexOf("Volgende week") !== -1).props.onClick();
  h = t.html();
  check("volgende week (morgen in scope, Melk mist): ❗ met title 'mist nog'", h.indexOf("❗") !== -1 && h.indexOf("mist nog") !== -1);
  t.findTab("Boodschappen").props.onClick();
  t.setRowChecked("Melk", true); // achteraf alsnog afvinken mag
  t.btnByText("Verwerk update").props.onClick();
  h = t.html();
  check("achteraf afvinken werkt: melding live naar ✅ 3 compleet", h.indexOf("✅ 3 gerechten compleet") !== -1);
  t.btnByText("Vinkjes wissen").props.onClick();
  h = t.html();
  check("'Vinkjes wissen' reset vinkjes én klaar-melding", h.indexOf("line-through") === -1 && h.indexOf("gerechten compleet") === -1);
}

// ---------- 5. Niets gecheckt -> geen statusicoon ----------
{
  const t = make(baseSeed());
  t.findTab("Weekmenu").props.onClick();
  const h = t.html();
  check("niets gecheckt: geen ✅/❗ bij het gerecht van vandaag", h.indexOf("✅") === -1 && h.indexOf("❗") === -1);
}

// ---------- 6. Lege lijst door winkelfilter + reset-chip ----------
{
  const t = make({
    settings: {
      householdSize: 4,
      weekStartDay: 0,
      markets: [
        { key: "ah", label: "Albert Heijn", defaultShop: true },
        { key: "jumbo", label: "Jumbo", defaultShop: true },
      ],
    },
    stock: [{ name: "Chilisaus", loc: "loc-kast", cat: "(maaltijd)saus", market: "jumbo", want: 1, have: 0 }],
    extraItems: [],
  });
  t.findTab("Boodschappen").props.onClick();
  t.chipBtn("Jumbo").props.onClick(); // alleen Albert aan -> Chilisaus (jumbo) verborgen
  let h = t.html();
  check("alles verborgen door winkelkeuze: 'Niets te halen bij Albert' + reset-chip, artikel weg",
    h.indexOf("Niets te halen bij Albert") !== -1 && h.indexOf("Toon alle supermarkten") !== -1 && h.indexOf("Chilisaus") === -1);
  t.btnByText("Toon alle supermarkten").props.onClick();
  h = t.html();
  check("reset-chip 'Toon alle supermarkten' -> Chilisaus weer zichtbaar", h.indexOf("Chilisaus") !== -1);
}

// ---------- 7. Instellingen: supermarkten + standaard; geen runs; vluchtige keuze ----------
{
  const t = make(baseSeed());
  t.findTab("Instellingen").props.onClick();
  let h = t.html();
  check("Instellingen: geen 'Boodschappenmomenten'-sectie meer", h.indexOf("Boodschappenmomenten") === -1);
  check("Instellingen: 'Supermarkten' met per-winkel 'standaard'", h.indexOf("Supermarkten") !== -1 && h.indexOf("Standaard geselecteerd op de boodschappenlijst") !== -1);
  const stdLabels = [];
  t.walk(t.render(), (n) => { if (n && n.type === "label" && String(n.props.title || "").indexOf("Standaard geselecteerd") !== -1) stdLabels.push(n); });
  check("3 standaard-labels (ah, jumbo, lidl)", stdLabels.length === 3);
  let lidlBox = null;
  t.walk(stdLabels[2], (n) => { if (!lidlBox && n && n.type === "input") lidlBox = n; });
  check("lidl standaard UIT (defaultShop false in seed)", lidlBox.props.checked === false);
  lidlBox.props.onChange({ target: { checked: true } });
  check("defaultShop lidl -> true opgeslagen in settings.markets", t.settingsState().markets.find((m) => m.key === "lidl").defaultShop === true);

  const t2 = make(baseSeed());
  t2.findTab("Boodschappen").props.onClick();
  t2.daysStepper().children[0].props.onClick(); // 3 -> 2
  t2.chipBtn("Lidl").props.onClick(); // lidl aan
  const st = t2.settingsState();
  check("dagen- en winkelkeuze zijn vluchtig: niet in settings (ADR-016)", !("shopDays" in st) && !("shopMarkets" in st) && !("shopRuns" in st));
}

// ---------- 8. #33: zelfde product samenvoegen op 1 regel ----------
{
  const seed = {
    settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "Albert Heijn", defaultShop: true }] },
    recipes: [
      { id: "rA", name: "Gerecht A", cat: "vlees", ingredients: ["1 appel", "400 g kipgehakt"], bereiding: "", timeCat: "normaal", tags: [] },
      { id: "rB", name: "Gerecht B", cat: "vis", ingredients: ["0,6 kg kipgehakt"], bereiding: "", timeCat: "normaal", tags: [] },
    ],
    menuByDate: { [todayK]: { id: "rA", locked: true }, [d1K]: { id: "rB", locked: true } },
    stock: [{ name: "Appel", loc: "loc-fruit", cat: "fruit", want: 3, have: 1 }],
    extraItems: [{ name: "Kipgehakt", amount: 1, unit: "stuks" }],
    checked: {},
  };
  const t = make(seed);
  t.findTab("Boodschappen").props.onClick();
  let h = t.html();
  check("#33: 1 appel (gerecht A) + tekort (2 van 3) -> 1 regel met de som ('3 appel...')", h.toLowerCase().indexOf("3 appel") !== -1);
  check("#33: 400 g + 0,6 kg kipgehakt -> eenheid geconverteerd + samengevoegd tot '1 kg'", h.indexOf("1 kg") !== -1);
  check("#33: afwijkende eenheid (stuks) merge NIET mee -> aparte regel", h.indexOf("stuks") !== -1);
  check("#33: 3 rijen totaal (appels / kipgehakt in kg / kipgehakt in stuks)", t.checkboxes().length === 3);
  t.checkboxes()[0].props.onChange({ target: { checked: true } }); // appel-rij (fruit staat eerst op categorie-volgorde)
  check("#33: afvinken samengevoegde regel zet alle bronrijen -> badge (1/3) op het boodschappen-icoon (#41)", JSON.stringify(t.findTab("Boodschappen").children).indexOf("1/3") !== -1);
  t.findTab("Weekmenu").props.onClick();
  h = t.html();
  check("#33: gerechtstatus werkt op de bronrijen: vandaag ❗ '1 van de 2 ingrediënten mist nog'", h.indexOf("1 van de 2") !== -1);
}

// ---------- 9. #34: "Verwerk update" — have bijwerken + afgevinkte rijen verbergen (versie B) ----------
{
  const t = make(baseSeed());
  t.findTab("Boodschappen").props.onClick();
  t.setRowChecked("2 Kaasen", true);   // voorraadtekort-rij
  t.setRowChecked("Kroepoek", true); // ingrediënt-rij (product zit ook in voorraad)
  let h = t.html();
  check("#34: vóór Verwerk update blijven afgevinkte rijen zichtbaar (doorgehaald)", h.indexOf("line-through") !== -1 && h.indexOf("Kroepoek") !== -1);
  t.btnByText("Verwerk update").props.onClick();
  h = t.html();
  check("#34: na Verwerk update: afgevinkte rij verborgen (Kroepoek weg) + chip '1 afgevinkt · toon ▾'",
    h.indexOf("1 afgevinkt · toon") !== -1 && h.indexOf("Kroepoek") === -1);
  check("#34: verwerkt tekort valt helemaal weg uit de lijst (Kaas have=want -> geen tekort meer)", h.indexOf("Kaas") === -1);
  check("#34: melding over gerechtvolledigheid na Verwerk update", h.indexOf("mist nog") !== -1);
  const stockState = t.m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "have" in x[0] && "want" in x[0]);
  const kaas = stockState.find((s) => s.name === "Kaas");
  const kroepoek = stockState.find((s) => s.name === "Kroepoek");
  check("#34: afgevinkt tekort -> have = want (Kaas 0 -> 2)", !!kaas && kaas.have === 2);
  check("#34: afgevinkt ingrediënt met product in voorraad -> have += aantal (Kroepoek 1 -> 2)", !!kroepoek && kroepoek.have === 2);
  t.chipBtn("1 afgevinkt · toon ▾").props.onClick();
  h = t.html();
  check("#34: chip 'toon' zet afgevinkte rijen terug (zichtbaar + doorgestreept)", h.indexOf("Kroepoek") !== -1 && h.indexOf("line-through") !== -1);
  t.btnByText("Vinkjes wissen").props.onClick();
  h = t.html();
  check("#34: 'Vinkjes wissen' -> alle rijen zichtbaar, geen chip, geen melding",
    h.indexOf("Kroepoek") !== -1 && h.indexOf("afgevinkt · toon") === -1 && h.indexOf("gerechten compleet") === -1 && h.indexOf("line-through") === -1);
}

// ---------- 10. #43: gerecht zonder ingrediënten -> 1 regel "Ingrediënten voor x" (versie A) ----------
{
  const seed = {
    settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "Albert Heijn", defaultShop: true }] },
    recipes: [
      { id: "rA", name: "Gerecht A", cat: "vlees", ingredients: ["400 g kipgehakt"], bereiding: "", timeCat: "normaal", tags: [] },
      { id: "rB", name: "Pasta pesto", cat: "vega", ingredients: [], bereiding: "", timeCat: "kort", tags: [] },
    ],
    menuByDate: { [todayK]: { id: "rA", locked: true }, [d1K]: { id: "rB", locked: true } },
    stock: [],
    extraItems: [],
    checked: {},
  };
  const t = make(seed);
  t.findTab("Boodschappen").props.onClick();
  let h = t.html();
  check("#43: 1 regel 'Ingrediënten voor Pasta pesto' op de lijst", h.indexOf("Ingrediënten voor Pasta pesto") !== -1);
  check("#43: regel merge niet met product-rijen (2 checkboxes: kipgehakt + regel)", t.checkboxes().length === 2);
  t.findTab("Weekmenu").props.onClick();
  h = t.html();
  check("#43: vóór afvinken geen ✅/❗ bij de dag zonder ingrediënten", h.indexOf("✅") === -1 && h.indexOf("❗") === -1);
  t.findTab("Boodschappen").props.onClick();
  t.setRowChecked("Ingrediënten voor Pasta pesto", true);
  t.findTab("Weekmenu").props.onClick();
  h = t.html();
  check("#43: na afvinken toont de dag ✅ 'in huis' (versie A)", h.indexOf("✅") !== -1 && h.indexOf("Alle ingrediënten van dit gerecht zijn in huis") !== -1);
}


// ---------- 10. #35: weergave op de lijst in winkel-eenheid (pack ceil / min. 100 g/ml / nooit el-tl) ----------
{
  const seed = {
    settings: { householdSize: 4, weekStartDay: 0, markets: [{ key: "ah", label: "Albert Heijn", defaultShop: true }] },
    products: [
      { id: "p-kwark", name: "Kwark", cat: "zuivel", market: null, unit: "pot", tags: [], pack: { amount: 500, unit: "g" } },
      { id: "p-peper", name: "Peper", cat: "kruiden", market: null, unit: null, tags: [], pack: null },
      { id: "p-mosterd", name: "Mosterd", cat: "kruiden", market: null, unit: null, tags: [], pack: null },
    ],
    recipes: [
      { id: "rA", name: "Gerecht A", cat: "vega", ingredients: ["4 el kwark", "50 g peper", "1 tl mosterd"], bereiding: "", timeCat: "normaal", tags: [] },
      { id: "rB", name: "Gerecht B", cat: "vis", ingredients: ["2 el kwark"], bereiding: "", timeCat: "normaal", tags: [] },
    ],
    menuByDate: { [todayK]: { id: "rA", locked: true }, [d1K]: { id: "rB", locked: true } },
    stock: [],
    extraItems: [],
    checked: {},
  };
  const t = make(seed);
  t.findTab("Boodschappen").props.onClick();
  const h = t.html();
  check("#35: 4 el + 2 el kwark (6 el = 90 g) met pack 500 g -> hele verpakking ceil '1 pot Kwark'", h.indexOf("1 pot Kwark") !== -1);
  check("#35: nooit el/tl op de lijst (geen '6 el' / 'el Kwark' in de kwark-regel)", h.indexOf("el Kwark") === -1 && h.indexOf("6 el") === -1);
  check("#35: zonder pack en som < 100 g -> min. 100 g ('100 g Peper', geen '50 g')", h.indexOf("100 g Peper") !== -1 && h.indexOf("50 g") === -1);
  check("#35: tl zonder pack -> impliciet naar ml met min. 100 ml ('100 ml Mosterd', geen '1 tl')", h.indexOf("100 ml Mosterd") !== -1 && h.indexOf("1 tl") === -1);
  check("#35: pack genormaliseerd bij laden (p-peper.pack === null)", t.m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "unit" in x[0]).find((p2) => p2.id === "p-peper").pack === null);
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
