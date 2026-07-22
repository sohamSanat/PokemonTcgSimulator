import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, ChevronUp, ChevronDown, Layers, RotateCw, Loader2
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateVendorReply } from '../../services/geminiVendorChat';
import { BoosterPackTear } from '../BoosterPackTear';
import { 
  fetchSetDetails, 
  generatePackFromSet, 
  orchestrateSetLoading, 
  onCardFullCacheUpdated, 
  cardFullCache, 
  getRealCardPrice, 
  formatAndSortPackCards, 
  getCardImageUrl, 
  PokemonCard 
} from '../../services/tcgdex';
import { resolveVendorCardRealPrice } from '../../services/scrydex';
import InteractiveCard3D from '../binder/InteractiveCard3D';

interface RipNShipViewProps {
  onBackToPacks: () => void;
}

interface CustomerOrder {
  id: string;
  username: string;
  avatarColor: string;
  packName: string;
  setId: string; // The official TCGDex/Scrydex set ID
  packCount: number;
  totalPaid: number;
  status: 'pending' | 'ripping' | 'completed';
  pulledCards?: { name: string; value: number; image: string; rarity: string }[];
}

interface ChatMessage {
  id: string;
  username: string;
  message: string;
  badge?: string;
  color?: string;
  avatarColor?: string;
  isOrderNotification?: boolean;
}

interface FloatingReaction {
  id: number;
  emoji: string;
  x: number;
}

interface GeneratedCardData {
  id: string;
  value: number;
  pokemon: PokemonCard;
  isHit: boolean;
}

const getPackArtsForSet = (setId: string, manifest: Record<string, string[]> = {}): string[] => {
  const DEFAULT = ['/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp'];
  if (!manifest || Object.keys(manifest).length === 0) return DEFAULT;
  
  if (manifest[setId]) return manifest[setId];
  if (manifest[setId.toLowerCase()]) return manifest[setId.toLowerCase()];
  
  const normId = setId.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (manifest[normId]) return manifest[normId];
  
  for (const [key, urls] of Object.entries(manifest)) {
    if (key.toLowerCase() === normId) return urls;
  }
  
  return DEFAULT;
};

