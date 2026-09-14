// src/components/PlayerCard.jsx

import React from "react";
import PlayerFormTrend from "./PlayerFormTrend";
import PlayerStatBar from "./PlayerStatBar";

export default function PlayerCard({
  player,
  players,
  onChange,
  color = "emerald",
}) {
  if (!player) return null;

  const colorText =
    color === "rose"
      ? "text-rose-600"
      : "text-emerald-600";

  const statColor =
    color === "rose"
      ? "bg-rose-500"
      : "bg-emerald-500";

  const points =
    Number(player.points) || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
      <div className="flex justify-between items-center mb-4 gap-3">
        <span
          className={`bg-slate-100 ${colorText} text-xs font-bold px-2.5 py-1 rounded`}
        >
          {player.positionLabel ||
            player.position}
        </span>

        <span className="text-xs text-slate-500 text-right">
          Klubs:{" "}
          <strong className="text-slate-800">
            {player.team}
          </strong>
        </span>
      </div>

      <select
        value={player.id}
        onChange={onChange}
        className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 mb-6 text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
      >
        {players.map((item) => (
          <option
            key={`${item.id}-${item.teamId || ""}`}
            value={item.id}
          >
            {item.name} ({item.team})
          </option>
        ))}
      </select>

      <div className="space-y-4 text-sm">
        <div>
          <div className="flex justify-between text-slate-600 mb-1">
            <span>Fantasy Punkti</span>

            <span className="font-bold text-slate-900">
              {points}
            </span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
            <div
              className={`${statColor} h-full transition-all`}
              style={{
                width: `${Math.min(
                  points * 2,
                  100
                )}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-slate-400">
              Spēles
            </p>

            <p className="font-bold text-slate-800">
              {player.appearances}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-slate-400">
              Minūtes
            </p>

            <p className="font-bold text-slate-800">
              {player.minutes}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-slate-400">
              Vārti
            </p>

            <p className="font-bold text-slate-800">
              {player.goals}
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-3">
            <p className="text-[10px] uppercase text-slate-400">
              Assistē
            </p>

            <p className="font-bold text-slate-800">
              {player.assists}
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100">
          <p className="text-xs text-emerald-600 uppercase font-semibold mb-3">
            Pozīcijas statistika
          </p>

          <div className="space-y-3">
            {Object.entries(
              player.customStats || {}
            ).map(([key, value]) => (
              <PlayerStatBar
                key={key}
                label={key}
                value={value}
                colorClass={statColor}
              />
            ))}
          </div>
        </div>

        {player.rating > 0 && (
          <div className="pt-3 border-t border-slate-100 flex justify-between">
            <span className="text-slate-500">
              API reitings
            </span>

            <strong className="text-slate-900">
              {Number(player.rating).toFixed(2)}
            </strong>
          </div>
        )}
      </div>

      <PlayerFormTrend player={player} />
    </div>
  );
}