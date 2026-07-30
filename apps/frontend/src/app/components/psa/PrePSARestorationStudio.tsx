import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Sparkles, Wind, ShieldCheck, Check, 
  RotateCw, Gauge, Zap, Flame, Award, Sliders, Layers, ChevronRight, ChevronDown,
  Thermometer, PenTool, Disc, Shield, Droplets, Info, Sparkle, Maximize2, Move,
  Lock, CheckCircle2, Star, Radio, ZapOff, RefreshCw
} from 'lucide-react';
import { type Card, getCollectedCards, getStorageKey, syncToFirestore } from '../binder/types';
import { sound } from '../../services/sound';
import ThermalPressStation from './components/ThermalPressStation';
import EdgeRepairStation from './components/EdgeRepairStation';
import RotaryBufferStation from './components/RotaryBufferStation';
import CardSaverStation from './components/CardSaverStation';

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
  progress: number; // 0 - 100
  repaired: boolean;
}

interface ScuffSpot {
  id: number;
  x: number; // %
  y: number; // %
  pasted: boolean;
  buffProgress: number; // 0 - 100
  buffed: boolean;
}

/**
 * Pre-PSA Restoration Studio Component
 * 
 * Provides an interface for the user to perform restoration tasks on their card
 * before sending it to PSA for grading. This includes thermal pressing, edge repair,
 * rotary buffering, and penny sleeve encapsulation.
 *
 * @param {PrePSARestorationStudioProps} props - The component props
 */
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

  const [cardWarpAngle, setCardWarpAngle] = useState<number>(24); // 24deg down to 0deg

  // Station 2: Edge Whitening Repair Pen
  const [edgeDings, setEdgeDings] = useState<EdgeDing[]>([]);

  // Station 3: Electric Rotary Buffer
  const [scuffSpots, setScuffSpots] = useState<ScuffSpot[]>([]);

  // Station 4: High-Tech Card Saver 1 Encapsulation
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
      setCardWarpAngle(24);

      // Reset Station 2: 4 edge dings
      setEdgeDings([
        { id: 'top', edge: 'Top', x: 50, y: 3, progress: 0, repaired: false },
        { id: 'right', edge: 'Right', x: 97, y: 40, progress: 0, repaired: false },
        { id: 'bottom', edge: 'Bottom', x: 60, y: 97, progress: 0, repaired: false },
        { id: 'left', edge: 'Left', x: 3, y: 65, progress: 0, repaired: false },
      ]);

      // Reset Station 3: 3 holo scuffs
      setScuffSpots([
        { id: 1, x: 35, y: 35, pasted: false, buffProgress: 0, buffed: false },
        { id: 2, x: 65, y: 40, pasted: false, buffProgress: 0, buffed: false },
        { id: 3, x: 50, y: 60, pasted: false, buffProgress: 0, buffed: false },
      ]);

      // Reset Station 4
      setHasPennySleeve(false);
      setHasCardSaver(false);
    }
  }, [selectedCard]);

  // NOTE: The rotary buffer no longer uses a JS requestAnimationFrame loop
  // (which previously called setState on EVERY animation frame while this view
  // was mounted). It is now a pure CSS rotation driven by bufferRPM via the
  // inline animation-duration, so it costs zero main-thread time.



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
          exit={{ opacity: 0, scale: 1, y: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-5xl h-[94vh] md:h-[88vh] flex flex-col rounded-3xl overflow-hidden border border-amber-500/30 shadow-[0_0_80px_rgba(245,158,11,0.15)]"
          style={{ background: 'linear-gradient(145deg, #120e17 0%, #0a080f 100%)' }}
        >
          {/* Header */}
          <div className="px-4 md:px-6 py-3 md:py-4 border-b border-amber-500/20 bg-gradient-to-r from-amber-500/10 via-purple-500/5 to-transparent flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20 text-black font-black text-sm md:text-base shrink-0">
                🛠️
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm md:text-lg font-black text-white tracking-tight">Card Conservation Studio</h2>
                  <span className="bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] md:text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                    ⭐ ODDS BOOST: 20% PSA 10 | 30% PSA 9
                  </span>
                </div>
                <p className="hidden md:block text-xs text-amber-400/70 font-medium">
                  Un-warp curves, touch up dings & scuffs! Bumps PSA 10 chance to 20% & PSA 9 to 30%!
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

              {/* Restoration Stations */}
              <div>
                <label className="text-[10px] md:text-[11px] font-extrabold text-amber-400/80 uppercase tracking-widest block mb-1 md:mb-2">
                  2. Select Station
                </label>
                <div className="flex flex-row md:flex-col overflow-x-auto md:overflow-x-hidden gap-2 custom-scrollbar pb-1 md:pb-0">
                  {/* Station 1: Thermal Press */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('press'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink cursor-pointer ${
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
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink cursor-pointer ${
                      station === 'edgePen'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <PenTool className="w-3.5 h-3.5 md:w-4 md:h-4 text-cyan-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">2. Edge Ink Pen</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Touch/Drag pen to seal edge dings</div>
                      </div>
                    </div>
                    {edgeScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>

                  {/* Station 3: Rotary Buffer */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('rotaryBuffer'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink cursor-pointer ${
                      station === 'rotaryBuffer'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Disc className="w-3.5 h-3.5 md:w-4 md:h-4 text-purple-400 animate-spin" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">3. Rotary Buffer</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Touch/Drag polisher over scuffs</div>
                      </div>
                    </div>
                    {bufferScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>

                  {/* Station 4: Card Saver 1 */}
                  <button
                    onClick={() => { sound.playButtonClick(); setStation('cardSaver'); setIsCardDropdownOpen(false); }}
                    className={`px-3 py-2 md:p-3 rounded-xl border text-left flex items-center justify-between transition-all shrink-0 md:shrink cursor-pointer ${
                      station === 'cardSaver'
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300 font-bold shadow-md shadow-amber-500/10'
                        : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Shield className="w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
                      <div>
                        <div className="text-xs text-white whitespace-nowrap">4. Ultrasonic Encapsulation</div>
                        <div className="hidden md:block text-[10px] text-gray-400">Laser seal & predicted sub-grades</div>
                      </div>
                    </div>
                    {sleeveScore >= 100 && <Check className="w-3.5 h-3.5 text-amber-400 ml-2" />}
                  </button>
                </div>
              </div>

              {/* Progress Gauge & Live Sub-Grades */}
              <div className="p-2.5 md:p-4 rounded-2xl bg-black/60 border border-amber-500/30 space-y-1.5 md:space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-gray-300 text-[11px] md:text-xs">Conservation Score</span>
                  <span className="text-amber-300 font-black text-xs md:text-sm">{overallRestorationScore}%</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 md:h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-yellow-300 rounded-full transition-all duration-500"
                    style={{ width: `${overallRestorationScore}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-1 pt-1 border-t border-white/10 text-[9px] font-mono">
                  <div className="text-gray-400">Curve: <span className="text-amber-300 font-bold">{flattenScore}%</span></div>
                  <div className="text-gray-400">Edges: <span className="text-cyan-300 font-bold">{edgeScore}%</span></div>
                  <div className="text-gray-400">Surface: <span className="text-purple-300 font-bold">{bufferScore}%</span></div>
                  <div className="text-gray-400">Sleeve: <span className="text-emerald-300 font-bold">{sleeveScore}%</span></div>
                </div>
              </div>
            </div>

            {/* Interactive Workbench Workspace */}
            <div className="flex-1 flex flex-col items-center justify-start p-3 md:p-6 relative overflow-y-auto custom-scrollbar bg-[#0a070e] min-h-[380px] md:min-h-0">
              <div className="absolute inset-0 bg-[radial-gradient(#261d33_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

              {selectedCard ? (
                <div className="relative flex flex-col items-center max-w-md w-full my-auto">
                  {station === 'press' && (
                    <ThermalPressStation 
                      key={selectedCard.id}
                      activeCard={selectedCard}
                      cardWarpAngle={cardWarpAngle}
                      onWarpAngleChange={setCardWarpAngle}
                    />
                  )}
                  {station === 'edgePen' && (
                    <EdgeRepairStation
                      key={selectedCard.id}
                      activeCard={selectedCard}
                      edgeDings={edgeDings}
                      onEdgeDingsChange={setEdgeDings}
                    />
                  )}
                  {station === 'rotaryBuffer' && (
                    <RotaryBufferStation
                      key={selectedCard.id}
                      activeCard={selectedCard}
                      scuffSpots={scuffSpots}
                      onScuffSpotsChange={setScuffSpots}
                    />
                  )}
                  {station === 'cardSaver' && (
                    <CardSaverStation
                      key={selectedCard.id}
                      activeCard={selectedCard}
                      hasPennySleeve={hasPennySleeve}
                      onHasPennySleeveChange={setHasPennySleeve}
                      hasCardSaver={hasCardSaver}
                      onHasCardSaverChange={setHasCardSaver}
                    />
                  )}

                  {/* Action Button: Send to PSA Grading */}
                  <div className="mt-4 pb-6 w-full flex items-center justify-center">
                    <button
                      onClick={handleCompleteRestoration}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs md:text-sm uppercase tracking-wider shadow-lg shadow-amber-500/25 hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4 md:w-5 md:h-5" />
                      <span>Submit Card to PSA (Boosted Odds: 20% PSA 10 | 30% PSA 9)</span>
                      <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
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
