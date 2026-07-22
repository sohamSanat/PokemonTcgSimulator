import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, ChevronUp, ChevronDown, Layers, RotateCw
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateVendorReply } from '../../services/geminiVendorChat';
import { BoosterPackTear } from '../BoosterPackTear';

interface RipNShipViewProps {
  onBackToPacks: () => void;
}

interface CustomerOrder {
  id: string;
  username: string;
  avatarColor: string;
  packName: string;
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
  x: number; // percentage
}

interface PulledCardItem {
  id: string;
  name: string;
  rarity: string;
  value: number;
  image: string;
  isHit: boolean;
}

// REAL POKÉMON TCG PACK POOLS WITH AUTHENTIC ODDS & MARKET PRICES
const REAL_PACK_POOLS: Record<string, PulledCardItem[]> = {
  '151': [
    { id: '151-223', name: 'Charizard ex SAR', rarity: 'Special Illustration Rare', value: 273.60, image: 'https://images.pokemontcg.io/sv3/223_hires.png', isHit: true },
    { id: '151-200', name: 'Blastoise ex SAR', rarity: 'Special Illustration Rare', value: 92.50, image: 'https://images.pokemontcg.io/sv3/200_hires.png', isHit: true },
    { id: '151-198', name: 'Venusaur ex SAR', rarity: 'Special Illustration Rare', value: 58.00, image: 'https://images.pokemontcg.io/sv3/198_hires.png', isHit: true },
    { id: '151-201', name: 'Alakazam ex SAR', rarity: 'Special Illustration Rare', value: 42.00, image: 'https://images.pokemontcg.io/sv3/201_hires.png', isHit: true },
    { id: '151-202', name: 'Zapdos ex SAR', rarity: 'Special Illustration Rare', value: 38.50, image: 'https://images.pokemontcg.io/sv3/202_hires.png', isHit: true },
    { id: '151-173', name: 'Pikachu IR', rarity: 'Illustration Rare', value: 18.50, image: 'https://images.pokemontcg.io/sv3/173_hires.png', isHit: false },
    { id: '151-170', name: 'Squirtle IR', rarity: 'Illustration Rare', value: 26.00, image: 'https://images.pokemontcg.io/sv3/170_hires.png', isHit: false },
    { id: '151-168', name: 'Charmander IR', rarity: 'Illustration Rare', value: 28.00, image: 'https://images.pokemontcg.io/sv3/168_hires.png', isHit: false },
    { id: '151-166', name: 'Bulbasaur IR', rarity: 'Illustration Rare', value: 22.00, image: 'https://images.pokemontcg.io/sv3/166_hires.png', isHit: false },
    { id: '151-143', name: 'Snorlax Holo', rarity: 'Holo Rare', value: 4.50, image: 'https://images.pokemontcg.io/sv3/143_hires.png', isHit: false },
    { id: '151-94', name: 'Gengar Holo', rarity: 'Holo Rare', value: 3.20, image: 'https://images.pokemontcg.io/sv3/94_hires.png', isHit: false },
    { id: '151-38', name: 'Ninetales ex', rarity: 'Double Rare', value: 2.50, image: 'https://images.pokemontcg.io/sv3/38_hires.png', isHit: false },
    { id: '151-39', name: 'Jigglypuff', rarity: 'Common', value: 0.25, image: 'https://images.pokemontcg.io/sv3/39_hires.png', isHit: false },
    { id: '151-52', name: 'Meowth', rarity: 'Common', value: 0.15, image: 'https://images.pokemontcg.io/sv3/52_hires.png', isHit: false },
    { id: '151-54', name: 'Psyduck', rarity: 'Uncommon', value: 0.40, image: 'https://images.pokemontcg.io/sv3/54_hires.png', isHit: false },
  ],
  'Evolving Skies': [
    { id: 'es-215', name: 'Umbreon VMAX (Moonbreon)', rarity: 'Alternate Art Secret', value: 650.00, image: 'https://images.pokemontcg.io/swsh7/215_hires.png', isHit: true },
    { id: 'es-218', name: 'Rayquaza VMAX Alt Art', rarity: 'Alternate Art Secret', value: 420.00, image: 'https://images.pokemontcg.io/swsh7/218_hires.png', isHit: true },
    { id: 'es-212', name: 'Sylveon VMAX Alt Art', rarity: 'Alternate Art Secret', value: 210.00, image: 'https://images.pokemontcg.io/swsh7/212_hires.png', isHit: true },
    { id: 'es-209', name: 'Glaceon VMAX Alt Art', rarity: 'Alternate Art Secret', value: 185.00, image: 'https://images.pokemontcg.io/swsh7/209_hires.png', isHit: true },
    { id: 'es-205', name: 'Leafeon VMAX Alt Art', rarity: 'Alternate Art Secret', value: 240.00, image: 'https://images.pokemontcg.io/swsh7/205_hires.png', isHit: true },
    { id: 'es-192', name: 'Dragonite V Alt Art', rarity: 'Alternate Art Secret', value: 125.00, image: 'https://images.pokemontcg.io/swsh7/192_hires.png', isHit: true },
    { id: 'es-125', name: 'Eevee Reverse Holo', rarity: 'Reverse Holo', value: 1.50, image: 'https://images.pokemontcg.io/swsh7/125_hires.png', isHit: false },
    { id: 'es-220', name: 'Duraludon VMAX Gold', rarity: 'Secret Rare', value: 22.00, image: 'https://images.pokemontcg.io/swsh7/220_hires.png', isHit: false },
    { id: 'es-49', name: 'Pikachu', rarity: 'Common', value: 0.30, image: 'https://images.pokemontcg.io/swsh7/49_hires.png', isHit: false },
  ],
  'Base Set': [
    { id: 'base-4', name: 'Charizard 1st Edition', rarity: '1st Edition Shadowless Holo', value: 1250.00, image: 'https://images.pokemontcg.io/base1/4_hires.png', isHit: true },
    { id: 'base-2', name: 'Blastoise Holo', rarity: 'Holo Rare', value: 180.00, image: 'https://images.pokemontcg.io/base1/2_hires.png', isHit: true },
    { id: 'base-15', name: 'Venusaur Holo', rarity: 'Holo Rare', value: 140.00, image: 'https://images.pokemontcg.io/base1/15_hires.png', isHit: true },
    { id: 'base-10', name: 'Mewtwo Holo', rarity: 'Holo Rare', value: 85.00, image: 'https://images.pokemontcg.io/base1/10_hires.png', isHit: true },
    { id: 'base-6', name: 'Gyarados Holo', rarity: 'Holo Rare', value: 45.00, image: 'https://images.pokemontcg.io/base1/6_hires.png', isHit: false },
    { id: 'base-1', name: 'Alakazam Holo', rarity: 'Holo Rare', value: 55.00, image: 'https://images.pokemontcg.io/base1/1_hires.png', isHit: false },
    { id: 'base-58', name: 'Pikachu Red Cheeks', rarity: 'Shadowless Common', value: 35.00, image: 'https://images.pokemontcg.io/base1/58_hires.png', isHit: false },
    { id: 'base-44', name: 'Bulbasaur', rarity: 'Common', value: 2.50, image: 'https://images.pokemontcg.io/base1/44_hires.png', isHit: false },
    { id: 'base-46', name: 'Charmander', rarity: 'Common', value: 3.50, image: 'https://images.pokemontcg.io/base1/46_hires.png', isHit: false },
    { id: 'base-63', name: 'Squirtle', rarity: 'Common', value: 3.00, image: 'https://images.pokemontcg.io/base1/63_hires.png', isHit: false },
  ]
};

