import React, { useMemo } from "react";
import LeagueLogo from "../LeagueLogo";

const GREEN = "#39E58C";

const getName = player => player?.name || player?.playerName || player?.player?.name || "Nezināms spēlētājs";
const getTeam = player => typeof player?.team === "string" ? player.team : player?.team?.name || player?.teamName || player?.club || player?.statistics?.team?.name || "Klubs nav norādīts";
const getPhoto = player => player?.photo || player?.image || player?.playerPhoto || player?.photoUrl || player?.picture || player?.player?.photo || "";
const getId = player => player?.id ?? player?.playerId ?? player?.player_id ?? player?.player?.id;

const normalize = value => String(value ?? "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");

// A saved snapshot may have been incorrectly tagged with the league selected
// at the time it was saved. Prefer explicit competition metadata, then resolve
// well-known club names so older favourites are classified correctly too.
const TEAM_LEAGUES = {
  PL: ["arsenal", "astonvilla", "bournemouth", "brentford", "brighton", "brightonandhovealbion", "burnley", "chelsea", "crystalpalace", "everton", "fulham", "ipswich", "leicester", "liverpool", "manchestercity", "manchesterunited", "manutd", "newcastle", "newcastleunited", "nottinghamforest", "southampton", "tottenham", "tottenhamhotspur", "westham", "westhamunited", "wolves", "wolverhamptonwanderers", "sunderland", "leeds", "leedsunited"],
  PD: ["alaves", "athleticclub", "athleticbilbao", "atleticodemadrid", "atleticomadrid", "barcelona", "celta", "celtavigo", "elche", "espanyol", "getafe", "girona", "levante", "mallorca", "osasuna", "oviedo", "rayo", "rayovallecano", "realbetis", "betis", "realmadrid", "realsociedad", "sevilla", "valencia", "valladolid", "villarreal", "leganes", "laspalmas"],
  SA: ["atalanta", "bologna", "cagliari", "como", "cremonese", "fiorentina", "genoa", "hellasverona", "inter", "internazionale", "juventus", "lazio", "lecce", "milan", "acmilan", "monza", "napoli", "parma", "pisa", "roma", "torino", "udinese", "venezia", "sassuolo"],
  BL1: ["augsburg", "bayernmunich", "bayerleverkusen", "borussiadortmund", "borussiamonchengladbach", "eintrachtfrankfurt", "freiburg", "hamburg", "heidenheim", "hoffenheim", "koln", "mainz", "rbLeipzig", "rbleipzig", "schalke", "stpauli", "stuttgart", "unionberlin", "werderbremen", "wolfsburg"],
  FL1: ["angers", "auxerre", "brest", "lehavre", "lens", "lille", "lorient", "lyon", "marseille", "metz", "monaco", "montpellier", "nantes", "nice", "parisfc", "parissaintgermain", "psg", "reims", "rennes", "saintetienne", "strasbourg", "toulouse"]
};
const TEAM_TO_LEAGUE = Object.entries(TEAM_LEAGUES).reduce((all, [league, teams]) => {
  teams.forEach(team => { all[normalize(team)] = league; });
  return all;
}, {});

function getPlayerLeague(player) {
  // Explicit API competition metadata is authoritative. The old favoriteLeague
  // field is only a fallback because older versions stamped the currently
  // selected league onto every saved player.
  const explicit = player?.league?.code || player?.league?.id || player?.competition || player?.competitionId || player?.competition_id || player?.leagueCode || player?.leagueId || player?.league_id;
  const raw = typeof explicit === "object" ? (explicit.code || explicit.name || explicit.id) : explicit;
  const value = String(raw ?? "").trim();
  const normalized = normalize(value);
  const aliases = {
    pl: "PL", premierleague: "PL", premierleagueengland: "PL", epl: "PL",
    pd: "PD", laliga: "PD", laligaspain: "PD", primera: "PD",
    sa: "SA", seriea: "SA", serieaitaly: "SA",
    bl1: "BL1", bundesliga: "BL1", bundesligagermany: "BL1",
    fl1: "FL1", ligue1: "FL1", ligue1france: "FL1"
  };
  if (aliases[normalized]) return aliases[normalized];
  // API-Football competition IDs for the five supported leagues.
  const numeric = Number(value);
  const numericMap = { 39: "PL", 140: "PD", 135: "SA", 78: "BL1", 61: "FL1" };
  if (numericMap[numeric]) return numericMap[numeric];
  // Correct older snapshots using the player's club before trusting the old tag.
  const clubLeague = TEAM_TO_LEAGUE[normalize(getTeam(player))];
  if (clubLeague) return clubLeague;
  const saved = normalize(player?.favoriteLeague);
  return aliases[saved] || "";
}

function PlayerAvatar({ player }) {
  const photo = getPhoto(player);
  const initials = getName(player).split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();
  return photo
    ? <img src={photo} alt={getName(player)} loading="lazy" className="h-16 w-16 rounded-2xl border border-emerald-400/30 bg-white/5 object-cover" onError={event => { event.currentTarget.style.display = "none"; }} />
    : <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-400/10 text-lg font-black text-emerald-300">{initials || "PL"}</div>;
}

