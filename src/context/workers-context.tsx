"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
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

  const addWorker = useCallback(async (workerData: NewWorkerData) => {
    if (!firestore || !auth || !workerData.password) {
      throw new Error("Firestore, Auth, or password not available.");
    }
    
    // This approach has a race condition where user can be created but doc fails.
    // For a real app, use Firebase Functions to handle user creation transactionally.
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, workerData.email, workerData.password);
        const { password, ...workerDocData } = workerData;
        const workerRef = doc(firestore, 'employees', userCredential.user.uid);
        // Use non-blocking update for consistency
        setDocumentNonBlocking(workerRef, { ...workerDocData, role: 'worker' }, { merge: false });
    } catch (error) {
        console.error("Error creating worker:", error);
        throw error; // Re-throw to be handled by the form
    }
  }, [firestore, auth]);
  
  const updateWorker = useCallback((workerId: string, workerData: Partial<NewWorkerData>) => {
    if (!firestore) return;
    const workerRef = doc(firestore, 'employees', workerId);
    // Password should not be part of the update data for a worker profile
    const { password, ...updateData } = workerData;
    setDocumentNonBlocking(workerRef, updateData, { merge: true });
  }, [firestore]);

  const deleteWorker = useCallback((workerId: string) => {
    // Note: This only deletes the Firestore document, not the Firebase Auth user.
    // Deleting the auth user requires admin privileges, typically via Firebase Functions.
    if (!firestore) return;
    const workerRef = doc(firestore, 'employees', workerId);
    deleteDocumentNonBlocking(workerRef);
  }, [firestore]);

  const contextValue = useMemo(() => ({
    workers,
    isLoading,
    addWorker,
    updateWorker,
    deleteWorker,
  }), [workers, isLoading, addWorker, updateWorker, deleteWorker]);

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
