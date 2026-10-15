import React, { useState } from "react";
import {
  CATEGORIES,
  normalize,
} from "./AppConstants";

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
  onSelect,
  onOpen,
  isFavorite,
  onToggleFavorite,
  color,
  label,
  target,
}) {
  const [value, setValue] = useState("");

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

    // Each search box receives a single slot-specific callback. This avoids
    // accidentally writing a left-side search result into the right slot.
    onSelect?.(player);
    setValue("");
  };

  return (
    <div
      className={`mb-3 rounded-xl border ${
        rose ? "border-rose-500/30" : "border-[#124B37]"
      } bg-[#0B2119] p-3 shadow-sm`}
    >
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-400">
        🔎 {label}
      </label>

      <div className="relative">
        <input
          value={value}
          spellCheck={false}
          autoComplete="off"
          onChange={e => setValue(e.target.value)}
          placeholder="Meklē pēc vārda vai kluba..."
          className={`w-full rounded-lg border px-3 py-2 pr-9 text-sm text-white caret-[#39E58C] placeholder:text-slate-400 outline-none transition ${
            rose
              ? "border-rose-500/40 bg-[#061810] focus:border-rose-400 focus:bg-[#0B2119] focus:ring-2 focus:ring-rose-400/20"
              : "border-[#24523F] bg-[#061810] focus:border-[#39E58C] focus:bg-[#0B2119] focus:ring-2 focus:ring-[#39E58C]/20"
          }`}
        />

        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-white"
          >
            ✕
          </button>
        )}
      </div>

      {value && (
        <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-[#24523F] bg-[#071C14] shadow-lg shadow-black/20">
          {results.length ? (
            results.map(player => (
              <div
                key={player.id}
                className={`flex items-center gap-2 border-b border-white/5 px-2 py-2 last:border-0 transition-colors ${
                  rose ? "hover:bg-rose-500/10" : "hover:bg-[#103526]"
                }`}
              >
                <button
                  type="button"
                  aria-label={`Atvērt ${player.name} profilu`}
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onOpen?.(player);
                  }}
                  className="flex min-w-0 flex-1 items-center justify-between rounded-lg px-1 py-1.5 text-left outline-none transition hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-[#39E58C]"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-white">
                      {player.name}
                    </span>

                    <span className="block truncate text-xs text-slate-400">
                      {player.team}
                    </span>
                  </span>

                  <span className="ml-3 shrink-0 text-[10px] font-bold uppercase text-slate-400">
                    Profils
                  </span>
                </button>

                <button
                  type="button"
                  title={
                    isFavorite(player)
                      ? "Noņemt no favorītiem"
                      : "Pievienot favorītiem"
                  }
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    onToggleFavorite(player);
                  }}
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                    isFavorite(player)
                      ? "bg-amber-400/15 text-amber-400"
                      : "bg-white/5 text-slate-400 hover:bg-amber-400/15 hover:text-amber-400"
                  }`}
                >
                  <Star active={isFavorite(player)} />
                </button>

                <button
                  type="button"
                  onClick={event => {
                    event.preventDefault();
                    event.stopPropagation();
                    handleSelect(player);
                  }}
                  className={`rounded-lg px-2.5 py-2 text-[10px] font-bold text-white ${
                    rose
                      ? "bg-rose-500 hover:bg-rose-400"
                      : "bg-[#12B886] text-[#04150E] hover:bg-[#39E58C]"
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

function Stat({ icon, title, value, text, color }) {
  const bg = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    violet: "bg-violet-50 text-violet-600",
    amber: "bg-amber-50 text-amber-600",
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

      <p className="mt-1 text-xs text-slate-500">{text}</p>
    </div>
  );
}

function CategoryCard({ category, count, onClick }) {
  const info = CATEGORIES[category];

  const accent = {
    rose: "bg-rose-400",
    emerald: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-400",
  }[info.color];

  const iconBg = {
    rose: "bg-rose-50 text-rose-500",
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
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

function displayProfileValue(value, suffix = "") {
  if (value === null || value === undefined || value === "") {
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

  return date.toLocaleDateString("lv-LV", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function PlayerProfileStat({ label, value }) {
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

function getNationalityFlagCode(nationality) {
  if (!nationality) return null;

  const value = String(nationality).trim().toLowerCase();
  const countryCodes = {
    "england": "gb-eng",
    "english": "gb-eng",
    "scotland": "gb-sct",
    "scottish": "gb-sct",
    "wales": "gb-wls",
    "welsh": "gb-wls",
    "northern ireland": "gb-nir",
    "united kingdom": "gb",
    "british": "gb",
    "germany": "de",
    "german": "de",
    "france": "fr",
    "french": "fr",
    "spain": "es",
    "spanish": "es",
    "italy": "it",
    "italian": "it",
    "portugal": "pt",
    "portuguese": "pt",
    "brazil": "br",
    "brazilian": "br",
    "argentina": "ar",
    "argentinian": "ar",
    "netherlands": "nl",
    "dutch": "nl",
    "belgium": "be",
    "belgian": "be",
    "croatia": "hr",
    "croatian": "hr",
    "serbia": "rs",
    "serbian": "rs",
    "denmark": "dk",
    "danish": "dk",
    "sweden": "se",
    "swedish": "se",
    "norway": "no",
    "norwegian": "no",
    "finland": "fi",
    "finnish": "fi",
    "poland": "pl",
    "polish": "pl",
    "latvia": "lv",
    "latvian": "lv",
    "lithuania": "lt",
    "lithuanian": "lt",
    "estonia": "ee",
    "estonian": "ee",
    "ukraine": "ua",
    "ukrainian": "ua",
    "united states": "us",
    "usa": "us",
    "american": "us",
    "canada": "ca",
    "canadian": "ca",
    "mexico": "mx",
    "mexican": "mx",
    "japan": "jp",
    "japanese": "jp",
    "south korea": "kr",
    "korea republic": "kr",
    "morocco": "ma",
    "moroccan": "ma",
    "senegal": "sn",
    "senegalese": "sn",
    "ivory coast": "ci",
    "cote d'ivoire": "ci",
    "cameroon": "cm",
    "cameroonian": "cm",
    "nigeria": "ng",
    "nigerian": "ng",
    "ghana": "gh",
    "ghanaian": "gh",
    "egypt": "eg",
    "egyptian": "eg",
    "australia": "au",
    "australian": "au",
    "switzerland": "ch",
    "swiss": "ch",
    "austria": "at",
    "austrian": "at",
    "turkey": "tr",
    "turkish": "tr",
    "greece": "gr",
    "greek": "gr",
    "ireland": "ie",
    "irish": "ie",
    "romania": "ro",
    "romanian": "ro",
    "czech republic": "cz",
    "czechia": "cz",
    "czech": "cz",
    "slovakia": "sk",
    "slovak": "sk",
    "slovenia": "si",
    "slovenian": "si",
    "hungary": "hu",
    "hungarian": "hu",
    "algeria": "dz",
    "algerian": "dz",
    "tunisia": "tn",
    "tunisian": "tn",
    "south africa": "za",
    "colombia": "co",
    "colombian": "co",
    "uruguay": "uy",
    "uruguayan": "uy",
    "chile": "cl",
    "chilean": "cl",
    "ecuador": "ec",
    "ecuadorian": "ec",
    "paraguay": "py",
    "paraguayan": "py",
    "jamaica": "jm",
    "jamaican": "jm",
  };

  if (countryCodes[value]) return countryCodes[value];
  if (/^[a-z]{2}$/.test(value)) return value;
  return null;
}

// API-Football trophy records do not consistently include competition logos.
// Use a logo included in the record when available, then fall back to the
// API-Sports league-logo CDN for competitions with known league IDs.
const TROPHY_LOGOS = {
  "premier league": 39,
  "la liga": 140,
  "serie a": 135,
  "bundesliga": 78,
  "ligue 1": 61,
  "uefa champions league": 2,
  "champions league": 2,
  "uefa europa league": 3,
  "europa league": 3,
  "uefa conference league": 848,
  "conference league": 848,
  "fa cup": 45,
  "league cup": 48,
  "efl cup": 48,
  "community shield": 528,
  "fifa club world cup": 15,
  "fifa intercontinental cup": 15,
  "copa del rey": 143,
  "supercopa de españa": 556,
  "dfb pokal": 81,
  "dfb-pokal": 81,
  "coupe de france": 66,
  "coppa italia": 137,
  "eredivisie": 88,
  "primeira liga": 94,
};

function getTrophyLogo(trophy) {
  const direct = trophy?.logo || trophy?.leagueLogo || trophy?.league_logo || trophy?.image;
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  const key = String(trophy?.league || "").trim().toLocaleLowerCase();
  const id = TROPHY_LOGOS[key];
  return id ? `https://media.api-sports.io/football/leagues/${id}.png` : null;
}

function TrophyFallbackIcon() {
  return (
    <svg viewBox="0 0 48 48" className="h-8 w-8" fill="none" aria-hidden="true">
      <path d="M15 8h18v8c0 8-4 13-9 13s-9-5-9-13V8Z" fill="#FBBF24" stroke="#B45309" strokeWidth="1.8"/>
      <path d="M15 12H8v4c0 6 4 9 10 9M33 12h7v4c0 6-4 9-10 9" stroke="#B45309" strokeWidth="2.5" strokeLinecap="round"/>
      <path d="M21 29v5h-6v5h18v-5h-6v-5" fill="#D97706" stroke="#B45309" strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="m24 11 1.8 3.5 3.9.6-2.8 2.7.7 3.9-3.6-1.9-3.6 1.9.7-3.9-2.8-2.7 3.9-.6L24 11Z" fill="#FFF7D6"/>
    </svg>
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

  const profile = profileData?.profile || {};
  const rawTrophies = Array.isArray(profileData?.trophies)
    ? profileData.trophies
    : [];

  // Only show trophies the player actually won. API-Football can return
  // runner-up finishes as well, but those are not trophy wins.
  const trophyWins = rawTrophies.filter(trophy => {
    const result = String(trophy?.place || trophy?.result || "").trim().toLowerCase();
    return result === "winner" || result === "won" || result === "1st place" ||
      result === "1st" || result === "champion" || result === "champions";
  });

  // Group repeated wins by competition and keep each season only once.
  const trophies = Object.values(trophyWins.reduce((groups, trophy, index) => {
    const name = String(trophy?.league || "Nezināma sacensība").trim();
    const key = name.toLocaleLowerCase();
    if (!groups[key]) groups[key] = {
      league: name,
      logo: getTrophyLogo(trophy),
      seasons: [],
      key: `${key}-${index}`,
    };
    if (!groups[key].logo) groups[key].logo = getTrophyLogo(trophy);
    const season = String(trophy?.season || "").trim();
    if (season && !groups[key].seasons.includes(season)) groups[key].seasons.push(season);
    return groups;
  }, {})).map(trophy => ({
    ...trophy,
    seasons: trophy.seasons.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
    count: trophy.seasons.length,
  }));

  const advanced = player.advancedStats || {};

  const seasonStats = [
    ["Spēles", player.appearances],
    ["Minūtes", player.minutes],
    ["Vārti", player.goals],
    ["Assist", player.assists],
    ["Passes", advanced.passes],
    ["Key passes", advanced.keyPasses],
    ["Shots", advanced.shots],
    ["Shots on target", advanced.shotsOnTarget],
    ["Rating", advanced.rating],
    ["Dzeltenās", advanced.yellowCards],
    ["Sarkanās", advanced.redCards],
    ["Bench", advanced.bench],
  ];

  const positionRows =
    player.category === "GOALKEEPERS"
      ? [
          ["Saves", advanced.saves],
          ["Save %", displayProfileValue(advanced.savePercentage, "%")],
          ["Goals conceded", advanced.goalsConceded],
          ["Pass accuracy", displayProfileValue(advanced.passAccuracy, "%")],
          ["Rating", advanced.rating],
        ]
      : player.category === "DEFENDERS"
      ? [
          ["Tackles", advanced.tackles],
          ["Blocks", advanced.blocks],
          ["Interceptions", advanced.interceptions],
          ["Duels won %", displayProfileValue(advanced.duelsWonPercentage, "%")],
          ["Pass accuracy", displayProfileValue(advanced.passAccuracy, "%")],
        ]
      : player.category === "MIDFIELDERS"
      ? [
          ["Key passes", advanced.keyPasses],
          ["Passes", advanced.passes],
          ["Pass accuracy", displayProfileValue(advanced.passAccuracy, "%")],
          ["Successful dribbles", advanced.successfulDribbles],
          ["Duels won %", displayProfileValue(advanced.duelsWonPercentage, "%")],
        ]
      : [
          ["Shots", advanced.shots],
          ["Shots on target", advanced.shotsOnTarget],
          ["Key passes", advanced.keyPasses],
          ["Successful dribbles", advanced.successfulDribbles],
          ["Duels won %", displayProfileValue(advanced.duelsWonPercentage, "%")],
        ];

  const visibleSeasonStats = seasonStats.filter(
    ([, value]) => value !== null && value !== undefined
  );

  const visiblePositionRows = positionRows.filter(
    ([, value]) => value !== null && value !== undefined
  );

  const photo = profile.photo || player.photo;
  const teamName = profile.team?.name || player.team || "Nezināms klubs";
  const teamLogo = profile.team?.logo || player.teamLogo;
  const position =
    profile.position ||
    player.positionLabel ||
    player.position ||
    "Nezināma pozīcija";
  const nationality = profile.nationality || player.nationality;
  const age = profile.age ?? player.age;
  const height = profile.height || player.height;
  const weight = profile.weight || player.weight;
  const birthDate = profile.birth?.date || player.birthDate;
  const shirtNumber = profile.number ?? player.number;

  const handleCompare = () => {
    try {
      onCompare?.(player);
    } finally {
      onClose?.();
    }
  };

  const handleClose = () => {
    onClose?.();
  };

  return (
    <div
      role="presentation"
      className="pointer-events-auto fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 p-3 backdrop-blur-md sm:p-5"
      onClick={event => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Spēlētāja ${player.name} profils`}
        onMouseDown={event => event.stopPropagation()}
        onClick={event => event.stopPropagation()}
        className="pointer-events-auto flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-white/70 bg-slate-50 shadow-[0_30px_90px_rgba(15,23,42,0.35)]"
      >
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
                      .map(part => part[0])
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()}
                  </div>
                )}

                <span className="absolute -bottom-2 -right-2 flex h-8 min-w-8 items-center justify-center rounded-full border-4 border-slate-950 bg-emerald-500 px-1.5 text-[10px] font-black text-white shadow-lg">
                  {shirtNumber ? `#${shirtNumber}` : "FLOW"}
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
                  <span>{teamName}</span>
                  <span className="text-slate-600">•</span>
                  <span>{position}</span>
                  {nationality && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="inline-flex items-center gap-1.5">
                        {getNationalityFlagCode(nationality) && (
                          <img
                            src={`https://flagcdn.com/w40/${getNationalityFlagCode(nationality)}.png`}
                            srcSet={`https://flagcdn.com/w80/${getNationalityFlagCode(nationality)}.png 2x`}
                            alt={`${nationality} flag`}
                            title={`${nationality} flag`}
                            className="h-3.5 w-5 rounded-[2px] object-cover shadow-sm"
                            loading="lazy"
                            onError={event => {
                              event.currentTarget.style.display = "none";
                            }}
                          />
                        )}
                        <span>{nationality}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
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
                  onClick={() => onToggleFavorite?.(player)}
                  className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-black transition ${
                    favorite
                      ? "border-amber-200 bg-amber-50 text-amber-600"
                      : "border-slate-200 bg-slate-50 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-500"
                  }`}
                >
                  <Star active={favorite} />
                  <span className="hidden sm:inline">
                    {favorite ? "Favorītos" : "Pievienot favorītiem"}
                  </span>
                </button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <PlayerProfileStat label="Vecums" value={age ? `${age} gadi` : null} />
                <PlayerProfileStat label="Augums" value={height} />
                <PlayerProfileStat label="Svars" value={weight} />
                <PlayerProfileStat label="Valstspiederība" value={nationality} />
              </div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <PlayerProfileStat
                  label="Dzimšanas datums"
                  value={formatBirthDate(birthDate)}
                />
                <PlayerProfileStat label="Pozīcija" value={position} />
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
                      {player.season || "Sezona"}
                    </p>
                  </div>
                  <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-emerald-300">
                    Analytics
                  </span>
                </div>

                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-black tracking-tighter text-white">
                    {player.flowPoints}
                  </span>
                  <span className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                    pts
                  </span>
                </div>

                <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-emerald-400 transition-all"
                    style={{
                      width: `${Math.min(100, Math.max(6, Number(player.flowPoints) || 0))}%`,
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
              {visibleSeasonStats.map(([label, value]) => (
                <PlayerProfileStat key={label} label={label} value={value} />
              ))}
            </div>
          </section>

          {visiblePositionRows.length > 0 && (
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
                {visiblePositionRows.map(([label, value]) => (
                  <PlayerProfileStat key={label} label={label} value={value} />
                ))}
              </div>
            </section>
          )}

          <section className="mt-4 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-500">
                Achievements
              </p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                Trofejas
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Parādītas tikai izcīnītās trofejas; atkārtotas uzvaras ir apvienotas.
              </p>
            </div>

            {trophies.length > 0 ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trophies.map(trophy => (
                  <div
                    key={trophy.key}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 transition hover:border-amber-200 hover:bg-amber-50/40"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-200 bg-white p-2 shadow-sm" aria-label={`${trophy.league} logo`}>
                        {trophy.logo ? (
                          <img
                            src={trophy.logo}
                            alt={`${trophy.league} logo`}
                            className="h-full w-full object-contain"
                            loading="lazy"
                            onError={event => {
                              event.currentTarget.style.display = "none";
                              const fallback = event.currentTarget.nextElementSibling;
                              if (fallback) fallback.style.display = "block";
                            }}
                          />
                        ) : null}
                        <span style={{ display: trophy.logo ? "none" : "block" }}>
                          <TrophyFallbackIcon />
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-extrabold text-slate-900">
                            {trophy.league}
                          </p>
                          {trophy.count > 1 && (
                            <span className="shrink-0 rounded-lg bg-emerald-100 px-2 py-1 text-xs font-black text-emerald-700">
                              ×{trophy.count}
                            </span>
                          )}
                        </div>
                        <p className="mt-2 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                          WINNER
                        </p>
                        <div className="mt-3 border-t border-slate-200 pt-2">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Gadi</p>
                          <p className="mt-1 text-sm text-slate-700">
                            {trophy.seasons.length ? trophy.seasons.join(", ") : "Gads nav norādīts"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                Nav pieejamu ierakstu par izcīnītām trofejām.
              </p>
            )}
          </section>
        </div>

        <div className="shrink-0 border-t border-slate-200 bg-white/95 p-4 backdrop-blur sm:px-7 sm:py-4">
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={handleClose}
              className="flex h-12 flex-1 items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-xs font-black text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 sm:flex-none"
            >
              Aizvērt
            </button>

            <button
              type="button"
              onClick={handleCompare}
              className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 text-xs font-black text-white shadow-[0_8px_24px_rgba(16,185,129,0.22)] transition hover:bg-emerald-600 hover:shadow-[0_10px_28px_rgba(16,185,129,0.3)] sm:min-w-[220px] sm:flex-none"
            >
              <span className="text-base leading-none">＋</span>
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
        onClick={() => onOpen(player)}
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
          {player.flowPoints}
        </p>

        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
          pts
        </p>
      </div>

      <button
        type="button"
        onClick={() => onToggleFavorite(player)}
        title="Noņemt no favorītiem"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500 hover:bg-amber-100"
      >
        <Star active />
      </button>
    </div>
  );
}


export {
  SearchBox,
  Stat,
  CategoryCard,
  PlayerDetailsModal,
  FavoriteCard,
};