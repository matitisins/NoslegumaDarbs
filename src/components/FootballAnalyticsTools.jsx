import React, { useEffect, useMemo, useState } from "react";
import { fetchApiSportsPlayers } from "../services/apiSports";
import { fetchLeagueFixturesWithStatus, fetchLeagueStandingsWithStatus } from "../services/leagueFeatures";
import RecommendationTool from "./analytics/RecommendationTool";
import RankingTool from "./analytics/RankingTool";
import FantasyBuilder from "./analytics/FantasyBuilder";
import LeagueLogo from "./LeagueLogo";
import {
  categories,
  getBudgetPrice,
  getProjectedPoints,
  number,
  weightedScore,
} from "../utils/analyticsUtils";

const FLOW = {
  panel: "rounded-2xl border border-emerald-900/70 bg-[#061A13]",
  mutedPanel: "rounded-xl border border-emerald-900/60 bg-[#071F17]",
  input: "rounded-lg border border-emerald-900 bg-[#04150F] px-3 py-2 text-xs text-slate-100 outline-none transition focus:border-emerald-400",
  button: "rounded-lg border border-emerald-800 px-3 py-2 text-xs font-bold text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-400/10",
};

const metricWeights = [
  { key: "goals", label: "Vārti", initial: 25 },
  { key: "assists", label: "Assist", initial: 20 },
  { key: "points", label: "Flow punkti", initial: 25 },
  { key: "minutes", label: "Minūtes", initial: 15 },
  { key: "rating", label: "Vērtējums", initial: 15 },
];

const normalizePosition = player => {
  const raw = String(player?.category || player?.officialFplPosition || player?.position || "").toUpperCase();
  if (raw.includes("KEEP") || raw === "GK") return "GOALKEEPERS";
  if (raw.includes("DEF") || raw.includes("BACK")) return "DEFENDERS";
  if (raw.includes("MID")) return "MIDFIELDERS";
  if (raw.includes("STRIK") || raw.includes("FORWARD") || raw.includes("ATTACK") || raw.includes("WING") || raw === "FWD") return "STRIKERS";
  return raw;
};
const shortPosition = player => ({ GOALKEEPERS: "GK", DEFENDERS: "DEF", MIDFIELDERS: "MID", STRIKERS: "FWD" }[normalizePosition(player)] || "—");
const playerKey = player => String(player?.id ?? player?.name ?? "");
const playerForm = player => {
  const values = Array.isArray(player?.recentForm) ? player.recentForm.map(item => Number(typeof item === "object" ? item.points ?? item.value : item)).filter(Number.isFinite) : [];
  return values.length ? values.slice(-5) : [];
};
const teamName = team => team?.name || team?.shortName || "Unknown team";
const getFixtureTeams = fixture => ({ home: fixture?.homeTeam || fixture?.teams?.home || fixture?.home || {}, away: fixture?.awayTeam || fixture?.teams?.away || fixture?.away || {} });
const normalizeTeamName = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(fc|afc|cf|sc|club|football club)\b/g, " ").replace(/[^a-z0-9]+/g, " ").trim();
const fixtureTimestamp = fixture => {
  const raw = fixture?.utcDate || fixture?.date || fixture?.fixture?.date;
  const timestamp = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
};
const fixtureHasTeam = (fixture, team) => {
  const { home, away } = getFixtureTeams(fixture);
  const teamId = team?.id ?? team?.team?.id;
  if (teamId != null && (String(home?.id ?? "") === String(teamId) || String(away?.id ?? "") === String(teamId))) return true;
  const wanted = normalizeTeamName(team?.name || team?.team?.name || team?.teamName);
  return Boolean(wanted && [home?.name, away?.name].some(name => normalizeTeamName(name) === wanted));
};
const fixtureDate = fixture => {
  const raw = fixture?.utcDate || fixture?.date || fixture?.fixture?.date;
  if (!raw) return "Datums nav pieejams";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "Datums nav pieejams" : date.toLocaleDateString("lv-LV", { day: "2-digit", month: "short" });
};
const crestFor = (player, standings) => {
  const row = standings.find(item => String(item?.team?.name || item?.teamName || item?.name || "").toLowerCase() === String(player?.team || "").toLowerCase());
  return player?.teamLogo || player?.teamCrest || row?.team?.crest || row?.team?.logo || "";
};

