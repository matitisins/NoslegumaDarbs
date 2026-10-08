import {
  BASE_URL,
  REQUEST_TIMEOUT,
  isValidSeason,
  isValidCompetition,
  buildApiUrl,
  requestJson,
  API_FOOTBALL_LEAGUES,
  CACHE_PREFIX,
  CACHE_TIME,
  POSITION_LABELS,
  toNumber,
  nullableNumber,
  normalizePercentage,
  normalize,
  getCache,
  getAnyCache,
  setCache,
  getPositionCategory,
  getPositionLabel,
  calculateFantasyPoints,
  sumField,
  firstNonNull,
  weightedAverage
} from "./apiSportsCore";

import {
  aggregatePlayerStats,
  calculateSavePercentage,
  buildAdvancedStats,
  radarDefinitions,
  getRadarRawValue,
  percentileRank,
  buildRadarStats,
  buildRadarPercentiles,
  buildFormMetrics,
  createPlayer
} from "./apiSportsStats";


// Public competition IDs used by the application.
export const COMPETITION_IDS = {
  PREMIER_LEAGUE: "PL",
  LA_LIGA: "PD",
  SERIE_A: "SA",
  BUNDESLIGA: "BL1",
  LIGUE_1: "FL1",
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

  if (!isValidCompetition(competition)) {
    throw new Error(
      "Izvēlētā līga nav atbalstīta."
    );
  }

  if (!isValidSeason(season)) {
    throw new Error(
      "Nederīga sezona."
    );
  }

  const data = await requestJson(
    buildApiUrl("api-football.php", {
      competition,
      season,
    })
  );

  if (!Array.isArray(data?.players)) {
    throw new Error(
      "API-Football neatgrieza spēlētāju statistiku."
    );
  }

  return {
    ...data,
    leagueId,
  };
};

/*
|--------------------------------------------------------------------------
| Official FPL request
|--------------------------------------------------------------------------
*/

