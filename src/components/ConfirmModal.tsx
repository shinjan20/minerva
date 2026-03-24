"use client";

import { useEffect, useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmTextColor?: string;
}

export default function ConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmTextColor = "text-red-500"
}: ConfirmModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 font-[Orbitron]">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#0a0d14] border border-slate-200 dark:border-white/[0.08] rounded-[2.5rem] shadow-2xl overflow-hidden animate-scale-up">
        {/* Top Accent Bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-amber-500" />
        
        {/* Content */}
        <div className="p-8 md:p-10">
          <div className="flex items-start gap-6">
            <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-bold uppercase tracking-tight opacity-80">
                {message}
              </p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <button
              onClick={onClose}
              className="flex-1 px-8 py-4 bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-8 py-4 bg-white dark:bg-white/[0.02] ${confirmTextColor} border border-slate-200 dark:border-white/[0.1] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-red-500/10 hover:border-red-500/50 transition-all shadow-sm`}
            >
              Confirm Action
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
