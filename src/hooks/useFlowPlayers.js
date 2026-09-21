import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  COMPETITION_IDS,
  fetchApiSportsPlayers,
  getTeamFdr,
  seasonToApiSeason,
  clearFootballDataCache,
} from "../services/apiSports";

import {
  DEFAULT_LEAGUE,
  DEFAULT_SEASON,
  DEFAULT_FDR,
  CATEGORY_ORDER,
} from "../config/flow";

const normalizeSearch = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export default function useFlowPlayers({
  selectedLeague = DEFAULT_LEAGUE,
  selectedSeason = DEFAULT_SEASON,
} = {}) {
  const [leaguePlayers, setLeaguePlayers] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [progress, setProgress] =
    useState({
      current: 0,
      total: 0,
    });

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [player1, setPlayer1] =
    useState(null);

  const [player2, setPlayer2] =
    useState(null);

  const [playerSearch1, setPlayerSearch1] =
    useState("");

  const [playerSearch2, setPlayerSearch2] =
    useState("");

  const [fdr1, setFdr1] =
    useState(DEFAULT_FDR);

  const [fdr2, setFdr2] =
    useState(DEFAULT_FDR);

  const [fdrLoading, setFdrLoading] =
    useState(false);

  const apiSeason =
    seasonToApiSeason(
      selectedSeason
    );

  /*
   * Players in the selected category.
   */
  const categoryPlayers =
    useMemo(() => {
      if (!selectedCategory) {
        return [];
      }

      return leaguePlayers.filter(
        player =>
          player.category ===
          selectedCategory
      );
    }, [
      leaguePlayers,
      selectedCategory,
    ]);

  /*
   * Categories that actually have players.
   */
  const categories =
    useMemo(() => {
      return CATEGORY_ORDER.filter(
        category =>
          leaguePlayers.some(
            player =>
              player.category ===
              category
          )
      );
    }, [leaguePlayers]);

  const totalPlayers =
    leaguePlayers.length;

  /*
   * Search.
   */
  const searchPlayers =
    useCallback(
      (players, searchText) => {
        const query =
          normalizeSearch(
            searchText
          );

        if (!query) {
          return [];
        }

        return players.filter(
          player => {
            const name =
              normalizeSearch(
                player.name
              );

            const team =
              normalizeSearch(
                player.team
              );

            return (
              name.includes(query) ||
              team.includes(query)
            );
          }
        );
      },
      []
    );

  const filteredPlayers1 =
    useMemo(
      () =>
        searchPlayers(
          categoryPlayers,
          playerSearch1
        ),
      [
        categoryPlayers,
        playerSearch1,
        searchPlayers,
      ]
    );

  const filteredPlayers2 =
    useMemo(
      () =>
        searchPlayers(
          categoryPlayers,
          playerSearch2
        ),
      [
        categoryPlayers,
        playerSearch2,
        searchPlayers,
      ]
    );

  /*
   * Reset comparison.
   */
  const resetPlayers =
    useCallback(() => {
      setSelectedCategory(null);

      setPlayer1(null);
      setPlayer2(null);

      setPlayerSearch1("");
      setPlayerSearch2("");

      setFdr1(DEFAULT_FDR);
      setFdr2(DEFAULT_FDR);
    }, []);

  /*
   * Load API data.
   */
  const loadPlayers =
    useCallback(
      async (
        forceRefresh = false
      ) => {
        setLoading(true);
        setError("");

        setProgress({
          current: 0,
          total: 1,
        });

        try {
          const competition =
            COMPETITION_IDS[
              selectedLeague
            ] ||
            selectedLeague;

          console.log(
            "Flow: loading players",
            {
              competition,
              season: apiSeason,
            }
          );

          const players =
            await fetchApiSportsPlayers(
              competition,
              apiSeason,
              {
                forceRefresh,

                onProgress:
                  setProgress,
              }
            );

          if (
            !Array.isArray(players)
          ) {
            throw new Error(
              "API neatgrieza derīgu spēlētāju sarakstu."
            );
          }

          console.log(
            `Flow: received ${players.length} players`
          );

          setLeaguePlayers(
            players
          );

          setProgress({
            current: 1,
            total: 1,
          });

          return players;
        } catch (loadError) {
          console.error(
            "Flow player loading error:",
            loadError
          );

          setLeaguePlayers([]);

          setError(
            loadError?.message ||
              "Neizdevās ielādēt datus no API."
          );

          return [];
        } finally {
          setLoading(false);
        }
      },
      [
        selectedLeague,
        apiSeason,
      ]
    );

  /*
   * Force API refresh.
   */
  const refreshPlayers =
    useCallback(async () => {
      clearFootballDataCache();

      return loadPlayers(true);
    }, [loadPlayers]);

  /*
   * IMPORTANT:
   * This effect is what starts the API request.
   */
  useEffect(() => {
    resetPlayers();
    loadPlayers(false);
  }, [
    selectedLeague,
    apiSeason,
    loadPlayers,
    resetPlayers,
  ]);

  /*
   * Automatically select the first
   * two players after category change.
   */
  useEffect(() => {
    if (!selectedCategory) {
      setPlayer1(null);
      setPlayer2(null);

      setPlayerSearch1("");
      setPlayerSearch2("");

      return;
    }

    const players =
      leaguePlayers.filter(
        player =>
          player.category ===
          selectedCategory
      );

    setPlayer1(current => {
      if (
        current &&
        players.some(
          player =>
            String(player.id) ===
            String(current.id)
        )
      ) {
        return current;
      }

      return players[0] || null;
    });

    setPlayer2(current => {
      if (
        current &&
        players.some(
          player =>
            String(player.id) ===
            String(current.id)
        )
      ) {
        return current;
      }

      return (
        players[1] ||
        players[0] ||
        null
      );
    });
  }, [
    selectedCategory,
    leaguePlayers,
  ]);

  /*
   * FDR.
   */
  useEffect(() => {
    if (!player1 || !player2) {
      setFdr1(DEFAULT_FDR);
      setFdr2(DEFAULT_FDR);
      setFdrLoading(false);
      return;
    }

    let cancelled = false;

    const loadFdr = async () => {
      setFdrLoading(true);

      try {
        const [
          firstFdr,
          secondFdr,
        ] = await Promise.all([
          getTeamFdr(
            player1.teamId,
            selectedLeague,
            apiSeason
          ),

          getTeamFdr(
            player2.teamId,
            selectedLeague,
            apiSeason
          ),
        ]);

        if (cancelled) {
          return;
        }

        setFdr1(
          Number.isFinite(
            Number(firstFdr)
          )
            ? Number(firstFdr)
            : DEFAULT_FDR
        );

        setFdr2(
          Number.isFinite(
            Number(secondFdr)
          )
            ? Number(secondFdr)
            : DEFAULT_FDR
        );
      } catch (fdrError) {
        console.error(
          "FDR error:",
          fdrError
        );

        if (!cancelled) {
          setFdr1(DEFAULT_FDR);
          setFdr2(DEFAULT_FDR);
        }
      } finally {
        if (!cancelled) {
          setFdrLoading(false);
        }
      }
    };

    loadFdr();

    return () => {
      cancelled = true;
    };
  }, [
    player1?.teamId,
    player2?.teamId,
    selectedLeague,
    apiSeason,
  ]);

  /*
   * Category selection.
   */
  const selectCategory =
    useCallback(
      category => {
        const players =
          leaguePlayers.filter(
            player =>
              player.category ===
              category
          );

        setSelectedCategory(
          category
        );

        setPlayer1(
          players[0] || null
        );

        setPlayer2(
          players[1] ||
            players[0] ||
            null
        );

        setPlayerSearch1("");
        setPlayerSearch2("");
      },
      [leaguePlayers]
    );

  /*
   * Player 1.
   */
  const selectPlayer1 =
    useCallback(player => {
      if (!player) {
        return;
      }

      setPlayer1(player);
      setPlayerSearch1("");
    }, []);

  /*
   * Player 2.
   */
  const selectPlayer2 =
    useCallback(player => {
      if (!player) {
        return;
      }

      setPlayer2(player);
      setPlayerSearch2("");
    }, []);

  /*
   * Select from <select>.
   */
  const handlePlayer1Change =
    useCallback(
      event => {
        const player =
          categoryPlayers.find(
            item =>
              String(item.id) ===
              String(
                event.target.value
              )
          );

        if (player) {
          setPlayer1(player);
        }
      },
      [categoryPlayers]
    );

  const handlePlayer2Change =
    useCallback(
      event => {
        const player =
          categoryPlayers.find(
            item =>
              String(item.id) ===
              String(
                event.target.value
              )
          );

        if (player) {
          setPlayer2(player);
        }
      },
      [categoryPlayers]
    );

  const handlePlayerChange =
    useCallback(
      setter => event => {
        const player =
          categoryPlayers.find(
            item =>
              String(item.id) ===
              String(
                event.target.value
              )
          );

        if (player) {
          setter(player);
        }
      },
      [categoryPlayers]
    );

  /*
   * Add player to comparison.
   */
  const addToComparison =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        setSelectedCategory(
          player.category
        );

        if (!player1) {
          setPlayer1(player);
        } else if (
          String(player1.id) ===
          String(player.id)
        ) {
          return;
        } else if (!player2) {
          setPlayer2(player);
        } else if (
          String(player2.id) ===
          String(player.id)
        ) {
          return;
        } else {
          setPlayer2(player);
        }

        setPlayerSearch1("");
        setPlayerSearch2("");
      },
      [player1, player2]
    );

  /*
   * Swap players.
   */
  const swapPlayers =
    useCallback(() => {
      setPlayer1(player2);
      setPlayer2(player1);
    }, [
      player1,
      player2,
    ]);

  return {
    leaguePlayers,
    setLeaguePlayers,

    categories,
    categoryPlayers,
    totalPlayers,

    loading,
    error,
    progress,

    selectedCategory,
    setSelectedCategory,

    player1,
    setPlayer1,

    player2,
    setPlayer2,

    playerSearch1,
    setPlayerSearch1,

    playerSearch2,
    setPlayerSearch2,

    filteredPlayers1,
    filteredPlayers2,

    searchPlayers,

    apiSeason,

    fdr1,
    fdr2,
    fdrLoading,

    loadPlayers,
    refreshPlayers,
    resetPlayers,

    selectCategory,
    handleCategorySelect:
      selectCategory,

    selectPlayer1,
    selectPlayer2,

    handlePlayer1Change,
    handlePlayer2Change,
    handlePlayerChange,

    addToComparison,
    swapPlayers,
  };
}