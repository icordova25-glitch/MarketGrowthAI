// Mock data for GrowthPilot platform

export const mockBusinessProfile = {
  name: "Acme Digital Co.",
  website: "https://acmedigital.com",
  industry: "E-Commerce",
  location: "San Francisco, CA",
  connectedSince: "2024-01-15",
};

export const mockGrowthScore = {
  overall: 72,
  website: 68,
  google: 75,
  social: 71,
  trend: "+4 pts this month",
};

export const mockWebsiteData = {
  seo: {
    score: 68,
    organicTraffic: 12400,
    organicTrafficChange: +8.2,
    topKeywords: [
      { keyword: "digital marketing tools", position: 4, volume: 2900 },
      { keyword: "growth analytics platform", position: 7, volume: 1800 },
      { keyword: "ai marketing software", position: 12, volume: 3400 },
      { keyword: "business growth score", position: 3, volume: 890 },
      { keyword: "social media analytics", position: 9, volume: 5600 },
    ],
    issues: [
      { severity: "high", description: "3 pages missing meta descriptions" },
      { severity: "medium", description: "Image alt text missing on 12 images" },
      { severity: "low", description: "Page load speed above 3s on mobile" },
    ],
  },
  content: {
    score: 71,
    totalPages: 48,
    blogPosts: 24,
    avgReadTime: "3m 20s",
    topContent: [
      { title: "10 Ways to Grow Your Business with AI", views: 4200, conversion: 3.1 },
      { title: "Ultimate Guide to Digital Marketing in 2025", views: 3800, conversion: 2.7 },
      { title: "How to Improve Your Google Business Profile", views: 2900, conversion: 4.2 },
    ],
    recommendations: [
      "Publish 2 more blog posts per week to increase organic reach",
      "Add video content to top 5 pages to increase dwell time",
      "Update 8 outdated posts from 2022 with fresh data",
    ],
  },
  conversion: {
    score: 65,
    conversionRate: 2.8,
    conversionRateChange: +0.3,
    bounceRate: 54,
    avgSessionDuration: "2m 14s",
    cta: [
      { page: "Homepage", ctr: 4.2, conversions: 128 },
      { page: "Pricing", ctr: 8.1, conversions: 94 },
      { page: "Blog Index", ctr: 1.9, conversions: 37 },
    ],
  },
};

export const mockGoogleData = {
  searchConsole: {
    score: 74,
    impressions: 89400,
    clicks: 4720,
    ctr: 5.3,
    avgPosition: 8.2,
    topPages: [
      { page: "/blog/ai-marketing-guide", clicks: 820, impressions: 12400 },
      { page: "/pricing", clicks: 640, impressions: 8900 },
      { page: "/features", clicks: 580, impressions: 7200 },
    ],
  },
  analytics: {
    score: 77,
    sessions: 18200,
    sessionsChange: +11.4,
    newUsers: 9800,
    topChannels: [
      { channel: "Organic Search", sessions: 7280, percentage: 40 },
      { channel: "Direct", sessions: 4550, percentage: 25 },
      { channel: "Social", sessions: 3276, percentage: 18 },
      { channel: "Referral", sessions: 1820, percentage: 10 },
      { channel: "Email", sessions: 1274, percentage: 7 },
    ],
  },
  businessProfile: {
    score: 74,
    views: 3400,
    calls: 124,
    directions: 89,
    rating: 4.7,
    reviewCount: 142,
    recentReviews: [
      { author: "Sarah M.", rating: 5, text: "Absolutely transformed our marketing strategy!", date: "2025-07-14" },
      { author: "James K.", rating: 4, text: "Great platform, would love more integrations.", date: "2025-07-10" },
      { author: "Laura T.", rating: 5, text: "The AI insights are incredibly accurate.", date: "2025-07-08" },
    ],
  },
};

