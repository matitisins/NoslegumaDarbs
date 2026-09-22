// src/services/apiSports.js

const BASE_URL =
  "http://localhost/Nosleguma_Darbs/Nosleguma_Darbs/backend/api";

const CACHE_PREFIX = "flow_api_football_v11_";
const CACHE_TTL = 30 * 60 * 1000;

// ============================================================
// COMPETITION IDS
// ============================================================

export const COMPETITION_IDS = {
  PL: 39,
  PD: 140,
  SA: 135,
  BL1: 78,
  FL1: 61,
};

const COMPETITION_CODES_BY_ID = {
  39: "PL",
  140: "PD",
  135: "SA",
  78: "BL1",
  61: "FL1",
};

// ============================================================
// HELPERS
// ============================================================

function isNumber(value) {
  return (
    value !== null &&
    value !== undefined &&
    value !== "" &&
    Number.isFinite(Number(value))
  );
}

function numberOrNull(value) {
  return isNumber(value) ? Number(value) : null;
}

function numberOrZero(value) {
  const result = numberOrNull(value);
  return result === null ? 0 : result;
}

function firstDefined(...values) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      value !== ""
    ) {
      return value;
    }
  }

  return null;
}

function stringOrFallback(value, fallback = "") {
  if (
    value === null ||
    value === undefined
  ) {
    return fallback;
  }

  const result = String(value).trim();

  return result || fallback;
}

// ============================================================
// COMPETITION
// ============================================================

function normalizeCompetition(competition) {
  if (
    competition === null ||
    competition === undefined
  ) {
    return null;
  }

  const value = String(
    competition
  )
    .trim()
    .toUpperCase();

  if (
    Object.prototype.hasOwnProperty.call(
      COMPETITION_IDS,
      value
    )
  ) {
    return value;
  }

  const numericId = Number(value);

  if (
    Object.prototype.hasOwnProperty.call(
      COMPETITION_CODES_BY_ID,
      numericId
    )
  ) {
    return COMPETITION_CODES_BY_ID[numericId];
  }

  return null;
}

// ============================================================
// SEASON
// ============================================================

export function seasonToApiSeason(season) {
  if (typeof season === "number") {
    return season;
  }

  const value = String(
    season ?? ""
  ).trim();

  const match = value.match(
    /^(\d{4})/
  );

  if (match) {
    return Number(match[1]);
  }

  const numeric = Number(value);

  if (
    Number.isFinite(numeric) &&
    numeric >= 2000
  ) {
    return numeric;
  }

  return new Date().getFullYear();
}

// ============================================================
// POSITION NORMALIZATION
// ============================================================

function normalizePosition(position) {
  if (
    position === null ||
    position === undefined
  ) {
    return null;
  }

  const value = String(position)
    .trim()
    .toLowerCase();

  // --------------------------
  // GOALKEEPER
  // --------------------------

  if (
    value === "gk" ||
    value === "g" ||
    value === "goalkeeper" ||
    value === "goalkeepers" ||
    value.includes("goalkeeper") ||
    value.includes("keeper")
  ) {
    return "GK";
  }

  // --------------------------
  // DEFENDER
  // --------------------------

  if (
    value === "df" ||
    value === "d" ||
    value === "def" ||
    value === "defender" ||
    value === "defenders" ||
    value === "centre-back" ||
    value === "center-back" ||
    value === "centre back" ||
    value === "center back" ||
    value === "cb" ||
    value === "lb" ||
    value === "rb" ||
    value === "lwb" ||
    value === "rwb" ||
    value.includes("defender") ||
    value.includes("defence") ||
    value.includes("defense") ||
    value.includes("back")
  ) {
    return "DEF";
  }

  // --------------------------
  // MIDFIELDER
  // --------------------------

  if (
    value === "mf" ||
    value === "m" ||
    value === "mid" ||
    value === "midfielder" ||
    value === "midfielders" ||
    value === "cm" ||
    value === "dm" ||
    value === "am" ||
    value === "lm" ||
    value === "rm" ||
    value === "cdm" ||
    value === "cam" ||
    value.includes("midfielder") ||
    value.includes("midfield")
  ) {
    return "MID";
  }

  // --------------------------
  // ATTACKER
  // --------------------------

  if (
    value === "fw" ||
    value === "f" ||
    value === "attacker" ||
    value === "attackers" ||
    value === "forward" ||
    value === "forwards" ||
    value === "striker" ||
    value === "strikers" ||
    value === "st" ||
    value === "cf" ||
    value === "lw" ||
    value === "rw" ||
    value.includes("attacker") ||
    value.includes("forward") ||
    value.includes("striker")
  ) {
    return "STR";
  }

  return null;
}