const fetchOfficialFplPoints =
  async season => {
    if (
      Number(season) !== 2026
    ) {
      return null;
    }

    const cacheKey =
      `official_fpl_${season}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        Array.isArray(
          cached.players
        )
      ) {
        return cached;
      }
    }

    try {
      if (!isValidSeason(season)) {
        return null;
      }

      const data = await requestJson(
        buildApiUrl("fpl.php", {
          season,
        })
      );

      if (
        data?.available === false ||
        !Array.isArray(data?.players)
      ) {
        return null;
      }

      setCache(
        cacheKey,
        data
      );

      return data;
    } catch {
      return null;
    }
  };

/*
|--------------------------------------------------------------------------
| Apply official FPL points
|--------------------------------------------------------------------------
*/

const applyOfficialFplPoints =
  async (
    players,
    competition,
    season
  ) => {
    if (
      competition !== "PL" ||
      Number(season) !== 2026
    ) {
      return players;
    }

    const fplData =
      await fetchOfficialFplPoints(
        season
      );

    if (
      !fplData ||
      !Array.isArray(
        fplData.players
      )
    ) {
      return players;
    }

    const fplPlayers =
      fplData.players;

    const fullNameMap =
      new Map();

    const webNameMap =
      new Map();

    for (
      const fplPlayer of fplPlayers
    ) {
      const fullName =
        normalize(
          fplPlayer.name
        );

      const webName =
        normalize(
          fplPlayer.webName
        );

      if (
        fullName
      ) {
        if (
          !fullNameMap.has(
            fullName
          )
        ) {
          fullNameMap.set(
            fullName,
            []
          );
        }

        fullNameMap
          .get(fullName)
          .push(
            fplPlayer
          );
      }

      if (
        webName
      ) {
        if (
          !webNameMap.has(
            webName
          )
        ) {
          webNameMap.set(
            webName,
            []
          );
        }

        webNameMap
          .get(webName)
          .push(
            fplPlayer
          );
      }
    }

    return players.map(
      player => {
        const playerName =
          normalize(
            player.name
          );

        const exactMatches =
          fullNameMap.get(
            playerName
          ) || [];

        let match = null;

        if (
          exactMatches.length === 1
        ) {
          match =
            exactMatches[0];
        } else if (
          exactMatches.length > 1
        ) {
          const normalizedTeam =
            normalize(
              player.team
            );

          match =
            exactMatches.find(
              candidate =>
                normalize(
                  candidate.team
                ) ===
                normalizedTeam
            ) ||
            exactMatches[0];
        }

        if (!match) {
          const webMatches =
            webNameMap.get(
              playerName
            ) || [];

          if (
            webMatches.length === 1
          ) {
            match =
              webMatches[0];
          } else if (
            webMatches.length > 1
          ) {
            const normalizedTeam =
              normalize(
                player.team
              );

            match =
              webMatches.find(
                candidate =>
                  normalize(
                    candidate.team
                  ) ===
                  normalizedTeam
              ) ||
              webMatches[0];
          }
        }

        if (!match) {
          return player;
        }

        const officialPoints =
          Number(
            match.totalPoints
          );

        if (
          !Number.isFinite(
            officialPoints
          )
        ) {
          return player;
        }

        return {
          ...player,

          points:
            officialPoints,

          advancedStats: {
            ...(player.advancedStats ||
              {}),

            officialFpl: {
              totalPoints:
                officialPoints,

              pointsPerGame:
                Number(
                  match.pointsPerGame
                ) || 0,

              source:
                "official-fpl",
            },
          },
        };
      }
    );
  };

/*
|--------------------------------------------------------------------------
| Season conversion
|--------------------------------------------------------------------------
*/

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

/*
|--------------------------------------------------------------------------
| Fetch players
|--------------------------------------------------------------------------
*/

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
      `${competition}_${apiSeason}`;

    if (
      !options.forceRefresh
    ) {
      const cached =
        getCache(
          cacheKey
        );

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

    let players =
      (data.players || [])
        .map(item =>
          createPlayer(
            item,
            apiSeason,
            competition
          )
        )
        .filter(Boolean);

    if (
      !players.length
    ) {
      throw new Error(
        "Šai līgai un sezonai nav pieejamu spēlētāju datu."
      );
    }

    players =
      await applyOfficialFplPoints(
        players,
        competition,
        apiSeason
      );

    const enriched =
      players.map(
        player => ({
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
        })
      );

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

/*
|--------------------------------------------------------------------------
| Player profile
|--------------------------------------------------------------------------
*/

export const fetchPlayerProfile =
  async (
    playerId,
    season = 2026
  ) => {
    const id =
      Number(playerId);

    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {
      throw new Error(
        "Nederīgs spēlētāja ID."
      );
    }

    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `profile_${id}_${apiSeason}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        !Array.isArray(cached)
      ) {
        return cached;
      }
    }

    if (!isValidSeason(apiSeason)) {
      throw new Error(
        "Nederīga sezona."
      );
    }

    const data = await requestJson(
      buildApiUrl("player-details.php", {
        player: id,
        season: apiSeason,
      })
    );

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

/*
|--------------------------------------------------------------------------
| Football-data.org
|--------------------------------------------------------------------------
*/

const fetchFootballData =
  async (
    competition,
    season
  ) => {
    if (!isValidCompetition(competition)) {
      throw new Error(
        "Izvēlētā līga nav atbalstīta."
      );
    }

    if (!isValidSeason(season)) {
      throw new Error(
        "Nederīga sezona."
      );
    }

    return requestJson(
      buildApiUrl("football.php", {
        competition,
        season,
      })
    );
  };

