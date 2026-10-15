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
import {
  RECOMMENDATION_STYLES,
} from "../../utils/analyticsMethodology";

const POSITION_METRICS = {
  GOALKEEPERS: [
    { key: "saves", label: "Atvairījumi", weight: 30, get: p => p?.advancedStats?.saves },
    { key: "cleanSheets", label: "Tīrās spēles", weight: 25, get: p => p?.advancedStats?.cleanSheets },
    { key: "goalsConceded", label: "Ielaistie vārti", weight: 20, inverse: true, get: p => p?.advancedStats?.goalsConceded },
    { key: "rating", label: "Vidējais vērtējums", weight: 15, get: p => p?.advancedStats?.rating },
    { key: "minutes", label: "Minūtes", weight: 10, get: p => p?.minutes },
  ],
  DEFENDERS: [
    { key: "cleanSheets", label: "Tīrās spēles", weight: 25, get: p => p?.advancedStats?.cleanSheets },
    { key: "tackles", label: "Atņemtās bumbas", weight: 20, get: p => p?.advancedStats?.tackles },
    { key: "interceptions", label: "Pārtvertās piespēles", weight: 20, get: p => p?.advancedStats?.interceptions },
    { key: "duelsWonPercentage", label: "Uzvarētie dueļi", weight: 20, get: p => p?.advancedStats?.duelsWonPercentage },
    { key: "rating", label: "Vidējais vērtējums", weight: 15, get: p => p?.advancedStats?.rating },
  ],
  MIDFIELDERS: [
    { key: "assists", label: "Assist", weight: 20, get: p => p?.assists },
    { key: "keyPasses", label: "Atslēgas piespēles", weight: 25, get: p => p?.advancedStats?.keyPasses },
    { key: "passAccuracy", label: "Piespēļu precizitāte", weight: 20, get: p => p?.advancedStats?.passAccuracy },
    { key: "goals", label: "Vārti", weight: 15, get: p => p?.goals },
    { key: "rating", label: "Vidējais vērtējums", weight: 10, get: p => p?.advancedStats?.rating },
    { key: "points", label: "Flow punkti", weight: 10, get: p => p?.flowPoints },
  ],
  STRIKERS: [
    { key: "goals", label: "Vārti", weight: 30, get: p => p?.goals },
    { key: "shotsOnTarget", label: "Sitieni vārtu rāmī", weight: 25, get: p => p?.advancedStats?.shotsOnTarget },
    { key: "assists", label: "Assist", weight: 15, get: p => p?.assists },
    { key: "successfulDribbles", label: "Veiksmīgi dribli", weight: 10, get: p => p?.advancedStats?.successfulDribbles },
    { key: "rating", label: "Vidējais vērtējums", weight: 10, get: p => p?.advancedStats?.rating },
    { key: "points", label: "Flow punkti", weight: 10, get: p => p?.flowPoints },
  ],
};

function getPlayerCategory(player) {
  const raw = `${player?.category || ""} ${player?.position || ""} ${player?.positionLabel || ""}`.toLowerCase();
  if (raw.includes("goalkeeper") || raw.includes("goal keep") || raw.includes("vārtsarg") || raw.includes("vartsarg")) return "GOALKEEPERS";
  if (raw.includes("defender") || raw.includes("aizsarg")) return "DEFENDERS";
  if (raw.includes("midfielder") || raw.includes("pussarg")) return "MIDFIELDERS";
  return "STRIKERS";
}

function formatMetricValue(value, key) {
  if (value === null || value === undefined || value === "") return "—";
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);
  return key === "passAccuracy" || key === "duelsWonPercentage" ? `${parsed.toFixed(1)}%` : (Number.isInteger(parsed) ? parsed : parsed.toFixed(2));
}

