import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import SearchResult from "./SearchResult";
import {
  searchPlayers,
} from "./SearchUtils";

export default function SearchBox({
  value = "",
  onChange,
  players = [],
  selected = null,
  onSelect,
  onOpen,
  isFavorite,
  onToggleFavorite,
  color = "emerald",
  label = "Meklēt spēlētāju",
}) {
  const [focused, setFocused] =
    useState(false);

  const wrapperRef = useRef(null);

  const results = searchPlayers(
    players,
    value
  );

  const rose = color === "rose";

  useEffect(() => {
    const handleOutside = event => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(
          event.target
        )
      ) {
        setFocused(false);
      }
    };

    document.addEventListener(
      "mousedown",
      handleOutside
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        handleOutside
      );
  }, []);

  const handleSelect = player => {
    onSelect?.(player);
    setFocused(false);
  };

  const borderColor = rose
    ? "border-rose-200"
    : "border-emerald-200";

  const focusColor = rose
    ? "focus:border-rose-400 focus:ring-rose-100"
    : "focus:border-emerald-400 focus:ring-emerald-100";

  const buttonColor = rose
    ? "text-rose-500"
    : "text-emerald-500";

  return (
    <div
      ref={wrapperRef}
      className={`relative mb-3 rounded-xl border ${borderColor} bg-white p-3 shadow-sm`}
    >
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        🔎 {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={event =>
            onChange?.(event.target.value)
          }
          onFocus={() => setFocused(true)}
          placeholder="Meklē pēc vārda vai kluba..."
          autoComplete="off"
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-300 focus:bg-white focus:ring-2 ${focusColor}`}
        />

        {value && (
          <button
            type="button"
            onClick={() => {
              onChange?.("");
              setFocused(false);
            }}
            aria-label="Notīrīt meklēšanu"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 transition hover:text-slate-500"
          >
            ×
          </button>
        )}
      </div>

      {focused && value.trim() && (
        <div className="absolute left-3 right-3 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-xl">
          {results.length > 0 ? (
            <>
              <div className="border-b border-slate-100 px-3 py-2">
                <p
                  className={`text-[9px] font-black uppercase tracking-wider ${buttonColor}`}
                >
                  Atrasti {results.length} spēlētāji
                </p>
              </div>

              {results
                .slice(0, 8)
                .map(player => (
                  <SearchResult
                    key={player.id}
                    player={player}
                    selected={selected}
                    onSelect={handleSelect}
                    onOpen={player =>
                      onOpen?.(player)
                    }
                    isFavorite={isFavorite}
                    onToggleFavorite={
                      onToggleFavorite
                    }
                    color={color}
                  />
                ))}

              {results.length > 8 && (
                <div className="border-t border-slate-100 px-3 py-2 text-center">
                  <p className="text-[9px] font-semibold text-slate-400">
                    Rādi pirmos 8 rezultātus
                  </p>
                </div>
              )}
            </>
          ) : (
            <div className="px-4 py-7 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-lg">
                🔍
              </div>

              <p className="mt-3 text-xs font-bold text-slate-600">
                Nekas netika atrasts
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                Pamēģini citu spēlētāja vai kluba nosaukumu.
              </p>
            </div>
          )}
        </div>
      )}

      {!value && selected && (
        <div className="mt-2 flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <div className="min-w-0">
            <p className="text-[8px] font-bold uppercase tracking-wider text-slate-400">
              Izvēlēts
            </p>

            <p className="truncate text-xs font-bold text-slate-700">
              {selected.name}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              onOpen?.(selected)
            }
            className={`shrink-0 text-[9px] font-bold uppercase tracking-wider ${buttonColor}`}
          >
            Skatīt →
          </button>
        </div>
      )}
    </div>
  );
}