import { mockWebsiteData } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader, PriorityBadge } from "@/components/ui";

export default function WebsitePage() {
  const { seo, content, conversion } = mockWebsiteData;

  return (
    <div>
      <SectionHeader
        title="Website Analysis"
        subtitle="SEO performance, content quality, and conversion optimization"
        icon="🌐"
      />

      {/* Score Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex gap-8 items-center">
        <ScoreRing score={seo.score} label="SEO" size="md" />
        <ScoreRing score={content.score} label="Content" size="md" />
        <ScoreRing score={conversion.score} label="Conversion" size="md" />
        <div className="flex-1 text-slate-400 text-sm ml-4">
          <p className="mb-1">Your website scores well on content quality but has room to improve in SEO and conversion.</p>
          <p className="text-xs text-slate-500">Based on analysis of {content.totalPages} pages and {content.blogPosts} blog posts.</p>
        </div>
      </div>

      {/* SEO Section */}
      <h2 className="text-lg font-semibold text-white mb-4">🔎 SEO</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Organic Traffic" value={seo.organicTraffic.toLocaleString()} change={seo.organicTrafficChange} icon="📈" />
        <StatCard label="SEO Score" value={seo.score} icon="🏆" suffix="/100" />
        <StatCard label="Issues Found" value={seo.issues.length} icon="⚠️" />
        <StatCard label="Top Keywords" value={seo.topKeywords.length} icon="🔑" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Top Keywords */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Top Keywords</h3>
          <div className="space-y-2">
            {seo.topKeywords.map((kw, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-slate-300">{kw.keyword}</span>
                <div className="flex gap-4 text-slate-500">
                  <span>Pos. <span className="text-violet-400">#{kw.position}</span></span>
                  <span>{kw.volume.toLocaleString()} vol</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SEO Issues */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">SEO Issues</h3>
          <div className="space-y-2">
            {seo.issues.map((issue, i) => {
              const p = issue.severity === "high" ? "high" : issue.severity === "medium" ? "medium" : "low";
              return (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <PriorityBadge priority={p as "high" | "medium" | "low"} />
                  <span className="text-slate-300">{issue.description}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content Section */}
      <h2 className="text-lg font-semibold text-white mb-4">📝 Content</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Pages" value={content.totalPages} icon="📄" />
        <StatCard label="Blog Posts" value={content.blogPosts} icon="✍️" />
        <StatCard label="Avg Read Time" value={content.avgReadTime} icon="⏱️" />
        <StatCard label="Content Score" value={content.score} icon="📊" suffix="/100" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Top Content</h3>
          <div className="space-y-3">
            {content.topContent.map((c, i) => (
              <div key={i} className="text-sm">
                <div className="text-slate-200 mb-0.5">{c.title}</div>
                <div className="flex gap-4 text-slate-500 text-xs">
                  <span>{c.views.toLocaleString()} views</span>
                  <span>{c.conversion}% conversion</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-3">Recommendations</h3>
          <ul className="space-y-2">
            {content.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-violet-400 mt-0.5">→</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Conversion Section */}
      <h2 className="text-lg font-semibold text-white mb-4">🎯 Conversion</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Conversion Rate" value={`${conversion.conversionRate}%`} change={conversion.conversionRateChange} icon="🎯" />
        <StatCard label="Bounce Rate" value={`${conversion.bounceRate}%`} icon="↩️" />
        <StatCard label="Avg Session" value={conversion.avgSessionDuration} icon="⏱️" />
        <StatCard label="Conversion Score" value={conversion.score} icon="📊" suffix="/100" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-3">CTA Performance by Page</h3>
        <div className="space-y-2">
          {conversion.cta.map((c, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{c.page}</span>
              <div className="flex gap-6 text-slate-500">
                <span>CTR: <span className="text-amber-400">{c.ctr}%</span></span>
                <span>{c.conversions} conversions</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
