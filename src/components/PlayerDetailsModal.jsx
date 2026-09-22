import React from "react";

function Star({
  active = false,
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={
        active
          ? "currentColor"
          : "none"
      }
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function getInitials(name) {
  return (
    String(name || "")
      .split(" ")
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "PL"
  );
}

function displayValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return value;
}

function StatBox({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
      <p className="text-2xl font-black text-slate-900">
        {displayValue(value)}
      </p>

      <p className="mt-1 text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>
    </div>
  );
}

function AdvancedStat({
  label,
  value,
}) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-slate-800">
        {displayValue(value)}
      </p>
    </div>
  );
}

const percent = value => {
  if (
    value === null ||
    value === undefined ||
    value === "" ||
    !Number.isFinite(
      Number(value)
    )
  ) {
    return null;
  }

  return `${value}%`;
};

export default function PlayerDetailsModal({
  player,
  favorite = false,
  onToggleFavorite,
  onCompare,
  onClose,
}) {
  if (!player) {
    return null;
  }

  const advanced =
    player.advancedStats || {};

  const attacker =
    player.category ===
      "MIDFIELDERS" ||
    player.category ===
      "STRIKERS";

  const availableStats = [
    [
      "Spēles",
      player.appearances,
    ],

    [
      "Minūtes",
      player.minutes,
    ],

    [
      "Vārti",
      player.goals,
    ],

    [
      "Assist",
      player.assists,
    ],

    [
      "Flow",
      player.points,
    ],
  ];

  /*
   * Position-specific advanced statistics.
   *
   * Only values available from API-Football
   * are displayed.
   */
  const advancedRows =
    player.category ===
    "GOALKEEPERS"
      ? [
          [
            "Saves",
            advanced.saves,
          ],

          [
            "Save %",
            percent(
              advanced.savePercentage
            ),
          ],

          [
            "Goals conceded",
            advanced.goalsConceded,
          ],

          [
            "Passes",
            advanced.passes,
          ],

          [
            "Pass accuracy",
            percent(
              advanced.passAccuracy
            ),
          ],

          [
            "Rating",
            advanced.rating,
          ],

          [
            "Dzeltenās",
            advanced.yellowCards,
          ],

          [
            "Sarkanās",
            advanced.redCards,
          ],
        ]
      : player.category ===
        "DEFENDERS"
      ? [
          [
            "Tackles",
            advanced.tackles,
          ],

          [
            "Blocks",
            advanced.blocks,
          ],

          [
            "Interceptions",
            advanced.interceptions,
          ],

          [
            "Duels won %",
            percent(
              advanced.duelsWonPercentage
            ),
          ],

          [
            "Passes",
            advanced.passes,
          ],

          [
            "Pass accuracy",
            percent(
              advanced.passAccuracy
            ),
          ],

          [
            "Successful dribbles",
            advanced.successfulDribbles,
          ],

          [
            "Rating",
            advanced.rating,
          ],

          [
            "Dzeltenās",
            advanced.yellowCards,
          ],

          [
            "Sarkanās",
            advanced.redCards,
          ],
        ]
      : player.category ===
        "MIDFIELDERS"
      ? [
          [
            "Pen. vārti",
            player.penalties,
          ],

          [
            "Shots",
            advanced.shots,
          ],

          [
            "Shots on target",
            advanced.shotsOnTarget,
          ],

          [
            "Key passes",
            advanced.keyPasses,
          ],

          [
            "Passes",
            advanced.passes,
          ],

          [
            "Pass accuracy",
            percent(
              advanced.passAccuracy
            ),
          ],

          [
            "Successful dribbles",
            advanced.successfulDribbles,
          ],

          [
            "Duels won %",
            percent(
              advanced.duelsWonPercentage
            ),
          ],

          [
            "Tackles",
            advanced.tackles,
          ],

          [
            "Interceptions",
            advanced.interceptions,
          ],

          [
            "Fouls drawn",
            advanced.foulsDrawn,
          ],

          [
            "Dzeltenās",
            advanced.yellowCards,
          ],

          [
            "Sarkanās",
            advanced.redCards,
          ],
        ]
      : [
          [
            "Pen. vārti",
            player.penalties,
          ],

          [
            "Shots",
            advanced.shots,
          ],

          [
            "Shots on target",
            advanced.shotsOnTarget,
          ],

          [
            "Key passes",
            advanced.keyPasses,
          ],

          [
            "Passes",
            advanced.passes,
          ],

          [
            "Pass accuracy",
            percent(
              advanced.passAccuracy
            ),
          ],

          [
            "Successful dribbles",
            advanced.successfulDribbles,
          ],

          [
            "Duels won %",
            percent(
              advanced.duelsWonPercentage
            ),
          ],

          [
            "Fouls drawn",
            advanced.foulsDrawn,
          ],

          [
            "Dzeltenās",
            advanced.yellowCards,
          ],

          [
            "Sarkanās",
            advanced.redCards,
          ],
        ];

  const visibleAdvancedRows =
    advancedRows.filter(
      ([, value]) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    );

  const handleToggleFavorite =
    () => {
      onToggleFavorite?.(
        player
      );
    };

  const handleCompare = () => {
    onCompare?.(player);
    onClose?.();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              {player.photo ? (
                <img
                  src={player.photo}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black">
                  {getInitials(
                    player.name
                  )}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Spēlētāja profils
                </p>

                <h2 className="mt-1 truncate text-2xl font-black md:text-3xl">
                  {player.name}
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  {player.team ||
                    "Nezināms klubs"}

                  {" · "}

                  {player.positionLabel ||
                    player.position ||
                    "Nezināma pozīcija"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                onClose
              }
              aria-label="Aizvērt"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">
                Individuālā statistika
              </h3>

              <p className="mt-1 text-xs text-slate-400">
                Pieejamie dati no
                API-Football
                pašreizējās
                sezonas.
              </p>
            </div>

            <button
              type="button"
              onClick={
                handleToggleFavorite
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                favorite
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-500"
              }`}
            >
              <Star
                active={
                  favorite
                }
              />

              {favorite
                ? "Favorītos"
                : "Pievienot favorītiem"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {availableStats.map(
              ([
                label,
                statValue,
              ]) => (
                <StatBox
                  key={label}
                  label={label}
                  value={
                    statValue
                  }
                />
              )
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="mb-3">
              <h3 className="text-sm font-extrabold text-slate-900">
                Advanced statistics
              </h3>

              <p className="mt-1 text-[10px] text-slate-400">
                Tiek rādīti tikai
                tie rādītāji,
                kurus
                API-Football
                atgriež
                konkrētajam
                spēlētājam.
              </p>
            </div>

            {visibleAdvancedRows.length >
            0 ? (
              <div className="grid grid-cols-2 gap-3">
                {visibleAdvancedRows.map(
                  ([
                    label,
                    value,
                  ]) => (
                    <AdvancedStat
                      key={
                        label
                      }
                      label={
                        label
                      }
                      value={
                        value
                      }
                    />
                  )
                )}
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 p-6 text-center">
                <p className="text-xs font-semibold text-slate-400">
                  Šim spēlētājam
                  pašlaik nav
                  pieejamu
                  advanced
                  statistikas
                  datu.
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-2 gap-3">
              <AdvancedStat
                label="Sezona"
                value={
                  player.season
                }
              />

              <AdvancedStat
                label="Pozīcija"
                value={
                  player.positionLabel
                }
              />

              {attacker && (
                <AdvancedStat
                  label="Pen. vārti"
                  value={
                    player.penalties
                  }
                />
              )}

              <AdvancedStat
                label="Spēlētāja ID"
                value={
                  player.id
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-xl bg-slate-50 p-3">
            <p className="text-[10px] leading-5 text-slate-400">
              Flow punkti ir
              Flow lietotnes
              aprēķināts
              rādītājs,
              nevis oficiāli
              fantasy punkti.
              Statistika tiek
              rādīta tikai tad,
              ja API-Football
              konkrēto vērtību
              nodrošina.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={
                onClose
              }
              className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              Aizvērt
            </button>

            {onCompare && (
              <button
                type="button"
                onClick={
                  handleCompare
                }
                className="rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600"
              >
                Salīdzināt
                spēlētāju
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}