import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-slate-50 text-gray-900 selection:bg-primary selection:text-white font-sans flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Dynamic Background exactly like Landing Page */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] mix-blend-multiply animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/20 blur-[120px] mix-blend-multiply animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-[40%] left-[60%] w-[30%] h-[30%] rounded-full bg-blue-600/20 blur-[100px] mix-blend-multiply animate-pulse" style={{ animationDelay: '4s' }}></div>
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-flex flex-col items-center gap-6 hover:scale-[1.02] transition-transform duration-300">
          <div className="flex items-center justify-center gap-6">
            <div className="h-24 w-24 bg-white rounded-2xl p-3 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center">
              <img
                src="/minerva_logo.png"
                alt="Minerva Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <div>
            <span className="text-3xl font-extrabold tracking-tight text-gray-900 block">MINERVA</span>
            <span className="text-xs text-primary tracking-widest font-semibold uppercase">IIM Lucknow</span>
          </div>
        </Link>
        <h2 className="mt-8 text-2xl font-bold text-gray-800">{title}</h2>
        <p className="mt-2 text-sm text-gray-500">{subtitle}</p>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white/70 py-8 px-4 border border-white backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] sm:rounded-3xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
