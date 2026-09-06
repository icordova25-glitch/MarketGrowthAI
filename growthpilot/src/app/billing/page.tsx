"use client";

import { useEffect, useState } from "react";
import { Check, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { billingPlans, type BillingUsageSummary, type PlanId } from "@/lib/billing";

type BillingState = {
  business: { id: string; name: string };
  subscription: {
    plan: PlanId;
    planName: string;
    status: string;
    currentPeriodEnd: string | null;
    provider: string;
    customerId: string | null;
    subscriptionId: string | null;
  };
  limits: Record<string, number>;
  usage: BillingUsageSummary[];
  team: {
    activeSeats: number;
    members: Array<{ id: string; userId: string; name: string; email: string; role: string; status: string; updatedAt: string }>;
  };
  period: { start: string; end: string };
};

export default function BillingPage() {
  const [state, setState] = useState<BillingState | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/billing/state", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });

      const result = await response.json().catch(() => ({ error: "Unable to load billing state." })) as BillingState & { error?: string };
      if (!isActive) return;

      if (!response.ok) {
        setError(result.error ?? "Unable to load billing state.");
        setState(null);
        setIsLoading(false);
        return;
      }

      setState(result);
      setError("");
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  async function choosePlan(nextPlan: PlanId) {
    setNotice("");
    setIsCheckingOut(true);
    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ plan: nextPlan }),
    });
    const result = await response.json() as { url?: string; error?: string };
    setIsCheckingOut(false);
    if (response.ok && result.url) {
      window.location.assign(result.url);
      return;
    }
    setNotice(result.error ?? "Checkout could not be created. Complete onboarding and verify Stripe configuration.");
  }

  const activePlanId = state?.subscription.plan ?? "starter";
  const activePlan = billingPlans.find((item) => item.id === activePlanId) ?? billingPlans[0];

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <SectionHeader
        title="Billing & Plans"
        subtitle="Choose the MarketGrowthAI plan that matches your growth operation and manage the capacity behind it."
        icon="✦"
      />

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {notice && <p className="mb-4 border-l-2 border-amber-300 bg-amber-300/5 p-3 text-sm text-amber-100">{notice}</p>}

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
              <CreditCard size={16} />
              Current subscription
            </div>
            <h2 className="mt-2 text-2xl font-bold text-white">
              {activePlan.name} plan <span className="text-base font-medium text-slate-400">· ${activePlan.price}/month</span>
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              {activePlan.description}
            </p>
            {state?.subscription.status && (
              <p className="mt-3 text-xs uppercase tracking-[0.1em] text-cyan-200">
                Status: {state.subscription.status}
                {state.subscription.currentPeriodEnd ? ` · Renews ${state.subscription.currentPeriodEnd}` : ""}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">
            <ShieldCheck size={17} />
            Secure checkout via Stripe
          </div>
        </div>
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {billingPlans.map((item) => {
          const current = item.id === activePlanId;
          return (
            <article key={item.id} className={`border p-5 ${current ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900"}`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white">{item.name}</h2>
                {item.id === "growth" && <span className="text-xs font-semibold text-cyan-200">POPULAR</span>}
              </div>
              <p className="mt-2 text-3xl font-bold text-white">
                ${item.price}
                <span className="text-sm font-medium text-slate-400">/mo</span>
              </p>
              <p className="mt-3 min-h-10 text-sm leading-5 text-slate-400">{item.description}</p>
              <ul className="mt-4 space-y-2">
                {item.features.map((feature) => (
                  <li key={feature} className="flex gap-2 text-xs leading-5 text-slate-300">
                    <Check size={15} className="mt-0.5 shrink-0 text-cyan-300" />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                disabled={current || isCheckingOut || isLoading}
                type="button"
                onClick={() => choosePlan(item.id)}
                className={`mt-5 w-full px-3 py-2.5 text-sm font-bold transition-colors ${current ? "border border-cyan-300/40 text-cyan-100" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"}`}
              >
                {current ? "Current plan" : isCheckingOut ? "Opening checkout..." : `Choose ${item.name}`}
              </button>
            </article>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Usage this month</h2>
          <p className="mt-1 text-sm text-slate-400">Usage resets with your billing period. Limits reflect the active plan.</p>
          <div className="mt-5 space-y-5">
            {state?.usage.map((item) => (
              <UsageRow key={item.metric} label={item.label} used={item.used} limit={item.limit} percentage={item.percentage} />
            ))}
            {!state && !isLoading && <p className="text-sm text-slate-400">No billing usage available yet.</p>}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Team seats</h2>
              <p className="mt-1 text-sm text-slate-400">Seats are enforced by your subscription and admin membership list.</p>
            </div>
          </div>
          <div className="mt-5 border border-slate-700 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Active seats</span>
              <span className="text-sm text-cyan-200">{state?.team.activeSeats ?? 0} / {activePlan.limits.seats}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Your owner account uses one seat. Manage invitations and role changes in Admin users.</p>
          </div>
          <div className="mt-4 space-y-2">
            {(state?.team.members ?? []).slice(0, 8).map((member) => (
              <div key={member.id} className="flex justify-between border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm">
                <span className="text-slate-200">{member.email || member.name}</span>
                <span className="text-slate-500">{member.role}</span>
              </div>
            ))}
            {!state && !isLoading && <p className="text-sm text-slate-400">No team members found.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}

function UsageRow({ label, used, limit, percentage }: { label: string; used: number; limit: number; percentage: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-400">{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="mt-2 h-2 bg-slate-800">
        <div className={`h-full ${percentage > 80 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
