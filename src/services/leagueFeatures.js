// REPLACE FILE: src/services/leagueFeatures.js

/*
 * Papildu līgas funkcijas Flow lietotnei.
 * Nodrošina League Tables, Top Scorers un Fixtures & Results datus
 * tieši no API-Football backend starpnieka.
 */

import { API_BASE_URL } from "../config/api";
import { buildStaleFallback } from "../utils/apiStatus";

const BASE_URL =
  API_BASE_URL;

// API-Football IDs for European competitions. Domestic competitions continue
// to use the existing football-data.org endpoint.
const API_FOOTBALL_COMPETITION_IDS = {
  PL: 39, PD: 140, SA: 135, BL1: 78, FL1: 61,
  UCL: 2, UEL: 3, UECL: 848, USC: 531,
};
const EUROPEAN_COMPETITIONS = new Set(["UCL", "UEL", "UECL", "USC"]);
const isEuropeanCompetition = code => EUROPEAN_COMPETITIONS.has(String(code || "").toUpperCase());
const apiFootballUrl = (action, competition, season) => {
  const league = API_FOOTBALL_COMPETITION_IDS[String(competition || "").toUpperCase()];
  if (!league) throw new Error("Šim turnīram nav konfigurēts API-Football līgas ID.");
  return `${BASE_URL}/api-football.php?action=${encodeURIComponent(action)}&league=${league}&season=${encodeURIComponent(Number(season))}`;
};

const CACHE_PREFIX =
  "flow_league_features_v7_fixture_team_name_";

const CACHE_TIME =
  1000 * 60 * 15;

const readCacheEntry = key => {
  try {
    const raw = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Number.isFinite(Number(parsed?.timestamp)) || parsed?.data === undefined) {
      return null;
    }

    const age = Math.max(0, Date.now() - Number(parsed.timestamp));
    return {
      data: parsed.data,
      timestamp: Number(parsed.timestamp),
      age,
      expired: age > CACHE_TIME,
    };
  } catch {
    return null;
  }
};

const readCache = key => {
  const entry = readCacheEntry(key);
  return entry && !entry.expired ? entry.data : null;
};

const validStandings = value => Array.isArray(value) && value.length > 0;
const validFixtures = value => Boolean(
  value && Array.isArray(value.upcoming) && Array.isArray(value.recent)
);


const unwrapProviderData = payload =>
  payload?.data && typeof payload.data === "object" ? payload.data : payload;

