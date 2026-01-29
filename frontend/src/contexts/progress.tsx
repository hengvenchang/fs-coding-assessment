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
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount((prev) => prev + 1);
    setIsLoading(true);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((prev) => Math.max(0, prev - 1));
    // Only set isLoading to false when all operations are complete
    setLoadingCount((prev) => {
      if (prev <= 1) {
        setIsLoading(false);
        return 0;
      }
      return prev - 1;
    });
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
