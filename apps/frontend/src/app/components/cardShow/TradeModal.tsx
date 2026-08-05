import React, { useState, useEffect } from "react";
import {
  Coins, X, Wallet, Repeat, Search, Check, CheckCircle2, 
  Sparkles, ArrowRight, ShieldCheck, DollarSign
} from "lucide-react";
import {
  getCollectedCards,
  saveCollectedCard,
  updateCardSlabStatus,
  getCash,
  spendCash,
  removeCollectedCard,
  type Card,
} from '../binder/types';
import { sound } from '../../services/sound';

interface TradeModalProps {
  target: any;
  vendorName?: string;
  onClose: () => void;
  onAddNetReturn?: (amount: number) => void;
}

/**
 * TradeModal Component
 * 
 * Handles vendor purchases via cash, card trade-ins, or a combination of both.
 */
export const TradeModal: React.FC<TradeModalProps> = ({
  target,
  vendorName,
  onClose,
  onAddNetReturn,
}) => {
  const open = Boolean(target);
  const price = target?.price || 0;
  const [owned, setOwned] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cashStr, setCashStr] = useState("0");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setOwned(getCollectedCards());
      setSelected(new Set());
      setCashStr("0");
      setSearch("");
      setDone(false);
    }
  }, [open, target]);

  const cashBalance = getCash();
  const cash = Math.max(0, Number(cashStr) || 0);
  const tradeValue = owned
    .filter((c) => selected.has(c.id))
    .reduce((s, c) => s + (c.currentPrice || 0), 0);
  const covered = cash + tradeValue;
  const cashTowardPrice = Math.max(0, price - tradeValue);
  const cashPaid = Math.min(cash, cashTowardPrice);
  const leftoverCash = Math.max(0, cash - cashPaid);
  const tradeTowardPrice = Math.min(tradeValue, price - cashPaid);
  const change = Math.max(0, leftoverCash + (tradeValue - tradeTowardPrice));
  const remaining = Math.max(0, price - covered);
  const cashOk = cash <= cashBalance;
  const canComplete = covered >= price && cashOk && !done;

  const toggleSelect = (id: string) => {
    sound.playButtonClick();
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const payFullCash = () => {
    sound.playButtonClick();
    setCashStr(String(price));
    setSelected(new Set());
  };

  const autoPickTrade = () => {
    sound.playButtonClick();
    const sorted = [...owned].sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
    const n = new Set<string>();
    let sum = 0;
    for (const c of sorted) {
      if (sum >= price) break;
      n.add(c.id);
      sum += c.currentPrice || 0;
    }
    setSelected(n);
    setCashStr("0");
  };

  const complete = () => {
    if (!canComplete) return;
    sound.playButtonClick();
    sound.playLegendaryFanfare();
    spendCash(cashPaid);
    selected.forEach((id) => removeCollectedCard(id));
    if (change > 0 && onAddNetReturn) onAddNetReturn(change);
    const realMarketPrice = (target as any).marketPrice || target.value || price;
    const newCard = saveCollectedCard(
      {
        marketPrice: realMarketPrice,
        value: realMarketPrice,
        acquiredPrice: price,
        originalValue: price,
        pokemon: {
          id: target.id,
          name: target.name,
          marketPrice: realMarketPrice,
          value: realMarketPrice,
          images: { large: target.img },
          rarity: target.grade || "Rare",
        },
      },
      vendorName || "VINTAGEVAULT TCG"
    );
    if (target.grade && newCard) updateCardSlabStatus(newCard.id, target.grade);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  const filteredOwned = owned.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[500] bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#0c0919]/95 border border-white/15 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden text-white font-sans">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-[#120d24]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-400 p-[1px] shadow-[0_0_20px_rgba(16,185,129,0.3)] shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0b0819] flex items-center justify-center text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-tight">Trade Desk Checkout</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-mono font-bold">
                  {vendorName || 'VENDOR BOOTH'}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-medium">Pay with cash, trade binder cards, or combine both.</p>
            </div>
          </div>

          <button
            onClick={() => { sound.playButtonClick(); onClose(); }}
            disabled={done}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 border border-white/15 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
          {/* Target Item Showcase Banner */}
          <div className="bg-gradient-to-r from-[#18122e] via-[#120d24] to-[#0c0919] p-4 rounded-2xl border border-amber-500/30 flex items-center justify-between gap-4 shadow-lg">
            <div className="flex items-center gap-3.5">
              {target.img && (
                <div className="w-14 h-20 rounded-xl bg-black/60 border border-white/15 overflow-hidden shrink-0 shadow-md">
                  <img src={target.img} alt={target.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest block">Acquiring Item:</span>
                <h4 className="text-base font-black text-white leading-tight">{target.name}</h4>
                {target.grade && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[10px] font-mono font-black">
                    Grade: {target.grade}
                  </span>
                )}
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-gray-400 uppercase block">Required Price</span>
              <span className="text-2xl font-mono font-black text-emerald-400">${price.toFixed(2)}</span>
            </div>
          </div>

          {/* Trade Balance Gauge Bar */}
          <div className="bg-black/50 p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono font-bold">
              <span className="text-gray-400 uppercase tracking-wider text-[10px]">Trade Coverage Meter</span>
              <span className={remaining === 0 ? "text-emerald-400 font-black" : "text-amber-400"}>
                Covered: ${covered.toFixed(2)} / ${price.toFixed(2)} {remaining > 0 ? `(Need $${remaining.toFixed(2)})` : '✅'}
              </span>
            </div>
            <div className="w-full h-3 bg-gray-900 rounded-full overflow-hidden p-0.5 border border-white/10">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (covered / Math.max(1, price)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Cash Input & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#120d24]/90 p-4 rounded-2xl border border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                  <Wallet className="w-4 h-4 text-emerald-400" />
                  <span>Cash Payment</span>
                </span>
                <span className="text-xs font-mono text-gray-400">Balance: ${cashBalance.toFixed(2)}</span>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono font-bold text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  value={cashStr}
                  onChange={(e) => setCashStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-mono font-bold text-white focus:outline-none focus:border-emerald-400/60"
                />
              </div>

              {!cashOk && (
                <p className="text-[11px] text-rose-400 font-medium">Entered cash exceeds your balance (${cashBalance.toFixed(2)})</p>
              )}
            </div>

            <div className="bg-[#120d24]/90 p-4 rounded-2xl border border-white/10 flex flex-col justify-between gap-2">
              <span className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                <Repeat className="w-4 h-4 text-amber-400" />
                <span>Quick Payment Presets</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={payFullCash}
                  className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white transition-all cursor-pointer"
                >
                  Pay All Cash
                </button>
                <button
                  onClick={autoPickTrade}
                  className="flex-1 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all cursor-pointer"
                >
                  Auto Pick Trade
                </button>
              </div>
            </div>
          </div>

          {/* Trade Cards Selector Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Select Binder Cards for Trade-In</span>
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                Selected Trade Value: ${tradeValue.toFixed(2)}
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search binder cards..."
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400/60"
              />
            </div>

            {/* Binder Card Items List */}
            <div className="max-h-56 overflow-y-auto custom-scrollbar space-y-2 pr-1">
              {filteredOwned.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 bg-black/30 rounded-xl border border-dashed border-white/10">
                  No cards available for trade-in.
                </div>
              ) : (
                filteredOwned.map((card) => {
                  const isSelected = selected.has(card.id);
                  const cardPrice = card.currentPrice || 0;

                  return (
                    <div
                      key={card.id}
                      onClick={() => toggleSelect(card.id)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-amber-500/15 border-amber-400 text-amber-200 shadow-md"
                          : "bg-white/5 border-white/5 hover:bg-white/10 text-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected ? "bg-amber-400 border-amber-400 text-black" : "border-white/20 bg-black/40"
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{card.name}</h5>
                          <span className="text-[10px] font-mono text-gray-400">{card.setName || 'Set'} • {card.rarity || 'Card'}</span>
                        </div>
                      </div>

                      <span className="font-mono font-bold text-xs text-emerald-400 shrink-0">
                        ${cardPrice.toFixed(2)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Footer Checkout Trigger */}
        <div className="p-4 border-t border-white/10 bg-[#120d24] shrink-0 flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-mono text-gray-400 uppercase block">Total Covered</span>
            <span className="text-lg font-mono font-black text-emerald-400">${covered.toFixed(2)}</span>
          </div>

          <button
            onClick={complete}
            disabled={!canComplete}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-black font-black text-xs uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.3)] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer active:scale-95"
          >
            {done ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-black" />
                <span>DEAL COMPLETED!</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>COMPLETE TRANSACTION</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
