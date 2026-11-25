// Tests voor ADR-018 (recepten-tab): sorteren op "laatst gegeten" (alleen vergrendelde dagen t/m vandaag;
// Onbekend = bovenaan; badge "🕒 …" alleen bij die sortering; altijd platte lijst), readonly-rij met
// klikbare ingrediënt-chips (prodchip -> inline product-kaart, zoals ADR-017), edit via ✏️-knop inline
// (categorie als chips), en "Nieuw recept" met inline ingrediënt-rijen + autocomplete (zelfde als bewerken).
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() + n); return x; };

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
    walk(render(), (n) => { if (n && n.type === "button" && String(n.props["aria-label"] || n.props.title || "") === label) found = n; });
    return found;
  };
  const buttonsWithText = (text) => {
    const out = [];
    walk(render(), (n) => { if (n && n.type === "button" && JSON.stringify(n.children || []).indexOf(text) !== -1) out.push(n); });
    return out;
  };
  const chipButtons = (text) => {
    const out = [];
    walk(render(), (n) => {
      if (n && n.type === "button" && String(n.props.className || "").indexOf("chip") === 0 && JSON.stringify(n.children || []).indexOf(text) !== -1) out.push(n);
    });
    return out;
  };
  const iconBtn = (title) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "button" && n.props.className === "iconbtn" && n.props.title === title) found = n; });
    return found;
  };
  const inputWithPlaceholder = (ph) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "input" && n.props.placeholder === ph) found = n; });
    return found;
  };
  const goRecipes = () => { findTab("Recepten").props.onClick(); render(); };
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length > 0 && x[0] && x[0].id && x[0].name && "cat" in x[0]);
  const newRecipeState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "tagDraft" in x);
  render();
  return { m, render, walk, findTab, buttonsWithText, chipButtons, iconBtn, inputWithPlaceholder, goRecipes, recipesState, newRecipeState, html: () => JSON.stringify(serialize(render())) };
}

// 1. Sorteerknop in de filterrij (naast "⚙ Filters ▾"): dropdown met Naam (A–Z) / Laatst gegeten; badges alleen bij "laatst".
{
  const t = make({});
  t.goRecipes();
  let h = t.html();
  check("sorteerknop '⇅ Sorteer ▾' aanwezig (1×, naast filterknop)", t.chipButtons("Sorteer").length === 1 && t.chipButtons("Filters").length === 1);
  check("standaard (naam): geen '🕒'-badges", h.indexOf("🕒") === -1);
  check("standaard (naam): gegroepeerd, geen teller", h.indexOf("van 52 recepten") === -1);
  t.chipButtons("Sorteer")[0].props.onClick();
  h = t.html();
  check("dropdown open: 'Naam (A–Z)' + 'Laatst gegeten (langst geleden eerst)'", h.indexOf("Naam (A–Z)") !== -1 && h.indexOf("Laatst gegeten (langst geleden eerst)") !== -1);
  t.buttonsWithText("Laatst gegeten (langst geleden eerst)")[0].props.onClick();
  h = t.html();
  check("na keuze 'laatst': platte lijst met teller + chip '🕒 Laatst gegeten'", h.indexOf("van 52 recepten") !== -1 && h.indexOf("Laatst gegeten") !== -1);
  check("badges '🕒 Onbekend' zichtbaar bij sorteren (niets in menu = Onbekend)", h.indexOf("Onbekend") !== -1);
  check("dropdown gesloten na keuze", h.indexOf("Naam (A–Z)") === -1);
  // terug naar Naam (A–Z) via dropdown
  t.chipButtons("Sorteer")[0].props.onClick();
  t.buttonsWithText("Naam (A–Z)")[0].props.onClick();
  h = t.html();
  check("terug op naam: geen badges, gegroepeerd", h.indexOf("🕒") === -1 && h.indexOf("van 52 recepten") === -1);
}

// 2. Sorteervolgorde "laatst gegeten": alleen vergrendelde dagen t/m vandaag; Onbekend bovenaan; platte lijst.
{
  const today = new Date();
  const kToday = dateKey(today);
  const k10 = dateKey(addDays(today, -10));
  const k40 = dateKey(addDays(today, -40));
  const kFuture = dateKey(addDays(today, 5));
  const seed = {
    recipes: [
      { id: "a1", name: "Alpha", cat: "vega", ingredients: ["1 appel"], bereiding: "", tags: [] },
      { id: "a2", name: "Beta", cat: "vega", ingredients: ["1 banaan"], bereiding: "", tags: [] },
      { id: "a3", name: "Gamma", cat: "vis", ingredients: ["1 gamba"], bereiding: "", tags: [] },
    ],
    menuByDate: {
      [k10]: { id: "a1", locked: true },
      [k40]: { id: "a3", locked: true },
      [kToday]: { id: "a2", locked: false }, // niet vergrendeld -> telt NIET mee
      [kFuture]: { id: "a2", locked: true },  // toekomst -> telt NIET mee
    },
  };
  const t = make(seed);
  t.goRecipes();
  t.chipButtons("Sorteer")[0].props.onClick();
  t.buttonsWithText("Laatst gegeten (langst geleden eerst)")[0].props.onClick();
  const h = t.html();
  const iB = h.indexOf("Beta"), iG = h.indexOf("Gamma"), iA = h.indexOf("Alpha");
  check("volgorde: Onbekend (Beta) bovenaan, dan Gamma (40d geleden), dan Alpha (10d geleden)", iB !== -1 && iG !== -1 && iA !== -1 && iB < iG && iG < iA);
  check("badges: '5 wk geleden' (Gamma) en '1 wk geleden' (Alpha)", h.indexOf("5 wk geleden") !== -1 && h.indexOf("1 wk geleden") !== -1);
  check("Beta heeft badge 'Onbekend' (alleen niet-vergrendeld/vorige lock telt niet)", h.indexOf("Onbekend") !== -1);
  check("platte lijst (teller 'van 3 recepten'), geen categorie-koppen", h.indexOf("3 van 3 recepten") !== -1);
}

