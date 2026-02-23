import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Dashboard() {
  const session = await getSession();

  if (!session?.user) {
    redirect('sign-in');
  }

  return <section className='container mx-auto px-4'>Dashboard</section>;
}
