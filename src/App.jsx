import React from "react";
import { useAppStore } from "./state/store.js";
import { createMenuTab } from "./ui/menuTab.jsx";
import { createRecipesTab } from "./ui/recipesTab.jsx";
import { createStockTab } from "./ui/stockTab.jsx";
import { createShoppingTab } from "./ui/shoppingTab.jsx";
import { createSettingsTab } from "./ui/settingsTab.jsx";
import { THEME_TAB_ICONS } from "./domain/settings.js";
import { t } from "./i18n/index.js";

// Compositieroot: state uit useAppStore(), tabbalk en aanroep van de tab-views.
// Tab-views zijn plain-functie-aanroepen (geen <Component/>), zodat de test-harness
// de hele boom kan uitvouwen; alle hooks blijven in useAppStore.
export default function App() {
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
    <div className="min-h-screen bg-stone-50 text-stone-800" data-theme={settings.theme}>
      <div className="mx-auto max-w-2xl px-4 pb-16">
        <header className="pt-6 pb-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold">Weekmenu &amp; Boodschappen</h1>
          <span className="text-xs text-stone-400">{t("{n} eters", { n: settings.householdSize })}</span>
        </header>

        <nav className="flex gap-1 bg-white rounded-xl p-1 shadow-sm mb-4 sticky top-2 z-10">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => goTab(tb.key)}
              title={tb.label}
              aria-label={tb.label}
              className={`tabbtn ${tab === tb.key ? "bg-stone-800 text-white" : "text-stone-500 hover:bg-stone-100"}`}
            >
              <span className="tabicon">{tb.icon}</span>
              {tab === tb.key && <span className="tablabel">{tb.label}</span>}
              {tb.key === "shopping" && totalItems > 0 && (
                <span className="tabbadge" title={t("{done} van {total} afgevinkt", { done: doneItems, total: totalItems })}>{`${doneItems}/${totalItems}`}</span>
              )}
            </button>
          ))}
        </nav>

        <input id="dish-foto-input" type="file" accept="image/*" style={{ display: "none" }} onChange={onDishFotoFile} />
        {mergeGroup && settingsViews.renderMergeSheet()}
        {pnToast && (
          <div style={{ position: "fixed", bottom: "1rem", left: "50%", transform: "translateX(-50%)", zIndex: 60, background: "#292524", color: "#fff", borderRadius: "0.75rem", padding: "0.5rem 0.9rem", display: "flex", gap: "0.6rem", alignItems: "center", fontSize: "0.85rem" }}>
            <span>{pnToast.msg}</span>
            {pnToast.canUndo && <button onClick={undoMerge} style={{ color: "#fbbf24" }}>\u27f2 Ongedaan maken</button>}
            <button onClick={() => setPnToast(null)} style={{ color: "#d6d3d1" }}>\u2715</button>
          </div>
        )}
        {tab === "menu" && menuViews.renderMenuTab()}
        {tab === "recipes" && recipesViews.renderRecipesTab()}

        {tab === "stock" && stockViews.renderStockTab()}

        {tab === "shopping" && shoppingViews.renderShoppingTab()}

        {tab === "settings" && settingsViews.renderSettingsTab()}
        {tab === "settings" && settingsViews.renderDelenSheets()}
        {tab === "menu" && dateSheetOpen && menuViews.renderDateSheet()}

        {tab === "menu" && rulesSheetOpen && menuViews.renderRulesSheet()}
        {tab === "menu" && deviationKey && menuViews.renderDeviationSheet()}
      </div>
    </div>
  );
}
