"use client";

import { useUser } from "@/firebase";
import { DashboardClient } from "../components/dashboard-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";


export default function WorkerTasksPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);

  if (isUserLoading || !user) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }
  
  return <DashboardClient view="worker" />;
}
