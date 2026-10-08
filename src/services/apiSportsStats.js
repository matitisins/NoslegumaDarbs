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

const aggregatePlayerStats =
  statistics => {
    const stats =
      Array.isArray(statistics)
        ? statistics.filter(Boolean)
        : [];

    if (!stats.length) {
      return {
        teamId: null,
        team: null,
        teamLogo: null,
        position: null,

        appearances: 0,
        minutes: 0,
        goals: 0,
        assists: 0,
        penaltyGoals: 0,

        shots: 0,
        shotsOnTarget: 0,

        passes: 0,
        keyPasses: 0,
        passAccuracy: null,

        tackles: 0,
        blocks: 0,
        interceptions: 0,

        duels: 0,
        duelsWon: 0,

        dribbleAttempts: 0,
        successfulDribbles: 0,

        foulsDrawn: 0,
        foulsCommitted: 0,

        yellowCards: 0,
        yellowRedCards: 0,
        redCards: 0,

        penaltiesMissed: 0,
        penaltiesWon: 0,

        saves: 0,
        goalsConceded: 0,

        rating: null,

        starts: 0,
        substituteIn: 0,
        substituteOut: 0,
        bench: 0,
      };
    }

    const appearances =
      sumField(
        stats,
        item =>
          item.games?.appearences
      );

    const minutes =
      sumField(
        stats,
        item =>
          item.games?.minutes
      );

    const passes =
      sumField(
        stats,
        item =>
          item.passes?.total
      );

    const accuratePasses =
      sumField(
        stats,
        item => {
          const total =
            nullableNumber(
              item.passes?.total
            );

          const accuracy =
            normalizePercentage(
              item.passes?.accuracy
            );

          if (
            total === null ||
            accuracy === null
          ) {
            return null;
          }

          return (
            (total * accuracy) /
            100
          );
        }
      );

    const duels =
      sumField(
        stats,
        item =>
          item.duels?.total
      );

    const duelsWon =
      sumField(
        stats,
        item =>
          item.duels?.won
      );

    const dribbleAttempts =
      sumField(
        stats,
        item =>
          item.dribbles?.attempts
      );

    const successfulDribbles =
      sumField(
        stats,
        item =>
          item.dribbles?.success
      );

    const passAccuracy =
      passes > 0 &&
      accuratePasses >= 0
        ? Math.round(
            (accuratePasses /
              passes) *
              1000
          ) / 10
        : weightedAverage(
            stats,
            item =>
              normalizePercentage(
                item.passes?.accuracy
              ),
            item =>
              item.passes?.total
          );

    const duelsWonPercentage =
      duels > 0
        ? Math.round(
            (duelsWon / duels) *
              1000
          ) / 10
        : null;

    const dribbleSuccess =
      dribbleAttempts > 0
        ? Math.round(
            (successfulDribbles /
              dribbleAttempts) *
              1000
          ) / 10
        : null;

    return {
      teamId:
        firstNonNull(
          stats,
          item =>
            item.team?.id
        ),

      team:
        firstNonNull(
          stats,
          item =>
            item.team?.name
        ),

      teamLogo:
        firstNonNull(
          stats,
          item =>
            item.team?.logo
        ),

      position:
        firstNonNull(
          stats,
          item =>
            item.games?.position
        ),

      appearances,
      minutes,

      goals:
        sumField(
          stats,
          item =>
            item.goals?.total
        ),

      assists:
        sumField(
          stats,
          item =>
            item.goals?.assists
        ),

      penaltyGoals:
        sumField(
          stats,
          item =>
            item.penalty?.scored
        ),

      shots:
        sumField(
          stats,
          item =>
            item.shots?.total
        ),

      shotsOnTarget:
        sumField(
          stats,
          item =>
            item.shots?.on
        ),

      passes,

      keyPasses:
        sumField(
          stats,
          item =>
            item.passes?.key
        ),

      passAccuracy,

      tackles:
        sumField(
          stats,
          item =>
            item.tackles?.total
        ),

      blocks:
        sumField(
          stats,
          item =>
            item.tackles?.blocks
        ),

      interceptions:
        sumField(
          stats,
          item =>
            item.tackles?.interceptions
        ),

      duels,
      duelsWon,
      duelsWonPercentage,

      dribbleAttempts,
      successfulDribbles,
      dribbleSuccess,

      foulsDrawn:
        sumField(
          stats,
          item =>
            item.fouls?.drawn
        ),

      foulsCommitted:
        sumField(
          stats,
          item =>
            item.fouls?.committed
        ),

      yellowCards:
        sumField(
          stats,
          item =>
            item.cards?.yellow
        ),

      yellowRedCards:
        sumField(
          stats,
          item =>
            item.cards?.yellowred
        ),

      redCards:
        sumField(
          stats,
          item =>
            item.cards?.red
        ),

      penaltiesMissed:
        sumField(
          stats,
          item =>
            item.penalty?.missed
        ),

      penaltiesWon:
        sumField(
          stats,
          item =>
            item.penalty?.won
        ),

      saves:
        sumField(
          stats,
          item =>
            item.goals?.saves
        ),

      goalsConceded:
        sumField(
          stats,
          item =>
            item.goals?.conceded
        ),

      rating:
        weightedAverage(
          stats,
          item =>
            item.games?.rating,
          item =>
            item.games?.minutes
        ),

      starts:
        sumField(
          stats,
          item =>
            item.games?.lineups
        ),

      substituteIn:
        sumField(
          stats,
          item =>
            item.substitutes?.in
        ),

      substituteOut:
        sumField(
          stats,
          item =>
            item.substitutes?.out
        ),

      bench:
        sumField(
          stats,
          item =>
            item.substitutes?.bench
        ),
    };
  };

