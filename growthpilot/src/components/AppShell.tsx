"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, X } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/components/AuthProvider";

const publicRoutes = ["/auth"];

const customerNavItems = [
  { href: "/", label: "Dashboard", icon: "🏠" },
  { href: "/website", label: "Website", icon: "🌐" },
  { href: "/google", label: "Google", icon: "🔍" },
  { href: "/social", label: "Social Media", icon: "📱" },
  { href: "/content", label: "Content Studio", icon: "✍️" },
  { href: "/automation", label: "Automation", icon: "⚙️" },
  { href: "/competitive", label: "Competitive Intel", icon: "◈" },
  { href: "/billing", label: "Billing & Plans", icon: "◫" },
  { href: "/ai-engine", label: "AI Engine", icon: "🤖" },
  { href: "/insights", label: "Insights", icon: "💡" },
  { href: "/do-it-for-me", label: "Do It For Me", icon: "⚡" },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) router.replace("/auth");
    if (!isLoading && user && isPublicRoute) router.replace(user.role === "owner" ? "/admin" : "/");
    if (!isLoading && user && isAdminRoute && user.role !== "owner") router.replace("/");
  }, [isAdminRoute, isLoading, isPublicRoute, pathname, router, user]);

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  if (isLoading || (!user && !isPublicRoute) || (user && isPublicRoute) || (user && isAdminRoute && user.role !== "owner")) {
    return <div className="min-h-screen bg-[#0a0f1e]" />;
  }

  if (isPublicRoute) return <main className="min-h-screen">{children}</main>;
  if (isAdminRoute) return <AdminShell>{children}</AdminShell>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-800 bg-[#0a0f1e]/95 px-4 py-3 backdrop-blur md:hidden">
          <div>
            <p className="text-sm font-semibold text-white">MarketGrowthAI</p>
            <p className="text-xs text-slate-400">AI Marketing Platform</p>
          </div>
          <button
            type="button"
            onClick={() => setIsMenuOpen((value) => !value)}
            aria-label="Toggle navigation"
            className="rounded border border-slate-700 p-2 text-slate-200"
          >
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="absolute inset-0 bg-black/50"
              aria-label="Close menu"
            />
            <nav className="absolute left-0 top-0 h-full w-[85vw] max-w-xs overflow-y-auto border-r border-slate-800 bg-slate-900 p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-semibold text-white">Navigation</p>
                <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded border border-slate-700 p-1.5 text-slate-300" aria-label="Close navigation">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-1">
                {customerNavItems.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium ${active ? "bg-violet-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}
                    >
                      <span className="text-base">{item.icon}</span>
                      {item.label}
                    </Link>
                  );
                })}
              </div>
              <div className="mt-5 border-t border-slate-800 pt-4">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="mt-1 truncate text-sm font-medium text-white">{user?.name || user?.email}</p>
                <p className="truncate text-xs text-slate-500">{user?.email}</p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </nav>
          </div>
        )}

        <main className="min-w-0 overflow-auto p-4 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}