/*
 * Nodrošina Flow lietotnes savienojumu ar backend API un apstrādā
 * spēlētāju, līgu, sezonu, turnīra tabulas un FDR datus.
 * Pārveido API-Football statistiku lietotnes spēlētāju datos, aprēķina
 * Flow punktus un pozīcijām atbilstošus statistikas percentiļus.
 * Nodrošina datu kešatmiņu, spēlētāju profilu ielādi un API pieprasījumu
 * apstrādi, lai frontend daļa varētu izmantot iegūtos datus.
 */

const BASE_URL =
  "http://localhost/Nosleguma_Darbs/Nosleguma_Darbs/backend/api";

export const COMPETITION_IDS = {
  PL: "PL",
  PD: "PD",
  SA: "SA",
  BL1: "BL1",
  FL1: "FL1",
  PREMIER_LEAGUE: "PL",
  LA_LIGA: "PD",
  SERIE_A: "SA",
  BUNDESLIGA: "BL1",
  LIGUE_1: "FL1",
};

export const LEAGUE_NAMES = {
  PL: "Premier League",
  PD: "La Liga",
  SA: "Serie A",
  BL1: "Bundesliga",
  FL1: "Ligue 1",
};

const API_FOOTBALL_LEAGUES = {
  PL: 39,
  PD: 140,
  SA: 135,
  BL1: 78,
  FL1: 61,
};

const CACHE_PREFIX = "flow_api_football_v8_";
const CACHE_TIME = 1000 * 60 * 60;

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const toNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const nullableNumber = value => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizePercentage = value => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(String(value).replace("%", ""));
  return Number.isFinite(number) ? number : null;
};

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const getCache = key => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.timestamp || !Array.isArray(parsed.data)) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TIME) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const getAnyCache = key => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (!parsed?.timestamp || parsed.data === undefined) {
      return null;
    }

    if (Date.now() - parsed.timestamp > CACHE_TIME) {
      localStorage.removeItem(`${CACHE_PREFIX}${key}`);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
};

const setCache = (key, data) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore browser storage limits.
  }
};

const getPositionCategory = position => {
  const p = String(position || "").toLowerCase().trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p === "g"
  ) {
    return "GOALKEEPERS";
  }

  if (
    p.includes("defence") ||
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p === "d"
  ) {
    return "DEFENDERS";
  }

  if (
    p.includes("midfield") ||
    p.includes("midfielder") ||
    p === "m"
  ) {
    return "MIDFIELDERS";
  }

  if (
    p.includes("offence") ||
    p.includes("offense") ||
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("winger") ||
    p === "f"
  ) {
    return "STRIKERS";
  }

  return null;
};

const getPositionLabel = category =>
  POSITION_LABELS[category] || "Spēlētājs";

const calculateFantasyPoints = ({
  category,
  goals,
  assists,
  penalties,
}) => {
  const goalPoints = {
    GOALKEEPERS: 10,
    DEFENDERS: 6,
    MIDFIELDERS: 5,
    STRIKERS: 4,
  };

  const penaltyPoints =
    category === "MIDFIELDERS" || category === "STRIKERS"
      ? toNumber(penalties) * 2
      : 0;

  return Math.max(
    0,
    Math.round(
      toNumber(goals) * (goalPoints[category] || 4) +
        toNumber(assists) * 3 +
        penaltyPoints
    )
  );
};

const sumField = (stats, selector) =>
  stats.reduce((total, item) => {
    const value = selector(item);

    return value === null || value === undefined
      ? total
      : total + toNumber(value);
  }, 0);

