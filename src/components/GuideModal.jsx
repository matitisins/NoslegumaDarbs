import React, { useEffect, useMemo, useState } from "react";

const GUIDE_SECTIONS = [
  {
    number: "01", icon: "⚙", category: "SĀKUMS", title: "Līga un sezona",
    description: "Izvēlies sacensības un sezonu, lai pārējās sadaļas izmantotu atbilstošos pieejamos datus.",
    bullets: ["Izvēlies pieejamo līgu.", "Izvēlies sezonu, kuru vēlies analizēt.", "Ja dati šķiet novecojuši, izmanto datu atjaunošanas pogu."],
    keywords: "league season competition līga sezona turnīrs"
  },
  {
    number: "02", icon: "⌕", category: "SPĒLĒTĀJI", title: "Atrodi spēlētāju",
    description: "Meklē pēc spēlētāja vārda, uzvārda vai kluba un atver kartīti, lai apskatītu pieejamos rādītājus.",
    bullets: ["Izvēlies pozīciju kategoriju: uzbrucēji, pussargi, aizsargi vai vārtsargi.", "Salīdzini statistiku, kas atbilst konkrētajai pozīcijai.", "Atver spēlētāja profilu detalizētākai informācijai."],
    keywords: "player search players forward midfielder defender goalkeeper profile spēlētājs meklēšana"
  },
  {
    number: "03", icon: "◈", category: "SPĒLĒTĀJI", title: "Spēlētāju salīdzināšana",
    description: "Izvēlies divus spēlētājus un salīdzini viņu pieejamos rādītājus vienā skatā.",
    bullets: ["Izmanto radar diagrammu, lai pamanītu stiprās puses.", "Pārskati statistikas tabulu un papildu rādītājus.", "Salīdzinājumā redzamie dati ir atkarīgi no API un izvēlētās sezonas."],
    keywords: "compare comparison radar chart statistika salīdzinājums"
  },
  {
    number: "04", icon: "☆", category: "SPĒLĒTĀJI", title: "Favorīti",
    description: "Saglabā spēlētājus, kuriem vēlies ātri piekļūt atkārtotai analīzei.",
    bullets: ["Nospied zvaigznītes ikonu, lai pievienotu vai noņemtu favorītu.", "Izmanto favorītus, lai ātrāk atgrieztos pie interesējošajiem spēlētājiem."],
    keywords: "favorites favourite favorīti zvaigzne"
  },
  {
    number: "05", icon: "▥", category: "KOMANDAS", title: "Komandu analīze",
    description: "Izvēlies divas komandas un apskati sezonas sniegumu un savstarpējo spēļu vēsturi.",
    bullets: ["Salīdzini uzvaras, neizšķirtus, zaudējumus un vārtu rādītājus.", "Pārskati vizuālos salīdzinājumus, ja attiecīgie dati ir pieejami.", "H2H sadaļā apskati pieejamās savstarpējās spēles."],
    keywords: "team teams club h2h komanda salīdzināt"
  },
  {
    number: "06", icon: "☷", category: "LĪGA", title: "League Tables",
    description: "Apskati turnīra tabulu, komandu pozīcijas un sezonas rezultātus.",
    bullets: ["Pārbaudi spēles, uzvaras, neizšķirtus, zaudējumus, vārtu starpību un punktus.", "Izmanto pieejamos formu un pozīciju indikatorus.", "Atver komandas informāciju, ja tabulā pieejama klikšķināma komanda."],
    keywords: "league table standings tabula līgas pozīcija punkti"
  },
  {
    number: "07", icon: "↗", category: "ANALĪTIKA", title: "Analytics Tools",
    description: "Izmanto papildu rīkus, lai izvērtētu spēlētājus un viņu piemērotību izvēlētajiem kritērijiem.",
    bullets: ["Player Recommendations palīdz atlasīt spēlētājus pēc izvēlētā profila.", "Izmanto pozīcijas, spēles stila un meklēšanas filtrus, lai sašaurinātu rezultātus.", "Rezultāti ir analītiski palīgrīki, nevis garantēta prognoze."],
    keywords: "analytics tools recommendations ieteikumi spēlētāju atlase"
  },
  {
    number: "08", icon: "⚑", category: "FANTASY", title: "Fantasy Team Builder",
    description: "Veido Fantasy sastāvu, izmantojot pieejamos spēlētājus un komandas ierobežojumus.",
    bullets: ["Izvēlies formāciju un aizpildi pozīcijas.", "Sekojiet budžetam un sastāva ierobežojumiem.", "Izmanto ieteikto sākumsastāvu vai labākās formācijas rīkus, ja tie ir pieejami."],
    keywords: "fantasy team builder squad budget formation sastāvs budžets"
  },
  {
    number: "09", icon: "✦", category: "FANTASY", title: "Kapteinis un Gameweek",
    description: "Izvēlies kapteini un vicekapteini un apskati sastāva prognozēto punktu ieguldījumu.",
    bullets: ["Kapteiņa izvēle ietekmē prognozēto kopējo rezultātu.", "FDR novērtē pretinieka grūtību, ja šie dati ir pieejami.", "Prognozes ir aptuvenas un negarantē reālo rezultātu."],
    keywords: "captain vice captain captaincy simulator gameweek fdr kapteinis"
  },
  {
    number: "10", icon: "ⓘ", category: "DATI", title: "Kā interpretēt rādītājus",
    description: "Flow apvieno pieejamos futbola datus ar lietotnes aprēķinātiem analītiskiem rādītājiem.",
    bullets: ["Flow punkti nav oficiālie Fantasy Premier League punkti.", "Projected GW ir aptuvens novērtējums, nevis garantēts rezultāts.", "Recommendation Score nav procentuāla varbūtība.", "Ja vērtība ir tukša vai nav pieejama, API, iespējams, šo statistiku nav sniedzis."],
    keywords: "flow points projected recommendation score data api dati prognoze"
  }
];

