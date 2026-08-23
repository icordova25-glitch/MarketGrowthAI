"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Eye, Search, ShieldCheck, UsersRound } from "lucide-react";

type Customer = {
  id: number;
  name: string;
  business: string;
  email: string;
  plan: "Starter" | "Growth" | "Pro" | "Agency";
  status: "Active" | "Trialing" | "Past due";
  mrr: number;
  lastActive: string;
  growthScore: number;
  websiteScore: number;
  seoScore: number;
  socialScore: number;
  googleScore: number;
  connections: { name: string; connected: boolean }[];
  usage: { aiRequests: number; scan: number; content: number; reports: number };
};

const customers: Customer[] = [
  { id: 1, name: "Ava Brooks", business: "ABC Plumbing", email: "ava@abcplumbing.example", plan: "Growth", status: "Active", mrr: 79, lastActive: "Today", growthScore: 74, websiteScore: 68, seoScore: 72, socialScore: 76, googleScore: 80, connections: [{ name: "Website", connected: true }, { name: "Google Search Console", connected: true }, { name: "Google Business Profile", connected: true }, { name: "Instagram", connected: true }, { name: "Facebook", connected: false }], usage: { aiRequests: 84, scan: 14, content: 31, reports: 4 } },
  { id: 2, name: "Theo Price", business: "Oceans & Fitness", email: "theo@oceansfitness.example", plan: "Pro", status: "Active", mrr: 149, lastActive: "Yesterday", growthScore: 81, websiteScore: 78, seoScore: 80, socialScore: 85, googleScore: 77, connections: [{ name: "Website", connected: true }, { name: "Google Analytics", connected: true }, { name: "Instagram", connected: true }, { name: "TikTok", connected: true }], usage: { aiRequests: 236, scan: 41, content: 114, reports: 8 } },
  { id: 3, name: "Jordan Stone", business: "Smith Dental", email: "jordan@smithdental.example", plan: "Starter", status: "Active", mrr: 29, lastActive: "14 days ago", growthScore: 61, websiteScore: 63, seoScore: 58, socialScore: 0, googleScore: 71, connections: [{ name: "Website", connected: true }, { name: "Google Business Profile", connected: true }, { name: "Instagram", connected: false }], usage: { aiRequests: 18, scan: 4, content: 7, reports: 1 } },
  { id: 4, name: "Zoe Reed", business: "XYZ Roofing", email: "zoe@xyzroofing.example", plan: "Growth", status: "Past due", mrr: 79, lastActive: "2 days ago", growthScore: 67, websiteScore: 70, seoScore: 65, socialScore: 59, googleScore: 74, connections: [{ name: "Website", connected: true }, { name: "Google Search Console", connected: false }, { name: "Facebook", connected: true }], usage: { aiRequests: 43, scan: 9, content: 12, reports: 2 } },
];

const planColor = { Starter: "text-slate-300", Growth: "text-cyan-200", Pro: "text-violet-200", Agency: "text-amber-200" };
const statusColor = { Active: "text-emerald-300", Trialing: "text-cyan-200", "Past due": "text-red-300" };