export const mockSocialData = {
  instagram: {
    score: 78,
    followers: 12400,
    followersChange: +340,
    engagementRate: 4.2,
    posts: 186,
    reach: 48200,
    topPosts: [
      { caption: "Behind the scenes of our AI engine 🤖", likes: 892, comments: 67, reach: 4200 },
      { caption: "5 growth hacks for 2025 📈", likes: 741, comments: 89, reach: 3800 },
    ],
  },
  facebook: {
    score: 62,
    followers: 8900,
    followersChange: +120,
    engagementRate: 1.8,
    posts: 94,
    reach: 22400,
    topPosts: [
      { caption: "New feature alert: Business Growth Score!", likes: 234, comments: 28, reach: 2100 },
      { caption: "Customer success story: 3x revenue in 6 months", likes: 198, comments: 41, reach: 1900 },
    ],
  },
  tiktok: {
    score: 69,
    followers: 6700,
    followersChange: +890,
    engagementRate: 6.8,
    videos: 47,
    totalViews: 284000,
    topVideos: [
      { caption: "AI analyzed our website and found THIS 😱", views: 48000, likes: 3200, shares: 890 },
      { caption: "From 0 to 10k followers using GrowthPilot", views: 32000, likes: 2400, shares: 640 },
    ],
  },
  youtube: {
    score: 58,
    subscribers: 2100,
    subscribersChange: +180,
    views: 28400,
    watchHours: 940,
    videos: 28,
    topVideos: [
      { title: "Full GrowthPilot Walkthrough 2025", views: 4800, likes: 342, comments: 89 },
      { title: "How to Connect Google Search Console", views: 2900, likes: 198, comments: 54 },
    ],
  },
  linkedin: {
    score: 73,
    followers: 4200,
    followersChange: +210,
    engagementRate: 3.4,
    posts: 72,
    impressions: 38400,
    topPosts: [
      { caption: "The future of AI-driven marketing is here.", likes: 312, comments: 48, shares: 94 },
      { caption: "Case study: 200% increase in qualified leads", likes: 278, comments: 62, shares: 118 },
    ],
  },
};

export const mockInsights = [
  {
    id: "1",
    priority: "critical",
    category: "SEO",
    title: "3 Pages Missing Meta Descriptions",
    description: "Your homepage, pricing page, and features page are missing meta descriptions. This directly impacts click-through rates from Google search results.",
    impact: "Estimated +12% CTR improvement",
    effort: "Low",
    action: "Add meta descriptions to 3 pages",
  },
  {
    id: "2",
    priority: "high",
    category: "Social",
    title: "TikTok Engagement Outperforming All Other Channels",
    description: "Your TikTok account has a 6.8% engagement rate — 3x your Instagram and 10x your Facebook. You are currently under-investing in this channel.",
    impact: "Potential +890 followers/month",
    effort: "Medium",
    action: "Increase TikTok posting frequency to 5x/week",
  },
  {
    id: "3",
    priority: "high",
    category: "Conversion",
    title: "Pricing Page Has High Intent but Low Conversion",
    description: "Your pricing page receives 8.1% CTA clicks but only 2.4% convert to signups. Adding social proof and a comparison table could significantly improve this.",
    impact: "Estimated +40 conversions/month",
    effort: "Medium",
    action: "Redesign pricing page with testimonials and comparison table",
  },
  {
    id: "4",
    priority: "medium",
    category: "Google",
    title: "Google Business Profile Missing 6 Categories",
    description: "Your Google Business Profile is missing 6 relevant business categories. Adding these will increase your visibility in local search by an estimated 18%.",
    impact: "+18% local search visibility",
    effort: "Low",
    action: "Add 6 missing categories to Google Business Profile",
  },
  {
    id: "5",
    priority: "medium",
    category: "Content",
    title: "8 Blog Posts Need to Be Updated",
    description: "8 of your highest-traffic blog posts are over 2 years old and contain outdated statistics. Google deprioritizes stale content.",
    impact: "Protect +3,200 monthly organic visits",
    effort: "Medium",
    action: "Update 8 blog posts with 2025 data and statistics",
  },
  {
    id: "6",
    priority: "low",
    category: "Social",
    title: "YouTube Underperforming vs. Industry Benchmark",
    description: "Your YouTube channel has 2,100 subscribers with 28 videos. Similar businesses average 4,800 subscribers at this content volume.",
    impact: "+2,700 subscribers potential",
    effort: "High",
    action: "Implement YouTube SEO strategy and increase upload frequency",
  },
];

export const mockDoItForMeTasks = [
  {
    id: "1",
    status: "completed",
    category: "SEO",
    title: "Generated Meta Descriptions",
    description: "AI wrote and applied meta descriptions to 3 missing pages",
    completedAt: "2025-07-15T14:32:00Z",
    result: "Meta descriptions added to homepage, pricing, and features pages",
  },
  {
    id: "2",
    status: "in-progress",
    category: "Social",
    title: "Creating 5 TikTok Scripts",
    description: "AI is generating viral TikTok video scripts based on your top-performing content",
    progress: 60,
    estimatedCompletion: "2 minutes",
  },
  {
    id: "3",
    status: "queued",
    category: "Content",
    title: "Refresh 8 Blog Posts",
    description: "AI will update outdated statistics and add fresh insights to 8 blog posts",
    estimatedTime: "15 minutes",
  },
  {
    id: "4",
    status: "queued",
    category: "Google",
    title: "Optimize Google Business Profile",
    description: "AI will add missing categories and suggest post content for your GBP",
    estimatedTime: "5 minutes",
  },
];
