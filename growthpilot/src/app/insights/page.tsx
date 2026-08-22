import { mockInsights } from "@/lib/mock-data";
import { SectionHeader, PriorityBadge } from "@/components/ui";
import Link from "next/link";

const effortConfig = {
  Low: "text-green-400",
  Medium: "text-amber-400",
  High: "text-red-400",
};

export default function InsightsPage() {
  const categories = [...new Set(mockInsights.map((i) => i.category))];

  return (
    <div>
      <SectionHeader
        title="Actionable Insights"
        subtitle={`${mockInsights.length} AI-generated insights to grow your business`}
        icon="💡"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {(["critical", "high", "medium", "low"] as const).map((priority) => {
          const count = mockInsights.filter((i) => i.priority === priority).length;
          return (
            <div key={priority} className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-white mb-1">{count}</div>
              <PriorityBadge priority={priority} />
            </div>
          );
        })}
      </div>

      {/* Insights by Category */}
      {categories.map((cat) => {
        const items = mockInsights.filter((i) => i.category === cat);
        return (
          <div key={cat} className="mb-8">
            <h2 className="text-base font-semibold text-white mb-3">{cat}</h2>
            <div className="space-y-3">
              {items.map((insight) => (
                <div
                  key={insight.id}
                  className="bg-slate-800 border border-slate-700 rounded-xl p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <PriorityBadge priority={insight.priority as "critical" | "high" | "medium" | "low"} />
                        <span className="text-xs text-slate-500">
                          Effort:{" "}
                          <span className={effortConfig[insight.effort as keyof typeof effortConfig]}>
                            {insight.effort}
                          </span>
                        </span>
                      </div>
                      <h3 className="font-semibold text-white mb-1">{insight.title}</h3>
                      <p className="text-slate-400 text-sm mb-3">{insight.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-400 font-medium">{insight.impact}</span>
                        <span className="text-slate-500">→ {insight.action}</span>
                      </div>
                    </div>
                    <Link
                      href="/do-it-for-me"
                      className="shrink-0 bg-violet-700 hover:bg-violet-600 text-white text-xs px-4 py-2 rounded-lg transition-colors"
                    >
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
