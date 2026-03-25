'use client';

import { Plus, Settings } from 'lucide-react';
import { useState } from 'react';

import type {
  KanbanBoardData,
  TagWithCount,
  TaskWithDetails,
  UserWithProjects,
} from '@/lib/kanban-actions';
import {
  createColumn,
  createTask,
  deleteColumn,
  deleteTask,
  moveTask,
  updateColumnName,
} from '@/lib/kanban-actions';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

import { Column } from './Column';
import { TaskDialog } from './TaskDialog';

interface KanbanBoardProps {
  board: KanbanBoardData;
  showProjectBadge?: boolean;
  enableDragAndDrop?: boolean;
  isGlobalBoard?: boolean;
  users: UserWithProjects[];
  tags: TagWithCount[];
}

export function KanbanBoard({
  board,
  showProjectBadge = false,
  enableDragAndDrop = true,
  isGlobalBoard = false,
  users,
  tags,
}: KanbanBoardProps) {
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  const [createTaskData, setCreateTaskData] = useState<{
    columnId: string;
    title: string;
    description: string;
    priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    complexity: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | '';
    estimatedTime: string;
    assigneeId: string;
    dueDate: string;
  }>({
    columnId: '',
    title: '',
    description: '',
    priority: 'NORMAL',
    complexity: '',
    estimatedTime: '',
    assigneeId: '',
    dueDate: '',
  });

  const handleAddColumn = async () => {
    if (newColumnName.trim()) {
      await createColumn(board.id, newColumnName.trim());
      setNewColumnName('');
      setIsAddingColumn(false);
    }
  };

  const handleDropTask = async (taskId: string, newColumnId: string, order: number) => {
    await moveTask(taskId, newColumnId, order);
  };

  const handleQuickAddTask = async (columnId: string, title: string) => {
    await createTask(columnId, title);
  };

  const handleAddTask = async () => {
    if (createTaskData.columnId && createTaskData.title) {
      await createTask(
        createTaskData.columnId,
        createTaskData.title,
        createTaskData.description || undefined,
        createTaskData.priority,
        createTaskData.complexity || undefined,
        createTaskData.estimatedTime ? parseInt(createTaskData.estimatedTime) : undefined,
        createTaskData.assigneeId || null,
        createTaskData.dueDate ? new Date(createTaskData.dueDate) : null,
      );
      setIsCreateTaskOpen(false);
      setCreateTaskData({
        columnId: '',
        title: '',
        description: '',
        priority: 'NORMAL',
        complexity: '',
        estimatedTime: '',
        assigneeId: '',
        dueDate: '',
      });
    }
  };

  const handleRenameColumn = async (columnId: string, name: string) => {
    await updateColumnName(columnId, name);
  };

  const handleDeleteColumn = async (columnId: string) => {
    if (confirm('Вы уверены? Все задачи в этой колонке будут удалены.')) {
      await deleteColumn(columnId);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
      await deleteTask(taskId);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Заголовок доски */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h2 className="text-2xl font-semibold">{board.name}</h2>
            {board.description && <p className="text-muted-foreground mt-1">{board.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {!isGlobalBoard && (
            <Dialog open={isCreateTaskOpen} onOpenChange={setIsCreateTaskOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setIsCreateTaskOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Создать задачу
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая задача</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-4">
                  <div>
                    <Label>Колонка</Label>
                    <Select
                      value={createTaskData.columnId}
                      onValueChange={(value) =>
                        setCreateTaskData({ ...createTaskData, columnId: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите колонку" />
                      </SelectTrigger>
                      <SelectContent>
                        {board.columns.map((col) => (
                          <SelectItem key={col.id} value={col.id}>
                            {col.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Название</Label>
                    <Input
                      value={createTaskData.title}
                      onChange={(e) =>
                        setCreateTaskData({ ...createTaskData, title: e.target.value })
                      }
                      placeholder="Введите название задачи"
                    />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Textarea
                      value={createTaskData.description}
                      onChange={(e) =>
                        setCreateTaskData({ ...createTaskData, description: e.target.value })
                      }
                      placeholder="Введите описание задачи"
                      rows={4}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Приоритет</Label>
                      <Select
                        value={createTaskData.priority}
                        onValueChange={(value: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') =>
                          setCreateTaskData({ ...createTaskData, priority: value })
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
                    </div>
                    <div>
                      <Label>Сложность</Label>
                      <Select
                        value={createTaskData.complexity || 'NONE'}
                        onValueChange={(value) =>
                          setCreateTaskData({
                            ...createTaskData,
                            complexity:
                              value === 'NONE'
                                ? ''
                                : (value as 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'),
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
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Оценочное время (мин)</Label>
                      <Input
                        type="number"
                        value={createTaskData.estimatedTime}
                        onChange={(e) =>
                          setCreateTaskData({ ...createTaskData, estimatedTime: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Исполнитель</Label>
                      <Select
                        value={createTaskData.assigneeId || 'unassigned'}
                        onValueChange={(value) =>
                          setCreateTaskData({
                            ...createTaskData,
                            assigneeId: value === 'unassigned' ? '' : value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Не назначен</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Дедлайн</Label>
                    <Input
                      type="date"
                      value={createTaskData.dueDate}
                      onChange={(e) =>
                        setCreateTaskData({ ...createTaskData, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <Button onClick={handleAddTask}>Создать</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          <Button variant="outline" size="icon">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Канбан колонки */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {board.columns.map((column) => (
          <Column
            key={column.id}
            column={column}
            showProjectBadge={showProjectBadge}
            isGlobalBoard={isGlobalBoard}
            onAddTask={handleQuickAddTask}
            onEditTask={setSelectedTask}
            onDeleteTask={handleDeleteTask}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            onDropTask={enableDragAndDrop ? handleDropTask : undefined}
          />
        ))}

        {/* Добавить колонку */}
        {!isGlobalBoard && (
          <>
            {isAddingColumn ? (
              <div className="bg-card flex w-80 min-w-80 flex-col gap-2 rounded-lg border p-3">
                <Input
                  value={newColumnName}
                  onChange={(e) => setNewColumnName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddColumn();
                    if (e.key === 'Escape') {
                      setNewColumnName('');
                      setIsAddingColumn(false);
                    }
                  }}
                  placeholder="Название колонки..."
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleAddColumn}>
                    Добавить
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setNewColumnName('');
                      setIsAddingColumn(false);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingColumn(true)}
                className="text-muted-foreground hover:bg-accent hover:text-accent-foreground flex w-80 min-w-80 items-center justify-center gap-2 rounded-lg border border-dashed p-3 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Добавить колонку
              </button>
            )}
          </>
        )}
      </div>

      {/* Диалог просмотра/редактирования задачи */}
      {selectedTask && (
        <TaskDialog
          task={selectedTask}
          open={!!selectedTask}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          users={users}
          tags={tags}
        />
      )}
    </div>
  );
}
