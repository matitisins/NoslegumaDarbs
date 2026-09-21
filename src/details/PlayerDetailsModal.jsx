import React, { useEffect } from "react";
import PlayerDetailsStats from "./PlayerDetailsStats";

function Star({ active = false }) {
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
      .split(/\s+/)
      .map(part => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "PL"
  );
}

export default function PlayerDetailsModal({
  player,
  favorite = false,
  onToggleFavorite,
  onCompare,
  onClose,
}) {
  useEffect(() => {
    if (!player) return;

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        previous;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [player, onClose]);

  if (!player) {
    return null;
  }

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
        {/* HEADER */}
        <div className="bg-slate-950 p-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-black">
                {getInitials(
                  player.name
                )}
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300">
                  Spēlētāja profils
                </p>

                <h2 className="mt-1 truncate text-2xl font-black md:text-3xl">
                  {player.name}
                </h2>

                <p className="mt-1 truncate text-sm text-slate-400">
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
              onClick={onClose}
              aria-label="Aizvērt"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* CONTENT */}
        <div className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <PlayerDetailsStats
              player={player}
            />

            <button
              type="button"
              onClick={() =>
                onToggleFavorite?.(
                  player
                )
              }
              title={
                favorite
                  ? "Noņemt no favorītiem"
                  : "Pievienot favorītiem"
              }
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                favorite
                  ? "border-amber-200 bg-amber-50 text-amber-600"
                  : "border-slate-200 bg-white text-slate-500 hover:border-amber-200 hover:text-amber-500"
              }`}
            >
              <Star active={favorite} />

              {favorite
                ? "Favorītos"
                : "Pievienot favorītiem"}
            </button>
          </div>

          {/* COMPARE */}
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-extrabold text-emerald-800">
                  Vēlies viņu salīdzināt?
                </p>

                <p className="mt-1 text-xs text-emerald-700">
                  Pievieno{" "}
                  {player.name} Flow
                  spēlētāju
                  salīdzinājumam.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  onCompare?.(player)
                }
                className="rounded-xl bg-emerald-500 px-5 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600"
              >
                + Pievienot
                salīdzināšanai
              </button>
            </div>
          </div>

          <p className="mt-5 text-[9px] leading-5 text-slate-400">
            Šī statistika tiek izmantota
            Flow spēlētāju salīdzināšanai.
            Datu avots: football-data.org.
          </p>
        </div>
      </div>
    </div>
  );
}