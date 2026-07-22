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

type GradingStage = 'queue' | 'prep' | 'centering' | 'surface' | 'corners' | 'encapsulating' | 'result' | 'vault';

interface DustSpeck {
  id: number;
  x: number;
  y: number;
  size?: 'small' | 'medium' | 'large';
  type: 'dust' | 'smudge' | 'lint' | 'fingerprint';
  cleaned: boolean;
  blowingOff?: boolean;
  blowDirectionX?: number;
  blowDirectionY?: number;
}

interface SurfaceZone {
  id: number;
  name: string;
  label: string;
  checked: boolean;
  defectFound: boolean;
  note: string;
}

const SAMPLE_CHASE_CARDS = [
  {
    name: 'Charizard ex — Demo Guaranteed PSA 10',
    setName: 'Obsidian Flames • Gem Mint 10 Test',
    setNumber: '223/197',
    rarity: 'Special Illustration Rare',
    type: 'Fire',
    value: 85.50,
    targetGrade: 10,
    badgeColor: 'from-amber-400 via-amber-300 to-amber-500 text-black border-white shadow-[0_0_12px_rgba(245,158,11,0.8)]',
    imageUrl: 'https://images.pokemontcg.io/sv3/223_hires.png'
  },
  {
    name: 'Umbreon VMAX — Demo Guaranteed PSA 9',
    setName: 'Evolving Skies • Mint 9 Test',
    setNumber: '215/203',
    rarity: 'Secret Rare',
    type: 'Darkness',
    value: 650.00,
    targetGrade: 9,
    badgeColor: 'from-sky-400 via-blue-500 to-indigo-600 text-white border-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png'
  },
  {
    name: 'Pikachu ex — Demo Guaranteed PSA 8',
    setName: 'Surging Sparks • Near Mint-Mint 8 Test',
    setNumber: '238/191',
    rarity: 'Special Illustration Rare',
    type: 'Lightning',
    value: 180.00,
    targetGrade: 8,
    badgeColor: 'from-purple-500 via-purple-600 to-indigo-700 text-white border-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/sv8/238_hires.png'
  },
  {
    name: 'Giratina V — Demo Guaranteed PSA 7',
    setName: 'Lost Origin • Near Mint 7 Test',
    setNumber: '186/196',
    rarity: 'Special Illustration Rare',
    type: 'Dragon',
    value: 340.00,
    targetGrade: 7,
    badgeColor: 'from-rose-600 via-red-600 to-red-700 text-white border-red-300 shadow-[0_0_12px_rgba(244,63,94,0.6)]',
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png'
  }
];

