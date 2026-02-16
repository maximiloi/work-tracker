'use client';

import { useRouter } from 'next/navigation';

import { signOut } from '@/lib/auth-client';

import { DropdownMenuItem } from './ui/dropdown-menu';

export default function SignOutButton() {
  const router = useRouter();

  return (
    <DropdownMenuItem
      onClick={async () => {
        await signOut();
        router.push('/sign-in');
      }}
    >
      Выход
    </DropdownMenuItem>
  );
}
