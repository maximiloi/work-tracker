import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import { getAllTags, getAllUsers, getOrCreateBoard } from '@/lib/kanban-actions';
import prisma from '@/lib/prisma';

import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';

interface ProjectPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug },
    select: { name: true },
  });

  return {
    title: `${project?.name || 'Проект'} | Work Tracker | iloi`,
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const session = await getSession();
  const { slug } = await params;

  // Нет сессии то перенаправляет на авторизацию
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Получаем проект по slug
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  // Если проект не найден — 404
  if (!project) {
    notFound();
  }

  // Получаем или создаём доску для проекта
  const board = await getOrCreateBoard(project.id);

  // Получаем пользователей и теги для TaskDialog
  const [users, tags] = await Promise.all([getAllUsers(), getAllTags()]);

  return (
    <section className="flex h-screen flex-col px-4 py-8">
      <div className="mb-6 flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-3">
          {project.color && (
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: project.color }} />
          )}
          <h2 className="text-4xl font-bold">{project.name}</h2>
        </div>
      </div>

      {project.description && <p className="text-muted-foreground mb-6">{project.description}</p>}

      {/* Доска проекта */}
      <div className="flex-1 overflow-hidden border-t pt-8">
        <KanbanBoard
          board={board}
          showProjectBadge={false}
          enableDragAndDrop={true}
          users={users}
          tags={tags}
        />
      </div>
    </section>
  );
}
