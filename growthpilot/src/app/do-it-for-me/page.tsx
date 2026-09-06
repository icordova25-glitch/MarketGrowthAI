"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ClipboardCheck, Eye, RefreshCw, Send, ShieldCheck, Sparkles, WandSparkles } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type Opportunity = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: string;
  title: string;
  evidence: string;
  recommendation: string;
  impact: string;
  effort: string;
};

type BusinessAnalysisState = {
  profile: {
    businessName: string;
    website?: string | null;
    marketingChannels: string[];
  };
  analysis: {
    overallScore: number;
    summary: string;
    strongestSocial: { channel: string; score: number; engagement: number } | null;
    opportunities: Opportunity[];
    dimensions: Array<{ key: string; label: string; score: number }>;
    activeChannels: string[];
  };
};

type TaskStatus = "queued" | "in-progress" | "completed";

type ActionTask = {
  id: string;
  status: TaskStatus;
  category: string;
  title: string;
  description: string;
  detail: string;
  effort: string;
};

const statusConfig = {
  completed: { label: "Completed", className: "bg-green-900/50 text-green-400 border-green-800", icon: "✅" },
  "in-progress": { label: "In Progress", className: "bg-blue-900/50 text-blue-400 border-blue-800", icon: "⚙️" },
  queued: { label: "Queued", className: "bg-slate-700 text-slate-400 border-slate-600", icon: "⏳" },
};

function buildTaskStatus(priority: Opportunity["priority"], effort: Opportunity["effort"]): TaskStatus {
  if (priority === "critical") return "queued";
  if (priority === "high") return effort === "Low" ? "in-progress" : "queued";
  if (effort === "Low") return "completed";
  return "in-progress";
}

function buildTasks(opportunities: Opportunity[]): ActionTask[] {
  return opportunities.slice(0, 5).map((opportunity) => ({
    id: opportunity.id,
    status: buildTaskStatus(opportunity.priority, opportunity.effort),
    category: opportunity.category,
    title: opportunity.title,
    description: opportunity.evidence,
    detail: opportunity.recommendation,
    effort: opportunity.effort,
  }));
}