// 3. Readonly-rij: klik opent detail met prodchips + bereiding; klik op chip opent product-kaart (zoals ADR-017 elders).
{
  const t = make({ recipes: [{ id: "t1", name: "Testsoep", cat: "vega", ingredients: ["2 paprika's", "1 blik kokosmelk"], bereiding: "Doe alles in de pan." }] });
  t.goRecipes();
  t.buttonsWithText("Testsoep")[0].props.onClick();
  let h = t.html();
  check("rij-klik opent readonly-detail: Ingrediënten + prodchips + Bereiding", h.indexOf("Ingrediënten") !== -1 && h.indexOf("prodchip") !== -1 && h.indexOf("Doe alles in de pan.") !== -1);
  check("readonly-detail toont geen bewerkformulier", h.indexOf("Recept verwijderen") === -1);
  let chip = null;
  t.walk(t.render(), (n) => { if (!chip && n && n.type === "button" && n.props.className === "prodchip" && JSON.stringify(n.children || []).indexOf("kokosmelk") !== -1) chip = n; });
  check("prodchip voor '1 blik kokosmelk' gevonden", !!chip);
  chip.props.onClick();
  h = t.html();
  check("klik op chip opent inline product-kaart (Opslaan/Verwijderen) in het detail", h.indexOf("Opslaan") !== -1 && h.indexOf("Verwijderen") !== -1);
}

// 4. Edit via ✏️ inline; categorie als chips.
{
  const t = make({ recipes: [{ id: "t1", name: "Testsoep", cat: "vega", ingredients: ["2 paprika's"], bereiding: "x" }] });
  t.goRecipes();
  check("✏️-knop per rij aanwezig", !!t.iconBtn("Recept bewerken"));
  t.iconBtn("Recept bewerken").props.onClick();
  const h = t.html();
  check("✏️ opent bewerkformulier inline ('Recept verwijderen' zichtbaar)", h.indexOf("Recept verwijderen") !== -1);
  check("categorie als chips in het bewerkformulier", t.chipButtons("Vlees").length === 1 && t.chipButtons("Vega").length >= 1);
  t.chipButtons("Vlees")[0].props.onClick();
  check("chip 'Vlees' wijzigt categorie van het recept", t.recipesState().find((r) => r.id === "t1").cat === "vlees");
}

// 5. Nieuw recept: inline ingrediënt-rijen met autocomplete (zelfde als bij bewerken); geen textarea meer.
{
  const t = make({});
  t.goRecipes();
  t.iconBtn("Recept toevoegen").props.onClick();
  let h = t.html();
  check("sheet 'Nieuw recept' zonder textarea 'één per regel'", h.indexOf("één per regel") === -1);
  const addBtn = t.buttonsWithText("Ingrediënt toevoegen")[0];
  check("'＋ Ingrediënt toevoegen' aanwezig in de sheet", !!addBtn);
  addBtn.props.onClick();
  const nameInputs = [];
  t.walk(t.render(), (n) => { if (n && n.type === "input" && n.props.placeholder === "Productnaam…") nameInputs.push(n); });
  check("lege inline ingrediënt-rij met autocomplete-veld Verschijnt", nameInputs.length === 1);
  nameInputs[0].props.onChange({ target: { value: "pap" } });
  h = t.html();
  check("autocomplete toont suggestielijst met gematcht product (Paprika)", h.indexOf("suggest-list") !== -1 && h.indexOf("rika") !== -1);
  let ni = null;
  t.walk(t.render(), (n) => { if (n && n.type === "input" && n.props.placeholder === "Productnaam…") ni = n; });
  ni.props.onKeyDown({ key: "Enter", preventDefault() {} });
  const nr = t.newRecipeState();
  check("Enter op suggestie koppelt product (pid) aan de nieuwe ingrediënt-rij", nr.ingredients.length === 1 && !!nr.ingredients[0].pid);
  t.inputWithPlaceholder("Naam…").props.onChange({ target: { value: "Nieuw gerecht" } });
  t.buttonsWithText("Toevoegen")[0].props.onClick();
  const rs = t.recipesState();
  const added = rs[rs.length - 1];
  check("recept toegevoegd met gestructureerd ingrediënt (pid, amount/unit/name)", added.name === "Nieuw gerecht" && added.ingredients.length === 1 && !!added.ingredients[0].pid && added.ingredients[0].name === "Paprika");
  check("newRecipe gereset na Toevoegen (ingredients weer leeg)", t.newRecipeState().ingredients.length === 0);
}

console.log(fails === 0 ? "\nALLE SORTEREN-READONLY-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
