import React from "react";

// API-Football official competition logo assets. The IDs match API-Football league IDs.
export const LEAGUE_LOGOS = {
  PL: "https://media.api-sports.io/football/leagues/39.png",
  PD: "https://media.api-sports.io/football/leagues/140.png",
  SA: "https://media.api-sports.io/football/leagues/135.png",
  BL1: "https://media.api-sports.io/football/leagues/78.png",
  FL1: "https://media.api-sports.io/football/leagues/61.png",
};

export default function LeagueLogo({ competition, size = 36, className = "", alt }) {
  const src = LEAGUE_LOGOS[competition] || "";
  if (!src) return null;
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-xl border border-emerald-400/15 bg-white/[0.04] p-1 ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={alt || `${competition} league logo`}
        loading="lazy"
        className="h-full w-full object-contain"
        onError={(event) => { event.currentTarget.style.opacity = "0.2"; }}
      />
    </span>
  );
}
