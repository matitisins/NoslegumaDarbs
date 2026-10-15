import React, { useEffect, useState } from "react";
import { fetchLeagueStandingsWithStatus, fetchLeagueFixturesWithStatus } from "./services/leagueFeatures";
import LeagueTopScorers from "./components/LeagueTopScorers";
import LeagueFixtures from "./components/LeagueFixtures";
import StandingsViewEnhanced from "./components/StandingsViewEnhanced";
import LeagueLogo from "./components/LeagueLogo";

export default function LeagueTables({ competition, season, leagueName }) {
  const [activeTab, setActiveTab] = useState("table");
  const [standings, setStandings] = useState([]);
  const [fixtures, setFixtures] = useState({ upcoming: [], recent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dataWarning, setDataWarning] = useState("");

  const loadStandings = async () => {
    setLoading(true);
    setError("");
    try {
      const [standingsResult, fixturesResult] = await Promise.all([
        fetchLeagueStandingsWithStatus(competition, season),
        fetchLeagueFixturesWithStatus(competition, season),
      ]);
      setStandings(Array.isArray(standingsResult?.data) ? standingsResult.data : []);
      setFixtures(fixturesResult?.data || { upcoming: [], recent: [] });
      setDataWarning([standingsResult?.warning, fixturesResult?.warning].filter(Boolean).join(" "));
    } catch (err) {
      console.error(err);
      setStandings([]);
      setFixtures({ upcoming: [], recent: [] });
      setDataWarning("");
      setError(err?.message || "Neizdevās ielādēt līgas datus.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadStandings(); }, [competition, season]);

  const tabs = [
    ["table", "Tabula", "▤"],
    ["scorers", "Labākie vārtu guvēji", "⚽"],
    ["fixtures", "Spēles un rezultāti", "◷"],
  ];
  const title = activeTab === "table" ? `${leagueName} līgas tabula` : activeTab === "scorers" ? `${leagueName} · labākie vārtu guvēji` : `${leagueName} · spēles un rezultāti`;
  const description = activeTab === "table" ? `Turnīra tabula, komandu forma un statistika sezonā ${season}/${Number(season) + 1}.` : activeTab === "scorers" ? "Sezonas līderi pēc vārtiem, rezultatīvām piespēlēm un Flow punktiem." : "Nākamās spēles un jaunākie līgas rezultāti.";

  return <section className="space-y-5 text-slate-100">
    <header className="relative isolate overflow-hidden rounded-[26px] border border-emerald-700/50 bg-gradient-to-br from-[#061D16] via-[#03150F] to-[#020D0A] p-5 shadow-[0_18px_55px_rgba(0,0,0,0.24)] sm:p-7"><div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-24 -z-10 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl"/><div aria-hidden="true" className="pointer-events-none absolute -bottom-24 left-1/3 -z-10 h-52 w-52 rounded-full bg-violet-500/10 blur-3xl"/>
      <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="min-w-0"><p className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_#39E58C]"/> League Analytics</p><div className="mt-3 flex items-center gap-3"><LeagueLogo competition={competition} size={52} className="rounded-xl"/><h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{title}</h1></div><p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-50/65">{description}</p></div>
        <div className="flex shrink-0 flex-wrap items-center gap-2 self-start xl:self-auto"><div className="rounded-2xl border border-emerald-800/80 bg-[#03150F]/80 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100/45">Competition</p><div className="mt-1 flex items-center gap-2"><LeagueLogo competition={competition} size={28} className="rounded-md"/><p className="text-sm font-black text-white">{leagueName}</p></div></div><div className="rounded-2xl border border-emerald-800/80 bg-[#03150F]/80 px-4 py-3"><p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-100/45">Season</p><p className="mt-1 text-sm font-black text-emerald-300">{season}/{Number(season) + 1}</p></div></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2 border-t border-emerald-900/80 pt-4">{tabs.map(([value, label, icon]) => <button type="button" key={value} onClick={() => setActiveTab(value)} className={`inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-extrabold transition ${activeTab === value ? "bg-gradient-to-r from-emerald-400 to-emerald-500 text-[#03150F] shadow-lg shadow-emerald-950/40" : "border border-emerald-900/90 bg-[#03150F]/80 text-emerald-50/65 hover:border-emerald-500/60 hover:bg-emerald-950/60 hover:text-white"}`}><span>{icon}</span>{label}</button>)}</div>
    </header>
    {dataWarning && <div role="status" className="rounded-xl border border-amber-800/60 bg-amber-950/30 px-4 py-3 text-xs leading-5 text-amber-100"><strong className="font-black">Datu brīdinājums.</strong> {dataWarning}</div>}
    {activeTab === "table" && <StandingsViewEnhanced standings={standings} fixtures={fixtures} loading={loading} error={error} loadStandings={loadStandings} competition={competition} leagueName={leagueName} season={season}/>}
    {activeTab === "scorers" && <div className="rounded-2xl border border-emerald-900 bg-[#061D16] p-4 sm:p-6"><LeagueTopScorers competition={competition} season={season} leagueName={leagueName}/></div>}
    {activeTab === "fixtures" && <div className="rounded-2xl border border-emerald-900 bg-[#061D16] p-4 sm:p-6"><LeagueFixtures competition={competition} season={season} leagueName={leagueName}/></div>}
  </section>;
}