const normalizeStandingsResponse = payload => {
  const data = unwrapProviderData(payload);

  // API-Football format: response[0].league.standings is an array of groups.
  const apiLeague = Array.isArray(data?.response)
    ? data.response.find(item => item?.league?.standings)
    : null;
  const apiGroups = apiLeague?.league?.standings;
  if (Array.isArray(apiGroups)) {
    const rows = apiGroups.flatMap(group => Array.isArray(group) ? group : []);
    return rows.map(row => ({
      position: Number(row?.rank) || null,
      team: {
        id: row?.team?.id ?? null,
        name: row?.team?.name || "Nezināma komanda",
        crest: row?.team?.logo || "",
        logo: row?.team?.logo || "",
      },
      playedGames: Number(row?.all?.played) || 0,
      won: Number(row?.all?.win) || 0,
      draw: Number(row?.all?.draw) || 0,
      lost: Number(row?.all?.lose) || 0,
      goalsFor: Number(row?.all?.goals?.for ?? row?.goalsFor) || 0,
      goalsAgainst: Number(row?.all?.goals?.against ?? row?.goalsAgainst) || 0,
      goalDifference: Number(row?.goalsDiff ?? row?.goalDifference) || 0,
      points: Number(row?.points) || 0,
      form: row?.form || "",
      description: row?.description || "",
    })).filter(row => row.team.id != null);
  }

  const groups = Array.isArray(data?.standings) ? data.standings : [];
  if (groups.some(group => Array.isArray(group?.table))) {
    const total = groups.find(group => String(group?.type || "").toUpperCase() === "TOTAL");
    const selected = total && Array.isArray(total.table)
      ? total.table
      : groups.find(group => Array.isArray(group?.table))?.table;
    return Array.isArray(selected) ? selected : [];
  }
  if (groups.length && groups.every(row => row && typeof row === "object" && row.team)) return groups;
  return [];
};
const normalizeFixturesResponse = payload => {
  let data = unwrapProviderData(payload);
  // Support the normal Football-data.org response and the nested API-Football response shape.
  if (data?.data && typeof data.data === "object") data = data.data;
  let matches = Array.isArray(data?.matches) ? data.matches : null;
  if (!matches && Array.isArray(data?.response)) {
    matches = data.response.map(item => {
      if (item?.fixture && item?.teams) {
        return {
          id: item.fixture.id,
          utcDate: item.fixture.date,
          status: item.fixture.status?.short === "FT" ? "FINISHED" : item.fixture.status?.short,
          homeTeam: { id: item.teams.home?.id, name: item.teams.home?.name, crest: item.teams.home?.logo },
          awayTeam: { id: item.teams.away?.id, name: item.teams.away?.name, crest: item.teams.away?.logo },
          score: { fullTime: { home: item.goals?.home, away: item.goals?.away } },
        };
      }
      return item;
    });
  }
  if (!matches) matches = Array.isArray(data?.fixtures) ? data.fixtures : [];

  const finishedStatuses = new Set(["FINISHED", "AWARDED", "CANCELLED", "FT", "AET", "PEN"]);
  const liveStatuses = new Set(["IN_PLAY", "PAUSED", "LIVE", "1H", "HT", "2H", "ET", "BT", "P"]);
  const now = Date.now();
  const upcoming = [];
  const recent = [];
  for (const match of matches) {
    if (!match || typeof match !== "object") continue;
    const rawStatus = match.status?.short || match.status || match.fixture?.status?.short || "";
    const status = String(rawStatus).toUpperCase();
    const dateValue = match.utcDate || match.date || match.fixture?.date || "";
    const dateMs = Date.parse(dateValue);
    if (finishedStatuses.has(status)) recent.push(match);
    else if (liveStatuses.has(status) || (Number.isFinite(dateMs) && dateMs >= now - 3 * 60 * 60 * 1000 && !["POSTPONED", "CANCELLED", "SUSPENDED", "ABD", "WO"].includes(status))) upcoming.push(match);
  }
  recent.sort((a, b) => Date.parse(b.utcDate || b.date || b.fixture?.date || "") - Date.parse(a.utcDate || a.date || a.fixture?.date || ""));
  upcoming.sort((a, b) => Date.parse(a.utcDate || a.date || a.fixture?.date || "") - Date.parse(b.utcDate || b.date || b.fixture?.date || ""));
  return { upcoming, recent };
};

const writeCache = (
  key,
  data
) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        timestamp:
          Date.now(),
        data,
      })
    );
  } catch {
    // Kešatmiņas kļūda nedrīkst apturēt lietotni.
  }
};

const request = async url => {
  const controller = typeof AbortController !== "undefined"
    ? new AbortController()
    : null;
  let timeoutId = null;

  if (controller) timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller?.signal,
    });

    let data = null;
    try { data = await response.json(); } catch { data = null; }

    if (!response.ok || data?.success === false) {
      throw new Error(data?.error || `API kļūda: ${response.status}`);
    }
    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Līgas datu pieprasījums pārsniedza 15 sekunžu laika limitu. Pārbaudi Vite proxy un PHP backend.");
    }
    throw error;
  } finally {
    if (timeoutId !== null) clearTimeout(timeoutId);
  }
};

export const fetchLeagueStandingsWithStatus = async (competition = "PL", season = 2026) => {
  const normalizedCompetition = String(competition || "PL").toUpperCase();
  const normalizedSeason = Number(season);
  const cacheKey = `standings_${normalizedCompetition}_${normalizedSeason}`;
  const entry = readCacheEntry(cacheKey);

  if (entry && !entry.expired && validStandings(entry.data)) {
    return { data: entry.data, source: "browser-cache", stale: false, warning: null };
  }

  try {
    const url = isEuropeanCompetition(normalizedCompetition)
      ? apiFootballUrl("standings", normalizedCompetition, normalizedSeason)
      : `${BASE_URL}/league-data.php?type=standings&competition=${encodeURIComponent(normalizedCompetition)}&season=${encodeURIComponent(normalizedSeason)}`;
    const data = await request(url);
    const standings = normalizeStandingsResponse(data);
    if (!validStandings(standings)) {
      throw new Error(data?.error || "Servera atbilde nesatur derīgus līgas tabulas datus.");
    }
    writeCache(cacheKey, standings);
    return { data: standings, source: "server", stale: Boolean(data?.stale), warning: data?.warning || null };
  } catch (error) {
    if (entry && validStandings(entry.data)) {
      return buildStaleFallback(entry.data, error);
    }
    throw error;
  }
};

export const fetchLeagueStandings = async (competition = "PL", season = 2026) => {
  const result = await fetchLeagueStandingsWithStatus(competition, season);
  return result.data;
};

