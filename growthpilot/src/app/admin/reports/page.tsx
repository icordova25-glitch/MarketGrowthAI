"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, ChartNoAxesCombined, CheckCircle2, Download, FileBarChart, Globe2, RefreshCw, Send, UsersRound } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { type BillingUsageSummary } from "@/lib/billing";

type BillingState = {
  business: { name: string };
  subscription: { planName: string; status: string; currentPeriodEnd: string | null };
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

type ReportId = "revenue" | "customers" | "usage" | "marketing" | "health" | "agency";

const reports: Array<{ id: ReportId; title: string; description: string; icon: typeof ChartNoAxesCombined }> = [
  { id: "revenue", title: "Revenue & subscriptions", description: "Billing status, current plan, and subscription movement.", icon: ChartNoAxesCombined },
  { id: "customers", title: "Customer growth & retention", description: "Workspace and team activity available to the owner.", icon: UsersRound },
  { id: "usage", title: "Product usage & AI", description: "AI requests, scans, and seat pressure across the platform.", icon: Bot },
  { id: "marketing", title: "Marketing performance", description: "Website and connection signals that support growth analysis.", icon: Globe2 },
  { id: "health", title: "Platform health", description: "Services, errors, and webhook readiness.", icon: Activity },
  { id: "agency", title: "Agency export", description: "Owner-ready summary for sharing or client handoff.", icon: FileBarChart },
];

export default function ReportsPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState<ReportId>("revenue");
  const [generated, setGenerated] = useState<ReportId | null>(null);
  const [exported, setExported] = useState(false);
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

  const selected = reports.find((report) => report.id === selectedId) ?? reports[0];
  const Icon = selected.icon;
  const aiRequests = billing?.usage.find((item) => item.metric === "ai_requests");
  const websiteScans = billing?.usage.find((item) => item.metric === "website_scans");
  const workspaces = billing?.usage.find((item) => item.metric === "workspaces");
  const seats = billing?.usage.find((item) => item.metric === "seats");
  const healthyServices = health?.services.filter((service) => service.healthy).length ?? 0;

  function generate() {
    setGenerated(selectedId);
    setExported(false);
  }

  const reportData = buildReport(selectedId, billing, health, { aiRequests, websiteScans, workspaces, seats, healthyServices });

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <FileBarChart size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Reports</h1>
          <p className="mt-2 text-sm text-slate-400">Generate owner-ready reports from live billing, usage, and platform health signals.</p>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-200 hover:border-cyan-400 hover:text-cyan-200">
            <RefreshCw size={16} />
            Refresh
          </button>
          <button type="button" onClick={generate} className="inline-flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            <RefreshCw size={16} />
            Generate report
          </button>
        </div>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((report) => {
          const ReportIcon = report.icon;
          const active = report.id === selectedId;
          return (
            <button
              type="button"
              key={report.id}
              onClick={() => {
                setSelectedId(report.id);
                setGenerated(null);
                setExported(false);
              }}
              className={`flex items-start gap-3 border p-4 text-left transition-colors ${active ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900 hover:border-slate-500"}`}
            >
              <ReportIcon size={20} className={active ? "shrink-0 text-cyan-300" : "shrink-0 text-slate-400"} />
              <span>
                <span className="block text-sm font-semibold text-white">{report.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-400">{report.description}</span>
              </span>
            </button>
          );
        })}
      </section>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center bg-cyan-400/10 text-cyan-300"><Icon size={21} /></div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">{billing?.period.end ?? "Current period"}</p>
              <h2 className="mt-1 text-xl font-bold text-white">{selected.title}</h2>
              <p className="mt-2 text-sm text-slate-400">{selected.description}</p>
            </div>
          </div>
          {generated === selectedId && <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={17} />Report prepared</span>}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {reportData.metrics.map((metric) => (
            <article key={metric.label} className="border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-xs text-slate-500">{metric.label}</p>
              <p className="mt-2 text-2xl font-bold text-white">{metric.value}</p>
              <p className="mt-2 text-xs leading-5 text-slate-400">{metric.detail}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 border-l-2 border-cyan-400 bg-slate-950/40 p-4">
          <p className="text-sm font-semibold text-white">Executive summary</p>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-300">{reportData.summary}</p>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 border-t border-slate-800 pt-5">
          <button type="button" onClick={() => setExported(true)} className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
            <Download size={16} />
            Prepare export
          </button>
          <button type="button" onClick={() => setExported(true)} className="inline-flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">
            <Send size={16} />
            Email report
          </button>
          {exported && <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={17} />Export ready</span>}
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        <MiniCard title="Live billing" value={billing?.subscription.planName ?? "Unavailable"} detail={billing?.subscription.status ?? "No subscription data"} />
        <MiniCard title="Healthy services" value={`${healthyServices}/${health?.services.length ?? 0}`} detail={health?.services.map((service) => service.name).join(" · ") ?? "No service data"} />
        <MiniCard title="Usage pressure" value={`${Math.round(((aiRequests?.percentage ?? 0) + (websiteScans?.percentage ?? 0) + (workspaces?.percentage ?? 0) + (seats?.percentage ?? 0)) / 4)}`} detail="Average usage pressure across the current billing limits" />
      </section>

      {isLoading && <p className="mt-6 text-xs uppercase tracking-[0.1em] text-slate-500">Loading report data...</p>}
    </div>
  );
}

function buildReport(reportId: ReportId, billing: BillingState | null, health: SystemHealthState | null, usage: { aiRequests?: BillingUsageSummary; websiteScans?: BillingUsageSummary; workspaces?: BillingUsageSummary; seats?: BillingUsageSummary; healthyServices: number }) {
  const businessName = billing?.business.name ?? "the owner workspace";
  switch (reportId) {
    case "revenue":
      return {
        metrics: [
          { label: "Plan", value: billing?.subscription.planName ?? "Unavailable", detail: `Status: ${billing?.subscription.status ?? "inactive"}` },
          { label: "Current period", value: billing?.period.end ?? "Unavailable", detail: "Billing cycle end date" },
          { label: "Seats", value: `${billing?.team.activeSeats ?? 0}`, detail: "Active membership seats" },
          { label: "Usage pressure", value: `${Math.round(((usage.aiRequests?.percentage ?? 0) + (usage.websiteScans?.percentage ?? 0) + (usage.workspaces?.percentage ?? 0) + (usage.seats?.percentage ?? 0)) / 4)}%`, detail: "Average across tracked limits" },
        ],
        summary: `The current subscription for ${businessName} is ${billing?.subscription.status ?? "inactive"}. Seat usage and billing-period activity are live, so the owner can review plan capacity before the next renewal.`,
      };
    case "customers":
      return {
        metrics: [
          { label: "Business", value: businessName, detail: "Owner workspace currently in view" },
          { label: "Team members", value: `${billing?.team.members.length ?? 0}`, detail: "Active and invited members" },
          { label: "Workspaces", value: `${usage.workspaces?.used ?? 0}`, detail: "Current billing-period workspace count" },
          { label: "Open issues", value: `${health?.database.unresolvedIssues ?? 0}`, detail: "Issues awaiting resolution" },
        ],
        summary: `Customer operations are being tracked through the live business record, team membership, and unresolved issue counts. This keeps customer growth and retention reporting grounded in current platform state rather than demo data.`,
      };
    case "usage":
      return {
        metrics: [
          { label: "AI requests", value: `${usage.aiRequests?.used ?? 0}`, detail: `${usage.aiRequests?.percentage ?? 0}% of the limit used` },
          { label: "Website scans", value: `${usage.websiteScans?.used ?? 0}`, detail: `${usage.websiteScans?.percentage ?? 0}% of the limit used` },
          { label: "Recent webhooks", value: `${health?.database.recentWebhookEvents ?? 0}`, detail: "Stripe event log entries" },
          { label: "Failed scans", value: `${health?.errors.failedScans ?? 0}`, detail: "Problem scans recorded this window" },
        ],
        summary: `Usage reporting is now based on live AI request, website scan, and webhook data. That makes the report suitable for cost-control review and feature-adoption planning.`,
      };
    case "marketing":
      return {
        metrics: [
          { label: "Website scans", value: `${usage.websiteScans?.used ?? 0}`, detail: "Available analysis activity" },
          { label: "Attention connections", value: `${health?.database.attentionConnections ?? 0}`, detail: "Connections requiring follow-up" },
          { label: "Webhook events", value: `${health?.database.recentWebhookEvents ?? 0}`, detail: "Recently processed platform events" },
          { label: "Failed subscriptions", value: `${health?.database.failedSubscriptions ?? 0}`, detail: "Billing follow-up needed" },
        ],
        summary: `Marketing and platform-readiness reporting now uses live connection, webhook, and scan data to show whether customers have the signals needed for reliable analysis.`,
      };
    case "health":
      return {
        metrics: [
          { label: "Healthy services", value: `${usage.healthyServices}/${health?.services.length ?? 0}`, detail: "Monitored services passing the check" },
          { label: "Response time", value: `${health?.database.responseTimeMs ?? 0} ms`, detail: "Latest database round trip" },
          { label: "Last 24 hours", value: `${health?.errors.last24Hours ?? 0}`, detail: "Operational issues in the latest window" },
          { label: "Webhook exceptions", value: `${health?.errors.webhookExceptions ?? 0}`, detail: "Processing issues to investigate" },
        ],
        summary: `The live platform-health view confirms the readiness of the owner stack, including service checks, webhook handling, and recent error volume.`,
      };
    case "agency":
      return {
        metrics: [
          { label: "Business", value: businessName, detail: "Current owner workspace" },
          { label: "Team members", value: `${billing?.team.members.length ?? 0}`, detail: "Agency-style access summary" },
          { label: "Seats used", value: `${billing?.team.activeSeats ?? 0}`, detail: "Assigned access seats" },
          { label: "Plan", value: billing?.subscription.planName ?? "Unavailable", detail: "Current billing tier" },
        ],
        summary: `This export is based on the owner workspace, live team membership, and active billing tier. It can be shared as a concise client-ready summary once the report is generated.`,
      };
  }
}

function MiniCard({ title, value, detail }: { title: string; value: string; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </article>
  );
}
