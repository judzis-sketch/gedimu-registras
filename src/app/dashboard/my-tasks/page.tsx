import { workers } from "@/lib/data";
import { DashboardClient } from "../components/dashboard-client";

const MOCK_LOGGED_IN_WORKER_ID = "worker-1";

export default function WorkerTasksPage() {
  // In a real app, you would get the logged-in user and fetch their tasks
  const allWorkers = workers; 

  return <DashboardClient initialWorkers={allWorkers} view="worker" workerId={MOCK_LOGGED_IN_WORKER_ID} />;
}
