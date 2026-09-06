export type Opportunity = {
  id: string;
  priority: "critical" | "high" | "medium" | "low";
  category: "SEO" | "Conversion" | "Google" | "Social" | "Content";
  title: string;
  evidence: string;
  recommendation: string;
  impact: string;
  effort: "Low" | "Medium" | "High";
};

export type BusinessProfileSnapshot = {
  businessName?: string | null;
  website?: string | null;
  industry?: string | null;
  businessType?: string | null;
  city?: string | null;
  state?: string | null;
  idealCustomers?: string | null;
  productsAndServices?: string | null;
  serviceArea?: string | null;
  differentiator?: string | null;
  marketingChannels?: string[];
};

export type BusinessAnalysisDimension = {
  key: string;
  label: string;
  score: number;
  baseWeight: number;
  effectiveWeight?: number;
  description: string;
  requiredChannels?: string[];
};

export type BusinessAnalysisResult = {
  overallScore: number;
  summary: string;
  strongestSocial: { channel: string; score: number; engagement: number } | null;
  opportunities: Opportunity[];
  dimensions: BusinessAnalysisDimension[];
  activeChannels: string[];
  businessName: string;
  website?: string | null;
};

const socialBenchmarks: Record<string, { score: number; engagement: number }> = {
  Instagram: { score: 72, engagement: 4.8 },
  Facebook: { score: 58, engagement: 2.1 },
  TikTok: { score: 78, engagement: 6.2 },
  YouTube: { score: 64, engagement: 3.4 },
  LinkedIn: { score: 69, engagement: 3.1 },
};

const socialChannelNames = Object.keys(socialBenchmarks);

function normalizeChannels(channels: string[] = []) {
  return [...new Set(channels.map((channel) => channel.trim()).filter(Boolean))];
}

function createOpportunity(
  id: string,
  priority: Opportunity["priority"],
  category: Opportunity["category"],
  title: string,
  evidence: string,
  recommendation: string,
  impact: string,
  effort: Opportunity["effort"]
): Opportunity {
  return { id, priority, category, title, evidence, recommendation, impact, effort };
}

function buildStrongestSocial(activeChannels: string[]) {
  const candidates = activeChannels
    .filter((channel) => socialChannelNames.includes(channel))
    .map((channel) => ({ channel, ...socialBenchmarks[channel] }))
    .sort((left, right) => right.score - left.score);

  return candidates[0] ?? null;
}

function scoreWebsite(profile: BusinessProfileSnapshot) {
  return profile.website ? 82 : 44;
}

function scoreSeo(profile: BusinessProfileSnapshot) {
  let score = profile.website ? 70 : 35;
  if (profile.industry) score += 8;
  if (profile.differentiator) score += 8;
  if (profile.productsAndServices) score += 6;
  return Math.min(score, 95);
}

function scoreGoogle(profile: BusinessProfileSnapshot, activeChannels: string[]) {
  let score = 42;
  if (activeChannels.includes("Google Business Profile")) score += 28;
  if (profile.city && profile.state) score += 18;
  if (profile.serviceArea) score += 6;
  if (profile.website) score += 6;
  return Math.min(score, 92);
}

function scoreSocial(activeChannels: string[]) {
  const socialChannels = activeChannels.filter((channel) => socialChannelNames.includes(channel));
  if (!socialChannels.length) return 38;
  const total = socialChannels.reduce((sum, channel) => sum + socialBenchmarks[channel].score, 0);
  return Math.round(total / socialChannels.length);
}

function scoreContent(profile: BusinessProfileSnapshot) {
  let score = 40;
  if (profile.productsAndServices) score += 20;
  if (profile.idealCustomers) score += 15;
  if (profile.differentiator) score += 15;
  if (profile.website) score += 5;
  return Math.min(score, 95);
}

function scoreConversion(profile: BusinessProfileSnapshot) {
  let score = profile.website ? 58 : 30;
  if (profile.idealCustomers) score += 12;
  if (profile.differentiator) score += 12;
  if (profile.productsAndServices) score += 10;
  if (profile.serviceArea) score += 5;
  return Math.min(score, 90);
}

function scoreEngagement(activeChannels: string[]) {
  const socialChannels = activeChannels.filter((channel) => socialChannelNames.includes(channel));
  if (!socialChannels.length) return 45;
  const weighted = socialChannels.reduce((sum, channel) => sum + socialBenchmarks[channel].engagement, 0);
  return Math.min(Math.round(weighted / socialChannels.length * 12), 88);
}

