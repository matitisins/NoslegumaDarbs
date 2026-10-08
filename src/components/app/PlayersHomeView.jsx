import React from "react";

import {
  LEAGUES,
} from "./AppConstants";
import {
  Stat,
  CategoryCard,
  FavoriteCard,
} from "./AppComponents";

export default function PlayersHomeView({
  leagueName,
  selectedSeason,
  leaguePlayers,
  favorites,
  categories,
  setSelectedCategory,
  setPlayer1,
  setPlayer2,
  setActiveView,
  selectCategory,
  openPlayer,
  toggleFavorite,
  setIsGuideOpen,
}) {
  return (
            <>
              {/* HERO */}
              <section className="relative mb-8 overflow-hidden rounded-[32px] bg-slate-950 shadow-2xl">
                <div className="absolute -right-24 -top-32 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl" />
                <div className="absolute -bottom-40 right-1/4 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
                <div className="absolute right-0 top-0 hidden h-full w-[46%] overflow-hidden md:block">
                  <div className="absolute right-10 top-12 h-72 w-72 rounded-full border border-emerald-400/10" />
                  <div className="absolute right-24 top-24 h-48 w-48 rounded-full border border-white/5" />

                  <div className="absolute right-20 top-20 w-64 rotate-[-12deg] rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-2xl backdrop-blur-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                        Flow Player
                      </span>

                      <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">
                        {leagueName}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-sm font-black text-white">
                        {leaguePlayers[0]?.name
                          ?.split(" ")
                          .map(x => x[0])
                          .slice(0, 2)
                          .join("")
                          .toUpperCase() || "FL"}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-white">
                          {leaguePlayers[0]?.name || "Top Player"}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          {leaguePlayers[0]?.team || "Football Analytics"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      <div className="rounded-xl bg-white/5 p-2">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">
                          Goals
                        </p>

                        <p className="mt-1 text-sm font-black text-white">
                          {leaguePlayers[0]?.goals ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white/5 p-2">
                        <p className="text-[9px] uppercase tracking-wider text-slate-500">
                          Assists
                        </p>

                        <p className="mt-1 text-sm font-black text-white">
                          {leaguePlayers[0]?.assists ?? 0}
                        </p>
                      </div>

                      <div className="rounded-xl bg-emerald-400/10 p-2">
                        <p className="text-[9px] uppercase tracking-wider text-emerald-300">
                          Points
                        </p>

                        <p className="mt-1 text-sm font-black text-emerald-300">
                          {leaguePlayers[0]?.points ?? 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-12 right-44 w-44 rotate-[7deg] rounded-2xl border border-white/10 bg-slate-900/90 p-3 shadow-xl backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500">
                        Live data
                      </span>

                      <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        API
                      </span>
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-4/5 rounded-full bg-emerald-400" />
                    </div>

                    <p className="mt-2 text-[9px] text-slate-500">
                      {leaguePlayers.length} spēlētāji analizēti
                    </p>
                  </div>
                </div>

                <div className="relative z-10 max-w-3xl px-7 py-10 md:px-12 md:py-12">
                  <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Football Analytics
                  </span>

                  <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-white md:text-6xl">
                    Analizē futbolu.
                    <br />
                    <span className="text-emerald-400">
                      Atrodi labāko.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
                    Salīdzini spēlētājus, analizē komandas, izpēti līgas un veido Fantasy sastāvus, izmantojot statistiku un Flow analītikas rīkus.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory("STRIKERS");

                        const players =
                          leaguePlayers.filter(
                            p =>
                              p.category ===
                              "STRIKERS"
                          );

                        setPlayer1(
                          players[0] || null
                        );

                        setPlayer2(
                          players[1] ||
                            players[0] ||
                            null
                        );
                      }}
                      className="rounded-xl bg-emerald-400 px-4 py-2.5 text-xs font-black text-slate-950 shadow-lg shadow-emerald-500/10 transition hover:bg-emerald-300"
                    >
                      Sākt spēlētāju analīzi →
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setActiveView(
                          "analytics-tools"
                        )
                      }
                      className="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-white/10"
                    >
                      Atvērt Analytics Tools
                    </button>
                  </div>

                  <div className="mt-7 flex flex-wrap gap-2">
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Turnīrs{" "}
                      <b className="ml-1 text-white">
                        {leagueName}
                      </b>
                    </span>

                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Sezona{" "}
                      <b className="ml-1 text-white">
                        {selectedSeason}
                      </b>
                    </span>

                    <span className="rounded-xl border border-emerald-400/10 bg-emerald-400/5 px-3 py-2 text-xs font-semibold text-emerald-300">
                      ● Dati ielādēti
                    </span>
                  </div>
                </div>
              </section>

              {/* OVERVIEW STATS */}
              <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Stat
                  icon="♟"
                  title="Datubāze"
                  value={leaguePlayers.length}
                  text="pieejami spēlētāji"
                  color="emerald"
                />

                <Stat
                  icon="★"
                  title="Favorīti"
                  value={favorites.length}
                  text="saglabāti spēlētāji"
                  color="blue"
                />

                <Stat
                  icon="◈"
                  title="Līgas"
                  value={LEAGUES.length}
                  text="pieejamas analīzei"
                  color="violet"
                />

                <Stat
                  icon="◷"
                  title="Profili"
                  value="4"
                  text="spēlētāju pozīcijas"
                  color="amber"
                />
              </section>

              {/* QUICK ACTIONS */}
              <section className="mb-10">
                <div className="mb-5 flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-emerald-500" />

                      <h2 className="text-xl font-extrabold text-slate-900">
                        Ātrā piekļuve
                      </h2>
                    </div>

                    <p className="mt-1.5 text-sm text-slate-500">
                      Ātri pārej uz svarīgākajām Flow funkcijām.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <button
                    type="button"
                    onClick={() =>
                      selectCategory("STRIKERS")
                    }
                    className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-rose-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-lg text-rose-500">
                        ⚔
                      </div>

                      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-rose-500">
                        →
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-900">
                      Player Comparison
                    </h3>

                    <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                      Izvēlies spēlētāju pozīciju, apskati statistiku un salīdzini divus spēlētājus.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveView(
                        "analytics-tools"
                      )
                    }
                    className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600">
                        ⚽
                      </div>

                      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-500">
                        →
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-900">
                      Fantasy & Analytics
                    </h3>

                    <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                      Izmanto Player Recommendations, Custom Ranking un Fantasy Team Builder rīkus.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveView(
                        "league-tables"
                      )
                    }
                    className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-lg text-blue-600">
                        📋
                      </div>

                      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-500">
                        →
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-900">
                      League Tables
                    </h3>

                    <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                      Apskati līgas tabulu, Top Scorers, spēles un jaunākos rezultātus.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveView("teams")
                    }
                    className="group rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-lg text-violet-600">
                        🏟
                      </div>

                      <span className="text-lg text-slate-300 transition group-hover:translate-x-1 group-hover:text-violet-500">
                        →
                      </span>
                    </div>

                    <h3 className="mt-5 text-lg font-black text-slate-900">
                      Team Analysis
                    </h3>

                    <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
                      Izpēti komandas un pārej uz detalizētāku komandu analīzi.
                    </p>
                  </button>
                </div>
              </section>

              {/* FEATURED PLAYERS */}
              {leaguePlayers.length > 0 && (
                <section className="mb-10">
                  <div className="mb-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-amber-400" />

                        <h2 className="text-xl font-extrabold text-slate-900">
                          Top spēlētāji
                        </h2>
                      </div>

                      <p className="mt-1.5 text-sm text-slate-500">
                        Spēlētāji ar augstāko Flow punktu skaitu izvēlētajā līgā.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        selectCategory("STRIKERS")
                      }
                      className="text-xs font-bold text-slate-400 hover:text-emerald-600"
                    >
                      Atvērt spēlētājus →
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {[...leaguePlayers]
                      .sort(
                        (a, b) =>
                          Number(b.flowPoints || 0) -
                          Number(a.flowPoints || 0)
                      )
                      .slice(0, 6)
                      .map((player, index) => (
                        <button
                          key={player.id}
                          type="button"
                          onClick={() =>
                            openPlayer(player)
                          }
                          className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-[10px] font-black text-white">
                            {String(index + 1).padStart(
                              2,
                              "0"
                            )}
                          </div>

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
                            {player.name
                              ?.split(" ")
                              .map(x => x[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-slate-900 group-hover:text-emerald-600">
                              {player.name}
                            </p>

                            <p className="truncate text-xs text-slate-400">
                              {player.team} ·{" "}
                              {player.positionLabel}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-base font-black text-emerald-600">
                              {player.flowPoints ?? 0}
                            </p>

                            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                              pts
                            </p>
                          </div>
                        </button>
                      ))}
                  </div>
                </section>
              )}

              {/* LEAGUE SNAPSHOT */}
              <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-blue-500" />

                      <h2 className="text-lg font-extrabold text-slate-900">
                        Līgas pārskats
                      </h2>
                    </div>

                    <p className="mt-1.5 text-sm text-slate-500">
                      Ātrs pārskats par pašlaik izvēlēto{" "}
                      {leagueName} sezonu.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setActiveView(
                        "league-tables"
                      )
                    }
                    className="shrink-0 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800"
                  >
                    Skatīt līgas tabulu →
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Spēlētāji
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {leaguePlayers.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Vārti
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {leaguePlayers.reduce(
                        (sum, player) =>
                          sum +
                          Number(
                            player.goals || 0
                          ),
                        0
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      Assistenti
                    </p>

                    <p className="mt-1 text-xl font-black text-slate-900">
                      {leaguePlayers.reduce(
                        (sum, player) =>
                          sum +
                          Number(
                            player.assists || 0
                          ),
                        0
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-emerald-50 p-4">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      Sezona
                    </p>

                    <p className="mt-1 text-xl font-black text-emerald-700">
                      {selectedSeason}
                    </p>
                  </div>
                </div>
              </section>

              {/* FAVORITES */}
              {favorites.length > 0 && (
                <section className="mb-10">
                  <div className="mb-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-amber-400" />

                        <h2 className="text-xl font-extrabold text-slate-900">
                          Mani favorīti
                        </h2>
                      </div>

                      <p className="mt-1.5 text-sm text-slate-500">
                        Noklikšķini uz spēlētāja, lai apskatītu viņa individuālo statistiku.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-400">
                      {favorites.length}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {favorites.map(player => (
                      <FavoriteCard
                        key={player.id}
                        player={player}
                        onOpen={openPlayer}
                        onToggleFavorite={
                          toggleFavorite
                        }
                      />
                    ))}
                  </div>
                </section>
              )}

              {/* POSITION EXPLORER */}
              <section className="mb-10">
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-emerald-500" />

                    <h2 className="text-xl font-extrabold text-slate-900">
                      Izpēti spēlētājus
                    </h2>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Izvēlies pozīciju un sāc spēlētāju salīdzināšanu.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {categories.map(category => (
                    <CategoryCard
                      key={category}
                      category={category}
                      count={
                        leaguePlayers.filter(
                          p =>
                            p.category ===
                            category
                        ).length
                      }
                      onClick={() =>
                        selectCategory(category)
                      }
                    />
                  ))}
                </div>
              </section>

              {/* HOW FLOW WORKS */}
              <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="h-5 w-1 rounded-full bg-slate-900" />

                      <h2 className="text-lg font-extrabold text-slate-900">
                        Kā darbojas Flow?
                      </h2>
                    </div>

                    <p className="mt-1 text-sm text-slate-500">
                      Četri vienkārši soļi no datiem līdz spēlētāju salīdzinājumam.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsGuideOpen(true)
                    }
                    className="text-xs font-bold text-slate-400 hover:text-emerald-600"
                  >
                    Pilnais ceļvedis →
                  </button>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  {[
                    [
                      "01",
                      "Izvēlies līgu",
                      "Izvēlies turnīru un sezonu, kuru vēlies analizēt.",
                    ],
                    [
                      "02",
                      "Atrodi spēlētāju",
                      "Izvēlies pozīciju vai izmanto meklēšanu pēc vārda un kluba.",
                    ],
                    [
                      "03",
                      "Analizē",
                      "Apskati statistiku, formu, Fantasy punktus un spēlētāja profilu.",
                    ],
                    [
                      "04",
                      "Salīdzini",
                      "Izmanto Flow salīdzināšanas un analītikas rīkus.",
                    ],
                  ].map(
                    ([number, title, text], index) => (
                      <div
                        key={number}
                        className="flex gap-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
                            index === 0
                              ? "bg-slate-900"
                              : index === 1
                              ? "bg-emerald-500"
                              : index === 2
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {number}
                        </div>

                        <div>
                          <h3 className="text-sm font-bold text-slate-900">
                            {title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {text}
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </>

  );
}