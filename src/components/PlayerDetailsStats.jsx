/*
 * Attēlo spēlētāja individuālās statistikas kopsavilkumu.
 * Parāda galvenos sezonas statistikas rādītājus, spēlētāja pozīciju,
 * klubu, sezonu un spēlētāja ID.
 */

import React from "react";

function value(input) {
  return input === null ||
    input === undefined ||
    input === ""
    ? "—"
    : input;
}

function StatCard({
  label,
  value: statValue,
  accent = false,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
      <p
        className={`text-2xl font-black ${
          accent
            ? "text-emerald-600"
            : "text-slate-900"
        }`}
      >
        {value(statValue)}
      </p>

      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

export default function PlayerDetailsStats({
  player,
}) {
  if (!player) return null;

  const stats = [
    [
      "Spēles",
      player.appearances,
    ],
    ["Vārti", player.goals],
    ["Assist", player.assists],
    [
      "Pen. vārti",
      player.penalties,
    ],
    [
      "Fantasy",
      player.points,
      true,
    ],
  ];

  const details = [
    [
      "Pozīcija",
      player.positionLabel ||
        player.position,
    ],
    ["Klubs", player.team],
    ["Sezona", player.season],
    ["Spēlētāja ID", player.id],
  ];

  return (
    <div>
      <div>
        <h3 className="text-lg font-extrabold text-slate-900">
          Individuālā statistika
        </h3>

        <p className="mt-1 text-xs text-slate-400">
          Pieejamie dati no pašreizējās sezonas API.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {stats.map(
          ([label, statValue, accent]) => (
            <StatCard
              key={label}
              label={label}
              value={statValue}
              accent={accent}
            />
          )
        )}
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {details.map(
          ([label, detailValue]) => (
            <div
              key={label}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {label}
              </p>

              <p className="mt-1 font-bold text-slate-800">
                {value(detailValue)}
              </p>
            </div>
          )
        )}
      </div>
    </div>
  );
}