import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import LenisProvider from '@/components/LenisProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chattrix - Secure Chat Made Simple',
  description: 'Experience the future of secure communication with Chattrix. Create private chat rooms instantly, no registration required.',
  keywords: 'secure chat, private messaging, encrypted communication, chat rooms, privacy-focused chat',
  authors: [{ name: 'Chattrix Team' }],
  creator: 'Chattrix',
  publisher: 'Chattrix',
  robots: 'index, follow',
  openGraph: {
    title: 'Chattrix - Secure Chat Made Simple',
    description: 'Experience the future of secure communication with Chattrix. Create private chat rooms instantly, no registration required.',
    url: 'https://chattrix.com',
    siteName: 'Chattrix',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Chattrix - Secure Chat Made Simple',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Chattrix - Secure Chat Made Simple',
    description: 'Experience the future of secure communication with Chattrix. Create private chat rooms instantly, no registration required.',
    images: ['/og-image.jpg'],
  },
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no',
  themeColor: '#1e40af',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={inter.className}>
        <LenisProvider>
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
