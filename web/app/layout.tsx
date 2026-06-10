import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthWrapper from '@/components/AuthWrapper';

const geist = Geist({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MonTask',
  description: 'AI-powered voice to task app for Mongolian speakers',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="mn" className={geist.className} suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors duration-200">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){if(localStorage.getItem('theme')==='dark'){document.documentElement.classList.add('dark')}})()`,
          }}
        />
        <AuthProvider>
          <AuthWrapper>{children}</AuthWrapper>
        </AuthProvider>
      </body>
    </html>
  );
}
