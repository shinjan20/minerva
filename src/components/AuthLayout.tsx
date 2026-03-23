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
            <div className="h-20 w-20 bg-white rounded-2xl p-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.7)] flex items-center justify-center">
              <svg className="w-full h-full text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9-5m9 5l9-5" />
              </svg>
            </div>
            
            <div className="w-px h-12 bg-gray-300 rounded-full"></div>
            
            <img 
              src="/iiml-logo.png" 
              alt="IIM Lucknow Logo" 
              className="h-24 w-auto object-contain drop-shadow-md bg-white rounded-2xl p-2"
            />
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