// ============================================================
// FLOW CATEGORY
// ============================================================

function positionToCategory(position) {
  switch (position) {
    case "GK":
      return "GOALKEEPERS";

    case "DEF":
      return "DEFENDERS";

    case "MID":
      return "MIDFIELDERS";

    case "STR":
      return "STRIKERS";

    default:
      return null;
  }
}

// ============================================================
// GET STATISTICS
// ============================================================

function getStatisticsArray(item) {
  if (!item) {
    return [];
  }

  if (
    Array.isArray(item.statistics)
  ) {
    return item.statistics;
  }

  if (
    Array.isArray(item.stats)
  ) {
    return item.stats;
  }

  if (
    Array.isArray(item.statistic)
  ) {
    return item.statistic;
  }

  if (
    item.statistics &&
    typeof item.statistics === "object"
  ) {
    return [item.statistics];
  }

  if (
    item.stats &&
    typeof item.stats === "object"
  ) {
    return [item.stats];
  }

  if (
    item.games ||
    item.goals ||
    item.passes ||
    item.shots
  ) {
    return [item];
  }

  return [];
}

// ============================================================
// EMPTY STATS
// ============================================================

function createEmptyStats() {
  return {
    appearances: 0,
    lineups: 0,
    minutes: 0,

    goals: 0,
    assists: 0,

    shots: 0,
    shotsOnTarget: 0,

    passes: 0,
    keyPasses: 0,

    passAccuracyTotal: 0,
    passAccuracyCount: 0,

    tackles: 0,
    blocks: 0,
    interceptions: 0,

    duels: 0,
    duelsWon: 0,

    dribbles: 0,
    successfulDribbles: 0,

    foulsDrawn: 0,
    foulsCommitted: 0,

    yellowCards: 0,
    yellowRedCards: 0,
    redCards: 0,

    penaltyWon: 0,
    penaltyCommitted: 0,
    penaltyGoals: 0,
    penaltyMissed: 0,
    penaltySaved: 0,

    saves: 0,
    goalsConceded: 0,

    ratings: [],

    position: null,

    team: null,
  };
}

// ============================================================
// ADD STATISTIC
// ============================================================

