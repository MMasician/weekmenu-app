// Tests voor de recepten-tab met zoeken/filteren, tags en bereidingstijd-categorie (ADR-013, zie docs/SPECS.md "Recepten"):
// - seed timeCat (lang: r2/r24/r36/r37/r42/r45/r51, kort: r17/r41, rest normaal) en geen time/cook meer in het model
// - migratie van oude `time` (minuten): <=25 kort, >=45 lang, anders normaal; `cook` wordt gewist; tags/timeCat aangevuld
// - zoekbalk op naam + teller "n van N recepten"; filterchips tijd; ingrediënt "bevat"; tags AND; top-5 tagchips + "meer"
// - actieve filterchips met × en "Alles wissen"; bij filters platte lijst, anders gegroepeerd per categorie
// - info-tekst pas na ℹ️-icoon; toevoegen pas na ＋-icoon (bottom sheet) met timeCat/tags
// - bewerken: segmented bereidingstijd, tags toevoegen/verwijderen, géén "wie kan dit koken"-veld
// - weekmenu-dagregel toont tijd-badge (kort/normaal/lang), geen "X min"/kok meer
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
    walk(render(), (n) => { if (n && n.type === "button" && n.children && String(n.children[0]) === label) found = n; });
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
  const nodesWithClass = (sub) => {
    const out = [];
    walk(render(), (n) => { if (n && n.props && String(n.props.className || "").indexOf(sub) !== -1) out.push(n); });
    return out;
  };
  const inputWithPlaceholder = (ph) => {
    let found = null;
    walk(render(), (n) => { if (n && n.type === "input" && n.props.placeholder === ph) found = n; });
    return found;
  };
  const seglButton = (label) => {
    const seg = nodesWithClass("segl")[0];
    if (!seg) return null;
    let found = null;
    walk(seg, (n) => { if (n && n.type === "button" && JSON.stringify(n.children || []).indexOf(label) !== -1) found = n; });
    return found;
  };
  const goRecipes = () => { findTab("Recepten").props.onClick(); render(); };
  const recipesState = () => m.hooks.state.find((x) => Array.isArray(x) && x.length > 0 && x[0] && x[0].id && x[0].name && "cat" in x[0]);
  const newRecipeState = () => m.hooks.state.find((x) => x && !Array.isArray(x) && typeof x === "object" && "tagDraft" in x);
  render();
  return { m, render, walk, findTab, buttonsWithText, chipButtons, iconBtn, nodesWithClass, inputWithPlaceholder, seglButton, goRecipes, recipesState, newRecipeState, html: () => JSON.stringify(serialize(render())) };
}

// 1. Seed: timeCat volgens ADR-013; geen time/cook in het model.
{
  const t = make({});
  const rs = t.recipesState();
  const byId = Object.fromEntries(rs.map((r) => [r.id, r]));
  check("52 seed-recepten", rs.length === 52);
  check("kort: r17 Tortelloni + r41 Kip Siam", byId.r17.timeCat === "kort" && byId.r41.timeCat === "kort");
  check("lang: r2/r24/r36/r37/r42/r45/r51", ["r2", "r24", "r36", "r37", "r42", "r45", "r51"].every((id) => byId[id].timeCat === "lang"));
  check("overige seed = normaal (r1)", byId.r1.timeCat === "normaal");
  check("geen time/cook meer in model", rs.every((r) => !("time" in r) && !("cook" in r)));
  check("tags is een array", rs.every((r) => Array.isArray(r.tags)));
}

// 2. Migratie van oude opslag (time in minuten, cook) naar timeCat/tags.
{
  const t = make({
    recipes: [
      { id: "x1", name: "Oud kort", cat: "vega", ingredients: [], bereiding: "", time: 20, cook: "Iemand" },
      { id: "x2", name: "Oud lang", cat: "vlees", ingredients: [], bereiding: "", time: 60 },
      { id: "x3", name: "Oud midden", cat: "vis", ingredients: [], bereiding: "", time: 30 },
      { id: "x4", name: "Zonder tijd", cat: "extra", ingredients: [], bereiding: "" },
    ],
  });
  const rs = t.recipesState();
  const byId = Object.fromEntries(rs.map((r) => [r.id, r]));
  check("migratie: time 20 -> kort", byId.x1.timeCat === "kort");
  check("migratie: time 60 -> lang", byId.x2.timeCat === "lang");
  check("migratie: time 30 -> normaal", byId.x3.timeCat === "normaal");
  check("migratie: geen time -> normaal", byId.x4.timeCat === "normaal");
  check("migratie: cook gewist, geen time", rs.every((r) => !("cook" in r) && !("time" in r)));
  check("migratie: tags aangevuld als []", rs.every((r) => Array.isArray(r.tags)));
}

