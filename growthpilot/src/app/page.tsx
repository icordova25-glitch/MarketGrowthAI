import { mockGrowthScore, mockBusinessProfile, mockInsights } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader, PriorityBadge } from "@/components/ui";
import Link from "next/link";
import { ArrowUpRight, BrainCircuit, CircleAlert, Target } from "lucide-react";

export default function Dashboard() {
  const criticalInsights = mockInsights.filter(
    (i) => i.priority === "critical" || i.priority === "high"
  ).slice(0, 3);

  return (
    <div>
      <SectionHeader
        title="Growth command center"
        subtitle={`Business Growth Score updated today · ${mockGrowthScore.trend}`}
        icon="✦"
      />

      {/* Hero Score */}
      <div className="border border-cyan-500/30 bg-[#102a43] p-6 md:p-8 mb-8 flex flex-col lg:flex-row items-center gap-8">
        <div className="flex-shrink-0">
          <ScoreRing score={mockGrowthScore.overall} label="Overall Growth Score" size="lg" />
        </div>
        <div className="flex-1">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Target size={15} />Business performance</div>
          <h2 className="text-xl font-semibold text-white mb-1">
            {mockBusinessProfile.name}
          </h2>
          <p className="text-slate-400 text-sm mb-4">
            {mockBusinessProfile.website} · {mockBusinessProfile.industry}
          </p>
          <div className="grid grid-cols-3 gap-4">
            <ScoreRing score={mockGrowthScore.website} label="Website" size="sm" />
            <ScoreRing score={mockGrowthScore.google} label="Google" size="sm" />
            <ScoreRing score={mockGrowthScore.social} label="Social" size="sm" />
          </div>
        </div>
        <div className="border border-cyan-200/15 bg-slate-950/30 p-5 text-center min-w-[180px]">
          <div className="text-4xl font-bold text-cyan-300 mb-1">{mockGrowthScore.overall}</div>
          <div className="text-slate-400 text-sm">out of 100</div>
          <div className="text-green-400 text-sm mt-2 font-medium">{mockGrowthScore.trend}</div>
          <Link
            href="/ai-engine"
            className="mt-3 flex items-center justify-center gap-1.5 bg-cyan-400 px-3 py-2 text-xs font-bold text-slate-950 transition-colors hover:bg-cyan-300"
          >
            Ask AI Coach <ArrowUpRight size={14} />
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold text-white">What needs attention</p><p className="mt-1 text-xs text-slate-400">The three issues with the clearest growth impact.</p></div><CircleAlert size={20} className="text-amber-300" /></div>
          <div className="space-y-3">{criticalInsights.map((insight) => <div key={insight.id} className="flex gap-3 border-l-2 border-cyan-400 bg-slate-950/40 px-3 py-2.5"><div className="min-w-0 flex-1"><p className="text-sm font-medium text-slate-100">{insight.title}</p><p className="mt-1 text-xs text-slate-400">{insight.impact}</p></div><PriorityBadge priority={insight.priority as "critical" | "high" | "medium" | "low"} /></div>)}</div>
        </section>
        <section className="border border-slate-700 bg-slate-900 p-5">
          <div className="mb-4 flex items-center gap-2"><BrainCircuit size={20} className="text-cyan-300" /><div><p className="text-sm font-semibold text-white">AI readout</p><p className="mt-1 text-xs text-slate-400">What the score is telling you.</p></div></div>
          <p className="text-sm leading-6 text-slate-300">Your Google visibility is trending up, while social reach has the fastest momentum. Improving conversion on high-intent pages is the shortest route to more qualified leads.</p>
          <Link href="/insights" className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">View recommendations <ArrowUpRight size={15} /></Link>
        </section>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard label="Monthly Organic Traffic" value="12,400" change={8.2} icon="🌐" />
        <StatCard label="Google Impressions" value="89,400" change={11.4} icon="🔍" />
        <StatCard label="Social Reach" value="214K" change={6.8} icon="📱" />
        <StatCard label="Conversion Rate" value="2.8%" change={0.3} icon="🎯" suffix="" />
      </div>

      {/* Module Cards */}
      <h2 className="text-lg font-semibold text-white mb-4">Score inputs</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { href: "/website", icon: "🌐", title: "Website Analysis", subtitle: "SEO · Content · Conversion", score: mockGrowthScore.website },
          { href: "/google", icon: "🔍", title: "Google", subtitle: "Search Console · Analytics · Business Profile", score: mockGrowthScore.google },
          { href: "/social", icon: "📱", title: "Social Media", subtitle: "Instagram · Facebook · TikTok · YouTube · LinkedIn", score: mockGrowthScore.social },
          { href: "/ai-engine", icon: "🤖", title: "AI Engine", subtitle: "Business Growth Score Engine", score: mockGrowthScore.overall },
          { href: "/insights", icon: "💡", title: "Actionable Insights", subtitle: `${mockInsights.length} insights ready`, score: null },
          { href: "/do-it-for-me", icon: "⚡", title: "Do It For Me AI", subtitle: "AI executes improvements for you", score: null },
        ].map((mod) => (
          <Link
            key={mod.href}
            href={mod.href}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5 hover:border-violet-600 hover:bg-slate-800/80 transition-all group"
          >
            <div className="flex items-start justify-between mb-3">
              <span className="text-2xl">{mod.icon}</span>
              {mod.score !== null && (
                <span className="text-lg font-bold text-violet-400">{mod.score}</span>
              )}
            </div>
            <div className="font-semibold text-white group-hover:text-violet-300 transition-colors">
              {mod.title}
            </div>
            <div className="text-slate-500 text-xs mt-1">{mod.subtitle}</div>
          </Link>
        ))}
      </div>

      {/* Top Priority Insights */}
      <h2 className="text-lg font-semibold text-white mb-4">Recommended next steps</h2>
      <div className="space-y-3">
        {criticalInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-start gap-4"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <PriorityBadge priority={insight.priority as "critical" | "high" | "medium" | "low"} />
                <span className="text-xs text-slate-500">{insight.category}</span>
              </div>
              <div className="font-medium text-white text-sm">{insight.title}</div>
              <div className="text-slate-400 text-xs mt-1">{insight.description}</div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-green-400 text-xs font-medium">{insight.impact}</div>
              <Link
                href="/do-it-for-me"
                className="mt-2 block text-xs bg-violet-700 hover:bg-violet-600 text-white px-3 py-1 rounded-lg transition-colors"
              >
                Fix It →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
