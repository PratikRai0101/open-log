import { OpenLogIcon } from "./OpenLogIcon";

export function OpenLogLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <OpenLogIcon className="w-8 h-8" />
      <span
        className="font-bold text-xl text-white"
        style={{ fontFamily: 'var(--font-space-grotesk), sans-serif', letterSpacing: '-0.05em' }}
      >
        OpenLog<span className="text-[#FF4D4D]">.</span>
      </span>
    </div>
  );
}
