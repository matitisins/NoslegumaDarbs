/*
 * Attēlo lietotnes apakšējo sadaļu ar projekta nosaukumu,
 * īsu projekta aprakstu un izmantotā datu avota norādi.
 */

import React from "react";

export default function AppFooter() {
  return (
    <footer className="mt-12 border-t border-slate-200 pt-6">
      <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-xs font-bold text-slate-500">
            Flow Football Analytics
          </p>

          <p className="mt-0.5 text-[10px] text-slate-400">
            Spēlētāju salīdzināšanas
            platforma
          </p>
        </div>

        <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
          Data provided by football-data.org
        </p>
      </div>
    </footer>
  );
}