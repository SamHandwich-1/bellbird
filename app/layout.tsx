import type { Metadata } from 'next';
import { Fraunces, Manrope, JetBrains_Mono } from 'next/font/google';
import { Header } from '@/components/shared/Header';
import { Providers } from '@/components/shared/Providers';
import './globals.css';

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-manrope',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Bellbird',
  description: 'A clear note in the noise. Ideas before signals.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} ${jetbrainsMono.variable}`}
    >
      <body className="min-h-screen">
        <Providers>
          <Header />
          <main
            style={{
              maxWidth: 920,
              margin: '0 auto',
              padding: '0 32px 96px',
            }}
          >
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
