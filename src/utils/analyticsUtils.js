const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

const categories = [
  ["ALL", "Visi"],
  ["GOALKEEPERS", "Vārtsargi"],
  ["DEFENDERS", "Aizsargi"],
  ["MIDFIELDERS", "Pussargi"],
  ["STRIKERS", "Uzbrucēji"],
];

const categoryLabel = category =>
  categories.find(
    item => item[0] === category
  )?.[1] || category;

const metricDefinitions = [
  {
    key: "goals",
    label: "Vārti",
    get: player => player.goals,
  },
  {
    key: "assists",
    label: "Assist",
    get: player => player.assists,
  },
  {
    key: "points",
    label: "Flow punkti",
    get: player => player.flowPoints,
  },
  {
    key: "minutes",
    label: "Minūtes",
    get: player => player.minutes,
  },
  {
    key: "rating",
    label: "Vidējais vērtējums",
    get: player =>
      player?.advancedStats?.rating,
  },
  {
    key: "keyPasses",
    label: "Key passes",
    get: player =>
      player?.advancedStats?.keyPasses,
  },
  {
    key: "tackles",
    label: "Tackles",
    get: player =>
      player?.advancedStats?.tackles,
  },
  {
    key: "interceptions",
    label: "Interceptions",
    get: player =>
      player?.advancedStats?.interceptions,
  },
  {
    key: "saves",
    label: "Saves",
    get: player =>
      player?.advancedStats?.saves,
  },
];

const getMetric = (
  player,
  key
) => {
  const definition =
    metricDefinitions.find(
      item => item.key === key
    );

  return definition
    ? number(
        definition.get(player)
      )
    : 0;
};

const normalize = (
  value,
  min,
  max
) => {
  if (max <= min) return 50;

  return (
    ((value - min) /
      (max - min)) *
    100
  );
};

// Heuristic recommendation score from 0 to 100.
// This is a normalized ranking score, not a probability or confidence percentage.
const weightedScore = (
  player,
  weights,
  pool
) => {
  const entries =
    Object.entries(weights).filter(
      ([, weight]) =>
        number(weight) > 0
    );

  if (!entries.length) return 0;

  let total = 0;
  let weightTotal = 0;

  entries.forEach(
    ([key, weight]) => {
      const values = pool.map(
        item =>
          getMetric(item, key)
      );

      const min = Math.min(
        ...values
      );
      const max = Math.max(
        ...values
      );

      total +=
        normalize(
          getMetric(
            player,
            key
          ),
          min,
          max
        ) *
        number(weight);

      weightTotal +=
        number(weight);
    }
  );

  return weightTotal > 0
    ? total / weightTotal
    : 0;
};
const formationPositions = {
  "4-3-3": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 25, y: 45 },
    { category: "MIDFIELDERS", x: 50, y: 40 },
    { category: "MIDFIELDERS", x: 75, y: 45 },
    { category: "STRIKERS", x: 18, y: 20 },
    { category: "STRIKERS", x: 50, y: 13 },
    { category: "STRIKERS", x: 82, y: 20 },
  ],
  "4-4-2": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 14, y: 44 },
    { category: "MIDFIELDERS", x: 38, y: 42 },
    { category: "MIDFIELDERS", x: 62, y: 42 },
    { category: "MIDFIELDERS", x: 86, y: 44 },
    { category: "STRIKERS", x: 37, y: 18 },
    { category: "STRIKERS", x: 63, y: 18 },
  ],
  "3-4-3": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 25, y: 67 },
    { category: "DEFENDERS", x: 50, y: 67 },
    { category: "DEFENDERS", x: 75, y: 67 },
    { category: "MIDFIELDERS", x: 12, y: 44 },
    { category: "MIDFIELDERS", x: 38, y: 42 },
    { category: "MIDFIELDERS", x: 62, y: 42 },
    { category: "MIDFIELDERS", x: 88, y: 44 },
    { category: "STRIKERS", x: 18, y: 20 },
    { category: "STRIKERS", x: 50, y: 13 },
    { category: "STRIKERS", x: 82, y: 20 },
  ],
  "3-5-2": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 25, y: 67 },
    { category: "DEFENDERS", x: 50, y: 67 },
    { category: "DEFENDERS", x: 75, y: 67 },
    { category: "MIDFIELDERS", x: 10, y: 45 },
    { category: "MIDFIELDERS", x: 30, y: 40 },
    { category: "MIDFIELDERS", x: 50, y: 45 },
    { category: "MIDFIELDERS", x: 70, y: 40 },
    { category: "MIDFIELDERS", x: 90, y: 45 },
    { category: "STRIKERS", x: 37, y: 18 },
    { category: "STRIKERS", x: 63, y: 18 },
  ],
  "4-2-3-1": [
    { category: "GOALKEEPERS", x: 50, y: 88 },
    { category: "DEFENDERS", x: 16, y: 67 },
    { category: "DEFENDERS", x: 38, y: 67 },
    { category: "DEFENDERS", x: 62, y: 67 },
    { category: "DEFENDERS", x: 84, y: 67 },
    { category: "MIDFIELDERS", x: 38, y: 48 },
    { category: "MIDFIELDERS", x: 62, y: 48 },
    { category: "MIDFIELDERS", x: 22, y: 30 },
    { category: "MIDFIELDERS", x: 50, y: 30 },
    { category: "MIDFIELDERS", x: 78, y: 30 },
    { category: "STRIKERS", x: 50, y: 13 },
  ],
};

