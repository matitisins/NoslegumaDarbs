import React from "react";

function numberValue(item) {
  if (typeof item === "number") {
    return Number.isFinite(item) ? item : 0;
  }

  if (typeof item === "string") {
    const value = Number(item);
    return Number.isFinite(value) ? value : 0;
  }

  if (item && typeof item === "object") {
    const values = [
      item.value,
      item.points,
      item.score,
      item.rating,
      item.fantasy,
      item.total,
    ];

    for (const value of values) {
      const number = Number(value);

      if (Number.isFinite(number)) {
        return number;
      }
    }
  }

  return 0;
}

function normalizeForm(form) {
  if (!Array.isArray(form)) return [];

  return form.map((item, index) => ({
    value: numberValue(item),
    label:
      item?.label ||
      item?.gameweek ||
      item?.week ||
      `GW ${index + 1}`,
  }));
}

export default function PlayerFormTrend({
  player,
  data,
  title = "Formas tendence",
}) {
  const form = normalizeForm(
    data ??
      player?.recentForm ??
      player?.form ??
      player?.formMetrics ??
      []
  );

  if (!form.length) {
    return <EmptyForm title={title} />;
  }

  const max = Math.max(
    1,
    ...form.map(item => item.value)
  );

  const min = Math.min(
    0,
    ...form.map(item => item.value)
  );

  const range = Math.max(
    1,
    max - min
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-extrabold text-slate-900">
            {title}
          </h3>

          <p className="mt-1 text-xs text-slate-400">
            Spēlētāja pēdējās formas rādītāji
          </p>
        </div>

        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
          Forma
        </span>
      </div>

      <div className="mt-6">
        <div className="flex h-32 items-end gap-2">
          {form.map((item, index) => {
            const normalized =
              ((item.value - min) / range) *
              100;

            const height = Math.max(
              8,
              Math.min(100, normalized)
            );

            return (
              <div
                key={`${item.label}-${index}`}
                className="group flex h-full flex-1 flex-col justify-end"
              >
                <div className="relative flex flex-1 items-end">
                  <div
                    className="w-full rounded-t-lg bg-emerald-400 transition-all duration-200 group-hover:bg-emerald-500"
                    style={{
                      height: `${height}%`,
                    }}
                    title={`${item.label}: ${item.value}`}
                  />
                </div>

                <div className="mt-2 truncate text-center text-[9px] font-bold text-slate-400">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Zemākais
        </span>

        <span className="text-xs font-black text-slate-700">
          {Math.min(
            ...form.map(item => item.value)
          )}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Augstākais
        </span>

        <span className="text-xs font-black text-emerald-600">
          {Math.max(
            ...form.map(item => item.value)
          )}
        </span>
      </div>
    </div>
  );
}

function EmptyForm({ title }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-extrabold text-slate-900">
        {title}
      </h3>

      <p className="mt-1 text-xs text-slate-400">
        Pēdējo spēļu formas dati nav pieejami.
      </p>

      <div className="mt-5 flex h-28 items-center justify-center rounded-xl bg-slate-50">
        <span className="text-xs font-semibold text-slate-400">
          Nav pietiekami daudz datu
        </span>
      </div>
    </div>
  );
}