"use client";

import { useEffect, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, ChartNoAxesCombined, CreditCard, RefreshCw, ShieldCheck, UsersRound } from "lucide-react";
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
  database: {
    businesses: number;
    subscriptions: number;
    unresolvedIssues: number;
    failedSubscriptions: number;
    attentionConnections: number;
    recentWebhookEvents: number;
    responseTimeMs: number;
  };
  errors: {
    last24Hours: number;
    last7Days: number;
    failedScans: number;
    webhookExceptions: number;
  };
  refreshTimestamp: string;
};

export default function AdminDashboard() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      setIsRefreshing(true);
      setError("");

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
        setIsRefreshing(false);
        return;
      }

      if (!healthResponse.ok) {
        setError(healthResult.error ?? "Unable to load system health.");
        setBilling(null);
        setHealth(null);
        setIsRefreshing(false);
        return;
      }

      setBilling(billingResult);
      setHealth(healthResult);
      setLastUpdatedLabel(new Date(healthResult.refreshTimestamp).toLocaleString());
      setIsRefreshing(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const activePlanId = billing?.subscription.plan ?? "starter";
  const activePlan = billingPlans.find((plan) => plan.id === activePlanId) ?? billingPlans[0];
  const usage = billing?.usage ?? [];
  const websiteScans = usage.find((item) => item.metric === "website_scans");
  const aiRequests = usage.find((item) => item.metric === "ai_requests");
  const workspaces = usage.find((item) => item.metric === "workspaces");
  const seats = usage.find((item) => item.metric === "seats");
  const operationalServices = health?.services ?? [];
  const healthyServices = operationalServices.filter((service) => service.healthy).length;
  const servicePercent = operationalServices.length > 0 ? Math.round((healthyServices / operationalServices.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Platform operations</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Admin dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Live business, billing, and operational signals for the owner account.</p>
        </div>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Refresh dashboard"}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Plan"
          value={activePlan.name}
          detail={billing?.subscription.status ? `Status: ${billing.subscription.status}` : "No subscription data"}
          accent="text-cyan-200"
          icon={<CreditCard size={18} className="text-cyan-300" />}
        />
        <MetricCard
          label="Business"
          value={billing?.business.name ?? "Unavailable"}
          detail={billing?.period ? `Period ends ${billing.period.end}` : "Billing period unavailable"}
          accent="text-white"
          icon={<ChartNoAxesCombined size={18} className="text-cyan-300" />}
        />
        <MetricCard
          label="Seats"
          value={billing?.team.activeSeats.toString() ?? "0"}
          detail={`${billing?.limits.seats ?? 0} seat limit · ${billing?.team.members.length ?? 0} members`}
          accent="text-emerald-200"
          icon={<UsersRound size={18} className="text-cyan-300" />}
        />
        <MetricCard
          label="System health"
          value={`${healthyServices}/${operationalServices.length || 0}`}
          detail={`${servicePercent}% of monitored services healthy`}
          accent={servicePercent >= 75 ? "text-emerald-200" : "text-amber-200"}
          icon={<Activity size={18} className="text-cyan-300" />}
        />
      </section>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center gap-3">
          <ChartNoAxesCombined size={20} className="text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Usage snapshot</h2>
            <p className="mt-1 text-sm text-slate-400">Live billing period usage and seat pressure at a glance.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          <UsageMiniCard label="Website scans" value={websiteScans?.used ?? 0} limit={websiteScans?.limit ?? 0} />
          <UsageMiniCard label="AI requests" value={aiRequests?.used ?? 0} limit={aiRequests?.limit ?? 0} />
          <UsageMiniCard label="Workspaces" value={workspaces?.used ?? 0} limit={workspaces?.limit ?? 0} />
          <UsageMiniCard label="Seats in use" value={seats?.used ?? 0} limit={seats?.limit ?? 0} />
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Billing usage</h2>
              <p className="mt-1 text-sm text-slate-400">Current period usage for the owner account and platform limits.</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {usage.map((item) => (
              <UsageRow key={item.metric} label={item.label} used={item.used} limit={item.limit} percentage={item.percentage} />
            ))}
            {!billing && !error && <p className="text-sm text-slate-400">Loading billing signals...</p>}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Operational health</h2>
              <p className="mt-1 text-sm text-slate-400">Provider readiness, webhook sync, and database signals.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            {operationalServices.map((service) => (
              <article key={service.name} className="border border-slate-700 bg-slate-950/40 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-500">{service.detail}</p>
                  </div>
                  {service.healthy ? <ArrowUpRight size={16} className="text-emerald-300" /> : <ArrowDownRight size={16} className="text-amber-300" />}
                </div>
                <p className={`mt-4 text-xs font-semibold ${service.healthy ? "text-emerald-300" : "text-amber-200"}`}>{service.status}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Database signals</h2>
          <p className="mt-1 text-sm text-slate-400">Counts surfaced from the live platform tables.</p>
          <div className="mt-5 space-y-4">
            {[
              ["Businesses", health?.database.businesses ?? 0],
              ["Subscriptions", health?.database.subscriptions ?? 0],
              ["Unresolved issues", health?.database.unresolvedIssues ?? 0],
              ["Webhook events", health?.database.recentWebhookEvents ?? 0],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-center justify-between border-b border-slate-800 pb-4 last:border-0 last:pb-0">
                <div>
                  <p className="text-sm text-slate-200">{label as string}</p>
                  <p className="mt-1 text-xs text-slate-500">Live owner workspace data</p>
                </div>
                <p className="text-xl font-bold text-white">{value as number}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Attention items</h2>
              <p className="mt-1 text-sm text-slate-400">Signals that need owner follow-up or operational review.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <AttentionCard title="Failed subscriptions" value={health?.database.failedSubscriptions ?? 0} detail="Subscriptions that need a retry or payment follow-up." />
            <AttentionCard title="Connected accounts needing attention" value={health?.database.attentionConnections ?? 0} detail="Customer connections that still require review." />
            <AttentionCard title="Last 24 hours" value={health?.errors.last24Hours ?? 0} detail="Open errors across payments, sync, and scans." />
            <AttentionCard title="Webhook exceptions" value={health?.errors.webhookExceptions ?? 0} detail="Stripe event processing issues recorded in the last window." />
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

function UsageMiniCard({ label, value, limit }: { label: string; value: number; limit: number }) {
  return (
    <article className="border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value.toLocaleString()}</p>
      <p className="mt-2 text-xs text-slate-400">Limit {limit.toLocaleString()}</p>
    </article>
  );
}

function AttentionCard({ title, value, detail }: { title: string; value: number; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-2xl font-bold text-amber-200">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </article>
  );
}
