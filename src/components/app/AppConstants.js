const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const MAX_STORED_AVATAR_BYTES = 900 * 1024;
const MAX_AVATAR_DIMENSION = 512;
const ALLOWED_AVATAR_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const LEAGUES = [
  ["PL", "Premier League"],
  ["PD", "La Liga"],
  ["SA", "Serie A"],
  ["BL1", "Bundesliga"],
  ["FL1", "Ligue 1"],
];

const CATEGORIES = {
  STRIKERS: {
    name: "Uzbrucēji",
    icon: "⚡",
    color: "rose",
    desc: "Finisēšana, vārtu iesaiste un uzbrukuma produktivitāte.",
    tag: "Uzbrukuma produktivitāte",
  },
  MIDFIELDERS: {
    name: "Pussargi",
    icon: "◈",
    color: "emerald",
    desc: "Radošums, progresija un iesaiste vārtu guvumos.",
    tag: "Radošums un kontrole",
  },
  DEFENDERS: {
    name: "Aizsargi",
    icon: "◆",
    color: "blue",
    desc: "Uzticamība, vārtu draudi un iespēju veidošana.",
    tag: "Aizsardzība un stabilitāte",
  },
  GOALKEEPERS: {
    name: "Vārtsargi",
    icon: "⬢",
    color: "amber",
    desc: "Stabilitāte, pieredze un ietekme uz rezultātu.",
    tag: "Stabilitāte un pieredze",
  },
};

const CATEGORY_ORDER = [
  "STRIKERS",
  "MIDFIELDERS",
  "DEFENDERS",
  "GOALKEEPERS",
];

const formatBytes = bytes => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );

  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const saveLocalStorageValue = (key, value) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (storageError) {
    console.error(`Neizdevās saglabāt ${key}:`, storageError);
    return false;
  }
};

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export {
  DEFAULT_AVATAR,
  MAX_AVATAR_SIZE_BYTES,
  MAX_STORED_AVATAR_BYTES,
  MAX_AVATAR_DIMENSION,
  ALLOWED_AVATAR_TYPES,
  LEAGUES,
  CATEGORIES,
  CATEGORY_ORDER,
  formatBytes,
  saveLocalStorageValue,
  normalize,
};