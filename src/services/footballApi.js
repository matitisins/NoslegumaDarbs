// src/services/footballApi.js
export const COMPETITION_IDS = {
  PREMIER_LEAGUE: 'PL',
  CHAMPIONS_LEAGUE: 'CL',
  SERIE_A: 'SA',
  LA_LIGA: 'PD',
  BUNDESLIGA: 'BL1'
};

const ALL_PLAYERS = {
  PL: [
    { id: 101, name: "Erling Haaland", team: "Manchester City", goals: 27, assists: 5, minutes: 2100, yellowCards: 2, points: 195, position: "FW" },
    { id: 102, name: "Cole Palmer", team: "Chelsea", goals: 20, assists: 9, minutes: 2400, yellowCards: 4, points: 210, position: "MF" },
    { id: 103, name: "Bukayo Saka", team: "Arsenal", goals: 16, assists: 11, minutes: 2500, yellowCards: 3, points: 185, position: "MF" },
    { id: 104, name: "Ollie Watkins", team: "Aston Villa", goals: 19, assists: 13, minutes: 2450, yellowCards: 5, points: 202, position: "FW" },
    { id: 105, name: "Mohamed Salah", team: "Liverpool", goals: 18, assists: 10, minutes: 2300, yellowCards: 1, points: 198, position: "FW" }
  ],
  CL: [
    { id: 201, name: "Kylian Mbappé", team: "Real Madrid", goals: 8, assists: 3, minutes: 900, yellowCards: 1, points: 85, position: "FW" },
    { id: 202, name: "Harry Kane", team: "Bayern Munich", goals: 9, assists: 2, minutes: 880, yellowCards: 2, points: 90, position: "FW" },
    { id: 203, name: "Vinicius Junior", team: "Real Madrid", goals: 6, assists: 5, minutes: 850, yellowCards: 3, points: 78, position: "FW" },
    { id: 204, name: "Jude Bellingham", team: "Real Madrid", goals: 4, assists: 5, minutes: 920, yellowCards: 2, points: 72, position: "MF" }
  ],
  SA: [
    { id: 301, name: "Lautaro Martínez", team: "Inter Milan", goals: 24, assists: 3, minutes: 2400, yellowCards: 4, points: 180, position: "FW" },
    { id: 302, name: "Dusan Vlahovic", team: "Juventus", goals: 16, assists: 4, minutes: 2200, yellowCards: 3, points: 145, position: "FW" },
    { id: 303, name: "Paulo Dybala", team: "Roma", goals: 13, assists: 9, minutes: 2100, yellowCards: 2, points: 155, position: "MF" }
  ],
  PD: [
    { id: 401, name: "Robert Lewandowski", team: "Barcelona", goals: 19, assists: 8, minutes: 2300, yellowCards: 2, points: 175, position: "FW" },
    { id: 402, name: "Antoine Griezmann", team: "Atletico Madrid", goals: 16, assists: 6, minutes: 2400, yellowCards: 3, points: 160, position: "FW" },
    { id: 403, name: "Jude Bellingham", team: "Real Madrid", goals: 19, assists: 6, minutes: 2500, yellowCards: 4, points: 185, position: "MF" }
  ],
  BL1: [
    { id: 501, name: "Harry Kane", team: "Bayern Munich", goals: 36, assists: 8, minutes: 2600, yellowCards: 1, points: 240, position: "FW" },
    { id: 502, name: "Serhou Guirassy", team: "Stuttgart", goals: 28, assists: 2, minutes: 2200, yellowCards: 2, points: 190, position: "FW" }
  ]
};

// Asinhrona funkcija, kas imitē reāla API pieprasījuma aizkavi un atgriež datus
export const fetchCompetitionPlayers = async (competitionCode = 'PL') => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const data = ALL_PLAYERS[competitionCode] || ALL_PLAYERS.PL;
      resolve(data);
    }, 150);
  });
};