function PlayerAvatar({ player, standings, size = "h-9 w-9" }) {
  if (player?.photo || player?.photoUrl || player?.image) {
    return <img src={player.photo || player.photoUrl || player.image} alt="" loading="lazy" className={`${size} shrink-0 rounded-lg border border-emerald-900/60 bg-[#0A291E] object-cover`} />;
  }
  const crest = crestFor(player, standings);
  if (crest) return <img src={crest} alt="" loading="lazy" className={`${size} shrink-0 rounded-lg border border-emerald-900/60 bg-[#0A291E] object-contain p-1`} />;
  const initials = String(player?.name || "PL").split(/\s+/).map(part => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return <div className={`${size} flex shrink-0 items-center justify-center rounded-lg border border-emerald-900 bg-[#0A291E] text-[10px] font-black text-emerald-200`}>{initials}</div>;
}

function PanelHeading({ title, subtitle, action, onAction }) {
  return <div className="flex items-start justify-between gap-3 border-b border-emerald-950/90 px-4 py-3"><div className="min-w-0"><h3 className="text-sm font-black text-white">{title}</h3>{subtitle && <p className="mt-1 text-[10px] leading-4 text-slate-400">{subtitle}</p>}</div>{action && <button type="button" onClick={onAction} className={FLOW.button + " shrink-0"}>{action} →</button>}</div>;
}

const COMPARISON_COLORS = ["#34D399", "#60A5FA", "#FBBF24", "#C084FC"];

function getComparisonMetrics(players = []) {
  const selectedPositions = [...new Set(players.map(normalizePosition).filter(Boolean))];
  const position = selectedPositions.length === 1 ? selectedPositions[0] : "ALL";
  const stat = (keys) => player => {
    for (const key of keys) {
      const value = key.split(".").reduce((current, part) => current?.[part], player);
      if (value !== undefined && value !== null && value !== "" && Number.isFinite(Number(value))) return Number(value);
    }
    return 0;
  };
  const common = [
    ["Flow punkti", stat(["flowPoints", "points", "totalPoints"])],
    ["Minūtes", stat(["minutes", "minutesPlayed"])],
    ["Vērtējums", stat(["advancedStats.rating", "rating", "averageRating"])],
  ];
  if (position === "GOALKEEPERS") return [
    ["Atvairījumi", stat(["advancedStats.saves", "saves", "goalkeeperStats.saves"])],
    ["Tīrās spēles", stat(["cleanSheets", "advancedStats.cleanSheets", "goalkeeperStats.cleanSheets"])],
    ["Ielaistie vārti", stat(["goalsConceded", "advancedStats.goalsConceded", "goalkeeperStats.goalsConceded"])],
    ["11 m atvairīti", stat(["penaltiesSaved", "advancedStats.penaltiesSaved", "goalkeeperStats.penaltiesSaved"])],
    ...common,
  ];
  if (position === "DEFENDERS") return [
    ["Veiksmīgi takli", stat(["advancedStats.tackles", "tackles", "defensiveStats.tackles"])],
    ["Pārtvertas bumbas", stat(["advancedStats.interceptions", "interceptions", "defensiveStats.interceptions"])],
    ["Bloķēti sitieni", stat(["advancedStats.blocks", "blocks", "blockedShots", "defensiveStats.blocks"])],
    ["Assist", stat(["assists", "goalAssists"])],
    ...common,
  ];
  if (position === "MIDFIELDERS") return [
    ["Vārti", stat(["goals", "goalsScored"])],
    ["Assist", stat(["assists", "goalAssists"])],
    ["Atslēgas piespēles", stat(["advancedStats.keyPasses", "keyPasses"])],
    ["Sitieni vārtu rāmī", stat(["advancedStats.shotsOnTarget", "shotsOnTarget"])],
    ...common,
  ];
  if (position === "STRIKERS") return [
    ["Vārti", stat(["goals", "goalsScored"])],
    ["Assist", stat(["assists", "goalAssists"])],
    ["Sitieni vārtu rāmī", stat(["advancedStats.shotsOnTarget", "shotsOnTarget"])],
    ["Veiksmīgi dribli", stat(["advancedStats.dribbles.success", "dribbles.success", "advancedStats.successfulDribbles", "successfulDribbles", "advancedStats.dribbles", "dribbles"])],
    ...common,
  ];
  return [
    ["Vārti", stat(["goals", "goalsScored"])],
    ["Assist", stat(["assists", "goalAssists"])],
    ...common,
    ["Sitieni vārtu rāmī", stat(["advancedStats.shotsOnTarget", "shotsOnTarget"])],
  ];
}

function RadarComparison({ players }) {
  const metrics = getComparisonMetrics(players);
  const width = 300, height = 250, cx = 150, cy = 122, radius = 78;
  const maximums = metrics.map(([, read]) => Math.max(1, ...players.map(read)));
  const point = (index, value) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / metrics.length;
    const r = radius * value;
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r];
  };
  return <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img" aria-label="Spēlētāju statistikas radara salīdzinājums">
    {[0.25, 0.5, 0.75, 1].map(level => <polygon key={level} points={metrics.map((_, i) => point(i, level).join(",")).join(" ")} fill="none" stroke="#174936" strokeWidth="1" />)}
    {metrics.map(([label], i) => { const [x, y] = point(i, 1.18); return <g key={label}><line x1={cx} y1={cy} x2={point(i, 1)[0]} y2={point(i, 1)[1]} stroke="#174936"/><text x={x} y={y} fill="#9CB9AD" fontSize="9" textAnchor="middle" dominantBaseline="middle">{label}</text></g>; })}
    {players.map((player, playerIndex) => {
      const values = metrics.map(([, read], i) => read(player) / maximums[i]);
      const color = COMPARISON_COLORS[playerIndex % COMPARISON_COLORS.length];
      return <g key={playerKey(player)}><polygon points={values.map((value, i) => point(i, value).join(",")).join(" ")} fill={color} fillOpacity="0.12" stroke={color} strokeWidth="2" />{values.map((value, i) => { const [x, y] = point(i, value); return <circle key={i} cx={x} cy={y} r="2.5" fill={color}/>; })}</g>;
    })}
  </svg>;
}

