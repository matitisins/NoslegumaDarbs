/*
 * Šis ir Flow lietotnes galvenais komponents, kas pārvalda līgu, sezonu,
 * spēlētāju kategoriju un divu spēlētāju izvēli. Nodrošina spēlētāju datu
 * ielādi no API, meklēšanu, favorītus, spēlētāju profilus, FDR, salīdzināšanu,
 * Captaincy Simulator, konta iestatījumus, ceļvedi un salīdzinājuma
 * ekrānuzņēmuma saglabāšanu.
 */

import React, {
  useEffect,
  useRef,
  useState,
} from "react";
import html2canvas from "html2canvas";

import {
  COMPETITION_IDS,
  fetchApiSportsPlayers,
  getTeamFdr,
  seasonToApiSeason,
  clearFootballDataCache,
  fetchPlayerProfile,
} from "./services/apiSports";

import RadarChart from "./components/RadarChart";
import Logo from "./components/Logo";
import ComparisonSummary from "./components/ComparisonSummary";
import PlayerCard from "./components/PlayerCard";
import CaptaincySimulator from "./components/CaptaincySimulator";
import AccountModal from "./components/AccountModal";
import GuideModal from "./components/GuideModal";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

const LEAGUES = [
  ["PL", "Premier League"],
  ["PD", "La Liga"],
  ["SA", "Serie A"],
  ["BL1", "Bundesliga"],
  ["FL1", "Ligue 1"],
];

const CATEGORIES = {
  STRIKERS: {
    name: "Uzbrucēji",
    icon: "⚡",
    color: "rose",
    desc: "Finisēšana, vārtu iesaiste un uzbrukuma produktivitāte.",
    tag: "Uzbrukuma produktivitāte",
  },

  MIDFIELDERS: {
    name: "Pussargi",
    icon: "◈",
    color: "emerald",
    desc: "Radošums, progresija un iesaiste vārtu guvumos.",
    tag: "Radošums un kontrole",
  },

  DEFENDERS: {
    name: "Aizsargi",
    icon: "◆",
    color: "blue",
    desc: "Uzticamība, vārtu draudi un iespēju veidošana.",
    tag: "Aizsardzība un stabilitāte",
  },

  GOALKEEPERS: {
    name: "Vārtsargi",
    icon: "⬢",
    color: "amber",
    desc: "Stabilitāte, pieredze un ietekme uz rezultātu.",
    tag: "Stabilitāte un pieredze",
  },
};

const CATEGORY_ORDER = [
  "STRIKERS",
  "MIDFIELDERS",
  "DEFENDERS",
  "GOALKEEPERS",
];

const normalize = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

function Star({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={active ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function SearchBox({
  players,
  selected,
  onSelectPlayer1,
  onSelectPlayer2,
  onOpen,
  isFavorite,
  onToggleFavorite,
  color,
  label,
  target,
}) {
  const [value, setValue] =
    useState("");

  const results = value
    ? players.filter(player => {
        const q = normalize(value);

        return (
          normalize(player.name).includes(q) ||
          normalize(player.team).includes(q)
        );
      })
    : [];

  const rose = color === "rose";

  const handleSelect = player => {
    if (!player) return;

    if (target === "player1") {
      onSelectPlayer1(player);
    } else {
      onSelectPlayer2(player);
    }

    setValue("");
  };

  return (
    <div
      className={`mb-3 rounded-xl border ${
        rose
          ? "border-rose-200"
          : "border-emerald-200"
      } bg-white p-3 shadow-sm`}
    >
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        🔎 {label}
      </label>

      <div className="relative">
        <input
          value={value}
          onChange={e =>
            setValue(e.target.value)
          }
          placeholder="Meklē pēc vārda vai kluba..."
          className={`w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-9 text-sm outline-none transition focus:bg-white focus:ring-2 ${
            rose
              ? "focus:border-rose-400 focus:ring-rose-100"
              : "focus:border-emerald-400 focus:ring-emerald-100"
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() =>
              setValue("")
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>

      {value && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          {results.length ? (
            results.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-2 border-b border-slate-100 px-2 py-2 last:border-0 ${
                  rose
                    ? "hover:bg-rose-50"
                    : "hover:bg-emerald-50"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    handleSelect(player)
                  }
                  className="flex min-w-0 flex-1 items-center justify-between px-1 py-1.5 text-left"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-800">
                      {player.name}
                    </span>

                    <span className="block truncate text-xs text-slate-400">
                      {player.team}
                    </span>
                  </span>

                  <span className="ml-3 shrink-0 text-[10px] font-bold uppercase text-slate-400">
                    Izvēlēties
                  </span>
                </button>

                <button
                  type="button"
                  title={
                    isFavorite(player)
                      ? "Noņemt no favorītiem"
                      : "Pievienot favorītiem"
                  }
                  onClick={() =>
                    onToggleFavorite(player)
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    isFavorite(player)
                      ? "bg-amber-50 text-amber-500"
                      : "bg-slate-50 text-slate-300 hover:bg-amber-50 hover:text-amber-500"
                  }`}
                >
                  <Star
                    active={isFavorite(player)}
                  />
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSelect(player)
                  }
                  className={`rounded-lg px-2.5 py-2 text-[10px] font-bold text-white ${
                    rose
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-emerald-500 hover:bg-emerald-600"
                  }`}
                >
                  Izvēlēties
                </button>
              </div>
            ))
          ) : (
            <p className="px-3 py-3 text-sm text-slate-400">
              Nav atrasts neviens spēlētājs.
            </p>
          )}
        </div>
      )}

      <p className="mt-2 text-xs text-slate-400">
        {value
          ? `Atrasti: ${results.length} spēlētāji`
          : selected
          ? `Izvēlēts: ${selected.name}`
          : "Ieraksti spēlētāja vārdu vai klubu"}
      </p>
    </div>
  );
}

