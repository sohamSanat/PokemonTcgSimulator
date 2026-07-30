import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ZoomIn, CheckCircle2, ChevronRight } from 'lucide-react';
import type { Card } from '../../binder/types';
import { sound } from '../../../services/sound';

interface CornersMinigameProps {
  activeCard: Card;
  cornersScore: number;
  edgesScore: number;
  onNextStep: () => void;
}

const cornerLabels = ['Top-Left Corner (TL)', 'Top-Right Corner (TR)', 'Bottom-Left Corner (BL)', 'Bottom-Right Corner (BR)'];

/**
 * Corners Minigame
 * 
 * The corner inspection stage of the PSA Grading Lab. Users use a loupe
 * to verify the integrity of all four corners.
 */
export default function CornersMinigame({
  activeCard,
  cornersScore,
  edgesScore,
  onNextStep
}: CornersMinigameProps) {
  const [activeCornerIndex, setActiveCornerIndex] = useState<number>(0);
  const [inspectedCorners, setInspectedCorners] = useState<boolean[]>([false, false, false, false]);

  const handleInspectCorner = (idx: number) => {
    sound.playLoupeZoom();
    setActiveCornerIndex(idx);
    setInspectedCorners(prev => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
      {/* 10x Loupe UI Stage */}
      <div className="flex flex-col sm:flex-row items-center gap-6 relative">
        <div className="relative w-64 sm:w-72 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-amber-400/60 shadow-[0_0_45px_rgba(245,158,11,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none">
          <img src={activeCard.imageUrl} alt={activeCard.name} className="w-full h-full object-cover" />
          
          <div className="absolute inset-0 bg-black/40 pointer-events-none" />

          {/* Interactive Loupe Targets on Card Corners */}
          <button
            onClick={() => handleInspectCorner(0)}
            className={`absolute top-2 left-2 w-11 h-11 border-t-2 border-l-2 rounded-tl-xl transition-all flex items-center justify-center cursor-pointer ${
              activeCornerIndex === 0
                ? 'border-amber-400 bg-amber-500/40 scale-110 shadow-[0_0_15px_rgba(245,158,11,1)]'
                : inspectedCorners[0] ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/60 bg-black/50 hover:border-amber-300'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
          <button
            onClick={() => handleInspectCorner(1)}
            className={`absolute top-2 right-2 w-11 h-11 border-t-2 border-r-2 rounded-tr-xl transition-all flex items-center justify-center cursor-pointer ${
              activeCornerIndex === 1
                ? 'border-amber-400 bg-amber-500/40 scale-110 shadow-[0_0_15px_rgba(245,158,11,1)]'
                : inspectedCorners[1] ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/60 bg-black/50 hover:border-amber-300'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
          <button
            onClick={() => handleInspectCorner(2)}
            className={`absolute bottom-2 left-2 w-11 h-11 border-b-2 border-l-2 rounded-bl-xl transition-all flex items-center justify-center cursor-pointer ${
              activeCornerIndex === 2
                ? 'border-amber-400 bg-amber-500/40 scale-110 shadow-[0_0_15px_rgba(245,158,11,1)]'
                : inspectedCorners[2] ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/60 bg-black/50 hover:border-amber-300'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
          <button
            onClick={() => handleInspectCorner(3)}
            className={`absolute bottom-2 right-2 w-11 h-11 border-b-2 border-r-2 rounded-br-xl transition-all flex items-center justify-center cursor-pointer ${
              activeCornerIndex === 3
                ? 'border-amber-400 bg-amber-500/40 scale-110 shadow-[0_0_15px_rgba(245,158,11,1)]'
                : inspectedCorners[3] ? 'border-emerald-400 bg-emerald-500/20' : 'border-white/60 bg-black/50 hover:border-amber-300'
            }`}
          >
            <ZoomIn className="w-4 h-4 text-amber-300 animate-pulse" />
          </button>
        </div>

        {/* 10x Magnifying Loupe Simulated Zoom Box */}
        <div className="w-64 sm:w-72 aspect-square rounded-3xl bg-[#121622] border-2 border-amber-400 p-4 shadow-[0_0_35px_rgba(245,158,11,0.3)] flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono font-black uppercase text-amber-300 border-b border-white/10 pb-2">
            <span className="flex items-center gap-1.5"><ZoomIn className="w-3.5 h-3.5" /> 10X DIGITAL LOUPE ZOOM</span>
            <span className="bg-amber-500/20 px-2 py-0.5 rounded text-white">{cornerLabels[activeCornerIndex].split(' ')[1]}</span>
          </div>

          {/* Simulated magnified corner fiber view */}
          <div className="flex-1 my-3 rounded-2xl bg-black/80 border border-white/15 relative flex items-center justify-center overflow-hidden p-4">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Digital crosshair over loupe */}
            <div className="absolute inset-x-0 top-1/2 h-[1px] bg-amber-400/40 border-t border-dashed border-amber-300" />
            <div className="absolute inset-y-0 left-1/2 w-[1px] bg-amber-400/40 border-l border-dashed border-amber-300" />

            {/* Corner silhouette graphic */}
            <div className={`w-32 h-32 border-4 rounded-3xl flex items-center justify-center transition-all ${
              cornersScore === 10
                ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                : cornersScore >= 8.5
                ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                : 'border-red-500 bg-red-950/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
            }`}>
              <div className="text-center p-2">
                <div className="text-xs font-black text-white">{cornerLabels[activeCornerIndex].split(' ')[0]}</div>
                <div className={`text-[10px] font-mono mt-1 ${cornersScore === 10 ? 'text-emerald-300' : cornersScore >= 8.5 ? 'text-amber-300' : 'text-red-300'}`}>
                  {cornersScore === 10 ? '90.0° CUT ✓' : cornersScore >= 8.5 ? '89.6° MINOR WEAR' : 'WHITENING NICK!'}
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-center bg-black/60 rounded-xl p-2 border border-white/10 text-gray-200">
            {cornersScore === 10 ? (
              <span className="text-emerald-300 font-bold">Immaculate 90° razor-sharp cut. Zero fiber separation!</span>
            ) : cornersScore >= 8.5 ? (
              <span className="text-amber-300 font-bold">Microscopic speck of whitening detected along edge tip.</span>
            ) : (
              <span className="text-red-400 font-bold">Visible corner fraying / edge nick (-{(10 - cornersScore).toFixed(1)} pt).</span>
            )}
          </div>
        </div>
      </div>

      {/* Stage Controls */}
      <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
          <CheckCircle2 className="w-4 h-4" /> Step 4 of 5: Corners & Edges Micro-Check
        </div>
        <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
        <p className="text-xs text-gray-300 leading-relaxed">
          Click all 4 corner loupe buttons on the card to inspect the factory cut angles (`Top-Left`, `Top-Right`, `Bottom-Left`, `Bottom-Right`).
        </p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          {cornerLabels.map((label, idx) => (
            <button
              key={idx}
              onClick={() => handleInspectCorner(idx)}
              className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                activeCornerIndex === idx
                  ? 'bg-amber-500/20 border-amber-400 text-white font-bold'
                  : inspectedCorners[idx]
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-emerald-300'
                  : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
              }`}
            >
              <span>{label.split(' ')[0]}</span>
              <span className="font-mono">{inspectedCorners[idx] ? '✓' : 'O'}</span>
            </button>
          ))}
        </div>

        <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between text-xs font-bold text-gray-300">
          <span>Corners Score: <strong className="text-amber-400 font-mono">{cornersScore.toFixed(1)}/10</strong></span>
          <span>Edges Score: <strong className="text-amber-400 font-mono">{edgesScore.toFixed(1)}/10</strong></span>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => setInspectedCorners([true, true, true, true])}
            className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer shrink-0"
          >
            Verify 4/4
          </button>
          <button
            onClick={() => { sound.playTabSwitch(); onNextStep(); }}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <span>Proceed to Ultrasonic Sealing</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
