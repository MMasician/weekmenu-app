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
  const { activeIngSuggest, addProdTag, allProductTags, commitIngAmount, commitNewIngAmount, deleteProductCatalog, infoOpen, ingDrafts, ingSuggest, marketChip, markets, openProd, prodById, prodEdit, products, removeProdTag, resolveIng, resolveNewIng, saveProductEdit, selectIngProduct, selectNewIngProduct, setActiveIngSuggest, setIngAmount, setIngDrafts, setIngSuggest, setIngTags, setIngUnit, setInfoOpen, setNewIngAmount, setNewIngUnit, setNewRecipe, setProdEdit, setRecipes, shopCats , usageCount } = ctx;
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
