import React from "react";

export default function PlayerStatBar({
  label,
  value = 0,
  max = 100,
  displayValue,
  color = "emerald",
  description,
}) {
  const numericValue =
    Number(value);

  const numericMax =
    Number(max);

  const safeValue =
    Number.isFinite(
      numericValue
    )
      ? numericValue
      : 0;

  const safeMax =
    Number.isFinite(
      numericMax
    ) && numericMax > 0
      ? numericMax
      : 100;

  const percentage =
    Math.max(
      0,
      Math.min(
        100,
        (safeValue /
          safeMax) *
          100
      )
    );

  const barColors = {
    emerald:
      "bg-emerald-500",
    rose:
      "bg-rose-500",
    blue:
      "bg-blue-500",
    amber:
      "bg-amber-500",
    violet:
      "bg-violet-500",
    slate:
      "bg-slate-500",
  };

  const selectedColor =
    barColors[color] ||
    barColors.emerald;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-bold text-slate-700">
            {label}
          </p>

          {description && (
            <p className="mt-0.5 truncate text-[10px] text-slate-400">
              {description}
            </p>
          )}
        </div>

        <span className="shrink-0 text-xs font-black text-slate-900">
          {displayValue ??
            safeValue}
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${selectedColor}`}
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}