const calculateSavePercentage =
  stats => {
    const saves =
      nullableNumber(
        stats.saves
      );

    const conceded =
      nullableNumber(
        stats.goalsConceded
      );

    if (
      saves === null ||
      conceded === null ||
      saves + conceded <= 0
    ) {
      return null;
    }

    return (
      Math.round(
        (saves /
          (saves + conceded)) *
          1000
      ) / 10
    );
  };

const buildAdvancedStats =
  aggregated => ({
    ...aggregated,

    savePercentage:
      calculateSavePercentage(
        aggregated
      ),
  });

const radarDefinitions = {
  GOALKEEPERS: [
    {
      label: "Saves",
      key: "saves",
    },
    {
      label: "Save %",
      key: "savePercentage",
    },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    {
      label: "Rating",
      key: "rating",
    },
    {
      label: "Minutes",
      key: "minutes",
    },
    {
      label: "Appearances",
      key: "appearances",
    },
  ],

  DEFENDERS: [
    {
      label: "Tackles",
      key: "tackles",
    },
    {
      label: "Interceptions",
      key: "interceptions",
    },
    {
      label: "Blocks",
      key: "blocks",
    },
    {
      label: "Duels won %",
      key: "duelsWonPercentage",
    },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    {
      label: "Minutes",
      key: "minutes",
    },
  ],

  MIDFIELDERS: [
    {
      label: "Key passes",
      key: "keyPasses",
    },
    {
      label: "Passes",
      key: "passes",
    },
    {
      label: "Pass accuracy",
      key: "passAccuracy",
    },
    {
      label: "Dribbles",
      key: "successfulDribbles",
    },
    {
      label: "Duels won %",
      key: "duelsWonPercentage",
    },
    {
      label: "Shots on target",
      key: "shotsOnTarget",
    },
  ],

  STRIKERS: [
    {
      label: "Goals",
      key: "goals",
    },
    {
      label: "Assists",
      key: "assists",
    },
    {
      label: "Shots",
      key: "shots",
    },
    {
      label: "Shots on target",
      key: "shotsOnTarget",
    },
    {
      label: "Key passes",
      key: "keyPasses",
    },
    {
      label: "Dribbles",
      key: "successfulDribbles",
    },
  ],
};

const getRadarRawValue = (
  player,
  key
) => {
  const value =
    player?.advancedStats?.[key];

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return toNumber(value);
};

const percentileRank = (
  value,
  values
) => {
  if (
    value === null ||
    value === undefined ||
    !values.length
  ) {
    return null;
  }

  const sorted = [
    ...values,
  ].sort(
    (a, b) => a - b
  );

  if (
    sorted.length === 1
  ) {
    return 50;
  }

  const lower =
    sorted.filter(
      item =>
        item < value
    ).length;

  const equal =
    sorted.filter(
      item =>
        item === value
    ).length;

  if (
    lower === 0 &&
    equal === sorted.length
  ) {
    return 50;
  }

  const percentile =
    (
      (
        lower +
        (equal - 1) / 2
      ) /
      (sorted.length - 1)
    ) *
    100;

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(
        percentile
      )
    )
  );
};

const buildRadarStats = (
  player,
  players
) => {
  const definition =
    radarDefinitions[
      player.category
    ] ||
    radarDefinitions.STRIKERS;

  const labels = [];
  const values = [];

  const positionPlayers =
    players.filter(
      candidate =>
        candidate.category ===
          player.category &&
        toNumber(
          candidate.minutes
        ) > 0
    );

  const referencePlayers =
    positionPlayers.length
      ? positionPlayers
      : players.filter(
          candidate =>
            candidate.category ===
            player.category
        );

  for (
    const item of definition
  ) {
    const current =
      getRadarRawValue(
        player,
        item.key
      );

    const available =
      referencePlayers
        .map(candidate =>
          getRadarRawValue(
            candidate,
            item.key
          )
        )
        .filter(
          value =>
            value !== null
        );

    if (
      current === null ||
      !available.length
    ) {
      continue;
    }

    const percentile =
      percentileRank(
        current,
        available
      );

    if (
      percentile === null
    ) {
      continue;
    }

    labels.push(
      item.label
    );

    values.push(
      percentile
    );
  }

  return {
    labels,
    values,
  };
};

