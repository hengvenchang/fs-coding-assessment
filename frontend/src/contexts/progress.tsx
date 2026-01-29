"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface ProgressContextType {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const startLoading = useCallback(() => {
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <ProgressContext.Provider value={{ isLoading, startLoading, stopLoading }}>
      {children}
    </ProgressContext.Provider>
  );
}

/**
 * Hook to access progress context
 */
export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error("useProgress must be used within ProgressProvider");
  }
  return context;
}
