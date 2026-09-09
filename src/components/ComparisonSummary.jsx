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
  const p1Ratio = (player1.points / totalPoints) * 100;

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl text-center">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Head-to-Head Analīze</span>
        <span className="text-xs px-2.5 py-1 bg-gray-700 text-green-400 font-mono font-bold rounded">
          {p1Wins} - {p2Wins}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        <span className="font-semibold text-white">{player1.name}</span> dominē <span className="text-green-400 font-bold">{p1Wins}</span> kategorijās, kamēr <span className="font-semibold text-white">{player2.name}</span> pārspēj <span className="text-blue-400 font-bold">{p2Wins}</span>.
      </p>

      <div className="w-full bg-gray-700/80 h-3 rounded-full overflow-hidden flex p-0.5 gap-0.5">
        <div 
          className="bg-green-400 rounded-l transition-all duration-500" 
          style={{ width: `${p1Ratio}%` }}
          title={`${player1.name} daļa`}
        ></div>
        <div 
          className="bg-blue-400 rounded-r transition-all duration-500" 
          style={{ width: `${100 - p1Ratio}%` }}
          title={`${player2.name} daļa`}
        ></div>
      </div>

      <div className="flex justify-between text-xs text-gray-400 font-mono mt-2">
        <span className="text-green-300">{player1.name} ({player1.points} pts)</span>
        <span className="text-blue-300">{player2.name} ({player2.points} pts)</span>
      </div>
    </div>
  );
}