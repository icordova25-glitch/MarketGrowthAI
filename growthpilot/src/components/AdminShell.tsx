"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Activity, BarChart3, BrainCircuit, Calculator, CreditCard, LayoutDashboard, Landmark, LogOut, Settings, SlidersHorizontal, UsersRound } from "lucide-react";
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

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  return <div className="flex min-h-screen bg-[#08131f]"><aside className="flex w-64 shrink-0 flex-col border-r border-cyan-950 bg-[#0d1f2d]"><div className="border-b border-cyan-950 p-6"><div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center bg-cyan-400 font-bold text-slate-950">M</div><div><p className="font-bold text-white">MarketGrowthAI</p><p className="text-xs text-cyan-200">Platform administration</p></div></div></div><nav className="flex-1 overflow-y-auto p-4">{adminNavigation.map((group) => <div key={group.label} className="mb-4 last:mb-0"><p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">{group.label}</p>{group.items.map((item) => { const Icon = item.icon; const active = pathname === item.href; return <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-cyan-400 text-slate-950" : "text-slate-300 hover:bg-slate-800 hover:text-white"}`}><Icon size={16} />{item.label}</Link>; })}</div>)}</nav><div className="border-t border-cyan-950 p-4"><div className="border border-slate-700 bg-slate-900/70 p-3"><p className="text-xs text-slate-400">Owner account</p><p className="mt-1 truncate text-sm font-medium text-white">{user?.email}</p></div><Link href="/" className="mt-3 block text-center text-xs font-semibold text-cyan-200 hover:text-cyan-100">Return to customer portal</Link><button type="button" onClick={handleSignOut} className="mt-3 flex w-full items-center justify-center gap-2 border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"><LogOut size={14} />Sign out</button></div></aside><main className="min-w-0 flex-1 overflow-auto p-5 md:p-8">{children}</main></div>;
}