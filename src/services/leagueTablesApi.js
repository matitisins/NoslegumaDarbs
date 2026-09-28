/*
 * Nodrošina Flow līgas tabulu ielādi no API-Football backend starpnieka.
 * API atslēga paliek serverī, bet frontend saņem tikai normalizētus
 * turnīra tabulas datus. Tādējādi League Tables izmanto to pašu
 * API-Football avotu, kas jau tiek izmantots pārējā lietotnē.
 */

const BASE_URL =
  "http://localhost/Nosleguma_Darbs/Nosleguma_Darbs/backend/api";

const CACHE_PREFIX = "flow_league_tables_v1_";
const CACHE_TIME = 1000 * 60 * 30;

const readCache = key => {
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
      !Array.isArray(parsed.data)
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

    return parsed.data.length > 0
      ? parsed.data
      : null;
  } catch {
    return null;
  }
};

const writeCache = (key, data) => {
  try {
    if (!Array.isArray(data) || !data.length) {
      return;
    }

    localStorage.setItem(
      `${CACHE_PREFIX}${key}`,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Browser storage errors should not stop the table from loading.
  }
};

const normalizeRow = row => {
  const played = Number(
    row?.all?.played ??
      row?.playedGames ??
      row?.played
  );

  const wins = Number(
    row?.all?.win ??
      row?.won ??
      row?.wins
  );

  const draws = Number(
    row?.all?.draw ??
      row?.draw ??
      row?.draws
  );

  const losses = Number(
    row?.all?.lose ??
      row?.lost ??
      row?.losses
  );

  const goalsFor = Number(
    row?.all?.goals?.for ??
      row?.goalsFor
  );

  const goalsAgainst = Number(
    row?.all?.goals?.against ??
      row?.goalsAgainst
  );

  const goalDifference = Number(
    row?.goalsDiff ??
      row?.goalDifference
  );

  const points = Number(
    row?.points
  );

  const safeNumber = value =>
    Number.isFinite(value)
      ? value
      : null;

  return {
    position:
      safeNumber(
        Number(row?.rank ?? row?.position)
      ),

    team: {
      id:
        row?.team?.id ?? null,

      name:
        row?.team?.name ??
        "Nezināma komanda",

      shortName:
        row?.team?.name ?? null,

      tla:
        row?.team?.code ?? null,

      crest:
        row?.team?.logo ??
        row?.team?.crest ??
        null,

      logo:
        row?.team?.logo ??
        row?.team?.crest ??
        null,
    },

    playedGames:
      safeNumber(played),

    won:
      safeNumber(wins),

    draw:
      safeNumber(draws),

    lost:
      safeNumber(losses),

    goalsFor:
      safeNumber(goalsFor),

    goalsAgainst:
      safeNumber(goalsAgainst),

    goalDifference:
      safeNumber(goalDifference),

    points:
      safeNumber(points),

    form:
      row?.form ?? null,

    status:
      row?.status ?? null,

    description:
      row?.description ?? null,
  };
};

export const fetchLeagueStandings = async (
  competition = "PL",
  season = 2026
) => {
  const normalizedCompetition = String(
    competition || "PL"
  ).toUpperCase();

  const normalizedSeason = Number(
    season
  );

  if (
    !/^\d{4}$/.test(
      String(normalizedSeason)
    )
  ) {
    throw new Error(
      "Nederīga sezona līgas tabulai."
    );
  }

  const cacheKey =
    `${normalizedCompetition}_${normalizedSeason}`;

  const cached =
    readCache(cacheKey);

  if (cached) {
    return cached;
  }

  const url =
    `${BASE_URL}/api-football.php` +
    `?mode=standings` +
    `&competition=${encodeURIComponent(
      normalizedCompetition
    )}` +
    `&season=${encodeURIComponent(
      normalizedSeason
    )}`;

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
        `Līgas tabulas API kļūda: ${response.status}`
    );
  }

  const rawStandings =
    Array.isArray(
      data?.standings
    )
      ? data.standings
      : [];

  const standings =
    rawStandings
      .map(
        normalizeRow
      )
      .filter(
        row =>
          row.team?.id
      )
      .sort(
        (a, b) =>
          Number(
            a.position ?? 999
          ) -
          Number(
            b.position ?? 999
          )
      );

  if (
    !standings.length
  ) {
    throw new Error(
      "API-Football neatgrieza līgas tabulas datus izvēlētajai sezonai."
    );
  }

  writeCache(
    cacheKey,
    standings
  );

  return standings;
};

export const clearLeagueTablesCache =
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