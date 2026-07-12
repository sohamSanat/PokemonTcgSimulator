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
      <div className="hidden md:block">
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
            return (
              <div
                key={binder.id}
                onClick={() => onSelectBinder(binder.id)}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-2.5 md:gap-3 p-2.5 md:p-3 rounded-xl w-[210px] md:w-full shrink-0 cursor-pointer transition-all duration-200 relative overflow-hidden text-left ${isActive
                    ? "border border-amber-500/50 bg-gradient-to-br from-amber-500/15 to-orange-500/10 shadow-[0_4px_20px_rgba(245,158,11,0.15)]"
                    : "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15"
                  }`}
              >
                {/* Binder Icon */}
                <div className="scale-75 md:scale-100 origin-left">
                  <BinderIcon name={binder.name} isActive={isActive} />
                </div>

                {/* Binder Info */}
                <div className="flex-1 min-w-0 -ml-1 md:ml-0">
                  <div className={`text-xs md:text-sm whitespace-nowrap overflow-hidden text-ellipsis mb-0.5 ${isActive ? "font-bold text-amber-400" : "font-semibold text-zinc-100"}`}>
                    {binder.name}
                  </div>
                  <div className="text-[10px] md:text-[11px] text-zinc-400 flex items-center gap-1 md:gap-1.5">
                    <span>{binder.count} {binder.count === 1 ? 'card' : 'cards'}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-bold">
                      ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
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
                    className="w-6 h-6 md:w-7 md:h-7 rounded-md md:rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xs cursor-pointer transition-colors hover:bg-red-500/25 hover:border-red-500/60 hover:text-red-500 shrink-0 mr-1 md:mr-0"
                  >
                    🗑️
                  </button>
                )}

                {/* Active Indicator Arrow */}
                {isActive && (
                  <div className="hidden md:flex w-6 h-6 rounded-md bg-amber-500/20 text-amber-400 items-center justify-center text-xs font-bold shrink-0">
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
      </div>Binder
        </button>
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
