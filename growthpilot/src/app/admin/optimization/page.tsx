"use client";

import { useEffect, useMemo, useState } from "react";
import { Bot, CheckCircle2, Lightbulb, SearchCheck, Send, ShieldCheck, Sparkles } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type OpportunityId = "cost" | "retention" | "product";

type Opportunity = {
  id: OpportunityId;
  priority: string;
  title: string;
  evidence: string;
  impact: string;
  action: string;
  category: string;
};

type BillingState = {
  usage: Array<{
    metric: string;
    label: string;
    used: number;
    limit: number;
    percentage: number;
  }>;
  team: {
    activeSeats: number;
    members: Array<{ id: string; status: string; role: string }>;
  };
};

type SystemHealth = {
  database: {
    failedSubscriptions: number;
    unresolvedIssues: number;
    attentionConnections: number;
    recentWebhookEvents: number;
  };
  refreshTimestamp: string;
};

function buildOpportunities(billing: BillingState | null, health: SystemHealth | null): Opportunity[] {
  const aiUsage = billing?.usage.find((item) => item.metric === "ai_requests");
  const websiteUsage = billing?.usage.find((item) => item.metric === "website_scans");
  const over80Ai = (aiUsage?.percentage ?? 0) >= 80;
  const openIssues = health?.database.unresolvedIssues ?? 0;
  const failedSubs = health?.database.failedSubscriptions ?? 0;
  const reconnects = health?.database.attentionConnections ?? 0;
  const activeSeats = billing?.team.activeSeats ?? 0;
  const invitedUsers = billing?.team.members.filter((member) => member.status === "invited").length ?? 0;

  return [
    {
      id: "cost",
      priority: over80Ai ? "High priority" : "Monitor",
      category: "AI cost",
      title: over80Ai ? "AI usage is near this period limit" : "AI usage efficiency is stable",
      evidence: aiUsage
        ? `${aiUsage.used.toLocaleString()} of ${aiUsage.limit.toLocaleString()} AI actions are already used this period (${Math.round(aiUsage.percentage)}%).`
        : "AI usage metrics are not yet available for this workspace.",
      impact: over80Ai ? "Potential savings: prioritize lower-cost automation flows" : "Maintain routing quality and watch high-volume patterns",
      action: "Review top AI workflows, remove duplicate prompts, and route low-complexity actions to cheaper model paths.",
    },
    {
      id: "retention",
      priority: failedSubs > 0 || reconnects > 0 ? "Retention" : "Monitor",
      category: "Customer engagement",
      title: failedSubs > 0 ? `${failedSubs} subscriptions need attention` : "No failing subscriptions detected",
      evidence: `There are ${reconnects} integration reconnect warnings and ${openIssues} unresolved website issues across tracked workspaces.`,
      impact: failedSubs > 0 ? "Potential churn risk: High" : "Retention risk: Moderate",
      action: "Send targeted owner follow-ups for payment retries, reconnect instructions, and unresolved issue resolution plans.",
    },
    {
      id: "product",
      priority: invitedUsers > 0 || activeSeats > 1 ? "Product opportunity" : "Monitor",
      category: "Feature adoption",
      title: "Onboarding and feature adoption can be tightened",
      evidence: websiteUsage
        ? `${websiteUsage.used.toLocaleString()} website scans completed this period with ${activeSeats} active seat(s) and ${invitedUsers} invited teammate(s).`
        : `Team currently has ${activeSeats} active seat(s) and ${invitedUsers} invited teammate(s).`,
      impact: "Potential expansion: improve activation to increase retained usage",
      action: "Add a first-week activation checklist and push social/SEO milestone tasks directly into the action queue.",
    },
  ];
}

