import { NextResponse } from "next/server";
import { isPlatformOwner, requireAuthenticatedRequest } from "@/lib/server-auth";
import { billingMetricLabels, getBillingPlan, getCurrentMonthPeriod, getMetricUsage, summarizeUsage } from "@/lib/billing";

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,owner_id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "Complete onboarding before accessing billing." }, { status: 404 });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("provider,plan,status,current_period_end,external_customer_id,external_subscription_id")
    .eq("business_id", business.id)
    .maybeSingle();

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const plan = getBillingPlan(subscription?.plan ?? "starter") ?? getBillingPlan("starter");
  if (!plan) return NextResponse.json({ error: "Billing plan configuration is unavailable." }, { status: 500 });

  const period = getCurrentMonthPeriod();
  const [websiteScans, aiRequests, workspaces] = await Promise.all([
    getMetricUsage(supabase, business.id, "website_scans", period),
    getMetricUsage(supabase, business.id, "ai_requests", period),
    supabase.from("businesses").select("id", { count: "exact", head: true }).eq("owner_id", user.id),
  ]);

  if (workspaces.error) return NextResponse.json({ error: workspaces.error.message }, { status: 500 });

  const { data: memberships, error: membershipsError } = await supabase
    .from("admin_memberships")
    .select("id,user_id,role,status,updated_at,users:user_id(first_name,last_name,email)")
    .in("status", ["invited", "active"])
    .neq("role", "owner")
    .order("created_at", { ascending: true });

  if (membershipsError) return NextResponse.json({ error: membershipsError.message }, { status: 500 });

  const activeSeats = 1 + (memberships ?? []).length;
  const currentWorkspaceCount = workspaces.count ?? 0;

  return NextResponse.json({
    business: {
      id: business.id,
      name: business.name,
    },
    subscription: {
      plan: plan.id,
      planName: plan.name,
      status: subscription?.status ?? "inactive",
      currentPeriodEnd: subscription?.current_period_end ?? null,
      provider: subscription?.provider ?? "stripe",
      customerId: subscription?.external_customer_id ?? null,
      subscriptionId: subscription?.external_subscription_id ?? null,
    },
    limits: plan.limits,
    usage: [
      summarizeUsage("website_scans", websiteScans, plan.limits.website_scans),
      summarizeUsage("ai_requests", aiRequests, plan.limits.ai_requests),
      summarizeUsage("workspaces", currentWorkspaceCount, plan.limits.workspaces),
      summarizeUsage("seats", activeSeats, plan.limits.seats),
    ].map((item) => ({
      ...item,
      label: billingMetricLabels[item.metric],
    })),
    team: {
      activeSeats,
      members: memberships?.map((membership) => {
        const profile = Array.isArray(membership.users) ? membership.users[0] : membership.users;
        const name = `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() || profile?.email?.split("@")[0] || "Team member";
        return {
          id: membership.id,
          userId: membership.user_id,
          name,
          email: profile?.email ?? "",
          role: membership.role,
          status: membership.status,
          updatedAt: membership.updated_at,
        };
      }) ?? [],
    },
    period,
    isOwner: isPlatformOwner(user),
  });
}