function RecommendationExplanation({ item, pool = [], weights }) {
  const category = getPlayerCategory(item?.player);
  const configuredMetrics = POSITION_METRICS[category] || POSITION_METRICS.STRIKERS;
  const details = configuredMetrics.map(metric => {
    const available = pool.map(entry => metric.get(entry?.player || entry)).filter(value => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value))).map(Number);
    const currentValue = metric.get(item.player);
    const min = available.length ? Math.min(...available) : 0;
    const max = available.length ? Math.max(...available) : 0;
    let normalized = currentValue === null || currentValue === undefined || currentValue === "" ? null : normalize(Number(currentValue), min, max);
    if (normalized !== null && metric.inverse) normalized = 100 - normalized;
    return { ...metric, normalized, raw: currentValue };
  });
  const visibleDetails = details.filter(detail => detail.raw !== null && detail.raw !== undefined && detail.raw !== "");
  const displayDetails = visibleDetails.length ? visibleDetails : details;
  const categoryLabel = { GOALKEEPERS: "Vārtsarga rādītāji", DEFENDERS: "Aizsarga rādītāji", MIDFIELDERS: "Pussarga rādītāji", STRIKERS: "Uzbrucēja rādītāji" }[category];

  return (
    <div className="mt-3 rounded-2xl border border-emerald-900 bg-[#071d16] p-4 text-white">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-400">Kāpēc ieteikts?</p>
          <p className="mt-1 text-sm font-black text-white">{item.player.name} · {Math.round(item.score)} Heuristic Score</p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">{categoryLabel}</p>
        </div>
        <span className="rounded-full bg-emerald-950 px-3 py-1 text-[9px] font-black text-emerald-300">{displayDetails.length} kritēriji</span>
      </div>
      <div className="space-y-3">
        {displayDetails.map(detail => (
          <div key={detail.key}>
            <div className="mb-1 flex items-center justify-between gap-2 text-[9px] font-bold text-slate-300">
              <span>{detail.label} · {detail.weight}%</span>
              <span>{detail.normalized === null ? "Nav datu" : `${Math.round(detail.normalized)}/100`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(0, Math.min(100, detail.normalized ?? 0))}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[9px] leading-relaxed text-slate-400">Rādītāji un to svari ir pielāgoti spēlētāja pozīcijai. Pieejamība ir atkarīga no API datiem.</p>
    </div>
  );
}

function getFixtureResultForTeam(player, fixture) {
  if (!player || !fixture) return null;

  // Support both API-Football and the app's normalized fixture structure.
  const homeTeam = fixture?.teams?.home || fixture?.homeTeam || fixture?.home || fixture?.match?.homeTeam;
  const awayTeam = fixture?.teams?.away || fixture?.awayTeam || fixture?.away || fixture?.match?.awayTeam;
  const homeId = homeTeam?.id ?? homeTeam?.teamId ?? fixture?.homeTeamId;
  const awayId = awayTeam?.id ?? awayTeam?.teamId ?? fixture?.awayTeamId;
  const playerTeamId = player?.teamId ?? player?.team?.id ?? player?.team?.teamId;

  const homeGoals = fixture?.goals?.home
    ?? fixture?.score?.fullTime?.home
    ?? fixture?.score?.fulltime?.home
    ?? fixture?.score?.home
    ?? fixture?.homeGoals
    ?? fixture?.homeScore;
  const awayGoals = fixture?.goals?.away
    ?? fixture?.score?.fullTime?.away
    ?? fixture?.score?.fulltime?.away
    ?? fixture?.score?.away
    ?? fixture?.awayGoals
    ?? fixture?.awayScore;

  // The player API and fixture API may assign different IDs to the same club.
  // In that case, fall back to normalized team names.
  const normalizeTeamName = value => String(
    typeof value === "string"
      ? value
      : value?.name ?? value?.shortName ?? value?.teamName ?? value?.displayName ?? ""
  )
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(fc|afc|cf|sc|club|football club)\b/g, " ")
    .replace(/[^a-z0-9]/g, "");

  const playerTeamCandidates = [
    player?.teamName,
    player?.club,
    player?.team?.name,
    player?.team?.shortName,
    player?.team,
    player?.teamShortName,
    player?.teamDisplayName,
  ].map(normalizeTeamName).filter(Boolean);

  const homeName = normalizeTeamName(homeTeam);
  const awayName = normalizeTeamName(awayTeam);

  const id = value => value === null || value === undefined || value === "" ? null : String(value);
  const playerId = id(playerTeamId);
  const homeIdString = id(homeId);
  const awayIdString = id(awayId);

  const namesMatch = (candidate, fixtureName) =>
    Boolean(candidate && fixtureName && (
      candidate === fixtureName ||
      (candidate.length >= 4 && fixtureName.includes(candidate)) ||
      (fixtureName.length >= 4 && candidate.includes(fixtureName))
    ));

  const isHomeById = playerId !== null && homeIdString !== null && playerId === homeIdString;
  const isAwayById = playerId !== null && awayIdString !== null && playerId === awayIdString;
  const isHomeByName = playerTeamCandidates.some(candidate => namesMatch(candidate, homeName));
  const isAwayByName = playerTeamCandidates.some(candidate => namesMatch(candidate, awayName));

  const isHome = isHomeById || (!isAwayById && isHomeByName);
  const isAway = isAwayById || (!isHomeById && isAwayByName);

  if (isHome === isAway) return null;

  if (
    homeGoals === null || homeGoals === undefined ||
    awayGoals === null || awayGoals === undefined
  ) {
    return null;
  }

  const parsedHomeGoals = Number(homeGoals);
  const parsedAwayGoals = Number(awayGoals);
  if (!Number.isFinite(parsedHomeGoals) || !Number.isFinite(parsedAwayGoals)) return null;

  const teamGoals = isHome ? parsedHomeGoals : parsedAwayGoals;
  const opponentGoals = isHome ? parsedAwayGoals : parsedHomeGoals;
  const result = teamGoals > opponentGoals ? "W" : teamGoals < opponentGoals ? "L" : "D";

  return { result, isHome, teamGoals, opponentGoals };
}

function RecommendationRecentForm({ player, fixtures, loading }) {
  const recent = Array.isArray(fixtures?.recent)
    ? fixtures.recent.slice(0, 5)
    : [];

  return (
    <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Recent form
          </p>
          <p className="mt-1 text-xs font-black text-white">
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
              className="h-12 animate-pulse rounded-xl bg-[#061a13]"
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
                className="flex items-center gap-3 rounded-xl bg-[#061a13] px-3 py-2"
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

                {(opponent?.logo || opponent?.crest || opponent?.image || opponent?.badge || opponent?.teamLogo) ? (
                  <img
                    src={opponent.logo || opponent.crest || opponent.image || opponent.badge || opponent.teamLogo}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-contain"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#092219]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[10px] font-black text-white">
                    {opponent ? `${player?.teamName || (typeof player?.team === "string" ? player.team : player?.team?.name) || player?.club?.name || "Komanda"} vs ${opponent.name}` : "Pretinieks nav pieejams"}
                  </p>
                  <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                    {getFormattedFixtureDate(fixture)}
                  </p>
                </div>

                {result ? (
                  <span className="shrink-0 text-xs font-black text-white">
                    {result.teamGoals} : {result.opponentGoals}
                  </span>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl bg-[#061a13] p-4 text-center text-xs font-bold text-slate-400">
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
    <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
            Next 5 games
          </p>
          <p className="mt-1 text-xs font-black text-white">
            Nākamās 5 spēles
          </p>
        </div>
        <span className="rounded-full bg-[#061a13] px-2 py-1 text-[8px] font-black text-slate-400">
          {upcoming.length}/5
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(index => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-[#061a13]"
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
                className="flex items-center gap-3 rounded-xl bg-[#061a13] px-3 py-2"
              >
                <span className="shrink-0 rounded-lg bg-[#092219] px-2 py-1 text-[10px] font-black">
                  {opponent?.isHome ? "🏠" : "✈️"}
                </span>

                {(opponent?.logo || opponent?.crest || opponent?.image || opponent?.badge || opponent?.teamLogo) ? (
                  <img
                    src={opponent.logo || opponent.crest || opponent.image || opponent.badge || opponent.teamLogo}
                    alt=""
                    className="h-7 w-7 shrink-0 rounded-full object-contain"
                  />
                ) : (
                  <div className="h-7 w-7 shrink-0 rounded-full bg-[#092219]" />
                )}

                <div className="min-w-0 flex-1">
                  <p className="text-[8px] font-black uppercase tracking-wider text-emerald-400">
                    {opponent?.isHome ? "Next game · Home" : "Next game · Away"}
                  </p>
                  <p className="truncate text-[10px] font-black text-white">
                    {opponent
                      ? `${opponent.isHome ? "vs" : "at"} ${opponent.name}`
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
        <div className="rounded-xl bg-[#061a13] p-4 text-center text-xs font-bold text-slate-400">
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
      <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <p className="mt-2 text-sm font-black text-slate-200">Nākamais mačs nav pieejams</p>
      </div>
    );
  }
  const difficulty = getDifficulty(player, fixture, standings || []);
  return (
    <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-lg bg-[#061a13] px-2 py-1 text-xs font-black">{opponent.isHome ? "🏠" : "✈️"}</span>
        {(opponent.logo || opponent.crest || opponent.image || opponent.badge || opponent.teamLogo) ? <img src={opponent.logo || opponent.crest || opponent.image || opponent.badge || opponent.teamLogo} alt="" className="h-8 w-8 rounded-full object-contain" /> : null}
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">{opponent.isHome ? "Next game · Home" : "Next game · Away"}</p>
          <p className="truncate text-sm font-black text-white">{`${opponent.isHome ? "vs" : "at"} ${opponent.name}`}</p>
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
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[28px] border border-emerald-900 bg-[#061a13] shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-950 bg-[#092219] px-5 py-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Spēlētāju salīdzinājums</p>
            <h3 className="mt-1 text-lg font-black text-white">Recommended players</h3>
            <p className="mt-1 text-[10px] font-bold text-slate-400">Statistika, pēdējās 5 spēles un nākamās 5 spēles.</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-900 bg-[#092219] font-bold text-slate-500 hover:bg-[#061a13]">✕</button>
        </div>

        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-2">
            {items.map(item => {
              const player = resolvePlayerTeam(item.player, standings);
              const context = contexts[String(player.id)] || { upcoming: [], recent: [] };
              const form = context.recent.map(fixture => resultFor(player, fixture)?.result || "—");
              const formInfo = getFormStatus(player);

              return (
                <div key={player.id} className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-100" /> : <div className="h-12 w-12 rounded-full bg-slate-100" />}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-white">{player.name}</p>
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
                      <div key={label} className="rounded-xl bg-[#061a13] p-2 text-center">
                        <p className="text-[7px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                        <p className="mt-1 text-xs font-black text-white">{value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-950 bg-[#061a13] p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Pēdējās 5 spēles</p>
                        <p className={`mt-1 text-[9px] font-black ${formInfo.tone.split(" ")[1] || "text-slate-200"}`}>{formInfo.label}</p>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, index) => {
                          const value = form[index] || "—";
                          return <span key={index} className={`flex h-6 w-6 items-center justify-center rounded-full text-[8px] font-black ${value === "W" ? "bg-emerald-100 text-emerald-700" : value === "D" ? "bg-amber-100 text-amber-700" : value === "L" ? "bg-rose-100 text-rose-700" : "bg-[#092219] text-slate-400"}`}>{value}</span>;
                        })}
                      </div>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {loading ? <div className="h-8 animate-pulse rounded-lg bg-[#092219]" /> : context.recent.length ? context.recent.map((fixture, index) => {
                        const opponent = getFixtureOpponent(player, fixture);
                        const result = resultFor(player, fixture);
                        return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-[#092219] px-2.5 py-2"><span className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-black ${result?.result === "W" ? "bg-emerald-100 text-emerald-700" : result?.result === "D" ? "bg-amber-100 text-amber-700" : "bg-rose-100 text-rose-700"}`}>{result?.result || "—"}</span>{(opponent?.logo || opponent?.crest || opponent?.image || opponent?.badge || opponent?.teamLogo) ? <img src={opponent.logo || opponent.crest || opponent.image || opponent.badge || opponent.teamLogo} alt="" className="h-5 w-5 rounded-full object-contain" /> : null}<span className="min-w-0 flex-1 truncate text-[8px] font-bold text-slate-200">{opponent?.name || "Pretinieks"}</span><span className="text-[8px] font-black text-slate-500">{result ? `${result.teamGoals}:${result.opponentGoals}` : "—"}</span></div>;
                      }) : <p className="text-[9px] text-slate-400">Pēdējo spēļu dati nav pieejami.</p>}
                    </div>
                  </div>

                  <div className="mt-3 rounded-xl border border-emerald-950 bg-[#092219] p-3">
                    <div className="flex items-center justify-between"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nākamās 5 spēles</p><span className="text-[8px] font-black text-emerald-600">{context.upcoming.length}/5</span></div>
                    <div className="mt-2 space-y-1.5">
                      {loading ? <div className="h-12 animate-pulse rounded-lg bg-[#061a13]" /> : context.upcoming.length ? context.upcoming.slice(0, 1).map((fixture, index) => { const opponent = getFixtureOpponent(player, fixture); const opponentLogo = opponent?.logo || opponent?.crest || opponent?.image || opponent?.badge || opponent?.teamLogo; return <div key={fixture?.fixture?.id || index} className="flex items-center gap-2 rounded-lg bg-[#061a13] px-2.5 py-2"><div className="min-w-0 flex-1"><p className="text-[7px] font-black uppercase tracking-wider text-emerald-400">Nākamā spēle · {opponent?.isHome ? "Mājās" : "Izbraukumā"}</p><div className="mt-0.5 flex min-w-0 items-center gap-2">{opponentLogo ? <img src={opponentLogo} alt={opponent?.name ? `${opponent.name} logo` : "Pretinieka logo"} className="h-5 w-5 shrink-0 rounded-full object-contain" /> : <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#092219] text-[8px]">⚽</span>}<span className="min-w-0 truncate text-[8px] font-bold text-slate-200">{opponent ? `${opponent.isHome ? "vs" : "at"} ${opponent.name}` : "Pretinieks nav pieejams"}</span></div></div><span className="shrink-0 text-[8px] font-black text-slate-400">{getFormattedFixtureDate(fixture)}</span></div>; }) : <p className="text-[9px] text-slate-400">Nākamās spēles nav pieejamas.</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-900 bg-[#092219]">
            <div className="grid grid-cols-[140px_repeat(2,minmax(0,1fr))] border-b border-emerald-950 bg-[#061a13] px-3 py-2 text-[8px] font-black uppercase tracking-wider text-slate-400">
              <span>Rādītājs</span>
              {items.map(item => <span key={item.player.id} className="text-center">{item.player.name}</span>)}
            </div>
            {rows.map(([label, getter]) => (
              <div key={label} className="grid grid-cols-[140px_repeat(2,minmax(0,1fr))] border-b border-emerald-950 last:border-b-0">
                <div className="px-3 py-2 text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</div>
                {items.map(item => <div key={`${label}-${item.player.id}`} className="border-l border-emerald-950 px-3 py-2 text-center text-xs font-black text-white">{getter(item)}</div>)}
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
      <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[24px] border border-emerald-900 bg-[#061a13] shadow-2xl">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-emerald-950 bg-[#092219] p-5">
          <div className="flex min-w-0 items-center gap-3">
            {player.photo ? <img src={player.photo} alt="" className="h-12 w-12 rounded-full object-cover" /> : null}
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-600">Heuristic recommendation analysis</p>
              <h3 className="truncate text-lg font-black text-white">{player.name}</h3>
              <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team} · {player.positionLabel}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-900 bg-[#061a13] font-bold text-slate-500">✕</button>
        </div>

        <div className="grid gap-3 p-5 lg:grid-cols-3">
          <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Heuristic Recommendation Score</p>
            <p className="mt-1 text-4xl font-black text-emerald-600">{Math.round(item.score)}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>{form.label}</span>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>{status.label}</span>
            </div>
          </div>
          <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Fantasy value</p>
            <p className="mt-1 text-3xl font-black text-white">€{price.toFixed(1)}m</p>
            <p className="mt-1 text-xs text-slate-500">{projection.toFixed(1)} heuristic GW points estimate</p>
            <p className="mt-1 text-[9px] font-bold text-slate-400">Flow Value, based on available statistics.</p>
          </div>
          <div className="rounded-2xl border border-emerald-900 bg-[#092219] p-4 text-white">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Heuristic recommendation score</p>
            <p className="mt-1 text-3xl font-black text-white">{recommendationScore}/100</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${recommendationScore}%` }} /></div>
            <p className="mt-2 text-[9px] text-slate-400">Projekta heuristiska rekomendācijas metrika, nevis statistiska ticamības varbūtība.</p>
          </div>

          <RecommendationExplanation item={item} pool={pool} weights={weights} />
          <RecommendationRecentForm player={player} fixtures={fixtureContext} loading={fixtureContextLoading} />
          <RecommendationNextFixtures player={player} fixtures={fixtureContext} standings={standings} loading={fixtureContextLoading} />

          <div className="rounded-2xl border border-emerald-900 bg-[#071d16] p-4 text-white lg:col-span-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-400">Galvenie rādītāji · {({ GOALKEEPERS: "Vārtsargs", DEFENDERS: "Aizsargs", MIDFIELDERS: "Pussargs", STRIKERS: "Uzbrucējs" })[getPlayerCategory(player)]}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(getPlayerCategory(player) === "GOALKEEPERS"
                ? [["Atvairījumi", player.advancedStats?.saves], ["Tīrās spēles", player.advancedStats?.cleanSheets], ["Ielaistie vārti", player.advancedStats?.goalsConceded], ["Atvairījumu %", player.advancedStats?.savePercentage == null ? null : `${number(player.advancedStats.savePercentage).toFixed(1)}%`], ["Spēles", player.appearances], ["Vērtējums", player.advancedStats?.rating]]
                : getPlayerCategory(player) === "DEFENDERS"
                ? [["Tīrās spēles", player.advancedStats?.cleanSheets], ["Atņemtās bumbas", player.advancedStats?.tackles], ["Pārtvertās piespēles", player.advancedStats?.interceptions], ["Bloķēti sitieni", player.advancedStats?.blocks], ["Uzvarētie dueļi", player.advancedStats?.duelsWonPercentage == null ? null : `${number(player.advancedStats.duelsWonPercentage).toFixed(1)}%`], ["Vērtējums", player.advancedStats?.rating]]
                : getPlayerCategory(player) === "MIDFIELDERS"
                ? [["Assist", player.assists], ["Atslēgas piespēles", player.advancedStats?.keyPasses], ["Piespēles", player.advancedStats?.passes], ["Piespēļu precizitāte", player.advancedStats?.passAccuracy == null ? null : `${number(player.advancedStats.passAccuracy).toFixed(1)}%`], ["Vārti", player.goals], ["Flow punkti", player.flowPoints]]
                : [["Vārti", player.goals], ["Sitieni vārtu rāmī", player.advancedStats?.shotsOnTarget], ["Sitieni", player.advancedStats?.shots], ["Assist", player.assists], ["Veiksmīgi dribli", player.advancedStats?.successfulDribbles], ["Vērtējums", player.advancedStats?.rating]]
              ).map(([label, value]) => (
                <div key={label} className="rounded-xl border border-emerald-950 bg-[#04140f] p-3"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-xl font-black text-white">{value === null || value === undefined || value === "" ? "—" : value}</p></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



export {
  RecommendationExplanation,
  RecommendationRecentForm,
  RecommendationNextFixtures,
  RecommendationFixture,
  RecommendationCompare,
  RecommendationDetail,
  RECOMMENDATION_STYLES,
};