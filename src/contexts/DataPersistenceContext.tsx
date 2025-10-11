'use client';

import React, { createContext, useContext, ReactNode } from 'react';

interface DataPersistenceContextType {
  saveData: (key: string, data: any) => void;
  loadData: (key: string) => any;
  removeData: (key: string) => void;
}

const DataPersistenceContext = createContext<DataPersistenceContextType | undefined>(undefined);

export function DataPersistenceProvider({ children }: { children: ReactNode }) {
  const getUserKey = (key: string): string => {
    // Use a default user ID for demo mode
    const userId = 'demo-user';
    return `ghg_${userId}_${key}`;
  };

  const saveData = (key: string, data: any) => {
    try {
      const userKey = getUserKey(key);
      localStorage.setItem(userKey, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to localStorage:', error);
    }
  };

  const loadData = (key: string): any => {
    try {
      const userKey = getUserKey(key);
      const data = localStorage.getItem(userKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error loading data from localStorage:', error);
      return null;
    }
  };

  const removeData = (key: string) => {
    try {
      const userKey = getUserKey(key);
      localStorage.removeItem(userKey);
    } catch (error) {
      console.error('Error removing data from localStorage:', error);
    }
  };

  return (
    <DataPersistenceContext.Provider value={{ saveData, loadData, removeData }}>
      {children}
    </DataPersistenceContext.Provider>
  );
}

export function useDataPersistence() {
  const context = useContext(DataPersistenceContext);
  if (context === undefined) {
    throw new Error('useDataPersistence must be used within a DataPersistenceProvider');
  }
  return context;
}