import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Sparkles, RefreshCcw, Layers, CheckCircle2, Loader2, X, Calendar, Info, ZoomIn, ZoomOut, Eye, RotateCw, Palette, BookOpen, Coins, Package, TrendingUp, TrendingDown, Award, ShieldCheck, Zap, ChevronLeft, ChevronRight, Music, Scissors, UserCircle, LogOut, Users, Menu, MessageSquare, Send, ShoppingBag, ShoppingCart, ListChecks, CheckSquare, Lock, Box, Gift, Hammer, Construction } from 'lucide-react';
import { fetchSetDetails, fetchSeriesDetails, fetchCardFull, orchestrateSetLoading, handleCardImageError, cardFullCache, onCardFullCacheUpdated, generatePackFromSet, getCardImageUrl, getTCGDexValidAssetPath, preloadPackImages, TCGDexSet, TCGDexSetSummary, TCGDexSeries, TCGDexCardFull, PokemonCard, ENERGY_POOLS_BY_ERA, type EnergyEra, getRealCardPrice } from './services/tcgdex';
import { fetchSingleJapaneseSet, fetchJapaneseSeriesDetails, generateJapanesePackFromSet, getJapaneseCardRealPrice, scrydexCardFullCache, onScrydexCardFullCacheUpdated, loadJapaneseMetadata } from './services/scrydex';
import { auth, signOut, db, onSnapshot, doc, setDoc } from './services/firebase';
import { useAuth } from './context/AuthContext';
import { LoginModal } from './components/auth/LoginModal';
import { sound } from './services/sound';
import { generateVendorReply } from './services/geminiVendorChat';
import setPackPricesData from './data/set_pack_prices.json';
import BinderView from './components/binder/BinderView';
import { saveCollectedCard, getBinders, saveBinders, updateCardSlabStatus, saveCardToCatalogue, getCatalogues, moveCardToBinder, getStorageKey, getProfile, type CatalogueStore, type Binder, type Card } from './components/binder/types';
import SleeveAnimation from './components/binder/SleeveAnimation';
import SlabAnimation from './components/binder/SlabAnimation';
import InteractiveCard3D from './components/binder/InteractiveCard3D';
import BoosterPackTear from './components/BoosterPackTear';
import { PackLoadingCurtain } from './components/PackLoadingCurtain';
import { preloadPackAssets, preloadSingleImage } from './services/imagePreloader';
import PSAGradingLab from './components/psa/PSAGradingLab';
import RipNShipView from './components/ripNship/RipNShipView';
import { CardMarketModal } from './components/CardMarketModal';
import BulkCatalogueModal from './components/binder/BulkCatalogueModal';
import { PackOffLobby } from './components/multiplayer/PackOffLobby';
import { PackOffArena } from './components/multiplayer/PackOffArena';
import CardShowView, { TradeModal } from './components/cardShow/CardShowView';
import { MissionsView } from './components/missions/MissionsView';
import { ProfileView } from './components/profile/ProfileView';
import { getDailyFreePacks, useDailyFreePack, getEarnedSetPacks, useEarnedSetPack, hasEarnedSetPackForSet, useEarnedSetPackForSet, addEarnedSetPacks, addOwnedMysteryPacks, trackMissionProgress, getMissions, EarnedSetPack, getDailyCash, useDailyCash, getOwnedMysteryPacks, type OwnedMysteryPack } from './services/missions';
import { updateMatchPack } from './services/matchmaking';
import { ENGLISH_MYSTERY_PACKS, JAPANESE_MYSTERY_PACKS, MysteryPackConfig, getRandomSetFromMysteryPack, rollMysteryPackResult, type MysteryPackResult } from './data/mysteryPacks';
import InventoryModal from './components/inventory/InventoryModal';
import { LuckyDropModal } from './components/LuckyDropModal';
import { getRemainingLuckyDropSeconds, claimLuckyDropReward, type LuckyDropReward } from './services/luckyDrop';
import { getMysteryPackChaseCards, type MysteryPackChaseCard } from './services/mysteryPackChaseService';
import { SetPurchaseOptionsModal } from './components/proceduralBox/SetPurchaseOptionsModal';
import { BoosterBoxUnboxingModal } from './components/proceduralBox/BoosterBoxUnboxingModal';
import { imageFallbacks, type CardData, DEFAULT_PACK_ARTS, getPackArtsForSet, getSetLogoUrl, getSetBoosterPrice, setPackPrices } from './utils/packUtils';
import { ChaseCardsModal } from './components/app/ChaseCardsModal';
import { OutofPassesModal } from './components/app/OutofPassesModal';
import { InsufficientCashModal } from './components/app/InsufficientCashModal';
import { AppHeader } from './components/layout/AppHeader';
import { PackOpeningConsole } from './components/app/PackOpeningConsole';
import { FALLBACK_POKEMON_CARDS, OVERRIDE_CARD_PRICES, NAME_OVERRIDE_PRICES, toTitleCase, generateFallbackPack, ensureMostExpensiveLast } from './data/fallbackCards';



// Static fallback cards data, price overrides, and pack generation extracted to ./data/fallbackCards

const formatAndSortCards = (newCards: PokemonCard[]): CardData[] => {
 const enrichedCards: PokemonCard[] = newCards.map(c => {
 const cached = cardFullCache.get(c.id);
 if (cached) {
 return {
 ...c,
 pricing: cached.pricing || (c as any).pricing,
 tcgplayer: cached.tcgplayer || (c as any).tcgplayer,
 cardmarket: cached.cardmarket || (c as any).cardmarket,
 rarity: cached.rarity || c.rarity
 };
 }
 return c;
 });

 const formatted: CardData[] = enrichedCards.map((poke, idx) => ({
 id: `${poke.id || 'card'}-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
 originalIndex: idx,
 flipped: false,
 collected: false,
 value: getRealCardPrice(poke),
 pokemon: poke
 }));

 // Sort cards ascending by market price value so lower value cards are drawn first
 formatted.sort((a, b) => a.value - b.value);

 // Extract Energy card if present
 const energyIdx = formatted.findIndex(c =>
 c.pokemon.name?.toLowerCase().includes('energy') ||
 c.pokemon.id?.toLowerCase().includes('energy')
 );

 let energyCard: CardData | null = null;
 if (energyIdx >= 0) {
 [energyCard] = formatted.splice(energyIdx, 1);
 }

 // Extract Most Expensive Hit Card (highest value, now at end of array)
 const mostExpensiveCard = formatted.pop();

 // Insert Most Expensive Hit Card at index 0 (bottom of visual stack, revealed LAST)
 if (mostExpensiveCard) {
 formatted.unshift(mostExpensiveCard);
 }

 // Place Energy card at index length-1 (top of visual stack, revealed FIRST)
 if (energyCard) {
 formatted.push(energyCard);
 }

 return formatted.map((c, idx) => ({ ...c, originalIndex: idx }));
};

const StatsPill = React.memo(({ label, value, highlight = false, colorClass }: { label: string; value: string; highlight?: boolean; colorClass?: string }) => (
 <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl border transition-all ${highlight
 ? 'bg-gradient-to-r from-[#1f1f2e] via-[#1a1a24] to-[#14141c] border-amber-500/50 shadow-[0_8px_20px_rgba(0,0,0,0.7),inset_0_1px_2px_rgba(245,158,11,0.25)]'
 : 'bg-[#14141c]/90 border-white/15 shadow-[0_6px_16px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]'
 }`}>
 <span className="text-gray-400 text-xs font-extrabold uppercase tracking-wider">{label}:</span>
 <span className={`text-sm font-black tracking-wide ${colorClass ? colorClass : (highlight ? 'text-amber-300' : 'text-white')}`}>{value}</span>
 </div>
));

const Card = React.memo(({
 card,
 rotation,
 offsetX,
 offsetY,
 isTopCard,
 isHovered,
 setName
}: {
 card: CardData;
 rotation: number;
 offsetX: number;
 offsetY: number;
 isTopCard: boolean;
 isHovered: boolean;
 setName?: string;
}) => {
 const cardLiveValue = getRealCardPrice(card.pokemon);
 return (
 <motion.div
 initial={{ y: 200, opacity: 0, scale: 0.8 }}
 animate={{
 y: card.flipped ? offsetY - 30 : offsetY,
 opacity: 1,
 scale: card.flipped ? 1.15 : 1,
 rotateZ: card.flipped ? 0 : rotation,
 x: card.flipped ? 0 : offsetX
 }}
 whileHover={isTopCard ? { scale: card.flipped ? 1.2 : 1.18 } : undefined}
 exit={{ x: 380, y: -160, opacity: 0, scale: 0.65, rotateZ: 25 }}
 transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
 style={{
 zIndex: card.originalIndex,
 perspective: 1200,
 position: 'absolute',
 willChange: 'transform'
 }}
 className="w-60 sm:w-68 aspect-[0.718] cursor-pointer select-none group"
 >
 <motion.div
 animate={{ rotateY: card.flipped ? 180 : 0 }}
 transition={{ duration: 0.4, ease: [0.4, 0.0, 0.2, 1] }}
 style={{
 width: '100%',
 height: '100%',
 transformStyle: 'preserve-3d',
 willChange: 'transform',
 position: 'relative'
 }}
 >
 {/* FACE DOWN SIDE (Pokemon Card Back) */}
 <div
 className="absolute inset-0 w-full h-full rounded-2xl overflow-hidden shadow-2xl pointer-events-none"
 style={{
 backfaceVisibility: 'hidden',
 WebkitBackfaceVisibility: 'hidden',
 transform: 'rotateY(0deg) translateZ(1px)',
 background: 'radial-gradient(circle at center, #1c1c24 0%, #0d0d0f 100%)',
 border: '3px solid rgba(245,158,11,0.4)'
 }}
 >
 <div className="absolute inset-2 rounded-xl border-2 border-amber-500/30 flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent">
 <div className="w-20 h-20 rounded-full border-4 border-amber-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] bg-[#14141c]/95">
 <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
 </div>
 <span className="mt-3 text-xs font-black tracking-wider text-amber-300 uppercase opacity-90 text-center px-2 line-clamp-2">
 {setName || "POKÉMON TCG"}
 </span>
 </div>

 <div
 className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none"
 style={{ opacity: (isTopCard && !card.flipped) ? 1 : 0 }}
 >
 <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px 15px_rgba(245,158,11,0.6)] border border-amber-300/50 flex items-center gap-1.5">
 <Sparkles className="w-3 h-3 text-amber-200" />
 Click to Reveal
 </span>
 </div>
 </div>

 {/* Back side (Revealed Card Face) */}
 <div
 className="absolute inset-0 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.9)] bg-black"
 style={{
 backfaceVisibility: 'hidden',
 WebkitBackfaceVisibility: 'hidden',
 transform: 'rotateY(180deg) translateZ(1px)',
 border: '2px solid rgba(255, 255, 250, 0.4)'
 }}
 >
 {/* Fallback for cards without images */}
 <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-4 text-center border-[8px] border-[#333344] rounded-2xl z-0">
 <span className="text-gray-500/80 font-black tracking-widest text-xl mb-3">{card.pokemon.id}</span>
 <h3 className="font-bold text-white text-lg px-2 drop-shadow-md">{card.pokemon.name}</h3>
 </div>

 <img
 src={card.pokemon.images?.large || card.pokemon.images?.small || ((card.pokemon as any).image ? getCardImageUrl((card.pokemon as any).image, 'high') : `https://images.scrydex.com/pokemon/${(card.pokemon.id || 'swsh3-1').toLowerCase()}/large`)}
 alt={card.pokemon.name}
 className="absolute inset-0 w-full h-full object-cover block rounded-2xl z-10"
 onError={(e) => {
 const num = card.pokemon.localId || card.pokemon.id?.split('-')[1] || '1';
 const setId = card.pokemon.id?.split('-')[0] || 'swsh3';
 handleCardImageError(e.target as HTMLImageElement, setId, num);
 }}
 />

 <div
 className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none"
 style={{ opacity: (isTopCard && card.flipped) ? 1 : 0 }}
 >
 <span className="px-3.5 py-1 rounded-full bg-green-600/95 text-white text-[11px] font-bold uppercase tracking-wider shadow-[0_4px_15px_rgba(22,163,74,0.6)] border border-green-300/50 flex items-center gap-1.5 animate-pulse">
 <CheckCircle2 className="w-3 h-3 text-green-200" />
 Collect (${cardLiveValue.toFixed(2)})
 </span>
 </div>
 </div>
 </motion.div>
 </motion.div>
 );
});


const ENGLISH_SERIES_TABS = [
 { id: 'mystery_en', name: ' Mystery Packs' },
 { id: 'me', name: 'Mega Evolution' },
 { id: 'sv', name: 'Scarlet & Violet' },
 { id: 'swsh', name: 'Sword & Shield' },
 { id: 'sm', name: 'Sun & Moon' },
 { id: 'xy', name: 'XY Series' },
 { id: 'bw', name: 'Black & White' },
 { id: 'hgss', name: 'HeartGold & SoulSilver' },
 { id: 'pl', name: 'Platinum' },
 { id: 'dp', name: 'Diamond & Pearl' },
 { id: 'ex', name: 'EX Series' },
 { id: 'base', name: 'Original / Base' },
];

const JAPANESE_SERIES_TABS = [
 { id: 'mystery_ja', name: ' Mystery Packs' },
 { id: 'me_ja', name: 'Mega Evolution' },
 { id: 'sv_ja', name: 'Scarlet & Violet' },
 { id: 'swsh_ja', name: 'Sword & Shield' },
 { id: 'sm_ja', name: 'Sun & Moon' },
 { id: 'xy_ja', name: 'XY Series' },
 { id: 'bw_ja', name: 'Black & White' },
 { id: 'hgss_ja', name: 'Legend' },
 { id: 'pl_ja', name: 'Platinum' },
 { id: 'dp_ja', name: 'Diamond & Pearl' },
 { id: 'classic_ja', name: 'Original / Base / Classic' },
];

const UNREADY_JAPANESE_SERIES_IDS = [
 'bw_ja',
 'hgss_ja',
 'pl_ja',
 'dp_ja',
 'classic_ja',
];


const RevealedCardItem = React.memo(({
 card,
 isAdded,
 onInspect,
 onAddToBinder
}: {
 card: CardData;
 isAdded: boolean;
 onInspect: (card: CardData) => void;
 onAddToBinder: (card: CardData) => void;
}) => {
 return (
 <motion.div
 onClick={() => onInspect(card)}
 initial={{ scale: 0.3, opacity: 0, rotateY: 180, y: -50 }}
 animate={{ scale: 1, opacity: 1, rotateY: 0, y: 0 }}
 transition={{ type: 'spring', bounce: 0.4, duration: 0.6 }}
 whileHover={{ scale: 1.05, y: -8 }}
 className="flex flex-col items-center group w-36 sm:w-44 cursor-pointer"
 >
 <div
 className="relative w-full aspect-[0.718] rounded-2xl overflow-visible transition-all duration-300 group-hover:scale-105 card-aspect-ratio"
 style={{ aspectRatio: '63 / 88', minHeight: '190px', width: '100%' }}
 >
 <InteractiveCard3D
 card={card}
 interactive={true}
 className="w-full h-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] border border-white/20 rounded-2xl group-hover:border-amber-400/60 group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)]"
 >
 {/* Price badge right above/on top of card art */}
 <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-black text-xs shadow-lg z-20 flex items-center gap-0.5">
 <span>${card.value ? card.value.toFixed(2) : (setPackPrices[card.pokemon?.id?.split('-')[0] || 'swsh3'] || 5.99).toFixed(2)}</span>
 </div>
 <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">
 Market Data
 </div>
 </InteractiveCard3D>
 </div>

 <div className="mt-3 w-full px-2.5 py-2 rounded-xl bg-[#141620]/95 border border-white/10 flex flex-col items-center text-center transition-all group-hover:bg-[#1c1e2b]/95 group-hover:border-white/20 shadow-lg">
 <span className="font-bold text-white text-xs truncate w-full">{card.pokemon.name}</span>
 <div className="flex items-center gap-1.5 mt-1">
 <span className="text-emerald-400 font-extrabold text-xs tracking-wide shadow-sm">${card.value.toFixed(2)}</span>
 <span className="text-gray-400 text-[10px] uppercase font-semibold truncate">• {card.pokemon.rarity || 'Common'}</span>
 </div>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onAddToBinder(card);
 }}
 className={`mt-2.5 w-full py-1.5 px-2 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md ${isAdded
 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 cursor-default'
 : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] hover:scale-105 active:scale-95'
 }`}
 >
 {isAdded ? (
 <>
 <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" />
 <span>In Binder</span>
 </>
 ) : (
 <>
 <BookOpen className="w-3.5 h-3.5 text-white inline" />
 <span>+ Add to Binder</span>
 </>
 )}
 </button>
 </div>
 </motion.div>
 );
});

