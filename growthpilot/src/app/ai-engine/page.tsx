"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, BrainCircuit, Lightbulb, Sparkles } from "lucide-react";
import { ScoreRing, SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import { MarketingCoach } from "@/components/MarketingCoach";
import type { BusinessAnalysisResult } from "@/lib/business-analysis";

type BusinessAnalysisResponse = {
  profile: {
    businessName?: string;
    website?: string | null;
    marketingChannels?: string[];
    industry?: string | null;
    businessType?: string | null;
    city?: string | null;
    state?: string | null;
  };
  analysis: BusinessAnalysisResult;
};

function getBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export default function AIEnginePage() {
  const [state, setState] = useState<BusinessAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/business-analysis", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });

      const result = await response.json().catch(() => ({ error: "Unable to load business analysis." })) as BusinessAnalysisResponse & { error?: string };
      if (!isActive) return;

      if (!response.ok) {
        setError(result.error ?? "Unable to load business analysis.");
        setState(null);
        setIsLoading(false);
        return;
      }

      setState(result);
      setError("");
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const activeChannels = state?.analysis.activeChannels ?? [];
  const adaptiveScore = state
    ? { score: state.analysis.overallScore, dimensions: state.analysis.dimensions }
    : { score: 0, dimensions: [] as BusinessAnalysisResult["dimensions"] };
  const strongestSocialChannel = state?.analysis.strongestSocial;
  const activeBusinessName = state?.profile.businessName ?? "Your business";

  return (
    <div>
      <SectionHeader title="AI Marketing Intelligence" subtitle="From your workspace profile to a clear growth decision." icon="✦" />

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-cyan-500/30 bg-[#102a43] p-6">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />Strongest acquisition signal</div>
          <p className="mt-4 text-3xl font-bold text-white">
            {strongestSocialChannel ? `${strongestSocialChannel.channel} is working hardest for ${activeBusinessName}.` : "Your active channels are not fully connected yet."}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-300">
            {strongestSocialChannel
              ? `Its ${strongestSocialChannel.engagement}% benchmark engagement signal is the clearest audience-response cue in this workspace.`
              : "Connect at least one social channel to surface a strongest-signal recommendation."}
          </p>
        </div>
        <div className="border border-slate-700 bg-slate-900 p-6">
          <div className="flex items-start gap-3">
            <BrainCircuit size={23} className="mt-0.5 text-cyan-300" />
            <div>
              <h2 className="font-semibold text-white">AI interpretation</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">The score is derived from the saved business profile, selected channels, and the current workspace setup. It adapts as you add website, location, and channel context.</p>
            </div>
          </div>
          <div className="mt-5 border-l-2 border-amber-300 bg-amber-300/5 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><Lightbulb size={17} />Recommendation</div>
            <p className="mt-2 text-sm text-slate-300">Focus the next content plan on the strongest active channel, then turn the best post into a homepage or email message.</p>
            <button type="button" className="mt-4 inline-flex items-center gap-1.5 bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300">
              Create content plan
              <ArrowUpRight size={15} />
            </button>
          </div>
        </div>
      </section>

      <MarketingCoach activeChannels={activeChannels} />

      <div className="border border-slate-700 bg-slate-900 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={adaptiveScore.score} label="Business Growth Score" size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">Your Business Growth Score</h2>
          <p className="text-slate-400 text-sm mb-4">A transparent score calculated from the channels and business details saved in your workspace.</p>
          <div className="grid grid-cols-3 gap-4">
            {adaptiveScore.dimensions.slice(0, 3).map((dimension) => (
              <div key={dimension.key} className="bg-slate-900/60 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-white">{dimension.score}</div>
                <div className="text-xs text-slate-400">{dimension.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">Adaptive score breakdown</h2>
      <div className="bg-slate-800 border border-slate-700 p-5 mb-8">
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading workspace analysis...</p>
        ) : (
          <div className="space-y-4">
            {adaptiveScore.dimensions.map((dim) => (
              <div key={dim.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{dim.label}</span>
                    <span className="text-xs text-slate-500">({dim.effectiveWeight}% effective weight)</span>
                  </div>
                  <span className="text-sm font-bold text-white">{dim.score}/100</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full">
                  <div className={`h-2 rounded-full transition-all duration-500 ${getBarColor(dim.score)}`} style={{ width: `${dim.score}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{dim.description}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">Business analysis</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{state?.analysis.summary ?? "Load your workspace profile to see a personalized analysis."}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {state?.analysis.opportunities.slice(0, 4).map((opportunity) => (
            <div key={opportunity.id} className="border border-slate-700 bg-slate-950/40 p-3">
              <p className="text-sm font-semibold text-white">{opportunity.title}</p>
              <p className="mt-1 text-xs text-slate-400">{opportunity.impact}</p>
            </div>
          ))}
        </div>
        <h3 className="mt-6 text-sm font-semibold text-white">Why the score adapts</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">The score shifts based on the business profile, website, location, and active channels that are saved for this workspace. When a source is not connected, its weight is redistributed rather than treated as a permanent penalty.</p>
        <p className="mt-3 text-sm font-medium text-cyan-200">Active sources in this workspace: {activeChannels.join(", ") || "none yet"}</p>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">How the AI Engine Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Workspace data",
            description: "The engine reads your saved business profile, website URL, location, and selected channels.",
            icon: "📡",
          },
          {
            step: "2",
            title: "Analysis",
            description: "The analysis layer scores the signals that are actually present in your workspace, not a static demo dataset.",
            icon: "🧠",
          },
          {
            step: "3",
            title: "Growth Score",
            description: "A weighted composite score is calculated and normalized to 0–100 using the live workspace context.",
            icon: "📈",
          },
        ].map((item) => (
          <div key={item.step} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">{item.step}</div>
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold text-white">{item.title}</span>
            </div>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
