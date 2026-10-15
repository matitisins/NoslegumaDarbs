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
  UCL: "UCL",
  UEFA_CHAMPIONS_LEAGUE: "UCL",
  UEL: "UEL",
  UEFA_EUROPA_LEAGUE: "UEL",
  UECL: "UECL",
  UEFA_CONFERENCE_LEAGUE: "UECL",
  USC: "USC",
  UEFA_SUPER_CUP: "USC",
};

// API-Football requires numeric league IDs; football-data.org uses codes.
const toApiFootballLeagueId = competition => {
  const code = COMPETITION_IDS[competition] || competition;
  const id = Number(API_FOOTBALL_LEAGUES[code]);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error("Izvēlētā līga nav atbalstīta API-Football.");
  }
  return id;
};

const PLAYER_PAGE_CACHE_TTL_MS = 30 * 60 * 1000;
const PLAYER_PAGE_CACHE_PREFIX = "flow_player_page_v1_";
const PLAYER_PAGE_CONCURRENCY = 4;
const RATE_LIMIT_RETRY_DELAY_MS = 62000;

const readPlayerPageCache = (competition, season, page) => {
  if (typeof localStorage === "undefined") return null;
  try {
    const key = `${PLAYER_PAGE_CACHE_PREFIX}${competition}_${season}_${page}`;
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw);
    if (!entry || !Array.isArray(entry.response)) return null;
    if (Date.now() - Number(entry.savedAt || 0) > PLAYER_PAGE_CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry;
  } catch {
    return null;
  }
};

const writePlayerPageCache = (competition, season, page, payload) => {
  if (typeof localStorage === "undefined" || !Array.isArray(payload?.response)) return;
  try {
    const key = `${PLAYER_PAGE_CACHE_PREFIX}${competition}_${season}_${page}`;
    localStorage.setItem(key, JSON.stringify({
      savedAt: Date.now(),
      response: payload.response,
      paging: payload.paging || null,
    }));
  } catch {
    // Storage can be full or disabled; the live API response still works.
  }
};

const waitForRateLimitWindow = async (isCancelled) => {
  const endAt = Date.now() + RATE_LIMIT_RETRY_DELAY_MS;
  while (Date.now() < endAt) {
    if (isCancelled?.()) return false;
    await new Promise(resolve => setTimeout(resolve, Math.min(500, endAt - Date.now())));
  }
  return !isCancelled?.();
};

const isRateLimitError = error =>
  /429|rate.?limit|too many requests|quota/i.test(String(error?.message || error || ""));

