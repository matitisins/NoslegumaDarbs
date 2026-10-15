import React, { useEffect, useMemo, useState } from "react";
import LeagueLogo from "./components/LeagueLogo";

import {
  fetchTeams,
  fetchTeamStatistics,
  fetchHeadToHead,
} from "./services/apiSports";

function formatNumber(value, suffix = "") {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return "—";
  return `${Number(value).toLocaleString("lv-LV", { maximumFractionDigits: 1 })}${suffix}`;
}

function readTotal(data, paths) {
  for (const path of paths) {
    let value = data;
    for (const key of path.split(".")) value = value?.[key];
    const total = getStatTotal(value);
    if (total !== null) return total;
  }
  return null;
}

function teamSummary(data) {
  if (!data) return null;
  const played = readTotal(data, ["fixtures.played", "fixtures.played.total"]);
  const wins = readTotal(data, ["fixtures.wins"]);
  const draws = readTotal(data, ["fixtures.draws"]);
  const losses = readTotal(data, ["fixtures.loses", "fixtures.losses"]);
  const goals = readTotal(data, ["goals.for.total"]);
  const conceded = readTotal(data, ["goals.against.total"]);
  const clean = readTotal(data, ["clean_sheet"]);
  const failed = readTotal(data, ["failed_to_score"]);
  const goalDifference = goals !== null && conceded !== null ? goals - conceded : null;
  const winRate = played > 0 && wins !== null ? Math.round(wins / played * 100) : null;
  const goalsPerMatch = played > 0 && goals !== null ? goals / played : null;
  const concededPerMatch = played > 0 && conceded !== null ? conceded / played : null;
  const cleanRate = played > 0 && clean !== null ? Math.round(clean / played * 100) : null;
  const form = typeof data.form === "string" ? data.form.toUpperCase().split("").filter(x => ["W", "D", "L"].includes(x)).slice(-5) : [];
  return { played, wins, draws, losses, goals, conceded, clean, failed, goalDifference, winRate, goalsPerMatch, concededPerMatch, cleanRate, form };
}

function TeamSelect({ label, value, teams, onChange, disabledTeamId = null, accent = "green" }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = React.useRef(null);
  const selected = teams.find(team => Number(team.id) === Number(value));
  const isPurple = accent === "purple";
  const accentText = isPurple ? "text-violet-300" : "text-emerald-300";
  const borderAccent = isPurple ? "focus:border-violet-400" : "focus:border-emerald-400";
  const filtered = teams.filter(team => `${team.name || ""} ${team.code || ""}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const onPointerDown = event => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const onKeyDown = event => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("pointerdown", onPointerDown); document.removeEventListener("keydown", onKeyDown); };
  }, []);

  return <div ref={rootRef} className={`relative rounded-2xl border ${isPurple ? "border-violet-400/30" : "border-emerald-400/25"} bg-[#0B2119] p-4 shadow-[0_12px_32px_rgba(0,0,0,.12)]`}>
    <div className="mb-3 flex items-center justify-between gap-2"><label className={`text-[10px] font-black uppercase tracking-[.18em] ${accentText}`}>{label}</label><span className={`h-2.5 w-2.5 rounded-full ${isPurple ? "bg-violet-400" : "bg-emerald-400"}`} /></div>
    <button type="button" aria-expanded={open} onClick={() => { setOpen(v => !v); setQuery(""); }} className={`flex w-full items-center gap-3 rounded-xl border border-white/10 bg-[#06150F] px-4 py-3 text-left transition hover:border-white/25 ${borderAccent}`}>
      {selected?.logo ? <img src={selected.logo} alt="" className="h-8 w-8 rounded-lg bg-white object-contain p-1" /> : <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${isPurple ? "bg-violet-400/10 text-violet-300" : "bg-emerald-400/10 text-emerald-300"}`}>⚽</span>}
      <span className="min-w-0 flex-1 truncate text-sm font-extrabold text-white">{selected?.name || "Izvēlies komandu..."}</span><span className="text-slate-400">{open ? "⌃" : "⌄"}</span>
    </button>
    {open && <div className="absolute left-3 right-3 top-[calc(100%-2px)] z-50 overflow-hidden rounded-xl border border-emerald-400/30 bg-[#071A12] shadow-[0_24px_60px_rgba(0,0,0,.6)]">
      <div className="border-b border-white/10 p-3"><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="Meklēt komandu..." className="w-full rounded-lg border border-white/10 bg-[#10291F] px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-emerald-400" /><p className="mt-2 text-[10px] text-slate-500">{filtered.length} komandas</p></div>
      <div className="max-h-64 overflow-y-auto p-1.5">{filtered.map(team => { const disabled = disabledTeamId != null && Number(team.id) === Number(disabledTeamId); return <button key={team.id} type="button" disabled={disabled} onClick={() => { onChange(Number(team.id)); setOpen(false); setQuery(""); }} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${Number(team.id) === Number(value) ? "bg-emerald-400/10 text-emerald-300" : "text-slate-200 hover:bg-white/5"} ${disabled ? "cursor-not-allowed opacity-30" : ""}`}>
        {team.logo ? <img src={team.logo} alt="" className="h-7 w-7 rounded-md bg-white object-contain p-1" /> : <span className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-[10px]">⚽</span>}<span className="min-w-0 flex-1 truncate text-sm font-semibold">{team.name}</span><span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{disabled ? "Izvēlēta" : team.code || "Komanda"}</span>
      </button>; })}{filtered.length === 0 && <p className="px-3 py-6 text-center text-xs text-slate-500">Komanda nav atrasta.</p>}</div>
    </div>}
    <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-slate-500"><span className="truncate">Izvēlēta: {selected?.name || "nav izvēlēta"}</span><span>{teams.length} komandas</span></div>
  </div>;
}

