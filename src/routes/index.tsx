import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  BadgeCheck,
  Globe2,
  Headphones,
  MapPin,
  Package,
  Plane,
  ShieldCheck,
  Ship,
  Star,
  Truck,
  Warehouse,
} from "lucide-react";
import { ShippyLayout } from "@/components/shippy/ShippyLayout";
import { TrackForm } from "@/components/shippy/TrackForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Navora Logistics — Premium Global Shipping Solutions" },
      {
        name: "description",
        content:
          "Navora Logistics is a global logistics service provider offering premium shipping, courier, freight and real-time shipment tracking services worldwide.",
      },
    ],
  }),
  component: HomePage,
});

const slides = [
  {
    title: "Leading Global",
    accent: "Logistics Service",
    text: "We offer a full range of global freight services with unmatched reliability and speed.",
    image: "/shippy/home-main.jpg",
  },
  {
    title: "Fastest & Reliable",
    accent: "Courier Service",
    text: "We offer a full range of global, ocean-freight services including FCL, LCL and consolidation.",
    image: "/shippy/company-slide-1.jpg",
  },
  {
    title: "Professional",
    accent: "Freight Solutions",
    text: "Professional shipping solutions tailored to meet your business needs worldwide.",
    image: "/shippy/slide3.jpg",
  },
  {
    title: "Industry Standard",
    accent: "Warehousing",
    text: "Comprehensive and scalable warehousing solutions for modern businesses.",
    image: "/shippy/company-slide-2.jpg",
  },
];

const services = [
  {
    icon: Plane,
    title: "Air Freight",
    text: "Navora Logistics, as an IATA-endorsed air forwarder, offers professional and reliable global air-freight solutions.",
  },
  {
    icon: Ship,
    title: "Sea/Ocean Freight",
    text: "International ocean freight shipping import and export services. FCL, LCL shipments, port to port or door to door.",
  },
  {
    icon: Truck,
    title: "Road Transportation",
    text: "Highly experienced and dependable, Navora Logistics is a trusted partner in domestic road transportation.",
  },
  {
    icon: ShieldCheck,
    title: "Diplomatic Bag & Secure Logistics",
    text: "Global secure mail and equipment delivery service with complete confidence and security.",
  },
  {
    icon: Warehouse,
    title: "Warehousing",
    text: "Shared and dedicated warehousing solutions supported by state-of-the-art technology and warehouse services.",
  },
  {
    icon: Package,
    title: "Packaging & Storage",
    text: "Professional packaging and storage solutions for raw materials, electronics, and finished goods with cargo insurance.",
  },
];

const reasons = [
  {
    icon: MapPin,
    title: "Track & Trace",
    text: "Fast and reliable way to check the real-time status of your shipment with our advanced tracking system.",
  },
  {
    icon: Warehouse,
    title: "Secure Warehousing",
    text: "We leverage a network of operational warehousing facilities with state-of-the-art security systems.",
  },
  {
    icon: Truck,
    title: "Express Delivery",
    text: "We service your shipments via a diverse operating infrastructure for fastest delivery times.",
  },
  {
    icon: BadgeCheck,
    title: "Domestic Services",
    text: "Next business day delivery for time-sensitive parcels with comprehensive domestic coverage.",
  },
  {
    icon: Globe2,
    title: "Global Coverage",
    text: "US, Europe & Worldwide coverage by sea & air. We offer a broad range of international freight services.",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    text: "Get excellent 24/7 online support and expert advice from our dedicated customer service team.",
  },
];

const stats = [
  { value: "101,273+", label: "Delivered Packages" },
  { value: "673,754+", label: "KM Per Year" },
  { value: "16,714+", label: "Happy Clients" },
  { value: "160+", label: "Countries Served" },
];

const performance = [
  {
    value: "99.8%",
    title: "On-Time Delivery",
    text: "Industry-leading on-time delivery performance across all shipping methods",
  },
  {
    value: "Real-time",
    title: "GPS Accuracy",
    text: "Advanced tracking systems with minute-by-minute updates and GPS precision",
  },
  {
    value: "4.9/5",
    title: "Average Rating",
    text: "Outstanding client satisfaction across all our logistics services",
  },
];

const testimonials = [
  {
    quote:
      "Given my past experiences with other logistics companies, I can say without exception that the services provided by Navora Logistics greatly exceed industry standards.",
    initials: "MP",
    name: "Monique Pete",
    role: "Logistics Manager, Martrax Inc.",
  },
  {
    quote:
      "More than once, Navora Logistics has 'saved the day', delivering our cargo on time with short notice. They have won my gratitude and loyalty with their 'can do' approach.",
    initials: "SA",
    name: "Steve Anderson",
    role: "President/Owner, Duplication Factory",
  },
  {
    quote:
      "I am very pleased with the service provided by Navora Logistics. They find good carriers and use them regularly so we get a high level of service. Their communication is outstanding.",
    initials: "CB",
    name: "Cathy Beckman",
    role: "Logistics Team, Oxea Chemicals",
  },
];

