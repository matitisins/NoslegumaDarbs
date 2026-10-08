import React, { useEffect, useState } from "react";
import { fetchPlayerFixtureContext } from "../../services/leagueFeatures";
import { PlayerMiniCard } from "./AnalyticsShared";
import {
  number,
  metricDefinitions,
  getMetric,
  normalize,
  getProjectedPoints,
  getFormStatus,
  getBudgetPrice,
  getFormattedFixtureDate,
  resolvePlayerTeam,
  getFixtureOpponent,
  getDifficulty,
  getStatusForPlayer,
} from "../../utils/analyticsUtils";

function RecommendationExplanation({ item, pool, weights }) {
  const metrics = Object.entries(weights).filter(([, weight]) => number(weight) > 0);

  const details = metrics.map(([key, weight]) => {
    const values = pool.map(player => getMetric(player, key));
    const min = Math.min(...values);
    const max = Math.max(...values);
    const raw = getMetric(item.player, key);
    const normalized = normalize(raw, min, max);
    return {
      key,
      label: metricDefinitions.find(metric => metric.key === key)?.label || key,
      weight: number(weight),
      raw,
      normalized,
      contribution: normalized * number(weight) / 100,
    };
  });

  return (
    <div className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Kāpēc ieteikts?</p>
          <p className="mt-1 text-sm font-black text-slate-900">{item.player.name} · {Math.round(item.score)} Heuristic Score</p>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-[9px] font-black text-emerald-700">{details.length} kritēriji</span>
      </div>
      <div className="space-y-3">
        {details.map(detail => (
          <div key={detail.key}>
            <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-slate-500">
              <span>{detail.label} · {detail.weight}%</span>
              <span>{Math.round(detail.normalized)}/100</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, detail.normalized))}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getFixtureResultForTeam(player, fixture) {
  if (!player || !fixture) return null;

  const teamId = Number(player?.teamId);
  const homeId = Number(fixture?.teams?.home?.id);
  const awayId = Number(fixture?.teams?.away?.id);
  const homeGoals = fixture?.goals?.home;
  const awayGoals = fixture?.goals?.away;

  if (
    !Number.isFinite(teamId) ||
    !Number.isFinite(homeId) ||
    !Number.isFinite(awayId) ||
    homeGoals === null ||
    homeGoals === undefined ||
    awayGoals === null ||
    awayGoals === undefined
  ) {
    return null;
  }

  const isHome = homeId === teamId;
  const isAway = awayId === teamId;

  if (!isHome && !isAway) return null;

  const teamGoals = isHome
    ? Number(homeGoals)
    : Number(awayGoals);
  const opponentGoals = isHome
    ? Number(awayGoals)
    : Number(homeGoals);

  if (
    !Number.isFinite(teamGoals) ||
    !Number.isFinite(opponentGoals)
  ) {
    return null;
  }

  const result =
    teamGoals > opponentGoals
      ? "W"
      : teamGoals < opponentGoals
        ? "L"
        : "D";

  return {
    result,
    isHome,
    teamGoals,
    opponentGoals,
  };
}

function RecommendationRecentForm({ player, fixtures, loading }) {
  const recent = Array.isArray(fixtures?.recent)
    ? fixtures.recent.slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Recent form
          </p>
          <p className="mt-1 text-xs font-black text-slate-900">
            Pēdējās 5 spēles
          </p>
        </div>
        <div className="flex items-center gap-1">
          {recent.map((fixture, index) => {
            const result = getFixtureResultForTeam(
              player,
              fixture
            );
            return (
              <span
                key={`${fixture?.fixture?.id || index}-form-dot`}
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-black ${
                  result?.result === "W"
                    ? "bg-emerald-100 text-emerald-700"
                    : result?.result === "D"
                      ? "bg-amber-100 text-amber-700"
                      : result?.result === "L"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-slate-100 text-slate-500"
                }`}
              >
                {result?.result || "—"}
              </span>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(index => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-50"
            />
          ))}
        </div>
      ) : recent.length ? (
        <div className="space-y-2">
          {recent.map((fixture, index) => {
            const opponent = getFixtureOpponent(
              player,
              fixture
            );
            const result = getFixtureResultForTeam(
              player,
              fixture
            );

            return (
              <div
                key={fixture?.fixture?.id || index}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black ${
                    result?.result === "W"
                      ? "bg-emerald-100 text-emerald-700"
                      : result?.result === "D"
                        ? "bg-amber-100 text-amber-700"
                        : result?.result === "L"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {result?.result || "—"}
                </span>

                {opponent?.logo ? (
                  <img
                    src={opponent.logo}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-contain"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-white" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-black text-slate-900">
                    {opponent?.isHome
                      ? `${player.team} vs ${opponent.name}`
                      : `${player.team} @ ${opponent?.name || "Nezināms"}`}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    {getFormattedFixtureDate(fixture)}
                  </p>
                </div>

                {result ? (
                  <span className="shrink-0 text-xs font-black text-slate-900">
                    {result.teamGoals} : {result.opponentGoals}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
          Pēdējās spēles nav pieejamas.
        </div>
      )}
    </div>
  );
}

function RecommendationNextFixtures({ player, fixtures, standings, loading }) {
  const upcoming = Array.isArray(fixtures?.upcoming)
    ? fixtures.upcoming.slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Next 5 games
          </p>
          <p className="mt-1 text-xs font-black text-slate-900">
            Nākamās 5 spēles
          </p>
        </div>
        <span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] font-black text-slate-400">
          {upcoming.length}/5
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(index => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-50"
            />
          ))}
        </div>
      ) : upcoming.length ? (
        <div className="space-y-2">
          {upcoming.map((fixture, index) => {
            const opponent = getFixtureOpponent(
              player,
              fixture
            );
            const difficulty = getDifficulty(
              player,
              fixture,
              standings || []
            );

            return (
              <div
                key={fixture?.fixture?.id || index}
                className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2"
              >
                <span className="shrink-0 rounded-lg bg-white px-2 py-1 text-[10px] font-black">
                  {opponent?.isHome ? "🏠" : "✈️"}
                </span>

                {opponent?.logo ? (
                  <img
                    src={opponent.logo}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-contain"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-white" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-black text-slate-900">
                    {opponent
                      ? opponent.isHome
                        ? `${player.team} vs ${opponent.name}`
                        : `${player.team} @ ${opponent.name}`
                      : "Nezināms pretinieks"}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    {getFormattedFixtureDate(fixture)}
                  </p>
                </div>

                <span
                  className={`shrink-0 rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}
                >
                  {difficulty.score}/5
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-slate-50 p-4 text-center text-xs font-bold text-slate-400">
          Nākamās spēles nav pieejamas.
        </div>
      )}
    </div>
  );
}

function RecommendationFixture({ player, fixture, standings }) {
  const opponent = getFixtureOpponent(player, fixture);
  if (!fixture || !opponent) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <p className="mt-2 text-sm font-black text-slate-700">Nākamais mačs nav pieejams</p>
      </div>
    );
  }
  const difficulty = getDifficulty(player, fixture, standings || []);
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-slate-50 px-2 py-1 text-xs font-black">{opponent.isHome ? "🏠" : "✈️"}</span>
        {opponent.logo ? <img src={opponent.logo} alt="" className="h-8 w-8 rounded-full object-contain" /> : null}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">{opponent.isHome ? `${player.team} vs ${opponent.name}` : `${player.team} @ ${opponent.name}`}</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{getFormattedFixtureDate(fixture)} · {difficulty.label}</p>
        </div>
      </div>
    </div>
  );
}

