"use client";

import { useEffect, useRef } from "react";

interface ScreenReaderAnnouncerProps {
  message: string;
  priority?: "polite" | "assertive";
  clearDelay?: number;
}

/**
 * Announces messages to screen readers using ARIA live regions
 * Messages are announced and then cleared after a delay
 */
export function ScreenReaderAnnouncer({
  message,
  priority = "polite",
  clearDelay = 5000,
}: ScreenReaderAnnouncerProps) {
  const announceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (message && announceRef.current) {
      // Set the message
      announceRef.current.textContent = message;

      // Clear after delay
      const timeout = setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = "";
        }
      }, clearDelay);

      return () => clearTimeout(timeout);
    }
  }, [message, clearDelay]);

  return (
    <div
      ref={announceRef}
      role="status"
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    />
  );
}

/**
 * Hook to manage screen reader announcements
 */
export function useScreenReaderAnnounce() {
  const announceRef = useRef<HTMLDivElement | null>(null);

  const announce = (message: string, priority: "polite" | "assertive" = "polite") => {
    if (announceRef.current) {
      announceRef.current.setAttribute("aria-live", priority);
      announceRef.current.textContent = message;

      // Clear after 5 seconds
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = "";
        }
      }, 5000);
    }
  };

  const AnnouncerComponent = () => (
    <div
      ref={announceRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announce, AnnouncerComponent };
}
