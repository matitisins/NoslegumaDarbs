/*
 * Nodrošina divu izvēlēto spēlētāju salīdzināšanas skatu.
 * Ļauj izvēlēties spēlētājus, apskatīt viņu statistiku, salīdzināt
 * galvenos rādītājus, aplūkot radara diagrammu un izmantot kapteiņa simulatoru.
 */

import React from "react";

import SearchBox from "../search/SearchBox";
import PlayerCard from "../player/PlayerCard";

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
    CATEGORIES?.[selectedCategory];

  const categoryName =
    CATEGORY_NAMES?.[selectedCategory] ||
    categoryInfo?.name ||
    selectedCategory ||
    "Spēlētāji";

  const handleSelect1 = player => {
    if (!player) return;

    setPlayer1?.(player);
    setPlayerSearch1?.("");
  };

  const handleSelect2 = player => {
    if (!player) return;

    setPlayer2?.(player);
    setPlayerSearch2?.("");
  };

  const handlePlayer1Change = event => {
    const id = event.target.value;

    const selected =
      categoryPlayers.find(
        player =>
          String(player.id) ===
          String(id)
      );

    if (selected) {
      setPlayer1?.(selected);
    }
  };

  const handlePlayer2Change = event => {
    const id = event.target.value;

    const selected =
      categoryPlayers.find(
        player =>
          String(player.id) ===
          String(id)
      );

    if (selected) {
      setPlayer2?.(selected);
    }
  };

  return (
    <section>
      {/* HEADER */}

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
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
          Spēlētāju salīdzināšana
        </p>

        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          {categoryName}
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Salīdzini divus spēlētājus pēc
          statistikas, formas, radara un
          kapteiņa simulācijas.
        </p>
      </div>

      {/* PLAYER SELECTION */}

      <div className="grid gap-6 lg:grid-cols-2">
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

          {player1 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  openPlayer?.(player1)
                }
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-emerald-500"
              >
                Skatīt individuālo
                statistiku →
              </button>
            </div>
          )}

          <PlayerCard
            player={player1}
            players={categoryPlayers}
            onChange={handlePlayer1Change}
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

          {player2 && (
            <div className="mb-3 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  openPlayer?.(player2)
                }
                className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-emerald-500"
              >
                Skatīt individuālo
                statistiku →
              </button>
            </div>
          )}

          <PlayerCard
            player={player2}
            players={categoryPlayers}
            onChange={handlePlayer2Change}
            color="emerald"
          />
        </div>
      </div>

      {/* COMPARISON CONTENT */}

      {player1 && player2 ? (
        <>
          <div className="mt-8">
            <ComparisonSummary
              player1={player1}
              player2={player2}
            />
          </div>

          {/* RADAR */}

          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                Statistikas profils
              </p>

              <h2 className="mt-1 text-xl font-black text-slate-900">
                Spēlētāju radars
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Relatīvs salīdzinājums starp
                izvēlētās kategorijas
                spēlētājiem.
              </p>
            </div>

            <div className="min-h-[320px]">
              <RadarChart
                player1={player1}
                player2={player2}
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
        </>
      ) : (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            ⚖️
          </div>

          <h2 className="mt-4 text-lg font-black text-slate-900">
            Izvēlies divus spēlētājus
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Izmanto meklēšanas laukus, lai
            izvēlētos spēlētājus, kurus
            vēlies salīdzināt.
          </p>
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