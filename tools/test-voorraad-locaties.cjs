// Functionele tests voor ADR-015: voorraad-locaties, productcategorieën, winkelvoorkeur,
// boodschappenlijst als platte categorie-lijst en categorieën beheren.
const { loadApp, serialize } = require("./render-harness.cjs");

const APP = "/home/user/weekmenu-app/src/app.js"; // via legacy-path-shim naar repo-root

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
  const selectWithOption = (opt) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "select" && JSON.stringify(n.children || []).indexOf(opt) !== -1) found = n; });
    return found;
  };
  const findRow = (label) => {
    let found = null;
    walk(render(), (n) => {
      if (found || !n || n.type !== "div" || !n.children) return;
      if (n.children.some((c) => c && c.type === "span" && c.children && c.children[0] === label)) found = n;
    });
    return found;
  };
  const childIn = (node, pred) => {
    let found = null;
    walk(node, (n) => { if (!found && pred(n)) found = n; });
    return found;
  };
  const stockState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "loc" in x[0] && "have" in x[0]);
  const locsState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length && x[0] && "id" in x[0] && "name" in x[0] && !("ingredients" in x[0]) && !("loc" in x[0]));
  const settingsState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "householdSize" in x);
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, findTab, findBtn, btnByText, btnByTitle, inputByPlaceholder, selectWithOption, findRow, childIn, stockState, locsState, settingsState, html };
}

