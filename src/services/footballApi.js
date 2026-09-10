// src/services/footballApi.js

import { COMPETITION_PLAYERS } from "./mockPlayers";

export const COMPETITION_IDS = {
  PREMIER_LEAGUE: "PL",
  LA_LIGA: "PD",
  SERIE_A: "SA",
  BUNDESLIGA: "BL1",
  LIGUE_1: "FL1",
};

export const fetchCompetitionPlayers = async (
  competitionCode = "PL"
) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data =
        COMPETITION_PLAYERS[competitionCode] ||
        COMPETITION_PLAYERS.PL;

      resolve(data);
    }, 50);
  });
};