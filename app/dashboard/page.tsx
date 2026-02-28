import { Plus } from 'lucide-react';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';

import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Мои проекты | Work Tracker',
};

export default async function Dashboard() {
  const session = await getSession();

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

  // Если проекты есть — редирект на первый проект
  // redirect(`/dashboard/projects/${projects[0].slug}`);

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Мои проекты</h2>
        <a href="/dashboard/onboarding">
          <Button className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800">
            <Plus /> Добавить проект
          </Button>
        </a>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {projects.map((project) => (
          <a
            key={project.id}
            href={`/dashboard/projects/${project.slug}`}
            className="flex items-center gap-2 rounded-md border bg-gray-50 px-4 py-2 text-sm font-medium hover:bg-gray-100"
          >
            {project.color && (
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: project.color }}
              />
            )}
            {project.name}
          </a>
        ))}
      </div>
    </section>
  );
}
