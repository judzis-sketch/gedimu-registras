export type FaultType = "electricity" | "plumbing" | "heating" | "general";
export type Status = "new" | "assigned" | "in-progress" | "completed";

export interface NewWorkerData {
  name: string;
  email: string;
  password: string;
  specialty: FaultType[];
}

export interface Worker extends NewWorkerData {
  id: string;
}

export interface NewFaultData {
    reporterName: string;
    reporterEmail: string;
    reporterPhone: string;
    address: string;
    type: FaultType;
    description: string;
}

export interface Fault extends NewFaultData {
  id: string;
  status: Status;
  createdAt: Date;
  assignedTo?: string; // Worker ID
  updatedAt: Date;
  workerSignature?: string;
  customerSignature?: string;
  actImageUrl?: string;
}