export const fetchCompetitionStandings =
  async (
    competition = "PL",
    season = 2026
  ) => {
    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `standings_${competition}_${apiSeason}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

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

/*
|--------------------------------------------------------------------------
| FDR
|--------------------------------------------------------------------------
*/

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
      seasonToApiSeason(
        season
      );

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
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        Number.isFinite(
          Number(
            cached.fdr
          )
        )
      ) {
        return Number(
          cached.fdr
        );
      }
    }

    if (!isValidCompetition(normalizedCompetition)) {
      throw new Error(
        "Izvēlētā līga nav atbalstīta."
      );
    }

    if (!isValidSeason(apiSeason)) {
      throw new Error(
        "Nederīga sezona."
      );
    }

    const data = await requestJson(
      buildApiUrl("api-football.php", {
        mode: "fdr",
        competition: normalizedCompetition,
        season: apiSeason,
        team: numericTeamId,
      })
    );

    const fdr =
      Number(
        data?.fdr
      );

    const safeFdr =
      Number.isFinite(fdr)
        ? Math.max(
            1,
            Math.min(
              5,
              fdr
            )
          )
        : 3;

    setCache(
      cacheKey,
      {
        fdr: safeFdr,
        fixtures:
          data?.fixtures ||
          [],
      }
    );

    return safeFdr;
  };

/*
|--------------------------------------------------------------------------
| Cache clear
|--------------------------------------------------------------------------
*/

export const clearFootballDataCache =
  () => {
    try {
      Object.keys(
        localStorage
      )
        .filter(
          key =>
            key.startsWith(
              CACHE_PREFIX
            )
        )
        .forEach(
          key =>
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
    POSITION_LABELS[
      category
    ] || category;

/*
|--------------------------------------------------------------------------
| Teams
|--------------------------------------------------------------------------
*/

export const fetchTeams =
  async (
    competition = "PL",
    season = 2026
  ) => {
    const normalizedCompetition =
      COMPETITION_IDS[
        competition
      ] || competition;

    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `teams_${normalizedCompetition}_${apiSeason}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        Array.isArray(cached)
      ) {
        return cached;
      }
    }

    if (!isValidCompetition(normalizedCompetition)) {
      throw new Error(
        "Izvēlētā līga nav atbalstīta."
      );
    }

    if (!isValidSeason(apiSeason)) {
      throw new Error(
        "Nederīga sezona."
      );
    }

    const data = await requestJson(
      buildApiUrl("api-football.php", {
        mode: "teams",
        competition: normalizedCompetition,
        season: apiSeason,
      })
    );

    const teams =
      Array.isArray(
        data?.teams
      )
        ? data.teams
        : [];

    setCache(
      cacheKey,
      teams
    );

    return teams;
  };

/*
|--------------------------------------------------------------------------
| Team statistics
|--------------------------------------------------------------------------
*/

export const fetchTeamStatistics =
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
      throw new Error(
        "Nederīgs komandas ID."
      );
    }

    const normalizedCompetition =
      COMPETITION_IDS[
        competition
      ] || competition;

    const apiSeason =
      seasonToApiSeason(
        season
      );

    const cacheKey =
      `team_stats_${normalizedCompetition}_${apiSeason}_${numericTeamId}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        typeof cached ===
          "object"
      ) {
        return cached;
      }
    }

    if (!isValidCompetition(normalizedCompetition)) {
      throw new Error(
        "Izvēlētā līga nav atbalstīta."
      );
    }

    if (!isValidSeason(apiSeason)) {
      throw new Error(
        "Nederīga sezona."
      );
    }

    const data = await requestJson(
      buildApiUrl("api-football.php", {
        mode: "team-stats",
        competition: normalizedCompetition,
        season: apiSeason,
        team: numericTeamId,
      })
    );

    const statistics =
      data?.statistics ||
      null;

    if (!statistics) {
      throw new Error(
        "API-Football neatgrieza komandas statistiku."
      );
    }

    setCache(
      cacheKey,
      statistics
    );

    return statistics;
  };

/*
|--------------------------------------------------------------------------
| Head-to-head
|--------------------------------------------------------------------------
*/

export const fetchHeadToHead =
  async (
    team1Id,
    team2Id,
    last = 5
  ) => {
    const first =
      Number(team1Id);

    const second =
      Number(team2Id);

    const limit =
      Math.max(
        1,
        Math.min(
          20,
          Number(last) || 5
        )
      );

    if (
      !Number.isInteger(first) ||
      first <= 0 ||
      !Number.isInteger(second) ||
      second <= 0 ||
      first === second
    ) {
      throw new Error(
        "H2H salīdzināšanai nepieciešamas divas dažādas komandas."
      );
    }

    const low =
      Math.min(
        first,
        second
      );

    const high =
      Math.max(
        first,
        second
      );

    const cacheKey =
      `h2h_${low}_${high}_${limit}`;

    if (
      typeof localStorage !==
      "undefined"
    ) {
      const cached =
        getAnyCache(
          cacheKey
        );

      if (
        cached &&
        Array.isArray(cached)
      ) {
        return cached;
      }
    }

    const data = await requestJson(
      buildApiUrl("api-football.php", {
        mode: "h2h",
        team1: first,
        team2: second,
        last: limit,
      })
    );

    const matches =
      Array.isArray(
        data?.matches
      )
        ? data.matches
        : [];

    setCache(
      cacheKey,
      matches
    );

    return matches;
  };