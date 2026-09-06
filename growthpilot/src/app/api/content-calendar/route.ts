import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAuthenticatedRequest } from "@/lib/server-auth";
import { errorWithRequestId, getRequestId, jsonWithRequestId } from "@/lib/api-response";

type CreateCalendarItemPayload = {
  type?: string;
  title?: string;
  date?: string;
  draft?: string;
};

type UpdateCalendarItemPayload = {
  id?: string;
  type?: string;
  title?: string;
  date?: string;
};

type DeleteCalendarItemPayload = {
  id?: string;
};

const ALLOWED_CONTENT_TYPES = new Set([
  "Social post",
  "Reels / TikTok ideas",
  "Blog outline",
  "Google Business post",
  "Email campaign",
]);

const MAX_TITLE_LENGTH = 180;
const MAX_SCHEDULED_ITEMS = 500;

function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function parseScheduleDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const scheduled = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(scheduled.getTime())) return null;
  return scheduled;
}

function isPastScheduleDate(date: Date): boolean {
  const today = new Date();
  const floorTodayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const floorScheduledUtc = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  return floorScheduledUtc < floorTodayUtc;
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
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing your content calendar.", 404);

  const { data, error } = await supabase
    .from("social_content")
    .select("id,content_type,body,scheduled_for")
    .eq("business_id", business.id)
    .eq("channel", "content-studio")
    .eq("status", "draft")
    .not("scheduled_for", "is", null)
    .limit(200)
    .order("scheduled_for", { ascending: true });

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    items: (data ?? []).map((item) => ({
      id: item.id,
      type: item.content_type ?? "Content",
      title: item.body,
      date: typeof item.scheduled_for === "string" ? item.scheduled_for.slice(0, 10) : "",
    })),
  });
}

export async function POST(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as CreateCalendarItemPayload | null;
  const type = payload?.type?.trim();
  const title = payload?.title ? normalizeText(payload.title) : "";
  const date = payload?.date?.trim();
  if (!type || !title || !date) {
    return errorWithRequestId(requestId, "Type, title, and date are required to schedule content.", 400);
  }

  if (!ALLOWED_CONTENT_TYPES.has(type)) {
    return errorWithRequestId(requestId, "Unsupported content type for scheduling.", 400);
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return errorWithRequestId(requestId, `Title must be ${MAX_TITLE_LENGTH} characters or less.`, 400);
  }

  const scheduled = parseScheduleDate(date);
  if (!scheduled) {
    return errorWithRequestId(requestId, "Schedule date is invalid.", 400);
  }

  if (isPastScheduleDate(scheduled)) {
    return errorWithRequestId(requestId, "Schedule date must be today or later.", 400);
  }

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);

  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing your content calendar.", 404);

  const { count: scheduledCount, error: countError } = await supabase
    .from("social_content")
    .select("id", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("channel", "content-studio")
    .eq("status", "draft")
    .not("scheduled_for", "is", null);

  if (countError) return errorWithRequestId(requestId, countError.message, 500);
  if ((scheduledCount ?? 0) >= MAX_SCHEDULED_ITEMS) {
    return errorWithRequestId(requestId, "Content calendar limit reached. Remove older scheduled drafts before adding more.", 403);
  }

  const { data, error } = await supabase
    .from("social_content")
    .insert({
      business_id: business.id,
      channel: "content-studio",
      content_type: type,
      body: title,
      status: "draft",
      scheduled_for: scheduled.toISOString(),
    })
    .select("id,content_type,body,scheduled_for")
    .single();

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    item: {
      id: data.id,
      type: data.content_type ?? "Content",
      title: data.body,
      date: typeof data.scheduled_for === "string" ? data.scheduled_for.slice(0, 10) : date,
    },
  });
}

export async function PATCH(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as UpdateCalendarItemPayload | null;
  const id = payload?.id?.trim();
  if (!id) return errorWithRequestId(requestId, "Scheduled item id is required.", 400);

  const updates: { content_type?: string; body?: string; scheduled_for?: string } = {};

  if (typeof payload?.type === "string") {
    const type = payload.type.trim();
    if (!ALLOWED_CONTENT_TYPES.has(type)) {
      return errorWithRequestId(requestId, "Unsupported content type for scheduling.", 400);
    }
    updates.content_type = type;
  }

  if (typeof payload?.title === "string") {
    const title = normalizeText(payload.title);
    if (!title) return errorWithRequestId(requestId, "Title cannot be empty.", 400);
    if (title.length > MAX_TITLE_LENGTH) {
      return errorWithRequestId(requestId, `Title must be ${MAX_TITLE_LENGTH} characters or less.`, 400);
    }
    updates.body = title;
  }

  if (typeof payload?.date === "string") {
    const scheduled = parseScheduleDate(payload.date.trim());
    if (!scheduled) return errorWithRequestId(requestId, "Schedule date is invalid.", 400);
    if (isPastScheduleDate(scheduled)) {
      return errorWithRequestId(requestId, "Schedule date must be today or later.", 400);
    }
    updates.scheduled_for = scheduled.toISOString();
  }

  if (!Object.keys(updates).length) {
    return errorWithRequestId(requestId, "No valid updates were provided.", 400);
  }

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);
  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing your content calendar.", 404);

  const { data: existing, error: existingError } = await supabase
    .from("social_content")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("channel", "content-studio")
    .eq("status", "draft")
    .maybeSingle();

  if (existingError) return errorWithRequestId(requestId, existingError.message, 500);
  if (!existing) return errorWithRequestId(requestId, "Scheduled content item was not found.", 404);

  const { data, error } = await supabase
    .from("social_content")
    .update(updates)
    .eq("id", id)
    .eq("business_id", business.id)
    .select("id,content_type,body,scheduled_for")
    .single();

  if (error) return errorWithRequestId(requestId, error.message, 500);

  return jsonWithRequestId(requestId, {
    item: {
      id: data.id,
      type: data.content_type ?? "Content",
      title: data.body,
      date: typeof data.scheduled_for === "string" ? data.scheduled_for.slice(0, 10) : "",
    },
  });
}

export async function DELETE(request: Request) {
  const requestId = getRequestId(request);
  const auth = await requireAuthenticatedRequest(request);
  if (!auth) return errorWithRequestId(requestId, "Sign in is required.", 401);

  const payload = (await request.json().catch(() => null)) as DeleteCalendarItemPayload | null;
  const id = payload?.id?.trim();
  if (!id) return errorWithRequestId(requestId, "Scheduled item id is required.", 400);

  const { supabase, user } = auth;
  const { data: business, error: businessError } = await getOwnerBusiness(supabase, user.id);
  if (businessError) return errorWithRequestId(requestId, businessError.message, 500);
  if (!business) return errorWithRequestId(requestId, "Complete onboarding before managing your content calendar.", 404);

  const { data: existing, error: existingError } = await supabase
    .from("social_content")
    .select("id")
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("channel", "content-studio")
    .eq("status", "draft")
    .maybeSingle();

  if (existingError) return errorWithRequestId(requestId, existingError.message, 500);
  if (!existing) return errorWithRequestId(requestId, "Scheduled content item was not found.", 404);

  const { error } = await supabase
    .from("social_content")
    .delete()
    .eq("id", id)
    .eq("business_id", business.id)
    .eq("channel", "content-studio")
    .eq("status", "draft");

  if (error) return errorWithRequestId(requestId, error.message, 500);
  return jsonWithRequestId(requestId, { ok: true });
}
