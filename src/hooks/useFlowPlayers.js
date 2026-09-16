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

const DEFAULT_LEAGUE = "PL";
const DEFAULT_SEASON = "2026/2027";

const CATEGORY_ORDER = [
  "STRIKERS",
  "MIDFIELDERS",
  "DEFENDERS",
  "GOALKEEPERS",
];

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
    useState(3);

  const [fdr2, setFdr2] =
    useState(3);

  const [fdrLoading, setFdrLoading] =
    useState(false);

  const apiSeason =
    seasonToApiSeason(
      selectedSeason
    );

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

  const searchPlayers = useCallback(
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

  const resetPlayers =
    useCallback(() => {
      setSelectedCategory(
        null
      );

      setPlayer1(null);
      setPlayer2(null);

      setPlayerSearch1("");
      setPlayerSearch2("");

      setFdr1(3);
      setFdr2(3);
    }, []);

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
            !Array.isArray(
              players
            )
          ) {
            throw new Error(
              "API neatgrieza derīgu spēlētāju sarakstu."
            );
          }

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

  const refreshPlayers =
    useCallback(async () => {
      clearFootballDataCache();

      return loadPlayers(
        true
      );
    }, [loadPlayers]);

  /*
   * Load players whenever the
   * league or season changes.
   */
  useEffect(() => {
    setSelectedCategory(null);

    setPlayer1(null);
    setPlayer2(null);

    setPlayerSearch1("");
    setPlayerSearch2("");

    setFdr1(3);
    setFdr2(3);

    loadPlayers(false);
  }, [
    selectedLeague,
    apiSeason,
  ]);

  /*
   * Automatically select the
   * first two players from the
   * selected category.
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
            player.id ===
            current.id
        )
      ) {
        return current;
      }

      return (
        players[0] ||
        null
      );
    });

    setPlayer2(current => {
      if (
        current &&
        players.some(
          player =>
            player.id ===
            current.id
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
   * Load FDR whenever either
   * selected player's team changes.
   */
  useEffect(() => {
    if (!player1 || !player2) {
      setFdr1(3);
      setFdr2(3);
      setFdrLoading(false);

      return;
    }

    let cancelled = false;

    const loadFdr =
      async () => {
        setFdrLoading(true);

        try {
          const [
            firstFdr,
            secondFdr,
          ] =
            await Promise.all([
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
              : 3
          );

          setFdr2(
            Number.isFinite(
              Number(secondFdr)
            )
              ? Number(secondFdr)
              : 3
          );
        } catch (fdrError) {
          console.error(
            "FDR kļūda:",
            fdrError
          );

          if (!cancelled) {
            setFdr1(3);
            setFdr2(3);
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
          players[0] ||
            null
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

  const handleCategorySelect =
    selectCategory;

  const selectPlayer1 =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        setPlayer1(player);
        setPlayerSearch1("");
      },
      []
    );

  const selectPlayer2 =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        setPlayer2(player);
        setPlayerSearch2("");
      },
      []
    );

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

  const addToComparison =
    useCallback(
      player => {
        if (!player) {
          return;
        }

        setSelectedCategory(
          player.category
        );

        /*
         * If there is no first player,
         * put the new player there.
         */
        if (!player1) {
          setPlayer1(player);
        }

        /*
         * If the first slot already
         * contains this player, don't
         * duplicate it.
         */
        else if (
          player1.id ===
          player.id
        ) {
          return;
        }

        /*
         * If there is no second player,
         * use the second slot.
         */
        else if (!player2) {
          setPlayer2(player);
        }

        /*
         * If it is already the second
         * player, don't duplicate it.
         */
        else if (
          player2.id ===
          player.id
        ) {
          return;
        }

        /*
         * Otherwise replace player 2.
         */
        else {
          setPlayer2(player);
        }

        setPlayerSearch1("");
        setPlayerSearch2("");
      },
      [player1, player2]
    );

  const swapPlayers =
    useCallback(() => {
      setPlayer1(player2);
      setPlayer2(player1);
    }, [
      player1,
      player2,
    ]);

  return {
    /*
     * Data
     */
    leaguePlayers,
    setLeaguePlayers,

    categories,
    categoryPlayers,
    totalPlayers,

    /*
     * Loading
     */
    loading,
    error,
    progress,

    /*
     * Selection
     */
    selectedCategory,
    setSelectedCategory,

    player1,
    setPlayer1,

    player2,
    setPlayer2,

    /*
     * Search
     */
    playerSearch1,
    setPlayerSearch1,

    playerSearch2,
    setPlayerSearch2,

    filteredPlayers1,
    filteredPlayers2,

    searchPlayers,

    /*
     * API season
     */
    apiSeason,

    /*
     * FDR
     */
    fdr1,
    fdr2,
    fdrLoading,

    /*
     * Actions
     */
    loadPlayers,
    refreshPlayers,

    resetPlayers,

    selectCategory,
    handleCategorySelect,

    selectPlayer1,
    selectPlayer2,

    handlePlayer1Change,
    handlePlayer2Change,
    handlePlayerChange,

    addToComparison,
    swapPlayers,
  };
}