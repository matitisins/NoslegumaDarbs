/*
 * Flow Football Analytics — Player Comparison
 * Layout update: player search and full player profile cards sit together
 * in the top header. Existing selection, profile, favorite, screenshot,
 * comparison-summary, advanced statistics and captaincy behavior is preserved.
 */
import React from "react";
import { CATEGORIES, CATEGORY_ORDER, LEAGUES, PLAYER_COMPETITIONS } from "./AppConstants";
import { SearchBox } from "./AppComponents";
import LeagueLogo from "../LeagueLogo";
import RadarChart from "../RadarChart";
import ComparisonSummary from "../ComparisonSummary";

const FLOW = {
  green: "#39E58C",
  purple: "#A78BFA",
  panel: "#0B2119",
  panel2: "#10291F",
  border: "#244C3C",
};

function SectionHeading({ eyebrow, title, description, accent = FLOW.green, right }) {
  return (
    <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
      <div>
        {eyebrow && (
          <p className="mb-1 text-[9px] font-extrabold uppercase tracking-[0.2em]" style={{ color: accent }}>
            {eyebrow}
          </p>
        )}
        <h3 className="text-xs font-black uppercase tracking-[0.15em] text-white sm:text-sm">{title}</h3>
        {description && <p className="mt-1 text-[10px] leading-5 text-slate-400">{description}</p>}
      </div>
      {right}
    </div>
  );
}


function getNationalityCode(nationality) {
  if (!nationality) return "";
  const value = String(nationality).trim().toLowerCase();
  const codes = {
    "argentina": "ar", "australia": "au", "austria": "at", "belgium": "be",
    "brazil": "br", "cameroon": "cm", "canada": "ca", "colombia": "co",
    "croatia": "hr", "czech republic": "cz", "czechia": "cz", "denmark": "dk",
    "ecuador": "ec", "england": "gb-eng", "finland": "fi", "france": "fr",
    "georgia": "ge", "germany": "de", "ghana": "gh", "greece": "gr",
    "hungary": "hu", "iceland": "is", "ireland": "ie", "italy": "it",
    "ivory coast": "ci", "cote d'ivoire": "ci", "japan": "jp", "latvia": "lv",
    "mexico": "mx", "morocco": "ma", "netherlands": "nl", "new zealand": "nz",
    "nigeria": "ng", "northern ireland": "gb-nir", "norway": "no", "poland": "pl",
    "portugal": "pt", "romania": "ro", "scotland": "gb-sct", "senegal": "sn",
    "serbia": "rs", "slovakia": "sk", "slovenia": "si", "south korea": "kr",
    "spain": "es", "sweden": "se", "switzerland": "ch", "turkey": "tr",
    "türkiye": "tr", "ukraine": "ua", "united states": "us",
    "united states of america": "us", "usa": "us", "uruguay": "uy", "wales": "gb-wls",
    "england": "gb-eng", "united kingdom": "gb", "uk": "gb"
  };
  if (codes[value]) return codes[value];
  const normalized = value.toUpperCase();
  const iso2 = {
    AR: "ar", AU: "au", AT: "at", BE: "be", BR: "br", CM: "cm", CA: "ca",
    CO: "co", HR: "hr", CZ: "cz", DK: "dk", EC: "ec", FI: "fi", FR: "fr",
    GE: "ge", DE: "de", GH: "gh", GR: "gr", HU: "hu", IS: "is", IE: "ie",
    IT: "it", CI: "ci", JP: "jp", LV: "lv", MX: "mx", MA: "ma", NL: "nl",
    NZ: "nz", NG: "ng", NO: "no", PL: "pl", PT: "pt", RO: "ro", SN: "sn",
    RS: "rs", SK: "sk", SI: "si", KR: "kr", ES: "es", SE: "se", CH: "ch",
    TR: "tr", UA: "ua", US: "us", UY: "uy", GB: "gb"
  };
  return iso2[normalized] || "";
}

