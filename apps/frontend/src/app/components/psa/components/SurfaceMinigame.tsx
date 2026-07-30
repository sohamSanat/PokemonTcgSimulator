import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Zap, Eye, AlertTriangle, CheckCircle2, Radio, ChevronRight } from 'lucide-react';
import { sound } from '../../../services/sound';
import type { Card } from '../../binder/types';
import type { SurfaceZone } from '../types';
import { initializeSurfaceZones } from '../gradingLogic';

interface SurfaceMinigameProps {
  activeCard: Card;
  surfaceScore: number;
  onNextStep: () => void;
}

/**
 * Surface Minigame
 * 
 * A grading stage where the user scans the card surface with a UV light
 * to identify hidden scratches or print defects.
 */
export default function SurfaceMinigame({ activeCard, surfaceScore, onNextStep }: SurfaceMinigameProps) {
  const [surfaceTool, setSurfaceTool] = useState<'uv' | 'glare'>('uv');
  const [surfaceZones, setSurfaceZones] = useState<SurfaceZone[]>([]);

  // Initialize or reset zones when card or score changes
  useEffect(() => {
    setSurfaceTool('uv');
    setSurfaceZones(initializeSurfaceZones(surfaceScore));
  }, [surfaceScore, activeCard]);

  const handleScanZone = (id: number) => {
    sound.playUVScan();
    setSurfaceZones(prev => prev.map(z => z.id === id ? { ...z, checked: true } : z));
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
      <div className={`relative w-72 sm:w-80 aspect-[63/88] rounded-2xl border-2 transition-all shadow-2xl overflow-hidden shrink-0 flex items-center justify-center select-none ${
        surfaceTool === 'uv' 
          ? 'border-purple-500 shadow-[0_0_60px_rgba(168,85,247,0.6)] bg-[#0d051a]' 
          : 'border-amber-400 shadow-[0_0_50px_rgba(245,158,11,0.4)] bg-[#1a1405]'
      }`}>
        <img 
          src={activeCard.imageUrl} 
          alt={activeCard.name} 
          className={`w-full h-full object-cover transition-all duration-500 ${
            surfaceTool === 'uv' ? 'brightness-125 contrast-150 hue-rotate-45 saturate-150' : 'brightness-110 contrast-125 saturate-110'
          }`}
        />

        {/* Interactive Zone Scan Hotspots on Card */}
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-auto">
          {surfaceZones.map((zone) => (
            <motion.div
              key={zone.id}
              onClick={() => handleScanZone(zone.id)}
              whileHover={{ scale: 1.04 }}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                zone.checked
                  ? zone.defectFound
                    ? 'bg-red-950/90 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-emerald-950/90 border-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]'
                  : 'bg-black/70 border-white/30 hover:border-purple-400 animate-pulse'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-xs ${
                  zone.checked
                    ? zone.defectFound ? 'bg-red-600 text-white' : 'bg-emerald-500 text-black'
                    : 'bg-purple-600 text-white'
                }`}>
                  {zone.checked ? (zone.defectFound ? '!' : '✓') : zone.id}
                </div>
                <span className="text-[11px] font-black text-white">{zone.name}</span>
              </div>
              <span className="text-[10px] font-mono font-bold text-purple-300">
                {zone.checked ? (zone.defectFound ? 'DEFECT' : 'CLEAR') : 'SCAN ZONE'}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Tool banner */}
        <div className="absolute bottom-2 inset-x-2 bg-black/80 py-1 px-2.5 rounded-xl border border-purple-500/40 flex items-center justify-between text-[10px] z-20 pointer-events-none">
          <span className="text-purple-300 font-mono font-bold flex items-center gap-1">
            ⚡ {surfaceTool === 'uv' ? '365nm UV BLACKLIGHT ACTIVE' : 'HALOGEN GLARE REFLECTION ACTIVE'}
          </span>
          <span className="font-bold text-white">{surfaceZones.filter(z => z.checked).length}/3 ZONES</span>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-purple-400">
          <Search className="w-4 h-4" /> Step 3 of 5: UV Blacklight Zone Defect Check
        </div>
        <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          Click all 3 inspection zones across the holofoil header, character illustration, and bottom text box under 365nm UV Blacklight to expose hidden print lines or clouding.
        </p>

        {/* Tool Mode selector */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => { sound.playUVScan(); setSurfaceTool('uv'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              surfaceTool === 'uv'
                ? 'bg-purple-600/30 border-purple-400 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-black">UV Blacklight</span>
            </div>
          </button>
          <button
            onClick={() => { sound.playButtonClick(); setSurfaceTool('glare'); }}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              surfaceTool === 'glare'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-black">Halogen Glare</span>
            </div>
          </button>
        </div>

        {/* Zone Results List */}
        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 space-y-2 max-h-48 overflow-y-auto">
          <div className="text-xs font-bold text-gray-300 flex items-center justify-between border-b border-white/10 pb-1.5">
            <span>Inspection Checklist:</span>
            <span className="text-purple-300 font-mono font-black">SUB-GRADE: {surfaceScore.toFixed(1)}/10</span>
          </div>
          {surfaceZones.map(zone => (
            <div key={zone.id} className="text-[11px] flex items-start gap-2 pt-1">
              <span className="mt-0.5">
                {zone.checked ? (zone.defectFound ? <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />) : <Radio className="w-3.5 h-3.5 text-gray-500 shrink-0" />}
              </span>
              <div>
                <div className="font-bold text-white">{zone.label}</div>
                <div className={`text-[10px] ${zone.checked ? (zone.defectFound ? 'text-red-300' : 'text-emerald-300') : 'text-gray-500 font-italic'}`}>
                  {zone.checked ? zone.note : 'Not scanned yet (click zone above)'}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setSurfaceZones(prev => prev.map(z => ({ ...z, checked: true })))}
            className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
          >
            Scan All
          </button>
          <button
            onClick={() => { sound.playLaserScan(); onNextStep(); }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Verify Surface & Next Step</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
