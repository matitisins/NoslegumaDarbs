import React from "react";

function number(value) {
  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : 0;
}

function format(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "—";
  }

  return value;
}

function SummaryRow({
  label,
  value1,
  value2,
  higherIsBetter = true,
}) {
  const first = number(value1);
  const second = number(value2);

  const firstBetter =
    higherIsBetter
      ? first > second
      : first < second;

  const secondBetter =
    higherIsBetter
      ? second > first
      : second < first;

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
    {
      label: "Spēles",
      value1:
        player1.appearances,
      value2:
        player2.appearances,
    },
    {
      label: "Vārti",
      value1: player1.goals,
      value2: player2.goals,
    },
    {
      label: "Assist",
      value1: player1.assists,
      value2: player2.assists,
    },
    {
      label: "Pen. vārti",
      value1:
        player1.penalties,
      value2:
        player2.penalties,
    },
    {
      label: "Fantasy",
      value1: player1.points,
      value2: player2.points,
    },
    {
      label: "Minūtes",
      value1: player1.minutes,
      value2: player2.minutes,
    },
    {
      label: "Clean sheets",
      value1:
        player1.cleanSheets,
      value2:
        player2.cleanSheets,
    },
  ];

  const availableRows =
    rows.filter(
      row =>
        row.value1 !== null ||
        row.value2 !== null
    );

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Statistikas kopsavilkums
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-900">
            {player1.name}
            <span className="mx-2 text-slate-300">
              vs
            </span>
            {player2.name}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-[10px] font-bold text-rose-500">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            {player1.name}
          </span>

          <span className="flex items-center gap-2 text-[10px] font-bold text-emerald-600">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            {player2.name}
          </span>
        </div>
      </div>

      {availableRows.length > 0 ? (
        <div>
          {availableRows.map(row => (
            <SummaryRow
              key={row.label}
              label={row.label}
              value1={row.value1}
              value2={row.value2}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 p-8 text-center">
          <p className="text-sm text-slate-400">
            Nav pieejamu salīdzināmu statistikas datu.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] leading-5 text-slate-400">
          Izceltais skaitlis norāda augstāko pieejamo
          vērtību konkrētajā statistikas rādītājā.
        </p>
      </div>
    </section>
  );
}