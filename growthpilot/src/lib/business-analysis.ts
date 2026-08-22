import { mockGoogleData, mockSocialData, mockWebsiteData } from "@/lib/mock-data";

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

export function getBusinessAnalysis(activeChannels: string[] = []) {
  const socialCandidates = [
    activeChannels.includes("Instagram") ? { channel: "Instagram", rate: mockSocialData.instagram.engagementRate, growth: mockSocialData.instagram.followersChange } : null,
    activeChannels.includes("Facebook") ? { channel: "Facebook", rate: mockSocialData.facebook.engagementRate, growth: mockSocialData.facebook.followersChange } : null,
    activeChannels.includes("TikTok") ? { channel: "TikTok", rate: mockSocialData.tiktok.engagementRate, growth: mockSocialData.tiktok.followersChange } : null,
    activeChannels.includes("LinkedIn") ? { channel: "LinkedIn", rate: mockSocialData.linkedin.engagementRate, growth: mockSocialData.linkedin.followersChange } : null,
  ].filter((item): item is { channel: string; rate: number; growth: number } => item !== null);
  const strongestSocial = socialCandidates.sort((left, right) => right.rate - left.rate)[0];

  const opportunities: Opportunity[] = [
    {
      id: "meta-descriptions",
      priority: "critical",
      category: "SEO",
      title: "Fix missing meta descriptions on high-value pages",
      evidence: `${mockWebsiteData.seo.issues[0].description}; weak snippets reduce the chance that searchers choose your result.`,
      recommendation: "Write distinct, benefit-led meta descriptions for the homepage, pricing page, and features page.",
      impact: "Estimated +12% CTR improvement",
      effort: "Low",
    },
    {
      id: "conversion-proof",
      priority: "high",
      category: "Conversion",
      title: "Improve conversion on your highest-intent page",
      evidence: `The pricing page earns ${mockWebsiteData.conversion.cta[1].ctr}% CTA clicks but the overall conversion score is only ${mockWebsiteData.conversion.score}/100.`,
      recommendation: "Add outcome-focused proof, a concise comparison, and one primary CTA to the pricing experience.",
      impact: "Estimated +40 conversions/month",
      effort: "Medium",
    },
    {
      id: "local-visibility",
      priority: "medium",
      category: "Google",
      title: "Complete your Google Business Profile categories",
      evidence: `The profile earns ${mockGoogleData.businessProfile.views.toLocaleString()} views and has ${mockGoogleData.businessProfile.reviewCount} reviews, but category coverage is incomplete.`,
      recommendation: "Add the six missing business categories, then publish one locally relevant update this week.",
      impact: "+18% local search visibility",
      effort: "Low",
    },
    {
      id: "content-refresh",
      priority: "medium",
      category: "Content",
      title: "Refresh aging high-traffic content",
      evidence: `${mockWebsiteData.content.topContent[0].title} already brings ${mockWebsiteData.content.topContent[0].views.toLocaleString()} views.`,
      recommendation: "Update the eight oldest high-traffic articles with current statistics, examples, and an action-oriented CTA.",
      impact: "Protect +3,200 monthly organic visits",
      effort: "Medium",
    },
  ];

  if (strongestSocial) opportunities.splice(2, 0, {
    id: "social-winner",
    priority: "high",
    category: "Social",
    title: `${strongestSocial.channel} is your strongest active social channel`,
    evidence: `${strongestSocial.channel} has a ${strongestSocial.rate}% engagement rate and is growing by ${strongestSocial.growth.toLocaleString()} followers in the current period.`,
    recommendation: `Create a weekly educational series for ${strongestSocial.channel}, then adapt the strongest post for your other active channels.`,
    impact: `Build on +${strongestSocial.growth.toLocaleString()} follower momentum`,
    effort: "Medium",
  });

  return {
    summary: strongestSocial
      ? `${strongestSocial.channel} is your clearest acquisition opportunity, while SEO and pricing-page conversion are the fastest ways to strengthen demand capture.`
      : "SEO and pricing-page conversion are the fastest ways to strengthen demand capture while connected channel data is collected.",
    strongestSocial,
    opportunities,
  };
}

export function answerCoachQuestion(question: string, activeChannels: string[]) {
  const analysis = getBusinessAnalysis(activeChannels);
  const normalizedQuestion = question.toLowerCase();
  const matches = analysis.opportunities.filter((opportunity) =>
    `${opportunity.category} ${opportunity.title} ${opportunity.recommendation}`.toLowerCase().split(" ").some((word) => word.length > 4 && normalizedQuestion.includes(word))
  );
  const focus = matches[0] ?? analysis.opportunities[0];
  return {
    answer: `${focus.title}. ${focus.evidence} My recommendation: ${focus.recommendation}`,
    nextStep: focus.recommendation,
    opportunityId: focus.id,
  };
}