function SelectedPlayerProfile({ player, onOpen, accent = FLOW.green, sideLabel }) {
  if (!player) {
    return (
      <div className="flex min-h-[94px] items-center justify-center rounded-xl border border-[#244C3C] bg-[#0B2119]/70 px-4 py-5 text-xs text-slate-400">
        Izvēlies spēlētāju, lai skatītu profilu
      </div>
    );
  }

  const clubLogo = player.teamLogo || player.team?.logo || player.team_logo || null;
  const nationality = player.nationality || player.country || player.birthCountry || "";
  const nationalityCode = getNationalityCode(nationality);
  const initials = String(player.name || "PL")
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="relative flex min-h-[94px] items-center gap-3 overflow-hidden rounded-xl border border-[#244C3C] bg-[#030817] p-3 text-white sm:gap-4 sm:p-4">
      <span className="absolute inset-y-0 left-0 w-1" style={{ backgroundColor: accent }} />
      {player.photo ? (
        <img
          src={player.photo}
          alt={player.name || "Spēlētājs"}
          className="ml-1 h-12 w-12 shrink-0 rounded-xl object-cover sm:h-14 sm:w-14"
          loading="lazy"
        />
      ) : (
        <div className="ml-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-sm font-black sm:h-14 sm:w-14">
          {initials || "PL"}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
          {sideLabel || "Izvēlētais spēlētājs"}
        </p>
        <h3 className="mt-1 flex min-w-0 items-center gap-2 text-sm font-black sm:text-base">
          <span className="truncate">{player.name}</span>
          {nationalityCode && (
            <img
              src={`https://flagcdn.com/w40/${nationalityCode}.png`}
              srcSet={`https://flagcdn.com/w80/${nationalityCode}.png 2x`}
              alt={`${nationality} karogs`}
              title={nationality}
              className="ml-0.5 inline-block h-3.5 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-white/15"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          )}
        </h3>
        <div className="mt-1 flex min-w-0 items-center gap-1.5 text-[10px] text-slate-400 sm:text-xs">
          {clubLogo && (
            <img
              src={clubLogo}
              alt=""
              className="h-4 w-4 shrink-0 rounded-full bg-white/10 object-contain p-[1px]"
              loading="lazy"
              onError={(event) => { event.currentTarget.style.display = "none"; }}
            />
          )}
          <span className="truncate">{player.team || player.team?.name || "Klubs nav norādīts"}</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onOpen?.(player)}
        disabled={!onOpen}
        className="shrink-0 rounded-lg border border-white/10 bg-white/[0.05] px-2.5 py-2 text-[9px] font-extrabold uppercase tracking-wide text-white transition hover:border-[#39E58C]/50 hover:text-[#39E58C] disabled:cursor-default disabled:opacity-70 sm:px-3"
        aria-label={`Atvērt ${player.name} profilu`}
      >
        Profils ↗
      </button>
    </div>
  );
}

function getAdvancedStatRows(player) {
  if (!player) return [];
  const stats = player.advancedStats || {};
  const number = (value) => {
    if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return null;
    return Number(value);
  };
  const percentage = (value) => {
    const parsed = number(value);
    return parsed === null ? null : `${parsed}%`;
  };
  const definitions = {
    GOALKEEPERS: [
      ["Clean sheets", "cleanSheets"],
      ["Penalties saved", "penaltiesSaved"],
      ["Tackles", "tackles"],
      ["Blocks", "blocks"],
      ["Interceptions", "interceptions"],
      ["Fouls committed", "foulsCommitted"],
      ["Own goals", "ownGoals"],
      ["Starts", "starts"],
      ["Substitute appearances", "substituteIn"],
      ["Unused substitute", "bench"],
    ],
    DEFENDERS: [
      ["Fouls drawn", "foulsDrawn"],
      ["Fouls committed", "foulsCommitted"],
      ["Duels attempted", "duels"],
      ["Duels won", "duelsWon"],
      ["Dribble attempts", "dribbleAttempts"],
      ["Clean sheets", "cleanSheets"],
      ["Own goals", "ownGoals"],
      ["Bonus points", "bonus"],
      ["Starts", "starts"],
      ["Substitute appearances", "substituteIn"],
      ["Substituted off", "substituteOut"],
      ["Unused substitute", "bench"],
    ],
    MIDFIELDERS: [
      ["Tackles", "tackles"],
      ["Blocks", "blocks"],
      ["Interceptions", "interceptions"],
      ["Fouls drawn", "foulsDrawn"],
      ["Fouls committed", "foulsCommitted"],
      ["Duels attempted", "duels"],
      ["Duels won", "duelsWon"],
      ["Dribble attempts", "dribbleAttempts"],
      ["Penalties won", "penaltiesWon"],
      ["Penalties missed", "penaltiesMissed"],
      ["Own goals", "ownGoals"],
      ["Bonus points", "bonus"],
      ["Starts", "starts"],
      ["Substitute appearances", "substituteIn"],
      ["Substituted off", "substituteOut"],
      ["Unused substitute", "bench"],
    ],
    STRIKERS: [
      ["Passes", "passes"],
      ["Pass accuracy", "passAccuracy", "percent"],
      ["Tackles", "tackles"],
      ["Blocks", "blocks"],
      ["Interceptions", "interceptions"],
      ["Fouls drawn", "foulsDrawn"],
      ["Fouls committed", "foulsCommitted"],
      ["Duels attempted", "duels"],
      ["Duels won", "duelsWon"],
      ["Dribble attempts", "dribbleAttempts"],
      ["Penalties won", "penaltiesWon"],
      ["Penalties missed", "penaltiesMissed"],
      ["Own goals", "ownGoals"],
      ["Bonus points", "bonus"],
      ["Starts", "starts"],
      ["Substitute appearances", "substituteIn"],
      ["Substituted off", "substituteOut"],
      ["Unused substitute", "bench"],
    ],
  };

  const selected = definitions[player.category] || definitions.MIDFIELDERS;
  return selected.map(([label, key, format]) => {
    const rawValue = stats[key];
    const value = format === "percent" ? percentage(rawValue) : number(rawValue);
    return [label, value];
  });
}

