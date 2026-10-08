/*
 * Tīra Fantasy Team Builder loģika bez React atkarībām.
 * Fantasy constraints are kept here as the single source of truth.
 */

export const FANTASY_SQUAD_SIZE = 15;
export const FANTASY_STARTING_SIZE = 11;
export const FANTASY_BENCH_SIZE = 4;
export const MAX_PLAYERS_PER_CLUB = 3;

export const FANTASY_SQUAD_LIMITS = {
  GOALKEEPERS: 2,
  DEFENDERS: 5,
  MIDFIELDERS: 5,
  STRIKERS: 3,
};

const normalizeCategory = category => {
  const value = String(category || "").toUpperCase();
  if (["GK", "GOALKEEPER", "GOALKEEPERS"].includes(value)) return "GOALKEEPERS";
  if (["DEF", "DEFENDER", "DEFENDERS"].includes(value)) return "DEFENDERS";
  if (["MID", "MIDFIELDER", "MIDFIELDERS"].includes(value)) return "MIDFIELDERS";
  if (["FWD", "FW", "FORWARD", "FORWARDS", "STRIKER", "STRIKERS"].includes(value)) return "STRIKERS";
  return value;
};

const getClubKey = player => {
  const value =
    player?.teamId ??
    player?.team_id ??
    player?.clubId ??
    player?.club_id ??
    player?.team ??
    player?.club ??
    "";
  return String(value).trim().toLowerCase();
};

const countCategories = players => {
  const counts = { GOALKEEPERS: 0, DEFENDERS: 0, MIDFIELDERS: 0, STRIKERS: 0 };
  for (const player of players) {
    const category = normalizeCategory(player?.category);
    if (Object.prototype.hasOwnProperty.call(counts, category)) counts[category] += 1;
  }
  return counts;
};

export const getFantasySquadConstraintViolations = ({
  startingPlayers = [],
  benchPlayers = [],
  requireCompleteSquad = false,
} = {}) => {
  const starters = Array.isArray(startingPlayers) ? startingPlayers.filter(Boolean) : [];
  const bench = Array.isArray(benchPlayers) ? benchPlayers.filter(Boolean) : [];
  const squad = [...starters, ...bench];
  const reasons = [];

  const ids = squad.map(player => player?.id).filter(id => id !== undefined && id !== null).map(String);
  if (new Set(ids).size !== ids.length) reasons.push("Spēlētājs nevar būt izvēlēts vairāk nekā vienu reizi.");

  if (starters.length > FANTASY_STARTING_SIZE) reasons.push(`Sākumsastāvā nevar būt vairāk par ${FANTASY_STARTING_SIZE} spēlētājiem.`);
  if (bench.length > FANTASY_BENCH_SIZE) reasons.push(`Rezervē nevar būt vairāk par ${FANTASY_BENCH_SIZE} spēlētājiem.`);
  if (squad.length > FANTASY_SQUAD_SIZE) reasons.push(`Sastāvā nevar būt vairāk par ${FANTASY_SQUAD_SIZE} spēlētājiem.`);

  const clubs = new Map();
  for (const player of squad) {
    const club = getClubKey(player);
    if (!club) continue;
    clubs.set(club, (clubs.get(club) || 0) + 1);
    if (clubs.get(club) > MAX_PLAYERS_PER_CLUB) {
      reasons.push(`No vienas komandas drīkst būt ne vairāk kā ${MAX_PLAYERS_PER_CLUB} spēlētāji.`);
      break;
    }
  }

  const squadCounts = countCategories(squad);
  for (const [category, maximum] of Object.entries(FANTASY_SQUAD_LIMITS)) {
    if (squadCounts[category] > maximum) reasons.push(`Sastāvā drīkst būt ne vairāk kā ${maximum} ${category.toLowerCase()}.`);
  }

  const startingCounts = countCategories(starters);
  if (starters.length === FANTASY_STARTING_SIZE) {
    if (startingCounts.GOALKEEPERS !== 1) reasons.push("Sākumsastāvā jābūt tieši 1 vārtsargam.");
    if (startingCounts.DEFENDERS < 3 || startingCounts.DEFENDERS > 5) reasons.push("Sākumsastāvā jābūt 3–5 aizsargiem.");
    if (startingCounts.MIDFIELDERS < 2 || startingCounts.MIDFIELDERS > 5) reasons.push("Sākumsastāvā jābūt 2–5 pussargiem.");
    if (startingCounts.STRIKERS < 1 || startingCounts.STRIKERS > 3) reasons.push("Sākumsastāvā jābūt 1–3 uzbrucējiem.");
  }

  if (requireCompleteSquad) {
    if (starters.length !== FANTASY_STARTING_SIZE) reasons.push(`Sākumsastāvā jābūt tieši ${FANTASY_STARTING_SIZE} spēlētājiem.`);
    if (bench.length !== FANTASY_BENCH_SIZE) reasons.push(`Rezervē jābūt tieši ${FANTASY_BENCH_SIZE} spēlētājiem.`);
    if (squad.length === FANTASY_SQUAD_SIZE) {
      for (const [category, required] of Object.entries(FANTASY_SQUAD_LIMITS)) {
        if (squadCounts[category] !== required) reasons.push(`Pilnā sastāvā jābūt ${required} ${category.toLowerCase()}.`);
      }
    }
  }

  return [...new Set(reasons)];
};

