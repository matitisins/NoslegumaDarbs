import React, {
  useEffect,
} from "react";
import { createPortal } from "react-dom";

export default function GuideModal({
  onClose,
}) {
  useEffect(() => {
    const oldOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      document.body.style.overflow =
        oldOverflow;

      document.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [onClose]);

  if (
    typeof document ===
    "undefined"
  ) {
    return null;
  }

  const steps = [
    [
      "01",
      "Izvēlies līgu",
      "Izvēlies kādu no piecām pieejamajām Eiropas līgām.",
    ],
    [
      "02",
      "Izvēlies kategoriju",
      "Izvēlies uzbrucējus, pussargus, aizsargus vai vārtsargus.",
    ],
    [
      "03",
      "Atrodi spēlētājus",
      "Izmanto meklēšanu, lai atrastu un izvēlētos divus spēlētājus.",
    ],
    [
      "04",
      "Salīdzini",
      "Apskati statistiku, radar diagrammu, formu un fantasy vērtību.",
    ],
    [
      "05",
      "Izmanto simulatoru",
      "Kapteiņa simulators aprēķina abu spēlētāju simulēto fantasy vērtību.",
    ],
  ];

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-950 px-6 py-6 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Flow Football Analytics
              </p>

              <h2 className="mt-1 text-2xl font-black">
                Kā darbojas Flow?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Īss ceļvedis par galvenajām
                Flow funkcijām.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
              aria-label="Aizvērt"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid gap-3 md:grid-cols-2">
            {steps.map(
              ([number, title, text]) => (
                <div
                  key={number}
                  className="rounded-xl bg-slate-50 p-4"
                >
                  <span className="text-[10px] font-black tracking-widest text-emerald-500">
                    {number}
                  </span>

                  <h3 className="mt-2 text-sm font-extrabold text-slate-900">
                    {title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {text}
                  </p>
                </div>
              )
            )}
          </div>

          <div className="mt-7 border-t border-slate-200 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Data provided by football-data.org
            </p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}