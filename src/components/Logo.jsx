// src/components/Logo.jsx
import React from "react";

export default function Logo({ className = "w-7 h-7" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Flow logo"
      role="img"
    >
      <defs>
        <linearGradient
          id="flowGradient"
          x1="2"
          y1="2"
          x2="30"
          y2="30"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#047857" />
        </linearGradient>
      </defs>

      <rect
        width="32"
        height="32"
        rx="8"
        fill="url(#flowGradient)"
      />

      <path
        d="M7 19C10 19 11 13 14 13C17 13 18 21 21 21C24 21 25 11 27 11"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="14" cy="13" r="1.5" fill="white" />
      <circle cx="21" cy="21" r="1.5" fill="white" />
    </svg>
  );
}