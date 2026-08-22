interface ScoreRingProps {
  score: number;
  label: string;
  size?: "sm" | "md" | "lg";
}

function getScoreColor(score: number) {
  if (score >= 80) return { stroke: "#22c55e", text: "text-green-400" };
  if (score >= 60) return { stroke: "#f59e0b", text: "text-amber-400" };
  return { stroke: "#ef4444", text: "text-red-400" };
}

export function ScoreRing({ score, label, size = "md" }: ScoreRingProps) {
  const { stroke, text } = getScoreColor(score);
  const sizes = { sm: 64, md: 96, lg: 140 };
  const strokeWidths = { sm: 5, md: 7, lg: 10 };
  const dim = sizes[size];
  const sw = strokeWidths[size];
  const r = (dim - sw * 2) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: dim, height: dim }}>
        <svg width={dim} height={dim} className="-rotate-90">
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke="#1e293b"
            strokeWidth={sw}
          />
          <circle
            cx={dim / 2}
            cy={dim / 2}
            r={r}
            fill="none"
            stroke={stroke}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-700"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`font-bold ${text} ${size === "lg" ? "text-3xl" : size === "md" ? "text-2xl" : "text-sm"}`}>
            {score}
          </span>
        </div>
      </div>
      <span className="text-xs text-slate-400 text-center">{label}</span>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: string;
  suffix?: string;
}

export function StatCard({ label, value, change, icon, suffix }: StatCardProps) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
      <div className="flex items-start justify-between mb-2">
        <span className="text-slate-400 text-sm">{label}</span>
        {icon && <span className="text-xl">{icon}</span>}
      </div>
      <div className="text-2xl font-bold text-white">
        {value}
        {suffix && <span className="text-base font-normal text-slate-400 ml-1">{suffix}</span>}
      </div>
      {change !== undefined && (
        <div className={`text-sm mt-1 ${change >= 0 ? "text-green-400" : "text-red-400"}`}>
          {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
        </div>
      )}
    </div>
  );
}

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  icon?: string;
}

export function SectionHeader({ title, subtitle, icon }: SectionHeaderProps) {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h1>
      {subtitle && <p className="text-slate-400 mt-1 text-sm">{subtitle}</p>}
    </div>
  );
}

interface InsightBadgeProps {
  priority: "critical" | "high" | "medium" | "low";
}

const priorityConfig = {
  critical: { label: "Critical", className: "bg-red-900/50 text-red-400 border-red-800" },
  high: { label: "High", className: "bg-orange-900/50 text-orange-400 border-orange-800" },
  medium: { label: "Medium", className: "bg-amber-900/50 text-amber-400 border-amber-800" },
  low: { label: "Low", className: "bg-slate-700 text-slate-400 border-slate-600" },
};

export function PriorityBadge({ priority }: InsightBadgeProps) {
  const config = priorityConfig[priority];
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${config.className}`}>
      {config.label}
    </span>
  );
}