export const calculateSquadBudget = (players, getPrice) =>
  (Array.isArray(players) ? players : [])
    .filter(Boolean)
    .reduce((sum, player) => sum + Number(getPrice(player) || 0), 0);

export const isFantasyTeamValid = ({
  startingPlayers,
  benchPlayers = [],
  budget,
  captainId,
  viceCaptainId,
  getPrice,
  requiredStartingPlayers = FANTASY_STARTING_SIZE,
}) => {
  const starters = (Array.isArray(startingPlayers) ? startingPlayers : []).filter(Boolean);
  const bench = (Array.isArray(benchPlayers) ? benchPlayers : []).filter(Boolean);
  const totalBudget = calculateSquadBudget([...starters, ...bench], getPrice);
  const captain = starters.find(player => String(player?.id) === String(captainId));
  const viceCaptain = starters.find(player => String(player?.id) === String(viceCaptainId));

  const reasons = [
    ...(starters.length !== requiredStartingPlayers ? [`Jābūt ${requiredStartingPlayers} sākumsastāva spēlētājiem.`] : []),
    ...(bench.length !== FANTASY_BENCH_SIZE ? [`Jābūt ${FANTASY_BENCH_SIZE} rezervistiem.`] : []),
    ...(totalBudget > Number(budget) + 0.0001 ? ["Sastāva vērtība pārsniedz budžetu."] : []),
    ...getFantasySquadConstraintViolations({ startingPlayers: starters, benchPlayers: bench, requireCompleteSquad: true }),
    ...(!captain ? ["Nav izvēlēts kapteinis."] : []),
    ...(!viceCaptain ? ["Nav izvēlēts vicekapteinis."] : []),
    ...(captain && viceCaptain && String(captain.id) === String(viceCaptain.id)
      ? ["Kapteinis un vicekapteinis nevar būt viens spēlētājs."]
      : []),
  ];

  return {
    valid: reasons.length === 0,
    totalBudget,
    captain,
    viceCaptain,
    reasons: [...new Set(reasons)],
  };
};

export const buildBudgetConstrainedXI = ({
  players,
  slots,
  budget,
  getPrice,
  getProjection,
}) => {
  const source = Array.isArray(players) ? players.filter(Boolean) : [];
  const requiredSlots = Array.isArray(slots) ? slots : [];
  if (!requiredSlots.length) return null;

  const candidatesBySlot = requiredSlots.map(slot =>
    source
      .filter(player => player?.category === slot.category)
      .sort((a, b) => Number(getProjection(b) || 0) - Number(getProjection(a) || 0))
      .slice(0, 30)
  );
  if (candidatesBySlot.some(candidates => !candidates.length)) return null;

  const slotOrder = requiredSlots
    .map((slot, index) => ({ index, candidates: candidatesBySlot[index] }))
    .sort((a, b) => a.candidates.length - b.candidates.length);

  let best = null;
  let bestProjection = -Infinity;

  const search = (depth, selected, ids, clubs, totalBudget, totalProjection) => {
    if (totalBudget > Number(budget) + 0.0001) return;
    if (depth === slotOrder.length) {
      if (totalProjection > bestProjection) {
        bestProjection = totalProjection;
        best = [...selected];
      }
      return;
    }

    const { index, candidates } = slotOrder[depth];
    for (const player of candidates) {
      const id = String(player?.id);
      if (ids.has(id)) continue;

      const club = getClubKey(player);
      const clubCount = club ? clubs.get(club) || 0 : 0;
      if (club && clubCount >= MAX_PLAYERS_PER_CLUB) continue;

      const nextBudget = totalBudget + Number(getPrice(player) || 0);
      if (nextBudget > Number(budget) + 0.0001) continue;

      selected[index] = player;
      ids.add(id);
      if (club) clubs.set(club, clubCount + 1);

      search(depth + 1, selected, ids, clubs, nextBudget,
        totalProjection + Number(getProjection(player) || 0));

      if (club) {
        if (clubCount) clubs.set(club, clubCount);
        else clubs.delete(club);
      }
      ids.delete(id);
      selected[index] = null;
    }
  };

  search(0, Array(requiredSlots.length).fill(null), new Set(), new Map(), 0, 0);
  return best;
};