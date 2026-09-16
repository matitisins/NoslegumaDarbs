import React from "react";

import SearchBox from "./SearchBox";
import PlayerCard from "./PlayerCard";
import RadarChart from "./RadarChart";
import ComparisonSummary from "./ComparisonSummary";
import CaptaincySimulator from "./CaptaincySimulator";

import {
  CATEGORY_NAMES,
  CATEGORIES,
} from "../config/flow";

export default function ComparisonPage({
  selectedCategory,
  player1,
  player2,
  categoryPlayers = [],
  playerSearch1 = "",
  playerSearch2 = "",
  setPlayerSearch1,
  setPlayerSearch2,
  setPlayer1,
  setPlayer2,
  isFavorite,
  toggleFavorite,
  openPlayer,
  resetPlayers,
  fdr1 = 3,
  fdr2 = 3,
  fdrLoading = false,
  takeScreenshot,
}) {
  const categoryInfo =
    CATEGORIES[selectedCategory];

  const categoryName =
    CATEGORY_NAMES[selectedCategory] ||
    categoryInfo?.name ||
    selectedCategory ||
    "Spēlētāji";

  const handleSelect1 = player => {
    setPlayer1(player);
    setPlayerSearch1?.("");
  };

  const handleSelect2 = player => {
    setPlayer2(player);
    setPlayerSearch2?.("");
  };

  return (
    <section>
      {/* PAGE HEADER */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={resetPlayers}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-emerald-600"
        >
          <span className="transition group-hover:-translate-x-0.5">
            ←
          </span>

          Atpakaļ
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {categoryName}
          </span>

          {player1 && player2 && (
            <button
              type="button"
              onClick={takeScreenshot}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              📷 Saglabāt attēlu
            </button>
          )}
        </div>
      </div>

      {/* TITLE */}
      <div className="mb-7">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
          Spēlētāju salīdzinājums
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          {categoryName}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Salīdzini divus spēlētājus pēc pieejamajiem
          sezonas statistikas datiem.
        </p>
      </div>

      {!player1 || !player2 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
            ⚽
          </div>

          <h2 className="mt-4 text-lg font-extrabold text-slate-900">
            Nav pietiekami daudz spēlētāju
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            Šajā kategorijā nav pietiekami daudz spēlētāju
            salīdzināšanai.
          </p>

          <button
            type="button"
            onClick={resetPlayers}
            className="mt-5 rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-slate-800"
          >
            Atgriezties
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-slate-100 p-2">
          {/* CAPTURE AREA */}
          <div
            id="flow-comparison"
            className="rounded-2xl bg-slate-100"
          >
            {/* RADAR */}
            <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex flex-wrap gap-5">
                  <button
                    type="button"
                    onClick={() =>
                      openPlayer(player1)
                    }
                    className="text-xs font-bold text-rose-500 hover:underline"
                  >
                    🔴 {player1.name}{" "}
                    <span className="font-medium text-slate-400">
                      ({player1.team})
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      openPlayer(player2)
                    }
                    className="text-xs font-bold text-emerald-600 hover:underline"
                  >
                    🟢 {player2.name}{" "}
                    <span className="font-medium text-slate-400">
                      ({player2.team})
                    </span>
                  </button>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Position percentile
                </span>
              </div>

              <RadarChart
                players={[
                  player1,
                  player2,
                ]}
              />
            </div>

            {/* SUMMARY */}
            <ComparisonSummary
              player1={player1}
              player2={player2}
            />

            {/* PLAYER SEARCH + CARDS */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* PLAYER 1 */}
              <div>
                <SearchBox
                  value={playerSearch1}
                  onChange={setPlayerSearch1}
                  players={categoryPlayers}
                  selected={player1}
                  onSelect={handleSelect1}
                  onOpen={openPlayer}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  color="rose"
                  label="Meklēt pirmo spēlētāju"
                />

                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      openPlayer(player1)
                    }
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500"
                  >
                    Skatīt individuālo statistiku →
                  </button>
                </div>

                <PlayerCard
                  player={player1}
                  players={categoryPlayers}
                  onChange={event => {
                    const id =
                      event.target.value;

                    const selected =
                      categoryPlayers.find(
                        item =>
                          String(item.id) ===
                          String(id)
                      );

                    if (selected) {
                      setPlayer1(selected);
                    }
                  }}
                  color="rose"
                />
              </div>

              {/* PLAYER 2 */}
              <div>
                <SearchBox
                  value={playerSearch2}
                  onChange={setPlayerSearch2}
                  players={categoryPlayers}
                  selected={player2}
                  onSelect={handleSelect2}
                  onOpen={openPlayer}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  color="emerald"
                  label="Meklēt otro spēlētāju"
                />

                <div className="mb-3 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      openPlayer(player2)
                    }
                    className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-500"
                  >
                    Skatīt individuālo statistiku →
                  </button>
                </div>

                <PlayerCard
                  player={player2}
                  players={categoryPlayers}
                  onChange={event => {
                    const id =
                      event.target.value;

                    const selected =
                      categoryPlayers.find(
                        item =>
                          String(item.id) ===
                          String(id)
                      );

                    if (selected) {
                      setPlayer2(selected);
                    }
                  }}
                  color="emerald"
                />
              </div>
            </div>

            {/* CAPTAINCY */}
            <div className="mt-8">
              <CaptaincySimulator
                player1={player1}
                player2={player2}
                fdr1={fdr1}
                fdr2={fdr2}
                loading={fdrLoading}
              />
            </div>
          </div>
        </div>
      )}

      <div className="mt-7 border-t border-slate-200 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Data provided by football-data.org
        </p>
      </div>
    </section>
  );
}