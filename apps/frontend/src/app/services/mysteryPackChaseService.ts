import { MysteryPackConfig } from '../data/mysteryPacks';
import { fetchSetDetails, getRealCardPrice, getCardImageUrl, PokemonCard, cardFullCache } from './tcgdex';
import { scrydexCardFullCache } from './scrydex';
import { preloadSingleImage } from './imagePreloader';

export interface MysteryPackChaseCard {
  card: PokemonCard;
  value: number;
  setName: string;
}

const mysteryPackChaseCache = new Map<string, MysteryPackChaseCard[]>();

/**
 * Background Service for Mystery Pack Chase Cards:
 * Inspects ALL sets included in a Mystery Pack (mysteryPack.setIds),
 * extracts JUST the top 3 chase cards from each set (aggregating 30+ candidate cards),
 * sorts them by market value descending, and returns the TOP 12 overall.
 */
export async function getMysteryPackChaseCards(mysteryPack: MysteryPackConfig): Promise<MysteryPackChaseCard[]> {
  if (!mysteryPack || !mysteryPack.setIds || mysteryPack.setIds.length === 0) {
    return [];
  }

  // 1. Return cached results if available
  if (mysteryPackChaseCache.has(mysteryPack.id)) {
    return mysteryPackChaseCache.get(mysteryPack.id)!;
  }

  const aggregatedCandidates: MysteryPackChaseCard[] = [];

  // 2. Inspect all sets in parallel
  const setPromises = mysteryPack.setIds.map(async (setId) => {
    try {
      const setDetails = await fetchSetDetails(setId);
      if (!setDetails || !setDetails.cards || setDetails.cards.length === 0) {
        return [];
      }

      // Filter non-energy cards
      const candidates = setDetails.cards.filter(c => 
        !c.name.toLowerCase().includes('energy') && 
        !c.id.toLowerCase().includes('energy')
      );

      // Map and calculate real market prices
      const mapped = candidates.map((card, idx) => {
        const cached = cardFullCache.get(card.id) || scrydexCardFullCache.get(card.id);
        const baseUrl = cached?.image || card.image || `https://assets.tcgdex.net/en/swsh/${setDetails.id}/${card.localId || card.id?.split('-').pop() || idx + 1}`;
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
          setName: setDetails.name || setId.toUpperCase()
        };
      });

      // Filter out low-value plain item trainers under $10
      const filtered = mapped.filter(item => {
        const r = (item.card.rarity || '').toLowerCase();
        const n = (item.card.name || '').toLowerCase();
        const isPlainItem = (n.includes('balloon') || n.includes('candy') || n.includes('switch') || n.includes('potion') || n.includes('ball') || n.includes('rope')) && !r.includes('secret') && !r.includes('gold') && !r.includes('special');
        if (isPlainItem && item.value < 10) return false;
        return item.value >= 1.50 || r.includes('secret') || r.includes('illustration') || r.includes('ultra') || r.includes('vmax') || r.includes('vstar') || r.includes('ex') || r.includes('gx') || r.includes('holo');
      });

      // Sort by value descending and pick top 3 for this set
      filtered.sort((a, b) => b.value - a.value);
      return filtered.slice(0, 3);
    } catch (err) {
      console.warn(`Background mystery chase fetch failed for set ${setId}:`, err);
      return [];
    }
  });

  const results = await Promise.allSettled(setPromises);
  results.forEach(res => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      aggregatedCandidates.push(...res.value);
    }
  });

  // 3. Remove duplicate card IDs if any
  const uniqueMap = new Map<string, MysteryPackChaseCard>();
  for (const item of aggregatedCandidates) {
    if (!uniqueMap.has(item.card.id)) {
      uniqueMap.set(item.card.id, item);
    }
  }

  const uniqueCandidates = Array.from(uniqueMap.values());

  // 4. Sort aggregated candidates (30+ cards) by market value descending and take top 12
  uniqueCandidates.sort((a, b) => b.value - a.value);
  const top12Chase = uniqueCandidates.slice(0, 12);

  // 5. Store in cache & preload thumbnail images
  mysteryPackChaseCache.set(mysteryPack.id, top12Chase);

  const topUrls: string[] = [];
  top12Chase.forEach(item => {
    if (item.card.images?.large) topUrls.push(item.card.images.large);
    if (item.card.images?.small) topUrls.push(item.card.images.small);
  });
  void Promise.allSettled(topUrls.map(url => preloadSingleImage(url, 4000)));

  return top12Chase;
}
