"use client";

import { useEffect, useMemo, useState } from "react";
import { BellRing, CalendarClock, CheckCircle2, ClipboardCheck, FileBarChart, Mail, MessageSquareText, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type CalendarItem = {
  id: string;
  type: string;
  title: string;
  date: string;
};

type Workflow = {
  id: string;
  title: string;
  trigger: string;
  action: string;
  active: boolean;
};

type BusinessAnalysisResponse = {
  analysis: {
    overallScore: number;
    summary: string;
    strongestSocial: { channel: string; score: number; engagement: number } | null;
    opportunities: Array<{
      id: string;
      priority: "critical" | "high" | "medium" | "low";
      category: string;
      title: string;
      evidence: string;
      recommendation: string;
      impact: string;
      effort: string;
    }>;
    dimensions: Array<{
      key: string;
      label: string;
      score: number;
    }>;
    activeChannels: string[];
  };
};

type BillingStateResponse = {
  subscription: {
    plan: string;
    planName: string;
    status: string;
  };
  usage: Array<{
    metric: string;
    label: string;
    used: number;
    limit: number;
    percentage: number;
  }>;
};

const initialWorkflows: Workflow[] = [
  {
    id: "scheduled-content",
    title: "Scheduled content review",
    trigger: "A draft reaches its scheduled date",
    action: "Move it to approval before publishing",
    active: true,
  },
  {
    id: "review-alert",
    title: "New review response",
    trigger: "A new 3-star or lower review arrives",
    action: "Generate a response draft for approval",
    active: true,
  },
  {
    id: "seo-alert",
    title: "SEO issue follow-up",
    trigger: "A high-priority website issue is detected",
    action: "Create a recommended action and notify the owner",
    active: false,
  },
  {
    id: "weekly-report",
    title: "Weekly growth report",
    trigger: "Every Monday at 9:00 AM",
    action: "Prepare a summary of score, opportunities, and content performance",
    active: true,
  },
];

function getUsageSummary(usage: BillingStateResponse["usage"], metric: string) {
  return usage.find((item) => item.metric === metric);
}

export default function AutomationPage() {
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [workflows, setWorkflows] = useState(initialWorkflows);
  const [approvedContent, setApprovedContent] = useState<string[]>([]);
  const [reportReady, setReportReady] = useState(false);
  const [reviewState, setReviewState] = useState<"draft" | "approved">("draft");
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisResponse | null>(null);
  const [billingState, setBillingState] = useState<BillingStateResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/content-calendar", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });
      const result = (await response.json().catch(() => ({ items: [] }))) as { items?: CalendarItem[] };
      if (!isActive || !response.ok) return;
      setCalendar(Array.isArray(result.items) ? result.items : []);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const [analysisResponse, billingResponse] = await Promise.all([
        fetch("/api/business-analysis", { method: "GET", headers: await createAuthedJsonHeaders() }),
        fetch("/api/billing/state", { method: "GET", headers: await createAuthedJsonHeaders() }),
      ]);

      const analysisJson = (await analysisResponse.json().catch(() => ({ error: "Unable to load business analysis." }))) as BusinessAnalysisResponse & { error?: string };
      const billingJson = (await billingResponse.json().catch(() => ({ error: "Unable to load billing state." }))) as BillingStateResponse & { error?: string };
      if (!isActive) return;

      if (analysisResponse.ok) setAnalysisState(analysisJson);
      if (billingResponse.ok) setBillingState(billingJson);

      const firstError = !analysisResponse.ok ? analysisJson.error : !billingResponse.ok ? billingJson.error : "";
      setError(firstError ?? "");
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const strongestChannel = analysisState?.analysis.strongestSocial?.channel ?? "your primary channel";
  const activeChannels = analysisState?.analysis.activeChannels ?? [];
  const analysisSummary = analysisState?.analysis.summary ?? "Complete onboarding to unlock live automation signals.";
  const topOpportunity = analysisState?.analysis.opportunities[0] ?? null;
  const priorityCount = analysisState?.analysis.opportunities.filter((item) => item.priority === "critical" || item.priority === "high").length ?? 0;
  const aiUsage = getUsageSummary(billingState?.usage ?? [], "ai_requests");
  const weeklyReportSummary = useMemo(() => {
    const planName = billingState?.subscription.planName ?? "starter plan";
    const usageLabel = aiUsage ? `${aiUsage.used.toLocaleString()} / ${aiUsage.limit.toLocaleString()}` : "not yet available";
    return `Plan ${planName} is running ${usageLabel} AI requests this period. ${priorityCount} high-priority opportunities are ready for review, with ${activeChannels.length} active channels supporting ${strongestChannel}.`;
  }, [activeChannels.length, aiUsage, billingState?.subscription.planName, priorityCount, strongestChannel]);

  const responseDraft = useMemo(() => {
    const opportunityLabel = topOpportunity?.title ?? "the latest customer issue";
    return `Thank you for the feedback. We are reviewing ${opportunityLabel.toLowerCase()} and turning it into a measurable improvement. Our next step is to validate the best response, confirm the impact on the customer experience, and keep you updated as we ship the fix.`;
  }, [topOpportunity]);

  function toggleWorkflow(id: string) {
    setWorkflows((current) => current.map((workflow) => (workflow.id === id ? { ...workflow, active: !workflow.active } : workflow)));
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <SectionHeader title="Automation Center" subtitle="Make recurring marketing work reliable while keeping customer-facing changes under approval." icon="✦" />

      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-400">Loading live automation signals...</p>}

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />Automation rules</div>
            <h2 className="mt-2 text-2xl font-bold text-white">Prepare automatically. Publish deliberately.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{analysisSummary} The automation center uses live workspace analysis and billing usage to decide what needs attention, while content and publishing still stay approval-gated.</p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <div className="flex items-center gap-2 border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100"><ShieldCheck size={17} />Approval required</div>
            <span className="text-xs uppercase tracking-[0.1em] text-slate-500">{activeChannels.length} active channels</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <CalendarClock size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Social scheduling queue</h2>
              <p className="mt-1 text-sm text-slate-400">Content scheduled in the Studio is prepared here for a final publishing approval.</p>
            </div>
          </div>
          {calendar.length ? (
            <div className="mt-5 space-y-3">
              {calendar.map((item) => {
                const approved = approvedContent.includes(item.id);
                return (
                  <article key={item.id} className="flex flex-col gap-3 border border-slate-700 bg-slate-950/40 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">{item.date} · {item.type}</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.title}</p>
                    </div>
                    {approved ? (
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200"><CheckCircle2 size={17} />Approved for publishing</span>
                    ) : (
                      <button type="button" onClick={() => setApprovedContent((current) => [...current, item.id])} className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-3 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"><ClipboardCheck size={16} />Approve schedule</button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-5 border border-dashed border-slate-700 p-5 text-sm text-slate-500">No content is currently scheduled. Create a draft in Content Studio to add it to this queue.</p>
          )}
        </section>

        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <MessageSquareText size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Review response</h2>
              <p className="mt-1 text-sm text-slate-400">A draft response is prepared when a lower-rating review needs attention.</p>
            </div>
          </div>
          <div className="mt-5 border border-slate-700 bg-slate-950/40 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-white">Live response draft</p>
              <span className="text-xs text-slate-500">Business analysis</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{topOpportunity?.evidence ?? "No priority customer issue is currently flagged."}</p>
            <div className="mt-4 border-l-2 border-cyan-400 bg-cyan-400/5 p-3 text-sm leading-6 text-slate-200">{responseDraft}</div>
            {reviewState === "draft" ? (
              <button type="button" onClick={() => setReviewState("approved")} className="mt-4 inline-flex items-center gap-2 bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"><CheckCircle2 size={16} />Approve response</button>
            ) : (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200"><CheckCircle2 size={17} />Approved and queued for publishing</p>
            )}
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <FileBarChart size={20} className="text-cyan-300" />
              <div>
                <h2 className="text-lg font-semibold text-white">Automated report</h2>
                <p className="mt-1 text-sm text-slate-400">Create a weekly readout from connected performance signals.</p>
              </div>
            </div>
            <button type="button" onClick={() => setReportReady(true)} className="inline-flex items-center gap-2 border border-cyan-400 px-3 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"><RefreshCw size={16} />Generate</button>
          </div>
          {reportReady && (
            <div className="mt-5 border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">This week&apos;s growth summary</p>
              <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                <Metric label="Growth score" value={analysisState ? analysisState.analysis.overallScore.toString() : "--"} />
                <Metric label="Priority opportunities" value={priorityCount.toString()} />
                <Metric label="Active channels" value={activeChannels.length.toString()} />
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">{weeklyReportSummary}</p>
              <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"><Mail size={16} />Email report to owner</button>
            </div>
          )}
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <BellRing size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Marketing workflows</h2>
              <p className="mt-1 text-sm text-slate-400">Turn monitoring signals into consistent, visible operational routines.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {workflows.map((workflow) => (
              <article key={workflow.id} className="flex gap-4 border border-slate-700 bg-slate-950/40 p-4">
                <button type="button" onClick={() => toggleWorkflow(workflow.id)} aria-pressed={workflow.active} className={`mt-0.5 h-5 w-9 shrink-0 rounded-full p-0.5 transition-colors ${workflow.active ? "bg-cyan-400" : "bg-slate-700"}`}>
                  <span className={`block size-4 rounded-full bg-white transition-transform ${workflow.active ? "translate-x-4" : "translate-x-0"}`} />
                </button>
                <div>
                  <p className="text-sm font-semibold text-white">{workflow.title}</p>
                  <p className="mt-1 text-xs text-slate-400"><span className="text-slate-500">When:</span> {workflow.trigger}</p>
                  <p className="mt-1 text-xs text-slate-400"><span className="text-slate-500">Then:</span> {workflow.action}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}
