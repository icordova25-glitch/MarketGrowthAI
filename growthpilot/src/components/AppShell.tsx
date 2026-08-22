"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/components/AuthProvider";

const publicRoutes = ["/auth"];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) router.replace("/auth");
    if (!isLoading && user && isPublicRoute) router.replace("/onboarding");
  }, [isLoading, isPublicRoute, pathname, router, user]);

  if (isLoading || (!user && !isPublicRoute) || (user && isPublicRoute)) {
    return <div className="min-h-screen bg-[#0a0f1e]" />;
  }

  if (isPublicRoute) return <main className="min-h-screen">{children}</main>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-5 md:p-8">{children}</main>
    </div>
  );
}