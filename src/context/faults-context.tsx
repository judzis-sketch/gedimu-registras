"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Fault, NewFaultData, Worker, Status } from '@/lib/types';
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

    // This logic for ID generation might have race conditions in a high-traffic app.
    // For a production app, a Firebase Function or a dedicated counter document would be better.
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

    const newFaultDocument = {
      ...faultData,
      customId: newCustomId,
      assignedTo: '', // Always unassigned on creation
      status: 'new' as const, // Always 'new' on creation
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    addDoc(faultsCollection, newFaultDocument).catch(error => {
      const permissionError = new FirestorePermissionError({
          path: faultsCollection.path,
          operation: 'create',
          requestResourceData: newFaultDocument,
      });
      console.error("Error adding fault to Firestore:", permissionError);
      errorEmitter.emit('permission-error', permissionError);
    });
  }, [firestore, faults]); // Depends on faults for ID generation

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
