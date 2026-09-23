/*
 * Attēlo Flow lietotnes sākumlapu ar līgas un sezonas izvēli,
 * pieejamo spēlētāju statistiku, spēlētāju kategorijām un favorītiem.
 * Nodrošina pāreju uz izvēlētās kategorijas salīdzināšanu un spēlētāju profiliem.
 */

import React from "react";
import FavoriteCard from "./FavoriteCard";

import {
  LEAGUES,
  CATEGORIES,
  CATEGORY_ORDER,
} from "../config/flow";

function StatIcon({ type }) {
  if (type === "players") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 20c.5-3.4 2.2-5 5.5-5s5 1.6 5.5 5" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8" />
        <path d="M17 15c2.2.4 3.5 2 4 5" />
      </svg>
    );
  }

  if (type === "leagues") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M8 17h8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CategoryIcon({ category }) {
  const info = CATEGORIES[category];

  const iconClass =
    info?.color === "rose"
      ? "bg-rose-50 text-rose-500"
      : info?.color === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : info?.color === "blue"
      ? "bg-blue-50 text-blue-600"
      : "bg-violet-50 text-violet-600";

  return (
    <div
      className={`flex h-11 w-11 items-center justify-center rounded-2xl ${iconClass}`}
    >
      {category === "STRIKERS" && (
        <span className="text-lg">⚽</span>
      )}

      {category === "MIDFIELDERS" && (
        <span className="text-lg">◈</span>
      )}

      {category === "DEFENDERS" && (
        <span className="text-lg">◆</span>
      )}

      {category === "GOALKEEPERS" && (
        <span className="text-lg">▣</span>
      )}
    </div>
  );
}

function getLeagueName(selectedLeague) {
  const league = LEAGUES?.[selectedLeague];

  if (typeof league === "string") {
    return league;
  }

  return (
    league?.name ||
    league?.label ||
    selectedLeague ||
    "Premier League"
  );
}

function getCategoryName(category) {
  const info = CATEGORIES?.[category];

  return (
    info?.name ||
    info?.label ||
    category ||
    "Spēlētāji"
  );
}

export default function HomePage({
  selectedLeague = "PL",
  selectedSeason = "2026/2027",
  setSelectedLeague,
  setSelectedSeason,
  players = [],
  leaguePlayers = [],
  categories = [],
  totalPlayers,
  favorites = [],
  onCategorySelect,
  onPlayerOpen,
  onToggleFavorite,
}) {
  const availablePlayers =
    Array.isArray(players) && players.length
      ? players
      : Array.isArray(leaguePlayers)
      ? leaguePlayers
      : [];

  const playerCount =
    typeof totalPlayers === "number"
      ? totalPlayers
      : availablePlayers.length;

  const categoryList =
    Array.isArray(categories) &&
    categories.length
      ? categories
      : CATEGORY_ORDER.filter(category =>
          availablePlayers.some(
            player =>
              player?.category === category
          )
        );

  const favoriteList = Array.isArray(
    favorites
  )
    ? favorites
    : [];

  const leagueName =
    getLeagueName(selectedLeague);

  const seasons = [
    "2026/2027",
    "2025/2026",
    "2024/2025",
    "2023/2024",
    "2022/2023",
  ];

  const leagueOptions = [
    ["PL", "Premier League"],
    ["PD", "La Liga"],
    ["SA", "Serie A"],
    ["BL1", "Bundesliga"],
    ["FL1", "Ligue 1"],
  ];

  return (
    <section className="pt-6">
      {/* HERO */}
      <div className="mb-7 rounded-3xl bg-slate-950 p-7 text-white shadow-sm sm:p-9">
        <div className="max-w-2xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
            Football Analytics
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Salīdzini futbola spēlētājus
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-slate-400">
            Izvēlies līgu un sezonu, pēc tam
            salīdzini spēlētājus pēc statistikas,
            formas un citiem rādītājiem.
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="mb-7 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-5 md:grid-cols-2">
          {/* LEAGUE */}
          <div>
            <label
              htmlFor="flow-home-league"
              className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Turnīrs
            </label>

            <select
              id="flow-home-league"
              value={selectedLeague}
              onChange={event =>
                setSelectedLeague?.(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {leagueOptions.map(
                ([code, name]) => (
                  <option
                    key={code}
                    value={code}
                  >
                    {name}
                  </option>
                )
              )}
            </select>
          </div>

          {/* SEASON */}
          <div>
            <label
              htmlFor="flow-home-season"
              className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Sezona
            </label>

            <select
              id="flow-home-season"
              value={selectedSeason}
              onChange={event =>
                setSelectedSeason?.(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition hover:border-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {seasons.map(season => (
                <option
                  key={season}
                  value={season}
                >
                  {season}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* STATS */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <StatIcon type="players" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Spēlētāji
            </span>
          </div>

          <p className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            {playerCount}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            pieejami spēlētāji
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <StatIcon type="leagues" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Turnīri
            </span>
          </div>

          <p className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            5
          </p>

          <p className="mt-1 text-sm text-slate-400">
            Eiropas līgas
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
              <StatIcon type="season" />
            </div>

            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sezona
            </span>
          </div>

          <p className="mt-6 text-3xl font-black tracking-tight text-slate-950">
            {selectedSeason}
          </p>

          <p className="mt-1 text-sm text-slate-400">
            {leagueName}
          </p>
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="mb-8">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Spēlētāju kategorijas
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Izvēlies pozīciju
            </h2>
          </div>

          <p className="hidden text-xs text-slate-400 sm:block">
            {playerCount} spēlētāji
          </p>
        </div>

        {categoryList.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {categoryList.map(category => {
              const categoryPlayers =
                availablePlayers.filter(
                  player =>
                    player?.category ===
                    category
                );

              const info =
                CATEGORIES?.[category];

              return (
                <button
                  key={category}
                  type="button"
                  onClick={() =>
                    onCategorySelect?.(
                      category
                    )
                  }
                  className="group rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-4">
                    <CategoryIcon
                      category={category}
                    />

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black text-slate-500">
                      {categoryPlayers.length}
                    </span>
                  </div>

                  <h3 className="mt-5 text-lg font-black text-slate-950">
                    {getCategoryName(
                      category
                    )}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-400">
                    {info?.description ||
                      "Apskati un salīdzini šīs kategorijas spēlētājus."}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs font-bold text-emerald-600">
                    Salīdzināt
                    <span className="transition group-hover:translate-x-1">
                      →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
              ⚽
            </div>

            <h3 className="mt-4 font-black text-slate-900">
              Nav pieejamu spēlētāju
            </h3>

            <p className="mt-1 text-sm text-slate-400">
              Izvēlies citu līgu vai sezonu.
            </p>
          </div>
        )}
      </div>

      {/* FAVORITES */}
      {favoriteList.length > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500">
              Tavi spēlētāji
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
              Favorīti
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favoriteList.map(player => (
              <FavoriteCard
                key={player.id}
                player={player}
                onOpen={() =>
                  onPlayerOpen?.(
                    player
                  )
                }
                isFavorite={true}
                onToggleFavorite={() =>
                  onToggleFavorite?.(
                    player
                  )
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* DATA SOURCE */}
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Data provided by football-data.org
        </p>

        <p className="text-[10px] text-slate-400">
          {leagueName} · {selectedSeason}
        </p>
      </div>
    </section>
  );
}