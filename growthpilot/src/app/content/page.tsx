"use client";

import { FormEvent, useEffect, useState } from "react";
import { CalendarDays, FileText, Film, Mail, MapPin, Send, Share2, Sparkles } from "lucide-react";
import { SectionHeader } from "@/components/ui";
import { getBusinessAnalysis } from "@/lib/business-analysis";

type ContentType = "Social post" | "Reels / TikTok ideas" | "Blog outline" | "Google Business post" | "Email campaign";
type CalendarItem = { id: number; type: ContentType; title: string; date: string };

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

export default function ContentPage() {
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const [type, setType] = useState<ContentType>("Social post");
  const [topic, setTopic] = useState("");
  const [draft, setDraft] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [calendar, setCalendar] = useState<CalendarItem[]>([]);
  const analysis = getBusinessAnalysis(activeChannels);
  const strongestChannel = analysis.strongestSocial?.channel ?? "your primary channel";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedBusiness = window.localStorage.getItem("marketgrowthai.business");
      const storedCalendar = window.localStorage.getItem("marketgrowthai.content-calendar");
      if (storedBusiness) setActiveChannels((JSON.parse(storedBusiness) as { marketingChannels?: string[] }).marketingChannels ?? []);
      if (storedCalendar) setCalendar(JSON.parse(storedCalendar) as CalendarItem[]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDraft(createDraft(type, topic, strongestChannel));
  }

  function scheduleDraft() {
    if (!draft || !scheduleDate) return;
    const title = topic || draft.split("\n")[0].replace(/^.*?:\s*/, "");
    const next = [...calendar, { id: Date.now(), type, title, date: scheduleDate }].sort((left, right) => left.date.localeCompare(right.date));
    setCalendar(next);
    window.localStorage.setItem("marketgrowthai.content-calendar", JSON.stringify(next));
    setScheduleDate("");
  }

  return <div className="mx-auto max-w-6xl pb-10"><SectionHeader title="Content Studio" subtitle="Turn a growth opportunity into ready-to-review content and a realistic publishing plan." icon="✦" />
    <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />AI content direction</div><h2 className="mt-2 text-xl font-bold text-white">Build around what your audience is already responding to.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{analysis.summary} Start with educational content for {strongestChannel}, then adapt the strongest asset across your other active channels.</p></div><span className="border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100">Best channel: {strongestChannel}</span></div></section>

    <div className="grid gap-6 xl:grid-cols-[0.78fr_1.22fr]"><section className="border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Create content</h2><p className="mt-1 text-sm text-slate-400">Choose a format, add a topic, and generate a reviewable first draft.</p><div className="mt-5 space-y-2">{contentTypes.map((item) => { const Icon = item.icon; const active = type === item.type; return <button type="button" key={item.type} onClick={() => setType(item.type)} className={`flex w-full items-start gap-3 border p-3 text-left transition-colors ${active ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/30 hover:border-slate-500"}`}><Icon size={18} className={active ? "text-cyan-300" : "text-slate-400"} /><span><span className="block text-sm font-semibold text-white">{item.type}</span><span className="mt-0.5 block text-xs text-slate-400">{item.description}</span></span></button>; })}</div><form onSubmit={generate} className="mt-5"><label className="block text-sm font-medium text-slate-200">Topic or customer question</label><textarea value={topic} onChange={(event) => setTopic(event.target.value)} rows={4} placeholder="Example: How can a local business get more qualified leads?" className="mt-2 w-full resize-y border border-slate-700 bg-slate-950/50 p-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><button className="mt-3 inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Sparkles size={16} />Generate draft</button></form></section>

      <section className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-start justify-between gap-3"><div><h2 className="text-lg font-semibold text-white">Draft review</h2><p className="mt-1 text-sm text-slate-400">Edit the draft before scheduling or sending it to the Action Center.</p></div>{draft && <span className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">{type}</span>}</div>{draft ? <><textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={17} className="mt-5 w-full resize-y border border-slate-700 bg-slate-950/50 p-4 font-mono text-sm leading-6 text-slate-200 outline-none focus:border-cyan-400" /><div className="mt-4 flex flex-col gap-3 border-t border-slate-800 pt-4 sm:flex-row"><input type="date" value={scheduleDate} onChange={(event) => setScheduleDate(event.target.value)} className="border border-slate-700 bg-slate-950/50 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400" /><button type="button" disabled={!scheduleDate} onClick={scheduleDraft} className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50"><CalendarDays size={16} />Add to calendar</button><button type="button" className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300"><Send size={16} />Send to review</button></div></> : <div className="mt-5 flex min-h-80 items-center justify-center border border-dashed border-slate-700 bg-slate-950/30 p-8 text-center text-sm leading-6 text-slate-500">Choose a format and topic to generate a draft. Your content will be based on the business opportunities and active channels in this workspace.</div>}</section></div>

    <section className="mt-8 border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><CalendarDays size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Content calendar</h2><p className="mt-1 text-sm text-slate-400">Scheduled drafts remain local to this demo workspace until publishing integrations are connected.</p></div></div>{calendar.length ? <div className="mt-5 grid gap-3 md:grid-cols-2 lg:grid-cols-3">{calendar.map((item) => <article key={item.id} className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">{item.date}</p><p className="mt-2 text-sm font-semibold text-white">{item.title}</p><p className="mt-2 text-xs text-slate-400">{item.type}</p></article>)}</div> : <p className="mt-5 border border-dashed border-slate-700 p-5 text-sm text-slate-500">Your scheduled content will appear here. Generate a draft, choose a date, and add it to the calendar.</p>}</section>
  </div>;
}