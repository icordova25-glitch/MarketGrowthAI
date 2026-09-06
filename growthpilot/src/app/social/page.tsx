"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CheckCircle2, Lightbulb, Sparkles, TrendingUp } from "lucide-react";
import { SectionHeader, ScoreRing, StatCard, PriorityBadge } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

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
    dimensions: Array<{ key: string; label: string; score: number }>;
    activeChannels: string[];
    businessName: string;
    website?: string | null;
  };
};

const socialBenchmarks: Record<string, { label: string; engagement: number; note: string }> = {
  Instagram: { label: "Instagram", engagement: 4.8, note: "Strong community response" },
  Facebook: { label: "Facebook", engagement: 2.1, note: "Needs a content reset" },
  TikTok: { label: "TikTok", engagement: 6.2, note: "Fastest audience growth" },
  YouTube: { label: "YouTube", engagement: 3.4, note: "Long-term discovery play" },
  LinkedIn: { label: "LinkedIn", engagement: 3.1, note: "Best B2B conversation" },
};

export default function SocialPage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [contentPlanReady, setContentPlanReady] = useState(false);
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
        setIsLoading(false);
        return;
      }

      setAnalysisState(result);
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const analysis = analysisState?.analysis;
  const strongestSocial = analysis?.strongestSocial;
  const socialDimensions = analysis?.dimensions.filter((dimension) => dimension.key === "social" || dimension.key === "engagement") ?? [];
  const activeChannels = analysis?.activeChannels ?? [];
  const socialOpportunities = analysis?.opportunities.filter((opportunity) => opportunity.category === "Social" || opportunity.category === "Content").slice(0, 4) ?? [];
  const strongestBenchmark = strongestSocial ? socialBenchmarks[strongestSocial.channel] : null;

  return (
    <div>
      <SectionHeader
        title="Social performance"
        subtitle="A live read on where your audience is responding and where to focus next."
        icon="✦"
      />

      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-cyan-500/30 bg-[#102a43] p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Social Growth Score</p>
              <p className="mt-2 text-5xl font-bold text-white">{analysis?.overallScore ?? 0}<span className="ml-1 text-lg font-medium text-slate-400">/100</span></p>
              <p className="mt-3 text-sm text-slate-300">{analysis?.summary ?? "Complete onboarding to unlock the live social readout."}</p>
            </div>
            <TrendingUp className="text-cyan-300" size={28} />
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-cyan-100/15 pt-5">
            <div>
              <p className="text-xs text-slate-400">Active channels</p>
              <p className="mt-1 text-xl font-bold text-white">{activeChannels.length}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Strongest channel</p>
              <p className="mt-1 text-xl font-bold text-white">{strongestSocial?.channel ?? "N/A"}</p>
            </div>
          </div>
        </section>
        <section className="border border-slate-700 bg-slate-900 p-6">
          <div className="flex items-start gap-3">
            <Lightbulb size={21} className="mt-0.5 text-amber-300" />
            <div>
              <p className="font-semibold text-white">AI opportunity</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">{strongestSocial ? `${strongestSocial.channel} is the strongest active social channel. Build a recurring weekly series around the topics that already resonate.` : "Connect at least one social channel to unlock a live recommendation."}</p>
              <button type="button" onClick={() => setContentPlanReady(true)} className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">
                Create content plan <ArrowUpRight size={15} />
              </button>
              {contentPlanReady && <p className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300"><CheckCircle2 size={17} />Content plan prepared for owner review.</p>}
            </div>
          </div>
        </section>
      </div>

      <section className="mb-8 border border-slate-700 bg-slate-900 p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={19} className="text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Channel comparison</h2>
            <p className="text-xs text-slate-400">Performance is ranked by the active business-analysis social benchmarks.</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-5">
          {activeChannels.length ? activeChannels.map((channel) => {
            const benchmark = socialBenchmarks[channel];
            const isStrongest = strongestSocial?.channel === channel;
            if (!benchmark) return null;
            return (
              <div key={channel} className={`border p-4 ${isStrongest ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/40"}`}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">{benchmark.label}</p>
                  <span className="text-sm font-bold text-cyan-300">{benchmark.engagement}%</span>
                </div>
                <div className="mt-3 h-1.5 bg-slate-800">
                  <div className="h-full bg-cyan-400" style={{ width: `${Math.min(benchmark.engagement * 12, 100)}%` }} />
                </div>
                <p className="mt-3 text-xs text-slate-400">{isStrongest ? "Top active channel" : benchmark.note}</p>
              </div>
            );
          }) : <p className="text-sm text-slate-400">No connected social channels yet.</p>}
        </div>
      </section>

      <div className="bg-slate-800 border border-slate-700 p-6 mb-8 flex flex-wrap gap-6 items-center">
        <ScoreRing score={analysis?.dimensions.find((dimension) => dimension.key === "social")?.score ?? 0} label="Social" size="sm" />
        <ScoreRing score={analysis?.dimensions.find((dimension) => dimension.key === "content")?.score ?? 0} label="Content" size="sm" />
        <ScoreRing score={analysis?.dimensions.find((dimension) => dimension.key === "engagement")?.score ?? 0} label="Engagement" size="sm" />
        <ScoreRing score={analysis?.overallScore ?? 0} label="Overall" size="sm" />
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">📸 Social signals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Active channels" value={activeChannels.length} change={0} icon="📡" />
        <StatCard label="Strongest score" value={strongestSocial?.score ?? 0} icon="🏆" suffix="/100" />
        <StatCard label="Engagement" value={strongestSocial ? `${strongestSocial.engagement}%` : "N/A"} icon="❤️" />
        <StatCard label="Opportunities" value={socialOpportunities.length} icon="💡" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Social opportunities</h3>
          <div className="space-y-2">
            {socialOpportunities.length ? socialOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex items-start gap-2 text-sm">
                <PriorityBadge priority={opportunity.priority} />
                <span className="text-slate-300">{opportunity.title}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No social opportunities yet.</p>}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Analysis summary</h3>
          <p className="text-sm leading-6 text-slate-300">{analysis?.summary ?? "The live social summary appears after onboarding and channel connection."}</p>
          {strongestBenchmark && <p className="mt-3 text-xs text-slate-500">Strongest benchmark: {strongestBenchmark.label} · {strongestBenchmark.engagement}%</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">💼 Channel details</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {socialDimensions.map((dimension) => <StatCard key={dimension.key} label={dimension.label} value={dimension.score} icon="⭐" suffix="/100" />)}
        <StatCard label="Business" value={analysisState?.profile.businessName ?? "N/A"} icon="🏢" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Recommended next action</h3>
        <p className="text-sm leading-6 text-slate-300">{analysis?.opportunities.find((opportunity) => opportunity.category === "Social")?.recommendation ?? "Connect social channels to unlock the first live recommendation."}</p>
      </div>

      {isLoading && <p className="mt-6 text-xs uppercase tracking-[0.1em] text-slate-500">Loading live social analysis...</p>}
    </div>
  );
}
