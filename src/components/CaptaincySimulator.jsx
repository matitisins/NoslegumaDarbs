/*
 * Nodrošina kapteiņa simulatoru diviem izvēlētajiem spēlētājiem,
 * aprēķinot simulēto fantasy vērtību, ņemot vērā spēlētāja Flow
 * punktus un FDR, kā arī piemērojot kapteiņa dubulto vērtību.
 */

import React, { useMemo, useState } from "react";

function number(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function PlayerColumn({
  player,
  fdr,
  active,
  onClick,
  color,
}) {
  if (!player) return null;

  const styles =
    color === "rose"
      ? {
          border: active
            ? "border-rose-300"
            : "border-slate-200",
          bg: active
            ? "bg-rose-50"
            : "bg-white",
          text: "text-rose-500",
          ring: "ring-rose-200",
        }
      : {
          border: active
            ? "border-emerald-300"
            : "border-slate-200",
          bg: active
            ? "bg-emerald-50"
            : "bg-white",
          text: "text-emerald-600",
          ring: "ring-emerald-200",
        };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border p-4 text-left transition ${styles.border} ${styles.bg} ${
        active
          ? `ring-2 ${styles.ring}`
          : "hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`truncate text-sm font-black ${styles.text}`}
          >
            {player.name}
          </p>

          <p className="mt-1 truncate text-xs text-slate-400">
            {player.team || "Nezināms klubs"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-black uppercase tracking-wider ${
            active
              ? `${styles.text} bg-white`
              : "bg-slate-100 text-slate-400"
          }`}
        >
          {active ? "Kapteinis" : "Izvēlēties"}
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Fantasy
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {number(player.points)}
          </p>
        </div>

        <div>
          <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
            FDR
          </p>

          <p className="mt-1 text-lg font-black text-slate-900">
            {number(fdr) || 3}
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

  const expected1 = useMemo(() => {
    if (!player1) return 0;

    const points = number(
      player1.points
    );

    const fdr = number(fdr1) || 3;

    return (
      points *
      (1 + (6 - fdr) * 0.05)
    );
  }, [player1, fdr1]);

  const expected2 = useMemo(() => {
    if (!player2) return 0;

    const points = number(
      player2.points
    );

    const fdr = number(fdr2) || 3;

    return (
      points *
      (1 + (6 - fdr) * 0.05)
    );
  }, [player2, fdr2]);

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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-500">
            Fantasy analīze
          </p>

          <h2 className="mt-1 text-lg font-black text-slate-900">
            Kapteiņa simulators
          </h2>

          <p className="mt-1 max-w-xl text-xs leading-5 text-slate-500">
            Izvēlies vienu no spēlētājiem
            par kapteini. Kapteiņa fantasy
            vērtība tiek reizināta ar 2.
          </p>
        </div>

        {loading && (
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
            Atjauno FDR...
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <PlayerColumn
          player={player1}
          fdr={fdr1}
          active={captain === "player1"}
          onClick={() =>
            setCaptain("player1")
          }
          color="rose"
        />

        <PlayerColumn
          player={player2}
          fdr={fdr2}
          active={captain === "player2"}
          onClick={() =>
            setCaptain("player2")
          }
          color="emerald"
        />
      </div>

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

      <p className="mt-4 text-[9px] leading-5 text-slate-400">
        Šī ir Flow aprēķina simulācija,
        nevis garantēta spēles vai fantasy
        rezultāta prognoze.
      </p>
    </section>
  );
}