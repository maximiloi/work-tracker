import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { redirect } from 'next/navigation';

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
  redirect(`/dashboard/projects/${projects[0].slug}`);

  return <section className='container mx-auto px-4'>Dashboard</section>;
}
