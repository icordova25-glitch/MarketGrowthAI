import { supabase } from "@/lib/supabase";

type HeaderOptions = {
  requestId?: string;
};

function createRequestId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createAuthedJsonHeaders(options: HeaderOptions = {}): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-request-id": options.requestId ?? createRequestId(),
  };
  if (!supabase) return headers;

  const { data } = await supabase.auth.getSession();
  const accessToken = data.session?.access_token;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  return headers;
}