const firstNonNull = (stats, selector) => {
  for (const item of stats) {
    const value = selector(item);

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

const weightedAverage = (
  stats,
  valueSelector,
  weightSelector
) => {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const item of stats) {
    const value = nullableNumber(valueSelector(item));
    const weight = toNumber(weightSelector(item));

    if (value === null) continue;

    if (weight > 0) {
      weightedTotal += value * weight;
      weightTotal += weight;
    }
  }

  if (weightTotal > 0) {
    return (
      Math.round(
        (weightedTotal / weightTotal) * 10
      ) / 10
    );
  }

  const values = stats
    .map(item => nullableNumber(valueSelector(item)))
    .filter(value => value !== null);

  if (!values.length) return null;

  return (
    Math.round(
      (values.reduce(
        (sum, value) => sum + value,
        0
      ) /
        values.length) *
        10
    ) / 10
  );
};

const aggregatePlayerStats = statistics => {
  const stats = Array.isArray(statistics)
    ? statistics.filter(Boolean)
    : [];

  if (!stats.length) {
    return {
      teamId: null,
      team: null,
      teamLogo: null,
      position: null,
      appearances: 0,
      minutes: 0,
      goals: 0,
      assists: 0,
      penaltyGoals: 0,
      shots: 0,
      shotsOnTarget: 0,
      passes: 0,
      keyPasses: 0,
      passAccuracy: null,
      tackles: 0,
      blocks: 0,
      interceptions: 0,
      duels: 0,
      duelsWon: 0,
      dribbleAttempts: 0,
      successfulDribbles: 0,
      foulsDrawn: 0,
      foulsCommitted: 0,
      yellowCards: 0,
      yellowRedCards: 0,
      redCards: 0,
      penaltiesMissed: 0,
      penaltiesWon: 0,
      saves: 0,
      goalsConceded: 0,
      rating: null,
      starts: 0,
      substituteIn: 0,
      substituteOut: 0,
      bench: 0,
    };
  }

  const appearances = sumField(
    stats,
    item => item.games?.appearences
  );

  const minutes = sumField(
    stats,
    item => item.games?.minutes
  );

  const passes = sumField(
    stats,
    item => item.passes?.total
  );

  const accuratePasses = sumField(stats, item => {
    const total = nullableNumber(item.passes?.total);
    const accuracy = normalizePercentage(
      item.passes?.accuracy
    );

    if (total === null || accuracy === null) {
      return null;
    }

    return (total * accuracy) / 100;
  });

  const duels = sumField(
    stats,
    item => item.duels?.total
  );

  const duelsWon = sumField(
    stats,
    item => item.duels?.won
  );

  const dribbleAttempts = sumField(
    stats,
    item => item.dribbles?.attempts
  );

  const successfulDribbles = sumField(
    stats,
    item => item.dribbles?.success
  );

  const passAccuracy =
    passes > 0 && accuratePasses >= 0
      ? Math.round(
          (accuratePasses / passes) * 10
        ) / 10
      : weightedAverage(
          stats,
          item =>
            normalizePercentage(
              item.passes?.accuracy
            ),
          item => item.passes?.total
        );

  const duelsWonPercentage =
    duels > 0
      ? Math.round(
          (duelsWon / duels) * 1000
        ) / 10
      : null;

  const dribbleSuccess =
    dribbleAttempts > 0
      ? Math.round(
          (successfulDribbles /
            dribbleAttempts) *
            1000
        ) / 10
      : null;

  return {
    teamId: firstNonNull(
      stats,
      item => item.team?.id
    ),

    team: firstNonNull(
      stats,
      item => item.team?.name
    ),

    teamLogo: firstNonNull(
      stats,
      item => item.team?.logo
    ),

    position: firstNonNull(
      stats,
      item => item.games?.position
    ),

    appearances,
    minutes,

    goals: sumField(
      stats,
      item => item.goals?.total
    ),

    assists: sumField(
      stats,
      item => item.goals?.assists
    ),

    penaltyGoals: sumField(
      stats,
      item => item.penalty?.scored
    ),

    shots: sumField(
      stats,
      item => item.shots?.total
    ),

    shotsOnTarget: sumField(
      stats,
      item => item.shots?.on
    ),

    passes,

    keyPasses: sumField(
      stats,
      item => item.passes?.key
    ),

    passAccuracy,

    tackles: sumField(
      stats,
      item => item.tackles?.total
    ),

    blocks: sumField(
      stats,
      item => item.tackles?.blocks
    ),

    interceptions: sumField(
      stats,
      item => item.tackles?.interceptions
    ),

    duels,
    duelsWon,
    duelsWonPercentage,

    dribbleAttempts,
    successfulDribbles,
    dribbleSuccess,

    foulsDrawn: sumField(
      stats,
      item => item.fouls?.drawn
    ),

    foulsCommitted: sumField(
      stats,
      item => item.fouls?.committed
    ),

    yellowCards: sumField(
      stats,
      item => item.cards?.yellow
    ),

    yellowRedCards: sumField(
      stats,
      item => item.cards?.yellowred
    ),

    redCards: sumField(
      stats,
      item => item.cards?.red
    ),

    penaltiesMissed: sumField(
      stats,
      item => item.penalty?.missed
    ),

    penaltiesWon: sumField(
      stats,
      item => item.penalty?.won
    ),

    saves: sumField(
      stats,
      item => item.goals?.saves
    ),

    goalsConceded: sumField(
      stats,
      item => item.goals?.conceded
    ),

    rating: weightedAverage(
      stats,
      item => item.games?.rating,
      item => item.games?.minutes
    ),

    starts: sumField(
      stats,
      item => item.games?.lineups
    ),

    substituteIn: sumField(
      stats,
      item => item.substitutes?.in
    ),

    substituteOut: sumField(
      stats,
      item => item.substitutes?.out
    ),

    bench: sumField(
      stats,
      item => item.substitutes?.bench
    ),
  };
};

const calculateSavePercentage = stats => {
  const saves = nullableNumber(stats.saves);
  const conceded = nullableNumber(
    stats.goalsConceded
  );

  if (
    saves === null ||
    conceded === null ||
    saves + conceded <= 0
  ) {
    return null;
  }

  return (
    Math.round(
      (saves / (saves + conceded)) * 1000
    ) / 10
  );
};

const buildAdvancedStats = aggregated => ({
  ...aggregated,
  savePercentage:
    calculateSavePercentage(aggregated),
});

const radarDefinitions = {
  GOALKEEPERS: [
    { label: "Saves", key: "saves" },
    {
      label: "Save %",
      key: "savePercentage",
    },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    { label: "Rating", key: "rating" },
    { label: "Minutes", key: "minutes" },
    {
      label: "Appearances",
      key: "appearances",
    },
  ],

  DEFENDERS: [
    { label: "Tackles", key: "tackles" },
    {
      label: "Interceptions",
      key: "interceptions",
    },
    { label: "Blocks", key: "blocks" },
    {
      label: "Duels won %",
      key: "duelsWonPercentage",
    },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    { label: "Minutes", key: "minutes" },
  ],

  MIDFIELDERS: [
    {
      label: "Key passes",
      key: "keyPasses",
    },
    { label: "Passes", key: "passes" },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    {
      label: "Dribbles",
      key: "successfulDribbles",
    },
    {
      label: "Duels won %",
      key: "duelsWonPercentage",
    },
    {
      label: "Shots on target",
      key: "shotsOnTarget",
    },
  ],

  STRIKERS: [
    { label: "Goals", key: "goals" },
    { label: "Assists", key: "assists" },
    { label: "Shots", key: "shots" },
    {
      label: "Shots on target",
      key: "shotsOnTarget",
    },
    {
      label: "Key passes",
      key: "keyPasses",
    },
    {
      label: "Dribbles",
      key: "successfulDribbles",
    },
  ],
};

const getRadarRawValue = (player, key) => {
  const value = player?.advancedStats?.[key];

  if (value === null || value === undefined) {
    return null;
  }

  return toNumber(value);
};

const percentileRank = (value, values) => {
  if (
    value === null ||
    value === undefined ||
    !values.length
  ) {
    return null;
  }

  const sorted = [...values].sort(
    (a, b) => a - b
  );

  if (sorted.length === 1) {
    return 50;
  }

  const lower = sorted.filter(
    item => item < value
  ).length;

  const equal = sorted.filter(
    item => item === value
  ).length;

  if (
    lower === 0 &&
    equal === sorted.length
  ) {
    return 50;
  }

  const percentile =
    ((lower + (equal - 1) / 2) /
      (sorted.length - 1)) *
    100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(percentile)
    )
  );
};

