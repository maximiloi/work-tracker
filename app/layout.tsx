import { JetBrains_Mono } from 'next/font/google';

import Navbar from '@/components/Navbar';

import type { Metadata } from 'next';

import './globals.css';

const JetBrainsMono = JetBrains_Mono({
  variable: '--font-geist-mono',
  subsets: ['cyrillic'],
});

export const metadata: Metadata = {
  title: 'Work Tracker App | iloi',
  description: 'Canban next app',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${JetBrainsMono.variable} antialiased`}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
