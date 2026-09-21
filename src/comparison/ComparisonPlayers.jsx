import React from "react";

import SearchBox from "../search/SearchBox";
import PlayerCard from "../player/PlayerCard";

export default function ComparisonPlayers({
  player1,
  player2,
  categoryPlayers = [],

  playerSearch1 = "",
  playerSearch2 = "",

  setPlayerSearch1,
  setPlayerSearch2,

  setPlayer1,
  setPlayer2,

  isFavorite,
  toggleFavorite,
  openPlayer,
}) {
  const handleSelect1 = player => {
    setPlayer1?.(player);
    setPlayerSearch1?.("");
  };

  const handleSelect2 = player => {
    setPlayer2?.(player);
    setPlayerSearch2?.("");
  };

  const findPlayer = event =>
    categoryPlayers.find(
      player =>
        String(player.id) ===
        String(event.target.value)
    );

  const handleChange1 = event => {
    const player = findPlayer(event);

    if (player) {
      setPlayer1?.(player);
    }
  };

  const handleChange2 = event => {
    const player = findPlayer(event);

    if (player) {
      setPlayer2?.(player);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* PLAYER 1 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500">
            Spēlētājs 1
          </p>

          {player1 && (
            <button
              type="button"
              onClick={() =>
                openPlayer?.(player1)
              }
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-rose-500"
            >
              Individuālā statistika →
            </button>
          )}
        </div>

        <SearchBox
          value={playerSearch1}
          onChange={setPlayerSearch1}
          players={categoryPlayers}
          selected={player1}
          onSelect={handleSelect1}
          onOpen={openPlayer}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          color="rose"
          label="Meklēt pirmo spēlētāju"
        />

        <div className="mt-3">
          <PlayerCard
            player={player1}
            players={categoryPlayers}
            onChange={handleChange1}
            color="rose"
          />
        </div>
      </div>

      {/* PLAYER 2 */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
            Spēlētājs 2
          </p>

          {player2 && (
            <button
              type="button"
              onClick={() =>
                openPlayer?.(player2)
              }
              className="text-[10px] font-bold uppercase tracking-wider text-slate-400 transition hover:text-emerald-500"
            >
              Individuālā statistika →
            </button>
          )}
        </div>

        <SearchBox
          value={playerSearch2}
          onChange={setPlayerSearch2}
          players={categoryPlayers}
          selected={player2}
          onSelect={handleSelect2}
          onOpen={openPlayer}
          isFavorite={isFavorite}
          onToggleFavorite={toggleFavorite}
          color="emerald"
          label="Meklēt otro spēlētāju"
        />

        <div className="mt-3">
          <PlayerCard
            player={player2}
            players={categoryPlayers}
            onChange={handleChange2}
            color="emerald"
          />
        </div>
      </div>
    </div>
  );
}