import React from "react";

const initials = name =>
  String(name || "")
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PL";

export default function PlayerIdentity({
  player,
  color = "emerald",
}) {
  const rose = color === "rose";

  return (
    <div className="relative flex items-center gap-4">
      <div
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${
          rose
            ? "bg-rose-50 text-rose-500"
            : "bg-emerald-50 text-emerald-600"
        }`}
      >
        {initials(player?.name)}
      </div>

      <div className="min-w-0">
        <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
          {player?.positionLabel ||
            player?.position ||
            "Spēlētājs"}
        </p>

        <h3 className="mt-1 truncate text-xl font-black">
          {player?.name || "Nezināms spēlētājs"}
        </h3>

        <p className="mt-1 truncate text-xs text-slate-400">
          {player?.team || "Nezināms klubs"}
        </p>
      </div>
    </div>
  );
}