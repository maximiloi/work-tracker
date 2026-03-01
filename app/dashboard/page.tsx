import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Мои проекты | Work Tracker',
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
    redirect('/dashboard/onboarding');
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-4xl font-bold">Мои проекты</h2>
        <Button asChild size="lg">
          <Link href="/dashboard/onboarding">
            <Plus /> Добавить проект
          </Link>
        </Button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {projects.map((project) => (
          <Button asChild key={project.id} size="lg" variant="outline">
            <Link href={`/dashboard/projects/${project.slug}`}>
              {project.color && (
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: project.color }} />
              )}
              {project.name}
            </Link>
          </Button>
        ))}
      </div>
    </section>
  );
}
