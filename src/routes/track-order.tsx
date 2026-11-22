import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Clock, Headphones, History, Mail, MapPin, Search, Timer } from "lucide-react";
import { ShippyLayout, PageHero } from "@/components/shippy/ShippyLayout";
import { TrackForm } from "@/components/shippy/TrackForm";

export const Route = createFileRoute("/track-order")({
  head: () => ({
    meta: [
      { title: "Track Shipment — Shippy Express" },
      {
        name: "description",
        content: "Track your Shippy Express shipment in real time with your tracking number.",
      },
    ],
  }),
  component: TrackOrderPage,
});

const features = [
  {
    icon: MapPin,
    title: "Real-Time Updates",
    text: "Stay informed with accurate, up-to-the-minute information about your shipment's location and status throughout its journey.",
  },
  {
    icon: Timer,
    title: "Estimated Delivery",
    text: "Get precise delivery time estimates that help you plan and prepare for your shipment's arrival with confidence.",
  },
  {
    icon: History,
    title: "Shipment History",
    text: "Access a detailed timeline of your package's journey, including all transit points and handling activities along the route.",
  },
];

const faqs = [
  {
    q: "What information do I need to track my package?",
    a: "You only need your tracking number to track your shipment. The tracking number is a unique identifier provided to you when you ship a package with us. You can find this number on your shipping receipt, confirmation email, or the shipping label.",
  },
  {
    q: "How often is my tracking information updated?",
    a: "Our tracking system provides real-time updates whenever your package is scanned at various checkpoints throughout its journey. Typically, you'll see updates when your package is picked up, arrives at sorting facilities, departs for delivery, and when it's delivered.",
  },
  {
    q: "What should I do if my tracking isn't working?",
    a: "If your tracking information isn't appearing, first verify that you've entered the correct tracking number. There might be a delay between when your package is shipped and when tracking becomes active. If you've recently shipped your package, please allow 24 hours for the tracking information to appear in our system.",
  },
  {
    q: "Can I track multiple packages at once?",
    a: "Currently, our online tracking system allows you to track one package at a time. If you need to track multiple shipments, you'll need to enter each tracking number separately.",
  },
];

function TrackOrderPage() {
  return (
    <ShippyLayout>
      <PageHero
        title="Track & Trace Your Shipment"
        subtitle="Real-time tracking for your packages, delivered with precision and care"
        image="/shippy/tracking.jpg"
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Track & Trace Shipment" }]}
      />

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900">Track Your Shipment</h2>
            <p className="mt-2 text-sm text-slate-600">
              Here's the fastest way to check the status of your shipment. No need to call Customer
              Service – our online results give you real-time, detailed progress as your shipment
              speeds through the Shippy Express network.
            </p>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Tracking Number
              </label>
              <TrackForm variant="page" />
              <p className="mt-3 text-xs text-slate-500">
                Demo tracking number: <strong className="text-slate-700">REM-91076436</strong>
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
              <Search className="h-5 w-5 text-blue-600" /> Tracking Tips
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-slate-700">
              <li>Your tracking number can be found on your shipping confirmation email</li>
              <li>Tracking numbers typically contain 10-15 characters</li>
              <li>Updates are available 24/7 and reflect real-time status</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              Tracking Features
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900">Real-Time Tracking Benefits</h2>
            <p className="mt-3 text-slate-600">
              Monitor your shipments with precision and confidence using our advanced tracking
              system
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-slate-200 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <feature.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold text-slate-900">
          Frequently Asked Questions
        </h2>
        <p className="mt-3 text-center text-slate-600">
          Find answers to common tracking and shipping questions
        </p>
        <div className="mt-8 space-y-3">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-slate-900 marker:hidden">
                {faq.q}
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="bg-slate-900 py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Need Additional Help With Your Shipment?
            </h2>
            <p className="mt-2 text-slate-300">
              Our customer service team is available to assist you with any questions or concerns
              about your shipment.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/contact"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700"
            >
              <Mail className="h-4 w-4" /> Contact Support
            </Link>
            <a
              href="tel:+10000000000"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/60 px-5 py-3 font-medium text-white hover:bg-white/10"
            >
              <Headphones className="h-4 w-4" /> Call Us
            </a>
          </div>
        </div>
      </section>

      <div className="bg-blue-700 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 text-sm text-blue-100">
          <Clock className="h-4 w-4" /> Tracking is refreshed continuously, 24 hours a day, 7 days a
          week.
          <Link
            to="/services"
            className="ml-1 inline-flex items-center gap-1 font-semibold text-white"
          >
            Explore services <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </ShippyLayout>
  );
}
