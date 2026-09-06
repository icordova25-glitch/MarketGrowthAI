"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Globe2, SearchCheck } from "lucide-react";
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

export default function GooglePage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
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
  const google = analysis?.dimensions.find((dimension) => dimension.key === "google");
  const website = analysis?.dimensions.find((dimension) => dimension.key === "website");
  const seo = analysis?.dimensions.find((dimension) => dimension.key === "seo");
  const opportunities = analysis?.opportunities.filter((opportunity) => opportunity.category === "Google" || opportunity.category === "SEO").slice(0, 4) ?? [];

  return (
    <div>
      <SectionHeader
        title="Google"
        subtitle="Live search, local, and map readiness from your business analysis."
        icon="🔍"
      />

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
              <SearchCheck size={16} />
              Live Google readiness
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Search and local visibility update from your actual business profile.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">This page now reads the live business-analysis API, so the Google score reflects the owner workspace&apos;s actual profile, location, and connected channels instead of a static demo bundle.</p>
          </div>
          <Globe2 size={30} className="text-cyan-300" />
        </div>
      </section>

      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex flex-wrap gap-8 items-center">
        <ScoreRing score={website?.score ?? 0} label="Website" size="md" />
        <ScoreRing score={seo?.score ?? 0} label="SEO" size="md" />
        <ScoreRing score={google?.score ?? 0} label="Google" size="md" />
        <div className="flex-1 text-slate-400 text-sm ml-4">
          <p className="mb-1">{analysis?.summary ?? "Complete onboarding to unlock your live Google analysis."}</p>
          <p className="text-xs text-slate-500">{analysisState?.profile.businessName ?? "Business profile unavailable"} · {analysisState?.profile.city && analysisState?.profile.state ? `${analysisState.profile.city}, ${analysisState.profile.state}` : "Location not captured"}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">📊 Google visibility</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Google Score" value={google?.score ?? 0} icon="🏆" suffix="/100" />
        <StatCard label="Website Score" value={website?.score ?? 0} icon="🌐" suffix="/100" />
        <StatCard label="Active channels" value={analysis?.activeChannels.length ?? 0} icon="📡" />
        <StatCard label="Opportunities" value={analysis?.opportunities.length ?? 0} icon="💡" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Google opportunities</h3>
          <div className="space-y-2">
            {opportunities.length ? opportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex items-start gap-2 text-sm">
                <PriorityBadge priority={opportunity.priority} />
                <span className="text-slate-300">{opportunity.title}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No Google-specific opportunities yet.</p>}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Local readiness summary</h3>
          <p className="text-sm leading-6 text-slate-300">{analysis?.opportunities.find((opportunity) => opportunity.category === "Google")?.recommendation ?? "Connect Google Business Profile and add your location details to unlock stronger local visibility recommendations."}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">🏢 Business profile signals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Business type" value={analysisState?.profile.businessType ?? "N/A"} icon="🏬" />
        <StatCard label="Industry" value={analysisState?.profile.industry ?? "N/A"} icon="🏷️" />
        <StatCard label="City" value={analysisState?.profile.city ?? "N/A"} icon="📍" />
        <StatCard label="State" value={analysisState?.profile.state ?? "N/A"} icon="🗺️" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Profile notes</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <p>{analysisState?.profile.website ? `Website connected: ${analysisState.profile.website}` : "No website connected yet."}</p>
          <p>{analysisState?.profile.marketingChannels.length ? `Connected channels: ${analysisState.profile.marketingChannels.join(", ")}` : "No marketing channels connected yet."}</p>
          {analysis?.strongestSocial ? <p className="inline-flex items-center gap-2 text-emerald-300"><CheckCircle2 size={16} />Strongest social channel: {analysis.strongestSocial.channel} · {analysis.strongestSocial.engagement}% benchmark</p> : <p>No social channel benchmark available until channels are connected.</p>}
        </div>
      </div>

      {isLoading && <p className="mt-6 text-xs uppercase tracking-[0.1em] text-slate-500">Loading live Google analysis...</p>}
    </div>
  );
}
