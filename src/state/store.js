// App-state en acties: één hook met alle useState/useMemo/useEffect (de test-harness
// vouwt alleen plain-functie-aanroepen open, dus alle hooks blijven hier in één scope).
import { useEffect, useMemo, useState } from "react";
import { UNIT_FACTOR, UNIT_GROUP, buildCatalog, convertAmount, fmtFactor, ingLabel, ingUnit, migrateRecipesIngredients, normalizeAmountUnit, normalizePack, normalizeProducts, pidOfName, priceKey, productKey, roundAmt, scaleIng, shopDisplayAmount } from "../domain/catalog.js";
import { addDays, dateKey, fmtDay, fmtShort, monthGrid, startOfWeek, weekDateKeys, weekStartFor } from "../domain/dates.js";
import { dayNames, setLanguage, t } from "../i18n/index.js";
import { shuffle } from "../domain/menu.js";
import { BASE_RECIPES, loadRecipes, normalizeRecipe } from "../domain/recipes.js";
import { THEME_META, normalizeSettings } from "../domain/settings.js";
import { SHARE_BUNDLE, mergeShareBundle, shareStampArray, shareStampObject, shareStrip, shareTombs, shareTombsObject } from "../domain/share.js";
import { defaultStock, normalizeExtras, normalizeLocations, normalizeStock } from "../domain/stock.js";
import { loadState, migrateStored, newId, saveState } from "../domain/storage.js";
import { GF, OFF, PN, TT } from "../lib/externals.js";

