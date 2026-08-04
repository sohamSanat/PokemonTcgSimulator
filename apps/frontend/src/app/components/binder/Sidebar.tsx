import React, { useState, useEffect } from "react";
import { Plus, Trash2, ShieldCheck, Sparkles, TrendingUp, BookOpen, Layers } from "lucide-react";
import type { Binder } from "./types";
import BinderIcon from "./BinderIcon";
import { getProfile, getPackCount, getTrainerTitle } from "./store";

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
  raritiesList?: string[];
}

function Sidebar({
  binders,
  activeBinder,
  onSelectBinder,
  onNewBinder,
  onDeleteBinder,
  totalPortfolioValue,
}: Props) {
  const [userProfile, setUserProfile] = useState(() => getProfile());
  const [packCount, setPackCount] = useState(() => getPackCount());

  useEffect(() => {
    const handleUpdate = () => {
      setUserProfile(getProfile());
      setPackCount(getPackCount());
    };
    handleUpdate();
    window.addEventListener('storage', handleUpdate);
    return () => window.removeEventListener('storage', handleUpdate);
  }, []);

  const displayName = userProfile.displayName || 'Trainer';
  const avatarUrl = userProfile.avatarUrl;
  const trainerTitle = getTrainerTitle(packCount);
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'TP';

  return (
    <aside className="w-full md:w-[310px] md:min-w-[310px] h-auto md:h-full flex flex-col shrink-0 border-b md:border-b-0 md:border-r border-white/10 bg-[#0c0919]/90 backdrop-blur-xl relative z-20">
      {/* Profile Header & Portfolio Dashboard */}
      <div className="hidden md:block pt-6 px-5 pb-0">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-400 p-[1px] shadow-[0_0_20px_rgba(245,158,11,0.3)] shrink-0">
            <div className="w-full h-full rounded-2xl bg-[#0e091b] flex items-center justify-center text-sm font-black text-amber-400 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-extrabold text-white truncate" title={displayName}>
              {displayName}
            </div>
            <div className="text-[11px] text-amber-400 font-bold truncate flex items-center gap-1" title={trainerTitle}>
              <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{trainerTitle}</span>
            </div>
          </div>

          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#10b981] shrink-0" />
        </div>

        {/* Portfolio Value Card */}
        <div className="bg-gradient-to-b from-[#18132e]/90 to-[#100b21]/90 border border-white/10 rounded-2xl p-4 mb-5 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-gray-400 mb-1">
            <span>Portfolio Net Worth</span>
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          </div>

          <div className="text-2xl font-mono font-black text-white">
            ${Math.floor(totalPortfolioValue).toLocaleString()}
            <span className="text-sm text-gray-400">.{((totalPortfolioValue % 1) * 100).toFixed(0).padStart(2, '0')}</span>
          </div>

          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[10px]">
            <span className="text-emerald-400 font-black bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span>LIVE MARKET</span>
            </span>
            <span className="text-gray-400 font-medium">Real-time TCGDex pricing</span>
          </div>
        </div>

        <div className="h-px bg-white/5 mb-4" />
      </div>

      {/* Binder List Selector */}
      <div className="flex-none md:flex-1 w-full overflow-x-auto md:overflow-x-hidden overflow-y-hidden md:overflow-y-auto px-4 py-3 md:pb-5 custom-scrollbar">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-[11px] font-black tracking-wider text-gray-400 uppercase flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>MY BINDERS</span>
            <span className="bg-amber-500/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold">
              {binders.length}
            </span>
          </div>

          <div className="md:hidden text-[11px] font-mono font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
            ${(totalPortfolioValue || 0).toLocaleString()}
          </div>
        </div>

        {/* Binder Cards List */}
        <div className="flex flex-row md:flex-col gap-2.5 w-max md:w-full pb-2 md:pb-0">
          {binders.map((binder) => {
            const isActive = activeBinder === binder.id;
            const isDefault = binder.id === 'my-collection';
            const isMaster = binder.isMasterSet || binder.name.includes('Master Set');
            const totalSetCards = binder.totalCardsInSet || 100;
            const completionPct = isMaster ? Math.min(100, Math.round((binder.count / totalSetCards) * 100)) : 0;

            return (
              <div
                key={binder.id}
                onClick={() => onSelectBinder(binder.id)}
                role="button"
                tabIndex={0}
                className={`flex items-center gap-3 p-3 rounded-2xl w-[210px] md:w-full shrink-0 cursor-pointer transition-all duration-200 relative overflow-hidden text-left group ${
                  isMaster
                    ? isActive
                      ? "border border-amber-400 bg-gradient-to-br from-amber-500/20 via-purple-900/30 to-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.25)]"
                      : "border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent hover:border-amber-500/60 hover:bg-amber-500/15"
                    : isActive
                    ? "border border-amber-400/60 bg-gradient-to-br from-amber-500/15 via-orange-500/10 to-[#18132e] shadow-lg"
                    : "border border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/15"
                }`}
              >
                {/* Binder Icon */}
                <div className="scale-75 md:scale-100 origin-left shrink-0">
                  <BinderIcon name={binder.name} isMasterSet={binder.isMasterSet} isActive={isActive} />
                </div>

                {/* Binder Info */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs md:text-sm truncate mb-0.5 ${
                    isMaster ? "font-black text-amber-300" : isActive ? "font-bold text-amber-400" : "font-semibold text-white"
                  }`}>
                    {binder.name}
                  </div>

                  {isMaster ? (
                    <div className="space-y-1">
                      <div className="text-[10px] text-amber-200/90 font-mono font-bold flex items-center justify-between">
                        <span>{binder.count}/{totalSetCards} ({completionPct}%)</span>
                        <span className="text-emerald-400 font-black">
                          ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                        </span>
                      </div>
                      <div className="w-full bg-black/50 h-1.5 rounded-full overflow-hidden border border-white/10">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1.5">
                      <span>{binder.count} {binder.count === 1 ? 'card' : 'cards'}</span>
                      <span>•</span>
                      <span className="text-emerald-400 font-bold">
                        ${(binder.value || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                {!isDefault && onDeleteBinder && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteBinder(binder.id);
                    }}
                    title="Delete Binder"
                    className="w-7 h-7 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center text-xs cursor-pointer transition-all hover:bg-red-500/30 hover:border-red-500/60 hover:text-red-300 shrink-0 opacity-0 group-hover:opacity-100 z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Active Indicator Arrow */}
                {isActive && (
                  <div className="hidden md:flex w-5 h-5 rounded-md items-center justify-center text-xs font-black text-amber-400 shrink-0">
                    →
                  </div>
                )}
              </div>
            );
          })}

          {/* Create New Binder CTA */}
          <button
            onClick={onNewBinder}
            className="flex items-center justify-center gap-2 w-[160px] md:w-full p-3 rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-400 text-amber-400 text-xs font-black uppercase tracking-wider transition-all shrink-0 mt-0 md:mt-2 cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Binder</span>
          </button>
        </div>
      </div>
    </aside>
  );
}

export default React.memo(Sidebar);
