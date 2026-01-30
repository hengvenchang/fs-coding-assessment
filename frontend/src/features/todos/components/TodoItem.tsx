"use client";

import { Todo } from "../types/todo.types";
import { Card } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { Checkbox } from "@/shared/components/ui/checkbox";
import { Badge } from "@/shared/components/ui/badge";
import { getPriorityColor, formatDate } from "@/shared/utils";
import { Trash2, Edit2 } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string, title: string) => void;
  isToggling?: boolean;
  currentUserId?: string;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  isToggling = false,
  currentUserId,
}: TodoItemProps) {
  const isOwner = currentUserId === todo.user_id;
  
  const handleToggle = async () => {
    await onToggle(todo.id, todo.completed);
  };

  return (
    <Card className={`p-3 md:p-4 transition-opacity ${isToggling ? "opacity-60" : ""}`} role="article" aria-label={`Todo: ${todo.title}`}>
      <div className="flex gap-3 md:gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-0.5 md:pt-1">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            disabled={isToggling || !isOwner}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
            className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2 mb-1">
                <h3
                  className={`font-semibold text-sm md:text-base transition-all flex-1 ${
                    todo.completed
                      ? "line-through text-gray-500"
                      : "text-gray-900"
                  }`}
                >
                  {todo.title}
                </h3>
                {/* Priority Badge - Mobile (inline with title) */}
                <Badge className={`flex-shrink-0 sm:hidden text-xs ${getPriorityColor(todo.priority)}`} aria-label={`Priority: ${todo.priority}`}>
                  {todo.priority}
                </Badge>
              </div>
              {todo.description && (
                <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2 break-words">
                  {todo.description}
                </p>
              )}
              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                <time dateTime={todo.created_at}>
                  <span className="sr-only">Created on </span>
                  Created {formatDate(todo.created_at)}
                </time>
              </div>
            </div>

            {/* Priority Badge - Desktop */}
            <Badge className={`hidden sm:flex flex-shrink-0 self-start ${getPriorityColor(todo.priority)}`} aria-label={`Priority: ${todo.priority}`}>
              {todo.priority}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2" role="group" aria-label="Todo actions">
          {isOwner && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(todo)}
              aria-label={`Edit "${todo.title}"`}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              <Edit2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Edit</span>
            </Button>
          )}
          {isOwner && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onDelete(todo.id, todo.title)}
              aria-label={`Delete "${todo.title}"`}
              className="min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">Delete</span>
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
