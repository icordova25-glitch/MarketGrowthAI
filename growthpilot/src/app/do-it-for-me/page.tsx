import { mockDoItForMeTasks } from "@/lib/mock-data";
import { SectionHeader } from "@/components/ui";

const statusConfig = {
  completed: { label: "Completed", className: "bg-green-900/50 text-green-400 border-green-800", icon: "✅" },
  "in-progress": { label: "In Progress", className: "bg-blue-900/50 text-blue-400 border-blue-800", icon: "⚙️" },
  queued: { label: "Queued", className: "bg-slate-700 text-slate-400 border-slate-600", icon: "⏳" },
};

export default function DoItForMePage() {
  return (
    <div>
      <SectionHeader
        title="Do It For Me AI"
        subtitle="Let GrowthPilot AI automatically implement improvements for your business"
        icon="⚡"
      />

      {/* Hero */}
      <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-800/50 rounded-2xl p-8 mb-8">
        <div className="flex items-start gap-6">
          <div className="text-5xl">🤖</div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">AI Takes Action For You</h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Instead of just showing you what to fix, GrowthPilot&apos;s AI can automatically execute improvements
              across your website, Google presence, and social media. Review and approve each action before it
              goes live, or let the AI work autonomously.
            </p>
            <div className="flex gap-3 mt-4">
              <button className="bg-violet-600 hover:bg-violet-500 text-white text-sm px-5 py-2 rounded-lg transition-colors font-medium">
                ⚡ Run All Queued Tasks
              </button>
              <button className="bg-slate-700 hover:bg-slate-600 text-white text-sm px-5 py-2 rounded-lg transition-colors">
                ⚙️ Configure Preferences
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Capabilities */}
      <h2 className="text-lg font-semibold text-white mb-4">What AI Can Do For You</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { icon: "🌐", title: "Website Optimization", items: ["Write meta descriptions & title tags", "Generate & update blog content", "Improve page copy for conversions", "Fix broken links & image alt text"] },
          { icon: "🔍", title: "Google Presence", items: ["Optimize Google Business Profile", "Generate GBP posts & responses", "Submit URLs to Search Console", "Update business categories & hours"] },
          { icon: "📱", title: "Social Media", items: ["Write posts & captions for all platforms", "Generate TikTok & YouTube scripts", "Create hashtag strategies", "Schedule content calendar"] },
        ].map((cap) => (
          <div key={cap.title} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{cap.icon}</span>
              <span className="font-semibold text-white">{cap.title}</span>
            </div>
            <ul className="space-y-1.5">
              {cap.items.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-slate-400">
                  <span className="text-violet-400 mt-0.5 shrink-0">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Task Queue */}
      <h2 className="text-lg font-semibold text-white mb-4">Task Queue</h2>
      <div className="space-y-4">
        {mockDoItForMeTasks.map((task) => {
          const sc = statusConfig[task.status as keyof typeof statusConfig];
          return (
            <div
              key={task.id}
              className="bg-slate-800 border border-slate-700 rounded-xl p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <span className="text-2xl">{sc.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-white">{task.title}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.className}`}>
                        {sc.label}
                      </span>
                      <span className="text-xs text-slate-500">{task.category}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{task.description}</p>

                    {task.status === "in-progress" && "progress" in task && (
                      <div className="mt-3">
                        <div className="flex justify-between text-xs text-slate-500 mb-1">
                          <span>Progress</span>
                          <span>{task.progress}% · Est. {task.estimatedCompletion} remaining</span>
                        </div>
                        <div className="h-1.5 bg-slate-700 rounded-full">
                          <div
                            className="h-1.5 bg-blue-500 rounded-full animate-pulse"
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {task.status === "completed" && "result" in task && (
                      <div className="mt-2 text-xs text-green-400">
                        ✓ {task.result}
                      </div>
                    )}

                    {task.status === "queued" && "estimatedTime" in task && (
                      <div className="mt-2 text-xs text-slate-500">
                        ⏱ Estimated time: {task.estimatedTime}
                      </div>
                    )}
                  </div>
                </div>

                {task.status === "queued" && (
                  <button className="shrink-0 bg-violet-700 hover:bg-violet-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                    ▶ Run Now
                  </button>
                )}
                {task.status === "completed" && (
                  <button className="shrink-0 bg-slate-700 hover:bg-slate-600 text-white text-xs px-4 py-2 rounded-lg transition-colors">
                    View Result
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
