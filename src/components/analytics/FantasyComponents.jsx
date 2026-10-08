import React, { useMemo, useState } from "react";
import {
  toFiniteNumber,
  getProjectedPoints,
  getFormStatus,
  getBudgetPrice,
  getPositionStrength,
  sortByProjection,
  getBestForCategory,
  getFormattedFixtureDate,
  getFixtureForTeam,
  getFixtureOpponent,
  getDifficulty,
  getDifferentialScore,
  getStatusForPlayer,
  formationPositions,
  formationNames,
  categoryShortLabel,
} from "../../utils/analyticsUtils";

function FantasyPlayerComparison({ player, players, fixture, standings }) {
  const opponent = getFixtureOpponent(player, fixture);
  const difficulty = getDifficulty(player, fixture, standings);
  const form = getFormStatus(player);
  const status = getStatusForPlayer(player);
  const projection = getProjectedPoints(player);
  const differential = getDifferentialScore(player, players);

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">GW heuristiskā aplēse</p>
          <p className="mt-1 text-lg font-black text-emerald-600">{projection.toFixed(1)}</p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Forma</p>
          <span className={`mt-1 inline-flex rounded-full border px-2 py-1 text-[8px] font-black ${form.tone}`}>
            {form.label}
          </span>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
          <p className="mt-1 text-xs font-black text-slate-700">
            {opponent ? `${opponent.isHome ? "🏠" : "✈️"} ${opponent.name}` : "Nav pieejama"}
          </p>
        </div>
        <div>
          <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Cena</p>
          <p className="mt-1 text-xs font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${status.tone}`}>
          {status.label}
        </span>
        {opponent && (
          <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>
            Grūtība {difficulty.score}/5 · {difficulty.label}
          </span>
        )}
        {player?.injured && (
          <span className="rounded-full border border-rose-200 bg-rose-50 px-2 py-1 text-[8px] font-black text-rose-700">
            API norāda injury statusu
          </span>
        )}
      </div>
    </div>
  );
}

