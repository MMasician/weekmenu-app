const { useState, useMemo, useEffect } = React; // React global (vendor/react.min.js)

const DAY_NAMES = ["Zaterdag", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"]; // index 0 = zaterdag
const FISH_DAYS = [0, 4]; // standaard vis-dagen, relatief t.o.v. de weekstart
// Boodschappenmomenten (runs) zijn vervallen (ADR-016): de boodschappenlijst is van vandaag
// plus een instelbaar aantal dagen, zonder opgeslagen runs.
const MARKETS = [
  { key: "ah", label: "Albert Heijn" },
  { key: "jumbo", label: "Jumbo" },
  { key: "lidl", label: "Lidl" },
];

// Categorieën van boodschappenartikelen (ADR-015): een categorie zegt waar een artikel in de
// supermarkt ligt (tortilla/kroepoek horen bij "(maaltijd)saus"). De volgorde is de volgorde
// waarop artikelen op de boodschappenlijst staan.
const SHOP_CATS_DEFAULT = [
  "fruit", "groente", "vlees/vis", "kruiden", "conserven", "(maaltijd)saus",
  "broodbeleg", "zuivel", "diepvries", "lekkers", "brood",
];

// Per-huishouden instellingen (ADR-009). De oude constanten zijn de standaardwaarden.
const DEFAULT_SETTINGS = {
  householdSize: 4,
  weekStartDay: 0, // index in DAY_NAMES (0 = zaterdag)
  fishDays: [...FISH_DAYS],
  vegaTarget: 2,
  markets: MARKETS.map((m) => ({ ...m, defaultShop: true })),
  shopCats: [...SHOP_CATS_DEFAULT],
  tagRules: [], // #37: [{ kind: "product" | "recipe", tag, days }]
  dishRepeatDays: 7, // #38: aantal dagen wachten voordat een gerecht opnieuw gepland mag (0 = volgende dag mag al)
  takeawayLinks: [], // #42: bestelsites voor afhaalmaaltijd [{ id, label, url }]
  theme: "standaard", // #40: thema/weergave ("standaard" | "donker" | "roze" | "sinterklaas" | "kerstmis")
};

// #40: thema's — "standaard" is de huidige kleurstelling; donker/roze via CSS-variabelen, de
// feestthema's ook met eigen inline-SVG-achtergrond en eigen tabicoontjes (styles.css)
const THEMES = [
  { key: "standaard", label: "Standaard", dots: ["#fafaf9", "#ffffff", "#292524"] },
  { key: "donker", label: "Donker", dots: ["#1c1917", "#292524", "#a8a29e"] },
  { key: "roze", label: "Roze", dots: ["#fdf2f8", "#ffffff", "#db2777"] },
  { key: "sinterklaas", label: "\uD83C\uDF81 Sinterklaas", dots: ["#2e1065", "#fbbf24", "#f5f3ff"] },
  { key: "kerstmis", label: "\uD83C\uDF84 Kerstmis", dots: ["#7f1d1d", "#166534", "#fbbf24"] },
];
const THEME_KEYS = THEMES.map((t) => t.key);
const THEME_TAB_ICONS = {
  standaard: { menu: "\uD83D\uDCC5", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83D\uDED2", settings: "\u2699\uFE0F" },
  sinterklaas: { menu: "\uD83C\uDF81", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83D\uDED2", settings: "\uD83C\uDF85" },
  kerstmis: { menu: "\uD83C\uDF84", recipes: "\uD83D\uDCD6", stock: "\uD83D\uDCE6", shopping: "\uD83C\uDF81", settings: "\u2699\uFE0F" },
};
const THEME_META = { standaard: "#059669", donker: "#1c1917", roze: "#db2777", sinterklaas: "#2e1065", kerstmis: "#7f1d1d" };

function normalizeDayList(arr, fallback) {
  if (!Array.isArray(arr)) return [...fallback];
  return [...new Set(arr.filter((n) => Number.isInteger(n) && n >= 0 && n < 7).map(Number))];
}

function normalizeSettings(s) {
  const d = DEFAULT_SETTINGS;
  const src = s && typeof s === "object" ? s : {};
  const out = { ...d, ...src };
  out.householdSize = Math.max(1, Math.floor(Number(out.householdSize) > 0 ? Number(out.householdSize) : d.householdSize));
  out.weekStartDay = Math.min(6, Math.max(0, Math.floor(Number(out.weekStartDay) || 0)));
  out.fishDays = normalizeDayList(out.fishDays, d.fishDays);
  delete out.shopRuns; // boodschappenmomenten worden niet meer in de app opgeslagen (ADR-016)
  out.vegaTarget = Math.max(0, Math.floor(Number(out.vegaTarget) || 0));
  const mkts = Array.isArray(out.markets) && out.markets.length ? out.markets : d.markets;
  out.markets = mkts
    .map((m) => ({
      key: String(m && m.key != null ? m.key : "").trim().toLowerCase(),
      label: String(m && m.label != null ? m.label : ""),
      defaultShop: !m || m.defaultShop !== false, // default geselecteerd op de boodschappenlijst (ADR-016)
    }))
    .filter((m) => m.key)
    .filter((m, i, arr) => arr.findIndex((x) => x.key === m.key) === i);
  if (!out.markets.length) out.markets = d.markets.map((m) => ({ ...m }));
  const cats = Array.isArray(out.shopCats) && out.shopCats.length ? out.shopCats : d.shopCats;
  out.shopCats = [...new Set(cats.map((c) => String(c == null ? "" : c).trim()).filter(Boolean))];
  if (!out.shopCats.length) out.shopCats = [...d.shopCats];
  // #37: tag-regels normaliseren (kind, lowercase tag, dagen 0..30, dedup per kind+tag)
  out.tagRules = (Array.isArray(out.tagRules) ? out.tagRules : [])
    .map((r) => ({
      kind: r && r.kind === "recipe" ? "recipe" : "product",
      tag: String((r && r.tag) || "").trim().toLowerCase(),
      days: Math.min(30, Math.max(0, Math.floor(Number((r && r.days) || 0)))),
    }))
    .filter((r) => r.tag)
    .filter((r, i, arr) => arr.findIndex((x) => x.kind === r.kind && x.tag === r.tag) === i);
  // #38: herhaalregel per gerecht (0..30, standaard 7 = niet vaker dan 1× per week)
  out.dishRepeatDays = Math.min(30, Math.max(0, Math.floor(Number(out.dishRepeatDays) || 0)));
  // #42: afhaal-linkjes (bestelsites) — label/url trimmen; lege rijen (beide leeg) vallen weg
  out.takeawayLinks = (Array.isArray(out.takeawayLinks) ? out.takeawayLinks : [])
    .map((l, i) => ({
      id: String((l && l.id) || "tl-" + i),
      label: String((l && l.label) || "").trim(),
      url: String((l && l.url) || "").trim(),
    }))
    .filter((l) => l.label || l.url);
  out.theme = THEME_KEYS.includes(out.theme) ? out.theme : d.theme; // #40: ongeldige waarde -> standaard
  return out;
}
// Voorraad (ADR-015): per-huishouden locaties; per product een locatie, categorie (shopCats),
// optionele winkelvoorkeur (marketKey uit settings.markets) en have/want.
const DEFAULT_LOCATIONS = [
  { id: "loc-kast", name: "Voorraadkast" },
  { id: "loc-koel", name: "Koelkast" },
  { id: "loc-vriezer", name: "Vriezer" },
  { id: "loc-kruiden", name: "Kruidenla" },
  { id: "loc-fruit", name: "Fruitschaal" },
];
// Migratie van het oude model, waarin `cat` de locatie was (kast/koel/fruit/kruiden).
const OLD_LOC_BY_CAT = { kast: "loc-kast", koel: "loc-koel", fruit: "loc-fruit", kruiden: "loc-kruiden" };
const OLD_CAT_BY_CAT = { kast: "conserven", koel: "zuivel", fruit: "fruit", kruiden: "kruiden" };
const STOCK_DEFAULT = [
  { name: "Hagelslag", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Pindakaas", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Jam", loc: "loc-kast", cat: "broodbeleg", qty: 1 },
  { name: "Koffie", loc: "loc-kast", cat: "lekkers", qty: 1 },
  { name: "Thee", loc: "loc-kast", cat: "lekkers", qty: 1 },
  { name: "Olijfolie", loc: "loc-kast", cat: "conserven", qty: 1 },
  { name: "Rijst", loc: "loc-kast", cat: "conserven", qty: 1 },
  { name: "Melk", loc: "loc-koel", cat: "zuivel", qty: 2 },
  { name: "Boter", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Kaas", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Eieren", loc: "loc-koel", cat: "zuivel", qty: 1 },
  { name: "Yoghurt", loc: "loc-koel", cat: "zuivel", qty: 2 },
  { name: "Diepvrieserwten", loc: "loc-vriezer", cat: "diepvries", qty: 1 },
  { name: "Zout", loc: "loc-kruiden", cat: "kruiden", qty: 1 },
  { name: "Peper", loc: "loc-kruiden", cat: "kruiden", qty: 1 },
  { name: "Appels", loc: "loc-fruit", cat: "fruit", qty: 4 },
  { name: "Bananen", loc: "loc-fruit", cat: "fruit", qty: 3 },
];
function defaultStock() {
  return STOCK_DEFAULT.map((d) => ({ name: d.name, loc: d.loc, cat: d.cat, market: null, want: d.qty, have: d.qty }));
}
function normalizeLocations(arr) {
  const out = (Array.isArray(arr) ? arr : [])
    .filter((l) => l && l.id && String(l.name).trim())
    .map((l) => ({ id: String(l.id), name: String(l.name), ...(typeof l.updatedAt === "number" ? { updatedAt: l.updatedAt } : {}) }));
  return out.length ? out : DEFAULT_LOCATIONS.map((l) => ({ ...l }));
}
function normalizeStock(arr, locs) {
  const locIds = new Set((locs || DEFAULT_LOCATIONS).map((l) => l.id));
  return (arr || [])
    .filter((s) => s && s.name)
    .map((s) => {
      const loc = locIds.has(s.loc) ? s.loc : OLD_LOC_BY_CAT[s.cat] || "loc-kast";
      const cat = locIds.has(s.loc) ? (typeof s.cat === "string" && s.cat ? s.cat : "conserven") : OLD_CAT_BY_CAT[s.cat] || "conserven";
      return {
        name: String(s.name),
        loc,
        cat,
        market: s.market != null && String(s.market) !== "" ? String(s.market) : null,
        want: Math.max(0, Math.floor(Number(s.want ?? s.qty ?? 1) || 0)),
        have: Math.max(0, Math.floor(Number(s.have ?? (s.qty === 0 ? 0 : s.want ?? s.qty ?? 1)) || 0)),
        ...(typeof s.updatedAt === "number" ? { updatedAt: s.updatedAt } : {}),
      };
    });
}
function normalizeExtras(arr) {
  return (arr || [])
    .map((x) => (typeof x === "string"
      ? { name: x, cat: "" }
      : { name: String((x && x.name) || ""), cat: (x && x.cat) || "", amount: x && x.amount != null ? x.amount : undefined, unit: x && x.unit ? x.unit : null, ...(x && typeof x.updatedAt === "number" ? { updatedAt: x.updatedAt } : {}) }))
    .filter((x) => x.name);
}
const CAT_LABEL = { vega: "Vega", vis: "Vis", vlees: "Vlees", extra: "Extra" };
const CAT_STYLE = {
  vega: "bg-green-100 text-green-800",
  vis: "bg-blue-100 text-blue-800",
  vlees: "bg-red-100 text-red-800",
  extra: "bg-amber-100 text-amber-800",
};
// Bereidingstijd als categorie (ADR-013): kort / normaal / lang ipv minuten.
const TIME_CATS = ["kort", "normaal", "lang"];
const TIME_LABEL = { kort: "kort", normaal: "normaal", lang: "lang" };
const timeLabelCap = (t) => TIME_LABEL[t].charAt(0).toUpperCase() + TIME_LABEL[t].slice(1);
const TIME_STYLE = {
  kort: "bg-emerald-100 text-emerald-700",
  normaal: "bg-stone-100 text-stone-500",
  lang: "bg-amber-100 text-amber-700",
};
// Migratie van oude `time` (minuten) naar timeCat: <= 25 min kort, >= 45 min lang, anders normaal.
function timeCatFromTime(time) {
  const n = Number(time);
  if (time == null || time === "" || !Number.isFinite(n)) return "normaal";
  if (n <= 25) return "kort";
  if (n >= 45) return "lang";
  return "normaal";
}
// Normaliseert een recept naar het ADR-013-model: timeCat + tags aanwezig, oude time/cook gewist.
function normalizeRecipe(r) {
  const out = { ...r };
  if (!Array.isArray(out.ingredients)) out.ingredients = [];
  out.timeCat = TIME_CATS.includes(out.timeCat) ? out.timeCat : timeCatFromTime(r.time);
  delete out.time;
  delete out.cook;
  out.tags = Array.isArray(out.tags) ? out.tags.filter(Boolean) : [];
  return out;
}

const BASE_RECIPES = [
  // ---------- VEGA ----------
  { id: "r1", name: "Abrikoos/pompoen-tajine", cat: "vega", ingredients: ["Alfez apricot & coriander (Maroccan style)", "Pompoen", "Courgette", "2 tomaten", "1 blik kikkererwten", "Abrikoos", "Kip (optioneel)", "Couscous/rijst"], bereiding: "" },
  { id: "r2", name: "Accenture burgers", cat: "vega", timeCat: "lang", ingredients: ["Kikkererwten", "Wortels", "Havervlokken", "Zongedroogde tomaten", "Ui", "Knoflook", "Paprikapoeder", "Chilipoeder", "Oregano", "Azijn", "Zoete aardappel", "Maïzena", "Tomaten", "Komkommer", "Buns/burgerbroodjes", "(Peterselie/knoflook) pesto"], bereiding: "Oven voorverwarmen op 220°C. Zoete aardappel in frietjes met maïzena en olie, 20-25 min. bakken. Ui marineren in water, azijn en suiker. Kikkererwten, havervlokken, ui, knoflook, zongedroogde tomaten en kruiden pureren, burgers vormen en 15 min. bakken op lagere stand. Broodjes roosteren, beleggen met pesto, tomaat, komkommer, burger en rode ui." },
  { id: "r3", name: "Bonen Malaidar", cat: "vega", ingredients: ["Kikkererwten", "Kidneybonen", "Jackfruit", "600 g sperziebonen", "Maïs", "Cashewnoten", "125 ml kookroom", "Boemboe Malaidar"], bereiding: "" },
  { id: "r4", name: "Bonenschotel", cat: "vega", ingredients: ["Broccolirijst", "Paprika", "425 g black-eyed bonen", "200 g zwarte bonen", "150 g mais in blik", "25 g verse bieslook", "1 limoen", "1 el knoflook/chili-olie", "½ tl gemalen komijn"], bereiding: "Kook de rijst. Bonen en mais afspoelen en laten uitlekken. Dressing maken van limoenrasp en -sap, olie en komijn. Alles mengen en serveren. Lekker bij een kip-ananassalade." },
  { id: "r5", name: "Courgette-broccolisoep", cat: "vega", ingredients: ["1 broccoli", "1 courgette", "10 g tijm", "1 teen knoflook", "200 g ui", "1 groentebouillonblokje", "100 g verse pesto", "200 g geitenkaas", "50 g walnoten", "2 grote aardappelen", "Cannelonibonen (optioneel)", "Ovenbrood", "Tonijnsalade"], bereiding: "Oven voor op 220°C. Broccoli en courgette snijden, met ui, knoflook en tijm fruiten, 1 liter water en bouillonblokje toevoegen, 15 min. koken. Pesto en helft van de geitenkaas toevoegen en glad pureeren. Serveren met geitenkaas, walnoten en ovenbrood." },
  { id: "r6", name: "Couscous", cat: "vega", ingredients: ["2 uien", "1 paprika", "1 courgette", "350 g zoete aardappel", "Dadels", "Pecannoten", "Knoflookolie", "Half bouillonblokje", "250 g couscous/bulgur", "Sweet/spicy mayonaise", "Geitenkaaskruimels", "Komijn, kaneel, kurkuma, gember, anijs, peper"], bereiding: "" },
  { id: "r7", name: "Exotische stamppot", cat: "vega", ingredients: ["500 g zoete aardappelen", "1 knolselderij", "1 paksoi", "4 ringen ananas", "50 ml kokosmelk", "1 el sambal", "150 g piccalilly", "50 g pinda's"], bereiding: "Aardappel en knolselderij 10 min. koken, droogstomen. Stampen met kokosmelk en sambal. Piccalilly, ananas, paksoi en pinda's erdoor, garneren met piccalilly." },
  { id: "r8", name: "Falafel", cat: "vega", ingredients: ["3 blikken kikkererwten", "3 uien", "Volkoren meel", "Komijn", "Kerrie", "Kurkuma", "Olie", "Tortilla's", "Rucolamelange", "6 tomaten", "Knoflooksaus", "Harissa"], bereiding: "" },
  { id: "r9", name: "Groentenkoekjes", cat: "vega", ingredients: ["Broccoli", "Blik maïs", "Blikje kikkererwten", "Ui", "Paprika", "Worteltjes/zoete aardappel", "Walnoten", "Volkoren tarwemeel", "Eieren", "Chilisaus", "Cocktailsaus"], bereiding: "Pureren met staafmixer, meel erbij, stukjes walnoot erbij, bakken in koekenpan." },
  { id: "r10", name: "Kikkererwtenmodder", cat: "vega", ingredients: ["1 ui", "3 tenen knoflook", "400 g spinazie à la crème", "1 blikje tomatenpuree", "3 el paprikapoeder", "450 g kikkererwten", "1 blik pizzatomaten", "10 volkoren pitabroodjes", "4 el amandelen", "3 tomaten"], bereiding: "Ui en knoflook fruiten, spinazie meebakken, tomatenpuree en paprikapoeder toevoegen. Kikkererwten en pizzatomaten erbij. Serveren met pitabroodjes." },
  { id: "r11", name: "Linzensoep", cat: "vega", ingredients: ["200 g wortel", "300 g gedroogde rode linzen", "400 g tomatenblokjes", "150 g bleekselderij", "1 teen knoflook", "1 ui", "1 tl komijn", "1 tl paprikapoeder", "Kaneel", "1 groentebouillonblokje", "1,2 l water", "Verse koriander of peterselie", "170 g (plantaardige) yoghurt"], bereiding: "Ui en knoflook fruiten, wortel en bleekselderij meebakken. Kruiden, tomatenblokjes, linzen, water en bouillonblokje toevoegen, 25 min. koken. Fijn pureren, serveren met yoghurt en koriander." },
  { id: "r12", name: "Nasi gado", cat: "vega", ingredients: ["800 g Hollandse wokgroente", "Nasikruiden", "Satésaus", "Rijst", "5 eieren", "Kroepoek", "Cashewnoten"], bereiding: "" },
  { id: "r13", name: "Pasta pesto pistache", cat: "vega", ingredients: ["Kikkererwten", "Pistachenoten", "400 g snijbonen", "500 g broccoli", "50 g amandelen", "125 g groene pesto"], bereiding: "Snijbonen 6 min. koken, laatste 3 min. broccoli mee, 2 min. voor het einde kikkererwten. Amandelen, pistachenoten en pesto erdoor." },
  { id: "r14", name: "Pompoensoep", cat: "vega", ingredients: ["5 paprika's", "3 uien", "1 pompoen", "1 blik kokosmelk", "2 bouillonblokjes", "Ovenbrood", "Tonijnsalade"], bereiding: "Snij in grove stukken en pureer. Opwarmen. Klaar!" },
  { id: "r15", name: "Rijst met pistachenoten en kokos", cat: "vega", ingredients: ["(Meergranen) rijst", "Nasi/bamigroenten", "Currykruiden", "Kurkuma", "Zwarte peper", "Kokosolie", "Geraspte kokos", "Pistachenoten", "Rode peper", "Eieren"], bereiding: "Kook rijst en eieren. Bak groenten kort met kruiden, kokosolie en pistachenoten. Rijst toevoegen, serveren met gekookt ei." },
  { id: "r16", name: "Snelle vega roti", cat: "vega", ingredients: ["1 aubergine", "2 grote zoete aardappelen", "300 g sperziebonen", "5 eieren", "5 tortillawraps", "Rode peper", "Gember", "4 el sojasaus", "2 el currykruiden", "1 teen knoflook"], bereiding: "Peper, knoflook, sojasaus en gember mengen. Aubergine marineeren en goudbruin bakken. Sperziebonen (15 min.) en eieren (7 min.) mee koken. Zoete aardappel met currykruiden koken. Wraps verwarmen." },
  { id: "r17", name: "Tortelloni met spinazie", cat: "vega", timeCat: "kort", ingredients: ["750 g tortelloni", "1200 g spinazie à la crème", "Zonnebloempitten", "Gewone rozijnen"], bereiding: "" },
  { id: "r18", name: "Vega burrito's", cat: "vega", ingredients: ["Pak burritos", "3 trostomaten", "1 ui", "1 paprika", "2 avocado's", "Blik maïs", "Blik kidneybonen", "200 g crème fraîche", "Geraspte kaas"], bereiding: "" },
  { id: "r19", name: "Vega risotto met champignons", cat: "vega", ingredients: ["200 g risottorijst", "250 g kastanjechampignons", "1 rode ui", "1 prei", "2 tomaten", "75 ml droge witte wijn", "2 tenen knoflook", "1 stuk gember", "1 l groentebouillon", "2 el edelgistvlokken", "2 el kokosolie", "200 g verse spinazie/sla"], bereiding: "Ui en prei in kokosolie 10 min. bakken, knoflook en gember toevoegen, rijst mee roeren, wijn erbij, daarna bouillon: 25 min. koken. Champignons en tomaten apart bakken en door de risotto roeren. Edelgistvlokken erover." },
  { id: "r20", name: "Vega tandoori (Knorr wereldgerecht)", cat: "vega", ingredients: [], bereiding: "Volgens verpakking Knorr wereldgerecht." },
  // ---------- VIS ----------
  { id: "r21", name: "Burritobowl met tonijn", cat: "vis", ingredients: ["125-150 g gedroogde linzenmix", "420 g kidneybonen", "200 g ijsbergsla", "340 g mais in blik", "1 groene paprika", "2 avocado's", "320 g tonijn", "150 g roze garnalen", "Sambalsaus"], bereiding: "Volgens Jumbo-recept is alles praktisch koud, maar opwarmen is ook lekker. Garnalen mogen mee verwarmd worden." },
  { id: "r22", name: "Makreelsalade", cat: "vis", ingredients: ["Gerookte makreel", "Slamelange met rucola", "Rode bietjes", "Appel", "Ui", "Ei", "Pompoenpitten", "Fritessaus", "Yoghurt", "Bieslook"], bereiding: "" },
  { id: "r23", name: "Paëlla", cat: "vis", ingredients: ["2 paprika's", "1 ui", "1 teentje knoflook", "1 courgette", "1 bouillonblokje", "150 g diepvriesdoperwten", "Garnalen", "Sardines", "Tonijn", "Kurkuma", "Rijst (couscous/bulgur)"], bereiding: "Rijst koken met kurkuma. Paprika, ui en knoflook bakken. Bouillonblokje, courgette en fruits de mer toevoegen. Rijst en doperwten toevoegen." },
  { id: "r24", name: "Spinaziequiche met zalm", cat: "vis", timeCat: "lang", ingredients: ["450 g spinazie", "1 rode paprika", "½ blikje mais", "Zalm in blokjes", "2 eieren", "½ pakje kookroom", "Geitenkaas of gewone kaas", "3 tl tofukruiden of Bretonse gehaktkruiden", "Bladerdeeg"], bereiding: "Oven voor op 200°C. Eieren, room, kruiden en kaas mengen. Ovenschaal met bladerdeeg bekleden, alle ingrediënten erin. 20-30 min. in de oven." },
  { id: "r25", name: "Thaise viscurry", cat: "vis", ingredients: ["Zalm", "Rode curry", "Kokosmelk", "Rivolitomaatjes", "Rijst (bulgur)", "800 g wokgroente met peulen", "Kroepoek"], bereiding: "" },
  { id: "r26", name: "Tonijnpasta", cat: "vis", ingredients: [], bereiding: "" },
  { id: "r27", name: "Tonijn-peer salade", cat: "vis", ingredients: ["2 peren", "1 prei", "200 g blik tonijn", "100 g zwarte olijven", "80 g zonnebloempitten", "3 el balsamicoazijn", "2 el mayonaise", "3 el kwark", "150 g rucolamelange", "200 g linzenmix"], bereiding: "Prei in ringen wassen, peren in blokjes, olijven in ringetjes. Linzenmix 12 min. koken. Tonijn en prei kort verwarmen. Alles mengen." },
  { id: "r28", name: "Vis, groente en aardappelen", cat: "vis", ingredients: [], bereiding: "" },
  { id: "r29", name: "Witte zalmpasta", cat: "vis", ingredients: ["Zalm", "Rivolitomaatjes", "200 g volkoren pasta", "800 g groentemix met champignons", "Tagliatellesaus", "Melk"], bereiding: "" },
  { id: "r30", name: "Zalm tandoori", cat: "vis", ingredients: ["Zalm", "Krieltjes", "Broccoli", "Rivolitomaatjes", "Ui", "Chilisaus"], bereiding: "" },
  { id: "r31", name: "Zalmwraps", cat: "vis", ingredients: ["2 pakken wraps", "250 g zalm", "Heks'nkaas", "2 paprika's", "1 ui", "Blik maïs", "Blik kidneybonen (optioneel)", "Komkommer", "Cherrytomaten"], bereiding: "Komkommer en cherrytomaten kort mee verwarmen." },
  // ---------- VLEES ----------
  { id: "r32", name: "Andijviestamppot", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r33", name: "Babi ketjap (boemboe + sperziebonen)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r34", name: "Bobotie (Knorr wereldgerecht)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r35", name: "Boerenkoolstamppot", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r36", name: "Borsjt", cat: "vlees", timeCat: "lang", ingredients: ["Pot runderbouillon met vlees", "Bouillonblokje", "200 g aardappelen", "400 g groenten met kool", "200 g winterpeen", "1 ui", "Pot rode bietjes", "Blik tomatenblokjes", "Blik knakworstjes", "Peper", "Paprikapoeder", "Laurierblad", "Azijn", "Crème fraîche"], bereiding: "Aardappelen, wortel en ui snijden. Bouillon aanlengen tot 1 liter met bouillonblokje en laurierblad. Ui bakken, hete bouillon toevoegen, aardappelen, koolgroenten, wortel en paprikapoeder 15 min. zacht koken. Tomatenblokjes en vlees toevoegen, daarna bietjes en worst, doorwarmen. Op smaak brengen met zout, peper en azijn, serveren met crème fraîche." },
  { id: "r37", name: "Broccoli-perziktaart", cat: "vlees", timeCat: "lang", ingredients: ["Broccoli", "Perzik", "Bladerdeeg", "Boursin", "Cashewnoten", "Spekjes"], bereiding: "" },
  { id: "r38", name: "Chili con carne", cat: "vlees", ingredients: ["Aardappels", "Zak chilischotelmix (Stijl Lidl)", "1 ui", "1 paprika", "1 blik maïs", "1 blik bruine bonen", "3 tomaten", "Gehakt", "Komijn"], bereiding: "" },
  { id: "r39", name: "Hutspot", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r40", name: "Kip pilav", cat: "vlees", ingredients: ["300 g rijst", "300 g kip", "70 g tomatenpuree", "1 blik halve perziken op siroop", "2 teentjes knoflook", "1 ui", "1 el chilisaus", "1 el sojasaus", "1 tl paprikapoeder", "½ tl kaneel"], bereiding: "Rijst koken. Ui en knoflook fruiten, kruiden en tomatenpuree meebakken, kipblokjes toevoegen tot gaar. Perziksap, chilisaus en sojasaus toevoegen, daarna de perziken." },
  { id: "r41", name: "Kip Siam (Knorr wereldgerecht)", cat: "vlees", timeCat: "kort", ingredients: [], bereiding: "" },
  { id: "r42", name: "Kofta (Knorr wereldgerecht)", cat: "vlees", timeCat: "lang", ingredients: [], bereiding: "" },
  { id: "r43", name: "Krieltjes à la mama", cat: "vlees", ingredients: ["Gehakt", "Krieltjes", "400 g macaroni/spaghettigroenten", "Rivolitomaatjes"], bereiding: "" },
  { id: "r44", name: "Lasagne", cat: "vlees", ingredients: ["(Vega-)gehakt", "1 prei", "Volkoren bladen (pompoenschijven)", "Honig lasagnesaus", "Blanke rozijnen", "800 g spinazie à la crème"], bereiding: "" },
  { id: "r45", name: "Mexicaanse ovenschotel à la Joris", cat: "vlees", timeCat: "lang", ingredients: ["1 zak tortillachips", "300 g gehakt", "1 zak groentemix (of 2 tomaten, 1-2 paprika's, mais, ui)", "1 zak rauwe andijvie", "250 g crème fraîche", "1 zakje geraspte kaas"], bereiding: "Helft van de chips op de bodem, gehakt met groenten erover, vullen met andijvie. Crème fraîche, kaas en rest chips erop. 15 min. in de oven op 200°C." },
  { id: "r46", name: "Pannekoeken", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r47", name: "Roti (Knorr wereldgerecht)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r48", name: "Spaghetti à la Yara", cat: "vlees", ingredients: ["Volkoren spaghetti", "Spinazie à la crème", "Kip", "Champignonschijfjes", "Rivolitomaatjes", "Boursin", "Pecannoten"], bereiding: "" },
  { id: "r49", name: "Spinazietaart", cat: "vlees", ingredients: ["1 pak pizzadeeg", "200 g volkoren meel", "Spinazie à la crème", "5 tomaten", "Zonnebloempitten", "Gewone rozijnen", "Gehakt", "Boursin"], bereiding: "" },
  { id: "r50", name: "Witlofschotel (Honig recept)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r51", name: "Zuurkool met stoofpeertjes", cat: "vlees", timeCat: "lang", ingredients: ["800 g aardappelen", "2 uien", "200 g kipfilet", "1 el kerriepoeder", "500 g zuurkool", "350 g halve stoofpeertjes", "150 g geraspte kaas"], bereiding: "Oven voor op 190°C. Aardappelen in plakken 10 min. koken. Ui bakken, kip met kerriepoder 4 min. meebakken. Kip en ui in ovenschaal, zuurkool erover, peer in plakjes erover, aardappelen dakpansgewijs erop, kaas erover. 30 min. in de oven." },
  // ---------- EXTRA ----------
  { id: "r52", name: "Speelklei", cat: "extra", ingredients: ["5 dl bloem", "2 dl zout", "2 el aluin in poedervorm", "5 dl water", "2 el olie", "1-2 tabletten eierverf"], bereiding: "Meng bloem, zout en aluin. Water, olie en eierverf aan de kook brengen en bij het bloemmengsel gieten. Roeren, af laten koelen en goed kneden. Bewaren in een goed afgesloten bak." },
];

const LS_KEY = "weekmenu-app-v1";
const newId = (prefix) => prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e4);

// Datumhelpers voor de kalender: datum-sleutel YYYY-MM-DD (lokaal, zonder tijd).
const MONTH_NAMES = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
const MONTH_SHORT = ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtDay = (k) => `${k.slice(8)}-${k.slice(5, 7)}`; // "YYYY-MM-DD" -> "DD-MM"
const dayShortOf = (k) =>
  DAY_NAMES[(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))).getDay() + 1) % 7]
    .slice(0, 2)
    .toLowerCase(); // "YYYY-MM-DD" -> "vr"
const fmtShort = (d) => `${d.getDate()} ${MONTH_SHORT[d.getMonth()]}`;
const jsDayOf = (weekStartDay) => (weekStartDay + 6) % 7; // DAY_NAMES-index (0 = zaterdag) -> Date.getDay()
function startOfWeek(date, weekStartDay) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() - ((d.getDay() - jsDayOf(weekStartDay) + 7) % 7));
  return d;
}
function addDays(date, n) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  d.setDate(d.getDate() + n);
  return d;
}
// startdatum (lokaal, middernacht) van de week op `offset` weken t.o.v. de huidige week
function weekStartFor(weekStartDay, offset) {
  return addDays(startOfWeek(new Date(), weekStartDay), offset * 7);
}
function weekDateKeys(weekStartDay, offset) {
  const start = weekStartFor(weekStartDay, offset);
  return Array.from({ length: 7 }, (_, i) => dateKey(addDays(start, i)));
}
// "hoelang geleden" voor een datum-sleutel (ADR-018): null -> "Onbekend"
function agoLabel(isoKey, todayK) {
  if (!isoKey) return "Onbekend";
  const p = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const days = Math.round((p(todayK).getTime() - p(isoKey).getTime()) / 86400000);
  if (days <= 0) return "vandaag";
  if (days === 1) return "gisteren";
  if (days < 7) return `${days} dagen geleden`;
  if (days < 56) return `${Math.floor(days / 7)} wk geleden`;
  if (days < 365) return `${Math.floor(days / 30)} mnd geleden`;
  return `${Math.floor(days / 365)} jr geleden`;
}
// aantal weken tussen de week van fromDate en de week van toDate
function weeksBetween(fromDate, toDate, weekStartDay) {
  return Math.round((startOfWeek(toDate, weekStartDay).getTime() - startOfWeek(fromDate, weekStartDay).getTime()) / (7 * 24 * 3600 * 1000));
}
// maandrooster voor de kalender; kolommen starten op de ingestelde weekstart
function monthGrid(year, month, weekStartDay) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  let cursor = startOfWeek(first, weekStartDay);
  const weeks = [];
  for (;;) {
    const row = [];
    for (let i = 0; i < 7; i++) {
      row.push({ date: new Date(cursor), key: dateKey(cursor), inMonth: cursor.getMonth() === month });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
    if (cursor.getTime() > last.getTime()) break;
  }
  return weeks;
}

