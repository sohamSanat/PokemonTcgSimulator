import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Award, ShieldCheck, Sparkles, CheckCircle2, Zap, RotateCw, 
  Search, Eye, RefreshCcw, ArrowLeft, TrendingUp, Layers, 
  HelpCircle, ChevronRight, QrCode, Sliders, Flame, Star,
  Wind, Crosshair, ZoomIn, Radio, AlertTriangle, Check, Gauge
} from 'lucide-react';
import { getCollectedCards, saveCollectedCard, savePSAGradingResult, type Card } from '../binder/types';
import PrePSARestorationStudio from './PrePSARestorationStudio';
import { sound } from '../../services/sound';
import { trackMissionProgress } from '../../services/missions';

interface PSAGradingLabProps {
  onBackToPacks: () => void;
  onGradeComplete?: () => void;
}

import type { GradingStage, DustSpeck, SurfaceZone } from './types';
import { SAMPLE_CHASE_CARDS, REFERENCE_VAULT_CARDS } from './constants';
import CenteringMinigame from './components/CenteringMinigame';
import SurfaceMinigame from './components/SurfaceMinigame';
import EncapsulationSequence from './components/EncapsulationSequence';
import GradingResultCard from './components/GradingResultCard';
import PrepMinigame from './components/PrepMinigame';
import CornersMinigame from './components/CornersMinigame';

/**
 * PSAGradingLab Component
 * 
 * Orchestrates the multi-stage PSA Grading minigame sequence.
 * This includes prepping the card, verifying corners, centering,
 * and performing encapsulation before returning the final grade.
 * 
 * @param {PSAGradingLabProps} props - The component props
 * @param {() => void} props.onBackToPacks - Callback to return to the pack opening view
 * @param {() => void} [props.onGradeComplete] - Optional callback fired when grading finishes
 */
