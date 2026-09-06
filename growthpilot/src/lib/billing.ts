import type { SupabaseClient } from "@supabase/supabase-js";

export type PlanId = "starter" | "growth" | "pro" | "agency";
export type BillingMetric = "website_scans" | "ai_requests" | "workspaces" | "seats";

export type BillingPlan = {
  id: PlanId;
  name: string;
  price: number;
  description: string;
  features: string[];
  limits: Record<BillingMetric, number>;
};

export type BillingUsageSummary = {
  metric: BillingMetric;
  label: string;
  used: number;
  limit: number;
  percentage: number;
};

export const billingPlans: BillingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 29,
    description: "For a single business building a clear baseline.",
    features: ["1 business workspace", "Website scanner and core insights", "20 AI actions per month", "Weekly growth report"],
    limits: { website_scans: 25, ai_requests: 20, workspaces: 1, seats: 1 },
  },
  {
    id: "growth",
    name: "Growth",
    price: 79,
    description: "For teams turning insights into consistent growth.",
    features: ["Everything in Starter", "Google and social intelligence", "100 AI actions per month", "Automation workflows"],
    limits: { website_scans: 150, ai_requests: 100, workspaces: 3, seats: 3 },
  },
  {
    id: "pro",
    name: "Pro",
    price: 149,
    description: "For high-volume growth operations.",
    features: ["Everything in Growth", "Competitive Intelligence", "500 AI actions per month", "Priority data refresh"],
    limits: { website_scans: 500, ai_requests: 500, workspaces: 10, seats: 8 },
  },
  {
    id: "agency",
    name: "Agency",
    price: 399,
    description: "For teams managing multiple client businesses.",
    features: ["Everything in Pro", "25 business workspaces", "Agency team roles", "Client-ready reporting"],
    limits: { website_scans: 2000, ai_requests: 2000, workspaces: 25, seats: 25 },
  },
];

export const billingMetricLabels: Record<BillingMetric, string> = {
  website_scans: "Website scans",
  ai_requests: "AI actions",
  workspaces: "Business workspaces",
  seats: "Team seats",
};

export function getBillingPlan(planId: PlanId | string | null | undefined): BillingPlan | null {
  if (!planId) return null;
  return billingPlans.find((plan) => plan.id === planId) ?? null;
}

export function getCurrentMonthPeriod(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) };
}

export function summarizeUsage(metric: BillingMetric, used: number, limit: number): BillingUsageSummary {
  return {
    metric,
    label: billingMetricLabels[metric],
    used,
    limit,
    percentage: limit > 0 ? Math.min((used / limit) * 100, 100) : 0,
  };
}

export async function getMetricUsage(
  supabase: SupabaseClient,
  businessId: string,
  metric: BillingMetric,
  period = getCurrentMonthPeriod()
): Promise<number> {
  const { data, error } = await supabase
    .from("usage")
    .select("quantity")
    .eq("business_id", businessId)
    .eq("metric", metric)
    .eq("period_start", period.start)
    .eq("period_end", period.end);

  if (error) throw new Error(error.message);
  return (data ?? []).reduce((total, item) => total + Number(item.quantity ?? 0), 0);
}

export async function incrementMetricUsage(
  supabase: SupabaseClient,
  businessId: string,
  metric: BillingMetric,
  amount = 1,
  period = getCurrentMonthPeriod()
): Promise<number> {
  const current = await getMetricUsage(supabase, businessId, metric, period);
  const next = current + amount;
  const { error } = await supabase.from("usage").upsert(
    {
      business_id: businessId,
      metric,
      quantity: next,
      period_start: period.start,
      period_end: period.end,
    },
    { onConflict: "business_id,metric,period_start,period_end" }
  );

  if (error) throw new Error(error.message);
  return next;
}

export async function assertWithinLimit(
  supabase: SupabaseClient,
  businessId: string,
  metric: BillingMetric,
  limit: number,
  amount = 1,
  period = getCurrentMonthPeriod()
): Promise<{ used: number; limit: number; next: number }> {
  const used = await getMetricUsage(supabase, businessId, metric, period);
  const next = used + amount;
  if (next > limit) {
    throw new Error(`This plan allows ${limit} ${billingMetricLabels[metric].toLowerCase()} per month. Upgrade to continue.`);
  }
  return { used, limit, next };
}
