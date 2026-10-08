/*
 * Nodrošina lokālā lietotāja profila logu, kurā var apskatīt un mainīt
 * lietotājvārdu un profila attēlu, kā arī saglabāt vai atcelt veiktās
 * izmaiņas. Šis nav autentifikācijas konts ar servera sesiju vai paroli.
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

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      onMouseDown={e => {
        if (e.target === e.currentTarget) {
          onClose?.();
        }
      }}
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-slate-950 px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300">
                Flow Football Analytics
              </p>

              <h2 className="mt-1 text-xl font-black">
                Mans profils
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Lokāls profils šajā pārlūkā. Tas nav autentifikācijas konts.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Aizvērt"
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-slate-300 transition hover:bg-white/20 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <form
          onSubmit={onSave}
          className="p-6"
        >
          <div className="flex flex-col items-center">
            <div className="relative">
              {avatar ? (
                <img
                  src={avatar}
                  alt="Profila attēls"
                  className="h-24 w-24 rounded-3xl object-cover shadow-sm ring-4 ring-slate-100"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-950 text-2xl font-black text-white ring-4 ring-slate-100">
                  {initials(username)}
                </div>
              )}

              <label
                htmlFor="flow-avatar-upload"
                title="Mainīt profila attēlu"
                className="absolute -bottom-2 -right-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-emerald-500 text-sm font-black text-white shadow-md transition hover:bg-emerald-600"
              >
                +
              </label>

              <input
                id="flow-avatar-upload"
                type="file"
                accept="image/*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>

            <p className="mt-3 text-center text-xs text-slate-400">
              Noklikšķini uz +, lai augšupielādētu attēlu.
              <br />
              JPG, PNG vai WEBP · maksimālais faila izmērs: 2 MB.
              <br />
              Attēls pirms saglabāšanas tiek automātiski samazināts.
            </p>

            {fileError && (
              <div
                role="alert"
                className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3"
              >
                <p className="text-xs font-bold leading-5 text-red-700">
                  {fileError}
                </p>
              </div>
            )}
          </div>

          <div className="mt-7">
            <label
              htmlFor="flow-username"
              className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-slate-400"
            >
              Lietotājvārds
            </label>

            <input
              id="flow-username"
              type="text"
              value={username}
              onChange={e =>
                onUsernameChange?.(
                  e.target.value
                )
              }
              maxLength={40}
              autoComplete="name"
              placeholder="Ievadi savu vārdu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </div>

          <div className="mt-7 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50"
            >
              Atcelt
            </button>

            <button
              type="submit"
              disabled={Boolean(fileError)}
              className="flex-1 rounded-xl bg-emerald-500 px-4 py-3 text-xs font-black text-white shadow-sm transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Saglabāt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}