// Prijzen zijn vervallen (ADR-016 deprecate ADR-008). priceKey blijft: de categorie/winkel-koppeling
// van artikelen (ADR-015) matcht receptingrediënten op genormaliseerde naam.
const priceKey = (s) => s.trim().toLowerCase();

// ---- productcatalogus (ADR-017) ----
// Een product is de verzamelnaam voor een ingrediënt, voorraadproduct of extra boodschap. Het staat in
// een lokaal bewaarde catalogus (name/cat/market/unit); per recept/voorraad/extra staat alleen het
// aantal (amount + optionele eenheid) los bij het product.
const UNITS = ["stuks", "g", "kg", "ml", "l", "cl", "blik", "blikje", "pak", "pakje", "zak", "doos", "fles", "pot", "el", "tl", "teen"];
// #35: el = 15 ml, tl = 5 ml (impliciet; dichtheid 1 g/ml) — el/tl horen bij de ml-groep.
const UNIT_FACTOR = { g: 1, kg: 1000, ml: 1, cl: 10, l: 1000, el: 15, tl: 5 }; // naar basiseenheid (g / ml)
const UNIT_GROUP = { g: ["g", "kg"], kg: ["g", "kg"], ml: ["ml", "cl", "l", "el", "tl"], cl: ["ml", "cl", "l", "el", "tl"], l: ["ml", "cl", "l", "el", "tl"], el: ["ml", "cl", "l", "el", "tl"], tl: ["ml", "cl", "l", "el", "tl"] };
// Dedup-sleutel: leading hoeveelheid/verpakking/eenheid eraf + enkelvoud (trailing 's/en/s), zodat
// "1 paprika" en "2 paprika's" hetzelfde product zijn.
function productKey(s) {
  let t = String(s || "").trim().toLowerCase().replace(/\s+/g, " ");
  if (!t) return "";
  const orig = t;
  t = t.replace(/^([¼½¾]|\d+(?:[.,]\d+)?)\s+/, "");
  t = t.replace(/^(stuks|g|kg|ml|l|cl|blikje|blik|pakje|pak|zak|doos|fles|pot|el|tl|teen)\s+/i, "");
  t = t.replace(/'s$/, "");
  if (!/(ss|us|is)$/.test(t)) {
    const stem = t.replace(/(en|s)$/, "");
    if (stem.length >= 4) t = stem;
  }
  return t || orig;
}
// Oude ingrediënt-string ("2 paprika's", "1 blik kokosmelk", "200 g sperziebonen", "½ tl komijn")
// -> amount + unit + naam.
function parseIngredientLabel(s) {
  const t = String(s || "").trim();
  let amount = null, unit = null, name = t;
  const m = /^([¼½¾]|\d+(?:[.,]\d+)?)\s+(.*)$/.exec(t);
  if (m) {
    amount = m[1] === "¼" ? 0.25 : m[1] === "½" ? 0.5 : m[1] === "¾" ? 0.75 : Number(m[1].replace(",", "."));
    const rest = m[2];
    const w = /^([A-Za-z]+)\s+(.+)$/.exec(rest);
    if (w && UNITS.includes(w[1].toLowerCase())) { unit = w[1].toLowerCase(); name = w[2]; }
    else name = rest;
  }
  return { amount, unit, name: name.trim() };
}
const PLURAL_EX = { ei: "eieren", ui: "uien", tomaat: "tomaten", aardappel: "aardappelen", courgette: "courgettes" };
// Meervoud zonder AI: productnaam is het enkelvoud; amount != 1 -> meervoud via regel + kleine uitzonderingen.
function pluralOf(name) {
  const k = productKey(name);
  if (PLURAL_EX[k]) {
    const ex = PLURAL_EX[k];
    return name && name[0] === name[0].toUpperCase() ? ex.charAt(0).toUpperCase() + ex.slice(1) : ex;
  }
  return /[aeiouy]$/i.test(name || "") ? name + "'s" : name + "en";
}
function convertAmount(amount, from, to) {
  if (!(from in UNIT_FACTOR) || !(to in UNIT_FACTOR)) return null;
  const a = Number(amount);
  if (!Number.isFinite(a)) return null;
  return (a * UNIT_FACTOR[from]) / UNIT_FACTOR[to];
}
const roundAmt = (n) => Math.round(n * 100) / 100;
// Auto-conversie alleen over de 1000-grens (g<->kg, ml<->l); cl alleen handmatig via de eenheid-select.
function normalizeAmountUnit(amount, unit) {
  const a = Number(amount);
  if (!Number.isFinite(a) || !unit) return { amount: a, unit };
  if (unit === "g" && a >= 1000) return { amount: roundAmt(a / 1000), unit: "kg" };
  if (unit === "kg" && a < 1) return { amount: roundAmt(a * 1000), unit: "g" };
  if (unit === "ml" && a >= 1000) return { amount: roundAmt(a / 1000), unit: "l" };
  if (unit === "l" && a < 1) return { amount: roundAmt(a * 1000), unit: "ml" };
  return { amount: a, unit };
}
// #35: optionele "inhoud per verpakking" op een product (bijv. 1 pot = 500 g -> pack { amount: 500, unit: "g" }).
function normalizePack(pack) {
  if (!pack || typeof pack !== "object") return null;
  const amount = Number(pack.amount);
  const unit = typeof pack.unit === "string" ? pack.unit.trim().toLowerCase() : "";
  if (!Number.isFinite(amount) || amount <= 0 || !unit) return null;
  return { amount: roundAmt(amount), unit: UNITS.includes(unit) ? unit : unit.slice(0, 8) };
}
// #35: weergave op de boodschappenlijst in winkel-eenheid. Som in basiseenheid (g/ml, dichtheid 1 g/ml);
// als het product een pack heeft -> hele verpakkingen (ceil, alleen hele verpakkingen haalbaar) in de
// product-eenheid (bijv. "1 pot Kwark"); anders g/kg/ml/l met min. 100 g/ml (afronden omhoog). Nooit el/tl.
function shopDisplayAmount(amount, unit, product) {
  if (amount == null || !Number.isFinite(Number(amount))) return { amount: null, unit: unit || null };
  const a = Number(amount);
  const pack = product && product.pack;
  if (pack && UNIT_FACTOR[pack.unit] != null) {
    const packBase = Number(pack.amount) * UNIT_FACTOR[pack.unit];
    if (packBase > 0) {
      let base = null;
      if (unit && UNIT_FACTOR[unit] != null) base = a * UNIT_FACTOR[unit];
      else if (!unit || unit === (product.unit || null)) base = a * packBase; // aantal verpakkingen
      if (base != null) {
        const n = Math.max(1, Math.ceil(roundAmt(base) / packBase - 1e-9));
        return { amount: n, unit: product.unit || null };
      }
    }
  }
  if (unit && UNIT_FACTOR[unit] != null) {
    const fam = unit === "g" || unit === "kg" ? "g" : "ml";
    let base = roundAmt(a * UNIT_FACTOR[unit]);
    if (base > 0 && base < 100) base = 100; // nooit < 100 g/ml op de lijst
    return normalizeAmountUnit(base, fam);
  }
  return normalizeAmountUnit(a, unit);
}
function normalizeProducts(arr) {
  const out = [];
  const seen = new Set();
  (arr || []).forEach((p) => {
    if (!p || !p.name) return;
    const key = productKey(p.name);
    if (!key || seen.has(key)) return;
    seen.add(key);
    out.push({
      id: String(p.id || "p" + out.length),
      name: String(p.name).trim(),
      cat: typeof p.cat === "string" && p.cat ? p.cat : "overig",
      market: p.market != null && String(p.market) !== "" ? String(p.market) : null,
      unit: UNITS.includes(p.unit) ? p.unit : (typeof p.unit === "string" && p.unit.trim() ? p.unit.trim().slice(0, 8) : null),
      tags: Array.isArray(p.tags) ? [...new Set(p.tags.map((t) => String(t || "").trim().toLowerCase()).filter(Boolean))] : [], // #37
      pack: normalizePack(p.pack), // #35: inhoud per verpakking (bijv. { amount: 500, unit: "g" } = 1 pot)
      ...(typeof p.updatedAt === "number" ? { updatedAt: p.updatedAt } : {}),
    });
  });
  return out;
}
// Catalogus opbouwen uit bestaande data (BASE_RECIPES + opgeslagen recepten/voorraad/extra's), met dedup.
function buildCatalog(stored) {
  const map = new Map();
  const ensure = (name, extra) => {
    const key = productKey(name);
    if (!key) return null;
    let p = map.get(key);
    if (!p) {
      p = { id: "p" + (map.size + 1) + "-" + key.slice(0, 10), name: String(name).trim(), cat: (extra && extra.cat) || "overig", market: (extra && extra.market) || null, unit: (extra && extra.unit) || null };
      map.set(key, p);
    } else if (productKey(p.name) !== p.name.toLowerCase() && productKey(name) === String(name).trim().toLowerCase()) {
      p.name = String(name).trim(); // enkelvoudige vorm als Weergavenaam ("1 ui" wint van "2 uien")
    } else {
      if (extra && extra.cat && p.cat === "overig") p.cat = extra.cat;
      if (extra && extra.market && !p.market) p.market = extra.market;
      if (extra && extra.unit && !p.unit) p.unit = extra.unit;
    }
    return p;
  };
  BASE_RECIPES.forEach((r) => (r.ingredients || []).forEach((s) => { const x = parseIngredientLabel(s); ensure(x.name, { unit: x.unit }); }));
  STOCK_DEFAULT.forEach((s) => ensure(s.name, { cat: s.cat }));
  const recs = stored && Array.isArray(stored.recipes) && stored.recipes.length ? stored.recipes : [];
  recs.forEach((r) => (r.ingredients || []).forEach((ing) => {
    if (typeof ing === "string") { const x = parseIngredientLabel(ing); ensure(x.name, { unit: x.unit }); }
    else if (ing && ing.name) ensure(ing.name, { unit: ing.unit });
  }));
  (stored && Array.isArray(stored.stock) ? stored.stock : []).forEach((s) => { if (s && s.name) ensure(s.name, { cat: s.cat, market: s.market }); });
  normalizeExtras(stored && stored.extraItems).forEach((x) => ensure(x.name, { cat: x.cat || null }));
  return [...map.values()];
}
// Oude string-ingrediënten omzetten naar { pid, amount, unit, name } met koppeling aan de catalogus.
function migrateRecipesIngredients(recs, catalog) {
  const byKey = new Map(catalog.map((p) => [productKey(p.name), p]));
  return (recs || []).map((r) => ({
    ...r,
    ingredients: (r.ingredients || []).map((ing) => {
      if (typeof ing !== "string") return ing;
      const t = ing.trim();
      if (!t) return null;
      const x = parseIngredientLabel(t);
      const p = byKey.get(productKey(x.name));
      if (!p) return t;
      return { pid: p.id, amount: x.amount, unit: x.unit, name: p.name };
    }).filter(Boolean),
  }));
}
const pidOfName = (catalog, name) => {
  const p = catalog.find((x) => productKey(x.name) === productKey(name));
  return p ? p.id : null;
};
// Eenheid van een ingrediënt: eigen unit wint; alleen bij ontbrekende key de product-standaard.
function ingUnit(ing, p) {
  if (!ing || typeof ing !== "object") return "";
  return ("unit" in ing ? ing.unit : p && p.unit) || "";
}
// Weergavetekst van een ingrediënt: "5 paprika's", "1 blik kokosmelk", "200 g sperziebonen", "kokosmelk".
function ingLabel(ing, prodById) {
  if (typeof ing === "string") return ing;
  if (!ing || typeof ing !== "object") return "";
  const p = ing.pid && prodById ? prodById[ing.pid] : null;
  const name = p ? p.name : ing.name || "";
  if (ing.amount == null || ing.amount === "") return name;
  const unit = ingUnit(ing, p);
  const shown = Number(ing.amount) === 1 ? name : pluralOf(name);
  return [String(ing.amount).replace(".", ","), unit, shown].filter(Boolean).join(" ");
}
function matchProducts(products, q) {
  const list = products.filter((p) => p.name.toLowerCase().includes(q) || productKey(p.name).includes(q));
  list.sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.name.localeCompare(b.name, "nl");
  });
  return list.slice(0, 6);
}
// Schalen per dag (ADR-012) op het gestructureerde ingrediënt: alleen amount schaalt mee, geen eenheid.
function scaleIng(ing, factor, prodById) {
  if (typeof ing === "string") return scaleIngredient(ing, factor);
  if (!ing || !Number.isFinite(factor) || factor === 1 || ing.amount == null || ing.amount === "") return null;
  const p = ing.pid && prodById ? prodById[ing.pid] : null;
  const unit = ingUnit(ing, p);
  if (NO_SCALE_UNITS.includes(unit)) return null;
  const scaled = Math.max(1, Math.round(Number(ing.amount) * factor));
  if (scaled === Number(ing.amount)) return null;
  return { ...ing, amount: scaled };
}

// ---- gerecht-invoer met autocomplete (ADR-012) ----
// Suggesties na >= 2 letters; exacte (hoofdletterongevoelige) match wint.
function matchRecipes(recipes, q) {
  const list = recipes.filter((r) => r.cat !== "extra" && r.name.toLowerCase().includes(q));
  list.sort((a, b) => {
    const as = a.name.toLowerCase().startsWith(q) ? 0 : 1;
    const bs = b.name.toLowerCase().startsWith(q) ? 0 : 1;
    return as - bs || a.name.localeCompare(b.name);
  });
  return list.slice(0, 6);
}
function highlightMatch(name, q) {
  const i = name.toLowerCase().indexOf(q);
  if (i < 0) return name;
  return React.createElement(
    React.Fragment,
    null,
    name.slice(0, i),
    React.createElement("span", { className: "mark" }, name.slice(i, i + q.length)),
    name.slice(i + q.length)
  );
}

// ---- schalen van hoeveelheden per dag (ADR-012) ----
// factor = eters die dag / householdSize. Alleen "<getal> <eenheid>..." schaalt mee;
// vaste verpakkingen (blik/pak/zak/...) en tekst zonder getal blijven gelijk.
const NO_SCALE_UNITS = ["blik", "pak", "pakje", "zak", "doos", "fles"];
function scaleIngredient(label, factor) {
  if (!Number.isFinite(factor) || factor === 1) return null;
  const m = /^\s*(\d+(?:[.,]\d+)?)\s+([A-Za-z\u00e0-\u00ff]+)(.*)$/.exec(label);
  if (!m) return null;
  if (NO_SCALE_UNITS.includes(m[2].toLowerCase())) return null;
  const num = Number(m[1].replace(",", "."));
  const scaled = Math.max(1, Math.round(num * factor));
  const out = `${scaled} ${m[2]}${m[3]}`;
  return out === label ? null : out;
}
const fmtFactor = (f) => (Math.round(f * 10) / 10).toString().replace(".", ",");

