import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Money } from "@/components/Money";

type Plan = {
  id: string;
  name: string;
  description: string | null;
  min_amount: number;
  max_amount: number;
  daily_roi_percent: number;
  duration_days: number;
};

export const Route = createFileRoute("/plans")({
  head: () => ({
    meta: [
      { title: "Investment Plans — Fidelity" },
      { name: "description", content: "Browse Fidelity investment plans with daily ROI in XAF." },
    ],
  }),
  component: PlansPage,
});

function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .eq("active", true)
      .order("min_amount", { ascending: true })
      .then(({ data }) => setPlans((data as Plan[]) ?? []));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="bg-hero py-20 text-primary-foreground">
        <div className="mx-auto max-w-6xl px-4">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">
            Investment plans
          </div>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Pick your pace.</h1>
          <p className="mt-4 max-w-xl opacity-85">
            Three transparent tiers. Flexible amounts. Daily returns paid in XAF.
          </p>
        </div>
      </section>

      <section className="mx-auto -mt-12 max-w-6xl px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((p, i) => {
            const featured = i === 1;
            return (
              <div
                key={p.id}
                className={`relative rounded-2xl border p-7 shadow-sm transition hover:shadow-elegant ${
                  featured
                    ? "border-gold bg-primary text-primary-foreground shadow-elegant"
                    : "border-border bg-card"
                }`}
              >
                {featured && (
                  <div className="absolute -top-3 right-6 rounded-full bg-gold px-3 py-1 text-xs font-semibold text-gold-foreground">
                    Most chosen
                  </div>
                )}
                <h3 className={`font-display text-3xl ${featured ? "text-gold" : "text-primary"}`}>
                  {p.name}
                </h3>
                <p className={`mt-2 text-sm ${featured ? "opacity-80" : "text-muted-foreground"}`}>
                  {p.description}
                </p>
                <div className="mt-6">
                  <div className="font-display text-5xl">
                    {p.daily_roi_percent}
                    <span className="text-2xl">%</span>
                  </div>
                  <div
                    className={`text-xs uppercase tracking-wider ${featured ? "opacity-70" : "text-muted-foreground"}`}
                  >
                    daily for {p.duration_days} days
                  </div>
                </div>
                <ul className="mt-6 space-y-2 text-sm">
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    From <Money value={p.min_amount} />
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    Up to <Money value={p.max_amount} />
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    Total return ~{(p.daily_roi_percent * p.duration_days).toFixed(0)}%
                  </li>
                  <li className="flex gap-2">
                    <Check className="h-4 w-4 shrink-0 text-gold" />
                    Principal returned at end
                  </li>
                </ul>
                <Button
                  asChild
                  className={`mt-8 w-full ${
                    featured
                      ? "bg-gold text-gold-foreground hover:opacity-90"
                      : "bg-primary text-primary-foreground hover:opacity-90"
                  }`}
                >
                  <Link to="/dashboard/invest">
                    Invest now <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
