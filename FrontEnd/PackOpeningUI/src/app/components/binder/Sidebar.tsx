import React from "react";
import type { Binder } from "./types";

interface Props {
  binders: Binder[];
  activeBinder: string;
  onSelectBinder: (id: string) => void;
  onNewBinder: () => void;
  onDeleteBinder?: (id: string) => void;
  activeSetFilter?: string;
  onSetFilterChange?: (s: string) => void;
  activeRarityFilter?: string;
  onRarityFilterChange?: (r: string) => void;
  activeTypeFilter?: string;
  onTypeFilterChange?: (t: string) => void;
  holofoilOnly?: boolean;
  onToggleHolofoil?: () => void;
  favoritesOnly?: boolean;
  onToggleFavorites?: () => void;
  totalCardsCount: number;
  totalPortfolioValue: number;
  setsList?: string[];
}

const BinderIcon = React.memo(({ name, isActive }: { name: string; isActive?: boolean }) => {
  const colors: Record<string, string> = {
    "My Collection (Opened)": "linear-gradient(135deg, #10b981, #059669)",
    "Chase Cards": "linear-gradient(135deg, #f59e0b, #d97706)",
    "Charizard Collection": "linear-gradient(135deg, #ef4444, #b91c1c)",
    "Master Set — SV": "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    "Evolving Skies": "linear-gradient(135deg, #3b82f6, #1d4ed8)",
  };
  const icons: Record<string, string> = {
    "My Collection (Opened)": "🌟",
    "Chase Cards": "🔥",
    "Charizard Collection": "🐉",
    "Master Set — SV": "👑",
    "Evolving Skies": "⚡",
  };
  return (
    <div
      style={{
        width: 44,
        height: 44,
        borderRadius: 12,
        background: colors[name] || "linear-gradient(135deg, #6366f1, #4f46e5)",
        border: isActive ? "1px solid rgba(255,255,255,0.4)" : "1px solid rgba(255,255,255,0.15)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 20,
        color: "white",
        fontWeight: "bold",
        boxShadow: isActive ? "0 0 16px rgba(245,158,11,0.35)" : "0 2px 8px rgba(0,0,0,0.3)",
        transition: "transform 0.2s",
        transform: isActive ? "scale(1.05)" : "scale(1)"
      }}
    >
      {icons[name] || "📁"}
    </div>
  );
});

function Sidebar({
  binders,
  activeBinder,
  onSelectBinder,
  onNewBinder,
  onDeleteBinder,
  totalCardsCount,
  totalPortfolioValue,
}: Props) {
  return (
    <aside
      className="w-full md:w-[300px] md:min-w-[300px] h-auto md:h-full flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-white/10"
      style={{
        background: "rgba(20, 20, 26, 0.6)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Profile header */}
      <div style={{ padding: "24px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #f59e0b, #ea580c)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 700,
              color: "white",
              boxShadow: "0 4px 12px rgba(245,158,11,0.3)"
            }}
          >
            TP
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#f0f0f2" }}>TrainerPro</div>
            <div style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500 }}>Elite Collector</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#10b981", boxShadow: "0 0 10px #10b981"
            }} />
          </div>
        </div>

        {/* Portfolio value */}
        <div
          style={{
            background: "linear-gradient(135deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            padding: "16px 18px",
            marginBottom: 24,
            boxShadow: "0 10px 30px rgba(0,0,0,0.3)"
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", color: "#a1a1aa", textTransform: "uppercase", marginBottom: 6 }}>
            Portfolio Value
          </div>
          <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.03em", color: "#f0f0f2" }}>
            ${Math.floor(totalPortfolioValue).toLocaleString()}<span style={{ fontSize: 18, color: "#a1a1aa" }}>.{((totalPortfolioValue % 1) * 100).toFixed(0).padStart(2, '0')}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <span style={{
              fontSize: 11, color: "#10b981", fontWeight: 700,
              background: "rgba(16,185,129,0.15)", borderRadius: 6, padding: "2px 8px"
            }}>
              ▲ Active
            </span>
            <span style={{ fontSize: 11, color: "#a1a1aa", fontWeight: 500 }}>live tracking</span>
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 20px 18px" }} />

      {/* Binder list - Uncluttered, Spacious, and User-Friendly */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-5 max-h-[35vh] md:max-h-none custom-scrollbar">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 6px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.15em", color: "#a1a1aa", textTransform: "uppercase", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📁 MY BINDERS</span>
            <span style={{ background: "rgba(255,255,255,0.1)", color: "white", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 700 }}>{binders.length}</span>
          </div>
        </div>

        {binders.map((binder) => {
          const isActive = activeBinder === binder.id;
          const isDefault = binder.id === 'my-collection';
          return (
            <div
              key={binder.id}
              onClick={() => onSelectBinder(binder.id)}
              role="button"
              tabIndex={0}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "12px 14px",
                borderRadius: 14,
                border: isActive ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid rgba(255, 255, 255, 0.05)",
                cursor: "pointer",
                background: isActive
                  ? "linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(249, 115, 22, 0.08))"
                  : "rgba(255, 255, 255, 0.025)",
                marginBottom: 8,
                transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                textAlign: "left",
                boxShadow: isActive ? "0 4px 20px rgba(245, 158, 11, 0.15)" : "none",
                position: "relative",
                overflow: "hidden"
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.025)";
                  e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
                }
              }}
            >
              {/* Binder Icon */}
              <BinderIcon name={binder.name} isActive={isActive} />

              {/* Binder Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? "#fbbf24" : "#f4f4f5",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  marginBottom: 3
                }}>
                  {binder.name}
                </div>
                <div style={{ fontSize: 11, color: "#a1a1aa", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{binder.count} {binder.count === 1 ? 'card' : 'cards'}</span>
                  <span>•</span>
                  <span style={{ color: "#34d399", fontWeight: 700 }}>
                    ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Delete Binder Button */}
              {!isDefault && onDeleteBinder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteBinder(binder.id);
                  }}
                  title="Delete Binder"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "#f87171",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    flexShrink: 0,
                    marginRight: isActive ? 4 : 0
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
                    e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                    e.currentTarget.style.color = "#f87171";
                  }}
                >
                  🗑️
                </button>
              )}

              {/* Active Indicator Arrow */}
              {isActive && (
                <div style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  background: "rgba(245, 158, 11, 0.2)",
                  color: "#fbbf24",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 13,
                  fontWeight: "bold",
                  flexShrink: 0
                }}>
                  →
                </div>
              )}
            </div>
          );
        })}

        <button
          onClick={onNewBinder}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            width: "100%",
            padding: "12px 14px",
            borderRadius: 14,
            border: "1px dashed rgba(245,158,11,0.4)",
            cursor: "pointer",
            background: "rgba(245,158,11,0.05)",
            color: "#fbbf24",
            fontSize: 13,
            fontWeight: 700,
            marginTop: 12,
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(245,158,11,0.15)";
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.8)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(245,158,11,0.05)";
            e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)";
          }}
        >
          <span style={{ fontSize: 16 }}>➕</span> Create New Binder
        </button>
      </div>

      {/* Stats footer */}
      <div style={{
        padding: "16px 20px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.2)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        {[[String(totalCardsCount), "Cards"], [String(binders.length), "Binders"], ["100%", "Active"]].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "white" }}>{val}</div>
            <div style={{ fontSize: 10, color: "#a1a1aa", fontWeight: 600, marginTop: 2 }}>{lbl}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
