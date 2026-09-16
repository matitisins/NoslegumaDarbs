import React from "react";

import PlayerStatBar from "./PlayerStatBar";
import PlayerFormTrend from "./PlayerFormTrend";

function initials(name) {
  return (
    String(name || "")
      .split(" ")
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PL"
  );
}

function value(value) {
  return value === null ||
    value === undefined
    ? "—"
    : value;
}

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

  const rose =
    color === "rose";

  const borderClass =
    rose
      ? "border-rose-200"
      : "border-emerald-200";

  const accentClass =
    rose
      ? "bg-rose-500"
      : "bg-emerald-500";

  const softClass =
    rose
      ? "bg-rose-50 text-rose-500"
      : "bg-emerald-50 text-emerald-600";

  const maxGoals =
    Math.max(
      1,
      ...players.map(
        item =>
          Number(item.goals) || 0
      )
    );

  const maxAssists =
    Math.max(
      1,
      ...players.map(
        item =>
          Number(item.assists) || 0
      )
    );

  const maxPoints =
    Math.max(
      1,
      ...players.map(
        item =>
          Number(item.points) || 0
      )
    );

  const maxAppearances =
    Math.max(
      1,
      ...players.map(
        item =>
          Number(item.appearances) ||
          0
      )
    );

  return (
    <div
      className={`overflow-hidden rounded-2xl border ${borderClass} bg-white shadow-sm`}
    >
      {/* HEADER */}
      <div className="relative overflow-hidden bg-slate-950 p-5 text-white">
        <div
          className={`absolute left-0 top-0 h-full w-1 ${accentClass}`}
        />

        <div className="relative flex items-center gap-4">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-xl font-black ${softClass}`}
          >
            {initials(player.name)}
          </div>

          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              {player.positionLabel ||
                player.position ||
                "Spēlētājs"}
            </p>

            <h3 className="mt-1 truncate text-xl font-black">
              {player.name}
            </h3>

            <p className="mt-1 truncate text-xs text-slate-400">
              {player.team ||
                "Nezināms klubs"}
            </p>
          </div>
        </div>
      </div>

      {/* BASIC STATS */}
      <div className="grid grid-cols-2 gap-px border-b border-slate-200 bg-slate-200 sm:grid-cols-4">
        <div className="bg-white p-4 text-center">
          <p className="text-xl font-black text-slate-900">
            {value(
              player.appearances
            )}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Spēles
          </p>
        </div>

        <div className="bg-white p-4 text-center">
          <p className="text-xl font-black text-slate-900">
            {value(
              player.goals
            )}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Vārti
          </p>
        </div>

        <div className="bg-white p-4 text-center">
          <p className="text-xl font-black text-slate-900">
            {value(
              player.assists
            )}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Assist
          </p>
        </div>

        <div className="bg-white p-4 text-center">
          <p className="text-xl font-black text-emerald-600">
            {value(
              player.points
            )}
          </p>

          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Fantasy
          </p>
        </div>
      </div>

      {/* STAT BARS */}
      <div className="space-y-4 p-5">
        <PlayerStatBar
          label="Vārti"
          value={
            Number(player.goals) ||
            0
          }
          max={maxGoals}
          color={
            rose
              ? "rose"
              : "emerald"
          }
        />

        <PlayerStatBar
          label="Assist"
          value={
            Number(player.assists) ||
            0
          }
          max={maxAssists}
          color={
            rose
              ? "rose"
              : "emerald"
          }
        />

        <PlayerStatBar
          label="Fantasy punkti"
          value={
            Number(player.points) ||
            0
          }
          max={maxPoints}
          color={
            rose
              ? "rose"
              : "emerald"
          }
        />

        <PlayerStatBar
          label="Spēles"
          value={
            Number(
              player.appearances
            ) || 0
          }
          max={maxAppearances}
          color={
            rose
              ? "rose"
              : "emerald"
          }
        />
      </div>

      {/* EXTRA STATS */}
      <div className="border-t border-slate-100 p-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Pen. vārti
            </p>

            <p className="mt-1 text-lg font-black text-slate-800">
              {value(
                player.penalties
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Minūtes
            </p>

            <p className="mt-1 text-lg font-black text-slate-800">
              {value(
                player.minutes
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Clean sheets
            </p>

            <p className="mt-1 text-lg font-black text-slate-800">
              {value(
                player.cleanSheets
              )}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-3">
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Sezona
            </p>

            <p className="mt-1 text-lg font-black text-slate-800">
              {player.season ||
                "—"}
            </p>
          </div>
        </div>
      </div>

      {/* FORM */}
      {Array.isArray(
        player.recentForm
      ) &&
        player.recentForm.length >
          0 && (
          <div className="border-t border-slate-100 p-5">
            <PlayerFormTrend
              player={player}
            />
          </div>
        )}

      {/* FOOTER */}
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