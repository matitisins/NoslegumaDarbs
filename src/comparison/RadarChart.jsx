import React, {
  useMemo,
} from "react";

const STATS = [
  ["goals", "Vārti"],
  ["assists", "Assist"],
  ["points", "Fantasy"],
  ["appearances", "Spēles"],
  ["cleanSheets", "Clean sheets"],
  ["minutes", "Minūtes"],
];

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getValues(player) {
  return STATS.map(
    ([key]) => num(player?.[key])
  );
}

function normalize(
  values,
  index
) {
  const max = Math.max(
    1,
    ...values.map(item => item[index])
  );

  return values.map(
    item => item[index] / max
  );
}

function point(
  index,
  radius,
  center,
  total
) {
  const angle =
    -Math.PI / 2 +
    (index * Math.PI * 2) / total;

  return {
    x:
      center +
      Math.cos(angle) * radius,
    y:
      center +
      Math.sin(angle) * radius,
  };
}

function polygon(
  values,
  radius,
  center
) {
  return values
    .map((value, index) => {
      const p = point(
        index,
        radius * value,
        center,
        values.length
      );

      return `${p.x},${p.y}`;
    })
    .join(" ");
}

export default function RadarChart({
  players = [],
}) {
  const first = players[0];
  const second = players[1];

  const raw = useMemo(
    () => [
      getValues(first),
      getValues(second),
    ],
    [first, second]
  );

  const normalized =
    useMemo(() => {
      return STATS.map(
        (_, index) => {
          const max = Math.max(
            1,
            raw[0]?.[index] || 0,
            raw[1]?.[index] || 0
          );

          return [
            (raw[0]?.[index] || 0) /
              max,
            (raw[1]?.[index] || 0) /
              max,
          ];
        }
      );
    }, [raw]);

  if (!first || !second) {
    return null;
  }

  const size = 420;
  const center = size / 2;
  const radius = 145;
  const rings = [0.25, 0.5, 0.75, 1];

  const firstValues =
    normalized.map(item => item[0]);

  const secondValues =
    normalized.map(item => item[1]);

  return (
    <div className="w-full overflow-hidden">
      <div className="mx-auto w-full max-w-[520px]">
        <svg
          viewBox={`0 0 ${size} ${size}`}
          className="h-auto w-full"
        >
          {/* Rings */}
          {rings.map(ring => (
            <polygon
              key={ring}
              points={polygon(
                Array(STATS.length).fill(
                  ring
                ),
                radius,
                center
              )}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
            />
          ))}

          {/* Axes */}
          {STATS.map(
            ([, label], index) => {
              const p = point(
                index,
                radius,
                center,
                STATS.length
              );

              return (
                <g key={label}>
                  <line
                    x1={center}
                    y1={center}
                    x2={p.x}
                    y2={p.y}
                    stroke="#e2e8f0"
                    strokeWidth="1"
                  />

                  <text
                    x={p.x}
                    y={p.y}
                    dx={
                      p.x > center
                        ? 8
                        : p.x < center
                        ? -8
                        : 0
                    }
                    dy={
                      p.y > center
                        ? 16
                        : p.y < center
                        ? -8
                        : 4
                    }
                    textAnchor={
                      p.x > center
                        ? "start"
                        : p.x < center
                        ? "end"
                        : "middle"
                    }
                    className="fill-slate-400 text-[10px] font-bold"
                  >
                    {label}
                  </text>
                </g>
              );
            }
          )}

          {/* Player 1 */}
          <polygon
            points={polygon(
              firstValues,
              radius,
              center
            )}
            fill="rgb(244 63 94 / 0.14)"
            stroke="#f43f5e"
            strokeWidth="2.5"
          />

          {/* Player 2 */}
          <polygon
            points={polygon(
              secondValues,
              radius,
              center
            )}
            fill="rgb(16 185 129 / 0.14)"
            stroke="#10b981"
            strokeWidth="2.5"
          />

          {/* Player 1 points */}
          {firstValues.map(
            (value, index) => {
              const p = point(
                index,
                radius * value,
                center,
                STATS.length
              );

              return (
                <circle
                  key={`first-${index}`}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#f43f5e"
                />
              );
            }
          )}

          {/* Player 2 points */}
          {secondValues.map(
            (value, index) => {
              const p = point(
                index,
                radius * value,
                center,
                STATS.length
              );

              return (
                <circle
                  key={`second-${index}`}
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill="#10b981"
                />
              );
            }
          )}
        </svg>

        <div className="mt-2 flex items-center justify-center gap-5">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />

            <span className="max-w-[160px] truncate text-xs font-bold text-slate-600">
              {first.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />

            <span className="max-w-[160px] truncate text-xs font-bold text-slate-600">
              {second.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}