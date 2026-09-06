"use client";

import { FormEvent, useState } from "react";
import { Bot, SendHorizonal } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

export function MarketingCoach({ activeChannels }: { activeChannels: string[] }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [nextStep, setNextStep] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState("");

  async function askCoach(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsAsking(true);
    const response = await fetch("/api/ai-coach", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ question, activeChannels }),
    });
    const result = await response.json() as { answer?: string; nextStep?: string; error?: string };
    setIsAsking(false);
    if (!response.ok) { setError(result.error ?? "The coach could not answer right now."); return; }
    setAnswer(result.answer ?? "");
    setNextStep(result.nextStep ?? "");
  }

  return <section className="mb-8 border border-slate-700 bg-slate-900 p-5"><div className="flex items-start gap-3"><div className="flex size-9 shrink-0 items-center justify-center bg-cyan-400/10 text-cyan-300"><Bot size={19} /></div><div><h2 className="font-semibold text-white">AI Marketing Coach</h2><p className="mt-1 text-sm text-slate-400">Ask about your next best growth move. Advice is grounded in the signals currently available in your workspace.</p></div></div><form onSubmit={askCoach} className="mt-4 flex flex-col gap-3 sm:flex-row"><input value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="What should I focus on this week?" required className="min-w-0 flex-1 border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><button disabled={isAsking} className="inline-flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"><SendHorizonal size={16} />{isAsking ? "Thinking..." : "Ask coach"}</button></form>{error && <p role="alert" className="mt-3 text-sm text-red-300">{error}</p>}{answer && <div className="mt-4 border-l-2 border-cyan-400 bg-slate-950/40 p-4"><p className="text-sm leading-6 text-slate-200">{answer}</p><p className="mt-3 text-xs font-semibold uppercase tracking-[0.1em] text-cyan-300">Next step</p><p className="mt-1 text-sm text-slate-300">{nextStep}</p></div>}</section>;
}