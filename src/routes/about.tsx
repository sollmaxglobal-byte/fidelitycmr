import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Fidelity" },
      {
        name: "description",
        content:
          "Fidelity is a Cameroonian investment platform built on transparency, daily ROI and human support.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            About Fidelity
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">
            A new chapter for Cameroonian capital.
          </h1>
        </div>
      </section>
      <section className="mx-auto max-w-3xl px-4 py-16 text-lg leading-relaxed text-foreground/80">
        <p>
          Fidelity was founded with a simple belief — that everyday Cameroonians deserve access to
          real investment opportunities, paid in their own currency, on rails they already trust.
        </p>
        <p className="mt-6">
          We combine the speed of Mobile Money with the discipline of institutional finance. Every
          deposit is reviewed by a member of our team. Every payout is logged. Every plan is
          designed around flexibility — you choose the amount, you choose the duration.
        </p>
        <p className="mt-6">Headquartered in Douala, we serve investors across Central Africa.</p>
      </section>
      <SiteFooter />
    </div>
  );
}
