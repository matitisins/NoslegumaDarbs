import React, { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL } from "../config/api";

const COMPETITIONS = [
  { id: 2, code: "CL", name: "UEFA Champions League", shortName: "Champions League", color: "#78A9FF", logo: "https://media.api-sports.io/football/leagues/2.png", format: "Līgas fāze un izslēgšanas spēles" },
  { id: 3, code: "EL", name: "UEFA Europa League", shortName: "Europa League", color: "#FF9D42", logo: "https://media.api-sports.io/football/leagues/3.png", format: "Līgas fāze un izslēgšanas spēles" },
  { id: 848, code: "ECL", name: "UEFA Conference League", shortName: "Conference League", color: "#C084FC", logo: "https://media.api-sports.io/football/leagues/848.png", format: "Līgas fāze un izslēgšanas spēles" },
  { id: 531, code: "USC", name: "UEFA Super Cup", shortName: "UEFA Super Cup", color: "#39E58C", logo: "https://media.api-sports.io/football/leagues/531.png", format: "Viena finālspēle" },
];

const currentSeason = String(new Date().getFullYear());
const SEASONS = [currentSeason, String(Number(currentSeason) - 1), String(Number(currentSeason) - 2), String(Number(currentSeason) - 3)];
const panelClass = "min-w-0 overflow-hidden rounded-2xl border border-emerald-900/70 bg-[#041b14]/95 shadow-[0_12px_32px_rgba(0,0,0,.16)]";
const labelClass = "text-[10px] font-black uppercase tracking-[.18em] text-emerald-300";

function formatDate(value, includeTime = true) {
  if (!value) return "Datums nav pieejams";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Datums nav pieejams";
  return new Intl.DateTimeFormat("lv-LV", { day: "2-digit", month: "short", ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}) }).format(date);
}

function TeamMark({ team, compact = false }) {
  return <div className="flex min-w-0 items-center gap-2">
    {team?.logo ? <img src={team.logo} alt="" loading="lazy" className={`${compact ? "h-6 w-6" : "h-7 w-7"} shrink-0 object-contain`} onError={e => { e.currentTarget.style.opacity = "0.2"; }} /> : <span className="h-7 w-7 shrink-0 rounded-full border border-white/10 bg-white/5" />}
    <span className="truncate text-xs font-bold text-slate-100">{team?.name || "Komanda"}</span>
  </div>;
}

function EmptyState({ children }) {
  return <div className="flex min-h-28 items-center justify-center px-5 py-8 text-center text-xs leading-5 text-slate-400">{children}</div>;
}

function FixtureList({ title, matches, upcoming, onViewAll }) {
  return <section className={panelClass}>
    <div className="flex items-center justify-between gap-3 border-b border-emerald-950/90 px-4 py-3.5">
      <h2 className="flex min-w-0 items-center gap-2 text-sm font-black text-white"><span className="text-lg" aria-hidden="true">{upcoming ? "⚽" : "◉"}</span>{title}</h2>
      <button type="button" onClick={onViewAll} className="shrink-0 rounded-lg border border-emerald-800/80 px-3 py-1.5 text-[10px] font-extrabold text-emerald-300 transition hover:bg-emerald-400/10">Visi rezultāti →</button>
    </div>
    {matches.length ? <div className="divide-y divide-emerald-950/90 p-2">{matches.slice(0, 5).map((match, index) => {
      const status = match?.fixture?.status?.short || "NS";
      const finished = ["FT", "AET", "PEN"].includes(status);
      const home = match?.teams?.home || {};
      const away = match?.teams?.away || {};
      return <div key={match?.fixture?.id || index} className="grid grid-cols-[64px_minmax(0,1fr)_64px] items-center gap-2 rounded-lg px-2 py-3 transition hover:bg-emerald-400/[.04] sm:grid-cols-[78px_minmax(0,1fr)_78px]">
        <div className="text-[10px] leading-4 text-slate-400"><div>{formatDate(match?.fixture?.date, false)}</div><div>{upcoming ? formatDate(match?.fixture?.date).split(", ").pop() : (finished ? "Beigušās" : status)}</div></div>
        <div className="min-w-0 space-y-2">
          <div className="flex min-w-0 items-center justify-between gap-2"><div className="min-w-0"><TeamMark team={home} compact /></div><span className={`min-w-[34px] rounded-md px-1.5 py-1 text-center text-xs font-black ${finished ? "bg-black/25 text-white" : "text-slate-400"}`}>{finished ? (match?.goals?.home ?? 0) : ""}</span></div>
          <div className="flex min-w-0 items-center justify-between gap-2"><div className="min-w-0"><TeamMark team={away} compact /></div><span className={`min-w-[34px] rounded-md px-1.5 py-1 text-center text-xs font-black ${finished ? "bg-black/25 text-white" : "text-slate-400"}`}>{finished ? (match?.goals?.away ?? 0) : ""}</span></div>
        </div>
        <div className="text-right text-[10px] font-bold text-slate-400">{upcoming ? formatDate(match?.fixture?.date).split(", ").pop() : (finished ? "FT" : status)}</div>
      </div>;
    })}</div> : <EmptyState>{upcoming ? "Pašlaik nav pieejamu nākamo spēļu." : "Šai sezonai vēl nav pieejamu rezultātu."}</EmptyState>}
  </section>;
}

