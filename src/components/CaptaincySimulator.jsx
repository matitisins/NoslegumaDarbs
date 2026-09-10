// src/components/CaptaincySimulator.jsx

import React from "react";

export default function CaptaincySimulator({ player1, player2 }) {
  const p1FDR = 2;
  const p2FDR = 4;

  const p1Points = Number(player1?.points) || 0;
  const p2Points = Number(player2?.points) || 0;

  const project = (points, fdr) =>
    Math.max(0, Math.round((points / 5) * (6 - fdr)));

  const p1Projected = project(p1Points, p1FDR);
  const p2Projected = project(p2Points, p2FDR);

  const isP1Better = p1Projected >= p2Projected;

  const PlayerResult = ({ player, projected, recommended }) => (
    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center">
      <p className="text-xs text-slate-500 truncate">
        {player.name}
      </p>

      <p className="text-2xl font-extrabold text-slate-800 mt-1">
        {projected * 2}{" "}
        <span className="text-xs font-normal text-slate-400">
          pts
        </span>
      </p>

      <span
        className={`inline-block mt-2 text-[10px] px-2 py-0.5 rounded border ${
          recommended
            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
            : "bg-slate-100 text-slate-500 border-slate-200"
        }`}
      >
        {recommended
          ? "Ieteicams kapteinim"
          : "Parasta izvēle"}
      </span>
    </div>
  );

  return (
    <div className="mt-6 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs uppercase font-semibold text-slate-600 tracking-wider">
          Kapteiņa Izvēles Prognoze (2x)
        </span>

        <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-200">
          FDR Analīze
        </span>
      </div>

      <p className="text-xs text-slate-500 text-center mb-4">
        Aprēķinātie prognozētie punkti nākamajā kārtā,
        ņemot vērā pretinieka kalendāru.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <PlayerResult
          player={player1}
          projected={p1Projected}
          recommended={isP1Better}
        />

        <PlayerResult
          player={player2}
          projected={p2Projected}
          recommended={!isP1Better}
        />
      </div>
    </div>
  );
}