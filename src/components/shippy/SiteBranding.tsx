import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getSiteBranding } from "@/lib/shippy-admin.functions";

export type SiteBranding = {
  websiteName: string;
  websiteTitle: string;
  websiteUrl: string;
  officeAddress: string;
  whatsappNumber: string;
  contactEmail: string;
  logoUrl: string;
  faviconUrl: string;
};

const defaults: SiteBranding = {
  websiteName: "Shippy Express",
  websiteTitle: "Shippy Express — Premium Global Shipping Solutions",
  websiteUrl: "https://shippyexpress.developersplug.com",
  officeAddress: "Global Logistics Hub, 24 Harbour Road, Lagos, Nigeria",
  whatsappNumber: "2348114313795",
  contactEmail: "support@developerplug.com",
  logoUrl: "",
  faviconUrl: "",
};

const SiteBrandingContext = createContext<SiteBranding>(defaults);

export function SiteBrandingProvider({ children }: { children: ReactNode }) {
  const [branding, setBranding] = useState<SiteBranding>(defaults);

  useEffect(() => {
    let cancelled = false;
    getSiteBranding()
      .then((data) => {
        if (!cancelled) setBranding(data);
      })
      .catch(() => {
        /* keep the defaults when settings cannot be loaded */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!branding.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = branding.faviconUrl;
  }, [branding.faviconUrl]);

  return <SiteBrandingContext.Provider value={branding}>{children}</SiteBrandingContext.Provider>;
}

export function useSiteBranding() {
  return useContext(SiteBrandingContext);
}
