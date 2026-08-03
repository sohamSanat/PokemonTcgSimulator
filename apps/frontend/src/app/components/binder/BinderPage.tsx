/**
 * @file BinderPage.tsx
 * @description Main display page for active binder contents.
 * Renders the top control bar (Grid/List mode switch, clear/delete binder triggers, pack opening CTA),
 * search & quick rarity filter preset chips, master set completion progress bar, and pagination footer.
 */

import React from "react";
import type { Card, Binder } from "./types";
import BinderGridView from "./BinderGridView";
import BinderListView from "./BinderListView";

interface Props {
 /** Name of the active binder */
 binderName: string;
 /** Array of cards (or empty null slots) on the active page */
 cards: (Card | null)[];
 /** Currently active page index */
 currentPage: number;
 /** Calculated total page count */
 totalPages: number;
 /** Pagination page change callback */
 onPageChange: (p: number) => void;
 /** Active display layout mode ("grid" or "list") */
 viewMode: "grid" | "list";
 /** Layout mode change handler */
 onViewModeChange: (m: "grid" | "list") => void;
 /** Card favorite status toggle handler */
 onToggleFavorite: (id: string) => void;
 /** Add cards / open packs action callback */
 onAddCard: () => void;
 /** Clear binder contents callback */
 onClearBinder?: () => void;
 /** Delete custom binder callback */
 onDeleteBinder?: () => void;
 /** Count of total cards inside active binder */
 totalCardsInBinder: number;
 /** Inspection modal trigger callback */
 onInspectCard?: (card: Card) => void;
 /** Move card modal trigger callback */
 onMoveCard?: (card: Card) => void;
 /** Active binder metadata object */
 currentBinderObj?: Binder;
 /** Selected rarity filter option */
 activeRarityFilter?: string;
 /** Rarity filter selection handler */
 onRarityFilterChange?: (rarity: string) => void;
 /** Available rarities list */
 raritiesList?: string[];
 /** Selected set filter option */
 activeSetFilter?: string;
 onSetFilterChange?: (set: string) => void;
 setsList?: string[];
 activeTypeFilter?: string;
 onTypeFilterChange?: (type: string) => void;
 typesList?: string[];
 holofoilOnly?: boolean;
 onToggleHolofoil?: () => void;
 favoritesOnly?: boolean;
 onToggleFavorites?: () => void;
 searchQuery?: string;
 onSearchQueryChange?: (q: string) => void;
 sortBy?: "price-desc" | "price-asc" | "name" | "rarity" | "newest";
 onSortByChange?: (sort: "price-desc" | "price-asc" | "name" | "rarity" | "newest") => void;
 onResetFilters?: () => void;
}

