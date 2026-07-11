import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Phase = "idle" | "guiding" | "inserting" | "complete";

interface Props {
  cardImageUrl: string;
  cardName: string;
  cardCount?: number;
  onComplete: () => void;
  onCancel: () => void;
}

// ─── Virtual canvas ───────────────────────────────────────────────────────────
const VW = 520, VH = 400;
// Sleeve
const SL_W = 138, SL_H = 196;
const SL_CX = VW / 2, SL_CY = VH / 2 + 10;
// Sleeve entry (top opening)
const ENTRY_X = SL_CX;
const ENTRY_Y = SL_CY - SL_H / 2 + 6;
// Card
const CARD_W = 90, CARD_H = 130;
const CARD_START_X = SL_CX + 165, CARD_START_Y = SL_CY;
// Physics
const SNAP_R = 68;
const LERP = 0.35; // Responsive and fluid cursor follow without jitter

// ─── Helper ───────────────────────────────────────────────────────────────────
const vx = (n: number) => `${(n / VW) * 100}%`;
const vy = (n: number) => `${(n / VH) * 100}%`;

/**
 * SleeveAnimation — Ultra-fast, zero-lag interactive sleeving sequence.
 * 
 * Optimizations:
 * - Removed all GPU-killing CSS filters (`backdropFilter`, `filter: drop-shadow`).
 * - Removed per-frame DOM style string thrashing (`boxShadow`, `borderColor`, `background`).
 * - Hardware-accelerated compositing (`willChange`, `translate3d`).
 */
