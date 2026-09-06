"use client";

import { useEffect, useState } from "react";
import { Eye, RefreshCw, Search, ShieldCheck, UsersRound } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type BillingState = {
  business: { id: string; name: string };
  subscription: { planName: string; status: string; currentPeriodEnd: string | null };
  team: { activeSeats: number; members: Array<{ id: string; email: string; role: string; status: string }> };
  period: { start: string; end: string };
};

type SystemHealthState = {
  services: Array<{ name: string; status: string; detail: string; healthy: boolean }>;
  database: { unresolvedIssues: number; failedSubscriptions: number; attentionConnections: number };
  errors: { last24Hours: number; failedScans: number; webhookExceptions: number };
  refreshTimestamp: string;
};

export default function CustomersAdminPage() {
  const [billing, setBilling] = useState<BillingState | null>(null);
  const [health, setHealth] = useState<SystemHealthState | null>(null);
  const [query, setQuery] = useState("");
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdatedLabel, setLastUpdatedLabel] = useState("Not checked yet");
  const [auditNotice, setAuditNotice] = useState("");

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const headers = await createAuthedJsonHeaders();
      const [billingResponse, healthResponse] = await Promise.all([
        fetch("/api/billing/state", { method: "GET", headers }),
        fetch("/api/admin/system-health", { method: "GET", headers }),
      ]);

      const billingResult = await billingResponse.json().catch(() => ({ error: "Unable to load billing state." })) as BillingState & { error?: string };
      const healthResult = await healthResponse.json().catch(() => ({ error: "Unable to load system health." })) as SystemHealthState & { error?: string };

      if (!isActive) return;

      if (!billingResponse.ok) {
        setError(billingResult.error ?? "Unable to load billing state.");
        setBilling(null);
        setHealth(null);
        setIsLoading(false);
        return;
      }

      if (!healthResponse.ok) {
        setError(healthResult.error ?? "Unable to load system health.");
        setBilling(null);
        setHealth(null);
        setIsLoading(false);
        return;
      }

      setBilling(billingResult);
      setHealth(healthResult);
      setLastUpdatedLabel(new Date(healthResult.refreshTimestamp).toLocaleString());
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const members = billing?.team.members ?? [];
  const visibleMembers = members.filter((member) => `${member.email} ${member.role} ${member.status}`.toLowerCase().includes(query.toLowerCase()));
  const selectedMember = members.find((member) => member.id === selectedMemberId) ?? null;

  function previewMember(memberId: string) {
    setSelectedMemberId(memberId);
    setAuditNotice("Controlled impersonation should be initiated by a server-side owner action and recorded in an audit log.");
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <UsersRound size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform operations</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Customer management</h1>
          <p className="mt-2 text-sm text-slate-400">Live workspace membership, access, and support signals for the owner account.</p>
        </div>
        <button type="button" onClick={() => window.location.reload()} className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      <p className="mb-6 text-xs uppercase tracking-[0.12em] text-slate-500">Last updated: {lastUpdatedLabel}</p>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Business" value={billing?.business.name ?? "Unavailable"} detail="Live owner workspace" />
        <InfoCard label="Active members" value={`${members.length}`} detail={`${billing?.team.activeSeats ?? 0} seats in use`} />
        <InfoCard label="Unresolved issues" value={`${health?.database.unresolvedIssues ?? 0}`} detail="Owner follow-up items" />
        <InfoCard label="Failed scans" value={`${health?.errors.failedScans ?? 0}`} detail="Support issues recorded this window" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <Search size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Workspace members</h2>
              <p className="mt-1 text-sm text-slate-400">Search the live team list and review access state.</p>
            </div>
          </div>
          <div className="mt-5 relative max-w-lg">
            <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search email, role, or status" className="w-full border border-slate-700 bg-slate-950/50 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" />
          </div>
          <div className="mt-5 space-y-2">
            {visibleMembers.map((member) => (
              <button key={member.id} type="button" onClick={() => { setSelectedMemberId(member.id); setAuditNotice(""); }} className={`flex w-full items-center justify-between border px-3 py-3 text-left text-sm ${selectedMemberId === member.id ? "border-cyan-400 bg-cyan-400/10" : "border-slate-700 bg-slate-950/40"}`}>
                <span className="text-slate-200">{member.email}</span>
                <span className="text-slate-500">{member.role} · {member.status}</span>
              </button>
            ))}
            {visibleMembers.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No team members match this search.</p>}
          </div>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Access review</h2>
              <p className="mt-1 text-sm text-slate-400">Controlled customer access and audit expectations.</p>
            </div>
          </div>

          {selectedMember ? (
            <div className="mt-5 space-y-4">
              <div className="border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-xs uppercase tracking-[0.1em] text-slate-500">Selected member</p>
                <p className="mt-2 text-lg font-semibold text-white">{selectedMember.email}</p>
                <p className="mt-1 text-sm text-slate-400">Role: {selectedMember.role} · Status: {selectedMember.status}</p>
              </div>
              {auditNotice && <p className="border-l-2 border-amber-300 bg-amber-300/5 p-3 text-sm text-amber-100">{auditNotice}</p>}
              <button type="button" onClick={() => previewMember(selectedMember.id)} className="inline-flex items-center gap-2 border border-cyan-400 px-4 py-2.5 text-sm font-bold text-cyan-200 hover:bg-cyan-400 hover:text-slate-950">
                <Eye size={16} />
                Record preview event
              </button>
            </div>
          ) : (
            <p className="mt-5 text-sm leading-6 text-slate-400">Select a team member to review their live access state. Production impersonation should remain server-side, fully audited, and time-limited.</p>
          )}

          <div className="mt-6 border-t border-slate-800 pt-5">
            <h3 className="text-sm font-semibold text-white">Operational signals</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <SignalCard title="Stripe follow-up" value={health?.database.failedSubscriptions ?? 0} detail="Subscriptions needing billing attention" />
              <SignalCard title="Webhook exceptions" value={health?.errors.webhookExceptions ?? 0} detail="Sync issues seen this window" />
              <SignalCard title="Connections needing attention" value={health?.database.attentionConnections ?? 0} detail="Customer integrations to review" />
              <SignalCard title="Health window" value={health?.errors.last24Hours ?? 0} detail="Open issues in the last 24 hours" />
            </div>
          </div>
          {isLoading && <p className="mt-4 text-xs uppercase tracking-[0.1em] text-slate-500">Loading customer signals...</p>}
        </div>
      </section>
    </div>
  );
}

function InfoCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-900 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
      <p className="mt-2 text-xs leading-5 text-slate-500">{detail}</p>
    </article>
  );
}

function SignalCard({ title, value, detail }: { title: string; value: number | undefined; detail: string }) {
  return (
    <article className="border border-slate-700 bg-slate-950/40 p-4">
      <p className="text-xs uppercase tracking-[0.1em] text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value ?? 0}</p>
      <p className="mt-2 text-xs leading-5 text-slate-400">{detail}</p>
    </article>
  );
}
