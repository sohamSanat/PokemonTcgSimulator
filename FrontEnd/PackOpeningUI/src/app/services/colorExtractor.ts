// High-performance canvas majority color extraction with in-memory caching
export interface ExtractedColor {
  edge: string; // Vibrant HSL for card edge border
  glow: string; // Intense HSL for radial glow and rim highlight
  rgb: string;  // Raw 'R, G, B' string for custom RGBA calculations
  hex: string;  // Hex code if needed
}

const colorCache = new Map<string, ExtractedColor>();

// Fallback dynamic colors mapped by Pokemon Type with personalized variation based on card name
const TYPE_COLOR_BASES: Record<string, { h: number; s: number; l: number }> = {
  grass: { h: 110, s: 80, l: 55 },
  water: { h: 195, s: 90, l: 58 },
  fire: { h: 12, s: 92, l: 58 },
  lightning: { h: 48, s: 95, l: 58 },
  psychic: { h: 280, s: 75, l: 62 },
  fighting: { h: 28, s: 85, l: 55 },
  darkness: { h: 190, s: 85, l: 40 },
  dark: { h: 190, s: 85, l: 40 },
  metal: { h: 185, s: 35, l: 70 },
  steel: { h: 185, s: 35, l: 70 },
  dragon: { h: 45, s: 85, l: 50 },
  fairy: { h: 325, s: 88, l: 75 },
  colorless: { h: 40, s: 40, l: 75 },
  normal: { h: 40, s: 40, l: 75 },
};

function rgbToHsl(r: number, g: number, b: number): { h: number; s: number; l: number } {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb(h: number, s: number, l: number): { r: number; g: number; b: number } {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(255 * f(0)),
    g: Math.round(255 * f(8)),
    b: Math.round(255 * f(4))
  };
}

export function getFallbackColor(cardType = 'colorless', cardName = ''): ExtractedColor {
  const base = TYPE_COLOR_BASES[cardType.toLowerCase()] || TYPE_COLOR_BASES.colorless;
  
  // Create a slight personal variation (+/- 12 deg hue, +/- 8% sat) based on card name hash
  let hash = 0;
  for (let i = 0; i < cardName.length; i++) {
    hash = (hash << 5) - hash + cardName.charCodeAt(i);
    hash |= 0;
  }
  const hueShift = (hash % 25); // -12 to +12
  const satShift = ((hash >> 4) % 15);
  
  const h = (base.h + hueShift + 360) % 360;
  const s = Math.min(100, Math.max(50, base.s + satShift));
  const l = Math.min(80, Math.max(45, base.l));
  
  const rgb = hslToRgb(h, s, l);
  return {
    edge: `hsl(${h}, ${Math.min(100, s + 15)}%, ${Math.min(82, l + 18)}%)`,
    glow: `hsl(${h}, ${Math.min(100, s + 10)}%, ${l}%)`,
    rgb: `${rgb.r}, ${rgb.g}, ${rgb.b}`,
    hex: `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`
  };
}

// Shared offscreen canvas context to eliminate canvas DOM allocation churn in Firefox
let sharedCanvas: HTMLCanvasElement | null = null;
let sharedCtx: CanvasRenderingContext2D | null = null;

function getSharedCtx(size: number): CanvasRenderingContext2D | null {
  if (typeof document === 'undefined') return null;
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = size;
    sharedCanvas.height = size;
    sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });
  }
  return sharedCtx;
}

/**
 * Extracts the true majority / dominant color from a card artwork image using an offscreen canvas.
 * Filters out silver/grey card edges to capture the vibrant personality of each individual Pokemon card.
 */
