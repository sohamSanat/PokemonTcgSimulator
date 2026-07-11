import React, { useRef, useEffect } from 'react';

export interface HoloPointerState {
  xPercent: number;
  yPercent: number;
  opacity: number;
  interacting: boolean;
  onUpdate?: () => void;
}

interface CardHoloCanvasProps {
  normalizedRarity: string;
  cardType?: string;
  isStandardArtBox: boolean;
  pointerRef: React.RefObject<HoloPointerState>;
}

// In-memory image cache for fast texture rendering without re-fetching
const imgCache: { [key: string]: HTMLImageElement | null } = {
  glitter: null,
  cosmos: null,
  vmax: null,
  grain: null,
};

let imagesRequested = false;
function preloadHoloImages() {
  if (imagesRequested || typeof window === 'undefined') return;
  imagesRequested = true;

  const toLoad = [
    { key: 'glitter', url: '/img/glitter.png' },
    { key: 'cosmos', url: '/img/cosmos-bottom.png' },
    { key: 'vmax', url: '/img/vmaxbg.jpg' },
    { key: 'grain', url: '/img/grain.webp' },
  ];

  toLoad.forEach(({ key, url }) => {
    const img = new Image();
    img.src = url;
    img.onload = () => {
      imgCache[key] = img;
    };
  });
}

