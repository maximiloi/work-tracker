'use server';

import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';

export interface KanbanBoardData {
  id: string;
  name: string;
  description: string | null;
  projectId: string | null;
  userId: string | null;
  isDefault: boolean;
  columns: ColumnWithTasks[];
  project?: {
    id: string;
    name: string;
    color: string | null;
  } | null;
}

export interface ColumnWithTasks {
  id: string;
  name: string;
  order: number;
  boardId: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: TaskWithDetails[];
  projectName?: string | null; // Название проекта, если колонка принадлежит только одному проекту
  projectColor?: string | null; // Цвет проекта, если колонка принадлежит только одному проекту
}

export interface TaskWithDetails {
  id: string;
  title: string;
  description: string | null;
  notes: string | null;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  complexity: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT' | null;
  estimatedTime: number | null;
  spentTime: number | null;
  order: number;
  assigneeId: string | null;
  projectId: string;
  columnId: string;
  createdBy: string;
  updatedBy: string | null;
  completedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  dueDate: Date | null;
  assignee: {
    id: string;
    name: string;
    email: string;
    image: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    color: string | null;
  };
  tags: {
    tag: {
      id: string;
      name: string;
      color: string | null;
    };
  }[];
  subtasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  attachments: {
    id: string;
    name: string;
    url: string;
    type: string;
  }[];
  column?: {
    id: string;
    name: string;
  };
}

