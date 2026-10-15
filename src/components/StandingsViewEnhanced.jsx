import React, { useEffect, useMemo, useState } from "react";
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
import TeamDetailModal from "./TeamDetailModal";
import TeamCompareModal from "./TeamCompareModal";
import LeagueLogo from "./LeagueLogo";

const panel = "rounded-2xl border border-emerald-900/80 bg-gradient-to-br from-[#082319] via-[#061D16] to-[#04150F] text-slate-100 shadow-[0_14px_38px_rgba(0,0,0,0.20)]";
const muted = "text-emerald-100/55";

function TeamCrest({ row, size = "h-8 w-8" }) {
  const logo = getTeamLogo(row);
  const name = getTeamName(row);
  return logo ? <img src={logo} alt="" loading="lazy" className={`${size} shrink-0 object-contain`} /> : <span className={`${size} inline-flex shrink-0 items-center justify-center rounded-full border border-emerald-800 bg-emerald-950 text-[9px] font-black text-emerald-300`}>{name.slice(0, 2).toUpperCase()}</span>;
}

function ZoneLegend({ competition }) {
  const zones = getCompetitionZones(competition);
  const items = [
    { label: `Champions League (1–${zones.champions})`, color: "bg-emerald-500" },
    { label: `Europa League (${zones.champions + 1}–${zones.europa})`, color: "bg-green-300" },
    { label: `Conference League (${zones.europa + 1}–${zones.conference})`, color: "bg-blue-500" },
    { label: `Izkrīšana (${zones.relegationStart}+)`, color: "bg-rose-500" },
  ];
  return <div className="space-y-3">{items.map(item => <div key={item.label} className="flex items-center gap-3 text-xs text-emerald-50/85"><span className={`h-4 w-8 shrink-0 rounded ${item.color}`} /><span>{item.label}</span></div>)}</div>;
}

function FixtureMiniRow({ fixture }) {
  const home = fixture?.teams?.home || fixture?.homeTeam || {};
  const away = fixture?.teams?.away || fixture?.awayTeam || {};
  const dateValue = fixture?.fixture?.date || fixture?.utcDate || fixture?.date;
  const goals = fixture?.goals || { home: fixture?.score?.fullTime?.home ?? fixture?.score?.regularTime?.home, away: fixture?.score?.fullTime?.away ?? fixture?.score?.regularTime?.away };
  const status = String(fixture?.fixture?.status?.short || fixture?.status || "NS").toUpperCase();
  const finished = ["FT", "AET", "PEN", "FINISHED", "AWARDED"].includes(status);
  const live = ["1H", "HT", "2H", "ET", "LIVE", "IN_PLAY", "PAUSED"].includes(status);
  let dateLabel = "Datums nav pieejams";
  if (dateValue && !Number.isNaN(new Date(dateValue).getTime())) dateLabel = new Intl.DateTimeFormat("lv-LV", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(dateValue));
  return <div className="grid grid-cols-[76px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-emerald-900/70 py-3 last:border-b-0">
    <span className={`text-[10px] leading-4 ${live ? "font-bold text-rose-300" : muted}`}>{dateLabel}</span>
    <div className="flex min-w-0 items-center gap-2"><img src={home.logo || home.crest || ""} alt="" className={`h-5 w-5 shrink-0 object-contain ${!(home.logo || home.crest) ? "hidden" : ""}`} /><span className="truncate text-xs font-semibold text-white">{home.name || "Mājinieki"}</span></div>
    <span className={`text-xs font-black ${live ? "text-rose-300" : "text-emerald-300"}`}>{finished || live ? `${goals.home ?? 0}:${goals.away ?? 0}` : "VS"}</span>
    <div className="flex min-w-0 items-center justify-end gap-2"><span className="truncate text-right text-xs font-semibold text-white">{away.name || "Viesi"}</span><img src={away.logo || away.crest || ""} alt="" className={`h-5 w-5 shrink-0 object-contain ${!(away.logo || away.crest) ? "hidden" : ""}`} /></div>
  </div>;
}