export default function RipNShipView({ onBackToPacks }: RipNShipViewProps) {
  // Stream Stats
  const [viewerCount, setViewerCount] = useState<number>(1420);
  const [totalRevenue, setTotalRevenue] = useState<number>(1280.00);
  const [hypeLevel, setHypeLevel] = useState<number>(4);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Manifests & Caches
  const [packArtsManifest, setPackArtsManifest] = useState<Record<string, string[]>>({});
  
  useEffect(() => {
    const base = import.meta.env.BASE_URL || '/';
    fetch(`${base}packArts/manifest.json?v=3`)
      .then(res => res.ok ? res.json() : {})
      .then(data => setPackArtsManifest(data))
      .catch(() => {});
  }, []);

  const [reactions, setReactions] = useState<FloatingReaction[]>([]);
  
  // Real orders mapped to actual sets!
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-101',
      username: '@PokeKing99',
      avatarColor: 'from-amber-400 to-orange-500',
      packName: '151 Booster Pack',
      setId: 'sv3',
      packCount: 3,
      totalPaid: 86.73,
      status: 'pending'
    },
    {
      id: 'ord-102',
      username: '@SlabKing',
      avatarColor: 'from-purple-500 to-indigo-600',
      packName: 'Evolving Skies Pack',
      setId: 'swsh7',
      packCount: 2,
      totalPaid: 88.00,
      status: 'pending'
    },
    {
      id: 'ord-103',
      username: '@CharizardHunter',
      avatarColor: 'from-red-500 to-rose-700',
      packName: 'Base Set Vintage Pack',
      setId: 'base1',
      packCount: 1,
      totalPaid: 449.99,
      status: 'pending'
    },
  ]);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

  // Pack States
  const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
  const [isLoadingPack, setIsLoadingPack] = useState(false);
  const [activePackCards, setActivePackCards] = useState<GeneratedCardData[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [topHitPulled, setTopHitPulled] = useState<GeneratedCardData | null>(null);
  
  const [activePackArts, setActivePackArts] = useState<string[]>(['/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp']);
  const [activePackArtIndex, setActivePackArtIndex] = useState<number>(0);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Listen for real-time TCGdex full card details updates (names, images, real market prices)
  useEffect(() => {
    const handler = () => {
      setActivePackCards(prevCards => prevCards.map(c => {
        const cached = cardFullCache.get(c.pokemon.id);
        if (cached) {
          const updatedPoke: PokemonCard = {
            ...c.pokemon,
            name: cached.name || c.pokemon.name,
            rarity: cached.rarity || c.pokemon.rarity,
            illustrator: cached.illustrator || c.pokemon.illustrator,
            pricing: cached.pricing || c.pokemon.pricing,
            tcgplayer: cached.tcgplayer || cached.pricing?.tcgplayer ? { prices: cached.tcgplayer || cached.pricing?.tcgplayer, unit: 'USD' } : c.pokemon.tcgplayer,
            cardmarket: cached.cardmarket || cached.pricing?.cardmarket || c.pokemon.cardmarket,
            images: {
              small: getCardImageUrl(cached.image || c.pokemon.images?.small, 'low'),
              large: getCardImageUrl(cached.image || c.pokemon.images?.large, 'high'),
            }
          };
          const newVal = getRealCardPrice(updatedPoke);
          return {
            ...c,
            value: newVal > 0 ? newVal : c.value,
            pokemon: updatedPoke
          };
        }
        return c;
      }));
    };
    
    onCardFullCacheUpdated.add(handler);
    return () => {
      onCardFullCacheUpdated.delete(handler);
    };
  }, []);

  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);

    const reactionInterval = setInterval(() => {
      const emojis = ['❤️', '🔥', '💎', '🚀', '⭐', '⚡', '🎉'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      setReactions(prev => [
        ...prev.slice(-15),
        { id: Date.now() + Math.random(), emoji, x: Math.floor(Math.random() * 40) + 60 }
      ]);
    }, 1200);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(reactionInterval);
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev.slice(-25), msg]);
  };

  const handleSpawnHeart = () => {
    sound.playButtonClick();
    setReactions(prev => [
      ...prev.slice(-15),
      { id: Date.now(), emoji: '❤️', x: Math.floor(Math.random() * 30) + 65 }
    ]);
  };

  const handleSendHostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostInput.trim()) return;
    const userMsg = hostInput.trim();
    sound.playButtonClick();
    addChatMessage({
      id: Date.now().toString(),
      username: 'HOST 🔴',
      message: userMsg,
      badge: 'STREAMER',
      color: 'text-amber-300 font-bold',
      avatarColor: 'from-amber-400 via-yellow-500 to-amber-600'
    });
    setHostInput('');
  };

  // Pre-load the correct pack art and pack data when they click start
  const handleStartRipPack = async () => {
    if (!activeOrder || packStage !== 'unopened' || isLoadingPack) return;
    
    setIsLoadingPack(true);
    sound.playButtonClick();
    
    try {
      // Get exact authentic pack art
      const arts = getPackArtsForSet(activeOrder.setId, packArtsManifest);
      setActivePackArts(arts);
      setActivePackArtIndex(Math.floor(Math.random() * arts.length));
      
      // Load Set & Generate Authentic Pack!
      const setDetails = await fetchSetDetails(activeOrder.setId);
      const newCards = await generatePackFromSet(setDetails, 10);
      
      // Format & sort cards (Energy first, Chase Hit last in reveal stack)
      const sorted = formatAndSortPackCards(newCards);
      
      let maxPrice = 0;
      let topHit: GeneratedCardData | null = null;
      
      const formattedCards: GeneratedCardData[] = sorted.map((c, idx) => {
        const val = getRealCardPrice(c.pokemon);
        const cardData = {
          id: `${c.pokemon.id}-${Date.now()}-${idx}`,
          value: val,
          pokemon: c.pokemon,
          isHit: false
        };
        if (val > maxPrice || !topHit) {
          maxPrice = val;
          topHit = cardData;
        }
        return cardData;
      });
      
      if (topHit) {
        (topHit as GeneratedCardData).isHit = true;
        setTopHitPulled(topHit);
      }
      
      setActivePackCards(formattedCards);
      
      // Warm up full card data & market prices in background
      orchestrateSetLoading(setDetails, newCards.map(c => c.id));
      
      // Ready to tear
      sound.playPackOpen();
      setPackStage('tearing');
      
    } catch (err) {
      console.error("Failed to generate real pack", err);
    } finally {
      setIsLoadingPack(false);
    }
  };

  // Tear Completed
  const handleFoilTearComplete = () => {
    setCurrentCardIndex(0);
    sound.playPackOpen();
    setPackStage('opened');
  };

  const handleFlipNextCard = () => {
    if (currentCardIndex < activePackCards.length - 1) {
      sound.playClothWipe();
      const nextIdx = currentCardIndex + 1;
      setCurrentCardIndex(nextIdx);
      const card = activePackCards[nextIdx];
      if (card && card.value > 15) {
        sound.playLaserScan();
      }
    }
  };

  const getCurrentCardName = (card?: GeneratedCardData | null) => {
    if (!card) return 'Pokemon Card';
    const cached = cardFullCache.get(card.pokemon.id);
    return cached?.name || card.pokemon.name || 'Pokemon Card';
  };

  const getCurrentCardRarity = (card?: GeneratedCardData | null) => {
    if (!card) return 'Common';
    const cached = cardFullCache.get(card.pokemon.id);
    return cached?.rarity || card.pokemon.rarity || 'Common';
  };

  const getCurrentImage = (card?: GeneratedCardData | null) => {
    if (!card) return '';
    const cached = cardFullCache.get(card.pokemon.id);
    const rawImg = cached?.image || card.pokemon.images?.large || card.pokemon.images?.small;
    if (rawImg) {
      return getCardImageUrl(rawImg, 'high');
    }
    if ((card.pokemon as any).image) {
      return getCardImageUrl((card.pokemon as any).image, 'high');
    }
    return '';
  };

  const getCurrentPrice = (card?: GeneratedCardData | null) => {
    if (!card) return 0.10;
    const livePrice = getRealCardPrice(card.pokemon);
    return livePrice > 0 ? livePrice : card.value;
  };

  const handleShipCompletedPack = () => {
    if (!activeOrder || !topHitPulled) return;

    sound.playLaserScan();
    addCash(activeOrder.totalPaid);
    setTotalRevenue(prev => prev + activeOrder.totalPaid);

    const hitName = getCurrentCardName(topHitPulled);
    const hitRarity = getCurrentCardRarity(topHitPulled);
    const hitPrice = getCurrentPrice(topHitPulled);
    const imgUrl = getCurrentImage(topHitPulled);

    const cardToSave: Card = {
      id: topHitPulled.pokemon.id,
      name: hitName,
      setName: activeOrder.packName,
      setNumber: '101/150',
      rarity: hitRarity,
      type: hitRarity,
      currentPrice: hitPrice,
      priceChange: 0,
      priceHistory: [],
      holofoil: topHitPulled.isHit,
      imageUrl: imgUrl || '',
      favorite: topHitPulled.isHit,
      isSlabbed: false,
    };
    
    const collectionCards = getCollectedCards();
    collectionCards.push(cardToSave);
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(collectionCards));
    syncToFirestore();

    setOrders(prev => prev.map(o => {
      if (o.id === activeOrder.id) {
        const pulls = o.pulledCards || [];
        return {
          ...o,
          status: 'completed',
          pulledCards: [...pulls, { name: hitName, value: hitPrice, image: imgUrl || '', rarity: hitRarity }]
        };
      }
      return o;
    }));

    addChatMessage({
      id: Date.now().toString(),
      username: 'STREAM ALERT',
      message: `🎉 GRAIL HIT SHIPPED! ${activeOrder.username} pulled a ${hitName} worth $${hitPrice.toFixed(2)}! 🔥`,
      badge: 'HIT 👑',
      color: 'text-amber-300 font-extrabold',
      avatarColor: 'from-amber-400 to-red-500',
      isOrderNotification: true
    });

    setPackStage('unopened');
    setActivePackCards([]);
    setCurrentCardIndex(0);

    const remaining = orders.filter(o => o.id !== activeOrder.id && o.status === 'pending');
    if (remaining.length > 0) {
      setActiveOrder(remaining[0]);
    }
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#05040a] overflow-hidden text-white flex flex-col select-none">
      {/* ── 1. Top Spacious Stream Header HUD (Row 1) ── */}
      <div className="relative w-full z-40 px-3 sm:px-6 py-2.5 sm:py-3.5 bg-[#090712] border-b border-white/10 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/25 border border-red-500/50 text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span>LIVE &middot; {viewerCount.toLocaleString()}</span>
          </div>

          <div className="bg-black/60 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1 shadow-md shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-black">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <button
            onClick={() => { sound.playButtonClick(); setIsQueueOpen(!isQueueOpen); }}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Orders</span>
            <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </button>

          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-400" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* ── 2. Active Customer Order Banner (Row 2) ── */}
      {activeOrder && (
        <div className="relative w-full z-30 px-3 sm:px-6 py-2 bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border-b border-amber-500/30 backdrop-blur-md flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${activeOrder.avatarColor} flex items-center justify-center font-black text-[9px] text-white shrink-0 shadow-md`}>
              {activeOrder.username.substring(1, 3).toUpperCase()}
            </div>
            <div className="min-w-0 text-left">
              <div className="flex items-center gap-1.5 truncate">
                <span className="text-[11px] font-black text-amber-300 truncate">{activeOrder.username}</span>
                <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">${activeOrder.totalPaid.toFixed(2)}</span>
              </div>
              <div className="text-[10px] text-gray-300 font-bold truncate">
                {activeOrder.packCount}x {activeOrder.packName}
              </div>
            </div>
          </div>

          <button
            onClick={handleStartRipPack}
            disabled={packStage !== 'unopened' || isLoadingPack}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            {isLoadingPack ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Package className="w-3.5 h-3.5" />}
            <span>{isLoadingPack ? 'FETCHING PACK...' : packStage !== 'unopened' ? 'RIPPING...' : '📦 RIP LIVE ⚡'}</span>
          </button>
        </div>
      )}

      {/* ── 3. Overhead Camera & Playmat Arena ── */}
      <div className="relative flex-1 w-full bg-[#0c0915] flex flex-col items-center justify-start overflow-hidden min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1733_0%,#07050d_100%)] flex flex-col items-center justify-center p-2 sm:p-4 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full min-h-[420px] border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-center py-4 relative px-4 overflow-visible">

            {/* STAGE 1: Unopened Pack */}
            {packStage === 'unopened' && (
              <div
                onClick={handleStartRipPack}
                className="relative flex flex-col items-center justify-center cursor-pointer group z-20 mt-2 sm:mt-4"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="relative w-40 sm:w-52 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-2 border-amber-400/50 bg-gradient-to-b from-purple-900 via-indigo-950 to-black flex flex-col items-center justify-between text-center select-none group-hover:border-amber-300 transition-colors p-2.5"
                >
                  {isLoadingPack && (
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                      <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                      <div className="text-[10px] font-black text-amber-400 tracking-widest uppercase">FETCHING SET API...</div>
                    </div>
                  )}

                  <div className="w-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase py-0.5 rounded-full tracking-widest z-10 backdrop-blur-xs">
                    OFFICIAL BOOSTER PACK
                  </div>

                  {activeOrder && getPackArtsForSet(activeOrder.setId, packArtsManifest)[0] ? (
                    <div className="relative w-full flex-1 my-1 rounded-lg overflow-hidden flex items-center justify-center min-h-0">
                      <img 
                        src={getPackArtsForSet(activeOrder.setId, packArtsManifest)[0]} 
                        alt={activeOrder.packName} 
                        className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                    </div>
                  ) : (
                    <div className="space-y-1 my-auto">
                      <Package className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400 mx-auto animate-pulse" />
                      <div className="text-xs sm:text-sm font-black text-white">{activeOrder ? activeOrder.packName : 'Pokemon TCG Pack'}</div>
                    </div>
                  )}

                  <div className="w-full bg-black/80 text-[9px] font-mono text-amber-300 font-bold py-1 rounded border border-amber-400/40 uppercase z-10 tracking-wider">
                    TAP PACK TO TEAR FOIL
                  </div>
                </motion.div>
              </div>
            )}

            {/* STAGE 2: Tear Mechanic */}
            {packStage === 'tearing' && (
              <div className="flex flex-col items-center justify-center z-30 mt-2 sm:mt-4">
                <div className="w-48 sm:w-60">
                  <BoosterPackTear
                    packArts={activePackArts}
                    packArtIndex={activePackArtIndex}
                    onPrevPackArt={() => {}}
                    onNextPackArt={() => {}}
                    onTearComplete={handleFoilTearComplete}
                    setName={activeOrder?.packName}
                    packStage="unopened"
                    remainingCardsCount={10}
                    hideInstructionPill={true}
                  />
                </div>
              </div>
            )}

            {/* STAGE 3: 10-Card Stack Reveal */}
            {packStage === 'opened' && activePackCards.length > 0 && (
              <div className="flex flex-col items-center justify-center z-30 w-full max-w-sm px-4 mt-1 sm:mt-2">
                <div className="flex items-center justify-between w-full max-w-[320px] mb-2 px-1">
                  <span className="text-[11px] font-black text-amber-300 uppercase tracking-wider flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>CARD {currentCardIndex + 1} OF {activePackCards.length}</span>
                  </span>
                  {activePackCards[currentCardIndex]?.isHit && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase tracking-widest animate-pulse">
                      🔥 SECRET RARE HIT!
                    </span>
                  )}
                </div>

                <div 
                  onClick={handleFlipNextCard}
                  className="relative h-[65vh] max-h-[550px] min-h-[320px] aspect-[0.718] rounded-2xl overflow-visible cursor-pointer select-none group transition-transform duration-200 transform hover:scale-105 active:scale-95 z-30"
                >
                  <InteractiveCard3D
                    card={{
                      ...activePackCards[currentCardIndex]?.pokemon,
                      name: getCurrentCardName(activePackCards[currentCardIndex]),
                      rarity: getCurrentCardRarity(activePackCards[currentCardIndex]),
                      imageUrl: getCurrentImage(activePackCards[currentCardIndex]),
                      value: getCurrentPrice(activePackCards[currentCardIndex]),
                    }}
                    interactive={true}
                    className="w-full h-full shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-2 border-white/20 rounded-2xl group-hover:border-amber-400/60"
                  />

                  <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between z-20 rounded-b-2xl pointer-events-none">
                    <div>
                      <div className="text-xs sm:text-sm font-black text-white truncate max-w-[120px] sm:max-w-[160px]">
                        {getCurrentCardName(activePackCards[currentCardIndex])}
                      </div>
                      <div className="text-[10px] text-gray-300 font-bold">
                        {getCurrentCardRarity(activePackCards[currentCardIndex])}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-black text-emerald-400">
                      ${getCurrentPrice(activePackCards[currentCardIndex]).toFixed(2)}
                    </div>
                  </div>
                </div>

                {currentCardIndex === activePackCards.length - 1 && (
                  <div className="mt-3 w-full flex">
                    <button
                      onClick={handleShipCompletedPack}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 animate-bounce"
                    >
                      <Award className="w-4 h-4" />
                      <span>SHIP PACK TO BUYER ✓</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Customer Order Queue Drawer ── */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-24 sm:top-20 inset-x-2 sm:inset-x-6 z-50 p-2 sm:p-3 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-1.5 pointer-events-auto"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-1">
              <span>Customer Order Queue</span>
              <span>{orders.filter(o => o.status === 'pending').length} Pending</span>
            </div>
            <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => { sound.playButtonClick(); setActiveOrder(ord); setPackStage('unopened'); }}
                  className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                    activeOrder?.id === ord.id
                      ? 'border-amber-400 bg-amber-500/25 text-white shadow-lg'
                      : ord.status === 'completed'
                      ? 'border-white/5 bg-white/5 opacity-50'
                      : 'border-white/10 bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-[10px] text-white shrink-0`}>
                    {ord.username.substring(1, 3).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="text-xs font-bold truncate max-w-[100px]">{ord.username}</div>
                    <div className="text-[10px] text-gray-300 font-mono font-bold">{ord.packCount}x {ord.packName}</div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 5. Floating Reactions ── */}
      <div className="absolute inset-y-16 right-4 w-20 pointer-events-none z-30 overflow-hidden">
        {reactions.map(r => (
          <motion.div
            key={r.id}
            initial={{ opacity: 1, y: 300, scale: 0.6 }}
            animate={{ opacity: 0, y: -50, scale: 1.4 }}
            transition={{ duration: 2.2, ease: 'easeOut' }}
            className="absolute text-2xl sm:text-3xl"
            style={{ left: `${r.x - 60}%` }}
          >
            {r.emoji}
          </motion.div>
        ))}
      </div>

      {/* ── 6. Chat ── */}
      <div className="absolute bottom-3 left-2 sm:left-4 right-2 sm:right-auto z-30 w-full sm:w-96 max-w-[calc(100vw-16px)] flex flex-col pointer-events-auto gap-2">
        <div 
          className="max-h-48 sm:max-h-56 overflow-y-auto custom-scrollbar flex flex-col space-y-1.5 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl"
          style={{
            maskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)',
            WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 15%)'
          }}
        >
          {chatMessages.map(msg => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, x: -10, y: 10 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              className={`p-2 rounded-xl border backdrop-blur-md text-xs transition-all flex items-start gap-2 ${
                msg.isOrderNotification 
                  ? 'bg-amber-500/30 border-amber-400/60 text-white font-bold' 
                  : 'bg-black/60 border-white/10 text-gray-100'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-gradient-to-tr ${msg.avatarColor || 'from-purple-500 to-indigo-600'} flex items-center justify-center text-[9px] font-black shrink-0 text-white shadow-sm mt-0.5`}>
                {msg.username.substring(0, 2).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {msg.badge && (
                    <span className="text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-black uppercase tracking-wider">
                      {msg.badge}
                    </span>
                  )}
                  <span className={`font-extrabold text-[11px] ${msg.color || 'text-amber-300'}`}>
                    {msg.username}
                  </span>
                </div>
                <div className="text-[11px] leading-tight text-gray-100 mt-0.5 break-words">
                  {msg.message}
                </div>
              </div>
            </motion.div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        <div className="flex items-center gap-1.5">
          <form onSubmit={handleSendHostMessage} className="flex-1 flex gap-1.5">
            <input
              type="text"
              value={hostInput}
              onChange={e => setHostInput(e.target.value)}
              placeholder="Chat as Host..."
              className="flex-1 px-3.5 py-2 rounded-full bg-black/60 backdrop-blur-xl border border-white/20 text-white text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all shadow-lg"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-lg shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

          <button
            onClick={handleSpawnHeart}
            className="w-9 h-9 rounded-full bg-red-600/30 border border-red-500/60 backdrop-blur-md text-red-400 flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer shrink-0 shadow-lg"
          >
            <Heart className="w-4 h-4 fill-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