export interface UserWithProjects {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

export interface TagWithCount {
  id: string;
  name: string;
  color: string | null;
  tasksCount: number;
}

/**
 * Получает или создаёт доску для пользователя
 * - Если projectId передан — доска проекта
 * - Если нет — общая доска пользователя (все проекты)
 */
export async function getOrCreateBoard(projectId?: string): Promise<KanbanBoardData> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  // Ищем существующую доску
  let board = await prisma.board.findFirst({
    where: {
      projectId: projectId ?? null,
      userId: projectId ? null : userId, // Для общей доски userId = пользователю
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                },
              },
              attachments: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Если доски нет — создаём
  if (!board) {
    board = await prisma.board.create({
      data: {
        name: projectId ? 'Основная' : 'Мои задачи',
        description: projectId ? null : 'Все задачи из всех проектов',
        projectId: projectId ?? null,
        userId: projectId ? null : userId,
        isDefault: true,
      },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                project: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
                tags: {
                  include: {
                    tag: {
                      select: {
                        id: true,
                        name: true,
                        color: true,
                      },
                    },
                  },
                },
                subtasks: {
                  select: {
                    id: true,
                    title: true,
                    completed: true,
                  },
                },
                attachments: {
                  select: {
                    id: true,
                    name: true,
                    url: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Создаём колонки по умолчанию для новой доски
    const defaultColumns = [
      { name: 'Нужно сделать', order: 0 },
      { name: 'В работе', order: 1 },
      { name: 'На проверке', order: 2 },
      { name: 'Готово', order: 3 },
    ];

    await prisma.column.createMany({
      data: defaultColumns.map((col) => ({
        name: col.name,
        order: col.order,
        boardId: board!.id,
      })),
    });

    // Перезагружаем доску с колонками
    board = await prisma.board.findUnique({
      where: { id: board.id },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        columns: {
          orderBy: { order: 'asc' },
          include: {
            tasks: {
              orderBy: { order: 'asc' },
              include: {
                assignee: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                  },
                },
                project: {
                  select: {
                    id: true,
                    name: true,
                    color: true,
                  },
                },
                tags: {
                  include: {
                    tag: {
                      select: {
                        id: true,
                        name: true,
                        color: true,
                      },
                    },
                  },
                },
                subtasks: {
                  select: {
                    id: true,
                    title: true,
                    completed: true,
                  },
                },
                attachments: {
                  select: {
                    id: true,
                    name: true,
                    url: true,
                    type: true,
                  },
                },
              },
            },
          },
        },
      },
    })!;
  }

  // Для общей доски (без projectId) загружаем задачи из всех проектов пользователя
  if (!projectId && board && board.userId === userId) {
    // Получаем все проекты пользователя
    const userProjects = await prisma.project.findMany({
      where: {
        OR: [{ createdBy: userId }, { updatedBy: userId }],
      },
      select: { id: true },
    });

    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length > 0) {
      // Получаем все колонки из всех проектов с информацией о проектах
      const allProjectBoards = await prisma.board.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          columns: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Собираем все уникальные названия колонок и определяем, каким проектам они принадлежат
      const columnToProjectsMap = new Map<
        string,
        { projectNames: Set<string>; projectIds: Set<string>; projectColors: Set<string> }
      >();

      for (const projectBoard of allProjectBoards) {
        const projectName = projectBoard.project?.name || null;
        const projectId = projectBoard.project?.id || null;
        const projectColor = projectBoard.project?.color || null;

        for (const column of projectBoard.columns) {
          if (!columnToProjectsMap.has(column.name)) {
            columnToProjectsMap.set(column.name, {
              projectNames: new Set(),
              projectIds: new Set(),
              projectColors: new Set(),
            });
          }
          const entry = columnToProjectsMap.get(column.name)!;
          if (projectName) entry.projectNames.add(projectName);
          if (projectId) entry.projectIds.add(projectId);
          if (projectColor) entry.projectColors.add(projectColor);
        }
      }

      // Создаём маппинг: название колонки -> информация о проекте
      const columnProjectInfo = new Map<
        string,
        { projectName: string | null; projectColor: string | null }
      >();
      for (const [columnName, info] of columnToProjectsMap.entries()) {
        // Если колонка принадлежит только одному проекту — указываем его
        if (info.projectNames.size === 1) {
          columnProjectInfo.set(columnName, {
            projectName: Array.from(info.projectNames)[0],
            projectColor: Array.from(info.projectColors)[0] || null,
          });
        } else if (info.projectNames.size < allProjectBoards.length) {
          // Если колонка есть не во всех проектах — указываем перечисление
          columnProjectInfo.set(columnName, {
            projectName: Array.from(info.projectNames).join(', '),
            projectColor: null, // Несколько проектов — без цвета
          });
        } else {
          // Колонка во всех проектах — null (общая)
          columnProjectInfo.set(columnName, { projectName: null, projectColor: null });
        }
      }

      // Получаем все уникальные названия колонок
      const allColumnNames = Array.from(columnToProjectsMap.keys());

      // Загружаем все задачи из проектов пользователя
      const allTasks = await prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              completed: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: {
            select: {
              id: true,
              name: true,
              url: true,
              type: true,
            },
          },
        },
      });

      // Создаём маппинг задач по колонкам (по названию)
      const columnTasksMap = new Map<string, TaskWithDetails[]>();
      allColumnNames.forEach((colName) => {
        columnTasksMap.set(colName, []);
      });

      allTasks.forEach((task) => {
        const tasks = columnTasksMap.get(task.column.name) || [];
        tasks.push(task as unknown as TaskWithDetails);
        columnTasksMap.set(task.column.name, tasks);
      });

      // Формируем итоговые колонки для общей доски
      const firstBoardColumns = allProjectBoards[0]?.columns || [];
      const orderedColumnNames = new Set<string>();

      // Сначала добавляем колонки в порядке первой доски
      firstBoardColumns.forEach((col) => orderedColumnNames.add(col.name));
      // Затем добавляем остальные
      allColumnNames.forEach((colName) => orderedColumnNames.add(colName));

      const updatedColumns: ColumnWithTasks[] = Array.from(orderedColumnNames).map(
        (colName, index) => {
          const existingColumn = board.columns.find((c) => c.name === colName);
          return {
            id: existingColumn?.id || `virtual-${colName}`,
            name: colName,
            order: index,
            boardId: board.id,
            createdAt: existingColumn?.createdAt || new Date(),
            updatedAt: existingColumn?.updatedAt || new Date(),
            tasks: columnTasksMap.get(colName) || [],
            projectName: columnProjectInfo.get(colName)?.projectName || undefined,
            projectColor: columnProjectInfo.get(colName)?.projectColor || undefined,
          };
        },
      );

