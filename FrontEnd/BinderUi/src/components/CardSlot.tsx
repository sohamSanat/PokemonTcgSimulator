import { useState } from "react"
import type { Card } from "../data/cards"
import PriceTooltip from "./PriceTooltip"

const CARD_GRADIENTS: Record<string, string> = {
  Fire: "linear-gradient(160deg, #3d1a00, #8b2500)",
  Water: "linear-gradient(160deg, #001a3d, #004080)",
  Grass: "linear-gradient(160deg, #0a2200, #1a4d00)",
  Psychic: "linear-gradient(160deg, #2d0040, #6b0080)",
  Lightning: "linear-gradient(160deg, #2d2200, #806200)",
  Fighting: "linear-gradient(160deg, #2d1200, #5c2e00)",
  Dragon: "linear-gradient(160deg, #00182d, #003d70)",
  Colorless: "linear-gradient(160deg, #1a1a1a, #333333)",
}

const RARITY_GLOW: Record<string, string> = {
  "Special Illustration Rare": "0 0 20px rgba(255,200,50,0.4), 0 0 60px rgba(255,180,0,0.15)",
  "Illustration Rare": "0 0 16px rgba(180,100,255,0.4), 0 0 40px rgba(150,80,255,0.12)",
  "Ultra Rare": "0 0 14px rgba(68,138,255,0.4), 0 0 30px rgba(68,138,255,0.1)",
  "Rare": "0 0 8px rgba(200,200,220,0.3)",
  "Uncommon": "none",
  "Common": "none",
}

interface Props {
  card: Card | null
  index: number
}

export default function CardSlot({ card, index }: Props) {
  const [hovered, setHovered] = useState(false)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    })
  }

  // Empty slot
  if (!card) {
    return (
      <div
        style={{
          aspectRatio: "2.5/3.5",
          borderRadius: 10,
          border: "1.5px dashed rgba(255,255,255,0.1)",
          background: "rgba(255,255,255,0.02)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          transition: "border-color 0.2s, background 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.22)"
          e.currentTarget.style.background = "rgba(255,255,255,0.04)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"
          e.currentTarget.style.background = "rgba(255,255,255,0.02)"
        }}
      >
        <div style={{ color: "rgba(255,255,255,0.2)", fontSize: 24, userSelect: "none" }}>+</div>
      </div>
    )
  }

  const rotateX = hovered ? -mousePos.y * 8 : 0
  const rotateY = hovered ? mousePos.x * 8 : 0

  return (
    <div
      style={{
        position: "relative",
        aspectRatio: "2.5/3.5",
        perspective: 800,
        zIndex: hovered ? 10 : 1,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMouseMove}
    >
      {/* Sleeve outer */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 10,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)",
          padding: "3px",
          boxShadow: hovered
            ? `0 20px 60px rgba(0,0,0,0.8), ${RARITY_GLOW[card.rarity] || "none"}`
            : `0 4px 16px rgba(0,0,0,0.4), ${RARITY_GLOW[card.rarity] || "none"}`,
          transform: hovered
            ? `translateY(-8px) scale(1.04) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`
            : "translateY(0) scale(1) rotateX(0deg) rotateY(0deg)",
          transition: hovered
            ? "transform 0.05s ease-out, box-shadow 0.2s ease"
            : "transform 0.3s ease, box-shadow 0.3s ease",
          transformStyle: "preserve-3d",
          cursor: "pointer",
        }}
      >
        {/* Card art area */}
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 8,
            overflow: "hidden",
            position: "relative",
            background: CARD_GRADIENTS[card.type] || "#1a1a1e",
          }}
        >
          {/* Card image */}
          <img
            src={card.imageUrl}
            alt={card.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              opacity: 0.85,
            }}
            loading="lazy"
          />

          {/* Holo shimmer overlay */}
          {card.holofoil && (
            <div
              className="holo-shimmer"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: 8,
                mixBlendMode: "screen",
                opacity: hovered ? 0.8 : 0.4,
                transition: "opacity 0.2s",
              }}
            />
          )}

          {/* Card name bar */}
          <div style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "20px 8px 6px",
            background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
          }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#f0f0f2", letterSpacing: "0.02em", textShadow: "0 1px 4px rgba(0,0,0,0.8)" }}>
              {card.name}
            </div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.55)" }}>
              {card.setNumber}
            </div>
          </div>

          {/* Favorite indicator */}
          {card.favorite && (
            <div style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 14,
              height: 14,
              background: "rgba(255,200,50,0.9)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 7,
              boxShadow: "0 0 8px rgba(255,200,50,0.5)",
            }}>
              ★
            </div>
          )}

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
          }}>
            {card.rarity === "Special Illustration Rare" ? "SIR" :
             card.rarity === "Illustration Rare" ? "IR" :
             card.rarity === "Ultra Rare" ? "UR" : card.rarity[0]}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {hovered && (
        <div style={{ position: "absolute", bottom: "100%", left: "50%", transform: "translateX(-50%)", width: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", bottom: 8, left: "50%", transform: "translateX(-50%)", whiteSpace: "nowrap" }}>
            <PriceTooltip card={card} />
          </div>
        </div>
      )}
    </div>
  )
}
