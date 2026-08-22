"use client";

import { FormEvent, useEffect, useState } from "react";
import { Building2, Check, CreditCard, ShieldCheck, UsersRound } from "lucide-react";
import { SectionHeader } from "@/components/ui";

type PlanId = "starter" | "growth" | "pro" | "agency";
type Member = { id: number; email: string; role: string };

const plans: { id: PlanId; name: string; price: number; description: string; features: string[]; limits: { websites: string; scans: string; content: string; seats: number } }[] = [
  { id: "starter", name: "Starter", price: 29, description: "For a single business building a clear baseline.", features: ["1 business workspace", "Website scanner and core insights", "20 AI content drafts per month", "Weekly growth report"], limits: { websites: "1", scans: "25", content: "20", seats: 1 } },
  { id: "growth", name: "Growth", price: 79, description: "For teams turning insights into consistent growth.", features: ["Everything in Starter", "Google and social intelligence", "100 AI content drafts per month", "Automation workflows"], limits: { websites: "3", scans: "150", content: "100", seats: 3 } },
  { id: "pro", name: "Pro", price: 149, description: "For high-volume growth operations.", features: ["Everything in Growth", "Competitive Intelligence", "500 AI content drafts per month", "Priority data refresh"], limits: { websites: "10", scans: "500", content: "500", seats: 8 } },
  { id: "agency", name: "Agency", price: 399, description: "For teams managing multiple client businesses.", features: ["Everything in Pro", "25 business workspaces", "Agency team roles", "Client-ready reporting"], limits: { websites: "25", scans: "2,000", content: "2,000", seats: 25 } },
];

const usageByPlan: Record<PlanId, { scans: number; content: number; websites: number }> = {
  starter: { scans: 9, content: 7, websites: 1 },
  growth: { scans: 42, content: 31, websites: 2 },
  pro: { scans: 176, content: 114, websites: 5 },
  agency: { scans: 344, content: 219, websites: 8 },
};

