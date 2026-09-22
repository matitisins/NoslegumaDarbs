import React from "react";

const getRadar = player => {
  const stats =
    player?.customStats || {};

  return {
    labels: Array.isArray(
      stats.labels
    )
      ? stats.labels
      : [],

    values: Array.isArray(
      stats.values
    )
      ? stats.values.map(
          value =>
            Math.max(
              0,
              Math.min(
                100,
                Number(value) || 0
              )
            )
        )
      : [],
  };
};

const point = (
  index,
  value,
  count,
  cx,
  cy,
  radius
) => {
  const angle =
    -Math.PI / 2 +
    (index * Math.PI * 2) /
      count;

  const r =
    (value / 100) * radius;

  return {
    x:
      cx +
      Math.cos(angle) * r,
    y:
      cy +
      Math.sin(angle) * r,
  };
};

const polygonPoints = (
  values,
  cx,
  cy,
  radius
) =>
  values
    .map(
      (value, index) => {
        const p = point(
          index,
          value,
          values.length,
          cx,
          cy,
          radius
        );

        return `${p.x},${p.y}`;
      }
    )
    .join(" ");

const gridPoints = (
  level,
  count,
  cx,
  cy,
  radius
) =>
  Array.from(
    { length: count },
    (_, index) =>
      point(
        index,
        level,
        count,
        cx,
        cy,
        radius
      )
  )
    .map(
      p => `${p.x},${p.y}`
    )
    .join(" ");

export default function RadarChart({
  players = [],
}) {
  const first =
    players[0] || null;

  const second =
    players[1] || null;

  const firstRadar =
    getRadar(first);

  const secondRadar =
    getRadar(second);

  const labels =
    firstRadar.labels
      .length
      ? firstRadar.labels
      : secondRadar.labels;

  const count =
    labels.length || 6;

  const firstStats =
    firstRadar.values
      .length
      ? firstRadar.values
      : Array(count).fill(
          0
        );

  const secondStats =
    secondRadar.values
      .length
      ? secondRadar.values
      : Array(count).fill(
          0
        );

  const cx = 300;
  const cy = 220;
  const radius = 150;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox="0 0 600 520"
        className="mx-auto block h-auto w-full max-w-3xl"
      >
        {[20, 40, 60, 80, 100].map(
          level => (
            <polygon
              key={level}
              points={gridPoints(
                level,
                count,
                cx,
                cy,
                radius
              )}
              fill="none"
              stroke="#dbe4ee"
              strokeWidth="1"
            />
          )
        )}

        {labels.map(
          (label, index) => {
            const end =
              point(
                index,
                100,
                count,
                cx,
                cy,
                radius
              );

            return (
              <line
                key={label}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke="#dbe4ee"
                strokeWidth="1"
              />
            );
          }
        )}

        {first && (
          <>
            <polygon
              points={polygonPoints(
                firstStats,
                cx,
                cy,
                radius
              )}
              fill="#fb7185"
              fillOpacity="0.20"
              stroke="#f43f5e"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {firstStats.map(
              (value, index) => {
                const p =
                  point(
                    index,
                    value,
                    count,
                    cx,
                    cy,
                    radius
                  );

                return (
                  <circle
                    key={`first-${index}`}
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="white"
                    stroke="#f43f5e"
                    strokeWidth="3"
                  />
                );
              }
            )}
          </>
        )}

        {second && (
          <>
            <polygon
              points={polygonPoints(
                secondStats,
                cx,
                cy,
                radius
              )}
              fill="#10b981"
              fillOpacity="0.18"
              stroke="#10b981"
              strokeWidth="3"
              strokeLinejoin="round"
            />

            {secondStats.map(
              (value, index) => {
                const p =
                  point(
                    index,
                    value,
                    count,
                    cx,
                    cy,
                    radius
                  );

                return (
                  <circle
                    key={`second-${index}`}
                    cx={p.x}
                    cy={p.y}
                    r="5"
                    fill="white"
                    stroke="#10b981"
                    strokeWidth="3"
                  />
                );
              }
            )}
          </>
        )}

        {labels.map(
          (label, index) => {
            const p =
              point(
                index,
                118,
                count,
                cx,
                cy,
                radius
              );

            let anchor =
              "middle";

            if (
              p.x <
              cx - 30
            ) {
              anchor = "end";
            }

            if (
              p.x >
              cx + 30
            ) {
              anchor = "start";
            }

            return (
              <text
                key={label}
                x={p.x}
                y={p.y}
                textAnchor={
                  anchor
                }
                dominantBaseline="middle"
                className="fill-slate-600 text-[12px] font-bold"
              >
                {label}
              </text>
            );
          }
        )}
      </svg>

      <div className="flex flex-wrap items-center justify-center gap-6 pb-2 pt-1">
        {first && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-rose-500" />

            <span className="text-sm font-bold text-slate-700">
              {first.name}
            </span>
          </div>
        )}

        {second && (
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-emerald-500" />

            <span className="text-sm font-bold text-slate-700">
              {second.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}