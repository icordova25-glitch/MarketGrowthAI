import { NextResponse } from "next/server";

const priceIds = {
  starter: process.env.STRIPE_PRICE_STARTER,
  growth: process.env.STRIPE_PRICE_GROWTH,
  pro: process.env.STRIPE_PRICE_PRO,
  agency: process.env.STRIPE_PRICE_AGENCY,
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { plan?: keyof typeof priceIds } | null;
  const plan = body?.plan;
  const priceId = plan ? priceIds[plan] : undefined;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!plan || !priceId || !secretKey) {
    return NextResponse.json({ error: "Stripe is not configured for this environment." }, { status: 503 });
  }

  const origin = new URL(request.url).origin;
  const form = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": priceId,
    "line_items[0][quantity]": "1",
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