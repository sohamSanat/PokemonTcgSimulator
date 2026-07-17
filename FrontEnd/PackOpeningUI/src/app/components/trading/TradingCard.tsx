import React, { useState, useEffect } from "react"
import { motion } from "motion/react"
import {
  Plus,
  ArrowRight,
  ArrowLeft,
  RefreshCcw,
  ShieldCheck,
  Zap,
  X,
} from "lucide-react"

import { getCollectedCards, Card } from "../binder/types"
import { getCombinedVendorCardPool, isJapaneseVendorCard } from "../../services/auctionVendorPools"
import { loadJapaneseMetadata } from "../../services/scrydex"
import { handleCardImageError } from "../../services/tcgdex"

/**
 * Convert any scrydex.com URL → pokemontcg.io _hires.png URL.
 * pokemontcg.io returns real HTTP 404 for missing cards, so <img onError> fires
 * naturally and the handleCardImageError fallback chain takes over.
 * scrydex silently serves a generic card-back at HTTP 200, blocking onError.
 */
function toPokeIoUrl(img: string, setId: string, num: string): string {
  if (!img.includes('scrydex.com')) return img          // already reliable
  const cleanSet = setId.replace(/_ja$/i, '').toLowerCase()
  const cleanNum  = String(num || '1')
  return `https://images.pokemontcg.io/${cleanSet}/${cleanNum}_hires.png`
}

