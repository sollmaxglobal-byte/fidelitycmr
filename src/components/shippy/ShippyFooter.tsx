import { Link } from "@tanstack/react-router";
import {
  ChevronRight,
  Clock,
  Facebook,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  Twitter,
} from "lucide-react";
import { TrackForm } from "./TrackForm";
import { NavoraLogo } from "./NavoraLogo";

const quickLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About Us" },
  { to: "/services", label: "Our Services" },
  { to: "/track-order", label: "Track Shipment" },
  { to: "/contact", label: "Contact Us" },
  { to: "/diplomatic", label: "Diplomatic Services" },
] as const;

const socials = [Facebook, Twitter, Linkedin, Instagram];

export function ShippyFooter() {
  return (
    <footer className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <NavoraLogo variant="light" link className="mb-5" />
            <p className="mb-6 leading-relaxed text-slate-300">
              Providing Smart Logistics Solutions Across The World. We deliver excellence in
              shipping, courier services, and package tracking with our global network of trusted
              partners.
            </p>
            <div className="flex gap-4">
              {socials.map((Icon, index) => (
                <a
                  key={index}
                  href="#"
                  aria-label="Social link"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 transition-colors hover:bg-blue-700"
                >
                  <Icon className="h-4 w-4 text-white" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="mb-6 text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.to}
                    className="flex items-center text-slate-300 transition-colors hover:text-blue-400"
                  >
                    <ChevronRight className="mr-2 h-3 w-3 text-blue-500" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="mb-6 text-lg font-semibold text-white">Contact Info</h4>
            <div className="space-y-4 text-slate-300">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Mail className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Email Us</p>
                  <a
                    href="mailto:support@developerplug.com"
                    className="text-sm hover:text-blue-400"
                  >
                    support@developerplug.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Phone className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Call Us</p>
                  <p className="text-sm">TOLL FREE Support</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600">
                  <Clock className="h-4 w-4 text-white" />
                </span>
                <div>
                  <p className="text-sm text-slate-400">Working Hours</p>
                  <p className="text-sm">24/7 Global Support</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h5 className="mb-2 text-sm font-semibold text-white">Quick Track</h5>
              <TrackForm variant="footer" />
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-slate-700">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-5 text-sm text-slate-400 sm:px-6 md:flex-row lg:px-8">
          <p>Copyright © {new Date().getFullYear()} Navora Logistics. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-blue-400">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-blue-400">
              Terms of Service
            </a>
            <a href="#" className="hover:text-blue-400">
              Shipping Policy
            </a>
            <Link to="/admin" className="hover:text-blue-400">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
