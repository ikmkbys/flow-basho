import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import Providers from '@/components/Providers';
import ErrorBoundary from '@/components/ErrorBoundary';
import Footer from '@/components/Footer';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FLOW BASHO — 飲み会の場所を投票で決めよう',
  description: 'URLを共有するだけ。みんなの「行きたい」を集めてお店を決める場所投票ツール。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.className}>
      <body className="min-h-screen" style={{ display: 'flex', flexDirection: 'column' }}>
        <Providers>
          <ErrorBoundary>
            <div style={{ flex: 1 }}>{children}</div>
          </ErrorBoundary>
          <Footer />
        </Providers>
        <Analytics />
      </body>
    </html>
  );
}
