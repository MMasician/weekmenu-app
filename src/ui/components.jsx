// Gedeelde render-helpers (product-kaart, ingrediënt-rijen) + highlightMatch.
import React from "react";
import { UNITS, UNIT_GROUP, ingUnit, matchProducts } from "../domain/catalog.js";
import { t } from "../i18n/index.js";

// Klein informatieknopje (ℹ️) direct achter het onderwerp; popover met de uitleg verschijnt op aanvraag.
export function makeInfoBtn(infoOpen, setInfoOpen) {
  return (id, content) => (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        className={`iconbtn sm${infoOpen === id ? " on" : ""}`}
        title="Uitleg"
        onClick={(e) => { e.stopPropagation(); setInfoOpen(infoOpen === id ? null : id); }}
      >
        ℹ️
      </button>
      {infoOpen === id && <div className="pop">{content}</div>}
    </span>
  );
}

export function highlightMatch(name, q) {
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

export function createSharedViews(ctx) {
  const { activeIngSuggest, addProdTag, allProductTags, commitIngAmount, commitNewIngAmount, deleteProductCatalog, infoOpen, ingDrafts, ingSuggest, marketChip, markets, openOffDetail, openOffLink, openProd, prodById, prodEdit, products, removeProdTag, resolveIng, resolveNewIng, saveProductEdit, selectIngProduct, selectNewIngProduct, setActiveIngSuggest, setIngAmount, setIngDrafts, setIngSuggest, setIngTags, setIngUnit, setInfoOpen, setNewIngAmount, setNewIngUnit, setNewRecipe, setProdEdit, setRecipes, shopCats , usageCount } = ctx;
  const infoBtn = makeInfoBtn(infoOpen, setInfoOpen);

  const renderProductCard = (rowKey) => {
    if (openProd !== rowKey || !prodEdit) return null;
    const p = products.find((x) => x.id === prodEdit.id);
    if (!p) return null;
    return (
      <div className="px-3 py-3 bg-stone-50 border-t border-stone-100">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs">
            <span className="text-stone-500">Naam</span>
            <input className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" value={prodEdit.name} onChange={(e) => setProdEdit({ ...prodEdit, name: e.target.value })} />
          </label>
          <label className="text-xs">
            <span className="text-stone-500">Categorie</span>
            <select className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600" value={prodEdit.cat} onChange={(e) => setProdEdit({ ...prodEdit, cat: e.target.value })}>
              {shopCats.map((c) => (<option key={c} value={c}>{c}</option>))}
              {prodEdit.cat !== "overig" && !shopCats.includes(prodEdit.cat) && <option value={prodEdit.cat}>{prodEdit.cat}</option>}
              <option value="overig">overig</option>
            </select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs">
            <span className="text-stone-500">Eenheid (standaard bij dit product)</span>
            <select className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600" value={prodEdit.unit || ""} onChange={(e) => setProdEdit({ ...prodEdit, unit: e.target.value || null })}>
              <option value="">–</option>
              {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </label>
          <div className="text-xs">
            <span className="text-stone-500">Voorkeurssupermarkt</span>
            <div className="filterrow" style={{ marginTop: ".25rem" }}>
              <button className={`chip${!prodEdit.market ? " on" : ""}`} onClick={() => setProdEdit({ ...prodEdit, market: null })}>geen</button>
              {markets.map((m) => (
                <button key={m.key} className={`chip${prodEdit.market === m.key ? " on" : ""}`} onClick={() => setProdEdit({ ...prodEdit, market: m.key })}>{marketChip(m.key)}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <label className="text-xs relative">
            <span className="text-stone-500">Inhoud per verpakking</span>
            {infoBtn("pack", t("Per 1 {eenheid} = {inhoud} — de boodschappenlijst toont alleen hele verpakkingen.", { eenheid: prodEdit.unit || "verpakking", inhoud: `${prodEdit.packAmount || "…"} ${prodEdit.packUnit || "…"}` }))}
            <input className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm" type="number" min="0" step="any" placeholder="bijv. 500" value={prodEdit.packAmount || ""} onChange={(e) => setProdEdit({ ...prodEdit, packAmount: e.target.value })} />
          </label>
          <label className="text-xs">
            <span className="text-stone-500">Eenheid van de inhoud</span>
            <select className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm text-stone-600" value={prodEdit.packUnit || ""} onChange={(e) => setProdEdit({ ...prodEdit, packUnit: e.target.value })}>
              <option value="">–</option>
              {UNITS.map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          </label>
        </div>
        <div className="mt-2 text-xs">
          <span className="text-stone-500">Timetag</span>
          <div className="flex items-center gap-1 mt-0.5">
            <input
              className="w-20 border rounded-lg px-2 py-1.5 text-sm"
              type="number" min="0" max="365" step="1"
              value={prodEdit.timetagDraft ?? "0"}
              title="Minimum aantal dagen tussen twee gebruiken van dit product in het weekmenu (0 = geen timetag, max 365)"
              onChange={(e) => setProdEdit({ ...prodEdit, timetagDraft: e.target.value })}
            />
            <span className="text-stone-500">dagen</span>
          </div>
        </div>
        <div className="mt-2 text-xs">
          <span className="text-stone-500">Tags</span>
          <div className="flex flex-wrap gap-1 mt-0.5">
            {(prodEdit.tags || []).map((tg) => (
              <button key={tg} type="button" className="tag" title="Tag verwijderen" onClick={() => removeProdTag(tg)}>{tg}</button>
            ))}
          </div>
          <div className="tagadd">
            <input
              value={prodEdit.tagDraft || ""}
              autoCapitalize="none"
              list="product-tags-list"
              onChange={(e) => setProdEdit({ ...prodEdit, tagDraft: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProdTag(); } }}
            />
            <datalist id="product-tags-list">
              {allProductTags.map((t) => (<option key={t} value={t} />))}
            </datalist>
            <button onClick={addProdTag}>+</button>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-stone-100 text-xs">
          {p.ean ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-semibold">{t("EAN {ean}", { ean: p.ean })}</span>
              <button type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1 rounded-full" onClick={() => openOffDetail(p.id)}>{t("Productgegevens")}</button>
            </div>
          ) : (
            <div>
              <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full font-semibold">{t("geen EAN gekoppeld")}</span>
              <div>
                <button type="button" className="mt-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-3 py-1.5 rounded-full" onClick={() => openOffLink(p.id)}>{t("EAN koppelen / zoeken")}</button>
              </div>
              <div className="text-[10px] text-stone-400 mt-1">{t("Via Open Food Facts: EAN scannen/invoeren of op naam zoeken.")}</div>
              <div className="text-[10px] text-stone-400">{t("Merkloze basisproducten (bv. bloemkool): zoek op productnaam.")}</div>
            </div>
          )}
        </div>
        <div className="text-[10px] text-stone-400 mt-2">{usageCount(p.id)}× gebruikt (recepten, voorraad, extra)</div>
        <div className="flex gap-2 mt-2">
          <button className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-1.5 rounded-lg" onClick={saveProductEdit}>Opslaan</button>
          <button className="text-xs text-red-500 px-2" title="Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)" onClick={() => deleteProductCatalog(p.id)}>Verwijderen</button>
        </div>
      </div>
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
      <div key={idx} className="ingrow">
        <input
          className="qty"
          style={{ width: "2.4rem" }}
          value={amountVal}
          placeholder="#"
          title="Aantal"
          onChange={(e) => setIngAmount(rid, idx, e.target.value)}
          onBlur={() => commitIngAmount(rid, idx)}
        />
        {unit ? (
          UNIT_GROUP[unit] ? (
            <select
              className="border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0"
              style={{ width: "4.4rem" }}
              value={unit}
              title="Eenheid (alleen converteerbare eenheden wijzigbaar)"
              onChange={(e) => setIngUnit(rid, idx, e.target.value)}
            >
              {UNIT_GROUP[unit].map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          ) : (
            <span className="text-xs text-stone-500 shrink-0" title="Eenheid van het product">{unit}</span>
          )
        ) : null}
        <span className="grow suggest-wrap">
          <input
            className="name"
            value={nameVal}
            placeholder="Productnaam…"
            onChange={(e) => {
              setIngDrafts((d) => ({ ...d, [key]: e.target.value }));
              setIngSuggest(e.target.value.trim().length >= 2 ? key : null);
              setActiveIngSuggest(0);
            }}
            onBlur={() => resolveIng(rid, idx, nameVal)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (sugg.length && sugg[activeIngSuggest]) selectIngProduct(rid, idx, sugg[activeIngSuggest]);
                else resolveIng(rid, idx, nameVal);
              } else if (e.key === "Escape") setIngSuggest(null);
              else if (e.key === "ArrowDown" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.min(s2 + 1, sugg.length - 1)); }
              else if (e.key === "ArrowUp" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.max(s2 - 1, 0)); }
            }}
          />
          {sugg.length > 0 && (
            <div className="suggest-list">
              {sugg.map((s2, si) => (
                <div
                  key={s2.id}
                  className={`suggest-item${si === activeIngSuggest ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); selectIngProduct(rid, idx, s2); }}
                >
                  <span>{highlightMatch(s2.name, q)}</span>
                  <span className="text-[10px] text-stone-400 shrink-0">{s2.cat}{s2.unit ? ` · ${s2.unit}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </span>
        {typeof ing === "object" && ing && Array.isArray(ing.tags) && ing.tags.length > 0 && (
          <span className="shrink-0 flex gap-1">
            {ing.tags.map((tg) => (
              <button key={tg} type="button" className="tag" title="Per-recept tag (geldt alleen in dit recept) — klik om te verwijderen" onClick={() => setIngTags(rid, idx, ing.tags.filter((x) => x !== tg))}>{tg}</button>
            ))}
          </span>
        )}
        <button
          type="button"
          className="text-stone-300 hover:text-red-500 text-sm"
          title="Ingrediënt verwijderen"
          onClick={() => setRecipes((rs) => rs.map((r) => (r.id !== rid ? r : { ...r, ingredients: (r.ingredients || []).filter((_, j) => j !== idx) })))}
        >
          ✕
        </button>
      </div>
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
      <div key={idx} className="ingrow">
        <input
          className="qty"
          style={{ width: "2.4rem" }}
          value={amountVal}
          placeholder="#"
          title="Aantal"
          onChange={(e) => setNewIngAmount(idx, e.target.value)}
          onBlur={() => commitNewIngAmount(idx)}
        />
        {unit ? (
          UNIT_GROUP[unit] ? (
            <select
              className="border rounded-lg px-1 py-1.5 text-xs text-stone-600 shrink-0"
              style={{ width: "4.4rem" }}
              value={unit}
              title="Eenheid (alleen converteerbare eenheden wijzigbaar)"
              onChange={(e) => setNewIngUnit(idx, e.target.value)}
            >
              {UNIT_GROUP[unit].map((u) => (<option key={u} value={u}>{u}</option>))}
            </select>
          ) : (
            <span className="text-xs text-stone-500 shrink-0" title="Eenheid van het product">{unit}</span>
          )
        ) : null}
        <span className="grow suggest-wrap">
          <input
            className="name"
            value={nameVal}
            placeholder="Productnaam…"
            onChange={(e) => {
              setIngDrafts((d) => ({ ...d, [key]: e.target.value }));
              setIngSuggest(e.target.value.trim().length >= 2 ? key : null);
              setActiveIngSuggest(0);
            }}
            onBlur={() => resolveNewIng(idx, nameVal)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (sugg.length && sugg[activeIngSuggest]) selectNewIngProduct(idx, sugg[activeIngSuggest]);
                else resolveNewIng(idx, nameVal);
              } else if (e.key === "Escape") setIngSuggest(null);
              else if (e.key === "ArrowDown" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.min(s2 + 1, sugg.length - 1)); }
              else if (e.key === "ArrowUp" && sugg.length) { e.preventDefault(); setActiveIngSuggest((s2) => Math.max(s2 - 1, 0)); }
            }}
          />
          {sugg.length > 0 && (
            <div className="suggest-list">
              {sugg.map((s2, si) => (
                <div
                  key={s2.id}
                  className={`suggest-item${si === activeIngSuggest ? " active" : ""}`}
                  onMouseDown={(e) => { e.preventDefault(); selectNewIngProduct(idx, s2); }}
                >
                  <span>{highlightMatch(s2.name, q)}</span>
                  <span className="text-[10px] text-stone-400 shrink-0">{s2.cat}{s2.unit ? ` · ${s2.unit}` : ""}</span>
                </div>
              ))}
            </div>
          )}
        </span>
        <button
          type="button"
          className="text-stone-300 hover:text-red-500 text-sm"
          title="Ingrediënt verwijderen"
          onClick={() => setNewRecipe((nr) => ({ ...nr, ingredients: (nr.ingredients || []).filter((_, j) => j !== idx) }))}
        >
          ✕
        </button>
      </div>
    );
  };


  return { renderProductCard, renderIngRow, renderNewIngRow };
}

// ---- issue #48: Open Food Facts-sheets (koppelen/zoeken + productdetail gekoppeld), bestaande bottom-sheet-stijl ----
const OFF_NUTRI_ROWS = [
  ["energyKcal", "Energie"],
  ["fat", "Vet"],
  ["carbs", "Koolhydraten"],
  ["protein", "Eiwitten"],
  ["salt", "Zout"],
];
const fmtNutri = (v) => (v == null ? "–" : String(Math.round(v * 100) / 100).replace(".", ","));

export function createOffSheets(ctx) {
  const { offDetailFor, offDraft, offLinkFor, offLookup, offPick, offRefresh, offScan, offScanning, offSearch, offUnlink, prodById, prodImgs, setOffDetailFor, setOffDraft, setOffLinkFor } = ctx;
  const linkProd = offLinkFor ? prodById[offLinkFor] : null;
  const detailProd = offDetailFor ? prodById[offDetailFor] : null;
  const detailImg = detailProd && detailProd.ean ? prodImgs[detailProd.ean] : null;

  const renderOffSheets = () => (
    <div>
      {linkProd && (
        <div>
          <div className="backdrop" onClick={() => setOffLinkFor(null)}></div>
          <div className="sheet">
            <div className="handle"></div>
            <div className="px-4 pb-4">
              <div className="flex items-center mb-1">
                <span className="text-lg font-bold">{t("EAN koppelen / zoeken")}</span>
                <button type="button" className="ml-auto text-stone-400" onClick={() => setOffLinkFor(null)}>✕</button>
              </div>
              <div className="text-xs text-stone-500 mb-3">{t("voor \"{naam}\" ({cat})", { naam: linkProd.name, cat: linkProd.cat })}</div>
              <div className="flex gap-2">
                <input
                  className="flex-1 min-w-0 border rounded-lg px-2 py-1.5 text-sm"
                  inputMode="numeric"
                  autoCapitalize="none"
                  placeholder={t("EAN invoeren…")}
                  title={t("Enter = opzoeken bij Open Food Facts")}
                  value={offDraft.ean}
                  onChange={(e) => setOffDraft((d) => ({ ...d, ean: e.target.value.replace(/[^\d]/g, ""), error: null }))}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void offLookup(offDraft.ean); } }}
                />
                <button type="button" className="border rounded-lg px-3 text-sm whitespace-nowrap" onClick={() => void offScan()} disabled={offScanning}>
                  {offScanning ? t("Scannen…") : "📷 " + t("scan")}
                </button>
              </div>
              <div className="text-xs text-stone-500 mt-3 mb-1">{t("of zoek op productnaam")}</div>
              <input
                className="w-full border rounded-lg px-2 py-1.5 text-sm"
                autoCapitalize="none"
                value={offDraft.q}
                onChange={(e) => void offSearch(e.target.value)}
              />
              {offDraft.restricted && (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-[11px] text-amber-800 mt-2">
                  {t("EAN-8 (20–29) is niet uniek (restricted circulation, o.a. Lidl): alle matches worden getoond ter desambiguatie.")}
                </div>
              )}
              {offDraft.loading && <div className="text-xs text-stone-400 mt-2">{t("Zoeken…")}</div>}
              {offDraft.error && <div className="text-xs text-red-600 mt-2">{offDraft.error}</div>}
              <div className="flex flex-col gap-1.5 mt-2">
                {offDraft.results.map((r) => (
                  <div key={r.ean} className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-lg p-2">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    ) : (
                      <span className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center text-sm shrink-0">📦</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate">{r.fullName}</div>
                      <div className="text-[11px] text-stone-500 truncate">{[r.brand, r.ean ? t("EAN {ean}", { ean: r.ean }) : null].filter(Boolean).join(" · ")}</div>
                    </div>
                    <button type="button" className="chip on" onClick={() => void offPick(r)}>{t("Kies")}</button>
                  </div>
                ))}
              </div>
              <div className="text-[10px] text-stone-400 mt-3">{t("Bron: Open Food Facts · data & foto's CC BY-SA 3.0")}</div>
            </div>
          </div>
        </div>
      )}
      {detailProd && detailProd.ean && (
        <div>
          <div className="backdrop" onClick={() => setOffDetailFor(null)}></div>
          <div className="sheet">
            <div className="handle"></div>
            <div className="px-4 pb-4">
              <div className="flex items-center mb-3">
                <button type="button" className="text-stone-500 mr-1" onClick={() => setOffDetailFor(null)}>‹</button>
                <span className="text-lg font-bold">{t("Productgegevens")}</span>
                <button type="button" className="ml-auto text-stone-400" onClick={() => setOffDetailFor(null)}>✕</button>
              </div>
              <div className="relative mb-2">
                {detailImg ? (
                  <img src={detailImg} alt="" className="w-full h-36 object-cover rounded-xl" />
                ) : detailProd.offImageUrl ? (
                  <img src={detailProd.offImageUrl} alt="" className="w-full h-36 object-cover rounded-xl" />
                ) : (
                  <div className="w-full h-36 rounded-xl bg-stone-100 flex items-center justify-center text-2xl">📦</div>
                )}
                {detailImg && (
                  <span className="absolute top-2 right-2 text-[10px] bg-black/55 text-white px-1.5 py-0.5 rounded-full">{"● "}{t("gecachet · offline")}</span>
                )}
              </div>
              <div className="text-base font-bold leading-snug">{detailProd.fullName || detailProd.name}</div>
              <div className="text-xs font-semibold text-emerald-700 mb-3">{t("EAN {ean}", { ean: detailProd.ean })}</div>
              {detailProd.nutrition ? (
                <div>
                  <div className="flex items-baseline mb-1">
                    <span className="text-sm font-bold">{t("Voedingswaarden")}</span>
                    <span className="ml-auto text-[11px] text-stone-500">{t("per 100 g")}</span>
                    {detailProd.nutrition.servingSize && (
                      <span className="ml-3 text-[11px] text-stone-500">{t("portie {size}", { size: detailProd.nutrition.servingSize })}</span>
                    )}
                  </div>
                  <div className="border-t border-stone-100">
                    {OFF_NUTRI_ROWS.map(([key, label]) => (
                      <div key={key} className="flex items-center py-1 border-b border-stone-100 text-sm">
                        <span>{t(label)}</span>
                        <span className="ml-auto">{fmtNutri(detailProd.nutrition.per100 && detailProd.nutrition.per100[key])}{key === "energyKcal" ? " kcal" : " g"}</span>
                        {detailProd.nutrition.perServing && detailProd.nutrition.servingSize && (
                          <span className="ml-3 w-16 shrink-0 text-right text-stone-600">{fmtNutri(detailProd.nutrition.perServing[key])}{key === "energyKcal" ? " kcal" : " g"}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-xs text-stone-500 mb-1">{t("Geen voedingswaarden bekend bij Open Food Facts.")}</div>
              )}
              {detailImg && (
                <div className="text-[11px] font-semibold text-emerald-700 mt-2">{"● "}{t("uit lokale cache · offline beschikbaar · geen nieuwe API-call")}</div>
              )}
              <button type="button" className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mt-3" onClick={() => void offRefresh(detailProd.id)}>{t("Waarden opnieuw ophalen")}</button>
              <button type="button" className="w-full text-xs text-red-500 py-2" onClick={() => void offUnlink(detailProd.id)}>{t("Ontkoppelen")}</button>
              <div className="text-[10px] text-stone-400 mt-1">
                {detailImg ? t("Gegevens & foto's: Open Food Facts (CC BY-SA 3.0) · foto lokaal gecachet") : t("Bron: Open Food Facts · data & foto's CC BY-SA 3.0")}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return { renderOffSheets };
}
