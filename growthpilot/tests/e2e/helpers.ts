import { Page } from "@playwright/test";

export const mockAnalysisPayload = {
  profile: {
    businessName: "Demo Business",
    website: "https://demo.example.com",
    industry: "Services",
    businessType: "Local",
    city: "Austin",
    state: "TX",
    marketingChannels: ["instagram", "google"],
  },
  analysis: {
    overallScore: 62,
    summary: "Demo analysis summary.",
    strongestSocial: {
      channel: "Instagram",
      score: 74,
      engagement: 51,
    },
    opportunities: [
      {
        id: "opp-1",
        priority: "high",
        category: "Content",
        title: "Publish practical guides",
        evidence: "Strong social response",
        recommendation: "Turn top posts into evergreen content.",
        impact: "Increase qualified traffic",
        effort: "Medium",
      },
    ],
    dimensions: [
      { key: "seo", label: "SEO", score: 42 },
      { key: "social", label: "Social", score: 64 },
      { key: "instagram", label: "Instagram", score: 69 },
    ],
    activeChannels: ["Instagram", "Google"],
  },
};

export async function bootstrapDemoSession(page: Page) {
  const userId = `demo-e2e-${Date.now()}`;
  await page.addInitScript(({ id }) => {
    window.localStorage.setItem(
      "marketgrowthai.demo-session",
      JSON.stringify({
        id,
        email: "e2e@example.com",
        name: "E2E Runner",
        role: "customer",
      })
    );
  }, { id: userId });
}

export function tomorrowIsoDate() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}
