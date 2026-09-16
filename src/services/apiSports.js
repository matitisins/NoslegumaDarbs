const BASE_URL = "/api";

const CACHE_PREFIX = "flow_football_data_";

const CACHE_TIME =
  30 * 60 * 1000;

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

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const num = value => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const getCache = key => {
  try {
    const raw = localStorage.getItem(
      `${CACHE_PREFIX}${key}`
    );

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);

    if (
      !parsed?.timestamp ||
      !parsed?.data
    ) {
      return null;
    }

    if (
      Date.now() - parsed.timestamp >
      CACHE_TIME
    ) {
      localStorage.removeItem(
        `${CACHE_PREFIX}${key}`
      );

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
    // localStorage errors are ignored.
  }
};

const getPositionCategory = position => {
  if (!position) {
    return "STRIKERS";
  }

  const normalized = String(position)
    .trim()
    .toLowerCase();

  if (
    normalized.includes("goalkeeper") ||
    normalized.includes("keeper")
  ) {
    return "GOALKEEPERS";
  }

  if (
    normalized.includes("defence") ||
    normalized.includes("defender") ||
    normalized.includes("back") ||
    normalized.includes("centre-back") ||
    normalized.includes("center-back")
  ) {
    return "DEFENDERS";
  }

  if (
    normalized.includes("midfield") ||
    normalized.includes("midfielder")
  ) {
    return "MIDFIELDERS";
  }

  return "STRIKERS";
};

const getPositionLabel = category =>
  POSITION_LABELS[category] ||
  "Uzbrucēji";

/*
 * Fantasy calculation uses only statistics
 * actually available from the scorer endpoint.
 */
const calculateFantasyPoints = ({
  category,
  goals,
  assists,
  penalties,
}) => {
  let points = 0;

  if (
    category === "GOALKEEPERS"
  ) {
    points += goals * 10;
    points += assists * 3;
  } else if (
    category === "DEFENDERS"
  ) {
    points += goals * 6;
    points += assists * 3;
  } else if (
    category === "MIDFIELDERS"
  ) {
    points += goals * 5;
    points += assists * 3;
  } else {
    points += goals * 4;
    points += assists * 3;
  }

  points += penalties * 2;

  return Math.max(
    0,
    Math.round(points)
  );
};

const relative = (
  value,
  max
) => {
  return Math.min(
    100,
    Math.round(
      (Number(value || 0) /
        Math.max(
          1,
          Number(max || 1)
        )) *
        100
    )
  );
};

const buildRadarStats = (
  player,
  allPlayers
) => {
  const maxGoals = Math.max(
    1,
    ...allPlayers.map(
      item => item.goals
    )
  );

  const maxAssists = Math.max(
    1,
    ...allPlayers.map(
      item => item.assists
    )
  );

  const maxPoints = Math.max(
    1,
    ...allPlayers.map(
      item => item.points
    )
  );

  const maxAppearances =
    Math.max(
      1,
      ...allPlayers.map(
        item => item.appearances
      )
    );

  return {
    goals: relative(
      player.goals,
      maxGoals
    ),

    assists: relative(
      player.assists,
      maxAssists
    ),

    points: relative(
      player.points,
      maxPoints
    ),

    appearances: relative(
      player.appearances,
      maxAppearances
    ),

    cleanSheets: 0,

    experience: relative(
      player.appearances,
      maxAppearances
    ),
  };
};

const buildFormMetrics = (
  player,
  players
) => {
  const maxGoals = Math.max(
    1,
    ...players.map(
      item => item.goals
    )
  );

  const maxAssists = Math.max(
    1,
    ...players.map(
      item => item.assists
    )
  );

  const maxPoints = Math.max(
    1,
    ...players.map(
      item => item.points
    )
  );

  const maxApps = Math.max(
    1,
    ...players.map(
      item => item.appearances
    )
  );

  return [
    {
      label: "Punkti",
      value: relative(
        player.points,
        maxPoints
      ),
    },

    {
      label: "Vārti",
      value: relative(
        player.goals,
        maxGoals
      ),
    },

    {
      label: "Assist",
      value: relative(
        player.assists,
        maxAssists
      ),
    },

    {
      label: "Spēles",
      value: relative(
        player.appearances,
        maxApps
      ),
    },
  ];
};

