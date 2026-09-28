import React, {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchApiSportsPlayers,
} from "../services/apiSports";

const number = value => {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed
    : 0;
};

function PlayerLogo({ player }) {
  if (player?.photo) {
    return (
      <img
        src={player.photo}
        alt=""
        className="h-9 w-9 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-[10px] font-black text-slate-500">
      {String(player?.name || "PL")
        .split(" ")
        .map(part => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join("")
        .toUpperCase()}
    </div>
  );
}

export default function LeagueTopScorers({
  competition,
  season,
  leagueName,
}) {
  const [players, setPlayers] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [metric, setMetric] =
    useState("goals");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchApiSportsPlayers(
            competition,
            season
          );

        if (!cancelled) {
          setPlayers(
            Array.isArray(data)
              ? data
              : []
          );
        }
      } catch (err) {
        if (!cancelled) {
          setPlayers([]);
          setError(
            err?.message ||
              "Neizdevās ielādēt spēlētāju datus."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [competition, season]);

  const sortedPlayers =
    useMemo(() => {
      return [...players]
        .sort((a, b) => {
          const primary =
            number(b?.[metric]) -
            number(a?.[metric]);

          if (primary !== 0) {
            return primary;
          }

          return (
            number(b?.points) -
            number(a?.points)
          );
        })
        .slice(0, 20);
    }, [players, metric]);

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Top Scorers
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {leagueName} · {season}/
            {Number(season) + 1}
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          {[
            ["goals", "Vārti"],
            ["assists", "Assist"],
            ["points", "Flow"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                setMetric(value)
              }
              className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition ${
                metric === value
                  ? "bg-slate-900 text-white"
                  : "text-slate-400 hover:bg-slate-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-bold text-red-700">
            API kļūda
          </p>
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        </div>
      )}

      {loading ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-14 text-center shadow-sm">
          <div className="mx-auto h-11 w-11 animate-spin rounded-2xl border-4 border-emerald-100 border-t-emerald-500" />
          <p className="mt-4 text-sm font-bold text-slate-600">
            Ielādē top spēlētājus...
          </p>
        </div>
      ) : !error ? (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              <div className="grid grid-cols-[58px_minmax(260px,1fr)_150px_80px_80px_90px] items-center border-b border-slate-200 bg-slate-50 px-5 py-3">
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  #
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Spēlētājs
                </div>
                <div className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Klubs
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Spēles
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Vārti
                </div>
                <div className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                  Assist / Flow
                </div>
              </div>

              {sortedPlayers.map(
                (player, index) => (
                  <div
                    key={player.id}
                    className="grid grid-cols-[58px_minmax(260px,1fr)_150px_80px_80px_90px] items-center border-b border-slate-100 px-5 py-3.5 last:border-b-0 hover:bg-slate-50"
                  >
                    <div className="text-center text-sm font-black text-slate-400">
                      {index + 1}
                    </div>

                    <div className="flex min-w-0 items-center gap-3">
                      <PlayerLogo
                        player={player}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-sm font-extrabold text-slate-900">
                          {player.name}
                        </p>
                        <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {player.positionLabel ||
                            player.position}
                        </p>
                      </div>
                    </div>

                    <div className="truncate text-xs font-bold text-slate-600">
                      {player.team}
                    </div>

                    <div className="text-center text-sm font-bold text-slate-700">
                      {number(
                        player.appearances
                      )}
                    </div>

                    <div className="text-center text-sm font-black text-slate-900">
                      {number(
                        player.goals
                      )}
                    </div>

                    <div className="text-center">
                      <p className="text-sm font-black text-emerald-600">
                        {metric === "assists"
                          ? number(
                              player.assists
                            )
                          : metric === "points"
                          ? number(
                              player.points
                            )
                          : number(
                              player.assists
                            )}
                      </p>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">
                        {metric === "points"
                          ? "Flow"
                          : "Assist"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
