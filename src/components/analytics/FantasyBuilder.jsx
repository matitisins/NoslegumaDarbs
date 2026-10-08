import React, { useEffect, useMemo, useState } from "react";
import { fetchLeagueFixtures, fetchLeagueStandings } from "../../services/leagueFeatures";
import {
  buildBudgetConstrainedXI,
  calculateSquadBudget,
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

function FantasyBuilder({ players, competition, season }) {
  const [formation, setFormation] = useState("4-3-3");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [benchPlayers, setBenchPlayers] = useState([]);
  const [captainId, setCaptainId] = useState(null);
  const [viceCaptainId, setViceCaptainId] = useState(null);
  const [picker, setPicker] = useState(null);
  const [budget, setBudget] = useState(100);
  const [budgetError, setBudgetError] = useState("");
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);
  const [fixtureLoading, setFixtureLoading] = useState(false);

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
    let cancelled = false;
    setFixtureLoading(true);

    Promise.all([
      fetchLeagueFixtures(competition, season).catch(() => ({ upcoming: [], recent: [] })),
      fetchLeagueStandings(competition, season).catch(() => []),
    ]).then(([fixtureData, table]) => {
      if (cancelled) return;
      setFixtures(fixtureData || { upcoming: [], recent: [] });
      setStandings(Array.isArray(table) ? table : []);
    }).finally(() => {
      if (!cancelled) setFixtureLoading(false);
    });

    return () => { cancelled = true; };
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
    return [...players]
      .filter(player => !allSquadIds.has(String(player.id)))
      .sort((a, b) => getDifferentialScore(b, players) - getDifferentialScore(a, players))
      .slice(0, 5);
  }, [players, allSquadIds]);

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
      const message = `Spēlētāju nevar pievienot. Sastāva vērtība būtu €${nextBudget.toFixed(1)}m, bet budžets ir €${budget.toFixed(1)}m.`;
      setBudgetError(message);
      window.setTimeout(() => {
        setBudgetError(current => current === message ? "" : current);
      }, 4500);
      return;
    }

    setSelectedPlayers(nextStarting);
    setBenchPlayers(nextBench.slice(0, FANTASY_BENCH_SIZE));
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
      players,
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
          players,
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
      .sort((a, b) => b.flowPoints - a.flowPoints)[0];

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
        players.filter(
          player =>
            player.category === category &&
            !used.has(String(player.id))
        )
      );

      for (const player of candidates) {
        if (next.length >= 5) break;
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

      if (next.length >= 5) break;
    }

    setBenchPlayers(next);
    if (next.length < 5) {
      setBudgetError(`Budžeta ietvaros automātiski izdevās pievienot ${next.length}/5 rezervistus.`);
    } else {
      setBudgetError("");
    }
  };

  const remainingBudget = budget - squadBudget;
  const captain = selectedPlayers.find(player => String(player?.id) === String(captainId));
  const viceCaptain = selectedPlayers.find(player => String(player?.id) === String(viceCaptainId));

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <label className="rounded-xl border border-slate-200 bg-white p-3">
          <span className="block text-[9px] font-black uppercase tracking-wider text-slate-400">Formācija</span>
          <select value={formation} onChange={event => setFormation(event.target.value)} className="mt-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold outline-none focus:border-emerald-400">
            {formationNames.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={buildBestXI} className="rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800">⚡ Ieteiktais XI</button>
          <button type="button" onClick={buildBestFormation} className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-700 hover:bg-emerald-100">🏆 Labākā formācija</button>
          <button type="button" onClick={clearTeam} className="rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Notīrīt XI</button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Spēlētāji</p><p className="mt-1 text-2xl font-black text-slate-900">{filledCount}/11</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Heuristiska GW aplēse</p><p className="mt-1 text-2xl font-black text-emerald-600">{expectedPoints.toFixed(1)}</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Ar kapteini</p><p className="mt-1 text-2xl font-black text-slate-900">{projectedPoints.toFixed(1)}</p></div>
        <div className={`rounded-2xl border p-4 ${remainingBudget < 0 ? "border-rose-200 bg-rose-50" : "border-slate-200 bg-white"}`}><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Budžets</p><p className={`mt-1 text-2xl font-black ${remainingBudget < 0 ? "text-rose-600" : "text-slate-900"}`}>{remainingBudget.toFixed(1)}m</p></div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4"><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Kapteinis</p><p className="mt-1 truncate text-sm font-black text-slate-900">{captain?.name || "Nav"}</p></div>
      </div>

      <div className="mb-5 grid gap-3 lg:grid-cols-3">
        <label className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Komandas budžets</span>
            <span className="text-xs font-black text-slate-900">{budget.toFixed(1)}m</span>
          </div>
          <input type="range" min="60" max="150" step="0.5" value={budget} onChange={event => {
            const nextBudget = Number(event.target.value);
            setBudget(nextBudget);
            if (squadBudget > nextBudget) {
              setBudgetError(`Pašreizējais sastāvs maksā €${squadBudget.toFixed(1)}m un pārsniedz jauno budžetu €${nextBudget.toFixed(1)}m.`);
            } else {
              setBudgetError("");
            }
          }} className="mt-3 w-full accent-emerald-500" />
          <p className="mt-1 text-[8px] text-slate-400">Izmantota Flow Value kā projekta Fantasy cena. Budžets ir stingrs ierobežojums. Pilnā komandā: 15 spēlētāji, 11 sākumsastāvā, 4 rezervē un ne vairāk kā 3 no vienas komandas.</p>
        </label>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Sastāva vērtība</p>
          <p className="mt-1 text-2xl font-black text-slate-900">{squadBudget.toFixed(1)}m</p>
          <p className="mt-1 text-[8px] font-bold text-slate-400">Start XI + 4 rezervisti</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Nākamā GW</p>
          <p className="mt-1 text-sm font-black text-slate-900">{fixtureLoading ? "Ielādē..." : `${fixtures.upcoming?.length || 0} spēles atrastas`}</p>
          <p className="mt-1 text-[8px] font-bold text-slate-400">Mājas/izbraukuma un grūtības dati</p>
        </div>
      </div>

      <div className={`mb-5 rounded-2xl border p-4 ${isComplete ? "border-emerald-100 bg-emerald-50" : "border-amber-100 bg-amber-50"}`}>
        <p className={`text-xs font-bold ${isComplete ? "text-emerald-700" : "text-amber-700"}`}>
          {isComplete
            ? "Sākumsastāvs ir gatavs un atbilst budžeta, kapteiņa un vicekapteiņa nosacījumiem."
            : teamValidation.reasons[0] || `Izvēlies vēl ${Math.max(0, 11 - filledCount)} spēlētājus.`}
        </p>
        <p className={`mt-1 text-xs leading-5 ${isComplete ? "text-emerald-700/80" : "text-amber-700/80"}`}>Prognoze izmanto spēlētāja formas/Flow punktu vidējo rādītāju. Kapteiņa prognoze tiek dubultota.</p>
      </div>

      <div className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div><h3 className="text-lg font-black text-slate-900">{formation} · Fantasy XI</h3><p className="mt-1 text-xs text-slate-400">Spied uz +, lai izvēlētos spēlētāju. Spied uz −, lai viņu noņemtu.</p></div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">{filledCount}/11 aizpildīti</span>
        </div>

        <FantasyPitch
          formation={formation}
          slots={slots}
          selectedPlayers={selectedPlayers}
          captainId={captainId}
          viceCaptainId={viceCaptainId}
          onOpen={(index, category) => setPicker({ type: "starter", index, category })}
          onRemove={removeStarter}
          onCaptain={chooseCaptain}
          onViceCaptain={chooseViceCaptain}
          fixtures={fixtures}
          standings={standings}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">Rezerves</p><p className="mt-1 text-xs font-bold text-slate-500">Līdz {FANTASY_BENCH_SIZE} spēlētājiem</p></div><button type="button" onClick={autoBench} className="rounded-lg bg-slate-900 px-3 py-2 text-[9px] font-black uppercase tracking-wider text-white">⚡ Auto bench</button></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {benchPlayers.map(player => (
              <div key={player.id} className="flex items-center gap-2 rounded-xl bg-slate-50 p-2">
                {player.photo ? <img src={player.photo} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-white" />}
                <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-black text-slate-900">{player.name}</p><p className="text-[8px] font-bold text-slate-400">{player.team} · {getProjectedPoints(player).toFixed(1)} GW · €{getBudgetPrice(player).toFixed(1)}m</p></div>
                <button type="button" onClick={() => removeBench(player.id)} className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-black text-white hover:bg-rose-500">−</button>
              </div>
            ))}
          </div>
          {benchPlayers.length < FANTASY_BENCH_SIZE && <button type="button" onClick={() => setPicker({ type: "bench", index: benchPlayers.length, category: "ALL" })} className="mt-3 w-full rounded-xl border border-dashed border-slate-300 py-3 text-[9px] font-black uppercase tracking-wider text-slate-500 hover:border-emerald-300 hover:text-emerald-600">+ Pievienot rezervistu</button>}
        </div>

        <TeamStrengthCard players={selectedPlayers.filter(Boolean)} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <FormationAnalysis players={players} />
        <FixtureSummary players={selectedPlayers.filter(Boolean)} fixtures={fixtures} standings={standings} />
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-wider text-slate-400">🔥 Diferenciālie spēlētāji</p><p className="mt-1 text-xs font-bold text-slate-500">Spēlētāji ar labu prognozi, kurus vēl neesi izvēlējies</p></div><span className="rounded-full bg-violet-50 px-2 py-1 text-[8px] font-black text-violet-700">FLOW</span></div>
        <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-5">
          {differentialPlayers.map(player => (
            <FantasyPlayerList key={player.id} title={player.name} players={[player]} onAdd={candidate => {
              const index = slots.findIndex(slot => !selectedPlayers.find((item, slotIndex) => slotIndex === slots.indexOf(slot) && item));
              if (index >= 0 && candidate.category === slots[index].category) {
                const next = [...selectedPlayers];
                next[index] = candidate;
                const nextBudget = calculateSquadBudget([...next, ...benchPlayers], getBudgetPrice);
                const constraintReasons = getFantasySquadConstraintViolations({
                  startingPlayers: next,
                  benchPlayers,
                  requireCompleteSquad: false,
                });
                if (constraintReasons.length) {
                  setBudgetError(constraintReasons[0]);
                  return;
                }
                if (nextBudget > budget + 0.0001) {
                  setBudgetError(`Spēlētāju nevar pievienot. Sastāva vērtība būtu €${nextBudget.toFixed(1)}m, bet budžets ir €${budget.toFixed(1)}m.`);
                  return;
                }
                setSelectedPlayers(next);
                setBudgetError("");
              }
            }} />
          ))}
        </div>
      </div>

      {isComplete && (
        <div className="mt-4 rounded-[24px] border border-emerald-200 bg-emerald-50 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-600">Gameweek heuristiskā aplēse</p><h3 className="mt-1 text-2xl font-black text-slate-900">{projectedPoints.toFixed(1)} punkti</h3><p className="mt-1 text-xs text-slate-500">Start XI heuristiskā aplēse + kapteiņa dubultais ieguldījums.</p></div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Kapteinis</p><p className="mt-1 text-sm font-black text-slate-900">{captain?.name || "Nav izvēlēts"}</p></div>
              <div className="rounded-xl bg-white px-4 py-3 text-right shadow-sm"><p className="text-[8px] font-black uppercase tracking-wider text-slate-400">Vice</p><p className="mt-1 text-sm font-black text-slate-900">{viceCaptain?.name || "Nav izvēlēts"}</p></div>
            </div>
          </div>
        </div>
      )}

      {picker && (
        <FantasyPlayerPicker
          category={picker.category}
          players={players}
          selectedIds={allSquadIds}
          onSelect={choosePlayer}
          onClose={() => setPicker(null)}
          fixtures={fixtures}
          standings={standings}
        />
      )}
    </div>
  );
}


export default FantasyBuilder;