export default function GuideModal({ onClose }) {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("VISS");
  const [expanded, setExpanded] = useState("01");

  useEffect(() => {
    const onKeyDown = event => {
      if (event.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const categories = ["VISS", ...new Set(GUIDE_SECTIONS.map(item => item.category))];
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("lv");
    return GUIDE_SECTIONS.filter(item => {
      const categoryMatch = activeCategory === "VISS" || item.category === activeCategory;
      const searchText = `${item.title} ${item.description} ${item.bullets.join(" ")} ${item.keywords}`.toLocaleLowerCase("lv");
      return categoryMatch && (!normalized || searchText.includes(normalized));
    });
  }, [query, activeCategory]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020A07]/80 p-3 backdrop-blur-md sm:p-6"
      onMouseDown={event => { if (event.target === event.currentTarget) onClose?.(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="flow-guide-title"
        className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-[28px] border border-emerald-300/20 bg-[#071A13] text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-emerald-300/15 bg-[radial-gradient(ellipse_at_top_right,rgba(57,229,140,0.18),transparent_48%),linear-gradient(120deg,#071A13,#0D2B20_60%,#101D29)] px-5 py-6 sm:px-8 sm:py-8">
          <div className="absolute -right-8 -top-16 h-56 w-56 rounded-full border border-emerald-300/10" />
          <div className="absolute -right-1 -top-8 h-40 w-40 rounded-full border border-emerald-300/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-[#39E58C]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39E58C] shadow-[0_0_10px_#39E58C]" /> FLOW PLAYBOOK
              </div>
              <h2 id="flow-guide-title" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Iepazīsti Flow</h2>
              <p className="mt-2 max-w-2xl text-xs leading-6 text-slate-300 sm:text-sm">
                Ātrs ceļvedis spēlētāju analīzei, komandu salīdzināšanai un Fantasy lēmumiem.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold text-slate-300">
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">10 ceļveža tēmas</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">Meklē pēc atslēgvārda</span>
                <span className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5">Dati atkarīgi no API</span>
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Aizvērt ceļvedi" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xl text-slate-300 transition hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-white">×</button>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-b border-emerald-300/10 bg-[#091E16] px-4 py-4 sm:px-8">
          <label className="relative block">
            <span className="sr-only">Meklēt ceļvedī</span>
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-lg text-[#39E58C]">⌕</span>
            <input
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Meklē, piemēram, Fantasy, H2H, favorīti..."
              className="w-full rounded-xl border border-emerald-300/15 bg-[#06140F] py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-[#39E58C]/60 focus:ring-2 focus:ring-[#39E58C]/10"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button key={category} type="button" onClick={() => setActiveCategory(category)} className={`shrink-0 rounded-lg border px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] transition ${activeCategory === category ? "border-[#39E58C]/40 bg-[#39E58C]/10 text-[#39E58C]" : "border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/20 hover:text-white"}`}>
                {category === "VISS" ? "Visas tēmas" : category}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#39E58C]">QUICK GUIDE</p>
              <h3 className="mt-1 text-sm font-extrabold text-white">Atrodi vajadzīgo sadaļu</h3>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-bold text-slate-400">{filtered.length} {filtered.length === 1 ? "tēma" : "tēmas"}</span>
          </div>

          {filtered.length ? (
            <div className="grid gap-3 lg:grid-cols-2">
              {filtered.map(item => {
                const isOpen = expanded === item.number;
                return (
                  <article key={item.number} className={`overflow-hidden rounded-2xl border transition ${isOpen ? "border-[#39E58C]/35 bg-[#0C261B] shadow-[0_0_0_1px_rgba(57,229,140,0.04)]" : "border-white/[0.09] bg-white/[0.025] hover:border-white/20 hover:bg-white/[0.04]"}`}>
                    <button type="button" aria-expanded={isOpen} onClick={() => setExpanded(isOpen ? "" : item.number)} className="flex w-full items-start gap-3 p-4 text-left">
                      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border text-lg ${isOpen ? "border-[#39E58C]/25 bg-[#39E58C]/10 text-[#39E58C]" : "border-white/10 bg-[#071A13] text-slate-300"}`}>{item.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[9px] font-black tracking-[0.15em] text-slate-500">{item.number}</span>
                          <span className="rounded-md bg-white/[0.05] px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-slate-400">{item.category}</span>
                        </span>
                        <span className="mt-1 block text-sm font-extrabold text-white">{item.title}</span>
                        <span className="mt-1 block text-xs leading-5 text-slate-400">{item.description}</span>
                      </span>
                      <span className={`mt-1 text-sm transition ${isOpen ? "rotate-180 text-[#39E58C]" : "text-slate-500"}`}>⌄</span>
                    </button>
                    {isOpen && (
                      <div className="border-t border-emerald-300/10 px-4 pb-4 pt-3">
                        <p className="mb-2 text-[9px] font-black uppercase tracking-[0.16em] text-[#39E58C]">Kā to izmantot</p>
                        <ul className="space-y-2">
                          {item.bullets.map((bullet, index) => (
                            <li key={index} className="flex gap-2 text-xs leading-5 text-slate-300">
                              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#39E58C]" />
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/15 px-5 py-12 text-center">
              <span className="text-3xl text-slate-500">⌕</span>
              <p className="mt-3 text-sm font-bold text-white">Nekas netika atrasts</p>
              <p className="mt-1 text-xs text-slate-400">Pamēģini citu atslēgvārdu vai izvēlies “Visas tēmas”.</p>
              <button type="button" onClick={() => { setQuery(""); setActiveCategory("VISS"); }} className="mt-4 rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-xs font-bold text-[#39E58C] hover:bg-emerald-300/15">Notīrīt meklēšanu</button>
            </div>
          )}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-300/15 bg-gradient-to-br from-emerald-300/[0.08] to-transparent p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#39E58C]">Atceries</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Flow punkti un spēļu prognozes ir projekta analītiski aprēķini, nevis oficiāli Fantasy punkti vai garantēts rezultāts.</p>
            </div>
            <div className="rounded-2xl border border-violet-300/15 bg-gradient-to-br from-violet-300/[0.07] to-transparent p-4">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-violet-300">Datu pieejamība</p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Statistika var atšķirties pēc līgas, sezonas un API datu pieejamības. Trūkstošas vērtības nav jāuztver kā nulle.</p>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-emerald-300/15 bg-[#06140F] px-4 py-3 sm:px-8">
          <p className="text-[10px] text-slate-500">FLOW FOOTBALL ANALYTICS <span className="mx-1 text-slate-700">/</span> Lietotāja ceļvedis</p>
          <button type="button" onClick={onClose} className="rounded-xl bg-[#39E58C] px-5 py-2.5 text-xs font-black text-[#052015] shadow-[0_6px_22px_rgba(57,229,140,0.16)] transition hover:bg-emerald-300">Sapratu — sākt analīzi <span className="ml-1">→</span></button>
        </footer>
      </section>
    </div>
  );
}