function HomePage() {
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setSlide((current) => (current + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const active = slides[slide];

  return (
    <ShippyLayout>
      <section className="relative flex min-h-[560px] items-center justify-center overflow-hidden lg:min-h-[640px]">
        {slides.map((item, index) => (
          <img
            key={item.image}
            src={item.image}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${
              index === slide ? "opacity-100" : "opacity-0"
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-slate-950/60" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-20 text-center text-white sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold leading-tight md:text-6xl lg:text-7xl">
            {active.title}
            <br />
            <span className="text-blue-400">{active.accent}</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-relaxed text-slate-200 md:text-xl">
            {active.text}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-7 py-3.5 font-medium text-white transition-colors hover:bg-blue-700"
            >
              Learn More
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg border border-white/70 px-7 py-3.5 font-medium text-white transition-colors hover:bg-white hover:text-slate-900"
            >
              Contact Us
            </Link>
          </div>
          <div className="mt-12 flex justify-center gap-2">
            {slides.map((item, index) => (
              <button
                key={item.image}
                type="button"
                aria-label={`Show slide ${index + 1}`}
                onClick={() => setSlide(index)}
                className={`h-2 rounded-full transition-all ${
                  index === slide ? "w-8 bg-blue-400" : "w-2 bg-white/50 hover:bg-white"
                }`}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-20 mx-auto -mt-14 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
          <div className="mb-5 text-center">
            <h2 className="text-2xl font-bold text-slate-900">Track &amp; Trace Your Shipment</h2>
            <p className="mt-1 text-slate-600">
              Enter your tracking number to get real-time updates on your package
            </p>
          </div>
          <TrackForm variant="page" />
          <p className="mt-3 text-center text-xs text-slate-500">
            Try the live demo tracking number{" "}
            <strong className="text-slate-700">REM-91076436</strong>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
            Our Services
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Our Services</h2>
          <p className="mt-3 text-lg text-slate-600">
            Comprehensive shipping and logistics solutions tailored to your business needs
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <article
              key={service.title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                <service.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-5 text-xl font-semibold text-slate-900">{service.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{service.text}</p>
              <Link
                to="/services"
                className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                Learn More
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Why Choose Us
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">Why Choose Us</h2>
            <p className="mt-3 text-lg text-slate-600">
              Trusted by thousands of customers worldwide for reliable and professional logistics
              solutions
            </p>
          </div>
          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {reasons.map((reason) => (
              <div key={reason.title} className="flex gap-4">
                <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <reason.icon className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{reason.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{reason.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">
              Our Impact &amp; Achievements
            </h2>
            <p className="mt-3 text-slate-300">
              Delivering excellence across the globe with industry-leading standards
            </p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl bg-slate-800/70 p-6 text-center">
                <p className="text-3xl font-bold text-blue-400 md:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {performance.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm"
            >
              <p className="text-3xl font-bold text-blue-600">{item.value}</p>
              <h3 className="mt-2 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">What Our Clients Say</h2>
            <p className="mt-3 text-lg text-slate-600">
              Hear from our satisfied customers about their experience with our logistics solutions
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {testimonials.map((item) => (
              <figure
                key={item.name}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
              >
                <div className="flex gap-1 text-amber-400">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <Star key={index} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-4 text-sm leading-relaxed text-slate-700">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                    {item.initials}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.role}</p>
                  </div>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-slate-50 py-14">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900">Trusted Partners</h2>
          <p className="mt-2 text-slate-600">
            Working with industry leaders to provide the best logistics solutions
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-10 opacity-80">
            {[1, 2, 3, 4, 5].map((n) => (
              <img
                key={n}
                src={`/shippy/partner-0${n}.png`}
                alt="Partner logo"
                className="h-10 w-auto"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-700 py-16">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 sm:px-6 md:flex-row lg:px-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-white">Ready to Ship with Confidence?</h2>
            <p className="mt-2 max-w-2xl text-blue-100">
              Get started with our professional logistics services today. Contact us for a free
              quote and experience the difference.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-blue-700 transition-colors hover:bg-blue-50"
            >
              Get Free Quote
            </Link>
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center rounded-lg border border-white/70 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-600"
            >
              Track Shipment
            </Link>
          </div>
        </div>
      </section>
    </ShippyLayout>
  );
}
