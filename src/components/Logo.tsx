import React from "react";

interface LogoProps {
  className?: string;
  title?: string;
}

// Inline SVG logo approximated from provided image with blue-purple gradient
export function Logo({ className, title = "LuckyGlide" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      className={className}
    >
      <defs>
        <linearGradient id="lg-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#2CC3FF" />
          <stop offset="100%" stopColor="#6B5CFF" />
        </linearGradient>
      </defs>
      {/* Main flame-like shape */}
      <path
        d="M84 44c42 40 120 52 143 108 20 47-1 106-90 106-74 0-111-63-126-120 19 32 55 47 96 58 32 8 44-14 22-29C110 149 84 140 70 132 26 106 38 41 84 44Z"
        fill="url(#lg-gradient)"
      />
      {/* Inner cut */}
      <path
        d="M76 152c18 22 57 38 82 32 9-2 10-10 3-17-24-24-74-42-94-48 4 13 5 23 9 33Z"
        fill="#ffffff"
        opacity="0.9"
      />
    </svg>
  );
}

export default Logo;