function getHomeAway(row, side, key) {
  const block = row?.[side] || row?.[side === "home" ? "homeStats" : "awayStats"] || {};
  const aliases = {
    played: ["played", "playedGames", "matches"],
    wins: ["win", "wins", "won"],
    draws: ["draw", "draws"],
    losses: ["lose", "losses", "lost"],
    goalsFor: ["goalsFor"],
    goalsAgainst: ["goalsAgainst"],
  };
  for (const alias of aliases[key] || [key]) {
    if (block?.[alias] !== undefined && block?.[alias] !== null) return Number(block[alias]);
  }
  if (key === "goalsFor" && block?.goals?.for != null) return Number(block.goals.for);
  if (key === "goalsAgainst" && block?.goals?.against != null) return Number(block.goals.against);
  return null;
}

// Football-data.org standings provide overall totals but not home/away splits.
// Derive those splits from the already-fetched season fixtures instead of making
// extra API requests or showing empty cards.
function getHomeAwayRecord(row, side, fixtures) {
  const directPlayed = getHomeAway(row, side, "played");
  if (directPlayed !== null) {
    const wins = getHomeAway(row, side, "wins") ?? 0;
    const draws = getHomeAway(row, side, "draws") ?? 0;
    const losses = getHomeAway(row, side, "losses") ?? 0;
    const goalsFor = getHomeAway(row, side, "goalsFor") ?? 0;
    const goalsAgainst = getHomeAway(row, side, "goalsAgainst") ?? 0;
    return { played: directPlayed, wins, draws, losses, goalsFor, goalsAgainst, points: wins * 3 + draws };
  }

  const teamId = Number(getTeamId(row));
  if (!Number.isFinite(teamId) || teamId <= 0) return null;
  const finished = Array.isArray(fixtures?.recent) ? fixtures.recent : [];
  const record = { played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  for (const match of finished) {
    const home = match?.homeTeam || match?.teams?.home || {};
    const away = match?.awayTeam || match?.teams?.away || {};
    const homeId = Number(home?.id ?? home?.team?.id);
    const awayId = Number(away?.id ?? away?.team?.id);
    const isHome = homeId === teamId;
    const isAway = awayId === teamId;
    if ((side === "home" && !isHome) || (side === "away" && !isAway)) continue;
    const score = match?.score?.fullTime || match?.score?.regularTime || match?.goals || {};
    const homeGoals = Number(score?.home);
    const awayGoals = Number(score?.away);
    if (!Number.isFinite(homeGoals) || !Number.isFinite(awayGoals)) continue;
    const gf = isHome ? homeGoals : awayGoals;
    const ga = isHome ? awayGoals : homeGoals;
    record.played += 1;
    record.goalsFor += gf;
    record.goalsAgainst += ga;
    if (gf > ga) { record.wins += 1; record.points += 3; }
    else if (gf === ga) { record.draws += 1; record.points += 1; }
    else record.losses += 1;
  }
  return record.played ? record : null;
}

function HomeAwayTable({ standings, fixtures, side }) {
  const isHome = side === "home";
  const rows = standings.map(row => ({ row, record: getHomeAwayRecord(row, side, fixtures) }))
    .filter(item => item.record)
    .sort((a, b) => b.record.points - a.record.points || (b.record.goalsFor - b.record.goalsAgainst) - (a.record.goalsFor - a.record.goalsAgainst) || b.record.goalsFor - a.record.goalsFor)
    .slice(0, 5);
  const accent = isHome ? "text-emerald-300" : "text-violet-300";
  return <div className="mt-3 space-y-2">
    {rows.map(({ row, record }, i) => <div key={getTeamId(row) || i} className="grid grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-emerald-900/45 bg-black/10 px-2 py-2">
      <span className="text-[9px] font-black text-emerald-100/45">{i + 1}</span>
      <div className="flex min-w-0 items-center gap-2"><TeamCrest row={row} size="h-5 w-5"/><div className="min-w-0"><p className="truncate text-[10px] font-bold text-white">{getTeamName(row)}</p><p className="text-[9px] text-emerald-100/45">{record.wins}U · {record.draws}N · {record.losses}Z</p></div></div>
      <div className="text-right"><p className={`text-sm font-black ${accent}`}>{record.points}</p><p className="text-[9px] text-emerald-100/45">{record.played} sp.</p></div>
    </div>)}
    {!rows.length && <p className={`rounded-lg border border-dashed border-emerald-900 px-3 py-4 text-[10px] leading-4 ${muted}`}>Vēl nav pieejamu pabeigtu {isHome ? "mājas" : "viesu"} spēļu ar rezultātiem.</p>}
  </div>;
}

function MiniRank({ rows, valueFor, color = "emerald", format = value => value, ascending = false }) {
  const ranked = [...rows].map(row => ({ row, value: Number(valueFor(row)) })).filter(item => Number.isFinite(item.value)).sort((a, b) => ascending ? a.value - b.value : b.value - a.value).slice(0, 5);
  const max = Math.max(1, ...ranked.map(item => item.value));
  const barColor = color === "violet" ? "bg-violet-400" : "bg-emerald-400";
  return <div className="mt-3 space-y-3">{ranked.map(({row, value}, index) => <div key={getTeamId(row) || index} className="grid grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2"><span className="text-[10px] font-black text-emerald-100/45">{index + 1}</span><div className="min-w-0"><div className="mb-1 flex items-center gap-2"><TeamCrest row={row} size="h-5 w-5"/><span className="truncate text-[11px] font-bold text-white">{getTeamName(row)}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-emerald-950"><div className={`h-full rounded-full ${barColor}`} style={{width: `${Math.max(0, Math.min(100, value / max * 100))}%`}}/></div></div><span className="text-xs font-black text-white">{format(value)}</span></div>)}</div>;
}

export default function StandingsViewEnhanced({ standings, fixtures, loading, error, loadStandings, competition, leagueName, season }) {
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("position");
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [compareTeams, setCompareTeams] = useState([]);
  const [previousPositions, setPreviousPositions] = useState({});

  useEffect(() => {
    if (!standings.length) return;
    const key = `flow-standings-${competition}-${season}`;
    const snapshot = Object.fromEntries(standings.map(row => [String(getTeamId(row)), Number(row?.position ?? row?.rank)]));
    try {
      const previous = localStorage.getItem(key);
      if (previous) setPreviousPositions(JSON.parse(previous));
      localStorage.setItem(key, JSON.stringify(snapshot));
    } catch { /* Standings still work if browser storage is unavailable. */ }
  }, [standings, competition, season]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const rows = standings.filter(row => !query || getTeamName(row).toLowerCase().includes(query) || String(row?.team?.tla || "").toLowerCase().includes(query));
    return [...rows].sort((a, b) => {
      if (sortBy === "points") return (Number(b?.points) || 0) - (Number(a?.points) || 0);
      if (sortBy === "goals") return (Number(getGoalsFor(b)) || 0) - (Number(getGoalsFor(a)) || 0);
      if (sortBy === "difference") return (Number(getGoalDifference(b)) || 0) - (Number(getGoalDifference(a)) || 0);
      if (sortBy === "wins") return (Number(getWins(b)) || 0) - (Number(getWins(a)) || 0);
      if (sortBy === "form") return getFormLabel(getTeamForm(getTeamId(b), fixtures, b)).points - getFormLabel(getTeamForm(getTeamId(a), fixtures, a)).points;
      return (Number(a?.position ?? a?.rank) || 999) - (Number(b?.position ?? b?.rank) || 999);
    });
  }, [standings, fixtures, search, sortBy]);

  const zones = getCompetitionZones(competition);
  const upcoming = Array.isArray(fixtures?.upcoming) ? fixtures.upcoming.slice(0, 5) : [];
  const recent = Array.isArray(fixtures?.recent) ? fixtures.recent : [];
  const allFixtures = [...upcoming, ...recent];
  const totals = useMemo(() => standings.reduce((acc, row) => {
    acc.played += Number(getPlayed(row)) || 0;
    acc.goals += Number(getGoalsFor(row)) || 0;
    return acc;
  }, { played: 0, goals: 0 }), [standings]);
  const matchCount = Math.round(totals.played / 2);
  const openCompare = row => setCompareTeams(current => {
    const id = String(getTeamId(row));
    if (current.some(item => String(getTeamId(item)) === id)) return current.filter(item => String(getTeamId(item)) !== id);
    return current.length >= 2 ? [current[1], row] : [...current, row];
  });
  const clearCompare = () => setCompareTeams([]);

  if (error) return <div className={`${panel} p-6`}><p className="font-black text-rose-300">API kļūda</p><p className="mt-2 text-sm text-rose-100/80">{error}</p><button type="button" onClick={loadStandings} className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-[#04160F]">Mēģināt vēlreiz</button></div>;
  if (loading) return <div className={`${panel} p-12 text-center`}><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-emerald-950 border-t-emerald-400"/><p className="mt-4 text-sm font-bold text-white">Ielādē līgas tabulu…</p><p className={`mt-1 text-xs ${muted}`}>{leagueName} · {season}/{Number(season) + 1}</p></div>;
  if (!standings.length) return <div className={`${panel} p-12 text-center`}><div className="text-3xl">📊</div><h2 className="mt-3 text-lg font-black text-white">Tabula nav pieejama</h2><p className={`mt-2 text-sm ${muted}`}>Izvēlētajai līgai un sezonai API-Football neatgrieza standings datus.</p><button type="button" onClick={loadStandings} className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-black text-[#04160F]">Mēģināt vēlreiz</button></div>;

  return <>
    <div className="grid items-start gap-4 2xl:grid-cols-[minmax(0,2.05fr)_minmax(300px,1fr)]">
      <section className={`${panel} min-w-0 overflow-hidden`}>
        <div className="flex flex-col gap-3 border-b border-emerald-900 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div><p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">Tabula · {season}/{Number(season) + 1}</p><h2 className="mt-1 text-lg font-black text-white">Kopvērtējums</h2><p className={`mt-1 text-[11px] ${muted}`}>Noklikšķini uz komandas, lai apskatītu tās analīzi. <span className="text-emerald-300">{filtered.length} / {standings.length} komandām</span></p></div>
          <div className="flex flex-wrap gap-2"><input type="search" value={search} onChange={e => setSearch(e.target.value)} placeholder="Meklēt komandu…" className="min-w-0 rounded-lg border border-emerald-900 bg-[#03140F] px-3 py-2 text-xs text-white outline-none placeholder:text-emerald-100/35 focus:border-emerald-400 sm:w-44"/><select value={sortBy} onChange={e => setSortBy(["position", "points", "goals", "difference", "wins", "form"].includes(e.target.value) ? e.target.value : "position")} className="rounded-lg border border-emerald-900 bg-[#03140F] px-3 py-2 text-xs font-bold text-emerald-50 outline-none"><option value="position">Pozīcija</option><option value="points">Punkti</option><option value="goals">Gūtie vārti</option><option value="difference">Vārtu starpība</option><option value="wins">Uzvaras</option><option value="form">Forma</option></select></div>
        </div>
        <div className="overflow-x-auto"><div className="min-w-[800px]">
          <div className="grid grid-cols-[34px_minmax(190px,1fr)_40px_38px_38px_38px_42px_42px_46px_44px_48px_106px] items-center gap-1 border-b border-emerald-900 bg-[#03150F] px-3 py-3 text-center text-[9px] font-black uppercase tracking-wider text-emerald-200/65"><span>#</span><span className="text-left">Komanda</span>{["Sp", "U", "N", "Z", "GF", "GA", "GD", "P"].map(x => <span key={x}>{x}</span>)}<span>Win %</span><span>Forma</span></div>
          {filtered.map((row, index) => {
            const position = row?.position ?? row?.rank ?? index + 1;
            const zone = getTableZone(position, competition);
            const form = getTeamForm(getTeamId(row), fixtures, row);
            const formLabel = getFormLabel(form);
            const previous = previousPositions[String(getTeamId(row))];
            const movement = previous === undefined ? null : Number(previous) - Number(position);
            const points = valueOrDash(row?.points);
            return <button type="button" key={getTeamId(row) || `${position}-${index}`} onClick={() => setSelectedTeam(row)} title={`${getTeamName(row)} — atvērt komandas detaļas`} className="grid w-full grid-cols-[34px_minmax(190px,1fr)_40px_38px_38px_38px_42px_42px_46px_44px_48px_106px] items-center gap-1 border-b border-emerald-950/90 px-3 py-2.5 text-center text-xs transition hover:bg-emerald-900/30 focus-visible:outline focus-visible:outline-1 focus-visible:outline-emerald-400 last:border-b-0">
              <span className="relative flex h-full items-center justify-center font-black text-emerald-50"><span className={`absolute left-[-12px] top-[-10px] bottom-[-10px] w-1 ${zone.color}`}/>{position}<span className={`absolute -bottom-2 left-1/2 -translate-x-1/2 text-[8px] ${movement > 0 ? "text-emerald-300" : movement < 0 ? "text-rose-300" : "text-transparent"}`}>{movement > 0 ? "▲" : movement < 0 ? "▼" : "·"}</span></span>
              <span className="flex min-w-0 items-center gap-2 text-left"><TeamCrest row={row} size="h-7 w-7"/><span className="min-w-0"><span className="block truncate text-xs font-extrabold text-white">{getTeamName(row)}</span><span className={`block text-[8px] font-bold uppercase tracking-wider ${muted}`}>{row?.team?.tla || ""}</span></span></span>
              {[getPlayed(row), getWins(row), getDraws(row), getLosses(row), getGoalsFor(row), getGoalsAgainst(row)].map((v, i) => <span key={i} className="font-semibold text-emerald-50/85">{valueOrDash(v)}</span>)}
              <span className={`font-black ${Number(getGoalDifference(row)) > 0 ? "text-emerald-300" : Number(getGoalDifference(row)) < 0 ? "text-rose-300" : "text-emerald-50/80"}`}>{valueOrDash(getGoalDifference(row))}</span><span className="font-black text-white">{points}</span><span className="font-bold text-emerald-300">{Number(getPlayed(row)) > 0 ? `${Math.round((Number(getWins(row) || 0) / Number(getPlayed(row))) * 100)}%` : "—"}</span>
              <span className="flex items-center justify-center gap-1">{(Array.isArray(form) ? form : []).slice(-5).map((item, i) => { const result = typeof item === "string" ? item : item?.result || item?.value || ""; const val = String(result).toUpperCase(); const color = val.startsWith("W") ? "bg-emerald-500 text-[#04160F]" : val.startsWith("D") ? "bg-slate-500 text-white" : val.startsWith("L") ? "bg-rose-500 text-white" : "bg-emerald-950 text-emerald-100/40"; return <span key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[9px] font-black ${color}`}>{val.startsWith("W") ? "W" : val.startsWith("D") ? "D" : val.startsWith("L") ? "L" : "·"}</span>; })}</span>
            </button>;
          })}
        </div></div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-emerald-900 bg-[#03150F] px-4 py-3 text-[9px] font-semibold text-emerald-100/55"><span>Sp — spēles</span><span>U — uzvaras</span><span>N — neizšķirti</span><span>Z — zaudējumi</span><span>GF/GA — gūtie/ielaistie</span><span>GD — starpība</span><span>P — punkti</span><span>Win % — uzvaru īpatsvars</span><span>W/D/L — pēdējās spēles</span></div>
      </section>

      <aside className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-1">
        <section className={`${panel} p-4`}><p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Līgas pārskats</p><div className="mt-2 flex items-center gap-3"><LeagueLogo competition={competition} size={48} className="rounded-xl" alt={`${leagueName} logo`} /><div><h3 className="font-black text-white">{leagueName}</h3><p className={`text-xs ${muted}`}>{season}/{Number(season) + 1}</p></div></div><div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-200/55">Komandas</p><p className="mt-1 text-2xl font-black text-white">{standings.length}</p></div><div className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-200/55">Spēles komandām</p><p className="mt-1 text-2xl font-black text-white">{totals.played}</p></div><div className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-200/55">Gūtie vārti</p><p className="mt-1 text-2xl font-black text-emerald-300">{totals.goals}</p></div><div className="rounded-xl border border-emerald-900 bg-emerald-950/50 p-3"><p className="text-[9px] font-bold uppercase text-emerald-200/55">Vidēji spēlē</p><p className="mt-1 text-2xl font-black text-white">{matchCount ? (totals.goals / matchCount).toFixed(2) : "—"}</p></div></div></section>
        <section className={`${panel} p-4`}><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-white">Nākamās spēles</h3><span className={`text-[10px] ${muted}`}>{upcoming.length} spēles</span></div>{upcoming.length ? upcoming.map((fixture, i) => <FixtureMiniRow key={fixture?.fixture?.id || fixture?.id || `${i}-${fixture?.date || "fixture"}`} fixture={fixture}/>) : <p className={`py-5 text-xs ${muted}`}>Nākamās spēles šai sezonai nav pieejamas.</p>}</section>
        <section className={`${panel} p-4 sm:col-span-2 2xl:col-span-1`}><h3 className="mb-4 text-sm font-black text-white">Vietu zonu leģenda</h3><ZoneLegend competition={competition}/></section>
        <section className={`${panel} p-4 sm:col-span-2 2xl:col-span-1`}><div className="flex items-center justify-between gap-2"><h3 className="text-sm font-black text-white">Tabulas līderi</h3><span className={`text-[10px] ${muted}`}>Punkti</span></div><div className="mt-3 space-y-2">{[...standings].sort((a,b)=>(Number(b?.points)||0)-(Number(a?.points)||0)).slice(0,5).map((row,i)=><button type="button" key={getTeamId(row)||i} onClick={()=>setSelectedTeam(row)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-emerald-900/35"><span className="w-4 text-xs font-black text-emerald-200/60">{i+1}</span><TeamCrest row={row} size="h-6 w-6"/><span className="min-w-0 flex-1 truncate text-xs font-bold text-white">{getTeamName(row)}</span><span className="text-sm font-black text-emerald-300">{valueOrDash(row?.points)}</span></button>)}</div></section>
      </aside>
    </div>
    <section className="mt-4 grid gap-4 xl:grid-cols-5">
      <div className={`${panel} p-4 xl:col-span-1`}><div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">Mājas tabula</h3><span className="text-lg">⌂</span></div><p className={`mt-1 text-[10px] ${muted}`}>Pēc mājas spēļu punktiem · U/N/Z</p><HomeAwayTable standings={standings} fixtures={fixtures} side="home"/></div>
      <div className={`${panel} p-4 xl:col-span-1`}><div className="flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-wider text-violet-300">Viesu tabula</h3><span className="text-lg">✈</span></div><p className={`mt-1 text-[10px] ${muted}`}>Pēc viesu spēļu punktiem · U/N/Z</p><HomeAwayTable standings={standings} fixtures={fixtures} side="away"/></div>
      <div className={`${panel} p-4 xl:col-span-1`}><h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">Vairāk gūto vārtu</h3><p className={`mt-1 text-[10px] ${muted}`}>Top 5 pēc sezonas vārtiem</p><MiniRank rows={standings} valueFor={getGoalsFor} color="emerald"/></div>
      <div className={`${panel} p-4 xl:col-span-1`}><h3 className="text-xs font-black uppercase tracking-wider text-violet-300">Mazāk ielaisto</h3><p className={`mt-1 text-[10px] ${muted}`}>Top 5 pēc aizsardzības</p><MiniRank rows={standings} valueFor={getGoalsAgainst} color="violet" ascending format={v=>v}/></div>
      <div className={`${panel} p-4 xl:col-span-1`}><h3 className="text-xs font-black uppercase tracking-wider text-emerald-300">Forma pēdējās spēlēs</h3><p className={`mt-1 text-[10px] ${muted}`}>Punkti no pēdējām 5</p><div className="mt-3 space-y-3">{[...standings].map(row=>({row, form:getFormLabel(getTeamForm(getTeamId(row),fixtures,row))})).sort((a,b)=>(b.form?.points||0)-(a.form?.points||0)).slice(0,5).map((x,i)=><div key={getTeamId(x.row)||i}><div className="mb-1 flex items-center gap-2"><TeamCrest row={x.row} size="h-5 w-5"/><span className="min-w-0 flex-1 truncate text-[10px] font-bold text-white">{getTeamName(x.row)}</span><span className="text-[10px] font-black text-emerald-300">{x.form?.points ?? 0}/15</span></div><div className="h-1.5 overflow-hidden rounded-full bg-emerald-950"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300" style={{width:`${Math.max(0,Math.min(100,((x.form?.points||0)/15)*100))}%`}}/></div></div>)}</div></div>
    </section>
    {selectedTeam && <TeamDetailModal row={selectedTeam} standings={standings} fixtures={fixtures} competition={competition} season={season} movement={previousPositions[String(getTeamId(selectedTeam))]} onClose={() => setSelectedTeam(null)} onCompare={() => { openCompare(selectedTeam); setSelectedTeam(null); }} />}
    {compareTeams.length === 2 && <TeamCompareModal first={compareTeams[0]} second={compareTeams[1]} standings={standings} fixtures={fixtures} onClose={clearCompare} />}
  </>;
}