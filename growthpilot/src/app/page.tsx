"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BrainCircuit, CircleAlert, Globe2, RefreshCw, Target } from "lucide-react";
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

type Dimension = {
  key: string;
  label: string;
  score: number;
  effectiveWeight?: number;
};

type BusinessAnalysisState = {
  profile: {
    businessName: string;
    website?: string | null;
    industry?: string | null;
    businessType?: string | null;
    city?: string | null;
    state?: string | null;
    marketingChannels: string[];
  };
  analysis: {
    overallScore: number;
    summary: string;
    strongestSocial: { channel: string; score: number; engagement: number } | null;
    opportunities: Opportunity[];
    dimensions: Dimension[];
    activeChannels: string[];
    businessName: string;
    website?: string | null;
  };
};

type BillingState = {
  business: { name: string };
  subscription: { planName: string; status: string };
  usage: Array<{ metric: string; label: string; used: number; limit: number; percentage: number }>;
  team: { activeSeats: number };
};

export default function Dashboard() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
  const [billingState, setBillingState] = useState<BillingState | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const headers = await createAuthedJsonHeaders();
      const [analysisResponse, billingResponse] = await Promise.all([
        fetch("/api/business-analysis", { method: "GET", headers }),
        fetch("/api/billing/state", { method: "GET", headers }),
      ]);

      const analysisResult = await analysisResponse.json().catch(() => ({ error: "Unable to load business analysis." })) as BusinessAnalysisState & { error?: string };
      const billingResult = await billingResponse.json().catch(() => ({ error: "Unable to load billing state." })) as BillingState & { error?: string };

      if (!isActive) return;

      if (!analysisResponse.ok) {
        setError(analysisResult.error ?? "Unable to load business analysis.");
        setAnalysisState(null);
        setBillingState(null);
        setIsLoading(false);
        return;
      }

      if (!billingResponse.ok) {
        setError(billingResult.error ?? "Unable to load billing state.");
        setAnalysisState(null);
        setBillingState(null);
        setIsLoading(false);
        return;
      }

      setAnalysisState(analysisResult);
      setBillingState(billingResult);
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const analysis = analysisState?.analysis;
  const activeInsights = analysis?.opportunities.filter((item) => item.priority === "critical" || item.priority === "high").slice(0, 3) ?? [];
  const dimensions = analysis?.dimensions ?? [];
  const website = dimensions.find((dimension) => dimension.key === "website");
  const google = dimensions.find((dimension) => dimension.key === "google");
  const social = dimensions.find((dimension) => dimension.key === "social");
  const content = dimensions.find((dimension) => dimension.key === "content");
  const conversion = dimensions.find((dimension) => dimension.key === "conversion");
  const usagePressure = billingState?.usage.length ? Math.round(billingState.usage.reduce((sum, item) => sum + item.percentage, 0) / billingState.usage.length) : 0;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Platform operations</p>
          <h1 className="mt-2 text-3xl font-bold text-white">Growth command center</h1>
          <p className="mt-2 text-sm text-slate-400">Live business score, billing state, and opportunity analysis for the owner workspace.</p>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
          <RefreshCw size={16} />
          Refresh dashboard
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="border border-cyan-500/30 bg-[#102a43] p-6 md:p-8 mb-8 flex flex-col gap-8 lg:flex-row lg:items-center">
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
            <Target size={15} />
            Business performance
          </div>
          <h2 className="text-xl font-semibold text-white mb-1">{analysis?.businessName ?? analysisState?.profile.businessName ?? "Your business"}</h2>
          <p className="text-slate-400 text-sm mb-4">{analysisState?.profile.website ?? "Connect your website to unlock the full analysis"} · {analysisState?.profile.industry ?? analysisState?.profile.businessType ?? "Industry not yet captured"}</p>
          <div className="grid grid-cols-3 gap-4">
            <ScoreTile label="Website" score={website?.score ?? 0} />
            <ScoreTile label="Google" score={google?.score ?? 0} />
            <ScoreTile label="Social" score={social?.score ?? 0} />
          </div>
        </div>
        <div className="border border-cyan-200/15 bg-slate-950/30 p-5 text-center min-w-[180px]">
          <div className="text-4xl font-bold text-cyan-300 mb-1">{analysis?.overallScore ?? 0}</div>
          <div className="text-slate-400 text-sm">out of 100</div>
          <div className="text-green-400 text-sm mt-2 font-medium">{analysis?.summary ?? "Complete onboarding to generate a live score."}</div>
          <Link href="/ai-engine" className="mt-3 flex items-center justify-center gap-1.5 bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300">
            Ask AI Coach <ArrowUpRight size={14} />
          </Link>
        </div>
      </section>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">What needs attention</p>
              <p className="mt-1 text-xs text-slate-400">The three issues with the clearest growth impact.</p>
            </div>
            <CircleAlert size={20} className="text-amber-300" />
          </div>
          <div className="space-y-3">
            {activeInsights.length > 0 ? activeInsights.map((insight) => (
              <div key={insight.id} className="flex gap-3 border-l-2 border-cyan-400 bg-slate-950/40 px-3 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-100">{insight.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{insight.impact}</p>
                </div>
                <PriorityBadge priority={insight.priority} />
              </div>
            )) : <p className="text-sm text-slate-400">No high-priority opportunities yet.</p>}
          </div>
        </section>
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-center gap-2">
            <BrainCircuit size={20} className="text-cyan-300" />
            <div>
              <p className="text-sm font-semibold text-white">AI readout</p>
              <p className="mt-1 text-xs text-slate-400">What the score is telling you.</p>
            </div>
          </div>
          <p className="text-sm leading-6 text-slate-300">{analysis?.summary ?? "The dashboard will populate once onboarding and the business profile are complete."}</p>
          {analysis?.strongestSocial && <p className="mt-4 text-sm text-slate-400">{analysis.strongestSocial.channel} is the strongest social channel with a {analysis.strongestSocial.engagement}% engagement benchmark.</p>}
          <Link href="/insights" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
            View recommendations <ArrowUpRight size={15} />
          </Link>
        </section>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard label="Monthly usage pressure" value={`${usagePressure}%`} detail="Average across tracked billing limits" />
        <MetricCard label="Active seats" value={`${billingState?.team.activeSeats ?? 0}`} detail="Live team membership usage" />
        <MetricCard label="Billing status" value={billingState?.subscription.status ?? "inactive"} detail={billingState?.subscription.planName ?? "No active plan"} />
        <MetricCard label="Active channels" value={`${analysis?.activeChannels.length ?? 0}`} detail="Connected marketing channels in the profile" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Score inputs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link href="/website" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><Globe2 size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{website?.score ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Website Analysis</div>
          <div className="text-slate-500 text-xs mt-1">SEO · Content · Conversion</div>
        </Link>
        <Link href="/google" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><Target size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{google?.score ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Google</div>
          <div className="text-slate-500 text-xs mt-1">Search · Local · Maps</div>
        </Link>
        <Link href="/social" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><BrainCircuit size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{social?.score ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Social Media</div>
          <div className="text-slate-500 text-xs mt-1">Instagram · Facebook · TikTok · YouTube · LinkedIn</div>
        </Link>
        <Link href="/content" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><Target size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{content?.score ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Content</div>
          <div className="text-slate-500 text-xs mt-1">Offer clarity · messaging · depth</div>
        </Link>
        <Link href="/ai-engine" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><BrainCircuit size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{analysis?.overallScore ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">AI Engine</div>
          <div className="text-slate-500 text-xs mt-1">Business Growth Score Engine</div>
        </Link>
        <Link href="/website" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><Globe2 size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{conversion?.score ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Conversion</div>
          <div className="text-slate-500 text-xs mt-1">Calls-to-action · trust · buyer confidence</div>
        </Link>
        <Link href="/insights" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><Target size={20} className="text-cyan-300" /><span className="text-lg font-bold text-cyan-300">{analysis?.opportunities.length ?? 0}</span></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Actionable Insights</div>
          <div className="text-slate-500 text-xs mt-1">Live recommendations ready</div>
        </Link>
        <Link href="/do-it-for-me" className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-cyan-400 hover:bg-slate-800/80 transition-all group">
          <div className="flex items-start justify-between mb-3"><ArrowUpRight size={20} className="text-cyan-300" /></div>
          <div className="font-semibold text-white group-hover:text-cyan-300 transition-colors">Do It For Me AI</div>
          <div className="text-slate-500 text-xs mt-1">AI executes improvements for you</div>
        </Link>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Recommended next steps</h2>
      <div className="space-y-3">
        {activeInsights.length > 0 ? activeInsights.map((insight) => (
          <div key={insight.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-start gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={insight.priority} />
                <span className="text-xs text-slate-500">{insight.category}</span>
              </div>
              <div className="font-medium text-white text-sm">{insight.title}</div>
              <div className="text-slate-400 text-xs mt-1">{insight.evidence}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-green-400 text-xs font-medium">{insight.impact}</div>
              <Link href="/do-it-for-me" className="mt-2 block text-xs bg-violet-700 hover:bg-violet-600 text-white px-3 py-1 rounded-lg transition-colors">Fix It →</Link>
            </div>
          </div>
        )) : <div className="rounded-xl border border-slate-700 bg-slate-900 p-5 text-sm text-slate-400">No recommendations available until analysis is complete.</div>}
      </div>

      {isLoading && <p className="mt-6 text-xs uppercase tracking-[0.1em] text-slate-500">Loading live dashboard...</p>}
    </div>
  );
}

function PriorityBadge({ priority }: { priority: "critical" | "high" | "medium" | "low" }) {
  const classes = priority === "critical"
    ? "border-red-400/30 bg-red-400/10 text-red-100"
    : priority === "high"
      ? "border-amber-400/30 bg-amber-400/10 text-amber-100"
      : priority === "medium"
        ? "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"
        : "border-slate-400/30 bg-slate-400/10 text-slate-100";

  return <span className={`border px-2 py-1 text-xs font-semibold ${classes}`}>{priority}</span>;
}

function ScoreTile({ label, score }: { label: string; score: number }) {
  return (
    <article className="border border-cyan-200/15 bg-slate-950/30 p-3 text-center">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-xl font-bold text-cyan-300">{score}</p>
    </article>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}