const formationNames = Object.keys(formationPositions);

const categoryShortLabel = {
  ALL: "Spēlētājs",
  GOALKEEPERS: "Vārtsargs",
  DEFENDERS: "Aizsargs",
  MIDFIELDERS: "Pussargs",
  STRIKERS: "Uzbrucējs",
};

const positionColor = {
  GOALKEEPERS: "bg-amber-400",
  DEFENDERS: "bg-sky-500",
  MIDFIELDERS: "bg-emerald-500",
  STRIKERS: "bg-rose-500",
};

const toFiniteNumber = value => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const playerRecentForm = player => {
  const raw = Array.isArray(player?.recentForm)
    ? player.recentForm
    : [];

  const values = raw
    .map(item => {
      if (typeof item === "number") return item;
      return toFiniteNumber(
        item?.value ?? item?.flowPoints ?? item?.points ?? item?.score
      );
    })
    .filter(value => Number.isFinite(value));

  if (values.length) return values;

  const formMetrics = Array.isArray(player?.formMetrics)
    ? player.formMetrics
    : [];

  const points = formMetrics.find(
    item => String(item?.label || "").toLowerCase() === "punkti"
  );

  const appearances = toFiniteNumber(player?.appearances);
  const seasonPoints = toFiniteNumber(points?.value ?? player?.flowPoints);

  return appearances > 0
    ? [seasonPoints / appearances]
    : seasonPoints > 0
      ? [seasonPoints]
      : [];
};

// Heuristic Gameweek projection based on recent form and available player data.
// This is an estimate, not an official FPL prediction or probability.
const getProjectedPoints = player => {
  const values = playerRecentForm(player);

  if (values.length) {
    return Math.max(
      0,
      values.reduce((sum, value) => sum + value, 0) / values.length
    );
  }

  const appearances = toFiniteNumber(player?.appearances);
  const points = toFiniteNumber(player?.flowPoints);

  return appearances > 0 ? Math.max(0, points / appearances) : Math.max(0, points);
};

const getFormAverage = player => getProjectedPoints(player);

const getFormStatus = player => {
  const form = getFormAverage(player);

  if (form >= 8) return { label: "🔥 Karsta forma", tone: "text-orange-600 bg-orange-50 border-orange-200" };
  if (form >= 6) return { label: "🟢 Laba forma", tone: "text-emerald-700 bg-emerald-50 border-emerald-200" };
  if (form >= 4) return { label: "🟡 Vidēja forma", tone: "text-amber-700 bg-amber-50 border-amber-200" };
  return { label: "🔴 Vāja forma", tone: "text-rose-700 bg-rose-50 border-rose-200" };
};

