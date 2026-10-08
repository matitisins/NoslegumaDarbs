import React, { useEffect, useState } from "react";

import {
  fetchLeagueStandings,
  fetchLeagueFixtures,
} from "./services/leagueFeatures";

import LeagueTopScorers from "./components/LeagueTopScorers";
import LeagueFixtures from "./components/LeagueFixtures";
import StandingsViewEnhanced from "./components/StandingsViewEnhanced";

export default function LeagueTables({
  competition,
  season,
  leagueName,
}) {
  const [activeTab, setActiveTab] = useState("table");
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState({
    upcoming: [],
    recent: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadStandings = async () => {
    setLoading(true);
    setError("");

    try {
      const [standingsData, fixturesData] = await Promise.all([
        fetchLeagueStandings(competition, season),
        fetchLeagueFixtures(competition, season),
      ]);

      setStandings(Array.isArray(standingsData) ? standingsData : []);
      setFixtures(
        fixturesData || {
          upcoming: [],
          recent: [],
        }
      );
    } catch (err) {
      console.error(err);
      setStandings([]);
      setFixtures({ upcoming: [], recent: [] });
      setError(err?.message || "Neizdevās ielādēt līgas datus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStandings();
  }, [competition, season]);

  const tabs = [
    ["table", "League Table", "📊"],
    ["scorers", "Top Scorers", "⚽"],
    ["fixtures", "Fixtures & Results", "📅"],
  ];

  const headerTitle =
    activeTab === "table"
      ? `${leagueName} līgas tabula`
      : activeTab === "scorers"
      ? `${leagueName} Top Scorers`
      : `${leagueName} spēles`;

  const headerDescription =
    activeTab === "table"
      ? "Oficiālā turnīra tabula no API-Football izvēlētajai sezonai."
      : activeTab === "scorers"
      ? "Sezonas līderi pēc vārtiem, assistiem un Flow punktiem."
      : "Nākamās spēles un jaunākie līgas rezultāti.";

  return (
    <section>
      <div className="mb-7 overflow-hidden rounded-[28px] bg-slate-950 px-7 py-9 shadow-xl md:px-10">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            League Tables
          </span>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-4xl">
            {headerTitle}
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {headerDescription}
          </p>
        </div>
      </div>

      <div className="mb-7 flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
        {tabs.map(([value, label, icon]) => (
          <button
            type="button"
            key={value}
            onClick={() => setActiveTab(value)}
            className={`rounded-xl px-4 py-2.5 text-xs font-bold transition ${
              activeTab === value
                ? "bg-slate-900 text-white shadow-sm"
                : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span className="mr-2">{icon}</span>
            {label}
          </button>
        ))}
      </div>

      {activeTab === "table" && (
        <StandingsViewEnhanced
          standings={standings}
          fixtures={fixtures}
          loading={loading}
          error={error}
          loadStandings={loadStandings}
          competition={competition}
          leagueName={leagueName}
          season={season}
        />
      )}

      {activeTab === "scorers" && (
        <LeagueTopScorers
          competition={competition}
          season={season}
          leagueName={leagueName}
        />
      )}

      {activeTab === "fixtures" && (
        <LeagueFixtures
          competition={competition}
          season={season}
          leagueName={leagueName}
        />
      )}
    </section>
  );
}