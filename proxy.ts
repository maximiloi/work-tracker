import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isSignInPage = request.nextUrl.pathname.startsWith('/sign-in');
  const isSignUpPage = request.nextUrl.pathname.startsWith('/sign-up');

  if ((isSignInPage || isSignUpPage) && session?.user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
