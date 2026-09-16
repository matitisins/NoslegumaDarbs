import React, {
  useMemo,
  useState,
} from "react";

function Star({ active = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill={
        active
          ? "currentColor"
          : "none"
      }
      stroke="currentColor"
      strokeWidth="1.8"
    >
      <path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z" />
    </svg>
  );
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .trim();
}

function getInitials(name) {
  return (
    String(name || "")
      .split(" ")
      .map(
        part => part[0]
      )
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() ||
    "PL"
  );
}

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
  const [
    focused,
    setFocused,
  ] = useState(false);

  const results =
    useMemo(() => {
      const query =
        normalize(value);

      if (!query) {
        return [];
      }

      return players.filter(
        player => {
          const name =
            normalize(
              player.name
            );

          const team =
            normalize(
              player.team
            );

          return (
            name.includes(query) ||
            team.includes(query)
          );
        }
      );
    }, [
      players,
      value,
    ]);

  const rose =
    color === "rose";

  const handleSelect =
    player => {
      onSelect?.(player);
    };

  const handleOpen =
    player => {
      onOpen?.(player);
    };

  return (
    <div
      className={`mb-3 rounded-xl border ${
        rose
          ? "border-rose-200"
          : "border-emerald-200"
      } bg-white p-3 shadow-sm`}
    >
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-500">
        🔎 {label}
      </label>

      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={event =>
            onChange?.(
              event.target.value
            )
          }
          onFocus={() =>
            setFocused(true)
          }
          onBlur={() => {
            setTimeout(
              () =>
                setFocused(
                  false
                ),
              150
            );
          }}
          placeholder="Meklē pēc vārda vai kluba..."
          className={`w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 pr-9 text-sm outline-none transition focus:bg-white focus:ring-2 ${
            rose
              ? "focus:border-rose-400 focus:ring-rose-100"
              : "focus:border-emerald-400 focus:ring-emerald-100"
          }`}
        />

        {value && (
          <button
            type="button"
            onMouseDown={event =>
              event.preventDefault()
            }
            onClick={() =>
              onChange?.("")
            }
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
          >
            ✕
          </button>
        )}
      </div>

      {value &&
        focused && (
          <div className="mt-2 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm">
            {results.length ? (
              results.map(
                player => {
                  const favorite =
                    isFavorite?.(
                      player
                    ) ||
                    false;

                  const selectedPlayer =
                    selected?.id ===
                    player.id;

                  return (
                    <div
                      key={
                        player.id
                      }
                      className={`flex items-center gap-2 border-b border-slate-100 px-2 py-2 last:border-0 ${
                        rose
                          ? "hover:bg-rose-50"
                          : "hover:bg-emerald-50"
                      } ${
                        selectedPlayer
                          ? rose
                            ? "bg-rose-50"
                            : "bg-emerald-50"
                          : ""
                      }`}
                    >
                      {/* PLAYER */}
                      <button
                        type="button"
                        onMouseDown={event =>
                          event.preventDefault()
                        }
                        onClick={() =>
                          handleOpen(
                            player
                          )
                        }
                        className="flex min-w-0 flex-1 items-center gap-3 px-1 py-1.5 text-left"
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[10px] font-black ${
                            rose
                              ? "bg-rose-100 text-rose-600"
                              : "bg-emerald-100 text-emerald-600"
                          }`}
                        >
                          {getInitials(
                            player.name
                          )}
                        </span>

                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-800">
                            {
                              player.name
                            }
                          </span>

                          <span className="block truncate text-xs text-slate-400">
                            {
                              player.team
                            }
                          </span>
                        </span>
                      </button>

                      {/* FAVORITE */}
                      <button
                        type="button"
                        onMouseDown={event =>
                          event.preventDefault()
                        }
                        onClick={() =>
                          onToggleFavorite?.(
                            player
                          )
                        }
                        title={
                          favorite
                            ? "Noņemt no favorītiem"
                            : "Pievienot favorītiem"
                        }
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition ${
                          favorite
                            ? "bg-amber-50 text-amber-500"
                            : "bg-slate-50 text-slate-300 hover:bg-amber-50 hover:text-amber-500"
                        }`}
                      >
                        <Star
                          active={
                            favorite
                          }
                        />
                      </button>

                      {/* SELECT */}
                      <button
                        type="button"
                        onMouseDown={event =>
                          event.preventDefault()
                        }
                        onClick={() =>
                          handleSelect(
                            player
                          )
                        }
                        className={`rounded-lg px-2.5 py-2 text-[10px] font-bold text-white ${
                          rose
                            ? "bg-rose-500 hover:bg-rose-600"
                            : "bg-emerald-500 hover:bg-emerald-600"
                        }`}
                      >
                        Izvēlēties
                      </button>
                    </div>
                  );
                }
              )
            ) : (
              <p className="px-3 py-3 text-sm text-slate-400">
                Nav atrasts neviens spēlētājs.
              </p>
            )}
          </div>
        )}

      <p className="mt-2 text-xs text-slate-400">
        {value
          ? `Atrasti: ${results.length} spēlētāji`
          : selected
          ? `Izvēlēts: ${selected.name}`
          : "Ieraksti spēlētāja vārdu vai klubu"}
      </p>
    </div>
  );
}