const buildRadarStats = (
  player,
  players
) => {
  const definition =
    radarDefinitions[player.category] ||
    radarDefinitions.STRIKERS;

  const labels = [];
  const values = [];

  const positionPlayers = players.filter(
    candidate =>
      candidate.category ===
        player.category &&
      toNumber(candidate.minutes) > 0
  );

  const referencePlayers =
    positionPlayers.length
      ? positionPlayers
      : players.filter(
          candidate =>
            candidate.category ===
            player.category
        );

  for (const item of definition) {
    const current = getRadarRawValue(
      player,
      item.key
    );

    const available = referencePlayers
      .map(candidate =>
        getRadarRawValue(
          candidate,
          item.key
        )
      )
      .filter(value => value !== null);

    if (
      current === null ||
      !available.length
    ) {
      continue;
    }

    const percentile =
      percentileRank(
        current,
        available
      );

    if (percentile === null) {
      continue;
    }

    labels.push(item.label);
    values.push(percentile);
  }

  return {
    labels,
    values,
  };
};

const buildRadarPercentiles = (
  player,
  players
) => {
  const positionPlayers = players.filter(
    candidate =>
      candidate.category ===
        player.category &&
      toNumber(candidate.minutes) > 0
  );

  const referencePlayers =
    positionPlayers.length
      ? positionPlayers
      : players.filter(
          candidate =>
            candidate.category ===
            player.category
        );

  const keys = [
    ...new Set(
      Object.values(radarDefinitions)
        .flat()
        .map(item => item.key)
    ),
  ];

  const result = {};

  for (const key of keys) {
    const current =
      getRadarRawValue(
        player,
        key
      );

    if (current === null) {
      continue;
    }

    const available =
      referencePlayers
        .map(candidate =>
          getRadarRawValue(
            candidate,
            key
          )
        )
        .filter(
          value => value !== null
        );

    if (!available.length) {
      continue;
    }

    result[key] =
      percentileRank(
        current,
        available
      );
  }

  return result;
};

