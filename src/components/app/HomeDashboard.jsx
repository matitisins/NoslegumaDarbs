import React, { useEffect, useMemo, useState } from "react";
import { fetchLeagueFixturesWithStatus, fetchLeagueStandingsWithStatus, fetchLeaguePlayerLeadersWithStatus } from "../../services/leagueFeatures";
import { LEAGUES } from "./AppConstants";
import LeagueLogo from "../LeagueLogo";

const FLOW = { green: "#39E58C", purple: "#A78BFA", panel: "#061B14", panel2: "#0B261C", border: "#164936" };
const safeNumber = value => Number.isFinite(Number(value)) ? Number(value) : 0;
const teamName = team => team?.name || team?.shortName || team?.tla || "Nezināma komanda";
const teamCrest = team => team?.crest || team?.logo || team?.teamLogo || "";
const dateLabel = value => {
  if (!value) return "Datums nav pieejams";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Datums nav pieejams";
  return new Intl.DateTimeFormat("lv-LV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(date).replace(",", " ·");
};
const shortDate = value => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("lv-LV", { day: "2-digit", month: "short" }).format(date);
};
const formTokens = form => String(form || "").split(/[ ,]+/).filter(token => ["W", "D", "L"].includes(token.toUpperCase())).slice(-5);

function Panel({ title, eyebrow, action, onAction, accent = FLOW.green, children, className = "" }) {
  return (
    <section className={`flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-[#061B14]/95 shadow-[0_14px_35px_rgba(0,0,0,.14)] ${className}`} style={{ borderColor: FLOW.border }}>
      <div className="flex items-center justify-between gap-3 border-b border-white/[0.07] px-4 py-3">
        <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: accent }}>{eyebrow || "FLOW ANALYTICS"}</p><h2 className="mt-1 truncate text-xs font-black uppercase tracking-wide text-white sm:text-sm">{title}</h2></div>
        {action && <button type="button" onClick={onAction} className="shrink-0 text-[10px] font-bold text-slate-300 transition hover:text-emerald-300">{action} <span aria-hidden="true">→</span></button>}
      </div>
      <div className="flex min-h-0 flex-1 flex-col p-3 sm:p-4">{children}</div>
    </section>
  );
}

function Crest({ team, size = "h-7 w-7" }) {
  const crest = teamCrest(team);
  return crest ? <img src={crest} alt="" loading="lazy" className={`${size} shrink-0 rounded-full bg-white/10 object-contain p-0.5`} onError={event => { event.currentTarget.style.visibility = "hidden"; }} /> : <span className={`${size} flex shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-slate-300`}>{teamName(team).slice(0, 3).toUpperCase()}</span>;
}

