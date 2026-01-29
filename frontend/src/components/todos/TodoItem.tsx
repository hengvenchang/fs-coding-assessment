"use client";

import { Todo } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { getPriorityColor, formatDate } from "@/lib/utils/todo";
import { Trash2, Edit2 } from "lucide-react";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => Promise<void>;
  onEdit: (todo: Todo) => void;
  onDelete: (id: string, title: string) => void;
  isToggling?: boolean;
}

export function TodoItem({
  todo,
  onToggle,
  onEdit,
  onDelete,
  isToggling = false,
}: TodoItemProps) {
  const handleToggle = async () => {
    await onToggle(todo.id, todo.completed);
  };

  return (
    <Card className={`p-4 transition-opacity ${isToggling ? "opacity-60" : ""}`}>
      <div className="flex gap-4">
        {/* Checkbox */}
        <div className="flex-shrink-0 pt-1">
          <Checkbox
            checked={todo.completed}
            onCheckedChange={handleToggle}
            disabled={isToggling}
            aria-label={`Mark "${todo.title}" as ${todo.completed ? "incomplete" : "complete"}`}
          />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <h3
                className={`font-semibold text-base transition-all ${
                  todo.completed
                    ? "line-through text-gray-500"
                    : "text-gray-900"
                }`}
              >
                {todo.title}
              </h3>
              {todo.description && (
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                  {todo.description}
                </p>
              )}
              <div className="flex gap-2 mt-2 text-xs text-gray-500">
                <span>Created {formatDate(todo.created_at)}</span>
              </div>
            </div>

            {/* Priority Badge */}
            <Badge className={`flex-shrink-0 ${getPriorityColor(todo.priority)}`}>
              {todo.priority}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex-shrink-0 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(todo)}
            aria-label={`Edit "${todo.title}"`}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(todo.id, todo.title)}
            aria-label={`Delete "${todo.title}"`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
