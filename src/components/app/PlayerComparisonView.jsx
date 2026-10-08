import React from "react";

import {
  CATEGORIES,
} from "./AppConstants";
import {
  SearchBox,
} from "./AppComponents";
import RadarChart from "../RadarChart";
import ComparisonSummary from "../ComparisonSummary";
import PlayerCard from "../PlayerCard";
import CaptaincySimulator from "../CaptaincySimulator";

export default function PlayerComparisonView({
  selectedCategory,
  player1,
  player2,
  categoryPlayers,
  captureRef,
  takeScreenshot,
  openPlayer,
  setPlayer1,
  setPlayer2,
  isFavorite,
  toggleFavorite,
  handlePlayer1Change,
  handlePlayer2Change,
  resetPlayers,
  fdr1,
  fdr2,
  fdrLoading,
}) {
  return (
            <section>
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={resetPlayers}
                  className="text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-emerald-600"
                >
                  ← Atpakaļ
                </button>

                <div className="flex gap-3">
                  <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                    {
                      CATEGORIES[
                        selectedCategory
                      ]?.name
                    }
                  </span>

                  {player1 &&
                    player2 && (
                      <button
                        type="button"
                        onClick={
                          takeScreenshot
                        }
                        className="rounded-lg bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800"
                      >
                        📷 Saglabāt attēlu
                      </button>
                    )}
                </div>
              </div>

              {!player1 || !player2 ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm">
                  <p className="text-sm text-slate-500">
                    Šajā kategorijā nav pietiekami daudz
                    spēlētāju salīdzināšanai.
                  </p>
                </div>
              ) : (
                <div
                  ref={captureRef}
                  className="rounded-2xl bg-slate-100 p-2"
                >
                  <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex flex-wrap justify-between gap-3 border-b border-slate-100 pb-4">
                      <div className="flex flex-wrap gap-5">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player1
                            )
                          }
                          className="text-xs font-bold text-rose-500 hover:underline"
                        >
                          🔴{" "}
                          {player1.name} (
                          {player1.team})
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player2
                            )
                          }
                          className="text-xs font-bold text-emerald-600 hover:underline"
                        >
                          🟢{" "}
                          {player2.name} (
                          {player2.team})
                        </button>
                      </div>

                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Position percentile
                      </span>
                    </div>

                    <RadarChart
                      players={[
                        player1,
                        player2,
                      ]}
                    />
                  </div>

                  <ComparisonSummary
                    player1={player1}
                    player2={player2}
                  />

                  <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div>
                      <SearchBox
                        players={
                          categoryPlayers
                        }
                        selected={player1}
                        target="player1"
                        onSelectPlayer1={player =>
                          setPlayer1(
                            player
                          )
                        }
                        onSelectPlayer2={player =>
                          setPlayer2(
                            player
                          )
                        }
                        onOpen={openPlayer}
                        isFavorite={
                          isFavorite
                        }
                        onToggleFavorite={
                          toggleFavorite
                        }
                        color="rose"
                        label="Meklēt pirmo spēlētāju"
                      />

                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player1
                            )
                          }
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-rose-500"
                        >
                          Skatīt individuālo statistiku →
                        </button>
                      </div>

                      <PlayerCard
                        player={player1}
                        players={
                          categoryPlayers
                        }
                        onChange={
                          handlePlayer1Change
                        }
                        color="rose"
                      />
                    </div>

                    <div>
                      <SearchBox
                        players={
                          categoryPlayers
                        }
                        selected={player2}
                        target="player2"
                        onSelectPlayer1={player =>
                          setPlayer1(
                            player
                          )
                        }
                        onSelectPlayer2={player =>
                          setPlayer2(
                            player
                          )
                        }
                        onOpen={openPlayer}
                        isFavorite={
                          isFavorite
                        }
                        onToggleFavorite={
                          toggleFavorite
                        }
                        color="emerald"
                        label="Meklēt otro spēlētāju"
                      />

                      <div className="mb-3 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            openPlayer(
                              player2
                            )
                          }
                          className="text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-emerald-500"
                        >
                          Skatīt individuālo statistiku →
                        </button>
                      </div>

                      <PlayerCard
                        player={player2}
                        players={
                          categoryPlayers
                        }
                        onChange={
                          handlePlayer2Change
                        }
                        color="emerald"
                      />
                    </div>
                  </div>

                  <CaptaincySimulator
                    player1={player1}
                    player2={player2}
                    fdr1={fdr1}
                    fdr2={fdr2}
                    loading={fdrLoading}
                  />
                </div>
              )}
            </section>

  );
}