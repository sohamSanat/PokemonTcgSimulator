/**
 * @file BinderGridView.tsx
 * @description 9-pocket trading card binder grid simulator component.
 * Renders realistic metallic binder D-rings, punched binding spine holes,
 * ultrasonic weld stitching details, and a 3x3 sortable card grid container.
 */

import React from "react";
import type { Card } from "./types";
import CardSlot from "./CardSlot";
import { SortableContext, rectSortingStrategy } from "@dnd-kit/sortable";

interface BinderGridViewProps {
  /** Array of 9 slots representing cards or empty slots on the active binder page */
  gridSlots: (Card | null)[];
  /** Active page number displayed at the bottom of the sheet */
  currentPage: number;
  /** Favorite toggle callback handler */
  onToggleFavorite: (id: string) => void;
  /** Add card/open packs modal trigger callback */
  onAddCard: () => void;
  /** Inspection modal trigger callback */
  onInspectCard?: (card: Card) => void;
  /** Move card to another binder modal trigger callback */
  onMoveCard?: (card: Card) => void;
}

/**
 * BinderGridView component representing a physical 9-pocket card binder page.
 */
export default function BinderGridView({
  gridSlots,
  currentPage,
  onToggleFavorite,
  onAddCard,
  onInspectCard,
  onMoveCard
}: BinderGridViewProps) {
  return (
    <div className="flex-1 overflow-visible md:overflow-y-auto overflow-x-hidden py-3 pb-8 min-h-0 custom-scrollbar">
      <div className="w-full max-w-[900px] mx-auto bg-[radial-gradient(circle_at_center,#1c1c24_0%,#111116_100%)] border-2 border-white/10 rounded-3xl pt-7 pr-7 pb-8 pl-[84px] shadow-[0_40px_120px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.15),0_0_0_1px_rgba(0,0,0,0.8)] relative overflow-visible">
        
        {/* Binder Binding Spine & Metal Rings on LEFT edge */}
        <div className="absolute left-0 top-0 bottom-0 w-[58px] bg-gradient-to-r from-[#0a0a0e] via-[#171720] to-[#0a0a0e] border-r-2 border-black/90 shadow-[6px_0_20px_rgba(0,0,0,0.6),inset_-1px_0_2px_rgba(255,255,255,0.12)] flex flex-col justify-evenly items-center z-10">
          
          {/* Vertical ultrasonic weld stitching lines on spine */}
          <div className="absolute left-2.5 top-3.5 bottom-3.5 w-px border-l border-dashed border-white/15" />
          <div className="absolute right-2.5 top-3.5 bottom-3.5 w-px border-l border-dashed border-white/15" />

          {/* Realistic Metal Binder Rings */}
          {[18, 50, 82].map((pct) => (
            <div key={pct} className="relative w-8 h-8 flex items-center justify-center">
              {/* Punched hole in page */}
              <div className="w-[18px] h-[18px] rounded-full bg-[#050507] shadow-[inset_0_2px_5px_rgba(0,0,0,0.95),0_1px_1px_rgba(255,255,255,0.15)]" />
              {/* Chrome Metal D-Ring Clamp */}
              <div className="absolute -left-1.5 w-7 h-2.5 rounded-[5px] bg-gradient-to-b from-white via-zinc-300 to-zinc-700 shadow-[3px_5px_10px_rgba(0,0,0,0.85),inset_0_1px_1px_white] -rotate-6" />
            </div>
          ))}
        </div>

        {/* 9-pocket sheet background texture & grid */}
        <SortableContext items={gridSlots.map((c, i) => c?.id ?? `empty-${i}`)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 relative z-10">
            {gridSlots.slice(0, 9).map((card, i) => (
              <CardSlot 
                key={card?.id ?? `empty-${i}`} 
                card={card} 
                index={i} 
                onToggleFavorite={onToggleFavorite} 
                onAddCard={onAddCard} 
                onInspectCard={onInspectCard} 
                onMoveCard={onMoveCard} 
              />
            ))}
          </div>
        </SortableContext>

        {/* Page number footer */}
        <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] text-white/20 tracking-widest font-bold">
          PAGE {currentPage}
        </div>
      </div>
    </div>
  );
}