const comparisonPositions = categories.filter(([value]) => value !== "ALL");

function PlayerComparisonPicker({ slot, players, selectedPlayer, selectedIds, standings, positionFilter, onSelect }) {
  const [query, setQuery] = useState("");
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return players.filter(player => {
      const matchesPosition = positionFilter === "ALL" || normalizePosition(player) === positionFilter;
      const matchesQuery = term && `${player?.name || ""} ${player?.team || ""}`.toLowerCase().includes(term);
      const notUsedElsewhere = !selectedIds.some(id => id && id !== playerKey(selectedPlayer) && id === playerKey(player));
      return matchesPosition && matchesQuery && notUsedElsewhere;
    }).slice(0, 8);
  }, [players, positionFilter, query, selectedIds, selectedPlayer]);

  return <div className="rounded-xl border border-emerald-950/80 bg-[#071F17] p-3">
    <div className="mb-2 flex items-center justify-between gap-2"><span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Spēlētājs {slot + 1}</span>{selectedPlayer && <button type="button" onClick={() => onSelect(slot, "")} className="text-[9px] font-bold text-rose-300 hover:text-rose-200">Noņemt</button>}</div>
    <label className="block"><span className="mb-1 block text-[9px] text-slate-400">Meklēt spēlētāju</span><div className="relative"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Vārds vai komanda…" className={`${FLOW.input} w-full pl-8`} aria-label={`Meklēt spēlētāju ${slot + 1}`}/></div></label>
    {selectedPlayer && <div className="mt-2 flex items-center gap-2 rounded-lg border border-emerald-900/70 bg-emerald-400/[0.06] p-2"><PlayerAvatar player={selectedPlayer} standings={standings} size="h-9 w-9"/><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{selectedPlayer.name}</p><p className="truncate text-[9px] text-slate-400">{selectedPlayer.team || "Komanda nav norādīta"} · {shortPosition(selectedPlayer)}</p></div><span className="text-[9px] font-bold text-emerald-300">Izvēlēts</span></div>}
    {query.trim() && <div className="mt-2 space-y-1">{filtered.length ? filtered.map(player => <button key={playerKey(player)} type="button" onClick={() => { onSelect(slot, playerKey(player)); setQuery(""); }} className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:border-emerald-800 hover:bg-emerald-400/10"><PlayerAvatar player={player} standings={standings} size="h-8 w-8"/><span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-bold text-white">{player.name}</span><span className="block truncate text-[9px] text-slate-500">{player.team || "Komanda nav norādīta"} · {shortPosition(player)}</span></span><span className="text-emerald-300">+</span></button>) : <p className="rounded-lg bg-[#04150F] p-2 text-[9px] text-slate-500">Nav atrasts spēlētājs šajā pozīcijā.</p>}</div>}
    {!query.trim() && <p className="mt-2 text-[9px] text-slate-600">Izvēlies pozīciju un sāc rakstīt vārdu vai komandu.</p>}
  </div>;
}

