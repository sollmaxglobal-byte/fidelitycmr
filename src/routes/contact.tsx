import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Clock,
  Loader2,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Plane,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";
import { ShippyLayout, PageHero } from "@/components/shippy/ShippyLayout";
import { submitContactMessage } from "@/lib/shippy.functions";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Shippy Express" },
      {
        name: "description",
        content:
          "Contact the Shippy Express team for shipping quotes, tracking help and logistics support.",
      },
    ],
  }),
  component: ContactPage,
});

const faqs = [
  {
    q: "How can I track my shipment?",
    a: "You can track your shipment by entering your tracking number in our online tracking system on the home page or track shipment page. Alternatively, you can contact our customer service team with your tracking number for assistance.",
  },
  {
    q: "What shipping services do you offer?",
    a: "We offer a comprehensive range of shipping services including air freight, sea/ocean freight, road transportation, express delivery, diplomatic shipping, and specialized logistics solutions. Each service is tailored to meet specific shipping requirements and timeframes.",
  },
  {
    q: "How do I get a shipping quote?",
    a: 'You can request a shipping quote by filling out the contact form on this page with details about your shipment, or by clicking the "Get Quote" button in the navigation menu. Our team will promptly respond with a competitive quote based on your specific shipping needs.',
  },
  {
    q: "What are your delivery timeframes?",
    a: "Delivery timeframes vary depending on the shipping service, destination, and any customs requirements. Express services typically deliver within 1-3 business days, while standard services may take 3-7 business days. International shipping timeframes depend on the destination country and chosen shipping method.",
  },
];

const field =
  "w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200";

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [state, setState] = useState<{
    status: "idle" | "loading" | "ok" | "error";
    message?: string;
  }>({
    status: "idle",
  });

  return (
    <ShippyLayout>
      <PageHero
        title="Contact Us"
        subtitle="We're here to help with your shipping and logistics needs. Reach out to our team for assistance."
        image="/shippy/company-slide-2.jpg"
        breadcrumb={[{ label: "Home", to: "/" }, { label: "Contact" }]}
      />

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              icon: Phone,
              title: "Call Us",
              text: "Our support team is available 24/7",
              value: "TOLL FREE",
            },
            {
              icon: Mail,
              title: "Email Us",
              text: "Send us an email for any inquiry",
              value: "support@developerplug.com",
            },
            {
              icon: MapPin,
              title: "Our Location",
              text: "Our head office is located at",
              value: "San Diego - California",
            },
          ].map((card) => (
            <div
              key={card.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm"
            >
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white">
                <card.icon className="h-5 w-5" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">{card.title}</h2>
              <p className="mt-1 text-sm text-slate-500">{card.text}</p>
              <p className="mt-2 font-semibold text-blue-700">{card.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold text-slate-900">Our Global Network</h2>
            <p className="mt-3 text-slate-600">
              We operate a global network of shipping routes and logistics partners to serve you
              better.
            </p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: MapPin,
                title: "Our Headquarters",
                text: "Shippy Express — San Diego, California",
              },
              {
                icon: Plane,
                title: "Air Routes",
                text: "Priority air corridors across 5 continents",
              },
              { icon: Ship, title: "Sea Routes", text: "FCL & LCL ocean freight to major ports" },
              { icon: Truck, title: "Ground Routes", text: "Regional road and last-mile delivery" },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-slate-200 p-6">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <item.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 flex items-center justify-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <Warehouse className="h-4 w-4 text-blue-600" />
            Distribution centers in North America, Europe, the Middle East and West Africa.
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Let's Discuss Your Shipping Needs</h2>
          <p className="mt-3 text-slate-600">
            Whether you need a quick quote, have a question about our services, or want to request a
            specialized logistics solution, our team is ready to help.
          </p>
          <div className="mt-6 space-y-4">
            {[
              {
                icon: Clock,
                title: "Customer Support",
                text: "24/7 dedicated support for all shipping inquiries",
              },
              {
                icon: MessageSquare,
                title: "Fast Response",
                text: "Quick turnaround on shipping quotes and inquiries",
              },
              {
                icon: Mail,
                title: "Secure Communications",
                text: "Your information is encrypted and securely handled",
              },
            ].map((item) => (
              <div key={item.title} className="flex gap-3">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
          <Link
            to="/track-order"
            className="mt-6 inline-flex rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Track an existing shipment
          </Link>
        </div>

        <form
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          onSubmit={async (event) => {
            event.preventDefault();
            setState({ status: "loading" });
            try {
              const result = await submitContactMessage({ data: form });
              setState({
                status: "ok",
                message:
                  result.status === "sent"
                    ? "Thanks! Your message has been sent — our team will reply shortly."
                    : "Thanks! Your message has been received and queued for our team.",
              });
              setForm({ name: "", email: "", phone: "", subject: "", message: "" });
            } catch (error) {
              setState({ status: "error", message: (error as Error).message });
            }
          }}
        >
          <h2 className="text-xl font-semibold text-slate-900">Send Us a Message</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              required
              placeholder="Full Name"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              className={field}
            />
            <input
              required
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={field}
            />
            <input
              placeholder="Phone Number"
              value={form.phone}
              onChange={(event) => setForm({ ...form, phone: event.target.value })}
              className={field}
            />
            <input
              placeholder="Subject"
              value={form.subject}
              onChange={(event) => setForm({ ...form, subject: event.target.value })}
              className={field}
            />
          </div>
          <textarea
            required
            rows={5}
            placeholder="Your Message"
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            className={`${field} mt-3 resize-none`}
          />
          <button
            type="submit"
            disabled={state.status === "loading"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {state.status === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
            Send Message
          </button>
          {state.message && (
            <p
              className={`mt-3 text-sm ${state.status === "error" ? "text-red-600" : "text-emerald-700"}`}
            >
              {state.message}
            </p>
          )}
        </form>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-center text-slate-600">
            Find answers to common questions about our shipping and courier services
          </p>
          <div className="mt-8 space-y-3">
            {faqs.map((faq) => (
              <details key={faq.q} className="rounded-xl border border-slate-200 p-5">
                <summary className="cursor-pointer list-none font-semibold text-slate-900">
                  {faq.q}
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-blue-700 py-14">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 text-center sm:px-6 md:flex-row md:text-left lg:px-8">
          <div>
            <h2 className="text-2xl font-bold text-white md:text-3xl">Ready to Ship with Us?</h2>
            <p className="mt-2 text-blue-100">
              Experience premium shipping and logistics services with our global network.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              to="/track-order"
              className="inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 font-medium text-blue-700 hover:bg-blue-50"
            >
              Track Shipment
            </Link>
            <Link
              to="/services"
              className="inline-flex items-center justify-center rounded-lg border border-white/70 px-6 py-3 font-medium text-white hover:bg-blue-600"
            >
              Get a Quote
            </Link>
          </div>
        </div>
      </section>
    </ShippyLayout>
  );
}