export default function App() {
 const { currentUser } = useAuth();
 const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
 const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
 const [isHoveringStack, setIsHoveringStack] = useState(false);

 const [userProfile, setUserProfile] = useState(() => getProfile());

 useEffect(() => {
 const handleProfileUpdate = () => {
 setUserProfile(getProfile());
 };
 handleProfileUpdate();
 window.addEventListener('storage', handleProfileUpdate);
 return () => window.removeEventListener('storage', handleProfileUpdate);
 }, [currentUser]);

 const [currentSet, setCurrentSet] = useState<TCGDexSet | null>(null);
 const [currentMysteryPack, setCurrentMysteryPack] = useState<MysteryPackConfig | null>(null);
 const [isLoadingPack, setIsLoadingPack] = useState<boolean>(false);
 const isLoadingPackRef = useRef<boolean>(false);
 const [isSetSelectorOpen, setIsSetSelectorOpen] = useState<boolean>(false);
 const [showChaseModal, setShowChaseModal] = useState<boolean>(false);
 const [cacheTick, setCacheTick] = useState<number>(0);
 const debouncedCacheTickRef = useRef<number | null>(null);
 useEffect(() => {
 const handleCacheUpdate = () => {
 if (debouncedCacheTickRef.current) clearTimeout(debouncedCacheTickRef.current);
 debouncedCacheTickRef.current = window.setTimeout(() => {
 debouncedCacheTickRef.current = null;
 setCacheTick(t => t + 1);
 }, 50);
 };

 onCardFullCacheUpdated.add(handleCacheUpdate);
 onScrydexCardFullCacheUpdated.add(handleCacheUpdate);
 return () => {
 onCardFullCacheUpdated.delete(handleCacheUpdate);
 onScrydexCardFullCacheUpdated.delete(handleCacheUpdate);
 if (debouncedCacheTickRef.current) clearTimeout(debouncedCacheTickRef.current);
 };
 }, []);
 const [selectedSeriesId, setSelectedSeriesId] = useState<string>('mystery_en');
 const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ja'>('en');
 const [currentSeriesData, setCurrentSeriesData] = useState<TCGDexSeries | null>(null);
 const [isLoadingSeries, setIsLoadingSeries] = useState<boolean>(false);
 const [pityNotification, setPityNotification] = useState<{
 show: boolean;
 packName: string;
 setName: string;
 bonusPacksCount: number;
 price: number;
 } | null>(null);

 const [sessionTotal, setSessionTotal] = useState(() => {
 try {
 const saved = localStorage.getItem(getStorageKey('tcg_session_total', currentUser?.uid));
 return saved !== null ? Number(saved) : 0;
 } catch { return 0; }
 });
 const [packCount, setPackCount] = useState(() => {
 try {
 const saved = localStorage.getItem(getStorageKey('tcg_session_pack_count', currentUser?.uid));
 return saved !== null ? Number(saved) : 0;
 } catch { return 0; }
 });
 const [sessionSpent, setSessionSpent] = useState(() => {
 try {
 const saved = localStorage.getItem(getStorageKey('tcg_session_spent', currentUser?.uid));
 return saved !== null ? Number(saved) : 0;
 } catch { return 0; }
 });

 const lastSyncedStatsRef = useRef({ sessionTotal: -1, packCount: -1, sessionSpent: -1 });
 const [hasLoadedFromFirebase, setHasLoadedFromFirebase] = useState(false);
 const previousUserRef = useRef<string | undefined | null>(currentUser?.uid);

 // When switching users, load target user stats to prevent leaking previous user's stats.
 // We ONLY do this if we had a previous user. If we came from a guest (prevUid == null),
 // we keep the state to allow Firebase migration to pick up the guest stats.
 useEffect(() => {
 const prevUid = previousUserRef.current;
 if (prevUid !== currentUser?.uid) {
 if (prevUid != null) {
 try {
 const savedTotal = localStorage.getItem(getStorageKey('tcg_session_total', currentUser?.uid));
 setSessionTotal(savedTotal !== null ? Number(savedTotal) : 0);
 
 const savedCount = localStorage.getItem(getStorageKey('tcg_session_pack_count', currentUser?.uid));
 setPackCount(savedCount !== null ? Number(savedCount) : 0);

 const savedSpent = localStorage.getItem(getStorageKey('tcg_session_spent', currentUser?.uid));
 setSessionSpent(savedSpent !== null ? Number(savedSpent) : 0);
 } catch { }
 }
 previousUserRef.current = currentUser?.uid;
 // Reset the "loaded from Firebase" flag + last-synced stats for the new
 // user. Otherwise the save effect below would treat the PREVIOUS user's
 // in-memory stats as if they belonged to the new user and persist them
 // (both to localStorage and Firestore), leaking Account A's revenue into
 // Account B during the transition render.
 lastSyncedStatsRef.current = { sessionTotal: -1, packCount: -1, sessionSpent: -1 };
 setHasLoadedFromFirebase(false);
 }
 }, [currentUser?.uid]);

 // Listen for Firebase Stats sync
 useEffect(() => {
 if (!currentUser) return;
 setHasLoadedFromFirebase(false);
 const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
 setHasLoadedFromFirebase(true);
 if (docSnap.exists()) {
 const rootData = docSnap.data();
 const data = rootData.stats || {};
 const fbTotal = data.sessionTotal ?? rootData.netTotal ?? 0;
 const fbCount = data.packCount ?? 0;
 const fbSpent = data.sessionSpent ?? rootData.netSpent ?? 0;

 lastSyncedStatsRef.current = {
 sessionTotal: fbTotal,
 packCount: fbCount,
 sessionSpent: fbSpent,
 };

 const isMigration = !rootData.stats && !rootData.netTotal;

 setSessionTotal(prev => {
 if (isMigration && fbTotal === 0 && prev > 0) return prev;
 // Protect in-flight local card flip total from being overwritten by older async snapshots
 return prev > fbTotal ? prev : fbTotal;
 });
 setPackCount(prev => {
 if (isMigration && fbCount === 0 && prev > 0) return prev;
 return prev > fbCount ? prev : fbCount;
 });
 setSessionSpent(prev => {
 if (isMigration && fbSpent === 0 && prev > 0) return prev;
 return prev > fbSpent ? prev : fbSpent;
 });
 }
 });
 return () => unsubscribe();
 }, [currentUser]);

 // Save stats synchronously to LocalStorage & Firebase
 useEffect(() => {
 const uid = currentUser?.uid;
 try {
 localStorage.setItem(getStorageKey('tcg_session_total', uid), sessionTotal.toString());
 localStorage.setItem(getStorageKey('tcg_session_pack_count', uid), packCount.toString());
 localStorage.setItem(getStorageKey('tcg_session_spent', uid), sessionSpent.toString());
 window.dispatchEvent(new CustomEvent('user_stats_updated', { detail: { sessionTotal, packCount, sessionSpent } }));
 } catch { }

 if (!uid) return;

 if (hasLoadedFromFirebase) {
 const isFromFirebase =
 sessionTotal === lastSyncedStatsRef.current.sessionTotal &&
 packCount === lastSyncedStatsRef.current.packCount &&
 sessionSpent === lastSyncedStatsRef.current.sessionSpent;

 if (!isFromFirebase) {
 lastSyncedStatsRef.current = { sessionTotal, packCount, sessionSpent };
 setDoc(doc(db, 'users', uid), {
 netTotal: sessionTotal,
 netSpent: sessionSpent,
 stats: {
 sessionTotal,
 packCount,
 sessionSpent,
 lastUpdated: new Date().toISOString()
 }
 }, { merge: true }).catch(err => console.error('Failed to sync stats to Firebase:', err));
 }
 }
 }, [sessionTotal, packCount, sessionSpent, currentUser, hasLoadedFromFirebase]);
 const [isRevealingAll, setIsRevealingAll] = useState(false);
 const [cards, setCards] = useState<CardData[]>([]);
 const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
 const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);
 const [tradeTarget, setTradeTarget] = useState<any>(null);
 const [inspectedViewMode, setInspectedViewMode] = useState<'market' | 'art'>('market');
 const [isChaseCardsReady, setIsChaseCardsReady] = useState(false);
 const [isChaseCardsRevealed, setIsChaseCardsRevealed] = useState(true);


 useEffect(() => {
 setIsChaseCardsRevealed(true);
 }, [currentSet, selectedLanguage]);

 useEffect(() => {
 if (inspectedCard) {
 trackMissionProgress('inspect_card', 1);
 }
 }, [inspectedCard]);

 const [soundEnabled, setSoundEnabled] = useState<boolean>(sound.isEnabled());
 const [activeTab, setActiveTab] = useState<'pack' | 'binder' | 'psa' | 'ripNship' | 'multiplayerLobby' | 'multiplayerArena' | 'cardShow' | 'missions' | 'auctions' | 'profile'>('pack');
 const [dailyFreePacks, setDailyFreePacks] = useState(() => getDailyFreePacks());
 const [earnedSetPacks, setEarnedSetPacks] = useState<EarnedSetPack[]>(() => getEarnedSetPacks());
 const [ownedMysteryPacks, setOwnedMysteryPacks] = useState<OwnedMysteryPack[]>(() => getOwnedMysteryPacks());
 const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
 const [luckyDropSeconds, setLuckyDropSeconds] = useState<number>(() => getRemainingLuckyDropSeconds());
 const [claimedLuckyPack, setClaimedLuckyPack] = useState<LuckyDropReward | null>(null);
 const [isLuckyDropModalOpen, setIsLuckyDropModalOpen] = useState<boolean>(false);
 const [purchaseTargetSet, setPurchaseTargetSet] = useState<any | null>(null);
 const [unboxingBoxTarget, setUnboxingBoxTarget] = useState<{
 set: any;
 boxType: 'halfBox' | 'fullBox';
 action: 'rip' | 'vault';
 } | null>(null);

 useEffect(() => {
 loadJapaneseMetadata();
 const updateLuckyTimer = () => {
 setLuckyDropSeconds(getRemainingLuckyDropSeconds());
 };
 updateLuckyTimer();
 const interval = setInterval(updateLuckyTimer, 1000);
 return () => clearInterval(interval);
 }, []);

 const handleLuckyDropClick = () => {
 if (luckyDropSeconds === 0) {
 sound.playPackOpen();
 const wonPack = claimLuckyDropReward();
 setClaimedLuckyPack(wonPack);
 setIsLuckyDropModalOpen(true);
 setLuckyDropSeconds(300);
 } else {
 sound.playButtonClick();
 }
 };

 const handleLuckyDropOpenNow = async (reward: LuckyDropReward) => {
 setIsLuckyDropModalOpen(false);
 setActiveTab('pack');
 setSelectedLanguage(reward.language);
 if (reward.type === 'mystery' && reward.mysteryPackConfig) {
 const result = rollMysteryPackResult(reward.mysteryPackConfig);
 await loadSetAndGeneratePack(result.setId, reward.language, reward.mysteryPackConfig, result);
 } else if (reward.type === 'standard' && reward.setId) {
 await loadSetAndGeneratePack(reward.setId, reward.language);
 }
 };

 const handleLuckyDropAddToInventory = (reward: LuckyDropReward) => {
 if (reward.type === 'mystery' && reward.mysteryPackConfig) {
 addOwnedMysteryPacks(reward.mysteryPackConfig.id, 1);
 } else if (reward.type === 'standard' && reward.setId) {
 addEarnedSetPacks([{
 setId: reward.setId,
 setName: reward.setName || reward.name,
 language: reward.language,
 count: 1
 }]);
 setEarnedSetPacks(getEarnedSetPacks());
 }
 setIsLuckyDropModalOpen(false);
 sound.playPackOpen();
 };

 const formatTimer = (seconds: number): string => {
 const m = Math.floor(seconds / 60);
 const s = seconds % 60;
 return `${m}:${String(s).padStart(2, '0')}`;
 };

 const [dailyCash, setDailyCash] = useState(() => getDailyCash());
 const [showOutofPassesModal, setShowOutofPassesModal] = useState<boolean>(false);
 const [showInsufficientCashModal, setShowInsufficientCashModal] = useState<boolean>(false);
 const [showPriceGateModal, setShowPriceGateModal] = useState<boolean>(false);
 const [priceGateCost, setPriceGateCost] = useState<number>(0);
 const [pendingOpenKind, setPendingOpenKind] = useState<'tear' | 'reset'>('tear');
 const openKindRef = useRef<'tear' | 'reset'>('tear');
 const [matchId, setMatchId] = useState<string>('');
 const [binderAddedIds, setBinderAddedIds] = useState<Set<string | number>>(new Set());
 const [binderSelectModal, setBinderSelectModal] = useState<{ cards: CardData[]; setName: string; isMove?: boolean } | null>(null);
 const [availableBinders, setAvailableBinders] = useState<Binder[]>([]);

 useEffect(() => {
 const handleDailyPacksUpdate = (e: any) => {
 setDailyFreePacks(e.detail);
 };
 const handleEarnedPacksUpdate = (e: any) => {
 setEarnedSetPacks(e.detail);
 };
 const handleDailyCashUpdate = (e: any) => {
 setDailyCash(e.detail);
 };
 const handleInventoryUpdate = () => {
 setEarnedSetPacks(getEarnedSetPacks());
 setOwnedMysteryPacks(getOwnedMysteryPacks());
 };
 window.addEventListener('daily_packs_updated', handleDailyPacksUpdate);
 window.addEventListener('earned_packs_updated', handleEarnedPacksUpdate);
 window.addEventListener('daily_cash_updated', handleDailyCashUpdate);
 window.addEventListener('inventory_updated', handleInventoryUpdate);
 return () => {
 window.removeEventListener('daily_packs_updated', handleDailyPacksUpdate);
 window.removeEventListener('earned_packs_updated', handleEarnedPacksUpdate);
 window.removeEventListener('daily_cash_updated', handleDailyCashUpdate);
 window.removeEventListener('inventory_updated', handleInventoryUpdate);
 };
 }, []);

 // Sleeve animation state – set when user picks a binder
 const [sleeveQueue, setSleeveQueue] = useState<{
 cards: CardData[];
 setName: string;
 binderId: string;
 } | null>(null);

 // Slab states for $5+ hits
 const [slabPromptQueue, setSlabPromptQueue] = useState<{
 savedCards: Card[];
 } | null>(null);
 const [slabQueue, setSlabQueue] = useState<{
 card: Card;
 } | null>(null);

 const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
 const packStageRef = useRef(packStage);
 useEffect(() => { packStageRef.current = packStage; }, [packStage]);
 const currentSetRef = useRef(currentSet);
 useEffect(() => { currentSetRef.current = currentSet; }, [currentSet]);
 const [currentPackArts, setCurrentPackArts] = useState<string[]>(DEFAULT_PACK_ARTS);
 const [packArtsManifest, setPackArtsManifest] = useState<Record<string, string[]>>({});
 const [setLogosManifest, setSetLogosManifest] = useState<Record<string, string>>({});
 const [packArtIndex, setPackArtIndex] = useState<number>(0);
 const [tearProgress, setTearProgress] = useState<number>(0);

 useEffect(() => {
 const base = import.meta.env.BASE_URL || '/';
 fetch(`${base}packArts/manifest.json?v=3`)
 .then(res => res.ok ? res.json() : {})
 .then(data => setPackArtsManifest(data))
 .catch(() => { });

 fetch(`${base}setLogos/manifest.json?v=3`)
 .then(res => res.ok ? res.json() : {})
 .then(data => setSetLogosManifest(data))
 .catch(() => { });
 }, []);

 useEffect(() => {
 // Stagger preload of pack arts for the current set to avoid blocking first paint
 let isActive = true;
 const injectedLinks: HTMLLinkElement[] = [];
 
 const ric = (window as any).requestIdleCallback || ((cb: any) => setTimeout(cb, 100));
 ric(() => {
 if (!isActive) return;
 currentPackArts.forEach((src, idx) => {
 setTimeout(() => {
 if (!isActive) return;
 const img = new Image();
 img.fetchPriority = 'high';
 img.src = src;

 // Inject network-level preload links to bypass React rendering delays
 if (!document.querySelector(`link[href="${src}"]`)) {
 const link = document.createElement('link');
 link.rel = 'preload';
 link.as = 'image';
 link.href = src;
 link.fetchPriority = 'high';
 document.head.appendChild(link);
 injectedLinks.push(link);
 }
 }, idx * 50); // Stagger by 50ms
 });
 });

 return () => {
 isActive = false;
 injectedLinks.forEach(link => {
 if (link.parentNode) link.parentNode.removeChild(link);
 });
 };
 }, [currentPackArts]);

 useEffect(() => {
 // Only preload set logos when Set Selector modal is open to keep initial load lightweight
 if (!isSetSelectorOpen || Object.keys(setLogosManifest).length === 0) return;

 let isActive = true;

 const preloadImage = (src: string): Promise<void> => {
 return new Promise((resolve) => {
 const img = new Image();
 img.onload = () => resolve();
 img.onerror = () => resolve(); // continue even on error
 img.src = src;
 });
 };

 const preloadSeriesLogos = async (seriesId: string, lang: 'en' | 'ja' = 'en') => {
 if (!isActive) return;
 try {
 const seriesData = lang === 'ja' ? await fetchJapaneseSeriesDetails(seriesId) : await fetchSeriesDetails(seriesId);
 if (!isActive || !seriesData || !seriesData.sets) return;

 const logos = seriesData.sets
 .map(set => getSetLogoUrl(set, setLogosManifest, lang))
 .filter(Boolean) as string[];

 // Preload sequentially with tiny delays so we don't clog the browser's max connection limit
 for (const src of logos) {
 if (!isActive) break;
 await preloadImage(src);
 await new Promise(r => setTimeout(r, 20));
 }
 } catch (err) {
 // ignore fetch errors for preloading
 }
 };

 const runProgressivePreload = async () => {
 // 1. First, load the logos of sets of the generation the user has currently selected
 await preloadSeriesLogos(selectedSeriesId, selectedLanguage);

 // 2. Only when that loading is finished, start loading up other generation's sets' logos in the background.
 // Deferred to browser idle time so this aggressive multi-series fetch+decode
 // storm does NOT compete with first paint and the initial pack load (the
 // #1 cause of the "jammed on first load" symptom). We yield to whatever
 // the user is actually interacting with first.
 const activeTabs = ENGLISH_SERIES_TABS;
 const otherSeries = activeTabs.map(t => t.id).filter(id => id !== selectedSeriesId && !id.startsWith('mystery'));
 const preloadOtherSeries = async () => {
 for (const seriesId of otherSeries) {
 if (!isActive) break;
 await preloadSeriesLogos(seriesId, selectedLanguage);
 // Small delay between series preloads to keep network free for user interactions
 await new Promise(r => setTimeout(r, 100));
 }
 };

 // requestIdleCallback with a 2s fallback timeout; some browsers lack it.
 type IdleCB = (cb: (deadline: { timeRemaining: () => number; didTimeout: boolean }) => void, options?: { timeout: number }) => number;
 const ric: IdleCB | undefined =
 (window as any).requestIdleCallback ? (window as any).requestIdleCallback.bind(window) : undefined;
 if (ric) {
 ric(() => { void preloadOtherSeries(); }, { timeout: 2000 });
 } else {
 setTimeout(preloadOtherSeries, 1200);
 }
 };

 runProgressivePreload();

 return () => {
 isActive = false;
 };
 }, [setLogosManifest, selectedSeriesId, selectedLanguage, isSetSelectorOpen]);

 useEffect(() => {
 // Stagger preload all card images inside the freshly generated pack
 // while the pack is sitting on the table unopened, so they load instantly when revealed
 let isActive = true;
 if (cards.length > 0 && packStage === 'unopened') {
 cards.forEach((card, idx) => {
 setTimeout(() => {
 if (!isActive) return;
 let imgUrl = card.pokemon.images?.large || card.pokemon.images?.small;
 if (!imgUrl && (card.pokemon as any).image) {
 imgUrl = getCardImageUrl((card.pokemon as any).image, 'high');
 } else if (!imgUrl) {
 imgUrl = `https://images.scrydex.com/pokemon/${(card.pokemon.id || 'swsh3-1').toLowerCase()}/large`;
 }

 if (imgUrl) {
 const img = new Image();
 // Use low priority so it doesn't block UI threads, since they have time before opening
 (img as any).fetchPriority = 'low';
 img.src = imgUrl;
 }
 }, idx * 100); // 100ms stagger between each of the 11 cards
 });
 }
 return () => { isActive = false; };
 }, [cards, packStage]);

 useEffect(() => {
 const handleCacheUpdate = () => {
 setCacheTick(prev => prev + 1);
 setCards(prevCards => {
 let changed = false;
 const updated = prevCards.map(c => {
 const cached = cardFullCache.get(c.pokemon.id);
 if (cached) {
 // Don't overwrite a valid Scrydex CDN image with a non-scrydex fallback from cache
 const currentImageIsScrydex = c.pokemon.images?.large?.includes('scrydex.com') || c.pokemon.images?.small?.includes('scrydex.com');
 const cachedImageIsScrydex = cached.image?.includes('scrydex.com');
 const useImageFromCache = cached.image && (!currentImageIsScrydex || cachedImageIsScrydex);

 const newName = (cached.name && !cached.name.startsWith('Pokémon Card') && cached.name !== 'Card') ? cached.name : c.pokemon.name;
 const newRarity = (cached.rarity && cached.rarity !== 'Common') ? cached.rarity : (c.pokemon.rarity || cached.rarity);

 const updatedPoke: PokemonCard = {
 ...c.pokemon,
 name: newName,
 rarity: newRarity,
 images: useImageFromCache ? {
 small: getCardImageUrl(cached.image!, 'low'),
 large: getCardImageUrl(cached.image!, 'high'),
 } : c.pokemon.images,
 pricing: cached.pricing || c.pokemon.pricing,
 tcgplayer: cached.tcgplayer || c.pokemon.tcgplayer,
 cardmarket: cached.cardmarket || cached.pricing?.cardmarket || c.pokemon.cardmarket,
 illustrator: cached.illustrator || c.pokemon.illustrator,
 };
 const newVal = getRealCardPrice(updatedPoke);
 if (
 newVal !== c.value ||
 updatedPoke.name !== c.pokemon.name ||
 updatedPoke.rarity !== c.pokemon.rarity ||
 !c.pokemon.pricing?.cardmarket?.idProduct ||
 (useImageFromCache && cached.image && !c.pokemon.images?.large?.includes(cached.image))
 ) {
 changed = true;
 return { ...c, value: newVal, pokemon: updatedPoke };
 }
 }
 return c;
 });
 return changed ? updated : prevCards;
 });
 setInspectedCard(prev => {
 if (!prev) return null;
 const cached = cardFullCache.get(prev.pokemon.id);
 if (cached) {
 const currentImageIsScrydex = prev.pokemon.images?.large?.includes('scrydex.com') || prev.pokemon.images?.small?.includes('scrydex.com');
 const cachedImageIsScrydex = cached.image?.includes('scrydex.com');
 const useImageFromCache = cached.image && (!currentImageIsScrydex || cachedImageIsScrydex);
 const updatedPoke: PokemonCard = {
 ...prev.pokemon,
 images: useImageFromCache ? {
 small: getCardImageUrl(cached.image!, 'low'),
 large: getCardImageUrl(cached.image!, 'high'),
 } : prev.pokemon.images,
 pricing: cached.pricing || prev.pokemon.pricing,
 tcgplayer: cached.tcgplayer || prev.pokemon.tcgplayer,
 cardmarket: cached.cardmarket || cached.pricing?.cardmarket || prev.pokemon.cardmarket,
 illustrator: cached.illustrator || prev.pokemon.illustrator,
 };
 const newVal = getRealCardPrice(updatedPoke);
 if (newVal !== prev.value) {
 return { ...prev, value: newVal, pokemon: updatedPoke };
 }
 }
 return prev;
 });
 setCacheTick(t => (t + 1) % 1000000);
 };
 onCardFullCacheUpdated.add(handleCacheUpdate);
 return () => {
 onCardFullCacheUpdated.delete(handleCacheUpdate);
 };
 }, []);

 const toggleSound = () => {
 const next = !soundEnabled;
 sound.setEnabled(next);
 setSoundEnabled(next);
 if (next) sound.playButtonClick();
 };

 const handleTearPack = (skipGate: boolean = false) => {
 if (packStage !== 'unopened') return;
 openKindRef.current = 'tear';

 const setPrice = getSetBoosterPrice(currentSet);
 const isFreeEligible = setPrice <= 20;
 const setLanguage = selectedLanguage; // 'en' or 'ja'
 const netReturn = sessionTotal - sessionSpent;

 let canOpen = false;
 let wasPaidPack = true; // Assume it's a paid pack unless we use free/earned/cash
 let deductFromNetReturn = 0;

 // STEP 1: ALWAYS check inventory FIRST before using daily free allowance or daily cash!
 if (currentSet && hasEarnedSetPackForSet(currentSet, setLanguage)) {
 canOpen = useEarnedSetPackForSet(currentSet, setLanguage);
 if (canOpen) {
 wasPaidPack = false; // Used earned pack from inventory, FREE!
 }
 }

 // STEP 2: Only if no inventory pack was available, check daily free allowance or daily cash
 if (!canOpen) {
 if (isFreeEligible) {
 // Check free daily packs allowance
 canOpen = useDailyFreePack(setLanguage);
 if (canOpen) {
 wasPaidPack = false; // Used free daily pack
 } else {
 // Check daily cash + net return
 [canOpen, deductFromNetReturn] = useDailyCash(setPrice, netReturn);
 if (canOpen) {
 wasPaidPack = false; // Used daily cash
 }
 }
 } else if (!skipGate) {
 // Pack costs > $20 and is not in inventory & not covered by daily free packs allowance.
 setPriceGateCost(setPrice);
 setPendingOpenKind(openKindRef.current);
 setShowPriceGateModal(true);
 return;
 } else {
 [canOpen, deductFromNetReturn] = useDailyCash(setPrice, netReturn);
 if (canOpen) {
 wasPaidPack = false;
 }
 }
 }

 if (!canOpen) {
 sound.playModalOpen();
 setShowInsufficientCashModal(true);
 return;
 }

 trackMissionProgress('open_pack', 1);
 setTearProgress(100);
 sound.playFoilTear();
 setPackStage('tearing');
 setPackCount(p => p + 1);
 // Only add to sessionSpent if it was a paid pack
 if (wasPaidPack) {
 setSessionSpent(s => Number((s + getSetBoosterPrice(currentSet)).toFixed(2)));
 }
 // If we used net return, add that to sessionSpent
 if (deductFromNetReturn > 0) {
 setSessionSpent(s => Number((s + deductFromNetReturn).toFixed(2)));
 }
 setTimeout(() => {
 sound.playCardSlide();
 }, 450);
 setTimeout(() => {
 setPackStage('opened');
 setTearProgress(0);
 }, 900);
 };

 const loadSetAndGeneratePack = useCallback(async (setId: string, forceLanguage?: 'en' | 'ja', mysteryPack?: MysteryPackConfig | null, mysteryResult?: MysteryPackResult | null) => {
 if (isLoadingPackRef.current) return;
 isLoadingPackRef.current = true;
 const loadStartTime = Date.now();
 const langToUse = forceLanguage || (mysteryPack ? mysteryPack.language : selectedLanguage);
 sound.playPackOpen();
 setIsLoadingPack(true);
 setIsChaseCardsReady(false);
 setIsSetSelectorOpen(false);
 setPackStage('unopened');
 setTearProgress(0);
 setBinderAddedIds(new Set());
 setPityNotification(null);
 const finishCurtainReady = async () => {
    const elapsed = Date.now() - loadStartTime;
    const minCurtainTime = 1200; // Guaranteed 1.2s curtain display for EVERY set load
    const remainingDelay = Math.max(0, minCurtainTime - elapsed);

    // FORCE hardware pre-decoding of all 12 top chase card thumbnails into GPU memory before lifting chase curtain
    const topChaseUrls: string[] = [];
    chaseCardsForActiveSet.slice(0, 12).forEach(c => {
      if (c.card.images?.large) topChaseUrls.push(c.card.images.large);
      if (c.card.images?.small) topChaseUrls.push(c.card.images.small);
    });
    await Promise.allSettled(topChaseUrls.map(url => preloadSingleImage(url, 4000)));

    if (remainingDelay > 0) {
      await new Promise(r => setTimeout(r, remainingDelay));
    }
    setIsChaseCardsReady(true);
  };

 if (mysteryPack !== undefined) {
 setCurrentMysteryPack(mysteryPack);
 }

 // Pick pack arts for this set from mystery pack art or set manifest
 const effectiveMysteryPack = mysteryPack !== undefined ? mysteryPack : currentMysteryPack;
 let chosenArts: string[] = [];
 if (effectiveMysteryPack && effectiveMysteryPack.packArt) {
 chosenArts = [effectiveMysteryPack.packArt];
 setCurrentPackArts(chosenArts);
 setPackArtIndex(0);
 } else {
 chosenArts = getPackArtsForSet(setId, undefined, packArtsManifest);
 setCurrentPackArts(chosenArts);
 setPackArtIndex(Math.floor(Math.random() * chosenArts.length));
 }

 let generatedCards: any[] = [];

 try {
 let resolvedSetName = setId;
 if (langToUse === 'ja') {
 const setDetails = await fetchSingleJapaneseSet(setId);
 resolvedSetName = setDetails.name || setId;
 if (effectiveMysteryPack) {
 (setDetails as any).mysteryPackPrice = effectiveMysteryPack.price;
 (setDetails as any).mysteryPackName = effectiveMysteryPack.name;
 }
 setCurrentSet(setDetails);
 if (!effectiveMysteryPack) {
 const refinedArts = getPackArtsForSet(setDetails.id || setId, setDetails.name, packArtsManifest);
 chosenArts = refinedArts;
 setCurrentPackArts(refinedArts);
 }
 const rawPackCards = await generateJapanesePackFromSet(setDetails);
 generatedCards = rawPackCards;
 setCards(formatAndSortCards(rawPackCards));

 setTimeout(() => {
 orchestrateSetLoading(setDetails, generatedCards.map(c => c.id), finishCurtainReady);
 }, 200);
 } else {
 const setDetails = await fetchSetDetails(setId);
 resolvedSetName = setDetails.name || setId;
 if (effectiveMysteryPack) {
 (setDetails as any).mysteryPackPrice = effectiveMysteryPack.price;
 (setDetails as any).mysteryPackName = effectiveMysteryPack.name;
 }
 setCurrentSet(setDetails);
 if (!effectiveMysteryPack) {
 const refinedArts = getPackArtsForSet(setDetails.id || setId, setDetails.name, packArtsManifest);
 chosenArts = refinedArts;
 setCurrentPackArts(refinedArts);
 }
 const rawPackCards = await generatePackFromSet(setDetails);
 generatedCards = rawPackCards;
 setCards(formatAndSortCards(rawPackCards));

 // NOW that pack and contents are fully ready, trigger low-priority background chase card warmup
 setTimeout(() => {
 orchestrateSetLoading(setDetails, generatedCards.map(c => c.id), finishCurtainReady);
 }, 200);
 }

 // Check if mystery pack pity protection was triggered
 if (effectiveMysteryPack && mysteryResult && !mysteryResult.isHighTier && mysteryResult.bonusPacksCount > 0) {
 addEarnedSetPacks([{
 setId: setId,
 setName: resolvedSetName,
 language: langToUse,
 count: mysteryResult.bonusPacksCount
 }]);
 setPityNotification({
 show: true,
 packName: effectiveMysteryPack.name,
 setName: resolvedSetName,
 bonusPacksCount: mysteryResult.bonusPacksCount,
 price: effectiveMysteryPack.price
 });
 }
 } catch (error) {
 console.error('Failed to load set pack:', error);
 const fallback = generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: setId });
 generatedCards = fallback;
 setCards(fallback);
 setIsChaseCardsReady(true);
 } finally {
 // FORCE pre-decoding of both the active pack wrapper art AND the card images into GPU memory BEFORE opening curtains!
 await preloadPackAssets(chosenArts, generatedCards);

 const elapsed = Date.now() - loadStartTime;
 const minCurtainTime = 1200;
 const remainingDelay = Math.max(0, minCurtainTime - elapsed);
 if (remainingDelay > 0) {
 await new Promise(r => setTimeout(r, remainingDelay));
 }
 isLoadingPackRef.current = false;
 setIsLoadingPack(false);
 }
 }, [packArtsManifest, selectedLanguage, currentMysteryPack]);

 // Load initial set on mount only once
 const hasLoadedInitialSetRef = useRef(false);
 useEffect(() => {
 if (!hasLoadedInitialSetRef.current) {
 hasLoadedInitialSetRef.current = true;
 loadSetAndGeneratePack('me02.5');
 }
 }, [loadSetAndGeneratePack]);

 // Allow keyboard Left/Right arrows or A/D to cycle through pack arts when unopened
 useEffect(() => {
 const handleKeyDown = (e: KeyboardEvent) => {
 if (packStage !== 'unopened' || currentPackArts.length <= 1) return;
 if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
 setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
 sound.playTabSwitch();
 } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
 setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
 sound.playTabSwitch();
 }
 };
 window.addEventListener('keydown', handleKeyDown);
 return () => window.removeEventListener('keydown', handleKeyDown);
 }, [packStage, currentPackArts.length]);

 // Fetch series sets with race condition protection when modal opens or tab changes
 useEffect(() => {
 let mounted = true;
 if (isSetSelectorOpen && selectedSeriesId && !selectedSeriesId.startsWith('mystery')) {
 setIsLoadingSeries(true);
 if (selectedLanguage === 'ja') {
 fetchJapaneseSeriesDetails(selectedSeriesId)
 .then(data => {
 if (mounted) {
 setCurrentSeriesData(data);
 setIsLoadingSeries(false);
 }
 })
 .catch(err => {
 console.error('Error fetching Japanese series details:', err);
 if (mounted) setIsLoadingSeries(false);
 });
 } else {
 if (selectedSeriesId === 'base') {
 Promise.all([
 fetchSeriesDetails('base'),
 fetchSeriesDetails('gym')
 ])
 .then(([baseData, gymData]) => {
 if (mounted) {
 const combinedSets = [...(baseData.sets || []), ...(gymData.sets || [])];
 setCurrentSeriesData({ ...baseData, sets: combinedSets });
 setIsLoadingSeries(false);
 }
 })
 .catch(err => {
 console.error('Error fetching series details:', err);
 if (mounted) setIsLoadingSeries(false);
 });
 } else {
 fetchSeriesDetails(selectedSeriesId)
 .then(data => {
 if (mounted) {
 setCurrentSeriesData(data);
 setIsLoadingSeries(false);
 }
 })
 .catch(err => {
 console.error('Error fetching series details:', err);
 if (mounted) setIsLoadingSeries(false);
 });
 }
 }
 }
 return () => { mounted = false; };
 }, [selectedSeriesId, selectedLanguage, isSetSelectorOpen]);

 const handleStackMouseLeave = useCallback(() => {
 setIsHoveringStack(false);
 }, []);

 const { remainingCards, revealedCards, topCardId, isDoubleHitPack } = React.useMemo(() => {
 const rem = cards.filter(c => !c.collected);
 const rev = cards.filter(c => c.collected);
 const topId = rem.length > 0 ? rem[rem.length - 1].id : null;

 // Detect double hit pack: 2 or more hits in the pack (Galarian Gallery / Trainer Gallery / IR / SIR / Ultra Rare / value >= $2.00)
 const hits = cards.filter(c => {
 const r = (c.pokemon.rarity || '').toLowerCase();
 const val = c.value || 0;
 const isRareHit = r.includes('galarian') || r.includes('trainer gallery') || r.includes('shiny') || r.includes('illustration') || r.includes('special') || r.includes('secret') || r.includes('hyper') || r.includes('gold') || r.includes('ultra') || r.includes('ex') || r.includes('vmax') || r.includes('vstar') || r.includes('v');
 return val >= 2.00 || (isRareHit && !r.includes('common') && !r.includes('uncommon'));
 });

 return { remainingCards: rem, revealedCards: rev, topCardId: topId, isDoubleHitPack: hits.length >= 2 };
 }, [cards]);

 const chaseCardsForActiveSet = React.useMemo(() => {
    if (!currentSet || !currentSet.cards || currentSet.cards.length === 0) return [];
    const candidates = currentSet.cards.filter(c => !c.name.toLowerCase().includes('energy') && !c.id.toLowerCase().includes('energy'));
    const mapped = candidates.map((card, idx) => {
      const cached = cardFullCache.get(card.id) || scrydexCardFullCache.get(card.id);
      const baseUrl = cached?.image || card.image || `https://assets.tcgdex.net/en/swsh/${currentSet.id}/${card.localId || card.id?.split('-').pop() || idx + 1}`;
      const poke: PokemonCard = {
        ...card,
        id: cached?.id || card.id,
        name: cached?.name || card.name,
        images: {
          small: getCardImageUrl(baseUrl, 'low'),
          large: getCardImageUrl(baseUrl, 'high'),
        },
        rarity: cached?.rarity || card.rarity || 'Common',
        pricing: cached?.pricing || (card as any).pricing,
        tcgplayer: cached?.tcgplayer || (card as any).tcgplayer,
        cardmarket: cached?.cardmarket || cached?.pricing?.cardmarket || (card as any).cardmarket,
        illustrator: cached?.illustrator || (card as any).illustrator,
      };
      return {
        card: poke,
        value: getRealCardPrice(poke),
        setName: currentSet.name
      };
    });

    const filtered = mapped.filter(item => {
      const r = (item.card.rarity || '').toLowerCase();
      const n = (item.card.name || '').toLowerCase();
      const isPlainItem = (n.includes('balloon') || n.includes('candy') || n.includes('switch') || n.includes('potion') || n.includes('ball') || n.includes('rope')) && !r.includes('secret') && !r.includes('gold') && !r.includes('special');
      if (isPlainItem && item.value < 10) return false;
      return item.value >= 1.50 || r.includes('secret') || r.includes('illustration') || r.includes('ultra') || r.includes('vmax') || r.includes('vstar') || r.includes('ex') || r.includes('gx') || r.includes('holo');
    });

    filtered.sort((a, b) => b.value - a.value);
    return filtered.slice(0, 12);
  }, [currentSet, cacheTick]);

  const [mysteryPackChaseCards, setMysteryPackChaseCards] = useState<MysteryPackChaseCard[]>([]);

  useEffect(() => {
    if (!currentMysteryPack) {
      setMysteryPackChaseCards([]);
      return;
    }
    let isMounted = true;
    setIsChaseCardsReady(false);
    void getMysteryPackChaseCards(currentMysteryPack).then(cards => {
      if (isMounted) {
        setMysteryPackChaseCards(cards);
        setIsChaseCardsReady(true);
      }
    });
    return () => { isMounted = false; };
  }, [currentMysteryPack]);

  const effectiveChaseCards = React.useMemo(() => {
    if (currentMysteryPack && mysteryPackChaseCards.length > 0) {
      return mysteryPackChaseCards;
    }
    return chaseCardsForActiveSet;
  }, [currentMysteryPack, mysteryPackChaseCards, chaseCardsForActiveSet]);

 const flipTimesRef = useRef<Record<string | number, number>>({});

 const handleCardClick = useCallback((id: string | number) => {
 if (isRevealingAll) return;
 const now = Date.now();
 const lastFlip = flipTimesRef.current[id] || 0;

 // Fast-responsive check: allow instant interaction after brief 160ms debounce so user feels buttery smooth response
 if (now - lastFlip < 160) {
 return;
 }

 setCards(prev => prev.map(card => {
 if (card.id === id) {
 if (!card.flipped) {
 flipTimesRef.current[id] = now;
 sound.playCardFlip(card.pokemon.rarity);
 setSessionTotal(s => Number((s + card.value).toFixed(2)));
 return { ...card, flipped: true };
 } else if (!card.collected) {
 sound.playCardCollect(card.value);
 if ((card.value || 0) < 1.00) {
 saveCardToCatalogue(card, currentSet?.name || 'Unknown Set');
 }
 return { ...card, collected: true };
 }
 }
 return card;
 }));
 }, [isRevealingAll, currentSet?.name]);

 const handleInspectCard = useCallback((card: CardData) => {
 sound.playModalOpen();
 setInspectedViewMode('market');
 setInspectedCard(card);
 }, []);

 const handleAddToBinderSingle = useCallback((card: CardData) => {
 if (binderAddedIds.has(card.id)) return;
 setAvailableBinders(getBinders());
 setBinderSelectModal({ cards: [card], setName: currentSet?.name || 'Unknown Set' });
 }, [binderAddedIds, currentSet?.name]);

 const handleRevealAll = () => {
 if (isRevealingAll || remainingCards.length === 0) return;
 setIsRevealingAll(true);
 sound.playButtonClick();

 // Reverse so the top-of-stack card (last element) is revealed first,
 // matching the visual stacking order where the top card has the highest index.
 const orderedCards = [...remainingCards].reverse();

 orderedCards.forEach((card, idx) => {
 // Step 1: Flip each card sequentially every 480ms so the reveal animation gets its full spotlight
 setTimeout(() => {
 sound.playRevealStep(idx, card.pokemon.rarity);
 setCards(prev => prev.map(c => {
 if (c.id === card.id && !c.flipped) {
 setSessionTotal(s => Number((s + c.value).toFixed(2)));
 return { ...c, flipped: true };
 }
 return c;
 }));
 }, idx * 480);

 // Step 2: Let the card stay face up and visible for 620ms (so you can admire the artwork/rarity),
 // then trigger collection and exit animation just as the next card begins to flip!
 setTimeout(() => {
 sound.playCardCollect(card.value);
 if ((card.value || 0) < 1.00) {
 saveCardToCatalogue(card, currentSet?.name || 'Unknown Set');
 }
 setCards(prev => prev.map(c => {
 if (c.id === card.id) {
 return { ...c, collected: true };
 }
 return c;
 }));
 if (idx === orderedCards.length - 1) {
 setTimeout(() => {
 sound.playPackComplete();
 setIsRevealingAll(false);
 }, 450);
 }
 }, idx * 480 + 620);
 });
 };

 const handleResetPack = async () => {
 if (!currentSet) return;
 sound.playPackOpen();
 setIsRevealingAll(false);
 setPackStage('unopened');
 setTearProgress(0);
 setBinderAddedIds(new Set());
 setPackArtIndex(prev => (prev + 1) % (currentPackArts.length || 1));

 // If opening a mystery pack, draw a new random set from the mystery pack pool on reset
 if (currentMysteryPack) {
 const result = rollMysteryPackResult(currentMysteryPack);
 await loadSetAndGeneratePack(result.setId, currentMysteryPack.language, currentMysteryPack, result);
 return;
 }

 if (currentSet) {
 if (isLoadingPackRef.current) return;
 isLoadingPackRef.current = true;
 const loadStartTime = Date.now();
 sound.playPackOpen();
 setIsLoadingPack(true);
 setPackStage('unopened');
 setTearProgress(0);
 try {
 const isJaSet = selectedLanguage === 'ja' || currentSet.id.endsWith('_ja');
 const newCards = isJaSet
 ? await generateJapanesePackFromSet(currentSet)
 : await generatePackFromSet(currentSet);
 setCards(formatAndSortCards(newCards));
 preloadPackImages(newCards).catch(() => {});
 setTimeout(() => {
 orchestrateSetLoading(currentSet, newCards.map(c => c.id));
 }, 200);
 } catch {
 setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet));
 } finally {
 const elapsed = Date.now() - loadStartTime;
 const minCurtainTime = 1200;
 const remainingDelay = Math.max(0, minCurtainTime - elapsed);
 setTimeout(() => {
 isLoadingPackRef.current = false;
 setIsLoadingPack(false);
 }, remainingDelay);
 }
 } else {
 setCards(generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet));
 }
 };

 const confirmPayPack = () => {
 setShowPriceGateModal(false);
 handleTearPack(true);
 };

 const handleResetStats = () => {
 sound.playButtonClick();
 try {
 localStorage.removeItem(getStorageKey('tcg_session_total', currentUser?.uid));
 localStorage.removeItem(getStorageKey('tcg_session_pack_count', currentUser?.uid));
 localStorage.removeItem(getStorageKey('tcg_session_spent', currentUser?.uid));
 } catch { }
 setSessionTotal(0);
 setPackCount(0);
 setSessionSpent(0);
 };

 return (
 <div
 className="w-full h-[100dvh] max-h-[100dvh] bg-[#0d0d0f] text-[#f0f0f2] font-sans overflow-hidden relative flex flex-col selection:bg-amber-500/30"
 style={{
 background: "radial-gradient(circle at center, #1c1c24 0%, #0d0d0f 100%)"
 }}
 >
 {/* Premium Leather Grain Texture Layer */}
 <div className="absolute inset-0 bg-[radial-gradient(#262630_1px,transparent_1px)] [background-size:12px_12px] opacity-25 pointer-events-none" />

 {/* Warm Ambient Gold / Obsidian Lighting */}
 <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[500px] bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none" />
 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[70%] h-[450px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08),transparent_70%)] pointer-events-none" />

 {/* App Header Bar */}
 <AppHeader
 activeTab={activeTab}
 setActiveTab={setActiveTab}
 isMobileMenuOpen={isMobileMenuOpen}
 setIsMobileMenuOpen={setIsMobileMenuOpen}
 currentUser={currentUser}
 userProfile={userProfile}
 setIsSetSelectorOpen={setIsSetSelectorOpen}
 setIsLoginModalOpen={setIsLoginModalOpen}
 setIsBulkModalOpen={setIsBulkModalOpen}
 setIsInventoryOpen={setIsInventoryOpen}
 earnedSetPacks={earnedSetPacks}
 ownedMysteryPacks={ownedMysteryPacks}
 />

 {/* Main Content or Binder View */}
 {activeTab === 'binder' ? (
 <BinderView
 onSwitchToPacks={() => setActiveTab('pack')}
 onInspectCard={(binderCard) => {
 sound.playModalOpen();
 setInspectedViewMode('art');
 const cardData: any = {
 id: binderCard.id,
 originalIndex: 0,
 flipped: false,
 collected: true,
 value: binderCard.currentPrice || 0,
 isSlabbed: binderCard.isSlabbed || false,
 slabGrade: binderCard.slabGrade || 'N/A',
 psaDetails: binderCard.psaDetails,
 binderId: binderCard.binderId || 'my-collection',
 pokemon: {
 id: binderCard.id.split('-')[0] + '-' + binderCard.id.split('-')[1] || binderCard.id,
 name: binderCard.name || 'Pokemon Card',
 rarity: binderCard.rarity || 'Common',
 isReverseHolo: binderCard.holofoil || false,
 illustrator: 'Official Pokémon Artist',
 isSlabbed: binderCard.isSlabbed || false,
 slabGrade: binderCard.slabGrade || 'N/A',
 psaDetails: binderCard.psaDetails,
 images: {
 small: binderCard.imageUrl || '',
 large: binderCard.imageUrl || '',
 },
 pricing: {
 tcgplayer: {},
 cardmarket: {}
 }
 }
 };
 setInspectedCard(cardData);
 }}
 />
 ) : activeTab === 'psa' ? (
 <PSAGradingLab
 onBackToPacks={() => setActiveTab('pack')}
 onGradeComplete={() => {
 getBinders();
 }}
 />
 ) : activeTab === 'ripNship' ? (
 <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-8 flex items-center justify-center">
 <div className="relative min-h-[420px] w-full max-w-3xl flex flex-col items-center justify-center p-6 sm:p-12 text-center rounded-3xl bg-gradient-to-b from-[#1c1428]/95 via-[#140e20]/95 to-[#0b0814]/95 border border-rose-500/30 shadow-[0_0_60px_rgba(244,63,94,0.18)] overflow-hidden my-4">
 {/* Ambient Background Glow */}
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.15)_0%,transparent_70%)] pointer-events-none" />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

 {/* Top Caution Banner */}
 <div className="absolute top-0 left-0 right-0 py-2 bg-gradient-to-r from-red-600/20 via-rose-500/30 to-red-600/20 border-b border-rose-500/30 flex items-center justify-center gap-2 overflow-hidden">
 <div className="text-[10px] sm:text-[11px] font-black text-rose-300 uppercase tracking-widest flex items-center gap-2 animate-pulse">
 <Construction className="w-4 h-4 text-rose-400 shrink-0" />
 <span>IN WORKS • RIP & SHIP LIVE STREAM STUDIO</span>
 <Construction className="w-4 h-4 text-rose-400 shrink-0" />
 </div>
 </div>

 {/* Main Icon */}
 <div className="relative mb-6 mt-6">
 <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-red-600/25 via-rose-600/20 to-amber-600/20 border border-rose-500/40 flex items-center justify-center shadow-[0_0_40px_rgba(244,63,94,0.35)]">
 <Hammer className="w-10 h-10 sm:w-12 sm:h-12 text-rose-400 animate-bounce" />
 </div>
 <div className="absolute -top-1.5 -right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-rose-500 text-white flex items-center justify-center font-black text-xs sm:text-sm shadow-lg border-2 border-[#140e20]">
 
 </div>
 </div>

 {/* Content */}
 <span className="px-4 py-1 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 font-mono font-black text-xs uppercase tracking-widest mb-3 shadow-inner">
 UNDER DEVELOPMENT
 </span>
 <h3 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-2">
 RipNship Live Studio — In Works
 </h3>
 <p className="text-sm sm:text-base text-gray-300 max-w-lg leading-relaxed mb-6 font-medium px-4">
 Our live stream <span className="text-rose-400 font-bold">RipNship</span> studio platform is currently undergoing major upgrades and live queue enhancements. <span className="text-amber-300 font-extrabold block mt-2">This will be available shortly!</span>
 </p>

 <button
 onClick={() => { sound.playTabSwitch(); setActiveTab('pack'); }}
 className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs sm:text-sm shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all cursor-pointer hover:scale-105 active:scale-95"
 >
 <Sparkles className="w-4 h-4 text-rose-200 shrink-0" />
 <span>Return to Pack Opener</span>
 </button>
 </div>
 </div>
 ) : activeTab === 'multiplayerLobby' ? (
 <div className="flex-1 overflow-y-auto min-h-0">
 <PackOffLobby
 onBack={() => setActiveTab('pack')}
 onEnterArena={(id) => {
 setMatchId(id);
 setActiveTab('multiplayerArena');
 }}
 selectedPackId={currentSet?.id || 'swsh3'}
 />
 </div>
 ) : activeTab === 'multiplayerArena' ? (
 <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
 <PackOffArena
 matchId={matchId}
 onLeave={() => setActiveTab('multiplayerLobby')}
 onChangeSetRequest={() => setIsSetSelectorOpen(true)}
 packArts={currentPackArts}
 setName={currentSet?.name || 'Pokémon TCG'}
 generateCards={async () => {
 if (currentSet) {
 try {
 const isJaSet = selectedLanguage === 'ja' || currentSet.id.endsWith('_ja');
 const newCards = isJaSet
 ? await generateJapanesePackFromSet(currentSet)
 : await generatePackFromSet(currentSet);
 return formatAndSortCards(newCards);
 } catch {
 return generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet);
 }
 }
 return generateFallbackPack(FALLBACK_POKEMON_CARDS, currentSet);
 }}
 onLoadPack={(setId) => {
 if (currentSet?.id !== setId) {
 loadSetAndGeneratePack(setId);
 }
 }}
 renderCardStack={(stackCards, revealedIndex) => {
 return (
 <AnimatePresence>
 {stackCards.map((c, idx) => {
 const topCardIndex = stackCards.length - 1 - Math.max(0, revealedIndex);

 if (idx > topCardIndex) return null; // Collected cards

 const isTopCard = idx === topCardIndex;
 const isFlipped = isTopCard && revealedIndex >= 0;

 const midIdx = Math.floor(stackCards.length / 2);
 const rotation = (idx - midIdx) * 3.8;
 const offsetX = (idx - midIdx) * 11;
 const offsetY = Math.abs(idx - midIdx) * 4;

 return (
 <Card
 key={c.id || idx}
 card={{ ...c, flipped: isFlipped }}
 rotation={rotation}
 offsetX={offsetX}
 offsetY={offsetY}
 isTopCard={isTopCard}
 isHovered={isTopCard}
 setName={currentSet?.name || 'Pokémon TCG'}
 />
 );
 })}
 </AnimatePresence>
 );
 }}
 />
 </div>
 ) : (activeTab === 'cardShow' || activeTab === 'auctions') ? (
 <div className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden min-h-0 w-full">
 <CardShowView
 initialShowAuction={activeTab === 'auctions'}
 onBackToPacks={() => setActiveTab('pack')}
 onAddNetReturn={(amt) => setSessionTotal((s) => Number((s + amt).toFixed(2)))}
 onSpendNetReturn={(amt) => setSessionSpent((s) => Number((s + amt).toFixed(2)))}
 onInspectCard={(binderCard) => {
 sound.playModalOpen();
 setInspectedViewMode('art');
 const cardData: any = {
 id: binderCard.id,
 originalIndex: 0,
 flipped: false,
 collected: true,
 value: binderCard.currentPrice || 0,
 isSlabbed: binderCard.isSlabbed || false,
 slabGrade: binderCard.slabGrade || 'N/A',
 binderId: 'my-collection',
 isVendorCatalog: binderCard.isVendorCatalog || true,
 vendorName: binderCard.vendorName || 'VINTAGEVAULT TCG',
 vendorBooth: binderCard.vendorBooth || '5B',
 vendorRating: binderCard.vendorRating || '4.8 / 5',
 pokemon: {
 id: binderCard.id,
 name: binderCard.name || 'Pokemon Card',
 rarity: 'Special',
 isReverseHolo: false,
 illustrator: 'Expo Circuit',
 isSlabbed: binderCard.isSlabbed || false,
 slabGrade: binderCard.slabGrade || 'N/A',
 isVendorCatalog: binderCard.isVendorCatalog || true,
 vendorName: binderCard.vendorName || 'VINTAGEVAULT TCG',
 vendorBooth: binderCard.vendorBooth || '5B',
 vendorRating: binderCard.vendorRating || '4.8 / 5',
 images: {
 small: binderCard.imageUrl || '',
 large: binderCard.imageUrl || '',
 },
 pricing: {
 tcgplayer: {},
 cardmarket: {}
 }
 }
 };
 setInspectedCard(cardData);
 }}
 />
 </div>
 ) : activeTab === 'missions' ? (
 <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 w-full">
 <MissionsView
 onBackToPacks={() => setActiveTab('pack')}
 onOpenInventory={() => setIsInventoryOpen(true)}
 onSelectEarnedPack={(setId, language) => {
 setActiveTab('pack');
 setSelectedLanguage(language);
 loadSetAndGeneratePack(setId, language);
 }}
 onOpenCardCatalogue={(binderCard) => {
 sound.playModalOpen();
 setInspectedViewMode('art');
 const cardData: any = {
 id: binderCard.id,
 originalIndex: 0,
 flipped: false,
 collected: true,
 value: (binderCard as any).value || (binderCard as any).currentPrice || 150,
 pokemon: binderCard
 };
 setInspectedCard(cardData);
 }}
 />
 </div>
 ) : activeTab === 'profile' ? (
 <ProfileView
 currentUser={currentUser}
 netReturn={sessionTotal - sessionSpent}
 packCount={packCount}
 onBackToPacks={() => setActiveTab('pack')}
 />
 ) : (
 <main className="flex-1 flex flex-col items-center justify-start pt-2 z-10 relative px-4 pb-12 overflow-y-auto overflow-x-hidden w-full">

        {/* Pack Opening Command & Control HUD Console */}
        <PackOpeningConsole
          currentSet={currentSet}
          sessionSpent={sessionSpent}
          sessionTotal={sessionTotal}
          luckyDropSeconds={luckyDropSeconds}
          formatTimer={formatTimer}
          handleLuckyDropClick={handleLuckyDropClick}
          dailyFreePacks={dailyFreePacks}
          earnedSetPacks={earnedSetPacks}
          ownedMysteryPacks={ownedMysteryPacks}
          dailyCash={dailyCash}
          packStage={packStage}
          cards={cards}
          remainingCards={remainingCards}
          handleResetStats={handleResetStats}
          isLoadingPack={isLoadingPack}
          handleResetPack={handleResetPack}
          setActiveTab={setActiveTab}
          sound={sound}
        />

 {/* Mobile-Only Set Intelligence & Top Chase Grails Bar (Hidden on Desktop >= lg) */}
 <div className="flex lg:hidden flex-col gap-2.5 w-full max-w-md mx-auto px-3 my-3 shrink-0">
 {/* Top Row: Active Set Info + View All Chase Modal Button */}
 <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#1a1a26]/95 via-[#181824]/95 to-[#14141c]/95 border border-amber-500/40 shadow-[0_6px_25px_rgba(0,0,0,0.65),inset_0_1px_1px_rgba(255,255,255,0.15)]">
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0 shadow-sm">
 
 </div>
 <div className="min-w-0">
 <div className="text-[10px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
 <span>Top Chase Grails</span>
 <span className="bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded text-[9px] border border-amber-400/30">
 {effectiveChaseCards.length} Grails
 </span>
 </div>
 <div className="text-xs font-black text-white truncate mt-0.5">
 {currentMysteryPack ? currentMysteryPack.name : (currentSet?.name || 'Active Set')}
 </div>
 </div>
 </div>
 <button
 onClick={() => { sound.playButtonClick(); setShowChaseModal(true); }}
 className="px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs shadow-[0_4px_15px_rgba(245,158,11,0.5)] border border-amber-300/60 flex items-center gap-1 shrink-0 active:scale-95 transition-all cursor-pointer"
 >
 <span>View All 12</span>
 <ChevronRight className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Bottom Row: Compact Top 3 Chase Cards Gallery for Mobile */}
 <div className="grid grid-cols-3 gap-2 w-full relative">
 {!isChaseCardsReady || effectiveChaseCards.length === 0 ? (
 <div className="col-span-3 flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b from-[#181824]/95 via-[#12121c]/95 to-[#0b0b10]/95 border border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md min-h-[135px]">
 {/* Ambient Shimmer Light Effect */}
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)] animate-pulse pointer-events-none" />
 <div className="flex items-center gap-2 mb-2 relative z-10">
 <RefreshCcw className="w-4 h-4 text-amber-400 animate-spin" />
 <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
 Loading Chase Cards...
 </span>
 <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
 </div>
 <div className="w-full grid grid-cols-3 gap-2 relative z-10 opacity-70">
 {Array.from({ length: 3 }).map((_, idx) => (
 <div key={`curtain-mob-${idx}`} className="flex flex-col items-center p-1.5 rounded-xl bg-black/40 border border-amber-500/20 relative overflow-hidden">
 <div className="w-10 h-14 rounded-md bg-white/10 animate-pulse my-1" />
 <div className="w-12 h-2 rounded bg-amber-400/20 mt-1 animate-pulse" />
 </div>
 ))}
 </div>
 </div>
 ) : effectiveChaseCards.slice(0, 3).map(({ card, value }, idx) => (
 <div
 key={card.id || idx}
 onClick={() => {
 sound.playCardFlip();
 setInspectedCard({
 id: Date.now() + idx,
 originalIndex: idx,
 flipped: false,
 collected: false,
 value,
 pokemon: card
 });
 }}
 className="flex flex-col items-center p-2 rounded-xl bg-[#14141c]/90 border border-white/15 hover:border-amber-400/60 shadow-md active:scale-95 transition-all cursor-pointer relative group overflow-hidden"
 >
 <div className="absolute top-1.5 left-1.5 z-10 text-[8px] font-black bg-black/80 text-amber-300 px-1.5 py-0.5 rounded border border-amber-400/30">
 #{idx + 1}
 </div>
 <div className="text-[10px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-1.5 py-0.2 rounded mb-1 shadow-sm leading-tight mt-0.5">
 ${value.toFixed(0)}
 </div>
 <div
 className="w-14 sm:w-16 h-20 sm:h-22 rounded-md overflow-hidden bg-black/60 shrink-0 border border-white/20 flex items-center justify-center my-1 relative"
 style={{ aspectRatio: '63 / 88' }}
 >
 <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-1 text-center border-2 border-[#333344] z-0">
 <span className="text-gray-500/80 font-black tracking-tighter text-[8px] mb-0.5">{card.localId || card.id?.split('-').pop()}</span>
 <span className="font-bold text-white text-[8px] leading-tight truncate w-full">{card.name}</span>
 </div>
 <img
 src={imageFallbacks.get(card.id) || card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${currentSet?.id || 'swsh3'}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.webp`}
 alt={card.name}
 className="absolute inset-0 w-full h-full object-cover block z-10"
 onError={(e) => {
 const target = e.currentTarget as HTMLImageElement;
 const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
 const setId = currentSet?.id || card.id?.split('-')[0] || 'swsh3';
 handleCardImageError(target, setId, num);
 imageFallbacks.set(card.id, target.src);
 }}
 />
 </div>
 <div className="text-[10px] font-bold text-white truncate w-full text-center mt-0.5">
 {card.name}
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Centerpiece: Card Stack */}
 <div className="w-full flex items-center justify-center shrink-0 min-h-[380px] my-2">
 {packStage !== 'opened' ? (
 <div className="w-full flex items-center justify-center gap-4 lg:gap-8 xl:gap-14 px-2 sm:px-6 relative my-2">
 {/* Left Flank: Live Set Lore & God-Pack Intelligence Pill */}
 <motion.div
 initial={{ opacity: 0, x: -20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.5 }}
 className="hidden lg:flex flex-col w-60 xl:w-72 shrink-0 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.65)] relative overflow-hidden group select-none self-center"
 >
 <div className="absolute top-0 right-0 -mr-12 -mt-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-all duration-500" />

 {/* Header Badge */}
 <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
 <Award className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-xs font-black uppercase tracking-wider text-white">Live Set Intelligence</h4>
 <span className="text-[10px] text-amber-400/90 font-mono font-bold">{currentSet?.id?.toUpperCase() || 'SV-PME'} • AUTHENTIC FOIL</span>
 </div>
 </div>
 </div>

 {/* Active Set Spotlight */}
 <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-3.5 relative overflow-hidden">
 <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Active Booster Set</div>
 <div className="text-sm font-black text-amber-300 tracking-tight mt-0.5 leading-snug">
 {currentSet?.name || 'Scarlet & Violet: Prismatic Evolutions'}
 </div>
 <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5 text-[11px] text-gray-300 font-medium">
 <Package className="w-3.5 h-3.5 text-amber-400" />
 <span>{currentSet?.cardCount?.total || 162} Total Set Cards</span>
 </div>
 </div>

 {/* Set Chase Cards Main Page Spotlight & Mini List */}
 <div className="bg-gradient-to-b from-[#181824]/90 to-[#11111a]/90 border border-amber-500/35 rounded-2xl p-3 mb-3.5 shadow-[0_4px_15px_rgba(245,158,11,0.15)]">
 <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-white/10">
 <div className="flex items-center gap-1.5">
 <span className="text-sm"></span>
 <span className="text-[11px] font-black uppercase tracking-wider text-amber-300">Top Chase Grails</span>
 </div>
 <button
 onClick={() => { sound.playButtonClick(); setShowChaseModal(true); }}
 className="text-[10px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-0.5 cursor-pointer bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30 transition-all hover:scale-105"
 >
 <span>View All 12</span>
 <ChevronRight className="w-3 h-3" />
 </button>
 </div>

 {/* Mini List of Top 3 Chase Cards with Card Image Beside Price */}
 <div className="space-y-2 relative">
 {!isChaseCardsReady || effectiveChaseCards.length === 0 ? (
 <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-gradient-to-b from-[#181824]/95 via-[#12121c]/95 to-[#0b0b10]/95 border border-amber-500/30 shadow-[0_10px_25px_rgba(0,0,0,0.5)] relative overflow-hidden backdrop-blur-md min-h-[180px]">
 <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.12),transparent_70%)] animate-pulse pointer-events-none" />
 <div className="flex items-center gap-2 mb-3 relative z-10">
 <RefreshCcw className="w-4 h-4 text-amber-400 animate-spin" />
 <span className="text-xs font-black tracking-wider uppercase bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
 Loading Chase Cards...
 </span>
 <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
 </div>
 <div className="w-full space-y-2 relative z-10 opacity-75">
 {Array.from({ length: 3 }).map((_, idx) => (
 <div key={`curtain-desk-${idx}`} className="flex items-center justify-between p-2 rounded-xl bg-black/40 border border-amber-500/20 relative overflow-hidden">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-10 rounded-md bg-white/10 animate-pulse shrink-0" />
 <div className="flex flex-col gap-1.5">
 <div className="w-20 h-2.5 rounded bg-amber-300/20 animate-pulse" />
 <div className="w-12 h-2 rounded bg-white/10 animate-pulse" />
 </div>
 </div>
 <div className="w-8 h-3 rounded bg-emerald-400/20 animate-pulse" />
 </div>
 ))}
 </div>
 </div>
 ) : effectiveChaseCards.slice(0, 3).map(({ card, value }, idx) => (
 <div
 key={card.id || idx}
 onClick={() => {
 sound.playCardFlip();
 setInspectedCard({
 id: Date.now() + idx,
 originalIndex: idx,
 flipped: false,
 collected: false,
 value,
 pokemon: card
 });
 }}
 className="group flex items-center justify-between p-1.5 rounded-xl bg-black/50 hover:bg-black/80 border border-white/10 hover:border-amber-400/60 transition-all duration-200 cursor-pointer shadow-sm"
 >
 <div className="flex items-center gap-2.5 min-w-0">
 {/* Card thumbnail with price directly above art */}
 <div className="flex flex-col items-center shrink-0">
 <div className="text-[9px] font-black text-emerald-400 bg-emerald-500/15 border border-emerald-500/40 px-1 py-0.2 rounded mb-0.5 shadow-sm leading-tight">
 ${value.toFixed(0)}
 </div>
 <div
 className="w-9 h-12 rounded-md overflow-hidden bg-black/60 shrink-0 border border-white/20 relative flex items-center justify-center card-aspect-ratio-sm"
 style={{ minWidth: '36px', minHeight: '48px', aspectRatio: '63 / 88' }}
 >
 <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-0.5 text-center z-0">
 <span className="font-bold text-white text-[6px] leading-tight truncate w-full">{card.name}</span>
 </div>
 <img
 src={card.images?.small || card.images?.large || `https://assets.tcgdex.net/en/swsh/${currentSet?.id || 'swsh3'}/${card.localId || card.id?.split('-').pop() || idx + 1}/low.webp`}
 alt={card.name}
 className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 block z-10"
 onError={(e) => {
 const target = e.currentTarget as HTMLImageElement;
 const num = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
 const setId = currentSet?.id || card.id?.split('-')[0] || 'swsh3';
 handleCardImageError(target, setId, num);
 }}
 />
 </div>
 </div>
 <div className="min-w-0">
 <div className="text-[11px] font-bold text-white truncate group-hover:text-amber-300 transition-colors">
 {card.name}
 </div>
 <div className="text-[9px] text-gray-400 truncate font-medium">
 #{idx + 1} Chase • {card.rarity || 'Secret Rare'}
 </div>
 </div>
 </div>
 <div className="text-right shrink-0 pl-2">
 <div className="text-xs font-black text-emerald-400 font-mono tracking-tight">
 ${value.toFixed(2)}
 </div>
 </div>
 </div>
 ))}
 {chaseCardsForActiveSet.length === 0 && (
 <div className="py-3 text-center text-[10px] text-gray-400 italic">
 Loading set pricing intelligence...
 </div>
 )}
 </div>
 </div>

 {/* Authenticity Guarantee Footer */}
 <div className="mt-3.5 pt-3 border-t border-white/5 flex items-center gap-2 text-[10px] text-gray-400 font-medium">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span>100% Factory Sealed Foil Wrapper</span>
 </div>
 </motion.div>

 {/* Center Column: The Interactive Booster Pack Arena with Ambient Stage Lighting */}
 <div className="relative flex items-center justify-center min-w-[280px] sm:min-w-[320px] z-10 py-2">
 {/* Cosmic Studio Backlight Aura */}
 <div className="absolute inset-0 bg-[radial-gradient(circle_300px_at_50%_50%,rgba(245,158,11,0.12)_0%,rgba(168,85,247,0.06)_50%,transparent_85%)] pointer-events-none -z-10" />
 <div className="absolute inset-0 bg-[radial-gradient(#ffffff08_1px,transparent_1px)] [background-size:24px_24px] [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,#000_60%,transparent_100%)] pointer-events-none -z-10 opacity-60" />

 {/* Floating Holographic Energy Jewels (Left & Right of Pack) */}
 <div className="absolute left-0 sm:-left-4 top-1/4 w-9 h-9 rounded-2xl bg-gradient-to-br from-amber-400/20 to-yellow-600/10 border border-amber-400/30 hidden sm:flex items-center justify-center text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] pointer-events-none select-none z-0 animate-jewel-1">
 
 </div>
 <div className="absolute right-0 sm:-right-4 top-1/3 w-9 h-9 rounded-2xl bg-gradient-to-br from-purple-400/20 to-indigo-600/10 border border-purple-400/30 hidden sm:flex items-center justify-center text-purple-300 shadow-[0_0_20px_rgba(168,85,247,0.3)] pointer-events-none select-none z-0 animate-jewel-2">
 
 </div>
 <div className="absolute left-2 sm:-left-2 bottom-1/4 w-8 h-8 rounded-2xl bg-gradient-to-br from-emerald-400/20 to-teal-600/10 border border-emerald-400/30 hidden sm:flex items-center justify-center text-emerald-300 shadow-[0_0_20px_rgba(10,185,129,0.3)] pointer-events-none select-none z-0 animate-jewel-3">
 
 </div>
 <div className="absolute right-2 sm:-right-2 bottom-1/3 w-8 h-8 rounded-2xl bg-gradient-to-br from-rose-400/20 to-pink-600/10 border border-rose-400/30 hidden sm:flex items-center justify-center text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.3)] pointer-events-none select-none z-0 animate-jewel-4">
 
 </div>

 {/* Pity Protection Active Alert Banner */}
 <AnimatePresence>
 {pityNotification && pityNotification.show && (
 <motion.div
 initial={{ opacity: 0, y: -20, scale: 0.95 }}
 animate={{ opacity: 1, y: 0, scale: 1 }}
 exit={{ opacity: 0, y: -20, scale: 0.95 }}
 className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 sm:w-96 p-3 rounded-2xl bg-gradient-to-r from-amber-950/95 via-purple-950/95 to-slate-900/95 border-2 border-amber-400/90 shadow-[0_0_30px_rgba(245,158,11,0.6)] z-30 text-left select-none"
 >
 <div className="flex items-start justify-between gap-2.5">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-black flex items-center justify-center text-lg shrink-0 shadow-md font-black">
 
 </div>
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-[9px] font-black uppercase tracking-wider text-amber-300 bg-amber-400/20 px-1.5 py-0.2 rounded border border-amber-400/40">
 Pity Protection Active
 </span>
 <span className="text-[10px] text-amber-300/80 font-mono font-bold">${pityNotification.price.toFixed(2)}</span>
 </div>
 <h5 className="text-xs font-black text-white mt-0.5 truncate max-w-[210px]">
 Drawn: {pityNotification.setName}
 </h5>
 <p className="text-[10px] text-amber-200/90 mt-0.5 leading-tight">
 Compensated with <strong className="text-amber-300 font-extrabold">+{pityNotification.bonusPacksCount} FREE Packs</strong> of {pityNotification.setName} in inventory!
 </p>
 </div>
 </div>
 <button
 onClick={() => setPityNotification(null)}
 className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer shrink-0"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>

 <AnimatePresence mode="wait">
 {isLoadingPack ? (
 <PackLoadingCurtain
 key="main-pack-loading-curtain"
 setName={currentSet?.name}
 />
 ) : (
 <BoosterPackTear
 key="main-booster-pack-tear"
 packArts={currentPackArts}
 packArtIndex={packArtIndex}
 onPrevPackArt={() => {
 sound.playTabSwitch();
 setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
 }}
 onNextPackArt={() => {
 sound.playTabSwitch();
 setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
 }}
 onTearComplete={handleTearPack}
 setName={currentSet?.name}
 packStage={packStage}
 remainingCardsCount={remainingCards.length}
 />
 )}
 </AnimatePresence>
 </div>

 {/* Right Flank: Pack Art Studio & Precision Haptic Control Panel */}
 <motion.div
 initial={{ opacity: 0, x: 20 }}
 animate={{ opacity: 1, x: 0 }}
 transition={{ duration: 0.5 }}
 className="hidden lg:flex flex-col w-60 xl:w-72 shrink-0 bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-[0_25px_60px_rgba(0,0,0,0.65)] relative overflow-hidden group select-none self-center"
 >
 <div className="absolute top-0 left-0 -ml-12 -mt-12 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-500" />

 {/* Header Badge */}
 <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5">
 <div className="flex items-center gap-2">
 <div className="w-7 h-7 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
 <Palette className="w-4 h-4" />
 </div>
 <div>
 <h4 className="text-xs font-black uppercase tracking-wider text-white">Pack Art Studio</h4>
 <span className="text-[10px] text-indigo-300/90 font-mono font-bold">SELECT WRAPPER DESIGN</span>
 </div>
 </div>
 </div>

 {/* Pack Art Gallery Switcher */}
 <div className="bg-black/30 border border-white/5 rounded-2xl p-3 mb-3.5 space-y-3">
 <div className="flex items-center justify-between text-xs font-bold text-gray-300">
 <span>Wrapper Variation:</span>
 <span className="font-mono text-indigo-400 font-black">#{packArtIndex + 1} of {currentPackArts.length}</span>
 </div>

 <div className="flex items-center gap-2">
 <button
 onClick={() => {
 sound.playTabSwitch();
 setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length);
 }}
 className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
 >
 <ChevronLeft className="w-3.5 h-3.5 text-indigo-400" />
 Prev Style
 </button>
 <button
 onClick={() => {
 sound.playTabSwitch();
 setPackArtIndex(prev => (prev + 1) % currentPackArts.length);
 }}
 className="flex-1 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs font-bold text-gray-200 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
 >
 Next Style
 <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
 </button>
 </div>
 </div>

 {/* Haptic Tearing Pro Tip */}
 <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent border border-amber-500/20 space-y-2">
 <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
 <Zap className="w-4 h-4 text-amber-400 shrink-0" />
 <span>Precision Haptic Tearing</span>
 </div>
 <p className="text-[11px] text-gray-300 leading-relaxed font-medium">
 Hold and glide your cursor horizontally across the top perforated crimp to slice through the foil seamlessly!
 </p>
 </div>

 {/* Studio Audio Status */}
 <div className="space-y-2 mt-3.5 pt-3 border-t border-white/5">
 <div className="flex items-center justify-between text-xs font-medium text-gray-300">
 <span className="flex items-center gap-2">
 <Music className="w-3.5 h-3.5 text-indigo-400" />
 Studio Sound Effects
 </span>
 <span className="px-2 py-0.5 rounded text-[9px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
 ACTIVE
 </span>
 </div>
 </div>
 </motion.div>
 </div>
 ) : remainingCards.length > 0 ? (
 <div className="relative w-60 sm:w-68 h-[21rem] sm:h-[23.5rem] shrink-0 mt-6 mb-20 sm:mb-24 flex items-center justify-center">
 <div
 className="absolute -inset-8 z-[500] cursor-pointer rounded-3xl"
 onClick={() => topCardId !== null && handleCardClick(topCardId)}
 onMouseEnter={() => { setIsHoveringStack(true); sound.playCardSlide(true); }}
 onMouseLeave={handleStackMouseLeave}
 />

 <AnimatePresence>
 {cards.map((card) => {
 if (card.collected) return null;

 const midIdx = Math.floor(cards.length / 2);
 const baseRotation = (card.originalIndex - midIdx) * 3.8;
 const baseOffsetX = (card.originalIndex - midIdx) * 11;
 const baseOffsetY = Math.abs(card.originalIndex - midIdx) * 4;

 const rotation = isHoveringStack ? baseRotation * 1.5 : baseRotation;
 const offsetX = isHoveringStack ? baseOffsetX * 1.5 : baseOffsetX;
 const offsetY = baseOffsetY;

 return (
 <Card
 key={card.id}
 card={card}
 rotation={rotation}
 offsetX={offsetX}
 offsetY={offsetY}
 isTopCard={card.id === topCardId}
 isHovered={isHoveringStack && card.id === topCardId}
 setName={currentSet?.name}
 />
 );
 })}
 </AnimatePresence>
 </div>
 ) : (
 <motion.div
 initial={{ scale: 0.8, opacity: 0 }}
 animate={{ scale: 1, opacity: 1 }}
 transition={{ type: 'spring', bounce: 0.5 }}
 className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl max-w-md text-center shrink-0"
 >
 <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/40 flex items-center justify-center mb-4 text-green-400 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
 <CheckCircle2 className="w-8 h-8" />
 </div>
 <h3 className="text-2xl font-bold mb-2">All Cards Revealed!</h3>
 <p className="text-gray-400 text-sm mb-6">
 You opened {cards.length} cards valued at a total of <span className="text-green-400 font-bold">${cards.reduce((acc, c) => acc + c.value, 0).toFixed(2)}</span>.
 </p>
 <button
 onClick={() => { sound.playPackOpen(); handleResetPack(); }}
 className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 font-extrabold text-white shadow-[0_4px_20px_rgba(245,158,11,0.5)] hover:shadow-[0_6px_30px_rgba(245,158,11,0.8)] transition-all hover:scale-105 active:scale-95 cursor-pointer"
 >
 Open Next Pack
 </button>
 </motion.div>
 )}
 </div>

 {/* Bottom Action (Reveal All Cards) right below remaining cards */}
 {!isLoadingPack && packStage === 'opened' && remainingCards.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 transition={{ duration: 0.5, delay: 0.4 }}
 className="pt-2 pb-8 w-full flex justify-center min-h-[90px] relative z-[600] shrink-0"
 >
 <button
 onClick={handleRevealAll}
 disabled={isRevealingAll}
 className={`group relative px-10 py-4 rounded-2xl font-bold text-lg text-white shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all overflow-hidden ${isRevealingAll ? 'opacity-70 cursor-not-allowed scale-95' : 'hover:scale-[1.03] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] active:scale-[0.98] cursor-pointer'
 }`}
 >
 <div className="absolute inset-0 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 group-hover:from-amber-400 group-hover:to-orange-400 transition-all duration-300" />
 <span className="relative flex items-center justify-center gap-3 text-white font-black tracking-wide drop-shadow-md">
 <Sparkles className={`w-6 h-6 text-yellow-300 transition-transform ${isRevealingAll ? 'animate-spin' : 'group-hover:rotate-12 group-hover:scale-110'}`} />
 <span>
 {isRevealingAll ? 'Revealing Cards...' : 'Reveal All Cards '}
 </span>
 </span>
 </button>
 </motion.div>
 )}

 {/* Revealed Cards Gallery */}
 {!isLoadingPack && packStage === 'opened' && revealedCards.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-5xl mt-4 px-4 shrink-0"
 >
 <div className="flex flex-col items-center mb-6">
 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
 <Sparkles className="w-3.5 h-3.5 text-amber-400" />
 Revealed Pokemon Cards ({revealedCards.length} / {cards.length})
 </h3>
 <p className="text-[11px] text-amber-300/80 mt-1 font-medium"> Click any card to inspect full TCGplayer & Cardmarket live price breakdown or add to your binder</p>
 {revealedCards.filter(c => (c.value || 0) >= 1.00).length > 0 && (
 <button
 onClick={() => {
 const unadded = revealedCards.filter(c => !binderAddedIds.has(c.id) && (c.value || 0) >= 1.00);
 if (unadded.length === 0) return;
 setAvailableBinders(getBinders());
 setBinderSelectModal({ cards: unadded, setName: currentSet?.name || 'Unknown Set' });
 }}
 className="mt-3 px-5 py-2 rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white text-xs font-extrabold shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
 >
 <BookOpen className="w-4 h-4 text-amber-200" />
 <span>+ Add {revealedCards.filter(c => (c.value || 0) >= 1.00).length} Hits to Binder</span>
 </button>
 )}
 </div>
 <div className="flex flex-wrap items-stretch justify-center gap-6 sm:gap-8">
 <AnimatePresence>
 {revealedCards.map((card) => (
 <RevealedCardItem
 key={card.id}
 card={card}
 isAdded={binderAddedIds.has(card.id)}
 onInspect={handleInspectCard}
 onAddToBinder={handleAddToBinderSingle}
 />
 ))}
 </AnimatePresence>
 </div>
 </motion.div>
 )}

 </main>
 )}

 {/* Set Selector Modal */}
 <AnimatePresence>
 {isSetSelectorOpen && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[100] bg-black/85 flex items-center justify-center p-4"
 >
 <motion.div
 initial={{ scale: 0.95, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.95, opacity: 0, y: 20 }}
 className="bg-gradient-to-b from-[#1c1c24] via-[#14141a] to-[#0d0d0f] border border-white/20 rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.9),inset_0_1px_2px_rgba(255,255,255,0.15)]"
 >
 <div className="p-6 border-b border-white/10 flex items-center justify-between">
 <div>
 <h2 className="text-xl font-bold text-white flex items-center gap-2">
 <Layers className="w-5 h-5 text-amber-400" />
 Select a Pokemon Set
 </h2>
 <p className="text-xs text-gray-400 mt-1">Choose a set to open packs from</p>
 </div>
 <div className="flex items-center gap-4">
 <button
 onClick={() => { sound.playModalClose(); setIsSetSelectorOpen(false); }}
 className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>
 </div>

 {/* Language Toggle */}
 <div className="flex justify-center border-b border-white/10 p-4">
 <div className="bg-[#0f0f13] border border-white/10 rounded-full p-1 flex shadow-inner">
 <button
 onClick={() => {
 sound.playTabSwitch();
 setSelectedLanguage('en');
 setSelectedSeriesId(prev => {
 if (prev.startsWith('mystery')) return 'mystery_en';
 const clean = prev.replace(/_ja$/, '');
 const match = ENGLISH_SERIES_TABS.find(t => t.id === clean);
 return match ? match.id : ENGLISH_SERIES_TABS[0].id;
 });
 }}
 className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${selectedLanguage === 'en'
 ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]'
 : 'text-gray-400 hover:text-white hover:bg-white/5'
 }`}
 >
 English
 </button>
 <button
 onClick={() => {
 sound.playTabSwitch();
 setSelectedLanguage('ja');
 setSelectedSeriesId(prev => {
 if (prev.startsWith('mystery')) return 'mystery_ja';
 const jaId = prev.endsWith('_ja') ? prev : `${prev}_ja`;
 const match = JAPANESE_SERIES_TABS.find(t => t.id === jaId || t.id === prev);
 return match ? match.id : JAPANESE_SERIES_TABS[1]?.id || JAPANESE_SERIES_TABS[0].id;
 });
 }}
 className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${selectedLanguage === 'ja'
 ? 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-[0_0_15px_rgba(225,29,72,0.4)]'
 : 'text-gray-400 hover:text-white hover:bg-white/5'
 }`}
 >
 Japanese
 </button>
 </div>
 </div>

 {/* Series Tabs */}
 <div className="flex overflow-x-auto hide-scrollbar border-b border-white/10 px-4 py-2 gap-2 shrink-0">
 {(selectedLanguage === 'en' ? ENGLISH_SERIES_TABS : JAPANESE_SERIES_TABS).map(tab => {
 const isUnready = selectedLanguage === 'ja' && UNREADY_JAPANESE_SERIES_IDS.includes(tab.id);
 return (
 <button
 key={tab.id}
 onClick={() => { sound.playTabSwitch(); setSelectedSeriesId(tab.id); }}
 className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold rounded-t-xl transition-all border-b-2 cursor-pointer flex-shrink-0 flex items-center gap-2 ${selectedSeriesId === tab.id
 ? 'text-amber-300 border-amber-400 bg-gradient-to-r from-amber-500/20 to-orange-500/10 shadow-[0_-4px_15px_rgba(245,158,11,0.2)]'
 : 'text-gray-400 border-transparent hover:text-white hover:bg-white/5'
 }`}
 >
 <span>{tab.name}</span>
 {isUnready && (
 <span className="px-1.5 py-0.2 text-[9px] font-black rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
 In Works
 </span>
 )}
 </button>
 );
 })}
 </div>

 {/* Sets Grid */}
 <div className="p-6 overflow-y-auto flex-1">
 {(selectedLanguage === 'ja' && UNREADY_JAPANESE_SERIES_IDS.includes(selectedSeriesId)) ? (
 <div className="relative min-h-[360px] w-full flex flex-col items-center justify-center p-6 sm:p-10 text-center rounded-3xl bg-gradient-to-b from-[#181824]/95 via-[#111118]/95 to-[#0b0b10]/95 border border-amber-500/30 shadow-[0_0_50px_rgba(245,158,11,0.15)] overflow-hidden my-2">
 {/* Ambient Background Glow */}
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.15)_0%,transparent_70%)] pointer-events-none" />
 <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

 {/* Top Caution Banner */}
 <div className="absolute top-0 left-0 right-0 py-2 bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border-b border-amber-500/30 flex items-center justify-center gap-2 overflow-hidden">
 <div className="text-[10px] sm:text-[11px] font-black text-amber-300 uppercase tracking-widest flex items-center gap-2 animate-pulse">
 <Construction className="w-4 h-4 text-amber-400 shrink-0" />
 <span>IN WORKS • JAPANESE {JAPANESE_SERIES_TABS.find(t => t.id === selectedSeriesId)?.name?.toUpperCase()} ERA</span>
 <Construction className="w-4 h-4 text-amber-400 shrink-0" />
 </div>
 </div>

 {/* Main Icon */}
 <div className="relative mb-6 mt-6">
 <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.3)]">
 <Hammer className="w-10 h-10 text-amber-400 animate-bounce" />
 </div>
 <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-amber-400 text-black flex items-center justify-center font-black text-xs shadow-lg border-2 border-[#111118]">
 !
 </div>
 </div>

 {/* Content */}
 <span className="px-3.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono font-black text-xs uppercase tracking-widest mb-3 shadow-inner">
 UNDER DEVELOPMENT
 </span>
 <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
 In Works
 </h3>
 <p className="text-sm text-gray-300 max-w-md leading-relaxed mb-6 font-medium px-4">
 The <span className="text-amber-300 font-bold">{JAPANESE_SERIES_TABS.find(t => t.id === selectedSeriesId)?.name}</span> Japanese set collection is currently under active expansion & indexing. <span className="text-amber-300 font-extrabold block mt-2">This will be available shortly!</span>
 </p>

 <div className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs text-gray-300 font-semibold shadow-md">
 <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
 <span>Please select another active Japanese era (Mega Evolution, Scarlet & Violet, Sword & Shield, etc.) above!</span>
 </div>
 </div>
 ) : (selectedSeriesId === 'mystery_en' || selectedSeriesId === 'mystery_ja') ? (
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
 {(selectedLanguage === 'ja' ? JAPANESE_MYSTERY_PACKS : ENGLISH_MYSTERY_PACKS).map(pack => (
 <div
 key={pack.id}
 onClick={() => {
 const result = rollMysteryPackResult(pack);
 if (activeTab === 'multiplayerArena' && matchId) {
 try {
 void updateMatchPack(matchId, result.setId);
 setIsSetSelectorOpen(false);
 } catch (err) {
 console.error("Failed to update match set", err);
 }
 } else {
 void loadSetAndGeneratePack(result.setId, pack.language, pack, result);
 }
 }}
 className={`p-5 rounded-3xl border bg-gradient-to-br ${pack.gradient} ${pack.borderColor} ${pack.glowColor} transition-all duration-300 cursor-pointer flex flex-col justify-between group hover:scale-[1.03] relative overflow-hidden shadow-2xl`}
 >
 <div className="flex items-center justify-between mb-3 z-10">
 <span className="px-3 py-1 rounded-full bg-black/70 border border-white/20 text-[11px] font-black text-white tracking-wide shadow-md flex items-center gap-1.5">
 <span>{pack.icon}</span>
 <span>{pack.badge}</span>
 </span>
 <span className="px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-black text-xs shadow-lg font-mono">
 ${pack.price.toFixed(2)}
 </span>
 </div>

 <div className="my-2 flex items-center gap-3.5 z-10">
 {pack.packArt && (
 <div className="w-11 h-16 sm:w-12 sm:h-18 shrink-0 rounded-xl overflow-hidden border border-white/25 shadow-[0_4px_12px_rgba(0,0,0,0.5)] bg-black/40 flex items-center justify-center p-0.5 group-hover:scale-105 group-hover:border-amber-400/50 transition-all duration-300">
 <img
 src={pack.packArt}
 alt={pack.name}
 className="w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]"
 onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
 />
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h3 className="text-base font-black text-white group-hover:text-amber-300 transition-colors drop-shadow-md leading-snug">
 {pack.name}
 </h3>
 <p className="text-xs text-gray-300/90 mt-1 line-clamp-2 leading-relaxed">
 {pack.description}
 </p>
 </div>
 </div>

 <div className="mt-4 pt-3 border-t border-white/10 z-10">
 <div className="text-[10px] font-bold text-gray-300 uppercase tracking-wider mb-2 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <span>Possible Sets</span>
 <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-extrabold normal-case">
 {pack.id.includes('bronze') || pack.id.includes('starter') ? '100% Tier 1' : '60% Tier / 40% Lower (Pity Protected)'}
 </span>
 </span>
 <span className="text-amber-400 font-extrabold">{pack.setIds.length} Sets</span>
 </div>
 <div className="flex flex-wrap gap-1">
 {pack.highlightSets.slice(0, 4).map((setName, idx) => (
 <span key={idx} className="px-2 py-0.5 rounded-md bg-white/10 border border-white/15 text-[10px] text-gray-200 font-semibold truncate max-w-[120px]">
 {setName}
 </span>
 ))}
 {pack.highlightSets.length > 4 && (
 <span className="px-2 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold">
 +{pack.highlightSets.length - 4} more
 </span>
 )}
 </div>
 </div>

 <div className="mt-4 flex items-center gap-2 z-10">
 <button
 onClick={(e) => {
 e.stopPropagation();
 sound.playButtonClick();
 const result = rollMysteryPackResult(pack);
 if (activeTab === 'multiplayerArena' && matchId) {
 try {
 void updateMatchPack(matchId, result.setId);
 setIsSetSelectorOpen(false);
 } catch (err) {
 console.error("Failed to update match set", err);
 }
 } else {
 setIsSetSelectorOpen(false);
 void loadSetAndGeneratePack(result.setId, pack.language, pack, result);
 }
 }}
 className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
 >
 <Zap className="w-3.5 h-3.5 text-yellow-200" />
 <span>Select</span>
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 sound.playCardCollect();
 addOwnedMysteryPacks(pack.id, 1);
 setIsSetSelectorOpen(false);
 setIsInventoryOpen(true);
 }}
 className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-gray-200 hover:text-white font-extrabold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
 title="Save to Pack Vault"
 >
 <Box className="w-3.5 h-3.5 text-purple-300" />
 <span>Vault </span>
 </button>
 </div>

 <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/5 blur-2xl group-hover:bg-amber-400/20 transition-all pointer-events-none" />
 </div>
 ))}
 </div>
 ) : isLoadingSeries ? (
 <div className="flex flex-col items-center justify-center py-20">
 <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
 <span className="text-sm text-gray-400">Loading series sets...</span>
 </div>
 ) : (() => {
 const eligibleSets = currentSeriesData?.sets?.filter(s => {
 const nameLow = (s.name || '').toLowerCase();
 const idLow = (s.id || '').toLowerCase();
 // Remove base Shining Fates and Hidden Fates, keeping only their Shiny Vault upgraded versions
 if (idLow === 'swsh4.5' || idLow === 'swsh4pt5' || (nameLow === 'shining fates' && idLow !== 'swsh4.5sv' && idLow !== 'swsh4pt5sv')) return false;
 if (idLow === 'sm115' || idLow === 'sm11.5' || idLow === 'sm11pt5' || (nameLow === 'hidden fates' && idLow !== 'sma' && idLow !== 'sm115sv')) return false;
 if (nameLow.includes('promo')) return false;
 if (nameLow.includes('trainer gallery') || nameLow.includes('galarian gallery')) return false;
 if (nameLow.includes('my first battle') || nameLow.includes('scarlet & violet energy') || nameLow === 'energy' || ((selectedSeriesId.includes('sv') || selectedSeriesId === 'me') && nameLow.includes('energy'))) return false;
 if (selectedSeriesId.toLowerCase().includes('sv') && (nameLow.includes('starter set') || nameLow.includes('deck build box') || nameLow.includes('starter deck') || nameLow.includes('build & battle') || idLow.startsWith('svk') || idLow.startsWith('svls') || idLow.startsWith('svln'))) return false;
 return (s.cardCount?.official || s.cardCount?.total || 0) >= 15;
 }) || [];
 return eligibleSets.length > 0 ? (
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
 {eligibleSets.map(set => {
 const logoSrc = getSetLogoUrl(set, setLogosManifest, selectedLanguage);
 return (
 <div
 key={set.id}
 onClick={async () => {
 sound.playButtonClick();
 if (activeTab === 'multiplayerArena' && matchId) {
 try {
 await updateMatchPack(matchId, set.id);
 setIsSetSelectorOpen(false);
 } catch (err) {
 console.error("Failed to update match set", err);
 }
 } else {
 setPurchaseTargetSet(set);
 }
 }}
 className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer flex flex-col items-center justify-between text-center group ${currentSet?.id === set.id
 ? 'bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-600/20 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.35)] scale-[1.02]'
 : 'bg-[#181822]/90 border-white/15 hover:bg-[#222230] hover:border-white/30 hover:scale-[1.02] shadow-[0_4px_15px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.1)]'
 }`}
 >
 <div className="h-14 flex items-center justify-center mb-3 w-full px-2">
 {logoSrc ? (
 <img
 src={logoSrc}
 alt={set.name}
 loading="lazy"
 className="max-h-12 max-w-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] transition-transform duration-300 group-hover:scale-110"
 onError={(e) => {
 const img = e.target as HTMLImageElement;
 const fallback = `/setLogos/${set.id.replace(/[^a-z0-9.-]/gi, '_')}.png`;
 if (img.src !== window.location.origin + fallback && img.src !== fallback && !img.src.includes('pokemontcg.io')) {
 img.src = fallback;
 } else if (set.logo && !img.src.includes(set.logo)) {
 const logoUrl = set.logo.endsWith('.png') || set.logo.endsWith('.webp') || set.logo.endsWith('.jpg') ? set.logo : `${set.logo}.png`;
 if (img.src !== logoUrl) {
 img.src = logoUrl;
 } else {
 img.style.display = 'none';
 }
 } else {
 img.style.display = 'none';
 }
 }}
 />
 ) : (
 <div className="text-gray-500/80 font-black tracking-widest text-xl uppercase drop-shadow-md">
 {set.id}
 </div>
 )}
 </div>
 <div className="w-full flex flex-col items-center">
 <h4 className="font-bold text-white text-sm truncate w-full px-1 group-hover:text-amber-300 transition-colors" title={set.name}>
 {set.name}
 </h4>
 <div className="flex items-center justify-center gap-1.5 mt-1">
 <span className="text-[10px] text-gray-400 font-semibold">
 {set.cardCount?.official || set.cardCount?.total || '???'} Cards
 </span>
 <span className="text-[10px] text-gray-600">•</span>
 <span className="text-[10px] font-mono font-bold text-amber-300/90 whitespace-nowrap">
 ${getSetBoosterPrice(set).toFixed(2)}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="text-center py-12 text-gray-400 text-sm">
 No eligible sets found for this series.
 </div>
 );
 })()}
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Market Price Inspection Modal */}
 <AnimatePresence>
 {inspectedCard && (
 <CardMarketModal
 card={inspectedCard}
 onClose={() => setInspectedCard(null)}
 initialViewMode={inspectedViewMode}
 onOpenTradeModal={(targetCard) => {
 setTradeTarget(targetCard);
 // inspectedCard is cleared by handleBuyFromVendorAction's delayed onClose()
 // so we don't clear it here to avoid a flash of blank background.
 }}
 onUpdatePrice={(newPrice, newPoke) => {
 if (inspectedCard?.isVendorCatalog || inspectedCard?.pokemon?.isVendorCatalog) return;
 setInspectedCard(prev => prev ? { ...prev, value: newPrice, pokemon: newPoke } : null);
 }}
 onBuyFromVendor={(cardToBuy, buyPrice) => {
 // 1. Subtract that from their net income section on main page by increasing total spent
 // (Net Return / Net Profit pod = sessionTotal - sessionSpent)
 setSessionSpent(prev => Number((prev + buyPrice).toFixed(2)));

 // 2. Transfer that card to the user's binder
 const setName = (cardToBuy.pokemon as any)?.set?.name || cardToBuy.pokemon?.name?.split('(')[1]?.replace(')', '').trim() || 'Vendor Acquisition';
 const realMarketPrice = (cardToBuy as any).marketPrice ?? (cardToBuy.pokemon as any)?.marketPrice ?? (cardToBuy.pokemon as any)?.value ?? (cardToBuy.value !== buyPrice ? cardToBuy.value : undefined) ?? buyPrice;
 saveCollectedCard({
 ...cardToBuy,
 marketPrice: realMarketPrice,
 value: realMarketPrice,
 acquiredPrice: buyPrice,
 originalValue: buyPrice,
 isVendorCatalog: false,
 pokemon: {
 ...cardToBuy.pokemon,
 marketPrice: realMarketPrice,
 value: realMarketPrice,
 isVendorCatalog: false
 }
 }, setName, 'my-collection');

 setAvailableBinders(getBinders());
 window.dispatchEvent(new Event('storage'));
 trackMissionProgress('buy_vendor', 1);
 setInspectedCard(null);
 }}
 onAddToBinder={activeTab === 'pack' ? (c) => {
 if (binderAddedIds.has(c.id as number)) return;
 setAvailableBinders(getBinders());
 setBinderSelectModal({ cards: [c], setName: currentSet?.name || 'Unknown Set' });
 } : undefined}
 onMoveToBinder={activeTab === 'binder' ? (c) => {
 setAvailableBinders(getBinders());
 setBinderSelectModal({ cards: [c], setName: currentSet?.name || 'Unknown Set', isMove: true });
 } : undefined}
 isAddedToBinder={inspectedCard ? binderAddedIds.has(inspectedCard.id as number) : false}
 />
 )}
 </AnimatePresence>

 {/* Vendor "Buy · Trade or Cash" Modal */}
 <TradeModal
 target={tradeTarget}
 vendorName={tradeTarget?.vendorName}
 onClose={() => { setTradeTarget(null); setInspectedCard(null); }}
 onAddNetReturn={(amt) => setSessionTotal((s) => Number((s + amt).toFixed(2)))}
 />

 {/* Price Gate Modal for packs over the $20 daily allowance */}
 <AnimatePresence>
 {showPriceGateModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setShowPriceGateModal(false)}
 className="fixed inset-0 z-[300] bg-black/80 flex items-center justify-center p-4"
 >
 <motion.div
 initial={{ scale: 0.9, y: 20 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.9, y: 20 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1c2e] via-[#141422] to-[#0e0e18] border border-amber-500/50 shadow-[0_0_50px_rgba(245,158,11,0.3)] p-6 text-center relative overflow-hidden"
 >
 <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

 <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 border-2 border-white flex items-center justify-center text-white mx-auto mb-4 shadow-[0_0_25px_rgba(245,158,11,0.6)] animate-pulse">
 <Coins className="w-8 h-8" />
 </div>

 <h2 className="text-2xl font-black text-white tracking-tight mb-3">
 Pack exceeds $20 allowance
 </h2>
 <p className="text-sm text-gray-300 font-medium mb-3 leading-relaxed">
 This pack is not covered by the daily allowance as its price is more than 20 dollars
 </p>
 <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
 Pay ${priceGateCost.toFixed(2)} to open
 </p>

 <div className="flex flex-col sm:flex-row gap-3">
 <button
 onClick={() => setShowPriceGateModal(false)}
 className="flex-1 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-gray-300 font-bold text-xs uppercase transition-all cursor-pointer"
 >
 Close
 </button>
 <button
 onClick={confirmPayPack}
 className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer"
 >
 Pay ${priceGateCost.toFixed(2)} to open
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* Select Destination Binder Modal */}
 <AnimatePresence>
 {binderSelectModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 onClick={() => setBinderSelectModal(null)}
 className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80"
 >
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 onClick={(e) => e.stopPropagation()}
 className="w-full max-w-md rounded-2xl bg-gradient-to-b from-[#161922] to-[#0e1017] border border-white/15 p-6 shadow-[0_20px_70px_rgba(0,0,0,0.9)] flex flex-col max-h-[85vh]"
 >
 <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
 <BookOpen className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-base font-extrabold text-white">Select Destination Binder</h3>
 <p className="text-xs text-gray-400 mt-0.5">
 {binderSelectModal.isMove ? 'Moving' : 'Adding'} {binderSelectModal.cards.length} card{binderSelectModal.cards.length > 1 ? 's' : ''} {binderSelectModal.isMove ? 'to binder' : 'to collection'}
 </p>
 </div>
 </div>
 <button
 onClick={() => setBinderSelectModal(null)}
 className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-400 hover:text-white transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="overflow-y-auto pr-1 space-y-2.5 max-h-[50vh] mb-4">
 {availableBinders.map((b) => (
 <button
 key={b.id}
 onClick={() => {
 if (binderSelectModal.isMove) {
 binderSelectModal.cards.forEach(c => moveCardToBinder(c.id.toString(), b.id));
 setBinderSelectModal(null);
 return;
 }

 // For newly pulled cards, queue the sleeve animation
 setSleeveQueue({
 cards: binderSelectModal.cards,
 setName: binderSelectModal.setName,
 binderId: b.id,
 });
 setBinderSelectModal(null);
 }}
 className="w-full p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/50 flex items-center justify-between transition-all cursor-pointer group text-left shadow-sm hover:shadow-[0_0_20px_rgba(245,158,11,0.15)]"
 >
 <div className="flex items-center gap-3 overflow-hidden">
 <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 font-bold group-hover:scale-105 transition-transform flex-shrink-0">
 
 </div>
 <div className="truncate">
 <div className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors truncate">
 {b.name}
 </div>
 <div className="text-[11px] text-gray-400">
 {b.count || 0} cards · <span className="text-emerald-400 font-semibold">${(b.value || 0).toFixed(2)}</span>
 </div>
 </div>
 </div>
 <span className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
 Select →
 </span>
 </button>
 ))}
 </div>

 <button
 onClick={() => {
 const name = window.prompt("Enter a name for your new binder:", "New Custom Binder");
 if (!name || !name.trim()) return;
 const newId = `binder-${Date.now()}`;
 const newBinder: Binder = {
 id: newId,
 name: name.trim(),
 count: 0,
 value: 0,
 isCustom: true,
 };
 const updated = [...availableBinders, newBinder];
 saveBinders(updated);
 if (binderSelectModal.isMove) {
 binderSelectModal.cards.forEach(c => moveCardToBinder(c.id.toString(), newId));
 setBinderSelectModal(null);
 } else {
 // Queue sleeve animation for the new binder
 setSleeveQueue({
 cards: binderSelectModal.cards,
 setName: binderSelectModal.setName,
 binderId: newId,
 });
 setBinderSelectModal(null);
 }
 }}
 className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-white font-extrabold text-xs tracking-wide uppercase shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
 >
 <span> Create New Binder & {binderSelectModal.isMove ? 'Move' : 'Add'} Here</span>
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── Sleeve Animation Overlay ── */}
 <AnimatePresence>
 {sleeveQueue && (() => {
 // Use first card's image/name for the visual; all cards get sleeved
 const firstCard = sleeveQueue.cards[0];
 const imgUrl = firstCard?.pokemon?.images?.large || firstCard?.pokemon?.images?.small || '';
 const cardName = firstCard?.pokemon?.name || 'Card';
 return (
 <SleeveAnimation
 key="sleeve-anim"
 cardImageUrl={imgUrl}
 cardName={cardName}
 cardCount={sleeveQueue.cards.length}
 onComplete={() => {
 // Now actually persist the cards
 const { cards: qCards, setName: qSet, binderId } = sleeveQueue;
 sound.playCardCollect(qCards.reduce((sum, c) => sum + c.value, 0));
 const savedCards = qCards.map((c) => saveCollectedCard(c, qSet, binderId));
 setBinderAddedIds((prev) => {
 const next = new Set(prev);
 qCards.forEach((c) => next.add(c.id));
 return next;
 });
 setSleeveQueue(null);

 // Check if any sleeved cards are worth more than 5 dollars (> 5) for slabbing prompt
 const valuableHits = savedCards.filter(c => c && (c.currentPrice || 0) > 5);
 if (valuableHits.length > 0) {
 setTimeout(() => setSlabPromptQueue({ savedCards: valuableHits }), 150);
 }
 }}
 onCancel={() => setSleeveQueue(null)}
 />
 );
 })()}
 </AnimatePresence>

 {/* ── Valuable Card Slabbing Prompt ($5.00+) ── */}
 <AnimatePresence>
 {slabPromptQueue && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-[320] flex items-center justify-center p-4 bg-black/85"
 >
 <motion.div
 initial={{ scale: 0.9, opacity: 0, y: 20 }}
 animate={{ scale: 1, opacity: 1, y: 0 }}
 exit={{ scale: 0.9, opacity: 0, y: 20 }}
 className="w-full max-w-md rounded-3xl bg-gradient-to-b from-[#1c1c28] via-[#14141c] to-[#0e0e14] border border-amber-400/40 p-6 shadow-[0_20px_80px_rgba(245,158,11,0.35)] flex flex-col items-center text-center"
 >
 <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 border border-amber-400/50 flex items-center justify-center text-2xl mb-4 shadow-[0_0_20px_rgba(245,158,11,0.4)]">
 
 </div>
 <h3 className="text-xl font-black text-amber-300 mb-1.5">
 High-Value Hit Sleeved!
 </h3>
 <p className="text-xs text-gray-300 mb-4 font-medium leading-relaxed">
 You just sleeved <span className="text-white font-bold">{slabPromptQueue.savedCards.map(c => c.name).join(', ')}</span> valued over <span className="text-emerald-400 font-bold">$5.00</span>! Would you like to permanently encase {slabPromptQueue.savedCards.length > 1 ? 'the first valuable hit' : 'it'} in a custom <span className="text-amber-300 font-bold">Protective Acrylic Slab (Grade: N/A)</span>?
 </p>

 <div className="flex flex-col gap-3 w-full mt-3">
 <button
 onClick={() => {
 const hit = slabPromptQueue.savedCards[0];
 setSlabPromptQueue(null);
 setSlabQueue({ card: hit });
 }}
 className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 border border-amber-200 shadow-[0_6px_25px_rgba(245,158,11,0.6)] transition-all cursor-pointer hover:scale-[1.02]"
 >
 <span></span> ENCASE IN ACRYLIC SLAB (GRADE: N/A)
 </button>
 <button
 onClick={() => setSlabPromptQueue(null)}
 className="w-full py-3.5 rounded-2xl bg-[#0a0a0f] hover:bg-[#14141c] border border-white/15 hover:border-white/30 text-gray-300 hover:text-white font-bold text-xs transition-all cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
 >
 No Thanks, Keep in Sleeve
 </button>
 </div>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── Slab Animation Overlay ── */}
 <AnimatePresence>
 {slabQueue && (
 <SlabAnimation
 key="slab-anim"
 cardImageUrl={slabQueue.card.imageUrl}
 cardName={slabQueue.card.name}
 cardValue={slabQueue.card.currentPrice}
 onComplete={() => {
 updateCardSlabStatus(slabQueue.card.id, 'N/A');
 sound.playCardCollect(slabQueue.card.currentPrice * 1.5);
 setSlabQueue(null);
 }}
 onCancel={() => setSlabQueue(null)}
 />
 )}
 </AnimatePresence>

 {/* ── Set Chase Cards Modal ── */}
 <ChaseCardsModal
 isOpen={showChaseModal}
 onClose={() => setShowChaseModal(false)}
 currentSet={currentMysteryPack ? { id: currentMysteryPack.id, name: currentMysteryPack.name } : currentSet}
 chaseCardsForActiveSet={effectiveChaseCards}
 isChaseCardsReady={isChaseCardsReady}
 onSelectChaseCard={(card, value, idx) => {
 setShowChaseModal(false);
 setInspectedCard({
 id: Date.now() + idx,
 originalIndex: idx,
 flipped: false,
 collected: false,
 value,
 pokemon: card
 });
 }}
 />

 {/* Out of Pack Passes Modal */}
 <OutofPassesModal
 isOpen={showOutofPassesModal}
 onClose={() => setShowOutofPassesModal(false)}
 onGoToMissions={() => {
 setShowOutofPassesModal(false);
 setActiveTab('missions');
 }}
 />

 {/* Insufficient Cash Fund Modal */}
 <InsufficientCashModal
 isOpen={showInsufficientCashModal}
 onClose={() => setShowInsufficientCashModal(false)}
 />

 <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
 <BulkCatalogueModal isOpen={isBulkModalOpen} onClose={() => setIsBulkModalOpen(false)} />
 <InventoryModal
 isOpen={isInventoryOpen}
 onClose={() => setIsInventoryOpen(false)}
 onOpenEarnedBoosterPack={(setId, language) => {
 setActiveTab('pack');
 loadSetAndGeneratePack(setId, language);
 }}
 onOpenMysteryPack={async (pack) => {
 setActiveTab('pack');
 const result = rollMysteryPackResult(pack);
 await loadSetAndGeneratePack(result.setId, pack.language, pack, result);
 }}
 onNavigateToMissions={() => {
 setActiveTab('missions');
 }}
 />
 <LuckyDropModal
 isOpen={isLuckyDropModalOpen}
 pack={claimedLuckyPack}
 onClose={() => setIsLuckyDropModalOpen(false)}
 onOpenNow={handleLuckyDropOpenNow}
 onAddToInventory={handleLuckyDropAddToInventory}
 />

 <SetPurchaseOptionsModal
 isOpen={!!purchaseTargetSet}
 onClose={() => setPurchaseTargetSet(null)}
 set={purchaseTargetSet}
 packArtUrl={purchaseTargetSet ? (getPackArtsForSet(purchaseTargetSet.id, purchaseTargetSet.name, packArtsManifest)[0] || null) : null}
 logoUrl={purchaseTargetSet ? (getSetLogoUrl(purchaseTargetSet, setLogosManifest, selectedLanguage) || null) : null}
 language={selectedLanguage}
 basePackPrice={setPackPrices[purchaseTargetSet?.id || ''] || 5.00}
 onSelectOption={(option, action) => {
 if (!purchaseTargetSet) return;
 const setId = purchaseTargetSet.id;
 const targetSetCopy = purchaseTargetSet;
 setPurchaseTargetSet(null);
 setIsSetSelectorOpen(false);

 if (option === 'single') {
 if (action === 'vault') {
 sound.playCardCollect();
 addEarnedSetPacks([{
 setId: setId,
 setName: targetSetCopy.name,
 language: selectedLanguage,
 count: 1
 }]);
 setEarnedSetPacks(getEarnedSetPacks());
 setIsInventoryOpen(true);
 } else {
 void loadSetAndGeneratePack(setId, selectedLanguage);
 }
 } else {
 // Half Box or Full Box: Trigger Cinematic 3D Booster Box Unboxing Ceremony!
 setUnboxingBoxTarget({
 set: targetSetCopy,
 boxType: option,
 action
 });
 }
 }}
 />

 {/* Cinematic 3D Booster Box Unboxing Experience Modal */}
 <BoosterBoxUnboxingModal
 isOpen={!!unboxingBoxTarget}
 onClose={() => setUnboxingBoxTarget(null)}
 set={unboxingBoxTarget?.set || null}
 boxType={unboxingBoxTarget?.boxType || 'fullBox'}
 packArtUrl={unboxingBoxTarget?.set ? (getPackArtsForSet(unboxingBoxTarget.set.id, unboxingBoxTarget.set.name, packArtsManifest)[0] || null) : null}
 logoUrl={unboxingBoxTarget?.set ? (getSetLogoUrl(unboxingBoxTarget.set, setLogosManifest, selectedLanguage) || null) : null}
 language={selectedLanguage}
 onStartRipping={() => {
 if (!unboxingBoxTarget) return;
 const { set: targetSet, boxType } = unboxingBoxTarget;
 const isJa = selectedLanguage === 'ja' || targetSet.id.endsWith('_ja');
 const packCount = boxType === 'halfBox' ? (isJa ? 15 : 18) : (isJa ? 30 : 36);

 // Save remaining packs to vault
 if (packCount > 1) {
 addEarnedSetPacks([{
 setId: targetSet.id,
 setName: targetSet.name,
 language: selectedLanguage,
 count: packCount - 1
 }]);
 setEarnedSetPacks(getEarnedSetPacks());
 }

 setUnboxingBoxTarget(null);
 void loadSetAndGeneratePack(targetSet.id, selectedLanguage);
 }}
 onSaveToVault={() => {
 if (!unboxingBoxTarget) return;
 const { set: targetSet, boxType } = unboxingBoxTarget;
 const isJa = selectedLanguage === 'ja' || targetSet.id.endsWith('_ja');
 const packCount = boxType === 'halfBox' ? (isJa ? 15 : 18) : (isJa ? 30 : 36);

 sound.playCardCollect();
 addEarnedSetPacks([{
 setId: targetSet.id,
 setName: targetSet.name,
 language: selectedLanguage,
 count: packCount
 }]);
 setEarnedSetPacks(getEarnedSetPacks());
 setUnboxingBoxTarget(null);
 setIsInventoryOpen(true);
 }}
 />

 {/* Aggressive hidden DOM preloader for pack arts to guarantee instant cache hits */}
 <div style={{ display: 'none' }} aria-hidden="true">
 {currentPackArts.map(src => (
 <img key={`preload-${src}`} src={src} fetchPriority="high" decoding="sync" />
 ))}
 </div>
 </div>
 );
}
