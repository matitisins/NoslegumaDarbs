import React from "react";
import PlayerIdentity from "./PlayerIdentity";

export default function PlayerHeader({
  player,
  color = "emerald",
}) {
  const rose = color === "rose";

  return (
    <div className="relative overflow-hidden bg-slate-950 p-5 text-white">
      <div
        className={`absolute left-0 top-0 h-full w-1 ${
          rose ? "bg-rose-500" : "bg-emerald-500"
        }`}
      />

      <PlayerIdentity
        player={player}
        color={color}
      />
    </div>
  );
}