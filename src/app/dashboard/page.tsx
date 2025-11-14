import { faults, workers } from "@/lib/data";
import { DashboardClient } from "./components/dashboard-client";

export default function AdminDashboardPage() {
  // In a real app, you would fetch this data from an API
  const allFaults = faults;
  const allWorkers = workers;

  return <DashboardClient initialFaults={allFaults} initialWorkers={allWorkers} view="admin" />;
}
