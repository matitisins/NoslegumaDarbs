/*
 * Papildu līgas funkcijas Flow lietotnei.
 * Nodrošina League Tables, Top Scorers un Fixtures & Results datus
 * tieši no API-Football backend starpnieka.
 */

const BASE_URL =
  "http://localhost/Nosleguma_Darbs/Nosleguma_Darbs/backend/api";

const CACHE_PREFIX = "flow_league_features_v1_";
const CACHE_TIME = 1000 * 60 * 15;

const readCache = key => {
  try {
    const raw = localStorage.getItem(
      `${CACHE_PREFIX}${key}`
    );

    if (!raw) return null;

    const parsed = JSON.parse(raw);

    if (
      !parsed?.timestamp ||
      parsed.data === undefined
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

const writeCache = (key, data) => {
  try {
    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Kešatmiņas kļūda nedrīkst apturēt lietotni.
  }
};

const request = async url => {
  const response = await fetch(
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
      Number(
        season
      );

    const cacheKey =
      `standings_${normalizedCompetition}_${normalizedSeason}`;

    const cached =
      readCache(
        cacheKey
      );

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
      Number(
        season
      );

    const cacheKey =
      `fixtures_${normalizedCompetition}_${normalizedSeason}`;

    const cached =
      readCache(
        cacheKey
      );

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
      // Ignore storage errors.
    }
  };