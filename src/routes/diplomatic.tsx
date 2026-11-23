import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { ShippyLayout, PageHero } from "@/components/shippy/ShippyLayout";

export const Route = createFileRoute("/diplomatic")({
  head: () => ({
    meta: [
      { title: "Diplomatic Bag & Secure Logistics — Navora Logistics" },
      {
        name: "description",
        content:
          "Secure diplomatic bag, confidential mail and sensitive equipment delivery worldwide with Navora Logistics.",
      },
    ],
  }),
  component: DiplomaticPage,
});

function DiplomaticPage() {
  return (
    <ShippyLayout>
      <PageHero
        title="Diplomatic Bag and Secure Logistics"
        subtitle="Global secure mail and equipment delivery service with complete confidence and security."
        image="/shippy/diplomatic-bag-compressor.jpg"
        breadcrumb={[
          { label: "Home", to: "/" },
          { label: "Services", to: "/services" },
          { label: "Diplomatic Bag and Secure Logistics" },
        ]}
      />

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div className="space-y-4 leading-relaxed text-slate-600">
            <p>
              Our history incorporates more than 800 years of ensuring the Government's diplomatic
              mail is protected. This means we are experts in ensuring mail and materials are where
              they need to be, when they need to be there, securely and without compromise.
            </p>
            <p>
              Our service is global, including to hostile environments. We operate a secure,
              flexible and cost-effective door-to-door global service by ground and air.
            </p>
            <p>
              Our diplomatic courier services, known as the Navora Logistics Messengers, make sure
              sensitive material is always kept safe throughout its entire journey.
            </p>
            <p>
              As well as securely delivering information and materials we also manage its disposal.
              Protecting information effectively includes making sure it is disposed of correctly
              when it is no longer needed. We destroy or dispose of all sensitive items, ranging
              from paper and other documents to hardware, in a secure, environmentally friendly
              service that has a full audit trail for complete assurance.
            </p>
            <p className="font-semibold text-slate-900">
              We will take care of your cargo and deliver them safe and on time.
            </p>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700"
            >
              Contact Us Now <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <img
            src="/shippy/diplomatic-bag-compressor.jpg"
            alt="Secure diplomatic logistics"
            className="h-full max-h-[460px] w-full rounded-2xl object-cover shadow-lg"
          />
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              icon: ShieldCheck,
              title: "High Security",
              text: "Security-cleared messengers and tamper-evident transit for every consignment.",
            },
            {
              icon: Lock,
              title: "Confidential",
              text: "End-to-end confidentiality with a full audit trail from collection to delivery.",
            },
            {
              icon: ArrowRight,
              title: "Global Reach",
              text: "Door-to-door secure delivery across 160 countries, including hostile environments.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white">
                <item.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </ShippyLayout>
  );
}