      board.columns = updatedColumns;
    }
  }

  return board as unknown as KanbanBoardData;
}

/**
 * Создаёт новую колонку на доске
 */
export async function createColumn(boardId: string, name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const board = await prisma.board.findUnique({
    where: { id: boardId },
    include: { columns: true },
  });

  if (!board) {
    throw new Error('Board not found');
  }

  // Проверяем права доступа
  if (board.userId && board.userId !== session.user.id) {
    throw new Error('No access to this board');
  }

  const maxOrder = board.columns.reduce((max, col) => Math.max(max, col.order), -1);

  const column = await prisma.column.create({
    data: {
      name,
      order: maxOrder + 1,
      boardId,
    },
  });

  revalidatePath('/dashboard');
  return column;
}

/**
 * Создаёт новую задачу в колонке
 */
export async function createTask(
  columnId: string,
  title: string,
  description?: string,
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT',
  complexity?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT',
  estimatedTime?: number,
  assigneeId?: string | null,
  dueDate?: Date | null,
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const column = await prisma.column.findUnique({
    where: { id: columnId },
    include: {
      board: {
        include: {
          project: true,
        },
      },
    },
  });

  if (!column) {
    throw new Error('Column not found');
  }

  // Определяем projectId
  let projectId: string;
  if (column.board.projectId) {
    projectId = column.board.projectId;
  } else if (column.board.userId) {
    // Для общей доски нужно указать projectId при создании
    throw new Error('projectId is required for personal board tasks');
  } else {
    throw new Error('Invalid board configuration');
  }

  const maxOrder = await prisma.task
    .findMany({
      where: { columnId },
      select: { order: true },
      orderBy: { order: 'desc' },
      take: 1,
    })
    .then((tasks) => (tasks.length > 0 ? tasks[0].order + 1 : 0));

  const task = await prisma.task.create({
    data: {
      title,
      description: description ?? null,
      priority: priority ?? 'NORMAL',
      complexity: complexity ?? null,
      estimatedTime: estimatedTime ?? null,
      assigneeId: assigneeId ?? null,
      dueDate: dueDate ?? null,
      columnId,
      projectId,
      createdBy: session.user.id,
      order: maxOrder,
    },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
      subtasks: {
        select: {
          id: true,
          title: true,
          completed: true,
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
        },
      },
    },
  });

  revalidatePath('/dashboard');
  return task as TaskWithDetails;
}

/**
 * Перемещает задачу в другую колонку
 * Если задача из проекта, а перемещение происходит в общей доске,
 * находит соответствующую колонку в проекте задачи
 */
export async function moveTask(taskId: string, newColumnId: string, newOrder: number) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: {
      project: true,
      column: {
        include: {
          board: true,
        },
      },
    },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  // Получаем информацию о новой колонке
  const newColumn = await prisma.column.findUnique({
    where: { id: newColumnId },
    include: {
      board: true,
    },
  });

  if (!newColumn) {
    throw new Error('Column not found');
  }

  // Если перемещаем в общей доске (board.userId !== null),
  // то нужно найти соответствующую колонку в проекте задачи
  let targetColumnId = newColumnId;

  if (newColumn.board.userId && !newColumn.board.projectId) {
    // Это общая доска, нужно найти колонку в проекте задачи
    const projectBoard = await prisma.board.findFirst({
      where: {
        projectId: task.projectId,
      },
      include: {
        columns: true,
      },
    });

    if (projectBoard) {
      // Находим колонку в проекте с таким же названием
      const correspondingColumn = projectBoard.columns.find((col) => col.name === newColumn.name);

      if (correspondingColumn) {
        targetColumnId = correspondingColumn.id;
      } else {
        // Если колонки с таким названием нет, используем первую колонку проекта
        targetColumnId = projectBoard.columns[0]?.id ?? newColumnId;
      }
    }
  }

  // Обновляем задачу
  await prisma.task.update({
    data: {
      columnId: targetColumnId,
      order: newOrder,
    },
    where: { id: taskId },
  });

  // Сдвигаем остальные задачи в новой колонке
  const tasksInColumn = await prisma.task.findMany({
    where: {
      columnId: targetColumnId,
      id: { not: taskId },
    },
    select: { id: true, order: true },
    orderBy: { order: 'asc' },
  });

  const updates = tasksInColumn.map((t, index) => {
    const targetOrder = index >= newOrder ? index + 1 : index;
    return prisma.task.update({
      where: { id: t.id },
      data: { order: targetOrder },
    });
  });

  await prisma.$transaction(updates);

  revalidatePath('/dashboard');
}