export default function PSAGradingLab({ onBackToPacks, onGradeComplete }: PSAGradingLabProps) {
  const [stage, setStage] = useState<GradingStage>('queue');
  const [collection, setCollection] = useState<Card[]>([]);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [isRestorationStudioOpen, setIsRestorationStudioOpen] = useState<boolean>(false);
  
  // Calculated subgrades during flow
  const [subgrades, setSubgrades] = useState<{
    centering: number;
    surface: number;
    corners: number;
    edges: number;
  }>({ centering: 10, surface: 10, corners: 10, edges: 10 });
  const [finalGrade, setFinalGrade] = useState<number>(10);
  const [certNumber, setCertNumber] = useState<string>('');
  const [valueMultiplier, setValueMultiplier] = useState<number>(2.8);

  const [filterTab, setFilterTab] = useState<'ready' | 'vault' | 'all'>('ready');

  // ── Step 1: Surface Prep & Dusting states ──
  // (Moved to PrepMinigame)

  // ── Step 2: Centering Calipers states ──
  // (Moved to CenteringMinigame)

  // ── Step 3: UV Blacklight Zone Scanner states ──
  // (Moved to SurfaceMinigame)

  // ── Step 4: 10x Magnifying Loupe states ──
  // (Moved to CornersMinigame)

  // ── Step 5: Ultrasonic Encapsulation states ──
  const [labelStyle, setLabelStyle] = useState<'standard_red' | 'gold_30th' | 'black_diamond' | 'emerald_prism'>('standard_red');
  // (Other states moved to EncapsulationSequence)

  const loadCards = () => {
    const all = getCollectedCards();
    setCollection(all);
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleGradeSampleCard = (sample: typeof SAMPLE_CHASE_CARDS[0]) => {
    sound.playPackOpen();
    const demoCard: Card = {
      id: `sample-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: sample.name,
      setName: sample.setName,
      setNumber: sample.setNumber,
      rarity: sample.rarity,
      type: sample.type,
      currentPrice: sample.value,
      priceChange: 0,
      priceHistory: [],
      holofoil: true,
      imageUrl: sample.imageUrl,
      favorite: false,
      binderId: 'psa-demo-vault',
      isSlabbed: false
    };
    startGradingProcess(demoCard, sample.targetGrade);
  };

  const startGradingProcess = (card: Card, forcedTargetGrade?: number, isRestoredBoosted?: boolean) => {
    sound.playModalOpen();
    setActiveCard(card);
    setStage('prep');

    // Calculate grades
    let centeringScore = 10;
    let surfaceScore = 10;
    let cornersScore = 10;
    let edgesScore = 10;
    let gradeNum = 10;
    let mult = 3.2;

    if (isRestoredBoosted || card.isRestored) {
      // Restored card odds: PSA 7 (25%), PSA 8 (25%), PSA 9 (30%), PSA 10 (20%)
      const rand = Math.random();
      const randSub = Math.random();

      if (rand < 0.25) {
        gradeNum = 7;
        centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.05 + randSub * 0.1;
      } else if (rand < 0.50) {
        gradeNum = 8;
        centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.25 + randSub * 0.15;
      } else if (rand < 0.80) {
        gradeNum = 9;
        centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.8 + randSub * 0.2;
      } else {
        gradeNum = 10;
        centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10;
        mult = 2.8 + randSub * 0.6;
      }
    } else if (forcedTargetGrade !== undefined) {
      gradeNum = forcedTargetGrade;
      if (gradeNum === 10) {
        centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10;
        mult = 3.2;
      } else if (gradeNum === 9) {
        centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0;
        mult = 1.8;
      } else if (gradeNum === 8) {
        centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.5;
        mult = 1.25;
      } else if (gradeNum === 7) {
        centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.5;
        mult = 1.05;
      }
    } else {
      // Unrestored base odds: PSA 7 (35%), PSA 8 (35%), PSA 9 (20%), PSA 10 (10%)
      const rand = Math.random();
      const randSub = Math.random();

      if (rand < 0.35) {
        gradeNum = 7;
        centeringScore = 7.5; surfaceScore = 7.0; cornersScore = 7.5; edgesScore = 7.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.05 + randSub * 0.1;
      } else if (rand < 0.70) {
        gradeNum = 8;
        centeringScore = 8.5; surfaceScore = 8.0; cornersScore = 8.5; edgesScore = 8.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.25 + randSub * 0.15;
      } else if (rand < 0.90) {
        gradeNum = 9;
        centeringScore = 9.5; surfaceScore = 9.0; cornersScore = 9.5; edgesScore = 9.0 + (randSub > 0.5 ? 0.5 : 0);
        mult = 1.8 + randSub * 0.2;
      } else {
        gradeNum = 10;
        centeringScore = 10; surfaceScore = 10; cornersScore = 10; edgesScore = 10;
        mult = 2.8 + randSub * 0.6;
      }
    }

    setSubgrades({ centering: centeringScore, surface: surfaceScore, corners: cornersScore, edges: edgesScore });
    setFinalGrade(gradeNum);
    const cert = Math.floor(80000000 + Math.random() * 19999999).toString();
    setCertNumber(cert);
    setValueMultiplier(Number(mult.toFixed(2)));

    // Reset centering state (handled inside CenteringMinigame on activeCard change)

  };



  const handleEncapsulationComplete = () => {
    if (activeCard) {
      savePSAGradingResult(
        activeCard.id,
        finalGrade as number,
        certNumber,
        subgrades,
        valueMultiplier
      );
      loadCards();
      trackMissionProgress('grade_psa', 1);
      if (finalGrade === 10) trackMissionProgress('grade_psa_10', 1);
      if (onGradeComplete) onGradeComplete();
    }
    setStage('result');
    sound.playGradeReveal(finalGrade as number);
  };

  const handleCrackSlab = (card: Card, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playFoilTear();
    startGradingProcess(card);
  };

  const readyCards = collection.filter(c => !c.isSlabbed || c.slabGrade === 'N/A' || !c.psaDetails);
  const userGradedCards = collection.filter(c => c.isSlabbed && Boolean(c.psaDetails));
  const gradedCards = [...REFERENCE_VAULT_CARDS, ...userGradedCards];
  const displayCards = filterTab === 'ready' ? readyCards : filterTab === 'vault' ? gradedCards : [...REFERENCE_VAULT_CARDS, ...collection];

  return (
    <div className="w-full flex-1 flex flex-col bg-[#0b0c10] text-[#f0f0f2] overflow-y-auto relative p-4 sm:p-6 sm:px-10">
      {/* Background Ambient Aura */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-red-600/15 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Laboratory Header Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 p-0.5 shadow-[0_0_25px_rgba(239,68,68,0.5)] flex items-center justify-center shrink-0 border border-red-400/40">
            <Award className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
                PSA Card Grading Studio
              </h1>
              <span className="bg-red-500/20 border border-red-500/40 text-red-400 text-[10px] font-black uppercase px-2 py-0.5 rounded-full tracking-wider">
                INTERACTIVE 5-STEP ENCAPSULATION LAB
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Experience authentic card prep dusting, optical border calibration, UV blacklight flaw checks, 10x loupe inspection, and ultrasonic sealing.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto justify-start sm:justify-end">
          <button
            onClick={() => { sound.playTabSwitch(); setIsRestorationStudioOpen(true); }}
            className="px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 hover:from-teal-300 hover:to-amber-200 text-black font-black text-xs sm:text-sm tracking-wide uppercase transition-all flex items-center gap-2 sm:gap-2.5 cursor-pointer shadow-[0_0_30px_rgba(45,212,191,0.75)] hover:shadow-[0_0_45px_rgba(45,212,191,0.95)] border-2 border-teal-200 hover:scale-[1.03] active:scale-95 shrink-0 animate-pulse"
          >
            <span className="text-base sm:text-lg">🧹</span>
            <span>Pre-PSA Cleaning & Restoration Studio</span>
            <Sparkles className="w-4 h-4 text-black animate-spin" />
          </button>
          <button
            onClick={() => { sound.playTabSwitch(); setStage('queue'); setFilterTab('vault'); }}
            className={`px-3.5 sm:px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border ${
              stage === 'queue' && filterTab === 'vault'
                ? 'bg-red-500/20 border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.3)]'
                : 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
            <span>PSA Vault ({gradedCards.length})</span>
          </button>
          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="px-3.5 sm:px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
            <span>Back to Packs</span>
          </button>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto flex-1 flex flex-col">
        {/* ──────────────── STAGE 1: SUBMISSION QUEUE OR VAULT ──────────────── */}
        {stage === 'queue' && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            
            {/* Dedicated Hero Banner: Pre-PSA Card Restoration Studio */}
            <div
              onClick={() => { sound.playTabSwitch(); setIsRestorationStudioOpen(true); }}
              className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-teal-950/60 via-emerald-950/40 to-[#0c181b] border-2 border-teal-400/60 shadow-[0_0_35px_rgba(45,212,191,0.25)] hover:shadow-[0_0_50px_rgba(45,212,191,0.4)] transition-all cursor-pointer relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 -mr-12 -mt-12 w-56 h-56 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-teal-400 via-emerald-400 to-amber-300 p-0.5 shadow-[0_0_20px_rgba(45,212,191,0.6)] flex items-center justify-center shrink-0 text-black font-black text-xl group-hover:scale-110 transition-transform">
                    🧹
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-300 mb-0.5">
                      <Sparkles className="w-4 h-4 animate-pulse text-amber-300" />
                      <span>CARD PREP & RESTORATION SUITE</span>
                      <span className="bg-teal-400/20 text-teal-200 text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-teal-400/40">
                        RECOMMENDED BEFORE GRADING
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-white group-hover:text-teal-200 transition-colors">
                      Pre-PSA Cleaning & Micro-Scratch Restoration Studio
                    </h3>
                    <p className="text-xs text-gray-300 mt-0.5 max-w-xl">
                      Buff micro-scratches, dust fingerprints & polish surfaces to boost your final PSA grade potential!
                    </p>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); sound.playTabSwitch(); setIsRestorationStudioOpen(true); }}
                  className="w-full md:w-auto px-6 py-3 rounded-2xl bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 text-black font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(45,212,191,0.6)] hover:shadow-[0_0_35px_rgba(45,212,191,0.9)] transition-all flex items-center justify-center gap-2 group-hover:scale-105 active:scale-95 cursor-pointer shrink-0"
                >
                  <Sparkles className="w-4 h-4 text-black animate-spin" />
                  <span>Launch Cleaning Studio</span>
                </button>
              </div>
            </div>

            {/* Quick Submit Sample Chase Cards Banner */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-red-950/40 via-purple-950/30 to-[#141420] border border-red-500/30 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400 mb-1">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Interactive Grading Demo • High-Tier Chase Cards
                  </div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-white">
                    Want to test the 5-Step PSA Interactive Lab right now?
                  </h3>
                  <p className="text-xs text-gray-300 mt-1 max-w-xl">
                    Select any sample card below to experience hands-on dust removal, border calipers, UV blacklight zone scanning, 10x microscope inspection, and ultrasonic sealing!
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-5">
                {SAMPLE_CHASE_CARDS.map((sample, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.03, y: -2 }}
                    className="p-3 rounded-2xl bg-black/60 border border-white/15 hover:border-white/40 transition-all flex items-center justify-between gap-3 cursor-pointer group shadow-lg relative overflow-hidden"
                    onClick={() => handleGradeSampleCard(sample)}
                  >
                    <img src={sample.imageUrl} alt={sample.name} className="w-13 h-18 rounded-lg object-cover border border-white/20 shadow-md shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black tracking-tight border bg-gradient-to-r ${sample.badgeColor}`}>
                          PSA {sample.targetGrade}
                        </span>
                      </div>
                      <div className="text-xs font-black text-white truncate group-hover:text-red-300 transition-colors">
                        {sample.name.split('—')[0]}
                      </div>
                      <div className="text-[10px] text-gray-400 truncate">{sample.setName.split('•')[1] || sample.setName}</div>
                      <div className="text-xs font-mono font-bold text-amber-300 mt-1">${sample.value.toFixed(2)}</div>
                    </div>
                    <div className="w-8 h-8 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-all shrink-0">
                      <Zap className="w-4 h-4" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Filter Navigation Tabs */}
            <div className="flex flex-wrap items-center justify-between border-b border-white/10 pb-3 gap-2">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full">
                <button
                  onClick={() => setFilterTab('ready')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                    filterTab === 'ready'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Ready ({readyCards.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('vault')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                    filterTab === 'vault'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>PSA Vault ({gradedCards.length})</span>
                </button>
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 sm:gap-2 ${
                    filterTab === 'all'
                      ? 'bg-red-500/20 border border-red-500/50 text-red-300 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                      : 'bg-white/5 border border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <span>All ({collection.length})</span>
                </button>
              </div>
            </div>

            {/* Card Grid */}
            {displayCards.length === 0 ? (
              <div className="p-12 rounded-3xl bg-white/[0.02] border border-white/10 text-center space-y-3">
                <ShieldCheck className="w-12 h-12 text-gray-500 mx-auto opacity-50" />
                <h4 className="text-base font-bold text-gray-300">No cards in this category</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto">
                  Open booster packs or click one of the quick sample chase cards above to start grading your collection right away!
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {displayCards.map((card) => {
                  const hasGrade = card.isSlabbed && card.psaDetails;
                  return (
                    <motion.div
                      key={card.id}
                      whileHover={{ scale: 1.03, y: -4 }}
                      onClick={() => startGradingProcess(card)}
                      className={`rounded-2xl p-3 bg-[#13141d] border transition-all cursor-pointer flex flex-col justify-between relative group overflow-hidden shadow-xl ${
                        hasGrade 
                          ? card.psaDetails?.gradeNum === 10
                            ? 'border-amber-400/60 shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                            : 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                          : 'border-white/10 hover:border-red-400/60'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-bold mb-2">
                        <span className="text-gray-400 truncate max-w-[80px]">{card.setName}</span>
                        {hasGrade ? (
                          <span className={`px-2 py-0.5 rounded font-mono font-black ${
                            card.psaDetails?.gradeNum === 10
                              ? 'bg-amber-500 text-black shadow-[0_0_8px_rgba(245,158,11,0.8)]'
                              : 'bg-red-600 text-white'
                          }`}>
                            PSA {card.psaDetails?.gradeNum}
                          </span>
                        ) : (
                          <span className="text-red-400 font-extrabold flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Grade
                          </span>
                        )}
                      </div>

                      <div className="w-full aspect-[63/88] rounded-xl overflow-hidden bg-black/40 relative flex items-center justify-center border border-white/10 mb-3 group-hover:border-white/30 transition-all">
                        <img src={card.imageUrl} alt={card.name} className="w-full h-full object-cover" />
                        {hasGrade && (
                          <div className="absolute top-0 inset-x-0 bg-gradient-to-b from-red-600 to-red-700 py-1 px-1.5 flex items-center justify-between border-b border-white/40 shadow-md">
                            <span className="text-[8px] font-black tracking-tighter text-white">PSA AUTHENTIC</span>
                            <span className="text-[9px] font-mono font-black text-amber-300">#{card.psaDetails?.certNumber.slice(-6)}</span>
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="text-xs font-black text-white truncate">{card.name}</div>
                        <div className="flex items-center justify-between mt-1 text-xs">
                          <span className="font-mono font-bold text-amber-300">${card.currentPrice.toFixed(2)}</span>
                          {hasGrade ? (
                            <button
                              onClick={(e) => handleCrackSlab(card, e)}
                              className="text-[10px] text-gray-400 hover:text-white underline"
                              title="Crack slab and re-submit for a chance at PSA 10"
                            >
                              Re-Grade
                            </button>
                          ) : (
                            <span className="text-[10px] font-extrabold text-red-400 flex items-center gap-0.5 group-hover:translate-x-1 transition-transform">
                              Submit <ChevronRight className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ──────────────── STAGE 2: STEP 1 OF 5 — SURFACE PREP & DUST REMOVAL ──────────────── */}
        {stage === 'prep' && activeCard && (
          <PrepMinigame
            activeCard={activeCard}
            onSequenceComplete={() => {
              setStage('centering');
            }}
          />
        )}

        {/* ──────────────── STAGE 3: STEP 2 OF 5 — OPTICAL CENTERING & LASER CALIPERS ──────────────── */}
        {stage === 'centering' && activeCard && (
          <CenteringMinigame 
            activeCard={activeCard} 
            centeringScore={subgrades.centering} 
            onNextStep={() => { sound.playLaserScan(); setStage('surface'); }} 
          />
        )}

        {/* ──────────────── STAGE 4: STEP 3 OF 5 — UV BLACKLIGHT & ZONE DEFECT SCANNER ──────────────── */}
        {stage === 'surface' && activeCard && (
          <SurfaceMinigame 
            activeCard={activeCard} 
            surfaceScore={subgrades.surface} 
            onNextStep={() => { sound.playLaserScan(); setStage('corners'); }} 
          />
        )}

        {/* ──────────────── STAGE 5: STEP 4 OF 5 — 10x MAGNIFYING LOUPE & CORNER PROFILER ──────────────── */}
        {stage === 'corners' && activeCard && (
          <CornersMinigame
            activeCard={activeCard}
            cornersScore={subgrades.corners}
            edgesScore={subgrades.edges}
            onNextStep={() => { sound.playLaserScan(); setStage('encapsulating'); }}
          />
        )}

        {/* ──────────────── STAGE 6: STEP 5 OF 5 — 3-PHASE ULTRASONIC ASSEMBLY & LASER WELDING ──────────────── */}
        {stage === 'encapsulating' && activeCard && (
          <EncapsulationSequence
            activeCard={activeCard}
            certNumber={certNumber}
            finalGrade={finalGrade}
            labelStyle={labelStyle}
            setLabelStyle={setLabelStyle}
            onSequenceComplete={handleEncapsulationComplete}
          />
        )}

        {/* ──────────────── STAGE 7: THE FINAL GRADE REVEAL! ──────────────── */}
        {stage === 'result' && activeCard && (
          <GradingResultCard
            activeCard={activeCard}
            certNumber={certNumber}
            finalGrade={finalGrade}
            subgrades={subgrades}
            valueMultiplier={valueMultiplier}
            labelStyle={labelStyle}
            onViewVault={() => { sound.playTabSwitch(); setStage('queue'); setFilterTab('vault'); }}
            onGradeAnother={() => { sound.playButtonClick(); setStage('queue'); setFilterTab('ready'); }}
          />
        )}
      </div>

      <PrePSARestorationStudio
        isOpen={isRestorationStudioOpen}
        onClose={() => setIsRestorationStudioOpen(false)}
        collection={collection}
        onSendToGrading={(card, isBoosted) => {
          loadCards();
          startGradingProcess(card, undefined, isBoosted);
        }}
      />
    </div>
  );
}

