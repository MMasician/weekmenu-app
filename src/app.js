/* Gegenereerd door `npm run build` (tools/jsx-transform.cjs) - niet handmatig bewerken. Bron: src/ */
(function () {
var __modules = {
"src/App.jsx": function (module, exports, require) {
const __imp0 = require("./state/store.js");
const { useAppStore } = __imp0;
const __imp1 = require("./ui/menuTab.jsx");
const { createMenuTab } = __imp1;
const __imp2 = require("./ui/recipesTab.jsx");
const { createRecipesTab } = __imp2;
const __imp3 = require("./ui/stockTab.jsx");
const { createStockTab } = __imp3;
const __imp4 = require("./ui/shoppingTab.jsx");
const { createShoppingTab } = __imp4;
const __imp5 = require("./ui/settingsTab.jsx");
const { createSettingsTab } = __imp5;
const __imp6 = require("./domain/settings.js");
const { THEME_TAB_ICONS } = __imp6;
const __imp7 = require("./i18n/index.js");
const { t } = __imp7;

// Compositieroot: state uit useAppStore(), tabbalk en aanroep van de tab-views.
// Tab-views zijn plain-functie-aanroepen (geen <Component/>), zodat de test-harness
// de hele boom kan uitvouwen; alle hooks blijven in useAppStore.
module.exports.default = function App() {
  const ctx = useAppStore();
  const { settings, tab, goTab, totalItems, doneItems, mergeGroup, pnToast, undoMerge, setPnToast, onDishFotoFile, dateSheetOpen, rulesSheetOpen, deviationKey } = ctx;
  const tabIcons = THEME_TAB_ICONS[settings.theme] || THEME_TAB_ICONS.standaard; // #40: feestthema's eigen iconen
  const tabs = [
    { key: "menu", label: t("Weekmenu"), icon: tabIcons.menu },
    { key: "recipes", label: t("Recepten"), icon: tabIcons.recipes },
    { key: "stock", label: t("Voorraad"), icon: tabIcons.stock },
    { key: "shopping", label: t("Boodschappen"), icon: tabIcons.shopping },
    { key: "settings", label: t("Instellingen"), icon: tabIcons.settings },
  ];

  const menuViews = createMenuTab(ctx);
  const recipesViews = createRecipesTab(ctx);
  const stockViews = createStockTab(ctx);
  const shoppingViews = createShoppingTab(ctx);
  const settingsViews = createSettingsTab(ctx);

  return (
    /*#__PURE__*/React.createElement("div", { "className": "min-h-screen bg-stone-50 text-stone-800", "data-theme": settings.theme }, /*#__PURE__*/React.createElement("div", { "className": "mx-auto max-w-2xl px-4 pb-16" }, /*#__PURE__*/React.createElement("header", { "className": "pt-6 pb-3 flex items-center justify-between" }, /*#__PURE__*/React.createElement("h1", { "className": "text-2xl font-bold" }, __t("Weekmenu & Boodschappen")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, t("{n} eters", { n: settings.householdSize }))), /*#__PURE__*/React.createElement("nav", { "className": "flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 sticky top-2 z-10" }, tabs.map((tb) => (
            /*#__PURE__*/React.createElement("button", { "key": tb.key, "onClick": () => goTab(tb.key), "title": tb.label, "aria-label": tb.label, "className": `tabbtn ${tab === tb.key ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"}` }, /*#__PURE__*/React.createElement("span", { "className": "tabicon" }, tb.icon), tab === tb.key && /*#__PURE__*/React.createElement("span", { "className": "tablabel" }, tb.label), tb.key === "shopping" && totalItems > 0 && (
                /*#__PURE__*/React.createElement("span", { "className": "tabbadge", "title": t("{done} van {total} afgevinkt", { done: doneItems, total: totalItems }) }, `${doneItems}/${totalItems}`)
              ))
          ))), /*#__PURE__*/React.createElement("input", { "id": "dish-foto-input", "type": "file", "accept": "image/*", "style": { display: "none" }, "onChange": onDishFotoFile }), mergeGroup && settingsViews.renderMergeSheet(), pnToast && (
          /*#__PURE__*/React.createElement("div", { "style": { position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "#292524", color: "#fff", borderRadius: "0.75rem", padding: "0.5rem 0.9rem", display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "0.85rem" } }, /*#__PURE__*/React.createElement("span", null, pnToast.msg), pnToast.canUndo && /*#__PURE__*/React.createElement("button", { "onClick": undoMerge, "style": { color: "#fbbf24" } }, __t("\\u27f2 Ongedaan maken")), /*#__PURE__*/React.createElement("button", { "onClick": () => setPnToast(null), "style": { color: "#d6d3d1" } }, __t("\\u2715")))
        ), tab === "menu" && menuViews.renderMenuTab(), tab === "recipes" && recipesViews.renderRecipesTab(), tab === "stock" && stockViews.renderStockTab(), tab === "shopping" && shoppingViews.renderShoppingTab(), tab === "settings" && settingsViews.renderSettingsTab(), tab === "settings" && settingsViews.renderDelenSheets(), tab === "menu" && dateSheetOpen && menuViews.renderDateSheet(), tab === "menu" && rulesSheetOpen && menuViews.renderRulesSheet(), tab === "menu" && deviationKey && menuViews.renderDeviationSheet()))
  );
}

},
"src/state/store.js": function (module, exports, require) {
// App-state en acties: één hook met alle useState/useMemo/useEffect (de test-harness
// vouwt alleen plain-functie-aanroepen open, dus alle hooks blijven hier in één scope).
const { useEffect, useMemo, useState } = React; // React global (vendor/react.min.js)
const __imp0 = require("../domain/catalog.js");
const { UNIT_FACTOR, UNIT_GROUP, buildCatalog, convertAmount, fmtFactor, ingLabel, ingUnit, migrateRecipesIngredients, normalizeAmountUnit, normalizePack, normalizeProducts, pidOfName, priceKey, productKey, roundAmt, scaleIng, shopDisplayAmount } = __imp0;
const __imp1 = require("../domain/dates.js");
const { addDays, dateKey, fmtDay, fmtShort, monthGrid, startOfWeek, weekDateKeys, weekStartFor } = __imp1;
const __imp2 = require("../i18n/index.js");
const { dayNames, setLanguage, t } = __imp2;
const __imp3 = require("../domain/menu.js");
const { shuffle } = __imp3;
const __imp4 = require("../domain/recipes.js");
const { BASE_RECIPES, loadRecipes, normalizeRecipe } = __imp4;
const __imp5 = require("../domain/settings.js");
const { THEME_META, normalizeSettings } = __imp5;
const __imp6 = require("../domain/share.js");
const { SHARE_BUNDLE, mergeShareBundle, shareStampArray, shareStampObject, shareStrip, shareTombs, shareTombsObject } = __imp6;
const __imp7 = require("../domain/stock.js");
const { defaultStock, normalizeExtras, normalizeLocations, normalizeStock } = __imp7;
const __imp8 = require("../domain/storage.js");
const { loadState, migrateStored, newId, saveState } = __imp8;
const __imp9 = require("../lib/externals.js");
const { GF, PN, TT } = __imp9;

function useAppStore() {
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
  // ---- issue #59: productnormalisatie (duplicaten samenvoegen, per-recept tags, sessie-undo) ----
  const [mergeGroup, setMergeGroup] = useState(null); // duplicaatgroep in de merge-sheet
  const [mergeKanjerId, setMergeKanjerId] = useState(null);
  const [pnToast, setPnToast] = useState(null); // { msg, canUndo }
  const [undoStack, setUndoStack] = useState([]); // sessie-undo voor merges (in-memory; na herladen permanent)
  const pnDupGroups = useMemo(() => (PN ? PN.findDuplicateGroups(products) : []), [products]);
  const pnBadgeMap = useMemo(() => (PN ? PN.duplicateBadgeMap(products) : {}), [products]);
  // ---- issue #60: foto per gerecht (recipeId -> objectURL) ----
  const [dishImgs, setDishImgs] = useState({});
  const [fotoFor, setFotoFor] = useState(null); // recept-id waarvoor de file-picker open is
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

  // ADR-023: GUI-taal synchroniseren met settings.language (default "nl"; t() leest deze)
  setLanguage(settings.language);
  // ADR-023: <html lang>, paginatitel en meta-description volgen de GUI-taal
  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) document.documentElement.lang = settings.language;
    if (typeof document !== "undefined" && "title" in document) document.title = t("Weekmenu & Boodschappenlijst");
    const metaD = typeof document !== "undefined" && document.querySelector ? document.querySelector('meta[name="description"]') : null;
    if (metaD && metaD.setAttribute) metaD.setAttribute("content", t("Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat."));
  }, [settings.language]);

  // #40: thema toepassen op <body> (CSS-variabelen cascaden) + PWA-statusbalk (theme-color)
  useEffect(() => {
    if (typeof document !== "undefined" && document.body) document.body.dataset.theme = settings.theme;
    const meta = typeof document !== "undefined" && document.querySelector ? document.querySelector('meta[name="theme-color"]') : null;
    if (meta && meta.setAttribute) meta.setAttribute("content", THEME_META[settings.theme] || THEME_META.standaard);
  }, [settings.theme]);

  const markets = settings.markets;
  const days = useMemo(
    () => dayNames().map((_, i) => dayNames()[(settings.weekStartDay + i) % 7]),
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
  const todayLabel = `${dayNames()[todayDayIdx].slice(0, 2).toLowerCase()} ${fmtDay(todayKey)}`;
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
  // ---- issue #60: foto per gerecht opslaan/lezen/verwijderen via GF (IndexedDB) ----
  async function ensureDishFoto(rid) {
    if (!GF || dishImgs[rid]) return;
    try {
      const rec = await GF.getDishImage(rid);
      if (rec && rec.blob) setDishImgs((m) => ({ ...m, [rid]: URL.createObjectURL(rec.blob) }));
    } catch (e) { /* IndexedDB niet beschikbaar -> geen foto's */ }
  }
  function pickDishFoto(rid) {
    setFotoFor(rid);
    const el = typeof document !== "undefined" && document.getElementById ? document.getElementById("dish-foto-input") : null;
    if (el) el.click();
  }
  async function onDishFotoFile(e) {
    const file = e && e.target && e.target.files && e.target.files[0];
    const rid = fotoFor;
    if (!file || !rid || !GF) return;
    try {
      const { blob, width, height } = await GF.resizeImageBlob(file);
      await GF.saveDishImage(rid, blob, width, height);
      setDishImgs((m) => {
        if (m[rid]) URL.revokeObjectURL(m[rid]);
        return { ...m, [rid]: URL.createObjectURL(blob) };
      });
    } catch (err) {
      setPnToast({ msg: t("Foto opslaan mislukt: {fout}", { fout: err && err.message ? err.message : String(err) }) });
    }
    setFotoFor(null);
    if (e && e.target) e.target.value = "";
  }
  async function removeDishFoto(rid) {
    if (GF) { try { await GF.deleteDishImage(rid); } catch (e) { /* ignore */ } }
    setDishImgs((m) => {
      if (m[rid]) URL.revokeObjectURL(m[rid]);
      const n = { ...m };
      delete n[rid];
      return n;
    });
  }
  function openProdCard(rowKey, pid) {
    const p = prodById[pid];
    if (!p) return;
    setOpenProd(openProd === rowKey ? null : rowKey);
    setProdEdit({ id: p.id, name: p.name, cat: p.cat, market: p.market, unit: p.unit, tags: p.tags || [], tagDraft: "", packAmount: p.pack ? String(p.pack.amount).replace(".", ",") : "", packUnit: p.pack ? p.pack.unit : "", timetagDraft: p.timetag && p.timetag.days ? String(p.timetag.days) : "0" }); // #37/#35/#58
  }
  function saveProductEdit() {
    if (!prodEdit) return;
    const name = prodEdit.name.trim();
    const tags = [...new Set((prodEdit.tags || []).map((t) => String(t).trim().toLowerCase()).filter(Boolean))];
    // #35: inhoud per verpakking (leeg -> geen pack)
    const pack = normalizePack({ amount: String(prodEdit.packAmount || "").replace(",", "."), unit: prodEdit.packUnit });
    // #58: timetag valideren (0 = geen tag, max 365); bij ongeldige invoer oude waarde behouden
    const tt = TT ? TT.validateTimetagInput(prodEdit.timetagDraft == null ? "0" : String(prodEdit.timetagDraft)) : { ok: true, timetag: null };
    const timetag = tt.ok ? tt.timetag : (prodById[prodEdit.id] && prodById[prodEdit.id].timetag) || null;
    setProducts((ps) => ps.map((p) => (p.id === prodEdit.id ? { ...p, name: name || p.name, cat: prodEdit.cat || "overig", market: prodEdit.market || null, unit: prodEdit.unit || null, tags, pack, timetag } : p)));
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
  // ---- issue #59: duplicaten samenvoegen via PN.mergeProducts (kanjer + per-recept tags + undo) ----
  // PN gebruikt `productId` op ingrediënten; main gebruikt `pid` — hier omgerekend.
  function pnRecipesToMain(rs) {
    return (rs || []).map((r) => ({
      ...r,
      ingredients: (r.ingredients || []).map((i) => {
        const copy = { ...i };
        if (copy.productId != null) { copy.pid = copy.productId; delete copy.productId; }
        return copy;
      }),
    }));
  }
  function openMergeGroup(group) {
    const kanjer = PN ? PN.pickKanjer(group, recipes) : group[0];
    setMergeGroup(group);
    setMergeKanjerId(kanjer ? kanjer.id : null);
  }
  function doMerge() {
    if (!PN || !mergeGroup || mergeGroup.length < 2) return;
    const ids = mergeGroup.map((p) => p.id);
    const pnRecipes = recipes.map((r) => ({
      ...r,
      ingredients: (r.ingredients || []).map((i) => ({ ...i, productId: i.pid != null ? i.pid : i.productId })),
    }));
    let res;
    try {
      res = PN.mergeProducts({ products, recipes: pnRecipes, ids, kanjerId: mergeKanjerId });
    } catch (e) {
      setPnToast({ msg: t("Samenvoegen geweigerd: {fout}", { fout: e && e.message ? e.message : String(e) }) });
      return;
    }
    setProducts(res.products);
    setRecipes(pnRecipesToMain(res.recipes));
    setUndoStack((u) => u.concat([res.undo]));
    setMergeGroup(null);
    setPnToast({ msg: t("Samengevoegd naar \u201c{naam}\u201d", { naam: res.kanjer.name }), canUndo: true });
  }
  function undoMerge() {
    const u = undoStack.length ? undoStack[undoStack.length - 1] : null;
    setUndoStack(undoStack.slice(0, -1));
    if (!u) { setPnToast({ msg: "Undo niet meer beschikbaar (sessie voorbij) \u2014 merge is permanent" }); return; }
    setProducts(u.productsBefore);
    setRecipes(pnRecipesToMain(u.recipesBefore));
    setPnToast(null);
  }
  function setIngTags(rid, idx, tags) {
    setRecipes((rs) => rs.map((r) => (r.id !== rid ? r : { ...r, ingredients: (r.ingredients || []).map((ing, j) => (j === idx && typeof ing === "object" && ing ? { ...ing, tags } : ing)) })));
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
        setShareToast(t("⚠️ Dit bestand kon niet worden gelezen."));
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
      setShareToast(t("⚠️ Dit is geen deelbestand van de weekmenu-app."));
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
      ["recipes", t("Recepten")], ["products", t("Producten")], ["stock", t("Voorraad")], ["stockLocations", t("Locaties")],
      ["extraItems", t("Extra's")], ["menuByDate", t("Weekmenu")], ["settings", t("Instellingen")],
    ];
    const lines = [];
    LBL.forEach(([k, lbl]) => {
      const x = c[k];
      if (!x) return;
      const parts = [];
      if (x.added) parts.push(t("{n} nieuw", { n: x.added }));
      if (x.updated) parts.push(t("{n} nieuwer uit bestand", { n: x.updated }));
      if (x.removed) parts.push(t("{n} verwijderd", { n: x.removed }));
      if (x.kept) parts.push(t("{n} blijft", { n: x.kept }));
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
    setShareToast(t("✅ Samengevoegd") + (actives.length ? ": " + actives.map((l) => `${l.lbl.toLowerCase()} ${l.parts[0]}`).join(" · ") : t(" — niets nieuws in het bestand")) + t(" (tik om te sluiten)."));
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
    if (window.confirm(t("Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?"))) {
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
  // ---- issue #58: timetags — ctx voor TT (plan = menuByDate, dishes = recepten met productIds) ----
  const ttCtx = useMemo(() => ({
    history: [],
    dishes: recipes.map((r) => ({ id: r.id, productIds: (r.ingredients || []).map((i) => (typeof i === "object" && i ? i.pid : null)).filter(Boolean) })),
    plan: { days: Object.fromEntries(Object.entries(menuByDate).map(([k, e]) => [k, e && e.id ? { dishIds: [e.id] } : null])) },
  }), [recipes, menuByDate]);
  // ⏱-markeringen voor een dag: product met timetag dat VÓÓR die dag al gebruikt is binnen het interval
  function dayTimetagMarks(key) {
    if (!TT) return [];
    const entry = menuByDate[key];
    const r = entry && entry.id ? byId[entry.id] : null;
    if (!r) return [];
    const marks = [];
    (r.ingredients || []).forEach((ing) => {
      const pid = typeof ing === "object" && ing ? ing.pid : null;
      const p = pid ? prodById[pid] : null;
      if (!p || !p.timetag || !p.timetag.days) return;
      const lastUse = TT.lastUseOnOrBefore(p.id, TT.addDays(key, -1), ttCtx); // strikt vóór deze dag
      if (!lastUse) return;
      const remaining = p.timetag.days - TT.daysBetween(lastUse, key);
      if (remaining > 0) marks.push({ name: p.name, remaining });
    });
    return marks;
  }
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
    setWeekToast(t("\u2705 {recept} toegevoegd aan {dag} {datum}", { recept: recipe.name, dag: days[i], datum: fmtDay(key) }));
    setDaySheetRecipe(null);
    if (typeof setTimeout === "function") setTimeout(() => setWeekToast(""), 3500);
  }

  // Rij in de receptenlijst (ADR-013): naam + badges + meta (categorie, tijd, tags); klik opent bewerkte form.
  // product-kaart (ADR-017): inline uitgeklapt onder de rij waarop geklikt is (scherm 2B/8)

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
        note: s.want > 1 ? t("({a} van {b})", { a: s.want - s.have, b: s.want }) : "",
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
        label: t("Ingrediënten voor {gerecht}", { gerecht: r.name }),
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
      const dayKeys = [...new Set(parts.map((pp) => pp.dayKey).filter(Boolean))].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));
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
      if (doneK === rowsK.length) st[k] = { icon: "\u2705", title: t("Alle ingrediënten van dit gerecht zijn in huis") };
      else if (doneK > 0) st[k] = { icon: "\u2757", title: t("{n} van de {m} ingrediënten mist nog", { n: rowsK.length - doneK, m: rowsK.length }) };
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


  return {
    activeIngSuggest, activeMenuIds, activeSuggest, addCat, addExtraRowFn, addLocOpen, addLocation, addNewTag, addProdRow, addProdTag, addProductRow, addRecipe, addRecipeTag, addRecipeToWeek, addSheetOpen, addTagRule, allProductTags, allRuleTags, allTags, anyScaled, applyDeviation, applyImportReview, blockedByRules, buildShareName, bumpDeleted, bumpHave, bumpWant, byId, byLastEaten, calAnchor, calWeeks, catFilters, catMap, catOf, catOpen, catRank, catalog0, catsOpen, checked, checkedAt, clearRecipeFilters, commitDay, commitIngAmount, commitNewIngAmount, curWeekEnd, curWeekKeys, curWeekLabel, curWeekStart, dateSheetOpen, daySheetRecipe, dayTimetagMarks, days, deelChips, deelRapportLines, delenOpen, deleteLocation, deleteProduct, deleteProductCatalog, deleteRecipe, deleted, devPick, devTab, deviationKey, dishImgs, doMerge, doneItems, drafts, eatersOpen, editLoc, editRecipe, ensureDishFoto, ensureProduct, exportRecipes, exportShare, extraItems, extraSuggest, filterSheetOpen, filteredProducts, filteredRecipes, fishDays, fotoFor, generateMenu, goTab, hasRecipeFilters, haveOfProd, hiddenChecked, importRecipes, importReview, importShareFile, ingDrafts, ingFilter, ingQ, ingSuggest, instantProducts, isRowChecked, lastEaten, listRows, marketChip, marketOf, markets, maxShopDays, mealOk, mealStatus, mealWarn, menuByDate, mergeGroup, mergeKanjerId, moveCat, newCat, newExtra, newLocName, newProdRow, newRecipe, onDishFotoFile, openDay, openLocs, openMergeGroup, openProd, openProdCard, openRecipe, openSuggest, otherDays, pickDishFoto, pnBadgeMap, pnDupGroups, pnRecipesToMain, pnToast, pq, prepareImport, processChecked, prodById, prodByKey, prodEdit, prodOfLabel, prodQuery, prodRowSuggest, products, productsOf, recipeInfoOpen, recipeQuery, recipeSort, recipes, removeCat, removeDishFoto, removeProdTag, removeRecipeTag, removeTagRule, resetRecipes, resolveIng, resolveNewIng, reviewImport, rowVisible, rq, ruleDraft, rulesSheetOpen, safeExternalUrl, saveProductEdit, scaledFactors, scopeKeys, selectIngProduct, selectNewIngProduct, selectRecipe, setActiveIngSuggest, setActiveSuggest, setAddLocOpen, setAddProdRow, setAddSheetOpen, setCatFilters, setCatOpen, setCatsOpen, setChecked, setCheckedAtRaw, setCheckedRaw, setDateSheetOpen, setDay, setDaySheetRecipe, setDeelChips, setDelenOpen, setDeletedRaw, setDevPick, setDevTab, setDeviationKey, setDishImgs, setDrafts, setEaters, setEatersOpen, setEditLoc, setEditRecipe, setExtraItems, setExtraItemsRaw, setExtraSuggest, setFilterSheetOpen, setFotoFor, setHiddenChecked, setImportReview, setIngAmount, setIngDrafts, setIngFilter, setIngSuggest, setIngTags, setIngUnit, setMenuByDate, setMenuByDateRaw, setMergeGroup, setMergeKanjerId, setNewCat, setNewExtra, setNewIngAmount, setNewIngUnit, setNewLocName, setNewProdRow, setNewRecipe, setOpenDay, setOpenLocs, setOpenProd, setOpenRecipe, setOpenSuggest, setPnToast, setProdEdit, setProdQuery, setProdRowSuggest, setProducts, setProductsRaw, setRecipeInfoOpen, setRecipeQuery, setRecipeSort, setRecipes, setRecipesRaw, setRuleDraft, setRulesSheetOpen, setSettings, setSettingsRaw, setShareToast, setShopDays, setShopDone, setShopInfoOpen, setShopMarkets, setShowChecked, setSortMenuOpen, setStock, setStockInfoOpen, setStockLocations, setStockLocationsRaw, setStockRaw, setTab, setTagDraft, setTagFilters, setTagRuleDays, setTimeFilter, setUndoStack, setWeekOffset, setWeekToast, settings, shareToast, shopCats, shopDays, shopDaysEff, shopDone, shopInfoOpen, shopMarkets, shopMarketsEff, shoppingRows, showChecked, showFlatList, sortLast, sortMenuOpen, sortRowsByCat, stock, stockInfoOpen, stockLocations, stockShort, stored, tab, tagCounts, tagDraft, tagFilters, timeFilter, todayDayIdx, todayKey, todayLabel, toggleLoc, toggleTagFilter, topTags, totalItems, ttCtx, undoMerge, undoStack, unfilteredCount, updateMarket, updateRecipe, updateSettings, updateTakeawayLink, usageCount, vegaCount, visibleRows, weekEnd, weekEntries, weekKeys, weekLabel, weekOffset, weekStart, weekToast
  };
}

exports.useAppStore = useAppStore;
},
"src/domain/catalog.js": function (module, exports, require) {
const __imp0 = require("./recipes.js");
const { BASE_RECIPES } = __imp0;
const __imp1 = require("./stock.js");
const { STOCK_DEFAULT, normalizeExtras } = __imp1;
// Productcatalogus (ADR-017): product-sleutels, eenheden, parsing en schalen van ingrediënten.
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
      ...(p.timetag != null ? { timetag: p.timetag } : {}), // #58: timetag bewaren (raw; genormaliseerd bij gebruik via TT)
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


exports.priceKey = priceKey;
exports.UNITS = UNITS;
exports.UNIT_FACTOR = UNIT_FACTOR;
exports.UNIT_GROUP = UNIT_GROUP;
exports.productKey = productKey;
exports.parseIngredientLabel = parseIngredientLabel;
exports.PLURAL_EX = PLURAL_EX;
exports.pluralOf = pluralOf;
exports.convertAmount = convertAmount;
exports.roundAmt = roundAmt;
exports.normalizeAmountUnit = normalizeAmountUnit;
exports.normalizePack = normalizePack;
exports.shopDisplayAmount = shopDisplayAmount;
exports.normalizeProducts = normalizeProducts;
exports.buildCatalog = buildCatalog;
exports.migrateRecipesIngredients = migrateRecipesIngredients;
exports.pidOfName = pidOfName;
exports.ingUnit = ingUnit;
exports.ingLabel = ingLabel;
exports.matchProducts = matchProducts;
exports.scaleIng = scaleIng;
exports.matchRecipes = matchRecipes;
exports.NO_SCALE_UNITS = NO_SCALE_UNITS;
exports.scaleIngredient = scaleIngredient;
exports.fmtFactor = fmtFactor;
},
"src/domain/recipes.js": function (module, exports, require) {
// Receptenpool (ADR-006/ADR-013): startpool, timeCat-migratie en normalisatie.
const TIME_CATS = ["kort", "normaal", "lang"];

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


function loadRecipes(stored) {
  const edits = (stored && stored.edits) || {};
  if (stored && Array.isArray(stored.recipes) && stored.recipes.length > 0) {
    return stored.recipes.map((r) => normalizeRecipe({ ...r, ...(edits[r.id] || {}) }));
  }
  return BASE_RECIPES.map((r) => normalizeRecipe({ ...r, ...(edits[r.id] || {}) }));
}


exports.TIME_CATS = TIME_CATS;
exports.timeCatFromTime = timeCatFromTime;
exports.normalizeRecipe = normalizeRecipe;
exports.BASE_RECIPES = BASE_RECIPES;
exports.loadRecipes = loadRecipes;
},
"src/domain/stock.js": function (module, exports, require) {
// Voorraadmodel (ADR-015): locaties, standaardvoorraad en normalisatie.
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

exports.DEFAULT_LOCATIONS = DEFAULT_LOCATIONS;
exports.OLD_LOC_BY_CAT = OLD_LOC_BY_CAT;
exports.OLD_CAT_BY_CAT = OLD_CAT_BY_CAT;
exports.STOCK_DEFAULT = STOCK_DEFAULT;
exports.defaultStock = defaultStock;
exports.normalizeLocations = normalizeLocations;
exports.normalizeStock = normalizeStock;
exports.normalizeExtras = normalizeExtras;
},
"src/domain/dates.js": function (module, exports, require) {
// Datumhelpers voor de kalender: datum-sleutel YYYY-MM-DD (lokaal, zonder tijd).
// Dag- en maandnamen komen per taal uit de i18n-laag (src/i18n).
const __imp0 = require("../i18n/index.js");
const { dayNames, monthNamesShort, t } = __imp0;

const pad2 = (n) => String(n).padStart(2, "0");
const dateKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const fmtDay = (k) => `${k.slice(8)}-${k.slice(5, 7)}`; // "YYYY-MM-DD" -> "DD-MM"
const dayShortOf = (k) =>
  dayNames()[(new Date(Number(k.slice(0, 4)), Number(k.slice(5, 7)) - 1, Number(k.slice(8, 10))).getDay() + 1) % 7]
    .slice(0, 2)
    .toLowerCase(); // "YYYY-MM-DD" -> "vr"
const fmtShort = (d) => `${d.getDate()} ${monthNamesShort()[d.getMonth()]}`;
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
  if (!isoKey) return t("Onbekend");
  const p = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d); };
  const days = Math.round((p(todayK).getTime() - p(isoKey).getTime()) / 86400000);
  if (days <= 0) return t("vandaag");
  if (days === 1) return t("gisteren");
  if (days < 7) return t("{n} dagen geleden", { n: days });
  if (days < 56) return t("{n} wk geleden", { n: Math.floor(days / 7) });
  if (days < 365) return t("{n} mnd geleden", { n: Math.floor(days / 30) });
  return t("{n} jr geleden", { n: Math.floor(days / 365) });
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


exports.pad2 = pad2;
exports.dateKey = dateKey;
exports.fmtDay = fmtDay;
exports.dayShortOf = dayShortOf;
exports.fmtShort = fmtShort;
exports.jsDayOf = jsDayOf;
exports.startOfWeek = startOfWeek;
exports.addDays = addDays;
exports.weekStartFor = weekStartFor;
exports.weekDateKeys = weekDateKeys;
exports.agoLabel = agoLabel;
exports.weeksBetween = weeksBetween;
exports.monthGrid = monthGrid;
},
"src/i18n/index.js": function (module, exports, require) {
// i18n-laag: GUI-teksten per taal. De Nederlandse tekst is de sleutel (natural keys);
// vertalingen staan in nl.js / en.js / fr.js / de.js. Ontbreekt een sleutel in de actieve
// taal, dan valt t() terug op het Nederlands en uiteindelijk op de sleutel zelf.
const __imp0 = require("./nl.js");
const nl = __imp0.default;
const __imp1 = require("./en.js");
const en = __imp1.default;
const __imp2 = require("./fr.js");
const fr = __imp2.default;
const __imp3 = require("./de.js");
const de = __imp3.default;

const LANGUAGES = [
  { code: "nl", label: "Nederlands" },
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
];
const DEFAULT_LANGUAGE = "nl";

const DICTS = { nl, en, fr, de };
let current = DEFAULT_LANGUAGE;

function isLanguage(lang) {
  return Object.prototype.hasOwnProperty.call(DICTS, lang);
}
function setLanguage(lang) {
  if (isLanguage(lang)) current = lang;
}
function getLanguage() {
  return current;
}

// t("Tekst met {plaatsaanduiding}", { plaatsaanduiding: waarde }) -> vertaalde string
function t(key, vars) {
  const dict = DICTS[current];
  let s = dict && Object.prototype.hasOwnProperty.call(dict, key) ? dict[key] : undefined;
  if (s == null && current !== DEFAULT_LANGUAGE) s = nl[key];
  if (s == null) s = key;
  if (typeof s !== "string") return s;
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return s;
}

// Dagnamen/maandnamen per taal (kalender en weekmenu)
function dayNames() {
  return (DICTS[current] && DICTS[current].days) || nl.days;
}
function monthNames() {
  return (DICTS[current] && DICTS[current].months) || nl.months;
}
function monthNamesShort() {
  return (DICTS[current] && DICTS[current].monthsShort) || nl.monthsShort;
}

exports.LANGUAGES = LANGUAGES;
exports.DEFAULT_LANGUAGE = DEFAULT_LANGUAGE;
exports.isLanguage = isLanguage;
exports.setLanguage = setLanguage;
exports.getLanguage = getLanguage;
exports.t = t;
exports.dayNames = dayNames;
exports.monthNames = monthNames;
exports.monthNamesShort = monthNamesShort;
},
"src/i18n/nl.js": function (module, exports, require) {
// Nederlands (standaardtaal, ADR-023): de sleutel is de Nederlandse tekst zelf.
// Dag- en maandnamen horen hier ook bij (kalender/weergave).
module.exports.default = {
  days: ["Zaterdag", "Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag"],
  months: ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"],
  monthsShort: ["jan", "feb", "mrt", "apr", "mei", "jun", "jul", "aug", "sep", "okt", "nov", "dec"],
  " (tik om te sluiten).": " (tik om te sluiten).",
  " d": " d",
  " dagen": " dagen",
  " duplicaatgroep(en) gevonden": " duplicaatgroep(en) gevonden",
  " eters": " eters",
  " producten · A–Z": " producten · A–Z",
  " van ": " van ",
  " vega · ": " vega · ",
  " vlees": " vlees",
  " voor deze dag": " voor deze dag",
  " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).": " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).",
  " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)",
  " · vandaag": " · vandaag",
  " · ❗ {w} mist nog iets": " · ❗ {w} mist nog iets",
  " — boodschappenlijst toont alleen hele verpakkingen": " — boodschappenlijst toont alleen hele verpakkingen",
  " — niets nieuws in het bestand": " — niets nieuws in het bestand",
  "\" → uit bestand \"": "\" → uit bestand \"",
  "#35: per 1 ": "#35: per 1 ",
  "({a} van {b})": "({a} van {b})",
  "+ Bestelsite toevoegen": "+ Bestelsite toevoegen",
  "+ Supermarkt toevoegen": "+ Supermarkt toevoegen",
  "14 dagen": "14 dagen",
  "3 dagen": "3 dagen",
  "30 dagen": "30 dagen",
  "7 dagen": "7 dagen",
  ": hier \"": ": hier \"",
  "Aantal": "Aantal",
  "Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven": "Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven",
  "Aantal eters": "Aantal eters",
  "Aantal eters deze dag": "Aantal eters deze dag",
  "Aantal keer gebruikt": "Aantal keer gebruikt",
  "Aantal vega-dagen (op niet-vis-dagen)": "Aantal vega-dagen (op niet-vis-dagen)",
  "Afhaalmaaltijd": "Afhaalmaaltijd",
  "Afhaalmaaltijd · weekplan schuift 1 dag op": "Afhaalmaaltijd · weekplan schuift 1 dag op",
  "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.": "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.",
  "Afwijking van het weekplan (geen/weinig energie vandaag)": "Afwijking van het weekplan (geen/weinig energie vandaag)",
  "Afwijking · ": "Afwijking · ",
  "Alle ingrediënten van dit gerecht zijn in huis": "Alle ingrediënten van dit gerecht zijn in huis",
  "Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?": "Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?",
  "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.": "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.",
  "Alle": "Alle",
  "Alles": "Alles",
  "Alles afgevinkt — toon de rijen met de chip hierboven.": "Alles afgevinkt — toon de rijen met de chip hierboven.",
  "Alles wissen": "Alles wissen",
  "Annuleren": "Annuleren",
  "Artikel verwijderen": "Artikel verwijderen",
  "Bereiding": "Bereiding",
  "Bereiding (optioneel)": "Bereiding (optioneel)",
  "Bereidingstijd": "Bereidingstijd",
  "Bereiding…": "Bereiding…",
  "Bestand overnemen": "Bestand overnemen",
  "Bestand overnemen (importeren)": "Bestand overnemen (importeren)",
  "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.",
  "Bestelsite verwijderen": "Bestelsite verwijderen",
  "Bevestig · weekplan schuift 1 dag op": "Bevestig · weekplan schuift 1 dag op",
  "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.": "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.",
  "Boodschappen": "Boodschappen",
  "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.": "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.",
  "Categorie": "Categorie",
  "Categorie verwijderen": "Categorie verwijderen",
  "Categorieën": "Categorieën",
  "Categorieën beheren": "Categorieën beheren",
  "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.": "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.",
  "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.": "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.": "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.",
  "Deelbestand maken (exporteren)": "Deelbestand maken (exporteren)",
  "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).",
  "Dit verandert er als je samenvoegt:": "Dit verandert er als je samenvoegt:",
  "Eenheid (alleen converteerbare eenheden wijzigbaar)": "Eenheid (alleen converteerbare eenheden wijzigbaar)",
  "Eenheid (standaard bij dit product)": "Eenheid (standaard bij dit product)",
  "Eenheid van de inhoud": "Eenheid van de inhoud",
  "Eenheid van het product": "Eenheid van het product",
  "Eetpatroon": "Eetpatroon",
  "Eters & supermarkten → Instellingen": "Eters & supermarkten → Instellingen",
  "Exporteren": "Exporteren",
  "Extra's": "Extra's",
  "Filters": "Filters",
  "Foto opslaan mislukt: {fout}": "Foto opslaan mislukt: {fout}",
  "Geen boodschappen voor deze dag": "Geen boodschappen voor deze dag",
  "Geen producten gevonden.": "Geen producten gevonden.",
  "Genereer weekmenu": "Genereer weekmenu",
  "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot": "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot",
  "Gewenste voorraad aanpassen": "Gewenste voorraad aanpassen",
  "Hetzelfde gerecht opnieuw plannen na": "Hetzelfde gerecht opnieuw plannen na",
  "Hoe werkt de boodschappenlijst?": "Hoe werkt de boodschappenlijst?",
  "Hoe werkt de voorraad?": "Hoe werkt de voorraad?",
  "Hoe werkt zoeken en filteren?": "Hoe werkt zoeken en filteren?",
  "Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.",
  "Huidige voorraad": "Huidige voorraad",
  "Huishouden": "Huishouden",
  "Importeren": "Importeren",
  "Ingrediënt bevat": "Ingrediënt bevat",
  "Ingrediënt verwijderen": "Ingrediënt verwijderen",
  "Ingrediënten": "Ingrediënten",
  "Ingrediënten voor {gerecht}": "Ingrediënten voor {gerecht}",
  "Inhoud per verpakking": "Inhoud per verpakking",
  "Instant-maaltijd: {lijst}": "Instant-maaltijd: {lijst}",
  "Instellingen": "Instellingen",
  "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (": "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (",
  "Instellingen · vinkjes · verwijderingen": "Instellingen · vinkjes · verwijderingen",
  "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.": "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.",
  "Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.": "Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):": "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):",
  "Kies een dag deze week": "Kies een dag deze week",
  "Kies een datum": "Kies een datum",
  "Kies uit de voorraad": "Kies uit de voorraad",
  "Klaar": "Klaar",
  "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.": "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.",
  "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).": "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).",
  "Laatst gegeten: {datum}": "Laatst gegeten: {datum}",
  "Locatie toevoegen": "Locatie toevoegen",
  "Locaties": "Locaties",
  "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.": "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.",
  "Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)": "Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)",
  "Naam": "Naam",
  "Naam van de locatie…": "Naam van de locatie…",
  "Naam…": "Naam…",
  "Naar deze week": "Naar deze week",
  "Niets te halen bij {winkels}": "Niets te halen bij {winkels}",
  "Nieuw recept": "Nieuw recept",
  "Nieuwe categorie…": "Nieuwe categorie…",
  "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.": "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.",
  "Nog geen producten in deze locatie.": "Nog geen producten in deze locatie.",
  "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.": "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.",
  "Nog niets afgevinkt — vink de gehaalde artikelen af.": "Nog niets afgevinkt — vink de gehaalde artikelen af.",
  "Nog nooit vergrendeld gegeten": "Nog nooit vergrendeld gegeten",
  "Onbekend": "Onbekend",
  "Ontgrendelen": "Ontgrendelen",
  "Opslaan": "Opslaan",
  "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.": "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.",
  "Per-recept tag (geldt alleen in dit recept, #59)": "Per-recept tag (geldt alleen in dit recept, #59)",
  "Product verwijderen": "Product verwijderen",
  "Productcatalogus in-/uitklappen (#44)": "Productcatalogus in-/uitklappen (#44)",
  "Producten": "Producten",
  "Producten ({n})": "Producten ({n})",
  "Producten samenvoegen (#59)": "Producten samenvoegen (#59)",
  "Productnaam…": "Productnaam…",
  "Recept bewerken": "Recept bewerken",
  "Recept toevoegen": "Recept toevoegen",
  "Recept verwijderen": "Recept verwijderen",
  "Recepten": "Recepten",
  "Recepten ({n})": "Recepten ({n})",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.": "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.",
  "Regel toevoegen": "Regel toevoegen",
  "Regel verwijderen": "Regel verwijderen",
  "Regels voor het weekmenu": "Regels voor het weekmenu",
  "Samengevoegd naar “{naam}”": "Samengevoegd naar “{naam}”",
  "Samenvoegen": "Samenvoegen",
  "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.": "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.",
  "Samenvoegen geweigerd: {fout}": "Samenvoegen geweigerd: {fout}",
  "Samenvoegen\\u2026": "Samenvoegen\\u2026",
  "Sorteren": "Sorteren",
  "Standaard geselecteerd op de boodschappenlijst": "Standaard geselecteerd op de boodschappenlijst",
  "Standaard herstellen": "Standaard herstellen",
  "Standaardeenheid": "Standaardeenheid",
  "Standaardlijst terug": "Standaardlijst terug",
  "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.": "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.",
  "Supermarkten": "Supermarkten",
  "Tag verwijderen": "Tag verwijderen",
  "Tag-regels (bij automatisch plannen)": "Tag-regels (bij automatisch plannen)",
  "Tags": "Tags",
  "Tags (alle geselecteerde moeten erop — AND)": "Tags (alle geselecteerde moeten erop — AND)",
  "Thema van de app — lokaal opgeslagen per huishouden (#40).": "Thema van de app — lokaal opgeslagen per huishouden (#40).",
  "Thema {thema}": "Thema {thema}",
  "Timetag (optioneel, #58)": "Timetag (optioneel, #58)",
  "Toevoegen": "Toevoegen",
  "Toevoegen aan een onvergrendelde dag van deze week": "Toevoegen aan een onvergrendelde dag van deze week",
  "Toon alle supermarkten": "Toon alle supermarkten",
  "Toon {n} recepten": "Toon {n} recepten",
  "Typ een gerecht…": "Typ een gerecht…",
  "URL…": "URL…",
  "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)": "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)",
  "Uitleg over delen via bestand": "Uitleg over delen via bestand",
  "VANDAAG": "VANDAAG",
  "Vega-dagen op de overige ": "Vega-dagen op de overige ",
  "Vergrendelen": "Vergrendelen",
  "Verwerk update": "Verwerk update",
  "Verwijderen": "Verwijderen",
  "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten": "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten",
  "Vinkjes wissen": "Vinkjes wissen",
  "Vis-dagen:": "Vis-dagen:",
  "Visdagen": "Visdagen",
  "Volgende week ▶": "Volgende week ▶",
  "Voorkeurssupermarkt": "Voorkeurssupermarkt",
  "Voorraad": "Voorraad",
  "Voorraad ({n})": "Voorraad ({n})",
  "Wat gaat er mee? (tik om aan/uit te zetten)": "Wat gaat er mee? (tik om aan/uit te zetten)",
  "Week start op": "Week start op",
  "Week van ": "Week van ",
  "Weekmenu": "Weekmenu",
  "Weekmenu & Boodschappen": "Weekmenu & Boodschappen",
  "Weekmenu & Boodschappenlijst": "Weekmenu & Boodschappenlijst",
  "Weekmenu ({n} dagen)": "Weekmenu ({n} dagen)",
  "Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat.": "Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat.",
  "Weekstart": "Weekstart",
  "Weergave": "Weergave",
  "Winkelvoorkeur": "Winkelvoorkeur",
  "Winkelvoorkeur: dit artikel wordt daar gehaald": "Winkelvoorkeur: dit artikel wordt daar gehaald",
  "Wis filters": "Wis filters",
  "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.",
  "Zoek op receptnaam…": "Zoek op receptnaam…",
  "Zoek product…": "Zoek product…",
  "Zoekopdracht wissen": "Zoekopdracht wissen",
  "\\u00d7": "\\u00d7",
  "\\u2715": "\\u2715",
  "\\u27f2 Ongedaan maken": "\\u27f2 Ongedaan maken",
  "\\uff0b tag toevoegen\\u2026": "\\uff0b tag toevoegen\\u2026",
  "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt": "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt",
  "altijd": "altijd",
  "bijv. 500": "bijv. 500",
  "bijv. zalm, ui, kaas…": "bijv. zalm, ui, kaas…",
  "boodschappenlijst ×": "boodschappenlijst ×",
  "cat.": "cat.",
  "cat.extra": "Extra",
  "cat.vega": "Vega",
  "cat.vis": "Vis",
  "cat.vlees": "Vlees",
  "dagen": "dagen",
  "de geselecteerde supermarkt": "de geselecteerde supermarkt",
  "deze week": "deze week",
  "geen": "geen",
  "geen ingredienten bekend": "geen ingredienten bekend",
  "geen ingrediënten bekend": "geen ingrediënten bekend",
  "gewenst": "gewenst",
  "gisteren": "gisteren",
  "have ": "have ",
  "nog geen tag-regels": "nog geen tag-regels",
  "nog geen tags in de pool": "nog geen tags in de pool",
  "op lijst": "op lijst",
  "overig": "overig",
  "sleutel…": "sleutel…",
  "standaard": "standaard",
  "standaard: ": "standaard: ",
  "tag…": "tag…",
  "time.": "time.",
  "time.kort": "kort",
  "time.lang": "lang",
  "time.normaal": "normaal",
  "toon": "toon",
  "vandaag": "vandaag",
  "verberg": "verberg",
  "{done} van {total} afgevinkt": "{done} van {total} afgevinkt",
  "{naam}: nog {n} dag(en) binnen de timetag": "{naam}: nog {n} dag(en) binnen de timetag",
  "{n} afgevinkt · {actie} ▾": "{n} afgevinkt · {actie} ▾",
  "{n} blijft": "{n} blijft",
  "{n} dagen geleden": "{n} dagen geleden",
  "{n} eters": "{n} eters",
  "{n} jr geleden": "{n} jr geleden",
  "{n} mnd geleden": "{n} mnd geleden",
  "{n} nieuw": "{n} nieuw",
  "{n} nieuwer uit bestand": "{n} nieuwer uit bestand",
  "{n} product": "{n} product",
  "{n} producten": "{n} producten",
  "{n} van de {m} ingrediënten mist nog": "{n} van de {m} ingrediënten mist nog",
  "{n} verwijderd": "{n} verwijderd",
  "{n} wk geleden": "{n} wk geleden",
  "×": "×",
  "× gebruikt (recepten, voorraad, extra)": "× gebruikt (recepten, voorraad, extra)",
  "× nieuwste wint — zo nodig hierna zelf herstellen:": "× nieuwste wint — zo nodig hierna zelf herstellen:",
  "” als eigen tekst opslaan (geen boodschappen)": "” als eigen tekst opslaan (geen boodschappen)",
  "↵ Enter — “": "↵ Enter — “",
  "⇅ Sorteer ▾": "⇅ Sorteer ▾",
  "◀ Vorige week": "◀ Vorige week",
  "⚙ Filters ▾": "⚙ Filters ▾",
  "⚙️ Regels voor het weekmenu": "⚙️ Regels voor het weekmenu",
  "⚠️ Dit bestand kon niet worden gelezen.": "⚠️ Dit bestand kon niet worden gelezen.",
  "⚠️ Dit is geen deelbestand van de weekmenu-app.": "⚠️ Dit is geen deelbestand van de weekmenu-app.",
  "⚡ Instant uit voorraad": "⚡ Instant uit voorraad",
  "✅ Samengevoegd": "✅ Samengevoegd",
  "✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)",
  "✅ {recept} toegevoegd aan {dag} {datum}": "✅ {recept} toegevoegd aan {dag} {datum}",
  "✓ Alles aangevuld": "✓ Alles aangevuld",
  "✓ Naam (A–Z)": "✓ Naam (A–Z)",
  "✕ Foto verwijderen": "✕ Foto verwijderen",
  "➖ Niets nieuws in dit bestand.": "➖ Niets nieuws in dit bestand.",
  "🍔 Afhaalmaaltijd": "🍔 Afhaalmaaltijd",
  "🍽️ gerecht": "🍽️ gerecht",
  "🏷️ product": "🏷️ product",
  "📅 Kies een datum ▾": "📅 Kies een datum ▾",
  "📍 geen boodschappen": "📍 geen boodschappen",
  "📤 Maak deelbestand": "📤 Maak deelbestand",
  "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.": "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.",
  "📦 Productcatalogus": "📦 Productcatalogus",
  "📷 Foto toevoegen": "📷 Foto toevoegen",
  "📷 Vervangen": "📷 Vervangen",
  "🕒 Laatst gegeten": "🕒 Laatst gegeten",
  "🕒 Laatst gegeten (langst geleden eerst)": "🕒 Laatst gegeten (langst geleden eerst)",
  "🛵 Afhaalmaaltijden (bestelsites)": "🛵 Afhaalmaaltijden (bestelsites)",
  "＋ Ingrediënt toevoegen": "＋ Ingrediënt toevoegen",
  "＋ Locatie toevoegen": "＋ Locatie toevoegen",
  "＋ Product toevoegen": "＋ Product toevoegen",
  "＋ tag toevoegen…": "＋ tag toevoegen…",
  "Taal {taal}": "Taal {taal}",
  "Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).": "Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).",
  "Taal": "Taal",
};

},
"src/i18n/en.js": function (module, exports, require) {
// English translations. Keys are the Dutch source strings (see nl.js / the JSX sources).
module.exports.default = {
  days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  monthsShort: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
  " (tik om te sluiten).": " (tap to close).",
  " \\u00b7 \\u2757 {w} mist nog iets": " · ❗ {w} still missing",
  " \\u00b7 alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · only unlocked days selectable (🔒 = locked)",
  " \\u00b7 vandaag": " · today",
  " \\u2014 boodschappenlijst toont alleen hele verpakkingen": " — shopping list only shows whole packages",
  " \\u2014 niets nieuws in het bestand": " — nothing new in the file",
  " d": " d",
  " dagen": " days",
  " duplicaatgroep(en) gevonden": " duplicate group(s) found",
  " eters": " eaters",
  " producten \\u00b7 A\\u2013Z": " products · A–Z",
  " producten · A–Z": " products · A–Z",
  " van ": " of ",
  " vega \\u00b7 ": " vega · ",
  " vega · ": " vega · ",
  " vlees": " meat",
  " voor deze dag": " for this day",
  " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).": " is assigned to the chosen day (an unlocked dish there is overwritten).",
  " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · only unlocked days selectable (🔒 = locked)",
  " · vandaag": " · today",
  " · ❗ {w} mist nog iets": " · ❗ {w} still missing",
  " — boodschappenlijst toont alleen hele verpakkingen": " — shopping list only shows whole packages",
  " — niets nieuws in het bestand": " — nothing new in the file",
  "\" \\u2192 uit bestand \"": "\" → from file \"",
  "\" → uit bestand \"": "\" → from file \"",
  "#35: per 1 ": "#35: per 1 ",
  "({a} van {b})": "({a} of {b})",
  "+ Bestelsite toevoegen": "+ Add order site",
  "+ Supermarkt toevoegen": "+ Add supermarket",
  "14 dagen": "14 days",
  "3 dagen": "3 days",
  "30 dagen": "30 days",
  "7 dagen": "7 days",
  ": hier \"": ": here \"",
  "Aantal": "Amount",
  "Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven": "Number of duplicates in the catalog — merge via the notification above",
  "Aantal duplicaten in de catalogus — samenvoegen via de melding hierboven": "Number of duplicates in the catalog — merge via the notification above",
  "Aantal eters": "Number of eaters",
  "Aantal eters deze dag": "Number of eaters this day",
  "Aantal keer gebruikt": "Times used",
  "Aantal vega-dagen (op niet-vis-dagen)": "Number of vega days (on non-fish days)",
  "Afhaalmaaltijd": "Takeaway",
  "Afhaalmaaltijd \\u00b7 weekplan schuift 1 dag op": "Takeaway · week plan shifts 1 day",
  "Afhaalmaaltijd · weekplan schuift 1 dag op": "Takeaway · week plan shifts 1 day",
  "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.": "Just check off. \"Process update\" processes the checked items (stock is updated, rows hidden) and shows per dish in the week menu whether everything is in stock; \"Clear checkboxes\" resets everything.",
  "Afwijking \\u00b7 ": "Deviation · ",
  "Afwijking van het weekplan (geen/weinig energie vandaag)": "Deviation from the week plan (no/little energy today)",
  "Afwijking · ": "Deviation · ",
  "Alle": "All",
  "Alle ingredi\\u00ebnten van dit gerecht zijn in huis": "All ingredients of this dish are in stock",
  "Alle ingrediënten van dit gerecht zijn in huis": "All ingredients of this dish are in stock",
  "Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?": "Reset all recipe changes to the original list?",
  "Alleen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 worden getoond.": "Only products with tag “instant-maaltijd” and have > 0 are shown.",
  "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.": "Only products with tag “instant-maaltijd” and have > 0 are shown.",
  "Alles": "All",
  "Alles afgevinkt \\u2014 toon de rijen met de chip hierboven.": "All checked — show the rows with the chip above.",
  "Alles afgevinkt — toon de rijen met de chip hierboven.": "All checked — show the rows with the chip above.",
  "Alles wissen": "Clear all",
  "Annuleren": "Cancel",
  "Artikel verwijderen": "Remove item",
  "Bereiding": "Preparation",
  "Bereiding (optioneel)": "Preparation (optional)",
  "Bereiding\\u2026": "Preparation…",
  "Bereidingstijd": "Preparation time",
  "Bereiding…": "Preparation…",
  "Bestand overnemen": "Import file",
  "Bestand overnemen (importeren)": "Import file (import)",
  "Bestandsnaam: weekmenu-delen-v1-\\u2026.json \\u2014 daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "File name: weekmenu-share-v1-….json — then share the file yourself (WhatsApp, e-mail, AirDrop). Sharing outside the household? Turn everything off except Recipes.",
  "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "File name: weekmenu-share-v1-….json — then share the file yourself (WhatsApp, e-mail, AirDrop). Sharing outside the household? Turn everything off except Recipes.",
  "Bestelsite verwijderen": "Remove order site",
  "Bevestig \\u00b7 weekplan schuift 1 dag op": "Confirm · week plan shifts 1 day",
  "Bevestig · weekplan schuift 1 dag op": "Confirm · week plan shifts 1 day",
  "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.": "For vegetables/dairy you see the date it is needed by (limited shelf life). Shortfalls from stock (\"n of want\") are automatically added to the list.",
  "Boodschappen": "Shopping",
  "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.": "At the top you choose for how many days you shop and at which supermarket(s). Items with a store preference for another supermarket are hidden.",
  "Categorie": "Category",
  "Categorie verwijderen": "Delete category",
  "Categorie\\u00ebn": "Categories",
  "Categorie\\u00ebn beheren": "Manage categories",
  "Categorieën": "Categories",
  "Categorieën beheren": "Manage categories",
  "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.": "The category says where the product is in the supermarket (editable under Shopping). A tagged store means: it is preferably bought there; price comparison is then pointless.",
  "De lijst is \\u00e9\\u00e9n platte lijst op categorie-volgorde (zie \\u2699\\ufe0f) \\u2014 ingredi\\u00ebnt, voorraad of extra artikel maakt niet uit.": "The list is one flat list in category order (see ⚙️) — ingredient, stock or extra item doesn't matter.",
  "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.": "The list is one flat list in category order (see ⚙️) — ingredient, stock or extra item doesn't matter.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt \\u2014 tortilla en kroepoek horen daarom bij \\u201c(maaltijd)saus\\u201d.": "The order is the order on the shopping list. A category says where an item is in the supermarket — tortilla and kroepoek therefore belong to “(meal)sauce”.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.": "The order is the order on the shopping list. A category says where an item is in the supermarket — tortilla and kroepoek therefore belong to “(meal)sauce”.",
  "Deelbestand maken (exporteren)": "Create share file (export)",
  "Deze linkjes verschijnen bij \\u201cAfwijking van het weekplan\\u201d \\u2192 afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "These links appear under “Deviation from the week plan” → takeaway (#42). Stored locally only (ADR-010).",
  "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "These links appear under “Deviation from the week plan” → takeaway (#42). Stored locally only (ADR-010).",
  "Dit verandert er als je samenvoegt:": "This is what changes when you merge:",
  "Eenheid (alleen converteerbare eenheden wijzigbaar)": "Unit (only convertible units editable)",
  "Eenheid (standaard bij dit product)": "Unit (default for this product)",
  "Eenheid van de inhoud": "Unit of the contents",
  "Eenheid van het product": "Unit of the product",
  "Eetpatroon": "Eating pattern",
  "Eters & supermarkten \\u2192 Instellingen": "Eaters & supermarkets → Settings",
  "Eters & supermarkten → Instellingen": "Eaters & supermarkets → Settings",
  "Exporteren": "Export",
  "Extra's": "Extras",
  "Filters": "Filters",
  "Foto opslaan mislukt: {fout}": "Saving photo failed: {fout}",
  "Geen boodschappen voor deze dag": "No groceries for this day",
  "Geen producten gevonden.": "No products found.",
  "Genereer weekmenu": "Generate week menu",
  "Gerecht bekijken (ingredi\\u00ebnten + bereiding) \\u2014 ontgrendelen via het slot": "View dish (ingredients + preparation) — unlock via the lock",
  "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot": "View dish (ingredients + preparation) — unlock via the lock",
  "Gewenste voorraad aanpassen": "Adjust desired stock",
  "Hetzelfde gerecht opnieuw plannen na": "Re-plan the same dish after",
  "Hoe werkt de boodschappenlijst?": "How does the shopping list work?",
  "Hoe werkt de voorraad?": "How does stock work?",
  "Hoe werkt zoeken en filteren?": "How do search and filters work?",
  "Hoeveelheden geschaald voor afwijkende eters (\\u00d7{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Quantities scaled for deviating eaters (×{f} vs standard {n} eaters); rules without a number stay the same.",
  "Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Quantities scaled for deviating eaters (×{f} vs standard {n} eaters); rules without a number stay the same.",
  "Huidige voorraad": "Current stock",
  "Huishouden": "Household",
  "Importeren": "Import",
  "Ingredi\\u00ebnt bevat": "Ingredient contains",
  "Ingredi\\u00ebnt verwijderen": "Remove ingredient",
  "Ingredi\\u00ebnten": "Ingredients",
  "Ingredi\\u00ebnten voor {gerecht}": "Ingredients for {gerecht}",
  "Ingrediënt bevat": "Ingredient contains",
  "Ingrediënt verwijderen": "Remove ingredient",
  "Ingrediënten": "Ingredients",
  "Ingrediënten voor {gerecht}": "Ingredients for {gerecht}",
  "Inhoud per verpakking": "Contents per package",
  "Instant-maaltijd: {lijst}": "Instant meal: {lijst}",
  "Instellingen": "Settings",
  "Instellingen \\u00b7 vinkjes \\u00b7 verwijderingen": "Settings · checkboxes · deletions",
  "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (": "Settings per household. They are stored only locally on this device (localStorage) and apply directly to the week menu and shopping list. Day index 0 is the week start (",
  "Instellingen · vinkjes · verwijderingen": "Settings · checkboxes · deletions",
  "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.": "Is the current stock lower than desired? Then the product is automatically on the shopping list.",
  "Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.": "Choose the keeper (the product that is retained). Recipe links move to the keeper; variants from the name are suggested as per-recipe tags.",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen \\u2192 🛵 Afhaalmaaltijden):": "Choose an order site (opens in browser; manage via Settings → 🛵 Takeaway):",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):": "Choose an order site (opens in browser; manage via Settings → 🛵 Takeaway):",
  "Kies een dag deze week": "Choose a day this week",
  "Kies een datum": "Choose a date",
  "Kies uit de voorraad": "Choose from stock",
  "Klaar": "Done",
  "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.": "Click a day to jump to that day's week. 🔒 = locked dish, kept per date.",
  "Klik op een locatie om de producten te zien; \\uff0b onderaan een locatie voegt een product toe (altijd te verwijderen met \\u2715).": "Click a location to see its products; ＋ at the bottom of a location adds a product (always removable with ✕).",
  "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).": "Click a location to see its products; ＋ at the bottom of a location adds a product (always removable with ✕).",
  "Laatst gegeten: {datum}": "Last eaten: {datum}",
  "Locatie toevoegen": "Add location",
  "Locaties": "Locations",
  "Locaties (voorraadkast, koelkast\\u2026) zijn per huishouden: voeg toe met \\uff0b onderaan, verwijder met 🗑\\ufe0f \\u2014 pas als er geen producten meer aan hangen.": "Locations (pantry, fridge…) are per household: add with ＋ at the bottom, remove with 🗑️ — only when no products are attached anymore.",
  "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.": "Locations (pantry, fridge…) are per household: add with ＋ at the bottom, remove with 🗑️ — only when no products are attached anymore.",
  "Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)": "Minimum number of days between two uses of this product in the week menu (0 = no time tag, max 365)",
  "Naam": "Name",
  "Naam van de locatie\\u2026": "Location name…",
  "Naam van de locatie…": "Location name…",
  "Naam\\u2026": "Name…",
  "Naam…": "Name…",
  "Naar deze week": "To this week",
  "Niets te halen bij {winkels}": "Nothing to get at {winkels}",
  "Nieuw recept": "New recipe",
  "Nieuwe categorie\\u2026": "New category…",
  "Nieuwe categorie…": "New category…",
  "Nog geen bestelsites geconfigureerd \\u2014 voeg toe via Instellingen \\u2192 🛵 Afhaalmaaltijden.": "No order sites configured yet — add via Settings → 🛵 Takeaway.",
  "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.": "No order sites configured yet — add via Settings → 🛵 Takeaway.",
  "Nog geen producten in deze locatie.": "No products in this location yet.",
  "Nog geen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 \\u2014 tag toekennen via de product-kaart.": "No products with tag “instant-maaltijd” and have > 0 yet — assign a tag via the product card.",
  "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.": "No products with tag “instant-maaltijd” and have > 0 yet — assign a tag via the product card.",
  "Nog niets afgevinkt \\u2014 vink de gehaalde artikelen af.": "Nothing checked off yet — check off the purchased items.",
  "Nog niets afgevinkt — vink de gehaalde artikelen af.": "Nothing checked off yet — check off the purchased items.",
  "Nog nooit vergrendeld gegeten": "Never eaten yet",
  "Onbekend": "Unknown",
  "Ontgrendelen": "Unlock",
  "Opslaan": "Save",
  "Per product stel je de huidige voorraad in met \\u2212/+; de gewenste voorraad staat grijs erachter (\\u201cgewenst n\\u201d). Met \\u270f\\ufe0f achter de locatie pas je de gewenste hoeveelheden aan.": "Per product you set the current stock with −/+; the desired stock is shown grey behind it (“desired n”). With ✏️ behind the location you adjust the desired quantities.",
  "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.": "Per product you set the current stock with −/+; the desired stock is shown grey behind it (“desired n”). With ✏️ behind the location you adjust the desired quantities.",
  "Per-recept tag (geldt alleen in dit recept, #59)": "Per-recipe tag (only applies in this recipe, #59)",
  "Product verwijderen": "Delete product",
  "Productcatalogus in-/uitklappen (#44)": "Expand/collapse product catalog (#44)",
  "Producten": "Products",
  "Producten ({n})": "Products ({n})",
  "Producten samenvoegen (#59)": "Merge products (#59)",
  "Productnaam\\u2026": "Product name…",
  "Productnaam…": "Product name…",
  "Recept bewerken": "Edit recipe",
  "Recept toevoegen": "Add recipe",
  "Recept verwijderen": "Delete recipe",
  "Recepten": "Recipes",
  "Recepten ({n})": "Recipes ({n})",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als \\u00e9\\u00e9n chip mee.": "Recipes, products, stock and week menu can be chosen separately. Checkboxes, deletions and settings belong together and are included as one chip.",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.": "Recipes, products, stock and week menu can be chosen separately. Checkboxes, deletions and settings belong together and are included as one chip.",
  "Regel toevoegen": "Add rule",
  "Regel verwijderen": "Remove rule",
  "Regels voor het weekmenu": "Rules for the week menu",
  "Samengevoegd naar \\u201c{naam}\\u201d": "Merged into “{naam}”",
  "Samengevoegd naar “{naam}”": "Merged into “{naam}”",
  "Samenvoegen": "Merge",
  "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.": "× newest wins — restore manually afterwards if needed:",
  "Samenvoegen geweigerd: {fout}": "Merge refused: {fout}",
  "Samenvoegen\\u2026": "Merging…",
  "Samenvoegen…": "Merging…",
  "Sorteren": "Sort",
  "Standaard geselecteerd op de boodschappenlijst": "Selected by default on the shopping list",
  "Standaard herstellen": "Restore default",
  "Standaardeenheid": "Default unit",
  "Standaardlijst terug": "Restore default list",
  "Stel eerst een weekmenu samen; de ingredi\\u00ebnten verschijnen dan hier automatisch.": "First compose a week menu; the ingredients then appear here automatically.",
  "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.": "First compose a week menu; the ingredients then appear here automatically.",
  "Supermarkten": "Supermarkets",
  "Tag verwijderen": "Remove tag",
  "Tag-regels (bij automatisch plannen)": "Tag rules (when auto-planning)",
  "Tags": "Tags",
  "Tags (alle geselecteerde moeten erop \\u2014 AND)": "Tags (all selected must match — AND)",
  "Tags (alle geselecteerde moeten erop — AND)": "Tags (all selected must match — AND)",
  "Thema van de app \\u2014 lokaal opgeslagen per huishouden (#40).": "App theme — stored locally per household (#40).",
  "Thema van de app — lokaal opgeslagen per huishouden (#40).": "App theme — stored locally per household (#40).",
  "Thema {thema}": "Theme {thema}",
  "Timetag (optioneel, #58)": "Time tag (optional, #58)",
  "Toevoegen": "Add",
  "Toevoegen aan een onvergrendelde dag van deze week": "Add to an unlocked day of this week",
  "Toon alle supermarkten": "Show all supermarkets",
  "Toon {n} recepten": "Show {n} recipes",
  "Typ een gerecht\\u2026": "Type a dish…",
  "Typ een gerecht…": "Type a dish…",
  "URL\\u2026": "URL…",
  "URL…": "URL…",
  "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)": "Remove from catalog (links fall back to free text)",
  "Uitleg over delen via bestand": "Explanation about sharing via file",
  "VANDAAG": "TODAY",
  "Vega-dagen op de overige ": "Vega days on the remaining ",
  "Vergrendelen": "Lock",
  "Verwerk update": "Process update",
  "Verwijderen": "Delete",
  "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten": "Delete only possible when no more products/items are in this category",
  "Vinkjes wissen": "Clear checkboxes",
  "Vis-dagen:": "Fish days:",
  "Visdagen": "Fish days",
  "Volgende week \\u25b6": "Next week ▶",
  "Volgende week ▶": "Next week ▶",
  "Voorkeurssupermarkt": "Preferred store",
  "Voorraad": "Stock",
  "Voorraad ({n})": "Stock ({n})",
  "Wat gaat er mee? (tik om aan/uit te zetten)": "What gets included? (tap to toggle)",
  "Week start op": "Week starts on",
  "Week van ": "Week of ",
  "Weekmenu": "Week menu",
  "Weekmenu & Boodschappen": "Week menu & Shopping",
  "Weekmenu & Boodschappenlijst": "Week menu & Shopping list",
  "Weekmenu ({n} dagen)": "Week menu ({n} days)",
  "Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat.": "Week menu and shopping list: compose a week menu, generate groceries and manage stock. Everything local on your own device.",
  "Weekstart": "Week start",
  "Weergave": "Appearance",
  "Winkelvoorkeur": "Preferred store",
  "Winkelvoorkeur: dit artikel wordt daar gehaald": "Store preference: this item is bought there",
  "Wis filters": "Clear filters",
  "Zoek op receptnaam en filter op bereidingstijd, ingredi\\u00ebnt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingredi\\u00ebnten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Search by recipe name and filter by preparation time, ingredient or tag(s). Tap a recipe to edit name, category, preparation time, tags, ingredients and preparation. Everything is stored locally on your device; with export/import you share the list as JSON.",
  "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Search by recipe name and filter by preparation time, ingredient or tag(s). Tap a recipe to edit name, category, preparation time, tags, ingredients and preparation. Everything is stored locally on your device; with export/import you share the list as JSON.",
  "Zoek op receptnaam\\u2026": "Search by recipe name…",
  "Zoek op receptnaam…": "Search by recipe name…",
  "Zoek product\\u2026": "Search product…",
  "Zoek product…": "Search product…",
  "Zoekopdracht wissen": "Clear search",
  "\\u00d7": "× newest wins — restore manually afterwards if needed:",
  "\\u00d7 gebruikt (recepten, voorraad, extra)": "× used (recipes, stock, extras)",
  "\\u00d7 nieuwste wint \\u2014 zo nodig hierna zelf herstellen:": "× newest wins — restore manually afterwards if needed:",
  "\\u201d als eigen tekst opslaan (geen boodschappen)": "” save as custom text (no groceries)",
  "\\u21b5 Enter \\u2014 \\u201c": "↵ Enter — \"",
  "\\u21c5 Sorteer \\u25be": "⇅ Sort ▾",
  "\\u25c0 Vorige week": "◀ Previous week",
  "\\u2699 Filters \\u25be": "⚙ Filters ▾",
  "\\u2699\\ufe0f Regels voor het weekmenu": "⚙️ Rules for the week menu",
  "\\u26a0\\ufe0f Dit bestand kon niet worden gelezen.": "⚠️ This file could not be read.",
  "\\u26a0\\ufe0f Dit is geen deelbestand van de weekmenu-app.": "⚠️ This is not a share file of the weekmenu app.",
  "\\u26a1 Instant uit voorraad": "⚡ Instant from stock",
  "\\u2705 Samengevoegd": "✅ Merged",
  "\\u2705 {ok} gerechten compleet{rest} \\u2014 zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} dishes complete{rest} — see week menu (list stays checkable)",
  "\\u2705 {recept} toegevoegd aan {dag} {datum}": "✅ {recept} added to {dag} {datum}",
  "\\u2713 Alles aangevuld": "✓ All stocked up",
  "\\u2713 Naam (A\\u2013Z)": "✓ Name (A–Z)",
  "\\u2715 Foto verwijderen": "✕ Remove photo",
  "\\u2796 Niets nieuws in dit bestand.": "🖶 Nothing new in this file.",
  "\\u27f2 Ongedaan maken": "↲ Undo",
  "\\uff0b Ingredi\\u00ebnt toevoegen": "+ Add ingredient",
  "\\uff0b Locatie toevoegen": "+ Add location",
  "\\uff0b Product toevoegen": "+ Add product",
  "\\uff0b tag toevoegen\\u2026": "+ add tag…",
  "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt": "all items have a store preference for another supermarket",
  "altijd": "always",
  "bijv. 500": "e.g. 500",
  "bijv. zalm, ui, kaas\\u2026": "e.g. salmon, onion, cheese…",
  "bijv. zalm, ui, kaas…": "e.g. salmon, onion, cheese…",
  "boodschappenlijst \\u00d7": "shopping list ×",
  "boodschappenlijst ×": "shopping list ×",
  "cat.extra": "Extra",
  "cat.vega": "Vega",
  "cat.vis": "Fish",
  "cat.vlees": "Meat",
  "dagen": "days",
  "de geselecteerde supermarkt": "the selected supermarket",
  "deze week": "this week",
  "geen": "none",
  "geen ingredi\\u00ebnten bekend": "no ingredients known",
  "geen ingredienten bekend": "no ingredients known",
  "geen ingrediënten bekend": "no ingredients known",
  "gewenst": "desired",
  "gisteren": "yesterday",
  "have ": "have ",
  "nog geen tag-regels": "no tag rules yet",
  "nog geen tags in de pool": "no tags in the pool yet",
  "op lijst": "on list",
  "overig": "other",
  "sleutel\\u2026": "key…",
  "sleutel…": "key…",
  "standaard": "standard",
  "standaard: ": "default: ",
  "tag\\u2026": "tag…",
  "tag…": "tag…",
  "time.kort": "short",
  "time.lang": "long",
  "time.normaal": "normal",
  "toon": "show",
  "vandaag": "today",
  "verberg": "hide",
  "{done} van {total} afgevinkt": "{done} of {total} checked off",
  "{naam}: nog {n} dag(en) binnen de timetag": "{naam}: {n} day(s) left within the time tag",
  "{n} afgevinkt \\u00b7 {actie} \\u25be": "{n} checked off · {actie} ▾",
  "{n} afgevinkt · {actie} ▾": "{n} checked off · {actie} ▾",
  "{n} blijft": "{n} unchanged",
  "{n} dagen geleden": "{n} days ago",
  "{n} eters": "{n} eaters",
  "{n} jr geleden": "{n} yr ago",
  "{n} mnd geleden": "{n} mo ago",
  "{n} nieuw": "{n} new",
  "{n} nieuwer uit bestand": "{n} newer from file",
  "{n} product": "{n} product",
  "{n} producten": "{n} products",
  "{n} van de {m} ingredi\\u00ebnten mist nog": "{n} of the {m} ingredients still missing",
  "{n} van de {m} ingrediënten mist nog": "{n} of the {m} ingredients still missing",
  "{n} verwijderd": "{n} removed",
  "{n} wk geleden": "{n} wk ago",
  "×": "× newest wins — restore manually afterwards if needed:",
  "× gebruikt (recepten, voorraad, extra)": "× used (recipes, stock, extras)",
  "× nieuwste wint — zo nodig hierna zelf herstellen:": "× newest wins — restore manually afterwards if needed:",
  "” als eigen tekst opslaan (geen boodschappen)": "” save as custom text (no groceries)",
  "↵ Enter — “": "↵ Enter — \"",
  "⇅ Sorteer ▾": "⇅ Sort ▾",
  "◀ Vorige week": "◀ Previous week",
  "⚙ Filters ▾": "⚙ Filters ▾",
  "⚙️ Regels voor het weekmenu": "⚙️ Rules for the week menu",
  "⚠️ Dit bestand kon niet worden gelezen.": "⚠️ This file could not be read.",
  "⚠️ Dit is geen deelbestand van de weekmenu-app.": "⚠️ This is not a share file of the weekmenu app.",
  "⚡ Instant uit voorraad": "⚡ Instant from stock",
  "✅ Samengevoegd": "✅ Merged",
  "✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} dishes complete{rest} — see week menu (list stays checkable)",
  "✅ {recept} toegevoegd aan {dag} {datum}": "✅ {recept} added to {dag} {datum}",
  "✓ Alles aangevuld": "✓ All stocked up",
  "✓ Naam (A–Z)": "✓ Name (A–Z)",
  "✕ Foto verwijderen": "✕ Remove photo",
  "➖ Niets nieuws in dit bestand.": "🖶 Nothing new in this file.",
  "⟲ Ongedaan maken": "↲ Undo",
  "＋ Ingrediënt toevoegen": "+ Add ingredient",
  "＋ Locatie toevoegen": "+ Add location",
  "＋ Product toevoegen": "+ Add product",
  "＋ tag toevoegen…": "+ add tag…",
  "🍔 Afhaalmaaltijd": "🍔 Takeaway",
  "🍽\\ufe0f gerecht": "🍽️ dish",
  "🍽️ gerecht": "🍽️ dish",
  "🏷\\ufe0f product": "🏷️ product",
  "🏷️ product": "🏷️ product",
  "📅 Kies een datum \\u25be": "📅 Choose a date ▾",
  "📅 Kies een datum ▾": "📅 Choose a date ▾",
  "📍 geen boodschappen": "📍 no groceries",
  "📤 Maak deelbestand": "📤 Create share file",
  "📤 maakt een bestand met jouw data. 📥 leest zo\\u2019n bestand in en voegt het samen met wat hier al staat.": "📤 creates a file with your data. 📥 reads such a file and merges it with what is already here.",
  "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.": "📤 creates a file with your data. 📥 reads such a file and merges it with what is already here.",
  "📦 Productcatalogus": "📦 Product catalog",
  "📷 Foto toevoegen": "📷 Add photo",
  "📷 Vervangen": "📷 Replace",
  "🕒 Laatst gegeten": "🕒 Last eaten",
  "🕒 Laatst gegeten (langst geleden eerst)": "🕒 Last eaten (longest ago first)",
  "🛵 Afhaalmaaltijden (bestelsites)": "🛵 Takeaway (order sites)",
  "Taal {taal}": "Language {taal}",
  "Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).": "Language of the app (GUI) — stored locally per household (ADR-023).",
  "Taal van de app (GUI) \\u2014 lokaal opgeslagen per huishouden (ADR-023).": "Language of the app (GUI) — stored locally per household (ADR-023).",
  "Taal": "Language",
};

},
"src/i18n/fr.js": function (module, exports, require) {
// Traductions françaises. Les clés sont les textes sources néerlandais (voir nl.js / les sources JSX).
module.exports.default = {
  days: ["Samedi", "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi"],
  months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  monthsShort: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  " (tik om te sluiten).": " (touchez pour fermer).",
  " \\u00b7 \\u2757 {w} mist nog iets": " · ❗ il manque encore {w}",
  " \\u00b7 alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · seuls les jours non verrouillés sont sélectionnables (🔒 = verrouillé)",
  " \\u00b7 vandaag": " · aujourd'hui",
  " \\u2014 boodschappenlijst toont alleen hele verpakkingen": " — la liste de courses n'affiche que des emballages entiers",
  " \\u2014 niets nieuws in het bestand": " — rien de nouveau dans le fichier",
  " d": " j",
  " dagen": " jours",
  " duplicaatgroep(en) gevonden": " groupe(s) de doublons trouvé(s)",
  " eters": " convives",
  " producten \\u00b7 A\\u2013Z": " produits · A–Z",
  " producten · A–Z": " produits · A–Z",
  " van ": " sur ",
  " vega \\u00b7 ": " végé · ",
  " vega · ": " végé · ",
  " vlees": " viande",
  " voor deze dag": " pour ce jour",
  " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).": " est attribué au jour choisi (un plat non verrouillé y est écrasé).",
  " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · seuls les jours non verrouillés sont sélectionnables (🔒 = verrouillé)",
  " · vandaag": " · aujourd'hui",
  " · ❗ {w} mist nog iets": " · ❗ il manque encore {w}",
  " — boodschappenlijst toont alleen hele verpakkingen": " — la liste de courses n'affiche que des emballages entiers",
  " — niets nieuws in het bestand": " — rien de nouveau dans le fichier",
  "\" \\u2192 uit bestand \"": "\" → du fichier \"",
  "\" → uit bestand \"": "\" → du fichier \"",
  "#35: per 1 ": "#35 : pour 1 ",
  "({a} van {b})": "({a} sur {b})",
  "+ Bestelsite toevoegen": "+ Ajouter un site de commande",
  "+ Supermarkt toevoegen": "+ Ajouter un supermarché",
  "14 dagen": "14 jours",
  "3 dagen": "3 jours",
  "30 dagen": "30 jours",
  "7 dagen": "7 jours",
  ": hier \"": ": ici \"",
  "Aantal": "Quantité",
  "Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven": "Nombre de doublons dans le catalogue — fusionnez via la notification ci-dessus",
  "Aantal duplicaten in de catalogus — samenvoegen via de melding hierboven": "Nombre de doublons dans le catalogue — fusionnez via la notification ci-dessus",
  "Aantal eters": "Nombre de convives",
  "Aantal eters deze dag": "Convives ce jour",
  "Aantal keer gebruikt": "Fois utilisé",
  "Aantal vega-dagen (op niet-vis-dagen)": "Nombre de jours végé (hors jours poisson)",
  "Afhaalmaaltijd": "Plat à emporter",
  "Afhaalmaaltijd \\u00b7 weekplan schuift 1 dag op": "Plat à emporter · le planning décale d'un jour",
  "Afhaalmaaltijd · weekplan schuift 1 dag op": "Plat à emporter · le planning décale d'un jour",
  "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.": "Cochez simplement. « Traiter la mise à jour » traite les articles cochés (stock mis à jour, lignes masquées) et indique par plat dans le menu de la semaine si tout est en stock ; « Effacer les cases » remet tout à zéro.",
  "Afwijking \\u00b7 ": "Écart · ",
  "Afwijking van het weekplan (geen/weinig energie vandaag)": "Écart du planning (pas/peu d'énergie aujourd'hui)",
  "Afwijking · ": "Écart · ",
  "Alle": "Tous",
  "Alle ingredi\\u00ebnten van dit gerecht zijn in huis": "Tous les ingrédients de ce plat sont en stock",
  "Alle ingrediënten van dit gerecht zijn in huis": "Tous les ingrédients de ce plat sont en stock",
  "Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?": "Rétablir toutes les modifications de recettes à la liste d'origine ?",
  "Alleen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 worden getoond.": "Seuls les produits avec l'étiquette « instant-maaltijd » et have > 0 sont affichés.",
  "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.": "Seuls les produits avec l'étiquette « instant-maaltijd » et have > 0 sont affichés.",
  "Alles": "Tout",
  "Alles afgevinkt \\u2014 toon de rijen met de chip hierboven.": "Tout coché — affichez les lignes avec la puce ci-dessus.",
  "Alles afgevinkt — toon de rijen met de chip hierboven.": "Tout coché — affichez les lignes avec la puce ci-dessus.",
  "Alles wissen": "Tout effacer",
  "Annuleren": "Annuler",
  "Artikel verwijderen": "Supprimer l'article",
  "Bereiding": "Préparation",
  "Bereiding (optioneel)": "Préparation (facultatif)",
  "Bereiding\\u2026": "Préparation…",
  "Bereidingstijd": "Temps de préparation",
  "Bereiding…": "Préparation…",
  "Bestand overnemen": "Importer un fichier",
  "Bestand overnemen (importeren)": "Importer un fichier (import)",
  "Bestandsnaam: weekmenu-delen-v1-\\u2026.json \\u2014 daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "Nom du fichier : weekmenu-partage-v1-….json — partagez ensuite le fichier vous-même (WhatsApp, e-mail, AirDrop). Partager en dehors du ménage ? Désactivez tout sauf Recettes.",
  "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "Nom du fichier : weekmenu-partage-v1-….json — partagez ensuite le fichier vous-même (WhatsApp, e-mail, AirDrop). Partager en dehors du ménage ? Désactivez tout sauf Recettes.",
  "Bestelsite verwijderen": "Supprimer le site de commande",
  "Bevestig \\u00b7 weekplan schuift 1 dag op": "Confirmer · le planning décale d'un jour",
  "Bevestig · weekplan schuift 1 dag op": "Confirmer · le planning décale d'un jour",
  "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.": "Pour les légumes/laitages, vous voyez la date à laquelle c'est nécessaire (durée de conservation limitée). Les manques du stock (« n sur want ») sont ajoutés automatiquement à la liste.",
  "Boodschappen": "Courses",
  "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.": "En haut, vous choisissez pour combien de jours vous faites les courses et dans quel(s) supermarché(s). Les articles avec une préférence de magasin pour un autre supermarché ne sont pas affichés.",
  "Categorie": "Catégorie",
  "Categorie verwijderen": "Supprimer la catégorie",
  "Categorie\\u00ebn": "Catégories",
  "Categorie\\u00ebn beheren": "Gérer les catégories",
  "Categorieën": "Catégories",
  "Categorieën beheren": "Gérer les catégories",
  "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.": "La catégorie indique où se trouve le produit dans le supermarché (modifiable sous Courses). Un magasin étiqueté signifie : c'est acheté de préférence là ; la comparaison de prix n'a alors aucun sens.",
  "De lijst is \\u00e9\\u00e9n platte lijst op categorie-volgorde (zie \\u2699\\ufe0f) \\u2014 ingredi\\u00ebnt, voorraad of extra artikel maakt niet uit.": "La liste est une liste plate dans l'ordre des catégories (voir ⚙️) — ingrédient, stock ou article supplémentaire, peu importe.",
  "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.": "La liste est une liste plate dans l'ordre des catégories (voir ⚙️) — ingrédient, stock ou article supplémentaire, peu importe.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt \\u2014 tortilla en kroepoek horen daarom bij \\u201c(maaltijd)saus\\u201d.": "L'ordre est celui de la liste de courses. Une catégorie indique où se trouve un article dans le supermarché — tortilla et kroepoek appartiennent donc à « (repas)sauce ».",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.": "L'ordre est celui de la liste de courses. Une catégorie indique où se trouve un article dans le supermarché — tortilla et kroepoek appartiennent donc à « (repas)sauce ».",
  "Deelbestand maken (exporteren)": "Créer un fichier de partage (export)",
  "Deze linkjes verschijnen bij \\u201cAfwijking van het weekplan\\u201d \\u2192 afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "Ces liens apparaissent sous « Écart du planning » → plat à emporter (#42). Stockés localement uniquement (ADR-010).",
  "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "Ces liens apparaissent sous « Écart du planning » → plat à emporter (#42). Stockés localement uniquement (ADR-010).",
  "Dit verandert er als je samenvoegt:": "Voici ce qui change lors de la fusion :",
  "Eenheid (alleen converteerbare eenheden wijzigbaar)": "Unité (seules les unités convertibles sont modifiables)",
  "Eenheid (standaard bij dit product)": "Unité (par défaut pour ce produit)",
  "Eenheid van de inhoud": "Unité du contenu",
  "Eenheid van het product": "Unité du produit",
  "Eetpatroon": "Rythme alimentaire",
  "Eters & supermarkten \\u2192 Instellingen": "Convives & supermarchés → Réglages",
  "Eters & supermarkten → Instellingen": "Convives & supermarchés → Réglages",
  "Exporteren": "Exporter",
  "Extra's": "Extras",
  "Filters": "Filtres",
  "Foto opslaan mislukt: {fout}": "Échec de l'enregistrement de la photo : {fout}",
  "Geen boodschappen voor deze dag": "Pas de courses pour ce jour",
  "Geen producten gevonden.": "Aucun produit trouvé.",
  "Genereer weekmenu": "Générer le menu de la semaine",
  "Gerecht bekijken (ingredi\\u00ebnten + bereiding) \\u2014 ontgrendelen via het slot": "Voir le plat (ingrédients + préparation) — déverrouiller via le cadenas",
  "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot": "Voir le plat (ingrédients + préparation) — déverrouiller via le cadenas",
  "Gewenste voorraad aanpassen": "Ajuster le stock souhaité",
  "Hetzelfde gerecht opnieuw plannen na": "Reprogrammer le même plat après",
  "Hoe werkt de boodschappenlijst?": "Comment fonctionne la liste de courses ?",
  "Hoe werkt de voorraad?": "Comment fonctionne le stock ?",
  "Hoe werkt zoeken en filteren?": "Comment fonctionnent la recherche et les filtres ?",
  "Hoeveelheden geschaald voor afwijkende eters (\\u00d7{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Quantités adaptées pour un nombre de convives différent (×{f} par rapport à {n} convives standard) ; les règles sans nombre restent inchangées.",
  "Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Quantités adaptées pour un nombre de convives différent (×{f} par rapport à {n} convives standard) ; les règles sans nombre restent inchangées.",
  "Huidige voorraad": "Stock actuel",
  "Huishouden": "Ménage",
  "Importeren": "Importer",
  "Ingredi\\u00ebnt bevat": "L'ingrédient contient",
  "Ingredi\\u00ebnt verwijderen": "Supprimer l'ingrédient",
  "Ingredi\\u00ebnten": "Ingrédients",
  "Ingredi\\u00ebnten voor {gerecht}": "Ingrédients pour {gerecht}",
  "Ingrediënt bevat": "L'ingrédient contient",
  "Ingrediënt verwijderen": "Supprimer l'ingrédient",
  "Ingrediënten": "Ingrédients",
  "Ingrediënten voor {gerecht}": "Ingrédients pour {gerecht}",
  "Inhoud per verpakking": "Contenu par emballage",
  "Instant-maaltijd: {lijst}": "Repas instant : {lijst}",
  "Instellingen": "Réglages",
  "Instellingen \\u00b7 vinkjes \\u00b7 verwijderingen": "Réglages · cases · suppressions",
  "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (": "Réglages par ménage. Ils ne sont enregistrés que localement sur cet appareil (localStorage) et s'appliquent directement au menu de la semaine et à la liste de courses. L'index de jour 0 est le début de semaine (",
  "Instellingen · vinkjes · verwijderingen": "Réglages · cases · suppressions",
  "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.": "Le stock actuel est-il inférieur au souhaité ? Alors le produit est automatiquement sur la liste de courses.",
  "Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.": "Choisissez le gardien (le produit conservé). Les liens de recettes sont transférés vers le gardien ; les variantes du nom sont proposées comme étiquettes par recette.",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen \\u2192 🛵 Afhaalmaaltijden):": "Choisissez un site de commande (s'ouvre dans le navigateur ; gérez via Réglages → 🛵 Plats à emporter) :",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):": "Choisissez un site de commande (s'ouvre dans le navigateur ; gérez via Réglages → 🛵 Plats à emporter) :",
  "Kies een dag deze week": "Choisissez un jour cette semaine",
  "Kies een datum": "Choisir une date",
  "Kies uit de voorraad": "Choisir dans le stock",
  "Klaar": "Terminé",
  "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.": "Cliquez sur un jour pour aller à la semaine de ce jour. 🔒 = plat verrouillé, conservé par date.",
  "Klik op een locatie om de producten te zien; \\uff0b onderaan een locatie voegt een product toe (altijd te verwijderen met \\u2715).": "Cliquez sur un emplacement pour voir ses produits ; ＋ en bas d'un emplacement ajoute un produit (toujours supprimable avec ✕).",
  "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).": "Cliquez sur un emplacement pour voir ses produits ; ＋ en bas d'un emplacement ajoute un produit (toujours supprimable avec ✕).",
  "Laatst gegeten: {datum}": "Dernier repas : {datum}",
  "Locatie toevoegen": "Ajouter un emplacement",
  "Locaties": "Emplacements",
  "Locaties (voorraadkast, koelkast\\u2026) zijn per huishouden: voeg toe met \\uff0b onderaan, verwijder met 🗑\\ufe0f \\u2014 pas als er geen producten meer aan hangen.": "Les emplacements (cellier, réfrigérateur…) sont par ménage : ajoutez avec ＋ en bas, supprimez avec 🗑️ — seulement quand plus aucun produit n'y est rattaché.",
  "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.": "Les emplacements (cellier, réfrigérateur…) sont par ménage : ajoutez avec ＋ en bas, supprimez avec 🗑️ — seulement quand plus aucun produit n'y est rattaché.",
  "Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)": "Nombre minimum de jours entre deux utilisations de ce produit dans le menu de la semaine (0 = pas d'étiquette de temps, max 365)",
  "Naam": "Nom",
  "Naam van de locatie\\u2026": "Nom de l'emplacement…",
  "Naam van de locatie…": "Nom de l'emplacement…",
  "Naam\\u2026": "Nom…",
  "Naam…": "Nom…",
  "Naar deze week": "À cette semaine",
  "Niets te halen bij {winkels}": "Rien à prendre chez {winkels}",
  "Nieuw recept": "Nouvelle recette",
  "Nieuwe categorie\\u2026": "Nouvelle catégorie…",
  "Nieuwe categorie…": "Nouvelle catégorie…",
  "Nog geen bestelsites geconfigureerd \\u2014 voeg toe via Instellingen \\u2192 🛵 Afhaalmaaltijden.": "Aucun site de commande configuré — ajoutez via Réglages → 🛵 Plats à emporter.",
  "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.": "Aucun site de commande configuré — ajoutez via Réglages → 🛵 Plats à emporter.",
  "Nog geen producten in deze locatie.": "Aucun produit dans cet emplacement.",
  "Nog geen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 \\u2014 tag toekennen via de product-kaart.": "Aucun produit avec l'étiquette « instant-maaltijd » et have > 0 — attribuez une étiquette via la carte produit.",
  "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.": "Aucun produit avec l'étiquette « instant-maaltijd » et have > 0 — attribuez une étiquette via la carte produit.",
  "Nog niets afgevinkt \\u2014 vink de gehaalde artikelen af.": "Rien de coché — cochez les articles achetés.",
  "Nog niets afgevinkt — vink de gehaalde artikelen af.": "Rien de coché — cochez les articles achetés.",
  "Nog nooit vergrendeld gegeten": "Jamais mangé",
  "Onbekend": "Inconnu",
  "Ontgrendelen": "Déverrouiller",
  "Opslaan": "Enregistrer",
  "Per product stel je de huidige voorraad in met \\u2212/+; de gewenste voorraad staat grijs erachter (\\u201cgewenst n\\u201d). Met \\u270f\\ufe0f achter de locatie pas je de gewenste hoeveelheden aan.": "Par produit, vous réglez le stock actuel avec −/+ ; le stock souhaité est en gris derrière (« souhaité n »). Avec ✏️ derrière l'emplacement, vous ajustez les quantités souhaitées.",
  "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.": "Par produit, vous réglez le stock actuel avec −/+ ; le stock souhaité est en gris derrière (« souhaité n »). Avec ✏️ derrière l'emplacement, vous ajustez les quantités souhaitées.",
  "Per-recept tag (geldt alleen in dit recept, #59)": "Étiquette par recette (valable uniquement dans cette recette, #59)",
  "Product verwijderen": "Supprimer le produit",
  "Productcatalogus in-/uitklappen (#44)": "Déplier/replier le catalogue de produits (#44)",
  "Producten": "Produits",
  "Producten ({n})": "Produits ({n})",
  "Producten samenvoegen (#59)": "Fusionner les produits (#59)",
  "Productnaam\\u2026": "Nom du produit…",
  "Productnaam…": "Nom du produit…",
  "Recept bewerken": "Modifier la recette",
  "Recept toevoegen": "Ajouter une recette",
  "Recept verwijderen": "Supprimer la recette",
  "Recepten": "Recettes",
  "Recepten ({n})": "Recettes ({n})",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als \\u00e9\\u00e9n chip mee.": "Recettes, produits, stock et menu de la semaine se choisissent séparément. Cases, suppressions et réglages vont ensemble et passent comme une seule puce.",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.": "Recettes, produits, stock et menu de la semaine se choisissent séparément. Cases, suppressions et réglages vont ensemble et passent comme une seule puce.",
  "Regel toevoegen": "Ajouter une règle",
  "Regel verwijderen": "Supprimer la règle",
  "Regels voor het weekmenu": "Règles du menu de la semaine",
  "Samengevoegd naar \\u201c{naam}\\u201d": "Fusionné dans « {naam} »",
  "Samengevoegd naar “{naam}”": "Fusionné dans « {naam} »",
  "Samenvoegen": "Fusionner",
  "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.": "× le plus récent gagne — restaurez manuellement si besoin :",
  "Samenvoegen geweigerd: {fout}": "Fusion refusée : {fout}",
  "Samenvoegen\\u2026": "Fusion…",
  "Samenvoegen…": "Fusion…",
  "Sorteren": "Trier",
  "Standaard geselecteerd op de boodschappenlijst": "Sélectionné par défaut dans la liste de courses",
  "Standaard herstellen": "Restaurer par défaut",
  "Standaardeenheid": "Unité par défaut",
  "Standaardlijst terug": "Restaurer la liste par défaut",
  "Stel eerst een weekmenu samen; de ingredi\\u00ebnten verschijnen dan hier automatisch.": "Composez d'abord un menu de la semaine ; les ingrédients apparaissent alors automatiquement ici.",
  "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.": "Composez d'abord un menu de la semaine ; les ingrédients apparaissent alors automatiquement ici.",
  "Supermarkten": "Supermarchés",
  "Tag verwijderen": "Supprimer l'étiquette",
  "Tag-regels (bij automatisch plannen)": "Règles d'étiquettes (planification automatique)",
  "Tags": "Étiquettes",
  "Tags (alle geselecteerde moeten erop \\u2014 AND)": "Étiquettes (toutes les sélectionnées doivent correspondre — ET)",
  "Tags (alle geselecteerde moeten erop — AND)": "Étiquettes (toutes les sélectionnées doivent correspondre — ET)",
  "Thema van de app \\u2014 lokaal opgeslagen per huishouden (#40).": "Thème de l'app — enregistré localement par ménage (#40).",
  "Thema van de app — lokaal opgeslagen per huishouden (#40).": "Thème de l'app — enregistré localement par ménage (#40).",
  "Thema {thema}": "Thème {thema}",
  "Timetag (optioneel, #58)": "Étiquette de temps (facultatif, #58)",
  "Toevoegen": "Ajouter",
  "Toevoegen aan een onvergrendelde dag van deze week": "Ajouter à un jour non verrouillé de cette semaine",
  "Toon alle supermarkten": "Afficher tous les supermarchés",
  "Toon {n} recepten": "Afficher {n} recettes",
  "Typ een gerecht\\u2026": "Tapez un plat…",
  "Typ een gerecht…": "Tapez un plat…",
  "URL\\u2026": "URL…",
  "URL…": "URL…",
  "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)": "Retirer du catalogue (les liens retombent en texte libre)",
  "Uitleg over delen via bestand": "Explication sur le partage par fichier",
  "VANDAAG": "AUJOURD'HUI",
  "Vega-dagen op de overige ": "Jours végé sur les autres ",
  "Vergrendelen": "Verrouiller",
  "Verwerk update": "Traiter la mise à jour",
  "Verwijderen": "Supprimer",
  "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten": "Suppression possible seulement s'il n'y a plus de produits/articles dans cette catégorie",
  "Vinkjes wissen": "Effacer les cases",
  "Vis-dagen:": "Jours poisson :",
  "Visdagen": "Jours poisson",
  "Volgende week \\u25b6": "Semaine suivante ▶",
  "Volgende week ▶": "Semaine suivante ▶",
  "Voorkeurssupermarkt": "Supermarché préféré",
  "Voorraad": "Stock",
  "Voorraad ({n})": "Stock ({n})",
  "Wat gaat er mee? (tik om aan/uit te zetten)": "Que faut-il inclure ? (touchez pour activer/désactiver)",
  "Week start op": "La semaine commence le",
  "Week van ": "Semaine du ",
  "Weekmenu": "Menu de la semaine",
  "Weekmenu & Boodschappen": "Menu de la semaine & Courses",
  "Weekmenu & Boodschappenlijst": "Menu de la semaine & Liste de courses",
  "Weekmenu ({n} dagen)": "Menu de la semaine ({n} jours)",
  "Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat.": "Menu de la semaine et liste de courses : composez un menu, générez les courses et gérez le stock. Tout reste local sur votre propre appareil.",
  "Weekstart": "Début de semaine",
  "Weergave": "Apparence",
  "Winkelvoorkeur": "Magasin préféré",
  "Winkelvoorkeur: dit artikel wordt daar gehaald": "Préférence de magasin : cet article est acheté là",
  "Wis filters": "Effacer les filtres",
  "Zoek op receptnaam en filter op bereidingstijd, ingredi\\u00ebnt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingredi\\u00ebnten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Recherchez par nom de recette et filtrez par temps de préparation, ingrédient ou étiquette(s). Touchez une recette pour modifier nom, catégorie, temps, étiquettes, ingrédients et préparation. Tout est enregistré localement sur votre appareil ; avec exporter/importer, vous partagez la liste en JSON.",
  "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Recherchez par nom de recette et filtrez par temps de préparation, ingrédient ou étiquette(s). Touchez une recette pour modifier nom, catégorie, temps, étiquettes, ingrédients et préparation. Tout est enregistré localement sur votre appareil ; avec exporter/importer, vous partagez la liste en JSON.",
  "Zoek op receptnaam\\u2026": "Rechercher par nom de recette…",
  "Zoek op receptnaam…": "Rechercher par nom de recette…",
  "Zoek product\\u2026": "Rechercher un produit…",
  "Zoek product…": "Rechercher un produit…",
  "Zoekopdracht wissen": "Effacer la recherche",
  "\\u00d7": "× le plus récent gagne — restaurez manuellement si besoin :",
  "\\u00d7 gebruikt (recepten, voorraad, extra)": "× utilisé (recettes, stock, extras)",
  "\\u00d7 nieuwste wint \\u2014 zo nodig hierna zelf herstellen:": "× le plus récent gagne — restaurez manuellement si besoin :",
  "\\u201d als eigen tekst opslaan (geen boodschappen)": "” enregistrer comme texte libre (pas de courses)",
  "\\u21b5 Enter \\u2014 \\u201c": "↵ Entrée — « ",
  "\\u21c5 Sorteer \\u25be": "⇅ Trier ▾",
  "\\u25c0 Vorige week": "◀ Semaine précédente",
  "\\u2699 Filters \\u25be": "⚙ Filtres ▾",
  "\\u2699\\ufe0f Regels voor het weekmenu": "⚙️ Règles du menu de la semaine",
  "\\u26a0\\ufe0f Dit bestand kon niet worden gelezen.": "⚠️ Ce fichier n'a pas pu être lu.",
  "\\u26a0\\ufe0f Dit is geen deelbestand van de weekmenu-app.": "⚠️ Ceci n'est pas un fichier de partage de l'app weekmenu.",
  "\\u26a1 Instant uit voorraad": "⚡ Instant du stock",
  "\\u2705 Samengevoegd": "✅ Fusionné",
  "\\u2705 {ok} gerechten compleet{rest} \\u2014 zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} plats complets{rest} — voir menu de la semaine (liste reste cochable)",
  "\\u2705 {recept} toegevoegd aan {dag} {datum}": "✅ {recept} ajouté à {dag} {datum}",
  "\\u2713 Alles aangevuld": "✓ Tout réapprovisionné",
  "\\u2713 Naam (A\\u2013Z)": "✓ Nom (A–Z)",
  "\\u2715 Foto verwijderen": "✕ Supprimer la photo",
  "\\u2796 Niets nieuws in dit bestand.": "🖶 Rien de nouveau dans ce fichier.",
  "\\u27f2 Ongedaan maken": "↲ Annuler",
  "\\uff0b Ingredi\\u00ebnt toevoegen": "+ Ajouter un ingrédient",
  "\\uff0b Locatie toevoegen": "+ Ajouter un emplacement",
  "\\uff0b Product toevoegen": "+ Ajouter un produit",
  "\\uff0b tag toevoegen\\u2026": "+ ajouter une étiquette…",
  "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt": "tous les articles ont une préférence de magasin pour un autre supermarché",
  "altijd": "toujours",
  "bijv. 500": "p. ex. 500",
  "bijv. zalm, ui, kaas\\u2026": "p. ex. saumon, oignon, fromage…",
  "bijv. zalm, ui, kaas…": "p. ex. saumon, oignon, fromage…",
  "boodschappenlijst \\u00d7": "liste de courses ×",
  "boodschappenlijst ×": "liste de courses ×",
  "cat.extra": "Extra",
  "cat.vega": "Végé",
  "cat.vis": "Poisson",
  "cat.vlees": "Viande",
  "dagen": "jours",
  "de geselecteerde supermarkt": "le supermarché sélectionné",
  "deze week": "cette semaine",
  "geen": "aucun",
  "geen ingredi\\u00ebnten bekend": "aucun ingrédient connu",
  "geen ingredienten bekend": "aucun ingrédient connu",
  "geen ingrediënten bekend": "aucun ingrédient connu",
  "gewenst": "souhaité",
  "gisteren": "hier",
  "have ": "have ",
  "nog geen tag-regels": "pas encore de règles d'étiquettes",
  "nog geen tags in de pool": "pas encore d'étiquettes dans le pool",
  "op lijst": "sur la liste",
  "overig": "autre",
  "sleutel\\u2026": "clé…",
  "sleutel…": "clé…",
  "standaard": "standard",
  "standaard: ": "par défaut : ",
  "tag\\u2026": "étiquette…",
  "tag…": "étiquette…",
  "time.kort": "court",
  "time.lang": "long",
  "time.normaal": "normal",
  "toon": "afficher",
  "vandaag": "aujourd'hui",
  "verberg": "masquer",
  "{done} van {total} afgevinkt": "{done} sur {total} coché",
  "{naam}: nog {n} dag(en) binnen de timetag": "{naam} : encore {n} jour(s) dans l'étiquette de temps",
  "{n} afgevinkt \\u00b7 {actie} \\u25be": "{n} coché · {actie} ▾",
  "{n} afgevinkt · {actie} ▾": "{n} coché · {actie} ▾",
  "{n} blijft": "{n} inchangé",
  "{n} dagen geleden": "il y a {n} jours",
  "{n} eters": "{n} convives",
  "{n} jr geleden": "il y a {n} an(s)",
  "{n} mnd geleden": "il y a {n} mois",
  "{n} nieuw": "{n} nouveau",
  "{n} nieuwer uit bestand": "{n} plus récent du fichier",
  "{n} product": "{n} produit",
  "{n} producten": "{n} produits",
  "{n} van de {m} ingredi\\u00ebnten mist nog": "{n} des {m} ingrédients manquent encore",
  "{n} van de {m} ingrediënten mist nog": "{n} des {m} ingrédients manquent encore",
  "{n} verwijderd": "{n} supprimé",
  "{n} wk geleden": "il y a {n} sem.",
  "×": "× le plus récent gagne — restaurez manuellement si besoin :",
  "× gebruikt (recepten, voorraad, extra)": "× utilisé (recettes, stock, extras)",
  "× nieuwste wint — zo nodig hierna zelf herstellen:": "× le plus récent gagne — restaurez manuellement si besoin :",
  "” als eigen tekst opslaan (geen boodschappen)": "” enregistrer comme texte libre (pas de courses)",
  "↵ Enter — “": "↵ Entrée — « ",
  "⇅ Sorteer ▾": "⇅ Trier ▾",
  "◀ Vorige week": "◀ Semaine précédente",
  "⚙ Filters ▾": "⚙ Filtres ▾",
  "⚙️ Regels voor het weekmenu": "⚙️ Règles du menu de la semaine",
  "⚠️ Dit bestand kon niet worden gelezen.": "⚠️ Ce fichier n'a pas pu être lu.",
  "⚠️ Dit is geen deelbestand van de weekmenu-app.": "⚠️ Ceci n'est pas un fichier de partage de l'app weekmenu.",
  "⚡ Instant uit voorraad": "⚡ Instant du stock",
  "✅ Samengevoegd": "✅ Fusionné",
  "✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} plats complets{rest} — voir menu de la semaine (liste reste cochable)",
  "✅ {recept} toegevoegd aan {dag} {datum}": "✅ {recept} ajouté à {dag} {datum}",
  "✓ Alles aangevuld": "✓ Tout réapprovisionné",
  "✓ Naam (A–Z)": "✓ Nom (A–Z)",
  "✕ Foto verwijderen": "✕ Supprimer la photo",
  "➖ Niets nieuws in dit bestand.": "🖶 Rien de nouveau dans ce fichier.",
  "⟲ Ongedaan maken": "↲ Annuler",
  "＋ Ingrediënt toevoegen": "+ Ajouter un ingrédient",
  "＋ Locatie toevoegen": "+ Ajouter un emplacement",
  "＋ Product toevoegen": "+ Ajouter un produit",
  "＋ tag toevoegen…": "+ ajouter une étiquette…",
  "🍔 Afhaalmaaltijd": "🍔 Plat à emporter",
  "🍽\\ufe0f gerecht": "🍽️ plat",
  "🍽️ gerecht": "🍽️ plat",
  "🏷\\ufe0f product": "🏷️ produit",
  "🏷️ product": "🏷️ produit",
  "📅 Kies een datum \\u25be": "📅 Choisir une date ▾",
  "📅 Kies een datum ▾": "📅 Choisir une date ▾",
  "📍 geen boodschappen": "📍 pas de courses",
  "📤 Maak deelbestand": "📤 Créer un fichier de partage",
  "📤 maakt een bestand met jouw data. 📥 leest zo\\u2019n bestand in en voegt het samen met wat hier al staat.": "📤 crée un fichier avec vos données. 📥 lit un tel fichier et le fusionne avec ce qui est déjà ici.",
  "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.": "📤 crée un fichier avec vos données. 📥 lit un tel fichier et le fusionne avec ce qui est déjà ici.",
  "📦 Productcatalogus": "📦 Catalogue de produits",
  "📷 Foto toevoegen": "📷 Ajouter une photo",
  "📷 Vervangen": "📷 Remplacer",
  "🕒 Laatst gegeten": "🕒 Dernier repas",
  "🕒 Laatst gegeten (langst geleden eerst)": "🕒 Dernier repas (le plus ancien d'abord)",
  "🛵 Afhaalmaaltijden (bestelsites)": "🛵 Plats à emporter (sites de commande)",
  "Taal {taal}": "Langue {taal}",
  "Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).": "Langue de l'app (GUI) — enregistrée localement par ménage (ADR-023).",
  "Taal van de app (GUI) \\u2014 lokaal opgeslagen per huishouden (ADR-023).": "Langue de l'app (GUI) — enregistrée localement par ménage (ADR-023).",
  "Taal": "Langue",
};

},
"src/i18n/de.js": function (module, exports, require) {
// Deutsche Übersetzungen. Die Schlüssel sind die niederländischen Quelltexte (siehe nl.js / JSX-Quellen).
module.exports.default = {
  days: ["Samstag", "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"],
  months: ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"],
  monthsShort: ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"],
  " (tik om te sluiten).": " (zum Schließen tippen).",
  " \\u00b7 \\u2757 {w} mist nog iets": " · ❗ {w} fehlt noch",
  " \\u00b7 alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · nur entsperrte Tage wählbar (🔒 = gesperrt)",
  " \\u00b7 vandaag": " · heute",
  " \\u2014 boodschappenlijst toont alleen hele verpakkingen": " — Einkaufsliste zeigt nur ganze Packungen",
  " \\u2014 niets nieuws in het bestand": " — nichts Neues in der Datei",
  " d": " T",
  " dagen": " Tage",
  " duplicaatgroep(en) gevonden": " Duplikatgruppe(n) gefunden",
  " eters": " Personen",
  " producten \\u00b7 A\\u2013Z": " Produkte · A–Z",
  " producten · A–Z": " Produkte · A–Z",
  " van ": " von ",
  " vega \\u00b7 ": " vegetarisch · ",
  " vega · ": " vegetarisch · ",
  " vlees": " Fleisch",
  " voor deze dag": " für diesen Tag",
  " wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).": " wird dem gewählten Tag zugewiesen (ein dort nicht gesperrtes Gericht wird überschrieben).",
  " · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)": " · nur entsperrte Tage wählbar (🔒 = gesperrt)",
  " · vandaag": " · heute",
  " · ❗ {w} mist nog iets": " · ❗ {w} fehlt noch",
  " — boodschappenlijst toont alleen hele verpakkingen": " — Einkaufsliste zeigt nur ganze Packungen",
  " — niets nieuws in het bestand": " — nichts Neues in der Datei",
  "\" \\u2192 uit bestand \"": "\" → aus Datei \"",
  "\" → uit bestand \"": "\" → aus Datei \"",
  "#35: per 1 ": "#35: pro 1 ",
  "({a} van {b})": "({a} von {b})",
  "+ Bestelsite toevoegen": "+ Bestellseite hinzufügen",
  "+ Supermarkt toevoegen": "+ Supermarkt hinzufügen",
  "14 dagen": "14 Tage",
  "3 dagen": "3 Tage",
  "30 dagen": "30 Tage",
  "7 dagen": "7 Tage",
  ": hier \"": ": hier \"",
  "Aantal": "Anzahl",
  "Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven": "Anzahl Duplikate im Katalog — über die Meldung oben zusammenführen",
  "Aantal duplicaten in de catalogus — samenvoegen via de melding hierboven": "Anzahl Duplikate im Katalog — über die Meldung oben zusammenführen",
  "Aantal eters": "Anzahl Personen",
  "Aantal eters deze dag": "Personen an diesem Tag",
  "Aantal keer gebruikt": "Mal verwendet",
  "Aantal vega-dagen (op niet-vis-dagen)": "Anzahl Veggie-Tage (an Nicht-Fischtagen)",
  "Afhaalmaaltijd": "Zum Mitnehmen",
  "Afhaalmaaltijd \\u00b7 weekplan schuift 1 dag op": "Zum Mitnehmen · Wochenplan rückt 1 Tag vor",
  "Afhaalmaaltijd · weekplan schuift 1 dag op": "Zum Mitnehmen · Wochenplan rückt 1 Tag vor",
  "Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.": "Einfach abhaken. „Update verarbeiten“ verarbeitet die abgehakten Artikel (Bestand wird aktualisiert, Zeilen ausgeblendet) und zeigt pro Gericht im Wochenmenü, ob alles da ist; „Häkchen zurücksetzen“ macht alles rückgängig.",
  "Afwijking \\u00b7 ": "Abweichung · ",
  "Afwijking van het weekplan (geen/weinig energie vandaag)": "Abweichung vom Wochenplan (keine/wenig Energie heute)",
  "Afwijking · ": "Abweichung · ",
  "Alle": "Alle",
  "Alle ingredi\\u00ebnten van dit gerecht zijn in huis": "Alle Zutaten dieses Gerichts sind vorrätig",
  "Alle ingrediënten van dit gerecht zijn in huis": "Alle Zutaten dieses Gerichts sind vorrätig",
  "Alle receptwijzigingen terugzetten naar de oorspronkelijke lijst?": "Alle Rezeptänderungen auf die Originalliste zurücksetzen?",
  "Alleen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 worden getoond.": "Nur Produkte mit Tag „instant-maaltijd“ und have > 0 werden angezeigt.",
  "Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.": "Nur Produkte mit Tag „instant-maaltijd“ und have > 0 werden angezeigt.",
  "Alles": "Alle",
  "Alles afgevinkt \\u2014 toon de rijen met de chip hierboven.": "Alles abgehakt — Zeilen über den Chip oben anzeigen.",
  "Alles afgevinkt — toon de rijen met de chip hierboven.": "Alles abgehakt — Zeilen über den Chip oben anzeigen.",
  "Alles wissen": "Alles löschen",
  "Annuleren": "Abbrechen",
  "Artikel verwijderen": "Artikel entfernen",
  "Bereiding": "Zubereitung",
  "Bereiding (optioneel)": "Zubereitung (optional)",
  "Bereiding\\u2026": "Zubereitung…",
  "Bereidingstijd": "Zubereitungszeit",
  "Bereiding…": "Zubereitung…",
  "Bestand overnemen": "Datei importieren",
  "Bestand overnemen (importeren)": "Datei importieren (Import)",
  "Bestandsnaam: weekmenu-delen-v1-\\u2026.json \\u2014 daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "Dateiname: weekmenu-teilen-v1-….json — danach teilst du die Datei selbst (WhatsApp, E-Mail, AirDrop). Außerhalb des Haushalts teilen? Dann alles außer Rezepte ausschalten.",
  "Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.": "Dateiname: weekmenu-teilen-v1-….json — danach teilst du die Datei selbst (WhatsApp, E-Mail, AirDrop). Außerhalb des Haushalts teilen? Dann alles außer Rezepte ausschalten.",
  "Bestelsite verwijderen": "Bestellseite entfernen",
  "Bevestig \\u00b7 weekplan schuift 1 dag op": "Bestätigen · Wochenplan rückt 1 Tag vor",
  "Bevestig · weekplan schuift 1 dag op": "Bestätigen · Wochenplan rückt 1 Tag vor",
  "Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst.": "Bei Gemüse/Milch siehst du das Datum, bis wann es gebraucht wird (begrenzt haltbar). Fehlmengen aus dem Vorrat („n von want“) landen automatisch auf der Liste.",
  "Boodschappen": "Einkäufe",
  "Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.": "Oben wählst du, für wie viele Tage du einkaufst und in welchem Supermarkt(en). Artikel mit Geschäftswahl für einen anderen Supermarkt siehst du nicht.",
  "Categorie": "Kategorie",
  "Categorie verwijderen": "Kategorie löschen",
  "Categorie\\u00ebn": "Kategorien",
  "Categorie\\u00ebn beheren": "Kategorien verwalten",
  "Categorieën": "Kategorien",
  "Categorieën beheren": "Kategorien verwalten",
  "De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.": "Die Kategorie sagt, wo das Produkt im Supermarkt liegt (bearbeitbar unter Einkäufe). Ein markierter Laden bedeutet: dort wird es bevorzugt gekauft; Preisvergleich hat dann keinen Sinn.",
  "De lijst is \\u00e9\\u00e9n platte lijst op categorie-volgorde (zie \\u2699\\ufe0f) \\u2014 ingredi\\u00ebnt, voorraad of extra artikel maakt niet uit.": "Die Liste ist eine flache Liste in Kategorie-Reihenfolge (siehe ⚙️) — Zutat, Vorrat oder Extra-Artikel macht keinen Unterschied.",
  "De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.": "Die Liste ist eine flache Liste in Kategorie-Reihenfolge (siehe ⚙️) — Zutat, Vorrat oder Extra-Artikel macht keinen Unterschied.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt \\u2014 tortilla en kroepoek horen daarom bij \\u201c(maaltijd)saus\\u201d.": "Die Reihenfolge ist die Reihenfolge auf der Einkaufsliste. Eine Kategorie sagt, wo ein Artikel im Supermarkt liegt — Tortilla und Kroepoek gehören deshalb zu „(Mahlzeit)Soße“.",
  "De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.": "Die Reihenfolge ist die Reihenfolge auf der Einkaufsliste. Eine Kategorie sagt, wo ein Artikel im Supermarkt liegt — Tortilla und Kroepoek gehören deshalb zu „(Mahlzeit)Soße“.",
  "Deelbestand maken (exporteren)": "Teilungsdatei erstellen (Export)",
  "Deze linkjes verschijnen bij \\u201cAfwijking van het weekplan\\u201d \\u2192 afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "Diese Links erscheinen unter „Abweichung vom Wochenplan“ → Zum Mitnehmen (#42). Nur lokal gespeichert (ADR-010).",
  "Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).": "Diese Links erscheinen unter „Abweichung vom Wochenplan“ → Zum Mitnehmen (#42). Nur lokal gespeichert (ADR-010).",
  "Dit verandert er als je samenvoegt:": "Das ändert sich beim Zusammenführen:",
  "Eenheid (alleen converteerbare eenheden wijzigbaar)": "Einheit (nur konvertierbare Einheiten änderbar)",
  "Eenheid (standaard bij dit product)": "Einheit (Standard für dieses Produkt)",
  "Eenheid van de inhoud": "Inhaltseinheit",
  "Eenheid van het product": "Produkteinheit",
  "Eetpatroon": "Essmuster",
  "Eters & supermarkten \\u2192 Instellingen": "Personen & Supermärkte → Einstellungen",
  "Eters & supermarkten → Instellingen": "Personen & Supermärkte → Einstellungen",
  "Exporteren": "Exportieren",
  "Extra's": "Extras",
  "Filters": "Filter",
  "Foto opslaan mislukt: {fout}": "Foto speichern fehlgeschlagen: {fout}",
  "Geen boodschappen voor deze dag": "Keine Einkäufe für diesen Tag",
  "Geen producten gevonden.": "Keine Produkte gefunden.",
  "Genereer weekmenu": "Wochenmenü generieren",
  "Gerecht bekijken (ingredi\\u00ebnten + bereiding) \\u2014 ontgrendelen via het slot": "Gericht ansehen (Zutaten + Zubereitung) — über das Schloss entsperren",
  "Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot": "Gericht ansehen (Zutaten + Zubereitung) — über das Schloss entsperren",
  "Gewenste voorraad aanpassen": "Gewünschten Bestand anpassen",
  "Hetzelfde gerecht opnieuw plannen na": "Gleiches Gericht erneut planen nach",
  "Hoe werkt de boodschappenlijst?": "Wie funktioniert die Einkaufsliste?",
  "Hoe werkt de voorraad?": "Wie funktioniert der Vorrat?",
  "Hoe werkt zoeken en filteren?": "Wie funktionieren Suche und Filter?",
  "Hoeveelheden geschaald voor afwijkende eters (\\u00d7{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Mengen skaliert für abweichende Personenzahl (×{f} ggü. Standard {n} Personen); Regeln ohne Zahl bleiben gleich.",
  "Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.": "Mengen skaliert für abweichende Personenzahl (×{f} ggü. Standard {n} Personen); Regeln ohne Zahl bleiben gleich.",
  "Huidige voorraad": "Aktueller Bestand",
  "Huishouden": "Haushalt",
  "Importeren": "Importieren",
  "Ingredi\\u00ebnt bevat": "Zutat enthält",
  "Ingredi\\u00ebnt verwijderen": "Zutat entfernen",
  "Ingredi\\u00ebnten": "Zutaten",
  "Ingredi\\u00ebnten voor {gerecht}": "Zutaten für {gerecht}",
  "Ingrediënt bevat": "Zutat enthält",
  "Ingrediënt verwijderen": "Zutat entfernen",
  "Ingrediënten": "Zutaten",
  "Ingrediënten voor {gerecht}": "Zutaten für {gerecht}",
  "Inhoud per verpakking": "Inhalt pro Packung",
  "Instant-maaltijd: {lijst}": "Fertiggericht: {liste}",
  "Instellingen": "Einstellungen",
  "Instellingen \\u00b7 vinkjes \\u00b7 verwijderingen": "Einstellungen · Häkchen · Löschungen",
  "Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart (": "Einstellungen pro Haushalt. Sie werden nur lokal auf diesem Gerät gespeichert (localStorage) und gelten direkt für das Wochenmenü und die Einkaufsliste. Tag-Index 0 ist der Wochenstart (",
  "Instellingen · vinkjes · verwijderingen": "Einstellungen · Häkchen · Löschungen",
  "Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.": "Ist der aktuelle Bestand niedriger als gewünscht? Dann steht das Produkt automatisch auf der Einkaufsliste.",
  "Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.": "Wähle den Keeper (das Produkt, das bleibt). Rezept-Verknüpfungen gehen auf den Keeper über; Varianten aus dem Namen werden als Pro-Rezept-Tag vorgeschlagen.",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen \\u2192 🛵 Afhaalmaaltijden):": "Bestellseite wählen (öffnet im Browser; verwalten über Einstellungen → 🛵 Zum Mitnehmen):",
  "Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):": "Bestellseite wählen (öffnet im Browser; verwalten über Einstellungen → 🛵 Zum Mitnehmen):",
  "Kies een dag deze week": "Wähle einen Tag diese Woche",
  "Kies een datum": "Datum wählen",
  "Kies uit de voorraad": "Aus dem Vorrat wählen",
  "Klaar": "Fertig",
  "Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.": "Klicke auf einen Tag, um zur Woche dieses Tags zu springen. 🔒 = gesperrtes Gericht, bleibt pro Datum gespeichert.",
  "Klik op een locatie om de producten te zien; \\uff0b onderaan een locatie voegt een product toe (altijd te verwijderen met \\u2715).": "Klicke auf einen Ort, um seine Produkte zu sehen; ＋ unten an einem Ort fügt ein Produkt hinzu (immer entfernbar mit ✕).",
  "Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).": "Klicke auf einen Ort, um seine Produkte zu sehen; ＋ unten an einem Ort fügt ein Produkt hinzu (immer entfernbar mit ✕).",
  "Laatst gegeten: {datum}": "Zuletzt gegessen: {datum}",
  "Locatie toevoegen": "Ort hinzufügen",
  "Locaties": "Orte",
  "Locaties (voorraadkast, koelkast\\u2026) zijn per huishouden: voeg toe met \\uff0b onderaan, verwijder met 🗑\\ufe0f \\u2014 pas als er geen producten meer aan hangen.": "Orte (Vorratskammer, Kühlschrank…) sind pro Haushalt: mit ＋ unten hinzufügen, mit 🗑️ entfernen — erst wenn keine Produkte mehr hängen.",
  "Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.": "Orte (Vorratskammer, Kühlschrank…) sind pro Haushalt: mit ＋ unten hinzufügen, mit 🗑️ entfernen — erst wenn keine Produkte mehr hängen.",
  "Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)": "Mindestanzahl Tage zwischen zwei Verwendungen dieses Produkts im Wochenmenü (0 = kein Zeit-Tag, max 365)",
  "Naam": "Name",
  "Naam van de locatie\\u2026": "Name des Orts…",
  "Naam van de locatie…": "Name des Orts…",
  "Naam\\u2026": "Name…",
  "Naam…": "Name…",
  "Naar deze week": "Zu dieser Woche",
  "Niets te halen bij {winkels}": "Bei {winkels} nichts zu holen",
  "Nieuw recept": "Neues Rezept",
  "Nieuwe categorie\\u2026": "Neue Kategorie…",
  "Nieuwe categorie…": "Neue Kategorie…",
  "Nog geen bestelsites geconfigureerd \\u2014 voeg toe via Instellingen \\u2192 🛵 Afhaalmaaltijden.": "Noch keine Bestellseiten konfiguriert — über Einstellungen → 🛵 Zum Mitnehmen hinzufügen.",
  "Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.": "Noch keine Bestellseiten konfiguriert — über Einstellungen → 🛵 Zum Mitnehmen hinzufügen.",
  "Nog geen producten in deze locatie.": "Noch keine Produkte an diesem Ort.",
  "Nog geen producten met tag \\u201cinstant-maaltijd\\u201d met have > 0 \\u2014 tag toekennen via de product-kaart.": "Noch keine Produkte mit Tag „instant-maaltijd“ und have > 0 — Tag über die Produktkarte vergeben.",
  "Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart.": "Noch keine Produkte mit Tag „instant-maaltijd“ und have > 0 — Tag über die Produktkarte vergeben.",
  "Nog niets afgevinkt \\u2014 vink de gehaalde artikelen af.": "Noch nichts abgehakt — gekaufte Artikel abhaken.",
  "Nog niets afgevinkt — vink de gehaalde artikelen af.": "Noch nichts abgehakt — gekaufte Artikel abhaken.",
  "Nog nooit vergrendeld gegeten": "Noch nie gegessen",
  "Onbekend": "Unbekannt",
  "Ontgrendelen": "Entsperren",
  "Opslaan": "Speichern",
  "Per product stel je de huidige voorraad in met \\u2212/+; de gewenste voorraad staat grijs erachter (\\u201cgewenst n\\u201d). Met \\u270f\\ufe0f achter de locatie pas je de gewenste hoeveelheden aan.": "Pro Produkt stellst du den aktuellen Bestand mit −/+ ein; der gewünschte Bestand steht grau dahinter („gewünscht n“). Mit ✏️ hinter dem Ort passt du die gewünschten Mengen an.",
  "Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.": "Pro Produkt stellst du den aktuellen Bestand mit −/+ ein; der gewünschte Bestand steht grau dahinter („gewünscht n“). Mit ✏️ hinter dem Ort passt du die gewünschten Mengen an.",
  "Per-recept tag (geldt alleen in dit recept, #59)": "Pro-Rezept-Tag (gilt nur in diesem Rezept, #59)",
  "Product verwijderen": "Produkt löschen",
  "Productcatalogus in-/uitklappen (#44)": "Produktkatalog ein-/ausklappen (#44)",
  "Producten": "Produkte",
  "Producten ({n})": "Produkte ({n})",
  "Producten samenvoegen (#59)": "Produkte zusammenführen (#59)",
  "Productnaam\\u2026": "Produktname…",
  "Productnaam…": "Produktname…",
  "Recept bewerken": "Rezept bearbeiten",
  "Recept toevoegen": "Rezept hinzufügen",
  "Recept verwijderen": "Rezept löschen",
  "Recepten": "Rezepte",
  "Recepten ({n})": "Rezepte ({n})",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als \\u00e9\\u00e9n chip mee.": "Rezepte, Produkte, Vorrat und Wochenmenü sind frei wählbar. Häkchen, Löschungen und Einstellungen gehören zusammen und gehen als ein Chip mit.",
  "Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.": "Rezepte, Produkte, Vorrat und Wochenmenü sind frei wählbar. Häkchen, Löschungen und Einstellungen gehören zusammen und gehen als ein Chip mit.",
  "Regel toevoegen": "Regel hinzufügen",
  "Regel verwijderen": "Regel entfernen",
  "Regels voor het weekmenu": "Regeln für das Wochenmenü",
  "Samengevoegd naar \\u201c{naam}\\u201d": "Zusammengeführt in „{naam}“",
  "Samengevoegd naar “{naam}”": "Zusammengeführt in „{naam}“",
  "Samenvoegen": "Zusammenführen",
  "Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.": "× Neuestes gewinnt — bei Bedarf danach manuell wiederherstellen:",
  "Samenvoegen geweigerd: {fout}": "Zusammenführen verweigert: {fout}",
  "Samenvoegen\\u2026": "Wird zusammengeführt…",
  "Samenvoegen…": "Wird zusammengeführt…",
  "Sorteren": "Sortieren",
  "Standaard geselecteerd op de boodschappenlijst": "Standardmäßig in der Einkaufsliste ausgewählt",
  "Standaard herstellen": "Standard wiederherstellen",
  "Standaardeenheid": "Standardeinheit",
  "Standaardlijst terug": "Standardliste zurücksetzen",
  "Stel eerst een weekmenu samen; de ingredi\\u00ebnten verschijnen dan hier automatisch.": "Stelle zuerst ein Wochenmenü zusammen; die Zutaten erscheinen dann automatisch hier.",
  "Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.": "Stelle zuerst ein Wochenmenü zusammen; die Zutaten erscheinen dann automatisch hier.",
  "Supermarkten": "Supermärkte",
  "Tag verwijderen": "Tag entfernen",
  "Tag-regels (bij automatisch plannen)": "Tag-Regeln (bei automatischer Planung)",
  "Tags": "Tags",
  "Tags (alle geselecteerde moeten erop \\u2014 AND)": "Tags (alle ausgewählten müssen passen — UND)",
  "Tags (alle geselecteerde moeten erop — AND)": "Tags (alle ausgewählten müssen passen — UND)",
  "Thema van de app \\u2014 lokaal opgeslagen per huishouden (#40).": "App-Design — lokal pro Haushalt gespeichert (#40).",
  "Thema van de app — lokaal opgeslagen per huishouden (#40).": "App-Design — lokal pro Haushalt gespeichert (#40).",
  "Thema {thema}": "Design {thema}",
  "Timetag (optioneel, #58)": "Zeit-Tag (optional, #58)",
  "Toevoegen": "Hinzufügen",
  "Toevoegen aan een onvergrendelde dag van deze week": "Zu einem entsperrten Tag dieser Woche hinzufügen",
  "Toon alle supermarkten": "Alle Supermärkte anzeigen",
  "Toon {n} recepten": "{n} Rezepte anzeigen",
  "Typ een gerecht\\u2026": "Gericht eingeben…",
  "Typ een gerecht…": "Gericht eingeben…",
  "URL\\u2026": "URL…",
  "URL…": "URL…",
  "Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)": "Aus Katalog entfernen (Verknüpfungen fallen auf Freitext zurück)",
  "Uitleg over delen via bestand": "Erklärung zum Teilen per Datei",
  "VANDAAG": "HEUTE",
  "Vega-dagen op de overige ": "Veggie-Tage an den übrigen ",
  "Vergrendelen": "Sperren",
  "Verwerk update": "Update verarbeiten",
  "Verwijderen": "Löschen",
  "Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten": "Löschen erst möglich, wenn keine Produkte/Artikel mehr in dieser Kategorie sind",
  "Vinkjes wissen": "Häkchen zurücksetzen",
  "Vis-dagen:": "Fischtage:",
  "Visdagen": "Fischtage",
  "Volgende week \\u25b6": "Nächste Woche ▶",
  "Volgende week ▶": "Nächste Woche ▶",
  "Voorkeurssupermarkt": "Bevorzugter Supermarkt",
  "Voorraad": "Vorrat",
  "Voorraad ({n})": "Vorrat ({n})",
  "Wat gaat er mee? (tik om aan/uit te zetten)": "Was soll mit? (tippen zum Umstellen)",
  "Week start op": "Woche beginnt am",
  "Week van ": "Woche vom ",
  "Weekmenu": "Wochenmenü",
  "Weekmenu & Boodschappen": "Wochenmenü & Einkäufe",
  "Weekmenu & Boodschappenlijst": "Wochenmenü & Einkaufsliste",
  "Weekmenu ({n} dagen)": "Wochenmenü ({n} Tage)",
  "Weekmenu en boodschappenlijst: weekmenu samenstellen, boodschappen genereren en voorraad beheren. Alles lokaal op je eigen apparaat.": "Wochenmenü und Einkaufsliste: Wochenmenü zusammenstellen, Einkäufe generieren und Vorrat verwalten. Alles lokal auf deinem eigenen Gerät.",
  "Weekstart": "Wochenstart",
  "Weergave": "Darstellung",
  "Winkelvoorkeur": "Bevorzugter Laden",
  "Winkelvoorkeur: dit artikel wordt daar gehaald": "Geschäftswahl: dieser Artikel wird dort gekauft",
  "Wis filters": "Filter löschen",
  "Zoek op receptnaam en filter op bereidingstijd, ingredi\\u00ebnt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingredi\\u00ebnten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Suche nach Rezeptname und filtere nach Zubereitungszeit, Zutat oder Tag(s). Tippe auf ein Rezept, um Name, Kategorie, Zubereitungszeit, Tags, Zutaten und Zubereitung zu bearbeiten. Alles wird lokal auf deinem Gerät gespeichert; mit Export/Import teilst du die Liste als JSON.",
  "Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.": "Suche nach Rezeptname und filtere nach Zubereitungszeit, Zutat oder Tag(s). Tippe auf ein Rezept, um Name, Kategorie, Zubereitungszeit, Tags, Zutaten und Zubereitung zu bearbeiten. Alles wird lokal auf deinem Gerät gespeichert; mit Export/Import teilst du die Liste als JSON.",
  "Zoek op receptnaam\\u2026": "Rezeptname suchen…",
  "Zoek op receptnaam…": "Rezeptname suchen…",
  "Zoek product\\u2026": "Produkt suchen…",
  "Zoek product…": "Produkt suchen…",
  "Zoekopdracht wissen": "Suche löschen",
  "\\u00d7": "× Neuestes gewinnt — bei Bedarf danach manuell wiederherstellen:",
  "\\u00d7 gebruikt (recepten, voorraad, extra)": "× verwendet (Rezepte, Vorrat, Extras)",
  "\\u00d7 nieuwste wint \\u2014 zo nodig hierna zelf herstellen:": "× Neuestes gewinnt — bei Bedarf danach manuell wiederherstellen:",
  "\\u201d als eigen tekst opslaan (geen boodschappen)": "” als Freitext speichern (keine Einkäufe)",
  "\\u21b5 Enter \\u2014 \\u201c": "↵ Enter — „",
  "\\u21c5 Sorteer \\u25be": "⇅ Sortieren ▾",
  "\\u25c0 Vorige week": "◀ Vorherige Woche",
  "\\u2699 Filters \\u25be": "⚙ Filter ▾",
  "\\u2699\\ufe0f Regels voor het weekmenu": "⚙️ Regeln für das Wochenmenü",
  "\\u26a0\\ufe0f Dit bestand kon niet worden gelezen.": "⚠️ Diese Datei konnte nicht gelesen werden.",
  "\\u26a0\\ufe0f Dit is geen deelbestand van de weekmenu-app.": "⚠️ Das ist keine Teilungsdatei der Weekmenu-App.",
  "\\u26a1 Instant uit voorraad": "⚡ Instant aus dem Vorrat",
  "\\u2705 Samengevoegd": "✅ Zusammengeführt",
  "\\u2705 {ok} gerechten compleet{rest} \\u2014 zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} Gerichte komplett{rest} — siehe Wochenmenü (Liste bleibt abhakbar)",
  "\\u2705 {recept} toegevoegd aan {dag} {datum}": "✅ {recept} zu {dag} {datum} hinzugefügt",
  "\\u2713 Alles aangevuld": "✓ Alles aufgefüllt",
  "\\u2713 Naam (A\\u2013Z)": "✓ Name (A–Z)",
  "\\u2715 Foto verwijderen": "✕ Foto entfernen",
  "\\u2796 Niets nieuws in dit bestand.": "🖶 Nichts Neues in dieser Datei.",
  "\\u27f2 Ongedaan maken": "↲ Rückgängig",
  "\\uff0b Ingredi\\u00ebnt toevoegen": "+ Zutat hinzufügen",
  "\\uff0b Locatie toevoegen": "+ Ort hinzufügen",
  "\\uff0b Product toevoegen": "+ Produkt hinzufügen",
  "\\uff0b tag toevoegen\\u2026": "+ Tag hinzufügen…",
  "alle artikelen hebben een winkelvoorkeur voor een andere supermarkt": "alle Artikel haben eine Geschäftswahl für einen anderen Supermarkt",
  "altijd": "immer",
  "bijv. 500": "z. B. 500",
  "bijv. zalm, ui, kaas\\u2026": "z. B. Lachs, Zwiebel, Käse…",
  "bijv. zalm, ui, kaas…": "z. B. Lachs, Zwiebel, Käse…",
  "boodschappenlijst \\u00d7": "Einkaufsliste ×",
  "boodschappenlijst ×": "Einkaufsliste ×",
  "cat.extra": "Extra",
  "cat.vega": "Veggie",
  "cat.vis": "Fisch",
  "cat.vlees": "Fleisch",
  "dagen": "Tage",
  "de geselecteerde supermarkt": "der ausgewählte Supermarkt",
  "deze week": "diese Woche",
  "geen": "keine",
  "geen ingredi\\u00ebnten bekend": "keine Zutaten bekannt",
  "geen ingredienten bekend": "keine Zutaten bekannt",
  "geen ingrediënten bekend": "keine Zutaten bekannt",
  "gewenst": "gewünscht",
  "gisteren": "gestern",
  "have ": "have ",
  "nog geen tag-regels": "noch keine Tag-Regeln",
  "nog geen tags in de pool": "noch keine Tags im Pool",
  "op lijst": "auf Liste",
  "overig": "Sonstiges",
  "sleutel\\u2026": "Schlüssel…",
  "sleutel…": "Schlüssel…",
  "standaard": "Standard",
  "standaard: ": "Standard: ",
  "tag\\u2026": "Tag…",
  "tag…": "Tag…",
  "time.kort": "kurz",
  "time.lang": "lang",
  "time.normaal": "normal",
  "toon": "anzeigen",
  "vandaag": "heute",
  "verberg": "ausblenden",
  "{done} van {total} afgevinkt": "{done} von {total} abgehakt",
  "{naam}: nog {n} dag(en) binnen de timetag": "{naam}: noch {n} Tag(e) innerhalb des Zeit-Tags",
  "{n} afgevinkt \\u00b7 {actie} \\u25be": "{n} abgehakt · {actie} ▾",
  "{n} afgevinkt · {actie} ▾": "{n} abgehakt · {actie} ▾",
  "{n} blijft": "{n} bleibt",
  "{n} dagen geleden": "vor {n} Tagen",
  "{n} eters": "{n} Personen",
  "{n} jr geleden": "vor {n} J.",
  "{n} mnd geleden": "vor {n} Mon.",
  "{n} nieuw": "{n} neu",
  "{n} nieuwer uit bestand": "{n} neuer aus Datei",
  "{n} product": "{n} Produkt",
  "{n} producten": "{n} Produkte",
  "{n} van de {m} ingredi\\u00ebnten mist nog": "{n} von {m} Zutaten fehlen noch",
  "{n} van de {m} ingrediënten mist nog": "{n} von {m} Zutaten fehlen noch",
  "{n} verwijderd": "{n} entfernt",
  "{n} wk geleden": "vor {n} Wo.",
  "×": "× Neuestes gewinnt — bei Bedarf danach manuell wiederherstellen:",
  "× gebruikt (recepten, voorraad, extra)": "× verwendet (Rezepte, Vorrat, Extras)",
  "× nieuwste wint — zo nodig hierna zelf herstellen:": "× Neuestes gewinnt — bei Bedarf danach manuell wiederherstellen:",
  "” als eigen tekst opslaan (geen boodschappen)": "” als Freitext speichern (keine Einkäufe)",
  "↵ Enter — “": "↵ Enter — „",
  "⇅ Sorteer ▾": "⇅ Sortieren ▾",
  "◀ Vorige week": "◀ Vorherige Woche",
  "⚙ Filters ▾": "⚙ Filter ▾",
  "⚙️ Regels voor het weekmenu": "⚙️ Regeln für das Wochenmenü",
  "⚠️ Dit bestand kon niet worden gelezen.": "⚠️ Diese Datei konnte nicht gelesen werden.",
  "⚠️ Dit is geen deelbestand van de weekmenu-app.": "⚠️ Das ist keine Teilungsdatei der Weekmenu-App.",
  "⚡ Instant uit voorraad": "⚡ Instant aus dem Vorrat",
  "✅ Samengevoegd": "✅ Zusammengeführt",
  "✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)": "✅ {ok} Gerichte komplett{rest} — siehe Wochenmenü (Liste bleibt abhakbar)",
  "✅ {recept} toegevoegd aan {dag} {datum}": "✅ {recept} zu {dag} {datum} hinzugefügt",
  "✓ Alles aangevuld": "✓ Alles aufgefüllt",
  "✓ Naam (A–Z)": "✓ Name (A–Z)",
  "✕ Foto verwijderen": "✕ Foto entfernen",
  "➖ Niets nieuws in dit bestand.": "🖶 Nichts Neues in dieser Datei.",
  "⟲ Ongedaan maken": "↲ Rückgängig",
  "＋ Ingrediënt toevoegen": "+ Zutat hinzufügen",
  "＋ Locatie toevoegen": "+ Ort hinzufügen",
  "＋ Product toevoegen": "+ Produkt hinzufügen",
  "＋ tag toevoegen…": "+ Tag hinzufügen…",
  "🍔 Afhaalmaaltijd": "🍔 Zum Mitnehmen",
  "🍽\\ufe0f gerecht": "🍽️ Gericht",
  "🍽️ gerecht": "🍽️ Gericht",
  "🏷\\ufe0f product": "🏷️ Produkt",
  "🏷️ product": "🏷️ Produkt",
  "📅 Kies een datum \\u25be": "📅 Datum wählen ▾",
  "📅 Kies een datum ▾": "📅 Datum wählen ▾",
  "📍 geen boodschappen": "📍 keine Einkäufe",
  "📤 Maak deelbestand": "📤 Teilungsdatei erstellen",
  "📤 maakt een bestand met jouw data. 📥 leest zo\\u2019n bestand in en voegt het samen met wat hier al staat.": "📤 erstellt eine Datei mit deinen Daten. 📥 liest eine solche Datei und führt sie mit dem zusammen, was hier schon steht.",
  "📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.": "📤 erstellt eine Datei mit deinen Daten. 📥 liest eine solche Datei und führt sie mit dem zusammen, was hier schon steht.",
  "📦 Productcatalogus": "📦 Produktkatalog",
  "📷 Foto toevoegen": "📷 Foto hinzufügen",
  "📷 Vervangen": "📷 Ersetzen",
  "🕒 Laatst gegeten": "🕒 Zuletzt gegessen",
  "🕒 Laatst gegeten (langst geleden eerst)": "🕒 Zuletzt gegessen (längstens her zuerst)",
  "🛵 Afhaalmaaltijden (bestelsites)": "🛵 Mitnahme-Seiten (Bestellseiten)",
  "Taal {taal}": "Sprache {taal}",
  "Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).": "Sprache der App (GUI) — lokal pro Haushalt gespeichert (ADR-023).",
  "Taal van de app (GUI) \\u2014 lokaal opgeslagen per huishouden (ADR-023).": "Sprache der App (GUI) — lokal pro Haushalt gespeichert (ADR-023).",
  "Taal": "Sprache",
};

},
"src/domain/menu.js": function (module, exports, require) {
// Weekmenu-generatie: pure helpers.
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}


exports.shuffle = shuffle;
},
"src/domain/settings.js": function (module, exports, require) {
// Per-huishouden instellingen (ADR-009): defaults, thema's en normalisatie.
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

const __imp0 = require("../i18n/index.js");
const { isLanguage } = __imp0;

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
  language: "nl", // GUI-taal (ADR-023): "nl" | "en" | "fr" | "de"; default Nederlands
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
  out.language = isLanguage(out.language) ? out.language : d.language; // ADR-023: ongeldige/ontbrekende taal -> nl
  return out;
}

exports.FISH_DAYS = FISH_DAYS;
exports.MARKETS = MARKETS;
exports.SHOP_CATS_DEFAULT = SHOP_CATS_DEFAULT;
exports.DEFAULT_SETTINGS = DEFAULT_SETTINGS;
exports.THEMES = THEMES;
exports.THEME_KEYS = THEME_KEYS;
exports.THEME_TAB_ICONS = THEME_TAB_ICONS;
exports.THEME_META = THEME_META;
exports.normalizeDayList = normalizeDayList;
exports.normalizeSettings = normalizeSettings;
},
"src/domain/share.js": function (module, exports, require) {
// Delen via bestand (ADR-019): stempels, tombstones en merge-regels (pure helpers).
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



exports.SHARE_BUNDLE = SHARE_BUNDLE;
exports.shareStrip = shareStrip;
exports.shareStampArray = shareStampArray;
exports.shareStampObject = shareStampObject;
exports.shareTombs = shareTombs;
exports.shareTombsObject = shareTombsObject;
exports.shareTs = shareTs;
exports.mergeShareBundle = mergeShareBundle;
},
"src/domain/storage.js": function (module, exports, require) {
const __imp0 = require("./dates.js");
const { weekDateKeys } = __imp0;
const __imp1 = require("./settings.js");
const { normalizeSettings } = __imp1;
// localStorage-laag (ADR-005): laden/opslaan + migratie van oude state.
const LS_KEY = "weekmenu-app-v1";
const newId = (prefix) => prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e4);


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


