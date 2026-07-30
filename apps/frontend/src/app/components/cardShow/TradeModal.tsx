import React, { useState, useEffect } from "react";
import {
  Coins,
  X,
  Wallet,
  Repeat,
  Search,
  Check,
  CheckCircle2
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

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const payFullCash = () => {
    setCashStr(String(price));
    setSelected(new Set());
  };

  const autoPickTrade = () => {
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
    <div className="fixed inset-0 z-[500] bg-black/80 flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#0b0e13] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#0e1117] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Coins className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">Complete Your Purchase</h3>
              <p className="text-[10px] font-mono text-[#94a3b8]">Pay with cash, trade cards, or both</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={done}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <h4 className="text-lg font-black text-white">Purchase Complete!</h4>
            <p className="text-xs text-[#94a3b8] font-mono">
              {target.name} added to your collection{selected.size > 0 ? ` • ${selected.size} card(s) traded in` : ""}.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Vendor card summary */}
            <div className="flex items-center gap-3 bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <img
                src={target.img}
                alt={target.name}
                className="w-16 h-[88px] sm:w-20 sm:h-[112px] object-cover rounded-md border border-white/10 bg-black"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-wider truncate">{vendorName}</p>
                <h4 className="text-sm sm:text-base font-black text-white truncate">{target.name}</h4>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-500/50 text-amber-300 font-bold">
                  {target.grade}
                </span>
                <div className="mt-2 text-2xl font-black text-white font-mono">${price.toLocaleString()}</div>
              </div>
            </div>

            {/* Cash payment */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Pay with Cash
                </span>
                <span className="text-[11px] font-mono text-[#94a3b8]">
                  Balance: <span className="text-white font-bold">${cashBalance.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  value={cashStr}
                  onChange={(e) => setCashStr(e.target.value)}
                  className="flex-1 bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="0"
                />
                <button
                  onClick={payFullCash}
                  className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-[#38bdf8] transition-all"
                >
                  Pay Full
                </button>
              </div>
              {!cashOk && (
                <p className="text-[10px] text-rose-400 font-mono mt-1.5">⚠ Cash entered exceeds your balance.</p>
              )}
            </div>

            {/* Trade-in cards */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Repeat className="w-4 h-4 text-teal-400" /> Trade In Cards
                  <span className="text-[11px] font-mono text-[#94a3b8]">
                    ({selected.size} selected · <span className="text-teal-300 font-bold">${tradeValue.toLocaleString()}</span>)
                  </span>
                </span>
                <button
                  onClick={autoPickTrade}
                  disabled={owned.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-teal-300 transition-all disabled:opacity-40"
                >
                  Auto-Cover
                </button>
              </div>

              {owned.length === 0 ? (
                <p className="text-[11px] text-[#64748b] font-mono py-4 text-center">
                  You have no cards in your collection to trade. Pay with cash instead.
                </p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your cards..."
                      className="w-full bg-black/40 border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredOwned.map((c) => {
                      const isSel = selected.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleSelect(c.id)}
                          className={`relative rounded-lg border p-1.5 flex flex-col items-center text-center transition-all ${
                            isSel
                              ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : "border-[#1e293b] bg-black/30 hover:border-teal-400/60"
                          }`}
                        >
                          {isSel && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow">
                              <Check className="w-3 h-3 text-slate-950" />
                            </span>
                          )}
                          <div className="w-full aspect-[3/4] bg-black rounded overflow-hidden mb-1">
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                            />
                          </div>
                          <span className="text-[9px] text-white font-bold leading-tight line-clamp-2 w-full">{c.name}</span>
                          <span className="text-[9px] font-mono text-teal-300 font-bold mt-0.5">${(c.currentPrice || 0).toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Summary / Complete */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Price</span>
                <span className="text-white font-black">${price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Cash Applied</span>
                <span className="text-emerald-400 font-black">${cashPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Trade Value</span>
                <span className="text-teal-300 font-black">${tradeTowardPrice.toLocaleString()}</span>
              </div>
              {change > 0 && (
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#94a3b8]">Change Due</span>
                  <span className="text-amber-300 font-black">${change.toLocaleString()}</span>
                </div>
              )}
              {remaining > 0 && (
                <p className="text-[10px] text-rose-400 font-mono">⚠ Still need ${remaining.toLocaleString()} to complete.</p>
              )}
              <button
                onClick={complete}
                disabled={!canComplete}
                className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete Purchase
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
