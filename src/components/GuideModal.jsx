import React from "react";

const steps = [
  {
    number: "01",
    icon: "🏆",
    title: "Izvēlies līgu",
    text:
      "Izvēlies vienu no piecām pieejamajām Eiropas līgām un sezonu, kuru vēlies analizēt.",
  },
  {
    number: "02",
    icon: "👤",
    title: "Izvēlies pozīciju",
    text:
      "Izvēlies uzbrucējus, pussargus, aizsargus vai vārtsargus, lai saņemtu atbilstošu spēlētāju sarakstu.",
  },
  {
    number: "03",
    icon: "⚖️",
    title: "Salīdzini spēlētājus",
    text:
      "Izvēlies divus spēlētājus un apskati viņu statistikas salīdzinājumu, radara diagrammu un kopsavilkumu.",
  },
  {
    number: "04",
    icon: "⭐",
    title: "Saglabā favorītus",
    text:
      "Pievieno interesējošos spēlētājus favorītiem, lai tos varētu ātri atrast vēlāk.",
  },
];

export default function GuideModal({
  open,
  isOpen,
  onClose,
}) {
  const visible =
    open ??
    isOpen ??
    false;

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={event => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose?.();
        }
      }}
    >
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl">
        {/* HEADER */}
        <div className="bg-slate-950 p-6 text-white md:p-8">
          <div className="flex items-start justify-between gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Flow Football Analytics
              </p>

              <h2 className="mt-2 text-2xl font-black md:text-3xl">
                Kā darbojas Flow?
              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Ātrs ceļvedis, kā izmantot spēlētāju
                salīdzināšanas platformu.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Aizvērt ceļvedi"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        {/* STEPS */}
        <div className="p-6 md:p-8">
          <div className="grid gap-4 md:grid-cols-2">
            {steps.map(step => (
              <div
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-xl">
                    {step.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black tracking-widest text-emerald-500">
                        {step.number}
                      </span>

                      <h3 className="text-base font-extrabold text-slate-900">
                        {step.title}
                      </h3>
                    </div>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      {step.text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* RADAR INFO */}
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                📊
              </div>

              <div>
                <h3 className="font-extrabold text-slate-900">
                  Ko nozīmē radara diagramma?
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Radara diagramma attēlo spēlētāju
                  statistikas vērtības procentīļu skalā.
                  Tas ļauj vienā skatā salīdzināt vairākus
                  statistikas aspektus.
                </p>
              </div>
            </div>
          </div>

          {/* FANTASY INFO */}
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-lg shadow-sm">
                ⚡
              </div>

              <div>
                <h3 className="font-extrabold text-emerald-900">
                  Fantasy punkti
                </h3>

                <p className="mt-2 text-sm leading-6 text-emerald-800/70">
                  Flow izmanto pieejamos statistikas
                  rādītājus, lai aprēķinātu salīdzināmu
                  fantasy punktu vērtību.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-4 border-t border-slate-200 pt-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Data provided by football-data.org
            </p>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-slate-900 px-5 py-3 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Sākt izmantot Flow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}