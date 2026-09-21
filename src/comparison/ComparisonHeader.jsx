import React from "react";
import {
  CATEGORIES,
  CATEGORY_NAMES,
} from "../../config/flow";

export default function ComparisonHeader({
  selectedCategory,
  player1,
  player2,
  resetPlayers,
  takeScreenshot,
}) {
  const info =
    CATEGORIES[selectedCategory];

  const categoryName =
    CATEGORY_NAMES[selectedCategory] ||
    info?.name ||
    selectedCategory ||
    "Spēlētāji";

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={resetPlayers}
          className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 transition hover:text-emerald-600"
        >
          <span className="transition group-hover:-translate-x-0.5">
            ←
          </span>

          Atpakaļ
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            {categoryName}
          </span>

          {player1 && player2 && (
            <button
              type="button"
              onClick={takeScreenshot}
              className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              📷 Saglabāt attēlu
            </button>
          )}
        </div>
      </div>

      <div className="mt-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
          Spēlētāju salīdzinājums
        </p>

        <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-900 md:text-4xl">
          {player1?.name || "Spēlētājs"}
          <span className="mx-2 text-slate-300">
            vs
          </span>
          {player2?.name || "Spēlētājs"}
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Salīdzini statistiku, formu,
          pozīcijas procentiles un fantasy
          vērtību.
        </p>
      </div>
    </div>
  );
}