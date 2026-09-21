import React from "react";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function format(value) {
  return value === null ||
    value === undefined
    ? "—"
    : value;
}

function SummaryRow({
  label,
  value1,
  value2,
}) {
  const first = number(value1);
  const second = number(value2);

  const firstBetter = first > second;
  const secondBetter = second > first;

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <div
        className={`text-right text-sm font-black ${
          firstBetter
            ? "text-rose-500"
            : "text-slate-700"
        }`}
      >
        {format(value1)}
      </div>

      <div className="min-w-[100px] text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div
        className={`text-left text-sm font-black ${
          secondBetter
            ? "text-emerald-600"
            : "text-slate-700"
        }`}
      >
        {format(value2)}
      </div>
    </div>
  );
}

export default function ComparisonSummary({
  player1,
  player2,
}) {
  if (!player1 || !player2) {
    return null;
  }

  const rows = [
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
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">
          Kopsavilkums
        </p>

        <h2 className="mt-1 text-lg font-black text-slate-900">
          Galvenās atšķirības
        </h2>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="text-right">
          <p className="truncate text-xs font-black text-rose-500">
            {player1.name}
          </p>
        </div>

        <div>
          <p className="truncate text-xs font-black text-emerald-600">
            {player2.name}
          </p>
        </div>
      </div>

      <div>
        {rows.map(
          ([label, value1, value2]) => {
            if (
              value1 === null &&
              value2 === null
            ) {
              return null;
            }

            return (
              <SummaryRow
                key={label}
                label={label}
                value1={value1}
                value2={value2}
              />
            );
          }
        )}
      </div>
    </section>
  );
}