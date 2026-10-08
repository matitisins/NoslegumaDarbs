import { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

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

export default function useAppController() {
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
    useState(() => {
      try {
        return JSON.parse(
          localStorage.getItem("flow_favorite_players") ||
            "[]"
        );
      } catch {
        return [];
      }
    });

  const [detailsPlayer, setDetailsPlayer] =
    useState(null);

  const [playerProfileData, setPlayerProfileData] =
    useState(null);

  const [playerProfileLoading, setPlayerProfileLoading] =
    useState(false);

  const [playerProfileError, setPlayerProfileError] =
    useState("");

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

  const favorites = leaguePlayers.filter(
    player => favoriteIds.includes(player.id)
  );

  const isFavorite = player =>
    favoriteIds.includes(player.id);

  const toggleFavorite = player => {
    if (!player?.id) return;

    setFavoriteIds(current => {
      const exists = current.includes(player.id);

      const next = exists
        ? current.filter(id => id !== player.id)
        : [...current, player.id];

      localStorage.setItem(
        "flow_favorite_players",
        JSON.stringify(next)
      );

      return next;
    });
  };

  const resetPlayers = () => {
    setSelectedCategory(null);
    setPlayer1(null);
    setPlayer2(null);
  };

  const loadPlayers = async (
    forceRefresh = false
  ) => {
    setLoading(true);
    setError("");

    try {
      const players =
        await fetchApiSportsPlayers(
          COMPETITION_IDS[selectedLeague],
          apiSeason,
          { forceRefresh }
        );

      setLeaguePlayers(players);
    } catch (err) {
      console.error(err);
      setLeaguePlayers([]);

      setError(
        err?.message ||
          "Neizdevās ielādēt datus no API."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetPlayers();
    loadPlayers();
  }, [selectedLeague, selectedSeason]);

  useEffect(() => {
    if (!selectedCategory) return;

    const players = leaguePlayers.filter(
      p => p.category === selectedCategory
    );

    setPlayer1(current =>
      current &&
      players.some(p => p.id === current.id)
        ? current
        : players[0] || null
    );

    setPlayer2(current =>
      current &&
      players.some(p => p.id === current.id)
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

  const addToComparison = player => {
    if (!player) return;

    setSelectedCategory(player.category);

    if (
      !player1 ||
      player1.id === player.id
    ) {
      setPlayer1(player);

      if (
        player2?.id === player.id
      ) {
        setPlayer2(null);
      }
    } else if (
      !player2 ||
      player2.id === player.id
    ) {
      setPlayer2(player);
    } else {
      setPlayer1(player);
    }

    setDetailsPlayer(null);
  };

  const openPlayer = async player => {
    if (!player) return;

    setDetailsPlayer(player);
    setPlayerProfileData(null);
    setPlayerProfileError("");
    setPlayerProfileLoading(true);

    try {
      const data = await fetchPlayerProfile(
        player.id,
        apiSeason
      );

      setPlayerProfileData(data);
    } catch (profileError) {
      console.error("Spēlētāja profila kļūda:", profileError);
      setPlayerProfileError(
        profileError?.message ||
          "Neizdevās ielādēt papildu profila datus."
      );
    } finally {
      setPlayerProfileLoading(false);
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
    addToComparison,
    openPlayer,
    handlePlayer1Change,
    handlePlayer2Change,
    openAccount,
    handleFileChange,
    saveAccount,
    takeScreenshot,
    refreshData,
  };
}