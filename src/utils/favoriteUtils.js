const FAVORITES_STORAGE_KEY = "flow_favorite_players";
const FAVORITE_PLAYERS_STORAGE_KEY = "flow_favorite_player_data";

const normalizeFavoriteId = value => {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = String(value).trim();

  return normalized;
};

const sanitizeFavoriteIds = value => {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value
        .map(normalizeFavoriteId)
        .filter(Boolean)
    ),
  ];
};

const sanitizeFavoritePlayers = value => {
  if (!Array.isArray(value)) {
    return [];
  }

  const playersById = new Map();

  value.forEach(player => {
    if (!player || typeof player !== "object") {
      return;
    }

    const id = normalizeFavoriteId(player.id ?? player.playerId ?? player.player_id ?? player.player?.id ?? player.player?.playerId);

    if (!id) {
      return;
    }

    playersById.set(id, {
      ...player,
      id,
    });
  });

  return [...playersById.values()];
};

const readFavoriteIds = (storage = localStorage) => {
  try {
    const stored = storage.getItem(FAVORITES_STORAGE_KEY);

    if (!stored) {
      return [];
    }

    return sanitizeFavoriteIds(JSON.parse(stored));
  } catch (error) {
    console.error(
      "Neizdevās nolasīt iecienīto spēlētāju sarakstu:",
      error
    );
    return [];
  }
};

const writeFavoriteIds = (
  favoriteIds,
  storage = localStorage
) => {
  const sanitizedIds = sanitizeFavoriteIds(favoriteIds);

  try {
    storage.setItem(
      FAVORITES_STORAGE_KEY,
      JSON.stringify(sanitizedIds)
    );

    return true;
  } catch (error) {
    console.error(
      "Neizdevās saglabāt iecienītos spēlētājus:",
      error
    );
    return false;
  }
};

const readFavoritePlayers = (storage = localStorage) => {
  try {
    const stored = storage.getItem(
      FAVORITE_PLAYERS_STORAGE_KEY
    );

    if (!stored) {
      return [];
    }

    return sanitizeFavoritePlayers(JSON.parse(stored));
  } catch (error) {
    console.error(
      "Neizdevās nolasīt iecienīto spēlētāju datus:",
      error
    );
    return [];
  }
};

const writeFavoritePlayers = (
  favoritePlayers,
  storage = localStorage
) => {
  const sanitizedPlayers =
    sanitizeFavoritePlayers(favoritePlayers);

  try {
    storage.setItem(
      FAVORITE_PLAYERS_STORAGE_KEY,
      JSON.stringify(sanitizedPlayers)
    );

    return true;
  } catch (error) {
    console.error(
      "Neizdevās saglabāt iecienīto spēlētāju datus:",
      error
    );
    return false;
  }
};

const isFavoriteId = (favoriteIds, playerId) => {
  const normalizedPlayerId =
    normalizeFavoriteId(playerId);

  if (!normalizedPlayerId) {
    return false;
  }

  return sanitizeFavoriteIds(favoriteIds).includes(
    normalizedPlayerId
  );
};

const toggleFavoriteId = (
  favoriteIds,
  playerId
) => {
  const normalizedPlayerId =
    normalizeFavoriteId(playerId);

  if (!normalizedPlayerId) {
    return sanitizeFavoriteIds(favoriteIds);
  }

  const currentIds =
    sanitizeFavoriteIds(favoriteIds);

  const exists =
    currentIds.includes(normalizedPlayerId);

  return exists
    ? currentIds.filter(
        id => id !== normalizedPlayerId
      )
    : [...currentIds, normalizedPlayerId];
};

const upsertFavoritePlayer = (
  favoritePlayers,
  player,
  metadata = {}
) => {
  const sanitizedPlayers =
    sanitizeFavoritePlayers(favoritePlayers);

  if (!player || typeof player !== "object") {
    return sanitizedPlayers;
  }

  const id = normalizeFavoriteId(player.id ?? player.playerId ?? player.player_id ?? player.player?.id ?? player.player?.playerId);

  if (!id) {
    return sanitizedPlayers;
  }

  const nextPlayer = {
    ...player,
    id,
    ...metadata,
  };

  const existingIndex =
    sanitizedPlayers.findIndex(
      item => normalizeFavoriteId(item.id) === id
    );

  if (existingIndex === -1) {
    return [...sanitizedPlayers, nextPlayer];
  }

  return sanitizedPlayers.map(
    (item, index) =>
      index === existingIndex
        ? {
            ...item,
            ...nextPlayer,
          }
        : item
  );
};

const removeFavoritePlayer = (
  favoritePlayers,
  playerId
) => {
  const normalizedPlayerId =
    normalizeFavoriteId(playerId);

  if (!normalizedPlayerId) {
    return sanitizeFavoritePlayers(
      favoritePlayers
    );
  }

  return sanitizeFavoritePlayers(
    favoritePlayers
  ).filter(
    player =>
      normalizeFavoriteId(player.id) !==
      normalizedPlayerId
  );
};

export {
  FAVORITES_STORAGE_KEY,
  FAVORITE_PLAYERS_STORAGE_KEY,
  normalizeFavoriteId,
  sanitizeFavoriteIds,
  sanitizeFavoritePlayers,
  readFavoriteIds,
  writeFavoriteIds,
  readFavoritePlayers,
  writeFavoritePlayers,
  isFavoriteId,
  toggleFavoriteId,
  upsertFavoritePlayer,
  removeFavoritePlayer,
};