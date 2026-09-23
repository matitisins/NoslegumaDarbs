/*
 * Attēlo divu izvēlēto spēlētāju galveno statistiku tiešai salīdzināšanai,
 * tostarp spēļu skaitu, vārtus, rezultatīvas piespēles, 11 metru soda sitienu
 * vārtus, Flow punktus, nospēlētās minūtes un tīrās spēles.
 */

import React from "react";

function number(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function Stat({
  label,
  value1,
  value2,
}) {
  const first = number(value1);
  const second = number(value2);

  const firstBetter = first > second;
  const secondBetter = second > first;

  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
      <p className="text-center text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <div className="mt-2 grid grid-cols-2 gap-2 text-center">
        <span
          className={`text-lg font-black ${
            firstBetter
              ? "text-rose-500"
              : "text-slate-700"
          }`}
        >
          {value1 ?? "—"}
        </span>

        <span
          className={`text-lg font-black ${
            secondBetter
              ? "text-emerald-600"
              : "text-slate-700"
          }`}
        >
          {value2 ?? "—"}
        </span>
      </div>
    </div>
  );
}

export default function ComparisonStats({
  player1,
  player2,
}) {
  if (!player1 || !player2) {
    return null;
  }

  const stats = [
    ["Spēles", player1.appearances, player2.appearances],
    ["Vārti", player1.goals, player2.goals],
    ["Assist", player1.assists, player2.assists],
    ["Pen. vārti", player1.penalties, player2.penalties],
    ["Fantasy", player1.points, player2.points],
    ["Minūtes", player1.minutes, player2.minutes],
    ["Clean sheets", player1.cleanSheets, player2.cleanSheets],
  ];

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-500">
          Statistika
        </p>

        <h2 className="mt-1 text-lg font-black text-slate-900">
          Tiešais salīdzinājums
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-rose-50 p-3 text-center">
          <p className="truncate text-xs font-black text-rose-600">
            {player1.name}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-center">
          <p className="truncate text-xs font-black text-emerald-600">
            {player2.name}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map(
          ([label, value1, value2]) => (
            <Stat
              key={label}
              label={label}
              value1={value1}
              value2={value2}
            />
          )
        )}
      </div>
    </section>
  );
}