"use client";

import { useEffect, useState } from "react";
import { Activity, CheckCircle2, ExternalLink, Landmark, RefreshCw, ShieldCheck, WalletCards } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type SystemHealthState = {
  services: Array<{ name: string; status: string; detail: string; healthy: boolean }>;
  database: {
    recentWebhookEvents: number;
    failedSubscriptions: number;
    attentionConnections: number;
  };
  errors: {
    last24Hours: number;
    webhookExceptions: number;
  };
  refreshTimestamp: string;
};

export default function PayoutsPage() {
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/admin/system-health", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });
      const result = await response.json().catch(() => ({ error: "Unable to load system health." })) as SystemHealthState & { error?: string };
      if (!isActive) return;

      if (!response.ok) {
        setError(result.error ?? "Unable to load system health.");
        setHealth(null);
        setIsLoading(false);
        return;
      }

      setHealth(result);
      setLastUpdatedLabel(new Date(result.refreshTimestamp).toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const stripeService = health?.services.find((service) => service.name.toLowerCase().includes("stripe"));
  const webhookService = health?.services.find((service) => service.name.toLowerCase().includes("webhook"));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <Landmark size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Payouts & Stripe</h1>
          <p className="mt-2 text-sm text-slate-400">Live payout readiness, webhook processing, and Stripe configuration signals.</p>
        </div>
        <a href="https://dashboard.stripe.com" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
          <ExternalLink size={16} />
          Manage in Stripe
        </a>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex items-start gap-3">
          <ShieldCheck size={22} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Stripe securely handles the money flow</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">Customer payments are collected through Stripe Checkout and synced back into the platform through webhooks. This page now surfaces live operational readiness rather than static payout placeholders.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoMetric label="Webhook events" value={health?.database.recentWebhookEvents ?? 0} detail="Events written to the idempotency log" />
        <InfoMetric label="Failed subscriptions" value={health?.database.failedSubscriptions ?? 0} detail="Subscriptions that need a payment follow-up" />
        <InfoMetric label="Webhook exceptions" value={health?.errors.webhookExceptions ?? 0} detail="Sync errors that should be reviewed" />
        <InfoMetric label="Attention connections" value={health?.database.attentionConnections ?? 0} detail="Connections requiring owner action" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <WalletCards size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Stripe readiness</h2>
              <p className="mt-1 text-sm text-slate-400">Operational signal from the live health check.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            <StatusRow label="Stripe service" service={stripeService} />
            <StatusRow label="Webhook pipeline" service={webhookService} />
            <StatusRow label="Recent health window" value={`${health?.errors.last24Hours ?? 0} issues`} healthy={(health?.errors.last24Hours ?? 0) === 0} />
          </div>
          {isLoading && <p className="mt-4 text-xs uppercase tracking-[0.1em] text-slate-500">Loading payout signals...</p>}
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Payout boundary</h2>
              <p className="mt-1 text-sm text-slate-400">What belongs in the app versus what stays in Stripe.
              </p>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <BoundaryCard title="Store in the app" items={[
              "stripe_customer_id",
              "stripe_subscription_id",
              "stripe_price_id",
              "subscription status",
            ]} accent="emerald" />
            <BoundaryCard title="Keep in Stripe" items={[
              "Card details",
              "Bank account details",
              "Routing numbers",
              "Payout schedule configuration",
            ]} accent="red" />
          </div>
          <p className="mt-5 text-sm leading-6 text-slate-400">Use Stripe for transfers, tax documents, disputes, and payout account management. The platform should only mirror the operational state needed for support and billing review.</p>
        </div>
      </section>
    </div>
  );
}

function InfoMetric({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-3xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function StatusRow({ label, service, value, healthy = true }: { label: string; service?: { status: string; detail: string; healthy: boolean }; value?: string; healthy?: boolean }) {
  const resolvedHealthy = service?.healthy ?? healthy;
  return (
    <div className="border border-slate-700 bg-slate-950/40 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{label}</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">{service?.detail ?? value}</p>
        </div>
        {resolvedHealthy ? <CheckCircle2 size={16} className="text-emerald-300" /> : <RefreshCw size={16} className="text-amber-300" />}
      </div>
      <p className={`mt-3 text-xs font-semibold ${resolvedHealthy ? "text-emerald-300" : "text-amber-200"}`}>{service?.status ?? value ?? "Unknown"}</p>
    </div>
  );
}

function BoundaryCard({ title, items, accent }: { title: string; items: string[]; accent: "emerald" | "red" }) {
  const colorClasses = accent === "emerald" ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-100" : "border-red-500/25 bg-red-500/5 text-red-100";
  return (
    <article className={`border p-4 ${colorClasses}`}>
      <p className="text-sm font-semibold">{title}</p>
      <ul className="mt-3 space-y-2 text-sm text-slate-200">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </article>
  );
}