function RecommendationCompare({ items, standings = [], competition = "PL", season = 2026, onClose }) {
  const [contexts, setContexts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const entries = await Promise.all(
        items.map(async item => {
          try {
            const fixturePlayer = resolvePlayerTeam(item.player, standings);
            const data = await fetchPlayerFixtureContext(
              fixturePlayer,
              competition,
              season
            );
            return [
              String(item.player.id),
              {
                upcoming: Array.isArray(data?.upcoming) ? data.upcoming.slice(0, 5) : [],
                recent: Array.isArray(data?.recent) ? data.recent.slice(0, 5) : [],
              },
            ];
          } catch {
            return [String(item.player.id), { upcoming: [], recent: [] }];
          }
        })
      );
      if (!cancelled) {
        setContexts(Object.fromEntries(entries));
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [items, standings, competition, season]);

  const rows = [
    ["Heuristic Score", item => Math.round(item.score)],
    ["GW heuristiskā aplēse", item => getProjectedPoints(item.player).toFixed(1)],
    ["Flow punkti", item => number(item.player.flowPoints)],
    ["Vārti", item => number(item.player.goals)],
    ["Assist", item => number(item.player.assists)],
    ["Minūtes", item => number(item.player.minutes)],
    ["Vērtējums", item => number(item.player.advancedStats?.rating).toFixed(2)],
    ["Cena", item => `€${getBudgetPrice(item.player).toFixed(1)}m`],
  ];

  const resultFor = (player, fixture) => getFixtureResultForTeam(player, fixture);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Spēlētāju salīdzinājums</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Recommended players</h3>
            <p className="mt-1 text-[10px] font-bold text-slate-400">Statistika, pēdējās 5 spēles un nākamās 5 spēles.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white font-bold text-slate-500 hover:bg-slate-50">✕</button>
        </div>

        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {items.map(item => {
              const player = resolvePlayerTeam(item.player, standings);
              const context = contexts[String(player.id)] || { upcoming: [], recent: [] };
              const form = context.recent.map(fixture => resultFor(player, fixture)?.result || "—");
              const formInfo = getFormStatus(player);

              return (
                <div key={player.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100" /> : <div className="h-12 w-12 rounded-full bg-slate-100" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-slate-900">{player.name}</p>
                          <p className="truncate text-[8px] font-bold uppercase tracking-wider text-slate-400">{player.team} · {player.positionLabel}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600">{Math.round(item.score)}</p>
                          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Heuristic Score</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-4 gap-2">
                    {[["GW", getProjectedPoints(player).toFixed(1)], ["Flow", number(player.flowPoints)], ["G", number(player.goals)], ["A", number(player.assists)]].map(([label, value]) => (
                      <div key={label} className="rounded-xl bg-slate-50 p-2 text-center">
                        <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 text-xs font-black text-slate-900">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Pēdējās 5 spēles</p>
                        <p className={`mt-1 text-[9px] font-black ${formInfo.tone.split(" ")[1] || "text-slate-700"}`}>{formInfo.label}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const value = form[index] || "—";
                          return <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-black ${value === "W" ? "bg-emerald-100 text-emerald-700" : value === "D" ? "bg-amber-100 text-amber-700" : value === "L" ? "bg-rose-100 text-rose-700" : "bg-white text-slate-400"}`}>{value}</span>;
                        })}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {loading ? <div className="h-8 animate-pulse rounded-lg bg-white" /> : context.recent.length ? context.recent.map((fixture, index) => {
                        const opponent = getFixtureOpponent(player, fixture);
                        const result = resultFor(player, fixture);
                        return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-white px-2.5 py-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-black ${result?.result === "W" ? "bg-emerald-100 text-emerald-700" : result?.result === "D" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{result?.result || "—"}</span>{opponent?.logo ? <img src={opponent.logo} alt="" className="h-5 w-5 rounded-full object-contain" /> : null}<span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-600">{opponent?.name || "Pretinieks"}</span><span className="text-[8px] font-black text-slate-500">{result ? `${result.teamGoals}:${result.opponentGoals}` : "—"}</span></div>;
                      }) : <p className="text-[9px] text-slate-400">Pēdējo spēļu dati nav pieejami.</p>}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3">
                    <div className="flex items-center justify-between"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nākamās 5 spēles</p><span className="text-[8px] font-black text-emerald-600">{context.upcoming.length}/5</span></div>
                    <div className="mt-2 space-y-1.5">
                      {loading ? <div className="h-8 animate-pulse rounded-lg bg-slate-50" /> : context.upcoming.length ? context.upcoming.map((fixture, index) => { const opponent = getFixtureOpponent(player, fixture); return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-slate-50 px-2.5 py-2"><span className="text-[8px]">{opponent?.isHome ? "🏠" : "✈️"}</span>{opponent?.logo ? <img src={opponent.logo} alt="" className="h-5 w-5 rounded-full object-contain" /> : null}<span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-600">{opponent ? `${opponent.isHome ? "vs" : "@"} ${opponent.name}` : "Pretinieks"}</span><span className="text-[8px] font-black text-slate-400">{getFormattedFixtureDate(fixture)}</span></div>; }) : <p className="text-[9px] text-slate-400">Nākamo spēļu dati nav pieejami.</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-[140px_repeat(2,minmax(0,1fr))] border-b border-slate-100 bg-slate-50 px-3 py-2 text-[8px] font-black uppercase tracking-wider text-slate-400">
              <span>Rādītājs</span>
              {items.map(item => <span key={item.player.id} className="text-center">{item.player.name}</span>)}
            </div>
            {rows.map(([label, getter]) => (
              <div key={label} className="grid grid-cols-[140px_repeat(2,minmax(0,1fr))] border-b border-slate-100 last:border-b-0">
                <div className="px-3 py-2 text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</div>
                {items.map(item => <div key={`${label}-${item.player.id}`} className="border-l border-slate-100 px-3 py-2 text-center text-xs font-black text-slate-900">{getter(item)}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationDetail({ item, pool, weights, fixture, standings, competition, season, onClose }) {
  const player = resolvePlayerTeam(item.player, standings);
  const [fixtureContext, setFixtureContext] = useState({ upcoming: [], recent: [] });
  const [fixtureContextLoading, setFixtureContextLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadFixtureContext = async () => {
      setFixtureContextLoading(true);

      try {
        const data = await fetchPlayerFixtureContext(
          player,
          competition || player?.league || "PL",
          season || player?.season || 2026
        );

        if (!cancelled) {
          setFixtureContext({
            upcoming: Array.isArray(data?.upcoming)
              ? data.upcoming.slice(0, 5)
              : [],
            recent: Array.isArray(data?.recent)
              ? data.recent.slice(0, 5)
              : [],
          });
        }
      } catch {
        if (!cancelled) {
          setFixtureContext({
            upcoming: [],
            recent: [],
          });
        }
      } finally {
        if (!cancelled) {
          setFixtureContextLoading(false);
        }
      }
    };

    loadFixtureContext();

    return () => {
      cancelled = true;
    };
  }, [player?.id, player?.teamId, player?.league, player?.season, competition, season]);
  const form = getFormStatus(player);
  const status = getStatusForPlayer(player);
  const price = getBudgetPrice(player);
  const projection = getProjectedPoints(player);
  const appearances = number(player.appearances);
  const recommendationScore = Math.min(100, Math.max(0, Math.round(
    number(item.score) * 0.65 +
    Math.min(100, appearances * 4) * 0.10 +
    Math.min(100, number(player.minutes) / 12) * 0.10 +
    Math.min(100, projection * 10) * 0.15
  )));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex min-w-0 items-center gap-3">
            {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Heuristic recommendation analysis</p>
              <h3 className="truncate text-lg font-black text-slate-900">{player.name}</h3>
              <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team} · {player.positionLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-500">✕</button>
        </div>

        <div className="grid gap-3 p-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Heuristic Recommendation Score</p>
            <p className="mt-1 text-4xl font-black text-emerald-600">{Math.round(item.score)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>{form.label}</span>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>{status.label}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fantasy value</p>
            <p className="mt-1 text-3xl font-black text-slate-900">€{price.toFixed(1)}m</p>
            <p className="mt-1 text-xs text-slate-500">{projection.toFixed(1)} heuristic GW points estimate</p>
            <p className="mt-1 text-[9px] font-bold text-slate-400">Flow Value, based on available statistics.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Heuristic recommendation score</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{recommendationScore}/100</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${recommendationScore}%` }} /></div>
            <p className="mt-2 text-[9px] text-slate-400">Projekta heuristiska rekomendācijas metrika, nevis statistiska ticamības varbūtība.</p>
          </div>

          <RecommendationExplanation item={item} pool={pool} weights={weights} />
          <RecommendationRecentForm player={player} fixtures={fixtureContext} loading={fixtureContextLoading} />
          <RecommendationNextFixtures player={player} fixtures={fixtureContext} standings={standings} loading={fixtureContextLoading} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Galvenie rādītāji</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[["Vārti", player.goals], ["Assist", player.assists], ["Flow", player.flowPoints], ["Minūtes", player.minutes], ["Vērtējums", number(player.advancedStats?.rating).toFixed(2)]].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value || 0}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


const RECOMMENDATION_STYLES = {
  attacking: { goals: 35, assists: 25, points: 30, rating: 10 },
  balanced: { goals: 25, assists: 20, points: 35, minutes: 10, rating: 10 },
  creator: { assists: 35, keyPasses: 30, points: 25, rating: 10 },
  defensive: { tackles: 25, interceptions: 25, points: 30, rating: 20 },
  goalscorer: { goals: 55, points: 25, rating: 10, minutes: 10 },
  form: { points: 60, rating: 25, minutes: 15 },
  value: { points: 40, goals: 20, assists: 15, minutes: 15, rating: 10 },
  allround: { goals: 20, assists: 20, points: 30, minutes: 15, rating: 15 },
};


export {
  RecommendationExplanation,
  RecommendationRecentForm,
  RecommendationNextFixtures,
  RecommendationFixture,
  RecommendationCompare,
  RecommendationDetail,
  RECOMMENDATION_STYLES,
};