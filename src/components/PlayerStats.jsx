/*
 * Attēlo spēlētāja galvenos statistikas rādītājus un vizuālās statistikas
 * joslas, kā arī papildu sezonas informāciju, piemēram, vārtus, rezultatīvās
 * piespēles, Flow punktus, spēles, soda vārtus un nospēlētās minūtes.
 */

import React from "react";
import PlayerStatBar from "./PlayerStatBar";

const display = value =>
  value === null || value === undefined
    ? "—"
    : value;

export default function PlayerStats({
  player,
  color = "emerald",
  maxGoals = 1,
  maxAssists = 1,
  maxPoints = 1,
  maxAppearances = 1,
}) {
  const barColor =
    color === "rose" ? "rose" : "emerald";

  const bars = [
    [
      "Vārti",
      player.goals,
      maxGoals,
    ],
    [
      "Assist",
      player.assists,
      maxAssists,
    ],
    [
      "Fantasy punkti",
      player.points,
      maxPoints,
    ],
    [
      "Spēles",
      player.appearances,
      maxAppearances,
    ],
  ];

  const extras = [
    ["Pen. vārti", player.penalties],
    ["Minūtes", player.minutes],
    ["Clean sheets", player.cleanSheets],
    ["Sezona", player.season],
  ];

  return (
    <>
      <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-4">
        <BasicStat
          label="Spēles"
          value={player.appearances}
        />

        <BasicStat
          label="Vārti"
          value={player.goals}
        />

        <BasicStat
          label="Assist"
          value={player.assists}
        />

        <BasicStat
          label="Fantasy"
          value={player.points}
          accent
        />
      </div>

      <div className="space-y-4 p-5">
        {bars.map(([label, value, max]) => (
          <PlayerStatBar
            key={label}
            label={label}
            value={Number(value) || 0}
            max={max}
            color={barColor}
          />
        ))}
      </div>

      <div className="border-t border-slate-100 p-5">
        <div className="grid grid-cols-2 gap-3">
          {extras.map(([label, value]) => (
            <div
              key={label}
              className="rounded-xl bg-slate-50 p-3"
            >
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>

              <p className="mt-1 text-lg font-black text-slate-800">
                {display(value)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function BasicStat({
  label,
  value,
  accent = false,
}) {
  return (
    <div className="bg-white p-4 text-center">
      <p
        className={`text-xl font-black ${
          accent
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {display(value)}
      </p>

      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}