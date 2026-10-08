import React, { useEffect, useMemo, useState } from "react";
import { fetchPlayerFixtureContext } from "../../services/leagueFeatures";
import { PlayerMiniCard } from "./AnalyticsShared";
import {
  number,
  metricDefinitions,
  getMetric,
  normalize,
  weightedScore,
  playerRecentForm,
  getProjectedPoints,
  getFormStatus,
  getFormattedFixtureDate,
  resolvePlayerTeam,
  getFixtureForTeam,
  getFixtureOpponent,
  getDifficulty,
  getDifferentialScore,
  getStatusForPlayer,
} from "../../utils/analyticsUtils";

function RankingExplanation({ item, pool, weights }) {
  const metrics = Object.entries(weights).filter(([, weight]) => number(weight) > 0);

  const details = metrics.map(([key, weight]) => {
    const values = pool.map(player => getMetric(player, key));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const raw = getMetric(item.player, key);
    const normalized = normalize(raw, min, max);
    const contribution = normalized * number(weight) / 100;
    const label = metricDefinitions.find(metric => metric.key === key)?.label || key;

    return {
      key,
      label,
      weight: number(weight),
      raw,
      normalized,
      contribution,
    };
  });

  return (
    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">
            Kāpēc šāds rezultāts?
          </p>
          <p className="mt-1 text-sm font-black text-slate-900">
            {item.player.name} · {Math.round(item.score)} Score
          </p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black text-emerald-700">
          {details.length} kritēriji
        </span>
      </div>

      <div className="space-y-3">
        {details.map(detail => (
          <div key={detail.key}>
            <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-slate-500">
              <span>{detail.label} · {detail.weight}%</span>
              <span>{Math.round(detail.normalized)}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.max(0, Math.min(100, detail.normalized))}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RankingFormTrend({ player }) {
  const values = playerRecentForm(player).slice(-5);
  const safeValues = values.length ? values : [getProjectedPoints(player)];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);
  const trend = safeValues.length > 1 ? safeValues[safeValues.length - 1] - safeValues[0] : 0;
  const trendLabel = trend > 0.25 ? "↑ Uzlabojas" : trend < -0.25 ? "↓ Krītas" : "→ Stabils";
  const trendTone = trend > 0.25 ? "text-emerald-600" : trend < -0.25 ? "text-rose-600" : "text-amber-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Formas tendence</p>
          <p className={`mt-1 text-xs font-black ${trendTone}`}>{trendLabel}</p>
        </div>
        <span className="text-[9px] font-bold text-slate-400">Pēdējie {safeValues.length} rādītāji</span>
      </div>

      <div className="flex h-24 items-end gap-2">
        {safeValues.map((value, index) => {
          const height = 18 + ((value - min) / range) * 82;
          return (
            <div key={`${index}-${value}`} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[8px] font-black text-slate-500">{number(value).toFixed(1)}</span>
              <div
                className="w-full rounded-t-lg bg-emerald-400 transition-all"
                style={{ height: `${height}%` }}
              />
              <span className="text-[7px] font-bold text-slate-300">GW {index + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const getRankingFixture = (player, fixtures) => getFixtureForTeam(player, fixtures);

function RankingFixtureCard({ player, fixture, standings }) {
  const opponent = getFixtureOpponent(player, fixture);
  const difficulty = getDifficulty(player, fixture, standings);

  if (!fixture || !opponent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <p className="mt-2 text-sm font-black text-slate-700">Nākamais mačs nav pieejams</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>
          {difficulty.score}/5
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-black">
          {opponent.isHome ? "🏠" : "✈️"}
        </span>
        {opponent.logo ? (
          <img src={opponent.logo} alt="" className="h-8 w-8 rounded-full object-contain" />
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">
            {opponent.isHome ? `${player.team} vs ${opponent.name}` : `${player.team} @ ${opponent.name}`}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {getFormattedFixtureDate(fixture)} · {difficulty.label}
          </p>
        </div>
      </div>
    </div>
  );
}

function RankingPlayerFixtureHistory({ player, standings = [], competition = "PL", season = 2026 }) {
  const [context, setContext] = useState({ upcoming: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const fixturePlayer = useMemo(() => resolvePlayerTeam(player, standings), [player, standings]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchPlayerFixtureContext(fixturePlayer, competition, season);
        if (!cancelled) {
          setContext({
            upcoming: Array.isArray(data?.upcoming) ? data.upcoming.slice(0, 5) : [],
            recent: Array.isArray(data?.recent) ? data.recent.slice(0, 5) : [],
          });
        }
      } catch {
        if (!cancelled) setContext({ upcoming: [], recent: [] });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [fixturePlayer?.teamId, competition, season]);

  const resultFor = fixture => getFixtureResultForTeam(fixturePlayer, fixture);
  const formValues = context.recent.map(fixture => resultFor(fixture)?.result || "—");

  return (
    <div className="grid gap-3 lg:grid-cols-2 lg:col-span-2">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Pēdējās 5 spēles</p>
            <p className="mt-1 text-xs font-black text-slate-900">Form</p>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, index) => {
              const value = formValues[index] || "—";
              return <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-black ${value === "W" ? "bg-emerald-100 text-emerald-700" : value === "D" ? "bg-amber-100 text-amber-700" : value === "L" ? "bg-rose-100 text-rose-700" : "bg-slate-100 text-slate-400"}`}>{value}</span>;
            })}
          </div>
        </div>
        <div className="space-y-1.5">
          {loading ? <div className="space-y-1.5">{[1,2,3,4,5].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-50" />)}</div> : context.recent.length ? context.recent.map((fixture, index) => {
            const opponent = getFixtureOpponent(fixturePlayer, fixture);
            const result = resultFor(fixture);
            return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-black ${result?.result === "W" ? "bg-emerald-100 text-emerald-700" : result?.result === "D" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{result?.result || "—"}</span>{opponent?.logo ? <img src={opponent.logo} alt="" className="h-5 w-5 rounded-full object-contain" /> : null}<span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-600">{opponent?.name || "Pretinieks"}</span><span className="text-[8px] font-black text-slate-500">{result ? `${result.teamGoals}:${result.opponentGoals}` : "—"}</span></div>;
          }) : <p className="text-[9px] text-slate-400">Pēdējo spēļu dati nav pieejami.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamās 5 spēles</p><p className="mt-1 text-xs font-black text-slate-900">Fixture list</p></div><span className="text-[8px] font-black text-emerald-600">{context.upcoming.length}/5</span></div>
        <div className="space-y-1.5">
          {loading ? [1,2,3,4,5].map(i => <div key={i} className="h-8 animate-pulse rounded-lg bg-slate-50" />) : context.upcoming.length ? context.upcoming.map((fixture, index) => { const opponent = getFixtureOpponent(fixturePlayer, fixture); return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"><span className="text-[8px]">{opponent?.isHome ? "🏠" : "✈️"}</span>{opponent?.logo ? <img src={opponent.logo} alt="" className="h-5 w-5 rounded-full object-contain" /> : null}<span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-600">{opponent ? `${opponent.isHome ? "vs" : "@"} ${opponent.name}` : "Pretinieks"}</span><span className="text-[8px] font-black text-slate-400">{getFormattedFixtureDate(fixture)}</span></div>; }) : <p className="text-[9px] text-slate-400">Nākamo spēļu dati nav pieejami.</p>}
        </div>
      </div>
    </div>
  );
}

function RankingPlayerDetail({ item, pool, weights, fixtures, standings, competition = "PL", season = 2026 }) {
  const player = item.player;
  const fixture = getRankingFixture(player, fixtures);
  const status = getStatusForPlayer(player);
  const form = getFormStatus(player);
  const differential = getDifferentialScore(player, pool);
  const flow = number(player.flowPoints);
  const actualRank = [...pool]
    .sort((a, b) => number(b.flowPoints) - number(a.flowPoints))
    .findIndex(candidate => String(candidate.id) === String(player.id)) + 1;

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-3">
      <RankingExplanation item={item} pool={pool} weights={weights} />
      <RankingFormTrend player={player} />
      <RankingFixtureCard player={player} fixture={fixture} standings={standings} />
      <RankingPlayerFixtureHistory player={player} standings={standings} competition={competition} season={season} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Custom Score</p><p className="mt-1 text-xl font-black text-emerald-600">{Math.round(item.score)}</p></div>
          <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Flow punkti</p><p className="mt-1 text-xl font-black text-slate-900">{flow}</p></div>
          <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Flow vieta</p><p className="mt-1 text-xl font-black text-slate-900">#{actualRank || "—"}</p></div>
          <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Differential</p><p className="mt-1 text-xl font-black text-violet-600">{differential}</p></div>
          <div><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Status</p><div className="mt-1 flex flex-wrap gap-1"><span className={`rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>{form.label}</span><span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>{status.label}</span></div></div>
        </div>
      </div>
    </div>
  );
}

function RankingComparison({ modelA, modelB, pool }) {
  const rankingA = pool
    .map(player => ({ player, score: weightedScore(player, modelA, pool) }))
    .sort((a, b) => b.score - a.score);

  const rankingB = pool
    .map(player => ({ player, score: weightedScore(player, modelB, pool) }))
    .sort((a, b) => b.score - a.score);

  const rows = pool
    .map(player => {
      const a = rankingA.findIndex(item => String(item.player.id) === String(player.id)) + 1;
      const b = rankingB.findIndex(item => String(item.player.id) === String(player.id)) + 1;
      return { player, a, b };
    })
    .sort((x, y) => x.a - y.a)
    .slice(0, 15);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="grid grid-cols-[1fr_90px_90px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
        <span>Spēlētājs</span>
        <span className="text-center">Modelis A</span>
        <span className="text-center">Modelis B</span>
      </div>
      {rows.map(row => (
        <div key={row.player.id} className="grid grid-cols-[1fr_90px_90px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0">
          <div className="flex min-w-0 items-center gap-3">
            {row.player.photo ? (
              <img src={row.player.photo} alt="" className="h-8 w-8 rounded-full object-cover" />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-[8px] font-black text-slate-500">PL</div>
            )}
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-slate-900">{row.player.name}</p>
              <p className="truncate text-[8px] font-bold uppercase tracking-wider text-slate-400">{row.player.team}</p>
            </div>
          </div>
          <p className="text-center text-sm font-black text-slate-900">#{row.a}</p>
          <p className="text-center text-sm font-black text-emerald-600">#{row.b}</p>
        </div>
      ))}
    </div>
  );
}


export {
  RankingExplanation,
  RankingFormTrend,
  RankingFixtureCard,
  RankingPlayerFixtureHistory,
  RankingPlayerDetail,
  RankingComparison,
};