'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Calendar, CheckSquare, Clock, MoreVertical } from 'lucide-react';
import { useState } from 'react';

import type { TaskWithDetails } from '@/lib/kanban-actions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskCardProps {
  task: TaskWithDetails;
  showProjectBadge?: boolean;
  onEdit?: (task: TaskWithDetails) => void;
  onDelete?: (taskId: string) => void;
  isGlobalBoard?: boolean;
}

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NORMAL: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const complexityColors = {
  EASY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  HARD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EXPERT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

export function TaskCard({
  task,
  showProjectBadge = false,
  onEdit,
  onDelete,
  isGlobalBoard = false,
}: TaskCardProps) {
  const [isDragging, setIsDragging] = useState(false);

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('taskId', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  return (
    <Card
      className={`group relative ${isGlobalBoard ? '' : 'cursor-grab active:cursor-grabbing'} ${isDragging ? 'opacity-50' : ''}`}
      draggable={!isGlobalBoard}
      onDragStart={!isGlobalBoard ? handleDragStart : undefined}
      onDragEnd={!isGlobalBoard ? handleDragEnd : undefined}
      data-task-id={task.id}
    >
      <div className="flex flex-col gap-3 p-3">
        {/* Бейдж проекта для общей доски */}
        {showProjectBadge && task.project && (
          <Badge
            className="-mt-6 w-fit"
            style={
              task.project.color
                ? { backgroundColor: task.project.color, color: '#fff' }
                : undefined
            }
          >
            {task.project.name}
          </Badge>
        )}

        {/* Заголовок и меню */}
        <div className="flex items-start justify-between gap-2">
          <h4 className="text-sm leading-tight font-medium">{task.title}</h4>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100">
                <MoreVertical className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit?.(task)}>Редактировать</DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete?.(task.id)}
                className="text-destructive focus:text-destructive"
              >
                Удалить
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Описание */}
        {task.description && (
          <p className="text-muted-foreground line-clamp-2 text-xs">{task.description}</p>
        )}

        {/* Теги */}
        {task.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {task.tags.map(({ tag }) => (
              <Badge
                key={tag.id}
                variant="outline"
                className="text-xs"
                style={
                  tag.color
                    ? {
                        backgroundColor: tag.color + '20',
                        borderColor: tag.color,
                        color: tag.color,
                      }
                    : undefined
                }
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Приоритет и сложность */}
        <div className="flex flex-wrap gap-1">
          <Badge
            className={priorityColors[task.priority as keyof typeof priorityColors]}
            variant="secondary"
          >
            {task.priority === 'LOW' && 'Низкий'}
            {task.priority === 'NORMAL' && 'Средний'}
            {task.priority === 'HIGH' && 'Высокий'}
            {task.priority === 'URGENT' && 'Срочно'}
          </Badge>
          {task.complexity && (
            <Badge
              className={complexityColors[task.complexity as keyof typeof complexityColors]}
              variant="secondary"
            >
              {task.complexity === 'EASY' && 'Лёгкая'}
              {task.complexity === 'MEDIUM' && 'Средняя'}
              {task.complexity === 'HARD' && 'Сложная'}
              {task.complexity === 'EXPERT' && 'Эксперт'}
            </Badge>
          )}
        </div>

        {/* Подзадачи и время */}
        {(totalSubtasks > 0 || task.estimatedTime || task.spentTime) && (
          <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
            {totalSubtasks > 0 && (
              <span className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
            {task.estimatedTime && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.estimatedTime} мин
              </span>
            )}
            {task.spentTime && (
              <span className="text-primary flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.spentTime} мин
              </span>
            )}
          </div>
        )}

        {/* Дедлайн */}
        {task.dueDate && (
          <div className="flex items-center gap-1 text-xs">
            <Calendar className="text-muted-foreground h-3 w-3" />
            <span
              className={
                new Date(task.dueDate) < new Date()
                  ? 'text-destructive font-medium'
                  : 'text-muted-foreground'
              }
            >
              {format(new Date(task.dueDate), 'dd MMM', { locale: ru })}
            </span>
          </div>
        )}

        {/* Исполнитель и дата */}
        <div className="flex items-center justify-between border-t pt-2">
          <div className="flex items-center gap-2">
            {task.assignee ? (
              <Avatar className="h-5 w-5">
                <AvatarImage src={task.assignee.image ?? undefined} />
                <AvatarFallback className="text-xs">
                  {task.assignee.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ) : (
              <span className="text-muted-foreground text-xs">👤 Не назначен</span>
            )}
          </div>
          <span className="text-muted-foreground text-xs">
            {format(new Date(task.createdAt), 'dd MMM', { locale: ru })}
          </span>
        </div>
      </div>
    </Card>
  );
}