// 3. Recepten-tab: zoekbalk, info pas na ℹ️, toevoegen pas na ＋, export/import onderaan.
{
  const t = make({});
  t.goRecipes();
  let h = t.html();
  check("zoekbalk aanwezig (recipe-search)", !!t.nodesWithClass("recipe-search")[0]);
  check("info-tekst verborgen zonder ℹ️", h.indexOf("Zoek op receptnaam en filter") === -1);
  t.iconBtn("Hoe werkt zoeken en filteren?").props.onClick();
  check("info-tekst zichtbaar na ℹ️", t.html().indexOf("Zoek op receptnaam en filter") !== -1);
  check("geen 'Nieuw recept'-formulier zonder ＋", t.html().indexOf("Nieuw recept") === -1);
  check("export/import/reset onderaan aanwezig", t.html().indexOf("Exporteren") !== -1 && t.html().indexOf("Importeren") !== -1 && t.html().indexOf("Standaardlijst terug") !== -1);
  check("zonder filters: gegroepeerd per categorie (Vega-kop)", t.nodesWithClass("rounded-full").length >= 4);
  check("rijen tonen tijd-badge (tb-kort/tb-lang/tb-normaal)", ["tb-kort", "tb-lang", "tb-normaal"].every((c) => t.html().indexOf(c) !== -1));
  check("geen 'wie kan dit koken' in de lijst", h.indexOf("Wie kan dit koken") === -1);
}

// 4. Zoeken op naam: teller + platte resultaatlijst + actieve filterchip + Alles wissen.
{
  const t = make({});
  t.goRecipes();
  let inp = t.nodesWithClass("recipe-search")[0];
  inp.props.onChange({ target: { value: "zalm" } });
  let h = t.html();
  check("zoek 'zalm': teller '4 van 52 recepten'", h.indexOf("4 van 52 recepten") !== -1);
  check("zoek 'zalm': Zalm tandoori zichtbaar", h.indexOf("Zalm tandoori") !== -1);
  check("zoek 'zalm': Lasagne niet zichtbaar", h.indexOf("Lasagne") === -1);
  check("actieve filterchip 🔍 “zalm”", h.indexOf("“zalm”") !== -1);
  t.buttonsWithText("Alles wissen")[0].props.onClick();
  h = t.html();
  check("Alles wissen: teller weg, 52 recepten terug", h.indexOf("van 52 recepten") === -1 && h.indexOf("Lasagne") !== -1);
}

// 5. Filter op bereidingstijd via chip; dan via segmented in het filter-sheet.
{
  const t = make({});
  t.goRecipes();
  t.chipButtons("Kort")[0].props.onClick();
  let h = t.html();
  check("filter Kort: '2 van 52 recepten'", h.indexOf("2 van 52 recepten") !== -1);
  check("filter Kort: Tortelloni + Kip Siam", h.indexOf("Tortelloni met spinazie") !== -1 && h.indexOf("Kip Siam") !== -1);
  check("filter Kort: Borsjt niet zichtbaar", h.indexOf("Borsjt") === -1);
  check("actieve chip ⏱ kort", h.indexOf("⏱ kort") !== -1);
  t.chipButtons("⚙ Filters")[0].props.onClick();
  h = t.html();
  check("filter-sheet opent met titel Filters", h.indexOf("Filters") !== -1 && !!t.nodesWithClass("sheet")[0]);
  check("sheet toont 'Toon 2 recepten'", h.indexOf("Toon 2 recepten") !== -1);
  t.seglButton("Lang").props.onClick();
  check("sheet segmented Lang -> 7 van 52", t.html().indexOf("7 van 52 recepten") !== -1);
  t.buttonsWithText("Wis filters")[0].props.onClick();
  check("Wis filters in sheet reset tijdfilter", t.html().indexOf("van 52 recepten") === -1);
}

// 6. Ingrediënt-filter ("bevat") en tag-filters AND; top-5 tagchips + "meer".
{
  const t = make({});
  t.goRecipes();
  t.chipButtons("⚙ Filters")[0].props.onClick();
  let ing = t.inputWithPlaceholder("bijv. zalm, ui, kaas…");
  ing.props.onChange({ target: { value: "tortelloni" } });
  let h = t.html();
  check("ingrediënt 'tortelloni': 1 van 52", h.indexOf("1 van 52 recepten") !== -1);
  check("ingrediënt 'tortelloni': alleen Tortelloni", h.indexOf("Tortelloni met spinazie") !== -1 && h.indexOf("Kip Siam") === -1);
  check("actieve chip 🥘 tortelloni", h.indexOf("🥘 tortelloni") !== -1);
  t.buttonsWithText("Wis filters")[0].props.onClick();

  const t2 = make({
    recipes: [
      { id: "a1", name: "Alpha", cat: "vega", ingredients: ["1 appel"], bereiding: "", tags: ["favoriet"] },
      { id: "a2", name: "Beta", cat: "vega", ingredients: ["1 banaan"], bereiding: "", tags: ["snel", "favoriet"] },
      { id: "a3", name: "Gamma", cat: "vis", ingredients: ["1 gamba"], bereiding: "", tags: ["snel"] },
      { id: "a4", name: "Delta", cat: "vlees", ingredients: ["1 dirk"], bereiding: "", tags: ["a", "b", "c", "d", "e", "f", "g"] },
    ],
  });
  t2.goRecipes();
  const tagChips = () => t2.chipButtons("🏷");
  check("max 5 tagchips direct zichtbaar + 'meer'", tagChips().length === 5 && t2.html().indexOf("meer") !== -1);
  t2.chipButtons("favoriet")[0].props.onClick();
  t2.chipButtons("snel")[0].props.onClick();
  h = t2.html();
  check("tags AND (favoriet + snel): 1 van 4, alleen Beta", h.indexOf("1 van 4 recepten") !== -1 && h.indexOf("Beta") !== -1 && h.indexOf("Alpha") === -1 && h.indexOf("Gamma") === -1);
}

