import React from "react";
import { Folder, Crown } from "lucide-react";

interface BinderIconProps {
  /** Name of the binder used to match color themes and icons */
  name: string;
  /** Explicit override flag for Master Set styling */
  isMasterSet?: boolean;
  /** Whether this binder is currently selected in the sidebar */
  isActive?: boolean;
}

/**
 * BinderIcon component rendering themed gradients, borders, and shadows for binders.
 */
const BinderIcon = React.memo(({ name, isMasterSet, isActive }: BinderIconProps) => {
  // Preset color gradients mapped by binder title
  const colors: Record<string, string> = {
    "My Collection (Opened)": "from-emerald-500 to-emerald-700",
    "Chase Cards": "from-amber-500 to-amber-700",
    "Charizard Collection": "from-red-500 to-red-800",
    "Master Set — SV": "from-purple-500 to-purple-800",
    "Evolving Skies": "from-blue-500 to-blue-800",
  };

  const isMaster = isMasterSet || name.includes("Master Set");
  
  const bgGradient = isMaster
    ? "from-amber-500 to-purple-600"
    : colors[name] || "from-indigo-500 to-indigo-700";

  const borderStyle = isActive
    ? isMaster ? "border-amber-400/80" : "border-white/40"
    : "border-white/15";

  const shadowStyle = isMaster
    ? "shadow-[0_0_16px_rgba(245,158,11,0.5),0_0_30px_rgba(168,85,247,0.3)]"
    : isActive ? "shadow-[0_0_16px_rgba(245,158,11,0.35)]" : "shadow-md";

  const transformStyle = isActive ? "scale-105" : "scale-100";

  return (
    <div
      className={`w-11 h-11 rounded-xl bg-gradient-to-br ${bgGradient} border ${borderStyle} flex-shrink-0 flex items-center justify-center text-[#f0f0f2] ${shadowStyle} transition-transform duration-200 ${transformStyle}`}
    >
      {isMaster ? <Crown className="w-5 h-5 text-amber-200 drop-shadow" /> : <Folder className="w-5 h-5 text-white/90" />}
    </div>
  );
});

BinderIcon.displayName = "BinderIcon";
export default BinderIcon;
