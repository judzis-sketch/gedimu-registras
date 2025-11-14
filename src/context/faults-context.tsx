"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Fault, NewFaultData, Worker } from '@/lib/types';
import { useWorkers } from './workers-context';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, query, where } from 'firebase/firestore';
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
  const { user } = useUser();
  const { workers } = useWorkers();

  const faultsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    const faultsCollectionRef = collection(firestore, 'issues');
    
    if (user && user.email !== 'admin@zarasubustas.lt') {
      return query(faultsCollectionRef, where('assignedTo', '==', user.uid));
    }
    
    return faultsCollectionRef;
  }, [firestore, user]);

  const { data: faults, isLoading } = useCollection<Fault>(faultsQuery);

  const addFault = useCallback((faultData: NewFaultData) => {
    if (!firestore) {
        console.error("Firestore not initialized, cannot add fault.");
        return;
    }

    const faultsCollection = collection(firestore, 'issues');

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

    let assignedWorker: Worker | undefined = undefined;

    if (workers && workers.length > 0) {
        const suitableWorkers = workers.filter(worker => worker.specialty.includes(faultData.type));

        if (suitableWorkers.length > 0) {
            const workerTaskCounts = suitableWorkers.map(worker => {
                const taskCount = (faults || []).filter(f => f.assignedTo === worker.id && f.status !== 'completed').length;
                return { worker, taskCount };
            });

            workerTaskCounts.sort((a, b) => a.taskCount - b.taskCount);
            assignedWorker = workerTaskCounts[0].worker;
        }
    }
    
    const newFaultDocument = {
      ...faultData,
      customId: newCustomId,
      assignedTo: assignedWorker ? assignedWorker.id : '',
      status: assignedWorker ? 'assigned' as const : 'new' as const,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

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
  }, [firestore, faults, workers]);

  const updateFault = (faultId: string, faultData: Partial<Fault>) => {
    if (!firestore) return;
    const faultRef = doc(firestore, 'issues', faultId);
    updateDocumentNonBlocking(faultRef, { ...faultData, updatedAt: serverTimestamp() });
  };

  const contextValue = useMemo(() => ({
    faults,
    isLoading,
    addFault,
    updateFault,
  }), [faults, isLoading, addFault, updateFault]);

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
