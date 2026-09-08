// src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchCompetitionPlayers, COMPETITION_IDS } from './services/footballApi';
import PlayerCard from './components/PlayerCard';
import ComparisonSummary from './components/ComparisonSummary';

function App() {
  const [selectedSeason, setSelectedSeason] = useState("2025/2026");
  const [selectedCompetition, setSelectedCompetition] = useState('PL');
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      const data = await fetchCompetitionPlayers(selectedCompetition);
      if (isMounted) {
        setPlayers(data);
        if (data.length >= 2) {
          setPlayer1Id(data[0].id);
          setPlayer2Id(data[1].id);
        }
        setLoading(false);
      }
    };

    loadData();
    return () => { isMounted = false; };
  }, [selectedCompetition]);

  const player1 = players.find(p => p.id === Number(player1Id)) || players[0];
  const player2 = players.find(p => p.id === Number(player2Id)) || players[1] || players[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-extrabold text-green-400 mb-2">Nosleguma_Darbs</h1>
        <p className="text-gray-400 mb-4">Fantasy Football Spēlētāju Salīdzināšanas Rīks</p>
        
        <div className="flex flex-wrap justify-center gap-4">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <label className="text-sm text-gray-400 mr-2">Sezona:</label>
            <select 
              value={selectedSeason} 
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 focus:outline-none focus:border-green-400"
            >
              <option value="2025/2026">2025/2026</option>
            </select>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-2">
            <label className="text-sm text-gray-400 mr-2">Turnīrs:</label>
            <select 
              value={selectedCompetition} 
              onChange={(e) => setSelectedCompetition(e.target.value)}
              className="bg-gray-700 text-white border border-gray-600 rounded px-3 py-1 focus:outline-none focus:border-green-400"
            >
              <option value={COMPETITION_IDS.PREMIER_LEAGUE}>Premier League (PL)</option>
              <option value={COMPETITION_IDS.CHAMPIONS_LEAGUE}>Champions League (CL)</option>
              <option value={COMPETITION_IDS.SERIE_A}>Serie A (SA)</option>
              <option value={COMPETITION_IDS.LA_LIGA}>La Liga (PD)</option>
              <option value={COMPETITION_IDS.BUNDESLIGA}>Bundesliga (BL1)</option>
            </select>
          </div>
        </div>
      </header>

      {loading ? (
        <div className="text-center text-gray-400 py-20">Ielādē spēlētājus...</div>
      ) : (
        <>
          <main className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            <PlayerCard 
              playerId={player1 ? player1.id : ""}
              setPlayerId={setPlayer1Id}
              players={players}
              playerData={player1}
              opponentData={player2}
            />

            <PlayerCard 
              playerId={player2 ? player2.id : ""}
              setPlayerId={setPlayer2Id}
              players={players}
              playerData={player2}
              opponentData={player1}
            />
          </main>

          <ComparisonSummary player1={player1} player2={player2} />
        </>
      )}
    </div>
  );
}

export default App;