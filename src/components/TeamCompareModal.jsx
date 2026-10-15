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

const numberValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

function teamCrest(team) {
  return team?.team?.crest || team?.team?.logo || team?.team?.badge || null;
}

function fixtureTeams(fixture) {
  const home = fixture?.teams?.home ?? fixture?.homeTeam ?? {};
  const away = fixture?.teams?.away ?? fixture?.awayTeam ?? {};
  return {
    home: {
      id: home?.id ?? home?.teamId ?? home?.team?.id ?? null,
      name: home?.name ?? home?.team?.name ?? "Mājinieki",
      logo: home?.logo ?? home?.crest ?? home?.team?.crest ?? null,
    },
    away: {
      id: away?.id ?? away?.teamId ?? away?.team?.id ?? null,
      name: away?.name ?? away?.team?.name ?? "Viesi",
      logo: away?.logo ?? away?.crest ?? away?.team?.crest ?? null,
    },
  };
}

function fixtureScore(fixture) {
  const home = fixture?.goals?.home ?? fixture?.score?.fulltime?.home ?? fixture?.score?.fullTime?.home ?? fixture?.score?.fullTime?.homeTeam ?? fixture?.result?.home;
  const away = fixture?.goals?.away ?? fixture?.score?.fulltime?.away ?? fixture?.score?.fullTime?.away ?? fixture?.score?.fullTime?.awayTeam ?? fixture?.result?.away;
  if (home === null || home === undefined || away === null || away === undefined) return null;
  return `${home} – ${away}`;
}

