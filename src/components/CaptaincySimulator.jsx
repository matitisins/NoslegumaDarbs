// src/components/CaptaincySimulator.jsx

import React from "react";

export default function CaptaincySimulator({
  player1,
  player2,
}) {
  if (!player1 || !player2) {
    return null;
  }

  /*
   * FDR is a simplified estimate.
   *
   * API-Football's player endpoint does not directly provide
   * a fantasy FDR value, so we use a neutral baseline and
   * combine it with the player's season performance.
   */

  const getFdr = (player) => {
    const rating = Number(player?.rating) || 0;

    if (rating >= 7.5) return 2;
    if (rating >= 7) return 3;
    if (rating >= 6.5) return 4;

    return 5;
  };

  const p1FDR = getFdr(player1);
  const p2FDR = getFdr(player2);

  const p1Points = Number(player1.points) || 0;
  const p2Points = Number(player2.points) || 0;

  const project = (points, fdr) => {
    const multiplier = (6 - fdr) / 5;

    return Math.max(
      0,
      Math.round(points * multiplier)
    );
  };

  const p1Projected = project(
    p1Points,
    p1FDR
  );

  const p2Projected = project(
    p2Points,
    p2FDR
  );

  const isP1Better =
    p1Projected >= p2Projected;

  const PlayerResult = ({
    player,
    projected,
    fdr,
    recommended,
  }) => (
    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center">
      <p className="text-xs text-slate-500 truncate">
        {player.name}
      </p>

      <p className="text-2xl font-extrabold text-slate-800 mt-1">
        {projected * 2}{" "}
        <span className="text-xs font-normal text-slate-400">
          pts
        </span>
      </p>

      <p className="text-[11px] text-slate-400 mt-1">
        FDR: {fdr}/5
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
          Kapteiņa izvēles prognoze (2x)
        </span>

        <span className="text-xs bg-emerald-50 text-emerald-600 font-bold px-2 py-0.5 rounded border border-emerald-200">
          FDR analīze
        </span>
      </div>

      <p className="text-xs text-slate-500 text-center mb-4">
        Vienkāršota prognoze, izmantojot sezonas
        Fantasy punktus un spēlētāja reitingu.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <PlayerResult
          player={player1}
          projected={p1Projected}
          fdr={p1FDR}
          recommended={isP1Better}
        />

        <PlayerResult
          player={player2}
          projected={p2Projected}
          fdr={p2FDR}
          recommended={!isP1Better}
        />
      </div>
    </div>
  );
}