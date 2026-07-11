import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "guiding" | "inserting" | "complete";

interface Props {
  cardImageUrl: string;
  cardName: string;
  cardValue?: number;
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Virtual canvas ───────────────────────────────────────────────────────────
const VW = 520, VH = 440;
// Slab Dimensions
const SL_W = 168, SL_H = 260;
const SL_CX = VW / 2, SL_CY = VH / 2 + 8;
// Slab entry (top opening of the recessed card chamber)
const ENTRY_X = SL_CX;
const ENTRY_Y = SL_CY - SL_H / 2 + 52;
// Card
const CARD_W = 118, CARD_H = 166;
const CARD_START_X = SL_CX + 175, CARD_START_Y = SL_CY + 20;
// Physics
const SNAP_R = 72;
const LERP = 0.35;

const vx = (n: number) => `${(n / VW) * 100}%`;
const vy = (n: number) => `${(n / VH) * 100}%`;

/**
 * SlabAnimation — Ultra-fast, zero-lag interactive protective slab sequence.
 * Encases valuable ($5.00+) cards into a custom acrylic slab (Grade: N/A).
 */
function SlabAnimation({
  cardImageUrl, cardName, cardValue = 10, onComplete, onCancel,
}: Props) {

  const containerRef   = useRef<HTMLDivElement>(null);
  const cardWrapRef    = useRef<HTMLDivElement>(null);
  const cursorGlowRef  = useRef<HTMLDivElement>(null);

  const rafRef         = useRef<number | null>(null);
  const loopActiveRef  = useRef(false);
  const phaseRef       = useRef<Phase>("idle");
  const targetRef      = useRef({ x: CARD_START_X, y: CARD_START_Y });
  const posRef         = useRef({ x: CARD_START_X, y: CARD_START_Y });
  const lastTierRef    = useRef(0);

  const [phase, setPhase]       = useState<Phase>("idle");
  const [instrKey, setInstrKey] = useState(0);
  const instrTextRef = useRef("Guide your $5+ hit into the crystal acrylic slab chamber");

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  const startLoop = useCallback(() => {
    if (loopActiveRef.current) return;
    loopActiveRef.current = true;

    const tick = () => {
      const p = phaseRef.current;
      if (p === "complete" || p === "idle") {
        loopActiveRef.current = false;
        return;
      }

      let { x: cx, y: cy } = posRef.current;

      if (p === "guiding") {
        cx += (targetRef.current.x - cx) * LERP;
        cy += (targetRef.current.y - cy) * LERP;

        const dx = ENTRY_X - cx;
        const dy = ENTRY_Y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let dispX = cx, dispY = cy;
        const PULL_ZONE = 135;
        if (dist < PULL_ZONE) {
          const str = Math.pow(1 - dist / PULL_ZONE, 2) * 0.38;
          dispX = cx + dx * str;
          dispY = cy + dy * str;
        }

        posRef.current = { x: cx, y: cy };
        const prox = Math.max(0, 1 - dist / 260);

        if (cardWrapRef.current) {
          cardWrapRef.current.style.left      = `${(dispX / VW) * 100}%`;
          cardWrapRef.current.style.top       = `${(dispY / VH) * 100}%`;
          cardWrapRef.current.style.transform = "translate3d(-50%, -50%, 0)";
        }

        const tier = prox > 0.75 ? 3 : prox > 0.42 ? 2 : 1;
        if (tier !== lastTierRef.current) {
          lastTierRef.current = tier;
          instrTextRef.current =
            tier === 3 ? "Almost there! Click into the slab recess slot ↑"
          : tier === 2 ? "Align with the top center chamber opening ↑"
          :              "Guide your $5+ hit toward the top of the slab";
          setInstrKey(k => k + 1);
        }

        if (dist < SNAP_R) setPhaseSync("inserting");

      } else if (p === "inserting") {
        const tx = ENTRY_X, ty = ENTRY_Y + 12;
        cx += (tx - cx) * 0.14;
        cy += (ty - cy) * 0.14;
        posRef.current = { x: cx, y: cy };

        if (cardWrapRef.current) {
          cardWrapRef.current.style.left      = `${(cx / VW) * 100}%`;
          cardWrapRef.current.style.top       = `${(cy / VH) * 100}%`;
          cardWrapRef.current.style.transform = "translate3d(-50%, -50%, 0)";
        }

        if (Math.sqrt((tx - cx) ** 2 + (ty - cy) ** 2) < 3.5) {
          loopActiveRef.current = false;
          setPhaseSync("complete");
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  }, [setPhaseSync]);

  useEffect(() => {
    if (phase === "guiding") startLoop();
    if (phase === "complete") {
      const t = setTimeout(() => onComplete(), 1800);
      return () => clearTimeout(t);
    }
  }, [phase, startLoop, onComplete]);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  // ── Unified interaction move (mouse & touch) ─────────────────────────────
  const updateTargetFromCoords = useCallback((clientX: number, clientY: number) => {
    const p = phaseRef.current;
    if (p === "inserting" || p === "complete") return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    targetRef.current = {
      x: ((clientX - rect.left) / rect.width) * VW,
      y: ((clientY - rect.top) / rect.height) * VH,
    };

    if (cursorGlowRef.current) {
      cursorGlowRef.current.style.left = `${((clientX - rect.left) / rect.width) * 100}%`;
      cursorGlowRef.current.style.top  = `${((clientY - rect.top)  / rect.height) * 100}%`;
    }

    if (p === "idle") setPhaseSync("guiding");
  }, [setPhaseSync]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    updateTargetFromCoords(e.clientX, e.clientY);
  }, [updateTargetFromCoords]);

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0] || e.changedTouches[0];
    if (touch) updateTargetFromCoords(touch.clientX, touch.clientY);
  }, [updateTargetFromCoords]);

