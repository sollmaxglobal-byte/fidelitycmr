import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Package,
  Plane,
  ShieldCheck,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";
import { ShippyLayout, PageHero } from "@/components/shippy/ShippyLayout";

export const Route = createFileRoute("/services")({
  head: () => ({
    meta: [
      { title: "Our Services — Navora Logistics" },
      {
        name: "description",
        content:
          "Air freight, ocean freight, road transportation, warehousing, packaging and diplomatic logistics from Navora Logistics.",
      },
    ],
  }),
  component: ServicesPage,
});

const services = [
  {
    icon: Plane,
    title: "Air Freight",
    text: "Navora Logistics, as an IATA-endorsed air forwarder, offers its customers professional and reliable global, air-freight solutions.",
    bullets: ["Express Delivery", "Global Coverage", "Priority Shipping"],
  },
  {
    icon: Ship,
    title: "Sea/Ocean Freight",
    text: "We offer international ocean freight shipping import and export services. Full container loads or less than container LCL shipments, port to port or door to door.",
    bullets: ["FCL Shipping", "LCL Options", "Port to Door"],
  },
  {
    icon: Truck,
    title: "Road Transportation",
    text: "Highly experienced and dependable, Navora Logistics is a trusted partner in domestic road transportation, offering expert logistics solutions.",
    bullets: ["Same-Day Delivery", "Last Mile", "Regional Coverage"],
  },
  {
    icon: ShieldCheck,
    title: "Diplomatic Bag and Secure Logistics",
    text: "Our service is global, send and receive mail and equipment around the world securely with complete confidence.",
    bullets: ["High Security", "Confidential", "Diplomatic Channels"],
  },
  {
    icon: Warehouse,
    title: "Warehousing",
    text: "We offer shared and dedicated warehousing solutions supported by state of the art technology as part of our suite of warehouse services.",
    bullets: ["Inventory Management", "Distribution", "Fulfillment"],
  },
  {
    icon: Package,
    title: "Packaging & Storage",
    text: "Whether its client's shipments comprise raw materials, electronics or finished goods, we offer the right level of storage and cargo insurance.",
    bullets: ["Custom Packaging", "Secure Storage", "Cargo Insurance"],
  },
];

function ServicesPage() {
  return (
    <ShippyLayout>
      <PageHero
        title="Our Services"
        subtitle="Comprehensive logistics solutions tailored to your unique shipping needs"
        image="/shippy/service2.jpg"
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Our Services" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            What We Offer
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
            Comprehensive Logistics Solutions
          </h2>
          <p className="mt-3 text-lg text-slate-600">
            From air freight to specialized diplomatic services, we provide end-to-end logistics
            solutions designed to meet your unique shipping requirements with efficiency and
            reliability.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white">
                <service.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.text}</p>
              <ul className="mt-4 space-y-2">
                {service.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className="h-4 w-4 text-blue-600" />
                    {bullet}
                  </li>
                ))}
              </ul>
              <Link
                to="/contact"
                className="mt-auto inline-flex items-center gap-1 pt-6 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Learn more <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Global Presence
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Network Services</h2>
            <p className="mt-4 leading-relaxed text-slate-600">
              Our customers overseas require a global and local responsive secure support network,
              which we expertly deliver worldwide. In the United States, we provide translation and
              interpretation into more than 60 languages by experts who understand your legal,
              political and business environment. Our trusted staff are security cleared.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              Our global regional hubs offer a wide range of mission-critical technology, logistic,
              IT and security services to clients and its partners overseas. Through our overseas
              secure services to more than 250 diplomatic offices, across 160 countries, we support
              around 14,000 staff globally.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {[
                { value: "250+", label: "Diplomatic offices" },
                { value: "160", label: "Countries served" },
                { value: "14,000", label: "Staff globally" },
                { value: "60+", label: "Languages supported" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-2xl font-bold text-blue-600">{item.value}</p>
                  <p className="text-sm text-slate-600">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
          <img
            src="/shippy/service-right-1.jpg"
            alt="Navora Logistics global logistics network"
            className="h-full max-h-[460px] w-full rounded-2xl object-cover shadow-lg"
          />
        </div>
      </section>

      <section className="bg-blue-700 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <h2 className="text-2xl font-bold text-white md:text-3xl">
            Need a tailored logistics solution?
          </h2>
          <Link
            to="/contact"
            className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-blue-700 hover:bg-blue-50"
          >
            Request a quote
          </Link>
        </div>
      </section>
    </ShippyLayout>
  );
}
