/*
 * Flow Football Analytics — local profile modal.
 * Close and Cancel use one explicit close handler; Save remains a separate submit action.
 */
import React from "react";

const initials = name =>
  String(name || "")
    .trim()
    .split(/\s+/)
    .map(part => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "M";

export default function AccountModal({
  open = true,
  username = "",
  avatar = "",
  fileError = "",
  onUsernameChange,
  onFileChange,
  onSave,
  onClose,
}) {
  if (!open) return null;

  const closeModal = event => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (typeof onClose === "function") onClose();
  };

  const submitForm = event => {
    event.preventDefault();
    if (typeof onSave === "function") onSave(event);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-[#020914]/75 p-4 backdrop-blur-md sm:p-6"
      onMouseDown={event => {
        if (event.target === event.currentTarget) closeModal(event);
      }}
      onKeyDown={event => {
        if (event.key === "Escape") closeModal(event);
      }}
      tabIndex={-1}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="flow-account-title"
        className="relative my-auto w-full max-w-xl overflow-hidden rounded-[28px] border border-emerald-400/25 bg-[#071B14] text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)]"
        onMouseDown={event => event.stopPropagation()}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-400 via-[#39E58C] to-violet-400" />
        <header className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(ellipse_at_top_right,rgba(57,229,140,0.15),transparent_55%),linear-gradient(135deg,#071B14,#08111F)] px-6 pb-6 pt-7 sm:px-8 sm:pt-8">
          <div className="absolute -right-12 -top-16 h-44 w-44 rounded-full border border-emerald-300/10" />
          <div className="absolute -right-4 -top-8 h-28 w-28 rounded-full border border-emerald-300/10" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[#39E58C] shadow-[0_0_10px_rgba(57,229,140,0.9)]" />
                <p className="text-[9px] font-black uppercase tracking-[0.22em] text-[#39E58C]">Flow Football Analytics</p>
              </div>
              <h2 id="flow-account-title" className="mt-3 text-2xl font-black tracking-tight sm:text-3xl">Mans profils<span className="text-[#39E58C]">.</span></h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">Pielāgo savu profilu un padari savu Flow pieredzi personīgāku.</p>
            </div>
            <button type="button" onClick={closeModal} aria-label="Aizvērt profilu" className="relative z-10 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-white/10 bg-white/[0.06] text-xl text-slate-300 transition hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60">
              ×
            </button>
          </div>
          <div className="relative mt-6 flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-black/20 p-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 text-xs font-black text-[#39E58C]">{initials(username)}</div>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-white">{String(username || "").trim() || "Tavs lietotājvārds"}</p><p className="mt-0.5 text-[10px] text-slate-400">Lokālais profils · Saglabāts šajā pārlūkā</p></div>
            <span className="rounded-full border border-emerald-400/20 bg-emerald-400/[0.08] px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-wider text-[#39E58C]">Aktīvs</span>
          </div>
        </header>

        <form onSubmit={submitForm} className="space-y-6 px-5 py-6 sm:px-8 sm:py-7">
          <div className="grid gap-5 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-center">
            <div className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#0B241A] p-5">
              <div className="relative">
                {avatar ? <img src={avatar} alt="Profila attēls" className="h-28 w-28 rounded-[26px] border border-white/10 object-cover shadow-[0_10px_30px_rgba(0,0,0,0.35)] ring-2 ring-emerald-400/25" /> : <div className="flex h-28 w-28 items-center justify-center rounded-[26px] border border-emerald-400/20 bg-gradient-to-br from-emerald-400/20 to-violet-400/20 text-3xl font-black text-white ring-2 ring-emerald-400/20">{initials(username)}</div>}
                <label htmlFor="flow-avatar-upload" title="Mainīt profila attēlu" className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border-2 border-[#071B14] bg-[#10B981] text-xl font-black text-white shadow-lg transition hover:scale-105 hover:bg-[#39E58C] hover:text-[#052016]">+</label>
                <input id="flow-avatar-upload" type="file" accept="image/*" onChange={onFileChange} className="hidden" />
              </div>
              <p className="mt-4 text-center text-xs font-bold text-white">Profila attēls</p>
              <p className="mt-1 text-center text-[10px] leading-4 text-slate-500">Noklikšķini uz +, lai mainītu</p>
            </div>
            <div className="space-y-3">
              <div><p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#39E58C]">Tavs profils</p><h3 className="mt-1 text-lg font-extrabold text-white">Padari to par savu</h3><p className="mt-1 text-xs leading-5 text-slate-400">Izmanto savu vārdu un attēlu, lai vieglāk atpazītu savu profilu.</p></div>
              <div className="rounded-xl border border-white/10 bg-black/20 px-3.5 py-3"><div className="flex items-center justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Attēla prasības</span><span className="rounded-md bg-white/[0.06] px-2 py-1 text-[9px] font-bold text-slate-300">MAX 2 MB</span></div><p className="mt-2 text-xs leading-5 text-slate-400">JPG, PNG vai WEBP. Attēls pirms saglabāšanas tiek automātiski samazināts.</p></div>
              {fileError && <div role="alert" className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3.5 py-3"><p className="text-xs font-semibold leading-5 text-rose-200">{fileError}</p></div>}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#0A2118] p-4 sm:p-5">
            <label htmlFor="flow-username" className="mb-2.5 flex items-center justify-between gap-3"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-300">Lietotājvārds</span><span className="text-[10px] text-slate-500">Līdz 40 rakstzīmēm</span></label>
            <input id="flow-username" type="text" value={username} onChange={event => onUsernameChange?.(event.target.value)} maxLength={40} autoComplete="name" placeholder="Ievadi savu vārdu..." className="w-full rounded-xl border border-white/10 bg-[#06150F] px-4 py-3.5 text-sm font-semibold text-white outline-none transition placeholder:text-slate-600 hover:border-white/20 focus:border-emerald-400/70 focus:ring-2 focus:ring-emerald-400/15" />
            <p className="mt-2 text-[10px] text-slate-500">Šis profils ir lokāls šajā pārlūkā un nav autentifikācijas konts.</p>
          </div>
          <div className="flex flex-col-reverse gap-3 border-t border-white/[0.08] pt-5 sm:flex-row sm:justify-end">
            <button type="button" onClick={closeModal} className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-5 py-3 text-xs font-extrabold text-slate-300 transition hover:border-white/20 hover:bg-white/[0.08] hover:text-white focus:outline-none focus:ring-2 focus:ring-white/20 sm:min-w-32">Atcelt</button>
            <button type="submit" disabled={Boolean(fileError)} className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#39E58C] px-6 py-3 text-xs font-black text-[#042116] shadow-[0_8px_24px_rgba(16,185,129,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_30px_rgba(16,185,129,0.28)] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-emerald-300/60 sm:min-w-40"><span>✓</span>Saglabāt profilu</button>
          </div>
        </form>
      </section>
    </div>
  );
}
