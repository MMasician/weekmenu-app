// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
import React from "react";
import { createSharedViews } from "./components.jsx";
import { ingLabel } from "../domain/catalog.js";
import { agoLabel, fmtDay } from "../domain/dates.js";
import { TIME_CATS } from "../domain/recipes.js";
import { t } from "../i18n/index.js";
import { CAT_LABEL, CAT_STYLE, TIME_LABEL, timeLabelCap } from "./labels.js";

export function createRecipesTab(ctx) {
  const { renderProductCard, renderIngRow, renderNewIngRow } = createSharedViews(ctx);
  const { activeMenuIds, addNewTag, addRecipe, addRecipeTag, addRecipeToWeek, addSheetOpen, allTags, byId, byLastEaten, clearRecipeFilters, curWeekKeys, curWeekLabel, daySheetRecipe, days, deleteRecipe, dishImgs, editRecipe, ensureDishFoto, exportRecipes, filterSheetOpen, filteredRecipes, hasRecipeFilters, importRecipes, ingFilter, ingQ, lastEaten, menuByDate, newRecipe, openProdCard, openRecipe, pickDishFoto, prodById, recipeInfoOpen, recipeQuery, recipeSort, recipes, removeDishFoto, removeRecipeTag, resetRecipes, rq, setAddSheetOpen, setDaySheetRecipe, setEditRecipe, setFilterSheetOpen, setIngFilter, setNewRecipe, setOpenRecipe, setRecipeInfoOpen, setRecipeQuery, setRecipeSort, setSortMenuOpen, setTagDraft, setTimeFilter, showFlatList, sortLast, sortMenuOpen, tagDraft, tagFilters, timeFilter, todayKey, toggleTagFilter, topTags, updateRecipe, weekToast } = ctx;

  const renderRecipeRow = (r) => {
    const inMenu = activeMenuIds.includes(r.id);
    const isOpen = openRecipe === r.id; // readonly-detail open (ADR-018)
    const isEdit = editRecipe === r.id; // bewerkmodus via ✏️ (ADR-018)
    const lastKey = lastEaten[r.id] || null;
    return (
      <div key={r.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center gap-1 px-3 py-2.5">
          <button
            onClick={() => { setOpenRecipe(isOpen ? null : r.id); if (!isOpen) { setEditRecipe(null); void ensureDishFoto(r.id); } setTagDraft(""); }}
            className="flex-1 text-left min-w-0"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-medium text-sm">
                {r.name}
                {inMenu && <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full">deze week</span>}
                {(r.ingredients || []).filter(Boolean).length === 0 && (
                  <span className="ml-1.5 text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-full">geen ingredienten bekend</span>
                )}
              </span>
              <span className="text-stone-400 text-xs shrink-0">{isOpen || isEdit ? "▴" : "▾"}</span>
            </div>
            <div className="metarow">
              <span className={`text-[10px] px-1.5 rounded ${CAT_STYLE[r.cat]}`}>{CAT_LABEL[r.cat]}</span>
              <span className={`tb tb-${r.timeCat || "normaal"}`}>{TIME_LABEL[r.timeCat || "normaal"]}</span>
              {(r.tags || []).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
              {sortLast && (
                <span className={`last${lastKey ? "" : " unknown"}`} title={lastKey ? t("Laatst gegeten: {datum}", { datum: lastKey }) : t("Nog nooit vergrendeld gegeten")}>
                  {`🕒 ${agoLabel(lastKey, todayKey)}`}
                </span>
              )}
            </div>
          </button>
          <button className="iconbtn" title="Recept bewerken" onClick={() => { setEditRecipe(isEdit ? null : r.id); setOpenRecipe(null); setTagDraft(""); }}>
            ✏️
          </button>
          <button className="iconbtn" title="Toevoegen aan een onvergrendelde dag van deze week" onClick={() => setDaySheetRecipe(r)}>📅</button>
        </div>
        {isOpen && !isEdit && (
          <div className="px-3 pb-3 border-t border-stone-100">
            <div className="text-xs font-semibold text-stone-700 mb-1 mt-2">Ingrediënten</div>
            {(r.ingredients || []).filter(Boolean).length > 0 ? (
              <div className="flex flex-wrap gap-1 mb-2">
                {(r.ingredients || []).filter(Boolean).map((ing, ii) => {
                  const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                  return (
                    <button key={ii} type="button" className="prodchip" onClick={() => p && openProdCard("rec-" + r.id, p.id)}>
                      {ingLabel(ing, prodById)}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="text-xs text-stone-400 mb-2">geen ingrediënten bekend</div>
            )}
            {renderProductCard("rec-" + r.id)}
            <div className="mb-2">
              {dishImgs[r.id] ? (
                <div>
                  <img src={dishImgs[r.id]} alt={r.name} style={{ maxWidth: "100%", maxHeight: "180px", borderRadius: "0.75rem", objectFit: "cover" }} />
                  <div className="flex gap-2 mt-1">
                    <button type="button" className="chip" onClick={() => pickDishFoto(r.id)}>📷 Vervangen</button>
                    <button type="button" className="chip" onClick={() => removeDishFoto(r.id)}>✕ Foto verwijderen</button>
                  </div>
                </div>
              ) : (
                <button type="button" className="chip" onClick={() => pickDishFoto(r.id)}>📷 Foto toevoegen</button>
              )}
            </div>
            <div className="text-xs font-semibold text-stone-700 mb-1">Bereiding</div>
            <div className="text-xs text-stone-600">{r.bereiding || "—"}</div>
          </div>
        )}
        {isEdit && (
          <div className="px-3 pb-3 border-t border-stone-100">
            <div className="mt-3 text-xs">
              <span className="text-stone-500">Naam</span>
              <input
                value={r.name}
                onChange={(e) => updateRecipe(r.id, { name: e.target.value })}
                className="w-full border rounded-lg px-2 py-1.5 mt-0.5"
              />
            </div>
            <div className="mt-3 text-xs">
              <span className="text-stone-500">Categorie</span>
              <div className="filterrow" style={{ marginTop: ".25rem" }}>
                {["vega", "vis", "vlees", "extra"].map((c) => (
                  <button key={c} className={`chip${r.cat === c ? " on" : ""}`} onClick={() => updateRecipe(r.id, { cat: c })}>
                    {CAT_LABEL[c]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-xs">
              <span className="text-stone-500">Bereidingstijd</span>
              <div className="segl mt-0.5">
                {TIME_CATS.map((tc) => (
                  <button
                    key={tc}
                    className={(r.timeCat || "normaal") === tc ? "on" : ""}
                    onClick={() => updateRecipe(r.id, { timeCat: tc })}
                  >
                    {timeLabelCap(tc)}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 text-xs">
              <span className="text-stone-500">Tags</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(r.tags || []).map((t) => (
                  <span key={t} className="tag">
                    {t} <button className="tagx" onClick={() => removeRecipeTag(r.id, t)}>×</button>
                  </span>
                ))}
              </div>
              <div className="tagadd">
                <input
                  value={tagDraft}
                  placeholder="＋ tag toevoegen…"
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRecipeTag(r.id); } }}
                />
                <button onClick={() => addRecipeTag(r.id)}>+</button>
              </div>
            </div>
            <div className="mt-3 text-xs">
              <span className="text-stone-500">Ingrediënten</span>
              <div className="mt-1">
                {(r.ingredients || []).map((ing, idx) => renderIngRow(r.id, ing, idx))}
              </div>
              <button
                className="addrow"
                style={{ border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }}
                onClick={() => updateRecipe(r.id, { ingredients: [...(r.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] })}
              >
                ＋ Ingrediënt toevoegen
              </button>
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
  };

  const renderRecipesTab = () => (
    <div>
      {recipeInfoOpen && (
        <div className="mb-2 text-xs text-stone-500">
          Zoek op receptnaam en filter op bereidingstijd, ingrediënt of tag(s). Tik op een recept om naam, categorie, bereidingstijd, tags, ingrediënten en bereiding te bewerken. Alles wordt lokaal op je toestel opgeslagen; met exporteren/importeren deel je de lijst als JSON.
        </div>
      )}
      <div className="searchbar">
        <span className="sicon">🔍</span>
        <input
          className="recipe-search"
          value={recipeQuery}
          placeholder="Zoek op receptnaam…"
          onChange={(e) => setRecipeQuery(e.target.value)}
        />
        {recipeQuery !== "" && (
          <button className="sicon" title="Zoekopdracht wissen" onClick={() => setRecipeQuery("")}>✕</button>
        )}
        <button className="iconbtn" title="Hoe werkt zoeken en filteren?" onClick={() => setRecipeInfoOpen((v) => !v)}>ℹ️</button>
        <button className="iconbtn" title="Recept toevoegen" onClick={() => setAddSheetOpen(true)}>＋</button>
      </div>
      <div className="filterrow">
        {["alle", ...TIME_CATS].map((tc) => (
          <button
            key={tc}
            className={`chip${tc !== "alle" ? " " + tc : ""}${timeFilter === tc ? " on" : ""}`}
            onClick={() => setTimeFilter(tc)}
          >
            {tc === "alle" ? t("Alle") : timeLabelCap(tc)}
          </button>
        ))}
        {topTags.map((t) => (
          <button
            key={t}
            className={`chip${tagFilters.includes(t) ? " on" : ""}`}
            onClick={() => toggleTagFilter(t)}
          >
            {`🏷 ${t}`}
          </button>
        ))}
        {allTags.length > topTags.length && (
          <button className="chip" onClick={() => setFilterSheetOpen(true)}>{`＋${allTags.length - topTags.length} meer ▾`}</button>
        )}
        <span className="sortwrap" style={{ marginLeft: "auto" }}>
          <button className="chip" title="Sorteren" onClick={() => setSortMenuOpen((v) => !v)}>
            ⇅ Sorteer ▾
          </button>
          {sortMenuOpen && (
            <div className="sortmenu">
              <button className={recipeSort === "naam" ? "on" : ""} onClick={() => { setRecipeSort("naam"); setSortMenuOpen(false); }}>
                ✓ Naam (A–Z)
              </button>
              <button className={recipeSort === "laatst" ? "on" : ""} onClick={() => { setRecipeSort("laatst"); setSortMenuOpen(false); }}>
                🕒 Laatst gegeten (langst geleden eerst)
              </button>
            </div>
          )}
        </span>
        <button className="chip" onClick={() => setFilterSheetOpen(true)}>⚙ Filters ▾</button>
      </div>
      {(hasRecipeFilters || sortLast) && (
        <div className="afilterrow">
          {sortLast && (
            <span className="afilter">{t("🕒 Laatst gegeten") + " "}<button className="x" onClick={() => setRecipeSort("naam")}>×</button></span>
          )}
          {rq !== "" && (
            <span className="afilter">{`🔍 “${recipeQuery.trim()}” `}<button className="x" onClick={() => setRecipeQuery("")}>×</button></span>
          )}
          {timeFilter !== "alle" && (
            <span className="afilter">{`⏱ ${TIME_LABEL[timeFilter]} `}<button className="x" onClick={() => setTimeFilter("alle")}>×</button></span>
          )}
          {ingQ !== "" && (
            <span className="afilter">{`🥘 ${ingFilter.trim()} `}<button className="x" onClick={() => setIngFilter("")}>×</button></span>
          )}
          {tagFilters.map((t) => (
            <span key={t} className="afilter">{`🏷 ${t} `}<button className="x" onClick={() => toggleTagFilter(t)}>×</button></span>
          ))}
          <button className="clearall" onClick={clearRecipeFilters}>Alles wissen</button>
          <span className="count">{`${filteredRecipes.length} van ${recipes.length} recepten`}</span>
        </div>
      )}
      {!showFlatList && ["vega", "vis", "vlees", "extra"].map((c) => {
        const list = recipes.filter((r) => r.cat === c).sort((a, b) => a.name.localeCompare(b.name, "nl"));
        if (!list.length) return null;
        return (
          <div key={c} className="mb-4">
            <div className={`inline-block px-2 py-0.5 rounded-full text-sm font-semibold mb-2 ${CAT_STYLE[c]}`}>
              {CAT_LABEL[c]}
            </div>
            <div className="space-y-1.5">{list.map((r) => renderRecipeRow(r))}</div>
          </div>
        );
      })}
      {showFlatList && (
        <div className="space-y-1.5">
          {[...filteredRecipes].sort(sortLast ? byLastEaten : (a, b) => a.name.localeCompare(b.name, "nl")).map((r) => renderRecipeRow(r))}
        </div>
      )}
      <div className="mutedrow">
        <button className="linkbtn" onClick={exportRecipes}>Exporteren</button>
        <label className="linkbtn cursor-pointer">
          Importeren
          <input
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => { if (e.target.files[0]) importRecipes(e.target.files[0]); e.target.value = ""; }}
          />
        </label>
        <button className="linkbtn" onClick={resetRecipes}>Standaardlijst terug</button>
      </div>
      {filterSheetOpen && (
        <div>
          <div className="backdrop" onClick={() => setFilterSheetOpen(false)}></div>
          <div className="sheet">
            <div className="handle"></div>
            <div className="px-4 pb-4">
              <div className="flex items-center mb-3">
                <span className="text-lg font-bold">Filters</span>
                <button className="ml-auto text-stone-400" onClick={() => setFilterSheetOpen(false)}>✕</button>
              </div>
              <div className="text-xs mb-1">
                <span className="text-stone-500">Bereidingstijd</span>
                <div className="segl mt-0.5">
                  {["alle", ...TIME_CATS].map((tc) => (
                    <button key={tc} className={timeFilter === tc ? "on" : ""} onClick={() => setTimeFilter(tc)}>
                      {tc === "alle" ? t("Alles") : timeLabelCap(tc)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs mt-3 mb-1">
                <span className="text-stone-500">Ingrediënt bevat</span>
                <input
                  className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                  value={ingFilter}
                  placeholder="bijv. zalm, ui, kaas…"
                  onChange={(e) => setIngFilter(e.target.value)}
                />
              </div>
              <div className="text-xs mt-3 mb-1">
                <span className="text-stone-500">Tags (alle geselecteerde moeten erop — AND)</span>
                <div className="filterrow" style={{ marginTop: ".25rem" }}>
                  {allTags.length === 0 && <span className="text-stone-400 text-xs">nog geen tags in de pool</span>}
                  {allTags.map((t) => (
                    <button key={t} className={`chip${tagFilters.includes(t) ? " on" : ""}`} onClick={() => toggleTagFilter(t)}>
                      {`🏷 ${t}`}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <button className="text-xs font-semibold text-stone-500 px-1 py-2" onClick={clearRecipeFilters}>Wis filters</button>
                <button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  {t("Toon {n} recepten", { n: filteredRecipes.length })}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {addSheetOpen && (
        <div>
          <div className="backdrop" onClick={() => setAddSheetOpen(false)}></div>
          <div className="sheet">
            <div className="handle"></div>
            <div className="px-4 pb-4">
              <div className="flex items-center mb-3">
                <span className="text-lg font-bold">Nieuw recept</span>
                <button className="ml-auto text-stone-400" onClick={() => setAddSheetOpen(false)}>✕</button>
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Naam</span>
                <input
                  className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                  value={newRecipe.name}
                  placeholder="Naam…"
                  onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                  onKeyDown={(e) => { if (e.key === "Enter") addRecipe(); }}
                />
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Categorie</span>
                <div className="filterrow" style={{ marginTop: ".25rem" }}>
                  {["vega", "vis", "vlees", "extra"].map((c) => (
                    <button key={c} className={`chip${newRecipe.cat === c ? " on" : ""}`} onClick={() => setNewRecipe({ ...newRecipe, cat: c })}>
                      {CAT_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Bereidingstijd</span>
                <div className="segl mt-0.5">
                  {TIME_CATS.map((tc) => (
                    <button key={tc} className={newRecipe.timeCat === tc ? "on" : ""} onClick={() => setNewRecipe({ ...newRecipe, timeCat: tc })}>
                      {timeLabelCap(tc)}
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Tags</span>
                <div className="flex flex-wrap gap-1 mt-0.5">
                  {newRecipe.tags.map((t) => (
                    <span key={t} className="tag">
                      {t} <button className="tagx" onClick={() => setNewRecipe({ ...newRecipe, tags: newRecipe.tags.filter((x) => x !== t) })}>×</button>
                    </span>
                  ))}
                </div>
                <div className="tagadd">
                  <input
                    value={newRecipe.tagDraft}
                    placeholder="＋ tag toevoegen…"
                    onChange={(e) => setNewRecipe({ ...newRecipe, tagDraft: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addNewTag(); } }}
                  />
                  <button onClick={addNewTag}>+</button>
                </div>
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Ingrediënten</span>
                <div className="mt-1">
                  {(newRecipe.ingredients || []).map((ing, idx) => renderNewIngRow(ing, idx))}
                </div>
                <button
                  className="addrow"
                  style={{ border: "1px dashed var(--stone-300)", borderRadius: ".75rem", marginTop: ".4rem" }}
                  onClick={() => setNewRecipe({ ...newRecipe, ingredients: [...(newRecipe.ingredients || []), { pid: null, amount: null, unit: null, name: "" }] })}
                >
                  ＋ Ingrediënt toevoegen
                </button>
              </div>
              <div className="text-xs mb-3">
                <span className="text-stone-500">Bereiding (optioneel)</span>
                <textarea
                  rows={2}
                  className="w-full border rounded-lg px-2 py-1.5 mt-0.5 text-sm"
                  value={newRecipe.bereiding}
                  placeholder="Bereiding…"
                  onChange={(e) => setNewRecipe({ ...newRecipe, bereiding: e.target.value })}
                />
              </div>
              <button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm"
                onClick={addRecipe}
              >
                Toevoegen
              </button>
            </div>
          </div>
        </div>
      )}
      {daySheetRecipe && (
        <div>
          <div className="backdrop" onClick={() => setDaySheetRecipe(null)}></div>
          <div className="sheet">
            <div className="handle"></div>
            <div className="px-4 pb-4">
              <div className="flex items-center mb-1">
                <span className="text-lg font-bold">Kies een dag deze week</span>
                <button className="ml-auto text-stone-400" onClick={() => setDaySheetRecipe(null)}>✕</button>
              </div>
              <div className="text-xs text-stone-500 mb-2">Week van {curWeekLabel} · alleen onvergrendelde dagen kiesbaar (🔒 = vastgezet)</div>
              {curWeekKeys.map((k, i) => {
                const entry = menuByDate[k];
                const locked = !!(entry && entry.locked);
                const cur = entry && entry.id ? byId[entry.id] : null;
                const isToday = k === todayKey;
                return (
                  <button
                    key={k}
                    className={`dayrow${locked ? " locked" : ""}${isToday ? " today" : ""}`}
                    disabled={locked}
                    onClick={() => addRecipeToWeek(daySheetRecipe, k)}
                  >
                    <span className="dname">{days[i]}</span>
                    <span className="ddate">{fmtDay(k)}{isToday ? " · vandaag" : ""}</span>
                    <span className="ddish">{locked ? "🔒 " : ""}{entry && entry.custom ? entry.custom : cur ? cur.name : "leeg"}</span>
                  </button>
                );
              })}
              <div className="text-xs text-stone-400 mt-3">{daySheetRecipe.name} wordt aan de gekozen dag toegewezen (een onvergrendeld gerecht aldaar wordt overschreven).</div>
            </div>
          </div>
        </div>
      )}
      {weekToast !== "" && <div className="toast">{weekToast}</div>}
    </div>
  );


  return { renderRecipeRow, renderRecipesTab };
}
