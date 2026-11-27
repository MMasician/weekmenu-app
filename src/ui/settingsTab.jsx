// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
import React from "react";
import { createSharedViews } from "./components.jsx";
import { LANGUAGES, dayNames, t } from "../i18n/index.js";
import { THEMES } from "../domain/settings.js";

export function createSettingsTab(ctx) {
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
      <div>
        {delenOpen && (
          <div>
            <div className="backdrop" onClick={() => setDelenOpen(null)}></div>
            <div className="sheet">
              <div className="handle"></div>
              <div className="px-4 pb-4">
                <div className="flex items-center mb-3">
                  <span className="text-lg font-bold">{delenOpen === "info" ? "Delen: hoe werkt het?" : "Delen via bestand"}</span>
                  <button className="ml-auto text-stone-400" onClick={() => setDelenOpen(null)}>✕</button>
                </div>
                {delenOpen === "export" ? (
                  <div>
                    <div className="text-xs text-stone-500 mb-1">Wat gaat er mee? (tik om aan/uit te zetten)</div>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {chipDefs.map(([k, label]) => (
                        <button
                          key={k}
                          className={"chip" + (deelChips[k] ? " on" : "")}
                          onClick={() => setDeelChips((c) => ({ ...c, [k]: !c[k] }))}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <button className="w-full bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium mb-2" onClick={exportShare}>
                      📤 Maak deelbestand
                    </button>
                    <div className="text-xs text-stone-400">Bestandsnaam: weekmenu-delen-v1-….json — daarna deel je het bestand zelf (WhatsApp, e-mail, AirDrop). Buiten het huishouden delen? Zet dan alles uit behalve Recepten.</div>
                  </div>
                ) : (
                  <div className="text-xs text-stone-600 leading-relaxed">
                    <div className="mb-2">📤 maakt een bestand met jouw data. 📥 leest zo’n bestand in en voegt het samen met wat hier al staat.</div>
                    <div className="mb-2">Samenvoegen gebeurt automatisch ("nieuwste wint" per onderdeel). Vooraf zie je een rapport van wat er verandert; iets dat niet klopt, kun je daarna zelf herstellen.</div>
                    <div>Recepten, producten, voorraad en weekmenu zijn los te kiezen. Vinkjes, verwijderingen en instellingen horen bij elkaar en gaan samen als één chip mee.</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        {importReview && (
          <div>
            <div className="backdrop" onClick={() => setImportReview(null)}></div>
            <div className="sheet">
              <div className="handle"></div>
              <div className="px-4 pb-4">
                <div className="flex items-center mb-3">
                  <span className="text-lg font-bold">Bestand overnemen</span>
                  <button className="ml-auto text-stone-400" onClick={() => setImportReview(null)}>✕</button>
                </div>
                <div className="text-xs text-stone-500 mb-2">📄 {importReview.fileName}</div>
                <div className="text-sm mb-2">Dit verandert er als je samenvoegt:</div>
                <div className="text-xs leading-relaxed mb-3">
                  {deelRapportLines(importReview).length === 0 && <div>➖ Niets nieuws in dit bestand.</div>}
                  {deelRapportLines(importReview).map((l) => (
                    <div key={l.lbl}>{l.active ? "✅" : "➖"} {l.lbl}: {l.parts.join(" · ")}</div>
                  ))}
                </div>
                {importReview.merge.rapport.conflicts.length > 0 && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-2 text-xs mb-3">
                    <div className="font-medium text-amber-800 mb-1">
                      ⚠️ {importReview.merge.rapport.conflicts.length}× nieuwste wint — zo nodig hierna zelf herstellen:
                    </div>
                    {importReview.merge.rapport.conflicts.slice(0, 8).map((cf, i) => (
                      <div key={i} className="text-amber-900">{cf.naam.split(" (")[0]}: hier "{cf.hier}" → uit bestand "{cf.daar}"</div>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  <button className="flex-1 rounded-xl border border-stone-300 py-2.5 text-sm" onClick={() => setImportReview(null)}>Annuleren</button>
                  <button className="flex-1 bg-stone-800 text-white rounded-xl py-2.5 text-sm font-medium" onClick={applyImportReview}>Samenvoegen</button>
                </div>
              </div>
            </div>
          </div>
        )}
        {shareToast !== "" && (
          <div className="toast" onClick={() => setShareToast("")}>{shareToast}</div>
        )}
      </div>
    );
  };

  const renderSettingsTab = () => (
    <div>
      <div className="mb-2 text-xs text-stone-500">
        Instellingen per huishouden. Ze worden alleen lokaal op dit toestel bewaard (localStorage) en gelden direct voor het weekmenu en de boodschappenlijst. Dagindex 0 is de weekstart ({days[0]}).
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-1">Weergave</div>
        <div className="text-xs text-stone-500 mb-2">Thema van de app — lokaal opgeslagen per huishouden (#40).</div>
        {THEMES.map((th) => (
          <label key={th.key} className="flex items-center gap-2 py-1.5 cursor-pointer text-sm" title={t("Thema {thema}", { thema: t(th.label) })}>
            <input
              type="radio"
              name="theme"
              checked={settings.theme === th.key}
              onChange={() => updateSettings({ theme: th.key })}
              className="accent-emerald-600"
            />
            <span className={settings.theme === th.key ? "font-semibold" : "text-stone-600"}>{t(th.label)}</span>
            <span className="ml-auto flex gap-1">
              {th.dots.map((dot, di) => (
                <span key={di} className="inline-block w-4 h-4 rounded-full border border-stone-300" style={{ background: dot }} />
              ))}
            </span>
          </label>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-1">Taal</div>
        <div className="text-xs text-stone-500 mb-2">Taal van de app (GUI) — lokaal opgeslagen per huishouden (ADR-023).</div>
        {LANGUAGES.map((ln) => (
          <label key={ln.code} className="flex items-center gap-2 py-1.5 cursor-pointer text-sm" title={t("Taal {taal}", { taal: ln.label })}>
            <input
              type="radio"
              name="language"
              checked={settings.language === ln.code}
              onChange={() => updateSettings({ language: ln.code })}
              className="accent-emerald-600"
            />
            <span className={settings.language === ln.code ? "font-semibold" : "text-stone-600"}>{ln.label}</span>
            <span className="ml-auto text-xs text-stone-400">{ln.code}</span>
          </label>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-2">Huishouden</div>
        <label className="flex items-center justify-between gap-2 text-sm mb-2">
          <span className="text-stone-600">Aantal eters</span>
          <input
            type="number"
            min="1"
            value={settings.householdSize}
            onChange={(e) => updateSettings({ householdSize: Math.max(1, Number(e.target.value) || 1) })}
            className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </label>
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="text-stone-600">Week start op</span>
          <select
            value={settings.weekStartDay}
            onChange={(e) => updateSettings({ weekStartDay: Number(e.target.value) })}
            className="border rounded-lg px-2 py-1.5 text-sm text-stone-600"
          >
            {dayNames().map((d, i) => (
              <option key={d} value={i}>{d}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-2">Eetpatroon</div>
        <div className="text-xs text-stone-500 mb-2">Vis-dagen:</div>
        <div className="flex flex-wrap gap-2 mb-3">
          {days.map((d, i) => (
            <label key={i} className="flex items-center gap-1 text-xs border rounded-lg px-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={fishDays.includes(i)}
                onChange={(e) =>
                  updateSettings({ fishDays: e.target.checked ? [...fishDays, i] : fishDays.filter((x) => x !== i) })
                }
                className="accent-emerald-600"
              />
              {d}
            </label>
          ))}
        </div>
        <label className="flex items-center justify-between gap-2 text-sm">
          <span className="text-stone-600">Aantal vega-dagen (op niet-vis-dagen)</span>
          <input
            type="number"
            min="0"
            max="7"
            value={settings.vegaTarget}
            onChange={(e) => updateSettings({ vegaTarget: Math.max(0, Number(e.target.value) || 0) })}
            className="w-20 border rounded-lg px-2 py-1.5 text-sm text-center"
          />
        </label>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-2">Supermarkten</div>
        {markets.map((m, mi) => (
          <div key={mi} className="flex gap-2 mb-2">
            <input
              value={m.key}
              onChange={(e) => updateMarket(mi, { key: e.target.value })}
              placeholder="sleutel…"
              className="w-20 border rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              value={m.label}
              onChange={(e) => updateMarket(mi, { label: e.target.value })}
              placeholder="Naam…"
              className="flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0"
            />
            <label
              className="flex items-center gap-1 text-[10px] text-stone-500 shrink-0 cursor-pointer"
              title="Standaard geselecteerd op de boodschappenlijst"
            >
              <input
                type="checkbox"
                checked={m.defaultShop !== false}
                onChange={(e) => updateMarket(mi, { defaultShop: e.target.checked })}
                className="accent-emerald-600"
              />
              standaard
            </label>
            <button
              onClick={() => updateSettings({ markets: markets.filter((_, j) => j !== mi) })}
              className="text-stone-300 hover:text-red-500 text-sm px-1"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => updateSettings({ markets: [...markets, { key: "winkel" + (markets.length + 1), label: "Nieuwe winkel", defaultShop: true }] })}
          className="w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white"
        >
          + Supermarkt toevoegen
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="flex items-center gap-2">
          <button className="iconbtn" title="Deelbestand maken (exporteren)" onClick={() => setDelenOpen("export")}>📤</button>
          <label className="iconbtn cursor-pointer" title="Bestand overnemen (importeren)">
            📥
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => { if (e.target.files && e.target.files[0]) importShareFile(e.target.files[0]); e.target.value = ""; }}
            />
          </label>
          <button className="iconbtn" title="Uitleg over delen via bestand" onClick={() => setDelenOpen("info")}>ℹ️</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <div className="text-sm font-medium mb-1">🛵 Afhaalmaaltijden (bestelsites)</div>
        <div className="text-xs text-stone-500 mb-2">Deze linkjes verschijnen bij “Afwijking van het weekplan” → afhaalmaaltijd (#42). Alleen lokaal opgeslagen (ADR-010).</div>
        {(settings.takeawayLinks || []).map((l, i) => (
          <div key={l.id} className="flex gap-2 mb-2">
            <input
              value={l.label}
              onChange={(e) => updateTakeawayLink(i, { label: e.target.value })}
              placeholder="Naam…"
              className="w-32 border rounded-lg px-2 py-1.5 text-sm"
            />
            <input
              value={l.url}
              onChange={(e) => updateTakeawayLink(i, { url: e.target.value })}
              placeholder="URL…"
              className="flex-1 border rounded-lg px-2 py-1.5 text-sm min-w-0"
            />
            <button
              onClick={() => updateSettings({ takeawayLinks: (settings.takeawayLinks || []).filter((_, j) => j !== i) })}
              className="text-stone-300 hover:text-red-500 text-sm px-1"
              title="Bestelsite verwijderen"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => updateSettings({ takeawayLinks: [...(settings.takeawayLinks || []), { id: "tl-" + Date.now().toString(36), label: "Nieuwe bestelsite", url: "" }] })}
          className="w-full py-2 border rounded-xl text-sm text-stone-500 hover:bg-white"
        >
          + Bestelsite toevoegen
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 mb-4">
        <button type="button" className="w-full flex items-center gap-2 text-left" onClick={() => setCatOpen((o) => !o)} title="Productcatalogus in-/uitklappen (#44)">
          <span className="text-sm font-medium">📦 Productcatalogus</span>
          <span className="text-xs text-stone-400">{products.length}</span>
          <span className="ml-auto text-xs text-stone-400">{catOpen ? "▾" : "▸"}</span>
        </button>
        {catOpen && (
        <div>
        <div className="text-xs text-stone-500 mb-2">{`Elk ingrediënt, voorraadproduct en extra artikel is hier een product met categorie, eenheid en optionele winkelvoorkeur. Klik op een naam om te wijzigen; ✕ verwijdert het product uit de catalogus (koppelingen vallen terug op vrije tekst — handig bij typefouten).`}</div>
        {pnDupGroups.length > 0 && (
          <div className="border border-amber-200 bg-amber-50 rounded-xl px-3 py-2 mb-2 text-xs">
            <div className="font-semibold mb-1">{pnDupGroups.length} duplicaatgroep(en) gevonden</div>
            {pnDupGroups.map((g) => (
              <div key={g[0].id} className="flex items-center gap-2 py-0.5">
                <span className="flex-1 min-w-0 truncate">{g.map((p) => p.name).join(" \u00b7 ")}</span>
                <button type="button" className="chip" onClick={() => openMergeGroup(g)}>Samenvoegen\u2026</button>
              </div>
            ))}
          </div>
        )}
        <div className="searchbar" style={{ boxShadow: "none" }}>
          <span className="sicon">🔍</span>
          <input className="recipe-search" value={prodQuery} placeholder="Zoek product…" onChange={(e) => setProdQuery(e.target.value)} />
          {prodQuery !== "" && (
            <button className="sicon" title="Zoekopdracht wissen" onClick={() => setProdQuery("")}>✕</button>
          )}
        </div>
        <div className="filterrow">
          {shopCats.map((c) => (
            <button
              key={c}
              type="button"
              className={`chip${catFilters.includes(c) ? " on" : ""}`}
              onClick={() => setCatFilters((f) => (f.includes(c) ? f.filter((x) => x !== c) : [...f, c]))}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl mt-2">
          {filteredProducts.map((p) => (
            <div key={p.id}>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="flex-1 min-w-0 text-sm">
                  <button type="button" className="prodlink" onClick={() => openProdCard("cat-" + p.id, p.id)}>{p.name}</button>
                </span>
                <span className="chip">{p.cat}</span>
                {p.unit && <span className="chip" title="Standaardeenheid">{p.unit}</span>}
                {pnBadgeMap[p.id] ? <span className="chip" title="Aantal duplicaten in de catalogus \u2014 samenvoegen via de melding hierboven">\u00d7{pnBadgeMap[p.id]}</span> : null}
                {p.market && <span className="chip mkt" title="Winkelvoorkeur">{marketChip(p.market)}</span>}
                <span className="text-xs text-stone-400 shrink-0" title="Aantal keer gebruikt">{usageCount(p.id)}×</span>
                <button className="delbtn" title="Uit catalogus verwijderen (koppelingen vallen terug op vrije tekst)" onClick={() => deleteProductCatalog(p.id)}>✕</button>
              </div>
              {renderProductCard("cat-" + p.id)}
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="px-3 py-3 text-sm text-stone-400 text-center">Geen producten gevonden.</div>
          )}
        </div>
        <div className="text-xs text-stone-400 mt-1">{filteredProducts.length} van {products.length} producten · A–Z</div>
        </div>
        )}
      </div>
    </div>
  );

  // issue #59: merge-sheet (kanjer kiezen + bevestigen)
  const renderMergeSheet = () => (
    <div>
      <div className="backdrop" onClick={() => setMergeGroup(null)} />
      <div className="sheet">
        <div className="handle" />
        <div className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Producten samenvoegen (#59)</div>
            <button onClick={() => setMergeGroup(null)} className="text-stone-400 px-1 text-lg leading-none">\u2715</button>
          </div>
          <div className="text-xs text-stone-500 mb-2">Kies de kanjer (het product dat behouden blijft). Recept-koppelingen gaan over naar de kanjer; varianten uit de benaming worden als per-recept tag voorgesteld.</div>
          {mergeGroup && mergeGroup.map((p) => (
            <label key={p.id} className="flex items-center gap-2 py-1 text-sm">
              <input type="radio" name="kanjer" checked={mergeKanjerId === p.id} onChange={() => setMergeKanjerId(p.id)} />
              <span className="flex-1 min-w-0 truncate">{p.name}</span>
              <span className="text-xs text-stone-400">{usageCount(p.id)}\u00d7</span>
            </label>
          ))}
          <div className="flex gap-2 mt-3">
            <button className="btn-primary flex-1" onClick={doMerge} disabled={!mergeKanjerId}>Samenvoegen</button>
            <button className="btn-ghost" onClick={() => setMergeGroup(null)}>Annuleren</button>
          </div>
        </div>
      </div>
    </div>
  );


  return { renderDelenSheets, renderSettingsTab, renderMergeSheet };
}
