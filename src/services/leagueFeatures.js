/*
 * Papildu līgas funkcijas Flow lietotnei.
 * Nodrošina League Tables, Top Scorers un Fixtures & Results datus
 * tieši no API-Football backend starpnieka.
 */

import { API_BASE_URL } from "../config/api";
import { buildStaleFallback } from "../utils/apiStatus";

const BASE_URL =
  API_BASE_URL;

const CACHE_PREFIX =
  "flow_league_features_v5_contract_fix_";

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
  const data = unwrapProviderData(payload);
  const matches = Array.isArray(data?.matches) ? data.matches : [];
  const finishedStatuses = new Set(["FINISHED", "AWARDED", "CANCELLED"]);
  const upcoming = [];
  const recent = [];
  for (const match of matches) {
    if (!match || typeof match !== "object") continue;
    const status = String(match.status || "").toUpperCase();
    if (finishedStatuses.has(status)) recent.push(match);
    else upcoming.push(match);
  }
  recent.sort((a, b) => Date.parse(b.utcDate || "") - Date.parse(a.utcDate || ""));
  upcoming.sort((a, b) => Date.parse(a.utcDate || "") - Date.parse(b.utcDate || ""));
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
    const data = await request(
      `${BASE_URL}/league-data.php?type=standings&competition=${encodeURIComponent(normalizedCompetition)}&season=${encodeURIComponent(normalizedSeason)}`
    );
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
    const data = await request(
      `${BASE_URL}/league-data.php?type=fixtures&competition=${encodeURIComponent(normalizedCompetition)}&season=${encodeURIComponent(normalizedSeason)}`
    );
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

export const fetchTeamFixtures =
  async (
    teamId,
    competition = "PL",
    season = 2026
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

    if (
      !Number.isInteger(
        numericTeamId
      ) ||
      numericTeamId <= 0
    ) {
      return {
        upcoming: [],
        recent: [],
        error:
          "Invalid team ID.",
      };
    }

    const cacheKey =
      `team_fixtures_${normalizedCompetition}_${normalizedSeason}_${numericTeamId}`;

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

    const data =
      await request(
        `${BASE_URL}/league-data.php?type=fixtures&competition=${encodeURIComponent(
          normalizedCompetition
        )}&season=${encodeURIComponent(
          normalizedSeason
        )}&team=${encodeURIComponent(
          numericTeamId
        )}`
      );

    const allFixtures = normalizeFixturesResponse(data);
    const belongsToTeam = match =>
      Number(match?.homeTeam?.id ?? match?.teams?.home?.id) === numericTeamId ||
      Number(match?.awayTeam?.id ?? match?.teams?.away?.id) === numericTeamId;
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
    const teamId =
      Number(
        player?.teamId ??
          player?.team?.id ??
          player?.teamId
      );

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

    if (
      !Number.isInteger(
        teamId
      ) ||
      teamId <= 0
    ) {
      return {
        upcoming: [],
        recent: [],
        error:
          "Player team ID is missing.",
      };
    }

    const cacheKey =
      `player_context_${normalizedCompetition}_${normalizedSeason}_${teamId}`;

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
        teamId,
        normalizedCompetition,
        normalizedSeason
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