export default function BillingPage() {
  const [planId, setPlanId] = useState<PlanId>("growth");
  const [members, setMembers] = useState<Member[]>([]);
  const [memberEmail, setMemberEmail] = useState("");
  const [notice, setNotice] = useState("");
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const plan = plans.find((item) => item.id === planId) ?? plans[1];
  const usage = usageByPlan[planId];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedPlan = window.localStorage.getItem("marketgrowthai.plan") as PlanId | null;
      const storedMembers = window.localStorage.getItem("marketgrowthai.agency-members");
      if (storedPlan && plans.some((item) => item.id === storedPlan)) setPlanId(storedPlan);
      if (storedMembers) setMembers(JSON.parse(storedMembers) as Member[]);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function choosePlan(nextPlan: PlanId) {
    setNotice("");
    setIsCheckingOut(true);
    const response = await fetch("/api/stripe/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: nextPlan }) });
    const result = await response.json() as { url?: string; error?: string };
    setIsCheckingOut(false);
    if (response.ok && result.url) { window.location.assign(result.url); return; }
    setPlanId(nextPlan);
    window.localStorage.setItem("marketgrowthai.plan", nextPlan);
    setNotice("Demo mode: plan selection was saved locally. Configure Stripe Price IDs to start a real checkout.");
  }

  function addMember(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!memberEmail.trim() || members.length >= plan.limits.seats - 1) return;
    const next = [...members, { id: Date.now(), email: memberEmail.trim(), role: "Member" }];
    setMembers(next);
    window.localStorage.setItem("marketgrowthai.agency-members", JSON.stringify(next));
    setMemberEmail("");
  }

  return <div className="mx-auto max-w-6xl pb-10"><SectionHeader title="Billing & Plans" subtitle="Choose the MarketGrowthAI plan that matches your growth operation and manage the capacity behind it." icon="✦" />
    <section className="mb-8 border border-cyan-500/30 bg-[#102a43] p-6"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-start"><div><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><CreditCard size={16} />Current subscription</div><h2 className="mt-2 text-2xl font-bold text-white">{plan.name} plan <span className="text-base font-medium text-slate-400">· ${plan.price}/month</span></h2><p className="mt-2 text-sm leading-6 text-slate-300">{plan.description}</p></div><div className="flex items-center gap-2 border border-cyan-300/30 bg-cyan-400/10 px-3 py-2 text-sm font-semibold text-cyan-100"><ShieldCheck size={17} />Secure checkout via Stripe</div></div>{notice && <p className="mt-5 border-l-2 border-amber-300 bg-amber-300/5 p-3 text-sm text-amber-100">{notice}</p>}</section>

    <section className="mb-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plans.map((item) => { const current = item.id === planId; return <article key={item.id} className={`border p-5 ${current ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-900"}`}><div className="flex items-center justify-between"><h2 className="text-lg font-semibold text-white">{item.name}</h2>{item.id === "growth" && <span className="text-xs font-semibold text-cyan-200">POPULAR</span>}</div><p className="mt-2 text-3xl font-bold text-white">${item.price}<span className="text-sm font-medium text-slate-400">/mo</span></p><p className="mt-3 min-h-10 text-sm leading-5 text-slate-400">{item.description}</p><ul className="mt-4 space-y-2">{item.features.map((feature) => <li key={feature} className="flex gap-2 text-xs leading-5 text-slate-300"><Check size={15} className="mt-0.5 shrink-0 text-cyan-300" />{feature}</li>)}</ul><button disabled={current || isCheckingOut} type="button" onClick={() => choosePlan(item.id)} className={`mt-5 w-full px-3 py-2.5 text-sm font-bold transition-colors ${current ? "border border-cyan-300/40 text-cyan-100" : "bg-cyan-400 text-slate-950 hover:bg-cyan-300"}`}>{current ? "Current plan" : isCheckingOut ? "Opening checkout..." : `Choose ${item.name}`}</button></article>; })}</section>

    <section className="grid gap-6 xl:grid-cols-[1fr_1fr]"><div className="border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Usage this month</h2><p className="mt-1 text-sm text-slate-400">Usage resets with your billing period. Limits reflect the active plan.</p><div className="mt-5 space-y-5"><UsageRow label="Website scans" used={usage.scans} limit={Number(plan.limits.scans.replace(",", ""))} /><UsageRow label="AI content drafts" used={usage.content} limit={Number(plan.limits.content.replace(",", ""))} /><UsageRow label="Business workspaces" used={usage.websites} limit={Number(plan.limits.websites)} /></div></div>
      <div className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><UsersRound size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Agency accounts</h2><p className="mt-1 text-sm text-slate-400">Invite teammates to work across client businesses. Agency provides the highest capacity.</p></div></div><div className="mt-5 border border-slate-700 bg-slate-950/40 p-4"><div className="flex items-center justify-between"><span className="text-sm font-medium text-white">Team seats</span><span className="text-sm text-cyan-200">{members.length + 1} / {plan.limits.seats}</span></div><p className="mt-2 text-xs leading-5 text-slate-500">Your owner account uses one seat. Switching to Agency increases workspace and team limits.</p></div><form onSubmit={addMember} className="mt-4 flex flex-col gap-3 sm:flex-row"><input type="email" value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} placeholder="teammate@company.com" required className="min-w-0 flex-1 border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /><button disabled={members.length >= plan.limits.seats - 1} className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950 disabled:opacity-50"><Building2 size={16} />Invite</button></form>{members.length ? <div className="mt-4 space-y-2">{members.map((member) => <div key={member.id} className="flex justify-between border border-slate-700 bg-slate-950/40 px-3 py-2 text-sm"><span className="text-slate-200">{member.email}</span><span className="text-slate-500">{member.role}</span></div>)}</div> : null}</div></section>
  </div>;
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number }) { const percentage = Math.min((used / limit) * 100, 100); return <div><div className="flex justify-between text-sm"><span className="text-slate-200">{label}</span><span className="text-slate-400">{used.toLocaleString()} / {limit.toLocaleString()}</span></div><div className="mt-2 h-2 bg-slate-800"><div className={`h-full ${percentage > 80 ? "bg-amber-400" : "bg-cyan-400"}`} style={{ width: `${percentage}%` }} /></div></div>; }