// src/components/PlayerStatBar.jsx

import React from "react";

export default function PlayerStatBar({
  label,
  value,
  colorClass = "bg-emerald-500",
}) {
  const numericValue =
    parseFloat(String(value).replace("%", "")) || 0;

  const percentage = Math.min(
    Math.max(numericValue, 0),
    100
  );

  const formattedLabel = label
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (char) => char.toUpperCase());

  return (
    <div>
      <div className="flex justify-between text-slate-600 mb-1 text-xs">
        <span>{formattedLabel}</span>
        <span className="font-bold text-slate-900">
          {value}
        </span>
      </div>

      <div className="w-full bg-slate-100 h-1.5 rounded overflow-hidden">
        <div
          className={`${colorClass} h-full transition-all`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}