exports.LS_KEY = LS_KEY;
exports.newId = newId;
exports.loadState = loadState;
exports.saveState = saveState;
exports.migrateStored = migrateStored;
},
"src/lib/externals.js": function (module, exports, require) {
// Externe UMD-modules (geladen via index.html vóór app.js; in Node-tests via require).
// issue #59: productnormalisatie-module (geladen via index.html vóór app.js; in Node-tests via require)
const PN = (typeof globalThis !== "undefined" && globalThis.ProductNormalisatie) || null;
// issue #58: timetags-module ( idem )
const TT = (typeof globalThis !== "undefined" && globalThis.Timetags) || null;
// issue #60: gerecht-foto's (lokale IndexedDB image-store)
const GF = (typeof globalThis !== "undefined" && globalThis.GerechtFotos) || null;

exports.PN = PN;
exports.TT = TT;
exports.GF = GF;
},
"src/ui/menuTab.jsx": function (module, exports, require) {
// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
const __imp0 = require("./components.jsx");
const { createSharedViews } = __imp0;
const __imp1 = require("../domain/catalog.js");
const { fmtFactor, ingLabel, matchRecipes } = __imp1;
const __imp2 = require("../domain/dates.js");
const { dayShortOf, fmtDay, weeksBetween } = __imp2;
const __imp3 = require("../i18n/index.js");
const { dayNames, monthNames, t } = __imp3;
const __imp4 = require("./components.jsx");
const { highlightMatch } = __imp4;
const __imp5 = require("./labels.js");
const { CAT_LABEL, CAT_STYLE, TIME_LABEL, TIME_STYLE } = __imp5;

function createMenuTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { activeSuggest, addTagRule, allRuleTags, applyDeviation, byId, calAnchor, calWeeks, commitDay, dayTimetagMarks, days, devPick, devTab, deviationKey, dishImgs, drafts, eatersOpen, ensureDishFoto, fishDays, generateMenu, haveOfProd, instantProducts, mealStatus, menuByDate, openDay, openProdCard, openSuggest, otherDays, prodById, recipes, removeTagRule, ruleDraft, safeExternalUrl, selectRecipe, setActiveSuggest, setDateSheetOpen, setDay, setDevPick, setDevTab, setDeviationKey, setDrafts, setEaters, setEatersOpen, setOpenDay, setOpenSuggest, setRuleDraft, setRulesSheetOpen, setTab, setTagRuleDays, setWeekOffset, settings, todayKey, todayLabel, updateSettings, vegaCount, weekEntries, weekKeys, weekLabel, weekOffset } = ctx;

  const renderMenuTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2" }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 font-medium tracking-wide" }, __t("VANDAAG")), /*#__PURE__*/React.createElement("div", { "className": "text-2xl font-bold" }, todayLabel)), /*#__PURE__*/React.createElement("button", { "onClick": () => setDateSheetOpen(true), "className": "shrink-0 px-3 py-2 border rounded-lg text-sm text-stone-600 bg-white" }, __t("📅 Kies een datum ▾"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-1" }, __t("Week van "), weekLabel), /*#__PURE__*/React.createElement("button", { "onClick": generateMenu, "className": "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl mt-3" }, __t("Genereer weekmenu"))), /*#__PURE__*/React.createElement("div", { "className": "space-y-2" }, days.map((day, i) => {
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
          const ttMarks = dayTimetagMarks(key); // #58
          return (
            /*#__PURE__*/React.createElement("div", { "key": key, "className": `rounded-xl shadow-sm p-3 ${isToday ? "bg-emerald-100" : "bg-white"}` }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "w-20 shrink-0" }, /*#__PURE__*/React.createElement("div", { "className": `text-sm font-semibold ${isToday ? "text-emerald-700" : ""}` }, day), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400" }, fmtDay(key), isToday ? t(" · vandaag") : ""), ttMarks.length > 0 && (
                    /*#__PURE__*/React.createElement("span", { "className": "chip", "style": { background: "#fef3c7", color: "#92400e" }, "title": ttMarks.map((m) => t("{naam}: nog {n} dag(en) binnen de timetag", { naam: m.name, n: m.remaining })).join("; ") }, "⏱", ttMarks.reduce((a, m) => a + m.remaining, 0), __t(" d"))
                  )), /*#__PURE__*/React.createElement("div", { "className": "flex-1 min-w-0 suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "dish-input", "value": text, "placeholder": __t("Typ een gerecht…"), "readOnly": !!(entry && entry.locked), "onClick": () => { if (entry && entry.locked) { const willOpen = openDay !== key; setOpenDay(willOpen ? key : null); if (willOpen && entry.id) void ensureDishFoto(entry.id); } }, "title": entry && entry.locked ? t("Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot") : undefined, "onChange": (e) => {
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
                    /*#__PURE__*/React.createElement("div", { "className": "mt-0.5" }, /*#__PURE__*/React.createElement("span", { "className": "tag-free" }, __t("📍 geen boodschappen")))
                  ), !isCustom && r && (
                    /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-0.5" }, /*#__PURE__*/React.createElement("span", { "className": `inline-block px-1.5 rounded ${CAT_STYLE[r.cat]}` }, CAT_LABEL[r.cat]), /*#__PURE__*/React.createElement("span", { "className": `inline-block px-1.5 rounded ${TIME_STYLE[r.timeCat || "normaal"]}` }, TIME_LABEL[r.timeCat || "normaal"]))
                  ), suggestions.length > 0 && (
                    /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, suggestions.map((s, si) => (
                        /*#__PURE__*/React.createElement("div", { "key": s.id, "className": `suggest-item${si === activeSuggest ? " active" : ""}`, "onMouseDown": (e) => {
                            e.preventDefault();
                            selectRecipe(i, s.id);
                          } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s.name, q)), /*#__PURE__*/React.createElement("span", { "className": `text-[10px] shrink-0 inline-block px-1.5 rounded ${CAT_STYLE[s.cat]}` }, CAT_LABEL[s.cat]))
                      )), /*#__PURE__*/React.createElement("div", { "className": "suggest-foot" }, __t("↵ Enter — “"), text.trim(), __t("” als eigen tekst opslaan (geen boodschappen)")))
                  )), /*#__PURE__*/React.createElement("button", { "className": `eatersbtn${eatersOverride != null ? " over" : ""}${isCustom ? " opacity-40" : ""}`, "title": isCustom ? t("Geen boodschappen voor deze dag") : t("Aantal eters deze dag"), "onClick": () => {
                    if (isCustom || !entry) return;
                    setEatersOpen(eatersOpen === key ? null : key);
                  } }, "👥", eatersOverride != null && /*#__PURE__*/React.createElement("span", { "className": "ebadge" }, eatersOverride)), mealStatus[key] && (
                  /*#__PURE__*/React.createElement("span", { "className": "shrink-0 text-sm", "title": mealStatus[key].title }, mealStatus[key].icon)
                ), isToday && (
                  /*#__PURE__*/React.createElement("button", { "className": "shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center bg-stone-100 text-stone-500", "title": __t("Afwijking van het weekplan (geen/weinig energie vandaag)"), "onClick": () => { setDeviationKey(key); setDevTab("instant"); setDevPick({}); } }, "🪫")
                ), /*#__PURE__*/React.createElement("button", { "title": entry && entry.locked ? t("Ontgrendelen") : t("Vergrendelen"), "onClick": () => entry && setDay(i, { ...entry, locked: !entry.locked }), "className": `shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center ${entry && entry.locked ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"}` }, entry && entry.locked ? "🔒" : "🔓")), openDay === key && entry && entry.locked && r && (
                /*#__PURE__*/React.createElement("div", { "className": "mt-2 pt-2 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, __t("Ingrediënten")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mb-2" }, (r.ingredients || []).filter(Boolean).map((ing, ii) => {
                      const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                      return (
                        /*#__PURE__*/React.createElement("button", { "key": ii, "type": "button", "className": "prodchip", "onClick": () => p && openProdCard("menu-" + key, p.id) }, ingLabel(ing, prodById))
                      );
                    })), renderProductCard("menu-" + key), dishImgs[entry.id] && (
                    /*#__PURE__*/React.createElement("img", { "src": dishImgs[entry.id], "alt": r.name, "className": "mb-2", "style": { width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "0.75rem" } })
                  ), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, __t("Bereiding")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, r.bereiding || "—"))
              ), eatersOpen === key && entry && !isCustom && (
                /*#__PURE__*/React.createElement("div", { "className": "mt-2 pt-2 border-t flex items-center gap-2 flex-wrap" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.max(1, effectiveEaters - 1)) }, "−"), /*#__PURE__*/React.createElement("span", null, effectiveEaters), /*#__PURE__*/React.createElement("button", { "onClick": () => setEaters(i, Math.min(99, effectiveEaters + 1)) }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500" }, __t("standaard: "), settings.householdSize, __t(" eters")), /*#__PURE__*/React.createElement("button", { "className": "text-xs text-emerald-700 font-semibold", "onClick": () => setEaters(i, null) }, __t("Standaard herstellen")), factor !== 1 && (
                    /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 ml-auto" }, __t("boodschappenlijst ×"), fmtFactor(factor), __t(" voor deze dag"))
                  ))
              ))
          );
        })), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(true), "className": "w-full mt-4 py-2.5 border rounded-xl text-sm font-medium text-stone-600 bg-white shadow-sm" }, __t("⚙️ Regels voor het weekmenu")))
  );


  const renderDateSheet = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDateSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, __t("Kies een datum")), /*#__PURE__*/React.createElement("button", { "onClick": () => setDateSheetOpen(false), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-0.5" }, days.map((d) => (
              /*#__PURE__*/React.createElement("div", { "key": d, "className": "text-[10px] text-stone-400 text-center font-medium" }, d.slice(0, 2))
            ))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-3" }, weekKeys.map((k) => (
              /*#__PURE__*/React.createElement("div", { "key": k, "className": `flex flex-col items-center justify-center py-1.5 rounded-lg text-xs ${
                  k === todayKey ? "bg-emerald-600 text-white font-bold" : "bg-stone-100 text-stone-700 font-semibold"
                }` }, Number(k.slice(8, 10)))
            ))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2 mb-2" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset((o) => o - 1), "className": "px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white" }, __t("◀ Vorige week")), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-600" }, weekLabel), /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset((o) => o + 1), "className": "px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white" }, __t("Volgende week ▶"))), weekOffset !== 0 && (
            /*#__PURE__*/React.createElement("button", { "onClick": () => setWeekOffset(0), "className": "w-full mb-2 py-1.5 border rounded-lg text-xs text-stone-500 bg-white" }, __t("Naar deze week"))
          ), /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, monthNames()[calAnchor.getMonth()], " ", calAnchor.getFullYear()), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-7 gap-0.5 mb-0.5" }, days.map((d) => (
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
          )), /*#__PURE__*/React.createElement("p", { "className": "text-xs text-stone-400 mt-2" }, __t("Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.")))))
  );

  // #42: afwijkings-sheet (🪫 op de dag van vandaag) — segmented afhaalmaaltijd / instant uit voorraad

  const renderDeviationSheet = () => {
    const k = deviationKey;
    if (!k) return null;
    const links = settings.takeawayLinks || [];
    const inst = instantProducts;
    const totalPicked = Object.values(devPick).reduce((a, b) => a + (Number(b) || 0), 0);
    return (
      /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDeviationKey(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, __t("Afwijking · "), dayShortOf(k), " ", fmtDay(k)), /*#__PURE__*/React.createElement("button", { "onClick": () => setDeviationKey(null), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "segl mb-3" }, /*#__PURE__*/React.createElement("button", { "className": devTab === "instant" ? "on" : "", "onClick": () => setDevTab("instant") }, __t("⚡ Instant uit voorraad")), /*#__PURE__*/React.createElement("button", { "className": devTab === "afhaal" ? "on" : "", "onClick": () => setDevTab("afhaal") }, __t("🍔 Afhaalmaaltijd"))), devTab === "instant" ? (
              /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1 flex items-center gap-1" }, /*#__PURE__*/React.createElement("span", null, __t("Kies uit de voorraad")), /*#__PURE__*/React.createElement("span", { "title": __t("Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.") }, "ℹ️")), inst.length === 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 py-2" }, __t("Nog geen producten met tag “instant-maaltijd” met have > 0 — tag toekennen via de product-kaart."))
                ), inst.map((p2) => {
                  const have = haveOfProd(p2);
                  const n = Number(devPick[p2.id]) || 0;
                  return (
                    /*#__PURE__*/React.createElement("div", { "key": p2.id, "className": "flex items-center gap-2 py-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm truncate" }, p2.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0" }, __t("have "), have), /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setDevPick((d) => ({ ...d, [p2.id]: Math.max(0, n - 1) })) }, "−"), /*#__PURE__*/React.createElement("span", null, n), /*#__PURE__*/React.createElement("button", { "onClick": () => setDevPick((d) => ({ ...d, [p2.id]: Math.min(have, n + 1) })) }, "+")))
                  );
                }), /*#__PURE__*/React.createElement("button", { "className": "w-full mt-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40", "disabled": totalPicked === 0, "onClick": () => {
                    const parts = inst.filter((p2) => Number(devPick[p2.id]) > 0).map((p2) => `${devPick[p2.id]}× ${p2.name}`);
                    applyDeviation(k, t("Instant-maaltijd: {lijst}", { lijst: parts.join(", ") }), devPick);
                    setDeviationKey(null);
                  } }, __t("Bevestig · weekplan schuift 1 dag op")))
            ) : (
              /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1" }, __t("Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):")), links.length === 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 py-2" }, __t("Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden."))
                ), links.map((l) => (
                  /*#__PURE__*/React.createElement("button", { "key": l.id, "className": "w-full flex items-center gap-2 border rounded-xl px-3 py-2 mb-2 text-left", "onClick": () => {
                      const url = safeExternalUrl(l.url);
                      if (url && typeof window !== "undefined" && window.open) window.open(url, "_blank", "noopener");
                      applyDeviation(k, t("Afhaalmaaltijd"), null);
                      setDeviationKey(null);
                    } }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm text-emerald-700 font-medium truncate" }, l.label), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0 max-w-40 truncate" }, l.url), /*#__PURE__*/React.createElement("span", { "className": "shrink-0" }, "↗"))
                )), /*#__PURE__*/React.createElement("button", { "className": "w-full mt-1 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold", "onClick": () => { applyDeviation(k, t("Afhaalmaaltijd"), null); setDeviationKey(null); } }, __t("Afhaalmaaltijd · weekplan schuift 1 dag op")))
            ))))
    );
  };


  const renderRulesSheet = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setRulesSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, __t("Regels voor het weekmenu")), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "text-stone-400 px-1 text-lg leading-none" }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, __t("Weekstart")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, dayNames().map((d, i) => (
                /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () => updateSettings({ weekStartDay: i }), "className": `chip${settings.weekStartDay === i ? " on" : ""}` }, d.slice(0, 2))
              )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, __t("Visdagen")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1" }, days.map((d, i) => (
                /*#__PURE__*/React.createElement("button", { "key": d, "onClick": () =>
                    updateSettings({
                      fishDays: fishDays.includes(i) ? fishDays.filter((x) => x !== i) : [...fishDays, i].sort((a, b) => a - b),
                    })
                  , "className": `chip fish${fishDays.includes(i) ? " on" : ""}` }, d.slice(0, 2))
              )))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, __t("Vega-dagen op de overige "), otherDays.length, __t(" dagen")), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-3" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.max(0, vegaCount - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, vegaCount), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ vegaTarget: Math.min(otherDays.length, vegaCount + 1) }) }, "+")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, vegaCount, __t(" vega · "), otherDays.length - vegaCount, __t(" vlees")))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, __t("Tag-regels (bij automatisch plannen)")), (settings.tagRules || []).length === 0 && /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mb-1" }, __t("nog geen tag-regels")), (settings.tagRules || []).map((rule, i) => (
              /*#__PURE__*/React.createElement("div", { "key": i, "className": "flex items-center gap-2 mb-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "chip" }, rule.kind === "product" ? "🏷️" : "🍽️", " ", rule.tag), /*#__PURE__*/React.createElement("div", { "className": "stepctrl" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setTagRuleDays(i, rule.days - 1), "disabled": rule.days <= 0 }, "−"), /*#__PURE__*/React.createElement("span", null, rule.days), /*#__PURE__*/React.createElement("button", { "onClick": () => setTagRuleDays(i, rule.days + 1), "disabled": rule.days >= 30 }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0" }, __t("dagen")), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-300 hover:text-red-500 text-sm", "onClick": () => removeTagRule(i), "title": __t("Regel verwijderen") }, "✕"))
            )), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1.5 mt-2" }, /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1.5 py-1.5 text-xs text-stone-600 shrink-0", "value": ruleDraft.kind, "onChange": (e) => setRuleDraft({ ...ruleDraft, kind: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "product" }, __t("🏷️ product")), /*#__PURE__*/React.createElement("option", { "value": "recipe" }, __t("🍽️ gerecht"))), /*#__PURE__*/React.createElement("input", { "className": "w-full min-w-0 border rounded-lg px-2 py-1.5 text-xs", "value": ruleDraft.tag, "placeholder": __t("tag…"), "list": "tagrules-tags", "onChange": (e) => setRuleDraft({ ...ruleDraft, tag: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addTagRule(); } } }), /*#__PURE__*/React.createElement("datalist", { "id": "tagrules-tags" }, allRuleTags.map((t) => (/*#__PURE__*/React.createElement("option", { "key": t, "value": t })))), /*#__PURE__*/React.createElement("div", { "className": "stepctrl shrink-0" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setRuleDraft({ ...ruleDraft, days: Math.max(0, ruleDraft.days - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, ruleDraft.days), /*#__PURE__*/React.createElement("button", { "onClick": () => setRuleDraft({ ...ruleDraft, days: Math.min(30, ruleDraft.days + 1) }) }, "+")), /*#__PURE__*/React.createElement("button", { "className": "px-2.5 py-1.5 border rounded-lg text-xs text-stone-600 bg-white shrink-0", "onClick": addTagRule, "title": __t("Regel toevoegen") }, "＋"))), /*#__PURE__*/React.createElement("div", { "className": "mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-medium text-stone-500 mb-1" }, __t("Hetzelfde gerecht opnieuw plannen na")), /*#__PURE__*/React.createElement("div", { "className": "segl" }, [[0, t("altijd")], [3, t("3 dagen")], [7, t("7 dagen")], [14, t("14 dagen")], [30, t("30 dagen")]].map(([v, label]) => (
                /*#__PURE__*/React.createElement("button", { "key": v, "className": Math.min(30, Math.max(0, Number(settings.dishRepeatDays) || 0)) === v ? "on" : "", "onClick": () => updateSettings({ dishRepeatDays: v }) }, label)
              )))), /*#__PURE__*/React.createElement("button", { "onClick": () => { setRulesSheetOpen(false); setTab("settings"); }, "className": "block text-xs text-emerald-700 font-medium mb-3" }, __t("Eters & supermarkten → Instellingen")), /*#__PURE__*/React.createElement("button", { "onClick": () => setRulesSheetOpen(false), "className": "w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium" }, __t("Klaar")))))
  );


  return { renderMenuTab, renderDateSheet, renderDeviationSheet, renderRulesSheet };
}

