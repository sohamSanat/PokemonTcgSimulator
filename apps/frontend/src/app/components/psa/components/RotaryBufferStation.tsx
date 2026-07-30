import React, { useState } from 'react';
import { Disc, Gauge, Sparkles } from 'lucide-react';
import type { Card } from '../../binder/types';
import type { ScuffSpot } from '../types';
import { sound } from '../../../services/sound';

interface RotaryBufferStationProps {
  activeCard: Card;
  scuffSpots: ScuffSpot[];
  onScuffSpotsChange: (scuffs: ScuffSpot[] | ((prev: ScuffSpot[]) => ScuffSpot[])) => void;
}

/**
 * Rotary Buffer Station
 * 
 * Station 3 in the Restoration Studio. Allows users to polish holographic
 * scuffs using an electric buffer.
 */
export default function RotaryBufferStation({
  activeCard,
  scuffSpots,
  onScuffSpotsChange
}: RotaryBufferStationProps) {
  const [isDrawingInk, setIsDrawingInk] = useState<boolean>(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });
  const [bufferRPM, setBufferRPM] = useState<number>(3500); // 1000 - 8000 RPM

  const handleCardPointerInteraction = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    setMousePos({ x, y });

    if (e.buttons === 1 || isDrawingInk || e.pointerType === 'touch') {
      sound.playUltrasonicWeldPulse();
      onScuffSpotsChange((prev: ScuffSpot[]) => prev.map(s => {
        const dist = Math.hypot(s.x - x, s.y - y);
        if (dist < 25) { // High touch sensitivity
          if (!s.pasted) {
            return { ...s, pasted: true };
          }
          if (s.pasted && !s.buffed) {
            const buffRate = (bufferRPM / 8000) * 15; 
            const newProg = Math.min(100, s.buffProgress + buffRate);
            if (newProg >= 100) sound.playLaserScan();
            return {
              ...s,
              buffProgress: newProg,
              buffed: newProg >= 100
            };
          }
        }
        return s;
      }));
    }
  };

  const handleBuffAllScuffs = () => {
    sound.playLaserScan();
    onScuffSpotsChange((prev: ScuffSpot[]) => prev.map(s => ({ ...s, pasted: true, buffProgress: 100, buffed: true })));
  };

  const buffedSpots = scuffSpots.filter(s => s.buffed).length;

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

        {/* Station 3: Touch & Pointer Rotary Buffing Overlays */}
        <div className="absolute inset-0">
          {scuffSpots.map(s => (
            <div
              key={s.id}
              onClick={(e) => {
                e.stopPropagation();
                sound.playLaserScan();
                onScuffSpotsChange((prev: ScuffSpot[]) => prev.map(item => item.id === s.id ? { ...item, pasted: true, buffProgress: 100, buffed: true } : item));
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-20"
              style={{ left: `${s.x}%`, top: `${s.y}%` }}
            >
              {s.buffed ? (
                <div className="w-8 h-8 rounded-full border-2 border-amber-300 bg-gradient-to-tr from-amber-400/30 via-purple-500/30 to-amber-300/30 shadow-[0_0_20px_rgba(245,158,11,0.9)] flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
                </div>
              ) : s.pasted ? (
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-white/90 border border-purple-400 shadow-md flex items-center justify-center text-[8px] font-bold text-black">
                    Buff
                  </div>
                  <div className="w-10 h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/30 mt-0.5">
                    <div className="h-full bg-purple-400" style={{ width: `${s.buffProgress}%` }} />
                  </div>
                </div>
              ) : (
                <div className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[8px] font-bold border border-white animate-bounce shadow-md">
                  💧 Tap Paste
                </div>
              )}
            </div>
          ))}

          {/* Spinning Rotary Buffer Tool */}
          <div
            className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 z-10"
            style={{
              left: `${mousePos.x}%`,
              top: `${mousePos.y}%`,
            }}
          >
            <div
              className="w-12 h-12 rounded-full border-4 border-dashed border-purple-400 bg-purple-600/40 shadow-[0_0_25px_rgba(168,85,247,0.8)] flex items-center justify-center"
              style={{
                animation: `psa-buffer-spin ${(60 / Math.max(1, bufferRPM)).toFixed(3)}s linear infinite`,
              }}
            >
              <Disc className="w-6 h-6 text-purple-200" />
            </div>
          </div>
        </div>
      </div>

      {/* Station 3: Electric Rotary Polisher Controls */}
      <div className="mt-3 md:mt-4 w-full">
        <div className="p-3 rounded-2xl bg-black/80 border border-purple-500/30 space-y-2.5">
          <div className="flex items-center justify-between text-xs text-purple-300 font-bold border-b border-white/10 pb-1.5">
            <span className="flex items-center gap-1">
              <Disc className="w-3.5 h-3.5 text-purple-400 animate-spin" />
              <span>Rotary Polisher Control ({bufferRPM} RPM)</span>
            </span>
            <span className="text-gray-300 font-mono text-[11px]">{buffedSpots}/{scuffSpots.length} Mirror Glare</span>
          </div>

          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-purple-400 shrink-0" />
            <input
              type="range"
              min="1000"
              max="8000"
              step="500"
              value={bufferRPM}
              onChange={e => setBufferRPM(Number(e.target.value))}
              className="flex-1 accent-purple-400 cursor-pointer"
            />
            <span className="text-xs font-mono font-bold text-purple-300 w-16 text-right">{bufferRPM} RPM</span>
          </div>

          <button
            onClick={handleBuffAllScuffs}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-400 to-purple-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-lg cursor-pointer hover:brightness-110"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ Mirror Polish All Scuffs (1-Click)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