const requestApiFootball = async (competition, season, options = {}) => {
  const leagueId = Number(API_FOOTBALL_LEAGUES[competition]);
  if (!Number.isInteger(leagueId) || leagueId <= 0) {
    throw new Error("Izvēlētajai līgai nav API-Football ID.");
  }
  if (!isValidCompetition(competition)) throw new Error("Izvēlētā līga nav atbalstīta.");
  if (!isValidSeason(season)) throw new Error("Nederīga sezona.");

  const fetchPage = async page => {
    if (!options.forceRefresh) {
      const cached = readPlayerPageCache(competition, season, page);
      if (cached) return { response: cached.response, paging: cached.paging, _pageCached: true };
    }

    const url = buildApiUrl("api-football.php", {
      action: "players", league: leagueId, season, page,
    });

    try {
      const result = await requestJson(url);
      if (!Array.isArray(result?.response)) {
        throw new Error(result?.error || `Neizdevās ielādēt spēlētāju lapu ${page}.`);
      }
      writePlayerPageCache(competition, season, page, result);
      return result;
    } catch (error) {
      // Retry a rate-limited page once after the provider's rolling minute window.
      // Cached pages do not wait, so a previously loaded presentation dataset opens fast.
      if (!isRateLimitError(error) || options.isCancelled?.()) throw error;
      const canRetry = await waitForRateLimitWindow(options.isCancelled);
      if (!canRetry) throw error;
      const result = await requestJson(url);
      if (!Array.isArray(result?.response)) {
        throw new Error(result?.error || `Neizdevās ielādēt spēlētāju lapu ${page}.`);
      }
      writePlayerPageCache(competition, season, page, result);
      return result;
    }
  };

  const firstPage = await fetchPage(1);
  if (!Array.isArray(firstPage?.response)) {
    throw new Error(firstPage?.error || "API-Football neatgrieza derīgu spēlētāju statistiku.");
  }

  const pagesValue = Number(firstPage?.paging?.total || 1);
  const totalPages = Number.isFinite(pagesValue) ? Math.max(1, Math.floor(pagesValue)) : 1;
  const pageResults = new Array(totalPages + 1);
  pageResults[1] = firstPage.response;
  let loadedPages = 1;
  let failedPages = [];

  const publishProgress = () => {
    if (options.isCancelled?.()) return;
    const rawPlayers = pageResults.slice(1).flatMap(page => Array.isArray(page) ? page : []);
    const progress = {
      current: loadedPages,
      total: totalPages,
      playersLoaded: rawPlayers.length,
      cached: loadedPages === totalPages && pageResults.slice(1).every(Array.isArray),
    };
    options.onPageData?.(rawPlayers, progress);
    options.onProgress?.(progress);
  };

  publishProgress();

  // Fetch multiple pages in parallel. The PHP endpoint caches each page, so
  // cached pages can be assembled quickly; a small concurrency limit avoids
  // flooding API-Football when the server cache is cold.
  let nextPage = 2;
  const worker = async () => {
    while (!options.isCancelled?.()) {
      const page = nextPage;
      nextPage += 1;
      if (page > totalPages) return;
      try {
        const data = await fetchPage(page);
        pageResults[page] = data.response;
        loadedPages += 1;
        publishProgress();
      } catch (error) {
        failedPages.push({ page, error });
        options.onPageError?.(error, {
          current: loadedPages,
          total: totalPages,
          playersLoaded: pageResults.slice(1).flatMap(value => Array.isArray(value) ? value : []).length,
          failedPage: page,
        });
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(PLAYER_PAGE_CONCURRENCY, Math.max(0, totalPages - 1)) }, () => worker())
  );

  const cancelled = Boolean(options.isCancelled?.());
  const allPagesLoaded = pageResults.slice(1).every(Array.isArray);
  const allPlayers = cancelled ? [] : pageResults.slice(1).flatMap(page => Array.isArray(page) ? page : []);
  const finalPage = {
    ...firstPage,
    players: allPlayers,
    response: allPlayers,
    leagueId,
    paging: {
      ...(firstPage.paging || {}),
      total: totalPages,
      loadedPages: cancelled ? 0 : loadedPages,
      partial: cancelled || !allPagesLoaded || failedPages.length > 0,
      failedPages: failedPages.map(item => item.page),
    },
  };

  if (!cancelled && failedPages.length) {
    // Preserve the successful pages and report the exact pages that did not load.
    const firstFailure = failedPages[0];
    options.onPageError?.(firstFailure.error, {
      current: loadedPages,
      total: totalPages,
      playersLoaded: allPlayers.length,
      failedPages: failedPages.map(item => item.page),
    });
  }

  return finalPage;
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

      const payload = await requestJson(
        buildApiUrl("fpl.php", { endpoint: "bootstrap-static" })
      );
      const rawData = payload?.data && typeof payload.data === "object"
        ? payload.data
        : payload;
      const elements = Array.isArray(rawData?.elements) ? rawData.elements : null;
      if (payload?.available === false || !elements) return null;

      const teamsById = new Map(
        (Array.isArray(rawData.teams) ? rawData.teams : [])
          .map(team => [Number(team.id), team.name || team.short_name || ""])
      );
      const players = elements.map(player => ({
        id: Number(player.id),
        name: `${player.first_name || ""} ${player.second_name || ""}`.trim(),
        webName: player.web_name || "",
        teamId: Number(player.team) || null,
        team: teamsById.get(Number(player.team)) || "",
        positionId: Number(player.element_type) || null,
        totalPoints: Number(player.total_points) || 0,
        pointsPerGame: Number(player.points_per_game) || 0,
        projectedPoints: Number(player.ep_next) || 0,
        minutes: Number(player.minutes) || 0,
        goals: Number(player.goals_scored) || 0,
        assists: Number(player.assists) || 0,
        cleanSheets: Number(player.clean_sheets) || 0,
        goalsConceded: Number(player.goals_conceded) || 0,
        bonus: Number(player.bonus) || 0,
        price: Number(player.now_cost) / 10 || 0,
        source: "official-fpl",
      }));
      const data = { ...payload, players, teams: rawData.teams || [], events: rawData.events || [], source: "official-fpl" };
      setCache(cacheKey, data);
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

        const officialPosition = {
          1: "GOALKEEPERS",
          2: "DEFENDERS",
          3: "MIDFIELDERS",
          4: "STRIKERS",
        }[Number(match.positionId)];

        return {
          ...player,
          // Official FPL prices are in millions (e.g. now_cost 65 => £6.5m).
          // Keep them separate from Flow Value so the Fantasy Builder can use
          // genuine FPL prices without changing the rest of the analytics UI.
          officialFplPrice: Number(match.price) > 0 ? Number(match.price) : null,
          officialFplPosition: officialPosition || null,
          officialFplProjectedPoints: Number(match.projectedPoints) > 0 ? Number(match.projectedPoints) : null,
          ...(officialPosition ? { category: officialPosition } : {}),
          points: officialPoints,
          advancedStats: {
            ...(player.advancedStats || {}),
            officialFpl: {
              totalPoints: officialPoints,
              pointsPerGame: Number(match.pointsPerGame) || 0,
              projectedPoints: Number(match.projectedPoints) || null,
              price: Number(match.price) || null,
              position: officialPosition || null,
              source: "official-fpl",
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
    const competition = COMPETITION_IDS[leagueId] || leagueId;
    const apiSeason = seasonToApiSeason(season);
    // Versioned cache ensures previously cached zero/mismatched Flow points are rebuilt.
    // Versioned, competition-scoped cache prevents domestic and European lists from mixing.
    const cacheKey = `flow_points_fpl_style_v3_competition_scoped_${competition}_${apiSeason}`;

    if (!options.forceRefresh) {
      const cached = getCache(cacheKey);
      if (Array.isArray(cached) && cached.length) {
        options.onProgress?.({
          current: 1,
          total: 1,
          playersLoaded: cached.length,
          cached: true,
        });
        options.onPlayers?.(cached, {
          current: 1,
          total: 1,
          playersLoaded: cached.length,
          cached: true,
          complete: true,
        });
        return cached;
      }
    }

    options.onProgress?.({ current: 0, total: 1, playersLoaded: 0, cached: false });

    const toDisplayPlayers = rawPlayers => rawPlayers
      .map(item => createPlayer(item, apiSeason, competition))
      .filter(Boolean);

    let partialPlayers = [];
    let pageError = null;

    const data = await requestApiFootball(competition, apiSeason, {
      ...options,
      onPageData: (rawPlayers, progress) => {
        if (options.isCancelled?.()) return;
        partialPlayers = toDisplayPlayers(rawPlayers);
        // The first page is enough to render the screen. Subsequent callbacks
        // replace it with a larger list as each page completes.
        options.onPlayers?.(partialPlayers, {
          ...progress,
          complete: progress.current >= progress.total,
        });
      },
      onPageError: (error, progress) => {
        pageError = error;
        options.onPageError?.(error, progress);
      },
      onProgress: options.onProgress,
    });

    if (options.isCancelled?.()) return [];

    let players = toDisplayPlayers(data.players || []);
    if (!players.length) {
      throw new Error(
        "Šai līgai un sezonai nav pieejamu spēlētāju datu."
      );
    }

    // Flow points must be calculated by our shared FPL-style rules for every
    // league. Do not overwrite them with Premier League-only official FPL data.
    players = players.map(player => ({
      ...player,
      flowPoints: Number.isFinite(Number(player.flowPoints))
        ? Number(player.flowPoints)
        : Number(player.points) || 0,
      points: Number.isFinite(Number(player.flowPoints))
        ? Number(player.flowPoints)
        : Number(player.points) || 0,
    }));
    // Tag every player with the exact competition and season requested.
    const scopedPlayers = players.map(player => ({
      ...player,
      competitionCode: competition,
      competitionSeason: String(apiSeason),
    }));
    const enriched = scopedPlayers.map(player => ({
      ...player,
      customStats: buildRadarStats(player, scopedPlayers),
      radarPercentiles: buildRadarPercentiles(player, scopedPlayers),
      formMetrics: buildFormMetrics(player),
    }));

    const isComplete = !data.paging?.partial && !pageError;
    if (isComplete) {
      setCache(cacheKey, enriched);
    }

    options.onPlayers?.(enriched, {
      current: data.paging?.loadedPages || 1,
      total: data.paging?.total || 1,
      playersLoaded: enriched.length,
      cached: false,
      complete: isComplete,
      partial: !isComplete,
    });
    options.onProgress?.({
      current: data.paging?.loadedPages || 1,
      total: data.paging?.total || 1,
      playersLoaded: enriched.length,
      cached: false,
      complete: isComplete,
      partial: !isComplete,
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

export const fetchTeams = async (competition = "PL", season = 2026) => {
  const normalizedCompetition = COMPETITION_IDS[competition] || competition;
  const apiSeason = String(seasonToApiSeason(season));
  const league = toApiFootballLeagueId(normalizedCompetition);

  if (!isValidSeason(apiSeason)) {
    throw new Error("Nederīga sezona.");
  }

  // Versioned, competition-specific key prevents older cached lists that
  // contained teams from several leagues from leaking into this view.
  const cacheKey = `teams_v3_${normalizedCompetition}_${league}_${apiSeason}`;
  const cached = typeof localStorage !== "undefined" ? getAnyCache(cacheKey) : null;
  if (Array.isArray(cached) && cached.length > 0 && cached.length <= 50) {
    return cached;
  }

  const data = await requestJson(buildApiUrl("api-football.php", {
    action: "teams",
    league,
    season: apiSeason,
  }));

  // The endpoint must return the API-Football response for the exact league
  // and season requested. Never fall back to a mixed or differently-shaped
  // cached team list.
  const response = Array.isArray(data?.response) ? data.response : [];
  const uniqueTeams = new Map();
  response.forEach(item => {
    const team = item?.team || item;
    const venue = item?.venue || {};
    const id = Number(team?.id);
    if (!Number.isInteger(id) || id <= 0 || uniqueTeams.has(id)) return;
    uniqueTeams.set(id, {
      ...team,
      id,
      name: team?.name || `Komanda ${id}`,
      logo: team?.logo || "",
      code: team?.code || team?.tla || "",
      venue,
    });
  });

  const teams = [...uniqueTeams.values()].sort((a, b) =>
    a.name.localeCompare(b.name, "lv")
  );

  // Domestic leagues normally return 20-24 teams. European competitions can
  // include qualifying-round entrants, so allow a larger list for UEFA IDs.
  // Keep a hard upper bound to avoid rendering a malformed mixed dataset.
  const isEuropeanCompetition = ["UCL", "UEL", "UECL", "USC"].includes(normalizedCompetition);
  const maximumTeams = isEuropeanCompetition ? 100 : 50;
  if (teams.length > maximumTeams) {
    throw new Error(
      `API atgrieza ${teams.length} komandas, kas pārsniedz ${isEuropeanCompetition ? "Eiropas sacensību" : "vienas līgas"} robežu (${maximumTeams}). Pārbaudi API kešatmiņu un izvēlēto turnīru.`
    );
  }

  if (teams.length > 0) setCache(cacheKey, teams);
  return teams;
};

/*
|--------------------------------------------------------------------------
| Team statistics
|--------------------------------------------------------------------------
*/

export const fetchTeamStatistics = async (teamId, competition = "PL", season = 2026) => {
  const team = Number(teamId);
  if (!Number.isInteger(team) || team <= 0) throw new Error("Nederīgs komandas ID.");
  const league = toApiFootballLeagueId(competition);
  const apiSeason = String(seasonToApiSeason(season));
  if (!isValidSeason(apiSeason)) throw new Error("Nederīga sezona.");
  const cacheKey = `team_stats_${league}_${apiSeason}_${team}`;
  const cached = typeof localStorage !== "undefined" ? getAnyCache(cacheKey) : null;
  if (cached && typeof cached === "object") return cached;

  const data = await requestJson(buildApiUrl("api-football.php", {
    action: "team-stats", league, season: apiSeason, team,
  }));
  const statistics = data?.response;
  if (!statistics || typeof statistics !== "object" || Array.isArray(statistics)) {
    throw new Error("API-Football neatgrieza komandas statistiku.");
  }
  setCache(cacheKey, statistics);
  return statistics;
};

/*
|--------------------------------------------------------------------------
| Head-to-head
|--------------------------------------------------------------------------
*/

export const fetchHeadToHead = async (team1Id, team2Id, last = 5) => {
  const first = Number(team1Id);
  const second = Number(team2Id);
  const limit = Math.max(1, Math.min(10, Number(last) || 5));
  if (!Number.isInteger(first) || first <= 0 || !Number.isInteger(second) || second <= 0 || first === second) {
    throw new Error("H2H salīdzināšanai nepieciešamas divas dažādas komandas.");
  }
  const teams = `${Math.min(first, second)}-${Math.max(first, second)}`;
  const cacheKey = `h2h_${teams}_${limit}`;
  const cached = typeof localStorage !== "undefined" ? getAnyCache(cacheKey) : null;
  if (Array.isArray(cached)) return cached;

  const data = await requestJson(buildApiUrl("api-football.php", {
    action: "h2h", teams,
  }));
  const matches = Array.isArray(data?.response) ? data.response : [];
  const limitedMatches = matches.slice(0, limit);
  setCache(cacheKey, limitedMatches);
  return limitedMatches;
};