function Stat({
  icon,
  title,
  value,
  text,
  color,
}) {
  const bg = {
    emerald:
      "bg-emerald-50 text-emerald-600",
    blue:
      "bg-blue-50 text-blue-600",
    violet:
      "bg-violet-50 text-violet-600",
  }[color];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${bg}`}
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

function CategoryCard({
  category,
  count,
  onClick,
}) {
  const info = CATEGORIES[category];

  const accent = {
    rose: "bg-rose-400",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
  }[info.color];

  const iconBg = {
    rose:
      "bg-rose-50 text-rose-500",
    emerald:
      "bg-emerald-50 text-emerald-600",
    blue:
      "bg-blue-50 text-blue-600",
    amber:
      "bg-amber-50 text-amber-600",
  }[info.color];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-lg"
    >
      <div
        className={`absolute left-0 top-0 h-full w-1 ${accent}`}
      />

      <div className="flex items-start justify-between">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl text-2xl ${iconBg}`}
        >
          {info.icon}
        </div>

        <span className="rounded-full bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
          ● {count} spēlētāji
        </span>
      </div>

      <h3 className="mt-5 text-xl font-extrabold text-slate-900">
        {info.name}
      </h3>

      <p className="mt-2 text-sm leading-5 text-slate-500">
        {info.desc}
      </p>

      <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {info.tag}
        </span>

        <span
          className={`flex h-8 w-8 items-center justify-center rounded-full ${iconBg} transition group-hover:translate-x-1`}
        >
          →
        </span>
      </div>
    </button>
  );
}

function displayProfileValue(
  value,
  suffix = ""
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "—";
  }

  return `${value}${suffix}`;
}

function formatBirthDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString(
    "lv-LV",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  );
}

function PlayerProfileStat({
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-xl font-black text-slate-900">
        {displayProfileValue(value)}
      </p>
    </div>
  );
}

