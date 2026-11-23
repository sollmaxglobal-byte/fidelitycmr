import { Link } from "@tanstack/react-router";

type NavoraLogoProps = {
  variant?: "dark" | "light";
  className?: string;
  link?: boolean;
};

const INK = "#0F1113";
const SIGNAL = "#2ECC71";
const BASE = "#F2F2F2";

export function NavoraLogo({ variant = "dark", className = "", link = false }: NavoraLogoProps) {
  const isLight = variant === "light";

  const logo = (
    <span className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 44 44" aria-hidden="true" className="h-11 w-11 flex-shrink-0">
        <rect width="44" height="44" rx="6" fill={isLight ? BASE : INK} />
        <path
          d="M13 31V13l18 18V13"
          fill="none"
          stroke={SIGNAL}
          strokeWidth="2.5"
          strokeLinecap="square"
        />
      </svg>
      <span className="flex flex-col leading-none">
        <span
          className={`text-xl font-extrabold uppercase tracking-tight ${
            isLight ? "text-white" : "text-[#0F1113]"
          }`}
        >
          Navora
        </span>
        <span
          className={`mt-1 text-[10px] font-semibold uppercase tracking-[0.32em] ${
            isLight ? "text-[#2ECC71]" : "text-slate-500"
          }`}
        >
          Logistics
        </span>
      </span>
    </span>
  );

  return link ? (
    <Link to="/" aria-label="Navora Logistics home">
      {logo}
    </Link>
  ) : (
    logo
  );
}
