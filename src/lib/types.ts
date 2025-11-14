export type FaultType = "electricity" | "plumbing" | "heating" | "general";
export type Status = "new" | "assigned" | "in-progress" | "completed";

export interface Worker {
  id: string;
  name: string;
  specialty: FaultType[];
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
}