function fixtureDate(fixture) {
  const raw = fixture?.fixture?.date || fixture?.utcDate || fixture?.date;
  if (!raw) return "—";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("lv-LV", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

function MiniCrest({ src, name, className = "h-7 w-7" }) {
  if (src) return <img src={src} alt="" className={`${className} shrink-0 object-contain`} />;
  return <span className={`${className} flex shrink-0 items-center justify-center rounded-lg border border-emerald-400/20 bg-emerald-400/10 text-[9px] font-black text-emerald-300`}>{(name || "FC").slice(0, 2).toUpperCase()}</span>;
}

function Panel({ title, eyebrow, children, className = "" }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-emerald-400/20 bg-[#071B14]/80 p-4 shadow-[0_12px_35px_rgba(0,0,0,0.12)] ${className}`}>
      {eyebrow && <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">{eyebrow}</p>}
      <h4 className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-white">{title}</h4>
      {children}
    </section>
  );
}

function MetricCard({ label, first, second, firstBetter, secondBetter }) {
  const a = numberValue(first);
  const b = numberValue(second);
  return (
    <div className="grid grid-cols-[minmax(44px,0.7fr)_minmax(100px,1.6fr)_minmax(44px,0.7fr)] items-center gap-2 border-b border-white/[0.07] py-2.5 last:border-b-0">
      <span className={`text-right text-sm font-black tabular-nums ${firstBetter ? "text-emerald-300" : "text-white"}`}>{valueOrDash(first)}</span>
      <div className="min-w-0">
        <p className="truncate text-center text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{label}</p>
        <div className="mt-1 flex h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <span className="rounded-full bg-emerald-400" style={{ width: `${a !== null && b !== null ? (a + b === 0 ? 0 : (a / (a + b)) * 100) : a !== null ? 100 : 0}%` }} />
          <span className="rounded-full bg-violet-400" style={{ width: `${a !== null && b !== null ? (a + b === 0 ? 0 : (b / (a + b)) * 100) : b !== null ? 100 : 0}%` }} />
        </div>
      </div>
      <span className={`text-sm font-black tabular-nums ${secondBetter ? "text-violet-300" : "text-white"}`}>{valueOrDash(second)}</span>
    </div>
  );
}

function RadarComparison({ first, second }) {
  const axes = [
    { label: "Uzbrukums", a: numberValue(getGoalsFor(first)), b: numberValue(getGoalsFor(second)) },
    { label: "Uzvaras", a: numberValue(getWins(first)), b: numberValue(getWins(second)) },
    { label: "Punkti", a: numberValue(first?.points ?? first?.flowPoints), b: numberValue(second?.points ?? second?.flowPoints) },
    { label: "Vārtu starpība", a: numberValue(getGoalDifference(first)), b: numberValue(getGoalDifference(second)) },
    { label: "Aizsardzība", a: numberValue(getGoalsAgainst(first)), b: numberValue(getGoalsAgainst(second)), inverse: true },
  ];
  const values = axes.flatMap((axis) => [axis.a, axis.b]).filter((v) => v !== null).map((v) => Math.max(0, v));
  const max = Math.max(1, ...values);
  const cx = 150, cy = 125, radius = 78;
  const pointFor = (index, value, inverse = false) => {
    const angle = (-Math.PI / 2) + (index * Math.PI * 2 / axes.length);
    const raw = value === null ? 0 : (inverse ? 1 - Math.max(0, value) / max : Math.max(0, value) / max);
    const r = Math.max(8, Math.min(1, raw) * radius);
    return `${cx + Math.cos(angle) * r},${cy + Math.sin(angle) * r}`;
  };
  const polygon = (key) => axes.map((axis, i) => pointFor(i, axis[key], axis.inverse)).join(" ");
  return (
    <div className="mt-3 grid items-center gap-2 sm:grid-cols-[minmax(0,1fr)_150px]">
      <div className="min-w-0">
        <svg viewBox="0 0 300 250" className="mx-auto block w-full max-w-[340px]" role="img" aria-label="Komandu statistikas profilu salīdzinājums">
          {[0.25, 0.5, 0.75, 1].map((scale) => {
            const points = axes.map((_, i) => {
              const angle = (-Math.PI / 2) + (i * Math.PI * 2 / axes.length);
              return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
            }).join(" ");
            return <polygon key={scale} points={points} fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="1" />;
          })}
          {axes.map((axis, i) => {
            const angle = (-Math.PI / 2) + (i * Math.PI * 2 / axes.length);
            return <line key={axis.label} x1={cx} y1={cy} x2={cx + Math.cos(angle) * radius} y2={cy + Math.sin(angle) * radius} stroke="rgba(148,163,184,0.22)" />;
          })}
          <polygon points={polygon("a")} fill="rgba(52,230,145,0.18)" stroke="#34E691" strokeWidth="2.5" strokeLinejoin="round" />
          <polygon points={polygon("b")} fill="rgba(167,139,250,0.16)" stroke="#A78BFA" strokeWidth="2.5" strokeLinejoin="round" />
          {axes.map((axis, i) => {
            const angle = (-Math.PI / 2) + (i * Math.PI * 2 / axes.length);
            const labelX = cx + Math.cos(angle) * (radius + 24);
            const labelY = cy + Math.sin(angle) * (radius + 24);
            return <text key={axis.label} x={labelX} y={labelY} textAnchor="middle" dominantBaseline="middle" fill="#CBD5E1" fontSize="8" fontWeight="700">{axis.label}</text>;
          })}
        </svg>
      </div>
      <div className="space-y-2 text-[10px]">
        <div className="flex items-center gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.06] p-2"><span className="h-2 w-2 rounded-full bg-emerald-400" /><span className="min-w-0 truncate text-slate-200">{getTeamShortName(first)}</span></div>
        <div className="flex items-center gap-2 rounded-xl border border-violet-400/15 bg-violet-400/[0.06] p-2"><span className="h-2 w-2 rounded-full bg-violet-400" /><span className="min-w-0 truncate text-slate-200">{getTeamShortName(second)}</span></div>
        <p className="pt-1 text-[9px] leading-4 text-slate-500">Diagramma izmanto tabulā pieejamos datus; trūkstošās vērtības netiek izdomātas.</p>
      </div>
    </div>
  );
}

function TeamCompareModal({ first, second, standings, fixtures, onClose }) {
  if (!first || !second) return null;

  const firstId = getTeamId(first);
  const secondId = getTeamId(second);
  const firstForm = getTeamForm(firstId, fixtures, first);
  const secondForm = getTeamForm(secondId, fixtures, second);
  const firstHomeAway = getHomeAwayStats(firstId, fixtures);
  const secondHomeAway = getHomeAwayStats(secondId, fixtures);
  const metrics = [
    ["Punkti", first?.points ?? first?.flowPoints, second?.points ?? second?.flowPoints, "high"],
    ["Spēles", getPlayed(first), getPlayed(second), "high"],
    ["Uzvaras", getWins(first), getWins(second), "high"],
    ["Neizšķirti", getDraws(first), getDraws(second), "high"],
    ["Zaudējumi", getLosses(first), getLosses(second), "low"],
    ["Gūtie vārti", getGoalsFor(first), getGoalsFor(second), "high"],
    ["Ielaistie vārti", getGoalsAgainst(first), getGoalsAgainst(second), "low"],
    ["Vārtu starpība", getGoalDifference(first), getGoalDifference(second), "high"],
  ];
  const recentFixtures = Array.isArray(fixtures?.recent) ? fixtures.recent : [];
  const upcomingFixtures = Array.isArray(fixtures?.upcoming) ? fixtures.upcoming : [];
  const headToHead = recentFixtures.filter((fixture) => {
    const teams = fixtureTeams(fixture);
    const ids = [String(teams.home.id ?? ""), String(teams.away.id ?? "")];
    return ids.includes(String(firstId ?? "")) && ids.includes(String(secondId ?? "")) && fixtureScore(fixture) !== null;
  }).slice(0, 5);
  const upcomingForTeams = upcomingFixtures.filter((fixture) => {
    const teams = fixtureTeams(fixture);
    return [String(teams.home.id ?? ""), String(teams.away.id ?? "")].some((id) => id === String(firstId ?? "") || id === String(secondId ?? ""));
  }).slice(0, 5);
  const overview = (team, form) => {
    const formInfo = getFormLabel(form);
    return { team, form, formInfo };
  };
  const summaries = [overview(first, firstForm), overview(second, secondForm)];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-[#020B08]/85 p-2 backdrop-blur-md sm:p-4" onClick={onClose}>
      <div className="max-h-[94vh] w-full max-w-7xl overflow-y-auto rounded-[24px] border border-emerald-400/25 bg-[#04140F] text-white shadow-[0_25px_100px_rgba(0,0,0,0.55)]" onClick={(event) => event.stopPropagation()}>
        <header className="sticky top-0 z-20 border-b border-emerald-400/15 bg-[#061810]/95 px-4 py-4 backdrop-blur sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.24em] text-emerald-300">Flow Football Analytics</p>
              <h3 className="mt-1 text-xl font-black tracking-tight sm:text-2xl">Komandu salīdzinājums</h3>
              <p className="mt-1 text-xs text-slate-400">Salīdzini sezonas sniegumu, formu un savstarpējās spēles.</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Aizvērt salīdzinājumu" className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:border-emerald-400/40 hover:text-white">✕</button>
          </div>
          <div className="mt-4 grid gap-2 md:grid-cols-[1fr_auto_1fr] md:items-center">
            {[first, second].map((team, index) => (
              <div key={getTeamId(team)} className={`flex min-w-0 items-center gap-3 rounded-2xl border bg-white/[0.025] p-3 ${index === 0 ? "border-emerald-400/30" : "border-violet-400/30"}`}>
                <MiniCrest src={teamCrest(team)} name={getTeamName(team)} className="h-11 w-11 sm:h-14 sm:w-14" />
                <div className="min-w-0 flex-1">
                  <p className={`text-[8px] font-black uppercase tracking-[0.2em] ${index === 0 ? "text-emerald-300" : "text-violet-300"}`}>{index === 0 ? "01 · Pirmā komanda" : "02 · Otrā komanda"}</p>
                  <p className="mt-1 truncate text-sm font-black sm:text-base">{getTeamName(team)}</p>
                  <p className="mt-1 text-[10px] text-slate-400">{valueOrDash(getPlayed(team))} spēles <span className="px-1 text-slate-600">·</span> {valueOrDash(team?.points ?? team?.flowPoints)} punkti</p>
                </div>
              </div>
            )) .reduce((items, card, index) => index === 0 ? [card] : [items[0], <div key="vs" className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] text-[10px] font-black text-emerald-200">VS</div>, card], [])}
          </div>
        </header>

        <div className="space-y-4 p-3 sm:p-5">
          <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,1.2fr)_minmax(0,1fr)]">
            {summaries.map(({ team, form, formInfo }, index) => {
              const isFirst = index === 0;
              const wins = numberValue(getWins(team));
              const played = numberValue(getPlayed(team));
              const draw = numberValue(getDraws(team));
              const losses = numberValue(getLosses(team));
              return (
                <Panel key={getTeamId(team)} eyebrow={isFirst ? "Komandas pārskats" : "Komandas pārskats"} title={getTeamName(team)} className={isFirst ? "border-emerald-400/25" : "border-violet-400/25"}>
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-2 2xl:grid-cols-4">
                    {[["Spēles", played], ["Uzvaras", wins], ["Neizšķirti", draw], ["Zaudējumi", losses]].map(([label, value]) => (
                      <div key={label} className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-2.5">
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
                        <p className={`mt-1 text-xl font-black tabular-nums ${label === "Uzvaras" ? (isFirst ? "text-emerald-300" : "text-violet-300") : "text-white"}`}>{valueOrDash(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 grid grid-cols-3 overflow-hidden rounded-xl border border-white/[0.06] bg-black/10 text-center">
                    {[["Gūtie vārti", getGoalsFor(team)], ["Ielaistie", getGoalsAgainst(team)], ["Starpība", getGoalDifference(team)]].map(([label, value]) => (
                      <div key={label} className="border-r border-white/[0.06] p-2 last:border-r-0">
                        <p className="text-[8px] uppercase tracking-wider text-slate-500">{label}</p><p className="mt-1 text-sm font-black">{valueOrDash(value)}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Pēdējās 5 spēles</span>
                    <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${formInfo.tone}`}>{formInfo.label}</span>
                  </div>
                  <div className="mt-2"><FormDots form={form} /></div>
                </Panel>
              );
            })}
            <Panel eyebrow="Datu vizualizācija" title="Statistikas profils" className="xl:col-start-2 xl:row-start-1 xl:row-span-1">
              <RadarComparison first={first} second={second} />
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Panel eyebrow="Tiešs salīdzinājums" title="Galvenie statistikas rādītāji">
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(110px,1.6fr)_minmax(0,1fr)] gap-2 border-b border-white/10 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-500">
                <span className="text-right">{getTeamShortName(first)}</span><span className="text-center">Rādītājs</span><span>{getTeamShortName(second)}</span>
              </div>
              {metrics.map(([label, a, b, better]) => {
                const av = numberValue(a), bv = numberValue(b);
                const firstBetter = av !== null && bv !== null && (better === "low" ? av < bv : av > bv);
                const secondBetter = av !== null && bv !== null && (better === "low" ? bv < av : bv > av);
                return <MetricCard key={label} label={label} first={a} second={b} firstBetter={firstBetter} secondBetter={secondBetter} />;
              })}
              <div className="mt-3 flex flex-wrap gap-3 text-[9px] text-slate-400"><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" />{getTeamShortName(first)}</span><span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-violet-400" />{getTeamShortName(second)}</span></div>
            </Panel>

            <Panel eyebrow="Mājas / izbraukuma forma" title="Rezultāti pēc spēles vietas">
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3">
                {[[first, firstHomeAway, "border-emerald-400/20"], [second, secondHomeAway, "border-violet-400/20"]].map(([team, stats, tone]) => (
                  <div key={getTeamId(team)} className={`rounded-xl border ${tone} bg-black/10 p-3`}>
                    <div className="flex min-w-0 items-center gap-2"><MiniCrest src={teamCrest(team)} name={getTeamName(team)} className="h-7 w-7" /><p className="truncate text-[10px] font-black">{getTeamShortName(team)}</p></div>
                    <div className="mt-3 space-y-3">
                      {[["Mājās", stats.home], ["Izbraukumā", stats.away]].map(([label, part]) => (
                        <div key={label}>
                          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                          <div className="mt-2 grid grid-cols-3 gap-1 text-center">
                            {[["U", part.wins], ["N", part.draws], ["Z", part.losses]].map(([short, value]) => <div key={short} className="rounded-lg bg-white/[0.04] px-1 py-2"><p className="text-[8px] text-slate-500">{short}</p><p className="mt-0.5 text-sm font-black">{value}</p></div>)}
                          </div>
                          <p className="mt-1.5 text-[9px] text-slate-500">Vārti: <span className="font-bold text-slate-200">{part.goalsFor}:{part.goalsAgainst}</span></p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            <Panel eyebrow="Savstarpējie mači" title="Pēdējās tikšanās">
              {headToHead.length ? <div className="mt-3 space-y-1.5">{headToHead.map((fixture, index) => {
                const teams = fixtureTeams(fixture);
                return <div key={fixture?.fixture?.id ?? fixture?.id ?? `${fixtureDate(fixture)}-${index}`} className="grid grid-cols-[65px_minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                  <span className="text-[9px] text-slate-500">{fixtureDate(fixture)}</span>
                  <span className="flex min-w-0 items-center gap-1.5 text-[10px] font-bold"><MiniCrest src={teams.home.logo} name={teams.home.name} className="h-5 w-5" /><span className="truncate">{teams.home.name}</span></span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-black tabular-nums">{fixtureScore(fixture)}</span>
                  <span className="flex min-w-0 items-center justify-end gap-1.5 text-[10px] font-bold"><span className="truncate">{teams.away.name}</span><MiniCrest src={teams.away.logo} name={teams.away.name} className="h-5 w-5" /></span>
                </div>;
              })}</div> : <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center"><p className="text-xs font-bold text-slate-300">Nav pieejamu savstarpējo spēļu datu</p><p className="mt-1 text-[10px] text-slate-500">Šajā ielādētajā spēļu sarakstā nav rezultātu starp abām komandām.</p></div>}
            </Panel>
            <Panel eyebrow="Kalendārs" title="Tuvākās spēles">
              {upcomingForTeams.length ? <div className="mt-3 space-y-1.5">{upcomingForTeams.map((fixture, index) => {
                const teams = fixtureTeams(fixture);
                const relevant = [String(teams.home.id ?? ""), String(teams.away.id ?? "")].includes(String(firstId ?? "")) ? first : second;
                return <div key={fixture?.fixture?.id ?? fixture?.id ?? `${fixtureDate(fixture)}-up-${index}`} className="flex items-center gap-2 rounded-lg border border-white/[0.05] bg-white/[0.02] px-2.5 py-2">
                  <span className="w-[68px] shrink-0 text-[9px] text-slate-500">{fixtureDate(fixture)}</span>
                  <div className="flex min-w-0 flex-1 items-center gap-2"><MiniCrest src={teams.home.logo} name={teams.home.name} className="h-5 w-5" /><span className="truncate text-[10px] font-bold">{teams.home.name}</span><span className="text-[9px] text-slate-600">vs</span><MiniCrest src={teams.away.logo} name={teams.away.name} className="h-5 w-5" /><span className="truncate text-[10px] font-bold">{teams.away.name}</span></div>
                  <span className={`shrink-0 rounded-full px-2 py-1 text-[8px] font-black ${getTeamId(relevant) === firstId ? "bg-emerald-400/10 text-emerald-300" : "bg-violet-400/10 text-violet-300"}`}>{getTeamShortName(relevant)}</span>
                </div>;
              })}</div> : <div className="mt-3 rounded-xl border border-dashed border-white/10 p-5 text-center"><p className="text-xs font-bold text-slate-300">Nav pieejamu gaidāmo spēļu</p><p className="mt-1 text-[10px] text-slate-500">Tiek rādītas tikai tās spēles, ko nodrošina esošais API.</p></div>}
            </Panel>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] px-3 py-2.5 text-[9px] text-slate-400">
            <span>Flow Football Analytics <span className="px-1 text-slate-600">·</span> dati no pašreizējās līgas tabulas un spēļu saraksta</span>
            <span className="flex items-center gap-3"><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Pirmā komanda</span><span className="flex items-center gap-1"><span className="h-1.5 w-1.5 rounded-full bg-violet-400" /> Otrā komanda</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TeamCompareModal;
