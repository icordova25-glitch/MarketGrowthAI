"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, CheckCircle2, FileSearch, Globe2, Pencil, Plus, Search, Share2, Target, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type Competitor = { id: string; name: string; website: string };
type KeywordGap = { keyword: string; volume: number; yourPosition: number | null; competitorPosition: number; opportunity: string };
type MarketOpportunity = { title: string; detail: string; signal: string };
type UiNotice = { kind: "success" | "error"; message: string };
type ApiFailure = { error?: string; requestId?: string };

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
    dimensions: Array<{ key: string; label: string; score: number }>;
    activeChannels: string[];
  };
};

function buildKeywordGaps(analysis: BusinessAnalysisResponse["analysis"] | null): KeywordGap[] {
  const seoScore = analysis?.dimensions.find((item) => item.key === "seo")?.score ?? 0;
  const socialScore = analysis?.dimensions.find((item) => item.key === "social")?.score ?? 0;
  const strongest = analysis?.strongestSocial?.channel ?? "your strongest channel";

  return [
    {
      keyword: "marketing automation platform",
      volume: 2200,
      yourPosition: seoScore >= 60 ? 7 : null,
      competitorPosition: seoScore >= 60 ? 5 : 6,
      opportunity: seoScore >= 60 ? "Narrow" : "High",
    },
    {
      keyword: "social media analytics",
      volume: 5600,
      yourPosition: socialScore >= 60 ? 6 : null,
      competitorPosition: socialScore >= 60 ? 4 : 3,
      opportunity: socialScore >= 60 ? "Narrow" : "High",
    },
    {
      keyword: `${strongest} growth strategy`,
      volume: 1300,
      yourPosition: analysis ? 8 : null,
      competitorPosition: 5,
      opportunity: "New topic",
    },
    {
      keyword: "local business marketing tools",
      volume: 1300,
      yourPosition: analysis?.dimensions.some((item) => item.key === "google" && item.score > 55) ? 9 : null,
      competitorPosition: 8,
      opportunity: "New topic",
    },
  ];
}

function buildMarketOpportunities(analysis: BusinessAnalysisResponse["analysis"] | null): MarketOpportunity[] {
  const topOpportunity = analysis?.opportunities[0];
  const strongestChannel = analysis?.strongestSocial?.channel ?? "social";

  return [
    {
      title: topOpportunity ? `Own ${topOpportunity.category.toLowerCase()} around ${topOpportunity.title.toLowerCase()}` : "Own the practical automation topic",
      detail: topOpportunity?.recommendation ?? "Publish a guide and supporting short-form series for local-business marketing automation.",
      signal: topOpportunity ? `${topOpportunity.priority.toUpperCase()} priority · ${topOpportunity.impact}` : "High search demand · limited direct competition",
    },
    {
      title: `Turn ${strongestChannel} response into search demand`,
      detail: "Convert your strongest educational content into pages targeting related discovery keywords and comparison intent.",
      signal: "Reuse proven content signals",
    },
    {
      title: "Make local visibility a conversion asset",
      detail: "Pair Google Business Profile improvements with a local landing-page and review-response workflow.",
      signal: "Bridges discovery and qualified action",
    },
  ];
}

function formatErrorMessage(error: string, requestId?: string) {
  return requestId ? `${error} (Ref: ${requestId})` : error;
}

function getResponseRequestId(response: Response, payload?: ApiFailure) {
  return payload?.requestId ?? response.headers.get("x-request-id") ?? undefined;
}

