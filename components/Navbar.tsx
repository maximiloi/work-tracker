import { Briefcase } from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback } from './ui/avatar';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuTrigger } from './ui/dropdown-menu';

import { getSession } from '@/lib/auth';

export default async function Navbar() {
  const session = await getSession();

  return (
    <nav className='border-b border-gray-200 bg-white'>
      <div className='container mx-auto flex justify-between h-16 items-center px-4'>
        <Link href={'/'} className='flex items-center gap-2'>
          <Briefcase />
          Work Tracker
        </Link>
        <div className='flex items-center gap-4'>
          {session?.user ? (
            <>
              <Link href={'/dashboard'}>
                <Button
                  variant={'ghost'}
                  className='text-gray-700 hover:text-black'
                >
                  Доска
                </Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger>
                  <Button>
                    <Avatar>
                      <AvatarFallback className='bg-primary text-white'>
                        {session.user.name[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link href={'/sign-in'}>
                <Button
                  variant={'ghost'}
                  className='text-gray-700 hover:text-black'
                >
                  Войти
                </Button>
              </Link>
              <Link href={'/sign-up'}>
                <Button>Регистрация</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
