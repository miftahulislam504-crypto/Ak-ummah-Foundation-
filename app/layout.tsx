import type { Metadata } from 'next';
import { Noto_Sans_Bengali, Amiri } from 'next/font/google';
import './globals.css';
import AuthProvider from '@/components/providers/AuthProvider';
import PWAProvider  from '@/components/providers/PWAProvider';
import { Toaster } from 'sonner';

const notoSansBengali = Noto_Sans_Bengali({
  subsets: ['bengali'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-bangla',
  display: 'swap',
});

const amiri = Amiri({
  subsets: ['arabic'],
  weight: ['400', '700'],
  variable: '--font-arabic',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'এক উম্মাহ ফাউন্ডেশন',
  description: 'সুদমুক্ত সহায়তা, বিশ্বাসের বন্ধন',
  manifest: '/manifest.json',
  themeColor: '#166534',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="bn" className={`${notoSansBengali.variable} ${amiri.variable}`}>
      <body className="font-bangla bg-gray-50 text-gray-900 antialiased">
        <AuthProvider>
        <PWAProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              style: { fontFamily: 'var(--font-bangla)' },
            }}
          />
        </PWAProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