exports.createMenuTab = createMenuTab;
},
"src/ui/components.jsx": function (module, exports, require) {
// Gedeelde render-helpers (product-kaart, ingrediënt-rijen) + highlightMatch.
const __imp0 = require("../domain/catalog.js");
const { UNITS, UNIT_GROUP, ingUnit, matchProducts } = __imp0;

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

function createSharedViews(ctx) {
  const { activeIngSuggest, addProdTag, allProductTags, commitIngAmount, commitNewIngAmount, deleteProductCatalog, ingDrafts, ingSuggest, marketChip, markets, openProd, prodById, prodEdit, products, removeProdTag, resolveIng, resolveNewIng, saveProductEdit, selectIngProduct, selectNewIngProduct, setActiveIngSuggest, setIngAmount, setIngDrafts, setIngSuggest, setIngTags, setIngUnit, setNewIngAmount, setNewIngUnit, setNewRecipe, setProdEdit, setRecipes, shopCats , usageCount } = ctx;

  const renderProductCard = (rowKey) => {
    if (openProd !== rowKey || !prodEdit) return null;
    const p = products.find((x) => x.id === prodEdit.id);
    if (!p) return null;
    return (
      /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 bg-stone-50 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Naam")), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": prodEdit.name, "onChange": (e) => setProdEdit({ ...prodEdit, name: e.target.value }) })), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Categorie")), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.cat, "onChange": (e) => setProdEdit({ ...prodEdit, cat: e.target.value }) }, shopCats.map((c) => (/*#__PURE__*/React.createElement("option", { "key": c, "value": c }, c))), prodEdit.cat !== "overig" && !shopCats.includes(prodEdit.cat) && /*#__PURE__*/React.createElement("option", { "value": prodEdit.cat }, prodEdit.cat), /*#__PURE__*/React.createElement("option", { "value": "overig" }, __t("overig"))))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mt-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Eenheid (standaard bij dit product)")), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.unit || "", "onChange": (e) => setProdEdit({ ...prodEdit, unit: e.target.value || null }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "–"), UNITS.map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))), /*#__PURE__*/React.createElement("div", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Voorkeurssupermarkt")), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, /*#__PURE__*/React.createElement("button", { "className": `chip${!prodEdit.market ? " on" : ""}`, "onClick": () => setProdEdit({ ...prodEdit, market: null }) }, __t("geen")), markets.map((m) => (
                /*#__PURE__*/React.createElement("button", { "key": m.key, "className": `chip${prodEdit.market === m.key ? " on" : ""}`, "onClick": () => setProdEdit({ ...prodEdit, market: m.key }) }, marketChip(m.key))
              ))))), /*#__PURE__*/React.createElement("div", { "className": "grid grid-cols-2 gap-2 mt-2" }, /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Inhoud per verpakking")), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "type": "number", "min": "0", "step": "any", "placeholder": __t("bijv. 500"), "value": prodEdit.packAmount || "", "onChange": (e) => setProdEdit({ ...prodEdit, packAmount: e.target.value }) })), /*#__PURE__*/React.createElement("label", { "className": "text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Eenheid van de inhoud")), /*#__PURE__*/React.createElement("select", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600", "value": prodEdit.packUnit || "", "onChange": (e) => setProdEdit({ ...prodEdit, packUnit: e.target.value }) }, /*#__PURE__*/React.createElement("option", { "value": "" }, "–"), UNITS.map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u)))))), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 mt-0.5" }, __t("#35: per 1 "), prodEdit.unit || "verpakking", " = ", prodEdit.packAmount || "…", " ", prodEdit.packUnit || "…", __t(" — boodschappenlijst toont alleen hele verpakkingen")), /*#__PURE__*/React.createElement("div", { "className": "mt-2 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Timetag (optioneel, #58)")), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1 mt-0.5" }, /*#__PURE__*/React.createElement("input", { "className": "w-20 border rounded-lg px-2 py-1.5 text-sm", "type": "number", "min": "0", "max": "365", "step": "1", "value": prodEdit.timetagDraft ?? "0", "title": __t("Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)"), "onChange": (e) => setProdEdit({ ...prodEdit, timetagDraft: e.target.value }) }), /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("dagen")))), /*#__PURE__*/React.createElement("div", { "className": "mt-2 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Tags")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, (prodEdit.tags || []).map((t) => (
              /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => removeProdTag(t) }, __t("\\u00d7")))
            ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": prodEdit.tagDraft || "", "placeholder": __t("\\uff0b tag toevoegen\\u2026"), "list": "product-tags-list", "onChange": (e) => setProdEdit({ ...prodEdit, tagDraft: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addProdTag(); } } }), /*#__PURE__*/React.createElement("datalist", { "id": "product-tags-list" }, allProductTags.map((t) => (/*#__PURE__*/React.createElement("option", { "key": t, "value": t })))), /*#__PURE__*/React.createElement("button", { "onClick": addProdTag }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "text-[10px] text-stone-400 mt-2" }, usageCount(p.id), __t("× gebruikt (recepten, voorraad, extra)")), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-2" }, /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg", "onClick": saveProductEdit }, __t("Opslaan")), /*#__PURE__*/React.createElement("button", { "className": "text-xs text-red-500 px-2", "title": __t("Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)"), "onClick": () => deleteProductCatalog(p.id) }, __t("Verwijderen"))))
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
      /*#__PURE__*/React.createElement("div", { "key": idx, "className": "ingrow" }, /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.4rem" }, "value": amountVal, "placeholder": "#", "title": __t("Aantal"), "onChange": (e) => setIngAmount(rid, idx, e.target.value), "onBlur": () => commitIngAmount(rid, idx) }), unit ? (
          UNIT_GROUP[unit] ? (
            /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0", "style": { width: "4.4rem" }, "value": unit, "title": __t("Eenheid (alleen converteerbare eenheden wijzigbaar)"), "onChange": (e) => setIngUnit(rid, idx, e.target.value) }, UNIT_GROUP[unit].map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))
          ) : (
            /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0", "title": __t("Eenheid van het product") }, unit)
          )
        ) : null, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "name", "value": nameVal, "placeholder": __t("Productnaam…"), "onChange": (e) => {
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
          )), typeof ing === "object" && ing && Array.isArray(ing.tags) && ing.tags.length > 0 && (
          /*#__PURE__*/React.createElement("span", { "className": "shrink-0 flex gap-1" }, ing.tags.map((t) => (
              /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag", "title": __t("Per-recept tag (geldt alleen in dit recept, #59)") }, t, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "tagx", "title": __t("Tag verwijderen"), "onClick": () => setIngTags(rid, idx, ing.tags.filter((x) => x !== t)) }, __t("\\u00d7")))
            )))
        ), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "text-stone-300 hover:text-red-500 text-sm", "title": __t("Ingrediënt verwijderen"), "onClick": () => setRecipes((rs) => rs.map((r) => (r.id !== rid ? r : { ...r, ingredients: (r.ingredients || []).filter((_, j) => j !== idx) }))) }, "✕"))
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
      /*#__PURE__*/React.createElement("div", { "key": idx, "className": "ingrow" }, /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.4rem" }, "value": amountVal, "placeholder": "#", "title": __t("Aantal"), "onChange": (e) => setNewIngAmount(idx, e.target.value), "onBlur": () => commitNewIngAmount(idx) }), unit ? (
          UNIT_GROUP[unit] ? (
            /*#__PURE__*/React.createElement("select", { "className": "border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0", "style": { width: "4.4rem" }, "value": unit, "title": __t("Eenheid (alleen converteerbare eenheden wijzigbaar)"), "onChange": (e) => setNewIngUnit(idx, e.target.value) }, UNIT_GROUP[unit].map((u) => (/*#__PURE__*/React.createElement("option", { "key": u, "value": u }, u))))
          ) : (
            /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0", "title": __t("Eenheid van het product") }, unit)
          )
        ) : null, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap" }, /*#__PURE__*/React.createElement("input", { "className": "name", "value": nameVal, "placeholder": __t("Productnaam…"), "onChange": (e) => {
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
          )), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "text-stone-300 hover:text-red-500 text-sm", "title": __t("Ingrediënt verwijderen"), "onClick": () => setNewRecipe((nr) => ({ ...nr, ingredients: (nr.ingredients || []).filter((_, j) => j !== idx) })) }, "✕"))
    );
  };


  return { renderProductCard, renderIngRow, renderNewIngRow };
}

