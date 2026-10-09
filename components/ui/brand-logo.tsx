import React from "react";

interface BrandLogoProps {
  size?: number;
  className?: string;
  withBackground?: boolean;
  priority?: boolean;
}

export default function BrandLogo({
  size = 48,
  className = "",
  withBackground = true,
}: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Finance Journal Logo"
      role="img"
    >
      <defs>
        <linearGradient id="blBgGrad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#193f2d" />
          <stop offset="100%" stopColor="#0b1e15" />
        </linearGradient>
        <linearGradient id="blApexGrad" x1="69" y1="82" x2="69" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#a7f3d0" />
        </linearGradient>
        <filter id="blGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {withBackground && (
        <>
          {/* iOS-style super-ellipse squircle */}
          <rect width="100" height="100" rx="22.5" fill="url(#blBgGrad)" />
          {/* Subtle top edge highlight */}
          <rect
            x="0.5"
            y="0.5"
            width="99"
            height="99"
            rx="22"
            fill="none"
            stroke="white"
            strokeOpacity="0.12"
          />
        </>
      )}

      {/* 4 Ascending Semicircular Capsule Pills (100% Round Caps, Zero Sharp Edges) */}
      {/* Pillar 1 */}
      <rect x="18" y="56" width="11" height="26" rx="5.5" fill="#4E8570" />
      {/* Pillar 2 */}
      <rect x="35" y="44" width="11" height="38" rx="5.5" fill="#6FA08C" />
      {/* Pillar 3 */}
      <rect x="52" y="34" width="11" height="48" rx="5.5" fill="#86EFAC" />
      {/* Pillar 4 (Apex) */}
      <rect x="69" y="32" width="11" height="50" rx="5.5" fill="url(#blApexGrad)" />

      {/* Floating Beacon Crest (100% Whole, Safe Breathing Room cy=18) */}
      <circle
        cx="74.5"
        cy="18"
        r="10"
        stroke="#86EFAC"
        strokeWidth="1.5"
        strokeDasharray="2.5 2.5"
        opacity="0.6"
      />
      <circle cx="74.5" cy="18" r="5.5" fill="#FFFFFF" filter="url(#blGlow)" />
      <circle cx="74.5" cy="18" r="2.8" fill="#34d399" />
    </svg>
  );
}