function addStatistic(
  aggregate,
  statistic
) {
  if (
    !statistic ||
    typeof statistic !== "object"
  ) {
    return;
  }

  // ----------------------------------------------------------
  // GAMES
  // ----------------------------------------------------------

  const games =
    statistic.games || {};

  aggregate.appearances +=
    numberOrZero(
      firstDefined(
        games.appearences,
        games.appearances,
        statistic.appearences,
        statistic.appearances
      )
    );

  aggregate.lineups +=
    numberOrZero(
      firstDefined(
        games.lineups,
        statistic.lineups
      )
    );

  aggregate.minutes +=
    numberOrZero(
      firstDefined(
        games.minutes,
        statistic.minutes
      )
    );

  const detectedPosition =
    firstDefined(
      games.position,
      statistic.position
    );

  if (
    detectedPosition !== null &&
    detectedPosition !== undefined
  ) {
    aggregate.position =
      detectedPosition;
  }

  // ----------------------------------------------------------
  // TEAM
  // ----------------------------------------------------------

  if (
    !aggregate.team &&
    statistic.team
  ) {
    aggregate.team =
      statistic.team;
  }

  // ----------------------------------------------------------
  // GOALS
  // ----------------------------------------------------------

  const goals =
    statistic.goals || {};

  aggregate.goals +=
    numberOrZero(
      firstDefined(
        goals.total,
        statistic.goals_total
      )
    );

  aggregate.assists +=
    numberOrZero(
      firstDefined(
        goals.assists,
        statistic.assists
      )
    );

  aggregate.saves +=
    numberOrZero(
      firstDefined(
        goals.saves,
        statistic.saves
      )
    );

  aggregate.goalsConceded +=
    numberOrZero(
      firstDefined(
        goals.conceded,
        statistic.goals_conceded
      )
    );

  // ----------------------------------------------------------
  // SHOTS
  // ----------------------------------------------------------

  const shots =
    statistic.shots || {};

  aggregate.shots +=
    numberOrZero(
      firstDefined(
        shots.total,
        statistic.shots_total
      )
    );

  aggregate.shotsOnTarget +=
    numberOrZero(
      firstDefined(
        shots.on,
        statistic.shots_on
      )
    );

  // ----------------------------------------------------------
  // PASSES
  // ----------------------------------------------------------

  const passes =
    statistic.passes || {};

  const totalPasses =
    numberOrNull(
      firstDefined(
        passes.total,
        statistic.passes_total
      )
    );

  const keyPasses =
    numberOrNull(
      firstDefined(
        passes.key,
        statistic.key_passes
      )
    );

  const accuracy =
    numberOrNull(
      firstDefined(
        passes.accuracy,
        statistic.pass_accuracy
      )
    );

  if (
    totalPasses !== null
  ) {
    aggregate.passes +=
      totalPasses;
  }

  if (
    keyPasses !== null
  ) {
    aggregate.keyPasses +=
      keyPasses;
  }

  if (
    accuracy !== null
  ) {
    aggregate.passAccuracyTotal +=
      accuracy;

    aggregate.passAccuracyCount +=
      1;
  }

  // ----------------------------------------------------------
  // TACKLES
  // ----------------------------------------------------------

  const tackles =
    statistic.tackles || {};

  aggregate.tackles +=
    numberOrZero(
      firstDefined(
        tackles.total,
        statistic.tackles_total
      )
    );

  aggregate.blocks +=
    numberOrZero(
      firstDefined(
        tackles.blocks,
        statistic.blocks
      )
    );

  aggregate.interceptions +=
    numberOrZero(
      firstDefined(
        tackles.interceptions,
        statistic.interceptions
      )
    );

  // ----------------------------------------------------------
  // DUELS
  // ----------------------------------------------------------

  const duels =
    statistic.duels || {};

  aggregate.duels +=
    numberOrZero(
      firstDefined(
        duels.total,
        statistic.duels_total
      )
    );

  aggregate.duelsWon +=
    numberOrZero(
      firstDefined(
        duels.won,
        statistic.duels_won
      )
    );

  // ----------------------------------------------------------
  // DRIBBLES
  // ----------------------------------------------------------

  const dribbles =
    statistic.dribbles || {};

  aggregate.dribbles +=
    numberOrZero(
      firstDefined(
        dribbles.attempts,
        statistic.dribbles_attempts
      )
    );

  aggregate.successfulDribbles +=
    numberOrZero(
      firstDefined(
        dribbles.success,
        statistic.dribbles_success
      )
    );

  // ----------------------------------------------------------
  // FOULS
  // ----------------------------------------------------------

  const fouls =
    statistic.fouls || {};

  aggregate.foulsDrawn +=
    numberOrZero(
      firstDefined(
        fouls.drawn,
        statistic.fouls_drawn
      )
    );

  aggregate.foulsCommitted +=
    numberOrZero(
      firstDefined(
        fouls.committed,
        statistic.fouls_committed
      )
    );

  // ----------------------------------------------------------
  // CARDS
  // ----------------------------------------------------------

  const cards =
    statistic.cards || {};

  aggregate.yellowCards +=
    numberOrZero(
      firstDefined(
        cards.yellow,
        statistic.yellow
      )
    );

  aggregate.yellowRedCards +=
    numberOrZero(
      firstDefined(
        cards.yellowred,
        statistic.yellowred
      )
    );

  aggregate.redCards +=
    numberOrZero(
      firstDefined(
        cards.red,
        statistic.red
      )
    );

  // ----------------------------------------------------------
  // PENALTIES
  // ----------------------------------------------------------

  const penalty =
    statistic.penalty || {};

  aggregate.penaltyWon +=
    numberOrZero(
      firstDefined(
        penalty.won,
        statistic.penalty_won
      )
    );

  aggregate.penaltyCommitted +=
    numberOrZero(
      firstDefined(
        penalty.committed,
        statistic.penalty_committed
      )
    );

  aggregate.penaltyGoals +=
    numberOrZero(
      firstDefined(
        penalty.scored,
        statistic.penalty_scored
      )
    );

  aggregate.penaltyMissed +=
    numberOrZero(
      firstDefined(
        penalty.missed,
        statistic.penalty_missed
      )
    );

  aggregate.penaltySaved +=
    numberOrZero(
      firstDefined(
        penalty.saved,
        statistic.penalty_saved
      )
    );

  // ----------------------------------------------------------
  // RATING
  // ----------------------------------------------------------

  const rating =
    numberOrNull(
      firstDefined(
        games.rating,
        statistic.rating
      )
    );

  if (
    rating !== null
  ) {
    aggregate.ratings.push(
      rating
    );
  }
}

