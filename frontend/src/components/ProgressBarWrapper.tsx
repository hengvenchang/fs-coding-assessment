"use client";

import { useProgress } from "@/contexts/progress";
import { ProgressBar } from "@/components/ProgressBar";

/**
 * Client wrapper for ProgressBar to access progress context
 */
export function ProgressBarWrapper() {
  const { isLoading } = useProgress();
  return <ProgressBar isLoading={isLoading} />;
}