const normalizeScorers = scorers => {
  const players = scorers.map(
    (item, index) => {
      const player =
        item?.player || {};

      const team =
        item?.team || {};

      const goals = num(
        item.goals
      );

      const assists = num(
        item.assists
      );

      const penalties = num(
        item.penalties
      );

      const appearances = num(
        item.playedMatches
      );

      const position =
        player.position ||
        "Forward";

      const category =
        getPositionCategory(
          position
        );

      const points =
        calculateFantasyPoints({
          category,
          goals,
          assists,
          penalties,
        });

      return {
        id:
          player.id ||
          `player-${index + 1}`,

        name:
          player.name ||
          "Nezināms spēlētājs",

        teamId:
          team.id || null,

        team:
          team.name ||
          "Nezināms klubs",

        position,

        positionLabel:
          getPositionLabel(
            category
          ),

        category,

        /*
         * REAL API STATISTICS
         */
        goals,

        assists,

        penalties,

        appearances,

        /*
         * These are not provided by
         * the current scorer response.
         */
        minutes: null,

        cleanSheets: null,

        yellowCards: null,

        redCards: null,

        points,

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
      };
    }
  );

  const unique = [];

  const ids = new Set();

  for (
    const player of players
  ) {
    if (
      ids.has(player.id)
    ) {
      continue;
    }

    ids.add(player.id);

    unique.push(player);
  }

  return unique.map(
    player => ({
      ...player,

      customStats:
        buildRadarStats(
          player,
          unique
        ),

      formMetrics:
        buildFormMetrics(
          player,
          unique
        ),
    })
  );
};

const request = async (
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

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `API kļūda: ${response.status}`
    );
  }

  return data;
};

export const seasonToApiSeason =
  season => {
    if (
      typeof season ===
      "number"
    ) {
      return season;
    }

    const match =
      String(season).match(
        /^(\d{4})/
      );

    if (match) {
      return Number(
        match[1]
      );
    }

    return new Date()
      .getFullYear();
  };

export const fetchApiSportsPlayers =
  async (
    leagueId = "PL",
    season = 2025,
    options = {}
  ) => {
    const competition =
      COMPETITION_IDS[
        leagueId
      ] || leagueId;

    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `players_${competition}_${apiSeason}`;

    if (
      !options.forceRefresh
    ) {
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

    const data =
      await request(
        competition,
        apiSeason
      );

    if (
      !Array.isArray(
        data?.scorers
      )
    ) {
      throw new Error(
        "API neatgriež spēlētāju statistiku."
      );
    }

    const players =
      normalizeScorers(
        data.scorers
      ).map(player => ({
        ...player,

        league:
          competition,

        season:
          String(apiSeason),
      }));

    if (!players.length) {
      throw new Error(
        "Šai līgai un sezonai nav pieejamu spēlētāju datu."
      );
    }

    setCache(
      cacheKey,
      players
    );

    options.onProgress?.({
      current: 1,
      total: 1,
      cached: false,
    });

    return players;
  };

/*
 * FDR is intentionally kept separate
 * from player statistics.
 *
 * If no team difficulty data is available,
 * Flow uses a neutral value of 3.
 */
export const getTeamFdr =
  async (
    teamId,
    league,
    season
  ) => {
    void teamId;
    void league;
    void season;

    return 3;
  };

export const fetchCompetitionStandings =
  async () => {
    return [];
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
      // Ignore localStorage errors.
    }
  };

export const getPositionName =
  category =>
    POSITION_LABELS[
      category
    ] || category;