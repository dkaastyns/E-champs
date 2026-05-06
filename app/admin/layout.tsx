import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar-provider";
import { SidebarContent } from "@/components/ui/sidebar-content";

export const metadata: Metadata = {
  title: "Admin | E-Champs",
  description: "Tournament administration panel",
};

export default async function AdminLayout({
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

  if (session.user.role !== "admin") {
    redirect("/unauthorized");
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-[#080808] overflow-x-hidden">
        <AdminSidebar user={session.user} />
        <SidebarContent>
          {children}
        </SidebarContent>
      </div>
    </SidebarProvider>
  );
}
