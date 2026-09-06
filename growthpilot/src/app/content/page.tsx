"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, FileText, Film, Mail, MapPin, Pencil, Send, Share2, Sparkles, Trash2 } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type ContentType = "Social post" | "Reels / TikTok ideas" | "Blog outline" | "Google Business post" | "Email campaign";
type CalendarItem = { id: string; type: string; title: string; date: string };
type UiNotice = { kind: "success" | "error"; message: string };
type ApiFailure = { error?: string; requestId?: string };

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
  };
};

const contentTypes: { type: ContentType; icon: typeof Share2; description: string }[] = [
  { type: "Social post", icon: Share2, description: "Platform-aware caption and CTA" },
  { type: "Reels / TikTok ideas", icon: Film, description: "Hook, visual direction, and script beat" },
  { type: "Blog outline", icon: FileText, description: "Search-friendly structure and CTA" },
  { type: "Google Business post", icon: MapPin, description: "Local update designed for discovery" },
  { type: "Email campaign", icon: Mail, description: "Subject line, message, and conversion CTA" },
];

function createDraft(type: ContentType, topic: string, channel: string) {
  const subject = topic || "your strongest customer question";
  const drafts: Record<ContentType, string> = {
    "Social post": `Hook: ${subject} is easier to solve than most businesses think.\n\n${channel} caption:\nHere is the practical way to approach ${subject}. Start with one clear action, measure the response, then build on what your audience already values.\n\nCTA: Save this for your next planning session and share the result you want to improve.\n\n#BusinessGrowth #MarketingStrategy`,
    "Reels / TikTok ideas": `1. Hook (0-2 sec): "The mistake most businesses make with ${subject}."\n2. Teach (3-18 sec): Share one useful, specific lesson with a visual example.\n3. Proof (19-25 sec): Show the outcome or before-and-after signal.\n4. CTA (26-30 sec): "Follow for another practical growth move this week."\n\nVisual direction: quick cuts of the process, large on-screen keywords, and a final result frame.`,
    "Blog outline": `Working title: A Practical Guide to ${subject}\n\n1. Why ${subject} matters now\n2. The common approach that underperforms\n3. A step-by-step framework\n4. Examples and measurable signals to watch\n5. Frequently asked questions\n6. Next step: invite readers to assess their current performance`,
    "Google Business post": `Post title: A better way to approach ${subject}\n\nWe are helping local customers make progress on ${subject} with practical guidance and clear next steps. This week, our focus is helping you understand what matters most and how to move forward with confidence.\n\nCTA: Visit us or contact our team to get started.`,
    "Email campaign": `Subject: A simpler way to improve ${subject}\nPreheader: One practical action you can take this week.\n\nHi there,\n\nWhen it comes to ${subject}, the biggest gains often come from one focused improvement, not more activity. We put together a simple approach you can use this week to create a clearer result.\n\nCTA: See the recommended next step\n\nBest,\nYour team`,
  };
  return drafts[type];
}

function formatErrorMessage(error: string, requestId?: string) {
  return requestId ? `${error} (Ref: ${requestId})` : error;
}

function getResponseRequestId(response: Response, payload?: ApiFailure) {
  return payload?.requestId ?? response.headers.get("x-request-id") ?? undefined;
}

