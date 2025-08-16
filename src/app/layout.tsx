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
  metadataBase: new URL('https://chattrix-69.vercel.app'),
  openGraph: {
    title: 'Chattrix - Secure Chat Made Simple',
    description: 'Experience the future of secure communication with Chattrix. Create private chat rooms instantly, no registration required.',
    url: 'https://chattrix-69.vercel.app',
    siteName: 'Chattrix',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Chattrix - Secure Chat Made Simple',
    description: 'Experience the future of secure communication with Chattrix. Create private chat rooms instantly, no registration required.',
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.svg',
    apple: '/icons/icon-192.svg',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
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
