import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Scissors } from 'lucide-react';
import { sound } from '../services/sound';

interface BoosterPackTearProps {
  packArts: string[];
  packArtIndex: number;
  onPrevPackArt: () => void;
  onNextPackArt: () => void;
  onTearComplete: () => void;
  setName?: string;
  packStage: 'unopened' | 'tearing' | 'opened';
  remainingCardsCount: number;
}

export const BoosterPackTear: React.FC<BoosterPackTearProps> = ({
  packArts,
  packArtIndex,
  onPrevPackArt,
  onNextPackArt,
  onTearComplete,
  setName,
  packStage,
  remainingCardsCount,
}) => {
  // Local high-performance progress state (0 to 100)
  const [progress, setProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isHoveringStack, setIsHoveringStack] = useState<boolean>(false);
  const [isAutoTearing, setIsAutoTearing] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const autoTearRafRef = useRef<number | null>(null);
  const lastScratchRef = useRef<number>(0);

  const currentPackArt = (packArts && packArts.length > 0 && packArts[packArtIndex % packArts.length]) || '/packArts/SwordAndShield-Generation/DarknessAblaze/img1.webp';

  // Helper to generate a realistic serrated foil rip edge polygon clip-path
  const getJaggedClipPath = useCallback((percent: number) => {
    if (percent <= 0) return 'none';
    if (percent >= 100) return 'polygon(0% 16%, 100% 16%, 100% 100%, 0% 100%)';

    // Top horizontal notch is roughly at 15% to 17% height
    // We create jagged teeth along the tear path across the top
    const p = Math.min(100, Math.max(0, percent));
    
    // Base polygon points: top-right to bottom-right to bottom-left to top-left untorn section
    // Then serrated teeth along the rip up to `p%`
    let clip = `polygon(${p}% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 16%`;
    
    // Add realistic jagged foil teeth between 0% and p% along the ~15.5% height seam
    const steps = Math.floor(p / 6);
    for (let i = 1; i <= steps; i++) {
      const stepX = (i / steps) * p;
      // Alternate tooth height slightly to mimic ripped metallic foil
      const toothY = 15.2 + (i % 2 === 0 ? 1.6 : -1.2) + Math.sin(i) * 0.8;
      clip += `, ${stepX.toFixed(1)}% ${toothY.toFixed(1)}%`;
    }
    
    clip += `, ${p}% 16%, ${p}% 0%)`;
    return clip;
  }, []);

  // Automated smooth tear animation when button or notch is clicked directly
  const triggerAutoTear = useCallback(() => {
    if (packStage !== 'unopened' || isAutoTearing) return;
    setIsAutoTearing(true);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (autoTearRafRef.current) cancelAnimationFrame(autoTearRafRef.current);

    let current = progress;
    const startTime = performance.now();
    const startProgress = current;
    const duration = 360; // 360ms buttery smooth rip

    const animateAuto = (now: number) => {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      // Ease out quad for snappy initial acceleration that slows nicely right at the end
      const eased = 1 - (1 - t) * (1 - t);
      current = startProgress + (100 - startProgress) * eased;

      setProgress(Math.round(current));

      // Play scratch sound periodically as auto-tear progresses
      if (now - lastScratchRef.current > 65 && current < 95) {
        sound.playFoilScratch(current);
        lastScratchRef.current = now;
      }

      if (t < 1) {
        autoTearRafRef.current = requestAnimationFrame(animateAuto);
      } else {
        setProgress(100);
        setIsAutoTearing(false);
        onTearComplete();
      }
    };

    autoTearRafRef.current = requestAnimationFrame(animateAuto);
  }, [packStage, isAutoTearing, progress, onTearComplete]);

  // Handle interactive glide / drag across top notch
  // Handle interactive glide / drag across top notch or swipe anywhere across top half
  const updateProgressFromEvent = useCallback((clientX: number, clientY: number, forceTearCheck = true) => {
    if (packStage !== 'unopened' || isAutoTearing) return;
    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;

    // Generous upper 60% of the pack is responsive to finger swipes and cursor glides
    const relativeY = (clientY - rect.top) / rect.height;
    if (relativeY > 0.60 && !isDragging) return;

    const relativeX = (clientX - rect.left) / rect.width;
    const newPercent = Math.round(Math.min(100, Math.max(0, relativeX * 100)));

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      // Allow progress to advance smoothly if swiping right or if active dragging
      if (newPercent > progress || isDragging) {
        const advanced = Math.max(progress + 3, newPercent);
        if (performance.now() - lastScratchRef.current > 60 && advanced - progress > 2) {
          sound.playFoilScratch(advanced);
          lastScratchRef.current = performance.now();
        }
        setProgress(prev => (advanced > prev ? Math.min(100, advanced) : prev));

        if (advanced >= 75 && forceTearCheck) {
          triggerAutoTear();
        }
      }
    });
  }, [packStage, isAutoTearing, isDragging, progress, triggerAutoTear]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateProgressFromEvent(e.clientX, e.clientY);
  }, [updateProgressFromEvent]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (packStage !== 'unopened') return;
    setIsDragging(true);
    updateProgressFromEvent(e.clientX, e.clientY);
  }, [packStage, updateProgressFromEvent]);

  const handleTouchStart = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (packStage !== 'unopened') return;
    setIsDragging(true);
    const touch = e.touches[0] || e.changedTouches[0];
    if (touch) updateProgressFromEvent(touch.clientX, touch.clientY);
  }, [packStage, updateProgressFromEvent]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (packStage !== 'unopened') return;
    const touch = e.touches[0] || e.changedTouches[0];
    if (touch) updateProgressFromEvent(touch.clientX, touch.clientY);
  }, [packStage, updateProgressFromEvent]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (progress > 5 && progress < 95) {
      triggerAutoTear();
    }
  }, [progress, triggerAutoTear]);

  useEffect(() => {
    if (!isDragging) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      updateProgressFromEvent(e.clientX, e.clientY);
    };

    const handleWindowPointerUp = () => {
      setIsDragging(false);
      if (progress > 5 && progress < 95) {
        triggerAutoTear();
      }
    };

    const handleWindowTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) updateProgressFromEvent(touch.clientX, touch.clientY);
    };

    const handleWindowTouchEnd = () => {
      setIsDragging(false);
      if (progress > 5 && progress < 95) {
        triggerAutoTear();
      }
    };

    window.addEventListener('pointermove', handleWindowPointerMove);
    window.addEventListener('pointerup', handleWindowPointerUp);
    window.addEventListener('touchmove', handleWindowTouchMove, { passive: false });
    window.addEventListener('touchend', handleWindowTouchEnd);
    return () => {
      window.removeEventListener('pointermove', handleWindowPointerMove);
      window.removeEventListener('pointerup', handleWindowPointerUp);
      window.removeEventListener('touchmove', handleWindowTouchMove);
      window.removeEventListener('touchend', handleWindowTouchEnd);
    };
  }, [isDragging, progress, updateProgressFromEvent, triggerAutoTear]);

  // Reset progress cleanly when pack resets to unopened
  useEffect(() => {
    if (packStage === 'unopened' && !isAutoTearing) {
      setProgress(0);
    }
  }, [packStage, isAutoTearing]);

  // Clean up RAFs on unmount
  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (autoTearRafRef.current) cancelAnimationFrame(autoTearRafRef.current);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-4 shrink-0 select-none">
      {/* Subtle non-blocking instructional pill */}
      {packStage === 'unopened' && (
        <div className="h-7 flex items-center justify-center mb-3 shrink-0">
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
            className="text-[11px] font-bold text-amber-300 bg-black/60 border border-amber-400/40 px-4 py-1 rounded-full shadow-lg flex items-center gap-2 cursor-pointer hover:border-amber-400/80 transition-all"
            onClick={triggerAutoTear}
          >
            <Scissors className="w-3.5 h-3.5 text-amber-400 -rotate-90 animate-bounce" />
            <span>Swipe finger across top notch or tap to tear open</span>
          </motion.div>
        </div>
      )}

      {/* Main Booster Pack Container */}
      <div
        ref={containerRef}
        className="relative w-64 sm:w-72 h-[25rem] sm:h-[28rem] select-none cursor-pointer group shrink-0 touch-none"
        onMouseMove={handleMouseMove}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHoveringStack(true)}
        onMouseLeave={() => {
          setIsHoveringStack(false);
          setIsDragging(false);
        }}
        onClick={() => {
          if (packStage === 'unopened') {
            triggerAutoTear();
          }
        }}
      >
        <motion.div
          animate={isHoveringStack && packStage === 'unopened' ? { scale: 1.02 } : { scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 280 }}
          className="w-full h-full relative flex items-center justify-center bg-transparent select-none"
          style={{ willChange: 'transform' }}
        >
          {/* Silver Foil Interior & Pack Seam (revealed behind the tear when progress > 0) */}
          {progress > 0 && (
            <div className="absolute top-[2%] inset-x-6 sm:inset-x-8 h-[16%] bg-gradient-to-b from-slate-900 via-[#1e2433] to-[#131722] flex items-end justify-center px-4 pt-1 border-t-2 border-slate-400/50 z-0 overflow-hidden rounded-t-2xl shadow-inner">
              <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:6px_6px] opacity-30" />
              <div className="absolute inset-0 bg-gradient-to-t from-amber-500/25 via-orange-500/10 to-transparent animate-pulse" />
              <div className="w-44 h-7 rounded-t-xl overflow-hidden border-t-2 border-x-2 border-yellow-400/80 shadow-[0_-5px_15px_rgba(234,179,8,0.45)] bg-amber-950 relative translate-y-1 z-10 flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-500/30 via-yellow-300/40 to-amber-500/30" />
                <span className="text-[8px] font-black tracking-widest text-yellow-200/90 uppercase z-20">POKÉMON TCG</span>
              </div>
            </div>
          )}

          {/* Main Booster Pack Art with Realistic Serrated Clip-Path */}
          <div
            className="w-full h-full relative z-10 transition-none flex items-center justify-center"
            style={progress > 0 && packStage === 'unopened' ? {
              clipPath: getJaggedClipPath(progress)
            } : {}}
          >
            <img
              src={currentPackArt}
              fetchPriority="high"
              decoding="sync"
              onError={(e) => {
                const img = e.target as HTMLImageElement;
                const universalFallback = '/packArts/SwordAndShield-Generation/DarknessAblaze/img1.webp';
                const firstArt = (packArts && packArts[0]) || universalFallback;
                if (img.src !== window.location.origin + firstArt && img.src !== firstArt) {
                  img.src = firstArt;
                } else if (img.src !== window.location.origin + universalFallback && img.src !== universalFallback) {
                  img.src = universalFallback;
                }
              }}
              alt="Pokemon Booster Pack"
              className="w-full h-full object-contain filter drop-shadow-[0_25px_50px_rgba(0,0,0,0.88)] select-none"
            />
            {/* Holographic Sheen Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/15 to-transparent opacity-35 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none mix-blend-overlay" />
          </div>

          {/* Subtle Hover & Crimp Guide on Top Notch when Untorn */}
          {progress === 0 && packStage === 'unopened' && (
            <div className="absolute top-[14.5%] inset-x-4 h-5 flex items-center justify-between px-2 pointer-events-none z-20 opacity-60 group-hover:opacity-100 transition-opacity">
              <div className="w-full border-t-2 border-dashed border-amber-400/80 shadow-[0_0_10px_rgba(245,158,11,0.6)]" />
              <div className="absolute left-1/2 -translate-x-1/2 bg-black/80 px-2 py-0.5 rounded text-[9px] font-extrabold text-amber-300 border border-amber-400/40 shadow">
                TEAR HERE
              </div>
            </div>
          )}

          {/* Interactive Peeling Metallic Foil Flap tracking exact cursor progress */}
          {progress > 1 && progress < 98 && packStage === 'unopened' && (
            <div
              className="absolute top-[2%] z-30 pointer-events-none transition-none origin-bottom-right"
              style={{
                left: `${progress}%`,
                transform: `translateX(-95%) rotate(-${22 + progress * 0.16}deg) skewX(-14deg) scale(1.04)`
              }}
            >
              <div className="w-16 sm:w-22 h-8 bg-gradient-to-tr from-slate-300 via-white to-slate-400 rounded-tl-xl shadow-[-10px_14px_24px_rgba(0,0,0,0.95)] border border-white/95 flex items-center justify-center relative overflow-hidden">
                {/* Holographic rainbow reflection inside peeled foil tab */}
                <div className="w-full h-full bg-[linear-gradient(135deg,rgba(239,68,68,0.25)_0%,rgba(234,179,8,0.35)_30%,rgba(59,130,246,0.35)_65%,rgba(168,85,247,0.3)_100%)] rounded-tl-xl mix-blend-overlay" />
                <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-black/30" />
                <div className="absolute -left-1 w-2 h-full bg-slate-400/50 skew-x-[20deg]" />
              </div>
              <div className="absolute -bottom-1 -right-1 text-sm animate-ping">✨</div>
            </div>
          )}

          {/* Severed Top Crimp Flying Off Physics Animation (During Tearing Stage) */}
          <AnimatePresence>
            {packStage === 'tearing' && (
              <motion.div
                initial={{ y: 0, x: 0, rotateZ: 0, opacity: 1 }}
                animate={{ y: -90, x: 70, rotateZ: 45, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.58, ease: 'easeOut' }}
                className="absolute top-0 inset-x-0 h-[15.5%] z-40 pointer-events-none flex items-start justify-center overflow-hidden"
              >
                <img
                  src={currentPackArt}
                  alt="Torn Top Notch"
                  className="w-full h-[28rem] object-contain filter drop-shadow-2xl"
                  style={{ objectPosition: 'top' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Card Emerging Inside Pack (FACE DOWN) during Tearing Stage */}
          <AnimatePresence>
            {packStage === 'tearing' && remainingCardsCount > 0 && (
              <motion.div
                initial={{ y: 160, scale: 0.72, opacity: 0 }}
                animate={{ y: -85, scale: 1.05, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.65, ease: [0.2, 0.8, 0.2, 1] }}
                className="absolute top-0 inset-x-6 h-[19rem] sm:h-[21rem] z-20 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(245,158,11,0.65)] pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at center, #1c1c24 0%, #0d0d0f 100%)',
                  border: '3px solid rgba(245,158,11,0.45)'
                }}
              >
                <div className="absolute inset-2 rounded-xl border-2 border-amber-500/30 flex flex-col items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-500/15 via-transparent to-transparent">
                  <div className="w-20 h-20 rounded-full border-4 border-amber-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(245,158,11,0.4)] bg-[#14141c]/90">
                    <Sparkles className="w-10 h-10 text-amber-400 animate-pulse" />
                  </div>
                  <span className="mt-3 text-xs font-black tracking-wider text-amber-300 uppercase opacity-90 text-center px-2 line-clamp-2">
                    {setName || 'POKÉMON TCG'}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Button */}
      {packStage === 'unopened' && (
        <div className="flex flex-col items-center gap-3.5 mt-6 z-20 shrink-0">
          <motion.button
            onClick={triggerAutoTear}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3.5 rounded-full bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 font-extrabold text-sm sm:text-base text-white shadow-[0_0_30px_rgba(244,63,94,0.5)] hover:shadow-[0_0_45px_rgba(244,63,94,0.85)] transition-all cursor-pointer flex items-center gap-2.5 border border-white/30"
          >
            <Scissors className="w-5 h-5 -rotate-90 text-amber-200" />
            <span>Tear Open Booster Pack!</span>
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default React.memo(BoosterPackTear);
