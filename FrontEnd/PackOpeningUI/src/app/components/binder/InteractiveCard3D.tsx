import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Card } from './types';
import { getTCGDexValidAssetPath, getCardImageUrl, handleCardImageError, type PokemonCard } from '../../services/tcgdex';
import { extractMajorityColor, getFallbackColor, type ExtractedColor } from '../../services/colorExtractor';

interface CardInput {
  id?: string | number;
  name?: string;
  rarity?: string;
  type?: string;
  imageUrl?: string;
  holofoil?: boolean;
  value?: number;
  pokemon?: PokemonCard;
  [key: string]: any;
}

interface Props {
  card: CardInput | Card | any | null;
  className?: string;
  interactive?: boolean;
  active?: boolean;
  style?: React.CSSProperties;
  showcase?: boolean;
  onClick?: () => void;
  disableTilt?: boolean;
  children?: React.ReactNode;
}

export const InteractiveCard3D: React.FC<Props> = ({
  card,
  className = '',
  interactive = true,
  active = false,
  style = {},
  showcase = false,
  onClick,
  disableTilt = false,
  children,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);

  // Extract properties safely
  const c = card as any;
  const name = c?.name || c?.pokemon?.name || 'Pokemon Card';
  const rawImage = c?.imageUrl || c?.pokemon?.images?.large || c?.pokemon?.images?.small || '';
  const isFastThumbnailMode = !showcase && !c?.isInspection && !c?.showcase;
  const imageUrl = isFastThumbnailMode 
    ? (c?.pokemon?.images?.small || c?.images?.small || getCardImageUrl(rawImage, 'low'))
    : (c?.pokemon?.images?.large || c?.images?.large || getCardImageUrl(rawImage, 'high'));
  const isSlabbed = Boolean(c?.isSlabbed || c?.slabGrade);

  // Determine type
  let cardType = c?.type || '';
  if (!cardType && c?.pokemon?.types && c.pokemon.types.length > 0) {
    cardType = c.pokemon.types[0];
  }
  if (!cardType) cardType = 'Colorless';
  const typeClass = cardType.toLowerCase();

  const tiltEnabled = interactive && !showcase && !disableTilt;

  // Dynamically extract the majority color available on the card illustration
  const [majorityColor, setMajorityColor] = useState<ExtractedColor>(() =>
    getFallbackColor(cardType, name)
  );

  useEffect(() => {
    let isMounted = true;
    const initial = extractMajorityColor(imageUrl, cardType, name, (color) => {
      if (isMounted) setMajorityColor(color);
    });
    setMajorityColor(initial);
    return () => {
      isMounted = false;
    };
  }, [imageUrl, cardType, name]);

  // Zero-latency GPU position updates for personalized cursor & touch reactive rim lighting & 3D tilt
  const updateTiltAndLighting = useCallback(
    (clientX: number, clientY: number) => {
      if (!cardRef.current || !interactive) return;
      const rect = cardRef.current.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      
      const xPos = clientX - rect.left;
      const yPos = clientY - rect.top;
      const x = (xPos / rect.width) * 100;
      const y = (yPos / rect.height) * 100;
      
      cardRef.current.style.setProperty('--pointer-x', `${x}%`);
      cardRef.current.style.setProperty('--pointer-y', `${y}%`);

      if (tiltEnabled && tiltRef.current) {
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const maxAngleX = 16;
        const maxAngleY = 16;
        
        const rotateX = ((centerY - yPos) / centerY) * maxAngleX;
        const rotateY = ((xPos - centerX) / centerX) * maxAngleY;
        
        tiltRef.current.style.transition = 'transform 0.12s ease-out';
        tiltRef.current.style.transform = `rotateX(${rotateX.toFixed(4)}deg) rotateY(${rotateY.toFixed(4)}deg) scale3d(1.03, 1.03, 1.03)`;
      }
    },
    [interactive, tiltEnabled]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      updateTiltAndLighting(e.clientX, e.clientY);
    },
    [updateTiltAndLighting]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0] || e.changedTouches[0];
      if (touch) {
        updateTiltAndLighting(touch.clientX, touch.clientY);
      }
    },
    [updateTiltAndLighting]
  );

  const handleMouseLeave = useCallback(() => {
    if (!cardRef.current) return;
    cardRef.current.style.setProperty('--pointer-x', '50%');
    cardRef.current.style.setProperty('--pointer-y', '50%');

    if (tiltEnabled && tiltRef.current) {
      tiltRef.current.style.transition = 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)';
      tiltRef.current.style.transform = 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    }
  }, [tiltEnabled]);

  return (
    <div
      ref={cardRef}
      className={`pkmn-card group ${typeClass} ${interactive ? 'interactive' : ''} ${
        active ? 'active' : ''
      } ${className}`}
      style={
        {
          ...style,
          '--card-edge': majorityColor.edge,
          '--card-glow': majorityColor.glow,
          '--pointer-x': '50%',
          '--pointer-y': '50%',
          perspective: '1000px',
        } as React.CSSProperties
      }
      data-type={cardType}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onTouchStart={handleTouchMove}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseLeave}
      onMouseLeave={handleMouseLeave}
    >
      <div
        ref={tiltRef}
        className="w-full h-full rounded-xl overflow-hidden relative"
        style={{
          transform: 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
          transformStyle: 'preserve-3d',
          willChange: 'transform',
          transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div className="pkmn-card__translater w-full h-full" data-type={cardType}>
          <div className="pkmn-card__rotator w-full h-full relative cursor-pointer">
            {/* Card Back */}
            <img
              className="pkmn-card__back w-full h-full object-contain absolute inset-0 rounded-[var(--card-radius)]"
              src={isSlabbed ? '/slab.svg?v=clean3' : 'https://images.pokemontcg.io/cardback.png'}
              alt="Card Back"
              loading="lazy"
            />

            {/* Card Front - Clean artwork or Graded Slab Encasement */}
            <div
              className={`pkmn-card__front w-full h-full absolute inset-0 overflow-hidden ${
                isSlabbed
                  ? 'bg-transparent rounded-[12px]'
                  : 'bg-gray-950 rounded-[var(--card-radius)]'
              }`}
            >
              {isSlabbed ? (
                /* =========================================================
                   🛡️ RAW PROTECTIVE SLAB ENCASEMENT (GRADE: N/A) 🛡️
                   ========================================================= */
                <div className="w-full h-full relative flex items-center justify-center bg-[#06080e] rounded-[10px] overflow-hidden select-none">
                  {/* 1. Crystal Acrylic Slab Frame */}
                  <img
                    src="/slab.svg?v=clean3"
                    alt="Protective Slab Case"
                    className="w-full h-full object-contain absolute inset-0 z-10 block pointer-events-none"
                  />

                  {/* Protective Slab Top Label Bar (Exactly fitted to acrylic recess slot: x=18, y=16, w=364, h=56) */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '2.86%',
                      left: '4.5%',
                      width: '91%',
                      height: '10%',
                      zIndex: 20,
                    }}
                    className={`rounded-[7px] px-2.5 py-1 flex items-center justify-between overflow-hidden pointer-events-none select-none ${
                      c?.slabGrade && c.slabGrade !== 'N/A'
                        ? 'bg-gradient-to-r from-[#b91c1c] via-[#dc2626] to-[#b91c1c] border border-white/35 shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                        : 'bg-[#0a0e18]/95 border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.8)]'
                    }`}
                  >
                    {c?.slabGrade && c.slabGrade !== 'N/A' ? (
                      /* PSA Graded Header */
                      <>
                        <div className="flex flex-col leading-tight min-w-0 pr-1">
                          <span className="text-[8px] font-black tracking-tight text-white uppercase truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                            {(c.psaDetails?.gradeNum === 10 || c.slabGrade?.includes('10'))
                              ? 'PSA GEM MT 10'
                              : (c.psaDetails?.gradeNum === 9 || c.slabGrade?.includes('9'))
                              ? 'PSA MINT 9'
                              : (c.psaDetails?.gradeNum === 8 || c.slabGrade?.includes('8'))
                              ? 'PSA NM-MT 8'
                              : `PSA ${c.psaDetails?.gradeNum || c.slabGrade.replace(/[^0-9]/g, '') || '7'} AUTHENTIC`}
                          </span>
                          <span className="text-[7px] font-mono font-black text-amber-300 truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                            {name?.split('—')[0]?.trim()} {c.setName ? `• ${c.setName.split('(')[0].trim()}` : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Simulated Barcode */}
                          <div className="hidden xs:flex items-center gap-[1px] opacity-75 bg-white/10 px-1 py-0.5 rounded">
                            <div className="w-[1px] h-3 bg-white" />
                            <div className="w-[2px] h-3 bg-white" />
                            <div className="w-[1px] h-3 bg-white" />
                            <div className="w-[3px] h-3 bg-white" />
                            <div className="w-[1px] h-3 bg-white" />
                            <div className="w-[2px] h-3 bg-white" />
                          </div>
                          {/* Grade Pill */}
                          <div className={`w-5 h-5 rounded-[3px] font-black text-[10px] flex items-center justify-center shrink-0 border ${
                            (c.psaDetails?.gradeNum === 10 || c.slabGrade?.includes('10'))
                              ? 'bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 border-white text-black shadow-[0_0_8px_rgba(245,158,11,0.9)]'
                              : (c.psaDetails?.gradeNum === 9 || c.slabGrade?.includes('9'))
                              ? 'bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 border-white text-white shadow-[0_0_8px_rgba(56,189,248,0.8)]'
                              : (c.psaDetails?.gradeNum === 8 || c.slabGrade?.includes('8'))
                              ? 'bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-700 border-white text-white shadow-[0_0_8px_rgba(168,85,247,0.8)]'
                              : 'bg-gradient-to-br from-rose-600 via-red-600 to-red-700 border-white text-white shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                          }`}>
                            {c.psaDetails?.gradeNum || c.slabGrade.replace(/[^0-9]/g, '') || '10'}
                          </div>
                        </div>
                      </>
                    ) : (
                      /* Ungraded Raw Header */
                      <>
                        <div className="flex flex-col leading-tight min-w-0 pr-1">
                          <span className="text-[6.5px] font-mono font-bold tracking-widest text-slate-300 uppercase truncate">
                            ANTIGRAVITY ENCASEMENT CO.
                          </span>
                          <span className="text-[8.5px] font-black tracking-wide text-white uppercase truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">
                            UNGRADED AUTHENTIC
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <div className="w-6 h-4 rounded-[2px] bg-slate-200/90 border border-slate-400 flex flex-col items-center justify-center leading-none">
                            <span className="text-[5px] font-black text-slate-800 uppercase">Grade</span>
                            <span className="text-[8px] font-black text-slate-900 uppercase">N/A</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* 2. Recessed Card Chamber */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '14.3%',
                      left: '4.5%',
                      width: '91%',
                      height: '82.8%',
                      borderRadius: 4,
                      overflow: 'hidden',
                      zIndex: 5,
                      boxShadow: 'inset 0 0 8px rgba(0,0,0,0.85), 0 3px 10px rgba(0,0,0,0.9)',
                    }}
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={name}
                        className="w-full h-full object-cover block"
                        loading="lazy"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          const num = card?.localId || card?.id?.split('-')[1] || '1';
                          const setId = card?.id?.split('-')[0] || 'swsh3';
                          handleCardImageError(img, setId, num);
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold p-2 text-center bg-gray-900">
                        {name}
                      </div>
                    )}
                  </div>

                  {/* 3. Custom Children Overlay positioned inside the slab recess */}
                  {children && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '14.3%',
                        left: '4.5%',
                        width: '91%',
                        height: '82.8%',
                        pointerEvents: 'auto',
                        zIndex: 20,
                      }}
                    >
                      {children}
                    </div>
                  )}
                </div>
              ) : (
                /* =========================================================
                   REGULAR UN-SLABBED CARD FRONT
                   ========================================================= */
                <>
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={name}
                      className="w-full h-full object-cover block rounded-[var(--card-radius)]"
                      loading="lazy"
                      onError={(e) => {
                        const img = e.target as HTMLImageElement;
                        const num = card?.localId || card?.id?.split('-')[1] || '1';
                        const setId = card?.id?.split('-')[0] || 'swsh3';
                        handleCardImageError(img, setId, num);
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400 font-bold p-4 text-center bg-gray-900">
                      {name}
                    </div>
                  )}

                  {/* Custom Children Overlay */}
                  {children && (
                    <div className="absolute inset-0 pointer-events-auto z-20">{children}</div>
                  )}
                </>
              )}

              {/* ✨ Crisp Majority-Color Perimeter Outline Border ✨ */}
              {interactive && !showcase && (
                <div
                  className="absolute inset-0 rounded-[var(--card-radius)] pointer-events-none z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
                  style={{
                    boxShadow: `inset 0 0 0 1.5px ${majorityColor.edge}, 0 0 16px -2px ${majorityColor.glow}`,
                  }}
                />
              )}

              {/* ✨ Ultra-Subtle, Low-Intensity Cursor Spotlight (15% opacity so artwork is crystal clear) ✨ */}
              {interactive && !showcase && (
                <div
                  className="absolute inset-0 rounded-[var(--card-radius)] pointer-events-none z-30 transition-opacity duration-300 opacity-0 group-hover:opacity-15"
                  style={{
                    background: `radial-gradient(circle 140px at var(--pointer-x, 50%) var(--pointer-y, 50%), ${majorityColor.edge} 0%, transparent 70%)`,
                    mixBlendMode: 'plus-lighter',
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default React.memo(InteractiveCard3D);
