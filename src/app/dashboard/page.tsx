import { workers } from "@/lib/data";
import { DashboardClient } from "./components/dashboard-client";

export default function AdminDashboardPage() {
  // In a real app, you would fetch this data from an API
  const allWorkers = workers;

  return <DashboardClient initialWorkers={allWorkers} view="admin" />;
}
