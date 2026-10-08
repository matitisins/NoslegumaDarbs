import React, { useEffect, useMemo, useState } from "react";
import { fetchLeagueFixtures, fetchLeagueStandings } from "../../services/leagueFeatures";
import { PlayerMiniCard } from "./AnalyticsShared";
import {
  number,
  categories,
  metricDefinitions,
  weightedScore,
  getDifferentialScore,
} from "../../utils/analyticsUtils";
import {
  RankingExplanation,
  RankingFormTrend,
  RankingFixtureCard,
  RankingPlayerFixtureHistory,
  RankingPlayerDetail,
  RankingComparison,
} from "./RankingComponents";

function RankingTool({ players, competition, season }) {
  const [category, setCategory] = useState("STRIKERS");
  const [weights, setWeights] = useState({
    goals: 30,
    assists: 20,
    points: 30,
    minutes: 10,
    rating: 10,
  });
  const [preset, setPreset] = useState("custom");
  const [view, setView] = useState("ranking");
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [minMinutes, setMinMinutes] = useState(0);
  const [minAppearances, setMinAppearances] = useState(0);
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);
  const [comparisonModel, setComparisonModel] = useState({
    goals: 15,
    assists: 25,
    points: 25,
    minutes: 15,
    rating: 20,
  });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      fetchLeagueFixtures(competition, season).catch(() => ({ upcoming: [], recent: [] })),
      fetchLeagueStandings(competition, season).catch(() => []),
    ]).then(([fixtureData, table]) => {
      if (cancelled) return;
      setFixtures(fixtureData || { upcoming: [], recent: [] });
      setStandings(Array.isArray(table) ? table : []);
    });

    return () => {
      cancelled = true;
    };
  }, [competition, season]);

  const presets = {
    balanced: { goals: 25, assists: 20, points: 35, minutes: 10, rating: 10 },
    attacking: { goals: 40, assists: 25, points: 25, minutes: 5, rating: 5 },
    form: { goals: 10, assists: 15, points: 45, minutes: 5, rating: 25 },
    creator: { goals: 10, assists: 40, points: 25, minutes: 10, rating: 15 },
    consistency: { goals: 15, assists: 15, points: 25, minutes: 30, rating: 15 },
    custom: weights,
  };

  const basePool = useMemo(
    () => players.filter(player => {
      const categoryMatch = category === "ALL" || player.category === category;
      const minutesMatch = number(player.minutes) >= Number(minMinutes);
      const appearancesMatch = number(player.appearances) >= Number(minAppearances);
      const query = search.trim().toLowerCase();
      const searchMatch = !query ||
        String(player.name || "").toLowerCase().includes(query) ||
        String(player.team || "").toLowerCase().includes(query);
      return categoryMatch && minutesMatch && appearancesMatch && searchMatch;
    }),
    [players, category, minMinutes, minAppearances, search]
  );

  const ranking = useMemo(
    () => basePool
      .map(player => ({ player, score: weightedScore(player, weights, basePool) }))
      .sort((a, b) => b.score - a.score),
    [basePool, weights]
  );

  const actualRanking = useMemo(
    () => [...basePool].sort((a, b) => number(b.flowPoints) - number(a.flowPoints)),
    [basePool]
  );

  const valuePicks = useMemo(() => {
    return ranking
      .map((item, index) => {
        const actualIndex = actualRanking.findIndex(player => String(player.id) === String(item.player.id));
        const rankGap = actualIndex >= 0 ? (actualIndex + 1) - (index + 1) : 0;
        const differential = getDifferentialScore(item.player, basePool);
        return { ...item, rankGap, differential };
      })
      .filter(item => item.rankGap >= 2 || item.differential >= 18)
      .sort((a, b) => b.differential - a.differential)
      .slice(0, 8);
  }, [ranking, actualRanking, basePool]);

  const updateWeight = (key, value) => {
    setPreset("custom");
    setWeights(current => ({ ...current, [key]: Number(value) }));
  };

  const applyPreset = value => {
    setPreset(value);
    setWeights({ ...presets[value] });
  };

  const updateComparisonWeight = (key, value) => {
    setComparisonModel(current => ({ ...current, [key]: Number(value) }));
  };

  const exportRanking = () => {
    const header = ["Rank", "Player", "Team", "Position", "Goals", "Assists", "Minutes", "Flow Points", "Rating", "Custom Score"];
    const rows = ranking.slice(0, 50).map((item, index) => [
      index + 1,
      item.player.name || "",
      item.player.team || "",
      item.player.positionLabel || "",
      number(item.player.goals),
      number(item.player.assists),
      number(item.player.minutes),
      number(item.player.flowPoints),
      number(item.player.advancedStats?.rating).toFixed(2),
      item.score.toFixed(2),
    ]);

    const csv = [header, ...rows]
      .map(row => row.map(value => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `flow-ranking-${category.toLowerCase()}-${season}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <label className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Pozīcija</span>
          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400"
          >
            {categories.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-2">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Kritēriju svari</span>
            <span className="text-[9px] font-bold text-slate-400">Kopā: {Object.values(weights).reduce((sum, value) => sum + Number(value), 0)}%</span>
          </div>

          <div className="grid gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {Object.entries(weights).map(([key, value]) => (
              <label key={key}>
                <div className="mb-1 flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <span>{metricDefinitions.find(item => item.key === key)?.label || key}</span>
                  <span>{value}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={value}
                  onChange={event => updateWeight(key, event.target.value)}
                  className="w-full accent-emerald-500"
                />
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {[
          ["balanced", "⭐ Overall"],
          ["attacking", "⚽ Uzbrukums"],
          ["form", "🔥 Forma"],
          ["creator", "🎯 Radošums"],
          ["consistency", "🧱 Stabilitāte"],
          ["custom", "⚙️ Custom"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => value === "custom" ? setPreset("custom") : applyPreset(value)}
            className={`rounded-full border px-3 py-2 text-[9px] font-black transition ${
              preset === value
                ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-2">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="sm:col-span-2">
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Meklēt spēlētāju</span>
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Vārds vai komanda..."
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
              />
            </label>
            <label>
              <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Min. spēles</span>
              <input
                type="number"
                min="0"
                value={minAppearances}
                onChange={event => setMinAppearances(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400"
              />
            </label>
          </div>
          <label className="mt-3 block">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-wider text-slate-400">
              <span>Min. minūtes</span>
              <span>{minMinutes}</span>
            </div>
            <input
              type="range"
              min="0"
              max="2500"
              step="50"
              value={minMinutes}
              onChange={event => setMinMinutes(event.target.value)}
              className="mt-1 w-full accent-emerald-500"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={exportRanking}
          className="rounded-xl border border-slate-900 bg-slate-900 p-4 text-left text-white transition hover:bg-slate-800"
        >
          <span className="block text-lg">↓</span>
          <span className="mt-2 block text-sm font-black">Export Ranking</span>
          <span className="mt-1 block text-[10px] leading-4 text-white/60">Lejupielādē līdz 50 spēlētāju rezultātus CSV formātā.</span>
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {[
          ["ranking", "Custom Ranking"],
          ["performance", "Ranking vs Flow"],
          ["form", "Form Trend"],
          ["fixtures", "Fixture Difficulty"],
          ["value", "💎 Value Picks"],
          ["compare", "Compare Models"],
        ].map(([value, label]) => (
          <button
            type="button"
            key={value}
            onClick={() => setView(value)}
            className={`rounded-xl px-3 py-2 text-[9px] font-black transition ${
              view === value
                ? "bg-slate-900 text-white"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "compare" ? (
        <div>
          <div className="mb-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Modelis A</p>
              <p className="mt-1 text-sm font-black text-slate-900">Pašreizējais modelis</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(weights).map(([key, value]) => (
                  <div key={key} className="flex justify-between text-[9px] font-bold text-slate-500">
                    <span>{metricDefinitions.find(item => item.key === key)?.label || key}</span>
                    <span>{value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">Modelis B</p>
              <p className="mt-1 text-sm font-black text-slate-900">Alternatīvais modelis</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {Object.entries(comparisonModel).map(([key, value]) => (
                  <label key={key}>
                    <div className="mb-1 flex justify-between text-[8px] font-bold text-slate-500">
                      <span>{metricDefinitions.find(item => item.key === key)?.label || key}</span>
                      <span>{value}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={value}
                      onChange={event => updateComparisonWeight(key, event.target.value)}
                      className="w-full accent-emerald-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
          <RankingComparison modelA={weights} modelB={comparisonModel} pool={basePool} />
        </div>
      ) : view === "value" ? (
        <div>
          <div className="mb-4 rounded-2xl border border-violet-100 bg-violet-50 p-4">
            <p className="text-xs font-black text-violet-700">💎 Value Picks</p>
            <p className="mt-1 text-xs leading-5 text-violet-700/80">Spēlētāji, kuru Custom Ranking rezultāts ir būtiski labāks par viņu pašreizējo Flow vietu vai kuriem ir augsts differential rezultāts.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {valuePicks.length ? valuePicks.map((item, index) => (
              <PlayerMiniCard key={item.player.id} player={item.player} score={item.score} rank={index + 1} />
            )) : (
              <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center md:col-span-2">
                <p className="text-sm font-black text-slate-700">Pašlaik nav izteiktu Value Picks.</p>
                <p className="mt-1 text-xs text-slate-400">Pamēģini citu pozīciju vai svaru modeli.</p>
              </div>
            )}
          </div>
        </div>
      ) : view === "fixtures" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {ranking.slice(0, 10).map(item => (
            <RankingFixtureCard
              key={item.player.id}
              player={item.player}
              fixture={getRankingFixture(item.player, fixtures)}
              standings={standings}
            />
          ))}
        </div>
      ) : view === "form" ? (
        <div className="grid gap-3 md:grid-cols-2">
          {ranking.slice(0, 10).map(item => (
            <RankingFormTrend key={item.player.id} player={item.player} />
          ))}
        </div>
      ) : view === "performance" ? (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="grid grid-cols-[1fr_90px_90px] border-b border-slate-100 bg-slate-50 px-4 py-3 text-[9px] font-black uppercase tracking-wider text-slate-400">
            <span>Spēlētājs</span>
            <span className="text-center">Custom</span>
            <span className="text-center">Flow</span>
          </div>
          {ranking.slice(0, 15).map((item, index) => {
            const flowRank = actualRanking.findIndex(player => String(player.id) === String(item.player.id)) + 1;
            return (
              <div key={item.player.id} className="grid grid-cols-[1fr_90px_90px] items-center border-b border-slate-100 px-4 py-3 last:border-b-0">
                <div className="flex min-w-0 items-center gap-3">
                  {item.player.photo ? <img src={item.player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-slate-100" />}
                  <div className="min-w-0">
                    <p className="truncate text-xs font-black text-slate-900">{item.player.name}</p>
                    <p className="truncate text-[8px] font-bold uppercase tracking-wider text-slate-400">{item.player.team}</p>
                  </div>
                </div>
                <div className="text-center"><p className="text-sm font-black text-emerald-600">#{index + 1}</p><p className="text-[8px] text-slate-400">{Math.round(item.score)}</p></div>
                <div className="text-center"><p className="text-sm font-black text-slate-900">#{flowRank || "—"}</p><p className="text-[8px] text-slate-400">{number(item.player.flowPoints)} pts</p></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {ranking.slice(0, 15).map((item, index) => {
            const expanded = String(expandedId) === String(item.player.id);
            return (
              <div key={item.player.id} className="border-b border-slate-100 px-4 py-3.5 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setExpandedId(expanded ? null : item.player.id)}
                  className="flex w-full items-center gap-4 text-left"
                >
                  <div className="w-8 text-center text-sm font-black text-slate-300">{index + 1}</div>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {item.player.photo ? <img src={item.player.photo} alt="" className="h-9 w-9 rounded-full object-cover" /> : <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">PL</div>}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-slate-900">{item.player.name}</p>
                      <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{item.player.team} · {item.player.positionLabel}</p>
                    </div>
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-lg font-black text-emerald-600">{Math.round(item.score)}</p>
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Score</p>
                  </div>
                  <span className="hidden text-slate-300 sm:block">{expanded ? "⌃" : "⌄"}</span>
                </button>

                {expanded && (
                  <RankingPlayerDetail
                    item={item}
                    pool={basePool}
                    weights={weights}
                    fixtures={fixtures}
                    standings={standings}
                    competition={competition}
                    season={season}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


export default RankingTool;