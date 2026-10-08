import React from "react";
import { LEAGUES } from "./AppConstants";

export default function AppTopBar({
  selectedSeason,
  setSelectedSeason,
  selectedLeague,
  setSelectedLeague,
  resetPlayers,
  refreshData,
  loading,
}) {
  return (
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sezona
              </span>

              <select
                value={selectedSeason}
                onChange={e =>
                  setSelectedSeason(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
              >
                <option>2026/2027</option>
                <option>2025/2026</option>
              </select>
            </label>

            <div className="h-6 w-px bg-slate-200" />

            <label className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Turnīrs
              </span>

              <select
                value={selectedLeague}
                onChange={e => {
                  setSelectedLeague(
                    e.target.value
                  );
                  resetPlayers();
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
              >
                {LEAGUES.map(
                  ([code, name]) => (
                    <option
                      key={code}
                      value={code}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
          >
            ↻{" "}
            {loading
              ? "Ielādē..."
              : "Atjaunot datus"}
          </button>
        </div>

  );
}