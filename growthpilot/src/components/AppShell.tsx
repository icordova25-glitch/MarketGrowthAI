"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { AdminShell } from "@/components/AdminShell";
import { useAuth } from "@/components/AuthProvider";

const publicRoutes = ["/auth"];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const isPublicRoute = publicRoutes.includes(pathname);
  const isAdminRoute = pathname.startsWith("/admin");

  useEffect(() => {
    if (!isLoading && !user && !isPublicRoute) router.replace("/auth");
    if (!isLoading && user && isPublicRoute) router.replace(user.role === "owner" ? "/admin" : "/");
    if (!isLoading && user && isAdminRoute && user.role !== "owner") router.replace("/");
  }, [isAdminRoute, isLoading, isPublicRoute, pathname, router, user]);

  if (isLoading || (!user && !isPublicRoute) || (user && isPublicRoute) || (user && isAdminRoute && user.role !== "owner")) {
    return <div className="min-h-screen bg-[#0a0f1e]" />;
  }

  if (isPublicRoute) return <main className="min-h-screen">{children}</main>;
  if (isAdminRoute) return <AdminShell>{children}</AdminShell>;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto p-5 md:p-8">{children}</main>
    </div>
  );
}