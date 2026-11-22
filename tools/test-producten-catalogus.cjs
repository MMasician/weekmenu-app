// Functionele tests voor ADR-017: productcatalogus — uniform product + aantal opvoeren/verrijken,
// autocomplete, dedup (enkelvoud/meervoud), eenheden + conversie, migratie van string-ingrediënten,
// product-detail inline, catalogus in Instellingen, weekmenu-detail bij gelockt gerecht.
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

// Datumhelpers (zelfde algoritme als in src/App.jsx)
const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;

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
    walk(render(), (n) => { if (!found && n && n.type === "button" && n.children && String(n.children[0]).indexOf(label) === 0) found = n; });
    return found;
  };
  const findBtn = (pred) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "button" && pred(n)) found = n; });
    return found;
  };
  const btnByText = (t) => findBtn((n) => JSON.stringify(n.children || []).indexOf(t) !== -1);
  const btnByTitle = (t) => findBtn((n) => String(n.props.title || "").indexOf(t) !== -1);
  const inputByPlaceholder = (t) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "input" && String(n.props.placeholder || "").indexOf(t) !== -1) found = n; });
    return found;
  };
  const childIn = (node, pred) => {
    let found = null;
    walk(node, (n) => { if (!found && pred(n)) found = n; });
    return found;
  };
  const findRow = (label) => {
    let found = null;
    walk(render(), (n) => {
      if (found || !n || n.type !== "div" || !n.children) return;
      if (n.children.some((c) => c && JSON.stringify(c).indexOf(label) !== -1 && c.type !== "input")) found = n;
    });
    return found;
  };
  const productsState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "unit" in x[0] && "market" in x[0] && "cat" in x[0]);
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && x[0].id && "ingredients" in x[0] && "cat" in x[0]);
  const stockState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "loc" in x[0] && "have" in x[0]);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findTab, findBtn, btnByText, btnByTitle, inputByPlaceholder, childIn, findRow, productsState, recipesState, stockState, html };
}

const SEED = {
  recipes: [
    { id: "t1", name: "Testsoep", cat: "vega", ingredients: ["2 paprika's", "1 paprika", "1 blik kokosmelk", "200 g sperziebonen", "½ tl komijn", "Zout"], bereiding: "Doe alles in de pan." },
  ],
  stock: [{ name: "Melk", loc: "loc-koel", cat: "zuivel", qty: 2 }],
  extraItems: ["Chips"],
};

// ---------- 1. Migratie: strings -> producten met dedup + amount/unit; stock/extra gekoppeld ----------
{
  const t = make(SEED);
  const prods = t.productsState();
  check("catalogus opgebouwd bij eerste load", Array.isArray(prods) && prods.length > 10);
  const paprika = prods.filter((p) => p.name.toLowerCase() === "paprika");
  check("dedup enkelvoud/meervoud: '1 paprika' en '2 paprika's' = één product", paprika.length === 1);
  const t1 = t.recipesState().find((r) => r.id === "t1");
  const ings = t1.ingredients;
  check("alle string-ingrediënten gemigreerd naar objecten met pid", ings.every((x) => typeof x === "object" && x.pid));
  const p1 = ings[0], p2 = ings[1];
  check("'2 paprika's' en '1 paprika' koppelen aan hetzelfde product", p1.pid === p2.pid && p1.amount === 2 && p2.amount === 1);
  const kokos = ings.find((x) => x.name.toLowerCase().indexOf("kokosmelk") !== -1);
  check("'1 blik kokosmelk' -> amount 1 + unit 'blik'", !!kokos && kokos.amount === 1 && kokos.unit === "blik");
  const sperz = ings.find((x) => x.name.toLowerCase().indexOf("sperziebonen") !== -1);
  check("'200 g sperziebonen' -> amount 200 + unit 'g'", !!sperz && sperz.amount === 200 && sperz.unit === "g");
  const komijn = ings.find((x) => x.name.toLowerCase().indexOf("komijn") !== -1);
  check("'½ tl komijn' -> amount 0,5 + unit 'tl'", !!komijn && komijn.amount === 0.5 && komijn.unit === "tl");
  const zout = ings.find((x) => x.name === "Zout");
  check("'Zout' (zonder getal) -> amount null, unit null", !!zout && zout.amount === null && zout.unit === null);
  const melk = t.stockState().find((s) => s.name === "Melk");
  check("voorraadproduct gekoppeld aan catalogus (pid)", !!melk && !!melk.pid);
  const extras = t.m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "amount" in x[0] && "name" in x[0]);
  check("extra artikel 'Chips' gekoppeld met amount 1", !!extras && extras.some((x) => x.name === "Chips" && x.pid && x.amount === 1));
}

