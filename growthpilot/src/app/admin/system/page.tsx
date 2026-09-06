"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, Database, RefreshCw, ServerCog, TriangleAlert } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

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

export default function SystemHealthPage() {
  const [state, setState] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshLabel, setLastRefreshLabel] = useState("Not checked yet");

  async function loadHealth() {
    setError("");
    setIsRefreshing(true);
    const response = await fetch("/api/admin/system-health", {
      method: "GET",
      headers: await createAuthedJsonHeaders(),
    });
    const result = await response.json().catch(() => ({ error: "Unable to load system health." })) as SystemHealthState & { error?: string };
    setIsRefreshing(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to load system health.");
      return;
    }

    setState(result);
    setLastRefreshLabel(new Date(result.refreshTimestamp).toLocaleString());
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadHealth();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <Activity size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">System health</h1>
          <p className="mt-2 text-sm text-slate-400">Live application readiness, provider configuration, database signals, and integration errors.</p>
        </div>
        <button
          type="button"
          onClick={() => void loadHealth()}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-60"
        >
          <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
          {isRefreshing ? "Refreshing..." : "Run health check"}
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-4 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastRefreshLabel}</p>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(state?.services ?? []).map((service) => (
          <article key={service.name} className="border border-slate-700 bg-slate-900 p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{service.name}</p>
                <p className="mt-2 text-sm text-slate-400">{service.detail}</p>
              </div>
              {service.healthy ? <CheckCircle2 size={19} className="text-emerald-300" /> : <TriangleAlert size={19} className="text-amber-300" />}
            </div>
            <p className={`mt-4 text-xs font-semibold ${service.healthy ? "text-emerald-300" : "text-amber-200"}`}>{service.status}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Database signals</h2>
              <p className="mt-1 text-sm text-slate-400">Live platform counts from your workspace tables.</p>
            </div>
          </div>
          <div className="mt-6 space-y-5">
            {[
              ["Businesses", state?.database.businesses.toString() ?? "0", "Workspace records reachable by the owner"],
              ["Subscriptions", state?.database.subscriptions.toString() ?? "0", "Subscription rows in the live database"],
              ["Unresolved issues", state?.database.unresolvedIssues.toString() ?? "0", "Open website issues that still need work"],
              ["Webhook events", state?.database.recentWebhookEvents.toString() ?? "0", "Stripe webhooks written to the idempotency log"],
            ].map(([label, value, detail]) => (
              <div key={label}>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">{label}</span>
                  <span className="font-semibold text-white">{value}</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">{detail}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ServerCog size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Error signals</h2>
              <p className="mt-1 text-sm text-slate-400">Recent operational follow-up items for the owner.</p>
            </div>
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {[
              ["Last 24 hours", state?.errors.last24Hours.toString() ?? "0", "Open attention items across subscriptions and integrations"],
              ["Last 7 days", state?.errors.last7Days.toString() ?? "0", "Failed payments plus webhook processing volume"],
              ["Failed scans", state?.errors.failedScans.toString() ?? "0", "Unresolved website-quality issues still open"],
              ["Webhook exceptions", state?.errors.webhookExceptions.toString() ?? "0", "Stripe webhook configuration or processing problems"],
            ].map(([label, value, detail]) => (
              <article key={label} className="border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-xs text-slate-500">{label}</p>
                <p className="mt-2 text-2xl font-bold text-white">{value}</p>
                <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 border border-cyan-400/20 bg-cyan-400/5 p-5">
        <div className="flex items-start gap-3">
          <Activity size={20} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Production monitoring</h2>
            <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-400">Live health checks are fed by the owner database session, Stripe webhook processing, connected-account status, unresolved website issues, and provider configuration presence. Detailed logs still belong in secured monitoring tools, but the dashboard now reflects actual platform state instead of placeholders.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
