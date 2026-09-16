import React from "react";

const DEFAULT_LEAGUES = [
  ["PL", "Premier League"],
  ["PD", "La Liga"],
  ["SA", "Serie A"],
  ["BL1", "Bundesliga"],
  ["FL1", "Ligue 1"],
];

const DEFAULT_SEASONS = [
  "2026/2027",
  "2025/2026",
  "2024/2025",
  "2023/2024",
  "2022/2023",
];

export default function AppControls({
  selectedSeason = "2026/2027",
  setSelectedSeason,
  selectedLeague = "PL",
  setSelectedLeague,
  loading = false,
  refreshData,
  leagues = DEFAULT_LEAGUES,
  seasons = DEFAULT_SEASONS,
}) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        {/* SEASON */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Sezona
          </span>

          <select
            value={selectedSeason}
            onChange={event =>
              setSelectedSeason?.(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          >
            {seasons.map(season => (
              <option
                key={season}
                value={season}
              >
                {season}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden h-6 w-px bg-slate-200 sm:block" />

        {/* LEAGUE */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Turnīrs
          </span>

          <select
            value={selectedLeague}
            onChange={event =>
              setSelectedLeague?.(
                event.target.value
              )
            }
            className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
          >
            {leagues.map(
              league => {
                const code =
                  Array.isArray(league)
                    ? league[0]
                    : league.code;

                const name =
                  Array.isArray(league)
                    ? league[1]
                    : league.name;

                return (
                  <option
                    key={code}
                    value={code}
                  >
                    {name}
                  </option>
                );
              }
            )}
          </select>
        </div>
      </div>

      {/* REFRESH */}
      <button
        type="button"
        onClick={refreshData}
        disabled={loading}
        className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? "Ielādē..."
          : "↻ Atjaunot datus"}
      </button>
    </div>
  );
}