export function useAppStore() {
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
  const [infoOpen, setInfoOpen] = useState(null);
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
  // ---- issue #48: Open Food Facts-koppeling per product (EAN, fullName, voedingswaarden, foto) ----
  const [prodImgs, setProdImgs] = useState({}); // ean -> objectURL (OFF-foto uit de gedeelde image-store, #60)
  const [offLinkFor, setOffLinkFor] = useState(null); // product-id met open koppelen/zoeken-sheet
  const [offDetailFor, setOffDetailFor] = useState(null); // product-id met open product-detail-sheet (EAN gekoppeld)
  const [offDraft, setOffDraft] = useState({ ean: "", q: "", results: [], loading: false, error: null, restricted: false }); // werkstate koppelen/zoeken-sheet
  const [offScanning, setOffScanning] = useState(false); // barcode-scanner actief (indien ondersteund)

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
  // #60: thumbnails op de dagkaarten laden (foto per gerecht uit de lokale image-store)
  useEffect(() => {
    weekEntries.forEach((e) => { if (e && e.id) void ensureDishFoto(e.id); });
  }, [weekEntries]);
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
  // ---- issue #48: OFF-productgegevens (EAN lookup/zoek, voedingswaarden, foto-cache) ----
  async function ensureProdFoto(ean) {
    if (!GF || !ean || prodImgs[ean]) return;
    try {
      const rec = await GF.getProductImage(ean);
      if (rec && rec.blob) setProdImgs((m) => ({ ...m, [ean]: URL.createObjectURL(rec.blob) }));
    } catch (e) { /* IndexedDB niet beschikbaar -> geen foto's */ }
  }
  function openOffLink(pid) {
    const p = pid && prodById[pid];
    if (!p) return;
    setOffDetailFor(null);
    setOffLinkFor(pid);
    setOffDraft({ ean: "", q: p.name || "", results: [], loading: false, error: null, restricted: false });
    void offSearch(p.name); // zoekveld is vooringevuld met de productnaam -> direct resultaten tonen
  }
  function openOffDetail(pid) {
    const p = pid && prodById[pid];
    if (!p || !p.ean) return;
    setOffLinkFor(null);
    setOffDetailFor(pid);
    void ensureProdFoto(p.ean);
  }
  async function offLookup(ean) {
    if (!OFF) return;
    const code = OFF.cleanEan(ean);
    if (!OFF.isEan(code)) {
      setOffDraft((d) => ({ ...d, ean: code, results: [], error: t("Geen geldige EAN (8, 12 of 13 cijfers).") }));
      return;
    }
    setOffDraft((d) => ({ ...d, ean: code, loading: true, error: null }));
    try {
      if (OFF.isRestrictedEan8(code)) {
        // EAN-8 20-29 (restricted circulation, o.a. Lidl) is niet uniek: alle matches tonen ter desambiguatie
        const results = await OFF.searchProducts(code);
        setOffDraft((d) => (d.ean === code ? { ...d, loading: false, results, restricted: true, error: results.length ? null : t("EAN {ean} niet gevonden bij Open Food Facts.", { ean: code }) } : d)); // verouderd antwoord negeren
      } else {
        const prod = await OFF.lookupEan(code);
        setOffDraft((d) => (d.ean === code ? { ...d, loading: false, results: prod ? [prod] : [], restricted: false, error: prod ? null : t("EAN {ean} niet gevonden bij Open Food Facts.", { ean: code }) } : d));
      }
    } catch (err) {
      setOffDraft((d) => (d.ean === code ? { ...d, loading: false, error: t("Ophalen mislukt (offline of rate limit): {fout}", { fout: err && err.message ? err.message : String(err) }) } : d));
    }
  }
  async function offSearch(q) {
    if (!OFF) return;
    const query = String(q || "").trim();
    setOffDraft((d) => ({ ...d, q: query }));
    if (query.length < 2) {
      setOffDraft((d) => ({ ...d, results: [], error: null, loading: false }));
      return;
    }
    setOffDraft((d) => ({ ...d, loading: true, error: null }));
    try {
      const results = await OFF.searchProducts(query);
      setOffDraft((d) => {
        if (d.q !== query) return d; // bij elke letter een request: alleen het nieuwste query-antwoord toepassen
        // de naam werkt als filter: alleen treffers met de zoekterm in naam/merk; bij geen treffer de OFF-lijst tonen
        const ql = query.toLowerCase();
        const gefilterd = results.filter((r) => `${r.fullName || ""} ${r.brand || ""}`.toLowerCase().includes(ql));
        const shown = gefilterd.length ? gefilterd : results;
        return { ...d, loading: false, results: shown, error: results.length ? null : t("Geen resultaten — probeer een andere term of voer de EAN in.") };
      });
    } catch (err) {
      setOffDraft((d) => (d.q === query ? { ...d, loading: false, error: t("Ophalen mislukt (offline of rate limit): {fout}", { fout: err && err.message ? err.message : String(err) }) } : d));
    }
  }
  async function offScan() {
    // Barcode-scannen alleen als de browser BarcodeDetector + camera ondersteunt; anders handmatige EAN-invoer
    const BD = typeof globalThis !== "undefined" ? globalThis.BarcodeDetector : null;
    const media = typeof navigator !== "undefined" && navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function" ? navigator.mediaDevices : null;
    if (!BD || !media || typeof document === "undefined" || !document.createElement) {
      setOffDraft((d) => ({ ...d, error: t("Scannen wordt niet ondersteund op dit apparaat — voer de EAN handmatig in.") }));
      return;
    }
    setOffScanning(true);
    let stream = null;
    try {
      stream = await media.getUserMedia({ video: { facingMode: "environment" } });
      const video = document.createElement("video");
      video.srcObject = stream;
      if (video.play) await video.play();
      const det = new BD({ formats: ["ean_13", "ean_8", "code_128"] });
      for (let i = 0; i < 200; i++) {
        const codes = await det.detect(video);
        const raw = codes && codes[0] && codes[0].rawValue;
        if (raw) {
          setOffScanning(false);
          if (stream) stream.getTracks().forEach((tr) => tr.stop());
          void offLookup(raw);
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      setOffDraft((d) => ({ ...d, error: t("Geen barcode herkend — voer de EAN handmatig in.") }));
    } catch (err) {
      setOffDraft((d) => ({ ...d, error: t("Scannen mislukt — voer de EAN handmatig in.") }));
    } finally {
      setOffScanning(false);
      if (stream) stream.getTracks().forEach((tr) => tr.stop());
    }
  }
  async function saveOffImage(ean, imageUrl) {
    // OFF-foto ophalen (alleen images.openfoodfacts.org) en lokaal cachen in de gedeelde image-store (#60)
    if (!imageUrl || !GF || !OFF) return;
    try {
      const blob = await OFF.downloadImage(imageUrl, null, 400);
      if (!blob) return;
      await GF.saveProductImage(ean, blob);
      setProdImgs((m) => {
        if (m[ean]) URL.revokeObjectURL(m[ean]);
        return { ...m, [ean]: URL.createObjectURL(blob) };
      });
    } catch (e) { /* foto niet beschikbaar -> alleen de URL bewaren */ }
  }
  async function offPick(prod) {
    const pid = offLinkFor;
    const p = pid && prodById[pid];
    if (!p || !prod || !prod.ean || !OFF) return;
    const imageUrl = prod.imageUrl || p.offImageUrl || null;
    await saveOffImage(prod.ean, imageUrl);
    setProducts((ps) => ps.map((x) => (x.id === pid ? { ...x, ean: prod.ean, fullName: prod.fullName || x.fullName || null, nutrition: prod.nutrition || x.nutrition || null, offImageUrl: imageUrl } : x)));
    setOffLinkFor(null);
    setOffDraft({ ean: "", q: "", results: [], loading: false, error: null, restricted: false });
    setPnToast({ msg: t("Product gekoppeld aan Open Food Facts: {naam}", { naam: prod.fullName || p.name }), canUndo: false });
  }
  async function offRefresh(pid) {
    const p = pid && prodById[pid];
    if (!p || !p.ean || !OFF) return;
    setPnToast({ msg: t("Waarden opnieuw ophalen…"), canUndo: false });
    try {
      const prod = await OFF.lookupEan(p.ean);
      if (!prod) {
        setPnToast({ msg: t("EAN {ean} niet gevonden bij Open Food Facts.", { ean: p.ean }), canUndo: false });
        return;
      }
      const imageUrl = prod.imageUrl || p.offImageUrl || null;
      await saveOffImage(p.ean, imageUrl);
      setProducts((ps) => ps.map((x) => (x.id === pid ? { ...x, fullName: prod.fullName || x.fullName || null, nutrition: prod.nutrition || x.nutrition || null, offImageUrl: imageUrl } : x)));
      setPnToast({ msg: t("Waarden opgehaald en lokaal opgeslagen."), canUndo: false });
    } catch (err) {
      setPnToast({ msg: t("Ophalen mislukt (offline of rate limit): {fout}", { fout: err && err.message ? err.message : String(err) }), canUndo: false });
    }
  }
  async function offUnlink(pid) {
    const p = pid && prodById[pid];
    if (!p) return;
    if (p.ean && GF) { try { await GF.deleteProductImage(p.ean); } catch (e) { /* ignore */ } }
    setProdImgs((m) => {
      if (p.ean && m[p.ean]) URL.revokeObjectURL(m[p.ean]);
      const n = { ...m };
      if (p.ean) delete n[p.ean];
      return n;
    });
    setProducts((ps) => ps.map((x) => (x.id === pid ? { ...x, ean: null, fullName: null, nutrition: null, offImageUrl: null } : x)));
    setOffDetailFor(null);
    setPnToast({ msg: t("Koppeling met Open Food Facts verwijderd."), canUndo: false });
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
    if (p.ean) void ensureProdFoto(p.ean); // #48: OFF-foto uit de lokale cache laden
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
    setProducts((ps) => ps.map((p) => (p.id === prodEdit.id ? { ...p, name: name || p.name, cat: String(prodEdit.cat || "overig").trim().toLowerCase(), market: prodEdit.market || null, unit: prodEdit.unit || null, tags, pack, timetag } : p)));
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
    const norm = [...new Set((tags || []).map((x) => String(x || "").trim().toLowerCase()).filter(Boolean))];
    setRecipes((rs) => rs.map((r) => (r.id !== rid ? r : { ...r, ingredients: (r.ingredients || []).map((ing, j) => (j === idx && typeof ing === "object" && ing ? { ...ing, tags: norm } : ing)) })));
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
    const c = newCat.trim().toLowerCase();
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
    activeIngSuggest, activeMenuIds, activeSuggest, addCat, addExtraRowFn, addLocOpen, addLocation, addNewTag, addProdRow, addProdTag, addProductRow, addRecipe, addRecipeTag, addRecipeToWeek, addSheetOpen, addTagRule, allProductTags, allRuleTags, allTags, anyScaled, applyDeviation, applyImportReview, blockedByRules, buildShareName, bumpDeleted, bumpHave, bumpWant, byId, byLastEaten, calAnchor, calWeeks, catFilters, catMap, catOf, catOpen, catRank, catalog0, catsOpen, checked, checkedAt, clearRecipeFilters, commitDay, commitIngAmount, commitNewIngAmount, curWeekEnd, curWeekKeys, curWeekLabel, curWeekStart, dateSheetOpen, daySheetRecipe, dayTimetagMarks, days, deelChips, deelRapportLines, delenOpen, deleteLocation, deleteProduct, deleteProductCatalog, deleteRecipe, deleted, devPick, devTab, deviationKey, dishImgs, doMerge, doneItems, drafts, eatersOpen, editLoc, editRecipe, ensureDishFoto, ensureProdFoto, ensureProduct, exportRecipes, exportShare, extraItems, extraSuggest, filterSheetOpen, filteredProducts, filteredRecipes, fishDays, fotoFor, generateMenu, goTab, hasRecipeFilters, haveOfProd, hiddenChecked, importRecipes, importReview, importShareFile, ingDrafts, ingFilter, ingQ, ingSuggest, infoOpen, instantProducts, isRowChecked, lastEaten, listRows, marketChip, marketOf, markets, maxShopDays, mealOk, mealStatus, mealWarn, menuByDate, mergeGroup, mergeKanjerId, moveCat, newCat, newExtra, newLocName, newProdRow, newRecipe, offDetailFor, offDraft, offLinkFor, offLookup, offPick, offRefresh, offScan, offScanning, offSearch, offUnlink, onDishFotoFile, openDay, openLocs, openMergeGroup, openOffDetail, openOffLink, openProd, openProdCard, openRecipe, openSuggest, otherDays, pickDishFoto, pnBadgeMap, pnDupGroups, pnRecipesToMain, pnToast, pq, prepareImport, processChecked, prodById, prodByKey, prodEdit, prodImgs, prodOfLabel, prodQuery, prodRowSuggest, products, productsOf, recipeInfoOpen, recipeQuery, recipeSort, recipes, removeCat, removeDishFoto, removeProdTag, removeRecipeTag, removeTagRule, resetRecipes, resolveIng, resolveNewIng, reviewImport, rowVisible, rq, ruleDraft, rulesSheetOpen, safeExternalUrl, saveProductEdit, scaledFactors, scopeKeys, selectIngProduct, selectNewIngProduct, selectRecipe, setActiveIngSuggest, setActiveSuggest, setAddLocOpen, setAddProdRow, setAddSheetOpen, setCatFilters, setCatOpen, setCatsOpen, setChecked, setCheckedAtRaw, setCheckedRaw, setDateSheetOpen, setDay, setDaySheetRecipe, setDeelChips, setDelenOpen, setDeletedRaw, setDevPick, setDevTab, setDeviationKey, setDishImgs, setDrafts, setEaters, setEatersOpen, setEditLoc, setEditRecipe, setExtraItems, setExtraItemsRaw, setExtraSuggest, setFilterSheetOpen, setFotoFor, setHiddenChecked, setImportReview, setIngAmount, setIngDrafts, setIngFilter, setIngSuggest, setIngTags, setIngUnit, setInfoOpen, setMenuByDate, setMenuByDateRaw, setMergeGroup, setMergeKanjerId, setNewCat, setNewExtra, setNewIngAmount, setNewIngUnit, setNewLocName, setNewProdRow, setNewRecipe, setOffDetailFor, setOffDraft, setOffLinkFor, setOffScanning, setOpenDay, setOpenLocs, setOpenProd, setOpenRecipe, setOpenSuggest, setPnToast, setProdEdit, setProdQuery, setProdRowSuggest, setProducts, setProductsRaw, setRecipeInfoOpen, setRecipeQuery, setRecipeSort, setRecipes, setRecipesRaw, setRuleDraft, setRulesSheetOpen, setSettings, setSettingsRaw, setShareToast, setShopDays, setShopDone, setShopInfoOpen, setShopMarkets, setShowChecked, setSortMenuOpen, setStock, setStockInfoOpen, setStockLocations, setStockLocationsRaw, setStockRaw, setTab, setTagDraft, setTagFilters, setTagRuleDays, setTimeFilter, setUndoStack, setWeekOffset, setWeekToast, settings, shareToast, shopCats, shopDays, shopDaysEff, shopDone, shopInfoOpen, shopMarkets, shopMarketsEff, shoppingRows, showChecked, showFlatList, sortLast, sortMenuOpen, sortRowsByCat, stock, stockInfoOpen, stockLocations, stockShort, stored, tab, tagCounts, tagDraft, tagFilters, timeFilter, todayDayIdx, todayKey, todayLabel, toggleLoc, toggleTagFilter, topTags, totalItems, ttCtx, undoMerge, undoStack, unfilteredCount, updateMarket, updateRecipe, updateSettings, updateTakeawayLink, usageCount, vegaCount, visibleRows, weekEnd, weekEntries, weekKeys, weekLabel, weekOffset, weekStart, weekToast
  };
}
