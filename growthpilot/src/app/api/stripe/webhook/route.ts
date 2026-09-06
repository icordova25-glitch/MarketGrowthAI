import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase-service";

export const runtime = "nodejs";

type StripeEvent = {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
};

const priceToPlan = new Map<string, "starter" | "growth" | "pro" | "agency">(
  [
    [process.env.STRIPE_PRICE_STARTER ?? "", "starter"],
    [process.env.STRIPE_PRICE_GROWTH ?? "", "growth"],
    [process.env.STRIPE_PRICE_PRO ?? "", "pro"],
    [process.env.STRIPE_PRICE_AGENCY ?? "", "agency"],
  ].filter(([priceId]) => Boolean(priceId)) as [string, "starter" | "growth" | "pro" | "agency"][]
);

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string): boolean {
  const elements = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, value] = part.split("=");
      return [key, value];
    })
  );

  const timestamp = elements.t;
  const signature = elements.v1;
  if (!timestamp || !signature) return false;

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", secret).update(signedPayload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

function unixToIso(value: unknown): string | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
}

function getPlanFromSubscriptionObject(subscription: Record<string, unknown>): string {
  const metadata = subscription.metadata as Record<string, unknown> | undefined;
  const metadataPlan = typeof metadata?.plan === "string" ? metadata.plan : null;
  if (metadataPlan) return metadataPlan;

  const items = subscription.items as { data?: Array<{ price?: { id?: string } }> } | undefined;
  const priceId = items?.data?.[0]?.price?.id;
  if (priceId && priceToPlan.has(priceId)) return priceToPlan.get(priceId) ?? "starter";

  return "starter";
}

async function findBusinessIdBySubscriptionId(supabase: ReturnType<typeof createSupabaseServiceClient>, subscriptionId: string): Promise<string | null> {
  const { data } = await supabase
    .from("subscriptions")
    .select("business_id")
    .eq("external_subscription_id", subscriptionId)
    .maybeSingle();
  return data?.business_id ?? null;
}

async function upsertSubscriptionByBusiness(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  params: {
    businessId: string;
    customerId: string | null;
    subscriptionId: string | null;
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
  }
) {
  const { error } = await supabase.from("subscriptions").upsert(
    {
      business_id: params.businessId,
      provider: "stripe",
      external_customer_id: params.customerId,
      external_subscription_id: params.subscriptionId,
      plan: params.plan,
      status: params.status,
      current_period_end: params.currentPeriodEnd,
    },
    { onConflict: "business_id" }
  );

  if (error) throw new Error(error.message);
}

async function handleCheckoutCompleted(supabase: ReturnType<typeof createSupabaseServiceClient>, object: Record<string, unknown>) {
  const metadata = object.metadata as Record<string, unknown> | undefined;
  const businessId = typeof metadata?.business_id === "string" ? metadata.business_id : null;
  const plan = typeof metadata?.plan === "string" ? metadata.plan : "starter";
  const customerId = typeof object.customer === "string" ? object.customer : null;
  const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;

  if (!businessId) throw new Error("Missing business_id metadata on checkout session.");

  await upsertSubscriptionByBusiness(supabase, {
    businessId,
    customerId,
    subscriptionId,
    plan,
    status: "active",
    currentPeriodEnd: null,
  });
}

async function handleSubscriptionEvent(
  supabase: ReturnType<typeof createSupabaseServiceClient>,
  object: Record<string, unknown>,
  fallbackStatus?: string
) {
  const metadata = object.metadata as Record<string, unknown> | undefined;
  const subscriptionId = typeof object.id === "string" ? object.id : null;
  const customerId = typeof object.customer === "string" ? object.customer : null;
  const status = fallbackStatus ?? (typeof object.status === "string" ? object.status : "active");
  const businessIdFromMetadata = typeof metadata?.business_id === "string" ? metadata.business_id : null;
  const businessId = businessIdFromMetadata ?? (subscriptionId ? await findBusinessIdBySubscriptionId(supabase, subscriptionId) : null);

  if (!subscriptionId || !businessId) {
    throw new Error("Subscription event is missing subscription id or business id.");
  }

  await upsertSubscriptionByBusiness(supabase, {
    businessId,
    customerId,
    subscriptionId,
    plan: getPlanFromSubscriptionObject(object),
    status,
    currentPeriodEnd: unixToIso(object.current_period_end),
  });
}

async function handleInvoiceEvent(supabase: ReturnType<typeof createSupabaseServiceClient>, object: Record<string, unknown>, status: string) {
  const subscriptionId = typeof object.subscription === "string" ? object.subscription : null;
  const customerId = typeof object.customer === "string" ? object.customer : null;

  if (!subscriptionId) throw new Error("Invoice event missing subscription id.");

  const { data: existing, error } = await supabase
    .from("subscriptions")
    .select("business_id,plan,current_period_end")
    .eq("external_subscription_id", subscriptionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!existing?.business_id) throw new Error("No internal subscription found for invoice event.");

  await upsertSubscriptionByBusiness(supabase, {
    businessId: existing.business_id,
    customerId,
    subscriptionId,
    plan: existing.plan,
    status,
    currentPeriodEnd: existing.current_period_end,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature") ?? "";
  const payload = await request.text();
  if (!signature || !verifyStripeSignature(payload, signature, webhookSecret)) {
    return NextResponse.json({ error: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  const event = JSON.parse(payload) as StripeEvent;
  const supabase = createSupabaseServiceClient();

  const { data: existingEvent } = await supabase
    .from("stripe_webhook_events")
    .select("id")
    .eq("event_id", event.id)
    .maybeSingle();

  if (existingEvent) return NextResponse.json({ ok: true, duplicate: true });

  const { error: eventInsertError } = await supabase
    .from("stripe_webhook_events")
    .insert({ event_id: event.id, event_type: event.type, payload: event });

  if (eventInsertError && !eventInsertError.message.toLowerCase().includes("duplicate")) {
    return NextResponse.json({ error: eventInsertError.message }, { status: 500 });
  }

  try {
    const object = event.data.object;

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(supabase, object);
    } else if (event.type === "customer.subscription.updated") {
      await handleSubscriptionEvent(supabase, object);
    } else if (event.type === "customer.subscription.deleted") {
      await handleSubscriptionEvent(supabase, object, "canceled");
    } else if (event.type === "invoice.paid") {
      await handleInvoiceEvent(supabase, object, "active");
    } else if (event.type === "invoice.payment_failed") {
      await handleInvoiceEvent(supabase, object, "past_due");
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process webhook event.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
