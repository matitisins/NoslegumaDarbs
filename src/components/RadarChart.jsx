import React from "react";

const COLORS = {
  first: {
    stroke: "#f43f5e",
    fill: "#fb7185",
  },

  second: {
    stroke: "#10b981",
    fill: "#10b981",
  },

  grid: "#dbe4ee",
  text: "#475569",
  muted: "#94a3b8",
};

/*
 * When two players have different positions,
 * we should NOT compare completely different
 * statistics on the same axis.
 *
 * Example:
 *
 * GK:
 * Saves
 *
 * STR:
 * Goals
 *
 * Putting "Saves" and "Goals" on the same
 * axis would not make statistical sense.
 *
 * Therefore different-position comparisons
 * use metrics available to both positions.
 */
const COMMON_METRICS = [
  {
    label: "Goals",
    key: "goals",
  },

  {
    label: "Assists",
    key: "assists",
  },

  {
    label: "Shots",
    key: "shots",
  },

  {
    label: "Key passes",
    key: "keyPasses",
  },

  {
    label: "Passing",
    key: "passes",
  },

  {
    label: "Rating",
    key: "rating",
  },

  {
    label: "Duels won %",
    key: "duelsWonPercentage",
  },

  {
    label: "Minutes",
    key: "minutes",
  },
];

