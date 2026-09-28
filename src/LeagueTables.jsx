import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchLeagueStandings,
  fetchLeagueFixtures,
} from "./services/leagueFeatures";

import LeagueTopScorers from "./components/LeagueTopScorers";
import LeagueFixtures from "./components/LeagueFixtures";

function valueOrDash(value) {
  return value === null ||
    value === undefined ||
    value === ""
    ? "—"
    : value;
}

function getGoalDifference(row) {
  if (
    row?.goalDifference !== undefined &&
    row?.goalDifference !== null
  ) {
    return row.goalDifference;
  }

  if (
    row?.goalsDiff !== undefined &&
    row?.goalsDiff !== null
  ) {
    return row.goalsDiff;
  }

  const goalsFor = Number(
    row?.goalsFor
  );

  const goalsAgainst = Number(
    row?.goalsAgainst
  );

  if (
    Number.isFinite(goalsFor) &&
    Number.isFinite(goalsAgainst)
  ) {
    const difference =
      goalsFor - goalsAgainst;

    return difference > 0
      ? `+${difference}`
      : difference;
  }

  return "—";
}

function getTeamName(row) {
  return (
    row?.team?.name ||
    row?.team?.shortName ||
    row?.team?.tla ||
    "Nezināma komanda"
  );
}

function getTeamLogo(row) {
  return (
    row?.team?.crest ||
    row?.team?.logo ||
    null
  );
}

function getPlayed(row) {
  return (
    row?.playedGames ??
    row?.played ??
    row?.all?.played ??
    null
  );
}

function getWins(row) {
  return (
    row?.won ??
    row?.wins ??
    row?.all?.win ??
    null
  );
}

function getDraws(row) {
  return (
    row?.draw ??
    row?.draws ??
    row?.all?.draw ??
    null
  );
}

function getLosses(row) {
  return (
    row?.lost ??
    row?.losses ??
    row?.all?.lose ??
    null
  );
}

function getGoalsFor(row) {
  return (
    row?.goalsFor ??
    row?.goals?.for ??
    row?.all?.goals?.for ??
    null
  );
}

function getGoalsAgainst(row) {
  return (
    row?.goalsAgainst ??
    row?.goals?.against ??
    row?.all?.goals?.against ??
    null
  );
}

function getCompetitionZones(competition) {
  const zones = {
    PL: {
      champions: 4,
      europa: 5,
      conference: 6,
      relegationStart: 18,
    },

    PD: {
      champions: 5,
      europa: 6,
      conference: 7,
      relegationStart: 18,
    },

    SA: {
      champions: 4,
      europa: 6,
      conference: 7,
      relegationStart: 18,
    },

    BL1: {
      champions: 4,
      europa: 5,
      conference: 6,
      relegationStart: 17,
    },

    FL1: {
      champions: 3,
      europa: 4,
      conference: 5,
      relegationStart: 17,
    },
  };

  return (
    zones[competition] ||
    zones.PL
  );
}

function getTableZone(
  position,
  competition
) {
  const numericPosition =
    Number(position);

  if (
    !Number.isFinite(
      numericPosition
    )
  ) {
    return {
      label: "",
      color: "bg-slate-200",
    };
  }

  const zones =
    getCompetitionZones(
      competition
    );

  if (
    numericPosition <=
    zones.champions
  ) {
    return {
      label: "Champions League",
      color: "bg-blue-500",
    };
  }

  if (
    numericPosition <=
    zones.europa
  ) {
    return {
      label: "Europa League",
      color: "bg-emerald-500",
    };
  }

  if (
    numericPosition <=
    zones.conference
  ) {
    return {
      label: "Conference League",
      color: "bg-violet-500",
    };
  }

  if (
    numericPosition >=
    zones.relegationStart
  ) {
    return {
      label: "Izkrīšanas zona",
      color: "bg-red-500",
    };
  }

  return {
    label: "",
    color: "bg-slate-200",
  };
}

