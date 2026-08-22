import { mockGrowthScore, mockWebsiteData, mockGoogleData, mockSocialData } from "@/lib/mock-data";
import { ScoreRing, SectionHeader } from "@/components/ui";

const scoreDimensions = [
  {
    label: "Website SEO",
    score: mockWebsiteData.seo.score,
    weight: "15%",
    description: "Keyword rankings, technical SEO, meta data",
  },
  {
    label: "Website Content",
    score: mockWebsiteData.content.score,
    weight: "10%",
    description: "Content quality, depth, freshness",
  },
  {
    label: "Website Conversion",
    score: mockWebsiteData.conversion.score,
    weight: "10%",
    description: "CTAs, bounce rate, session duration",
  },
  {
    label: "Google Search",
    score: mockGoogleData.searchConsole.score,
    weight: "15%",
    description: "Impressions, CTR, average position",
  },
  {
    label: "Google Analytics",
    score: mockGoogleData.analytics.score,
    weight: "10%",
    description: "Sessions, traffic channels, user behavior",
  },
  {
    label: "Google Business",
    score: mockGoogleData.businessProfile.score,
    weight: "10%",
    description: "Profile completeness, reviews, local visibility",
  },
  {
    label: "Instagram",
    score: mockSocialData.instagram.score,
    weight: "7%",
    description: "Followers, engagement rate, reach",
  },
  {
    label: "Facebook",
    score: mockSocialData.facebook.score,
    weight: "5%",
    description: "Followers, engagement rate, reach",
  },
  {
    label: "TikTok",
    score: mockSocialData.tiktok.score,
    weight: "7%",
    description: "Followers, engagement, total views",
  },
  {
    label: "YouTube",
    score: mockSocialData.youtube.score,
    weight: "6%",
    description: "Subscribers, watch hours, views",
  },
  {
    label: "LinkedIn",
    score: mockSocialData.linkedin.score,
    weight: "5%",
    description: "Followers, engagement, impressions",
  },
];

function getBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export default function AIEnginePage() {
  return (
    <div>
      <SectionHeader
        title="AI Engine"
        subtitle="How your Business Growth Score is calculated across all data sources"
        icon="🤖"
      />

      {/* Overall Score */}
      <div className="bg-gradient-to-br from-violet-900/40 to-blue-900/40 border border-violet-800/50 rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={mockGrowthScore.overall} label="Business Growth Score" size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">Your Business Growth Score</h2>
          <p className="text-slate-400 text-sm mb-4">
            The Business Growth Score is a composite AI-powered metric calculated from 11 data dimensions
            across your website, Google presence, and social media channels. Each dimension is weighted
            by its impact on measurable business growth.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-900/60 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{mockGrowthScore.website}</div>
              <div className="text-xs text-slate-400">Website</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{mockGrowthScore.google}</div>
              <div className="text-xs text-slate-400">Google</div>
            </div>
            <div className="bg-slate-900/60 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{mockGrowthScore.social}</div>
              <div className="text-xs text-slate-400">Social</div>
            </div>
          </div>
        </div>
      </div>

      {/* Score Breakdown */}
      <h2 className="text-lg font-semibold text-white mb-4">Score Breakdown</h2>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <div className="space-y-4">
          {scoreDimensions.map((dim, i) => (
            <div key={i}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{dim.label}</span>
                  <span className="text-xs text-slate-500">({dim.weight} weight)</span>
                </div>
                <span className="text-sm font-bold text-white">{dim.score}/100</span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${getBarColor(dim.score)}`}
                  style={{ width: `${dim.score}%` }}
                />
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{dim.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* How It Works */}
      <h2 className="text-lg font-semibold text-white mb-4">How the AI Engine Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Data Collection",
            description:
              "GrowthPilot connects to your website, Google Search Console, Google Analytics, Google Business Profile, and 5 social media platforms to collect real-time performance data.",
            icon: "📡",
          },
          {
            step: "2",
            title: "AI Analysis",
            description:
              "Our AI engine analyzes each data dimension, benchmarks against industry standards, and identifies opportunities and risks specific to your business.",
            icon: "🧠",
          },
          {
            step: "3",
            title: "Growth Score",
            description:
              "A weighted composite score is calculated and normalized to 0–100. The score updates daily as new data arrives, and trends are tracked over time.",
            icon: "📈",
          },
        ].map((item) => (
          <div key={item.step} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
                {item.step}
              </div>
              <span className="text-xl">{item.icon}</span>
              <span className="font-semibold text-white">{item.title}</span>
            </div>
            <p className="text-slate-400 text-sm">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
