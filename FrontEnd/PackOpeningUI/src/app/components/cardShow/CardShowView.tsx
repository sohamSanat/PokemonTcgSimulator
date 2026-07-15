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
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
            mobileSection === 'market'
              ? 'bg-[#2dd4bf]/20 text-[#2dd4bf] border border-[#2dd4bf]/50 shadow-[0_0_10px_rgba(45,212,191,0.2)]'
              : 'text-[#94a3b8] hover:bg-white/5'
          }`}
        >
          <Package className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">MARKET ({filteredCards.length})</span>
        </button>

        <button
          onClick={() => setMobileSection('map')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
            mobileSection === 'map'
              ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/50 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
              : 'text-[#94a3b8] hover:bg-white/5'
          }`}
        >
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">FLOOR MAP</span>
        </button>

        <button
          onClick={() => setMobileSection('vendor')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg text-xs font-bold font-mono transition-all ${
            mobileSection === 'vendor'
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
        
        {/* Column A: EXPO MARKETPLACE & VENDOR GALLERY (Desktop 4 Cols / Cards Visible Immediately!) */}
        <section
          className={`${
            isMapExpanded ? 'hidden' : ''
          } ${
            mobileSection === 'market' ? 'flex' : 'hidden lg:flex'
          } lg:col-span-4 flex-col gap-2 overflow-hidden h-full min-h-[480px] lg:min-h-0`}
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
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold whitespace-nowrap transition-colors ${
                    selectedFilter === filter
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
              className={`px-2 py-1.5 rounded-lg border text-[10px] font-mono font-bold transition-all shrink-0 flex items-center gap-1 ${
                showArbSpotlight
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

          {/* MARKETPLACE CARDS GRID — FULL CARD RATIO & SMOOTH SCROLL CONTAINER */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 flex-1 overflow-y-auto pr-1.5 pb-6 max-h-[calc(100vh-14rem)] custom-scrollbar">
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
                className="bg-[#111418] border border-[#1e293b] rounded-xl overflow-hidden group hover:border-[#38bdf8] transition-all duration-300 flex flex-col cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] relative transform hover:-translate-y-0.5"
              >
                {/* Fixed Height Image Box with relative block image so 100% full card is shown top-to-bottom without clipping */}
                <div className="h-56 sm:h-64 w-full bg-gradient-to-b from-white/5 via-black/40 to-black/80 relative flex items-center justify-center p-3 overflow-hidden shrink-0">
                  <img
                    src={card.img}
                    alt={card.name}
                    className="relative z-10 h-full max-h-full w-auto max-w-full object-contain filter drop-shadow-2xl transition-transform duration-300 group-hover:scale-105 block mx-auto"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute top-2 right-2 z-20">
                    <div className="w-5 h-5 rounded border border-white/20 bg-black/80 flex items-center justify-center group-hover:border-[#38bdf8] shadow-md">
                      <Check className="w-3 h-3 text-[#38bdf8]" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 z-20">
                    <span className="bg-black/90 px-1.5 py-0.5 rounded text-[9px] font-mono border border-amber-500/40 text-amber-300 font-bold shadow-md">
                      {card.grade}
                    </span>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div className="p-2.5 flex flex-col gap-1 bg-[#0e1117] border-t border-white/10 flex-1 justify-between shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs font-bold text-white leading-tight line-clamp-1 group-hover:text-[#38bdf8] transition-colors">
                      {card.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      Market Value
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-white/5 mt-1">
                    <span className="text-sm font-mono font-black text-white">
                      ${card.price.toLocaleString()}
                    </span>
                    <span className="text-green-400 font-bold text-[10px] font-mono">
                      {card.change}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column B: LIVE INTERACTIVE FLOOR PLAN (Desktop 5 Cols — Tall, Spacious, Center Stage) */}
        <section
          className={`${
            isMapExpanded ? 'lg:col-span-12' : 'lg:col-span-5'
          } ${
            mobileSection === 'map' ? 'flex' : 'hidden lg:flex'
          } flex-col gap-2 border-y lg:border-y-0 lg:border-x border-[#1e293b]/60 px-1 sm:px-2 overflow-hidden h-full min-h-[480px] lg:min-h-0`}
        >
          {/* Ultra-Slim Map Top Header Bar */}
          <div className="flex items-center justify-between bg-[#111418] py-1.5 px-3 border border-[#1e293b] rounded-xl shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#2dd4bf]" />
              <span className="text-xs font-black tracking-wider text-white uppercase font-mono">
                INTERACTIVE FLOOR PLAN
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex gap-2.5 items-center hidden sm:flex text-[10px] font-mono">
                <span className="flex items-center gap-1 text-white">
                  <span className="w-2 h-2 rounded-full bg-[#f472b6] animate-pulse"></span> Buyers
                </span>
                <span className="flex items-center gap-1 text-white">
                  <span className="w-2 h-2 rounded-full bg-[#2dd4bf]"></span> Traffic
                </span>
              </div>

              {/* Expand / Shrink Map Toggle */}
              <button
                onClick={() => setIsMapExpanded(!isMapExpanded)}
                className="flex items-center gap-1 px-2 py-1 rounded bg-white/5 hover:bg-[#38bdf8]/20 border border-white/10 text-[10px] font-mono font-bold text-[#38bdf8] transition-all"
                title={isMapExpanded ? "Restore Columns" : "Maximize Floor Plan"}
              >
                {isMapExpanded ? (
                  <>
                    <Minimize2 className="w-3 h-3" /> <span>RESTORE</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-3 h-3" /> <span>FULLSCREEN MAP</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Map Arena Container */}
          <div className="relative flex-1 bg-[#0a0c10] border border-[#1e293b]/60 rounded-2xl overflow-hidden flex flex-col min-h-[380px] shadow-2xl">
            {/* High-Tech Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293725_1px,transparent_1px),linear-gradient(to_bottom,#1f293725_1px,transparent_1px)] bg-[size:24px_24px] opacity-60"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_center,rgba(56,189,248,0.08),transparent)] pointer-events-none"></div>

            <div className="absolute inset-0 p-3 sm:p-5 flex flex-col justify-center relative">
              {/* Fake Cybernetic Data Trails */}
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-t-2 border-l-2 border-[#f472b6]/30 rounded-tl-3xl pointer-events-none"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 border-b-2 border-r-2 border-[#2dd4bf]/30 rounded-br-3xl pointer-events-none"></div>

              {/* Interactive Pulsing Traffic Points */}
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#f472b6] rounded-full shadow-[0_0_20px_rgba(236,72,153,1)] animate-ping pointer-events-none"></div>
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#f472b6] rounded-full shadow-[0_0_20px_rgba(236,72,153,1)] pointer-events-none"></div>
              <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-[#2dd4bf] rounded-full shadow-[0_0_20px_rgba(45,212,191,1)] animate-pulse delay-75 pointer-events-none"></div>

              {/* Interactive Floor Booth Layout Boxes */}
              <div className="grid grid-cols-4 gap-2.5 sm:gap-3 h-full relative z-10 py-1 sm:py-2">
                {/* Booth 1-4 */}
                <div 
                  onClick={() => {
                    setSelectedVendor({
                      name: "ALPHA INVESTMENTS & GRAILS",
                      rating: "4.9 / 5",
                      activeListings: "4,200+ Items",
                      completedTrans: "19,500+",
                      booth: "Booth 1-4",
                      specialties: ["Sealed WOTC Booster Boxes", "MTG Black Lotuses", "High-End Slabs"],
                      discountScore: 82,
                    });
                    if (window.innerWidth < 1024) setMobileSection('vendor');
                  }}
                  className="col-span-1 border border-white/10 bg-white/5 hover:bg-[#38bdf8]/15 hover:border-[#38bdf8]/60 flex flex-col items-center justify-center text-center p-2 rounded-xl cursor-pointer transition-all duration-300 group shadow-lg"
                >
                  <span className="text-[10px] sm:text-xs text-[#94a3b8] group-hover:text-white font-mono uppercase font-bold">
                    Booths 1-4
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[#38bdf8] font-bold mt-0.5">
                    Alpha Grails
                  </span>
                </div>

                {/* Main Stage */}
                <div 
                  onClick={() => {
                    setSelectedVendor({
                      name: "EXPO MAIN STAGE AUCTION HOUSE",
                      rating: "5.0 / 5",
                      activeListings: "125 Grails Live",
                      completedTrans: "50,000+",
                      booth: "Main Stage",
                      specialties: ["Live Stage Auctions", "Celebrity Signings", "Trophy Cards"],
                      discountScore: 90,
                    });
                    if (window.innerWidth < 1024) setMobileSection('vendor');
                  }}
                  className="col-span-2 border border-[#38bdf8]/50 bg-[#38bdf8]/15 hover:bg-[#38bdf8]/25 flex items-center justify-center flex-col gap-1.5 relative overflow-hidden rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.2)] cursor-pointer transition-all duration-300 group p-2.5"
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-[#38bdf8]/25 via-transparent to-transparent"></div>
                  <span className="text-xs sm:text-sm font-black tracking-widest relative z-10 flex items-center gap-1.5 text-[#38bdf8] group-hover:scale-105 transition-transform">
                    <Zap className="w-4 h-4 text-amber-400 animate-bounce" /> MAIN STAGE ARENA
                  </span>
                  <span className="text-[9px] sm:text-[10px] font-mono text-white relative z-10 bg-black/80 px-2.5 py-0.5 rounded-full border border-[#38bdf8]/40 shadow-md">
                    LIVE: Rare Charizard Trophy Auction
                  </span>
                </div>

                {/* TCG Vendors A-M */}
                <div 
                  onClick={() => {
                    setSelectedVendor({
                      name: "VINTAGEVAULT TCG",
                      rating: "4.8 / 5",
                      activeListings: "3,450+ Items",
                      completedTrans: "12,800+",
                      booth: "Booth 104",
                      specialties: ["WOTC Japanese (Kanji)", "e-Series (JPN)", "Neo Destiny"],
                      discountScore: 75,
                    });
                    if (window.innerWidth < 1024) setMobileSection('vendor');
                  }}
                  className="col-span-1 border border-white/10 bg-white/5 hover:bg-[#2dd4bf]/15 hover:border-[#2dd4bf]/60 flex flex-col items-center justify-center text-center p-2 rounded-xl cursor-pointer transition-all duration-300 group shadow-lg"
                >
                  <span className="text-[10px] sm:text-xs text-[#94a3b8] group-hover:text-white font-mono uppercase font-bold">
                    Vendors A-M
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-[#2dd4bf] font-bold mt-0.5">
                    VintageVault
                  </span>
                </div>

                {/* Artist Alley */}
                <div 
                  onClick={() => {
                    setSelectedVendor({
                      name: "OFFICIAL ILLUSTRATOR ARTIST ALLEY",
                      rating: "5.0 / 5",
                      activeListings: "450 Signed Prints",
                      completedTrans: "9,200+",
                      booth: "Artist Alley",
                      specialties: ["Custom Sketch Cards", "Mitsuhiro Arita Signings", "Original Concept Art"],
                      discountScore: 65,
                    });
                    if (window.innerWidth < 1024) setMobileSection('vendor');
                  }}
                  className="col-span-2 border border-white/10 bg-white/5 hover:bg-[#c084fc]/15 hover:border-[#c084fc]/60 flex flex-col items-center justify-center text-[10px] sm:text-xs font-mono font-bold text-[#94a3b8] group-hover:text-[#c084fc] uppercase mt-1 rounded-xl transition-all duration-300 cursor-pointer p-2 shadow-lg"
                >
                  <span className="flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-[#c084fc]" /> Artist Alley & Signings (Click to View)
                  </span>
                </div>

                {/* Dovakinji VIP Pod */}
                <div
                  onClick={() => {
                    setSelectedVendor({
                      name: "DOVAKINJI COLLECTIBLES",
                      rating: "4.9 / 5",
                      activeListings: "1,890+ Items",
                      completedTrans: "8,400+",
                      booth: "Booth 104 VIP",
                      specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"],
                      discountScore: 88,
                    });
                    if (window.innerWidth < 1024) setMobileSection('vendor');
                  }}
                  className="col-span-2 border border-[#f472b6]/50 bg-[#f472b6]/15 hover:bg-[#f472b6]/25 flex flex-col items-center justify-center text-xs text-[#f472b6] font-black uppercase mt-1 shadow-[0_0_20px_rgba(236,72,153,0.25)_inset] rounded-xl cursor-pointer transition-all duration-300 p-2.5 group"
                >
                  <span className="flex items-center gap-1.5 group-hover:scale-105 transition-transform">
                    <Star className="w-3.5 h-3.5 fill-current animate-spin-slow" /> Dovakinji VIP Booth (104)
                  </span>
                  <span className="text-[8px] sm:text-[9px] text-white/80 font-mono mt-0.5">
                    Tap to view Japanese Grails & Promos
                  </span>
                </div>
              </div>
            </div>

            {/* Map Navigation Footer Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/85 backdrop-blur-md border-t border-[#1e293b]/60 p-2 flex flex-wrap justify-between items-center text-[9px] font-mono text-[#94a3b8] gap-1.5">
              <div className="flex flex-wrap gap-3">
                <span className="flex items-center gap-1 font-bold text-white">
                  <span className="w-2 h-2 bg-[#f472b6] rounded-full"></span> 1. High Traffic
                </span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <span className="w-2 h-2 bg-[#2dd4bf] rounded-full"></span> 2. VIP Access
                </span>
                <span className="flex items-center gap-1 font-bold text-white">
                  <span className="w-2 h-2 bg-[#c084fc] rounded-full"></span> 3. Vendor Loading
                </span>
              </div>
              <div className="flex gap-3 font-semibold">
                <span className="hover:text-white cursor-pointer">4. Restrooms</span>
                <span className="hover:text-white cursor-pointer">5. Exit</span>
              </div>
            </div>
          </div>
        </section>

        {/* Column C: EVENT INTELLIGENCE & SELECTED VENDOR PROFILE (Desktop 3 Cols — Compact Top Ticker, Full Profile Room!) */}
        <section
          className={`${
            isMapExpanded ? 'hidden' : ''
          } ${
            mobileSection === 'vendor' ? 'flex' : 'hidden lg:flex'
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
                  className={`flex items-center justify-between p-1.5 rounded-lg border text-center ${
                    feed.active
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

      {/* Global Circuit Footer Banner */}
      <footer className="h-8 sm:h-10 bg-[#050608] border-t border-[#1e293b]/60 shrink-0 flex items-center justify-between px-3 relative overflow-hidden z-20">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#38bdf8]/20 via-[#050608] to-[#050608]"></div>

        <span className="text-[9px] font-black tracking-[0.3em] text-white/50 uppercase hidden sm:inline">
          GLOBAL CIRCUIT - LOS ANGELES CONVENTION CENTER
        </span>

        <div className="flex-1 sm:max-w-xl bg-gradient-to-r from-[#38bdf8]/20 via-[#2dd4bf]/20 to-[#38bdf8]/20 text-[#38bdf8] rounded px-3 py-1 flex items-center overflow-hidden text-[9px] font-mono font-black tracking-wider uppercase border border-[#38bdf8]/30">
          <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap">
            Simulated Transaction: Buyer 409 acquired 1st Ed Base Set Charizard from 'Vintage Vault' &nbsp;&nbsp; | &nbsp;&nbsp; ALERT: SYS-00 Network Sync Complete &nbsp;&nbsp; | &nbsp;&nbsp; PSA 10 Moonbreon just sold for $1,420 at Booth 104
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CardShowView;
