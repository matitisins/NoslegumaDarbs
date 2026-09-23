/*
 * Satur spēlētāju pozīciju klasifikācijas, Flow punktu un statistikas
 * aprēķināšanas palīgfunkcijas. Normalizē spēlētāju datus no API,
 * sadala spēlētājus pozīciju kategorijās un sagatavo tos lietotnes
 * statistikas, formas un salīdzināšanas komponentēm.
 */

const POSITION_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

const toNumber = value => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

export const getPositionCategory = position => {
  const value = String(position || "")
    .toLowerCase()
    .trim();

  if (
    value.includes("goalkeeper") ||
    value.includes("keeper") ||
    value === "gk"
  ) {
    return "GOALKEEPERS";
  }

  if (
    value.includes("defence") ||
    value.includes("defender") ||
    value.includes("back") ||
    value.includes("centre-back") ||
    value.includes("center-back")
  ) {
    return "DEFENDERS";
  }

  if (
    value.includes("midfield") ||
    value.includes("midfielder")
  ) {
    return "MIDFIELDERS";
  }

  if (
    value.includes("offence") ||
    value.includes("offense") ||
    value.includes("forward") ||
    value.includes("striker") ||
    value.includes("attacker") ||
    value.includes("winger")
  ) {
    return "STRIKERS";
  }

  return null;
};

export const getPositionLabel = category =>
  POSITION_LABELS[category] || "Spēlētājs";

export const calculateFantasyPoints = ({
  category,
  goals = 0,
  assists = 0,
  penalties = 0,
}) => {
  const goalPoints = {
    GOALKEEPERS: 10,
    DEFENDERS: 6,
    MIDFIELDERS: 5,
    STRIKERS: 4,
  };

  return Math.max(
    0,
    Math.round(
      toNumber(goals) * (goalPoints[category] || 4) +
        toNumber(assists) * 3 +
        toNumber(penalties) * 2
    )
  );
};

const relative = (value, max) =>
  Math.round((toNumber(value) / Math.max(1, max)) * 100);

export const buildRadarStats = (player, players = []) => {
  const max = key =>
    Math.max(1, ...players.map(item => toNumber(item[key])));

  return {
    goals: relative(player.goals, max("goals")),
    assists: relative(player.assists, max("assists")),
    points: relative(player.points, max("points")),
    appearances: relative(
      player.appearances,
      max("appearances")
    ),

    cleanSheets: 0,
    discipline: 100,
    experience: relative(
      player.appearances,
      max("appearances")
    ),
  };
};

export const buildFormMetrics = (player, players = []) => {
  const maxPoints = Math.max(
    1,
    ...players.map(item => toNumber(item.points))
  );

  const maxGoals = Math.max(
    1,
    ...players.map(item => toNumber(item.goals))
  );

  const maxAssists = Math.max(
    1,
    ...players.map(item => toNumber(item.assists))
  );

  return [
    {
      label: "Punkti",
      value: relative(player.points, maxPoints),
    },
    {
      label: "Vārti",
      value: relative(player.goals, maxGoals),
    },
    {
      label: "Assist",
      value: relative(player.assists, maxAssists),
    },
  ];
};

const playerObject = ({
  player = {},
  team = {},
  scorer = {},
}) => {
  const category = getPositionCategory(player.position);

  const goals = toNumber(scorer.goals);
  const assists = toNumber(scorer.assists);
  const penalties = toNumber(scorer.penalties);
  const appearances = toNumber(scorer.playedMatches);

  return {
    id: player.id,
    name: player.name || "Nezināms spēlētājs",

    teamId: team.id || null,
    team: team.name || "Nezināms klubs",

    position: player.position || "Unknown",
    positionLabel: getPositionLabel(category),
    category,

    goals,
    assists,
    penalties,
    appearances,

    minutes: null,
    cleanSheets: null,
    yellowCards: null,
    redCards: null,

    points: calculateFantasyPoints({
      category,
      goals,
      assists,
      penalties,
    }),

    photo:
      player.image ||
      player.photo ||
      null,

    realStats: {
      appearances,
      goals,
      assists,
      penalties,
      minutes: null,
      cleanSheets: null,
      yellowCards: null,
      redCards: null,
    },

    customStats: {},
    formMetrics: [],
    recentForm: [],
  };
};

export const normalizePlayers = (
  teams = [],
  scorers = []
) => {
  const scorerMap = new Map(
    scorers.map(item => [
      String(item?.player?.id),
      item,
    ])
  );

  const players = [];
  const ids = new Set();

  for (const team of teams) {
    const squad = Array.isArray(team.squad)
      ? team.squad
      : [];

    for (const player of squad) {
      if (player?.id == null) continue;

      const category = getPositionCategory(
        player.position
      );

      if (!category) continue;

      const scorer =
        scorerMap.get(String(player.id)) || {};

      const normalized = playerObject({
        player,
        team,
        scorer,
      });

      ids.add(String(player.id));
      players.push(normalized);
    }
  }

  /*
   * Fallback:
   * if the teams endpoint contains no squad
   * data, use the scorer endpoint.
   */
  if (!players.length) {
    for (const item of scorers) {
      const player = item?.player || {};
      const team = item?.team || {};

      if (
        player.id == null ||
        ids.has(String(player.id))
      ) {
        continue;
      }

      const category = getPositionCategory(
        player.position
      );

      if (!category) continue;

      const normalized = playerObject({
        player,
        team,
        scorer: item,
      });

      ids.add(String(player.id));
      players.push(normalized);
    }
  }

  return players.map(player => ({
    ...player,

    customStats: buildRadarStats(
      player,
      players
    ),

    formMetrics: buildFormMetrics(
      player,
      players
    ),
  }));
};

export { POSITION_LABELS };