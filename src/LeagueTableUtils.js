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

    // API-Football's standings form should contain the last five results.
    // If an older/partial cached response only contains one result, ignore it
    // and build the form from the actual recent fixtures instead.
    if (results.length >= 5) {
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


export {
  valueOrDash,
  getGoalDifference,
  getTeamName,
  getTeamLogo,
  getPlayed,
  getWins,
  getDraws,
  getLosses,
  getGoalsFor,
  getGoalsAgainst,
  getCompetitionZones,
  getTableZone,
  getTeamId,
  getTeamShortName,
  getFixtureDate,
  formatFixtureDate,
  getFixtureTeams,
  getFixtureGoals,
  getTeamFixtureResult,
  getTeamForm,
  getFormLabel,
  getFixtureDifficulty,
  getHomeAwayStats,
};