import React, { useState } from "react"
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
  X,
  Wallet,
  ArrowLeftRight,
  Coins,
  Info,
} from "lucide-react"

// Note: Ensure we have the fallback image component if this is a standard Make template. If not we'll use a standard img or div.
// I will create a placeholder if it doesn't exist.

type PaymentMode = "cash" | "trade" | "mix"

type InventoryItem = {
  id: string
  name: string
  grade: string
  price: number
}

type OwnedCard = {
  id: string
  name: string
  grade: string
  tradeValue: number
}

const App = () => {
  const [acquireTarget, setAcquireTarget] = useState<InventoryItem | null>(null)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("mix")
  const [selectedOwnedId, setSelectedOwnedId] = useState<string | null>(null)

  const featuredInventory: InventoryItem[] = [
    { id: "inv-1", name: "Base Charizard", grade: "PSA 10", price: 24000 },
    { id: "inv-2", name: "Lugia 1st Ed", grade: "BGS 9.5", price: 12000 },
    { id: "inv-3", name: "Mewtwo Gold", grade: "CGC 10", price: 8000 },
  ]

  const ownedCollection: OwnedCard[] = [
    { id: "own-1", name: "Base Charizard", grade: "PSA 9", tradeValue: 15000 },
    { id: "own-2", name: "Lugia 1st Ed", grade: "BGS 9", tradeValue: 9000 },
    { id: "own-3", name: "Mewtwo Gold", grade: "CGC 9", tradeValue: 5000 },
    { id: "own-4", name: "Pikachu Illustrator", grade: "PSA 10", tradeValue: 3500 },
  ]

  const selectedOwned = ownedCollection.find((c) => c.id === selectedOwnedId) || null
  const tradeValue = selectedOwned?.tradeValue ?? 0
  const cashDue =
    paymentMode === "cash"
      ? acquireTarget?.price ?? 0
      : paymentMode === "trade"
        ? 0
        : Math.max(0, (acquireTarget?.price ?? 0) - tradeValue)
  const canConfirm =
    !!acquireTarget &&
    (paymentMode === "cash" ||
      (paymentMode === "trade" && !!selectedOwned && tradeValue >= (acquireTarget?.price ?? 0)) ||
      (paymentMode === "mix" && !!selectedOwned))

  const resetAcquire = () => {
    setAcquireTarget(null)
    setPaymentMode("mix")
    setSelectedOwnedId(null)
  }

  const fmt = (n: number) => `$${n.toLocaleString()}`

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-4 w-64">
          <button className="p-2 hover:bg-white/5 rounded-md transition-colors text-muted-foreground hover:text-foreground">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">
              System
            </span>
            <span className="text-sm font-semibold tracking-wide text-primary">
              OP-CORE
            </span>
          </div>
        </div>

        <div className="flex-1 flex justify-center">
          <h1 className="text-xl md:text-2xl font-bold tracking-widest bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
            GLOBAL CARD SHOW CIRCUIT
          </h1>
        </div>

        <div className="flex items-center gap-6 w-64 justify-end">
          <div className="relative group hidden md:block">
            <input
              type="text"
              placeholder="Search Expo..."
              className="bg-black/40 border border-border/50 rounded-full py-1.5 pl-4 pr-9 text-sm w-48 focus:outline-none focus:border-primary/50 transition-colors text-white placeholder:text-muted-foreground"
            />
            <Search className="w-4 h-4 text-muted-foreground absolute right-3 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
          </div>

          <div className="flex flex-col items-center gap-1 cursor-pointer group">
            <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest group-hover:text-primary transition-colors">
              Bash Floor
            </span>
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-pink-accent to-purple-accent p-[1px]">
                <div className="w-full h-full bg-black rounded-full flex items-center justify-center overflow-hidden">
                  <div className="w-full h-full bg-white/10" />
                </div>
              </div>
              <div className="relative">
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-white transition-colors" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink-accent rounded-full animate-pulse shadow-[0_0_8px_rgba(236,72,153,0.8)]" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden h-[calc(100vh-4rem-3rem)]">
        {/* Column A: EXPO MARKETPLACE & VENDOR GALLERY */}
        <section className="col-span-1 md:col-span-4 flex flex-col gap-4 overflow-y-auto pr-2">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-bold tracking-wider text-white">
              EXPO MARKETPLACE & VENDOR GALLERY
            </h2>
          </div>

          {/* Filter Panel */}
          <div className="bg-card/40 border border-border/50 rounded-lg p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <button className="text-xs font-mono bg-white/5 hover:bg-white/10 border border-white/10 rounded px-3 py-1.5 transition-colors">
                FILTER
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              {["Grade", "Card Type", "Set", "Borderless Set"].map((filter) => (
                <button
                  key={filter}
                  className="flex items-center justify-between bg-black/40 border border-border/50 rounded px-2 py-1.5 text-xs text-muted-foreground hover:border-white/20 transition-colors"
                >
                  <span className="truncate">{filter}</span>
                  <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                </button>
              ))}
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>$50</span>
                <span className="text-primary font-bold">$200</span>
                <span>$1,000+</span>
              </div>
              <div className="relative h-1.5 bg-black/60 rounded-full overflow-hidden">
                <div className="absolute left-[10%] right-[30%] top-0 bottom-0 bg-gradient-to-r from-primary to-teal-accent" />
              </div>
            </div>
          </div>

          {/* Dynamic Card Controls */}
          <div className="grid gap-3">
            {[37, 54].map((potential, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-card/60 to-black/40 border border-border/50 p-3 rounded-lg flex items-center justify-between gap-4"
              >
                <div className="flex-1 flex flex-col gap-1">
                  <div className="flex justify-between items-end">
                    <span className="text-xs font-bold text-white uppercase">
                      PSA 10 Charizard
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ID-{1040 + i}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      Arb. Potential:
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        potential > 50 ? "text-teal-accent" : "text-primary"
                      }`}
                    >
                      {potential}%
                    </span>
                  </div>
                  <div className="relative h-1 bg-black/60 rounded-full overflow-hidden mt-1">
                    <div
                      className={`absolute left-0 top-0 bottom-0 ${
                        potential > 50 ? "bg-teal-accent" : "bg-primary"
                      }`}
                      style={{ width: `${potential}%` }}
                    />
                  </div>
                </div>
                <div className="text-right flex flex-col gap-1 shrink-0">
                  <span className="text-sm font-bold font-mono">
                    ${(450.5 + i * 120).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-green-400 font-mono flex items-center justify-end gap-1">
                    <ArrowUpRight className="w-3 h-3" />
                    +1.2%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Marketplace Card Grid Component */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="bg-card/30 border border-border/40 rounded-lg overflow-hidden group hover:border-primary/50 transition-colors flex flex-col"
              >
                <div className="aspect-[3/4] bg-gradient-to-b from-white/5 to-black/20 p-2 relative">
                  <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                    <div className="w-1/2 h-full bg-white/10 rounded-sm border border-white/20"></div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <div className="w-4 h-4 rounded border border-white/20 bg-black/40 flex items-center justify-center group-hover:border-primary cursor-pointer">
                      {i % 3 === 0 && (
                        <Check className="w-3 h-3 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/80 backdrop-blur px-2 py-1 rounded text-[9px] font-mono border border-white/10 uppercase text-center truncate">
                      PSA {10 - (i % 3)} Charizard
                    </div>
                  </div>
                </div>
                <div className="p-2 flex flex-col gap-1 bg-black/40">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-muted-foreground">
                      Market
                    </span>
                    <span className="text-xs font-mono font-bold text-white">
                      ${(1200 - i * 50).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Column B: LIVE INTERACTIVE FLOOR PLAN */}
        <section className="col-span-1 md:col-span-5 flex flex-col gap-4 border-l border-r border-border/30 px-2 lg:px-4 overflow-hidden">
          <div className="flex flex-col gap-1 text-center bg-card/20 py-2 border border-border/30 rounded-lg">
            <span className="text-[10px] text-muted-foreground font-mono tracking-[0.2em] uppercase">
              Los Angeles Expo - Day 2
            </span>
            <h2 className="text-sm font-bold tracking-widest text-primary">
              LIVE INTERACTIVE FLOOR PLAN
            </h2>
          </div>

          {/* Live Stream Overlays */}
          <div className="flex gap-4 mb-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-pink-accent animate-pulse" />
              <span className="text-xs text-white uppercase font-semibold">
                Buyers
              </span>
            </div>
            <div className="flex items-center gap-2 opacity-50">
              <div className="w-2 h-2 rounded-full bg-teal-accent" />
              <span className="text-xs text-white uppercase font-semibold">
                Foot traffic
              </span>
            </div>
          </div>

          <div className="relative flex-1 bg-[#0a0c10] border border-border/50 rounded-xl overflow-hidden flex flex-col">
            {/* Map Container Placeholder */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

            <div className="absolute inset-0 p-6 flex flex-col justify-center relative">
              {/* Fake Data Paths */}
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 border-t-2 border-l-2 border-pink-accent/40 rounded-tl-3xl shadow-[0_0_15px_rgba(236,72,153,0.3)]"></div>
              <div className="absolute bottom-1/4 right-1/4 w-1/2 h-1/2 border-b-2 border-r-2 border-teal-accent/40 rounded-br-3xl shadow-[0_0_15px_rgba(45,212,191,0.3)]"></div>

              {/* Interactive Points */}
              <div className="absolute top-1/3 left-1/3 w-3 h-3 bg-pink-accent rounded-full shadow-[0_0_20px_rgba(236,72,153,0.8)] animate-pulse"></div>
              <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-teal-accent rounded-full shadow-[0_0_20px_rgba(45,212,191,0.8)] animate-pulse delay-75"></div>
              <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-purple-accent rounded-full shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>

              {/* Layout Boxes */}
              <div className="grid grid-cols-4 gap-4 h-full relative z-10">
                <div className="col-span-1 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground uppercase">
                  Booth 1-4
                </div>
                <div className="col-span-2 border border-primary/20 bg-primary/5 flex items-center justify-center flex-col gap-2 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent"></div>
                  <span className="text-xs text-primary font-bold tracking-widest relative z-10">
                    MAIN STAGE
                  </span>

                </div>
                <div className="col-span-1 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground text-center uppercase p-2">
                  TCG Vendors
                  <br />
                  (A-M)
                </div>

                <div className="col-span-2 border border-white/10 bg-white/5 flex items-center justify-center text-[10px] text-muted-foreground uppercase mt-4">
                  Artist Alley
                </div>
                <div className="col-span-2 border border-pink-accent/20 bg-pink-accent/5 flex items-center justify-center text-[10px] text-pink-accent/80 font-bold uppercase mt-4 shadow-[0_0_10px_rgba(236,72,153,0.1)_inset]">
                  Dovakinji (104)
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur border-t border-border/50 p-2 flex justify-between text-[10px] font-mono text-muted-foreground">
              <div className="flex gap-4">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-pink-accent rounded-full"></span>{" "}
                  1. High Traffic
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-teal-accent rounded-full"></span>{" "}
                  2. VIP Access
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-purple-accent rounded-full"></span>{" "}
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
        <section className="col-span-1 md:col-span-3 flex flex-col gap-6 overflow-y-auto pl-2">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Crosshair className="w-4 h-4 text-purple-accent" />
              <h2 className="text-sm font-bold tracking-wider text-white">
                EVENT INTELLIGENCE
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              <h3 className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">
                LIVE ALERTS & MARKET PULSE
              </h3>

              <div className="flex flex-col gap-2">
                {[
                  { title: "Live Overview", code: "SYS-00", active: true },
                  { title: "Main Stage", code: "J-101", active: false },
                  {
                    title: "Dovakinji",
                    code: "V-104",
                    active: true,
                    highlight: true,
                  },
                ].map((feed, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between p-2 rounded border ${
                      feed.highlight
                        ? "bg-pink-accent/10 border-pink-accent/30"
                        : "bg-card/40 border-border/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-6 bg-black/60 rounded flex items-center justify-center">
                        <Camera className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-bold ${
                            feed.highlight ? "text-pink-accent" : "text-white"
                          }`}
                        >
                          {feed.title}
                        </span>
                        <span className="text-[9px] font-mono text-muted-foreground">
                          {feed.code} | {feed.active ? "REC" : "STBY"}
                        </span>
                      </div>
                    </div>
                    {feed.active && (
                      <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 flex-1">
            <div className="flex items-center gap-2 border-b border-border/50 pb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <h2 className="text-sm font-bold tracking-wider text-white">
                SELECTED VENDOR PROFILE
              </h2>
            </div>

            <div className="bg-card/40 border border-border/50 rounded-lg p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
                  Selected Vendor:
                </span>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    VINTAGEVAULT TCG
                  </h3>
                  <span className="px-1.5 py-0.5 bg-yellow-500/20 text-yellow-500 text-[9px] font-bold uppercase rounded border border-yellow-500/30 flex items-center gap-1">
                    Premier <Check className="w-2.5 h-2.5" />
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-muted-foreground uppercase">
                    Active Listings
                  </span>
                  <span className="font-mono font-bold text-white">
                    3,450+ Items
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] text-muted-foreground uppercase">
                    Completed Trans.
                  </span>
                  <span className="font-mono font-bold text-white">
                    12,800+
                  </span>
                </div>
                <div className="flex flex-col gap-1 col-span-2">
                  <span className="text-[9px] text-muted-foreground uppercase">
                    User Rating
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white">
                      4.8 / 5
                    </span>
                    <div className="flex gap-0.5 text-yellow-500">
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 fill-current" />
                      <Star className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-2">
                <h4 className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono border-b border-border/50 pb-1">
                  Vendor's Featured Inventory Spotlight
                </h4>
                <div className="grid grid-cols-3 gap-2">
                  {featuredInventory.map((item) => (
                    <div
                      key={item.id}
                      className="bg-black/40 border border-border/30 rounded p-1 flex flex-col items-center text-center gap-1"
                    >
                      <div className="w-full aspect-[3/4] bg-white/5 rounded-sm flex items-center justify-center border border-white/10"></div>
                      <span className="text-[8px] font-bold leading-tight">
                        {item.name}
                      </span>
                      <div className="flex w-full justify-between items-center px-1">
                        <span className="text-[7px] text-primary">
                          {item.grade}
                        </span>
                        <span className="text-[8px] font-mono">
                          {fmt(item.price)}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setAcquireTarget(item)
                          setPaymentMode("mix")
                          setSelectedOwnedId(ownedCollection[0]?.id ?? null)
                        }}
                        className="w-full mt-0.5 bg-primary/90 hover:bg-primary text-primary-foreground text-[7px] font-bold py-1 rounded transition-colors"
                      >
                        ACQUIRE
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3 mt-2">
                <h4 className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono border-b border-border/50 pb-1">
                  Vendor Specialties & Insights
                </h4>
                <div className="flex gap-4 items-center">
                  <ul className="text-[10px] text-white/80 list-disc list-inside flex-1 leading-relaxed">
                    <li>WOTC Japanese (Kanji)</li>
                    <li>e-Series (JPN)</li>
                    <li>Neo Destiny</li>
                  </ul>

                  <div className="relative w-12 h-12 shrink-0 flex items-center justify-center mr-2">
                    <svg
                      viewBox="0 0 36 36"
                      className="w-full h-full transform -rotate-90"
                    >
                      <path
                        className="text-black/50"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="text-teal-accent"
                        strokeDasharray="75, 100"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-mono font-bold text-white">
                      75%
                    </span>
                  </div>
                </div>
                <span className="text-[9px] text-teal-accent font-bold tracking-wide uppercase text-right block mt-[-8px]">
                  TENDS TO OFFER GOOD DEALS
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/50">
                <button className="bg-white/5 hover:bg-white/10 text-white text-xs py-2 px-3 rounded transition-colors text-center truncate border border-white/10">
                  [View All VINTAGEVAULT TCG Listings]
                </button>
                <button className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold py-2 px-3 rounded transition-colors text-center flex items-center justify-center gap-1">
                  [Message Vendor] <Zap className="w-3 h-3" />
                </button>
              </div>
              <div className="text-center mt-2">
                <a
                  href="#"
                  className="text-xs text-primary hover:underline flex items-center justify-center gap-1"
                >
                  Booth 104 (Map Link) <ArrowUpRight className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Global Footer */}
      <footer className="h-12 bg-[#050608] border-t border-border/50 shrink-0 flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-[#050608] to-[#050608]"></div>

        {/* Stylized Cityscape (CSS Placeholder) */}
        <div className="absolute bottom-4 left-0 right-0 h-16 flex items-end justify-center opacity-10 pointer-events-none px-20 gap-8">
          <div className="w-12 h-16 border-t border-l border-r border-primary/50"></div>
          <div className="w-8 h-24 border-t border-l border-r border-teal-accent/50 relative">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[4px] border-r-[4px] border-b-[16px] border-l-transparent border-r-transparent border-b-teal-accent/50"></div>
          </div>
          <div className="w-20 h-10 border-t border-l border-r border-pink-accent/50"></div>
          <div className="w-16 h-20 border-t border-l border-r border-primary/50"></div>
          <div className="w-10 h-32 border-t border-l border-r border-purple-accent/50"></div>
        </div>

        <div className="flex-1 flex items-center justify-center relative z-10">
          <span className="text-xs md:text-sm font-bold tracking-[0.5em] text-white/40 uppercase">
            HOLLYWOOD HILLS
          </span>
        </div>

        <div className="h-5 bg-primary text-primary-foreground flex items-center px-4 relative z-10 overflow-hidden text-[9px] font-mono font-bold tracking-wider uppercase shrink-0">
          <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap">
            Simulated Transaction: Buyer 409 acquired 1st Ed Base Set Charizard
            from 'Vintage Vault' &nbsp;&nbsp; | &nbsp;&nbsp; ALERT: SYS-00
            Network Sync Complete &nbsp;&nbsp; | &nbsp;&nbsp; Simulated
            Transaction: Buyer 12 acquired MTG Black Lotus (BGS 9.5) from 'Alpha
            Investments'
          </div>
        </div>
      </footer>

      {/* Acquire Card Modal */}
      {acquireTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4"
          onClick={resetAcquire}
        >
          <div
            className="bg-[#0b0e14] border border-border/60 rounded-xl w-full max-w-md p-5 flex flex-col gap-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
                  Acquire From VINTAGEVAULT TCG
                </span>
                <h3 className="text-lg font-bold text-white tracking-wide">
                  {acquireTarget.name}
                </h3>
                <span className="text-[10px] text-primary font-mono">
                  {acquireTarget.grade}
                </span>
              </div>
              <button
                onClick={resetAcquire}
                className="p-1.5 hover:bg-white/10 rounded-md transition-colors text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between bg-black/40 border border-border/50 rounded-lg px-4 py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
                Listed Price
              </span>
              <span className="text-xl font-bold font-mono text-white">
                {fmt(acquireTarget.price)}
              </span>
            </div>

            {/* Payment Mode */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
                Payment Method
              </span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setPaymentMode("cash")
                    setSelectedOwnedId(null)
                  }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                    paymentMode === "cash"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-black/40 border-border/50 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <Wallet className="w-4 h-4" />
                  Full Cash
                </button>
                <button
                  onClick={() => setPaymentMode("trade")}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                    paymentMode === "trade"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-black/40 border-border/50 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Trade Card
                </button>
                <button
                  onClick={() => {
                    setPaymentMode("mix")
                    if (!selectedOwnedId)
                      setSelectedOwnedId(ownedCollection[0]?.id ?? null)
                  }}
                  className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-[10px] font-bold uppercase transition-colors ${
                    paymentMode === "mix"
                      ? "bg-primary/20 border-primary text-primary"
                      : "bg-black/40 border-border/50 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Card + Cash
                </button>
              </div>
            </div>

            {/* Owned Card Selection (trade & mix) */}
            {(paymentMode === "trade" || paymentMode === "mix") && (
              <div className="flex flex-col gap-2">
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
                  Select A Card You Own To Trade
                </span>
                <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-1">
                  {ownedCollection.map((card) => {
                    const active = selectedOwnedId === card.id
                    const covers = card.tradeValue >= acquireTarget.price
                    return (
                      <button
                        key={card.id}
                        onClick={() => setSelectedOwnedId(card.id)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg border text-left transition-colors ${
                          active
                            ? "bg-primary/15 border-primary"
                            : "bg-black/40 border-border/50 hover:border-white/20"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-white">
                            {card.name}
                          </span>
                          <span className="text-[9px] text-primary font-mono">
                            {card.grade}
                          </span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] text-muted-foreground uppercase">
                            Trade Value
                          </span>
                          <span className="text-xs font-mono font-bold text-teal-accent">
                            {fmt(card.tradeValue)}
                          </span>
                          {paymentMode === "trade" && !covers && (
                            <span className="text-[7px] text-red-400 uppercase">
                              Below price
                            </span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex flex-col gap-1.5 bg-black/40 border border-border/50 rounded-lg px-4 py-3">
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Trade-in</span>
                <span className="text-teal-accent">
                  {paymentMode === "cash" || !selectedOwned
                    ? fmt(0)
                    : `- ${fmt(tradeValue)}`}
                </span>
              </div>
              <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                <span>Cash Due</span>
                <span className="text-white font-bold">{fmt(cashDue)}</span>
              </div>
              {paymentMode === "mix" && selectedOwned && (
                <div className="flex items-center gap-1.5 pt-1 text-[9px] text-pink-accent/80">
                  <Info className="w-3 h-3 shrink-0" />
                  <span>
                    Trading your {selectedOwned.name} ({selectedOwned.grade}) +
                    paying the rest in cash.
                  </span>
                </div>
              )}
            </div>

            {/* Confirm */}
            <button
              disabled={!canConfirm}
              onClick={() => {
                // Simulated acquisition confirmation
                resetAcquire()
              }}
              className="w-full bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground text-sm font-bold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {paymentMode === "cash"
                ? `Confirm — Pay ${fmt(cashDue)} Cash`
                : paymentMode === "trade"
                  ? `Confirm — Trade ${selectedOwned?.name ?? "Card"}`
                  : `Confirm — Trade + ${fmt(cashDue)} Cash`}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