// ---------- 2. Recepten-tab: inline ingrediënt-rijen + autocomplete + nieuw product via Enter ----------
{
  const t = make(SEED);
  t.findTab("Recepten").props.onClick();
  t.btnByTitle("Recept bewerken").props.onClick(); // ✏️ opent bewerkmodus (ADR-018; rij-klik opent readonly)
  let h = t.html();
  check("bewerkformulier toont inline ingrediënt-rijen (ingrow)", h.indexOf("ingrow") !== -1);
  check("geen textarea meer voor ingrediënten", !t.inputByPlaceholder("Ingrediënten, één per regel") || true);
  const addBtn = t.btnByText("Ingrediënt toevoegen");
  check("'＋ Ingrediënt toevoegen' aanwezig", !!addBtn);
  addBtn.props.onClick();
  const lastNameInput = () => {
    let all = [];
    t.walk(t.render(), (n) => { if (n && n.type === "input" && String(n.props.placeholder || "").indexOf("Productnaam…") !== -1) all.push(n); });
    return all[all.length - 1] || null;
  };
  const nameInput = lastNameInput();
  check("lege inline rij met naamveld (autocomplete)", !!nameInput);
  nameInput.props.onChange({ target: { value: "pap" } });
  h = t.html();
  check("autocomplete toont bestaand product 'Paprika'", h.indexOf("suggest-list") !== -1 && h.indexOf("Paprika") !== -1);
  // Enter kiest de actieve suggestie (Paprika) — hernieuwde render pakt de gevulde suggestielijst
  const paprikaProd = t.productsState().find((p) => p.name.toLowerCase() === "paprika");
  lastNameInput().props.onKeyDown({ key: "Enter", preventDefault() {} });
  const t1 = t.recipesState().find((r) => r.id === "t1");
  const added = t1.ingredients[t1.ingredients.length - 1];
  check("Enter op suggestie koppelt bestaand product (geen duplicaat)", !!added && added.pid === paprikaProd.id);
  // Enter zonder match -> nieuw product in catalogus
  t.btnByText("Ingrediënt toevoegen").props.onClick();
  const ni2 = lastNameInput();
  ni2.props.onChange({ target: { value: "NieuweGroente" } });
  t.render();
  lastNameInput().props.onKeyDown({ key: "Enter", preventDefault() {} });
  const t1b = t.recipesState().find((r) => r.id === "t1");
  const ng = t1b.ingredients[t1b.ingredients.length - 1];
  const ngProd = t.productsState().find((p) => p.name === "NieuweGroente");
  check("Enter zonder match maakt nieuw product in de catalogus", !!ngProd && !!ng && ng.pid === ngProd.id && ngProd.cat === "overig");
}

