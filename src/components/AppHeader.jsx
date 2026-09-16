import React from "react";

import Logo from "./Logo";

const DEFAULT_AVATAR =
  "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80";

export default function AppHeader({
  username = "Matīss",
  avatarUrl = DEFAULT_AVATAR,
  onHome,
  onGuide,
  onAccount,
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 md:px-8">
        {/* LOGO */}
        <button
          type="button"
          onClick={onHome}
          className="group flex items-center gap-3 text-left"
          title="Sākumlapa"
        >
          <Logo className="h-9 w-9 transition group-hover:scale-105" />

          <div className="hidden sm:block">
            <p className="text-sm font-black tracking-tight text-slate-950">
              Flow
            </p>

            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
              Football Analytics
            </p>
          </div>
        </button>

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-2">
          {/* HOME */}
          <button
            type="button"
            onClick={onHome}
            className="hidden rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 sm:block"
          >
            Sākums
          </button>

          {/* GUIDE */}
          <button
            type="button"
            onClick={onGuide}
            className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          >
            <span className="hidden sm:inline">
              Kā darbojas?
            </span>

            <span className="sm:hidden">
              ?
            </span>
          </button>

          {/* ACCOUNT */}
          <button
            type="button"
            onClick={onAccount}
            className="group flex items-center gap-2 rounded-xl border border-slate-200 bg-white py-1.5 pl-1.5 pr-2.5 transition hover:border-slate-300 hover:bg-slate-50"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="h-8 w-8 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-950 text-[10px] font-black text-white">
                {String(username || "M")
                  .slice(0, 1)
                  .toUpperCase()}
              </div>
            )}

            <span className="hidden max-w-[120px] truncate text-xs font-bold text-slate-700 md:block">
              {username || "Matīss"}
            </span>

            <span className="hidden text-[10px] text-slate-400 md:block">
              ⚙
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}