  // Quick tap anywhere to slab shortcut on mobile or desktop
  const handleStageTap = useCallback(() => {
    const p = phaseRef.current;
    if (p === "idle" || p === "guiding") {
      setPhaseSync("inserting");
    }
  }, [setPhaseSync]);

  const PHASES: Phase[]  = ["idle", "guiding", "inserting", "complete"];
  const phaseIdx          = PHASES.indexOf(phase);
  const STEP_LABELS       = ["Slab Case", "Align", "Seal", "Grade: N/A"];

  const instrText: Record<Phase, string> = {
    idle:      "Slide finger or cursor into slab chamber (or tap to seal)",
    guiding:   instrTextRef.current,
    inserting: "Sonic sealing acrylic slab…",
    complete:  "🏆 Encased in Custom Protective Slab (Grade: N/A)!",
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 350,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(6,8,16,0.97)",
        userSelect: "none",
        willChange: "opacity"
      }}
    >
      {/* Cancel button */}
      {phaseIdx < 2 && (
        <button onClick={onCancel}
          style={{ position: "absolute", top: 24, right: 28, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 10, color: "#888", fontSize: 18, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.15)")}
          onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.07)")}
        >✕</button>
      )}

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ fontSize: 22, fontWeight: 800, color: "#fef08a", letterSpacing: "-0.025em", marginBottom: 6, textAlign: "center", display: "flex", alignItems: "center", gap: 8 }}
      >
        <span>🏆</span> Slabbing Valuable Hit (${cardValue.toFixed(2)})
      </motion.div>

      {/* Instruction */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase === "guiding" ? instrKey : phase}
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          style={{ fontSize: 13, fontWeight: 700, color: phase === "complete" ? "#fef08a" : "#94a3b8", marginBottom: 20, textAlign: "center", maxWidth: 360 }}
        >
          {instrText[phase]}
        </motion.p>
      </AnimatePresence>

      {/* ══════════════ STAGE ══════════════ */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchMove}
        onTouchMove={handleTouchMove}
        onClick={handleStageTap}
        style={{
          position: "relative",
          width: "min(520px, 92vw)",
          aspectRatio: `${VW} / ${VH}`,
          cursor: (phase === "idle" || phase === "complete") ? "default" : "none",
          borderRadius: 24,
          border: "1px solid rgba(254,240,138,0.15)",
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 55%, rgba(234,179,8,0.12), rgba(10,12,20,0.75))",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          touchAction: "none"
        }}
      >
        {/* Grid pattern */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(254,240,138,0.08) 1px, transparent 1px)", backgroundSize: "28px 28px", pointerEvents: "none" }} />

        {/* Custom cursor dot */}
        <div
          ref={cursorGlowRef}
          style={{
            position: "absolute",
            left: "78%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#fef08a",
            boxShadow: "0 0 18px rgba(254,240,138,1)",
            pointerEvents: "none",
            zIndex: 60,
            visibility: phase === "guiding" ? "visible" : "hidden",
            willChange: "left, top"
          }}
        />

        {/* Target ring */}
        <div
          style={{
            position: "absolute",
            left: vx(ENTRY_X),
            top: vy(ENTRY_Y),
            transform: "translate(-50%,-50%)",
            width: `${((SNAP_R * 2.5) / VW) * 100}%`,
            height: `${((SNAP_R * 2.5) / VH) * 100}%`,
            borderRadius: "50%",
            border: "2.5px dashed rgba(254,240,138,0.5)",
            background: "rgba(254,240,138,0.06)",
            pointerEvents: "none",
            zIndex: 9,
            visibility: (phase === "guiding" || phase === "inserting") ? "visible" : "hidden"
          }}
        />

        {/* Idle arrow */}
        {phase === "idle" && (
          <motion.div animate={{ x: [0, -14, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ position: "absolute", left: vx(CARD_START_X - 44), top: vy(CARD_START_Y - 32), fontSize: 28, color: "#fef08a", pointerEvents: "none", zIndex: 25 }}
          >↗</motion.div>
        )}

        {/* ── SLAB BACK & RECESS (idle / guiding / inserting) ──────────────── */}
        {phase !== "complete" && (
          <div style={{ position: "absolute", left: vx(SL_CX), top: vy(SL_CY), transform: "translate(-50%,-50%)", width: `${(SL_W / VW) * 100}%`, height: `${(SL_H / VH) * 100}%`, zIndex: 10, pointerEvents: "none" }}>
            <img src="/slab.svg?v=clean3" alt="acrylic slab case"
              style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
            />
          </div>
        )}

        {/* ── CARD (follows cursor cleanly on GPU) ─────────────────────── */}
        {(phase === "idle" || phase === "guiding" || phase === "inserting") && (
          <div
            ref={cardWrapRef}
            style={{
              position: "absolute",
              left: vx(CARD_START_X),
              top: vy(CARD_START_Y),
              transform: "translate3d(-50%, -50%, 0)",
              width: `${(CARD_W / VW) * 100}%`,
              height: `${(CARD_H / VH) * 100}%`,
              zIndex: phase === "inserting" ? 15 : 25,
              pointerEvents: "none",
              willChange: "left, top, transform"
            }}
          >
            <img src={cardImageUrl} alt={cardName}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 8,
                boxShadow: "0 12px 32px rgba(0,0,0,0.9)",
                border: "2px solid rgba(254,240,138,0.4)",
                display: "block"
              }}
            />
          </div>
        )}

        {/* ── COMPLETE: Encased Graded Slab Composite ─────────────────────────── */}
        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${((SL_W + 24) / VW) * 100}%`,
              height: `${((SL_H + 32) / VH) * 100}%`,
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {/* 1. Acrylic Slab Case */}
            <img
              src="/slab.svg?v=clean3"
              alt="acrylic slab case"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                zIndex: 1,
                display: "block"
              }}
            />
            {/* 2. Card art exactly centered in slab recess */}
            <img
              src={cardImageUrl}
              alt={cardName}
              style={{
                position: "absolute",
                top: "14.3%",
                left: "4.5%",
                width: "91%",
                height: "82.8%",
                objectFit: "cover",
                borderRadius: 6,
                zIndex: 2,
                boxShadow: "inset 0 0 10px rgba(0,0,0,0.8), 0 4px 15px rgba(0,0,0,0.85)",
                display: "block"
              }}
            />

            {/* Success gold ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ position: "absolute", inset: -16, borderRadius: "50%", border: "3px solid rgba(254,240,138,0.95)", pointerEvents: "none", zIndex: 50 }}
            />

            {/* Sparkle particles */}
            {["✦","✧","🏆","✦","✧"].map((s, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: [0,1,0], scale: [0,1.4,0], x: [0,(i%2===0?1:-1)*(55+i*22)], y: [0,-(75+i*18)] }}
                transition={{ delay: i*0.06, duration: 0.7 }}
                style={{ position: "absolute", top: "50%", left: "50%", fontSize: 18+i*3, color: "#fef08a", pointerEvents: "none", zIndex: 60, lineHeight: 1 }}
              >{s}</motion.span>
            ))}
          </motion.div>
        )}
      </div>

      {/* Progress bar */}
      <div style={{ display: "flex", gap: 10, marginTop: 26, alignItems: "flex-start" }}>
        {STEP_LABELS.map((label, i) => {
          const isActive = phaseIdx === i, isDone = phaseIdx > i;
          return (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
              <motion.div
                animate={{ width: isActive ? 34 : 9, backgroundColor: isDone ? "#22c55e" : isActive ? (i===3?"#fef08a":"#eab308") : "rgba(255,255,255,0.14)" }}
                style={{ height: 7, borderRadius: 4 }}
                transition={{ duration: 0.25 }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: isDone ? "#22c55e" : isActive ? "#fef08a" : "rgba(255,255,255,0.22)" }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 13, fontSize: 12, color: "#fef08a", fontWeight: 700, textAlign: "center" }}>
        {cardName} • GRADE: N/A ($ {cardValue.toFixed(2)} Enclosed Value)
      </div>
    </motion.div>
  );
}

export default React.memo(SlabAnimation);
