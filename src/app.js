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
};

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
    .map((l) => ({ id: String(l.id), name: String(l.name) }));
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
      };
    });
}
function normalizeExtras(arr) {
  return (arr || [])
    .map((x) => (typeof x === "string" ? { name: x, cat: "" } : { name: String((x && x.name) || ""), cat: (x && x.cat) || "" }))
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
  const [tab, setTab] = useState("menu");
  const [menuByDate, setMenuByDate] = useState((stored && stored.menuByDate) || {}); // per datum (YYYY-MM-DD): {id, locked}
  const [weekOffset, setWeekOffset] = useState(0); // 0 = week van vandaag; bij openen start de app automatisch in de huidige week
  const [recipes, setRecipes] = useState(() => loadRecipes(stored)); // bewerkbare receptenpool (ADR-006)
  const [newRecipe, setNewRecipe] = useState({ name: "", cat: "vega", timeCat: "normaal", tags: [], tagDraft: "", ingredients: "", bereiding: "" });
  const [checked, setChecked] = useState((stored && stored.checked) || {});
  const [extraItems, setExtraItems] = useState(() => normalizeExtras(stored && stored.extraItems));
  const [newItem, setNewItem] = useState("");
  const [newItemCat, setNewItemCat] = useState("");
  const [stockLocations, setStockLocations] = useState(() => normalizeLocations(stored && stored.stockLocations));
  const [stock, setStock] = useState(() =>
    stored && Array.isArray(stored.stock) && stored.stock.length > 0
      ? normalizeStock(stored.stock, normalizeLocations(stored && stored.stockLocations))
      : defaultStock()
  );
  // voorraad-tab (ADR-015): uitklapbare locaties, edit-modus, formulieren, info-popover
  const [openLocs, setOpenLocs] = useState({}); // locatie-id -> true; start altijd ingeklapt
  const [editLoc, setEditLoc] = useState(null); // locatie-id in edit-modus (gewenst aanpasbaar)
  const [addLocOpen, setAddLocOpen] = useState(false);
  const [newLocName, setNewLocName] = useState("");
  const [addProdLoc, setAddProdLoc] = useState(null); // locatie-id met open product-formulier
  const [newProd, setNewProd] = useState({ name: "", cat: "", market: "", want: 1 });
  const [stockInfoOpen, setStockInfoOpen] = useState(false);
  // boodschappen-tab (ADR-015): categorie-volgorde, categorieën beheren, info-popover
  const [shopInfoOpen, setShopInfoOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [settings, setSettings] = useState(() => normalizeSettings(stored && stored.settings)); // per huishouden, lokaal bewaard (ADR-009)
  // boodschappenlijst van vandaag (ADR-016): aantal dagen + supermarktkeuze zijn vluchtig (worden niet opgeslagen)
  const [shopDays, setShopDays] = useState(null); // null = default min(4, max aaneengesloten gelockte dagen)
  const [shopMarkets, setShopMarkets] = useState(null); // null = default uit settings (defaultShop per winkel)
  const [shopDone, setShopDone] = useState(false); // "Klaar met winkelen" geklikt -> melding tonen
  const [openRecipe, setOpenRecipe] = useState(null);
  // weekmenu-tab v2 (ADR-012): datum-sheet, regels-sheet, eters per dag, getypte invoer
  const [dateSheetOpen, setDateSheetOpen] = useState(false);
  const [rulesSheetOpen, setRulesSheetOpen] = useState(false);
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
  const [tagDraft, setTagDraft] = useState(""); // tag-invoer bij het openstaande bewerkte recept
  const [daySheetRecipe, setDaySheetRecipe] = useState(null); // recept waarvoor de dagkiezer (deze week) open is
  const [weekToast, setWeekToast] = useState(""); // melding na toevoegen aan het weekmenu

  useEffect(() => {
    saveState({ menuByDate, recipes, checked, extraItems, settings, stock, stockLocations });
  }, [menuByDate, recipes, checked, extraItems, settings, stock, stockLocations]);

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
  // priceKey -> { cat, market } uit voorraadproducten en extra artikelen; receptingrediënten
  // erven zo de categorie/winkel van een bekend product met dezelfde naam.
  const catMap = useMemo(() => {
    const m = new Map();
    stock.forEach((s) => {
      const k = priceKey(s.name);
      if (k && !m.has(k)) m.set(k, { cat: s.cat, market: s.market });
    });
    extraItems.forEach((x) => {
      const k = priceKey(x.name);
      if (k && x.cat && !m.has(k)) m.set(k, { cat: x.cat, market: null });
    });
    return m;
  }, [stock, extraItems]);
  const catOf = (label) => {
    const e = catMap.get(priceKey(label));
    return e ? e.cat : null;
  };
  const marketOf = (label) => {
    const e = catMap.get(priceKey(label));
    return e && e.market ? e.market : null;
  };
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
  function addProduct(locId) {
    const name = newProd.name.trim();
    if (!name || !newProd.cat) return;
    setStock([...stock, { name, loc: locId, cat: newProd.cat, market: newProd.market || null, want: newProd.want, have: newProd.want }]);
    setNewProd({ name: "", cat: "", market: "", want: 1 });
    setAddProdLoc(null);
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
  function addExtra() {
    const name = newItem.trim();
    if (!name) return;
    setExtraItems([...extraItems, { name, cat: newItemCat }]);
    setNewItem("");
    setNewItemCat("");
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

  function generateMenu() {
    const pool = (cat) => shuffle(recipes.filter((r) => r.cat === cat && (r.ingredients || []).filter(Boolean).length > 0).map((r) => r.id));
    const next = Array(7).fill(null);

    // Vis-dagen uit de instellingen
    const fish = pool("vis");
    fishDays.forEach((d, i) => {
      if (fish[i]) next[d] = { id: fish[i], locked: false };
    });

    // Overige dagen: vega/vlees volgens vegaTarget (vlees = overige dagen minus vega, >= 0)
    const chosen = [];
    chosen.push(...pool("vega").slice(0, vegaCount).map((id) => ({ id })));
    chosen.push(...pool("vlees").slice(0, otherDays.length - vegaCount).map((id) => ({ id })));
    const rest = shuffle(
      recipes
        .filter((r) => (r.cat === "vega" || r.cat === "vlees") && (r.ingredients || []).filter(Boolean).length > 0)
        .map((r) => r.id)
    );
    for (const id of rest) {
      if (chosen.length >= otherDays.length) break;
      if (!chosen.some((c) => c.id === id)) chosen.push({ id });
    }
    otherDays.forEach((d, i) => {
      if (chosen[i]) next[d] = { id: chosen[i].id, locked: false };
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
        ingredients: newRecipe.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        bereiding: newRecipe.bereiding.trim(),
      }),
    ]);
    setNewRecipe({ name: "", cat: "vega", timeCat: "normaal", tags: [], tagDraft: "", ingredients: "", bereiding: "" });
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
          setRecipes(arr.map((r) => normalizeRecipe({ ingredients: [], bereiding: "", ...r })));
        }
      } catch (e) {}
    };
    reader.readAsText(file);
  }

  function resetRecipes() {
    if (window.confirm("Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?")) {
      setRecipes(BASE_RECIPES.map((r) => normalizeRecipe({ ...r })));
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
  const marketVisible = (label) => {
    const m = marketOf(label);
    return !m || shopMarketsEff.includes(m);
  };
  const shoppingRows = useMemo(() => {
    const rows = [];
    scopeKeys.slice(0, shopDaysEff).forEach((k) => {
      const entry = menuByDate[k];
      if (!entry || !entry.id) return;
      const r = byId[entry.id];
      if (!r) return;
      (r.ingredients || []).filter(Boolean).forEach((ing) => {
        rows.push({ key: `${k}-${r.id}-${ing}`, dayKey: k, label: ing, recipe: r.name });
      });
    });
    return rows;
  }, [menuByDate, byId, scopeKeys, shopDaysEff]);

  const activeMenuIds = weekEntries.filter(Boolean).map((d) => d.id);
  // recepten-tab: zoeken/filteren (ADR-013) — alle filters combineren met AND
  const rq = recipeQuery.trim().toLowerCase();
  const ingQ = ingFilter.trim().toLowerCase();
  const hasRecipeFilters = !!rq || timeFilter !== "alle" || !!ingQ || tagFilters.length > 0;
  const filteredRecipes = recipes.filter((r) => {
    if (rq && !r.name.toLowerCase().includes(rq)) return false;
    if (timeFilter !== "alle" && (r.timeCat || "normaal") !== timeFilter) return false;
    if (ingQ && !(r.ingredients || []).some((x) => String(x).toLowerCase().includes(ingQ))) return false;
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
  const renderRecipeRow = (r) => {
    const inMenu = activeMenuIds.includes(r.id);
    const isOpen = openRecipe === r.id;
    return (
      /*#__PURE__*/React.createElement("div", { "key": r.id, "className": "bg-white rounded-xl shadow-sm overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "onClick": () => { setOpenRecipe(isOpen ? null : r.id); setTagDraft(""); }, "className": "flex-1 text-left min-w-0" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2" }, /*#__PURE__*/React.createElement("span", { "className": "font-medium text-sm" }, r.name, inMenu && /*#__PURE__*/React.createElement("span", { "className": "ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full" }, "deze week"), (r.ingredients || []).filter(Boolean).length === 0 && (
                  /*#__PURE__*/React.createElement("span", { "className": "ml-1.5 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full" }, "geen ingredienten bekend")
                )), /*#__PURE__*/React.createElement("span", { "className": "text-stone-400 text-xs shrink-0" }, isOpen ? "▴" : "▾")), /*#__PURE__*/React.createElement("div", { "className": "metarow" }, /*#__PURE__*/React.createElement("span", { "className": `text-[10px] px-1.5 rounded ${CAT_STYLE[r.cat]}` }, CAT_LABEL[r.cat]), /*#__PURE__*/React.createElement("span", { "className": `tb tb-${r.timeCat || "normaal"}` }, TIME_LABEL[r.timeCat || "normaal"]), (r.tags || []).map((t) => (
                /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t)
              )))), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": "Toevoegen aan een onvergrendelde dag van deze week", "onClick": () => setDaySheetRecipe(r) }, "📅")), isOpen && (
          /*#__PURE__*/React.createElement("div", { "className": "px-3 pb-3 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mt-3" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Naam"), /*#__PURE__*/React.createElement("input", { "value": r.name, "onChange": (e) => updateRecipe(r.id, { name: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5" })), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Categorie"), /*#__PURE__*/React.createElement("select", { "value": r.cat, "onChange": (e) => updateRecipe(r.id, { cat: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5" }, ["vega", "vis", "vlees", "extra"].map((c) => (
                    /*#__PURE__*/React.createElement("option", { "key": c, "value": c }, CAT_LABEL[c])
                  ))))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereidingstijd"), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, TIME_CATS.map((t) => (
                  /*#__PURE__*/React.createElement("button", { "key": t, "className": (r.timeCat || "normaal") === t ? "on" : "", "onClick": () => updateRecipe(r.id, { timeCat: t }) }, timeLabelCap(t))
                )))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Tags"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, (r.tags || []).map((t) => (
                  /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => removeRecipeTag(r.id, t) }, "×"))
                ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": tagDraft, "placeholder": "＋ tag toevoegen…", "onChange": (e) => setTagDraft(e.target.value), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addRecipeTag(r.id); } } }), /*#__PURE__*/React.createElement("button", { "onClick": () => addRecipeTag(r.id) }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Ingrediënten (één per regel)"), /*#__PURE__*/React.createElement("textarea", { "rows": Math.max((r.ingredients || []).filter(Boolean).length, 1) + 1, "value": (r.ingredients || []).join("\n"), "onChange": (e) => updateRecipe(r.id, { ingredients: e.target.value.split("\n") }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" })), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereiding"), /*#__PURE__*/React.createElement("textarea", { "rows": 4, "value": r.bereiding ?? "", "onChange": (e) => updateRecipe(r.id, { bereiding: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" })), /*#__PURE__*/React.createElement("button", { "onClick": () => deleteRecipe(r.id), "className": "mt-2 text-xs text-red-500 hover:underline" }, "Recept verwijderen"))
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
      if (marketVisible(r.label)) rows.push({ ...r, src: "ing" });
    });
    extraItems.forEach((x) => {
      if (marketVisible(x.name)) rows.push({ key: "extra-" + x.name, src: "extra", label: x.name, dayKey: null });
    });
    stockShort.forEach((s) => {
      const m = s.market || marketOf(s.name);
      if (m && !shopMarketsEff.includes(m)) return;
      rows.push({
        key: "stock-" + s.name,
        src: "stock",
        label: s.name,
        dayKey: null,
        note: s.want > 1 ? `(${s.want - s.have} van ${s.want})` : "",
      });
    });
    return sortRowsByCat(rows, (x) => x.label);
  }, [shoppingRows, extraItems, stockShort, shopMarketsEff]);
  const totalItems = listRows.length;
  const doneItems = listRows.filter((r) => checked[r.key]).length;
  // Gerechtstatus per dag in scope (ADR-016), over de zichtbare ingrediënten: alles gecheckt -> ✅,
  // iets gecheckt -> ❗, niets gecheckt -> geen icoon. Zichtbaar in het weekmenu bij die datum.
  const mealStatus = useMemo(() => {
    const st = {};
    scopeKeys.slice(0, shopDaysEff).forEach((k) => {
      const entry = menuByDate[k];
      if (!entry || !entry.id) return;
      const rowsK = shoppingRows.filter((r) => r.dayKey === k && marketVisible(r.label));
      if (!rowsK.length) return;
      const doneK = rowsK.filter((r) => checked[r.key]).length;
      if (doneK === rowsK.length) st[k] = { icon: "\u2705", title: "Alle ingrediënten van dit gerecht zijn in huis" };
      else if (doneK > 0) st[k] = { icon: "\u2757", title: `${rowsK.length - doneK} van de ${rowsK.length} ingrediënten mist nog` };
    });
    return st;
  }, [menuByDate, scopeKeys, shopDaysEff, shoppingRows, shopMarketsEff, checked]);
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

  const tabs = [
    { key: "menu", label: "Weekmenu" },
    { key: "recipes", label: "Recepten" },
    { key: "stock", label: "Voorraad" },
    { key: "shopping", label: `Boodschappen${totalItems ? ` (${doneItems}/${totalItems})` : ""}` },
    { key: "settings", label: "Instellingen" },
  ];

  return (
    /*#__PURE__*/React.createElement("div", { "className": "min-h-screen bg-stone-50 text-stone-800" }, /*#__PURE__*/React.createElement("div", { "className": "mx-auto max-w-2xl px-4 pb-16" }, /*#__PURE__*/React.createElement("header", { "className": "pt-6 pb-3 flex items-center justify-between" }, /*#__PURE__*/React.createElement("h1", { "className": "text-2xl font-bold" }, "Weekmenu & Boodschappen"), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, settings.householdSize + " eters")), /*#__PURE__*/React.createElement("nav", { "className": "flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 sticky top-2 z-10" }, tabs.map((t) => (
            /*#__PURE__*/React.createElement("button", { "key": t.key, "onClick": () => goTab(t.key), "className": `flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"
              }` }, t.label)
          ))), tab === "menu" && (
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
                  /*#__PURE__*/React.createElement("div", { "key": key, "className": `rounded-xl shadow-sm p-3 ${isToday ? "bg-emerald-100" : "bg-white"}` }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "w-20 shrink-0" }, /*#__PURE__*/React.createElement("div", { "className": `text-sm font-semibold ${isToday ? "text-emerald-700" : ""}` }, day), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400" }, fmtDay(key), isToday ? " · vandaag" : "")), /*#__PURE__*/React.createElement("div", { "className": "flex-1 min-w-0 suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "dish-input", "value": text, "placeholder": "Typ een gerecht…", "onChange": (e) => {
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
                      ), /*#__PURE__*/React.createElement("button", { "title": entry && entry.locked ? "Ontgrendelen" : "Vergrendelen", "onClick": () => entry && setDay(i, { ...entry, locked: !entry.locked }), "className": `shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center ${entry && entry.locked ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"}` }, entry && entry.locked ? "🔒" : "🔓")), eatersOpen === key && entry && !isCustom && (
                      /*#__PURE__*/React.createElement("div", { "className": "mt-2 pt-2 border-t flex items-center gap-2 flex-wrap" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.max(1, effectiveEaters - 1)) }, "−"), /*#__PURE__*/React.createElement("span", null, effectiveEaters), /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.min(99, effectiveEaters + 1)) }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500" }, "standaard: ", settings.householdSize, " eters"), /*#__PURE__*/React.createElement("button", { "className": "text-xs text-emerald-700 font-semibold", "onClick": () => setEaters(i, null) }, "Standaard herstellen"), factor !== 1 && (
                          /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 ml-auto" }, "boodschappenlijst ×", fmtFactor(factor), " voor deze dag")
                        ))
                    ))
                );
              })), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(true), "className": "w-full mt-4 py-2.5 border rounded-xl text-sm font-medium text-stone-600 bg-white shadow-sm" }, "⚙️ Regels voor het weekmenu"))
        ), tab === "recipes" && (
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
              ), /*#__PURE__*/React.createElement("button", { "className": "chip", "style": { marginLeft: "auto" }, "onClick": () => setFilterSheetOpen(true) }, "⚙ Filters ▾")), hasRecipeFilters && (
              /*#__PURE__*/React.createElement("div", { "className": "afilterrow" }, rq !== "" && (
                  /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🔍 “${recipeQuery.trim()}” `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setRecipeQuery("") }, "×"))
                ), timeFilter !== "alle" && (
                  /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `⏱ ${TIME_LABEL[timeFilter]} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setTimeFilter("alle") }, "×"))
                ), ingQ !== "" && (
                  /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🥘 ${ingFilter.trim()} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setIngFilter("") }, "×"))
                ), tagFilters.map((t) => (
                  /*#__PURE__*/React.createElement("span", { "key": t, "className": "afilter" }, `🏷 ${t} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => toggleTagFilter(t) }, "×"))
                )), /*#__PURE__*/React.createElement("button", { "className": "clearall", "onClick": clearRecipeFilters }, "Alles wissen"), /*#__PURE__*/React.createElement("span", { "className": "count" }, `${filteredRecipes.length} van ${recipes.length} recepten`))
            ), !hasRecipeFilters && ["vega", "vis", "vlees", "extra"].map((c) => {
              const list = recipes.filter((r) => r.cat === c).sort((a, b) => a.name.localeCompare(b.name, "nl"));
              if (!list.length) return null;
              return (
                /*#__PURE__*/React.createElement("div", { "key": c, "className": "mb-4" }, /*#__PURE__*/React.createElement("div", { "className": `inline-block px-2 py-0.5 rounded-full text-sm font-semibold mb-2 ${CAT_STYLE[c]}` }, CAT_LABEL[c]), /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, list.map((r) => renderRecipeRow(r))))
              );
            }), hasRecipeFilters && (
              /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, [...filteredRecipes].sort((a, b) => a.name.localeCompare(b.name, "nl")).map((r) => renderRecipeRow(r)))
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
                        ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": newRecipe.tagDraft, "placeholder": "＋ tag toevoegen…", "onChange": (e) => setNewRecipe({ ...newRecipe, tagDraft: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } } }), /*#__PURE__*/React.createElement("button", { "onClick": addNewTag }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Ingrediënten (één per regel)"), /*#__PURE__*/React.createElement("textarea", { "rows": 3, "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.ingredients, "placeholder": "Ingrediënten, één per regel…", "onChange": (e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value }) })), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Bereiding (optioneel)"), /*#__PURE__*/React.createElement("textarea", { "rows": 2, "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.bereiding, "placeholder": "Bereiding…", "onChange": (e) => setNewRecipe({ ...newRecipe, bereiding: e.target.value }) })), /*#__PURE__*/React.createElement("button", { "className": "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm", "onClick": addRecipe }, "Toevoegen"))))
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
        ), tab === "stock" && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, "Locaties"), /*#__PURE__*/React.createElement("span", { "className": "relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${stockInfoOpen ? " on" : ""}`, "title": "Hoe werkt de voorraad?", "onClick": () => setStockInfoOpen((v) => !v) }, "ℹ️"), stockInfoOpen && (
                  /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, "Hoe werkt de voorraad?"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen."), /*#__PURE__*/React.createElement("li", null, "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕)."), /*#__PURE__*/React.createElement("li", null, "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan."), /*#__PURE__*/React.createElement("li", null, "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst."), /*#__PURE__*/React.createElement("li", null, "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.")))
                ))), stockLocations.map((loc) => {
              const items = productsOf(loc.id);
              const open = !!openLocs[loc.id];
              const editing = editLoc === loc.id;
              return (
                /*#__PURE__*/React.createElement("div", { "key": loc.id, "className": "bg-white rounded-xl shadow-sm mb-3 overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "className": "text-stone-400 text-xs w-4 shrink-0", "title": open ? "Inklappen" : "Uitklappen", "onClick": () => toggleLoc(loc.id) }, open ? "▾" : "▸"), /*#__PURE__*/React.createElement("button", { "className": "flex-1 text-left min-w-0 font-medium text-sm truncate", "onClick": () => toggleLoc(loc.id) }, loc.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0", "title": `${items.length} ${items.length === 1 ? "product" : "producten"}` }, items.length), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${editing ? " on" : ""}`, "title": editing ? "Gewenste hoeveelheden niet meer bewerken" : "Gewenste hoeveelheden in deze locatie bewerken", "onClick": () => setEditLoc(editing ? null : loc.id) }, "✏️"), /*#__PURE__*/React.createElement("button", { "className": `delbtn${items.length ? " dis" : ""}`, "disabled": items.length > 0, "title": items.length ? "Verwijderen kan pas als er geen producten meer aan deze locatie hangen" : "Locatie verwijderen", "onClick": () => deleteLocation(loc.id) }, "🗑️")), open && (
                    /*#__PURE__*/React.createElement("div", { "className": "border-t border-stone-100" }, addProdLoc === loc.id && (
                        /*#__PURE__*/React.createElement("div", { "className": "p-3 border-b border-stone-100 bg-stone-50" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Naam"), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newProd.name, "placeholder": "Bijv. hagelslag…", "onChange": (e) => setNewProd({ ...newProd, name: e.target.value }) })), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mb-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Categorie"), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": newProd.cat, "onChange": (e) => setNewProd({ ...newProd, cat: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "Kies categorie…"), shopCats.map((c) => (
                                  /*#__PURE__*/React.createElement("option", { "key": c, "value": c }, c)
                                )))), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Supermarkt (optioneel)"), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": newProd.market, "onChange": (e) => setNewProd({ ...newProd, market: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "geen voorkeur"), markets.map((m) => (
                                  /*#__PURE__*/React.createElement("option", { "key": m.key, "value": m.key }, m.label)
                                ))))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, "Gewenste voorraad"), /*#__PURE__*/React.createElement("div", { "className": "stepper mt-0.5" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProd({ ...newProd, want: Math.max(0, newProd.want - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, newProd.want), /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProd({ ...newProd, want: newProd.want + 1 }) }, "+"))), /*#__PURE__*/React.createElement("button", { "className": `w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 rounded-xl text-sm${newProd.name.trim() && newProd.cat ? "" : " opacity-40"}`, "disabled": !newProd.name.trim() || !newProd.cat, "onClick": () => addProduct(loc.id) }, "Toevoegen"))
                      ), /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100" }, items.map((s) => {
                          const tekort = s.have < s.want;
                          return (
                            /*#__PURE__*/React.createElement("div", { "key": s.i, "className": "flex items-center gap-2 px-3 py-2 flex-wrap" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm" }, s.name, /*#__PURE__*/React.createElement("span", { "className": "block text-[10px] text-stone-400" }, `categorie: ${s.cat}`)), /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": "Huidige voorraad" }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": `w-6 text-center text-sm font-medium ${tekort ? "text-orange-600" : "text-stone-700"}` }, s.have), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, 1) }, "+")), editing ? (
                                /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": "Gewenste voorraad aanpassen" }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": "w-6 text-center text-sm font-medium text-stone-700" }, s.want), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, 1) }, "+"))
                              ) : (
                                /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 whitespace-nowrap" }, `gewenst ${s.want}`)
                              ), s.market && /*#__PURE__*/React.createElement("span", { "className": "chip mkt", "title": "Winkelvoorkeur" }, marketChip(s.market)), tekort && /*#__PURE__*/React.createElement("span", { "className": "text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap" }, "op lijst"), /*#__PURE__*/React.createElement("button", { "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Product verwijderen", "onClick": () => deleteProduct(s.i) }, "✕"))
                          );
                        }), items.length === 0 && (
                          /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 text-sm text-stone-400 text-center" }, "Nog geen producten in deze locatie.")
                        )), /*#__PURE__*/React.createElement("button", { "className": "addrow", "onClick": () => setAddProdLoc(addProdLoc === loc.id ? null : loc.id) }, "＋ Product toevoegen"))
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
        ), tab === "shopping" && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, `Boodschappenlijst · ${todayLabel}`), /*#__PURE__*/React.createElement("span", { "className": "flex gap-1.5 relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${shopInfoOpen ? " on" : ""}`, "title": "Hoe werkt de boodschappenlijst?", "onClick": () => setShopInfoOpen((v) => !v) }, "ℹ️"), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${catsOpen ? " on" : ""}`, "title": "Categorieën beheren", "onClick": () => setCatsOpen((v) => !v) }, "⚙️"), shopInfoOpen && (
                  /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, "Hoe werkt de boodschappenlijst?"), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet."), /*#__PURE__*/React.createElement("li", null, "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit."), /*#__PURE__*/React.createElement("li", null, "Afvinken maar. \"Klaar met winkelen\" toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug."), /*#__PURE__*/React.createElement("li", null, "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.")))
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
            ), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-3 mb-4 flex gap-2" }, /*#__PURE__*/React.createElement("input", { "value": newItem, "onChange": (e) => setNewItem(e.target.value), "placeholder": "Extra artikel toevoegen…", "className": "flex-1 border rounded-lg px-3 py-2 text-sm min-w-0", "onKeyDown": (e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addExtra();
                  }
                } }), /*#__PURE__*/React.createElement("select", { "value": newItemCat, "onChange": (e) => setNewItemCat(e.target.value), "className": "border rounded-lg px-2 py-2 text-sm text-stone-600", "title": "Categorie (bepaalt de plek in de lijst)" }, /*#__PURE__*/React.createElement("option", { "value": "" }, "geen categorie"), shopCats.map((c) => (
                  /*#__PURE__*/React.createElement("option", { "key": c, "value": c }, c)
                ))), /*#__PURE__*/React.createElement("button", { "onClick": addExtra, "className": "bg-stone-800 text-white px-4 rounded-lg text-sm font-medium shrink-0" }, "Toevoegen")), listRows.length === 0 && unfilteredCount > 0 && (
              /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10 bg-white rounded-xl shadow-sm" }, `Niets te halen bij ${shopMarketsEff.map((k) => marketChip(k)).join(", ") || "de geselecteerde supermarkt"}`, /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-1" }, "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt"), /*#__PURE__*/React.createElement("button", { "className": "chip on mt-2", "onClick": () => setShopMarkets(markets.map((m) => m.key)) }, "Toon alle supermarkten"))
            ), listRows.length === 0 && unfilteredCount === 0 && (
              /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10" }, "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.")
            ), listRows.length > 0 && (
              /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm divide-y divide-stone-100" }, listRows.map((r) => {
                  const entry = r.dayKey ? menuByDate[r.dayKey] : null;
                  const factor = entry && entry.eaters != null && settings.householdSize > 0 ? entry.eaters / settings.householdSize : 1;
                  const sc = r.src === "ing" ? scaleIngredient(r.label, factor) : null;
                  const mkt = r.src === "stock" ? (stockShort.find((s) => s.name === r.label) || {}).market || marketOf(r.label) : marketOf(r.label);
                  const cat = catOf(r.label);
                  const showDate = r.src === "ing" && (cat === "groente" || cat === "zuivel");
                  return (
                    /*#__PURE__*/React.createElement("label", { "key": r.key, "className": "flex items-center gap-3 px-3 py-2 cursor-pointer" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": !!checked[r.key], "onChange": (e) => setChecked({ ...checked, [r.key]: e.target.checked }), "className": "w-4 h-4 accent-emerald-600" }), /*#__PURE__*/React.createElement("span", { "className": `text-sm ${checked[r.key] ? "line-through text-stone-300" : ""}` }, sc ? (
                          /*#__PURE__*/React.createElement("span", null, /*#__PURE__*/React.createElement("span", { "className": "line-through text-stone-300" }, r.label), " → ", /*#__PURE__*/React.createElement("span", { "className": "font-semibold" }, sc))
                        ) : (
                          r.label
                        ), r.note && /*#__PURE__*/React.createElement("span", { "className": "text-stone-400" }, ` ${r.note}`), showDate && /*#__PURE__*/React.createElement("span", { "className": "datechip" }, `${dayShortOf(r.dayKey)} ${fmtDay(r.dayKey)}`)), mkt && (
                        /*#__PURE__*/React.createElement("span", { "className": "ml-auto chip mkt", "title": "Winkelvoorkeur: dit artikel wordt daar gehaald" }, marketChip(mkt))
                      ), r.src === "extra" && (
                        /*#__PURE__*/React.createElement("button", { "onClick": () => setExtraItems(extraItems.filter((x) => x.name !== r.label)), "className": "text-stone-300 hover:text-red-500 text-sm", "title": "Artikel verwijderen" }, "✕")
                      ))
                  );
                }))
            ), anyScaled && (
              /*#__PURE__*/React.createElement("p", { "className": "text-[10px] text-stone-400 mt-1" }, `Hoeveelheden geschaald voor afwijkende eters (×${scaledFactors.join(", ")} t.o.v. standaard ${settings.householdSize} eters); regels zonder getal blijven gelijk.`)
            ), totalItems > 0 && (
              /*#__PURE__*/React.createElement("div", { "className": "mt-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex gap-2" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setShopDone(true), "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm" }, "Klaar met winkelen"), /*#__PURE__*/React.createElement("button", { "onClick": () => {
                      setChecked({});
                      setShopDone(false);
                    }, "className": "py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "Vinkjes wissen")), shopDone && (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mt-2 text-center" }, mealOk + mealWarn > 0
                      ? `✅ ${mealOk} gerechten compleet${mealWarn > 0 ? ` · ❗ ${mealWarn} mist nog iets` : ""} — zie weekmenu (lijst blijft afvinkbaar)`
                      : "Nog niets afgevinkt — vink de gehaalde artikelen af.")
                ))
            ))
        ), tab === "settings" && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "mb-2 text-xs text-stone-500" }, "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (", days[0], ")."), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Huishouden"), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Aantal eters"), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "1", "value": settings.householdSize, "onChange": (e) => updateSettings({ householdSize: Math.max(1, Number(e.target.value) || 1) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" })), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Week start op"), /*#__PURE__*/React.createElement("select", { "value": settings.weekStartDay, "onChange": (e) => updateSettings({ weekStartDay: Number(e.target.value) }), "className": "border rounded-lg px-2 py-1.5 text-sm text-stone-600" }, DAY_NAMES.map((d, i) => (
                    /*#__PURE__*/React.createElement("option", { "key": d, "value": i }, d)
                  ))))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Eetpatroon"), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "Vis-dagen:"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-2 mb-3" }, days.map((d, i) => (
                  /*#__PURE__*/React.createElement("label", { "key": i, "className": "flex items-center gap-1 text-xs border rounded-lg px-2 py-1 cursor-pointer" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": fishDays.includes(i), "onChange": (e) =>
                        updateSettings({ fishDays: e.target.checked ? [...fishDays, i] : fishDays.filter((x) => x !== i) })
                      , "className": "accent-emerald-600" }), d)
                ))), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, "Aantal vega-dagen (op niet-vis-dagen)"), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "0", "max": "7", "value": settings.vegaTarget, "onChange": (e) => updateSettings({ vegaTarget: Math.max(0, Number(e.target.value) || 0) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" }))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, "Supermarkten"), markets.map((m, mi) => (
                /*#__PURE__*/React.createElement("div", { "key": mi, "className": "flex gap-2 mb-2" }, /*#__PURE__*/React.createElement("input", { "value": m.key, "onChange": (e) => updateMarket(mi, { key: e.target.value }), "placeholder": "sleutel…", "className": "w-20 border rounded-lg px-2 py-1.5 text-sm" }), /*#__PURE__*/React.createElement("input", { "value": m.label, "onChange": (e) => updateMarket(mi, { label: e.target.value }), "placeholder": "Naam…", "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" }), /*#__PURE__*/React.createElement("label", { "className": "flex items-center gap-1 text-[10px] text-stone-500 shrink-0 cursor-pointer", "title": "Standaard geselecteerd op de boodschappenlijst" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": m.defaultShop !== false, "onChange": (e) => updateMarket(mi, { defaultShop: e.target.checked }), "className": "accent-emerald-600" }), "standaard"), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: markets.filter((_, j) => j !== mi) }), "className": "text-stone-300 hover:text-red-500 text-sm px-1" }, "✕"))
              )), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: [...markets, { key: "winkel" + (markets.length + 1), label: "Nieuwe winkel", defaultShop: true }] }), "className": "w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white" }, "+ Supermarkt toevoegen")))
        ), tab === "menu" && dateSheetOpen && (
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
        ), tab === "menu" && rulesSheetOpen && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setRulesSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, "Regels voor het weekmenu"), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Weekstart"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, DAY_NAMES.map((d, i) => (
                      /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () => updateSettings({ weekStartDay: i }), "className": `chip${settings.weekStartDay === i ? " on" : ""}` }, d.slice(0, 2))
                    )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Visdagen"), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, days.map((d, i) => (
                      /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () =>
                          updateSettings({
                            fishDays: fishDays.includes(i) ? fishDays.filter((x) => x !== i) : [...fishDays, i].sort((a, b) => a - b),
                          })
                        , "className": `chip fish${fishDays.includes(i) ? " on" : ""}` }, d.slice(0, 2))
                    )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, "Vega-dagen op de overige ", otherDays.length, " dagen"), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.max(0, vegaCount - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, vegaCount), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.min(otherDays.length, vegaCount + 1) }) }, "+")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, vegaCount, " vega · ", otherDays.length - vegaCount, " vlees"))), /*#__PURE__*/React.createElement("button", { "onClick": () => { setRulesSheetOpen(false); setTab("settings"); }, "className": "block text-xs text-emerald-700 font-medium mb-3" }, "Eters & supermarkten → Instellingen"), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium" }, "Klaar"))))
        )))
  );
}


