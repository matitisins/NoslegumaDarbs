// src/components/ComparisonSummary.jsx
import React from 'react';

export default function ComparisonSummary({ player1, player2 }) {
  if (!player1 || !player2) return null;

  let p1Wins = 0;
  let p2Wins = 0;

  const metrics = ['points', 'goals', 'assists', 'minutes'];
  metrics.forEach(metric => {
    if (player1[metric] > player2[metric]) p1Wins++;
    else if (player2[metric] > player1[metric]) p2Wins++;
  });

  const totalPoints = (player1.points + player2.points) || 1;

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg text-center">
      <h2 className="text-xl font-bold text-green-400 mb-2">Salīdzinājuma kopsavilkums</h2>
      <p className="text-gray-300 text-sm mb-4">
        <span className="font-semibold text-white">{player1.name}</span> uzvar <span className="text-green-400 font-bold">{p1Wins}</span> no 4 galvenajām kategorijām, kamēr <span className="font-semibold text-white">{player2.name}</span> uzvar <span className="text-green-400 font-bold">{p2Wins}</span>.
      </p>

      <div className="w-full bg-gray-700 h-4 rounded-full overflow-hidden flex">
        <div 
          className="bg-green-500 transition-all duration-500" 
          style={{ width: `${(player1.points / totalPoints) * 100}%` }}
          title={`${player1.name} punkti`}
        ></div>
        <div 
          className="bg-blue-500 transition-all duration-500" 
          style={{ width: `${(player2.points / totalPoints) * 100}%` }}
          title={`${player2.name} punkti`}
        ></div>
      </div>
      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>{player1.name} ({player1.points} pts)</span>
        <span>{player2.name} ({player2.points} pts)</span>
      </div>
    </div>
  );
}