const buildFormMetrics = player => [
  {
    label: "Punkti",
    value: toNumber(player.points),
  },
  {
    label: "Vārti",
    value: toNumber(player.goals),
  },
  {
    label: "Assist",
    value: toNumber(player.assists),
  },
  {
    label: "Spēles",
    value: toNumber(player.appearances),
  },
];

const createPlayer = (
  item,
  season,
  competition
) => {
  const player = item?.player || {};

  const aggregated =
    aggregatePlayerStats(
      item?.statistics
    );

  const category =
    getPositionCategory(
      aggregated.position ||
        player.position
    );

  if (
    !category ||
    player.id === null ||
    player.id === undefined
  ) {
    return null;
  }

  const penaltyGoals =
    category === "MIDFIELDERS" ||
    category === "STRIKERS"
      ? aggregated.penaltyGoals
      : null;

  const points =
    calculateFantasyPoints({
      category,
      goals: aggregated.goals,
      assists: aggregated.assists,
      penalties:
        penaltyGoals || 0,
    });

  const advancedStats =
    buildAdvancedStats(
      aggregated
    );

  return {
    id: player.id,

    name:
      player.name ||
      "Nezināms spēlētājs",

    teamId:
      aggregated.teamId,

    team:
      aggregated.team ||
      "Nezināms klubs",

    position:
      aggregated.position ||
      player.position ||
      "Unknown",

    positionLabel:
      getPositionLabel(category),

    category,

    appearances:
      aggregated.appearances,

    minutes:
      aggregated.minutes,

    goals:
      aggregated.goals,

    assists:
      aggregated.assists,

    penalties:
      penaltyGoals,

    points,

    photo:
      player.photo || null,

    nationality:
      player.nationality || null,

    injured:
      Boolean(player.injured),

    age:
      player.age ?? null,

    height:
      player.height || null,

    weight:
      player.weight || null,

    birthDate:
      player.birth?.date || null,

    birthPlace:
      player.birth?.place || null,

    birthCountry:
      player.birth?.country || null,

    number:
      player.number ?? null,

    teamLogo:
      aggregated.teamLogo || null,

    advancedStats: {
      ...advancedStats,
      penaltyGoals,
    },

    realStats: {
      appearances:
        aggregated.appearances,

      minutes:
        aggregated.minutes,

      goals:
        aggregated.goals,

      assists:
        aggregated.assists,

      penalties:
        penaltyGoals,

      yellowCards:
        aggregated.yellowCards,

      redCards:
        aggregated.redCards,
    },

    customStats: {},
    formMetrics: [],
    recentForm: [],
    league: competition,
    season: String(season),
  };
};

