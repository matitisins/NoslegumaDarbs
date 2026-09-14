import {
  COMPETITION_IDS,
  fetchApiSportsPlayers,
  seasonToApiSeason,
  fetchCompetitionStandings,
  getTeamFdr,
} from "./apiSports";

export {
  COMPETITION_IDS,
  seasonToApiSeason,
  fetchCompetitionStandings,
  getTeamFdr,
};

export const fetchCompetitionPlayers =
  async (
    competitionCode = "PL",
    season = 2026,
    options = {}
  ) => {
    return fetchApiSportsPlayers(
      competitionCode,
      season,
      options
    );
  };