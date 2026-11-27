// Gegenereerd uit de tab-renderfuncties; plain-functie-aanroepen (geen <Component/>),
// zodat de test-harness de boom kan uitvouwen. Alle hooks zitten in state/store.js.
import React from "react";
import { createSharedViews } from "./components.jsx";
import { matchProducts } from "../domain/catalog.js";
import { DEFAULT_LOCATIONS, defaultStock } from "../domain/stock.js";
import { highlightMatch } from "./components.jsx";
import { t } from "../i18n/index.js";

export function createStockTab(ctx) {
  const { renderProductCard } = createSharedViews(ctx);
  const { addLocOpen, addLocation, addProdRow, addProductRow, bumpHave, bumpWant, deleteLocation, deleteProduct, editLoc, marketChip, newLocName, newProdRow, openLocs, openProdCard, prodById, prodRowSuggest, products, productsOf, setAddLocOpen, setAddProdRow, setEditLoc, setNewLocName, setNewProdRow, setProdRowSuggest, setStock, setStockInfoOpen, setStockLocations, stock, stockInfoOpen, stockLocations, toggleLoc } = ctx;

  const renderStockTab = () => (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-stone-700">Locaties</span>
        <span className="relative">
          <button
            className={`iconbtn${stockInfoOpen ? " on" : ""}`}
            title="Hoe werkt de voorraad?"
            onClick={() => setStockInfoOpen((v) => !v)}
          >
            ℹ️
          </button>
          {stockInfoOpen && (
            <div className="pop">
              <b>Hoe werkt de voorraad?</b>
              <ul>
                <li>Locaties (voorraadkast, koelkast…) zijn per huishouden: voeg toe met ＋ onderaan, verwijder met 🗑️ — pas als er geen producten meer aan hangen.</li>
                <li>Klik op een locatie om de producten te zien; ＋ onderaan een locatie voegt een product toe (altijd te verwijderen met ✕).</li>
                <li>Per product stel je de huidige voorraad in met −/+; de gewenste voorraad staat grijs erachter (“gewenst n”). Met ✏️ achter de locatie pas je de gewenste hoeveelheden aan.</li>
                <li>Is de huidige voorraad lager dan gewenst? Dan staat het product automatisch op de boodschappenlijst.</li>
                <li>De categorie zegt waar het product in de supermarkt ligt (bewerkbaar bij Boodschappen). Een getagde winkel betekent: daar wordt het bij voorkeur gehaald; prijsvergelijking heeft dan geen zin.</li>
              </ul>
            </div>
          )}
        </span>
      </div>

      {stockLocations.map((loc) => {
        const items = productsOf(loc.id);
        const open = !!openLocs[loc.id];
        const editing = editLoc === loc.id;
        return (
          <div key={loc.id} className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <button className="text-stone-400 text-xs w-4 shrink-0" title={open ? "Inklappen" : "Uitklappen"} onClick={() => toggleLoc(loc.id)}>
                {open ? "▾" : "▸"}
              </button>
              <button className="flex-1 text-left min-w-0 font-medium text-sm truncate" onClick={() => toggleLoc(loc.id)}>
                {loc.name}
              </button>
              <span className="text-xs text-stone-400 shrink-0" title={items.length === 1 ? t("{n} product", { n: items.length }) : t("{n} producten", { n: items.length })}>
                {items.length}
              </span>
              <button
                className={`iconbtn${editing ? " on" : ""}`}
                title={editing ? "Gewenste hoeveelheden niet meer bewerken" : "Gewenste hoeveelheden in deze locatie bewerken"}
                onClick={() => setEditLoc(editing ? null : loc.id)}
              >
                ✏️
              </button>
              <button
                className={`delbtn${items.length ? " dis" : ""}`}
                disabled={items.length > 0}
                title={items.length ? "Verwijderen kan pas als er geen producten meer aan deze locatie hangen" : "Locatie verwijderen"}
                onClick={() => deleteLocation(loc.id)}
              >
                🗑️
              </button>
            </div>
            {open && (
              <div className="border-t border-stone-100">
                <div className="divide-y divide-stone-100">
                  {items.map((s) => {
                    const tekort = s.have < s.want;
                    const sp = s.pid ? prodById[s.pid] : null;
                    const cat = (sp && sp.cat) || s.cat;
                    const mkt = (sp && sp.market) || s.market;
                    return (
                      <div key={s.i}>
                      <div className="flex items-center gap-2 px-3 py-2 flex-wrap">
                        <span className="flex-1 min-w-0 text-sm">
                          {s.pid ? (
                            <button type="button" className="prodlink" onClick={() => openProdCard("stock-" + s.i, s.pid)}>{sp ? sp.name : s.name}</button>
                          ) : (
                            s.name
                          )}
                          <span className="block text-[10px] text-stone-400">{cat}</span>
                        </span>
                        <span className="flex items-center gap-1" title="Huidige voorraad">
                          <button className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600" onClick={() => bumpHave(s.i, -1)}>−</button>
                          <span className={`w-6 text-center text-sm font-medium ${tekort ? "text-orange-600" : "text-stone-700"}`}>{s.have}</span>
                          <button className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600" onClick={() => bumpHave(s.i, 1)}>+</button>
                        </span>
                        {editing ? (
                          <span className="flex items-center gap-1" title="Gewenste voorraad aanpassen">
                            <button className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600" onClick={() => bumpWant(s.i, -1)}>−</button>
                            <span className="w-6 text-center text-sm font-medium text-stone-700">{s.want}</span>
                            <button className="w-7 h-7 rounded-lg bg-stone-100 font-bold text-stone-600" onClick={() => bumpWant(s.i, 1)}>+</button>
                          </span>
                        ) : (
                          <span className="text-xs text-stone-400 whitespace-nowrap">{`gewenst ${s.want}`}</span>
                        )}
                        {mkt && <span className="chip mkt" title="Winkelvoorkeur">{marketChip(mkt)}</span>}
                        {tekort && <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">op lijst</span>}
                        <button className="text-stone-300 hover:text-red-500 text-sm" title="Product verwijderen" onClick={() => deleteProduct(s.i)}>✕</button>
                      </div>
                      {renderProductCard("stock-" + s.i)}
                      </div>
                    );
                  })}
                  {items.length === 0 && (
                    <div className="px-3 py-3 text-sm text-stone-400 text-center">Nog geen producten in deze locatie.</div>
                  )}
                </div>
                {addProdRow === loc.id ? (
                  <div className="flex items-center gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50">
                    <span className="grow suggest-wrap" style={{ flex: 1.4 }}>
                      <input
                        className="w-full border rounded-lg px-2 py-1.5 text-sm"
                        value={newProdRow.name}
                        placeholder="Productnaam…"
                        onChange={(e) => { setNewProdRow({ ...newProdRow, name: e.target.value }); setProdRowSuggest(e.target.value.trim().length >= 2); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addProductRow(loc.id); } }}
                      />
                      {prodRowSuggest && newProdRow.name.trim().length >= 2 && (
                        <div className="suggest-list">
                          {matchProducts(products, newProdRow.name.trim().toLowerCase()).map((s2) => (
                            <div key={s2.id} className="suggest-item" onMouseDown={(e) => { e.preventDefault(); setNewProdRow({ ...newProdRow, name: s2.name }); setProdRowSuggest(false); }}>
                              <span>{highlightMatch(s2.name, newProdRow.name.trim().toLowerCase())}</span>
                              <span className="text-[10px] text-stone-400 shrink-0">{s2.cat}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </span>
                    <span className="text-[10px] text-stone-400 shrink-0">gewenst</span>
                    <span className="stepper shrink-0">
                      <button onClick={() => setNewProdRow({ ...newProdRow, want: Math.max(0, newProdRow.want - 1) })}>−</button>
                      <span>{newProdRow.want}</span>
                      <button onClick={() => setNewProdRow({ ...newProdRow, want: newProdRow.want + 1 })}>+</button>
                    </span>
                    <button className="iconbtn on" title="Toevoegen" disabled={!newProdRow.name.trim()} onClick={() => addProductRow(loc.id)}>✓</button>
                    <button className="text-stone-300 hover:text-red-500 text-sm" title="Annuleren" onClick={() => { setAddProdRow(null); setNewProdRow({ name: "", want: 1 }); setProdRowSuggest(false); }}>✕</button>
                  </div>
                ) : (
                  <button className="addrow" onClick={() => setAddProdRow(loc.id)}>＋ Product toevoegen</button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {addLocOpen && (
        <div className="bg-white rounded-xl shadow-sm mb-3 p-3 flex gap-2 items-center">
          <input
            value={newLocName}
            onChange={(e) => setNewLocName(e.target.value)}
            placeholder="Naam van de locatie…"
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addLocation();
              }
            }}
          />
          <button className="iconbtn on" title="Locatie toevoegen" onClick={addLocation}>✓</button>
          <button
            className="delbtn"
            title="Annuleren"
            onClick={() => {
              setAddLocOpen(false);
              setNewLocName("");
            }}
          >
            ✕
          </button>
        </div>
      )}
      <button className="addcard" onClick={() => setAddLocOpen((v) => !v)}>
        ＋ Locatie toevoegen
      </button>

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setStock(stock.map((s) => ({ ...s, have: s.want })))}
          className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium"
        >
          ✓ Alles aangevuld
        </button>
        <button
          onClick={() => {
            setStock(defaultStock());
            setStockLocations(DEFAULT_LOCATIONS.map((l) => ({ ...l })));
          }}
          className="py-2.5 px-4 border rounded-xl text-sm text-stone-500 hover:bg-white"
        >
          Standaardlijst terug
        </button>
      </div>
    </div>
  );


  return { renderStockTab };
}
