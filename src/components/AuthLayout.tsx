import React from 'react';
import Link from 'next/link';

export default function AuthLayout({ children, title, subtitle }: { children: React.ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen bg-[#060b14] text-white flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Animated ambient glow orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[55%] rounded-full bg-violet-600/20 blur-[130px] animate-glow" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[55%] h-[50%] rounded-full bg-indigo-600/15 blur-[130px] animate-glow" style={{ animationDelay: '1.5s' }} />
        <div className="absolute top-[40%] left-[50%] w-[35%] h-[35%] rounded-full bg-purple-800/10 blur-[100px] animate-glow" style={{ animationDelay: '3s' }} />
        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md text-center animate-fade-in-up">
        <Link href="/" className="inline-flex flex-col items-center gap-5 hover:scale-[1.02] transition-transform duration-300">
          {/* Logo */}
          <div className="relative">
            <div className="absolute inset-0 bg-violet-500/30 blur-2xl rounded-full scale-150" />
            <div className="relative h-24 w-24 bg-white/[0.06] border border-white/10 rounded-3xl p-3 backdrop-blur-md flex items-center justify-center shadow-[0_0_40px_rgba(124,58,237,0.2)]">
              <img src="/minerva_logo.png" alt="Minerva" className="w-full h-full object-contain invert" />
            </div>
          </div>

          {/* Wordmark */}
          <div>
            <span className="text-3xl font-black tracking-tight text-white block" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>MINERVA</span>
            <span className="text-xs text-violet-400 tracking-[0.3em] font-semibold uppercase">IIM Lucknow · Academic Portal</span>
          </div>
        </Link>

        <div className="mt-6">
          <h2 className="text-xl font-bold text-white/90">{title}</h2>
          <p className="mt-1.5 text-sm text-slate-400">{subtitle}</p>
        </div>
      </div>

      <div className="relative z-10 mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-scale-up" style={{ animationDelay: '0.1s' }}>
        <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-2xl rounded-3xl px-8 py-9 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
          {children}
        </div>
        <p className="text-center text-xs text-slate-600 mt-6">
          Protected by enterprise-grade security · © {new Date().getFullYear()} Minerva
        </p>
      </div>
    </div>
  );
}
