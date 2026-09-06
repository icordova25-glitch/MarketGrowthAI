import { NextResponse } from "next/server";
import { answerCoachQuestion } from "@/lib/business-analysis";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { assertWithinLimit, getBillingPlan, incrementMetricUsage } from "@/lib/billing";

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,website_url,industry,business_type,ideal_customers,products_and_services,service_area,differentiator,marketing_channels")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "Complete onboarding before using the AI coach." }, { status: 404 });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", business.id)
    .maybeSingle();

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const plan = getBillingPlan(subscription?.plan ?? "starter");
  if (!plan) return NextResponse.json({ error: "Billing configuration is unavailable." }, { status: 500 });

  try {
    await assertWithinLimit(supabase, business.id, "ai_requests", plan.limits.ai_requests);
  } catch (error) {
    const message = error instanceof Error ? error.message : "This plan does not allow more AI requests right now.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { question?: string; activeChannels?: string[] } | null;
  const question = body?.question?.trim();
  if (!question) return NextResponse.json({ error: "Ask a business-growth question to start the coaching session." }, { status: 400 });
  if (question.length > 800) return NextResponse.json({ error: "Keep your question under 800 characters." }, { status: 400 });

  const profile = {
    businessName: business.name,
    website: business.website_url,
    industry: business.industry,
    businessType: business.business_type,
    idealCustomers: business.ideal_customers,
    productsAndServices: business.products_and_services,
    serviceArea: business.service_area,
    differentiator: business.differentiator,
    marketingChannels: Array.isArray(business.marketing_channels) ? business.marketing_channels : [],
  };

  const result = answerCoachQuestion(question, profile, body?.activeChannels?.length ? body.activeChannels : profile.marketingChannels ?? []);
  await incrementMetricUsage(supabase, business.id, "ai_requests");
  return NextResponse.json(result);
}