function buildDimensions(profile: BusinessProfileSnapshot, activeChannels: string[]): BusinessAnalysisDimension[] {
  const websiteScore = scoreWebsite(profile);
  const seoScore = scoreSeo(profile);
  const googleScore = scoreGoogle(profile, activeChannels);
  const socialScore = scoreSocial(activeChannels);
  const contentScore = scoreContent(profile);
  const engagementScore = scoreEngagement(activeChannels);
  const conversionScore = scoreConversion(profile);

  const dimensions = [
    {
      key: "website",
      label: "Website",
      score: websiteScore,
      baseWeight: 15,
      description: "Site health, visibility, and ownership of your digital storefront",
      requiredChannels: ["Website"],
    },
    {
      key: "seo",
      label: "SEO",
      score: seoScore,
      baseWeight: 15,
      description: "Keyword clarity, search intent alignment, and on-page fundamentals",
      requiredChannels: ["Website"],
    },
    {
      key: "google",
      label: "Google",
      score: googleScore,
      baseWeight: 15,
      description: "Search visibility, local presence, and map discovery readiness",
      requiredChannels: ["Website", "Google Business Profile"],
    },
    {
      key: "social",
      label: "Social Media",
      score: socialScore,
      baseWeight: 20,
      description: "Only the social channels your business actively uses",
      requiredChannels: socialChannelNames,
    },
    {
      key: "content",
      label: "Content",
      score: contentScore,
      baseWeight: 15,
      description: "Offer clarity, content depth, and messaging consistency",
      requiredChannels: ["Website"],
    },
    {
      key: "engagement",
      label: "Customer Engagement",
      score: engagementScore,
      baseWeight: 10,
      description: "Audience response, repeat attention, and social momentum",
    },
    {
      key: "conversion",
      label: "Conversion",
      score: conversionScore,
      baseWeight: 10,
      description: "Calls-to-action, buyer confidence, and next-step clarity",
      requiredChannels: ["Website"],
    },
  ] satisfies BusinessAnalysisDimension[];

  const activeSet = new Set(activeChannels);
  const totalWeight = dimensions
    .filter((dimension) => !dimension.requiredChannels?.length || dimension.requiredChannels.some((channel) => activeSet.has(channel)))
    .reduce((sum, dimension) => sum + dimension.baseWeight, 0);

  return dimensions.map((dimension) => ({
    ...dimension,
    effectiveWeight: dimension.requiredChannels?.length && !dimension.requiredChannels.some((channel) => activeSet.has(channel))
      ? 0
      : Math.round((dimension.baseWeight / Math.max(totalWeight, 1)) * 100),
  }));
}

