// src/services/apiSports.js

const API_KEY = import.meta.env.VITE_API_SPORTS_KEY;

const BASE_URL = "https://v3.football.api-sports.io";

const headers = {
  "x-apisports-key": API_KEY,
};

export const COMPETITION_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61,
};

export const fetchApiSportsPlayers = async (
  leagueId = 39,
  season = 2025
) => {
  if (!API_KEY) {
    console.error(
      "API-Sports API key is missing. Add VITE_API_SPORTS_KEY to your .env file."
    );

    return [];
  }

  try {
    const response = await fetch(
      `${BASE_URL}/players?league=${leagueId}&season=${season}`,
      {
        method: "GET",
        headers,
      }
    );

    if (!response.ok) {
      throw new Error(
        `API request failed with status ${response.status}`
      );
    }

    const data = await response.json();

    if (
      !data ||
      !Array.isArray(data.response) ||
      data.response.length === 0
    ) {
      return [];
    }

    return data.response
      .map((item, index) => {
        const player = item?.player || {};
        const stats = item?.statistics?.[0] || {};

        return {
          id: player.id || index + 1,
          name: player.name || "Nezināms spēlētājs",
          team: stats.team?.name || "Nezināms klubs",
          league: String(leagueId),

          goals: Number(stats.goals?.total) || 0,
          assists: Number(stats.goals?.assists) || 0,
          minutes: Number(stats.games?.minutes) || 0,
          yellowCards: Number(stats.cards?.yellow) || 0,

          points:
            (Number(stats.goals?.total) || 0) * 5 +
            (Number(stats.goals?.assists) || 0) * 3,

          position: stats.games?.position || "ST",
          category: "STRIKERS",
        };
      })
      .filter((player) => player.name);
  } catch (error) {
    console.error(
      "Kļūda, ielādējot datus no API-Sports:",
      error
    );

    return [];
  }
};