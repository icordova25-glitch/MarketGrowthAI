"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { KeyRound, LoaderCircle, ShieldCheck, UserPlus, UsersRound, XCircle } from "lucide-react";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";

type AdminRole = "Owner" | "Platform admin" | "Support" | "Analyst";
type AdminStatus = "Active" | "Invited" | "Revoked";

type AdminUser = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: AdminRole;
  status: AdminStatus;
  lastActive: string;
};

type AuditEvent = {
  id: string;
  action: string;
  reason: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

const roleDetails: Record<AdminRole, string> = {
  Owner: "Full platform control, billing visibility, role management, and audit access.",
  "Platform admin": "Customer operations, reports, optimization, and integration management.",
  Support: "Customer lookup and support visibility without billing or platform-settings changes.",
  Analyst: "Read-only reporting, usage, and product-adoption visibility.",
};

const roleToApiValue: Record<Exclude<AdminRole, "Owner">, string> = {
  "Platform admin": "platform_admin",
  Support: "support",
  Analyst: "analyst",
};

function formatRelativeDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return date.toLocaleString();
}

function mapActionLabel(value: string): string {
  if (value === "admin_invited") return "Admin invited";
  if (value === "admin_role_changed") return "Admin role changed";
  if (value === "admin_revoked") return "Admin access revoked";
  if (value === "admin_status_changed") return "Admin status updated";
  return value;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<AdminRole, "Owner">>("Support");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeUsers = useMemo(() => users.filter((user) => user.status !== "Revoked"), [users]);

  async function loadAdminData() {
    setError("");
    const response = await fetch("/api/admin/memberships", {
      method: "GET",
      headers: await createAuthedJsonHeaders(),
    });

    const result = await response.json().catch(() => ({ error: "Unable to load admin memberships." })) as {
      users?: AdminUser[];
      auditEvents?: AuditEvent[];
      error?: string;
    };

    if (!response.ok) {
      setError(result.error ?? "Unable to load admin memberships.");
      return;
    }

    setUsers(result.users ?? []);
    setAuditEvents(result.auditEvents ?? []);
  }

  useEffect(() => {
    let isActive = true;

    void (async () => {
      await loadAdminData();
      if (isActive) setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  async function inviteUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/memberships", {
      method: "POST",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ email: email.trim().toLowerCase(), role: roleToApiValue[role], reason: "Owner invited admin user" }),
    });

    const result = await response.json().catch(() => ({ error: "Unable to invite admin user." })) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to invite admin user.");
      return;
    }

    setMessage("Invitation prepared. The account now appears with invited status.");
    setEmail("");
    await loadAdminData();
  }

  async function updateRole(membershipId: string, nextRole: Exclude<AdminRole, "Owner">) {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/memberships", {
      method: "PATCH",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ membershipId, role: roleToApiValue[nextRole], reason: "Owner changed admin role" }),
    });

    const result = await response.json().catch(() => ({ error: "Unable to update role." })) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to update role.");
      return;
    }

    setMessage("Role updated.");
    await loadAdminData();
  }

  async function revokeUser(membershipId: string) {
    setError("");
    setMessage("");
    setIsSubmitting(true);

    const response = await fetch("/api/admin/memberships", {
      method: "PATCH",
      headers: await createAuthedJsonHeaders(),
      body: JSON.stringify({ membershipId, status: "revoked", reason: "Owner revoked admin access" }),
    });

    const result = await response.json().catch(() => ({ error: "Unable to revoke access." })) as { error?: string };
    setIsSubmitting(false);

    if (!response.ok) {
      setError(result.error ?? "Unable to revoke access.");
      return;
    }

    setMessage("Admin access revoked.");
    await loadAdminData();
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-3 text-cyan-300">
            <UsersRound size={21} />
            <span className="text-xs font-semibold uppercase tracking-[0.14em]">Platform settings</span>
          </div>
          <h1 className="mt-3 text-3xl font-bold text-white">Admin users and permissions</h1>
          <p className="mt-2 text-sm text-slate-400">Grant the narrowest access needed and keep an audit trail of role and access changes.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-semibold text-cyan-100">
          <ShieldCheck size={17} />
          Owner-managed access
        </div>
      </div>

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {message && <p className="mb-4 border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-100">{message}</p>}

      <section className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <UserPlus size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Invite an admin user</h2>
              <p className="mt-1 text-sm text-slate-400">Invitation writes to persistent membership and audit tables.</p>
            </div>
          </div>
          <form onSubmit={inviteUser} className="mt-5 space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Work email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                placeholder="operator@company.com"
                className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-200">Role</span>
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as Exclude<AdminRole, "Owner">)}
                className="mt-2 w-full border border-slate-700 bg-slate-950/50 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400"
              >
                {(Object.keys(roleToApiValue) as Exclude<AdminRole, "Owner">[]).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <p className="mt-2 text-xs leading-5 text-slate-500">{roleDetails[role]}</p>
            </label>
            <button
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300 disabled:opacity-60"
            >
              <UserPlus size={16} />
              {isSubmitting ? "Saving..." : "Prepare invitation"}
            </button>
          </form>
        </div>

        <div className="border border-slate-700 bg-slate-900 p-5">
          <div className="flex items-center gap-3">
            <KeyRound size={20} className="text-cyan-300" />
            <div>
              <h2 className="text-lg font-semibold text-white">Permission model</h2>
              <p className="mt-1 text-sm text-slate-400">Role assignment is controlled from server-validated owner actions.</p>
            </div>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {(Object.entries(roleDetails) as [AdminRole, string][]).map(([name, detail]) => (
              <article key={name} className="border border-slate-700 bg-slate-950/40 p-4">
                <p className="text-sm font-semibold text-white">{name}</p>
                <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-8 border border-slate-700 bg-slate-900 p-5">
        <h2 className="text-lg font-semibold text-white">Platform administrators</h2>
        <p className="mt-1 text-sm text-slate-400">Role changes and access revocations are persistent and audited.</p>
        {isLoading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-300">
            <LoaderCircle size={16} className="animate-spin" />
            Loading admin memberships...
          </div>
        ) : (
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[740px] text-left text-sm">
              <thead className="border-b border-slate-700 text-xs uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="pb-3 font-medium">Admin user</th>
                  <th className="pb-3 font-medium">Role</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Last updated</th>
                  <th className="pb-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-800 last:border-0">
                    <td className="py-4">
                      <p className="font-semibold text-white">{user.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{user.email || "Email unavailable"}</p>
                    </td>
                    <td className="py-4">
                      {user.role === "Owner" ? (
                        <span className="font-medium text-cyan-200">Owner</span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={isSubmitting || user.status === "Revoked"}
                          onChange={(event) => updateRole(user.id, event.target.value as Exclude<AdminRole, "Owner">)}
                          className="border border-slate-700 bg-slate-950/50 px-2 py-1.5 text-sm text-white outline-none focus:border-cyan-400"
                        >
                          {(Object.keys(roleToApiValue) as Exclude<AdminRole, "Owner">[]).map((item) => (
                            <option key={item}>{item}</option>
                          ))}
                        </select>
                      )}
                    </td>
                    <td
                      className={`py-4 font-medium ${
                        user.status === "Active" ? "text-emerald-300" : user.status === "Invited" ? "text-cyan-200" : "text-red-300"
                      }`}
                    >
                      {user.status}
                    </td>
                    <td className="py-4 text-slate-400">{formatRelativeDate(user.lastActive)}</td>
                    <td className="py-4 text-right">
                      {user.role !== "Owner" && user.status !== "Revoked" && (
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => revokeUser(user.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-60"
                        >
                          <XCircle size={14} />
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-8 border border-cyan-400/20 bg-cyan-400/5 p-5">
        <div className="flex items-start gap-3">
          <ShieldCheck size={20} className="mt-0.5 shrink-0 text-cyan-300" />
          <div>
            <h2 className="text-lg font-semibold text-white">Audit events</h2>
            <p className="mt-1 text-sm text-slate-400">Persistent server-side admin events for invitation, role updates, and revocations.</p>
            <div className="mt-4 space-y-2">
              {auditEvents.slice(0, 8).map((event) => (
                <p key={event.id} className="border-l-2 border-cyan-400 bg-slate-950/40 p-3 text-sm text-slate-300">
                  {mapActionLabel(event.action)} · {event.reason ?? "No reason provided"} · {formatRelativeDate(event.created_at)}
                </p>
              ))}
              {!auditEvents.length && <p className="text-sm text-slate-400">No audit events recorded yet.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