function AdvancedStatsPanel({ player, opponent, color = FLOW.green, sharedLabels = [] }) {
  if (!player) return null;

  const playerRows = getAdvancedStatRows(player);
  const opponentRows = getAdvancedStatRows(opponent);
  const playerValues = new Map(playerRows.map(([label, value]) => [label, value]));
  const opponentValues = new Map(opponentRows.map(([label, value]) => [label, value]));
  const labels = sharedLabels.length
    ? sharedLabels
    : [...new Set([...playerRows.map(([label]) => label), ...opponentRows.map(([label]) => label)])];

  const isBetter = (label, value, otherValue) => {
    if (value === null || value === undefined || value === "" ||
        otherValue === null || otherValue === undefined || otherValue === "") return false;
    const currentNumber = Number.parseFloat(String(value).replace("%", ""));
    const otherNumber = Number.parseFloat(String(otherValue).replace("%", ""));
    if (!Number.isFinite(currentNumber) || !Number.isFinite(otherNumber) || currentNumber === otherNumber) return false;
    const lowerIsBetter = new Set([
      "Fouls committed", "Own goals", "Penalties missed", "Substituted off", "Unused substitute",
    ]).has(label);
    return lowerIsBetter ? currentNumber < otherNumber : currentNumber > otherNumber;
  };

  return (
    <section className="mt-4 min-w-0 rounded-xl border border-[#244C3C] bg-[#0B2119]/70 p-3 sm:p-4">
      <div className="mb-3 flex min-w-0 flex-col items-start gap-1">
        <p className="text-[9px] font-extrabold uppercase tracking-[0.18em]" style={{ color }}>Papildu dati</p>
        <h4 className="break-words text-xs font-black text-white">{player.name} · Advanced statistics</h4>
        <p className="text-[10px] font-semibold leading-4" style={{ color }}>
          {player.team || "Klubs nav norādīts"}
        </p>
      </div>
      {labels.length > 0 ? (
        <div className="divide-y divide-white/10">
          {labels.map((label) => {
            const value = playerValues.get(label);
            const otherValue = opponentValues.get(label);
            const currentWins = isBetter(label, value, otherValue);
            return (
              <div key={label} className="grid min-h-[42px] grid-cols-[minmax(0,1fr)_auto] items-center gap-3 py-2">
                <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap pr-1 text-[10px] font-semibold leading-4 text-white sm:text-xs" title={label}>
                  {label}
                </span>
                <span
                  className={`shrink-0 min-w-[3.25rem] text-right text-sm font-black tabular-nums sm:text-base ${currentWins ? "text-[#39E58C]" : "text-white"}`}
                  title={`${label}: ${value ?? "Nav datu"}`}
                >
                  {value !== null && value !== undefined && value !== "" ? value : "—"}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="rounded-lg bg-white/[0.035] px-3 py-3 text-xs text-slate-300">
          Šim spēlētājam nav pieejama papildu statistika no API.
        </p>
      )}
    </section>
  );
}

export default function PlayerComparisonView({
  selectedCategory,
  setSelectedCategory,
  selectedLeague,
  setSelectedLeague,
  selectedSeason,
  setSelectedSeason,
  player1,
  player2,
  categoryPlayers,
  captureRef,
  takeScreenshot,
  openPlayer,
  setPlayer1,
  setPlayer2,
  isFavorite,
  toggleFavorite,
  handlePlayer1Change,
  handlePlayer2Change,
  selectComparisonPlayer,
}) {
  const hasPlayers = Boolean(player1 && player2);
  const advancedStatLabels = [...new Set([
    ...getAdvancedStatRows(player1).map(([label]) => label),
    ...getAdvancedStatRows(player2).map(([label]) => label),
  ])];

  const choosePlayer = (side, player) => {
    if (!player) return;
    if (selectComparisonPlayer) {
      selectComparisonPlayer(side, player);
    } else if (side === "left") {
      setPlayer1(player);
    } else {
      setPlayer2(player);
    }
  };

  return (
    <section className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-emerald-500/25 bg-emerald-50 px-3 py-2 text-[9px] font-extrabold uppercase tracking-[0.14em] text-emerald-800">
            {CATEGORIES[selectedCategory]?.name || selectedCategory}
          </span>
          {hasPlayers && (
            <button
              type="button"
              onClick={takeScreenshot}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0B2119] px-4 py-2.5 text-xs font-extrabold text-white shadow-sm transition hover:bg-[#164832] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2"
            >
              <span aria-hidden="true">↧</span> Saglabāt salīdzinājumu
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#244C3C] bg-[#0B2119] p-3 sm:grid-cols-3 sm:p-4">
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#39E58C]">Pozīcija</span>
          <select value={selectedCategory || ""} onChange={event => { if (event.target.value) setSelectedCategory?.(event.target.value); }} className="w-full rounded-lg border border-[#244C3C] bg-[#061810] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#39E58C] focus:ring-2 focus:ring-[#39E58C]/20">
            <option value="" disabled>Izvēlies pozīciju...</option>
            {CATEGORY_ORDER.map(category => <option key={category} value={category}>{CATEGORIES[category]?.name || category}</option>)}
          </select>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#39E58C]">Līga</span>
          <span className="flex items-center gap-2">

            <LeagueLogo competition={selectedLeague || LEAGUES[0][0]} size={30} className="rounded-lg" />

            <select value={selectedLeague || LEAGUES[0][0]} onChange={event => setSelectedLeague?.(event.target.value)} className="w-full rounded-lg border border-[#244C3C] bg-[#061810] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#39E58C] focus:ring-2 focus:ring-[#39E58C]/20">

              <optgroup label="Nacionālās līgas">
                {LEAGUES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </optgroup>
              <optgroup label="Eiropas sacensības">
                {PLAYER_COMPETITIONS.filter(([code]) => !LEAGUES.some(([leagueCode]) => leagueCode === code)).map(([code, name]) => <option key={code} value={code}>{name}</option>)}
              </optgroup>

            </select>

          </span>
        </label>
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#39E58C]">Sezona</span>
          <select value={selectedSeason || "2026/2027"} onChange={event => setSelectedSeason?.(event.target.value)} className="w-full rounded-lg border border-[#244C3C] bg-[#061810] px-3 py-2.5 text-sm font-semibold text-white outline-none focus:border-[#39E58C] focus:ring-2 focus:ring-[#39E58C]/20">
            <option value="2026/2027">2026/2027</option>
            <option value="2025/2026">2025/2026</option>
            <option value="2024/2025">2024/2025</option>
          </select>
        </label>
      </div>

      {!hasPlayers ? (
        <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-white to-emerald-50 p-10 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#244C3C] bg-[#10291F] text-2xl shadow-sm">⚽</div>
          <h2 className="mt-4 text-base font-extrabold text-[#123D2B]">Nepietiek spēlētāju salīdzinājumam</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Šajā kategorijā nav pietiekami daudz spēlētāju. Izvēlies citu pozīciju vai līgu, lai turpinātu.
          </p>
        </div>
      ) : (
        <div ref={captureRef} className="space-y-4 rounded-[24px] border border-[#244C3C] bg-[#061810] p-2.5 shadow-[0_18px_50px_-32px_rgba(8,50,31,0.45)] sm:space-y-5 sm:p-4">
          {/* Top title and working player search controls */}
          <header className="overflow-visible rounded-2xl border border-[#244C3C] bg-[#0B2119] text-white shadow-lg shadow-emerald-950/10">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-300/10 px-4 py-3 sm:px-5">
              <div>
                <p className="text-[9px] font-extrabold uppercase tracking-[0.23em] text-[#39E58C]">Flow Football Analytics</p>
                <h2 className="mt-1 text-sm font-black uppercase tracking-[0.12em] sm:text-base">Spēlētāju salīdzinājums</h2>
              </div>
              <span className="rounded-full border border-[#39E58C]/25 bg-[#39E58C]/[0.08] px-3 py-1.5 text-[9px] font-extrabold uppercase tracking-[0.13em] text-[#39E58C]">
                Statistika · Percentiles
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-[minmax(0,1fr)_42px_minmax(0,1fr)] sm:items-start sm:p-4">
              <div className="min-w-0">
                <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#39E58C]">01 · Pirmais spēlētājs</p>
                <SearchBox
                  players={categoryPlayers || []}
                  selected={player1}
                  onSelect={(player) => choosePlayer("left", player)}
                  onOpen={openPlayer}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  color="emerald"
                  label="Meklēt pirmo spēlētāju"
                />
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-2 px-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Izvēlētā spēlētāja profils</span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#39E58C]" />
                  </div>
                  <SelectedPlayerProfile player={player1} onOpen={openPlayer} accent={FLOW.green} sideLabel="01 · Pirmais spēlētājs" />
                </div>
              </div>
              <div className="flex items-center justify-center pt-8">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-300/25 bg-white/[0.04] text-[9px] font-black tracking-wider text-slate-300">VS</span>
              </div>
              <div className="min-w-0">
                <p className="mb-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-[#A78BFA]">02 · Otrais spēlētājs</p>
                <SearchBox
                  players={categoryPlayers || []}
                  selected={player2}
                  onSelect={(player) => choosePlayer("right", player)}
                  onOpen={openPlayer}
                  isFavorite={isFavorite}
                  onToggleFavorite={toggleFavorite}
                  color="emerald"
                  label="Meklēt otro spēlētāju"
                />
                <div className="mt-3">
                  <div className="mb-2 flex items-center justify-between gap-2 px-1">
                    <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">Izvēlētā spēlētāja profils</span>
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#A78BFA]" />
                  </div>
                  <SelectedPlayerProfile player={player2} onOpen={openPlayer} accent={FLOW.purple} sideLabel="02 · Otrais spēlētājs" />
                </div>
              </div>
            </div>
          </header>

          {/* Radar on the left, summary on the right */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
            <section className="min-w-0 overflow-hidden rounded-2xl border border-[#244C3C] bg-[#0C241B] p-3 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow="Datu vizualizācija"
                title="Statistikas profils"
                description="Spēlētāju sniegums salīdzinājumā no 0 līdz 100"
                right={<span className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.05] px-2.5 py-1.5 text-[9px] font-extrabold text-emerald-200">0–100</span>}
              />
              <div className="mx-auto w-full max-w-[660px] [&_svg]:mx-auto [&_svg]:block [&_svg]:h-auto [&_svg]:max-h-[370px] [&_svg]:w-full">
                <RadarChart players={[player1, player2]} />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 border-t border-emerald-100/10 pt-3">
                <span className="inline-flex max-w-full items-center gap-2 text-[10px] font-bold text-slate-200">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FLOW.green }} />
                  <span className="max-w-[180px] truncate">{player1.name}{player1.team ? ` (${player1.team})` : ""}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 text-[10px] font-bold text-slate-200">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: FLOW.purple }} />
                  <span className="max-w-[180px] truncate">{player2.name}{player2.team ? ` (${player2.team})` : ""}</span>
                </span>
              </div>
              {/* Additional API-Football statistics below the radar; summary metrics are intentionally excluded */}
              <div className="mt-4 grid grid-cols-1 gap-3 2xl:grid-cols-2">
                <AdvancedStatsPanel player={player1} opponent={player2} color={FLOW.green} sharedLabels={advancedStatLabels} />
                <AdvancedStatsPanel player={player2} opponent={player1} color={FLOW.purple} sharedLabels={advancedStatLabels} />
              </div>
            </section>

            <section className="min-w-0 rounded-2xl border border-[#244C3C] bg-[#10291F] p-3 shadow-sm sm:p-5">
              <SectionHeading
                eyebrow="Salīdzinājums pa rādītājiem"
                title="Statistikas kopsavilkums"
                description="Labākie pieejamie rezultāti izcelti ar spēlētāja krāsu"
                accent={FLOW.purple}
              />
              <div className="rounded-xl border border-emerald-100/10 bg-[#0B2119]/55 px-3 sm:px-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 border-b border-emerald-100/10 py-3">
                  <span className="truncate text-right text-[11px] font-extrabold text-[#39E58C]">{player1.name}</span>
                  <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">VS</span>
                  <span className="truncate text-[11px] font-extrabold text-[#A78BFA]">{player2.name}</span>
                </div>
                <ComparisonSummary player1={player1} player2={player2} />
              </div>
            </section>
          </div>

        </div>
      )}
    </section>
  );
}