import React from "react";
import { 
  Search, Grid, List, Sparkles, Star, RefreshCw, Plus, 
  Trash2, Layers, Filter, ArrowUpDown, ChevronLeft, ChevronRight 
} from "lucide-react";
import type { Card, Binder } from "./types";
import BinderGridView from "./BinderGridView";
import BinderListView from "./BinderListView";

interface Props {
  binderName: string;
  cards: (Card | null)[];
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (m: "grid" | "list") => void;
  onToggleFavorite: (id: string) => void;
  onAddCard: () => void;
  onClearBinder?: () => void;
  onDeleteBinder?: () => void;
  totalCardsInBinder: number;
  onInspectCard?: (card: Card) => void;
  onMoveCard?: (card: Card) => void;
  currentBinderObj?: Binder;
  activeRarityFilter?: string;
  onRarityFilterChange?: (rarity: string) => void;
  raritiesList?: string[];
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
    { id: "All Rarities", label: "All Rarities" },
    { id: "SIR", label: "SIR (Special Art)" },
    { id: "SR", label: "SR (Secret Rare)" },
    { id: "UR", label: "UR (Ultra Rare)" },
    { id: "IR", label: "IR (Illustration Rare)" },
    { id: "Rare", label: "Rare" },
    { id: "Uncommon", label: "Uncommon" },
    { id: "Common", label: "Common" },
    { id: "Promo", label: "Promo" },
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
    <main className="flex-1 flex flex-col overflow-visible md:overflow-hidden px-4 md:px-6 py-4 md:py-5 min-h-0 relative z-10 bg-[#090614]">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between mb-4 shrink-0 gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>{binderName}</span>
            </h1>
            {currentBinderObj?.isMasterSet && (
              <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 uppercase tracking-widest">
                MASTER SET
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 font-medium mt-0.5">
            {totalCardsInBinder} cards collected &middot; Page {currentPage} of {Math.max(1, totalPages)}
          </p>
        </div>

        {/* View Switcher & Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 shrink-0">
            <button
              onClick={() => onViewModeChange("grid")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "grid" 
                  ? "bg-amber-400 text-black shadow-md" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => onViewModeChange("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === "list" 
                  ? "bg-amber-400 text-black shadow-md" 
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <div className="hidden sm:block w-px h-6 bg-white/10 mx-1" />

          {onClearBinder && (
            <button
              onClick={onClearBinder}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs font-bold transition-all cursor-pointer"
            >
              Clear
            </button>
          )}

          {onDeleteBinder && (
            <button
              onClick={onDeleteBinder}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 hover:text-red-300 text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}

          <button
            onClick={onAddCard}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_15px_rgba(245,158,11,0.3)] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 text-black" />
            <span>Open Packs</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="mb-4 bg-[#110d24]/90 border border-white/10 rounded-2xl p-3.5 shadow-xl backdrop-blur-md shrink-0 space-y-3">
        {/* Search + Sort + Toggles Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange && onSearchQueryChange(e.target.value)}
              placeholder="Search cards by name, set, or rarity..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/60 focus:bg-black/40 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange && onSearchQueryChange("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="relative flex items-center bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-gray-300 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-400 mr-1.5 shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange && onSortByChange(e.target.value as any)}
              className="bg-transparent text-xs text-white focus:outline-none cursor-pointer font-bold pr-1"
            >
              <option value="price-desc" className="bg-[#110d24] text-white">Price: High → Low</option>
              <option value="price-asc" className="bg-[#110d24] text-white">Price: Low → High</option>
              <option value="name" className="bg-[#110d24] text-white">Name (A → Z)</option>
              <option value="rarity" className="bg-[#110d24] text-white">Rarity Tier</option>
              <option value="newest" className="bg-[#110d24] text-white">Recently Added</option>
            </select>
          </div>

          {/* Quick Toggle Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleHolofoil}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 border ${
                holofoilOnly
                  ? "bg-amber-400 text-black border-amber-400 shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Holo Only</span>
            </button>

            <button
              onClick={onToggleFavorites}
              className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 border ${
                favoritesOnly
                  ? "bg-rose-500 text-white border-rose-400 shadow-md"
                  : "bg-white/5 hover:bg-white/10 text-gray-300 border-white/10"
              }`}
            >
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>Favorites</span>
            </button>

            {hasActiveFilters && (
              <button
                onClick={onResetFilters}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Reset Filters"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Rarity Preset Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pt-1">
          {QUICK_RARITY_PRESETS.map((preset) => {
            const isSelected = activeRarityFilter === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => onRarityFilterChange && onRarityFilterChange(preset.id)}
                className={`px-3 py-1 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer shrink-0 ${
                  isSelected
                    ? "bg-amber-400 text-black shadow-md"
                    : "bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5"
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Binder Card Sheet View */}
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
          cards={cards.filter((c): c is Card => c !== null)}
          onToggleFavorite={onToggleFavorite}
          onInspectCard={onInspectCard}
          onMoveCard={onMoveCard}
        />
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/10 shrink-0">
          <button
            disabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Prev Page</span>
          </button>

          <div className="flex items-center gap-1.5">
            {pages.map((p, idx) => (
              <button
                key={idx}
                disabled={p === "..."}
                onClick={() => typeof p === "number" && onPageChange(p)}
                className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                  p === currentPage
                    ? "bg-amber-400 text-black shadow-md"
                    : p === "..."
                    ? "text-gray-500 cursor-default"
                    : "bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5 cursor-pointer"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          <button
            disabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer flex items-center gap-1"
          >
            <span>Next Page</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </main>
  );
}

export default React.memo(BinderPage);