function buildOpportunities(profile: BusinessProfileSnapshot, activeChannels: string[], dimensions: BusinessAnalysisDimension[], strongestSocial: BusinessAnalysisResult["strongestSocial"]) {
  const websiteScore = dimensions.find((dimension) => dimension.key === "website")?.score ?? 0;
  const seoScore = dimensions.find((dimension) => dimension.key === "seo")?.score ?? 0;
  const googleScore = dimensions.find((dimension) => dimension.key === "google")?.score ?? 0;
  const contentScore = dimensions.find((dimension) => dimension.key === "content")?.score ?? 0;
  const conversionScore = dimensions.find((dimension) => dimension.key === "conversion")?.score ?? 0;

  const opportunities: Opportunity[] = [];

  if (!profile.website) {
    opportunities.push(createOpportunity(
      "add-website",
      "critical",
      "SEO",
      "Add a public website URL to unlock the full analysis",
      "No website is saved in the business profile, so search, content, and conversion signals are incomplete.",
      "Save the public website URL and run a live website scan to establish the baseline score.",
      "Unlock SEO, content, and conversion recommendations",
      "Low"
    ));
  } else if (websiteScore < 75) {
    opportunities.push(createOpportunity(
      "website-baseline",
      "high",
      "SEO",
      "Strengthen your website baseline",
      `The saved website (${profile.website}) is present, but the current website score is ${websiteScore}/100.`,
      "Review the homepage title, meta description, and above-the-fold message before the next campaign.",
      "Improve trust and search readiness",
      "Medium"
    ));
  }

  if (seoScore < 80) {
    opportunities.push(createOpportunity(
      "seo-focus",
      "high",
      "SEO",
      "Tighten search intent and page messaging",
      `Your current SEO readiness score is ${seoScore}/100, which suggests the site can be clearer about who you help and what you solve.`,
      "Clarify the homepage promise and create one keyword-focused page for your main service or product.",
      "Increase qualified search traffic",
      "Medium"
    ));
  }

  if (googleScore < 75) {
    opportunities.push(createOpportunity(
      "google-growth",
      "medium",
      "Google",
      "Use your local profile to improve discovery",
      profile.city && profile.state
        ? `The workspace is anchored in ${profile.city}, ${profile.state}, but local discovery still needs more signal.`
        : "The profile is missing location detail that helps local discovery."
      ,
      activeChannels.includes("Google Business Profile")
        ? "Post one weekly update, verify your service categories, and publish a local proof point this week."
        : "Connect Google Business Profile and add your primary service categories.",
      "Increase local visibility",
      "Low"
    ));
  }

  if (contentScore < 80) {
    opportunities.push(createOpportunity(
      "content-proof",
      "medium",
      "Content",
      "Make the value proposition more explicit",
      profile.differentiator
        ? `Your differentiator is captured as “${profile.differentiator}”, but the message still needs to be turned into repeatable content.`
        : "The business profile does not yet include a clear differentiator.",
      profile.differentiator
        ? "Turn the differentiator into a three-point service summary and one case-study-style story."
        : "Add one clear differentiator and reuse it across your homepage and content plan.",
      "Protect attention and improve message clarity",
      "Medium"
    ));
  }

  if (conversionScore < 75) {
    opportunities.push(createOpportunity(
      "conversion-cta",
      "high",
      "Conversion",
      "Create one clear next step for buyers",
      profile.idealCustomers && profile.productsAndServices
        ? `You know who you serve and what you sell, but the conversion score is only ${conversionScore}/100.`
        : "The business profile still needs customer and offer detail before the next step is obvious.",
      "Use a single primary call-to-action and a short trust block on the homepage or pricing page.",
      "Increase lead capture and inquiries",
      "Medium"
    ));
  }

  if (strongestSocial) {
    opportunities.push(createOpportunity(
      "social-winner",
      "high",
      "Social",
      `${strongestSocial.channel} is your strongest active social channel`,
      `${strongestSocial.channel} is currently the highest-signal active channel in this workspace with a ${strongestSocial.engagement}% engagement rate benchmark.`,
      `Create a weekly teaching series for ${strongestSocial.channel} and reuse the strongest post on your other active channels.`,
      `Build on ${strongestSocial.channel} momentum`,
      "Medium"
    ));
  }

  if (!activeChannels.includes("Website")) {
    opportunities.push(createOpportunity(
      "activate-website",
      "critical",
      "Content",
      "Add Website to your active channels",
      "Website data is excluded from the current score because the workspace does not include the Website channel.",
      "Enable the Website channel to unlock the core analysis path and a more complete growth score.",
      "Unlock the full workflow",
      "Low"
    ));
  }

  return opportunities.slice(0, 5);
}

export function getBusinessAnalysis(profileOrChannels: BusinessProfileSnapshot | string[] = {}, activeChannels: string[] = []): BusinessAnalysisResult {
  const profile = Array.isArray(profileOrChannels) ? {} : profileOrChannels;
  const channelsInput = Array.isArray(profileOrChannels) ? profileOrChannels : activeChannels;
  const channels = normalizeChannels(channelsInput.length ? channelsInput : profile.marketingChannels ?? []);
  const strongestSocial = buildStrongestSocial(channels);
  const dimensions = buildDimensions(profile, channels);
  const opportunities = buildOpportunities(profile, channels, dimensions, strongestSocial);
  const overallScore = Math.max(0, Math.min(100, Math.round(dimensions.reduce((total, dimension) => total + dimension.score * ((dimension.effectiveWeight ?? 0) / 100), 0))));

  const summary = strongestSocial
    ? `${profile.businessName ?? "This workspace"} should lean into ${strongestSocial.channel}, while the biggest gains are in ${opportunities[0]?.category?.toLowerCase() ?? "SEO"} and conversion clarity.`
    : `${profile.businessName ?? "This workspace"} should focus on SEO and conversion clarity while the active channels are still being connected.`;

  return {
    overallScore,
    summary,
    strongestSocial,
    opportunities,
    dimensions,
    activeChannels: channels,
    businessName: profile.businessName ?? "Your business",
    website: profile.website ?? null,
  };
}

export function answerCoachQuestion(question: string, profile: BusinessProfileSnapshot = {}, activeChannels: string[] = []) {
  const analysis = getBusinessAnalysis(profile, activeChannels);
  const normalizedQuestion = question.toLowerCase();
  const matches = analysis.opportunities.filter((opportunity) =>
    `${opportunity.category} ${opportunity.title} ${opportunity.recommendation}`.toLowerCase().split(" ").some((word) => word.length > 4 && normalizedQuestion.includes(word))
  );
  const focus = matches[0] ?? analysis.opportunities[0];
  return {
    answer: `${focus.title}. ${focus.evidence} My recommendation: ${focus.recommendation}`,
    nextStep: focus.recommendation,
    opportunityId: focus.id,
    analysis,
  };
}