function ZoneLegend({ competition }) {
  const zones =
    getCompetitionZones(
      competition
    );

  const items = [
    {
      label:
        `Champions League · 1–${zones.champions}`,
      color: "bg-blue-500",
    },
    {
      label:
        `Europa League · ${zones.champions + 1}–${zones.europa}`,
      color: "bg-emerald-500",
    },
    {
      label:
        `Conference League · ${zones.europa + 1}–${zones.conference}`,
      color: "bg-violet-500",
    },
    {
      label:
        `Izkrīšana · ${zones.relegationStart}–`,
      color: "bg-red-500",
    },
  ];

  return (
    <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        {items.map(item => (
          <div
            key={item.label}
            className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-slate-400"
          >
            <span
              className={`h-2.5 w-1.5 rounded-full ${item.color}`}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TableRow({
  row,
  competition,
}) {
  const position =
    row?.position ??
    row?.rank;

  const teamName =
    getTeamName(row);

  const logo =
    getTeamLogo(row);

  const difference =
    getGoalDifference(row);

  const zone =
    getTableZone(
      position,
      competition
    );

  return (
    <div className="grid min-w-[760px] grid-cols-[58px_minmax(240px,1fr)_75px_65px_65px_65px_75px_75px_75px_75px] items-center border-b border-slate-100 px-4 py-3.5 last:border-b-0 hover:bg-slate-50">
      <div
        className="relative flex items-center justify-center text-center text-sm font-black text-slate-400"
        title={zone.label || undefined}
      >
        <span
          className={`absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-full ${zone.color}`}
        />
        {valueOrDash(position)}
      </div>

      <div className="flex min-w-0 items-center gap-3">
        {logo ? (
          <img
            src={logo}
            alt=""
            className="h-8 w-8 shrink-0 object-contain"
          />
        ) : (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500">
            {teamName
              .slice(0, 2)
              .toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {teamName}
          </p>

          {row?.team?.tla && (
            <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
              {row.team.tla}
            </p>
          )}
        </div>
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getPlayed(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getWins(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getDraws(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getLosses(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getGoalsFor(row)
        )}
      </div>

      <div className="text-center text-sm font-bold text-slate-700">
        {valueOrDash(
          getGoalsAgainst(row)
        )}
      </div>

      <div
        className={`text-center text-sm font-black ${
          Number(difference) > 0
            ? "text-emerald-600"
            : Number(difference) < 0
            ? "text-rose-500"
            : "text-slate-700"
        }`}
      >
        {valueOrDash(
          difference
        )}
      </div>

      <div className="text-center text-sm font-black text-slate-950">
        {valueOrDash(
          row?.points
        )}
      </div>
    </div>
  );
}

function StandingsView({
  standings,
  loading,
  error,
  loadStandings,
  competition,
  leagueName,
  season,
}) {
  return (
    <>
      {error && (
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
      )}

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Ielādē līgas tabulu...
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {leagueName} · {season}/
            {Number(season) + 1}
          </p>
        </div>
      ) : standings.length === 0 ? (
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
      ) : (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[760px]">
              <div className="grid grid-cols-[58px_minmax(240px,1fr)_75px_65px_65px_65px_75px_75px_75px_75px] items-center border-b border-slate-200 bg-slate-50 px-4 py-3">
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  #
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Komanda
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Sp
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  U
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  N
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Z
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  GF
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  GA
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  GD
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  P
                </div>
              </div>

              {standings.map(
                (row, index) => (
                  <TableRow
                    key={
                      row?.team?.id ||
                      `${row?.position || index}-${index}`
                    }
                    row={row}
                    competition={competition}
                  />
                )
              )}
            </div>
          </div>

          <ZoneLegend
            competition={competition}
          />

          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[9px] font-bold uppercase tracking-wider text-slate-400">
              <span>Sp = Spēles</span>
              <span>U = Uzvaras</span>
              <span>N = Neizšķirti</span>
              <span>Z = Zaudējumi</span>
              <span>GF = Gūtie vārti</span>
              <span>GA = Ielaistie vārti</span>
              <span>GD = Vārtu starpība</span>
              <span>P = Punkti</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


function getTeamId(row) {
  return (
    row?.team?.id ??
    row?.team?.teamId ??
    null
  );
}

function getTeamShortName(row) {
  return (
    row?.team?.shortName ||
    row?.team?.tla ||
    getTeamName(row)
  );
}

function getFixtureStatus(fixture) {
  const short =
    fixture?.fixture?.status?.short ||
    fixture?.status ||
    "NS";

  if (["FT", "AET", "PEN"].includes(short)) {
    return "finished";
  }

  if (["1H", "HT", "2H", "ET", "BT", "P"].includes(short)) {
    return "live";
  }

  return "upcoming";
}

function getFixtureDate(fixture) {
  const value = fixture?.fixture?.date || fixture?.date;
  if (!value) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date;
}

function formatFixtureDate(value) {
  const date = getFixtureDate(value);

  if (!date) return "—";

  return new Intl.DateTimeFormat("lv-LV", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getFixtureTeams(fixture) {
  return {
    home: fixture?.teams?.home || {},
    away: fixture?.teams?.away || {},
  };
}

function getFixtureGoals(fixture) {
  return {
    home:
      fixture?.goals?.home ??
      fixture?.score?.fulltime?.home ??
      null,
    away:
      fixture?.goals?.away ??
      fixture?.score?.fulltime?.away ??
      null,
  };
}

function getTeamFixtureResult(teamId, fixture) {
  const { home, away } =
    getFixtureTeams(fixture);

  const goals = getFixtureGoals(fixture);

  const id = String(teamId);
  const homeId = String(home?.id ?? "");
  const awayId = String(away?.id ?? "");

  if (
    homeId !== id &&
    awayId !== id
  ) {
    return null;
  }

  if (
    goals.home === null ||
    goals.away === null
  ) {
    return null;
  }

  const isHome = homeId === id;
  const teamGoals = isHome
    ? Number(goals.home)
    : Number(goals.away);
  const opponentGoals = isHome
    ? Number(goals.away)
    : Number(goals.home);

  if (
    !Number.isFinite(teamGoals) ||
    !Number.isFinite(opponentGoals)
  ) {
    return null;
  }

  return {
    result:
      teamGoals > opponentGoals
        ? "W"
        : teamGoals < opponentGoals
        ? "L"
        : "D",
    teamGoals,
    opponentGoals,
    isHome,
    opponent:
      isHome
        ? away
        : home,
    fixture,
  };
}

function getTeamForm(teamId, fixtures, standingRow = null) {
  // API-Football standings normally provides the team's recent form
  // directly as a string such as "WWDLW". Use that first so the table
  // always shows the actual last five league results.
  const rawForm =
    standingRow?.form ??
    standingRow?.lastFive ??
    standingRow?.recentForm ??
    null;

  if (typeof rawForm === "string") {
    const results = rawForm
      .toUpperCase()
      .replace(/[^WDL]/g, "")
      .slice(-5);

    if (results.length > 0) {
      return results
        .split("")
        .map((result, index) => ({
          result,
          fixture: null,
          formIndex: index,
        }));
    }
  }

  // Fallback: calculate the last five from the recent fixtures returned
  // by the fixtures endpoint.
  const recent = Array.isArray(fixtures?.recent)
    ? fixtures.recent
    : [];

  return recent
    .map(fixture =>
      getTeamFixtureResult(
        teamId,
        fixture
      )
    )
    .filter(Boolean)
    .sort(
      (a, b) =>
        (getFixtureDate(b.fixture)?.getTime() || 0) -
        (getFixtureDate(a.fixture)?.getTime() || 0)
    )
    .slice(0, 5)
    .reverse();
}

function getFormLabel(form) {
  const wins = form.filter(
    item => item.result === "W"
  ).length;
  const draws = form.filter(
    item => item.result === "D"
  ).length;
  const losses = form.filter(
    item => item.result === "L"
  ).length;

  const points =
    wins * 3 + draws;

  if (form.length === 0) {
    return {
      label: "Nav datu",
      tone: "bg-slate-100 text-slate-500 border-slate-200",
      points: 0,
    };
  }

  if (
    points >=
    form.length * 2.2
  ) {
    return {
      label: "🔥 Lieliska forma",
      tone: "bg-emerald-50 text-emerald-700 border-emerald-200",
      points,
    };
  }

  if (
    points >=
    form.length * 1.4
  ) {
    return {
      label: "🟢 Laba forma",
      tone: "bg-lime-50 text-lime-700 border-lime-200",
      points,
    };
  }

  if (
    points >=
    form.length * 0.8
  ) {
    return {
      label: "🟡 Vidēja forma",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
      points,
    };
  }

  return {
    label: "🔴 Vāja forma",
    tone: "bg-rose-50 text-rose-700 border-rose-200",
    points,
  };
}

function getFixtureDifficulty(
  fixture,
  teamId,
  standings
) {
  if (!fixture) {
    return {
      score: null,
      label: "—",
      tone: "bg-slate-100 text-slate-500 border-slate-200",
    };
  }

  const { home, away } =
    getFixtureTeams(fixture);

  const opponent =
    String(home?.id) === String(teamId)
      ? away
      : home;

  const opponentRow =
    standings.find(
      row =>
        String(getTeamId(row)) ===
        String(opponent?.id)
    );

  const position = Number(
    opponentRow?.position ??
    opponentRow?.rank
  );

  if (!Number.isFinite(position)) {
    return {
      score: 3,
      label: "3/5",
      tone: "bg-amber-50 text-amber-700 border-amber-200",
    };
  }

  const totalTeams =
    standings.length || 20;

  const percentile =
    (position - 1) /
    Math.max(1, totalTeams - 1);

  // Position 1 is hardest; bottom is easiest.
  const score =
    Math.min(
      5,
      Math.max(
        1,
        Math.round(
          5 - percentile * 4
        )
      )
    );

  const tones = {
    1: "bg-emerald-50 text-emerald-700 border-emerald-200",
    2: "bg-lime-50 text-lime-700 border-lime-200",
    3: "bg-amber-50 text-amber-700 border-amber-200",
    4: "bg-orange-50 text-orange-700 border-orange-200",
    5: "bg-rose-50 text-rose-700 border-rose-200",
  };

  return {
    score,
    label: `${score}/5`,
    tone:
      tones[score] ||
      tones[3],
    opponentPosition: position,
  };
}

function getNextFixture(
  teamId,
  fixtures
) {
  const upcoming = Array.isArray(
    fixtures?.upcoming
  )
    ? fixtures.upcoming
    : [];

  return upcoming
    .filter(fixture => {
      const { home, away } =
        getFixtureTeams(fixture);

      return (
        String(home?.id) ===
          String(teamId) ||
        String(away?.id) ===
          String(teamId)
      );
    })
    .sort(
      (a, b) =>
        (getFixtureDate(a)?.getTime() || 0) -
        (getFixtureDate(b)?.getTime() || 0)
    )[0] || null;
}

function getHomeAwayStats(
  teamId,
  fixtures
) {
  const recent = Array.isArray(fixtures?.recent)
    ? fixtures.recent
    : [];

  const stats = {
    home: {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
    away: {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    },
  };

  recent.forEach(fixture => {
    const result =
      getTeamFixtureResult(
        teamId,
        fixture
      );

    if (!result) return;

    const target =
      result.isHome
        ? stats.home
        : stats.away;

    target.played += 1;
    target.goalsFor +=
      result.teamGoals;
    target.goalsAgainst +=
      result.opponentGoals;

    if (result.result === "W") {
      target.wins += 1;
    } else if (
      result.result === "D"
    ) {
      target.draws += 1;
    } else {
      target.losses += 1;
    }
  });

  return stats;
}

function TeamLogo({
  row,
  size = "h-8 w-8",
}) {
  const logo =
    getTeamLogo(row);

  const name =
    getTeamName(row);

  if (logo) {
    return (
      <img
        src={logo}
        alt=""
        className={`${size} shrink-0 object-contain`}
      />
    );
  }

  return (
    <div
      className={`${size} flex shrink-0 items-center justify-center rounded-lg bg-slate-100 text-[9px] font-black text-slate-500`}
    >
      {name
        .slice(0, 2)
        .toUpperCase()}
    </div>
  );
}

function FormDots({
  form,
}) {
  if (!form.length) {
    return (
      <span className="text-[9px] font-bold text-slate-400">
        —
      </span>
    );
  }

  const tones = {
    W: "bg-emerald-500",
    D: "bg-amber-400",
    L: "bg-rose-500",
  };

  return (
    <div className="flex items-center gap-1">
      {form.map(
        (item, index) => (
          <span
            key={`${item.result}-${index}`}
            title={
              item.result === "W"
                ? "Uzvara"
                : item.result === "D"
                ? "Neizšķirts"
                : "Zaudējums"
            }
            className={`flex h-5 w-5 items-center justify-center rounded-full text-[7px] font-black text-white ${
              tones[item.result]
            }`}
          >
            {item.result}
          </span>
        )
      )}
    </div>
  );
}

function MovementBadge({
  movement,
}) {
  if (
    movement === null ||
    movement === undefined
  ) {
    return (
      <span className="text-[9px] font-bold text-slate-400">
        —
      </span>
    );
  }

  if (movement > 0) {
    return (
      <span className="text-[9px] font-black text-emerald-600">
        ↑ {movement}
      </span>
    );
  }

  if (movement < 0) {
    return (
      <span className="text-[9px] font-black text-rose-500">
        ↓ {Math.abs(movement)}
      </span>
    );
  }

  return (
    <span className="text-[9px] font-black text-slate-400">
      —
    </span>
  );
}

function TeamDetailModal({
  row,
  standings,
  fixtures,
  competition,
  movement,
  onClose,
  onCompare,
}) {
  if (!row) return null;

  const teamId =
    getTeamId(row);

  const form =
    getTeamForm(
      teamId,
      fixtures,
      row
    );

  const formInfo =
    getFormLabel(form);

  const next =
    getNextFixture(
      teamId,
      fixtures
    );

  const difficulty =
    getFixtureDifficulty(
      next,
      teamId,
      standings
    );

  const homeAway =
    getHomeAwayStats(
      teamId,
      fixtures
    );

  const { home, away } =
    getFixtureTeams(next);

  const opponent =
    String(home?.id) ===
    String(teamId)
      ? away
      : home;

  const isHome =
    String(home?.id) ===
    String(teamId);

  const zone =
    getTableZone(
      row?.position ??
        row?.rank,
      competition
    );

  const played =
    Number(
      getPlayed(row)
    ) || 0;

  const wins =
    Number(
      getWins(row)
    ) || 0;

  const goalsFor =
    Number(
      getGoalsFor(row)
    ) || 0;

  const goalsAgainst =
    Number(
      getGoalsAgainst(row)
    ) || 0;

  const winRate =
    played > 0
      ? Math.round(
          (wins / played) *
            100
        )
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div className="flex items-center gap-3">
            <TeamLogo
              row={row}
              size="h-12 w-12"
            />

            <div>
              <p className="text-lg font-black text-slate-900">
                {getTeamName(row)}
              </p>

              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                Pozīcija{" "}
                {row?.position ??
                  row?.rank ??
                  "—"}{" "}
                ·{" "}
                {zone.label ||
                  "Līgas tabula"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="grid gap-4 p-6">

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [
                "Punkti",
                row?.points ?? "—",
                "text-slate-900",
              ],
              [
                "Uzvaras",
                getWins(row),
                "text-emerald-600",
              ],
              [
                "Vārtu starpība",
                getGoalDifference(row),
                Number(
                  getGoalDifference(row)
                ) >= 0
                  ? "text-emerald-600"
                  : "text-rose-500",
              ],
              [
                "Win rate",
                `${winRate}%`,
                "text-slate-900",
              ],
            ].map(
              ([label, value, tone]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p
                    className={`mt-1 text-2xl font-black ${tone}`}
                  >
                    {value}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                    Pēdējās 5 spēles
                  </p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {formInfo.label}
                  </p>
                </div>

                <FormDots form={form} />
              </div>

              <div className="space-y-2">
                {form.length ? (
                  form
                    .slice()
                    .reverse()
                    .map(
                      (item, index) => (
                        <div
                          key={`${item.fixture?.fixture?.id || index}`}
                          className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-xs font-bold text-slate-800">
                              {item.isHome
                                ? getTeamShortName({
                                    team: item.opponent,
                                  })
                                : getTeamShortName({
                                    team: item.opponent,
                                  })}
                            </p>
                            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
                              {item.isHome
                                ? "Mājas"
                                : "Izbraukums"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-xs font-black text-slate-900">
                              {item.teamGoals} :{" "}
                              {item.opponentGoals}
                            </p>
                            <span
                              className={`text-[8px] font-black ${
                                item.result ===
                                "W"
                                  ? "text-emerald-600"
                                  : item.result ===
                                    "D"
                                  ? "text-amber-500"
                                  : "text-rose-500"
                              }`}
                            >
                              {item.result}
                            </span>
                          </div>
                        </div>
                      )
                    )
                ) : (
                  <p className="text-xs text-slate-400">
                    Pēdējo spēļu dati nav pieejami.
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Nākamā spēle
              </p>

              {next ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {opponent?.logo && (
                        <img
                          src={opponent.logo}
                          alt=""
                          className="h-10 w-10 object-contain"
                        />
                      )}

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">
                          {isHome
                            ? "vs "
                            : "@ "}
                          {opponent?.name ||
                            "Pretinieks"}
                        </p>
                        <p className="mt-1 text-[9px] font-bold text-slate-400">
                          {formatFixtureDate(
                            next
                          )}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`rounded-full border px-2.5 py-1 text-[9px] font-black ${difficulty.tone}`}
                    >
                      Grūtība{" "}
                      {difficulty.label}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-xl bg-slate-50 p-4 text-xs text-slate-400">
                  Nākamā spēle nav pieejama.
                </div>
              )}

              <button
                type="button"
                onClick={onCompare}
                className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-3 text-xs font-black uppercase tracking-wider text-white hover:bg-slate-800"
              >
                🆚 Salīdzināt komandu
              </button>
            </div>

          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Mājas / izbraukuma statistika
            </p>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["🏠 Mājas", homeAway.home],
                ["✈️ Izbraukums", homeAway.away],
              ].map(
                ([label, stats]) => (
                  <div
                    key={label}
                    className="rounded-xl bg-slate-50 p-4"
                  >
                    <p className="text-sm font-black text-slate-900">
                      {label}
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {stats.wins}
                        </p>
                        <p className="text-[8px] font-bold uppercase text-slate-400">
                          Uzv
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {stats.draws}
                        </p>
                        <p className="text-[8px] font-bold uppercase text-slate-400">
                          Nei
                        </p>
                      </div>

                      <div>
                        <p className="text-lg font-black text-slate-900">
                          {stats.losses}
                        </p>
                        <p className="text-[8px] font-bold uppercase text-slate-400">
                          Zaud
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-[9px] font-bold text-slate-400">
                      {stats.goalsFor} gūti ·{" "}
                      {stats.goalsAgainst} ielaisti
                    </p>
                  </div>
                )
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Spēles", played],
              ["Vārti", goalsFor],
              ["Ielaisti", goalsAgainst],
              [
                "Vidēji vārti",
                played > 0
                  ? (
                      goalsFor /
                      played
                    ).toFixed(2)
                  : "0.00",
              ],
            ].map(
              ([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-slate-200 p-3"
                >
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 text-xl font-black text-slate-900">
                    {value}
                  </p>
                </div>
              )
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function TeamCompareModal({
  first,
  second,
  standings,
  fixtures,
  onClose,
}) {
  if (!first || !second) {
    return null;
  }

  const firstId =
    getTeamId(first);
  const secondId =
    getTeamId(second);

  const firstForm =
    getTeamForm(
      firstId,
      fixtures
    );
  const secondForm =
    getTeamForm(
      secondId,
      fixtures
    );

  const firstHomeAway =
    getHomeAwayStats(
      firstId,
      fixtures
    );
  const secondHomeAway =
    getHomeAwayStats(
      secondId,
      fixtures
    );

  const metrics = [
    [
      "Punkti",
      first?.points,
      second?.points,
    ],
    [
      "Spēles",
      getPlayed(first),
      getPlayed(second),
    ],
    [
      "Uzvaras",
      getWins(first),
      getWins(second),
    ],
    [
      "Neizšķirti",
      getDraws(first),
      getDraws(second),
    ],
    [
      "Zaudējumi",
      getLosses(first),
      getLosses(second),
    ],
    [
      "GF",
      getGoalsFor(first),
      getGoalsFor(second),
    ],
    [
      "GA",
      getGoalsAgainst(first),
      getGoalsAgainst(second),
    ],
    [
      "GD",
      getGoalDifference(first),
      getGoalDifference(second),
    ],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
              Team Comparison
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900">
              Komandu salīdzinājums
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-6">

          <div className="grid grid-cols-2 gap-3">
            {[first, second].map(
              team => (
                <div
                  key={getTeamId(team)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      row={team}
                    />
                    <p className="text-sm font-black text-slate-900">
                      {getTeamName(
                        team
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 px-4 py-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Rādītājs
              </span>
              <span className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                {getTeamShortName(
                  first
                )}
              </span>
              <span className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                {getTeamShortName(
                  second
                )}
              </span>
            </div>

            {metrics.map(
              ([label, a, b]) => (
                <div
                  key={label}
                  className="grid grid-cols-3 border-t border-slate-100 px-4 py-3"
                >
                  <span className="text-xs font-bold text-slate-500">
                    {label}
                  </span>
                  <span className="text-center text-sm font-black text-slate-900">
                    {valueOrDash(a)}
                  </span>
                  <span className="text-center text-sm font-black text-slate-900">
                    {valueOrDash(b)}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [
                first,
                firstForm,
                firstHomeAway,
              ],
              [
                second,
                secondForm,
                secondHomeAway,
              ],
            ].map(
              ([team, form, homeAway]) => {
                const formInfo =
                  getFormLabel(form);

                return (
                  <div
                    key={getTeamId(team)}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {getTeamName(
                        team
                      )}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <FormDots
                        form={form}
                      />
                      <span
                        className={`rounded-full border px-2 py-1 text-[8px] font-black ${formInfo.tone}`}
                      >
                        {formInfo.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Mājas uzvaras
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {homeAway.home.wins}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Izbraukuma uzvaras
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {homeAway.away.wins}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

function RaceCard({
  title,
  subtitle,
  rows,
  color,
  emptyText,
  onTeamClick,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-black text-slate-900">
            {title}
          </p>
          <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            {subtitle}
          </p>
        </div>

        <span
          className={`h-2.5 w-2.5 rounded-full ${color}`}
        />
      </div>

      <div className="mt-4 space-y-2">
        {rows.length ? (
          rows.map(row => (
            <button
              type="button"
              key={getTeamId(row)}
              onClick={() =>
                onTeamClick(row)
              }
              className="flex w-full items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-left hover:bg-slate-100"
            >
              <span className="w-5 text-center text-[9px] font-black text-slate-400">
                {row?.position ??
                  row?.rank}
              </span>

              <TeamLogo
                row={row}
                size="h-6 w-6"
              />

              <span className="min-w-0 flex-1 truncate text-[10px] font-black text-slate-800">
                {getTeamName(row)}
              </span>

              <span className="text-xs font-black text-slate-900">
                {row?.points ?? "—"}
              </span>
            </button>
          ))
        ) : (
          <p className="py-3 text-xs text-slate-400">
            {emptyText}
          </p>
        )}
      </div>
    </div>
  );
}

function LeagueStatistics({
  standings,
  fixtures,
}) {
  const totalGoals =
    standings.reduce(
      (sum, row) =>
        sum +
        (Number(
          getGoalsFor(row)
        ) || 0),
      0
    );

  const totalGames =
    standings.reduce(
      (sum, row) =>
        sum +
        (Number(
          getPlayed(row)
        ) || 0),
      0
    ) / 2;

  const bestAttack =
    [...standings]
      .sort(
        (a, b) =>
          (Number(
            getGoalsFor(b)
          ) || 0) -
          (Number(
            getGoalsFor(a)
          ) || 0)
      )[0];

  const bestDefence =
    [...standings]
      .sort(
        (a, b) =>
          (Number(
            getGoalsAgainst(a)
          ) || 999) -
          (Number(
            getGoalsAgainst(b)
          ) || 999)
      )[0];

  const formRows =
    standings
      .map(row => ({
        row,
        form: getTeamForm(
          getTeamId(row),
          fixtures
        ),
      }))
      .filter(item =>
        item.form.length
      )
      .sort(
        (a, b) =>
          getFormLabel(
            b.form
          ).points -
          getFormLabel(
            a.form
          ).points
      );

  const bestForm =
    formRows[0]?.row;

  const totalCards = [
    [
      "⚽",
      "Gūtie vārti",
      totalGoals,
    ],
    [
      "📈",
      "Vārti / spēlē",
      totalGames > 0
        ? (
            totalGoals /
            totalGames
          ).toFixed(2)
        : "0.00",
    ],
    [
      "🔥",
      "Labākais uzbrukums",
      bestAttack
        ? getTeamName(
            bestAttack
          )
        : "—",
    ],
    [
      "🛡️",
      "Labākā aizsardzība",
      bestDefence
        ? getTeamName(
            bestDefence
          )
        : "—",
    ],
  ];

  return (
    <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-sm font-black text-slate-900">
          📊 Līgas statistika
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Apkopoti dati no pašreizējās standings un pieejamajiem rezultātiem.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totalCards.map(
          ([icon, label, value]) => (
            <div
              key={label}
              className="rounded-2xl bg-slate-50 p-4"
            >
              <span className="text-lg">
                {icon}
              </span>

              <p className="mt-2 text-[8px] font-black uppercase tracking-wider text-slate-400">
                {label}
              </p>

              <p className="mt-1 truncate text-sm font-black text-slate-900">
                {value}
              </p>
            </div>
          )
        )}
      </div>

      {bestForm && (
        <div className="mt-3 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3">
          <div>
            <p className="text-[8px] font-black uppercase tracking-wider text-emerald-600">
              🔥 Labākā pašreizējā forma
            </p>
            <p className="mt-1 text-sm font-black text-slate-900">
              {getTeamName(
                bestForm
              )}
            </p>
          </div>

          <FormDots
            form={
              formRows[0].form
            }
          />
        </div>
      )}
    </div>
  );
}

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

                const next =
                  getNextFixture(
                    teamId,
                    fixtures
                  );

                const difficulty =
                  getFixtureDifficulty(
                    next,
                    teamId,
                    standings
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

                    <div className="flex items-center justify-center gap-2">
                      <FormDots
                        form={form}
                      />

                      {next && (
                        <span
                          className={`rounded-full border px-2 py-1 text-[7px] font-black ${difficulty.tone}`}
                          title={`Nākamā spēle: ${formatFixtureDate(
                            next
                          )}`}
                        >
                          {difficulty.label}
                        </span>
                      )}
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

export default function LeagueTables({
  competition,
  season,
  leagueName,
}) {
  const [activeTab, setActiveTab] =
    useState("table");

  const [standings, setStandings] =
    useState([]);
  const [fixtures, setFixtures] =
    useState({
      upcoming: [],
      recent: [],
    });
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  const loadStandings = async () => {
    setLoading(true);
    setError("");

    try {
      const [standingsData, fixturesData] =
        await Promise.all([
          fetchLeagueStandings(
            competition,
            season
          ),
          fetchLeagueFixtures(
            competition,
            season
          ),
        ]);

      setStandings(
        Array.isArray(
          standingsData
        )
          ? standingsData
          : []
      );

      setFixtures(
        fixturesData || {
          upcoming: [],
          recent: [],
        }
      );
    } catch (err) {
      console.error(err);
      setStandings([]);
      setFixtures({
        upcoming: [],
        recent: [],
      });
      setError(
        err?.message ||
          "Neizdevās ielādēt līgas datus."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, [competition, season]);

  const tabs = [
    [
      "table",
      "League Table",
      "📊",
    ],
    [
      "scorers",
      "Top Scorers",
      "⚽",
    ],
    [
      "fixtures",
      "Fixtures & Results",
      "📅",
    ],
  ];

  const headerTitle =
    activeTab === "table"
      ? `${leagueName} līgas tabula`
      : activeTab === "scorers"
      ? `${leagueName} Top Scorers`
      : activeTab === "fixtures"
      ? `${leagueName} spēles`
      : "Flow Analytics Tools";

  const headerDescription =
    activeTab === "table"
      ? "Oficiālā turnīra tabula no API-Football izvēlētajai sezonai."
      : activeTab === "scorers"
      ? "Sezonas līderi pēc vārtiem, assistiem un Flow punktiem."
      : activeTab === "fixtures"
      ? "Nākamās spēles un jaunākie līgas rezultāti."
      : "Papildu līgas dati un analītika izvēlētajai sezonai.";

  return (
    <section>
      <div className="mb-7 overflow-hidden rounded-[28px] bg-slate-950 px-7 py-9 shadow-xl md:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            League Tables
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            {headerTitle}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {headerDescription}
          </p>
        </div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(
          ([value, label, icon]) => (
            <button
              type="button"
              key={value}
              onClick={() =>
                setActiveTab(value)
              }
              className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
                activeTab === value
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span className="mr-2">
                {icon}
              </span>
              {label}
            </button>
          )
        )}
      </div>

      {activeTab === "table" && (
        <StandingsViewEnhanced
          standings={standings}
          fixtures={fixtures}
          loading={loading}
          error={error}
          loadStandings={loadStandings}
          competition={competition}
          leagueName={leagueName}
          season={season}
        />
      )}

      {activeTab === "scorers" && (
        <LeagueTopScorers
          competition={competition}
          season={season}
          leagueName={leagueName}
        />
      )}

      {activeTab === "fixtures" && (
        <LeagueFixtures
          competition={competition}
          season={season}
          leagueName={leagueName}
        />
      )}

    </section>
  );
}
