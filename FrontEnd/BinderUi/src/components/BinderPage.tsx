import { CARDS, BINDERS } from "../data/cards"
import CardSlot from "./CardSlot"

interface Props {
  activeBinder: string
}

export default function BinderPage({ activeBinder }: Props) {
  const binder = BINDERS.find((b) => b.id === activeBinder) || BINDERS[0]

  return (
    <main
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        padding: "20px 24px",
      }}
    >
      {/* Topbar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 20,
        flexShrink: 0,
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f0f2" }}>
            {binder.name}
          </h1>
          <p style={{ fontSize: 12, color: "#7a7a8a", marginTop: 2 }}>
            {binder.count} cards · Page 1 of {Math.ceil(binder.count / 9)}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <TopBtn label="Grid View" active />
          <TopBtn label="List View" />
          <div style={{ width: 1, background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <TopBtn label="+ Add Card" accent />
        </div>
      </div>

      {/* Binder book */}
      <div style={{ flex: 1, overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            width: "100%",
            maxWidth: 860,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 20,
            padding: "28px 28px 32px",
            boxShadow: "0 40px 120px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.08)",
            position: "relative",
          }}
        >
          {/* Spine line */}
          <div style={{
            position: "absolute",
            left: "50%",
            top: 20,
            bottom: 20,
            width: 1,
            background: "rgba(255,255,255,0.05)",
            transform: "translateX(-50%)",
          }} />

          {/* Ring holes decoration */}
          {[20, 35, 50, 65, 80].map((pct) => (
            <div
              key={pct}
              style={{
                position: "absolute",
                left: "50%",
                top: `${pct}%`,
                transform: "translate(-50%, -50%)",
                width: 12,
                height: 12,
                borderRadius: "50%",
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(255,255,255,0.06)",
                zIndex: 2,
              }}
            />
          ))}

          {/* 9-pocket grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 14,
              position: "relative",
            }}
          >
            {CARDS.map((card, i) => (
              <CardSlot key={card?.id ?? `empty-${i}`} card={card} index={i} />
            ))}
          </div>

          {/* Page number */}
          <div style={{
            position: "absolute",
            bottom: 10,
            left: "50%",
            transform: "translateX(-50%)",
            fontSize: 10,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
          }}>
            PAGE 1
          </div>
        </div>
      </div>

      {/* Bottom pagination */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 14, flexShrink: 0 }}>
        {[1, 2, 3, "...", 12].map((p, i) => (
          <button
            key={i}
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.1)",
              background: p === 1 ? "rgba(68,138,255,0.2)" : "rgba(255,255,255,0.04)",
              color: p === 1 ? "#448aff" : "#7a7a8a",
              fontSize: 12,
              fontWeight: p === 1 ? 600 : 400,
              cursor: "pointer",
            }}
          >
            {p}
          </button>
        ))}
      </div>
    </main>
  )
}

function TopBtn({ label, active, accent }: { label: string; active?: boolean; accent?: boolean }) {
  return (
    <button style={{
      padding: "6px 14px",
      borderRadius: 8,
      border: `1px solid ${accent ? "#448aff" : active ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.08)"}`,
      background: accent ? "rgba(68,138,255,0.15)" : active ? "rgba(255,255,255,0.08)" : "transparent",
      color: accent ? "#448aff" : active ? "#f0f0f2" : "#7a7a8a",
      fontSize: 12,
      fontWeight: 500,
      cursor: "pointer",
    }}>
      {label}
    </button>
  )
}
