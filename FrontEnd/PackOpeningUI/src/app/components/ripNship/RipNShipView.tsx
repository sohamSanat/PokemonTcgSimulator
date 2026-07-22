import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, ChevronUp, ChevronDown
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash } from '../binder/types';
import { generateVendorReply } from '../../services/geminiVendorChat';

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

const DEFAULT_SAMPLE_PULLS = [
  { name: 'Charizard ex', value: 273.60, rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv3/223_hires.png' },
  { name: 'Blastoise ex', value: 92.50, rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv3/200_hires.png' },
  { name: 'Gengar VMAX', value: 310.00, rarity: 'Alternate Art Secret', image: 'https://images.pokemontcg.io/swsh8/271_hires.png' },
  { name: 'Umbreon VMAX', value: 650.00, rarity: 'Secret Rare', image: 'https://images.pokemontcg.io/swsh7/215_hires.png' },
  { name: 'Pikachu ex', value: 180.00, rarity: 'Special Illustration Rare', image: 'https://images.pokemontcg.io/sv8/238_hires.png' },
  { name: 'Rayquaza VMAX', value: 420.00, rarity: 'Alternate Art Secret', image: 'https://images.pokemontcg.io/swsh7/218_hires.png' },
];

export default function RipNShipView({ onBackToPacks }: RipNShipViewProps) {
  // Stream Stats
  const [viewerCount, setViewerCount] = useState<number>(1420);
  const [totalRevenue, setTotalRevenue] = useState<number>(1280.00);
  const [hypeLevel, setHypeLevel] = useState<number>(4);
  const [hypeProgress, setHypeProgress] = useState<number>(75);
  const [isQueueOpen, setIsQueueOpen] = useState<boolean>(true);

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

  // TikTok / Instagram Style Live Overlay Chat Messages
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
    { id: '2', username: 'PokeKing99', message: 'LET\'S GOOO! Hoping for that 151 Charizard ex SAR today! 🔥', badge: 'BUYER', color: 'text-emerald-400', avatarColor: 'from-amber-400 to-orange-500' },
    { id: '3', username: 'SlabKing', message: 'Moonbreon hunting on my Evolving Skies order 👀🚀', badge: 'BUYER', color: 'text-purple-400', avatarColor: 'from-purple-500 to-indigo-600' },
    { id: '4', username: 'CardCollectorX', message: 'Drop some hype in chat everyone! 🎉', color: 'text-sky-300', avatarColor: 'from-cyan-400 to-blue-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);
  const [isOpeningPack, setIsOpeningPack] = useState<boolean>(false);
  const [currentPulledCard, setCurrentPulledCard] = useState<typeof DEFAULT_SAMPLE_PULLS[0] | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic Viewer Fluctuation & Floating Reaction Spawner
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);

    // Spawn floating TikTok/Instagram reactions
    const reactionInterval = setInterval(() => {
      const emojis = ['❤️', '🔥', '💎', '🚀', '⭐', '⚡', '🎉'];
      const emoji = emojis[Math.floor(Math.random() * emojis.length)];
      const x = Math.floor(Math.random() * 40) + 60; // 60% to 100% right side
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

  // Tap screen to spawn heart reaction
  const handleSpawnHeart = () => {
    sound.playButtonClick();
    const emojis = ['❤️', '🔥', '💎', '🚀'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];
    setReactions(prev => [
      ...prev.slice(-15),
      { id: Date.now(), emoji, x: Math.floor(Math.random() * 30) + 65 }
    ]);
  };

  // Host Chatting with Gemini AI Chatter Reactions
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

    // Trigger AI Chat Reaction via Gemini Service
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

  // Ripping Pack for Customer
  const handleRipPackForCustomer = () => {
    if (!activeOrder || isOpeningPack) return;

    sound.playPackOpen();
    setIsOpeningPack(true);

    setTimeout(() => {
      const pull = DEFAULT_SAMPLE_PULLS[Math.floor(Math.random() * DEFAULT_SAMPLE_PULLS.length)];
      setCurrentPulledCard(pull);
      sound.playLaserScan();

      // Add earnings
      addCash(activeOrder.totalPaid);
      setTotalRevenue(prev => prev + activeOrder.totalPaid);

      // Update Order Status
      setOrders(prev => prev.map(o => {
        if (o.id === activeOrder.id) {
          const pulls = o.pulledCards || [];
          return {
            ...o,
            status: 'completed',
            pulledCards: [...pulls, pull]
          };
        }
        return o;
      }));

      // Add Chat Announcement
      addChatMessage({
        id: Date.now().toString(),
        username: 'STREAM ALERT',
        message: `🎉 GRAIL HIT! ${activeOrder.username} pulled a ${pull.name} (${pull.rarity}) worth $${pull.value.toFixed(2)}! 🔥`,
        badge: 'HIT 👑',
        color: 'text-amber-300 font-extrabold',
        avatarColor: 'from-amber-400 to-red-500',
        isOrderNotification: true
      });

      setIsOpeningPack(false);

      // Advance to next pending order
      const remaining = orders.filter(o => o.id !== activeOrder.id && o.status === 'pending');
      if (remaining.length > 0) {
        setActiveOrder(remaining[0]);
      }
    }, 1800);
  };

  return (
    <div className="relative w-full h-[100dvh] bg-[#05040a] overflow-hidden text-white flex flex-col select-none">
      {/* ── 1. Top Compact Live Stream Header HUD ── */}
      <div className="absolute top-0 inset-x-0 z-40 p-2 sm:p-4 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* Live Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/30 border border-red-500/60 text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-wider backdrop-blur-md shadow-lg shadow-red-600/20 animate-pulse">
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
            <span>LIVE &middot; {viewerCount.toLocaleString()}</span>
          </div>

          {/* Stream Revenue */}
          <div className="bg-black/60 backdrop-blur-md border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1">
            <DollarSign className="w-3 h-3 text-emerald-400" />
            <span>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>

          {/* Hype Level */}
          <div className="hidden md:flex items-center gap-1.5 bg-purple-900/40 backdrop-blur-md border border-purple-500/40 px-2.5 py-1 rounded-full text-xs font-bold text-purple-300">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span>Lvl {hypeLevel}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Toggle Customer Queue Drawer */}
          <button
            onClick={() => { sound.playButtonClick(); setIsQueueOpen(!isQueueOpen); }}
            className="px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-xs font-bold flex items-center gap-1 text-gray-200 hover:text-white backdrop-blur-md transition-all cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Orders</span>
            <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black">
              {orders.filter(o => o.status === 'pending').length}
            </span>
          </button>

          {/* Leave Stream */}
          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="px-3 py-1 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-bold flex items-center gap-1 backdrop-blur-md transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>
      </div>

      {/* ── 2. Overhead Camera & Playmat Video Canvas (Fills Screen) ── */}
      <div className="relative flex-1 w-full h-full bg-[#0c0915] flex flex-col items-center justify-center overflow-hidden">
        {/* Overhead Camera Grid Background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1733_0%,#07050d_100%)] flex flex-col items-center justify-center p-3 sm:p-6">
          <div className="w-full h-full border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-center relative p-4 overflow-hidden">
            
            {/* Stream HUD Scanner Line Overlay */}
            <div className="absolute top-3 left-4 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] sm:text-xs">
              <Video className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span className="font-mono font-bold text-gray-200">1080p60 &middot; OVERHEAD RIP CAM</span>
            </div>

            {/* Active Customer Order Spotlight Table */}
            {activeOrder ? (
              <div className="text-center space-y-3 sm:space-y-4 z-20 max-w-sm w-full my-auto px-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/40 shadow-lg backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                  <span className="text-xs font-black text-amber-300">RIPPING FOR {activeOrder.username}</span>
                </div>

                <div className="p-4 sm:p-6 rounded-3xl bg-black/60 border border-white/10 backdrop-blur-xl shadow-2xl space-y-2">
                  <h3 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {activeOrder.packCount}x {activeOrder.packName}
                  </h3>

                  <div className="text-xs sm:text-sm font-mono font-bold text-emerald-400">
                    Order Total Paid: ${activeOrder.totalPaid.toFixed(2)}
                  </div>
                </div>

                {/* Rip Action Button */}
                <div>
                  <button
                    onClick={handleRipPackForCustomer}
                    disabled={isOpeningPack}
                    className="w-full sm:w-auto px-8 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_0_35px_rgba(239,68,68,0.6)] border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mx-auto"
                  >
                    <Package className="w-5 h-5" />
                    <span>{isOpeningPack ? '🔥 RIPPING PACK LIVE...' : '📦 RIP PACK LIVE ON CAMERA'}</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs sm:text-sm my-auto">
                No order selected. Select an order from the queue at the top!
              </div>
            )}

            {/* Revealed Pulled Card Overlay Modal */}
            <AnimatePresence>
              {currentPulledCard && (
                <motion.div
                  initial={{ scale: 0.7, opacity: 0, y: 40 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.7, opacity: 0, y: 40 }}
                  className="absolute inset-2 sm:inset-6 rounded-3xl bg-black/95 border-2 border-amber-400/80 p-4 flex flex-col md:flex-row items-center justify-center gap-4 z-50 shadow-[0_0_60px_rgba(245,158,11,0.4)] backdrop-blur-xl"
                >
                  <img src={currentPulledCard.image} alt={currentPulledCard.name} className="w-32 sm:w-44 aspect-[2.5/3.5] rounded-2xl object-cover border-2 border-amber-300 shadow-[0_0_35px_rgba(245,158,11,0.6)]" />
                  <div className="text-center md:text-left space-y-1.5 sm:space-y-2">
                    <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-[10px] font-black uppercase text-amber-300 tracking-widest">
                      🔥 GRAIL HIT LIVE ON STREAM!
                    </div>
                    <h4 className="text-lg sm:text-2xl font-black text-white">{currentPulledCard.name}</h4>
                    <div className="text-xs text-gray-300 font-medium">{currentPulledCard.rarity}</div>
                    <div className="text-xl sm:text-2xl font-mono font-black text-emerald-400">${currentPulledCard.value.toFixed(2)}</div>
                    <button
                      onClick={() => setCurrentPulledCard(null)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 text-black font-black text-xs uppercase tracking-wider shadow-lg cursor-pointer hover:brightness-110"
                    >
                      Ship Card to Buyer ✓
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── 3. Customer Order Queue Drawer (Top Floating Reel) ── */}
      <AnimatePresence>
        {isQueueOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-14 inset-x-2 sm:inset-x-6 z-30 p-2 sm:p-3 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-1.5 pointer-events-auto"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-1">
              <span>Customer Order Queue</span>
              <span>{orders.filter(o => o.status === 'pending').length} Pending</span>
            </div>

            <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => { sound.playButtonClick(); setActiveOrder(ord); }}
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

      {/* ── 4. Floating Social Reactions (TikTok / Instagram Right Edge) ── */}
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

      {/* ── 5. ON-SCREEN TIKTOK / INSTAGRAM STYLE OVERLAY CHAT (Bottom Left) ── */}
      <div className="absolute bottom-3 left-2 sm:left-4 right-2 sm:right-auto z-30 w-full sm:w-96 max-w-[calc(100vw-16px)] flex flex-col pointer-events-auto gap-2">
        {/* Chat Rolling Message Overlay Box */}
        <div 
          className="max-h-52 sm:max-h-64 overflow-y-auto custom-scrollbar flex flex-col space-y-1.5 p-2 rounded-2xl bg-black/40 backdrop-blur-md border border-white/10 shadow-2xl"
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
