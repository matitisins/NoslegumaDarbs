// src/components/PlayerSelect.jsx
import React, { useMemo, useState } from "react";

export default function PlayerSelect({
  playerId,
  setPlayerId,
  players,
}) {
  const safePlayers = Array.isArray(players) ? players : [];

  const [searchQuery, setSearchQuery] = useState("");

  const filteredPlayers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return safePlayers;
    }

    return safePlayers.filter((player) => {
      const name = String(player.name || "").toLowerCase();
      const team = String(player.team || "").toLowerCase();

      return name.includes(query) || team.includes(query);
    });
  }, [safePlayers, searchQuery]);

  const handleSelectChange = (event) => {
    const id = Number(event.target.value);

    if (!Number.isNaN(id)) {
      setPlayerId(id);
    }
  };

  return (
    <div className="mb-4">
      <input
        type="text"
        placeholder="Meklēt spēlētāju vai klubu..."
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 mb-2 text-white text-sm placeholder-gray-400 focus:outline-none focus:border-green-400"
      />

      <select
        value={playerId ?? ""}
        onChange={handleSelectChange}
        className="w-full bg-gray-700 border border-gray-600 rounded-lg p-2 text-white focus:outline-none focus:border-green-400"
      >
        {filteredPlayers.length > 0 ? (
          filteredPlayers.map((player) => (
            <option key={player.id} value={player.id}>
              {player.name} ({player.team})
            </option>
          ))
        ) : (
          <option value="" disabled>
            Nav atrasts neviens spēlētājs
          </option>
        )}
      </select>
    </div>
  );
}