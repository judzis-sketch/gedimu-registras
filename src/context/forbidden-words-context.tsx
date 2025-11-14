"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';

const initialForbiddenWords: string[] = ["keiksmas1", "keiksmas2", "netinkamaszodis"];

interface ForbiddenWordsContextType {
  forbiddenWords: string[];
  addForbiddenWord: (word: string) => void;
  deleteForbiddenWord: (word: string) => void;
}

const ForbiddenWordsContext = createContext<ForbiddenWordsContextType | undefined>(undefined);

export const ForbiddenWordsProvider = ({ children }: { children: ReactNode }) => {
  const [forbiddenWords, setForbiddenWords] = useState<string[]>(initialForbiddenWords);

  const addForbiddenWord = (word: string) => {
    const lowerCaseWord = word.toLowerCase();
    if (!forbiddenWords.includes(lowerCaseWord)) {
      setForbiddenWords(prevWords => [lowerCaseWord, ...prevWords]);
    }
  };

  const deleteForbiddenWord = (wordToDelete: string) => {
    setForbiddenWords(prevWords => prevWords.filter(word => word !== wordToDelete.toLowerCase()));
  };

  return (
    <ForbiddenWordsContext.Provider value={{ forbiddenWords, addForbiddenWord, deleteForbiddenWord }}>
      {children}
    </ForbiddenWordsContext.Provider>
  );
};

export const useForbiddenWords = () => {
  const context = useContext(ForbiddenWordsContext);
  if (context === undefined) {
    throw new Error('useForbiddenWords must be used within a ForbiddenWordsProvider');
  }
  return context;
};
