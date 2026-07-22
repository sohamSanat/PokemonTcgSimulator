import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Video, Users, Flame, DollarSign, Package, Send, 
  Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
  Heart, Zap, Gift, Eye, ChevronUp, ChevronDown, Layers, RotateCw, Loader2,
  X, Plus, FileText, Clock, Filter, CheckCircle
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateStreamViewerReply, getRandomStreamMessage, type StreamChatViewer } from '../../services/geminiStreamChat';

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
    {
      id: 'ord-100',
      username: '@VmaxCollector',
      avatarColor: 'from-emerald-400 to-teal-600',
      packName: 'Crown Zenith Booster',
      setId: 'swsh12pt5',
      packCount: 5,
      totalPaid: 125.00,
      status: 'completed',
      pulledCards: [
        { name: 'Mewtwo VSTAR', value: 78.50, image: '', rarity: 'Secret Rare' },
        { name: 'Gengar TG', value: 12.00, image: '', rarity: 'Trainer Gallery' }
      ]
    }
  ]);

  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [ordersFilter, setOrdersFilter] = useState<'all' | 'pending' | 'completed'>('all');
  
  // Add Order Form State
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPackName, setNewPackName] = useState('151 Booster Pack');
  const [newSetId, setNewSetId] = useState('sv3');
  const [newPackCount, setNewPackCount] = useState(1);
  const [newTotalPaid, setNewTotalPaid] = useState(29.99);

  const handleAddNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim()) return;
    sound.playButtonClick();
    const newOrd: CustomerOrder = {
      id: `ord-${Date.now()}`,
      username: newUsername.startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`,
      avatarColor: 'from-blue-500 to-cyan-600',
      packName: newPackName,
      setId: newSetId,
      packCount: Number(newPackCount),
      totalPaid: Number(newTotalPaid),
      status: 'pending'
    };
    setOrders(prev => [newOrd, ...prev]);
    setActiveOrder(newOrd);
    setNewUsername('');
    setIsAddFormOpen(false);
  };

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', username: 'StreamBot', message: '🔴 RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
  ]);

  const [hostInput, setHostInput] = useState<string>('');
  const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

  const [isChatTyping, setIsChatTyping] = useState(false);

  const chatBottomRef = useRef<HTMLDivElement>(null);

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

    // Live background stream chatter generator
    const streamChatInterval = setInterval(() => {
      const { viewer, text } = getRandomStreamMessage();
      addChatMessage({
        id: Date.now().toString() + Math.random(),
        username: viewer.username,
        message: text,
        badge: viewer.badge,
        color: viewer.color,
        avatarColor: viewer.avatarColor
      });
    }, 4500);

    return () => {
      clearInterval(viewerInterval);
      clearInterval(reactionInterval);
      clearInterval(streamChatInterval);
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
    if (!hostInput.trim() || isChatTyping) return;
    
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

    setIsChatTyping(true);
    
    try {
      const history = chatMessages.slice(-6).map(m => ({
        username: m.username,
        message: m.message
      }));
      
      const { viewer, text } = await generateStreamViewerReply({
        activePackName: activeOrder ? activeOrder.packName : "Pokemon Booster Pack",
        activeUsername: activeOrder ? activeOrder.username : undefined,
        userMessage: userMsg,
        chatHistory: history
      });

      addChatMessage({
        id: Date.now().toString() + "-ai",
        username: viewer.username,
        message: text,
        badge: viewer.badge || 'VIP',
        color: viewer.color || 'text-amber-400',
        avatarColor: viewer.avatarColor || 'from-amber-400 to-orange-500'
      });
    } catch (err) {
      console.error("Failed to generate gemini stream chat reply", err);
    } finally {
      setIsChatTyping(false);
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
            onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); }}
            className="px-2.5 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
          >
            <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
            <span>Orders Ledger</span>
            <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none">
              {orders.length}
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
            onClick={() => {}}
            className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 hover:brightness-110 text-white font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-lg border border-red-300 transition-all transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50 flex items-center gap-1.5 shrink-0"
          >
            <Package className="w-3.5 h-3.5" />
            <span>📦 RIP LIVE ⚡</span>
          </button>
        </div>
      )}

      {/* ── 3. Overhead Camera & Playmat Arena ── */}
      <div className="relative flex-1 w-full bg-[#0c0915] flex flex-col items-center justify-start overflow-hidden min-h-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#1e1733_0%,#07050d_100%)] flex flex-col items-center justify-start p-2 sm:p-4 overflow-y-auto custom-scrollbar">
          <div className="w-full h-full min-h-[380px] border border-dashed border-purple-500/20 rounded-3xl flex flex-col items-center justify-start pt-2 sm:pt-4 pb-24 relative px-3 sm:px-4 overflow-visible">

            {/* Pack System Placeholder */}
            <div className="w-full h-full flex flex-col items-center justify-center text-amber-500/50">
              <Package className="w-16 h-16 mb-4 opacity-50" />
              <p className="text-sm font-bold uppercase tracking-widest text-center">Pack System Removed</p>
              <p className="text-xs mt-2 max-w-xs text-center opacity-70">Ready to be built from scratch.</p>
            </div>
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
            className="absolute top-24 sm:top-20 inset-x-2 sm:inset-x-6 z-50 p-2.5 sm:p-3.5 rounded-2xl bg-black/90 backdrop-blur-xl border border-white/15 shadow-2xl flex flex-col gap-2 pointer-events-auto"
          >
            <div className="flex items-center justify-between text-[10px] font-extrabold text-amber-400 uppercase tracking-widest px-1">
              <span className="flex items-center gap-1">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Customer Queue ({orders.filter(o => o.status === 'pending').length} Pending)</span>
              </span>
              <button
                onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); setIsQueueOpen(false); }}
                className="text-[10px] text-amber-300 hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>View All Orders Ledger &rarr;</span>
              </button>
            </div>
            <div className="flex overflow-x-auto gap-2 custom-scrollbar pb-1">
              {orders.map(ord => (
                <button
                  key={ord.id}
                  onClick={() => { sound.playButtonClick(); setActiveOrder(ord); }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition-all shrink-0 cursor-pointer ${
                    activeOrder?.id === ord.id
                      ? 'border-amber-400 bg-amber-500/25 text-white shadow-lg ring-1 ring-amber-400/50'
                      : ord.status === 'completed'
                      ? 'border-white/5 bg-white/5 opacity-50'
                      : 'border-white/10 bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md`}>
                    {ord.username.substring(1, 3).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black truncate max-w-[110px] text-white">{ord.username}</span>
                      <span className="text-[10px] font-mono font-black text-emerald-400">${ord.totalPaid.toFixed(2)}</span>
                    </div>
                    <div className="text-[10px] text-gray-300 font-bold flex items-center gap-1 mt-0.5">
                      <span>{ord.packCount}x {ord.packName}</span>
                      {ord.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 4B. Full Stream Orders Ledger Modal ── */}
      <AnimatePresence>
        {isOrdersModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl p-3 sm:p-6 flex items-center justify-center pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 10 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl max-h-[90vh] bg-[#0c0915] border border-white/20 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-6 bg-[#130f24] border-b border-white/10 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-amber-400" />
                    <span>Live Stream Orders Ledger</span>
                  </h2>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Track customer purchases, total spent, pack counts, and active order status.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { sound.playButtonClick(); setIsAddFormOpen(!isAddFormOpen); }}
                    className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Order</span>
                  </button>

                  <button
                    onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(false); }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Add Order Collapsible Form */}
              {isAddFormOpen && (
                <form onSubmit={handleAddNewOrder} className="p-4 bg-amber-500/10 border-b border-amber-500/30 flex flex-wrap gap-3 items-end">
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Customer Username</label>
                    <input
                      type="text"
                      placeholder="@Username"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="flex-1 min-w-[160px]">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Pack Name</label>
                    <input
                      type="text"
                      value={newPackName}
                      onChange={e => setNewPackName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Set ID</label>
                    <input
                      type="text"
                      value={newSetId}
                      onChange={e => setNewSetId(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-20">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Count</label>
                    <input
                      type="number"
                      min="1"
                      value={newPackCount}
                      onChange={e => setNewPackCount(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-black uppercase text-amber-300 block mb-1">Total ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newTotalPaid}
                      onChange={e => setNewTotalPaid(Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs text-white focus:outline-none focus:border-amber-400"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs uppercase cursor-pointer"
                  >
                    Save Order
                  </button>
                </form>
              )}

              {/* Summary Stats Row & Filters */}
              <div className="px-4 sm:px-6 py-3 bg-black/40 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  {(['all', 'pending', 'completed'] as const).map(tab => (
                    <button
                      key={tab}
                      onClick={() => { sound.playButtonClick(); setOrdersFilter(tab); }}
                      className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                        ordersFilter === tab
                          ? 'bg-amber-400 text-black shadow-md'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      {tab} ({tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4 text-xs font-mono">
                  <div className="text-gray-400">
                    Total Revenue: <span className="font-black text-emerald-400">${orders.reduce((acc, o) => acc + o.totalPaid, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Orders Table List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-3">
                {orders
                  .filter(o => ordersFilter === 'all' || o.status === ordersFilter)
                  .map(ord => {
                    const isActive = activeOrder?.id === ord.id;
                    return (
                      <div
                        key={ord.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                          isActive
                            ? 'bg-amber-500/20 border-amber-400 shadow-xl ring-1 ring-amber-400/40'
                            : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${ord.avatarColor} flex items-center justify-center font-black text-sm text-white shrink-0 shadow-md`}>
                            {ord.username.substring(1, 3).toUpperCase()}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-white truncate">{ord.username}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                ord.status === 'completed'
                                  ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                                  : ord.status === 'ripping'
                                  ? 'bg-blue-500/20 border border-blue-500/40 text-blue-400 animate-pulse'
                                  : 'bg-amber-500/20 border border-amber-500/40 text-amber-400'
                              }`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="text-xs text-gray-300 font-medium mt-0.5 flex items-center gap-2">
                              <span>Purchased: <strong className="text-amber-300 font-bold">{ord.packCount}x {ord.packName}</strong></span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400 font-mono">Set: {ord.setId}</span>
                            </div>

                            {ord.pulledCards && ord.pulledCards.length > 0 && (
                              <div className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 flex-wrap">
                                <Award className="w-3.5 h-3.5" />
                                <span>Pulled Hits:</span>
                                {ord.pulledCards.map((c, i) => (
                                  <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-[10px] font-bold">
                                    {c.name} (${c.value.toFixed(2)})
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                          <div className="text-right">
                            <div className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest">Total Paid</div>
                            <div className="text-base font-mono font-black text-emerald-400">${ord.totalPaid.toFixed(2)}</div>
                          </div>

                          <button
                            onClick={() => {
                              sound.playButtonClick();
                              setActiveOrder(ord);
                              setIsOrdersModalOpen(false);
                            }}
                            disabled={isActive}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                              isActive
                                ? 'bg-amber-400 text-black opacity-80 cursor-default'
                                : 'bg-white/10 hover:bg-amber-400 hover:text-black text-white border border-white/20'
                            }`}
                          >
                            {isActive ? 'Active Order' : 'Set Active'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </motion.div>
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