function BinderPage({
 binderName,
 cards,
 currentPage,
 totalPages,
 onPageChange,
 viewMode,
 onViewModeChange,
 onToggleFavorite,
 onAddCard,
 onClearBinder,
 onDeleteBinder,
 totalCardsInBinder,
 onInspectCard,
 onMoveCard,
 currentBinderObj,
 activeRarityFilter = "All Rarities",
 onRarityFilterChange,
 raritiesList = ["All Rarities", "Common", "Uncommon", "Rare", "Ultra / Secret Rare", "Illustration Rare", "Promo", "Shiny Vault"],
 activeSetFilter = "All Sets",
 onSetFilterChange,
 setsList = ["All Sets"],
 activeTypeFilter = "All Types",
 onTypeFilterChange,
 typesList = ["All Types"],
 holofoilOnly = false,
 onToggleHolofoil,
 favoritesOnly = false,
 onToggleFavorites,
 searchQuery = "",
 onSearchQueryChange,
 sortBy = "price-desc",
 onSortByChange,
 onResetFilters
}: Props) {
 // Ensure 9 slots for grid view
 const gridSlots: (Card | null)[] = [...cards];
 while (gridSlots.length < 9) {
 gridSlots.push(null);
 }

 // Generate pagination buttons
 const pages: (number | string)[] = [];
 for (let i = 1; i <= Math.max(1, totalPages); i++) {
 if (i <= 3 || i === totalPages || Math.abs(i - currentPage) <= 1) {
 pages.push(i);
 } else if (pages[pages.length - 1] !== "...") {
 pages.push("...");
 }
 }

 const QUICK_RARITY_PRESETS = [
 { id: "All Rarities", label: " All", icon: "" },
 { id: "SIR", label: " SIR (Special Art)", icon: "" },
 { id: "SR", label: " SR (Secret Rare)", icon: "" },
 { id: "UR", label: " UR (Ultra Rare)", icon: "" },
 { id: "IR", label: " IR (Illustration Rare)", icon: "" },
 { id: "Rare", label: " Rare", icon: "" },
 { id: "Uncommon", label: " Uncommon", icon: "" },
 { id: "Common", label: " Common", icon: "" },
 { id: "Promo", label: " Promo", icon: "" },
 { id: "Shiny Vault", label: " Shiny Vault", icon: "" }
 ];

 const hasActiveFilters =
 activeRarityFilter !== "All Rarities" ||
 activeSetFilter !== "All Sets" ||
 activeTypeFilter !== "All Types" ||
 holofoilOnly ||
 favoritesOnly ||
 searchQuery.trim() !== "" ||
 sortBy !== "price-desc";

 return (
 <main className="flex-1 flex flex-col overflow-visible md:overflow-hidden px-4 md:px-6 py-4 md:py-5 min-h-0">
 {/* Topbar */}
 <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-3 shrink-0 gap-3 xl:gap-0">
 <div>
 <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#f0f0f2] flex items-center gap-2">
 <span>{binderName}</span>
 {currentBinderObj?.isMasterSet && (
 <span className="text-xs font-black px-2.5 py-1 rounded-full bg-amber-400/20 border border-amber-400/40 text-amber-300 uppercase tracking-wider">
 Master Set
 </span>
 )}
 </h1>
 <p className="text-xs text-[#7a7a8a] mt-1">
 {totalCardsInBinder} cards matched &middot; Page {currentPage} of {Math.max(1, totalPages)}
 </p>
 </div>

 <div className="flex flex-wrap items-center gap-2">
 <TopBtn label="Grid View" active={viewMode === "grid"} onClick={() => onViewModeChange("grid")} />
 <TopBtn label="List View" active={viewMode === "list"} onClick={() => onViewModeChange("list")} />
 <div className="hidden md:block w-[1px] h-6 bg-white/10 mx-1" />
 {onClearBinder && <TopBtn label=" Clear Binder" onClick={onClearBinder} />}
 {onDeleteBinder && <TopBtn label=" Delete Binder" onClick={onDeleteBinder} />}
 <TopBtn label="+ Open Packs to Add" accent onClick={onAddCard} />
 </div>
 </div>

 {/* VAULT RARITY & CARDS FILTER BAR */}
 <div className="mb-4 bg-gradient-to-r from-zinc-900/90 via-black/80 to-zinc-900/90 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-xl shrink-0 space-y-2.5">
 {/* Search + Sort + Controls Row */}
 <div className="flex flex-wrap items-center justify-between gap-2.5">
 {/* Search input */}
 <div className="relative flex-1 min-w-[220px]">
 <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs"></span>
 <input
 type="text"
 value={searchQuery}
 onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
 placeholder="Search vault cards by name, set, or rarity..."
 className="w-full bg-black/60 border border-white/15 rounded-xl pl-8 pr-8 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400/80 transition-colors"
 />
 {searchQuery && (
 <button
 onClick={() => onSearchQueryChange && onSearchQueryChange("")}
 className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold"
 >
 
 </button>
 )}
 </div>

 {/* Rarity Dropdown (Full collection rarities) */}
 <div className="flex items-center gap-1.5 shrink-0">
 <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Rarity:</span>
 <select
 value={activeRarityFilter}
 onChange={(e) => onRarityFilterChange && onRarityFilterChange(e.target.value)}
 className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-amber-300 font-semibold focus:outline-none focus:border-amber-400/80 cursor-pointer"
 >
 {raritiesList.map((rarity) => (
 <option key={rarity} value={rarity} className="bg-zinc-900 text-white">
 {rarity}
 </option>
 ))}
 </select>
 </div>

 {/* Sort By Dropdown */}
 <div className="flex items-center gap-1.5 shrink-0">
 <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider hidden sm:inline">Sort:</span>
 <select
 value={sortBy}
 onChange={(e) => onSortByChange && onSortByChange(e.target.value as any)}
 className="bg-black/60 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400/80 cursor-pointer"
 >
 <option value="price-desc" className="bg-zinc-900 text-white">Highest Price ($ → 0)</option>
 <option value="price-asc" className="bg-zinc-900 text-white">Lowest Price (0 → $)</option>
 <option value="rarity" className="bg-zinc-900 text-white">Highest Rarity</option>
 <option value="name" className="bg-zinc-900 text-white">Card Name (A-Z)</option>
 </select>
 </div>

 {/* Reset Filters button */}
 {hasActiveFilters && onResetFilters && (
 <button
 onClick={onResetFilters}
 className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 hover:bg-amber-500/30 text-xs font-bold transition-all flex items-center gap-1 shrink-0"
 >
 <span>↺ Reset</span>
 </button>
 )}
 </div>

 {/* Quick Rarity Chips Bar */}
 <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
 <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
 <span> RARITY FILTER:</span>
 </span>
 {QUICK_RARITY_PRESETS.map((preset) => {
 const isActive = activeRarityFilter === preset.id;
 return (
 <button
 key={preset.id}
 onClick={() => onRarityFilterChange && onRarityFilterChange(preset.id)}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1 ${
 isActive
 ? "bg-gradient-to-r from-amber-500 to-yellow-500 text-black border-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.4)] scale-105"
 : "bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:border-white/20 hover:text-white"
 }`}
 >
 <span>{preset.label}</span>
 </button>
 );
 })}

 {/* Extra Holofoil & Favorite Pills */}
 <div className="h-4 w-[1px] bg-white/10 mx-1 shrink-0" />
 {onToggleHolofoil && (
 <button
 onClick={onToggleHolofoil}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
 holofoilOnly
 ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
 : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
 }`}
 >
 Holofoil
 </button>
 )}
 {onToggleFavorites && (
 <button
 onClick={onToggleFavorites}
 className={`px-2.5 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 ${
 favoritesOnly
 ? "bg-amber-500/25 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
 : "bg-white/5 border-white/10 text-zinc-400 hover:text-white"
 }`}
 >
 Favorites
 </button>
 )}
 </div>
 </div>

 {/* Master Set Banner */}
 {currentBinderObj?.isMasterSet && (
 <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-600/15 to-amber-900/20 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
 <div className="flex items-center gap-3.5">
 <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 text-black font-black shrink-0">
 
 </div>
 <div>
 <div className="flex items-center gap-2">
 <h2 className="text-base md:text-lg font-black text-amber-300">{currentBinderObj.masterSetName || binderName}</h2>
 </div>
 <p className="text-xs text-gray-300 mt-0.5">
 {currentBinderObj.generation || 'Official Expansion'} &middot; <span className="text-amber-300 font-bold">{totalCardsInBinder}</span> of <span className="text-white font-bold">{currentBinderObj.totalCardsInSet || 100}</span> cards collected
 </p>
 </div>
 </div>

 {/* Completion bar */}
 <div className="flex items-center gap-4 md:w-72 shrink-0">
 <div className="flex-1 space-y-1.5">
 <div className="flex justify-between text-xs font-bold text-amber-200">
 <span>Master Progress</span>
 <span className="text-amber-400 font-extrabold">
 {Math.min(100, Math.round((totalCardsInBinder / (currentBinderObj.totalCardsInSet || 100)) * 100))}%
 </span>
 </div>
 <div className="w-full bg-black/60 h-2.5 rounded-full overflow-hidden border border-white/10 p-0.5">
 <div
 className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full transition-all duration-700 shadow-[0_0_10px_rgba(251,191,36,0.6)]"
 style={{ width: `${Math.min(100, Math.round((totalCardsInBinder / (currentBinderObj.totalCardsInSet || 100)) * 100))}%` }}
 />
 </div>
 </div>
 </div>
 </div>
 )}

 {/* Binder content area */}
 {viewMode === "grid" ? (
 <BinderGridView 
 gridSlots={gridSlots} 
 currentPage={currentPage} 
 onToggleFavorite={onToggleFavorite} 
 onAddCard={onAddCard} 
 onInspectCard={onInspectCard} 
 onMoveCard={onMoveCard} 
 />
 ) : (
 <BinderListView 
 cards={cards} 
 onInspectCard={onInspectCard} 
 onMoveCard={onMoveCard} 
 onToggleFavorite={onToggleFavorite} 
 />
 )}

 {/* Bottom pagination */}
 <div className="flex justify-center gap-2 mt-3.5 shrink-0">
 {pages.map((p, i) => (
 <button
 key={i}
 disabled={p === "..."}
 onClick={() => typeof p === "number" && onPageChange(p)}
 className={`w-[30px] h-[30px] rounded-lg border text-xs flex items-center justify-center transition-colors ${
 p === currentPage 
 ? "border-white/10 bg-blue-500/20 text-blue-400 font-semibold cursor-pointer"
 : p === "..." 
 ? "border-transparent bg-transparent text-zinc-500 font-normal cursor-default"
 : "border-white/10 bg-white/5 text-zinc-400 font-normal hover:bg-white/10 cursor-pointer"
 }`}
 >
 {p}
 </button>
 ))}
 </div>
 </main>
 );
}

const TopBtn = React.memo(({ label, active, accent, onClick }: { label: string; active?: boolean; accent?: boolean; onClick?: () => void }) => {
 return (
 <button
 onClick={onClick}
 className={`px-3.5 py-1.5 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
 accent 
 ? "border-blue-500 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25" 
 : active 
 ? "border-white/15 bg-white/10 text-white" 
 : "border-white/5 bg-transparent text-zinc-400 hover:border-white/10 hover:text-zinc-300"
 }`}
 >
 {label}
 </button>
 );
});

export default React.memo(BinderPage);