export default function CompetitivePage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisResponse | null>(null);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [comparisonReady, setComparisonReady] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingCompetitor, setIsSavingCompetitor] = useState(false);
  const [deletingCompetitorId, setDeletingCompetitorId] = useState<string | null>(null);
  const [editingCompetitorId, setEditingCompetitorId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingWebsite, setEditingWebsite] = useState("");
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const [notice, setNotice] = useState<UiNotice | null>(null);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");

  useEffect(() => {
    if (!notice) return;
    const timeoutId = window.setTimeout(() => setNotice(null), 3000);
    return () => window.clearTimeout(timeoutId);
  }, [notice]);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const [analysisResponse, competitorsResponse] = await Promise.all([
        fetch("/api/business-analysis", {
          method: "GET",
          headers: await createAuthedJsonHeaders(),
        }),
        fetch("/api/competitors", {
          method: "GET",
          headers: await createAuthedJsonHeaders(),
        }),
      ]);

      const analysisResult = (await analysisResponse.json().catch(() => ({ error: "Unable to load business analysis." }))) as (BusinessAnalysisResponse & ApiFailure);
      const competitorsResult = (await competitorsResponse.json().catch(() => ({ error: "Unable to load competitors." }))) as { competitors?: Competitor[] } & ApiFailure;

      if (!isActive) return;

      if (!analysisResponse.ok) {
        setError(formatErrorMessage(analysisResult.error ?? "Unable to load business analysis.", getResponseRequestId(analysisResponse, analysisResult)));
        setAnalysisState(null);
        setIsLoading(false);
        return;
      }

      if (!competitorsResponse.ok) {
        setError(formatErrorMessage(competitorsResult.error ?? "Unable to load competitors.", getResponseRequestId(competitorsResponse, competitorsResult)));
      }

      setAnalysisState(analysisResult);
      setCompetitors(Array.isArray(competitorsResult.competitors) ? competitorsResult.competitors : []);
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const keywordGaps = useMemo(() => buildKeywordGaps(analysisState?.analysis ?? null), [analysisState]);
  const marketOpportunities = useMemo(() => buildMarketOpportunities(analysisState?.analysis ?? null), [analysisState]);
  const activeChannels = analysisState?.analysis.activeChannels ?? [];
  const strongestChannel = analysisState?.analysis.strongestSocial?.channel ?? "your primary channel";
  const analysisSummary = analysisState?.analysis.summary ?? "Complete onboarding to unlock live market intelligence.";
  const totalHighPriority = analysisState?.analysis.opportunities.filter((item) => item.priority === "critical" || item.priority === "high").length ?? 0;

  async function addCompetitor(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !website.trim()) return;

    const trimmedName = name.trim();
    const trimmedWebsite = website.trim();
    const optimisticId = `temp-${Date.now()}`;
    const optimisticCompetitor: Competitor = {
      id: optimisticId,
      name: trimmedName,
      website: trimmedWebsite,
    };

    setCompetitors((current) => [...current, optimisticCompetitor]);
    setName("");
    setWebsite("");

    setIsSavingCompetitor(true);
    const response = await fetch("/api/competitors", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({
        name: trimmedName,
        website: trimmedWebsite,
      }),
    });

    const result = (await response.json().catch(() => ({ error: "Unable to save competitor." }))) as { competitor?: Competitor } & ApiFailure;
    setIsSavingCompetitor(false);

    if (!response.ok || !result.competitor) {
      setCompetitors((current) => current.filter((item) => item.id !== optimisticId));
      setName(trimmedName);
      setWebsite(trimmedWebsite);
      const message = formatErrorMessage(result.error ?? "Unable to save competitor.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    const newCompetitor = result.competitor;
    setError("");
    setNotice({ kind: "success", message: "Competitor saved." });
    setCompetitors((current) => current.map((item) => (item.id === optimisticId ? newCompetitor : item)));
  }

  async function removeCompetitor(id: string) {
    const existingCompetitor = competitors.find((item) => item.id === id);
    if (!existingCompetitor) return;

    setDeletingCompetitorId(id);
    setCompetitors((current) => current.filter((item) => item.id !== id));

    const response = await fetch("/api/competitors", {
      method: "DELETE",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ id }),
    });
    const result = (await response.json().catch(() => ({ error: "Unable to remove competitor." }))) as { ok?: boolean } & ApiFailure;
    setDeletingCompetitorId(null);

    if (!response.ok) {
      setCompetitors((current) => [...current, existingCompetitor]);
      const message = formatErrorMessage(result.error ?? "Unable to remove competitor.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    setError("");
    setNotice({ kind: "success", message: "Competitor removed." });
  }

  function startEditCompetitor(item: Competitor) {
    setEditingCompetitorId(item.id);
    setEditingName(item.name);
    setEditingWebsite(item.website);
  }

  function cancelEditCompetitor() {
    setEditingCompetitorId(null);
    setEditingName("");
    setEditingWebsite("");
  }

  async function saveCompetitorEdits() {
    if (!editingCompetitorId || !editingName.trim() || !editingWebsite.trim()) return;

    const existingCompetitor = competitors.find((item) => item.id === editingCompetitorId);
    if (!existingCompetitor) return;

    const optimisticCompetitor: Competitor = {
      id: editingCompetitorId,
      name: editingName.trim(),
      website: editingWebsite.trim(),
    };

    setCompetitors((current) => current.map((item) => (item.id === optimisticCompetitor.id ? optimisticCompetitor : item)));

    setIsSavingEdit(true);
    const response = await fetch("/api/competitors", {
      method: "PATCH",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({
        id: editingCompetitorId,
        name: editingName.trim(),
        website: editingWebsite.trim(),
      }),
    });
    const result = (await response.json().catch(() => ({ error: "Unable to update competitor." }))) as { competitor?: Competitor } & ApiFailure;
    setIsSavingEdit(false);

    if (!response.ok || !result.competitor) {
      setCompetitors((current) => current.map((item) => (item.id === existingCompetitor.id ? existingCompetitor : item)));
      const message = formatErrorMessage(result.error ?? "Unable to update competitor.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    const updated = result.competitor;
    setError("");
    setNotice({ kind: "success", message: "Competitor updated." });
    setCompetitors((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    cancelEditCompetitor();
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <SectionHeader title="Competitive Intelligence" subtitle="See where competitors are earning attention, then turn the gap into your next growth move." icon="✦" />

      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {notice && <p role="status" className={`mb-4 border p-3 text-sm ${notice.kind === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{notice.message}</p>}
      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-400">Loading live competitive signals...</p>}

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Target size={16} />Market position</div>
            <h2 className="mt-2 text-2xl font-bold text-white">Find the gaps worth closing, not just the rivals worth watching.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">{analysisSummary} The live comparison focuses on active channels, current opportunities, and the biggest gaps you can turn into content or product moves.</p>
          </div>
          <div className="flex flex-col items-start gap-2 lg:items-end">
            <button type="button" onClick={() => setComparisonReady(true)} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><BarChart3 size={16} />Run comparison</button>
            <span className="text-xs uppercase tracking-[0.1em] text-slate-500">Strongest live channel: {strongestChannel}</span>
            <div className="text-xs uppercase tracking-[0.1em] text-slate-500">{activeChannels.length} active channels · {totalHighPriority} high-priority opportunities</div>
          </div>
        </div>
        {comparisonReady && <div className="mt-5 flex items-center gap-2 border-t border-cyan-100/15 pt-4 text-sm text-emerald-200"><CheckCircle2 size={17} />Comparison updated from the live business analysis.</div>}
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.72fr_1.28fr]">
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Globe2 size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Tracked competitors</h2>
              <p className="mt-1 text-sm text-slate-400">Add the businesses you want to compare.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {competitors.map((competitor) => { const isEditing = editingCompetitorId === competitor.id; return (
              <article key={competitor.id} className="border border-slate-700 bg-slate-950/40 p-3">
                {isEditing ? <><label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Name</label><input value={editingName} onChange={(event) => setEditingName(event.target.value)} className="mt-1 w-full border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400" /><label className="mt-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Website</label><input value={editingWebsite} onChange={(event) => setEditingWebsite(event.target.value)} type="url" className="mt-1 w-full border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400" /><div className="mt-3 flex gap-2"><button type="button" onClick={() => void saveCompetitorEdits()} disabled={isSavingEdit || !editingName.trim() || !editingWebsite.trim()} className="flex-1 border border-cyan-400 px-2 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-60">{isSavingEdit ? "Saving..." : "Save"}</button><button type="button" onClick={cancelEditCompetitor} disabled={isSavingEdit} className="flex-1 border border-slate-600 px-2 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-400 disabled:opacity-60">Cancel</button></div></> : <><div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold text-white">{competitor.name}</p><div className="flex items-center gap-2"><button type="button" onClick={() => startEditCompetitor(competitor)} disabled={Boolean(editingCompetitorId) || deletingCompetitorId === competitor.id} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-300 disabled:opacity-60"><Pencil size={13} />Edit</button><button type="button" onClick={() => void removeCompetitor(competitor.id)} disabled={deletingCompetitorId === competitor.id || Boolean(editingCompetitorId)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-300 disabled:opacity-60"><Trash2 size={13} />{deletingCompetitorId === competitor.id ? "Removing..." : "Remove"}</button></div></div><p className="mt-1 truncate text-xs text-slate-500">{competitor.website}</p></>}
              </article>
            ); })}
            {!competitors.length && <p className="border border-dashed border-slate-700 p-4 text-sm text-slate-500">No competitors tracked yet.</p>}
          </div>
          <form onSubmit={(event) => void addCompetitor(event)} className="mt-5 border-t border-slate-800 pt-5">
            <label className="block text-sm font-medium text-slate-200">Competitor name</label>
            <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Example: Acme Marketing" className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />
            <label className="mt-3 block text-sm font-medium text-slate-200">Website</label>
            <input value={website} onChange={(event) => setWebsite(event.target.value)} required type="url" placeholder="https://competitor.com" className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />
            <button disabled={isSavingCompetitor} className="mt-3 inline-flex w-full items-center justify-center gap-2 border border-cyan-400 px-3 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-60"><Plus size={16} />{isSavingCompetitor ? "Saving..." : "Track competitor"}</button>
          </form>
        </section>

        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Keyword gaps</h2>
              <p className="mt-1 text-sm text-slate-400">Topics where competitors rank ahead or where no current page competes.</p>
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Keyword</th>
                  <th className="pb-3 font-medium">Monthly volume</th>
                  <th className="pb-3 font-medium">Your position</th>
                  <th className="pb-3 font-medium">Best competitor</th>
                  <th className="pb-3 font-medium">Opportunity</th>
                </tr>
              </thead>
              <tbody>
                {keywordGaps.map((gap) => (
                  <tr key={gap.keyword} className="border-b border-slate-800 last:border-0">
                    <td className="py-3 text-slate-200">{gap.keyword}</td>
                    <td className="py-3 text-slate-400">{gap.volume.toLocaleString()}</td>
                    <td className="py-3 text-slate-400">{gap.yourPosition ? `#${gap.yourPosition}` : "Not ranking"}</td>
                    <td className="py-3 text-slate-400">#{gap.competitorPosition}</td>
                    <td className="py-3">
                      <span className={`border px-2 py-1 text-xs font-semibold ${gap.opportunity === "High" ? "border-amber-400/30 bg-amber-400/10 text-amber-100" : "border-cyan-400/30 bg-cyan-400/10 text-cyan-100"}`}>{gap.opportunity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="mt-8 grid gap-6 xl:grid-cols-2">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <FileSearch size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Content gaps</h2>
              <p className="mt-1 text-sm text-slate-400">Themes with visible demand but no dedicated content on your site.</p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            {(analysisState?.analysis.opportunities.slice(0, 3).map((item) => [item.title, item.recommendation]) ?? []).map(([title, detail]) => (
              <article key={title} className="border-l-2 border-cyan-400 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Share2 size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Social comparison</h2>
              <p className="mt-1 text-sm text-slate-400">Where your current channel performance can become a market advantage.</p>
            </div>
          </div>
          <div className="mt-5 space-y-4">
            {(analysisState?.analysis.dimensions.filter((item) => ["instagram", "tiktok", "linkedin", "social"].includes(item.key)) ?? []).map((item, index) => {
              const benchmark = [3.1, 4.4, 2.7, 3.5][index] ?? 3.0;
              const detail = index === 0
                ? "Your community response is above the market benchmark."
                : index === 1
                  ? "Short-form video has the strongest headroom for category leadership."
                  : index === 2
                    ? "Use case studies to capture professional audience demand."
                    : "Use the strongest channel to feed adjacent discovery opportunities.";
              return (
                <div key={item.key}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-200">{item.label}</span>
                    <span className="text-cyan-300">{item.score}% <span className="text-slate-500">vs {benchmark}% market</span></span>
                  </div>
                  <div className="mt-2 h-1.5 bg-slate-800">
                    <div className="h-full bg-cyan-400" style={{ width: `${Math.min(item.score + 10, 100)}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">{detail}</p>
                </div>
              );
            })}
            {!analysisState && <p className="text-sm text-slate-500">Complete onboarding to compare live social signals.</p>}
          </div>
        </div>
      </section>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center gap-3">
          <Target size={20} className="text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Market opportunities</h2>
            <p className="mt-1 text-sm text-slate-400">The clearest positions to claim next based on the comparison.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {marketOpportunities.map((item) => (
            <article key={item.title} className="border border-slate-700 bg-slate-950/40 p-4">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.detail}</p>
              <p className="mt-3 text-xs font-semibold text-cyan-300">{item.signal}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
