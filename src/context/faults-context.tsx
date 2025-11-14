"use client";

import React, { createContext, useContext, ReactNode, useMemo, useCallback } from 'react';
import { Fault, NewFaultData, Worker, Status } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase, useUser } from '@/firebase';
import { collection, doc, serverTimestamp, addDoc, query, where, Query } from 'firebase/firestore';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useSearchParams } from 'next/navigation';

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
  const searchParams = useSearchParams();
  const view = searchParams.get('view') || 'worker';
  
  const faultsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    const faultsCollectionRef = collection(firestore, 'issues');
    
    // For the admin dashboard, always show all faults.
    if (user.email === 'admin@zarasubustas.lt' && view !== 'worker') {
        return faultsCollectionRef;
    }

    // For any other user (or admin viewing "My Tasks"), filter by their UID.
    return query(faultsCollectionRef, where('assignedTo', '==', user.uid));
  }, [firestore, user, view]);


  const { data: faults, isLoading } = useCollection<Fault>(faultsQuery as Query<Fault>);

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

    const newFaultDocument = {
      ...faultData,
      customId: newCustomId,
      assignedTo: '', // Always unassigned on creation
      status: 'new' as const,
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
  }, [firestore]); // Removed `faults` to stabilize the function

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
