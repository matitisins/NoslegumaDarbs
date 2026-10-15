import React from "react";

export default function AppFooter() {
  return <footer className="mt-12 border-t border-emerald-950 pt-6 text-center text-slate-500">
    <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
      <div><p className="text-xs font-bold text-slate-300">Flow Football Analytics</p><p className="mt-0.5 text-[10px] text-slate-500">Spēlētāju salīdzināšanas platforma</p></div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">Data provided by API-Football</p>
    </div>
  </footer>;
}
