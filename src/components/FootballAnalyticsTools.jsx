import React, { useEffect, useState } from "react";
import { fetchApiSportsPlayers } from "../services/apiSports";
import { fetchLeagueFixtures, fetchLeagueStandings } from "../services/leagueFeatures";
import RecommendationTool from "./analytics/RecommendationTool";
import RankingTool from "./analytics/RankingTool";
import FantasyBuilder from "./analytics/FantasyBuilder";

export default function FootballAnalyticsTools({
  competition,
  season,
  leagueName,
}) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tool, setTool] = useState("recommendations");
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [standings, setStandings] = useState([]);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data = await fetchApiSportsPlayers(competition, season);
        if (!cancelled) {
          setPlayers(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setPlayers([]);
          setError(err?.message || "Neizdevās ielādēt spēlētājus.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => { cancelled = true; };
  }, [competition, season]);

  useEffect(() => {
    let cancelled = false;

    const loadLeagueContext = async () => {
      try {
        const [fixtureData, standingData] = await Promise.all([
          fetchLeagueFixtures(competition, season),
          fetchLeagueStandings(competition, season),
        ]);

        if (!cancelled) {
          setFixtures(fixtureData || { upcoming: [], recent: [] });
          setStandings(Array.isArray(standingData) ? standingData : []);
        }
      } catch {
        if (!cancelled) {
          setFixtures({ upcoming: [], recent: [] });
          setStandings([]);
        }
      }
    };

    loadLeagueContext();
    return () => { cancelled = true; };
  }, [competition, season]);

  const toolItems = [
    ["recommendations", "Player Recommendations", "Atrodi spēlētājus pēc izvēlētā profila."],
    ["ranking", "Custom Player Ranking", "Izveido savu statistikas vērtēšanas modeli."],
    ["fantasy", "Fantasy Team Builder", "Izveido Fantasy XI pēc formācijas."],
  ];

  return (
    <section>
      <div className="mb-6">
        <h2 className="text-xl font-black text-slate-900">Analytics Tools</h2>
        <p className="mt-1 text-xs text-slate-400">
          {leagueName} · {season}/{Number(season) + 1}
        </p>
      </div>

      <div className="mb-6 grid gap-3 md:grid-cols-3">
        {toolItems.map(([value, title, description]) => (
          <button
            type="button"
            key={value}
            onClick={() => setTool(value)}
            className={`rounded-2xl border p-4 text-left transition ${
              tool === value
                ? "border-emerald-300 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300"
            }`}
          >
            <p className="text-sm font-black text-slate-900">{title}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">API kļūda</p>
          <p className="mt-1 text-xs text-red-600">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />
          <p className="mt-4 text-sm font-bold text-slate-600">Ielādē analītikas datus...</p>
        </div>
      ) : !error ? (
        <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 md:p-6">
          {tool === "recommendations" && (
            <RecommendationTool
              players={players}
              fixtures={fixtures}
              standings={standings}
              competition={competition}
              season={season}
            />
          )}
          {tool === "ranking" && (
            <RankingTool players={players} competition={competition} season={season} />
          )}
          {tool === "fantasy" && (
            <FantasyBuilder players={players} competition={competition} season={season} />
          )}
        </div>
      ) : null}
    </section>
  );
}