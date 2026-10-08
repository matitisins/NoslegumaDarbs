import React from "react";

export default function AppStatus({
  activeView,
  loading,
  error,
  leagueName,
  selectedSeason,
  loadPlayers,
}) {
  return (
    <>
        {activeView === "players" && loading && (
          <div className="rounded-3xl border border-slate-200 bg-white p-14 text-center shadow-sm">
            <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />

            <h2 className="font-extrabold text-slate-900">
              Ielādē futbola datus
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              {leagueName} · {selectedSeason}
            </p>
          </div>
        )}

        {activeView === "players" && error && !loading && (
          <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-bold text-red-700">
              API kļūda
            </h2>

            <p className="mt-1 text-sm text-red-600">
              {error}
            </p>

            <button
              type="button"
              onClick={() => loadPlayers(true)}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500"
            >
              Mēģināt vēlreiz
            </button>
          </div>
        )}

    </>
  );
}