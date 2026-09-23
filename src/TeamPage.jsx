import React, { useEffect, useMemo, useState } from "react";

import {
  fetchTeams,
  fetchTeamStatistics,
  fetchHeadToHead,
} from "./services/apiSports";

function StatCard({ label, value, sub = "" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-2xl font-black text-slate-900">
        {value === null ||
        value === undefined ||
        value === ""
          ? "—"
          : value}
      </p>

      {sub && (
        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          {sub}
        </p>
      )}
    </div>
  );
}

function TeamSelect({
  label,
  value,
  teams,
  onChange,
  accent = "emerald",
}) {
  const isRose = accent === "rose";

  return (
    <div
      className={`rounded-2xl border ${
        isRose
          ? "border-rose-200"
          : "border-emerald-200"
      } bg-white p-4 shadow-sm`}
    >
      <label className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
        {label}
      </label>

      <select
        value={value || ""}
        onChange={event =>
          onChange(
            event.target.value
              ? Number(event.target.value)
              : null
          )
        }
        className={`mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:ring-2 ${
          isRose
            ? "focus:border-rose-400 focus:ring-rose-100"
            : "focus:border-emerald-400 focus:ring-emerald-100"
        }`}
      >
        <option value="">
          Izvēlies komandu...
        </option>

        {teams.map(team => (
          <option
            key={team.id}
            value={team.id}
          >
            {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function TeamHeader({
  team,
  accent = "emerald",
}) {
  if (!team) {
    return null;
  }

  return (
    <div className="flex items-center gap-4">
      {team.logo ? (
        <img
          src={team.logo}
          alt=""
          className="h-14 w-14 rounded-2xl border border-slate-200 bg-white object-contain p-2"
        />
      ) : (
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-lg font-black ${
            accent === "rose"
              ? "bg-rose-50 text-rose-500"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {team.name
            ?.slice(0, 2)
            .toUpperCase()}
        </div>
      )}

      <div className="min-w-0">
        <p className="truncate text-lg font-black text-slate-900">
          {team.name}
        </p>

        <p className="text-xs font-semibold text-slate-400">
          {team.code || "Team analytics"}
        </p>
      </div>
    </div>
  );
}

/*
 * API-Football statistikā dažādi rādītāji
 * var būt objekti ar home, away un total.
 *
 * Piemērs:
 *
 * {
 *   home: 3,
 *   away: 2,
 *   total: 5
 * }
 *
 * Ja total nav pieejams, tiek izmantots
 * home + away.
 */
function getStatTotal(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    if (!value.trim()) {
      return null;
    }

    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  if (
    typeof value !== "object"
  ) {
    return null;
  }

  if (
    value.total !== null &&
    value.total !== undefined &&
    value.total !== ""
  ) {
    const total = Number(
      value.total
    );

    if (
      Number.isFinite(total)
    ) {
      return total;
    }
  }

  const home = Number(
    value.home
  );

  const away = Number(
    value.away
  );

  const hasHome =
    Number.isFinite(home);

  const hasAway =
    Number.isFinite(away);

  if (
    hasHome &&
    hasAway
  ) {
    return home + away;
  }

  if (hasHome) {
    return home;
  }

  if (hasAway) {
    return away;
  }

  return null;
}

function getAverageValue(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  if (
    typeof value === "number"
  ) {
    return Number.isFinite(value)
      ? value
      : null;
  }

  if (
    typeof value === "string"
  ) {
    const number = Number(value);

    return Number.isFinite(number)
      ? number
      : null;
  }

  if (
    typeof value === "object"
  ) {
    if (
      value.total !== null &&
      value.total !== undefined
    ) {
      const total = Number(
        value.total
      );

      return Number.isFinite(total)
        ? total
        : null;
    }

    if (
      value.home !== null &&
      value.home !== undefined
    ) {
      const home = Number(
        value.home
      );

      if (
        Number.isFinite(home)
      ) {
        return home;
      }
    }
  }

  return null;
}

function TeamStats({
  data,
}) {
  if (!data) {
    return null;
  }

  /*
   * IMPORTANT:
   *
   * API-Football struktūra ir:
   *
   * fixtures:
   *   played
   *   wins
   *   draws
   *   loses
   *
   * Tāpēc wins/draws/loses
   * jāņem no data.fixtures.
   */
  const fixtures =
    data.fixtures || {};

  const played =
    fixtures.played || {};

  const wins =
    fixtures.wins || {};

  const draws =
    fixtures.draws || {};

  const losses =
    fixtures.loses ||
    fixtures.losses ||
    {};

  const goalsFor =
    data.goals?.for || {};

  const goalsAgainst =
    data.goals?.against || {};

  const cleanSheets =
    data.clean_sheet ||
    data.cleanSheets ||
    {};

  const failedToScore =
    data.failed_to_score ||
    data.failedToScore ||
    {};

  /*
   * Spēles
   */
  let matchesPlayed =
    getStatTotal(
      played
    );

  /*
   * Uzvaras
   */
  let totalWins =
    getStatTotal(
      wins
    );

  /*
   * Neizšķirti
   */
  let totalDraws =
    getStatTotal(
      draws
    );

  /*
   * Zaudējumi
   */
  let totalLosses =
    getStatTotal(
      losses
    );

  /*
   * Papildu drošības pārbaude.
   *
   * Ja kāda total vērtība nav pieejama,
   * mēģinām to iegūt no home + away.
   */
  if (
    totalWins === null
  ) {
    totalWins =
      getStatTotal({
        home: wins.home,
        away: wins.away,
      });
  }

  if (
    totalDraws === null
  ) {
    totalDraws =
      getStatTotal({
        home: draws.home,
        away: draws.away,
      });
  }

  if (
    totalLosses === null
  ) {
    totalLosses =
      getStatTotal({
        home: losses.home,
        away: losses.away,
      });
  }

  /*
   * Ja API nav nosūtījis spēļu skaitu,
   * to var aprēķināt no:
   *
   * uzvaras + neizšķirti + zaudējumi
   */
  if (
    matchesPlayed === null &&
    (
      totalWins !== null ||
      totalDraws !== null ||
      totalLosses !== null
    )
  ) {
    matchesPlayed =
      (totalWins || 0) +
      (totalDraws || 0) +
      (totalLosses || 0);
  }

  /*
   * Vārti
   */
  const totalGoals =
    getStatTotal(
      goalsFor.total
    );

  /*
   * Ielaistie vārti
   */
  const totalGoalsAgainst =
    getStatTotal(
      goalsAgainst.total
    );

  /*
   * Tīras lapas
   */
  const totalCleanSheets =
    getStatTotal(
      cleanSheets
    );

  /*
   * Spēles bez gūtiem vārtiem
   */
  const totalFailedToScore =
    getStatTotal(
      failedToScore
    );

  /*
   * Vārti spēlē.
   *
   * API-Football:
   *
   * goals.for.average.total
   */
  let goalsPerGame =
    getAverageValue(
      goalsFor.average
    );

  /*
   * Ja API average nav pieejams,
   * aprēķinām paši.
   */
  if (
    goalsPerGame === null &&
    totalGoals !== null &&
    matchesPlayed !== null &&
    matchesPlayed > 0
  ) {
    goalsPerGame =
      Math.round(
        (
          totalGoals /
          matchesPlayed
        ) * 10
      ) / 10;
  }

  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatCard
        label="Spēles"
        value={matchesPlayed}
      />

      <StatCard
        label="Uzvaras"
        value={totalWins}
      />

      <StatCard
        label="Neizšķirti"
        value={totalDraws}
      />

      <StatCard
        label="Zaudējumi"
        value={totalLosses}
      />

      <StatCard
        label="Vārti"
        value={totalGoals}
      />

      <StatCard
        label="Ielaisti"
        value={totalGoalsAgainst}
      />

      <StatCard
        label="Tīras lapas"
        value={totalCleanSheets}
      />

      <StatCard
        label="Bez vārtiem"
        value={totalFailedToScore}
      />

      <StatCard
        label="Vārti / spēlē"
        value={goalsPerGame}
      />
    </div>
  );
}

function h2hResult(
  match,
  teamId
) {
  const homeId =
    Number(
      match?.teams?.home?.id
    );

  const awayId =
    Number(
      match?.teams?.away?.id
    );

  const homeGoals =
    Number(
      match?.goals?.home
    );

  const awayGoals =
    Number(
      match?.goals?.away
    );

  if (
    !Number.isFinite(homeGoals) ||
    !Number.isFinite(awayGoals)
  ) {
    return "—";
  }

  const selectedTeam =
    Number(teamId);

  const teamWon =
    (
      homeId === selectedTeam &&
      homeGoals > awayGoals
    ) ||
    (
      awayId === selectedTeam &&
      awayGoals > homeGoals
    );

  const draw =
    homeGoals === awayGoals;

  if (draw) {
    return "Neizšķirts";
  }

  return teamWon
    ? "Uzvara"
    : "Zaudējums";
}

export default function TeamPage({
  competition,
  season,
  leagueName,
}) {
  const [
    teams,
    setTeams,
  ] = useState([]);

  const [
    team1Id,
    setTeam1Id,
  ] = useState(null);

  const [
    team2Id,
    setTeam2Id,
  ] = useState(null);

  const [
    stats1,
    setStats1,
  ] = useState(null);

  const [
    stats2,
    setStats2,
  ] = useState(null);

  const [
    h2h,
    setH2h,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    h2hLoading,
    setH2hLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const team1 =
    useMemo(
      () =>
        teams.find(
          team =>
            Number(team.id) ===
            Number(team1Id)
        ) || null,
      [
        teams,
        team1Id,
      ]
    );

  const team2 =
    useMemo(
      () =>
        teams.find(
          team =>
            Number(team.id) ===
            Number(team2Id)
        ) || null,
      [
        teams,
        team2Id,
      ]
    );

  useEffect(() => {
    let cancelled = false;

    const loadTeams =
      async () => {
        setLoading(true);
        setError("");

        setStats1(null);
        setStats2(null);
        setH2h([]);

        try {
          const data =
            await fetchTeams(
              competition,
              season
            );

          if (
            cancelled
          ) {
            return;
          }

          const availableTeams =
            Array.isArray(data)
              ? data
              : [];

          setTeams(
            availableTeams
          );

          const firstTeam =
            availableTeams[0] ||
            null;

          const secondTeam =
            availableTeams[1] ||
            availableTeams[0] ||
            null;

          setTeam1Id(
            firstTeam?.id ||
              null
          );

          setTeam2Id(
            secondTeam?.id ||
              null
          );
        } catch (
          err
        ) {
          if (
            !cancelled
          ) {
            setTeams([]);
            setError(
              err?.message ||
                "Neizdevās ielādēt komandas."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(false);
          }
        }
      };

    loadTeams();

    return () => {
      cancelled = true;
    };
  }, [
    competition,
    season,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadStats =
      async () => {
        if (
          !team1Id &&
          !team2Id
        ) {
          return;
        }

        setStats1(null);
        setStats2(null);

        try {
          const [
            first,
            second,
          ] = await Promise.all([
            team1Id
              ? fetchTeamStatistics(
                  team1Id,
                  competition,
                  season
                )
              : Promise.resolve(
                  null
                ),

            team2Id
              ? fetchTeamStatistics(
                  team2Id,
                  competition,
                  season
                )
              : Promise.resolve(
                  null
                ),
          ]);

          if (
            !cancelled
          ) {
            setStats1(first);
            setStats2(second);
          }
        } catch (
          err
        ) {
          if (
            !cancelled
          ) {
            setError(
              err?.message ||
                "Neizdevās ielādēt komandu statistiku."
            );
          }
        }
      };

    loadStats();

    return () => {
      cancelled = true;
    };
  }, [
    team1Id,
    team2Id,
    competition,
    season,
  ]);

  useEffect(() => {
    let cancelled = false;

    const loadH2H =
      async () => {
        if (
          !team1Id ||
          !team2Id ||
          Number(team1Id) ===
            Number(team2Id)
        ) {
          setH2h([]);
          return;
        }

        setH2hLoading(true);

        try {
          const matches =
            await fetchHeadToHead(
              team1Id,
              team2Id,
              5
            );

          if (
            !cancelled
          ) {
            setH2h(
              Array.isArray(matches)
                ? matches
                : []
            );
          }
        } catch (
          err
        ) {
          if (
            !cancelled
          ) {
            setH2h([]);

            setError(
              err?.message ||
                "Neizdevās ielādēt H2H datus."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setH2hLoading(false);
          }
        }
      };

    loadH2H();

    return () => {
      cancelled = true;
    };
  }, [
    team1Id,
    team2Id,
  ]);

  return (
    <section>
      <div className="mb-7 rounded-[28px] bg-slate-950 px-7 py-9 shadow-xl md:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Team Analytics
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            Komandu statistika un H2H
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            Salīdzini divu{" "}
            {leagueName} komandu
            sezonas statistiku un
            apskati pēdējās
            savstarpējās spēles.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-bold text-red-700">
            API kļūda
          </p>

          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <TeamSelect
          label="Pirmā komanda"
          value={team1Id}
          teams={teams}
          onChange={setTeam1Id}
          accent="rose"
        />

        <TeamSelect
          label="Otrā komanda"
          value={team2Id}
          teams={teams}
          onChange={setTeam2Id}
          accent="emerald"
        />
      </div>

      {loading ? (
        <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-xl border-4 border-emerald-100 border-t-emerald-500" />

          <p className="mt-4 text-sm font-bold text-slate-600">
            Ielādē komandas...
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {[
              team1,
              team2,
            ].map(
              (
                team,
                index
              ) => {
                const stats =
                  index === 0
                    ? stats1
                    : stats2;

                const accent =
                  index === 0
                    ? "rose"
                    : "emerald";

                return (
                  <section
                    key={
                      team?.id ||
                      index
                    }
                    className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <TeamHeader
                      team={team}
                      accent={accent}
                    />

                    {stats ? (
                      <TeamStats
                        data={stats}
                      />
                    ) : (
                      <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-xs font-semibold text-slate-400">
                        Ielādē
                        statistiku...
                      </div>
                    )}
                  </section>
                );
              }
            )}
          </div>

          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  Head-to-head
                </p>

                <h2 className="mt-1 text-xl font-black text-slate-950">
                  Pēdējās
                  savstarpējās
                  spēles
                </h2>
              </div>

              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Pēdējās 5
              </span>
            </div>

            {h2hLoading ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-xs font-semibold text-slate-400">
                Ielādē H2H...
              </div>
            ) : h2h.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-slate-50 p-8 text-center text-xs font-semibold text-slate-400">
                Šīm komandām nav
                pieejamu H2H
                datu.
              </div>
            ) : (
              <div className="mt-5 overflow-x-auto">
                <div className="min-w-[620px] overflow-hidden rounded-2xl border border-slate-200">
                  {h2h.map(
                    (
                      match,
                      index
                    ) => {
                      const result =
                        h2hResult(
                          match,
                          team1Id
                        );

                      return (
                        <div
                          key={
                            match
                              .fixture
                              ?.id ||
                            index
                          }
                          className="grid grid-cols-[110px_1fr_90px_1fr] items-center gap-3 border-b border-slate-100 px-4 py-4 last:border-b-0"
                        >
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              {match
                                .fixture
                                ?.date
                                ? new Date(
                                    match
                                      .fixture
                                      .date
                                  ).toLocaleDateString(
                                    "lv-LV"
                                  )
                                : "—"}
                            </p>

                            <p className="mt-1 truncate text-[9px] font-semibold text-slate-400">
                              {match
                                .league
                                ?.name ||
                                "—"}
                            </p>
                          </div>

                          <p className="truncate text-right text-xs font-extrabold text-slate-800">
                            {match
                              .teams
                              ?.home
                              ?.name ||
                              "—"}
                          </p>

                          <div className="text-center">
                            <span className="inline-flex rounded-lg bg-slate-950 px-3 py-1.5 text-xs font-black text-white">
                              {match
                                .goals
                                ?.home ??
                                "—"}{" "}
                              :{" "}
                              {match
                                .goals
                                ?.away ??
                                "—"}
                            </span>
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-xs font-extrabold text-slate-800">
                              {match
                                .teams
                                ?.away
                                ?.name ||
                                "—"}
                            </p>

                            <p
                              className={`mt-1 text-[9px] font-black uppercase tracking-wider ${
                                result ===
                                "Uzvara"
                                  ? "text-emerald-600"
                                  : result ===
                                    "Zaudējums"
                                  ? "text-rose-500"
                                  : "text-slate-400"
                              }`}
                            >
                              {result}
                            </p>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}