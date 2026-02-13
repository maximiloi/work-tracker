'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-client';

export default function SignUpPage() {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const result = await signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        setError(result.error.message ?? 'Ошибка регистрации');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      console.log('🚀 ~ handleSubmit ~ err:', err);
      setError('Ошибка такой аккаунт уже существует');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className='flex min-h-[calc(100vh-5rem)] items-center justify-center bg-white p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader>
          <CardTitle>Регистрация</CardTitle>
          <CardDescription>
            Создать аккаунт и начать трекать свои задачи
          </CardDescription>
        </CardHeader>

        <form className='space-y-4' onSubmit={handleSubmit}>
          <CardContent className='space-y-4'>
            {error && <p className='text-red-500'>{error}</p>}
            <div className='space-y-2'>
              <Label htmlFor='name'>Имя</Label>
              <Input
                id='name'
                name='name'
                type='text'
                placeholder='Введите имя'
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                placeholder='Введите e-mail'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>Пароль</Label>
              <Input
                id='password'
                name='password'
                type='password'
                minLength={8}
                placeholder='Введите Пароль'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col space-y-4'>
            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? 'Создается аккаунт...' : 'Создать аккаунт'}
            </Button>
            <p>
              Уже есть аккаунт?{' '}
              <Link href={'/sign-in'} className='text-gray-600'>
                Войти
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </section>
  );
}
