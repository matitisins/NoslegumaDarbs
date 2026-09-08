// src/components/PlayerSelect.jsx
import React, { useState } from 'react';

export default function PlayerSelect({ playerId, setPlayerId, players }) {
  const safePlayers = Array.isArray(players) ? players : [];
  const [searchQuery, setSearchQuery] = useState("");

  // Filtrējam spēlētājus pēc teksta meklēšanas laukā
  const filteredPlayers = safePlayers.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.team.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    // Ja lietotājs kaut ko ieraksta, automātiski atlasām pirmo sakritību
    const matched = safePlayers.find(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.team.toLowerCase().includes(query.toLowerCase())
    );
    
    if (matched) {
      setPlayerId(matched.id);
    }
  };

  const handleSelectChange = (e) => {
    const id = Number(e.target.value);
    setPlayerId(id);
    const selectedPlayer = safePlayers.find(p => p.id === id);
    if (selectedPlayer) {
      setSearchQuery(""); // Notīkam meklēšanu, kad izvēlas no saraksta
    }
  };

  return (
    <div className="mb-4">
      <input 
        type="text"
        placeholder="Meklēt spēlētāju vai klubu..."
        value={searchQuery}
        onChange={handleInputChange}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mb-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
      />
      
      <select 
        value={playerId} 
        onChange={handleSelectChange}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-green-400"
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map(p => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.team})
            </option>
          ))
        ) : (
          <option value="" disabled>Nav atrasts neviens spēlētājs</option>
        )}
      </select>
    </div>
  );
}