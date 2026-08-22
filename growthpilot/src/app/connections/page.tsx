"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, CircleDashed, ExternalLink, Globe2, LineChart, MapPin, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

type BusinessProfile = {
  businessName: string;
  website: string;
  marketingChannels: string[];
};

type Connection = {
  id: string;
  name: string;
  description: string;
  category: "Website" | "Google" | "Social" | "Email";
};

const connectionCatalog: Connection[] = [
  { id: "website", name: "Website", description: "Website and on-page SEO analysis", category: "Website" },
  { id: "search-console", name: "Google Search Console", description: "Search visibility, keywords, and click-through data", category: "Google" },
  { id: "analytics", name: "Google Analytics", description: "Traffic, engagement, and conversion data", category: "Google" },
  { id: "business-profile", name: "Google Business Profile", description: "Local discovery, reviews, and map performance", category: "Google" },
  { id: "instagram", name: "Instagram", description: "Reach, engagement, and content performance", category: "Social" },
  { id: "facebook", name: "Facebook", description: "Audience, content, and campaign performance", category: "Social" },
  { id: "tiktok", name: "TikTok", description: "Video reach and engagement signals", category: "Social" },
  { id: "youtube", name: "YouTube", description: "Video performance and audience retention", category: "Social" },
  { id: "linkedin", name: "LinkedIn", description: "Professional audience and content performance", category: "Social" },
  { id: "email", name: "Email marketing", description: "Campaign performance and subscriber growth", category: "Email" },
];

const icons = {
  Website: Globe2,
  Google: LineChart,
  Social: Share2,
  Email: ExternalLink,
};

function includedConnections(profile: BusinessProfile | null) {
  if (!profile) return [];
  const selected = new Set(profile.marketingChannels ?? []);
  return connectionCatalog.filter((connection) =>
    connection.id === "website" ||
    (connection.id === "search-console" || connection.id === "analytics") && selected.has("Website") ||
    connection.id === "business-profile" && selected.has("Google Business Profile") ||
    selected.has(connection.name)
  );
}

export default function ConnectionsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [connected, setConnected] = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedProfile = window.localStorage.getItem("marketgrowthai.business");
      const storedConnections = window.localStorage.getItem("marketgrowthai.connections");
      if (storedProfile) {
        const parsedProfile = JSON.parse(storedProfile) as BusinessProfile;
        setProfile(parsedProfile);
        setConnected({ website: Boolean(parsedProfile.website), ...(storedConnections ? JSON.parse(storedConnections) as Record<string, boolean> : {}) });
      } else {
        router.replace("/onboarding");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [router]);

  function toggleConnection(connectionId: string) {
    setConnected((current) => {
      const next = { ...current, [connectionId]: !current[connectionId] };
      window.localStorage.setItem("marketgrowthai.connections", JSON.stringify(next));
      return next;
    });
  }

  if (!profile) return <div className="min-h-[calc(100vh-4rem)]" />;

  const connections = includedConnections(profile);
  const connectedCount = connections.filter((connection) => connected[connection.id]).length;

  return (
    <div className="mx-auto max-w-4xl py-8">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-cyan-300">Workspace setup · Step 4</p>
        <h1 className="mt-2 text-3xl font-bold text-white">Connect what already powers your marketing.</h1>
        <p className="mt-2 max-w-2xl text-slate-400">Start with the accounts you use today. MarketGrowthAI will build your analysis around the data you choose to share.</p>
      </div>

      <div className="mb-6 flex flex-col justify-between gap-4 border border-slate-700 bg-slate-900 p-5 sm:flex-row sm:items-center">
        <div><p className="text-sm font-semibold text-white">{profile.businessName || "Your business"}</p><p className="mt-1 text-sm text-slate-400">{connectedCount} of {connections.length} sources connected</p></div>
        <div className="flex items-center gap-2 text-sm font-medium text-cyan-200"><CheckCircle2 size={18} />Connections are optional</div>
      </div>

      <div className="space-y-3">
        {connections.map((connection) => {
          const Icon = icons[connection.category];
          const isConnected = Boolean(connected[connection.id]);
          return <article key={connection.id} className="flex flex-col gap-4 border border-slate-700 bg-slate-900 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4"><div className="flex size-10 shrink-0 items-center justify-center bg-cyan-400/10 text-cyan-300"><Icon size={20} /></div><div><h2 className="font-semibold text-white">{connection.name}</h2><p className="mt-1 text-sm text-slate-400">{connection.id === "website" ? profile.website : connection.description}</p></div></div>
            <button type="button" onClick={() => toggleConnection(connection.id)} className={`flex min-w-32 items-center justify-center gap-2 border px-4 py-2.5 text-sm font-semibold transition-colors ${isConnected ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20" : "border-cyan-400 bg-cyan-400 text-slate-950 hover:bg-cyan-300"}`}>
              {isConnected ? <><CheckCircle2 size={17} />Connected</> : <><CircleDashed size={17} />Connect</>}
            </button>
          </article>;
        })}
      </div>

      <div className="mt-8 flex flex-col gap-4 border-t border-slate-800 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-slate-400"><MapPin size={17} className="text-cyan-300" />You can add, remove, or reconnect sources any time.</p><button type="button" onClick={() => router.replace("/")} className="flex items-center justify-center gap-2 bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">Open dashboard<ArrowRight size={17} /></button></div>
    </div>
  );
}