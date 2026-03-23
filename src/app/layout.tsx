import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from 'react-hot-toast';

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
      <body>
        {children}
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(10, 10, 25, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              color: '#e2e8f3',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '14px',
              padding: '14px 20px',
              fontWeight: 500,
              fontSize: '14px',
              boxShadow: '0 20px 60px -10px rgba(0,0,0,0.7), 0 0 0 1px rgba(124,58,237,0.1)',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#000' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#000' },
            },
          }}
        />
      </body>
    </html>
  );
}
