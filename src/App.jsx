import React, { useEffect, useMemo, useState } from "react";

const DAYS = ["Zaterdag", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"];
const FISH_DAYS = [0, 4]; // zaterdag en woensdag = vis
const OTHER_DAYS = [1, 2, 3, 5, 6]; // de overige dagen: vega of vlees
const SHOP_RUNS = [
  { label: "Boodschappenlijst zaterdag", hint: "zaterdag t/m dinsdag", days: [0, 1, 2, 3] },
  { label: "Boodschappenlijst woensdag", hint: "woensdag t/m vrijdag", days: [4, 5, 6] },
];
const STOCK_CATS = [
  { key: "kast", label: "Voorraadkast" },
  { key: "koel", label: "Koelkast" },
  { key: "fruit", label: "Fruitmand" },
  { key: "kruiden", label: "Kruidenla" },
];
const STOCK_DEFAULT = [
  { name: "Hagelslag", cat: "kast", qty: 1 },
  { name: "Jam", cat: "kast", qty: 1 },
  { name: "Pindakaas", cat: "kast", qty: 1 },
  { name: "Appelstroop", cat: "kast", qty: 1 },
  { name: "Koffie", cat: "kast", qty: 1 },
  { name: "Thee", cat: "kast", qty: 1 },
  { name: "Suiker", cat: "kast", qty: 1 },
  { name: "Olijfolie", cat: "kast", qty: 1 },
  { name: "Toiletpapier", cat: "kast", qty: 2 },
  { name: "Melk", cat: "koel", qty: 2 },
  { name: "Boter", cat: "koel", qty: 1 },
  { name: "Kaas", cat: "koel", qty: 1 },
  { name: "Eieren", cat: "koel", qty: 1 },
  { name: "Brood", cat: "koel", qty: 1 },
  { name: "Appels", cat: "fruit", qty: 4 },
  { name: "Bananen", cat: "fruit", qty: 3 },
  { name: "Zout", cat: "kruiden", qty: 1 },
  { name: "Peper", cat: "kruiden", qty: 1 },
];
function defaultStock() {
  return STOCK_DEFAULT.map((d) => ({ name: d.name, cat: d.cat, want: d.qty, have: d.qty }));
}
function normalizeStock(arr) {
  return arr.map((s) => ({
    name: s.name,
    cat: s.cat,
    want: s.want ?? s.defaultQty ?? s.qty ?? 1,
    have: s.have ?? (s.qty === 0 ? 0 : s.want ?? s.defaultQty ?? s.qty ?? 1),
  }));
}
const CATS = ["vega", "vis", "vlees"];
const CAT_LABEL = { vega: "Vega", vis: "Vis", vlees: "Vlees", extra: "Extra" };
const CAT_STYLE = {
  vega: "bg-green-100 text-green-800",
  vis: "bg-blue-100 text-blue-800",
  vlees: "bg-red-100 text-red-800",
  extra: "bg-amber-100 text-amber-800",
};

const BASE_RECIPES = [
  // ---------- VEGA ----------
  { id: "r1", name: "Abrikoos/pompoen-tajine", cat: "vega", ingredients: ["Alfez apricot & coriander (Maroccan style)", "Pompoen", "Courgette", "2 tomaten", "1 blik kikkererwten", "Abrikoos", "Kip (optioneel)", "Couscous/rijst"], bereiding: "" },
  { id: "r2", name: "Accenture burgers", cat: "vega", ingredients: ["Kikkererwten", "Wortels", "Havervlokken", "Zongedroogde tomaten", "Ui", "Knoflook", "Paprikapoeder", "Chilipoeder", "Oregano", "Azijn", "Zoete aardappel", "Maïzena", "Tomaten", "Komkommer", "Buns/burgerbroodjes", "(Peterselie/knoflook) pesto"], bereiding: "Oven voorverwarmen op 220°C. Zoete aardappel in frietjes met maïzena en olie, 20-25 min. bakken. Ui marineren in water, azijn en suiker. Kikkererwten, havervlokken, ui, knoflook, zongedroogde tomaten en kruiden pureren, burgers vormen en 15 min. bakken op lagere stand. Broodjes roosteren, beleggen met pesto, tomaat, komkommer, burger en rode ui." },
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
  { id: "r17", name: "Tortelloni met spinazie", cat: "vega", ingredients: ["750 g tortelloni", "1200 g spinazie à la crème", "Zonnebloempitten", "Gewone rozijnen"], bereiding: "" },
  { id: "r18", name: "Vega burrito's", cat: "vega", ingredients: ["Pak burritos", "3 trostomaten", "1 ui", "1 paprika", "2 avocado's", "Blik maïs", "Blik kidneybonen", "200 g crème fraîche", "Geraspte kaas"], bereiding: "" },
  { id: "r19", name: "Vega risotto met champignons", cat: "vega", ingredients: ["200 g risottorijst", "250 g kastanjechampignons", "1 rode ui", "1 prei", "2 tomaten", "75 ml droge witte wijn", "2 tenen knoflook", "1 stuk gember", "1 l groentebouillon", "2 el edelgistvlokken", "2 el kokosolie", "200 g verse spinazie/sla"], bereiding: "Ui en prei in kokosolie 10 min. bakken, knoflook en gember toevoegen, rijst mee roeren, wijn erbij, daarna bouillon: 25 min. koken. Champignons en tomaten apart bakken en door de risotto roeren. Edelgistvlokken erover." },
  { id: "r20", name: "Vega tandoori (Knorr wereldgerecht)", cat: "vega", ingredients: [], bereiding: "Volgens verpakking Knorr wereldgerecht." },
  // ---------- VIS ----------
  { id: "r21", name: "Burritobowl met tonijn", cat: "vis", ingredients: ["125-150 g gedroogde linzenmix", "420 g kidneybonen", "200 g ijsbergsla", "340 g mais in blik", "1 groene paprika", "2 avocado's", "320 g tonijn", "150 g roze garnalen", "Sambalsaus"], bereiding: "Volgens Jumbo-recept is alles praktisch koud, maar opwarmen is ook lekker. Garnalen mogen mee verwarmd worden." },
  { id: "r22", name: "Makreelsalade", cat: "vis", ingredients: ["Gerookte makreel", "Slamelange met rucola", "Rode bietjes", "Appel", "Ui", "Ei", "Pompoenpitten", "Fritessaus", "Yoghurt", "Bieslook"], bereiding: "" },
  { id: "r23", name: "Paëlla", cat: "vis", ingredients: ["2 paprika's", "1 ui", "1 teentje knoflook", "1 courgette", "1 bouillonblokje", "150 g diepvriesdoperwten", "Garnalen", "Sardines", "Tonijn", "Kurkuma", "Rijst (couscous/bulgur)"], bereiding: "Rijst koken met kurkuma. Paprika, ui en knoflook bakken. Bouillonblokje, courgette en fruits de mer toevoegen. Rijst en doperwten toevoegen." },
  { id: "r24", name: "Spinaziequiche met zalm", cat: "vis", ingredients: ["450 g spinazie", "1 rode paprika", "½ blikje mais", "Zalm in blokjes", "2 eieren", "½ pakje kookroom", "Geitenkaas of gewone kaas", "3 tl tofukruiden of Bretonse gehaktkruiden", "Bladerdeeg"], bereiding: "Oven voor op 200°C. Eieren, room, kruiden en kaas mengen. Ovenschaal met bladerdeeg bekleden, alle ingrediënten erin. 20-30 min. in de oven." },
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
  { id: "r36", name: "Borsjt", cat: "vlees", ingredients: ["Pot runderbouillon met vlees", "Bouillonblokje", "200 g aardappelen", "400 g groenten met kool", "200 g winterpeen", "1 ui", "Pot rode bietjes", "Blik tomatenblokjes", "Blik knakworstjes", "Peper", "Paprikapoeder", "Laurierblad", "Azijn", "Crème fraîche"], bereiding: "Aardappelen, wortel en ui snijden. Bouillon aanlengen tot 1 liter met bouillonblokje en laurierblad. Ui bakken, hete bouillon toevoegen, aardappelen, koolgroenten, wortel en paprikapoeder 15 min. zacht koken. Tomatenblokjes en vlees toevoegen, daarna bietjes en worst, doorwarmen. Op smaak brengen met zout, peper en azijn, serveren met crème fraîche." },
  { id: "r37", name: "Broccoli-perziktaart", cat: "vlees", ingredients: ["Broccoli", "Perzik", "Bladerdeeg", "Boursin", "Cashewnoten", "Spekjes"], bereiding: "" },
  { id: "r38", name: "Chili con carne", cat: "vlees", ingredients: ["Aardappels", "Zak chilischotelmix (Stijl Lidl)", "1 ui", "1 paprika", "1 blik maïs", "1 blik bruine bonen", "3 tomaten", "Gehakt", "Komijn"], bereiding: "" },
  { id: "r39", name: "Hutspot", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r40", name: "Kip pilav", cat: "vlees", ingredients: ["300 g rijst", "300 g kip", "70 g tomatenpuree", "1 blik halve perziken op siroop", "2 teentjes knoflook", "1 ui", "1 el chilisaus", "1 el sojasaus", "1 tl paprikapoeder", "½ tl kaneel"], bereiding: "Rijst koken. Ui en knoflook fruiten, kruiden en tomatenpuree meebakken, kipblokjes toevoegen tot gaar. Perziksap, chilisaus en sojasaus toevoegen, daarna de perziken." },
  { id: "r41", name: "Kip Siam (Knorr wereldgerecht)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r42", name: "Kofta (Knorr wereldgerecht)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r43", name: "Krieltjes à la mama", cat: "vlees", ingredients: ["Gehakt", "Krieltjes", "400 g macaroni/spaghettigroenten", "Rivolitomaatjes"], bereiding: "" },
  { id: "r44", name: "Lasagne", cat: "vlees", ingredients: ["(Vega-)gehakt", "1 prei", "Volkoren bladen (pompoenschijven)", "Honig lasagnesaus", "Blanke rozijnen", "800 g spinazie à la crème"], bereiding: "" },
  { id: "r45", name: "Mexicaanse ovenschotel à la Joris", cat: "vlees", ingredients: ["1 zak tortillachips", "300 g gehakt", "1 zak groentemix (of 2 tomaten, 1-2 paprika's, mais, ui)", "1 zak rauwe andijvie", "250 g crème fraîche", "1 zakje geraspte kaas"], bereiding: "Helft van de chips op de bodem, gehakt met groenten erover, vullen met andijvie. Crème fraîche, kaas en rest chips erop. 15 min. in de oven op 200°C." },
  { id: "r46", name: "Pannekoeken", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r47", name: "Roti (Knorr wereldgerecht)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r48", name: "Spaghetti à la Yara", cat: "vlees", ingredients: ["Volkoren spaghetti", "Spinazie à la crème", "Kip", "Champignonschijfjes", "Rivolitomaatjes", "Boursin", "Pecannoten"], bereiding: "" },
  { id: "r49", name: "Spinazietaart", cat: "vlees", ingredients: ["1 pak pizzadeeg", "200 g volkoren meel", "Spinazie à la crème", "5 tomaten", "Zonnebloempitten", "Gewone rozijnen", "Gehakt", "Boursin"], bereiding: "" },
  { id: "r50", name: "Witlofschotel (Honig recept)", cat: "vlees", ingredients: [], bereiding: "" },
  { id: "r51", name: "Zuurkool met stoofpeertjes", cat: "vlees", ingredients: ["800 g aardappelen", "2 uien", "200 g kipfilet", "1 el kerriepoeder", "500 g zuurkool", "350 g halve stoofpeertjes", "150 g geraspte kaas"], bereiding: "Oven voor op 190°C. Aardappelen in plakken 10 min. koken. Ui bakken, kip met kerriepoder 4 min. meebakken. Kip en ui in ovenschaal, zuurkool erover, peer in plakjes erover, aardappelen dakpansgewijs erop, kaas erover. 30 min. in de oven." },
  // ---------- EXTRA ----------
  { id: "r52", name: "Speelklei", cat: "extra", ingredients: ["5 dl bloem", "2 dl zout", "2 el aluin in poedervorm", "5 dl water", "2 el olie", "1-2 tabletten eierverf"], bereiding: "Meng bloem, zout en aluin. Water, olie en eierverf aan de kook brengen en bij het bloemmengsel gieten. Roeren, af laten koelen en goed kneden. Bewaren in een goed afgesloten bak." },
];

const LS_KEY = "weekmenu-app-v1";

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

function loadRecipes(stored) {
  const edits = (stored && stored.edits) || {};
  if (stored && Array.isArray(stored.recipes) && stored.recipes.length > 0) {
    return stored.recipes.map((r) => ({ ...r, ...(edits[r.id] || {}) }));
  }
  return BASE_RECIPES.map((r) => ({ ...r, ...(edits[r.id] || {}) }));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const stored = useMemo(loadState, []);
  const [tab, setTab] = useState("menu");
  const [menu, setMenu] = useState((stored && stored.menu) || Array(7).fill(null)); // per day: {id, locked}
  const [recipes, setRecipes] = useState(() => loadRecipes(stored)); // bewerkbare receptenpool (ADR-006)
  const [newRecipe, setNewRecipe] = useState({ name: "", cat: "vega", ingredients: "", bereiding: "" });
  const [checked, setChecked] = useState((stored && stored.checked) || {});
  const [extraItems, setExtraItems] = useState((stored && stored.extraItems) || []);
  const [newItem, setNewItem] = useState("");
  const [stock, setStock] = useState(
    stored && Array.isArray(stored.stock) && stored.stock.length > 0 && stored.stock[0].cat
      ? normalizeStock(stored.stock)
      : defaultStock()
  );
  const [newStock, setNewStock] = useState("");
  const [newStockCat, setNewStockCat] = useState("koel");
  const [mix, setMix] = useState((stored && stored.mix) || { vega: 2, vis: 2, vlees: 3 });
  const [openRecipe, setOpenRecipe] = useState(null);

  useEffect(() => {
    saveState({ menu, recipes, checked, extraItems, mix, stock });
  }, [menu, recipes, checked, extraItems, mix, stock]);

  const byId = useMemo(() => Object.fromEntries(recipes.map((r) => [r.id, r])), [recipes]);

  function generateMenu() {
    const pool = (cat) => shuffle(recipes.filter((r) => r.cat === cat && (r.ingredients || []).filter(Boolean).length > 0).map((r) => r.id));
    const next = Array(7).fill(null);

    // Zaterdag en woensdag: vis
    const fish = pool("vis");
    FISH_DAYS.forEach((d, i) => {
      if (fish[i]) next[d] = { id: fish[i], locked: false };
    });

    // Overige dagen: vega/vlees volgens de gekozen verdeling
    const want = { ...mix };
    const over = want.vega + want.vlees - OTHER_DAYS.length;
    if (over > 0) {
      for (const c of ["vlees", "vega"]) {
        const t = Math.min(over, want[c]);
        want[c] -= t;
      }
    }
    const chosen = [];
    for (const c of ["vega", "vlees"]) {
      chosen.push(...pool(c).slice(0, want[c]).map((id) => ({ id, cat: c })));
    }
    const rest = shuffle(
      recipes
        .filter((r) => (r.cat === "vega" || r.cat === "vlees") && (r.ingredients || []).filter(Boolean).length > 0)
        .map((r) => r.id)
    );
    for (const id of rest) {
      if (chosen.length >= OTHER_DAYS.length) break;
      if (!chosen.some((c) => c.id === id)) chosen.push({ id });
    }
    OTHER_DAYS.forEach((d, i) => {
      if (chosen[i]) next[d] = { id: chosen[i].id, locked: false };
    });

    setMenu(next.map((d, i) => (menu[i] && menu[i].locked ? menu[i] : d)));
    setChecked({});
  }

  function setDay(day, entry) {
    setMenu((m) => m.map((d, i) => (i === day ? entry : d)));
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
      {
        id,
        name,
        cat: newRecipe.cat,
        ingredients: newRecipe.ingredients.split("\n").map((s) => s.trim()).filter(Boolean),
        bereiding: newRecipe.bereiding.trim(),
      },
    ]);
    setNewRecipe({ name: "", cat: "vega", ingredients: "", bereiding: "" });
  }

  function deleteRecipe(id) {
    setRecipes((rs) => rs.filter((r) => r.id !== id));
    setMenu((m) => m.map((d) => (d && d.id === id ? null : d)));
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
        const arr = JSON.parse(reader.result);
        if (Array.isArray(arr) && arr.length > 0 && arr.every((r) => r && r.id && r.name)) {
          setRecipes(arr.map((r) => ({ ingredients: [], bereiding: "", ...r })));
        }
      } catch (e) {}
    };
    reader.readAsText(file);
  }

  function resetRecipes() {
    if (window.confirm("Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?")) {
      setRecipes(BASE_RECIPES.map((r) => ({ ...r })));
    }
  }

  const shoppingRows = useMemo(() => {
    const rows = [];
    menu.forEach((d, day) => {
      if (!d) return;
      const r = byId[d.id];
      if (!r) return;
      (r.ingredients || []).filter(Boolean).forEach((ing) => {
        rows.push({ key: `${day}-${r.id}-${ing}`, day, label: ing, recipe: r.name });
      });
    });
    return rows;
  }, [menu, byId]);

  const activeMenuIds = menu.filter(Boolean).map((d) => d.id);
  const stockShort = stock.filter((s) => s.have < s.want);
  const totalItems = shoppingRows.length + extraItems.length + stockShort.length;
  const doneItems =
    shoppingRows.filter((r) => checked[r.key]).length +
    extraItems.filter((i) => checked["extra-" + i]).length +
    stockShort.filter((s) => checked["stock-" + s.name]).length;

  const tabs = [
    { key: "menu", label: "Weekmenu" },
    { key: "recipes", label: "Recepten" },
    { key: "stock", label: "Voorraad" },
    { key: "shopping", label: `Boodschappen${totalItems ? ` (${doneItems}/${totalItems})` : ""}` },
  ];

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800">
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <header className="pt-6 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Weekmenu &amp; Boodschappen</h1>
          <span className="text-xs text-stone-400">gezinsrecepten</span>
        </header>

        <nav className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 sticky top-2 z-10">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition ${
                tab === t.key ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === "menu" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
              <div className="text-sm font-medium mb-2">Verdeling voor de week</div>
              <div className="text-xs text-stone-500 mb-2">
                Zaterdag en woensdag eten jullie vis (automatisch). De overige 5 dagen zijn vega of vlees:
              </div>
              <div className="flex gap-2 mb-3">
                {["vega", "vlees"].map((c) => (
                  <label key={c} className="flex-1 text-xs">
                    <span className={`inline-block px-2 py-0.5 rounded-full mb-1 ${CAT_STYLE[c]}`}>{CAT_LABEL[c]}</span>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      value={mix[c]}
                      onChange={(e) =>
                        setMix({ ...mix, [c]: Math.max(0, Math.min(5, Number(e.target.value) || 0)) })
                      }
                      className="w-full border rounded-lg px-2 py-1.5"
                    />
                  </label>
                ))}
                <div className="flex-1 text-xs">
                  <span className={`inline-block px-2 py-0.5 rounded-full mb-1 ${CAT_STYLE.vis}`}>Vis</span>
                  <div className="border rounded-lg px-2 py-1.5 text-stone-400 text-center">2 (zat. + wo.)</div>
                </div>
              </div>
              <button
                onClick={generateMenu}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl"
              >
                Genereer weekmenu
              </button>
              <p className="text-xs text-stone-400 mt-2">
                Vergrendelde dagen blijven staan. Zaterdag en woensdag krijgen automatisch een visgerecht, de andere dagen vega of vlees. Recepten zonder ingredientenlijst worden nog niet automatisch ingepland, maar kun je wel handmatig kiezen.
              </p>
            </div>

            <div className="space-y-2">
              {DAYS.map((day, i) => {
                const entry = menu[i];
                const r = entry ? byId[entry.id] : null;
                return (
                  <div key={day} className="bg-white rounded-xl shadow-sm p-3 flex items-center gap-3">
                    <div className="w-20 shrink-0 text-sm font-semibold">{day}</div>
                    {r ? (
                      <div className="flex-1 min-w-0">
                        <button className="font-medium text-left truncate hover:underline" onClick={() => { setOpenRecipe(r.id); setTab("recipes"); }}>
                          {r.name}
                        </button>
                        <div className="text-xs text-stone-400">
                          <span className={`inline-block px-1.5 rounded ${CAT_STYLE[r.cat]}`}>{CAT_LABEL[r.cat]}</span>
                          {r.time ? ` · ${r.time} min` : " · tijd onbekend"}
                          {r.cook ? ` · ${r.cook}` : ""}
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 text-sm text-stone-400">Nog niets gekozen</div>
                    )}
                    <select
                      value={entry ? entry.id : ""}
                      onChange={(e) => setDay(i, e.target.value ? { id: e.target.value, locked: false } : null)}
                      className="shrink-0 border rounded-lg text-xs px-1 py-1 max-w-[90px]"
                    >
                      <option value="">—</option>
                      {recipes.filter((x) => x.cat !== "extra").map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                    <button
                      title={entry && entry.locked ? "Ontgrendelen" : "Vergrendelen"}
                      onClick={() => entry && setDay(i, { ...entry, locked: !entry.locked })}
                      className={`shrink-0 w-8 h-8 rounded-lg text-sm ${entry && entry.locked ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"}`}
                    >
                      {entry && entry.locked ? "🔒" : "🔓"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === "recipes" && (
          <div>
            <div className="mb-2 text-xs text-stone-500">
              Tik op een recept om het te bekijken en te bewerken: naam, categorie, ingredienten, bereiding, tijd en kok kun je zelf aanpassen. Alles wordt opgeslagen op je toestel; met exporteren/importeren deel je de lijst als JSON.
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
              <div className="text-sm font-medium mb-2">Nieuw recept toevoegen</div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  value={newRecipe.name}
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  placeholder="Naam…"
                  className="col-span-2 border rounded-lg px-2 py-1.5 text-sm"
                  onKeyDown={(e) => { if (e.key === "Enter") addRecipe(); }}
                />
                <select
                  value={newRecipe.cat}
                  onChange={(e) => setNewRecipe({ ...newRecipe, cat: e.target.value })}
                  className="border rounded-lg px-2 py-1.5 text-sm text-stone-600"
                >
                  {["vega", "vis", "vlees", "extra"].map((c) => (
                    <option key={c} value={c}>{CAT_LABEL[c]}</option>
                  ))}
                </select>
              </div>
              <textarea
                rows={2}
                value={newRecipe.ingredients}
                onChange={(e) => setNewRecipe({ ...newRecipe, ingredients: e.target.value })}
                placeholder="Ingredienten, één per regel…"
                className="w-full border rounded-lg px-2 py-1.5 text-sm mb-2"
              />
              <input
                value={newRecipe.bereiding}
                onChange={(e) => setNewRecipe({ ...newRecipe, bereiding: e.target.value })}
                placeholder="Bereiding (optioneel)…"
                className="w-full border rounded-lg px-2 py-1.5 text-sm mb-2"
              />
              <div className="flex gap-2">
                <button onClick={addRecipe} className="flex-1 bg-stone-800 text-white rounded-lg text-sm font-medium py-2">
                  Toevoegen
                </button>
                <button onClick={exportRecipes} className="px-3 border rounded-lg text-sm text-stone-500">Exporteren</button>
                <label className="px-3 border rounded-lg text-sm text-stone-500 flex items-center cursor-pointer">
                  Importeren
                  <input
                    type="file"
                    accept="application/json,.json"
                    className="hidden"
                    onChange={(e) => { if (e.target.files[0]) importRecipes(e.target.files[0]); e.target.value = ""; }}
                  />
                </label>
                <button onClick={resetRecipes} className="px-3 border rounded-lg text-sm text-stone-500">Standaardlijst terug</button>
              </div>
            </div>
            {["vega", "vis", "vlees", "extra"].map((c) => (
              <div key={c} className="mb-4">
                <div className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold mb-2 ${CAT_STYLE[c]}`}>
                  {CAT_LABEL[c]}
                </div>
                <div className="space-y-1.5">
                  {recipes
                    .filter((r) => r.cat === c)
                    .sort((a, b) => a.name.localeCompare(b.name, "nl"))
                    .map((r) => {
                      const inMenu = activeMenuIds.includes(r.id);
                      const isOpen = openRecipe === r.id;
                      return (
                        <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                          <button
                            onClick={() => setOpenRecipe(isOpen ? null : r.id)}
                            className="w-full text-left px-3 py-2.5 flex items-center justify-between"
                          >
                            <span className="font-medium text-sm">
                              {r.name}
                              {inMenu && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">deze week</span>}
                              {(r.ingredients || []).filter(Boolean).length === 0 && (
                                <span className="ml-1.5 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">geen ingredienten bekend</span>
                              )}
                            </span>
                            <span className="text-stone-400 text-xs">{isOpen ? "▲" : "▼"}</span>
                          </button>
                          {isOpen && (
                            <div className="px-3 pb-3 border-t border-stone-100">
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <label className="text-xs">
                                  <span className="text-stone-500">Naam</span>
                                  <input
                                    value={r.name}
                                    onChange={(e) => updateRecipe(r.id, { name: e.target.value })}
                                    className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                                  />
                                </label>
                                <label className="text-xs">
                                  <span className="text-stone-500">Categorie</span>
                                  <select
                                    value={r.cat}
                                    onChange={(e) => updateRecipe(r.id, { cat: e.target.value })}
                                    className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                                  >
                                    {["vega", "vis", "vlees", "extra"].map((c) => (
                                      <option key={c} value={c}>{CAT_LABEL[c]}</option>
                                    ))}
                                  </select>
                                </label>
                                <label className="text-xs">
                                  <span className="text-stone-500">Bereidingstijd (min)</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={r.time ?? ""}
                                    onChange={(e) => updateRecipe(r.id, { time: e.target.value })}
                                    placeholder="bijv. 30"
                                    className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                                  />
                                </label>
                                <label className="text-xs">
                                  <span className="text-stone-500">Wie kan dit koken?</span>
                                  <input
                                    value={r.cook ?? ""}
                                    onChange={(e) => updateRecipe(r.id, { cook: e.target.value })}
                                    placeholder="bijv. Marco"
                                    className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
                                  />
                                </label>
                              </div>
                              <div className="mt-3 text-xs">
                                <span className="text-stone-500">Ingredienten (één per regel)</span>
                                <textarea
                                  rows={Math.max((r.ingredients || []).filter(Boolean).length, 1) + 1}
                                  value={(r.ingredients || []).join("\n")}
                                  onChange={(e) => updateRecipe(r.id, { ingredients: e.target.value.split("\n") })}
                                  className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                                />
                              </div>
                              <div className="mt-3 text-xs">
                                <span className="text-stone-500">Bereiding</span>
                                <textarea
                                  rows={4}
                                  value={r.bereiding ?? ""}
                                  onChange={(e) => updateRecipe(r.id, { bereiding: e.target.value })}
                                  className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                                />
                              </div>
                              <button
                                onClick={() => deleteRecipe(r.id)}
                                className="mt-2 text-xs text-red-500 hover:underline"
                              >
                                Recept verwijderen
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === "stock" && (
          <div>
            <div className="mb-2 text-xs text-stone-500">
              Naast elk product zie je jouw huidige voorraad en de gewenste voorraad (bewaarlijst) die je zelf kunt instellen. Als de huidige voorraad lager is dan de gewenste, staat het product automatisch op de boodschappenlijst. Na het boodschappen doen: "Alles aangevuld".
            </div>
            <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex gap-2">
              <input
                value={newStock}
                onChange={(e) => setNewStock(e.target.value)}
                placeholder="Nieuw product…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newStock.trim()) {
                    setStock([...stock, { name: newStock.trim(), cat: newStockCat, want: 1, have: 1 }]);
                    setNewStock("");
                  }
                }}
              />
              <select
                value={newStockCat}
                onChange={(e) => setNewStockCat(e.target.value)}
                className="border rounded-lg px-2 py-2 text-sm text-stone-600"
              >
                {STOCK_CATS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (newStock.trim()) {
                    setStock([...stock, { name: newStock.trim(), cat: newStockCat, want: 1, have: 1 }]);
                    setNewStock("");
                  }
                }}
                className="bg-stone-800 text-white px-4 rounded-lg text-sm font-medium"
              >
                Toevoegen
              </button>
            </div>

            {STOCK_CATS.map((c) => {
              const items = stock.map((s, i) => ({ ...s, i })).filter((s) => s.cat === c.key);
              return (
                <div key={c.key} className="mb-4">
                  <div className="text-xs font-semibold text-stone-500 mb-1">{c.label}</div>
                  <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
                    {items.map((s) => {
                      const tekort = s.have < s.want;
                      return (
                        <div key={s.name} className="flex items-center gap-2 px-3 py-2">
                          {c.key === "kruiden" ? (
                            <button
                              onClick={() => setStock(stock.map((x, j) => (j === s.i ? { ...x, have: x.have < x.want ? x.want : 0 } : x)))}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                tekort ? "bg-orange-100 text-orange-700" : "bg-emerald-100 text-emerald-700"
                              }`}
                            >
                              {tekort ? "Tekort" : "In huis"}
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setStock(stock.map((x, j) => (j === s.i ? { ...x, have: Math.max(0, x.have - 1) } : x)))}
                                className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600"
                              >
                                −
                              </button>
                              <span className={`w-6 text-center text-sm font-medium ${tekort ? "text-orange-600" : "text-stone-700"}`}>
                                {s.have}
                              </span>
                              <button
                                onClick={() => setStock(stock.map((x, j) => (j === s.i ? { ...x, have: x.have + 1 } : x)))}
                                className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600"
                              >
                                +
                              </button>
                            </div>
                          )}
                          <span className={`flex-1 text-sm ${tekort ? "font-medium text-orange-700" : ""}`}>{s.name}</span>
                          <span className="text-xs text-stone-400 whitespace-nowrap">/ gewenst</span>
                          <input
                            type="number"
                            min="0"
                            value={s.want}
                            onChange={(e) =>
                              setStock(stock.map((x, j) => (j === s.i ? { ...x, want: Math.max(0, Number(e.target.value) || 0) } : x)))
                            }
                            className="w-12 border rounded-lg px-1 py-1 text-sm text-center"
                          />
                          {tekort && (
                            <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                              op lijst
                            </span>
                          )}
                          <button
                            onClick={() => setStock(stock.filter((_, j) => j !== s.i))}
                            className="text-stone-300 hover:text-red-500 text-sm"
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                    {items.length === 0 && (
                      <div className="px-3 py-3 text-sm text-stone-400 text-center">Nog niets in deze categorie.</div>
                    )}
                  </div>
                </div>
              );
            })}

            <div className="flex gap-2">
              <button
                onClick={() => setStock(stock.map((s) => ({ ...s, have: s.want })))}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
              >
                ✓ Alles aangevuld
              </button>
              <button
                onClick={() => setStock(defaultStock())}
                className="py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white"
              >
                Standaardlijst terug
              </button>
            </div>
          </div>
        )}

        {tab === "shopping" && (
          <div>
            <div className="bg-white rounded-xl shadow-sm p-3 mb-4 flex gap-2">
              <input
                value={newItem}
                onChange={(e) => setNewItem(e.target.value)}
                placeholder="Extra artikel toevoegen…"
                className="flex-1 border rounded-lg px-3 py-2 text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newItem.trim()) {
                    setExtraItems([...extraItems, newItem.trim()]);
                    setNewItem("");
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newItem.trim()) {
                    setExtraItems([...extraItems, newItem.trim()]);
                    setNewItem("");
                  }
                }}
                className="bg-stone-800 text-white px-4 rounded-lg text-sm font-medium"
              >
                Toevoegen
              </button>
            </div>

            {shoppingRows.length === 0 && extraItems.length === 0 && (
              <div className="text-center text-stone-400 text-sm py-10">
                Stel eerst een weekmenu samen; de ingredienten verschijnen dan hier automatisch.
              </div>
            )}

            {SHOP_RUNS.map((run) => {
              const runRows = shoppingRows.filter((r) => run.days.includes(r.day));
              if (!runRows.length) return null;
              return (
                <div key={run.label} className="mb-6">
                  <div className="bg-stone-800 text-white rounded-xl px-3 py-2.5 mb-2">
                    <div className="font-semibold text-sm">{run.label}</div>
                    <div className="text-xs text-stone-300">{run.hint}</div>
                  </div>
                  {run.days.map((i) => {
                    const rows = shoppingRows.filter((r) => r.day === i);
                    if (!rows.length) return null;
                    const rec = byId[menu[i].id];
                    return (
                      <div key={i} className="mb-3">
                        <div className="text-xs font-semibold text-stone-500 mb-1">
                          {DAYS[i]} · {rec.name}
                        </div>
                        <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
                          {rows.map((r) => (
                            <label key={r.key} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={!!checked[r.key]}
                                onChange={(e) => setChecked({ ...checked, [r.key]: e.target.checked })}
                                className="w-4 h-4 accent-emerald-600"
                              />
                              <span className={`text-sm ${checked[r.key] ? "line-through text-stone-300" : ""}`}>{r.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {stockShort.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-500 mb-1">Standaardvoorraad aanvullen</div>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
                  {stockShort.map((s) => (
                    <label key={s.name} className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!checked["stock-" + s.name]}
                        onChange={(e) => setChecked({ ...checked, ["stock-" + s.name]: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className={`text-sm ${checked["stock-" + s.name] ? "line-through text-stone-300" : ""}`}>
                        {s.name}
                        {s.want > 1 && <span className="text-stone-400"> ({s.want - s.have} van {s.want})</span>}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {extraItems.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-semibold text-stone-500 mb-1">Extra</div>
                <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
                  {extraItems.map((item) => (
                    <div key={item} className="flex items-center gap-3 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={!!checked["extra-" + item]}
                        onChange={(e) => setChecked({ ...checked, ["extra-" + item]: e.target.checked })}
                        className="w-4 h-4 accent-emerald-600"
                      />
                      <span className={`flex-1 text-sm ${checked["extra-" + item] ? "line-through text-stone-300" : ""}`}>{item}</span>
                      <button
                        onClick={() => setExtraItems(extraItems.filter((x) => x !== item))}
                        className="text-stone-300 hover:text-red-500 text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {totalItems > 0 && (
              <button
                onClick={() => setChecked({})}
                className="w-full py-2.5 border rounded-xl text-sm text-stone-500 hover:bg-white"
              >
                Vinkjes wissen
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
