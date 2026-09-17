const BASE_URL = "/api";

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

const CACHE_PREFIX = "flow_football_data_v2_";
const CACHE_TIME = 1000 * 60 * 30;

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const toNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const getCache = key => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed?.timestamp ||
      !parsed?.data ||
      Date.now() - parsed.timestamp > CACHE_TIME
    ) {
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
  } catch {}
};

const getPositionCategory = position => {
  const p = String(position || "")
    .toLowerCase()
    .trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk"
  ) {
    return "GOALKEEPERS";
  }

  if (
    p.includes("defence") ||
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back")
  ) {
    return "DEFENDERS";
  }

  if (
    p.includes("midfield") ||
    p.includes("midfielder")
  ) {
    return "MIDFIELDERS";
  }

  if (
    p.includes("offence") ||
    p.includes("offense") ||
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("winger")
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

  return Math.max(
    0,
    Math.round(
      goals * (goalPoints[category] || 4) +
      assists * 3 +
      penalties * 2
    )
  );
};

const buildRadarStats = (player, players) => {
  const max = field =>
    Math.max(
      1,
      ...players.map(item => toNumber(item[field]))
    );

  const relative = (value, maximum) =>
    Math.min(
      100,
      Math.round(
        (toNumber(value) / maximum) * 100
      )
    );

  return {
    goals: relative(player.goals, max("goals")),
    assists: relative(player.assists, max("assists")),
    points: relative(player.points, max("points")),
    appearances: relative(
      player.appearances,
      max("appearances")
    ),
    cleanSheets: 0,
    experience: relative(
      player.appearances,
      max("appearances")
    ),
  };
};

const buildFormMetrics = (player, players) => {
  const max = field =>
    Math.max(
      1,
      ...players.map(item => toNumber(item[field]))
    );

  return [
    {
      label: "Punkti",
      value: Math.min(
        100,
        Math.round(
          (player.points / max("points")) * 100
        )
      ),
    },
    {
      label: "Vārti",
      value: Math.min(
        100,
        Math.round(
          (player.goals / max("goals")) * 100
        )
      ),
    },
    {
      label: "Assist",
      value: Math.min(
        100,
        Math.round(
          (player.assists / max("assists")) * 100
        )
      ),
    },
    {
      label: "Spēles",
      value: Math.min(
        100,
        Math.round(
          (player.appearances / max("appearances")) *
            100
        )
      ),
    },
  ];
};

const scorerMap = scorers => {
  const map = new Map();

  for (const item of scorers || []) {
    const player = item?.player;

    if (player?.id != null) {
      map.set(String(player.id), item);
    }
  }

  return map;
};

