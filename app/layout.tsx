import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Pomme — Get into a healthy rhythm',
  description: 'A motivating daily companion for your GLP-1 routine.',
  openGraph: {
    title: 'Pomme',
    description: 'Get into a healthy rhythm',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Pomme — Get into a healthy rhythm' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pomme',
    description: 'Get into a healthy rhythm',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} antialiased`}>{children}</body></html>;
}
