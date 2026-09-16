import React, {
  useMemo,
  useState,
} from "react";

function number(value) {
  const result = Number(value);

  return Number.isFinite(result)
    ? result
    : 0;
}

function getBasePoints(player) {
  if (!player) {
    return 0;
  }

  const points =
    player.points ??
    player.fantasyPoints;

  if (
    points !== null &&
    points !== undefined &&
    Number.isFinite(Number(points))
  ) {
    return number(points);
  }

  const goals =
    number(player.goals);

  const assists =
    number(player.assists);

  const penalties =
    number(player.penalties);

  return (
    goals * 5 +
    assists * 3 +
    penalties * 2
  );
}

function getExpectedPoints(
  player,
  fdr
) {
  if (!player) {
    return 0;
  }

  const base =
    getBasePoints(player);

  /*
   * Lower FDR means an easier fixture.
   * The factor is deliberately modest so that
   * fixture difficulty does not completely
   * override the player's actual statistics.
   */
  const difficulty =
    Math.max(
      0.7,
      Math.min(
        1.3,
        1.15 -
          (number(fdr) - 1) *
            0.1
      )
    );

  return base * difficulty;
}

function PlayerColumn({
  player,
  fdr,
  active,
  onClick,
  color,
}) {
  const expected =
    getExpectedPoints(
      player,
      fdr
    );

  const colorClasses =
    color === "rose"
      ? {
          border:
            active
              ? "border-rose-300"
              : "border-slate-200",
          bg:
            active
              ? "bg-rose-50"
              : "bg-white",
          text: "text-rose-500",
          dot: "bg-rose-500",
        }
      : {
          border:
            active
              ? "border-emerald-300"
              : "border-slate-200",
          bg:
            active
              ? "bg-emerald-50"
              : "bg-white",
          text: "text-emerald-600",
          dot: "bg-emerald-500",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${colorClasses.border} ${colorClasses.bg} hover:shadow-sm`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`h-2.5 w-2.5 shrink-0 rounded-full ${colorClasses.dot}`}
          />

          <div className="min-w-0">
            <p className="truncate text-sm font-black text-slate-900">
              {player?.name ||
                "Spēlētājs"}
            </p>

            <p className="truncate text-[10px] text-slate-400">
              {player?.team ||
                "—"}
            </p>
          </div>
        </div>

        {active && (
          <span
            className={`text-[9px] font-black uppercase tracking-wider ${colorClasses.text}`}
          >
            Kapteinis
          </span>
        )}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl bg-white/70 p-2.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            FDR
          </p>

          <p
            className={`mt-1 text-sm font-black ${colorClasses.text}`}
          >
            {fdr ?? "—"}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-2.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            Bāze
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">
            {getBasePoints(
              player
            ).toFixed(0)}
          </p>
        </div>

        <div className="rounded-xl bg-white/70 p-2.5">
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
            Prognoze
          </p>

          <p className="mt-1 text-sm font-black text-slate-800">
            {expected.toFixed(1)}
          </p>
        </div>
      </div>
    </button>
  );
}

export default function CaptaincySimulator({
  player1,
  player2,
  fdr1 = 3,
  fdr2 = 3,
  loading = false,
}) {
  const [captain, setCaptain] =
    useState("player1");

  const expected1 =
    useMemo(
      () =>
        getExpectedPoints(
          player1,
          fdr1
        ),
      [player1, fdr1]
    );

  const expected2 =
    useMemo(
      () =>
        getExpectedPoints(
          player2,
          fdr2
        ),
      [player2, fdr2]
    );

  if (!player1 || !player2) {
    return null;
  }

  const selectedExpected =
    captain === "player1"
      ? expected1
      : expected2;

  const nonCaptainExpected =
    captain === "player1"
      ? expected2
      : expected1;

  const captainName =
    captain === "player1"
      ? player1.name
      : player2.name;

  const captainPoints =
    selectedExpected * 2;

  const totalPoints =
    captainPoints +
    nonCaptainExpected;

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
      {/* HEADER */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">
            Fantasy analīze
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-900">
            Kapteiņa simulators
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            Izvēlies vienu no spēlētājiem par kapteini.
            Kapteiņa fantasy vērtība tiek reizināta ar 2.
          </p>
        </div>

        {loading && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Atjauno FDR...
          </span>
        )}
      </div>

      {/* PLAYERS */}
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PlayerColumn
          player={player1}
          fdr={fdr1}
          active={
            captain === "player1"
          }
          onClick={() =>
            setCaptain("player1")
          }
          color="rose"
        />

        <PlayerColumn
          player={player2}
          fdr={fdr2}
          active={
            captain === "player2"
          }
          onClick={() =>
            setCaptain("player2")
          }
          color="emerald"
        />
      </div>

      {/* RESULT */}
      <div className="mt-5 rounded-2xl bg-slate-950 p-5 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Izvēlētais kapteinis
            </p>

            <p className="mt-1 text-lg font-black">
              {captainName}
            </p>
          </div>

          <div className="text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Kapteiņa vērtība
            </p>

            <p className="mt-1 text-2xl font-black text-emerald-400">
              {captainPoints.toFixed(1)}
            </p>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10 pt-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Divu spēlētāju kopējā simulētā vērtība
            </span>

            <span className="text-sm font-black text-white">
              {totalPoints.toFixed(1)}
            </span>
          </div>
        </div>
      </div>

      {/* DISCLAIMER */}
      <p className="mt-4 text-[9px] leading-5 text-slate-400">
        Šī ir Flow aprēķina simulācija, nevis garantēta
        spēles vai fantasy rezultāta prognoze.
      </p>
    </section>
  );
}