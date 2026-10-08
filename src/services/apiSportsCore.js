import { API_BASE_URL } from "../config/api";

const BASE_URL = API_BASE_URL;

const REQUEST_TIMEOUT = 30000;

const isValidSeason = season =>
  /^\d{4}$/.test(String(season)) &&
  Number(season) >= 2000 &&
  Number(season) <= 2100;

const isValidCompetition = competition =>
  Object.prototype.hasOwnProperty.call(
    API_FOOTBALL_LEAGUES,
    competition
  );

const buildApiUrl = (path, params = {}) => {
  const url = `${BASE_URL}/${String(path).replace(/^\/+/, "")}`;

  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const query = search.toString();

  return query ? `${url}?${query}` : url;
};

const requestJson = async (url, options = {}) => {
  const controller =
    typeof AbortController !== "undefined"
      ? new AbortController()
      : null;

  const externalSignal = options.signal;
  let timeoutId = null;

  if (controller) {
    timeoutId = setTimeout(
      () => controller.abort(),
      REQUEST_TIMEOUT
    );
  }

  if (externalSignal && controller) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener(
        "abort",
        () => controller.abort(),
        { once: true }
      );
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller?.signal || externalSignal,
      headers: {
        Accept: "application/json",
        ...(options.headers || {}),
      },
    });

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || data?.success === false) {
      throw new Error(
        data?.error ||
          `API pieprasījums neizdevās: HTTP ${response.status}`
      );
    }

    return data;
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error(
        "API pieprasījums tika atcelts vai pārsniedza 30 sekunžu izpildes laiku."
      );
    }

    throw error;
  } finally {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  }
};

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

const API_FOOTBALL_LEAGUES = {
  PL: 39,
  PD: 140,
  SA: 135,
  BL1: 78,
  FL1: 61,
};

/*
 * v9 is intentional.
 *
 * The previous cache contained the old Flow-point calculation.
 * Changing the prefix guarantees that the new FPL-based values
 * are loaded instead of the old cached values.
 */
const CACHE_PREFIX = "flow_api_football_v11_";

const CACHE_TIME = 1000 * 60 * 60;

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

const nullableNumber = value => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
};

const normalizePercentage = value => {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(
    String(value).replace("%", "")
  );

  return Number.isFinite(number)
    ? number
    : null;
};

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

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

    return parsed.data;
  } catch {
    return null;
  }
};

const getAnyCache = key => {
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
    // Ignore browser storage limits.
  }
};

const getPositionCategory = position => {
  const p = String(position || "")
    .toLowerCase()
    .trim();

  if (
    p.includes("goalkeeper") ||
    p.includes("keeper") ||
    p === "gk" ||
    p === "g"
  ) {
    return "GOALKEEPERS";
  }

  if (
    p.includes("defence") ||
    p.includes("defender") ||
    p.includes("back") ||
    p.includes("centre-back") ||
    p.includes("center-back") ||
    p === "d"
  ) {
    return "DEFENDERS";
  }

  if (
    p.includes("midfield") ||
    p.includes("midfielder") ||
    p === "m"
  ) {
    return "MIDFIELDERS";
  }

  if (
    p.includes("offence") ||
    p.includes("offense") ||
    p.includes("forward") ||
    p.includes("striker") ||
    p.includes("attacker") ||
    p.includes("winger") ||
    p === "f"
  ) {
    return "STRIKERS";
  }

  return null;
};

const getPositionLabel = category =>
  POSITION_LABELS[category] ||
  "Spēlētājs";

/*
|--------------------------------------------------------------------------
| FPL-style fallback
|--------------------------------------------------------------------------
*/

const calculateFantasyPoints = ({
  category,
  appearances,
  minutes,
  goals,
  assists,
  penaltiesMissed,
  saves,
  goalsConceded,
  yellowCards,
  redCards,
}) => {
  const goalPoints = {
    GOALKEEPERS: 10,
    DEFENDERS: 6,
    MIDFIELDERS: 5,
    STRIKERS: 4,
  };

  const appearanceCount =
    toNumber(appearances);

  const totalMinutes =
    toNumber(minutes);

  let appearancePoints = 0;

  if (appearanceCount > 0) {
    const averageMinutes =
      totalMinutes /
      appearanceCount;

    appearancePoints =
      averageMinutes >= 60
        ? appearanceCount * 2
        : appearanceCount;
  }

  const scoredGoalPoints =
    toNumber(goals) *
    (goalPoints[category] || 4);

  const assistPoints =
    toNumber(assists) * 3;

  const savePoints =
    category === "GOALKEEPERS"
      ? Math.floor(
          toNumber(saves) / 3
        )
      : 0;

  const penaltyMissPoints =
    toNumber(penaltiesMissed) * -2;

  const concededGoalPoints =
    category === "GOALKEEPERS" ||
    category === "DEFENDERS"
      ? -Math.floor(
          toNumber(goalsConceded) / 2
        )
      : 0;

  const yellowCardPoints =
    toNumber(yellowCards) * -1;

  const redCardPoints =
    toNumber(redCards) * -3;

  return Math.round(
    appearancePoints +
      scoredGoalPoints +
      assistPoints +
      savePoints +
      penaltyMissPoints +
      concededGoalPoints +
      yellowCardPoints +
      redCardPoints
  );
};

const sumField = (
  stats,
  selector
) =>
  stats.reduce(
    (total, item) => {
      const value =
        selector(item);

      return value === null ||
        value === undefined
        ? total
        : total + toNumber(value);
    },
    0
  );

const firstNonNull = (
  stats,
  selector
) => {
  for (const item of stats) {
    const value =
      selector(item);

    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
};

const weightedAverage = (
  stats,
  valueSelector,
  weightSelector
) => {
  let weightedTotal = 0;
  let weightTotal = 0;

  for (const item of stats) {
    const value =
      nullableNumber(
        valueSelector(item)
      );

    const weight =
      toNumber(
        weightSelector(item)
      );

    if (value === null) {
      continue;
    }

    if (weight > 0) {
      weightedTotal +=
        value * weight;

      weightTotal += weight;
    }
  }

  if (weightTotal > 0) {
    return (
      Math.round(
        (weightedTotal /
          weightTotal) *
          10
      ) / 10
    );
  }

  const values = stats
    .map(item =>
      nullableNumber(
        valueSelector(item)
      )
    )
    .filter(
      value => value !== null
    );

  if (!values.length) {
    return null;
  }

  return (
    Math.round(
      (
        values.reduce(
          (sum, value) =>
            sum + value,
          0
        ) /
        values.length
      ) * 10
    ) / 10
  );
};


export {
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
};