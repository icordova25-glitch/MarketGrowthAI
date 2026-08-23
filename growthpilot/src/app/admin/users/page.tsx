"use client";

import { FormEvent, useState } from "react";
import { KeyRound, ShieldCheck, UserPlus, UsersRound, XCircle } from "lucide-react";

type AdminRole = "Owner" | "Platform admin" | "Support" | "Analyst";
type AdminUser = { id: number; name: string; email: string; role: AdminRole; status: "Active" | "Invited" | "Revoked"; lastActive: string };

const roleDetails: Record<AdminRole, string> = {
  Owner: "Full platform control, billing visibility, role management, and audit access.",
  "Platform admin": "Customer operations, reports, optimization, and integration management.",
  Support: "Customer lookup and support visibility without billing or platform-settings changes.",
  Analyst: "Read-only reporting, usage, and product-adoption visibility.",
};

const initialUsers: AdminUser[] = [
  { id: 1, name: "Platform Owner", email: "owner@example.test", role: "Owner", status: "Active", lastActive: "Now" },
  { id: 2, name: "Morgan Lee", email: "ops@marketgrowthai.example", role: "Platform admin", status: "Active", lastActive: "Today" },
  { id: 3, name: "Casey Jordan", email: "support@marketgrowthai.example", role: "Support", status: "Invited", lastActive: "Invitation pending" },
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<AdminRole>("Support");
  const [auditEvents, setAuditEvents] = useState<string[]>(["Owner signed in to the admin portal", "Morgan Lee reviewed the subscription dashboard"]);

  function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || users.some((user) => user.email === trimmedEmail)) return;
    const nextUser: AdminUser = { id: Date.now(), name: trimmedEmail.split("@")[0], email: trimmedEmail, role, status: "Invited", lastActive: "Invitation pending" };
    setUsers((current) => [...current, nextUser]);
    setAuditEvents((current) => [`Owner invited ${trimmedEmail} as ${role}`, ...current]);
    setEmail("");
  }

  function updateRole(userId: number, nextRole: AdminRole) {
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, role: nextRole } : user));
    const user = users.find((item) => item.id === userId);
    if (user) setAuditEvents((current) => [`Owner changed ${user.email} to ${nextRole}`, ...current]);
  }

  function revokeUser(userId: number) {
    const user = users.find((item) => item.id === userId);
    if (!user || user.role === "Owner") return;
    setUsers((current) => current.map((item) => item.id === userId ? { ...item, status: "Revoked" } : item));
    setAuditEvents((current) => [`Owner revoked admin access for ${user.email}`, ...current]);
  }

  return <div className="mx-auto max-w-7xl"><div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="flex items-center gap-3 text-cyan-300"><UsersRound size={21} /><span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform settings</span></div><h1 className="mt-3 text-3xl font-bold text-white">Admin users & permissions</h1><p className="mt-2 text-sm text-slate-400">Give operators the narrowest platform access needed for their responsibility, then maintain an audit trail of changes.</p></div><div className="flex items-center gap-2 text-sm font-semibold text-cyan-100"><ShieldCheck size={17} />Owner-managed access</div></div>
    <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]"><div className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><UserPlus size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Invite an admin user</h2><p className="mt-1 text-sm text-slate-400">The invite records a pending role. Production delivery must be server-side and audited.</p></div></div><form onSubmit={inviteUser} className="mt-5 space-y-4"><label className="block"><span className="text-sm font-medium text-slate-200">Work email</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="operator@company.com" className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400" /></label><label className="block"><span className="text-sm font-medium text-slate-200">Role</span><select value={role} onChange={(event) => setRole(event.target.value as AdminRole)} className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400">{(Object.keys(roleDetails) as AdminRole[]).filter((item) => item !== "Owner").map((item) => <option key={item}>{item}</option>)}</select><p className="mt-2 text-xs leading-5 text-slate-500">{roleDetails[role]}</p></label><button className="inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300"><UserPlus size={16} />Prepare invitation</button></form></div>
      <div className="border border-slate-700 bg-slate-900 p-5"><div className="flex items-center gap-3"><KeyRound size={20} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Permission model</h2><p className="mt-1 text-sm text-slate-400">Roles define the admin capabilities granted after authentication is verified.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2">{(Object.entries(roleDetails) as [AdminRole, string][]).map(([name, detail]) => <article key={name} className="border border-slate-700 bg-slate-950/40 p-4"><p className="text-sm font-semibold text-white">{name}</p><p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p></article>)}</div></div></section>
    <section className="mt-8 border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Platform administrators</h2><p className="mt-1 text-sm text-slate-400">Role changes and access revocations are sensitive operations and belong in the audit log.</p><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[740px] text-left text-sm"><thead className="border-b border-slate-700 text-xs uppercase tracking-[0.08em] text-slate-500"><tr><th className="pb-3 font-medium">Admin user</th><th className="pb-3 font-medium">Role</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Last active</th><th className="pb-3 font-medium"></th></tr></thead><tbody>{users.map((user) => <tr key={user.id} className="border-b border-slate-800 last:border-0"><td className="py-4"><p className="font-semibold text-white">{user.name}</p><p className="mt-1 text-xs text-slate-500">{user.email}</p></td><td className="py-4">{user.role === "Owner" ? <span className="font-medium text-cyan-200">Owner</span> : <select value={user.role} disabled={user.status === "Revoked"} onChange={(event) => updateRole(user.id, event.target.value as AdminRole)} className="border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400">{(Object.keys(roleDetails) as AdminRole[]).filter((item) => item !== "Owner").map((item) => <option key={item}>{item}</option>)}</select>}</td><td className={`py-4 font-medium ${user.status === "Active" ? "text-emerald-300" : user.status === "Invited" ? "text-cyan-200" : "text-red-300"}`}>{user.status}</td><td className="py-4 text-slate-400">{user.lastActive}</td><td className="py-4 text-right">{user.role !== "Owner" && user.status !== "Revoked" && <button type="button" onClick={() => revokeUser(user.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-200"><XCircle size={14} />Revoke</button>}</td></tr>)}</tbody></table></div></section>
    <section className="mt-8 border border-cyan-400/20 bg-cyan-400/5 p-5"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Audit events</h2><p className="mt-1 text-sm text-slate-400">This demo displays in-memory events. Production should write append-only admin audit records with actor, target, action, before/after role, timestamp, IP context, and a required reason for high-risk access changes.</p><div className="mt-4 space-y-2">{auditEvents.slice(0, 5).map((event, index) => <p key={`${event}-${index}`} className="border-l-2 border-cyan-400 bg-slate-950/40 p-3 text-sm text-slate-300">{event}</p>)}</div></div></div></section>
  </div>;
}