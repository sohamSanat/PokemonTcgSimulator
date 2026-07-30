/**
 * @file Sidebar.tsx
 * @description Navigation sidebar component for the Card Vault.
 * Renders user profile summary, aggregated portfolio dollar valuation, binder list selectors,
 * custom binder creation triggers, and collapsible Vault filter controls.
 */

import React from "react";
import type { Binder } from "./types";
import BinderIcon from "./BinderIcon";

interface Props {
  /** Array of available binders */
  binders: Binder[];
  /** ID of the currently selected binder */
  activeBinder: string;
  /** Callback fired when a binder item is clicked */
  onSelectBinder: (id: string) => void;
  /** Callback fired when "+ Create Binder" is clicked */
  onNewBinder: () => void;
  /** Callback fired when a binder delete button is clicked */
  onDeleteBinder?: (id: string) => void;
  /** Currently selected set filter option */
  activeSetFilter?: string;
  /** Set filter selection handler */
  onSetFilterChange?: (s: string) => void;
  /** Currently selected rarity filter option */
  activeRarityFilter?: string;
  /** Rarity filter selection handler */
  onRarityFilterChange?: (r: string) => void;
  /** Currently selected energy/card type filter option */
  activeTypeFilter?: string;
  /** Type filter selection handler */
  onTypeFilterChange?: (t: string) => void;
  /** Holofoil-only toggle state */
  holofoilOnly?: boolean;
  /** Holofoil toggle handler */
  onToggleHolofoil?: () => void;
  /** Favorites-only toggle state */
  favoritesOnly?: boolean;
  /** Favorites toggle handler */
  onToggleFavorites?: () => void;
  /** Total count of cards matching current criteria */
  totalCardsCount: number;
  /** Calculated total portfolio market value in USD */
  totalPortfolioValue: number;
  /** List of set expansion names present in raw cards */
  setsList?: string[];
  /** List of rarity tags present in raw cards */
  raritiesList?: string[];
}

