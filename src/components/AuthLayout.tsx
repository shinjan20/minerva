import React from 'react';
import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-[#f8fafc] flex flex-col justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-[Orbitron] transition-colors duration-300">
      
      {/* Theme Toggle Positioned Top-Right */}
      <div className="absolute top-6 right-6 z-50 animate-fade-in">
        <ThemeToggle />
      </div>

      {/* Animated ambient glow orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[55%] rounded-full bg-blue-600/20 blur-[130px] animate-glow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[50%] rounded-full bg-indigo-600/15 blur-[130px] animate-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[50%] w-[35%] h-[35%] rounded-full bg-blue-800/10 blur-[100px] animate-glow" style={{ animationDelay: '3s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(100,116,139,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(100,116,139,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-up">
        <Link href="/" className="inline-flex flex-col items-center gap-3 sm:gap-5 hover:scale-[1.02] transition-transform duration-300">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-150" />
            <div className="relative h-16 w-16 sm:h-24 sm:w-24 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl p-2 sm:p-3 backdrop-blur-md flex items-center justify-center shadow-lg dark:shadow-[0_0_40px_rgba(124,58,237,0.2)]">
              <img src="/minerva_logo.png" alt="Minerva" className="w-full h-full object-contain dark:invert" />
            </div>
          </div>

          {/* Wordmark */}
          <div>
            <span className="text-2xl sm:text-3xl font-black tracking-tighter text-slate-900 dark:text-white block uppercase">MINERVA</span>
            <span className="text-[8px] sm:text-[10px] text-blue-600 dark:text-blue-400 tracking-[0.4em] font-black uppercase">IIM Lucknow · Academic Portal</span>
          </div>
        </Link>

        <div className="mt-4 sm:mt-6">
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white/90 uppercase tracking-wide">{title}</h2>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 px-4">{subtitle}</p>
        </div>
      </div>

      <div className="relative z-10 mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-scale-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-2xl rounded-[2rem] sm:rounded-3xl px-6 sm:px-8 py-7 sm:py-9 shadow-xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {children}
        </div>
        <p className="text-center text-[10px] sm:text-xs text-slate-600 mt-6 font-bold uppercase tracking-widest opacity-60">
          Enterprise Security Enabled · © {new Date().getFullYear()} Minerva
        </p>
      </div>
    </div>
  );
}
