import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/server-auth";

export const runtime = "nodejs";

const priceIds = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { supabase, user } = auth;
  const body = await request.json().catch(() => null) as { plan?: keyof typeof priceIds } | null;
  const plan = body?.plan;
  const priceId = plan ? priceIds[plan] : undefined;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!plan || !priceId || !secretKey) {
    return NextResponse.json({ error: "Stripe is not configured for this environment." }, { status: 503 });
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) {
    return NextResponse.json({ error: "Complete onboarding before choosing a subscription plan." }, { status: 409 });
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("external_customer_id")
    .eq("business_id", business.id)
    .maybeSingle();

  let customerId = subscription?.external_customer_id ?? null;
  if (!customerId) {
    const customerForm = new URLSearchParams({
      email: user.email ?? "",
      name: business.name,
      "metadata[user_id]": user.id,
      "metadata[business_id]": business.id,
    });

    const customerResponse = await fetch("https://api.stripe.com/v1/customers", {
      method: "POST",
      headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: customerForm,
    });
    const customer = await customerResponse.json() as { id?: string; error?: { message?: string } };
    if (!customerResponse.ok || !customer.id) {
      return NextResponse.json({ error: customer.error?.message ?? "Stripe could not create a customer profile." }, { status: 502 });
    }
    customerId = customer.id;
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "subscription",
    customer: customerId,
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
    "metadata[user_id]": user.id,
    "metadata[business_id]": business.id,
    "metadata[plan]": plan,
    success_url: `${origin}/billing?checkout=success`,
    cancel_url: `${origin}/billing?checkout=cancelled`,
    "allow_promotion_codes": "true",
  });
  const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  const session = await stripeResponse.json() as { url?: string; error?: { message?: string } };
  if (!stripeResponse.ok || !session.url) {
    return NextResponse.json({ error: session.error?.message ?? "Stripe could not create a checkout session." }, { status: 502 });
  }
  return NextResponse.json({ url: session.url });
}