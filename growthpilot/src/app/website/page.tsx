"use client";

import { FormEvent, useEffect, useState } from "react";
import { Globe2, Play, ScanSearch } from "lucide-react";
import { ScoreRing, StatCard, SectionHeader, PriorityBadge } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type ScanIssue = { severity: "high" | "medium" | "low"; description: string };

type WebsiteScanResult = {
  url: string;
  title: string;
  description: string;
  canonical: string;
  headings: number;
  images: number;
  missingAlt: number;
  words: number;
  score: number;
  issues: ScanIssue[];
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

export default function WebsitePage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scan, setScan] = useState<WebsiteScanResult | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const headers = await createAuthedJsonHeaders();
      const response = await fetch("/api/business-analysis", {
        method: "GET",
        headers,
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
      setWebsiteUrl(result.profile.website ?? "");
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  async function scanWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsScanning(true);

    const response = await fetch("/api/website-scan", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ url: websiteUrl }),
    });

    const result = await response.json().catch(() => ({ error: "Unable to scan this website." })) as WebsiteScanResult & { error?: string };
    setIsScanning(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to scan this website.");
      return;
    }

    setScan(result);
    setLastUpdatedLabel(new Date().toLocaleString());
  }

  const analysis = analysisState?.analysis;
  const seo = analysis?.dimensions.find((dimension) => dimension.key === "seo");
  const content = analysis?.dimensions.find((dimension) => dimension.key === "content");
  const conversion = analysis?.dimensions.find((dimension) => dimension.key === "conversion");
  const website = analysis?.dimensions.find((dimension) => dimension.key === "website");
  const activeOpportunities = analysis?.opportunities.slice(0, 4) ?? [];

  return (
    <div>
      <SectionHeader
        title="Website intelligence"
        subtitle="Live website scoring, business analysis, and on-page scan results."
        icon="✦"
      />

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">
              <ScanSearch size={16} />
              Live website scanner
            </div>
            <h2 className="mt-2 text-xl font-bold text-white">Run an on-page SEO check.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">The page now reads the owner&apos;s live business analysis to populate website, SEO, content, and conversion scores, then runs the public URL through the production scanner for an updated on-page check.</p>
          </div>
          <Globe2 size={30} className="text-cyan-300" />
        </div>
        <form onSubmit={scanWebsite} className="mt-5 flex flex-col gap-3 sm:flex-row">
          <input
            type="url"
            value={websiteUrl}
            onChange={(event) => setWebsiteUrl(event.target.value)}
            placeholder="https://yourbusiness.com"
            required
            className="min-w-0 flex-1 border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
          />
          <button disabled={isScanning} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60">
            <Play size={16} />
            {isScanning ? "Scanning..." : "Scan website"}
          </button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        {scan && (
          <div className="mt-5 grid gap-4 border-t border-cyan-100/15 pt-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Live SEO score</p>
              <p className="mt-2 text-4xl font-bold text-white">{scan.score}<span className="text-lg text-slate-500">/100</span></p>
              <div className="mt-4 space-y-1 text-xs text-slate-400">
                <p>{scan.words.toLocaleString()} visible words</p>
                <p>{scan.headings} H1 heading{scan.headings === 1 ? "" : "s"}</p>
                <p>{scan.images} images · {scan.missingAlt} missing alt text</p>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Current scan findings</p>
              <p className="mt-1 truncate text-xs text-slate-400">{scan.title || "No title tag found"}</p>
              <div className="mt-3 space-y-2">
                {scan.issues.length ? scan.issues.map((issue) => <div key={issue.description} className="flex items-start gap-2 text-sm"><PriorityBadge priority={issue.severity} /><span className="text-slate-300">{issue.description}</span></div>) : <p className="text-sm text-emerald-300">No priority on-page SEO issues found.</p>}
              </div>
            </div>
          </div>
        )}
      </section>

      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex gap-8 items-center">
        <ScoreRing score={website?.score ?? 0} label="Website" size="md" />
        <ScoreRing score={seo?.score ?? 0} label="SEO" size="md" />
        <ScoreRing score={content?.score ?? 0} label="Content" size="md" />
        <ScoreRing score={conversion?.score ?? 0} label="Conversion" size="md" />
        <div className="flex-1 text-slate-400 text-sm ml-4">
          <p className="mb-1">{analysis?.summary ?? "Complete onboarding to generate live website, SEO, content, and conversion scores."}</p>
          <p className="text-xs text-slate-500">{analysisState?.profile.businessName ?? "No business profile loaded"} · {analysisState?.profile.website ?? "Website URL missing"}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.1em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">🔎 SEO</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="SEO Score" value={seo?.score ?? 0} icon="🏆" suffix="/100" />
        <StatCard label="Website Score" value={website?.score ?? 0} icon="🌐" suffix="/100" />
        <StatCard label="Content Score" value={content?.score ?? 0} icon="📝" suffix="/100" />
        <StatCard label="Conversion Score" value={conversion?.score ?? 0} icon="🎯" suffix="/100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Active opportunities</h3>
          <div className="space-y-2">
            {activeOpportunities.length ? activeOpportunities.map((opportunity) => (
              <div key={opportunity.id} className="flex items-start gap-2 text-sm">
                <PriorityBadge priority={opportunity.priority} />
                <span className="text-slate-300">{opportunity.title}</span>
              </div>
            )) : <p className="text-sm text-slate-400">No live opportunities yet.</p>}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Analysis summary</h3>
          <p className="text-sm leading-6 text-slate-300">{analysis?.summary ?? "The live analysis summary appears after onboarding."}</p>
          {analysis?.strongestSocial && <p className="mt-3 text-xs text-slate-500">Strongest social channel: {analysis.strongestSocial.channel} · {analysis.strongestSocial.engagement}% engagement benchmark</p>}
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">📝 Content</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active channels" value={analysis?.activeChannels.length ?? 0} icon="📡" />
        <StatCard label="Top opportunities" value={analysis?.opportunities.length ?? 0} icon="💡" />
        <StatCard label="Business type" value={analysisState?.profile.businessType ?? "N/A"} icon="🏢" />
        <StatCard label="Location" value={analysisState?.profile.city && analysisState.profile.state ? `${analysisState.profile.city}, ${analysisState.profile.state}` : "N/A"} icon="📍" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Website findings</h3>
          <div className="space-y-3">
            {scan?.issues?.length ? scan.issues.map((issue) => (
              <div key={issue.description} className="flex items-start gap-2 text-sm text-slate-300">
                <PriorityBadge priority={issue.severity} />
                <span>{issue.description}</span>
              </div>
            )) : <p className="text-sm text-slate-400">Run a scan to see live website findings.</p>}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Recommended next action</h3>
          <p className="text-sm leading-6 text-slate-300">{analysis?.opportunities[0]?.recommendation ?? "Complete onboarding and add a public website URL to unlock the first recommendation."}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4">🎯 Conversion</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Website URL" value={analysisState?.profile.website ?? "N/A"} icon="🔗" />
        <StatCard label="Scan Score" value={scan?.score ?? 0} icon="📊" suffix="/100" />
        <StatCard label="Images" value={scan?.images ?? 0} icon="🖼️" />
        <StatCard label="Missing Alt" value={scan?.missingAlt ?? 0} icon="♿" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">CTA and page quality</h3>
        <p className="text-sm leading-6 text-slate-300">The live analysis points to the website and conversion signals that matter most, while the scanner keeps the on-page health check current with the public homepage.</p>
      </div>

      {isLoading && <p className="mt-6 text-xs uppercase tracking-[0.1em] text-slate-500">Loading live website analysis...</p>}
    </div>
  );
}
