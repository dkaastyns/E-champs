import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { UserSidebar } from "@/components/dashboard/UserSidebar";
import { SidebarProvider } from "@/components/ui/sidebar-provider";
import { SidebarContent } from "@/components/ui/sidebar-content";

export const metadata: Metadata = {
  title: "Dashboard | E-Champs",
  description: "Manage your tournament registrations and teams",
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "admin") {
    redirect("/admin");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#080808] flex">
        <UserSidebar user={session.user} />
        <SidebarContent>
          {children}
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
}
