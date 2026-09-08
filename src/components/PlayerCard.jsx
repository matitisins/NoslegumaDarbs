// src/components/PlayerCard.jsx
import React from 'react';
import PlayerSelect from './PlayerSelect';

export default function PlayerCard({ 
  playerId, 
  setPlayerId, 
  players, 
  playerData, 
  opponentData 
}) {
  const getHighlightClass = (val1, val2, isHigherBetter = true) => {
    if (val1 === val2) return "text-white";
    if (isHigherBetter ? val1 > val2 : val1 < val2) {
      return "text-green-400 font-bold";
    }
    return "text-gray-300";
  };

  if (!playerData) return null;

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg">
      <PlayerSelect 
        playerId={playerId}
        setPlayerId={setPlayerId}
        players={players}
      />

      <p className="text-sm text-gray-400 mb-4">Klubs: <span className="text-gray-200">{playerData.team}</span></p>
      
      <div className="space-y-2 text-gray-300">
        <p>Fantasy Punkti: <span className={getHighlightClass(playerData.points, opponentData.points)}>{playerData.points}</span></p>
        <p>Vārti: <span className={getHighlightClass(playerData.goals, opponentData.goals)}>{playerData.goals}</span></p>
        <p>Piespēles: <span className={getHighlightClass(playerData.assists, opponentData.assists)}>{playerData.assists}</span></p>
        <p>Minūtes: <span className={getHighlightClass(playerData.minutes, opponentData.minutes)}>{playerData.minutes}</span></p>
        <p>Dzeltenās kartītes: <span className={getHighlightClass(playerData.yellowCards, opponentData.yellowCards, false)}>{playerData.yellowCards}</span></p>
      </div>
    </div>
  );
}