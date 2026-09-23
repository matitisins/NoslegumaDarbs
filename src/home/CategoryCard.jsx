/*
 * Attēlo konkrētas spēlētāju kategorijas kartīti sākumlapā.
 * Parāda kategorijas nosaukumu, aprakstu, spēlētāju skaitu un nodrošina
 * iespēju atvērt attiecīgās kategorijas spēlētāju salīdzināšanu.
 */

import React from "react";
import { CATEGORIES } from "../../config/flow";

const ACCENTS = {
  rose: {
    bar: "bg-rose-400",
    icon: "bg-rose-50 text-rose-500",
    arrow: "bg-rose-50 text-rose-500",
  },
  emerald: {
    bar: "bg-emerald-500",
    icon: "bg-emerald-50 text-emerald-600",
    arrow: "bg-emerald-50 text-emerald-600",
  },
  blue: {
    bar: "bg-blue-500",
    icon: "bg-blue-50 text-blue-600",
    arrow: "bg-blue-50 text-blue-600",
  },
  amber: {
    bar: "bg-amber-400",
    icon: "bg-amber-50 text-amber-600",
    arrow: "bg-amber-50 text-amber-600",
  },
};

export default function CategoryCard({
  category,
  count = 0,
  onClick,
}) {
  const info = CATEGORIES[category];

  if (!info) return null;

  const colors =
    ACCENTS[info.color] ||
    ACCENTS.emerald;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${colors.bar}`}
      />

      <div className="flex items-start justify-between gap-4">
        <div
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl ${colors.icon}`}
        >
          {info.icon || "◆"}
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          ● {count} spēlētāji
        </span>
      </div>

      <div className="mt-5">
        <h3 className="text-xl font-extrabold tracking-tight text-slate-900">
          {info.name ||
            info.title ||
            category}
        </h3>

        <p className="mt-2 max-w-md text-sm leading-5 text-slate-500">
          {info.description ||
            info.desc ||
            ""}
        </p>
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {info.shortDescription ||
            info.tag ||
            ""}
        </span>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full transition group-hover:translate-x-0.5 ${colors.arrow}`}
        >
          →
        </span>
      </div>
    </button>
  );
}