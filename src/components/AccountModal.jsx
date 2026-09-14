// src/components/AccountModal.jsx

import React from "react";

export default function AccountModal({
  username,
  avatar,
  onUsernameChange,
  onFileChange,
  onSave,
  onClose,
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-slate-900 mb-4">
          Tavs Konts
        </h3>

        <form
          onSubmit={onSave}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Lietotājvārds
            </label>

            <input
              type="text"
              value={username}
              onChange={(event) =>
                onUsernameChange(event.target.value)
              }
              className="w-full bg-slate-50 border border-slate-300 text-sm rounded-lg p-2.5 text-slate-800 focus:outline-none focus:border-emerald-500"
              required
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
              Augšupielādēt profila bildi
            </label>

            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onFileChange}
              className="w-full bg-slate-50 border border-slate-300 text-sm rounded-lg p-2"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <img
              src={avatar}
              alt="Profila priekšskatījums"
              className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500"
            />

            <span className="text-xs text-slate-400">
              Priekšskatījums
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Atcelt
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg"
            >
              Saglabāt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}