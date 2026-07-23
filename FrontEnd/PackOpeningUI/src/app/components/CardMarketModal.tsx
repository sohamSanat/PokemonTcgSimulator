import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Eye, X, Calendar, Coins, MessageSquare, Layers, BookOpen, CheckCircle2,
  Info, ZoomIn, ZoomOut, RotateCw, Loader2, Send
} from 'lucide-react';
import { sound } from '../services/sound';
import {
  fetchCardFull, cardFullCache, getRealCardPrice, getCardImageUrl,
  type PokemonCard, type TCGDexCardFull
} from '../services/tcgdex';
import InteractiveCard3D from './binder/InteractiveCard3D';
import { generateVendorReply } from '../services/geminiVendorChat';
import { trackMissionProgress } from '../services/missions';

export interface CardData {
  id: number | string;
  originalIndex: number;
  flipped: boolean;
  collected: boolean;
  value: number;
  pokemon: PokemonCard;
  isVendorCatalog?: boolean;
  vendorName?: string;
  vendorBooth?: string;
  vendorRating?: string;
}

export const CardMarketModal = React.memo(({ card, onClose, onAddToBinder, isAddedToBinder, initialViewMode = 'market', onUpdatePrice, onMoveToBinder, onBuyFromVendor, onOpenTradeModal }: { card: CardData; onClose: () => void; onAddToBinder?: (c: CardData) => void; isAddedToBinder?: boolean; initialViewMode?: 'market' | 'art'; onUpdatePrice?: (newPrice: number, newPoke: PokemonCard) => void; onMoveToBinder?: (c: CardData) => void; onBuyFromVendor?: (c: CardData, buyPrice: number) => void; onOpenTradeModal?: (target: any) => void }) => {
  const poke = card.pokemon;
  const [liveCardFull, setLiveCardFull] = useState<TCGDexCardFull | null>(() => cardFullCache.get(poke.id) || null);

  useEffect(() => {
    if (!liveCardFull && !poke.pricing?.cardmarket?.idProduct) {
      fetchCardFull(poke.id)
        .then(data => {
          if (data && (data.pricing || data.tcgplayer || data.cardmarket)) {
            setLiveCardFull(data);
          }
        })
        .catch(() => { });
    }
  }, [poke.id, liveCardFull, poke.pricing]);

  const pricing = liveCardFull?.pricing || poke.pricing;
  const rawTcg = pricing?.tcgplayer || liveCardFull?.tcgplayer || poke.tcgplayer;
  const tcg = rawTcg?.prices || (rawTcg && typeof rawTcg === 'object' && !rawTcg.url ? rawTcg : undefined);

  const rawCm = pricing?.cardmarket || liveCardFull?.cardmarket || poke.cardmarket;
  const cm = rawCm?.prices || rawCm;

  const tcgVariants = tcg ? Object.keys(tcg).filter(k => typeof tcg[k] === 'object' && tcg[k] !== null && k !== 'prices') : [];
  const activePoke: PokemonCard = liveCardFull ? {
    ...poke,
    pricing: liveCardFull.pricing || poke.pricing,
    tcgplayer: liveCardFull.tcgplayer || liveCardFull.pricing?.tcgplayer ? { prices: liveCardFull.tcgplayer || liveCardFull.pricing?.tcgplayer, unit: 'USD' } : poke.tcgplayer,
    cardmarket: liveCardFull.cardmarket || liveCardFull.pricing?.cardmarket || poke.cardmarket,
    illustrator: liveCardFull.illustrator || poke.illustrator
  } : poke;
  const liveCardPrice = getRealCardPrice(activePoke);

  const isFromVendor = Boolean(card.isVendorCatalog || poke.isVendorCatalog);
  const vendorName = card.vendorName || poke.vendorName || "VINTAGEVAULT TCG";
  const vendorBooth = card.vendorBooth || poke.vendorBooth || "5B";
  const vendorRating = card.vendorRating || poke.vendorRating || "4.8 / 5";
  const vendorPrice = typeof card.value === 'number' ? card.value : parseFloat(String(card.value || '0').replace(/[^0-9.]/g, '')) || liveCardPrice;

  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(vendorPrice);
  const [isPriceUpdated, setIsPriceUpdated] = useState<boolean>(false);

  useEffect(() => {
    setNegotiatedPrice(vendorPrice);
  }, [vendorPrice]);

  useEffect(() => {
    if (!isFromVendor && liveCardPrice !== card.value && onUpdatePrice) {
      onUpdatePrice(liveCardPrice, activePoke);
    }
  }, [isFromVendor, liveCardPrice, card.value, onUpdatePrice, activePoke]);

  const [viewMode, setViewMode] = useState<'market' | 'art'>(initialViewMode);
  const [zoom, setZoom] = useState<number>(1.1);
  const [isFlipped, setIsFlipped] = useState(false);

  const [showSellerChat, setShowSellerChat] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [vendorAnnoyance, setVendorAnnoyance] = useState<number>(0);
  const [customOfferInput, setCustomOfferInput] = useState<string>('');
  const [showHaggleModal, setShowHaggleModal] = useState<boolean>(false);
  const [userVendorPurchases, setUserVendorPurchases] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(`tcg_vendor_purchases_${vendorName}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'vendor' | 'user'; text: string; time: string }>>([
    {
      sender: 'vendor',
      text: `Welcome to ${vendorBooth} (${vendorName})! I've got this ${poke.name} locked in at $${vendorPrice.toLocaleString()}. Any condition questions or looking to pitch a deal? 🔥`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showSellerChat && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showSellerChat, chatMessages]);

  const [isVendorTyping, setIsVendorTyping] = useState(false);

  const handleBuyFromVendorAction = () => {
    sound.playButtonClick();
    sound.playLegendaryFanfare();
    try {
      const nextCount = userVendorPurchases + 1;
      setUserVendorPurchases(nextCount);
      localStorage.setItem(`tcg_vendor_purchases_${vendorName}`, String(nextCount));
    } catch {}
    if (onOpenTradeModal) {
      // Open the trade window (stacks above the chat at z-500).
      // Close the chat + card modal only AFTER the trade target is set so
      // the user can see the full TradeModal before anything dismisses.
      onOpenTradeModal({
        id: card.id,
        name: poke.name,
        img: (poke as any).imageUrl || poke.images?.large || poke.images?.small || (card as any).imageUrl || '',
        price: negotiatedPrice,
        grade: (poke as any).slabGrade || (card as any).slabGrade || 'PSA 10',
        vendorName: vendorName
      });
      // Dismiss the chat + card inspect modal after a brief delay so the
      // TradeModal (z-500) is already visible before we close these panels.
      setTimeout(() => {
        setShowSellerChat(false);
        onClose();
      }, 80);
    } else if (onBuyFromVendor) {
      onBuyFromVendor(card, negotiatedPrice);
      setShowSellerChat(false);
      onClose();
    }
  };

  const handlePitchCustomOffer = async (offerVal?: number) => {
    const rawVal = offerVal ?? parseFloat(customOfferInput);
    if (isNaN(rawVal) || rawVal <= 0 || isVendorTyping) return;
    
    const offerAmount = Math.round(rawVal * 100) / 100;
    setCustomOfferInput('');
    setShowHaggleModal(false);
    
    const offerMsg = `🤝 I'd like to pitch a custom offer for this ${poke.name}: $${offerAmount.toLocaleString()}!`;
    setChatMessages(prev => [...prev, {
      sender: 'user',
      text: offerMsg,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);

    sound.playButtonClick();
    setIsVendorTyping(true);
    trackMissionProgress('vendor_chat', 1);

    setTimeout(() => {
      const askingPrice = negotiatedPrice;
      const offerRatio = offerAmount / askingPrice;
      const minFloorPrice = Math.round(askingPrice * 0.82 * 100) / 100; // Hard Floor: Max 18% discount
      const loyaltyBonus = Math.min(0.08, userVendorPurchases * 0.03); // Max 8% loyalty bonus
      const annoyancePenalty = (vendorAnnoyance / 100) * 0.12;
      const score = (offerRatio + loyaltyBonus) - annoyancePenalty;

      let accepted = false;
      let replyText = "";
      let newAnnoyance = vendorAnnoyance;

      if (offerAmount < minFloorPrice) {
        // Below 82% of asking price (e.g. $700 on a $2000 card) -> ALWAYS REJECT as Lowball!
        newAnnoyance = Math.min(100, vendorAnnoyance + 35);
        const counterVal = Math.round(askingPrice * 0.88 * 100) / 100;
        replyText = `Are you kidding me?! $${offerAmount.toLocaleString()} on a $${askingPrice.toLocaleString()} card? That's a huge lowball! 🤬 The absolute lowest I can possibly go for this card is OFFER: $${counterVal.toLocaleString()}.`;
      } else if (vendorAnnoyance >= 80) {
        newAnnoyance = Math.min(100, vendorAnnoyance + 10);
        replyText = `Look, I'm already extremely frustrated today. $${askingPrice.toLocaleString()} is the absolute final non-negotiable price for this ${poke.name}. 🛑`;
      } else if (offerRatio >= 0.94 || (score >= 0.90 && offerAmount >= minFloorPrice)) {
        accepted = true;
        newAnnoyance = Math.max(0, vendorAnnoyance - 10);
        if (userVendorPurchases > 0) {
          replyText = `Deal! Since you're a loyal customer at our booth (${userVendorPurchases} card${userVendorPurchases > 1 ? 's' : ''} bought), I'll accept $${offerAmount.toLocaleString()} for the ${poke.name}! OFFER: $${offerAmount.toLocaleString()} 🤝🔥`;
        } else {
          replyText = `That's a fair offer! $${offerAmount.toLocaleString()} works for me. The ${poke.name} is yours! OFFER: $${offerAmount.toLocaleString()} 🤝🔥`;
        }
      } else {
        // Between 82% and 93% of asking price -> Counter offer
        newAnnoyance = Math.min(100, vendorAnnoyance + 15);
        const counterVal = Math.round(((askingPrice + offerAmount) / 2) * 100) / 100;
        replyText = `$${offerAmount.toLocaleString()} is a bit too steep of a discount for a ${poke.name} in this condition. How about we meet in the middle at OFFER: $${counterVal.toLocaleString()}? 😤`;
      }

      setVendorAnnoyance(newAnnoyance);

      if (accepted) {
        setNegotiatedPrice(offerAmount);
        setIsPriceUpdated(true);
        sound.playCoinClink();
        setTimeout(() => setIsPriceUpdated(false), 3000);
      }

      setChatMessages(prev => [...prev, {
        sender: 'vendor',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      sound.playCardCollect();
      setIsVendorTyping(false);
    }, 600);
  };

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isVendorTyping) return;
    const userMsgText = chatInput.trim();
    const newMsg = {
      sender: 'user' as const,
      text: userMsgText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setChatMessages(prev => [...prev, newMsg]);
    setChatInput('');
    sound.playButtonClick();
    setIsVendorTyping(true);
    trackMissionProgress('vendor_chat', 1);

    try {
      const fullCardSet = liveCardFull?.set?.name || (activePoke as any).set?.name || (activePoke.name.includes('(') ? activePoke.name.split('(')[1].replace(')', '').trim() : 'Paradise Dragona / Japanese Series');
      const fullCardRarity = liveCardFull?.rarity || activePoke.rarity || 'Special Art / Rare';
      const fullCardArtist = liveCardFull?.illustrator || activePoke.illustrator || 'Ken Sugimori / Official Pokémon Artist';
      const fullCardHp = liveCardFull?.hp || (activePoke as any).hp || 'Standard';
      const fullCardTypes = liveCardFull?.types ? liveCardFull.types.join(', ') : ((activePoke as any).types ? (activePoke as any).types.join(', ') : 'Dragon / Multi');

      const vendorReply = await generateVendorReply({
        vendorName,
        vendorBooth,
        vendorRating,
        cardName: activePoke.name || poke.name,
        cardPrice: vendorPrice,
        cardGrade: poke.slabGrade !== 'N/A' && poke.slabGrade ? poke.slabGrade : 'Near Mint / Slab',
        cardSet: fullCardSet,
        cardRarity: fullCardRarity,
        cardIllustrator: fullCardArtist,
        cardHp: String(fullCardHp),
        cardTypes: fullCardTypes,
        cardId: activePoke.id,
        chatHistory: chatMessages,
        userMessage: userMsgText
      });

      // Only lower the negotiated price when the vendor explicitly made an offer.
      // Condition questions / general chat return offerPrice === null and keep the listed price.
      if (vendorReply.offerPrice && vendorReply.offerPrice > 0.05 && vendorReply.offerPrice < negotiatedPrice) {
        setNegotiatedPrice(vendorReply.offerPrice);
        setIsPriceUpdated(true);
        sound.playCoinClink();
        setTimeout(() => setIsPriceUpdated(false), 3000);
      }

      setChatMessages(prev => [
        ...prev,
        {
          sender: 'vendor' as const,
          text: vendorReply.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      sound.playCardCollect();
    } catch (err) {
      // Connection failed — do NOT auto-discount the price. Keep the listed
      // price and let the buyer retry. Only surface a graceful message.
      console.warn('[VendorChat] failed to reach AI vendor:', err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'vendor' as const,
          text: `Apologies — my connection on the convention floor just dropped for a sec! 📶 Ask me again and I'll sort you out on the ${activePoke.name || poke.name}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
      sound.playCardCollect();
    } finally {
      setIsVendorTyping(false);
    }
  };

  const card3dRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (card3dRef.current) {
      card3dRef.current.style.transform = `scale(${zoom})`;
    }
  }, [zoom, isFlipped]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => { sound.playModalClose(); onClose(); }}
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-[3px] flex items-center justify-center p-4 overflow-y-auto"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className={`bg-gradient-to-b from-[#1c1c24] via-[#14141c] to-[#0d0d0f] border border-white/20 rounded-3xl w-full overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)] flex flex-col my-8 transition-all duration-300 ${viewMode === 'art' ? 'max-w-4xl max-h-[92vh]' : 'max-w-3xl md:flex-row max-h-[85vh]'
          }`}
      >
        {viewMode === 'art' ? (
          /* ========================================================
             ✨ INTERACTIVE 3D HOLOGRAPHIC ART ADMIRATION STUDIO ✨
             ======================================================== */
          <div className="flex flex-col h-full bg-gradient-to-b from-[#1c1c24] via-[#121218] to-[#0d0d0f] p-6 sm:p-8 relative overflow-hidden">
            <div className="flex items-center justify-between z-10 w-full px-2 mb-4">
              <div className="flex flex-col items-start gap-1">
                <h3 className="text-2xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(251,191,36,0.3)] flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  {poke.name}
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-widest text-amber-300/80 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                    {poke.rarity || 'Common'}
                  </span>
                  {/* ID text removed */}
                </div>
              </div>

              <button
                onClick={() => { sound.playModalClose(); onClose(); }}
                className="p-2.5 rounded-full bg-black/40 hover:bg-black border border-white/10 hover:border-amber-500/50 text-white/60 hover:text-amber-400 transition-all cursor-pointer backdrop-blur-md shadow-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Showcase Area */}
            <div
              className="flex-1 flex flex-col items-center justify-center py-6 overflow-hidden select-none"
            >
              <div
                ref={card3dRef}
                style={{
                  transform: `scale(${zoom})`,
                  transition: "transform 0.2s ease-out",
                  willChange: "transform",
                }}
                className="relative w-44 sm:w-52 md:w-60 aspect-[0.718] mx-auto my-auto"
              >
                <InteractiveCard3D
                  card={isFlipped ? { ...card, imageUrl: "https://images.pokemontcg.io/cardback.png", holofoil: false, rarity: "Common" } : card}
                  showcase={true}
                  disableTilt={false}
                  interactive={true}
                  className="w-full h-full shadow-[0_20px_60px_rgba(0,0,0,0.95)] rounded-2xl no-glow"
                />
              </div>
            </div>

            {/* Studio Controls Bar */}
            <div className={`pt-4 border-t border-white/10 flex flex-wrap items-center ${isFromVendor ? 'justify-between' : 'justify-end'} gap-4 z-10 bg-black/40 p-4 rounded-2xl border border-white/5`}>
              {isFromVendor && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className={`px-3.5 py-1.5 rounded-xl border flex flex-col justify-center transition-all duration-300 ${isPriceUpdated
                      ? 'bg-emerald-500 border-white shadow-[0_0_25px_rgba(16,185,129,1)] scale-110 animate-bounce'
                      : negotiatedPrice < vendorPrice
                        ? 'bg-gradient-to-r from-emerald-500/30 to-teal-500/30 border-emerald-400 shadow-[0_0_18px_rgba(16,185,129,0.4)]'
                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-emerald-400/50 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                    }`}>
                    <span className={`text-[9px] font-mono font-bold uppercase tracking-wider ${isPriceUpdated ? 'text-black' : 'text-emerald-300/80'}`}>
                      Booth {vendorBooth} Price {isPriceUpdated && '🔥 DROP!'}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {negotiatedPrice < vendorPrice && !isPriceUpdated && (
                        <span className="text-xs text-gray-500 line-through font-normal">${vendorPrice.toLocaleString()}</span>
                      )}
                      <span className={`text-base font-black ${isPriceUpdated ? 'text-black' : 'text-emerald-300'}`}>
                        💰 ${negotiatedPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => { sound.playButtonClick(); setShowSellerChat(true); }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#7dd3fc] hover:to-[#0284c7] text-white font-mono font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.4)] transform hover:-translate-y-0.5 border border-[#38bdf8]/40"
                  >
                    <MessageSquare className="w-4 h-4 text-white animate-pulse" /> 💬 Chat With Seller ({vendorName})
                  </button>
                  <button
                    onClick={handleBuyFromVendorAction}
                    className={`px-4 py-2 rounded-xl font-mono font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg transform hover:scale-105 active:scale-95 ${isPriceUpdated
                        ? 'bg-gradient-to-r from-yellow-300 via-emerald-400 to-yellow-300 text-black animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.8)] border-2 border-white'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] border border-emerald-400/50'
                      }`}
                  >
                    <Coins className="w-4 h-4" /> Buy · Trade or Cash (${negotiatedPrice.toLocaleString()})
                  </button>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white/5 rounded-lg p-1 border border-white/10">
                  <button
                    onClick={() => { sound.playButtonClick(); setZoom(prev => Number(Math.max(0.4, prev - 0.2).toFixed(2))); }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Zoom Out below 100%"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono font-bold text-amber-300">{Math.round(zoom * 100)}%</span>
                  <button
                    onClick={() => { sound.playButtonClick(); setZoom(prev => Number(Math.min(2.4, prev + 0.2).toFixed(2))); }}
                    className="p-1.5 text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => { sound.playCardFlip(); setIsFlipped(!isFlipped); }}
                  className="px-3 py-1.5 rounded-lg bg-[#1f1f2e] hover:bg-[#28283c] border border-amber-500/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCw className="w-3.5 h-3.5" /> {isFlipped ? "Show Artwork" : "Show Back"}
                </button>
              </div>
            </div>

            <div className="mt-3 text-center text-[11px] text-gray-500">
              Illustrated by <strong className="text-gray-300">{poke.illustrator || "Official Pokémon Artist"}</strong>
            </div>
          </div>
        ) : (
          /* ========================================================
             📊 STANDARD LIVE MARKET DATA INSPECTION VIEW 📊
             ======================================================== */
          <>
            <div className="md:w-5/12 bg-gradient-to-b from-gray-900 to-black p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-white/10 relative">
              <div className="absolute top-4 left-4">
                <span className="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Live Market Data
                </span>
              </div>
              <div
                onClick={() => { sound.playModalOpen(); setViewMode('art'); }}
                className="w-44 sm:w-52 aspect-[0.718] mt-6 md:mt-4 relative group cursor-pointer"
              >
                <InteractiveCard3D
                  card={card}
                  interactive={true}
                  showcase={true}
                  className="w-full h-full shadow-[0_0_30px_rgba(0,0,0,0.8)] border border-white/20 rounded-2xl"
                >
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-3 text-center backdrop-blur-[2px] z-20">
                    <Eye className="w-8 h-8 text-amber-400 mb-1.5 animate-bounce" />
                    <span className="text-xs font-extrabold text-white">✨ Admire Art Studio</span>
                    <span className="text-[10px] text-gray-300 mt-0.5">Click for High-Res Art Studio</span>
                  </div>
                </InteractiveCard3D>
              </div>
              <button
                onClick={() => { sound.playModalOpen(); setViewMode('art'); }}
                className="mt-3 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-400/40 hover:border-amber-400 text-amber-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_15px_rgba(245,158,11,0.2)] cursor-pointer hover:scale-105"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" /> Admire Card Art Studio
              </button>
              <div className="mt-4 text-center w-full px-2">
                <div className={`transition-all duration-300 rounded-2xl py-1 px-2 ${isPriceUpdated ? 'bg-emerald-500/20 border-2 border-emerald-400 scale-105 animate-bounce shadow-[0_0_25px_rgba(16,185,129,0.5)]' : ''
                  }`}>
                  <div className="flex items-center justify-center gap-2">
                    {isFromVendor && negotiatedPrice < vendorPrice && (
                      <span className="text-lg font-mono text-gray-500 line-through font-normal">${vendorPrice.toLocaleString()}</span>
                    )}
                    <span className={`text-3xl font-mono font-black tracking-tight block drop-shadow-[0_0_15px_rgba(52,211,153,0.4)] ${isPriceUpdated ? 'text-yellow-300' : 'text-emerald-400'}`}>
                      ${isFromVendor ? negotiatedPrice.toLocaleString() : liveCardPrice.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest mt-0.5 block">
                    {isFromVendor ? `🏪 Booth ${vendorBooth} Catalogue Price ${isPriceUpdated ? '🔥 PRICE DROPPED!' : ''}` : (tcgVariants.length === 0 && !cm) ? 'Fixed Valuation (No Live Data)' : 'Live Market Value'}
                  </span>
                </div>
                {isFromVendor && (
                  <div className="mt-3.5 space-y-2.5 w-full">
                    <button
                      onClick={handleBuyFromVendorAction}
                      className={`w-full py-2.5 rounded-xl font-mono font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 ${isPriceUpdated
                          ? 'bg-gradient-to-r from-yellow-300 via-emerald-400 to-yellow-300 text-black animate-pulse shadow-[0_0_20px_rgba(250,204,21,0.8)] border-2 border-white'
                          : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/50'
                        }`}
                    >
                      <Coins className="w-4 h-4" /> Buy · Trade or Cash (${negotiatedPrice.toLocaleString()})
                    </button>
                    <button
                      onClick={() => { sound.playButtonClick(); setShowSellerChat(true); }}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] via-[#0284c7] to-[#0369a1] hover:from-[#7dd3fc] hover:to-[#0284c7] text-white font-mono font-black text-xs md:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(56,189,248,0.4)] border border-[#38bdf8]/50 transform hover:-translate-y-0.5"
                    >
                      <MessageSquare className="w-4 h-4 text-white animate-pulse" /> 💬 Chat With Seller ({vendorName})
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="md:w-7/12 p-6 md:p-8 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-6">
                  <div>
                    <h2 className="text-2xl font-extrabold text-white">{poke.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-amber-300 font-semibold bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">{poke.rarity || 'Common'}</span>
                      {poke.isReverseHolo && (
                        <span className="text-xs text-amber-300 font-bold bg-amber-500/20 border border-amber-400/40 px-2 py-0.5 rounded-md shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse">✨ Reverse Holo Slot</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => { sound.playModalClose(); onClose(); }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">🏦</div>
                      <h3 className="font-bold text-sm text-gray-200">TCGplayer (North America)</h3>
                    </div>
                    {tcg?.updated && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(tcg.updated).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {tcgVariants.length > 0 ? (
                    <div className="space-y-2.5">
                      {tcgVariants.map(variant => {
                        const data = tcg[variant];
                        const market = data.marketPrice ?? data.market ?? data.midPrice ?? data.mid;
                        const low = data.lowPrice ?? data.low;
                        const high = data.highPrice ?? data.high;
                        const isSelectedVariant = (typeof market === 'number' ? Number(market.toFixed(2)) : (typeof low === 'number' ? Number(low.toFixed(2)) : -1)) === Number(liveCardPrice.toFixed(2));
                        return (
                          <div key={variant} className={`p-3 rounded-xl transition-all flex flex-col gap-1.5 ${isSelectedVariant
                            ? 'bg-amber-500/15 border-2 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                            : 'bg-white/5 border border-white/10'
                            }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-amber-300 capitalize">{variant.replace(/([A-Z])/g, ' $1')}</span>
                                {isSelectedVariant && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-400/40 text-[9px] font-bold text-amber-300 uppercase tracking-wider">
                                    Active Price
                                  </span>
                                )}
                              </div>
                              <span className="text-sm font-extrabold text-emerald-400">${typeof market === 'number' ? market.toFixed(2) : (typeof low === 'number' ? low.toFixed(2) : 'N/A')}</span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-gray-400 pt-1 border-t border-white/5">
                              <span>Low: <strong className="text-gray-300">${typeof low === 'number' ? low.toFixed(2) : '-'}</strong></span>
                              <span>Mid: <strong className="text-gray-300">${typeof data.midPrice === 'number' ? data.midPrice.toFixed(2) : '-'}</strong></span>
                              <span>High: <strong className="text-gray-300">${typeof high === 'number' ? high.toFixed(2) : '-'}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 italic flex flex-col items-center justify-center gap-1">
                      <span>No direct TCGplayer price listings available for this variant.</span>
                      <span className="text-[11px] text-amber-300 font-medium not-italic">Applied fixed range ($0.01 - $0.10) for unlisted/energy card.</span>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">🏩</div>
                      <h3 className="font-bold text-sm text-gray-200">Cardmarket (Europe)</h3>
                    </div>
                    {cm?.updated && (
                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {new Date(cm.updated).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {cm ? (
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Trend Price</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.trend ? `€${cm.trend.toFixed(2)}` : (cm.avg ? `€${cm.avg.toFixed(2)}` : 'N/A')}</span>
                        {cm.trend && <span className="text-[10px] text-emerald-400/80 mt-0.5">≈ ${(cm.trend * 1.08).toFixed(2)} USD</span>}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">30-Day Average</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.avg30 ? `€${cm.avg30.toFixed(2)}` : 'N/A'}</span>
                        {cm.avg30 && <span className="text-[10px] text-gray-400 mt-0.5">Stable Avg</span>}
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Low Price</span>
                        <span className="text-sm font-bold text-white mt-0.5">{cm.low ? `€${cm.low.toFixed(2)}` : 'N/A'}</span>
                      </div>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex flex-col">
                        <span className="text-[11px] text-gray-400">Holo Trend</span>
                        <span className="text-sm font-bold text-amber-300 mt-0.5">{cm['trend-holo'] ? `€${cm['trend-holo'].toFixed(2)}` : (cm['avg-holo'] ? `€${cm['avg-holo'].toFixed(2)}` : 'N/A')}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-center text-xs text-gray-400 italic flex flex-col items-center justify-center gap-1">
                      <span>No Cardmarket data listed for this card.</span>
                      <span className="text-[11px] text-amber-300 font-medium not-italic">Applied fixed range ($0.01 - $0.10) for unlisted/energy card.</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Live card data</span>
                </div>
                <div className="flex items-center gap-3">
                  {onMoveToBinder ? (
                    <button
                      onClick={() => onMoveToBinder(card)}
                      className="px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg bg-blue-500/20 text-blue-300 border border-blue-500/40 hover:bg-blue-500/30"
                    >
                      <Layers className="w-4 h-4 text-blue-400" />
                      <span>Move to Binder</span>
                    </button>
                  ) : onAddToBinder ? (
                    <button
                      onClick={() => onAddToBinder(card)}
                      className={`px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg ${isAddedToBinder
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
                        : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95'
                        }`}
                    >
                      {isAddedToBinder ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          <span>In Binder</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-4 h-4 text-white" />
                          <span>+ Add to Binder</span>
                        </>
                      )}
                    </button>
                  ) : null}
                  <button
                    onClick={() => { sound.playModalClose(); onClose(); }}
                    className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ========================================================
           💬 LIVE CONVENTION SELLER CHAT DIALOG 💬
           ======================================================== */}
        <AnimatePresence>
          {showSellerChat && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); sound.playModalClose(); setShowSellerChat(false); }}
              className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-[#0f172a] border border-[#38bdf8]/50 rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(56,189,248,0.3)] flex flex-col max-h-[80vh]"
              >
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-[#0b1329] via-[#0f1d3a] to-[#0b1329] px-4 py-3.5 border-b border-[#38bdf8]/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#38bdf8]/20 border border-[#38bdf8]/50 flex items-center justify-center text-[#38bdf8] font-bold shadow-[0_0_10px_rgba(56,189,248,0.4)]">
                      🏪
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-black text-white flex items-center gap-2">
                        {vendorName}
                        <span className="text-[10px] font-mono font-bold bg-[#38bdf8]/20 text-[#38bdf8] px-1.5 py-0.5 rounded border border-[#38bdf8]/40">Booth {vendorBooth}</span>
                      </h4>
                      <p className="text-[11px] font-mono text-[#94a3b8]">Rating: {vendorRating} • Live Convention Connection</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { sound.playModalClose(); setShowSellerChat(false); }}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* ── VENDOR ANNOYANCE METER & LOYALTY BAR ───────────────────── */}
                <div className="bg-[#0b1120] px-4 py-2 border-b border-white/10 flex items-center justify-between gap-3 text-xs font-mono">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">Vendor Patience:</span>
                    <div className="flex-1 h-2.5 bg-gray-900 rounded-full overflow-hidden border border-white/10 relative">
                      <div
                        className={`h-full transition-all duration-500 ${
                          vendorAnnoyance < 30
                            ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.8)]'
                            : vendorAnnoyance < 60
                            ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)]'
                            : vendorAnnoyance < 85
                            ? 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.8)]'
                            : 'bg-red-600 animate-pulse shadow-[0_0_15px_rgba(220,38,38,1)]'
                        }`}
                        style={{ width: `${vendorAnnoyance}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold shrink-0 ${
                      vendorAnnoyance < 30 ? 'text-emerald-400' : vendorAnnoyance < 60 ? 'text-yellow-400' : vendorAnnoyance < 85 ? 'text-orange-400' : 'text-red-400'
                    }`}>
                      {vendorAnnoyance < 30 ? '🟢 Happy' : vendorAnnoyance < 60 ? '🟡 Skeptical' : vendorAnnoyance < 85 ? '🟠 Irritated' : '🔴 Fuming!'} ({vendorAnnoyance}%)
                    </span>
                  </div>
                  {userVendorPurchases > 0 && (
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/40 font-bold shrink-0">
                      🏆 {userVendorPurchases} Card{userVendorPurchases > 1 ? 's' : ''} Bought
                    </span>
                  )}
                </div>

                {/* Chat Card Preview Pill */}
                <div className="bg-[#111827] px-4 py-2 border-b border-white/5 flex items-center justify-between text-xs font-mono relative overflow-hidden">
                  <span className="text-gray-300 truncate font-bold flex items-center gap-1.5">
                    Trading Item: <span className="text-[#38bdf8]">{poke.name}</span>
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg font-black transition-all duration-300 flex items-center gap-1.5 ${isPriceUpdated
                        ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,1)] scale-110 animate-bounce border-2 border-white'
                        : negotiatedPrice < vendorPrice
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'text-emerald-400'
                      }`}>
                      {negotiatedPrice < vendorPrice && (
                        <span className="line-through text-gray-500 text-[10px] mr-1 font-normal">${vendorPrice.toLocaleString()}</span>
                      )}
                      <span>Asking: ${negotiatedPrice.toLocaleString()}</span>
                      {isPriceUpdated && <span className="text-black font-extrabold text-[10px]">🔥 PRICE DROPPED!</span>}
                    </span>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0b0f19] min-h-[200px] max-h-[320px]">
                  <div className="text-center my-1">
                    <span className="px-3 py-1 rounded-full bg-[#1e293b]/60 border border-white/10 text-[10px] font-mono text-[#94a3b8]">
                      🔒 Secure P2P Convention Floor Chat Established
                    </span>
                  </div>
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-[#64748b]">
                        <span>{msg.sender === 'user' ? 'You' : `${vendorName} Rep`}</span>
                        <span>•</span>
                        <span>{msg.time}</span>
                      </div>
                      <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl font-mono text-xs leading-relaxed ${msg.sender === 'user'
                          ? 'bg-gradient-to-r from-[#38bdf8] to-[#0284c7] text-white rounded-br-none shadow-[0_4px_12px_rgba(56,189,248,0.25)]'
                          : 'bg-[#1e293b] text-[#f1f5f9] border border-white/10 rounded-bl-none shadow-md'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {isVendorTyping && (
                    <div className="flex flex-col items-start animate-pulse">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] font-mono text-[#38bdf8]">
                        <span>✨ {vendorName} Rep</span>
                        <span>•</span>
                        <span>Live on floor...</span>
                      </div>
                      <div className="bg-[#1e293b]/90 text-[#38bdf8] border border-[#38bdf8]/40 rounded-2xl rounded-bl-none px-3.5 py-2.5 font-mono text-xs flex items-center gap-2 shadow-lg">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-[#38bdf8]" />
                        <span>Checking floor pricing with booth manager...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Always-visible Buy Now Bar inside Chat */}
                <div className="px-4 py-2.5 bg-gradient-to-r from-[#0d162a] via-[#122143] to-[#0d162a] border-t border-b border-[#38bdf8]/40 flex items-center justify-between gap-3 shrink-0 shadow-lg">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-mono text-[#94a3b8] uppercase font-bold tracking-wider">Floor Deal Price</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      {negotiatedPrice < vendorPrice && (
                        <span className="text-xs text-gray-500 line-through font-normal">${vendorPrice.toLocaleString()}</span>
                      )}
                      <span className={`text-sm sm:text-base font-black ${isPriceUpdated ? 'text-yellow-300 animate-pulse' : 'text-emerald-400'}`}>
                        ${negotiatedPrice.toLocaleString()}
                      </span>
                      {negotiatedPrice < vendorPrice && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/40 font-bold">
                          {(100 - (negotiatedPrice / vendorPrice) * 100).toFixed(0)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={handleBuyFromVendorAction}
                    className={`px-4 sm:px-5 py-2 rounded-xl font-mono font-black text-xs sm:text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg transform hover:scale-105 active:scale-95 shrink-0 ${isPriceUpdated
                        ? 'bg-gradient-to-r from-yellow-300 via-emerald-400 to-yellow-300 text-black animate-pulse shadow-[0_0_25px_rgba(250,204,21,0.8)] border-2 border-white'
                        : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-400/50'
                      }`}
                  >
                    <Coins className="w-4 h-4" />
                    <span>Buy · Trade or Cash (${negotiatedPrice.toLocaleString()})</span>
                  </button>
                </div>

                {/* ── QUICK HAGGLE ACTION BAR ───────────────────── */}
                <div className="px-3 py-2 bg-[#090d16] border-t border-white/10 flex items-center justify-between gap-1.5 flex-wrap">
                  <span className="text-[10px] font-mono text-gray-400 font-bold flex items-center gap-1">
                    🤝 Pitch Offer:
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      disabled={isVendorTyping}
                      onClick={() => handlePitchCustomOffer(Math.round(negotiatedPrice * 0.95 * 100) / 100)}
                      className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      -5% (${(negotiatedPrice * 0.95).toFixed(0)})
                    </button>
                    <button
                      disabled={isVendorTyping}
                      onClick={() => handlePitchCustomOffer(Math.round(negotiatedPrice * 0.90 * 100) / 100)}
                      className="px-2 py-1 rounded bg-yellow-500/15 hover:bg-yellow-500/30 text-yellow-300 border border-yellow-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      -10% (${(negotiatedPrice * 0.90).toFixed(0)})
                    </button>
                    <button
                      disabled={isVendorTyping}
                      onClick={() => handlePitchCustomOffer(Math.round(negotiatedPrice * 0.85 * 100) / 100)}
                      className="px-2 py-1 rounded bg-orange-500/15 hover:bg-orange-500/30 text-orange-300 border border-orange-500/40 text-[10px] font-mono font-bold transition-all cursor-pointer disabled:opacity-50"
                    >
                      -15% (${(negotiatedPrice * 0.85).toFixed(0)})
                    </button>
                    <button
                      disabled={isVendorTyping}
                      onClick={() => setShowHaggleModal(!showHaggleModal)}
                      className="px-2.5 py-1 rounded bg-cyan-500/20 hover:bg-cyan-500/35 text-cyan-300 border border-cyan-500/50 text-[10px] font-mono font-black transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
                    >
                      <span>Custom $</span>
                    </button>
                  </div>
                </div>

                {/* Custom Offer Input Drawer */}
                {showHaggleModal && (
                  <div className="p-3 bg-[#0d1629] border-t border-cyan-500/40 flex items-center gap-2 animate-fadeIn">
                    <span className="text-xs font-mono text-cyan-400 font-bold">$</span>
                    <input
                      type="number"
                      value={customOfferInput}
                      onChange={(e) => setCustomOfferInput(e.target.value)}
                      placeholder={`Enter offer price (Asking: $${negotiatedPrice})...`}
                      className="flex-1 bg-[#162238] border border-cyan-500/40 rounded-lg px-3 py-1.5 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400"
                      onKeyDown={(e) => e.key === 'Enter' && handlePitchCustomOffer()}
                    />
                    <button
                      onClick={() => handlePitchCustomOffer()}
                      className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-md"
                    >
                      Submit Pitch 🤝
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3 bg-[#0f172a] border-t border-white/10 flex items-center gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    disabled={isVendorTyping}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !isVendorTyping && handleSendChatMessage()}
                    placeholder={isVendorTyping ? `${vendorName} is replying right now...` : `Message ${vendorName} right now...`}
                    className="flex-1 bg-[#1e293b] border border-white/10 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-[#38bdf8] transition-colors disabled:opacity-50"
                  />
                  <button
                    onClick={handleSendChatMessage}
                    disabled={isVendorTyping}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#38bdf8] to-[#0284c7] hover:from-[#7dd3fc] hover:to-[#0284c7] text-white font-mono transition-all cursor-pointer shadow-[0_0_15px_rgba(56,189,248,0.3)] shrink-0 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
      </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});
