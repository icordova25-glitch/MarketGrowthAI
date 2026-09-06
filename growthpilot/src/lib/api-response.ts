import { NextResponse } from "next/server";

type JsonPayload = Record<string, unknown>;

export function getRequestId(request: Request): string {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming || crypto.randomUUID();
}

export function jsonWithRequestId(requestId: string, payload: JsonPayload, status = 200): NextResponse {
  return NextResponse.json(
    {
      ...payload,
      requestId,
    },
    {
      status,
      headers: {
        "x-request-id": requestId,
      },
    }
  );
}

export function errorWithRequestId(requestId: string, error: string, status: number): NextResponse {
  return jsonWithRequestId(requestId, { error }, status);
}
