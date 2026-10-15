import React, { useEffect, useMemo, useState } from "react";
import {
  FANTASY_BENCH_SIZE,
  buildBudgetConstrainedXI,
  calculateSquadBudget,
  getFantasySquadConstraintViolations,
  isFantasyTeamValid,
} from "../../utils/fantasyRules";
import {
  getProjectedPoints,
  getBudgetPrice,
  sortByProjection,
  getDifferentialScore,
  formationPositions,
  formationNames,
} from "../../utils/analyticsUtils";
import {
  FantasyPlayerComparison,
  FantasyPlayerPicker,
  PlayerSlot,
  FantasyPitch,
  TeamStrengthCard,
  FormationAnalysis,
  FixtureSummary,
  FantasyPlayerList,
} from "./FantasyComponents";

const toFiniteNumber = value => { const number = Number(value); return Number.isFinite(number) ? number : 0; };

function FantasyBuilder({ players = [], competition, season, fixtures = { upcoming: [], recent: [] }, standings = [], contextLoading = false }) {
  const [formation, setFormation] = useState("4-3-3");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [picker, setPicker] = useState(null);
  const budget = 100;
  const [budgetError, setBudgetError] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState("ALL");
  const [playerSort, setPlayerSort] = useState("projection");
  const [builderTab, setBuilderTab] = useState("players");
  const [savedSquads, setSavedSquads] = useState([]);
  const [squadName, setSquadName] = useState("My Squad");
  const [showSavedSquads, setShowSavedSquads] = useState(false);
  const storageKey = `flow-fantasy-squads:${competition || "all"}:${season || "current"}`;

  useEffect(() => {
    try {
      const parsed = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      setSavedSquads(Array.isArray(parsed) ? parsed : []);
    } catch { setSavedSquads([]); }
  }, [storageKey]);

  useEffect(() => {
    try { window.localStorage.setItem(storageKey, JSON.stringify(savedSquads)); } catch { /* Storage can be unavailable. */ }
  }, [savedSquads, storageKey]);
  const fixtureLoading = Boolean(contextLoading);
  const officialFplPriceCount = useMemo(
    () => players.filter(player => Number(player?.officialFplPrice) > 0).length,
    [players]
  );
  const useOfficialFplRules = competition === "PL" && Number(season) === 2026 && officialFplPriceCount > 0;
  const budgetCurrency = useOfficialFplRules ? "£" : "€";
  // In official FPL mode, do not allow API-Football-only players without an
  // official FPL element/price to enter the squad.
  const fantasyPlayers = useMemo(
    () => useOfficialFplRules ? players.filter(player => Number(player?.officialFplPrice) > 0) : players,
    [players, useOfficialFplRules]
  );

  const slots = formationPositions[formation] || [];
  const selectedIds = useMemo(() => new Set(selectedPlayers.filter(Boolean).map(player => String(player.id))), [selectedPlayers]);
  const benchIds = useMemo(() => new Set(benchPlayers.filter(Boolean).map(player => String(player.id))), [benchPlayers]);
  const allSquadIds = useMemo(() => new Set([...selectedIds, ...benchIds]), [selectedIds, benchIds]);
  const filledCount = selectedPlayers.filter(Boolean).length;
  const teamValidation = useMemo(
    () => isFantasyTeamValid({
      startingPlayers: selectedPlayers,
      benchPlayers,
      budget,
      captainId,
      viceCaptainId,
      getPrice: getBudgetPrice,
      requiredStartingPlayers: 11,
    }),
    [selectedPlayers, benchPlayers, budget, captainId, viceCaptainId]
  );

  const isComplete = teamValidation.valid;

  useEffect(() => {
    setSelectedPlayers([]);
    setBenchPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
    setPicker(null);
    setBudgetError("");
  }, [competition, season]);

  useEffect(() => {
    setSelectedPlayers(current =>
      slots.map((slot, index) => {
        const player = current[index];
        return player && player.category === slot.category ? player : null;
      })
    );
    setCaptainId(null);
    setViceCaptainId(null);
    setPicker(null);
  }, [formation]);

  const squadBudget = useMemo(
    () => calculateSquadBudget(
      [...selectedPlayers, ...benchPlayers],
      getBudgetPrice
    ),
    [selectedPlayers, benchPlayers]
  );

  const startingBudget = useMemo(
    () => calculateSquadBudget(
      selectedPlayers,
      getBudgetPrice
    ),
    [selectedPlayers]
  );

  const expectedPoints = useMemo(
    () => selectedPlayers.filter(Boolean).reduce((sum, player) => sum + getProjectedPoints(player), 0),
    [selectedPlayers]
  );

  const captainPoints = useMemo(() => {
    const captain = selectedPlayers.find(player => String(player?.id) === String(captainId));
    return captain ? getProjectedPoints(captain) : 0;
  }, [selectedPlayers, captainId]);

  const projectedPoints = expectedPoints + captainPoints;

  const differentialPlayers = useMemo(() => {
    return [...fantasyPlayers]
      .filter(player => !allSquadIds.has(String(player.id)))
      .sort((a, b) => getDifferentialScore(b, fantasyPlayers) - getDifferentialScore(a, fantasyPlayers))
      .slice(0, 5);
  }, [fantasyPlayers, allSquadIds]);

  const choosePlayer = player => {
    if (!picker) return;

    if (allSquadIds.has(String(player.id))) return;

    const nextStarting = [...selectedPlayers];
    const nextBench = [...benchPlayers];

    if (picker.type === "starter") {
      nextStarting[picker.index] = player;
    } else if (picker.type === "bench") {
      if (nextBench.length >= FANTASY_BENCH_SIZE) return;
      nextBench.push(player);
    }

    const nextBudget = calculateSquadBudget(
      [...nextStarting, ...nextBench],
      getBudgetPrice
    );

    const constraintReasons = getFantasySquadConstraintViolations({
      startingPlayers: nextStarting,
      benchPlayers: nextBench,
      requireCompleteSquad: false,
    });

    if (constraintReasons.length) {
      const message = constraintReasons[0];
      setBudgetError(message);
      window.setTimeout(() => {
        setBudgetError(current => current === message ? "" : current);
      }, 4500);
      return;
    }

    if (nextBudget > budget + 0.0001) {
      const message = `Spēlētāju nevar pievienot. Sastāva vērtība būtu ${budgetCurrency}${nextBudget.toFixed(1)}m, bet budžets ir ${budgetCurrency}${budget.toFixed(1)}m.`;
      setBudgetError(message);
      window.setTimeout(() => {
        setBudgetError(current => current === message ? "" : current);
      }, 4500);
      return;
    }

    setSelectedPlayers(nextStarting);
    setBenchPlayers(nextBench.slice(0, FANTASY_BENCH_SIZE).sort((a, b) => {
      if (a?.category === "GOALKEEPERS") return -1;
      if (b?.category === "GOALKEEPERS") return 1;
      return 0;
    }));
    setBudgetError("");
    setPicker(null);
  };

  const removeStarter = index => {
    const removed = selectedPlayers[index];
    setSelectedPlayers(current => {
      const next = [...current];
      next[index] = null;
      return next;
    });

    if (removed && String(removed.id) === String(captainId)) setCaptainId(null);
    if (removed && String(removed.id) === String(viceCaptainId)) setViceCaptainId(null);
    setBudgetError("");
  };

  const removeBench = id => {
    setBenchPlayers(current => current.filter(player => String(player.id) !== String(id)));
    setBudgetError("");
  };

  const moveBenchPlayer = (id, direction) => {
    setBenchPlayers(current => {
      const index = current.findIndex(player => String(player.id) === String(id));
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const chooseCaptain = index => {
    const player = selectedPlayers[index];
    if (!player) return;
    setCaptainId(String(player.id));
    if (String(viceCaptainId) === String(player.id)) setViceCaptainId(null);
  };

  const chooseViceCaptain = index => {
    const player = selectedPlayers[index];
    if (!player) return;
    if (String(captainId) === String(player.id)) return;
    setViceCaptainId(String(player.id));
  };

  const clearTeam = () => {
    setSelectedPlayers([]);
    setBenchPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
    setPicker(null);
    setBudgetError("");
  };

  const buildBestXI = () => {
    const best = buildBudgetConstrainedXI({
      players: fantasyPlayers,
      slots,
      budget,
      getPrice: getBudgetPrice,
      getProjection: getProjectedPoints,
    });

    if (!best || best.some(player => !player)) {
      setBudgetError(
        "Pieejamajā budžetā nevar izveidot pilnu XI ar izvēlēto formāciju. Palielini budžetu vai izvēlies citu formāciju."
      );
      return;
    }

    setSelectedPlayers(best);
    setBenchPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
    setBudgetError("");
  };

  const buildBestFormation = () => {
    const results = formationNames
      .map(candidateFormation => {
        const candidateSlots = formationPositions[candidateFormation];
        const candidate = buildBudgetConstrainedXI({
          players: fantasyPlayers,
          slots: candidateSlots,
          budget,
          getPrice: getBudgetPrice,
          getProjection: getProjectedPoints,
        });

        if (!candidate || candidate.some(player => !player)) return null;

        const points = candidate.reduce(
          (sum, player) => sum + getProjectedPoints(player),
          0
        );

        return {
          formation: candidateFormation,
          points,
          candidate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.points - a.points)[0];

    if (!results) {
      setBudgetError(
        "Nevienā pieejamajā formācijā nevar izveidot pilnu XI izvēlētajā budžetā."
      );
      return;
    }

    setFormation(results.formation);
    setSelectedPlayers(results.candidate);
    setBenchPlayers([]);
    setCaptainId(null);
    setViceCaptainId(null);
    setBudgetError("");
  };

  const autoBench = () => {
    const used = new Set([...selectedIds]);
    const order = ["GOALKEEPERS", "DEFENDERS", "MIDFIELDERS", "STRIKERS"];
    const next = [];
    let runningBudget = startingBudget;

    for (const category of order) {
      const candidates = sortByProjection(
        fantasyPlayers.filter(
          player =>
            player.category === category &&
            !used.has(String(player.id))
        )
      );

      for (const player of candidates) {
        if (next.length >= FANTASY_BENCH_SIZE) break;
        const playerPrice = getBudgetPrice(player);

        const constraintReasons = getFantasySquadConstraintViolations({
          startingPlayers: selectedPlayers,
          benchPlayers: [...next, player],
          requireCompleteSquad: false,
        });

        if (constraintReasons.length) continue;
        if (runningBudget + playerPrice > budget + 0.0001) continue;
        next.push(player);
        used.add(String(player.id));
        runningBudget += playerPrice;
      }

      if (next.length >= FANTASY_BENCH_SIZE) break;
    }

    setBenchPlayers(next.sort((a, b) => {
      if (a?.category === "GOALKEEPERS") return -1;
      if (b?.category === "GOALKEEPERS") return 1;
      return 0;
    }));
    if (next.length < FANTASY_BENCH_SIZE) {
      setBudgetError(`Budžeta ietvaros automātiski izdevās pievienot ${next.length}/${FANTASY_BENCH_SIZE} rezervistus.`);
    } else {
      setBudgetError("");
    }
  };

  const remainingBudget = budget - squadBudget;
  const captain = selectedPlayers.find(player => String(player?.id) === String(captainId));
  const viceCaptain = selectedPlayers.find(player => String(player?.id) === String(viceCaptainId));

  const positionLabels = {
    GOALKEEPERS: "GK", DEFENDERS: "DEF", MIDFIELDERS: "MID", STRIKERS: "FWD",
  };
  const filteredPlayers = [...fantasyPlayers]
    .filter(player => !allSquadIds.has(String(player.id)))
    .filter(player => positionFilter === "ALL" || player.category === positionFilter)
    .filter(player => {
      const query = playerSearch.trim().toLowerCase();
      return !query || String(player.name || "").toLowerCase().includes(query) || String(player.team || "").toLowerCase().includes(query);
    })
    .sort((a, b) => {
      if (playerSort === "priceLow") return getBudgetPrice(a) - getBudgetPrice(b);
      if (playerSort === "priceHigh") return getBudgetPrice(b) - getBudgetPrice(a);
      if (playerSort === "form") return getDifferentialScore(b, fantasyPlayers) - getDifferentialScore(a, fantasyPlayers);
      return getProjectedPoints(b) - getProjectedPoints(a);
    }).slice(0, 60);

  const addPlayerFromList = player => {
    if (allSquadIds.has(String(player.id))) return;
    const slotIndex = slots.findIndex((slot, index) => slot.category === player.category && !selectedPlayers[index]);
    if (slotIndex >= 0) {
      const nextStarting = [...selectedPlayers];
      nextStarting[slotIndex] = player;
      const nextBudget = calculateSquadBudget([...nextStarting, ...benchPlayers], getBudgetPrice);
      const violations = getFantasySquadConstraintViolations({ startingPlayers: nextStarting, benchPlayers, requireCompleteSquad: false });
      if (violations.length || nextBudget > budget + 0.0001) {
        setBudgetError(violations[0] || `Nepietiek budžeta. Komandas vērtība būtu ${budgetCurrency}${nextBudget.toFixed(1)}m.`);
        return;
      }
      setSelectedPlayers(nextStarting);
      setBudgetError("");
      return;
    }
    if (benchPlayers.length < FANTASY_BENCH_SIZE) {
      const nextBench = [...benchPlayers, player];
      const nextBudget = calculateSquadBudget([...selectedPlayers, ...nextBench], getBudgetPrice);
      const violations = getFantasySquadConstraintViolations({ startingPlayers: selectedPlayers, benchPlayers: nextBench, requireCompleteSquad: false });
      if (violations.length || nextBudget > budget + 0.0001) {
        setBudgetError(violations[0] || `Nepietiek budžeta. Komandas vērtība būtu ${budgetCurrency}${nextBudget.toFixed(1)}m.`);
        return;
      }
      setBenchPlayers(nextBench);
      setBudgetError("");
      return;
    }
    setBudgetError(`Nav brīvas ${positionLabels[player.category] || "pozīcijas"} vietas. Noņem spēlētāju vai maini formāciju.`);
  };

  const saveCurrentSquad = () => {
    const name = squadName.trim() || `Sastāvs ${savedSquads.length + 1}`;
    const squad = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      formation,
      selectedPlayers,
      benchPlayers,
      captainId,
      viceCaptainId,
      savedAt: new Date().toISOString(),
    };
    setSavedSquads(current => [squad, ...current.filter(item => item.name !== name)].slice(0, 10));
    setSquadName("");
    setShowSavedSquads(false);
  };

  const loadSavedSquad = squad => {
    if (!squad) return;
    setFormation(formationPositions[squad.formation] ? squad.formation : "4-3-3");
    setSelectedPlayers(Array.isArray(squad.selectedPlayers) ? squad.selectedPlayers : []);
    setBenchPlayers(Array.isArray(squad.benchPlayers) ? squad.benchPlayers : []);
    setCaptainId(squad.captainId || null);
    setViceCaptainId(squad.viceCaptainId || null);
    setShowSavedSquads(false);
    setBudgetError("");
  };

  const removeSavedSquad = id => setSavedSquads(current => current.filter(item => item.id !== id));
  const upcomingFixtures = (Array.isArray(fixtures?.upcoming) ? fixtures.upcoming : []).slice(0, 5);
  const captainCandidates = selectedPlayers.filter(Boolean).map(player => ({ player, points: getProjectedPoints(player) * (String(player.id) === String(captainId) ? 2 : 1) })).sort((a, b) => b.points - a.points).slice(0, 5);
  const selectedTeams = selectedPlayers.filter(Boolean).map(player => String(player.team || player.teamName || "Nezināma komanda"));
  const teamCounts = Object.entries(selectedTeams.reduce((counts, team) => ({ ...counts, [team]: (counts[team] || 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const positionCounts = [
    ["GK", "GOALKEEPERS", "bg-slate-300"], ["DEF", "DEFENDERS", "bg-sky-400"],
    ["MID", "MIDFIELDERS", "bg-violet-400"], ["FWD", "STRIKERS", "bg-rose-500"],
  ].map(([label, category, color]) => ({ label, color, count: selectedPlayers.filter(player => player?.category === category).length, total: slots.filter(slot => slot.category === category).length }));

  const fixtureDisplay = fixture => {
    const root = fixture?.teams ? fixture : fixture?.fixture?.teams ? fixture.fixture : fixture?.match?.teams ? fixture.match : fixture?.data?.teams ? fixture.data : fixture;
    const home = root?.teams?.home || root?.homeTeam || root?.home || root?.teams?.[0];
    const away = root?.teams?.away || root?.awayTeam || root?.away || root?.teams?.[1];
    const date = root?.fixture?.date || root?.utcDate || root?.date || fixture?.fixture?.date || "";
    return { home: home?.shortName || home?.tla || home?.name || "Mājinieki", away: away?.shortName || away?.tla || away?.name || "Viesi", date };
  };
  const shortDate = value => {
    if (!value) return "Datums nav pieejams";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString("lv-LV", { day: "2-digit", month: "short" });
  };

  return (
    <div className="min-w-0 space-y-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-900/80 bg-[#041a12] p-4">
        <div><p className="text-[9px] font-black uppercase tracking-[.22em] text-emerald-300">Flow · Fantasy Lab</p><h2 className="mt-1 text-xl font-black tracking-tight">Fantasy Team Builder</h2><p className="mt-1 text-xs text-slate-400">Veido sastāvu, pārbaudi gaidāmos mačus un salīdzini prognozes.</p></div>
        <div className="flex flex-wrap items-center gap-2">
          <input value={squadName} onChange={event => setSquadName(event.target.value)} placeholder="Sastāva nosaukums" aria-label="Sastāva nosaukums" className="w-36 rounded-lg border border-emerald-900 bg-[#03140f] px-3 py-2 text-xs text-white outline-none placeholder:text-emerald-100/40 focus:border-emerald-400 sm:w-44" />
          <button type="button" onClick={saveCurrentSquad} className="rounded-lg bg-emerald-500 px-4 py-2.5 text-xs font-black text-[#03140f] transition hover:bg-emerald-300">Saglabāt sastāvu</button>
          <button type="button" onClick={() => setShowSavedSquads(value => !value)} className="rounded-lg border border-emerald-800 bg-[#08271d] px-3 py-2.5 text-xs font-bold text-emerald-100 hover:border-emerald-400">Mani sastāvi ({savedSquads.length})</button>
        </div>
      </div>

      {showSavedSquads && <section className="rounded-2xl border border-emerald-900/80 bg-[#061d15] p-4"><div className="mb-3 flex items-center justify-between"><h3 className="font-black">Saglabātie sastāvi</h3><button type="button" onClick={() => setShowSavedSquads(false)} className="rounded-lg border border-emerald-900 px-3 py-1.5 text-xs text-slate-300">Aizvērt</button></div>{savedSquads.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{savedSquads.map(squad => <div key={squad.id} className="flex items-center gap-2 rounded-xl border border-emerald-950 bg-[#03140f] p-3"><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold">{squad.name}</p><p className="mt-1 text-[10px] text-slate-400">{squad.formation} · {squad.selectedPlayers?.filter(Boolean).length || 0}/11 · {squad.benchPlayers?.length || 0}/4 rezervē</p></div><button type="button" onClick={() => loadSavedSquad(squad)} className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black text-[#03140f]">Atvērt</button><button type="button" onClick={() => removeSavedSquad(squad.id)} aria-label={`Dzēst ${squad.name}`} className="rounded-lg border border-rose-900 px-2.5 py-2 text-xs text-rose-300">×</button></div>)}</div> : <p className="text-sm text-slate-400">Vēl nav saglabātu sastāvu.</p>}</section>}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Budžets atlikumā</p><p className={`mt-1 text-2xl font-black ${remainingBudget < 0 ? "text-rose-300" : "text-white"}`}>{budgetCurrency}{remainingBudget.toFixed(1)}m</p><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#102f25]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${Math.max(0, Math.min(100, squadBudget / budget * 100))}%` }} /></div><p className="mt-1 text-[9px] text-slate-500">Vērtība {budgetCurrency}{squadBudget.toFixed(1)}m / {budgetCurrency}{budget.toFixed(1)}m</p></div>
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sastāvs</p><p className="mt-1 text-2xl font-black text-white">{filledCount + benchPlayers.length}/15</p><p className="mt-1 text-[9px] text-slate-400">{filledCount}/11 sākumsastāvā · {benchPlayers.length}/4 rezervē</p></div>
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Prognoze GW</p><p className="mt-1 text-2xl font-black text-emerald-300">{projectedPoints.toFixed(1)} pts</p><p className="mt-1 text-[9px] text-slate-400">Ar kapteiņa dubultajiem punktiem</p></div>
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Kapteinis</p><p className="mt-1 truncate text-lg font-black text-white">{captain?.name || "Nav izvēlēts"}</p><p className="mt-1 text-[9px] text-emerald-300">{captain ? `${getProjectedPoints(captain).toFixed(1)} → ${(getProjectedPoints(captain) * 2).toFixed(1)} pts` : "Izvēlies spēlētāju laukumā"}</p></div>
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Vicekapteinis</p><p className="mt-1 truncate text-lg font-black text-white">{viceCaptain?.name || "Nav izvēlēts"}</p><p className="mt-1 text-[9px] text-violet-300">Kapteiņa maiņai</p></div>
        <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] p-3"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sastāva statuss</p><p className={`mt-1 text-lg font-black ${isComplete ? "text-emerald-300" : "text-amber-300"}`}>{isComplete ? "Derīgs" : "Jāpapildina"}</p><p className="mt-1 truncate text-[9px] text-slate-400">{teamValidation.reasons[0] || "Budžets un sastāvs pārbaudīts"}</p></div>
      </div>

      {budgetError && <div role="alert" className="flex items-start justify-between gap-3 rounded-xl border border-rose-900/80 bg-rose-950/35 px-4 py-3 text-xs font-semibold text-rose-200"><span>{budgetError}</span><button type="button" onClick={() => setBudgetError("")} className="text-rose-100" aria-label="Aizvērt paziņojumu">×</button></div>}
      <div className="grid items-start gap-4 2xl:grid-cols-[minmax(270px,0.95fr)_minmax(430px,1.35fr)_minmax(280px,0.9fr)] xl:grid-cols-[minmax(250px,0.85fr)_minmax(400px,1.3fr)]">
        <section className="min-w-0 overflow-hidden rounded-2xl border border-emerald-900/80 bg-[#041a12]">
          <div className="flex border-b border-emerald-950"><button type="button" onClick={() => setBuilderTab("players")} className={`flex-1 px-3 py-3 text-xs font-black ${builderTab === "players" ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400 hover:text-white"}`}>Spēlētāji</button><button type="button" onClick={() => setBuilderTab("myteam")} className={`flex-1 px-3 py-3 text-xs font-black ${builderTab === "myteam" ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400 hover:text-white"}`}>Mana komanda</button><button type="button" onClick={() => setBuilderTab("suggestions")} className={`flex-1 px-3 py-3 text-xs font-black ${builderTab === "suggestions" ? "border-b-2 border-emerald-400 text-emerald-300" : "text-slate-400 hover:text-white"}`}>Ieteikumi</button></div>
          {builderTab === "players" && <><div className="space-y-3 border-b border-emerald-950 p-3"><input type="search" value={playerSearch} onChange={event => setPlayerSearch(event.target.value)} placeholder="Meklēt spēlētāju vai komandu…" className="w-full rounded-lg border border-emerald-900 bg-[#03140f] px-3 py-2.5 text-xs text-white outline-none placeholder:text-slate-500 focus:border-emerald-400"/><div className="grid grid-cols-5 gap-1">{[["ALL","Visi"],["GOALKEEPERS","GK"],["DEFENDERS","DEF"],["MIDFIELDERS","MID"],["STRIKERS","FWD"]].map(([value,label]) => <button key={value} type="button" onClick={() => setPositionFilter(value)} className={`rounded-md border px-1 py-2 text-[9px] font-black ${positionFilter === value ? "border-emerald-400 bg-emerald-500 text-[#03140f]" : "border-emerald-950 bg-[#03140f] text-slate-400 hover:border-emerald-700"}`}>{label}</button>)}</div><label className="flex items-center justify-between gap-2 text-[10px] text-slate-400"><span>Kārtot pēc</span><select value={playerSort} onChange={event => setPlayerSort(event.target.value)} className="rounded-md border border-emerald-900 bg-[#03140f] px-2 py-1.5 text-[10px] font-bold text-white"><option value="projection">Prognozētie punkti</option><option value="form">Forma / diferenciālis</option><option value="priceLow">Cena: zemākā</option><option value="priceHigh">Cena: augstākā</option></select></label></div><div className="max-h-[680px] overflow-y-auto">{filteredPlayers.length ? filteredPlayers.map(player => <div key={player.id} className="flex items-center gap-2 border-b border-emerald-950/80 px-3 py-2.5 transition hover:bg-emerald-950/35"><div className="h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-[#103629]">{player.photo ? <img src={player.photo} alt="" className="h-full w-full object-cover" loading="lazy"/> : <div className="flex h-full items-center justify-center text-[9px] font-black text-emerald-200">{String(player.name || "PL").split(" ").slice(0,2).map(part => part[0]).join("")}</div>}</div><div className="min-w-0 flex-1"><p className="truncate text-[11px] font-black text-white">{player.name}</p><p className="truncate text-[9px] text-slate-400">{player.team || player.teamName || "Komanda nav norādīta"} · {positionLabels[player.category] || "PL"}</p><div className="mt-1 flex flex-wrap items-center gap-1"><span className="rounded bg-emerald-950 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">Forma {getDifferentialScore(player, fantasyPlayers).toFixed(1)}</span><span className="text-[9px] text-slate-500">{toFiniteNumber(player.minutes)} min</span></div></div><div className="text-right"><p className="text-xs font-black text-white">{budgetCurrency}{getBudgetPrice(player).toFixed(1)}m</p><p className="mt-1 text-[10px] font-black text-emerald-300">{getProjectedPoints(player).toFixed(1)} pts</p><button type="button" onClick={() => addPlayerFromList(player)} title={`Pievienot ${player.name}`} className="mt-1 flex h-6 w-7 items-center justify-center rounded-md bg-emerald-500 text-base font-black text-[#03140f] hover:bg-emerald-300">+</button></div></div>) : <div className="p-8 text-center text-xs text-slate-400">Nav spēlētāju, kas atbilst filtriem.</div>}</div></>}
          {builderTab === "myteam" && <div className="space-y-2 p-3"><p className="text-xs text-slate-400">{filledCount} sākumsastāvā · {benchPlayers.length} rezervē</p>{selectedPlayers.filter(Boolean).map(player => <div key={player.id} className="flex items-center gap-2 rounded-lg bg-[#03140f] p-2"><span className="min-w-0 flex-1 truncate text-xs font-bold">{player.name}</span><span className="text-[10px] text-emerald-300">{getProjectedPoints(player).toFixed(1)} pts</span></div>)}{!filledCount && <p className="py-5 text-center text-xs text-slate-500">Pievieno spēlētājus no saraksta.</p>}</div>}
          {builderTab === "suggestions" && <div className="space-y-3 p-3"><p className="text-xs font-bold text-emerald-200">Ieteiktie spēlētāji</p>{differentialPlayers.map(player => <div key={player.id} className="flex items-center gap-2 rounded-lg border border-emerald-950 bg-[#03140f] p-2"><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{player.name}</p><p className="truncate text-[9px] text-slate-500">{player.team} · {budgetCurrency}{getBudgetPrice(player).toFixed(1)}m</p></div><span className="text-xs font-black text-emerald-300">{getProjectedPoints(player).toFixed(1)}</span><button type="button" onClick={() => addPlayerFromList(player)} className="rounded bg-emerald-500 px-2 py-1 text-xs font-black text-[#03140f]">+</button></div>)}<button type="button" onClick={buildBestXI} className="w-full rounded-lg bg-emerald-500 px-3 py-2.5 text-xs font-black text-[#03140f]">⚡ Izveidot ieteikto XI</button></div>}
        </section>

        <section className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-emerald-300">Tavs sastāvs</p><h3 className="mt-1 text-base font-black">Laukums · {formation}</h3></div><div className="flex flex-wrap gap-2"><label className="sr-only" htmlFor="fantasy-formation">Formācija</label><select id="fantasy-formation" value={formation} onChange={event => setFormation(event.target.value)} className="rounded-lg border border-emerald-900 bg-[#03140f] px-2 py-2 text-xs font-bold text-white">{formationNames.map(value => <option key={value} value={value}>{value}</option>)}</select><button type="button" onClick={buildBestFormation} className="rounded-lg border border-emerald-800 px-3 py-2 text-[10px] font-black text-emerald-300 hover:bg-emerald-950">Labākā formācija</button><button type="button" onClick={clearTeam} className="rounded-lg border border-rose-900 px-3 py-2 text-[10px] font-black text-rose-300 hover:bg-rose-950/40">Notīrīt</button></div></div><FantasyPitch formation={formation} slots={slots} selectedPlayers={selectedPlayers} captainId={captainId} viceCaptainId={viceCaptainId} onOpen={(index, category) => setPicker({ type: "starter", index, category })} onRemove={removeStarter} onCaptain={chooseCaptain} onViceCaptain={chooseViceCaptain} fixtures={fixtures} standings={standings}/><p className="mt-3 text-center text-[10px] text-slate-500">Spied uz spēlētāju, lai mainītu viņu · C = kapteinis · V = vicekapteinis</p></div>
          <div className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3 sm:p-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-black">Rezervistu soliņš <span className="text-emerald-300">({benchPlayers.length}/4)</span></h3><p className="mt-1 text-[10px] text-slate-500">Pārvieto rezervistus, lai noteiktu maiņu secību.</p></div><button type="button" onClick={autoBench} className="rounded-lg bg-emerald-500 px-3 py-2 text-[10px] font-black text-[#03140f]">⚡ Auto bench</button></div><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{benchPlayers.map((player, index) => <div key={player.id} className="min-w-0 rounded-xl border border-emerald-950 bg-[#03140f] p-2"><div className="flex items-center gap-2">{player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-lg object-cover" loading="lazy"/> : <div className="h-8 w-8 rounded-lg bg-[#103629]"/>}<div className="min-w-0"><p className="truncate text-[10px] font-black">{player.name}</p><p className="text-[9px] text-slate-500">{positionLabels[player.category] || "PL"}</p></div></div><p className="mt-2 text-[10px] font-bold text-emerald-300">{getProjectedPoints(player).toFixed(1)} pts</p><p className="text-[9px] text-slate-500">{budgetCurrency}{getBudgetPrice(player).toFixed(1)}m</p><div className="mt-2 flex gap-1"><button type="button" disabled={index <= 1 || player.category === "GOALKEEPERS"} onClick={() => moveBenchPlayer(player.id, -1)} className="flex-1 rounded bg-[#08271d] py-1 text-[10px] disabled:opacity-30">↑</button><button type="button" disabled={index === benchPlayers.length - 1 || player.category === "GOALKEEPERS"} onClick={() => moveBenchPlayer(player.id, 1)} className="flex-1 rounded bg-[#08271d] py-1 text-[10px] disabled:opacity-30">↓</button><button type="button" onClick={() => removeBench(player.id)} className="rounded bg-rose-950/60 px-2 py-1 text-[10px] text-rose-300">×</button></div></div>)}{benchPlayers.length < FANTASY_BENCH_SIZE && <button type="button" onClick={() => setPicker({ type: "bench", index: benchPlayers.length, category: "ALL" })} className="flex min-h-24 flex-col items-center justify-center rounded-xl border border-dashed border-emerald-800 text-emerald-300 hover:bg-emerald-950/40"><span className="text-2xl">+</span><span className="text-[9px] font-black">Pievienot rezervistu</span></button>}</div></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3"><div className="flex items-center justify-between"><h3 className="text-xs font-black">Komandas stiprums</h3><span className="text-[9px] text-emerald-300">FLOW</span></div><div className="mt-3 space-y-2">{positionCounts.map(item => <div key={item.label}><div className="mb-1 flex justify-between text-[9px]"><span className="text-slate-400">{item.label}</span><span className="font-bold">{item.count}/{item.total}</span></div><div className="h-1.5 rounded-full bg-[#102f25]"><div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.total ? Math.min(100, item.count / item.total * 100) : 0}%` }}/></div></div>)}</div></div><div className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3"><h3 className="text-xs font-black">Klubu sadalījums</h3>{teamCounts.length ? <div className="mt-3 space-y-2">{teamCounts.map(([team,count]) => <div key={team} className="flex items-center justify-between gap-2 text-[10px]"><span className="truncate text-slate-400">{team}</span><span className={`font-black ${count > 3 ? "text-rose-300" : "text-emerald-300"}`}>{count} spēl.</span></div>)}</div> : <p className="mt-3 text-[10px] text-slate-500">Pievieno spēlētājus, lai redzētu sadalījumu.</p>}</div></div>
        </section>

        <aside className="min-w-0 space-y-3 xl:col-span-2 2xl:col-span-1">
          <section className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3"><div className="mb-3 flex items-center justify-between gap-2"><div><h3 className="text-sm font-black">Nākamās spēles</h3><p className="mt-1 text-[10px] text-slate-500">{fixtureLoading ? "Ielādē spēles…" : `${upcomingFixtures.length} pieejamas spēles`}</p></div><span className="rounded-lg bg-[#103629] px-2 py-1 text-[9px] font-black text-emerald-300">GW</span></div>{upcomingFixtures.length ? <div className="space-y-1">{upcomingFixtures.map((fixture,index) => { const match = fixtureDisplay(fixture); return <div key={`${match.date}-${match.home}-${match.away}-${index}`} className="grid grid-cols-[52px_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-emerald-950/80 bg-[#03140f] p-2"><span className="text-[9px] text-slate-500">{shortDate(match.date)}</span><div className="min-w-0 text-center"><p className="truncate text-[10px] font-black">{match.home}</p><p className="my-0.5 text-[8px] text-emerald-300/70">VS</p><p className="truncate text-[10px] font-black">{match.away}</p></div><span className="rounded bg-[#103629] px-2 py-1 text-[8px] font-black text-emerald-300">—</span></div>})}</div> : <div className="rounded-lg bg-[#03140f] p-6 text-center"><p className="text-xs font-bold text-slate-300">Spēles nav pieejamas</p><p className="mt-1 text-[10px] text-slate-500">Fixture dati tiks parādīti, kad API tos atgriezīs.</p></div>}</section>
          <section className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3"><div className="mb-3 flex items-center justify-between"><div><h3 className="text-sm font-black">Kapteiņa simulators</h3><p className="mt-1 text-[10px] text-slate-500">Prognoze, nevis garantēts rezultāts</p></div><span className="text-[9px] font-black text-emerald-300">TOP {captainCandidates.length}</span></div>{captainCandidates.length ? <div className="space-y-1">{captainCandidates.map(({player,points},index) => <div key={player.id} className="flex items-center gap-2 rounded-lg border border-emerald-950/80 bg-[#03140f] p-2"><span className="w-4 text-[10px] font-black text-slate-500">{index+1}</span>{player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-lg object-cover" loading="lazy"/> : <div className="h-8 w-8 rounded-lg bg-[#103629]"/>}<div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black">{player.name}</p><p className="truncate text-[9px] text-slate-500">{player.team || player.teamName || ""}</p></div><div className="text-right"><p className="text-xs font-black text-emerald-300">{points.toFixed(1)}</p><p className="text-[8px] text-slate-500">pts</p></div><button type="button" onClick={() => { const index = selectedPlayers.findIndex(item => String(item?.id) === String(player.id)); if (index >= 0) chooseCaptain(index); }} className={`rounded-md px-2 py-1 text-[9px] font-black ${String(player.id) === String(captainId) ? "bg-amber-400 text-[#03140f]" : "border border-emerald-900 text-slate-300 hover:border-emerald-400"}`}>{String(player.id) === String(captainId) ? "C" : "Izvēlēties"}</button></div>)}</div> : <p className="rounded-lg bg-[#03140f] p-5 text-center text-xs text-slate-500">Pievieno spēlētājus, lai salīdzinātu kapteiņus.</p>}</section>
          <section className="rounded-2xl border border-emerald-900/80 bg-[#041a12] p-3"><h3 className="text-sm font-black">Sastāva analītika</h3><div className="mt-3 grid grid-cols-3 gap-2"><div className="rounded-lg bg-[#03140f] p-2"><p className="text-[8px] text-slate-500">Vid. forma</p><p className="mt-1 text-base font-black text-emerald-300">{selectedPlayers.filter(Boolean).length ? (selectedPlayers.filter(Boolean).reduce((sum,player) => sum + getDifferentialScore(player,fantasyPlayers),0)/selectedPlayers.filter(Boolean).length).toFixed(1) : "—"}</p></div><div className="rounded-lg bg-[#03140f] p-2"><p className="text-[8px] text-slate-500">Vērtība</p><p className="mt-1 text-base font-black text-white">{budgetCurrency}{squadBudget.toFixed(1)}m</p></div><div className="rounded-lg bg-[#03140f] p-2"><p className="text-[8px] text-slate-500">GW prognoze</p><p className="mt-1 text-base font-black text-emerald-300">{projectedPoints.toFixed(1)}</p></div></div><div className="mt-3"><div className="mb-1 flex justify-between text-[9px] text-slate-400"><span>Budžeta izmantojums</span><span>{Math.min(100,Math.round(squadBudget/budget*100))}%</span></div><div className="h-2 rounded-full bg-[#102f25]"><div className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-emerald-300" style={{width:`${Math.max(0,Math.min(100,squadBudget/budget*100))}%`}}/></div></div></section>
        </aside>
      </div>
      <div className="rounded-xl border border-emerald-900/80 bg-[#061d15] px-4 py-3 text-[10px] leading-5 text-slate-400">{useOfficialFplRules ? `Premier League FPL režīms: izmantotas oficiālās cenas un pozīcijas, ja tās pieejamas (${officialFplPriceCount} spēlētājiem).` : "Flow Fantasy režīms: cenas un GW punktu aplēses ir projekta novērtējums, nevis oficiāla FPL punktu sistēma."} Prognozes balstās pieejamajos spēlētāju datos; tukši vai nepieejami statistikas lauki netiek izdomāti.</div>
      {picker && <FantasyPlayerPicker category={picker.category} players={fantasyPlayers} selectedIds={allSquadIds} onSelect={choosePlayer} onClose={() => setPicker(null)} fixtures={fixtures} standings={standings}/>}
    </div>
  );
}


export default FantasyBuilder;