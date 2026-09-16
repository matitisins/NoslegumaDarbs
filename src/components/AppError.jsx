import React from "react";

export default function AppError({
  error,
  onRetry,
  title = "API kļūda",
  retryText = "Mēģināt vēlreiz",
}) {
  if (!error) {
    return null;
  }

  return (
    <div className="mb-8 rounded-2xl border border-red-200 bg-red-50 p-6">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100 text-lg text-red-600">
          !
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-bold text-red-700">
            {title}
          </h2>

          <p className="mt-1 text-sm leading-6 text-red-600">
            {typeof error === "string"
              ? error
              : error?.message ||
                "Nezināma API kļūda."}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-500"
            >
              {retryText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}