function Sidebar({
  binders,
  activeBinder,
  onSelectBinder,
  onNewBinder,
  onDeleteBinder,
  activeSetFilter = "All Sets",
  onSetFilterChange,
  activeRarityFilter = "All Rarities",
  onRarityFilterChange,
  activeTypeFilter = "All Types",
  onTypeFilterChange,
  holofoilOnly = false,
  onToggleHolofoil,
  favoritesOnly = false,
  onToggleFavorites,
  totalCardsCount,
  totalPortfolioValue,
  setsList = ["All Sets"],
  raritiesList = ["All Rarities"]
}: Props) {
  const [showFilters, setShowFilters] = React.useState<boolean>(true);

  const hasActiveFilters = activeRarityFilter !== "All Rarities" || activeSetFilter !== "All Sets" || activeTypeFilter !== "All Types" || holofoilOnly || favoritesOnly;

  return (
    <aside className="w-full md:w-[300px] md:min-w-[300px] h-auto md:h-full flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#14141a]/60 backdrop-blur-2xl">
      {/* Profile header */}
      <div className="hidden md:block">
        <div className="pt-6 px-5 pb-0">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-[15px] font-bold text-white shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
              TP
            </div>
            <div>
              <div className="text-sm font-bold text-[#f0f0f2]">TrainerPro</div>
              <div className="text-[11px] text-zinc-400 font-medium">Elite Collector</div>
            </div>
            <div className="ml-auto">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
            </div>
          </div>

          {/* Portfolio value */}
          <div className="bg-gradient-to-br from-white/5 to-white/5 border border-white/10 rounded-2xl p-4 mb-6 shadow-[0_10px_30px_rgba(0,0,0,0.3)]">
            <div className="text-[11px] font-bold tracking-widest text-zinc-400 uppercase mb-1.5">
              Portfolio Value
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-[#f0f0f2]">
              ${Math.floor(totalPortfolioValue).toLocaleString()}<span className="text-lg text-zinc-400">.{((totalPortfolioValue % 1) * 100).toFixed(0).padStart(2, '0')}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[11px] text-emerald-500 font-bold bg-emerald-500/15 rounded-md px-2 py-0.5">
                ▲ Active
              </span>
              <span className="text-[11px] text-zinc-400 font-medium">live tracking</span>
            </div>
          </div>
        </div>
        <div className="h-px bg-white/5 mx-5 mb-4" />
      </div>

      {/* Vault Filters Accordion/Section */}
      <div className="hidden md:block px-4 mb-4">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-3">
          <div 
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="text-[11px] font-extrabold tracking-widest text-[#a1a1aa] uppercase flex items-center gap-2">
              <span>💎 VAULT FILTERS</span>
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </div>
            <span className="text-xs text-zinc-400 font-bold">{showFilters ? "▲" : "▼"}</span>
          </div>

          {showFilters && (
            <div className="mt-3 space-y-3 pt-2 border-t border-white/5">
              {/* Rarity Selector */}
              <div>
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                  Card Rarity
                </label>
                <select
                  value={activeRarityFilter}
                  onChange={(e) => onRarityFilterChange && onRarityFilterChange(e.target.value)}
                  className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400/80 cursor-pointer"
                >
                  {raritiesList.map((rarity) => (
                    <option key={rarity} value={rarity} className="bg-zinc-900 text-white">
                      {rarity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Set Selector */}
              {onSetFilterChange && (
                <div>
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Set
                  </label>
                  <select
                    value={activeSetFilter}
                    onChange={(e) => onSetFilterChange(e.target.value)}
                    className="w-full bg-black/50 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400/80 cursor-pointer"
                  >
                    {setsList.map((set) => (
                      <option key={set} value={set} className="bg-zinc-900 text-white">
                        {set}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Quick Filter Toggles */}
              <div className="flex flex-wrap gap-2 pt-1">
                {onToggleHolofoil && (
                  <button
                    onClick={onToggleHolofoil}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      holofoilOnly
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ✨ Holofoil
                  </button>
                )}
                {onToggleFavorites && (
                  <button
                    onClick={onToggleFavorites}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                      favoritesOnly
                        ? "bg-amber-500/20 border-amber-400 text-amber-300"
                        : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
                    }`}
                  >
                    ⭐ Favorites
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Binder list - Uncluttered, Spacious, and User-Friendly */}
      <div className="flex-none md:flex-1 w-full overflow-x-auto md:overflow-x-hidden overflow-y-hidden md:overflow-y-auto px-4 py-3 md:pb-5 custom-scrollbar">
        <div className="flex items-center justify-between mb-3 md:mb-4 px-1">
          <div className="text-[11px] font-extrabold tracking-widest text-[#a1a1aa] uppercase flex items-center gap-2">
            <span>📁 MY BINDERS</span>
            <span className="bg-white/10 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">{binders.length}</span>
          </div>
          <div className="md:hidden text-[11px] font-bold text-[#34d399] bg-[#10b981]/15 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            Portfolio: ${(totalPortfolioValue || 0).toLocaleString()}
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2.5 md:gap-2 w-max md:w-full pb-2 md:pb-0">
          {binders.map((binder) => {
            const isActive = activeBinder === binder.id;
            const isDefault = binder.id === 'my-collection';
            const isMaster = binder.isMasterSet || binder.name.includes('👑') || binder.name.includes('Master Set');
            const totalSetCards = binder.totalCardsInSet || 100;
            const completionPct = isMaster ? Math.min(100, Math.round((binder.count / totalSetCards) * 100)) : 0;

            return (
              <div
                key={binder.id}
                onClick={() => onSelectBinder(binder.id)}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-xl w-[210px] md:w-full shrink-0 cursor-pointer transition-all duration-200 relative overflow-hidden text-left ${
                  isMaster
                    ? isActive
                      ? "border border-amber-400 bg-gradient-to-br from-amber-500/25 via-purple-600/20 to-amber-900/30 shadow-[0_0_25px_rgba(245,158,11,0.3)]"
                      : "border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent hover:border-amber-500/60 hover:bg-amber-500/15"
                    : isActive
                      ? "border border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-orange-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                      : "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15"
                }`}
              >
                {/* Binder Icon */}
                <div className="scale-75 md:scale-100 origin-left">
                  <BinderIcon name={binder.name} isMasterSet={binder.isMasterSet} isActive={isActive} />
                </div>

                {/* Binder Info */}
                <div className="flex-1 min-w-0 -ml-1 md:ml-0">
                  <div className={`text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis mb-0.5 flex items-center gap-1 ${
                    isMaster ? "font-extrabold text-amber-300" : isActive ? "font-bold text-amber-400" : "font-semibold text-zinc-100"
                  }`}>
                    <span className="truncate">{binder.name}</span>
                  </div>

                  {isMaster ? (
                    <div className="space-y-1">
                      <div className="text-[10px] md:text-[11px] text-amber-200/90 font-bold flex items-center justify-between">
                        <span>{binder.count}/{totalSetCards} ({completionPct}%)</span>
                        <span className="text-emerald-400 font-extrabold">
                          ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] md:text-[11px] text-zinc-400 flex items-center gap-1 md:gap-1.5">
                      <span>{binder.count} {binder.count === 1 ? 'card' : 'cards'}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">
                        ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete Binder Button */}
                {!isDefault && onDeleteBinder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBinder(binder.id);
                    }}
                    title="Delete Binder"
                    className="w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xs cursor-pointer transition-colors hover:bg-red-500/25 hover:border-red-500/60 hover:text-red-500 shrink-0 mr-1 md:mr-0 z-10"
                  >
                    🗑️
                  </button>
                )}

                {/* Active Indicator Arrow */}
                {isActive && (
                  <div className={`hidden md:flex w-6 h-6 rounded-md items-center justify-center text-xs font-bold shrink-0 ${
                    isMaster ? 'bg-amber-500/30 text-amber-300' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    →
                  </div>
                )}
              </div>
            );
          })}

          <button
            onClick={onNewBinder}
            className="flex items-center justify-center gap-2 w-[160px] md:w-full p-2.5 md:p-3 rounded-xl border border-dashed border-amber-500/40 bg-amber-500/5 hover:bg-amber-500/15 hover:border-amber-500/80 text-amber-400 text-xs md:text-[13px] font-bold transition-all shrink-0 mt-0 md:mt-2"
          >
            <span className="text-sm md:text-base">+</span> New Binder
          </button>
        </div>
      </div>

      {/* Stats footer */}
      <div className="hidden md:flex justify-between px-5 py-4 border-t border-white/10 bg-black/20">
        {[[String(totalCardsCount), "Cards"], [String(binders.length), "Binders"], ["100%", "Active"]].map(([val, lbl]) => (
          <div key={lbl} className="text-center">
            <div className="text-[15px] font-bold text-white">{val}</div>
            <div className="text-[10px] text-zinc-400 font-semibold mt-0.5">{lbl}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
