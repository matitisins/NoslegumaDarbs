import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";

import { COMPETITION_PLAYERS } from "./services/mockPlayers";

import RadarChart from "./components/RadarChart";
import Logo from "./components/Logo";
import ComparisonSummary from "./components/ComparisonSummary";
import PlayerCard from "./components/PlayerCard";
import CaptaincySimulator from "./components/CaptaincySimulator";
import AccountModal from "./components/AccountModal";
import GuideModal from "./components/GuideModal";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

export default function App() {
  const [selectedSeason, setSelectedSeason] = useState("2026/2027");
  const [selectedLeague, setSelectedLeague] = useState("PL");
  const [selectedCategory, setSelectedCategory] = useState(null);

  const [username, setUsername] = useState(
    () => localStorage.getItem("radars_username") || "Matīss"
  );

  const [avatarUrl, setAvatarUrl] = useState(
    () => localStorage.getItem("radars_avatar") || DEFAULT_AVATAR
  );

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [tempUsername, setTempUsername] = useState(username);
  const [tempAvatar, setTempAvatar] = useState(avatarUrl);

  const [player1, setPlayer1] = useState(null);
  const [player2, setPlayer2] = useState(null);

  const captureRef = useRef(null);

  const leaguePlayers = COMPETITION_PLAYERS[selectedLeague] || [];

  const categories = [
    ...new Set(leaguePlayers.map((player) => player.category)),
  ];

  const categoryPlayers = selectedCategory
    ? leaguePlayers.filter(
        (player) => player.category === selectedCategory
      )
    : [];

  useEffect(() => {
    if (!selectedCategory) {
      setPlayer1(null);
      setPlayer2(null);
      return;
    }

    const players = leaguePlayers.filter(
      (player) => player.category === selectedCategory
    );

    setPlayer1(players[0] || null);
    setPlayer2(players[1] || players[0] || null);
  }, [selectedLeague, selectedCategory]);

  const resetPlayers = () => {
    setSelectedCategory(null);
    setPlayer1(null);
    setPlayer2(null);
  };

  const handleLeagueChange = (event) => {
    setSelectedLeague(event.target.value);
    resetPlayers();
  };

  const handleCategorySelect = (category) => {
    const players = leaguePlayers.filter(
      (player) => player.category === category
    );

    setSelectedCategory(category);
    setPlayer1(players[0] || null);
    setPlayer2(players[1] || players[0] || null);
  };

  const findPlayer = (event) =>
    leaguePlayers.find(
      (player) =>
        player.id === Number(event.target.value) &&
        player.category === selectedCategory
    );

  const handlePlayerChange = (setter) => (event) => {
    const player = findPlayer(event);

    if (player) setter(player);
  };

  const openAccount = () => {
    setTempUsername(username);
    setTempAvatar(avatarUrl);
    setIsAccountOpen(true);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file?.type.startsWith("image/")) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        setTempAvatar(reader.result);
      }
    };

    reader.readAsDataURL(file);
  };

  const saveAccount = (event) => {
    event.preventDefault();

    const name = tempUsername.trim() || "Matīss";

    setUsername(name);
    setAvatarUrl(tempAvatar);

    localStorage.setItem("radars_username", name);
    localStorage.setItem("radars_avatar", tempAvatar);

    setIsAccountOpen(false);
  };

  const takeScreenshot = async () => {
    if (!captureRef.current) return;

    try {
      const canvas = await html2canvas(captureRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#f1f5f9",
        logging: false,
      });

      const cleanName = (name) =>
        (name || "player").replace(
          /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
          "-"
        );

      const link = document.createElement("a");

      link.href = canvas.toDataURL("image/png");
      link.download =
        `flow-comparison-${cleanName(player1?.name)}-vs-${cleanName(
          player2?.name
        )}.png`;

      link.click();
    } catch (error) {
      console.error("Kļūda veidojot ekrānuzņēmumu:", error);
    }
  };

  return (
    <div className="bg-slate-100 text-slate-800 min-h-screen font-sans">
      {/* Navigation */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <Logo className="w-8 h-8" />
          <span className="font-bold text-lg text-slate-900">
            Flow
          </span>
        </div>

        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={resetPlayers}
            className="hover:text-slate-900 font-medium"
          >
            Home
          </button>

          <button
            onClick={() => setIsGuideOpen(true)}
            className="hover:text-slate-900 font-medium"
          >
            Guide
          </button>
        </nav>

        <button
          onClick={openAccount}
          className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-full py-1 px-3"
        >
          <img
            src={avatarUrl}
            alt="Avatar"
            className="w-7 h-7 rounded-full object-cover border border-emerald-500"
          />

          <span className="text-xs font-bold">
            {username}
          </span>
        </button>
      </header>

      {/* Guide */}
      {isGuideOpen && (
        <GuideModal
          onClose={() => setIsGuideOpen(false)}
        />
      )}

      {/* Account */}
      {isAccountOpen && (
        <AccountModal
          username={tempUsername}
          avatar={tempAvatar}
          onUsernameChange={setTempUsername}
          onFileChange={handleFileChange}
          onSave={saveAccount}
          onClose={() => setIsAccountOpen(false)}
        />
      )}

      <main className="max-w-6xl mx-auto p-6">
        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <label className="text-xs text-slate-500 uppercase font-semibold">
            Sezona:
            <select
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="ml-2 bg-white border border-slate-300 rounded-lg px-4 py-1.5 text-slate-800"
            >
              <option>2026/2027</option>
              <option>2025/2026</option>
            </select>
          </label>

          <label className="text-xs text-slate-500 uppercase font-semibold">
            Turnīrs:
            <select
              value={selectedLeague}
              onChange={handleLeagueChange}
              className="ml-2 bg-white border border-slate-300 rounded-lg px-4 py-1.5 text-slate-800"
            >
              <option value="PL">Premier League (PL)</option>
              <option value="PD">La Liga (PD)</option>
              <option value="SA">Serie A (SA)</option>
              <option value="BL1">Bundesliga (BL1)</option>
              <option value="FL1">Ligue 1 (FL1)</option>
            </select>
          </label>
        </div>

        {/* Category selection */}
        {!selectedCategory ? (
          <section>
            <h2 className="text-xl font-bold text-center mb-8">
              Izvēlies kategoriju
            </h2>

            {categories.length === 0 ? (
              <p className="text-center text-slate-500">
                Šajā turnīrā pagaidām nav datu.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map((category) => {
                  const count = leaguePlayers.filter(
                    (player) => player.category === category
                  ).length;

                  return (
                    <button
                      key={category}
                      onClick={() => handleCategorySelect(category)}
                      className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-10 text-center shadow-sm hover:shadow-md transition-all"
                    >
                      <h3 className="text-emerald-600 font-extrabold text-2xl mb-3">
                        {category}
                      </h3>

                      <p className="text-sm text-slate-500">
                        {count} spēlētāji pieejami
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        ) : (
          <section>
            {/* Category header */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <button
                onClick={resetPlayers}
                className="text-xs uppercase text-slate-500 hover:text-emerald-600 font-bold"
              >
                ← Atpakaļ uz kategorijām
              </button>

              <div className="flex items-center gap-4">
                <span className="text-sm font-extrabold text-emerald-600 uppercase">
                  Kategorija: {selectedCategory}
                </span>

                {player1 && player2 && (
                  <button
                    onClick={takeScreenshot}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    📷 Saglabāt attēlu
                  </button>
                )}
              </div>
            </div>

            {player1 && player2 && (
              <div
                ref={captureRef}
                className="bg-slate-100 p-2 rounded-xl"
              >
                {/* Radar */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-8">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <div className="flex gap-6">
                      <span className="text-xs font-bold text-rose-500">
                        🔴 {player1.name} ({player1.team})
                      </span>

                      <span className="text-xs font-bold text-emerald-600">
                        🟢 {player2.name} ({player2.team})
                      </span>
                    </div>

                    <span className="text-xs text-slate-400 uppercase">
                      Percentiles
                    </span>
                  </div>

                  <RadarChart players={[player1, player2]} />
                </div>

                {/* Summary */}
                <ComparisonSummary
                  player1={player1}
                  player2={player2}
                />

                {/* Players */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                  <PlayerCard
                    player={player1}
                    players={categoryPlayers}
                    onChange={handlePlayerChange(setPlayer1)}
                    color="rose"
                  />

                  <PlayerCard
                    player={player2}
                    players={categoryPlayers}
                    onChange={handlePlayerChange(setPlayer2)}
                    color="emerald"
                  />
                </div>

                {/* Captaincy */}
                <CaptaincySimulator
                  player1={player1}
                  player2={player2}
                />
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
