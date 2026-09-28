import React, {
  useEffect,
  useState,
} from "react";

import {
  fetchLeagueFixtures,
} from "../services/leagueFeatures";

const formatDate = value => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "lv-LV",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(date);
};

const getStatus = fixture => {
  const short =
    fixture?.fixture?.status?.short ||
    fixture?.status ||
    "NS";

  const finished = [
    "FT",
    "AET",
    "PEN",
  ].includes(short);

  if (finished) return "Beigas";

  if (
    [
      "1H",
      "HT",
      "2H",
      "ET",
      "BT",
      "P",
    ].includes(short)
  ) {
    return "LIVE";
  }

  return "Plānots";
};

function FixtureRow({ fixture }) {
  const home =
    fixture?.teams?.home || {};
  const away =
    fixture?.teams?.away || {};
  const goals =
    fixture?.goals || {};

  const status =
    getStatus(fixture);

  const isLive =
    status === "LIVE";
  const isFinished =
    status === "Beigas";

  return (
    <div className="grid min-w-[720px] grid-cols-[150px_minmax(180px,1fr)_80px_minmax(180px,1fr)_150px] items-center border-b border-slate-100 px-5 py-4 last:border-b-0 hover:bg-slate-50">
      <div>
        <p className="text-xs font-bold text-slate-700">
          {formatDate(
            fixture?.fixture?.date
          )}
        </p>
        <p
          className={`mt-1 text-[9px] font-black uppercase tracking-wider ${
            isLive
              ? "text-rose-500"
              : isFinished
              ? "text-slate-400"
              : "text-emerald-600"
          }`}
        >
          {status}
        </p>
      </div>

      <div className="flex items-center justify-end gap-3 text-right">
        <span className="truncate text-sm font-extrabold text-slate-900">
          {home.name || "Mājinieki"}
        </span>
        {home.logo && (
          <img
            src={home.logo}
            alt=""
            className="h-8 w-8 object-contain"
          />
        )}
      </div>

      <div className="text-center">
        {isFinished || isLive ? (
          <span className="text-base font-black text-slate-900">
            {goals.home ?? 0} : {goals.away ?? 0}
          </span>
        ) : (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-slate-400">
            VS
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        {away.logo && (
          <img
            src={away.logo}
            alt=""
            className="h-8 w-8 object-contain"
          />
        )}
        <span className="truncate text-sm font-extrabold text-slate-900">
          {away.name || "Viesi"}
        </span>
      </div>

      <div className="text-right text-[10px] font-bold text-slate-400">
        {fixture?.league?.round || ""}
      </div>
    </div>
  );
}

export default function LeagueFixtures({
  competition,
  season,
  leagueName,
}) {
  const [fixtures, setFixtures] =
    useState({
      upcoming: [],
      recent: [],
    });
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [view, setView] =
    useState("upcoming");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const data =
          await fetchLeagueFixtures(
            competition,
            season
          );

        if (!cancelled) {
          setFixtures(data);
        }
      } catch (err) {
        if (!cancelled) {
          setFixtures({
            upcoming: [],
            recent: [],
          });
          setError(
            err?.message ||
              "Neizdevās ielādēt spēles."
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

  const rows =
    fixtures?.[view] || [];

  return (
    <section>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-slate-900">
            Fixtures & Results
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {leagueName} · {season}/
            {Number(season) + 1}
          </p>
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() =>
              setView("upcoming")
            }
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              view === "upcoming"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            Nākamās
          </button>

          <button
            type="button"
            onClick={() =>
              setView("recent")
            }
            className={`rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${
              view === "recent"
                ? "bg-slate-900 text-white"
                : "text-slate-400 hover:bg-slate-50"
            }`}
          >
            Rezultāti
          </button>
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
            Ielādē spēles...
          </p>
        </div>
      ) : !error && rows.length === 0 ? (
        <div className="rounded-[24px] border border-slate-200 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
            ⚽
          </div>
          <h2 className="mt-4 text-lg font-black text-slate-900">
            Spēles nav atrastas
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Izvēlētajai līgai un sezonai šajā skatā nav pieejamu spēļu.
          </p>
        </div>
      ) : !error ? (
        <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <div className="min-w-[720px]">
              {rows.map(fixture => (
                <FixtureRow
                  key={
                    fixture?.fixture?.id ||
                    `${fixture?.fixture?.date}-${fixture?.teams?.home?.id}-${fixture?.teams?.away?.id}`
                  }
                  fixture={fixture}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