// ============================================================
// AGGREGATE
// ============================================================

function aggregateStatistics(
  statistics
) {
  const aggregate =
    createEmptyStats();

  statistics.forEach(
    statistic => {
      addStatistic(
        aggregate,
        statistic
      );
    }
  );

  return aggregate;
}

// ============================================================
// FLOW POINTS
// ============================================================

function calculateFlowPoints(
  position,
  goals,
  assists,
  penaltyGoals
) {
  let goalPoints = 4;

  if (position === "GK") {
    goalPoints = 10;
  }

  if (position === "DEF") {
    goalPoints = 6;
  }

  if (position === "MID") {
    goalPoints = 5;
  }

  if (position === "STR") {
    goalPoints = 4;
  }

  let points =
    numberOrZero(goals) *
    goalPoints;

  points +=
    numberOrZero(assists) *
    3;

  if (
    position === "MID" ||
    position === "STR"
  ) {
    points +=
      numberOrZero(
        penaltyGoals
      ) *
      2;
  }

  return points;
}

// ============================================================
// RADAR
// ============================================================

function createRadarStats(
  position,
  stats
) {
  if (position === "GK") {
    return {
      labels: [
        "SAVES",
        "PASSING",
        "PASS ACCURACY",
        "RATING",
      ],

      values: [
        stats.saves,
        stats.passes,
        stats.passAccuracy,
        stats.rating,
      ],
    };
  }

  if (position === "DEF") {
    return {
      labels: [
        "TACKLES",
        "BLOCKS",
        "INTERCEPTIONS",
        "DUELS WON",
        "PASSING",
        "PASS ACCURACY",
      ],

      values: [
        stats.tackles,
        stats.blocks,
        stats.interceptions,
        stats.duelsWon,
        stats.passes,
        stats.passAccuracy,
      ],
    };
  }

  if (position === "MID") {
    return {
      labels: [
        "GOALS",
        "ASSISTS",
        "KEY PASSES",
        "PASSING",
        "DRIBBLES",
        "DUELS WON",
      ],

      values: [
        stats.goals,
        stats.assists,
        stats.keyPasses,
        stats.passes,
        stats.successfulDribbles,
        stats.duelsWon,
      ],
    };
  }

  if (position === "STR") {
    return {
      labels: [
        "GOALS",
        "ASSISTS",
        "SHOTS",
        "SHOTS ON TARGET",
        "DRIBBLES",
        "DUELS WON",
      ],

      values: [
        stats.goals,
        stats.assists,
        stats.shots,
        stats.shotsOnTarget,
        stats.successfulDribbles,
        stats.duelsWon,
      ],
    };
  }

  return {
    labels: [],
    values: [],
  };
}

// ============================================================
// PLAYER CONVERSION
// ============================================================

