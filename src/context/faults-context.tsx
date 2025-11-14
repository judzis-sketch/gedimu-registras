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
  const view = searchParams.get('view');
  
  const faultsQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;

    const faultsCollectionRef = collection(firestore, 'issues');
    
    if (user.email === 'admin@zarasubustas.lt' && view !== 'worker') {
        return faultsCollectionRef;
    }

    return query(faultsCollectionRef, where('assignedTo', '==', user.uid));
  }, [firestore, user, view]);


  const { data: faultsFromHook, isLoading } = useCollection<Fault>(faultsQuery as Query<Fault>);

  const faults = useMemo(() => {
    if (!faultsFromHook) return null;
    
    // If it's a worker view (for worker or admin), filter out completed tasks on the client
    if (view === 'worker' || (user && user.email !== 'admin@zarasubustas.lt')) {
      return faultsFromHook.filter(fault => fault.status !== 'completed');
    }
    
    // For admin on main dashboard, show all faults
    return faultsFromHook;
  }, [faultsFromHook, view, user]);


  const addFault = useCallback((faultData: NewFaultData) => {
    if (!firestore) {
        console.error("Firestore not initialized, cannot add fault.");
        return;
    }

    const faultsCollection = collection(firestore, 'issues');
    
    const existingIds = (faultsFromHook || [])
        .map(f => f.customId ? parseInt(f.customId.replace('FAULT-', ''), 10) : 0)
        .filter(n => !isNaN(n));
    
    const maxId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newCustomId = `FAULT-${String(maxId + 1).padStart(4, '0')}`;

    const newFaultDocument = {
      ...faultData,
      customId: newCustomId, 
      assignedTo: '',
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
  }, [firestore, faultsFromHook]); 

  const updateFault = (faultId: string, faultData: Partial<Fault>) => {
    if (!firestore) return;
    const faultRef = doc(firestore, 'issues', faultId);
    updateDocumentNonBlocking(faultRef, { ...faultData, updatedAt: serverTimestamp() });
  };

  const contextValue = useMemo(() => {
    return {
        faults: faults,
        isLoading,
        addFault,
        updateFault,
    };
  }, [faults, isLoading, addFault, updateFault]);

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