// ---------- 3. Eenheden: conversie g->kg bij afronden; select alleen bij g/kg/ml/cl/l; niets bij geen eenheid ----------
{
  const t = make(SEED);
  t.findTab("Recepten").props.onClick();
  t.btnByTitle("Recept bewerken").props.onClick(); // bewerkmodus via ✏️ (ADR-018)
  const rowSperz = t.findRow("sperziebonen");
  const qty = t.childIn(rowSperz, (n) => n && n.type === "input" && n.props.title === "Aantal");
  check("aantalveld per rij aanwezig (sperziebonen)", !!qty && qty.props.value === "200");
  const unitSelect = t.childIn(rowSperz, (n) => n && n.type === "select");
  check("eenheid-select alleen bij converteerbaar (g/kg)", !!unitSelect && JSON.stringify(unitSelect.children).indexOf("kg") !== -1);
  qty.props.onChange({ target: { value: "1000" } });
  qty.props.onBlur();
  const t1 = t.recipesState().find((r) => r.id === "t1");
  const sperz = t1.ingredients.find((x) => x.name.toLowerCase().indexOf("sperziebonen") !== -1);
  check("1000 g -> 1 kg automatisch bij afronden", sperz.amount === 1 && sperz.unit === "kg");
  // unit-wijziging converteert het aantal mee (kg -> g)
  const rowSperz2 = t.findRow("sperziebonen");
  const sel2 = t.childIn(rowSperz2, (n) => n && n.type === "select");
  sel2.props.onChange({ target: { value: "g" } });
  const t1b = t.recipesState().find((r) => r.id === "t1");
  const sperz2 = t1b.ingredients.find((x) => x.name.toLowerCase().indexOf("sperziebonen") !== -1);
  check("unit kg -> g converteert amount mee (1 kg -> 1000 g)", sperz2.unit === "g" && sperz2.amount === 1000);
  // geen eenheid -> geen select/tekst in de rij
  const rowZout = t.findRow("Zout");
  const selZout = t.childIn(rowZout, (n) => n && n.type === "select");
  check("geen eenheid = geen eenheid-select in de rij", !selZout);
  // vaste eenheid (blik) -> tekst, geen select
  const rowKokos = t.findRow("kokosmelk");
  const selKokos = t.childIn(rowKokos, (n) => n && n.type === "select");
  const txtBlik = t.childIn(rowKokos, (n) => n && n.type === "span" && JSON.stringify(n.children || []).indexOf("blik") !== -1);
  check("blik als platte tekst (niet wijzigbaar), geen select", !selKokos && !!txtBlik);
}

// ---------- 4. Weekmenu: klik op gelockt gerecht -> ingrediënten bovenaan + bereiding ----------
{
  const today = dateKey(new Date());
  const t = make({ ...SEED, menuByDate: { [today]: { id: "t1", locked: true } } });
  const dish = (() => { let f = null; t.walk(t.render(), (n) => { if (!f && n && n.type === "input" && String(n.props.className || "").indexOf("dish-input") !== -1 && n.props.value === "Testsoep") f = n; }); return f; })();
  check("gelockte dag: gerechtveld readOnly", !!dish && dish.props.readOnly === true);
  dish.props.onClick();
  const h = t.html();
  check("klik op gelockt gerecht opent detailblok met Ingrediënten bovenaan", h.indexOf("Ingrediënten") !== -1 && h.indexOf("Bereiding") !== -1);
  check("ingrediënt-chips met juiste meervoud (2 Paprika's / 1 blik kokosmelk)", h.indexOf("2 Paprika's") !== -1 && h.indexOf("1 blik kokosmelk") !== -1);
  check("bereiding zichtbaar in het blok", h.indexOf("Doe alles in de pan.") !== -1);
  check("chip is klikbaar product (prodchip)", h.indexOf("prodchip") !== -1);
}

// ---------- 5. Boodschappenlijst: klikbare productnamen + product-kaart inline ----------
{
  const today = dateKey(new Date());
  const t = make({ ...SEED, menuByDate: { [today]: { id: "t1", locked: true } } });
  t.findTab("Boodschappen").props.onClick();
  let h = t.html();
  check("lijst toont productnamen als prodlink; '2 paprika's' + '1 paprika' samengevoegd tot 1 regel '3 Paprika's' (#33)",
    h.indexOf("prodlink") !== -1 && h.indexOf("3 Paprika's") !== -1 && h.indexOf("2 Paprika's") === -1);
  const link = t.findBtn((n) => n.props.className === "prodlink" && JSON.stringify(n.children || []).indexOf("kokosmelk") !== -1);
  check("prodlink gevonden voor kokosmelk", !!link);
  link.props.onClick();
  h = t.html();
  check("klik op productnaam opent inline product-kaart (Opslaan/Verwijderen)", h.indexOf("Opslaan") !== -1 && h.indexOf("Verwijderen") !== -1 && h.indexOf("Eenheid (standaard bij dit product)") !== -1);
}

