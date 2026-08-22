import { mockSocialData } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader } from "@/components/ui";
import { ArrowUpRight, Lightbulb, Sparkles, TrendingUp } from "lucide-react";

export default function SocialPage() {
  const { instagram, facebook, tiktok, youtube, linkedin } = mockSocialData;
  const totalReach = instagram.reach + facebook.reach + tiktok.totalViews + youtube.views + linkedin.impressions;
  const performance = [
    { name: "TikTok", score: tiktok.score, engagement: tiktok.engagementRate, signal: "Fastest audience growth" },
    { name: "Instagram", score: instagram.score, engagement: instagram.engagementRate, signal: "Strong community response" },
    { name: "LinkedIn", score: linkedin.score, engagement: linkedin.engagementRate, signal: "Best B2B conversation" },
    { name: "Facebook", score: facebook.score, engagement: facebook.engagementRate, signal: "Needs a content reset" },
    { name: "YouTube", score: youtube.score, engagement: 0, signal: "Long-term discovery play" },
  ];

  return (
    <div>
      <SectionHeader
        title="Social performance"
        subtitle="A single read on where your audience is responding and where to focus next."
        icon="✦"
      />

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="border border-cyan-500/30 bg-[#102a43] p-6">
          <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-300">Social Growth Score</p><p className="mt-2 text-5xl font-bold text-white">71<span className="ml-1 text-lg font-medium text-slate-400">/100</span></p><p className="mt-3 text-sm text-slate-300">Your social presence is growing, led by short-form video and high-intent LinkedIn engagement.</p></div><TrendingUp className="text-cyan-300" size={28} /></div>
          <div className="mt-6 grid grid-cols-2 gap-3 border-t border-cyan-100/15 pt-5"><div><p className="text-xs text-slate-400">Audience reached</p><p className="mt-1 text-xl font-bold text-white">{Math.round(totalReach / 1000)}K</p></div><div><p className="text-xs text-slate-400">Fastest growth</p><p className="mt-1 text-xl font-bold text-white">TikTok <span className="text-sm text-emerald-300">+{tiktok.followersChange}</span></p></div></div>
        </section>
        <section className="border border-slate-700 bg-slate-900 p-6"><div className="flex items-start gap-3"><Lightbulb size={21} className="mt-0.5 text-amber-300" /><div><p className="font-semibold text-white">AI opportunity</p><p className="mt-2 text-sm leading-6 text-slate-300">TikTok engagement is {tiktok.engagementRate}% - more than three times Instagram. Turn your highest-performing clips into a recurring weekly series.</p><button type="button" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-cyan-300 hover:text-cyan-200">Create content plan <ArrowUpRight size={15} /></button></div></div></section>
      </div>

      <section className="mb-8 border border-slate-700 bg-slate-900 p-5"><div className="mb-4 flex items-center gap-2"><Sparkles size={19} className="text-cyan-300" /><div><h2 className="text-lg font-semibold text-white">Channel comparison</h2><p className="text-xs text-slate-400">Performance is ranked by content response, audience growth, and consistency.</p></div></div><div className="grid gap-3 md:grid-cols-5">{performance.map((channel) => <div key={channel.name} className="border border-slate-700 bg-slate-950/40 p-4"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-white">{channel.name}</p><span className="text-sm font-bold text-cyan-300">{channel.score}</span></div><div className="mt-3 h-1.5 bg-slate-800"><div className="h-full bg-cyan-400" style={{ width: `${channel.score}%` }} /></div><p className="mt-3 text-xs text-slate-400">{channel.engagement ? `${channel.engagement}% engagement` : "Discovery metric"}</p><p className="mt-1 text-xs text-slate-500">{channel.signal}</p></div>)}</div></section>

      {/* Score Overview */}
      <div className="bg-slate-800 border border-slate-700 p-6 mb-8 flex flex-wrap gap-6 items-center">
        <ScoreRing score={instagram.score} label="Instagram" size="sm" />
        <ScoreRing score={facebook.score} label="Facebook" size="sm" />
        <ScoreRing score={tiktok.score} label="TikTok" size="sm" />
        <ScoreRing score={youtube.score} label="YouTube" size="sm" />
        <ScoreRing score={linkedin.score} label="LinkedIn" size="sm" />
      </div>

      {/* Instagram */}
      <h2 className="text-lg font-semibold text-white mb-4">📸 Instagram</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Followers" value={instagram.followers.toLocaleString()} change={instagram.followersChange} icon="👥" />
        <StatCard label="Engagement Rate" value={`${instagram.engagementRate}%`} icon="❤️" />
        <StatCard label="Posts" value={instagram.posts} icon="📷" />
        <StatCard label="Reach" value={instagram.reach.toLocaleString()} icon="📡" />
      </div>
      <PlatformTopPosts posts={instagram.topPosts} fields={["likes", "comments", "reach"]} className="mb-8" />

      {/* Facebook */}
      <h2 className="text-lg font-semibold text-white mb-4">👍 Facebook</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Followers" value={facebook.followers.toLocaleString()} change={facebook.followersChange} icon="👥" />
        <StatCard label="Engagement Rate" value={`${facebook.engagementRate}%`} icon="👍" />
        <StatCard label="Posts" value={facebook.posts} icon="📝" />
        <StatCard label="Reach" value={facebook.reach.toLocaleString()} icon="📡" />
      </div>
      <PlatformTopPosts posts={facebook.topPosts} fields={["likes", "comments", "reach"]} className="mb-8" />

      {/* TikTok */}
      <h2 className="text-lg font-semibold text-white mb-4">🎵 TikTok</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Followers" value={tiktok.followers.toLocaleString()} change={tiktok.followersChange} icon="👥" />
        <StatCard label="Engagement Rate" value={`${tiktok.engagementRate}%`} icon="🔥" />
        <StatCard label="Videos" value={tiktok.videos} icon="🎬" />
        <StatCard label="Total Views" value={tiktok.totalViews.toLocaleString()} icon="👁️" />
      </div>
      <PlatformTopPosts posts={tiktok.topVideos} fields={["views", "likes", "shares"]} className="mb-8" />

      {/* YouTube */}
      <h2 className="text-lg font-semibold text-white mb-4">▶️ YouTube</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Subscribers" value={youtube.subscribers.toLocaleString()} change={youtube.subscribersChange} icon="🔔" />
        <StatCard label="Total Views" value={youtube.views.toLocaleString()} icon="👁️" />
        <StatCard label="Watch Hours" value={`${youtube.watchHours}h`} icon="⏱️" />
        <StatCard label="Videos" value={youtube.videos} icon="🎥" />
      </div>
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-white mb-3">Top Videos</h3>
        <div className="space-y-2">
          {youtube.topVideos.map((v, i) => (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="text-slate-300">{v.title}</span>
              <div className="flex gap-4 text-slate-500 text-xs">
                <span>{v.views.toLocaleString()} views</span>
                <span>{v.likes} likes</span>
                <span>{v.comments} comments</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LinkedIn */}
      <h2 className="text-lg font-semibold text-white mb-4">💼 LinkedIn</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <StatCard label="Followers" value={linkedin.followers.toLocaleString()} change={linkedin.followersChange} icon="👥" />
        <StatCard label="Engagement Rate" value={`${linkedin.engagementRate}%`} icon="💬" />
        <StatCard label="Posts" value={linkedin.posts} icon="📋" />
        <StatCard label="Impressions" value={linkedin.impressions.toLocaleString()} icon="📡" />
      </div>
      <PlatformTopPosts posts={linkedin.topPosts} fields={["likes", "comments", "shares"]} />
    </div>
  );
}

interface Post {
  caption?: string;
  title?: string;
  likes?: number;
  comments?: number;
  reach?: number;
  views?: number;
  shares?: number;
}

function PlatformTopPosts({
  posts,
  fields,
  className = "",
}: {
  posts: Post[];
  fields: string[];
  className?: string;
}) {
  return (
    <div className={`bg-slate-800 border border-slate-700 rounded-xl p-5 ${className}`}>
      <h3 className="text-sm font-semibold text-white mb-3">Top Posts</h3>
      <div className="space-y-2">
        {posts.map((p, i) => (
          <div key={i} className="flex items-start justify-between text-sm gap-4">
            <span className="text-slate-300 flex-1">{p.caption ?? p.title}</span>
            <div className="flex gap-4 text-slate-500 text-xs shrink-0">
              {fields.map((f) => (
                <span key={f}>
                  {f}: {((p as Record<string, number | string | undefined>)[f] as number | undefined)?.toLocaleString()}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
