"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, BrainCircuit, Calculator, CreditCard, LayoutDashboard, Landmark, LogOut, Menu, Settings, SlidersHorizontal, UsersRound, X } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const adminNavigation = [
  { label: "Overview", items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }] },
  { label: "Customer", items: [{ href: "/admin/customers", label: "Customers", icon: UsersRound }] },
  { label: "Revenue", items: [{ href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard }, { href: "/admin/payouts", label: "Payouts & Stripe", icon: Landmark }] },
  { label: "Reports", items: [{ href: "/admin/reports", label: "Reports", icon: BarChart3 }] },
  { label: "Optimization", items: [{ href: "/admin/optimization", label: "AI Insights", icon: BrainCircuit }, { href: "/admin/product", label: "Feature adoption", icon: SlidersHorizontal }, { href: "/admin/ai-costs", label: "AI cost optimization", icon: Calculator }] },
  { label: "System", items: [{ href: "/admin/system", label: "System health", icon: Activity }] },
  { label: "Settings", items: [{ href: "/admin/settings", label: "Settings", icon: Settings }, { href: "/admin/users", label: "Admin users", icon: UsersRound }] },
];

export function AdminShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  return (
    <div className="flex min-h-screen bg-[#08131f]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-cyan-950 bg-[#0d1f2d] md:flex">
        <div className="border-b border-cyan-950 p-6">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center bg-cyan-400 font-bold text-slate-950">M</div>
            <div>
              <p className="font-bold text-white">MarketGrowthAI</p>
              <p className="text-xs text-cyan-200">Platform administration</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">
          {adminNavigation.map((group) => (
            <div key={group.label} className="mb-4 last:mb-0">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}>
                    <Icon size={16} />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-cyan-950 p-4">
          <div className="border border-slate-700 bg-slate-900/70 p-3">
            <p className="text-xs text-slate-400">Owner account</p>
            <p className="mt-1 truncate text-sm font-medium text-white">{user?.email}</p>
          </div>
          <Link href="/" className="mt-3 block text-center text-xs font-semibold text-cyan-200 hover:text-cyan-100">Return to customer portal</Link>
          <button type="button" onClick={handleSignOut} className="mt-3 flex w-full items-center justify-center gap-2 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white">
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-cyan-950 bg-[#0d1f2d]/95 px-4 py-3 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center bg-cyan-400 text-xs font-bold text-slate-950">M</div>
            <div>
              <p className="text-sm font-semibold text-white">Admin</p>
              <p className="text-[11px] text-cyan-200">Platform operations</p>
            </div>
          </div>
          <button type="button" onClick={() => setIsMenuOpen((value) => !value)} className="rounded border border-slate-700 p-2 text-slate-200" aria-label="Toggle admin navigation">
            {isMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {isMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true">
            <button type="button" onClick={() => setIsMenuOpen(false)} className="absolute inset-0 bg-black/50" aria-label="Close menu" />
            <aside className="absolute left-0 top-0 h-full w-[88vw] max-w-xs overflow-y-auto border-r border-cyan-950 bg-[#0d1f2d] p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-base font-semibold text-white">Admin navigation</p>
                <button type="button" onClick={() => setIsMenuOpen(false)} className="rounded border border-slate-700 p-1.5 text-slate-300" aria-label="Close navigation">
                  <X size={16} />
                </button>
              </div>
              {adminNavigation.map((group) => (
                <div key={group.label} className="mb-4 last:mb-0">
                  <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const active = pathname === item.href;
                    return (
                      <Link key={item.href} href={item.href} onClick={() => setIsMenuOpen(false)} className={`flex items-center gap-3 rounded px-3 py-2 text-sm font-medium ${active ? "bg-cyan-400 text-slate-950" : "text-slate-200 hover:bg-slate-800 hover:text-white"}`}>
                        <Icon size={16} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              ))}
              <div className="mt-5 border-t border-cyan-950 pt-4">
                <p className="text-xs text-slate-400">Owner account</p>
                <p className="mt-1 truncate text-sm font-medium text-white">{user?.email}</p>
                <Link href="/" onClick={() => setIsMenuOpen(false)} className="mt-3 block text-center text-xs font-semibold text-cyan-200 hover:text-cyan-100">Return to customer portal</Link>
                <button type="button" onClick={handleSignOut} className="mt-3 flex w-full items-center justify-center gap-2 rounded border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white">
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </aside>
          </div>
        )}

        <main className="min-w-0 overflow-auto p-4 sm:p-5 md:p-8">{children}</main>
      </div>
    </div>
  );
}