const normalizePlayers = (teams, scorers) => {
  const stats = scorerMap(scorers);
  const players = [];
  const ids = new Set();

  for (const team of teams || []) {
    for (const player of team?.squad || []) {
      const id = player?.id;

      if (id == null || ids.has(String(id))) {
        continue;
      }

      const category = getPositionCategory(
        player.position
      );

      if (!category) {
        continue;
      }

      const scorer = stats.get(String(id)) || {};

      const goals = toNumber(scorer.goals);
      const assists = toNumber(scorer.assists);
      const penalties = toNumber(
        scorer.penalties
      );

      const appearances = toNumber(
        scorer.playedMatches
      );

      const normalized = {
        id,
        name:
          player.name ||
          scorer.player?.name ||
          "Nezināms spēlētājs",

        teamId:
          team.id ||
          scorer.team?.id ||
          null,

        team:
          team.name ||
          scorer.team?.name ||
          "Nezināms klubs",

        position:
          player.position ||
          "Unknown",

        positionLabel:
          getPositionLabel(category),

        category,

        goals,
        assists,
        penalties,
        appearances,

        minutes: null,
        cleanSheets: null,
        yellowCards: null,
        redCards: null,

        points: calculateFantasyPoints({
          category,
          goals,
          assists,
          penalties,
        }),

        photo:
          player.image ||
          player.photo ||
          null,

        realStats: {
          appearances,
          goals,
          assists,
          penalties,
          minutes: null,
          cleanSheets: null,
          yellowCards: null,
          redCards: null,
        },

        customStats: {},
        formMetrics: [],
        recentForm: [],
      };

      ids.add(String(id));
      players.push(normalized);
    }
  }

  /*
   * If the teams endpoint contains no squad data,
   * keep scorer players so the application still works.
   */
  if (!players.length) {
    for (const item of scorers || []) {
      const player = item?.player || {};
      const team = item?.team || {};

      const category = getPositionCategory(
        player.position
      );

      if (
        player.id == null ||
        !category ||
        ids.has(String(player.id))
      ) {
        continue;
      }

      const goals = toNumber(item.goals);
      const assists = toNumber(item.assists);
      const penalties = toNumber(item.penalties);
      const appearances = toNumber(
        item.playedMatches
      );

      ids.add(String(player.id));

      players.push({
        id: player.id,
        name:
          player.name ||
          "Nezināms spēlētājs",
        teamId: team.id || null,
        team:
          team.name ||
          "Nezināms klubs",
        position:
          player.position ||
          "Unknown",
        positionLabel:
          getPositionLabel(category),
        category,
        goals,
        assists,
        penalties,
        appearances,
        minutes: null,
        cleanSheets: null,
        yellowCards: null,
        redCards: null,
        points: calculateFantasyPoints({
          category,
          goals,
          assists,
          penalties,
        }),
        photo: null,
        realStats: {
          appearances,
          goals,
          assists,
          penalties,
          minutes: null,
          cleanSheets: null,
          yellowCards: null,
          redCards: null,
        },
        customStats: {},
        formMetrics: [],
        recentForm: [],
      });
    }
  }

  return players.map(player => ({
    ...player,
    customStats: buildRadarStats(
      player,
      players
    ),
    formMetrics: buildFormMetrics(
      player,
      players
    ),
  }));
};

const request = async (competition, season) => {
  const response = await fetch(
    `${BASE_URL}/football.php?competition=${encodeURIComponent(
      competition
    )}&season=${encodeURIComponent(season)}`,
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
  } catch {}

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `API kļūda: ${response.status}`
    );
  }

  if (data?.success === false) {
    throw new Error(
      data.error ||
        "Football-data.org API kļūda."
    );
  }

  return data;
};

export const seasonToApiSeason = season => {
  if (typeof season === "number") {
    return season;
  }

  const match = String(season).match(
    /^(\d{4})/
  );

  return match
    ? Number(match[1])
    : new Date().getFullYear();
};

export const fetchApiSportsPlayers = async (
  leagueId = "PL",
  season = 2025,
  options = {}
) => {
  const competition =
    COMPETITION_IDS[leagueId] ||
    leagueId;

  const apiSeason =
    seasonToApiSeason(season);

  const cacheKey =
    `players_${competition}_${apiSeason}`;

  if (!options.forceRefresh) {
    const cached = getCache(cacheKey);

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

  const data = await request(
    competition,
    apiSeason
  );

  if (!Array.isArray(data?.teams)) {
    throw new Error(
      "API neatgrieza komandu sastāvus."
    );
  }

  const players = normalizePlayers(
    data.teams,
    data.scorers || []
  ).map(player => ({
    ...player,
    league: competition,
    season: String(apiSeason),
  }));

  if (!players.length) {
    throw new Error(
      "Šai līgai un sezonai nav pieejamu spēlētāju datu."
    );
  }

  setCache(cacheKey, players);

  options.onProgress?.({
    current: 1,
    total: 1,
    cached: false,
  });

  return players;
};

export const fetchCompetitionStandings =
  async () => [];

export const getTeamFdr =
  async () => 3;

export const clearFootballDataCache = () => {
  try {
    Object.keys(localStorage)
      .filter(key =>
        key.startsWith(
          CACHE_PREFIX
        )
      )
      .forEach(key =>
        localStorage.removeItem(key)
      );
  } catch {}
};

export const getPositionName = category =>
  POSITION_LABELS[category] ||
  category;