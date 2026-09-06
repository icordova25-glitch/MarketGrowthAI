import { NextResponse } from "next/server";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { assertWithinLimit, getBillingPlan, incrementMetricUsage } from "@/lib/billing";

export const runtime = "nodejs";

type ScanIssue = {
  severity: "high" | "medium" | "low";
  description: string;
};

function getAttribute(tag: string | undefined, attribute: string) {
  return tag?.match(new RegExp(`${attribute}=["']([^"']*)["']`, "i"))?.[1]?.trim() ?? "";
}

function isPublicHttpUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname) || hostname.includes(":");
    return (url.protocol === "http:" || url.protocol === "https:")
      && !isIpAddress
      && hostname !== "localhost"
      && !hostname.endsWith(".local");
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return NextResponse.json({ error: "Sign in is required." }, { status: 401 });

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (businessError) return NextResponse.json({ error: businessError.message }, { status: 500 });
  if (!business) return NextResponse.json({ error: "Complete onboarding before running a website scan." }, { status: 404 });

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("plan")
    .eq("business_id", business.id)
    .maybeSingle();

  if (subscriptionError) return NextResponse.json({ error: subscriptionError.message }, { status: 500 });

  const plan = getBillingPlan(subscription?.plan ?? "starter");
  if (!plan) return NextResponse.json({ error: "Billing configuration is unavailable." }, { status: 500 });

  try {
    await assertWithinLimit(supabase, business.id, "website_scans", plan.limits.website_scans);
  } catch (error) {
    const message = error instanceof Error ? error.message : "This plan does not allow more website scans right now.";
    return NextResponse.json({ error: message }, { status: 403 });
  }

  const body = await request.json().catch(() => null) as { url?: string } | null;
  const url = body?.url?.trim();

  if (!url || !isPublicHttpUrl(url)) {
    return NextResponse.json({ error: "Enter a public http or https website URL." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "error",
      headers: { "User-Agent": "MarketGrowthAI-WebsiteScanner/1.0" },
    });
    const contentType = response.headers.get("content-type") ?? "";
    const contentLength = Number(response.headers.get("content-length") ?? 0);
    if (!response.ok || !contentType.includes("text/html") || contentLength > 1_000_000) {
      return NextResponse.json({ error: "The website did not return a scannable HTML page." }, { status: 422 });
    }

    const html = (await response.text()).slice(0, 1_000_000);
    const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() ?? "";
    const descriptionTag = html.match(/<meta[^>]+name=["']description["'][^>]*>/i)?.[0]
      ?? html.match(/<meta[^>]+content=["'][^"']*["'][^>]+name=["']description["'][^>]*>/i)?.[0];
    const description = getAttribute(descriptionTag, "content");
    const canonical = getAttribute(html.match(/<link[^>]+rel=["']canonical["'][^>]*>/i)?.[0], "href");
    const headings = (html.match(/<h1\b[^>]*>/gi) ?? []).length;
    const images = html.match(/<img\b[^>]*>/gi) ?? [];
    const missingAlt = images.filter((image) => !/\balt=["'][^"']+["]/.test(image)).length;
    const words = html.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]+>/gi, " ").replace(/\s+/g, " ").trim().split(" ").filter(Boolean).length;
    const issues: ScanIssue[] = [];

    if (!title) issues.push({ severity: "high", description: "Homepage is missing a title tag." });
    else if (title.length < 30 || title.length > 60) issues.push({ severity: "medium", description: `Title tag is ${title.length} characters; aim for 30 to 60 characters.` });
    if (!description) issues.push({ severity: "high", description: "Homepage is missing a meta description." });
    else if (description.length < 70 || description.length > 160) issues.push({ severity: "medium", description: `Meta description is ${description.length} characters; aim for 70 to 160 characters.` });
    if (headings !== 1) issues.push({ severity: "medium", description: `Homepage has ${headings} H1 headings; use exactly one clear H1.` });
    if (!canonical) issues.push({ severity: "low", description: "Homepage has no canonical URL tag." });
    if (missingAlt) issues.push({ severity: "low", description: `${missingAlt} image${missingAlt === 1 ? " is" : "s are"} missing meaningful alt text.` });
    if (words < 250) issues.push({ severity: "medium", description: `Homepage has ${words} visible words; add more helpful on-page context for search engines.` });

    const score = Math.max(0, 100 - issues.reduce((total, issue) => total + (issue.severity === "high" ? 18 : issue.severity === "medium" ? 9 : 4), 0));
    await incrementMetricUsage(supabase, business.id, "website_scans");
    return NextResponse.json({ url, title, description, canonical, headings, images: images.length, missingAlt, words, score, issues });
  } catch {
    return NextResponse.json({ error: "MarketGrowthAI could not scan this site. Check the URL and try again." }, { status: 422 });
  } finally {
    clearTimeout(timeout);
  }
}