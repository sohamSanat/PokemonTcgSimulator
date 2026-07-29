import React from "react";
import type { Card, Binder } from "./types";
import CardSlot from "./CardSlot";
import { getCardImageUrl } from "../../services/tcgdex";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

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
    { id: "All Rarities", label: "✨ All", icon: "✨" },
    { id: "SIR", label: "🔥 SIR (Special Art)", icon: "🔥" },
    { id: "SR", label: "👑 SR (Secret Rare)", icon: "👑" },
    { id: "UR", label: "💎 UR (Ultra Rare)", icon: "💎" },
    { id: "IR", label: "🌟 IR (Illustration Rare)", icon: "🌟" },
    { id: "Rare", label: "⭐ Rare", icon: "⭐" },
    { id: "Uncommon", label: "🔷 Uncommon", icon: "🔷" },
    { id: "Common", label: "⚪ Common", icon: "⚪" },
    { id: "Promo", label: "🎁 Promo", icon: "🎁" },
    { id: "Shiny Vault", label: "✨ Shiny Vault", icon: "✨" }
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
                👑 Master Set
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
          {onClearBinder && <TopBtn label="🗑️ Clear Binder" onClick={onClearBinder} />}
          {onDeleteBinder && <TopBtn label="❌ Delete Binder" onClick={onDeleteBinder} />}
          <TopBtn label="+ Open Packs to Add" accent onClick={onAddCard} />
        </div>
      </div>

      {/* 🔍 VAULT RARITY & CARDS FILTER BAR */}
      <div className="mb-4 bg-gradient-to-r from-zinc-900/90 via-black/80 to-zinc-900/90 border border-white/10 rounded-2xl p-3 shadow-xl backdrop-blur-xl shrink-0 space-y-2.5">
        {/* Search + Sort + Controls Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          {/* Search input */}
          <div className="relative flex-1 min-w-[220px]">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-xs">🔍</span>
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
                ✕
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
            <span>💎 RARITY FILTER:</span>
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
              ✨ Holofoil
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
              ⭐ Favorites
            </button>
          )}
        </div>
      </div>

      {/* Master Set Banner */}
      {currentBinderObj?.isMasterSet && (
        <div className="mb-5 p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-purple-600/15 to-amber-900/20 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 flex items-center justify-center text-2xl shadow-lg shadow-amber-500/30 text-black font-black shrink-0">
              👑
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
        <div className="flex-1 overflow-visible md:overflow-y-auto overflow-x-hidden py-3 pb-8 min-h-0 custom-scrollbar">
          <div
            style={{
              width: "100%",
              maxWidth: 900,
              margin: "0 auto",
              background: "radial-gradient(circle at center, #1c1c24 0%, #111116 100%)",
              border: "2px solid rgba(255,255,255,0.1)",
              borderRadius: 24,
              padding: "28px 28px 32px 84px",
              boxShadow: "0 40px 120px rgba(0,0,0,0.8), inset 0 1px 2px rgba(255,255,255,0.15), 0 0 0 1px rgba(0,0,0,0.8)",
              position: "relative",
              overflow: "visible"
            }}
          >
            {/* Binder Binding Spine & Metal Rings on LEFT edge */}
            <div style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: 58,
              background: "linear-gradient(to right, #0a0a0e 0%, #171720 50%, #0a0a0e 100%)",
              borderRight: "2px solid rgba(0,0,0,0.9)",
              boxShadow: "6px 0 20px rgba(0,0,0,0.6), inset -1px 0 2px rgba(255,255,255,0.12)",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-evenly",
              alignItems: "center",
              zIndex: 10
            }}>
              {/* Vertical ultrasonic weld stitching lines on spine */}
              <div style={{ position: "absolute", left: 10, top: 14, bottom: 14, width: 1, borderLeft: "1px dashed rgba(255,255,255,0.15)" }} />
              <div style={{ position: "absolute", right: 10, top: 14, bottom: 14, width: 1, borderLeft: "1px dashed rgba(255,255,255,0.15)" }} />

              {/* Realistic Metal Binder Rings */}
              {[18, 50, 82].map((pct) => (
                <div key={pct} style={{ position: "relative", width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {/* Punched hole in page */}
                  <div style={{
                    width: 18,
                    height: 18,
                    borderRadius: "50%",
                    background: "#050507",
                    boxShadow: "inset 0 2px 5px rgba(0,0,0,0.95), 0 1px 1px rgba(255,255,255,0.15)"
                  }} />
                  {/* Chrome Metal D-Ring Clamp */}
                  <div style={{
                    position: "absolute",
                    left: -6,
                    width: 28,
                    height: 10,
                    borderRadius: 5,
                    background: "linear-gradient(to bottom, #ffffff 0%, #d4d4d8 30%, #71717a 70%, #3f3f46 100%)",
                    boxShadow: "3px 5px 10px rgba(0,0,0,0.85), inset 0 1px 1px white",
                    transform: "rotate(-8deg)"
                  }} />
                </div>
              ))}
            </div>

            {/* 9-pocket sheet background texture & grid */}
            <SortableContext items={gridSlots.map((c, i) => c?.id ?? `empty-${i}`)} strategy={rectSortingStrategy}>
              <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10"
              >
                {gridSlots.slice(0, 9).map((card, i) => (
                  <CardSlot key={card?.id ?? `empty-${i}`} card={card} index={i} onToggleFavorite={onToggleFavorite} onAddCard={onAddCard} onInspectCard={onInspectCard} onMoveCard={onMoveCard} />
                ))}
              </div>
            </SortableContext>

            {/* Page number */}
            <div style={{
              position: "absolute",
              bottom: 10,
              left: "50%",
              transform: "translateX(-50%)",
              fontSize: 10,
              color: "rgba(255,255,255,0.2)",
              letterSpacing: "0.1em",
            }}>
              PAGE {currentPage}
            </div>
          </div>
        </div>
      ) : (
        /* List View */
        <div className="flex-1 overflow-x-auto overflow-y-visible md:overflow-auto bg-white/5 rounded-2xl border border-white/10 p-4 min-h-0 custom-scrollbar">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#7a7a8a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "10px 12px" }}>Card</th>
                <th style={{ padding: "10px 12px" }}>Set</th>
                <th style={{ padding: "10px 12px" }}>Rarity</th>
                <th style={{ padding: "10px 12px" }}>Type</th>
                <th style={{ padding: "10px 12px" }}>Price</th>
                <th style={{ padding: "10px 12px" }}>Change</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cards.filter((c): c is Card => c !== null).map((card) => {
                const price = card.currentPrice ?? 0;
                const change = card.priceChange ?? 0;
                const positive = change >= 0;
                return (
                  <tr key={card.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", fontSize: 13, cursor: "pointer", transition: "background 0.15s" }} onClick={() => onInspectCard && onInspectCard(card)}>
                    <td style={{ padding: "12px", display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ position: "relative", width: 34, height: 47, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{ position: "absolute", top: "5%", left: "6%", width: "88%", height: "90%", borderRadius: "2px", border: "1px solid rgba(255, 255, 255, 0.15)", backgroundColor: "rgba(255, 255, 255, 0.02)", boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 0 2px rgba(255,255,255,0.05)", zIndex: 1, pointerEvents: "none" }} />
                        <img src={getCardImageUrl(card.imageUrl, 'high')} alt={card.name} style={{ position: "absolute", top: "6.5%", left: "7.5%", width: "85%", height: "87%", borderRadius: 2, objectFit: "cover", zIndex: 2 }} />
                        <div style={{ position: "absolute", top: "5%", left: "6%", width: "88%", height: "90%", borderRadius: "2px", background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)", borderTop: "1px solid rgba(255,255,255,0.25)", borderLeft: "1px solid rgba(255,255,255,0.15)", zIndex: 3, pointerEvents: "none", mixBlendMode: "screen" }} />
                      </div>
                      <span style={{ fontWeight: 600, color: "white" }}>{card.name}</span>
                    </td>
                    <td style={{ padding: "12px", color: "#a0a0b0" }}>{card.setName} ({card.setNumber})</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>{card.rarity}</span>
                    </td>
                    <td style={{ padding: "12px", color: "#a0a0b0" }}>{card.type}</td>
                    <td style={{ padding: "12px", fontWeight: 700, color: "white" }}>${price.toFixed(2)}</td>
                    <td style={{ padding: "12px" }}>
                      <span style={{ color: positive ? "#00e676" : "#ff5252", fontWeight: 600, fontSize: 12 }}>
                        {positive ? "▲" : "▼"} {Math.abs(change)}%
                      </span>
                    </td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 8 }}>
                        {onMoveCard && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onMoveCard(card);
                            }}
                            title="Move card to another binder"
                            style={{
                              padding: "4px 8px",
                              borderRadius: 6,
                              background: "rgba(56, 189, 248, 0.15)",
                              border: "1px solid rgba(56, 189, 248, 0.4)",
                              color: "#38bdf8",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4
                            }}
                          >
                            <span>📦 Move</span>
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite(card.id);
                          }}
                          style={{ background: "transparent", border: "none", color: card.favorite ? "#ffc832" : "#555", cursor: "pointer", fontSize: 16 }}
                        >
                          ★
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {cards.filter(c => c !== null).length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#7a7a8a" }}>
                    No cards found in this binder or matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Bottom pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexShrink: 0 }}>
        {pages.map((p, i) => (
          <button
            key={i}
            disabled={p === "..."}
            onClick={() => typeof p === "number" && onPageChange(p)}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: p === currentPage ? "rgba(68,138,255,0.2)" : "rgba(255,255,255,0.04)",
              color: p === currentPage ? "#448aff" : "#7a7a8a",
              fontSize: 12,
              fontWeight: p === currentPage ? 600 : 400,
              cursor: p === "..." ? "default" : "pointer",
            }}
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
      style={{
        padding: "6px 14px",
        borderRadius: 8,
        border: `1px solid ${accent ? "#448aff" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
        background: accent ? "rgba(68,138,255,0.15)" : active ? "rgba(255,255,255,0.08)" : "transparent",
        color: accent ? "#448aff" : active ? "#f0f0f2" : "#7a7a8a",
        fontSize: 12,
        fontWeight: 500,
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
});

export default React.memo(BinderPage);
