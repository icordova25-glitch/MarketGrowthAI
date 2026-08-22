"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/website", label: "Website", icon: "🌐" },
  { href: "/google", label: "Google", icon: "🔍" },
  { href: "/social", label: "Social Media", icon: "📱" },
  { href: "/ai-engine", label: "AI Engine", icon: "🤖" },
  { href: "/insights", label: "Insights", icon: "💡" },
  { href: "/do-it-for-me", label: "Do It For Me", icon: "⚡" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 min-h-screen bg-slate-900 border-r border-slate-800 flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center text-white font-bold text-lg">
            G
          </div>
          <div>
            <div className="font-bold text-white text-lg leading-none">GrowthPilot</div>
            <div className="text-xs text-slate-400 mt-0.5">AI Marketing Platform</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-violet-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-3">
          <div className="text-xs text-slate-400 mb-1">Connected Business</div>
          <div className="text-sm text-white font-medium">Acme Digital Co.</div>
          <div className="text-xs text-slate-500 mt-0.5">acmedigital.com</div>
        </div>
      </div>
    </aside>
  );
}
