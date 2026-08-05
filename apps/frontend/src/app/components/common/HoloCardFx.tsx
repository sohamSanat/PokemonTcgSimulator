import React, { useRef, useCallback, useMemo } from 'react';

interface HoloCardFxProps {
  children: React.ReactNode;
  rarity?: string;
  className?: string;
  disabled?: boolean;
}

// Low-RAM / Hardware Capability Detector
const checkIsLowEndDevice = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  const memory = (navigator as any).deviceMemory; // Available RAM in GB
  const cores = navigator.hardwareConcurrency;     // Logical CPU core count
  if (memory !== undefined && memory <= 8) return true;
  if (cores !== undefined && cores <= 4) return true;
  return false;
};

/**
 * HoloCardFx Component (Adaptive Low-RAM 3D Version)
 * 
 * Hardware-accelerated 3D tilt, specular glare sweep, and holographic sheen.
 * Features adaptive performance throttling for systems with <= 8GB RAM or <= 4 CPU cores:
 * 1. Releases GPU texture buffers (will-change) when cards are idle to save VRAM.
 * 2. Throttles pointer frame updates to 30 FPS on budget devices.
 * 3. Simplifies gradient composition layers on low-RAM hardware.
 */
export const HoloCardFx: React.FC<HoloCardFxProps> = ({
  children,
  rarity = '',
  className = '',
  disabled = false
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rafId = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Detect low-spec / 8GB RAM hardware
  const isBudgetHardware = useMemo(() => checkIsLowEndDevice(), []);

  // Apply 3D & Holo effects to rare hit tiers
  const rLow = (rarity || '').toLowerCase();
  const isHoloHit = rLow.includes('illustration') ||
    rLow.includes('ultra') ||
    rLow.includes('secret') ||
    rLow.includes('special') ||
    rLow.includes('gold') ||
    rLow.includes('sar') ||
    rLow.includes('sir') ||
    rLow.includes('psa 10') ||
    rLow.includes('vmax') ||
    rLow.includes('ex') ||
    rLow.includes('rare');

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (disabled || !isHoloHit || !cardRef.current) return;

    // 30 FPS throttling for low-RAM devices (<=8GB) to prevent GPU stutter
    const now = performance.now();
    if (isBudgetHardware && now - lastTimeRef.current < 33) {
      return;
    }
    lastTimeRef.current = now;

    const el = cardRef.current;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Gentle tilt angles on low-spec hardware (max 8 deg vs 15 deg)
    const maxDegree = isBudgetHardware ? 8 : 15;
    const rotateX = Math.min(maxDegree, Math.max(-maxDegree, ((y - centerY) / centerY) * -maxDegree));
    const rotateY = Math.min(maxDegree, Math.max(-maxDegree, ((x - centerX) / centerX) * maxDegree));

    const percentX = Math.round((x / rect.width) * 100);
    const percentY = Math.round((y / rect.height) * 100);
    const angle = Math.round(Math.atan2(y - centerY, x - centerX) * (180 / Math.PI));

    const shadowX = (rotateY * -1.0).toFixed(1);
    const shadowY = (rotateX * 1.0).toFixed(1);

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!el) return;
      // Enable GPU layer promotion ONLY during active hover
      el.style.willChange = 'transform, box-shadow';
      el.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(8px) scale3d(1.03, 1.03, 1.03)`;
      el.style.boxShadow = `${shadowX}px ${shadowY}px 25px rgba(0, 0, 0, 0.55)`;
      el.style.setProperty('--holo-x', `${percentX}%`);
      el.style.setProperty('--holo-y', `${percentY}%`);
      el.style.setProperty('--glare-angle', `${angle}deg`);
      el.style.setProperty('--holo-opacity', '0.45');
      el.style.setProperty('--glare-opacity', '0.30');
    });
  }, [disabled, isHoloHit, isBudgetHardware]);

  const handleMouseLeave = useCallback(() => {
    if (disabled || !isHoloHit || !cardRef.current) return;

    if (rafId.current) cancelAnimationFrame(rafId.current);

    rafId.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      // RELEASE GPU layer memory allocations when card is idle
      cardRef.current.style.willChange = 'auto';
      cardRef.current.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)';
      cardRef.current.style.boxShadow = '0 8px 20px -4px rgba(0, 0, 0, 0.25)';
      cardRef.current.style.setProperty('--holo-opacity', '0');
      cardRef.current.style.setProperty('--glare-opacity', '0');
    });
  }, [disabled, isHoloHit]);

  if (!isHoloHit || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative transition-transform duration-200 ease-out rounded-2xl group cursor-pointer ${className}`}
      style={{
        transformStyle: 'preserve-3d',
        ['--holo-x' as any]: '50%',
        ['--holo-y' as any]: '50%',
        ['--glare-angle' as any]: '135deg',
        ['--holo-opacity' as any]: '0',
        ['--glare-opacity' as any]: '0',
      }}
    >
      {/* Base Card Content */}
      <div className="relative z-10 w-full h-full rounded-2xl overflow-hidden">
        {children}
      </div>

      {/* 1. Hardware-accelerated Metallic Holographic Sheen Layer */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200 z-20 mix-blend-color-dodge overflow-hidden"
        style={{
          opacity: 'var(--holo-opacity, 0)',
          background: `radial-gradient(
            circle at var(--holo-x, 50%) var(--holo-y, 50%),
            rgba(255, 255, 255, 0.9) 0%,
            rgba(245, 158, 11, 0.45) 25%,
            rgba(6, 182, 212, 0.4) 55%,
            transparent 80%
          )`
        }}
      />

      {/* 2. Dynamic Specular Light Glare Layer (High-spec machines only to save GPU on 8GB RAM) */}
      {!isBudgetHardware && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none transition-opacity duration-200 z-30 mix-blend-overlay overflow-hidden"
          style={{
            opacity: 'var(--glare-opacity, 0)',
            background: `linear-gradient(
              var(--glare-angle, 135deg),
              transparent 20%,
              rgba(255, 255, 255, 0.6) 45%,
              rgba(255, 255, 255, 0.85) 50%,
              rgba(255, 255, 255, 0.6) 55%,
              transparent 80%
            )`
          }}
        />
      )}

      {/* 3. 3D Card Edge Highlight */}
      <div
        className="absolute -inset-[1px] rounded-2xl pointer-events-none border border-white/20 transition-opacity duration-200 z-40"
        style={{
          opacity: 'var(--holo-opacity, 0)',
          boxShadow: 'inset 0 0 12px rgba(255, 255, 255, 0.2)'
        }}
      />
    </div>
  );
};
