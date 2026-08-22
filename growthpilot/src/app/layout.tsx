import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "GrowthPilot – AI Marketing & Business Growth Platform",
  description:
    "Analyze your entire digital presence and get AI-powered actionable insights to grow your business.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-[#0a0f1e]">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-8 overflow-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
