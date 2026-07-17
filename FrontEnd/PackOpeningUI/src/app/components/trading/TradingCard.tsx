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
import { handleCardImageError } from "../../services/tcgdex"
export const TradingCard: React.FC<{ 
  onClose?: () => void,
  onInspectCard?: (card: any) => void,
  // These are now unused – image handling is self-contained below
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

    const PLACEHOLDER_BYTES = new Set([186316, 350441])
    const isRealCardImage = async (url: string): Promise<boolean> => {
      if (!url) return false
      if (!url.includes('scrydex.com')) return true
      try {
        const r = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(6000) })
        if (!r.ok) return false
        const len = Number(r.headers.get('content-length') || 0)
        return len > 0 && !PLACEHOLDER_BYTES.has(len)
      } catch {
        return true
      }
    }

    const pool = getCombinedVendorCardPool(4000)
    const english = shuffle(pool.filter(c => !isJapaneseVendorCard(c)))
    const japanese = shuffle(pool.filter(c => isJapaneseVendorCard(c)))

    const TARGET = 250
    const candidates: any[] = []
    let ei = 0
    let ji = 0
    for (let i = 0; i < TARGET * 3; i++) {
      const preferEnglish = i % 2 === 0
      let src: any
      if (preferEnglish && english.length > 0) {
        src = english[ei % english.length]; ei++
      } else if (japanese.length > 0) {
        src = japanese[ji % japanese.length]; ji++
      } else if (english.length > 0) {
        src = english[ei % english.length]; ei++
      }
      if (src) candidates.push(src)
    }

    const CONCURRENCY = 24
    const good: any[] = []
    ;(async () => {
      for (let i = 0; i < candidates.length && good.length < TARGET; i += CONCURRENCY) {
        const batch = candidates.slice(i, i + CONCURRENCY)
        const results = await Promise.all(
          batch.map(async (c) => ({ c, ok: await isRealCardImage(c.img) }))
        )
        if (cancelled) return
        for (const { c, ok } of results) {
          if (ok && good.length < TARGET) good.push(c)
        }
        setSellerCards(
          good.map((src, idx) => ({
            ...src,
            id: `${src.id}-vault-${idx}`,
            originalId: src.originalId || src.id,
            selected: Math.random() > 0.95
          }))
        )
      }
    })()

    return () => { cancelled = true }
  }, [])

  // ── SELF-CONTAINED IMAGE HANDLERS ──────────────────────────────────────────
  // These mirror the handleCardShowImageError / handleCardShowImageLoad logic
  // in CardShowView but look up cards from the local sellerCards state.
  // The key fix: pass a ref so the handlers always see the latest sellerCards.
  const sellerCardsRef = React.useRef<any[]>([])
  useEffect(() => { sellerCardsRef.current = sellerCards }, [sellerCards])

  const handleVaultImageError = React.useCallback((
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    cardId?: string,
    isJpn?: boolean
  ) => {
    const img = e.currentTarget
    let setId = 'swsh3'
    let num = '1'

    const targetId = cardId || img.dataset.imgId
    // Look up in vault cards (uses ref so it always has fresh list)
    const cardItem = sellerCardsRef.current.find(
      c => c.id === targetId || c.originalId === targetId
    )
    if (cardItem) {
      if (cardItem.setId) setId = cardItem.setId
      if (cardItem.num !== undefined) num = String(cardItem.num)
      const orig = cardItem.originalId || cardItem.id || ''
      if (orig.includes('-')) {
        const parts = orig.split('-')
        const lp = parts[0].toLowerCase()
        const isVendorPrefix = lp.includes('vault') || lp.includes('booth') || lp.includes('core') || lp.includes('vintage') ||
          lp.includes('alpha') || lp.includes('digimon') || lp.includes('slab') ||
          lp.includes('retro') || lp.includes('tcg') || lp.includes('special') || lp.includes('gold') ||
          lp.includes('sealed') || lp.includes('modern') || lp.includes('japanese') ||
          lp === 'jp' || (parts[1] && (parts[1] === 'core' || parts[1].includes('jp')))
        if (!isVendorPrefix && parts.length >= 2 && !parts[0].match(/^[0-9]+$/)) {
          setId = parts[0]; num = parts[1]
        }
      }
    }

    // Fall back: parse setId/num from the src URL
    const match = img.src.match(/\/pokemon\/([a-z0-9_-]+)[/-]([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
                  img.src.match(/\/([a-z0-9_-]+)\/([0-9]+)(\/large|\/high|\.png|\.webp|_hires)/i) ||
                  img.src.match(/\/([a-z0-9_-]+)[/-]([0-9]+)(\.png|\.webp|_hires)/i)
    if (match && (!cardItem || setId === 'swsh3')) {
      setId = match[1]; num = match[2]
    } else if (!cardItem && targetId && targetId.includes('-')) {
      const parts = targetId.split('-')
      const lp = parts[0].toLowerCase()
      const isVendorPrefix = lp.includes('vault') || lp.includes('booth') || lp === 'jp'
      if (!isVendorPrefix && parts.length >= 2 && !parts[0].match(/^[0-9]+$/)) {
        setId = parts[0]; num = parts[1]
      }
    }

    const origStr = cardItem?.originalId || cardItem?.id || targetId || ''
    const isKnownJpPrefix = /^(sm11a|sm9a|sm8b|sm12a|s12a|s8b|s6a|s7r|s11|s12|s9|sm9|sm11b|sm12|sv2a|sv3pt5|sv8a|sv1a|sv1v|sv1s|sv2p|sv2d|sv3|sv3a|sv4a|sv4m|sv4k|sv5m|sv5k|sv5a|sv6|sv6a|sv6m|sv7|sv7a|sv8|sv9|sv9a|sv10|sv11a|sv11b|sv11w|s4a|swsh12a|swsh8b|swsh5a|swsh6a)(_ja)?(-|$)/i.test(origStr) ||
      /^(sm11a|sm9a|sm8b|sm12a|s12a|s8b|s6a|s7r|s11|s12|s9|sm9|sm11b|sm12|sv2a|sv3pt5|sv8a|sv1a|sv1v|sv1s|sv2p|sv2d|sv3|sv3a|sv4a|sv4m|sv4k|sv5m|sv5k|sv5a|sv6|sv6a|sv6m|sv7|sv7a|sv8|sv9|sv9a|sv10|sv11a|sv11b|sv11w|s4a|swsh12a|swsh8b|swsh5a|swsh6a)(_ja)?(-|$)/i.test(setId)
    const isJpnCard = Boolean(isJpn || isKnownJpPrefix || setId.toLowerCase().includes('_ja') ||
      cardItem?.name?.includes('Japanese') || origStr.includes('_ja') ||
      img.src.includes('_ja') || img.src.includes('/ja/'))
    if (isJpnCard && !setId.toLowerCase().includes('_ja')) {
      setId = `${setId.replace(/_ja$/i, '')}_ja`
    }

    handleCardImageError(img, setId, num, () => {
      img.src = isJpnCard
        ? 'https://images.pokemontcg.io/np/47_hires.png'
        : 'https://images.pokemontcg.io/swsh3/19_hires.png'
    })
  }, [])

  const handleVaultImageLoad = React.useCallback((
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    cardId?: string,
    isJpn?: boolean
  ) => {
    const img = e.currentTarget
    // Only need the canvas check for known placeholder-serving hosts
    if (!img.src.includes('pokemontcg.io') && !img.src.includes('scrydex.com') && !img.src.includes('tcgdex')) return
    try {
      const canvas = document.createElement('canvas')
      canvas.width = 8; canvas.height = 8
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 8, 8)
      const [r, g, b] = ctx.getImageData(1, 1, 1, 1).data
      const isCardBack = r < 50 && g < 75 && b > 90
      if (isCardBack) {
        handleVaultImageError(
          { currentTarget: img } as React.SyntheticEvent<HTMLImageElement, Event>,
          cardId,
          isJpn
        )
      }
    } catch { /* tainted canvas – do nothing */ }
  }, [handleVaultImageError])
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
            <div className="grid grid-cols-3 gap-6 perspective-1000">
              {sellerCards.map((card, i) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
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
                    onLoad={(e) => handleVaultImageLoad(e, card.id, card.name?.includes("Japanese") || card.id?.includes("jp") || card.id?.includes("_ja") || card.originalId?.includes("_ja"))}
                    onError={(e) => handleVaultImageError(e, card.id, card.name?.includes("Japanese") || card.id?.includes("jp") || card.id?.includes("_ja") || card.originalId?.includes("_ja"))}
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
              ))}
            </div>
          </div>

          <div className="absolute bottom-0 left-0 w-full h-12 bg-gradient-to-t from-[#0a0f1e] to-transparent pointer-events-none" />
        </motion.div>
      </div>
      </div>
    </div>
  )
}

export default TradingCard