export default function OptimizationPage() {
  const [selected, setSelected] = useState<OpportunityId | null>(null);
  const [reviewed, setReviewed] = useState<OpportunityId[]>([]);
  const [campaignReady, setCampaignReady] = useState(false);
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const [billingResponse, healthResponse] = await Promise.all([
        fetch("/api/billing/state", { method: "GET", headers: await createAuthedJsonHeaders() }),
        fetch("/api/admin/system-health", { method: "GET", headers: await createAuthedJsonHeaders() }),
      ]);

      const billingResult = (await billingResponse.json().catch(() => ({ error: "Unable to load billing state." }))) as BillingState & { error?: string };
      const healthResult = (await healthResponse.json().catch(() => ({ error: "Unable to load system health." }))) as SystemHealth & { error?: string };

      if (!isActive) return;

      if (billingResponse.ok) setBilling(billingResult);
      if (healthResponse.ok) setHealth(healthResult);
      if (!billingResponse.ok || !healthResponse.ok) {
        setError(billingResult.error ?? healthResult.error ?? "Unable to load optimization signals.");
      }

      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const opportunities = useMemo(() => buildOpportunities(billing, health), [billing, health]);
  const active = opportunities.find((opportunity) => opportunity.id === selected);

  function markReviewed(id: OpportunityId) {
    setReviewed((current) => (current.includes(id) ? current : [...current, id]));
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300"><Sparkles size={21} /><span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform intelligence</span></div>
          <h1 className="mt-3 text-3xl font-bold text-white">AI Optimization Center</h1>
          <p className="mt-2 text-sm text-slate-400">AI analyzes live cost, retention, product, and adoption signals for owner review.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><ShieldCheck size={17} />Owner approval required</div>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-400">Loading live optimization signals...</p>}

      <section className="border border-cyan-500/30 bg-[#102a43] p-5">
        <div className="flex items-start gap-3">
          <Bot size={22} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">How platform optimization works</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">MarketGrowthAI combines product usage, subscription movement, AI usage pressure, integration health, and customer activity to identify optimization opportunities. It can prepare an investigation or campaign, but never sends customer communications or changes product settings without an owner decision.</p>
            {health?.refreshTimestamp && <p className="mt-3 text-xs uppercase tracking-[0.1em] text-cyan-200">Last refresh: {new Date(health.refreshTimestamp).toLocaleString()}</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          {opportunities.map((opportunity) => (
            <article key={opportunity.id} className={`border p-5 ${selected === opportunity.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900"}`}>
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`border px-2 py-1 text-xs font-semibold ${opportunity.id === "cost" ? "border-red-400/30 bg-red-400/10 text-red-100" : opportunity.id === "retention" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"}`}>{opportunity.priority}</span>
                    <span className="text-xs text-slate-500">{opportunity.category}</span>
                  </div>
                  <h2 className="mt-3 text-lg font-semibold text-white">{opportunity.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-slate-400">{opportunity.evidence}</p>
                  <p className="mt-3 text-sm font-semibold text-cyan-300">{opportunity.impact}</p>
                </div>
                <button type="button" onClick={() => setSelected(opportunity.id)} className="shrink-0 border border-cyan-400 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">{selected === opportunity.id ? "Viewing" : "Investigate"}</button>
              </div>
              {reviewed.includes(opportunity.id) && <p className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-emerald-300"><CheckCircle2 size={15} />Owner review recorded</p>}
            </article>
          ))}
        </div>

        <aside className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <SearchCheck size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Investigation workspace</h2>
              <p className="mt-1 text-sm text-slate-400">Review the selected signal and prepare a controlled follow-up.</p>
            </div>
          </div>

          {active ? (
            <div className="mt-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Selected opportunity</p>
              <h3 className="mt-2 text-lg font-semibold text-white">{active.title}</h3>
              <div className="mt-4 border-l-2 border-cyan-400 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-white">Recommended next move</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">{active.action}</p>
              </div>

              {active.id === "retention" && (
                <button type="button" onClick={() => setCampaignReady(true)} className="mt-5 inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Send size={16} />Prepare re-engagement campaign</button>
              )}

              {active.id === "cost" && (
                <div className="mt-5 space-y-3 border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-sm font-semibold text-white">Investigation scope</p>
                  <p className="text-sm text-slate-400">Review high-usage workspaces, route low-complexity tasks to lower-cost models, and set per-workspace usage alerts.</p>
                </div>
              )}

              {active.id === "product" && (
                <div className="mt-5 space-y-3 border border-slate-700 bg-slate-950/40 p-4">
                  <p className="text-sm font-semibold text-white">Product analysis</p>
                  <p className="text-sm text-slate-400">Compare onboarding completion and feature adoption, then test a combined first-analysis path for new workspaces.</p>
                </div>
              )}

              {campaignReady && (
                <div className="mt-5 border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-100"><CheckCircle2 size={17} />Campaign draft ready for owner approval.</p>
                </div>
              )}

              <button type="button" onClick={() => markReviewed(active.id)} className="mt-5 w-full border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">Mark owner review complete</button>
            </div>
          ) : (
            <p className="mt-5 border border-dashed border-slate-700 p-5 text-sm text-slate-500">Select an opportunity to open the investigation workspace.</p>
          )}
        </aside>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          ["AI efficiency", "Monitor cost per active workspace, model routing, and high-volume actions."],
          ["Customer retention", "Surface dormant accounts before they become cancellations."],
          ["Product opportunity", "Use feature-adoption gaps to prioritize onboarding and roadmap changes."],
        ].map(([title, detail]) => (
          <article key={title} className="border border-slate-700 bg-slate-900 p-5">
            <Lightbulb size={19} className="text-cyan-300" />
            <h2 className="mt-3 text-sm font-semibold text-white">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
          </article>
        ))}
      </section>
    </div>
  );
}
