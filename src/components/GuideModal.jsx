import { createPortal } from "react-dom";
import { useEffect } from "react";

export default function GuideModal({ onClose }) {
  useEffect(() => {
    const oldOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = event => {
      if (event.key === "Escape") {
        onClose();
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

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (
          event.target === event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-[1000000] max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl"
        onMouseDown={event =>
          event.stopPropagation()
        }
      >
        <div className="bg-slate-950 p-6 text-white">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">
                Flow Football Analytics
              </p>

              <h2 className="mt-1 text-3xl font-black">
                Kā izmantot Flow?
              </h2>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-xl text-white transition hover:bg-white/20"
              aria-label="Aizvērt"
            >
              ×
            </button>
          </div>
        </div>

        <div className="space-y-4 p-6">
          {[
            [
              "01",
              "Izvēlies līgu",
              "Izvēlies Premier League, La Liga, Serie A, Bundesliga vai Ligue 1.",
            ],
            [
              "02",
              "Izvēlies pozīciju",
              "Flow piedāvā uzbrucējus, pussargus, aizsargus un vārtsargus.",
            ],
            [
              "03",
              "Izvēlies spēlētājus",
              "Meklē spēlētāju pēc vārda vai kluba un izvēlies divus salīdzināšanai.",
            ],
            [
              "04",
              "Salīdzini",
              "Apskati statistiku, radara diagrammu, Fantasy punktus un kapteiņa simulāciju.",
            ],
          ].map(([number, title, text]) => (
            <div
              key={number}
              className="flex gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500 text-xs font-black text-white">
                {number}
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900">
                  {title}
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  {text}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end border-t border-slate-200 p-5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Sapratu
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}