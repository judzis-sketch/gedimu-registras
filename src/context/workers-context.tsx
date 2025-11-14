"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { NewWorkerData, Worker } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import { setDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase/provider';


interface WorkersContextType {
  workers: Worker[] | null;
  isLoading: boolean;
  addWorker: (workerData: NewWorkerData) => Promise<void>;
  updateWorker: (workerId: string, workerData: Partial<NewWorkerData>) => void;
  deleteWorker: (workerId: string) => void;
}

const WorkersContext = createContext<WorkersContextType | undefined>(undefined);

export const WorkersProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const auth = useAuth();
  const workersCollection = useMemoFirebase(() => collection(firestore, 'employees'), [firestore]);
  const { data: workers, isLoading } = useCollection<Worker>(workersCollection);

  const addWorker = async (workerData: NewWorkerData) => {
    if (!firestore) return;
    if (!workerData.password) {
      throw new Error("Password is required to create a new worker.");
    }
    // This is a temporary solution. Ideally, you would use Firebase Functions
    // to create the user and the doc in a transaction.
    // This approach has a race condition where user can be created but doc fails.
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, workerData.email, workerData.password);
        const { password, ...workerDocData } = workerData;
        const workerRef = doc(firestore, 'employees', userCredential.user.uid);
        // Use non-blocking update for consistency
        setDocumentNonBlocking(workerRef, workerDocData, { merge: false });
    } catch (error) {
        console.error("Error creating worker: ", error);
        // Here you might want to delete the created user if the doc creation failed
        throw error; // Re-throw to be handled by the form
    }
  };
  
  const updateWorker = (workerId: string, workerData: Partial<NewWorkerData>) => {
    if (!firestore) return;
    const workerRef = doc(firestore, 'employees', workerId);
    setDocumentNonBlocking(workerRef, workerData, { merge: true });
  };

  const deleteWorker = (workerId: string) => {
    // Note: This only deletes the Firestore document, not the Firebase Auth user.
    // Deleting the auth user requires admin privileges, typically via Firebase Functions.
    if (!firestore) return;
    const workerRef = doc(firestore, 'employees', workerId);
    deleteDocumentNonBlocking(workerRef);
  };

  const contextValue = useMemo(() => ({
    workers,
    isLoading,
    addWorker,
    updateWorker,
    deleteWorker,
  }), [workers, isLoading]);

  return (
    <WorkersContext.Provider value={contextValue}>
      {children}
    </WorkersContext.Provider>
  );
};

export const useWorkers = () => {
  const context = useContext(WorkersContext);
  if (context === undefined) {
    throw new Error('useWorkers must be used within a WorkersProvider');
  }
  return context;
};
