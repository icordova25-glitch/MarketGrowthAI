import { NextResponse } from "next/server";
import { isPlatformOwner, requireAuthenticatedRequest } from "@/lib/server-auth";
import { getBillingPlan } from "@/lib/billing";

type AdminRole = "owner" | "platform_admin" | "support" | "analyst";
type AdminStatus = "invited" | "active" | "revoked";

function isAdminRole(value: string): value is AdminRole {
  return ["owner", "platform_admin", "support", "analyst"].includes(value);
}

function isAdminStatus(value: string): value is AdminStatus {
  return ["invited", "active", "revoked"].includes(value);
}

function roleLabel(role: AdminRole): string {
  if (role === "owner") return "Owner";
  if (role === "platform_admin") return "Platform admin";
  if (role === "support") return "Support";
  return "Analyst";
}

function statusLabel(status: AdminStatus): string {
  if (status === "active") return "Active";
  if (status === "invited") return "Invited";
  return "Revoked";
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isPlatformOwner(auth.user)) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });

  const { supabase } = auth;
  const { data: memberships, error: membershipsError } = await supabase
    .from("admin_memberships")
    .select("id,user_id,role,status,updated_at,created_at,users:user_id(first_name,last_name,email)")
    .order("created_at", { ascending: true });

  if (membershipsError) return NextResponse.json({ error: membershipsError.message }, { status: 500 });

  const { data: audits, error: auditsError } = await supabase
    .from("admin_audit_events")
    .select("id,action,reason,created_at,metadata")
    .order("created_at", { ascending: false })
    .limit(20);

  if (auditsError) return NextResponse.json({ error: auditsError.message }, { status: 500 });

  const users = (memberships ?? []).map((row) => {
    const profile = Array.isArray(row.users) ? row.users[0] : row.users;
    const firstName = profile?.first_name ?? "";
    const lastName = profile?.last_name ?? "";
    const fallback = profile?.email?.split("@")[0] ?? "Unknown";
    const name = `${firstName} ${lastName}`.trim() || fallback;

    return {
      id: row.id,
      userId: row.user_id,
      name,
      email: profile?.email ?? "",
      role: roleLabel(row.role as AdminRole),
      status: statusLabel(row.status as AdminStatus),
      lastActive: row.updated_at,
    };
  });

  return NextResponse.json({ users, auditEvents: audits ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isPlatformOwner(auth.user)) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });

  const payload = await request.json().catch(() => null) as { email?: string; role?: string; reason?: string } | null;
  const email = payload?.email?.trim().toLowerCase();
  const role = payload?.role?.trim();
  const reason = payload?.reason?.trim() || "Owner initiated invite";

  if (!email || !role || !isAdminRole(role) || role === "owner") {
    return NextResponse.json({ error: "Provide a valid email and a non-owner admin role." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "Complete onboarding before managing admin seats." }, { status: 404 });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", business.id)
    .maybeSingle();

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const plan = getBillingPlan(subscription?.plan ?? "starter");
  if (!plan) return NextResponse.json({ error: "Billing configuration is unavailable." }, { status: 500 });

  const { data: targetUser, error: targetUserError } = await supabase
    .from("users")
    .select("id,email")
    .eq("email", email)
    .maybeSingle();

  if (targetUserError) return NextResponse.json({ error: targetUserError.message }, { status: 500 });
  if (!targetUser) {
    return NextResponse.json({ error: "No account exists for that email yet. Ask them to sign up first." }, { status: 404 });
  }

  const { data: existingMembership, error: existingMembershipError } = await supabase
    .from("admin_memberships")
    .select("id,status")
    .eq("user_id", targetUser.id)
    .maybeSingle();

  if (existingMembershipError) return NextResponse.json({ error: existingMembershipError.message }, { status: 500 });

  const { count: seatCount, error: seatCountError } = await supabase
    .from("admin_memberships")
    .select("id", { count: "exact", head: true })
    .in("status", ["invited", "active"]);

  if (seatCountError) return NextResponse.json({ error: seatCountError.message }, { status: 500 });

  const currentSeatCount = 1 + (seatCount ?? 0);
  const seatWillIncrease = !existingMembership || existingMembership.status === "revoked";
  if (seatWillIncrease && currentSeatCount >= plan.limits.seats) {
    return NextResponse.json({ error: `Your current plan allows ${plan.limits.seats} team seat${plan.limits.seats === 1 ? "" : "s"}. Upgrade to invite another admin.` }, { status: 403 });
  }

  const { error: upsertError } = await supabase
    .from("admin_memberships")
    .upsert({ user_id: targetUser.id, role, status: "invited", invited_by: user.id }, { onConflict: "user_id" });

  if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 });

  const { error: auditError } = await supabase
    .from("admin_audit_events")
    .insert({
      actor_id: user.id,
      target_user_id: targetUser.id,
      action: "admin_invited",
      reason,
      metadata: { role },
    });

  if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isPlatformOwner(auth.user)) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });

  const payload = await request.json().catch(() => null) as {
    membershipId?: string;
    role?: string;
    status?: string;
    reason?: string;
  } | null;

  const membershipId = payload?.membershipId?.trim();
  const reason = payload?.reason?.trim() || "Owner initiated admin change";
  if (!membershipId) return NextResponse.json({ error: "Membership id is required." }, { status: 400 });

  const updates: { role?: AdminRole; status?: AdminStatus } = {};
  if (payload?.role?.trim()) {
    if (!isAdminRole(payload.role.trim()) || payload.role.trim() === "owner") {
      return NextResponse.json({ error: "Invalid role update." }, { status: 400 });
    }
    updates.role = payload.role.trim() as AdminRole;
  }

  if (payload?.status?.trim()) {
    if (!isAdminStatus(payload.status.trim())) {
      return NextResponse.json({ error: "Invalid status update." }, { status: 400 });
    }
    updates.status = payload.status.trim() as AdminStatus;
  }

  if (!updates.role && !updates.status) {
    return NextResponse.json({ error: "No changes were submitted." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data: existing, error: existingError } = await supabase
    .from("admin_memberships")
    .select("id,user_id,role,status")
    .eq("id", membershipId)
    .single();

  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  if (existing.role === "owner") {
    return NextResponse.json({ error: "Owner membership cannot be changed from this endpoint." }, { status: 400 });
  }

  const { error: updateError } = await supabase
    .from("admin_memberships")
    .update(updates)
    .eq("id", membershipId);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  const action = updates.status === "revoked" ? "admin_revoked" : updates.role ? "admin_role_changed" : "admin_status_changed";

  const { error: auditError } = await supabase
    .from("admin_audit_events")
    .insert({
      actor_id: user.id,
      target_user_id: existing.user_id,
      action,
      reason,
      metadata: { before: existing, after: updates },
    });

  if (auditError) return NextResponse.json({ error: auditError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
