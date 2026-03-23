import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: "Minerva | IIML Academic Portal",
  description: "Official Academic & Marks Portal for IIM Lucknow",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} font-sans bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-50 via-gray-100 to-slate-200 text-slate-900 min-h-screen selection:bg-primary/30 selection:text-primary`}>
        {children}
        <Toaster 
          position="top-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.8)', // slate-900 80%
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '16px',
              padding: '16px 24px',
              fontWeight: 500,
              boxShadow: '0 10px 40px -10px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
            },
          }} 
        />
      </body>
    </html>
  )
}
