import { NextResponse } from "next/server";
import { answerCoachQuestion } from "@/lib/business-analysis";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { question?: string; activeChannels?: string[] } | null;
  const question = body?.question?.trim();
  if (!question) return NextResponse.json({ error: "Ask a business-growth question to start the coaching session." }, { status: 400 });
  if (question.length > 800) return NextResponse.json({ error: "Keep your question under 800 characters." }, { status: 400 });
  return NextResponse.json(answerCoachQuestion(question, body?.activeChannels ?? []));
}