function convertPlayer(
  item,
  index
) {
  if (!item) {
    return null;
  }

  const player =
    item.player ||
    item.person ||
    item.profile ||
    item;

  const statistics =
    getStatisticsArray(item);

  const aggregate =
    aggregateStatistics(
      statistics
    );

  // ----------------------------------------------------------
  // PLAYER ID
  // ----------------------------------------------------------

  const playerId =
    firstDefined(
      player.id,
      item.player_id,
      item.id
    );

  if (!playerId) {
    return null;
  }

  // ----------------------------------------------------------
  // POSITION
  // ----------------------------------------------------------

  const rawPosition =
    firstDefined(
      aggregate.position,
      player.position,
      item.position,
      item.games?.position
    );

  const position =
    normalizePosition(
      rawPosition
    );

  const category =
    positionToCategory(
      position
    );

  /*
   * IMPORTANT:
   *
   * We do NOT assign a random/default position.
   * If API-Football does not give us a position,
   * the player is ignored instead of being incorrectly
   * placed into another position.
   */

  if (
    !position ||
    !category
  ) {
    console.warn(
      "Flow: player has no recognized position:",
      {
        id: playerId,
        name: player.name,
        rawPosition,
        statistics,
      }
    );

    return null;
  }

  // ----------------------------------------------------------
  // TEAM
  // ----------------------------------------------------------

  const team =
    aggregate.team ||
    item.team ||
    player.team ||
    {};

  const teamId =
    firstDefined(
      team.id,
      item.team_id
    );

  const teamName =
    stringOrFallback(
      firstDefined(
        team.name,
        item.team_name
      ),
      "Unknown Team"
    );

  const teamLogo =
    stringOrFallback(
      firstDefined(
        team.logo,
        item.team_logo
      )
    );

  // ----------------------------------------------------------
  // COMMON STATS
  // ----------------------------------------------------------

  const games =
    numberOrZero(
      aggregate.appearances
    );

  const minutes =
    numberOrZero(
      aggregate.minutes
    );

  const goals =
    numberOrZero(
      aggregate.goals
    );

  const assists =
    numberOrZero(
      aggregate.assists
    );

  const penaltyGoals =
    numberOrZero(
      aggregate.penaltyGoals
    );

  const passAccuracy =
    aggregate.passAccuracyCount > 0
      ? Math.round(
          aggregate.passAccuracyTotal /
            aggregate.passAccuracyCount
        )
      : null;

  const duelsWonPercentage =
    aggregate.duels > 0
      ? Math.round(
          (
            aggregate.duelsWon /
            aggregate.duels
          ) *
            100
        )
      : null;

  const savePercentage =
    aggregate.saves +
      aggregate.goalsConceded >
    0
      ? Math.round(
          (
            aggregate.saves /
            (
              aggregate.saves +
              aggregate.goalsConceded
            )
          ) *
            100
        )
      : null;

  const rating =
    aggregate.ratings.length > 0
      ? Number(
          (
            aggregate.ratings.reduce(
              (total, value) =>
                total + value,
              0
            ) /
            aggregate.ratings.length
          ).toFixed(2)
        )
      : null;

  // ----------------------------------------------------------
  // FLOW
  // ----------------------------------------------------------

  const flow =
    calculateFlowPoints(
      position,
      goals,
      assists,
      penaltyGoals
    );

  // ----------------------------------------------------------
  // RADAR
  // ----------------------------------------------------------

  const radarStats =
    createRadarStats(
      position,
      {
        goals,

        assists,

        shots:
          aggregate.shots,

        shotsOnTarget:
          aggregate.shotsOnTarget,

        passes:
          aggregate.passes,

        keyPasses:
          aggregate.keyPasses,

        passAccuracy,

        tackles:
          aggregate.tackles,

        blocks:
          aggregate.blocks,

        interceptions:
          aggregate.interceptions,

        duelsWon:
          aggregate.duelsWon,

        successfulDribbles:
          aggregate.successfulDribbles,

        saves:
          aggregate.saves,

        rating,
      }
    );

  // ----------------------------------------------------------
  // PLAYER OBJECT
  // ----------------------------------------------------------

  return {
    id: Number(playerId),

    playerId: Number(playerId),

    name:
      stringOrFallback(
        firstDefined(
          player.name,
          item.name
        ),
        `Player ${index + 1}`
      ),

    firstname:
      stringOrFallback(
        player.firstname
      ),

    lastname:
      stringOrFallback(
        player.lastname
      ),

    photo:
      stringOrFallback(
        firstDefined(
          player.photo,
          player.image,
          item.photo,
          item.image
        )
      ),

    age:
      numberOrNull(
        player.age
      ),

    nationality:
      stringOrFallback(
        player.nationality
      ),

    height:
      stringOrFallback(
        player.height
      ),

    weight:
      stringOrFallback(
        player.weight
      ),

    // IMPORTANT:
    // Keep category compatible with existing Flow UI.
    category,

    position,

    positionLabel:
      position === "GK"
        ? "Goalkeeper"
        : position === "DEF"
        ? "Defender"
        : position === "MID"
        ? "Midfielder"
        : "Attacker",

    team: teamName,

    teamName,

    teamId:
      teamId !== null
        ? Number(teamId)
        : null,

    teamLogo,

    league: null,

    season: null,

    // --------------------------------------------------------
    // COMMON
    // --------------------------------------------------------

    games,

    appearances: games,

    minutes,

    goals,

    assists,

    flow,

    flowPoints: flow,

    points: flow,

    // --------------------------------------------------------
    // ADVANCED
    // --------------------------------------------------------

    penaltyGoals:
      position === "MID" ||
      position === "STR"
        ? penaltyGoals
        : null,

    // API-Football does not provide a standard
    // player-season clean sheet field.
    cleanSheets: null,

    yellowCards:
      aggregate.yellowCards,

    yellow:
      aggregate.yellowCards,

    yellowRedCards:
      aggregate.yellowRedCards,

    redCards:
      aggregate.redCards,

    red:
      aggregate.redCards,

    shots:
      aggregate.shots,

    shotsOnTarget:
      aggregate.shotsOnTarget,

    passes:
      aggregate.passes,

    keyPasses:
      aggregate.keyPasses,

    passAccuracy,

    tackles:
      aggregate.tackles,

    blocks:
      aggregate.blocks,

    interceptions:
      aggregate.interceptions,

    duels:
      aggregate.duels,

    duelsWon:
      aggregate.duelsWon,

    duelsWonPercentage,

    dribbles:
      aggregate.dribbles,

    successfulDribbles:
      aggregate.successfulDribbles,

    foulsDrawn:
      aggregate.foulsDrawn,

    foulsCommitted:
      aggregate.foulsCommitted,

    saves:
      position === "GK"
        ? aggregate.saves
        : null,

    savePercentage:
      position === "GK"
        ? savePercentage
        : null,

    goalsConceded:
      position === "GK"
        ? aggregate.goalsConceded
        : null,

    rating,

    penaltyWon:
      aggregate.penaltyWon,

    penaltyCommitted:
      aggregate.penaltyCommitted,

    penaltyMissed:
      aggregate.penaltyMissed,

    penaltySaved:
      aggregate.penaltySaved,

    // --------------------------------------------------------
    // RADAR
    // --------------------------------------------------------

    customStats:
      radarStats,

    radarStats,

    // --------------------------------------------------------
    // NESTED STATS
    // --------------------------------------------------------

    stats: {
      games,

      appearances: games,

      minutes,

      goals,

      assists,

      flow,

      points: flow,

      penaltyGoals:
        position === "MID" ||
        position === "STR"
          ? penaltyGoals
          : null,

      cleanSheets: null,

      yellowCards:
        aggregate.yellowCards,

      redCards:
        aggregate.redCards,

      shots:
        aggregate.shots,

      shotsOnTarget:
        aggregate.shotsOnTarget,

      passes:
        aggregate.passes,

      keyPasses:
        aggregate.keyPasses,

      passAccuracy,

      tackles:
        aggregate.tackles,

      blocks:
        aggregate.blocks,

      interceptions:
        aggregate.interceptions,

      duels:
        aggregate.duels,

      duelsWon:
        aggregate.duelsWon,

      duelsWonPercentage,

      dribbles:
        aggregate.dribbles,

      successfulDribbles:
        aggregate.successfulDribbles,

      saves:
        position === "GK"
          ? aggregate.saves
          : null,

      savePercentage:
        position === "GK"
          ? savePercentage
          : null,

      goalsConceded:
        position === "GK"
          ? aggregate.goalsConceded
          : null,

      rating,
    },

    realStats: {
      appearances: games,

      games,

      minutes,

      goals,

      assists,

      penaltyGoals:
        position === "MID" ||
        position === "STR"
          ? penaltyGoals
          : null,

      cleanSheets: null,

      yellowCards:
        aggregate.yellowCards,

      redCards:
        aggregate.redCards,
    },

    source: "api-football",
  };
}

