"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Fault, NewFaultData, Worker } from '@/lib/types';
import { useWorkers } from './workers-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc, addDoc } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FaultsContextType {
  faults: Fault[] | null;
  isLoading: boolean;
  addFault: (faultData: NewFaultData) => void;
  updateFault: (faultId: string, faultData: Partial<Fault>) => void;
}

const FaultsContext = createContext<FaultsContextType | undefined>(undefined);

export const FaultsProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const faultsCollection = useMemoFirebase(() => firestore ? collection(firestore, 'issues') : null, [firestore]);
  const { data: faults, isLoading } = useCollection<Fault>(faultsCollection);
  
  const { workers } = useWorkers();

  const addFault = (faultData: NewFaultData) => {
    if (!faultsCollection || !firestore) {
        console.error("Firestore not initialized, cannot add fault.");
        return;
    }

    // 1. Generate Custom Sequential ID
    let nextIdNumber = 1;
    if (faults && faults.length > 0) {
        const existingIds = faults
            .map(f => f.customId ? parseInt(f.customId.replace('FAULT-', ''), 10) : 0)
            .filter(n => !isNaN(n));
        if (existingIds.length > 0) {
            nextIdNumber = Math.max(...existingIds) + 1;
        }
    }
    const newCustomId = `FAULT-${String(nextIdNumber).padStart(4, '0')}`;

    // 2. Find the best worker to assign the task to
    let assignedWorkerId: string | undefined = undefined;
    let finalStatus: 'new' | 'assigned' = 'new';

    if (workers && workers.length > 0) {
        // Find workers with the right specialty
        const suitableWorkers = workers.filter(worker => worker.specialty.includes(faultData.type));

        if (suitableWorkers.length > 0) {
            // Count active tasks for each suitable worker
            const workerTaskCounts = suitableWorkers.map(worker => {
                const taskCount = (faults || []).filter(f => f.assignedTo === worker.id && f.status !== 'completed').length;
                return { workerId: worker.id, taskCount };
            });

            // Sort workers by task count to find the one with the fewest tasks
            workerTaskCounts.sort((a, b) => a.taskCount - b.taskCount);
            
            assignedWorkerId = workerTaskCounts[0].workerId;
            finalStatus = 'assigned';
        }
    }

    // 3. Prepare the final new fault document
    const newFaultDocument = {
      ...faultData,
      customId: newCustomId,
      status: finalStatus,
      assignedTo: assignedWorkerId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // 4. Add the document to Firestore
    addDoc(faultsCollection, newFaultDocument).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: faultsCollection.path,
          operation: 'create',
          requestResourceData: newFaultDocument,
        })
      );
      console.error("Error adding fault to Firestore:", error);
    });
  };

  const updateFault = (faultId: string, faultData: Partial<Fault>) => {
    if (!firestore) return;
    const faultRef = doc(firestore, 'issues', faultId);
    // Use non-blocking update for better UI responsiveness
    updateDocumentNonBlocking(faultRef, { ...faultData, updatedAt: serverTimestamp() });
  };

  const contextValue = useMemo(() => ({
    faults,
    isLoading,
    addFault,
    updateFault,
  }), [faults, isLoading, workers]);

  return (
    <FaultsContext.Provider value={contextValue}>
      {children}
    </FaultsContext.Provider>
  );
};

export const useFaults = () => {
  const context = useContext(FaultsContext);
  if (context === undefined) {
    throw new Error('useFaults must be used within a FaultsProvider');
  }
  return context;
};