function FantasyPlayerPicker({ category, players, selectedIds, onSelect, onClose, fixtures, standings }) {
  const [search, setSearch] = useState("");
  const [comparisonPlayer, setComparisonPlayer] = useState(null);

  const available = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortByProjection(
      players.filter(player => {
        if (category !== "ALL" && player?.category !== category) return false;
        if (selectedIds.has(String(player.id))) return false;
        if (!query) return true;

        return (
          String(player.name || "").toLowerCase().includes(query) ||
          String(player.team || "").toLowerCase().includes(query)
        );
      })
    ).slice(0, 40);
  }, [players, category, selectedIds, search]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 p-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Spēlētāja izvēle</p>
            <h3 className="mt-1 text-lg font-black text-slate-900">{categoryShortLabel[category]}</h3>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-500 hover:bg-slate-100">✕</button>
        </div>

        <div className="border-b border-slate-100 p-4">
          <input
            type="text"
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Meklēt spēlētāju vai komandu..."
            autoFocus
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold outline-none focus:border-emerald-400 focus:bg-white"
          />
        </div>

        <div className="max-h-[58vh] overflow-y-auto p-4">
          {available.length ? (
            <div className="grid gap-2 sm:grid-cols-2">
              {available.map(player => {
                const form = getFormStatus(player);
                const fixture = getFixtureForTeam(player, fixtures);
                const opponent = getFixtureOpponent(player, fixture);
                const difficulty = getDifficulty(player, fixture, standings);

                return (
                  <div key={player.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex items-center gap-3">
                      {player.photo ? (
                        <img src={player.photo} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">PL</div>
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-black text-slate-900">{player.name}</p>
                        <p className="truncate text-[9px] font-bold uppercase tracking-wider text-slate-400">{player.team}</p>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black ${form.tone}`}>{form.label}</span>
                          {player.injured && <span className="rounded-full border border-rose-200 bg-rose-50 px-1.5 py-0.5 text-[7px] font-black text-rose-700">⚠️ Injury</span>}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-black text-emerald-600">{getProjectedPoints(player).toFixed(1)}</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">GW</p>
                        <p className="mt-1 text-sm font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</p>
                        <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">Cena</p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-1 text-[8px]">
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Vārti</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.goals)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Assist</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.assists)}</p>
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2">
                        <p className="font-bold text-slate-400">Minūtes</p>
                        <p className="font-black text-slate-800">{toFiniteNumber(player.minutes)}</p>
                      </div>
                    </div>

                    {opponent && (
                      <div className="mt-2 flex items-center justify-between rounded-lg bg-slate-50 px-2 py-1.5">
                        <span className="text-[8px] font-bold text-slate-500">{opponent.isHome ? "🏠 Mājas" : "✈️ Izbraukumā"} · {opponent.name}</span>
                        <span className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => onSelect(player)} className="rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white hover:bg-slate-800">Izvēlēties</button>
                      <button type="button" onClick={() => setComparisonPlayer(player)} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50">Salīdzināt</button>
                    </div>

                    {comparisonPlayer?.id === player.id && (
                      <FantasyPlayerComparison player={player} players={players} fixture={fixture} standings={standings} />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl bg-slate-50 p-10 text-center">
              <p className="text-sm font-bold text-slate-600">Nav pieejamu spēlētāju</p>
              <p className="mt-1 text-xs text-slate-400">Izvēlies citu spēlētāju vai maini meklēšanu.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerSlot({ slot, player, onOpen, onRemove, onCaptain, onViceCaptain, isCaptain, isViceCaptain, fixture, standings }) {
  const form = player ? getFormStatus(player) : null;
  const opponent = player ? getFixtureOpponent(player, fixture) : null;
  const difficulty = player ? getDifficulty(player, fixture, standings) : null;

  return (
    <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
      {player ? (
        <div className="group relative w-[82px] sm:w-[98px]">
          <button
            type="button"
            onClick={onOpen}
            className={`w-full rounded-xl border p-1.5 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl ${
              isCaptain ? "border-amber-300 bg-amber-50" : isViceCaptain ? "border-violet-300 bg-violet-50" : "border-white/80 bg-white"
            }`}
            title="Nomainīt spēlētāju"
          >
            <div className="relative mx-auto h-9 w-9 sm:h-11 sm:w-11">
              {player.photo ? (
                <img src={player.photo} alt="" className="h-full w-full rounded-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-full bg-slate-100 text-[9px] font-black text-slate-500">PL</div>
              )}

              {isCaptain && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[8px] font-black text-white">C</span>}
              {!isCaptain && isViceCaptain && <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[8px] font-black text-white">V</span>}
              {player.injured && <span className="absolute -left-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-black text-white">!</span>}
            </div>

            <p className="mt-1 truncate text-[9px] font-black text-slate-900 sm:text-[10px]">{player.name}</p>
            <div className="mt-0.5 flex items-center justify-center gap-1.5">
              <span className="text-[8px] font-bold text-emerald-600">{getProjectedPoints(player).toFixed(1)} GW</span>
              <span className="text-[8px] font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</span>
            </div>
          </button>

          <button type="button" onClick={onRemove} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-slate-900 text-sm font-black leading-none text-white shadow-md hover:bg-rose-500" title="Noņemt spēlētāju">−</button>

          <div className="mt-1 flex gap-1">
            <button type="button" onClick={onCaptain} className={`flex-1 rounded-md px-1 py-0.5 text-[7px] font-black uppercase tracking-wider ${isCaptain ? "bg-amber-100 text-amber-700" : "bg-white/90 text-slate-400 hover:text-slate-700"}`}>{isCaptain ? "C" : "Kapteinis"}</button>
            <button type="button" onClick={onViceCaptain} className={`flex-1 rounded-md px-1 py-0.5 text-[7px] font-black uppercase tracking-wider ${isViceCaptain ? "bg-violet-100 text-violet-700" : "bg-white/90 text-slate-400 hover:text-slate-700"}`}>{isViceCaptain ? "V" : "Vice"}</button>
          </div>

          <div className="pointer-events-none absolute left-1/2 top-full z-20 mt-1 hidden w-48 -translate-x-1/2 rounded-xl bg-slate-950 p-3 text-left text-white shadow-xl group-hover:block">
            <p className="text-[10px] font-black">{player.name}</p>
            <p className="mt-1 text-[8px] text-slate-300">{form?.label}</p>
            {opponent && <p className="mt-1 text-[8px] text-slate-300">{opponent.isHome ? "🏠" : "✈️"} {opponent.name} · grūtība {difficulty?.score}/5</p>}
            <p className="mt-1 text-[8px] text-emerald-300">GW heuristiskā aplēse: {getProjectedPoints(player).toFixed(1)}</p>
          </div>
        </div>
      ) : (
        <button type="button" onClick={onOpen} className="group flex w-[68px] flex-col items-center sm:w-[82px]" title={`Pievienot ${categoryShortLabel[slot.category]}`}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-dashed border-white bg-slate-900/70 text-2xl font-light text-white shadow-lg transition group-hover:scale-105 group-hover:bg-emerald-500 sm:h-14 sm:w-14">+</span>
          <span className="mt-1 max-w-full truncate rounded-md bg-slate-950/80 px-1.5 py-0.5 text-[7px] font-black uppercase tracking-wider text-white sm:text-[8px]">{categoryShortLabel[slot.category]}</span>
        </button>
      )}
    </div>
  );
}

function FantasyPitch({ formation, slots, selectedPlayers, captainId, viceCaptainId, onOpen, onRemove, onCaptain, onViceCaptain, fixtures, standings }) {
  return (
    <div className="relative mx-auto w-full max-w-[760px] overflow-hidden rounded-[28px] border-4 border-white bg-emerald-700 shadow-xl">
      <div className="relative aspect-[16/10] overflow-hidden bg-[linear-gradient(90deg,rgba(255,255,255,.035)_50%,transparent_50%)] bg-[length:25%_100%]">
        <div className="absolute inset-0 border-2 border-white/60" />
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
        <div className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
        <div className="absolute left-1/2 top-0 h-1/4 w-2/5 -translate-x-1/2 border-2 border-t-0 border-white/60" />
        <div className="absolute left-1/2 bottom-0 h-1/4 w-2/5 -translate-x-1/2 border-2 border-b-0 border-white/60" />
        <div className="absolute left-1/2 top-0 h-10 w-1/5 -translate-x-1/2 border-2 border-t-0 border-white/60" />
        <div className="absolute left-1/2 bottom-0 h-10 w-1/5 -translate-x-1/2 border-2 border-b-0 border-white/60" />

        {slots.map((slot, index) => (
          <PlayerSlot
            key={`${formation}-${slot.category}-${index}`}
            slot={slot}
            player={selectedPlayers[index] || null}
            isCaptain={String(selectedPlayers[index]?.id) === String(captainId)}
            isViceCaptain={String(selectedPlayers[index]?.id) === String(viceCaptainId)}
            onOpen={() => onOpen(index, slot.category)}
            onRemove={() => onRemove(index)}
            onCaptain={() => onCaptain(index)}
            onViceCaptain={() => onViceCaptain(index)}
            fixture={getFixtureForTeam(selectedPlayers[index], fixtures)}
            standings={standings}
          />
        ))}
      </div>
    </div>
  );
}

function TeamStrengthCard({ players }) {
  const strengths = [
    ["GOALKEEPERS", "Vārtsargi"],
    ["DEFENDERS", "Aizsargi"],
    ["MIDFIELDERS", "Pussargi"],
    ["STRIKERS", "Uzbrucēji"],
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Komandas spēks</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Pēc izvēlētā XI</p>
        </div>
        <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">FLOW</span>
      </div>

      <div className="space-y-3">
        {strengths.map(([category, label]) => {
          const value = getPositionStrength(players, category);
          return (
            <div key={category}>
              <div className="mb-1 flex items-center justify-between text-[9px] font-bold">
                <span className="text-slate-500">{label}</span>
                <span className="text-slate-900">{value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FormationAnalysis({ players }) {
  const results = useMemo(() => {
    return formationNames.map(formation => {
      const slots = formationPositions[formation];
      const used = new Set();
      const selected = slots.map(slot => {
        const player = getBestForCategory(players, slot.category, used);
        if (player) used.add(String(player.id));
        return player;
      });

      const points = selected.reduce((sum, player) => sum + (player ? getProjectedPoints(player) : 0), 0);
      const budget = selected.reduce((sum, player) => sum + (player ? getBudgetPrice(player) : 0), 0);

      return { formation, points, budget };
    }).sort((a, b) => b.flowPoints - a.flowPoints);
  }, [players]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Formāciju salīdzinājums</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Labākais automātiskais XI katrā formācijā</p>
        </div>
        {results[0] && <span className="rounded-full bg-emerald-50 px-2 py-1 text-[8px] font-black text-emerald-700">Labākā: {results[0].formation}</span>}
      </div>

      <div className="space-y-2">
        {results.map((item, index) => (
          <div key={item.formation} className={`rounded-xl border p-3 ${index === 0 ? "border-emerald-200 bg-emerald-50" : "border-slate-100 bg-slate-50"}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">{item.formation}</span>
              <span className="text-sm font-black text-emerald-600">{item.points.toFixed(1)} GW</span>
            </div>
            <div className="mt-1 flex justify-between text-[8px] font-bold text-slate-400">
              <span>Flow Value: {item.budget.toFixed(1)}</span>
              {index === 0 && <span>⚡ Ieteicamā</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FixtureSummary({ players, fixtures, standings }) {
  const rows = players.map(player => {
    const fixture = getFixtureForTeam(player, fixtures);
    const opponent = getFixtureOpponent(player, fixture);
    const difficulty = getDifficulty(player, fixture, standings);
    return { player, fixture, opponent, difficulty };
  }).filter(item => item.opponent);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā spēle</p>
        <p className="mt-1 text-xs font-bold text-slate-500">Mājas/izbraukuma un pretinieka grūtības indikators</p>
      </div>

      {rows.length ? (
        <div className="space-y-2">
          {rows.slice(0, 8).map(({ player, fixture, opponent, difficulty }) => (
            <div key={player.id} className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
              {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-black text-slate-900">{player.name}</p>
                <p className="truncate text-[8px] font-bold text-slate-400">{opponent.isHome ? "🏠" : "✈️"} {opponent.name} · {getFormattedFixtureDate(fixture)}</p>
              </div>
              <span className={`rounded-full border px-2 py-1 text-[8px] font-black ${difficulty.tone}`}>{difficulty.score}/5</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-5 text-center text-xs font-bold text-slate-400">Nākamās spēles dati nav pieejami.</p>
      )}
    </div>
  );
}

function FantasyPlayerList({ title, players, onAdd }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{title}</p>
        <span className="text-[8px] font-bold text-slate-400">{players.length}</span>
      </div>
      <div className="space-y-2">
        {players.slice(0, 5).map(player => {
          const form = getFormStatus(player);
          return (
            <button key={player.id} type="button" onClick={() => onAdd(player)} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-2 text-left hover:border-emerald-200 hover:bg-emerald-50">
              {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[10px] font-black text-slate-900">{player.name}</span>
                <span className="block truncate text-[8px] font-bold text-slate-400">{player.team}</span>
              </span>
              <span className="text-right">
                <span className="block text-[10px] font-black text-emerald-600">{getProjectedPoints(player).toFixed(1)} GW</span>
                <span className="block text-[9px] font-black text-slate-900">€{getBudgetPrice(player).toFixed(1)}m</span>
                <span className={`block rounded-full border px-1 py-0.5 text-[6px] font-black ${form.tone}`}>{form.label.replace(/^[^ ]+ /, "")}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}


export {
  FantasyPlayerComparison,
  FantasyPlayerPicker,
  PlayerSlot,
  FantasyPitch,
  TeamStrengthCard,
  FormationAnalysis,
  FixtureSummary,
  FantasyPlayerList,
};