// src/components/GuideModal.jsx

import React from "react";

export default function GuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm
                 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto
                   rounded-2xl shadow-xl border border-slate-200 p-6"
        onClick={(e) => e.stopPropagation()}
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
            className="text-slate-400 hover:text-slate-700
                       text-xl font-bold px-2"
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
              Flow ir futbola spēlētāju salīdzināšanas un analīzes
              rīks, kas palīdz ātri izvērtēt, kurš spēlētājs varētu
              būt labāka izvēle Fantasy Football komandai.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              🎯 Kam tas paredzēts?
            </h3>

            <p>
              Lietotne ir paredzēta Fantasy Football spēlētājiem,
              kuri vēlas salīdzināt divus spēlētājus, apskatīt viņu
              statistiku un pieņemt pamatotāku lēmumu par sastāvu.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              1. Izvēlies sezonu un turnīru
            </h3>

            <p>
              Sākumā izvēlies sezonu un līgu, kuru vēlies analizēt.
              Flow parādīs pieejamās spēlētāju kategorijas.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              2. Izvēlies kategoriju
            </h3>

            <p>
              Izvēlies spēlētāju kategoriju, piemēram, vārtsargus,
              aizsargus, pussargus vai uzbrucējus.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              3. Salīdzini spēlētājus
            </h3>

            <p className="mb-3">
              Pēc kategorijas izvēles vari izvēlēties divus
              spēlētājus, kurus vēlies salīdzināt.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <p className="font-semibold text-slate-800 mb-2">
                Ko vari redzēt?
              </p>

              <ul className="space-y-2 list-disc list-inside">
                <li>Radarā — spēlētāju statistikas salīdzinājumu.</li>
                <li>Fantasy punktus — kopējo rezultātu.</li>
                <li>Pozīcijas specifisko statistiku.</li>
                <li>Pēdējo 5 spēļu formu.</li>
                <li>Kapteiņa izvēles prognozi.</li>
              </ul>
            </div>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              📊 Radara diagramma
            </h3>

            <p>
              Radara diagramma ļauj vizuāli salīdzināt abu spēlētāju
              stiprās un vājās puses. Jo tālāk statistikas rādītājs
              atrodas no centra, jo labāks ir rezultāts konkrētajā
              kategorijā.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              📈 Pēdējo spēļu forma
            </h3>

            <p>
              Formas diagramma parāda spēlētāja pēdējo piecu spēļu
              rezultātus. Tas palīdz saprast, vai spēlētāja sniegums
              šobrīd uzlabojas vai pasliktinās.
            </p>
          </section>

          <section>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              👑 Kapteiņa izvēles prognoze
            </h3>

            <p>
              Flow izmanto spēlētāja punktu rezultātus un pretinieka
              kalendāra sarežģītību (FDR), lai izveidotu vienkāršotu
              nākamās kārtas prognozi. Spēlētājs ar augstāku prognozi
              tiek atzīmēts kā ieteicamā kapteiņa izvēle.
            </p>
          </section>

          <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h3 className="font-bold text-emerald-700 mb-1">
              💡 Īsumā
            </h3>

            <p className="text-emerald-800">
              Izvēlies līgu → izvēlies kategoriju → izvēlies divus
              spēlētājus → salīdzini statistiku → izvēlies labāko
              Fantasy variantu.
            </p>
          </section>
        </div>

        <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500
                       text-white rounded-lg text-sm font-bold
                       transition-colors"
          >
            Sapratu
          </button>
        </div>
      </div>
    </div>
  );
}