// src/components/GuideModal.jsx

import React from "react";

export default function GuideModal({
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border border-slate-200 p-6"
        onClick={(event) =>
          event.stopPropagation()
        }
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-xs uppercase tracking-wider font-bold text-emerald-600 mb-1">
              Flow Guide
            </p>

            <h2 className="text-2xl font-extrabold text-slate-900">
              Kā darbojas Flow?
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 text-xl font-bold px-2"
            aria-label="Aizvērt"
          >
            ×
          </button>
        </div>

        <div className="space-y-6 text-sm text-slate-600">
          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              ⚽ Kas ir Flow?
            </h3>

            <p>
              Flow ir futbola spēlētāju
              salīdzināšanas un analīzes rīks.
              Tas izmanto API-Sports datus, lai
              salīdzinātu spēlētāju statistiku.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              🎯 Kam tas paredzēts?
            </h3>

            <p>
              Lietotne paredzēta Fantasy Football
              spēlētājiem, kuri vēlas ātri
              salīdzināt divus spēlētājus.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              1. Izvēlies sezonu un turnīru
            </h3>

            <p>
              Izvēlies sezonu un līgu. Flow
              ielādēs spēlētāju statistiku no
              API-Sports.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              2. Izvēlies kategoriju
            </h3>

            <p>
              Izvēlies vārtsargus, aizsargus,
              pussargus vai uzbrucējus.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              3. Salīdzini spēlētājus
            </h3>

            <p className="mb-3">
              Izvēlies divus spēlētājus un apskati
              viņu statistiku.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-800 mb-2">
                Ko vari redzēt?
              </p>

              <ul className="space-y-2 list-disc list-inside">
                <li>
                  Radara statistikas salīdzinājumu.
                </li>

                <li>
                  Fantasy punktus.
                </li>

                <li>
                  Pozīcijas statistiku.
                </li>

                <li>
                  Spēlētāja sezonas formu.
                </li>

                <li>
                  Kapteiņa izvēles prognozi.
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              📊 Radara diagramma
            </h3>

            <p>
              Radars vizuāli parāda abu spēlētāju
              statistikas stiprās un vājās puses.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              📈 Spēlētāja forma
            </h3>

            <p>
              Diagramma parāda aprēķinātu formu,
              izmantojot API pieejamos sezonas
              statistikas datus.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              👑 Kapteiņa izvēles prognoze
            </h3>

            <p>
              Flow izmanto Fantasy punktus un
              spēlētāja reitingu, lai izveidotu
              vienkāršotu kapteiņa prognozi.
            </p>
          </section>

          <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="font-bold text-emerald-700 mb-1">
              💡 Īsumā
            </h3>

            <p className="text-emerald-800">
              Izvēlies līgu → izvēlies kategoriju
              → izvēlies divus spēlētājus →
              salīdzini statistiku → izvēlies
              labāko Fantasy variantu.
            </p>
          </section>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold transition-colors"
          >
            Sapratu
          </button>
        </div>
      </div>
    </div>
  );
}