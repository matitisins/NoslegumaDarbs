/*
 * Attēlo lietotāja ceļvedi par Flow lietotnes izmantošanu.
 * Izskaidro līgu, sezonu un spēlētāju izvēli, spēlētāju
 * statistiku, salīdzināšanu, profilus, favorītus, komandu
 * analīzi, līgas tabulas, analītikas rīkus, Fantasy Team
 * Builder un Captaincy Simulator.
 */

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
            {/* 1 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                1. Izvēlies līgu
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Sāc ar līgas izvēli. Flow ļauj analizēt pieejamos
                spēlētāju un komandu datus no vairākām Eiropas
                futbola līgām, piemēram, Premier League, La Liga,
                Serie A, Bundesliga un Ligue 1.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                2. Izvēlies sezonu
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izvēlies sezonu, kuru vēlies analizēt. Visi
                pieejamie spēlētāju, komandu, līgas tabulu un
                spēļu dati tiek ielādēti atbilstoši izvēlētajai
                līgai un sezonai.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                3. Izvēlies spēlētāju kategoriju
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Spēlētāji ir sadalīti četrās pozīciju grupās.
                Katrai pozīcijai tiek izmantoti tai piemērotākie
                statistikas rādītāji.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Uzbrucēji
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Uzbrukuma produktivitāte, vārtu guvumi,
                    piespēles un iesaiste uzbrukumā.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Pussargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Radošums, progresija, piespēles un iesaiste
                    komandas uzbrukumā.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Aizsargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Aizsardzības statistika, stabilitāte,
                    piespēles un vārtu draudi.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Vārtsargi
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Vārtu sargāšana, stabilitāte, spēļu
                    statistika un tīrās spēles.
                  </p>
                </div>
              </div>
            </section>

            {/* 4 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                4. Atrodi spēlētāju
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izmanto meklēšanu, lai ātri atrastu konkrētu
                spēlētāju. Meklēšana ļauj atrast spēlētājus pēc
                vārda, uzvārda vai kluba.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                5. Apskati spēlētāja statistiku
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Spēlētāju kartītēs iespējams apskatīt galvenos
                statistikas rādītājus, tostarp spēles, minūtes,
                vārtus, piespēles un citus pozīcijai atbilstošus
                rādītājus.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Dažiem spēlētājiem pieejama arī detalizētāka
                statistika un spēlētāja profils.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                6. Salīdzini spēlētājus
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izvēlies divus spēlētājus, lai vienā skatā
                salīdzinātu viņu statistiku. Flow izmanto
                salīdzinājuma tabulas un vizuālus grafikus, lai
                būtu vieglāk redzēt atšķirības starp spēlētājiem.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Salīdzinājumā iespējams apskatīt arī spēlētāju
                formu, statistikas tendences un citus analīzes
                rādītājus.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                7. Spēlētāja profils
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Noklikšķini uz spēlētāja, lai atvērtu detalizētu
                profilu. Profilā iespējams apskatīt spēlētāja
                pamatinformāciju, komandu un statistikas datus.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                8. Favorīti
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Spēlētājus vari pievienot favorītiem, izmantojot
                zvaigznītes pogu. Favorīti ļauj ātrāk atgriezties
                pie spēlētājiem, kurus vēlies regulāri analizēt.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                9. FDR – spēļu grūtības novērtējums
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Flow izmanto FDR jeb Fixture Difficulty Rating,
                lai novērtētu nākamās spēles pretinieka grūtības
                līmeni skalā no 1 līdz 5.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Šis rādītājs palīdz analizēt, kādi pretinieki
                spēlētājam vai komandai ir gaidāmi nākamajās
                spēlēs.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                10. Captaincy Simulator
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Captaincy Simulator ļauj salīdzināt spēlētājus
                kapteiņa lomai. Simulatorā iespējams analizēt
                potenciālo punktu ieguldījumu un redzēt, kā
                kapteiņa izvēle ietekmē kopējo rezultātu.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                11. League Tables
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                League Tables sadaļā iespējams apskatīt izvēlētās
                līgas turnīra tabulu, komandu pozīcijas un
                statistiku.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    League Table
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Komandu pozīcijas, spēles, uzvaras,
                    neizšķirti, zaudējumi, vārti un punkti.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Top Scorers
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Sezonas līderi pēc vārtu guvumiem,
                    piespēlēm un Flow punktiem.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Fixtures & Results
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Nākamās spēles un jaunākie līgas rezultāti.
                  </p>
                </div>
              </div>
            </section>

            {/* 12 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                12. Komandu analīze
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                League Tables sadaļā noklikšķinot uz komandas,
                iespējams atvērt detalizētu komandas skatu.
                Tajā redzama komandas pozīcija, forma, nākamā
                spēle un papildu statistika.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Komandām tiek parādīta arī pēdējo spēļu forma,
                mājas un izbraukuma statistika, kā arī nākamās
                spēles pretinieks un tā grūtības novērtējums.
              </p>
            </section>

            {/* 13 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                13. Komandu salīdzināšana
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                League Tables sadaļā iespējams izvēlēties
                komandas un salīdzināt divas komandas savā
                starpā. Tas ļauj pārskatīt to rezultātus,
                statistiku, formu un spēļu datus vienuviet.
              </p>
            </section>

            {/* 14 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                14. Pēdējo 5 spēļu forma
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Komandu tabulā tiek attēlota pēdējo piecu spēļu
                forma ar uzvarām, neizšķirtiem un zaudējumiem.
                Tas ļauj ātri pārskatīt komandas jaunāko sniegumu.
              </p>
            </section>

            {/* 15 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                15. Pozīcijas izmaiņas līgas tabulā
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Komandas pozīcijas izmaiņas tiek attēlotas ar
                bultiņām, lai varētu redzēt, vai komanda tabulā
                ir pakāpusies vai noslīdējusi.
              </p>
            </section>

            {/* 16 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                16. Player Recommendations
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Analytics Tools sadaļā iespējams izmantot Player
                Recommendations, lai atrastu spēlētājus pēc
                izvēlētā statistikas profila.
              </p>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Šis rīks palīdz ātrāk atrast spēlētājus, kuri
                atbilst konkrētām statistikas prasībām.
              </p>
            </section>

            {/* 17 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                17. Custom Player Ranking
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Custom Player Ranking ļauj izveidot savu spēlētāju
                vērtēšanas modeli. Vari izmantot dažādus
                statistikas rādītājus, lai izveidotu sev
                nepieciešamo spēlētāju reitingu.
              </p>
            </section>

            {/* 18 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                18. Fantasy Team Builder
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fantasy Team Builder ļauj izveidot savu Fantasy
                komandu, izvēloties spēlētājus dažādām pozīcijām
                un izmantojot pieejamās formācijas.
              </p>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Formācija
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Izvēlies sev nepieciešamo komandas
                    formāciju.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Labākais XI
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Automātiski izveido komandas sākumsastāvu
                    pēc spēlētāju prognozētajiem rezultātiem.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Labākā formācija
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Atrod formāciju ar lielāko prognozēto
                    punktu skaitu.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-bold text-slate-900">
                    Rezerves
                  </p>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Automātiski izveido rezerves spēlētāju
                    sarakstu.
                  </p>
                </div>
              </div>
            </section>

            {/* 19 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                19. Fantasy kapteinis un vicekapteinis
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Izveidotajā Fantasy komandā iespējams izvēlēties
                kapteini un vicekapteini. Kapteiņa izvēle tiek
                ņemta vērā komandas Gameweek punktu prognozē.
              </p>
            </section>

            {/* 20 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                20. Gameweek prognoze
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Fantasy Team Builder parāda prognozēto Gameweek
                punktu skaitu izvēlētajam sākumsastāvam. Prognozē
                tiek ņemti vērā izvēlētie spēlētāji un kapteiņa
                dubultais ieguldījums.
              </p>
            </section>

            {/* 21 */}
            <section>
              <h3 className="text-lg font-black text-slate-900">
                21. Datu atjaunošana
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Ja nepieciešams iegūt jaunākos pieejamos datus,
                izmanto atjaunošanas pogu. Tā ļauj atkārtoti
                ielādēt izvēlētās līgas un sezonas informāciju no
                API.
              </p>
            </section>

            {/* Goal */}
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-bold text-emerald-900">
                Flow mērķis
              </p>

              <p className="mt-2 text-sm leading-6 text-emerald-800">
                Flow ir futbola analītikas platforma, kas apvieno
                spēlētāju salīdzināšanu, detalizētu statistiku,
                komandu un līgu analīzi, Fantasy komandas
                veidošanu un citus analītikas rīkus vienuviet.
                Lietotājs var izvēlēties līgu un sezonu, analizēt
                spēlētājus un komandas un izmantot pieejamos
                statistikas datus, lai veiktu detalizētāku
                futbola analīzi.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}