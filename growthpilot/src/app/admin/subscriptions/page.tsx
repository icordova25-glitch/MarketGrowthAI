"use client";

import { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BadgeDollarSign, ChartNoAxesCombined, CreditCard, RefreshCw, UsersRound } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { billingPlans, type BillingUsageSummary, type PlanId } from "@/lib/billing";

type BillingState = {
  business: { id: string; name: string };
  subscription: {
    plan: PlanId;
    planName: string;
    status: string;
    currentPeriodEnd: string | null;
  };
  limits: Record<string, number>;
  usage: BillingUsageSummary[];
  team: { activeSeats: number; members: Array<{ id: string; email: string; role: string; status: string }> };
  period: { start: string; end: string };
};

type SystemHealthState = {
  services: Array<{ name: string; status: string; detail: string; healthy: boolean }>;
  errors: {
    last24Hours: number;
    last7Days: number;
    failedScans: number;
    webhookExceptions: number;
  };
};

export default function SubscriptionsAdminPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const headers = await createAuthedJsonHeaders();
      const [billingResponse, healthResponse] = await Promise.all([
        fetch("/api/billing/state", { method: "GET", headers }),
        fetch("/api/admin/system-health", { method: "GET", headers }),
      ]);

      const billingResult = await billingResponse.json().catch(() => ({ error: "Unable to load billing state." })) as BillingState & { error?: string };
      const healthResult = await healthResponse.json().catch(() => ({ error: "Unable to load system health." })) as SystemHealthState & { error?: string };

      if (!isActive) return;

      if (!billingResponse.ok) {
        setError(billingResult.error ?? "Unable to load billing state.");
        setBilling(null);
        setHealth(null);
        setIsLoading(false);
        return;
      }

      if (!healthResponse.ok) {
        setError(healthResult.error ?? "Unable to load system health.");
        setBilling(null);
        setHealth(null);
        setIsLoading(false);
        return;
      }

      setBilling(billingResult);
      setHealth(healthResult);
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const activePlanId = billing?.subscription.plan ?? "starter";
  const activePlan = billingPlans.find((plan) => plan.id === activePlanId) ?? billingPlans[0];
  const usage = billing?.usage ?? [];
  const planStatus = billing?.subscription.status ?? "inactive";
  const seatsUsed = billing?.team.activeSeats ?? 0;
  const seatLimit = billing?.limits.seats ?? 0;
  const failedPayments = health?.errors.last24Hours ?? 0;
  const webhookExceptions = health?.errors.webhookExceptions ?? 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <CreditCard size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Subscription & revenue</h1>
          <p className="mt-2 text-sm text-slate-400">Live subscription state, usage pressure, and billing-follow-up signals for the owner account.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="border border-cyan-500/30 bg-[#102a43] p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <h2 className="text-lg font-semibold text-white">Active subscription</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Stripe remains the financial system of record. This view reflects the current subscription plan, billing period, seat pressure, and live usage limits from the production database.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
            <BadgeDollarSign size={16} />
            Webhook sync required
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Plan" value={activePlan.name} detail={`Status: ${planStatus}`} accent="text-cyan-200" icon={<ChartNoAxesCombined size={18} className="text-cyan-300" />} />
        <MetricCard label="Business" value={billing?.business.name ?? "Unavailable"} detail={billing?.period.end ? `Current period ends ${billing.period.end}` : "Billing period unavailable"} accent="text-white" icon={<CreditCard size={18} className="text-cyan-300" />} />
        <MetricCard label="Seats" value={`${seatsUsed}`} detail={`${seatLimit} seat limit · ${billing?.team.members.length ?? 0} members`} accent="text-emerald-200" icon={<UsersRound size={18} className="text-cyan-300" />} />
        <MetricCard label="Billing follow-up" value={`${failedPayments + webhookExceptions}`} detail="Failed payment and webhook exception count" accent={failedPayments + webhookExceptions > 0 ? "text-amber-200" : "text-emerald-200"} icon={<BadgeDollarSign size={18} className="text-cyan-300" />} />
      </section>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Available plans</h2>
            <p className="mt-1 text-sm text-slate-400">All subscription tiers in your Stripe catalog. Use Billing to switch plans.</p>
          </div>
          <a
            href="/billing"
            className="inline-flex items-center justify-center border border-cyan-400 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"
          >
            Open Billing
          </a>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {billingPlans.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            return (
              <article key={plan.id} className={`border p-4 ${isCurrent ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/40"}`}>
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                  {isCurrent && <span className="text-xs font-semibold uppercase tracking-[0.08em] text-cyan-200">Current</span>}
                </div>
                <p className="mt-2 text-xl font-bold text-white">${plan.price}<span className="ml-1 text-sm font-medium text-slate-400">/mo</span></p>
                <p className="mt-2 min-h-10 text-sm leading-5 text-slate-400">{plan.description}</p>
                <p className="mt-3 text-xs text-slate-500">
                  Limits: {plan.limits.scans} scans · {plan.limits.aiActions} AI actions · {plan.limits.workspaces} workspace{plan.limits.workspaces === 1 ? "" : "s"} · {plan.limits.seats} seat{plan.limits.seats === 1 ? "" : "s"}
                </p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ChartNoAxesCombined size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Usage this period</h2>
              <p className="mt-1 text-sm text-slate-400">Usage resets with the billing cycle and maps to plan limits.</p>
            </div>
          </div>
          <div className="mt-5 space-y-5">
            {usage.map((item) => (
              <UsageRow key={item.metric} label={item.label} used={item.used} limit={item.limit} percentage={item.percentage} />
            ))}
            {!billing && !isLoading && <p className="text-sm text-slate-400">No billing usage available yet.</p>}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Team seats</h2>
              <p className="mt-1 text-sm text-slate-400">Seats are enforced by the active subscription and admin membership list.</p>
            </div>
          </div>
          <div className="mt-5 border border-slate-700 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white">Active seats</span>
              <span className="text-sm text-cyan-200">{seatsUsed} / {seatLimit}</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">Your owner account uses one seat. Manage invitations and role changes in Admin users.</p>
          </div>
          <div className="mt-4 space-y-2">
            {(billing?.team.members ?? []).slice(0, 8).map((member) => (
              <div key={member.id} className="flex justify-between border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm">
                <span className="text-slate-200">{member.email || member.id}</span>
                <span className="text-slate-500">{member.role}</span>
              </div>
            ))}
            {!billing && !isLoading && <p className="text-sm text-slate-400">No team members found.</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Billing follow-up</h2>
          <p className="mt-1 text-sm text-slate-400">Signals that need a billing or support decision.</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <FollowUpCard title="Failed payments" value={failedPayments} detail="Recent billing issues that may require customer outreach." direction="down" />
            <FollowUpCard title="Webhook exceptions" value={webhookExceptions} detail="Subscription sync problems recorded by the owner dashboard." direction={webhookExceptions > 0 ? "down" : "up"} />
            <FollowUpCard title="Current plan" value={activePlan.price} detail="Monthly plan price from the active billing tier." direction="up" />
            <FollowUpCard title="Seat pressure" value={seatLimit > 0 ? Math.round((seatsUsed / seatLimit) * 100) : 0} detail="Percent of the active seat limit currently in use." direction={seatsUsed > seatLimit ? "down" : "up"} suffix="%" />
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ArrowUpRight size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Revenue context</h2>
              <p className="mt-1 text-sm text-slate-400">The live plan and usage signals that frame recurring revenue.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoCard label="Plan name" value={activePlan.name} />
            <InfoCard label="Status" value={planStatus} />
            <InfoCard label="Current period" value={billing?.period.end ?? "Unavailable"} />
            <InfoCard label="Members" value={`${billing?.team.members.length ?? 0}`} />
          </div>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, accent, icon }: { label: string; value: string; detail: string; accent: string; icon: React.ReactNode }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-400">{label}</p>
          <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
        </div>
        {icon}
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
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

function FollowUpCard({ title, value, detail, direction, suffix = "" }: { title: string; value: number | string; detail: string; direction: "up" | "down"; suffix?: string }) {
  const displayValue = typeof value === "number" ? `${value}${suffix}` : value;
  return (
    <article className="border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <p className={`mt-2 inline-flex items-center gap-1 text-2xl font-bold ${direction === "down" ? "text-amber-200" : "text-emerald-200"}`}>
        {direction === "down" && <ArrowDownRight size={16} />}
        {direction === "up" && <ArrowUpRight size={16} />}
        {displayValue}
      </p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </article>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </article>
  );
}
