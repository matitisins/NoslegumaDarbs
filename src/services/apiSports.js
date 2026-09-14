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

const CACHE_PREFIX =
  "flow_football_data_";

const CACHE_TIME =
  1000 * 60 * 30;

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const getCache = (key) => {
  try {
    const raw =
      localStorage.getItem(
        `${CACHE_PREFIX}${key}`
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

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
    // Ignore localStorage errors.
  }
};

const getPositionCategory = (
  position
) => {
  if (!position) {
    return "STRIKERS";
  }

  const normalized =
    String(position)
      .trim()
      .toLowerCase();

  /*
   * Goalkeepers
   */
  if (
    normalized.includes(
      "goalkeeper"
    ) ||
    normalized.includes(
      "keeper"
    )
  ) {
    return "GOALKEEPERS";
  }

  /*
   * Defenders
   *
   * football-data.org can return:
   * Defence
   * Defender
   * Centre-Back
   * Centre Back
   * Left-Back
   * Right-Back
   * Full-Back
   */
  if (
    normalized.includes(
      "defence"
    ) ||
    normalized.includes(
      "defender"
    ) ||
    normalized.includes(
      "back"
    ) ||
    normalized.includes(
      "centre-back"
    ) ||
    normalized.includes(
      "center-back"
    )
  ) {
    return "DEFENDERS";
  }

  /*
   * Midfielders
   *
   * football-data.org can return:
   * Midfield
   * Midfielder
   * Central Midfield
   * Defensive Midfield
   * Attacking Midfield
   */
  if (
    normalized.includes(
      "midfield"
    ) ||
    normalized.includes(
      "midfielder"
    )
  ) {
    return "MIDFIELDERS";
  }

  /*
   * Everything else becomes an attacker.
   */
  return "STRIKERS";
};

const getPositionLabel = (
  category
) =>
  POSITION_LABELS[category] ||
  "Uzbrucēji";

const calculateFantasyPoints = ({
  category,
  goals,
  assists,
  cleanSheets,
  yellowCards,
  redCards,
  penalties,
}) => {
  let points = 0;

  if (
    category ===
    "GOALKEEPERS"
  ) {
    points += goals * 10;
    points += assists * 3;
    points += cleanSheets * 4;
  } else if (
    category ===
    "DEFENDERS"
  ) {
    points += goals * 6;
    points += assists * 3;
    points += cleanSheets * 4;
  } else if (
    category ===
    "MIDFIELDERS"
  ) {
    points += goals * 5;
    points += assists * 3;
    points += cleanSheets;
  } else {
    points += goals * 4;
    points += assists * 3;
  }

  points += penalties * 2;

  points -= yellowCards;

  points -= redCards * 3;

  return Math.max(
    0,
    Math.round(points)
  );
};

const buildCustomStats = (
  player,
  allPlayers
) => {
  const maxGoals =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.goals
      )
    );

  const maxAssists =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.assists
      )
    );

  const maxPoints =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.points
      )
    );

  const maxCleanSheets =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.cleanSheets
      )
    );

  const relative = (
    value,
    maximum
  ) =>
    Math.min(
      100,
      Math.round(
        (value / maximum) *
          100
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

    cleanSheets:
      relative(
        player.cleanSheets,
        maxCleanSheets
      ),

    experience:
      Math.min(
        100,
        player.appearances * 5
      ),
  };
};

const buildFormMetrics = (
  player,
  allPlayers
) => {
  const maxPoints =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.points
      )
    );

  const maxGoals =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.goals
      )
    );

  const maxAssists =
    Math.max(
      1,
      ...allPlayers.map(
        (item) =>
          item.assists
      )
    );

  return [
    {
      label: "Punkti",

      value: Math.min(
        100,
        Math.round(
          (player.points /
            maxPoints) *
            100
        )
      ),
    },

    {
      label: "Vārti",

      value: Math.min(
        100,
        Math.round(
          (player.goals /
            maxGoals) *
            100
        )
      ),
    },

    {
      label: "Assist",

      value: Math.min(
        100,
        Math.round(
          (player.assists /
            maxAssists) *
            100
        )
      ),
    },

    {
      label: "Spēles",

      value: Math.min(
        100,
        player.appearances *
          5
      ),
    },

    {
      label: "Tīras spēles",

      value: Math.min(
        100,
        player.cleanSheets *
          10
      ),
    },
  ];
};

const normalizeScorers = (
  scorers
) => {
  const players =
    scorers.map(
      (item, index) => {
        const player =
          item?.player || {};

        const team =
          item?.team || {};

        const goals =
          toNumber(
            item?.goals
          );

        const assists =
          toNumber(
            item?.assists
          );

        const penalties =
          toNumber(
            item?.penalties
          );

        const position =
          player.position ||
          "Forward";

        const category =
          getPositionCategory(
            position
          );

        const cleanSheets =
          0;

        const yellowCards =
          0;

        const redCards =
          0;

        const appearances =
          toNumber(
            item?.playedMatches
          );

        const points =
          calculateFantasyPoints({
            category,
            goals,
            assists,
            cleanSheets,
            yellowCards,
            redCards,
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
            team.id ||
            null,

          team:
            team.name ||
            "Nezināms klubs",

          position,

          positionLabel:
            getPositionLabel(
              category
            ),

          category,

          goals,

          assists,

          penalties,

          minutes: 0,

          appearances,

          cleanSheets,

          yellowCards,

          redCards,

          points,

          photo: null,

          customStats: {},

          formMetrics: [],

          recentForm: [],
        };
      }
    );

  const unique = [];

  const ids =
    new Set();

  for (
    const player
    of players
  ) {
    if (
      ids.has(
        player.id
      )
    ) {
      continue;
    }

    ids.add(
      player.id
    );

    unique.push(
      player
    );
  }

  return unique.map(
    (player) => ({
      ...player,

      customStats:
        buildCustomStats(
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
  (season) => {
    if (
      typeof season ===
      "number"
    ) {
      return season;
    }

    const match =
      String(
        season
      ).match(
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
    season = 2026,
    options = {}
  ) => {
    const competition =
      COMPETITION_IDS[
        leagueId
      ] ||
      leagueId;

    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `scorers_${competition}_${apiSeason}`;

    if (
      !options.forceRefresh
    ) {
      const cached =
        getCache(
          cacheKey
        );

      if (
        Array.isArray(
          cached
        ) &&
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
        "API neatgrieza spēlētāju statistiku."
      );
    }

    const players =
      normalizeScorers(
        data.scorers
      ).map(
        (player) => ({
          ...player,

          league:
            competition,

          season:
            String(
              apiSeason
            ),
        })
      );

    if (
      !players.length
    ) {
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

export const fetchCompetitionStandings =
  async (
    leagueId = "PL",
    season = 2026
  ) => {
    return [];
  };

export const getTeamFdr =
  async () => {
    return 3;
  };

export const clearFootballDataCache =
  () => {
    try {
      Object.keys(
        localStorage
      )
        .filter(
          (key) =>
            key.startsWith(
              CACHE_PREFIX
            )
        )
        .forEach(
          (key) =>
            localStorage.removeItem(
              key
            )
        );
    } catch {
      // Ignore cache errors.
    }
  };

export const getPositionName =
  (category) =>
    POSITION_LABELS[
      category
    ] ||
    category;