function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {}
}
// ---- Delen via bestand (ADR-019): pure helpers ----
const SHARE_BUNDLE = "weekmenu-share-v1";
// Vergelijk records zonder tijdstempel, zodat "nieuwste wint" alleen bij echte inhoudelijke wijzigingen aanslaat.
const shareStrip = (o) => JSON.stringify(o, (k, v) => (k === "updatedAt" ? undefined : v));
function shareStampArray(prevArr, nextArr, keyOf) {
  const now = Date.now();
  const prevMap = new Map((prevArr || []).map((r) => [keyOf(r), r]));
  return (nextArr || []).map((r) => {
    const p = prevMap.get(keyOf(r));
    return !p || shareStrip(p) !== shareStrip(r) ? { ...r, updatedAt: now } : r;
  });
}
function shareStampObject(prevObj, nextObj) {
  const now = Date.now();
  const out = {};
  Object.entries(nextObj || {}).forEach(([k, v]) => {
    const p = (prevObj || {})[k];
    out[k] = !p || shareStrip(p) !== shareStrip(v) ? { ...v, updatedAt: now } : v;
  });
  return out;
}
function shareTombs(prevArr, nextArr, keyOf, prefix) {
  const nextKeys = new Set((nextArr || []).map(keyOf));
  const tombs = {};
  (prevArr || []).forEach((r) => {
    const k = keyOf(r);
    if (!nextKeys.has(k)) tombs[prefix + k] = Date.now();
  });
  return tombs;
}
function shareTombsObject(prevObj, nextObj, prefix) {
  const tombs = {};
  Object.keys(prevObj || {}).forEach((k) => {
    if (!Object.prototype.hasOwnProperty.call(nextObj || {}, k)) tombs[prefix + k] = Date.now();
  });
  return tombs;
}
function shareTs(r) {
  return r && typeof r.updatedAt === "number" ? r.updatedAt : 0;
}
// Samenvoegregels (ADR-019): per record wint de nieuwste versie (updatedAt). Zit een record niet
// meer in het deelbestand, dan geldt het daar als verwijderd (tijdstempel uit data.deleted).
// Instellingen en vinkjes gaan als één geheel mee (updatedAt/checkedAt). Puur: geen Date.now,
// zodat de regels deterministisch testbaar zijn.
function mergeShareBundle(local, bundle) {
  const chips = (bundle && bundle.chips) || {};
  const b = (bundle && bundle.data) || {};
  const bDel = b.deleted || {};
  const out = { deleted: { ...((local && local.deleted) || {}) } };
  const conflicts = [];
  const counts = {};
  const on = (k) => chips[k] !== false;
  const keepC = (kind, extra) => { counts[kind] = Object.assign({ added: 0, updated: 0, kept: 0, removed: 0 }, extra || {}); };
  const locNames = {};
  ((local && local.stockLocations) || []).concat(b.stockLocations || []).forEach((l) => { if (l && l.id) locNames[l.id] = l.name; });
  function mergeArr(kind, chip, prefix, keyOf, label, prevA, incA) {
    const prev = prevA || [];
    const incMap = new Map((incA || []).map((r) => [keyOf(r), r]));
    const res = [];
    const c = { added: 0, updated: 0, kept: 0, removed: 0 };
    prev.forEach((r) => {
      const k = keyOf(r);
      const tomb = prefix + k;
      const inR = incMap.get(k);
      if (inR) incMap.delete(k);
      const tombB = bDel[tomb];
      const tombL = out.deleted[tomb];
      // in de bron teruggekomen én nieuwer dan een verwijderingsmarkering? Dan leeft het weer.
      if (inR && ((tombB != null && shareTs(inR) > tombB) || (tombL != null && shareTs(inR) > tombL))) delete out.deleted[tomb];
      if (tombB != null && tombB >= shareTs(r)) { c.removed++; out.deleted[tomb] = tombB; return; }
      if (tombL != null && tombL >= shareTs(r) && !(inR && shareTs(inR) > tombL)) return;
      if (inR && shareTs(inR) > shareTs(r)) {
        res.push(inR); c.updated++;
        if (shareStrip(r) !== shareStrip(inR)) conflicts.push({ naam: label(r), hier: label(r), daar: label(inR) });
      } else { res.push(r); c.kept++; }
    });
    incMap.forEach((r, k) => {
      const tomb = prefix + k;
      const tombL = out.deleted[tomb];
      if (tombL != null && tombL >= shareTs(r)) return; // hier bewust verwijderd
      if (tombL != null) delete out.deleted[tomb];
      res.push(r); c.added++;
    });
    counts[kind] = c;
    return res;
  }
  const kinds = [
    { key: "recipes", chip: "recipes", prefix: "recipe:", keyOf: (r) => r.id, label: (r) => r.name + " (" + r.timeCat + (Array.isArray(r.tags) && r.tags.length ? ", " + r.tags.join("/") : "") + ")" },
    { key: "products", chip: "products", prefix: "product:", keyOf: (p) => p.id, label: (p) => p.name },
    { key: "stockLocations", chip: "stock", prefix: "location:", keyOf: (l) => l.id, label: (l) => l.name },
    { key: "stock", chip: "stock", prefix: "stock:", keyOf: (s) => s.loc + "|" + (s.pid || s.name), label: (s) => s.name + " (" + (locNames[s.loc] || s.loc) + ", " + s.have + "×)" },
    { key: "extraItems", chip: "menu", prefix: "extra:", keyOf: (x) => x.pid || x.name, label: (x) => x.name },
  ];
  kinds.forEach((m) => {
    out[m.key] = on(m.chip)
      ? mergeArr(m.key, m.chip, m.prefix, m.keyOf, m.label, local[m.key], b[m.key])
      : (keepC(m.key), (local[m.key] || []));
  });
  if (on("menu")) {
    const prev = local.menuByDate || {};
    const inc = b.menuByDate || {};
    const res = {};
    const c = { added: 0, updated: 0, kept: 0, removed: 0 };
    Object.keys(prev).forEach((k) => {
      const tomb = "menu:" + k;
      const inE = inc[k];
      const tombL = out.deleted[tomb];
      if (inE && tombL != null && shareTs(inE) > tombL) delete out.deleted[tomb];
      const tombB = bDel[tomb];
      if (tombB != null && tombB >= shareTs(prev[k])) { c.removed++; out.deleted[tomb] = tombB; return; }
      if (tombL != null && tombL >= shareTs(prev[k]) && !(inE && shareTs(inE) > tombL)) return;
      if (inE && shareTs(inE) > shareTs(prev[k])) { res[k] = inE; c.updated++; }
      else { res[k] = prev[k]; c.kept++; }
    });
    Object.keys(inc).forEach((k) => {
      if (k in prev || k in res) return;
      const tomb = "menu:" + k;
      const tombL = out.deleted[tomb];
      if (tombL != null && tombL >= shareTs(inc[k])) return;
      if (tombL != null) delete out.deleted[tomb];
      res[k] = inc[k]; c.added++;
    });
    out.menuByDate = res;
    counts.menuByDate = c;
  } else { out.menuByDate = local.menuByDate || {}; keepC("menuByDate"); }
  if (on("settings")) {
    const ls = local.settings || {};
    const bs = b.settings;
    if (bs && shareTs(bs) > shareTs(ls)) { out.settings = bs; keepC("settings", { updated: 1 }); }
    else { out.settings = ls; keepC("settings", { kept: 1 }); }
    const lct = local.checkedAt || 0;
    const bct = typeof b.checkedAt === "number" ? b.checkedAt : 0;
    if (b.checked && bct > lct) { out.checked = b.checked; out.checkedAt = bct; }
    else { out.checked = local.checked || {}; out.checkedAt = lct; }
    Object.entries(bDel).forEach(([k, t]) => { if (!(k in out.deleted) || out.deleted[k] < t) out.deleted[k] = t; });
  } else {
    out.settings = local.settings || {};
    out.checked = local.checked || {};
    out.checkedAt = local.checkedAt || 0;
  }
  return { next: out, rapport: { counts, conflicts } };
}


// Migratie (ADR-005): oude state met `menu` als array van 7 dagen (index t.o.v. de weekstart,
// zonder datum) wordt omgezet naar `menuByDate` keyed op de datum van de huidige week.
// Vinkjes-sleutels "<dagindex>-..." worden mee omgezet naar "<datum>-...".
function migrateStored(stored) {
  if (!stored || typeof stored !== "object" || Array.isArray(stored)) return stored;
  const out = { ...stored };
  if (!out.menuByDate && Array.isArray(out.menu)) {
    const weekStartDay = normalizeSettings(out.settings).weekStartDay;
    const keys = weekDateKeys(weekStartDay, 0);
    const mbd = {};
    out.menu.forEach((entry, i) => {
      if (entry && keys[i]) mbd[keys[i]] = entry;
    });
    out.menuByDate = mbd;
    if (out.checked && typeof out.checked === "object") {
      const checked = {};
      Object.entries(out.checked).forEach(([k, v]) => {
        const m = /^(\d)-(.+)$/.exec(k);
        checked[m && keys[Number(m[1])] ? `${keys[Number(m[1])]}-${m[2]}` : k] = v;
      });
      out.checked = checked;
    }
    delete out.menu;
  }
  return out;
}

