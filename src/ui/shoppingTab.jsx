// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
import React from "react";
import { createSharedViews, makeInfoBtn } from "./components.jsx";
import { matchProducts } from "../domain/catalog.js";
import { dayShortOf, fmtDay } from "../domain/dates.js";
import { highlightMatch } from "./components.jsx";
import { t } from "../i18n/index.js";

export function createShoppingTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { addCat, addExtraRowFn, anyScaled, catsOpen, checked, doneItems, extraItems, extraSuggest, infoOpen, listRows, marketChip, markets, maxShopDays, mealOk, mealWarn, moveCat, newCat, newExtra, openProdCard, processChecked, products, removeCat, scaledFactors, setCatsOpen, setChecked, setExtraItems, setExtraSuggest, setHiddenChecked, setInfoOpen, setNewCat, setNewExtra, setShopDays, setShopDone, setShopInfoOpen, setShopMarkets, setShowChecked, settings, shopCats, shopDaysEff, shopDone, shopInfoOpen, shopMarketsEff, showChecked, stock, todayLabel, totalItems, unfilteredCount, visibleRows } = ctx;
  const infoBtn = makeInfoBtn(infoOpen, setInfoOpen);

  const renderShoppingTab = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-stone-700">{`Boodschappenlijst · ${todayLabel}`}</span>
        <span className="flex gap-1.5 relative">
          <button className={`iconbtn${shopInfoOpen ? " on" : ""}`} title="Hoe werkt de boodschappenlijst?" onClick={() => setShopInfoOpen((v) => !v)}>ℹ️</button>
          <button className={`iconbtn${catsOpen ? " on" : ""}`} title="Categorieën beheren" onClick={() => setCatsOpen((v) => !v)}>⚙️</button>
          {shopInfoOpen && (
            <div className="pop">
              <b>Hoe werkt de boodschappenlijst?</b>
              <ul>
                <li>Bovenaan kies je voor hoeveel dagen je boodschappen doet en bij welke supermarkt(en). Artikelen met een winkelvoorkeur voor een andere supermarkt zie je niet.</li>
                <li>De lijst is één platte lijst op categorie-volgorde (zie ⚙️) — ingrediënt, voorraad of extra artikel maakt niet uit.</li>
                <li>Afvinken maar. "Verwerk update" verwerkt de afgevinkte artikelen (voorraad wordt bijgewerkt, rijen verborgen) en toont per gerecht in het weekmenu of alles in huis is; "Vinkjes wissen" zet alles terug.</li>
                <li>Bij groente/zuivel zie je de datum waarop het nodig is (beperkt houdbaar). Tekorten uit de voorraad ("n van want") staan automatisch in de lijst.</li>
              </ul>
            </div>
          )}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="stepper">
          <button onClick={() => setShopDays(Math.max(0, shopDaysEff - 1))} disabled={shopDaysEff <= 0}>−</button>
          <span>{shopDaysEff}</span>
          <button onClick={() => setShopDays(Math.min(maxShopDays, shopDaysEff + 1))} disabled={shopDaysEff >= maxShopDays}>+</button>
        </div>
        <span className="text-xs text-stone-500 shrink-0">dagen</span>
        <div className="flex gap-1 ml-auto overflow-x-auto">
          {markets.map((m) => (
            <button
              key={m.key}
              className={`chip${shopMarketsEff.includes(m.key) ? " on" : ""}`}
              title={m.label}
              onClick={() =>
                setShopMarkets(
                  shopMarketsEff.includes(m.key) ? shopMarketsEff.filter((x) => x !== m.key) : [...shopMarketsEff, m.key]
                )
              }
            >
              {marketChip(m.key)}
            </button>
          ))}
        </div>
      </div>

      {catsOpen && (
        <div className="bg-white rounded-xl shadow-sm p-3 mb-4">
          <div className="text-sm font-semibold mb-1 flex items-center gap-1.5">
            Categorieën
            {infoBtn("cats", t("De volgorde is de volgorde op de boodschappenlijst. Een categorie zegt waar een artikel in de supermarkt ligt — tortilla en kroepoek horen daarom bij “(maaltijd)saus”."))}
          </div>
          <div className="divide-y divide-stone-100 border border-stone-100 rounded-xl">
            {shopCats.map((c, i) => {
              const used = stock.some((s) => s.cat === c) || extraItems.some((x) => x.cat === c);
              return (
                <div key={c} className="flex items-center gap-2 px-2 py-1.5">
                  <span className="flex flex-col leading-none shrink-0">
                    <button className="text-[9px] text-stone-400 hover:text-stone-700" disabled={i === 0} onClick={() => moveCat(i, -1)}>▲</button>
                    <button className="text-[9px] text-stone-400 hover:text-stone-700" disabled={i === shopCats.length - 1} onClick={() => moveCat(i, 1)}>▼</button>
                  </span>
                  <span className="flex-1 text-sm min-w-0 truncate">{c}</span>
                  <button
                    className={`text-sm ${used ? "text-stone-300" : "text-stone-300 hover:text-red-500"}`}
                    disabled={used}
                    title={used ? t("Verwijderen kan pas als er geen producten/artikelen meer in deze categorie zitten") : t("Categorie verwijderen")}
                    onClick={() => removeCat(c)}
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              placeholder="Nieuwe categorie…"
              autoCapitalize="none"
              className="flex-1 border rounded-lg px-2 py-1.5 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCat();
                }
              }}
            />
            <button className="px-3 border rounded-lg text-sm text-stone-600 bg-white" onClick={addCat}>＋</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm mb-4">
        <div className="flex items-center gap-2 px-3 py-2 bg-stone-50">
          <span className="grow suggest-wrap" style={{ flex: 1.4 }}>
            <input
              className="w-full border rounded-lg px-2 py-1.5 text-sm"
              value={newExtra.name}
              placeholder="Productnaam…"
              onChange={(e) => { setNewExtra({ ...newExtra, name: e.target.value }); setExtraSuggest(e.target.value.trim().length >= 2); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addExtraRowFn(); } }}
            />
            {extraSuggest && newExtra.name.trim().length >= 2 && (
              <div className="suggest-list">
                {matchProducts(products, newExtra.name.trim().toLowerCase()).map((s2) => (
                  <div key={s2.id} className="suggest-item" onMouseDown={(e) => { e.preventDefault(); setNewExtra({ ...newExtra, name: s2.name }); setExtraSuggest(false); }}>
                    <span>{highlightMatch(s2.name, newExtra.name.trim().toLowerCase())}</span>
                    <span className="text-[10px] text-stone-400 shrink-0">{s2.cat}{s2.unit ? ` · ${s2.unit}` : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </span>
          <input
            className="qty"
            style={{ width: "2.6rem" }}
            value={newExtra.amount || ""}
            title="Aantal"
            onChange={(e) => setNewExtra({ ...newExtra, amount: e.target.value === "" ? 0 : Number(String(e.target.value).replace(",", ".")) })}
          />
          <button className="bg-stone-800 text-white px-3 py-2 rounded-lg text-sm font-medium shrink-0" disabled={!newExtra.name.trim()} onClick={addExtraRowFn}>
            Toevoegen
          </button>
        </div>
      </div>

      {listRows.length === 0 && unfilteredCount > 0 && (
        <div className="text-center text-stone-400 text-sm py-10 bg-white rounded-xl shadow-sm">
          {t("Niets te halen bij {winkels}", { winkels: shopMarketsEff.map((k) => marketChip(k)).join(", ") || t("de geselecteerde supermarkt") })}
          <div className="text-xs mt-1">alle artikelen hebben een winkelvoorkeur voor een andere supermarkt</div>
          <button className="chip on mt-2" onClick={() => setShopMarkets(markets.map((m) => m.key))}>
            Toon alle supermarkten
          </button>
        </div>
      )}
      {listRows.length === 0 && unfilteredCount === 0 && (
        <div className="text-center text-stone-400 text-sm py-10">
          Stel eerst een weekmenu samen; de ingrediënten verschijnen dan hier automatisch.
        </div>
      )}

      {listRows.length > 0 && doneItems > 0 && (
        <div className="mb-2">
          <button className="chip" onClick={() => setShowChecked((v) => !v)}>
            {t("{n} afgevinkt · {actie} ▾", { n: doneItems, actie: showChecked ? t("verberg") : t("toon") })}
          </button>
        </div>
      )}

      {listRows.length > 0 && visibleRows.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm text-center text-stone-400 text-sm py-8">
          Alles afgevinkt — toon de rijen met de chip hierboven.
        </div>
      )}

      {visibleRows.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm divide-y divide-stone-100">
          {visibleRows.map((r) => {
            const keys = r.keys || [r.key];
            const isChecked = keys.every((k) => checked[k]);
            const showDate = r.dayKeys && r.dayKeys.length > 0 && (r.cat === "groente" || r.cat === "zuivel" || r.src === "noing");
            return (
              <div key={r.key}>
                <label className="flex items-center gap-3 px-3 py-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setChecked({ ...checked, ...Object.fromEntries(keys.map((k) => [k, e.target.checked])) })}
                    className="w-4 h-4 accent-emerald-600"
                  />
                  <span className={`text-sm ${isChecked ? "line-through text-stone-300" : ""}`}>
                    {r.origLabel ? (
                      <span>
                        <span className="line-through text-stone-300">{r.origLabel}</span>
                        {" → "}
                        <span className="font-semibold">{r.label}</span>
                      </span>
                    ) : r.pid ? (
                      <button type="button" className="prodlink" onClick={() => openProdCard(r.key, r.pid)}>{r.label}</button>
                    ) : (
                      r.label
                    )}
                    {r.note && <span className="text-stone-400">{` ${r.note}`}</span>}
                    {showDate && r.dayKeys.map((dk, i) => (
                      <span key={dk} className={`datechip${i === r.dayKeys.length - 1 ? " last" : ""}`}>{`${dayShortOf(dk)} ${fmtDay(dk)}`}</span>
                    ))}
                  </span>
                  {r.mkt && (
                    <span className="ml-auto chip mkt" title="Winkelvoorkeur: dit artikel wordt daar gehaald">
                      {marketChip(r.mkt)}
                    </span>
                  )}
                  {r.src === "extra" && keys.length === 1 && (
                    <button
                      onClick={() => setExtraItems(extraItems.filter((x) => x.name !== r.name))}
                      className="text-stone-300 hover:text-red-500 text-sm"
                      title="Artikel verwijderen"
                    >
                      ✕
                    </button>
                  )}
                </label>
                {renderProductCard(r.key)}
              </div>
            );
          })}
        </div>
      )}

      {anyScaled && (
        <p className="text-[10px] text-stone-400 mt-1">
          {t("Hoeveelheden geschaald voor afwijkende eters (×{f} t.o.v. standaard {n} eters); regels zonder getal blijven gelijk.", { f: scaledFactors.join(", "), n: settings.householdSize })}
        </p>
      )}

      {totalItems > 0 && (
        <div className="mt-4">
          <div className="flex gap-2">
            <button
              onClick={processChecked}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              Verwerk update
            </button>
            <button
              onClick={() => {
                setChecked({});
                setShopDone(false);
                setHiddenChecked(false);
                setShowChecked(false);
              }}
              className="py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white"
            >
              Vinkjes wissen
            </button>
          </div>
          {shopDone && (
            <div className="text-xs text-stone-500 mt-2 text-center">
              {mealOk + mealWarn > 0
                ? t("✅ {ok} gerechten compleet{rest} — zie weekmenu (lijst blijft afvinkbaar)", { ok: mealOk, rest: mealWarn > 0 ? t(" · ❗ {w} mist nog iets", { w: mealWarn }) : "" })
                : t("Nog niets afgevinkt — vink de gehaalde artikelen af.")}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Delen via bestand (ADR-019): deelsheet (export/uitleg) + import-rapport + toast

  return { renderShoppingTab };
}
