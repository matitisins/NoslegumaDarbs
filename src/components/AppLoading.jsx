/*
 * Attēlo datu ielādes stāvokli, parādot izvēlēto līgu un sezonu,
 * ielādes animāciju un, ja pieejams, datu ielādes progresu procentos.
 */

import React from "react";

export default function AppLoading({
  loading = true,
  leagueName = "",
  selectedLeague = "",
  selectedSeason = "",
  progress,
}) {
  if (!loading) return null;

  const current =
    Number(progress?.current) || 0;

  const total =
    Number(progress?.total) || 0;

  const percentage =
    total > 0
      ? Math.min(
          100,
          Math.round(
            (current / total) * 100
          )
        )
      : 0;

  return (
    <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
        <div className="h-7 w-7 animate-spin rounded-full border-4 border-emerald-100 border-t-emerald-500" />
      </div>

      <h2 className="font-extrabold text-slate-900">
        Ielādē futbola datus
      </h2>

      <p className="mt-2 text-sm text-slate-500">
        {leagueName ||
          selectedLeague ||
          "Līga"}

        {selectedSeason
          ? ` · ${selectedSeason}`
          : ""}
      </p>

      {total > 0 && (
        <div className="mx-auto mt-6 max-w-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Progress
            </span>

            <span className="text-[10px] font-black text-emerald-600">
              {percentage}%
            </span>
          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500 transition-all duration-300"
              style={{
                width: `${percentage}%`,
              }}
            />
          </div>

          <p className="mt-2 text-[10px] text-slate-400">
            {current} / {total}
          </p>
        </div>
      )}
    </div>
  );
}