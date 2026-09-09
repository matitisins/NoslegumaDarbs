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
  if (!playerData || !opponentData) return null;

  const renderMetricRow = (label, val1, val2, isHigherBetter = true) => {
    const diff = val1 - val2;
    const isWinning = isHigherBetter ? diff > 0 : diff < 0;
    const isEven = val1 === val2;

    const maxVal = Math.max(val1, val2, 1);
    const p1Percent = (val1 / maxVal) * 100;

    return (
      <div className="py-2.5 border-b border-gray-700/50 text-sm">
        <div className="flex justify-between items-center mb-1">
          <span className="text-gray-400 text-xs">{label}</span>
          <div className="flex items-center gap-2">
            <span className={`font-mono font-bold text-sm ${isEven ? 'text-white' : isWinning ? 'text-green-400' : 'text-gray-400'}`}>
              {val1}
            </span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${isEven ? 'bg-gray-700 text-gray-300' : isWinning ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
              {diff > 0 ? `+${diff}` : diff}
            </span>
          </div>
        </div>
        <div className="w-full bg-gray-700/60 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${isWinning ? 'bg-green-400' : isEven ? 'bg-gray-400' : 'bg-blue-400'}`}
            style={{ width: `${Math.max(p1Percent, 5)}%` }}
          ></div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-semibold px-2.5 py-1 bg-green-900/50 text-green-300 rounded-full border border-green-700/50">
          {playerData.position || "FW"}
        </span>
        <span className="text-xs text-gray-400 font-medium">Klubs: <span className="text-gray-200">{playerData.team}</span></span>
      </div>

      <PlayerSelect 
        playerId={playerId}
        setPlayerId={setPlayerId}
        players={players}
      />
      
      <div className="mt-4 space-y-1">
        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Scouting Metrikas</div>
        {renderMetricRow("Fantasy Punkti", playerData.points, opponentData.points)}
        {renderMetricRow("Vārti", playerData.goals, opponentData.goals)}
        {renderMetricRow("Piespēles", playerData.assists, opponentData.assists)}
        {renderMetricRow("Nospēlētās minūtes", playerData.minutes, opponentData.minutes)}
        {renderMetricRow("Dzeltenās kartītes", playerData.yellowCards, opponentData.yellowCards, false)}
      </div>
    </div>
  );
}