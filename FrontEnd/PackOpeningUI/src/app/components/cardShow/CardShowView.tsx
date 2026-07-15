import React, { useState, useMemo, useEffect } from "react";
import { loadJapaneseMetadata, getCardShowDynamicJapaneseCards } from "../../services/scrydex";
import { handleCardImageError } from "../../services/tcgdex";
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
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
  TrendingDown
} from "lucide-react";

interface CardShowViewProps {
  onBackToPacks?: () => void;
  onInspectCard?: (card: any) => void;
}

export const CardShowView: React.FC<CardShowViewProps> = ({
  onBackToPacks,
  onInspectCard,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showArbSpotlight, setShowArbSpotlight] = useState(false);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapZoom, setMapZoom] = useState<number>(130);
  const [mobileSection, setMobileSection] = useState<'map' | 'market' | 'vendor'>('market');
  const [metadataLoaded, setMetadataLoaded] = useState(false);
  const [brokenOriginalIds, setBrokenOriginalIds] = useState<string[]>([]);

  useEffect(() => {
    loadJapaneseMetadata().then(() => {
      setMetadataLoaded(true);
    });
  }, []);

  const handleCardShowImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardId?: string, isJpn?: boolean) => {
    const img = e.currentTarget;
    let setId = 'swsh3';
    let num = '1';
    
    // First and foremost: try to extract actual set ID and card number from the current image src
    const match = img.src.match(/\/pokemon\/([a-z0-9_-]+)[/-]([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
                  img.src.match(/\/([a-z0-9_-]+)\/([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
                  img.src.match(/\/([a-z0-9_-]+)[/-]([0-9]+)(\.png|\.webp|_hires)/i);
    
    if (match) {
      setId = match[1];
      num = match[2];
    } else if (cardId && cardId.includes('-')) {
      const parts = cardId.split('-');
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
    
    if (isJpn && !setId.toLowerCase().includes('_ja')) {
      setId = `${setId}_ja`;
    }
    
    handleCardImageError(img, setId, num, () => {
      // 1. IMMEDIATE: hide the card container in the DOM right now — zero placeholder flash
      //    Walk up from the img to find the card container marked with data-card-container
      const cardContainer = img.closest('[data-card-container]') as HTMLElement | null;
      if (cardContainer) {
        cardContainer.style.display = 'none';
      }
      // 2. Also update React state so this card is excluded from filteredCards on every subsequent render
      const card = activeVendorCards.find(c => c.id === cardId);
      const origId = card?.originalId || cardId || `${setId}-${num}`;
      if (origId) {
        setBrokenOriginalIds(prev => prev.includes(origId) ? prev : [...prev, origId]);
      }
    });
  };

  // Detect pokemontcg.io card-back "false success": when pokemontcg.io can't find a card it
  // serves the generic card BACK image (HTTP 200, blue swirl Pokeball). We catch this onLoad by
  // sampling a corner pixel via canvas — the card back has a very dark navy-blue corner (~r<50, g<80, b>100).
  const handleCardShowImageLoad = (e: React.SyntheticEvent<HTMLImageElement, Event>, cardId?: string, isJpn?: boolean) => {
    const img = e.currentTarget;
    // Only check pokemontcg.io images — other CDNs return proper 404s
    if (!img.src.includes('pokemontcg.io')) return;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 8;
      canvas.height = 8;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 8, 8);
      // Sample top-left corner pixel (card back corner is very dark blue)
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data;
      // Card back corner: r < 50, g < 75, b > 90 (dark indigo/navy)
      const isCardBack = r < 50 && g < 75 && b > 90;
      if (isCardBack) {
        // Fake an error event so the fallback chain kicks in and either finds real art or hides the card
        handleCardShowImageError(
          { currentTarget: img } as React.SyntheticEvent<HTMLImageElement, Event>,
          cardId,
          isJpn
        );
      }
    } catch {
      // canvas tainted by CORS — can't sample, skip detection
    }
  };


  const [selectedVendor, setSelectedVendor] = useState<any>({
    name: "VINTAGEVAULT TCG",
    type: "vendor",
    rating: "4.8 / 5",
    activeListings: "3,450+ Items",
    completedTrans: "12,800+",
    booth: "Booth 104",
    specialties: ["WOTC Japanese (Kanji)", "e-Series (JPN)", "Neo Destiny"],
    discountScore: 75,
  });

  const [hoveredBooth, setHoveredBooth] = useState<any>(null);

  // --- AUDIENCE FOOTPATH & RANDOMIZED CROWD POPULARITY ENGINE ---
  // Generates randomized crowd traffic and animated audience footpaths every time a person loads up the website.
  const { stallPopularity, hotBoothNames, footpathNetwork, animatedAudienceDots, staticClusterDots } = useMemo(() => {
    // 1. Define all booths/stalls and their primary corridor entrance coordinates on the 600x415 map
    const stalls = [
      { id: "stage", name: "MAIN STAGE & AUCTION ARENA", zone: "Zone 1", x: 110, y: 120, color: "#38bdf8", isHotEligible: true },
      { id: "artist", name: "ARTIST ALLEY & SIGNINGS", zone: "Zone 2", x: 82, y: 162, color: "#c084fc", isHotEligible: true },
      { id: "sketch", name: "ARTIST ALLEY B — SKETCH CARDS", zone: "Zone 2B", x: 82, y: 232, color: "#c084fc", isHotEligible: false },
      { id: "autograph", name: "AUTOGRAPH PIT", zone: "Zone 3", x: 250, y: 120, color: "#2dd4bf", isHotEligible: true },
      { id: "tournament", name: "TOURNAMENT AREA A", zone: "Zone 4", x: 385, y: 120, color: "#fbbf24", isHotEligible: true },
      { id: "tcg_am", name: "TCG VENDORS (A-M)", zone: "Zone 5", x: 180, y: 162, color: "#38bdf8", isHotEligible: true },
      { id: "alpha_grails", name: "ALPHA GRAILS", zone: "5A", x: 268, y: 147, color: "#38bdf8", isHotEligible: true },
      { id: "vintage_vault", name: "VINTAGEVAULT TCG", zone: "5B", x: 352, y: 147, color: "#2dd4bf", isHotEligible: true },
      { id: "paldea", name: "PALDEA ALT ART DEPOT", zone: "5C", x: 268, y: 177, color: "#c084fc", isHotEligible: false },
      { id: "promos", name: "PALDEAN PROMOS TCG BOOTH", zone: "5D", x: 352, y: 177, color: "#f472b6", isHotEligible: false },
      { id: "slab_city", name: "SLAB CITY PSA ON-SITE", zone: "Zone 5E", x: 490, y: 162, color: "#38bdf8", isHotEligible: true },
      { id: "retro_hq", name: "RETRO POKÉMON HQ", zone: "Zone X", x: 565, y: 162, color: "#38bdf8", isHotEligible: true },
      { id: "tcg_nz", name: "TCG VENDORS (N-Z)", zone: "Zone 6", x: 180, y: 232, color: "#fb923c", isHotEligible: true },
      { id: "specials_zone", name: "SPECIALS ZONE TRADING", zone: "6A", x: 268, y: 217, color: "#34d399", isHotEligible: true },
      { id: "gold_star", name: "GOLD STAR COLLECTORS", zone: "6B", x: 352, y: 217, color: "#f472b6", isHotEligible: true },
      { id: "sealed_kingdom", name: "SEALED PRODUCT KINGDOM", zone: "6C", x: 268, y: 247, color: "#22d3ee", isHotEligible: true },
      { id: "modern_alt", name: "MODERN ALT ART VAULT", zone: "Booth 16", x: 490, y: 232, color: "#38bdf8", isHotEligible: true },
      { id: "japanese_hub", name: "JAPANESE HIGH CLASS HUB", zone: "Booth 46", x: 565, y: 232, color: "#38bdf8", isHotEligible: true },
      { id: "display_gallery", name: "DISPLAY & CASES GALLERY", zone: "Zone 7 Display", x: 82, y: 302, color: "#c084fc", isHotEligible: false },
      { id: "sealed_zone7", name: "SEALED PRODUCT ZONE 7", zone: "Zone 7", x: 180, y: 302, color: "#38bdf8", isHotEligible: false },
      { id: "filmera", name: "FILMERA GRADED CARDS", zone: "7A Filmera", x: 268, y: 287, color: "#fbbf24", isHotEligible: false },
      { id: "carbanda", name: "CARBANDA VINTAGE TCG", zone: "7B Carbanda", x: 352, y: 287, color: "#f472b6", isHotEligible: true },
      { id: "trading_zone8", name: "TRADING TABLES ZONE 8", zone: "Zone 8", x: 310, y: 320, color: "#f472b6", isHotEligible: true },
      { id: "brodes", name: "BRODES TCG SYNDICATE", zone: "Booth 15", x: 430, y: 302, color: "#38bdf8", isHotEligible: true },
      { id: "trading_east", name: "TRADING TABLES ZONE 8 (EAST)", zone: "Zone 8 East", x: 180, y: 377, color: "#38bdf8", isHotEligible: true },
      { id: "wikrats", name: "WIKRATS POKÉMON EMPORIUM", zone: "Booth 8A", x: 257, y: 377, color: "#38bdf8", isHotEligible: false },
      { id: "uds", name: "UDS COLLECTIBLES & SLABS", zone: "Booth 8B", x: 322, y: 377, color: "#38bdf8", isHotEligible: false },
      { id: "specs", name: "SPECS GRADED GRAILS", zone: "Booth 8C", x: 387, y: 377, color: "#38bdf8", isHotEligible: true },
      { id: "dovakinji", name: "DOVAKINJI COLLECTIBLES", zone: "VIP 10", x: 467, y: 377, color: "#f472b6", isHotEligible: true }
    ];

    // 2. Randomly shuffle and select 4 "HOTTEST / MOST POPULAR" booths and 6 "HIGH TRAFFIC" booths
    const eligibleStalls = [...stalls.filter(s => s.isHotEligible)].sort(() => Math.random() - 0.5);
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

    // 3. Define Cyberpunk Corridor Intersection Waypoints (Nodes) inspired by user image
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

    // 4. Build Footpath Highway Network (connecting corridors + branches to popular booths)
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

    // Add highlighted glowing branches straight to the randomly chosen HOT stalls
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

    // 5. Generate Audience Footpath Moving Dots & Swarming Clusters
    const movingDots: Array<{ id: string, x1: number, y1: number, x2: number, y2: number, r: number, color: string, dur: number, delay: number }> = [];
    const staticDots: Array<{ id: string, cx: number, cy: number, r: number, color: string, opacity: number, dur: number }> = [];

    // Generate walking audience dots across all corridors (denser on hot footpaths)
    let dotId = 0;
    corridors.forEach(c => {
      const numDots = c.isHot ? 14 : 6;
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

    // Generate swarming cluster dots outside stalls (huge clusters outside HOT stalls)
    stalls.forEach(stall => {
      const status = popMap[stall.name]?.level || 'STEADY 🟢';
      let clusterCount = 3;
      if (status.includes('HOT')) clusterCount = 20;
      else if (status.includes('HIGH TRAFFIC')) clusterCount = 9;

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

  const getBoothType = (name: string, explicitType?: string) => {
    if (explicitType) return explicitType;
    const n = (name || "").toUpperCase();
    if (n.includes("STAGE") || n.includes("AUCTION")) return "auction";
    if (n.includes("SIGNING") || n.includes("AUTOGRAPH") || n.includes("SKETCH") || n.includes("ARTIST ALLEY")) return "signing";
    if (n.includes("TOURNAMENT") || n.includes("TRADING TABLES")) return "tournament";
    if (n.includes("SLAB CITY") || n.includes("HELP DESK") || n.includes("MERCH") || n.includes("INFO")) return "service";
    if (n.includes("DISPLAY") || n.includes("MUSEUM") || n.includes("GALLERY")) return "gallery";
    return "vendor";
  };

  const handleBoothSelect = (vendorObj: any) => {
    const fullObj = {
      ...vendorObj,
      type: getBoothType(vendorObj.name, vendorObj.type)
    };
    setSelectedVendor(fullObj);
    if (window.innerWidth < 1024) setMobileSection('vendor');
  };

  const handleBoothHover = (vendorObj: any) => {
    const fullObj = {
      ...vendorObj,
      type: getBoothType(vendorObj.name, vendorObj.type)
    };
    setSelectedVendor(fullObj);
    setHoveredBooth(fullObj);
  };

  const handleBoothLeave = () => {
    setHoveredBooth(null);
  };

  // 50+ Curated Catalog Cards Generator per Vendor (Diverse Specialties & Price Ranges: $5-$50 budget, $60-$280 mid, $300-$1800 grails across English & Japanese)
  const activeVendorCards = useMemo(() => {
    const vName = (selectedVendor?.name || "").toUpperCase();
    
    // Master thematic pools
    const pools = {
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
        { name: "CoroCoro Shining Mew Holo (JPN)", grade: "PSA 10", price: 1650.0, change: "+9.8%", id: "coro_ja-1", img: "https://images.pokemontcg.io/np/47_hires.png" },
        { name: "Japanese Neo 2 Charizard Holo", grade: "PSA 10", price: 890.0, change: "+6.1%", id: "neo2_ja-30", img: "https://images.pokemontcg.io/np/30_hires.png" },
        { name: "Japanese Web Series Gengar Holo", grade: "PSA 10", price: 920.0, change: "+8.5%", id: "fo1_ja-5", img: "https://images.pokemontcg.io/fo1/5_hires.png" },
        { name: "VS Series Lance's Charizard (JPN)", grade: "PSA 10", price: 780.0, change: "+11.4%", id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
        { name: "Japanese e-Series Crystal Charizard", grade: "PSA 9", price: 2650.0, change: "+7.9%", id: "skyridge_ja-146", img: "https://images.pokemontcg.io/ecard3/146_hires.png" },
        { name: "Crystal Ho-Oh e-Series (JPN)", grade: "PSA 9", price: 1120.0, change: "+5.3%", id: "skyridge_ja-149", img: "https://images.pokemontcg.io/ecard3/149_hires.png" },
        { name: "Japanese Vending Series 3 Mewtwo", grade: "PSA 10", price: 340.0, change: "+4.2%", id: "base1_ja-10", img: "https://images.pokemontcg.io/base1/10_hires.png" },
        { name: "Japanese Vending Series 1 Pikachu", grade: "PSA 10", price: 280.0, change: "+6.7%", id: "base1_ja-58", img: "https://images.pokemontcg.io/base1/58_hires.png" },
        { name: "Imakuni's Doduo Vending Promo", grade: "PSA 10", price: 210.0, change: "+3.1%", id: "gym1_ja-112", img: "https://images.pokemontcg.io/gym1/112_hires.png" },
        { name: "GB Dragonite Promo Holo (JPN)", grade: "PSA 10", price: 390.0, change: "+8.0%", id: "fo1_ja-4", img: "https://images.pokemontcg.io/fo1/4_hires.png" },
        { name: "CD Promo Charizard Holo (JPN)", grade: "PSA 10", price: 650.0, change: "+9.2%", id: "base1_ja-4", img: "https://images.pokemontcg.io/base1/4_hires.png" },
        { name: "CD Promo Blastoise Holo (JPN)", grade: "PSA 10", price: 380.0, change: "+5.4%", id: "base1_ja-2", img: "https://images.pokemontcg.io/base1/2_hires.png" },
        { name: "CD Promo Venusaur Holo (JPN)", grade: "PSA 10", price: 360.0, change: "+4.9%", id: "base1_ja-15", img: "https://images.pokemontcg.io/base1/15_hires.png" },
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
      ]
    };

    // Generate realistic budget ($5-$48) and mid-range raw ($50-$120) ungraded binder singles across English & Japanese
    const rawBinderSingles = [
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
    ];

    const dynamicJpnPool = getCardShowDynamicJapaneseCards(4000);

    // Differentiate Vendor Archetypes so tables either sell realistic RAW Ungraded regular set cards OR apply PSA value multipliers
    const isHighEndSlabGrailVendor = vName.includes("ALPHA GRAILS") || vName.includes("GOLD STAR") || vName.includes("SLAB CITY") || vName.includes("VINTAGEVAULT") || vName.includes("SPECS GRADED");
    const isJapaneseSpecialty = vName.includes("JAPANESE HIGH CLASS") || vName.includes("RETRO POKÉMON") || vName.includes("DOVAKINJI");
    const isModernAltVendor = vName.includes("MODERN ALT") || vName.includes("PALDEA") || vName.includes("UDS") || vName.includes("PROMOS");

    // Stable seeded random number generator based on the selected vendor name & booth ID
    // This resolves the glitch where different vendors show the exact same VIP showcase cards!
    const getSeededRandom = (seed: string) => {
      let h = 0;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
      }
      return () => {
        h = Math.imul(h ^ h >>> 16, 2246822507) | 0;
        h = Math.imul(h ^ h >>> 13, 3266489909) | 0;
        return ((h ^= h >>> 16) >>> 0) / 4294967296;
      };
    };

    const rand = getSeededRandom((selectedVendor?.name || 'vendor') + (selectedVendor?.booth || 'booth'));

    const seededShuffle = <T,>(array: T[]): T[] => {
      const copy = [...array];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    };

    // Deterministic disjoint subsets based on a vendor hash
    const getVendorIndex = (name: string) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = (hash + name.charCodeAt(i)) % 29;
      }
      return hash;
    };
    const vendorIdx = getVendorIndex(vName);

    // Get a subset of an array that shifts index based on vendorIdx, minimizing card overlap
    const getDisjointSlice = <T,>(arr: T[], count: number, offsetMultiplier: number): T[] => {
      const result: T[] = [];
      for (let i = 0; i < count; i++) {
        const idx = (vendorIdx * offsetMultiplier + i) % arr.length;
        result.push(arr[idx]);
      }
      return result;
    };

    // Calculate vendor-specific pool subsets
    // Step size (offsetMultiplier) is set close to the count size to ensure adjacent vendors have very little card overlap (at most 1-2 cards)
    const engSlice = getDisjointSlice(pools.vintageEng, 6, 5);
    const gsSlice = getDisjointSlice(pools.goldStarsEx, 3, 2);
    const jpnVintSlice = getDisjointSlice(pools.vintageJpn, 4, 3);
    const modAltSlice = getDisjointSlice(pools.modernAlt, 4, 3);
    const ttSlice = getDisjointSlice(pools.tagTeams, 3, 2);
    const jpnModSlice = getDisjointSlice(pools.jpnModern, 4, 3);
    const rawSlice = getDisjointSlice(rawBinderSingles, 8, 7);

    // Japanese regular sets have 2445 cards, slice with step size 80 to ensure disjoint Japanese catalogs of 100 cards per vendor
    const startJpn = (vendorIdx * 80) % (dynamicJpnPool.length - 110);
    const jpnSlice = dynamicJpnPool.slice(startJpn, startJpn + 100);

    let finalVendorPool: any[] = [];

    if (isHighEndSlabGrailVendor) {
      // 1. High-End Glass Case Vendors (15-20% of floor): Sell graded grails & slabs ($250 - $18,000)
      // Ensure Japanese regular set expensive chase cards & slabs are featured prominently!
      const topGrails = seededShuffle([...engSlice, ...gsSlice, ...jpnVintSlice, ...jpnSlice.slice(0, 35)]);
      const midSlabs = seededShuffle([...modAltSlice, ...ttSlice, ...jpnModSlice, ...jpnSlice.slice(35, 75)]);
      const rawHighlights = seededShuffle([...rawSlice, ...jpnSlice.slice(75, 100)]);
      const combined = [...topGrails, ...midSlabs, ...rawHighlights];
      finalVendorPool = combined.map((c, idx) => {
        const assignedGrade = c.grade || (idx % 3 === 0 ? "PSA 10" : idx % 3 === 1 ? "PSA 9" : "BGS 9.5");
        // Apply PSA value multiplier if we have rawPrice, otherwise use existing price
        const baseRaw = (c as any).rawPrice || (c.price ? (assignedGrade === "PSA 10" ? c.price / 2.8 : c.price) : 150);
        const finalPrice = assignedGrade === "PSA 10" ? Math.max(c.price || 350, Number((baseRaw * 2.8).toFixed(2))) : assignedGrade === "PSA 9" ? Math.max(c.price || 180, Number((baseRaw * 1.6).toFixed(2))) : (c.price || 200);
        return {
          ...c,
          id: `${selectedVendor?.booth || 'booth'}-grail-${idx}`,
          grade: assignedGrade,
          price: finalPrice,
        };
      }).slice(0, 110);
    } else if (isJapaneseSpecialty) {
      // 2. Japanese Hub / Import Tables: Sell expensive regular set Japanese cards (Scarlet & Violet, Sword & Shield, Sun & Moon, Vintage)
      // For specialty raw tables like Retro Pokémon HQ, sell raw regular set cards right at rawPrice ($15 - $380).
      // For glass case tables (Japanese High Class Hub / Dovakinji), apply PSA value multiplier on top regular set chase hits!
      const jpnMasterList = seededShuffle([...jpnSlice, ...jpnModSlice, ...jpnVintSlice, ...rawSlice.filter(c => c.name?.includes("Japanese"))]);
      const isRawSpecialty = vName.includes("RETRO POKÉMON");
      let idx = 0;
      while (finalVendorPool.length < 110) {
        idx++;
        const item = jpnMasterList[idx % jpnMasterList.length];
        const baseRaw = (item as any).rawPrice || (item.price ? Math.min(item.price, item.price / ((item as any).grade?.includes("PSA") ? 2.5 : 1)) : 45);
        if (isRawSpecialty || idx % 3 !== 0) {
          // Sell Raw Ungraded regular set expensive card at realistic raw market value
          const rawSellPrice = Math.max(10, Number((baseRaw * (0.95 + (idx % 5) * 0.05)).toFixed(2)));
          finalVendorPool.push({
            ...item,
            id: `${selectedVendor?.booth || 'booth'}-jpnraw-${idx}`,
            grade: idx % 6 === 0 ? "Raw LP/NM" : "Raw NM",
            price: rawSellPrice
          });
        } else {
          // Sell Graded Japanese Regular Set Slab with PSA value multiplier applied to raw price
          const slabGrade = idx % 2 === 0 ? "PSA 10" : "PSA 9";
          const slabPrice = slabGrade === "PSA 10" ? Math.max(item.price || 240, Number((baseRaw * 3.2).toFixed(2))) : Math.max((item.price || 140) * 0.6, Number((baseRaw * 1.7).toFixed(2)));
          finalVendorPool.push({
            ...item,
            id: `${selectedVendor?.booth || 'booth'}-jpnslab-${idx}`,
            grade: slabGrade,
            price: slabPrice
          });
        }
      }
    } else if (isModernAltVendor) {
      // 3. Modern Alt Art & Hit Tables: Sell regular set Modern hits across English & Japanese ($15 - $280 raw, + slabs with PSA multiplier)
      const modRaw = seededShuffle([...rawSlice, ...modAltSlice, ...ttSlice, ...jpnSlice.filter(c => !c.id.includes('base') && !c.id.includes('neo') && !c.id.includes('fo'))]);
      const modSlabs = seededShuffle([...modAltSlice]);
      let idx = 0;
      while (finalVendorPool.length < 110) {
        idx++;
        if (idx <= 14 && idx < modSlabs.length) {
          const s = modSlabs[idx];
          const baseRaw = (s as any).rawPrice || (s.price ? s.price / 2.6 : 80);
          finalVendorPool.push({
            ...s,
            id: `${selectedVendor?.booth || 'booth'}-modslab-${idx}`,
            grade: idx % 2 === 0 ? "PSA 10" : "PSA 9",
            price: idx % 2 === 0 ? Math.max(s.price || 240, Number((baseRaw * 2.8).toFixed(2))) : Number((baseRaw * 1.6).toFixed(2))
          });
        } else {
          const r = modRaw[idx % modRaw.length];
          const baseRaw = (r as any).rawPrice || (r.price ? ((r as any).grade?.includes("PSA") ? r.price / 2.5 : r.price) : 35);
          const rawPrice = Math.max(10, Number((baseRaw * (0.9 + (idx % 6) * 0.05)).toFixed(2)));
          finalVendorPool.push({
            ...r,
            id: `${selectedVendor?.booth || 'booth'}-modraw-${idx}`,
            grade: "Raw NM",
            price: rawPrice
          });
        }
      }
    } else {
      // 4. Standard Floor Vendors, Trade Tables & General Sellers (70% OF THE SHOW! Zone 8, A-M, N-Z, Carbanda, Brodes, etc.)
      // Featuring raw regular set cards across English & Japanese ($10 to $180) + centerpieces!
      const allRaw = seededShuffle([...rawSlice, ...jpnSlice, ...ttSlice]);
      const showcaseItems = seededShuffle([...jpnVintSlice, ...modAltSlice, ...jpnSlice.slice(0, 12)]);
      let idx = 0;
      while (finalVendorPool.length < 110) {
        idx++;
        if (idx <= 10 && idx < showcaseItems.length) {
          const sc = showcaseItems[idx];
          const baseRaw = (sc as any).rawPrice || (sc.price ? ((sc as any).grade?.includes("PSA") ? sc.price / 2.6 : sc.price) : 60);
          const grade = idx % 2 === 0 ? "PSA 10" : "PSA 9";
          finalVendorPool.push({
            ...sc,
            id: `${selectedVendor?.booth || 'booth'}-showcase-${idx}`,
            grade: grade,
            price: grade === "PSA 10" ? Number((baseRaw * 2.8).toFixed(2)) : Number((baseRaw * 1.6).toFixed(2))
          });
        } else {
          const r = allRaw[idx % allRaw.length];
          const baseRaw = (r as any).rawPrice || (r.price ? ((r as any).grade?.includes("PSA") ? r.price / 2.5 : r.price) : 28);
          const rawPrice = Math.max(8, Number((baseRaw * (0.85 + (idx % 7) * 0.05)).toFixed(2)));
          finalVendorPool.push({
            ...r,
            id: `${selectedVendor?.booth || 'booth'}-floor-${idx}`,
            grade: idx % 6 === 0 ? "Raw LP" : idx % 6 === 1 ? "Raw MP/LP" : "Raw NM",
            price: rawPrice
          });
        }
      }
    }

    return finalVendorPool.map((c: any, i: number) => ({
      ...c,
      id: c.id || `${selectedVendor?.booth || 'booth'}-${i}`,
      originalId: c.originalId || c.id,
      setId: (c as any).setId || (c.id ? c.id.split('-')[0] : 'swsh3'),
      num: (c as any).num || (c.id && c.id.includes('-') ? c.id.split('-')[1] : '1')
    }));
  }, [selectedVendor?.name, selectedVendor?.booth, metadataLoaded]);

  const filteredCards = activeVendorCards.filter((c) => {
    if (brokenOriginalIds.includes(c.originalId || c.id)) return false;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === "Raw Ungraded") return matchesSearch && c.grade.includes("Raw");
    if (selectedFilter === "PSA 10") return matchesSearch && c.grade === "PSA 10";
    if (selectedFilter === "BGS/CGC") return matchesSearch && (c.grade.includes("BGS") || c.grade.includes("CGC"));
    if (selectedFilter === "WOTC / Vintage") return matchesSearch && (c.name.includes("Base") || c.name.includes("Neo") || c.name.includes("1st"));
    if (selectedFilter === "Modern Alt") return matchesSearch && (c.name.includes("Alt") || c.name.includes("VMAX") || c.name.includes("GX") || c.name.includes("IR") || c.name.includes("SAR"));
    return matchesSearch;
  });

  return (
    <div className="w-full h-full min-h-[calc(100vh-5rem)] bg-[#090a0c] text-[#f8fafc] flex flex-col font-sans overflow-hidden">

      {/* Slim 40px Circuit Top Bar — Eliminating Header Bloat */}
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

      {/* Main 3-Column Ergonomic Grid — Zero Waste Layout */}
      <main className="flex-1 p-2 sm:p-3 lg:grid lg:grid-cols-12 gap-3 lg:gap-4 overflow-y-auto lg:overflow-hidden min-h-0">

        {/* Column A: EXPO MARKETPLACE & VENDOR GALLERY (Desktop 3 Cols / Cards Visible Immediately!) */}
        <section
          className={`${isMapExpanded ? 'hidden' : ''
            } ${mobileSection === 'market' ? 'flex' : 'hidden lg:flex'
            } lg:col-span-3 flex-col gap-2 h-full min-h-[480px] lg:min-h-0`}
        >
          {/* Top Search & Filter Bar — 1 Single Inline Row (ONLY 36PX HIGH!) */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Instant Search Bar */}
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

            {/* Compact Filter Pills */}
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

            {/* Arbitrage Spotlight Toggle Button */}
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

          {/* Arbitrage Spotlight Overlay Drawer (ONLY shown when requested, never blocking cards by default!) */}
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

          {/* Catalog Header with Scroll Notice */}
          <div className="flex flex-col gap-1.5 bg-[#111418] px-3 py-2 border border-[#1e293b] rounded-lg shrink-0 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-white font-bold flex items-center gap-1.5 truncate">
                {selectedVendor?.type !== 'vendor' ? (
                  <span className="text-amber-400 flex items-center gap-1.5 truncate">
                    🎪 {selectedVendor?.name} (EXPERIENCE PAVILION)
                  </span>
                ) : (
                  <span className="truncate">📦 {selectedVendor?.name?.toUpperCase()} CATALOG ({filteredCards.length} CARDS)</span>
                )}
              </span>
              <span className="text-[#38bdf8] font-bold animate-pulse flex items-center gap-1 shrink-0 ml-2">
                📜 SCROLL DOWN ▾
              </span>
            </div>
            {selectedVendor?.type !== 'vendor' && (
              <div className="text-[10px] text-[#94a3b8] bg-black/50 p-2 rounded border border-amber-500/30 leading-tight">
                ⚡ <strong className="text-amber-300">Non-Vendor Convention Pavilion:</strong> Dedicated to live event experiences E.g. auctions, signings, or exhibits. Below is general convention floor inventory! Click any vendor booth on the map to view their 50+ card catalog.
              </div>
            )}
          </div>

          {/* MARKETPLACE CARDS GRID — 2 COLS, FULL CARD, SCROLLABLE */}
          <div
            style={{ overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }}
            className="grid grid-cols-2 gap-3 pb-6 pr-1"
          >
            {filteredCards.map((card, i) => (
              <div
                key={i}
                onClick={() => {
                  if (onInspectCard) {
                    onInspectCard({
                      id: card.id,
                      name: card.name,
                      currentPrice: card.price,
                      isSlabbed: true,
                      slabGrade: card.grade,
                      imageUrl: card.img,
                    });
                  }
                }}
                className="bg-[#111418] border border-[#1e293b] rounded-xl group hover:border-[#38bdf8] transition-all duration-300 flex flex-col cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] transform hover:-translate-y-0.5"
                data-card-container="true"
              >
                {/* Full card image — w-full h-auto guarantees no cropping */}
                <div className="w-full relative p-2 bg-black/40 rounded-t-xl">
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-auto block rounded-md filter drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                    onLoad={(e) => handleCardShowImageLoad(e, card.id, card.name.includes("Japanese") || card.id.includes("jp") || card.id.includes("_ja"))}
                    onError={(e) => handleCardShowImageError(e, card.id, card.name.includes("Japanese") || card.id.includes("jp") || card.id.includes("_ja"))}
                  />
                  {/* Grade badge — top left, outside card art area */}
                  <div className="absolute top-3 left-3 z-10">
                    <span className="bg-black/90 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-500/50 text-amber-300 font-bold shadow">
                      {card.grade}
                    </span>
                  </div>
                  {/* Check badge — top right */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="w-5 h-5 rounded border border-white/20 bg-black/80 flex items-center justify-center group-hover:border-[#38bdf8]">
                      <Check className="w-3 h-3 text-[#38bdf8]" />
                    </div>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="px-2.5 py-2 bg-[#0e1117] border-t border-white/10 rounded-b-xl">
                  <p className="text-xs font-bold text-white truncate group-hover:text-[#38bdf8] transition-colors mb-1">
                    {card.name}
                  </p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-mono font-black text-white">${card.price.toLocaleString()}</span>
                    <span className="text-green-400 font-bold text-[10px] font-mono">{card.change}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column B: LIVE INTERACTIVE FLOOR PLAN (Desktop 6 Cols / Enlarge Map!) */}
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
              {/* Zoom Out Button */}
              <button
                onClick={() => setMapZoom(Math.max(80, mapZoom - 20))}
                className="w-6 h-6 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-xs font-mono font-bold text-white flex items-center justify-center transition-all"
                title="Zoom Out"
              >
                -
              </button>
              {/* Zoom Level / Reset Button */}
              <button
                onClick={() => setMapZoom(130)}
                className="px-1.5 py-0.5 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-[10px] font-mono font-bold text-[#38bdf8] transition-all min-w-[40px] text-center"
                title="Reset Zoom to 130%"
              >
                {mapZoom}%
              </button>
              {/* Zoom In Button */}
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
                {/* Dark tech grid background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d1f3512_1px,transparent_1px),linear-gradient(to_bottom,#0d1f3512_1px,transparent_1px)] bg-[size:32px_32px]"></div>
                {/* Radial glow */}
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
                {/* Glow filters */}
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

              {/* ===== MAIN GRID LINES (Teal/Cyan) ===== */}
              {/* Horizontal grid lines */}
              <line x1="30" y1="60" x2="610" y2="60" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="30" y1="130" x2="610" y2="130" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="30" y1="200" x2="610" y2="200" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="30" y1="270" x2="610" y2="270" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="30" y1="340" x2="610" y2="340" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="30" y1="410" x2="610" y2="410" stroke="#0d3b5c" strokeWidth="0.5" />
              {/* Vertical grid lines */}
              <line x1="80" y1="30" x2="80" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="190" y1="30" x2="190" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="320" y1="30" x2="320" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="450" y1="30" x2="450" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />
              <line x1="560" y1="30" x2="560" y2="430" stroke="#0d3b5c" strokeWidth="0.5" />

              {/* ===== RANDOMIZED AUDIENCE FOOTPATH CORRIDORS ===== */}
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

              {/* ===== GLOWING INTERSECTION HUBS (FOOTPATH WAYPOINTS) ===== */}
              {footpathNetwork.hubs.map((h, idx) => (
                <g key={`hub_${idx}`}>
                  <circle cx={h.x} cy={h.y} r="11" fill={h.color} opacity="0.18" filter="url(#glowWhite)" />
                  <circle cx={h.x} cy={h.y} r="4.5" fill={h.color} opacity="0.95">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur={`${2 + (idx % 2)}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={h.x} cy={h.y} r="2" fill="#ffffff" opacity="0.8" />
                </g>
              ))}

              {/* ===== OUTER BOUNDARY ===== */}
              <rect x="30" y="30" width="580" height="400" rx="6" fill="none" stroke="#1e3a5f" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />

              {/* ===== ZONE 1: MAIN STAGE (top-left) ===== */}
              <rect x="40" y="40" width="140" height="80" rx="4" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "MAIN STAGE & AUCTION ARENA", rating: "5.0 / 5", activeListings: "125 Grails Live", completedTrans: "50,000+", booth: "Zone 1", specialties: ["Live Auctions", "Celebrity Signings", "Trophy Card Reveals"], discountScore: 95 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "MAIN STAGE & AUCTION ARENA", rating: "5.0 / 5", activeListings: "125 Grails Live", completedTrans: "50,000+", booth: "Zone 1", specialties: ["Live Auctions", "Celebrity Signings", "Trophy Card Reveals"], discountScore: 95 })}
              />
              <circle cx="55" cy="55" r="10" fill="#38bdf8" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="55" y="59" textAnchor="middle" fill="#38bdf8" fontSize="10" fontFamily="monospace" fontWeight="900">1</text>
              <text x="115" y="75" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Main Stage</text>
              <text x="115" y="88" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">LIVE AUCTION</text>
              <text x="115" y="110" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontFamily="monospace" fontWeight="bold">🔴 Trophy Charizard</text>

              {/* ===== ZONE 2: ARTIST ALLEY (left column, multiple) ===== */}
              <rect x="40" y="135" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "ARTIST ALLEY & SIGNINGS", rating: "5.0 / 5", activeListings: "450 Signed Prints", completedTrans: "9,200+", booth: "Zone 2", specialties: ["Mitsuhiro Arita Signings", "Custom Sketch Cards", "Original Art"], discountScore: 65 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "ARTIST ALLEY & SIGNINGS", rating: "5.0 / 5", activeListings: "450 Signed Prints", completedTrans: "9,200+", booth: "Zone 2", specialties: ["Mitsuhiro Arita Signings", "Custom Sketch Cards", "Original Art"], discountScore: 65 })}
              />
              <circle cx="55" cy="148" r="8" fill="#c084fc" fillOpacity="0.2" stroke="#c084fc" strokeWidth="1" />
              <text x="55" y="152" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold">2</text>
              <text x="90" y="168" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Artist Alley</text>
              <text x="90" y="180" textAnchor="middle" fill="#475569" fontSize="5.5" fontFamily="monospace">Signings</text>

              {/* Second Artist Alley zone (left) */}
              <rect x="40" y="205" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "ARTIST ALLEY B — SKETCH CARDS", rating: "4.8 / 5", activeListings: "320 Prints", completedTrans: "6,100+", booth: "Zone 2B", specialties: ["Sketch Cards", "Watercolors", "Fan Art Prints"], discountScore: 60 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "ARTIST ALLEY B — SKETCH CARDS", rating: "4.8 / 5", activeListings: "320 Prints", completedTrans: "6,100+", booth: "Zone 2B", specialties: ["Sketch Cards", "Watercolors", "Fan Art Prints"], discountScore: 60 })}
              />
              <circle cx="55" cy="218" r="8" fill="#c084fc" fillOpacity="0.15" stroke="#c084fc" strokeWidth="0.8" />
              <text x="55" y="222" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold">2</text>
              <text x="90" y="238" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Sketch Cards</text>

              {/* ===== ZONE 3: AUTOGRAPH PIT (top center) ===== */}
              <rect x="195" y="40" width="110" height="80" rx="4" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#2dd4bf] hover:fill-[#2dd4bf]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "AUTOGRAPH PIT", rating: "4.9 / 5", activeListings: "Celebrity Meet & Greet", completedTrans: "15,000+", booth: "Zone 3", specialties: ["Pro Player Signings", "Illustrator Autographs", "Photo Ops"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "AUTOGRAPH PIT", rating: "4.9 / 5", activeListings: "Celebrity Meet & Greet", completedTrans: "15,000+", booth: "Zone 3", specialties: ["Pro Player Signings", "Illustrator Autographs", "Photo Ops"], discountScore: 80 })}
              />
              <circle cx="210" cy="55" r="10" fill="#2dd4bf" fillOpacity="0.2" stroke="#2dd4bf" strokeWidth="1.5" />
              <text x="210" y="59" textAnchor="middle" fill="#2dd4bf" fontSize="10" fontFamily="monospace" fontWeight="900">3</text>
              <text x="250" y="80" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Autograph Pit</text>
              <text x="250" y="93" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">Illustrator</text>
              <text x="250" y="110" textAnchor="middle" fill="#2dd4bf" fontSize="5.5" fontFamily="monospace">Mitsuhiro Arita</text>

              {/* ===== ZONE 4: TOURNAMENT AREA (right of autograph) ===== */}
              <rect x="325" y="40" width="120" height="80" rx="4" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#fbbf24] hover:fill-[#fbbf24]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TOURNAMENT AREA A", rating: "5.0 / 5", activeListings: "64-Player Bracket", completedTrans: "3,200+", booth: "Zone 4", specialties: ["Standard Format", "Expanded", "Draft Pods"], discountScore: 70 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "TOURNAMENT AREA A", rating: "5.0 / 5", activeListings: "64-Player Bracket", completedTrans: "3,200+", booth: "Zone 4", specialties: ["Standard Format", "Expanded", "Draft Pods"], discountScore: 70 })}
              />
              <circle cx="340" cy="55" r="10" fill="#fbbf24" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="340" y="59" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="900">4</text>
              <text x="390" y="77" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Tournament A</text>
              <text x="390" y="93" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">64-Player Bracket</text>
              <text x="390" y="110" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontFamily="monospace">ROUND 3 LIVE</text>

              {/* Corner booth top-right */}
              <rect x="460" y="40" width="60" height="80" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "PALDEAN PALACE VENDORS", rating: "4.8 / 5", activeListings: "1,850+ Items", completedTrans: "9,200+", booth: "Zone 5 Desk", specialties: ["Paldean Fates SIRs", "Illustration Rares", "Gold Hyper Rares"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "PALDEAN PALACE VENDORS", rating: "4.8 / 5", activeListings: "1,850+ Items", completedTrans: "9,200+", booth: "Zone 5 Desk", specialties: ["Paldean Fates SIRs", "Illustration Rares", "Gold Hyper Rares"], discountScore: 80 })}
              />
              <text x="490" y="75" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">5</text>
              <text x="490" y="90" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">Paldean Palace</text>

              <rect x="530" y="40" width="70" height="80" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "NEO DESTINY SPECIALIST", rating: "4.9 / 5", activeListings: "1,420+ Items", completedTrans: "8,400+", booth: "Zone 8 Merch", specialties: ["Neo Destiny Shinings", "Neo Revelation Holos", "1st Edition Neo Classics"], discountScore: 82 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "NEO DESTINY SPECIALIST", rating: "4.9 / 5", activeListings: "1,420+ Items", completedTrans: "8,400+", booth: "Zone 8 Merch", specialties: ["Neo Destiny Shinings", "Neo Revelation Holos", "1st Edition Neo Classics"], discountScore: 82 })}
              />
              <text x="565" y="75" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">8</text>
              <text x="565" y="90" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">Neo Destiny</text>
              <text x="565" y="102" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">Specialist</text>

              {/* ===== ZONE 5: TCG VENDORS A-M (center) ===== */}
              <rect x="140" y="135" width="80" height="55" rx="3" fill="#0c1824" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TCG VENDORS (A-M)", rating: "4.7 / 5", activeListings: "8,500+ Items", completedTrans: "42,000+", booth: "Zone 5", specialties: ["Alpha Grails", "VintageVault", "Modern Grails Co."], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "TCG VENDORS (A-M)", rating: "4.7 / 5", activeListings: "8,500+ Items", completedTrans: "42,000+", booth: "Zone 5", specialties: ["Alpha Grails", "VintageVault", "Modern Grails Co."], discountScore: 75 })}
              />
              <circle cx="180" cy="162" r="12" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="180" y="166" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="900">5</text>
              <text x="155" y="182" textAnchor="middle" fill="#334155" fontSize="5" fontFamily="monospace">Classics</text>
              <text x="200" y="182" textAnchor="middle" fill="#334155" fontSize="5" fontFamily="monospace">Vintage</text>

              {/* Vendor sub-booths around zone 5 */}
              <rect x="230" y="135" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "ALPHA GRAILS", rating: "4.9 / 5", activeListings: "4,200+", completedTrans: "19,500+", booth: "5A", specialties: ["WOTC Sealed", "1st Ed Base", "Trophy Cards"], discountScore: 82 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "ALPHA GRAILS", rating: "4.9 / 5", activeListings: "4,200+", completedTrans: "19,500+", booth: "5A", specialties: ["WOTC Sealed", "1st Ed Base", "Trophy Cards"], discountScore: 82 })}
              />
              <text x="268" y="152" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Classics</text>

              <rect x="315" y="135" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#2dd4bf] hover:fill-[#2dd4bf]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "VINTAGEVAULT TCG", rating: "4.8 / 5", activeListings: "3,450+", completedTrans: "12,800+", booth: "5B", specialties: ["Japanese WOTC", "e-Series", "Neo Destiny"], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "VINTAGEVAULT TCG", rating: "4.8 / 5", activeListings: "3,450+", completedTrans: "12,800+", booth: "5B", specialties: ["Japanese WOTC", "e-Series", "Neo Destiny"], discountScore: 75 })}
              />
              <text x="352" y="152" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">VintageVault</text>
 
              {/* Row of named vendor booths */}
              <rect x="230" y="165" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "PALDEA ALT ART DEPOT", rating: "4.7 / 5", activeListings: "1,450+ Items", completedTrans: "7,100+", booth: "5C", specialties: ["Paldean Fates SIRs", "Illustration Rares", "Gold Hyper Rares"], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "PALDEA ALT ART DEPOT", rating: "4.7 / 5", activeListings: "1,450+ Items", completedTrans: "7,100+", booth: "5C", specialties: ["Paldean Fates SIRs", "Illustration Rares", "Gold Hyper Rares"], discountScore: 68 })}
              />
              <text x="268" y="182" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Paldea Depot</text>
 
              <rect x="315" y="165" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "PALDEAN PROMOS TCG BOOTH", rating: "4.8 / 5", activeListings: "2,100+ Items", completedTrans: "9,800+", booth: "5D", specialties: ["Crown Zenith GGs", "Scarlet & Violet Promos", "Modern Alt Arts"], discountScore: 74 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "PALDEAN PROMOS TCG BOOTH", rating: "4.8 / 5", activeListings: "2,100+ Items", completedTrans: "9,800+", booth: "5D", specialties: ["Crown Zenith GGs", "Scarlet & Violet Promos", "Modern Alt Arts"], discountScore: 74 })}
              />
              <text x="352" y="182" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Paldean Promos</text>

              {/* Zone 4 markers inside vendor area */}
              <circle cx="420" cy="155" r="10" fill="#fbbf24" fillOpacity="0.15" stroke="#fbbf24" strokeWidth="1" />
              <text x="420" y="159" textAnchor="middle" fill="#fbbf24" fontSize="9" fontFamily="monospace" fontWeight="bold">4</text>

              <circle cx="420" cy="180" r="10" fill="#2dd4bf" fillOpacity="0.15" stroke="#2dd4bf" strokeWidth="1" />
              <text x="420" y="184" textAnchor="middle" fill="#2dd4bf" fontSize="9" fontFamily="monospace" fontWeight="bold">5</text>

              {/* Right column booths */}
              <rect x="460" y="135" width="60" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SLAB CITY PSA ON-SITE", rating: "5.0 / 5", activeListings: "4,600+ Slabs", completedTrans: "31,000+", booth: "Zone 5E", specialties: ["PSA 10 Slabs", "BGS Black Labels", "CGC 10 Pristine"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "SLAB CITY PSA ON-SITE", rating: "5.0 / 5", activeListings: "4,600+ Slabs", completedTrans: "31,000+", booth: "Zone 5E", specialties: ["PSA 10 Slabs", "BGS Black Labels", "CGC 10 Pristine"], discountScore: 80 })}
              />
              <rect x="530" y="135" width="70" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "RETRO POKÉMON HQ", rating: "4.6 / 5", activeListings: "1,850+ Items", completedTrans: "8,200+", booth: "Zone X", specialties: ["Gym Challenge", "Fossil / Jungle 1st Ed", "Team Rocket Boxes"], discountScore: 72 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "RETRO POKÉMON HQ", rating: "4.6 / 5", activeListings: "1,850+ Items", completedTrans: "8,200+", booth: "Zone X", specialties: ["Gym Challenge", "Fossil / Jungle 1st Ed", "Team Rocket Boxes"], discountScore: 72 })}
              />
              <text x="565" y="158" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">X</text>

              {/* ===== CENTER ROW: ZONES 6 & 7 ===== */}
              <rect x="140" y="205" width="80" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#fb923c] hover:fill-[#fb923c]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TCG VENDORS (N-Z)", rating: "4.6 / 5", activeListings: "6,200+ Items", completedTrans: "28,000+", booth: "Zone 6", specialties: ["Sealed Kings", "Slab City PSA", "Energy Supply Co."], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "TCG VENDORS (N-Z)", rating: "4.6 / 5", activeListings: "6,200+ Items", completedTrans: "28,000+", booth: "Zone 6", specialties: ["Sealed Kings", "Slab City PSA", "Energy Supply Co."], discountScore: 68 })}
              />
              <text x="180" y="228" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">0</text>
              <text x="180" y="250" textAnchor="middle" fill="#334155" fontSize="5" fontFamily="monospace">Sealed</text>

              {/* Sub-vendor booths center */}
              <rect x="230" y="205" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#34d399] hover:fill-[#34d399]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SPECIALS ZONE TRADING", rating: "4.9 / 5", activeListings: "950+ Items", completedTrans: "5,400+", booth: "6A", specialties: ["Mario & Luigi Pikachu", "Poncho Pikachu", "Special Delivery Charizard"], discountScore: 78 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "SPECIALS ZONE TRADING", rating: "4.9 / 5", activeListings: "950+ Items", completedTrans: "5,400+", booth: "6A", specialties: ["Mario & Luigi Pikachu", "Poncho Pikachu", "Special Delivery Charizard"], discountScore: 78 })}
              />
              <text x="268" y="222" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Specials</text>

              <rect x="315" y="205" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "GOLD STAR COLLECTORS", rating: "4.8 / 5", activeListings: "1,120+ Items", completedTrans: "6,900+", booth: "6B", specialties: ["Gold Star Espeon", "Shining Charizard", "Crystal Lugia"], discountScore: 76 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "GOLD STAR COLLECTORS", rating: "4.8 / 5", activeListings: "1,120+ Items", completedTrans: "6,900+", booth: "6B", specialties: ["Gold Star Espeon", "Shining Charizard", "Crystal Lugia"], discountScore: 76 })}
              />

              <rect x="230" y="235" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#22d3ee] hover:fill-[#22d3ee]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SEALED PRODUCT KINGDOM", rating: "4.7 / 5", activeListings: "3,100+ Boxes", completedTrans: "14,200+", booth: "6C", specialties: ["Evolving Skies Booster Boxes", "Team Up Sealed", "Vintage Packs"], discountScore: 70 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "SEALED PRODUCT KINGDOM", rating: "4.7 / 5", activeListings: "3,100+ Boxes", completedTrans: "14,200+", booth: "6C", specialties: ["Evolving Skies Booster Boxes", "Team Up Sealed", "Vintage Packs"], discountScore: 70 })}
              />
              <text x="268" y="252" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Sealed</text>

              {/* Zone 0 markers */}
              <circle cx="352" cy="245" r="12" fill="#38bdf8" fillOpacity="0.12" stroke="#38bdf8" strokeWidth="1" />
              <text x="352" y="249" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="900">0</text>

              {/* Right side */}
              <text x="420" y="230" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">16</text>
              <text x="490" y="230" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">46</text>
              <rect x="460" y="205" width="60" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "MODERN ALT ART VAULT", rating: "4.9 / 5", activeListings: "2,400+ Singles", completedTrans: "11,500+", booth: "Booth 16", specialties: ["Giratina V Alt", "Moonbreon", "Rayquaza VMAX Alt"], discountScore: 82 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "MODERN ALT ART VAULT", rating: "4.9 / 5", activeListings: "2,400+ Singles", completedTrans: "11,500+", booth: "Booth 16", specialties: ["Giratina V Alt", "Moonbreon", "Rayquaza VMAX Alt"], discountScore: 82 })}
              />
              <rect x="530" y="205" width="70" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "JAPANESE HIGH CLASS HUB", rating: "4.8 / 5", activeListings: "3,800+ Items", completedTrans: "18,400+", booth: "Booth 46", specialties: ["Shiny Treasure EX", "VSTAR Universe", "Terastal Festival EX"], discountScore: 78 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "JAPANESE HIGH CLASS HUB", rating: "4.8 / 5", activeListings: "3,800+ Items", completedTrans: "18,400+", booth: "Booth 46", specialties: ["Shiny Treasure EX", "VSTAR Universe", "Terastal Festival EX"], discountScore: 78 })}
              />

              {/* ===== ZONE 7-8: DOVAKINJI & BOTTOM VENDORS ===== */}
              <rect x="40" y="275" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "DISPLAY & CASES GALLERY", rating: "5.0 / 5", activeListings: "Acrylic Cases & Stands", completedTrans: "6,500+", booth: "Zone 7 Display", specialties: ["UV Protection Booster Box Cases", "Custom Slab Frames", "LED Displays"], discountScore: 65 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "DISPLAY & CASES GALLERY", rating: "5.0 / 5", activeListings: "Acrylic Cases & Stands", completedTrans: "6,500+", booth: "Zone 7 Display", specialties: ["UV Protection Booster Box Cases", "Custom Slab Frames", "LED Displays"], discountScore: 65 })}
              />
              <text x="82" y="302" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">Display</text>

              {/* Vendor sub-booths bottom */}
              <rect x="140" y="275" width="80" height="55" rx="3" fill="#0c1824" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SEALED PRODUCT ZONE 7", rating: "4.8 / 5", activeListings: "4,100+ Boxes", completedTrans: "21,000+", booth: "Zone 7", specialties: ["WOTC Booster Packs", "EX Era Boxes", "Sun & Moon Booster Boxes"], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "SEALED PRODUCT ZONE 7", rating: "4.8 / 5", activeListings: "4,100+ Boxes", completedTrans: "21,000+", booth: "Zone 7", specialties: ["WOTC Booster Packs", "EX Era Boxes", "Sun & Moon Booster Boxes"], discountScore: 75 })}
              />
              <circle cx="180" cy="302" r="12" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="180" y="306" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="900">6</text>

              <rect x="230" y="275" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#fbbf24] hover:fill-[#fbbf24]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "FILMERA GRADED CARDS", rating: "4.7 / 5", activeListings: "1,600+ Slabs", completedTrans: "8,900+", booth: "7A Filmera", specialties: ["PSA 9 & 10 Vintage", "Japanese Promos", "PSA Submission Service"], discountScore: 70 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "FILMERA GRADED CARDS", rating: "4.7 / 5", activeListings: "1,600+ Slabs", completedTrans: "8,900+", booth: "7A Filmera", specialties: ["PSA 9 & 10 Vintage", "Japanese Promos", "PSA Submission Service"], discountScore: 70 })}
              />
              <text x="250" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Filmera</text>
              <text x="290" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">DH</text>

              <rect x="315" y="275" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "CARBANDA VINTAGE TCG", rating: "4.9 / 5", activeListings: "2,200+ Cards", completedTrans: "12,100+", booth: "7B Carbanda", specialties: ["Shadowless Holos", "Skyridge Crystal Types", "Aquapolis Holos"], discountScore: 84 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "CARBANDA VINTAGE TCG", rating: "4.9 / 5", activeListings: "2,200+ Cards", completedTrans: "12,100+", booth: "7B Carbanda", specialties: ["Shadowless Holos", "Skyridge Crystal Types", "Aquapolis Holos"], discountScore: 84 })}
              />
              <text x="335" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Carbanda</text>
              <text x="375" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Brodes</text>

              {/* Zone 3 bottom */}
              <rect x="230" y="305" width="160" height="30" rx="3" fill="#0c1824" stroke="#f472b6" strokeWidth="1" strokeOpacity="0.5"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TRADING TABLES ZONE 8", rating: "5.0 / 5", activeListings: "Open Trading & Barter", completedTrans: "10,000+ Trades Today", booth: "Zone 8", specialties: ["Collector Meetups", "Open Binder Trading", "Community Appraisal"], discountScore: 90 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "TRADING TABLES ZONE 8", rating: "5.0 / 5", activeListings: "Open Trading & Barter", completedTrans: "10,000+ Trades Today", booth: "Zone 8", specialties: ["Collector Meetups", "Open Binder Trading", "Community Appraisal"], discountScore: 90 })}
              />
              <circle cx="248" cy="320" r="10" fill="#f472b6" fillOpacity="0.2" stroke="#f472b6" strokeWidth="1.5" />
              <text x="248" y="324" textAnchor="middle" fill="#f472b6" fontSize="9" fontFamily="monospace" fontWeight="bold">3</text>

              <text x="420" y="305" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace" fontWeight="bold">15</text>
              <rect x="400" y="275" width="60" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "BRODES TCG SYNDICATE", rating: "4.8 / 5", activeListings: "1,900+ Items", completedTrans: "9,300+", booth: "Booth 15", specialties: ["Japanese S&V Master Sets", "Promo Cards", "High Grade Slabs"], discountScore: 76 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "BRODES TCG SYNDICATE", rating: "4.8 / 5", activeListings: "1,900+ Items", completedTrans: "9,300+", booth: "Booth 15", specialties: ["Japanese S&V Master Sets", "Promo Cards", "High Grade Slabs"], discountScore: 76 })}
              />

              {/* ===== BOTTOM ROW ===== */}
              <rect x="40" y="350" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "VINTAGE ACCESSORIES & BINDERS", rating: "4.9 / 5", activeListings: "500+ Binders & Sleeves", completedTrans: "11,000+", booth: "Booth A1", specialties: ["Toploaders & Semi-Rigids", "Custom Leather Binders", "Penny Sleeves Bulk"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "VINTAGE ACCESSORIES & BINDERS", rating: "4.9 / 5", activeListings: "500+ Binders & Sleeves", completedTrans: "11,000+", booth: "Booth A1", specialties: ["Toploaders & Semi-Rigids", "Custom Leather Binders", "Penny Sleeves Bulk"], discountScore: 80 })}
              />

              <rect x="140" y="350" width="80" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TRADING TABLES ZONE 8 (EAST)", rating: "5.0 / 5", activeListings: "Open Tables A-F", completedTrans: "8,500+", booth: "Zone 8 East", specialties: ["Modern Trade Pods", "Quick Cash Offers", "Single Card Swaps"], discountScore: 85 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "TRADING TABLES ZONE 8 (EAST)", rating: "5.0 / 5", activeListings: "Open Tables A-F", completedTrans: "8,500+", booth: "Zone 8 East", specialties: ["Modern Trade Pods", "Quick Cash Offers", "Single Card Swaps"], discountScore: 85 })}
              />
              <circle cx="180" cy="377" r="12" fill="#f472b6" fillOpacity="0.15" stroke="#f472b6" strokeWidth="1.5" />
              <text x="180" y="381" textAnchor="middle" fill="#f472b6" fontSize="11" fontFamily="monospace" fontWeight="900">8</text>

              {/* Bottom vendor name labels */}
              <rect x="230" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "WIKRATS POKÉMON EMPORIUM", rating: "4.7 / 5", activeListings: "1,350+ Items", completedTrans: "6,400+", booth: "Booth 8A", specialties: ["WOTC Holos", "EX Era Delta Species", "Level X Cards"], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "WIKRATS POKÉMON EMPORIUM", rating: "4.7 / 5", activeListings: "1,350+ Items", completedTrans: "6,400+", booth: "Booth 8A", specialties: ["WOTC Holos", "EX Era Delta Species", "Level X Cards"], discountScore: 68 })}
              />
              <text x="257" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Wikrats</text>

              <rect x="295" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "UDS COLLECTIBLES & SLABS", rating: "4.8 / 5", activeListings: "2,100+ Slabs", completedTrans: "11,800+", booth: "Booth 8B", specialties: ["PSA 10 Modern Grails", "Sun & Moon Alt Arts", "Tag Team Promos"], discountScore: 74 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "UDS COLLECTIBLES & SLABS", rating: "4.8 / 5", activeListings: "2,100+ Slabs", completedTrans: "11,800+", booth: "Booth 8B", specialties: ["PSA 10 Modern Grails", "Sun & Moon Alt Arts", "Tag Team Promos"], discountScore: 74 })}
              />
              <text x="322" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">UDS</text>

              <rect x="360" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SPECS GRADED GRAILS", rating: "4.9 / 5", activeListings: "3,100+ Items", completedTrans: "16,200+", booth: "Booth 8C", specialties: ["BGS 10 Gold Labels", "1st Ed Neo Destiny", "Trophy Kangaskhan"], discountScore: 82 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "SPECS GRADED GRAILS", rating: "4.9 / 5", activeListings: "3,100+ Items", completedTrans: "16,200+", booth: "Booth 8C", specialties: ["BGS 10 Gold Labels", "1st Ed Neo Destiny", "Trophy Kangaskhan"], discountScore: 82 })}
              />
              <text x="387" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Specs</text>

              {/* DOVAKINJI VIP (bottom right, highlighted) */}
              <rect x="425" y="350" width="85" height="55" rx="4" fill="#f472b6" fillOpacity="0.08" stroke="#f472b6" strokeWidth="1.5"
                className="cursor-pointer hover:fill-opacity-[0.25] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "DOVAKINJI COLLECTIBLES", rating: "4.9 / 5", activeListings: "1,890+ Items", completedTrans: "8,400+", booth: "VIP 10", specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"], discountScore: 88 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => handleBoothSelect({ name: "DOVAKINJI COLLECTIBLES", rating: "4.9 / 5", activeListings: "1,890+ Items", completedTrans: "8,400+", booth: "VIP 10", specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"], discountScore: 88 })}
              />
              <text x="467" y="375" textAnchor="middle" fill="#f472b6" fontSize="6" fontFamily="monospace" fontWeight="bold">Dovakinji</text>
              <text x="467" y="395" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">10</text>

              {/* Zone 10 label at bottom center */}
              <circle cx="320" cy="418" r="10" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1" />
              <text x="320" y="422" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">10</text>

              {/* ===== RANDOMIZED AUDIENCE FOOTPATH TRAFFIC & STALL SWARMS ===== */}
              {/* 1. Static Cluster Dots outside booths (huge glowing swarms around hot stalls) */}
              {staticClusterDots.map(d => (
                <circle
                  key={d.id}
                  cx={d.cx} cy={d.cy} r={d.r}
                  fill={d.color} opacity={d.opacity}
                  filter={d.r > 2.2 ? "url(#glowWhite)" : undefined}
                >
                  <animate attributeName="opacity" values={`${d.opacity * 0.4};${Math.min(1, d.opacity * 1.5)};${d.opacity * 0.4}`} dur={`${d.dur}s`} repeatCount="indefinite" />
                </circle>
              ))}

              {/* 2. Animated Audience Walking Dots traveling back and forth along the corridors */}
              {animatedAudienceDots.map(d => (
                <g key={d.id}>
                  <circle r={d.r} fill={d.color} opacity="0.85" filter={d.r > 2 ? "url(#glowWhite)" : undefined}>
                    <animate attributeName="cx" values={`${d.x1};${d.x2};${d.x1}`} dur={`${d.dur}s`} begin={`${d.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="cy" values={`${d.y1};${d.y2};${d.y1}`} dur={`${d.dur}s`} begin={`${d.delay}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.3;1;0.3" dur={`${d.dur * 0.5}s`} begin={`${d.delay}s`} repeatCount="indefinite" />
                  </circle>
                </g>
              ))}
            </svg>
            </div>
            </div>
          </div>
        </section>

        {/* Column C: EVENT INTELLIGENCE & SELECTED VENDOR PROFILE (Desktop 3 Cols — Compact Top Ticker, Full Profile Room!) */}
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

          {/* Selected Vendor / Pavilion Spotlight Card */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-1.5 px-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-mono">
                {selectedVendor?.type !== 'vendor' ? 'CONVENTION EXPERIENCE SPOTLIGHT' : 'SELECTED VENDOR SPOTLIGHT'}
              </h2>
            </div>

            <div className={`bg-gradient-to-b ${selectedVendor?.type !== 'vendor' ? 'from-[#1a1423] to-[#0f0d14] border-purple-500/50 shadow-[0_0_25px_rgba(192,132,252,0.15)]' : 'from-[#111418] to-[#0d1015] border-[#38bdf8]/40 shadow-[0_0_25px_rgba(56,189,248,0.12)]'} border rounded-2xl p-3.5 flex flex-col gap-3 flex-1`}>
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono font-bold">
                  {selectedVendor?.type !== 'vendor' ? 'Active Pavilion Details:' : 'Active Vendor Profile:'}
                </span>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {selectedVendor?.name}
                  </h3>
                  <span className={`px-2 py-0.5 ${selectedVendor?.type !== 'vendor' ? 'bg-purple-500/20 text-purple-300 border-purple-500/50' : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50'} text-[8px] font-black uppercase rounded-full border flex items-center gap-1 shadow-sm`}>
                    {selectedVendor?.type !== 'vendor' ? 'Live Pavilion ⚡' : 'Premier Vendor'} <Check className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              {selectedVendor?.type !== 'vendor' ? (
                /* NON-VENDOR EXPERIENCE PAVILION PANEL */
                <div className="flex flex-col gap-3 flex-1">
                  <div className="grid grid-cols-2 gap-2 text-xs bg-black/60 p-2.5 rounded-xl border border-purple-500/20 font-mono">
                    <div className="flex flex-col">
                      <span className="text-[8px] text-[#94a3b8] uppercase">Current Status</span>
                      <span className="font-black text-emerald-400 text-xs sm:text-sm">🟢 Open & Active</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] text-[#94a3b8] uppercase">Live Participants</span>
                      <span className="font-black text-white text-xs sm:text-sm">{selectedVendor?.completedTrans || "240+ Present"}</span>
                    </div>
                    <div className="col-span-2 pt-1.5 border-t border-white/5 flex justify-between items-center text-[11px]">
                      <span className="text-[#94a3b8]">Pavilion Category:</span>
                      <span className="font-black text-purple-300 uppercase">{selectedVendor?.type}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-[9px] text-purple-300 uppercase tracking-widest font-mono border-b border-purple-500/30 pb-1 font-bold">
                      Pavilion Highlights & Schedule
                    </h4>
                    <ul className="text-[11px] text-white/90 list-disc list-inside flex flex-col gap-1 leading-relaxed font-mono bg-black/40 p-2 rounded-lg border border-white/5">
                      {(selectedVendor?.specialties || ["Live Event Schedule", "Celebrity Meet & Greet", "Open Queue Station"]).map((spec: string, idx: number) => (
                        <li key={idx} className="truncate text-purple-200">{spec}</li>
                      ))}
                      <li className="text-amber-300 font-bold truncate">⚡ Next Slot starting in ~15 mins!</li>
                    </ul>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-auto pt-2 border-t border-purple-500/30">
                    <button
                      onClick={() => {
                        if (window.innerWidth < 1024) setMobileSection('market');
                      }}
                      className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-[11px] font-bold py-2 px-2 rounded-xl transition-all text-center truncate border border-purple-500/40 font-mono"
                    >
                      [Browse Floor Cards ({filteredCards.length})]
                    </button>
                    <button
                      onClick={() => alert(`Checked into virtual queue for ${selectedVendor?.name}!`)}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-[11px] font-black py-2 px-2 rounded-xl transition-all text-center flex items-center justify-center gap-1 shadow-[0_0_15px_rgba(192,132,252,0.4)]"
                    >
                      [Check In / Queue] <Zap className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              ) : (
                /* VENDOR PROFILE PANEL */
                <>
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

                  {/* Dedicated Known For / Specialties Block */}
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
                          key={i}
                          onClick={() => {
                            if (onInspectCard) {
                              onInspectCard({
                                id: item.id || `grail-${i}`,
                                name: item.name,
                                currentPrice: typeof item.price === 'number' ? item.price : parseFloat(String(item.price).replace('k', '')) * 1000,
                                isSlabbed: true,
                                slabGrade: item.grade,
                                imageUrl: item.img
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
                </>
              )}
            </div>
          </div>
        </section>
      </main>

    </div>
  );
};

export default CardShowView;
