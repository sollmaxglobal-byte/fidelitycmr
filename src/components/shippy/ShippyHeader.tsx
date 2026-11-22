import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useSiteBranding } from "./SiteBranding";
import {
  ChevronDown,
  Clock,
  Mail,
  Menu,
  Package,
  Phone,
  Plane,
  Ship,
  ShieldCheck,
  Truck,
  Warehouse,
  X,
} from "lucide-react";

const serviceLinks = [
  { to: "/services", label: "Sea/Ocean Freight", icon: Ship },
  { to: "/services", label: "Road Transportation", icon: Truck },
  { to: "/services", label: "Air Freight", icon: Plane },
  { to: "/services", label: "Warehousing", icon: Warehouse },
  { to: "/services", label: "Packaging & Storage", icon: Package },
  { to: "/diplomatic", label: "Diplomatic Services", icon: ShieldCheck },
] as const;

const navLink =
  "px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 border-b-2 border-transparent hover:border-blue-600";

export function ShippyHeader() {
  const branding = useSiteBranding();
  const [open, setOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white shadow-lg">
      <div className="bg-blue-700 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-200" />
              <span>Open 24/7 for Global Logistics</span>
            </div>
            <div className="hidden items-center gap-2 md:flex">
              <Phone className="h-4 w-4 text-blue-200" />
              <span>TOLL FREE Support</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-blue-200" />
            <a
              href={`mailto:${branding.contactEmail}`}
              className="transition-colors hover:text-blue-200"
            >
              {branding.contactEmail}
            </a>
          </div>
        </div>
      </div>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link
              to="/"
              aria-label={`${branding.websiteName} home`}
              className="flex flex-shrink-0 items-center gap-2"
            >
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt={branding.websiteName}
                  className="h-11 w-auto max-w-[170px] object-contain"
                />
              ) : (
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Truck className="h-6 w-6" />
                </span>
              )}
              <span className="text-xl font-extrabold tracking-tight text-slate-900">
                {branding.websiteName === "Shippy Express" ? (
                  <>
                    Shippy<span className="text-blue-600">Express</span>
                  </>
                ) : (
                  branding.websiteName
                )}
              </span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
              <Link
                to="/"
                className={navLink}
                activeProps={{ className: "text-blue-600 border-blue-600" }}
              >
                Home
              </Link>
              <Link
                to="/about"
                className={navLink}
                activeProps={{ className: "text-blue-600 border-blue-600" }}
              >
                About
              </Link>
              <div
                className="relative"
                onMouseEnter={() => setServicesOpen(true)}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <button
                  type="button"
                  onClick={() => setServicesOpen((v) => !v)}
                  className={`${navLink} flex items-center`}
                >
                  Services
                  <ChevronDown className="ml-1 h-3 w-3" />
                </button>
                {servicesOpen && (
                  <div className="absolute left-0 top-full w-64 rounded-lg border border-slate-200 bg-white py-2 shadow-xl">
                    {serviceLinks.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        className="block px-4 py-3 text-sm text-slate-700 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      >
                        <item.icon className="mr-3 inline h-4 w-4 text-blue-600" />
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link
                to="/track-order"
                className={navLink}
                activeProps={{ className: "text-blue-600 border-blue-600" }}
              >
                Track Shipment
              </Link>
              <Link
                to="/contact"
                className={navLink}
                activeProps={{ className: "text-blue-600 border-blue-600" }}
              >
                Contact
              </Link>
              <Link
                to="/contact"
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
              >
                Get Quote
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-label="Toggle navigation"
              className="rounded-lg p-2 text-slate-700 lg:hidden"
            >
              {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-slate-200 bg-white px-4 pb-6 lg:hidden">
            <div className="flex flex-col gap-1 pt-3">
              <Link
                to="/"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              >
                Home
              </Link>
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              >
                About
              </Link>
              <span className="px-3 pt-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Services
              </span>
              {serviceLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                >
                  <item.icon className="mr-2 inline h-4 w-4 text-blue-600" />
                  {item.label}
                </Link>
              ))}
              <Link
                to="/track-order"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              >
                Track Shipment
              </Link>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              >
                Contact
              </Link>
              <Link
                to="/contact"
                onClick={() => setOpen(false)}
                className="mt-3 rounded-lg bg-blue-600 px-4 py-3 text-center font-medium text-white hover:bg-blue-700"
              >
                Get Quote
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
