import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { errorWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/api-response";

type CreateCompetitorPayload = {
  name?: string;
  website?: string;
};

type UpdateCompetitorPayload = {
  id?: string;
  name?: string;
  website?: string;
};

type DeleteCompetitorPayload = {
  id?: string;
};

const MAX_COMPETITORS = 100;
const MAX_COMPETITOR_NAME_LENGTH = 120;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function normalizeWebsite(value: string): string | null {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    url.hash = "";
    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
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

async function getOwnerBusiness(supabase: SupabaseClient, userId: string) {
  return supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
}

export async function GET(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);

  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing competitors.", 404);

  const { data, error } = await supabase
    .from("competitors")
    .select("id,name,website_url")
    .eq("business_id", business.id)
    .limit(MAX_COMPETITORS)
    .order("created_at", { ascending: true });

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    competitors: (data ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      website: item.website_url ?? "",
    })),
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as CreateCompetitorPayload | null;
  const name = payload?.name ? normalizeText(payload.name) : "";
  const website = payload?.website?.trim() ?? "";
  if (!name || !website) {
    return errorWithRequestId(requestId, "Competitor name and website are required.", 400);
  }

  if (name.length > MAX_COMPETITOR_NAME_LENGTH) {
    return errorWithRequestId(requestId, `Competitor name must be ${MAX_COMPETITOR_NAME_LENGTH} characters or less.`, 400);
  }

  const normalizedWebsite = normalizeWebsite(website);
  if (!normalizedWebsite || !isPublicHttpUrl(normalizedWebsite)) {
    return errorWithRequestId(requestId, "Competitor website must be a public http or https URL.", 400);
  }

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);

  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing competitors.", 404);

  const { count: competitorCount, error: countError } = await supabase
    .from("competitors")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id);

  if (countError) return errorWithRequestId(requestId, countError.message, 500);
  if ((competitorCount ?? 0) >= MAX_COMPETITORS) {
    return errorWithRequestId(requestId, "Competitor limit reached. Remove an existing competitor before adding another.", 403);
  }

  const { data: existing, error: existingError } = await supabase
    .from("competitors")
    .select("id")
    .eq("business_id", business.id)
    .eq("website_url", normalizedWebsite)
    .limit(1)
    .maybeSingle();

  if (existingError) return errorWithRequestId(requestId, existingError.message, 500);
  if (existing) {
    return errorWithRequestId(requestId, "This competitor website is already tracked.", 409);
  }

  const { data, error } = await supabase
    .from("competitors")
    .insert({
      business_id: business.id,
      name,
      website_url: normalizedWebsite,
    })
    .select("id,name,website_url")
    .single();

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    competitor: {
      id: data.id,
      name: data.name,
      website: data.website_url ?? "",
    },
  });
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as UpdateCompetitorPayload | null;
  const id = payload?.id?.trim();
  if (!id) return errorWithRequestId(requestId, "Competitor id is required.", 400);

  const updates: { name?: string; website_url?: string } = {};
  if (typeof payload?.name === "string") {
    const name = normalizeText(payload.name);
    if (!name) return errorWithRequestId(requestId, "Competitor name cannot be empty.", 400);
    if (name.length > MAX_COMPETITOR_NAME_LENGTH) {
      return errorWithRequestId(requestId, `Competitor name must be ${MAX_COMPETITOR_NAME_LENGTH} characters or less.`, 400);
    }
    updates.name = name;
  }

  if (typeof payload?.website === "string") {
    const normalizedWebsite = normalizeWebsite(payload.website);
    if (!normalizedWebsite || !isPublicHttpUrl(normalizedWebsite)) {
      return errorWithRequestId(requestId, "Competitor website must be a public http or https URL.", 400);
    }
    updates.website_url = normalizedWebsite;
  }

  if (!Object.keys(updates).length) {
    return errorWithRequestId(requestId, "No valid updates were provided.", 400);
  }

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);
  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing competitors.", 404);

  const { data: existing, error: existingError } = await supabase
    .from("competitors")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (existingError) return errorWithRequestId(requestId, existingError.message, 500);
  if (!existing) return errorWithRequestId(requestId, "Competitor was not found.", 404);

  if (updates.website_url) {
    const { data: duplicate, error: duplicateError } = await supabase
      .from("competitors")
      .select("id")
      .eq("business_id", business.id)
      .eq("website_url", updates.website_url)
      .neq("id", id)
      .limit(1)
      .maybeSingle();

    if (duplicateError) return errorWithRequestId(requestId, duplicateError.message, 500);
    if (duplicate) {
      return errorWithRequestId(requestId, "Another competitor with this website is already tracked.", 409);
    }
  }

  const { data, error } = await supabase
    .from("competitors")
    .update(updates)
    .eq("id", id)
    .eq("business_id", business.id)
    .select("id,name,website_url")
    .single();

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    competitor: {
      id: data.id,
      name: data.name,
      website: data.website_url ?? "",
    },
  });
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as DeleteCompetitorPayload | null;
  const id = payload?.id?.trim();
  if (!id) return errorWithRequestId(requestId, "Competitor id is required.", 400);

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);
  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing competitors.", 404);

  const { data: existing, error: existingError } = await supabase
    .from("competitors")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .maybeSingle();

  if (existingError) return errorWithRequestId(requestId, existingError.message, 500);
  if (!existing) return errorWithRequestId(requestId, "Competitor was not found.", 404);

  const { error } = await supabase
    .from("competitors")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id);

  if (error) return errorWithRequestId(requestId, error.message, 500);
  return jsonWithRequestId(requestId, { ok: true });
}