export default function FavoritePlayersView({ favorites = [], selectedLeague = "PL", selectedSeason, openPlayer, toggleFavorite, setActiveView }) {
  const leagueFavorites = useMemo(() => favorites.filter(player => getPlayerLeague(player) === selectedLeague), [favorites, selectedLeague]);
  const leagueLabels = { PL: "Premier League", PD: "La Liga", SA: "Serie A", BL1: "Bundesliga", FL1: "Ligue 1" };
  const selectedLeagueName = leagueLabels[selectedLeague] || selectedLeague;

  return <div className="space-y-5 text-white">
    <section className="relative overflow-hidden rounded-3xl border border-emerald-800/70 bg-gradient-to-br from-[#062219] via-[#061B14] to-[#07152A] p-6 sm:p-8">
      <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="relative flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.22em] text-emerald-300">Flow Football Analytics · Your shortlist</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">Favorītie spēlētāji<span className="text-emerald-300">.</span></h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-300">Redzi tikai tās līgas favorītus, kas pieder pašlaik izvēlētajai līgai. Pārējo līgu favorīti paliek saglabāti, pārslēdzot turnīru.</p>
          <div className="mt-4 inline-flex items-center gap-3 rounded-2xl border border-emerald-700/60 bg-black/20 px-3 py-2">
            <LeagueLogo competition={selectedLeague} size={34} className="rounded-xl" />
            <div><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Izvēlētā līga</p><p className="text-sm font-black text-white">{selectedLeagueName}</p>{selectedSeason && <p className="text-[10px] text-slate-500">{selectedSeason}</p>}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-emerald-700/60 bg-black/20 px-5 py-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Šīs līgas favorīti</p><p className="mt-1 text-3xl font-black text-emerald-300">{leagueFavorites.length}</p></div>
      </div>
    </section>

    {leagueFavorites.length ? <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {leagueFavorites.map((player, index) => {
        const id = getId(player);
        return <article key={String(id ?? `${getName(player)}-${index}`)} className="group overflow-hidden rounded-2xl border border-emerald-900/80 bg-[#061B14] transition hover:-translate-y-0.5 hover:border-emerald-500/60 hover:shadow-[0_16px_35px_rgba(0,0,0,.18)]">
          <div className="h-1 bg-gradient-to-r from-[#39E58C] via-[#21B981] to-[#A78BFA]" />
          <div className="flex items-center gap-3 p-4">
            <PlayerAvatar player={player} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-black text-white">{getName(player)}</p>
              <p className="mt-1 truncate text-xs text-slate-400">{getTeam(player)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-[9px] font-bold uppercase tracking-widest text-emerald-300">{player?.category || player?.position || "Spēlētājs"}</span><span className="inline-flex items-center gap-1 rounded-md border border-emerald-700/70 bg-emerald-400/5 px-2 py-1 text-[9px] font-bold text-emerald-200"><LeagueLogo competition={selectedLeague} size={14} />{selectedLeagueName}</span></div>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-lg text-emerald-300" aria-label="Favorīts">★</span>
          </div>
          <div className="grid grid-cols-3 border-t border-white/[0.07]">
            <div className="p-3"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Flow punkti</p><p className="mt-1 text-sm font-black text-emerald-300">{player?.flowPoints ?? player?.flow_points ?? player?.points ?? "—"}</p></div>
            <div className="border-x border-white/[0.07] p-3"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Vārti</p><p className="mt-1 text-sm font-black text-white">{player?.goals ?? player?.statistics?.goals ?? "—"}</p></div>
            <div className="p-3"><p className="text-[8px] font-bold uppercase tracking-wide text-slate-500">Assist</p><p className="mt-1 text-sm font-black text-white">{player?.assists ?? player?.statistics?.assists ?? "—"}</p></div>
          </div>
          <div className="flex gap-2 border-t border-white/[0.07] p-3">
            <button type="button" onClick={() => openPlayer?.(player)} className="flex-1 rounded-xl bg-emerald-400 px-3 py-2.5 text-xs font-black text-[#03150F] transition hover:bg-emerald-300">Skatīt profilu ↗</button>
            <button type="button" onClick={() => toggleFavorite?.(player)} className="rounded-xl border border-white/10 px-3 py-2.5 text-xs font-bold text-slate-300 transition hover:border-rose-400/50 hover:text-rose-300">Noņemt ★</button>
          </div>
        </article>;
      })}
    </section> : <section className="rounded-2xl border border-dashed border-emerald-800 bg-[#061B14] px-5 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-2xl text-emerald-300"><LeagueLogo competition={selectedLeague} size={32} /></div>
      <h2 className="mt-4 text-lg font-black text-white">Šajā līgā vēl nav favorītu</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-400">Saglabātie spēlētāji no citām līgām netiek dzēsti. Pārslēdz līgu augšējā izvēlnē vai pievieno šīs līgas spēlētāju favorītiem.</p>
      <button type="button" onClick={() => setActiveView?.("players")} className="mt-5 rounded-xl bg-emerald-400 px-5 py-3 text-xs font-black text-[#03150F] transition hover:bg-emerald-300">Atvērt Players →</button>
    </section>}
  </div>;
}