export const fetchLeagueFixturesWithStatus = async (competition = "PL", season = 2026) => {
  const normalizedCompetition = String(competition || "PL").toUpperCase();
  const normalizedSeason = Number(season);
  const cacheKey = `fixtures_${normalizedCompetition}_${normalizedSeason}`;
  const entry = readCacheEntry(cacheKey);

  if (entry && !entry.expired && validFixtures(entry.data)) {
    return { data: entry.data, source: "browser-cache", stale: false, warning: null };
  }

  try {
    let data;
    if (isEuropeanCompetition(normalizedCompetition)) {
      const baseUrl = apiFootballUrl("fixtures", normalizedCompetition, normalizedSeason);
      const [upcomingPayload, recentPayload] = await Promise.all([
        request(`${baseUrl}&next=20`),
        request(`${baseUrl}&last=20`),
      ]);
      data = {
        response: [
          ...(Array.isArray(upcomingPayload?.response) ? upcomingPayload.response : []),
          ...(Array.isArray(recentPayload?.response) ? recentPayload.response : []),
        ],
      };
    } else {
      data = await request(
        `${BASE_URL}/league-data.php?type=fixtures&competition=${encodeURIComponent(normalizedCompetition)}&season=${encodeURIComponent(normalizedSeason)}`
      );
    }
    const result = normalizeFixturesResponse(data);
    if (!validFixtures(result)) {
      throw new Error("Servera atbilde nesatur derīgus spēļu datus.");
    }
    writeCache(cacheKey, result);
    return { data: result, source: "server", stale: false, warning: null };
  } catch (error) {
    if (entry && validFixtures(entry.data)) {
      return buildStaleFallback(entry.data, error);
    }
    throw error;
  }
};

export const fetchLeagueFixtures = async (competition = "PL", season = 2026) => {
  const result = await fetchLeagueFixturesWithStatus(competition, season);
  return result.data;
};

const normalizeFixtureTeamName = value => String(value || "")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/\b(fc|afc|cf|sc|club|football club)\b/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .trim();

const fixtureHasTeam = (match, teamId, teamName) => {
  const home = match?.homeTeam || match?.teams?.home || match?.home || {};
  const away = match?.awayTeam || match?.teams?.away || match?.away || {};
  const id = Number(teamId);
  const homeId = Number(home?.id ?? home?.teamId ?? home?.team_id);
  const awayId = Number(away?.id ?? away?.teamId ?? away?.team_id);
  if (Number.isInteger(id) && id > 0 && (homeId === id || awayId === id)) return true;

  const target = normalizeFixtureTeamName(teamName);
  if (!target) return false;
  const homeName = normalizeFixtureTeamName(home?.name ?? home?.teamName);
  const awayName = normalizeFixtureTeamName(away?.name ?? away?.teamName);
  const matches = name => name === target || (name.length >= 5 && target.length >= 5 && (name.includes(target) || target.includes(name)));
  return matches(homeName) || matches(awayName);
};

export const fetchTeamFixtures =
  async (
    teamId,
    competition = "PL",
    season = 2026,
    teamName = ""
  ) => {
    const numericTeamId =
      Number(teamId);

    const normalizedCompetition =
      String(
        competition ||
          "PL"
      ).toUpperCase();

    const normalizedSeason =
      Number(season);

    const hasTeamId = Number.isInteger(numericTeamId) && numericTeamId > 0;
    const normalizedTeamName = normalizeFixtureTeamName(teamName);
    if (!hasTeamId && !normalizedTeamName) {
      return { upcoming: [], recent: [], error: "Player team ID and team name are missing." };
    }

    const cacheKey =
      `team_fixtures_${normalizedCompetition}_${normalizedSeason}_${hasTeamId ? numericTeamId : "name"}_${normalizedTeamName}`;

    const cached =
      readCache(cacheKey);

    if (
      cached &&
      Array.isArray(
        cached.upcoming
      ) &&
      Array.isArray(
        cached.recent
      )
    ) {
      return cached;
    }

    const data = await request(
      `${BASE_URL}/league-data.php?type=fixtures&competition=${encodeURIComponent(normalizedCompetition)}&season=${encodeURIComponent(normalizedSeason)}${hasTeamId ? `&team=${encodeURIComponent(numericTeamId)}` : ""}`
    );

    const allFixtures = normalizeFixturesResponse(data);
    const belongsToTeam = match => fixtureHasTeam(match, numericTeamId, teamName);
    const result = {
      upcoming: allFixtures.upcoming.filter(belongsToTeam).slice(0, 5),
      recent: allFixtures.recent.filter(belongsToTeam).slice(0, 5),
    };

    writeCache(
      cacheKey,
      result
    );

    return result;
  };

