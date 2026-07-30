import React, { useState } from 'react';
import { PenTool } from 'lucide-react';
import type { Card } from '../../binder/types';
import type { EdgeDing } from '../types';
import { sound } from '../../../services/sound';

interface EdgeRepairStationProps {
  activeCard: Card;
  edgeDings: EdgeDing[];
  onEdgeDingsChange: (dings: EdgeDing[] | ((prev: EdgeDing[]) => EdgeDing[])) => void;
}

/**
 * Edge Repair Station
 * 
 * Station 2 in the Restoration Studio. Allows users to use a touch-up pen
 * to seal and repair edge whitening or dings.
 */
export default function EdgeRepairStation({
  activeCard,
  edgeDings,
  onEdgeDingsChange
}: EdgeRepairStationProps) {
  const [isDrawingInk, setIsDrawingInk] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const handleCardPointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });

    if (e.buttons === 1 || isDrawingInk || e.pointerType === 'touch') {
      onEdgeDingsChange((prev: EdgeDing[]) => prev.map(d => {
        if (d.repaired) return d;
        const dist = Math.hypot(d.x - x, d.y - y);
        if (dist < 28) { // High touch sensitivity
          sound.playClothWipe();
          const newProgress = Math.min(100, d.progress + 35);
          return {
            ...d,
            progress: newProgress,
            repaired: newProgress >= 100
          };
        }
        return d;
      }));
    }
  };

  const handleFixAllEdgeDings = () => {
    sound.playClothWipe();
    onEdgeDingsChange((prev: EdgeDing[]) => prev.map(d => ({ ...d, progress: 100, repaired: true })));
  };

  const repairedDings = edgeDings.filter(d => d.repaired).length;

  return (
    <div className="relative flex flex-col items-center max-w-md w-full my-auto">
      {/* Card Display Canvas with Screen Touch & Pointer Support */}
      <div
        onPointerDown={(e) => {
          setIsDrawingInk(true);
          handleCardPointerInteraction(e);
        }}
        onPointerUp={() => setIsDrawingInk(false)}
        onPointerMove={handleCardPointerInteraction}
        className="relative w-48 sm:w-60 md:w-72 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 select-none group transition-transform duration-300 shrink-0 cursor-crosshair touch-none"
      >
        <img
          src={activeCard.imageUrl}
          alt={activeCard.name}
          className="w-full h-full object-cover block pointer-events-none"
          draggable={false}
        />

        {/* Station 2: Touch & Pointer Edge Ink Pen Trail */}
        <div className="absolute inset-0">
          {edgeDings.map(d => (
            <div
              key={d.id}
              onClick={(e) => {
                e.stopPropagation();
                sound.playClothWipe();
                onEdgeDingsChange((prev: EdgeDing[]) => prev.map(item => item.id === d.id ? { ...item, progress: 100, repaired: true } : item));
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-1 transition-all cursor-pointer z-20"
              style={{ left: `${d.x}%`, top: `${d.y}%` }}
            >
              {d.repaired ? (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-black text-[9px] font-black border border-white shadow-lg">
                  ✓ Sealed
                </span>
              ) : (
                <div className="flex flex-col items-center">
                  <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[8px] font-black border border-white animate-bounce shadow-lg">
                    🖌️ Touch {d.edge} ({d.progress}%)
                  </span>
                  <div className="w-12 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/30 mt-0.5">
                    <div className="h-full bg-cyan-400" style={{ width: `${d.progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Floating Pen Nib Cursor */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
            style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
          >
            <div className="w-8 h-8 rounded-full bg-cyan-400/30 border-2 border-cyan-300 flex items-center justify-center shadow-[0_0_15px_rgba(34,211,238,0.8)]">
              <PenTool className="w-4 h-4 text-cyan-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Station 2: Edge Whitening Ink Pen Controls */}
      <div className="mt-3 md:mt-4 w-full">
        <div className="p-3 rounded-2xl bg-black/80 border border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-cyan-300 font-bold border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1">
              <PenTool className="w-3.5 h-3.5 text-cyan-400" />
              <span>Touch or Drag Pen Along Card Borders</span>
            </span>
            <span className="text-gray-300 font-mono text-[11px]">{repairedDings}/{edgeDings.length} Sealed</span>
          </div>

          <div className="text-[11px] text-gray-300 text-center">
            Tap screen or drag your finger / mouse over the <strong className="text-cyan-300">Edge Dings</strong> to touch up paper wear!
          </div>

          <button
            onClick={handleFixAllEdgeDings}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:brightness-110"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>🖌️ Seal All Border Dings (1-Click)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
