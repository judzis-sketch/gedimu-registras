"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useCallback } from "react";
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
import { LayoutDashboard, User, Wrench, LogOut, Users, Ban, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "./components/theme-toggle";
import { Button } from "@/components/ui/button";
import { useWorkers } from "@/context/workers-context";
import { useFaults } from "@/context/faults-context";
import { Badge } from "@/components/ui/badge";
import { useAuth, useUser, useMessaging } from "@/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { FaultsProvider } from "@/context/faults-context";
import { WorkersProvider } from "@/context/workers-context";
import { getToken } from "firebase/messaging";
import { firebaseConfig } from "@/firebase/config";

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const auth = useAuth();
  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const role = searchParams.get("role") || "worker";
  
  const { faults, isLoading: faultsLoading } = useFaults();
  const { workers, isLoading: workersLoading, updateWorker } = useWorkers();
  const messaging = useMessaging();

  const requestNotificationPermission = useCallback(async () => {
    const messagingInstance = await messaging;
    if (!messagingInstance || !user) return;
    
    console.log('Requesting notification permission...');
    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted.');
        
        const currentToken = await getToken(messagingInstance, { vapidKey: 'YOUR_VAPID_KEY' }); // You need to generate this in Firebase Console
        
        if (currentToken) {
          console.log('FCM Token:', currentToken);
          const worker = workers?.find(w => w.docId === user.uid);
          if (worker && worker.fcmToken !== currentToken) {
            updateWorker(user.uid, { fcmToken: currentToken });
            console.log('FCM token saved to Firestore.');
          }
        } else {
          console.log('No registration token available. Request permission to generate one.');
        }
      } else {
        console.log('Unable to get permission to notify.');
      }
    } catch (error) {
       console.error('An error occurred while requesting permission or getting token. ', error);
    }
  }, [messaging, user, workers, updateWorker]);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  useEffect(() => {
    if (role === 'worker' && user && messaging) {
      requestNotificationPermission();
    }
  }, [role, user, messaging, requestNotificationPermission]);


  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({ title: "Sėkmingai atsijungėte." });
      router.push("/login");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Atsijungimo klaida",
        description: "Nepavyko atsijungti. Bandykite dar kartą.",
      });
    }
  };
  
  const worker = workers?.find(w => w.docId === user?.uid);
  
  const newFaultsCount = faults?.filter(f => f.status === 'new').length ?? 0;
  const workerTasksCount = faults?.filter(f => f.assignedTo === user?.uid && f.status !== 'completed').length ?? 0;


  const userConfig = {
    admin: {
      name: "Admin",
      role: "Sistemos valdytojas",
      avatar: `https://i.pravatar.cc/150?u=${user?.email}`,
    },
    worker: {
      name: worker?.name || user?.email || "Darbuotojas",
      role: "Specialistas",
      avatar: `https://i.pravatar.cc/150?u=${user?.email}`,
    },
  }[role as "admin" | "worker"] || { name: "Vartotojas", role: "Pranešėjas", avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704f" };

  let title = "Gedimų Registras";
  if (role === 'admin' && pathname === '/dashboard') {
    title = "Visos gedimų užklausos";
  } else if (role === 'admin' && pathname === '/dashboard/workers') {
    title = "Darbuotojų valdymas";
  } else if (role === 'admin' && pathname === '/dashboard/forbidden-words') {
    title = "Nepageidaujami žodžiai";
  } else if (role === 'worker' && pathname === '/dashboard/my-tasks') {
    title = "Mano užduotys";
  } else if (role === 'admin' && pathname === '/dashboard/my-tasks') {
    // When admin views worker's tasks
    title = "Mano užduotys";
  }
  
  if (isUserLoading || workersLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarContent>
          <SidebarHeader>
            <div className="flex items-center gap-2">
              <Logo className="size-7 text-primary" />
              <span className="font-headline text-lg font-semibold">
                Gedimų Registras
              </span>
            </div>
          </SidebarHeader>
          <SidebarMenu>
            {role === 'admin' && (
              <>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard"}
                    tooltip="Visos užklausos"
                  >
                    <Link href={{ pathname: "/dashboard", query: { role: 'admin' } }}>
                      <LayoutDashboard />
                      <span className="flex-1">Visos užklausos</span>
                      {newFaultsCount > 0 && (
                        <Badge className="ml-auto h-5">{newFaultsCount}</Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/workers"}
                    tooltip="Darbuotojai"
                  >
                    <Link href={{ pathname: "/dashboard/workers", query: { role: 'admin' } }}>
                      <Users />
                      <span className="flex-1">Darbuotojai</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                   <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard/forbidden-words"}
                    tooltip="Nepageidaujami žodžiai"
                  >
                    <Link href={{ pathname: "/dashboard/forbidden-words", query: { role: 'admin' } }}>
                      <Ban />
                      <span className="flex-1">Nepageidaujami žodžiai</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </>
            )}
            {(role === 'admin' || role === 'worker') && (
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  isActive={pathname === "/dashboard/my-tasks"}
                  tooltip="Mano užduotys"
                >
                  <Link href={{ pathname: "/dashboard/my-tasks", query: { role: role, view: 'worker' } }}>
                    <Wrench />
                    <span className="flex-1">Mano užduotys</span>
                    {role === 'worker' && workerTasksCount > 0 && (
                      <Badge variant="secondary" className="ml-auto h-5">{workerTasksCount}</Badge>
                    )}
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
             <h1 className="font-headline text-lg font-semibold md:text-xl">
              {title}
            </h1>
          </div>
        </header>
        <main className="flex-1 bg-background p-4 md:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WorkersProvider>
      <FaultsProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </FaultsProvider>
    </WorkersProvider>
  )
}