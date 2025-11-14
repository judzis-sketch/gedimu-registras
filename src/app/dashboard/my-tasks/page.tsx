import { DashboardClient } from "../components/dashboard-client";

const MOCK_LOGGED_IN_WORKER_ID = "worker-1";

export default function WorkerTasksPage() {
  return <DashboardClient view="worker" workerId={MOCK_LOGGED_IN_WORKER_ID} />;
}