exports.highlightMatch = highlightMatch;
exports.createSharedViews = createSharedViews;
},
"src/ui/labels.js": function (module, exports, require) {
// Presentatiemaps voor categorie- en tijdlabels (ADR-013/ADR-018).
// Labels zijn vertaalbaar (ADR-023): CAT_LABEL/TIME_LABEL geven per sleutel de t()-waarde,
// zodat de actieve GUI-taal pas bij lezing wordt opgezocht.
const __imp0 = require("../i18n/index.js");
const { t } = __imp0;

const CAT_LABEL = new Proxy({}, { get: (_, k) => t("cat." + String(k)) });
const CAT_STYLE = {
  vega: "bg-green-100 text-green-800",
  vis: "bg-blue-100 text-blue-800",
  vlees: "bg-red-100 text-red-800",
  extra: "bg-amber-100 text-amber-800",
};
// Bereidingstijd als categorie (ADR-013): kort / normaal / lang ipv minuten.
const TIME_LABEL = new Proxy({}, { get: (_, k) => t("time." + String(k)) });
const timeLabelCap = (tc) => {
  const s = t("time." + tc);
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const TIME_STYLE = {
  kort: "bg-emerald-100 text-emerald-700",
  normaal: "bg-stone-100 text-stone-500",
  lang: "bg-amber-100 text-amber-700",
};

exports.CAT_LABEL = CAT_LABEL;
exports.CAT_STYLE = CAT_STYLE;
exports.TIME_LABEL = TIME_LABEL;
exports.timeLabelCap = timeLabelCap;
exports.TIME_STYLE = TIME_STYLE;
},
"src/ui/recipesTab.jsx": function (module, exports, require) {
// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
const __imp0 = require("./components.jsx");
const { createSharedViews } = __imp0;
const __imp1 = require("../domain/catalog.js");
const { ingLabel } = __imp1;
const __imp2 = require("../domain/dates.js");
const { agoLabel, fmtDay } = __imp2;
const __imp3 = require("../domain/recipes.js");
const { TIME_CATS } = __imp3;
const __imp4 = require("../i18n/index.js");
const { t } = __imp4;
const __imp5 = require("./labels.js");
const { CAT_LABEL, CAT_STYLE, TIME_LABEL, timeLabelCap } = __imp5;

function createRecipesTab(ctx) {
  const { renderProductCard, renderIngRow, renderNewIngRow } = createSharedViews(ctx);
  const { activeMenuIds, addNewTag, addRecipe, addRecipeTag, addRecipeToWeek, addSheetOpen, allTags, byId, byLastEaten, clearRecipeFilters, curWeekKeys, curWeekLabel, daySheetRecipe, days, deleteRecipe, dishImgs, editRecipe, ensureDishFoto, exportRecipes, filterSheetOpen, filteredRecipes, hasRecipeFilters, importRecipes, ingFilter, ingQ, lastEaten, menuByDate, newRecipe, openProdCard, openRecipe, pickDishFoto, prodById, recipeInfoOpen, recipeQuery, recipeSort, recipes, removeDishFoto, removeRecipeTag, resetRecipes, rq, setAddSheetOpen, setDaySheetRecipe, setEditRecipe, setFilterSheetOpen, setIngFilter, setNewRecipe, setOpenRecipe, setRecipeInfoOpen, setRecipeQuery, setRecipeSort, setSortMenuOpen, setTagDraft, setTimeFilter, showFlatList, sortLast, sortMenuOpen, tagDraft, tagFilters, timeFilter, todayKey, toggleTagFilter, topTags, updateRecipe, weekToast } = ctx;

  const renderRecipeRow = (r) => {
    const inMenu = activeMenuIds.includes(r.id);
    const isOpen = openRecipe === r.id; // readonly-detail open (ADR-018)
    const isEdit = editRecipe === r.id; // bewerkmodus via ✏️ (ADR-018)
    const lastKey = lastEaten[r.id] || null;
    return (
      /*#__PURE__*/React.createElement("div", { "key": r.id, "className": "bg-white rounded-xl shadow-sm overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-1 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "onClick": () => { setOpenRecipe(isOpen ? null : r.id); if (!isOpen) { setEditRecipe(null); void ensureDishFoto(r.id); } setTagDraft(""); }, "className": "flex-1 text-left min-w-0" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between gap-2" }, /*#__PURE__*/React.createElement("span", { "className": "font-medium text-sm" }, r.name, inMenu && /*#__PURE__*/React.createElement("span", { "className": "ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full" }, __t("deze week")), (r.ingredients || []).filter(Boolean).length === 0 && (
                  /*#__PURE__*/React.createElement("span", { "className": "ml-1.5 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full" }, __t("geen ingredienten bekend"))
                )), /*#__PURE__*/React.createElement("span", { "className": "text-stone-400 text-xs shrink-0" }, isOpen || isEdit ? "▴" : "▾")), /*#__PURE__*/React.createElement("div", { "className": "metarow" }, /*#__PURE__*/React.createElement("span", { "className": `text-[10px] px-1.5 rounded ${CAT_STYLE[r.cat]}` }, CAT_LABEL[r.cat]), /*#__PURE__*/React.createElement("span", { "className": `tb tb-${r.timeCat || "normaal"}` }, TIME_LABEL[r.timeCat || "normaal"]), (r.tags || []).map((t) => (
                /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t)
              )), sortLast && (
                /*#__PURE__*/React.createElement("span", { "className": `last${lastKey ? "" : " unknown"}`, "title": lastKey ? t("Laatst gegeten: {datum}", { datum: lastKey }) : t("Nog nooit vergrendeld gegeten") }, `🕒 ${agoLabel(lastKey, todayKey)}`)
              ))), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Recept bewerken"), "onClick": () => { setEditRecipe(isEdit ? null : r.id); setOpenRecipe(null); setTagDraft(""); } }, "✏️"), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Toevoegen aan een onvergrendelde dag van deze week"), "onClick": () => setDaySheetRecipe(r) }, "📅")), isOpen && !isEdit && (
          /*#__PURE__*/React.createElement("div", { "className": "px-3 pb-3 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1 mt-2" }, __t("Ingrediënten")), (r.ingredients || []).filter(Boolean).length > 0 ? (
              /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mb-2" }, (r.ingredients || []).filter(Boolean).map((ing, ii) => {
                  const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                  return (
                    /*#__PURE__*/React.createElement("button", { "key": ii, "type": "button", "className": "prodchip", "onClick": () => p && openProdCard("rec-" + r.id, p.id) }, ingLabel(ing, prodById))
                  );
                }))
            ) : (
              /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mb-2" }, __t("geen ingrediënten bekend"))
            ), renderProductCard("rec-" + r.id), /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, dishImgs[r.id] ? (
                /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("img", { "src": dishImgs[r.id], "alt": r.name, "style": { maxWidth: "100%", maxHeight: "180px", borderRadius: "0.75rem", objectFit: "cover" } }), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-1" }, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "chip", "onClick": () => pickDishFoto(r.id) }, __t("📷 Vervangen")), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "chip", "onClick": () => removeDishFoto(r.id) }, __t("✕ Foto verwijderen"))))
              ) : (
                /*#__PURE__*/React.createElement("button", { "type": "button", "className": "chip", "onClick": () => pickDishFoto(r.id) }, __t("📷 Foto toevoegen"))
              )), /*#__PURE__*/React.createElement("div", { "className": "text-xs font-semibold text-stone-700 mb-1" }, __t("Bereiding")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600" }, r.bereiding || "—"))
        ), isEdit && (
          /*#__PURE__*/React.createElement("div", { "className": "px-3 pb-3 border-t border-stone-100" }, /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Naam")), /*#__PURE__*/React.createElement("input", { "value": r.name, "onChange": (e) => updateRecipe(r.id, { name: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5" })), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Categorie")), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, ["vega", "vis", "vlees", "extra"].map((c) => (
                  /*#__PURE__*/React.createElement("button", { "key": c, "className": `chip${r.cat === c ? " on" : ""}`, "onClick": () => updateRecipe(r.id, { cat: c }) }, CAT_LABEL[c])
                )))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Bereidingstijd")), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, TIME_CATS.map((tc) => (
                  /*#__PURE__*/React.createElement("button", { "key": tc, "className": (r.timeCat || "normaal") === tc ? "on" : "", "onClick": () => updateRecipe(r.id, { timeCat: tc }) }, timeLabelCap(tc))
                )))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Tags")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, (r.tags || []).map((t) => (
                  /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => removeRecipeTag(r.id, t) }, __t("×")))
                ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": tagDraft, "placeholder": __t("＋ tag toevoegen…"), "onChange": (e) => setTagDraft(e.target.value), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addRecipeTag(r.id); } } }), /*#__PURE__*/React.createElement("button", { "onClick": () => addRecipeTag(r.id) }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Ingrediënten")), /*#__PURE__*/React.createElement("div", { "className": "mt-1" }, (r.ingredients || []).map((ing, idx) => renderIngRow(r.id, ing, idx))), /*#__PURE__*/React.createElement("button", { "className": "addrow", "style": { border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }, "onClick": () => updateRecipe(r.id, { ingredients: [...(r.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] }) }, __t("＋ Ingrediënt toevoegen"))), /*#__PURE__*/React.createElement("div", { "className": "mt-3 text-xs" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Bereiding")), /*#__PURE__*/React.createElement("textarea", { "rows": 4, "value": r.bereiding ?? "", "onChange": (e) => updateRecipe(r.id, { bereiding: e.target.value }), "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" })), /*#__PURE__*/React.createElement("button", { "onClick": () => deleteRecipe(r.id), "className": "mt-2 text-xs text-red-500 hover:underline" }, __t("Recept verwijderen")))
        ))
    );
  };

  const renderRecipesTab = () => (
    /*#__PURE__*/React.createElement("div", null, recipeInfoOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "mb-2 text-xs text-stone-500" }, __t("Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON."))
      ), /*#__PURE__*/React.createElement("div", { "className": "searchbar" }, /*#__PURE__*/React.createElement("span", { "className": "sicon" }, "🔍"), /*#__PURE__*/React.createElement("input", { "className": "recipe-search", "value": recipeQuery, "placeholder": __t("Zoek op receptnaam…"), "onChange": (e) => setRecipeQuery(e.target.value) }), recipeQuery !== "" && (
          /*#__PURE__*/React.createElement("button", { "className": "sicon", "title": __t("Zoekopdracht wissen"), "onClick": () => setRecipeQuery("") }, "✕")
        ), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Hoe werkt zoeken en filteren?"), "onClick": () => setRecipeInfoOpen((v) => !v) }, "ℹ️"), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Recept toevoegen"), "onClick": () => setAddSheetOpen(true) }, "＋")), /*#__PURE__*/React.createElement("div", { "className": "filterrow" }, ["alle", ...TIME_CATS].map((tc) => (
          /*#__PURE__*/React.createElement("button", { "key": tc, "className": `chip${tc !== "alle" ? " " + tc : ""}${timeFilter === tc ? " on" : ""}`, "onClick": () => setTimeFilter(tc) }, tc === "alle" ? t("Alle") : timeLabelCap(tc))
        )), topTags.map((t) => (
          /*#__PURE__*/React.createElement("button", { "key": t, "className": `chip${tagFilters.includes(t) ? " on" : ""}`, "onClick": () => toggleTagFilter(t) }, `🏷 ${t}`)
        )), allTags.length > topTags.length && (
          /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setFilterSheetOpen(true) }, `＋${allTags.length - topTags.length} meer ▾`)
        ), /*#__PURE__*/React.createElement("span", { "className": "sortwrap", "style": { marginLeft: "auto" } }, /*#__PURE__*/React.createElement("button", { "className": "chip", "title": __t("Sorteren"), "onClick": () => setSortMenuOpen((v) => !v) }, __t("⇅ Sorteer ▾")), sortMenuOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "sortmenu" }, /*#__PURE__*/React.createElement("button", { "className": recipeSort === "naam" ? "on" : "", "onClick": () => { setRecipeSort("naam"); setSortMenuOpen(false); } }, __t("✓ Naam (A–Z)")), /*#__PURE__*/React.createElement("button", { "className": recipeSort === "laatst" ? "on" : "", "onClick": () => { setRecipeSort("laatst"); setSortMenuOpen(false); } }, __t("🕒 Laatst gegeten (langst geleden eerst)")))
          )), /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setFilterSheetOpen(true) }, __t("⚙ Filters ▾"))), (hasRecipeFilters || sortLast) && (
        /*#__PURE__*/React.createElement("div", { "className": "afilterrow" }, sortLast && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, t("🕒 Laatst gegeten") + " ", /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setRecipeSort("naam") }, __t("×")))
          ), rq !== "" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🔍 “${recipeQuery.trim()}” `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setRecipeQuery("") }, __t("×")))
          ), timeFilter !== "alle" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `⏱ ${TIME_LABEL[timeFilter]} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setTimeFilter("alle") }, __t("×")))
          ), ingQ !== "" && (
            /*#__PURE__*/React.createElement("span", { "className": "afilter" }, `🥘 ${ingFilter.trim()} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => setIngFilter("") }, __t("×")))
          ), tagFilters.map((t) => (
            /*#__PURE__*/React.createElement("span", { "key": t, "className": "afilter" }, `🏷 ${t} `, /*#__PURE__*/React.createElement("button", { "className": "x", "onClick": () => toggleTagFilter(t) }, __t("×")))
          )), /*#__PURE__*/React.createElement("button", { "className": "clearall", "onClick": clearRecipeFilters }, __t("Alles wissen")), /*#__PURE__*/React.createElement("span", { "className": "count" }, `${filteredRecipes.length} van ${recipes.length} recepten`))
      ), !showFlatList && ["vega", "vis", "vlees", "extra"].map((c) => {
        const list = recipes.filter((r) => r.cat === c).sort((a, b) => a.name.localeCompare(b.name, "nl"));
        if (!list.length) return null;
        return (
          /*#__PURE__*/React.createElement("div", { "key": c, "className": "mb-4" }, /*#__PURE__*/React.createElement("div", { "className": `inline-block px-2 py-0.5 rounded-full text-sm font-semibold mb-2 ${CAT_STYLE[c]}` }, CAT_LABEL[c]), /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, list.map((r) => renderRecipeRow(r))))
        );
      }), showFlatList && (
        /*#__PURE__*/React.createElement("div", { "className": "space-y-1.5" }, [...filteredRecipes].sort(sortLast ? byLastEaten : (a, b) => a.name.localeCompare(b.name, "nl")).map((r) => renderRecipeRow(r)))
      ), /*#__PURE__*/React.createElement("div", { "className": "mutedrow" }, /*#__PURE__*/React.createElement("button", { "className": "linkbtn", "onClick": exportRecipes }, __t("Exporteren")), /*#__PURE__*/React.createElement("label", { "className": "linkbtn cursor-pointer" }, __t("Importeren"), /*#__PURE__*/React.createElement("input", { "type": "file", "accept": "application/json,.json", "className": "hidden", "onChange": (e) => { if (e.target.files[0]) importRecipes(e.target.files[0]); e.target.value = ""; } })), /*#__PURE__*/React.createElement("button", { "className": "linkbtn", "onClick": resetRecipes }, __t("Standaardlijst terug"))), filterSheetOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setFilterSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, __t("Filters")), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setFilterSheetOpen(false) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Bereidingstijd")), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, ["alle", ...TIME_CATS].map((tc) => (
                    /*#__PURE__*/React.createElement("button", { "key": tc, "className": timeFilter === tc ? "on" : "", "onClick": () => setTimeFilter(tc) }, tc === "alle" ? t("Alles") : timeLabelCap(tc))
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-3 mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Ingrediënt bevat")), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": ingFilter, "placeholder": __t("bijv. zalm, ui, kaas…"), "onChange": (e) => setIngFilter(e.target.value) })), /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-3 mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Tags (alle geselecteerde moeten erop — AND)")), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, allTags.length === 0 && /*#__PURE__*/React.createElement("span", { "className": "text-stone-400 text-xs" }, __t("nog geen tags in de pool")), allTags.map((t) => (
                    /*#__PURE__*/React.createElement("button", { "key": t, "className": `chip${tagFilters.includes(t) ? " on" : ""}`, "onClick": () => toggleTagFilter(t) }, `🏷 ${t}`)
                  )))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 mt-4" }, /*#__PURE__*/React.createElement("button", { "className": "text-xs font-semibold text-stone-500 px-1 py-2", "onClick": clearRecipeFilters }, __t("Wis filters")), /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm", "onClick": () => setFilterSheetOpen(false) }, t("Toon {n} recepten", { n: filteredRecipes.length }))))))
      ), addSheetOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setAddSheetOpen(false) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, __t("Nieuw recept")), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setAddSheetOpen(false) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Naam")), /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.name, "placeholder": __t("Naam…"), "onChange": (e) => setNewRecipe({ ...newRecipe, name: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") addRecipe(); } })), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Categorie")), /*#__PURE__*/React.createElement("div", { "className": "filterrow", "style": { marginTop: ".25rem" } }, ["vega", "vis", "vlees", "extra"].map((c) => (
                    /*#__PURE__*/React.createElement("button", { "key": c, "className": `chip${newRecipe.cat === c ? " on" : ""}`, "onClick": () => setNewRecipe({ ...newRecipe, cat: c }) }, CAT_LABEL[c])
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Bereidingstijd")), /*#__PURE__*/React.createElement("div", { "className": "segl mt-0.5" }, TIME_CATS.map((tc) => (
                    /*#__PURE__*/React.createElement("button", { "key": tc, "className": newRecipe.timeCat === tc ? "on" : "", "onClick": () => setNewRecipe({ ...newRecipe, timeCat: tc }) }, timeLabelCap(tc))
                  )))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Tags")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1 mt-0.5" }, newRecipe.tags.map((t) => (
                    /*#__PURE__*/React.createElement("span", { "key": t, "className": "tag" }, t, " ", /*#__PURE__*/React.createElement("button", { "className": "tagx", "onClick": () => setNewRecipe({ ...newRecipe, tags: newRecipe.tags.filter((x) => x !== t) }) }, __t("×")))
                  ))), /*#__PURE__*/React.createElement("div", { "className": "tagadd" }, /*#__PURE__*/React.createElement("input", { "value": newRecipe.tagDraft, "placeholder": __t("＋ tag toevoegen…"), "onChange": (e) => setNewRecipe({ ...newRecipe, tagDraft: e.target.value }), "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } } }), /*#__PURE__*/React.createElement("button", { "onClick": addNewTag }, "+"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Ingrediënten")), /*#__PURE__*/React.createElement("div", { "className": "mt-1" }, (newRecipe.ingredients || []).map((ing, idx) => renderNewIngRow(ing, idx))), /*#__PURE__*/React.createElement("button", { "className": "addrow", "style": { border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }, "onClick": () => setNewRecipe({ ...newRecipe, ingredients: [...(newRecipe.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] }) }, __t("＋ Ingrediënt toevoegen"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-500" }, __t("Bereiding (optioneel)")), /*#__PURE__*/React.createElement("textarea", { "rows": 2, "className": "w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm", "value": newRecipe.bereiding, "placeholder": __t("Bereiding…"), "onChange": (e) => setNewRecipe({ ...newRecipe, bereiding: e.target.value }) })), /*#__PURE__*/React.createElement("button", { "className": "w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm", "onClick": addRecipe }, __t("Toevoegen")))))
      ), daySheetRecipe && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDaySheetRecipe(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-1" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, __t("Kies een dag deze week")), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setDaySheetRecipe(null) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Week van "), curWeekLabel, __t(" · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)")), curWeekKeys.map((k, i) => {
                const entry = menuByDate[k];
                const locked = !!(entry && entry.locked);
                const cur = entry && entry.id ? byId[entry.id] : null;
                const isToday = k === todayKey;
                return (
                  /*#__PURE__*/React.createElement("button", { "key": k, "className": `dayrow${locked ? " locked" : ""}${isToday ? " today" : ""}`, "disabled": locked, "onClick": () => addRecipeToWeek(daySheetRecipe, k) }, /*#__PURE__*/React.createElement("span", { "className": "dname" }, days[i]), /*#__PURE__*/React.createElement("span", { "className": "ddate" }, fmtDay(k), isToday ? " · vandaag" : ""), /*#__PURE__*/React.createElement("span", { "className": "ddish" }, locked ? "🔒 " : "", entry && entry.custom ? entry.custom : cur ? cur.name : "leeg"))
                );
              }), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-3" }, daySheetRecipe.name, __t(" wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).")))))
      ), weekToast !== "" && /*#__PURE__*/React.createElement("div", { "className": "toast" }, weekToast))
  );


  return { renderRecipeRow, renderRecipesTab };
}

exports.createRecipesTab = createRecipesTab;
},
"src/ui/stockTab.jsx": function (module, exports, require) {
// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
const __imp0 = require("./components.jsx");
const { createSharedViews } = __imp0;
const __imp1 = require("../domain/catalog.js");
const { matchProducts } = __imp1;
const __imp2 = require("../domain/stock.js");
const { DEFAULT_LOCATIONS, defaultStock } = __imp2;
const __imp3 = require("./components.jsx");
const { highlightMatch } = __imp3;
const __imp4 = require("../i18n/index.js");
const { t } = __imp4;

function createStockTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { addLocOpen, addLocation, addProdRow, addProductRow, bumpHave, bumpWant, deleteLocation, deleteProduct, editLoc, marketChip, newLocName, newProdRow, openLocs, openProdCard, prodById, prodRowSuggest, products, productsOf, setAddLocOpen, setAddProdRow, setEditLoc, setNewLocName, setNewProdRow, setProdRowSuggest, setStock, setStockInfoOpen, setStockLocations, stock, stockInfoOpen, stockLocations, toggleLoc } = ctx;

  const renderStockTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, __t("Locaties")), /*#__PURE__*/React.createElement("span", { "className": "relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${stockInfoOpen ? " on" : ""}`, "title": __t("Hoe werkt de voorraad?"), "onClick": () => setStockInfoOpen((v) => !v) }, "ℹ️"), stockInfoOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, __t("Hoe werkt de voorraad?")), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, __t("Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.")), /*#__PURE__*/React.createElement("li", null, __t("Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).")), /*#__PURE__*/React.createElement("li", null, __t("Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.")), /*#__PURE__*/React.createElement("li", null, __t("Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.")), /*#__PURE__*/React.createElement("li", null, __t("De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin."))))
          ))), stockLocations.map((loc) => {
        const items = productsOf(loc.id);
        const open = !!openLocs[loc.id];
        const editing = editLoc === loc.id;
        return (
          /*#__PURE__*/React.createElement("div", { "key": loc.id, "className": "bg-white rounded-xl shadow-sm mb-3 overflow-hidden" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2.5" }, /*#__PURE__*/React.createElement("button", { "className": "text-stone-400 text-xs w-4 shrink-0", "title": open ? "Inklappen" : "Uitklappen", "onClick": () => toggleLoc(loc.id) }, open ? "▾" : "▸"), /*#__PURE__*/React.createElement("button", { "className": "flex-1 text-left min-w-0 font-medium text-sm truncate", "onClick": () => toggleLoc(loc.id) }, loc.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0", "title": items.length === 1 ? t("{n} product", { n: items.length }) : t("{n} producten", { n: items.length }) }, items.length), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${editing ? " on" : ""}`, "title": editing ? "Gewenste hoeveelheden niet meer bewerken" : "Gewenste hoeveelheden in deze locatie bewerken", "onClick": () => setEditLoc(editing ? null : loc.id) }, "✏️"), /*#__PURE__*/React.createElement("button", { "className": `delbtn${items.length ? " dis" : ""}`, "disabled": items.length > 0, "title": items.length ? "Verwijderen kan pas als er geen producten meer aan deze locatie hangen" : "Locatie verwijderen", "onClick": () => deleteLocation(loc.id) }, "🗑️")), open && (
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
                          ), /*#__PURE__*/React.createElement("span", { "className": "block text-[10px] text-stone-400" }, cat)), /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": __t("Huidige voorraad") }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": `w-6 text-center text-sm font-medium ${tekort ? "text-orange-600" : "text-stone-700"}` }, s.have), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpHave(s.i, 1) }, "+")), editing ? (
                          /*#__PURE__*/React.createElement("span", { "className": "flex items-center gap-1", "title": __t("Gewenste voorraad aanpassen") }, /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, -1) }, "−"), /*#__PURE__*/React.createElement("span", { "className": "w-6 text-center text-sm font-medium text-stone-700" }, s.want), /*#__PURE__*/React.createElement("button", { "className": "w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600", "onClick": () => bumpWant(s.i, 1) }, "+"))
                        ) : (
                          /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 whitespace-nowrap" }, `gewenst ${s.want}`)
                        ), mkt && /*#__PURE__*/React.createElement("span", { "className": "chip mkt", "title": __t("Winkelvoorkeur") }, marketChip(mkt)), tekort && /*#__PURE__*/React.createElement("span", { "className": "text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap" }, __t("op lijst")), /*#__PURE__*/React.createElement("button", { "className": "text-stone-300 hover:text-red-500 text-sm", "title": __t("Product verwijderen"), "onClick": () => deleteProduct(s.i) }, "✕")), renderProductCard("stock-" + s.i))
                    );
                  }), items.length === 0 && (
                    /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 text-sm text-stone-400 text-center" }, __t("Nog geen producten in deze locatie."))
                  )), addProdRow === loc.id ? (
                  /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50" }, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap", "style": { flex: 1.4 } }, /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 text-sm", "value": newProdRow.name, "placeholder": __t("Productnaam…"), "onChange": (e) => { setNewProdRow({ ...newProdRow, name: e.target.value }); setProdRowSuggest(e.target.value.trim().length >= 2); }, "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addProductRow(loc.id); } } }), prodRowSuggest && newProdRow.name.trim().length >= 2 && (
                        /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, matchProducts(products, newProdRow.name.trim().toLowerCase()).map((s2) => (
                            /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": "suggest-item", "onMouseDown": (e) => { e.preventDefault(); setNewProdRow({ ...newProdRow, name: s2.name }); setProdRowSuggest(false); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, newProdRow.name.trim().toLowerCase())), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat))
                          )))
                      )), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, __t("gewenst")), /*#__PURE__*/React.createElement("span", { "className": "stepper shrink-0" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProdRow({ ...newProdRow, want: Math.max(0, newProdRow.want - 1) }) }, "−"), /*#__PURE__*/React.createElement("span", null, newProdRow.want), /*#__PURE__*/React.createElement("button", { "onClick": () => setNewProdRow({ ...newProdRow, want: newProdRow.want + 1 }) }, "+")), /*#__PURE__*/React.createElement("button", { "className": "iconbtn on", "title": __t("Toevoegen"), "disabled": !newProdRow.name.trim(), "onClick": () => addProductRow(loc.id) }, "✓"), /*#__PURE__*/React.createElement("button", { "className": "text-stone-300 hover:text-red-500 text-sm", "title": __t("Annuleren"), "onClick": () => { setAddProdRow(null); setNewProdRow({ name: "", want: 1 }); setProdRowSuggest(false); } }, "✕"))
                ) : (
                  /*#__PURE__*/React.createElement("button", { "className": "addrow", "onClick": () => setAddProdRow(loc.id) }, __t("＋ Product toevoegen"))
                ))
            ))
        );
      }), addLocOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm mb-3 p-3 flex gap-2 items-center" }, /*#__PURE__*/React.createElement("input", { "value": newLocName, "onChange": (e) => setNewLocName(e.target.value), "placeholder": __t("Naam van de locatie…"), "className": "flex-1 border rounded-lg px-3 py-2 text-sm", "onKeyDown": (e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLocation();
              }
            } }), /*#__PURE__*/React.createElement("button", { "className": "iconbtn on", "title": __t("Locatie toevoegen"), "onClick": addLocation }, "✓"), /*#__PURE__*/React.createElement("button", { "className": "delbtn", "title": __t("Annuleren"), "onClick": () => {
              setAddLocOpen(false);
              setNewLocName("");
            } }, "✕"))
      ), /*#__PURE__*/React.createElement("button", { "className": "addcard", "onClick": () => setAddLocOpen((v) => !v) }, __t("＋ Locatie toevoegen")), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-4" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setStock(stock.map((s) => ({ ...s, have: s.want }))), "className": "flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium" }, __t("✓ Alles aangevuld")), /*#__PURE__*/React.createElement("button", { "onClick": () => {
            setStock(defaultStock());
            setStockLocations(DEFAULT_LOCATIONS.map((l) => ({ ...l })));
          }, "className": "py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white" }, __t("Standaardlijst terug"))))
  );


  return { renderStockTab };
}

exports.createStockTab = createStockTab;
},
"src/ui/shoppingTab.jsx": function (module, exports, require) {
// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
const __imp0 = require("./components.jsx");
const { createSharedViews } = __imp0;
const __imp1 = require("../domain/catalog.js");
const { matchProducts } = __imp1;
const __imp2 = require("../domain/dates.js");
const { dayShortOf, fmtDay } = __imp2;
const __imp3 = require("./components.jsx");
const { highlightMatch } = __imp3;
const __imp4 = require("../i18n/index.js");
const { t } = __imp4;

function createShoppingTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { addCat, addExtraRowFn, anyScaled, catsOpen, checked, doneItems, extraItems, extraSuggest, listRows, marketChip, markets, maxShopDays, mealOk, mealWarn, moveCat, newCat, newExtra, openProdCard, processChecked, products, removeCat, scaledFactors, setCatsOpen, setChecked, setExtraItems, setExtraSuggest, setHiddenChecked, setNewCat, setNewExtra, setShopDays, setShopDone, setShopInfoOpen, setShopMarkets, setShowChecked, settings, shopCats, shopDaysEff, shopDone, shopInfoOpen, shopMarketsEff, showChecked, stock, todayLabel, totalItems, unfilteredCount, visibleRows } = ctx;

  const renderShoppingTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-semibold text-stone-700" }, `Boodschappenlijst · ${todayLabel}`), /*#__PURE__*/React.createElement("span", { "className": "flex gap-1.5 relative" }, /*#__PURE__*/React.createElement("button", { "className": `iconbtn${shopInfoOpen ? " on" : ""}`, "title": __t("Hoe werkt de boodschappenlijst?"), "onClick": () => setShopInfoOpen((v) => !v) }, "ℹ️"), /*#__PURE__*/React.createElement("button", { "className": `iconbtn${catsOpen ? " on" : ""}`, "title": __t("Categorieën beheren"), "onClick": () => setCatsOpen((v) => !v) }, "⚙️"), shopInfoOpen && (
            /*#__PURE__*/React.createElement("div", { "className": "pop" }, /*#__PURE__*/React.createElement("b", null, __t("Hoe werkt de boodschappenlijst?")), /*#__PURE__*/React.createElement("ul", null, /*#__PURE__*/React.createElement("li", null, __t("Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.")), /*#__PURE__*/React.createElement("li", null, __t("De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.")), /*#__PURE__*/React.createElement("li", null, __t("Afvinken maar. \"Verwerk update\" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; \"Vinkjes wissen\" zet alles terug.")), /*#__PURE__*/React.createElement("li", null, __t("Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad (\"n van want\") staan automatisch in de lijst."))))
          ))), /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 mb-4 px-1" }, /*#__PURE__*/React.createElement("div", { "className": "stepper" }, /*#__PURE__*/React.createElement("button", { "onClick": () => setShopDays(Math.max(0, shopDaysEff - 1)), "disabled": shopDaysEff <= 0 }, "−"), /*#__PURE__*/React.createElement("span", null, shopDaysEff), /*#__PURE__*/React.createElement("button", { "onClick": () => setShopDays(Math.min(maxShopDays, shopDaysEff + 1)), "disabled": shopDaysEff >= maxShopDays }, "+")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-500 shrink-0" }, __t("dagen")), /*#__PURE__*/React.createElement("div", { "className": "flex gap-1 ml-auto overflow-x-auto" }, markets.map((m) => (
            /*#__PURE__*/React.createElement("button", { "key": m.key, "className": `chip${shopMarketsEff.includes(m.key) ? " on" : ""}`, "title": m.label, "onClick": () =>
                setShopMarkets(
                  shopMarketsEff.includes(m.key) ? shopMarketsEff.filter((x) => x !== m.key) : [...shopMarketsEff, m.key]
                )
               }, marketChip(m.key))
          )))), catsOpen && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-3 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold mb-1" }, __t("Categorieën")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”.")), /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100 border border-stone-100 rounded-xl" }, shopCats.map((c, i) => {
              const used = stock.some((s) => s.cat === c) || extraItems.some((x) => x.cat === c);
              return (
                /*#__PURE__*/React.createElement("div", { "key": c, "className": "flex items-center gap-2 px-2 py-1.5" }, /*#__PURE__*/React.createElement("span", { "className": "flex flex-col leading-none shrink-0" }, /*#__PURE__*/React.createElement("button", { "className": "text-[9px] text-stone-400 hover:text-stone-700", "disabled": i === 0, "onClick": () => moveCat(i, -1) }, "▲"), /*#__PURE__*/React.createElement("button", { "className": "text-[9px] text-stone-400 hover:text-stone-700", "disabled": i === shopCats.length - 1, "onClick": () => moveCat(i, 1) }, "▼")), /*#__PURE__*/React.createElement("span", { "className": "flex-1 text-sm min-w-0 truncate" }, c), /*#__PURE__*/React.createElement("button", { "className": `text-sm ${used ? "text-stone-300" : "text-stone-300 hover:text-red-500"}`, "disabled": used, "title": used ? t("Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten") : t("Categorie verwijderen"), "onClick": () => removeCat(c) }, "✕"))
              );
            })), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-2" }, /*#__PURE__*/React.createElement("input", { "value": newCat, "onChange": (e) => setNewCat(e.target.value), "placeholder": __t("Nieuwe categorie…"), "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm", "onKeyDown": (e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCat();
                }
              } }), /*#__PURE__*/React.createElement("button", { "className": "px-3 border rounded-lg text-sm text-stone-600 bg-white", "onClick": addCat }, "＋")))
      ), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2 bg-stone-50" }, /*#__PURE__*/React.createElement("span", { "className": "grow suggest-wrap", "style": { flex: 1.4 } }, /*#__PURE__*/React.createElement("input", { "className": "w-full border rounded-lg px-2 py-1.5 text-sm", "value": newExtra.name, "placeholder": __t("Productnaam…"), "onChange": (e) => { setNewExtra({ ...newExtra, name: e.target.value }); setExtraSuggest(e.target.value.trim().length >= 2); }, "onKeyDown": (e) => { if (e.key === "Enter") { e.preventDefault(); addExtraRowFn(); } } }), extraSuggest && newExtra.name.trim().length >= 2 && (
              /*#__PURE__*/React.createElement("div", { "className": "suggest-list" }, matchProducts(products, newExtra.name.trim().toLowerCase()).map((s2) => (
                  /*#__PURE__*/React.createElement("div", { "key": s2.id, "className": "suggest-item", "onMouseDown": (e) => { e.preventDefault(); setNewExtra({ ...newExtra, name: s2.name }); setExtraSuggest(false); } }, /*#__PURE__*/React.createElement("span", null, highlightMatch(s2.name, newExtra.name.trim().toLowerCase())), /*#__PURE__*/React.createElement("span", { "className": "text-[10px] text-stone-400 shrink-0" }, s2.cat, s2.unit ? ` · ${s2.unit}` : ""))
                )))
            )), /*#__PURE__*/React.createElement("input", { "className": "qty", "style": { width: "2.6rem" }, "value": newExtra.amount || "", "title": __t("Aantal"), "onChange": (e) => setNewExtra({ ...newExtra, amount: e.target.value === "" ? 0 : Number(String(e.target.value).replace(",", ".")) }) }), /*#__PURE__*/React.createElement("button", { "className": "bg-stone-800 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0", "disabled": !newExtra.name.trim(), "onClick": addExtraRowFn }, __t("Toevoegen")))), listRows.length === 0 && unfilteredCount > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10 bg-white rounded-xl shadow-sm" }, t("Niets te halen bij {winkels}", { winkels: shopMarketsEff.map((k) => marketChip(k)).join(", ") || t("de geselecteerde supermarkt") }), /*#__PURE__*/React.createElement("div", { "className": "text-xs mt-1" }, __t("alle artikelen hebben een winkelvoorkeur voor een andere supermarkt")), /*#__PURE__*/React.createElement("button", { "className": "chip on mt-2", "onClick": () => setShopMarkets(markets.map((m) => m.key)) }, __t("Toon alle supermarkten")))
      ), listRows.length === 0 && unfilteredCount === 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "text-center text-stone-400 text-sm py-10" }, __t("Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch."))
      ), listRows.length > 0 && doneItems > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, /*#__PURE__*/React.createElement("button", { "className": "chip", "onClick": () => setShowChecked((v) => !v) }, t("{n} afgevinkt · {actie} ▾", { n: doneItems, actie: showChecked ? t("verberg") : t("toon") })))
      ), listRows.length > 0 && visibleRows.length === 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm text-center text-stone-400 text-sm py-8" }, __t("Alles afgevinkt — toon de rijen met de chip hierboven."))
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
                    /*#__PURE__*/React.createElement("span", { "className": "ml-auto chip mkt", "title": __t("Winkelvoorkeur: dit artikel wordt daar gehaald") }, marketChip(r.mkt))
                  ), r.src === "extra" && keys.length === 1 && (
                    /*#__PURE__*/React.createElement("button", { "onClick": () => setExtraItems(extraItems.filter((x) => x.name !== r.name)), "className": "text-stone-300 hover:text-red-500 text-sm", "title": __t("Artikel verwijderen") }, "✕")
                  )), renderProductCard(r.key))
            );
          }))
      ), anyScaled && (
        /*#__PURE__*/React.createElement("p", { "className": "text-[10px] text-stone-400 mt-1" }, t("Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.", { f: scaledFactors.join(", "), n: settings.householdSize }))
      ), totalItems > 0 && (
        /*#__PURE__*/React.createElement("div", { "className": "mt-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex gap-2" }, /*#__PURE__*/React.createElement("button", { "onClick": processChecked, "className": "flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm" }, __t("Verwerk update")), /*#__PURE__*/React.createElement("button", { "onClick": () => {
                setChecked({});
                setShopDone(false);
                setHiddenChecked(false);
                setShowChecked(false);
              }, "className": "py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white" }, __t("Vinkjes wissen"))), shopDone && (
            /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mt-2 text-center" }, mealOk + mealWarn > 0
                ? t("✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)", { ok: mealOk, rest: mealWarn > 0 ? t(" · ❗ {w} mist nog iets", { w: mealWarn }) : "" })
                : t("Nog niets afgevinkt — vink de gehaalde artikelen af."))
          ))
      ))
  );

  // Delen via bestand (ADR-019): deelsheet (export/uitleg) + import-rapport + toast

  return { renderShoppingTab };
}

exports.createShoppingTab = createShoppingTab;
},
"src/ui/settingsTab.jsx": function (module, exports, require) {
// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
const __imp0 = require("./components.jsx");
const { createSharedViews } = __imp0;
const __imp1 = require("../i18n/index.js");
const { LANGUAGES, dayNames, t } = __imp1;
const __imp2 = require("../domain/settings.js");
const { THEMES } = __imp2;

function createSettingsTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { applyImportReview, catFilters, catOpen, days, deelChips, deelRapportLines, delenOpen, deleteProductCatalog, doMerge, exportShare, filteredProducts, fishDays, importReview, importShareFile, marketChip, markets, menuByDate, mergeGroup, mergeKanjerId, openMergeGroup, openProdCard, pnBadgeMap, pnDupGroups, prodQuery, products, recipes, setCatFilters, setCatOpen, setDeelChips, setDelenOpen, setImportReview, setMergeGroup, setMergeKanjerId, setProdQuery, setShareToast, settings, shareToast, shopCats, stock, updateMarket, updateSettings, updateTakeawayLink, usageCount } = ctx;

  const renderDelenSheets = () => {
    const chipDefs = [
      ["recipes", t("Recepten ({n})", { n: recipes.length })],
      ["products", t("Producten ({n})", { n: products.length })],
      ["stock", t("Voorraad ({n})", { n: stock.length })],
      ["menu", t("Weekmenu ({n} dagen)", { n: Object.keys(menuByDate).length })],
      ["settings", t("Instellingen · vinkjes · verwijderingen")],
    ];
    return (
      /*#__PURE__*/React.createElement("div", null, delenOpen && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setDelenOpen(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, delenOpen === "info" ? "Delen: hoe werkt het?" : "Delen via bestand"), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setDelenOpen(null) }, "✕")), delenOpen === "export" ? (
                  /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-1" }, __t("Wat gaat er mee? (tik om aan/uit te zetten)")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-1.5 mb-3" }, chipDefs.map(([k, label]) => (
                        /*#__PURE__*/React.createElement("button", { "key": k, "className": "chip" + (deelChips[k] ? " on" : ""), "onClick": () => setDeelChips((c) => ({ ...c, [k]: !c[k] })) }, label)
                      ))), /*#__PURE__*/React.createElement("button", { "className": "w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mb-2", "onClick": exportShare }, __t("📤 Maak deelbestand")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400" }, __t("Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.")))
                ) : (
                  /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-600 leading-relaxed" }, /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, __t("📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.")), /*#__PURE__*/React.createElement("div", { "className": "mb-2" }, __t("Samenvoegen gebeurt automatisch (\"nieuwste wint\" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.")), /*#__PURE__*/React.createElement("div", null, __t("Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.")))
                ))))
        ), importReview && (
          /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setImportReview(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center mb-3" }, /*#__PURE__*/React.createElement("span", { "className": "text-lg font-bold" }, __t("Bestand overnemen")), /*#__PURE__*/React.createElement("button", { "className": "ml-auto text-stone-400", "onClick": () => setImportReview(null) }, "✕")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, "📄 ", importReview.fileName), /*#__PURE__*/React.createElement("div", { "className": "text-sm mb-2" }, __t("Dit verandert er als je samenvoegt:")), /*#__PURE__*/React.createElement("div", { "className": "text-xs leading-relaxed mb-3" }, deelRapportLines(importReview).length === 0 && /*#__PURE__*/React.createElement("div", null, __t("➖ Niets nieuws in dit bestand.")), deelRapportLines(importReview).map((l) => (
                    /*#__PURE__*/React.createElement("div", { "key": l.lbl }, l.active ? "✅" : "➖", " ", l.lbl, ": ", l.parts.join(" · "))
                  ))), importReview.merge.rapport.conflicts.length > 0 && (
                  /*#__PURE__*/React.createElement("div", { "className": "rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs mb-3" }, /*#__PURE__*/React.createElement("div", { "className": "font-medium text-amber-800 mb-1" }, "⚠️", importReview.merge.rapport.conflicts.length, __t("× nieuwste wint — zo nodig hierna zelf herstellen:")), importReview.merge.rapport.conflicts.slice(0, 8).map((cf, i) => (
                      /*#__PURE__*/React.createElement("div", { "key": i, "className": "text-amber-900" }, cf.naam.split(" (")[0], __t(": hier \""), cf.hier, __t("\" → uit bestand \""), cf.daar, "\"")
                    )))
                ), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2" }, /*#__PURE__*/React.createElement("button", { "className": "flex-1 rounded-xl border border-stone-300 py-2.5 text-sm", "onClick": () => setImportReview(null) }, __t("Annuleren")), /*#__PURE__*/React.createElement("button", { "className": "flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium", "onClick": applyImportReview }, __t("Samenvoegen"))))))
        ), shareToast !== "" && (
          /*#__PURE__*/React.createElement("div", { "className": "toast", "onClick": () => setShareToast("") }, shareToast)
        ))
    );
  };

  const renderSettingsTab = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "mb-2 text-xs text-stone-500" }, __t("Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart ("), days[0], ")."), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, __t("Weergave")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Thema van de app — lokaal opgeslagen per huishouden (#40).")), THEMES.map((th) => (
          /*#__PURE__*/React.createElement("label", { "key": th.key, "className": "flex items-center gap-2 py-1.5 cursor-pointer text-sm", "title": t("Thema {thema}", { thema: t(th.label) }) }, /*#__PURE__*/React.createElement("input", { "type": "radio", "name": "theme", "checked": settings.theme === th.key, "onChange": () => updateSettings({ theme: th.key }), "className": "accent-emerald-600" }), /*#__PURE__*/React.createElement("span", { "className": settings.theme === th.key ? "font-semibold" : "text-stone-600" }, t(th.label)), /*#__PURE__*/React.createElement("span", { "className": "ml-auto flex gap-1" }, th.dots.map((dot, di) => (
                /*#__PURE__*/React.createElement("span", { "key": di, "className": "inline-block w-4 h-4 rounded-full border border-stone-300", "style": { background: dot } })
              ))))
        ))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, __t("Taal")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).")), LANGUAGES.map((ln) => (
          /*#__PURE__*/React.createElement("label", { "key": ln.code, "className": "flex items-center gap-2 py-1.5 cursor-pointer text-sm", "title": t("Taal {taal}", { taal: ln.label }) }, /*#__PURE__*/React.createElement("input", { "type": "radio", "name": "language", "checked": settings.language === ln.code, "onChange": () => updateSettings({ language: ln.code }), "className": "accent-emerald-600" }), /*#__PURE__*/React.createElement("span", { "className": settings.language === ln.code ? "font-semibold" : "text-stone-600" }, ln.label), /*#__PURE__*/React.createElement("span", { "className": "ml-auto text-xs text-stone-400" }, ln.code))
        ))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, __t("Huishouden")), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm mb-2" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, __t("Aantal eters")), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "1", "value": settings.householdSize, "onChange": (e) => updateSettings({ householdSize: Math.max(1, Number(e.target.value) || 1) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" })), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, __t("Week start op")), /*#__PURE__*/React.createElement("select", { "value": settings.weekStartDay, "onChange": (e) => updateSettings({ weekStartDay: Number(e.target.value) }), "className": "border rounded-lg px-2 py-1.5 text-sm text-stone-600" }, dayNames().map((d, i) => (
              /*#__PURE__*/React.createElement("option", { "key": d, "value": i }, d)
            ))))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, __t("Eetpatroon")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Vis-dagen:")), /*#__PURE__*/React.createElement("div", { "className": "flex flex-wrap gap-2 mb-3" }, days.map((d, i) => (
            /*#__PURE__*/React.createElement("label", { "key": i, "className": "flex items-center gap-1 text-xs border rounded-lg px-2 py-1 cursor-pointer" }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": fishDays.includes(i), "onChange": (e) =>
                  updateSettings({ fishDays: e.target.checked ? [...fishDays, i] : fishDays.filter((x) => x !== i) })
                , "className": "accent-emerald-600" }), d)
          ))), /*#__PURE__*/React.createElement("label", { "className": "flex items-center justify-between gap-2 text-sm" }, /*#__PURE__*/React.createElement("span", { "className": "text-stone-600" }, __t("Aantal vega-dagen (op niet-vis-dagen)")), /*#__PURE__*/React.createElement("input", { "type": "number", "min": "0", "max": "7", "value": settings.vegaTarget, "onChange": (e) => updateSettings({ vegaTarget: Math.max(0, Number(e.target.value) || 0) }), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm text-center" }))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-2" }, __t("Supermarkten")), markets.map((m, mi) => (
          /*#__PURE__*/React.createElement("div", { "key": mi, "className": "flex gap-2 mb-2" }, /*#__PURE__*/React.createElement("input", { "value": m.key, "onChange": (e) => updateMarket(mi, { key: e.target.value }), "placeholder": __t("sleutel…"), "className": "w-20 border rounded-lg px-2 py-1.5 text-sm" }), /*#__PURE__*/React.createElement("input", { "value": m.label, "onChange": (e) => updateMarket(mi, { label: e.target.value }), "placeholder": __t("Naam…"), "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" }), /*#__PURE__*/React.createElement("label", { "className": "flex items-center gap-1 text-[10px] text-stone-500 shrink-0 cursor-pointer", "title": __t("Standaard geselecteerd op de boodschappenlijst") }, /*#__PURE__*/React.createElement("input", { "type": "checkbox", "checked": m.defaultShop !== false, "onChange": (e) => updateMarket(mi, { defaultShop: e.target.checked }), "className": "accent-emerald-600" }), __t("standaard")), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: markets.filter((_, j) => j !== mi) }), "className": "text-stone-300 hover:text-red-500 text-sm px-1" }, "✕"))
        )), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ markets: [...markets, { key: "winkel" + (markets.length + 1), label: "Nieuwe winkel", defaultShop: true }] }), "className": "w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white" }, __t("+ Supermarkt toevoegen"))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2" }, /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Deelbestand maken (exporteren)"), "onClick": () => setDelenOpen("export") }, "📤"), /*#__PURE__*/React.createElement("label", { "className": "iconbtn cursor-pointer", "title": __t("Bestand overnemen (importeren)") }, "📥", /*#__PURE__*/React.createElement("input", { "type": "file", "accept": "application/json,.json", "className": "hidden", "onChange": (e) => { if (e.target.files && e.target.files[0]) importShareFile(e.target.files[0]); e.target.value = ""; } })), /*#__PURE__*/React.createElement("button", { "className": "iconbtn", "title": __t("Uitleg over delen via bestand"), "onClick": () => setDelenOpen("info") }, "ℹ️"))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-medium mb-1" }, __t("🛵 Afhaalmaaltijden (bestelsites)")), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).")), (settings.takeawayLinks || []).map((l, i) => (
          /*#__PURE__*/React.createElement("div", { "key": l.id, "className": "flex gap-2 mb-2" }, /*#__PURE__*/React.createElement("input", { "value": l.label, "onChange": (e) => updateTakeawayLink(i, { label: e.target.value }), "placeholder": __t("Naam…"), "className": "w-32 border rounded-lg px-2 py-1.5 text-sm" }), /*#__PURE__*/React.createElement("input", { "value": l.url, "onChange": (e) => updateTakeawayLink(i, { url: e.target.value }), "placeholder": __t("URL…"), "className": "flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0" }), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ takeawayLinks: (settings.takeawayLinks || []).filter((_, j) => j !== i) }), "className": "text-stone-300 hover:text-red-500 text-sm px-1", "title": __t("Bestelsite verwijderen") }, "✕"))
        )), /*#__PURE__*/React.createElement("button", { "onClick": () => updateSettings({ takeawayLinks: [...(settings.takeawayLinks || []), { id: "tl-" + Date.now().toString(36), label: "Nieuwe bestelsite", url: "" }] }), "className": "w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white" }, __t("+ Bestelsite toevoegen"))), /*#__PURE__*/React.createElement("div", { "className": "bg-white rounded-xl shadow-sm p-4 mb-4" }, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "w-full flex items-center gap-2 text-left", "onClick": () => setCatOpen((o) => !o), "title": __t("Productcatalogus in-/uitklappen (#44)") }, /*#__PURE__*/React.createElement("span", { "className": "text-sm font-medium" }, __t("📦 Productcatalogus")), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, products.length), /*#__PURE__*/React.createElement("span", { "className": "ml-auto text-xs text-stone-400" }, catOpen ? "▾" : "▸")), catOpen && (
        /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, `Elk ingrediënt, voorraadproduct en extra artikel is hier een product met categorie, eenheid en optionele winkelvoorkeur. Klik op een naam om te wijzigen; ✕ verwijdert het product uit de catalogus (koppelingen vallen terug op vrije tekst — handig bij typefouten).`), pnDupGroups.length > 0 && (
          /*#__PURE__*/React.createElement("div", { "className": "border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 mb-2 text-xs" }, /*#__PURE__*/React.createElement("div", { "className": "font-semibold mb-1" }, pnDupGroups.length, __t(" duplicaatgroep(en) gevonden")), pnDupGroups.map((g) => (
              /*#__PURE__*/React.createElement("div", { "key": g[0].id, "className": "flex items-center gap-2 py-0.5" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 truncate" }, g.map((p) => p.name).join(" \u00b7 ")), /*#__PURE__*/React.createElement("button", { "type": "button", "className": "chip", "onClick": () => openMergeGroup(g) }, __t("Samenvoegen\\u2026")))
            )))
        ), /*#__PURE__*/React.createElement("div", { "className": "searchbar", "style": { boxShadow: "none" } }, /*#__PURE__*/React.createElement("span", { "className": "sicon" }, "🔍"), /*#__PURE__*/React.createElement("input", { "className": "recipe-search", "value": prodQuery, "placeholder": __t("Zoek product…"), "onChange": (e) => setProdQuery(e.target.value) }), prodQuery !== "" && (
            /*#__PURE__*/React.createElement("button", { "className": "sicon", "title": __t("Zoekopdracht wissen"), "onClick": () => setProdQuery("") }, "✕")
          )), /*#__PURE__*/React.createElement("div", { "className": "filterrow" }, shopCats.map((c) => (
            /*#__PURE__*/React.createElement("button", { "key": c, "type": "button", "className": `chip${catFilters.includes(c) ? " on" : ""}`, "onClick": () => setCatFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c])) }, c)
          ))), /*#__PURE__*/React.createElement("div", { "className": "divide-y divide-stone-100 border border-stone-100 rounded-xl mt-2" }, filteredProducts.map((p) => (
            /*#__PURE__*/React.createElement("div", { "key": p.id }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center gap-2 px-3 py-2" }, /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 text-sm" }, /*#__PURE__*/React.createElement("button", { "type": "button", "className": "prodlink", "onClick": () => openProdCard("cat-" + p.id, p.id) }, p.name)), /*#__PURE__*/React.createElement("span", { "className": "chip" }, p.cat), p.unit && /*#__PURE__*/React.createElement("span", { "className": "chip", "title": __t("Standaardeenheid") }, p.unit), pnBadgeMap[p.id] ? /*#__PURE__*/React.createElement("span", { "className": "chip", "title": __t("Aantal duplicaten in de catalogus \\u2014 samenvoegen via de melding hierboven") }, __t("\\u00d7"), pnBadgeMap[p.id]) : null, p.market && /*#__PURE__*/React.createElement("span", { "className": "chip mkt", "title": __t("Winkelvoorkeur") }, marketChip(p.market)), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400 shrink-0", "title": __t("Aantal keer gebruikt") }, usageCount(p.id), __t("×")), /*#__PURE__*/React.createElement("button", { "className": "delbtn", "title": __t("Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)"), "onClick": () => deleteProductCatalog(p.id) }, "✕")), renderProductCard("cat-" + p.id))
          )), filteredProducts.length === 0 && (
            /*#__PURE__*/React.createElement("div", { "className": "px-3 py-3 text-sm text-stone-400 text-center" }, __t("Geen producten gevonden."))
          )), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-400 mt-1" }, filteredProducts.length, __t(" van "), products.length, __t(" producten · A–Z")))
        )))
  );

  // issue #59: merge-sheet (kanjer kiezen + bevestigen)
  const renderMergeSheet = () => (
    /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", { "className": "backdrop", "onClick": () => setMergeGroup(null) }), /*#__PURE__*/React.createElement("div", { "className": "sheet" }, /*#__PURE__*/React.createElement("div", { "className": "handle" }), /*#__PURE__*/React.createElement("div", { "className": "px-4 pb-4" }, /*#__PURE__*/React.createElement("div", { "className": "flex items-center justify-between mb-2" }, /*#__PURE__*/React.createElement("div", { "className": "text-sm font-semibold" }, __t("Producten samenvoegen (#59)")), /*#__PURE__*/React.createElement("button", { "onClick": () => setMergeGroup(null), "className": "text-stone-400 px-1 text-lg leading-none" }, __t("\\u2715"))), /*#__PURE__*/React.createElement("div", { "className": "text-xs text-stone-500 mb-2" }, __t("Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.")), mergeGroup && mergeGroup.map((p) => (
            /*#__PURE__*/React.createElement("label", { "key": p.id, "className": "flex items-center gap-2 py-1 text-sm" }, /*#__PURE__*/React.createElement("input", { "type": "radio", "name": "kanjer", "checked": mergeKanjerId === p.id, "onChange": () => setMergeKanjerId(p.id) }), /*#__PURE__*/React.createElement("span", { "className": "flex-1 min-w-0 truncate" }, p.name), /*#__PURE__*/React.createElement("span", { "className": "text-xs text-stone-400" }, usageCount(p.id), __t("\\u00d7")))
          )), /*#__PURE__*/React.createElement("div", { "className": "flex gap-2 mt-3" }, /*#__PURE__*/React.createElement("button", { "className": "btn-primary flex-1", "onClick": doMerge, "disabled": !mergeKanjerId }, __t("Samenvoegen")), /*#__PURE__*/React.createElement("button", { "className": "btn-ghost", "onClick": () => setMergeGroup(null) }, __t("Annuleren"))))))
  );


  return { renderDelenSheets, renderSettingsTab, renderMergeSheet };
}

exports.createSettingsTab = createSettingsTab;
},
};
var __cache = {};
function __resolve(fromId, spec) {
  if (spec.charAt(0) !== '.') throw new Error('externe module in bundle: ' + spec);
  var parts = fromId.split('/'); parts.pop();
  spec.split('/').forEach(function (p) { if (p === '..') parts.pop(); else if (p !== '.') parts.push(p); });
  var base = parts.join('/');
  var cands = [base, base + '.js', base + '.jsx', base + '.mjs'];
  for (var i = 0; i < cands.length; i++) if (__modules[cands[i]]) return cands[i];
  throw new Error('module niet in bundle: ' + spec + ' (van ' + fromId + ')');
}
function __load(id) {
  if (__cache[id]) return __cache[id].exports;
  var m = { exports: {} };
  __cache[id] = m;
  __modules[id](m, m.exports, function (spec) { return __load(__resolve(id, spec)); });
  return m.exports;
}
function __t(key, vars) { return __i18n.t(key, vars); }
var __i18n = (function () { try { return __load("src/i18n/index.js"); } catch (e) { return { t: function (k) { return k; } }; } })();
var __entry = __load("src/App.jsx");
globalThis.App = __entry.default || __entry;
globalThis.__weekmenuModules = __load; // test/debug: pure modules benaderen (tools/test-*.cjs)
})();
