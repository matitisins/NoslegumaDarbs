import React, { useEffect, useMemo, useState } from "react";
import { fetchPlayerFixtureContext } from "../../services/leagueFeatures";
import { PlayerMiniCard } from "./AnalyticsShared";
import {
  number,
  categories,
  weightedScore,
  getProjectedPoints,
  getFormStatus,
  getBudgetPrice,
  resolvePlayerTeam,
  getFixtureForTeam,
  getFixtureOpponent,
  getDifficulty,
} from "../../utils/analyticsUtils";
import {
  RecommendationExplanation,
  RecommendationRecentForm,
  RecommendationNextFixtures,
  RecommendationFixture,
  RecommendationCompare,
  RecommendationDetail,
  RECOMMENDATION_STYLES,
} from "./RecommendationComponents";

function RecommendationTool({ players, fixtures = { upcoming: [], recent: [] }, standings = [], competition = "PL", season = 2026 }) {
  const [category, setCategory] = useState("STRIKERS");
  const [style, setStyle] = useState("balanced");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [compare, setCompare] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [history, setHistory] = useState([]);

  /*
   * Keep recommendation history isolated per league.
   * Previously the key only contained category + style, so changing
   * leagues could reuse a snapshot created for another competition.
   * That is especially problematic when the player dataset changes shape.
   */
  const leagueKey = String(players?.[0]?.league || "PL").toUpperCase();
  const historyKey = `flow_recommendation_history_${leagueKey}_${category}_${style}`;

  const pool = useMemo(() => players.filter(player => category === "ALL" || player.category === category), [players, category]);
  const query = search.trim().toLowerCase();
  const filteredPool = useMemo(() => pool.filter(player => !query || String(player.name || "").toLowerCase().includes(query) || String(player.team || "").toLowerCase().includes(query)), [pool, query]);
  const weights = RECOMMENDATION_STYLES[style] || RECOMMENDATION_STYLES.balanced;

  const recommendations = useMemo(() => filteredPool.map(player => ({ player, score: weightedScore(player, weights, filteredPool) })).sort((a, b) => b.score - a.score).slice(0, 8), [filteredPool, weights]);

  const hiddenGems = useMemo(() => {
    const actual = [...filteredPool].sort((a, b) => number(b.flowPoints) - number(a.flowPoints));
    return filteredPool.map(player => {
      const flowRank = actual.findIndex(item => String(item.id) === String(player.id)) + 1;
      const score = weightedScore(player, weights, filteredPool);
      const price = getBudgetPrice(player);
      const value = price > 0 ? getProjectedPoints(player) / price : 0;
      return { player, score, flowRank, value };
    }).filter(item => item.flowRank > 0 && (item.score >= 60 || item.value >= 1.2)).sort((a, b) => (b.value * 10 + b.score) - (a.value * 10 + a.score)).slice(0, 6);
  }, [filteredPool, weights]);

  const fixtureFor = player => getFixtureForTeam(resolvePlayerTeam(player, standings), fixtures);

  const recommendationTeamIds = useMemo(() => {
    return recommendations
      .map(item => Number(resolvePlayerTeam(item.player, standings)?.teamId))
      .filter(id => Number.isInteger(id) && id > 0)
      .join(",");
  }, [recommendations, standings]);

  const [recommendationFixtureContexts, setRecommendationFixtureContexts] = useState({});

  useEffect(() => {
    let cancelled = false;

    const loadRecommendationFixtures = async () => {
      if (!recommendations.length) {
        setRecommendationFixtureContexts({});
        return;
      }

      const resolved = recommendations
        .map(item => resolvePlayerTeam(item.player, standings))
        .filter(player => {
          const teamId = Number(player?.teamId);
          return Number.isInteger(teamId) && teamId > 0;
        });

      if (!resolved.length) {
        setRecommendationFixtureContexts({});
        return;
      }

      const entries = await Promise.all(
        resolved.map(async player => {
          const teamId = Number(player.teamId);

          try {
            const data = await fetchPlayerFixtureContext(
              player,
              competition,
              season
            );

            return [
              String(teamId),
              {
                upcoming: Array.isArray(data?.upcoming)
                  ? data.upcoming.slice(0, 5)
                  : [],
                recent: Array.isArray(data?.recent)
                  ? data.recent.slice(0, 5)
                  : [],
              },
            ];
          } catch {
            return [
              String(teamId),
              { upcoming: [], recent: [] },
            ];
          }
        })
      );

      if (!cancelled) {
        setRecommendationFixtureContexts(
          Object.fromEntries(entries)
        );
      }
    };

    loadRecommendationFixtures();

    return () => {
      cancelled = true;
    };
  }, [recommendationTeamIds, competition, season]);

  const fixtureForRecommendation = player => {
    const resolvedPlayer = resolvePlayerTeam(player, standings);
    const teamId = Number(resolvedPlayer?.teamId);
    const teamContext = recommendationFixtureContexts[String(teamId)];

    if (teamContext?.upcoming?.length) {
      return teamContext.upcoming[0];
    }

    return getFixtureForTeam(resolvedPlayer, fixtures);
  };

  useEffect(() => {
    /* Reset transient recommendation UI when the league dataset changes. */
    setSelected(null);
    setCompare([]);
    setShowHidden(false);
  }, [leagueKey]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      setHistory(Array.isArray(parsed) ? parsed : []);
    } catch {
      /* A corrupted old localStorage value must never blank the app. */
      localStorage.removeItem(historyKey);
      setHistory([]);
    }
  }, [historyKey]);

  const recommendationHistorySignature = useMemo(
    () =>
      JSON.stringify(
        recommendations
          .slice(0, 5)
          .map(item => ({
            id: item.player.id,
            name: item.player.name,
            score: Math.round(item.score),
          }))
      ),
    [recommendations]
  );

  useEffect(() => {
    if (!recommendations.length) {
      setHistory(current =>
        current.length ? [] : current
      );
      return;
    }

    const snapshot = {
      date: new Date().toLocaleDateString("lv-LV"),
      top: recommendations
        .slice(0, 5)
        .map(item => ({
          id: item.player.id,
          name: item.player.name,
          score: Math.round(item.score),
        })),
    };

    try {
      const raw = localStorage.getItem(historyKey);
      const parsed = raw ? JSON.parse(raw) : [];
      const previous = Array.isArray(parsed)
        ? parsed
        : [];

      const first = previous[0];
      const same =
        first &&
        JSON.stringify(first.top) ===
          recommendationHistorySignature;

      /*
       * Do not call setHistory when the snapshot is already
       * the same. Calling setHistory with a newly parsed array
       * on every render creates an infinite render loop.
       */
      if (!same) {
        const next = [
          snapshot,
          ...previous,
        ].slice(0, 8);

        localStorage.setItem(
          historyKey,
          JSON.stringify(next)
        );

        setHistory(next);
      }
    } catch {
      /* Ignore storage failures; recommendations must still render. */
    }
  }, [
    recommendationHistorySignature,
    historyKey,
  ]);

  const toggleCompare = item => {
    setCompare(current => {
      const exists = current.some(candidate => String(candidate.player.id) === String(item.player.id));
      if (exists) return current.filter(candidate => String(candidate.player.id) !== String(item.player.id));
      if (current.length >= 3) return current;
      return [
        ...current,
        { ...item, player: resolvePlayerTeam(item.player, standings) },
      ];
    });
  };

  const presets = [
    ["balanced", "🧠 Sabalansēts"],
    ["goalscorer", "⚽ Goal Scorer"],
    ["creator", "🎯 Playmaker"],
    ["form", "🔥 Form"],
    ["defensive", "🛡️ Consistency"],
    ["value", "💎 Value"],
    ["allround", "⭐ All-round"],
  ];

  const getChange = player => {
    const old = history[1]?.top?.find(item => String(item.id) === String(player.id));
    const currentIndex = recommendations.findIndex(item => String(item.player.id) === String(player.id));
    const oldIndex = history[1]?.top?.findIndex(item => String(item.id) === String(player.id));
    if (oldIndex === undefined || oldIndex < 0 || currentIndex < 0) return null;
    const delta = oldIndex - currentIndex;
    return delta === 0 ? "—" : delta > 0 ? `↑ ${delta}` : `↓ ${Math.abs(delta)}`;
  };

  return (
    <div>
      <div className="mb-5 grid gap-3 md:grid-cols-2">
        <label className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Pozīcija</span>
          <select value={category} onChange={event => setCategory(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400">
            {categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Spēlētāja profils</span>
          <select value={style} onChange={event => setStyle(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400">
            {presets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {presets.map(([value, label]) => (
          <button key={value} type="button" onClick={() => setStyle(value)} className={`rounded-full border px-3 py-2 text-[9px] font-black transition ${style === value ? "border-emerald-300 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"}`}>{label}</button>
        ))}
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="🔎 Meklēt spēlētāju vai komandu..." className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-400" />
        <button type="button" onClick={() => setShowHidden(current => !current)} className={`rounded-xl border px-4 py-3 text-xs font-black ${showHidden ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600"}`}>💎 Hidden Gems</button>
        <button type="button" disabled={compare.length < 2} onClick={() => setSelected({ compare: true })} className="rounded-xl bg-slate-900 px-4 py-3 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">⚖️ Salīdzināt {compare.length}/3</button>
      </div>

      <div className="mb-5 rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-bold text-emerald-700">Kā darbojas rekomendācija?</p>
        <p className="mt-1 text-xs leading-5 text-emerald-700/80">Heuristisks Score no 0 līdz 100 apvieno statistiku, formu, spēles laiku un izvēlēto profilu. Tas ir salīdzinošs vērtējums, nevis veiksmes varbūtība.</p>
      </div>

      {showHidden ? (
        <div className="mb-5 rounded-2xl border border-violet-100 bg-violet-50 p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-violet-500">💎 Hidden Gems</p><p className="mt-1 text-xs text-violet-700/70">Spēlētāji ar labu Score un potenciāli labu vērtību.</p></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            {hiddenGems.map(item => <PlayerMiniCard key={item.player.id} player={item.player} score={item.score} rank={item.flowRank} />)}
          </div>
        </div>
      ) : null}

      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Top recommendations</p>
        <p className="text-[9px] font-bold text-slate-400">{filteredPool.length} spēlētāji</p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {recommendations.map((item, index) => {
          const player = item.player;
          const form = getFormStatus(player);
          const fixture = fixtureForRecommendation(player);
          const opponent = getFixtureOpponent(player, fixture);
          const difficulty = fixture ? getDifficulty(player, fixture, standings) : null;
          const change = getChange(player);
          const isCompared = compare.some(candidate => String(candidate.player.id) === String(player.id));
          return (
            <div key={player.id} className={`rounded-2xl border bg-white p-4 shadow-sm transition ${isCompared ? "border-violet-300 ring-2 ring-violet-100" : "border-slate-200 hover:border-emerald-200"}`}>
              <div className="flex items-center gap-3">
                {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">PL</div>}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-black text-slate-300">#{index + 1}</span><p className="truncate text-sm font-black text-slate-900">{player.name}</p></div>
                  <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team} · {player.positionLabel}</p>
                </div>
                <div className="text-right"><p className="text-xl font-black text-emerald-600">{Math.round(item.score)}</p><p className="text-[8px] font-bold uppercase text-slate-400">Score</p></div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-[7px] font-black uppercase text-slate-400">GW aplēse</p><p className="mt-1 text-xs font-black text-slate-900">{getProjectedPoints(player).toFixed(1)}</p></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-[7px] font-black uppercase text-slate-400">Cena</p><p className="mt-1 text-xs font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</p></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-[7px] font-black uppercase text-slate-400">Form</p><p className="mt-1 text-[9px] font-black">{form.label}</p></div>
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-[7px] font-black uppercase text-slate-400">Izmaiņa</p><p className="mt-1 text-xs font-black text-slate-900">{change || "—"}</p></div>
              </div>

              <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                <span>{opponent ? (opponent.isHome ? "🏠" : "✈️") : "📅"}</span>
                <p className="min-w-0 flex-1 truncate text-[9px] font-bold text-slate-600">{opponent ? `${opponent.isHome ? "vs" : "@"} ${opponent.name}` : "Nākamais mačs nav pieejams"}</p>
                {difficulty ? <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span> : null}
              </div>

              <div className="mt-3 flex gap-2">
                <button type="button" onClick={() => setSelected({ item: { ...item, player: resolvePlayerTeam(item.player, standings) } })} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800">Kāpēc ieteikts?</button>
                <button type="button" onClick={() => toggleCompare(item)} className={`rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-wider ${isCompared ? "border-violet-300 bg-violet-50 text-violet-700" : "border-slate-200 bg-white text-slate-600"}`}>{isCompared ? "✓ Salīdzināts" : "Salīdzināt"}</button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recommendation History</p><p className="mt-1 text-xs text-slate-500">Kas mainījies pēc datu atjaunošanas.</p></div><span className="rounded-full bg-slate-50 px-2 py-1 text-[8px] font-black text-slate-400">{history.length}</span></div>
          <div className="space-y-2">
            {history.slice(0, 4).map((entry, index) => <div key={`${entry.date}-${index}`} className="rounded-xl bg-slate-50 p-3"><div className="mb-1 flex justify-between"><span className="text-[8px] font-black uppercase tracking-wider text-slate-400">{entry.date}</span>{index === 0 ? <span className="text-[8px] font-black text-emerald-600">Pašreizējais</span> : null}</div><p className="text-xs font-bold text-slate-700">{entry.top.map(item => item.name).join(" · ")}</p></div>)}
            {!history.length ? <p className="text-xs text-slate-400">Vēsture parādīsies pēc pirmās rekomendācijas saglabāšanas.</p> : null}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recommendation logic</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[8px] font-black uppercase text-emerald-600">Heuristic Score</p><p className="mt-1 text-xs font-bold text-emerald-800">Statistikas svars pēc izvēlētā profila.</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">Form</p><p className="mt-1 text-xs font-bold text-slate-700">Pēdējie pieejamie formas rādītāji.</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">Fixture</p><p className="mt-1 text-xs font-bold text-slate-700">Nākamais pretinieks un grūtības pakāpe.</p></div>
            <div className="rounded-xl bg-violet-50 p-3"><p className="text-[8px] font-black uppercase text-violet-500">Value</p><p className="mt-1 text-xs font-bold text-violet-800">Flow Value pret prognozētajiem punktiem.</p></div>
          </div>
        </div>
      </div>

      {selected?.compare && compare.length >= 2 ? <RecommendationCompare items={compare} standings={standings} competition={competition} season={season} onClose={() => setSelected(null)} /> : null}
      {selected?.item ? <RecommendationDetail item={selected.item} pool={filteredPool} weights={weights} fixture={fixtureFor(selected.item.player)} standings={standings} competition={competition} season={season} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}


export default RecommendationTool;