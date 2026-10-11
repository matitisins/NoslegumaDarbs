import { useEffect, useRef, useState } from "react";

import {
  COMPETITION_IDS,
  fetchApiSportsPlayers,
  getTeamFdr,
  seasonToApiSeason,
  clearFootballDataCache,
  fetchPlayerProfile,
} from "../services/apiSports";

import {
  DEFAULT_AVATAR,
  MAX_AVATAR_SIZE_BYTES,
  MAX_STORED_AVATAR_BYTES,
  MAX_AVATAR_DIMENSION,
  ALLOWED_AVATAR_TYPES,
  LEAGUES,
  CATEGORY_ORDER,
  formatBytes,
  saveLocalStorageValue,
} from "../components/app/AppConstants";

import {
  readFavoriteIds,
  writeFavoriteIds,
  readFavoritePlayers,
  writeFavoritePlayers,
  isFavoriteId,
  toggleFavoriteId,
  upsertFavoritePlayer,
  removeFavoritePlayer,
  normalizeFavoriteId,
} from "../utils/favoriteUtils";

export default function useAppController() {
    const [selectedSeason, setSelectedSeason] =
    useState("2026/2027");

  const [activeView, setActiveView] =
    useState("players");

  const [selectedLeague, setSelectedLeague] =
    useState("PL");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

  const [leaguePlayers, setLeaguePlayers] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [username, setUsername] = useState(
    () =>
      localStorage.getItem("radars_username") ||
      "Matīss"
  );

  const [avatarUrl, setAvatarUrl] = useState(
    () =>
      localStorage.getItem("radars_avatar") ||
      DEFAULT_AVATAR
  );

  const [isAccountOpen, setIsAccountOpen] =
    useState(false);

  const [isGuideOpen, setIsGuideOpen] =
    useState(false);

  const [tempUsername, setTempUsername] =
    useState(username);

  const [tempAvatar, setTempAvatar] =
    useState(avatarUrl);


  const [avatarError, setAvatarError] =
    useState("");

  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);

  const [fdr1, setFdr1] = useState(3);
  const [fdr2, setFdr2] = useState(3);
  const [fdrLoading, setFdrLoading] =
    useState(false);

  const [favoriteIds, setFavoriteIds] =
    useState(() => readFavoriteIds());

  const [favoritePlayers, setFavoritePlayers] =
    useState(() => readFavoritePlayers());

  const [detailsPlayer, setDetailsPlayer] =
    useState(null);

  const [playerProfileData, setPlayerProfileData] =
    useState(null);

  const [playerProfileLoading, setPlayerProfileLoading] =
    useState(false);

  const [playerProfileError, setPlayerProfileError] =
    useState("");

  // Invalidate pending profile requests when the modal closes or another player opens.
  const profileRequestId = useRef(0);
  const closePlayerProfile = () => {
    profileRequestId.current += 1;
    setDetailsPlayer(null);
    setPlayerProfileData(null);
    setPlayerProfileError("");
    setPlayerProfileLoading(false);
  };

  const captureRef = useRef(null);

  const apiSeason =
    seasonToApiSeason(selectedSeason);

  const leagueName =
    LEAGUES.find(x => x[0] === selectedLeague)?.[1] ||
    selectedLeague;

  const categories = CATEGORY_ORDER.filter(
    category =>
      leaguePlayers.some(
        player => player.category === category
      )
  );

  const categoryPlayers = selectedCategory
    ? leaguePlayers.filter(
        player =>
          player.category === selectedCategory
      )
    : [];

  const favorites = favoritePlayers.map(
    favoritePlayer => {
      const currentLeaguePlayer =
        leaguePlayers.find(
          player =>
            normalizeFavoriteId(player?.id) ===
            normalizeFavoriteId(favoritePlayer?.id)
        );

      return currentLeaguePlayer
        ? {
            ...favoritePlayer,
            ...currentLeaguePlayer,
            id: normalizeFavoriteId(
              currentLeaguePlayer.id
            ),
          }
        : favoritePlayer;
    }
  );

  const isFavorite = player =>
    isFavoriteId(favoriteIds, player?.id);

  const toggleFavorite = player => {
    const playerId =
      normalizeFavoriteId(player?.id);

    if (!playerId) return;

    const currentlyFavorite =
      isFavoriteId(favoriteIds, playerId);

    if (currentlyFavorite) {
      setFavoriteIds(current => {
        const next = toggleFavoriteId(
          current,
          playerId
        );

        if (!writeFavoriteIds(next)) {
          return current;
        }

        return next;
      });

      setFavoritePlayers(current => {
        const next = removeFavoritePlayer(
          current,
          playerId
        );

        if (!writeFavoritePlayers(next)) {
          return current;
        }

        return next;
      });

      return;
    }

    const favoriteSnapshot = {
      ...player,
      id: playerId,
      favoriteLeague: selectedLeague,
      favoriteSeason: selectedSeason,
    };

    setFavoriteIds(current => {
      const next = toggleFavoriteId(
        current,
        playerId
      );

      if (!writeFavoriteIds(next)) {
        return current;
      }

      return next;
    });

    setFavoritePlayers(current => {
      const next = upsertFavoritePlayer(
        current,
        favoriteSnapshot
      );

      if (!writeFavoritePlayers(next)) {
        return current;
      }

      return next;
    });
  };

  useEffect(() => {
    if (!leaguePlayers.length) return;

    const favoriteIdSet = new Set(
      favoriteIds.map(normalizeFavoriteId)
    );

    const matchingPlayers =
      leaguePlayers.filter(player =>
        favoriteIdSet.has(
          normalizeFavoriteId(player?.id)
        )
      );

    if (!matchingPlayers.length) return;

    setFavoritePlayers(current => {
      let next = current;

      matchingPlayers.forEach(player => {
        next = upsertFavoritePlayer(
          next,
          player,
          {
            favoriteLeague:
              player?.favoriteLeague ||
              selectedLeague,
            favoriteSeason:
              player?.favoriteSeason ||
              selectedSeason,
          }
        );
      });

      const changed =
        JSON.stringify(next) !==
        JSON.stringify(current);

      if (!changed) {
        return current;
      }

      if (!writeFavoritePlayers(next)) {
        return current;
      }

      return next;
    });
  }, [
    leaguePlayers,
    favoriteIds,
    selectedLeague,
    selectedSeason,
  ]);

  const resetPlayers = () => {
    setSelectedCategory(null);
    setPlayer1(null);
    setPlayer2(null);
  };

  const playerLoadIdRef = useRef(0);

  const loadPlayers = async (forceRefresh = false) => {
    // Player pagination is expensive and must not run while the user
    // is looking at Teams, League Tables, or Analytics Tools.
    if (activeView !== "players") return;

    const loadId = ++playerLoadIdRef.current;
    setLoading(true);
    setError("");

    try {
      const players = await fetchApiSportsPlayers(
        COMPETITION_IDS[selectedLeague],
        apiSeason,
        {
          forceRefresh,
          isCancelled: () => loadId !== playerLoadIdRef.current || activeView !== "players",
        }
      );

      if (loadId !== playerLoadIdRef.current || activeView !== "players") return;
      setLeaguePlayers(players);
    } catch (err) {
      if (loadId !== playerLoadIdRef.current || activeView !== "players") return;
      console.error(err);
      setLeaguePlayers([]);
      setError(err?.message || "Neizdevās ielādēt datus no API.");
    } finally {
      if (loadId === playerLoadIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    // Invalidate a previous pagination run immediately when the user
    // changes view, league, or season. Only Players needs the full player list.
    playerLoadIdRef.current += 1;
    if (activeView !== "players") {
      setLoading(false);
      setError("");
      return;
    }

    resetPlayers();
    loadPlayers();
    // loadPlayers intentionally uses the current state captured by this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeView, selectedLeague, selectedSeason]);

  useEffect(() => {
    if (!selectedCategory) return;

    const players = leaguePlayers.filter(
      p => p.category === selectedCategory
    );

    setPlayer1(current =>
      current &&
      players.some(p => String(p.id ?? p.playerId) === String(current.id ?? current.playerId))
        ? current
        : players[0] || null
    );

    setPlayer2(current =>
      current &&
      players.some(p => String(p.id ?? p.playerId) === String(current.id ?? current.playerId))
        ? current
        : players[1] ||
          players[0] ||
          null
    );
  }, [selectedCategory, leaguePlayers]);

  useEffect(() => {
    if (!player1 || !player2) {
      setFdr1(3);
      setFdr2(3);
      return;
    }

    let cancelled = false;

    const loadFdr = async () => {
      setFdrLoading(true);

      try {
        const [first, second] =
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

        if (!cancelled) {
          setFdr1(first);
          setFdr2(second);
        }
      } catch {
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

  const selectCategory = category => {
    const players = leaguePlayers.filter(
      p => p.category === category
    );

    setSelectedCategory(category);
    setPlayer1(players[0] || null);
    setPlayer2(
      players[1] ||
        players[0] ||
        null
    );
  };


  // Explicit slot selection prevents the left/right comparison searches from
  // accidentally updating the same player slot.
  const selectComparisonPlayer = (slot, player) => {
    if (!player || (slot !== "left" && slot !== "right")) return;

    const normalizedPlayer = {
      ...player,
      id: player.id ?? player.playerId,
      playerId: player.playerId ?? player.id,
    };

    if (slot === "left") {
      setPlayer1(normalizedPlayer);
    } else {
      setPlayer2(normalizedPlayer);
    }

    setDetailsPlayer(null);
    setPlayerProfileData(null);
    setPlayerProfileError("");
    setPlayerProfileLoading(false);
  };

  const addToComparison = player => {
    if (!player) return;

    const normalizedPlayer = {
      ...player,
      id: player.id ?? player.playerId,
      category: player.category || selectedCategory || player1?.category || player2?.category || "FORWARDS",
    };
    const sameId = (left, right) => left != null && right != null && String(left) === String(right);

    setActiveView("players");
    setSelectedCategory(normalizedPlayer.category);

    if (!player1) {
      setPlayer1(normalizedPlayer);
      if (sameId(player2?.id, normalizedPlayer.id)) setPlayer2(null);
    } else if (sameId(player1.id, normalizedPlayer.id)) {
      setPlayer1(normalizedPlayer);
    } else if (!player2 || sameId(player2.id, normalizedPlayer.id)) {
      setPlayer2(normalizedPlayer);
    } else {
      // Keep the first selected player and replace the second comparison slot.
      setPlayer2(normalizedPlayer);
    }

    setPlayerProfileData(null);
    setPlayerProfileError("");
    setPlayerProfileLoading(false);
    setDetailsPlayer(null);
  };

  const openPlayer = async player => {
    if (!player) return;

    const requestId = ++profileRequestId.current;
    setDetailsPlayer(player);
    setPlayerProfileData(null);
    setPlayerProfileError("");
    setPlayerProfileLoading(true);

    try {
      const data = await fetchPlayerProfile(
        player.id ?? player.playerId,
        apiSeason
      );

      if (requestId === profileRequestId.current) {
        setPlayerProfileData(data);
      }
    } catch (profileError) {
      if (requestId === profileRequestId.current) {
        console.error("Spēlētāja profila kļūda:", profileError);
        setPlayerProfileError(
          profileError?.message ||
            "Neizdevās ielādēt papildu profila datus."
        );
      }
    } finally {
      if (requestId === profileRequestId.current) {
        setPlayerProfileLoading(false);
      }
    }
  };

  const handlePlayer1Change = event => {
    const player = categoryPlayers.find(
      item => String(item.id) === String(event.target.value)
    );

    if (player) setPlayer1(player);
  };

  const handlePlayer2Change = event => {
    const player = categoryPlayers.find(
      item => String(item.id) === String(event.target.value)
    );

    if (player) setPlayer2(player);
  };

  const openAccount = () => {
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setAvatarError("");
    setIsAccountOpen(true);
  };

  const handleFileChange = async e => {
    const file = e.target.files?.[0];

    setAvatarError("");

    if (!file) {
      return;
    }

    e.target.value = "";

    if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
      setAvatarError(
        "Lūdzu izvēlies JPG, PNG vai WEBP attēlu."
      );
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setAvatarError(
        `Profila attēls ir pārāk liels (${formatBytes(
          file.size
        )}). Maksimālais izmērs ir 2 MB.`
      );
      return;
    }

    try {
      const objectUrl = URL.createObjectURL(file);

      try {
        const image = new Image();

        const imageLoaded = new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () =>
            reject(
              new Error("Neizdevās nolasīt attēlu.")
            );
        });

        image.src = objectUrl;
        await imageLoaded;

        if (
          !Number.isFinite(image.naturalWidth) ||
          !Number.isFinite(image.naturalHeight) ||
          image.naturalWidth <= 0 ||
          image.naturalHeight <= 0
        ) {
          throw new Error("Neatbilstošs attēla izmērs.");
        }

        const scale = Math.min(
          1,
          MAX_AVATAR_DIMENSION /
            Math.max(
              image.naturalWidth,
              image.naturalHeight
            )
        );

        const width = Math.max(
          1,
          Math.round(image.naturalWidth * scale)
        );
        const height = Math.max(
          1,
          Math.round(image.naturalHeight * scale)
        );

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const context = canvas.getContext("2d");

        if (!context) {
          throw new Error(
            "Pārlūks neatbalsta attēla apstrādi."
          );
        }

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(image, 0, 0, width, height);

        const compressedDataUrl =
          canvas.toDataURL("image/jpeg", 0.82);

        const base64 = compressedDataUrl.split(",")[1] || "";
        const estimatedBytes = Math.ceil(
          (base64.length * 3) / 4
        );

        if (
          !base64 ||
          estimatedBytes > MAX_STORED_AVATAR_BYTES
        ) {
          throw new Error(
            "ATTĒLS_TOO_LARGE_AFTER_COMPRESSION"
          );
        }

        setTempAvatar(compressedDataUrl);
        setAvatarError("");
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    } catch (error) {
      if (
        error?.message ===
        "ATTĒLS_TOO_LARGE_AFTER_COMPRESSION"
      ) {
        setAvatarError(
          "Attēlu nevarēja pietiekami samazināt. Izvēlies vienkāršāku vai mazāku attēlu."
        );
      } else {
        console.error(
          "Neizdevās apstrādāt profila attēlu:",
          error
        );
        setAvatarError(
          "Neizdevās apstrādāt profila attēlu. Mēģini citu JPG, PNG vai WEBP failu."
        );
      }
    }
  };

  const saveAccount = e => {
    e.preventDefault();

    if (avatarError) {
      return;
    }

    const name =
      tempUsername.trim() || "Matīss";

    const usernameSaved = saveLocalStorageValue(
      "radars_username",
      name
    );

    const avatarSaved = saveLocalStorageValue(
      "radars_avatar",
      tempAvatar
    );

    if (!usernameSaved || !avatarSaved) {
      setAvatarError(
        "Profilu neizdevās saglabāt pārlūka atmiņā. Mēģini mazāku attēlu vai atbrīvo vietu pārlūka krātuvē."
      );
      return;
    }

    setUsername(name);
    setAvatarUrl(tempAvatar);
    setAvatarError("");
    setIsAccountOpen(false);
  };

  const takeScreenshot = async () => {
    if (!captureRef.current) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas =
        await html2canvas(
          captureRef.current,
          {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#f1f5f9",
            logging: false,
          }
        );

      const clean = name =>
        (name || "player").replace(
          /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
          "-"
        );

      const link =
        document.createElement("a");

      link.href =
        canvas.toDataURL("image/png");

      link.download =
        `flow-comparison-${clean(
          player1?.name
        )}-vs-${clean(
          player2?.name
        )}.png`;

      link.click();
    } catch (err) {
      console.error(
        "Kļūda veidojot ekrānuzņēmumu:",
        err
      );
    }
  };

  const refreshData = async () => {
    clearFootballDataCache();
    await loadPlayers(true);
  };


  return {
    selectedSeason,
    setSelectedSeason,
    activeView,
    setActiveView,
    selectedLeague,
    setSelectedLeague,
    selectedCategory,
    setSelectedCategory,
    leaguePlayers,
    loading,
    error,
    username,
    avatarUrl,
    isAccountOpen,
    setIsAccountOpen,
    isGuideOpen,
    setIsGuideOpen,
    tempUsername,
    setTempUsername,
    tempAvatar,
    setTempAvatar,
    avatarError,
    player1,
    player2,
    fdr1,
    fdr2,
    fdrLoading,
    favoriteIds,
    detailsPlayer,
    playerProfileData,
    playerProfileLoading,
    playerProfileError,
    captureRef,
    apiSeason,
    leagueName,
    categories,
    categoryPlayers,
    favorites,
    isFavorite,
    toggleFavorite,
    resetPlayers,
    loadPlayers,
    selectCategory,
    selectComparisonPlayer,
    addToComparison,
    openPlayer,
    closePlayerProfile,
    handlePlayer1Change,
    handlePlayer2Change,
    openAccount,
    handleFileChange,
    saveAccount,
    takeScreenshot,
    refreshData,
  };
}
