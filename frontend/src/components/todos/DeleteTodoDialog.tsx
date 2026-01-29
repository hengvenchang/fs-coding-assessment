"use client";

import { useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteTodoDialogProps {
  isOpen: boolean;
  todoTitle: string;
  isLoading: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteTodoDialog({
  isOpen,
  todoTitle,
  isLoading,
  onClose,
  onConfirm,
}: DeleteTodoDialogProps) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent role="alertdialog" aria-describedby="delete-description">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Todo?</AlertDialogTitle>
          <AlertDialogDescription id="delete-description">
            Are you sure you want to delete &quot;{todoTitle}&quot;? This action
            cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex gap-2 justify-end">
          <AlertDialogCancel disabled={isLoading} aria-label="Cancel deletion">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700"
            aria-label={`Confirm delete ${todoTitle}`}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