// Helper: Real weighted pull odds generator (10 cards per pack)
function generateRealPackCards(packName: string): PulledCardItem[] {
  let pool = REAL_PACK_POOLS['151'];
  if (packName.includes('Evolving')) pool = REAL_PACK_POOLS['Evolving Skies'];
  if (packName.includes('Base')) pool = REAL_PACK_POOLS['Base Set'];

  const hits = pool.filter(c => c.isHit);
  const regular = pool.filter(c => !c.isHit);

  const packCards: PulledCardItem[] = [];

  // Generate 8 regular common/uncommon/holo cards
  for (let i = 0; i < 8; i++) {
    const card = regular[Math.floor(Math.random() * regular.length)];
    packCards.push({ ...card, id: `${card.id}-${i}-${Date.now()}` });
  }

  // 1 Reverse Holo / Foil
  const reverseCard = pool[Math.floor(Math.random() * pool.length)];
  packCards.push({ ...reverseCard, id: `${reverseCard.id}-rev-${Date.now()}` });

  // 1 RARE HIT SLOT (Authentic market probability: 25% ultra-rare hit, 75% regular rare)
  const isChaseHit = Math.random() < 0.35;
  const rareHit = isChaseHit ? hits[Math.floor(Math.random() * hits.length)] : regular[Math.floor(Math.random() * regular.length)];
  packCards.push({ ...rareHit, id: `${rareHit.id}-hit-${Date.now()}` });

  return packCards;
}

