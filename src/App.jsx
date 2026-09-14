import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import html2canvas from "html2canvas";

import {
  COMPETITION_IDS,
  fetchApiSportsPlayers,
  getTeamFdr,
  seasonToApiSeason,
  clearFootballDataCache,
} from "./services/apiSports";

import RadarChart from "./components/RadarChart";
import Logo from "./components/Logo";
import ComparisonSummary from "./components/ComparisonSummary";
import PlayerCard from "./components/PlayerCard";
import CaptaincySimulator from "./components/CaptaincySimulator";
import AccountModal from "./components/AccountModal";
import GuideModal from "./components/GuideModal";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

const LEAGUES = [
  {
    code: "PL",
    name: "Premier League",
  },
  {
    code: "PD",
    name: "La Liga",
  },
  {
    code: "SA",
    name: "Serie A",
  },
  {
    code: "BL1",
    name: "Bundesliga",
  },
  {
    code: "FL1",
    name: "Ligue 1",
  },
];

const CATEGORY_NAMES = {
  GOALKEEPERS: "VĀRTSARGI",
  DEFENDERS: "AIZSARGI",
  MIDFIELDERS: "PUSSARGI",
  STRIKERS: "UZBRUCĒJI",
};

export default function App() {
  const [selectedSeason, setSelectedSeason] =
    useState("2026/2027");

  const [selectedLeague, setSelectedLeague] =
    useState("PL");

  const [selectedCategory, setSelectedCategory] =
    useState(null);

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

  const [username, setUsername] = useState(
    () =>
      localStorage.getItem(
        "radars_username"
      ) || "Matīss"
  );

  const [avatarUrl, setAvatarUrl] =
    useState(
      () =>
        localStorage.getItem(
          "radars_avatar"
        ) || DEFAULT_AVATAR
    );

  const [isAccountOpen, setIsAccountOpen] =
    useState(false);

  const [isGuideOpen, setIsGuideOpen] =
    useState(false);

  const [tempUsername, setTempUsername] =
    useState(username);

  const [tempAvatar, setTempAvatar] =
    useState(avatarUrl);

  const [player1, setPlayer1] =
    useState(null);

  const [player2, setPlayer2] =
    useState(null);

  const [fdr1, setFdr1] = useState(3);
  const [fdr2, setFdr2] = useState(3);

  const [fdrLoading, setFdrLoading] =
    useState(false);

  const captureRef = useRef(null);

  const apiSeason =
    seasonToApiSeason(selectedSeason);

  const categories = [
    ...new Set(
      leaguePlayers.map(
        (player) => player.category
      )
    ),
  ];

  const categoryPlayers = selectedCategory
    ? leaguePlayers.filter(
        (player) =>
          player.category === selectedCategory
      )
    : [];

  const loadPlayers = async (
    forceRefresh = false
  ) => {
    setLoading(true);
    setError("");
    setProgress({
      current: 0,
      total: 1,
    });

    try {
      const players =
        await fetchApiSportsPlayers(
          COMPETITION_IDS[selectedLeague],
          apiSeason,
          {
            forceRefresh,
            onProgress: setProgress,
          }
        );

      setLeaguePlayers(players);
    } catch (loadError) {
      console.error(loadError);

      setLeaguePlayers([]);

      setError(
        loadError?.message ||
          "Neizdevās ielādēt datus no API."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSelectedCategory(null);
    setPlayer1(null);
    setPlayer2(null);

    loadPlayers(false);
  }, [
    selectedLeague,
    selectedSeason,
  ]);

  useEffect(() => {
    if (!selectedCategory) {
      setPlayer1(null);
      setPlayer2(null);
      return;
    }

    const players =
      leaguePlayers.filter(
        (player) =>
          player.category ===
          selectedCategory
      );

    setPlayer1((current) => {
      if (
        current &&
        players.some(
          (player) =>
            player.id === current.id
        )
      ) {
        return current;
      }

      return players[0] || null;
    });

    setPlayer2((current) => {
      if (
        current &&
        players.some(
          (player) =>
            player.id === current.id
        )
      ) {
        return current;
      }

      return players[1] ||
        players[0] ||
        null;
    });
  }, [
    selectedCategory,
    leaguePlayers,
  ]);

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
        const [firstFdr, secondFdr] =
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
          setFdr1(firstFdr);
          setFdr2(secondFdr);
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

  const resetPlayers = () => {
    setSelectedCategory(null);
    setPlayer1(null);
    setPlayer2(null);
  };

  const handleLeagueChange = (event) => {
    setSelectedLeague(
      event.target.value
    );

    resetPlayers();
  };

  const handleCategorySelect = (
    category
  ) => {
    const players =
      leaguePlayers.filter(
        (player) =>
          player.category === category
      );

    setSelectedCategory(category);
    setPlayer1(players[0] || null);
    setPlayer2(
      players[1] ||
        players[0] ||
        null
    );
  };

  const handlePlayerChange =
    (setter) =>
    (event) => {
      const player =
        leaguePlayers.find(
          (item) =>
            String(item.id) ===
            String(
              event.target.value
            )
        );

      if (player) {
        setter(player);
      }
    };

  const openAccount = () => {
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setIsAccountOpen(true);
  };

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (
      !file ||
      !file.type.startsWith(
        "image/"
      )
    ) {
      return;
    }

    const reader =
      new FileReader();

    reader.onloadend = () => {
      if (
        typeof reader.result ===
        "string"
      ) {
        setTempAvatar(
          reader.result
        );
      }
    };

    reader.readAsDataURL(file);
  };

  const saveAccount = (event) => {
    event.preventDefault();

    const name =
      tempUsername.trim() ||
      "Matīss";

    setUsername(name);
    setAvatarUrl(tempAvatar);

    localStorage.setItem(
      "radars_username",
      name
    );

    localStorage.setItem(
      "radars_avatar",
      tempAvatar
    );

    setIsAccountOpen(false);
  };

  const takeScreenshot = async () => {
    if (!captureRef.current) {
      return;
    }

    try {
      const canvas =
        await html2canvas(
          captureRef.current,
          {
            scale: 2,
            useCORS: true,
            allowTaint: false,
            backgroundColor:
              "#f1f5f9",
            logging: false,
          }
        );

      const cleanName = (
        name
      ) =>
        (name || "player").replace(
          /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
          "-"
        );

      const link =
        document.createElement(
          "a"
        );

      link.href =
        canvas.toDataURL(
          "image/png"
        );

      link.download =
        `flow-comparison-${cleanName(
          player1?.name
        )}-vs-${cleanName(
          player2?.name
        )}.png`;

      link.click();
    } catch (screenshotError) {
      console.error(
        "Kļūda veidojot ekrānuzņēmumu:",
        screenshotError
      );
    }
  };

  const refreshData = async () => {
    clearFootballDataCache();

    await loadPlayers(true);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <Logo className="h-8 w-8" />

          <span className="text-lg font-bold text-slate-900">
            Flow
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={resetPlayers}
            className="font-medium hover:text-slate-900"
          >
            Home
          </button>

          <button
            onClick={() =>
              setIsGuideOpen(true)
            }
            className="font-medium hover:text-slate-900"
          >
            Guide
          </button>
        </nav>

        <button
          onClick={openAccount}
          className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 hover:bg-slate-100"
        >
          <img
            src={avatarUrl}
            alt="Avatar"
            className="h-7 w-7 rounded-full border border-emerald-500 object-cover"
          />

          <span className="text-xs font-bold">
            {username}
          </span>
        </button>
      </header>

      {isGuideOpen && (
        <GuideModal
          onClose={() =>
            setIsGuideOpen(false)
          }
        />
      )}

      {isAccountOpen && (
        <AccountModal
          username={tempUsername}
          avatar={tempAvatar}
          onUsernameChange={
            setTempUsername
          }
          onFileChange={
            handleFileChange
          }
          onSave={saveAccount}
          onClose={() =>
            setIsAccountOpen(false)
          }
        />
      )}

      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
          <label className="text-xs font-semibold uppercase text-slate-500">
            Sezona:

            <select
              value={selectedSeason}
              onChange={(event) =>
                setSelectedSeason(
                  event.target.value
                )
              }
              className="ml-2 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-slate-800"
            >
              <option>
                2026/2027
              </option>

              <option>
                2025/2026
              </option>
            </select>
          </label>

          <label className="text-xs font-semibold uppercase text-slate-500">
            Turnīrs:

            <select
              value={selectedLeague}
              onChange={
                handleLeagueChange
              }
              className="ml-2 rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-slate-800"
            >
              {LEAGUES.map(
                (league) => (
                  <option
                    key={league.code}
                    value={
                      league.code
                    }
                  >
                    {league.name}
                  </option>
                )
              )}
            </select>
          </label>

          <button
            onClick={refreshData}
            disabled={loading}
            className="rounded-lg border border-slate-300 bg-white px-4 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Ielādē..."
              : "↻ Atjaunot API"}
          </button>
        </div>

        {loading && (
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-500" />

            <h2 className="font-bold text-slate-900">
              Ielādē futbola datus...
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Līga:{" "}
              {
                LEAGUES.find(
                  (league) =>
                    league.code ===
                    selectedLeague
                )?.name
              }
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="mb-2 font-bold text-red-700">
              API kļūda
            </h2>

            <p className="mb-4 text-sm text-red-600">
              {error}
            </p>

            <button
              onClick={() =>
                loadPlayers(true)
              }
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-500"
            >
              Mēģināt vēlreiz
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          !selectedCategory && (
            <section>
              <div className="mb-8 text-center">
                <h1 className="text-3xl font-extrabold text-slate-900">
                  Futbolistu salīdzināšana
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                  Izvēlies pozīciju,
                  lai salīdzinātu
                  spēlētājus.
                </p>
              </div>

              {categories.length ===
              0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                  <p className="text-slate-500">
                    Šajā turnīrā
                    pašlaik nav
                    pieejamu spēlētāju
                    datu.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                  {categories.map(
                    (category) => {
                      const count =
                        leaguePlayers.filter(
                          (player) =>
                            player.category ===
                            category
                        ).length;

                      return (
                        <button
                          key={
                            category
                          }
                          onClick={() =>
                            handleCategorySelect(
                              category
                            )
                          }
                          className="rounded-2xl border-2 border-slate-200 bg-white p-10 text-center shadow-sm transition-all hover:border-emerald-500 hover:shadow-md"
                        >
                          <h3 className="mb-3 text-2xl font-extrabold text-emerald-600">
                            {CATEGORY_NAMES[
                              category
                            ] ||
                              category}
                          </h3>

                          <p className="text-sm text-slate-500">
                            {count}{" "}
                            spēlētāji
                            pieejami
                          </p>
                        </button>
                      );
                    }
                  )}
                </div>
              )}

              <p className="mt-8 text-center text-xs text-slate-400">
                Data provided by
                football-data.org
              </p>
            </section>
          )}

        {!loading &&
          !error &&
          selectedCategory && (
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <button
                  onClick={
                    resetPlayers
                  }
                  className="text-xs font-bold uppercase text-slate-500 hover:text-emerald-600"
                >
                  ← Atpakaļ uz
                  kategorijām
                </button>

                <div className="flex items-center gap-4">
                  <span className="text-sm font-extrabold uppercase text-emerald-600">
                    Kategorija:{" "}
                    {CATEGORY_NAMES[
                      selectedCategory
                    ] ||
                      selectedCategory}
                  </span>

                  {player1 &&
                    player2 && (
                      <button
                        onClick={
                          takeScreenshot
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500"
                      >
                        📷 Saglabāt
                        attēlu
                      </button>
                    )}
                </div>
              </div>

              {!player1 ||
              !player2 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
                  <p className="text-slate-500">
                    Šajā kategorijā
                    nav pietiekami
                    daudz spēlētāju
                    salīdzināšanai.
                  </p>
                </div>
              ) : (
                <div
                  ref={captureRef}
                  className="rounded-xl bg-slate-100 p-2"
                >
                  <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex flex-wrap gap-6">
                        <span className="text-xs font-bold text-rose-500">
                          🔴{" "}
                          {
                            player1.name
                          }{" "}
                          (
                          {
                            player1.team
                          }
                          )
                        </span>

                        <span className="text-xs font-bold text-emerald-600">
                          🟢{" "}
                          {
                            player2.name
                          }{" "}
                          (
                          {
                            player2.team
                          }
                          )
                        </span>
                      </div>

                      <span className="text-xs uppercase text-slate-400">
                        Percentiles
                      </span>
                    </div>

                    <RadarChart
                      players={[
                        player1,
                        player2,
                      ]}
                    />
                  </div>

                  <ComparisonSummary
                    player1={player1}
                    player2={player2}
                  />

                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <PlayerCard
                      player={player1}
                      players={
                        categoryPlayers
                      }
                      onChange={handlePlayerChange(
                        setPlayer1
                      )}
                      color="rose"
                    />

                    <PlayerCard
                      player={player2}
                      players={
                        categoryPlayers
                      }
                      onChange={handlePlayerChange(
                        setPlayer2
                      )}
                      color="emerald"
                    />
                  </div>

                  <CaptaincySimulator
                    player1={player1}
                    player2={player2}
                    fdr1={fdr1}
                    fdr2={fdr2}
                    loading={fdrLoading}
                  />
                </div>
              )}
            </section>
          )}

        <footer className="mt-10 pb-6 text-center text-xs text-slate-400">
          Data provided by
          football-data.org
        </footer>
      </main>
    </div>
  );
}