import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from '@/components/ThemeProvider';

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
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased transition-colors duration-300">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 5000,
            style: {
              background: 'rgba(2, 6, 23, 0.95)',
              color: '#f8fafc',
              border: '1px solid rgba(37, 99, 235, 0.4)',
              borderRadius: '20px',
              padding: '16px 28px',
              fontWeight: 900,
              fontSize: '12px',
              fontFamily: "'Orbitron', sans-serif",
              letterSpacing: '0.15em',
              boxShadow: '0 0 40px rgba(37, 99, 235, 0.2), inset 0 0 15px rgba(37, 99, 235, 0.1)',
              textTransform: 'uppercase',
              backdropFilter: 'blur(16px)',
              maxWidth: '550px',
            },
            success: {
              iconTheme: { primary: '#10b981', secondary: '#020617' },
              style: {
                border: '1px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 0 30px rgba(16, 185, 129, 0.25)',
              }
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#020617' },
              style: {
                border: '1px solid rgba(239, 68, 68, 0.5)',
                boxShadow: '0 0 30px rgba(239, 68, 68, 0.25)',
              }
            },
          }}
        />
      </body>
    </html>
  );
}
