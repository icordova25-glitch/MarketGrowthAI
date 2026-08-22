"use client";

import { FormEvent, useEffect, useState } from "react";
import { BarChart3, CheckCircle2, FileSearch, Globe2, Plus, Search, Share2, Target } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { mockSocialData } from "@/lib/mock-data";

type Competitor = { id: number; name: string; website: string };

const initialCompetitors: Competitor[] = [
  { id: 1, name: "Northstar Growth", website: "https://northstargrowth.example" },
  { id: 2, name: "Signal Works", website: "https://signalworks.example" },
];

const keywordGaps = [
  { keyword: "ai marketing software", volume: 3400, yourPosition: 12, competitorPosition: 4, opportunity: "High" },
  { keyword: "social media analytics", volume: 5600, yourPosition: 9, competitorPosition: 3, opportunity: "High" },
  { keyword: "marketing automation platform", volume: 2200, yourPosition: null, competitorPosition: 6, opportunity: "New topic" },
  { keyword: "local business marketing tools", volume: 1300, yourPosition: null, competitorPosition: 8, opportunity: "New topic" },
];

export default function CompetitivePage() {
  const [competitors, setCompetitors] = useState<Competitor[]>(initialCompetitors);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [comparisonReady, setComparisonReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem("marketgrowthai.competitors");
      if (stored) setCompetitors(JSON.parse(stored) as Competitor[]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function addCompetitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !website.trim()) return;
    const next = [...competitors, { id: Date.now(), name: name.trim(), website: website.trim() }];
    setCompetitors(next);
    window.localStorage.setItem("marketgrowthai.competitors", JSON.stringify(next));
    setName("");
    setWebsite("");
  }

  return <div className="mx-auto max-w-6xl pb-10"><SectionHeader title="Competitive Intelligence" subtitle="See where competitors are earning attention, then turn the gap into your next growth move." icon="✦" />
    <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Target size={16} />Market position</div><h2 className="mt-2 text-2xl font-bold text-white">Find the gaps worth closing, not just the rivals worth watching.</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">MarketGrowthAI compares keyword visibility, content coverage, and social response to identify opportunities where a focused move can create an advantage.</p></div><button type="button" onClick={() => setComparisonReady(true)} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><BarChart3 size={16} />Run comparison</button></div>{comparisonReady && <div className="mt-5 flex items-center gap-2 border-t border-cyan-100/15 pt-4 text-sm text-emerald-200"><CheckCircle2 size={17} />Comparison updated from the tracked market set.</div>}</section>

    <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]"><section className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><Globe2 size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Tracked competitors</h2><p className="mt-1 text-sm text-slate-400">Add the businesses you want to compare.</p></div></div><div className="mt-5 space-y-3">{competitors.map((competitor) => <article key={competitor.id} className="border border-slate-700 bg-slate-950/40 p-3"><p className="text-sm font-semibold text-white">{competitor.name}</p><p className="mt-1 truncate text-xs text-slate-500">{competitor.website}</p></article>)}</div><form onSubmit={addCompetitor} className="mt-5 border-t border-slate-800 pt-5"><label className="block text-sm font-medium text-slate-200">Competitor name</label><input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Example: Acme Marketing" className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><label className="mt-3 block text-sm font-medium text-slate-200">Website</label><input value={website} onChange={(event) => setWebsite(event.target.value)} required type="url" placeholder="https://competitor.com" className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><button className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-cyan-400 px-3 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"><Plus size={16} />Track competitor</button></form></section>

      <section className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><Search size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Keyword gaps</h2><p className="mt-1 text-sm text-slate-400">Topics where competitors rank ahead or where no current page competes.</p></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase tracking-[0.08em] text-slate-500"><tr><th className="pb-3 font-medium">Keyword</th><th className="pb-3 font-medium">Monthly volume</th><th className="pb-3 font-medium">Your position</th><th className="pb-3 font-medium">Best competitor</th><th className="pb-3 font-medium">Opportunity</th></tr></thead><tbody>{keywordGaps.map((gap) => <tr key={gap.keyword} className="border-b border-slate-800 last:border-0"><td className="py-3 text-slate-200">{gap.keyword}</td><td className="py-3 text-slate-400">{gap.volume.toLocaleString()}</td><td className="py-3 text-slate-400">{gap.yourPosition ? `#${gap.yourPosition}` : "Not ranking"}</td><td className="py-3 text-slate-400">#{gap.competitorPosition}</td><td className="py-3"><span className={`border px-2 py-1 text-xs font-semibold ${gap.opportunity === "High" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"}`}>{gap.opportunity}</span></td></tr>)}</tbody></table></div></section></div>

    <section className="mt-8 grid gap-6 xl:grid-cols-2"><div className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><FileSearch size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Content gaps</h2><p className="mt-1 text-sm text-slate-400">Themes with visible demand but no dedicated content on your site.</p></div></div><div className="mt-5 space-y-3">{[
      ["Marketing automation for local businesses", "Competitors cover this in comparison guides; create a practical how-to page."],
      ["Social analytics benchmarks", "Build a benchmark post around the metrics customers can use today."],
      ["Google Business Profile conversion", "Turn your existing local-visibility recommendation into a detailed guide."],
    ].map(([title, detail]) => <article key={title} className="border-l-2 border-cyan-400 bg-slate-950/40 p-4"><p className="text-sm font-semibold text-white">{title}</p><p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p></article>)}</div></div>
      <div className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><Share2 size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Social comparison</h2><p className="mt-1 text-sm text-slate-400">Where your current channel performance can become a market advantage.</p></div></div><div className="mt-5 space-y-4">{[
        ["Instagram engagement", mockSocialData.instagram.engagementRate, 3.1, "Your community response is above the market benchmark."],
        ["TikTok engagement", mockSocialData.tiktok.engagementRate, 4.4, "Short-form video has the strongest headroom for category leadership."],
        ["LinkedIn engagement", mockSocialData.linkedin.engagementRate, 2.7, "Use case studies to capture professional audience demand."],
      ].map(([label, score, benchmark, detail]) => <div key={label as string}><div className="flex justify-between text-sm"><span className="font-medium text-slate-200">{label}</span><span className="text-cyan-300">{score as number}% <span className="text-slate-500">vs {benchmark as number}% market</span></span></div><div className="mt-2 h-1.5 bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${Math.min((score as number) * 12, 100)}%` }} /></div><p className="mt-2 text-xs text-slate-500">{detail as string}</p></div>)}</div></div></section>

    <section className="mt-8 border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><Target size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Market opportunities</h2><p className="mt-1 text-sm text-slate-400">The clearest positions to claim next based on the comparison.</p></div></div><div className="mt-5 grid gap-3 md:grid-cols-3">{[
      ["Own the practical automation topic", "Publish a guide and supporting short-form series for local-business marketing automation.", "High search demand · limited direct competition"],
      ["Turn social response into search demand", "Convert your strongest educational video ideas into pages targeting social analytics and growth-score keywords.", "Reuse proven content signals"],
      ["Make local visibility a conversion asset", "Pair Google Business Profile improvements with a local landing-page and review-response workflow.", "Bridges discovery and qualified action"],
    ].map(([title, detail, signal]) => <article key={title} className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-sm font-semibold text-white">{title}</p><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p><p className="mt-3 text-xs font-semibold text-cyan-300">{signal}</p></article>)}</div></section>
  </div>;
}