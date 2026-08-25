import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Steady — GLP-1 Support',
  description: 'A calm daily companion for your GLP-1 routine.',
  openGraph: {
    title: 'Steady — GLP-1 Support',
    description: 'A calm companion for your GLP-1 routine.',
    images: [{ url: '/og.png', width: 1536, height: 1024, alt: 'Steady — GLP-1 Support' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Steady — GLP-1 Support',
    description: 'A calm companion for your GLP-1 routine.',
    images: ['/og.png'],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body className={`${geist.variable} antialiased`}>{children}</body></html>;
}
