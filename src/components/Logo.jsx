import React from "react";

export default function Logo({
  className = "h-9 w-9",
}) {
  return (
    <div
      className={`flex items-center justify-center rounded-xl bg-slate-950 text-white ${className}`}
      aria-label="Flow"
    >
      <svg
        viewBox="0 0 40 40"
        className="h-full w-full p-1.5"
        fill="none"
      >
        <path
          d="M11 9.5 20 5l9 4.5v10L20 24l-9-4.5v-10Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="M11 19.5V30l9 4.5 9-4.5V19.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />

        <path
          d="M20 14v10"
          stroke="#10b981"
          strokeWidth="2.4"
          strokeLinecap="round"
        />

        <path
          d="m15.5 16.5 4.5 2.3 4.5-2.3"
          stroke="#10b981"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}