/**
 * Обновляет задачу
 */
export async function updateTask(
  taskId: string,
  data: {
    title?: string;
    description?: string;
    notes?: string;
    priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
    complexity?: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
    estimatedTime?: number;
    spentTime?: number;
    assigneeId?: string | null;
    dueDate?: Date | null;
  },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
  });

  if (!task) {
    throw new Error('Task not found');
  }

  const updatedTask = await prisma.task.update({
    data: {
      ...data,
      updatedBy: session.user.id,
    },
    where: { id: taskId },
    include: {
      assignee: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
        },
      },
      subtasks: {
        select: {
          id: true,
          title: true,
          completed: true,
        },
      },
      attachments: {
        select: {
          id: true,
          name: true,
          url: true,
          type: true,
        },
      },
    },
  });

  revalidatePath('/dashboard');
  return updatedTask as TaskWithDetails;
}

/**
 * Добавляет подзадачу
 */
export async function addSubtask(taskId: string, title: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const subtask = await prisma.subtask.create({
    data: {
      title,
      taskId,
    },
  });

  revalidatePath('/dashboard');
  return subtask;
}

/**
 * Переключает статус подзадачи
 */
export async function toggleSubtask(subtaskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const subtask = await prisma.subtask.findUnique({
    where: { id: subtaskId },
  });

  if (!subtask) {
    throw new Error('Subtask not found');
  }

  await prisma.subtask.update({
    data: { completed: !subtask.completed },
    where: { id: subtaskId },
  });

  revalidatePath('/dashboard');
}

/**
 * Удаляет подзадачу
 */
export async function deleteSubtask(subtaskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.subtask.delete({
    where: { id: subtaskId },
  });

  revalidatePath('/dashboard');
}

/**
 * Получает все теги
 */
export async function getAllTags(): Promise<TagWithCount[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tags = await prisma.tag.findMany({
    include: {
      tasks: true,
    },
    orderBy: { name: 'asc' },
  });

  return tags.map((tag) => ({
    ...tag,
    tasksCount: tag.tasks.length,
  }));
}

/**
 * Создаёт новый тег
 */
export async function createTag(name: string, color: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const tag = await prisma.tag.create({
    data: {
      name,
      color,
    },
  });

  revalidatePath('/dashboard');
  return tag;
}

/**
 * Назначает тег задаче
 */
export async function addTagToTask(taskId: string, tagId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.taskTag.create({
    data: {
      taskId,
      tagId,
    },
  });

  revalidatePath('/dashboard');
}

/**
 * Удаляет тег у задачи
 */
export async function removeTagFromTask(taskId: string, tagId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.taskTag.delete({
    where: {
      taskId_tagId: {
        taskId,
        tagId,
      },
    },
  });

  revalidatePath('/dashboard');
}

/**
 * Получает всех пользователей для выбора исполнителя
 */
export async function getAllUsers(): Promise<UserWithProjects[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
    },
    orderBy: { name: 'asc' },
  });

  return users;
}

/**
 * Отмечает задачу как выполненную
 */
export async function completeTask(taskId: string, completed: boolean) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.task.update({
    data: {
      completedBy: completed ? session.user.id : null,
      completedAt: completed ? new Date() : null,
    },
    where: { id: taskId },
  });

  revalidatePath('/dashboard');
}

