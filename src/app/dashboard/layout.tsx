"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { Logo } from "@/components/icons";
import { LayoutDashboard, User, Wrench, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./components/theme-toggle";
import { Button } from "@/components/ui/button";
import React from "react";
import { workers } from "@/lib/data";

const MOCK_LOGGED_IN_WORKER_ID = "worker-1";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const role = searchParams.get("role") || "user";

  const handleLogout = () => {
    router.push("/");
  };
  
  const worker = workers.find(w => w.id === MOCK_LOGGED_IN_WORKER_ID);

  const userConfig = {
    admin: {
      name: "Admin",
      role: "Sistemos valdytojas",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704d",
    },
    worker: {
      name: worker?.name || "Darbuotojas",
      role: "Specialistas",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704e",
    },
    user: {
      name: "Vartotojas",
      role: "Pranešėjas",
      avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f",
    }
  }[role as "admin" | "worker" | "user"] || { name: "Vartotojas", role: "Pranešėjas", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" };

  let title = "Gedimų Registras";
  if (role === 'admin') {
    title = "Visos gedimų užklausos";
  } else if (role === 'worker') {
    title = "Mano užduotys";
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="size-7 text-primary" />
              <span className="text-lg font-headline font-semibold">
                Gedimų Registras
              </span>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {role === 'admin' && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard"}
                  tooltip="Visos užklausos"
                >
                  <Link href={{ pathname: "/dashboard", query: { role: 'admin' } }}>
                    <LayoutDashboard />
                    <span>Visos užklausos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
            {(role === 'admin' || role === 'worker') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/my-tasks"}
                  tooltip="Mano užduotys"
                >
                  <Link href={{ pathname: "/dashboard/my-tasks", query: { role: role } }}>
                    <Wrench />
                    <span>Mano užduotys</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0">
          <SidebarSeparator />
          <div className="flex items-center justify-between p-2">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={userConfig.avatar} />
                <AvatarFallback>{userConfig.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-semibold">{userConfig.name}</span>
                <span className="text-xs text-muted-foreground">
                  {userConfig.role}
                </span>
              </div>
            </div>
             <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handleLogout} title="Atsijungti">
                    <LogOut className="h-4 w-4" />
                </Button>
                <ThemeToggle />
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
          <SidebarTrigger className="md:hidden" />
          <div className="flex-1">
             <h1 className="text-lg font-semibold md:text-xl font-headline">
              {title}
            </h1>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
