/*
 * Satur Flow lietotnes pamatkonfigurāciju: pieejamās līgas, spēlētāju
 * kategorijas, radara statistiku, noklusējuma iestatījumus un lietotnes
 * informāciju, kā arī palīgfunkcijas līgu un kategoriju datu iegūšanai.
 */

export const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

export const LEAGUES = [
  ["PL", "Premier League"],
  ["PD", "La Liga"],
  ["SA", "Serie A"],
  ["BL1", "Bundesliga"],
  ["FL1", "Ligue 1"],
];

export const LEAGUE_OPTIONS = LEAGUES.map(
  ([code, name]) => ({
    code,
    name,
  })
);

export const CATEGORIES = {
  STRIKERS: {
    name: "Uzbrucēji",
    title: "Uzbrucēji",
    icon: "⚡",
    color: "rose",
    accent: "rose",
    desc:
      "Finisēšana, vārtu iesaiste un uzbrukuma produktivitāte.",
    description:
      "Finisēšana, vārtu iesaiste un uzbrukuma produktivitāte.",
    tag: "Uzbrukuma produktivitāte",
    shortDescription:
      "Uzbrukuma produktivitāte",
  },

  MIDFIELDERS: {
    name: "Pussargi",
    title: "Pussargi",
    icon: "◈",
    color: "emerald",
    accent: "emerald",
    desc:
      "Radošums, progresija un iesaiste vārtu guvumos.",
    description:
      "Radošums, progresija un iesaiste vārtu guvumos.",
    tag: "Radošums un progresija",
    shortDescription:
      "Radošums un progresija",
  },

  DEFENDERS: {
    name: "Aizsargi",
    title: "Aizsargi",
    icon: "◆",
    color: "blue",
    accent: "blue",
    desc:
      "Aizsardzības stabilitāte, spēles kontrole un clean sheets.",
    description:
      "Aizsardzības stabilitāte, spēles kontrole un clean sheets.",
    tag: "Aizsardzības stabilitāte",
    shortDescription:
      "Aizsardzības stabilitāte",
  },

  GOALKEEPERS: {
    name: "Vārtsargi",
    title: "Vārtsargi",
    icon: "◉",
    color: "amber",
    accent: "amber",
    desc:
      "Atvairījumi, clean sheets un stabilitāte vārtos.",
    description:
      "Atvairījumi, clean sheets un stabilitāte vārtos.",
    tag: "Vārtu drošība",
    shortDescription:
      "Vārtu drošība",
  },
};

export const CATEGORY_ORDER = [
  "STRIKERS",
  "MIDFIELDERS",
  "DEFENDERS",
  "GOALKEEPERS",
];

export const CATEGORY_NAMES = {
  GOALKEEPERS: "VĀRTSARGI",
  DEFENDERS: "AIZSARGI",
  MIDFIELDERS: "PUSSARGI",
  STRIKERS: "UZBRUCĒJI",
};

export const CATEGORY_LABELS = {
  GOALKEEPERS: "Vārtsargi",
  DEFENDERS: "Aizsargi",
  MIDFIELDERS: "Pussargi",
  STRIKERS: "Uzbrucēji",
};

export const RADAR_STATS = [
  {
    key: "goals",
    label: "Vārti",
  },
  {
    key: "assists",
    label: "Assist",
  },
  {
    key: "points",
    label: "Punkti",
  },
  {
    key: "appearances",
    label: "Spēles",
  },
  {
    key: "cleanSheets",
    label: "Clean sheets",
  },
  {
    key: "experience",
    label: "Pieredze",
  },
];

export const STORAGE_KEYS = {
  username: "radars_username",
  avatar: "radars_avatar",
  favorites: "flow_favorite_players",
};

export const DEFAULT_SEASON =
  "2026/2027";

export const DEFAULT_LEAGUE = "PL";

export const DEFAULT_FDR = 3;

export const DATA_SOURCE =
  "football-data.org";

export const APP_NAME = "Flow";

export const APP_DESCRIPTION =
  "Spēlētāju salīdzināšanas platforma";

export function getLeagueName(
  leagueCode
) {
  return (
    LEAGUES.find(
      ([code]) => code === leagueCode
    )?.[1] || leagueCode
  );
}

export function getCategoryInfo(
  category
) {
  return (
    CATEGORIES[category] || null
  );
}

export function getCategoryName(
  category
) {
  return (
    CATEGORIES[category]?.name ||
    category
  );
}

export function getCategoryColor(
  category
) {
  return (
    CATEGORIES[category]?.color ||
    "emerald"
  );
}

export function isValidLeague(
  league
) {
  return LEAGUES.some(
    ([code]) => code === league
  );
}

export function isValidCategory(
  category
) {
  return CATEGORY_ORDER.includes(
    category
  );
}