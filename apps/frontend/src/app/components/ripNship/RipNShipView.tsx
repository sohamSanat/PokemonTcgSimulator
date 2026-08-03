import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
 Video, Users, Flame, DollarSign, Package, Send, 
 Sparkles, ArrowLeft, MessageSquare, ShoppingCart, Award, CheckCircle2,
 Heart, Zap, Gift, Eye, EyeOff, ChevronUp, ChevronDown, Layers, RotateCw, Loader2,
 X, Plus, FileText, Clock, Filter, CheckCircle, BookOpen, MessageSquareOff,
 Truck, MapPin, ShieldCheck
} from 'lucide-react';
import { sound } from '../../services/sound';
import { addCash, getCollectedCards, saveCollectedCard, getStorageKey, syncToFirestore, type Card } from '../binder/types';
import { generateStreamViewerReply, getRandomStreamMessage, generateMultiViewerCardReaction, type StreamChatViewer } from '../../services/geminiStreamChat';


import { fetchSetDetails, generatePackFromSet, getCardImageUrl, handleCardImageError, type PokemonCard, cardFullCache, type TCGDexSetSummary, type TCGDexSet, type EnergyEra, ENERGY_POOLS_BY_ERA, fetchCardFull, orchestrateSetLoading, getRealCardPrice, onCardFullCacheUpdated } from '../../services/tcgdex';
import { CardMarketModal } from '../CardMarketModal';
import BoosterPackTear from '../BoosterPackTear';
import { PackLoadingCurtain } from '../PackLoadingCurtain';
import { preloadPackAssets } from '../../services/imagePreloader';
import InteractiveCard3D from '../binder/InteractiveCard3D';
import setPackPricesData from '../../data/set_pack_prices.json';
import { getJapaneseCardRealPrice, fetchSingleJapaneseSet, generateJapanesePackFromSet } from '../../services/scrydex';
import { FALLBACK_POKEMON_CARDS, toTitleCase, generateFallbackPack } from '../../data/fallbackCards';

const setPackPrices: Record<string, number> = setPackPricesData as Record<string, number>;

interface CardData {
 id: number | string;
 originalIndex: number;
 flipped: boolean;
 collected: boolean;
 value: number;
 pokemon: PokemonCard;
 isMostExpensive?: boolean;
 isVendorCatalog?: boolean;
 vendorName?: string;
 vendorBooth?: string;
 vendorRating?: string;
}









const isActualHit = (card: CardData): boolean => {
 if (!card || !card.pokemon) return false;
 const val = card.value || 0;
 const nameLower = (card.pokemon.name || '').toLowerCase();
 const idLower = (card.pokemon.id || '').toLowerCase();
 if (nameLower.includes('energy') || idLower.includes('energy')) return false;

 const rarity = (card.pokemon.rarity || '').toLowerCase();
 const isHitCategory = 
 rarity.includes('special illustration') || 
 rarity.includes('illustration rare') || 
 rarity.includes('secret') || 
 rarity.includes('gold') || 
 rarity.includes('hyper') || 
 rarity.includes('rainbow') || 
 rarity.includes('full art') || 
 rarity.includes('double rare') || 
 rarity.includes('ultra rare') || 
 rarity.includes('ex') || 
 rarity.includes('vmax') || 
 rarity.includes('vstar') || 
 rarity.includes(' v') || 
 rarity.includes('gx') || 
 rarity.includes('shiny vault') || 
 rarity.includes('trainer gallery') ||
 rarity.includes('character rare');

 return isHitCategory || val >= 4.50;
};

const ensureMostExpensiveLast = (cards: CardData[]): CardData[] => {
 if (cards.length === 0) return cards;
 cards.forEach(c => { c.isMostExpensive = false; });
 let maxIdx = 0;
 let maxVal = getRealCardPrice(cards[0].pokemon) || cards[0].value || 0;
 for (let i = 1; i < cards.length; i++) {
 const val = getRealCardPrice(cards[i].pokemon) || cards[i].value || 0;
 if (val >= maxVal) {
 maxVal = val;
 maxIdx = i;
 }
 }
 if (maxIdx !== cards.length - 1) {
 const [mostExpensive] = cards.splice(maxIdx, 1);
 cards.push(mostExpensive);
 }
 
 // ONLY mark as Most Expensive Hit IF the top card is a genuine high-tier hit!
 if (isActualHit(cards[cards.length - 1])) {
 cards[cards.length - 1].isMostExpensive = true;
 }
 return cards;
};

const reorderCardsWithMostExpensiveLast = (cards: CardData[]): CardData[] => {
 if (cards.length === 0) return cards;
 if (cards.some(c => c.flipped || c.collected)) {
 cards.forEach(c => { c.isMostExpensive = false; });
 let maxIdx = 0;
 let maxVal = cards[0].value;
 for (let i = 1; i < cards.length; i++) {
 if (cards[i].value >= maxVal) {
 maxVal = cards[i].value;
 maxIdx = i;
 }
 }
 if (isActualHit(cards[maxIdx])) {
 cards[maxIdx].isMostExpensive = true;
 }
 return cards;
 }
 const unreversed = [...cards].reverse();
 ensureMostExpensiveLast(unreversed);
 const reReversed = unreversed.reverse();
 return reReversed.map((c, idx) => ({ ...c, originalIndex: idx }));
};


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
 border: card.isMostExpensive ? '3px solid rgba(6, 182, 212, 0.9)' : '2px solid rgba(255, 255, 250, 0.4)'
 }}
 >
 {/* Ultra-Clear Penny Sleeve Layer for Top Hit */}
 {card.isMostExpensive && (
 <div className="absolute inset-0 rounded-xl pointer-events-none z-30 overflow-hidden bg-gradient-to-tr from-cyan-500/15 via-transparent to-blue-400/25 border-2 border-cyan-300/50 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
 <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 via-teal-600 to-blue-600 text-white font-black text-[9px] uppercase tracking-wider shadow-lg border border-cyan-200/60 flex items-center gap-1 animate-pulse">
 <ShieldCheck className="w-3.5 h-3.5 text-cyan-200" />
 <span>Sleeved Hit (${cardLiveValue.toFixed(2)})</span>
 </div>
 </div>
 )}

 {/* Fallback for cards without images */}
 <div className="absolute inset-0 bg-gradient-to-br from-[#222230] to-[#12121a] flex flex-col items-center justify-center p-4 text-center border-[8px] border-[#333344] rounded-2xl z-0">
 <h3 className="font-bold text-white text-lg px-2 drop-shadow-md">{card.pokemon.name}</h3>
 </div>

 <img
 src={card.pokemon.images?.large || card.pokemon.images?.small || ((card.pokemon as any).image ? getCardImageUrl((card.pokemon as any).image, 'high') : `https://images.scrydex.com/pokemon/${(card.pokemon.id || 'swsh3-1').toLowerCase()}/large`)}
 alt={card.pokemon.name}
 loading="eager"
 // @ts-ignore
 fetchpriority="high"
 className="absolute inset-0 w-full h-full object-cover block rounded-2xl z-10"
 onError={(e) => {
 const nameLower = (card.pokemon.name || '').toLowerCase();
 const idLower = (card.pokemon.id || '').toLowerCase();
 if (nameLower.includes('energy') || idLower.includes('energy')) {
 (e.target as HTMLImageElement).src = '/packArts/ScarletAndViolet-Generation/SV-EnergyCards/1.webp';
 return;
 }
 const num = card.pokemon.localId || card.pokemon.id?.split('-')[1] || '1';
 const setId = card.pokemon.id?.split('-')[0] || 'swsh3';
 handleCardImageError(e.target as HTMLImageElement, setId, num);
 }}
 />

 <div
 className="absolute bottom-6 left-0 right-0 flex justify-center transition-all duration-300 pointer-events-none z-30"
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
 const displayPrice = getRealCardPrice(card.pokemon) || card.value || 0;
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
 className={`w-full h-full shadow-[0_10px_25px_rgba(0,0,0,0.8)] border rounded-2xl group-hover:shadow-[0_0_25px_rgba(245,158,11,0.5)] ${
 card.isMostExpensive ? 'border-cyan-400 ring-2 ring-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'border-white/20 group-hover:border-amber-400/60'
 }`}
 >
 {/* Price badge right above/on top of card art */}
 <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/60 text-emerald-300 font-black text-xs shadow-lg z-20 flex items-center gap-0.5">
 <span>${displayPrice.toFixed(2)}</span>
 </div>

 {card.isMostExpensive ? (
 <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 border border-cyan-200/80 text-[9px] font-black text-white shadow-lg z-20 flex items-center gap-1 animate-pulse">
 <ShieldCheck className="w-3 h-3 text-cyan-200" />
 <span>Sleeved Hit</span>
 </div>
 ) : (
 <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-bold text-amber-300 opacity-0 group-hover:opacity-100 transition-opacity z-20">
 Market Data
 </div>
 )}
 </InteractiveCard3D>
 </div>

 <div className="mt-3 w-full px-2.5 py-2 rounded-xl bg-[#141620]/95 border border-white/10 flex flex-col items-center text-center transition-all group-hover:bg-[#1c1e2b]/95 group-hover:border-white/20 shadow-lg">
 <span className="font-bold text-white text-xs truncate w-full">{card.pokemon.name}</span>
 <div className="flex items-center gap-1.5 mt-1">
 <span className="text-emerald-400 font-extrabold text-xs tracking-wide shadow-sm">${displayPrice.toFixed(2)}</span>
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