const getRadar = player => {
  const stats =
    player?.customStats || {};

  return {
    labels:
      Array.isArray(
        stats.labels
      )
        ? stats.labels
        : [],

    values:
      Array.isArray(
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

const getPercentile = (
  player,
  key
) => {
  const value =
    player?.radarPercentiles?.[
      key
    ];

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number =
    Number(value);

  return Number.isFinite(
    number
  )
    ? Math.max(
        0,
        Math.min(100, number)
      )
    : null;
};

const getCommonRadar = (
  first,
  second
) => {
  const labels = [];
  const firstValues = [];
  const secondValues = [];

  for (const metric of COMMON_METRICS) {
    const firstValue =
      getPercentile(
        first,
        metric.key
      );

    const secondValue =
      getPercentile(
        second,
        metric.key
      );

    if (
      firstValue === null ||
      secondValue === null
    ) {
      continue;
    }

    labels.push(
      metric.label
    );

    firstValues.push(
      firstValue
    );

    secondValues.push(
      secondValue
    );
  }

  return {
    labels,
    firstValues,
    secondValues,
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

  const safeValue =
    Math.max(
      0,
      Math.min(
        100,
        Number(value) || 0
      )
    );

  const r =
    (safeValue / 100) *
    radius;

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
      (
        value,
        index
      ) => {
        const p =
          point(
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
    {
      length: count,
    },
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
      p =>
        `${p.x},${p.y}`
    )
    .join(" ");

const labelPosition = (
  index,
  count,
  cx,
  cy,
  radius
) => {
  const angle =
    -Math.PI / 2 +
    (index * Math.PI * 2) /
      count;

  const labelRadius =
    radius + 55;

  const x =
    cx +
    Math.cos(angle) *
      labelRadius;

  const y =
    cy +
    Math.sin(angle) *
      labelRadius;

  let anchor =
    "middle";

  if (
    x <
    cx - 25
  ) {
    anchor = "end";
  }

  if (
    x >
    cx + 25
  ) {
    anchor = "start";
  }

  return {
    x,
    y,
    anchor,
  };
};

export default function RadarChart({
  players = [],
}) {
  const first =
    players[0] || null;

  const second =
    players[1] || null;

  if (
    !first ||
    !second
  ) {
    return null;
  }

  const samePosition =
    first.category &&
    second.category &&
    first.category ===
      second.category;

  let labels = [];
  let firstStats = [];
  let secondStats = [];

  if (samePosition) {
    /*
     * Same position:
     *
     * Use the position-specific
     * radar created in apiSports.js.
     *
     * These values are already
     * true positional percentiles.
     */
    const firstRadar =
      getRadar(first);

    const secondRadar =
      getRadar(second);

    labels =
      firstRadar.labels;

    firstStats =
      firstRadar.values;

    /*
     * Use the same labels for
     * both players.
     *
     * The second player's values
     * are already calculated in
     * exactly the same position
     * metric order.
     */
    secondStats =
      labels.map(
        (_, index) =>
          Number(
            secondRadar.values[
              index
            ] ?? 0
          )
      );
  } else {
    /*
     * Different positions:
     *
     * Use only metrics that make
     * sense for both players.
     *
     * Each player is still measured
     * against players at THEIR OWN
     * position.
     */
    const common =
      getCommonRadar(
        first,
        second
      );

    labels =
      common.labels;

    firstStats =
      common.firstValues;

    secondStats =
      common.secondValues;
  }

  if (!labels.length) {
    return (
      <div className="flex min-h-[360px] items-center justify-center text-sm font-semibold text-slate-400">
        Nepietiek statistikas radara
        salīdzinājumam.
      </div>
    );
  }

  const count =
    labels.length;

  const cx = 300;
  const cy = 235;
  const radius = 165;

  return (
    <div className="w-full overflow-hidden">
      <svg
        viewBox="0 0 600 540"
        className="mx-auto block h-auto w-full max-w-3xl"
        role="img"
        aria-label="Spēlētāju pozīcijas percentiļu radars"
      >
        {/* ==================================================
            RADAR GRID
        ================================================== */}

        {[25, 50, 75, 100].map(
          level => (
            <polygon
              key={`grid-${level}`}
              points={gridPoints(
                level,
                count,
                cx,
                cy,
                radius
              )}
              fill="none"
              stroke={
                COLORS.grid
              }
              strokeWidth={
                level === 100
                  ? 1.5
                  : 1
              }
            />
          )
        )}

        {/* ==================================================
            AXIS LINES
        ================================================== */}

        {labels.map(
          (
            label,
            index
          ) => {
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
                key={`axis-${label}-${index}`}
                x1={cx}
                y1={cy}
                x2={end.x}
                y2={end.y}
                stroke={
                  COLORS.grid
                }
                strokeWidth="1"
              />
            );
          }
        )}

        {/* ==================================================
            SCALE
        ================================================== */}

        {[25, 50, 75, 100].map(
          level => {
            const y =
              cy -
              (radius *
                level) /
                100;

            return (
              <text
                key={`scale-${level}`}
                x={cx + 10}
                y={y + 4}
                textAnchor="start"
                className="fill-slate-400 text-[10px] font-semibold"
              >
                {level}
              </text>
            );
          }
        )}

        {/* ==================================================
            FIRST PLAYER
        ================================================== */}

        <polygon
          points={polygonPoints(
            firstStats,
            cx,
            cy,
            radius
          )}
          fill={
            COLORS.first.fill
          }
          fillOpacity="0.16"
          stroke={
            COLORS.first.stroke
          }
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* ==================================================
            SECOND PLAYER
        ================================================== */}

        <polygon
          points={polygonPoints(
            secondStats,
            cx,
            cy,
            radius
          )}
          fill={
            COLORS.second.fill
          }
          fillOpacity="0.14"
          stroke={
            COLORS.second.stroke
          }
          strokeWidth="3"
          strokeLinejoin="round"
        />

        {/* ==================================================
            FIRST PLAYER POINTS
        ================================================== */}

        {firstStats.map(
          (
            value,
            index
          ) => {
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
                key={`first-point-${index}`}
                cx={p.x}
                cy={p.y}
                r="5.5"
                fill="white"
                stroke={
                  COLORS.first
                    .stroke
                }
                strokeWidth="3"
              />
            );
          }
        )}

        {/* ==================================================
            SECOND PLAYER POINTS
        ================================================== */}

        {secondStats.map(
          (
            value,
            index
          ) => {
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
                key={`second-point-${index}`}
                cx={p.x}
                cy={p.y}
                r="5.5"
                fill="white"
                stroke={
                  COLORS.second
                    .stroke
                }
                strokeWidth="3"
              />
            );
          }
        )}

        {/* ==================================================
            CENTER
        ================================================== */}

        <circle
          cx={cx}
          cy={cy}
          r="3"
          fill="#cbd5e1"
        />

        {/* ==================================================
            AXIS LABELS
        ================================================== */}

        {labels.map(
          (
            label,
            index
          ) => {
            const position =
              labelPosition(
                index,
                count,
                cx,
                cy,
                radius
              );

            return (
              <text
                key={`label-${label}-${index}`}
                x={
                  position.x
                }
                y={
                  position.y
                }
                textAnchor={
                  position.anchor
                }
                dominantBaseline="middle"
                className="fill-slate-600 text-[12px] font-bold uppercase"
              >
                {label}
              </text>
            );
          }
        )}
      </svg>

      {/* ====================================================
          LEGEND
      ==================================================== */}

      <div className="flex flex-wrap items-center justify-center gap-6 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-rose-500" />

          <span className="text-sm font-bold text-slate-700">
            {first.name}
            {first.team
              ? ` (${first.team})`
              : ""}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />

          <span className="text-sm font-bold text-slate-700">
            {second.name}
            {second.team
              ? ` (${second.team})`
              : ""}
          </span>
        </div>
      </div>

      {/* ====================================================
          DIFFERENT POSITION NOTE
      ==================================================== */}

      {!samePosition && (
        <p className="mx-auto max-w-2xl px-4 text-center text-[11px] font-medium text-slate-400">
          Spēlētājiem ir atšķirīgas
          pozīcijas, tāpēc radars
          izmanto kopīgos rādītājus
          un katra spēlētāja
          percentili savā pozīciju grupā.
        </p>
      )}
    </div>
  );
}