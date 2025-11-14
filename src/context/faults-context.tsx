"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Fault, NewFaultData, Worker } from '@/lib/types';
import { useWorkers } from './workers-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { addDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

interface FaultsContextType {
  faults: Fault[] | null;
  isLoading: boolean;
  addFault: (faultData: NewFaultData) => void;
  updateFault: (faultId: string, faultData: Partial<Fault>) => void;
}

const FaultsContext = createContext<FaultsContextType | undefined>(undefined);

export const FaultsProvider = ({ children }: { children: ReactNode }) => {
  const firestore = useFirestore();
  const faultsCollection = useMemoFirebase(() => collection(firestore, 'issues'), [firestore]);
  const { data: faults, isLoading } = useCollection<Fault>(faultsCollection);
  
  const { workers } = useWorkers();

  const addFault = (faultData: NewFaultData) => {
    if (!faultsCollection) return;
    if (!workers) return;

    const newFaultBase = {
      ...faultData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const suitableWorkers = workers.filter(worker => worker.specialty.includes(faultData.type));
    let assignedWorker: Worker | undefined;

    if (suitableWorkers.length > 0) {
      const workerTasksCount = suitableWorkers.map(worker => ({
        worker,
        taskCount: (faults || []).filter(f => f.assignedTo === worker.id && f.status !== 'completed').length
      }));

      workerTasksCount.sort((a, b) => a.taskCount - b.taskCount);
      assignedWorker = workerTasksCount[0].worker;
    }

    const newFault: Omit<Fault, 'id'> = {
      ...newFaultBase,
      status: assignedWorker ? 'assigned' : 'new',
      assignedTo: assignedWorker?.id || '',
    };
    
    addDocumentNonBlocking(faultsCollection, newFault);
  };

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
