import React, { useState } from "react";
import type { Card } from "./types";
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

const RARITY_GLOW: Record<string, string> = {
  "Special Illustration Rare": "0 0 20px rgba(255,200,50,0.4), 0 0 60px rgba(255,180,0,0.15)",
  "Illustration Rare": "0 0 16px rgba(180,100,255,0.4), 0 0 40px rgba(150,80,255,0.12)",
  "Ultra Rare": "0 0 14px rgba(68,138,255,0.4), 0 0 30px rgba(68,138,255,0.1)",
  "Rare": "0 0 8px rgba(200,200,220,0.3)",
  "Uncommon": "none",
  "Common": "none",
};

interface Props {
  card: Card | null;
  index: number;
  onToggleFavorite?: (id: string) => void;
  onAddCard?: () => void;
  onInspectCard?: (card: Card) => void;
}

function CardSlot({ card, index, onToggleFavorite, onAddCard, onInspectCard }: Props) {
  const [hovered, setHovered] = useState(false);
  const [priceOpen, setPriceOpen] = useState(false);

  const handleMouseEnter = () => {
    setHovered(true);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setPriceOpen(false);
  };

  if (!card) {
    return (
      <div
        onClick={onAddCard}
        style={{
          position: "relative",
          aspectRatio: "2.5/3.5",
          borderRadius: 14,
          background: "linear-gradient(145deg, rgba(28, 28, 34, 0.75), rgba(16, 16, 20, 0.85))",
          border: "2px solid rgba(255, 255, 255, 0.14)",
          boxShadow: "inset 0 0 18px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
          overflow: "hidden",
          padding: 8
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(245, 158, 11, 0.6)";
          e.currentTarget.style.background = "linear-gradient(145deg, rgba(38, 38, 46, 0.85), rgba(22, 22, 28, 0.95))";
          e.currentTarget.style.boxShadow = "0 0 22px rgba(245, 158, 11, 0.25), inset 0 0 18px rgba(0,0,0,0.8)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.14)";
          e.currentTarget.style.background = "linear-gradient(145deg, rgba(28, 28, 34, 0.75), rgba(16, 16, 20, 0.85))";
          e.currentTarget.style.boxShadow = "inset 0 0 18px rgba(0,0,0,0.8), 0 4px 12px rgba(0,0,0,0.5)";
        }}
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
          background: "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.09) 100%)",
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
      style={{
        position: "relative",
        aspectRatio: "2.5/3.5",
        zIndex: hovered ? 100 : 1,
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
            ? `0 16px 40px rgba(0,0,0,0.85), 0 0 24px rgba(255,255,255,0.15), ${RARITY_GLOW[card.rarity] || "none"}`
            : `0 6px 20px rgba(0,0,0,0.55), inset 0 1px 1px rgba(255,255,255,0.18), ${RARITY_GLOW[card.rarity] || "none"}`,
          transform: hovered ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
          transition: "transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
          willChange: "transform",
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
            ? "linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 75%, rgba(255,255,255,0.18) 100%)"
            : "linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 25%, rgba(255,255,255,0) 45%, rgba(255,255,255,0) 80%, rgba(255,255,255,0.1) 100%)",
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
          background: "rgba(255,255,255,0.45)",
          borderRadius: "0 0 4px 4px",
          pointerEvents: "none",
          zIndex: 26,
          boxShadow: "0 1px 3px rgba(0,0,0,0.5)"
        }} />

        {/* 1. Penny Sleeve Back Frame (Only for regular un-slabbed cards) */}
        {!card.isSlabbed && (
          <img
            src="/sleeve.png"
            alt="sleeve back"
            style={{
              position: "absolute",
              inset: 2,
              width: "calc(100% - 4px)",
              height: "calc(100% - 4px)",
              objectFit: "contain",
              zIndex: 1,
              opacity: 0.85,
              pointerEvents: "none",
            }}
          />
        )}

        {/* 2. Card art area or Protective Slab Encasement */}
        <div
          style={card.isSlabbed ? {
            position: "absolute",
            top: "5%",
            left: "6%",
            width: "88%",
            height: "90%",
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
            className="w-full h-full rounded-[6px]"
            style={{ width: "100%", height: "100%", borderRadius: 6 }}
          >

            {/* Card name bar */}
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
                {card.isSlabbed ? card.name.split('—')[0].trim() : card.name}
              </div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)" }}>
                {card.setNumber}
              </div>
            </div>

            {/* Favorite Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite && onToggleFavorite(card.id);
              }}
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

            {/* Rarity gem */}
            <div style={{
              position: "absolute",
              top: 5,
              left: 5,
              fontSize: 8,
              fontWeight: 700,
              color: "rgba(255,255,255,0.7)",
              background: "rgba(0,0,0,0.5)",
              borderRadius: 4,
              padding: "2px 4px",
              backdropFilter: "blur(4px)",
              zIndex: 30,
            }}>
              {card.rarity === "Special Illustration Rare" ? "SIR" :
               card.rarity === "Illustration Rare" ? "IR" :
               card.rarity === "Ultra Rare" ? "UR" : card.rarity[0] || 'C'}
            </div>

            {/* Price Button — visible on hover only */}
            {hovered && (
              <button
                onClick={(e) => {
                  e.stopPropagation(); // don't trigger favorite toggle
                  setPriceOpen(prev => !prev);
                }}
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
        <img
          src="/sleeve.png"
          alt="sleeve front"
          style={{
            position: "absolute",
            inset: 2,
            width: "calc(100% - 4px)",
            height: "calc(100% - 4px)",
            objectFit: "contain",
            zIndex: 5,
            opacity: 0.22,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* Price Tooltip — only shown when Price button is clicked */}
      {hovered && priceOpen && <PriceTooltip card={card} index={index} />}
    </div>
  );
}

export default React.memo(CardSlot);
