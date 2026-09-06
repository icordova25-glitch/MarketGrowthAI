"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Lightbulb, RefreshCw, SlidersHorizontal, Sparkles, UsersRound } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { type BillingUsageSummary } from "@/lib/billing";

type BillingState = {
  usage: BillingUsageSummary[];
  team: { activeSeats: number };
  subscription: { planName: string; status: string };
};

type SystemHealthState = {
  database: {
    unresolvedIssues: number;
    attentionConnections: number;
    recentWebhookEvents: number;
  };
  errors: { failedScans: number; webhookExceptions: number };
  services: Array<{ name: string; status: string; detail: string; healthy: boolean }>;
  refreshTimestamp: string;
};

export default function ProductOptimizationPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [selected, setSelected] = useState<string>("competitors");
  const [experimentReady, setExperimentReady] = useState(false);
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
      setLastUpdatedLabel(new Date(healthResult.refreshTimestamp).toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const usage = billing?.usage ?? [];
  const selectedUsage = usage.find((item) => item.metric === selected) ?? null;
  const featureSignals = [
    { id: "ai_requests", name: "AI request flow", item: usage.find((item) => item.metric === "ai_requests") },
    { id: "website_scans", name: "Website analysis", item: usage.find((item) => item.metric === "website_scans") },
    { id: "workspaces", name: "Workspace capacity", item: usage.find((item) => item.metric === "workspaces") },
    { id: "seats", name: "Seat usage", item: usage.find((item) => item.metric === "seats") },
  ];

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <SlidersHorizontal size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform intelligence</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Product optimization</h1>
          <p className="mt-2 text-sm text-slate-400">Live usage signals that help prioritize onboarding, workflow, and feature experiments.</p>
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
          <Sparkles size={21} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Feature signal analysis</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">The product page now highlights live billing and platform usage rather than a fixed demo list. Use it to see which workflows are active, which limits are being approached, and where experiments should be proposed first.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Plan" value={billing?.subscription.planName ?? "Unavailable"} detail={billing?.subscription.status ?? "No subscription data"} />
        <StatCard label="Seats in use" value={`${billing?.team.activeSeats ?? 0}`} detail="Current owner workspace access" />
        <StatCard label="Open issues" value={`${health?.database.unresolvedIssues ?? 0}`} detail="Product and support items to review" />
        <StatCard label="Webhook events" value={`${health?.database.recentWebhookEvents ?? 0}`} detail="Platform events available for analysis" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.18fr_0.82fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <UsersRound size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Feature signals</h2>
              <p className="mt-1 text-sm text-slate-400">Current usage across the live billing period.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {featureSignals.map((feature) => (
              <button key={feature.id} type="button" onClick={() => { setSelected(feature.id); setExperimentReady(false); }} className={`flex w-full items-center justify-between border px-3 py-3 text-left ${selected === feature.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/40"}`}>
                <div>
                  <p className="text-sm font-semibold text-white">{feature.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{feature.item ? `${feature.item.used.toLocaleString()} uses · ${feature.item.percentage}% of limit` : "No usage data yet"}</p>
                </div>
                <span className="text-xs font-semibold text-cyan-200">{feature.item?.percentage ?? 0}%</span>
              </button>
            ))}
          </div>
        </div>

        <aside className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Lightbulb size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Experiment workspace</h2>
              <p className="mt-1 text-sm text-slate-400">Turn the selected signal into an owner-reviewed change.</p>
            </div>
          </div>
          <div className="mt-5 border-l-2 border-cyan-400 bg-slate-950/40 p-4">
            <p className="text-sm font-semibold text-white">Selected signal</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">{selectedUsage ? `The ${selectedUsage.label} metric is at ${selectedUsage.percentage}% of its current limit. Review the corresponding workflow and reduce friction only if the signal remains strong after a few cycles.` : "Select a signal to see a live recommendation."}</p>
          </div>
          <button type="button" onClick={() => setExperimentReady(true)} className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            <Sparkles size={16} />
            Prepare onboarding experiment
          </button>
          {experimentReady && <div className="mt-5 border border-emerald-500/30 bg-emerald-500/10 p-4"><p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100"><CheckCircle2 size={17} />Experiment brief prepared</p><p className="mt-2 text-sm leading-6 text-emerald-100/75">The proposed audience, onboarding change, success metric, and rollback criteria are ready for owner review. No customer experience has changed.</p></div>}
          {isLoading && <p className="mt-4 text-xs uppercase tracking-[0.1em] text-slate-500">Loading product signals...</p>}
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <MiniCard title="Highest usage" detail={featureSignals.reduce((best, feature) => (feature.item && feature.item.percentage > (best.item?.percentage ?? -1) ? feature : best), featureSignals[0]).name} value={String(featureSignals.reduce((best, feature) => (feature.item && feature.item.percentage > (best.item?.percentage ?? -1) ? feature : best), featureSignals[0]).item?.percentage ?? 0)} />
        <MiniCard title="Service health" detail={health?.services.map((service) => service.name).join(" · ") ?? "No service data"} value={`${health?.services.filter((service) => service.healthy).length ?? 0}/${health?.services.length ?? 0}`} />
        <MiniCard title="Support pressure" detail="Failed scans and unresolved issues from the live health window" value={`${(health?.errors.failedScans ?? 0) + (health?.database.unresolvedIssues ?? 0)}`} />
      </section>
    </div>
  );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function MiniCard({ title, detail, value }: { title: string; detail: string; value: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">{title}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
    </article>
  );
}
