import { MysteryPackConfig } from '../data/mysteryPacks';
import { fetchSetDetails, fetchCardFull, getRealCardPrice, getCardImageUrl, getTCGDexValidAssetPath, PokemonCard, cardFullCache } from './tcgdex';
import { scrydexCardFullCache, loadJapaneseMetadata } from './scrydex';
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

  await loadJapaneseMetadata().catch(() => {});

  const aggregatedCandidates: MysteryPackChaseCard[] = [];

  // Helper candidate scoring function to select top cards per set for full price details fetch
  const getCandidateScore = (card: any) => {
    let score = 0;
    const r = (card.rarity || '').toLowerCase();
    const n = (card.name || '').toLowerCase();

    if (r.includes('special illustration') || r.includes('sir') || r.includes('sar') || r.includes('hyper') || r.includes('gold') || r.includes('secret')) score += 500;
    else if (r.includes('illustration rare') || r.includes('ir') || r.includes('character rare') || r.includes('chr')) score += 300;
    else if (r.includes('ultra rare') || r.includes('full art') || r.includes('vmax') || r.includes('vstar') || r.includes('ex') || r.includes('gx') || r.includes('ace spec')) score += 200;
    else if (r.includes('double rare') || r.includes('rare') || r.includes('holo')) score += 100;

    if (/charizard|pikachu|umbreon|rayquaza|mewtwo|lugia|gengar|giratina|arceus|mew|eevee|latias|latios|gardevoir|blastoise|venusaur/i.test(n)) score += 150;
    if (n.includes('vmax') || n.includes('vstar') || n.includes(' mega') || n.includes(' ex') || n.endsWith('ex') || n.includes('gx')) score += 50;

    if ((n.includes('energy') || n.includes('candy') || n.includes('balloon') || n.includes('switch') || n.includes('ball') || n.includes('potion') || n.includes('rope')) && !r.includes('secret') && !r.includes('gold') && !r.includes('special')) {
      score -= 400;
    }
    return score;
  };

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

      // Score and select top candidates for live market pricing fetch
      const sortedCandidates = [...candidates].sort((a, b) => getCandidateScore(b) - getCandidateScore(a));
      const topCandidatesForSet = sortedCandidates.slice(0, Math.min(sortedCandidates.length, 12));

      // Fetch full card details (pricing, tcgplayer, cardmarket data) for candidate cards
      await Promise.allSettled(topCandidatesForSet.map(c => fetchCardFull(c.id, true)));

      // Map cards with populated pricing and set details
      const mapped = topCandidatesForSet.map((card, idx) => {
        const cached = cardFullCache.get(card.id) || scrydexCardFullCache.get(card.id);
        const cardSetId = setDetails.id || setId;
        const rawNum = card.localId || card.id?.split('-').pop() || `${idx + 1}`;
        const baseUrl = cached?.image || card.image || getTCGDexValidAssetPath(cardSetId, rawNum);
        
        const poke: PokemonCard = {
          ...card,
          id: cached?.id || card.id,
          name: cached?.name || card.name,
          images: {
            small: getCardImageUrl(baseUrl, 'low'),
            large: getCardImageUrl(baseUrl, 'high'),
          },
          set: {
            id: cardSetId,
            name: setDetails.name || setId.toUpperCase()
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

