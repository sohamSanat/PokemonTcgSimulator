import React, { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { type Card, formatRarityTag } from "./types";
import PriceTooltip from "./PriceTooltip";
import InteractiveCard3D from "./InteractiveCard3D";

const CARD_GRADIENTS: Record<string, string> = {
  Fire: "linear-gradient(160deg, #3d1a00, #8b2500)",
  Water: "linear-gradient(160deg, #001a3d, #004080)",
  Grass: "linear-gradient(160deg, #0a2200, #1a4d00)",
  Psychic: "linear-gradient(160deg, #2d0040, #6b0080)",
  Lightning: "linear-gradient(160deg, #2d2200, #806200)",
  Fighting: "linear-gradient(160deg, #2d1200, #5c2e00)",
  Dragon: "linear-gradient(160deg, #00182d, #003d70)",
  Colorless: "linear-gradient(160deg, #1a1a1a, #333333)",
};

const getCardRarityGlow = (rarity?: string) => {
  if (!rarity) return "none";
  const tag = formatRarityTag(rarity);
  if (tag === "SIR") return "0 0 22px rgba(255,200,50,0.55), 0 0 60px rgba(255,180,0,0.25)";
  if (tag === "SR") return "0 0 20px rgba(236,72,153,0.55), 0 0 50px rgba(168,85,247,0.25)";
  if (tag === "HR") return "0 0 18px rgba(250,204,21,0.5), 0 0 45px rgba(245,158,11,0.2)";
  if (tag === "IR") return "0 0 16px rgba(168,85,247,0.45), 0 0 40px rgba(147,51,234,0.2)";
  if (tag === "UR" || tag === "RR") return "0 0 14px rgba(56,189,248,0.45), 0 0 30px rgba(14,165,233,0.15)";
  if (tag === "HOLO") return "0 0 10px rgba(200,200,220,0.3)";
  return "none";
};

interface Props {
  card: Card | null;
  index: number;
  onToggleFavorite?: (id: string) => void;
  onAddCard?: () => void;
  onInspectCard?: (card: Card) => void;
  onMoveCard?: (card: Card) => void;
}

function CardSlot({ card, index, onToggleFavorite, onAddCard, onInspectCard, onMoveCard }: Props) {
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!priceOpen) return;
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && containerRef.current.contains(e.target as Node)) {
        return;
      }
      setPriceOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [priceOpen]);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
  };

  const sortableId = card?.id ?? `empty-${index}`;
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: sortableId, disabled: !card });

  const sortableStyle = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : (hovered ? 100 : 1),
    opacity: isDragging ? 0.8 : 1,
    touchAction: "pan-y" as const,
  };

  if (!card) {
    return (
      <div
        ref={setNodeRef}
        {...attributes}
        {...listeners}
        onClick={onAddCard}
        style={{
          ...sortableStyle,
          position: "relative",
          aspectRatio: "2.5/3.5",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
          padding: 8
        }}
        className="card-slot-empty"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        title="Empty Binder Pocket - Click to open packs and add cards!"
      >
        {/* Ultrasonic Weld Seam Simulation */}
        <div style={{
          position: "absolute",
          inset: 4,
          border: "1px dashed rgba(255,255,255,0.12)",
          borderRadius: 10,
          pointerEvents: "none"
        }} />

        {/* Plastic Sleeve Glare & Reflection */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.06) 100%)",
          pointerEvents: "none"
        }} />

        {/* Top Loading Lip */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 14,
          right: 14,
          height: 3,
          background: "rgba(255,255,255,0.3)",
          borderRadius: "0 0 4px 4px",
          pointerEvents: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,0.4)"
        }} />

        <div style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.15)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgba(255,255,255,0.5)",
          fontSize: 22,
          fontWeight: 300,
          marginBottom: 8,
          boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
        }}>
          +
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
          Empty Pocket
        </span>
      </div>
    );
  }

  return (
    <div
      ref={(node) => {
        setNodeRef(node);
        containerRef.current = node;
      }}
      {...attributes}
      {...listeners}
      style={{
        ...sortableStyle,
        position: "relative",
        aspectRatio: "2.5/3.5",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Plastic Sleeve Pocket Container */}
      <div
        onClick={() => onInspectCard ? onInspectCard(card) : (onToggleFavorite && onToggleFavorite(card.id))}
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 14,
          background: "linear-gradient(145deg, #18181c, #0e0e12)",
          border: "2px solid rgba(255,255,255,0.22)",
          padding: "6px",
          boxShadow: hovered
            ? "0 12px 30px rgba(0,0,0,0.8)"
            : "0 4px 14px rgba(0,0,0,0.5)",
          transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
          transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.2s ease",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ultrasonic Weld Seam Simulation around the card */}
        <div style={{
          position: "absolute",
          inset: 3,
          border: "1px dashed rgba(255,255,255,0.18)",
          borderRadius: 10,
          pointerEvents: "none",
          zIndex: 10
        }} />

        {/* Realistic Plastic Sleeve Glare & Reflection */}
        <div style={{
          position: "absolute",
          inset: 0,
          background: hovered
            ? "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.05) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.03) 100%)",
          pointerEvents: "none",
          zIndex: 25,
          boxShadow: "inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(0,0,0,0.8)",
          transition: "background 0.25s ease"
        }} />

        {/* Top Loading Sleeve Lip */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 14,
          right: 14,
          height: 3,
          background: "rgba(255,255,255,0.12)",
          borderRadius: "0 0 4px 4px",
          pointerEvents: "none",
          zIndex: 26,
          boxShadow: "0 1px 3px rgba(0,0,0,0.5)"
        }} />

        {/* 1. Penny Sleeve Back Frame (Only for regular un-slabbed cards) */}
        {!card.isSlabbed && (
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "6%",
              width: "88%",
              height: "90%",
              borderRadius: "4px",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              boxShadow: "0 2px 4px rgba(0,0,0,0.4), inset 0 0 2px rgba(255,255,255,0.05)",
              zIndex: 1,
              pointerEvents: "none",
            }}
          />
        )}

        {/* 2. Card art area or Protective Slab Encasement */}
        <div
          style={card.isSlabbed ? {
            position: "absolute",
            top: "3%",
            left: "4%",
            width: "92%",
            height: "94%",
            borderRadius: 8,
            overflow: "visible",
            zIndex: 2,
          } : {
            position: "absolute",
            top: "6.5%",
            left: "7.5%",
            width: "85%",
            height: "87%",
            borderRadius: 6,
            overflow: "visible",
            zIndex: 2,
          }}
        >
          <InteractiveCard3D
            card={card}
            interactive={true}
            disableTilt={true}
            className="w-full h-full rounded-[6px]"
            style={{ width: "100%", height: "100%", borderRadius: 6 }}
          >

            {/* Card name bar — Only render on regular cards; slabbed cards already show full title and grade in the top acrylic label well */}
            {!card.isSlabbed && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                padding: "20px 8px 6px",
                background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                zIndex: 30,
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#f0f0f2", letterSpacing: "0.02em", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
                  {card.name}
                </div>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)" }}>
                  {card.setNumber}
                </div>
              </div>
            )}

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite && onToggleFavorite(card.id);
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              title={card.favorite ? "Remove from Favorites" : "Add to Favorites"}
              style={{
                position: "absolute",
                top: 5,
                right: 5,
                width: 22,
                height: 22,
                background: card.favorite ? "rgba(255,200,50,0.95)" : "rgba(0,0,0,0.65)",
                border: card.favorite ? "1px solid rgba(255,255,255,0.9)" : "1px solid rgba(255,255,255,0.25)",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 11,
                color: card.favorite ? "#000" : "rgba(255,255,255,0.75)",
                cursor: "pointer",
                zIndex: 35,
                opacity: card.favorite || hovered ? 1 : 0,
                transition: "opacity 0.2s, transform 0.15s",
                boxShadow: card.favorite ? "0 0 10px rgba(255,200,50,0.6)" : "0 2px 4px rgba(0,0,0,0.6)",
              }}
            >
              ★
            </button>

            {/* Rarity Tag Badge */}
            {(() => {
              const tag = formatRarityTag(card.rarity);
              const badgeClass =
                tag === "SIR"
                  ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-black border-amber-300 font-black shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                  : tag === "SR"
                    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 text-white border-pink-400/50 font-black shadow-[0_0_10px_rgba(236,72,153,0.5)]"
                    : tag === "HR"
                      ? "bg-gradient-to-r from-yellow-300 to-amber-500 text-black border-yellow-200 font-black shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                      : tag === "IR"
                        ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-purple-400/40 font-bold"
                        : tag === "UR" || tag === "RR"
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-cyan-400/40 font-bold"
                          : "bg-black/75 text-zinc-300 border-white/15 font-semibold";

              return (
                <div
                  className={`px-1.5 py-0.5 rounded text-[9px] tracking-wider uppercase border shadow-md ${badgeClass}`}
                  style={{
                    position: "absolute",
                    top: 5,
                    left: 5,
                    backdropFilter: "blur(6px)",
                    zIndex: 30,
                  }}
                >
                  {tag}
                </div>
              );
            })()}

            {/* Move Button — visible on hover */}
            {hovered && onMoveCard && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveCard(card);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                title="Move card to another binder"
                style={{
                  position: "absolute",
                  bottom: 30,
                  left: 5,
                  zIndex: 35,
                  background: "rgba(10, 10, 14, 0.85)",
                  border: "1px solid rgba(56, 189, 248, 0.55)",
                  borderRadius: 6,
                  padding: "3px 7px",
                  fontSize: 9,
                  fontWeight: 800,
                  color: "#38bdf8",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.6)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 8 }}>📦</span>
                <span>Move</span>
              </button>
            )}

            {/* Price Button — visible on hover or when price tooltip is open */}
            {(hovered || priceOpen) && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't trigger favorite toggle or card inspect
                  setPriceOpen(prev => !prev);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                style={{
                  position: "absolute",
                  bottom: 30,
                  right: 5,
                  zIndex: 35,
                  background: priceOpen
                    ? "linear-gradient(135deg, #f59e0b, #d97706)"
                    : "rgba(10, 10, 14, 0.82)",
                  border: priceOpen
                    ? "1px solid rgba(255,200,80,0.7)"
                    : "1px solid rgba(245,158,11,0.55)",
                  borderRadius: 6,
                  padding: "3px 7px",
                  fontSize: 9,
                  fontWeight: 800,
                  color: priceOpen ? "#fff" : "rgba(245,158,11,0.95)",
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  backdropFilter: "blur(8px)",
                  boxShadow: priceOpen
                    ? "0 0 14px rgba(245,158,11,0.6)"
                    : "0 2px 8px rgba(0,0,0,0.6)",
                  transition: "all 0.15s ease",
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <span style={{ fontSize: 8 }}>💰</span>
                <span>Price</span>
              </button>
            )}
          </InteractiveCard3D>
        </div>

        {/* 3. Penny Sleeve Front Silhouette & Sheen Overlay */}
        {!card.isSlabbed && (
          <div
            style={{
              position: "absolute",
              top: "5%",
              left: "6%",
              width: "88%",
              height: "90%",
              borderRadius: "4px",
              background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,0.05) 100%)",
              borderTop: "1px solid rgba(255,255,255,0.25)",
              borderLeft: "1px solid rgba(255,255,255,0.15)",
              borderRight: "1px solid rgba(255,255,255,0.05)",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
              zIndex: 5,
              pointerEvents: "none",
              mixBlendMode: "screen",
            }}
          />
        )}
      </div>

      {/* Price Tooltip — shown when Price button is clicked */}
      {priceOpen && <PriceTooltip card={card} index={index} />}
    </div>
  );
}

export default React.memo(CardSlot);
