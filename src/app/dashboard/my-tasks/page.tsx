"use client";

import { useUser } from "@/firebase";
import { DashboardClient } from "../components/dashboard-client";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";


export default function WorkerTasksPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  if (isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!user) {
    router.push('/login');
    return null;
  }
  
  return <DashboardClient view="worker" workerId={user.uid} />;
}
