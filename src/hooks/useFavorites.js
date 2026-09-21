import {
  useCallback,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY =
  "flow_favorite_players";

export default function useFavorites(
  players = []
) {
  const [favoriteIds, setFavoriteIds] =
    useState(() => {
      try {
        const saved =
          localStorage.getItem(
            STORAGE_KEY
          );

        if (!saved) {
          return [];
        }

        const parsed =
          JSON.parse(saved);

        return Array.isArray(parsed)
          ? parsed
          : [];
      } catch (error) {
        console.error(
          "Neizdevās ielādēt favorītus:",
          error
        );

        return [];
      }
    });

  const persistFavorites =
    useCallback(ids => {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(ids)
        );
      } catch (error) {
        console.error(
          "Neizdevās saglabāt favorītus:",
          error
        );
      }
    }, []);

  const isFavorite =
    useCallback(
      player => {
        if (!player?.id) {
          return false;
        }

        return favoriteIds.some(
          id =>
            String(id) ===
            String(player.id)
        );
      },
      [favoriteIds]
    );

  const toggleFavorite =
    useCallback(
      player => {
        if (!player?.id) {
          return;
        }

        setFavoriteIds(current => {
          const exists =
            current.some(
              id =>
                String(id) ===
                String(player.id)
            );

          const next = exists
            ? current.filter(
                id =>
                  String(id) !==
                  String(player.id)
              )
            : [
                ...current,
                player.id,
              ];

          persistFavorites(next);

          return next;
        });
      },
      [persistFavorites]
    );

  const addFavorite =
    useCallback(
      player => {
        if (!player?.id) {
          return;
        }

        setFavoriteIds(current => {
          const exists =
            current.some(
              id =>
                String(id) ===
                String(player.id)
            );

          if (exists) {
            return current;
          }

          const next = [
            ...current,
            player.id,
          ];

          persistFavorites(next);

          return next;
        });
      },
      [persistFavorites]
    );

  const removeFavorite =
    useCallback(
      player => {
        if (!player?.id) {
          return;
        }

        setFavoriteIds(current => {
          const next =
            current.filter(
              id =>
                String(id) !==
                String(player.id)
            );

          persistFavorites(next);

          return next;
        });
      },
      [persistFavorites]
    );

  const clearFavorites =
    useCallback(() => {
      setFavoriteIds([]);

      try {
        localStorage.removeItem(
          STORAGE_KEY
        );
      } catch (error) {
        console.error(
          "Neizdevās notīrīt favorītus:",
          error
        );
      }
    }, []);

  const favorites = useMemo(() => {
    if (!Array.isArray(players)) {
      return [];
    }

    return players.filter(player =>
      favoriteIds.some(
        id =>
          String(id) ===
          String(player.id)
      )
    );
  }, [players, favoriteIds]);

  return {
    favoriteIds,
    setFavoriteIds,

    favorites,

    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
    clearFavorites,

    favoriteCount:
      favorites.length,
  };
}