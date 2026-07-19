import React, { useState, useMemo, useEffect } from "react";
import { loadJapaneseMetadata, getCardShowDynamicJapaneseCards, resolveVendorCardRealPrice } from "../../services/scrydex";
import { handleCardImageError } from "../../services/tcgdex";
import {
  Menu,
  Search,
  Bell,
  Check,
  Play,
  Camera,
  Star,
  ArrowUpRight,
  Crosshair,
  Zap,
  Activity,
  ArrowLeft,
  Package,
  ShieldCheck,
  TrendingUp,
  Award,
  Filter,
  Maximize2,
  Minimize2,
  MapPin,
  SlidersHorizontal,
  Users,
  Eye,
  RotateCcw,
  TrendingDown,
  Coins,
  X,
  Wallet,
  Repeat,
  CheckCircle2
} from "lucide-react";
import { AuctionDashboard } from '../auction/AuctionDashboard';
import {
  getCollectedCards,
  saveCollectedCard,
  updateCardSlabStatus,
  getCash,
  spendCash,
  removeCollectedCard,
  type Card,
} from '../binder/types';

interface CardShowViewProps {
  initialShowAuction?: boolean;
  onBackToPacks?: () => void;
  onInspectCard?: (card: any) => void;
  onAddNetReturn?: (amount: number) => void;
  onSpendNetReturn?: (amount: number) => void;
}

// ── CLEAN FLOOR ROSTER ────────────────────────────────────────────────────────
// The Card Show now contains ONLY vendor booths and a single Auction booth.
// All trading tables, signings, autograph pits, tournaments and accessory/
// display booths have been removed. Each vendor has a stable `category` used to
// theme its catalog, and a stable grid position on the floor map.
interface VendorDef {
  id: string;
  name: string;
  booth: string;
  type: "vendor" | "auction";
  category?: "vintage" | "modern" | "japanese" | "slab" | "goldstar";
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  rating: string;
  activeListings: string;
  completedTrans: string;
  specialties: string[];
  discountScore: number;
}

const VENDORS: VendorDef[] = [
  {
    id: "auction",
    name: "MAIN STAGE & AUCTION ARENA",
    booth: "Zone 1",
    type: "auction",
    x: 40, y: 45, w: 160, h: 280,
    color: "#ef4444",
    rating: "5.0 / 5",
    activeListings: "125 Grails Live",
    completedTrans: "50,000+",
    specialties: ["Live Auctions", "Celebrity Signings", "Trophy Card Reveals"],
    discountScore: 95,
  },
  {
    id: "vintagevault",
    name: "VINTAGEVAULT TCG",
    booth: "5B",
    type: "vendor",
    category: "vintage",
    x: 215, y: 45, w: 85, h: 80,
    color: "#2dd4bf",
    rating: "4.8 / 5",
    activeListings: "3,450+ Items",
    completedTrans: "12,800+",
    specialties: ["WOTC Japanese (Kanji)", "e-Series (JPN)", "Neo Destiny"],
    discountScore: 75,
  },
  {
    id: "alpha",
    name: "ALPHA GRAILS",
    booth: "5A",
    type: "vendor",
    category: "slab",
    x: 320, y: 45, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.9 / 5",
    activeListings: "4,200+ Items",
    completedTrans: "19,500+",
    specialties: ["WOTC Sealed", "1st Ed Base", "Trophy Cards"],
    discountScore: 82,
  },
  {
    id: "modernalt",
    name: "MODERN ALT ART VAULT",
    booth: "16",
    type: "vendor",
    category: "modern",
    x: 425, y: 45, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.9 / 5",
    activeListings: "2,400+ Singles",
    completedTrans: "11,500+",
    specialties: ["Giratina V Alt", "Moonbreon", "Rayquaza VMAX Alt"],
    discountScore: 82,
  },
  {
    id: "japanese",
    name: "JAPANESE HIGH CLASS HUB",
    booth: "46",
    type: "vendor",
    category: "japanese",
    x: 530, y: 45, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.8 / 5",
    activeListings: "3,800+ Items",
    completedTrans: "18,400+",
    specialties: ["Shiny Treasure EX", "VSTAR Universe", "Terastal Festival EX"],
    discountScore: 78,
  },
  {
    id: "goldstar",
    name: "GOLD STAR COLLECTORS",
    booth: "6B",
    type: "vendor",
    category: "goldstar",
    x: 215, y: 145, w: 85, h: 80,
    color: "#f472b6",
    rating: "4.8 / 5",
    activeListings: "1,120+ Items",
    completedTrans: "6,900+",
    specialties: ["Gold Star Espeon", "Shining Charizard", "Crystal Lugia"],
    discountScore: 76,
  },
  {
    id: "carbanda",
    name: "CARBANDA VINTAGE TCG",
    booth: "7B",
    type: "vendor",
    category: "vintage",
    x: 320, y: 145, w: 85, h: 80,
    color: "#f472b6",
    rating: "4.9 / 5",
    activeListings: "2,200+ Cards",
    completedTrans: "12,100+",
    specialties: ["Shadowless Holos", "Skyridge Crystal Types", "Aquapolis Holos"],
    discountScore: 84,
  },
  {
    id: "brodes",
    name: "BRODES TCG SYNDICATE",
    booth: "15",
    type: "vendor",
    category: "modern",
    x: 425, y: 145, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.8 / 5",
    activeListings: "1,900+ Items",
    completedTrans: "9,300+",
    specialties: ["Japanese S&V Master Sets", "Promo Cards", "High Grade Slabs"],
    discountScore: 76,
  },
  {
    id: "specs",
    name: "SPECS GRADED GRAILS",
    booth: "8C",
    type: "vendor",
    category: "slab",
    x: 530, y: 145, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.9 / 5",
    activeListings: "3,100+ Items",
    completedTrans: "16,200+",
    specialties: ["BGS 10 Gold Labels", "1st Ed Neo Destiny", "Trophy Kangaskhan"],
    discountScore: 82,
  },
  {
    id: "uds",
    name: "UDS COLLECTIBLES & SLABS",
    booth: "8B",
    type: "vendor",
    category: "modern",
    x: 215, y: 245, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.8 / 5",
    activeListings: "2,100+ Slabs",
    completedTrans: "11,800+",
    specialties: ["PSA 10 Modern Grails", "Sun & Moon Alt Arts", "Tag Team Promos"],
    discountScore: 74,
  },
  {
    id: "wikrats",
    name: "WIKRATS POKÉMON EMPORIUM",
    booth: "8A",
    type: "vendor",
    category: "vintage",
    x: 320, y: 245, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.7 / 5",
    activeListings: "1,350+ Items",
    completedTrans: "6,400+",
    specialties: ["WOTC Holos", "EX Era Delta Species", "Level X Cards"],
    discountScore: 68,
  },
  {
    id: "neodestiny",
    name: "NEO DESTINY SPECIALIST",
    booth: "8D",
    type: "vendor",
    category: "vintage",
    x: 425, y: 245, w: 85, h: 80,
    color: "#38bdf8",
    rating: "4.9 / 5",
    activeListings: "1,420+ Items",
    completedTrans: "8,400+",
    specialties: ["Neo Destiny Shinings", "Neo Revelation Holos", "1st Edition Neo Classics"],
    discountScore: 82,
  },
  {
    id: "paldean",
    name: "PALDEAN PROMOS TCG BOOTH",
    booth: "5D",
    type: "vendor",
    category: "modern",
    x: 530, y: 245, w: 85, h: 80,
    color: "#f472b6",
    rating: "4.8 / 5",
    activeListings: "2,100+ Items",
    completedTrans: "9,800+",
    specialties: ["Crown Zenith GGs", "Scarlet & Violet Promos", "Modern Alt Arts"],
    discountScore: 74,
  },
];

