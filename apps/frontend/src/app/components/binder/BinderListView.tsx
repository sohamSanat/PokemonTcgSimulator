/**
 * @file BinderListView.tsx
 * @description Tabular list view component for displaying card collections in a detailed spreadsheet-like format.
 * Displays card image thumbnails, expansion set info, rarity tags, live prices, percentage trends, and inline action buttons.
 */

import React from "react";
import type { Card } from "./types";
import { getCardImageUrl } from "../../services/tcgdex";

interface BinderListViewProps {
  /** Array of cards to render in the table list */
  cards: (Card | null)[];
  /** Inspection modal trigger callback */
  onInspectCard?: (card: Card) => void;
  /** Move card modal trigger callback */
  onMoveCard?: (card: Card) => void;
  /** Favorite toggle callback */
  onToggleFavorite: (id: string) => void;
}

/**
 * BinderListView renders cards as interactive table rows with full details and direct action triggers.
 */
export default function BinderListView({ cards, onInspectCard, onMoveCard, onToggleFavorite }: BinderListViewProps) {
  return (
    <div className="flex-1 overflow-x-auto overflow-y-visible md:overflow-auto bg-white/5 rounded-2xl border border-white/10 p-4 min-h-0 custom-scrollbar">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b border-white/10 text-[#7a7a8a] text-[11px] uppercase tracking-widest">
            <th className="p-2.5 px-3">Card</th>
            <th className="p-2.5 px-3">Set</th>
            <th className="p-2.5 px-3">Rarity</th>
            <th className="p-2.5 px-3">Type</th>
            <th className="p-2.5 px-3">Price</th>
            <th className="p-2.5 px-3">Change</th>
            <th className="p-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {cards.filter((c): c is Card => c !== null).map((card) => {
            const price = card.currentPrice ?? 0;
            const change = card.priceChange ?? 0;
            const positive = change >= 0;
            return (
              <tr 
                key={card.id} 
                className="border-b border-white/5 text-[13px] cursor-pointer transition-colors hover:bg-white/5" 
                onClick={() => onInspectCard && onInspectCard(card)}
              >
                <td className="p-3 flex items-center gap-2.5">
                  <div className="relative w-[34px] h-[47px] flex items-center justify-center shrink-0">
                    <div className="absolute top-[5%] left-[6%] w-[88%] h-[90%] rounded-[2px] border border-white/15 bg-white/5 shadow-[0_1px_2px_rgba(0,0,0,0.4),inset_0_0_2px_rgba(255,255,255,0.05)] z-[1] pointer-events-none" />
                    <img 
                      src={getCardImageUrl(card.imageUrl, 'high')} 
                      alt={card.name} 
                      className="absolute top-[6.5%] left-[7.5%] w-[85%] h-[87%] rounded-[2px] object-cover z-[2]" 
                    />
                    <div className="absolute top-[5%] left-[6%] w-[88%] h-[90%] rounded-[2px] bg-gradient-to-br from-white/15 via-transparent to-white/5 border-t border-white/25 border-l border-white/15 z-[3] pointer-events-none mix-blend-screen" />
                  </div>
                  <span className="font-semibold text-[#f0f0f2]">{card.name}</span>
                </td>
                <td className="p-3 text-[#a0a0b0]">
                  {card.setName} ({card.setNumber})
                </td>
                <td className="p-3">
                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-[11px]">
                    {card.rarity}
                  </span>
                </td>
                <td className="p-3 text-[#a0a0b0]">{card.type}</td>
                <td className="p-3 font-bold text-[#f0f0f2]">${price.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`font-semibold text-xs ${positive ? "text-emerald-400" : "text-red-400"}`}>
                    {positive ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {onMoveCard && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onMoveCard(card);
                        }}
                        title="Move card to another binder"
                        className="px-2 py-1 rounded-md bg-sky-500/15 border border-sky-500/40 text-sky-400 text-[11px] font-semibold cursor-pointer flex items-center gap-1 hover:bg-sky-500/25 transition-colors"
                      >
                        <span>📦 Move</span>
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleFavorite(card.id);
                      }}
                      className={`bg-transparent border-none cursor-pointer text-base transition-colors ${card.favorite ? "text-amber-400 hover:text-amber-300" : "text-zinc-500 hover:text-zinc-400"}`}
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
              <td colSpan={7} className="text-center p-10 text-[#7a7a8a]">
                No cards found in this binder or matching your filters.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