// ============================================================
// CACHE
// ============================================================

function getCacheKey(
  competition,
  season
) {
  return (
    `${CACHE_PREFIX}` +
    `${competition}_${season}`
  );
}

function readCache(
  competition,
  season
) {
  try {
    const key =
      getCacheKey(
        competition,
        season
      );

    const raw =
      localStorage.getItem(
        key
      );

    if (!raw) {
      return null;
    }

    const parsed =
      JSON.parse(raw);

    if (
      !parsed ||
      !Array.isArray(
        parsed.players
      )
    ) {
      return null;
    }

    if (
      Date.now() -
        parsed.timestamp >
      CACHE_TTL
    ) {
      return null;
    }

    return parsed.players;
  } catch {
    return null;
  }
}

function writeCache(
  competition,
  season,
  players
) {
  try {
    const key =
      getCacheKey(
        competition,
        season
      );

    localStorage.setItem(
      key,
      JSON.stringify({
        timestamp:
          Date.now(),

        players,
      })
    );
  } catch (error) {
    console.warn(
      "Flow cache write error:",
      error
    );
  }
}

// ============================================================
// FETCH PLAYERS
// ============================================================

export async function fetchApiSportsPlayers(
  competition = "PL",
  season = 2026,
  options = {}
) {
  const normalizedCompetition =
    normalizeCompetition(
      competition
    );

  if (!normalizedCompetition) {
    throw new Error(
      "Neatbalsta līga."
    );
  }

  const apiSeason =
    seasonToApiSeason(
      season
    );

  const forceRefresh =
    options.forceRefresh === true;

  // ----------------------------------------------------------
  // CACHE
  // ----------------------------------------------------------

  if (!forceRefresh) {
    const cached =
      readCache(
        normalizedCompetition,
        apiSeason
      );

    if (
      Array.isArray(cached) &&
      cached.length > 0
    ) {
      console.log(
        "Flow: using cached API-Football data",
        {
          competition:
            normalizedCompetition,

          season:
            apiSeason,

          count:
            cached.length,
        }
      );

      return cached;
    }
  }

  // ----------------------------------------------------------
  // API URL
  // ----------------------------------------------------------

  const url =
    `${BASE_URL}/api-football.php` +
    `?competition=${encodeURIComponent(
      normalizedCompetition
    )}` +
    `&season=${encodeURIComponent(
      apiSeason
    )}`;

  console.log(
    "Flow API-Football request:",
    url
  );

  let response;

  try {
    response =
      await fetch(
        url,
        {
          method: "GET",

          headers: {
            Accept:
              "application/json",
          },

          cache:
            "no-store",
        }
      );
  } catch (error) {
    console.error(
      "Flow API-Football network error:",
      error
    );

    throw new Error(
      "Neizdevās savienoties ar Flow backend."
    );
  }

  let data;

  try {
    data =
      await response.json();
  } catch {
    throw new Error(
      "Backend neatgrieza derīgu JSON atbildi."
    );
  }

  console.log(
    "Flow API-Football response:",
    {
      status:
        response.status,

      success:
        data?.success,

      source:
        data?.source,

      competition:
        data?.competition,

      season:
        data?.season,

      count:
        data?.count,

      players:
        Array.isArray(
          data?.players
        )
          ? data.players.length
          : null,

      firstPlayer:
        data?.players?.[0] ||
        null,
    }
  );

  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  if (!response.ok) {
    throw new Error(
      data?.message ||
        data?.error ||
        `API-Football kļūda: ${response.status}`
    );
  }

  if (
    data?.success === false
  ) {
    throw new Error(
      data?.message ||
        data?.error ||
        "API-Football atgrieza kļūdu."
    );
  }

  // ----------------------------------------------------------
  // RAW PLAYERS
  // ----------------------------------------------------------

  let rawPlayers = [];

  if (
    Array.isArray(
      data?.players
    )
  ) {
    rawPlayers =
      data.players;
  } else if (
    Array.isArray(
      data?.response
    )
  ) {
    rawPlayers =
      data.response;
  } else if (
    Array.isArray(data)
  ) {
    rawPlayers =
      data;
  }

  if (
    rawPlayers.length === 0
  ) {
    throw new Error(
      "Šai līgai un sezonai nav pieejamu spēlētāju datu."
    );
  }

  // ----------------------------------------------------------
  // CONVERT
  // ----------------------------------------------------------

  const players =
    rawPlayers
      .map(
        (item, index) =>
          convertPlayer(
            item,
            index
          )
      )
      .filter(Boolean);

  console.log(
    "Flow converted players:",
    {
      raw:
        rawPlayers.length,

      converted:
        players.length,

      goalkeepers:
        players.filter(
          p =>
            p.category ===
            "GOALKEEPERS"
        ).length,

      defenders:
        players.filter(
          p =>
            p.category ===
            "DEFENDERS"
        ).length,

      midfielders:
        players.filter(
          p =>
            p.category ===
            "MIDFIELDERS"
        ).length,

      strikers:
        players.filter(
          p =>
            p.category ===
            "STRIKERS"
        ).length,
    }
  );

  if (
    players.length === 0
  ) {
    throw new Error(
      "API atgrieza spēlētājus, bet tos nevarēja pārveidot par Flow spēlētājiem."
    );
  }

  // ----------------------------------------------------------
  // REMOVE DUPLICATES
  // ----------------------------------------------------------

  const uniquePlayers =
    Array.from(
      new Map(
        players.map(
          player => [
            player.id,
            player,
          ]
        )
      ).values()
    );

  // ----------------------------------------------------------
  // FINAL DATA
  // ----------------------------------------------------------

  const finalPlayers =
    uniquePlayers.map(
      player => ({
        ...player,

        league:
          normalizedCompetition,

        season:
          String(apiSeason),
      })
    );

  // ----------------------------------------------------------
  // CACHE
  // ----------------------------------------------------------

  writeCache(
    normalizedCompetition,
    apiSeason,
    finalPlayers
  );

  return finalPlayers;
}

