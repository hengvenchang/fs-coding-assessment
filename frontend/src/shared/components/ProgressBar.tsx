"use client";

import { useEffect, useState } from "react";

interface ProgressBarProps {
  isLoading: boolean;
}

/**
 * ProgressBar component that shows at the top of the page during loading
 * Simulates progress with random increments for better UX
 */
export function ProgressBar({ isLoading }: ProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true);
      setProgress(10);

      // Simulate progress with random increments
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 30; // Random increment between 0-30%
        });
      }, 500);

      return () => clearInterval(interval);
    } else {
      // Complete the progress bar
      setProgress(100);

      // Hide after animation completes
      const timeout = setTimeout(() => {
        setIsVisible(false);
        setProgress(0);
      }, 300);

      return () => clearTimeout(timeout);
    }
  }, [isLoading]);

  if (!isVisible && progress === 0) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200">
      <div
        className={`h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out`}
        style={{
          width: `${progress}%`,
          boxShadow: progress > 0 && progress < 100 ? "0 0 10px rgba(59, 130, 246, 0.5)" : "none",
        }}
      />
    </div>
  );
}
