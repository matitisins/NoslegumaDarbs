import React from "react";

import {
  getCompetitionZones,
  getTableZone,
  valueOrDash,
  getGoalDifference,
  getTeamName,
  getTeamLogo,
  getPlayed,
  getWins,
  getDraws,
  getLosses,
  getGoalsFor,
  getGoalsAgainst,
  getTeamId,
  getTeamForm,
  getFormLabel,
} from "../LeagueTableUtils";

function ZoneLegend({ competition }) {
  const zones =
    getCompetitionZones(
      competition
    );

  const items = [
    {
      label:
        `Champions League · 1–${zones.champions}`,
      color: "bg-blue-500",
    },
    {
      label:
        `Europa League · ${zones.champions + 1}–${zones.europa}`,
      color: "bg-emerald-500",
    },
    {
      label:
        `Conference League · ${zones.europa + 1}–${zones.conference}`,
      color: "bg-violet-500",
    },
    {
      label:
        `Izkrīšana · ${zones.relegationStart}–`,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {items.map(item => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            <span
              className={`h-2.5 w-1.5 rounded-full ${item.color}`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRow({
  row,
  competition,
}) {
  const position =
    row?.position ??
    row?.rank;

  const teamName =
    getTeamName(row);

  const logo =
    getTeamLogo(row);

  const difference =
    getGoalDifference(row);

  const zone =
    getTableZone(
      position,
      competition
    );

  return (
    <div className="grid min-w-[760px] grid-cols-[58px_minmax(240px,1fr)_75px_65px_65px_65px_75px_75px_75px_75px] items-center border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50">
      <div
        className="relative flex items-center justify-center text-center text-sm font-black text-slate-400"
        title={zone.label || undefined}
      >
        <span
          className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full ${zone.color}`}
        />
        {valueOrDash(position)}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500">
            {teamName
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {teamName}
          </p>

          {row?.team?.tla && (
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {row.team.tla}
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getPlayed(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getWins(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getDraws(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getLosses(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getGoalsFor(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getGoalsAgainst(row)
        )}
      </div>

      <div
        className={`text-center text-sm font-black ${
          Number(difference) > 0
            ? "text-emerald-600"
            : Number(difference) < 0
            ? "text-rose-500"
            : "text-slate-700"
        }`}
      >
        {valueOrDash(
          difference
        )}
      </div>

      <div className="text-center text-sm font-black text-slate-950">
        {valueOrDash(
          row?.points
        )}
      </div>
    </div>
  );
}

function TeamLogo({
  row,
  size = "h-8 w-8",
}) {
  const logo =
    getTeamLogo(row);

  const name =
    getTeamName(row);

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className={`${size} shrink-0 object-contain`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500`}
    >
      {name
        .slice(0, 2)
        .toUpperCase()}
    </div>
  );
}

function FormDots({
  form,
}) {
  if (!form.length) {
    return (
      <span className="text-[9px] font-bold text-slate-400">
        —
      </span>
    );
  }

  const tones = {
    W: "bg-emerald-500",
    D: "bg-amber-400",
    L: "bg-rose-500",
  };

  return (
    <div className="flex items-center gap-1">
      {form.map(
        (item, index) => (
          <span
            key={`${item.result}-${index}`}
            title={
              item.result === "W"
                ? "Uzvara"
                : item.result === "D"
                ? "Neizšķirts"
                : "Zaudējums"
            }
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-black text-white ${
              tones[item.result]
            }`}
          >
            {item.result}
          </span>
        )
      )}
    </div>
  );
}

function MovementBadge({
  movement,
}) {
  if (
    movement === null ||
    movement === undefined
  ) {
    return (
      <span className="text-[9px] font-bold text-slate-400">
        —
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className="text-[9px] font-black text-emerald-600">
        ↑ {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="text-[9px] font-black text-rose-500">
        ↓ {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="text-[9px] font-black text-slate-400">
      —
    </span>
  );
}

function RaceCard({
  title,
  subtitle,
  rows,
  color,
  emptyText,
  onTeamClick,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">
            {title}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {subtitle}
          </p>
        </div>

        <span
          className={`h-2.5 w-2.5 rounded-full ${color}`}
        />
      </div>

      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.map(row => (
            <button
              type="button"
              key={getTeamId(row)}
              onClick={() =>
                onTeamClick(row)
              }
              className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
            >
              <span className="w-5 text-center text-[9px] font-black text-slate-400">
                {row?.position ??
                  row?.rank}
              </span>

              <TeamLogo
                row={row}
                size="h-6 w-6"
              />

              <span className="min-w-0 flex-1 truncate text-[10px] font-black text-slate-800">
                {getTeamName(row)}
              </span>

              <span className="text-xs font-black text-slate-900">
                {row?.points ?? "—"}
              </span>
            </button>
          ))
        ) : (
          <p className="py-3 text-xs text-slate-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function LeagueStatistics({
  standings,
  fixtures,
}) {
  const totalGoals =
    standings.reduce(
      (sum, row) =>
        sum +
        (Number(
          getGoalsFor(row)
        ) || 0),
      0
    );

  const totalGames =
    standings.reduce(
      (sum, row) =>
        sum +
        (Number(
          getPlayed(row)
        ) || 0),
      0
    ) / 2;

  const bestAttack =
    [...standings]
      .sort(
        (a, b) =>
          (Number(
            getGoalsFor(b)
          ) || 0) -
          (Number(
            getGoalsFor(a)
          ) || 0)
      )[0];

  const bestDefence =
    [...standings]
      .sort(
        (a, b) =>
          (Number(
            getGoalsAgainst(a)
          ) || 999) -
          (Number(
            getGoalsAgainst(b)
          ) || 999)
      )[0];

  const formRows =
    standings
      .map(row => ({
        row,
        form: getTeamForm(
          getTeamId(row),
          fixtures
        ),
      }))
      .filter(item =>
        item.form.length
      )
      .sort(
        (a, b) =>
          getFormLabel(
            b.form
          ).points -
          getFormLabel(
            a.form
          ).points
      );

  const bestForm =
    formRows[0]?.row;

  const totalCards = [
    [
      "⚽",
      "Gūtie vārti",
      totalGoals,
    ],
    [
      "📈",
      "Vārti / spēlē",
      totalGames > 0
        ? (
            totalGoals /
            totalGames
          ).toFixed(2)
        : "0.00",
    ],
    [
      "🔥",
      "Labākais uzbrukums",
      bestAttack
        ? getTeamName(
            bestAttack
          )
        : "—",
    ],
    [
      "🛡️",
      "Labākā aizsardzība",
      bestDefence
        ? getTeamName(
            bestDefence
          )
        : "—",
    ],
  ];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-black text-slate-900">
          📊 Līgas statistika
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Apkopoti dati no pašreizējās standings un pieejamajiem rezultātiem.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totalCards.map(
          ([icon, label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-slate-50 p-4"
            >
              <span className="text-lg">
                {icon}
              </span>

              <p className="mt-2 text-[8px] font-black uppercase tracking-wider text-slate-400">
                {label}
              </p>

              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {value}
              </p>
            </div>
          )
        )}
      </div>

      {bestForm && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-emerald-600">
              🔥 Labākā pašreizējā forma
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {getTeamName(
                bestForm
              )}
            </p>
          </div>

          <FormDots
            form={
              formRows[0].form
            }
          />
        </div>
      )}
    </div>
  );
}



export {
  ZoneLegend,
  TableRow,
  TeamLogo,
  FormDots,
  MovementBadge,
  RaceCard,
  LeagueStatistics,
};