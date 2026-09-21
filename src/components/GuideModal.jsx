import React from "react";

export default function GuideModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Flow
            </p>

            <h2 className="mt-1 text-2xl font-black text-slate-900">
              Kā darbojas Flow?
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-xl font-bold text-slate-600 transition hover:bg-slate-200"
            aria-label="Aizvērt"
          >
            ×
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-6">
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-black text-slate-900">
                1. Izvēlies līgu
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izvēlies vienu no pieejamajām Eiropas līgām.
                Flow izmanto futbola datus, lai parādītu
                pieejamos spēlētājus un viņu statistiku.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                2. Izvēlies sezonu
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izvēlies sezonu, kuru vēlies analizēt.
                Spēlētāju dati tiek ielādēti atbilstoši
                izvēlētajai līgai un sezonai.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                3. Izvēlies spēlētāju kategoriju
              </h3>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Uzbrucēji
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Uzbrukuma spēlētāji un vārtu guvēji.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Pussargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Spēlētāji, kas galvenokārt darbojas
                    laukuma vidusdaļā.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Aizsargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Aizsardzības līnijas spēlētāji.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Vārtsargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Komandas vārtsargi.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                4. Salīdzini spēlētājus
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izvēlies divus spēlētājus un salīdzini viņu
                statistiku vienā skatā. Flow parāda galvenos
                statistikas rādītājus, formas tendences un
                citus salīdzināšanas datus.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                5. Spēlētāja profils
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Noklikšķini uz spēlētāja, lai atvērtu detalizētu
                statistikas skatu.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                6. Favorīti
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Spēlētājus vari pievienot favorītiem, lai tiem
                būtu ērtāk piekļūt vēlāk.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-black text-slate-900">
                7. Captaincy Simulator
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Salīdzināšanas skatā iespējams izmantot kapteiņa
                simulāciju, lai apskatītu abu spēlētāju
                potenciālos rezultātus.
              </p>
            </section>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-900">
                Flow mērķis
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Flow ir spēlētāju salīdzināšanas platforma,
                kas palīdz vienuviet apskatīt un salīdzināt
                futbola spēlētāju statistiku.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}