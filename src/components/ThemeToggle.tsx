"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
        <div className="w-4 h-4 bg-slate-700 rounded-full animate-pulse" />
      </div>
    );
  }

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/[0.08] dark:hover:bg-white/[0.08] light:hover:bg-black/[0.05] transition-all flex items-center justify-center group relative overflow-hidden"
      aria-label="Toggle theme"
    >
      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
      
      {theme === "dark" ? (
        <Sun className="w-4 h-4 text-blue-400 group-hover:rotate-90 transition-transform duration-500" />
      ) : (
        <Moon className="w-4 h-4 text-indigo-600 group-hover:-rotate-12 transition-transform duration-500" />
      )}
    </button>
  );
}
