import React from "react";
import Logo from "../Logo";

export default function AppHeader({
  activeView,
  setActiveView,
  resetPlayers,
  openAccount,
  avatarUrl,
  username,
  setIsGuideOpen,
}) {
  return (
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-6">
          <button
            type="button"
            onClick={() => {
              setActiveView("players");
              resetPlayers();
            }}
            className="flex items-center gap-3"
          >
            <Logo className="h-9 w-9" />

            <div className="text-left">
              <div className="text-lg font-extrabold text-slate-900">
                Flow
              </div>

              <div className="-mt-0.5 text-[9px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                Football Analytics
              </div>
            </div>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <button
              type="button"
              onClick={() => {
                setActiveView("players");
                resetPlayers();
              }}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeView === "players"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Players
            </button>

            <button
              type="button"
              onClick={() => setActiveView("teams")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeView === "teams"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Teams
            </button>

            <button
              type="button"
              onClick={() => setActiveView("league-tables")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeView === "league-tables"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              League Tables
            </button>

            <button
              type="button"
              onClick={() => setActiveView("analytics-tools")}
              className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                activeView === "analytics-tools"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              Analytics Tools
            </button>

            <button
              type="button"
              onClick={() => setIsGuideOpen(true)}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50 hover:text-slate-900"
            >
              Guide
            </button>
          </nav>

          <button
            type="button"
            onClick={openAccount}
            className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pl-1.5 pr-3 shadow-sm hover:border-slate-300"
          >
            <img
              src={avatarUrl}
              alt="Avatar"
              className="h-8 w-8 rounded-full border-2 border-emerald-500 object-cover"
            />

            <span className="text-xs font-bold text-slate-700">
              {username}
            </span>

            <span className="text-slate-400">
              →
            </span>
          </button>
        </div>
      </header>

  );
}