import React, { useState, useEffect } from 'react';
import { Info, Thermometer, Droplets, Flame } from 'lucide-react';
import type { Card } from '../../binder/types';
import { sound } from '../../../services/sound';

interface ThermalPressStationProps {
  activeCard: Card;
  cardWarpAngle: number;
  onWarpAngleChange: (angle: number | ((prev: number) => number)) => void;
}

/**
 * Thermal Press Station
 * 
 * Station 1 in the Restoration Studio. Allows users to apply heat and pressure
 * to fix card warping.
 */
export default function ThermalPressStation({
  activeCard,
  cardWarpAngle,
  onWarpAngleChange
}: ThermalPressStationProps) {
  const [targetTemp, setTargetTemp] = useState<number>(35); // 50-60 target
  const [steamLevel, setSteamLevel] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [pressHoldTimer, setPressHoldTimer] = useState<number>(0);

  // Station 1: Pressing lever hold effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPressing) {
      interval = setInterval(() => {
        setPressHoldTimer(prev => {
          const next = prev + 1;
          sound.playAirBlower();
          if (targetTemp >= 48 && targetTemp <= 65 && steamLevel > 0) {
            onWarpAngleChange((angle: number) => Math.max(0, angle - 6));
          }
          if (next >= 4) {
            setIsPressing(false);
            onWarpAngleChange(0);
            sound.playLaserScan();
          }
          return next;
        });
      }, 500);
    } else {
      setPressHoldTimer(0);
    }
    return () => clearInterval(interval);
  }, [isPressing, targetTemp, steamLevel, onWarpAngleChange]);

  const handleApplySteam = () => {
    sound.playAirBlower();
    setSteamLevel(100);
  };

  const handleAutoFlatten = () => {
    sound.playAirBlower();
    setTargetTemp(55);
    setSteamLevel(100);
    sound.playLaserScan();
    onWarpAngleChange(0);
  };

  return (
    <div className="relative flex flex-col items-center max-w-md w-full my-auto">
      {/* Card Display Canvas */}
      <div
        className="relative w-48 sm:w-60 md:w-72 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 select-none group transition-transform duration-300 shrink-0 touch-none"
        style={{
          transform: `rotateY(${cardWarpAngle}deg) rotateX(${cardWarpAngle * 0.4}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        <img
          src={activeCard.imageUrl}
          alt={activeCard.name}
          className="w-full h-full object-cover block pointer-events-none"
          draggable={false}
        />

        {/* Station 1: Thermal Steam Effect */}
        {steamLevel > 0 && (
          <div className="absolute inset-0 bg-white/20 pointer-events-none animate-pulse flex items-center justify-center">
            <span className="text-[10px] font-bold text-black bg-white/90 px-2.5 py-0.5 rounded-full shadow-lg">
              ♨️ Steam Applied ({steamLevel}%)
            </span>
          </div>
        )}
      </div>

      {/* Station 1: Thermal Press Controls */}
      <div className="mt-3 md:mt-4 w-full">
        <div className="p-3 rounded-2xl bg-black/80 border border-amber-500/30 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold border-b border-white/10 pb-1.5">
            <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Goal: Flatten foil curve to 0° (Current: {cardWarpAngle}°)</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-300 font-medium">Temperature:</span>
            <span className={`font-mono font-bold ${targetTemp >= 48 && targetTemp <= 65 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {targetTemp}°C {targetTemp >= 48 && targetTemp <= 65 ? '(IDEAL TARGET)' : '(Target: 50°C-65°C)'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
            <input
              type="range"
              min="30"
              max="80"
              value={targetTemp}
              onChange={e => setTargetTemp(Number(e.target.value))}
              className="flex-1 accent-amber-400 cursor-pointer"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApplySteam}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                steamLevel > 0 ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300' : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/20'
              }`}
            >
              <Droplets className="w-3.5 h-3.5" />
              <span>{steamLevel > 0 ? '✓ Steam Ready' : '1. Inject Steam'}</span>
            </button>

            <button
              onPointerDown={() => setIsPressing(true)}
              onPointerUp={() => setIsPressing(false)}
              onPointerLeave={() => setIsPressing(false)}
              className={`flex-1 py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer select-none ${
                isPressing ? 'bg-red-500/40 border-red-400 text-red-200 scale-95' : 'bg-red-500/20 border-red-500/40 text-red-300 hover:bg-red-500/30'
              }`}
            >
              <Thermometer className="w-3.5 h-3.5" />
              <span>{isPressing ? 'PRESSING...' : '2. Hold Press'}</span>
            </button>
            
            <button
              onClick={handleAutoFlatten}
              className="flex-1 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20 cursor-pointer hover:brightness-110"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>🔥 1-Click Flatten</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
