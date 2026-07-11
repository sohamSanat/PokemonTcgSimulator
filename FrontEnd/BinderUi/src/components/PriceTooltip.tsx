import { ResponsiveContainer, LineChart, Line, Tooltip } from "recharts"
import type { Card } from "../data/cards"

interface Props {
  card: Card
}

export default function PriceTooltip({ card }: Props) {
  const positive = card.priceChange >= 0
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(100% + 12px)",
        left: "50%",
        transform: "translateX(-50%)",
        width: 220,
        background: "rgba(14,14,18,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 14,
        padding: 14,
        backdropFilter: "blur(24px)",
        boxShadow: "0 20px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04) inset",
        zIndex: 100,
        pointerEvents: "none",
        animation: "float-up 0.18s ease-out",
      }}
    >
      {/* Arrow */}
      <div style={{
        position: "absolute",
        bottom: -6,
        left: "50%",
        transform: "translateX(-50%)",
        width: 12,
        height: 12,
        background: "rgba(14,14,18,0.95)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderTop: "none",
        borderLeft: "none",
        rotate: "45deg",
      }} />

      <div style={{ fontSize: 13, fontWeight: 700, color: "#f0f0f2", marginBottom: 2 }}>
        {card.name}
      </div>
      <div style={{ fontSize: 10, color: "#7a7a8a", marginBottom: 10 }}>
        {card.setName} · {card.setNumber}
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 22, fontWeight: 700, color: "#f0f0f2", letterSpacing: "-0.03em" }}>
          ${card.currentPrice.toFixed(2)}
        </span>
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: positive ? "#00e676" : "#ff5252",
          background: positive ? "rgba(0,230,118,0.1)" : "rgba(255,82,82,0.1)",
          borderRadius: 4,
          padding: "2px 5px",
        }}>
          {positive ? "▲" : "▼"} {Math.abs(card.priceChange)}%
        </span>
      </div>

      <div style={{ height: 48, marginBottom: 8 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={card.priceHistory} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
            <defs>
              <linearGradient id={`spark-${card.id}`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={positive ? "#00e676" : "#ff5252"} stopOpacity={0.4} />
                <stop offset="100%" stopColor={positive ? "#00e676" : "#ff5252"} stopOpacity={1} />
              </linearGradient>
            </defs>
            <Tooltip content={() => null} />
            <Line
              type="monotone"
              dataKey="price"
              stroke={`url(#spark-${card.id})`}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 9, color: "#7a7a8a", marginBottom: 2 }}>RARITY</div>
          <div style={{ fontSize: 11, color: "#f0f0f2", fontWeight: 500 }}>{card.rarity}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 9, color: "#7a7a8a", marginBottom: 2 }}>30-DAY</div>
          <div style={{ fontSize: 11, color: "#f0f0f2", fontWeight: 500 }}>Low ${Math.min(...card.priceHistory.map(p => p.price)).toFixed(0)}</div>
        </div>
      </div>
    </div>
  )
}