const getFlowValue = player => {
  const positionBase = {
    GOALKEEPERS: 4.5,
    DEFENDERS: 5.0,
    MIDFIELDERS: 7.0,
    STRIKERS: 8.0,
  }[player?.category] || 6;

  const form = getFormAverage(player);
  const rating = toFiniteNumber(player?.advancedStats?.rating);
  const minutes = toFiniteNumber(player?.minutes);
  const appearances = toFiniteNumber(player?.appearances);
  const goals = toFiniteNumber(player?.goals);
  const assists = toFiniteNumber(player?.assists);

  const reliability = Math.min(3, appearances / 8);
  const attacking = Math.min(6, goals * 0.35 + assists * 0.2);
  const ratingBonus = Math.max(0, rating - 6.5) * 1.5;
  const formBonus = Math.min(4, form * 0.25);
  const minutesBonus = Math.min(3, minutes / 600);

  return Math.round(
    (positionBase + reliability + attacking + ratingBonus + formBonus + minutesBonus) * 10
  ) / 10;
};

const getBudgetPrice = player => {
  const value = getFlowValue(player);
  return Math.round(value * 10) / 10;
};

const getPositionStrength = (players, category) => {
  const values = players
    .filter(player => player?.category === category)
    .map(player => getProjectedPoints(player));

  if (!values.length) return 0;

  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.min(100, Math.round(average * 10));
};

const sortByProjection = players =>
  [...players].sort((a, b) => getProjectedPoints(b) - getProjectedPoints(a));

const getBestForCategory = (players, category, excluded = new Set()) =>
  sortByProjection(
    players.filter(
      player =>
        player?.category === category &&
        !excluded.has(String(player.id))
    )
  )[0] || null;

