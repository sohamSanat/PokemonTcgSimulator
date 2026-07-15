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
  Award
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

  const filteredCards = marketplaceCards.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-full h-full min-h-[calc(100vh-5rem)] bg-[#090a0c] text-[#f8fafc] flex flex-col font-sans overflow-hidden">
      {/* Expo Circuit Header */}
      <header className="h-16 border-b border-[#1e293b]/50 bg-[#111418]/80 backdrop-blur-md flex items-center justify-between px-4 md:px-6 shrink-0">
        <div className="flex items-center gap-4 w-64">
          {onBackToPacks && (
            <button
              onClick={onBackToPacks}
              className="p-2 hover:bg-white/10 rounded-md transition-colors text-[#94a3b8] hover:text-[#f8fafc] flex items-center gap-2 text-xs font-mono"
              title="Back to Packs"
            >
              <ArrowLeft className="w-4 h-4 text-[#38bdf8]" />
              <span className="hidden sm:inline">BACK</span>
            </button>
          )}
          <div className="flex flex-col">
            <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-mono">
              System
            </span>
            <span className="text-sm font-semibold tracking-wide text-[#38bdf8] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#2dd4bf]" /> OP-CORE
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-widest bg-gradient-to-b from-white via-white/90 to-white/50 bg-clip-text text-transparent text-center">
            GLOBAL CARD SHOW CIRCUIT
          </h1>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 w-64 justify-end">
          <div className="relative group hidden lg:block">
            <input
              type="text"
              placeholder="Search Expo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-black/40 border border-[#1e293b]/50 rounded-full py-1.5 pl-4 pr-9 text-xs sm:text-sm w-44 sm:w-48 focus:outline-none focus:border-[#38bdf8]/50 transition-colors text-white placeholder:text-[#94a3b8]"
            />
            <Search className="w-4 h-4 text-[#94a3b8] absolute right-3 top-1/2 -translate-y-1/2 group-focus-within:text-[#38bdf8] transition-colors" />
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <span className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-widest group-hover:text-[#38bdf8] transition-colors">
              Bash Floor
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#f472b6] to-[#c084fc] p-[1px]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-white/10" />
                </div>
              </div>
              <div className="relative">
                <Bell className="w-5 h-5 text-[#94a3b8] group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-[#f472b6] rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 overflow-hidden h-[calc(100vh-4rem-3rem)]">
        {/* Column A: EXPO MARKETPLACE & VENDOR GALLERY */}
        <section className="col-span-1 md:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-4 h-4 text-[#38bdf8]" />
            <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
              EXPO MARKETPLACE & VENDOR GALLERY
            </h2>
          </div>

          {/* Filter Panel */}
          <div className="bg-[#111418]/60 border border-[#1e293b]/50 rounded-lg p-3 sm:p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-mono text-[#38bdf8] font-bold tracking-wider">
                ACTIVE FILTERS
              </span>
              <button
                onClick={() => setSelectedFilter("All")}
                className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 rounded px-2.5 py-1 transition-colors text-[#94a3b8]"
              >
                RESET
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {["Grade", "Card Type", "Set", "Borderless Set"].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setSelectedFilter(filter)}
                  className={`flex items-center justify-between bg-black/40 border rounded px-2 py-1.5 text-xs transition-colors ${
                    selectedFilter === filter
                      ? "border-[#38bdf8] text-[#38bdf8] bg-[#38bdf8]/10"
                      : "border-[#1e293b]/50 text-[#94a3b8] hover:border-white/20"
                  }`}
                >
                  <span className="truncate">{filter}</span>
                  <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-[#1e293b]/50">
              <div className="flex justify-between text-[10px] font-mono text-[#94a3b8]">
                <span>$50</span>
                <span className="text-[#38bdf8] font-bold">$200</span>
                <span>$1,000+</span>
              </div>
              <div className="relative h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div className="absolute left-[10%] right-[30%] top-0 bottom-0 bg-gradient-to-r from-[#38bdf8] to-[#2dd4bf]" />
              </div>
            </div>
          </div>

          {/* Dynamic Card Controls */}
          <div className="grid gap-3">
            {[
              { name: "PSA 10 Charizard Base Set", potential: 37, price: 450.5, id: 1040, change: "+1.2%" },
              { name: "PSA 10 Lugia 1st Ed Neo", potential: 54, price: 570.5, id: 1041, change: "+2.8%" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-[#111418]/80 to-black/60 border border-[#1e293b]/50 p-3 rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-white uppercase truncate max-w-[160px]">
                      {item.name}
                    </span>
                    <span className="text-[10px] text-[#94a3b8] font-mono">
                      ID-{item.id}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#94a3b8]">
                      Arb. Potential:
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        item.potential > 50 ? "text-[#2dd4bf]" : "text-[#38bdf8]"
                      }`}
                    >
                      {item.potential}%
                    </span>
                  </div>
                  <div className="relative h-1 bg-black/60 rounded-full overflow-hidden mt-1">
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${
                        item.potential > 50 ? "bg-[#2dd4bf]" : "bg-[#38bdf8]"
                      }`}
                      style={{ width: `${item.potential}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1 shrink-0">
                  <span className="text-sm font-bold font-mono text-white">
                    ${item.price.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-green-400 font-mono flex items-center justify-end gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    {item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Marketplace Card Grid Component */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-1">
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
                className="bg-[#111418]/60 border border-[#1e293b]/60 rounded-lg overflow-hidden group hover:border-[#38bdf8]/80 transition-all duration-300 flex flex-col cursor-pointer hover:shadow-[0_0_20px_rgba(56,189,248,0.2)]"
              >
                <div className="aspect-[3/4] bg-gradient-to-b from-white/5 to-black/40 p-2 relative flex items-center justify-center">
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-full object-contain filter drop-shadow-md group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                    <div className="w-1/2 h-full bg-white/10 rounded-sm border border-white/20"></div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 rounded border border-white/20 bg-black/60 flex items-center justify-center group-hover:border-[#38bdf8]">
                      {i % 2 === 0 && (
                        <Check className="w-3 h-3 text-[#38bdf8]" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/85 backdrop-blur px-1.5 py-1 rounded text-[9px] font-mono border border-white/10 uppercase text-center truncate text-amber-300 font-bold">
                      {card.grade} | {card.name}
                    </div>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1 bg-black/60 border-t border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-[#94a3b8]">
                      Market
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      ${card.price.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[9px] font-mono">
                    <span className="text-green-400">{card.change}</span>
                    <span className="text-[#38bdf8] group-hover:underline">INSPECT</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column B: LIVE INTERACTIVE FLOOR PLAN */}
        <section className="col-span-1 md:col-span-5 flex flex-col gap-4 border-l border-r border-[#1e293b]/40 px-2 lg:px-4 overflow-hidden">
          <div className="flex flex-col gap-1 text-center bg-[#111418]/50 py-2 border border-[#1e293b]/40 rounded-lg">
            <span className="text-[10px] text-[#94a3b8] font-mono tracking-[0.2em] uppercase">
              Los Angeles Expo - Day 2
            </span>
            <h2 className="text-xs sm:text-sm font-bold tracking-widest text-[#38bdf8]">
              LIVE INTERACTIVE FLOOR PLAN
            </h2>
          </div>

          {/* Live Stream Overlays */}
          <div className="flex gap-4 mb-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#f472b6] animate-pulse" />
              <span className="text-xs text-white uppercase font-semibold">
                Buyers
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-60">
              <div className="w-2 h-2 rounded-full bg-[#2dd4bf]" />
              <span className="text-xs text-white uppercase font-semibold">
                Foot traffic
              </span>
            </div>
          </div>

          <div className="relative flex-1 bg-[#0a0c10] border border-[#1e293b]/50 rounded-xl overflow-hidden flex flex-col min-h-[360px]">
            {/* Map Container Placeholder */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293715_1px,transparent_1px),linear-gradient(to_bottom,#1f293715_1px,transparent_1px)] bg-[size:24px_24px] opacity-40"></div>

            <div className="absolute inset-0 p-6 flex flex-col justify-center relative">
              {/* Fake Data Paths */}
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-t-2 border-l-2 border-[#f472b6]/40 rounded-tl-3xl shadow-[0_0_15px_rgba(236,72,153,0.3)]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 border-b-2 border-r-2 border-[#2dd4bf]/40 rounded-br-3xl shadow-[0_0_15px_rgba(45,212,191,0.3)]"></div>

              {/* Interactive Points */}
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-[#f472b6] rounded-full shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-[#2dd4bf] rounded-full shadow-[0_0_20px_rgba(45,212,191,0.8)] animate-pulse delay-75"></div>
              <div className="absolute top-1/2 right-1/4 w-2.5 h-2.5 bg-[#c084fc] rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>

              {/* Layout Boxes */}
              <div className="grid grid-cols-4 gap-4 h-full relative z-10">
                <div className="col-span-1 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-[#94a3b8] uppercase font-mono rounded hover:border-white/30 transition-colors">
                  Booth 1-4
                </div>
                <div className="col-span-2 border border-[#38bdf8]/40 bg-[#38bdf8]/10 flex items-center justify-center flex-col gap-2 relative overflow-hidden rounded-lg shadow-[0_0_25px_rgba(56,189,248,0.15)]">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#38bdf8]/20 to-transparent"></div>
                  <span className="text-xs text-[#38bdf8] font-bold tracking-widest relative z-10 flex items-center gap-2">
                    <Zap className="w-4 h-4 animate-bounce" /> MAIN STAGE
                  </span>
                  <span className="text-[9px] font-mono text-white/80 relative z-10 bg-black/60 px-2 py-0.5 rounded">
                    LIVE: Rare Charizard Auction
                  </span>
                </div>
                <div className="col-span-1 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-[#94a3b8] text-center uppercase p-2 font-mono rounded hover:border-white/30 transition-colors">
                  TCG Vendors
                  <br />
                  (A-M)
                </div>

                <div className="col-span-2 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-[#94a3b8] uppercase mt-3 font-mono rounded hover:border-white/30 transition-colors">
                  Artist Alley
                </div>
                <div
                  onClick={() => {
                    setSelectedVendor({
                      name: "DOVAKINJI COLLECTIBLES",
                      rating: "4.9 / 5",
                      activeListings: "1,890+ Items",
                      completedTrans: "8,400+",
                      booth: "Booth 104",
                      specialties: ["Japanese S&V Promos", "151 Master Sets", "High Class Boxes"],
                      discountScore: 88,
                    });
                  }}
                  className="col-span-2 border border-[#f472b6]/40 bg-[#f472b6]/10 flex items-center justify-center text-[10px] text-[#f472b6] font-bold uppercase mt-3 shadow-[0_0_15px_rgba(236,72,153,0.2)_inset] rounded cursor-pointer hover:bg-[#f472b6]/20 transition-colors"
                >
                  Dovakinji (104) - CLICK TO VIEW
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-black/80 backdrop-blur border-t border-[#1e293b]/50 p-2.5 flex flex-wrap justify-between text-[10px] font-mono text-[#94a3b8] gap-2">
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#f472b6] rounded-full"></span>{" "}
                  1. High Traffic
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#2dd4bf] rounded-full"></span>{" "}
                  2. VIP Access
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-[#c084fc] rounded-full"></span>{" "}
                  3. Vendor Loading
                </span>
              </div>
              <div className="flex gap-4">
                <span>4. Restrooms</span>
                <span>5. Exit</span>
                <span>6. Staff Only</span>
              </div>
            </div>
          </div>
        </section>

        {/* Column C: EVENT INTELLIGENCE & LIVE FEEDS */}
        <section className="col-span-1 md:col-span-3 flex flex-col gap-4 md:gap-6 overflow-y-auto pl-2">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 border-b border-[#1e293b]/50 pb-2">
              <Crosshair className="w-4 h-4 text-[#c084fc]" />
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                EVENT INTELLIGENCE
              </h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <h3 className="text-[10px] text-[#94a3b8] font-mono uppercase tracking-widest">
                LIVE ALERTS & MARKET PULSE
              </h3>

              <div className="flex flex-col gap-2">
                {[
                  { title: "Live Overview", code: "SYS-00", active: true },
                  { title: "Main Stage Auction", code: "J-101", active: true, highlight: false },
                  {
                    title: "Dovakinji Booth",
                    code: "V-104",
                    active: true,
                    highlight: true,
                  },
                ].map((feed, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2.5 rounded border transition-colors ${
                      feed.highlight
                        ? "bg-[#f472b6]/15 border-[#f472b6]/40 shadow-[0_0_12px_rgba(236,72,153,0.15)]"
                        : "bg-[#111418]/60 border-[#1e293b]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-black/80 rounded flex items-center justify-center border border-white/10">
                        <Camera className="w-3.5 h-3.5 text-[#94a3b8]" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-bold ${
                            feed.highlight ? "text-[#f472b6]" : "text-white"
                          }`}
                        >
                          {feed.title}
                        </span>
                        <span className="text-[9px] font-mono text-[#94a3b8]">
                          {feed.code} | {feed.active ? "REC" : "STBY"}
                        </span>
                      </div>
                    </div>
                    {feed.active && (
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.8)]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2 border-b border-[#1e293b]/50 pb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="text-xs sm:text-sm font-bold tracking-wider text-white uppercase">
                SELECTED VENDOR PROFILE
              </h2>
            </div>

            <div className="bg-[#111418]/70 border border-[#1e293b]/60 rounded-lg p-4 flex flex-col gap-4 shadow-lg">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-[#94a3b8] uppercase tracking-widest font-mono">
                  Selected Vendor:
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-black text-white tracking-wide">
                    {selectedVendor.name}
                  </h3>
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-400 text-[9px] font-bold uppercase rounded border border-yellow-500/40 flex items-center gap-1 shrink-0">
                    Premier <Check className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-mono">
                    Active Listings
                  </span>
                  <span className="font-mono font-bold text-white">
                    {selectedVendor.activeListings}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-mono">
                    Completed Trans.
                  </span>
                  <span className="font-mono font-bold text-white">
                    {selectedVendor.completedTrans}
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[9px] text-[#94a3b8] uppercase font-mono">
                    User Rating
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
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

              <div className="flex flex-col gap-2 mt-1">
                <h4 className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono border-b border-[#1e293b]/50 pb-1">
                  Vendor's Featured Inventory Spotlight
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { name: "Base Charizard", grade: "PSA 10", price: "24k" },
                    { name: "Lugia 1st Ed", grade: "BGS 9.5", price: "18k" },
                    { name: "Mewtwo Gold", grade: "CGC 10", price: "8k" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-black/60 border border-[#1e293b]/50 rounded p-1.5 flex flex-col items-center text-center gap-1 hover:border-[#38bdf8]/50 transition-colors cursor-pointer"
                    >
                      <div className="w-full aspect-[3/4] bg-gradient-to-tr from-amber-500/20 to-purple-500/20 rounded-sm flex items-center justify-center border border-white/10">
                        <Award className="w-4 h-4 text-amber-400" />
                      </div>
                      <span className="text-[8px] font-bold leading-tight text-white truncate w-full">
                        {item.name}
                      </span>
                      <div className="flex w-full justify-between items-center px-0.5">
                        <span className="text-[7px] text-[#38bdf8] font-bold">
                          {item.grade}
                        </span>
                        <span className="text-[8px] font-mono text-green-400 font-bold">
                          ${item.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-[9px] text-[#94a3b8] uppercase tracking-widest font-mono border-b border-[#1e293b]/50 pb-1">
                  Vendor Specialties & Insights
                </h4>
                <div className="flex gap-4 items-center">
                  <ul className="text-[10px] text-white/80 list-disc list-inside flex-1 leading-relaxed">
                    {selectedVendor.specialties.map((spec, index) => (
                      <li key={index}>{spec}</li>
                    ))}
                  </ul>

                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center mr-1">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-full h-full transform -rotate-90"
                    >
                      <path
                        className="text-black/60"
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
                    <span className="absolute text-[10px] font-mono font-bold text-white">
                      {selectedVendor.discountScore}%
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-[#2dd4bf] font-bold tracking-wide uppercase text-right block mt-[-8px]">
                  TENDS TO OFFER GOOD DEALS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#1e293b]/50">
                <button className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 px-3 rounded transition-colors text-center truncate border border-white/10">
                  [View All Listings]
                </button>
                <button className="bg-[#38bdf8] hover:bg-[#38bdf8]/90 text-black text-xs font-black py-2 px-3 rounded transition-colors text-center flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(56,189,248,0.4)]">
                  [Message Vendor] <Zap className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
              <div className="text-center mt-1">
                <span className="text-xs text-[#38bdf8] hover:underline flex items-center justify-center gap-1 cursor-pointer">
                  {selectedVendor.booth} (Map Link) <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="h-12 bg-[#050608] border-t border-[#1e293b]/50 shrink-0 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,var(--tw-gradient-stops))] from-[#38bdf8]/20 via-[#050608] to-[#050608]"></div>

        {/* Stylized Cityscape (CSS Placeholder) */}
        <div className="absolute bottom-4 left-0 right-0 h-16 flex items-end justify-center opacity-15 pointer-events-none px-20 gap-8">
          <div className="w-12 h-16 border-t border-l border-r border-[#38bdf8]/50"></div>
          <div className="w-8 h-24 border-t border-l border-r border-[#2dd4bf]/50 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[16px] border-l-transparent border-r-transparent border-b-[#2dd4bf]/50"></div>
          </div>
          <div className="w-20 h-10 border-t border-l border-r border-[#f472b6]/50"></div>
          <div className="w-16 h-20 border-t border-l border-r border-[#38bdf8]/50"></div>
          <div className="w-10 h-32 border-t border-l border-r border-[#c084fc]/50"></div>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className="text-xs md:text-sm font-bold tracking-[0.5em] text-white/40 uppercase">
            GLOBAL CIRCUIT - LOS ANGELES EXPO
          </span>
        </div>

        <div className="h-5 bg-[#38bdf8] text-black flex items-center px-4 relative z-10 overflow-hidden text-[9px] font-mono font-bold tracking-wider uppercase shrink-0">
          <div className="animate-[marquee_25s_linear_infinite] whitespace-nowrap">
            Simulated Transaction: Buyer 409 acquired 1st Ed Base Set Charizard
            from 'Vintage Vault' &nbsp;&nbsp; | &nbsp;&nbsp; ALERT: SYS-00
            Network Sync Complete &nbsp;&nbsp; | &nbsp;&nbsp; Simulated
            Transaction: Buyer 12 acquired MTG Black Lotus (BGS 9.5) from 'Alpha
            Investments' &nbsp;&nbsp; | &nbsp;&nbsp; PSA 10 Moonbreon just sold for $1,420 at Booth 104
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CardShowView;
