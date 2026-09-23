/*
 * Attēlo vienu spēlētāju meklēšanas rezultātu sarakstā.
 * Ļauj izvēlēties spēlētāju, apskatīt tā profilu, pievienot vai noņemt
 * spēlētāju no favorītiem un parāda viņa Flow punktus.
 */

import React from "react";
import {
  getInitials,
  isSamePlayer,
} from "./SearchUtils";

function Star({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

export default function SearchResult({
  player,
  selected,
  onSelect,
  onOpen,
  isFavorite,
  onToggleFavorite,
  color = "emerald",
}) {
  if (!player) return null;

  const rose = color === "rose";
  const active = isSamePlayer(
    player,
    selected
  );

  const accent = rose
    ? "text-rose-500"
    : "text-emerald-500";

  const border = rose
    ? "border-rose-100 hover:border-rose-200"
    : "border-emerald-100 hover:border-emerald-200";

  const initialsBg = rose
    ? "bg-rose-50 text-rose-500"
    : "bg-emerald-50 text-emerald-500";

  return (
    <div
      className={`group flex items-center gap-2 border-b ${border} px-3 py-2.5 last:border-b-0`}
    >
      <button
        type="button"
        onClick={() => onSelect?.(player)}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[10px] font-black ${initialsBg}`}
        >
          {getInitials(player.name)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-xs font-extrabold text-slate-800">
              {player.name}
            </p>

            {active && (
              <span
                className={`shrink-0 text-[8px] font-black uppercase tracking-wider ${accent}`}
              >
                Izvēlēts
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-[10px] text-slate-400">
            {player.team || "Nezināms klubs"}
          </p>
        </div>
      </button>

      <div className="hidden text-right sm:block">
        <p className="text-xs font-black text-slate-700">
          {player.points ?? "—"}
        </p>

        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
          pts
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleFavorite?.(player)}
        aria-label={
          isFavorite?.(player)
            ? "Noņemt no favorītiem"
            : "Pievienot favorītiem"
        }
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition ${
          isFavorite?.(player)
            ? "bg-amber-50 text-amber-500"
            : "bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-amber-400"
        }`}
      >
        <Star
          active={Boolean(
            isFavorite?.(player)
          )}
        />
      </button>

      <button
        type="button"
        onClick={() => onOpen?.(player)}
        className={`hidden rounded-lg px-2 py-1.5 text-[9px] font-bold uppercase tracking-wider transition sm:block ${
          rose
            ? "text-rose-400 hover:bg-rose-50"
            : "text-emerald-500 hover:bg-emerald-50"
        }`}
      >
        Skatīt
      </button>
    </div>
  );
}