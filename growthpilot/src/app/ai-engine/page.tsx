"use client";

import { useEffect, useState } from "react";
import { mockGrowthScore, mockWebsiteData, mockSocialData } from "@/lib/mock-data";
import { ScoreRing, SectionHeader } from "@/components/ui";
import { ArrowUpRight, BrainCircuit, Lightbulb, Sparkles } from "lucide-react";
import { calculateAdaptiveGrowthScore, type GrowthScoreDimension } from "@/lib/growth-score";
import { getBusinessAnalysis } from "@/lib/business-analysis";
import { MarketingCoach } from "@/components/MarketingCoach";

const defaultChannels = ["Website", "Google Business Profile", "Instagram", "LinkedIn"];

function buildScoreDimensions(activeChannels: string[]): GrowthScoreDimension[] {
  const socialScores = [
    activeChannels.includes("Instagram") ? mockSocialData.instagram.score : null,
    activeChannels.includes("Facebook") ? mockSocialData.facebook.score : null,
    activeChannels.includes("TikTok") ? mockSocialData.tiktok.score : null,
    activeChannels.includes("YouTube") ? mockSocialData.youtube.score : null,
    activeChannels.includes("LinkedIn") ? mockSocialData.linkedin.score : null,
  ].filter((score): score is number => score !== null);
  const socialScore = socialScores.length
    ? Math.round(socialScores.reduce((total, score) => total + score, 0) / socialScores.length)
    : mockGrowthScore.social;

  return [
  {
    key: "website",
    label: "Website",
    score: mockGrowthScore.website,
    baseWeight: 15,
    description: "Site health, speed, and user experience",
    requiredChannels: ["Website"],
  },
  {
    key: "seo",
    label: "SEO",
    score: mockWebsiteData.seo.score,
    baseWeight: 15,
    description: "Keyword rankings, technical SEO, and metadata",
    requiredChannels: ["Website"],
  },
  {
    key: "google",
    label: "Google",
    score: mockGrowthScore.google,
    baseWeight: 15,
    description: "Search visibility, analytics, and local presence",
    requiredChannels: ["Website", "Google Business Profile"],
  },
  {
    key: "social",
    label: "Social Media",
    score: socialScore,
    baseWeight: 20,
    description: "Only the social channels your business actively uses",
    requiredChannels: ["Instagram", "Facebook", "TikTok", "YouTube", "LinkedIn"],
  },
  {
    key: "content",
    label: "Content",
    score: mockWebsiteData.content.score,
    baseWeight: 15,
    description: "Content quality, depth, freshness",
    requiredChannels: ["Website"],
  },
  {
    key: "engagement",
    label: "Customer Engagement",
    score: 73,
    baseWeight: 10,
    description: "Audience response, repeat attention, and reviews",
  },
  {
    key: "conversion",
    label: "Conversion",
    score: mockWebsiteData.conversion.score,
    baseWeight: 10,
    description: "CTAs, qualified actions, and customer outcomes",
    requiredChannels: ["Website"],
  },
  ];
}

function getBarColor(score: number) {
  if (score >= 80) return "bg-green-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-red-500";
}

