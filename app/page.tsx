import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function Home() {
  return (
    <div className='flex min-h-[calc(100vh-5rem)] flex-col bg-white'>
      <main className='flex-1'>
        <section className='container mx-auto px-4 py-32'>
          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='text-black mb-6 text-6xl font-bold capitalize'>
              work tracker
            </h1>
            <p className='text-muted-foreground mb-10'>
              Организуй свое рабочее пространство прямо сейчас
            </p>
          </div>
          <div className='flex flex-col items-center gap-4'>
            <Link href={'/sign-up'}>
              <Button size={'lg'} className='h-12 px-8 text-lg font-medium'>
                Начать
                <ArrowRight className='ml-2' />
              </Button>
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
