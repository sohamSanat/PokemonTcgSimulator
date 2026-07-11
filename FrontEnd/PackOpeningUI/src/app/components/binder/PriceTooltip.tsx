import React from "react";
import { ResponsiveContainer, AreaChart, Area, Tooltip } from "recharts";
import type { Card } from "./types";

interface Props {
  card: Card;
  index?: number;
}

function PriceTooltip({ card, index = 4 }: Props) {
  const positive = card.priceChange >= 0;
  const color = positive ? "#00e676" : "#ff5252";
  const bgColor = positive ? "rgba(0, 230, 118, 0.12)" : "rgba(255, 82, 82, 0.12)";
  const borderColor = positive ? "rgba(0, 230, 118, 0.3)" : "rgba(255, 82, 82, 0.3)";

  // Calculate 30-day min and max
  const history = card.priceHistory && card.priceHistory.length > 0
    ? card.priceHistory
    : [
        { day: 1, price: card.currentPrice * 0.95 },
        { day: 15, price: card.currentPrice * 1.02 },
        { day: 30, price: card.currentPrice },
      ];
  const prices = history.map(p => p.price);
  const minPrice = Math.min(...prices).toFixed(2);
  const maxPrice = Math.max(...prices).toFixed(2);

  // Smart grid positioning: Top row (index 0, 1, 2) appears BELOW card; others appear ABOVE card
  const isTopRow = index < 3;
  const colIndex = index % 3;

  let horizontalStyle: React.CSSProperties = { left: "50%", transform: "translateX(-50%)" };
  let arrowLeft = "50%";

  if (colIndex === 0) {
    // Left column: align to left edge so it never overflows left boundary
    horizontalStyle = { left: -4, transform: "none" };
    arrowLeft = "42px";
  } else if (colIndex === 2) {
    // Right column: align to right edge so it never overflows right boundary
    horizontalStyle = { right: -4, left: "auto", transform: "none" };
    arrowLeft = "calc(100% - 42px)";
  }

  const verticalStyle: React.CSSProperties = isTopRow
    ? { top: "calc(100% + 14px)", bottom: "auto" }
    : { bottom: "calc(100% + 14px)", top: "auto" };

  return (
    <div
      style={{
        position: "absolute",
        ...verticalStyle,
        ...horizontalStyle,
        width: 256,
        background: "rgba(16, 16, 22, 0.96)",
        border: "1px solid rgba(255, 255, 255, 0.16)",
        borderRadius: 16,
        padding: "16px 16px 14px",
        backdropFilter: "blur(24px)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(255,255,255,0.06) inset, 0 10px 30px rgba(0,0,0,0.5)",
        zIndex: 500,
        pointerEvents: "none",
        animation: "fadeInScale 0.15s ease-out forwards",
      }}
    >
      {/* Arrow pointing to card */}
      <div
        style={{
          position: "absolute",
          ...(isTopRow ? { top: -6 } : { bottom: -6 }),
          left: arrowLeft,
          transform: "translateX(-50%) rotate(45deg)",
          width: 12,
          height: 12,
          background: "rgba(16, 16, 22, 0.96)",
          border: "1px solid rgba(255, 255, 255, 0.16)",
          ...(isTopRow
            ? { borderBottom: "none", borderRight: "none" }
            : { borderTop: "none", borderLeft: "none" }),
        }}
      />

      {/* Header: Name & Rarity Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 4 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#ffffff", lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {card.name}
        </div>
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: "rgba(255,255,255,0.8)",
            background: "rgba(255,255,255,0.1)",
            padding: "2px 6px",
            borderRadius: 6,
            whiteSpace: "nowrap",
            letterSpacing: "0.03em",
          }}
        >
          {card.rarity === "Special Illustration Rare" ? "SIR" :
           card.rarity === "Illustration Rare" ? "IR" :
           card.rarity === "Ultra Rare" ? "UR" :
           card.rarity === "Rare Holo" ? "Holo" : card.rarity}
        </div>
      </div>

      {/* Subheader: Set info */}
      <div style={{ fontSize: 11, color: "#8e8e9f", marginBottom: 12, fontWeight: 500 }}>
        {card.setName} · <span style={{ color: "#b0b0c0" }}>#{card.setNumber}</span>
      </div>

      {/* Price & 30D Trend Banner */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, background: "rgba(255,255,255,0.03)", padding: "8px 10px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
        <div>
          <div style={{ fontSize: 9, color: "#7a7a8a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 2 }}>Market Price</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#ffffff", letterSpacing: "-0.03em", fontFamily: "monospace" }}>
            ${card.currentPrice.toFixed(2)}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: color,
            background: bgColor,
            border: `1px solid ${borderColor}`,
            borderRadius: 20,
            padding: "3px 8px",
            display: "flex",
            alignItems: "center",
            gap: 3,
            boxShadow: `0 0 12px ${bgColor}`,
          }}
        >
          <span>{positive ? "▲" : "▼"}</span>
          <span>{Math.abs(card.priceChange)}%</span>
        </div>
      </div>

      {/* 30-Day Market Area Chart */}
      <div style={{ position: "relative", height: 64, marginBottom: 14, background: "rgba(0,0,0,0.25)", borderRadius: 8, padding: "4px 0", border: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ position: "absolute", top: 4, left: 6, fontSize: 8, color: "rgba(255,255,255,0.3)", fontWeight: 600, letterSpacing: "0.05em" }}>
          30D TRAJECTORY
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 14, right: 4, bottom: 2, left: 4 }}>
            <defs>
              <linearGradient id={`spark-fill-${card.id}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45} />
                <stop offset="100%" stopColor={color} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Tooltip content={() => null} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={color}
              strokeWidth={2}
              fill={`url(#spark-fill-${card.id})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Stats Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 10 }}>
        <div>
          <div style={{ fontSize: 9, color: "#7a7a8a", marginBottom: 2 }}>30D LOW</div>
          <div style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 600, fontFamily: "monospace" }}>${minPrice}</div>
        </div>
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", borderRight: "1px solid rgba(255,255,255,0.08)", paddingLeft: 8 }}>
          <div style={{ fontSize: 9, color: "#7a7a8a", marginBottom: 2 }}>30D HIGH</div>
          <div style={{ fontSize: 12, color: "#e0e0e0", fontWeight: 600, fontFamily: "monospace" }}>${maxPrice}</div>
        </div>
        <div style={{ paddingLeft: 4, textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#7a7a8a", marginBottom: 2 }}>TYPE</div>
          <div style={{ fontSize: 11, color: "#ffffff", fontWeight: 600 }}>{card.type}</div>
        </div>
      </div>
    </div>
  );
}

export default React.memo(PriceTooltip);
