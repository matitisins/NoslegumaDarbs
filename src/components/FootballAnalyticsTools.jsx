import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchApiSportsPlayers,
} from "../services/apiSports";

import {
  fetchLeagueFixtures,
  fetchLeagueStandings,
} from "../services/leagueFeatures";

const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const categories = [
  ["ALL", "Visi"],
  ["GOALKEEPERS", "Vārtsargi"],
  ["DEFENDERS", "Aizsargi"],
  ["MIDFIELDERS", "Pussargi"],
  ["STRIKERS", "Uzbrucēji"],
];

const categoryLabel = category =>
  categories.find(
    item => item[0] === category
  )?.[1] || category;

const metricDefinitions = [
  {
    key: "goals",
    label: "Vārti",
    get: player => player.goals,
  },
  {
    key: "assists",
    label: "Assist",
    get: player => player.assists,
  },
  {
    key: "points",
    label: "Flow punkti",
    get: player => player.points,
  },
  {
    key: "minutes",
    label: "Minūtes",
    get: player => player.minutes,
  },
  {
    key: "rating",
    label: "Vidējais vērtējums",
    get: player =>
      player?.advancedStats?.rating,
  },
  {
    key: "keyPasses",
    label: "Key passes",
    get: player =>
      player?.advancedStats?.keyPasses,
  },
  {
    key: "tackles",
    label: "Tackles",
    get: player =>
      player?.advancedStats?.tackles,
  },
  {
    key: "interceptions",
    label: "Interceptions",
    get: player =>
      player?.advancedStats?.interceptions,
  },
  {
    key: "saves",
    label: "Saves",
    get: player =>
      player?.advancedStats?.saves,
  },
];

const getMetric = (
  player,
  key
) => {
  const definition =
    metricDefinitions.find(
      item => item.key === key
    );

  return definition
    ? number(
        definition.get(player)
      )
    : 0;
};

const normalize = (
  value,
  min,
  max
) => {
  if (max <= min) return 50;

  return (
    ((value - min) /
      (max - min)) *
    100
  );
};

const weightedScore = (
  player,
  weights,
  pool
) => {
  const entries =
    Object.entries(weights).filter(
      ([, weight]) =>
        number(weight) > 0
    );

  if (!entries.length) return 0;

  let total = 0;
  let weightTotal = 0;

  entries.forEach(
    ([key, weight]) => {
      const values = pool.map(
        item =>
          getMetric(item, key)
      );

      const min = Math.min(
        ...values
      );
      const max = Math.max(
        ...values
      );

      total +=
        normalize(
          getMetric(
            player,
            key
          ),
          min,
          max
        ) *
        number(weight);

      weightTotal +=
        number(weight);
    }
  );

  return weightTotal > 0
    ? total / weightTotal
    : 0;
};

