// src/App.jsx
import React, { useState, useEffect } from 'react';
import { fetchCompetitionPlayers, COMPETITION_IDS } from './services/footballApi';
import PlayerCard from './components/PlayerCard';
import ComparisonSummary from './components/ComparisonSummary';

const CATEGORIES = [
  { id: 'GOALKEEPERS', title: 'GOALKEEPERS', desc: 'Compare goalkeepers' },
  { id: 'CENTREBACKS', title: 'CENTREBACKS', desc: 'Compare central defenders' },
  { id: 'FULLBACKS', title: 'FULLBACKS', desc: 'Compare fullbacks and wingbacks' },
  { id: 'MIDFIELDERS', title: 'MIDFIELDERS', desc: 'Compare defensive, central, and attacking midfielders' },
  { id: 'WINGERS', title: 'WINGERS', desc: 'Compare wingers and attacking midfielders' },
  { id: 'STRIKERS', title: 'STRIKERS', desc: 'Compare strikers (centre-forwards)' },
];

function App() {
  const [selectedSeason, setSelectedSeason] = useState("2025/2026");
  const [selectedCompetition, setSelectedCompetition] = useState('PL');
  const [selectedCategory, setSelectedCategory] = useState(null);
  
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
        setLoading(false);
      }
    };
    loadData();
    return () => { isMounted = false; };
  }, [selectedCompetition]);

  const filteredByCategory = players.filter(p => !selectedCategory || p.category === selectedCategory);
  const activePlayers = filteredByCategory.length > 0 ? filteredByCategory : players;

  useEffect(() => {
    if (activePlayers.length >= 2) {
      setPlayer1Id(activePlayers[0].id);
      setPlayer2Id(activePlayers[1].id);
    } else if (activePlayers.length === 1) {
      setPlayer1Id(activePlayers[0].id);
      setPlayer2Id(activePlayers[0].id);
    }
  }, [selectedCategory, players]);

  const player1 = activePlayers.find(p => p.id === Number(player1Id)) || activePlayers[0];
  const player2 = activePlayers.find(p => p.id === Number(player2Id)) || activePlayers[1] || activePlayers[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <header className="max-w-4xl mx-auto text-center mb-8">
        <h1 className="text-4xl font-extrabold text-green-400 mb-2 cursor-pointer" onClick={() => setSelectedCategory(null)}>
          DataMB Radars
        </h1>
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
              <option value={COMPETITION_IDS.LA_LIGA}>La Liga (PD)</option>
              <option value={COMPETITION_IDS.SERIE_A}>Serie A (SA)</option>
              <option value={COMPETITION_IDS.BUNDESLIGA}>Bundesliga (BL1)</option>
              <option value={COMPETITION_IDS.LIGUE_1}>Ligue 1 (FL1)</option>
            </select>
          </div>
        </div>
      </header>

      {!selectedCategory ? (
        <main className="max-w-5xl mx-auto">
          <div className="text-center mb-6">
            <span className="inline-block bg-gray-800 border border-gray-700 text-gray-300 px-6 py-2 rounded-full text-sm font-semibold tracking-wide">
              Top 5 Līgas — {selectedSeason}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {CATEGORIES.map(cat => (
              <div 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="bg-gray-800 border border-gray-700 hover:border-green-400 p-8 rounded-xl cursor-pointer transition-all duration-300 shadow-lg text-center group"
              >
                <h2 className="text-xl font-bold text-white group-hover:text-green-400 tracking-wider mb-2">{cat.title}</h2>
                <p className="text-gray-400 text-sm">{cat.desc}</p>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <button 
              onClick={() => setSelectedCategory(null)}
              className="bg-gray-800 border border-gray-700 hover:bg-gray-700 text-gray-300 px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              ← Atpakaļ uz kategorijām
            </button>
            <span className="text-green-400 font-bold uppercase tracking-wider text-sm">
              Kategorija: {selectedCategory}
            </span>
          </div>

          {loading ? (
            <div className="text-center text-gray-400 py-20">Ielādē datus...</div>
          ) : (
            <>
              <main className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PlayerCard 
                  playerId={player1 ? player1.id : ""}
                  setPlayerId={setPlayer1Id}
                  players={activePlayers}
                  playerData={player1}
                  opponentData={player2}
                />

                <PlayerCard 
                  playerId={player2 ? player2.id : ""}
                  setPlayerId={setPlayer2Id}
                  players={activePlayers}
                  playerData={player2}
                  opponentData={player1}
                />
              </main>

              <ComparisonSummary player1={player1} player2={player2} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;