const buildRadarPercentiles = (
  player,
  players
) => {
  const positionPlayers =
    players.filter(
      candidate =>
        candidate.category ===
          player.category &&
        toNumber(
          candidate.minutes
        ) > 0
    );

  const referencePlayers =
    positionPlayers.length
      ? positionPlayers
      : players.filter(
          candidate =>
            candidate.category ===
            player.category
        );

  const keys = [
    ...new Set(
      Object.values(
        radarDefinitions
      )
        .flat()
        .map(
          item => item.key
        )
    ),
  ];

  const result = {};

  for (
    const key of keys
  ) {
    const current =
      getRadarRawValue(
        player,
        key
      );

    if (
      current === null
    ) {
      continue;
    }

    const available =
      referencePlayers
        .map(candidate =>
          getRadarRawValue(
            candidate,
            key
          )
        )
        .filter(
          value =>
            value !== null
        );

    if (
      !available.length
    ) {
      continue;
    }

    result[key] =
      percentileRank(
        current,
        available
      );
  }

  return result;
};

const buildFormMetrics =
  player => [
    {
      label: "Punkti",
      value: toNumber(
        player.flowPoints
      ),
    },
    {
      label: "Vārti",
      value: toNumber(
        player.goals
      ),
    },
    {
      label: "Assist",
      value: toNumber(
        player.assists
      ),
    },
    {
      label: "Spēles",
      value: toNumber(
        player.appearances
      ),
    },
  ];

/*
|--------------------------------------------------------------------------
| Create player
|--------------------------------------------------------------------------
*/

const createPlayer = (
  item,
  season,
  competition
) => {
  const player =
    item?.player || {};

  const aggregated =
    aggregatePlayerStats(
      item?.statistics
    );

  const category =
    getPositionCategory(
      aggregated.position ||
        player.position
    );

  if (
    !category ||
    player.id === null ||
    player.id === undefined
  ) {
    return null;
  }

  const penaltyGoals =
    category === "MIDFIELDERS" ||
    category === "STRIKERS"
      ? aggregated.penaltyGoals
      : null;

  const points =
    calculateFantasyPoints({
      category,

      appearances:
        aggregated.appearances,

      minutes:
        aggregated.minutes,

      goals:
        aggregated.goals,

      assists:
        aggregated.assists,

      penaltiesMissed:
        aggregated.penaltiesMissed,

      saves:
        aggregated.saves,

      goalsConceded:
        aggregated.goalsConceded,

      yellowCards:
        aggregated.yellowCards,

      redCards:
        aggregated.redCards,
    });

  const advancedStats =
    buildAdvancedStats(
      aggregated
    );

  return {
    id: player.id,

    name:
      player.name ||
      "Nezināms spēlētājs",

    teamId:
      aggregated.teamId,

    team:
      aggregated.team ||
      "Nezināms klubs",

    position:
      aggregated.position ||
      player.position ||
      "Unknown",

    positionLabel:
      getPositionLabel(
        category
      ),

    category,

    appearances:
      aggregated.appearances,

    minutes:
      aggregated.minutes,

    goals:
      aggregated.goals,

    assists:
      aggregated.assists,

    penalties:
      penaltyGoals,

    points,

    photo:
      player.photo || null,

    nationality:
      player.nationality ||
      null,

    injured:
      Boolean(
        player.injured
      ),

    age:
      player.age ?? null,

    height:
      player.height || null,

    weight:
      player.weight || null,

    birthDate:
      player.birth?.date ||
      null,

    birthPlace:
      player.birth?.place ||
      null,

    birthCountry:
      player.birth?.country ||
      null,

    number:
      player.number ?? null,

    teamLogo:
      aggregated.teamLogo ||
      null,

    advancedStats: {
      ...advancedStats,

      penaltyGoals,

      fplFallback: {
        appearances:
          aggregated.appearances,

        minutes:
          aggregated.minutes,

        goals:
          aggregated.goals,

        assists:
          aggregated.assists,

        penaltiesMissed:
          aggregated.penaltiesMissed,

        saves:
          aggregated.saves,

        goalsConceded:
          aggregated.goalsConceded,

        yellowCards:
          aggregated.yellowCards,

        redCards:
          aggregated.redCards,
      },
    },

    realStats: {
      appearances:
        aggregated.appearances,

      minutes:
        aggregated.minutes,

      goals:
        aggregated.goals,

      assists:
        aggregated.assists,

      penalties:
        penaltyGoals,

      yellowCards:
        aggregated.yellowCards,

      redCards:
        aggregated.redCards,
    },

    customStats: {},

    formMetrics: [],

    recentForm: [],

    league: competition,

    season: String(
      season
    ),
  };
};

/*
|--------------------------------------------------------------------------
| API-Football request
|--------------------------------------------------------------------------
*/


export {
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
};