function PlayerMiniCard({
  player,
  score,
  rank,
  action,
  actionLabel,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        {player.photo ? (
          <img
            src={player.photo}
            alt=""
            className="h-11 w-11 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500">
            {String(
              player.name || "PL"
            )
              .split(" ")
              .map(part =>
                part[0]
              )
              .filter(Boolean)
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-black text-slate-900">
            {rank && (
              <span className="mr-2 text-slate-300">
                #{rank}
              </span>
            )}
            {player.name}
          </p>
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {player.team} · {player.positionLabel}
          </p>
        </div>

        {score !== undefined && (
          <div className="text-right">
            <p className="text-lg font-black text-emerald-600">
              {Math.round(score)}
            </p>
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              Score
            </p>
          </div>
        )}
      </div>

      {action && (
        <button
          type="button"
          onClick={action}
          className="mt-3 w-full rounded-lg bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-white hover:bg-slate-800"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

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
          <p className="mt-1 text-sm font-black text-slate-900">{item.player.name} · {Math.round(item.score)} Score</p>
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

function RecommendationFormTrend({ player }) {
  const values = playerRecentForm(player).slice(-5);
  const safeValues = values.length ? values : [getProjectedPoints(player)];
  const max = Math.max(...safeValues, 1);
  const min = Math.min(...safeValues, 0);
  const range = Math.max(max - min, 1);
  const trend = safeValues.length > 1 ? safeValues[safeValues.length - 1] - safeValues[0] : 0;
  const label = trend > 0.25 ? "↑ Uzlabojas" : trend < -0.25 ? "↓ Krītas" : "→ Stabils";
  const tone = trend > 0.25 ? "text-emerald-600" : trend < -0.25 ? "text-rose-600" : "text-amber-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recent form</p>
          <p className={`mt-1 text-xs font-black ${tone}`}>{label}</p>
        </div>
        <span className="text-[9px] font-bold text-slate-400">Pēdējie {safeValues.length}</span>
      </div>
      <div className="flex h-24 items-end gap-2">
        {safeValues.map((value, index) => {
          const height = 18 + ((value - min) / range) * 82;
          return (
            <div key={`${index}-${value}`} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[8px] font-black text-slate-500">{number(value).toFixed(1)}</span>
              <div className="w-full rounded-t-lg bg-emerald-400" style={{ height: `${height}%` }} />
              <span className="text-[7px] font-bold text-slate-300">GW {index + 1}</span>
            </div>
          );
        })}
      </div>
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

function RecommendationCompare({ items, onClose }) {
  const players = items.map(item => item.player);
  const rows = [
    ["Score", item => Math.round(item.score)],
    ["GW prognoze", item => getProjectedPoints(item.player).toFixed(1)],
    ["Flow punkti", item => number(item.player.points)],
    ["Vārti", item => number(item.player.goals)],
    ["Assist", item => number(item.player.assists)],
    ["Minūtes", item => number(item.player.minutes)],
    ["Vērtējums", item => number(item.player.advancedStats?.rating).toFixed(2)],
    ["Cena", item => `${getBudgetPrice(item.player).toFixed(1)}m`],
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-4xl overflow-auto rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Spēlētāju salīdzinājums</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">Recommended players</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-500">✕</button>
        </div>
        <div className="min-w-[620px] p-5">
          <div className="grid grid-cols-[150px_repeat(3,minmax(150px,1fr))] gap-2">
            <div />
            {items.map(item => (
              <div key={item.player.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-center">
                {item.player.photo ? <img src={item.player.photo} alt="" className="mx-auto h-12 w-12 rounded-full object-cover" /> : null}
                <p className="mt-2 truncate text-xs font-black text-slate-900">{item.player.name}</p>
                <p className="truncate text-[8px] font-bold uppercase text-slate-400">{item.player.team}</p>
              </div>
            ))}
            {rows.map(([label, getter]) => (
              <React.Fragment key={label}>
                <div className="flex items-center rounded-xl bg-slate-50 px-3 text-[9px] font-black uppercase tracking-wider text-slate-500">{label}</div>
                {items.map(item => <div key={`${label}-${item.player.id}`} className="flex items-center justify-center rounded-xl border border-slate-100 p-3 text-sm font-black text-slate-900">{getter(item)}</div>)}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationDetail({ item, pool, weights, fixture, standings, onClose }) {
  const player = item.player;
  const form = getFormStatus(player);
  const status = getStatusForPlayer(player);
  const price = getBudgetPrice(player);
  const projection = getProjectedPoints(player);
  const appearances = number(player.appearances);
  const confidence = Math.min(98, Math.max(35, Math.round(55 + Math.min(25, appearances * 2) + Math.min(18, number(player.minutes) / 100) + Math.min(10, projection))));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-slate-200 bg-slate-50 shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-slate-100 bg-white p-5">
          <div className="flex min-w-0 items-center gap-3">
            {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Recommendation analysis</p>
              <h3 className="truncate text-lg font-black text-slate-900">{player.name}</h3>
              <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team} · {player.positionLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-500">✕</button>
        </div>

        <div className="grid gap-3 p-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recommendation Score</p>
            <p className="mt-1 text-4xl font-black text-emerald-600">{Math.round(item.score)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>{form.label}</span>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>{status.label}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fantasy value</p>
            <p className="mt-1 text-3xl font-black text-slate-900">€{price.toFixed(1)}m</p>
            <p className="mt-1 text-xs text-slate-500">{projection.toFixed(1)} projected GW points</p>
            <p className="mt-1 text-[9px] font-bold text-slate-400">Flow Value, based on available statistics.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Recommendation confidence</p>
            <p className="mt-1 text-3xl font-black text-slate-900">{confidence}%</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${confidence}%` }} /></div>
            <p className="mt-2 text-[9px] text-slate-400">Confidence is based on available minutes, appearances, form and statistical coverage.</p>
          </div>

          <RecommendationExplanation item={item} pool={pool} weights={weights} />
          <RecommendationFormTrend player={player} />
          <RecommendationFixture player={player} fixture={fixture} standings={standings} />

          <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Galvenie rādītāji</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {[["Vārti", player.goals], ["Assist", player.assists], ["Flow", player.points], ["Minūtes", player.minutes], ["Vērtējums", number(player.advancedStats?.rating).toFixed(2)]].map(([label, value]) => (
                <div key={label} className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-slate-900">{value || 0}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RecommendationTool({ players, fixtures = { upcoming: [], recent: [] }, standings = [] }) {
  const [category, setCategory] = useState("STRIKERS");
  const [style, setStyle] = useState("balanced");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [compare, setCompare] = useState([]);
  const [showHidden, setShowHidden] = useState(false);
  const [history, setHistory] = useState([]);

  const styles = {
    attacking: { goals: 35, assists: 25, points: 30, rating: 10 },
    balanced: { goals: 25, assists: 20, points: 35, minutes: 10, rating: 10 },
    creator: { assists: 35, keyPasses: 30, points: 25, rating: 10 },
    defensive: { tackles: 25, interceptions: 25, points: 30, rating: 20 },
    goalscorer: { goals: 55, points: 25, rating: 10, minutes: 10 },
    form: { points: 60, rating: 25, minutes: 15 },
    value: { points: 40, goals: 20, assists: 15, minutes: 15, rating: 10 },
    allround: { goals: 20, assists: 20, points: 30, minutes: 15, rating: 15 },
  };

  const pool = useMemo(() => players.filter(player => category === "ALL" || player.category === category), [players, category]);
  const query = search.trim().toLowerCase();
  const filteredPool = useMemo(() => pool.filter(player => !query || String(player.name || "").toLowerCase().includes(query) || String(player.team || "").toLowerCase().includes(query)), [pool, query]);
  const weights = styles[style] || styles.balanced;

  const recommendations = useMemo(() => filteredPool.map(player => ({ player, score: weightedScore(player, weights, filteredPool) })).sort((a, b) => b.score - a.score).slice(0, 8), [filteredPool, weights]);

  const hiddenGems = useMemo(() => {
    const actual = [...filteredPool].sort((a, b) => number(b.points) - number(a.points));
    return filteredPool.map(player => {
      const flowRank = actual.findIndex(item => String(item.id) === String(player.id)) + 1;
      const score = weightedScore(player, weights, filteredPool);
      const price = getBudgetPrice(player);
      const value = price > 0 ? getProjectedPoints(player) / price : 0;
      return { player, score, flowRank, value };
    }).filter(item => item.flowRank > 0 && (item.score >= 60 || item.value >= 1.2)).sort((a, b) => (b.value * 10 + b.score) - (a.value * 10 + a.score)).slice(0, 6);
  }, [filteredPool, weights]);

  const fixtureFor = player => getFixtureForTeam(player, fixtures);

  useEffect(() => {
    const key = `flow_recommendation_history_${category}_${style}`;
    const raw = localStorage.getItem(key);
    setHistory(raw ? JSON.parse(raw) : []);
  }, [category, style]);

  useEffect(() => {
    if (!recommendations.length) return;
    const key = `flow_recommendation_history_${category}_${style}`;
    const snapshot = {
      date: new Date().toLocaleDateString("lv-LV"),
      top: recommendations.slice(0, 5).map(item => ({ id: item.player.id, name: item.player.name, score: Math.round(item.score) })),
    };
    const raw = localStorage.getItem(key);
    const previous = raw ? JSON.parse(raw) : [];
    const first = previous[0];
    const same = first && JSON.stringify(first.top) === JSON.stringify(snapshot.top);
    if (!same) {
      const next = [snapshot, ...previous].slice(0, 8);
      localStorage.setItem(key, JSON.stringify(next));
      setHistory(next);
    }
  }, [recommendations, category, style]);

  const toggleCompare = item => {
    setCompare(current => {
      const exists = current.some(candidate => String(candidate.player.id) === String(item.player.id));
      if (exists) return current.filter(candidate => String(candidate.player.id) !== String(item.player.id));
      if (current.length >= 3) return current;
      return [...current, item];
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
        <p className="mt-1 text-xs leading-5 text-emerald-700/80">Flow normalizē izvēlētās līgas spēlētāju statistiku un aprēķina profila Score. Rezultāts apvieno statistiku, formu, spēles laiku un izvēlēto profilu.</p>
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
          const fixture = fixtureFor(player);
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
                <div className="rounded-lg bg-slate-50 p-2"><p className="text-[7px] font-black uppercase text-slate-400">GW</p><p className="mt-1 text-xs font-black text-slate-900">{getProjectedPoints(player).toFixed(1)}</p></div>
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
                <button type="button" onClick={() => setSelected({ item })} className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800">Kāpēc ieteikts?</button>
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
            <div className="rounded-xl bg-emerald-50 p-3"><p className="text-[8px] font-black uppercase text-emerald-600">Score</p><p className="mt-1 text-xs font-bold text-emerald-800">Statistikas svars pēc izvēlētā profila.</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">Form</p><p className="mt-1 text-xs font-bold text-slate-700">Pēdējie pieejamie formas rādītāji.</p></div>
            <div className="rounded-xl bg-slate-50 p-3"><p className="text-[8px] font-black uppercase text-slate-400">Fixture</p><p className="mt-1 text-xs font-bold text-slate-700">Nākamais pretinieks un grūtības pakāpe.</p></div>
            <div className="rounded-xl bg-violet-50 p-3"><p className="text-[8px] font-black uppercase text-violet-500">Value</p><p className="mt-1 text-xs font-bold text-violet-800">Flow Value pret prognozētajiem punktiem.</p></div>
          </div>
        </div>
      </div>

      {selected?.compare && compare.length >= 2 ? <RecommendationCompare items={compare} onClose={() => setSelected(null)} /> : null}
      {selected?.item ? <RecommendationDetail item={selected.item} pool={filteredPool} weights={weights} fixture={fixtureFor(selected.item.player)} standings={standings} onClose={() => setSelected(null)} /> : null}
    </div>
  );
}

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

function RankingPlayerDetail({ item, pool, weights, fixtures, standings }) {
  const player = item.player;
  const fixture = getRankingFixture(player, fixtures);
  const status = getStatusForPlayer(player);
  const form = getFormStatus(player);
  const differential = getDifferentialScore(player, pool);
  const flow = number(player.points);
  const actualRank = [...pool]
    .sort((a, b) => number(b.points) - number(a.points))
    .findIndex(candidate => String(candidate.id) === String(player.id)) + 1;

  return (
    <div className="mt-3 grid gap-3 lg:grid-cols-3">
      <RankingExplanation item={item} pool={pool} weights={weights} />

      <RankingFormTrend player={player} />

      <RankingFixtureCard player={player} fixture={fixture} standings={standings} />

      <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:col-span-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Custom Score</p>
            <p className="mt-1 text-xl font-black text-emerald-600">{Math.round(item.score)}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Flow punkti</p>
            <p className="mt-1 text-xl font-black text-slate-900">{flow}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Flow vieta</p>
            <p className="mt-1 text-xl font-black text-slate-900">#{actualRank || "—"}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Differential</p>
            <p className="mt-1 text-xl font-black text-violet-600">{differential}</p>
          </div>
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Status</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>{form.label}</span>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>{status.label}</span>
            </div>
          </div>
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
    () => [...basePool].sort((a, b) => number(b.points) - number(a.points)),
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
      number(item.player.points),
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
                <div className="text-center"><p className="text-sm font-black text-slate-900">#{flowRank || "—"}</p><p className="text-[8px] text-slate-400">{number(item.player.points)} pts</p></div>
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

const formationPositions = {
  "4-3-3": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 25, y: 45 },
    { category: "MIDFIELDERS", x: 50, y: 40 },
    { category: "MIDFIELDERS", x: 75, y: 45 },
    { category: "STRIKERS", x: 18, y: 20 },
    { category: "STRIKERS", x: 50, y: 13 },
    { category: "STRIKERS", x: 82, y: 20 },
  ],
  "4-4-2": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 14, y: 44 },
    { category: "MIDFIELDERS", x: 38, y: 42 },
    { category: "MIDFIELDERS", x: 62, y: 42 },
    { category: "MIDFIELDERS", x: 86, y: 44 },
    { category: "STRIKERS", x: 37, y: 18 },
    { category: "STRIKERS", x: 63, y: 18 },
  ],
  "3-4-3": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 25, y: 67 },
    { category: "DEFENDERS", x: 50, y: 67 },
    { category: "DEFENDERS", x: 75, y: 67 },
    { category: "MIDFIELDERS", x: 12, y: 44 },
    { category: "MIDFIELDERS", x: 38, y: 42 },
    { category: "MIDFIELDERS", x: 62, y: 42 },
    { category: "MIDFIELDERS", x: 88, y: 44 },
    { category: "STRIKERS", x: 18, y: 20 },
    { category: "STRIKERS", x: 50, y: 13 },
    { category: "STRIKERS", x: 82, y: 20 },
  ],
  "3-5-2": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 25, y: 67 },
    { category: "DEFENDERS", x: 50, y: 67 },
    { category: "DEFENDERS", x: 75, y: 67 },
    { category: "MIDFIELDERS", x: 10, y: 45 },
    { category: "MIDFIELDERS", x: 30, y: 40 },
    { category: "MIDFIELDERS", x: 50, y: 45 },
    { category: "MIDFIELDERS", x: 70, y: 40 },
    { category: "MIDFIELDERS", x: 90, y: 45 },
    { category: "STRIKERS", x: 37, y: 18 },
    { category: "STRIKERS", x: 63, y: 18 },
  ],
  "4-2-3-1": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 38, y: 48 },
    { category: "MIDFIELDERS", x: 62, y: 48 },
    { category: "MIDFIELDERS", x: 22, y: 30 },
    { category: "MIDFIELDERS", x: 50, y: 30 },
    { category: "MIDFIELDERS", x: 78, y: 30 },
    { category: "STRIKERS", x: 50, y: 13 },
  ],
};

const formationNames = Object.keys(formationPositions);

const categoryShortLabel = {
  ALL: "Spēlētājs",
  GOALKEEPERS: "Vārtsargs",
  DEFENDERS: "Aizsargs",
  MIDFIELDERS: "Pussargs",
  STRIKERS: "Uzbrucējs",
};

const positionColor = {
  GOALKEEPERS: "bg-amber-400",
  DEFENDERS: "bg-sky-500",
  MIDFIELDERS: "bg-emerald-500",
  STRIKERS: "bg-rose-500",
};

const toFiniteNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const playerRecentForm = player => {
  const raw = Array.isArray(player?.recentForm)
    ? player.recentForm
    : [];

  const values = raw
    .map(item => {
      if (typeof item === "number") return item;
      return toFiniteNumber(
        item?.value ?? item?.points ?? item?.score
      );
    })
    .filter(value => Number.isFinite(value));

  if (values.length) return values;

  const formMetrics = Array.isArray(player?.formMetrics)
    ? player.formMetrics
    : [];

  const points = formMetrics.find(
    item => String(item?.label || "").toLowerCase() === "punkti"
  );

  const appearances = toFiniteNumber(player?.appearances);
  const seasonPoints = toFiniteNumber(points?.value ?? player?.points);

  return appearances > 0
    ? [seasonPoints / appearances]
    : seasonPoints > 0
      ? [seasonPoints]
      : [];
};

const getProjectedPoints = player => {
  const values = playerRecentForm(player);

  if (values.length) {
    return Math.max(
      0,
      values.reduce((sum, value) => sum + value, 0) / values.length
    );
  }

  const appearances = toFiniteNumber(player?.appearances);
  const points = toFiniteNumber(player?.points);

  return appearances > 0 ? Math.max(0, points / appearances) : Math.max(0, points);
};

const getFormAverage = player => getProjectedPoints(player);

const getFormStatus = player => {
  const form = getFormAverage(player);

  if (form >= 8) return { label: "🔥 Karsta forma", tone: "text-orange-600 bg-orange-50 border-orange-200" };
  if (form >= 6) return { label: "🟢 Laba forma", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (form >= 4) return { label: "🟡 Vidēja forma", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "🔴 Vāja forma", tone: "text-rose-700 bg-rose-50 border-rose-200" };
};

const getFlowValue = player => {
  const positionBase = {
    GOALKEEPERS: 4.5,
    DEFENDERS: 5.0,
    MIDFIELDERS: 7.0,
    STRIKERS: 8.0,
  }[player?.category] || 6;

  const form = getFormAverage(player);
  const rating = toFiniteNumber(player?.advancedStats?.rating);
  const minutes = toFiniteNumber(player?.minutes);
  const appearances = toFiniteNumber(player?.appearances);
  const goals = toFiniteNumber(player?.goals);
  const assists = toFiniteNumber(player?.assists);

  const reliability = Math.min(3, appearances / 8);
  const attacking = Math.min(6, goals * 0.35 + assists * 0.2);
  const ratingBonus = Math.max(0, rating - 6.5) * 1.5;
  const formBonus = Math.min(4, form * 0.25);
  const minutesBonus = Math.min(3, minutes / 600);

  return Math.round(
    (positionBase + reliability + attacking + ratingBonus + formBonus + minutesBonus) * 10
  ) / 10;
};

const getBudgetPrice = player => {
  const value = getFlowValue(player);
  return Math.round(value * 10) / 10;
};

const getPositionStrength = (players, category) => {
  const values = players
    .filter(player => player?.category === category)
    .map(player => getProjectedPoints(player));

  if (!values.length) return 0;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(100, Math.round(average * 10));
};

const sortByProjection = players =>
  [...players].sort((a, b) => getProjectedPoints(b) - getProjectedPoints(a));

const getBestForCategory = (players, category, excluded = new Set()) =>
  sortByProjection(
    players.filter(
      player =>
        player?.category === category &&
        !excluded.has(String(player.id))
    )
  )[0] || null;

const getFormattedFixtureDate = fixture => {
  const date = fixture?.fixture?.date;
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("lv-LV", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const getFixtureForTeam = (player, fixtures) => {
  const teamId = Number(player?.teamId);
  if (!teamId) return null;

  const upcoming = Array.isArray(fixtures?.upcoming)
    ? fixtures.upcoming
    : [];

  return (
    upcoming.find(fixture => {
      const homeId = Number(fixture?.teams?.home?.id);
      const awayId = Number(fixture?.teams?.away?.id);
      return homeId === teamId || awayId === teamId;
    }) || null
  );
};

const getFixtureOpponent = (player, fixture) => {
  if (!fixture) return null;

  const teamId = Number(player?.teamId);
  const home = fixture?.teams?.home;
  const away = fixture?.teams?.away;

  if (Number(home?.id) === teamId) {
    return {
      name: away?.name || "Nezināms",
      logo: away?.logo || null,
      isHome: true,
      venue: fixture?.fixture?.venue?.name || null,
    };
  }

  if (Number(away?.id) === teamId) {
    return {
      name: home?.name || "Nezināms",
      logo: home?.logo || null,
      isHome: false,
      venue: fixture?.fixture?.venue?.name || null,
    };
  }

  return null;
};

const getDifficulty = (player, fixture, standings) => {
  const opponent = getFixtureOpponent(player, fixture);
  if (!opponent) return { score: 3, label: "Vidēja", tone: "bg-amber-50 text-amber-700 border-amber-200" };

  const row = standings.find(
    item => Number(item?.team?.id) === Number(
      fixture?.teams?.home?.id === player?.teamId
        ? fixture?.teams?.away?.id
        : fixture?.teams?.home?.id
    )
  );

  const position = Number(row?.position);

  if (!position) return { score: 3, label: "Vidēja", tone: "bg-amber-50 text-amber-700 border-amber-200" };

  const totalTeams = Math.max(standings.length, 20);
  const ratio = position / totalTeams;
  const score = ratio <= 0.2 ? 5 : ratio <= 0.4 ? 4 : ratio <= 0.65 ? 3 : ratio <= 0.82 ? 2 : 1;

  const labels = {
    1: "Ļoti viegla",
    2: "Viegla",
    3: "Vidēja",
    4: "Grūta",
    5: "Ļoti grūta",
  };

  const tones = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200",
    2: "bg-lime-50 text-lime-700 border-lime-200",
    3: "bg-amber-50 text-amber-700 border-amber-200",
    4: "bg-orange-50 text-orange-700 border-orange-200",
    5: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return {
    score,
    label: labels[score],
    tone: tones[score],
    opponentPosition: position,
  };
};

const getDifferentialScore = (player, players) => {
  const categoryPlayers = players.filter(
    candidate => candidate.category === player.category
  );

  if (!categoryPlayers.length) return 0;

  const sorted = sortByProjection(categoryPlayers);
  const rank = sorted.findIndex(
    candidate => String(candidate.id) === String(player.id)
  );

  const rankBonus = Math.max(0, 20 - rank * 1.5);
  const formBonus = Math.min(15, getFormAverage(player) * 1.5);
  const minutesBonus = Math.min(10, toFiniteNumber(player.minutes) / 120);

  return Math.round((rankBonus + formBonus + minutesBonus) * 10) / 10;
};

const getStatusForPlayer = player => {
  if (player?.injured) {
    return {
      label: "⚠️ Traumas risks",
      tone: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  const minutes = toFiniteNumber(player?.minutes);
  const appearances = toFiniteNumber(player?.appearances);

  if (appearances > 0 && minutes / appearances >= 70) {
    return {
      label: "🟢 Regulārs starteris",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  return {
    label: "🟡 Spēles laiks jāpārbauda",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  };
};

function FantasyPlayerComparison({ player, players, fixture, standings }) {
  const opponent = getFixtureOpponent(player, fixture);
  const difficulty = getDifficulty(player, fixture, standings);
  const form = getFormStatus(player);
  const status = getStatusForPlayer(player);
  const projection = getProjectedPoints(player);
  const differential = getDifferentialScore(player, players);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">GW prognoze</p>
          <p className="mt-1 text-lg font-black text-emerald-600">{projection.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Forma</p>
          <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>
            {form.label}
          </span>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
          <p className="mt-1 text-xs font-black text-slate-700">
            {opponent ? `${opponent.isHome ? "🏠" : "✈️"} ${opponent.name}` : "Nav pieejama"}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Cena</p>
          <p className="mt-1 text-xs font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>
          {status.label}
        </span>
        {opponent && (
          <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>
            Grūtība {difficulty.score}/5 · {difficulty.label}
          </span>
        )}
        {player?.injured && (
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[8px] font-black text-rose-700">
            API norāda injury statusu
          </span>
        )}
      </div>
    </div>
  );
}

function FantasyPlayerPicker({ category, players, selectedIds, onSelect, onClose, fixtures, standings }) {
  const [search, setSearch] = useState("");
  const [comparisonPlayer, setComparisonPlayer] = useState(null);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortByProjection(
      players.filter(player => {
        if (category !== "ALL" && player?.category !== category) return false;
        if (selectedIds.has(String(player.id))) return false;
        if (!query) return true;

        return (
          String(player.name || "").toLowerCase().includes(query) ||
          String(player.team || "").toLowerCase().includes(query)
        );
      })
    ).slice(0, 40);
  }, [players, category, selectedIds, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Spēlētāja izvēle</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{categoryShortLabel[category]}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 hover:bg-slate-100">✕</button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Meklēt spēlētāju vai komandu..."
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white"
          />
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-4">
          {available.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {available.map(player => {
                const form = getFormStatus(player);
                const fixture = getFixtureForTeam(player, fixtures);
                const opponent = getFixtureOpponent(player, fixture);
                const difficulty = getDifficulty(player, fixture, standings);

                return (
                  <div key={player.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {player.photo ? (
                        <img src={player.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">PL</div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-slate-900">{player.name}</p>
                        <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black ${form.tone}`}>{form.label}</span>
                          {player.injured && <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[7px] font-black text-rose-700">⚠️ Injury</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">{getProjectedPoints(player).toFixed(1)}</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">GW</p>
                        <p className="mt-1 text-sm font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Cena</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1 text-[8px]">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Vārti</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.goals)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Assist</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.assists)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Minūtes</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.minutes)}</p>
                      </div>
                    </div>

                    {opponent && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
                        <span className="text-[8px] font-bold text-slate-500">{opponent.isHome ? "🏠 Mājas" : "✈️ Izbraukumā"} · {opponent.name}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => onSelect(player)} className="rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800">Izvēlēties</button>
                      <button type="button" onClick={() => setComparisonPlayer(player)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50">Salīdzināt</button>
                    </div>

                    {comparisonPlayer?.id === player.id && (
                      <FantasyPlayerComparison player={player} players={players} fixture={fixture} standings={standings} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <p className="text-sm font-bold text-slate-600">Nav pieejamu spēlētāju</p>
              <p className="mt-1 text-xs text-slate-400">Izvēlies citu spēlētāju vai maini meklēšanu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerSlot({ slot, player, onOpen, onRemove, onCaptain, onViceCaptain, isCaptain, isViceCaptain, fixture, standings }) {
  const form = player ? getFormStatus(player) : null;
  const opponent = player ? getFixtureOpponent(player, fixture) : null;
  const difficulty = player ? getDifficulty(player, fixture, standings) : null;

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
      {player ? (
        <div className="group relative w-[82px] sm:w-[98px]">
          <button
            type="button"
            onClick={onOpen}
            className={`w-full rounded-xl border p-1.5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
              isCaptain ? "border-amber-300 bg-amber-50" : isViceCaptain ? "border-violet-300 bg-violet-50" : "border-white/80 bg-white"
            }`}
            title="Nomainīt spēlētāju"
          >
            <div className="relative mx-auto h-9 w-9 sm:h-11 sm:w-11">
              {player.photo ? (
                <img src={player.photo} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">PL</div>
              )}

              {isCaptain && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-white">C</span>}
              {!isCaptain && isViceCaptain && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[8px] font-black text-white">V</span>}
              {player.injured && <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">!</span>}
            </div>

            <p className="mt-1 truncate text-[9px] font-black text-slate-900 sm:text-[10px]">{player.name}</p>
            <div className="mt-0.5 flex items-center justify-center gap-1.5">
              <span className="text-[8px] font-bold text-emerald-600">{getProjectedPoints(player).toFixed(1)} GW</span>
              <span className="text-[8px] font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</span>
            </div>
          </button>

          <button type="button" onClick={onRemove} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-sm font-black leading-none text-white shadow-md hover:bg-rose-500" title="Noņemt spēlētāju">−</button>

          <div className="mt-1 flex gap-1">
            <button type="button" onClick={onCaptain} className={`flex-1 rounded-md px-1 py-0.5 text-[7px] font-black uppercase tracking-wider ${isCaptain ? "bg-amber-100 text-amber-700" : "bg-white/90 text-slate-400 hover:text-slate-700"}`}>{isCaptain ? "C" : "Kapteinis"}</button>
            <button type="button" onClick={onViceCaptain} className={`flex-1 rounded-md px-1 py-0.5 text-[7px] font-black uppercase tracking-wider ${isViceCaptain ? "bg-violet-100 text-violet-700" : "bg-white/90 text-slate-400 hover:text-slate-700"}`}>{isViceCaptain ? "V" : "Vice"}</button>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-48 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-left text-white shadow-xl group-hover:block">
            <p className="text-[10px] font-black">{player.name}</p>
            <p className="mt-1 text-[8px] text-slate-300">{form?.label}</p>
            {opponent && <p className="mt-1 text-[8px] text-slate-300">{opponent.isHome ? "🏠" : "✈️"} {opponent.name} · grūtība {difficulty?.score}/5</p>}
            <p className="mt-1 text-[8px] text-emerald-300">GW prognoze: {getProjectedPoints(player).toFixed(1)}</p>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onOpen} className="group flex w-[68px] flex-col items-center sm:w-[82px]" title={`Pievienot ${categoryShortLabel[slot.category]}`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white bg-slate-900/70 text-2xl font-light text-white shadow-lg transition group-hover:scale-105 group-hover:bg-emerald-500 sm:h-14 sm:w-14">+</span>
          <span className="mt-1 max-w-full truncate rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white sm:text-[8px]">{categoryShortLabel[slot.category]}</span>
        </button>
      )}
    </div>
  );
}

function FantasyPitch({ formation, slots, selectedPlayers, captainId, viceCaptainId, onOpen, onRemove, onCaptain, onViceCaptain, fixtures, standings }) {
  return (
    <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[28px] border-4 border-white bg-emerald-700 shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(90deg,rgba(255,255,255,.035)_50%,transparent_50%)] bg-[length:25%_100%]">
        <div className="absolute inset-0 border-2 border-white/60" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute left-1/2 top-0 h-1/4 w-2/5 -translate-x-1/2 border-2 border-t-0 border-white/60" />
        <div className="absolute left-1/2 bottom-0 h-1/4 w-2/5 -translate-x-1/2 border-2 border-b-0 border-white/60" />
        <div className="absolute left-1/2 top-0 h-10 w-1/5 -translate-x-1/2 border-2 border-t-0 border-white/60" />
        <div className="absolute left-1/2 bottom-0 h-10 w-1/5 -translate-x-1/2 border-2 border-b-0 border-white/60" />

        {slots.map((slot, index) => (
          <PlayerSlot
            key={`${formation}-${slot.category}-${index}`}
            slot={slot}
            player={selectedPlayers[index] || null}
            isCaptain={String(selectedPlayers[index]?.id) === String(captainId)}
            isViceCaptain={String(selectedPlayers[index]?.id) === String(viceCaptainId)}
            onOpen={() => onOpen(index, slot.category)}
            onRemove={() => onRemove(index)}
            onCaptain={() => onCaptain(index)}
            onViceCaptain={() => onViceCaptain(index)}
            fixture={getFixtureForTeam(selectedPlayers[index], fixtures)}
            standings={standings}
          />
        ))}
      </div>
    </div>
  );
}

function TeamStrengthCard({ players }) {
  const strengths = [
    ["GOALKEEPERS", "Vārtsargi"],
    ["DEFENDERS", "Aizsargi"],
    ["MIDFIELDERS", "Pussargi"],
    ["STRIKERS", "Uzbrucēji"],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Komandas spēks</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Pēc izvēlētā XI</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">FLOW</span>
      </div>

      <div className="space-y-3">
        {strengths.map(([category, label]) => {
          const value = getPositionStrength(players, category);
          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-900">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormationAnalysis({ players }) {
  const results = useMemo(() => {
    return formationNames.map(formation => {
      const slots = formationPositions[formation];
      const used = new Set();
      const selected = slots.map(slot => {
        const player = getBestForCategory(players, slot.category, used);
        if (player) used.add(String(player.id));
        return player;
      });

      const points = selected.reduce((sum, player) => sum + (player ? getProjectedPoints(player) : 0), 0);
      const budget = selected.reduce((sum, player) => sum + (player ? getBudgetPrice(player) : 0), 0);

      return { formation, points, budget };
    }).sort((a, b) => b.points - a.points);
  }, [players]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Formāciju salīdzinājums</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Labākais automātiskais XI katrā formācijā</p>
        </div>
        {results[0] && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">Labākā: {results[0].formation}</span>}
      </div>

      <div className="space-y-2">
        {results.map((item, index) => (
          <div key={item.formation} className={`rounded-xl border p-3 ${index === 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">{item.formation}</span>
              <span className="text-sm font-black text-emerald-600">{item.points.toFixed(1)} GW</span>
            </div>
            <div className="mt-1 flex justify-between text-[8px] font-bold text-slate-400">
              <span>Flow Value: {item.budget.toFixed(1)}</span>
              {index === 0 && <span>⚡ Ieteicamā</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixtureSummary({ players, fixtures, standings }) {
  const rows = players.map(player => {
    const fixture = getFixtureForTeam(player, fixtures);
    const opponent = getFixtureOpponent(player, fixture);
    const difficulty = getDifficulty(player, fixture, standings);
    return { player, fixture, opponent, difficulty };
  }).filter(item => item.opponent);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <p className="mt-1 text-xs font-bold text-slate-500">Mājas/izbraukuma un pretinieka grūtības indikators</p>
      </div>

      {rows.length ? (
        <div className="space-y-2">
          {rows.slice(0, 8).map(({ player, fixture, opponent, difficulty }) => (
            <div key={player.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-black text-slate-900">{player.name}</p>
                <p className="truncate text-[8px] font-bold text-slate-400">{opponent.isHome ? "🏠" : "✈️"} {opponent.name} · {getFormattedFixtureDate(fixture)}</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-5 text-center text-xs font-bold text-slate-400">Nākamās spēles dati nav pieejami.</p>
      )}
    </div>
  );
}

function FantasyPlayerList({ title, players, onAdd }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</p>
        <span className="text-[8px] font-bold text-slate-400">{players.length}</span>
      </div>
      <div className="space-y-2">
        {players.slice(0, 5).map(player => {
          const form = getFormStatus(player);
          return (
            <button key={player.id} type="button" onClick={() => onAdd(player)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2 text-left hover:border-emerald-200 hover:bg-emerald-50">
              {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-black text-slate-900">{player.name}</span>
                <span className="block truncate text-[8px] font-bold text-slate-400">{player.team}</span>
              </span>
              <span className="text-right">
                <span className="block text-[10px] font-black text-emerald-600">{getProjectedPoints(player).toFixed(1)} GW</span>
                <span className="block text-[9px] font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</span>
                <span className={`block rounded-full border px-1 py-0.5 text-[6px] font-black ${form.tone}`}>{form.label.replace(/^[^ ]+ /, "")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FantasyBuilder({ players, competition, season }) {
  const [formation, setFormation] = useState("4-3-3");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [picker, setPicker] = useState(null);
  const [budget, setBudget] = useState(100);
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);
  const [fixtureLoading, setFixtureLoading] = useState(false);

  const slots = formationPositions[formation] || [];
  const selectedIds = useMemo(() => new Set(selectedPlayers.filter(Boolean).map(player => String(player.id))), [selectedPlayers]);
  const benchIds = useMemo(() => new Set(benchPlayers.filter(Boolean).map(player => String(player.id))), [benchPlayers]);
  const allSquadIds = useMemo(() => new Set([...selectedIds, ...benchIds]), [selectedIds, benchIds]);
  const filledCount = selectedPlayers.filter(Boolean).length;
  const isComplete = filledCount === 11;

  useEffect(() => {
    let cancelled = false;
    setFixtureLoading(true);

    Promise.all([
      fetchLeagueFixtures(competition, season).catch(() => ({ upcoming: [], recent: [] })),
      fetchLeagueStandings(competition, season).catch(() => []),
    ]).then(([fixtureData, table]) => {
      if (cancelled) return;
      setFixtures(fixtureData || { upcoming: [], recent: [] });
      setStandings(Array.isArray(table) ? table : []);
    }).finally(() => {
      if (!cancelled) setFixtureLoading(false);
    });

    return () => { cancelled = true; };
  }, [competition, season]);

  useEffect(() => {
    setSelectedPlayers(current =>
      slots.map((slot, index) => {
        const player = current[index];
        return player && player.category === slot.category ? player : null;
      })
    );
    setCaptainId(null);
    setViceCaptainId(null);
    setPicker(null);
  }, [formation]);

  const squadBudget = useMemo(
    () => [...selectedPlayers, ...benchPlayers].filter(Boolean).reduce((sum, player) => sum + getBudgetPrice(player), 0),
    [selectedPlayers, benchPlayers]
  );

  const startingBudget = useMemo(
    () => selectedPlayers.filter(Boolean).reduce((sum, player) => sum + getBudgetPrice(player), 0),
    [selectedPlayers]
  );

  const expectedPoints = useMemo(
    () => selectedPlayers.filter(Boolean).reduce((sum, player) => sum + getProjectedPoints(player), 0),
    [selectedPlayers]
  );

  const captainPoints = useMemo(() => {
    const captain = selectedPlayers.find(player => String(player?.id) === String(captainId));
    return captain ? getProjectedPoints(captain) : 0;
  }, [selectedPlayers, captainId]);

  const projectedPoints = expectedPoints + captainPoints;

  const differentialPlayers = useMemo(() => {
    return [...players]
      .filter(player => !allSquadIds.has(String(player.id)))
      .sort((a, b) => getDifferentialScore(b, players) - getDifferentialScore(a, players))
      .slice(0, 5);
  }, [players, allSquadIds]);

  const choosePlayer = player => {
    if (!picker) return;

    if (allSquadIds.has(String(player.id))) return;

    if (picker.type === "starter") {
      setSelectedPlayers(current => {
        const next = [...current];
        next[picker.index] = player;
        return next;
      });
    } else if (picker.type === "bench") {
      setBenchPlayers(current => [...current.filter(Boolean), player].slice(0, 5));
    }

    setPicker(null);
  };

  const removeStarter = index => {
    const removed = selectedPlayers[index];
    setSelectedPlayers(current => {
      const next = [...current];
      next[index] = null;
      return next;
    });

    if (removed && String(removed.id) === String(captainId)) setCaptainId(null);
    if (removed && String(removed.id) === String(viceCaptainId)) setViceCaptainId(null);
  };

  const removeBench = id => {
    setBenchPlayers(current => current.filter(player => String(player.id) !== String(id)));
  };

  const chooseCaptain = index => {
    const player = selectedPlayers[index];
    if (!player) return;
    setCaptainId(String(player.id));
    if (String(viceCaptainId) === String(player.id)) setViceCaptainId(null);
  };

  const chooseViceCaptain = index => {
    const player = selectedPlayers[index];
    if (!player) return;
    if (String(captainId) === String(player.id)) return;
    setViceCaptainId(String(player.id));
  };

  const clearTeam = () => {
    setSelectedPlayers([]);
    setBenchPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
    setPicker(null);
  };

  const buildBestXI = () => {
    const used = new Set();
    const next = slots.map(slot => {
      const player = getBestForCategory(players, slot.category, used);
      if (player) used.add(String(player.id));
      return player;
    });

    setSelectedPlayers(next);
    setCaptainId(null);
    setViceCaptainId(null);
  };

  const buildBestFormation = () => {
    const results = formationNames.map(candidateFormation => {
      const used = new Set();
      const candidate = formationPositions[candidateFormation].map(slot => {
        const player = getBestForCategory(players, slot.category, used);
        if (player) used.add(String(player.id));
        return player;
      });
      const points = candidate.reduce((sum, player) => sum + (player ? getProjectedPoints(player) : 0), 0);
      return { formation: candidateFormation, points, candidate };
    }).sort((a, b) => b.points - a.points)[0];

    if (!results) return;

    setFormation(results.formation);
    setSelectedPlayers(results.candidate);
    setCaptainId(null);
    setViceCaptainId(null);
  };

  const autoBench = () => {
    const used = new Set([...selectedIds]);
    const order = ["GOALKEEPERS", "DEFENDERS", "MIDFIELDERS", "STRIKERS"];
    const next = [];

    for (const category of order) {
      const candidates = sortByProjection(players.filter(player => player.category === category && !used.has(String(player.id))));
      for (const player of candidates) {
        if (next.length >= 5) break;
        next.push(player);
        used.add(String(player.id));
      }
      if (next.length >= 5) break;
    }

    setBenchPlayers(next);
  };

  const remainingBudget = budget - squadBudget;
  const captain = selectedPlayers.find(player => String(player?.id) === String(captainId));
  const viceCaptain = selectedPlayers.find(player => String(player?.id) === String(viceCaptainId));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Formācija</span>
          <select value={formation} onChange={event => setFormation(event.target.value)} className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400">
            {formationNames.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={buildBestXI} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">⚡ Labākais XI</button>
          <button type="button" onClick={buildBestFormation} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">🏆 Labākā formācija</button>
          <button type="button" onClick={clearTeam} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Notīrīt XI</button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Spēlētāji</p><p className="mt-1 text-2xl font-black text-slate-900">{filledCount}/11</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Prognoze GW</p><p className="mt-1 text-2xl font-black text-emerald-600">{expectedPoints.toFixed(1)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ar kapteini</p><p className="mt-1 text-2xl font-black text-slate-900">{projectedPoints.toFixed(1)}</p></div>
        <div className={`rounded-2xl border p-4 ${remainingBudget < 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Budžets</p><p className={`mt-1 text-2xl font-black ${remainingBudget < 0 ? "text-rose-600" : "text-slate-900"}`}>{remainingBudget.toFixed(1)}m</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Kapteinis</p><p className="mt-1 truncate text-sm font-black text-slate-900">{captain?.name || "Nav"}</p></div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <label className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Komandas budžets</span>
            <span className="text-xs font-black text-slate-900">{budget.toFixed(1)}m</span>
          </div>
          <input type="range" min="60" max="150" step="0.5" value={budget} onChange={event => setBudget(Number(event.target.value))} className="mt-3 w-full accent-emerald-500" />
          <p className="mt-1 text-[8px] text-slate-400">Izmantota Flow Value, nevis oficiāla spēlētāja tirgus cena.</p>
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sastāva vērtība</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{squadBudget.toFixed(1)}m</p>
          <p className="mt-1 text-[8px] font-bold text-slate-400">Start XI + 5 rezervisti</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā GW</p>
          <p className="mt-1 text-sm font-black text-slate-900">{fixtureLoading ? "Ielādē..." : `${fixtures.upcoming?.length || 0} spēles atrastas`}</p>
          <p className="mt-1 text-[8px] font-bold text-slate-400">Mājas/izbraukuma un grūtības dati</p>
        </div>
      </div>

      <div className="mb-5 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-bold text-emerald-700">{isComplete ? "Sākumsastāvs ir gatavs." : `Izvēlies vēl ${11 - filledCount} spēlētājus.`}</p>
        <p className="mt-1 text-xs leading-5 text-emerald-700/80">Prognoze izmanto spēlētāja formas/Flow punktu vidējo rādītāju. Kapteiņa prognoze tiek dubultota.</p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-lg font-black text-slate-900">{formation} · Fantasy XI</h3><p className="mt-1 text-xs text-slate-400">Spied uz +, lai izvēlētos spēlētāju. Spied uz −, lai viņu noņemtu.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{filledCount}/11 aizpildīti</span>
        </div>

        <FantasyPitch
          formation={formation}
          slots={slots}
          selectedPlayers={selectedPlayers}
          captainId={captainId}
          viceCaptainId={viceCaptainId}
          onOpen={(index, category) => setPicker({ type: "starter", index, category })}
          onRemove={removeStarter}
          onCaptain={chooseCaptain}
          onViceCaptain={chooseViceCaptain}
          fixtures={fixtures}
          standings={standings}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rezerves</p><p className="mt-1 text-xs font-bold text-slate-500">Līdz 5 spēlētājiem</p></div><button type="button" onClick={autoBench} className="rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white">⚡ Auto bench</button></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {benchPlayers.map(player => (
              <div key={player.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-slate-900">{player.name}</p><p className="text-[8px] font-bold text-slate-400">{player.team} · {getProjectedPoints(player).toFixed(1)} GW · €{getBudgetPrice(player).toFixed(1)}m</p></div>
                <button type="button" onClick={() => removeBench(player.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white hover:bg-rose-500">−</button>
              </div>
            ))}
          </div>
          {benchPlayers.length < 5 && <button type="button" onClick={() => setPicker({ type: "bench", index: benchPlayers.length, category: "ALL" })} className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500 hover:border-emerald-300 hover:text-emerald-600">+ Pievienot rezervistu</button>}
        </div>

        <TeamStrengthCard players={selectedPlayers.filter(Boolean)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FormationAnalysis players={players} />
        <FixtureSummary players={selectedPlayers.filter(Boolean)} fixtures={fixtures} standings={standings} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">🔥 Diferenciālie spēlētāji</p><p className="mt-1 text-xs font-bold text-slate-500">Spēlētāji ar labu prognozi, kurus vēl neesi izvēlējies</p></div><span className="rounded-full bg-violet-50 px-2 py-1 text-[8px] font-black text-violet-700">FLOW</span></div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {differentialPlayers.map(player => (
            <FantasyPlayerList key={player.id} title={player.name} players={[player]} onAdd={candidate => {
              const index = slots.findIndex(slot => !selectedPlayers.find((item, slotIndex) => slotIndex === slots.indexOf(slot) && item));
              if (index >= 0 && candidate.category === slots[index].category) setSelectedPlayers(current => { const next = [...current]; next[index] = candidate; return next; });
            }} />
          ))}
        </div>
      </div>

      {isComplete && (
        <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Gameweek prognoze</p><h3 className="mt-1 text-2xl font-black text-slate-900">{projectedPoints.toFixed(1)} punkti</h3><p className="mt-1 text-xs text-slate-500">Start XI prognoze + kapteiņa dubultais ieguldījums.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Kapteinis</p><p className="mt-1 text-sm font-black text-slate-900">{captain?.name || "Nav izvēlēts"}</p></div>
              <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Vice</p><p className="mt-1 text-sm font-black text-slate-900">{viceCaptain?.name || "Nav izvēlēts"}</p></div>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <FantasyPlayerPicker
          category={picker.category}
          players={players}
          selectedIds={allSquadIds}
          onSelect={choosePlayer}
          onClose={() => setPicker(null)}
          fixtures={fixtures}
          standings={standings}
        />
      )}
    </div>
  );
}

export default function FootballAnalyticsTools({
  competition,
  season,
  leagueName,
}) {
  const [players, setPlayers] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [tool, setTool] =
    useState("recommendations");
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchApiSportsPlayers(
            competition,
            season
          );

        if (!cancelled) {
          setPlayers(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setPlayers([]);
          setError(
            err?.message ||
              "Neizdevās ielādēt spēlētājus."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [competition, season]);

  useEffect(() => {
    let cancelled = false;
    const loadLeagueContext = async () => {
      try {
        const [fixtureData, standingData] = await Promise.all([
          fetchLeagueFixtures(competition, season),
          fetchLeagueStandings(competition, season),
        ]);
        if (!cancelled) {
          setFixtures(fixtureData || { upcoming: [], recent: [] });
          setStandings(Array.isArray(standingData) ? standingData : []);
        }
      } catch (contextError) {
        if (!cancelled) {
          setFixtures({ upcoming: [], recent: [] });
          setStandings([]);
        }
      }
    };
    loadLeagueContext();
    return () => { cancelled = true; };
  }, [competition, season]);

  const toolItems = [
    [
      "recommendations",
      "Player Recommendations",
      "Atrodi spēlētājus pēc izvēlētā profila.",
    ],
    [
      "ranking",
      "Custom Player Ranking",
      "Izveido savu statistikas vērtēšanas modeli.",
    ],
    [
      "fantasy",
      "Fantasy Team Builder",
      "Izveido Fantasy XI pēc formācijas.",
    ],
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900">
          Analytics Tools
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          {leagueName} · {season}/
          {Number(season) + 1}
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {toolItems.map(
          ([value, title, description]) => (
            <button
              type="button"
              key={value}
              onClick={() =>
                setTool(value)
              }
              className={`rounded-2xl border p-4 text-left transition ${
                tool === value
                  ? "border-emerald-300 bg-emerald-50 shadow-sm"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <p className="text-sm font-black text-slate-900">
                {title}
              </p>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {description}
              </p>
            </button>
          )
        )}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">
            API kļūda
          </p>
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Ielādē analītikas datus...
          </p>
        </div>
      ) : !error ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:p-6">
          {tool === "recommendations" && (
            <RecommendationTool
              players={players}
              fixtures={fixtures}
              standings={standings}
            />
          )}

          {tool === "ranking" && (
            <RankingTool
              players={players}
              competition={competition}
              season={season}
            />
          )}

          {tool === "fantasy" && (
            <FantasyBuilder
              players={players}
              competition={competition}
              season={season}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}
