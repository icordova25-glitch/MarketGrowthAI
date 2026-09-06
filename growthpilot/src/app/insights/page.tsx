"use client";

import { useEffect, useState } from "react";
import { SectionHeader, PriorityBadge } from "@/components/ui";
import Link from "next/link";
import { createAuthedJsonHeaders } from "@/lib/auth-fetch";
import type { BusinessAnalysisResult } from "@/lib/business-analysis";

type BusinessAnalysisResponse = {
  profile: {
    businessName?: string;
    marketingChannels?: string[];
  };
  analysis: BusinessAnalysisResult;
};

const effortConfig = {
  Low: "text-green-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

export default function InsightsPage() {
  const [state, setState] = useState<BusinessAnalysisResponse | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    void (async () => {
      const response = await fetch("/api/business-analysis", {
        method: "GET",
        headers: await createAuthedJsonHeaders(),
      });
      const result = await response.json().catch(() => ({ error: "Unable to load business analysis." })) as BusinessAnalysisResponse & { error?: string };
      if (!isActive) return;

      if (!response.ok) {
        setError(result.error ?? "Unable to load business analysis.");
        setState(null);
        setIsLoading(false);
        return;
      }

      setState(result);
      setError("");
      setIsLoading(false);
    })();

    return () => {
      isActive = false;
    };
  }, []);

  const insights = state?.analysis.opportunities ?? [];
  const categories = [...new Set(insights.map((i) => i.category))];

  return (
    <div>
      <SectionHeader
        title="Actionable Insights"
        subtitle={`${insights.length} ranked opportunities detected from your saved workspace signals`}
        icon="💡"
      />

      {error && <p role="alert" className="mb-4 border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p>}
      {isLoading && <p className="mb-4 text-sm text-slate-400">Loading workspace insights...</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(["critical", "high", "medium", "low"] as const).map((priority) => {
          const count = insights.filter((i) => i.priority === priority).length;
          return (
            <div key={priority} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{count}</div>
              <PriorityBadge priority={priority} />
            </div>
          );
        })}
      </div>

      {categories.map((cat) => {
        const items = insights.filter((i) => i.category === cat);
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-base font-semibold text-white mb-3">{cat}</h2>
            <div className="space-y-3">
              {items.map((insight) => (
                <div key={insight.id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={insight.priority as "critical" | "high" | "medium" | "low"} />
                        <span className="text-xs text-slate-500">
                          Effort: <span className={effortConfig[insight.effort as keyof typeof effortConfig]}>{insight.effort}</span>
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                      <p className="text-slate-400 text-sm mb-3">{insight.evidence}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400 font-medium">{insight.impact}</span>
                        <span className="text-slate-500">→ {insight.recommendation}</span>
                      </div>
                    </div>
                    <Link href="/do-it-for-me" className="shrink-0 bg-violet-700 hover:bg-violet-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                      ⚡ Fix It
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