const requestApiFootball = async (
  competition,
  season
) => {
  const leagueId =
    API_FOOTBALL_LEAGUES[
      competition
    ];

  if (!leagueId) {
    throw new Error(
      "Izvēlētajai līgai nav API-Football ID."
    );
  }

  const response = await fetch(
    `${BASE_URL}/api-football.php?competition=${encodeURIComponent(
      competition
    )}&season=${encodeURIComponent(
      season
    )}`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  let data = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (
    !response.ok ||
    data?.success === false
  ) {
    throw new Error(
      data?.error ||
        `API-Football kļūda: ${response.status}`
    );
  }

  if (
    !Array.isArray(data?.players)
  ) {
    throw new Error(
      "API-Football neatgrieza spēlētāju statistiku."
    );
  }

  return {
    ...data,
    leagueId,
  };
};

export const seasonToApiSeason =
  season => {
    if (typeof season === "number") {
      return season;
    }

    const match =
      String(season).match(
        /^(\d{4})/
      );

    return match
      ? Number(match[1])
      : new Date().getFullYear();
  };

export const fetchApiSportsPlayers =
  async (
    leagueId = "PL",
    season = 2026,
    options = {}
  ) => {
    const competition =
      COMPETITION_IDS[leagueId] ||
      leagueId;

    const apiSeason =
      seasonToApiSeason(season);

    const cacheKey =
      `${competition}_${apiSeason}`;

    if (!options.forceRefresh) {
      const cached =
        getCache(cacheKey);

      if (
        Array.isArray(cached) &&
        cached.length
      ) {
        options.onProgress?.({
          current: 1,
          total: 1,
          cached: true,
        });

        return cached;
      }
    }

    options.onProgress?.({
      current: 0,
      total: 1,
    });

    const data =
      await requestApiFootball(
        competition,
        apiSeason
      );

    const players =
      (data.players || [])
        .map(item =>
          createPlayer(
            item,
            apiSeason,
            competition
          )
        )
        .filter(Boolean);

    if (!players.length) {
      throw new Error(
        "Šai līgai un sezonai nav pieejamu spēlētāju datu."
      );
    }

    const enriched =
      players.map(player => ({
        ...player,

        customStats:
          buildRadarStats(
            player,
            players
          ),

        radarPercentiles:
          buildRadarPercentiles(
            player,
            players
          ),

        formMetrics:
          buildFormMetrics(
            player
          ),
      }));

    setCache(
      cacheKey,
      enriched
    );

    options.onProgress?.({
      current: 1,
      total: 1,
      cached: false,
    });

    return enriched;
  };

export const fetchPlayerProfile =
  async (
    playerId,
    season = 2026
  ) => {
    const id = Number(playerId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "Nederīgs spēlētāja ID."
      );
    }

    const apiSeason =
      seasonToApiSeason(season);

    const cacheKey =
      `profile_${id}_${apiSeason}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(cacheKey);

      if (
        cached &&
        !Array.isArray(cached)
      ) {
        return cached;
      }
    }

    const response =
      await fetch(
        `${BASE_URL}/player-details.php?player=${encodeURIComponent(
          id
        )}&season=${encodeURIComponent(
          apiSeason
        )}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (
      !response.ok ||
      data?.success === false
    ) {
      throw new Error(
        data?.error ||
          `Spēlētāja profila API kļūda: ${response.status}`
      );
    }

    try {
      localStorage.setItem(
        `${CACHE_PREFIX}${cacheKey}`,
        JSON.stringify({
          timestamp:
            Date.now(),
          data,
        })
      );
    } catch {
      // Ignore cache errors.
    }

    return data;
  };

