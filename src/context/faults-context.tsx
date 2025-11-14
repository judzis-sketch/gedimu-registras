"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { faults as initialFaultsData } from '@/lib/data';
import { Fault, NewFaultData } from '@/lib/types';

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

  const addFault = (faultData: NewFaultData) => {
    const newFault: Fault = {
      ...faultData,
      id: `FAULT-${String(faults.length + 1).padStart(3, '0')}`,
      status: 'new',
      createdAt: new Date(),
      updatedAt: new Date(),
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