export default function ContentPage() {
  const [analysisState, setAnalysisState] = useState<BusinessAnalysisState | null>(null);
  const [type, setType] = useState<ContentType>("Social post");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduling, setIsScheduling] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [editingDate, setEditingDate] = useState("");
  const [editingType, setEditingType] = useState<ContentType>("Social post");
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
      const [analysisResponse, calendarResponse] = await Promise.all([
        fetch("/api/business-analysis", {
          method: "GET",
          headers: await createAuthedJsonHeaders(),
        }),
        fetch("/api/content-calendar", {
          method: "GET",
          headers: await createAuthedJsonHeaders(),
        }),
      ]);

      const analysisResult = (await analysisResponse.json().catch(() => ({ error: "Unable to load business analysis." }))) as (BusinessAnalysisState & ApiFailure);
      const calendarResult = (await calendarResponse.json().catch(() => ({ error: "Unable to load content calendar." }))) as { items?: CalendarItem[] } & ApiFailure;
      if (!isActive) return;

      if (!analysisResponse.ok) {
        setError(formatErrorMessage(analysisResult.error ?? "Unable to load business analysis.", getResponseRequestId(analysisResponse, analysisResult)));
        setAnalysisState(null);
        setIsLoading(false);
        return;
      }

      if (!calendarResponse.ok) {
        setError(formatErrorMessage(calendarResult.error ?? "Unable to load content calendar.", getResponseRequestId(calendarResponse, calendarResult)));
      }

      setAnalysisState(analysisResult);
      setCalendar(Array.isArray(calendarResult.items) ? calendarResult.items : []);
      setLastUpdatedLabel(new Date().toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const strongestChannel = analysisState?.analysis.strongestSocial?.channel ?? "your primary channel";
  const activeChannels = analysisState?.analysis.activeChannels ?? [];
  const analysisSummary = analysisState?.analysis.summary ?? "Complete onboarding to unlock a live content strategy.";
  const recommendedTopic = useMemo(() => {
    const topOpportunity = analysisState?.analysis.opportunities[0];
    if (!topOpportunity) return "your strongest customer question";
    return topOpportunity.title.replace(/^.*?:\s*/, "") || topOpportunity.title;
  }, [analysisState]);

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(createDraft(type, topic || recommendedTopic, strongestChannel));
  }

  async function scheduleDraft() {
    if (!draft || !scheduleDate) return;

    setIsScheduling(true);
    const title = topic || draft.split("\n")[0].replace(/^.*?:\s*/, "");
    const optimisticId = `temp-${Date.now()}`;
    const optimisticItem: CalendarItem = {
      id: optimisticId,
      type,
      title,
      date: scheduleDate,
    };
    setCalendar((current) => [...current, optimisticItem].sort((left, right) => left.date.localeCompare(right.date)));
    setScheduleDate("");

    const response = await fetch("/api/content-calendar", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({
        type,
        title,
        date: scheduleDate,
      }),
    });

    const result = (await response.json().catch(() => ({ error: "Unable to schedule this draft." }))) as { item?: CalendarItem } & ApiFailure;
    setIsScheduling(false);

    if (!response.ok || !result.item) {
      setCalendar((current) => current.filter((item) => item.id !== optimisticId));
      const message = formatErrorMessage(result.error ?? "Unable to schedule this draft.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    const newItem = result.item;
    setError("");
    setNotice({ kind: "success", message: "Content added to calendar." });
    setCalendar((current) =>
      current
        .map((item) => (item.id === optimisticId ? newItem : item))
        .sort((left, right) => left.date.localeCompare(right.date))
    );
  }

  async function removeScheduledItem(id: string) {
    const existingItem = calendar.find((item) => item.id === id);
    if (!existingItem) return;

    setDeletingId(id);
    setCalendar((current) => current.filter((item) => item.id !== id));

    const response = await fetch("/api/content-calendar", {
      method: "DELETE",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ id }),
    });
    const result = (await response.json().catch(() => ({ error: "Unable to remove scheduled content." }))) as { ok?: boolean } & ApiFailure;
    setDeletingId(null);

    if (!response.ok) {
      setCalendar((current) => [...current, existingItem].sort((left, right) => left.date.localeCompare(right.date)));
      const message = formatErrorMessage(result.error ?? "Unable to remove scheduled content.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    setError("");
    setNotice({ kind: "success", message: "Scheduled content removed." });
  }

  function startEditScheduledItem(item: CalendarItem) {
    const typeMatch = contentTypes.find((entry) => entry.type === item.type)?.type ?? "Social post";
    setEditingId(item.id);
    setEditingTitle(item.title);
    setEditingDate(item.date);
    setEditingType(typeMatch);
  }

  function cancelEditScheduledItem() {
    setEditingId(null);
    setEditingTitle("");
    setEditingDate("");
    setEditingType("Social post");
  }

  async function saveScheduledItemEdits() {
    if (!editingId || !editingTitle.trim() || !editingDate) return;

    const existingItem = calendar.find((item) => item.id === editingId);
    if (!existingItem) return;

    const optimisticItem: CalendarItem = {
      id: editingId,
      title: editingTitle.trim(),
      date: editingDate,
      type: editingType,
    };

    setCalendar((current) =>
      current
        .map((item) => (item.id === optimisticItem.id ? optimisticItem : item))
        .sort((left, right) => left.date.localeCompare(right.date))
    );

    setIsSavingEdit(true);
    const response = await fetch("/api/content-calendar", {
      method: "PATCH",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({
        id: editingId,
        title: editingTitle.trim(),
        date: editingDate,
        type: editingType,
      }),
    });
    const result = (await response.json().catch(() => ({ error: "Unable to update scheduled content." }))) as { item?: CalendarItem } & ApiFailure;
    setIsSavingEdit(false);

    if (!response.ok || !result.item) {
      setCalendar((current) =>
        current
          .map((item) => (item.id === existingItem.id ? existingItem : item))
          .sort((left, right) => left.date.localeCompare(right.date))
      );
      const message = formatErrorMessage(result.error ?? "Unable to update scheduled content.", getResponseRequestId(response, result));
      setError(message);
      setNotice({ kind: "error", message });
      return;
    }

    const updatedItem = result.item;
    setError("");
    setCalendar((current) =>
      current
        .map((item) => (item.id === updatedItem.id ? updatedItem : item))
        .sort((left, right) => left.date.localeCompare(right.date))
    );
    setNotice({ kind: "success", message: "Scheduled content updated." });
    cancelEditScheduledItem();
  }

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <SectionHeader title="Content Studio" subtitle="Turn a live growth opportunity into ready-to-review content and a realistic publishing plan." icon="✦" />

      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last refreshed: {lastUpdatedLabel}</p>
      {notice && <p role="status" className={`mb-4 border p-3 text-sm ${notice.kind === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-red-500/30 bg-red-500/10 text-red-200"}`}>{notice.message}</p>}
      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-400">Loading live content signals...</p>}

      <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />AI content direction</div>
            <h2 className="mt-2 text-xl font-bold text-white">Build around what your audience is already responding to.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{analysisSummary} Start with educational content for {strongestChannel}, then adapt the strongest asset across your other active channels.</p>
          </div>
          <div className="flex flex-col gap-2 text-right">
            <span className="border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">Best channel: {strongestChannel}</span>
            <span className="text-xs uppercase tracking-[0.1em] text-slate-500">{activeChannels.length} active channels</span>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]">
        <section className="border border-slate-700 bg-slate-900 p-5">
          <h2 className="text-lg font-semibold text-white">Create content</h2>
          <p className="mt-1 text-sm text-slate-400">Choose a format, add a topic, and generate a reviewable first draft based on live workspace signals.</p>
          <div className="mt-5 space-y-2">
            {contentTypes.map((item) => {
              const Icon = item.icon;
              const active = type === item.type;
              return <button type="button" key={item.type} onClick={() => setType(item.type)} className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${active ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/30 hover:border-slate-500"}`}><Icon size={18} className={active ? "text-cyan-300" : "text-slate-400"} /><span><span className="block text-sm font-semibold text-white">{item.type}</span><span className="mt-0.5 block text-xs text-slate-400">{item.description}</span></span></button>;
            })}
          </div>
          <form onSubmit={generate} className="mt-5">
            <label className="block text-sm font-medium text-slate-200">Topic or customer question</label>
            <textarea value={topic} onChange={(event) => setTopic(event.target.value)} rows={4} placeholder={`Example: How can a local business get more qualified leads?`} className="mt-2 w-full resize-y border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />
            <button className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Sparkles size={16} />Generate draft</button>
          </form>
        </section>

        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Draft review</h2>
              <p className="mt-1 text-sm text-slate-400">Edit the draft before scheduling or sending it to the Action Center.</p>
            </div>
            {draft && <span className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">{type}</span>}
          </div>
          {draft ? <><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={17} className="mt-5 w-full resize-y border border-slate-700 bg-slate-950/50 p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400" /><div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row"><input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} className="border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" /><button type="button" disabled={!scheduleDate || isScheduling} onClick={() => void scheduleDraft()} className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50"><CalendarDays size={16} />{isScheduling ? "Scheduling..." : "Add to calendar"}</button><button type="button" className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Send size={16} />Send to review</button></div></> : <div className="mt-5 flex min-h-80 items-center justify-center border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center text-sm leading-6 text-slate-500">Choose a format and topic to generate a draft. Your content will be based on the business opportunities and active channels in this workspace.</div>}
        </section>
      </div>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <div className="flex items-center gap-3"><CalendarDays size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Content calendar</h2><p className="mt-1 text-sm text-slate-400">Scheduled drafts are now saved to your workspace and visible across sessions.</p></div></div>
        {calendar.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{calendar.map((item) => { const isEditing = editingId === item.id; return <article key={item.id} className="border border-slate-700 bg-slate-950/40 p-4">{isEditing ? <><label className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Date</label><input type="date" value={editingDate} onChange={(event) => setEditingDate(event.target.value)} className="mt-1 w-full border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400" /><label className="mt-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Title</label><input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} className="mt-1 w-full border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400" /><label className="mt-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">Type</label><select value={editingType} onChange={(event) => setEditingType(event.target.value as ContentType)} className="mt-1 w-full border border-slate-700 bg-slate-950/60 px-2 py-1.5 text-xs text-white outline-none focus:border-cyan-400">{contentTypes.map((entry) => <option key={entry.type} value={entry.type}>{entry.type}</option>)}</select><div className="mt-3 flex gap-2"><button type="button" onClick={() => void saveScheduledItemEdits()} disabled={isSavingEdit || !editingTitle.trim() || !editingDate} className="flex-1 border border-cyan-400 px-2 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-60">{isSavingEdit ? "Saving..." : "Save"}</button><button type="button" onClick={cancelEditScheduledItem} disabled={isSavingEdit} className="flex-1 border border-slate-600 px-2 py-1.5 text-xs font-bold text-slate-300 hover:border-slate-400 disabled:opacity-60">Cancel</button></div></> : <><div className="flex items-start justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">{item.date}</p><div className="flex items-center gap-2"><button type="button" onClick={() => startEditScheduledItem(item)} disabled={Boolean(editingId) || deletingId === item.id} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-cyan-300 disabled:opacity-60"><Pencil size={13} />Edit</button><button type="button" onClick={() => void removeScheduledItem(item.id)} disabled={deletingId === item.id || Boolean(editingId)} className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-red-300 disabled:opacity-60"><Trash2 size={13} />{deletingId === item.id ? "Removing..." : "Remove"}</button></div></div><p className="mt-2 text-sm font-semibold text-white">{item.title}</p><p className="mt-2 text-xs text-slate-400">{item.type}</p></>}</article>; })}</div> : <p className="mt-5 border border-dashed border-slate-700 p-5 text-sm text-slate-500">Your scheduled content will appear here. Generate a draft, choose a date, and add it to the calendar.</p>}
      </section>
    </div>
  );
}