export function extractMajorityColor(
  imageUrl: string,
  cardType = 'colorless',
  cardName = '',
  onExtracted?: (color: ExtractedColor) => void
): ExtractedColor {
  const cacheKey = `${imageUrl || ''}_${cardType}_${cardName}`;
  if (colorCache.has(cacheKey)) {
    const cached = colorCache.get(cacheKey)!;
    if (onExtracted) onExtracted(cached);
    return cached;
  }

  const fallback = getFallbackColor(cardType, cardName);
  if (!imageUrl) {
    colorCache.set(cacheKey, fallback);
    return fallback;
  }

  // Attempt async canvas extraction
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  img.onload = () => {
    // Schedule canvas processing asynchronously so main thread doesn't lock Firefox UI
    setTimeout(() => {
      try {
        const SIZE = 24;
        const ctx = getSharedCtx(SIZE);
        if (!ctx) return;

        ctx.clearRect(0, 0, SIZE, SIZE);
        ctx.drawImage(img, 0, 0, SIZE, SIZE);

        const imageData = ctx.getImageData(0, 0, SIZE, SIZE).data;
        const clusters = new Map<string, { sumR: number; sumG: number; sumB: number; count: number; score: number }>();

        for (let y = 0; y < SIZE; y++) {
          for (let x = 0; x < SIZE; x++) {
            const idx = (y * SIZE + x) * 4;
            const r = imageData[idx];
            const g = imageData[idx + 1];
            const b = imageData[idx + 2];
            const a = imageData[idx + 3];

            if (a < 128) continue; // Skip transparent

            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            const vibrancy = Math.max(r, g, b) - Math.min(r, g, b);

            // Skip pure black or pure white or extreme dark borders
            if (brightness < 18 || brightness > 245) continue;

            // If near outer border (top/bottom 15%) and low saturation (grey/silver foil frame), apply heavy downweight
            const isBorder = (y < SIZE * 0.15 || y > SIZE * 0.88 || x < SIZE * 0.08 || x > SIZE * 0.92);
            if (isBorder && vibrancy < 35) continue;

            // Group colors into quantized buckets of 24
            const bucketR = Math.round(r / 24) * 24;
            const bucketG = Math.round(g / 24) * 24;
            const bucketB = Math.round(b / 24) * 24;
            const bucketKey = `${bucketR},${bucketG},${bucketB}`;

            // Score formula: prioritize color frequency + vibrancy
            let score = (vibrancy * 2.5) + (100 - Math.abs((r + g + b) / 3 - 140) * 0.8);
            if (isBorder) score *= 0.3; // heavily penalize border pixels

            if (!clusters.has(bucketKey)) {
              clusters.set(bucketKey, { sumR: r, sumG: g, sumB: b, count: 1, score });
            } else {
              const c = clusters.get(bucketKey)!;
              c.sumR += r;
              c.sumG += g;
              c.sumB += b;
              c.count += 1;
              c.score += score;
            }
          }
        }

        let maxScore = -1;
        let bestCluster: { sumR: number; sumG: number; sumB: number; count: number; score: number } | null = null;

        for (const cluster of clusters.values()) {
          if (cluster.score > maxScore) {
            maxScore = cluster.score;
            bestCluster = cluster;
          }
        }

        if (bestCluster && bestCluster.count > 0) {
          const avgR = Math.round(bestCluster.sumR / bestCluster.count);
          const avgG = Math.round(bestCluster.sumG / bestCluster.count);
          const avgB = Math.round(bestCluster.sumB / bestCluster.count);

          const { h, s, l } = rgbToHsl(avgR, avgG, avgB);
          
          // Ensure the edge outline is sharp, luminous and vivid
          const edgeS = Math.min(100, Math.max(65, s + 20));
          const edgeL = Math.min(84, Math.max(58, l + 15));
          const glowS = Math.min(100, Math.max(60, s + 10));
          const glowL = Math.min(78, Math.max(48, l));

          const extracted: ExtractedColor = {
            edge: `hsl(${h}, ${edgeS}%, ${edgeL}%)`,
            glow: `hsl(${h}, ${glowS}%, ${glowL}%)`,
            rgb: `${avgR}, ${avgG}, ${avgB}`,
            hex: `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`
          };

          colorCache.set(cacheKey, extracted);
          if (onExtracted) onExtracted(extracted);
        } else {
          colorCache.set(cacheKey, fallback);
          if (onExtracted) onExtracted(fallback);
        }
      } catch {
        colorCache.set(cacheKey, fallback);
        if (onExtracted) onExtracted(fallback);
      }
    }, 10);
  };

  img.onerror = () => {
    colorCache.set(cacheKey, fallback);
    if (onExtracted) onExtracted(fallback);
  };

  return fallback;
}
