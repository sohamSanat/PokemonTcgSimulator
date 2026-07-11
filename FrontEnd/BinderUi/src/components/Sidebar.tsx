import { BINDERS } from "../data/cards"

const SETS = ["All Sets", "Obsidian Flames", "Evolving Skies", "Silver Tempest", "Scarlet & Violet"]
const RARITIES = ["All Rarities", "Common", "Rare", "Ultra Rare", "Illustration Rare", "Special IR"]
const TYPES = ["All Types", "Fire", "Water", "Grass", "Psychic", "Lightning", "Dragon"]

interface Props {
  activeBinder: string
  onSelectBinder: (id: string) => void
  activeSort: string
  onSortChange: (s: string) => void
}

const BinderIcon = ({ name }: { name: string }) => {
  const colors: Record<string, string> = {
    "Chase Cards": "linear-gradient(135deg, #ff6b35, #f7c59f)",
    "Charizard Collection": "linear-gradient(135deg, #ff4500, #ff8c00)",
    "Master Set — SV": "linear-gradient(135deg, #7b2fff, #b16cfa)",
    "Evolving Skies": "linear-gradient(135deg, #0077ff, #00c6ff)",
  }
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 8,
        background: colors[name] || "linear-gradient(135deg, #333, #555)",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 14,
      }}
    >
      {name[0]}
    </div>
  )
}

export default function Sidebar({ activeBinder, onSelectBinder }: Props) {
  return (
    <aside
      style={{
        width: 260,
        minWidth: 260,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "rgba(255,255,255,0.03)",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        backdropFilter: "blur(20px)",
        overflow: "hidden",
      }}
    >
      {/* Profile header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7b2fff, #448aff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            TP
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f2" }}>TrainerPro</div>
            <div style={{ fontSize: 11, color: "#7a7a8a" }}>Elite Collector</div>
          </div>
          <div style={{ marginLeft: "auto" }}>
            <div style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#00e676", boxShadow: "0 0 8px #00e676"
            }} />
          </div>
        </div>

        {/* Portfolio value */}
        <div
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 12,
            padding: "14px 16px",
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 10, letterSpacing: "0.12em", color: "#7a7a8a", textTransform: "uppercase", marginBottom: 4 }}>
            Portfolio Value
          </div>
          <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.03em", color: "#f0f0f2" }}>
            $14,582<span style={{ fontSize: 16, color: "#7a7a8a" }}>.00</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <span style={{
              fontSize: 11, color: "#00e676", fontWeight: 600,
              background: "rgba(0,230,118,0.1)", borderRadius: 4, padding: "2px 6px"
            }}>
              ▲ 4.2%
            </span>
            <span style={{ fontSize: 11, color: "#7a7a8a" }}>this month</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "0 20px", marginBottom: 16 }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#7a7a8a", textTransform: "uppercase", marginBottom: 10 }}>
          Filters
        </div>
        <FilterSelect label="Set" options={SETS} />
        <FilterSelect label="Rarity" options={RARITIES} />
        <FilterSelect label="Type" options={TYPES} />
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Toggle label="Holofoil" />
          <Toggle label="Favorites" />
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(255,255,255,0.06)", margin: "0 20px 16px" }} />

      {/* Binder list */}
      <div style={{ flex: 1, overflow: "auto", padding: "0 12px 20px" }}>
        <div style={{ fontSize: 10, letterSpacing: "0.1em", color: "#7a7a8a", textTransform: "uppercase", marginBottom: 10, paddingLeft: 8 }}>
          My Binders
        </div>
        {BINDERS.map((binder) => (
          <button
            key={binder.id}
            onClick={() => onSelectBinder(binder.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "9px 10px",
              borderRadius: 10,
              border: "none",
              cursor: "pointer",
              background: activeBinder === binder.id
                ? "rgba(255,255,255,0.08)"
                : "transparent",
              marginBottom: 2,
              transition: "background 0.15s",
              textAlign: "left",
            }}
            onMouseEnter={(e) => {
              if (activeBinder !== binder.id)
                (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"
            }}
            onMouseLeave={(e) => {
              if (activeBinder !== binder.id)
                (e.currentTarget as HTMLButtonElement).style.background = "transparent"
            }}
          >
            <BinderIcon name={binder.name} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "#f0f0f2", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {binder.name}
              </div>
              <div style={{ fontSize: 11, color: "#7a7a8a" }}>
                {binder.count} cards · ${binder.value.toLocaleString()}
              </div>
            </div>
            {activeBinder === binder.id && (
              <div style={{ width: 3, height: 20, borderRadius: 2, background: "#448aff", flexShrink: 0 }} />
            )}
          </button>
        ))}

        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "9px 10px",
            borderRadius: 10,
            border: "1px dashed rgba(255,255,255,0.1)",
            cursor: "pointer",
            background: "transparent",
            color: "#7a7a8a",
            fontSize: 12,
            marginTop: 6,
          }}
        >
          <span style={{ fontSize: 16 }}>+</span> New Binder
        </button>
      </div>

      {/* Stats footer */}
      <div style={{
        padding: "14px 20px",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        justifyContent: "space-between",
      }}>
        {[["410", "Cards"], ["12", "Sets"], ["94%", "Complete"]].map(([val, lbl]) => (
          <div key={lbl} style={{ textAlign: "center" }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{val}</div>
            <div style={{ fontSize: 10, color: "#7a7a8a" }}>{lbl}</div>
          </div>
        ))}
      </div>
    </aside>
  )
}

function FilterSelect({ label, options }: { label: string; options: string[] }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <label style={{ fontSize: 10, color: "#7a7a8a", display: "block", marginBottom: 4 }}>{label}</label>
      <select
        style={{
          width: "100%",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 7,
          color: "#f0f0f2",
          fontSize: 12,
          padding: "6px 8px",
          outline: "none",
          cursor: "pointer",
          appearance: "none",
        }}
      >
        {options.map((o) => <option key={o} style={{ background: "#1a1a1e" }}>{o}</option>)}
      </select>
    </div>
  )
}

function Toggle({ label }: { label: string }) {
  return (
    <div style={{
      flex: 1,
      padding: "6px 8px",
      borderRadius: 7,
      border: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(255,255,255,0.03)",
      fontSize: 11,
      color: "#7a7a8a",
      cursor: "pointer",
      textAlign: "center",
      userSelect: "none",
    }}>
      {label}
    </div>
  )
}
