/*
 * Attēlo divu spēlētāju statistikas kopsavilkumu salīdzināšanai.
 * Parāda kopīgos statistikas rādītājus un pozīcijai atbilstošus
 * papildu rādītājus, kā arī izceļ labāko rezultātu katrā statistikā.
 */

import React from "react";

const isNumber = value => {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
};

const format = value => {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  return value;
};

const percent = value => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  return `${value}%`;
};

function SummaryRow({
  label,
  value1,
  value2,
  higherIsBetter = true,
}) {
  const firstAvailable = isNumber(value1);
  const secondAvailable = isNumber(value2);

  let firstBetter = false;
  let secondBetter = false;

  if (
    firstAvailable &&
    secondAvailable &&
    Number(value1) !== Number(value2)
  ) {
    firstBetter = higherIsBetter
      ? Number(value1) > Number(value2)
      : Number(value1) < Number(value2);

    secondBetter = higherIsBetter
      ? Number(value2) > Number(value1)
      : Number(value2) < Number(value1);
  }

  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 border-b border-slate-100 py-3 last:border-b-0">
      <div
        className={`text-right text-sm font-black ${
          firstBetter ? "text-rose-500" : "text-slate-700"
        }`}
      >
        {format(value1)}
      </div>

      <div className="min-w-[110px] text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </span>
      </div>

      <div
        className={`text-left text-sm font-black ${
          secondBetter ? "text-emerald-600" : "text-slate-700"
        }`}
      >
        {format(value2)}
      </div>
    </div>
  );
}

const getCommonRows = (player1, player2) => [
  {
    label: "Spēles",
    value1: player1?.appearances,
    value2: player2?.appearances,
  },
  {
    label: "Minūtes",
    value1: player1?.minutes,
    value2: player2?.minutes,
  },
  {
    label: "Vārti",
    value1: player1?.goals,
    value2: player2?.goals,
  },
  {
    label: "Assist",
    value1: player1?.assists,
    value2: player2?.assists,
  },
  {
    label: "Flow punkti",
    value1: player1?.points,
    value2: player2?.points,
  },
  {
    label: "Dzeltenās",
    value1: player1?.advancedStats?.yellowCards,
    value2: player2?.advancedStats?.yellowCards,
    higherIsBetter: false,
  },
  {
    label: "Sarkanās",
    value1: player1?.advancedStats?.redCards,
    value2: player2?.advancedStats?.redCards,
    higherIsBetter: false,
  },
];

