import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Wind, ShieldCheck, Check, 
  RotateCw, Gauge, Zap, Flame, Award, Sliders, Layers, ChevronRight, ChevronDown,
  Thermometer, PenTool, Disc, Shield, Droplets
} from 'lucide-react';
import { type Card, getCollectedCards, getStorageKey, syncToFirestore } from '../binder/types';
import { sound } from '../../services/sound';

interface PrePSARestorationStudioProps {
  isOpen: boolean;
  onClose: () => void;
  collection: Card[];
  onSendToGrading: (card: Card, isRestoredBoosted: boolean) => void;
}

type RestorationStation = 'press' | 'edgePen' | 'rotaryBuffer' | 'cardSaver';

interface EdgeDing {
  id: string;
  edge: 'Top' | 'Right' | 'Bottom' | 'Left';
  x: number; // %
  y: number; // %
  repaired: boolean;
}

interface ScuffSpot {
  id: number;
  x: number; // %
  y: number; // %
  pasted: boolean;
  buffed: boolean;
}

export default function PrePSARestorationStudio({
  isOpen,
  onClose,
  collection,
  onSendToGrading,
}: PrePSARestorationStudioProps) {
  const availableCards = collection.filter(c => !c.isSlabbed);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isCardDropdownOpen, setIsCardDropdownOpen] = useState<boolean>(false);

  // Active Restoration Station
  const [station, setStation] = useState<RestorationStation>('press');

  // Station 1: Thermal Moisture Press
  const [targetTemp, setTargetTemp] = useState<number>(35); // 50-60 target
  const [steamLevel, setSteamLevel] = useState<number>(0);
  const [isPressing, setIsPressing] = useState<boolean>(false);
  const [cardWarpAngle, setCardWarpAngle] = useState<number>(24); // 24deg down to 0deg
  const [pressHoldTimer, setPressHoldTimer] = useState<number>(0);

  // Station 2: Edge Whitening Repair Pen
  const [edgeDings, setEdgeDings] = useState<EdgeDing[]>([]);

  // Station 3: Electric Rotary Buffer
  const [scuffSpots, setScuffSpots] = useState<ScuffSpot[]>([]);
  const [bufferRotation, setBufferRotation] = useState<number>(0);
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  // Station 4: Card Saver 1 Encapsulation
  const [hasPennySleeve, setHasPennySleeve] = useState<boolean>(false);
  const [hasCardSaver, setHasCardSaver] = useState<boolean>(false);

  useEffect(() => {
    if (availableCards.length > 0 && !selectedCard) {
      setSelectedCard(availableCards[0]);
    }
  }, [availableCards, selectedCard]);

  useEffect(() => {
    if (selectedCard) {
      // Reset Station 1
      setTargetTemp(35);
      setSteamLevel(0);
      setCardWarpAngle(24);
      setPressHoldTimer(0);

      // Reset Station 2: 4 edge dings
      setEdgeDings([
        { id: 'top', edge: 'Top', x: 50, y: 3, repaired: false },
        { id: 'right', edge: 'Right', x: 97, y: 40, repaired: false },
        { id: 'bottom', edge: 'Bottom', x: 60, y: 97, repaired: false },
        { id: 'left', edge: 'Left', x: 3, y: 65, repaired: false },
      ]);

      // Reset Station 3: 3 holo scuffs
      setScuffSpots([
        { id: 1, x: 35, y: 35, pasted: false, buffed: false },
        { id: 2, x: 65, y: 40, pasted: false, buffed: false },
        { id: 3, x: 50, y: 60, pasted: false, buffed: false },
      ]);

      // Reset Station 4
      setHasPennySleeve(false);
      setHasCardSaver(false);
    }
  }, [selectedCard]);

  // Pressing lever hold effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPressing) {
      interval = setInterval(() => {
        setPressHoldTimer(prev => {
          const next = prev + 1;
          sound.playAirBlower();
          if (targetTemp >= 48 && targetTemp <= 65 && steamLevel > 0) {
            setCardWarpAngle(angle => Math.max(0, angle - 6));
          }
          if (next >= 4) {
            setIsPressing(false);
            if (targetTemp >= 48 && targetTemp <= 65) {
              setCardWarpAngle(0);
              sound.playLaserScan();
            }
          }
          return next;
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPressing, targetTemp, steamLevel]);

  if (!isOpen) return null;

  // Station Completion Scores
  const flattenScore = cardWarpAngle === 0 ? 100 : Math.round(((24 - cardWarpAngle) / 24) * 100);
  const repairedDings = edgeDings.filter(d => d.repaired).length;
  const edgeScore = Math.round((repairedDings / (edgeDings.length || 1)) * 100);
  const buffedSpots = scuffSpots.filter(s => s.buffed).length;
  const bufferScore = Math.round((buffedSpots / (scuffSpots.length || 1)) * 100);
  const sleeveScore = (hasPennySleeve ? 50 : 0) + (hasCardSaver ? 50 : 0);

  const overallRestorationScore = Math.round(
    (flattenScore * 0.25) + (edgeScore * 0.25) + (bufferScore * 0.25) + (sleeveScore * 0.25)
  );

  const handleApplySteam = () => {
    sound.playAirBlower();
    setSteamLevel(prev => Math.min(100, prev + 35));
  };

  const handleRepairEdgeDing = (id: string) => {
    sound.playClothWipe();
    setEdgeDings(prev => prev.map(d => d.id === id ? { ...d, repaired: true } : d));
  };

  const handleApplyCompound = (id: number) => {
    sound.playButtonClick();
    setScuffSpots(prev => prev.map(s => s.id === id ? { ...s, pasted: true } : s));
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setMousePos({ x, y });

    if (station === 'rotaryBuffer' && e.buttons === 1) {
      setBufferRotation(r => r + 25);
      sound.playUltrasonicWeldPulse();
      setScuffSpots(prev => prev.map(s => {
        if (!s.pasted || s.buffed) return s;
        const dist = Math.hypot(s.x - x, s.y - y);
        if (dist < 18) {
          return { ...s, buffed: true };
        }
        return s;
      }));
    }
  };

  const handleCompleteRestoration = () => {
    if (!selectedCard) return;
    sound.playLaserScan();
    const updated: Card = {
      ...selectedCard,
      isRestored: true,
      prepScore: overallRestorationScore,
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
        className="fixed inset-0 z-[9500] flex items-center justify-center p-2 sm:p-6 overflow-hidden"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(5, 5, 10, 0.88)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-5xl h-[94vh] md:h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)]"
          style={{ background: 'linear-gradient(145deg, #120e17 0%, #0a080f 100%)' }}
        >
          {/* Header - Compact on Mobile */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-sm md:text-base shrink-0">
                🛠️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-lg font-black text-white tracking-tight">Card Conservation Studio</h2>
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    ⭐ 85% GEM BOOST
                  </span>
                </div>
                <p className="hidden md:block text-xs text-amber-400/70 font-medium">
                  Un-warp foil curves, seal edge whitening, buff holo scuffs, and encapsulate in Card Saver 1!
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all shrink-0"
            >
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>

          {/* Main Workshop Body */}
          <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-y-auto md:overflow-hidden">
            {/* Sidebar / Top Mobile Navigation Bar */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-white/10 p-3 md:p-5 flex flex-col gap-3 md:gap-5 bg-black/40 shrink-0">
              {/* Custom Styled Card Selector Dropdown */}
              <div className="relative">
                <label className="text-[10px] md:text-[11px] font-extrabold text-amber-400/80 uppercase tracking-widest block mb-1 md:mb-2">
                  1. Select Card to Conserve
                </label>
                {availableCards.length === 0 ? (
                  <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-gray-400 text-center">
                    No un-slabbed cards in binder! Open packs to get cards.
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCardDropdownOpen(!isCardDropdownOpen)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1a1522] border border-amber-500/40 hover:border-amber-400 text-white text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-md"
                    >
                      <span className="text-amber-300 font-bold truncate">
                        {selectedCard ? `${selectedCard.name} (${selectedCard.setName})` : 'Select Card'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 shrink-0 ${isCardDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isCardDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          className="absolute left-0 right-0 mt-1 p-1.5 rounded-xl bg-[#120e17] border border-amber-500/40 shadow-[0_15px_40px_rgba(0,0,0,0.9)] space-y-1 max-h-48 overflow-y-auto custom-scrollbar z-40"
                        >
                          {availableCards.map(c => {
                            const isSelected = selectedCard?.id === c.id;
                            return (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCard(c);
                                  setIsCardDropdownOpen(false);
                                  sound.playButtonClick();
                                }}
                                className={`w-full px-3 py-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-black'
                                    : 'border-transparent text-gray-300 hover:bg-white/5 hover:text-white'
                                }`}
                              >
                                <span className="text-xs truncate">{c.name} ({c.setName})</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* Restoration Stations: Horizontal scroll on mobile, Vertical stack on desktop */}
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-amber-400/80 uppercase tracking-widest block mb-1 md:mb-2">
                  2. Select Station
                </label>
                <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden gap-2 custom-scrollbar pb-1 md:pb-0">
                  {/* Station 1: Thermal Press */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('press'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink ${
                      station === 'press'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Thermometer className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">1. Thermal Press</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Flattens warped foil curvature</div>
                      </div>
                    </div>
                    {flattenScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>

                  {/* Station 2: Edge Pen */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('edgePen'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink ${
                      station === 'edgePen'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">2. Edge Repair Pen</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Touches up paper dings & corner wear</div>
                      </div>
                    </div>
                    {edgeScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>

                  {/* Station 3: Rotary Buffer */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('rotaryBuffer'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink ${
                      station === 'rotaryBuffer'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">3. Rotary Buffer</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Buffs out scuffs for mirror holo glare</div>
                      </div>
                    </div>
                    {bufferScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>

                  {/* Station 4: Card Saver 1 */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('cardSaver'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink ${
                      station === 'cardSaver'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">4. Card Saver 1</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Sleeves card for submission</div>
                      </div>
                    </div>
                    {sleeveScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>
                </div>
              </div>

              {/* Progress Gauge */}
              <div className="p-2.5 md:p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1.5 md:space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-300 text-[11px] md:text-xs">Conservation Progress</span>
                  <span className="text-amber-300 font-black text-xs md:text-sm">{overallRestorationScore}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 md:h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${overallRestorationScore}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Interactive Workbench Workspace (Maximum Height on Mobile) */}
            <div className="flex-1 flex flex-col items-center justify-center p-3 md:p-6 relative overflow-hidden bg-[#0a070e] min-h-[360px] md:min-h-0">
              <div className="absolute inset-0 bg-[radial-gradient(#261d33_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {selectedCard ? (
                <div className="relative flex flex-col items-center max-w-md w-full my-auto">
                  {/* Card Display with Station-Specific Visual Effects */}
                  <div
                    onMouseMove={handleCardMouseMove}
                    className="relative w-48 sm:w-60 md:w-72 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 select-none group transition-transform duration-300 shrink-0"
                    style={{
                      transform: `rotateY(${cardWarpAngle}deg) rotateX(${cardWarpAngle * 0.4}deg)`,
                      transformStyle: 'preserve-3d'
                    }}
                  >
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="w-full h-full object-cover pointer-events-none"
                    />

                    {/* Station 1: Thermal Steam Effect */}
                    {station === 'press' && steamLevel > 0 && (
                      <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px] pointer-events-none animate-pulse flex items-center justify-center">
                        <span className="text-[10px] font-bold text-black bg-white/90 px-2.5 py-0.5 rounded-full shadow-lg">
                          ♨️ Steam ({steamLevel}%)
                        </span>
                      </div>
                    )}

                    {/* Station 2: Edge Whitening Dings */}
                    {station === 'edgePen' && (
                      <div className="absolute inset-0 pointer-events-auto">
                        {edgeDings.map(d => (
                          <button
                            key={d.id}
                            onClick={() => handleRepairEdgeDing(d.id)}
                            className={`absolute -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] font-black transition-all cursor-pointer shadow-lg ${
                              d.repaired
                                ? 'bg-emerald-500 text-black border border-emerald-300'
                                : 'bg-red-500 text-white border border-white animate-bounce'
                            }`}
                            style={{ left: `${d.x}%`, top: `${d.y}%` }}
                          >
                            {d.repaired ? '✓ Sealed' : `🖌️ Fix ${d.edge}`}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Station 3: Scuff Spots & Rotary Buffing Wheel */}
                    {station === 'rotaryBuffer' && (
                      <div className="absolute inset-0 pointer-events-auto">
                        {scuffSpots.map(s => (
                          <div
                            key={s.id}
                            onClick={() => handleApplyCompound(s.id)}
                            className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                            style={{ left: `${s.x}%`, top: `${s.y}%` }}
                          >
                            {s.buffed ? (
                              <div className="w-7 h-7 rounded-full border-2 border-amber-300 bg-amber-400/20 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center text-amber-300 font-bold text-[9px]">
                                ✨
                              </div>
                            ) : s.pasted ? (
                              <div className="w-6 h-6 rounded-full bg-white/80 border border-gray-300 shadow-md flex items-center justify-center text-[7px] font-bold text-black">
                                Paste
                              </div>
                            ) : (
                              <div className="px-1.5 py-0.5 rounded-full bg-purple-600 text-white text-[8px] font-bold border border-white animate-pulse">
                                💧 Paste
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Rotary Buffer Cursor Tool */}
                        <div
                          className="absolute pointer-events-none -translate-x-1/2 -translate-y-1/2 transition-transform"
                          style={{
                            left: `${mousePos.x}%`,
                            top: `${mousePos.y}%`,
                            transform: `translate(-50%, -50%) rotate(${bufferRotation}deg)`
                          }}
                        >
                          <div className="w-10 h-10 rounded-full border-4 border-dashed border-amber-400 bg-amber-500/30 flex items-center justify-center">
                            <Disc className="w-5 h-5 text-amber-300" />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Station 4: Penny Sleeve & Card Saver Overlays */}
                    {hasPennySleeve && (
                      <div className="absolute inset-0 border-2 border-emerald-400/60 bg-emerald-400/10 pointer-events-none flex items-center justify-center">
                        <span className="text-[9px] font-black text-emerald-300 bg-black/80 px-2 py-0.5 rounded">
                          ✓ Penny Sleeved
                        </span>
                      </div>
                    )}
                    {hasCardSaver && (
                      <div className="absolute inset-0 border-4 border-amber-400 bg-amber-500/20 pointer-events-none flex items-center justify-center">
                        <span className="text-[11px] font-black text-amber-300 bg-black/90 px-2.5 py-1 rounded-xl border border-amber-400/50 shadow-xl">
                          🛡️ Card Saver 1
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Station-Specific Interactive Controls */}
                  <div className="mt-3 md:mt-4 w-full">
                    {station === 'press' && (
                      <div className="p-3 rounded-2xl bg-black/70 border border-amber-500/30 space-y-2">
                        <div className="flex items-center justify-between text-xs text-amber-300 font-bold">
                          <span>Thermal Clamp:</span>
                          <span className="text-gray-300 font-mono text-[11px]">Warp: {cardWarpAngle}°</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Thermometer className="w-4 h-4 text-orange-400 shrink-0" />
                          <input
                            type="range"
                            min="30"
                            max="80"
                            value={targetTemp}
                            onChange={e => setTargetTemp(Number(e.target.value))}
                            className="flex-1 accent-amber-400"
                          />
                          <span className="text-xs font-mono font-bold text-amber-300 w-10 text-right">{targetTemp}°C</span>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={handleApplySteam}
                            className="flex-1 py-2 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 text-xs font-bold hover:bg-cyan-500/30 transition-all flex items-center justify-center gap-1"
                          >
                            <Droplets className="w-3.5 h-3.5" />
                            <span>Steam</span>
                          </button>
                          <button
                            onMouseDown={() => setIsPressing(true)}
                            onMouseUp={() => setIsPressing(false)}
                            className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1 shadow-lg shadow-amber-500/20"
                          >
                            <Flame className="w-3.5 h-3.5" />
                            <span>{isPressing ? `Flattening (${pressHoldTimer}s)...` : 'Hold Clamp'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {station === 'edgePen' && (
                      <div className="p-2.5 rounded-2xl bg-black/70 border border-amber-500/30 text-center">
                        <div className="text-xs font-bold text-amber-300">Edge Sealant Pen</div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Tap the red ding tags on the card borders above to seal whitening!
                        </p>
                      </div>
                    )}

                    {station === 'rotaryBuffer' && (
                      <div className="p-2.5 rounded-2xl bg-black/70 border border-amber-500/30 text-center">
                        <div className="text-xs font-bold text-amber-300">Electric Rotary Polisher</div>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          Tap scuff spots for paste, then drag your finger over them to buff holo scratches!
                        </p>
                      </div>
                    )}

                    {station === 'cardSaver' && (
                      <div className="p-2 rounded-2xl bg-black/70 border border-amber-500/30 flex gap-2">
                        <button
                          onClick={() => { sound.playButtonClick(); setHasPennySleeve(true); }}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            hasPennySleeve ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          1. Penny Sleeve
                        </button>
                        <button
                          onClick={() => { sound.playButtonClick(); setHasCardSaver(true); }}
                          className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                            hasCardSaver ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
                          }`}
                        >
                          2. Card Saver 1
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Action Button: Send to PSA Grading */}
                  <div className="mt-3 md:mt-4 w-full flex items-center justify-center">
                    <button
                      onClick={handleCompleteRestoration}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4" />
                      <span>Submit Card to PSA (85% Gem Boost)</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">Select a card above to begin conservation</div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
