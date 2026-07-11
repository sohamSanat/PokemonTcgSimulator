import Sidebar from "./components/Sidebar"
import BinderPage from "./components/BinderPage"
import { useState } from "react"
import { BINDERS } from "./data/cards"

export default function App() {
  const [activeBinder, setActiveBinder] = useState(BINDERS[0].id)
  const [activeSort, setActiveSort] = useState("rarity")

  return (
    <div
      style={{
        display: "flex",
        width: "100vw",
        height: "100vh",
        background: "radial-gradient(ellipse at 20% 50%, #1a0a2e 0%, #0d0d0f 60%)",
        overflow: "hidden",
      }}
    >
      <Sidebar
        activeBinder={activeBinder}
        onSelectBinder={setActiveBinder}
        activeSort={activeSort}
        onSortChange={setActiveSort}
      />
      <BinderPage activeBinder={activeBinder} />
    </div>
  )
}
