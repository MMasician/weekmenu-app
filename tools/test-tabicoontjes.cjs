// Functionele tests voor #41: tabbalk met icoontjes (akkoord: versie C) — per tab een icoon,
// klein tekstlabel alleen onder de actieve tab, boodschappen-teller als badge op het icoon,
// tabnaam in title/aria-label. Zie docs/SPECS.md (Tabs) en docs/ux/tabicoontjes/VOORSTEL.md.
const path = require("path");
const { loadApp, serialize } = require(path.join(__dirname, "render-harness.cjs"));

const APP = path.join(__dirname, "..", "src", "app.js");

let fails = 0;
const check = (name, ok) => { console.log((ok ? "PASS" : "FAIL") + " - " + name); if (!ok) fails++; };

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const todayK = dateKey(new Date());

const TAB_LABELS = ["Weekmenu", "Recepten", "Voorraad", "Boodschappen", "Instellingen"];
const TAB_ICONS = ["\uD83D\uDCC5", "\uD83D\uDCD6", "\uD83D\uDCE6", "\uD83D\uDED2", "\u2699\uFE0F"];

function make(seed) {
  const m = loadApp(APP, seed);
  const render = () => { m.hooks.cursor = 0; return m.App(); };
  const walk = (n, f) => {
    if (Array.isArray(n)) { n.forEach((x) => walk(x, f)); return; }
    if (n && n.children) n.children.forEach((x) => walk(x, f));
    f(n);
  };
  const nav = () => {
    let found = null;
    walk(render(), (n) => { if (!found && n && n.type === "nav") found = n; });
    return found;
  };
  const tabButtons = () => {
    const out = [];
    const nv = nav();
    if (nv) walk(nv, (n) => { if (n && n.type === "button") out.push(n); });
    return out;
  };
  const textsOf = (node) => {
    const out = [];
    walk(node, (n) => { if (typeof n === "string") out.push(n); });
    return out;
  };
  const findTab = (label) => tabButtons().find((b) => String(b.props["aria-label"] || b.props.title || "") === label) || null;
  const navHtml = () => JSON.stringify(serialize(nav()));
  const html = () => JSON.stringify(serialize(render()));
  render();
  return { m, render, walk, nav, tabButtons, textsOf, findTab, navHtml, html };
}

// ---------- 1. Structuur: 5 tabknoppen met icoon + aria-label/title, label alleen bij actieve tab ----------
{
  const t = make({});
  const tabs = t.tabButtons();
  check("tabbalk heeft 5 knoppen", tabs.length === 5);
  check("aria-labels in vaste volgorde", JSON.stringify(tabs.map((b) => String(b.props["aria-label"] || ""))) === JSON.stringify(TAB_LABELS));
  check("elke tabknop heeft title = tabnaam", tabs.every((b, i) => b.props.title === TAB_LABELS[i]));
  check("elke tabknop toont zijn icoon (tabicon)", tabs.every((b, i) => b.children[0] && b.children[0].props.className === "tabicon" && b.children[0].children[0] === TAB_ICONS[i]));
  const navTexts = t.textsOf(t.nav());
  check("alleen de actieve tab (Weekmenu) toont een tekstlabel", navTexts.indexOf("Weekmenu") !== -1 && navTexts.indexOf("Recepten") === -1 && navTexts.indexOf("Instellingen") === -1);
  check("geen tabtitel-tekst meer in de nav bij inactieve tabs", navTexts.filter((s) => TAB_LABELS.indexOf(s) !== -1).length === 1);
  check("geen badge zonder boodschappen (teller 0)", !/\d+\/\d+/.test(t.navHtml()));

  // ---------- 2. Tabwissel: label schuift mee, inhoud rendert ----------
  t.findTab("Voorraad").props.onClick();
  let nt = t.textsOf(t.nav());
  check("na klik op Voorraad: label 'Voorraad' actief, 'Weekmenu' weg", nt.indexOf("Voorraad") !== -1 && nt.indexOf("Weekmenu") === -1);
  check("voorraad-tab rendert (Locaties)", t.html().indexOf("Locaties") !== -1);
  check("actieve tabknop heeft de donkere pill", String(t.findTab("Voorraad").props.className).indexOf("bg-stone-800") !== -1);
  t.findTab("Weekmenu").props.onClick();
  check("terug naar Weekmenu werkt", t.textsOf(t.nav()).indexOf("Weekmenu") !== -1);

  // ---------- 3. Badge: boodschappen-teller (n/m) op het icoon ----------
  const t2 = make({ menuByDate: { [todayK]: { id: "r25", locked: true } } }); // Thaise viscurry -> lijstregels
  const badge = (() => {
    let found = null;
    t2.walk(t2.nav(), (n) => { if (!found && n && n.type === "span" && String(n.props.className || "") === "tabbadge") found = n; });
    return found;
  })();
  check("badge (tabbadge) op het boodschappen-icoon bij teller > 0", !!badge && /^\d+\/\d+$/.test(String(badge.children[0])));
  check("badge toont 0/n (niets afgevinkt)", !!badge && String(badge.children[0]).indexOf("0/") === 0);
  const shopBtn = t2.findTab("Boodschappen");
  check("boodschappen-tabknop bevat het badge", JSON.stringify(shopBtn.children).indexOf("tabbadge") !== -1);
}

// ---------- 4. Thema-tabicoontjes (#40): feestthema's hebben eigen iconen ----------
{
  const kerst = make({ settings: { theme: "kerstmis" } });
  const iconsK = kerst.tabButtons().map((b) => b.children[0].children[0]);
  check("#40: kerstmis-tabicoontjes (🎄 📖 📦 🎁 ⚙️)", JSON.stringify(iconsK) === JSON.stringify(["\uD83C\uDF84", "\uD83D\uDCD6", "\uD83D\uDCE6", "\uD83C\uDF81", "\u2699\uFE0F"]));
  const sint = make({ settings: { theme: "sinterklaas" } });
  const iconsS = sint.tabButtons().map((b) => b.children[0].children[0]);
  check("#40: sinterklaas-tabicoontjes (🎁 📖 📦 🛒 🎅)", JSON.stringify(iconsS) === JSON.stringify(["\uD83C\uDF81", "\uD83D\uDCD6", "\uD83D\uDCE6", "\uD83D\uDED2", "\uD83C\uDF85"]));
  const donker = make({ settings: { theme: "donker" } });
  const iconsD = donker.tabButtons().map((b) => b.children[0].children[0]);
  check("#40: donker/roze/standaard gebruiken de standaard-icoontjes", JSON.stringify(iconsD) === JSON.stringify(TAB_ICONS));
  const roze = make({ settings: { theme: "roze" } });
  check("#40: roze gebruikt de standaard-icoontjes", JSON.stringify(roze.tabButtons().map((b) => b.children[0].children[0])) === JSON.stringify(TAB_ICONS));
}

if (fails > 0) { console.log(`\n${fails} test(s) GEFAALD`); process.exit(1); }
console.log("\nAlle tabicoontjes-tests geslaagd");