function SleeveAnimation({
  cardImageUrl, cardName, cardCount = 1, onComplete, onCancel,
}: Props) {

  // ── DOM refs — direct manipulation, no React state per frame ──────────────
  const containerRef   = useRef<HTMLDivElement>(null);
  const cardWrapRef    = useRef<HTMLDivElement>(null);
  const cursorGlowRef  = useRef<HTMLDivElement>(null);

  // ── Animation refs ────────────────────────────────────────────────────────
  const rafRef         = useRef<number | null>(null);
  const loopActiveRef  = useRef(false);
  const phaseRef       = useRef<Phase>("idle");
  const targetRef      = useRef({ x: CARD_START_X, y: CARD_START_Y });
  const posRef         = useRef({ x: CARD_START_X, y: CARD_START_Y });
  const lastTierRef    = useRef(0);

  // ── React state (minimal — conditional rendering only) ────────────────────
  const [phase, setPhase]       = useState<Phase>("idle");
  const [instrKey, setInstrKey] = useState(0);
  const instrTextRef = useRef("Move your cursor onto the stage to guide the card");

  const setPhaseSync = useCallback((p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // RAF LOOP — zero setState calls and zero paint thrashing per frame
  // ─────────────────────────────────────────────────────────────────────────
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

      // ── GUIDING ──────────────────────────────────────────────────────────
      if (p === "guiding") {
        cx += (targetRef.current.x - cx) * LERP;
        cy += (targetRef.current.y - cy) * LERP;

        const dx = ENTRY_X - cx;
        const dy = ENTRY_Y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Magnetic pull zone pulls card toward entry when close
        let dispX = cx, dispY = cy;
        const PULL_ZONE = 130;
        if (dist < PULL_ZONE) {
          const str = Math.pow(1 - dist / PULL_ZONE, 2) * 0.35;
          dispX = cx + dx * str;
          dispY = cy + dy * str;
        }

        posRef.current = { x: cx, y: cy };

        const prox = Math.max(0, 1 - dist / 260);

        // Direct hardware composited position update
        if (cardWrapRef.current) {
          cardWrapRef.current.style.left      = `${(dispX / VW) * 100}%`;
          cardWrapRef.current.style.top       = `${(dispY / VH) * 100}%`;
          cardWrapRef.current.style.transform = "translate3d(-50%, -50%, 0)";
        }

        // Instruction text — update only on tier change
        const tier = prox > 0.75 ? 3 : prox > 0.42 ? 2 : 1;
        if (tier !== lastTierRef.current) {
          lastTierRef.current = tier;
          instrTextRef.current =
            tier === 3 ? "Almost there! Push it into the opening ↑"
          : tier === 2 ? "Getting close — aim for the sleeve opening ↑"
          :              "Bring the card toward the top of the sleeve";
          setInstrKey(k => k + 1);
        }

        if (dist < SNAP_R) setPhaseSync("inserting");

      // ── INSERTING ─────────────────────────────────────────────────────────
      } else if (p === "inserting") {
        const tx = ENTRY_X, ty = ENTRY_Y - 18;
        cx += (tx - cx) * 0.12; // Fast snap-in
        cy += (ty - cy) * 0.12;
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

  // ── Phase side-effects ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === "guiding") startLoop();
    if (phase === "complete") {
      const t = setTimeout(() => onComplete(), 1600);
      return () => clearTimeout(t);
    }
  }, [phase, startLoop, onComplete]);

  // Cleanup RAF on unmount
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

  // Quick tap anywhere to sleeve shortcut on mobile or desktop
  const handleStageTap = useCallback(() => {
    const p = phaseRef.current;
    if (p === "idle" || p === "guiding") {
      setPhaseSync("inserting");
    }
  }, [setPhaseSync]);

  // ── Derived ───────────────────────────────────────────────────────────────
  const PHASES: Phase[]  = ["idle", "guiding", "inserting", "complete"];
  const phaseIdx          = PHASES.indexOf(phase);
  const STEP_LABELS       = ["Sleeve", "Guide", "Insert", "Done"];

  const instrText: Record<Phase, string> = {
    idle:      "Slide finger or cursor onto stage to guide card (or tap to insert)",
    guiding:   instrTextRef.current,
    inserting: "Sliding in…",
    complete:  "Card protected! ✨",
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(8,8,14,0.96)",
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
        style={{ fontSize: 22, fontWeight: 800, color: "#f0f0f2", letterSpacing: "-0.025em", marginBottom: 6, textAlign: "center" }}
      >
        🛡️ {cardCount > 1 ? `Sleeving ${cardCount} Cards` : "Sleeving Your Card"}
      </motion.div>

      {/* Instruction */}
      <AnimatePresence mode="wait">
        <motion.p
          key={phase === "guiding" ? instrKey : phase}
          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
          transition={{ duration: 0.18 }}
          style={{ fontSize: 13, fontWeight: 600, color: phase === "complete" ? "#86efac" : "#8a8aa8", marginBottom: 20, textAlign: "center", maxWidth: 340 }}
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
          width: "min(520px, 90vw)",
          aspectRatio: `${VW} / ${VH}`,
          cursor: (phase === "idle" || phase === "complete") ? "default" : "none",
          borderRadius: 22,
          border: "1px solid rgba(255,255,255,0.08)",
          overflow: "hidden",
          background: "radial-gradient(ellipse at 50% 60%, rgba(60,60,100,0.12), rgba(15,15,22,0.6))",
          transformStyle: "preserve-3d",
          WebkitTransformStyle: "preserve-3d",
          touchAction: "none"
        }}
      >
        {/* Dot grid */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "26px 26px", pointerEvents: "none" }} />

        {/* Custom cursor dot */}
        <div
          ref={cursorGlowRef}
          style={{
            position: "absolute",
            left: "78%",
            top: "50%",
            transform: "translate(-50%,-50%)",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "#fbbf24",
            boxShadow: "0 0 16px rgba(251,191,36,0.9)",
            pointerEvents: "none",
            zIndex: 60,
            visibility: phase === "guiding" ? "visible" : "hidden",
            willChange: "left, top"
          }}
        />

        {/* Entry zone target ring */}
        <div
          style={{
            position: "absolute",
            left: vx(ENTRY_X),
            top: vy(ENTRY_Y),
            transform: "translate(-50%,-50%)",
            width: `${((SNAP_R * 2.4) / VW) * 100}%`,
            height: `${((SNAP_R * 2.4) / VH) * 100}%`,
            borderRadius: "50%",
            border: "2.5px dashed rgba(251,191,36,0.45)",
            background: "rgba(251,191,36,0.06)",
            pointerEvents: "none",
            zIndex: 9,
            visibility: (phase === "guiding" || phase === "inserting") ? "visible" : "hidden"
          }}
        />

        {/* Idle bounce arrow */}
        {phase === "idle" && (
          <motion.div animate={{ x: [0, -14, 0], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
            style={{ position: "absolute", left: vx(CARD_START_X - 38), top: vy(CARD_START_Y - 32), fontSize: 28, color: "#f59e0b", pointerEvents: "none", zIndex: 25 }}
          >↗</motion.div>
        )}

        {/* ── SLEEVE (idle / guiding / inserting) ─────────────────────── */}
        {phase !== "complete" && (
          <>
            {/* Sleeve Back at z=10 */}
            <div style={{ position: "absolute", left: vx(SL_CX), top: vy(SL_CY), transform: "translate(-50%,-50%)", width: `${(SL_W / VW) * 100}%`, height: `${(SL_H / VH) * 100}%`, zIndex: 10, pointerEvents: "none" }}>
              <img src="/sleeve.png" alt="sleeve back"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            </div>
            {/* Sleeve Front Silhouette at z=20 */}
            <div style={{ position: "absolute", left: vx(SL_CX), top: vy(SL_CY), transform: "translate(-50%,-50%)", width: `${(SL_W / VW) * 100}%`, height: `${(SL_H / VH) * 100}%`, zIndex: 20, pointerEvents: "none" }}>
              <img src="/sleeve.png" alt=""
                style={{ width: "100%", height: "100%", objectFit: "contain", opacity: 0.22, display: "block" }}
              />
            </div>
          </>
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
                boxShadow: "0 10px 28px rgba(0,0,0,0.85)",
                border: "2px solid rgba(255,255,255,0.22)",
                display: "block"
              }}
            />
          </div>
        )}

        {/* ── COMPLETE: sleeved card composite ─────────────────────────── */}
        {phase === "complete" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85, x: "-50%", y: "-50%" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: `${((SL_W + 18) / VW) * 100}%`,
              height: `${((SL_H + 22) / VH) * 100}%`,
              zIndex: 30,
              pointerEvents: "none",
            }}
          >
            {/* 1. Sleeve Back */}
            <img
              src="/sleeve.png"
              alt="sleeve back"
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
            {/* 2. Card art */}
            <img
              src={cardImageUrl}
              alt={cardName}
              style={{
                position: "absolute",
                top: "6.5%",
                left: "7.5%",
                width: "85%",
                height: "87%",
                objectFit: "cover",
                borderRadius: 6,
                zIndex: 2,
                boxShadow: "0 4px 15px rgba(0,0,0,0.8)",
                display: "block"
              }}
            />
            {/* 3. Sleeve Front Silhouette */}
            <img
              src="/sleeve.png"
              alt=""
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "contain",
                zIndex: 3,
                opacity: 0.22,
                display: "block"
              }}
            />

            {/* Success ring */}
            <motion.div
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 3.2, opacity: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "2.5px solid rgba(134,239,172,0.85)", pointerEvents: "none", zIndex: 50 }}
            />

            {/* Sparkle particles */}
            {["✦","✧","✦","✦","✧"].map((s, i) => (
              <motion.span key={i}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: [0,1,0], scale: [0,1.3,0], x: [0,(i%2===0?1:-1)*(52+i*20)], y: [0,-(68+i*16)] }}
                transition={{ delay: i*0.06, duration: 0.65 }}
                style={{ position: "absolute", top: "50%", left: "50%", fontSize: 16+i*3, color: "#fbbf24", pointerEvents: "none", zIndex: 60, lineHeight: 1 }}
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
                animate={{ width: isActive ? 32 : 9, backgroundColor: isDone ? "#22c55e" : isActive ? (i===3?"#86efac":"#f59e0b") : "rgba(255,255,255,0.14)" }}
                style={{ height: 7, borderRadius: 4 }}
                transition={{ duration: 0.25 }}
              />
              <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const, color: isDone ? "#22c55e" : isActive ? "#f59e0b" : "rgba(255,255,255,0.22)" }}>{label}</span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: 13, fontSize: 11, color: "#64647c", fontWeight: 500, textAlign: "center", maxWidth: 260, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {cardCount > 1 ? `${cardName} + ${cardCount - 1} more` : cardName}
      </div>
    </motion.div>
  );
}

export default React.memo(SleeveAnimation);
