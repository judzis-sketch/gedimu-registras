import { faults, workers } from "@/lib/data";
import { DashboardClient } from "../components/dashboard-client";

const MOCK_LOGGED_IN_WORKER_ID = "worker-1";

export default function WorkerTasksPage() {
  // In a real app, you would get the logged-in user and fetch their tasks
  const assignedFaults = faults.filter(fault => fault.assignedTo === MOCK_LOGGED_IN_WORKER_ID && fault.status !== 'completed');
  const allWorkers = workers; // Needed for display, though not for assignment in this view

  return <DashboardClient initialFaults={assignedFaults} initialWorkers={allWorkers} view="worker" />;
}