export const CardShowView: React.FC<CardShowViewProps> = ({
  initialShowAuction = false,
  onBackToPacks,
  onInspectCard,
  onAddNetReturn,
  onSpendNetReturn,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showArbSpotlight, setShowArbSpotlight] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(130);
  const [mobileSection, setMobileSection] = useState<'map' | 'market' | 'vendor'>('market');
  const [showAuctionDashboard, setShowAuctionDashboard] = useState(initialShowAuction);
  useEffect(() => {
    setShowAuctionDashboard(initialShowAuction);
  }, [initialShowAuction]);

  // Vendor "Buy · Trade or Cash" purchase flow
  const [tradeTarget, setTradeTarget] = useState<any>(null);
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [brokenOriginalIds, setBrokenOriginalIds] = useState<string[]>([]);
  const [visibleBatchLimit, setVisibleBatchLimit] = useState<number>(6);
  const [completedCardIds, setCompletedCardIds] = useState<Set<string>>(new Set());
  const [intersectingCardIds, setIntersectingCardIds] = useState<Set<string>>(new Set());

  const onCardRenderComplete = (cardId?: string) => {
    if (!cardId) return;
    setCompletedCardIds(prev => {
      if (prev.has(cardId)) return prev;
      const next = new Set(prev);
      next.add(cardId);
      return next;
    });
  };

  useEffect(() => {
    loadJapaneseMetadata().then(() => {
      setMetadataLoaded(true);
    });
  }, []);

  const handleCardShowImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardId?: string, isJpn?: boolean) => {
    const img = e.currentTarget;
    let setId = 'swsh3';
    let num = '1';

    const targetId = cardId || img.dataset.imgId;
    const cardItem = activeVendorCards.find(c => c.id === targetId || c.originalId === targetId || (c as any).id === targetId);
    if (cardItem) {
      if ((cardItem as any).setId) setId = (cardItem as any).setId;
      if ((cardItem as any).num) num = String((cardItem as any).num);
      const orig = cardItem.originalId || cardItem.id || '';
      if (orig.includes('-')) {
        const parts = orig.split('-');
        const lowerPrefix = parts[0].toLowerCase();
        const isVendorOrBoothPrefix = lowerPrefix.includes('booth') || lowerPrefix.includes('core') || lowerPrefix.includes('vintage') ||
          lowerPrefix.includes('alpha') || lowerPrefix.includes('digimon') || lowerPrefix.includes('his') || lowerPrefix.includes('slab') ||
          lowerPrefix.includes('retro') || lowerPrefix.includes('tcg') || lowerPrefix.includes('special') || lowerPrefix.includes('gold') ||
          lowerPrefix.includes('sealed') || lowerPrefix.includes('modern') || lowerPrefix.includes('japanese') || lowerPrefix.includes('display') ||
          lowerPrefix.includes('filmera') || lowerPrefix.includes('carbanda') || lowerPrefix.includes('trading') || lowerPrefix.includes('brodes') ||
          lowerPrefix.includes('wikrats') || lowerPrefix.includes('uds') || lowerPrefix.includes('specs') || lowerPrefix.includes('dovakinji') ||
          lowerPrefix === 'jp' || (parts[1] && parts[1] === 'core') || (parts[1] && parts[1].includes('jp'));

        if (!isVendorOrBoothPrefix && parts.length >= 2 && !parts[0].match(/^[0-9]+$/)) {
          setId = parts[0];
          num = parts[1];
        }
      }
    }

    const match = img.src.match(/\/pokemon\/([a-z0-9_-]+)[/-]([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
      img.src.match(/\/([a-z0-9_-]+)\/([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
      img.src.match(/\/([a-z0-9_-]+)[/-]([0-9]+)(\.png|\.webp|_hires)/i);

    if (match && (!cardItem || setId === 'swsh3')) {
      setId = match[1];
      num = match[2];
    } else if (!cardItem && targetId && targetId.includes('-')) {
      const parts = targetId.split('-');
      const lowerPrefix = parts[0].toLowerCase();
      const isVendorOrBoothPrefix = lowerPrefix.includes('booth') || lowerPrefix.includes('core') || lowerPrefix.includes('vintage') ||
        lowerPrefix.includes('alpha') || lowerPrefix.includes('digimon') || lowerPrefix.includes('his') || lowerPrefix.includes('slab') ||
        lowerPrefix.includes('retro') || lowerPrefix.includes('tcg') || lowerPrefix.includes('special') || lowerPrefix.includes('gold') ||
        lowerPrefix.includes('sealed') || lowerPrefix.includes('modern') || lowerPrefix.includes('japanese') || lowerPrefix.includes('display') ||
        lowerPrefix.includes('filmera') || lowerPrefix.includes('carbanda') || lowerPrefix.includes('trading') || lowerPrefix.includes('brodes') ||
        lowerPrefix.includes('wikrats') || lowerPrefix.includes('uds') || lowerPrefix.includes('specs') || lowerPrefix.includes('dovakinji') ||
        lowerPrefix === 'jp' || parts[1] === 'core' || parts[1].includes('jp');

      if (!isVendorOrBoothPrefix && parts.length >= 2 && !parts[0].match(/^[0-9]+$/)) {
        setId = parts[0];
        num = parts[1];
      }
    }

    const origStr = cardItem?.originalId || cardItem?.id || targetId || '';
    const isKnownJpPrefix = /^(sm11a|sm9a|sm8b|sm12a|s12a|s8b|s6a|s7r|s11|s12|s9|sm9|sm11b|sm12|sv2a|sv3pt5|sv8a|sv1a|sv1v|sv1s|sv2p|sv2d|sv3|sv3a|sv4a|sv4m|sv4k|sv5m|sv5k|sv5a|sv6|sv6a|sv6m|sv7|sv7a|sv8|sv9|sv9a|sv10|sv11a|sv11b|sv11w|s4a|swsh12a|swsh8b|swsh5a|swsh6a)(_ja)?(-|$)/i.test(origStr) || /^(sm11a|sm9a|sm8b|sm12a|s12a|s8b|s6a|s7r|s11|s12|s9|sm9|sm11b|sm12|sv2a|sv3pt5|sv8a|sv1a|sv1v|sv1s|sv2p|sv2d|sv3|sv3a|sv4a|sv4m|sv4k|sv5m|sv5k|sv5a|sv6|sv6a|sv6m|sv7|sv7a|sv8|sv9|sv9a|sv10|sv11a|sv11b|sv11w|s4a|swsh12a|swsh8b|swsh5a|swsh6a)(_ja)?(-|$)/i.test(setId);

    const isJpnCard = Boolean(isJpn || isKnownJpPrefix || setId.toLowerCase().includes('_ja') || cardItem?.name?.includes('Japanese') || origStr.includes('_ja') || img.src.includes('_ja') || img.src.includes('/ja/'));
    if (isJpnCard && !setId.toLowerCase().includes('_ja')) {
      setId = `${setId.replace(/_ja$/i, '')}_ja`;
    }

    handleCardImageError(img, setId, num, () => {
      const cardContainer = img.closest('[data-card-container]') as HTMLElement | null;
      if (cardContainer) {
        cardContainer.style.display = 'none';
      }
      setBrokenOriginalIds(prev => prev.includes(origStr) ? prev : [...prev, origStr]);
      onCardRenderComplete(targetId);
    });
  };

  const handleCardShowImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardId?: string, isJpn?: boolean) => {
    const img = e.currentTarget;
    const targetId = cardId || img.dataset.imgId;
    if (!img.src.includes('pokemontcg.io') && !img.src.includes('scrydex.com') && !img.src.includes('tcgdex')) {
      onCardRenderComplete(targetId);
      return;
    }
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onCardRenderComplete(targetId);
        return;
      }
      ctx.drawImage(img, 0, 0, 8, 8);
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
      const isCardBack = r < 50 && g < 75 && b > 90;
      if (isCardBack) {
        handleCardShowImageError(
          { currentTarget: img } as React.SyntheticEvent<HTMLImageElement, Event>,
          targetId,
          isJpn
        );
        return;
      }
    } catch {
      // canvas tainted by CORS — fall through to byte-size check below
    }
    // Scrydex returns HTTP 200 + a fixed-size card-back placeholder (186316 = English,
    // 350441 = Japanese) for missing cards. The pixel check above only catches the
    // blue Japanese back, so verify the byte size for Scrydex URLs before declaring done.
    if (img.src.includes('scrydex.com')) {
      fetch(img.src, { signal: AbortSignal.timeout(5000) })
        .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject()))
        .then((buf) => {
          if (buf.byteLength === 186316 || buf.byteLength === 350441) {
            handleCardShowImageError(
              { currentTarget: img } as React.SyntheticEvent<HTMLImageElement, Event>,
              targetId,
              isJpn
            );
          } else {
            onCardRenderComplete(targetId);
          }
        })
        .catch(() => onCardRenderComplete(targetId));
      return;
    }
    onCardRenderComplete(targetId);
  };


  const [selectedVendor, setSelectedVendor] = useState<any>(VENDORS.find(v => v.type === 'vendor'));

  const [hoveredBooth, setHoveredBooth] = useState<any>(null);

  // --- AUDIENCE FOOTPATH & RANDOMIZED CROWD POPULARITY ENGINE ---
  const { stallPopularity, hotBoothNames, footpathNetwork, animatedAudienceDots, staticClusterDots } = useMemo(() => {
    const stalls = VENDORS;

    const eligibleStalls = [...stalls.filter(s => s.type !== 'auction')].sort(() => Math.random() - 0.5);
    const hotBooths = eligibleStalls.slice(0, 4);
    const hotNamesSet = new Set(hotBooths.map(s => s.name));

    const remainingEligible = eligibleStalls.slice(4);
    const highTrafficBooths = remainingEligible.slice(0, 6);
    const highTrafficNamesSet = new Set(highTrafficBooths.map(s => s.name));

    const popMap: Record<string, { level: 'HOT 🔥🔥' | 'HIGH TRAFFIC ⚡' | 'MODERATE 👥' | 'STEADY 🟢', score: number, color: string }> = {};
    stalls.forEach(s => {
      if (hotNamesSet.has(s.name)) {
        popMap[s.name] = { level: 'HOT 🔥🔥', score: 95 + Math.floor(Math.random() * 5), color: s.color };
      } else if (highTrafficNamesSet.has(s.name)) {
        popMap[s.name] = { level: 'HIGH TRAFFIC ⚡', score: 75 + Math.floor(Math.random() * 15), color: s.color };
      } else {
        popMap[s.name] = { level: Math.random() > 0.4 ? 'MODERATE 👥' : 'STEADY 🟢', score: 45 + Math.floor(Math.random() * 25), color: s.color };
      }
    });

    const hubs = [
      { id: "hub_nw", x: 130, y: 125, color: "#38bdf8" },
      { id: "hub_n", x: 310, y: 125, color: "#f472b6" },
      { id: "hub_ne", x: 450, y: 125, color: "#38bdf8" },
      { id: "hub_cw", x: 130, y: 195, color: "#c084fc" },
      { id: "hub_c", x: 310, y: 195, color: "#ffffff" },
      { id: "hub_ce", x: 450, y: 195, color: "#fbbf24" },
      { id: "hub_sw", x: 130, y: 268, color: "#2dd4bf" },
      { id: "hub_s", x: 310, y: 268, color: "#34d399" },
      { id: "hub_se", x: 450, y: 268, color: "#f472b6" },
      { id: "hub_bot", x: 310, y: 340, color: "#38bdf8" }
    ];

    const corridors = [
      { x1: 130, y1: 125, x2: 310, y2: 125, color: "#38bdf8", isHot: false },
      { x1: 310, y1: 125, x2: 450, y2: 125, color: "#f472b6", isHot: false },
      { x1: 130, y1: 125, x2: 130, y2: 195, color: "#c084fc", isHot: false },
      { x1: 310, y1: 125, x2: 310, y2: 195, color: "#ffffff", isHot: false },
      { x1: 450, y1: 125, x2: 450, y2: 195, color: "#38bdf8", isHot: false },
      { x1: 130, y1: 195, x2: 310, y2: 195, color: "#fbbf24", isHot: false },
      { x1: 310, y1: 195, x2: 450, y2: 195, color: "#2dd4bf", isHot: false },
      { x1: 130, y1: 195, x2: 130, y2: 268, color: "#34d399", isHot: false },
      { x1: 310, y1: 195, x2: 310, y2: 268, color: "#f472b6", isHot: false },
      { x1: 450, y1: 195, x2: 450, y2: 268, color: "#38bdf8", isHot: false },
      { x1: 130, y1: 268, x2: 310, y2: 268, color: "#c084fc", isHot: false },
      { x1: 310, y1: 268, x2: 450, y2: 268, color: "#fbbf24", isHot: false },
      { x1: 310, y1: 268, x2: 310, y2: 340, color: "#38bdf8", isHot: false },
      { x1: 130, y1: 340, x2: 450, y2: 340, color: "#2dd4bf", isHot: false },
    ];

    hotBooths.forEach(hb => {
      let closestHub = hubs[0];
      let minDist = 999999;
      hubs.forEach(h => {
        const d = Math.hypot(h.x - hb.x, h.y - hb.y);
        if (d < minDist) { minDist = d; closestHub = h; }
      });
      corridors.push({
        x1: closestHub.x, y1: closestHub.y,
        x2: hb.x, y2: hb.y,
        color: hb.color,
        isHot: true
      });
    });

    const movingDots: Array<{ id: string, x1: number, y1: number, x2: number, y2: number, r: number, color: string, dur: number, delay: number }> = [];
    const staticDots: Array<{ id: string, cx: number, cy: number, r: number, color: string, opacity: number, dur: number }> = [];

    let dotId = 0;
    corridors.forEach(c => {
      const numDots = c.isHot ? 3 : 1;
      for (let i = 0; i < numDots; i++) {
        dotId++;
        const isForward = Math.random() > 0.5;
        const xStart = isForward ? c.x1 : c.x2;
        const yStart = isForward ? c.y1 : c.y2;
        const xEnd = isForward ? c.x2 : c.x1;
        const yEnd = isForward ? c.y2 : c.y1;
        const dur = (c.isHot ? 2.2 : 3.5) + Math.random() * 2;
        const delay = Math.random() * 3;
        movingDots.push({
          id: `move_${dotId}`,
          x1: xStart, y1: yStart,
          x2: xEnd, y2: yEnd,
          r: c.isHot ? 2.5 : 1.8,
          color: c.color,
          dur,
          delay
        });
      }
    });

    stalls.forEach(stall => {
      const status = popMap[stall.name]?.level || 'STEADY 🟢';
      let clusterCount = 1;
      if (status.includes('HOT')) clusterCount = 4;
      else if (status.includes('HIGH TRAFFIC')) clusterCount = 2;

      for (let i = 0; i < clusterCount; i++) {
        dotId++;
        const angle = Math.random() * Math.PI * 2;
        const dist = 6 + Math.random() * (status.includes('HOT') ? 30 : 15);
        const cx = stall.x + Math.cos(angle) * dist;
        const cy = stall.y + Math.sin(angle) * dist;
        staticDots.push({
          id: `static_${dotId}`,
          cx, cy,
          r: status.includes('HOT') && Math.random() > 0.6 ? 2.8 : 1.8,
          color: stall.color,
          opacity: 0.5 + Math.random() * 0.5,
          dur: 1.5 + Math.random() * 2
        });
      }
    });

    return {
      stallPopularity: popMap,
      hotBoothNames: Array.from(hotNamesSet),
      footpathNetwork: { hubs, corridors },
      animatedAudienceDots: movingDots,
      staticClusterDots: staticDots
    };
  }, []);

  const handleBoothSelect = (vendorObj: any) => {
    if (vendorObj.type === 'auction' || vendorObj.name.includes("AUCTION")) {
      setShowAuctionDashboard(true);
      return;
    }
    setSelectedVendor(vendorObj);
    if (window.innerWidth < 1024) setMobileSection('vendor');
  };

  const handleBoothHover = (vendorObj: any) => {
    setHoveredBooth(vendorObj);
  };

  const handleBoothLeave = () => {
    setHoveredBooth(null);
  };

  // ── MASTER THEMATIC CARD POOLS ──────────────────────────────────────────────
  const pools = useMemo(() => ({
    vintageEng: [
      { name: "Charizard Base Set Holo", grade: "PSA 10", price: 12450.0, change: "+3.4%", id: "base1-4", img: "https://images.scrydex.com/pokemon/base1-4/large" },
      { name: "Blastoise 1st Ed Shadowless", grade: "PSA 9", price: 7400.0, change: "+0.5%", id: "base1-2", img: "https://images.scrydex.com/pokemon/base1-2/large" },
      { name: "Lugia 1st Ed Neo Genesis", grade: "PSA 10", price: 18200.0, change: "+1.8%", id: "neo1-9", img: "https://images.scrydex.com/pokemon/neo1-9/large" },
      { name: "Shining Charizard Neo Destiny", grade: "PSA 9", price: 3800.0, change: "+1.2%", id: "neo4-107", img: "https://images.scrydex.com/pokemon/neo4-107/large" },
      { name: "Venusaur 1st Ed Base Set", grade: "PSA 9", price: 2100.0, change: "+4.1%", id: "base1-15", img: "https://images.scrydex.com/pokemon/base1-15/large" },
      { name: "Alakazam Base Set Holo", grade: "PSA 9", price: 340.0, change: "+2.0%", id: "base1-1", img: "https://images.scrydex.com/pokemon/base1-1/large" },
      { name: "Gengar Fossil Holo 1st Ed", grade: "PSA 9", price: 420.0, change: "+5.1%", id: "fo1-5", img: "https://images.scrydex.com/pokemon/fo1-5/large" },
      { name: "Dragonite Fossil Holo", grade: "PSA 9", price: 310.0, change: "-0.4%", id: "fo1-4", img: "https://images.scrydex.com/pokemon/fo1-4/large" },
      { name: "Pikachu E3 Stamp Promo", grade: "PSA 9", price: 185.0, change: "+8.3%", id: "pr-1", img: "https://images.scrydex.com/pokemon/basep-1/large" },
      { name: "Mewtwo Base Set Holo", grade: "PSA 8", price: 120.0, change: "+1.1%", id: "base1-10", img: "https://images.scrydex.com/pokemon/base1-10/large" },
      { name: "Zapdos 1st Ed Fossil Holo", grade: "PSA 9", price: 240.0, change: "+3.2%", id: "fo1-15", img: "https://images.scrydex.com/pokemon/fo1-15/large" },
      { name: "Dark Charizard Team Rocket", grade: "PSA 9", price: 480.0, change: "+6.4%", id: "tr1-4", img: "https://images.scrydex.com/pokemon/tr1-4/large" },
      { name: "Dark Dragonite Team Rocket", grade: "PSA 9", price: 290.0, change: "+2.8%", id: "tr1-5", img: "https://images.scrydex.com/pokemon/tr1-5/large" },
      { name: "Dark Raichu Secret Rare 1st Ed", grade: "PSA 9", price: 360.0, change: "+4.5%", id: "tr1-83", img: "https://images.scrydex.com/pokemon/tr1-83/large" },
      { name: "Sabrina's Gengar Gym Heroes", grade: "PSA 9", price: 340.0, change: "+7.1%", id: "gh1-14", img: "https://images.scrydex.com/pokemon/gh1-14/large" },
      { name: "Blaine's Moltres Gym Heroes", grade: "PSA 9", price: 195.0, change: "+1.9%", id: "gh1-1", img: "https://images.scrydex.com/pokemon/gh1-1/large" },
      { name: "Erika's Venusaur Gym Challenge", grade: "PSA 9", price: 280.0, change: "+3.8%", id: "gc1-4", img: "https://images.scrydex.com/pokemon/gc1-4/large" },
      { name: "Typhlosion 1st Ed Neo Genesis", grade: "PSA 9", price: 680.0, change: "+5.2%", id: "neo1-17", img: "https://images.scrydex.com/pokemon/neo1-17/large" },
      { name: "Pichu 1st Ed Neo Genesis", grade: "PSA 9", price: 220.0, change: "+2.4%", id: "neo1-12", img: "https://images.scrydex.com/pokemon/neo1-12/large" },
      { name: "Shining Mewtwo Neo Destiny", grade: "PSA 9", price: 1150.0, change: "+8.9%", id: "neo4-109", img: "https://images.scrydex.com/pokemon/neo4-109/large" },
      { name: "Shining Celebi Neo Destiny", grade: "PSA 9", price: 540.0, change: "+4.0%", id: "neo4-106", img: "https://images.scrydex.com/pokemon/neo4-106/large" }
    ],
    vintageJpn: [
      { name: "Japanese Base Charizard (No Rarity)", grade: "PSA 9", price: 3400.0, change: "+14.2%", id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
      { name: "CoroCoro Shining Mew Holo (JPN)", grade: "PSA 10", price: 1650.0, change: "+9.8%", id: "coro_ja-1", img: "https://images.pokemontcg.io/np/30_hires.png" },
      { name: "Japanese Neo 2 Charizard Holo", grade: "PSA 10", price: 890.0, change: "+6.1%", id: "neo2_ja-30", img: "https://images.pokemontcg.io/np/30_hires.png" },
      { name: "Japanese Web Series Gengar Holo", grade: "PSA 10", price: 920.0, change: "+8.5%", id: "fo1_ja-5", img: "https://images.pokemontcg.io/fo1/5_hires.png" },
      { name: "VS Series Lance's Charizard (JPN)", grade: "PSA 10", price: 780.0, change: "+11.4%", id: "vs_ja-charizard", img: "https://images.pokemontcg.io/base1/4_hires.png" },
      { name: "Japanese e-Series Crystal Charizard", grade: "PSA 9", price: 2650.0, change: "+7.9%", id: "skyridge_ja-146", img: "https://images.pokemontcg.io/ecard3/146_hires.png" },
      { name: "Crystal Ho-Oh e-Series (JPN)", grade: "PSA 9", price: 1120.0, change: "+5.3%", id: "skyridge_ja-149", img: "https://images.pokemontcg.io/ecard3/149_hires.png" },
      { name: "Japanese Vending Series 3 Mewtwo", grade: "PSA 10", price: 340.0, change: "+4.2%", id: "base1_ja-10", img: "https://images.pokemontcg.io/base1/10_hires.png" },
      { name: "Japanese Vending Series 1 Pikachu", grade: "PSA 10", price: 280.0, change: "+6.7%", id: "base1_ja-58", img: "https://images.pokemontcg.io/base1/58_hires.png" },
      { name: "Imakuni's Doduo Vending Promo", grade: "PSA 10", price: 210.0, change: "+3.1%", id: "gym1_ja-112", img: "https://images.pokemontcg.io/gym1/112_hires.png" },
      { name: "GB Dragonite Promo Holo (JPN)", grade: "PSA 10", price: 390.0, change: "+8.0%", id: "fo1_ja-4", img: "https://images.pokemontcg.io/fo1/4_hires.png" },
      { name: "CD Promo Charizard Holo (JPN)", grade: "PSA 10", price: 650.0, change: "+9.2%", id: "cd_ja-charizard", img: "https://images.pokemontcg.io/base1/4_hires.png" },
      { name: "CD Promo Blastoise Holo (JPN)", grade: "PSA 10", price: 380.0, change: "+5.4%", id: "cd_ja-blastoise", img: "https://images.pokemontcg.io/base1/2_hires.png" },
      { name: "CD Promo Venusaur Holo (JPN)", grade: "PSA 10", price: 360.0, change: "+4.9%", id: "cd_ja-venusaur", img: "https://images.pokemontcg.io/base1/15_hires.png" },
      { name: "Japanese Gym Leader Erika Holo", grade: "PSA 9", price: 145.0, change: "+2.8%", id: "gc1_ja-16", img: "https://images.pokemontcg.io/gym2/16_hires.png" },
      { name: "Kanji Lugia Neo Genesis (JPN)", grade: "PSA 9", price: 420.0, change: "+7.5%", id: "neo1_ja-9", img: "https://images.pokemontcg.io/neo1/9_hires.png" },
      { name: "Japanese Neo Discovery Umbreon Holo", grade: "PSA 9", price: 380.0, change: "+6.8%", id: "neo2_ja-13", img: "https://images.pokemontcg.io/neo2/13_hires.png" },
      { name: "Japanese Blaine's Arcanine Holo", grade: "PSA 9", price: 165.0, change: "+3.5%", id: "gh1_ja-1", img: "https://images.pokemontcg.io/gym1/1_hires.png" }
    ],
    modernAlt: [
      { name: "Umbreon VMAX Alt Art (Moonbreon)", grade: "PSA 10", price: 1420.0, change: "+5.6%", id: "evs-215", img: "https://images.scrydex.com/pokemon/swsh7-215/large" },
      { name: "Giratina V Alt Art Lost Origin", grade: "PSA 10", price: 650.0, change: "+4.1%", id: "lor-186", img: "https://images.scrydex.com/pokemon/swsh11-186/large" },
      { name: "Rayquaza VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 580.0, change: "+6.2%", id: "evs-218", img: "https://images.scrydex.com/pokemon/swsh7-218/large" },
      { name: "Lugia V Alt Art Silver Tempest", grade: "PSA 10", price: 320.0, change: "+3.9%", id: "sit-186", img: "https://images.scrydex.com/pokemon/swsh12-186/large" },
      { name: "Charizard V Alt Art Brilliant Stars", grade: "PSA 10", price: 240.0, change: "+2.1%", id: "brs-154", img: "https://images.scrydex.com/pokemon/swsh9-154/large" },
      { name: "Sylveon VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 310.0, change: "+4.8%", id: "evs-212", img: "https://images.scrydex.com/pokemon/swsh7-212/large" },
      { name: "Gengar VMAX Alt Art Fusion Strike", grade: "PSA 10", price: 390.0, change: "+7.4%", id: "fst-271", img: "https://images.scrydex.com/pokemon/swsh8-271/large" },
      { name: "Mewtwo V Alt Art Pokemon GO", grade: "PSA 10", price: 110.0, change: "+1.9%", id: "pgo-72", img: "https://images.scrydex.com/pokemon/pgo-72/large" },
      { name: "Espeon VMAX Alt Art Fusion Strike", grade: "PSA 10", price: 290.0, change: "+5.0%", id: "fst-270", img: "https://images.scrydex.com/pokemon/swsh8-270/large" },
      { name: "Leafeon VMAX Alt Art Evolving Skies", grade: "PSA 10", price: 270.0, change: "+4.3%", id: "evs-205", img: "https://images.scrydex.com/pokemon/swsh7-205/large" },
      { name: "Dragonite V Alt Art Evolving Skies", grade: "PSA 10", price: 165.0, change: "+3.1%", id: "evs-192", img: "https://images.scrydex.com/pokemon/swsh7-192/large" },
      { name: "Aerodactyl V Alt Art Lost Origin", grade: "PSA 10", price: 155.0, change: "+2.8%", id: "lor-180", img: "https://images.scrydex.com/pokemon/swsh11-180/large" },
      { name: "Charizard ex SIR Obsidian Flames", grade: "PSA 10", price: 165.0, change: "+4.4%", id: "obf-223", img: "https://images.scrydex.com/pokemon/sv3-223/large" },
      { name: "Mew ex SIR 151", grade: "PSA 10", price: 140.0, change: "+3.2%", id: "meo-205", img: "https://images.scrydex.com/pokemon/sv3pt5-205/large" }
    ],
    jpnModern: [
      { name: "Japanese Iono SAR (Clay Burst)", grade: "PSA 10", price: 850.0, rawPrice: 240.0, change: "+12.4%", id: "sv2d_ja-96", img: "https://images.scrydex.com/pokemon/sv2d_ja-96/large" },
      { name: "Japanese Miriam SAR (Violet ex)", grade: "PSA 10", price: 340.0, rawPrice: 110.0, change: "+8.1%", id: "sv1v_ja-105", img: "https://images.scrydex.com/pokemon/sv1v_ja-105/large" },
      { name: "Japanese 151 Master Ball Pikachu", grade: "PSA 10", price: 380.0, rawPrice: 135.0, change: "+9.6%", id: "sv3pt5_ja-25", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-25/large" },
      { name: "Japanese 151 Master Ball Gengar", grade: "PSA 10", price: 220.0, rawPrice: 85.0, change: "+7.2%", id: "sv3pt5_ja-94", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-94/large" },
      { name: "Japanese Erika's Invitation SAR (151)", grade: "PSA 10", price: 210.0, rawPrice: 80.0, change: "+5.4%", id: "sv3pt5_ja-206", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-206/large" },
      { name: "Japanese Charizard ex SAR (Ruler)", grade: "PSA 10", price: 240.0, rawPrice: 90.0, change: "+6.8%", id: "sv3_ja-223", img: "https://images.scrydex.com/pokemon/sv3_ja-223/large" },
      { name: "Japanese Mew ex SAR (151 JPN)", grade: "PSA 10", price: 185.0, rawPrice: 65.0, change: "+4.5%", id: "sv3pt5_ja-205", img: "https://images.scrydex.com/pokemon/sv3pt5_ja-205/large" },
      { name: "Japanese Pikachu AR (VSTAR Universe)", grade: "PSA 10", price: 65.0, rawPrice: 24.0, change: "+3.8%", id: "swsh12a_ja-205", img: "https://images.scrydex.com/pokemon/swsh12a_ja-205/large" },
      { name: "Japanese Poncho Pikachu (Charizard X)", grade: "PSA 10", price: 4600.0, rawPrice: 1600.0, change: "+9.4%", id: "swsh12a_ja-262", img: "https://images.scrydex.com/pokemon/swsh12a_ja-262/large" },
      { name: "Japanese Erika's Hospitality SR", grade: "PSA 10", price: 650.0, rawPrice: 220.0, change: "+5.1%", id: "sm12a_ja-190", img: "https://images.scrydex.com/pokemon/sm12a_ja-190/large" },
      { name: "Japanese Mewtwo VSTAR SAR (Universe)", grade: "PSA 10", price: 120.0, rawPrice: 45.0, change: "+8.9%", id: "swsh12a_ja-221", img: "https://images.scrydex.com/pokemon/swsh12a_ja-221/large" },
      { name: "Japanese God Pack Charizard VMAX (Climax)", grade: "PSA 10", price: 210.0, rawPrice: 80.0, change: "+4.2%", id: "swsh8b_ja-260", img: "https://images.scrydex.com/pokemon/swsh8b_ja-260/large" }
    ],
    tagTeams: [
      { name: "Latios & Latias GX Alt Art", grade: "PSA 10", price: 890.0, change: "+8.9%", id: "sm9-170", img: "https://images.scrydex.com/pokemon/sm9-170/large" },
      { name: "Gengar & Mimikyu GX Alt Art", grade: "PSA 10", price: 450.0, change: "+6.4%", id: "sm9-165", img: "https://images.scrydex.com/pokemon/sm9-165/large" },
      { name: "Magikarp & Wailord GX Alt Art", grade: "PSA 10", price: 380.0, change: "+5.8%", id: "sm9-161", img: "https://images.scrydex.com/pokemon/sm9-161/large" },
      { name: "Charizard & Reshiram GX Alt Art", grade: "PSA 10", price: 310.0, change: "+4.5%", id: "sm10-214", img: "https://images.scrydex.com/pokemon/sm10-214/large" },
      { name: "Mewtwo & Mew GX Alt Art", grade: "PSA 10", price: 280.0, change: "+5.1%", id: "sm11-222", img: "https://images.scrydex.com/pokemon/sm11-222/large" },
      { name: "Arceus & Dialga & Palkia GX Alt Art", grade: "PSA 10", price: 230.0, change: "+3.7%", id: "sm12-221", img: "https://images.scrydex.com/pokemon/sm12-221/large" },
      { name: "Solgaleo & Lunala GX Full Art", grade: "PSA 10", price: 165.0, change: "+2.9%", id: "sm12-216", img: "https://images.scrydex.com/pokemon/sm12-216/large" },
      { name: "Blastoise & Piplup GX Alt Art", grade: "PSA 10", price: 195.0, change: "+4.1%", id: "sm12-215", img: "https://images.scrydex.com/pokemon/sm12-215/large" }
    ],
    goldStarsEx: [
      { name: "Rayquaza Gold Star Holo Deoxys", grade: "CGC 9.5", price: 9800.0, change: "-0.8%", id: "ex8-107", img: "https://images.scrydex.com/pokemon/ex8-107/large" },
      { name: "Charizard Gold Star Delta Species", grade: "PSA 9", price: 2900.0, change: "+5.4%", id: "ex13-100", img: "https://images.scrydex.com/pokemon/ex13-100/large" },
      { name: "Mew Gold Star Holo Dragon Frontiers", grade: "PSA 9", price: 1250.0, change: "+4.1%", id: "ex15-101", img: "https://images.scrydex.com/pokemon/ex15-101/large" },
      { name: "Pikachu Gold Star Holo Holon Phantoms", grade: "PSA 9", price: 1480.0, change: "+6.2%", id: "ex13-104", img: "https://images.scrydex.com/pokemon/ex13-104/large" },
      { name: "Torchic Gold Star Holo Team Rocket Returns", grade: "PSA 9", price: 1100.0, change: "+3.8%", id: "ex7-108", img: "https://images.scrydex.com/pokemon/ex7-108/large" },
      { name: "Lugia ex Unseen Forces Holo", grade: "PSA 9", price: 890.0, change: "+5.0%", id: "ex10-105", img: "https://images.scrydex.com/pokemon/ex10-105/large" },
      { name: "Mewtwo EX Full Art Secret Rare", grade: "PSA 10", price: 2150.0, change: "+2.3%", id: "xy8-164", img: "https://images.scrydex.com/pokemon/xy8-164/large" },
      { name: "Latias Gold Star Holo Deoxys", grade: "PSA 9", price: 3200.0, change: "+4.5%", id: "ex8-105", img: "https://images.scrydex.com/pokemon/ex8-105/large" },
      { name: "Lillie Full Art Ultra Prism", grade: "PSA 10", price: 3200.0, change: "+6.7%", id: "ulp-151", img: "https://images.scrydex.com/pokemon/sm5-151/large" }
    ],
    rawBinderSingles: [
      { name: "Pikachu IR Paldea Evolved", grade: "Raw NM", price: 38.0, change: "+3.1%", id: "bgt-1", originalId: "sv2-203", img: "https://images.scrydex.com/pokemon/sv2-203/large" },
      { name: "Charmander IR 151", grade: "Raw NM", price: 32.0, change: "+4.2%", id: "bgt-2", originalId: "sv3pt5-168", img: "https://images.scrydex.com/pokemon/sv3pt5-168/large" },
      { name: "Squirtle IR 151", grade: "Raw NM", price: 28.0, change: "+2.5%", id: "bgt-3", originalId: "sv3pt5-170", img: "https://images.scrydex.com/pokemon/sv3pt5-170/large" },
      { name: "Bulbasaur IR 151", grade: "Raw NM", price: 26.0, change: "+1.9%", id: "bgt-4", originalId: "sv3pt5-166", img: "https://images.scrydex.com/pokemon/sv3pt5-166/large" },
      { name: "Snorlax IR 151", grade: "Raw NM", price: 24.0, change: "+0.8%", id: "bgt-5", originalId: "sv3pt5-181", img: "https://images.scrydex.com/pokemon/sv3pt5-181/large" },
      { name: "Japanese 151 Master Ball Eevee", grade: "Raw NM", price: 65.0, change: "+6.4%", id: "bgt-6", originalId: "sv2a_ja-133", img: "https://images.scrydex.com/pokemon/sv2a_ja-133/large" },
      { name: "Japanese 151 Master Ball Dragonite", grade: "Raw NM", price: 75.0, change: "+5.1%", id: "bgt-7", originalId: "sv2a_ja-149", img: "https://images.scrydex.com/pokemon/sv2a_ja-149/large" },
      { name: "Japanese Pikachu AR VSTAR Universe", grade: "Raw NM", price: 42.0, change: "+3.8%", id: "bgt-8", originalId: "swsh12a_ja-205", img: "https://images.scrydex.com/pokemon/swsh12a_ja-205/large" },
      { name: "Japanese Kanji Gym Erika Holo", grade: "Raw LP/NM", price: 35.0, change: "+2.1%", id: "bgt-9", originalId: "gym2-16", img: "https://images.pokemontcg.io/gym2/16_hires.png" },
      { name: "Japanese Vending Series Pikachu", grade: "Raw NM", price: 48.0, change: "+4.5%", id: "bgt-10", originalId: "base1-58", img: "https://images.pokemontcg.io/base1/58_hires.png" },
      { name: "Pidgeot ex SIR Obsidian Flames", grade: "Raw NM", price: 15.0, change: "+1.2%", id: "bgt-11", originalId: "sv3-225", img: "https://images.scrydex.com/pokemon/sv3-225/large" },
      { name: "Magikarp IR Triplet Beat", grade: "Raw NM", price: 110.0, change: "+7.8%", id: "bgt-12", originalId: "sv1a-80", img: "https://images.scrydex.com/pokemon/sv1a-80/large" },
      { name: "Glaceon V Alt Art Evolving Skies", grade: "Raw NM", price: 90.0, change: "+4.1%", id: "bgt-13", originalId: "swsh7-175", img: "https://images.scrydex.com/pokemon/swsh7-175/large" },
      { name: "Celebi V Alt Art Fusion Strike", grade: "Raw NM", price: 45.0, change: "+3.2%", id: "bgt-14", originalId: "swsh8-245", img: "https://images.scrydex.com/pokemon/swsh8-245/large" },
      { name: "Japanese VSTAR Universe Mew VMAX SAR", grade: "Raw NM", price: 48.0, change: "+2.9%", id: "bgt-15", originalId: "swsh12a_ja-183", img: "https://images.scrydex.com/pokemon/swsh12a_ja-183/large" },
      { name: "1st Ed Base Set Squirtle", grade: "Raw LP/NM", price: 45.0, change: "+3.5%", id: "bgt-16", originalId: "base1-63", img: "https://images.pokemontcg.io/base1/63_hires.png" },
      { name: "1st Ed Base Set Charmander", grade: "Raw LP", price: 38.0, change: "+2.1%", id: "bgt-17", originalId: "base1-46", img: "https://images.pokemontcg.io/base1/46_hires.png" },
      { name: "Jungle Scyther Holo", grade: "Raw NM", price: 42.0, change: "+1.8%", id: "bgt-18", originalId: "ju1-10", img: "https://images.pokemontcg.io/ju1/10_hires.png" },
      { name: "Fossil Haunter Holo", grade: "Raw NM", price: 38.0, change: "+2.4%", id: "bgt-19", originalId: "fo1-6", img: "https://images.pokemontcg.io/fo1/6_hires.png" },
      { name: "Japanese Neo Genesis Lugia Holo", grade: "Raw LP", price: 135.0, change: "+4.8%", id: "bgt-20", originalId: "neo1-9", img: "https://images.pokemontcg.io/neo1/9_hires.png" },
      { name: "Mew ex SIR 151", grade: "Raw NM", price: 85.0, change: "+5.1%", id: "bgt-21", originalId: "sv3pt5-205", img: "https://images.scrydex.com/pokemon/sv3pt5-205/large" },
      { name: "Zapdos ex SIR 151", grade: "Raw NM", price: 42.0, change: "+3.4%", id: "bgt-22", originalId: "sv3pt5-202", img: "https://images.scrydex.com/pokemon/sv3pt5-202/large" },
      { name: "Alakazam ex SIR 151", grade: "Raw NM", price: 34.0, change: "+2.8%", id: "bgt-23", originalId: "sv3pt5-201", img: "https://images.scrydex.com/pokemon/sv3pt5-201/large" },
      { name: "Erika's Invitation SIR 151", grade: "Raw NM", price: 36.0, change: "+1.9%", id: "bgt-24", originalId: "sv3pt5-203", img: "https://images.scrydex.com/pokemon/sv3pt5-203/large" },
      { name: "Charizard ex SIR Obsidian Flames", grade: "Raw NM", price: 55.0, change: "+4.0%", id: "bgt-25", originalId: "sv3-223", img: "https://images.scrydex.com/pokemon/sv3-223/large" },
      { name: "Tyranitar V Alt Art Battle Styles", grade: "Raw NM", price: 115.0, change: "+6.1%", id: "bgt-26", originalId: "swsh5-155", img: "https://images.scrydex.com/pokemon/swsh5-155/large" },
      { name: "Empoleon V Alt Art Battle Styles", grade: "Raw NM", price: 40.0, change: "+2.2%", id: "bgt-27", originalId: "swsh5-146", img: "https://images.scrydex.com/pokemon/swsh5-146/large" },
      { name: "Dragonite V Alt Art Evolving Skies", grade: "Raw NM", price: 130.0, change: "+5.8%", id: "bgt-28", originalId: "swsh7-192", img: "https://images.scrydex.com/pokemon/swsh7-192/large" },
      { name: "Noivern V Alt Art Evolving Skies", grade: "Raw NM", price: 35.0, change: "+1.5%", id: "bgt-29", originalId: "swsh7-196", img: "https://images.scrydex.com/pokemon/swsh7-196/large" },
      { name: "Charizard VMAX Rainbow Shiny", grade: "Raw NM", price: 120.0, change: "+3.9%", id: "bgt-30", originalId: "swsh3-20", img: "https://images.scrydex.com/pokemon/swsh3-20/large" }
    ],
  }), []);

  const getThemePool = (category?: string): any[] => {
    switch (category) {
      case "vintage": return [...pools.vintageEng, ...pools.vintageJpn];
      case "modern": return [...pools.modernAlt, ...pools.tagTeams, ...pools.rawBinderSingles];
      case "japanese": return [...pools.jpnModern, ...pools.vintageJpn];
      case "slab": return [...pools.goldStarsEx, ...pools.vintageEng];
      case "goldstar": return [...pools.goldStarsEx];
      default: return [...pools.rawBinderSingles];
    }
  };

  // ── DISJOINT VENDOR CATALOG PARTITION ───────────────────────────────────────
  // Build ONE global partition so every vendor receives a fully disjoint set of
  // 110 cards (no card ever appears in two vendor catalogs). A shared `usedIds`
  // set guarantees uniqueness; a per-vendor window into the 4000-card Japanese
  // pool supplies the bulk and keeps the sets from ever overlapping.
  const vendorCardMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    const used = new Set<string>();
    const dynamicJpnPool = getCardShowDynamicJapaneseCards(4000);

    VENDORS.filter(v => v.type === 'vendor').forEach((vendor, vi) => {
      const cards: any[] = [];

      const tryAdd = (c: any): boolean => {
        const key = c.originalId || c.id;
        if (!key || used.has(key)) return false;
        if (brokenOriginalIds.includes(key)) return false;
        used.add(key);
        cards.push({
          ...c,
          originalId: key,
          id: `${vendor.booth}-${key}`,
        });
        return true;
      };

      // 1. Themed signature cards (these add flavor / relevance per vendor)
      getThemePool(vendor.category).forEach(c => tryAdd(c));

      // 2. A large, per-vendor disjoint window into the Japanese pool (the bulk)
      const windowStart = vi * 100;
      for (let i = 0; i < 100 && windowStart + i < dynamicJpnPool.length; i++) {
        tryAdd(dynamicJpnPool[windowStart + i]);
      }

      // 3. Top up (and guarantee uniqueness) from the rest of the Japanese pool
      let k = 0;
      while (cards.length < 110 && k < dynamicJpnPool.length) {
        tryAdd(dynamicJpnPool[k]);
        k++;
      }

      map[vendor.name] = cards.slice(0, 110).map((c) => {
        const orig = c.originalId;
        
        // The pool generators (getThemePool and getCardShowDynamicJapaneseCards) already calculate the correct price
        // taking into account grades and caching. We use c.price directly if available.
        // If it's missing, we fallback to resolveVendorCardRealPrice.
        const finalPrice = typeof c.price === 'number' ? c.price : resolveVendorCardRealPrice(c);

        return {
          ...c,
          setId: (c as any).setId || (orig && orig.includes('-') && !orig.toLowerCase().includes('booth') ? orig.split('-')[0] : 'swsh3'),
          num: (c as any).num || (orig && orig.includes('-') ? orig.split('-')[1] : '1'),
          price: finalPrice,
        };
      });
    });

    return map;
  }, [metadataLoaded, pools, brokenOriginalIds]);

  const activeVendorCards = useMemo(() => {
    return vendorCardMap[selectedVendor?.name] || [];
  }, [selectedVendor?.name, vendorCardMap]);

  // Reset sequential visible batch limit when active vendor pool or search filters change
  useEffect(() => {
    setVisibleBatchLimit(6);
    setCompletedCardIds(new Set());
  }, [activeVendorCards, searchQuery, selectedFilter]);

  // Advance sequential batch as soon as all currently visible cards have rendered (or after safety timeout)
  useEffect(() => {
    const filtered = activeVendorCards.filter((c) => {
      if (brokenOriginalIds.includes(c.originalId) || brokenOriginalIds.includes(c.id)) return false;
      const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (selectedFilter === "Raw Ungraded") return matchesSearch && c.grade.includes("Raw");
      if (selectedFilter === "PSA 10") return matchesSearch && c.grade === "PSA 10";
      if (selectedFilter === "BGS/CGC") return matchesSearch && (c.grade.includes("BGS") || c.grade.includes("CGC"));
      if (selectedFilter === "WOTC / Vintage") return matchesSearch && (c.name.includes("Base") || c.name.includes("Neo") || c.name.includes("1st"));
      if (selectedFilter === "Modern Alt") return matchesSearch && (c.name.includes("Alt") || c.name.includes("VMAX") || c.name.includes("GX") || c.name.includes("IR") || c.name.includes("SAR"));
      return matchesSearch;
    });

    if (visibleBatchLimit >= filtered.length) return;

    const currentBatch = filtered.slice(0, visibleBatchLimit);
    const allBatchDone = currentBatch.length > 0 && currentBatch.every(c => completedCardIds.has(c.id));

    if (allBatchDone) {
      setVisibleBatchLimit(prev => Math.min(filtered.length, prev + 6));
    }
  }, [completedCardIds, visibleBatchLimit, activeVendorCards, searchQuery, selectedFilter, brokenOriginalIds]);

  // IntersectionObserver: immediately load any card container that scrolls into the user's viewport
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const imgId = entry.target.getAttribute('data-img-id');
          if (imgId) {
            setIntersectingCardIds(prev => {
              if (prev.has(imgId)) return prev;
              const next = new Set(prev);
              next.add(imgId);
              return next;
            });
          }
        }
      });
    }, { rootMargin: '120px' });

    const elements = document.querySelectorAll('[data-card-container]');
    elements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, [activeVendorCards, visibleBatchLimit, searchQuery, selectedFilter]);

  const filteredCards = activeVendorCards.filter((c) => {
    if (brokenOriginalIds.includes(c.originalId) || brokenOriginalIds.includes(c.id)) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === "Raw Ungraded") return matchesSearch && c.grade.includes("Raw");
    if (selectedFilter === "PSA 10") return matchesSearch && c.grade === "PSA 10";
    if (selectedFilter === "BGS/CGC") return matchesSearch && (c.grade.includes("BGS") || c.grade.includes("CGC"));
    if (selectedFilter === "WOTC / Vintage") return matchesSearch && (c.name.includes("Base") || c.name.includes("Neo") || c.name.includes("1st"));
    if (selectedFilter === "Modern Alt") return matchesSearch && (c.name.includes("Alt") || c.name.includes("VMAX") || c.name.includes("GX") || c.name.includes("IR") || c.name.includes("SAR"));
    return matchesSearch;
  });

  if (showAuctionDashboard) {
    return <AuctionDashboard onBack={() => setShowAuctionDashboard(false)} onSpendNetReturn={onSpendNetReturn} />;
  }

  return (
    <>
      <div className="w-full h-full min-h-[calc(100vh-5rem)] bg-[#090a0c] text-[#f8fafc] flex flex-col font-sans overflow-hidden">

        {/* Slim Top Bar */}
        <header className="h-10 sm:h-12 border-b border-[#1e293b]/50 bg-[#111418]/95 backdrop-blur-md flex items-center justify-between px-3 sm:px-5 shrink-0 z-30">
          <div className="flex items-center gap-3">
            {onBackToPacks && (
              <button
                onClick={onBackToPacks}
                className="px-2 py-1 hover:bg-white/10 rounded transition-colors text-[#94a3b8] hover:text-[#f8fafc] flex items-center gap-1.5 text-xs font-mono border border-white/10"
                title="Back to Packs"
              >
                <ArrowLeft className="w-3.5 h-3.5 text-[#38bdf8]" />
                <span className="hidden sm:inline font-bold">BACK</span>
              </button>
            )}
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm font-black tracking-widest text-white flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#2dd4bf] animate-pulse" /> GLOBAL CARD SHOW CIRCUIT
              </span>
              <span className="hidden md:inline px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 font-bold">
                LA EXPO DAY 2
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#94a3b8] hidden lg:flex">
              <span>LIVE BASH FLOOR:</span>
              <span className="text-green-400 font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> 3,420 ACTIVE BUYERS
              </span>
            </div>

            <div className="relative">
              <Bell className="w-4 h-4 text-[#94a3b8] hover:text-white cursor-pointer transition-colors" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#f472b6] rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
            </div>
          </div>
        </header>

        {/* Mobile Mode Switcher Bar (< 1024px only) */}
        <div className="lg:hidden flex items-center justify-between gap-1.5 bg-[#111418] border-b border-[#1e293b]/60 px-2 sm:px-3 py-1.5 shrink-0 z-20">
          <button
            onClick={() => setMobileSection('market')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${mobileSection === 'market'
              ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/50 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
              : 'text-[#94a3b8] hover:bg-white/5'
              }`}
          >
            <Package className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">MARKET ({filteredCards.length})</span>
          </button>

          <button
            onClick={() => setMobileSection('map')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${mobileSection === 'map'
              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'text-[#94a3b8] hover:bg-white/5'
              }`}
          >
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">FLOOR MAP</span>
          </button>

          <button
            onClick={() => setMobileSection('vendor')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${mobileSection === 'vendor'
              ? 'bg-[#f472b6]/20 text-[#f472b6] border border-[#f472b6]/50 shadow-[0_0_10px_rgba(236,72,153,0.2)]'
              : 'text-[#94a3b8] hover:bg-white/5'
              }`}
          >
            <Star className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">VENDOR VIP</span>
          </button>
        </div>

        {/* Main 3-Column Grid */}
        <main className="flex-1 p-2 sm:p-3 lg:grid lg:grid-cols-12 gap-3 lg:gap-4 overflow-y-auto lg:overflow-hidden min-h-0">

          {/* Column A: EXPO MARKETPLACE & VENDOR GALLERY */}
          <section
            className={`${isMapExpanded ? 'hidden' : ''
              } ${mobileSection === 'market' ? 'flex' : 'hidden lg:flex'
              } lg:col-span-3 flex-col gap-2 h-full min-h-[480px] lg:min-h-0`}
          >
            {/* Top Search & Filter Bar */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search cards..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#111418] border border-[#1e293b] rounded-lg py-1.5 pl-8 pr-3 text-xs text-white placeholder:text-[#94a3b8] focus:outline-none focus:border-[#38bdf8] transition-colors font-mono"
                />
                <Search className="w-3.5 h-3.5 text-[#94a3b8] absolute left-2.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex items-center gap-1 bg-[#111418] border border-[#1e293b] rounded-lg p-1 shrink-0 overflow-x-auto no-scrollbar max-w-[210px] sm:max-w-none">
                {["All", "Raw Ungraded", "PSA 10", "BGS/CGC", "WOTC / Vintage", "Modern Alt"].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setSelectedFilter(filter)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${selectedFilter === filter
                      ? "bg-[#38bdf8] text-black shadow-sm"
                      : "text-[#94a3b8] hover:text-white"
                      }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowArbSpotlight(!showArbSpotlight)}
                className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${showArbSpotlight
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                  : "bg-[#111418] text-[#94a3b8] border-[#1e293b] hover:text-white"
                  }`}
                title="Toggle Arbitrage Spotlight Cards"
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Arb (+54%)</span>
              </button>
            </div>

            {/* Arbitrage Spotlight Overlay Drawer */}
            {showArbSpotlight && (
              <div className="grid grid-cols-2 gap-2 bg-[#111418]/90 border border-amber-500/30 p-2 rounded-xl shrink-0 animate-in fade-in slide-in-from-top-1 duration-200">
                {[
                  { name: "PSA 10 Charizard Base Set", potential: 37, price: 12450.0, id: 1040, change: "+3.4%" },
                  { name: "PSA 10 Lugia 1st Ed Neo", potential: 54, price: 18200.0, id: 1041, change: "+1.8%" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="bg-black/60 border border-white/10 p-2 rounded-lg flex flex-col justify-between gap-1"
                  >
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] font-bold text-white uppercase truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] text-green-400 font-mono font-bold shrink-0">
                        {item.change}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-mono">
                      <span className="text-amber-400 font-bold">Arb: +{item.potential}%</span>
                      <span className="text-white font-black">${item.price.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Catalog Header */}
            <div className="flex flex-col gap-1.5 bg-[#111418] px-3 py-2 border border-[#1e293b] rounded-lg shrink-0 text-[11px] font-mono">
              <div className="flex items-center justify-between">
                <span className="text-white font-bold flex items-center gap-1.5 truncate">
                  <span className="truncate">📦 {selectedVendor?.name?.toUpperCase()} CATALOG ({filteredCards.length} CARDS)</span>
                </span>
                <span className="text-[#38bdf8] font-bold animate-pulse flex items-center gap-1 shrink-0 ml-2">
                  📜 SCROLL DOWN ▾
                </span>
              </div>
            </div>

            {/* MARKETPLACE CARDS GRID */}
            <div
              style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}
              className="grid grid-cols-2 gap-3 pb-6 pr-1"
            >
              {filteredCards.map((card, i) => (
                <div
                  key={card.id}
                  onClick={() => {
                    if (onInspectCard) {
                      onInspectCard({
                        id: card.id,
                        name: card.name,
                        currentPrice: card.price,
                        isSlabbed: true,
                        slabGrade: card.grade,
                        imageUrl: card.img,
                        isVendorCatalog: true,
                        vendorName: selectedVendor?.name || "VINTAGEVAULT TCG",
                        vendorBooth: selectedVendor?.booth || "5B",
                        vendorRating: selectedVendor?.rating || "4.8 / 5"
                      });
                    }
                  }}
                  className="bg-[#111418] border border-[#1e293b] rounded-xl group hover:border-[#38bdf8] transition-all duration-300 flex flex-col cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transform hover:-translate-y-0.5"
                  data-card-container="true"
                  data-img-id={card.id}
                >
                  <div className="w-full relative p-2 bg-black/40 rounded-t-xl min-h-[160px] flex items-center justify-center">
                    {(i < visibleBatchLimit || intersectingCardIds.has(card.id)) ? (
                      <img
                        src={card.img}
                        alt={card.name}
                        crossOrigin="anonymous"
                        className="w-full h-auto block rounded-md filter drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                        onLoad={(e) => handleCardShowImageLoad(e, card.id, card.name.includes("Japanese") || card.id.includes("jp") || card.id.includes("_ja"))}
                        onError={(e) => handleCardShowImageError(e, card.id, card.name.includes("Japanese") || card.id.includes("jp") || card.id.includes("_ja"))}
                      />
                    ) : (
                      <div className="w-full aspect-[3/4] bg-gradient-to-tr from-[#111418] to-[#1e293b] rounded-md animate-pulse flex flex-col items-center justify-center border border-white/5 gap-1.5 p-2">
                        <Package className="w-5 h-5 text-[#38bdf8]/40 animate-bounce" />
                        <span className="text-[9px] font-mono text-[#64748b] tracking-wider uppercase font-bold text-center">In Sequence...</span>
                      </div>
                    )}
                    <div className="absolute top-3 left-3 z-10">
                      <span className="bg-black/90 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-500/50 text-amber-300 font-bold shadow">
                        {card.grade}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-5 h-5 rounded border border-white/20 bg-black/80 flex items-center justify-center group-hover:border-[#38bdf8]">
                        <Check className="w-3 h-3 text-[#38bdf8]" />
                      </div>
                    </div>
                  </div>

                  <div className="px-2.5 py-2 bg-[#0e1117] border-t border-white/10 rounded-b-xl">
                    <p className="text-xs font-bold text-white truncate group-hover:text-[#38bdf8] transition-colors mb-1">
                      {card.name}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-mono font-black text-white">${card.price.toLocaleString()}</span>
                      <span className="text-green-400 font-bold text-[10px] font-mono">{card.change}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setTradeTarget(card);
                      }}
                      className="mt-2 w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-[11px] uppercase tracking-wider transition-all active:scale-95 shadow-md flex items-center justify-center gap-1"
                    >
                      <Coins className="w-3.5 h-3.5" /> Buy · Trade or Cash
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Column B: LIVE INTERACTIVE FLOOR PLAN */}
          <section
            className={`${isMapExpanded ? 'lg:col-span-12' : 'lg:col-span-6'
              } ${mobileSection === 'map' ? 'flex' : 'hidden lg:flex'
              } flex-col gap-2 border-y lg:border-y-0 lg:border-x border-[#1e293b]/60 px-1 sm:px-2 overflow-hidden h-full min-h-[520px] lg:min-h-0`}
          >
            {/* Map Header */}
            <div className="flex items-center justify-between bg-[#0a0e14] py-1.5 px-3 border border-[#1e293b] rounded-xl shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#38bdf8]" />
                <span className="text-xs font-black tracking-[0.2em] text-white uppercase font-mono">
                  LIVE INTERACTIVE FLOOR PLAN
                </span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                <button
                  onClick={() => setMapZoom(Math.max(80, mapZoom - 20))}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center transition-all"
                  title="Zoom Out"
                >
                  -
                </button>
                <button
                  onClick={() => setMapZoom(130)}
                  className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-[10px] font-mono font-bold text-[#38bdf8] transition-all min-w-[40px] text-center"
                  title="Reset Zoom to 130%"
                >
                  {mapZoom}%
                </button>
                <button
                  onClick={() => setMapZoom(Math.min(300, mapZoom + 20))}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center transition-all"
                  title="Zoom In"
                >
                  +
                </button>

                <div className="w-[1px] h-4 bg-white/15 mx-0.5 sm:mx-1"></div>

                <button
                  onClick={() => setIsMapExpanded(!isMapExpanded)}
                  className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-[10px] font-mono font-bold text-[#38bdf8] transition-all"
                >
                  {isMapExpanded ? (
                    <><Minimize2 className="w-3 h-3" /> <span>RESTORE</span></>
                  ) : (
                    <><Maximize2 className="w-3 h-3" /> <span>EXPAND</span></>
                  )}
                </button>
              </div>
            </div>

            {/* Cyberpunk HUD Floor Map */}
            <div className="relative flex-1 bg-[#060a10] border border-[#0f2840] rounded-2xl overflow-hidden min-h-[460px] lg:min-h-[520px] shadow-2xl flex flex-col">
              {/* Live Audience Footpath HUD Ticker */}
              <div className="bg-[#0c1626] border-b border-[#1e3a5f]/80 px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 z-20 shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f472b6] animate-ping" />
                  <span className="text-[11px] font-mono font-black text-white tracking-wide uppercase flex items-center gap-1">
                    👥 LIVE AUDIENCE FOOTPATH TARGETS 🔥:
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {hotBoothNames.map((name, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-[#f472b6]/15 border border-[#f472b6]/40 text-[10px] font-mono font-bold text-[#f472b6] shadow-[0_0_8px_rgba(244,114,182,0.3)]">
                        {name.split('(')[0].split('—')[0].trim()}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="text-[10px] font-mono text-[#64748b] hidden sm:inline">
                  ⚡ Footpaths & crowd heatmaps randomize per session
                </span>
              </div>

              {/* Floating Cyberpunk HUD Tooltip when hovering over any booth */}
              {hoveredBooth && (
                <div className="absolute top-12 left-3 right-3 z-30 bg-[#0c1420]/95 border border-[#38bdf8] px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-md flex items-center justify-between pointer-events-none transition-all animate-in fade-in duration-150">
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-xs font-mono font-black text-[#38bdf8] shrink-0">
                      {hoveredBooth.booth}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-black text-white font-mono tracking-wide uppercase truncate">
                          {hoveredBooth.name}
                        </h4>
                        {stallPopularity[hoveredBooth.name] && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-extrabold bg-[#0f2840] border border-[#38bdf8]/50 text-white shadow-[0_0_8px_rgba(56,189,248,0.4)] shrink-0">
                            👥 Crowd: {stallPopularity[hoveredBooth.name].level} ({stallPopularity[hoveredBooth.name].score}% Heat)
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#94a3b8] font-mono truncate">
                        {hoveredBooth.specialties?.join(' • ')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right hidden md:block shrink-0">
                    <span className="text-xs font-mono font-bold text-[#2dd4bf]">
                      {hoveredBooth.activeListings}
                    </span>
                    <p className="text-[10px] text-[#64748b] font-mono">
                      Rating: {hoveredBooth.rating}
                    </p>
                  </div>
                </div>
              )}

              {/* Scrollable Map Viewport */}
              <div className="relative flex-1 w-full h-full overflow-auto scrollbar-thin scrollbar-thumb-[#38bdf8]/40 scrollbar-track-transparent">
                <div
                  style={{
                    width: `${mapZoom}%`,
                    height: `${mapZoom}%`,
                    minWidth: `${Math.max(680, 680 * (mapZoom / 100))}px`,
                    minHeight: `${Math.max(480, 480 * (mapZoom / 100))}px`,
                    position: 'relative'
                  }}
                  className="transition-all duration-200"
                >
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d1f3512_1px,transparent_1px),linear-gradient(to_bottom,#0d1f3512_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_50%_40%,rgba(56,189,248,0.06),transparent)] pointer-events-none"></div>

                  <svg viewBox="20 25 600 415" className="w-full h-full relative z-10" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <style>{`
                        svg text, svg circle, svg path, svg line {
                          pointer-events: none !important;
                          user-select: none !important;
                        }
                        svg rect {
                          pointer-events: auto;
                        }
                      `}</style>
                      <filter id="glowCyan" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="6" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="glowPink" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="4" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                      <filter id="glowWhite" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                      </filter>
                    </defs>

                    {/* MAIN GRID LINES */}
                    <line x1="30" y1="60" x2="610" y2="60" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="30" y1="130" x2="610" y2="130" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="30" y1="200" x2="610" y2="200" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="30" y1="270" x2="610" y2="270" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="30" y1="340" x2="610" y2="340" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="80" y1="30" x2="80" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="190" y1="30" x2="190" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="320" y1="30" x2="320" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="450" y1="30" x2="450" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
                    <line x1="560" y1="30" x2="560" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />

                    {/* RANDOMIZED AUDIENCE FOOTPATH CORRIDORS */}
                    {footpathNetwork.corridors.map((c, idx) => (
                      <g key={`corr_${idx}`}>
                        {c.isHot && (
                          <line
                            x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                            stroke={c.color} strokeWidth="5" opacity="0.25"
                            filter="url(#glowWhite)"
                          />
                        )}
                        <line
                          x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                          stroke={c.color}
                          strokeWidth={c.isHot ? "2.2" : "1"}
                          opacity={c.isHot ? "0.85" : "0.3"}
                          strokeDasharray={c.isHot ? "none" : "6,4"}
                        />
                      </g>
                    ))}

                    {/* GLOWING INTERSECTION HUBS */}
                    {footpathNetwork.hubs.map((h, idx) => (
                      <g key={`hub_${idx}`}>
                        <circle cx={h.x} cy={h.y} r="11" fill={h.color} opacity="0.18" filter="url(#glowWhite)" />
                        <circle cx={h.x} cy={h.y} r="4.5" fill={h.color} opacity="0.95">
                          <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (idx % 2)}s`} repeatCount="indefinite" />
                        </circle>
                        <circle cx={h.x} cy={h.y} r="2" fill="#ffffff" opacity="0.8" />
                      </g>
                    ))}

                    {/* OUTER BOUNDARY */}
                    <rect x="30" y="30" width="580" height="400" rx="6" fill="none" stroke="#1e3a5f" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />

                    {/* AUCTION BOOTH (left stage) */}
                    {VENDORS.filter(v => v.type === 'auction').map((v) => (
                      <g key={v.id}>
                        <rect
                          x={v.x} y={v.y} width={v.w} height={v.h} rx="4"
                          fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="2" strokeDasharray="4 4"
                          className="cursor-pointer hover:stroke-[#f87171] hover:fill-[#ef4444]/[0.25] transition-all"
                          onMouseEnter={() => handleBoothHover(v)}
                          onMouseLeave={handleBoothLeave}
                          onClick={() => handleBoothSelect(v)}
                        />
                        <circle cx={v.x + 15} cy={v.y + 15} r="10" fill="#ef4444" fillOpacity="0.3" stroke="#ef4444" strokeWidth="1.5" className="animate-pulse" />
                        <text x={v.x + 15} y={v.y + 19} textAnchor="middle" fill="#ef4444" fontSize="10" fontFamily="monospace" fontWeight="900">A</text>
                        <text x={v.x + v.w / 2 + 15} y={v.y + 40} textAnchor="middle" fill="#fca5a5" fontSize="9" fontFamily="monospace" fontWeight="bold">MAIN STAGE</text>
                        <text x={v.x + v.w / 2 + 15} y={v.y + 56} textAnchor="middle" fill="#ef4444" fontSize="7" fontFamily="monospace" fontWeight="900" className="animate-pulse">🔴 LIVE AUCTION ARENA</text>
                        <text x={v.x + v.w / 2 + 15} y={v.y + 90} textAnchor="middle" fill="#fbbf24" fontSize="6" fontFamily="monospace" fontWeight="bold">CLICK TO ENTER</text>
                      </g>
                    ))}

                    {/* VENDOR BOOTHS (generated grid) */}
                    {VENDORS.filter(v => v.type === 'vendor').map((v) => {
                      const isSelected = selectedVendor?.name === v.name;
                      return (
                        <g key={v.id}>
                          <rect
                            x={v.x} y={v.y} width={v.w} height={v.h} rx="3"
                            fill="#0c1824" stroke={isSelected ? v.color : "#1e3a5f"} strokeWidth={isSelected ? 2 : 1}
                            className="cursor-pointer transition-all"
                            style={{
                              filter: isSelected ? `drop-shadow(0 0 6px ${v.color})` : undefined,
                            }}
                            onMouseEnter={() => handleBoothHover(v)}
                            onMouseLeave={handleBoothLeave}
                            onClick={() => handleBoothSelect(v)}
                          />
                          <circle cx={v.x + 13} cy={v.y + 13} r="9" fill={v.color} fillOpacity="0.18" stroke={v.color} strokeWidth="1" />
                          <text x={v.x + 13} y={v.y + 17} textAnchor="middle" fill={v.color} fontSize="9" fontFamily="monospace" fontWeight="900">{v.booth}</text>
                          <text x={v.x + v.w / 2} y={v.y + 44} textAnchor="middle" fill="#cbd5e1" fontSize="6.5" fontFamily="monospace" fontWeight="bold">
                            {v.name.length > 18 ? v.name.slice(0, 17) + "…" : v.name}
                          </text>
                          <text x={v.x + v.w / 2} y={v.y + 56} textAnchor="middle" fill="#475569" fontSize="5" fontFamily="monospace">
                            {v.specialties[0]}
                          </text>
                          <text x={v.x + v.w / 2} y={v.y + 66} textAnchor="middle" fill="#475569" fontSize="5" fontFamily="monospace">
                            {v.specialties[1]}
                          </text>
                          {isSelected && (
                            <text x={v.x + v.w / 2} y={v.y + 76} textAnchor="middle" fill={v.color} fontSize="5" fontFamily="monospace" fontWeight="bold">● SELECTED</text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>
            </div>
          </section>

          {/* Column C: SELECTED VENDOR PROFILE */}
          <section
            className={`${isMapExpanded ? 'hidden' : ''
              } ${mobileSection === 'vendor' ? 'flex' : 'hidden lg:flex'
              } lg:col-span-3 flex-col gap-2.5 overflow-y-auto pl-1 h-full min-h-[450px] lg:min-h-0`}
          >
            {/* Compact Horizontal Intelligence Ticker */}
            <div className="flex flex-col gap-1.5 shrink-0 bg-[#111418] border border-[#1e293b] p-2 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Crosshair className="w-3.5 h-3.5 text-[#c084fc]" />
                  <span className="text-[11px] font-black tracking-wider text-white uppercase font-mono">
                    LIVE INTELLIGENCE FEEDS
                  </span>
                </div>
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-[#c084fc]/20 text-[#c084fc] font-bold">
                  3 CAMS LIVE
                </span>
              </div>

              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { title: "Circuit Cam", code: "SYS-00" },
                  { title: "Stage Cam", code: "J-101" },
                  { title: "Vendor Cam", code: "V-104", active: true },
                ].map((feed, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-1.5 rounded-lg border text-center ${feed.active
                      ? "bg-[#f472b6]/15 border-[#f472b6]/50 text-[#f472b6]"
                      : "bg-black/40 border-white/10 text-white"
                      }`}
                  >
                    <span className="text-[9px] font-bold truncate w-full font-mono">
                      🔴 {feed.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Vendor Spotlight Card */}
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-center gap-1.5 px-1">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-mono">
                  SELECTED VENDOR SPOTLIGHT
                </h2>
              </div>

              <div className={`bg-gradient-to-b from-[#111418] to-[#0d1015] border border-[#38bdf8]/40 shadow-[0_0_25px_rgba(56,189,248,0.12)] border rounded-2xl p-3.5 flex flex-col gap-3 flex-1`}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono font-bold">
                    Active Vendor Profile:
                  </span>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                      {selectedVendor?.name}
                    </h3>
                    <span className={`px-2 py-0.5 bg-yellow-500/20 text-yellow-300 border-yellow-500/50 text-[8px] font-black uppercase rounded-full border flex items-center gap-1 shadow-sm`}>
                      Premier Vendor <Check className="w-2.5 h-2.5" />
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-black/60 p-2 rounded-xl border border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#94a3b8] uppercase font-mono">
                      Active Listings
                    </span>
                    <span className="font-mono font-black text-white text-xs sm:text-sm">
                      {selectedVendor.activeListings}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[8px] text-[#94a3b8] uppercase font-mono">
                      Completed Trans.
                    </span>
                    <span className="font-mono font-black text-white text-xs sm:text-sm">
                      {selectedVendor.completedTrans}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5 col-span-2 pt-1.5 border-t border-white/5">
                    <span className="text-[8px] text-[#94a3b8] uppercase font-mono">
                      Reputation Score
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-amber-300 text-xs sm:text-sm">
                        {selectedVendor.rating}
                      </span>
                      <div className="flex gap-0.5 text-yellow-500">
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 fill-current" />
                        <Star className="w-3 h-3 text-[#94a3b8]" />
                      </div>
                    </div>
                  </div>
                </div>

                {selectedVendor.specialties && selectedVendor.specialties.length > 0 && (
                  <div className="flex flex-col gap-1.5 bg-black/40 p-2.5 rounded-xl border border-white/5 font-mono">
                    <h4 className="text-[9px] text-[#38bdf8] uppercase tracking-widest border-b border-[#38bdf8]/30 pb-1 font-bold flex items-center gap-1">
                      👑 KNOWN FOR / SPECIALTIES
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedVendor.specialties.map((spec: string, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] text-[10px] border border-[#38bdf8]/20 font-bold"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <h4 className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono border-b border-[#1e293b]/60 pb-1 font-bold">
                    Featured Inventory Grails
                  </h4>
                  <div className="grid grid-cols-3 gap-1.5">
                    {activeVendorCards.filter(item => !brokenOriginalIds.includes(item.originalId || item.id)).slice(0, 3).map((item, i) => (
                      <div
                        key={item.id || `grail-${i}`}
                        onClick={() => {
                          if (onInspectCard) {
                            onInspectCard({
                              id: item.id || `grail-${i}`,
                              name: item.name,
                              currentPrice: typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace('k', '')) * 1000,
                              isSlabbed: true,
                              slabGrade: item.grade,
                              imageUrl: item.img,
                              isVendorCatalog: true,
                              vendorName: selectedVendor?.name || "VINTAGEVAULT TCG",
                              vendorBooth: selectedVendor?.booth || "5B",
                              vendorRating: selectedVendor?.rating || "4.8 / 5"
                            });
                          }
                        }}
                        className="bg-black/70 border border-[#1e293b]/60 rounded-lg p-1.5 flex flex-col items-center text-center gap-0.5 hover:border-[#38bdf8] transition-all cursor-pointer transform hover:-translate-y-0.5 shadow-md group"
                        data-card-container="true"
                      >
                        <div className="w-full aspect-[3/4] bg-gradient-to-tr from-amber-500/20 to-purple-500/20 rounded-md flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform overflow-hidden relative">
                          {item.img ? (
                            <img
                              src={item.img}
                              alt={item.name}
                              className="w-full h-full object-cover"
                              onLoad={(e) => handleCardShowImageLoad(e, item.id, item.name?.includes("Japanese") || item.id?.includes("jp") || item.id?.includes("_ja"))}
                              onError={(e) => handleCardShowImageError(e, item.id, item.name?.includes("Japanese") || item.id?.includes("jp") || item.id?.includes("_ja"))}
                            />
                          ) : (
                            <Award className="w-3.5 h-3.5 text-amber-400" />
                          )}
                        </div>
                        <span className="text-[8px] font-bold leading-tight text-white truncate w-full">
                          {item.name}
                        </span>
                        <div className="flex w-full justify-between items-center px-0.5 pt-0.5 border-t border-white/5">
                          <span className="text-[7px] text-[#38bdf8] font-bold truncate">
                            {item.grade}
                          </span>
                          <span className="text-[7px] font-mono text-green-400 font-black">
                            ${typeof item.price === 'number' ? item.price.toLocaleString() : item.price}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pt-0.5">
                  <h4 className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono border-b border-[#1e293b]/60 pb-1 font-bold">
                    Vendor Specialties & Insights
                  </h4>
                  <div className="flex gap-2 items-center">
                    <ul className="text-[11px] text-white/90 list-disc list-inside flex-1 leading-relaxed font-mono">
                      {(selectedVendor?.specialties || []).map((spec: string, index: number) => (
                        <li key={index} className="truncate">{spec}</li>
                      ))}
                    </ul>

                    <div className="relative w-10 h-10 shrink-0 flex items-center justify-center">
                      <svg
                        viewBox="0 0 36 36"
                        className="w-full h-full transform -rotate-90"
                      >
                        <path
                          className="text-black/70"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                        <path
                          className="text-[#2dd4bf]"
                          strokeDasharray={`${selectedVendor?.discountScore || 75}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                        />
                      </svg>
                      <span className="absolute text-[9px] font-mono font-bold text-white">
                        {selectedVendor?.discountScore || 75}%
                      </span>
                    </div>
                  </div>
                  <span className="text-[8px] text-[#2dd4bf] font-black tracking-wider uppercase text-right block mt-[-4px]">
                    ⚡ TENDS TO OFFER PREMIER DEALS
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-[#1e293b]/60">
                  <button
                    onClick={() => {
                      if (window.innerWidth < 1024) setMobileSection('market');
                    }}
                    className="bg-white/5 hover:bg-white/10 text-white text-[11px] font-bold py-2 px-2 rounded-xl transition-all text-center truncate border border-white/10"
                  >
                    [Catalog ({filteredCards.length})]
                  </button>
                  <button
                    onClick={() => alert(`Direct Secure Comm Channel opened with ${selectedVendor.name}.`)}
                    className="bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf] hover:from-[#38bdf8]/90 hover:to-[#2dd4bf]/90 text-black text-[11px] font-black py-2 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(56,189,248,0.4)]"
                  >
                    [Message VIP] <Zap className="w-3 h-3 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </main>

        <TradeModal target={tradeTarget} vendorName={selectedVendor?.name} onClose={() => setTradeTarget(null)} onAddNetReturn={onAddNetReturn} />

      </div>
    </>
  );
};

export default CardShowView;

// ── VENDOR "BUY · TRADE OR CASH" PURCHASE MODAL ───────────────────────────────
const TradeModal: React.FC<{ target: any; vendorName?: string; onClose: () => void; onAddNetReturn?: (amount: number) => void }> = ({
  target,
  vendorName,
  onClose,
  onAddNetReturn,
}) => {
  const open = Boolean(target);
  const price = target?.price || 0;
  const [owned, setOwned] = useState<Card[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [cashStr, setCashStr] = useState("0");
  const [search, setSearch] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (open) {
      setOwned(getCollectedCards());
      setSelected(new Set());
      setCashStr("0");
      setSearch("");
      setDone(false);
    }
  }, [open, target]);

  const cashBalance = getCash();
  const cash = Math.max(0, Number(cashStr) || 0);
  const tradeValue = owned
    .filter((c) => selected.has(c.id))
    .reduce((s, c) => s + (c.currentPrice || 0), 0);
  const covered = cash + tradeValue;
  const cashTowardPrice = Math.max(0, price - tradeValue);
  const cashPaid = Math.min(cash, cashTowardPrice);
  const leftoverCash = Math.max(0, cash - cashPaid);
  const tradeTowardPrice = Math.min(tradeValue, price - cashPaid);
  const change = Math.max(0, leftoverCash + (tradeValue - tradeTowardPrice));
  const remaining = Math.max(0, price - covered);
  const cashOk = cash <= cashBalance;
  const canComplete = covered >= price && cashOk && !done;

  const toggleSelect = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const payFullCash = () => {
    setCashStr(String(price));
    setSelected(new Set());
  };

  const autoPickTrade = () => {
    const sorted = [...owned].sort((a, b) => (b.currentPrice || 0) - (a.currentPrice || 0));
    const n = new Set<string>();
    let sum = 0;
    for (const c of sorted) {
      if (sum >= price) break;
      n.add(c.id);
      sum += c.currentPrice || 0;
    }
    setSelected(n);
    setCashStr("0");
  };

  const complete = () => {
    if (!canComplete) return;
    spendCash(cashPaid);
    selected.forEach((id) => removeCollectedCard(id));
    if (change > 0 && onAddNetReturn) onAddNetReturn(change);
    const newCard = saveCollectedCard(
      {
        value: price,
        pokemon: {
          id: target.id,
          name: target.name,
          images: { large: target.img },
          rarity: target.grade || "Rare",
        },
      },
      vendorName || "VINTAGEVAULT TCG"
    );
    if (target.grade && newCard) updateCardSlabStatus(newCard.id, target.grade);
    setDone(true);
    setTimeout(onClose, 1500);
  };

  const filteredOwned = owned.filter((c) =>
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl max-h-[92vh] bg-[#0b0e13] border border-[#1e293b] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b] bg-[#0e1117] shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <Coins className="w-4 h-4 text-slate-950" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white tracking-wide uppercase">Complete Your Purchase</h3>
              <p className="text-[10px] font-mono text-[#94a3b8]">Pay with cash, trade cards, or both</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={done}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#94a3b8] hover:text-white transition-colors disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 py-16 text-center px-6">
            <CheckCircle2 className="w-16 h-16 text-emerald-400" />
            <h4 className="text-lg font-black text-white">Purchase Complete!</h4>
            <p className="text-xs text-[#94a3b8] font-mono">
              {target.name} added to your collection{selected.size > 0 ? ` • ${selected.size} card(s) traded in` : ""}.
            </p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Vendor card summary */}
            <div className="flex items-center gap-3 bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <img
                src={target.img}
                alt={target.name}
                className="w-16 h-[88px] sm:w-20 sm:h-[112px] object-cover rounded-md border border-white/10 bg-black"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-mono text-[#38bdf8] uppercase tracking-wider truncate">{vendorName}</p>
                <h4 className="text-sm sm:text-base font-black text-white truncate">{target.name}</h4>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-500/50 text-amber-300 font-bold">
                  {target.grade}
                </span>
                <div className="mt-2 text-2xl font-black text-white font-mono">${price.toLocaleString()}</div>
              </div>
            </div>

            {/* Cash payment */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Wallet className="w-4 h-4 text-emerald-400" /> Pay with Cash
                </span>
                <span className="text-[11px] font-mono text-[#94a3b8]">
                  Balance: <span className="text-white font-bold">${cashBalance.toLocaleString()}</span>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-mono font-bold">$</span>
                <input
                  type="number"
                  min={0}
                  value={cashStr}
                  onChange={(e) => setCashStr(e.target.value)}
                  className="flex-1 bg-black/40 border border-[#1e293b] rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-emerald-400"
                  placeholder="0"
                />
                <button
                  onClick={payFullCash}
                  className="px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[11px] font-mono font-bold text-[#38bdf8] transition-all"
                >
                  Pay Full
                </button>
              </div>
              {!cashOk && (
                <p className="text-[10px] text-rose-400 font-mono mt-1.5">⚠ Cash entered exceeds your balance.</p>
              )}
            </div>

            {/* Trade-in cards */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3">
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-white">
                  <Repeat className="w-4 h-4 text-teal-400" /> Trade In Cards
                  <span className="text-[11px] font-mono text-[#94a3b8]">
                    ({selected.size} selected · <span className="text-teal-300 font-bold">${tradeValue.toLocaleString()}</span>)
                  </span>
                </span>
                <button
                  onClick={autoPickTrade}
                  disabled={owned.length === 0}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono font-bold text-teal-300 transition-all disabled:opacity-40"
                >
                  Auto-Cover
                </button>
              </div>

              {owned.length === 0 ? (
                <p className="text-[11px] text-[#64748b] font-mono py-4 text-center">
                  You have no cards in your collection to trade. Pay with cash instead.
                </p>
              ) : (
                <>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#64748b]" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search your cards..."
                      className="w-full bg-black/40 border border-[#1e293b] rounded-lg pl-8 pr-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-teal-400"
                    />
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
                    {filteredOwned.map((c) => {
                      const isSel = selected.has(c.id);
                      return (
                        <button
                          key={c.id}
                          onClick={() => toggleSelect(c.id)}
                          className={`relative rounded-lg border p-1.5 flex flex-col items-center text-center transition-all ${
                            isSel
                              ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                              : "border-[#1e293b] bg-black/30 hover:border-teal-400/60"
                            }`}
                        >
                          {isSel && (
                            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow">
                              <Check className="w-3 h-3 text-slate-950" />
                            </span>
                          )}
                          <div className="w-full aspect-[3/4] bg-black rounded overflow-hidden mb-1">
                            <img
                              src={c.imageUrl}
                              alt={c.name}
                              className="w-full h-full object-cover"
                              onError={(e) => { (e.currentTarget as HTMLImageElement).style.visibility = "hidden"; }}
                            />
                          </div>
                          <span className="text-[9px] text-white font-bold leading-tight line-clamp-2 w-full">{c.name}</span>
                          <span className="text-[9px] font-mono text-teal-300 font-bold mt-0.5">${(c.currentPrice || 0).toLocaleString()}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Summary / Complete */}
            <div className="bg-[#111418] border border-[#1e293b] rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Price</span>
                <span className="text-white font-black">${price.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Cash Applied</span>
                <span className="text-emerald-400 font-black">${cashPaid.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#94a3b8]">Trade Value</span>
                <span className="text-teal-300 font-black">${tradeTowardPrice.toLocaleString()}</span>
              </div>
              {change > 0 && (
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-[#94a3b8]">Change Due</span>
                  <span className="text-amber-300 font-black">${change.toLocaleString()}</span>
                </div>
              )}
              {remaining > 0 && (
                <p className="text-[10px] text-rose-400 font-mono">⚠ Still need ${remaining.toLocaleString()} to complete.</p>
              )}
              <button
                onClick={complete}
                disabled={!canComplete}
                className="mt-1 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-black uppercase tracking-wider transition-all active:scale-[0.98] shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Complete Purchase
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
