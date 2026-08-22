import { mockSocialData } from "@/lib/mock-data";
import { ScoreRing, StatCard, SectionHeader } from "@/components/ui";

export default function SocialPage() {
  const { instagram, facebook, tiktok, youtube, linkedin } = mockSocialData;

  return (
    <div>
      <SectionHeader
        title="Social Media"
        subtitle="Instagram, Facebook, TikTok, YouTube, and LinkedIn performance"
        icon="📱"
      />

      {/* Score Overview */}
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 mb-8 flex flex-wrap gap-6 items-center">
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
