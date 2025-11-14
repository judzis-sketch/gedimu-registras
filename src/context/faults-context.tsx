"use client";

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { Fault, NewFaultData, Worker } from '@/lib/types';
import { useWorkers } from './workers-context';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, setDoc } from 'firebase/firestore';
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

  const addFault = async (faultData: NewFaultData) => {
    if (!faultsCollection || !firestore) return;

    // Generate custom sequential ID
    let nextIdNumber = 1;
    if (faults && faults.length > 0) {
      const existingIds = faults
        .map(f => parseInt(f.id.replace('FAULT-', ''), 10))
        .filter(n => !isNaN(n));
      if (existingIds.length > 0) {
        nextIdNumber = Math.max(...existingIds) + 1;
      }
    }
    const newFaultId = `FAULT-${String(nextIdNumber).padStart(4, '0')}`;

    const newFaultBase = {
      ...faultData,
      id: newFaultId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    let assignedWorker: Worker | undefined;
    if (workers && workers.length > 0) {
      const suitableWorkers = workers.filter(worker => worker.specialty.includes(faultData.type));

      if (suitableWorkers.length > 0) {
        const workerTasksCount = suitableWorkers.map(worker => ({
          worker,
          taskCount: (faults || []).filter(f => f.assignedTo === worker.id && f.status !== 'completed').length
        }));

        workerTasksCount.sort((a, b) => a.taskCount - b.taskCount);
        assignedWorker = workerTasksCount[0].worker;
      }
    }

    const newFault: Omit<Fault, 'docId'> = {
      ...newFaultBase,
      status: assignedWorker ? 'assigned' : 'new',
      assignedTo: assignedWorker ? assignedWorker.id : '',
    };
    
    // We must use `setDoc` with a custom-generated Firestore ID to avoid race conditions
    // when multiple users create faults at the same time. `addDoc` is not suitable here.
    const newDocRef = doc(faultsCollection);

    setDoc(newDocRef, newFault).catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: faultsCollection.path,
          operation: 'create',
          requestResourceData: newFault,
        })
      )
    });
  };

  const updateFault = (faultId: string, faultData: Partial<Fault>) => {
    if (!firestore || !faults) return;
    
    // Find the document's real Firestore ID based on the custom `id` field.
    const faultDoc = faults.find(f => f.id === faultId);
    if (!faultDoc) {
        console.error(`Fault with custom ID ${faultId} not found for update.`);
        return;
    }

    const faultRef = doc(firestore, 'issues', faultDoc.docId);
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
