// src/services/apiSports.js
const API_KEY = 'ŠEIT_IERAKSTI_SAVU_API_ATSLĒGU';
const BASE_URL = 'https://v3.football.api-sports.io';

const headers = {
  'x-apisports-key': API_KEY
};

export const COMPETITION_IDS = {
  PREMIER_LEAGUE: 39,
  LA_LIGA: 140,
  SERIE_A: 135,
  BUNDESLIGA: 78,
  LIGUE_1: 61
};

export const fetchApiSportsPlayers = async (leagueId = 39, season = 2025) => {
  try {
    const response = await fetch(`${BASE_URL}/players?league=${leagueId}&season=${season}`, {
      method: 'GET',
      headers: headers
    });
    const data = await response.json();
    
    if (data && data.response && data.response.length > 0) {
      return data.response.map((item, index) => {
        const p = item.player;
        const stats = item.statistics[0] || {};
        
        return {
          id: p.id || index + 1,
          name: p.name,
          team: stats.team?.name || "Nezināms klubs",
          league: leagueId.toString(),
          goals: stats.goals?.total || 0,
          assists: stats.goals?.assists || 0,
          minutes: stats.games?.minutes || 0,
          yellowCards: stats.cards?.yellow || 0,
          points: ((stats.goals?.total || 0) * 5) + ((stats.goals?.assists || 0) * 3),
          position: stats.games?.position || "ST",
          category: "STRIKERS"
        };
      });
    }
    return [];
  } catch (error) {
    console.error("Kļūda, ielādējot datus no API-Sports:", error);
    return [];
  }
};