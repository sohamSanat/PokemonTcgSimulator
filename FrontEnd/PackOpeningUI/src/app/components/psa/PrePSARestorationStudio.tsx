import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Wind, Crosshair, Eye, ShieldCheck, Check, 
  RotateCw, Gauge, Zap, Flame, Award, Sliders, Layers, ChevronRight
} from 'lucide-react';
import { type Card, getCollectedCards, getStorageKey, syncToFirestore } from '../binder/types';
import { sound } from '../../services/sound';

interface PrePSARestorationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Card[];
  onSendToGrading: (card: Card, isRestoredBoosted: boolean) => void;
}

interface DustParticle {
  id: number;
  x: number; // % from left
  y: number; // % from top
  type: 'dust' | 'smudge' | 'fingerprint' | 'lint';
  cleaned: boolean;
  blowingOff?: boolean;
}

export default function PrePSARestorationStudio({
  isOpen,
  onClose,
  collection,
  onSendToGrading,
}: PrePSARestorationStudioProps) {
  const availableCards = collection.filter(c => !c.isSlabbed);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  // Active Tool: 'towel' | 'blower' | 'calipers' | 'uv' | 'polish'
  const [activeTool, setActiveTool] = useState<'towel' | 'blower' | 'calipers' | 'uv' | 'polish'>('towel');

  // Minigame States
  const [dustParticles, setDustParticles] = useState<DustParticle[]>([]);
  const [wipedCount, setWipedCount] = useState<number>(0);
  const [isUVActive, setIsUVActive] = useState<boolean>(false);
  const [uvPos, setUvPos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Centering Caliper State
  const [lrRatio, setLrRatio] = useState<number>(50); // 50/50 is perfect
  const [tbRatio, setTbRatio] = useState<number>(50);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);

  // Polish State
  const [polishCoverage, setPolishCoverage] = useState<number>(0);

  // Air puff animations
  const [airPuffs, setAirPuffs] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (availableCards.length > 0 && !selectedCard) {
      setSelectedCard(availableCards[0]);
    }
  }, [availableCards, selectedCard]);

  useEffect(() => {
    if (selectedCard) {
      // Generate realistic dust specks & smudges on card surface
      const initialParticles: DustParticle[] = [
        { id: 1, x: 25, y: 30, type: 'dust', cleaned: false },
        { id: 2, x: 70, y: 45, type: 'fingerprint', cleaned: false },
        { id: 3, x: 40, y: 75, type: 'smudge', cleaned: false },
        { id: 4, x: 80, y: 20, type: 'lint', cleaned: false },
        { id: 5, x: 30, y: 60, type: 'dust', cleaned: false },
        { id: 6, x: 60, y: 85, type: 'smudge', cleaned: false },
      ];
      setDustParticles(initialParticles);
      setWipedCount(0);
      setPolishCoverage(0);
      setIsCalibrated(false);
      setLrRatio(48 + Math.floor(Math.random() * 5));
      setTbRatio(49 + Math.floor(Math.random() * 4));
    }
  }, [selectedCard]);

  if (!isOpen) return null;

  const totalDust = dustParticles.length || 1;
  const dustScore = Math.min(100, Math.round((wipedCount / totalDust) * 100));
  const centeringScore = isCalibrated ? 100 : (Math.abs(50 - lrRatio) <= 2 && Math.abs(50 - tbRatio) <= 2 ? 100 : 70);
  const overallPrepScore = Math.round((dustScore * 0.4) + (centeringScore * 0.3) + (polishCoverage * 0.3));

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setUvPos({ x, y });

    if (activeTool === 'towel' && e.buttons === 1) {
      sound.playClothWipe();
      cleanNearbyParticles(x, y, 15);
    } else if (activeTool === 'polish' && e.buttons === 1) {
      sound.playClothWipe();
      setPolishCoverage(prev => Math.min(100, prev + 3));
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (activeTool === 'blower') {
      sound.playAirBlower();
      setAirPuffs(prev => [...prev.slice(-4), { id: Date.now() + Math.random(), x, y }]);
      cleanNearbyParticles(x, y, 22, true);
    } else if (activeTool === 'towel') {
      sound.playClothWipe();
      cleanNearbyParticles(x, y, 18);
    }
  };

  const cleanNearbyParticles = (x: number, y: number, radius: number, isBlower = false) => {
    let countNew = 0;
    setDustParticles(prev => {
      return prev.map(p => {
        if (p.cleaned || p.blowingOff) return p;
        const dist = Math.hypot(p.x - x, p.y - y);
        if (dist < radius) {
          if (isBlower && (p.type === 'fingerprint' || p.type === 'smudge')) {
            // Air blower doesn't remove greasy smudges
            return p;
          }
          countNew++;
          return { ...p, cleaned: true };
        }
        return p;
      });
    });
    if (countNew > 0) {
      setWipedCount(c => c + countNew);
    }
  };

  const handleCompletePrep = () => {
    if (!selectedCard) return;
    sound.playLaserScan();
    const updated: Card = {
      ...selectedCard,
      isRestored: true,
      prepScore: overallPrepScore,
    };
    const cards = getCollectedCards();
    const updatedCards = cards.map(c => c.id === updated.id ? updated : c);
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(updatedCards));
    syncToFirestore();
    onSendToGrading(updated, true);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9500] flex items-center justify-center p-3 sm:p-6 overflow-hidden"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(5, 5, 10, 0.88)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-5xl h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-teal-500/30 shadow-[0_0_80px_rgba(45,212,191,0.15)]"
          style={{ background: 'linear-gradient(145deg, #0b1317 0%, #060a0d 100%)' }}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-teal-500/20 bg-gradient-to-r from-teal-500/10 via-emerald-500/5 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-500 to-amber-400 flex items-center justify-center shadow-lg shadow-teal-500/20 text-black font-black">
                🧹
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-white tracking-tight">Pre-PSA Cleaning & Restoration Studio</h2>
                  <span className="bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    ⭐ 85% GEM MINT BOOST
                  </span>
                </div>
                <p className="text-xs text-teal-400/70 font-medium">
                  Clean dust, polish surface gloss, and calibrate border centering to maximize your PSA 10 odds!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Studio Body */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0">
            {/* Sidebar: Card Selector & Tools */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 p-5 flex flex-col gap-5 bg-black/40 overflow-y-auto custom-scrollbar shrink-0">
              {/* Card Selector */}
              <div>
                <label className="text-[11px] font-extrabold text-teal-400/80 uppercase tracking-widest block mb-2">
                  1. Select Card to Restore
                </label>
                {availableCards.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 text-center">
                    No un-slabbed cards in binder! Open packs to get cards.
                  </div>
                ) : (
                  <select
                    value={selectedCard?.id || ''}
                    onChange={e => {
                      const c = availableCards.find(card => card.id === e.target.value);
                      if (c) setSelectedCard(c);
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#141c22] border border-teal-500/30 text-white text-xs font-bold focus:outline-none focus:border-teal-400 transition-all"
                  >
                    {availableCards.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.setName})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tools Selector */}
              <div>
                <label className="text-[11px] font-extrabold text-teal-400/80 uppercase tracking-widest block mb-2">
                  2. Select Professional Tool
                </label>
                <div className="grid grid-cols-1 gap-2">
                  {/* Tool 1: Microfiber Towel */}
                  <button
                    onClick={() => { sound.playButtonClick(); setActiveTool('towel'); }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeTool === 'towel'
                        ? 'border-teal-400 bg-teal-500/20 text-teal-300 font-bold shadow-md shadow-teal-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-base">🧽</span>
                      <div>
                        <div className="text-xs text-white">Microfiber Anti-Static Towel</div>
                        <div className="text-[10px] text-gray-400">Wipes smudges & fingerprints</div>
                      </div>
                    </div>
                    {dustScore >= 100 && <Check className="w-4 h-4 text-teal-400" />}
                  </button>

                  {/* Tool 2: Precision Air Blower */}
                  <button
                    onClick={() => { sound.playButtonClick(); setActiveTool('blower'); }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeTool === 'blower'
                        ? 'border-teal-400 bg-teal-500/20 text-teal-300 font-bold shadow-md shadow-teal-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Wind className="w-4 h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs text-white">Precision Air Blower Bulb</div>
                        <div className="text-[10px] text-gray-400">Blasts off loose lint particles</div>
                      </div>
                    </div>
                  </button>

                  {/* Tool 3: Digital Centering Calipers */}
                  <button
                    onClick={() => { sound.playButtonClick(); setActiveTool('calipers'); }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeTool === 'calipers'
                        ? 'border-teal-400 bg-teal-500/20 text-teal-300 font-bold shadow-md shadow-teal-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Crosshair className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs text-white">Digital Border Calipers</div>
                        <div className="text-[10px] text-gray-400">Calibrates 50/50 optical centering</div>
                      </div>
                    </div>
                    {isCalibrated && <Check className="w-4 h-4 text-teal-400" />}
                  </button>

                  {/* Tool 4: 365nm UV Blacklight */}
                  <button
                    onClick={() => { sound.playButtonClick(); setActiveTool('uv'); setIsUVActive(!isUVActive); }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeTool === 'uv'
                        ? 'border-purple-400 bg-purple-500/20 text-purple-300 font-bold shadow-md shadow-purple-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Eye className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-xs text-white">365nm UV Blacklight Scanner</div>
                        <div className="text-[10px] text-gray-400">Inspects hidden surface print lines</div>
                      </div>
                    </div>
                  </button>

                  {/* Tool 5: Holo Polish Solution */}
                  <button
                    onClick={() => { sound.playButtonClick(); setActiveTool('polish'); }}
                    className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      activeTool === 'polish'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <div>
                        <div className="text-xs text-white">Conservation Holo Polish</div>
                        <div className="text-[10px] text-gray-400">Restores 100% factory holo gloss</div>
                      </div>
                    </div>
                    {polishCoverage >= 100 && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                </div>
              </div>

              {/* Real-Time Prep Scores */}
              <div className="mt-auto p-4 rounded-2xl bg-black/60 border border-teal-500/30 space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-300">Restoration Score</span>
                  <span className="text-teal-300 font-black text-sm">{overallPrepScore}%</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${overallPrepScore}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 text-center pt-1">
                  ⭐ Reaching 80%+ boosts your PSA 10 Gem Mint odds to <span className="text-teal-300 font-bold">85%</span>!
                </p>
              </div>
            </div>

            {/* Workbench Interactive Area */}
            <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-[#070b0e]">
              {/* Background Lab Grid */}
              <div className="absolute inset-0 bg-[radial-gradient(#14252e_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {selectedCard ? (
                <div className="relative flex flex-col items-center max-w-md w-full">
                  {/* Interactive Card Canvas */}
                  <div
                    onMouseMove={handleCardMouseMove}
                    onClick={handleCardClick}
                    className="relative w-64 sm:w-72 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 cursor-crosshair select-none group"
                  >
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* UV Scanner Effect */}
                    {isUVActive && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                        style={{
                          background: `radial-gradient(circle 90px at ${uvPos.x}% ${uvPos.y}%, rgba(168,85,247,0.45) 0%, rgba(126,34,206,0.2) 60%, rgba(0,0,0,0.85) 100%)`,
                          mixBlendMode: 'hard-light'
                        }}
                      />
                    )}

                    {/* Polish Gloss Layer */}
                    {polishCoverage > 0 && (
                      <div
                        className="absolute inset-0 pointer-events-none transition-all duration-300"
                        style={{
                          background: `linear-gradient(135deg, rgba(255,255,255,${polishCoverage * 0.0025}) 0%, transparent 50%, rgba(245,158,11,${polishCoverage * 0.002}) 100%)`,
                          boxShadow: `inset 0 0 30px rgba(45,212,191,${polishCoverage * 0.003})`
                        }}
                      />
                    )}

                    {/* Centering Overlay Lines */}
                    {activeTool === 'calipers' && (
                      <div className="absolute inset-0 pointer-events-none z-30">
                        {/* Horizontal & Vertical Crosshairs */}
                        <div className="absolute left-0 right-0 top-1/2 border-t border-amber-400/80 border-dashed" />
                        <div className="absolute top-0 bottom-0 left-1/2 border-l border-amber-400/80 border-dashed" />
                        {/* Caliper Border Gauges */}
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 rounded text-[9px] font-mono text-amber-300 border border-amber-400/40">
                          L/R: {lrRatio}/{100 - lrRatio}
                        </div>
                        <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-[9px] font-mono text-amber-300 border border-amber-400/40">
                          T/B: {tbRatio}/{100 - tbRatio}
                        </div>
                      </div>
                    )}

                    {/* Dust & Smudge Particles */}
                    {dustParticles.map(p => {
                      if (p.cleaned) return null;
                      return (
                        <div
                          key={p.id}
                          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-300"
                          style={{ left: `${p.x}%`, top: `${p.y}%` }}
                        >
                          {p.type === 'fingerprint' ? (
                            <div className="w-8 h-8 rounded-full bg-white/20 blur-[1px] border border-white/30" />
                          ) : p.type === 'smudge' ? (
                            <div className="w-10 h-6 rounded-full bg-amber-900/40 blur-[2px]" />
                          ) : (
                            <div className="w-3 h-3 rounded-full bg-gray-200/60 blur-[0.5px]" />
                          )}
                        </div>
                      );
                    })}

                    {/* Air Puffs Animation */}
                    {airPuffs.map(puff => (
                      <motion.div
                        key={puff.id}
                        initial={{ scale: 0.2, opacity: 0.8 }}
                        animate={{ scale: 2, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                        className="absolute w-12 h-12 rounded-full border-2 border-cyan-300/60 pointer-events-none -translate-x-1/2 -translate-y-1/2"
                        style={{ left: `${puff.x}%`, top: `${puff.y}%` }}
                      />
                    ))}
                  </div>

                  {/* Centering Control Sliders if Caliper tool selected */}
                  {activeTool === 'calipers' && (
                    <div className="mt-4 p-4 rounded-2xl bg-black/70 border border-amber-500/30 w-full space-y-3">
                      <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                        <span>Adjust Caliper Alignment:</span>
                        <button
                          onClick={() => {
                            setLrRatio(50);
                            setTbRatio(50);
                            setIsCalibrated(true);
                            sound.playButtonClick();
                          }}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-black font-black text-[10px] hover:bg-amber-400 transition-all"
                        >
                          Calibrate Perfect 50/50
                        </button>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] text-gray-400 flex justify-between">
                          <span>Left / Right Balance</span>
                          <span>{lrRatio}% / {100 - lrRatio}%</span>
                        </label>
                        <input
                          type="range"
                          min="45"
                          max="55"
                          value={lrRatio}
                          onChange={e => setLrRatio(Number(e.target.value))}
                          className="w-full accent-amber-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Action Button: Send to PSA Grading */}
                  <div className="mt-6 w-full flex items-center justify-center">
                    <button
                      onClick={handleCompletePrep}
                      className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-400 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-500/25 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Award className="w-5 h-5" />
                      <span>Send to PSA Grading with 85% Gem Boost</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Select a card on the left to begin pre-grading restoration</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
