"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, CheckCircle2, CircleDollarSign, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { type BillingUsageSummary } from "@/lib/billing";

type BillingState = {
  usage: BillingUsageSummary[];
};

type SystemHealthState = {
  database: {
    recentWebhookEvents: number;
    failedSubscriptions: number;
    attentionConnections: number;
  };
  errors: {
    last24Hours: number;
    failedScans: number;
    webhookExceptions: number;
  };
  services: Array<{ name: string; status: string; detail: string; healthy: boolean }>;
  refreshTimestamp: string;
};

export default function AiCostsPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [planReady, setPlanReady] = useState(false);
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
      setLastUpdatedLabel(new Date(healthResult.refreshTimestamp).toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const usage = billing?.usage ?? [];
  const aiRequests = usage.find((item) => item.metric === "ai_requests");
  const websiteScans = usage.find((item) => item.metric === "website_scans");
  const workspaces = usage.find((item) => item.metric === "workspaces");
  const seats = usage.find((item) => item.metric === "seats");
  const flagCount = (health?.errors.failedScans ?? 0) + (health?.errors.webhookExceptions ?? 0) + (health?.database.failedSubscriptions ?? 0);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <CircleDollarSign size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform intelligence</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">AI cost optimization</h1>
          <p className="mt-2 text-sm text-slate-400">Live AI usage pressure, webhook stability, and cost-control signals for the owner account.</p>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="border border-cyan-500/30 bg-[#102a43] p-5">
        <div className="flex items-start gap-3">
          <Bot size={21} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Usage-driven cost signals</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">The dashboard now measures real usage pressure from AI requests, website scans, and seat activity instead of static demo spend. Use it to decide whether to tighten routing, reduce noisy requests, or investigate high-volume workspaces.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="AI requests" value={aiRequests?.used ?? 0} detail={aiRequests ? `${aiRequests.percentage}% of the current limit used` : "No usage yet"} />
        <MetricCard label="Website scans" value={websiteScans?.used ?? 0} detail={websiteScans ? `${websiteScans.percentage}% of the current limit used` : "No usage yet"} />
        <MetricCard label="Seat pressure" value={seats?.percentage ?? 0} detail={seats ? `${seats.used} active seats` : "No seat data yet"} suffix="%" />
        <MetricCard label="Attention items" value={flagCount} detail="Failed scans, webhook exceptions, and failed subscriptions" tone={flagCount > 0 ? "amber" : "emerald"} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Optimization plan</h2>
              <p className="mt-1 text-sm text-slate-400">Live signals that justify a cost-control decision.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <UsageRow label="AI requests" item={aiRequests} />
            <UsageRow label="Website scans" item={websiteScans} />
            <UsageRow label="Workspaces" item={workspaces} />
            <UsageRow label="Seats" item={seats} />
          </div>
          {isLoading && <p className="mt-4 text-xs uppercase tracking-[0.1em] text-slate-500">Loading AI signals...</p>}
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Efficiency recommendation</h2>
              <p className="mt-1 text-sm text-slate-400">Owner-reviewed follow-up based on the current live signal set.</p>
            </div>
          </div>
          <div className="mt-5 border-l-2 border-amber-300 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-white">Recommendation</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">If AI requests continue to outpace other usage metrics, review high-volume workspaces first and tighten expensive follow-up flows only after checking customer impact. Recent webhook or failed-scan issues should be resolved before changing model routing.</p>
          </div>
          <button type="button" onClick={() => setPlanReady(true)} className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            <ShieldCheck size={16} />
            Prepare cost-control plan
          </button>
          {planReady && <div className="mt-5 border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100"><CheckCircle2 size={17} />Plan prepared</p><p className="mt-2 text-sm leading-6 text-emerald-100/75">The plan is ready for owner review. No model routing or customer configuration has changed.</p></div>}
        </div>
      </section>
    </div>
  );
}

function MetricCard({ label, value, detail, suffix = "", tone = "cyan" }: { label: string; value: number; detail: string; suffix?: string; tone?: "cyan" | "amber" | "emerald" }) {
  const colorClass = tone === "amber" ? "text-amber-200" : tone === "emerald" ? "text-emerald-200" : "text-cyan-200";
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-3 text-3xl font-bold ${colorClass}`}>{value}{suffix}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function UsageRow({ label, item }: { label: string; item?: BillingUsageSummary }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="text-slate-200">{label}</span>
        <span className="text-slate-400">{item ? `${item.used.toLocaleString()} / ${item.limit.toLocaleString()}` : "No data"}</span>
      </div>
      <div className="mt-2 h-2 bg-slate-800">
        <div className={`h-full ${item && item.percentage > 80 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${item?.percentage ?? 0}%` }} />
      </div>
    </div>
  );
}
