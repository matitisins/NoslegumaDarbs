/*
 * Attēlo sākumlapas galveno statistikas kopsavilkumu.
 * Parāda pieejamo spēlētāju skaitu, platformā pieejamo līgu skaitu
 * un pašlaik izvēlēto sezonu un līgu.
 */

import React from "react";

function StatIcon({ type }) {
  if (type === "players") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path d="M3.5 20c.5-3.4 2.2-5 5.5-5s5 1.6 5.5 5" />

        <path d="M16 5.5a3 3 0 0 1 0 5.8" />

        <path d="M17 15c2.2.4 3.5 2 4 5" />
      </svg>
    );
  }

  if (type === "leagues") {
    return (
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="M4 5h16v14H4z" />
        <path d="M8 9h8" />
        <path d="M8 13h5" />
        <path d="M8 17h8" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
      />

      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function Stat({
  icon,
  title,
  value,
  text,
  color,
}) {
  const background = {
    emerald:
      "bg-emerald-50 text-emerald-600",
    blue:
      "bg-blue-50 text-blue-600",
    violet:
      "bg-violet-50 text-violet-600",
  }[color] || "bg-slate-50 text-slate-600";

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${background}`}
        >
          {icon}
        </div>

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {title}
        </span>
      </div>

      <p className="mt-4 text-2xl font-black text-slate-900">
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {text}
      </p>
    </div>
  );
}

export default function HomeStats({
  totalPlayers = 0,
  leagueCount = 5,
  selectedLeague = "PL",
  selectedSeason = "2026/2027",
}) {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Stat
        icon={<StatIcon type="players" />}
        title="Spēlētāji"
        value={totalPlayers}
        text="Pieejami izvēlētajā līgā"
        color="emerald"
      />

      <Stat
        icon={<StatIcon type="leagues" />}
        title="Līgas"
        value={leagueCount}
        text="Pieejamas Flow platformā"
        color="blue"
      />

      <Stat
        icon={<StatIcon type="time" />}
        title="Sezona"
        value={selectedSeason}
        text={`Aktīvā līga: ${selectedLeague}`}
        color="violet"
      />
    </section>
  );
}