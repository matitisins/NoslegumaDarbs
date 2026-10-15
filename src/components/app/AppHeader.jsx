import React from "react";
import Logo from "../Logo";

export default function AppHeader({ activeView, setActiveView, openAccount, avatarUrl, username, favoritesCount = 0, setIsGuideOpen }) {
  const navItems = [
    { id: "home", label: "Home" },
    { id: "players", label: "Players" },
    { id: "teams", label: "Teams" },
    { id: "league-tables", label: "League Tables" },
    { id: "european-competitions", label: "European Competitions" },
    { id: "analytics-tools", label: "Analytics Tools" },
    { id: "favorite-players", label: "Favorīti", count: favoritesCount },
  ];
  const active = activeView === "players" ? "players" : activeView;

  return <header className="sticky top-0 z-40 border-b border-emerald-950/80 bg-[#03150F]/95 shadow-[0_8px_28px_rgba(0,0,0,.2)] backdrop-blur-xl">
    <div className="mx-auto flex h-[68px] max-w-[1480px] items-center justify-between gap-4 px-4 sm:px-6">
      <button type="button" onClick={() => setActiveView("home")} className="flex shrink-0 items-center gap-3 text-left" aria-label="Atvērt sākumlapu">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-700/60 bg-[#061B14] shadow-[0_0_20px_rgba(57,229,140,.08)]"><Logo className="h-7 w-7" /></span>
        <span><span className="block text-lg font-black leading-5 text-white">Flow</span><span className="mt-0.5 block text-[8px] font-bold uppercase tracking-[.19em] text-slate-400">Football Analytics</span></span>
      </button>

      <nav className="hidden items-center gap-1 lg:flex" aria-label="Galvenā navigācija">
        {navItems.map(item => <button key={item.id} type="button" onClick={() => setActiveView(item.id)} aria-current={active === item.id ? "page" : undefined} className={`rounded-xl px-3.5 py-2.5 text-xs font-bold transition ${active === item.id ? "bg-emerald-400/15 text-emerald-300 shadow-inner shadow-emerald-300/5" : "text-slate-300 hover:bg-white/[0.05] hover:text-white"}`}>{item.label}{item.id === "favorite-players" && <span className="ml-1.5 rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[9px] text-emerald-300">{favoritesCount}</span>}</button>)}
        <button type="button" onClick={() => setIsGuideOpen(true)} className="rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-300 transition hover:bg-white/[0.05] hover:text-white">Guide</button>
      </nav>

      <button type="button" onClick={openAccount} className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-900/80 bg-[#061B14] py-1.5 pl-1.5 pr-3 transition hover:border-emerald-500/60">
        <img src={avatarUrl} alt="Profila attēls" className="h-8 w-8 rounded-full border-2 border-emerald-400 object-cover" />
        <span className="hidden max-w-24 truncate text-xs font-bold text-white sm:inline">{username}</span><span className="text-slate-400">⌄</span>
      </button>
    </div>
    <nav className="flex gap-1 overflow-x-auto border-t border-white/[0.05] px-3 py-2 lg:hidden" aria-label="Mobilā navigācija">
      {navItems.map(item => <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold ${active === item.id ? "bg-emerald-400/15 text-emerald-300" : "text-slate-400 hover:text-white"}`}>{item.label}{item.id === "favorite-players" && <span className="ml-1 text-emerald-300">{favoritesCount}</span>}</button>)}
      <button type="button" onClick={() => setIsGuideOpen(true)} className="shrink-0 rounded-lg px-3 py-2 text-[10px] font-bold text-slate-400">Guide</button>
    </nav>
  </header>;
}
