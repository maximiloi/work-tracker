'use client';

import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Check, Clock, File, Folder, Plus, Tag, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import type { TagWithCount, TaskWithDetails, UserWithProjects } from '@/lib/kanban-actions';
import {
  addSubtask,
  addTagToTask,
  completeTask,
  deleteSubtask,
  deleteTask,
  removeTagFromTask,
  toggleSubtask,
  updateTask,
} from '@/lib/kanban-actions';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface TaskDialogProps {
  task: TaskWithDetails;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserWithProjects[];
  tags: TagWithCount[];
}

const priorityColors = {
  LOW: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  NORMAL: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

const priorityLabels: Record<string, string> = {
  LOW: 'Низкий',
  NORMAL: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочно',
};

const complexityColors = {
  EASY: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  HARD: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  EXPERT: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
};

const complexityLabels: Record<string, string> = {
  EASY: 'Лёгкая',
  MEDIUM: 'Средняя',
  HARD: 'Сложная',
  EXPERT: 'Эксперт',
};

export function TaskDialog({ task, open, onOpenChange, users, tags }: TaskDialogProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description ?? '',
    notes: task.notes ?? '',
    priority: task.priority,
    complexity: task.complexity ?? '',
    estimatedTime: task.estimatedTime?.toString() ?? '',
    spentTime: task.spentTime?.toString() ?? '',
    assigneeId: task.assigneeId ?? '',
    dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
  });
  const [newSubtask, setNewSubtask] = useState('');
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6');

  const completedSubtasks = task.subtasks.filter((s) => s.completed).length;
  const totalSubtasks = task.subtasks.length;

  const handleSave = async () => {
    await updateTask(task.id, {
      title: formData.title,
      description: formData.description,
      notes: formData.notes,
      priority: formData.priority as 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
      complexity: (formData.complexity || undefined) as
        | 'EASY'
        | 'MEDIUM'
        | 'HARD'
        | 'EXPERT'
        | undefined,
      estimatedTime: formData.estimatedTime ? parseInt(formData.estimatedTime) : undefined,
      spentTime: formData.spentTime ? parseInt(formData.spentTime) : undefined,
      assigneeId: formData.assigneeId || null,
      dueDate: formData.dueDate ? new Date(formData.dueDate) : null,
    });
    setIsEditing(false);
  };

  const handleAddSubtask = async () => {
    if (newSubtask.trim()) {
      await addSubtask(task.id, newSubtask.trim());
      setNewSubtask('');
    }
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    await toggleSubtask(subtaskId);
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    await deleteSubtask(subtaskId);
  };

  const handleAddTag = async (tagId: string) => {
    await addTagToTask(task.id, tagId);
  };

  const handleRemoveTag = async (tagId: string) => {
    await removeTagFromTask(task.id, tagId);
  };

  const handleCompleteTask = async () => {
    const isCompleted = !!task.completedAt;
    await completeTask(task.id, !isCompleted);
  };

  const handleDeleteTask = async () => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      await deleteTask(task.id);
      onOpenChange(false);
    }
  };

  const taskTagsIds = task.tags.map((t) => t.tag.id);
  const availableTags = tags.filter((t) => !taskTagsIds.includes(t.id));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl">Задача</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={task.completedAt ? 'default' : 'outline'}
                size="sm"
                onClick={handleCompleteTask}
                className={task.completedAt ? 'bg-green-600 hover:bg-green-700' : ''}
              >
                <Check className="mr-1 h-4 w-4" />
                {task.completedAt ? 'Выполнено' : 'Выполнить'}
              </Button>
              <Button
                variant={isEditing ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEditing(!isEditing)}
              >
                {isEditing ? (
                  <Check className="mr-1 h-4 w-4" />
                ) : (
                  <Folder className="mr-1 h-4 w-4" />
                )}
                {isEditing ? 'Готово' : 'Редактировать'}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col gap-6 py-4">
          {/* Основная информация */}
          <div className="grid gap-4">
            <div>
              <Label>Название</Label>
              {isEditing ? (
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              ) : (
                <h3 className="text-lg font-semibold">{formData.title}</h3>
              )}
            </div>

            <div>
              <Label>Описание</Label>
              {isEditing ? (
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  placeholder="Добавьте описание задачи..."
                />
              ) : (
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                  {formData.description || 'Нет описания'}
                </p>
              )}
            </div>

            <div>
              <Label>Заметки</Label>
              {isEditing ? (
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  placeholder="Внутренние заметки..."
                />
              ) : (
                <p className="text-muted-foreground mt-1 whitespace-pre-wrap">
                  {formData.notes || 'Нет заметок'}
                </p>
              )}
            </div>
          </div>

          {/* Параметры задачи */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <Label>Приоритет</Label>
              {isEditing ? (
                <Select
                  value={formData.priority}
                  onValueChange={(value: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') =>
                    setFormData({ ...formData, priority: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Низкий</SelectItem>
                    <SelectItem value="NORMAL">Средний</SelectItem>
                    <SelectItem value="HIGH">Высокий</SelectItem>
                    <SelectItem value="URGENT">Срочно</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <Badge className={priorityColors[formData.priority]} variant="secondary">
                  {priorityLabels[formData.priority]}
                </Badge>
              )}
            </div>

            <div>
              <Label>Сложность</Label>
              {isEditing ? (
                <Select
                  value={formData.complexity || 'NONE'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      complexity: value === 'NONE' ? '' : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">Не указано</SelectItem>
                    <SelectItem value="EASY">Лёгкая</SelectItem>
                    <SelectItem value="MEDIUM">Средняя</SelectItem>
                    <SelectItem value="HARD">Сложная</SelectItem>
                    <SelectItem value="EXPERT">Эксперт</SelectItem>
                  </SelectContent>
                </Select>
              ) : formData.complexity ? (
                <Badge
                  className={complexityColors[formData.complexity as keyof typeof complexityColors]}
                  variant="secondary"
                >
                  {complexityLabels[formData.complexity as keyof typeof complexityLabels]}
                </Badge>
              ) : (
                <span className="text-muted-foreground text-sm">Не указано</span>
              )}
            </div>

            <div>
              <Label>Оценочное время (мин)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.estimatedTime}
                  onChange={(e) => setFormData({ ...formData, estimatedTime: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="text-muted-foreground h-4 w-4" />
                  <span>{formData.estimatedTime || '—'} мин</span>
                </div>
              )}
            </div>

            <div>
              <Label>Затраченное время (мин)</Label>
              {isEditing ? (
                <Input
                  type="number"
                  value={formData.spentTime}
                  onChange={(e) => setFormData({ ...formData, spentTime: e.target.value })}
                />
              ) : (
                <div className="mt-1 flex items-center gap-2">
                  <Clock className="text-primary h-4 w-4" />
                  <span className="text-primary font-medium">{formData.spentTime || '—'} мин</span>
                </div>
              )}
            </div>
          </div>

          {/* Дедлайн */}
          <div>
            <Label>Дедлайн</Label>
            {isEditing ? (
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            ) : task.dueDate ? (
              <div className="mt-1 flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span>{format(new Date(task.dueDate), 'dd MMMM yyyy', { locale: ru })}</span>
              </div>
            ) : (
              <span className="text-muted-foreground mt-1 block text-sm">Не указан</span>
            )}
          </div>

          {/* Исполнитель */}
          <div>
            <Label>Исполнитель</Label>
            {isEditing ? (
              <Select
                value={formData.assigneeId || 'unassigned'}
                onValueChange={(value) =>
                  setFormData({ ...formData, assigneeId: value === 'unassigned' ? '' : value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Не назначен" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Не назначен</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-5 w-5">
                          <AvatarImage src={user.image ?? undefined} />
                          <AvatarFallback className="text-xs">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {user.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : task.assignee ? (
              <div className="mt-1 flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={task.assignee.image ?? undefined} />
                  <AvatarFallback className="text-xs">
                    {task.assignee.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{task.assignee.name}</span>
              </div>
            ) : (
              <span className="text-muted-foreground mt-1 block text-sm">Не назначен</span>
            )}
          </div>

          {/* Теги */}
          <div>
            <Label>Теги</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {task.tags.map(({ tag }) => (
                <Badge
                  key={tag.id}
                  variant="outline"
                  className="flex items-center gap-1"
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
                  <Tag className="h-3 w-3" />
                  {tag.name}
                  {isEditing && (
                    <button
                      onClick={() => handleRemoveTag(tag.id)}
                      className="hover:text-destructive ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {isEditing && (
                <Select onValueChange={handleAddTag}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Добавить тег..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTags.length > 0 ? (
                      availableTags.map((tag) => (
                        <SelectItem key={tag.id} value={tag.id}>
                          <div className="flex items-center gap-2">
                            <div
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: tag.color || '#999' }}
                            />
                            {tag.name} ({tag.tasksCount})
                          </div>
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        Нет доступных тегов
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          {/* Подзадачи */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Подзадачи</Label>
              <span className="text-muted-foreground text-sm">
                {completedSubtasks}/{totalSubtasks}
              </span>
            </div>
            <div className="flex flex-col gap-2">
              {task.subtasks.map((subtask) => (
                <div
                  key={subtask.id}
                  className="hover:bg-accent group flex items-center gap-2 rounded-md p-2"
                >
                  <button
                    onClick={() => handleToggleSubtask(subtask.id)}
                    className={`flex h-5 w-5 items-center justify-center rounded border ${
                      subtask.completed
                        ? 'bg-primary border-primary text-primary-foreground'
                        : 'border-input'
                    }`}
                  >
                    {subtask.completed && <Check className="h-3 w-3" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      subtask.completed ? 'text-muted-foreground line-through' : ''
                    }`}
                  >
                    {subtask.title}
                  </span>
                  {isEditing && (
                    <button
                      onClick={() => handleDeleteSubtask(subtask.id)}
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
              {isEditing && (
                <div className="mt-2 flex gap-2">
                  <Input
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                    placeholder="Добавить подзадачу..."
                    className="flex-1"
                  />
                  <Button size="sm" onClick={handleAddSubtask}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Вложения */}
          <div>
            <Label>Вложения</Label>
            {task.attachments.length > 0 ? (
              <div className="mt-2 flex flex-col gap-2">
                {task.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="bg-accent flex items-center gap-2 rounded-md p-2"
                  >
                    <File className="text-muted-foreground h-4 w-4" />
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 text-sm hover:underline"
                    >
                      {attachment.name}
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mt-1 text-sm">Нет вложений</p>
            )}
            {isEditing && (
              <p className="text-muted-foreground mt-2 text-xs">
                Загрузка файлов будет реализована в следующей версии
              </p>
            )}
          </div>

          {/* Мета-информация */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Создано: </span>
                {format(new Date(task.createdAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </div>
              <div>
                <span className="text-muted-foreground">Обновлено: </span>
                {format(new Date(task.updatedAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
              </div>
              {task.completedAt && (
                <div>
                  <span className="text-muted-foreground">Выполнено: </span>
                  {format(new Date(task.completedAt), 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          {isEditing ? (
            <>
              <Button variant="ghost" onClick={() => setIsEditing(false)}>
                Отмена
              </Button>
              <Button onClick={handleSave}>Сохранить</Button>
            </>
          ) : (
            <>
              <Button variant="destructive" onClick={handleDeleteTask}>
                <Trash2 className="mr-2 h-4 w-4" />
                Удалить
              </Button>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                Закрыть
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
