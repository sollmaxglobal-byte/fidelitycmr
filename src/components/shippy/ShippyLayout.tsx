import type { ReactNode } from "react";
import { ShippyHeader } from "./ShippyHeader";
import { ShippyFooter } from "./ShippyFooter";
import { ShippyChat } from "./ShippyChat";

export function ShippyLayout({ children }: { children: ReactNode }) {
  return (
    <div className="shippy min-h-screen bg-slate-50">
      <ShippyHeader />
      <main>{children}</main>
      <ShippyFooter />
      <ShippyChat />
    </div>
  );
}

export function PageHero({
  title,
  subtitle,
  image = "/shippy/home-main.jpg",
  breadcrumb,
}: {
  title: string;
  subtitle?: string;
  image?: string;
  breadcrumb?: { label: string; to?: string }[];
}) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-slate-900/40" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
        <h1 className="text-4xl font-bold text-white md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-4 max-w-2xl text-lg text-slate-200">{subtitle}</p>}
        {breadcrumb && (
          <nav className="mt-6 flex flex-wrap items-center gap-2 text-sm text-slate-300">
            {breadcrumb.map((item, index) => (
              <span key={item.label} className="flex items-center gap-2">
                {index > 0 && <span className="text-slate-500">/</span>}
                {item.to ? (
                  <a href={item.to} className="hover:text-blue-300">
                    {item.label}
                  </a>
                ) : (
                  <span className="text-white">{item.label}</span>
                )}
              </span>
            ))}
          </nav>
        )}
      </div>
    </section>
  );
}
