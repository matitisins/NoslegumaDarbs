/*
 * Papildu līgas funkcijas Flow lietotnei.
 * Nodrošina League Tables, Top Scorers un Fixtures & Results datus
 * tieši no API-Football backend starpnieka.
 */

import { API_BASE_URL } from "../config/api";

const BASE_URL =
  API_BASE_URL;

const CACHE_PREFIX =
  "flow_league_features_v4_";

const CACHE_TIME =
  1000 * 60 * 15;

const readCache = key => {
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
      parsed.data ===
        undefined
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

const request =
  async url => {
    const response =
      await fetch(
        url,
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
          `API kļūda: ${response.status}`
      );
    }

    return data;
  };

export const fetchLeagueStandings =
  async (
    competition = "PL",
    season = 2026
  ) => {
    const normalizedCompetition =
      String(
        competition ||
          "PL"
      ).toUpperCase();

    const normalizedSeason =
      Number(season);

    const cacheKey =
      `standings_${normalizedCompetition}_${normalizedSeason}`;

    const cached =
      readCache(cacheKey);

    if (
      Array.isArray(
        cached
      ) &&
      cached.length
    ) {
      return cached;
    }

    const data =
      await request(
        `${BASE_URL}/league-data.php?mode=standings&competition=${encodeURIComponent(
          normalizedCompetition
        )}&season=${encodeURIComponent(
          normalizedSeason
        )}`
      );

    const standings =
      Array.isArray(
        data?.standings
      )
        ? data.standings
        : [];

    writeCache(
      cacheKey,
      standings
    );

    return standings;
  };

export const fetchLeagueFixtures =
  async (
    competition = "PL",
    season = 2026
  ) => {
    const normalizedCompetition =
      String(
        competition ||
          "PL"
      ).toUpperCase();

    const normalizedSeason =
      Number(season);

    const cacheKey =
      `fixtures_${normalizedCompetition}_${normalizedSeason}`;

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
        `${BASE_URL}/league-data.php?mode=fixtures&competition=${encodeURIComponent(
          normalizedCompetition
        )}&season=${encodeURIComponent(
          normalizedSeason
        )}`
      );

    const result = {
      upcoming:
        Array.isArray(
          data?.upcoming
        )
          ? data.upcoming
          : [],

      recent:
        Array.isArray(
          data?.recent
        )
          ? data.recent
          : [],
    };

    writeCache(
      cacheKey,
      result
    );

    return result;
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
        `${BASE_URL}/league-data.php?mode=fixtures&competition=${encodeURIComponent(
          normalizedCompetition
        )}&season=${encodeURIComponent(
          normalizedSeason
        )}&team=${encodeURIComponent(
          numericTeamId
        )}`
      );

    const result = {
      upcoming:
        Array.isArray(
          data?.upcoming
        )
          ? data.upcoming.slice(
              0,
              5
            )
          : [],

      recent:
        Array.isArray(
          data?.recent
        )
          ? data.recent.slice(
              0,
              5
            )
          : [],
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