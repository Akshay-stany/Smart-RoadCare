export default function RoadCareLogo({
  size = "md",
  showText = true,
  theme = "dark",
  subtext,
  className = "",
}) {
  const sizeMap = {
    sm: { box: "w-8 h-8 rounded-lg", icon: "w-4 h-4", text: "text-base", sub: "text-[9px]" },
    md: { box: "w-9 h-9 rounded-xl", icon: "w-5 h-5", text: "text-lg", sub: "text-[10px]" },
    lg: { box: "w-11 h-11 rounded-2xl", icon: "w-6 h-6", text: "text-2xl", sub: "text-xs" },
  };

  const current = sizeMap[size] || sizeMap.md;
  const isLightText = theme === "light" || theme === "white";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Brand Icon with Road Infrastructure Motifs */}
      <div
        className={`${current.box} bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 shrink-0 ring-1 ring-white/20`}
      >
        <svg
          className={`${current.icon} text-white`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Road highway converging lanes */}
          <path d="M4 21L8.5 3" />
          <path d="M20 21L15.5 3" />
          {/* Dashed center markings */}
          <path d="M12 5V7.5" strokeWidth="2.5" />
          <path d="M12 11V13.5" strokeWidth="2.5" />
          <path d="M12 17V19.5" strokeWidth="2.5" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col text-left">
          <span
            className={`font-black tracking-tight leading-none ${current.text} ${
              isLightText ? "text-white" : "text-slate-900"
            }`}
          >
            RoadCare
          </span>
          {subtext && (
            <span
              className={`font-semibold tracking-wider uppercase mt-0.5 leading-none ${current.sub} text-emerald-400`}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