const fetchFootballData =
  async (
    competition,
    season
  ) => {
    const response =
      await fetch(
        `${BASE_URL}/football.php?competition=${encodeURIComponent(
          competition
        )}&season=${encodeURIComponent(
          season
        )}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (
      !response.ok ||
      data?.success === false
    ) {
      throw new Error(
        data?.error ||
          `football-data.org kļūda: ${response.status}`
      );
    }

    return data;
  };

export const fetchCompetitionStandings =
  async (
    competition = "PL",
    season = 2026
  ) => {
    const apiSeason =
      seasonToApiSeason(season);

    const cacheKey =
      `standings_${competition}_${apiSeason}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(cacheKey);

      if (
        cached &&
        Array.isArray(cached)
      ) {
        return cached;
      }
    }

    const data =
      await fetchFootballData(
        COMPETITION_IDS[
          competition
        ] || competition,
        apiSeason
      );

    const standings =
      Array.isArray(
        data?.standings
      )
        ? data.standings
        : [];

    setCache(
      cacheKey,
      standings
    );

    return standings;
  };

export const getTeamFdr =
  async (
    teamId,
    competition = "PL",
    season = 2026
  ) => {
    const numericTeamId =
      Number(teamId);

    if (
      !Number.isInteger(
        numericTeamId
      ) ||
      numericTeamId <= 0
    ) {
      return 3;
    }

    const apiSeason =
      seasonToApiSeason(season);

    const normalizedCompetition =
      COMPETITION_IDS[
        competition
      ] || competition;

    const cacheKey =
      `fdr_${normalizedCompetition}_${apiSeason}_${numericTeamId}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(cacheKey);

      if (
        cached &&
        Number.isFinite(
          Number(cached.fdr)
        )
      ) {
        return Number(
          cached.fdr
        );
      }
    }

    const response =
      await fetch(
        `${BASE_URL}/api-football.php?mode=fdr&competition=${encodeURIComponent(
          normalizedCompetition
        )}&season=${encodeURIComponent(
          apiSeason
        )}&team=${encodeURIComponent(
          numericTeamId
        )}`,
        {
          method: "GET",
          headers: {
            Accept:
              "application/json",
          },
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (
      !response.ok ||
      data?.success === false
    ) {
      throw new Error(
        data?.error ||
          `FDR API kļūda: ${response.status}`
      );
    }

    const fdr =
      Number(data?.fdr);

    const safeFdr =
      Number.isFinite(fdr)
        ? Math.max(
            1,
            Math.min(5, fdr)
          )
        : 3;

    setCache(cacheKey, {
      fdr: safeFdr,
      fixtures:
        data?.fixtures || [],
    });

    return safeFdr;
  };

export const clearFootballDataCache =
  () => {
    try {
      Object.keys(
        localStorage
      )
        .filter(key =>
          key.startsWith(
            CACHE_PREFIX
          )
        )
        .forEach(key =>
          localStorage.removeItem(
            key
          )
        );
    } catch {
      // Ignore cache errors.
    }
  };

export const getPositionName =
  category =>
    POSITION_LABELS[category] ||
    category;