function TeamHeader({ team, summary, accent = "green", index = "01" }) {
  if (!team) return <div className="flex h-full min-h-28 items-center justify-center text-sm text-slate-500">Izvēlies komandu</div>;
  const purple = accent === "purple";
  return <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A2118] p-4 before:absolute before:inset-x-0 before:top-0 before:h-1 ${purple ? "before:bg-violet-400" : "before:bg-emerald-400"}`}>
    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[.16em] text-slate-500"><span>{purple ? "Away side" : "Home side"}</span><span>Team {index}</span></div>
    <div className="mt-4 flex items-center gap-3">{team.logo ? <img src={team.logo} alt="" className="h-14 w-14 rounded-xl border border-white/10 bg-white object-contain p-2" /> : <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5 text-lg font-black text-white">{team.name.slice(0,2).toUpperCase()}</div>}
      <div className="min-w-0 flex-1"><h3 className="truncate text-xl font-black text-white">{team.name}</h3><p className={`mt-1 text-xs font-bold ${purple ? "text-violet-300" : "text-emerald-300"}`}>{team.code || "Team analytics"}</p></div>
      <span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[10px] font-black text-slate-400">{index}</span>
    </div>
    <div className="mt-4 grid grid-cols-4 gap-2">{[{label:"Spēles",value:summary?.played},{label:"Uzvaras",value:summary?.wins},{label:"Neizšķirti",value:summary?.draws},{label:"Zaudējumi",value:summary?.losses}].map((m,i)=><div key={m.label} className="rounded-xl border border-white/[.07] bg-white/[.025] p-2.5"><p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{m.label}</p><p className={`mt-1 text-xl font-black ${i===1 ? (purple?"text-violet-300":"text-emerald-300") : "text-white"}`}>{formatNumber(m.value)}</p></div>)}</div>
    <div className="mt-3 grid grid-cols-4 gap-2">{[{label:"Gūtie vārti",value:summary?.goals},{label:"Ielaistie",value:summary?.conceded},{label:"Vārtu starpība",value:summary?.goalDifference > 0 ? `+${summary.goalDifference}` : summary?.goalDifference},{label:"Uzvaru %",value:summary?.winRate,suffix:"%"}].map(m=><div key={m.label} className="rounded-xl bg-[#071810] p-2.5"><p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{m.label}</p><p className="mt-1 text-sm font-extrabold text-white">{m.label === "Vārtu starpība" && m.value !== null && m.value !== undefined ? m.value : formatNumber(m.value, m.suffix || "")}</p></div>)}</div>
    <div className="mt-4 flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-wider text-slate-500">Sezonas forma</span><div className="flex gap-1">{(summary?.form?.length ? summary.form : []).map((letter,i)=><span key={`${letter}-${i}`} title={letter === "W" ? "Uzvara" : letter === "D" ? "Neizšķirts" : "Zaudējums"} className={`flex h-7 w-7 items-center justify-center rounded-md text-[10px] font-black text-white ${letter === "W" ? "bg-emerald-500" : letter === "D" ? "bg-slate-500" : "bg-rose-500"}`}>{letter}</span>)}{!summary?.form?.length && <span className="text-[10px] text-slate-600">Forma nav pieejama API</span>}</div></div>
  </div>;
}

function RadarCompare({ first, second, team1, team2 }) {
  const axes = [
    { label: "Gūtie vārti", key: "goals", higher: true },
    { label: "Uzvaras", key: "wins", higher: true },
    { label: "Tīras lapas", key: "clean", higher: true },
    { label: "Vārtu starpība", key: "goalDifference", higher: true },
    { label: "Uzvaru %", key: "winRate", higher: true },
    { label: "Ielaistie vārti", key: "conceded", higher: false },
  ];
  const raw = axes.map(a => [first?.[a.key], second?.[a.key]].map(v => v == null ? 0 : Number(v)));
  const maxes = axes.map((a,i) => Math.max(1, ...raw[i].map(v => Math.max(0,v))));
  const points = (which) => axes.map((a,i) => { let v = raw[i][which]; if (a.key === "conceded") v = maxes[i] - v; else v = Math.max(0,v); const radius = 28 + (Math.max(0,Math.min(1, v / maxes[i])) * 82); const angle = (-Math.PI/2) + i * (Math.PI*2/axes.length); return `${140 + Math.cos(angle)*radius},${105 + Math.sin(angle)*radius}`; }).join(" ");
  const ring = (scale) => axes.map((_,i) => { const a=(-Math.PI/2)+i*(Math.PI*2/axes.length); return `${140+Math.cos(a)*scale},${105+Math.sin(a)*scale}`; }).join(" ");
  return <div className="rounded-2xl border border-emerald-400/15 bg-[#071A12] p-4"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Team radar comparison</p><p className="mt-1 text-[10px] text-slate-500">Normalizēti sezonas rādītāji</p></div><div className="flex gap-3 text-[10px]"><span className="flex items-center gap-1.5 text-slate-300"><i className="h-2 w-2 rounded-full bg-emerald-400" />{team1?.name || "Komanda 1"}</span><span className="flex items-center gap-1.5 text-slate-300"><i className="h-2 w-2 rounded-full bg-violet-400" />{team2?.name || "Komanda 2"}</span></div></div>
    <svg viewBox="0 0 280 230" className="mx-auto block w-full max-w-[390px]" role="img" aria-label="Komandu sezonas rādītāju radara diagramma">{[25,45,65,85].map(r=><polygon key={r} points={ring(r)} fill="none" stroke="rgba(148,163,184,.17)" strokeWidth="1"/>)}{axes.map((a,i)=>{const ang=(-Math.PI/2)+i*(Math.PI*2/axes.length);return <g key={a.key}><line x1="140" y1="105" x2={140+Math.cos(ang)*90} y2={105+Math.sin(ang)*90} stroke="rgba(148,163,184,.17)"/><text x={140+Math.cos(ang)*104} y={105+Math.sin(ang)*104} textAnchor={Math.cos(ang)>.25?"start":Math.cos(ang)<-.25?"end":"middle"} dominantBaseline="middle" fontSize="7.5" fill="#A9C0B5">{a.label}</text></g>})}<polygon points={points(0)} fill="rgba(57,229,140,.18)" stroke="#39E58C" strokeWidth="2.2"/><polygon points={points(1)} fill="rgba(167,139,250,.15)" stroke="#A78BFA" strokeWidth="2.2"/>{[0,1].map(which=>axes.map((a,i)=>{const p=points(which).split(" ")[i].split(",");return <circle key={`${which}-${a.key}`} cx={p[0]} cy={p[1]} r="3" fill={which===0?"#39E58C":"#A78BFA"} stroke="#071A12" strokeWidth="1.5"/>}))}</svg>
  </div>;
}

function MetricCompare({ first, second }) {
  const metrics = [
    {label:"Gūtie vārti",key:"goals",higher:true},
    {label:"Ielaistie vārti",key:"conceded",higher:false},
    {label:"Uzvaras",key:"wins",higher:true},
    {label:"Tīras lapas",key:"clean",higher:true},
    {label:"Bez gūtiem vārtiem",key:"failed",higher:false},
    {label:"Vārti spēlē",key:"goalsPerMatch",higher:true},
    {label:"Uzvaru īpatsvars",key:"winRate",higher:true},
  ];
  return <div className="rounded-2xl border border-emerald-400/15 bg-[#0A2118] p-4 sm:p-5"><div className="mb-4"><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Key statistics comparison</p><h3 className="mt-1 text-lg font-black text-white">Svarīgākie rādītāji</h3></div><div className="space-y-4">{metrics.map(m=>{const a=first?.[m.key], b=second?.[m.key]; const av=a==null?null:Number(a), bv=b==null?null:Number(b); const max=Math.max(1,av||0,bv||0); const aBetter=av!=null&&bv!=null&&(m.higher?av>bv:av<bv); const bBetter=av!=null&&bv!=null&&(m.higher?bv>av:bv<av); return <div key={m.key} className="grid grid-cols-[36px_minmax(0,1fr)_110px_minmax(0,1fr)_36px] items-center gap-2"><span className={`text-right text-xs font-black ${aBetter?"text-emerald-300":"text-white"}`}>{formatNumber(av, m.key==="winRate"?"%":"")}</span><div className="flex justify-end"><div className="h-2 w-full max-w-[190px] overflow-hidden rounded-full bg-white/[.06]"><div className={`ml-auto h-full rounded-full ${aBetter?"bg-emerald-400":"bg-emerald-400/65"}`} style={{width:`${av==null?0:Math.max(4,av/max*100)}%`}}/></div></div><span className="text-center text-[9px] font-bold text-slate-400 sm:text-[10px]">{m.label}</span><div className="h-2 w-full max-w-[190px] overflow-hidden rounded-full bg-white/[.06]"><div className={`h-full rounded-full ${bBetter?"bg-violet-400":"bg-violet-400/65"}`} style={{width:`${bv==null?0:Math.max(4,bv/max*100)}%`}}/></div><span className={`text-xs font-black ${bBetter?"text-violet-300":"text-white"}`}>{formatNumber(bv, m.key==="winRate"?"%":"")}</span></div>;})}</div></div>;
}

function MiniStatPanel({ title, first, second, keys }) {
  return <div className="rounded-2xl border border-emerald-400/15 bg-[#0A2118] p-4"><h3 className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-300">{title}</h3><div className="mt-4 space-y-3">{keys.map(k=>{const a=first?.[k.key], b=second?.[k.key], max=Math.max(1,Number(a)||0,Number(b)||0);return <div key={k.key}><div className="mb-1.5 flex justify-between gap-2 text-[10px]"><span className="font-bold text-white">{formatNumber(a,k.suffix||"")}</span><span className="text-slate-400">{k.label}</span><span className="font-bold text-white">{formatNumber(b,k.suffix||"")}</span></div><div className="flex gap-1"><div className="flex-1 overflow-hidden rounded-full bg-white/[.06]"><div className="ml-auto h-1.5 rounded-full bg-emerald-400" style={{width:`${a==null?0:Math.max(3,Number(a)/max*100)}%`}}/></div><div className="flex-1 overflow-hidden rounded-full bg-white/[.06]"><div className="h-1.5 rounded-full bg-violet-400" style={{width:`${b==null?0:Math.max(3,Number(b)/max*100)}%`}}/></div></div></div>})}</div></div>;
}

/*
 * API-Football statistikā dažādi rādītāji
 * var būt objekti ar home, away un total.
 *
 * Piemērs:
 *
 * {
 *   home: 3,
 *   away: 2,
 *   total: 5
 * }
 *
 * Ja total nav pieejams, tiek izmantots
 * home + away.
 */
function getStatTotal(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    if (!value.trim()) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  if (
    typeof value !== "object"
  ) {
    return null;
  }

  if (
    value.total !== null &&
    value.total !== undefined &&
    value.total !== ""
  ) {
    const total = Number(
      value.total
    );

    if (
      Number.isFinite(total)
    ) {
      return total;
    }
  }

  const home = Number(
    value.home
  );

  const away = Number(
    value.away
  );

  const hasHome =
    Number.isFinite(home);

  const hasAway =
    Number.isFinite(away);

  if (
    hasHome &&
    hasAway
  ) {
    return home + away;
  }

  if (hasHome) {
    return home;
  }

  if (hasAway) {
    return away;
  }

  return null;
}

function getAverageValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  if (
    typeof value === "object"
  ) {
    if (
      value.total !== null &&
      value.total !== undefined
    ) {
      const total = Number(
        value.total
      );

      return Number.isFinite(total)
        ? total
        : null;
    }

    if (
      value.home !== null &&
      value.home !== undefined
    ) {
      const home = Number(
        value.home
      );

      if (
        Number.isFinite(home)
      ) {
        return home;
      }
    }
  }

  return null;
}

function h2hResult(
  match,
  teamId
) {
  const homeId =
    Number(
      match?.teams?.home?.id
    );

  const awayId =
    Number(
      match?.teams?.away?.id
    );

  const homeGoals =
    Number(
      match?.goals?.home
    );

  const awayGoals =
    Number(
      match?.goals?.away
    );

  if (
    !Number.isFinite(homeGoals) ||
    !Number.isFinite(awayGoals)
  ) {
    return "—";
  }

  const selectedTeam =
    Number(teamId);

  const teamWon =
    (
      homeId === selectedTeam &&
      homeGoals > awayGoals
    ) ||
    (
      awayId === selectedTeam &&
      awayGoals > homeGoals
    );

  const draw =
    homeGoals === awayGoals;

  if (draw) {
    return "Neizšķirts";
  }

  return teamWon
    ? "Uzvara"
    : "Zaudējums";
}

const TEAM_COMPETITION_NAMES = {
  PL: "Premier League",
  PD: "La Liga",
  SA: "Serie A",
  BL1: "Bundesliga",
  FL1: "Ligue 1",
  UCL: "UEFA Champions League",
  UEL: "UEFA Europa League",
  UECL: "UEFA Conference League",
  USC: "UEFA Super Cup",
};

export default function TeamPage({ competition, season, leagueName }) {
  const normalizedCompetition = String(competition || "PL").trim().toUpperCase();
  const displayedLeagueName = TEAM_COMPETITION_NAMES[normalizedCompetition] || leagueName || normalizedCompetition;
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState(null);
  const [team2Id, setTeam2Id] = useState(null);
  const [stats1, setStats1] = useState(null);
  const [stats2, setStats2] = useState(null);
  const [h2h, setH2h] = useState([]);
  const [loading, setLoading] = useState(false);
  const [h2hLoading, setH2hLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const team1 = useMemo(() => teams.find(team => Number(team.id) === Number(team1Id)) || null, [teams, team1Id]);
  const team2 = useMemo(() => teams.find(team => Number(team.id) === Number(team2Id)) || null, [teams, team2Id]);
  const summary1 = useMemo(() => teamSummary(stats1), [stats1]);
  const summary2 = useMemo(() => teamSummary(stats2), [stats2]);
  const h2hRecord = useMemo(() => {
    let first = 0, draw = 0, second = 0;
    h2h.forEach(match => {
      const homeId = Number(match?.teams?.home?.id), awayId = Number(match?.teams?.away?.id);
      const hg = Number(match?.goals?.home), ag = Number(match?.goals?.away);
      if (!Number.isFinite(hg) || !Number.isFinite(ag)) return;
      if (hg === ag) draw++;
      else if ((homeId === Number(team1Id) && hg > ag) || (awayId === Number(team1Id) && ag > hg)) first++;
      else if ((homeId === Number(team2Id) && hg > ag) || (awayId === Number(team2Id) && ag > hg)) second++;
    });
    return { first, draw, second };
  }, [h2h, team1Id, team2Id]);

  useEffect(() => {
    let cancelled = false;
    const loadTeams = async () => {
      setLoading(true); setError(""); setStats1(null); setStats2(null); setH2h([]);
      try {
        const data = await fetchTeams(normalizedCompetition, season);
        if (cancelled) return;
        const availableTeams = Array.isArray(data) ? data.filter(team => Number.isInteger(Number(team?.id)) && Number(team.id) > 0).filter((team,index,list)=>list.findIndex(item=>Number(item.id)===Number(team.id))===index) : [];
        setTeams(availableTeams);
        if (!availableTeams.length) setError(`API-Football pašlaik neatgrieza komandas līgai ${displayedLeagueName}, sezonai ${season}. Pārbaudi API plāna piekļuvi šai sezonai un mēģini vēlreiz.`);
        setTeam1Id(availableTeams[0]?.id || null); setTeam2Id(availableTeams[1]?.id || null);
      } catch(err) { if(!cancelled){setTeams([]);setError(err?.message || "Neizdevās ielādēt komandas.");} }
      finally { if(!cancelled)setLoading(false); }
    };
    setTeams([]);
    setTeam1Id(null);
    setTeam2Id(null);
    loadTeams(); return () => { cancelled = true; };
  }, [normalizedCompetition, season]);

  useEffect(() => {
    let cancelled = false;
    const loadStats = async () => {
      if (!team1Id && !team2Id) return;
      setStats1(null); setStats2(null);
      try {
        const [first, second] = await Promise.all([team1Id ? fetchTeamStatistics(team1Id, normalizedCompetition, season) : Promise.resolve(null), team2Id ? fetchTeamStatistics(team2Id, normalizedCompetition, season) : Promise.resolve(null)]);
        if (!cancelled) { setStats1(first); setStats2(second); }
      } catch(err) { if(!cancelled)setError(err?.message || "Neizdevās ielādēt komandu statistiku."); }
    };
    loadStats(); return () => { cancelled = true; };
  }, [team1Id, team2Id, normalizedCompetition, season]);

  useEffect(() => {
    let cancelled = false;
    const loadH2H = async () => {
      if (!team1Id || !team2Id || Number(team1Id) === Number(team2Id)) { setH2h([]); return; }
      setH2hLoading(true);
      try { const matches = await fetchHeadToHead(team1Id, team2Id, 5); if(!cancelled)setH2h(Array.isArray(matches)?matches:[]); }
      catch(err) { if(!cancelled){setH2h([]);setError(err?.message || "Neizdevās ielādēt H2H datus.");} }
      finally { if(!cancelled)setH2hLoading(false); }
    };
    loadH2H(); return () => { cancelled = true; };
  }, [team1Id, team2Id]);

  const tabs = [{id:"overview",label:"Team comparison"},{id:"h2h",label:"H2H History"},{id:"form",label:"Form & Stats"}];
  return <section className="space-y-4 text-white">
    <div className="relative overflow-hidden rounded-[28px] border border-emerald-400/20 bg-[radial-gradient(ellipse_at_85%_25%,rgba(16,185,129,.16),transparent_36%),linear-gradient(115deg,#061810,#09251A_62%,#04150F)] p-5 shadow-[0_24px_65px_rgba(2,18,11,.18)] sm:p-7">
      <div className="absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-400/5 blur-3xl" />
      <div className="relative flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between"><div className="max-w-2xl"><span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[.07] px-3 py-1.5 text-[9px] font-black uppercase tracking-[.2em] text-emerald-300"><i className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_#39E58C]"/> Flow Team Lab</span><h1 className="mt-4 text-3xl font-black tracking-tight text-white sm:text-4xl">Team comparison <span className="text-emerald-300">/ H2H</span></h1><p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">Salīdzini {displayedLeagueName || "līgas"} komandas, sezonas rādītājus, formu un savstarpējo spēļu vēsturi.</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><div className="rounded-xl border border-emerald-400/20 bg-black/20 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Competition</p><div className="mt-1 flex items-center gap-2"><LeagueLogo competition={competition} size={28} className="rounded-md"/><p className="text-sm font-extrabold text-white">{displayedLeagueName || "Līga"}</p></div></div><div className="rounded-xl border border-emerald-400/20 bg-black/20 px-4 py-3"><p className="text-[9px] font-bold uppercase tracking-[.16em] text-slate-500">Season</p><p className="mt-1 text-sm font-extrabold text-white">{season || "—"}{String(season || "").length===4 ? `/${Number(season)+1}` : ""}</p></div></div></div>
      <div className="relative mt-6 flex flex-wrap gap-2 border-t border-white/[.08] pt-4">{tabs.map(tab=><button key={tab.id} type="button" onClick={()=>setActiveTab(tab.id)} className={`rounded-lg px-4 py-2.5 text-[10px] font-black transition ${activeTab===tab.id?"bg-emerald-400 text-[#062015] shadow-[0_4px_18px_rgba(57,229,140,.18)]":"border border-white/10 bg-white/[.025] text-slate-400 hover:border-emerald-400/30 hover:text-white"}`}>{tab.label}</button>)}</div>
    </div>

    {error && <div className="rounded-xl border border-rose-400/25 bg-rose-400/[.08] p-4"><p className="text-xs font-black uppercase tracking-wider text-rose-300">API kļūda</p><p className="mt-1 text-sm text-rose-100/80">{error}</p></div>}
    <div className="grid gap-3 lg:grid-cols-[1fr_44px_1fr] lg:items-center"><TeamSelect label="01 · Pirmā komanda" value={team1Id} teams={teams} onChange={setTeam1Id} disabledTeamId={team2Id} accent="green"/><div className="hidden h-11 w-11 items-center justify-center rounded-full border border-emerald-400/20 bg-[#0A2118] text-xs font-black text-emerald-300 lg:flex">VS</div><TeamSelect label="02 · Otrā komanda" value={team2Id} teams={teams} onChange={setTeam2Id} disabledTeamId={team1Id} accent="purple"/></div>

    {loading ? <div className="rounded-2xl border border-emerald-400/15 bg-[#0A2118] p-14 text-center"><div className="mx-auto h-9 w-9 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400"/><p className="mt-4 text-sm font-semibold text-slate-400">Ielādē komandas...</p></div> : <>
      <div className="grid gap-3 xl:grid-cols-[1fr_0.94fr_1fr]">
        <TeamHeader team={team1} summary={summary1} accent="green" index="01"/>
        <RadarCompare first={summary1} second={summary2} team1={team1} team2={team2}/>
        <TeamHeader team={team2} summary={summary2} accent="purple" index="02"/>
      </div>

      {(activeTab === "overview" || activeTab === "form") && <div className="grid gap-3 xl:grid-cols-[1fr_1fr]"><MetricCompare first={summary1} second={summary2}/><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><MiniStatPanel title="Attacking stats" first={summary1} second={summary2} keys={[{key:"goalsPerMatch",label:"Vārti spēlē"},{key:"goals",label:"Gūtie vārti"},{key:"failed",label:"Spēles bez vārtiem"}]}/><MiniStatPanel title="Defensive stats" first={summary1} second={summary2} keys={[{key:"concededPerMatch",label:"Ielaisti spēlē"},{key:"clean",label:"Tīras lapas"},{key:"cleanRate",label:"Tīro lapu %",suffix:"%"}]}/></div></div>}

      {(activeTab === "overview" || activeTab === "h2h") && <section className="rounded-2xl border border-emerald-400/15 bg-[#0A2118] p-4 sm:p-5"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Head-to-head</p><h2 className="mt-1 text-xl font-black text-white">Pēdējās savstarpējās spēles</h2><p className="mt-1 text-xs text-slate-500">Rezultāti no API atgrieztajiem mačiem</p></div><span className="rounded-full border border-white/10 bg-white/[.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-slate-400">Pēdējās 5</span></div>
        <div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-[#06170F] p-3 text-center"><p className="text-2xl font-black text-emerald-300">{h2hRecord.first}</p><p className="mt-1 truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{team1?.name || "1. komanda"} · uzvaras</p></div><div className="rounded-xl bg-[#06170F] p-3 text-center"><p className="text-2xl font-black text-slate-200">{h2hRecord.draw}</p><p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-500">Neizšķirti</p></div><div className="rounded-xl bg-[#06170F] p-3 text-center"><p className="text-2xl font-black text-violet-300">{h2hRecord.second}</p><p className="mt-1 truncate text-[9px] font-bold uppercase tracking-wider text-slate-500">{team2?.name || "2. komanda"} · uzvaras</p></div></div>
        {h2hLoading ? <div className="mt-4 rounded-xl bg-white/[.025] p-8 text-center text-xs text-slate-500">Ielādē H2H spēles...</div> : h2h.length===0 ? <div className="mt-4 rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-500">Šīm komandām nav pieejamu H2H datu.</div> : <div className="mt-4 space-y-2">{h2h.map((match,index)=>{const result=h2hResult(match,team1Id); const date=match?.fixture?.date ? new Date(match.fixture.date).toLocaleDateString("lv-LV",{day:"2-digit",month:"short",year:"numeric"}) : "Datums nav pieejams"; const team1Won=result==="Uzvara"; const draw=result==="Neizšķirts"; return <div key={match?.fixture?.id||index} className="grid grid-cols-[76px_minmax(0,1fr)_70px_minmax(0,1fr)] items-center gap-2 rounded-xl border border-white/[.06] bg-[#06170F]/70 px-3 py-3 sm:grid-cols-[100px_minmax(0,1fr)_76px_minmax(0,1fr)]"><span className="text-[9px] font-semibold text-slate-500">{date}</span><div className="flex min-w-0 items-center justify-end gap-2"> <span className="truncate text-right text-[10px] font-bold text-slate-200 sm:text-xs">{match?.teams?.home?.name||"—"}</span>{match?.teams?.home?.logo&&<img src={match.teams.home.logo} alt="" className="h-5 w-5 shrink-0 object-contain"/>}</div><div className="rounded-lg border border-white/10 bg-white/[.04] px-2 py-2 text-center text-xs font-black text-white">{match?.goals?.home??"—"} : {match?.goals?.away??"—"}</div><div className="flex min-w-0 items-center gap-2">{match?.teams?.away?.logo&&<img src={match.teams.away.logo} alt="" className="h-5 w-5 shrink-0 object-contain"/>}<span className="truncate text-[10px] font-bold text-slate-200 sm:text-xs">{match?.teams?.away?.name||"—"}</span><span className={`hidden rounded-md px-1.5 py-1 text-[8px] font-black uppercase sm:inline-flex ${draw?"bg-slate-500/15 text-slate-400":team1Won?"bg-emerald-400/10 text-emerald-300":"bg-violet-400/10 text-violet-300"}`}>{draw?"Draw":result}</span></div></div>})}</div>}
      </section>}
    </>}
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-2 text-[9px] text-slate-600"><span>FLOW TEAM LAB · Season {season || "—"}</span><span>Dati tiek rādīti tikai tad, ja tos nodrošina API-Football.</span></div>
  </section>;
}
