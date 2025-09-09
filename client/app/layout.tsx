import type { Metadata } from 'next';
import { Geist, Mulish, IBM_Plex_Sans_Arabic, Cairo, Tajawal, Poppins } from 'next/font/google';
import './globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ReduxProvider from '../lib/ReduxProvider';
import { Toaster } from '@/components/ui/sonner';

// Police principale Cairo
const cairo = Cairo({
  subsets: ['latin', 'arabic'],
  variable: '--font-cairo',
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
});

// Police Tajawal pour l'arabe
const tajawal = Tajawal({
  subsets: ['arabic'],
  variable: '--font-tajawal',
  weight: ['200', '300', '400', '500', '700', '800', '900'],
});

// Police Poppins pour l'anglais/français
const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal', 'italic'],
});

const mulish = Mulish({
  subsets: ['latin'],
  variable: '--font-mulish',
  weight: ['200', '300', '400', '500', '600', '700', '800', '900'],
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  variable: '--font-ibm-plex-sans-arabic',
  weight: ['100', '200', '300', '400', '500', '600', '700'],
});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const locales = ['fr', 'ar', 'en'];

export const metadata: Metadata = {
  title: 'my reprise',
  description: 'my reprise',
  icons: '/icon.ico',
  openGraph: {
    title: 'my reprise',
    description: 'my reprise',
    url: 'https://myreprise.ma',
    siteName: 'my reprise',
    images: [
      {
        url: '/myreprise_og.jpg',
        width: 1200,
        height: 630,
        alt: 'my reprise',
      },
    ],
    locale: 'ar_MA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'my reprise',
    description: 'my reprise',
    images: ['/myreprise_og.jpg'],
    creator: '@myreprise',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar">
      <body
        className={`${cairo.variable} ${tajawal.variable} ${poppins.variable} ${mulish.variable} ${ibmPlexSansArabic.variable} ${geistSans.variable} font-cairo antialiased bg-background text-foreground`}
      >
        <ReduxProvider>
          {children}
        </ReduxProvider>
        <Toaster position="top-center" richColors theme="light" />
      </body>
    </html>
  );
}
