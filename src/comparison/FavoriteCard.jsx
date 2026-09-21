import React from "react";

function Star() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="currentColor"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function initials(name) {
  return (
    String(name || "")
      .split(/\s+/)
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PL"
  );
}

export default function FavoriteCard({
  player,
  onOpen,
  onToggleFavorite,
}) {
  if (!player) return null;

  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <button
        type="button"
        onClick={() =>
          onOpen?.(player)
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
          {initials(player.name)}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {player.name}
          </p>

          <p className="truncate text-xs text-slate-400">
            {player.team ||
              "Nezināms klubs"}
          </p>
        </div>
      </button>

      <div className="text-right">
        <p className="text-sm font-black text-emerald-600">
          {player.points ?? "—"}
        </p>

        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          pts
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onToggleFavorite?.(player)
        }
        title="Noņemt no favorītiem"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 transition hover:bg-amber-100"
      >
        <Star />
      </button>
    </div>
  );
}