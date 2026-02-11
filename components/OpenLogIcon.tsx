export function OpenLogIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left Bracket - Structural Metal (Zinc 500) */}
      <path
        d="M14 6H10C7.79 6 6 7.79 6 10V22C6 24.21 7.79 26 10 26H14"
        stroke="#71717A"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Right Bracket - Vibrant Red with inner fluid glow */}
      <path
        d="M18 6H22C24.21 6 26 7.79 26 10V22C26 24.21 24.21 26 22 26H18V6Z"
        fill="#FF4D4D"
        fillOpacity="0.2"
      />
      <path
        d="M18 6H22C24.21 6 26 7.79 26 10V22C26 24.21 24.21 26 22 26H18"
        stroke="#FF4D4D"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