/**
 * Удаляет задачу
 */
export async function deleteTask(taskId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.task.delete({
    where: { id: taskId },
  });

  revalidatePath('/dashboard');
}

/**
 * Переименовывает колонку
 */
export async function updateColumnName(columnId: string, name: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const column = await prisma.column.update({
    data: { name },
    where: { id: columnId },
  });

  revalidatePath('/dashboard');
  return column;
}

/**
 * Удаляет колонку (и все задачи в ней)
 */
export async function deleteColumn(columnId: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  await prisma.column.delete({
    where: { id: columnId },
  });

  revalidatePath('/dashboard');
}

/**
 * Получает все проекты пользователя для общей доски
 */
export async function getUserProjects() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ createdBy: session.user.id }, { tasks: { some: { assigneeId: session.user.id } } }],
    },
    select: {
      id: true,
      name: true,
      color: true,
      slug: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return projects;
}

/**
 * Получает все доски пользователя (общую и доски проектов)
 */
export async function getAllUserBoards(): Promise<KanbanBoardData[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    throw new Error('Unauthorized');
  }

  const userId = session.user.id;

  // Получаем общую доску пользователя
  const globalBoard = await prisma.board.findFirst({
    where: {
      userId,
      projectId: null,
    },
    include: {
      columns: {
        orderBy: { order: 'asc' },
        include: {
          tasks: {
            orderBy: { order: 'asc' },
            include: {
              assignee: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  image: true,
                },
              },
              project: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
              tags: {
                include: {
                  tag: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                },
              },
              subtasks: {
                select: {
                  id: true,
                  title: true,
                  completed: true,
                },
              },
              column: {
                select: {
                  id: true,
                  name: true,
                },
              },
              attachments: {
                select: {
                  id: true,
                  name: true,
                  url: true,
                  type: true,
                },
              },
            },
          },
        },
      },
    },
  });

  // Получаем все проекты пользователя
  const userProjects = await prisma.project.findMany({
    where: {
      OR: [{ createdBy: userId }, { updatedBy: userId }],
    },
    include: {
      boards: {
        include: {
          columns: {
            orderBy: { order: 'asc' },
            include: {
              tasks: {
                orderBy: { order: 'asc' },
                include: {
                  assignee: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                      image: true,
                    },
                  },
                  project: {
                    select: {
                      id: true,
                      name: true,
                      color: true,
                    },
                  },
                  tags: {
                    include: {
                      tag: {
                        select: {
                          id: true,
                          name: true,
                          color: true,
                        },
                      },
                    },
                  },
                  subtasks: {
                    select: {
                      id: true,
                      title: true,
                      completed: true,
                    },
                  },
                  attachments: {
                    select: {
                      id: true,
                      name: true,
                      url: true,
                      type: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const boards: KanbanBoardData[] = [];

  // Добавляем общую доску
  if (globalBoard) {
    // Для общей доски загружаем задачи из всех проектов
    const projectIds = userProjects.map((p) => p.id);

    if (projectIds.length > 0) {
      // Получаем все колонки из всех проектов с информацией о проектах
      const allProjectBoards = await prisma.board.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          columns: {
            orderBy: { order: 'asc' },
          },
        },
      });

      // Собираем все уникальные названия колонок и определяем, каким проектам они принадлежат
      const columnToProjectsMap = new Map<
        string,
        { projectNames: Set<string>; projectIds: Set<string>; projectColors: Set<string> }
      >();

      for (const board of allProjectBoards) {
        const projectName = board.project?.name || null;
        const projectId = board.project?.id || null;
        const projectColor = board.project?.color || null;

        for (const column of board.columns) {
          if (!columnToProjectsMap.has(column.name)) {
            columnToProjectsMap.set(column.name, {
              projectNames: new Set(),
              projectIds: new Set(),
              projectColors: new Set(),
            });
          }
          const entry = columnToProjectsMap.get(column.name)!;
          if (projectName) entry.projectNames.add(projectName);
          if (projectId) entry.projectIds.add(projectId);
          if (projectColor) entry.projectColors.add(projectColor);
        }
      }

      // Создаём маппинг: название колонки -> информация о проекте
      const columnProjectInfo = new Map<
        string,
        { projectName: string | null; projectColor: string | null }
      >();
      for (const [columnName, info] of columnToProjectsMap.entries()) {
        // Если колонка принадлежит только одному проекту — указываем его
        if (info.projectNames.size === 1) {
          columnProjectInfo.set(columnName, {
            projectName: Array.from(info.projectNames)[0],
            projectColor: Array.from(info.projectColors)[0] || null,
          });
        } else if (info.projectNames.size < allProjectBoards.length) {
          // Если колонка есть не во всех проектах — указываем перечисление
          columnProjectInfo.set(columnName, {
            projectName: Array.from(info.projectNames).join(', '),
            projectColor: null, // Несколько проектов — без цвета
          });
        } else {
          // Колонка во всех проектах — null (общая)
          columnProjectInfo.set(columnName, { projectName: null, projectColor: null });
        }
      }

      // Получаем все уникальные названия колонок в правильном порядке
      const allColumnNames = Array.from(columnToProjectsMap.keys());

      // Загружаем все задачи из проектов пользователя
      const allTasks = await prisma.task.findMany({
        where: {
          projectId: { in: projectIds },
        },
        include: {
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
          project: {
            select: {
              id: true,
              name: true,
              color: true,
            },
          },
          tags: {
            include: {
              tag: {
                select: {
                  id: true,
                  name: true,
                  color: true,
                },
              },
            },
          },
          subtasks: {
            select: {
              id: true,
              title: true,
              completed: true,
            },
          },
          column: {
            select: {
              id: true,
              name: true,
            },
          },
          attachments: {
            select: {
              id: true,
              name: true,
              url: true,
              type: true,
            },
          },
        },
      });

      // Создаём маппинг задач по колонкам (по названию)
      const columnTasksMap = new Map<string, TaskWithDetails[]>();
      allColumnNames.forEach((colName) => {
        columnTasksMap.set(colName, []);
      });

      allTasks.forEach((task) => {
        const tasks = columnTasksMap.get(task.column.name) || [];
        tasks.push(task as unknown as TaskWithDetails);
        columnTasksMap.set(task.column.name, tasks);
      });

      // Формируем итоговые колонки для общей доски
      // Используем порядок из первой доски, затем добавляем уникальные
      const firstBoardColumns = allProjectBoards[0]?.columns || [];
      const orderedColumnNames = new Set<string>();

      // Сначала добавляем колонки в порядке первой доски
      firstBoardColumns.forEach((col) => orderedColumnNames.add(col.name));
      // Затем добавляем остальные
      allColumnNames.forEach((colName) => orderedColumnNames.add(colName));

      globalBoard.columns = Array.from(orderedColumnNames).map((colName, index) => {
        const existingColumn = globalBoard.columns.find((c) => c.name === colName);
        return {
          id: existingColumn?.id || `virtual-${colName}`,
          name: colName,
          order: index,
          boardId: globalBoard.id,
          createdAt: existingColumn?.createdAt || new Date(),
          updatedAt: existingColumn?.updatedAt || new Date(),
          tasks: (columnTasksMap.get(colName) || []) as any,
          projectName: columnProjectInfo.get(colName)?.projectName || undefined,
          projectColor: columnProjectInfo.get(colName)?.projectColor || undefined,
        };
      }) as any;
    }

    boards.push(globalBoard as KanbanBoardData);
  }

  // Добавляем доски проектов
  userProjects.forEach((project) => {
    const projectBoard = project.boards[0];
    if (projectBoard) {
      boards.push({
        ...projectBoard,
        project: {
          id: project.id,
          name: project.name,
          color: project.color,
        },
      } as KanbanBoardData);
    }
  });

  return boards;
}