export const fetchPlayerFixtureContext =
  async (
    player,
    competition,
    season
  ) => {
    const teamId = Number(player?.teamId ?? player?.team?.id ?? player?.team_id);
    const teamName = String(player?.teamName ?? (typeof player?.team === "string" ? player.team : player?.team?.name) ?? player?.clubName ?? "").trim();

    const normalizedCompetition =
      String(
        competition ||
          player?.league ||
          "PL"
      ).toUpperCase();

    const normalizedSeason =
      Number(
        season ||
          player?.season ||
          2026
      );

    const hasTeamId = Number.isInteger(teamId) && teamId > 0;
    if (!hasTeamId && !normalizeFixtureTeamName(teamName)) {
      return { upcoming: [], recent: [], error: "Player team ID and name are missing." };
    }

    const cacheKey =
      `player_context_${normalizedCompetition}_${normalizedSeason}_${hasTeamId ? teamId : "name"}_${normalizeFixtureTeamName(teamName)}`;

    const cached =
      readCache(cacheKey);

    if (
      cached &&
      Array.isArray(
        cached.upcoming
      ) &&
      Array.isArray(
        cached.recent
      )
    ) {
      return cached;
    }

    const result =
      await fetchTeamFixtures(
        hasTeamId ? teamId : null,
        normalizedCompetition,
        normalizedSeason,
        teamName
      );

    const normalized = {
      upcoming:
        Array.isArray(
          result?.upcoming
        )
          ? result.upcoming.slice(
              0,
              5
            )
          : [],

      recent:
        Array.isArray(
          result?.recent
        )
          ? result.recent.slice(
              0,
              5
            )
          : [],

      error:
        result?.error ||
        null,
    };

    writeCache(
      cacheKey,
      normalized
    );

    return normalized;
  };

export const clearLeagueFeatureCache =
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
      // Ignore browser storage errors.
    }
  };

const API_FOOTBALL_LEAGUE_IDS = { PL: 39, PD: 140, SA: 135, BL1: 78, FL1: 61, UCL: 2, UEL: 3, UECL: 848, USC: 531 };
const validLeaders = value => Array.isArray(value);

/** Fetch league-specific top scorers or assists from the cached PHP API-Football proxy. */
export const fetchLeaguePlayerLeadersWithStatus = async (competition = "PL", season = 2026, kind = "scorers") => {
  const code = String(competition || "PL").toUpperCase();
  const league = API_FOOTBALL_LEAGUE_IDS[code];
  const normalizedSeason = Number(season);
  const type = kind === "assists" ? "top-assists" : "top-scorers";
  if (!league || !Number.isInteger(normalizedSeason)) {
    return { data: [], source: "invalid-params", warning: "Līgas spēlētāju datiem nav derīgu parametru." };
  }

  const cacheKey = `leaders_${type}_${code}_${normalizedSeason}`;
  const entry = readCacheEntry(cacheKey);
  if (entry && !entry.expired && validLeaders(entry.data)) {
    return { data: entry.data, source: "browser-cache", stale: false, warning: null };
  }

  try {
    const payload = await request(`${BASE_URL}/api-football.php?action=${type}&league=${league}&season=${normalizedSeason}`);
    const raw = Array.isArray(payload?.response) ? payload.response : [];
    const leaders = raw.map(item => {
      const player = item?.player || {};
      const stats = Array.isArray(item?.statistics) ? item.statistics[0] || {} : {};
      const goals = stats?.goals || {};
      const passes = stats?.passes || {};
      const team = stats?.team || {};
      return {
        id: player.id,
        playerId: player.id,
        name: player.name || "Nezināms spēlētājs",
        photo: player.photo || "",
        team: team.name || "",
        teamLogo: team.logo || "",
        goals: Number(goals.total) || 0,
        assists: Number(goals.assists) || 0,
        appearances: Number(stats?.games?.appearences ?? stats?.games?.appearances) || 0,
        rating: Number(stats?.games?.rating) || null,
        value: type === "top-assists" ? Number(goals.assists) || 0 : Number(goals.total) || 0,
      };
    }).filter(player => player.id != null && player.name);
    writeCache(cacheKey, leaders);
    return { data: leaders, source: payload?.cached ? "server-cache" : "server", stale: Boolean(payload?.stale), warning: null };
  } catch (error) {
    if (entry && validLeaders(entry.data)) return buildStaleFallback(entry.data, error);
    return { data: [], source: "unavailable", stale: false, warning: error?.message || "Neizdevās ielādēt līgas spēlētāju statistiku." };
  }
};