interface RipNShipViewProps {
 onBackToPacks: () => void;
}

interface CustomerOrder {
 id: string;
 username: string;
 location: string;
 address?: string;
 avatarColor: string;
 packName: string;
 setId: string; // The official TCGDex/Scrydex set ID
 packCount: number;
 openedPacks?: number;
 totalPaid: number;
 status: 'pending' | 'ripping' | 'completed';
 pulledCards?: { name: string; value: number; image: string; rarity: string }[];
 totalPulledValue?: number;
 allPulledCardsCount?: number;
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

const REALISTIC_CUSTOMER_ADDRESSES = [
 { address: '100 Universal City Plaza, Apt 402, Universal City, CA 91608, USA ', location: 'Los Angeles, California ' },
 { address: '350 5th Ave, Floor 32, New York, NY 10118, USA ', location: 'New York City, New York ' },
 { address: '221B Baker Street, Flat 3, Marylebone, London NW1 6XE, UK ', location: 'London, United Kingdom ' },
 { address: '88 Bay Street, Suite 1400, Toronto, ON M5J 2R8, Canada ', location: 'Toronto, Canada ' },
 { address: '456 Shibuya Crossing Ave, Apt 12B, Shibuya-ku, Tokyo 150-0042, Japan ', location: 'Tokyo, Japan ' },
 { address: '14 Opera House Blvd, Circular Quay, Sydney NSW 2000, Australia ', location: 'Sydney, Australia ' },
 { address: '1200 Congress Ave, Suite 800, Austin, TX 78701, USA ', location: 'Austin, Texas ' },
 { address: '405 Ocean Drive, Penthouse B, Miami Beach, FL 33139, USA ', location: 'Miami, Florida ' },
 { address: '233 S Wacker Dr, Unit 540, Chicago, IL 60606, USA ', location: 'Chicago, Illinois ' },
 { address: '1912 Pike Place, Apt 2A, Seattle, WA 98101, USA ', location: 'Seattle, Washington ' },
 { address: '75 Champs-Élysées, 4th Floor, 75008 Paris, France ', location: 'Paris, France ' },
 { address: 'Friedrichstraße 45, 10117 Berlin, Germany ', location: 'Berlin, Germany ' },
 { address: 'Gran Vía 28, 3rd West, 28013 Madrid, Spain ', location: 'Madrid, Spain ' },
 { address: 'Keizersgracht 482, 1017 EG Amsterdam, Netherlands ', location: 'Amsterdam, Netherlands ' },
 { address: 'Gangnam-daero 390, Suite 1102, Seoul 06232, South Korea ', location: 'Seoul, South Korea ' },
];

const SAMPLE_LOCATIONS = REALISTIC_CUSTOMER_ADDRESSES.map(a => a.location);

export default function RipNShipView({ onBackToPacks }: RipNShipViewProps) {
 const [inspectedCard, setInspectedCard] = useState<CardData | null>(null);
 const [collectedCardIds, setCollectedCardIds] = useState<Set<string>>(() => {
 try {
 const cards = getCollectedCards();
 const ids = new Set<string>();
 cards.forEach(c => {
 ids.add(c.id);
 const parts = c.id.split('-');
 if (parts.length >= 2) {
 ids.add(`${parts[0]}-${parts[1]}`);
 }
 });
 return ids;
 } catch {
 return new Set();
 }
 });

 const handleAddToBinder = (cardData: CardData) => {
 sound.playCardCollect();
 const cardIdStr = String(cardData.pokemon.id || cardData.id);
 if (!collectedCardIds.has(cardIdStr)) {
 saveCollectedCard(cardData, 'Rip & Ship Pack');
 setCollectedCardIds(prev => new Set([...prev, cardIdStr]));
 }
 };

 useEffect(() => {
 const handleCacheUpdate = () => {
 setCards(prevCards => {
 let changed = false;
 const updated = prevCards.map(c => {
 const cached = cardFullCache.get(c.pokemon.id);
 if (cached) {
 const currentImageIsScrydex = c.pokemon.images?.large?.includes('scrydex.com') || c.pokemon.images?.small?.includes('scrydex.com');
 const cachedImageIsScrydex = cached.image?.includes('scrydex.com');
 const useImageFromCache = cached.image && (!currentImageIsScrydex || cachedImageIsScrydex);

 const newName = (cached.name && !cached.name.startsWith('Pokémon Card') && cached.name !== 'Card') ? cached.name : c.pokemon.name;
 const newRarity = (cached.rarity && cached.rarity !== 'Common') ? cached.rarity : (c.pokemon.rarity || cached.rarity);

 const updatedPoke = {
 ...c.pokemon,
 name: newName,
 rarity: newRarity,
 images: useImageFromCache && cached.image ? {
 small: getCardImageUrl(cached.image, 'low'),
 large: getCardImageUrl(cached.image, 'high'),
 } : c.pokemon.images,
 pricing: cached.pricing || c.pokemon.pricing,
 tcgplayer: cached.tcgplayer || c.pokemon.tcgplayer,
 cardmarket: cached.cardmarket || (cached.pricing as any)?.cardmarket || c.pokemon.cardmarket,
 illustrator: cached.illustrator || c.pokemon.illustrator,
 };
 const newVal = getRealCardPrice(updatedPoke);
 if (
 newVal !== c.value ||
 updatedPoke.name !== c.pokemon.name ||
 updatedPoke.rarity !== c.pokemon.rarity ||
 !c.pokemon.pricing?.cardmarket ||
 (useImageFromCache && cached.image && (!c.pokemon.images?.large || !c.pokemon.images.large.includes(cached.image)))
 ) {
 changed = true;
 return { ...c, value: newVal, pokemon: updatedPoke };
 }
 }
 return c;
 });
 return changed ? reorderCardsWithMostExpensiveLast(updated) : prevCards;
 });
 };
 onCardFullCacheUpdated.add(handleCacheUpdate);
 return () => {
 onCardFullCacheUpdated.delete(handleCacheUpdate);
 };
 }, []);

 // Stream Stats
 const [viewerCount, setViewerCount] = useState<number>(1420);
 const [totalRevenue, setTotalRevenue] = useState<number>(1280.00);
 const [hypeLevel, setHypeLevel] = useState<number>(4);
 const [isQueueOpen, setIsQueueOpen] = useState<boolean>(false);
 const [isChatVisible, setIsChatVisible] = useState<boolean>(true);

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

 // Pack Opening State
 const [packStage, setPackStage] = useState<'unopened' | 'tearing' | 'opened'>('unopened');
 const [cards, setCards] = useState<CardData[]>([]);
 const [currentPackArts, setCurrentPackArts] = useState<string[]>([]);
 const [packArtIndex, setPackArtIndex] = useState(0);
 const [isLoadingPack, setIsLoadingPack] = useState(false);
 const [isRevealingAll, setIsRevealingAll] = useState(false);
 const [isHoveringStack, setIsHoveringStack] = useState(false);
 const [sessionTotal, setSessionTotal] = useState(0);
 const flipTimesRef = useRef<Record<string | number, number>>({});
 const [isChaseCardsReady, setIsChaseCardsReady] = useState(false);

 // Shipping & Completion Modal State
 const [completionModal, setCompletionModal] = useState<{
 order: CustomerOrder;
 hits: { name: string; value: number; image: string; rarity: string }[];
 totalValue: number;
 } | null>(null);

 const [shippingModal, setShippingModal] = useState<{
 id: string;
 customer: string;
 location: string;
 address: string;
 trackingCode: string;
 totalValue: number;
 sleevedHitName: string;
 sleevedHitValue: number;
 } | null>(null);

 const [shippingProgress, setShippingProgress] = useState(0);

 const handleStartShipping = () => {
 if (!activeOrder) return;
 sound.playPackComplete();
 const mostExp = cards.find(c => c.isMostExpensive) || cards[0];
 const trackingCode = `USPS #9400 1092 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
 const matchedAddr = REALISTIC_CUSTOMER_ADDRESSES.find(a => a.location === activeOrder.location) || REALISTIC_CUSTOMER_ADDRESSES[0];
 const fullAddress = activeOrder.address || matchedAddr.address;

 setShippingProgress(15);
 const totalPulledVal = activeOrder.totalPulledValue ?? (activeOrder.pulledCards || []).reduce((acc, c) => acc + c.value, 0);
 setShippingModal({
 id: activeOrder.id,
 customer: activeOrder.username,
 location: activeOrder.location || matchedAddr.location,
 address: fullAddress,
 trackingCode,
 totalValue: totalPulledVal,
 sleevedHitName: mostExp?.pokemon.name || (activeOrder.pulledCards?.[0]?.name) || 'Top Hit',
 sleevedHitValue: mostExp?.value || (activeOrder.pulledCards?.[0]?.value) || 0
 });

 let step = 15;
 const interval = setInterval(() => {
 step += 25;
 setShippingProgress(Math.min(step, 100));
 if (step >= 100) {
 clearInterval(interval);
 }
 }, 400);
 };

 const completeShipping = (modalData: typeof shippingModal) => {
 if (!modalData) return;
 sound.playButtonClick();
 sound.playCardCollect();

 addChatMessage({
 id: Date.now().toString() + "-shipped",
 username: "SYSTEM ",
 message: ` PACKAGE DISPATCHED! Sleeved top hit (${modalData.sleevedHitName}) shipped to ${modalData.customer} in ${modalData.location}! Tracking: ${modalData.trackingCode}`,
 badge: "SHIPPED",
 color: "text-emerald-400 font-bold",
 avatarColor: "from-emerald-400 to-teal-600"
 });

 if (activeOrder) {
 const updated = { ...activeOrder, status: 'completed' as const };
 setOrders(prev => {
 const nextOrders = prev.map(o => o.id === updated.id ? updated : o);
 const nextPending = nextOrders.find(o => o.status === 'pending' || o.status === 'ripping');
 if (nextPending) {
 setActiveOrder(nextPending);
 } else {
 setActiveOrder(updated);
 }
 return nextOrders;
 });
 }

 setShippingModal(null);
 setPackStage('unopened');
 setCards([]);
 };

 const remainingCards = React.useMemo(() => cards.filter(c => !c.collected), [cards]);
 const revealedCards = React.useMemo(() => cards.filter(c => c.collected), [cards]);
 const topCardId = React.useMemo(() => remainingCards.length > 0 ? remainingCards[remainingCards.length - 1].id : null, [remainingCards]);

 const lastProcessedPackRef = useRef<string | null>(null);

 useEffect(() => {
 if (packStage === 'opened' && cards.length > 0 && remainingCards.length === 0) {
 const packSignature = cards.map(c => c.id).join(',');
 if (lastProcessedPackRef.current === packSignature) return;

 handleFinishCurrentPack(cards);
 }
 }, [packStage, remainingCards.length, cards]);

 const handleTearPack = React.useCallback(() => {
 sound.playPackOpen();
 setPackStage('opened');
 }, []);

 const handleCardClick = React.useCallback((id: string | number) => {
 if (isRevealingAll) return;
 const now = Date.now();
 const lastFlip = flipTimesRef.current[id] || 0;
 if (now - lastFlip < 160) return;

 setCards(prev => prev.map(card => {
 if (card.id === id) {
 if (!card.flipped) {
 flipTimesRef.current[id] = now;
 sound.playCardFlip(card.pokemon.rarity);
 setSessionTotal(s => Number((s + card.value).toFixed(2)));
 if (typeof triggerCardReaction === 'function') triggerCardReaction(card);
 return { ...card, flipped: true };
 } else if (!card.collected) {
 sound.playCardCollect(card.value);
 return { ...card, collected: true };
 }
 }
 return card;
 }));
 }, [isRevealingAll]);

 const handleRevealAll = () => {
 if (isRevealingAll || remainingCards.length === 0) return;
 setIsRevealingAll(true);
 sound.playButtonClick();

 const orderedCards = [...remainingCards].reverse();

 orderedCards.forEach((card, idx) => {
 setTimeout(() => {
 sound.playRevealStep(idx, card.pokemon.rarity);
 if (typeof triggerCardReaction === 'function') triggerCardReaction(card);
 setCards(prev => prev.map(c => {
 if (c.id === card.id && !c.flipped) {
 setSessionTotal(s => Number((s + c.value).toFixed(2)));
 return { ...c, flipped: true };
 }
 return c;
 }));
 }, idx * 480);

 setTimeout(() => {
 sound.playCardCollect(card.value);
 setCards(prev => prev.map(c => {
 if (c.id === card.id) return { ...c, collected: true };
 return c;
 }));
 if (idx === orderedCards.length - 1) {
 setTimeout(() => {
 sound.playPackComplete();
 setIsRevealingAll(false);
 handleFinishCurrentPack(cards);
 }, 450);
 }
 }, idx * 480 + 620);
 });
 };

 const handleFinishCurrentPack = (currentCards: CardData[]) => {
 if (!activeOrder) return;
 
 const packSignature = currentCards.map(c => c.id).join(',');
 if (lastProcessedPackRef.current === packSignature) return;
 lastProcessedPackRef.current = packSignature;

 // Extract ONLY genuine hits from current pack for the hits showcase
 const packHits = currentCards
 .filter(c => isActualHit(c))
 .map(c => ({
 name: c.pokemon.name,
 value: c.value,
 image: c.pokemon.images?.large || c.pokemon.images?.small || ((c.pokemon as any).image ? getCardImageUrl((c.pokemon as any).image, 'high') : ''),
 rarity: c.pokemon.rarity || 'Hit'
 }));

 // Calculate total value of ALL cards pulled in this pack (hits + non-hits / commons / uncommons / energy)
 const currentPackAllCardsValue = currentCards.reduce((acc, c) => acc + (c.value || 0), 0);

 const currentOpened = activeOrder.openedPacks || 0;
 const newOpenedPacks = Math.min(currentOpened + 1, activeOrder.packCount);
 const existingPulled = activeOrder.pulledCards || [];
 const baseValue = existingPulled.reduce((acc, c) => acc + c.value, 0);
 const existingTotalPulledValue = activeOrder.totalPulledValue ?? baseValue;
 const newTotalPulledValue = Number((existingTotalPulledValue + currentPackAllCardsValue).toFixed(2));
 const newAllCardsCount = (activeOrder.allPulledCardsCount || 0) + currentCards.length;
 
 const combinedPulled = [...existingPulled];
 packHits.forEach(h => {
 if (!combinedPulled.some(p => p.name === h.name && Math.abs(p.value - h.value) < 0.01)) {
 combinedPulled.push(h);
 }
 });

 const isAllComplete = newOpenedPacks >= activeOrder.packCount;
 const updatedOrder: CustomerOrder = {
 ...activeOrder,
 openedPacks: newOpenedPacks,
 pulledCards: combinedPulled,
 totalPulledValue: newTotalPulledValue,
 allPulledCardsCount: newAllCardsCount,
 status: isAllComplete ? 'completed' : 'ripping'
 };

 setActiveOrder(updatedOrder);
 setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

 if (isAllComplete) {
 setTimeout(() => {
 sound.playPackComplete();
 setCompletionModal({
 order: updatedOrder,
 hits: combinedPulled,
 totalValue: newTotalPulledValue
 });
 }, 700);
 }
 };

 const preloadPackImages = (cards: PokemonCard[]): Promise<void> => {
 if (!cards || cards.length === 0) return Promise.resolve();
 const promises: Promise<void>[] = [];
 cards.forEach(card => {
 const urls: string[] = [];
 if (card.images?.large) urls.push(card.images.large);
 if (card.images?.small) urls.push(card.images.small);
 const cardAny = card as any;
 if (cardAny.image) {
 urls.push(getCardImageUrl(cardAny.image, 'high'));
 urls.push(getCardImageUrl(cardAny.image, 'low'));
 }
 const uniqueUrls = Array.from(new Set(urls));
 uniqueUrls.forEach(url => {
 promises.push(new Promise<void>(resolve => {
 const img = new Image();
 img.src = url;
 if (img.complete) {
 resolve();
 } else {
 img.onload = () => resolve();
 img.onerror = () => resolve();
 }
 }));
 });
 });

 const timeoutPromise = new Promise<void>(resolve => setTimeout(resolve, 2000));
 return Promise.race([
 Promise.allSettled(promises).then(() => {}),
 timeoutPromise
 ]);
 };

 const loadAndRipPack = async (order: CustomerOrder) => {
 sound.playButtonClick();
 lastProcessedPackRef.current = null;
 const loadStartTime = Date.now();
 setIsLoadingPack(true);
 setIsChaseCardsReady(false);
 setPackStage('unopened');
 setCards([]);

 let newCards: PokemonCard[] = [];
 try {
 const arts = getPackArtsForSet(order.setId, packArtsManifest);
 setCurrentPackArts(arts);
 setPackArtIndex(0);

 const isJa = order.setId.endsWith('_ja');
 let setDetails;
 
 try {
 if (isJa) {
 setDetails = await fetchSingleJapaneseSet(order.setId);
 newCards = await generateJapanesePackFromSet(setDetails);
 } else {
 setDetails = await fetchSetDetails(order.setId);
 newCards = await generatePackFromSet(setDetails);
 }
 
 setCards(formatAndSortCards(newCards));

 // Delay background set warmup so it NEVER competes for network connections with the active pack
 if (!isJa) {
 setTimeout(() => {
 orchestrateSetLoading(setDetails, newCards.map(c => c.id), () => {
 setIsChaseCardsReady(true);
 });
 }, 400);
 }
 } catch (e) {
 const fbCards = generateFallbackPack(FALLBACK_POKEMON_CARDS, setDetails || { id: order.setId });
 setCards(fbCards);
 }
 } catch (e) {
 const fbCards = generateFallbackPack(FALLBACK_POKEMON_CARDS, { id: order.setId });
 setCards(fbCards);
 } finally {
 // FORCE browser to fetch & decode pack wrapper art AND card images into GPU memory BEFORE lifting curtains
 const activeArts = currentPackArts.length > 0 ? currentPackArts : getPackArtsForSet(order.setId, packArtsManifest);
 await preloadPackAssets(activeArts, newCards);

 const elapsed = Date.now() - loadStartTime;
 const minCurtainTime = 1200;
 const remainingDelay = Math.max(0, minCurtainTime - elapsed);
 if (remainingDelay > 0) {
 await new Promise(r => setTimeout(r, remainingDelay));
 }
 setIsLoadingPack(false);
 }
 };

 
 // Real orders mapped to actual sets & authentic full addresses!
 const [orders, setOrders] = useState<CustomerOrder[]>([
 {
 id: 'ord-101',
 username: '@PokeKing99',
 location: 'Los Angeles, California ',
 address: '100 Universal City Plaza, Apt 402, Universal City, CA 91608, USA ',
 avatarColor: 'from-amber-400 to-orange-500',
 packName: '151 Booster Pack',
 setId: 'sv3pt5',
 packCount: 3,
 totalPaid: 86.73,
 status: 'pending'
 },
 {
 id: 'ord-102',
 username: '@SlabKing',
 location: 'New York City, New York ',
 address: '350 5th Ave, Floor 32, New York, NY 10118, USA ',
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
 location: 'London, United Kingdom ',
 address: '221B Baker Street, Flat 3, Marylebone, London NW1 6XE, UK ',
 avatarColor: 'from-red-500 to-rose-700',
 packName: 'Base Set Vintage Pack',
 setId: 'base1',
 packCount: 1,
 totalPaid: 449.99,
 status: 'pending'
 },
 {
 id: 'ord-104',
 username: '@TokyoTrainer_JP',
 location: 'Tokyo, Japan ',
 address: '456 Shibuya Crossing Ave, Apt 12B, Shibuya-ku, Tokyo 150-0042, Japan ',
 avatarColor: 'from-pink-500 to-rose-500',
 packName: 'Shiny Treasure ex (JP)',
 setId: 'sv4a_ja',
 packCount: 4,
 totalPaid: 112.50,
 status: 'pending'
 },
 {
 id: 'ord-105',
 username: '@AussiePokeFan',
 location: 'Sydney, Australia ',
 address: '14 Opera House Blvd, Circular Quay, Sydney NSW 2000, Australia ',
 avatarColor: 'from-teal-400 to-cyan-600',
 packName: 'Paldea Evolved Booster',
 setId: 'sv2',
 packCount: 3,
 totalPaid: 31.47,
 status: 'pending'
 },
 {
 id: 'ord-106',
 username: '@MiamiCardVault',
 location: 'Miami, Florida ',
 address: '405 Ocean Drive, Penthouse B, Miami Beach, FL 33139, USA ',
 avatarColor: 'from-cyan-400 to-blue-600',
 packName: 'Prismatic Evolutions',
 setId: 'sv8pt5',
 packCount: 6,
 totalPaid: 179.94,
 status: 'pending'
 },
 {
 id: 'ord-107',
 username: '@BerlinPackCracker',
 location: 'Berlin, Germany ',
 address: 'Friedrichstraße 45, 10117 Berlin, Germany ',
 avatarColor: 'from-yellow-400 to-red-600',
 packName: 'Obsidian Flames Booster',
 setId: 'sv3',
 packCount: 3,
 totalPaid: 29.97,
 status: 'pending'
 },
 {
 id: 'ord-108',
 username: '@SeoulCardMaster',
 location: 'Seoul, South Korea ',
 address: 'Gangnam-daero 390, Suite 1102, Seoul 06232, South Korea ',
 avatarColor: 'from-purple-600 to-fuchsia-600',
 packName: '151 Japanese Box Pack',
 setId: 'sv2a_ja',
 packCount: 5,
 totalPaid: 145.00,
 status: 'pending'
 },
 {
 id: 'ord-100',
 username: '@VmaxCollector',
 location: 'Toronto, Canada ',
 address: '88 Bay Street, Suite 1400, Toronto, ON M5J 2R8, Canada ',
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
 const [newAddress, setNewAddress] = useState('');
 const [newLocation, setNewLocation] = useState('Austin, Texas ');
 const [newPackName, setNewPackName] = useState('151 Booster Pack');
 const [newSetId, setNewSetId] = useState('sv3');
 const [newPackCount, setNewPackCount] = useState(1);
 const [newTotalPaid, setNewTotalPaid] = useState(29.99);

 const handleAddNewOrder = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newUsername.trim()) return;
 sound.playButtonClick();
 const randEntry = REALISTIC_CUSTOMER_ADDRESSES[Math.floor(Math.random() * REALISTIC_CUSTOMER_ADDRESSES.length)];
 const finalAddress = newAddress.trim() || randEntry.address;
 const finalLocation = newLocation.trim() || randEntry.location;
 const newOrd: CustomerOrder = {
 id: `ord-${Date.now()}`,
 username: newUsername.startsWith('@') ? newUsername.trim() : `@${newUsername.trim()}`,
 location: finalLocation,
 address: finalAddress,
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
 setNewAddress('');
 setIsAddFormOpen(false);
 };

 const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
 { id: '1', username: 'StreamBot', message: ' RIP & SHIP LIVE! Pack ripping in progress! Type in chat to interact with the host!', badge: 'MOD', color: 'text-amber-400', avatarColor: 'from-yellow-400 to-amber-600' },
 ]);

 const [hostInput, setHostInput] = useState<string>('');
 const [activeOrder, setActiveOrder] = useState<CustomerOrder | null>(orders[0] || null);

 const triggerCardReaction = React.useCallback(async (card: CardData) => {
 if (!isActualHit(card)) return;

 try {
 const burst = await generateMultiViewerCardReaction({
 cardName: card.pokemon.name,
 cardValue: card.value,
 rarity: card.pokemon.rarity || 'Card',
 isMostExpensive: Boolean(card.isMostExpensive),
 buyerUsername: activeOrder?.username
 });

 // Stagger each viewer's reaction so chat explodes like a real live stream burst!
 burst.forEach((item, idx) => {
 setTimeout(() => {
 addChatMessage({
 id: Date.now().toString() + Math.random() + idx,
 username: item.viewer.username,
 message: item.text,
 badge: item.viewer.badge,
 color: item.viewer.color,
 avatarColor: item.viewer.avatarColor
 });
 }, idx * 220);
 });
 } catch {
 // Silent catch
 }
 }, [activeOrder]);

 const [isChatTyping, setIsChatTyping] = useState(false);

 const chatBottomRef = useRef<HTMLDivElement>(null);

 const containerRef = useRef<HTMLDivElement>(null);
 const isVisibleRef = useRef(true);

 useEffect(() => {
 const observer = new IntersectionObserver(([entry]) => {
 isVisibleRef.current = entry.isIntersecting;
 }, { threshold: 0.1 });
 if (containerRef.current) {
 observer.observe(containerRef.current);
 }
 return () => observer.disconnect();
 }, []);

 useEffect(() => {
 const viewerInterval = setInterval(() => {
 if (!isVisibleRef.current || document.hidden) return;
 setViewerCount(prev => prev + Math.floor(Math.random() * 7) - 3);
 }, 3000);

 const reactionInterval = setInterval(() => {
 if (!isVisibleRef.current || document.hidden) return;
 const emojis = ['', '', '', '', '', '', ''];
 const emoji = emojis[Math.floor(Math.random() * emojis.length)];
 setReactions(prev => [
 ...prev.slice(-15),
 { id: Date.now() + Math.random(), emoji, x: Math.floor(Math.random() * 40) + 60 }
 ]);
 }, 1200);

 // Live background stream chatter generator
 const streamChatInterval = setInterval(() => {
 if (!isVisibleRef.current || document.hidden) return;
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
 { id: Date.now(), emoji: '', x: Math.floor(Math.random() * 30) + 65 }
 ]);
 };

 const handleSendHostMessage = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!hostInput.trim() || isChatTyping) return;
 
 const userMsg = hostInput.trim();
 sound.playButtonClick();
 addChatMessage({
 id: Date.now().toString(),
 username: 'HOST ',
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
 <div ref={containerRef} className="relative w-full h-[100dvh] bg-[#05040a] overflow-hidden text-white flex flex-col select-none">
 {/* ── 1. Top Spacious Stream Header HUD (Row 1) ── */}
 <div className="relative w-full z-40 px-2.5 sm:px-6 py-2 sm:py-3.5 bg-[#090712] border-b border-white/10 flex items-center justify-between gap-1.5 sm:gap-2.5 shrink-0">
 <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
 <div className="flex items-center gap-1.5 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-red-600/25 border border-red-500/50 text-red-400 font-black text-[10px] sm:text-xs uppercase tracking-wider shadow-md shrink-0">
 <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
 <span>LIVE &middot; {viewerCount.toLocaleString()}</span>
 </div>

 <div className="bg-black/60 border border-amber-500/30 px-2 py-1 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold text-amber-300 flex items-center gap-1 shadow-md shrink-0">
 <DollarSign className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 <span className="font-mono font-black">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
 </div>
 </div>

 <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
 <button
 onClick={() => { sound.playButtonClick(); setIsChatVisible(prev => !prev); }}
 className={`p-1.5 sm:p-2 rounded-full border transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center ${
 isChatVisible
 ? 'bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/40 text-purple-300'
 : 'bg-gray-800/60 hover:bg-gray-700/60 border-gray-600/40 text-gray-400'
 }`}
 title={isChatVisible ? "Hide Live Chat" : "Show Live Chat"}
 aria-label={isChatVisible ? "Hide Live Chat" : "Show Live Chat"}
 >
 {isChatVisible ? <MessageSquare className="w-4 h-4 text-purple-400" /> : <MessageSquareOff className="w-4 h-4 text-gray-400" />}
 </button>

 <button
 onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); }}
 className="px-2.5 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 text-[11px] sm:text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95 shrink-0"
 title="Orders"
 >
 <ShoppingCart className="w-3.5 h-3.5 text-amber-400 shrink-0" />
 <span>Orders</span>
 <span className="bg-amber-400 text-black px-1.5 py-0.2 rounded-full text-[9px] font-black leading-none">
 {orders.length}
 </span>
 </button>

 <button
 onClick={() => { sound.playButtonClick(); onBackToPacks(); }}
 className="p-1.5 sm:p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 transition-all cursor-pointer shadow-md active:scale-95 flex items-center justify-center shrink-0"
 title="Back to Packs"
 aria-label="Back to Packs"
 >
 <ArrowLeft className="w-4 h-4 text-red-400" />
 </button>
 </div>
 </div>

 {/* ── 3. Overhead Camera Stage & Side Chat Panel Container ── */}
 <div className="relative flex-1 w-full bg-[#07050d] overflow-hidden min-h-0 p-2 sm:p-4">
 <div className="w-full h-full max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 items-stretch justify-center overflow-hidden relative">

 {/* LEFT / CENTER: Stream Camera Viewport & Revealed Cards */}
 <div className="flex-1 flex flex-col items-center justify-start overflow-y-auto custom-scrollbar min-w-0 pr-1 pb-24 lg:pb-0">

 {/* Active Customer Order Banner */}
 {activeOrder && (
 <div className="w-full max-w-4xl mb-3 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-amber-500/15 border border-amber-500/30 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-lg">
 <div className="flex items-center gap-3 min-w-0 flex-1">
 <div className={`w-8 h-8 rounded-full bg-gradient-to-tr ${activeOrder.avatarColor} flex items-center justify-center font-black text-xs text-white shrink-0 shadow-md ring-2 ring-amber-400/50`}>
 {activeOrder.username.substring(1, 3).toUpperCase()}
 </div>
 <div className="min-w-0 text-left flex-1 max-w-md">
 <div className="flex items-center gap-2 truncate">
 <span className="text-xs font-black text-amber-300 truncate">{activeOrder.username}</span>
 <span className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">${activeOrder.totalPaid.toFixed(2)}</span>
 <span className="text-[9px] font-bold text-gray-400 truncate hidden sm:inline">• {activeOrder.location}</span>
 </div>

 {/* Customer Pack Progress Bar */}
 <div className="w-full flex items-center gap-2 mt-1">
 <div className="flex-1 bg-black/60 rounded-full h-2 border border-white/10 overflow-hidden">
 <motion.div
 initial={{ width: '0%' }}
 animate={{ width: `${Math.min(100, Math.round(((activeOrder.openedPacks || 0) / activeOrder.packCount) * 100))}%` }}
 transition={{ duration: 0.4 }}
 className="bg-gradient-to-r from-amber-400 via-yellow-400 to-emerald-400 h-full rounded-full shadow-[0_0_10px_rgba(245,158,11,0.8)]"
 />
 </div>
 <span className="text-[10px] font-mono text-amber-300 font-bold shrink-0">
 {activeOrder.openedPacks || 0} / {activeOrder.packCount} Packs
 </span>
 </div>
 </div>
 </div>

 {activeOrder.status === 'completed' ? (
 <button
 onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); }}
 className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow hover:bg-emerald-500/30 transition-all cursor-pointer shrink-0"
 >
 <CheckCircle2 className="w-4 h-4 text-emerald-400" />
 <span>ORDER SHIPPED </span>
 </button>
 ) : (
 <button
 onClick={() => {
 if (!activeOrder) return;
 if ((activeOrder.openedPacks || 0) >= activeOrder.packCount) {
 sound.playButtonClick();
 const orderTotalVal = activeOrder.totalPulledValue ?? (activeOrder.pulledCards || []).reduce((acc, c) => acc + c.value, 0);
 setCompletionModal({
 order: activeOrder,
 hits: activeOrder.pulledCards || [],
 totalValue: orderTotalVal
 });
 } else {
 loadAndRipPack(activeOrder);
 }
 }}
 className={`px-4 py-2 rounded-full font-black text-xs uppercase tracking-wider shadow-lg transition-all transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-1.5 shrink-0 ${
 (activeOrder.openedPacks || 0) >= activeOrder.packCount
 ? 'bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black border border-emerald-300 animate-pulse'
 : 'bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 text-white border border-red-300'
 }`}
 >
 <Package className="w-4 h-4" />
 <span>
 {(activeOrder.openedPacks || 0) >= activeOrder.packCount
 ? ` ALL PACKS RIPPED - SHIP ORDER`
 : ` RIP PACK ${(activeOrder.openedPacks || 0) + 1}/${activeOrder.packCount} `}
 </span>
 </button>
 )}
 </div>
 )}

 {/* Pro Stream Viewport Frame */}
 <div className="w-full max-w-4xl rounded-3xl bg-gradient-to-b from-[#18142a] via-[#100c1e] to-[#0a0814] border border-purple-500/30 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_2px_rgba(255,255,255,0.12)] p-4 sm:p-6 relative flex flex-col items-center justify-center min-h-[420px] shrink-0">
 
 {/* Studio Overhead Camera Indicator Badges */}
 <div className="w-full flex items-center justify-between mb-2 text-xs font-mono px-2">
 <div className="flex items-center gap-2">
 <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 font-bold">
 <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
 LIVE OVERHEAD CAM
 </span>
 <span className="hidden sm:inline-block px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400">
 1080P • 60 FPS
 </span>
 </div>
 {activeOrder && (
 <span className="px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold">
 {activeOrder.packName}
 </span>
 )}
 </div>

 {/* Center Stage: Card Stack / Booster Pack Tear */}
 <AnimatePresence mode="wait">
 {isLoadingPack ? (
 <PackLoadingCurtain
 key="ripnship-loading-curtain"
 setName={activeOrder?.packName || activeOrder?.setId}
 />
 ) : packStage !== 'opened' ? (
 cards.length > 0 ? (
 <div className="relative flex items-center justify-center min-w-[280px] sm:min-w-[320px] z-10 py-2">
 <BoosterPackTear
 packArts={currentPackArts}
 packArtIndex={packArtIndex}
 onPrevPackArt={() => setPackArtIndex(prev => (prev - 1 + currentPackArts.length) % currentPackArts.length)}
 onNextPackArt={() => setPackArtIndex(prev => (prev + 1) % currentPackArts.length)}
 onTearComplete={handleTearPack}
 setName={activeOrder?.packName}
 packStage={packStage}
 remainingCardsCount={remainingCards.length}
 hideTearButton={true}
 />
 </div>
 ) : (
 <div className="w-full h-full flex flex-col items-center justify-center text-amber-500/50 py-12">
 <Package className="w-16 h-16 mb-4 opacity-50" />
 <p className="text-sm font-bold uppercase tracking-widest text-center">No Active Pack</p>
 <p className="text-xs mt-2 max-w-xs text-center opacity-70">Click 'RIP LIVE' to begin.</p>
 </div>
 )
 ) : remainingCards.length > 0 ? (
 <div className="relative w-60 sm:w-68 h-[21rem] sm:h-[23.5rem] shrink-0 my-4 flex items-center justify-center">
 <div
 className="absolute -inset-8 z-[500] cursor-pointer rounded-3xl"
 onClick={() => topCardId !== null && handleCardClick(topCardId)}
 onMouseEnter={() => { setIsHoveringStack(true); sound.playCardSlide(true); }}
 onMouseLeave={() => setIsHoveringStack(false)}
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
 return (
 <Card
 key={card.id}
 card={card}
 rotation={rotation}
 offsetX={offsetX}
 offsetY={baseOffsetY}
 isTopCard={card.id === topCardId}
 isHovered={isHoveringStack && card.id === topCardId}
 setName={activeOrder?.packName}
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
 className="flex flex-col items-center justify-center p-8 rounded-3xl bg-white/5 border border-white/10 shadow-2xl max-w-md text-center shrink-0 my-4"
 >
 <div className="w-16 h-16 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]">
 <Package className="w-8 h-8" />
 </div>

 <h3 className="text-xl font-extrabold mb-1">
 Pack {activeOrder?.openedPacks || 1} of {activeOrder?.packCount} Completed!
 </h3>

 {cards.find(c => c.isMostExpensive) && (
 <div className="text-xs text-cyan-300 font-extrabold bg-cyan-950/80 border border-cyan-400/50 px-3.5 py-1.5 rounded-full mb-3 shadow-lg flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-cyan-300 animate-pulse" />
 <span>Pack Top Hit: {cards.find(c => c.isMostExpensive)?.pokemon.name} (${cards.find(c => c.isMostExpensive)?.value.toFixed(2)})</span>
 </div>
 )}

 <p className="text-gray-400 text-xs mb-5">
 Total Pulled Value (All Cards): <span className="text-emerald-400 font-bold">${(activeOrder?.totalPulledValue ?? (activeOrder?.pulledCards || []).reduce((acc, c) => acc + c.value, 0)).toFixed(2)}</span>
 </p>

 {activeOrder?.status === 'completed' ? (
 <button
 onClick={() => { sound.playButtonClick(); setIsOrdersModalOpen(true); }}
 className="px-8 py-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-black text-xs sm:text-sm uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 hover:bg-emerald-500/30 transition-all cursor-pointer"
 >
 <CheckCircle2 className="w-5 h-5 text-emerald-400" />
 <span> ORDER SHIPPED - SELECT NEXT ORDER </span>
 </button>
 ) : (activeOrder?.openedPacks || 0) < (activeOrder?.packCount || 1) ? (
 <button
 onClick={() => activeOrder && loadAndRipPack(activeOrder)}
 className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 font-black text-white text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Package className="w-5 h-5 text-white" />
 <span> RIP PACK {(activeOrder?.openedPacks || 0) + 1} OF {activeOrder?.packCount} FOR {activeOrder?.username} </span>
 </button>
 ) : (
 <button
 onClick={() => {
 sound.playButtonClick();
 if (activeOrder) {
 const orderTotalVal = activeOrder.totalPulledValue ?? (activeOrder.pulledCards || []).reduce((acc, c) => acc + c.value, 0);
 setCompletionModal({
 order: activeOrder,
 hits: activeOrder.pulledCards || [],
 totalValue: orderTotalVal
 });
 }
 }}
 className="px-8 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 font-black text-black text-xs sm:text-sm uppercase tracking-wider shadow-[0_4px_20px_rgba(16,185,129,0.5)] transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2 animate-pulse"
 >
 <Truck className="w-5 h-5 text-black" />
 <span> ALL PACKS OPENED - SHIP ORDER TO LOGISTICS </span>
 </button>
 )}
 </motion.div>
 )}
 </AnimatePresence>
 </div>

 {/* Revealed Cards Gallery */}
 {!isLoadingPack && packStage === 'opened' && revealedCards.length > 0 && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0 }}
 className="w-full max-w-4xl mt-6 px-2 shrink-0 pb-12"
 >
 <div className="flex flex-col items-center mb-6">
 <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
 <Sparkles className="w-3.5 h-3.5 text-amber-400" />
 Revealed Cards ({revealedCards.length} / {cards.length})
 </h3>
 </div>
 <div className="flex flex-wrap items-stretch justify-center gap-4 sm:gap-6">
 <AnimatePresence>
 {revealedCards.map((card) => (
 <RevealedCardItem
 key={card.id}
 card={card}
 isAdded={collectedCardIds.has(String(card.pokemon.id || card.id))}
 onInspect={(c) => { sound.playModalOpen(); setInspectedCard(c); }}
 onAddToBinder={(c) => handleAddToBinder(c)}
 />
 ))}
 </AnimatePresence>
 </div>
 </motion.div>
 )}
 </div>

 {/* RIGHT / FLOATING: TikTok & Instagram Live Style Stream Chat */}
 <AnimatePresence>
 {isChatVisible && (
 <motion.div
 initial={{ opacity: 0, y: 20 }}
 animate={{ opacity: 1, y: 0, x: 0 }}
 exit={{ opacity: 0, y: 20 }}
 className="absolute bottom-3 left-3 z-30 lg:relative lg:bottom-auto lg:left-auto lg:z-auto w-[82vw] max-w-[290px] lg:max-w-none lg:w-80 xl:w-96 shrink-0 h-[210px] sm:h-[250px] lg:h-full bg-black/65 backdrop-blur-md lg:bg-[#110e20]/90 border border-white/20 lg:border-white/15 rounded-2xl lg:rounded-3xl p-2.5 sm:p-4 flex flex-col shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden"
 >
 {/* Chat Header */}
 <div className="pb-1.5 sm:pb-3 mb-1 sm:mb-2 border-b border-white/10 flex items-center justify-between shrink-0">
 <div className="flex items-center gap-1.5 text-white">
 <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />
 <span className="font-extrabold text-[10px] sm:text-xs uppercase tracking-wider">Live Stream Chat</span>
 </div>
 <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-[9px] sm:text-[10px] text-red-400 font-mono font-bold">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
 <span>1,413 LIVE</span>
 </div>
 </div>

 {/* Messages Feed */}
 <div 
 className="flex-1 overflow-y-auto custom-scrollbar space-y-1.5 pr-1 my-1"
 style={{
 maskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)',
 WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 12%)'
 }}
 >
 {chatMessages.map(msg => (
 <motion.div
 key={msg.id}
 initial={{ opacity: 0, x: -10 }}
 animate={{ opacity: 1, x: 0 }}
 className={`p-2 sm:p-2.5 rounded-xl border text-[11px] sm:text-xs transition-all flex items-start gap-1.5 ${
 msg.isOrderNotification 
 ? 'bg-amber-500/30 border-amber-400/60 text-white font-bold' 
 : 'bg-black/60 backdrop-blur-sm border-white/10 text-gray-100'
 }`}
 >
 <div className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr ${msg.avatarColor || 'from-purple-500 to-indigo-600'} flex items-center justify-center text-[8px] sm:text-[9px] font-black shrink-0 text-white shadow-sm mt-0.5`}>
 {msg.username.substring(0, 2).toUpperCase()}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1 flex-wrap leading-tight">
 {msg.badge && (
 <span className="text-[7px] sm:text-[8px] font-black px-1.5 py-0.2 rounded bg-amber-400 text-black uppercase tracking-wider">
 {msg.badge}
 </span>
 )}
 <span className={`font-extrabold text-[10px] sm:text-[11px] ${msg.color || 'text-amber-300'}`}>
 {msg.username}
 </span>
 </div>
 <div className="text-[10px] sm:text-[11px] leading-tight text-gray-100 mt-0.5 break-words">
 {msg.message}
 </div>
 </div>
 </motion.div>
 ))}
 <div ref={chatBottomRef} />
 </div>

 {/* Host Input & Reactions */}
 <div className="pt-1.5 sm:pt-2 border-t border-white/10 flex items-center gap-1.5 shrink-0">
 <form onSubmit={handleSendHostMessage} className="flex-1 flex gap-1">
 <input
 type="text"
 value={hostInput}
 onChange={e => setHostInput(e.target.value)}
 placeholder="Chat as Host..."
 className="flex-1 px-3 py-1.5 rounded-full bg-black/70 border border-white/20 text-white text-[11px] sm:text-xs placeholder-gray-400 focus:outline-none focus:border-amber-400 transition-all shadow-lg"
 />
 <button
 type="submit"
 className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-black font-black text-xs flex items-center gap-1 hover:brightness-110 transition-all cursor-pointer shadow-lg shrink-0"
 >
 <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
 </button>
 </form>

 <button
 onClick={handleSpawnHeart}
 className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-red-600/30 border border-red-500/60 text-red-400 flex items-center justify-center hover:scale-110 active:scale-90 transition-all cursor-pointer shrink-0 shadow-lg"
 >
 <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-red-500" />
 </button>
 </div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 </div>

 {/* ── 5. Floating Reactions Overlay ── */}
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

 {inspectedCard && (
 <CardMarketModal
 card={inspectedCard}
 onClose={() => setInspectedCard(null)}
 onAddToBinder={(c) => handleAddToBinder(c)}
 isAddedToBinder={collectedCardIds.has(String(inspectedCard.pokemon.id || inspectedCard.id))}
 />
 )}

 {/* ── 7. Shipping Animation Modal ── */}
 <AnimatePresence>
 {shippingModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 bg-black/90 p-4 flex items-center justify-center pointer-events-auto"
 >
 <motion.div
 initial={{ scale: 0.8, y: 30 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.8, y: 30 }}
 className="relative w-full max-w-lg bg-gradient-to-b from-[#131124] to-[#07050e] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(245,158,11,0.35)] text-center flex flex-col items-center overflow-hidden text-white"
 >
 {/* Delivery Van / Truck Animation */}
 <motion.div
 animate={{ x: [-15, 15, -15] }}
 transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
 className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-yellow-400 p-0.5 shadow-[0_0_30px_rgba(245,158,11,0.6)] mb-4 flex items-center justify-center"
 >
 <div className="w-full h-full rounded-full bg-[#0c0a18] flex items-center justify-center">
 <Truck className="w-10 h-10 text-amber-400 animate-bounce" />
 </div>
 </motion.div>

 <div className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-xs font-black uppercase tracking-widest mb-2.5 flex items-center gap-1.5 shadow-md">
 <Package className="w-4 h-4 text-amber-400" />
 <span>PACKAGING & SHIPPING LIVE</span>
 </div>

 <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
 Shipping to <span className="text-amber-300">{shippingModal.customer}</span>
 </h2>
 
 {/* Parcel Shipping Address Card */}
 <div className="w-full bg-[#171429] border border-white/15 rounded-2xl p-4 mb-6 flex flex-col items-center relative overflow-hidden shadow-inner">
 <div className="absolute top-2 right-2 px-2 py-0.5 rounded border border-red-500/60 bg-red-950/90 text-red-400 text-[9px] font-black uppercase tracking-widest rotate-3 shadow">
 FRAGILE &middot; SLEEVED HITS
 </div>

 <div className="text-xs text-amber-300 font-extrabold flex items-center gap-1.5 mb-1">
 <MapPin className="w-4 h-4 text-red-400 shrink-0" />
 <span>SHIP TO ADDRESS</span>
 </div>
 <div className="text-xs font-bold text-gray-200 text-center max-w-sm mb-3 px-2">
 {shippingModal.address}
 </div>

 <div className="text-xs text-cyan-300 font-bold flex items-center gap-1 mb-2 bg-cyan-950/80 border border-cyan-400/40 px-3 py-1 rounded-full">
 <ShieldCheck className="w-4 h-4 text-cyan-400" />
 <span>Sleeved Hit: <strong>{shippingModal.sleevedHitName}</strong> (${shippingModal.sleevedHitValue.toFixed(2)})</span>
 </div>

 <div className="text-[11px] text-gray-400 font-mono">
 Tracking Code: <span className="text-gray-200 font-bold">{shippingModal.trackingCode}</span>
 </div>

 {/* Progress Bar */}
 <div className="w-full bg-black/60 rounded-full h-3 mt-4 overflow-hidden border border-white/10 p-0.5">
 <motion.div
 initial={{ width: '0%' }}
 animate={{ width: `${shippingProgress}%` }}
 transition={{ duration: 0.3 }}
 className="bg-gradient-to-r from-amber-500 via-emerald-400 to-cyan-400 h-full rounded-full shadow-[0_0_10px_rgba(52,211,153,0.8)]"
 />
 </div>

 <span className="text-[10px] font-mono text-amber-300 font-bold mt-2">
 {shippingProgress < 30 ? ' Sleeving Top Hits...' : shippingProgress < 70 ? ' Bubble Envelope Sealing...' : ' Dispatched to Logistics Provider!'}
 </span>
 </div>

 <button
 onClick={() => completeShipping(shippingModal)}
 className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 text-black font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(16,185,129,0.5)] hover:brightness-110 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
 >
 <CheckCircle2 className="w-5 h-5 text-black" />
 <span>CONFIRM PACKAGE DISPATCH</span>
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>

 {/* ── All Packs Opened & Box Packing Modal ── */}
 <AnimatePresence>
 {completionModal && (
 <motion.div
 initial={{ opacity: 0 }}
 animate={{ opacity: 1 }}
 exit={{ opacity: 0 }}
 className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 pointer-events-auto"
 >
 <motion.div
 initial={{ scale: 0.85, y: 30 }}
 animate={{ scale: 1, y: 0 }}
 exit={{ scale: 0.85, y: 30 }}
 className="w-full max-w-lg bg-gradient-to-b from-[#1c1830] via-[#120f24] to-[#0a0817] border-2 border-amber-400/60 rounded-3xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)] text-center flex flex-col items-center relative overflow-hidden"
 >
 
 {/* Animated Parcel Box Header */}
 <motion.div
 animate={{ scale: [1, 1.08, 1], rotate: [0, -3, 3, 0] }}
 transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
 className="w-20 h-20 rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center mb-3 shadow-[0_0_30px_rgba(245,158,11,0.4)]"
 >
 <Package className="w-10 h-10 text-amber-400 animate-pulse" />
 </motion.div>

 <span className="px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5 shadow">
 <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
 <span>ORDER COMPLETE ({completionModal.order.packCount}/{completionModal.order.packCount} PACKS RIPPED)</span>
 </span>

 <h2 className="text-2xl sm:text-3xl font-black text-white mb-1">
 All Packs Opened for <span className="text-amber-300">{completionModal.order.username}</span>!
 </h2>
 <p className="text-xs text-gray-300 font-bold mb-4">
 Ship off their order! Packing all pulled hit cards into parcel box below 
 </p>

 {/* Packing Box Animation Container */}
 <div className="w-full bg-[#120f22] border border-amber-500/30 rounded-2xl p-4 mb-5 flex flex-col items-center shadow-inner relative overflow-hidden">
 <div className="text-xs font-black text-cyan-300 uppercase tracking-wider mb-3 flex items-center gap-1.5">
 <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
 <span>BOXING UP PULLED HITS ({completionModal.hits.length} CARDS)</span>
 </div>

 <div className="w-full max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
 {completionModal.hits.length > 0 ? (
 completionModal.hits.map((hit, idx) => (
 <motion.div
 key={idx}
 initial={{ opacity: 0, x: -30, scale: 0.8 }}
 animate={{ opacity: 1, x: 0, scale: 1 }}
 transition={{ delay: idx * 0.15, duration: 0.3 }}
 className="p-2.5 rounded-xl bg-black/60 border border-white/10 flex items-center justify-between gap-3 shadow-md"
 >
 <div className="flex items-center gap-3 min-w-0">
 <div className="w-9 h-12 rounded-lg bg-black border border-amber-400/40 overflow-hidden shrink-0 shadow">
 {hit.image ? (
 <img src={hit.image} alt={hit.name} className="w-full h-full object-cover" />
 ) : (
 <div className="w-full h-full flex items-center justify-center bg-amber-950/80">
 <Sparkles className="w-4 h-4 text-amber-400" />
 </div>
 )}
 </div>
 <div className="text-left min-w-0">
 <div className="text-xs font-extrabold text-white truncate">{hit.name}</div>
 <div className="text-[10px] text-amber-300 font-mono">{hit.rarity}</div>
 </div>
 </div>
 <div className="text-xs font-mono font-black text-emerald-400 shrink-0">
 ${hit.value.toFixed(2)}
 </div>
 </motion.div>
 ))
 ) : (
 <div className="text-xs text-gray-400 py-3 italic">Standard bulk cards packaged in penny sleeves</div>
 )}
 </div>

 <div className="w-full mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-mono">
 <span className="text-gray-400 font-bold">Total Pulled Value (All Cards):</span>
 <span className="text-emerald-400 font-black text-sm">${completionModal.totalValue.toFixed(2)}</span>
 </div>
 </div>

 {/* Action Button: Ship Off Order */}
 <button
 onClick={() => {
 sound.playButtonClick();
 const orderToShip = completionModal.order;
 setCompletionModal(null);
 handleStartShipping();
 }}
 className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:brightness-110 text-white font-black text-sm uppercase tracking-wider shadow-[0_4px_25px_rgba(245,158,11,0.5)] transition-all transform hover:scale-[1.02] active:scale-95 cursor-pointer flex items-center justify-center gap-2"
 >
 <Truck className="w-5 h-5 text-white animate-bounce" />
 <span>SHIP OFF ORDER FOR {completionModal.order.username} </span>
 </button>
 </motion.div>
 </motion.div>
 )}
 </AnimatePresence>
 </div>
 );
}
