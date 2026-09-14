// src/components/RadarChart.jsx

import React from "react";

export default function RadarChart({
  players = [],
}) {
  if (
    !Array.isArray(players) ||
    players.length === 0
  ) {
    return null;
  }

  const keys = Object.keys(
    players[0]?.customStats || {}
  );

  if (keys.length === 0) {
    return (
      <div className="relative w-full max-w-[420px] mx-auto aspect-square flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
        <p className="text-sm text-slate-400">
          Nav pietiekamu datu radara grafikam.
        </p>
      </div>
    );
  }

  const total = keys.length;
  const center = 160;
  const radius = 110;

  const playerColors = [
    {
      fill: "rgba(244, 63, 94, 0.15)",
      stroke: "#f43f5e",
      dot: "#f43f5e",
    },
    {
      fill: "rgba(34, 197, 94, 0.15)",
      stroke: "#22c55e",
      dot: "#22c55e",
    },
  ];

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-square flex items-center justify-center bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full overflow-visible"
        role="img"
        aria-label="Spēlētāju radara salīdzinājums"
      >
        {[0.25, 0.5, 0.75, 1].map(
          (level, index) => (
            <circle
              key={index}
              cx={center}
              cy={center}
              r={radius * level}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray={
                index < 3
                  ? "3 3"
                  : undefined
              }
            />
          )
        )}

        {keys.map((key, index) => {
          const angle =
            (Math.PI * 2 / total) * index -
            Math.PI / 2;

          const x2 =
            center +
            radius * Math.cos(angle);

          const y2 =
            center +
            radius * Math.sin(angle);

          const labelRadius = radius + 32;

          const lx =
            center +
            labelRadius *
              Math.cos(angle);

          const ly =
            center +
            labelRadius *
              Math.sin(angle);

          const label = key
            .replace(/([A-Z])/g, " $1")
            .replace(/^./, (char) =>
              char.toUpperCase()
            );

          return (
            <React.Fragment key={key}>
              <line
                x1={center}
                y1={center}
                x2={x2}
                y2={y2}
                stroke="#e2e8f0"
                strokeWidth="1"
              />

              <text
                x={lx}
                y={ly}
                fill="#64748b"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                dominantBaseline="central"
              >
                {label}
              </text>
            </React.Fragment>
          );
        })}

        {players.map(
          (player, playerIndex) => {
            const stats =
              player.customStats || {};

            const color =
              playerColors[
                playerIndex %
                  playerColors.length
              ];

            const pointsData = keys.map(
              (key, index) => {
                const angle =
                  (Math.PI * 2 / total) *
                    index -
                  Math.PI / 2;

                const rawValue =
                  stats[key] !== undefined
                    ? stats[key]
                    : 0;

                const numericValue =
                  parseFloat(
                    String(rawValue).replace(
                      "%",
                      ""
                    )
                  ) || 0;

                const clampedValue =
                  Math.min(
                    Math.max(
                      numericValue,
                      0
                    ),
                    100
                  );

                const r =
                  (clampedValue / 100) *
                  radius;

                const x =
                  center +
                  r * Math.cos(angle);

                const y =
                  center +
                  r * Math.sin(angle);

                return { x, y };
              }
            );

            const polygonPoints =
              pointsData
                .map(
                  (point) =>
                    `${point.x},${point.y}`
                )
                .join(" ");

            return (
              <g
                key={`${player.id}-${playerIndex}`}
              >
                <polygon
                  points={polygonPoints}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth="2"
                />

                {pointsData.map(
                  (point, index) => (
                    <circle
                      key={index}
                      cx={point.x}
                      cy={point.y}
                      r="3.5"
                      fill={color.dot}
                    />
                  )
                )}
              </g>
            );
          }
        )}
      </svg>

      <div className="absolute bottom-3 left-3 flex items-center gap-3 bg-white/90 rounded-lg px-2 py-1 shadow-sm">
        {players.map(
          (player, index) => (
            <div
              key={`${player.id}-legend`}
              className="flex items-center gap-1"
            >
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  index === 0
                    ? "bg-rose-500"
                    : "bg-emerald-500"
                }`}
              />

              <span className="text-[9px] font-semibold text-slate-500 max-w-24 truncate">
                {player.name}
              </span>
            </div>
          )
        )}
      </div>
    </div>
  );
}