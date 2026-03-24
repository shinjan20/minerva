"use client";
import React from 'react';

export default function Logo({ className = "", isDark = false }: { className?: string; isDark?: boolean }) {
  const textColor = "text-slate-900 dark:text-white";
  const subtitleColor = "text-slate-500 dark:text-slate-400";

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Primary Minerva Branding */}
      <div className="flex items-center gap-3">
        <img
          src="/minerva_logo.png"
          alt="Minerva Logo"
          className="h-12 md:h-14 w-auto object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300 dark:invert"
        />
        
        <div className="flex flex-col justify-center">
           <span className={`text-2xl md:text-3xl font-black tracking-tighter leading-none ${textColor}`}>
             MINERVA
           </span>
           <span className={`text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase ${subtitleColor} mt-1`}>
             Academic Portal
           </span>
        </div>
      </div>
    </div>
  );
}
