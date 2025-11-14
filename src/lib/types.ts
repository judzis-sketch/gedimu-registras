export type FaultType = "electricity" | "plumbing" | "renovation" | "general";
export type Status = "new" | "assigned" | "in-progress" | "completed";

export interface NewWorkerData {
  name: string;
  email: string;
  password?: string;
  specialty: FaultType[];
  fcmToken?: string; // For push notifications
}

export interface Worker extends Omit<NewWorkerData, 'password'> {
  id: string; // This will be the Firebase Auth UID
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
  createdAt: any; // Firestore Timestamp
  assignedTo?: string; // Worker ID
  updatedAt: any; // Firestore Timestamp
  workerSignature?: string;
  customerSignature?: string;
  actImageUrl?: string;
}
