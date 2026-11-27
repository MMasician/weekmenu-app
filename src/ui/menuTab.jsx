// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
import React from "react";
import { createSharedViews } from "./components.jsx";
import { fmtFactor, ingLabel, matchRecipes } from "../domain/catalog.js";
import { dayShortOf, fmtDay, weeksBetween } from "../domain/dates.js";
import { dayNames, monthNames, t } from "../i18n/index.js";
import { highlightMatch } from "./components.jsx";
import { CAT_LABEL, CAT_STYLE, TIME_LABEL, TIME_STYLE } from "./labels.js";

export function createMenuTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { activeSuggest, addTagRule, allRuleTags, applyDeviation, byId, calAnchor, calWeeks, commitDay, dayTimetagMarks, days, devPick, devTab, deviationKey, dishImgs, drafts, eatersOpen, ensureDishFoto, fishDays, generateMenu, haveOfProd, instantProducts, mealStatus, menuByDate, openDay, openProdCard, openSuggest, otherDays, prodById, recipes, removeTagRule, ruleDraft, safeExternalUrl, selectRecipe, setActiveSuggest, setDateSheetOpen, setDay, setDevPick, setDevTab, setDeviationKey, setDrafts, setEaters, setEatersOpen, setOpenDay, setOpenSuggest, setRuleDraft, setRulesSheetOpen, setTab, setTagRuleDays, setWeekOffset, settings, todayKey, todayLabel, updateSettings, vegaCount, weekEntries, weekKeys, weekLabel, weekOffset } = ctx;

  const renderMenuTab = () => (
    <div>
      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <div className="text-[10px] text-stone-400 font-medium tracking-wide">VANDAAG</div>
            <div className="text-2xl font-bold">{todayLabel}</div>
          </div>
          <button
            onClick={() => setDateSheetOpen(true)}
            className="shrink-0 px-3 py-2 border rounded-lg text-sm text-stone-600 bg-white"
          >
            📅 Kies een datum ▾
          </button>
        </div>
        <div className="text-xs text-stone-400 mt-1">Week van {weekLabel}</div>
        <button
          onClick={generateMenu}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl mt-3"
        >
          Genereer weekmenu
        </button>
      </div>

      <div className="space-y-2">
        {days.map((day, i) => {
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
            <div key={key} className={`rounded-xl shadow-sm p-3 ${isToday ? "bg-emerald-100" : "bg-white"}`}>
              <div className="flex items-center gap-3">
                <div className="w-20 shrink-0">
                  <div className={`text-sm font-semibold ${isToday ? "text-emerald-700" : ""}`}>{day}</div>
                  <div className="text-[10px] text-stone-400">
                    {fmtDay(key)}
                    {isToday ? t(" · vandaag") : ""}
                  </div>
                  {ttMarks.length > 0 && (
                    <span
                      className="chip"
                      style={{ background: "#fef3c7", color: "#92400e" }}
                      title={ttMarks.map((m) => t("{naam}: nog {n} dag(en) binnen de timetag", { naam: m.name, n: m.remaining })).join("; ")}
                    >
                      ⏱ {ttMarks.reduce((a, m) => a + m.remaining, 0)} d
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 suggest-wrap">
                  <input
                    className="dish-input"
                    value={text}
                    placeholder="Typ een gerecht…"
                    readOnly={!!(entry && entry.locked)}
                    onClick={() => { if (entry && entry.locked) { const willOpen = openDay !== key; setOpenDay(willOpen ? key : null); if (willOpen && entry.id) void ensureDishFoto(entry.id); } }}
                    title={entry && entry.locked ? t("Gerecht bekijken (ingrediënten + bereiding) — ontgrendelen via het slot") : undefined}
                    onChange={(e) => {
                      const v = e.target.value;
                      setDrafts((d) => ({ ...d, [key]: v }));
                      setOpenSuggest(v.trim().length >= 2 ? key : null);
                      setActiveSuggest(0);
                    }}
                    onBlur={() => commitDay(i)}
                    onKeyDown={(e) => {
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
                    }}
                  />
                  {isCustom && (
                    <div className="mt-0.5">
                      <span className="tag-free">📍 geen boodschappen</span>
                    </div>
                  )}
                  {!isCustom && r && (
                    <div className="text-xs text-stone-400 mt-0.5">
                      <span className={`inline-block px-1.5 rounded ${CAT_STYLE[r.cat]}`}>{CAT_LABEL[r.cat]}</span>
                      <span className={`inline-block px-1.5 rounded ${TIME_STYLE[r.timeCat || "normaal"]}`}>{TIME_LABEL[r.timeCat || "normaal"]}</span>
                    </div>
                  )}
                  {suggestions.length > 0 && (
                    <div className="suggest-list">
                      {suggestions.map((s, si) => (
                        <div
                          key={s.id}
                          className={`suggest-item${si === activeSuggest ? " active" : ""}`}
                          onMouseDown={(e) => {
                            e.preventDefault();
                            selectRecipe(i, s.id);
                          }}
                        >
                          <span>{highlightMatch(s.name, q)}</span>
                          <span className={`text-[10px] shrink-0 inline-block px-1.5 rounded ${CAT_STYLE[s.cat]}`}>{CAT_LABEL[s.cat]}</span>
                        </div>
                      ))}
                      <div className="suggest-foot">↵ Enter — “{text.trim()}” als eigen tekst opslaan (geen boodschappen)</div>
                    </div>
                  )}
                </div>
                <button
                  className={`eatersbtn${eatersOverride != null ? " over" : ""}${isCustom ? " opacity-40" : ""}`}
                  title={isCustom ? t("Geen boodschappen voor deze dag") : t("Aantal eters deze dag")}
                  onClick={() => {
                    if (isCustom || !entry) return;
                    setEatersOpen(eatersOpen === key ? null : key);
                  }}
                >
                  👥{eatersOverride != null && <span className="ebadge">{eatersOverride}</span>}
                </button>
                {mealStatus[key] && (
                  <span className="shrink-0 text-sm" title={mealStatus[key].title}>
                    {mealStatus[key].icon}
                  </span>
                )}
                {isToday && (
                  <button
                    className="shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center bg-stone-100 text-stone-500"
                    title="Afwijking van het weekplan (geen/weinig energie vandaag)"
                    onClick={() => { setDeviationKey(key); setDevTab("instant"); setDevPick({}); }}
                  >
                    🪫
                  </button>
                )}
                <button
                  title={entry && entry.locked ? t("Ontgrendelen") : t("Vergrendelen")}
                  onClick={() => entry && setDay(i, { ...entry, locked: !entry.locked })}
                  className={`shrink-0 w-8 h-8 rounded-lg text-sm flex items-center justify-center ${entry && entry.locked ? "bg-amber-100 text-amber-700" : "bg-stone-100 text-stone-400"}`}
                >
                  {entry && entry.locked ? "🔒" : "🔓"}
                </button>
              </div>
              {openDay === key && entry && entry.locked && r && (
                <div className="mt-2 pt-2 border-t border-stone-100">
                  <div className="text-xs font-semibold text-stone-700 mb-1">Ingrediënten</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {(r.ingredients || []).filter(Boolean).map((ing, ii) => {
                      const p = typeof ing === "object" && ing && ing.pid ? prodById[ing.pid] : null;
                      return (
                        <button key={ii} type="button" className="prodchip" onClick={() => p && openProdCard("menu-" + key, p.id)}>
                          {ingLabel(ing, prodById)}
                        </button>
                      );
                    })}
                  </div>
                  {renderProductCard("menu-" + key)}
                  {dishImgs[entry.id] && (
                    <img src={dishImgs[entry.id]} alt={r.name} className="mb-2" style={{ width: "100%", maxHeight: "140px", objectFit: "cover", borderRadius: "0.75rem" }} />
                  )}
                  <div className="text-xs font-semibold text-stone-700 mb-1">Bereiding</div>
                  <div className="text-xs text-stone-600">{r.bereiding || "—"}</div>
                </div>
              )}
              {eatersOpen === key && entry && !isCustom && (
                <div className="mt-2 pt-2 border-t flex items-center gap-2 flex-wrap">
                  <div className="stepper">
                    <button onClick={() => setEaters(i, Math.max(1, effectiveEaters - 1))}>−</button>
                    <span>{effectiveEaters}</span>
                    <button onClick={() => setEaters(i, Math.min(99, effectiveEaters + 1))}>+</button>
                  </div>
                  <span className="text-xs text-stone-500">standaard: {settings.householdSize} eters</span>
                  <button className="text-xs text-emerald-700 font-semibold" onClick={() => setEaters(i, null)}>
                    Standaard herstellen
                  </button>
                  {factor !== 1 && (
                    <span className="text-[10px] text-stone-400 ml-auto">boodschappenlijst ×{fmtFactor(factor)} voor deze dag</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={() => setRulesSheetOpen(true)}
        className="w-full mt-4 py-2.5 border rounded-xl text-sm font-medium text-stone-600 bg-white shadow-sm"
      >
        ⚙️ Regels voor het weekmenu
      </button>
    </div>
  );


  const renderDateSheet = () => (
    <div>
      <div className="backdrop" onClick={() => setDateSheetOpen(false)} />
      <div className="sheet">
        <div className="handle" />
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Kies een datum</div>
            <button onClick={() => setDateSheetOpen(false)} className="text-stone-400 px-1 text-lg leading-none">✕</button>
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {days.map((d) => (
              <div key={d} className="text-[10px] text-stone-400 text-center font-medium">{d.slice(0, 2)}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-0.5 mb-3">
            {weekKeys.map((k) => (
              <div
                key={k}
                className={`flex flex-col items-center justify-center py-1.5 rounded-lg text-xs ${
                  k === todayKey ? "bg-emerald-600 text-white font-bold" : "bg-stone-100 text-stone-700 font-semibold"
                }`}
              >
                {Number(k.slice(8, 10))}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <button onClick={() => setWeekOffset((o) => o - 1)} className="px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white">
              ◀ Vorige week
            </button>
            <div className="text-xs font-semibold text-stone-600">{weekLabel}</div>
            <button onClick={() => setWeekOffset((o) => o + 1)} className="px-2 py-1.5 border rounded-lg text-xs text-stone-600 bg-white">
              Volgende week ▶
            </button>
          </div>
          {weekOffset !== 0 && (
            <button onClick={() => setWeekOffset(0)} className="w-full mb-2 py-1.5 border rounded-lg text-xs text-stone-500 bg-white">
              Naar deze week
            </button>
          )}
          <div className="text-sm font-medium mb-1">{monthNames()[calAnchor.getMonth()]} {calAnchor.getFullYear()}</div>
          <div className="grid grid-cols-7 gap-0.5 mb-0.5">
            {days.map((d) => (
              <div key={d} className="text-[10px] text-stone-400 text-center font-medium">{d.slice(0, 2)}</div>
            ))}
          </div>
          {calWeeks.map((row, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-0.5">
              {row.map((cell) => {
                const entry = menuByDate[cell.key];
                const r = entry && entry.id ? byId[entry.id] : null;
                const locked = !!(entry && entry.locked);
                const isToday = cell.key === todayKey;
                const inWeek = weekKeys.includes(cell.key);
                return (
                  <button
                    key={cell.key}
                    data-date={cell.key}
                    title={r ? r.name : ""}
                    onClick={() => setWeekOffset(weeksBetween(new Date(), cell.date, settings.weekStartDay))}
                    className={`flex flex-col items-center justify-center py-1 rounded-lg text-xs ${
                      isToday
                        ? "bg-emerald-600 text-white font-bold"
                        : inWeek
                          ? "bg-stone-100 font-semibold " + (cell.inMonth ? "text-stone-700" : "text-stone-300")
                          : cell.inMonth
                            ? "text-stone-700"
                            : "text-stone-300"
                    }`}
                  >
                    {cell.date.getDate()}
                    {locked && <span className="text-[10px]">🔒</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <p className="text-xs text-stone-400 mt-2">
            Klik op een dag om naar de week van die dag te springen. 🔒 = vergrendeld gerecht, blijft per datum bewaard.
          </p>
        </div>
      </div>
    </div>
  );

  // #42: afwijkings-sheet (🪫 op de dag van vandaag) — segmented afhaalmaaltijd / instant uit voorraad

  const renderDeviationSheet = () => {
    const k = deviationKey;
    if (!k) return null;
    const links = settings.takeawayLinks || [];
    const inst = instantProducts;
    const totalPicked = Object.values(devPick).reduce((a, b) => a + (Number(b) || 0), 0);
    return (
      <div>
        <div className="backdrop" onClick={() => setDeviationKey(null)} />
        <div className="sheet">
          <div className="handle" />
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm font-semibold">Afwijking · {dayShortOf(k)} {fmtDay(k)}</div>
              <button onClick={() => setDeviationKey(null)} className="text-stone-400 px-1 text-lg leading-none">✕</button>
            </div>
            <div className="segl mb-3">
              <button className={devTab === "instant" ? "on" : ""} onClick={() => setDevTab("instant")}>⚡ Instant uit voorraad</button>
              <button className={devTab === "afhaal" ? "on" : ""} onClick={() => setDevTab("afhaal")}>🍔 Afhaalmaaltijd</button>
            </div>
            {devTab === "instant" ? (
              <div>
                <div className="text-xs text-stone-500 mb-1 flex items-center gap-1">
                  <span>Kies uit de voorraad</span>
                  <span title="Alleen producten met tag “instant-maaltijd” met have > 0 worden getoond.">ℹ️</span>
                </div>
                {inst.length === 0 && (
                  <div className="text-xs text-stone-400 py-2">Nog geen producten met tag “instant-maaltijd” met have &gt; 0 — tag toekennen via de product-kaart.</div>
                )}
                {inst.map((p2) => {
                  const have = haveOfProd(p2);
                  const n = Number(devPick[p2.id]) || 0;
                  return (
                    <div key={p2.id} className="flex items-center gap-2 py-1.5">
                      <span className="flex-1 min-w-0 text-sm truncate">{p2.name}</span>
                      <span className="text-xs text-stone-400 shrink-0">have {have}</span>
                      <div className="stepper">
                        <button onClick={() => setDevPick((d) => ({ ...d, [p2.id]: Math.max(0, n - 1) }))}>−</button>
                        <span>{n}</span>
                        <button onClick={() => setDevPick((d) => ({ ...d, [p2.id]: Math.min(have, n + 1) }))}>+</button>
                      </div>
                    </div>
                  );
                })}
                <button
                  className="w-full mt-3 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold disabled:opacity-40"
                  disabled={totalPicked === 0}
                  onClick={() => {
                    const parts = inst.filter((p2) => Number(devPick[p2.id]) > 0).map((p2) => `${devPick[p2.id]}× ${p2.name}`);
                    applyDeviation(k, t("Instant-maaltijd: {lijst}", { lijst: parts.join(", ") }), devPick);
                    setDeviationKey(null);
                  }}
                >
                  Bevestig · weekplan schuift 1 dag op
                </button>
              </div>
            ) : (
              <div>
                <div className="text-xs text-stone-500 mb-1">Kies een bestelsite (opent in browser; te beheren via Instellingen → 🛵 Afhaalmaaltijden):</div>
                {links.length === 0 && (
                  <div className="text-xs text-stone-400 py-2">Nog geen bestelsites geconfigureerd — voeg toe via Instellingen → 🛵 Afhaalmaaltijden.</div>
                )}
                {links.map((l) => (
                  <button
                    key={l.id}
                    className="w-full flex items-center gap-2 border rounded-xl px-3 py-2 mb-2 text-left"
                    onClick={() => {
                      const url = safeExternalUrl(l.url);
                      if (url && typeof window !== "undefined" && window.open) window.open(url, "_blank", "noopener");
                      applyDeviation(k, t("Afhaalmaaltijd"), null);
                      setDeviationKey(null);
                    }}
                  >
                    <span className="flex-1 min-w-0 text-sm text-emerald-700 font-medium truncate">{l.label}</span>
                    <span className="text-xs text-stone-400 shrink-0 max-w-40 truncate">{l.url}</span>
                    <span className="shrink-0">↗</span>
                  </button>
                ))}
                <button
                  className="w-full mt-1 py-2.5 rounded-xl bg-stone-800 text-white text-sm font-semibold"
                  onClick={() => { applyDeviation(k, t("Afhaalmaaltijd"), null); setDeviationKey(null); }}
                >
                  Afhaalmaaltijd · weekplan schuift 1 dag op
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };


  const renderRulesSheet = () => (
    <div>
      <div className="backdrop" onClick={() => setRulesSheetOpen(false)} />
      <div className="sheet">
        <div className="handle" />
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Regels voor het weekmenu</div>
            <button onClick={() => setRulesSheetOpen(false)} className="text-stone-400 px-1 text-lg leading-none">✕</button>
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-stone-500 mb-1">Weekstart</div>
            <div className="flex flex-wrap gap-1">
              {dayNames().map((d, i) => (
                <button
                  key={d}
                  onClick={() => updateSettings({ weekStartDay: i })}
                  className={`chip${settings.weekStartDay === i ? " on" : ""}`}
                >
                  {d.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-stone-500 mb-1">Visdagen</div>
            <div className="flex flex-wrap gap-1">
              {days.map((d, i) => (
                <button
                  key={d}
                  onClick={() =>
                    updateSettings({
                      fishDays: fishDays.includes(i) ? fishDays.filter((x) => x !== i) : [...fishDays, i].sort((a, b) => a - b),
                    })
                  }
                  className={`chip fish${fishDays.includes(i) ? " on" : ""}`}
                >
                  {d.slice(0, 2)}
                </button>
              ))}
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-stone-500 mb-1">Vega-dagen op de overige {otherDays.length} dagen</div>
            <div className="flex items-center gap-3">
              <div className="stepper">
                <button onClick={() => updateSettings({ vegaTarget: Math.max(0, vegaCount - 1) })}>−</button>
                <span>{vegaCount}</span>
                <button onClick={() => updateSettings({ vegaTarget: Math.min(otherDays.length, vegaCount + 1) })}>+</button>
              </div>
              <div className="text-xs text-stone-600">
                {vegaCount} vega · {otherDays.length - vegaCount} vlees
              </div>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-stone-500 mb-1">Tag-regels (bij automatisch plannen)</div>
            {(settings.tagRules || []).length === 0 && <div className="text-xs text-stone-400 mb-1">nog geen tag-regels</div>}
            {(settings.tagRules || []).map((rule, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="chip">{rule.kind === "product" ? "🏷️" : "🍽️"} {rule.tag}</span>
                <div className="stepctrl">
                  <button onClick={() => setTagRuleDays(i, rule.days - 1)} disabled={rule.days <= 0}>−</button>
                  <span>{rule.days}</span>
                  <button onClick={() => setTagRuleDays(i, rule.days + 1)} disabled={rule.days >= 30}>+</button>
                </div>
                <span className="text-xs text-stone-500 shrink-0">dagen</span>
                <button className="ml-auto text-stone-300 hover:text-red-500 text-sm" onClick={() => removeTagRule(i)} title="Regel verwijderen">
                  ✕
                </button>
              </div>
            ))}
            <div className="flex items-center gap-1.5 mt-2">
              <select
                className="border rounded-lg px-1.5 py-1.5 text-xs text-stone-600 shrink-0"
                value={ruleDraft.kind}
                onChange={(e) => setRuleDraft({ ...ruleDraft, kind: e.target.value })}
              >
                <option value="product">🏷️ product</option>
                <option value="recipe">🍽️ gerecht</option>
              </select>
              <input
                className="w-full min-w-0 border rounded-lg px-2 py-1.5 text-xs"
                value={ruleDraft.tag}
                placeholder="tag…"
                list="tagrules-tags"
                onChange={(e) => setRuleDraft({ ...ruleDraft, tag: e.target.value })}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTagRule(); } }}
              />
              <datalist id="tagrules-tags">
                {allRuleTags.map((t) => (<option key={t} value={t} />))}
              </datalist>
              <div className="stepctrl shrink-0">
                <button onClick={() => setRuleDraft({ ...ruleDraft, days: Math.max(0, ruleDraft.days - 1) })}>−</button>
                <span>{ruleDraft.days}</span>
                <button onClick={() => setRuleDraft({ ...ruleDraft, days: Math.min(30, ruleDraft.days + 1) })}>+</button>
              </div>
              <button className="px-2.5 py-1.5 border rounded-lg text-xs text-stone-600 bg-white shrink-0" onClick={addTagRule} title="Regel toevoegen">
                ＋
              </button>
            </div>
          </div>
          <div className="mb-3">
            <div className="text-xs font-medium text-stone-500 mb-1">Hetzelfde gerecht opnieuw plannen na</div>
            <div className="segl">
              {[[0, t("altijd")], [3, t("3 dagen")], [7, t("7 dagen")], [14, t("14 dagen")], [30, t("30 dagen")]].map(([v, label]) => (
                <button
                  key={v}
                  className={Math.min(30, Math.max(0, Number(settings.dishRepeatDays) || 0)) === v ? "on" : ""}
                  onClick={() => updateSettings({ dishRepeatDays: v })}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setRulesSheetOpen(false); setTab("settings"); }}
            className="block text-xs text-emerald-700 font-medium mb-3"
          >
            Eters &amp; supermarkten → Instellingen
          </button>
          <button onClick={() => setRulesSheetOpen(false)} className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium">
            Klaar
          </button>
        </div>
      </div>
    </div>
  );


  return { renderMenuTab, renderDateSheet, renderDeviationSheet, renderRulesSheet };
}