const getPositionRows = (player1, player2) => {
  const category = player1?.category;

  if (!category || player2?.category !== category) {
    return [];
  }

  if (category === "GOALKEEPERS") {
    return [
      {
        label: "Saves",
        value1: player1?.advancedStats?.saves,
        value2: player2?.advancedStats?.saves,
      },
      {
        label: "Save %",
        value1: percent(player1?.advancedStats?.savePercentage),
        value2: percent(player2?.advancedStats?.savePercentage),
      },
      {
        label: "Goals conceded",
        value1: player1?.advancedStats?.goalsConceded,
        value2: player2?.advancedStats?.goalsConceded,
        higherIsBetter: false,
      },
      {
        label: "Passes",
        value1: player1?.advancedStats?.passes,
        value2: player2?.advancedStats?.passes,
      },
      {
        label: "Pass accuracy",
        value1: percent(player1?.advancedStats?.passAccuracy),
        value2: percent(player2?.advancedStats?.passAccuracy),
      },
      {
        label: "Rating",
        value1: player1?.advancedStats?.rating,
        value2: player2?.advancedStats?.rating,
      },
    ];
  }

  if (category === "DEFENDERS") {
    return [
      {
        label: "Tackles",
        value1: player1?.advancedStats?.tackles,
        value2: player2?.advancedStats?.tackles,
      },
      {
        label: "Blocks",
        value1: player1?.advancedStats?.blocks,
        value2: player2?.advancedStats?.blocks,
      },
      {
        label: "Interceptions",
        value1: player1?.advancedStats?.interceptions,
        value2: player2?.advancedStats?.interceptions,
      },
      {
        label: "Duels won %",
        value1: percent(player1?.advancedStats?.duelsWonPercentage),
        value2: percent(player2?.advancedStats?.duelsWonPercentage),
      },
      {
        label: "Passes",
        value1: player1?.advancedStats?.passes,
        value2: player2?.advancedStats?.passes,
      },
      {
        label: "Pass accuracy",
        value1: percent(player1?.advancedStats?.passAccuracy),
        value2: percent(player2?.advancedStats?.passAccuracy),
      },
    ];
  }

  if (category === "MIDFIELDERS") {
    return [
      {
        label: "Pen. vārti",
        value1: player1?.penalties,
        value2: player2?.penalties,
      },
      {
        label: "Key passes",
        value1: player1?.advancedStats?.keyPasses,
        value2: player2?.advancedStats?.keyPasses,
      },
      {
        label: "Passes",
        value1: player1?.advancedStats?.passes,
        value2: player2?.advancedStats?.passes,
      },
      {
        label: "Pass accuracy",
        value1: percent(player1?.advancedStats?.passAccuracy),
        value2: percent(player2?.advancedStats?.passAccuracy),
      },
      {
        label: "Successful dribbles",
        value1: player1?.advancedStats?.successfulDribbles,
        value2: player2?.advancedStats?.successfulDribbles,
      },
      {
        label: "Duels won %",
        value1: percent(player1?.advancedStats?.duelsWonPercentage),
        value2: percent(player2?.advancedStats?.duelsWonPercentage),
      },
    ];
  }

  if (category === "STRIKERS") {
    return [
      {
        label: "Pen. vārti",
        value1: player1?.penalties,
        value2: player2?.penalties,
      },
      {
        label: "Shots",
        value1: player1?.advancedStats?.shots,
        value2: player2?.advancedStats?.shots,
      },
      {
        label: "Shots on target",
        value1: player1?.advancedStats?.shotsOnTarget,
        value2: player2?.advancedStats?.shotsOnTarget,
      },
      {
        label: "Key passes",
        value1: player1?.advancedStats?.keyPasses,
        value2: player2?.advancedStats?.keyPasses,
      },
      {
        label: "Successful dribbles",
        value1: player1?.advancedStats?.successfulDribbles,
        value2: player2?.advancedStats?.successfulDribbles,
      },
      {
        label: "Duels won %",
        value1: percent(player1?.advancedStats?.duelsWonPercentage),
        value2: percent(player2?.advancedStats?.duelsWonPercentage),
      },
    ];
  }

  return [];
};

export default function ComparisonSummary({
  player1,
  player2,
}) {
  if (!player1 || !player2) {
    return null;
  }

  const commonRows = getCommonRows(player1, player2);

  const positionRows = getPositionRows(
    player1,
    player2
  );

  const rows = [
    ...commonRows,
    ...positionRows,
  ];

  const availableRows = rows.filter(row => {
    const firstAvailable =
      row.value1 !== null &&
      row.value1 !== undefined &&
      row.value1 !== "";

    const secondAvailable =
      row.value2 !== null &&
      row.value2 !== undefined &&
      row.value2 !== "";

    return firstAvailable || secondAvailable;
  });

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
              higherIsBetter={
                row.higherIsBetter ?? true
              }
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

      {player1.category !== player2.category && (
        <div className="mt-5 rounded-xl bg-amber-50 p-3">
          <p className="text-[10px] leading-5 text-amber-700">
            Pozīcijai specifiskā statistika tiek rādīta tikai,
            ja abi spēlētāji spēlē vienā pozīciju grupā.
          </p>
        </div>
      )}

      <div className="mt-5 rounded-xl bg-slate-50 p-3">
        <p className="text-[10px] leading-5 text-slate-400">
          Statistika tiek ņemta no API-Football.
          Flow punkti ir Flow lietotnes aprēķins,
          nevis oficiāli fantasy punkti.
        </p>
      </div>
    </section>
  );
}