function Form({ value }) {
  const tokens = formTokens(value);
  if (!tokens.length) return <span className="text-xs text-slate-500">—</span>;
  return <div className="flex gap-1">{tokens.map((token, index) => <span key={`${token}-${index}`} className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-black text-white ${token.toUpperCase() === "W" ? "bg-emerald-500" : token.toUpperCase() === "D" ? "bg-slate-500" : "bg-rose-500"}`}>{token.toUpperCase()}</span>)}</div>;
}

function FixtureRow({ match, isRecent = false, fill = false }) {
  const home = match?.homeTeam || match?.teams?.home || {};
  const away = match?.awayTeam || match?.teams?.away || {};
  const score = match?.score?.fullTime || match?.score || {};
  const homeGoals = score?.home ?? score?.homeTeam ?? match?.goals?.home;
  const awayGoals = score?.away ?? score?.awayTeam ?? match?.goals?.away;
  return <div className={`grid grid-cols-[54px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-white/[0.06] py-2 last:border-0 ${fill ? "min-h-[48px] flex-1" : ""}`}>
    <span className="text-[9px] font-semibold text-slate-500">{shortDate(match?.utcDate || match?.date)}</span>
    <div className="flex min-w-0 items-center gap-1.5"><Crest team={home} size="h-5 w-5"/><span className="truncate text-[10px] font-semibold text-slate-200">{teamName(home)}</span></div>
    <span className={`min-w-[42px] rounded-md px-1.5 py-1 text-center text-[10px] font-black ${isRecent ? "bg-white/10 text-white" : "bg-emerald-400/10 text-emerald-200"}`}>{isRecent && homeGoals != null && awayGoals != null ? `${homeGoals}–${awayGoals}` : (match?.status === "IN_PLAY" ? "LIVE" : (match?.utcDate ? new Intl.DateTimeFormat("lv-LV", { hour: "2-digit", minute: "2-digit" }).format(new Date(match.utcDate)) : "—"))}</span>
    <div className="flex min-w-0 items-center justify-end gap-1.5"><span className="truncate text-right text-[10px] font-semibold text-slate-200">{teamName(away)}</span><Crest team={away} size="h-5 w-5"/></div>
  </div>;
}

function PlayerLeaderRow({ player, index, metric }) {
  const value = safeNumber(player?.[metric] ?? player?.flowPoints ?? player?.points);
  return <div className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-2 border-b border-white/[0.06] py-2 last:border-0">
    <span className="text-[10px] font-black text-slate-500">{index + 1}</span>
    <div className="flex min-w-0 items-center gap-2">{player?.photo ? <img src={player.photo} alt="" className="h-7 w-7 shrink-0 rounded-full bg-white/10 object-cover" loading="lazy"/> : <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-[9px] font-black text-slate-300">{String(player?.name || "P").split(" ").map(part => part[0]).slice(0,2).join("").toUpperCase()}</span>}<div className="min-w-0"><p className="truncate text-[10px] font-bold text-white">{player?.name || "Spēlētājs"}</p><p className="truncate text-[9px] text-slate-500">{typeof player?.team === "string" ? player.team : player?.team?.name || ""}</p></div></div>
    <span className="text-xs font-black text-emerald-300">{value}</span>
  </div>;
}

export default function HomeDashboard({ username, selectedLeague, setSelectedLeague, selectedSeason, setSelectedSeason, favorites = [], leaguePlayers = [], setActiveView, setIsGuideOpen }) {
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [scorerLeaders, setScorerLeaders] = useState([]);
  const [assistLeaders, setAssistLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leadersLoading, setLeadersLoading] = useState(true);
  const [warning, setWarning] = useState("");
  const leagueName = LEAGUES.find(([code]) => code === selectedLeague)?.[1] || selectedLeague;
  const apiSeason = Number(String(selectedSeason).split("/")[0]) || Number(selectedSeason) || 2026;
  const currentSeasonStartYear = new Date().getMonth() >= 6 ? new Date().getFullYear() : new Date().getFullYear() - 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setWarning("");
    setLeadersLoading(true);
    setScorerLeaders([]);
    setAssistLeaders([]);
    Promise.all([
      fetchLeagueStandingsWithStatus(selectedLeague, apiSeason),
      fetchLeagueFixturesWithStatus(selectedLeague, apiSeason),
      fetchLeaguePlayerLeadersWithStatus(selectedLeague, apiSeason, "scorers"),
      fetchLeaguePlayerLeadersWithStatus(selectedLeague, apiSeason, "assists"),
    ]).then(async ([standingsResult, initialFixturesResult, scorersResult, assistsResult]) => {
      if (cancelled) return;
      let fixturesResult = initialFixturesResult;
      const hasUpcoming = Array.isArray(fixturesResult?.data?.upcoming) && fixturesResult.data.upcoming.length > 0;
      // The selected season may be historical. Keep its standings, but use the current season for the Match Centre if it has no future fixtures.
      if (!hasUpcoming && apiSeason !== currentSeasonStartYear) {
        try {
          const currentFixtures = await fetchLeagueFixturesWithStatus(selectedLeague, currentSeasonStartYear);
          if (Array.isArray(currentFixtures?.data?.upcoming) && currentFixtures.data.upcoming.length) fixturesResult = currentFixtures;
        } catch { /* Keep the selected-season result if the current-season fallback is unavailable. */ }
      }
      if (cancelled) return;
      setStandings(Array.isArray(standingsResult?.data) ? standingsResult.data : []);
      setFixtures(fixturesResult?.data || { upcoming: [], recent: [] });
      setScorerLeaders(Array.isArray(scorersResult?.data) ? scorersResult.data : []);
      setAssistLeaders(Array.isArray(assistsResult?.data) ? assistsResult.data : []);
      setWarning([standingsResult?.warning, fixturesResult?.warning, scorersResult?.warning, assistsResult?.warning].filter(Boolean).join(" "));
    }).catch(error => {
      if (cancelled) return;
      setStandings([]);
      setFixtures({ upcoming: [], recent: [] });
      setScorerLeaders([]);
      setAssistLeaders([]);
      setWarning(error?.message || "Līgas datus šobrīd neizdevās ielādēt.");
    }).finally(() => { if (!cancelled) { setLoading(false); setLeadersLoading(false); } });
    return () => { cancelled = true; };
  }, [selectedLeague, apiSeason]);

  const rows = useMemo(() => [...standings].sort((a, b) => safeNumber(a.position) - safeNumber(b.position)).slice(0, 5), [standings]);
  const upcoming = useMemo(() => [...(fixtures?.upcoming || [])].slice(0, 5), [fixtures]);
  const recent = useMemo(() => [...(fixtures?.recent || [])].slice(0, 5), [fixtures]);
  const topScorers = scorerLeaders.slice(0, 5);
  const topAssists = assistLeaders.slice(0, 5);
  const totalGoals = standings.reduce((sum, row) => sum + safeNumber(row.goalsFor ?? row.goals), 0);
  const totalPlayed = standings.reduce((sum, row) => sum + safeNumber(row.playedGames ?? row.played), 0);

  const statCards = [
    { label: "Datubāze", value: leaguePlayers.length ? leaguePlayers.length.toLocaleString("lv-LV") : "—", detail: leaguePlayers.length ? "ielādēti spēlētāji" : "spēlētāji tiek ielādēti sadaļā Players", icon: "♟", tint: "#39E58C" },
    { label: "Favorīti", value: favorites.length, detail: "saglabāti spēlētāji", icon: "★", tint: "#60A5FA" },
    { label: "Līgas", value: LEAGUES.length, detail: "pieejamas analīzei", icon: "↗", tint: "#A78BFA" },
    { label: "Profili", value: favorites.length, detail: "spēlētāju izlase", icon: "◷", tint: "#FBBF24" },
  ];

  return <div className="space-y-4 text-white">
    <section className="relative overflow-hidden rounded-2xl border border-emerald-900/80 bg-gradient-to-r from-[#041810] via-[#062219] to-[#03150F] p-5 shadow-[0_16px_45px_rgba(0,0,0,.16)] sm:p-7">
      <div className="pointer-events-none absolute -right-12 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"/>
      <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div><p className="text-[10px] font-black uppercase tracking-[.2em] text-emerald-300">Flow Football Analytics · Home</p><h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Sveiks, {username || "futbola fan"}!</h1><p className="mt-2 max-w-2xl text-sm text-slate-300">Tava ātrā piekļuve līgu tabulām, spēlēm un labākajiem spēlētājiem.</p><p className="mt-3 text-[10px] font-semibold text-slate-500">{new Intl.DateTimeFormat("lv-LV", { weekday: "long", day: "numeric", month: "short", year: "numeric" }).format(new Date())}</p></div>
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-emerald-800/70 bg-black/20 p-2">
          <label className="flex flex-col gap-1 px-2"><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Līga</span><span className="flex items-center gap-2"><LeagueLogo competition={selectedLeague} size={26} className="rounded-md"/><select value={selectedLeague} onChange={event => setSelectedLeague(event.target.value)} className="max-w-[180px] bg-transparent text-xs font-bold text-white outline-none">{LEAGUES.map(([code, name]) => <option key={code} value={code} className="bg-[#061B14]">{name}</option>)}</select></span></label>
          <span className="h-8 w-px bg-white/10"/>
          <label className="flex flex-col gap-1 px-2"><span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Sezona</span><select value={selectedSeason} onChange={event => setSelectedSeason(event.target.value)} className="bg-transparent text-xs font-bold text-white outline-none"><option className="bg-[#061B14]">2026/2027</option><option className="bg-[#061B14]">2025/2026</option></select></label>
        </div>
      </div>
    </section>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{statCards.map(card => <div key={card.label} className="rounded-2xl border border-emerald-950 bg-[#061B14] p-4 shadow-lg shadow-black/10"><div className="flex items-center justify-between"><span className="flex h-9 w-9 items-center justify-center rounded-xl text-lg" style={{ backgroundColor: `${card.tint}18`, color: card.tint }}>{card.icon}</span><span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{card.label}</span></div><p className="mt-3 text-2xl font-black text-white">{card.value}</p><p className="mt-1 text-[10px] leading-4 text-slate-400">{card.detail}</p></div>)}</div>

    {warning && <div role="status" className="rounded-xl border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-xs text-amber-100">{warning}</div>}

    <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
      <Panel title={<span className="inline-flex items-center gap-2"><LeagueLogo competition={selectedLeague} size={28} className="rounded-md"/><span>{leagueName} · tabulas TOP 5</span></span>} eyebrow="LEAGUE SNAPSHOT" action="Pilna tabula" onAction={() => setActiveView("league-tables")}>
        {loading ? <div className="space-y-3 py-5">{[1,2,3,4,5].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]"/> )}</div> : rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[540px] text-left"><thead><tr className="text-[9px] uppercase tracking-wide text-slate-500">{["#", "Komanda", "SP", "U", "N", "Z", "VA", "PTS", "Forma"].map(label => <th key={label} className="px-2 py-2 font-bold">{label}</th>)}</tr></thead><tbody>{rows.map((row, index) => { const team = row.team || row; return <tr key={`${team.id || team.name || index}`} className="border-t border-white/[0.06] hover:bg-white/[0.03]"><td className="px-2 py-2.5 text-xs font-black text-emerald-300">{row.position || index + 1}</td><td className="px-2 py-2.5"><div className="flex items-center gap-2"><Crest team={team}/><span className="max-w-[160px] truncate text-[11px] font-bold text-white">{teamName(team)}</span></div></td><td className="px-2 py-2.5 text-[11px] text-slate-300">{row.playedGames ?? row.played ?? "—"}</td><td className="px-2 py-2.5 text-[11px] text-slate-300">{row.won ?? row.wins ?? "—"}</td><td className="px-2 py-2.5 text-[11px] text-slate-300">{row.draw ?? row.draws ?? "—"}</td><td className="px-2 py-2.5 text-[11px] text-slate-300">{row.lost ?? row.losses ?? "—"}</td><td className="px-2 py-2.5 text-[11px] text-slate-300">{row.goalDifference == null ? (row.goalsFor != null ? `${safeNumber(row.goalsFor)-safeNumber(row.goalsAgainst)>0?"+":""}${safeNumber(row.goalsFor)-safeNumber(row.goalsAgainst)}` : "—") : `${safeNumber(row.goalDifference)>0?"+":""}${row.goalDifference}`}</td><td className="px-2 py-2.5 text-xs font-black text-white">{row.points ?? "—"}</td><td className="px-2 py-2.5"><Form value={row.form}/></td></tr>;})}</tbody></table></div> : <p className="py-8 text-center text-xs text-slate-500">Šai līgai un sezonai tabulas dati nav pieejami.</p>}
      </Panel>
      <Panel title="Nākamās spēles" eyebrow="MATCH CENTRE" action="Visas spēles" onAction={() => setActiveView("league-tables")} accent={FLOW.purple}>
        {loading ? <div className="space-y-3 py-5">{[1,2,3,4].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-white/[0.04]"/> )}</div> : upcoming.length ? <div className="flex h-full flex-1 flex-col justify-evenly">{upcoming.map((match, index) => <FixtureRow key={match.id || `${match.utcDate}-${index}`} match={match} fill/>)}</div> : <p className="py-6 text-center text-xs text-slate-500">Nākamās spēles nav pieejamas.</p>}
      </Panel>
    </div>

    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      <Panel title="Pēdējie rezultāti" eyebrow="RECENT RESULTS" action="Skatīt visus" onAction={() => setActiveView("league-tables")} accent={FLOW.green}>
        {loading ? <p className="py-6 text-center text-xs text-slate-500">Ielādē...</p> : recent.length ? recent.map((match, index) => <FixtureRow key={match.id || `${match.utcDate}-${index}`} match={match} isRecent/>) : <p className="py-6 text-center text-xs text-slate-500">Pabeigtu spēļu nav.</p>}
      </Panel>
      <Panel title="Labākie vārtu guvēji" eyebrow="PLAYER LEADERS" action="Spēlētāju salīdzinājums" onAction={() => setActiveView("players")} accent={FLOW.purple}>
        {leadersLoading ? <div className="space-y-3 py-5">{[1,2,3,4,5].map(i => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />)}</div> : topScorers.length ? topScorers.map((player, index) => <PlayerLeaderRow key={player.id || player.playerId || player.name || index} player={player} index={index} metric="goals"/>) : <p className="py-6 text-center text-xs text-slate-500">Šai līgai un sezonai vārtu guvēju dati nav pieejami.</p>}
      </Panel>
      <Panel title="Labākie asistenti" eyebrow="CREATION LEADERS" action="Salīdzināt spēlētājus" onAction={() => setActiveView("players")} accent={FLOW.green}>
        {leadersLoading ? <div className="space-y-3 py-5">{[1,2,3,4,5].map(i => <div key={i} className="h-9 animate-pulse rounded-lg bg-white/[0.04]" />)}</div> : topAssists.length ? topAssists.map((player, index) => <PlayerLeaderRow key={player.id || player.playerId || player.name || index} player={player} index={index} metric="assists"/>) : <p className="py-6 text-center text-xs text-slate-500">Šai līgai un sezonai asistentu dati nav pieejami.</p>}
      </Panel>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {[
        { title: "Player Comparison", text: "Salīdzini spēlētāju statistiku, formu un Flow punktus.", icon: "⚔", color: FLOW.purple, view: "players" },
        { title: "Fantasy & Analytics", text: "Atver ieteikumus, ranking un Fantasy Team Builder.", icon: "◉", color: FLOW.green, view: "analytics-tools" },
        { title: "League Tables", text: "Apskati līgu tabulas, formu un rezultātus.", icon: "▤", color: "#FBBF24", view: "league-tables" },
        { title: "Team Analysis", text: "Izpēti komandas un savstarpējo spēļu statistiku.", icon: "▥", color: FLOW.purple, view: "teams" },
      ].map(item => <button key={item.title} type="button" onClick={() => setActiveView(item.view)} className="group flex min-h-[112px] items-start gap-3 rounded-2xl border border-emerald-950 bg-[#061B14] p-4 text-left transition hover:-translate-y-0.5 hover:border-emerald-700 hover:bg-[#0A281D]"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xl" style={{ backgroundColor: `${item.color}1A`, color: item.color }}>{item.icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-black text-white">{item.title}</span><span className="mt-2 block text-[10px] leading-4 text-slate-400">{item.text}</span></span><span className="text-sm text-slate-600 transition group-hover:translate-x-1 group-hover:text-emerald-300">→</span></button>)}
    </div>
    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950 pt-4 text-[9px] text-slate-600"><span>{leagueName} · {selectedSeason} · dati no pieejamajiem API rezultātiem</span><button type="button" onClick={() => setIsGuideOpen?.(true)} className="font-bold text-slate-400 hover:text-emerald-300">Atvērt Flow ceļvedi →</button></div>
    <span className="sr-only">Kopā vārti: {totalGoals}; nospēlētas spēles tabulā: {totalPlayed}</span>
  </div>;
}
