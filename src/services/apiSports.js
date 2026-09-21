const BASE_URL =
  "http://localhost/Nosleguma_Darbs/Nosleguma_Darbs/backend/api";

export const COMPETITION_IDS = {
  PL: "PL",
  PD: "PD",
  SA: "SA",
  BL1: "BL1",
  FL1: "FL1",
};

const CACHE_PREFIX =
  "flow_football_data_v4_";

const CACHE_TIME =
  30 * 60 * 1000;

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const toNumber = value => {
  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : 0;
};

const getCache = key => {
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
      !parsed ||
      !parsed.timestamp ||
      !Array.isArray(
        parsed.data
      )
    ) {
      return null;
    }

    if (
      Date.now() -
        parsed.timestamp >
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

const setCache = (
  key,
  data
) => {
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

const getPositionCategory =
  position => {
    const value =
      String(position || "")
        .toLowerCase()
        .trim();

    if (
      value.includes(
        "goalkeeper"
      ) ||
      value.includes("keeper") ||
      value === "gk"
    ) {
      return "GOALKEEPERS";
    }

    if (
      value.includes("defender") ||
      value.includes("defence") ||
      value.includes("defense") ||
      value.includes("back")
    ) {
      return "DEFENDERS";
    }

    if (
      value.includes(
        "midfielder"
      ) ||
      value.includes("midfield")
    ) {
      return "MIDFIELDERS";
    }

    if (
      value.includes("forward") ||
      value.includes("striker") ||
      value.includes("attacker") ||
      value.includes("offence") ||
      value.includes("offense") ||
      value.includes("winger")
    ) {
      return "STRIKERS";
    }

    return null;
  };

const getPositionLabel =
  category =>
    POSITION_LABELS[
      category
    ] || "Spēlētājs";

const calculateFantasyPoints =
  ({
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
        goals *
          (goalPoints[
            category
          ] || 4) +
          assists * 3 +
          penalties * 2
      )
    );
  };

const scorerMap = scorers => {
  const map = new Map();

  for (
    const scorer of
      scorers || []
  ) {
    const player =
      scorer?.player;

    if (player?.id != null) {
      map.set(
        String(player.id),
        scorer
      );
    }
  }

  return map;
};

const normalizePlayers = (
  teams,
  scorers
) => {
  const stats =
    scorerMap(scorers);

  const players = [];
  const usedIds = new Set();

  /*
   * First use the full team squads.
   */
  for (
    const team of
      teams || []
  ) {
    for (
      const player of
        team?.squad || []
    ) {
      if (
        player?.id == null
      ) {
        continue;
      }

      const id =
        String(player.id);

      if (usedIds.has(id)) {
        continue;
      }

      const scorer =
        stats.get(id) || {};

      const category =
        getPositionCategory(
          player.position ||
            scorer.player?.position
        );

      if (!category) {
        continue;
      }

      const goals =
        toNumber(
          scorer.goals
        );

      const assists =
        toNumber(
          scorer.assists
        );

      const penalties =
        toNumber(
          scorer.penalties
        );

      const appearances =
        toNumber(
          scorer.playedMatches
        );

      const normalized = {
        id: player.id,

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
          scorer.player?.position ||
          "Unknown",

        positionLabel:
          getPositionLabel(
            category
          ),

        category,

        goals,
        assists,
        penalties,
        appearances,

        minutes: null,
        cleanSheets: null,
        yellowCards: null,
        redCards: null,

        points:
          calculateFantasyPoints({
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

      usedIds.add(id);
      players.push(
        normalized
      );
    }
  }

  /*
   * Fallback to scorers.
   */
  if (!players.length) {
    for (
      const scorer of
        scorers || []
    ) {
      const player =
        scorer?.player || {};

      const team =
        scorer?.team || {};

      if (
        player.id == null
      ) {
        continue;
      }

      const category =
        getPositionCategory(
          player.position
        );

      if (!category) {
        continue;
      }

      const id =
        String(player.id);

      if (usedIds.has(id)) {
        continue;
      }

      const goals =
        toNumber(
          scorer.goals
        );

      const assists =
        toNumber(
          scorer.assists
        );

      const penalties =
        toNumber(
          scorer.penalties
        );

      const appearances =
        toNumber(
          scorer.playedMatches
        );

      usedIds.add(id);

      players.push({
        id: player.id,

        name:
          player.name ||
          "Nezināms spēlētājs",

        teamId:
          team.id || null,

        team:
          team.name ||
          "Nezināms klubs",

        position:
          player.position ||
          "Unknown",

        positionLabel:
          getPositionLabel(
            category
          ),

        category,

        goals,
        assists,
        penalties,
        appearances,

        minutes: null,
        cleanSheets: null,
        yellowCards: null,
        redCards: null,

        points:
          calculateFantasyPoints({
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

  /*
   * Add radar/form values.
   */
  const max = field =>
    Math.max(
      1,
      ...players.map(player =>
        toNumber(
          player[field]
        )
      )
    );

  return players.map(
    player => ({
      ...player,

      customStats: {
        goals: Math.min(
          100,
          Math.round(
            (player.goals /
              max("goals")) *
              100
          )
        ),

        assists: Math.min(
          100,
          Math.round(
            (player.assists /
              max("assists")) *
              100
          )
        ),

        points: Math.min(
          100,
          Math.round(
            (player.points /
              max("points")) *
              100
          )
        ),

        appearances:
          Math.min(
            100,
            Math.round(
              (player.appearances /
                max(
                  "appearances"
                )) *
                100
            )
          ),

        cleanSheets: 0,

        experience:
          Math.min(
            100,
            Math.round(
              (player.appearances /
                max(
                  "appearances"
                )) *
                100
            )
          ),
      },

      formMetrics: [
        {
          label: "Punkti",
          value: Math.min(
            100,
            Math.round(
              (player.points /
                max("points")) *
                100
            ),
          ),
        },

        {
          label: "Vārti",
          value: Math.min(
            100,
            Math.round(
              (player.goals /
                max("goals")) *
                100
            ),
          ),
        },

        {
          label: "Assist",
          value: Math.min(
            100,
            Math.round(
              (player.assists /
                max("assists")) *
                100
            ),
          ),
        },

        {
          label: "Spēles",
          value: Math.min(
            100,
            Math.round(
              (player.appearances /
                max(
                  "appearances"
                )) *
                100
            ),
          ),
        },
      ],
    })
  );
};

const request = async (
  competition,
  season
) => {
  const url =
    `${BASE_URL}/football.php` +
    `?competition=${encodeURIComponent(
      competition
    )}` +
    `&season=${encodeURIComponent(
      season
    )}`;

  console.log(
    "Flow API request:",
    url
  );

  const response =
    await fetch(url, {
      method: "GET",

      headers: {
        Accept:
          "application/json",
      },
    });

  let data;

  try {
    data =
      await response.json();
  } catch {
    data = null;
  }

  console.log(
    "Flow API response:",
    data
  );

  if (!response.ok) {
    throw new Error(
      data?.error ||
        `API kļūda: ${response.status}`
    );
  }

  if (
    data?.success === false
  ) {
    throw new Error(
      data.error ||
        "Football-data.org API kļūda."
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
        Array.isArray(
          cached
        ) &&
        cached.length > 0
      ) {
        console.log(
          `Flow: using ${cached.length} cached players`
        );

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

    const players =
      normalizePlayers(
        data?.teams || [],
        data?.scorers || []
      ).map(player => ({
        ...player,

        league:
          competition,

        season:
          String(apiSeason),
      }));

    if (!players.length) {
      throw new Error(
        "API dati ir saņemti, bet spēlētājus neizdevās klasificēt."
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

export const getTeamFdr =
  async () => 3;

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
      // Ignore storage errors.
    }
  };

export const getPositionName =
  category =>
    POSITION_LABELS[
      category
    ] || category;