import React from "react";

import FavoriteCard from "../comparison/FavoriteCard";

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
        <circle
          cx="9"
          cy="8"
          r="3"
        />

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
      <circle
        cx="12"
        cy="12"
        r="8.5"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CategoryIcon({
  category,
}) {
  const info =
    CATEGORIES?.[category];

  const iconClass =
    info?.color === "rose"
      ? "bg-rose-50 text-rose-500"
      : info?.color === "emerald"
      ? "bg-emerald-50 text-emerald-600"
      : info?.color === "blue"
      ? "bg-blue-50 text-blue-600"
      : "bg-amber-50 text-amber-600";

  return (
    <div
      className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${iconClass}`}
    >
      {info?.icon || "◆"}
    </div>
  );
}

function getAccent(category) {
  const color =
    CATEGORIES?.[category]?.color;

  if (color === "rose") {
    return "bg-rose-400";
  }

  if (color === "blue") {
    return "bg-blue-500";
  }

  if (color === "amber") {
    return "bg-amber-400";
  }

  return "bg-emerald-500";
}

function getLeagueName(
  selectedLeague
) {
  return (
    LEAGUES.find(
      ([code]) =>
        code === selectedLeague
    )?.[1] ||
    selectedLeague
  );
}

export default function HomePage({
  selectedSeason = "2026/2027",
  selectedLeague = "PL",

  setSelectedSeason,
  setSelectedLeague,

  leaguePlayers = [],

  loading = false,
  error = "",

  progress = {
    current: 0,
    total: 1,
  },

  categories = [],

  favorites = [],

  onCategorySelect,
  onFavoriteOpen,
  onToggleFavorite,
  onRefresh,
}) {
  const visibleCategories =
    categories.length
      ? categories
      : CATEGORY_ORDER.filter(
          category =>
            leaguePlayers.some(
              player =>
                player.category ===
                category
            )
        );

  const totalPlayers =
    leaguePlayers.length;

  const leagueName =
    getLeagueName(
      selectedLeague
    );

  const total =
    progress?.total || 1;

  const current =
    progress?.current || 0;

  const progressPercent =
    Math.min(
      100,
      Math.round(
        (current / total) * 100
      )
    );

  return (
    <>
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm md:px-9 md:py-10">
        <div className="relative z-10 max-w-3xl">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-emerald-300">
            Flow Football Analytics
          </p>

          <h1 className="mt-3 text-3xl font-black tracking-tight md:text-5xl">
            Salīdzini spēlētājus.
            <br />
            Analizē statistiku.
          </h1>

          <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400 md:text-base">
            Izvēlies līgu, sezonu un
            spēlētāju pozīciju, lai
            salīdzinātu futbolistu
            statistiku vienā vietā.
          </p>
        </div>

        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />
      </section>

      <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
              Datu izvēle
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-900">
              Izvēlies līgu un sezonu
            </h2>
          </div>

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Ielādē..."
                : "↻ Atjaunot datus"}
            </button>
          )}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Līga
            </span>

            <select
              value={selectedLeague}
              onChange={event =>
                setSelectedLeague?.(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              {LEAGUES.map(
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
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Sezona
            </span>

            <select
              value={selectedSeason}
              onChange={event =>
                setSelectedSeason?.(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none transition focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            >
              <option value="2026/2027">
                2026/2027
              </option>

              <option value="2025/2026">
                2025/2026
              </option>

              <option value="2024/2025">
                2024/2025
              </option>

              <option value="2023/2024">
                2023/2024
              </option>

              <option value="2022/2023">
                2022/2023
              </option>
            </select>
          </label>
        </div>

        {loading && (
          <div className="mt-5 rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="text-xs font-bold text-slate-600">
                Ielādē {leagueName}{" "}
                datus...
              </p>

              <span className="text-xs font-black text-emerald-600">
                {progressPercent}%
              </span>
            </div>

            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          </div>
        )}

        {error && !loading && (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <p className="text-xs font-extrabold text-rose-700">
              Neizdevās ielādēt datus
            </p>

            <p className="mt-1 text-xs leading-5 text-rose-600">
              {error}
            </p>
          </div>
        )}
      </section>

      {!error && (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <StatIcon type="players" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Spēlētāji
              </span>
            </div>

            <p className="mt-4 text-2xl font-black text-slate-900">
              {totalPlayers}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              pieejami spēlētāji
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <StatIcon type="leagues" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Turnīri
              </span>
            </div>

            <p className="mt-4 text-2xl font-black text-slate-900">
              5
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Eiropas līgas
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <StatIcon type="time" />
              </div>

              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sezona
              </span>
            </div>

            <p className="mt-4 text-2xl font-black text-slate-900">
              {selectedSeason}
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {leagueName}
            </p>
          </div>
        </section>
      )}

      {!loading &&
        !error &&
        favorites.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-500">
                  Tavi spēlētāji
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-900">
                  Favorīti
                </h2>
              </div>

              <span className="rounded-full bg-amber-50 px-3 py-1.5 text-[10px] font-bold text-amber-600">
                {favorites.length}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              {favorites.map(
                player => (
                  <FavoriteCard
                    key={player.id}
                    player={player}
                    onOpen={
                      onFavoriteOpen
                    }
                    onToggleFavorite={
                      onToggleFavorite
                    }
                  />
                )
              )}
            </div>
          </section>
        )}

      <section className="mt-8">
        <div className="mb-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
            Salīdzināšana
          </p>

          <h2 className="mt-1 text-xl font-black text-slate-900">
            Izvēlies spēlētāju kategoriju
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Izvēlies pozīciju, lai sāktu
            salīdzināšanu.
          </p>
        </div>

        {!loading &&
        !error &&
        visibleCategories.length ===
          0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-bold text-slate-600">
              Šajā turnīrā pašlaik nav
              pieejamu spēlētāju datu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visibleCategories.map(
              category => {
                const info =
                  CATEGORIES?.[
                    category
                  ];

                const count =
                  leaguePlayers.filter(
                    player =>
                      player.category ===
                      category
                  ).length;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      onCategorySelect?.(
                        category
                      )
                    }
                    disabled={
                      loading ||
                      count < 1
                    }
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <div
                      className={`absolute left-0 top-0 h-full w-1 ${getAccent(
                        category
                      )}`}
                    />

                    <div className="flex items-start justify-between">
                      <CategoryIcon
                        category={
                          category
                        }
                      />

                      <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                        ● {count}{" "}
                        spēlētāji
                      </span>
                    </div>

                    <h3 className="mt-5 text-xl font-extrabold text-slate-900">
                      {info?.name ||
                        category}
                    </h3>

                    <p className="mt-2 text-sm leading-5 text-slate-500">
                      {info?.desc ||
                        ""}
                    </p>

                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {info?.tag ||
                          ""}
                      </span>

                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </button>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-7">
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <span className="h-5 w-1 rounded-full bg-slate-900" />

            <h2 className="text-lg font-extrabold text-slate-900">
              Kā darbojas Flow?
            </h2>
          </div>

          <p className="mt-1.5 text-sm text-slate-500">
            Četri vienkārši soļi līdz
            spēlētāju salīdzinājumam.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-4">
          {[
            [
              "01",
              "Izvēlies līgu",
              "Izvēlies līgu un sezonu.",
            ],
            [
              "02",
              "Izvēlies pozīciju",
              "Izvēlies spēlētāju kategoriju.",
            ],
            [
              "03",
              "Salīdzini",
              "Izvēlies divus spēlētājus.",
            ],
            [
              "04",
              "Analizē",
              "Apskati statistiku un radaru.",
            ],
          ].map(
            ([number, title, text]) => (
              <div
                key={number}
                className="rounded-xl bg-slate-50 p-4"
              >
                <span className="text-[10px] font-black tracking-widest text-emerald-500">
                  {number}
                </span>

                <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                  {title}
                </h3>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  {text}
                </p>
              </div>
            )
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Data provided by
            football-data.org
          </p>

          <p className="text-[10px] text-slate-400">
            {leagueName} ·{" "}
            {selectedSeason}
          </p>
        </div>
      </section>
    </>
  );
}