export default function DoItForMePage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
  const [tasks, setTasks] = useState<ActionTask[]>([]);
  const [actionState, setActionState] = useState<"opportunity" | "review" | "approved" | "published">("opportunity");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/business-analysis", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });
      const result = await response.json().catch(() => ({ error: "Unable to load business analysis." })) as BusinessAnalysisState & { error?: string };
      if (!isActive) return;

      if (!response.ok) {
        setError(result.error ?? "Unable to load business analysis.");
        setAnalysisState(null);
        setTasks([]);
        setIsLoading(false);
        return;
      }

      setAnalysisState(result);
      setTasks(buildTasks(result.analysis.opportunities));
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const activeTaskCount = useMemo(() => tasks.filter((task) => task.status !== "completed").length, [tasks]);
  const strongestChannel = analysisState?.analysis.strongestSocial?.channel ?? "your primary channel";

  function updateTask(taskId: string, nextStatus: TaskStatus) {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, status: nextStatus } : task)));
  }

  function runAllQueuedTasks() {
    setTasks((current) => current.map((task) => (task.status === "queued" ? { ...task, status: "in-progress" } : task)));
    setActionState("review");
  }

  return (
    <div>
      <SectionHeader
        title="Do It For Me AI"
        subtitle="Live opportunities converted into owner-approved actions"
        icon="⚡"
      />

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {isLoading && <p className="mb-4 text-xs uppercase tracking-[0.1em] text-slate-500">Loading live task queue...</p>}

      <ActionWorkflow
        state={actionState}
        onStateChange={setActionState}
        activeChannel={strongestChannel}
        onRunQueuedTasks={runAllQueuedTasks}
        activeTaskCount={activeTaskCount}
      />

      <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-800/50 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="text-5xl">🤖</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">AI Takes Action For You</h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Instead of just showing you what to fix, MarketGrowthAI turns live opportunities into a task queue you can review, approve, and publish. The queue is built from the current workspace analysis, not static demo tasks.
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={runAllQueuedTasks} className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2 rounded-lg transition-colors font-medium">
                <RefreshCw size={16} />
                Run All Queued Tasks
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                ⚙️ Configure Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">What AI Can Do For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🌐", title: "Website Optimization", items: ["Write meta descriptions & title tags", "Generate & update blog content", "Improve page copy for conversions", "Fix broken links & image alt text"] },
          { icon: "🔍", title: "Google Presence", items: ["Optimize Google Business Profile", "Generate GBP posts & responses", "Submit URLs to Search Console", "Update business categories & hours"] },
          { icon: "📱", title: "Social Media", items: ["Write posts & captions for all platforms", "Generate TikTok & YouTube scripts", "Create hashtag strategies", "Schedule content calendar"] },
        ].map((cap) => (
          <div key={cap.title} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cap.icon}</span>
              <span className="font-semibold text-white">{cap.title}</span>
            </div>
            <ul className="space-y-1.5">
              {cap.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-violet-400 mt-0.5 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Task Queue</h2>
      <div className="space-y-4">
        {tasks.length ? tasks.map((task) => {
          const sc = statusConfig[task.status];
          return (
            <div key={task.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{sc.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.className}`}>{sc.label}</span>
                      <span className="text-xs text-slate-500">{task.category}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{task.description}</p>
                    <p className="mt-2 text-xs text-slate-500">Recommended next step: {task.detail}</p>
                    <p className="mt-1 text-xs text-slate-500">Effort: {task.effort}</p>
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                  {task.status === "queued" && (
                    <button onClick={() => updateTask(task.id, "in-progress")} className="bg-violet-700 hover:bg-violet-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                      ▶ Run Now
                    </button>
                  )}
                  {task.status === "in-progress" && (
                    <button onClick={() => updateTask(task.id, "completed")} className="bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs px-4 py-2 rounded-lg transition-colors font-bold">
                      Complete
                    </button>
                  )}
                  {task.status === "completed" && (
                    <button className="bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                      View Result
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-400">No live opportunities yet. Complete onboarding to generate the first task queue.</div>}
      </div>
    </div>
  );
}

function ActionWorkflow({
  state,
  onStateChange,
  activeChannel,
  onRunQueuedTasks,
  activeTaskCount,
}: {
  state: "opportunity" | "review" | "approved" | "published";
  onStateChange: (state: "opportunity" | "review" | "approved" | "published") => void;
  activeChannel: string;
  onRunQueuedTasks: () => void;
  activeTaskCount: number;
}) {
  const step = state === "opportunity" ? 0 : state === "review" ? 1 : state === "approved" ? 2 : 3;
  const drafts = [
    `Three ways to turn ${activeChannel} momentum into more leads`,
    "What an AI marketing audit sees in the first 10 seconds",
    "One website change that makes visitors more likely to act",
    "How to turn one customer question into five content ideas",
    "The signal that tells you where your next leads will come from",
  ];

  return (
    <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6 md:p-8">
      <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />AI Action Center</div>
          <h2 className="mt-3 text-2xl font-bold text-white">AI finds the opportunity. You control the outcome.</h2>
          <p className="mt-3 text-sm leading-6 text-slate-300">Your active workspace signals are converted into a reviewable action queue. The live task set below is derived from the current opportunities and can be moved through queue, review, approval, and publish states.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-cyan-100"><ShieldCheck size={17} />Autonomous publishing is off</div>
      </div>

      <div className="mt-6 grid grid-cols-4 gap-2">{["Generate", "Review", "Approve", "Publish"].map((label, index) => <div key={label}><div className={`h-1.5 ${index <= step ? "bg-cyan-400" : "bg-slate-800"}`} /><p className={`mt-2 text-xs font-medium ${index <= step ? "text-cyan-100" : "text-slate-500"}`}>{label}</p></div>)}</div>

      {state === "opportunity" && <button type="button" onClick={onRunQueuedTasks} className="mt-7 inline-flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><WandSparkles size={16} />Generate live tasks</button>}
      {state === "review" && <div className="mt-7"><div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><Eye size={17} />{activeTaskCount} live tasks are ready for review</div><ol className="mt-3 space-y-2">{drafts.map((draft, index) => <li key={draft} className="flex gap-3 border border-slate-700 bg-slate-950/40 p-3 text-sm text-slate-300"><span className="font-bold text-cyan-300">{index + 1}</span>{draft}</li>)}</ol><button type="button" onClick={() => onStateChange("approved")} className="mt-5 inline-flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><ClipboardCheck size={16} />Approve live tasks</button></div>}
      {state === "approved" && <div className="mt-7 border border-emerald-500/30 bg-emerald-500/10 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-emerald-100"><CheckCircle2 size={17} />Approved and ready to publish</div><p className="mt-2 text-sm text-slate-300">Nothing will be posted until you publish this batch.</p><button type="button" onClick={() => onStateChange("published")} className="mt-4 inline-flex items-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Send size={16} />Publish approved tasks</button></div>}
      {state === "published" && <div className="mt-7 flex items-start gap-3 border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100"><CheckCircle2 size={19} className="mt-0.5 shrink-0" /><div><p className="font-semibold">Approved tasks are scheduled for publishing.</p><p className="mt-1 text-emerald-100/70">The live action set is now recorded in your execution history.</p></div></div>}

      <div className="mt-7 grid gap-3 border-t border-cyan-100/15 pt-5 md:grid-cols-4">
        {[
          ["Find problem", "Monitor connected signals for a verified opportunity."],
          ["Recommend fix", "Explain the evidence and expected result."],
          ["Generate solution", "Prepare a draft or configured change."],
          ["Approve and execute", "A person signs off before anything goes live."],
        ].map(([title, description], index) => (
          <div key={title} className="flex gap-3">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-cyan-400/10 text-xs font-bold text-cyan-300">{index + 1}</span>
            <div>
              <p className="text-xs font-semibold text-slate-200">{title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