// ============================================================
// STANDINGS
// ============================================================

export async function fetchCompetitionStandings(
  competition = "PL",
  season = 2026
) {
  return [];
}

// ============================================================
// FDR
// ============================================================

export async function getTeamFdr(
  teamId,
  competition,
  season
) {
  return 3;
}

// ============================================================
// CLEAR CACHE
// ============================================================

export function clearFootballDataCache() {
  try {
    const keys = [];

    for (
      let i = 0;
      i < localStorage.length;
      i++
    ) {
      const key =
        localStorage.key(i);

      if (!key) {
        continue;
      }

      if (
        key.startsWith(
          "flow_api_football_"
        ) ||
        key.startsWith(
          "flow_api_football_v"
        ) ||
        key.startsWith(
          "players_"
        ) ||
        key.startsWith(
          "flow_football_data_"
        )
      ) {
        keys.push(key);
      }
    }

    keys.forEach(
      key =>
        localStorage.removeItem(
          key
        )
    );

    console.log(
      `Flow: cleared ${keys.length} cache entries.`
    );
  } catch (error) {
    console.warn(
      "Flow cache clear error:",
      error
    );
  }
}

// ============================================================
// DEFAULT EXPORT
// ============================================================

export default {
  COMPETITION_IDS,
  seasonToApiSeason,
  fetchApiSportsPlayers,
  fetchCompetitionStandings,
  getTeamFdr,
  clearFootballDataCache,
};