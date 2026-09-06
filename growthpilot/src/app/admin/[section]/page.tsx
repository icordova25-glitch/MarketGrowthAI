import { notFound, redirect } from "next/navigation";

const sectionRedirects: Record<string, string> = {
  customers: "/admin/customers",
  subscriptions: "/admin/subscriptions",
  reports: "/admin/reports",
  system: "/admin/system",
  settings: "/admin/users",
  product: "/admin/product",
  optimization: "/admin/optimization",
  users: "/admin/users",
  payouts: "/admin/payouts",
  "ai-costs": "/admin/ai-costs",
};

export default async function AdminSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  const destination = sectionRedirects[section];
  if (!destination) notFound();
  redirect(destination);
}
