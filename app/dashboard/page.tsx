import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { getAllTags, getAllUserBoards, getAllUsers } from '@/lib/kanban-actions';
import prisma from '@/lib/prisma';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Мои проекты | Work Tracker | iloi',
};

export default async function Dashboard() {
  const session = await getSession();

  // Нет сессии то перенаправляет на авторизацию
  if (!session?.user) {
    redirect('sign-in');
  }

  // Проверяем, есть ли у пользователя проекты
  const projects = await prisma.project.findMany({
    where: {
      createdByUser: {
        id: session.user.id,
      },
    },
  });

  // Если проектов нет — редирект на онбординг
  if (projects.length === 0) {
    redirect('/dashboard/project/create');
  }

  // Получаем все доски пользователя
  const boards = await getAllUserBoards();

  // Получаем пользователей и теги для TaskDialog
  const [users, tags] = await Promise.all([getAllUsers(), getAllTags()]);

  // Находим общую доску (userId !== null, projectId === null)
  const globalBoard = boards.find((b) => b.userId !== null && b.projectId === null);

  return (
    <section className="flex h-screen flex-col px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-4xl font-bold">Мои проекты</h2>
        <Button asChild size="lg">
          <Link href="/dashboard/project/create">
            <Plus /> Добавить проект
          </Link>
        </Button>
      </div>

      {/* Сетка проектов */}
      <div className="mb-8 grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {projects.map((project) => (
          <Link
            href={`/dashboard/project/${project.slug}`}
            key={project.id}
            className="group bg-card hover:border-primary/50 rounded-lg border p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex justify-between gap-4">
              <div className="flex items-center gap-3">
                {project.color && (
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <h3 className="group-hover:text-primary text-lg font-semibold">{project.name}</h3>
              </div>
              <div className="text-muted-foreground flex flex-col gap-2 text-xs">
                <span>Статус: {project.status}</span>
                {project.deadline && (
                  <span>
                    Дедлайн:{' '}
                    {new Date(project.deadline).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                )}
              </div>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-2 line-clamp-2 text-sm">
                {project.description}
              </p>
            )}
          </Link>
        ))}
      </div>

      {/* Общая доска задач */}
      <div className="flex-1 overflow-hidden border-t pt-8">
        {globalBoard && (
          <KanbanBoard
            board={globalBoard}
            showProjectBadge={true}
            enableDragAndDrop={false}
            isGlobalBoard={true}
            users={users}
            tags={tags}
          />
        )}
      </div>
    </section>
  );
}
