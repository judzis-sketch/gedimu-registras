"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { faults as initialFaultsData } from '@/lib/data';
import { Fault, NewFaultData, Worker } from '@/lib/types';
import { useWorkers } from './workers-context';

// Add random dates for createdAt and updatedAt for initial data
const getInitialFaults = () => {
    const now = new Date();
    return initialFaultsData.map((fault, index) => ({
        ...fault,
        createdAt: new Date(now.getTime() - (initialFaultsData.length - index) * 24 * 60 * 60 * 1000),
        updatedAt: new Date(now.getTime() - (initialFaultsData.length - index) * 24 * 60 * 60 * 1000 + 60 * 60 * 1000),
    }));
};


interface FaultsContextType {
  faults: Fault[];
  setFaults: React.Dispatch<React.SetStateAction<Fault[]>>;
  addFault: (faultData: NewFaultData) => void;
}

const FaultsContext = createContext<FaultsContextType | undefined>(undefined);

export const FaultsProvider = ({ children }: { children: ReactNode }) => {
  const [faults, setFaults] = useState<Fault[]>(getInitialFaults());
  const { workers } = useWorkers();

  const addFault = (faultData: NewFaultData) => {
    const newFaultBase = {
      ...faultData,
      id: `FAULT-${String(faults.length + 1).padStart(3, '0')}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const suitableWorkers = workers.filter(worker => worker.specialty.includes(faultData.type));
    let assignedWorker: Worker | undefined;

    if (suitableWorkers.length > 0) {
      // Find worker with the least active tasks
      const workerTasksCount = suitableWorkers.map(worker => ({
        worker,
        taskCount: faults.filter(f => f.assignedTo === worker.id && f.status !== 'completed').length
      }));

      workerTasksCount.sort((a, b) => a.taskCount - b.taskCount);
      assignedWorker = workerTasksCount[0].worker;
    }

    const newFault: Fault = {
      ...newFaultBase,
      status: assignedWorker ? 'assigned' : 'new',
      assignedTo: assignedWorker?.id,
    };
    
    setFaults(prevFaults => [newFault, ...prevFaults]);
  };

  return (
    <FaultsContext.Provider value={{ faults, setFaults, addFault }}>
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
