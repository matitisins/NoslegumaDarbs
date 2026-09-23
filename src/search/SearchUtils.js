/*
 * Satur palīgfunkcijas spēlētāju meklēšanai un identificēšanai.
 * Normalizē meklēšanas tekstu, izveido spēlētāju iniciāļus, filtrē spēlētājus
 * pēc vārda vai kluba un pārbauda, vai divi spēlētāji ir viens un tas pats.
 */

export const normalizeSearch = value =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const getInitials = name =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "PL";

export const searchPlayers = (
  players = [],
  query = ""
) => {
  const value = normalizeSearch(query);

  if (!value) return [];

  return players.filter(player => {
    const name = normalizeSearch(player?.name);
    const team = normalizeSearch(player?.team);

    return (
      name.includes(value) ||
      team.includes(value)
    );
  });
};

export const isSamePlayer = (first, second) =>
  Boolean(
    first &&
      second &&
      String(first.id) === String(second.id)
  );