function FootballAnalyticsTools({ competition, season, leagueName }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);
  const [contextWarning, setContextWarning] = useState("");
  const [contextLoading, setContextLoading] = useState(true);
  const [activeTool, setActiveTool] = useState("overview");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("projection");
  const [comparisonIds, setComparisonIds] = useState([]);
  const [comparisonPosition, setComparisonPosition] = useState("ALL");
  const [rankingWeights, setRankingWeights] = useState(() => Object.fromEntries(metricWeights.map(item => [item.key, item.initial])));
  const [fixtureView, setFixtureView] = useState("teams");

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError("");
    fetchApiSportsPlayers(competition, season).then(data => {
      if (!cancelled) setPlayers(Array.isArray(data) ? data : []);
    }).catch(err => {
      if (!cancelled) { setPlayers([]); setError(err?.message || "Neizdevās ielādēt spēlētājus."); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [competition, season]);

  useEffect(() => {
    let cancelled = false;
    setContextLoading(true); setContextWarning("");
    Promise.all([fetchLeagueFixturesWithStatus(competition, season), fetchLeagueStandingsWithStatus(competition, season)]).then(([fixtureResult, standingResult]) => {
      if (cancelled) return;
      setFixtures(fixtureResult?.data || { upcoming: [], recent: [] });
      setStandings(Array.isArray(standingResult?.data) ? standingResult.data : []);
      setContextWarning([fixtureResult?.warning, standingResult?.warning].filter(Boolean).join(" "));
    }).catch(err => {
      if (!cancelled) { setFixtures({ upcoming: [], recent: [] }); setStandings([]); setContextWarning(err?.message || "Neizdevās ielādēt līgas kontekstu."); }
    }).finally(() => { if (!cancelled) setContextLoading(false); });
    return () => { cancelled = true; };
  }, [competition, season]);

  useEffect(() => { setComparisonIds([]); setComparisonPosition("ALL"); setPositionFilter("ALL"); setSearch(""); setActiveTool("overview"); }, [competition, season]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    const pool = players.filter(player => (positionFilter === "ALL" || normalizePosition(player) === positionFilter) && (!query || `${player.name || ""} ${player.team || ""}`.toLowerCase().includes(query)));
    return [...pool].sort((a, b) => {
      if (sortBy === "form") return getProjectedPoints(b) - getProjectedPoints(a);
      if (sortBy === "goals") return number(b.goals) - number(a.goals);
      if (sortBy === "points") return number(b.flowPoints) - number(a.flowPoints);
      if (sortBy === "price") return getBudgetPrice(a) - getBudgetPrice(b);
      return getProjectedPoints(b) - getProjectedPoints(a);
    });
  }, [players, positionFilter, search, sortBy]);

  useEffect(() => {
    if (!players.length) return;
    setComparisonIds(current => {
      const valid = current.filter(id => players.some(player => playerKey(player) === id));
      if (valid.length) return valid.slice(0, 4);
      return players.slice(0, Math.min(4, players.length)).map(playerKey);
    });
  }, [players]);

  const comparisonPlayers = useMemo(() => comparisonIds.map(id => players.find(player => playerKey(player) === id)).filter(Boolean), [comparisonIds, players]);
  const ranking = useMemo(() => filteredPlayers.map(player => ({ player, score: weightedScore(player, rankingWeights, filteredPlayers) })).sort((a, b) => b.score - a.score), [filteredPlayers, rankingWeights]);
  const captainCandidates = useMemo(() => [...filteredPlayers].sort((a, b) => getProjectedPoints(b) - getProjectedPoints(a)).slice(0, 5), [filteredPlayers]);
  const recommended = useMemo(() => [...filteredPlayers].sort((a, b) => {
    const scoreA = weightedScore(a, { points: 35, goals: 20, assists: 15, minutes: 15, rating: 15 }, filteredPlayers);
    const scoreB = weightedScore(b, { points: 35, goals: 20, assists: 15, minutes: 15, rating: 15 }, filteredPlayers);
    return scoreB - scoreA;
  }).slice(0, 15), [filteredPlayers]);
  const upcomingFixtures = useMemo(() => {
    const now = Date.now();
    return (Array.isArray(fixtures?.upcoming) ? fixtures.upcoming : [])
      .filter(fixture => {
        const timestamp = fixtureTimestamp(fixture);
        const status = String(fixture?.status?.short || fixture?.status || fixture?.fixture?.status?.short || "").toUpperCase();
        const cancelled = ["FT", "AET", "PEN", "FINISHED", "CANCELLED", "POSTPONED", "SUSPENDED", "ABD", "WO"].includes(status);
        return timestamp !== null && timestamp >= now && !cancelled;
      })
      .sort((a, b) => fixtureTimestamp(a) - fixtureTimestamp(b));
  }, [fixtures]);
  const fixtureTeamRows = useMemo(() => standings.map(row => {
    const team = row?.team || row;
    const name = team?.name || row?.teamName || row?.name || "Komanda";
    const matches = upcomingFixtures.filter(fixture => fixtureHasTeam(fixture, { ...team, name })).slice(0, 5);
    return { id: team?.id ?? row?.teamId ?? name, name, crest: team?.crest || team?.logo || row?.crest || "", matches };
  }), [standings, upcomingFixtures]);
  const totalProjected = players.reduce((sum, player) => sum + getProjectedPoints(player), 0);
  const averageForm = players.length ? players.reduce((sum, player) => sum + getProjectedPoints(player), 0) / players.length : 0;

  const setComparePlayer = (slot, value) => setComparisonIds(current => {
    const next = [...current];
    while (next.length < 4) next.push("");
    if (value && next.some((id, index) => index !== slot && id === value)) return current;
    next[slot] = value || "";
    return next.slice(0, 4);
  });
  const goTo = tool => setActiveTool(tool);
  const backToOverview = () => setActiveTool("overview");

  const tools = [
    { id: "recommendations", icon: "✦", title: "Player Recommendations", description: "Spēlētāji pēc formas, cenas un statistikas." },
    { id: "ranking", icon: "▥", title: "Custom Player Ranking", description: "Veido savus reitingus ar pielāgotiem svariem." },
    { id: "comparison", icon: "⚖", title: "Player Comparison", description: "Salīdzini līdz četriem spēlētājiem." },
    { id: "fantasy", icon: "⬡", title: "Fantasy Team Builder", description: "Veido sastāvu ar budžetu un prognozēm." },
  ];

  return <section className="space-y-5 text-slate-100">
    <header className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div className="flex items-center gap-3"><LeagueLogo competition={competition} size={44}/><div><h2 className="text-2xl font-black tracking-tight text-white">Analytics Tools</h2><p className="mt-1 text-xs text-slate-400">Uzlabota spēlētāju analīze, salīdzināšana un novērtēšana</p><p className="mt-1 text-[10px] font-bold text-emerald-300">{leagueName} · {season}/{Number(season) + 1}</p></div></div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3"><label className="text-[10px] font-bold text-slate-400">Pozīcija<select value={positionFilter} onChange={event => setPositionFilter(event.target.value)} className={`${FLOW.input} mt-1 block w-full`}><option value="ALL">Visas pozīcijas</option>{categories.filter(([value]) => value !== "ALL").map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-[10px] font-bold text-slate-400">Kārtot pēc<select value={sortBy} onChange={event => setSortBy(event.target.value)} className={`${FLOW.input} mt-1 block w-full`}><option value="projection">Prognozētie punkti</option><option value="form">Forma</option><option value="points">Flow punkti</option><option value="goals">Vārti</option><option value="price">Cena: zemākā</option></select></label><label className="col-span-2 text-[10px] font-bold text-slate-400 sm:col-span-1">Meklēt spēlētāju<input value={search} onChange={event => setSearch(event.target.value)} placeholder="Vārds vai komanda…" className={`${FLOW.input} mt-1 block w-full`}/></label></div>
    </header>

    {contextWarning && <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200"><strong>Datu paziņojums:</strong> {contextWarning}</div>}
    {error && <div role="alert" className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200"><strong>API kļūda.</strong> {error} <button type="button" className="ml-2 underline" onClick={() => { setError(""); setLoading(true); fetchApiSportsPlayers(competition, season).then(data => setPlayers(Array.isArray(data) ? data : [])).catch(err => setError(err?.message || "Neizdevās ielādēt datus.")).finally(() => setLoading(false)); }}>Mēģināt vēlreiz</button></div>}

    {loading ? <div className={`${FLOW.panel} p-14 text-center`}><div className="mx-auto h-10 w-10 animate-spin rounded-xl border-4 border-emerald-950 border-t-emerald-400"/><p className="mt-4 text-sm font-bold text-slate-300">Ielādē analītikas datus…</p><p className="mt-1 text-xs text-slate-500">Tiek izmantoti izvēlētās līgas un sezonas dati.</p></div> : !players.length ? <div className={`${FLOW.panel} p-10 text-center`}><p className="font-black text-white">Šai līgai un sezonai nav pieejamu spēlētāju datu.</p><p className="mt-2 text-xs text-slate-400">Izvēlies citu līgu vai sezonu. Nezināmi dati netiek aizstāti ar nullēm.</p></div> : <>
      {activeTool === "overview" ? <>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-2">
          {tools.filter(tool => tool.id === "recommendations" || tool.id === "fantasy").map((tool, index) => <button key={tool.id} type="button" onClick={() => goTo(tool.id)} className={`group flex min-h-[96px] items-center gap-3 rounded-xl border p-4 text-left transition ${index === 0 ? "border-emerald-400 bg-emerald-400/10" : "border-emerald-950 bg-[#061A13] hover:border-emerald-500/60 hover:bg-[#09241A]"}`}><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-2xl font-black text-emerald-300">{tool.icon}</span><span className="min-w-0 flex-1"><span className="block text-xs font-black text-white">{tool.title}</span><span className="mt-1 block text-[10px] leading-4 text-slate-400">{tool.description}</span></span><span className="text-lg text-emerald-300 transition group-hover:translate-x-1">→</span></button>)}
        </div>

        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {[{ label: "Spēlētāju datu kopa", value: players.length.toLocaleString("lv-LV"), note: "atlasītajā līgā" }, { label: "Vidējā prognoze", value: averageForm.toFixed(1), note: "punkti uz spēlētāju" }, { label: "Pieejamās spēles", value: upcomingFixtures.length, note: contextLoading ? "ielādē…" : "nākamās spēles" }, { label: "Salīdzināšanai", value: comparisonPlayers.length, note: "no 4 spēlētājiem" }, { label: "Līgas komandas", value: standings.length || "—", note: "pieejamās tabulas rindas" }, { label: "Prognožu summa", value: Math.round(totalProjected).toLocaleString("lv-LV"), note: "orientējoši punkti" }].map(item => <div key={item.label} className={`${FLOW.panel} p-3`}><p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-black text-emerald-300">{item.value}</p><p className="mt-1 text-[9px] text-slate-500">{item.note}</p></div>)}
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <section className={FLOW.panel}><PanelHeading title="Player Recommendations" subtitle="Labākie kandidāti pēc formas, rezultativitātes un spēles laika." action="Visi ieteikumi" onAction={() => goTo("recommendations")}/><div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-xs"><thead className="bg-[#071F17] text-[9px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3"># / Spēlētājs</th><th className="px-3 py-3">Poz.</th><th className="px-3 py-3">Cena</th><th className="px-3 py-3">Forma</th><th className="px-4 py-3 text-right">Prognoze</th></tr></thead><tbody>{recommended.slice(0, 15).map((player, index) => <tr key={playerKey(player)} className="border-t border-emerald-950/80 hover:bg-emerald-400/[0.04]"><td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><span className="w-3 text-[10px] text-slate-500">{index + 1}</span><PlayerAvatar player={player} standings size="h-8 w-8"/><span className="min-w-0"><span className="block max-w-[180px] truncate font-bold text-white">{player.name || "Nezināms spēlētājs"}</span><span className="block max-w-[180px] truncate text-[10px] text-slate-500">{player.team || "Komanda nav norādīta"}</span></span></div></td><td className="px-3 py-2.5"><span className="rounded bg-violet-500/15 px-1.5 py-1 text-[9px] font-bold text-violet-300">{shortPosition(player)}</span></td><td className="px-3 py-2.5 text-slate-300">€{getBudgetPrice(player).toFixed(1)}m</td><td className="px-3 py-2.5"><span className="rounded bg-emerald-400/10 px-2 py-1 font-bold text-emerald-300">{getProjectedPoints(player).toFixed(1)}</span></td><td className="px-4 py-2.5 text-right font-black text-white">{getProjectedPoints(player).toFixed(1)}</td></tr>)}</tbody></table></div><div className="border-t border-emerald-950 p-3 text-[10px] text-slate-500">Prognoze ir orientējošs aprēķins no pieejamās formas un statistikas, nevis garantēts rezultāts.</div></section>

          <section className={FLOW.panel}><div className="flex flex-wrap items-start justify-between gap-3 border-b border-emerald-950/90 px-4 py-3"><div className="min-w-0"><h3 className="text-sm font-black text-white">Player Comparison</h3><p className="mt-1 text-[10px] leading-4 text-slate-400">Salīdzini līdz četriem spēlētājiem vienā skatā.</p></div><label className="w-full sm:w-52 text-[9px] font-bold uppercase tracking-wide text-slate-400">Pozīcijas filtrs<select value={comparisonPosition} onChange={event => { const nextPosition = event.target.value; setComparisonPosition(nextPosition); setComparisonIds(current => current.filter(id => { const player = players.find(item => playerKey(item) === id); return player && (nextPosition === "ALL" || normalizePosition(player) === nextPosition); })); }} className={`${FLOW.input} mt-1 block w-full`}><option value="ALL">Visas pozīcijas</option>{comparisonPositions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="grid gap-3 p-4 lg:grid-cols-[0.9fr_1.1fr]"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">{[0, 1, 2, 3].map(slot => <PlayerComparisonPicker key={slot} slot={slot} players={players} selectedPlayer={players.find(player => playerKey(player) === (comparisonIds[slot] || ""))} selectedIds={comparisonIds} standings={standings} positionFilter={comparisonPosition} onSelect={setComparePlayer}/>)}</div><div className="min-w-0"><RadarComparison players={comparisonPlayers}/><div className="flex flex-wrap justify-center gap-2 pt-1">{comparisonPlayers.map((player, index) => <span key={playerKey(player)} style={{ color: COMPARISON_COLORS[index % COMPARISON_COLORS.length], borderColor: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }} className="rounded-full border bg-[#04150F] px-2 py-1 text-[9px]">● {player.name}</span>)}</div></div></div><div className="overflow-x-auto border-t border-emerald-950"><table className="w-full min-w-[400px] text-left text-[10px]"><thead className="text-slate-500"><tr><th className="px-4 py-2">Statistika</th>{comparisonPlayers.map(player => <th key={playerKey(player)} className="px-3 py-2">{player.name}</th>)}</tr></thead><tbody>{getComparisonMetrics(comparisonPlayers).map(([label, read]) => <tr key={label} className="border-t border-emerald-950/70"><td className="px-4 py-2 text-slate-400">{label}</td>{comparisonPlayers.map(player => <td key={playerKey(player)} className="px-3 py-2 font-bold text-slate-200">{read(player)}</td>)}</tr>)}</tbody></table></div></section>
        </div>

        <div className="grid gap-3 xl:grid-cols-2">
          <section className={`${FLOW.panel} xl:col-span-1`}><PanelHeading title="Fixture Analysis" subtitle="Pieejamās nākamās spēles un pretinieki."/><div className="flex gap-2 px-4 pt-3"><button type="button" onClick={() => setFixtureView("teams")} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${fixtureView === "teams" ? "bg-emerald-500 text-[#04150F]" : "text-slate-400 hover:bg-emerald-950"}`}>Komandas</button><button type="button" onClick={() => setFixtureView("fixtures")} className={`rounded-lg px-3 py-1.5 text-[10px] font-bold ${fixtureView === "fixtures" ? "bg-emerald-500 text-[#04150F]" : "text-slate-400 hover:bg-emerald-950"}`}>Spēles</button></div><div className="max-h-[520px] overflow-y-auto overscroll-contain p-3 pr-2 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">{contextLoading ? <p className="p-5 text-center text-xs text-slate-500">Ielādē spēles…</p> : fixtureView === "fixtures" ? (upcomingFixtures.length ? upcomingFixtures.map((fixture, index) => { const teams = getFixtureTeams(fixture); return <div key={fixture.id || `${teamName(teams.home)}-${teamName(teams.away)}-${index}`} className="flex items-center justify-between gap-2 border-b border-emerald-950/70 py-2.5 last:border-0"><div className="min-w-0"><p className="truncate text-[10px] font-bold text-white">{teamName(teams.home)} <span className="text-emerald-400">vs</span> {teamName(teams.away)}</p><p className="mt-1 text-[9px] text-slate-500">{fixtureDate(fixture)}</p></div><span className="shrink-0 rounded bg-emerald-400/10 px-2 py-1 text-[9px] text-emerald-300">{fixture.status?.short || fixture.status || "Plānota"}</span></div>; }) : <p className="p-5 text-center text-xs text-slate-500">Šai sezonai nav pieejamu nākamo spēļu.</p>) : fixtureTeamRows.map(team => <div key={team.id} className="border-b border-emerald-950/70 py-2.5 last:border-0"><div className="mb-1 flex items-center gap-2">{team.crest ? <img src={team.crest} alt="" className="h-5 w-5 object-contain"/> : <span className="h-5 w-5 rounded bg-emerald-950"/>}<span className="text-[10px] font-bold text-white">{team.name}</span></div>{team.matches.length ? <div className="flex flex-wrap gap-1">{team.matches.map((fixture, index) => { const teams = getFixtureTeams(fixture); const home = String(teams.home?.name || "").toLowerCase() === team.name.toLowerCase(); return <span key={fixture.id || index} className="rounded bg-emerald-400/10 px-1.5 py-1 text-[8px] text-emerald-200">{home ? "H" : "A"} · {home ? teamName(teams.away) : teamName(teams.home)}</span>; })}</div> : <p className="text-[9px] text-slate-500">Nav pieejama nākamā spēle</p>}</div>)}</div></section>

          <section className={`${FLOW.panel} xl:col-span-1`}><PanelHeading title="Custom Player Ranking" subtitle="Pielāgo svarus un pārkārto spēlētājus pēc saviem kritērijiem." action="Pilns reitings" onAction={() => goTo("ranking")}/><div className="space-y-3 p-4">{metricWeights.map(metric => <label key={metric.key} className="grid grid-cols-[82px_1fr_36px] items-center gap-2"><span className="text-[10px] text-slate-300">{metric.label}</span><input type="range" min="0" max="100" value={rankingWeights[metric.key]} onChange={event => setRankingWeights(current => ({ ...current, [metric.key]: Number(event.target.value) }))} className="w-full accent-emerald-400"/><span className="text-right text-[10px] font-bold text-emerald-300">{rankingWeights[metric.key]}%</span></label>)}<p className="text-[9px] text-slate-500">Svari tiek normalizēti aprēķinā; tiem nav obligāti jāsummējas līdz 100%.</p><div className="border-t border-emerald-950 pt-2"><div className="max-h-[440px] overflow-y-auto pr-1">{ranking.slice(0, 20).map((item, index) => <div key={playerKey(item.player)} className="flex items-center gap-2 border-b border-emerald-950/60 py-2 last:border-0"><span className="w-3 text-[10px] text-slate-500">{index + 1}</span><PlayerAvatar player={item.player} standings size="h-7 w-7"/><div className="min-w-0 flex-1"><p className="truncate text-[10px] font-bold text-white">{item.player.name}</p><p className="truncate text-[9px] text-slate-500">{item.player.team || "—"}</p></div><span className="text-xs font-black text-emerald-300">{item.score.toFixed(1)}</span></div>)}</div></div></div></section>

          
        </div>
      </> : <div className={`${FLOW.panel} overflow-hidden`}>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-950 p-4"><div><p className="text-[10px] font-bold uppercase tracking-widest text-emerald-300">Analytics workspace</p><h3 className="mt-1 text-lg font-black text-white">{tools.find(tool => tool.id === activeTool)?.title || "Analytics Tool"}</h3></div><button type="button" onClick={backToOverview} className={FLOW.button}>← Atpakaļ uz pārskatu</button></div>
        <div className="p-4 md:p-6">{activeTool === "recommendations" && <RecommendationTool players={filteredPlayers} fixtures={fixtures} standings={standings} competition={competition} season={season}/ >}{activeTool === "ranking" && <RankingTool players={filteredPlayers} competition={competition} season={season} fixtures={fixtures} standings={standings}/ >}{activeTool === "fantasy" && <FantasyBuilder players={players} competition={competition} season={season} fixtures={fixtures} standings={standings} contextLoading={contextLoading}/ >}{activeTool === "comparison" && <div className="space-y-5"><div className="flex justify-end"><label className="w-full sm:w-60 text-[10px] font-bold uppercase tracking-wide text-slate-400">Pozīcijas filtrs<select value={comparisonPosition} onChange={event => { const nextPosition = event.target.value; setComparisonPosition(nextPosition); setComparisonIds(current => current.filter(id => { const player = players.find(item => playerKey(item) === id); return player && (nextPosition === "ALL" || normalizePosition(player) === nextPosition); })); }} className={`${FLOW.input} mt-1 block w-full`}><option value="ALL">Visas pozīcijas</option>{comparisonPositions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map(slot => <PlayerComparisonPicker key={slot} slot={slot} players={players} selectedPlayer={players.find(player => playerKey(player) === (comparisonIds[slot] || ""))} selectedIds={comparisonIds} standings={standings} positionFilter={comparisonPosition} onSelect={setComparePlayer}/>)}</div><div className="grid gap-4 lg:grid-cols-2"><div className={FLOW.mutedPanel + " p-3"}><RadarComparison players={comparisonPlayers}/><div className="flex flex-wrap justify-center gap-3">{comparisonPlayers.map((player, index) => <span key={playerKey(player)} style={{ color: COMPARISON_COLORS[index % COMPARISON_COLORS.length] }} className="text-[10px]">● {player.name}</span>)}</div></div><div className={FLOW.mutedPanel + " overflow-x-auto"}><table className="w-full min-w-[400px] text-left text-xs"><thead><tr className="border-b border-emerald-900 text-slate-400"><th className="p-3">Statistika</th>{comparisonPlayers.map(player => <th key={playerKey(player)} className="p-3">{player.name}</th>)}</tr></thead><tbody>{getComparisonMetrics(comparisonPlayers).map(([label, read]) => <tr key={label} className="border-b border-emerald-950/70"><td className="p-3 text-slate-400">{label}</td>{comparisonPlayers.map(player => <td key={playerKey(player)} className="p-3 font-bold text-white">{read(player)}</td>)}</tr>)}</tbody></table></div></div></div>}</div>
      </div>}
    </>}
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-emerald-950/70 pt-3 text-[9px] text-slate-500"><span>Flow Football Analytics · {leagueName} · {season}/{Number(season) + 1}</span><span>Prognozes un pielāgotie reitingi ir analītiski aprēķini, nevis garantēti rezultāti.</span></footer>
  </section>;
}

export default FootballAnalyticsTools;