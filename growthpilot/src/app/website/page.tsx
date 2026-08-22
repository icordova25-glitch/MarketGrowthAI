"use client";

import { FormEvent, useState } from "react";
import { Globe2, Play, ScanSearch } from "lucide-react";
import { mockWebsiteData } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader, PriorityBadge } from "@/components/ui";

export default function WebsitePage() {
  const { seo, content, conversion } = mockWebsiteData;
  const [websiteUrl, setWebsiteUrl] = useState(() => {
    if (typeof window === "undefined") return "";
    const stored = window.localStorage.getItem("marketgrowthai.business");
    if (!stored) return "";
    return (JSON.parse(stored) as { website?: string }).website ?? "";
  });
  const [scan, setScan] = useState<{ score: number; title: string; description: string; headings: number; images: number; missingAlt: number; words: number; issues: { severity: "high" | "medium" | "low"; description: string }[] } | null>(null);
  const [error, setError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  async function scanWebsite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsScanning(true);
    const response = await fetch("/api/website-scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url: websiteUrl }) });
    const result = await response.json() as typeof scan & { error?: string };
    setIsScanning(false);
    if (!response.ok) {
      setError(result.error ?? "Unable to scan this website.");
      return;
    }
    setScan(result);
  }

  return (
    <div>
      <SectionHeader
        title="Website intelligence"
        subtitle="Scan your public website for live, on-page SEO and content signals."
        icon="✦"
      />

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><ScanSearch size={16} />Live website scanner</div><h2 className="mt-2 text-xl font-bold text-white">Run an on-page SEO check.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">MarketGrowthAI scans the public homepage only. It checks titles, meta descriptions, H1 structure, canonical tags, image alt text, and visible copy.</p></div><Globe2 size={30} className="text-cyan-300" /></div>
        <form onSubmit={scanWebsite} className="mt-5 flex flex-col gap-3 sm:flex-row"><input type="url" value={websiteUrl} onChange={(event) => setWebsiteUrl(event.target.value)} placeholder="https://yourbusiness.com" required className="min-w-0 flex-1 border border-slate-600 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><button disabled={isScanning} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"><Play size={16} />{isScanning ? "Scanning..." : "Scan website"}</button></form>
        {error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}
        {scan && <div className="mt-5 grid gap-4 border-t border-cyan-100/15 pt-5 lg:grid-cols-[0.8fr_1.2fr]"><div className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Live SEO score</p><p className="mt-2 text-4xl font-bold text-white">{scan.score}<span className="text-lg text-slate-500">/100</span></p><div className="mt-4 space-y-1 text-xs text-slate-400"><p>{scan.words.toLocaleString()} visible words</p><p>{scan.headings} H1 heading{scan.headings === 1 ? "" : "s"}</p><p>{scan.images} images · {scan.missingAlt} missing alt text</p></div></div><div><p className="text-sm font-semibold text-white">Current scan findings</p><p className="mt-1 truncate text-xs text-slate-400">{scan.title || "No title tag found"}</p><div className="mt-3 space-y-2">{scan.issues.length ? scan.issues.map((issue) => <div key={issue.description} className="flex items-start gap-2 text-sm"><PriorityBadge priority={issue.severity} /><span className="text-slate-300">{issue.description}</span></div>) : <p className="text-sm text-emerald-300">No priority on-page SEO issues found.</p>}</div></div></div>}
      </section>

      {/* Score Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex gap-8 items-center">
        <ScoreRing score={seo.score} label="SEO" size="md" />
        <ScoreRing score={content.score} label="Content" size="md" />
        <ScoreRing score={conversion.score} label="Conversion" size="md" />
        <div className="flex-1 text-slate-400 text-sm ml-4">
          <p className="mb-1">Your website scores well on content quality but has room to improve in SEO and conversion.</p>
          <p className="text-xs text-slate-500">Based on analysis of {content.totalPages} pages and {content.blogPosts} blog posts.</p>
        </div>
      </div>

      {/* SEO Section */}
      <h2 className="text-lg font-semibold text-white mb-4">🔎 SEO</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Organic Traffic" value={seo.organicTraffic.toLocaleString()} change={seo.organicTrafficChange} icon="📈" />
        <StatCard label="SEO Score" value={seo.score} icon="🏆" suffix="/100" />
        <StatCard label="Issues Found" value={seo.issues.length} icon="⚠️" />
        <StatCard label="Top Keywords" value={seo.topKeywords.length} icon="🔑" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Keywords */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Top Keywords</h3>
          <div className="space-y-2">
            {seo.topKeywords.map((kw, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{kw.keyword}</span>
                <div className="flex gap-4 text-slate-500">
                  <span>Pos. <span className="text-violet-400">#{kw.position}</span></span>
                  <span>{kw.volume.toLocaleString()} vol</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Issues */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">SEO Issues</h3>
          <div className="space-y-2">
            {seo.issues.map((issue, i) => {
              const p = issue.severity === "high" ? "high" : issue.severity === "medium" ? "medium" : "low";
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <PriorityBadge priority={p as "high" | "medium" | "low"} />
                  <span className="text-slate-300">{issue.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <h2 className="text-lg font-semibold text-white mb-4">📝 Content</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Pages" value={content.totalPages} icon="📄" />
        <StatCard label="Blog Posts" value={content.blogPosts} icon="✍️" />
        <StatCard label="Avg Read Time" value={content.avgReadTime} icon="⏱️" />
        <StatCard label="Content Score" value={content.score} icon="📊" suffix="/100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Top Content</h3>
          <div className="space-y-3">
            {content.topContent.map((c, i) => (
              <div key={i} className="text-sm">
                <div className="text-slate-200 mb-0.5">{c.title}</div>
                <div className="flex gap-4 text-slate-500 text-xs">
                  <span>{c.views.toLocaleString()} views</span>
                  <span>{c.conversion}% conversion</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {content.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-violet-400 mt-0.5">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conversion Section */}
      <h2 className="text-lg font-semibold text-white mb-4">🎯 Conversion</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Conversion Rate" value={`${conversion.conversionRate}%`} change={conversion.conversionRateChange} icon="🎯" />
        <StatCard label="Bounce Rate" value={`${conversion.bounceRate}%`} icon="↩️" />
        <StatCard label="Avg Session" value={conversion.avgSessionDuration} icon="⏱️" />
        <StatCard label="Conversion Score" value={conversion.score} icon="📊" suffix="/100" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">CTA Performance by Page</h3>
        <div className="space-y-2">
          {conversion.cta.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{c.page}</span>
              <div className="flex gap-6 text-slate-500">
                <span>CTR: <span className="text-amber-400">{c.ctr}%</span></span>
                <span>{c.conversions} conversions</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
