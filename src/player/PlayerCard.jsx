import React from "react";
import PlayerFormTrend from "./PlayerFormTrend";
import PlayerHeader from "./PlayerHeader";
import PlayerStats from "./PlayerStats";

export default function PlayerCard({
  player,
  players = [],
  onChange,
  color = "emerald",
}) {
  if (!player) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex min-h-[280px] items-center justify-center text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
              👤
            </div>

            <p className="mt-4 text-sm font-bold text-slate-500">
              Izvēlies spēlētāju
            </p>
          </div>
        </div>
      </div>
    );
  }

  const rose = color === "rose";

  const max = key =>
    Math.max(
      1,
      ...players.map(
        item => Number(item?.[key]) || 0
      )
    );

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${
        rose ? "border-rose-200" : "border-emerald-200"
      } bg-white shadow-sm`}
    >
      <PlayerHeader
        player={player}
        color={color}
      />

      <PlayerStats
        player={player}
        color={color}
        maxGoals={max("goals")}
        maxAssists={max("assists")}
        maxPoints={max("points")}
        maxAppearances={max("appearances")}
      />

      {Array.isArray(player.recentForm) &&
        player.recentForm.length > 0 && (
          <div className="border-t border-slate-100 p-5">
            <PlayerFormTrend player={player} />
          </div>
        )}

      <div className="border-t border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Player ID
          </span>

          <span className="max-w-[180px] truncate text-[10px] font-bold text-slate-500">
            {player.id}
          </span>
        </div>
      </div>
    </div>
  );
}