function LeaderboardModal({ title, subtitle, children, onClose }) {
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
    <section className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-emerald-700/80 bg-[#061b14] shadow-2xl" onClick={e => e.stopPropagation()}>
      <header className="flex items-start justify-between gap-3 border-b border-emerald-950 px-5 py-4"><div><h2 className="text-base font-black text-white">{title}</h2><p className="mt-1 text-xs text-slate-400">{subtitle}</p></div><button type="button" onClick={onClose} className="rounded-lg border border-emerald-900 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/5" aria-label="Aizvērt">✕</button></header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">{children}</div>
    </section>
  </div>;
}

function PlayerLeaderboard({ title, subtitle, players, metric, accent, onViewAll }) {
  const valueFor = item => {
    const stats = item?.statistics?.[0] || {};
    return metric === "goals" ? (stats?.goals?.total ?? 0) : (stats?.goals?.assists ?? 0);
  };
  const list = [...players].sort((a, b) => valueFor(b) - valueFor(a));
  const renderRow = (item, index) => {
    const player = item?.player || {};
    const stats = item?.statistics?.[0] || {};
    const team = stats?.team || {};
    return <div key={player?.id || index} className="flex items-center gap-2 border-b border-emerald-950/80 px-3 py-3 last:border-0">
      <span className="w-4 shrink-0 text-xs font-black text-slate-400">{index + 1}</span>
      {player?.photo ? <img src={player.photo} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg bg-white/5 object-cover" onError={e => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="h-10 w-10 shrink-0 rounded-lg bg-white/5" />}
      <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-white">{player?.name || "Spēlētājs"}</p><div className="mt-1 flex min-w-0 items-center gap-1.5">{team?.logo && <img src={team.logo} alt="" className="h-4 w-4 object-contain" />}<span className="truncate text-[10px] text-slate-400">{team?.name || "Komanda nav norādīta"}</span></div></div>
      <strong className="text-lg font-black" style={{ color: accent }}>{valueFor(item)}</strong>
    </div>;
  };
  return <section className={`${panelClass} flex min-w-0 flex-col`}>
    <div className="flex items-start justify-between gap-2 border-b border-emerald-950/90 px-4 py-3.5"><div><h3 className="text-xs font-black text-white">{title}</h3><p className="mt-1 text-[10px] text-slate-500">{subtitle}</p></div><button type="button" onClick={onViewAll} className="shrink-0 rounded-lg border border-emerald-800/80 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-300 transition hover:bg-emerald-400/10">Visi →</button></div>
    {list.length ? <div className="px-1">{list.slice(0, 5).map(renderRow)}</div> : <EmptyState>Spēlētāju statistika šai sezonai nav pieejama.</EmptyState>}
  </section>;
}

function CleanSheetLeaderboard({ teams, onViewAll }) {
  const renderRow = (item, index) => <div key={item?.id || index} className="flex items-center gap-2 border-b border-emerald-950/80 px-3 py-3 last:border-0">
    <span className="w-4 shrink-0 text-xs font-black text-slate-400">{index + 1}</span>
    {item?.logo ? <img src={item.logo} alt="" loading="lazy" className="h-10 w-10 shrink-0 rounded-lg bg-white/5 object-contain p-1" onError={e => { e.currentTarget.style.visibility = "hidden"; }} /> : <span className="h-10 w-10 shrink-0 rounded-lg bg-white/5" />}
    <div className="min-w-0 flex-1"><p className="truncate text-xs font-extrabold text-white">{item?.name || "Komanda"}</p><p className="mt-1 truncate text-[10px] text-slate-400">{item?.played ?? 0} spēles analizētas</p></div>
    <div className="text-right"><strong className="block text-lg font-black text-sky-300">{item?.cleanSheets ?? 0}</strong><span className="text-[9px] text-slate-500">tīrās spēles</span></div>
  </div>;
  return <section className={`${panelClass} flex min-w-0 flex-col`}>
    <div className="flex items-start justify-between gap-2 border-b border-emerald-950/90 px-4 py-3.5"><div><h3 className="text-xs font-black text-white">Tīrās spēles · komandas</h3><p className="mt-1 text-[10px] text-slate-500">Komandas ar visvairāk spēlēm bez ielaistiem vārtiem</p></div><button type="button" onClick={onViewAll} className="shrink-0 rounded-lg border border-emerald-800/80 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-300 transition hover:bg-emerald-400/10">Visi →</button></div>
    {teams.length ? <div className="px-1">{teams.slice(0, 5).map(renderRow)}</div> : <EmptyState>Komandu tīro spēļu statistika šai sezonai nav pieejama.</EmptyState>}
  </section>;
}

function StandingsLeaderboard({ teams, onViewAll }) {
  const renderRow = (row, index) => <div key={row?.team?.id || index} className="flex items-center gap-3 border-b border-emerald-950/80 px-3 py-3 last:border-0"><span className="w-4 shrink-0 text-xs font-black text-slate-400">{row?.rank || index + 1}</span><div className="min-w-0 flex-1"><TeamMark team={row?.team} compact /></div><strong className="text-lg font-black text-emerald-300">{row?.points ?? "—"}</strong></div>;
  return <section className={`${panelClass} flex min-w-0 flex-col`}><div className="flex items-start justify-between gap-2 border-b border-emerald-950/90 px-4 py-3.5"><div><h3 className="text-xs font-black text-white">Tabulas līderi</h3><p className="mt-1 text-[10px] text-slate-500">Komandas ar visvairāk punktiem</p></div><button type="button" onClick={onViewAll} className="shrink-0 rounded-lg border border-emerald-800/80 px-2.5 py-1.5 text-[10px] font-extrabold text-emerald-300 transition hover:bg-emerald-400/10">Pilna tabula →</button></div>{teams.length ? <div className="px-1">{teams.slice(0, 5).map(renderRow)}</div> : <EmptyState>Komandu tabulas dati nav pieejami.</EmptyState>}</section>;
}

function KnockoutSection({ matches, competition, season }) {
  const [selectedTie, setSelectedTie] = useState(null);
  const knockoutPattern = /final|semi|quarter|round of|play.?off|knock.?out|last 16|last 8|1\/8|1\/4|1\/2|round of 32|round of 16|quarter.?final|semi.?final/i;
  const roundName = match => String(match?.league?.round || match?.fixture?.round || "Izslēgšanas spēles");
  const knockoutMatches = matches.filter(match => knockoutPattern.test(roundName(match)));
  const roundRank = value => {
    const r = value.toLowerCase();
    if (r.includes("final") && !r.includes("semi") && !r.includes("quarter")) return 100;
    if (r.includes("semi") || r.includes("1/2")) return 80;
    if (r.includes("quarter") || r.includes("1/4")) return 60;
    if (r.includes("round of 16") || r.includes("last 16") || r.includes("1/8")) return 40;
    if (r.includes("round of 32") || r.includes("last 32")) return 30;
    if (r.includes("play-off") || r.includes("playoff") || r.includes("play off")) return 20;
    return 10;
  };
  const roundsMap = new Map();
  knockoutMatches.forEach(match => {
    const round = roundName(match);
    if (!roundsMap.has(round)) roundsMap.set(round, []);
    roundsMap.get(round).push(match);
  });
  const rounds = [...roundsMap.entries()].sort((a, b) => roundRank(a[0]) - roundRank(b[0]));
  const buildTies = games => {
    const ties = new Map();
    games.forEach(game => {
      const homeId = game?.teams?.home?.id;
      const awayId = game?.teams?.away?.id;
      if (!homeId || !awayId) return;
      const key = [homeId, awayId].sort((a, b) => Number(a) - Number(b)).join("-");
      if (!ties.has(key)) ties.set(key, []);
      ties.get(key).push(game);
    });
    return [...ties.entries()].map(([key, tieGames]) => {
      const ordered = tieGames.slice().sort((a, b) => new Date(a?.fixture?.date || 0) - new Date(b?.fixture?.date || 0));
      const first = ordered[0];
      const finalRound = /(^|\b)final(\b|$)/i.test(roundName(first)) && !/semi|quarter/i.test(roundName(first));
      const aggregate = ordered.reduce((sum, game) => {
        const h = Number(game?.goals?.home);
        const a = Number(game?.goals?.away);
        if (!Number.isFinite(h) || !Number.isFinite(a)) return sum;
        sum[first?.teams?.home?.id === game?.teams?.home?.id ? "home" : "away"] += h;
        sum[first?.teams?.home?.id === game?.teams?.home?.id ? "away" : "home"] += a;
        return sum;
      }, { home: 0, away: 0 });
      const allFinished = ordered.every(game => ["FT", "AET", "PEN"].includes(game?.fixture?.status?.short));
      return { key, games: ordered, first, finalRound, aggregate, allFinished };
    }).sort((a, b) => new Date(a.first?.fixture?.date || 0) - new Date(b.first?.fixture?.date || 0));
  };
  const activeTie = selectedTie ? buildTies(knockoutMatches.filter(m => roundName(m) === selectedTie.round)).find(t => t.key === selectedTie.key) : null;
  const matchFinished = match => ["FT", "AET", "PEN"].includes(match?.fixture?.status?.short);
  const tieLabel = tie => `${tie.first?.teams?.home?.name || "Komanda"} · ${tie.first?.teams?.away?.name || "Komanda"}`;
  return <section className={`${panelClass} relative overflow-hidden`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950/90 px-4 py-4">
      <div className="flex items-center gap-3"><img src={competition.logo} alt="" className="h-10 w-10 object-contain" /><div><p className={labelClass}>Road to the final</p><h2 className="mt-1 text-lg font-black text-white">Izslēgšanas spēļu zars</h2><p className="mt-1 text-[10px] text-slate-500">{competition.name} · {season}/{Number(season) + 1} · Nospied uz pāra, lai redzētu spēļu rezultātus</p></div></div>
      <span className="rounded-full border border-emerald-800/80 px-3 py-1.5 text-[10px] font-bold text-emerald-300">{knockoutMatches.length} spēles</span>
    </div>
    {rounds.length ? <div className="w-full overflow-x-auto p-2 sm:p-3 lg:overflow-x-hidden">
      <div className="grid min-w-[760px] items-stretch gap-2 lg:min-w-0 lg:gap-2" style={{ gridTemplateColumns: `repeat(${rounds.length}, minmax(0, 1fr))` }}>
        {rounds.map(([round, games], roundIndex) => <div key={round} className="flex min-w-0 flex-col">
          <div title={round} className="mb-2 flex min-h-9 items-center justify-center rounded-md border border-emerald-800/80 bg-emerald-400/[.06] px-1.5 py-1.5 text-center text-[8px] font-black uppercase leading-tight tracking-wide text-emerald-300 sm:text-[9px]">{round}</div>
          <div className="flex flex-1 flex-col justify-around gap-2">
            {buildTies(games).map(tie => {
              const h = tie.first?.teams?.home || {};
              const a = tie.first?.teams?.away || {};
              const latest = tie.games[tie.games.length - 1];
              const done = tie.allFinished;
              const score = done ? (tie.finalRound ? `${latest?.goals?.home ?? 0}–${latest?.goals?.away ?? 0}` : `${tie.aggregate.home}–${tie.aggregate.away}`) : "VS";
              return <button type="button" key={tie.key} onClick={() => setSelectedTie({ key: tie.key, round })} title={tieLabel(tie)} className="group relative w-full min-w-0 rounded-lg border border-emerald-900 bg-[#03140e] p-1.5 text-left transition hover:border-emerald-400 hover:bg-emerald-400/[.06] focus:outline-none focus:ring-2 focus:ring-emerald-400/70 sm:p-2">
                <div className="mb-1 flex items-center justify-between gap-1"><span className="truncate text-[7px] font-bold uppercase leading-tight tracking-wide text-slate-500">{tie.finalRound ? "Fināls" : tie.games.length > 1 ? `${tie.games.length} spēles` : "Pāris"}</span><span className="shrink-0 text-[8px] text-emerald-300">↗</span></div>
                <div className="flex min-w-0 items-center justify-between gap-1 border-b border-emerald-950 py-1"><div className="min-w-0 flex-1 overflow-hidden"><TeamMark team={h} compact /></div><span className="min-w-3 text-center text-[10px] font-black text-white">{tie.finalRound && done ? latest?.goals?.home ?? 0 : ""}</span></div>
                <div className="flex min-w-0 items-center justify-between gap-1 py-1"><div className="min-w-0 flex-1 overflow-hidden"><TeamMark team={a} compact /></div><span className="min-w-3 text-center text-[10px] font-black text-white">{tie.finalRound && done ? latest?.goals?.away ?? 0 : ""}</span></div>
                {!tie.finalRound && <div className="mt-1 flex flex-wrap items-center justify-between gap-x-1 gap-y-0.5 rounded-md bg-black/25 px-1.5 py-1"><span className="text-[7px] font-bold leading-tight text-slate-400">Summā</span><strong className={`text-[10px] font-black ${done ? "text-emerald-300" : "text-slate-500"}`}>{done ? score : "—"}</strong></div>}
                {tie.finalRound && <div className="mt-1 rounded-md bg-black/25 px-1 py-1 text-center text-[8px] font-bold text-slate-400">{formatDate(latest?.fixture?.date, false)} · {score}</div>}
                {roundIndex < rounds.length - 1 && <span aria-hidden="true" className="pointer-events-none absolute -right-2 top-1/2 z-10 hidden h-px w-2 bg-emerald-700/80 lg:block" />}
              </button>;
            })}
          </div>
        </div>)}
      </div>
    </div> : <EmptyState>Šajā sezonā API vēl nav atgriezis izslēgšanas spēļu kārtas. Tās parādīsies, kad turnīra spēles būs pieejamas.</EmptyState>}
    {activeTie && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Izslēgšanas spēļu rezultāti" onClick={() => setSelectedTie(null)}>
      <div className="w-full max-w-xl overflow-hidden rounded-2xl border border-emerald-700/80 bg-[#061b14] shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 border-b border-emerald-950 px-5 py-4"><div><p className={labelClass}>{selectedTie.round}</p><h3 className="mt-1 text-lg font-black text-white">{tieLabel(activeTie)}</h3><p className="mt-1 text-xs text-slate-400">{activeTie.finalRound ? "Fināls — viena spēle" : "Abu spēļu rezultāti"}</p></div><button type="button" onClick={() => setSelectedTie(null)} className="rounded-lg border border-emerald-900 px-3 py-2 text-sm font-bold text-slate-300 hover:bg-white/5" aria-label="Aizvērt">✕</button></div>
        <div className="space-y-3 p-4">{activeTie.games.map((game, index) => { const done = matchFinished(game); return <div key={game?.fixture?.id || index} className="rounded-xl border border-emerald-950 bg-black/20 p-4"><div className="mb-3 flex items-center justify-between gap-2"><span className="text-[10px] font-bold text-slate-400">{activeTie.finalRound ? "Fināls" : `Spēle ${index + 1}`}</span><span className="text-[10px] text-slate-500">{formatDate(game?.fixture?.date)}</span></div><div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3"><div className="flex justify-end"><TeamMark team={game?.teams?.home} compact /></div><strong className={`rounded-lg px-3 py-2 text-lg font-black ${done ? "bg-emerald-400/10 text-emerald-300" : "bg-white/5 text-slate-400"}`}>{done ? `${game?.goals?.home ?? 0}–${game?.goals?.away ?? 0}` : "VS"}</strong><TeamMark team={game?.teams?.away} compact /></div><p className="mt-2 text-center text-[9px] text-slate-500">{game?.fixture?.venue?.name || ""}{game?.fixture?.status?.long ? ` · ${game.fixture.status.long}` : ""}</p></div>; })}</div>
        {!activeTie.finalRound && activeTie.allFinished && <div className="border-t border-emerald-950 px-5 py-4"><div className="flex items-center justify-between rounded-xl bg-emerald-400/[.08] px-4 py-3"><span className="text-xs font-bold text-slate-300">Kopējais rezultāts</span><strong className="text-xl font-black text-emerald-300">{activeTie.aggregate.home}–{activeTie.aggregate.away}</strong></div></div>}
      </div>
    </div>}
  </section>;
}
export default function EuropeanCompetitions() {
  const [competitionId, setCompetitionId] = useState(2);
  const [season, setSeason] = useState(currentSeason);
  const [standings, setStandings] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [recent, setRecent] = useState([]);
  const [scorers, setScorers] = useState([]);
  const [assists, setAssists] = useState([]);
  const [cleanSheetTeams, setCleanSheetTeams] = useState([]);
  const [leaderboardModal, setLeaderboardModal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeTab, setActiveTab] = useState("standings");
  const competition = useMemo(() => COMPETITIONS.find(item => item.id === competitionId) || COMPETITIONS[0], [competitionId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    const base = `${API_BASE_URL}/api-football.php`;
    const request = async query => {
      const response = await fetch(`${base}?${query}`, { headers: { Accept: "application/json" } });
      const payload = await response.json().catch(() => null);
      if (!response.ok || payload?.success === false) throw new Error(payload?.error || "Neizdevās ielādēt datus.");
      return Array.isArray(payload?.response) ? payload.response : [];
    };
    try {
      const [standingsResult, upcomingResult, recentResult, scorersResult, assistsResult, finishedResult, aetResult, penaltiesResult] = await Promise.allSettled([
        request(`action=standings&league=${competition.id}&season=${season}`),
        request(`action=fixtures&league=${competition.id}&season=${season}&status=NS`),
        request(`action=fixtures&league=${competition.id}&season=${season}&last=50`),
        request(`action=top-scorers&league=${competition.id}&season=${season}`),
        request(`action=top-assists&league=${competition.id}&season=${season}`),
        request(`action=fixtures&league=${competition.id}&season=${season}&status=FT`),
        request(`action=fixtures&league=${competition.id}&season=${season}&status=AET`),
        request(`action=fixtures&league=${competition.id}&season=${season}&status=PEN`),
      ]);
      const get = result => result.status === "fulfilled" ? result.value : [];
      const standingsResponse = get(standingsResult);
      const upcomingResponse = get(upcomingResult);
      const recentResponse = get(recentResult);
      const scorersResponse = get(scorersResult);
      const assistsResponse = get(assistsResult);
      const finishedFixtures = [...get(finishedResult), ...get(aetResult), ...get(penaltiesResult)];
      const cleanSheetMap = new Map();
      finishedFixtures.forEach(match => {
        const status = match?.fixture?.status?.short;
        if (!["FT", "AET", "PEN"].includes(status)) return;
        const home = match?.teams?.home;
        const away = match?.teams?.away;
        const homeGoals = match?.goals?.home;
        const awayGoals = match?.goals?.away;
        if (!home?.id || !away?.id || homeGoals == null || awayGoals == null) return;
        [[home, Number(awayGoals) === 0], [away, Number(homeGoals) === 0]].forEach(([team, keptCleanSheet]) => {
          if (!cleanSheetMap.has(team.id)) cleanSheetMap.set(team.id, { id: team.id, name: team.name, logo: team.logo, cleanSheets: 0, played: 0 });
          const entry = cleanSheetMap.get(team.id);
          entry.played += 1;
          if (keptCleanSheet) entry.cleanSheets += 1;
        });
      });
      const cleanSheetTeamsResponse = [...cleanSheetMap.values()].sort((a, b) => b.cleanSheets - a.cleanSheets || b.played - a.played || a.name.localeCompare(b.name));
      const league = standingsResponse?.[0]?.league;
      const groups = Array.isArray(league?.standings) ? league.standings : [];
      setStandings(groups.flatMap(group => Array.isArray(group) ? group : []));
      setUpcoming(upcomingResponse.sort((a, b) => new Date(a?.fixture?.date || 0) - new Date(b?.fixture?.date || 0)));
      setRecent(recentResponse.sort((a, b) => new Date(b?.fixture?.date || 0) - new Date(a?.fixture?.date || 0)));
      setScorers(scorersResponse);
      setAssists(assistsResponse);
      setCleanSheetTeams(cleanSheetTeamsResponse);
      setLastUpdated(new Date());
      if ([standingsResult, upcomingResult, recentResult].every(result => result.status === "rejected")) {
        throw new Error(standingsResult.reason?.message || "Neizdevās ielādēt Eiropas sacensību datus.");
      }
      if (!groups.length && !upcomingResponse.length && !recentResponse.length) {
        setError("Šai sezonai API pašlaik nav pieejamu datu. Izvēlies citu sezonu vai mēģini vēlāk.");
      }
    } catch (loadError) {
      setStandings([]); setUpcoming([]); setRecent([]); setScorers([]); setAssists([]); setCleanSheetTeams([]);
      setError(loadError?.message || "Neizdevās ielādēt Eiropas sacensību datus.");
    } finally { setLoading(false); }
  }, [competition, season]);

  useEffect(() => { loadData(); }, [loadData]);

  // Keep every team returned by the API; the standings panel scrolls internally.
  const visibleStandings = standings;
  const formTeams = [...standings].sort((a, b) => (b?.points ?? 0) - (a?.points ?? 0)).slice(0, 5);

  return <main className="space-y-5 pb-8 text-slate-100">
    <header className="relative isolate overflow-hidden rounded-2xl border border-emerald-900/70 bg-[radial-gradient(ellipse_at_90%_0%,rgba(16,185,129,.12),transparent_38%),linear-gradient(125deg,#061b14,#02100c_72%)] p-5 shadow-[0_16px_44px_rgba(0,0,0,.18)] sm:p-6">
      <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-start">
        <div className="min-w-0 flex-1"><p className="inline-flex items-center gap-2 rounded-full border border-emerald-700/50 bg-emerald-400/[.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[.18em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> European Football</p><h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">European Competitions<span className="text-emerald-400">.</span></h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">Apskati Eiropas klubu turnīrus, tabulas, spēļu datumus, rezultātus un spēlētāju statistiku.</p></div>
        <div className="flex flex-wrap gap-3 xl:pt-5">
          <label className="flex flex-col gap-1.5"><span className={labelClass}>Sezona</span><select value={season} onChange={e => setSeason(e.target.value)} className="min-w-40 rounded-xl border border-emerald-800 bg-[#03140e] px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-emerald-400">{SEASONS.map(value => <option key={value} value={value}>{value}/{Number(value) + 1}</option>)}</select></label>
          <label className="flex flex-col gap-1.5"><span className={labelClass}>Turnīra fāze</span><select value={activeTab} onChange={e => setActiveTab(e.target.value)} className="min-w-40 rounded-xl border border-emerald-800 bg-[#03140e] px-3.5 py-3 text-xs font-bold text-white outline-none focus:border-emerald-400"><option value="standings">Līgas fāze</option><option value="fixtures">Spēles un rezultāti</option><option value="knockout">Izslēgšanas spēles</option></select></label>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">{COMPETITIONS.map(item => <button key={item.id} type="button" onClick={() => setCompetitionId(item.id)} className={`group flex min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${competitionId === item.id ? "border-emerald-400 bg-emerald-400/[.09] shadow-[inset_0_0_0_1px_rgba(52,211,153,.12)]" : "border-emerald-950 bg-black/10 hover:border-emerald-800 hover:bg-emerald-400/[.04]"}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-black/20"><img src={item.logo} alt="" loading="lazy" className="h-9 w-9 object-contain" onError={e => { e.currentTarget.style.opacity = ".25"; }} /></span><span className="min-w-0"><span className="block text-xs font-black text-white">{item.name.replace("UEFA ", "UEFA ")}</span><span className="mt-1 block text-[10px] leading-4 text-slate-500">{item.format}</span></span></button>)}</div>
    </header>

    <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)]">
      <section className={`${panelClass} flex min-h-0 flex-col xl:h-[680px]`}>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-emerald-950/90 px-4 py-4"><div className="flex min-w-0 items-center gap-3"><img src={competition.logo} alt="" className="h-12 w-12 shrink-0 object-contain" onError={e => { e.currentTarget.style.opacity = ".25"; }} /><div className="min-w-0"><p className={labelClass}>{competition.name}</p><h2 className="mt-1 text-xl font-black text-white">{activeTab === "standings" ? "Tabula" : "Spēles un rezultāti"}</h2><p className="mt-1 text-[10px] text-slate-500">Sezona {season}/{Number(season) + 1}{lastUpdated ? ` · Atjaunots ${lastUpdated.toLocaleTimeString("lv-LV", { hour: "2-digit", minute: "2-digit" })}` : ""}</p></div></div><button type="button" onClick={loadData} disabled={loading} className="rounded-lg border border-emerald-800 px-3 py-2 text-[10px] font-extrabold text-emerald-300 hover:bg-emerald-400/10 disabled:opacity-50">{loading ? "Ielādē…" : "↻ Atjaunot"}</button></div>
        <div className="flex gap-1 border-b border-emerald-950/90 px-3 py-2">{[["standings", "Līgas fāze"], ["fixtures", "Spēles"], ["knockout", "Izslēgšanas spēles"]].map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`rounded-lg px-3 py-2 text-[10px] font-extrabold transition ${activeTab === key ? "bg-emerald-400 text-[#03150f]" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>{label}</button>)}</div>
        {error && <div role="status" className="mx-4 mt-4 rounded-xl border border-amber-700/50 bg-amber-950/20 p-3 text-xs leading-5 text-amber-100">{error}<p className="mt-1 text-[10px] text-amber-200/70">Datu pieejamība ir atkarīga no API-Football pārklājuma, plāna un sezonas.</p></div>}
        {loading ? <EmptyState>Ielādē turnīra datus…</EmptyState> : activeTab === "standings" ? visibleStandings.length ? <div className="min-h-0 flex-1 overflow-auto overscroll-contain"><table className="w-full min-w-[500px] text-left"><thead className="sticky top-0 z-10 bg-[#02110c] text-[9px] uppercase tracking-wider text-slate-500"><tr>{["#", "Klubs", "SP", "U", "N", "Z", "GD", "P"].map(x => <th key={x} className="px-3 py-3 font-black">{x}</th>)}</tr></thead><tbody>{visibleStandings.map((row, index) => <tr key={row?.team?.id || index} className="border-t border-emerald-950/80 transition hover:bg-emerald-400/[.04]"><td className="px-3 py-3 text-xs font-black text-emerald-300">{row?.rank || index + 1}</td><td className="max-w-[210px] px-3 py-3"><TeamMark team={row?.team} compact /></td><td className="px-3 py-3 text-xs text-slate-400">{row?.all?.played ?? "—"}</td><td className="px-3 py-3 text-xs text-slate-400">{row?.all?.win ?? "—"}</td><td className="px-3 py-3 text-xs text-slate-400">{row?.all?.draw ?? "—"}</td><td className="px-3 py-3 text-xs text-slate-400">{row?.all?.lose ?? "—"}</td><td className={`px-3 py-3 text-xs font-bold ${(Number(row?.goalsDiff) || 0) < 0 ? "text-rose-400" : "text-emerald-300"}`}>{row?.goalsDiff > 0 ? `+${row.goalsDiff}` : row?.goalsDiff ?? "—"}</td><td className="px-3 py-3 text-xs font-black text-white">{row?.points ?? "—"}</td></tr>)}</tbody></table><button type="button" onClick={() => setActiveTab("fixtures")} className="m-3 w-[calc(100%-1.5rem)] rounded-lg border border-emerald-900 py-3 text-xs font-extrabold text-emerald-300 transition hover:bg-emerald-400/[.06]">Apskatīt spēles un rezultātus →</button></div> : <EmptyState>Šai sacensībai un sezonai tabulas dati nav pieejami.</EmptyState> : activeTab === "knockout" ? <div className="min-h-0 flex-1 overflow-auto overscroll-contain"><KnockoutSection matches={[...recent, ...upcoming]} competition={competition} season={season} /></div> : [...recent, ...upcoming].sort((a, b) => new Date(b?.fixture?.date || 0) - new Date(a?.fixture?.date || 0)).slice(0, 10).length ? <div className="divide-y divide-emerald-950/80">{[...recent, ...upcoming].sort((a, b) => new Date(b?.fixture?.date || 0) - new Date(a?.fixture?.date || 0)).slice(0, 10).map((match, i) => { const done = ["FT", "AET", "PEN"].includes(match?.fixture?.status?.short); return <div key={match?.fixture?.id || i} className="grid grid-cols-[minmax(0,1fr)_70px_minmax(0,1fr)] items-center gap-2 px-3 py-3"><div className="flex justify-end"><TeamMark team={match?.teams?.home} compact /></div><div className="text-center"><div className="rounded-md bg-black/20 px-2 py-2 text-xs font-black text-white">{done ? `${match?.goals?.home ?? 0} : ${match?.goals?.away ?? 0}` : "VS"}</div><p className="mt-1 text-[9px] text-slate-500">{formatDate(match?.fixture?.date, false)}</p></div><TeamMark team={match?.teams?.away} compact /></div>; })}</div> : <EmptyState>Šai sezonai spēļu dati nav pieejami.</EmptyState>}
      </section>

      <div className="grid min-w-0 content-start gap-4 md:grid-cols-2 xl:grid-cols-1">
        <FixtureList title="Pēdējās spēles" matches={recent} upcoming={false} onViewAll={() => setActiveTab("fixtures")} />
        <FixtureList title="Nākamās spēles" matches={upcoming} upcoming onViewAll={() => setActiveTab("fixtures")} />
      </div>
    </div>

    <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2 xl:grid-cols-4">
      <PlayerLeaderboard title="Labākie vārtu guvēji" subtitle="Top 5 · turnīra rezultatīvākie spēlētāji" players={scorers} metric="goals" accent="#39E58C" onViewAll={() => setLeaderboardModal("scorers")} />
      <PlayerLeaderboard title="Labākie piespēlētāji" subtitle="Top 5 · rezultatīvākās piespēles" players={assists} metric="assists" accent="#A78BFA" onViewAll={() => setLeaderboardModal("assists")} />
      <CleanSheetLeaderboard teams={cleanSheetTeams} onViewAll={() => setLeaderboardModal("cleanSheetTeams")} />
      <StandingsLeaderboard teams={formTeams} onViewAll={() => setLeaderboardModal("standings")} />
    </div>
    {leaderboardModal && <LeaderboardModal title={({ scorers: "Visi vārtu guvēji", assists: "Visi piespēlētāji", cleanSheetTeams: "Komandas · tīrās spēles", standings: "Pilna turnīra tabula" })[leaderboardModal]} subtitle={`${competition.name} · ${season}/${Number(season) + 1}`} onClose={() => setLeaderboardModal(null)}>
      {leaderboardModal === "scorers" && (scorers.length ? scorers.map((item, index) => { const stats = item?.statistics?.[0] || {}; return <div key={item?.player?.id || index} className="flex items-center justify-between gap-3 border-b border-emerald-950/80 px-2 py-3"><div className="flex min-w-0 items-center gap-3"><span className="w-5 text-xs font-black text-slate-400">{index + 1}</span>{item?.player?.photo && <img src={item.player.photo} alt="" className="h-9 w-9 rounded-lg object-cover" />}<div className="min-w-0"><p className="truncate text-xs font-bold text-white">{item?.player?.name}</p><p className="text-[10px] text-slate-400">{stats?.team?.name || "—"}</p></div></div><strong className="text-lg font-black text-emerald-300">{stats?.goals?.total ?? 0}</strong></div>; }) : <EmptyState>Vārtu guvēju dati nav pieejami.</EmptyState>)}
      {leaderboardModal === "assists" && (assists.length ? assists.map((item, index) => { const stats = item?.statistics?.[0] || {}; return <div key={item?.player?.id || index} className="flex items-center justify-between gap-3 border-b border-emerald-950/80 px-2 py-3"><div className="flex min-w-0 items-center gap-3"><span className="w-5 text-xs font-black text-slate-400">{index + 1}</span>{item?.player?.photo && <img src={item.player.photo} alt="" className="h-9 w-9 rounded-lg object-cover" />}<div className="min-w-0"><p className="truncate text-xs font-bold text-white">{item?.player?.name}</p><p className="text-[10px] text-slate-400">{stats?.team?.name || "—"}</p></div></div><strong className="text-lg font-black text-violet-300">{stats?.goals?.assists ?? 0}</strong></div>; }) : <EmptyState>Piespēlētāju dati nav pieejami.</EmptyState>)}
      {leaderboardModal === "cleanSheetTeams" && (cleanSheetTeams.length ? cleanSheetTeams.map((team, index) => <div key={team.id} className="flex items-center justify-between gap-3 border-b border-emerald-950/80 px-2 py-3"><div className="flex min-w-0 items-center gap-3"><span className="w-5 text-xs font-black text-slate-400">{index + 1}</span>{team.logo && <img src={team.logo} alt="" className="h-9 w-9 rounded-lg object-contain p-1" />}<div className="min-w-0"><p className="truncate text-xs font-bold text-white">{team.name}</p><p className="text-[10px] text-slate-400">{team.played} spēles analizētas</p></div></div><div className="text-right"><strong className="block text-lg font-black text-sky-300">{team.cleanSheets}</strong><span className="text-[9px] text-slate-500">tīrās spēles</span></div></div>) : <EmptyState>Komandu tīro spēļu statistika nav pieejama.</EmptyState>)}
      {leaderboardModal === "standings" && (standings.length ? <div className="overflow-x-auto"><table className="w-full min-w-[420px] text-left"><thead className="sticky top-0 bg-[#02110c] text-[10px] uppercase text-slate-500"><tr>{["#", "Komanda", "SP", "U", "N", "Z", "GD", "P"].map(x => <th key={x} className="px-3 py-3">{x}</th>)}</tr></thead><tbody>{standings.map((row, index) => <tr key={row?.team?.id || index} className="border-t border-emerald-950/80"><td className="px-3 py-3 text-xs font-bold text-emerald-300">{row?.rank || index + 1}</td><td className="max-w-[180px] px-3 py-3"><TeamMark team={row?.team} compact /></td><td className="px-3 py-3 text-xs">{row?.all?.played ?? "—"}</td><td className="px-3 py-3 text-xs">{row?.all?.win ?? "—"}</td><td className="px-3 py-3 text-xs">{row?.all?.draw ?? "—"}</td><td className="px-3 py-3 text-xs">{row?.all?.lose ?? "—"}</td><td className="px-3 py-3 text-xs">{row?.goalsDiff ?? "—"}</td><td className="px-3 py-3 text-xs font-black text-white">{row?.points ?? "—"}</td></tr>)}</tbody></table></div> : <EmptyState>Turnīra tabula nav pieejama.</EmptyState>)}
    </LeaderboardModal>}
  </main>;
}