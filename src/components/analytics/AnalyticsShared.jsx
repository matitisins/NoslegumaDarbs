import React from "react";

function PlayerMiniCard({
  player,
  score,
  rank,
  action,
  actionLabel,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {player.photo ? (
          <img
            src={player.photo}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
            {String(
              player.name || "PL"
            )
              .split(" ")
              .map(part =>
                part[0]
              )
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">
            {rank && (
              <span className="mr-2 text-slate-300">
                #{rank}
              </span>
            )}
            {player.name}
          </p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {player.team} · {player.positionLabel}
          </p>
        </div>

        {score !== undefined && (
          <div className="text-right">
            <p className="text-lg font-black text-emerald-600">
              {Math.round(score)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Score
            </p>
          </div>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}


export { PlayerMiniCard };