function loadRecipes(stored) {
  const edits = (stored && stored.edits) || {};
  if (stored && Array.isArray(stored.recipes) && stored.recipes.length > 0) {
    return stored.recipes.map((r) => normalizeRecipe({ ...r, ...(edits[r.id] || {}) }));
  }
  return BASE_RECIPES.map((r) => normalizeRecipe({ ...r, ...(edits[r.id] || {}) }));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function App() {
  const stored = useMemo(() => migrateStored(loadState()), []);
  // productcatalogus (ADR-017): bij eerste load/migratie uit bestaande data + BASE_RECIPES opgebouwd (dedup via productKey)
  const catalog0 = useMemo(
    () => (stored && Array.isArray(stored.products) && stored.products.length ? normalizeProducts(stored.products) : normalizeProducts(buildCatalog(stored))), // #35: pack: null aanvullen bij opbouwen
    [stored]
  );
  const [tab, setTab] = useState("menu");
  const [menuByDate, setMenuByDateRaw] = useState((stored && stored.menuByDate) || {}); // per datum (YYYY-MM-DD): {id, locked}
  const [weekOffset, setWeekOffset] = useState(0); // 0 = week van vandaag; bij openen start de app automatisch in de huidige week
  const [recipes, setRecipesRaw] = useState(() => migrateRecipesIngredients(loadRecipes(stored), catalog0)); // receptenpool (ADR-006); string-ingrediënten gemigreerd naar producten (ADR-017)
  const [newRecipe, setNewRecipe] = useState({ name: "", cat: "vega", timeCat: "normaal", tags: [], tagDraft: "", ingredients: [], bereiding: "" });
  const [checked, setCheckedRaw] = useState((stored && stored.checked) || {});
  const [extraItems, setExtraItemsRaw] = useState(() => normalizeExtras(stored && stored.extraItems).map((x) => ({ ...x, pid: pidOfName(catalog0, x.name), amount: x.amount != null ? x.amount : 1, unit: x.unit || null })));
  const [stockLocations, setStockLocationsRaw] = useState(() => normalizeLocations(stored && stored.stockLocations));
  const [stock, setStockRaw] = useState(() =>
    stored && Array.isArray(stored.stock) && stored.stock.length > 0
      ? normalizeStock(stored.stock, normalizeLocations(stored && stored.stockLocations)).map((s) => ({ ...s, pid: pidOfName(catalog0, s.name) }))
      : defaultStock().map((s) => ({ ...s, pid: pidOfName(catalog0, s.name) }))
  );
  // voorraad-tab (ADR-015): uitklapbare locaties, edit-modus, formulieren, info-popover
  const [openLocs, setOpenLocs] = useState({}); // locatie-id -> true; start altijd ingeklapt
  const [editLoc, setEditLoc] = useState(null); // locatie-id in edit-modus (gewenst aanpasbaar)
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");

  const [stockInfoOpen, setStockInfoOpen] = useState(false);
  // boodschappen-tab (ADR-015): categorie-volgorde, categorieën beheren, info-popover
  const [shopInfoOpen, setShopInfoOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [settings, setSettingsRaw] = useState(() => normalizeSettings(stored && stored.settings)); // per huishouden, lokaal bewaard (ADR-009)
  // boodschappenlijst van vandaag (ADR-016): aantal dagen + supermarktkeuze zijn vluchtig (worden niet opgeslagen)
  const [shopDays, setShopDays] = useState(null); // null = default min(4, max aaneengesloten gelockte dagen)
  const [shopMarkets, setShopMarkets] = useState(null); // null = default uit settings (defaultShop per winkel)
  const [shopDone, setShopDone] = useState(false); // "Verwerk update" geklikt -> melding tonen (#34)
  const [hiddenChecked, setHiddenChecked] = useState(false); // #34: na "Verwerk update" zijn afgevinkte rijen verborgen
  const [showChecked, setShowChecked] = useState(false); // #34: chip "n afgevinkt · toon" zet ze tijdelijk terug
  const [openRecipe, setOpenRecipe] = useState(null); // recept met open readonly-detail (ADR-018)
  const [editRecipe, setEditRecipe] = useState(null); // recept-id in bewerkmodus via ✏️ (ADR-018)
  // weekmenu-tab v2 (ADR-012): datum-sheet, regels-sheet, eters per dag, getypte invoer
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);
  const [deviationKey, setDeviationKey] = useState(null); // #42: datum-sleutel met open afwijkings-sheet
  const [devTab, setDevTab] = useState("instant"); // #42: "instant" | "afhaal"
  const [devPick, setDevPick] = useState({}); // #42: { pid: aantal } gekozen instant-producten
  const [ruleDraft, setRuleDraft] = useState({ kind: "product", tag: "", days: 3 }); // #37: nieuwe tag-regel in de regels-sheet
  const [eatersOpen, setEatersOpen] = useState(null); // datum-sleutel waarvan de eters-regel open is
  const [drafts, setDrafts] = useState({}); // datum-sleutel -> getypte tekst in het gerechtveld
  const [openSuggest, setOpenSuggest] = useState(null); // datum-sleutel met open suggestielijst
  const [activeSuggest, setActiveSuggest] = useState(0);
  // recepten-tab: zoeken/filteren/tags + bereidingstijd-categorie (ADR-013)
  const [recipeQuery, setRecipeQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("alle");
  const [ingFilter, setIngFilter] = useState("");
  const [tagFilters, setTagFilters] = useState([]);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [recipeInfoOpen, setRecipeInfoOpen] = useState(false);
  const [recipeSort, setRecipeSort] = useState("naam"); // "naam" | "laatst" — sorteren op laatst gegeten (ADR-018), vluchtig
  const [sortMenuOpen, setSortMenuOpen] = useState(false); // sorteer-dropdown open (ADR-018)
  const [tagDraft, setTagDraft] = useState(""); // tag-invoer bij het openstaande bewerkte recept
  const [daySheetRecipe, setDaySheetRecipe] = useState(null); // recept waarvoor de dagkiezer (deze week) open is
  const [weekToast, setWeekToast] = useState(""); // melding na toevoegen aan het weekmenu
  const [products, setProductsRaw] = useState(() => catalog0); // productcatalogus (ADR-017), lokaal bewaard
  // productcatalogus (ADR-017): inline product-kaart, ingrediënt-rijen met autocomplete, inline add-rijen, catalogus in Instellingen
  const [openProd, setOpenProd] = useState(null); // rij-sleutel waar de product-kaart open is
  const [prodEdit, setProdEdit] = useState(null); // bewerkte velden van het open product
  const [ingDrafts, setIngDrafts] = useState({}); // "rid:idx" -> getypte productnaam
  const [ingSuggest, setIngSuggest] = useState(null); // "rid:idx" met open autocomplete
  const [activeIngSuggest, setActiveIngSuggest] = useState(0);
  const [addProdRow, setAddProdRow] = useState(null); // locatie-id met inline product-add-rij (onderaan)
  const [newProdRow, setNewProdRow] = useState({ name: "", want: 1 });
  const [prodRowSuggest, setProdRowSuggest] = useState(false);
  const [newExtra, setNewExtra] = useState({ name: "", amount: 1 }); // amount 0 = veld leeg
  const [extraSuggest, setExtraSuggest] = useState(false);
  const [prodQuery, setProdQuery] = useState("");
  const [catOpen, setCatOpen] = useState(false); // #44: productcatalogus initieel ingeklapt (vluchtig)
  const [catFilters, setCatFilters] = useState([]); // #44: actieve categorie-filters (leeg = alle)
  const [openDay, setOpenDay] = useState(null); // weekmenu: gelockte dag met open ingrediënt/bereiding-blok

  // ---- Delen via bestand (ADR-019): extra state ----
  // verwijderingsmarkeringen ("recipe:<id>" -> timestamp) zodat verwijderingen deelbaar zijn
  const [deleted, setDeletedRaw] = useState((stored && stored.deleted) || {});
  // vinkjes-set als één geheel met één stempel (net als settings.updatedAt)
  const [checkedAt, setCheckedAtRaw] = useState(stored && typeof stored.checkedAt === "number" ? stored.checkedAt : 0);
  const [delenOpen, setDelenOpen] = useState(null); // delen: null | "export" | "info"
  const [deelChips, setDeelChips] = useState({ recipes: true, products: true, stock: true, menu: true, settings: true });
  const [importReview, setImportReview] = useState(null); // ingelezen deelbestand wacht op Samenvoegen
  const [shareToast, setShareToast] = useState("");

  // ---- Delen via bestand (ADR-019): stempel-wrappers ----
  // Gewone mutaties krijgen per record een updatedAt ("nieuwste wint") en weggevallen records
  // komen in `deleted`. De wrapper draait als geneste updater over de actuele state, zodat
  // opeenvolgende functionele updates in één event gewoon op de nieuwste stand bouwen.
  // Importeren (applyImportReview) loopt via de Raw-setters zodat de tijdstempels uit het
  // deelbestand ongewijzigd overgenomen worden.
  function bumpDeleted(entries) {
    if (entries && Object.keys(entries).length) setDeletedRaw((d) => ({ ...d, ...entries }));
  }
  const setMenuByDate = (v) => setMenuByDateRaw((prev) => {
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombsObject(prev, next, "menu:"));
    return shareStampObject(prev, next);
  });
  const setRecipes = (v) => setRecipesRaw((prev) => {
    const keyOf = (r) => r.id;
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombs(prev, next, keyOf, "recipe:"));
    return shareStampArray(prev, next, keyOf);
  });
  const setChecked = (v) => setCheckedRaw((prev) => {
    const next = typeof v === "function" ? v(prev) : v;
    if (shareStrip(prev) !== shareStrip(next)) setCheckedAtRaw(Date.now());
    return next;
  });
  const setExtraItems = (v) => setExtraItemsRaw((prev) => {
    const keyOf = (x) => x.pid || x.name;
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombs(prev, next, keyOf, "extra:"));
    return shareStampArray(prev, next, keyOf);
  });
  const setStockLocations = (v) => setStockLocationsRaw((prev) => {
    const keyOf = (l) => l.id;
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombs(prev, next, keyOf, "location:"));
    return shareStampArray(prev, next, keyOf);
  });
  const setStock = (v) => setStockRaw((prev) => {
    const keyOf = (s) => s.loc + "|" + (s.pid || s.name);
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombs(prev, next, keyOf, "stock:"));
    return shareStampArray(prev, next, keyOf);
  });
  const setSettings = (v) => setSettingsRaw((prev) => {
    const next = normalizeSettings(typeof v === "function" ? v(prev) : v);
    return shareStrip(prev) !== shareStrip(next) ? { ...next, updatedAt: Date.now() } : next;
  });
  const setProducts = (v) => setProductsRaw((prev) => {
    const keyOf = (x) => x.id;
    const next = typeof v === "function" ? v(prev) : v;
    bumpDeleted(shareTombs(prev, next, keyOf, "product:"));
    return shareStampArray(prev, next, keyOf);
  });

  useEffect(() => {
    saveState({ menuByDate, recipes, checked, extraItems, settings, stock, stockLocations, products, deleted, checkedAt });
  }, [menuByDate, recipes, checked, extraItems, settings, stock, stockLocations, products, deleted, checkedAt]);

  // #40: thema toepassen op <body> (CSS-variabelen cascaden) + PWA-statusbalk (theme-color)
  useEffect(() => {
    if (typeof document !== "undefined" && document.body) document.body.dataset.theme = settings.theme;
    const meta = typeof document !== "undefined" && document.querySelector ? document.querySelector('meta[name="theme-color"]') : null;
    if (meta && meta.setAttribute) meta.setAttribute("content", THEME_META[settings.theme] || THEME_META.standaard);
  }, [settings.theme]);

  const markets = settings.markets;
  const days = useMemo(
    () => DAY_NAMES.map((_, i) => DAY_NAMES[(settings.weekStartDay + i) % 7]),
    [settings.weekStartDay]
  );
  const fishDays = settings.fishDays;
  const otherDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => !fishDays.includes(d));
  const vegaCount = Math.min(Math.max(0, Number(settings.vegaTarget) || 0), otherDays.length);

  // Geselecteerde week (offset in weken t.o.v. de huidige week) en bijbehorende datums.
  const todayKey = dateKey(new Date());
  const weekStart = weekStartFor(settings.weekStartDay, weekOffset);
  const weekKeys = weekDateKeys(settings.weekStartDay, weekOffset);
  const weekEntries = weekKeys.map((k) => menuByDate[k] || null);
  const weekEnd = addDays(weekStart, 6);
  const weekLabel = `${fmtShort(weekStart)} – ${fmtShort(weekEnd)} ${weekEnd.getFullYear()}`;
  const calAnchor = addDays(weekStart, 3); // kalender toont de maand rond het midden van de getoonde week
  const todayDayIdx = (new Date().getDay() + 1) % 7; // DAY_NAMES-index van vandaag (0 = zaterdag)
  const todayLabel = `${DAY_NAMES[todayDayIdx].slice(0, 2).toLowerCase()} ${fmtDay(todayKey)}`;
  const calWeeks = monthGrid(calAnchor.getFullYear(), calAnchor.getMonth(), settings.weekStartDay);

  // #37: tag-regels (settings.tagRules); alle tags = product-tags ∪ gerecht-tags
  const allRuleTags = [...new Set([...products.flatMap((p) => p.tags || []), ...recipes.flatMap((r) => r.tags || [])])].sort((a, b) =>
    a.localeCompare(b, "nl")
  );
  function addTagRule() {
    const tag = (ruleDraft.tag || "").trim().toLowerCase();
    if (!tag) return;
    const kind = ruleDraft.kind === "recipe" ? "recipe" : "product";
    const days = Math.min(30, Math.max(0, Math.floor(Number(ruleDraft.days) || 0)));
    updateSettings({
      tagRules: [...(settings.tagRules || []).filter((r) => !(r.kind === kind && r.tag === tag)), { kind, tag, days }],
    });
    setRuleDraft({ kind, tag: "", days });
  }
  function setTagRuleDays(i, days) {
    updateSettings({
      tagRules: (settings.tagRules || []).map((r, j) => (j === i ? { ...r, days: Math.min(30, Math.max(0, Math.floor(Number(days) || 0))) } : r)),
    });
  }
  function removeTagRule(i) {
    updateSettings({ tagRules: (settings.tagRules || []).filter((_, j) => j !== i) });
  }
  function updateSettings(patch) {
    setSettings((s) => normalizeSettings({ ...s, ...patch }));
  }

  function updateMarket(mi, patch) {
    setSettings((s) => normalizeSettings({ ...s, markets: s.markets.map((m, j) => (j === mi ? { ...m, ...patch } : m)) }));
  }

  // ---- voorraad-locaties, categorieën en winkelvoorkeur (ADR-015) ----
  const shopCats = settings.shopCats;
  const catRank = (cat) => {
    const i = shopCats.indexOf(cat);
    return i < 0 ? shopCats.length : i; // Onbekend/geen categorie: helemaal achteraan
  };
  // productcatalogus (ADR-017): categorie/winkel/eenheid komen uit het product (fallback: oude stock/extra-koppeling)
  const prodById = useMemo(() => Object.fromEntries(products.map((p) => [p.id, p])), [products]);
  const prodByKey = useMemo(() => {
    const m = new Map();
    products.forEach((p) => { const k = productKey(p.name); if (k && !m.has(k)) m.set(k, p); });
    return m;
  }, [products]);
  const catMap = useMemo(() => {
    const m = new Map();
    products.forEach((p) => { const k = productKey(p.name); if (k && !m.has(k)) m.set(k, { cat: p.cat, market: p.market }); });
    stock.forEach((s) => {
      const k = priceKey(s.name);
      if (k && !m.has(k)) m.set(k, { cat: s.cat, market: s.market });
    });
    extraItems.forEach((x) => {
      const k = priceKey(x.name);
      if (k && x.cat && !m.has(k)) m.set(k, { cat: x.cat, market: null });
    });
    return m;
  }, [products, stock, extraItems]);
  const catOf = (label) => {
    const e = catMap.get(productKey(label)) || catMap.get(priceKey(label));
    return e ? e.cat : null;
  };
  const marketOf = (label) => {
    const e = catMap.get(productKey(label)) || catMap.get(priceKey(label));
    return e && e.market ? e.market : null;
  };
  const prodOfLabel = (label, pid) => (pid && prodById[pid]) || prodByKey.get(productKey(label)) || prodByKey.get(priceKey(label)) || null;
  const pq = prodQuery.trim().toLowerCase();
  // #44: cataloguslijst = A–Z (nl) gesorteerd, gefilterd op zoekterm + categorie-chips
  const filteredProducts = products
    .filter((p) => !pq || p.name.toLowerCase().includes(pq) || productKey(p.name).includes(pq))
    .filter((p) => catFilters.length === 0 || catFilters.includes(p.cat))
    .sort((a, b) => a.name.localeCompare(b.name, "nl") || String(a.cat || "").localeCompare(String(b.cat || ""), "nl") || String(a.id).localeCompare(String(b.id)));
  const marketChip = (key) => {
    const m = markets.find((x) => x.key === key);
    return m ? m.label.split(" ")[0] : key;
  };
  const sortRowsByCat = (rows, labelOf) =>
    [...rows].sort((a, b) => catRank(catOf(labelOf(a))) - catRank(catOf(labelOf(b))) || String(labelOf(a)).localeCompare(String(labelOf(b)), "nl"));
  function addLocation() {
    const name = newLocName.trim();
    if (!name) return;
    const id = "loc-" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
    setStockLocations([...stockLocations, { id, name }]);
    setNewLocName("");
    setAddLocOpen(false);
  }
  function deleteLocation(id) {
    if (stock.some((s) => s.loc === id)) return; // alleen leeg te verwijderen
    setStockLocations(stockLocations.filter((l) => l.id !== id));
    if (editLoc === id) setEditLoc(null);
  }
  function toggleLoc(id) {
    setOpenLocs((o) => ({ ...o, [id]: !o[id] }));
  }
  function productsOf(locId) {
    return stock.map((s, i) => ({ ...s, i })).filter((s) => s.loc === locId);
  }
  // product uit de catalogus halen of aanmaken (autocomplete/dedup via productKey)
  function ensureProduct(name, extra) {
    const t = String(name || "").trim();
    const key = productKey(t);
    if (!key) return null;
    let prod = products.find((p) => productKey(p.name) === key);
    if (!prod) {
      prod = { id: newId("p"), name: t, cat: (extra && extra.cat) || "overig", market: (extra && extra.market) || null, unit: (extra && extra.unit) || null };
      setProducts((ps) => [...ps, prod]);
    }
    return prod;
  }
  function addProductRow(locId) {
    const prod = ensureProduct(newProdRow.name);
    if (!prod) return;
    setStock([...stock, { pid: prod.id, name: prod.name, loc: locId, cat: prod.cat, market: prod.market, want: newProdRow.want, have: newProdRow.want }]);
    setNewProdRow({ name: "", want: 1 });
    setAddProdRow(null);
    setProdRowSuggest(false);
  }
  function addExtraRowFn() {
    const prod = ensureProduct(newExtra.name);
    const amt = Number(newExtra.amount);
    if (!prod || !Number.isFinite(amt) || amt <= 0) return;
    setExtraItems([...extraItems, { pid: prod.id, name: prod.name, cat: prod.cat, amount: amt, unit: prod.unit || null }]);
    setNewExtra({ name: "", amount: 1 });
    setExtraSuggest(false);
  }
  function usageCount(pid) {
    let n = 0;
    recipes.forEach((r) => (r.ingredients || []).forEach((ing) => { if (typeof ing === "object" && ing && ing.pid === pid) n++; }));
    stock.forEach((s) => { if (s.pid === pid) n++; });
    extraItems.forEach((x) => { if (x.pid === pid) n++; });
    return n;
  }
  function openProdCard(rowKey, pid) {
    const p = prodById[pid];
    if (!p) return;
    setOpenProd(openProd === rowKey ? null : rowKey);
    setProdEdit({ id: p.id, name: p.name, cat: p.cat, market: p.market, unit: p.unit, tags: p.tags || [], tagDraft: "", packAmount: p.pack ? String(p.pack.amount).replace(".", ",") : "", packUnit: p.pack ? p.pack.unit : "" }); // #37: tags meekopieren; #35: pack meekopieren
  }
  function saveProductEdit() {
    if (!prodEdit) return;
    const name = prodEdit.name.trim();
    const tags = [...new Set((prodEdit.tags || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
    // #35: inhoud per verpakking (leeg -> geen pack)
    const pack = normalizePack({ amount: String(prodEdit.packAmount || "").replace(",", "."), unit: prodEdit.packUnit });
    setProducts((ps) => ps.map((p) => (p.id === prodEdit.id ? { ...p, name: name || p.name, cat: prodEdit.cat || "overig", market: prodEdit.market || null, unit: prodEdit.unit || null, tags, pack } : p)));
    setProdEdit(null);
  }
  // #37: product-tags — zelfde look & feel als tags bij recepten (chip + ×, veld "+ tag toevoegen…")
  const allProductTags = [...new Set(products.flatMap((p) => p.tags || []))].sort((a, b) => a.localeCompare(b, "nl"));
  function addProdTag() {
    if (!prodEdit) return;
    const t = (prodEdit.tagDraft || "").trim().toLowerCase();
    if (!t) return;
    if (!prodEdit.tags.includes(t)) setProdEdit({ ...prodEdit, tags: [...prodEdit.tags, t], tagDraft: "" });
    else setProdEdit({ ...prodEdit, tagDraft: "" });
  }
  function removeProdTag(t) {
    if (!prodEdit) return;
    setProdEdit({ ...prodEdit, tags: prodEdit.tags.filter((x) => x !== t) });
  }
  // #42: have per product (som over voorraad-entries met dit product)
  const haveOfProd = (p) =>
    stock.reduce((n, s) => (s.pid === p.id || (!s.pid && productKey(s.name) === productKey(p.name)) ? n + (Number(s.have) || 0) : n), 0);
  // #42: instant-producten = tag "instant-maaltijd" én have > 0
  const instantProducts = products
    .filter((p) => (p.tags || []).includes("instant-maaltijd") && haveOfProd(p) > 0)
    .sort((a, b) => a.name.localeCompare(b.name, "nl"));
  // #42: afwijking toepassen — dag wordt vrije tekst; alle menuByDate-entries vanaf de datum schuiven
  // 1 dag op (cascade, aflopend); vinkjes schuiven mee; over een weekgrens heen niet meer gelocked
  // tenzij er al vinkjes voor die dag stonden. Bij instant: voorraad (have) verlagen met de keuze.
  function applyDeviation(fromKey, customText, picks) {
    const parseK = (k) => new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10)));
    const keys = Object.keys(menuByDate).filter((k) => k >= fromKey).sort((a, b) => a.localeCompare(b)).reverse();
    const nextMenu = { ...menuByDate };
    const nextChecked = { ...checked };
    keys.forEach((k) => {
      const d = parseK(k);
      const nk = dateKey(addDays(d, 1));
      const hadChecked = Object.keys(checked).some((ck) => ck.startsWith(k + "-"));
      const crossesWeek = dateKey(startOfWeek(addDays(d, 1), settings.weekStartDay)) !== dateKey(startOfWeek(d, settings.weekStartDay));
      let ne = { ...menuByDate[k] };
      if (crossesWeek && !hadChecked) ne = { ...ne, locked: false };
      delete nextMenu[k];
      nextMenu[nk] = ne;
      Object.keys(checked).forEach((ck) => {
        if (ck.startsWith(k + "-")) {
          nextChecked[nk + ck.slice(k.length)] = checked[ck];
          delete nextChecked[ck];
        }
      });
    });
    const prev = menuByDate[fromKey];
    nextMenu[fromKey] = {
      ...(prev && prev.eaters != null ? { eaters: prev.eaters } : {}),
      ...(prev && prev.locked ? { locked: true } : {}),
      custom: customText,
    };
    if (picks) {
      Object.entries(picks).forEach(([pid, n]) => {
        const cnt = Math.floor(Number(n) || 0);
        if (cnt <= 0) return;
        setStock((st) => {
          let left = cnt;
          return st.map((s) => {
            if (s.pid !== pid || left <= 0) return s;
            const use = Math.min(Number(s.have) || 0, left);
            left -= use;
            return { ...s, have: (Number(s.have) || 0) - use };
          });
        });
      });
    }
    setMenuByDate(nextMenu);
    setChecked(nextChecked);
  }
  // #42: alleen http(s)-URLs openen — gesanitiseerd via URL-parse + protocol-allowlist (CodeQL)
  function safeExternalUrl(u) {
    const str = String(u || "").trim();
    if (!str) return null;
    let parsed;
    try {
      parsed = new URL(str);
    } catch (e) {
      try {
        parsed = new URL("https://" + str);
      } catch (e2) {
        return null;
      }
    }
    return parsed && (parsed.protocol === "https:" || parsed.protocol === "http:") ? parsed.href : null;
  }
  function updateTakeawayLink(i, patch) {
    updateSettings({ takeawayLinks: (settings.takeawayLinks || []).map((l, j) => (j === i ? { ...l, ...patch } : l)) });
  }
  function deleteProductCatalog(pid) {
    setProducts((ps) => ps.filter((p) => p.id !== pid));
    setRecipes((rs) => rs.map((r) => ({ ...r, ingredients: (r.ingredients || []).map((ing) => (typeof ing === "object" && ing && ing.pid === pid ? { ...ing, pid: null } : ing)) })));
    setStock((st) => st.map((s) => (s.pid === pid ? { ...s, pid: null } : s)));
    setExtraItems((xs) => xs.map((x) => (x.pid === pid ? { ...x, pid: null } : x)));
    setOpenProd(null);
    setProdEdit(null);
  }
  // ingrediënt-rij in een recept: naam met autocomplete; Enter/blur zonder match -> nieuw product in de catalogus
  function resolveIng(rid, idx, text) {
    const t = String(text || "").trim();
    const prod = t ? ensureProduct(t) : null;
    setRecipes((rs) =>
      rs.map((r) => {
        if (r.id !== rid) return r;
        const ings = [...(r.ingredients || [])];
        if (!t) { ings.splice(idx, 1); return { ...r, ingredients: ings }; }
        const cur = ings[idx] || {};
        ings[idx] = { pid: prod ? prod.id : null, amount: cur.amount != null ? cur.amount : null, unit: cur.unit || (prod && prod.unit) || null, name: prod ? prod.name : t };
        return { ...r, ingredients: ings };
      })
    );
    setIngDrafts((d) => { const o = { ...d }; delete o[rid + ":" + idx]; return o; });
    setIngSuggest(null);
  }
  function selectIngProduct(rid, idx, prod) {
    setRecipes((rs) =>
      rs.map((r) => {
        if (r.id !== rid) return r;
        const ings = [...(r.ingredients || [])];
        const cur = ings[idx] || {};
        ings[idx] = { pid: prod.id, amount: cur.amount != null ? cur.amount : null, unit: cur.unit || prod.unit || null, name: prod.name };
        return { ...r, ingredients: ings };
      })
    );
    setIngDrafts((d) => { const o = { ...d }; delete o[rid + ":" + idx]; return o; });
    setIngSuggest(null);
  }
  function setIngAmount(rid, idx, v) {
    const a = v === "" ? null : Number(String(v).replace(",", "."));
    setRecipes((rs) => rs.map((r) => {
      if (r.id !== rid) return r;
      const ings = [...(r.ingredients || [])];
      ings[idx] = { ...(ings[idx] || {}), amount: Number.isFinite(a) ? a : null };
      return { ...r, ingredients: ings };
    }));
  }
  function commitIngAmount(rid, idx) {
    setRecipes((rs) => rs.map((r) => {
      if (r.id !== rid) return r;
      const ings = [...(r.ingredients || [])];
      const cur = ings[idx];
      if (!cur || cur.amount == null) return r;
      const p = cur.pid ? prodById[cur.pid] : null;
      const unit = ingUnit(cur, p) || null;
      const n = normalizeAmountUnit(cur.amount, unit);
      ings[idx] = { ...cur, amount: n.amount, unit: n.unit };
      return { ...r, ingredients: ings };
    }));
  }
  function setIngUnit(rid, idx, newUnit) {
    setRecipes((rs) => rs.map((r) => {
      if (r.id !== rid) return r;
      const ings = [...(r.ingredients || [])];
      const cur = ings[idx];
      if (!cur) return r;
      const p = cur.pid ? prodById[cur.pid] : null;
      const oldUnit = ingUnit(cur, p) || null;
      let amount = cur.amount;
      if (amount != null && oldUnit && newUnit && UNIT_FACTOR[oldUnit] && UNIT_FACTOR[newUnit]) {
        const c = convertAmount(amount, oldUnit, newUnit);
        if (c != null) amount = roundAmt(c);
      }
      ings[idx] = { ...cur, amount, unit: newUnit || null };
      return { ...r, ingredients: ings };
    }));
  }
  // "Nieuw recept" (ADR-018): ingrediënt-rijen net als bij bewerken — operate op newRecipe ipv recipes
  function setNewIngAmount(idx, v) {
    const a = v === "" ? null : Number(String(v).replace(",", "."));
    setNewRecipe((nr) => ({ ...nr, ingredients: (nr.ingredients || []).map((x, i) => (i === idx ? { ...(x || {}), amount: Number.isFinite(a) ? a : null } : x)) }));
  }
  function commitNewIngAmount(idx) {
    setNewRecipe((nr) => ({
      ...nr,
      ingredients: (nr.ingredients || []).map((x, i) => {
        if (i !== idx || !x || x.amount == null) return x;
        const p = x.pid ? prodById[x.pid] : null;
        const n = normalizeAmountUnit(x.amount, ingUnit(x, p) || null);
        return { ...x, amount: n.amount, unit: n.unit };
      }),
    }));
  }
  function setNewIngUnit(idx, newUnit) {
    setNewRecipe((nr) => ({
      ...nr,
      ingredients: (nr.ingredients || []).map((x, i) => {
        if (i !== idx || !x) return x;
        const p = x.pid ? prodById[x.pid] : null;
        const oldUnit = ingUnit(x, p) || null;
        let amount = x.amount;
        if (amount != null && oldUnit && newUnit && UNIT_FACTOR[oldUnit] && UNIT_FACTOR[newUnit]) {
          const c = convertAmount(amount, oldUnit, newUnit);
          if (c != null) amount = roundAmt(c);
        }
        return { ...x, amount, unit: newUnit || null };
      }),
    }));
  }
  function resolveNewIng(idx, text) {
    const t = String(text || "").trim();
    const prod = t ? ensureProduct(t) : null;
    setNewRecipe((nr) => {
      const ings = [...(nr.ingredients || [])];
      if (!t) { ings.splice(idx, 1); return { ...nr, ingredients: ings }; }
      const cur = ings[idx] || {};
      ings[idx] = { pid: prod ? prod.id : null, amount: cur.amount != null ? cur.amount : null, unit: cur.unit || (prod && prod.unit) || null, name: prod ? prod.name : t };
      return { ...nr, ingredients: ings };
    });
    setIngDrafts((d) => { const o = { ...d }; delete o["new:" + idx]; return o; });
    setIngSuggest(null);
  }
  function selectNewIngProduct(idx, prod) {
    setNewRecipe((nr) => {
      const ings = [...(nr.ingredients || [])];
      const cur = ings[idx] || {};
      ings[idx] = { pid: prod.id, amount: cur.amount != null ? cur.amount : null, unit: cur.unit || prod.unit || null, name: prod.name };
      return { ...nr, ingredients: ings };
    });
    setIngDrafts((d) => { const o = { ...d }; delete o["new:" + idx]; return o; });
    setIngSuggest(null);
  }
  function deleteProduct(i) {
    setStock(stock.filter((_, j) => j !== i));
  }
  function bumpHave(i, d) {
    setStock(stock.map((x, j) => (j === i ? { ...x, have: Math.max(0, x.have + d) } : x)));
  }
  function bumpWant(i, d) {
    setStock(stock.map((x, j) => (j === i ? { ...x, want: Math.max(0, x.want + d) } : x)));
  }
  function addCat() {
    const c = newCat.trim();
    if (!c) return;
    if (!settings.shopCats.includes(c)) updateSettings({ shopCats: [...settings.shopCats, c] });
    setNewCat("");
  }
  function removeCat(c) {
    if (stock.some((s) => s.cat === c) || extraItems.some((x) => x.cat === c)) return; // in gebruik
    updateSettings({ shopCats: settings.shopCats.filter((x) => x !== c) });
  }
  function moveCat(i, dir) {
    const arr = [...settings.shopCats];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    const t = arr[i];
    arr[i] = arr[j];
    arr[j] = t;
    updateSettings({ shopCats: arr });
  }

  const byId = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);

  // #37: tag-regels — een recept is geblokkeerd voor dayKey als een al geplande dag binnen `days`
  // dagen een gerecht met dezelfde product-tag of gerecht-tag heeft (planned = [{ key, id }]).
  function blockedByRules(r, dayKey, planned) {
    const rules = settings.tagRules || [];
    const dayDiff = (k) => Math.abs(Math.round((new Date(dayKey + "T00:00:00").getTime() - new Date(k + "T00:00:00").getTime()) / 86400000));
    const tagsOf = (rec) => {
      const s = new Set();
      (rec.ingredients || []).forEach((ing) => {
        const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
        ((p && p.tags) || []).forEach((t) => s.add(t));
      });
      return s;
    };
    for (const rule of rules) {
      if (!rule.tag) continue;
      const lim = Math.min(30, Math.max(0, Number(rule.days) || 0)); // 0 = altijd geblokkeerd
      for (const pe of planned) {
        if (lim > 0 && dayDiff(pe.key) > lim) continue;
        const pr = byId[pe.id];
        if (!pr) continue;
        if (rule.kind === "recipe") {
          if ((r.tags || []).includes(rule.tag) && (pr.tags || []).includes(rule.tag)) return true;
        } else if (tagsOf(r).has(rule.tag) && tagsOf(pr).has(rule.tag)) {
          return true;
        }
      }
    }
    return false;
  }

  function generateMenu() {
    const next = Array(7).fill(null);
    // geplande dagen (incl. gelockte, per datum over weekgrenzen heen) + al gekozen dagen deze run
    const planned = Object.entries(menuByDate || {})
      .filter(([, e]) => e && e.id)
      .map(([key, e]) => ({ key, id: e.id }));
    const repeatDays = Math.min(30, Math.max(0, Number(settings.dishRepeatDays) || 0)); // #38: herhaalregel per gerecht
    const dayDiff = (a, b) => Math.abs(Math.round((new Date(a + "T00:00:00").getTime() - new Date(b + "T00:00:00").getTime()) / 86400000));
    // ids die deze week al vastliggen: gelockte dagen van de getoonde week + keuzes in deze run
    const weekPickIds = new Set(
      planned.filter((pe) => weekKeys.includes(pe.key) && menuByDate[pe.key] && menuByDate[pe.key].locked).map((pe) => pe.id)
    );
    const pickFrom = (cats, dayKey) => {
      const avail = (list) =>
        shuffle(
          recipes.filter(
            (r) =>
              list.includes(r.cat) &&
              (r.ingredients || []).filter(Boolean).length > 0 &&
              !weekPickIds.has(r.id) && // niet dubbel in de week (incl. gelockte dagen)
              !(repeatDays > 0 && planned.some((pe) => pe.id === r.id && dayDiff(pe.key, dayKey) < repeatDays)) && // #38: niet binnen N dagen opnieuw
              !blockedByRules(r, dayKey, planned) // #37: tag-regels
          )
        );
      let pool = avail([cats[0]]); // voorkeurcategorie eerst, daarna fallback
      if (!pool.length && cats.length > 1) pool = avail(cats.slice(1));
      if (!pool.length) return null;
      const r = pool[0];
      planned.push({ key: dayKey, id: r.id });
      weekPickIds.add(r.id);
      return r.id;
    };

    // Vis-dagen uit de instellingen
    fishDays.forEach((d) => {
      const id = pickFrom(["vis"], weekKeys[d]);
      if (id) next[d] = { id, locked: false };
    });

    // Overige dagen: vega/vlees volgens vegaTarget (vlees = overige dagen minus vega, >= 0)
    otherDays.forEach((d, i) => {
      const wantVega = i < vegaCount;
      const id = pickFrom(wantVega ? ["vega", "vlees"] : ["vlees", "vega"], weekKeys[d]);
      if (id) next[d] = { id, locked: false };
    });

    setMenuByDate((m) => {
      const out = { ...m };
      weekKeys.forEach((key, i) => {
        if (m[key] && m[key].locked) return; // vergrendelde dag van de getoonde week blijft staan
        if (next[i]) out[key] = { id: next[i].id, locked: false };
        else delete out[key];
      });
      return out;
    });
    setChecked((c) => {
      const out = {};
      Object.entries(c).forEach(([k, v]) => {
        if (!weekKeys.some((wk) => k.startsWith(wk + "-"))) out[k] = v; // vinkjes van de getoonde week wissen
      });
      return out;
    });
    setDrafts({});
    setOpenSuggest(null);
  }

  function setDay(day, entry) {
    const key = weekKeys[day];
    setMenuByDate((m) => {
      const out = { ...m };
      if (entry) out[key] = entry;
      else delete out[key];
      return out;
    });
  }

  function goTab(t) {
    setTab(t);
    setDateSheetOpen(false);
    setRulesSheetOpen(false);
  }

  // gerechtveld: suggestie kiezen (behoudt vergrendeling/eaters)
  function selectRecipe(day, id) {
    const entry = weekEntries[day];
    const patch = { id, locked: !!(entry && entry.locked) };
    if (entry && entry.eaters != null) patch.eaters = entry.eaters;
    setDay(day, patch);
    setDrafts((d) => { const o = { ...d }; delete o[weekKeys[day]]; return o; });
    setOpenSuggest(null);
  }

  // gerechtveld committen (blur/Enter): leeg = wissen; exacte match = recept; anders vrije tekst
  function commitDay(day) {
    const key = weekKeys[day];
    const entry = weekEntries[day];
    const cur =
      drafts[key] !== undefined
        ? drafts[key]
        : entry && entry.custom
          ? entry.custom
          : entry && entry.id && byId[entry.id]
            ? byId[entry.id].name
            : "";
    const text = String(cur).trim();
    if (!text) {
      setDay(day, null);
    } else {
      const exact = recipes.find((x) => x.cat !== "extra" && x.name.toLowerCase() === text.toLowerCase());
      if (exact) {
        selectRecipe(day, exact.id);
        return;
      }
      setDay(day, { custom: text, locked: !!(entry && entry.locked) });
    }
    setDrafts((d) => { const o = { ...d }; delete o[key]; return o; });
    setOpenSuggest(null);
  }

  // afwijkend aantal eters per dag (absoluut; null = standaard uit instellingen)
  function setEaters(day, n) {
    const key = weekKeys[day];
    const entry = weekEntries[day];
    if (!entry || entry.custom || !entry.id) return;
    setMenuByDate((m) => {
      const out = { ...m };
      if (n == null || n === settings.householdSize) out[key] = { id: entry.id, locked: !!entry.locked };
      else out[key] = { ...entry, eaters: n };
      return out;
    });
  }

  function updateRecipe(id, patch) {
    setRecipes((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function addRecipe() {
    const name = newRecipe.name.trim();
    if (!name) return;
    const id = "r" + Date.now().toString(36) + Math.floor(Math.random() * 1e4);
    setRecipes((rs) => [
      ...rs,
      normalizeRecipe({
        id,
        name,
        cat: newRecipe.cat,
        timeCat: newRecipe.timeCat || "normaal",
        tags: newRecipe.tags || [],
        ingredients: (newRecipe.ingredients || [])
          .filter((x) => x && (x.name || x.pid))
          .map((x) => ({ pid: x.pid || null, amount: x.amount != null ? x.amount : null, unit: x.unit || null, name: x.name || "" })),
        bereiding: newRecipe.bereiding.trim(),
      }),
    ]);
    setNewRecipe({ name: "", cat: "vega", timeCat: "normaal", tags: [], tagDraft: "", ingredients: [], bereiding: "" });
    setAddSheetOpen(false);
  }

  function addNewTag() {
    const t = (newRecipe.tagDraft || "").trim().toLowerCase();
    if (!t) return;
    if (!newRecipe.tags.includes(t)) setNewRecipe({ ...newRecipe, tags: [...newRecipe.tags, t], tagDraft: "" });
    else setNewRecipe({ ...newRecipe, tagDraft: "" });
  }

  function addRecipeTag(id) {
    const t = tagDraft.trim().toLowerCase();
    if (!t) return;
    setRecipes((rs) =>
      rs.map((r) => (r.id === id && !(r.tags || []).includes(t) ? { ...r, tags: [...(r.tags || []), t] } : r))
    );
    setTagDraft("");
  }

  function removeRecipeTag(id, t) {
    setRecipes((rs) => rs.map((r) => (r.id === id ? { ...r, tags: (r.tags || []).filter((x) => x !== t) } : r)));
  }

  function deleteRecipe(id) {
    setRecipes((rs) => rs.filter((r) => r.id !== id));
    setMenuByDate((m) => {
      const out = {};
      Object.entries(m).forEach(([k, v]) => {
        if (v.id !== id) out[k] = v;
      });
      return out;
    });
    setOpenRecipe(null);
    setEditRecipe(null);
  }

  // ---- Delen via bestand (ADR-019): exporteren, inlezen, samenvoegen ----
  function buildShareName() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `weekmenu-delen-v1-${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${pad(d.getHours())}u${pad(d.getMinutes())}.json`;
  }
  function exportShare() {
    const c = deelChips;
    const data = {
      ...(c.recipes ? { recipes } : {}),
      ...(c.products ? { products } : {}),
      ...(c.stock ? { stock, stockLocations } : {}),
      ...(c.menu ? { menuByDate, extraItems } : {}),
      ...(c.settings ? { settings, checked, checkedAt, deleted } : {}),
    };
    const payload = { bundle: SHARE_BUNDLE, v: 1, exportedAt: Date.now(), chips: c, data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = buildShareName();
    a.click();
    URL.revokeObjectURL(url);
    setDelenOpen(null);
    setShareToast("✅ Deelbestand gemaakt. Deel het bestand zelf, bv. via WhatsApp of e-mail (tik om te sluiten).");
  }
  function importShareFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        reviewImport(JSON.parse(String(reader.result)), file && file.name);
      } catch (e) {
        setShareToast("⚠️ Dit bestand kon niet worden gelezen.");
      }
    };
    if (typeof reader.readAsText === "function") reader.readAsText(file);
    else setShareToast("⚠️ Levering via de app: kies het .json-deelbestand.");
  }
  // Bundel-data normaliseren naar app-vorm (zelfde paden als bij het laden), updatedAt bewaren.
  function prepareImport(parsed) {
    const b = parsed && parsed.data && typeof parsed.data === "object" ? parsed.data : {};
    const norm = {};
    if (Array.isArray(b.products)) norm.products = normalizeProducts(b.products);
    if (Array.isArray(b.recipes)) {
      const catalog = norm.products || products;
      norm.recipes = migrateRecipesIngredients(
        b.recipes.filter((r) => r && r.id && r.name).map((r) => normalizeRecipe({ ...r })),
        catalog
      );
    }
    const bLocs = Array.isArray(b.stockLocations) ? normalizeLocations(b.stockLocations) : null;
    if (Array.isArray(b.stock)) {
      const locs = bLocs || stockLocations;
      norm.stock = normalizeStock(b.stock, locs.length ? locs : undefined);
    }
    if (Array.isArray(b.stockLocations)) norm.stockLocations = bLocs.length ? bLocs : normalizeLocations(null);
    if (Array.isArray(b.extraItems)) {
      norm.extraItems = normalizeExtras(b.extraItems).map((x) => ({
        ...x,
        pid: pidOfName(norm.products || products, x.name),
        amount: x.amount != null ? x.amount : 1,
        unit: x.unit || null,
      }));
    }
    if (b.menuByDate && typeof b.menuByDate === "object" && !Array.isArray(b.menuByDate)) norm.menuByDate = b.menuByDate;
    if (b.settings && typeof b.settings === "object") norm.settings = normalizeSettings(b.settings);
    if (b.checked && typeof b.checked === "object") norm.checked = b.checked;
    if (typeof b.checkedAt === "number") norm.checkedAt = b.checkedAt;
    if (b.deleted && typeof b.deleted === "object") norm.deleted = b.deleted;
    return norm;
  }
  function reviewImport(parsed, fileName) {
    if (!parsed || parsed.bundle !== SHARE_BUNDLE) {
      setShareToast("⚠️ Dit is geen deelbestand van de weekmenu-app.");
      return;
    }
    const merge = mergeShareBundle(
      { recipes, products, stock, stockLocations, extraItems, menuByDate, checked, checkedAt, settings, deleted },
      { chips: parsed.chips || {}, data: prepareImport(parsed) }
    );
    setImportReview({ merge, fileName: fileName || "weekmenu-delen.json" });
    setDelenOpen(null);
  }
  function deelRapportLines(merge) {
    const c = (merge && merge.rapport && merge.rapport.counts) || {};
    const LBL = [
      ["recipes", "Recepten"], ["products", "Producten"], ["stock", "Voorraad"], ["stockLocations", "Locaties"],
      ["extraItems", "Extra's"], ["menuByDate", "Weekmenu"], ["settings", "Instellingen"],
    ];
    const lines = [];
    LBL.forEach(([k, lbl]) => {
      const x = c[k];
      if (!x) return;
      const parts = [];
      if (x.added) parts.push(`${x.added} nieuw`);
      if (x.updated) parts.push(`${x.updated} nieuwer uit bestand`);
      if (x.removed) parts.push(`${x.removed} verwijderd`);
      if (x.kept) parts.push(`${x.kept} blijft`);
      if (!lines.length || parts.length > 1 || x.added || x.updated || x.removed) lines.push({ lbl, parts, active: !!(x.added || x.updated || x.removed) });
      else lines.push({ lbl, parts, active: false });
    });
    return lines;
  }
  function applyImportReview() {
    if (!importReview) return;
    const n = importReview.merge.next;
    const catalog = normalizeProducts(n.products);
    const withPid = (arr) => (arr || []).map((x) => ({ ...x, pid: x.pid || pidOfName(catalog, x.name) }));
    // Raw-setters: tijdstempels uit het deelbestand 1-op-1 overnemen (geen nieuwe stempels).
    setRecipesRaw(n.recipes || []);
    setProductsRaw(n.products || []);
    setStockRaw(withPid(n.stock));
    setStockLocationsRaw(n.stockLocations || stockLocations);
    setExtraItemsRaw(withPid(n.extraItems));
    setMenuByDateRaw(n.menuByDate || {});
    setCheckedRaw(n.checked || {});
    setCheckedAtRaw(n.checkedAt || 0);
    setSettingsRaw(n.settings);
    setDeletedRaw(n.deleted || {});
    const actives = deelRapportLines(importReview.merge).filter((l) => l.active);
    setImportReview(null);
    setShareToast("✅ Samengevoegd" + (actives.length ? ": " + actives.map((l) => `${l.lbl.toLowerCase()} ${l.parts[0]}`).join(" · ") : " — niets nieuws in het bestand") + " (tik om te sluiten).");
  }

  function exportRecipes() {
    const blob = new Blob([JSON.stringify(recipes, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "recepten.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  function importRecipes(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const arr = JSON.parse(String(reader.result));
        if (Array.isArray(arr) && arr.length > 0 && arr.every((r) => r && r.id && r.name)) {
          setRecipes(migrateRecipesIngredients(arr.map((r) => normalizeRecipe({ ingredients: [], bereiding: "", ...r })), products));
        }
      } catch (e) {}
    };
    reader.readAsText(file);
  }

  function resetRecipes() {
    if (window.confirm("Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?")) {
      setRecipes(migrateRecipesIngredients(BASE_RECIPES.map((r) => normalizeRecipe({ ...r })), products));
    }
  }

  // Boodschappenlijst van vandaag (ADR-016): scope = vandaag t/m vandaag+(n-1) dagen, begrensd door
  // het aantal aaneengesloten gelockte dagen vanaf vandaag (max 7). n en de supermarktkeuze zijn vluchtig.
  const scopeKeys = useMemo(() => Array.from({ length: 7 }, (_, i) => dateKey(addDays(new Date(), i))), []);
  const maxShopDays = useMemo(() => {
    let n = 0;
    for (const k of scopeKeys) {
      const e = menuByDate[k];
      if (e && e.locked && e.id) n++;
      else break;
    }
    return n;
  }, [menuByDate, scopeKeys]);
  const shopDaysEff = Math.min(Math.max(shopDays == null ? Math.min(4, maxShopDays) : shopDays, 0), maxShopDays);
  const shopMarketsEff = shopMarkets || markets.filter((m) => m.defaultShop !== false).map((m) => m.key);
  const rowVisible = (r) => !r.mkt || shopMarketsEff.includes(r.mkt);
  const shoppingRows = useMemo(() => {
    const rows = [];
    scopeKeys.slice(0, shopDaysEff).forEach((k) => {
      const entry = menuByDate[k];
      if (!entry || !entry.id) return;
      const r = byId[entry.id];
      if (!r) return;
      (r.ingredients || []).filter(Boolean).forEach((ing, idx) => {
        const label = ingLabel(ing, prodById);
        const p = (typeof ing === "object" && ing && ing.pid && prodById[ing.pid]) || prodByKey.get(productKey(label)) || null;
        rows.push({
          key: `${k}-${r.id}-${idx}`,
          dayKey: k,
          label,
          pid: p ? p.id : null,
          ing,
          recipe: r.name,
          mkt: (p && p.market) || marketOf(label) || null,
          cat: (p && p.cat) || catOf(label) || null,
        });
      });
    });
    return rows;
  }, [menuByDate, byId, scopeKeys, shopDaysEff, prodById, prodByKey, catOf, marketOf]);

  const activeMenuIds = weekEntries.filter(Boolean).map((d) => d.id);
  // recepten-tab: sorteren op "laatst gegeten" (ADR-018) — alleen vergrendelde dagen t/m vandaag tellen; nooit = Onbekend = bovenaan
  const lastEaten = {};
  Object.entries(menuByDate).forEach(([k, e]) => {
    if (e && e.id && e.locked && k <= todayKey && (!lastEaten[e.id] || k > lastEaten[e.id])) lastEaten[e.id] = k;
  });
  const sortLast = recipeSort === "laatst";
  const byLastEaten = (a, b) => {
    const la = lastEaten[a.id] || null;
    const lb = lastEaten[b.id] || null;
    if (la === null && lb === null) return a.name.localeCompare(b.name, "nl");
    if (la === null) return -1;
    if (lb === null) return 1;
    return la.localeCompare(lb) || a.name.localeCompare(b.name, "nl");
  };
  // recepten-tab: zoeken/filteren (ADR-013) — alle filters combineren met AND
  const rq = recipeQuery.trim().toLowerCase();
  const ingQ = ingFilter.trim().toLowerCase();
  const hasRecipeFilters = !!rq || timeFilter !== "alle" || !!ingQ || tagFilters.length > 0;
  const showFlatList = hasRecipeFilters || sortLast; // sorteren op "laatst" -> altijd platte lijst (ADR-018)
  const filteredRecipes = recipes.filter((r) => {
    if (rq && !r.name.toLowerCase().includes(rq)) return false;
    if (timeFilter !== "alle" && (r.timeCat || "normaal") !== timeFilter) return false;
    if (ingQ && !(r.ingredients || []).some((x) => String(typeof x === "string" ? x : x && x.name ? x.name : "").toLowerCase().includes(ingQ))) return false;
    if (tagFilters.length && !tagFilters.every((t) => (r.tags || []).includes(t))) return false;
    return true;
  });
  const tagCounts = {};
  recipes.forEach((r) => (r.tags || []).forEach((t) => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
  const allTags = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a] || a.localeCompare(b, "nl"));
  const topTags = allTags.slice(0, 5); // maximaal 5 tags direct zichtbaar in de filterrij
  const toggleTagFilter = (t) => setTagFilters((fs) => (fs.includes(t) ? fs.filter((x) => x !== t) : [...fs, t]));
  const clearRecipeFilters = () => { setRecipeQuery(""); setTimeFilter("alle"); setIngFilter(""); setTagFilters([]); };
  // Weekmenu-koppeling vanuit de receptenlijst (ADR-013, ronde 2): kies een onvergrendelde dag van DEZE week (offset 0).
  const curWeekKeys = weekDateKeys(settings.weekStartDay, 0);
  const curWeekStart = weekStartFor(settings.weekStartDay, 0);
  const curWeekEnd = addDays(curWeekStart, 6);
  const curWeekLabel = `${fmtShort(curWeekStart)} \u2013 ${fmtShort(curWeekEnd)} ${curWeekEnd.getFullYear()}`;
  function addRecipeToWeek(recipe, key) {
    const prev = menuByDate[key];
    if (prev && prev.locked) return; // vergrendelde dag nooit overschrijven
    setMenuByDate((m) => ({ ...m, [key]: { ...(prev && prev.eaters != null ? { eaters: prev.eaters } : {}), id: recipe.id } }));
    const i = curWeekKeys.indexOf(key);
    setWeekToast(`\u2705 ${recipe.name} toegevoegd aan ${days[i]} ${fmtDay(key)}`);
    setDaySheetRecipe(null);
    if (typeof setTimeout === "function") setTimeout(() => setWeekToast(""), 3500);
  }

  // Rij in de receptenlijst (ADR-013): naam + badges + meta (categorie, tijd, tags); klik opent bewerkte form.
  // product-kaart (ADR-017): inline uitgeklapt onder de rij waarop geklikt is (scherm 2B/8)
  const renderProductCard = (rowKey) => {
    if (openProd !== rowKey || !prodEdit) return null;
    const p = products.find((x) => x.id === prodEdit.id);
    if (!p) return null;
    return (
      /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 bg-stone-50 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Naam"), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": prodEdit.name, "onChange": (e) => setProdEdit({ ...prodEdit, name: e.target.value }) })), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Categorie"), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.cat, "onChange": (e) => setProdEdit({ ...prodEdit, cat: e.target.value }) }, shopCats.map((c) => (/*#__PURE__*/React.createElement("option", { "key": c, "value": c }, c))), prodEdit.cat !== "overig" && !shopCats.includes(prodEdit.cat) && /*#__PURE__*/React.createElement("option", { "value": prodEdit.cat }, prodEdit.cat), /*#__PURE__*/React.createElement("option", { "value": "overig" }, "overig")))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mt-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Eenheid (standaard bij dit product)"), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.unit || "", "onChange": (e) => setProdEdit({ ...prodEdit, unit: e.target.value || null }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "–"), UNITS.map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))), /*#__PURE__*/React.createElement("div", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Voorkeurssupermarkt"), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, /*#__PURE__*/React.createElement("button", { "className": `chip${!prodEdit.market ? " on" : ""}`, "onClick": () => setProdEdit({ ...prodEdit, market: null }) }, "geen"), markets.map((m) => (
                /*#__PURE__*/React.createElement("button", { "key": m.key, "className": `chip${prodEdit.market === m.key ? " on" : ""}`, "onClick": () => setProdEdit({ ...prodEdit, market: m.key }) }, marketChip(m.key))
              ))))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mt-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Inhoud per verpakking"), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "type": "number", "min": "0", "step": "any", "placeholder": "bijv. 500", "value": prodEdit.packAmount || "", "onChange": (e) => setProdEdit({ ...prodEdit, packAmount: e.target.value }) })), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Eenheid van de inhoud"), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.packUnit || "", "onChange": (e) => setProdEdit({ ...prodEdit, packUnit: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "–"), UNITS.map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u)))))), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 mt-0.5" }, "#35: per 1 ", prodEdit.unit || "verpakking", " = ", prodEdit.packAmount || "…", " ", prodEdit.packUnit || "…", " — boodschappenlijst toont alleen hele verpakkingen"), /*#__PURE__*/React.createElement("div", { "className": "mt-2 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Tags"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, (prodEdit.tags || []).map((t) => (
              /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => removeProdTag(t) }, "\\u00d7"))
            ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": prodEdit.tagDraft || "", "placeholder": "\\uff0b tag toevoegen\\u2026", "list": "product-tags-list", "onChange": (e) => setProdEdit({ ...prodEdit, tagDraft: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addProdTag(); } } }), /*#__PURE__*/React.createElement("datalist", { "id": "product-tags-list" }, allProductTags.map((t) => (/*#__PURE__*/React.createElement("option", { "key": t, "value": t })))), /*#__PURE__*/React.createElement("button", { "onClick": addProdTag }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 mt-2" }, usageCount(p.id), "× gebruikt (recepten, voorraad, extra)"), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-2" }, /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg", "onClick": saveProductEdit }, "Opslaan"), /*#__PURE__*/React.createElement("button", { "className": "text-xs text-red-500 px-2", "title": "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)", "onClick": () => deleteProductCatalog(p.id) }, "Verwijderen")))
    );
  };

  // ingrediënt-rij in een recept (ADR-017, scherm 1A/9): [aantal] [eenheid] [naam + autocomplete] [✕].
  // De eenheid komt uit het product; alleen bij g/kg/ml/cl/l wijzigbaar (select met de converteerbare eenheden);
  // bij geen eenheid staat er niets tussen aantal en naam.
  const renderIngRow = (rid, ing, idx) => {
    const key = rid + ":" + idx;
    const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
    const draft = ingDrafts[key];
    const nameVal = draft !== undefined ? draft : p ? p.name : (typeof ing === "object" && ing ? ing.name || "" : String(ing || ""));
    const q = nameVal.trim().toLowerCase();
    const sugg = ingSuggest === key && q.length >= 2 ? matchProducts(products, q) : [];
    const unit = typeof ing === "object" && ing ? ingUnit(ing, p) || null : null;
    const amountVal = typeof ing === "object" && ing && ing.amount != null ? String(ing.amount).replace(".", ",") : "";
    return (
      /*#__PURE__*/React.createElement("div", { "key": idx, "className": "ingrow" }, /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.4rem" }, "value": amountVal, "placeholder": "#", "title": "Aantal", "onChange": (e) => setIngAmount(rid, idx, e.target.value), "onBlur": () => commitIngAmount(rid, idx) }), unit ? (
          UNIT_GROUP[unit] ? (
            /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0", "style": { width: "4.4rem" }, "value": unit, "title": "Eenheid (alleen converteerbare eenheden wijzigbaar)", "onChange": (e) => setIngUnit(rid, idx, e.target.value) }, UNIT_GROUP[unit].map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))
          ) : (
            /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0", "title": "Eenheid van het product" }, unit)
          )
        ) : null, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "name", "value": nameVal, "placeholder": "Productnaam…", "onChange": (e) => {
              setIngDrafts((d) => ({ ...d, [key]: e.target.value }));
              setIngSuggest(e.target.value.trim().length >= 2 ? key : null);
              setActiveIngSuggest(0);
            }, "onBlur": () => resolveIng(rid, idx, nameVal), "onKeyDown": (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (sugg.length && sugg[activeIngSuggest]) selectIngProduct(rid, idx, sugg[activeIngSuggest]);
                else resolveIng(rid, idx, nameVal);
              } else if (e.key === "Escape") setIngSuggest(null);
              else if (e.key === "ArrowDown" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.min(s2 + 1, sugg.length - 1)); }
              else if (e.key === "ArrowUp" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.max(s2 - 1, 0)); }
            } }), sugg.length > 0 && (
            /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, sugg.map((s2, si) => (
                /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": `suggest-item${si === activeIngSuggest ? " active" : ""}`, "onMouseDown": (e) => { e.preventDefault(); selectIngProduct(rid, idx, s2); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, q)), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat, s2.unit ? ` · ${s2.unit}` : ""))
              )))
          )), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Ingrediënt verwijderen", "onClick": () => setRecipes((rs) => rs.map((r) => (r.id !== rid ? r : { ...r, ingredients: (r.ingredients || []).filter((_, j) => j !== idx) }))) }, "✕"))
    );
  };

  // ingrediënt-rij in het "Nieuw recept"-sheet (ADR-018): zelfde inline rij + autocomplete als bij bewerken, maar op newRecipe
  const renderNewIngRow = (ing, idx) => {
    const key = "new:" + idx;
    const p = ing && ing.pid ? prodById[ing.pid] : null;
    const draft = ingDrafts[key];
    const nameVal = draft !== undefined ? draft : p ? p.name : (ing && ing.name) || "";
    const q = nameVal.trim().toLowerCase();
    const sugg = ingSuggest === key && q.length >= 2 ? matchProducts(products, q) : [];
    const unit = ingUnit(ing, p) || null;
    const amountVal = ing && ing.amount != null ? String(ing.amount).replace(".", ",") : "";
    return (
      /*#__PURE__*/React.createElement("div", { "key": idx, "className": "ingrow" }, /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.4rem" }, "value": amountVal, "placeholder": "#", "title": "Aantal", "onChange": (e) => setNewIngAmount(idx, e.target.value), "onBlur": () => commitNewIngAmount(idx) }), unit ? (
          UNIT_GROUP[unit] ? (
            /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0", "style": { width: "4.4rem" }, "value": unit, "title": "Eenheid (alleen converteerbare eenheden wijzigbaar)", "onChange": (e) => setNewIngUnit(idx, e.target.value) }, UNIT_GROUP[unit].map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))
          ) : (
            /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0", "title": "Eenheid van het product" }, unit)
          )
        ) : null, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "name", "value": nameVal, "placeholder": "Productnaam…", "onChange": (e) => {
              setIngDrafts((d) => ({ ...d, [key]: e.target.value }));
              setIngSuggest(e.target.value.trim().length >= 2 ? key : null);
              setActiveIngSuggest(0);
            }, "onBlur": () => resolveNewIng(idx, nameVal), "onKeyDown": (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (sugg.length && sugg[activeIngSuggest]) selectNewIngProduct(idx, sugg[activeIngSuggest]);
                else resolveNewIng(idx, nameVal);
              } else if (e.key === "Escape") setIngSuggest(null);
              else if (e.key === "ArrowDown" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.min(s2 + 1, sugg.length - 1)); }
              else if (e.key === "ArrowUp" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.max(s2 - 1, 0)); }
            } }), sugg.length > 0 && (
            /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, sugg.map((s2, si) => (
                /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": `suggest-item${si === activeIngSuggest ? " active" : ""}`, "onMouseDown": (e) => { e.preventDefault(); selectNewIngProduct(idx, s2); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, q)), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat, s2.unit ? ` · ${s2.unit}` : ""))
              )))
          )), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Ingrediënt verwijderen", "onClick": () => setNewRecipe((nr) => ({ ...nr, ingredients: (nr.ingredients || []).filter((_, j) => j !== idx) })) }, "✕"))
    );
  };

  const renderRecipeRow = (r) => {
    const inMenu = activeMenuIds.includes(r.id);
    const isOpen = openRecipe === r.id; // readonly-detail open (ADR-018)
    const isEdit = editRecipe === r.id; // bewerkmodus via ✏️ (ADR-018)
    const lastKey = lastEaten[r.id] || null;
    return (
      /*#__PURE__*/React.createElement("div", { "key": r.id, "className": "bg-white rounded-xl shadow-sm overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "onClick": () => { setOpenRecipe(isOpen ? null : r.id); if (!isOpen) setEditRecipe(null); setTagDraft(""); }, "className": "flex-1 text-left min-w-0" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2" }, /*#__PURE__*/React.createElement("span", { "className": "font-medium text-sm" }, r.name, inMenu && /*#__PURE__*/React.createElement("span", { "className": "ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full" }, "deze week"), (r.ingredients || []).filter(Boolean).length === 0 && (
                  /*#__PURE__*/React.createElement("span", { "className": "ml-1.5 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full" }, "geen ingredienten bekend")
                )), /*#__PURE__*/React.createElement("span", { "className": "text-stone-400 text-xs shrink-0" }, isOpen || isEdit ? "▴" : "▾")), /*#__PURE__*/React.createElement("div", { "className": "metarow" }, /*#__PURE__*/React.createElement("span", { "className": `text-[10px] px-1.5 rounded ${CAT_STYLE[r.cat]}` }, CAT_LABEL[r.cat]), /*#__PURE__*/React.createElement("span", { "className": `tb tb-${r.timeCat || "normaal"}` }, TIME_LABEL[r.timeCat || "normaal"]), (r.tags || []).map((t) => (
                /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t)
              )), sortLast && (
                /*#__PURE__*/React.createElement("span", { "className": `last${lastKey ? "" : " unknown"}`, "title": lastKey ? `Laatst gegeten: ${lastKey}` : "Nog nooit vergrendeld gegeten" }, `🕒 ${agoLabel(lastKey, todayKey)}`)
              ))), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Recept bewerken", "onClick": () => { setEditRecipe(isEdit ? null : r.id); setOpenRecipe(null); setTagDraft(""); } }, "✏️"), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Toevoegen aan een onvergrendelde dag van deze week", "onClick": () => setDaySheetRecipe(r) }, "📅")), isOpen && !isEdit && (
          /*#__PURE__*/React.createElement("div", { "className": "px-3 pb-3 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1 mt-2" }, "Ingrediënten"), (r.ingredients || []).filter(Boolean).length > 0 ? (
              /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mb-2" }, (r.ingredients || []).filter(Boolean).map((ing, ii) => {
                  const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                  return (
                    /*#__PURE__*/React.createElement("button", { "key": ii, "type": "button", "className": "prodchip", "onClick": () => p && openProdCard("rec-" + r.id, p.id) }, ingLabel(ing, prodById))
                  );
                }))
            ) : (
              /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mb-2" }, "geen ingrediënten bekend")
            ), renderProductCard("rec-" + r.id), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, "Bereiding"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, r.bereiding || "—"))
        ), isEdit && (
          /*#__PURE__*/React.createElement("div", { "className": "px-3 pb-3 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Naam"), /*#__PURE__*/React.createElement("input", { "value": r.name, "onChange": (e) => updateRecipe(r.id, { name: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5" })), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Categorie"), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, ["vega", "vis", "vlees", "extra"].map((c) => (
                  /*#__PURE__*/React.createElement("button", { "key": c, "className": `chip${r.cat === c ? " on" : ""}`, "onClick": () => updateRecipe(r.id, { cat: c }) }, CAT_LABEL[c])
                )))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereidingstijd"), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, TIME_CATS.map((t) => (
                  /*#__PURE__*/React.createElement("button", { "key": t, "className": (r.timeCat || "normaal") === t ? "on" : "", "onClick": () => updateRecipe(r.id, { timeCat: t }) }, timeLabelCap(t))
                )))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Tags"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, (r.tags || []).map((t) => (
                  /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => removeRecipeTag(r.id, t) }, "×"))
                ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": tagDraft, "placeholder": "＋ tag toevoegen…", "onChange": (e) => setTagDraft(e.target.value), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addRecipeTag(r.id); } } }), /*#__PURE__*/React.createElement("button", { "onClick": () => addRecipeTag(r.id) }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Ingrediënten"), /*#__PURE__*/React.createElement("div", { "className": "mt-1" }, (r.ingredients || []).map((ing, idx) => renderIngRow(r.id, ing, idx))), /*#__PURE__*/React.createElement("button", { "className": "addrow", "style": { border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }, "onClick": () => updateRecipe(r.id, { ingredients: [...(r.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] }) }, "＋ Ingrediënt toevoegen")), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereiding"), /*#__PURE__*/React.createElement("textarea", { "rows": 4, "value": r.bereiding ?? "", "onChange": (e) => updateRecipe(r.id, { bereiding: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" })), /*#__PURE__*/React.createElement("button", { "onClick": () => deleteRecipe(r.id), "className": "mt-2 text-xs text-red-500 hover:underline" }, "Recept verwijderen"))
        ))
    );
  };
  const stockShort = stock.filter((s) => s.have < s.want);
  // Één platte lijst (ADR-016): ingrediënten van gerechten in scope + extra artikelen + voorraadtekorten,
  // alle tesamen op categorie-volgorde. Artikelen met een winkelvoorkeur buiten de selectie zijn verborgen.
  const unfilteredCount = shoppingRows.length + extraItems.length + stockShort.length;
  const listRows = useMemo(() => {
    const rows = [];
    shoppingRows.forEach((r) => {
      if (rowVisible(r)) rows.push({ ...r, src: "ing" });
    });
    extraItems.forEach((x) => {
      const p = prodOfLabel(x.name, x.pid);
      const mkt = (p && p.market) || marketOf(x.name) || null;
      if (mkt && !shopMarketsEff.includes(mkt)) return;
      rows.push({
        key: "extra-" + x.name,
        src: "extra",
        label: ingLabel({ pid: x.pid || null, amount: x.amount, unit: x.unit, name: x.name }, prodById),
        amount: x.amount != null && x.amount !== "" ? Number(x.amount) : null,
        unit: x.unit || (p && p.unit) || null,
        name: x.name,
        pid: x.pid || (p && p.id) || null,
        dayKey: null,
        mkt,
        cat: (p && p.cat) || x.cat || catOf(x.name) || null,
      });
    });
    stockShort.forEach((s) => {
      const p = prodOfLabel(s.name, s.pid);
      const m = (p && p.market) || s.market || marketOf(s.name) || null;
      if (m && !shopMarketsEff.includes(m)) return;
      rows.push({
        key: "stock-" + s.name,
        src: "stock",
        label: p ? p.name : s.name,
        amount: s.want - s.have,
        unit: (p && p.unit) || null,
        name: p ? p.name : s.name,
        pid: s.pid || (p && p.id) || null,
        dayKey: null,
        note: s.want > 1 ? `(${s.want - s.have} van ${s.want})` : "",
        mkt: m,
        cat: (p && p.cat) || s.cat || null,
      });
    });
    // #43: gelockt gerecht in scope zonder bekende ingrediënten -> 1 regel "Ingrediënten voor <gerecht>"
    scopeKeys.slice(0, shopDaysEff).forEach((k) => {
      const entry = menuByDate[k];
      if (!entry || !entry.id) return;
      const r = byId[entry.id];
      if (!r || (r.ingredients || []).filter(Boolean).length) return;
      rows.push({
        key: `${k}-${r.id}-noing`,
        src: "noing",
        label: `Ingrediënten voor ${r.name}`,
        amount: null,
        unit: null,
        name: r.name,
        pid: null,
        dayKey: k,
        mkt: null,
        cat: "overig",
      });
    });
    // #33: zelfde product (pid, fallback productKey) met gelijke/converteerbare eenheid -> 1 regel met de
    // som van de aantallen. Schaling per afwijkende eters (ADR-012) eerst per bronddag, daarna samenvoegen.
    const groups = new Map();
    rows.forEach((r0) => {
      if (r0.src === "noing") { // #43: regel "ingrediënten voor x" nooit mergen met product-rijen
        groups.set("noing:" + r0.key, { unit: null, parts: [{ ...r0, amount: null, unit: null, name: r0.name }] });
        return;
      }
      const p = r0.pid ? prodById[r0.pid] : null;
      let r = r0;
      let amount = r.amount != null && r.amount !== "" ? Number(r.amount) : null;
      let unit = r.unit || (p && p.unit) || null;
      let name = r.name || "";
      if (r.src === "ing") {
        const ing = r.ing && typeof r.ing === "object" ? r.ing : null;
        name = p ? p.name : (ing && ing.name) || r.label;
        if (ing) {
          amount = ing.amount != null && ing.amount !== "" ? Number(ing.amount) : null;
          unit = ingUnit(ing, p) || null;
          const entry = r.dayKey ? menuByDate[r.dayKey] : null;
          const factor = entry && entry.eaters != null && settings.householdSize > 0 ? entry.eaters / settings.householdSize : 1;
          const sc = scaleIng(ing, factor, prodById);
          if (sc && sc.amount != null && Number.isFinite(Number(sc.amount))) {
            amount = Number(sc.amount);
            r = { ...r, scaled: true, origLabel: r.label };
          }
        }
      }
      let nn = { amount, unit };
      if (amount != null) nn = normalizeAmountUnit(amount, unit);
      amount = nn.amount != null && Number.isFinite(nn.amount) ? nn.amount : null;
      unit = nn.unit || null;
      const idK = r.pid || productKey(name || r.label);
      let gk = idK + "|" + (unit || "");
      let g = groups.get(gk);
      if (!g && unit) {
        for (const [k, gg] of groups) {
          if (!k.startsWith(idK + "|")) continue;
          const gu = k.slice(idK.length + 1);
          if (gu && UNIT_GROUP[gu] && UNIT_GROUP[gu].includes(unit)) {
            const c = convertAmount(amount, unit, gu);
            if (c != null) { amount = c; unit = gu; gk = k; g = gg; }
            break;
          }
        }
      }
      if (!g) {
        g = { unit, parts: [] };
        groups.set(gk, g);
      } else if (g.unit && unit && g.unit !== unit) {
        const c = convertAmount(amount, unit, g.unit);
        if (c != null) amount = c;
      }
      g.parts.push({ ...r, amount, unit, name: name || r.label });
    });
    const merged = [...groups.values()].map((g) => {
      const parts = g.parts;
      const single = parts.length === 1 ? parts[0] : null;
      const sum = parts.some((pp) => Number.isFinite(pp.amount))
        ? roundAmt(parts.reduce((s, pp) => s + (Number.isFinite(pp.amount) ? pp.amount : 0), 0))
        : null;
      const sumN = sum != null ? normalizeAmountUnit(sum, g.unit) : null;
      const amount = sumN ? sumN.amount : null;
      const unit = sumN ? sumN.unit : g.unit;
      const pid = parts.map((pp) => pp.pid).find(Boolean) || null;
      const name = (pid && prodById[pid] && prodById[pid].name) || parts.map((pp) => pp.name).find(Boolean) || parts[0].label;
      const dayKeys = [...new Set(parts.map((pp) => pp.dayKey).filter(Boolean))].sort();
      const mkt0 = parts[0].mkt;
      const mkt = parts.every((pp) => pp.mkt === mkt0) ? mkt0 : null;
      const cat = parts.map((pp) => pp.cat).find(Boolean) || null;
      // #35: weergave op de lijst in winkel-eenheid — hele verpakking (pack, ceil) of g/kg/ml/l min. 100 g/ml; nooit el/tl
      const prod = pid ? prodById[pid] : null;
      const disp = parts[0].src === "noing" ? { amount, unit } : shopDisplayAmount(amount, unit, prod);
      const label = parts[0].src === "noing" ? parts[0].label : ingLabel({ pid, amount: disp.amount, unit: disp.unit, name }, prodById); // #43
      return {
        ...(single || parts[0]),
        key: parts.map((pp) => pp.key).join("+"),
        keys: parts.map((pp) => pp.key),
        label,
        origLabel: single && single.scaled ? single.origLabel : null,
        pid,
        name,
        amount: disp.amount,
        unit: disp.unit,
        dayKey: dayKeys[0] || null,
        dayKeys,
        note: single ? single.note || "" : "",
        mkt,
        cat,
        src: parts.every((pp) => pp.src === "extra") ? "extra" : parts[0].src,
      };
    });
    return sortRowsByCat(merged, (x) => x.label);
  }, [shoppingRows, extraItems, stockShort, shopMarketsEff, prodById, prodByKey, catOf, marketOf, prodOfLabel, rowVisible, sortRowsByCat, menuByDate, settings.householdSize]);
  const totalItems = listRows.length;
  const doneItems = listRows.filter((r) => (r.keys || [r.key]).every((k) => checked[k])).length;
  // Gerechtstatus per dag in scope (ADR-016), over de zichtbare ingrediënten: alles gecheckt -> ✅,
  // iets gecheckt -> ❗, niets gecheckt -> geen icoon. Zichtbaar in het weekmenu bij die datum.
  const mealStatus = useMemo(() => {
    const st = {};
    scopeKeys.slice(0, shopDaysEff).forEach((k) => {
      const entry = menuByDate[k];
      if (!entry || !entry.id) return;
      const rec = byId[entry.id];
      let rowsK = shoppingRows.filter((r) => r.dayKey === k && rowVisible(r));
      if (rec && !(rec.ingredients || []).filter(Boolean).length) rowsK = [{ key: `${k}-${rec.id}-noing` }]; // #43
      if (!rowsK.length) return;
      const doneK = rowsK.filter((r) => checked[r.key]).length;
      if (doneK === rowsK.length) st[k] = { icon: "\u2705", title: "Alle ingrediënten van dit gerecht zijn in huis" };
      else if (doneK > 0) st[k] = { icon: "\u2757", title: `${rowsK.length - doneK} van de ${rowsK.length} ingrediënten mist nog` };
    });
    return st;
  }, [menuByDate, scopeKeys, shopDaysEff, shoppingRows, shopMarketsEff, checked, rowVisible]);
  const mealOk = Object.values(mealStatus).filter((s) => s.icon === "\u2705").length;
  const mealWarn = Object.values(mealStatus).filter((s) => s.icon === "\u2757").length;
  const scaledFactors = [
    ...new Set(
      listRows
        .map((r) => (r.dayKey ? menuByDate[r.dayKey] : null))
        .filter((e) => e && e.eaters != null && e.eaters !== settings.householdSize)
        .map((e) => fmtFactor(e.eaters / settings.householdSize))
    ),
  ];
  const anyScaled = scaledFactors.length > 0;

  // #41: tabbalk met icoontjes (versie C): icoon per tab + klein label onder de actieve tab; teller als badge
  const tabIcons = THEME_TAB_ICONS[settings.theme] || THEME_TAB_ICONS.standaard; // #40: feestthema's eigen iconen
  const tabs = [
    { key: "menu", label: "Weekmenu", icon: tabIcons.menu },
    { key: "recipes", label: "Recepten", icon: tabIcons.recipes },
    { key: "stock", label: "Voorraad", icon: tabIcons.stock },
    { key: "shopping", label: "Boodschappen", icon: tabIcons.shopping },
    { key: "settings", label: "Instellingen", icon: tabIcons.settings },
  ];

  // --- Tab-views: elke tab/sheet als eigen render-functie, direct aangeroepen (geen <Component/>):
  // --- de test-harness vouwt alleen plain-functie-aanroepen open. Alle hooks blijven in App. ---

  const renderMenuTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2" }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 font-medium tracking-wide" }, "VANDAAG"), /*#__PURE__*/React.createElement("div", { "className": "text-2xl font-bold" }, todayLabel)), /*#__PURE__*/React.createElement("button", { "onClick": () => setDateSheetOpen(true), "className": "shrink-0 px-3 py-2 border rounded-lg text-sm text-stone-600 bg-white" }, "📅 Kies een datum ▾")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-1" }, "Week van ", weekLabel), /*#__PURE__*/React.createElement("button", { "onClick": generateMenu, "className": "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl mt-3" }, "Genereer weekmenu")), /*#__PURE__*/React.createElement("div", { "className": "space-y-2" }, days.map((day, i) => {
          const key = weekKeys[i];
          const entry = weekEntries[i];
          const r = entry && entry.id ? byId[entry.id] : null;
          const isToday = key === todayKey;
          const draft = drafts[key];
          const text = draft !== undefined ? draft : entry && entry.custom ? entry.custom : r ? r.name : "";
          const q = text.trim().toLowerCase();
          const exactMatch = q.length >= 2 ? recipes.find((x) => x.cat !== "extra" && x.name.toLowerCase() === q) : null;
          const suggestions = openSuggest === key && q.length >= 2 && !exactMatch ? matchRecipes(recipes, q) : [];
          const isCustom = !!(entry && entry.custom);
          const eatersOverride = entry && entry.eaters != null && entry.eaters !== settings.householdSize ? entry.eaters : null;
          const effectiveEaters = entry && entry.eaters != null ? entry.eaters : settings.householdSize;
          const factor = settings.householdSize > 0 ? effectiveEaters / settings.householdSize : 1;
          return (
            /*#__PURE__*/React.createElement("div", { "key": key, "className": `rounded-xl shadow-sm p-3 ${isToday ? "bg-emerald-100" : "bg-white"}` }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "w-20 shrink-0" }, /*#__PURE__*/React.createElement("div", { "className": `text-sm font-semibold ${isToday ? "text-emerald-700" : ""}` }, day), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400" }, fmtDay(key), isToday ? " · vandaag" : "")), /*#__PURE__*/React.createElement("div", { "className": "flex-1 min-w-0 suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "dish-input", "value": text, "placeholder": "Typ een gerecht…", "readOnly": !!(entry && entry.locked), "onClick": () => { if (entry && entry.locked) setOpenDay(openDay === key ? null : key); }, "title": entry && entry.locked ? "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot" : undefined, "onChange": (e) => {
                      const v = e.target.value;
                      setDrafts((d) => ({ ...d, [key]: v }));
                      setOpenSuggest(v.trim().length >= 2 ? key : null);
                      setActiveSuggest(0);
                    }, "onBlur": () => commitDay(i), "onKeyDown": (e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (suggestions.length && suggestions[activeSuggest]) selectRecipe(i, suggestions[activeSuggest].id);
                        else commitDay(i);
                      } else if (e.key === "Escape") {
                        setOpenSuggest(null);
                      } else if (e.key === "ArrowDown" && suggestions.length) {
                        e.preventDefault();
                        setActiveSuggest((s) => Math.min(s + 1, suggestions.length - 1));
                      } else if (e.key === "ArrowUp" && suggestions.length) {
                        e.preventDefault();
                        setActiveSuggest((s) => Math.max(s - 1, 0));
                      }
                    } }), isCustom && (
                    /*#__PURE__*/React.createElement("div", { "className": "mt-0.5" }, /*#__PURE__*/React.createElement("span", { "className": "tag-free" }, "📍 geen boodschappen"))
                  ), !isCustom && r && (
                    /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-0.5" }, /*#__PURE__*/React.createElement("span", { "className": `inline-block px-1.5 rounded ${CAT_STYLE[r.cat]}` }, CAT_LABEL[r.cat]), /*#__PURE__*/React.createElement("span", { "className": `inline-block px-1.5 rounded ${TIME_STYLE[r.timeCat || "normaal"]}` }, TIME_LABEL[r.timeCat || "normaal"]))
                  ), suggestions.length > 0 && (
                    /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, suggestions.map((s, si) => (
                        /*#__PURE__*/React.createElement("div", { "key": s.id, "className": `suggest-item${si === activeSuggest ? " active" : ""}`, "onMouseDown": (e) => {
                            e.preventDefault();
                            selectRecipe(i, s.id);
                          } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s.name, q)), /*#__PURE__*/React.createElement("span", { "className": `text-[10px] shrink-0 inline-block px-1.5 rounded ${CAT_STYLE[s.cat]}` }, CAT_LABEL[s.cat]))
                      )), /*#__PURE__*/React.createElement("div", { "className": "suggest-foot" }, "↵ Enter — “", text.trim(), "” als eigen tekst opslaan (geen boodschappen)"))
                  )), /*#__PURE__*/React.createElement("button", { "className": `eatersbtn${eatersOverride != null ? " over" : ""}${isCustom ? " opacity-40" : ""}`, "title": isCustom ? "Geen boodschappen voor deze dag" : "Aantal eters deze dag", "onClick": () => {
                    if (isCustom || !entry) return;
                    setEatersOpen(eatersOpen === key ? null : key);
                  } }, "👥", eatersOverride != null && /*#__PURE__*/React.createElement("span", { "className": "ebadge" }, eatersOverride)), mealStatus[key] && (
                  /*#__PURE__*/React.createElement("span", { "className": "shrink-0 text-sm", "title": mealStatus[key].title }, mealStatus[key].icon)
                ), isToday && (
                  /*#__PURE__*/React.createElement("button", { "className": "shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center bg-stone-100 text-stone-500", "title": "Afwijking van het weekplan (geen/weinig energie vandaag)", "onClick": () => { setDeviationKey(key); setDevTab("instant"); setDevPick({}); } }, "🪫")
                ), /*#__PURE__*/React.createElement("button", { "title": entry && entry.locked ? "Ontgrendelen" : "Vergrendelen", "onClick": () => entry && setDay(i, { ...entry, locked: !entry.locked }), "className": `shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center ${entry && entry.locked ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"}` }, entry && entry.locked ? "🔒" : "🔓")), openDay === key && entry && entry.locked && r && (
                /*#__PURE__*/React.createElement("div", { "className": "mt-2 pt-2 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, "Ingrediënten"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mb-2" }, (r.ingredients || []).filter(Boolean).map((ing, ii) => {
                      const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                      return (
                        /*#__PURE__*/React.createElement("button", { "key": ii, "type": "button", "className": "prodchip", "onClick": () => p && openProdCard("menu-" + key, p.id) }, ingLabel(ing, prodById))
                      );
                    })), renderProductCard("menu-" + key), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, "Bereiding"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, r.bereiding || "—"))
              ), eatersOpen === key && entry && !isCustom && (
                /*#__PURE__*/React.createElement("div", { "className": "mt-2 pt-2 border-t flex items-center gap-2 flex-wrap" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.max(1, effectiveEaters - 1)) }, "−"), /*#__PURE__*/React.createElement("span", null, effectiveEaters), /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.min(99, effectiveEaters + 1)) }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500" }, "standaard: ", settings.householdSize, " eters"), /*#__PURE__*/React.createElement("button", { "className": "text-xs text-emerald-700 font-semibold", "onClick": () => setEaters(i, null) }, "Standaard herstellen"), factor !== 1 && (
                    /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 ml-auto" }, "boodschappenlijst ×", fmtFactor(factor), " voor deze dag")
                  ))
              ))
          );
        })), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(true), "className": "w-full mt-4 py-2.5 border rounded-xl text-sm font-medium text-stone-600 bg-white shadow-sm" }, "⚙️ Regels voor het weekmenu"))
  );

  const renderRecipesTab = () => (
    /*#__PURE__*/React.createElement("div", null, recipeInfoOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "mb-2 text-xs text-stone-500" }, "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.")
      ), /*#__PURE__*/React.createElement("div", { "className": "searchbar" }, /*#__PURE__*/React.createElement("span", { "className": "sicon" }, "🔍"), /*#__PURE__*/React.createElement("input", { "className": "recipe-search", "value": recipeQuery, "placeholder": "Zoek op receptnaam…", "onChange": (e) => setRecipeQuery(e.target.value) }), recipeQuery !== "" && (
          /*#__PURE__*/React.createElement("button", { "className": "sicon", "title": "Zoekopdracht wissen", "onClick": () => setRecipeQuery("") }, "✕")
        ), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Hoe werkt zoeken en filteren?", "onClick": () => setRecipeInfoOpen((v) => !v) }, "ℹ️"), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Recept toevoegen", "onClick": () => setAddSheetOpen(true) }, "＋")), /*#__PURE__*/React.createElement("div", { "className": "filterrow" }, ["alle", ...TIME_CATS].map((t) => (
          /*#__PURE__*/React.createElement("button", { "key": t, "className": `chip${t !== "alle" ? " " + t : ""}${timeFilter === t ? " on" : ""}`, "onClick": () => setTimeFilter(t) }, t === "alle" ? "Alle" : timeLabelCap(t))
        )), topTags.map((t) => (
          /*#__PURE__*/React.createElement("button", { "key": t, "className": `chip${tagFilters.includes(t) ? " on" : ""}`, "onClick": () => toggleTagFilter(t) }, `🏷 ${t}`)
        )), allTags.length > topTags.length && (
          /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setFilterSheetOpen(true) }, `＋${allTags.length - topTags.length} meer ▾`)
        ), /*#__PURE__*/React.createElement("span", { "className": "sortwrap", "style": { marginLeft: "auto" } }, /*#__PURE__*/React.createElement("button", { "className": "chip", "title": "Sorteren", "onClick": () => setSortMenuOpen((v) => !v) }, "⇅ Sorteer ▾"), sortMenuOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "sortmenu" }, /*#__PURE__*/React.createElement("button", { "className": recipeSort === "naam" ? "on" : "", "onClick": () => { setRecipeSort("naam"); setSortMenuOpen(false); } }, "✓ Naam (A–Z)"), /*#__PURE__*/React.createElement("button", { "className": recipeSort === "laatst" ? "on" : "", "onClick": () => { setRecipeSort("laatst"); setSortMenuOpen(false); } }, "🕒 Laatst gegeten (langst geleden eerst)"))
          )), /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setFilterSheetOpen(true) }, "⚙ Filters ▾")), (hasRecipeFilters || sortLast) && (
        /*#__PURE__*/React.createElement("div", { "className": "afilterrow" }, sortLast && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🕒 Laatst gegeten `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setRecipeSort("naam") }, "×"))
          ), rq !== "" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🔍 “${recipeQuery.trim()}” `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setRecipeQuery("") }, "×"))
          ), timeFilter !== "alle" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `⏱ ${TIME_LABEL[timeFilter]} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setTimeFilter("alle") }, "×"))
          ), ingQ !== "" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🥘 ${ingFilter.trim()} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setIngFilter("") }, "×"))
          ), tagFilters.map((t) => (
            /*#__PURE__*/React.createElement("span", { "key": t, "className": "afilter" }, `🏷 ${t} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => toggleTagFilter(t) }, "×"))
          )), /*#__PURE__*/React.createElement("button", { "className": "clearall", "onClick": clearRecipeFilters }, "Alles wissen"), /*#__PURE__*/React.createElement("span", { "className": "count" }, `${filteredRecipes.length} van ${recipes.length} recepten`))
      ), !showFlatList && ["vega", "vis", "vlees", "extra"].map((c) => {
        const list = recipes.filter((r) => r.cat === c).sort((a, b) => a.name.localeCompare(b.name, "nl"));
        if (!list.length) return null;
        return (
          /*#__PURE__*/React.createElement("div", { "key": c, "className": "mb-4" }, /*#__PURE__*/React.createElement("div", { "className": `inline-block px-2 py-0.5 rounded-full text-sm font-semibold mb-2 ${CAT_STYLE[c]}` }, CAT_LABEL[c]), /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, list.map((r) => renderRecipeRow(r))))
        );
      }), showFlatList && (
        /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, [...filteredRecipes].sort(sortLast ? byLastEaten : (a, b) => a.name.localeCompare(b.name, "nl")).map((r) => renderRecipeRow(r)))
      ), /*#__PURE__*/React.createElement("div", { "className": "mutedrow" }, /*#__PURE__*/React.createElement("button", { "className": "linkbtn", "onClick": exportRecipes }, "Exporteren"), /*#__PURE__*/React.createElement("label", { "className": "linkbtn cursor-pointer" }, "Importeren", /*#__PURE__*/React.createElement("input", { "type": "file", "accept": "application/json,.json", "className": "hidden", "onChange": (e) => { if (e.target.files[0]) importRecipes(e.target.files[0]); e.target.value = ""; } })), /*#__PURE__*/React.createElement("button", { "className": "linkbtn", "onClick": resetRecipes }, "Standaardlijst terug")), filterSheetOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setFilterSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, "Filters"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setFilterSheetOpen(false) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereidingstijd"), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, ["alle", ...TIME_CATS].map((t) => (
                    /*#__PURE__*/React.createElement("button", { "key": t, "className": timeFilter === t ? "on" : "", "onClick": () => setTimeFilter(t) }, t === "alle" ? "Alles" : timeLabelCap(t))
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-3 mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Ingrediënt bevat"), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": ingFilter, "placeholder": "bijv. zalm, ui, kaas…", "onChange": (e) => setIngFilter(e.target.value) })), /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-3 mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Tags (alle geselecteerde moeten erop — AND)"), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, allTags.length === 0 && /*#__PURE__*/React.createElement("span", { "className": "text-stone-400 text-xs" }, "nog geen tags in de pool"), allTags.map((t) => (
                    /*#__PURE__*/React.createElement("button", { "key": t, "className": `chip${tagFilters.includes(t) ? " on" : ""}`, "onClick": () => toggleTagFilter(t) }, `🏷 ${t}`)
                  )))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 mt-4" }, /*#__PURE__*/React.createElement("button", { "className": "text-xs font-semibold text-stone-500 px-1 py-2", "onClick": clearRecipeFilters }, "Wis filters"), /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm", "onClick": () => setFilterSheetOpen(false) }, `Toon ${filteredRecipes.length} recepten`)))))
      ), addSheetOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setAddSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, "Nieuw recept"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setAddSheetOpen(false) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Naam"), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.name, "placeholder": "Naam…", "onChange": (e) => setNewRecipe({ ...newRecipe, name: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") addRecipe(); } })), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Categorie"), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, ["vega", "vis", "vlees", "extra"].map((c) => (
                    /*#__PURE__*/React.createElement("button", { "key": c, "className": `chip${newRecipe.cat === c ? " on" : ""}`, "onClick": () => setNewRecipe({ ...newRecipe, cat: c }) }, CAT_LABEL[c])
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereidingstijd"), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, TIME_CATS.map((t) => (
                    /*#__PURE__*/React.createElement("button", { "key": t, "className": newRecipe.timeCat === t ? "on" : "", "onClick": () => setNewRecipe({ ...newRecipe, timeCat: t }) }, timeLabelCap(t))
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Tags"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, newRecipe.tags.map((t) => (
                    /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => setNewRecipe({ ...newRecipe, tags: newRecipe.tags.filter((x) => x !== t) }) }, "×"))
                  ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": newRecipe.tagDraft, "placeholder": "＋ tag toevoegen…", "onChange": (e) => setNewRecipe({ ...newRecipe, tagDraft: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } } }), /*#__PURE__*/React.createElement("button", { "onClick": addNewTag }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Ingrediënten"), /*#__PURE__*/React.createElement("div", { "className": "mt-1" }, (newRecipe.ingredients || []).map((ing, idx) => renderNewIngRow(ing, idx))), /*#__PURE__*/React.createElement("button", { "className": "addrow", "style": { border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }, "onClick": () => setNewRecipe({ ...newRecipe, ingredients: [...(newRecipe.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] }) }, "＋ Ingrediënt toevoegen")), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereiding (optioneel)"), /*#__PURE__*/React.createElement("textarea", { "rows": 2, "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.bereiding, "placeholder": "Bereiding…", "onChange": (e) => setNewRecipe({ ...newRecipe, bereiding: e.target.value }) })), /*#__PURE__*/React.createElement("button", { "className": "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm", "onClick": addRecipe }, "Toevoegen"))))
      ), daySheetRecipe && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDaySheetRecipe(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, "Kies een dag deze week"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setDaySheetRecipe(null) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "Week van ", curWeekLabel, " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)"), curWeekKeys.map((k, i) => {
                const entry = menuByDate[k];
                const locked = !!(entry && entry.locked);
                const cur = entry && entry.id ? byId[entry.id] : null;
                const isToday = k === todayKey;
                return (
                  /*#__PURE__*/React.createElement("button", { "key": k, "className": `dayrow${locked ? " locked" : ""}${isToday ? " today" : ""}`, "disabled": locked, "onClick": () => addRecipeToWeek(daySheetRecipe, k) }, /*#__PURE__*/React.createElement("span", { "className": "dname" }, days[i]), /*#__PURE__*/React.createElement("span", { "className": "ddate" }, fmtDay(k), isToday ? " · vandaag" : ""), /*#__PURE__*/React.createElement("span", { "className": "ddish" }, locked ? "🔒 " : "", entry && entry.custom ? entry.custom : cur ? cur.name : "leeg"))
                );
              }), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-3" }, daySheetRecipe.name, " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven)."))))
      ), weekToast !== "" && /*#__PURE__*/React.createElement("div", { "className": "toast" }, weekToast))
  );

  const renderStockTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, "Locaties"), /*#__PURE__*/React.createElement("span", { "className": "relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${stockInfoOpen ? " on" : ""}`, "title": "Hoe werkt de voorraad?", "onClick": () => setStockInfoOpen((v) => !v) }, "ℹ️"), stockInfoOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, "Hoe werkt de voorraad?"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen."), /*#__PURE__*/React.createElement("li", null, "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕)."), /*#__PURE__*/React.createElement("li", null, "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan."), /*#__PURE__*/React.createElement("li", null, "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst."), /*#__PURE__*/React.createElement("li", null, "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.")))
          ))), stockLocations.map((loc) => {
        const items = productsOf(loc.id);
        const open = !!openLocs[loc.id];
        const editing = editLoc === loc.id;
        return (
          /*#__PURE__*/React.createElement("div", { "key": loc.id, "className": "bg-white rounded-xl shadow-sm mb-3 overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "className": "text-stone-400 text-xs w-4 shrink-0", "title": open ? "Inklappen" : "Uitklappen", "onClick": () => toggleLoc(loc.id) }, open ? "▾" : "▸"), /*#__PURE__*/React.createElement("button", { "className": "flex-1 text-left min-w-0 font-medium text-sm truncate", "onClick": () => toggleLoc(loc.id) }, loc.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0", "title": `${items.length} ${items.length === 1 ? "product" : "producten"}` }, items.length), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${editing ? " on" : ""}`, "title": editing ? "Gewenste hoeveelheden niet meer bewerken" : "Gewenste hoeveelheden in deze locatie bewerken", "onClick": () => setEditLoc(editing ? null : loc.id) }, "✏️"), /*#__PURE__*/React.createElement("button", { "className": `delbtn${items.length ? " dis" : ""}`, "disabled": items.length > 0, "title": items.length ? "Verwijderen kan pas als er geen producten meer aan deze locatie hangen" : "Locatie verwijderen", "onClick": () => deleteLocation(loc.id) }, "🗑️")), open && (
              /*#__PURE__*/React.createElement("div", { "className": "border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100" }, items.map((s) => {
                    const tekort = s.have < s.want;
                    const sp = s.pid ? prodById[s.pid] : null;
                    const cat = (sp && sp.cat) || s.cat;
                    const mkt = (sp && sp.market) || s.market;
                    return (
                      /*#__PURE__*/React.createElement("div", { "key": s.i }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2 flex-wrap" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm" }, s.pid ? (
                            /*#__PURE__*/React.createElement("button", { "type": "button", "className": "prodlink", "onClick": () => openProdCard("stock-" + s.i, s.pid) }, sp ? sp.name : s.name)
                          ) : (
                            s.name
                          ), /*#__PURE__*/React.createElement("span", { "className": "block text-[10px] text-stone-400" }, cat)), /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": "Huidige voorraad" }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": `w-6 text-center text-sm font-medium ${tekort ? "text-orange-600" : "text-stone-700"}` }, s.have), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, 1) }, "+")), editing ? (
                          /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": "Gewenste voorraad aanpassen" }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": "w-6 text-center text-sm font-medium text-stone-700" }, s.want), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, 1) }, "+"))
                        ) : (
                          /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 whitespace-nowrap" }, `gewenst ${s.want}`)
                        ), mkt && /*#__PURE__*/React.createElement("span", { "className": "chip mkt", "title": "Winkelvoorkeur" }, marketChip(mkt)), tekort && /*#__PURE__*/React.createElement("span", { "className": "text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap" }, "op lijst"), /*#__PURE__*/React.createElement("button", { "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Product verwijderen", "onClick": () => deleteProduct(s.i) }, "✕")), renderProductCard("stock-" + s.i))
                    );
                  }), items.length === 0 && (
                    /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 text-sm text-stone-400 text-center" }, "Nog geen producten in deze locatie.")
                  )), addProdRow === loc.id ? (
                  /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50" }, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap", "style": { flex: 1.4 } }, /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 text-sm", "value": newProdRow.name, "placeholder": "Productnaam…", "onChange": (e) => { setNewProdRow({ ...newProdRow, name: e.target.value }); setProdRowSuggest(e.target.value.trim().length >= 2); }, "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addProductRow(loc.id); } } }), prodRowSuggest && newProdRow.name.trim().length >= 2 && (
                        /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, matchProducts(products, newProdRow.name.trim().toLowerCase()).map((s2) => (
                            /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": "suggest-item", "onMouseDown": (e) => { e.preventDefault(); setNewProdRow({ ...newProdRow, name: s2.name }); setProdRowSuggest(false); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, newProdRow.name.trim().toLowerCase())), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat))
                          )))
                      )), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, "gewenst"), /*#__PURE__*/React.createElement("span", { "className": "stepper shrink-0" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProdRow({ ...newProdRow, want: Math.max(0, newProdRow.want - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, newProdRow.want), /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProdRow({ ...newProdRow, want: newProdRow.want + 1 }) }, "+")), /*#__PURE__*/React.createElement("button", { "className": "iconbtn on", "title": "Toevoegen", "disabled": !newProdRow.name.trim(), "onClick": () => addProductRow(loc.id) }, "✓"), /*#__PURE__*/React.createElement("button", { "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Annuleren", "onClick": () => { setAddProdRow(null); setNewProdRow({ name: "", want: 1 }); setProdRowSuggest(false); } }, "✕"))
                ) : (
                  /*#__PURE__*/React.createElement("button", { "className": "addrow", "onClick": () => setAddProdRow(loc.id) }, "＋ Product toevoegen")
                ))
            ))
        );
      }), addLocOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm mb-3 p-3 flex gap-2 items-center" }, /*#__PURE__*/React.createElement("input", { "value": newLocName, "onChange": (e) => setNewLocName(e.target.value), "placeholder": "Naam van de locatie…", "className": "flex-1 border rounded-lg px-3 py-2 text-sm", "onKeyDown": (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLocation();
              }
            } }), /*#__PURE__*/React.createElement("button", { "className": "iconbtn on", "title": "Locatie toevoegen", "onClick": addLocation }, "✓"), /*#__PURE__*/React.createElement("button", { "className": "delbtn", "title": "Annuleren", "onClick": () => {
              setAddLocOpen(false);
              setNewLocName("");
            } }, "✕"))
      ), /*#__PURE__*/React.createElement("button", { "className": "addcard", "onClick": () => setAddLocOpen((v) => !v) }, "＋ Locatie toevoegen"), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-4" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setStock(stock.map((s) => ({ ...s, have: s.want }))), "className": "flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium" }, "✓ Alles aangevuld"), /*#__PURE__*/React.createElement("button", { "onClick": () => {
            setStock(defaultStock());
            setStockLocations(DEFAULT_LOCATIONS.map((l) => ({ ...l })));
          }, "className": "py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "Standaardlijst terug")))
  );

  // #34: "Verwerk update" — afgevinkte rijen verwerken: voorraad (have) bijwerken, melding tonen,
  // en afgevinkte rijen verbergen uit de zichtbare lijst (chip "n afgevinkt · toon" zet ze terug).
  function processChecked() {
    const haveUpdates = {};
    listRows.forEach((r) => {
      const keys = r.keys || [r.key];
      if (!keys.every((k) => checked[k])) return;
      keys.forEach((k) => {
        if (k.startsWith("stock-")) {
          const s = stock.find((x) => "stock-" + x.name === k);
          if (s) haveUpdates[s.name] = s.want; // tekort gehaald -> have = want
        } else if (r.src === "ing" && r.pid) {
          const s = stock.find((x) => x.pid === r.pid || productKey(x.name) === productKey(r.name || ""));
          if (s) {
            const p = prodById[r.pid];
            let add = r.amount != null && Number.isFinite(r.amount) ? r.amount : 1;
            if (r.unit && p && p.unit && r.unit !== p.unit) {
              const c = convertAmount(add, r.unit, p.unit);
              if (c != null) add = c;
            }
            haveUpdates[s.name] = (s.name in haveUpdates ? haveUpdates[s.name] : s.have) + add;
          }
        }
      });
    });
    if (Object.keys(haveUpdates).length) {
      setStock((st) => st.map((s) => (s.name in haveUpdates ? { ...s, have: haveUpdates[s.name] } : s)));
    }
    setHiddenChecked(true);
    setShowChecked(false);
    setShopDone(true);
  }
  const isRowChecked = (r) => (r.keys || [r.key]).every((k) => checked[k]);
  // #34 versie B: na "Verwerk update" zijn afgevinkte rijen verborgen (chip zet ze terug)
  const visibleRows = hiddenChecked && !showChecked ? listRows.filter((r) => !isRowChecked(r)) : listRows;

  const renderShoppingTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, `Boodschappenlijst · ${todayLabel}`), /*#__PURE__*/React.createElement("span", { "className": "flex gap-1.5 relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${shopInfoOpen ? " on" : ""}`, "title": "Hoe werkt de boodschappenlijst?", "onClick": () => setShopInfoOpen((v) => !v) }, "ℹ️"), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${catsOpen ? " on" : ""}`, "title": "Categorieën beheren", "onClick": () => setCatsOpen((v) => !v) }, "⚙️"), shopInfoOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, "Hoe werkt de boodschappenlijst?"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet."), /*#__PURE__*/React.createElement("li", null, "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit."), /*#__PURE__*/React.createElement("li", null, "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug."), /*#__PURE__*/React.createElement("li", null, "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.")))
          ))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 mb-4 px-1" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setShopDays(Math.max(0, shopDaysEff - 1)), "disabled": shopDaysEff <= 0 }, "−"), /*#__PURE__*/React.createElement("span", null, shopDaysEff), /*#__PURE__*/React.createElement("button", { "onClick": () => setShopDays(Math.min(maxShopDays, shopDaysEff + 1)), "disabled": shopDaysEff >= maxShopDays }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0" }, "dagen"), /*#__PURE__*/React.createElement("div", { "className": "flex gap-1 ml-auto overflow-x-auto" }, markets.map((m) => (
            /*#__PURE__*/React.createElement("button", { "key": m.key, "className": `chip${shopMarketsEff.includes(m.key) ? " on" : ""}`, "title": m.label, "onClick": () =>
                setShopMarkets(
                  shopMarketsEff.includes(m.key) ? shopMarketsEff.filter((x) => x !== m.key) : [...shopMarketsEff, m.key]
                )
               }, marketChip(m.key))
          )))), catsOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-3 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold mb-1" }, "Categorieën"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”."), /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100 border border-stone-100 rounded-xl" }, shopCats.map((c, i) => {
              const used = stock.some((s) => s.cat === c) || extraItems.some((x) => x.cat === c);
              return (
                /*#__PURE__*/React.createElement("div", { "key": c, "className": "flex items-center gap-2 px-2 py-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "flex flex-col leading-none shrink-0" }, /*#__PURE__*/React.createElement("button", { "className": "text-[9px] text-stone-400 hover:text-stone-700", "disabled": i === 0, "onClick": () => moveCat(i, -1) }, "▲"), /*#__PURE__*/React.createElement("button", { "className": "text-[9px] text-stone-400 hover:text-stone-700", "disabled": i === shopCats.length - 1, "onClick": () => moveCat(i, 1) }, "▼")), /*#__PURE__*/React.createElement("span", { "className": "flex-1 text-sm min-w-0 truncate" }, c), /*#__PURE__*/React.createElement("button", { "className": `text-sm ${used ? "text-stone-300" : "text-stone-300 hover:text-red-500"}`, "disabled": used, "title": used ? "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten" : "Categorie verwijderen", "onClick": () => removeCat(c) }, "✕"))
              );
            })), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-2" }, /*#__PURE__*/React.createElement("input", { "value": newCat, "onChange": (e) => setNewCat(e.target.value), "placeholder": "Nieuwe categorie…", "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm", "onKeyDown": (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCat();
                }
              } }), /*#__PURE__*/React.createElement("button", { "className": "px-3 border rounded-lg text-sm text-stone-600 bg-white", "onClick": addCat }, "＋")))
      ), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2 bg-stone-50" }, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap", "style": { flex: 1.4 } }, /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 text-sm", "value": newExtra.name, "placeholder": "Productnaam…", "onChange": (e) => { setNewExtra({ ...newExtra, name: e.target.value }); setExtraSuggest(e.target.value.trim().length >= 2); }, "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addExtraRowFn(); } } }), extraSuggest && newExtra.name.trim().length >= 2 && (
              /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, matchProducts(products, newExtra.name.trim().toLowerCase()).map((s2) => (
                  /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": "suggest-item", "onMouseDown": (e) => { e.preventDefault(); setNewExtra({ ...newExtra, name: s2.name }); setExtraSuggest(false); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, newExtra.name.trim().toLowerCase())), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat, s2.unit ? ` · ${s2.unit}` : ""))
                )))
            )), /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.6rem" }, "value": newExtra.amount || "", "title": "Aantal", "onChange": (e) => setNewExtra({ ...newExtra, amount: e.target.value === "" ? 0 : Number(String(e.target.value).replace(",", ".")) }) }), /*#__PURE__*/React.createElement("button", { "className": "bg-stone-800 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0", "disabled": !newExtra.name.trim(), "onClick": addExtraRowFn }, "Toevoegen"))), listRows.length === 0 && unfilteredCount > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10 bg-white rounded-xl shadow-sm" }, `Niets te halen bij ${shopMarketsEff.map((k) => marketChip(k)).join(", ") || "de geselecteerde supermarkt"}`, /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-1" }, "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt"), /*#__PURE__*/React.createElement("button", { "className": "chip on mt-2", "onClick": () => setShopMarkets(markets.map((m) => m.key)) }, "Toon alle supermarkten"))
      ), listRows.length === 0 && unfilteredCount === 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10" }, "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.")
      ), listRows.length > 0 && doneItems > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setShowChecked((v) => !v) }, `${doneItems} afgevinkt · ${showChecked ? "verberg" : "toon"} ▾`))
      ), listRows.length > 0 && visibleRows.length === 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm text-center text-stone-400 text-sm py-8" }, "Alles afgevinkt — toon de rijen met de chip hierboven.")
      ), visibleRows.length > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm divide-y divide-stone-100" }, visibleRows.map((r) => {
            const keys = r.keys || [r.key];
            const isChecked = keys.every((k) => checked[k]);
            const showDate = r.dayKeys && r.dayKeys.length > 0 && (r.cat === "groente" || r.cat === "zuivel" || r.src === "noing");
            return (
              /*#__PURE__*/React.createElement("div", { "key": r.key }, /*#__PURE__*/React.createElement("label", { "className": "flex items-center gap-3 px-3 py-2 cursor-pointer" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": isChecked, "onChange": (e) => setChecked({ ...checked, ...Object.fromEntries(keys.map((k) => [k, e.target.checked])) }), "className": "w-4 h-4 accent-emerald-600" }), /*#__PURE__*/React.createElement("span", { "className": `text-sm ${isChecked ? "line-through text-stone-300" : ""}` }, r.origLabel ? (
                      /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", { "className": "line-through text-stone-300" }, r.origLabel), " → ", /*#__PURE__*/React.createElement("span", { "className": "font-semibold" }, r.label))
                    ) : r.pid ? (
                      /*#__PURE__*/React.createElement("button", { "type": "button", "className": "prodlink", "onClick": () => openProdCard(r.key, r.pid) }, r.label)
                    ) : (
                      r.label
                    ), r.note && /*#__PURE__*/React.createElement("span", { "className": "text-stone-400" }, ` ${r.note}`), showDate && r.dayKeys.map((dk, i) => (
                      /*#__PURE__*/React.createElement("span", { "key": dk, "className": `datechip${i === r.dayKeys.length - 1 ? " last" : ""}` }, `${dayShortOf(dk)} ${fmtDay(dk)}`)
                    ))), r.mkt && (
                    /*#__PURE__*/React.createElement("span", { "className": "ml-auto chip mkt", "title": "Winkelvoorkeur: dit artikel wordt daar gehaald" }, marketChip(r.mkt))
                  ), r.src === "extra" && keys.length === 1 && (
                    /*#__PURE__*/React.createElement("button", { "onClick": () => setExtraItems(extraItems.filter((x) => x.name !== r.name)), "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Artikel verwijderen" }, "✕")
                  )), renderProductCard(r.key))
            );
          }))
      ), anyScaled && (
        /*#__PURE__*/React.createElement("p", { "className": "text-[10px] text-stone-400 mt-1" }, `Hoeveelheden geschaald voor afwijkende eters (×${scaledFactors.join(", ")} t.o.v. standaard ${settings.householdSize} eters); regels zonder getal blijven gelijk.`)
      ), totalItems > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "mt-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex gap-2" }, /*#__PURE__*/React.createElement("button", { "onClick": processChecked, "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm" }, "Verwerk update"), /*#__PURE__*/React.createElement("button", { "onClick": () => {
                setChecked({});
                setShopDone(false);
                setHiddenChecked(false);
                setShowChecked(false);
              }, "className": "py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "Vinkjes wissen")), shopDone && (
            /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mt-2 text-center" }, mealOk + mealWarn > 0
                ? `✅ ${mealOk} gerechten compleet${mealWarn > 0 ? ` · ❗ ${mealWarn} mist nog iets` : ""} — zie weekmenu (lijst blijft afvinkbaar)`
                : "Nog niets afgevinkt — vink de gehaalde artikelen af.")
          ))
      ))
  );

  // Delen via bestand (ADR-019): deelsheet (export/uitleg) + import-rapport + toast
  const renderDelenSheets = () => {
    const chipDefs = [
      ["recipes", `Recepten (${recipes.length})`],
      ["products", `Producten (${products.length})`],
      ["stock", `Voorraad (${stock.length})`],
      ["menu", `Weekmenu (${Object.keys(menuByDate).length} dagen)`],
      ["settings", "Instellingen · vinkjes · verwijderingen"],
    ];
    return (
      /*#__PURE__*/React.createElement("div", null, delenOpen && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDelenOpen(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, delenOpen === "info" ? "Delen: hoe werkt het?" : "Delen via bestand"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setDelenOpen(null) }, "✕")), delenOpen === "export" ? (
                  /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1" }, "Wat gaat er mee? (tik om aan/uit te zetten)"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1.5 mb-3" }, chipDefs.map(([k, label]) => (
                        /*#__PURE__*/React.createElement("button", { "key": k, "className": "chip" + (deelChips[k] ? " on" : ""), "onClick": () => setDeelChips((c) => ({ ...c, [k]: !c[k] })) }, label)
                      ))), /*#__PURE__*/React.createElement("button", { "className": "w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mb-2", "onClick": exportShare }, "📤 Maak deelbestand"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400" }, "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten."))
                ) : (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600 leading-relaxed" }, /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat."), /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen."), /*#__PURE__*/React.createElement("div", null, "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee."))
                ))))
        ), importReview && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setImportReview(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, "Bestand overnemen"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setImportReview(null) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "📄 ", importReview.fileName), /*#__PURE__*/React.createElement("div", { "className": "text-sm mb-2" }, "Dit verandert er als je samenvoegt:"), /*#__PURE__*/React.createElement("div", { "className": "text-xs leading-relaxed mb-3" }, deelRapportLines(importReview).length === 0 && /*#__PURE__*/React.createElement("div", null, "➖ Niets nieuws in dit bestand."), deelRapportLines(importReview).map((l) => (
                    /*#__PURE__*/React.createElement("div", { "key": l.lbl }, l.active ? "✅" : "➖", " ", l.lbl, ": ", l.parts.join(" · "))
                  ))), importReview.merge.rapport.conflicts.length > 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "font-medium text-amber-800 mb-1" }, "⚠️", importReview.merge.rapport.conflicts.length, "× nieuwste wint — zo nodig hierna zelf herstellen:"), importReview.merge.rapport.conflicts.slice(0, 8).map((cf, i) => (
                      /*#__PURE__*/React.createElement("div", { "key": i, "className": "text-amber-900" }, cf.naam.split(" (")[0], ": hier \"", cf.hier, "\" → uit bestand \"", cf.daar, "\"")
                    )))
                ), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2" }, /*#__PURE__*/React.createElement("button", { "className": "flex-1 rounded-xl border border-stone-300 py-2.5 text-sm", "onClick": () => setImportReview(null) }, "Annuleren"), /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium", "onClick": applyImportReview }, "Samenvoegen")))))
        ), shareToast !== "" && (
          /*#__PURE__*/React.createElement("div", { "className": "toast", "onClick": () => setShareToast("") }, shareToast)
        ))
    );
  };

  const renderSettingsTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "mb-2 text-xs text-stone-500" }, "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (", days[0], ")."), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, "Weergave"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "Thema van de app — lokaal opgeslagen per huishouden (#40)."), THEMES.map((th) => (
          /*#__PURE__*/React.createElement("label", { "key": th.key, "className": "flex items-center gap-2 py-1.5 cursor-pointer text-sm", "title": `Thema ${th.label}` }, /*#__PURE__*/React.createElement("input", { "type": "radio", "name": "theme", "checked": settings.theme === th.key, "onChange": () => updateSettings({ theme: th.key }), "className": "accent-emerald-600" }), /*#__PURE__*/React.createElement("span", { "className": settings.theme === th.key ? "font-semibold" : "text-stone-600" }, th.label), /*#__PURE__*/React.createElement("span", { "className": "ml-auto flex gap-1" }, th.dots.map((dot, di) => (
                /*#__PURE__*/React.createElement("span", { "key": di, "className": "inline-block w-4 h-4 rounded-full border border-stone-300", "style": { background: dot } })
              ))))
        ))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Huishouden"), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Aantal eters"), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "1", "value": settings.householdSize, "onChange": (e) => updateSettings({ householdSize: Math.max(1, Number(e.target.value) || 1) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" })), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Week start op"), /*#__PURE__*/React.createElement("select", { "value": settings.weekStartDay, "onChange": (e) => updateSettings({ weekStartDay: Number(e.target.value) }), "className": "border rounded-lg px-2 py-1.5 text-sm text-stone-600" }, DAY_NAMES.map((d, i) => (
              /*#__PURE__*/React.createElement("option", { "key": d, "value": i }, d)
            ))))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Eetpatroon"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "Vis-dagen:"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-2 mb-3" }, days.map((d, i) => (
            /*#__PURE__*/React.createElement("label", { "key": i, "className": "flex items-center gap-1 text-xs border rounded-lg px-2 py-1 cursor-pointer" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": fishDays.includes(i), "onChange": (e) =>
                  updateSettings({ fishDays: e.target.checked ? [...fishDays, i] : fishDays.filter((x) => x !== i) })
                , "className": "accent-emerald-600" }), d)
          ))), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Aantal vega-dagen (op niet-vis-dagen)"), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "0", "max": "7", "value": settings.vegaTarget, "onChange": (e) => updateSettings({ vegaTarget: Math.max(0, Number(e.target.value) || 0) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" }))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Supermarkten"), markets.map((m, mi) => (
          /*#__PURE__*/React.createElement("div", { "key": mi, "className": "flex gap-2 mb-2" }, /*#__PURE__*/React.createElement("input", { "value": m.key, "onChange": (e) => updateMarket(mi, { key: e.target.value }), "placeholder": "sleutel…", "className": "w-20 border rounded-lg px-2 py-1.5 text-sm" }), /*#__PURE__*/React.createElement("input", { "value": m.label, "onChange": (e) => updateMarket(mi, { label: e.target.value }), "placeholder": "Naam…", "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" }), /*#__PURE__*/React.createElement("label", { "className": "flex items-center gap-1 text-[10px] text-stone-500 shrink-0 cursor-pointer", "title": "Standaard geselecteerd op de boodschappenlijst" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": m.defaultShop !== false, "onChange": (e) => updateMarket(mi, { defaultShop: e.target.checked }), "className": "accent-emerald-600" }), "standaard"), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: markets.filter((_, j) => j !== mi) }), "className": "text-stone-300 hover:text-red-500 text-sm px-1" }, "✕"))
        )), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: [...markets, { key: "winkel" + (markets.length + 1), label: "Nieuwe winkel", defaultShop: true }] }), "className": "w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "+ Supermarkt toevoegen")), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2" }, /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Deelbestand maken (exporteren)", "onClick": () => setDelenOpen("export") }, "📤"), /*#__PURE__*/React.createElement("label", { "className": "iconbtn cursor-pointer", "title": "Bestand overnemen (importeren)" }, "📥", /*#__PURE__*/React.createElement("input", { "type": "file", "accept": "application/json,.json", "className": "hidden", "onChange": (e) => { if (e.target.files && e.target.files[0]) importShareFile(e.target.files[0]); e.target.value = ""; } })), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Uitleg over delen via bestand", "onClick": () => setDelenOpen("info") }, "ℹ️"))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, "🛵 Afhaalmaaltijden (bestelsites)"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010)."), (settings.takeawayLinks || []).map((l, i) => (
          /*#__PURE__*/React.createElement("div", { "key": l.id, "className": "flex gap-2 mb-2" }, /*#__PURE__*/React.createElement("input", { "value": l.label, "onChange": (e) => updateTakeawayLink(i, { label: e.target.value }), "placeholder": "Naam…", "className": "w-32 border rounded-lg px-2 py-1.5 text-sm" }), /*#__PURE__*/React.createElement("input", { "value": l.url, "onChange": (e) => updateTakeawayLink(i, { url: e.target.value }), "placeholder": "URL…", "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" }), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ takeawayLinks: (settings.takeawayLinks || []).filter((_, j) => j !== i) }), "className": "text-stone-300 hover:text-red-500 text-sm px-1", "title": "Bestelsite verwijderen" }, "✕"))
        )), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ takeawayLinks: [...(settings.takeawayLinks || []), { id: "tl-" + Date.now().toString(36), label: "Nieuwe bestelsite", url: "" }] }), "className": "w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "+ Bestelsite toevoegen")), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "w-full flex items-center gap-2 text-left", "onClick": () => setCatOpen((o) => !o), "title": "Productcatalogus in-/uitklappen (#44)" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-medium" }, "📦 Productcatalogus"), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, products.length), /*#__PURE__*/React.createElement("span", { "className": "ml-auto text-xs text-stone-400" }, catOpen ? "▾" : "▸")), catOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, `Elk ingrediënt, voorraadproduct en extra artikel is hier een product met categorie, eenheid en optionele winkelvoorkeur. Klik op een naam om te wijzigen; ✕ verwijdert het product uit de catalogus (koppelingen vallen terug op vrije tekst — handig bij typefouten).`), /*#__PURE__*/React.createElement("div", { "className": "searchbar", "style": { boxShadow: "none" } }, /*#__PURE__*/React.createElement("span", { "className": "sicon" }, "🔍"), /*#__PURE__*/React.createElement("input", { "className": "recipe-search", "value": prodQuery, "placeholder": "Zoek product…", "onChange": (e) => setProdQuery(e.target.value) }), prodQuery !== "" && (
            /*#__PURE__*/React.createElement("button", { "className": "sicon", "title": "Zoekopdracht wissen", "onClick": () => setProdQuery("") }, "✕")
          )), /*#__PURE__*/React.createElement("div", { "className": "filterrow" }, shopCats.map((c) => (
            /*#__PURE__*/React.createElement("button", { "key": c, "type": "button", "className": `chip${catFilters.includes(c) ? " on" : ""}`, "onClick": () => setCatFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c])) }, c)
          ))), /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100 border border-stone-100 rounded-xl mt-2" }, filteredProducts.map((p) => (
            /*#__PURE__*/React.createElement("div", { "key": p.id }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm" }, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "prodlink", "onClick": () => openProdCard("cat-" + p.id, p.id) }, p.name)), /*#__PURE__*/React.createElement("span", { "className": "chip" }, p.cat), p.unit && /*#__PURE__*/React.createElement("span", { "className": "chip", "title": "Standaardeenheid" }, p.unit), p.market && /*#__PURE__*/React.createElement("span", { "className": "chip mkt", "title": "Winkelvoorkeur" }, marketChip(p.market)), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0", "title": "Aantal keer gebruikt" }, usageCount(p.id), "×"), /*#__PURE__*/React.createElement("button", { "className": "delbtn", "title": "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)", "onClick": () => deleteProductCatalog(p.id) }, "✕")), renderProductCard("cat-" + p.id))
          )), filteredProducts.length === 0 && (
            /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 text-sm text-stone-400 text-center" }, "Geen producten gevonden.")
          )), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-1" }, filteredProducts.length, " van ", products.length, " producten · A–Z"))
        )))
  );

  const renderDateSheet = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDateSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, "Kies een datum"), /*#__PURE__*/React.createElement("button", { "onClick": () => setDateSheetOpen(false), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-0.5" }, days.map((d) => (
              /*#__PURE__*/React.createElement("div", { "key": d, "className": "text-[10px] text-stone-400 text-center font-medium" }, d.slice(0, 2))
            ))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-3" }, weekKeys.map((k) => (
              /*#__PURE__*/React.createElement("div", { "key": k, "className": `flex flex-col items-center justify-center py-1.5 rounded-lg text-xs ${
                  k === todayKey ? "bg-emerald-600 text-white font-bold" : "bg-stone-100 text-stone-700 font-semibold"
                }` }, Number(k.slice(8, 10)))
            ))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2 mb-2" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset((o) => o - 1), "className": "px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white" }, "◀ Vorige week"), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-600" }, weekLabel), /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset((o) => o + 1), "className": "px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white" }, "Volgende week ▶")), weekOffset !== 0 && (
            /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset(0), "className": "w-full mb-2 py-1.5 border rounded-lg text-xs text-stone-500 bg-white" }, "Naar deze week")
          ), /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, MONTH_NAMES[calAnchor.getMonth()], " ", calAnchor.getFullYear()), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-0.5" }, days.map((d) => (
              /*#__PURE__*/React.createElement("div", { "key": d, "className": "text-[10px] text-stone-400 text-center font-medium" }, d.slice(0, 2))
            ))), calWeeks.map((row, wi) => (
            /*#__PURE__*/React.createElement("div", { "key": wi, "className": "grid grid-cols-7 gap-0.5" }, row.map((cell) => {
                const entry = menuByDate[cell.key];
                const r = entry && entry.id ? byId[entry.id] : null;
                const locked = !!(entry && entry.locked);
                const isToday = cell.key === todayKey;
                const inWeek = weekKeys.includes(cell.key);
                return (
                  /*#__PURE__*/React.createElement("button", { "key": cell.key, "data-date": cell.key, "title": r ? r.name : "", "onClick": () => setWeekOffset(weeksBetween(new Date(), cell.date, settings.weekStartDay)), "className": `flex flex-col items-center justify-center py-1 rounded-lg text-xs ${
                      isToday
                        ? "bg-emerald-600 text-white font-bold"
                        : inWeek
                          ? "bg-stone-100 font-semibold " + (cell.inMonth ? "text-stone-700" : "text-stone-300")
                          : cell.inMonth
                            ? "text-stone-700"
                            : "text-stone-300"
                    }` }, cell.date.getDate(), locked && /*#__PURE__*/React.createElement("span", { "className": "text-[10px]" }, "🔒"))
                );
              }))
          )), /*#__PURE__*/React.createElement("p", { "className": "text-xs text-stone-400 mt-2" }, "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard."))))
  );

  // #42: afwijkings-sheet (🪫 op de dag van vandaag) — segmented afhaalmaaltijd / instant uit voorraad
  const renderDeviationSheet = () => {
    const k = deviationKey;
    if (!k) return null;
    const links = settings.takeawayLinks || [];
    const inst = instantProducts;
    const totalPicked = Object.values(devPick).reduce((a, b) => a + (Number(b) || 0), 0);
    return (
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDeviationKey(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, "Afwijking · ", dayShortOf(k), " ", fmtDay(k)), /*#__PURE__*/React.createElement("button", { "onClick": () => setDeviationKey(null), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "segl mb-3" }, /*#__PURE__*/React.createElement("button", { "className": devTab === "instant" ? "on" : "", "onClick": () => setDevTab("instant") }, "⚡ Instant uit voorraad"), /*#__PURE__*/React.createElement("button", { "className": devTab === "afhaal" ? "on" : "", "onClick": () => setDevTab("afhaal") }, "🍔 Afhaalmaaltijd")), devTab === "instant" ? (
              /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1 flex items-center gap-1" }, /*#__PURE__*/React.createElement("span", null, "Kies uit de voorraad"), /*#__PURE__*/React.createElement("span", { "title": "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond." }, "ℹ️")), inst.length === 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 py-2" }, "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.")
                ), inst.map((p2) => {
                  const have = haveOfProd(p2);
                  const n = Number(devPick[p2.id]) || 0;
                  return (
                    /*#__PURE__*/React.createElement("div", { "key": p2.id, "className": "flex items-center gap-2 py-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm truncate" }, p2.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0" }, "have ", have), /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setDevPick((d) => ({ ...d, [p2.id]: Math.max(0, n - 1) })) }, "−"), /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("button", { "onClick": () => setDevPick((d) => ({ ...d, [p2.id]: Math.min(have, n + 1) })) }, "+")))
                  );
                }), /*#__PURE__*/React.createElement("button", { "className": "w-full mt-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40", "disabled": totalPicked === 0, "onClick": () => {
                    const parts = inst.filter((p2) => Number(devPick[p2.id]) > 0).map((p2) => `${devPick[p2.id]}× ${p2.name}`);
                    applyDeviation(k, "Instant-maaltijd: " + parts.join(", "), devPick);
                    setDeviationKey(null);
                  } }, "Bevestig · weekplan schuift 1 dag op"))
            ) : (
              /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1" }, "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):"), links.length === 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 py-2" }, "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.")
                ), links.map((l) => (
                  /*#__PURE__*/React.createElement("button", { "key": l.id, "className": "w-full flex items-center gap-2 border rounded-xl px-3 py-2 mb-2 text-left", "onClick": () => {
                      const url = safeExternalUrl(l.url);
                      if (url && typeof window !== "undefined" && window.open) window.open(url, "_blank", "noopener");
                      applyDeviation(k, "Afhaalmaaltijd", null);
                      setDeviationKey(null);
                    } }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm text-emerald-700 font-medium truncate" }, l.label), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0 max-w-40 truncate" }, l.url), /*#__PURE__*/React.createElement("span", { "className": "shrink-0" }, "↗"))
                )), /*#__PURE__*/React.createElement("button", { "className": "w-full mt-1 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold", "onClick": () => { applyDeviation(k, "Afhaalmaaltijd", null); setDeviationKey(null); } }, "Afhaalmaaltijd · weekplan schuift 1 dag op"))
            ))))
    );
  };

  const renderRulesSheet = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setRulesSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, "Regels voor het weekmenu"), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Weekstart"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, DAY_NAMES.map((d, i) => (
                /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () => updateSettings({ weekStartDay: i }), "className": `chip${settings.weekStartDay === i ? " on" : ""}` }, d.slice(0, 2))
              )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Visdagen"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, days.map((d, i) => (
                /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () =>
                    updateSettings({
                      fishDays: fishDays.includes(i) ? fishDays.filter((x) => x !== i) : [...fishDays, i].sort((a, b) => a - b),
                    })
                  , "className": `chip fish${fishDays.includes(i) ? " on" : ""}` }, d.slice(0, 2))
              )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Vega-dagen op de overige ", otherDays.length, " dagen"), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.max(0, vegaCount - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, vegaCount), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.min(otherDays.length, vegaCount + 1) }) }, "+")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, vegaCount, " vega · ", otherDays.length - vegaCount, " vlees"))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Tag-regels (bij automatisch plannen)"), (settings.tagRules || []).length === 0 && /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mb-1" }, "nog geen tag-regels"), (settings.tagRules || []).map((rule, i) => (
              /*#__PURE__*/React.createElement("div", { "key": i, "className": "flex items-center gap-2 mb-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "chip" }, rule.kind === "product" ? "🏷️" : "🍽️", " ", rule.tag), /*#__PURE__*/React.createElement("div", { "className": "stepctrl" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setTagRuleDays(i, rule.days - 1), "disabled": rule.days <= 0 }, "−"), /*#__PURE__*/React.createElement("span", null, rule.days), /*#__PURE__*/React.createElement("button", { "onClick": () => setTagRuleDays(i, rule.days + 1), "disabled": rule.days >= 30 }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0" }, "dagen"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-300 hover:text-red-500 text-sm", "onClick": () => removeTagRule(i), "title": "Regel verwijderen" }, "✕"))
            )), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1.5 mt-2" }, /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1.5 py-1.5 text-xs text-stone-600 shrink-0", "value": ruleDraft.kind, "onChange": (e) => setRuleDraft({ ...ruleDraft, kind: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "product" }, "🏷️ product"), /*#__PURE__*/React.createElement("option", { "value": "recipe" }, "🍽️ gerecht")), /*#__PURE__*/React.createElement("input", { "className": "w-full min-w-0 border rounded-lg px-2 py-1.5 text-xs", "value": ruleDraft.tag, "placeholder": "tag…", "list": "tagrules-tags", "onChange": (e) => setRuleDraft({ ...ruleDraft, tag: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addTagRule(); } } }), /*#__PURE__*/React.createElement("datalist", { "id": "tagrules-tags" }, allRuleTags.map((t) => (/*#__PURE__*/React.createElement("option", { "key": t, "value": t })))), /*#__PURE__*/React.createElement("div", { "className": "stepctrl shrink-0" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setRuleDraft({ ...ruleDraft, days: Math.max(0, ruleDraft.days - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, ruleDraft.days), /*#__PURE__*/React.createElement("button", { "onClick": () => setRuleDraft({ ...ruleDraft, days: Math.min(30, ruleDraft.days + 1) }) }, "+")), /*#__PURE__*/React.createElement("button", { "className": "px-2.5 py-1.5 border rounded-lg text-xs text-stone-600 bg-white shrink-0", "onClick": addTagRule, "title": "Regel toevoegen" }, "＋"))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Hetzelfde gerecht opnieuw plannen na"), /*#__PURE__*/React.createElement("div", { "className": "segl" }, [[0, "altijd"], [3, "3 dagen"], [7, "7 dagen"], [14, "14 dagen"], [30, "30 dagen"]].map(([v, label]) => (
                /*#__PURE__*/React.createElement("button", { "key": v, "className": Math.min(30, Math.max(0, Number(settings.dishRepeatDays) || 0)) === v ? "on" : "", "onClick": () => updateSettings({ dishRepeatDays: v }) }, label)
              )))), /*#__PURE__*/React.createElement("button", { "onClick": () => { setRulesSheetOpen(false); setTab("settings"); }, "className": "block text-xs text-emerald-700 font-medium mb-3" }, "Eters & supermarkten → Instellingen"), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium" }, "Klaar"))))
  );

  return (
    /*#__PURE__*/React.createElement("div", { "className": "min-h-screen bg-stone-50 text-stone-800", "data-theme": settings.theme }, /*#__PURE__*/React.createElement("div", { "className": "mx-auto max-w-2xl px-4 pb-16" }, /*#__PURE__*/React.createElement("header", { "className": "pt-6 pb-3 flex items-center justify-between" }, /*#__PURE__*/React.createElement("h1", { "className": "text-2xl font-bold" }, "Weekmenu & Boodschappen"), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, settings.householdSize + " eters")), /*#__PURE__*/React.createElement("nav", { "className": "flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 sticky top-2 z-10" }, tabs.map((t) => (
            /*#__PURE__*/React.createElement("button", { "key": t.key, "onClick": () => goTab(t.key), "title": t.label, "aria-label": t.label, "className": `tabbtn ${tab === t.key ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"}` }, /*#__PURE__*/React.createElement("span", { "className": "tabicon" }, t.icon), tab === t.key && /*#__PURE__*/React.createElement("span", { "className": "tablabel" }, t.label), t.key === "shopping" && totalItems > 0 && (
                /*#__PURE__*/React.createElement("span", { "className": "tabbadge", "title": `${doneItems} van ${totalItems} afgevinkt` }, `${doneItems}/${totalItems}`)
              ))
          ))), tab === "menu" && renderMenuTab(), tab === "recipes" && renderRecipesTab(), tab === "stock" && renderStockTab(), tab === "shopping" && renderShoppingTab(), tab === "settings" && renderSettingsTab(), tab === "settings" && renderDelenSheets(), tab === "menu" && dateSheetOpen && renderDateSheet(), tab === "menu" && rulesSheetOpen && renderRulesSheet(), tab === "menu" && deviationKey && renderDeviationSheet()))
  );
}


