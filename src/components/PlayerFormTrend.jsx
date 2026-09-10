// src/components/PlayerFormTrend.jsx

import React from "react";

export default function PlayerFormTrend({ player }) {
  const form = Array.isArray(player?.recentForm)
    ? player.recentForm
    : [6, 2, 9, 12, 7];

  const max = Math.max(...form, 10);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mt-6 shadow-sm">
      <div className="flex justify-between mb-3">
        <span className="text-xs uppercase font-semibold text-emerald-600">
          Pēdējo 5 spēļu forma
        </span>

        <span className="text-xs text-slate-500">
          {player.name}
        </span>
      </div>

      <div className="flex items-end justify-between gap-2 h-24 pt-4 px-2 bg-slate-50 rounded-lg">
        {form.map((points, index) => {
          const value = Number(points) || 0;

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1 h-full justify-end"
            >
              <span className="text-[10px] font-bold">
                {value}
              </span>

              <div
                className="w-full bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all"
                style={{
                  height: `${Math.max((value / max) * 100, 10)}%`,
                }}
              />

              <span className="text-[9px] text-slate-400">
                #{index + 1}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}