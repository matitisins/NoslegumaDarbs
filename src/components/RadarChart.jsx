import React from "react";

const DEFAULT_STATS = [
  {
    key: "goals",
    label: "Vārti",
  },
  {
    key: "assists",
    label: "Assist",
  },
  {
    key: "points",
    label: "Punkti",
  },
  {
    key: "appearances",
    label: "Spēles",
  },
  {
    key: "cleanSheets",
    label: "Clean sheets",
  },
  {
    key: "experience",
    label: "Pieredze",
  },
];

function getStatValue(
  player,
  key
) {
  const value =
    player?.customStats?.[
      key
    ];

  const number =
    Number(value);

  if (
    Number.isFinite(number)
  ) {
    return Math.max(
      0,
      Math.min(100, number)
    );
  }

  return 0;
}

function polarToCartesian(
  center,
  radius,
  angle
) {
  const radians =
    ((angle - 90) *
      Math.PI) /
    180;

  return {
    x:
      center +
      radius *
        Math.cos(radians),

    y:
      center +
      radius *
        Math.sin(radians),
  };
}

function createPolygon(
  values,
  center,
  radius
) {
  return values
    .map(
      (value, index) => {
        const angle =
          (360 /
            values.length) *
          index;

        const point =
          polarToCartesian(
            center,
            (radius *
              value) /
              100,
            angle
          );

        return `${point.x},${point.y}`;
      }
    )
    .join(" ");
}

function createGridPolygon(
  count,
  center,
  radius,
  level
) {
  const values =
    Array(count).fill(
      level
    );

  return createPolygon(
    values,
    center,
    radius
  );
}

export default function RadarChart({
  players = [],
  stats = DEFAULT_STATS,
  height = 420,
}) {
  const validPlayers =
    players.filter(Boolean);

  if (!validPlayers.length) {
    return (
      <div className="flex min-h-[300px] items-center justify-center rounded-2xl bg-slate-50">
        <p className="text-sm text-slate-400">
          Nav spēlētāju datu.
        </p>
      </div>
    );
  }

  const size = 420;
  const center = size / 2;
  const radius = 145;

  const statValues =
    validPlayers.map(
      player =>
        stats.map(stat =>
          getStatValue(
            player,
            stat.key
          )
        )
    );

  const axisPoints =
    stats.map(
      (_, index) => {
        const angle =
          (360 /
            stats.length) *
          index;

        return polarToCartesian(
          center,
          radius,
          angle
        );
      }
    );

  const playerColors = [
    {
      fill: "rgba(244,63,94,0.16)",
      stroke: "#f43f5e",
    },
    {
      fill: "rgba(16,185,129,0.16)",
      stroke: "#10b981",
    },
  ];

  return (
    <div className="w-full">
      <div className="relative mx-auto w-full max-w-[520px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          width="100%"
          height={height}
          role="img"
          aria-label="Spēlētāju statistikas radara diagramma"
        >
          {/* GRID */}
          {[20, 40, 60, 80, 100].map(
            level => (
              <polygon
                key={level}
                points={createGridPolygon(
                  stats.length,
                  center,
                  radius,
                  level
                )}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            )
          )}

          {/* AXES */}
          {axisPoints.map(
            (point, index) => (
              <line
                key={`axis-${index}`}
                x1={center}
                y1={center}
                x2={point.x}
                y2={point.y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
            )
          )}

          {/* PLAYER POLYGONS */}
          {statValues.map(
            (values, playerIndex) => {
              const style =
                playerColors[
                  playerIndex %
                    playerColors.length
                ];

              return (
                <polygon
                  key={`player-${playerIndex}`}
                  points={createPolygon(
                    values,
                    center,
                    radius
                  )}
                  fill={style.fill}
                  stroke={style.stroke}
                  strokeWidth="3"
                  strokeLinejoin="round"
                />
              );
            }
          )}

          {/* PLAYER POINTS */}
          {statValues.map(
            (values, playerIndex) => {
              const style =
                playerColors[
                  playerIndex %
                    playerColors.length
                ];

              return values.map(
                (
                  value,
                  index
                ) => {
                  const angle =
                    (360 /
                      stats.length) *
                    index;

                  const point =
                    polarToCartesian(
                      center,
                      (radius *
                        value) /
                        100,
                      angle
                    );

                  return (
                    <circle
                      key={`${playerIndex}-${index}`}
                      cx={point.x}
                      cy={point.y}
                      r="4"
                      fill="white"
                      stroke={
                        style.stroke
                      }
                      strokeWidth="2"
                    />
                  );
                }
              );
            }
          )}

          {/* LABELS */}
          {axisPoints.map(
            (point, index) => {
              const angle =
                (360 /
                  stats.length) *
                index;

              const labelPoint =
                polarToCartesian(
                  center,
                  radius + 34,
                  angle
                );

              const anchor =
                labelPoint.x <
                center - 10
                  ? "end"
                  : labelPoint.x >
                    center + 10
                  ? "start"
                  : "middle";

              return (
                <text
                  key={`label-${index}`}
                  x={labelPoint.x}
                  y={labelPoint.y}
                  textAnchor={
                    anchor
                  }
                  dominantBaseline="middle"
                  className="fill-slate-500 text-[11px] font-bold"
                >
                  {stats[index].label}
                </text>
              );
            }
          )}

          {/* CENTER */}
          <circle
            cx={center}
            cy={center}
            r="3"
            fill="#94a3b8"
          />
        </svg>
      </div>

      {/* LEGEND */}
      <div className="mt-3 flex flex-wrap justify-center gap-5">
        {validPlayers
          .slice(0, 2)
          .map(
            (
              player,
              index
            ) => {
              const style =
                playerColors[
                  index %
                    playerColors.length
                ];

              return (
                <div
                  key={
                    player.id ||
                    index
                  }
                  className="flex items-center gap-2"
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor:
                        style.stroke,
                    }}
                  />

                  <span className="text-xs font-bold text-slate-600">
                    {player.name ||
                      `Spēlētājs ${
                        index + 1
                      }`}
                  </span>
                </div>
              );
            }
          )}
      </div>
    </div>
  );
}