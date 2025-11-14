export type FaultType = "electricity" | "plumbing" | "heating" | "general";
export type Status = "new" | "assigned" | "in-progress" | "completed";

export interface Worker {
  id: string;
  name: string;
  specialty: FaultType[];
}

export interface Fault {
  id: string;
  reporterName: string;
  reporterEmail: string;
  address: string;
  type: FaultType;
  description: string;
  status: Status;
  createdAt: Date;
  assignedTo?: string; // Worker ID
  updatedAt: Date;
}