// 7. Recept toevoegen: pas na ＋-icoon (bottom sheet), met timeCat + tags.
{
  const t = make({});
  t.goRecipes();
  t.iconBtn("Recept toevoegen").props.onClick();
  let h = t.html();
  check("＋ opent sheet 'Nieuw recept'", h.indexOf("Nieuw recept") !== -1 && !!t.nodesWithClass("sheet")[0]);
  let naam = t.inputWithPlaceholder("Naam…");
  naam.props.onChange({ target: { value: "Testgerecht" } });
  t.seglButton("Lang").props.onClick();
  check("newRecipe.timeCat = lang na segmented", t.newRecipeState().timeCat === "lang");
  const tagInp = t.nodesWithClass("tagadd")[0].children.find((c) => c && c.type === "input");
  tagInp.props.onChange({ target: { value: "Testtag" } });
  t.nodesWithClass("tagadd")[0].children.find((c) => c && c.type === "button").props.onClick();
  check("tag 'testtag' toegevoegd aan newRecipe", JSON.stringify(t.newRecipeState().tags) === JSON.stringify(["testtag"]));
  t.buttonsWithText("Toevoegen")[0].props.onClick();
  const rs = t.recipesState();
  const added = rs[rs.length - 1];
  check("recept toegevoegd (53 total)", rs.length === 53 && added.name === "Testgerecht");
  check("toegevoegd recept heeft timeCat lang + tags", added.timeCat === "lang" && JSON.stringify(added.tags) === JSON.stringify(["testtag"]));
  check("sheet gesloten na Toevoegen", t.html().indexOf("Nieuw recept") === -1);
  check("nieuw recept zichtbaar in de lijst", t.html().indexOf("Testgerecht") !== -1);
}

// 8. Recept bewerken: segmented tijd, tags toevoegen/verwijderen, geen kok-veld.
{
  const t = make({});
  t.goRecipes();
  t.buttonsWithText("Tortelloni met spinazie")[0].props.onClick();
  let h = t.html();
  check("bewerkte rij opent met Bereidingstijd-segmented", !!t.nodesWithClass("segl")[0]);
  check("geen 'Wie kan dit koken'-veld bij bewerken", h.indexOf("Wie kan dit koken") === -1);
  check("geen minuten-veld bij bewerken", h.indexOf("Bereidingstijd (min)") === -1);
  t.seglButton("Lang").props.onClick();
  check("tijd van r17 gewijzigd naar lang", t.recipesState().find((r) => r.id === "r17").timeCat === "lang");
  const tagInp = t.nodesWithClass("tagadd")[0].children.find((c) => c && c.type === "input");
  tagInp.props.onChange({ target: { value: "vers" } });
  t.nodesWithClass("tagadd")[0].children.find((c) => c && c.type === "button").props.onClick();
  check("tag 'vers' toegevoegd aan r17", t.recipesState().find((r) => r.id === "r17").tags.includes("vers"));
  check("tag-chip met × in het formulier", !!t.nodesWithClass("tagx")[0]);
  t.nodesWithClass("tagx")[0].props.onClick();
  check("tag 'vers' weer verwijderd via ×", !t.recipesState().find((r) => r.id === "r17").tags.includes("vers"));
}

// 9. Weekmenu-dagregel: tijd-badge ipv minuten, geen kok.
{
  const keys = weekKeysFor(0, 0);
  const t = make({ menuByDate: { [keys[0]]: { id: "r17", locked: true } } });
  t.findTab("Weekmenu").props.onClick();
  const h = t.html();
  check("weekmenu toont tijd-badge (kort, emerald) voor r17", h.indexOf('"kort"') !== -1 && h.indexOf("bg-emerald-100 text-emerald-700") !== -1);
  check("weekmenu toont geen 'tijd onbekend' meer", h.indexOf("tijd onbekend") === -1);
  check("weekmenu toont geen '<n> min'-tijd meer", !/[0-9] min"/.test(h));
}

console.log(fails === 0 ? "ALLE TESTS GESLAAGD" : fails + " TEST(S) GEFAALD");
process.exit(fails === 0 ? 0 : 1);