const getFormattedFixtureDate = fixture => {
  const date = fixture?.fixture?.date;
  if (!date) return "";

  try {
    return new Intl.DateTimeFormat("lv-LV", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return String(date);
  }
};

const normalizeTeamName = value =>
  String(value || "")
    .toLowerCase()
    .replace(/\bfc\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const resolvePlayerTeam = (player, standings = []) => {
  if (!player) return player;

  const existingId = Number(
    player?.teamId ?? player?.team?.id
  );

  if (Number.isInteger(existingId) && existingId > 0) {
    return player;
  }

  const rows = Array.isArray(standings) ? standings : [];
  const playerTeam = normalizeTeamName(player?.team);

  if (!playerTeam) return player;

  const exact = rows.find(row =>
    normalizeTeamName(row?.team?.name || row?.name) === playerTeam
  );

  if (exact) {
    const teamId = Number(exact?.team?.id ?? exact?.id);
    if (Number.isInteger(teamId) && teamId > 0) {
      return { ...player, teamId };
    }
  }

  const partial = rows.find(row => {
    const name = normalizeTeamName(row?.team?.name || row?.name);
    return name && (name.includes(playerTeam) || playerTeam.includes(name));
  });

  if (partial) {
    const teamId = Number(partial?.team?.id ?? partial?.id);
    if (Number.isInteger(teamId) && teamId > 0) {
      return { ...player, teamId };
    }
  }

  return player;
};

const getFixtureForTeam = (player, fixtures) => {
  const teamId = Number(player?.teamId);
  if (!teamId) return null;

  const upcoming = Array.isArray(fixtures?.upcoming)
    ? fixtures.upcoming
    : [];

  return (
    upcoming.find(fixture => {
      const homeId = Number(fixture?.teams?.home?.id);
      const awayId = Number(fixture?.teams?.away?.id);
      return homeId === teamId || awayId === teamId;
    }) || null
  );
};

const getFixtureOpponent = (player, fixture) => {
  if (!fixture) return null;

  const teamId = Number(player?.teamId);
  const home = fixture?.teams?.home;
  const away = fixture?.teams?.away;

  if (Number(home?.id) === teamId) {
    return {
      name: away?.name || "Nezināms",
      logo: away?.logo || null,
      isHome: true,
      venue: fixture?.fixture?.venue?.name || null,
    };
  }

  if (Number(away?.id) === teamId) {
    return {
      name: home?.name || "Nezināms",
      logo: home?.logo || null,
      isHome: false,
      venue: fixture?.fixture?.venue?.name || null,
    };
  }

  return null;
};

const getDifficulty = (player, fixture, standings) => {
  const opponent = getFixtureOpponent(player, fixture);
  if (!opponent) return { score: 3, label: "Vidēja", tone: "bg-amber-50 text-amber-700 border-amber-200" };

  const safeStandings = Array.isArray(standings) ? standings : [];
  const row = safeStandings.find(
    item => Number(item?.team?.id) === Number(
      fixture?.teams?.home?.id === player?.teamId
        ? fixture?.teams?.away?.id
        : fixture?.teams?.home?.id
    )
  );

  const position = Number(row?.position);

  if (!position) return { score: 3, label: "Vidēja", tone: "bg-amber-50 text-amber-700 border-amber-200" };

  const totalTeams = Math.max(standings.length, 20);
  const ratio = position / totalTeams;
  const score = ratio <= 0.2 ? 5 : ratio <= 0.4 ? 4 : ratio <= 0.65 ? 3 : ratio <= 0.82 ? 2 : 1;

  const labels = {
    1: "Ļoti viegla",
    2: "Viegla",
    3: "Vidēja",
    4: "Grūta",
    5: "Ļoti grūta",
  };

  const tones = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200",
    2: "bg-lime-50 text-lime-700 border-lime-200",
    3: "bg-amber-50 text-amber-700 border-amber-200",
    4: "bg-orange-50 text-orange-700 border-orange-200",
    5: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return {
    score,
    label: labels[score],
    tone: tones[score],
    opponentPosition: position,
  };
};

const getDifferentialScore = (player, players) => {
  const categoryPlayers = players.filter(
    candidate => candidate.category === player.category
  );

  if (!categoryPlayers.length) return 0;

  const sorted = sortByProjection(categoryPlayers);
  const rank = sorted.findIndex(
    candidate => String(candidate.id) === String(player.id)
  );

  const rankBonus = Math.max(0, 20 - rank * 1.5);
  const formBonus = Math.min(15, getFormAverage(player) * 1.5);
  const minutesBonus = Math.min(10, toFiniteNumber(player.minutes) / 120);

  return Math.round((rankBonus + formBonus + minutesBonus) * 10) / 10;
};

const getStatusForPlayer = player => {
  if (player?.injured) {
    return {
      label: "⚠️ Traumas risks",
      tone: "bg-rose-50 text-rose-700 border-rose-200",
    };
  }

  const minutes = toFiniteNumber(player?.minutes);
  const appearances = toFiniteNumber(player?.appearances);

  if (appearances > 0 && minutes / appearances >= 70) {
    return {
      label: "🟢 Regulārs starteris",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
    };
  }

  return {
    label: "🟡 Spēles laiks jāpārbauda",
    tone: "bg-amber-50 text-amber-700 border-amber-200",
  };
};


export {
  number,
  categories,
  categoryLabel,
  metricDefinitions,
  getMetric,
  normalize,
  weightedScore,
  formationPositions,
  formationNames,
  categoryShortLabel,
  positionColor,
  toFiniteNumber,
  playerRecentForm,
  getProjectedPoints,
  getFormAverage,
  getFormStatus,
  getFlowValue,
  getBudgetPrice,
  getPositionStrength,
  sortByProjection,
  getBestForCategory,
  getFormattedFixtureDate,
  normalizeTeamName,
  resolvePlayerTeam,
  getFixtureForTeam,
  getFixtureOpponent,
  getDifficulty,
  getDifferentialScore,
  getStatusForPlayer,
};