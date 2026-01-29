"use client";

import { useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateTodoSchema, type UpdateTodoFormData } from "@/lib/validations";
import { Todo } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface EditTodoModalProps {
  todo: Todo | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateTodoFormData) => Promise<void>;
}

export function EditTodoModal({
  todo,
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: EditTodoModalProps) {
  const form = useForm<UpdateTodoFormData>({
    resolver: zodResolver(updateTodoSchema),
    defaultValues: {
      title: "",
      description: undefined,
      priority: "MEDIUM",
      completed: false,
    },
  });

  const titleInputRef = useRef<HTMLInputElement>(null);

  // Update form values when todo changes
  useEffect(() => {
    if (todo) {
      form.reset({
        title: todo.title,
        description: todo.description,
        priority: todo.priority,
        completed: todo.completed,
      });
    }
  }, [todo, form]);

  // Focus on title input when modal opens
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleSubmit = async (data: UpdateTodoFormData) => {
    try {
      await onSubmit(data);
      onClose();
    } catch {
      // Error handled in parent
    }
  };

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      const isDirty = form.formState.isDirty;
      if (isDirty) {
        const confirmed = window.confirm(
          "You have unsaved changes. Are you sure you want to close this form?"
        );
        if (!confirmed) return;
      }
      form.reset();
      onClose();
    }
  }, [form, onClose]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleOpenChange]);

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto" aria-describedby="edit-todo-description">
        <DialogHeader>
          <DialogTitle>Edit Todo</DialogTitle>
          <DialogDescription id="edit-todo-description">
            Update the details of your todo. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
            aria-label="Edit todo form"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter todo title"
                      disabled={isLoading}
                      {...field}
                      ref={titleInputRef}
                      aria-required="true"
                      maxLength={200}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter todo description (optional)"
                      disabled={isLoading}
                      rows={4}
                      {...field}
                      aria-label="Todo description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="priority"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority *</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoading}
                  >
                    <FormControl>
                      <SelectTrigger aria-required="true" aria-label="Select todo priority">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                aria-label="Cancel and close dialog"
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} aria-label="Save changes to todo">
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