function PlayerDetailsModal({
  player,
  favorite,
  profileData,
  profileLoading,
  profileError,
  onToggleFavorite,
  onCompare,
  onClose,
}) {
  if (!player) return null;

  const profile =
    profileData?.profile || {};

  const trophies = Array.isArray(
    profileData?.trophies
  )
    ? profileData.trophies
    : [];

  const advanced =
    player.advancedStats || {};

  const seasonStats = [
    ["Spēles", player.appearances],
    ["Minūtes", player.minutes],
    ["Vārti", player.goals],
    ["Assist", player.assists],
    ["Passes", advanced.passes],
    ["Key passes", advanced.keyPasses],
    ["Shots", advanced.shots],
    [
      "Shots on target",
      advanced.shotsOnTarget,
    ],
    ["Rating", advanced.rating],
    ["Dzeltenās", advanced.yellowCards],
    ["Sarkanās", advanced.redCards],
    ["Bench", advanced.bench],
  ];

  const positionRows =
    player.category ===
    "GOALKEEPERS"
      ? [
          ["Saves", advanced.saves],
          [
            "Save %",
            displayProfileValue(
              advanced.savePercentage,
              "%"
            ),
          ],
          [
            "Goals conceded",
            advanced.goalsConceded,
          ],
          [
            "Pass accuracy",
            displayProfileValue(
              advanced.passAccuracy,
              "%"
            ),
          ],
          ["Rating", advanced.rating],
        ]
      : player.category ===
        "DEFENDERS"
      ? [
          ["Tackles", advanced.tackles],
          ["Blocks", advanced.blocks],
          [
            "Interceptions",
            advanced.interceptions,
          ],
          [
            "Duels won %",
            displayProfileValue(
              advanced.duelsWonPercentage,
              "%"
            ),
          ],
          [
            "Pass accuracy",
            displayProfileValue(
              advanced.passAccuracy,
              "%"
            ),
          ],
        ]
      : player.category ===
        "MIDFIELDERS"
      ? [
          [
            "Key passes",
            advanced.keyPasses,
          ],
          ["Passes", advanced.passes],
          [
            "Pass accuracy",
            displayProfileValue(
              advanced.passAccuracy,
              "%"
            ),
          ],
          [
            "Successful dribbles",
            advanced.successfulDribbles,
          ],
          [
            "Duels won %",
            displayProfileValue(
              advanced.duelsWonPercentage,
              "%"
            ),
          ],
        ]
      : [
          ["Shots", advanced.shots],
          [
            "Shots on target",
            advanced.shotsOnTarget,
          ],
          [
            "Key passes",
            advanced.keyPasses,
          ],
          [
            "Successful dribbles",
            advanced.successfulDribbles,
          ],
          [
            "Duels won %",
            displayProfileValue(
              advanced.duelsWonPercentage,
              "%"
            ),
          ],
        ];

  const visibleSeasonStats =
    seasonStats.filter(
      ([, value]) =>
        value !== null &&
        value !== undefined
    );

  const visiblePositionRows =
    positionRows.filter(
      ([, value]) =>
        value !== null &&
        value !== undefined
    );

  const photo =
    profile.photo || player.photo;

  const teamName =
    profile.team?.name ||
    player.team ||
    "Nezināms klubs";

  const teamLogo =
    profile.team?.logo ||
    player.teamLogo;

  const position =
    profile.position ||
    player.positionLabel ||
    player.position ||
    "Nezināma pozīcija";

  const nationality =
    profile.nationality ||
    player.nationality;

  const age =
    profile.age ?? player.age;

  const height =
    profile.height || player.height;

  const weight =
    profile.weight || player.weight;

  const birthDate =
    profile.birth?.date ||
    player.birthDate;

  const shirtNumber =
    profile.number ?? player.number;

  const handleCompare = () => {
    onCompare?.(player);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-5"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-slate-50 shadow-[0_30px_90px_rgba(15,23,42,0.35)]">
        <div className="relative shrink-0 overflow-hidden bg-slate-950 px-5 pb-5 pt-5 text-white sm:px-7 sm:pb-7 sm:pt-6">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="relative shrink-0">
                {photo ? (
                  <img
                    src={photo}
                    alt=""
                    className="h-20 w-20 rounded-[22px] border border-white/15 bg-white/10 object-cover shadow-xl sm:h-24 sm:w-24"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-[22px] bg-emerald-500 text-2xl font-black shadow-xl sm:h-24 sm:w-24">
                    {player.name
                      ?.split(" ")
                      .map(
                        part =>
                          part[0]
                      )
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}

                <span className="absolute -bottom-2 -right-2 flex h-8 min-w-8 items-center justify-center rounded-full border-4 border-slate-950 bg-emerald-500 px-1.5 text-[10px] font-black text-white shadow-lg">
                  {shirtNumber
                    ? `#${shirtNumber}`
                    : "FLOW"}
                </span>
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-300">
                  Player profile
                </p>

                <h2 className="mt-1 truncate text-2xl font-black tracking-tight sm:text-3xl">
                  {player.name}
                </h2>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-slate-300 sm:text-sm">
                  {teamLogo && (
                    <img
                      src={teamLogo}
                      alt=""
                      className="h-5 w-5 rounded-full bg-white/10 object-contain"
                    />
                  )}

                  <span>
                    {teamName}
                  </span>

                  <span className="text-slate-600">
                    •
                  </span>

                  <span>
                    {position}
                  </span>

                  {nationality && (
                    <>
                      <span className="text-slate-600">
                        •
                      </span>

                      <span>
                        {nationality}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Aizvērt"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 px-4 py-5 sm:px-7 sm:py-6">
          {profileLoading && (
            <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 shadow-sm">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600" />

              <p className="text-xs font-bold text-emerald-700">
                Ielādē spēlētāja profilu...
              </p>
            </div>
          )}

          {profileError && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-bold text-amber-700">
                Papildu profila dati nebija pieejami.
              </p>

              <p className="mt-1 text-[11px] text-amber-600">
                Pamata sezonas statistika joprojām tiek rādīta.
              </p>
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[1fr_280px]">
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                    Player overview
                  </p>

                  <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                    Spēlētāja informācija
                  </h3>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onToggleFavorite?.(
                      player
                    )
                  }
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                    favorite
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
                  }`}
                >
                  <Star
                    active={favorite}
                  />

                  <span className="hidden sm:inline">
                    {favorite
                      ? "Favorītos"
                      : "Pievienot favorītiem"}
                  </span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PlayerProfileStat
                  label="Vecums"
                  value={
                    age
                      ? `${age} gadi`
                      : null
                  }
                />

                <PlayerProfileStat
                  label="Augums"
                  value={height}
                />

                <PlayerProfileStat
                  label="Svars"
                  value={weight}
                />

                <PlayerProfileStat
                  label="Valstspiederība"
                  value={
                    nationality
                  }
                />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PlayerProfileStat
                  label="Dzimšanas datums"
                  value={formatBirthDate(
                    birthDate
                  )}
                />

                <PlayerProfileStat
                  label="Pozīcija"
                  value={position}
                />
              </div>
            </section>

            <section className="relative overflow-hidden rounded-[24px] bg-slate-950 p-5 text-white shadow-sm">
              <div className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-emerald-500/20 blur-2xl" />

              <div className="relative">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">
                      Flow rating
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-300">
                      {player.season ||
                        "Sezona"}
                    </p>
                  </div>

                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    Analytics
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {player.points}
                  </span>

                  <span className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    pts
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          6,
                          Number(
                            player.points
                          ) || 0
                        )
                      )}%`,
                    }}
                  />
                </div>

                <p className="mt-3 text-[10px] leading-4 text-slate-500">
                  Flow punkti ir lietotnes aprēķināts rādītājs, nevis oficiāli fantasy punkti.
                </p>
              </div>
            </section>
          </div>

          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  Season performance
                </p>

                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Sezonas statistika
                </h3>

                <p className="mt-1 text-xs text-slate-400">
                  Dati no API-Football par izvēlēto sezonu.
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {visibleSeasonStats.map(
                ([label, value]) => (
                  <PlayerProfileStat
                    key={label}
                    label={label}
                    value={value}
                  />
                )
              )}
            </div>
          </section>

          {visiblePositionRows.length >
            0 && (
            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                  Position metrics
                </p>

                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Pozīcijas statistika
                </h3>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                {visiblePositionRows.map(
                  ([label, value]) => (
                    <PlayerProfileStat
                      key={label}
                      label={label}
                      value={value}
                    />
                  )
                )}
              </div>
            </section>
          )}

          {trophies.length > 0 && (
            <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-500">
                  Achievements
                </p>

                <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                  Trofejas
                </h3>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trophies
                  .slice(0, 12)
                  .map(
                    (
                      trophy,
                      index
                    ) => (
                      <div
                        key={`${trophy.league || "trophy"}-${trophy.season || index}`}
                        className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-base">
                            🏆
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-extrabold text-slate-900">
                              {trophy.league ||
                                "Nezināma sacensība"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {trophy.season ||
                                "—"}
                            </p>

                            <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                              {trophy.place ||
                                trophy.result ||
                                "—"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
              </div>
            </section>
          )}
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-7 sm:py-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
            >
              Aizvērt
            </button>

            <button
              type="button"
              onClick={handleCompare}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-xs font-black text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600 hover:shadow-[0_10px_28px_rgba(16,185,129,0.3)] sm:min-w-[220px] sm:flex-none"
            >
              <span className="text-base leading-none">
                ＋
              </span>

              Pievienot salīdzināšanai
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FavoriteCard({
  player,
  onOpen,
  onToggleFavorite,
}) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-emerald-200 hover:shadow-md">
      <button
        type="button"
        onClick={() =>
          onOpen(player)
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xs font-black text-slate-500">
          {player.name
            ?.split(" ")
            .map(x => x[0])
            .slice(0, 2)
            .join("")
            .toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">
            {player.name}
          </p>

          <p className="truncate text-xs text-slate-400">
            {player.team}
          </p>
        </div>
      </button>

      <div className="text-right">
        <p className="text-sm font-black text-emerald-600">
          {player.points}
        </p>

        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          pts
        </p>
      </div>

      <button
        type="button"
        onClick={() =>
          onToggleFavorite(player)
        }
        title="Noņemt no favorītiem"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100"
      >
        <Star active />
      </button>
    </div>
  );
}

export default function App() {
  const [
    selectedSeason,
    setSelectedSeason,
  ] = useState("2026/2027");

  const [
    selectedLeague,
    setSelectedLeague,
  ] = useState("PL");

  const [
    selectedCategory,
    setSelectedCategory,
  ] = useState(null);

  const [
    leaguePlayers,
    setLeaguePlayers,
  ] = useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [
    username,
    setUsername,
  ] = useState(
    () =>
      localStorage.getItem(
        "radars_username"
      ) || "Matīss"
  );

  const [
    avatarUrl,
    setAvatarUrl,
  ] = useState(
    () =>
      localStorage.getItem(
        "radars_avatar"
      ) || DEFAULT_AVATAR
  );

  const [
    isAccountOpen,
    setIsAccountOpen,
  ] = useState(false);

  const [
    isGuideOpen,
    setIsGuideOpen,
  ] = useState(false);

  const [
    tempUsername,
    setTempUsername,
  ] = useState(username);

  const [
    tempAvatar,
    setTempAvatar,
  ] = useState(avatarUrl);

  const [player1, setPlayer1] =
    useState(null);

  const [player2, setPlayer2] =
    useState(null);

  const [fdr1, setFdr1] =
    useState(3);

  const [fdr2, setFdr2] =
    useState(3);

  const [
    fdrLoading,
    setFdrLoading,
  ] = useState(false);

  const [
    favoriteIds,
    setFavoriteIds,
  ] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "flow_favorite_players"
        ) || "[]"
      );
    } catch {
      return [];
    }
  });

  const [
    detailsPlayer,
    setDetailsPlayer,
  ] = useState(null);

  const [
    playerProfileData,
    setPlayerProfileData,
  ] = useState(null);

  const [
    playerProfileLoading,
    setPlayerProfileLoading,
  ] = useState(false);

  const [
    playerProfileError,
    setPlayerProfileError,
  ] = useState("");

  const captureRef =
    useRef(null);

  const apiSeason =
    seasonToApiSeason(
      selectedSeason
    );

  const leagueName =
    LEAGUES.find(
      x => x[0] === selectedLeague
    )?.[1] ||
    selectedLeague;

  const categories =
    CATEGORY_ORDER.filter(
      category =>
        leaguePlayers.some(
          player =>
            player.category ===
            category
        )
    );

  const categoryPlayers =
    selectedCategory
      ? leaguePlayers.filter(
          player =>
            player.category ===
            selectedCategory
        )
      : [];

  const favorites =
    leaguePlayers.filter(
      player =>
        favoriteIds.includes(
          player.id
        )
    );

  const isFavorite = player =>
    favoriteIds.includes(
      player.id
    );

  const toggleFavorite =
    player => {
      if (!player?.id) return;

      setFavoriteIds(current => {
        const exists =
          current.includes(
            player.id
          );

        const next = exists
          ? current.filter(
              id =>
                id !==
                player.id
            )
          : [
              ...current,
              player.id,
            ];

        localStorage.setItem(
          "flow_favorite_players",
          JSON.stringify(next)
        );

        return next;
      });
    };

  const resetPlayers = () => {
    setSelectedCategory(
      null
    );

    setPlayer1(null);
    setPlayer2(null);
  };

  const loadPlayers = async (
    forceRefresh = false
  ) => {
    setLoading(true);
    setError("");

    try {
      const players =
        await fetchApiSportsPlayers(
          COMPETITION_IDS[
            selectedLeague
          ],
          apiSeason,
          {
            forceRefresh,
          }
        );

      setLeaguePlayers(
        players
      );
    } catch (err) {
      console.error(err);
      setLeaguePlayers([]);

      setError(
        err?.message ||
          "Neizdevās ielādēt datus no API."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    resetPlayers();
    loadPlayers();
  }, [
    selectedLeague,
    selectedSeason,
  ]);

  useEffect(() => {
    if (!selectedCategory)
      return;

    const players =
      leaguePlayers.filter(
        p =>
          p.category ===
          selectedCategory
      );

    setPlayer1(current =>
      current &&
      players.some(
        p => p.id === current.id
      )
        ? current
        : players[0] || null
    );

    setPlayer2(current =>
      current &&
      players.some(
        p => p.id === current.id
      )
        ? current
        : players[1] ||
          players[0] ||
          null
    );
  }, [
    selectedCategory,
    leaguePlayers,
  ]);

  useEffect(() => {
    if (!player1 || !player2) {
      setFdr1(3);
      setFdr2(3);
      return;
    }

    let cancelled = false;

    const loadFdr =
      async () => {
        setFdrLoading(true);

        try {
          const [
            first,
            second,
          ] = await Promise.all([
            getTeamFdr(
              player1.teamId,
              selectedLeague,
              apiSeason
            ),

            getTeamFdr(
              player2.teamId,
              selectedLeague,
              apiSeason
            ),
          ]);

          if (!cancelled) {
            setFdr1(first);
            setFdr2(second);
          }
        } catch {
          if (!cancelled) {
            setFdr1(3);
            setFdr2(3);
          }
        } finally {
          if (!cancelled) {
            setFdrLoading(
              false
            );
          }
        }
      };

    loadFdr();

    return () => {
      cancelled = true;
    };
  }, [
    player1?.teamId,
    player2?.teamId,
    selectedLeague,
    apiSeason,
  ]);

  const selectCategory =
    category => {
      const players =
        leaguePlayers.filter(
          p =>
            p.category ===
            category
        );

      setSelectedCategory(
        category
      );

      setPlayer1(
        players[0] || null
      );

      setPlayer2(
        players[1] ||
          players[0] ||
          null
      );
    };

  const addToComparison =
    player => {
      if (!player) return;

      setSelectedCategory(
        player.category
      );

      if (
        !player1 ||
        player1.id === player.id
      ) {
        setPlayer1(player);

        if (
          player2?.id ===
          player.id
        ) {
          setPlayer2(null);
        }
      } else if (
        !player2 ||
        player2.id === player.id
      ) {
        setPlayer2(player);
      } else {
        setPlayer2(player);
      }

      setDetailsPlayer(null);
    };

  const openPlayer =
    async player => {
      if (!player) return;

      setDetailsPlayer(player);
      setPlayerProfileData(
        null
      );
      setPlayerProfileError(
        ""
      );
      setPlayerProfileLoading(
        true
      );

      try {
        const data =
          await fetchPlayerProfile(
            player.id,
            apiSeason
          );

        setPlayerProfileData(
          data
        );
      } catch (
        profileError
      ) {
        console.error(
          "Spēlētāja profila kļūda:",
          profileError
        );

        setPlayerProfileError(
          profileError?.message ||
            "Neizdevās ielādēt papildu profila datus."
        );
      } finally {
        setPlayerProfileLoading(
          false
        );
      }
    };

  const handlePlayer1Change =
    event => {
      const player =
        categoryPlayers.find(
          item =>
            String(item.id) ===
            String(
              event.target.value
            )
        );

      if (player)
        setPlayer1(player);
    };

  const handlePlayer2Change =
    event => {
      const player =
        categoryPlayers.find(
          item =>
            String(item.id) ===
            String(
              event.target.value
            )
        );

      if (player)
        setPlayer2(player);
    };

  const handlePlayerChange =
    setter =>
    event => {
      const player =
        categoryPlayers.find(
          item =>
            String(item.id) ===
            String(
              event.target.value
            )
        );

      if (player) {
        setter(player);
      }
    };

  const openAccount = () => {
    setTempUsername(
      username
    );

    setTempAvatar(
      avatarUrl
    );

    setIsAccountOpen(true);
  };

  const handleFileChange =
    e => {
      const file =
        e.target.files?.[0];

      if (
        !file?.type.startsWith(
          "image/"
        )
      ) {
        return;
      }

      const reader =
        new FileReader();

      reader.onloadend = () => {
        if (
          typeof reader.result ===
          "string"
        ) {
          setTempAvatar(
            reader.result
          );
        }
      };

      reader.readAsDataURL(
        file
      );
    };

  const saveAccount = e => {
    e.preventDefault();

    const name =
      tempUsername.trim() ||
      "Matīss";

    setUsername(name);
    setAvatarUrl(
      tempAvatar
    );

    localStorage.setItem(
      "radars_username",
      name
    );

    localStorage.setItem(
      "radars_avatar",
      tempAvatar
    );

    setIsAccountOpen(false);
  };

  const takeScreenshot =
    async () => {
      if (!captureRef.current)
        return;

      try {
        const canvas =
          await html2canvas(
            captureRef.current,
            {
              scale: 2,
              useCORS: true,
              allowTaint: false,
              backgroundColor:
                "#f1f5f9",
              logging: false,
            }
          );

        const clean = name =>
          (name || "player")
            .replace(
              /[^a-z0-9āčēģīķļņōŗšūž-]/gi,
              "-"
            );

        const link =
          document.createElement(
            "a"
          );

        link.href =
          canvas.toDataURL(
            "image/png"
          );

        link.download =
          `flow-comparison-${clean(
            player1?.name
          )}-vs-${clean(
            player2?.name
          )}.png`;

        link.click();
      } catch (err) {
        console.error(
          "Kļūda veidojot ekrānuzņēmumu:",
          err
        );
      }
    };

  const refreshData =
    async () => {
      clearFootballDataCache();
      await loadPlayers(
        true
      );
    };

  return (
    <div className="min-h-screen bg-[#f5f7fa] font-sans text-slate-800">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={resetPlayers}
            className="flex items-center gap-3"
          >
            <Logo className="h-9 w-9" />

            <div className="text-left">
              <div className="text-lg font-extrabold text-slate-900">
                Flow
              </div>

              <div className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Football Analytics
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={resetPlayers}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                !selectedCategory
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Home
            </button>

            <button
              type="button"
              onClick={() =>
                setIsGuideOpen(
                  true
                )
              }
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              Guide
            </button>
          </nav>

          <button
            type="button"
            onClick={openAccount}
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm hover:border-slate-300"
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-8 w-8 rounded-full border-2 border-emerald-500 object-cover"
            />

            <span className="text-xs font-bold text-slate-700">
              {username}
            </span>

            <span className="text-slate-400">
              →
            </span>
          </button>
        </div>
      </header>

      {detailsPlayer && (
        <PlayerDetailsModal
          player={detailsPlayer}
          favorite={isFavorite(
            detailsPlayer
          )}
          profileData={
            playerProfileData
          }
          profileLoading={
            playerProfileLoading
          }
          profileError={
            playerProfileError
          }
          onToggleFavorite={
            toggleFavorite
          }
          onCompare={
            addToComparison
          }
          onClose={() => {
            setDetailsPlayer(
              null
            );

            setPlayerProfileData(
              null
            );

            setPlayerProfileError(
              ""
            );
          }}
        />
      )}

      {isGuideOpen && (
        <GuideModal
          onClose={() =>
            setIsGuideOpen(false)
          }
        />
      )}

      {isAccountOpen && (
        <AccountModal
          username={
            tempUsername
          }
          avatar={tempAvatar}
          onUsernameChange={
            setTempUsername
          }
          onFileChange={
            handleFileChange
          }
          onSave={saveAccount}
          onClose={() =>
            setIsAccountOpen(
              false
            )
          }
        />
      )}

      <main className="mx-auto max-w-7xl px-5 pb-12 pt-6 md:px-8">
        <div className="mb-7 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sezona
              </span>

              <select
                value={
                  selectedSeason
                }
                onChange={e =>
                  setSelectedSeason(
                    e.target.value
                  )
                }
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
              >
                <option>
                  2026/2027
                </option>

                <option>
                  2025/2026
                </option>
              </select>
            </label>

            <div className="h-6 w-px bg-slate-200" />

            <label className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Turnīrs
              </span>

              <select
                value={
                  selectedLeague
                }
                onChange={e => {
                  setSelectedLeague(
                    e.target.value
                  );

                  resetPlayers();
                }}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold outline-none focus:border-emerald-400"
              >
                {LEAGUES.map(
                  ([code, name]) => (
                    <option
                      key={code}
                      value={code}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={refreshData}
            disabled={loading}
            className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm hover:border-emerald-300 hover:bg-emerald-50 disabled:opacity-50"
          >
            ↻{" "}
            {loading
              ? "Ielādē..."
              : "Atjaunot datus"}
          </button>
        </div>

        {loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />

            <h2 className="font-extrabold text-slate-900">
              Ielādē futbola datus
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {leagueName} ·{" "}
              {selectedSeason}
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-bold text-red-700">
              API kļūda
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                loadPlayers(true)
              }
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
            >
              Mēģināt vēlreiz
            </button>
          </div>
        )}

        {!loading &&
          !error &&
          !selectedCategory && (
            <>
              <section className="relative mb-8 overflow-hidden rounded-[28px] bg-slate-950 px-7 py-10 shadow-xl md:px-12 md:py-12">
                <div className="absolute -right-20 -top-28 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

                <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

                <div className="relative max-w-2xl">
                  <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    Football Analytics
                  </span>

                  <h1 className="text-4xl font-black tracking-tight text-white md:text-5xl">
                    Salīdzini.
                    <br />
                    <span className="text-emerald-400">
                      Atrodi labāko.
                    </span>
                  </h1>

                  <p className="mt-5 max-w-xl text-sm leading-6 text-slate-400 md:text-base">
                    Flow palīdz ātri salīdzināt profesionālus futbolistus pēc statistikas rādītājiem, Fantasy punktiem un spēlētāju profiliem.
                  </p>

                  <div className="mt-7 flex flex-wrap gap-3">
                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Turnīrs{" "}
                      <b className="ml-1 text-white">
                        {leagueName}
                      </b>
                    </span>

                    <span className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
                      Sezona{" "}
                      <b className="ml-1 text-white">
                        {selectedSeason}
                      </b>
                    </span>
                  </div>
                </div>
              </section>

              <section className="mb-9 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Stat
                  icon="♟"
                  title="Datubāze"
                  value={
                    leaguePlayers.length
                  }
                  text="pieejami spēlētāji"
                  color="emerald"
                />

                <Stat
                  icon="★"
                  title="Favorīti"
                  value={
                    favorites.length
                  }
                  text="saglabāti spēlētāji"
                  color="blue"
                />

                <Stat
                  icon="◷"
                  title="Analīze"
                  value="4"
                  text="pozīciju profili"
                  color="violet"
                />
              </section>

              {favorites.length >
                0 && (
                <section className="mb-10">
                  <div className="mb-5 flex items-end justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-5 w-1 rounded-full bg-amber-400" />

                        <h2 className="text-xl font-extrabold text-slate-900">
                          Mani favorīti
                        </h2>
                      </div>

                      <p className="mt-1.5 text-sm text-slate-500">
                        Noklikšķini uz spēlētāja, lai apskatītu viņa individuālo statistiku.
                      </p>
                    </div>

                    <span className="text-xs font-bold text-slate-400">
                      {
                        favorites.length
                      }
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {favorites.map(
                      player => (
                        <FavoriteCard
                          key={
                            player.id
                          }
                          player={
                            player
                          }
                          onOpen={
                            openPlayer
                          }
                          onToggleFavorite={
                            toggleFavorite
                          }
                        />
                      )
                    )}
                  </div>
                </section>
              )}

              <section>
                <div className="mb-5">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-emerald-500" />

                    <h2 className="text-xl font-extrabold text-slate-900">
                      Izvēlies pozīciju
                    </h2>
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Katram spēlētāju tipam ir savs statistikas profils.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {categories.map(
                    category => (
                      <CategoryCard
                        key={
                          category
                        }
                        category={
                          category
                        }
                        count={
                          leaguePlayers.filter(
                            p =>
                              p.category ===
                              category
                          ).length
                        }
                        onClick={() =>
                          selectCategory(
                            category
                          )
                        }
                      />
                    )
                  )}
                </div>
              </section>

              <section className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-6">
                  <div className="flex items-center gap-2">
                    <span className="h-5 w-1 rounded-full bg-slate-900" />

                    <h2 className="text-lg font-extrabold">
                      Kā darbojas Flow?
                    </h2>
                  </div>

                  <p className="mt-1 text-sm text-slate-500">
                    Četri vienkārši soļi līdz spēlētāju salīdzinājumam.
                  </p>
                </div>

                <div className="grid gap-6 md:grid-cols-4">
                  {[
                    [
                      "01",
                      "Izvēlies pozīciju",
                      "Izvēlies spēlētāju pozīciju.",
                    ],
                    [
                      "02",
                      "Atrodi spēlētāju",
                      "Meklē pēc vārda vai kluba.",
                    ],
                    [
                      "03",
                      "Saglabā favorītu",
                      "Atzīmē spēlētāju ar zvaigznīti.",
                    ],
                    [
                      "04",
                      "Salīdzini",
                      "Apskati statistiku un salīdzini.",
                    ],
                  ].map(
                    (
                      [
                        number,
                        title,
                        text,
                      ],
                      index
                    ) => (
                      <div
                        key={
                          number
                        }
                        className="flex gap-4"
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-black text-white ${
                            index === 0
                              ? "bg-slate-900"
                              : index === 1
                              ? "bg-emerald-500"
                              : index === 2
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`}
                        >
                          {
                            number
                          }
                        </div>

                        <div>
                          <h3 className="text-sm font-bold">
                            {
                              title
                            }
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {
                              text
                            }
                          </p>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </section>
            </>
          )}

        {!loading &&
          !error &&
          selectedCategory && (
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={
                    resetPlayers
                  }
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600"
                >
                  ← Atpakaļ
                </button>

                <div className="flex gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    {
                      CATEGORIES[
                        selectedCategory
                      ]?.name
                    }
                  </span>

                  {player1 &&
                    player2 && (
                      <button
                        type="button"
                        onClick={
                          takeScreenshot
                        }
                        className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        📷 Saglabāt attēlu
                      </button>
                    )}
                </div>
              </div>

              {!player1 ||
              !player2 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <p className="text-sm text-slate-500">
                    Šajā kategorijā nav pietiekami daudz spēlētāju salīdzināšanai.
                  </p>
                </div>
              ) : (
                <div
                  ref={
                    captureRef
                  }
                  className="rounded-2xl bg-slate-100 p-2"
                >
                  <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap gap-5">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player1
                            )
                          }
                          className="text-xs font-bold text-rose-500 hover:underline"
                        >
                          🔴{" "}
                          {
                            player1.name
                          }{" "}
                          (
                          {
                            player1.team
                          }
                          )
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player2
                            )
                          }
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          🟢{" "}
                          {
                            player2.name
                          }{" "}
                          (
                          {
                            player2.team
                          }
                          )
                        </button>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Position percentile
                      </span>
                    </div>

                    <RadarChart
                      players={[
                        player1,
                        player2,
                      ]}
                    />
                  </div>

                  <ComparisonSummary
                    player1={
                      player1
                    }
                    player2={
                      player2
                    }
                  />

                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <SearchBox
                        players={
                          categoryPlayers
                        }
                        selected={
                          player1
                        }
                        target="player1"
                        onSelectPlayer1={
                          player =>
                            setPlayer1(
                              player
                            )
                        }
                        onSelectPlayer2={
                          player =>
                            setPlayer2(
                              player
                            )
                        }
                        onOpen={
                          openPlayer
                        }
                        isFavorite={
                          isFavorite
                        }
                        onToggleFavorite={
                          toggleFavorite
                        }
                        color="rose"
                        label="Meklēt pirmo spēlētāju"
                      />

                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player1
                            )
                          }
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500"
                        >
                          Skatīt individuālo statistiku →
                        </button>
                      </div>

                      <PlayerCard
                        player={
                          player1
                        }
                        players={
                          categoryPlayers
                        }
                        onChange={
                          handlePlayer1Change
                        }
                        color="rose"
                      />
                    </div>

                    <div>
                      <SearchBox
                        players={
                          categoryPlayers
                        }
                        selected={
                          player2
                        }
                        target="player2"
                        onSelectPlayer1={
                          player =>
                            setPlayer1(
                              player
                            )
                        }
                        onSelectPlayer2={
                          player =>
                            setPlayer2(
                              player
                            )
                        }
                        onOpen={
                          openPlayer
                        }
                        isFavorite={
                          isFavorite
                        }
                        onToggleFavorite={
                          toggleFavorite
                        }
                        color="emerald"
                        label="Meklēt otro spēlētāju"
                      />

                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player2
                            )
                          }
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-500"
                        >
                          Skatīt individuālo statistiku →
                        </button>
                      </div>

                      <PlayerCard
                        player={
                          player2
                        }
                        players={
                          categoryPlayers
                        }
                        onChange={
                          handlePlayer2Change
                        }
                        color="emerald"
                      />
                    </div>
                  </div>

                  <CaptaincySimulator
                    player1={
                      player1
                    }
                    player2={
                      player2
                    }
                    fdr1={fdr1}
                    fdr2={fdr2}
                    loading={
                      fdrLoading
                    }
                  />
                </div>
              )}
            </section>
          )}

        <footer className="mt-12 border-t border-slate-200 pt-6 text-center">
          <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
            <div>
              <p className="text-xs font-bold text-slate-500">
                Flow Football Analytics
              </p>

              <p className="mt-0.5 text-[10px] text-slate-400">
                Spēlētāju salīdzināšanas platforma
              </p>
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Data provided by API-Football
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}