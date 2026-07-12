import React from "react";
import type { Card } from "./types";
import CardSlot from "./CardSlot";
import { getCardImageUrl } from "../../services/tcgdex";

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
  onInspectCard
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

  return (
    <main className="flex-1 flex flex-col overflow-hidden px-4 md:px-6 py-4 md:py-5 min-h-0">
      {/* Topbar */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between mb-4 md:mb-5 shrink-0 gap-3 xl:gap-0">
        <div>
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#f0f0f2]">
            {binderName}
          </h1>
          <p className="text-xs text-[#7a7a8a] mt-1">
            {totalCardsInBinder} cards · Page {currentPage} of {Math.max(1, totalPages)}
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

      {/* Binder content area */}
      {viewMode === "grid" ? (
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "10px 0 30px" }}>
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
              overflow: "hidden"
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
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 16,
                position: "relative",
                zIndex: 5
              }}
            >
              {gridSlots.slice(0, 9).map((card, i) => (
                <CardSlot key={card?.id ?? `empty-${i}`} card={card} index={i} onToggleFavorite={onToggleFavorite} onAddCard={onAddCard} onInspectCard={onInspectCard} />
              ))}
            </div>

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
        <div className="flex-1 overflow-auto bg-white/5 rounded-2xl border border-white/10 p-4 min-h-0 custom-scrollbar">
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", color: "#7a7a8a", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                <th style={{ padding: "10px 12px" }}>Card</th>
                <th style={{ padding: "10px 12px" }}>Set</th>
                <th style={{ padding: "10px 12px" }}>Rarity</th>
                <th style={{ padding: "10px 12px" }}>Type</th>
                <th style={{ padding: "10px 12px" }}>Price</th>
                <th style={{ padding: "10px 12px" }}>Change</th>
                <th style={{ padding: "10px 12px", textAlign: "right" }}>Favorite</th>
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
                        <img src="/sleeve.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", zIndex: 1 }} />
                        <img src={getCardImageUrl(card.imageUrl, 'low')} alt={card.name} style={{ position: "absolute", top: "6.5%", left: "7.5%", width: "85%", height: "87%", borderRadius: 2, objectFit: "cover", zIndex: 2 }} />
                        <img src="/sleeve.png" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", opacity: 0.22, zIndex: 3, pointerEvents: "none" }} />
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
                      <button
                        onClick={() => onToggleFavorite(card.id)}
                        style={{ background: "transparent", border: "none", color: card.favorite ? "#ffc832" : "#555", cursor: "pointer", fontSize: 16 }}
                      >
                        ★
                      </button>
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