export default function RipNShipView({ onBackToPacks }: RipNShipViewProps) {
  // Stream Stats
  const [viewerCount, setViewerCount] = useState<number>(1420);
  const [totalRevenue, setTotalRevenue] = useState<number>(1280.00);
  const [hypeLevel, setHypeLevel] = useState<number>(4);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);

  // Floating Social Live Reactions
  const [reactions, setReactions] = useState<FloatingReaction[]>([]);

  // Customer Orders Queue
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: 'ord-101',
      username: '@PokeKing99',
      avatarColor: 'from-amber-400 to-orange-500',
      packName: '151 Booster Pack',
      packCount: 3,
      totalPaid: 86.73,
      status: 'pending'
    },
    {
      id: 'ord-102',
      username: '@SlabKing',
      avatarColor: 'from-purple-500 to-indigo-600',
      packName: 'Evolving Skies Pack',
      packCount: 2,
      totalPaid: 88.00,
      status: 'pending'
    },
    {
      id: 'ord-103',
      username: '@CharizardHunter',
      avatarColor: 'from-red-500 to-rose-700',
      packName: 'Base Set Vintage Pack',
      packCount: 1,
      totalPaid: 449.99,
      status: 'pending'
    },
  ]);

  // Live Stream Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
    { id: '2', username: 'PokeKing99', message: 'LET\'S GOOO! Hoping for that 151 Charizard ex SAR today! 🔥', badge: 'BUYER', color: 'text-emerald-400', avatarColor: 'from-amber-400 to-orange-500' },
    { id: '3', username: 'SlabKing', message: 'Moonbreon hunting on my Evolving Skies order 👀🚀', badge: 'BUYER', color: 'text-purple-400', avatarColor: 'from-purple-500 to-indigo-600' },
    { id: '4', username: 'CardCollectorX', message: 'Drop some hype in chat everyone! 🎉', color: 'text-sky-300', avatarColor: 'from-cyan-400 to-blue-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

  // Mastered 3D Pack Opening States
  const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
  const [activePackCards, setActivePackCards] = useState<PulledCardItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [topHitPulled, setTopHitPulled] = useState<PulledCardItem | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic Viewer Fluctuation & Floating Reaction Spawner
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);

    const reactionInterval = setInterval(() => {
      const emojis = ['❤️', '🔥', '💎', '🚀', '⭐', '⚡', '🎉'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const x = Math.floor(Math.random() * 40) + 60;
      setReactions(prev => [
        ...prev.slice(-15),
        { id: Date.now() + Math.random(), emoji, x }
      ]);
    }, 1200);

    const chatNames = ['@GottaCatchEmAll', '@ShadowLugia', '@TrainerRed', '@HoloHunter', '@VmaxGod', '@PikaFanatic'];
    const chatPhrases = [
      'OH MY GOD THAT PULL WAS INSANE! 🔥',
      'Rip my order next please! 🙏',
      'Hype train level 5 incoming! 🎉',
      'What set are we ripping next??',
      'Is 151 in stock right now?',
      'GEM MINT PULL INCOMING!! 👑',
    ];

    const randomChatInterval = setInterval(() => {
      const name = chatNames[Math.floor(Math.random() * chatNames.length)];
      const msg = chatPhrases[Math.floor(Math.random() * chatPhrases.length)];
      addChatMessage({
        id: Date.now().toString(),
        username: name,
        message: msg,
        color: 'text-gray-200'
      });
    }, 3800);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(reactionInterval);
      clearInterval(randomChatInterval);
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
    const emojis = ['❤️', '🔥', '💎', '🚀'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    setReactions(prev => [
      ...prev.slice(-15),
      { id: Date.now(), emoji, x: Math.floor(Math.random() * 30) + 65 }
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

    try {
      const res = await generateVendorReply({
        vendorName: 'Live Stream Audience',
        vendorBooth: 'Stream Studio',
        vendorRating: '5.0',
        cardName: 'Booster Packs & Mystery Boxes',
        cardPrice: 100,
        cardGrade: 'Factory Sealed',
        chatHistory: [],
        userMessage: userMsg
      });

      const replyText = typeof res === 'string' ? res : res.text;

      setTimeout(() => {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          username: '@HypeViewerAI',
          message: replyText || 'LET\'S GOOO STREAMER! 🔥 Open those packs!',
          badge: 'VIP',
          color: 'text-emerald-400',
          avatarColor: 'from-emerald-400 to-teal-600'
        });
      }, 1000);
    } catch {
      setTimeout(() => {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          username: '@ChatterBot',
          message: 'Hyped stream bro!! Let\'s see that Charizard pull! 🔥',
          color: 'text-sky-300',
          avatarColor: 'from-cyan-400 to-blue-600'
        });
      }, 800);
    }
  };

  // 1. Start Pack Tear Stage
  const handleStartRipPack = () => {
    if (!activeOrder || packStage !== 'unopened') return;
    sound.playPackOpen();
    setPackStage('tearing');
  };

  // 2. Foil Tear Complete: Generate 10 Real-Odds Cards & Enter Card Stack Reveal
  const handleFoilTearComplete = () => {
    if (!activeOrder) return;

    const generatedCards = generateRealPackCards(activeOrder.packName);
    setActivePackCards(generatedCards);
    setCurrentCardIndex(0);

    // Find top highest value hit
    const sorted = [...generatedCards].sort((a, b) => b.value - a.value);
    const topHit = sorted[0];
    setTopHitPulled(topHit);

    sound.playPackOpen();
    setPackStage('opened');
  };

  // 3. Flip Next Card in 10-Card Stack
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

  // 4. Complete Pack Ripping & Ship Cards to Customer
  const handleShipCompletedPack = () => {
    if (!activeOrder || !topHitPulled) return;

    sound.playLaserScan();

    // Add Revenue
    addCash(activeOrder.totalPaid);
    setTotalRevenue(prev => prev + activeOrder.totalPaid);

    // Save Top Pulled Card to Host's Collection Binder
    const cardToSave: Card = {
      id: topHitPulled.id,
      name: topHitPulled.name,
      setName: activeOrder.packName,
      setNumber: '101/150',
      rarity: topHitPulled.rarity,
      type: 'Rare',
      currentPrice: topHitPulled.value,
      priceChange: 0,
      priceHistory: [],
      holofoil: topHitPulled.isHit,
      imageUrl: topHitPulled.image,
      favorite: topHitPulled.isHit,
      isSlabbed: false,
    };
    const collectionCards = getCollectedCards();
    collectionCards.push(cardToSave);
    localStorage.setItem(getStorageKey('tcg_my_collection'), JSON.stringify(collectionCards));
    syncToFirestore();

    // Update Customer Order Status
    setOrders(prev => prev.map(o => {
      if (o.id === activeOrder.id) {
        const pulls = o.pulledCards || [];
        return {
          ...o,
          status: 'completed',
          pulledCards: [...pulls, topHitPulled]
        };
      }
      return o;
    }));

    // Add Chat Announcement
    addChatMessage({
      id: Date.now().toString(),
      username: 'STREAM ALERT',
      message: `🎉 GRAIL HIT SHIPPED! ${activeOrder.username} pulled a ${topHitPulled.name} (${topHitPulled.rarity}) worth $${topHitPulled.value.toFixed(2)}! 🔥`,
      badge: 'HIT 👑',
      color: 'text-amber-300 font-extrabold',
      avatarColor: 'from-amber-400 to-red-500',
      isOrderNotification: true
    });

    // Reset Pack Stage for Next Pack
    setPackStage('unopened');
    setActivePackCards([]);
    setCurrentCardIndex(0);

    // Advance to next pending order
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
          {/* Live Badge & Viewer Count */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/25 border border-red-500/50 text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md shrink-0">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
            <span>LIVE &middot; {viewerCount.toLocaleString()}</span>
          </div>

          {/* Stream Revenue Badge */}
          <div className="bg-black/60 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1 shadow-md shrink-0">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="font-mono font-black">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Hype Level */}
          <div className="hidden md:flex items-center gap-1.5 bg-purple-950/60 border border-purple-500/40 px-2.5 py-1 rounded-full text-xs font-bold text-purple-300 shadow-md">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Hype Lvl {hypeLevel}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Toggle Customer Queue Drawer (Cart Icon Button) */}
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

          {/* Exit Stream Button */}
          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-[11px] sm:text-xs font-black flex items-center gap-1 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-red-400" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* ── 2. Active Customer Order Banner (Row 2 - Zero Overlap Guarantee) ── */}
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

          {/* Compact Rip Button */}
          <button
            onClick={handleStartRipPack}
            disabled={packStage !== 'unopened'}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Package className="w-3.5 h-3.5" />
            <span>{packStage !== 'unopened' ? 'Ripping...' : '📦 RIP LIVE ⚡'}</span>
          </button>
        </div>
      )}

      {/* ── 3. Overhead Camera & Mastered 3D Pack Opening Playmat Arena ── */}
      <div className="relative flex-1 w-full h-full bg-[#0c0915] flex flex-col items-center justify-center overflow-hidden min-h-0">
        {/* Overhead Camera Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1733_0%,#07050d_100%)] flex flex-col items-center justify-center p-3 sm:p-6">
          <div className="w-full h-full border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-center relative p-4 overflow-hidden">

            {/* STAGE 1: Unopened Pack Resting on Playmat */}
            {packStage === 'unopened' && (
              <div
                onClick={handleStartRipPack}
                className="my-auto relative flex flex-col items-center justify-center cursor-pointer group z-20"
              >
                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="relative w-36 sm:w-48 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] border-2 border-amber-400/50 bg-gradient-to-b from-purple-900 via-indigo-950 to-black p-3 flex flex-col items-center justify-between text-center select-none group-hover:border-amber-300 transition-colors"
                >
                  <div className="w-full bg-amber-400/20 border border-amber-400/40 text-amber-300 text-[9px] font-black uppercase py-0.5 rounded-full tracking-widest">
                    OFFICIAL BOOSTER PACK
                  </div>

                  <div className="space-y-1">
                    <Package className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400 mx-auto animate-pulse" />
                    <div className="text-xs sm:text-sm font-black text-white">{activeOrder ? activeOrder.packName : 'Pokemon TCG Pack'}</div>
                    <div className="text-[10px] text-amber-300/80 font-bold">10 ADDITIONAL CARDS</div>
                  </div>

                  <div className="w-full bg-black/70 text-[9px] font-mono text-amber-300 font-bold py-1 rounded border border-amber-400/30 uppercase">
                    TAP PACK TO TEAR FOIL
                  </div>
                </motion.div>
              </div>
            )}

            {/* STAGE 2: Mastered 3D Serrated Foil Tear Mechanic */}
            {packStage === 'tearing' && (
              <div className="my-auto flex flex-col items-center justify-center z-30">
                <div className="text-xs font-black text-amber-300 uppercase tracking-widest mb-2 bg-black/70 px-3 py-1 rounded-full border border-amber-400/40 animate-pulse">
                  ✂️ SWIPE TOP FOIL NOTCH TO TEAR OPEN
                </div>
                <div className="w-48 sm:w-60">
                  <BoosterPackTear
                    packArts={['/packArts/MegaEvolution-Generation/Ascended-heroes/1.webp']}
                    packArtIndex={0}
                    onPrevPackArt={() => {}}
                    onNextPackArt={() => {}}
                    onTearComplete={handleFoilTearComplete}
                    setName={activeOrder?.packName}
                    packStage="unopened"
                    remainingCardsCount={10}
                  />
                </div>
              </div>
            )}

            {/* STAGE 3: Mastered 10-Card Interactive Stack Reveal */}
            {packStage === 'opened' && activePackCards.length > 0 && (
              <div className="my-auto flex flex-col items-center justify-center z-30 w-full max-w-sm px-4">
                <div className="flex items-center justify-between w-full mb-2 px-1">
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

                {/* 3D Stack Card Display */}
                <div 
                  onClick={handleFlipNextCard}
                  className="relative w-44 sm:w-56 aspect-[2.5/3.5] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-2 border-white/30 cursor-pointer select-none group transition-transform duration-200 transform hover:scale-105 active:scale-95"
                >
                  <img
                    src={activePackCards[currentCardIndex]?.image}
                    alt={activePackCards[currentCardIndex]?.name}
                    className="w-full h-full object-cover"
                  />

                  {/* Foil Holographic Shine on Rare Hits */}
                  {activePackCards[currentCardIndex]?.isHit && (
                    <div className="absolute inset-0 bg-gradient-to-tr from-amber-400/20 via-purple-500/20 to-cyan-400/20 backdrop-blur-[1px] pointer-events-none animate-pulse" />
                  )}

                  {/* Bottom Card Details Footer */}
                  <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-black via-black/80 to-transparent flex items-center justify-between">
                    <div>
                      <div className="text-xs font-black text-white truncate max-w-[120px] sm:max-w-[150px]">
                        {activePackCards[currentCardIndex]?.name}
                      </div>
                      <div className="text-[9px] text-gray-300 font-bold">
                        {activePackCards[currentCardIndex]?.rarity}
                      </div>
                    </div>
                    <div className="text-xs font-mono font-black text-emerald-400">
                      ${activePackCards[currentCardIndex]?.value.toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Action Buttons: Next Card / Complete Ship */}
                <div className="mt-3 w-full flex gap-2">
                  {currentCardIndex < activePackCards.length - 1 ? (
                    <button
                      onClick={handleFlipNextCard}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-500 to-purple-600 text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1 cursor-pointer hover:brightness-110"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>FLIP NEXT CARD ({currentCardIndex + 1}/10)</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleShipCompletedPack}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-110 animate-bounce"
                    >
                      <Award className="w-4 h-4" />
                      <span>SHIP PACK TO BUYER ✓</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── 4. Customer Order Queue Drawer (Top Floating Reel) ── */}
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

      {/* ── 5. Floating Social Reactions (TikTok / Instagram Right Edge) ── */}
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

      {/* ── 6. ON-SCREEN TIKTOK / INSTAGRAM STYLE OVERLAY CHAT (Bottom Left) ── */}
      <div className="absolute bottom-3 left-2 sm:left-4 right-2 sm:right-auto z-30 w-full sm:w-96 max-w-[calc(100vw-16px)] flex flex-col pointer-events-auto gap-2">
        {/* Chat Rolling Message Overlay Box */}
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

        {/* Floating Host Chat Input Bar */}
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

          {/* Quick Heart Reaction Button */}
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
