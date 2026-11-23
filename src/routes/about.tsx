import { createFileRoute, Link } from "@tanstack/react-router";
import { Award, Compass, Globe2, Lock, ShieldCheck, Star, Target } from "lucide-react";
import { ShippyLayout, PageHero } from "@/components/shippy/ShippyLayout";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Navora Logistics" },
      {
        name: "description",
        content:
          "Navora Logistics is a privately owned, premier international freight forwarder, delivery and logistics service provider.",
      },
    ],
  }),
  component: AboutPage,
});

const values = [
  "Value Creation",
  "Openness",
  "Integrity",
  "Commitment",
  "Excellence",
  "Mutual Respect",
  "Customer Orientation",
];

const achievements = [
  { value: "101,273+", label: "Delivered Packages" },
  { value: "673,754+", label: "KM Per Year" },
  { value: "11+", label: "Years Experience" },
  { value: "16,714+", label: "Happy Clients" },
  { value: "8+", label: "Industry Awards" },
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

function AboutPage() {
  return (
    <ShippyLayout>
      <PageHero
        title="About Us"
        subtitle="A premier international freight forwarder, delivery and logistics service provider."
        image="/shippy/company-slide-3.jpg"
        breadcrumb={[{ label: "Home", to: "/" }, { label: "About Us" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Company Profile
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Navora Logistics is a privately owned, premier international freight forwarder, delivery
              and logistics service provider.
            </h2>
            <div className="mt-6 space-y-4 leading-relaxed text-slate-600">
              <p>
                Navora Logistics has extensive experience handling and delivering sensitive domestic
                and industrial products including consumer technology products like networking
                equipment, desktop and mobile computers, servers, cell phones and more.
              </p>
              <p>
                Navora Logistics delivers real-time, actionable information reliably and ensures
                optimal efficiency and on-time activities by utilizing advanced, custom software
                systems. Fully EDI capable, Navora Logistics's systems interface with your trading
                partners to provide unprecedented product visibility throughout the entire supply
                chain.
              </p>
              <p>
                Our global regional hubs offer a wide range of mission-critical technology,
                logistic, IT and security services to clients and its partners overseas. Through our
                overseas secure services to more than 250 diplomatic offices, across 160 countries,
                we support around 14,000 staff globally.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/contact"
                className="rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
              >
                Get In Touch
              </Link>
              <Link
                to="/services"
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Our Services
              </Link>
            </div>
          </div>
          <img
            src="/shippy/company-slide-1.jpg"
            alt="Navora Logistics operations"
            className="h-64 w-full rounded-2xl object-cover shadow-lg lg:h-full"
          />
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Our Foundation
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 md:text-4xl">
              Built on strong values and clear vision
            </h2>
            <p className="mt-3 text-slate-600">
              Driving excellence in logistics across every market we serve
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Target,
                title: "Our Mission",
                text: "Connecting people, businesses and communities to a better future – through logistics.",
              },
              {
                icon: Compass,
                title: "Our Vision",
                text: "To become the world's preferred supply chain logistics company – applying insights, service quality and innovation to create sustainable growth for business and society.",
              },
              {
                icon: Globe2,
                title: "Core Values",
                text: values.join(" – "),
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Safety First</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            At Navora Logistics, ensuring the safety of our customers, employees and our communities
            is our priority. We understand the importance of continuous training and are proud of
            our safety knowledge, experienced staff and ability to exceed industry standards year
            after year.
          </p>
          <p className="mt-3 leading-relaxed text-slate-600">
            We have established and continually maintain excellent motor carrier safety ratings and
            low accident frequencies.
          </p>
          <div className="mt-5 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-blue-600">99.9%</p>
              <p className="text-sm text-slate-500">Safety Rating</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">24/7</p>
              <p className="text-sm text-slate-500">Monitoring</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-sm">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
            <Lock className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-2xl font-bold text-slate-900">Advanced Security</h2>
          <p className="mt-3 leading-relaxed text-slate-600">
            At Navora Logistics, we offer industry-leading asset protection and security compliance
            programs. We understand that our customers may have important and unique needs related
            to homeland security regulatory compliance, high-risk products, or brand protection.
          </p>
          <p className="mt-3 leading-relaxed text-slate-600">
            By leveraging modern and proven technologies, we provide for the integrity of customer
            assets while in-transit or at one of our facilities.
          </p>
          <div className="mt-5 flex gap-8">
            <div>
              <p className="text-2xl font-bold text-blue-600">256-bit</p>
              <p className="text-sm text-slate-500">Encryption</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">ISO</p>
              <p className="text-sm text-slate-500">Certified</p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-white md:text-4xl">Our Achievements</h2>
            <p className="mt-3 text-slate-300">Numbers that speak for our excellence</p>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 md:grid-cols-5">
            {achievements.map((item) => (
              <div key={item.label} className="rounded-2xl bg-slate-800/70 p-5 text-center">
                <p className="text-2xl font-bold text-blue-400 md:text-3xl">{item.value}</p>
                <p className="mt-1 text-sm text-slate-300">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-slate-900">What Our Clients Say</h2>
          <p className="mt-3 text-slate-600">Trusted by industry leaders worldwide</p>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((item) => (
            <figure
              key={item.name}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
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
      </section>

      <section className="border-y border-slate-200 bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="flex items-center justify-center gap-2 text-2xl font-bold text-slate-900">
            <Award className="h-6 w-6 text-blue-600" /> Trusted Partners
          </h2>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-10 opacity-80">
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

      <section className="bg-blue-700 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">
              Ready to Experience Excellence?
            </h2>
            <p className="mt-2 max-w-2xl text-blue-100">
              Join thousands of satisfied customers who trust us with their logistics needs.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-blue-700 hover:bg-blue-50"
            >
              Get Free Quote
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-lg border border-white/70 px-6 py-3 font-medium text-white hover:bg-blue-600"
            >
              Our Services
            </Link>
          </div>
        </div>
      </section>
    </ShippyLayout>
  );
}
