import React, { useState } from "react";
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

  const [selectedVendor, setSelectedVendor] = useState({
    name: "VINTAGEVAULT TCG",
    rating: "4.8 / 5",
    activeListings: "3,450+ Items",
    completedTrans: "12,800+",
    booth: "Booth 104",
    specialties: ["WOTC Japanese (Kanji)", "e-Series (JPN)", "Neo Destiny"],
    discountScore: 75,
  });

  const [hoveredBooth, setHoveredBooth] = useState<any>(null);

  const handleBoothHover = (vendorObj: any) => {
    setSelectedVendor(vendorObj);
    setHoveredBooth(vendorObj);
  };

  const handleBoothLeave = () => {
    setHoveredBooth(null);
  };

  const marketplaceCards = [
    { name: "Charizard Base Set Holo", grade: "PSA 10", price: 12450.0, change: "+3.4%", id: "base1-4", img: "https://images.scrydex.com/pokemon/base1-4/large" },
    { name: "Pikachu Illustrator Promo", grade: "BGS 9.5", price: 85000.0, change: "+12.1%", id: "promo-1", img: "https://images.scrydex.com/pokemon/xy12-35/large" },
    { name: "Lugia 1st Edition Neo Genesis", grade: "PSA 10", price: 18200.0, change: "+1.8%", id: "neo1-9", img: "https://images.scrydex.com/pokemon/neo1-9/large" },
    { name: "Umbreon VMAX Alt Art (Moonbreon)", grade: "PSA 10", price: 1420.0, change: "+5.6%", id: "evs-215", img: "https://images.scrydex.com/pokemon/swsh7-215/large" },
    { name: "Rayquaza Gold Star Holo", grade: "CGC 9.5", price: 9800.0, change: "-0.8%", id: "ex8-107", img: "https://images.scrydex.com/pokemon/ex8-107/large" },
    { name: "Mewtwo EX Full Art Secret Rare", grade: "PSA 10", price: 2150.0, change: "+2.3%", id: "xy8-164", img: "https://images.scrydex.com/pokemon/xy8-164/large" },
    { name: "Gengar & Mimikyu GX Alt Art", grade: "PSA 10", price: 890.0, change: "+8.9%", id: "sm9-165", img: "https://images.scrydex.com/pokemon/sm9-165/large" },
    { name: "Blastoise 1st Edition Shadowless", grade: "PSA 9", price: 7400.0, change: "+0.5%", id: "base1-2", img: "https://images.scrydex.com/pokemon/base1-2/large" },
    { name: "Giratina V Alt Art Lost Origin", grade: "PSA 10", price: 650.0, change: "+4.1%", id: "lor-186", img: "https://images.scrydex.com/pokemon/swsh11-186/large" },
    { name: "Shining Charizard Neo Destiny", grade: "PSA 9", price: 3800.0, change: "+1.2%", id: "neo4-107", img: "https://images.scrydex.com/pokemon/neo4-107/large" },
    { name: "Poncho-wearing Pikachu (Charizard)", grade: "PSA 10", price: 4600.0, change: "+9.4%", id: "xy-p-203", img: "https://images.scrydex.com/pokemon/xy12-35/large" },
    { name: "Lillie Full Art Ultra Prism", grade: "PSA 10", price: 3200.0, change: "+6.7%", id: "ulp-151", img: "https://images.scrydex.com/pokemon/sm5-151/large" },
  ];

  const filteredCards = marketplaceCards.filter((c) => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedFilter === "PSA 10") return matchesSearch && c.grade === "PSA 10";
    if (selectedFilter === "BGS/CGC") return matchesSearch && (c.grade.includes("BGS") || c.grade.includes("CGC"));
    if (selectedFilter === "WOTC / Vintage") return matchesSearch && (c.name.includes("Base") || c.name.includes("Neo") || c.name.includes("1st"));
    if (selectedFilter === "Modern Alt") return matchesSearch && (c.name.includes("Alt") || c.name.includes("VMAX") || c.name.includes("GX"));
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
              {["All", "PSA 10", "BGS/CGC", "WOTC / Vintage", "Modern Alt"].map((filter) => (
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
          <div className="flex items-center justify-between bg-[#111418] px-3 py-1.5 border border-[#1e293b] rounded-lg shrink-0 text-[11px] font-mono">
            <span className="text-white font-bold flex items-center gap-1.5">
              📦 EXPO CATALOG ({filteredCards.length} CARDS)
            </span>
            <span className="text-[#38bdf8] font-bold animate-pulse flex items-center gap-1">
              📜 SCROLL DOWN FOR MORE ▾
            </span>
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
              >
                {/* Full card image — w-full h-auto guarantees no cropping */}
                <div className="w-full relative p-2 bg-black/40 rounded-t-xl">
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-auto block rounded-md filter drop-shadow-xl transition-transform duration-300 group-hover:scale-[1.02]"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
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
            {/* Floating Cyberpunk HUD Tooltip when hovering over any booth */}
            {hoveredBooth && (
              <div className="absolute top-3 left-3 right-3 z-30 bg-[#0c1420]/95 border border-[#38bdf8] px-4 py-2.5 rounded-xl shadow-[0_0_20px_rgba(56,189,248,0.25)] backdrop-blur-md flex items-center justify-between pointer-events-none transition-all animate-in fade-in duration-150">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded bg-[#38bdf8]/20 border border-[#38bdf8]/40 text-xs font-mono font-black text-[#38bdf8]">
                    {hoveredBooth.booth}
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-white font-mono tracking-wide uppercase">
                      {hoveredBooth.name}
                    </h4>
                    <p className="text-[11px] text-[#94a3b8] font-mono">
                      {hoveredBooth.specialties?.join(' • ')}
                    </p>
                  </div>
                </div>
                <div className="text-right hidden sm:block">
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

              {/* ===== GLOWING DATA TRAILS (Pink/Magenta path) ===== */}
              <path d="M 135 60 L 135 200 L 320 200 L 320 340 L 505 340" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity="0.4" strokeDasharray="6,4" />
              <path d="M 505 60 L 505 200 L 320 200" stroke="#f472b6" strokeWidth="1.5" fill="none" opacity="0.3" strokeDasharray="6,4" />
              {/* Cyan data trail */}
              <path d="M 320 30 L 320 430" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.25" strokeDasharray="8,6" />
              <path d="M 30 200 L 610 200" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.2" strokeDasharray="8,6" />

              {/* ===== GLOWING INTERSECTION NODES ===== */}
              {/* Large white glow node (Main Stage intersection) */}
              <circle cx="135" cy="200" r="12" fill="white" opacity="0.15" filter="url(#glowWhite)" />
              <circle cx="135" cy="200" r="5" fill="white" opacity="0.9" filter="url(#glowWhite)">
                <animate attributeName="opacity" values="0.6;1;0.6" dur="2s" repeatCount="indefinite" />
              </circle>
              {/* Large cyan glow node (right side) */}
              <circle cx="505" cy="130" r="10" fill="#38bdf8" opacity="0.2" filter="url(#glowCyan)" />
              <circle cx="505" cy="130" r="4" fill="#38bdf8" opacity="0.9" filter="url(#glowCyan)">
                <animate attributeName="opacity" values="0.5;1;0.5" dur="2.5s" repeatCount="indefinite" />
              </circle>
              {/* Center glow node */}
              <circle cx="320" cy="200" r="10" fill="white" opacity="0.12" filter="url(#glowWhite)" />
              <circle cx="320" cy="200" r="4" fill="white" opacity="0.8">
                <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* ===== OUTER BOUNDARY ===== */}
              <rect x="30" y="30" width="580" height="400" rx="6" fill="none" stroke="#1e3a5f" strokeWidth="1.5" style={{ pointerEvents: 'none' }} />

              {/* ===== ZONE 1: MAIN STAGE (top-left) ===== */}
              <rect x="40" y="40" width="140" height="80" rx="4" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "MAIN STAGE & AUCTION ARENA", rating: "5.0 / 5", activeListings: "125 Grails Live", completedTrans: "50,000+", booth: "Zone 1", specialties: ["Live Auctions", "Celebrity Signings", "Trophy Card Reveals"], discountScore: 95 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "MAIN STAGE & AUCTION ARENA", rating: "5.0 / 5", activeListings: "125 Grails Live", completedTrans: "50,000+", booth: "Zone 1", specialties: ["Live Auctions", "Celebrity Signings", "Trophy Card Reveals"], discountScore: 95 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
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
                onClick={() => { setSelectedVendor({ name: "ARTIST ALLEY & SIGNINGS", rating: "5.0 / 5", activeListings: "450 Signed Prints", completedTrans: "9,200+", booth: "Zone 2", specialties: ["Mitsuhiro Arita Signings", "Custom Sketch Cards", "Original Art"], discountScore: 65 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
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
                onClick={() => { setSelectedVendor({ name: "ARTIST ALLEY B — SKETCH CARDS", rating: "4.8 / 5", activeListings: "320 Prints", completedTrans: "6,100+", booth: "Zone 2B", specialties: ["Sketch Cards", "Watercolors", "Fan Art Prints"], discountScore: 60 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <circle cx="55" cy="218" r="8" fill="#c084fc" fillOpacity="0.15" stroke="#c084fc" strokeWidth="0.8" />
              <text x="55" y="222" textAnchor="middle" fill="#c084fc" fontSize="8" fontFamily="monospace" fontWeight="bold">2</text>
              <text x="90" y="238" textAnchor="middle" fill="#64748b" fontSize="6" fontFamily="monospace">Sketch Cards</text>

              {/* ===== ZONE 3: AUTOGRAPH PIT (top center) ===== */}
              <rect x="195" y="40" width="110" height="80" rx="4" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#2dd4bf] hover:fill-[#2dd4bf]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "AUTOGRAPH PIT", rating: "4.9 / 5", activeListings: "Celebrity Meet & Greet", completedTrans: "15,000+", booth: "Zone 3", specialties: ["Pro Player Signings", "Illustrator Autographs", "Photo Ops"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "AUTOGRAPH PIT", rating: "4.9 / 5", activeListings: "Celebrity Meet & Greet", completedTrans: "15,000+", booth: "Zone 3", specialties: ["Pro Player Signings", "Illustrator Autographs", "Photo Ops"], discountScore: 80 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
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
                onClick={() => { setSelectedVendor({ name: "TOURNAMENT AREA A", rating: "5.0 / 5", activeListings: "64-Player Bracket", completedTrans: "3,200+", booth: "Zone 4", specialties: ["Standard Format", "Expanded", "Draft Pods"], discountScore: 70 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <circle cx="340" cy="55" r="10" fill="#fbbf24" fillOpacity="0.2" stroke="#fbbf24" strokeWidth="1.5" />
              <text x="340" y="59" textAnchor="middle" fill="#fbbf24" fontSize="10" fontFamily="monospace" fontWeight="900">4</text>
              <text x="390" y="77" textAnchor="middle" fill="#64748b" fontSize="7" fontFamily="monospace">Tournament A</text>
              <text x="390" y="93" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">64-Player Bracket</text>
              <text x="390" y="110" textAnchor="middle" fill="#fbbf24" fontSize="5.5" fontFamily="monospace">ROUND 3 LIVE</text>

              {/* Corner booth top-right */}
              <rect x="460" y="40" width="60" height="80" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "INFO & CONVENTION HELP DESK", rating: "5.0 / 5", activeListings: "Event Guide", completedTrans: "10,000+", booth: "Zone 5 Desk", specialties: ["Map Assistance", "Lost & Found", "Event Schedules"], discountScore: 90 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "INFO & CONVENTION HELP DESK", rating: "5.0 / 5", activeListings: "Event Guide", completedTrans: "10,000+", booth: "Zone 5 Desk", specialties: ["Map Assistance", "Lost & Found", "Event Schedules"], discountScore: 90 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="490" y="75" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">5</text>
              <text x="490" y="90" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">Info Desk</text>

              <rect x="530" y="40" width="70" height="80" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.12] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "OFFICIAL MERCHANDISE STORE", rating: "4.9 / 5", activeListings: "1,200 Merch Items", completedTrans: "25,000+", booth: "Zone 8 Merch", specialties: ["Convention Hoodies", "Playmats", "Limited Pins"], discountScore: 85 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "OFFICIAL MERCHANDISE STORE", rating: "4.9 / 5", activeListings: "1,200 Merch Items", completedTrans: "25,000+", booth: "Zone 8 Merch", specialties: ["Convention Hoodies", "Playmats", "Limited Pins"], discountScore: 85 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="565" y="75" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">8</text>
              <text x="565" y="90" textAnchor="middle" fill="#334155" fontSize="5.5" fontFamily="monospace">Merch</text>

              {/* ===== ZONE 5: TCG VENDORS A-M (center) ===== */}
              <rect x="140" y="135" width="80" height="55" rx="3" fill="#0c1824" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TCG VENDORS (A-M)", rating: "4.7 / 5", activeListings: "8,500+ Items", completedTrans: "42,000+", booth: "Zone 5", specialties: ["Alpha Grails", "VintageVault", "Modern Grails Co."], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "TCG VENDORS (A-M)", rating: "4.7 / 5", activeListings: "8,500+ Items", completedTrans: "42,000+", booth: "Zone 5", specialties: ["Alpha Grails", "VintageVault", "Modern Grails Co."], discountScore: 75 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
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
                onClick={() => { setSelectedVendor({ name: "ALPHA GRAILS", rating: "4.9 / 5", activeListings: "4,200+", completedTrans: "19,500+", booth: "5A", specialties: ["WOTC Sealed", "1st Ed Base", "Trophy Cards"], discountScore: 82 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="268" y="152" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Classics</text>

              <rect x="315" y="135" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#2dd4bf] hover:fill-[#2dd4bf]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "VINTAGEVAULT TCG", rating: "4.8 / 5", activeListings: "3,450+", completedTrans: "12,800+", booth: "5B", specialties: ["Japanese WOTC", "e-Series", "Neo Destiny"], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "VINTAGEVAULT TCG", rating: "4.8 / 5", activeListings: "3,450+", completedTrans: "12,800+", booth: "5B", specialties: ["Japanese WOTC", "e-Series", "Neo Destiny"], discountScore: 75 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="352" y="152" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Autograph Pit</text>

              {/* Row of named vendor booths */}
              <rect x="230" y="165" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "DIGIMONCRAFT COLLECTIBLES", rating: "4.7 / 5", activeListings: "1,450+ Items", completedTrans: "7,100+", booth: "5C", specialties: ["Digimon TCG", "Ghost Rares", "Alt Art Promos"], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "DIGIMONCRAFT COLLECTIBLES", rating: "4.7 / 5", activeListings: "1,450+ Items", completedTrans: "7,100+", booth: "5C", specialties: ["Digimon TCG", "Ghost Rares", "Alt Art Promos"], discountScore: 68 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="268" y="182" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">DigimonCraft</text>

              <rect x="315" y="165" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "HIS NAME TCG BOOTH", rating: "4.8 / 5", activeListings: "2,100+ Items", completedTrans: "9,800+", booth: "5D", specialties: ["One Piece Manga Rares", "Lorcana Enchanteds", "Modern Grails"], discountScore: 74 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "HIS NAME TCG BOOTH", rating: "4.8 / 5", activeListings: "2,100+ Items", completedTrans: "9,800+", booth: "5D", specialties: ["One Piece Manga Rares", "Lorcana Enchanteds", "Modern Grails"], discountScore: 74 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="352" y="182" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">His Name</text>

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
                onClick={() => { setSelectedVendor({ name: "SLAB CITY PSA ON-SITE", rating: "5.0 / 5", activeListings: "4,600+ Slabs", completedTrans: "31,000+", booth: "Zone 5E", specialties: ["PSA 10 Slabs", "BGS Black Labels", "CGC 10 Pristine"], discountScore: 80 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <rect x="530" y="135" width="70" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "RETRO POKÉMON HQ", rating: "4.6 / 5", activeListings: "1,850+ Items", completedTrans: "8,200+", booth: "Zone X", specialties: ["Gym Challenge", "Fossil / Jungle 1st Ed", "Team Rocket Boxes"], discountScore: 72 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "RETRO POKÉMON HQ", rating: "4.6 / 5", activeListings: "1,850+ Items", completedTrans: "8,200+", booth: "Zone X", specialties: ["Gym Challenge", "Fossil / Jungle 1st Ed", "Team Rocket Boxes"], discountScore: 72 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="565" y="158" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">X</text>

              {/* ===== CENTER ROW: ZONES 6 & 7 ===== */}
              <rect x="140" y="205" width="80" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#fb923c] hover:fill-[#fb923c]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TCG VENDORS (N-Z)", rating: "4.6 / 5", activeListings: "6,200+ Items", completedTrans: "28,000+", booth: "Zone 6", specialties: ["Sealed Kings", "Slab City PSA", "Energy Supply Co."], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "TCG VENDORS (N-Z)", rating: "4.6 / 5", activeListings: "6,200+ Items", completedTrans: "28,000+", booth: "Zone 6", specialties: ["Sealed Kings", "Slab City PSA", "Energy Supply Co."], discountScore: 68 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="180" y="228" textAnchor="middle" fill="#475569" fontSize="8" fontFamily="monospace" fontWeight="bold">0</text>
              <text x="180" y="250" textAnchor="middle" fill="#334155" fontSize="5" fontFamily="monospace">Sealed</text>

              {/* Sub-vendor booths center */}
              <rect x="230" y="205" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#34d399] hover:fill-[#34d399]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SPECIALS ZONE TRADING", rating: "4.9 / 5", activeListings: "950+ Items", completedTrans: "5,400+", booth: "6A", specialties: ["Mario & Luigi Pikachu", "Poncho Pikachu", "Special Delivery Charizard"], discountScore: 78 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "SPECIALS ZONE TRADING", rating: "4.9 / 5", activeListings: "950+ Items", completedTrans: "5,400+", booth: "6A", specialties: ["Mario & Luigi Pikachu", "Poncho Pikachu", "Special Delivery Charizard"], discountScore: 78 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="268" y="222" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Specials</text>

              <rect x="315" y="205" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "GOLD STAR COLLECTORS", rating: "4.8 / 5", activeListings: "1,120+ Items", completedTrans: "6,900+", booth: "6B", specialties: ["Gold Star Espeon", "Shining Charizard", "Crystal Lugia"], discountScore: 76 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "GOLD STAR COLLECTORS", rating: "4.8 / 5", activeListings: "1,120+ Items", completedTrans: "6,900+", booth: "6B", specialties: ["Gold Star Espeon", "Shining Charizard", "Crystal Lugia"], discountScore: 76 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />

              <rect x="230" y="235" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#22d3ee] hover:fill-[#22d3ee]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SEALED PRODUCT KINGDOM", rating: "4.7 / 5", activeListings: "3,100+ Boxes", completedTrans: "14,200+", booth: "6C", specialties: ["Evolving Skies Booster Boxes", "Team Up Sealed", "Vintage Packs"], discountScore: 70 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "SEALED PRODUCT KINGDOM", rating: "4.7 / 5", activeListings: "3,100+ Boxes", completedTrans: "14,200+", booth: "6C", specialties: ["Evolving Skies Booster Boxes", "Team Up Sealed", "Vintage Packs"], discountScore: 70 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
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
                onClick={() => { setSelectedVendor({ name: "MODERN ALT ART VAULT", rating: "4.9 / 5", activeListings: "2,400+ Singles", completedTrans: "11,500+", booth: "Booth 16", specialties: ["Giratina V Alt", "Moonbreon", "Rayquaza VMAX Alt"], discountScore: 82 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <rect x="530" y="205" width="70" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "JAPANESE HIGH CLASS HUB", rating: "4.8 / 5", activeListings: "3,800+ Items", completedTrans: "18,400+", booth: "Booth 46", specialties: ["Shiny Treasure EX", "VSTAR Universe", "Terastal Festival EX"], discountScore: 78 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "JAPANESE HIGH CLASS HUB", rating: "4.8 / 5", activeListings: "3,800+ Items", completedTrans: "18,400+", booth: "Booth 46", specialties: ["Shiny Treasure EX", "VSTAR Universe", "Terastal Festival EX"], discountScore: 78 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />

              {/* ===== ZONE 7-8: DOVAKINJI & BOTTOM VENDORS ===== */}
              <rect x="40" y="275" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "DISPLAY & CASES GALLERY", rating: "5.0 / 5", activeListings: "Acrylic Cases & Stands", completedTrans: "6,500+", booth: "Zone 7 Display", specialties: ["UV Protection Booster Box Cases", "Custom Slab Frames", "LED Displays"], discountScore: 65 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "DISPLAY & CASES GALLERY", rating: "5.0 / 5", activeListings: "Acrylic Cases & Stands", completedTrans: "6,500+", booth: "Zone 7 Display", specialties: ["UV Protection Booster Box Cases", "Custom Slab Frames", "LED Displays"], discountScore: 65 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="82" y="302" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">Display</text>

              {/* Vendor sub-booths bottom */}
              <rect x="140" y="275" width="80" height="55" rx="3" fill="#0c1824" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.4"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SEALED PRODUCT ZONE 7", rating: "4.8 / 5", activeListings: "4,100+ Boxes", completedTrans: "21,000+", booth: "Zone 7", specialties: ["WOTC Booster Packs", "EX Era Boxes", "Sun & Moon Booster Boxes"], discountScore: 75 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "SEALED PRODUCT ZONE 7", rating: "4.8 / 5", activeListings: "4,100+ Boxes", completedTrans: "21,000+", booth: "Zone 7", specialties: ["WOTC Booster Packs", "EX Era Boxes", "Sun & Moon Booster Boxes"], discountScore: 75 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <circle cx="180" cy="302" r="12" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1.5" />
              <text x="180" y="306" textAnchor="middle" fill="#38bdf8" fontSize="11" fontFamily="monospace" fontWeight="900">6</text>

              <rect x="230" y="275" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#fbbf24] hover:fill-[#fbbf24]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "FILMERA GRADED CARDS", rating: "4.7 / 5", activeListings: "1,600+ Slabs", completedTrans: "8,900+", booth: "7A Filmera", specialties: ["PSA 9 & 10 Vintage", "Japanese Promos", "PSA Submission Service"], discountScore: 70 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "FILMERA GRADED CARDS", rating: "4.7 / 5", activeListings: "1,600+ Slabs", completedTrans: "8,900+", booth: "7A Filmera", specialties: ["PSA 9 & 10 Vintage", "Japanese Promos", "PSA Submission Service"], discountScore: 70 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="250" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Filmera</text>
              <text x="290" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">DH</text>

              <rect x="315" y="275" width="75" height="25" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "CARBANDA VINTAGE TCG", rating: "4.9 / 5", activeListings: "2,200+ Cards", completedTrans: "12,100+", booth: "7B Carbanda", specialties: ["Shadowless Holos", "Skyridge Crystal Types", "Aquapolis Holos"], discountScore: 84 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "CARBANDA VINTAGE TCG", rating: "4.9 / 5", activeListings: "2,200+ Cards", completedTrans: "12,100+", booth: "7B Carbanda", specialties: ["Shadowless Holos", "Skyridge Crystal Types", "Aquapolis Holos"], discountScore: 84 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="335" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Carbanda</text>
              <text x="375" y="292" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Brodes</text>

              {/* Zone 3 bottom */}
              <rect x="230" y="305" width="160" height="30" rx="3" fill="#0c1824" stroke="#f472b6" strokeWidth="1" strokeOpacity="0.5"
                className="cursor-pointer hover:stroke-[#f472b6] hover:fill-[#f472b6]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TRADING TABLES ZONE 8", rating: "5.0 / 5", activeListings: "Open Trading & Barter", completedTrans: "10,000+ Trades Today", booth: "Zone 8", specialties: ["Collector Meetups", "Open Binder Trading", "Community Appraisal"], discountScore: 90 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "TRADING TABLES ZONE 8", rating: "5.0 / 5", activeListings: "Open Trading & Barter", completedTrans: "10,000+ Trades Today", booth: "Zone 8", specialties: ["Collector Meetups", "Open Binder Trading", "Community Appraisal"], discountScore: 90 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <circle cx="248" cy="320" r="10" fill="#f472b6" fillOpacity="0.2" stroke="#f472b6" strokeWidth="1.5" />
              <text x="248" y="324" textAnchor="middle" fill="#f472b6" fontSize="9" fontFamily="monospace" fontWeight="bold">3</text>

              <text x="420" y="305" textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace" fontWeight="bold">15</text>
              <rect x="400" y="275" width="60" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "BRODES TCG SYNDICATE", rating: "4.8 / 5", activeListings: "1,900+ Items", completedTrans: "9,300+", booth: "Booth 15", specialties: ["Japanese S&V Master Sets", "Promo Cards", "High Grade Slabs"], discountScore: 76 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "BRODES TCG SYNDICATE", rating: "4.8 / 5", activeListings: "1,900+ Items", completedTrans: "9,300+", booth: "Booth 15", specialties: ["Japanese S&V Master Sets", "Promo Cards", "High Grade Slabs"], discountScore: 76 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />

              {/* ===== BOTTOM ROW ===== */}
              <rect x="40" y="350" width="85" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#c084fc] hover:fill-[#c084fc]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "VINTAGE ACCESSORIES & BINDERS", rating: "4.9 / 5", activeListings: "500+ Binders & Sleeves", completedTrans: "11,000+", booth: "Booth A1", specialties: ["Toploaders & Semi-Rigids", "Custom Leather Binders", "Penny Sleeves Bulk"], discountScore: 80 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "VINTAGE ACCESSORIES & BINDERS", rating: "4.9 / 5", activeListings: "500+ Binders & Sleeves", completedTrans: "11,000+", booth: "Booth A1", specialties: ["Toploaders & Semi-Rigids", "Custom Leather Binders", "Penny Sleeves Bulk"], discountScore: 80 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />

              <rect x="140" y="350" width="80" height="55" rx="3" fill="#0c1824" stroke="#1e3a5f" strokeWidth="1"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "TRADING TABLES ZONE 8 (EAST)", rating: "5.0 / 5", activeListings: "Open Tables A-F", completedTrans: "8,500+", booth: "Zone 8 East", specialties: ["Modern Trade Pods", "Quick Cash Offers", "Single Card Swaps"], discountScore: 85 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "TRADING TABLES ZONE 8 (EAST)", rating: "5.0 / 5", activeListings: "Open Tables A-F", completedTrans: "8,500+", booth: "Zone 8 East", specialties: ["Modern Trade Pods", "Quick Cash Offers", "Single Card Swaps"], discountScore: 85 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <circle cx="180" cy="377" r="12" fill="#f472b6" fillOpacity="0.15" stroke="#f472b6" strokeWidth="1.5" />
              <text x="180" y="381" textAnchor="middle" fill="#f472b6" fontSize="11" fontFamily="monospace" fontWeight="900">8</text>

              {/* Bottom vendor name labels */}
              <rect x="230" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "WIKRATS POKÉMON EMPORIUM", rating: "4.7 / 5", activeListings: "1,350+ Items", completedTrans: "6,400+", booth: "Booth 8A", specialties: ["WOTC Holos", "EX Era Delta Species", "Level X Cards"], discountScore: 68 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "WIKRATS POKÉMON EMPORIUM", rating: "4.7 / 5", activeListings: "1,350+ Items", completedTrans: "6,400+", booth: "Booth 8A", specialties: ["WOTC Holos", "EX Era Delta Species", "Level X Cards"], discountScore: 68 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="257" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Wikrats</text>

              <rect x="295" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "UDS COLLECTIBLES & SLABS", rating: "4.8 / 5", activeListings: "2,100+ Slabs", completedTrans: "11,800+", booth: "Booth 8B", specialties: ["PSA 10 Modern Grails", "Sun & Moon Alt Arts", "Tag Team Promos"], discountScore: 74 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "UDS COLLECTIBLES & SLABS", rating: "4.8 / 5", activeListings: "2,100+ Slabs", completedTrans: "11,800+", booth: "Booth 8B", specialties: ["PSA 10 Modern Grails", "Sun & Moon Alt Arts", "Tag Team Promos"], discountScore: 74 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="322" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">UDS</text>

              <rect x="360" y="350" width="55" height="55" rx="2" fill="#0a1420" stroke="#1e3a5f" strokeWidth="0.8"
                className="cursor-pointer hover:stroke-[#38bdf8] hover:fill-[#38bdf8]/[0.15] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "SPECS GRADED GRAILS", rating: "4.9 / 5", activeListings: "3,100+ Items", completedTrans: "16,200+", booth: "Booth 8C", specialties: ["BGS 10 Gold Labels", "1st Ed Neo Destiny", "Trophy Kangaskhan"], discountScore: 82 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "SPECS GRADED GRAILS", rating: "4.9 / 5", activeListings: "3,100+ Items", completedTrans: "16,200+", booth: "Booth 8C", specialties: ["BGS 10 Gold Labels", "1st Ed Neo Destiny", "Trophy Kangaskhan"], discountScore: 82 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="387" y="382" textAnchor="middle" fill="#4a6a8a" fontSize="5.5" fontFamily="monospace">Specs</text>

              {/* DOVAKINJI VIP (bottom right, highlighted) */}
              <rect x="425" y="350" width="85" height="55" rx="4" fill="#f472b6" fillOpacity="0.08" stroke="#f472b6" strokeWidth="1.5"
                className="cursor-pointer hover:fill-opacity-[0.25] transition-all"
                onMouseEnter={() => handleBoothHover({ name: "DOVAKINJI COLLECTIBLES", rating: "4.9 / 5", activeListings: "1,890+ Items", completedTrans: "8,400+", booth: "VIP 10", specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"], discountScore: 88 })}
                onMouseLeave={handleBoothLeave}
                onClick={() => { setSelectedVendor({ name: "DOVAKINJI COLLECTIBLES", rating: "4.9 / 5", activeListings: "1,890+ Items", completedTrans: "8,400+", booth: "VIP 10", specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"], discountScore: 88 }); if (window.innerWidth < 1024) setMobileSection('vendor'); }}
              />
              <text x="467" y="375" textAnchor="middle" fill="#f472b6" fontSize="6" fontFamily="monospace" fontWeight="bold">Dovakinji</text>
              <text x="467" y="395" textAnchor="middle" fill="#475569" fontSize="6" fontFamily="monospace">10</text>

              {/* Zone 10 label at bottom center */}
              <circle cx="320" cy="418" r="10" fill="#38bdf8" fillOpacity="0.15" stroke="#38bdf8" strokeWidth="1" />
              <text x="320" y="422" textAnchor="middle" fill="#38bdf8" fontSize="9" fontFamily="monospace" fontWeight="bold">10</text>

              {/* ===== SMALL LIVE BUYER DOTS ===== */}
              <circle cx="100" cy="95" r="2" fill="#38bdf8" opacity="0.7"><animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" /></circle>
              <circle cx="250" cy="165" r="2" fill="#f472b6" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="1.8s" repeatCount="indefinite" /></circle>
              <circle cx="400" cy="295" r="2" fill="#2dd4bf" opacity="0.7"><animate attributeName="opacity" values="0.5;1;0.5" dur="2.2s" repeatCount="indefinite" /></circle>
              <circle cx="480" cy="375" r="2" fill="#f472b6" opacity="0.8"><animate attributeName="opacity" values="0.3;1;0.3" dur="1.5s" repeatCount="indefinite" /></circle>
              <circle cx="350" cy="85" r="2" fill="#fbbf24" opacity="0.6"><animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" /></circle>
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

          {/* Selected Vendor Profile Spotlight Card */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex items-center gap-1.5 px-1">
              <Star className="w-3.5 h-3.5 text-yellow-500 fill-current" />
              <h2 className="text-xs sm:text-sm font-black tracking-wider text-white uppercase font-mono">
                SELECTED VENDOR SPOTLIGHT
              </h2>
            </div>

            <div className="bg-gradient-to-b from-[#111418] to-[#0d1015] border border-[#38bdf8]/40 rounded-2xl p-3.5 flex flex-col gap-3 shadow-[0_0_25px_rgba(56,189,248,0.12)] flex-1">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono font-bold">
                  Active Vendor Profile:
                </span>
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {selectedVendor.name}
                  </h3>
                  <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-[8px] font-black uppercase rounded-full border border-yellow-500/50 flex items-center gap-1 shadow-sm">
                    Premier <Check className="w-2.5 h-2.5" />
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

              <div className="flex flex-col gap-1.5">
                <h4 className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono border-b border-[#1e293b]/60 pb-1 font-bold">
                  Featured Inventory Grails
                </h4>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { name: "Base Charizard", grade: "PSA 10", price: "12.4k" },
                    { name: "Lugia 1st Ed", grade: "BGS 9.5", price: "18.2k" },
                    { name: "Moonbreon Alt", grade: "PSA 10", price: "1.4k" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (onInspectCard) {
                          onInspectCard({
                            id: `grail-${i}`,
                            name: item.name,
                            currentPrice: parseFloat(item.price.replace('k', '')) * 1000,
                            isSlabbed: true,
                            slabGrade: item.grade,
                            imageUrl: i === 0 ? "https://images.scrydex.com/pokemon/base1-4/large" : i === 1 ? "https://images.scrydex.com/pokemon/neo1-9/large" : "https://images.scrydex.com/pokemon/swsh7-215/large"
                          });
                        }
                      }}
                      className="bg-black/70 border border-[#1e293b]/60 rounded-lg p-1.5 flex flex-col items-center text-center gap-0.5 hover:border-[#38bdf8] transition-all cursor-pointer transform hover:-translate-y-0.5 shadow-md group"
                    >
                      <div className="w-full aspect-[3/4] bg-gradient-to-tr from-amber-500/20 to-purple-500/20 rounded-md flex items-center justify-center border border-white/10 group-hover:scale-105 transition-transform">
                        <Award className="w-3.5 h-3.5 text-amber-400" />
                      </div>
                      <span className="text-[8px] font-bold leading-tight text-white truncate w-full">
                        {item.name}
                      </span>
                      <div className="flex w-full justify-between items-center px-0.5 pt-0.5 border-t border-white/5">
                        <span className="text-[7px] text-[#38bdf8] font-bold">
                          {item.grade}
                        </span>
                        <span className="text-[7px] font-mono text-green-400 font-black">
                          ${item.price}
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
                    {selectedVendor.specialties.map((spec, index) => (
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
                        strokeDasharray={`${selectedVendor.discountScore}, 100`}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-[9px] font-mono font-bold text-white">
                      {selectedVendor.discountScore}%
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

    </div>
  );
};

export default CardShowView;