export const CardHoloCanvas: React.FC<CardHoloCanvasProps> = ({
  normalizedRarity,
  isStandardArtBox,
  pointerRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafId = useRef<number | null>(null);
  const rafRunningRef = useRef<boolean>(false);

  // Smooth lerped state to ensure buttery 120/144 FPS feel
  const stateRef = useRef({
    curX: 50,
    curY: 50,
    curOpacity: 0,
    lastDrawnX: -999,
    lastDrawnY: -999,
    lastDrawnOpacity: -999,
  });

  useEffect(() => {
    preloadHoloImages();
  }, []);

  useEffect(() => {
    let lastWidth = 0;
    let lastHeight = 0;
    let isCleared = true;

    const render = () => {
      const canvas = canvasRef.current;
      const pointer = pointerRef.current;
      if (!canvas || !pointer) {
        rafRunningRef.current = false;
        return;
      }

      const state = stateRef.current;

      // Smooth lerp towards pointer state (faster 0.22 damping for snappy yet liquid feel)
      state.curX += (pointer.xPercent - state.curX) * 0.22;
      state.curY += (pointer.yPercent - state.curY) * 0.22;
      state.curOpacity += (pointer.opacity - state.curOpacity) * 0.22;

      // If opacity is near zero and pointer is at zero, clear once and SLEEP to guarantee 0% CPU idle usage!
      if (state.curOpacity < 0.005 && pointer.opacity === 0) {
        if (!isCleared) {
          const ctx = canvas.getContext('2d');
          if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
          isCleared = true;
        }
        rafRunningRef.current = false;
        return; // Stops requestAnimationFrame loop completely!
      }

      isCleared = false;

      // Skip redrawing if sub-pixel state has already converged (dirty check optimization)
      if (
        Math.abs(state.curX - state.lastDrawnX) < 0.04 &&
        Math.abs(state.curY - state.lastDrawnY) < 0.04 &&
        Math.abs(state.curOpacity - state.lastDrawnOpacity) < 0.004 &&
        pointer.opacity === state.curOpacity
      ) {
        if (pointer.opacity === 0) {
          rafRunningRef.current = false;
          return;
        }
        rafId.current = requestAnimationFrame(render);
        return;
      }

      state.lastDrawnX = state.curX;
      state.lastDrawnY = state.curY;
      state.lastDrawnOpacity = state.curOpacity;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        rafId.current = requestAnimationFrame(render);
        return;
      }

      const dpr = window.devicePixelRatio || 1;
      const width = Math.round(rect.width * dpr);
      const height = Math.round(rect.height * dpr);

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        lastWidth = width;
        lastHeight = height;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        rafId.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);
      ctx.globalAlpha = Math.min(1, Math.max(0, state.curOpacity));

      const px = (state.curX / 100) * width;
      const py = (state.curY / 100) * height;

      // Standard illustration window boundaries (for cards where holo is only on the artwork)
      const boxX = width * 0.078;
      const boxY = height * 0.115;
      const boxW = width * (1 - 0.078 * 2);
      const boxH = height * (1 - 0.115 - 0.455);

      // =========================================================================
      // 1. COMMON / UNCOMMON (Clean Paper Gloss)
      // =========================================================================
      if (normalizedRarity === 'common' || normalizedRarity === 'uncommon') {
        const rad = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        rad.addColorStop(0, 'rgba(255, 255, 255, 0.18)');
        rad.addColorStop(0.5, 'rgba(255, 255, 255, 0.03)');
        rad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 2. HOLO RARE (Refined, crystal-clear diagonal rainbow band inside art box)
      // =========================================================================
      if (normalizedRarity === 'rare holo') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();

        // Narrow, graceful diagonal spectrum band that glides over the artwork when tilted
        const shift = (state.curX - 50) * 2.2 + (state.curY - 50) * 1.5;
        const grad = ctx.createLinearGradient(
          boxX + shift - boxW * 0.3,
          boxY - shift - boxH * 0.3,
          boxX + shift + boxW * 0.7,
          boxY - shift + boxH * 0.7
        );
        grad.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
        grad.addColorStop(0.2, 'rgba(215, 150, 255, 0.22)'); // soft lavender
        grad.addColorStop(0.4, 'rgba(140, 220, 255, 0.22)'); // soft sky blue
        grad.addColorStop(0.6, 'rgba(160, 255, 190, 0.22)'); // soft mint
        grad.addColorStop(0.8, 'rgba(255, 240, 150, 0.22)'); // soft sunlight
        grad.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = grad;
        ctx.fillRect(boxX, boxY, boxW, boxH);

        // Delicate shimmer highlight bar over the artwork
        const shim = ctx.createLinearGradient(px - boxW * 0.5, py - boxH * 0.5, px + boxW * 0.5, py + boxH * 0.5);
        shim.addColorStop(0.0, 'rgba(255, 255, 255, 0)');
        shim.addColorStop(0.48, 'rgba(255, 255, 255, 0.26)');
        shim.addColorStop(0.52, 'rgba(255, 255, 255, 0.26)');
        shim.addColorStop(1.0, 'rgba(255, 255, 255, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = shim;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.restore();

        // Subtle overall focal card gloss
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.8);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        glare.addColorStop(0.6, 'rgba(255, 255, 255, 0.03)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 3. COSMOS HOLO (Starry Galaxy inside Illustration Window)
      // =========================================================================
      if (normalizedRarity === 'rare holo cosmos') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip();

        if (imgCache.cosmos) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.38;
          const ox = (50 - state.curX) * 0.3;
          const oy = (50 - state.curY) * 0.3;
          ctx.drawImage(imgCache.cosmos, boxX + ox - 20, boxY + oy - 20, boxW + 40, boxH + 40);
        }

        // Soft galaxy nebula sheen
        const cGrad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        cGrad.addColorStop(0, 'rgba(170, 235, 255, 0.2)');
        cGrad.addColorStop(0.5, 'rgba(235, 170, 255, 0.2)');
        cGrad.addColorStop(1, 'rgba(255, 235, 170, 0.2)');
        ctx.globalCompositeOperation = 'soft-light';
        ctx.fillStyle = cGrad;
        ctx.fillRect(boxX, boxY, boxW, boxH);
        ctx.restore();

        ctx.globalAlpha = state.curOpacity;
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 4. DOUBLE RARE / POKÉMON V / EX (Sleek Metallic Beams)
      // =========================================================================
      if (normalizedRarity === 'double rare') {
        ctx.globalCompositeOperation = 'soft-light';
        const shiftX = (state.curX - 50) * 4;
        const vGrad = ctx.createLinearGradient(0 + shiftX, 0, width + shiftX, height);
        vGrad.addColorStop(0, 'rgba(160, 230, 255, 0.24)');
        vGrad.addColorStop(0.35, 'rgba(230, 170, 255, 0.24)');
        vGrad.addColorStop(0.65, 'rgba(255, 230, 170, 0.24)');
        vGrad.addColorStop(1, 'rgba(160, 230, 255, 0.24)');
        ctx.fillStyle = vGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const mGrad = ctx.createLinearGradient(px - width * 0.45, py - height * 0.45, px + width * 0.45, py + height * 0.45);
        mGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        mGrad.addColorStop(0.5, 'rgba(235, 245, 255, 0.28)');
        mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = mGrad;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 5. VMAX / VSTAR / ACE SPEC (Textured Wave Holo)
      // =========================================================================
      if (normalizedRarity === 'rare holo vmax') {
        if (imgCache.vmax) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.32;
          const vx = (50 - state.curX) * 0.4;
          const vy = (50 - state.curY) * 0.4;
          ctx.drawImage(imgCache.vmax, vx - 30, vy - 30, width + 60, height + 60);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const wGrad = ctx.createLinearGradient(0, py - height * 0.5, width, py + height * 0.5);
        wGrad.addColorStop(0, 'rgba(255, 130, 160, 0.24)');
        wGrad.addColorStop(0.35, 'rgba(130, 220, 255, 0.24)');
        wGrad.addColorStop(0.65, 'rgba(220, 130, 255, 0.24)');
        wGrad.addColorStop(1, 'rgba(255, 235, 130, 0.24)');
        ctx.fillStyle = wGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.7);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 6. ULTRA RARE (Full Art Metallic Luster)
      // =========================================================================
      if (normalizedRarity === 'ultra rare') {
        ctx.globalCompositeOperation = 'soft-light';
        const uGrad = ctx.createLinearGradient(px - width * 0.6, py - height * 0.6, px + width * 0.6, py + height * 0.6);
        uGrad.addColorStop(0, 'rgba(210, 235, 255, 0.22)');
        uGrad.addColorStop(0.4, 'rgba(255, 190, 245, 0.26)');
        uGrad.addColorStop(0.6, 'rgba(190, 255, 235, 0.26)');
        uGrad.addColorStop(1, 'rgba(210, 235, 255, 0.22)');
        ctx.fillStyle = uGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 7. SPECIAL ILLUSTRATION RARE (SIR / SAR)
      // =========================================================================
      if (normalizedRarity === 'special illustration rare') {
        if (imgCache.glitter) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.38;
          const gx = (50 - state.curX) * 0.25;
          const gy = (50 - state.curY) * 0.25;
          ctx.drawImage(imgCache.glitter, gx - 20, gy - 20, width + 40, height + 40);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const sGrad = ctx.createRadialGradient(px, py, 10, px, py, width * 0.9);
        sGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        sGrad.addColorStop(0.4, 'rgba(255, 170, 200, 0.2)');
        sGrad.addColorStop(0.7, 'rgba(170, 240, 255, 0.2)');
        sGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = sGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.25)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 8. ILLUSTRATION RARE (IR / Art Rare - Delicate Painterly Sheen)
      // =========================================================================
      if (normalizedRarity === 'illustration rare') {
        ctx.globalCompositeOperation = 'soft-light';
        const iGrad = ctx.createRadialGradient(px, py, 10, px, py, width * 0.85);
        iGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        iGrad.addColorStop(0.4, 'rgba(200, 240, 255, 0.18)');
        iGrad.addColorStop(0.8, 'rgba(240, 200, 255, 0.16)');
        iGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = iGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.7);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 9. RADIANT RARE (Amazing Rare / Diamond Spectrum)
      // =========================================================================
      if (normalizedRarity === 'radiant rare') {
        ctx.globalCompositeOperation = 'screen';
        const rGrad = ctx.createLinearGradient(0, py - height * 0.5, width, py + height * 0.5);
        rGrad.addColorStop(0, 'rgba(255, 140, 155, 0.25)');
        rGrad.addColorStop(0.35, 'rgba(255, 235, 140, 0.25)');
        rGrad.addColorStop(0.65, 'rgba(140, 255, 185, 0.25)');
        rGrad.addColorStop(1, 'rgba(155, 185, 255, 0.25)');
        ctx.fillStyle = rGrad;
        ctx.fillRect(0, 0, width, height);

        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.65);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 10. TRAINER GALLERY (TG / GG - Starlight Sparkle)
      // =========================================================================
      if (normalizedRarity === 'trainer gallery') {
        if (imgCache.glitter) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.36;
          const gx = (50 - state.curX) * 0.25;
          const gy = (50 - state.curY) * 0.25;
          ctx.drawImage(imgCache.glitter, gx - 20, gy - 20, width + 40, height + 40);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const tGrad = ctx.createRadialGradient(px, py, 10, px, py, width * 0.85);
        tGrad.addColorStop(0, 'rgba(255, 255, 255, 0.28)');
        tGrad.addColorStop(0.5, 'rgba(255, 230, 160, 0.18)');
        tGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = tGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.7);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 11. SECRET GOLD RARE (Rich Golden Sparkle)
      // =========================================================================
      if (normalizedRarity === 'rare secret') {
        if (imgCache.glitter) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.4;
          const gx = (50 - state.curX) * 0.25;
          const gy = (50 - state.curY) * 0.25;
          ctx.drawImage(imgCache.glitter, gx - 20, gy - 20, width + 40, height + 40);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const gGrad = ctx.createRadialGradient(px, py, 0, px, py, width * 0.95);
        gGrad.addColorStop(0, 'rgba(255, 255, 255, 0.35)');
        gGrad.addColorStop(0.35, 'rgba(254, 240, 138, 0.32)'); // #fef08a
        gGrad.addColorStop(0.7, 'rgba(253, 224, 71, 0.24)');  // #fde047
        gGrad.addColorStop(1, 'rgba(217, 119, 6, 0.08)');    // #d97706
        ctx.fillStyle = gGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.26)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 12. RAINBOW RARE (Hyper Rare Pastel Spectrum)
      // =========================================================================
      if (normalizedRarity === 'rare rainbow') {
        if (imgCache.glitter) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.35;
          const gx = (50 - state.curX) * 0.25;
          const gy = (50 - state.curY) * 0.25;
          ctx.drawImage(imgCache.glitter, gx - 20, gy - 20, width + 40, height + 40);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const shift = (state.curX - 50) * 3;
        const rbGrad = ctx.createLinearGradient(0 + shift, 0, width + shift, height);
        rbGrad.addColorStop(0, 'rgba(255, 175, 185, 0.28)');
        rbGrad.addColorStop(0.25, 'rgba(255, 235, 175, 0.28)');
        rbGrad.addColorStop(0.5, 'rgba(175, 255, 195, 0.28)');
        rbGrad.addColorStop(0.75, 'rgba(175, 225, 255, 0.28)');
        rbGrad.addColorStop(1, 'rgba(225, 175, 255, 0.28)');
        ctx.fillStyle = rbGrad;
        ctx.fillRect(0, 0, width, height);

        ctx.globalCompositeOperation = 'screen';
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.24)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }

      // =========================================================================
      // 13. REVERSE HOLO (Outer Border Sheen Only)
      // =========================================================================
      if (normalizedRarity === 'reverse holo') {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, width, height);
        ctx.rect(boxX, boxY, boxW, boxH);
        ctx.clip('evenodd');

        if (imgCache.grain) {
          ctx.globalCompositeOperation = 'screen';
          ctx.globalAlpha = state.curOpacity * 0.32;
          ctx.drawImage(imgCache.grain, 0, 0, width, height);
        }

        ctx.globalAlpha = state.curOpacity;
        ctx.globalCompositeOperation = 'soft-light';
        const revGrad = ctx.createLinearGradient(0, py - height * 0.5, width, py + height * 0.5);
        revGrad.addColorStop(0, 'rgba(200, 235, 255, 0.24)');
        revGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.32)');
        revGrad.addColorStop(1, 'rgba(235, 200, 255, 0.24)');
        ctx.fillStyle = revGrad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        ctx.globalAlpha = state.curOpacity;
        const glare = ctx.createRadialGradient(px, py, 0, px, py, width * 0.75);
        glare.addColorStop(0, 'rgba(255, 255, 255, 0.22)');
        glare.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = glare;
        ctx.fillRect(0, 0, width, height);
        rafId.current = requestAnimationFrame(render);
        return;
      }
    };

    // Attach wakeup listener so we only spin the loop when actively interacting
    if (pointerRef.current) {
      pointerRef.current.onUpdate = () => {
        if (!rafRunningRef.current) {
          rafRunningRef.current = true;
          rafId.current = requestAnimationFrame(render);
        }
      };
    }

    // Start initially if active right now
    if (pointerRef.current?.opacity > 0) {
      rafRunningRef.current = true;
      rafId.current = requestAnimationFrame(render);
    }

    return () => {
      rafRunningRef.current = false;
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [normalizedRarity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-[var(--card-radius)]"
      style={{
        display: 'block',
      }}
    />
  );
};

export default React.memo(CardHoloCanvas);