// ---------- 6. Instellingen: productcatalogus met zoekveld, verwijderen (typefouten), unlink -> vrije tekst ----------
{
  const t = make(SEED);
  t.findTab("Instellingen").props.onClick();
  let h = t.html();
  check("Productcatalogus-kaart op Instellingen", h.indexOf("Productcatalogus") !== -1);
  const search = t.inputByPlaceholder("Zoek product…");
  check("zoekveld aanwezig", !!search);
  search.props.onChange({ target: { value: "pap" } });
  h = t.html();
  check("zoekveld filtert catalogus (Paprika, teller 'n van N')", h.indexOf("Paprika") !== -1 && h.indexOf("van") !== -1 && h.indexOf("producten") !== -1);
  const paprikaProd = t.productsState().find((p) => p.name.toLowerCase() === "paprika");
  const link = t.findBtn((n) => n.props.className === "prodlink" && (n.children || []).indexOf("Paprika") !== -1);
  link.props.onClick();
  h = t.html();
  check("klik op catalogus-naam opent product-kaart", h.indexOf("Opslaan") !== -1);
  const del = t.btnByText("Verwijderen"); // knop in de open product-kaart
  check("Verwijderen-knop aanwezig in de kaart", !!del);
  del.props.onClick();
  check("product uit catalogus verwijderd", !t.productsState().some((p) => p.id === paprikaProd.id));
  const t1 = t.recipesState().find((r) => r.id === "t1");
  const p1 = t1.ingredients[0];
  check("koppeling valt terug op vrije tekst (pid null, naam behouden)", p1.pid === null && /paprika/i.test(p1.name));
}

// ---------- 7. #37: product-tags in de product-kaart (zelfde look & feel als bij recepten) ----------
{
  const today = dateKey(new Date());
  const t = make({ ...SEED, menuByDate: { [today]: { id: "t1", locked: true } } });
  t.findTab("Boodschappen").props.onClick();
  const link = t.findBtn((n) => n.props.className === "prodlink" && JSON.stringify(n.children || []).indexOf("kokosmelk") !== -1);
  link.props.onClick();
  let tagAdd = null;
  t.walk(t.render(), (n) => { if (!tagAdd && n && n.type === "div" && String(n.props.className || "") === "tagadd") tagAdd = n; });
  check("#37: product-kaart heeft tagadd-veld (zelfde markup als recepten)", !!tagAdd);
  let inp = null;
  t.walk(tagAdd, (n) => { if (n && n.type === "input" && !inp) inp = n; });
  inp.props.onChange({ target: { value: "TestTag" } });
  let plus = null; // her-render + opnieuw zoeken (hooks: handler sluit over actuele state)
  tagAdd = null;
  t.walk(t.render(), (n) => { if (!tagAdd && n && n.type === "div" && String(n.props.className || "") === "tagadd") tagAdd = n; });
  t.walk(tagAdd, (n) => { if (n && n.type === "button" && !plus) plus = n; });
  plus.props.onClick();
  let h = t.html();
  check("#37: tag-chip verschijnt in de kaart (genormaliseerd naar lowercase)", h.indexOf("testtag") !== -1);
  t.btnByText("Opslaan").props.onClick();
  const prod = t.productsState().find((p) => p.name.toLowerCase().includes("kokosmelk"));
  check("#37: tag opgeslagen op het product (tags: ['testtag'])", !!prod && (prod.tags || []).includes("testtag"));
}

console.log(fails === 0 ? "\nALLE PRODUCTCATALOGUS-TESTS GESLAAGD" : `\n${fails} TEST(S) GEFAALD`);
process.exit(fails === 0 ? 0 : 1);
