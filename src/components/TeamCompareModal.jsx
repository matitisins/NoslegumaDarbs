import React from "react";

import {
  getTeamId,
  getTeamName,
  getTeamShortName,
  getTeamForm,
  getHomeAwayStats,
  getFormLabel,
  getPlayed,
  getWins,
  getDraws,
  getLosses,
  getGoalsFor,
  getGoalsAgainst,
  getGoalDifference,
  valueOrDash,
} from "../LeagueTableUtils";
import { TeamLogo, FormDots } from "./LeagueTableComponents";

function TeamCompareModal({
  first,
  second,
  standings,
  fixtures,
  onClose,
}) {
  if (!first || !second) {
    return null;
  }

  const firstId =
    getTeamId(first);
  const secondId =
    getTeamId(second);

  const firstForm =
    getTeamForm(
      firstId,
      fixtures
    );
  const secondForm =
    getTeamForm(
      secondId,
      fixtures
    );

  const firstHomeAway =
    getHomeAwayStats(
      firstId,
      fixtures
    );
  const secondHomeAway =
    getHomeAwayStats(
      secondId,
      fixtures
    );

  const metrics = [
    [
      "Punkti",
      first?.flowPoints,
      second?.flowPoints,
    ],
    [
      "Spēles",
      getPlayed(first),
      getPlayed(second),
    ],
    [
      "Uzvaras",
      getWins(first),
      getWins(second),
    ],
    [
      "Neizšķirti",
      getDraws(first),
      getDraws(second),
    ],
    [
      "Zaudējumi",
      getLosses(first),
      getLosses(second),
    ],
    [
      "GF",
      getGoalsFor(first),
      getGoalsFor(second),
    ],
    [
      "GA",
      getGoalsAgainst(first),
      getGoalsAgainst(second),
    ],
    [
      "GD",
      getGoalDifference(first),
      getGoalDifference(second),
    ],
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">

        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-wider text-emerald-600">
              Team Comparison
            </p>
            <h3 className="mt-1 text-lg font-black text-slate-900">
              Komandu salīdzinājums
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
          >
            ✕
          </button>
        </div>

        <div className="p-6">

          <div className="grid grid-cols-2 gap-3">
            {[first, second].map(
              team => (
                <div
                  key={getTeamId(team)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex items-center gap-3">
                    <TeamLogo
                      row={team}
                    />
                    <p className="text-sm font-black text-slate-900">
                      {getTeamName(
                        team
                      )}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>

          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
            <div className="grid grid-cols-3 bg-slate-50 px-4 py-3">
              <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                Rādītājs
              </span>
              <span className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                {getTeamShortName(
                  first
                )}
              </span>
              <span className="text-center text-[9px] font-black uppercase tracking-wider text-slate-400">
                {getTeamShortName(
                  second
                )}
              </span>
            </div>

            {metrics.map(
              ([label, a, b]) => (
                <div
                  key={label}
                  className="grid grid-cols-3 border-t border-slate-100 px-4 py-3"
                >
                  <span className="text-xs font-bold text-slate-500">
                    {label}
                  </span>
                  <span className="text-center text-sm font-black text-slate-900">
                    {valueOrDash(a)}
                  </span>
                  <span className="text-center text-sm font-black text-slate-900">
                    {valueOrDash(b)}
                  </span>
                </div>
              )
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              [
                first,
                firstForm,
                firstHomeAway,
              ],
              [
                second,
                secondForm,
                secondHomeAway,
              ],
            ].map(
              ([team, form, homeAway]) => {
                const formInfo =
                  getFormLabel(form);

                return (
                  <div
                    key={getTeamId(team)}
                    className="rounded-2xl border border-slate-200 p-4"
                  >
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                      {getTeamName(
                        team
                      )}
                    </p>

                    <div className="mt-3 flex items-center justify-between">
                      <FormDots
                        form={form}
                      />
                      <span
                        className={`rounded-full border px-2 py-1 text-[8px] font-black ${formInfo.tone}`}
                      >
                        {formInfo.label}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Mājas uzvaras
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {homeAway.home.wins}
                        </p>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-3">
                        <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                          Izbraukuma uzvaras
                        </p>
                        <p className="mt-1 text-lg font-black text-slate-900">
                          {homeAway.away.wins}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

export default TeamCompareModal;