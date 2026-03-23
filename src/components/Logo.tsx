"use client";
import React from 'react';

export default function Logo({ className = "", isDark = false }: { className?: string; isDark?: boolean }) {
  const textColor = isDark ? "text-white" : "text-gray-900";
  const subtitleColor = isDark ? "text-gray-300" : "text-gray-500";

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Primary Minerva Branding */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary to-purple-500 rounded-xl blur-[14px] opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>
          <div className="w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-primary to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-900/10 border border-white/20 relative z-10 overflow-hidden backdrop-blur-sm">
            {/* Custom Modern Academic Abstract SVG */}
            <svg className="w-7 h-7 md:w-8 md:h-8 text-white relative z-10 transform group-hover:scale-110 transition-transform duration-500 ease-out" fill="none" viewBox="0 0 32 32" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" stroke="none" />
            </svg>
            <div className="absolute top-0 right-0 w-8 h-8 bg-white/20 rounded-bl-full filter blur-[2px]"></div>
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
           <span className={`text-2xl md:text-3xl font-black tracking-tighter leading-none ${textColor}`}>
             MINERVA
           </span>
           <span className={`text-[10px] md:text-xs font-bold tracking-[0.2em] uppercase ${subtitleColor} mt-1`}>
             Academic Portal
           </span>
        </div>
      </div>

      {/* Aesthetic Vertical Divider */}
      <div className={`w-px h-10 ${isDark ? 'bg-white/20' : 'bg-gray-200'} hidden sm:block mx-1`}></div>

      {/* IIM Lucknow Official Logo Container */}
      <div className="flex items-center">
        <img 
          src="/iiml-logo.png" 
          alt="IIM Lucknow Logo" 
          className="h-10 md:h-14 w-auto object-contain filter drop-shadow hover:drop-shadow-lg transition-all duration-300"
          onError={(e) => {
             // If user hasn't dropped the image into public/iiml-logo.png yet, show fallback Wiki URL
             (e.target as HTMLImageElement).src = "https://upload.wikimedia.org/wikipedia/en/thumb/f/f3/Indian_Institute_of_Management_Lucknow_Logo.svg/1200px-Indian_Institute_of_Management_Lucknow_Logo.svg.png";
          }}
        />
      </div>
    </div>
  );
}
