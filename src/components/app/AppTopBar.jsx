import React from "react";
import { LEAGUES } from "./AppConstants";
import LeagueLogo from "../LeagueLogo";

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
    <section className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-900/80 bg-[#071c15] px-5 py-4 shadow-[0_12px_30px_rgba(0,0,0,0.18)]">
      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
            Sezona
          </span>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            className="min-w-[132px] cursor-pointer rounded-xl border border-emerald-900 bg-[#04150f] px-3.5 py-2.5 text-sm font-bold text-white outline-none transition hover:border-emerald-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:border-emerald-950 disabled:bg-[#0a2119] disabled:text-slate-300 disabled:opacity-100"
          >
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
          </select>
        </label>

        <div className="hidden h-8 w-px bg-emerald-900 sm:block" />

        <label className="flex items-center gap-3">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-300">
            Turnīrs
          </span>
          <LeagueLogo competition={selectedLeague} size={30} className="rounded-lg" />
          <select
            value={selectedLeague}
            onChange={(e) => {
              setSelectedLeague(e.target.value);
              resetPlayers();
            }}
            className="min-w-[172px] cursor-pointer rounded-xl border border-emerald-900 bg-[#04150f] px-3.5 py-2.5 text-sm font-bold text-white outline-none transition hover:border-emerald-500 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 disabled:cursor-not-allowed disabled:border-emerald-950 disabled:bg-[#0a2119] disabled:text-slate-300 disabled:opacity-100"
          >
            {LEAGUES.map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="button"
        onClick={refreshData}
        disabled={loading}
        className="rounded-xl border border-emerald-800 bg-[#0b2b20] px-4 py-2.5 text-xs font-extrabold text-emerald-100 shadow-sm transition hover:border-emerald-500 hover:bg-[#10402e] disabled:cursor-wait disabled:opacity-70"
      >
        {loading ? "⟳ Ielādē..." : "↻ Atjaunot datus"}
      </button>
    </section>
  );
}
