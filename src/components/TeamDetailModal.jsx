import React from "react";
import {
  getTeamId,
  getTeamName,
  getTeamShortName,
  getTeamForm,
  getHomeAwayStats,
  getFormLabel,
  getPlayed,
  getWins,
  getDraws,
  getLosses,
  getGoalsFor,
  getGoalsAgainst,
  getGoalDifference,
  valueOrDash,
} from "../LeagueTableUtils";
import { TeamLogo, FormDots } from "./LeagueTableComponents";

export default function TeamDetailModal({
  row,
  standings = [],
  fixtures = { upcoming: [], recent: [] },
  competition,
  season,
  movement,
  onClose,
  onCompare,
}) {
  if (!row) return null;

  const teamId = getTeamId(row);
  const form = getTeamForm(teamId, fixtures, row);
  const formInfo = getFormLabel(form);
  const homeAway = getHomeAwayStats(teamId, fixtures);
  const upcoming = (Array.isArray(fixtures?.upcoming) ? fixtures.upcoming : [])
    .filter(fixture => {
      const homeId = fixture?.teams?.home?.id ?? fixture?.homeTeam?.id;
      const awayId = fixture?.teams?.away?.id ?? fixture?.awayTeam?.id;
      return String(homeId) === String(teamId) || String(awayId) === String(teamId);
    })
    .slice(0, 5);
  const recent = (Array.isArray(fixtures?.recent) ? fixtures.recent : [])
    .filter(fixture => {
      const homeId = fixture?.teams?.home?.id ?? fixture?.homeTeam?.id;
      const awayId = fixture?.teams?.away?.id ?? fixture?.awayTeam?.id;
      return String(homeId) === String(teamId) || String(awayId) === String(teamId);
    })
    .slice(0, 5);

  const metrics = [
    ["Spēles", getPlayed(row)],
    ["Uzvaras", getWins(row)],
    ["Neizšķirti", getDraws(row)],
    ["Zaudējumi", getLosses(row)],
    ["Gūtie vārti", getGoalsFor(row)],
    ["Ielaistie vārti", getGoalsAgainst(row)],
    ["Vārtu starpība", getGoalDifference(row)],
    ["Punkti", row?.points],
  ];

  const fixtureDate = fixture => {
    const raw = fixture?.fixture?.date ?? fixture?.utcDate ?? fixture?.date;
    if (!raw) return "Datums nav pieejams";
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? "Datums nav pieejams" : date.toLocaleDateString("lv-LV");
  };
  const fixtureTeams = fixture => ({
    home: fixture?.teams?.home?.name ?? fixture?.homeTeam?.name ?? "Mājinieki",
    away: fixture?.teams?.away?.name ?? fixture?.awayTeam?.name ?? "Viesi",
    homeGoals: fixture?.goals?.home ?? fixture?.score?.fullTime?.home,
    awayGoals: fixture?.goals?.away ?? fixture?.score?.fullTime?.away,
  });

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="team-detail-title" className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex min-w-0 items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white"><TeamLogo row={row} size="h-10 w-10" /></div>
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Komandas statistika</p>
              <h2 id="team-detail-title" className="mt-1 truncate text-xl font-black text-slate-950">{getTeamName(row)}</h2>
              <p className="mt-1 text-xs text-slate-400">{getTeamShortName(row)} · {competition || "Līga"} · {season || "Sezona"}/{Number(season) + 1}</p>
            </div>
          </div>
          <button type="button" aria-label="Aizvērt" onClick={onClose} className="ml-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100">✕</button>
        </header>
        <div className="p-5 sm:p-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {metrics.map(([label, value]) => <div key={label} className="rounded-2xl border border-slate-200 p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-2 text-2xl font-black text-slate-950">{valueOrDash(value)}</p></div>)}
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-black text-slate-900">Pēdējā forma</h3><span className={`rounded-full border px-2 py-1 text-[9px] font-bold ${formInfo.tone}`}>{formInfo.label}</span></div>
              <div className="mt-3"><FormDots form={form} /></div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[["Mājas uzvaras", homeAway?.home?.wins], ["Izbraukuma uzvaras", homeAway?.away?.wins], ["Mājas spēles", homeAway?.home?.played], ["Izbraukuma spēles", homeAway?.away?.played]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[9px] font-bold text-slate-400">{label}</p><p className="mt-1 text-lg font-black text-slate-900">{valueOrDash(value)}</p></div>)}
              </div>
              {movement !== undefined && movement !== null && <p className="mt-3 text-xs text-slate-500">Pozīcijas izmaiņa: {Number(movement) > 0 ? `↑ ${movement}` : Number(movement) < 0 ? `↓ ${Math.abs(Number(movement))}` : "—"}</p>}
            </div>
            <div className="rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-black text-slate-900">Nākamās spēles</h3>{upcoming.length ? <div className="mt-3 divide-y divide-slate-100">{upcoming.map((fixture, index) => { const teams = fixtureTeams(fixture); return <div key={fixture?.fixture?.id ?? fixture?.id ?? `${fixtureDate(fixture)}-${index}`} className="py-3"><p className="text-[10px] font-bold text-slate-400">{fixtureDate(fixture)}</p><p className="mt-1 text-xs font-bold text-slate-800">{teams.home} <span className="px-1 text-slate-400">vs</span> {teams.away}</p></div>; })}</div> : <p className="mt-3 text-xs text-slate-400">Nākamo spēļu dati nav pieejami.</p>}</div>
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 p-4"><h3 className="text-sm font-black text-slate-900">Pēdējās spēles</h3>{recent.length ? <div className="mt-3 divide-y divide-slate-100">{recent.map((fixture, index) => { const teams = fixtureTeams(fixture); const scoreAvailable = teams.homeGoals !== undefined && teams.homeGoals !== null && teams.awayGoals !== undefined && teams.awayGoals !== null; return <div key={fixture?.fixture?.id ?? fixture?.id ?? `recent-${fixtureDate(fixture)}-${index}`} className="flex flex-wrap items-center justify-between gap-2 py-3"><div><p className="text-[10px] font-bold text-slate-400">{fixtureDate(fixture)}</p><p className="mt-1 text-xs font-bold text-slate-800">{teams.home} <span className="px-1 text-slate-400">vs</span> {teams.away}</p></div>{scoreAvailable && <span className="text-sm font-black text-slate-900">{teams.homeGoals} – {teams.awayGoals}</span>}</div>; })}</div> : <p className="mt-3 text-xs text-slate-400">Iepriekšējo spēļu dati nav pieejami.</p>}</div>
          <div className="mt-6 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Aizvērt</button>{typeof onCompare === "function" && <button type="button" onClick={onCompare} className="rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">Salīdzināt komandu</button>}</div>
        </div>
      </section>
    </div>
  );
}