const REFERENCE_VAULT_CARDS: Card[] = [
  {
    id: 'ref-psa-10',
    name: 'Charizard ex — Special Illustration Rare',
    setName: 'Obsidian Flames (Official PSA 10 Benchmark)',
    setNumber: '223/197',
    rarity: 'Special Illustration Rare',
    type: 'Fire',
    currentPrice: 273.60,
    priceChange: 12.4,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/sv3/223_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 10 Gem Mint',
    psaDetails: {
      gradeNum: 10,
      certNumber: '84920193',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 10, surface: 10, corners: 10, edges: 10 },
      originalValue: 85.50,
      multiplier: 3.2
    }
  },
  {
    id: 'ref-psa-9',
    name: 'Umbreon VMAX — Alternate Art Secret',
    setName: 'Evolving Skies (Official PSA 9 Benchmark)',
    setNumber: '215/203',
    rarity: 'Secret Rare',
    type: 'Darkness',
    currentPrice: 1170.00,
    priceChange: 5.8,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/swsh7/215_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 9 Mint',
    psaDetails: {
      gradeNum: 9,
      certNumber: '84920194',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 9.5, surface: 9.0, corners: 9.5, edges: 9.0 },
      originalValue: 650.00,
      multiplier: 1.8
    }
  },
  {
    id: 'ref-psa-8',
    name: 'Pikachu ex — Special Illustration Rare',
    setName: 'Surging Sparks (Official PSA 8 Benchmark)',
    setNumber: '238/191',
    rarity: 'Special Illustration Rare',
    type: 'Lightning',
    currentPrice: 225.00,
    priceChange: 1.2,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/sv8/238_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 8 Near Mint-Mint',
    psaDetails: {
      gradeNum: 8,
      certNumber: '84920195',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 8.5, surface: 8.0, corners: 8.5, edges: 8.5 },
      originalValue: 180.00,
      multiplier: 1.25
    }
  },
  {
    id: 'ref-psa-7',
    name: 'Giratina V — Alternate Full Art',
    setName: 'Lost Origin (Official PSA 7 Benchmark)',
    setNumber: '186/196',
    rarity: 'Special Illustration Rare',
    type: 'Dragon',
    currentPrice: 357.00,
    priceChange: 0.8,
    priceHistory: [],
    holofoil: true,
    imageUrl: 'https://images.pokemontcg.io/swsh11/186_hires.png',
    favorite: false,
    isSlabbed: true,
    slabGrade: 'PSA 7 Near Mint',
    psaDetails: {
      gradeNum: 7,
      certNumber: '84920196',
      gradedDate: 'Official Benchmark',
      subgrades: { centering: 7.5, surface: 7.0, corners: 7.5, edges: 7.5 },
      originalValue: 340.00,
      multiplier: 1.05
    }
  }
];

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
  const [prepTool, setPrepTool] = useState<'blower' | 'cloth'>('blower');
  const [dustSpecks, setDustSpecks] = useState<DustSpeck[]>([]);
  const [prepCleanedCount, setPrepCleanedCount] = useState(0);
  const [airPuffs, setAirPuffs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isDraggingPrep, setIsDraggingPrep] = useState(false);
  const [smudgeWarning, setSmudgeWarning] = useState<string | null>(null);

  // ── Step 2: Centering Calipers states ──
  const [centeringGridActive, setCenteringGridActive] = useState(true);
  const [showIdealOverlay, setShowIdealOverlay] = useState(false);
  const [manualShiftX, setManualShiftX] = useState(0);
  const [manualShiftY, setManualShiftY] = useState(0);

  // ── Step 3: UV Blacklight Zone Scanner states ──
  const [surfaceTool, setSurfaceTool] = useState<'uv' | 'glare'>('uv');
  const [surfaceZones, setSurfaceZones] = useState<SurfaceZone[]>([]);

  // ── Step 4: 10x Magnifying Loupe states ──
  const [activeCornerIndex, setActiveCornerIndex] = useState<number>(0);
  const [inspectedCorners, setInspectedCorners] = useState<boolean[]>([false, false, false, false]);

  // ── Step 5: Ultrasonic Encapsulation states ──
  const [labelStyle, setLabelStyle] = useState<'standard_red' | 'gold_30th' | 'black_diamond' | 'emerald_prism'>('standard_red');
  const [sealingProgress, setSealingProgress] = useState(0);
  const [isSealingActive, setIsSealingActive] = useState(false);
  const [assemblyPhase, setAssemblyPhase] = useState<'place_card' | 'apply_label' | 'sonic_weld'>('place_card');
  const [weldSeams, setWeldSeams] = useState<boolean[]>([false, false, false, false]); // [Top, Right, Bottom, Left]
  const [laserSparkPos, setLaserSparkPos] = useState<{ x: number; y: number } | null>(null);

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

    // Generate interactive dust & smudges for Step 1
    const generatedSpecks: DustSpeck[] = [
      { id: 1, x: 16, y: 14, size: 'medium', type: 'dust', cleaned: false },
      { id: 2, x: 74, y: 18, size: 'large', type: 'smudge', cleaned: false },
      { id: 3, x: 32, y: 22, size: 'small', type: 'dust', cleaned: false },
      { id: 4, x: 86, y: 28, size: 'medium', type: 'lint', cleaned: false },
      { id: 5, x: 22, y: 34, size: 'large', type: 'fingerprint', cleaned: false },
      { id: 6, x: 62, y: 36, size: 'medium', type: 'dust', cleaned: false },
      { id: 7, x: 48, y: 15, size: 'small', type: 'dust', cleaned: false },
      { id: 8, x: 14, y: 46, size: 'large', type: 'lint', cleaned: false },
      { id: 9, x: 52, y: 48, size: 'medium', type: 'smudge', cleaned: false },
      { id: 10, x: 88, y: 52, size: 'small', type: 'dust', cleaned: false },
      { id: 11, x: 38, y: 58, size: 'medium', type: 'lint', cleaned: false },
      { id: 12, x: 76, y: 64, size: 'large', type: 'dust', cleaned: false },
      { id: 13, x: 20, y: 68, size: 'medium', type: 'dust', cleaned: false },
      { id: 14, x: 66, y: 74, size: 'large', type: 'fingerprint', cleaned: false },
      { id: 15, x: 36, y: 80, size: 'small', type: 'dust', cleaned: false },
      { id: 16, x: 84, y: 84, size: 'medium', type: 'lint', cleaned: false },
      { id: 17, x: 50, y: 86, size: 'large', type: 'smudge', cleaned: false },
      { id: 18, x: 18, y: 88, size: 'medium', type: 'dust', cleaned: false },
      { id: 19, x: 72, y: 42, size: 'small', type: 'dust', cleaned: false },
      { id: 20, x: 44, y: 38, size: 'large', type: 'fingerprint', cleaned: false },
      { id: 21, x: 58, y: 24, size: 'medium', type: 'lint', cleaned: false },
      { id: 22, x: 28, y: 52, size: 'small', type: 'dust', cleaned: false },
      { id: 23, x: 80, y: 12, size: 'medium', type: 'dust', cleaned: false },
      { id: 24, x: 42, y: 72, size: 'large', type: 'dust', cleaned: false }
    ];
    setDustSpecks(generatedSpecks);
    setPrepCleanedCount(0);
    setPrepTool('blower');
    setAirPuffs([]);
    setSmudgeWarning(null);

    // Reset centering state
    setCenteringGridActive(true);
    setShowIdealOverlay(false);
    setManualShiftX(centeringScore < 8.5 ? 12 : centeringScore < 9.8 ? 6 : 0);
    setManualShiftY(0);

    // Initialize Surface zones for Step 3
    setSurfaceZones([
      {
        id: 1,
        name: 'Top Holofoil Header Zone',
        label: 'Top Header & Title Foil Sheen',
        checked: false,
        defectFound: surfaceScore < 9.5,
        note: surfaceScore < 9.5 ? 'Minor foil clouding / micro-scratch (-0.5 pt)' : 'Flawless mirror gloss reflection ✓'
      },
      {
        id: 2,
        name: 'Center Artwork Texture Zone',
        label: 'Character Illustration & Etching',
        checked: false,
        defectFound: surfaceScore < 8.5,
        note: surfaceScore < 8.5 ? 'Factory print line detected across art (-1.0 pt)' : 'Crisp illustration emboss & clarity ✓'
      },
      {
        id: 3,
        name: 'Bottom Border & Gloss Zone',
        label: 'Text Box & Lower Frame Integrity',
        checked: false,
        defectFound: surfaceScore < 7.5,
        note: surfaceScore < 7.5 ? 'Surface scuff / loss of gloss finish (-1.5 pt)' : 'Immaculate lower gloss & text boundary ✓'
      }
    ]);
    setSurfaceTool('uv');

    // Reset corners inspection for Step 4
    setActiveCornerIndex(0);
    setInspectedCorners([false, false, false, false]);

    // Reset encapsulation for Step 5
    setSealingProgress(0);
    setIsSealingActive(false);
    setAssemblyPhase('place_card');
    setWeldSeams([false, false, false, false]);
    setLaserSparkPos(null);
  };

  // Step 1 interaction helpers
  const triggerCleanAt = (x: number, y: number, forceId?: number) => {
    if (prepTool === 'blower') {
      sound.playAirBlower();
      setAirPuffs(prev => [...prev.slice(-6), { id: Date.now() + Math.random(), x, y }]);

      let hitSmudge = false;
      let cleanedThisRound = 0;

      setDustSpecks(prev => {
        return prev.map(d => {
          if (d.cleaned || d.blowingOff) return d;
          const isDirect = forceId !== undefined && d.id === forceId;
          const dist = Math.hypot(d.x - x, d.y - y);
          if (isDirect || dist < 26) {
            if (d.type === 'smudge' || d.type === 'fingerprint') {
              hitSmudge = true;
              return d;
            } else {
              cleanedThisRound++;
              const dirX = d.x > 50 ? 280 : -280;
              const dirY = -220 + Math.random() * 100;
              setTimeout(() => {
                setDustSpecks(curr => curr.map(item => item.id === d.id ? { ...item, cleaned: true, blowingOff: false } : item));
                setPrepCleanedCount(count => count + 1);
              }, 450);
              return { ...d, blowingOff: true, blowDirectionX: dirX, blowDirectionY: dirY };
            }
          }
          return d;
        });
      });

      if (hitSmudge && cleanedThisRound === 0) {
        setSmudgeWarning('⚠️ Air Blower blasts off loose dust/lint, but greasy smudges require the Anti-Static Wipe!');
        setTimeout(() => setSmudgeWarning(null), 3500);
      }
    } else {
      sound.playClothWipe();
      let cleanedThisRound = 0;
      setDustSpecks(prev => {
        const next = prev.map(d => {
          if (d.cleaned || d.blowingOff) return d;
          const isDirect = forceId !== undefined && d.id === forceId;
          const dist = Math.hypot(d.x - x, d.y - y);
          if (isDirect || dist < 30) {
            cleanedThisRound++;
            return { ...d, cleaned: true };
          }
          return d;
        });
        if (cleanedThisRound > 0) {
          setPrepCleanedCount(count => count + cleanedThisRound);
        }
        return next;
      });
    }
  };

  const handleCleanSpeck = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const target = dustSpecks.find(d => d.id === id);
    if (!target || target.cleaned || target.blowingOff) return;
    triggerCleanAt(target.x, target.y, id);
  };

  const handleCleanAllPrep = () => {
    sound.playLaserScan();
    setDustSpecks(prev => prev.map(d => ({ ...d, cleaned: true, blowingOff: false })));
    setPrepCleanedCount(dustSpecks.length);
  };

  // Step 3 interaction
  const handleScanZone = (id: number) => {
    sound.playUVScan();
    setSurfaceZones(prev => prev.map(z => z.id === id ? { ...z, checked: true } : z));
  };

  // Step 4 interaction
  const handleInspectCorner = (idx: number) => {
    sound.playLoupeZoom();
    setActiveCornerIndex(idx);
    setInspectedCorners(prev => {
      const copy = [...prev];
      copy[idx] = true;
      return copy;
    });
  };

  // Step 5 interactive assembly & welding helpers
  const handlePlaceCardInWell = () => {
    sound.playTabSwitch();
    setAssemblyPhase('apply_label');
  };

  const handleApplyCertLabel = () => {
    sound.playButtonClick();
    setAssemblyPhase('sonic_weld');
  };

  const handleWeldSeam = (index: number) => {
    if (isSealingActive || weldSeams[index]) return;
    sound.playUltrasonicWeldPulse();
    const nextSeams = [...weldSeams];
    nextSeams[index] = true;
    setWeldSeams(nextSeams);
    const newProgress = nextSeams.filter(Boolean).length * 25;
    setSealingProgress(newProgress);

    if (newProgress >= 100) {
      triggerFinalUltrasonicSeal();
    }
  };

  const triggerFinalUltrasonicSeal = () => {
    if (isSealingActive) return;
    setIsSealingActive(true);
    setSealingProgress(100);
    sound.playUltrasonicSeal();
    setTimeout(() => {
      setIsSealingActive(false);
      if (activeCard) {
        savePSAGradingResult(
          activeCard.id,
          finalGrade,
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
      sound.playGradeReveal(finalGrade);
    }, 1800);
  };

  const handlePulseSealing = () => {
    if (isSealingActive || sealingProgress >= 100) return;
    sound.playUltrasonicWeldPulse();
    const unsealedIdx = weldSeams.findIndex(s => !s);
    if (unsealedIdx !== -1) {
      handleWeldSeam(unsealedIdx);
    } else {
      triggerFinalUltrasonicSeal();
    }
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

  const cornerLabels = ['Top-Left Corner (TL)', 'Top-Right Corner (TR)', 'Bottom-Left Corner (BL)', 'Bottom-Right Corner (BR)'];

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
            className="px-3.5 sm:px-5 py-2 rounded-xl bg-gradient-to-r from-teal-400 via-emerald-400 to-amber-300 text-black font-black text-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-[0_0_25px_rgba(45,212,191,0.5)] border border-teal-200 hover:brightness-110"
          >
            <span>🧹 Pre-PSA Cleaning & Restoration Studio</span>
            <Sparkles className="w-4 h-4 text-black animate-pulse" />
          </button>
          <button
            onClick={() => { sound.playTabSwitch(); setStage('queue'); setFilterTab('vault'); }}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer border ${
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
            className="px-3.5 sm:px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 sm:gap-2 cursor-pointer shadow-lg"
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
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
            <div 
              onMouseDown={(e) => {
                setIsDraggingPrep(true);
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setMousePos({ x, y });
                triggerCleanAt(x, y);
              }}
              onMouseMove={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                setMousePos({ x, y });
                if (isDraggingPrep) {
                  triggerCleanAt(x, y);
                }
              }}
              onMouseUp={() => setIsDraggingPrep(false)}
              onMouseLeave={() => {
                setIsDraggingPrep(false);
                setMousePos(null);
              }}
              onTouchStart={(e) => {
                setIsDraggingPrep(true);
                const touch = e.touches[0] || e.changedTouches[0];
                if (touch) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((touch.clientX - rect.left) / rect.width) * 100;
                  const y = ((touch.clientY - rect.top) / rect.height) * 100;
                  setMousePos({ x, y });
                  triggerCleanAt(x, y);
                }
              }}
              onTouchMove={(e) => {
                const touch = e.touches[0] || e.changedTouches[0];
                if (touch) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = ((touch.clientX - rect.left) / rect.width) * 100;
                  const y = ((touch.clientY - rect.top) / rect.height) * 100;
                  setMousePos({ x, y });
                  if (isDraggingPrep) {
                    triggerCleanAt(x, y);
                  }
                }
              }}
              onTouchEnd={() => {
                setIsDraggingPrep(false);
                setMousePos(null);
              }}
              className="relative w-72 sm:w-80 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-emerald-400/60 shadow-[0_0_45px_rgba(16,185,129,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none cursor-crosshair touch-none"
            >
              <img 
                src={activeCard.imageUrl} 
                alt={activeCard.name} 
                className="w-full h-full object-cover block pointer-events-none"
              />

              {/* Interactive Air Puff Animations */}
              <AnimatePresence>
                {airPuffs.map(puff => (
                  <motion.div
                    key={puff.id}
                    initial={{ scale: 0.2, opacity: 0.95 }}
                    animate={{ scale: 3.2, opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.55, ease: 'easeOut' }}
                    style={{ left: `${puff.x}%`, top: `${puff.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-30"
                  >
                    <div className="w-16 h-16 rounded-full border-2 border-cyan-300/80 bg-gradient-to-r from-cyan-400/30 to-white/40 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.8)]">
                      <span className="text-xl animate-spin">💨</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {/* Interactive Dust Specks & Smudge Overlays */}
              <div className="absolute inset-0 z-10">
                {dustSpecks.map((speck) => (
                  <motion.div
                    key={speck.id}
                    initial={{ scale: 1, opacity: speck.cleaned ? 0 : 0.9 }}
                    animate={
                      speck.blowingOff
                        ? {
                            x: speck.blowDirectionX || 250,
                            y: speck.blowDirectionY || -180,
                            rotate: 360,
                            scale: 0.3,
                            opacity: 0
                          }
                        : speck.cleaned
                        ? { scale: 0, opacity: 0 }
                        : { scale: 1, opacity: 0.95, x: 0, y: 0, rotate: 0 }
                    }
                    transition={speck.blowingOff ? { duration: 0.45, ease: 'easeIn' } : { duration: 0.3 }}
                    style={{ left: `${speck.x}%`, top: `${speck.y}%` }}
                    onClick={(e) => handleCleanSpeck(speck.id, e)}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer p-2 rounded-full transition-transform hover:scale-125 ${
                      speck.cleaned || speck.blowingOff ? 'pointer-events-none' : 'pointer-events-auto'
                    }`}
                  >
                    {speck.type === 'dust' ? (
                      <div className={`${speck.size === 'small' ? 'w-6 h-6 text-xs' : speck.size === 'large' ? 'w-9 h-9 text-base' : 'w-7 h-7 text-sm'} bg-white/95 rounded-full shadow-[0_0_16px_rgba(255,255,255,1)] flex items-center justify-center border-2 border-cyan-300 animate-pulse`}>
                        <span className="text-black font-black">✦</span>
                      </div>
                    ) : speck.type === 'lint' ? (
                      <div className="px-3 py-1.5 rounded-full bg-amber-300/95 border-2 border-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.9)] flex items-center justify-center">
                        <span className="text-xs font-black text-amber-950 transform rotate-45">〰️ LINT</span>
                      </div>
                    ) : speck.type === 'fingerprint' ? (
                      <div className="w-11 h-11 rounded-full bg-cyan-500/50 border-2 border-cyan-300/90 backdrop-blur-sm flex flex-col items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.9)]">
                        <span className="text-lg">👆</span>
                      </div>
                    ) : (
                      <div className="w-14 h-10 rounded-full bg-gradient-to-br from-amber-500/80 to-purple-600/80 border-2 border-amber-300 backdrop-blur-sm flex items-center justify-center shadow-[0_0_22px_rgba(245,158,11,0.9)]">
                        <span className="text-[10px] text-white font-mono font-black tracking-wider">💧 SMUDGE</span>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Tool Sprites that follow Mouse Cursor on Card */}
              {mousePos && (
                <motion.div
                  style={{ left: `${mousePos.x}%`, top: `${mousePos.y}%` }}
                  animate={
                    prepTool === 'cloth' && isDraggingPrep
                      ? { rotate: [-15, 20, -15, 20, 0], scale: [1.1, 0.9, 1.1, 0.9, 1] }
                      : prepTool === 'blower' && isDraggingPrep
                      ? { scale: [1, 0.8, 1.1, 1] }
                      : { scale: 1 }
                  }
                  transition={{ duration: 0.2 }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-40"
                >
                  {prepTool === 'blower' ? (
                    <div className="relative flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-700 rounded-full border-2 border-cyan-300 shadow-[0_0_18px_rgba(6,182,212,0.8)] flex items-center justify-center">
                        <Wind className="w-5 h-5 text-white animate-pulse" />
                      </div>
                      <div className="w-4 h-2.5 bg-gray-300 rounded-r border border-gray-400 shadow-md" />
                      {isDraggingPrep && <span className="text-sm absolute left-12 top-0 animate-ping">💨</span>}
                    </div>
                  ) : (
                    <div className="relative group transform -rotate-12">
                      <div className="absolute inset-0 bg-amber-400/40 rounded-xl blur-md" />
                      <div className="relative w-12 h-10 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-500 rounded-lg border-2 border-amber-200 shadow-[0_4px_15px_rgba(245,158,11,0.7)] flex items-center justify-center">
                        <div className="absolute inset-1 border border-dashed border-amber-600/40 rounded opacity-70" />
                        <span className="text-base">🧽</span>
                        <span className="absolute -top-2 -right-2 text-xs animate-bounce">✨</span>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Warning Toast when blowing on smudge */}
              <AnimatePresence>
                {smudgeWarning && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="absolute top-4 inset-x-4 z-50 bg-red-950/95 border border-red-500/80 text-red-200 text-[10px] font-bold p-2.5 rounded-xl shadow-2xl flex items-center justify-center text-center backdrop-blur-md"
                  >
                    {smudgeWarning}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Tool instructions banner on preview */}
              <div className="absolute bottom-2 inset-x-2 bg-black/80 backdrop-blur-md border border-emerald-500/40 py-1.5 px-3 rounded-xl flex items-center justify-between text-[10px] z-20 pointer-events-none">
                <span className="text-emerald-300 font-bold flex items-center gap-1.5">
                  {prepTool === 'blower' ? <Wind className="w-3.5 h-3.5 text-cyan-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
                  {prepTool === 'blower' ? 'Click or drag across card to blow air' : 'Wipe with microfiber cloth over smudges'}
                </span>
                <span className="font-mono font-black text-white">{prepCleanedCount}/{dustSpecks.length} CLEANED</span>
              </div>
            </div>

            {/* Stage Controls */}
            <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                <Gauge className="w-4 h-4" /> Step 1 of 5: Micro-Debris Dusting & Surface Prep
              </div>
              <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
              <p className="text-xs text-gray-300 leading-relaxed">
                Before optical caliper scanning, professional graders remove microscopic dust particles and skin oil smudges. Any debris left behind will permanently ruin the surface subgrade inside the slab!
              </p>

              {/* Interactive Tool Selector */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => { sound.playAirBlower(); setPrepTool('blower'); }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    prepTool === 'blower'
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Wind className={`w-5 h-5 ${prepTool === 'blower' ? 'text-cyan-300' : 'text-gray-400'}`} />
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/40">Tool 1</span>
                  </div>
                  <div className="text-xs font-black">Micro-Air Puff Blower</div>
                  <div className="text-[10px] text-gray-400">Puffs loose dust particles</div>
                </button>

                <button
                  onClick={() => { sound.playClothWipe(); setPrepTool('cloth'); }}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                    prepTool === 'cloth'
                      ? 'bg-amber-500/20 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Sparkles className={`w-5 h-5 ${prepTool === 'cloth' ? 'text-amber-300' : 'text-gray-400'}`} />
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-black/40">Tool 2</span>
                  </div>
                  <div className="text-xs font-black">Anti-Static Wipe</div>
                  <div className="text-[10px] text-gray-400">Wipes fingerprints & oil</div>
                </button>
              </div>

              {/* Cleanliness Progress Gauge */}
              <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                  <span>Surface Prep Cleanliness:</span>
                  <span className={`${prepCleanedCount === dustSpecks.length ? 'text-emerald-400' : 'text-amber-300'} font-mono font-black`}>
                    {Math.round((prepCleanedCount / Math.max(1, dustSpecks.length)) * 100)}% ({prepCleanedCount}/{dustSpecks.length})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }} 
                    animate={{ width: `${(prepCleanedCount / Math.max(1, dustSpecks.length)) * 100}%` }}
                    className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-emerald-300 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.8)]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                {prepCleanedCount < dustSpecks.length && (
                  <button
                    onClick={handleCleanAllPrep}
                    className="px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-emerald-400" /> Auto-Clean
                  </button>
                )}
                <button
                  onClick={() => { sound.playLaserScan(); setStage('centering'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Engage Laser Centering Calipers</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ──────────────── STAGE 3: STEP 2 OF 5 — OPTICAL CENTERING & LASER CALIPERS ──────────────── */}
        {stage === 'centering' && activeCard && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
            <div className="relative w-72 sm:w-80 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-cyan-400/60 shadow-[0_0_45px_rgba(6,182,212,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none">
              <img 
                src={activeCard.imageUrl} 
                alt={activeCard.name} 
                className="w-full h-full object-cover block"
              />

              {/* Digital Optical Calipers Overlay */}
              {centeringGridActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3.5">
                  {/* Outer Margin Ratio Boundary Frame */}
                  <div 
                    style={{ 
                      transform: `translate(${manualShiftX}px, ${manualShiftY}px)`,
                      borderColor: showIdealOverlay ? 'rgba(52,211,153,0.9)' : 'rgba(6,182,212,0.8)' 
                    }}
                    className="absolute inset-3 border-2 border-dashed rounded-lg transition-transform duration-300 shadow-[inset_0_0_12px_rgba(6,182,212,0.2)]" 
                  />

                  {/* True Optical Center Crosshair */}
                  <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-cyan-400/70 border-t border-dashed border-cyan-300" />
                  <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[1px] bg-cyan-400/70 border-l border-dashed border-cyan-300" />
                  
                  {/* Visual Shift Line when Centering is Off */}
                  {subgrades.centering < 9.8 && (
                    <div 
                      style={{ left: subgrades.centering < 8.5 ? '58%' : '54%' }}
                      className="absolute inset-y-0 w-[2px] bg-red-500 shadow-[0_0_8px_rgba(239,68,68,1)] flex items-center justify-center animate-pulse"
                    >
                      <div className="bg-red-600 text-white font-mono text-[8px] font-black px-1.5 py-0.5 rounded-full absolute -top-1 whitespace-nowrap shadow-md">
                        ⚠️ ARTWORK CENTER SHIFTED RIGHT
                      </div>
                    </div>
                  )}

                  {/* 50/50 Ideal Outline comparison overlay */}
                  {showIdealOverlay && (
                    <div className="absolute inset-3 border-2 border-emerald-400/90 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.6)] flex items-center justify-center">
                      <div className="bg-emerald-950/95 text-emerald-300 border border-emerald-400 text-[8px] font-mono font-black px-2 py-0.5 rounded-full shadow">
                        50/50 IDEAL BENCHMARK BOUNDARY
                      </div>
                    </div>
                  )}

                  {/* Left Border Bar */}
                  <div className={`absolute top-1/2 -translate-y-1/2 left-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-black shadow-lg flex items-center gap-1 ${
                    subgrades.centering === 10
                      ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
                      : subgrades.centering >= 8.5
                      ? 'bg-amber-950/90 border border-amber-400 text-amber-300'
                      : 'bg-red-950/90 border border-red-500 text-red-300 animate-pulse'
                  }`}>
                    <span>◀ Left: {subgrades.centering === 10 ? '2.5mm (50%)' : subgrades.centering >= 8.5 ? '2.8mm (55%)' : '3.4mm (60% THICK)'}</span>
                  </div>

                  {/* Right Border Bar */}
                  <div className={`absolute top-1/2 -translate-y-1/2 right-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono font-black shadow-lg flex items-center gap-1 ${
                    subgrades.centering === 10
                      ? 'bg-emerald-950/90 border border-emerald-400 text-emerald-300'
                      : subgrades.centering >= 8.5
                      ? 'bg-amber-950/90 border border-amber-400 text-amber-300'
                      : 'bg-red-950/90 border border-red-500 text-red-300 animate-pulse'
                  }`}>
                    <span>Right: {subgrades.centering === 10 ? '2.5mm (50%)' : subgrades.centering >= 8.5 ? '2.2mm (45%)' : '1.6mm (40% THIN) ▶'}</span>
                  </div>

                  {/* Top & Bottom Header Indicators */}
                  <div className="absolute top-1.5 left-2 bg-[#0a0f1d]/90 border border-cyan-400/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300 shadow-md">
                    📐 L/R Ratio: {subgrades.centering === 10 ? '50/50 Perfect' : subgrades.centering >= 8.5 ? '55/45 Off-Center' : '60/40 Lopsided!'}
                  </div>
                  <div className="absolute bottom-1.5 right-2 bg-[#0a0f1d]/90 border border-cyan-400/60 px-2 py-0.5 rounded text-[9px] font-mono font-bold text-cyan-300 shadow-md">
                    📐 T/B Ratio: {subgrades.centering === 10 ? '50/50 Perfect' : '52/48 Near'}
                  </div>

                  {/* Scanning Laser Sweep Animation */}
                  <motion.div 
                    animate={{ y: ['0%', '800%', '0%'] }} 
                    transition={{ repeat: Infinity, duration: 3.5, ease: 'easeInOut' }}
                    className="absolute left-0 right-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_12px_rgba(6,182,212,1)] opacity-80"
                  />
                </div>
              )}
            </div>

            {/* Stage Controls */}
            <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                <Crosshair className="w-4 h-4" /> Step 2 of 5: Optical Centering & Border Ratio
              </div>
              <h3 className="text-xl font-black text-white">{activeCard.name}</h3>

              {/* Interactive Caliper Alignment & Nudge controls */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-cyan-300">
                  <span>Interactive Caliper Alignment:</span>
                  <button
                    onClick={() => { sound.playButtonClick(); setShowIdealOverlay(!showIdealOverlay); }}
                    className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer border ${
                      showIdealOverlay ? 'bg-emerald-500 text-black border-emerald-300' : 'bg-white/10 text-gray-300 border-white/20'
                    }`}
                  >
                    {showIdealOverlay ? '★ Ideal 50/50 ON' : 'Show Ideal 50/50'}
                  </button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-gray-400 font-medium">Test border shift grid:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => { sound.playButtonClick(); setManualShiftX(prev => prev - 2); }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
                    >
                      ◀ Nudge L
                    </button>
                    <button
                      onClick={() => { sound.playButtonClick(); setManualShiftX(0); setManualShiftY(0); }}
                      className="px-2 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 cursor-pointer"
                    >
                      Auto-Center
                    </button>
                    <button
                      onClick={() => { sound.playButtonClick(); setManualShiftX(prev => prev + 2); }}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-bold text-white cursor-pointer"
                    >
                      Nudge R ▶
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Layman Diagnosis Flaw Audit Box */}
              <div className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-2 shadow-inner transition-all ${
                subgrades.centering === 10
                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-100'
                  : subgrades.centering >= 8.5
                  ? 'bg-amber-500/10 border-amber-400/40 text-amber-100'
                  : 'bg-red-500/15 border-red-500/50 text-red-100 shadow-[0_0_20px_rgba(239,68,68,0.15)]'
              }`}>
                <div className="font-extrabold flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                    <Sparkles className={`w-4 h-4 ${subgrades.centering === 10 ? 'text-emerald-400' : subgrades.centering >= 8.5 ? 'text-amber-400' : 'text-red-400'}`} />
                    Layman Diagnosis: Why {subgrades.centering.toFixed(1)}/10?
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase ${
                    subgrades.centering === 10 ? 'bg-emerald-500/30 text-emerald-300' : subgrades.centering >= 8.5 ? 'bg-amber-500/30 text-amber-300' : 'bg-red-500/30 text-red-300 animate-pulse'
                  }`}>
                    {subgrades.centering === 10 ? 'PERFECT' : subgrades.centering >= 8.5 ? 'MINOR SHIFT' : 'FLAWED CENTERING'}
                  </span>
                </div>

                <p className="text-gray-300 text-[11px] font-medium">
                  {subgrades.centering === 10 ? (
                    <>
                      <strong className="text-emerald-300">Zero flaws detected!</strong> Notice how the border frame is exactly identical in thickness on the left (`2.5mm`) and right (`2.5mm`). Because the artwork sits dead-center, PSA awards a flawless <strong className="text-white">10/10</strong>.
                    </>
                  ) : subgrades.centering >= 8.5 ? (
                    <>
                      <strong className="text-amber-300">Noticeable minor shift:</strong> Look at the left vs. right border widths. The left border (`2.8mm`) is slightly thicker (`55%`) while the right border (`2.2mm`) is thinner (`45%`). PSA's laser calipers deduct <strong className="text-amber-300">{(10 - subgrades.centering).toFixed(1)} points</strong> for this border imbalance.
                    </>
                  ) : (
                    <>
                      <strong className="text-red-400">Severe Lopsided Borders!</strong> Even a layman can instantly spot what is wrong here: look at how wide and thick the Left border (`3.4mm — 60%`) is compared to the thin, squeezed Right border (`1.6mm — 40%`). Because the artwork is visibly shifted right off-center, PSA deducts <strong className="text-red-400">{(10 - subgrades.centering).toFixed(1)} full points</strong>!
                    </>
                  )}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => { sound.playButtonClick(); setCenteringGridActive(!centeringGridActive); }}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                >
                  <Eye className="w-4 h-4 text-cyan-400" /> {centeringGridActive ? 'Hide Calipers' : 'Show Calipers'}
                </button>
                <button
                  onClick={() => { sound.playLaserScan(); setStage('surface'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Lock Centering & Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ──────────────── STAGE 4: STEP 3 OF 5 — UV BLACKLIGHT & ZONE DEFECT SCANNER ──────────────── */}
        {stage === 'surface' && activeCard && (
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
                    className={`p-2.5 rounded-xl border backdrop-blur-md transition-all cursor-pointer flex items-center justify-between ${
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
              <div className="absolute bottom-2 inset-x-2 bg-black/80 backdrop-blur-md py-1 px-2.5 rounded-xl border border-purple-500/40 flex items-center justify-between text-[10px] z-20 pointer-events-none">
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
                  <span className="text-purple-300 font-mono font-black">SUB-GRADE: {subgrades.surface.toFixed(1)}/10</span>
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
                  onClick={() => { sound.playLaserScan(); setStage('corners'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-rose-600 hover:from-purple-500 hover:to-pink-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(168,85,247,0.4)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Verify Surface & Next Step</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ──────────────── STAGE 5: STEP 4 OF 5 — 10x MAGNIFYING LOUPE & CORNER PROFILER ──────────────── */}
        {stage === 'corners' && activeCard && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-6 items-center justify-center py-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center shrink-0">
              {/* Main Card with Corner Selector Buttons */}
              <div className="relative w-64 sm:w-72 aspect-[63/88] rounded-2xl bg-[#0e1018] border-2 border-amber-400/50 shadow-[0_0_40px_rgba(245,158,11,0.25)] overflow-hidden shrink-0 flex items-center justify-center select-none">
                <img 
                  src={activeCard.imageUrl} 
                  alt={activeCard.name} 
                  className="w-full h-full object-cover block"
                />

                {/* 4 Interactive Corner Target Buttons */}
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
                    subgrades.corners === 10
                      ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                      : subgrades.corners >= 8.5
                      ? 'border-amber-400 bg-amber-950/40 shadow-[0_0_20px_rgba(245,158,11,0.4)]'
                      : 'border-red-500 bg-red-950/40 shadow-[0_0_25px_rgba(239,68,68,0.6)]'
                  }`}>
                    <div className="text-center p-2">
                      <div className="text-xs font-black text-white">{cornerLabels[activeCornerIndex].split(' ')[0]}</div>
                      <div className={`text-[10px] font-mono mt-1 ${subgrades.corners === 10 ? 'text-emerald-300' : subgrades.corners >= 8.5 ? 'text-amber-300' : 'text-red-300'}`}>
                        {subgrades.corners === 10 ? '90.0° CUT ✓' : subgrades.corners >= 8.5 ? '89.6° MINOR WEAR' : 'WHITENING NICK!'}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-center bg-black/60 rounded-xl p-2 border border-white/10 text-gray-200">
                  {subgrades.corners === 10 ? (
                    <span className="text-emerald-300 font-bold">Immaculate 90° razor-sharp cut. Zero fiber separation!</span>
                  ) : subgrades.corners >= 8.5 ? (
                    <span className="text-amber-300 font-bold">Microscopic speck of whitening detected along edge tip.</span>
                  ) : (
                    <span className="text-red-400 font-bold">Visible corner fraying / edge nick (-{(10 - subgrades.corners).toFixed(1)} pt).</span>
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
                <span>Corners Score: <strong className="text-amber-400 font-mono">{subgrades.corners.toFixed(1)}/10</strong></span>
                <span>Edges Score: <strong className="text-amber-400 font-mono">{subgrades.edges.toFixed(1)}/10</strong></span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => setInspectedCorners([true, true, true, true])}
                  className="px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                >
                  Verify 4/4
                </button>
                <button
                  onClick={() => { sound.playLaserScan(); setStage('encapsulating'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>Proceed to Ultrasonic Sealing</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ──────────────── STAGE 6: STEP 5 OF 5 — 3-PHASE ULTRASONIC ASSEMBLY & LASER WELDING ──────────────── */}
        {stage === 'encapsulating' && activeCard && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center py-6">
            {/* Interactive Assembly & Sealing Chamber Preview */}
            <div className={`relative w-72 sm:w-80 aspect-[60/98] rounded-[24px] p-3 transition-all duration-500 flex flex-col items-center justify-between overflow-hidden shrink-0 select-none ${
              assemblyPhase === 'sonic_weld'
                ? 'bg-gradient-to-b from-[#2a2d38] via-[#181a24] to-[#12131a] border-4 border-red-500 shadow-[0_0_65px_rgba(239,68,68,0.7)]'
                : 'bg-[#10131d]/90 border-2 border-dashed border-cyan-400/80 shadow-[0_0_40px_rgba(6,182,212,0.3)]'
            }`}>
              {/* PHASE 2 & 3: Certification Label Header */}
              {assemblyPhase !== 'place_card' ? (
                <motion.div 
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  onClick={() => assemblyPhase === 'apply_label' && handleApplyCertLabel()}
                  className={`w-full rounded-xl p-2.5 border shadow-md z-20 flex items-center justify-between gap-2 transition-transform cursor-pointer ${
                    assemblyPhase === 'apply_label' ? 'animate-bounce border-2 border-amber-300 ring-4 ring-amber-400/40' : ''
                  } ${
                    labelStyle === 'gold_30th'
                      ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-amber-300 text-black'
                      : labelStyle === 'black_diamond'
                      ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-cyan-400 text-white'
                      : labelStyle === 'emerald_prism'
                      ? 'bg-gradient-to-r from-emerald-700 via-teal-600 to-cyan-700 border-emerald-300 text-white'
                      : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-white/40 text-white'
                  }`}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 font-black text-xs">
                      <span>PSA</span>
                      <span className="text-[9px] font-mono uppercase opacity-90">{labelStyle === 'gold_30th' ? '★ 30TH ANNIV' : labelStyle === 'black_diamond' ? '◈ REGISTRY' : labelStyle === 'emerald_prism' ? '✦ PRISM' : 'CERTIFIED'}</span>
                    </div>
                    <div className="text-[10px] font-bold truncate">{activeCard.name.split('—')[0]}</div>
                    <div className="text-[9px] font-mono opacity-80">CERT #{certNumber}</div>
                  </div>
                  <div className="w-11 h-11 rounded-lg bg-black/40 border border-white/20 flex flex-col items-center justify-center font-black">
                    <span className="text-[8px] leading-none text-gray-300">GRADE</span>
                    <span className="text-lg leading-none text-white">{finalGrade}</span>
                  </div>
                </motion.div>
              ) : (
                <div 
                  onClick={handlePlaceCardInWell}
                  className="w-full h-16 rounded-xl border-2 border-dashed border-white/20 bg-black/40 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-400 transition-colors"
                >
                  <span className="text-[10px] font-mono font-bold text-gray-400">[ ACRYLIC HEADER SLOT EMPTY ]</span>
                  <span className="text-[9px] text-cyan-400">Drop Card below first!</span>
                </div>
              )}

              {/* Inner Cavity / Polycarbonate Well */}
              <div 
                onClick={() => assemblyPhase === 'place_card' && handlePlaceCardInWell()}
                className={`w-full flex-1 my-2 rounded-xl overflow-hidden border relative flex items-center justify-center transition-all ${
                  assemblyPhase === 'place_card' 
                    ? 'border-2 border-dashed border-emerald-400/80 bg-black/50 cursor-pointer hover:bg-black/80' 
                    : 'border border-white/10 bg-black'
                }`}
              >
                {assemblyPhase === 'place_card' ? (
                  <motion.div 
                    animate={{ y: [-6, 6, -6], scale: [0.98, 1.02, 0.98] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="flex flex-col items-center justify-center p-4 text-center"
                  >
                    <img src={activeCard.imageUrl} alt={activeCard.name} className="w-36 h-48 object-cover rounded-lg shadow-2xl border border-white/30 mb-3 opacity-90" />
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-black text-xs animate-pulse">
                      📥 Click or Drop Card into Well
                    </span>
                  </motion.div>
                ) : (
                  <motion.img 
                    initial={{ scale: 1.15, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    src={activeCard.imageUrl} 
                    alt={activeCard.name} 
                    className="w-full h-full object-contain" 
                  />
                )}

                {/* PHASE 3: Ultrasonic Seam Welding Nodes & Sparks */}
                {assemblyPhase === 'sonic_weld' && (
                  <>
                    {/* Top Seam Node */}
                    <button
                      onClick={() => handleWeldSeam(0)}
                      className={`absolute top-2 inset-x-12 h-8 rounded-full border-2 font-mono text-[10px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
                        weldSeams[0] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-600/90 border-amber-300 text-amber-100 animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                      }`}
                    >
                      {weldSeams[0] ? '✓ TOP SEAM WELDED' : '⚡ CLICK TO LASER WELD TOP SEAM'}
                    </button>

                    {/* Bottom Seam Node */}
                    <button
                      onClick={() => handleWeldSeam(2)}
                      className={`absolute bottom-2 inset-x-12 h-8 rounded-full border-2 font-mono text-[10px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
                        weldSeams[2] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-red-600/90 border-amber-300 text-amber-100 animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(239,68,68,0.9)]'
                      }`}
                    >
                      {weldSeams[2] ? '✓ BOTTOM SEAM WELDED' : '⚡ CLICK TO LASER WELD BOTTOM'}
                    </button>

                    {/* Left Seam Node */}
                    <button
                      onClick={() => handleWeldSeam(3)}
                      className={`absolute left-2 inset-y-16 w-8 rounded-full border-2 font-mono text-[9px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
                        weldSeams[3] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-cyan-600/90 border-cyan-300 text-white animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.9)]'
                      }`}
                    >
                      <span className="transform -rotate-90 whitespace-nowrap">{weldSeams[3] ? '✓ LEFT WELD' : '⚡ LEFT SEAM'}</span>
                    </button>

                    {/* Right Seam Node */}
                    <button
                      onClick={() => handleWeldSeam(1)}
                      className={`absolute right-2 inset-y-16 w-8 rounded-full border-2 font-mono text-[9px] font-black transition-all flex items-center justify-center z-30 cursor-pointer ${
                        weldSeams[1] ? 'bg-emerald-600/90 border-emerald-300 text-white shadow-[0_0_15px_rgba(16,185,129,0.8)]' : 'bg-cyan-600/90 border-cyan-300 text-white animate-pulse hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.9)]'
                      }`}
                    >
                      <span className="transform rotate-90 whitespace-nowrap">{weldSeams[1] ? '✓ RIGHT WELD' : '⚡ RIGHT SEAM'}</span>
                    </button>
                  </>
                )}

                {/* Sealing Active Wave Effect */}
                {isSealingActive && (
                  <motion.div 
                    animate={{ scale: [1, 1.25, 1], opacity: [0.5, 0.95, 0.5] }}
                    transition={{ repeat: Infinity, duration: 0.5 }}
                    className="absolute inset-0 border-4 border-cyan-400 bg-cyan-500/30 pointer-events-none rounded-xl z-40 flex items-center justify-center" 
                  >
                    <div className="px-4 py-2 rounded-2xl bg-black/90 border-2 border-cyan-300 text-cyan-300 font-mono font-black text-xs animate-bounce shadow-2xl">
                      ⚡ 20,000 HZ ULTRASONIC FUSION IN PROGRESS...
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Sealing Status Bar */}
              <div className="w-full bg-black/80 rounded-lg py-2 px-3 border border-white/10 flex items-center justify-between text-[10px] font-mono text-gray-300">
                <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <RotateCw className={`w-3.5 h-3.5 ${isSealingActive ? 'animate-spin text-red-400' : ''}`} />
                  {sealingProgress >= 100 ? 'SEAL COMPLETE!' : `${sealingProgress}% WELDED`}
                </span>
                <span>{assemblyPhase === 'place_card' ? 'PHASE 1: INSERT CARD' : assemblyPhase === 'apply_label' ? 'PHASE 2: APPLY LABEL' : 'PHASE 3: SONIC WELD'}</span>
              </div>
            </div>

            {/* Stage Controls */}
            <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-red-400">
                  <RotateCw className="w-4 h-4 animate-spin" /> Step 5 of 5: Assembly & Ultrasonic Sealing
                </div>
                <span className="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-400 text-red-300 font-mono text-[10px] font-extrabold">
                  {assemblyPhase === 'place_card' ? '1/3 WELL' : assemblyPhase === 'apply_label' ? '2/3 LABEL' : '3/3 WELD'}
                </span>
              </div>

              <h3 className="text-xl font-black text-white">{activeCard.name}</h3>
              
              {assemblyPhase === 'place_card' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    First, place your graded card into the optical-grade polycarbonate acrylic well. The inner rails cushion the edges without applying pressure to the card foil.
                  </p>
                  <button
                    onClick={handlePlaceCardInWell}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(16,185,129,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>📥 Drop Card into Inner Slab Well</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {assemblyPhase === 'apply_label' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Choose your custom hologram registry label design below, then press it into the top cavity above the card!
                  </p>
                  {/* Label Style Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-300">Select Slab Label Hologram Style:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        onClick={() => { sound.playButtonClick(); setLabelStyle('standard_red'); }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          labelStyle === 'standard_red'
                            ? 'bg-red-600 border-white text-white font-black shadow-[0_0_12px_rgba(239,68,68,0.6)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px]">Classic Red</div>
                      </button>
                      <button
                        onClick={() => { sound.playButtonClick(); setLabelStyle('gold_30th'); }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          labelStyle === 'gold_30th'
                            ? 'bg-amber-500 border-white text-black font-black shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px]">30th Gold</div>
                      </button>
                      <button
                        onClick={() => { sound.playButtonClick(); setLabelStyle('black_diamond'); }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          labelStyle === 'black_diamond'
                            ? 'bg-gray-800 border-cyan-400 text-white font-black shadow-[0_0_12px_rgba(6,182,212,0.6)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px]">Black Diamond</div>
                      </button>
                      <button
                        onClick={() => { sound.playButtonClick(); setLabelStyle('emerald_prism'); }}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          labelStyle === 'emerald_prism'
                            ? 'bg-emerald-600 border-white text-white font-black shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        <div className="text-[10px]">Emerald Prism</div>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleApplyCertLabel}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:to-red-500 text-white font-extrabold text-sm uppercase tracking-wider shadow-[0_0_25px_rgba(245,158,11,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>🏷️ Press Certification Hologram Label</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {assemblyPhase === 'sonic_weld' && (
                <div className="space-y-4">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    Now the top lid is lowered. <span className="text-cyan-300 font-bold">Click the 4 perimeter laser seams on the slab preview</span> or use the sonic trigger below to permanently fuse the case!
                  </p>

                  {/* Seam Checklist */}
                  <div className="grid grid-cols-2 gap-2">
                    {['Top Edge Seam', 'Right Rail Seam', 'Bottom Seam', 'Left Rail Seam'].map((label, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleWeldSeam(idx)}
                        className={`p-2.5 rounded-xl border text-[11px] font-black cursor-pointer flex items-center justify-between transition-all ${
                          weldSeams[idx]
                            ? 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.4)]'
                            : 'bg-white/5 border-white/15 text-gray-300 hover:border-red-400'
                        }`}
                      >
                        <span>{label}</span>
                        <span>{weldSeams[idx] ? '✓' : '⚡'}</span>
                      </div>
                    ))}
                  </div>

                  {/* Weld Progress Gauge */}
                  <div className="p-4 rounded-2xl bg-black/40 border border-white/10 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-gray-300">
                      <span>Tamper-Proof Sealing Progress:</span>
                      <span className="text-red-400 font-mono font-black">{sealingProgress}% ({weldSeams.filter(Boolean).length}/4 SEAMS)</span>
                    </div>
                    <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden p-0.5">
                      <motion.div 
                        animate={{ width: `${sealingProgress}%` }}
                        className="h-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 rounded-full shadow-[0_0_12px_rgba(239,68,68,1)]"
                      />
                    </div>
                  </div>

                  {/* Interactive Tactile Seal Button */}
                  <div className="flex items-center gap-3">
                    {sealingProgress < 100 && (
                      <button
                        onClick={() => {
                          sound.playUltrasonicWeldPulse();
                          setWeldSeams([true, true, true, true]);
                          triggerFinalUltrasonicSeal();
                        }}
                        className="px-4 py-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-gray-300 text-xs font-bold transition-all cursor-pointer shrink-0"
                      >
                        ⚡ Auto-Weld All
                      </button>
                    )}
                    <button
                      onClick={handlePulseSealing}
                      disabled={isSealingActive || sealingProgress >= 100}
                      className={`flex-1 py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xl ${
                        sealingProgress >= 100
                          ? 'bg-emerald-600 text-white shadow-[0_0_30px_rgba(16,185,129,0.8)]'
                          : 'bg-gradient-to-r from-red-600 via-rose-600 to-amber-500 hover:from-red-500 hover:to-amber-400 text-white shadow-[0_0_35px_rgba(239,68,68,0.7)] active:scale-95'
                      }`}
                    >
                      <Award className="w-5 h-5 text-amber-200" />
                      <span>{sealingProgress >= 100 ? 'Sealed! Revealing Grade...' : `Sonic Weld Pulse (${sealingProgress}%)`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ──────────────── STAGE 7: THE FINAL GRADE REVEAL! ──────────────── */}
        {stage === 'result' && activeCard && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.85 }} 
            animate={{ opacity: 1, scale: 1 }} 
            transition={{ type: 'spring', damping: 18 }}
            className="flex-1 flex flex-col lg:flex-row gap-8 items-center justify-center py-6"
          >
            {/* The Official PSA Slab */}
            <div className="relative w-72 sm:w-80 aspect-[60/98] rounded-[24px] bg-gradient-to-b from-[#2a2d38]/90 via-[#181a24]/95 to-[#12131a] p-3 border-4 border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.9),0_0_50px_rgba(239,68,68,0.4)] flex flex-col items-center justify-between overflow-hidden shrink-0 group">
              <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-white/5 pointer-events-none z-20" />

              {/* Top Certification Header with Custom Label Style */}
              <div className={`w-full rounded-xl p-2.5 border shadow-md z-10 flex items-center justify-between gap-2 ${
                labelStyle === 'gold_30th'
                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 border-amber-300 text-black'
                  : labelStyle === 'black_diamond'
                  ? 'bg-gradient-to-r from-gray-900 via-black to-gray-900 border-cyan-400 text-white'
                  : 'bg-gradient-to-r from-red-700 via-red-600 to-red-700 border-white/30 text-white'
              }`}>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5 font-black text-xs tracking-wider">
                    <span>PSA</span>
                    <span className="text-[9px] font-mono font-bold">
                      {finalGrade === 10 ? 'GEM MT 10' : finalGrade === 9 ? 'MINT 9' : finalGrade === 8 ? 'NM-MT 8' : 'NEAR MINT 7'}
                    </span>
                  </div>
                  <div className="text-[10px] font-bold truncate">{activeCard.name.split('—')[0]}</div>
                  <div className="text-[9px] font-mono opacity-90">CERT #{certNumber}</div>
                </div>

                <div className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center shrink-0 border-2 font-black shadow-lg ${
                  finalGrade === 10
                    ? 'bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 border-white text-black shadow-[0_0_15px_rgba(245,158,11,0.8)]'
                    : finalGrade === 9
                    ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 border-white text-white shadow-[0_0_15px_rgba(56,189,248,0.6)]'
                    : finalGrade === 8
                    ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 border-white text-white shadow-[0_0_15px_rgba(168,85,247,0.6)]'
                    : 'bg-gradient-to-br from-rose-600 via-red-600 to-red-700 border-white text-white shadow-[0_0_15px_rgba(244,63,94,0.6)]'
                }`}>
                  <span className="text-[9px] leading-none opacity-90">GRADE</span>
                  <span className="text-xl leading-none">{finalGrade}</span>
                </div>
              </div>

              {/* Card Encapsulated Inside */}
              <div className="w-full flex-1 my-2 rounded-xl overflow-hidden border border-white/10 relative flex items-center justify-center bg-black">
                <img src={activeCard.imageUrl} alt={activeCard.name} className="w-full h-full object-contain" />
              </div>

              {/* Slab Footer Label */}
              <div className="w-full bg-black/60 rounded-lg py-1.5 px-2.5 border border-white/10 flex items-center justify-between text-[9px] font-mono text-gray-400 z-10">
                <span className="flex items-center gap-1 text-emerald-400 font-bold"><ShieldCheck className="w-3 h-3" /> VERIFIED</span>
                <span>SUBGRADES: {subgrades.centering}/{subgrades.surface}/{subgrades.corners}/{subgrades.edges}</span>
              </div>
            </div>

            {/* Grading Report & Portfolio Appreciation */}
            <div className="max-w-md w-full bg-[#13141d] border border-white/15 rounded-3xl p-6 shadow-2xl space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> Official PSA Grading Report
                </div>
                <span className="font-mono text-xs text-gray-400">#{certNumber}</span>
              </div>

              <div>
                <h3 className="text-2xl font-black text-white flex items-center gap-2.5">
                  <span>PSA {finalGrade}</span>
                  <span className={`text-base font-extrabold px-2.5 py-0.5 rounded-full ${
                    finalGrade === 10 ? 'bg-amber-500 text-black' : 'bg-red-500/20 text-red-300 border border-red-500/40'
                  }`}>
                    {finalGrade === 10 ? 'GEM MINT 10' : finalGrade === 9 ? 'MINT 9' : 'NEAR MINT 8'}
                  </span>
                </h3>
                <p className="text-xs text-gray-300 mt-1">
                  Congratulations! This card has completed all 5 inspection stages and is permanently sealed in your authentic PSA registry slab.
                </p>
              </div>

              {/* Value Appreciation Breakdown */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-[#14181c] border border-emerald-500/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
                  <span>Raw Ungraded Value:</span>
                  <span className="font-mono">${(activeCard.psaDetails?.originalValue || activeCard.currentPrice / valueMultiplier).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm font-black text-emerald-300 pt-2 border-t border-emerald-500/30">
                  <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> PSA {finalGrade} Market Value:</span>
                  <span className="font-mono text-lg">${activeCard.currentPrice.toFixed(2)} ({valueMultiplier}x Multiplier)</span>
                </div>
              </div>

              {/* Subgrades Breakdown Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-gray-400">Centering:</span>
                  <span className="font-mono font-bold text-white">{subgrades.centering.toFixed(1)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-gray-400">Surface:</span>
                  <span className="font-mono font-bold text-white">{subgrades.surface.toFixed(1)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-gray-400">Corners:</span>
                  <span className="font-mono font-bold text-white">{subgrades.corners.toFixed(1)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
                  <span className="text-gray-400">Edges:</span>
                  <span className="font-mono font-bold text-white">{subgrades.edges.toFixed(1)}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => { sound.playTabSwitch(); setStage('queue'); setFilterTab('vault'); }}
                  className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>View in PSA Vault</span>
                </button>
                <button
                  onClick={() => { sound.playButtonClick(); setStage('queue'); setFilterTab('ready'); }}
                  className="px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white font-extrabold text-xs transition-all cursor-pointer"
                >
                  Grade Another
                </button>
              </div>
            </div>
          </motion.div>
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

