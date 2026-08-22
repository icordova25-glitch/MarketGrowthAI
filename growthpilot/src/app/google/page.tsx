import { mockGoogleData } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader } from "@/components/ui";

export default function GooglePage() {
  const { searchConsole, analytics, businessProfile } = mockGoogleData;

  return (
    <div>
      <SectionHeader
        title="Google"
        subtitle="Search Console, Analytics, and Business Profile performance"
        icon="🔍"
      />

      {/* Score Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex gap-8 items-center">
        <ScoreRing score={searchConsole.score} label="Search Console" size="md" />
        <ScoreRing score={analytics.score} label="Analytics" size="md" />
        <ScoreRing score={businessProfile.score} label="Business Profile" size="md" />
      </div>

      {/* Search Console */}
      <h2 className="text-lg font-semibold text-white mb-4">📊 Search Console</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Impressions" value={searchConsole.impressions.toLocaleString()} icon="👁️" />
        <StatCard label="Clicks" value={searchConsole.clicks.toLocaleString()} icon="🖱️" />
        <StatCard label="CTR" value={`${searchConsole.ctr}%`} icon="📈" />
        <StatCard label="Avg Position" value={`#${searchConsole.avgPosition}`} icon="🏆" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-white mb-3">Top Pages in Search</h3>
        <div className="space-y-2">
          {searchConsole.topPages.map((p, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-violet-400 font-mono text-xs">{p.page}</span>
              <div className="flex gap-6 text-slate-500">
                <span>{p.clicks} clicks</span>
                <span>{p.impressions.toLocaleString()} impressions</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Analytics */}
      <h2 className="text-lg font-semibold text-white mb-4">📈 Analytics</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <StatCard label="Sessions" value={analytics.sessions.toLocaleString()} change={analytics.sessionsChange} icon="📱" />
        <StatCard label="New Users" value={analytics.newUsers.toLocaleString()} icon="👤" />
        <StatCard label="Analytics Score" value={analytics.score} icon="📊" suffix="/100" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-white mb-3">Traffic by Channel</h3>
        <div className="space-y-3">
          {analytics.topChannels.map((ch, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-300">{ch.channel}</span>
                <span className="text-slate-500">{ch.sessions.toLocaleString()} sessions ({ch.percentage}%)</span>
              </div>
              <div className="h-1.5 bg-slate-700 rounded-full">
                <div
                  className="h-1.5 bg-violet-500 rounded-full"
                  style={{ width: `${ch.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Business Profile */}
      <h2 className="text-lg font-semibold text-white mb-4">🏢 Google Business Profile</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Profile Views" value={businessProfile.views.toLocaleString()} icon="👁️" />
        <StatCard label="Calls" value={businessProfile.calls} icon="📞" />
        <StatCard label="Directions" value={businessProfile.directions} icon="📍" />
        <StatCard label="Rating" value={`${businessProfile.rating} ⭐`} icon="⭐" />
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">Recent Reviews ({businessProfile.reviewCount} total)</h3>
        <div className="space-y-3">
          {businessProfile.recentReviews.map((r, i) => (
            <div key={i} className="border-b border-slate-700 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-white">{r.author}</span>
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400 text-sm">{"★".repeat(r.rating)}</span>
                  <span className="text-xs text-slate-500">{r.date}</span>
                </div>
              </div>
              <p className="text-slate-400 text-sm">{r.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
