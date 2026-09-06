import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { getBusinessAnalysis } from "@/lib/business-analysis";

export async function GET(request: Request) {
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
  if (!business) return NextResponse.json({ error: "Complete onboarding before viewing business analysis." }, { status: 404 });

  const { data: location } = await supabase
    .from("business_locations")
    .select("city,state")
    .eq("business_id", business.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const profile = {
    businessName: business.name,
    website: business.website_url,
    industry: business.industry,
    businessType: business.business_type,
    city: location?.city,
    state: location?.state,
    idealCustomers: business.ideal_customers,
    productsAndServices: business.products_and_services,
    serviceArea: business.service_area,
    differentiator: business.differentiator,
    marketingChannels: Array.isArray(business.marketing_channels) ? business.marketing_channels : [],
  };

  const analysis = getBusinessAnalysis(profile, profile.marketingChannels ?? []);

  return NextResponse.json({
    profile,
    analysis,
  });
}
