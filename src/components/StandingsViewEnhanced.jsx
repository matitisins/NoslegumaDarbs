import React, { useEffect, useMemo, useState } from "react";

import {
  getCompetitionZones,
  getTableZone,
  valueOrDash,
  getGoalDifference,
  getTeamName,
  getPlayed,
  getWins,
  getDraws,
  getLosses,
  getGoalsFor,
  getGoalsAgainst,
  getTeamId,
  getTeamForm,
} from "../LeagueTableUtils";
import {
  RaceCard,
  LeagueStatistics,
  TeamLogo,
  FormDots,
  MovementBadge,
} from "./LeagueTableComponents";
import TeamDetailModal from "./TeamDetailModal";
import TeamCompareModal from "./TeamCompareModal";

function StandingsViewEnhanced({
  standings,
  fixtures,
  loading,
  error,
  loadStandings,
  competition,
  leagueName,
  season,
}) {
  const [search, setSearch] =
    useState("");

  const [sortBy, setSortBy] =
    useState("position");

  const [selectedTeam, setSelectedTeam] =
    useState(null);

  const [compareTeams, setCompareTeams] =
    useState([]);

  const [previousPositions, setPreviousPositions] =
    useState({});

  useEffect(() => {
    if (!standings.length) return;

    const storageKey =
      `flow-standings-${competition}-${season}`;

    const currentSnapshot =
      Object.fromEntries(
        standings.map(row => [
          String(
            getTeamId(row)
          ),
          Number(
            row?.position ??
              row?.rank
          ),
        ])
      );

    try {
      const previousRaw =
        localStorage.getItem(
          storageKey
        );

      if (previousRaw) {
        const previous =
          JSON.parse(
            previousRaw
          );

        setPreviousPositions(
          previous
        );
      }

      localStorage.setItem(
        storageKey,
        JSON.stringify(
          currentSnapshot
        )
      );
    } catch {
      // localStorage may be unavailable; the table itself still works.
    }
  }, [
    standings,
    competition,
    season,
  ]);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      let rows =
        standings.filter(row => {
          if (!query) return true;

          return (
            getTeamName(row)
              .toLowerCase()
              .includes(query) ||
            String(
              row?.team?.tla ||
                ""
            )
              .toLowerCase()
              .includes(query)
          );
        });

      rows = [...rows].sort(
        (a, b) => {
          if (
            sortBy ===
            "points"
          ) {
            return (
              (Number(
                b?.points
              ) || 0) -
              (Number(
                a?.points
              ) || 0)
            );
          }

          if (
            sortBy ===
            "goals"
          ) {
            return (
              (Number(
                getGoalsFor(
                  b
                )
              ) || 0) -
              (Number(
                getGoalsFor(
                  a
                )
              ) || 0)
            );
          }

          if (
            sortBy ===
            "difference"
          ) {
            return (
              (Number(
                getGoalDifference(
                  b
                )
              ) || 0) -
              (Number(
                getGoalDifference(
                  a
                )
              ) || 0)
            );
          }

          if (
            sortBy ===
            "wins"
          ) {
            return (
              (Number(
                getWins(b)
              ) || 0) -
              (Number(
                getWins(a)
              ) || 0)
            );
          }

          if (
            sortBy ===
            "form"
          ) {
            return (
              getFormLabel(
                getTeamForm(
                  getTeamId(b),
                  fixtures
                )
              ).points -
              getFormLabel(
                getTeamForm(
                  getTeamId(a),
                  fixtures
                )
              ).points
            );
          }

          return (
            (Number(
              a?.position ??
                a?.rank
            ) || 999) -
            (Number(
              b?.position ??
                b?.rank
            ) || 999)
          );
        }
      );

      return rows;
    }, [
      standings,
      fixtures,
      search,
      sortBy,
    ]);

  const raceZones =
    getCompetitionZones(
      competition
    );

  const titleRace =
    standings.slice(
      0,
      Math.min(
        3,
        standings.length
      )
    );

  const europe =
    standings.filter(
      row => {
        const position =
          Number(
            row?.position ??
              row?.rank
          );

        return (
          position >
            raceZones.champions &&
          position <=
            raceZones.conference
        );
      }
    ).slice(0, 4);

  const relegation =
    standings
      .filter(
        row =>
          Number(
            row?.position ??
              row?.rank
          ) >=
          raceZones.relegationStart
      )
      .slice(0, 3);

  const openCompare = row => {
    setCompareTeams(
      current => {
        const exists =
          current.some(
            item =>
              String(
                getTeamId(item)
              ) ===
              String(
                getTeamId(row)
              )
          );

        if (exists) {
          return current.filter(
            item =>
              String(
                getTeamId(item)
              ) !==
              String(
                getTeamId(row)
              )
          );
        }

        if (
          current.length >=
          2
        ) {
          return [
            current[1],
            row,
          ];
        }

        return [
          ...current,
          row,
        ];
      }
    );
  };

  const clearCompare = () =>
    setCompareTeams([]);

  if (error) {
    return (
      <>
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">
            API kļūda
          </p>
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
          <button
            type="button"
            onClick={loadStandings}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
          >
            Mēģināt vēlreiz
          </button>
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-14 text-center shadow-sm">
        <div className="mx-auto h-11 w-11 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />
        <p className="mt-4 text-sm font-bold text-slate-600">
          Ielādē līgas tabulu...
        </p>
        <p className="mt-1 text-xs text-slate-400">
          {leagueName} ·{" "}
          {season}/
          {Number(season) + 1}
        </p>
      </div>
    );
  }

  if (!standings.length) {
    return (
      <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          📊
        </div>

        <h2 className="mt-4 text-lg font-black text-slate-900">
          Tabula nav pieejama
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Izvēlētajai līgai un sezonai API-Football neatgrieza standings datus.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <RaceCard
          title="🏆 Titula cīņa"
          subtitle="Augšgala komandas"
          rows={titleRace}
          color="bg-blue-500"
          emptyText="Nav datu"
          onTeamClick={
            setSelectedTeam
          }
        />

        <RaceCard
          title="🌍 Eiropa"
          subtitle="Eiropas sacensību zonas"
          rows={europe}
          color="bg-emerald-500"
          emptyText="Nav datu"
          onTeamClick={
            setSelectedTeam
          }
        />

        <RaceCard
          title="🔴 Izkrīšana"
          subtitle="Komandas tabulas lejasdaļā"
          rows={relegation}
          color="bg-red-500"
          emptyText="Nav datu"
          onTeamClick={
            setSelectedTeam
          }
        />
      </div>

      <LeagueStatistics
        standings={standings}
        fixtures={fixtures}
      />

      <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex-1">
            <input
              type="search"
              value={search}
              onChange={event =>
                setSearch(
                  event.target.value
                )
              }
              placeholder="🔎 Meklēt komandu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">

            <select
              value={sortBy}
              onChange={event =>
                setSortBy(
                  event.target.value
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-xs font-bold text-slate-700 outline-none"
            >
              <option value="position">
                Kārtot: Pozīcija
              </option>
              <option value="points">
                Kārtot: Punkti
              </option>
              <option value="goals">
                Kārtot: Vārti
              </option>
              <option value="difference">
                Kārtot: GD
              </option>
              <option value="wins">
                Kārtot: Uzvaras
              </option>
              <option value="form">
                Kārtot: Forma
              </option>
            </select>

            {compareTeams.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Salīdzināt{" "}
                {compareTeams.length}/2
              </button>
            )}

          </div>
        </div>

        <p className="mt-2 px-1 text-[8px] font-bold uppercase tracking-wider text-slate-400">
          Noklikšķini uz komandas rindas, lai atvērtu detalizētu analīzi. Salīdzināšanai izmanto pogu komandas detaļās.
        </p>
      </div>

      <div className="mt-5 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[1160px]">

            <div className="grid grid-cols-[58px_minmax(230px,1fr)_65px_55px_55px_55px_65px_65px_70px_65px_175px] items-center border-b border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                #
              </div>

              <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Komanda
              </div>

              {[
                "Sp",
                "U",
                "N",
                "Z",
                "GF",
                "GA",
                "GD",
                "P",
              ].map(label => (
                <div
                  key={label}
                  className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400"
                >
                  {label}
                </div>
              ))}

              <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400" title="Pēdējās 5 spēles">
                Forma (5)
              </div>
            </div>

            {filtered.map(
              (row, index) => {
                const position =
                  row?.position ??
                  row?.rank ??
                  index + 1;

                const zone =
                  getTableZone(
                    position,
                    competition
                  );

                const teamId =
                  getTeamId(row);

                const form =
                  getTeamForm(
                    teamId,
                    fixtures,
                    row
                  );

                const movement =
                  previousPositions[
                    String(
                      teamId
                    )
                  ] !==
                  undefined
                    ? previousPositions[
                        String(
                          teamId
                        )
                      ] -
                      Number(
                        position
                      )
                    : null;

                return (
                  <button
                    type="button"
                    key={
                      teamId ||
                      `${position}-${index}`
                    }
                    onClick={() =>
                      setSelectedTeam(
                        row
                      )
                    }
                    className="grid w-full grid-cols-[58px_minmax(230px,1fr)_65px_55px_55px_55px_65px_65px_70px_65px_175px] items-center border-b border-slate-100 px-4 py-3.5 text-left last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="relative flex items-center justify-center text-center text-sm font-black text-slate-400">
                      <span
                        className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full ${zone.color}`}
                      />

                      <span>
                        {position}
                      </span>

                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                        <MovementBadge
                          movement={
                            movement
                          }
                        />
                      </span>
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <TeamLogo
                        row={row}
                      />

                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {getTeamName(
                            row
                          )}
                        </p>

                        {row?.team
                          ?.tla && (
                          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                            {row.team.tla}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getPlayed(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getWins(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getDraws(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getLosses(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getGoalsFor(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {valueOrDash(
                        getGoalsAgainst(
                          row
                        )
                      )}
                    </div>

                    <div
                      className={`text-center text-sm font-black ${
                        Number(
                          getGoalDifference(
                            row
                          )
                        ) > 0
                          ? "text-emerald-600"
                          : Number(
                              getGoalDifference(
                                row
                              )
                            ) < 0
                          ? "text-rose-500"
                          : "text-slate-700"
                      }`}
                    >
                      {valueOrDash(
                        getGoalDifference(
                          row
                        )
                      )}
                    </div>

                    <div className="text-center text-sm font-black text-slate-950">
                      {valueOrDash(
                        row?.points
                      )}
                    </div>

                    <div className="flex items-center justify-center">
                      <FormDots
                        form={form}
                      />
                    </div>
                  </button>
                );
              }
            )}

          </div>
        </div>

        <ZoneLegend
          competition={competition}
        />

        <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            <span>
              Sp = Spēles
            </span>
            <span>
              U = Uzvaras
            </span>
            <span>
              N = Neizšķirti
            </span>
            <span>
              Z = Zaudējumi
            </span>
            <span>
              GF = Gūtie vārti
            </span>
            <span>
              GA = Ielaistie vārti
            </span>
            <span>
              GD = Vārtu starpība
            </span>
            <span>
              P = Punkti
            </span>
            <span>
              W/D/L = Pēdējās 5 spēles
            </span>
          </div>
        </div>
      </div>

      {selectedTeam && (
        <TeamDetailModal
          row={selectedTeam}
          standings={standings}
          fixtures={fixtures}
          competition={competition}
          season={season}
          movement={
            previousPositions[
              String(
                getTeamId(
                  selectedTeam
                )
              )
            ]
          }
          onClose={() =>
            setSelectedTeam(
              null
            )
          }
          onCompare={() => {
            openCompare(
              selectedTeam
            );
            setSelectedTeam(
              null
            );
          }}
        />
      )}

      {compareTeams.length ===
        2 && (
        <TeamCompareModal
          first={
            compareTeams[0]
          }
          second={
            compareTeams[1]
          }
          standings={
            standings
          }
          fixtures={
            fixtures
          }
          onClose={
            clearCompare
          }
        />
      )}
    </>
  );
}

export default StandingsViewEnhanced;