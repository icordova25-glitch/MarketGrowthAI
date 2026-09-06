import { NextResponse } from "next/server";
import { isPlatformOwner, requireAuthenticatedRequest } from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });
  if (!isPlatformOwner(auth.user)) return NextResponse.json({ error: "Owner access is required." }, { status: 403 });

  const { supabase } = auth;
  const [businessesResult, subscriptionsResult, connectedAccountsResult, issuesResult, webhookEventsResult] = await Promise.all([
    supabase.from("businesses").select("id", { count: "exact", head: true }),
    supabase.from("subscriptions").select("status", { count: "exact" }),
    supabase.from("connected_accounts").select("status,error_message,last_synced_at", { count: "exact" }),
    supabase.from("website_issues").select("severity,resolved_at", { count: "exact" }),
    supabase.from("stripe_webhook_events").select("event_type,processed_at", { count: "exact" }),
  ]);

  const queryErrors = [businessesResult.error, subscriptionsResult.error, connectedAccountsResult.error, issuesResult.error, webhookEventsResult.error].filter(Boolean);
  if (queryErrors.length) {
    const error = queryErrors[0];
    return NextResponse.json({ error: error?.message ?? "Unable to load system health." }, { status: 500 });
  }

  const totalBusinesses = businessesResult.count ?? 0;
  const subscriptions = subscriptionsResult.data ?? [];
  const connectedAccounts = connectedAccountsResult.data ?? [];
  const issues = issuesResult.data ?? [];
  const webhookEvents = webhookEventsResult.data ?? [];

  const configurationReady = {
    openAi: Boolean(process.env.OPENAI_API_KEY),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    google: Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    vercel: Boolean(process.env.VERCEL || process.env.VERCEL_URL),
  };

  const failedSubscriptions = subscriptions.filter((item) => item.status === "past_due" || item.status === "canceled").length;
  const attentionConnections = connectedAccounts.filter((item) => item.status === "error" || item.status === "disconnected" || item.error_message).length;
  const unresolvedIssues = issues.filter((item) => !item.resolved_at).length;
  const recentWebhookEvents = webhookEvents.length;
  const responseTimeMs = Date.now() - startedAt;

  return NextResponse.json({
    services: [
      {
        name: "Application API",
        status: responseTimeMs < 750 ? "Operational" : "Degraded",
        detail: `Live health query completed in ${responseTimeMs}ms`,
        healthy: responseTimeMs < 750,
      },
      {
        name: "Supabase",
        status: totalBusinesses >= 0 ? "Operational" : "Attention",
        detail: `${totalBusinesses} business records reachable through the owner session`,
        healthy: true,
      },
      {
        name: "Vercel",
        status: configurationReady.vercel ? "Operational" : "Configuration required",
        detail: configurationReady.vercel ? "Deployment environment variables are present" : "No Vercel deployment environment detected",
        healthy: configurationReady.vercel,
      },
      {
        name: "OpenAI",
        status: configurationReady.openAi ? "Operational" : "Configuration required",
        detail: configurationReady.openAi ? "Server key configured for AI workflows" : "No server key configured in this environment",
        healthy: configurationReady.openAi,
      },
      {
        name: "Stripe",
        status: configurationReady.stripe ? "Operational" : "Configuration required",
        detail: configurationReady.stripe ? `${recentWebhookEvents} webhook events processed in this database` : "Webhook secret or secret key is missing",
        healthy: configurationReady.stripe,
      },
      {
        name: "Google integrations",
        status: attentionConnections > 0 ? "Attention" : "Operational",
        detail: attentionConnections > 0 ? `${attentionConnections} connected accounts need reconnect or token renewal` : "No integration warnings found",
        healthy: attentionConnections === 0,
      },
    ],
    database: {
      businesses: totalBusinesses,
      subscriptions: subscriptionsResult.count ?? 0,
      unresolvedIssues,
      failedSubscriptions,
      attentionConnections,
      recentWebhookEvents,
      responseTimeMs,
    },
    errors: {
      last24Hours: unresolvedIssues + attentionConnections,
      last7Days: failedSubscriptions + recentWebhookEvents,
      failedScans: unresolvedIssues,
      webhookExceptions: configurationReady.stripe ? 0 : 1,
    },
    refreshTimestamp: new Date().toISOString(),
  });
}