// ---------- 1. Defaults: locaties + shopCats, alles ingeklapt ----------
{
  const t = make({});
  const locs = t.locsState();
  check("default-locaties geseed (voorraadkast/koelkast/vriezer/kruidenla/fruitschaal)",
    !!locs && locs.map((l) => l.name).join(",") === "Voorraadkast,Koelkast,Vriezer,Kruidenla,Fruitschaal");
  const st = t.settingsState();
  check("default shopCats in settings (11, vaste volgorde)",
    !!st && JSON.stringify(st.shopCats) === JSON.stringify(["fruit","groente","vlees/vis","kruiden","conserven","(maaltijd)saus","broodbeleg","zuivel","diepvries","lekkers","brood"]));
  const stock = t.stockState();
  check("default voorraad: per product loc+cat+want+have", !!stock && stock.every((s) => s.loc && s.cat && "want" in s && "have" in s));
  t.findTab("Voorraad").props.onClick();
  let h = t.html();
  check("locaties zichtbaar, producten ingeklapt", h.indexOf("Voorraadkast") !== -1 && h.indexOf("Hagelslag") === -1);
  let countSpan = null;
  t.walk(t.render(), (n) => { if (!countSpan && n && n.type === "span" && String(n.props.title || "").indexOf("producten") !== -1) countSpan = n; });
  check("teller toont kaal getal (geen 'producten'-tekst)", !!countSpan && countSpan.children.length === 1 && typeof countSpan.children[0] === "number");

  // ---------- 2. Locatie toevoegen (inline onderaan) + verwijderen ----------
  t.btnByText("Locatie toevoegen").props.onClick();
  let locInput = t.inputByPlaceholder("Naam van de locatie");
  check("inline locatie-formulier verschijnt onderaan", !!locInput);
  locInput.props.onChange({ target: { value: "Bijkeuken" } });
  t.btnByTitle("Locatie toevoegen").props.onClick();
  check("nieuwe locatie toegevoegd", t.locsState().some((l) => l.name === "Bijkeuken"));
  const delEmpty = t.btnByTitle("Locatie verwijderen");
  const delBusy = t.btnByTitle("Verwijderen kan pas");
  check("lege locatie: verwijderknop actief", !!delEmpty && !delEmpty.props.disabled);
  check("bezette locatie: verwijderknop disabled", !!delBusy && delBusy.props.disabled === true);
  const nBefore = t.locsState().length;
  delBusy.props.onClick();
  check("bezette locatie niet verwijderbaar", t.locsState().length === nBefore);
  t.btnByTitle("Locatie verwijderen").props.onClick();
  check("lege locatie wel verwijderbaar", !t.locsState().some((l) => l.name === "Bijkeuken") && t.locsState().length === nBefore - 1);

  // ---------- 3. Uitklappen + product toevoegen (inline form bovenaan locatie) ----------
  t.btnByText("Voorraadkast").props.onClick();
  h = t.html();
  check("uitgeklapt toont producten met categorie eronder", h.indexOf("Hagelslag") !== -1 && h.indexOf("categorie: broodbeleg") !== -1);
  check("gewenste voorraad grijs erachter", h.indexOf("gewenst 1") !== -1);
  t.btnByText("Product toevoegen").props.onClick();
  const nameInput = t.inputByPlaceholder("hagelslag");
  check("inline product-formulier bovenaan de locatie", !!nameInput);
  nameInput.props.onChange({ target: { value: "Kroepoek" } });
  check("Toevoegen disabled zonder categorie", t.btnByText("Toevoegen").props.disabled === true);
  t.selectWithOption("(maaltijd)saus").props.onChange({ target: { value: "(maaltijd)saus" } });
  t.selectWithOption("geen voorkeur").props.onChange({ target: { value: "lidl" } });
  check("Toevoegen enabled met naam+categorie", t.btnByText("Toevoegen").props.disabled === false);
  // gewenste-voorraad-stapper van het formulier (binnen het bg-stone-50 blok)
  let form = null;
  t.walk(t.render(), (n) => { if (!form && n && n.type === "div" && String(n.props.className || "").indexOf("bg-stone-50") !== -1) form = n; });
  const formStepper = t.childIn(form, (n) => n && n.type === "div" && String(n.props.className || "").indexOf("stepper") !== -1);
  formStepper.children.find((c) => c && c.children && c.children[0] === "+").props.onClick(); // want 1 -> 2
  t.btnByText("Toevoegen").props.onClick();
  const added = t.stockState().find((s) => s.name === "Kroepoek");
  check("product toegevoegd met cat/winkel/want/have/loc", !!added && added.cat === "(maaltijd)saus" && added.market === "lidl" && added.want === 2 && added.have === 2 && added.loc === "loc-kast");
  h = t.html();
  check("productrij toont categorie + winkel-chip + gewenst", h.indexOf("categorie: (maaltijd)saus") !== -1 && h.indexOf("Lidl") !== -1 && h.indexOf("gewenst 2") !== -1);

  // ---------- 4. Edit-modus (✏️): gewenste voorraad via stapper ----------
  t.btnByTitle("Gewenste hoeveelheden in deze locatie").props.onClick();
  h = t.html();
  check("edit-modus: grijze 'gewenst'-tekst weg, want-stapper erin", h.indexOf("gewenst 2") === -1 && h.indexOf("Gewenste voorraad aanpassen") !== -1);
  const kRow = t.findRow("Kroepoek");
  const wantSpan = t.childIn(kRow, (n) => n && n.props && String(n.props.title || "") === "Gewenste voorraad aanpassen");
  wantSpan.children.find((c) => c && c.children && c.children[0] === "+").props.onClick();
  check("want via edit-stapper 2 -> 3", t.stockState().find((s) => s.name === "Kroepoek").want === 3);
  t.btnByTitle("Gewenste hoeveelheden niet meer").props.onClick();
  check("edit-modus uit: 'gewenst 3' grijs terug", t.html().indexOf("gewenst 3") !== -1);

  // ---------- 5. Huidige voorraad aanpassen -> tekort; product altijd verwijderbaar ----------
  if (!t.findRow("Melk")) t.btnByText("Koelkast").props.onClick();
  const melkRow = t.findRow("Melk");
  const haveSpan = t.childIn(melkRow, (n) => n && n.props && String(n.props.title || "") === "Huidige voorraad");
  haveSpan.children.find((c) => c && c.children && c.children[0] === "−").props.onClick(); // 2 -> 1
  const melk = t.stockState().find((s) => s.name === "Melk");
  check("have aanpasbaar via stepper (Melk 2 -> 1, tekort)", melk.have === 1 && melk.want === 2);
  check("tekort gemarkeerd ('op lijst')", t.html().indexOf("op lijst") !== -1);
  const kRow2 = t.findRow("Kroepoek");
  t.childIn(kRow2, (n) => n && n.type === "button" && n.props.title === "Product verwijderen").props.onClick();
  check("product altijd verwijderbaar", !t.stockState().some((s) => s.name === "Kroepoek"));

  // ---------- 6. Boodschappenlijst: platte lijst, categorie-volgorde, geen categorietekst ----------
  t.findTab("Boodschappen").props.onClick();
  let h2 = t.html();
  check("tekort in de platte lijst met (n van want); geen sectiekoppen meer (ADR-016)",
    h2.indexOf("Standaardvoorraad aanvullen") === -1 && h2.indexOf('"Extra"') === -1 && h2.indexOf("Melk") !== -1 && h2.indexOf("1 van 2") !== -1);
  check("geen categorietekst op de boodschappenlijst", h2.indexOf("categorie:") === -1);
  t.inputByPlaceholder("Extra artikel").props.onChange({ target: { value: "Chips" } });
  t.selectWithOption("geen categorie").props.onChange({ target: { value: "lekkers" } });
  t.btnByText("Toevoegen").props.onClick();
  t.inputByPlaceholder("Extra artikel").props.onChange({ target: { value: "Appel" } });
  t.selectWithOption("geen categorie").props.onChange({ target: { value: "fruit" } });
  t.btnByText("Toevoegen").props.onClick();
  h2 = t.html();
  check("extra artikelen gesorteerd op categorie (fruit vóór lekkers)", h2.indexOf("Appel") !== -1 && h2.indexOf("Chips") !== -1 && h2.indexOf("Appel") < h2.indexOf("Chips"));

  // ---------- 7. Categorieën beheren (inline paneel): toevoegen, volgorde, verwijderen ----------
  t.btnByTitle("Categorieën beheren").props.onClick();
  h2 = t.html();
  check("categorieënpaneel opent met alle categorieën", h2.indexOf("Categorieën") !== -1 && h2.indexOf("(maaltijd)saus") !== -1);
  t.inputByPlaceholder("Nieuwe categorie").props.onChange({ target: { value: "snacks" } });
  t.btnByText("＋").props.onClick();
  check("categorie 'snacks' toegevoegd aan settings.shopCats", t.settingsState().shopCats.includes("snacks"));
  const firstDown = t.findBtn((n) => n.children && n.children[0] === "▼" && !n.props.disabled);
  firstDown.props.onClick();
  check("volgorde aanpasbaar (eerste categorie schuift omlaag)", t.settingsState().shopCats[0] === "groente" && t.settingsState().shopCats[1] === "fruit");
  const snacksRow = t.findRow("snacks");
  const delSnacks = t.childIn(snacksRow, (n) => n && n.type === "button" && String(n.props.title || "") === "Categorie verwijderen");
  const fruitRow = t.findRow("fruit");
  const delFruit = t.childIn(fruitRow, (n) => n && n.type === "button" && n.props.title !== undefined);
  check("ongebruikte categorie verwijderbaar (actief)", !!delSnacks && !delSnacks.props.disabled);
  check("gebruikte categorie (fruit, via Appels) disabled", !!delFruit && delFruit.props.disabled === true);
  delSnacks.props.onClick();
  check("categorie 'snacks' verwijderd", !t.settingsState().shopCats.includes("snacks"));

  // ---------- 8. Info-popover ----------
  t.findTab("Voorraad").props.onClick();
  t.btnByTitle("Hoe werkt de voorraad?").props.onClick();
  check("ℹ️ opent popover met uitleg", t.html().indexOf("zijn per huishouden") !== -1);
  t.btnByTitle("Hoe werkt de voorraad?").props.onClick();
  check("ℹ️ sluit popover weer", t.html().indexOf("zijn per huishouden") === -1);

  // ---------- 9. Alles aangevuld / Standaardlijst terug ----------
  t.btnByText("Alles aangevuld").props.onClick();
  check("Alles aangevuld: have = want", t.stockState().every((s) => s.have === s.want));
  t.btnByText("Standaardlijst terug").props.onClick();
  check("Standaardlijst terug: default voorraad (17) + default locaties (5)", t.stockState().length === 17 && t.locsState().length === 5);
}

// ---------- 10. Migratie van het oude model (cat was locatie; extraItems als strings) ----------
{
  const t = make({ stock: [{ name: "Hagelslag", cat: "kast", want: 1, have: 1 }, { name: "Melk", cat: "koel", qty: 2 }, { name: "Zout", cat: "kruiden", want: 1, have: 0 }] });
  const stock = t.stockState();
  const h = stock.find((s) => s.name === "Hagelslag");
  const m = stock.find((s) => s.name === "Melk");
  const z = stock.find((s) => s.name === "Zout");
  check("migratie: kast -> loc-kast + cat conserven", h.loc === "loc-kast" && h.cat === "conserven" && h.want === 1 && h.have === 1);
  check("migratie: koel -> loc-koel + cat zuivel (qty -> want/have)", m.loc === "loc-koel" && m.cat === "zuivel" && m.want === 2 && m.have === 2);
  check("migratie: kruiden -> loc-kruiden + cat kruiden", z.loc === "loc-kruiden" && z.cat === "kruiden");
  const t2 = make({ extraItems: ["Chips"] });
  t2.findTab("Boodschappen").props.onClick();
  check("oude extraItems (string) gemigreerd en zichtbaar", t2.html().indexOf("Chips") !== -1);
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
