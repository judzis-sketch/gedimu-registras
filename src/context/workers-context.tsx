"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { workers as initialWorkersData } from '@/lib/data';
import { NewWorkerData, Worker } from '@/lib/types';

interface WorkersContextType {
  workers: Worker[];
  addWorker: (workerData: NewWorkerData) => void;
  updateWorker: (workerId: string, workerData: Partial<NewWorkerData>) => void;
  deleteWorker: (workerId: string) => void;
}

const WorkersContext = createContext<WorkersContextType | undefined>(undefined);

export const WorkersProvider = ({ children }: { children: ReactNode }) => {
  const [workers, setWorkers] = useState<Worker[]>(initialWorkersData);

  const addWorker = (workerData: NewWorkerData) => {
    const newWorker: Worker = {
      ...workerData,
      id: `worker-${workers.length + 1}`,
    };
    setWorkers(prevWorkers => [...prevWorkers, newWorker]);
  };
  
  const updateWorker = (workerId: string, workerData: Partial<NewWorkerData>) => {
    setWorkers(prevWorkers =>
      prevWorkers.map(worker =>
        worker.id === workerId ? { ...worker, ...workerData, id: worker.id } : worker
      )
    );
  };

  const deleteWorker = (workerId: string) => {
    setWorkers(prevWorkers => prevWorkers.filter(worker => worker.id !== workerId));
  };


  return (
    <WorkersContext.Provider value={{ workers, addWorker, updateWorker, deleteWorker }}>
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