export default function AIEnginePage() {
  const [activeChannels, setActiveChannels] = useState(defaultChannels);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedBusiness = window.localStorage.getItem("marketgrowthai.business");
      if (!storedBusiness) return;
      const parsedBusiness = JSON.parse(storedBusiness) as { marketingChannels?: string[] };
      if (parsedBusiness.marketingChannels?.length) setActiveChannels(parsedBusiness.marketingChannels);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const adaptiveScore = calculateAdaptiveGrowthScore(buildScoreDimensions(activeChannels), activeChannels);
  const analysis = getBusinessAnalysis(activeChannels);
  const strongestSocialChannel = [
    { name: "Instagram", score: mockSocialData.instagram.score, engagement: mockSocialData.instagram.engagementRate },
    { name: "Facebook", score: mockSocialData.facebook.score, engagement: mockSocialData.facebook.engagementRate },
    { name: "TikTok", score: mockSocialData.tiktok.score, engagement: mockSocialData.tiktok.engagementRate },
    { name: "YouTube", score: mockSocialData.youtube.score, engagement: 0 },
    { name: "LinkedIn", score: mockSocialData.linkedin.score, engagement: mockSocialData.linkedin.engagementRate },
  ].filter((channel) => activeChannels.includes(channel.name)).sort((left, right) => right.score - left.score)[0]
    ?? { name: "Instagram", score: mockSocialData.instagram.score, engagement: mockSocialData.instagram.engagementRate };

  return (
    <div>
      <SectionHeader
        title="AI Marketing Intelligence"
        subtitle="From raw performance signals to a clear growth decision."
        icon="✦"
      />

      <section className="mb-8 grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="border border-cyan-500/30 bg-[#102a43] p-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300"><Sparkles size={16} />Strongest acquisition signal</div><p className="mt-4 text-3xl font-bold text-white">{strongestSocialChannel.name} is working harder for your business.</p><p className="mt-4 text-sm leading-6 text-slate-300">Its {strongestSocialChannel.engagement || strongestSocialChannel.score}% signal is the clearest audience-response signal across your active social channels.</p></div>
        <div className="border border-slate-700 bg-slate-900 p-6"><div className="flex items-start gap-3"><BrainCircuit size={23} className="mt-0.5 text-cyan-300" /><div><h2 className="font-semibold text-white">AI interpretation</h2><p className="mt-2 text-sm leading-6 text-slate-300">Educational short-form videos generate approximately 2.8x more engagement than promotional content. Your audience is signaling that useful, specific teaching content is the best route to attention and trust.</p></div></div><div className="mt-5 border-l-2 border-amber-300 bg-amber-300/5 p-4"><div className="flex items-center gap-2 text-sm font-semibold text-amber-100"><Lightbulb size={17} />Recommendation</div><p className="mt-2 text-sm text-slate-300">Publish three educational videos next week focused on your strongest topic, then turn the best performer into an Instagram and LinkedIn series.</p><button type="button" className="mt-4 inline-flex items-center gap-1.5 bg-cyan-400 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-cyan-300">Create content plan <ArrowUpRight size={15} /></button></div></div>
      </section>

      <MarketingCoach activeChannels={activeChannels} />

      {/* Overall Score */}
      <div className="border border-slate-700 bg-slate-900 p-6 md:p-8 mb-8 flex flex-col md:flex-row items-center gap-8">
        <ScoreRing score={adaptiveScore.score} label="Business Growth Score" size="lg" />
        <div className="flex-1">
          <h2 className="text-xl font-bold text-white mb-2">Your Business Growth Score</h2>
          <p className="text-slate-400 text-sm mb-4">
            A transparent, adaptive score calculated from the channels your business uses. Unused channels
            are excluded and their weight is redistributed across the signals that matter to you.
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
      <h2 className="text-lg font-semibold text-white mb-4">Adaptive score breakdown</h2>
      <div className="bg-slate-800 border border-slate-700 p-5 mb-8">
        <div className="space-y-4">
          {adaptiveScore.dimensions.map((dim) => (
            <div key={dim.key}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{dim.label}</span>
                  <span className="text-xs text-slate-500">({dim.effectiveWeight}% effective weight)</span>
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

      <div className="mb-8 border border-slate-700 bg-slate-900 p-5"><h2 className="text-lg font-semibold text-white">Business analysis</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{analysis.summary}</p><div className="mt-4 grid gap-3 md:grid-cols-2">{analysis.opportunities.slice(0, 4).map((opportunity) => <div key={opportunity.id} className="border border-slate-700 bg-slate-950/40 p-3"><p className="text-sm font-semibold text-white">{opportunity.title}</p><p className="mt-1 text-xs text-slate-400">{opportunity.impact}</p></div>)}</div><h3 className="mt-6 text-sm font-semibold text-white">Why the score adapts</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">The baseline model weights Website, SEO, Google, Social Media, Content, Customer Engagement, and Conversion at 15%, 15%, 15%, 20%, 15%, 10%, and 10%. When a source is not part of your marketing strategy, MarketGrowthAI removes it from the calculation and proportionally redistributes its weight instead of treating it as a failure.</p><p className="mt-3 text-sm font-medium text-cyan-200">Active sources in this workspace: {activeChannels.join(", ")}</p></div>

      {/* How It Works */}
      <h2 className="text-lg font-semibold text-white mb-4">How the AI Engine Works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            step: "1",
            title: "Data Collection",
            description:
              "MarketGrowthAI connects to your website, Google Search Console, Google Analytics, Google Business Profile, and 5 social media platforms to collect real-time performance data.",
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
