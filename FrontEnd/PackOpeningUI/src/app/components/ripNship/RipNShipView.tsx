import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Radio, Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2, Play
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
  isOrderNotification?: boolean;
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
    { id: '1', username: 'StreamBot', message: '🔴 STREAM IS LIVE! Opening packs for buyers! Type in chat to talk to the host!', badge: 'MOD', color: 'text-amber-400' },
    { id: '2', username: 'PokeKing99', message: 'LET\'S GOOO! Hoping for that 151 Charizard ex SAR today! 🔥', badge: 'BUYER', color: 'text-emerald-400' },
    { id: '3', username: 'SlabKing', message: 'Moonbreon hunting on my Evolving Skies order 👀🚀', badge: 'BUYER', color: 'text-purple-400' },
    { id: '4', username: 'CardCollectorX', message: 'Drop some hype in chat everyone! 🎉', color: 'text-sky-300' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);
  const [isOpeningPack, setIsOpeningPack] = useState<boolean>(false);
  const [currentPulledCard, setCurrentPulledCard] = useState<typeof DEFAULT_SAMPLE_PULLS[0] | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Dynamic Viewer Fluctuation & AI Chat Rolling
  useEffect(() => {
    const viewerInterval = setInterval(() => {
      setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
    }, 3000);

    const chatNames = ['@GottaCatchEmAll', '@ShadowLugia', '@TrainerRed', '@HoloHunter', '@VmaxGod', '@PikaFanatic'];
    const chatPhrases = [
      'OH MY GOD THAT PULLED WAS INSANE! 🔥',
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
        color: 'text-gray-300'
      });
    }, 4500);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(randomChatInterval);
    };
  }, []);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const addChatMessage = (msg: ChatMessage) => {
    setChatMessages(prev => [...prev.slice(-35), msg]);
  };

  // Host Chatting with Gemini AI Chatter Reactions
  const handleSendHostMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hostInput.trim()) return;

    const userMsg = hostInput.trim();
    sound.playButtonClick();
    addChatMessage({
      id: Date.now().toString(),
      username: 'HOST (You)',
      message: userMsg,
      badge: 'STREAMER 🔴',
      color: 'text-amber-300 font-bold'
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
          badge: 'AI VIP',
          color: 'text-emerald-400'
        });
      }, 1000);
    } catch {
      setTimeout(() => {
        addChatMessage({
          id: (Date.now() + 1).toString(),
          username: '@ChatterBot',
          message: 'Hyped stream bro!! Let\'s see that Charizard pull! 🔥',
          color: 'text-sky-300'
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
        username: 'STREAM ANNOUNCEMENT',
        message: `🎉 HUGE HIT! ${activeOrder.username} pulled a ${pull.name} (${pull.rarity}) worth $${pull.value.toFixed(2)}! 🔥`,
        badge: 'HIT ALERT',
        color: 'text-amber-400 font-extrabold',
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
    <div className="flex-1 flex flex-col h-full bg-[#09080e] overflow-hidden text-white">
      {/* Top Streamer Bar */}
      <div className="px-5 py-3 border-b border-white/10 bg-black/60 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          {/* Live Badge */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/50 text-red-400 font-black text-xs uppercase tracking-wider animate-pulse">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
            <span>🔴 LIVE &middot; {viewerCount.toLocaleString()} Viewers</span>
          </div>

          <div className="hidden sm:block text-xs font-bold text-gray-300">
            🔥 RIP & SHIP GRAIL NIGHT &middot; <span className="text-amber-400 font-mono font-black">${totalRevenue.toLocaleString()} Stream Revenue</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Hype Train Bar */}
          <div className="hidden md:flex items-center gap-2 bg-purple-900/30 border border-purple-500/30 px-3 py-1 rounded-full text-xs font-bold">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
            <span className="text-purple-300">Hype Train Lvl {hypeLevel}</span>
            <div className="w-16 bg-black/50 h-1.5 rounded-full overflow-hidden border border-purple-400/30">
              <div className="bg-gradient-to-r from-amber-400 to-purple-400 h-full" style={{ width: `${hypeProgress}%` }} />
            </div>
          </div>

          <button
            onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Leave Stream</span>
          </button>
        </div>
      </div>

      {/* Streamer Workspace Grid */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left Column: Streamer 1080p Camera Feed & Playmat Table */}
        <div className="flex-1 flex flex-col p-4 md:p-6 bg-[#0c0a14] relative overflow-y-auto custom-scrollbar">
          {/* 1080p Streamer Webcam Container */}
          <div className="w-full aspect-[16/9] max-h-[55vh] rounded-3xl overflow-hidden border-2 border-red-500/40 shadow-[0_0_50px_rgba(239,68,68,0.2)] bg-gradient-to-b from-[#181324] via-[#100d1a] to-[#0a0712] relative flex flex-col items-center justify-center">
            {/* Stream HUD Overlays */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs">
              <Video className="w-4 h-4 text-red-500 animate-pulse" />
              <span className="font-mono font-bold text-white">REC 1080p60 &middot; OVERHEAD RIP CAM</span>
            </div>

            {/* Playmat Table Surface */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#221a36_0%,#090710_100%)] flex flex-col items-center justify-center p-6">
              {/* Playmat Ultrasonic Border Grid */}
              <div className="w-full h-full border-2 border-dashed border-purple-500/20 rounded-2xl flex flex-col items-center justify-center relative p-4">
                
                {/* Active Customer Order Spotlight */}
                {activeOrder ? (
                  <div className="text-center space-y-3 z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-amber-500/20 border border-amber-400/40 shadow-lg">
                      <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
                      <span className="text-xs font-black text-amber-300">RIPPING FOR {activeOrder.username}</span>
                    </div>

                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {activeOrder.packCount}x {activeOrder.packName}
                    </h3>

                    <div className="text-xs font-mono font-bold text-emerald-400">
                      Paid: ${activeOrder.totalPaid.toFixed(2)}
                    </div>

                    {/* Rip Action Button */}
                    <div className="pt-2">
                      <button
                        onClick={handleRipPackForCustomer}
                        disabled={isOpeningPack}
                        className="px-8 py-4 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(239,68,68,0.5)] border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-2 mx-auto"
                      >
                        <Package className="w-5 h-5" />
                        <span>{isOpeningPack ? '🔥 RIPPING PACK LIVE...' : '📦 RIP PACK LIVE ON CAMERA'}</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 text-sm">
                    No active order select. Pick an order from the queue on the right!
                  </div>
                )}

                {/* Pulled Card Reveal Overlay */}
                {currentPulledCard && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="absolute inset-4 rounded-2xl bg-black/90 border-2 border-amber-400/60 p-4 flex flex-col md:flex-row items-center justify-around z-30 shadow-2xl backdrop-blur-md"
                  >
                    <img src={currentPulledCard.image} alt={currentPulledCard.name} className="w-36 h-48 rounded-xl object-cover border-2 border-amber-300 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
                    <div className="text-center md:text-left space-y-2 mt-3 md:mt-0">
                      <div className="text-xs font-black uppercase text-amber-400 tracking-widest">🔥 LIVE GRAIL PULL!</div>
                      <h4 className="text-lg font-black text-white">{currentPulledCard.name}</h4>
                      <div className="text-xs text-gray-300">{currentPulledCard.rarity}</div>
                      <div className="text-xl font-mono font-black text-emerald-400">${currentPulledCard.value.toFixed(2)}</div>
                      <button
                        onClick={() => setCurrentPulledCard(null)}
                        className="px-4 py-1.5 rounded-xl bg-amber-500 text-black font-black text-xs uppercase tracking-wider"
                      >
                        Pack Pulled & Shipped ✓
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Customer Queue & AI Stream Chat */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col bg-[#08070d] shrink-0 min-h-0">
          {/* Section 1: Customer Order Queue */}
          <div className="p-4 border-b border-white/10 bg-black/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-xs font-black text-amber-300 uppercase tracking-wider">
                <ShoppingCart className="w-4 h-4 text-amber-400" />
                <span>Customer Order Queue ({orders.filter(o => o.status === 'pending').length})</span>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {orders.map(ord => (
                <div
                  key={ord.id}
                  onClick={() => setActiveOrder(ord)}
                  className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                    activeOrder?.id === ord.id
                      ? 'border-amber-400 bg-amber-500/20 shadow-md shadow-amber-500/10'
                      : ord.status === 'completed'
                      ? 'border-white/5 bg-white/5 opacity-60'
                      : 'border-white/10 bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-7 h-7 rounded-lg bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-[10px] text-white shrink-0`}>
                      {ord.username.substring(1, 3).toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{ord.username}</div>
                      <div className="text-[10px] text-gray-400 truncate">{ord.packCount}x {ord.packName}</div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-mono font-bold text-emerald-400">${ord.totalPaid.toFixed(2)}</div>
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      ord.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: AI Stream Chat */}
          <div className="flex-1 flex flex-col p-4 min-h-0 bg-black/30">
            <div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2 text-xs font-black text-purple-300 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                <span>Live Stream Chat</span>
              </div>
              <span className="text-[10px] text-gray-400">Powered by Gemini AI</span>
            </div>

            {/* Chat Rolling Message Log */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 text-xs">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`p-2 rounded-xl border ${msg.isOrderNotification ? 'bg-amber-500/15 border-amber-500/40' : 'bg-white/5 border-white/5'}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {msg.badge && (
                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-white/10 text-amber-300 uppercase">
                        {msg.badge}
                      </span>
                    )}
                    <span className={`font-bold ${msg.color || 'text-gray-300'}`}>{msg.username}:</span>
                  </div>
                  <div className="text-gray-200 leading-snug">{msg.message}</div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Host Chat Input */}
            <form onSubmit={handleSendHostMessage} className="mt-3 flex gap-2 shrink-0">
              <input
                type="text"
                value={hostInput}
                onChange={e => setHostInput(e.target.value)}
                placeholder="Talk to your stream chat..."
                className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-amber-400 transition-all"
              />
              <button
                type="submit"
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
