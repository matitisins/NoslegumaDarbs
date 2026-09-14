// src/components/ComparisonSummary.jsx

import React from "react";

export default function ComparisonSummary({
  player1,
  player2,
}) {
  if (!player1 || !player2) {
    return null;
  }

  let p1Wins = 0;
  let p2Wins = 0;

  const metrics = [
    "points",
    "goals",
    "assists",
    "minutes",
    "rating",
  ];

  metrics.forEach((metric) => {
    const value1 =
      Number(player1[metric]) || 0;

    const value2 =
      Number(player2[metric]) || 0;

    if (value1 > value2) {
      p1Wins++;
    } else if (value2 > value1) {
      p2Wins++;
    }
  });

  const player1Points =
    Number(player1.points) || 0;

  const player2Points =
    Number(player2.points) || 0;

  const totalPoints =
    player1Points + player2Points;

  const p1Ratio =
    totalPoints > 0
      ? (player1Points / totalPoints) * 100
      : 50;

  const p2Ratio = 100 - p1Ratio;

  let winner = "Neizšķirts";

  if (p1Wins > p2Wins) {
    winner = player1.name;
  } else if (p2Wins > p1Wins) {
    winner = player2.name;
  }

  return (
    <div className="max-w-4xl mx-auto mt-8 bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl text-center">
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
          Head-to-Head analīze
        </span>

        <span className="text-xs px-2.5 py-1 bg-gray-700 text-green-400 font-mono font-bold rounded">
          {p1Wins} - {p2Wins}
        </span>
      </div>

      <p className="text-gray-300 text-sm mb-4">
        Uzvarētājs pēc statistikas:{" "}
        <span className="font-bold text-white">
          {winner}
        </span>
      </p>

      <div className="w-full bg-gray-700/80 h-3 rounded-full overflow-hidden flex">
        <div
          className="bg-green-400 transition-all duration-500"
          style={{
            width: `${p1Ratio}%`,
          }}
        />

        <div
          className="bg-blue-400 transition-all duration-500"
          style={{
            width: `${p2Ratio}%`,
          }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-400 font-mono mt-2 gap-4">
        <span className="text-green-300 text-left">
          {player1.name} ({player1Points} pts)
        </span>

        <span className="text-blue-300 text-right">
          {player2.name} ({player2Points} pts)
        </span>
      </div>
    </div>
  );
}