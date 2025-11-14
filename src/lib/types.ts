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
  docId: string; // This will be the Firebase document ID
  fcmToken?: string;
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
  docId: string; // This is the unique Firestore document ID
  customId: string; // Custom, sequential ID like FAULT-0001
  status: Status;
  createdAt: any; // Firestore Timestamp
  assignedTo: string; // Worker ID
  updatedAt: any; // Firestore Timestamp
  workerSignature?: string;
  customerSignature?: string;
  actImageUrl?: string;
}