export default function CustomersAdminPage() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);
  const [auditNotice, setAuditNotice] = useState("");
  const visibleCustomers = useMemo(() => customers.filter((customer) => `${customer.name} ${customer.business} ${customer.email} ${customer.plan} ${customer.status}`.toLowerCase().includes(query.toLowerCase())), [query]);

  function previewCustomer(customer: Customer) {
    setAuditNotice(`Impersonation preview recorded for ${customer.business}. No customer session was created.`);
  }

  if (selected) return <CustomerProfile customer={selected} onBack={() => setSelected(null)} onPreview={previewCustomer} auditNotice={auditNotice} />;

  return <div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-3 text-cyan-300"><UsersRound size={21} /><span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span></div><h1 className="mt-3 text-3xl font-bold text-white">Customer management</h1><p className="mt-2 text-sm text-slate-400">Review customer health, plan status, product usage, and connection readiness.</p></div><p className="text-sm text-slate-500">{customers.length} customers in this demo view</p></div>
    <section className="border border-slate-700 bg-slate-900 p-5"><div className="relative max-w-lg"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search customer, business, plan, or status" className="w-full border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase tracking-[0.08em] text-slate-500"><tr><th className="pb-3 font-medium">Customer</th><th className="pb-3 font-medium">Plan</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">MRR</th><th className="pb-3 font-medium">Last active</th><th className="pb-3 font-medium"></th></tr></thead><tbody>{visibleCustomers.map((customer) => <tr key={customer.id} className="border-b border-slate-800 last:border-0"><td className="py-4"><p className="font-semibold text-white">{customer.business}</p><p className="mt-1 text-xs text-slate-500">{customer.name} · {customer.email}</p></td><td className={`py-4 font-medium ${planColor[customer.plan]}`}>{customer.plan}</td><td className={`py-4 font-medium ${statusColor[customer.status]}`}>{customer.status}</td><td className="py-4 text-slate-200">${customer.mrr}</td><td className="py-4 text-slate-400">{customer.lastActive}</td><td className="py-4 text-right"><button type="button" onClick={() => { setSelected(customer); setAuditNotice(""); }} className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-cyan-200">View profile <Eye size={14} /></button></td></tr>)}</tbody></table></div>{visibleCustomers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No customers match this search.</p>}</section></div>;
}

function CustomerProfile({ customer, onBack, onPreview, auditNotice }: { customer: Customer; onBack: () => void; onPreview: (customer: Customer) => void; auditNotice: string }) {
  const scores = [["Growth Score", customer.growthScore], ["Website", customer.websiteScore], ["SEO", customer.seoScore], ["Social", customer.socialScore], ["Google", customer.googleScore]];
  return <div className="mx-auto max-w-7xl"><button type="button" onClick={onBack} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-cyan-300 hover:text-cyan-200"><ArrowLeft size={16} />Back to customers</button><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-cyan-300">Customer profile</p><h1 className="mt-2 text-3xl font-bold text-white">{customer.business}</h1><p className="mt-2 text-sm text-slate-400">{customer.name} · {customer.email}</p></div><button type="button" onClick={() => onPreview(customer)} className="inline-flex items-center justify-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950"><Eye size={16} />Impersonate / view customer</button></div>{auditNotice && <p className="mt-5 border-l-2 border-amber-300 bg-amber-300/5 p-3 text-sm text-amber-100">{auditNotice}</p>}
    <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[["Plan", customer.plan], ["Status", customer.status], ["MRR", `$${customer.mrr}`], ["Last active", customer.lastActive]].map(([label, value]) => <article key={label} className="border border-slate-700 bg-slate-900 p-4"><p className="text-xs uppercase tracking-[0.1em] text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold text-white">{value}</p></article>)}</section>
    <section className="mt-8 grid gap-6 xl:grid-cols-[0.9fr_1.1fr]"><div className="border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Business Growth Score</h2><div className="mt-5 grid grid-cols-2 gap-3">{scores.map(([label, score]) => <div key={label} className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-cyan-200">{score}</p></div>)}</div></div><div className="border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Connected accounts</h2><p className="mt-1 text-sm text-slate-400">Data sources available to this customer workspace.</p><div className="mt-5 space-y-3">{customer.connections.map((connection) => <div key={connection.name} className="flex justify-between border-b border-slate-800 pb-3 last:border-0 last:pb-0"><span className="text-sm text-slate-200">{connection.name}</span><span className={`inline-flex items-center gap-1 text-xs font-semibold ${connection.connected ? "text-emerald-300" : "text-slate-500"}`}>{connection.connected && <CheckCircle2 size={14} />}{connection.connected ? "Connected" : "Not connected"}</span></div>)}</div></div></section>
    <section className="mt-8 border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Usage this billing period</h2><p className="mt-1 text-sm text-slate-400">Operational usage collected for plan and support review.</p><div className="mt-5 grid gap-3 md:grid-cols-4">{[["AI requests", customer.usage.aiRequests], ["SEO audits", customer.usage.scan], ["Content generated", customer.usage.content], ["Reports", customer.usage.reports]].map(([label, value]) => <div key={label} className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-2 text-2xl font-bold text-white">{value}</p></div>)}</div></section>
    <section className="mt-8 flex items-start gap-3 border border-cyan-400/20 bg-cyan-400/5 p-4"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-300" /><div><p className="text-sm font-semibold text-white">Controlled impersonation</p><p className="mt-1 text-sm leading-6 text-slate-400">Production impersonation should be initiated by a server-side owner action, record actor, customer, timestamp, and reason in an audit log, and show a persistent banner throughout the temporary session. This demo records a local preview event only.</p></div></section></div>;
}