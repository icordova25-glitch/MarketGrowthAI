import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { getBillingPlan } from "@/lib/billing";

type OnboardingProfilePayload = {
  businessName: string;
  industry: string;
  businessType: string;
  city: string;
  state: string;
  website: string;
  idealCustomers: string;
  productsAndServices: string;
  serviceArea: string;
  differentiator: string;
  marketingChannels: string[];
};

function normalizePayload(body: unknown): OnboardingProfilePayload | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Partial<OnboardingProfilePayload>;
  if (!value.businessName || !value.industry || !value.businessType || !value.city || !value.state) return null;

  return {
    businessName: String(value.businessName).trim(),
    industry: String(value.industry).trim(),
    businessType: String(value.businessType).trim(),
    city: String(value.city).trim(),
    state: String(value.state).trim(),
    website: String(value.website ?? "").trim(),
    idealCustomers: String(value.idealCustomers ?? "").trim(),
    productsAndServices: String(value.productsAndServices ?? "").trim(),
    serviceArea: String(value.serviceArea ?? "").trim(),
    differentiator: String(value.differentiator ?? "").trim(),
    marketingChannels: Array.isArray(value.marketingChannels)
      ? value.marketingChannels.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
      : [],
  };
}

export async function GET(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { supabase, user } = auth;
  const { data: business, error } = await supabase
    .from("businesses")
    .select("id,name,industry,business_type,website_url,ideal_customers,products_and_services,service_area,differentiator,marketing_channels")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "No onboarding profile found." }, { status: 404 });

  const { data: location } = await supabase
    .from("business_locations")
    .select("id,city,state")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    businessName: business.name ?? "",
    industry: business.industry ?? "",
    businessType: business.business_type ?? "",
    city: location?.city ?? "",
    state: location?.state ?? "",
    website: business.website_url ?? "",
    idealCustomers: business.ideal_customers ?? "",
    productsAndServices: business.products_and_services ?? "",
    serviceArea: business.service_area ?? "",
    differentiator: business.differentiator ?? "",
    marketingChannels: Array.isArray(business.marketing_channels) ? business.marketing_channels : [],
  });
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const payload = normalizePayload(body);
  if (!payload) {
    return NextResponse.json({ error: "Complete business name, industry, business type, city, and state to continue." }, { status: 400 });
  }

  const { supabase, user } = auth;
  const { data: existingBusiness, error: existingBusinessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existingBusinessError) {
    return NextResponse.json({ error: existingBusinessError.message }, { status: 500 });
  }

  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", existingBusiness?.id ?? "00000000-0000-0000-0000-000000000000")
    .maybeSingle();

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const currentPlan = getBillingPlan(subscriptions?.plan ?? "starter");
  if (!currentPlan) return NextResponse.json({ error: "Billing configuration is unavailable." }, { status: 500 });

  const { count: businessCount, error: businessCountError } = await supabase
    .from("businesses")
    .select("id", { count: "exact", head: true })
    .eq("owner_id", user.id);

  if (businessCountError) return NextResponse.json({ error: businessCountError.message }, { status: 500 });

  if (!existingBusiness && (businessCount ?? 0) >= currentPlan.limits.workspaces) {
    return NextResponse.json({ error: `Your current plan allows ${currentPlan.limits.workspaces} business workspace${currentPlan.limits.workspaces === 1 ? "" : "s"}. Upgrade to add another workspace.` }, { status: 403 });
  }

  const businessRecord = {
    owner_id: user.id,
    name: payload.businessName,
    industry: payload.industry,
    business_type: payload.businessType,
    website_url: payload.website || null,
    ideal_customers: payload.idealCustomers || null,
    products_and_services: payload.productsAndServices || null,
    service_area: payload.serviceArea || null,
    differentiator: payload.differentiator || null,
    marketing_channels: payload.marketingChannels,
  };

  let businessId = existingBusiness?.id ?? null;
  if (businessId) {
    const { error } = await supabase
      .from("businesses")
      .update(businessRecord)
      .eq("id", businessId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { data, error } = await supabase
      .from("businesses")
      .insert(businessRecord)
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    businessId = data.id;
  }

  const { data: location, error: locationError } = await supabase
    .from("business_locations")
    .select("id")
    .eq("business_id", businessId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (locationError) return NextResponse.json({ error: locationError.message }, { status: 500 });

  if (location?.id) {
    const { error } = await supabase
      .from("business_locations")
      .update({ city: payload.city, state: payload.state })
      .eq("id", location.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    const { error } = await supabase
      .from("business_locations")
      .insert({ business_id: businessId, city: payload.city, state: payload.state });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, businessId });
}
