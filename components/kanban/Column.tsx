'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import type { ColumnWithTasks, TaskWithDetails } from '@/lib/kanban-actions';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TaskCard } from './TaskCard';

interface ColumnProps {
  column: ColumnWithTasks;
  showProjectBadge?: boolean;
  onAddTask?: (columnId: string, title: string) => void;
  onEditTask?: (task: TaskWithDetails) => void;
  onDeleteTask?: (taskId: string) => void;
  onRenameColumn?: (columnId: string, name: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onDropTask?: (taskId: string, columnId: string, order: number) => void;
  isGlobalBoard?: boolean;
}

export function Column({
  column,
  showProjectBadge = false,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onRenameColumn,
  onDeleteColumn,
  onDropTask,
  isGlobalBoard = false,
}: ColumnProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.name);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId && onDropTask) {
      onDropTask(taskId, column.id, column.tasks.length);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleAddTask = () => {
    if (newTaskTitle.trim() && onAddTask) {
      onAddTask(column.id, newTaskTitle.trim());
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  const handleRenameColumn = () => {
    if (columnName.trim() && onRenameColumn) {
      onRenameColumn(column.id, columnName.trim());
      setIsEditingName(false);
    }
  };

  return (
    <div
      className={`bg-card flex w-80 min-w-80 flex-col rounded-lg border ${isDragOver ? 'ring-primary ring-2' : ''}`}
      onDrop={isGlobalBoard ? undefined : handleDrop}
      onDragOver={isGlobalBoard ? undefined : handleDragOver}
      onDragLeave={isGlobalBoard ? undefined : handleDragLeave}
    >
      {/* Заголовок колонки */}
      <div className="flex items-center justify-between border-b p-3">
        {isEditingName ? (
          <div className="flex flex-1 items-center gap-2">
            <Input
              value={columnName}
              onChange={(e) => setColumnName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameColumn();
                if (e.key === 'Escape') {
                  setColumnName(column.name);
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="h-8"
            />
            <Button size="sm" onClick={handleRenameColumn}>
              OK
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              {column.projectColor && (
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: column.projectColor }}
                  title={`Колонка проекта: ${column.projectName}`}
                />
              )}
              <h3 className="font-semibold">{column.name}</h3>
            </div>
            {!isGlobalBoard && (
              <div className="flex items-center gap-1">
                <span className="text-muted-foreground bg-muted rounded-full px-2 py-0.5 text-xs">
                  {column.tasks.length}
                </span>
                <button
                  onClick={() => setIsEditingName(true)}
                  className="hover:bg-accent rounded p-1"
                  title="Переименовать"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => onDeleteColumn?.(column.id)}
                  className="hover:bg-destructive/10 text-destructive rounded p-1"
                  title="Удалить колонку"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Список задач */}
      <div className="flex max-h-[calc(100vh-300px)] flex-1 flex-col gap-2 overflow-y-auto p-3">
        {column.tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            showProjectBadge={showProjectBadge}
            onEdit={onEditTask}
            onDelete={onDeleteTask}
            isGlobalBoard={isGlobalBoard}
          />
        ))}

        {/* Добавление задачи */}
        {!isGlobalBoard && (
          <>
            {isAddingTask ? (
              <div className="flex flex-col gap-2">
                <Input
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask();
                    if (e.key === 'Escape') {
                      setNewTaskTitle('');
                      setIsAddingTask(false);
                    }
                  }}
                  placeholder="Название задачи..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddTask}>
                    Добавить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewTaskTitle('');
                      setIsAddingTask(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="text-muted-foreground justify-start gap-2"
                onClick={() => setIsAddingTask(true)}
              >
                <Plus className="h-4 w-4" />
                Добавить задачу
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
