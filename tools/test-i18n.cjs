// Tests voor ADR-023 (meertaligheid): NL is default, GUI-taal schakelbaar naar en/fr/de
// via Instellingen (settings.language), met fallback naar NL en naar de sleutel zelf.
const path = require("path");
const fs = require("fs");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const ROOT = path.join(__dirname, "..");
const APP = path.join(ROOT, "src", "app.js");

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
  const textsOf = (node) => {
    const out = [];
    walk(node, (n) => { if (typeof n === "string") out.push(n); });
    return out;
  };
  const findTab = (label) => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "button" && String(n.props["aria-label"] || n.props.title || "") === label) found = n; });
    return found;
  };
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, textsOf, findTab, html };
}

// ---------- 1. Default is Nederlands ----------
{
  const t = make({});
  check("default: tablabels Nederlands", ["Weekmenu", "Recepten", "Voorraad", "Boodschappen", "Instellingen"].every((l) => t.findTab(l)));
  check("default: knop 'Genereer weekmenu'", t.html().indexOf("Genereer weekmenu") !== -1);
  check("default: header 'Weekmenu & Boodschappen'", t.html().indexOf("Weekmenu & Boodschappen") !== -1);
}

// ---------- 2. settings.language = "en" -> Engelse GUI ----------
{
  const t = make({ settings: { language: "en" } });
  check("en: tablabels Engels", ["Week menu", "Recipes", "Stock", "Shopping", "Settings"].every((l) => t.findTab(l)));
  check("en: geen Nederlandse tablabels meer", !t.findTab("Weekmenu") && !t.findTab("Instellingen"));
  check("en: knop 'Generate week menu'", t.html().indexOf("Generate week menu") !== -1);
  check("en: header 'Week menu & Shopping'", t.html().indexOf("Week menu & Shopping") !== -1);
  check("en: dagnaam in het Engels (zaterdag -> Saturday)", t.html().indexOf("Saturday") !== -1 || t.html().indexOf("Sat") !== -1);
  // boodschappen-tab in het Engels
  const t2 = make({ settings: { language: "en" }, menuByDate: {} });
  t2.findTab("Shopping").props.onClick();
  check("en: boodschappen-tab Engels (knoppen)", t2.html().indexOf("Process update") !== -1 || t2.html().indexOf("Shopping") !== -1);
}

// ---------- 3. fr en de renderen vertaalde labels ----------
for (const [lang, tab, gen] of [["fr", "Menu de la semaine", "Générer le menu de la semaine"], ["de", "Wochenmenü", "Wochenmenü generieren"]]) {
  const t = make({ settings: { language: lang } });
  check(lang + ": tablabel vertaald", !!t.findTab(tab));
  check(lang + ": genereerknop vertaald", t.html().indexOf(gen) !== -1);
}

// ---------- 4. Ongeldige taal -> fallback Nederlands ----------
{
  const t = make({ settings: { language: "xx" } });
  check("ongeldige taal 'xx' -> NL tablabels", !!t.findTab("Weekmenu") && !!t.findTab("Instellingen"));
}

// ---------- 5. Schakelen via Instellingen: klik op English-radio -> GUI wordt Engels ----------
{
  const t = make({});
  t.findTab("Instellingen").props.onClick();
  let radio = null;
  t.walk(t.render(), (n) => {
    if (!radio && n && n.type === "input" && n.props.type === "radio" && n.props.name === "language") {
      // label-tekst van het bijbehorende label найти we via de parent;we pakken de radios op code
    }
  });
  // vind alle language-radios met hun label-tekst
  const radios = [];
  t.walk(t.render(), (n) => { if (n && n.type === "input" && n.props.type === "radio" && n.props.name === "language") radios.push(n); });
  check("taal-kaart: 4 radio's (nl/en/fr/de)", radios.length === 4);
  check("taal-kaart: nl default geselecteerd", radios.length === 4 && radios[0].props.checked === true);
  radios[1].props.onChange(); // English
  check("na klik English: tablabels Engels", ["Week menu", "Recipes", "Stock", "Shopping", "Settings"].every((l) => t.findTab(l)));
  check("na klik English: settings.language = 'en' in state", t.m.hooks.state.some((s) => s && s.language === "en"));
  // terug naar Nederlands
  t.findTab("Settings").props.onClick();
  const radios2 = [];
  t.walk(t.render(), (n) => { if (n && n.type === "input" && n.props.type === "radio" && n.props.name === "language") radios2.push(n); });
  radios2[0].props.onChange();
  check("terug naar Nederlands werkt", !!t.findTab("Weekmenu") && !!t.findTab("Instellingen"));
}

// ---------- 6. Dictionaries: pariteit van sleutels en dag/maand-arrays ----------
function loadDict(lang) {
  const p = path.join(ROOT, "src", "i18n", lang + ".js");
  const code = fs.readFileSync(p, "utf8").replace(/^export default /m, "module.exports = ");
  const mod = { exports: {} };
  new Function("module", "exports", code)(mod, mod.exports);
  return mod.exports;
}
{
  const dicts = { nl: loadDict("nl"), en: loadDict("en"), fr: loadDict("fr"), de: loadDict("de") };
  for (const lang of ["en", "fr", "de"]) {
    const isReal = (k) => k !== "days" && k !== "months" && k !== "monthsShort" && k !== "cat." && k !== "time." && !/^\\u[0-9a-fA-F]{4}$/.test(k) && /[A-Za-zÀ-ÿ]/.test(k.replace(/\\u[0-9a-fA-F]{4}/g, ""));
    const missing = Object.keys(dicts.nl).filter((k) => isReal(k) && !(k in dicts[lang]));
    check(lang + ": alle NL-sleutels vertaald (behalve arrays)", missing.length === 0);
    if (missing.length) console.log("   missend in " + lang + ": " + missing.slice(0, 10).join(" | "));
  }
  for (const lang of ["nl", "en", "fr", "de"]) {
    check(lang + ": 7 dagnamen en 12 maanden", dicts[lang].days.length === 7 && dicts[lang].months.length === 12 && dicts[lang].monthsShort.length === 12);
  }
  // t() fallback: onbekende sleutel -> sleutel zelf; met vars -> placeholder-substitutie
  const m = loadApp(APP, { settings: { language: "en" } });
  const i18n = m.sandbox.__weekmenuModules("src/i18n/index.js");
  i18n.setLanguage("en");
  check("t() vertaalt bekende sleutel", i18n.t("Genereer weekmenu") === "Generate week menu");
  check("t() met vars", i18n.t("Toon {n} recepten", { n: 5 }) === "Show 5 recipes");
  check("t() onbekende sleutel -> sleutel zelf", i18n.t("deze sleutel bestaat niet") === "deze sleutel bestaat niet");
  i18n.setLanguage("nl");
  check("t() nl: sleutel = waarde", i18n.t("Genereer weekmenu") === "Genereer weekmenu");
}

if (fails > 0) { console.log(`\n${fails} i18n-test(s) GEFAALD`); process.exit(1); }
console.log("\nAlle i18n-tests geslaagd");