export const TradingCard: React.FC<{ 
  onClose?: () => void,
  onInspectCard?: (card: any) => void,
  onImageLoad?: (e: any, id: string, isJp: boolean) => void,
  onImageError?: (e: any, id: string, isJp: boolean) => void
}> = ({ onClose, onInspectCard }) => {
  const [cashOffer, setCashOffer] = useState(12500)
  const [userCards, setUserCards] = useState<Card[]>([])
  const [sellerCards, setSellerCards] = useState<any[]>([])

  useEffect(() => {
    let cancelled = false

    // Load user's binders
    const cards = getCollectedCards()
    setUserCards(cards)

    const shuffle = <T,>(arr: T[]): T[] => {
      const copy = [...arr]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[copy[i], copy[j]] = [copy[j], copy[i]]
      }
      return copy
    }

    // ── Load Japanese metadata FIRST so the dynamic pool has real cards ──────
    loadJapaneseMetadata().then(() => {
      if (cancelled) return

      const pool = getCombinedVendorCardPool(4000)

      // Deduplicate by originalId so we never show the same card twice
      const seenIds = new Set<string>()
      const uniquePool = pool.filter(c => {
        const key = c.originalId || c.id
        if (!key || seenIds.has(key)) return false
        seenIds.add(key)
        return true
      })

      const english  = shuffle(uniquePool.filter(c => !isJapaneseVendorCard(c)))
      const japanese = shuffle(uniquePool.filter(c =>  isJapaneseVendorCard(c)))

      const TARGET = 250
      const result: any[] = []
      let ei = 0, ji = 0

      while (result.length < TARGET) {
        const wantEng = result.length % 2 === 0
        const src =
          wantEng && ei < english.length  ? english[ei++]  :
          ji < japanese.length             ? japanese[ji++] :
          ei < english.length              ? english[ei++]  : null
        if (!src) break

        // ── KEY FIX: use pokemontcg.io as primary src so onError fires on miss ──
        const reliableImg = toPokeIoUrl(src.img, src.setId, src.num)

        result.push({
          ...src,
          img: reliableImg,
          originalImg: src.img,          // keep scrydex URL for fallback chain
          id: `${src.id}-vault-${result.length}`,
          originalId: src.originalId || src.id,
          selected: Math.random() > 0.95
        })
      }

      if (!cancelled) setSellerCards(result)
    })

    return () => { cancelled = true }
  }, [])

  // ── IMAGE HANDLERS ──────────────────────────────────────────────────────────
  // Use the pre-parsed setId/num from VendorCard directly — same approach as
  // CardShowView's handleCardShowImageError which works correctly.
  const sellerCardsRef = React.useRef<any[]>([])
  useEffect(() => { sellerCardsRef.current = sellerCards }, [sellerCards])

  const handleVaultImageError = React.useCallback((
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    cardId?: string,
    isJpn?: boolean
  ) => {
    const img = e.currentTarget

    // Look up the card — setId/num are pre-parsed on every VendorCard
    const cardItem = sellerCardsRef.current.find(
      c => c.id === cardId || c.originalId === cardId
    )

    let setId = cardItem?.setId || 'swsh3'
    let num   = cardItem?.num !== undefined ? String(cardItem.num) : '1'

    // If lookup failed, parse from current src URL
    if (!cardItem || setId === 'swsh3') {
      const m =
        img.src.match(/pokemontcg\.io\/([a-z0-9_-]+)\/([0-9]+)/i) ||
        img.src.match(/\/pokemon\/([a-z0-9_]+)[_-]([0-9]+)(?:\/|$)/i) ||
        img.src.match(/\/([a-z0-9_-]+)[/-]([0-9]+)(?:\/large|\/high|\.png|\.webp|_hires)/i)
      if (m) { setId = m[1]; num = m[2] }
    }

    const origStr = cardItem?.originalId || cardItem?.id || cardId || ''
    const isJpnCard = Boolean(
      isJpn ||
      setId.toLowerCase().includes('_ja') ||
      origStr.includes('_ja') ||
      cardItem?.name?.toLowerCase().includes('japanese')
    )
    if (isJpnCard && !setId.toLowerCase().includes('_ja')) {
      setId = `${setId.replace(/_ja$/i, '')}_ja`
    }

    handleCardImageError(img, setId, num, () => {
      img.src = isJpnCard
        ? 'https://images.pokemontcg.io/swsh12a/196_hires.png'
        : 'https://images.pokemontcg.io/swsh3/19_hires.png'
    })
  }, [])
  // ───────────────────────────────────────────────────────────────────────────

  const totalCardValue = userCards.reduce((acc, card) => acc + (card.currentPrice || 0), 0)
  const totalOfferValue = totalCardValue + cashOffer


  return (
    <div className="fixed inset-0 z-[200] w-full h-full bg-[#050b14] font-sans text-gray-200 overflow-hidden lg:overflow-hidden">
      <div className="absolute inset-0 overflow-y-auto overflow-x-hidden">
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/15 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur-md shadow-xl"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-bold font-mono tracking-widest">EXIT TRADE</span>
        </button>
      )}

      {/* Ambient Background Blur */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[rgba(0,255,255,0.1)] blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-[rgba(255,0,255,0.05)] blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] left-[40%] w-[30%] h-[30%] rounded-full bg-[rgba(0,255,128,0.05)] blur-[150px] pointer-events-none" />

      {/* Main Grid Layout */}
      <div className="relative z-10 w-full min-h-full p-4 lg:p-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 pb-24 lg:pb-6">
        {/* LEFT PANEL: User Offer */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 flex-none lg:h-full flex flex-col glass-panel rounded-2xl overflow-hidden min-h-[400px]"
        >
          <div className="p-4 lg:p-5 border-b border-[rgba(0,255,255,0.1)] flex justify-between items-center bg-[rgba(0,0,0,0.2)]">
            <h2 className="text-xl font-bold tracking-widest text-cyan-400 text-glow-cyan">
              YOUR OFFER
            </h2>
            <ShieldCheck className="text-cyan-500 w-5 h-5" />
          </div>

          <div className="p-5 flex-1 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              {userCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="relative group rounded-lg overflow-hidden border border-[rgba(0,255,255,0.2)] aspect-[3/4] cursor-pointer"
                >
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent pointer-events-none" />
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="text-xs font-bold text-white truncate">
                      {card.name}
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-cyan-300 truncate">{card.rarity}</span>
                      <span className="text-green-400 font-bold ml-1">${card.currentPrice?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 box-glow-cyan opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Add Cash Section */}
          <div className="p-6 border-t border-[rgba(0,255,255,0.1)] bg-[rgba(0,0,0,0.3)]">
            <div className="flex justify-between items-end mb-4">
              <span className="text-sm font-semibold tracking-wider text-gray-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> ADD CASH
              </span>
              <span className="text-2xl font-bold text-cyan-400 text-glow-cyan font-mono">
                ${cashOffer.toLocaleString()}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="50000"
              step="500"
              value={cashOffer}
              onChange={(e) => setCashOffer(Number(e.target.value))}
              className="w-full h-1 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="mt-3 text-xs text-gray-400 text-right font-mono flex flex-col gap-1">
              <div>
                Cards: <span className="text-white">${totalCardValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span> + Cash: <span className="text-white">${cashOffer.toLocaleString()}</span>
              </div>
              <div className="text-sm border-t border-white/10 pt-1 mt-1">
                Total Offer Value: <span className="text-cyan-300 font-bold">${totalOfferValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* CENTER PANEL: The Trade Equation */}
        <div className="lg:col-span-4 flex-none lg:h-full flex flex-col justify-center items-center px-2 py-8 lg:px-4 lg:py-0">
          <div className="w-full flex flex-col items-center gap-8 lg:gap-12">
            {/* Visual Exchange Scale */}
            <div className="w-full relative">
              <div className="flex justify-between text-xs font-bold tracking-widest text-gray-500 mb-3">
                <span>ANALYZING TRADE</span>
                <span className="text-[#00ff80] text-glow-green">
                  88% MATCH
                </span>
              </div>

              <div className="relative w-full h-3 bg-gray-900 rounded-full overflow-hidden border border-gray-800 shadow-[inset_0_2px_10px_rgba(0,0,0,1)]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "88%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 via-[#00ff80] to-[#00ff80] box-glow-green"
                />
              </div>
              <div className="absolute top-9 left-[88%] w-1 h-3 bg-white blur-[1px] transform -translate-x-1/2" />
            </div>

            {/* Glowing Arrows */}
            <div className="flex gap-4 items-center">
              <motion.div
                animate={{ x: [0, 20, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                }}
              >
                <ArrowRight className="w-10 h-10 text-cyan-400 drop-shadow-[0_0_15px_rgba(0,255,255,0.8)] opacity-70" />
              </motion.div>
              <RefreshCcw className="w-8 h-8 text-gray-600 animate-spin-slow" />
              <motion.div
                animate={{ x: [0, -20, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  ease: "easeInOut",
                  delay: 1,
                }}
              >
                <ArrowLeft className="w-10 h-10 text-magenta-500 drop-shadow-[0_0_15px_rgba(255,0,255,0.8)] opacity-70" />
              </motion.div>
            </div>

            {/* Propose Trade Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative overflow-hidden px-12 py-5 rounded-xl glass-panel-highlight border border-[#00ff80] group flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[rgba(0,255,128,0.2)] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="absolute inset-0 box-glow-green pointer-events-none"
              />
              <Zap className="w-6 h-6 text-[#00ff80]" />
              <span className="text-xl font-black tracking-widest text-white z-10 text-glow-green drop-shadow-md">
                PROPOSE TRADE
              </span>
            </motion.button>
          </div>
        </div>

        {/* RIGHT PANEL: Seller's Vault */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex-none lg:h-full flex flex-col glass-panel rounded-2xl overflow-hidden relative min-h-[500px]"
        >
          <div className="p-4 lg:p-5 border-b border-[rgba(255,0,255,0.1)] flex justify-between items-center bg-[rgba(0,0,0,0.2)]">
            <h2 className="text-xl font-bold tracking-widest text-gray-300">
              SELLER'S DIGITAL VAULT
            </h2>
            <div className="text-xs font-mono text-magenta-400">
              ID: 0x9A4F...E1B2
            </div>
          </div>

          <div className="flex-1 overflow-x-hidden overflow-y-auto p-6 scroll-smooth">
            {sellerCards.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-500">
                <RefreshCcw className="w-8 h-8 animate-spin" />
                <span className="text-xs font-mono tracking-widest">LOADING VAULT...</span>
              </div>
            ) : (
            <div className="grid grid-cols-3 gap-6 perspective-1000">
              {sellerCards.map((card, i) => {
                const isJpCard = isJapaneseVendorCard(card) ||
                  (card.originalId || '').includes('_ja') ||
                  (card.originalImg || '').includes('_ja')
                return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 1.5) }}
                  whileHover={{
                    rotateY: 10,
                    rotateX: -10,
                    zIndex: 10,
                    scale: 1.1,
                  }}
                  className={`
                    relative rounded-xl overflow-hidden aspect-[3/4] cursor-pointer
                    transition-all duration-300 transform-style-3d shadow-2xl
                    ${
                      card.selected
                        ? "border-2 border-cyan-400 box-glow-cyan scale-105"
                        : "border border-gray-700 hover:border-gray-500"
                    }
                  `}
                  data-card-container="true"
                >
                  <img
                    src={card.img}
                    alt={card.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => handleVaultImageError(e, card.id, isJpCard)}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none" />

                  {card.selected && (
                    <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_10px_#0ff] pointer-events-none" />
                  )}

                  {/* Click target overlay */}
                  <div 
                    className="absolute inset-0 z-20"
                    onClick={() => {
                      if (onInspectCard) {
                        onInspectCard({
                          id: card.id,
                          name: card.name,
                          currentPrice: typeof card.price === 'number' ? card.price : parseFloat(String(card.price || '10').replace(/[^0-9.]/g, '')),
                          isSlabbed: true,
                          slabGrade: card.grade || "PSA 9",
                          imageUrl: card.img,
                          isVendorCatalog: true,
                          vendorName: "Trade Partner",
                          vendorBooth: "Zone 8",
                          vendorRating: "Verified Trader"
                        })
                      }
                    }}
                  />

                  <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
                    <div
                      className={`text-sm font-bold truncate ${
                        card.selected ? "text-cyan-300" : "text-gray-300"
                      }`}
                    >
                      {card.name}
                    </div>
                  </div>
                </motion.div>
              )})}
            </div>
            )}
          </div>

          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a0f1e] to-transparent pointer-events-none" />
        </motion.div>
      </div>
      </div>
    </div>
  )
}

export default TradingCard
