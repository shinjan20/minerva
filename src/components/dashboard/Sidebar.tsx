"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LogOut, LayoutDashboard, Users, UserCog, 
  BookOpen, BarChart3, GraduationCap, ScrollText,
  Menu, X 
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface SidebarProps {
  session: {
    user?: { id: string; email: string; role: string };
    email: string;
    name?: string | null;
    role: string;
  };
}

export default function Sidebar({ session }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const navLinks = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["OFFICE_STAFF", "CR", "STUDENT"] },
    { href: "/dashboard/students", icon: Users, label: "Student Roster", roles: ["OFFICE_STAFF"], section: "Administration" },
    { href: "/dashboard/admin/cr", icon: UserCog, label: "Manage CRs", roles: ["OFFICE_STAFF"] },
    { href: "/dashboard/courses", icon: BookOpen, label: "Courses & Breakup", roles: ["OFFICE_STAFF"] },
    { href: "/dashboard/marks", icon: BarChart3, label: "Marks Table", roles: ["OFFICE_STAFF", "CR"], section: "Marks" },
    { href: "/dashboard/scorecard", icon: GraduationCap, label: "My Scorecard", roles: ["STUDENT", "CR"], section: "Academic" },
    { href: "/dashboard/audit", icon: ScrollText, label: "Audit Log", roles: ["OFFICE_STAFF"], section: "System" },
  ];

  const filteredLinks = navLinks.filter(link => link.roles.includes(session.role));

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden h-16 bg-slate-50 dark:bg-[#05070a] border-b border-slate-200 dark:border-white/[0.06] flex items-center justify-between px-4 sticky top-0 z-50 transition-colors">
        <div className="flex items-center gap-3">
          <div className="relative h-8 w-8 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-lg flex items-center justify-center shadow-sm">
            <img src="/minerva_logo.png" alt="Minerva" className="h-5 w-5 object-contain dark:invert" />
          </div>
          <span className="font-black text-slate-900 dark:text-white text-base tracking-tight uppercase font-[Orbitron]">Minerva</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-white/5 rounded-lg transition-all"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-slate-50 dark:bg-[#05070a] border-r border-slate-200 dark:border-white/[0.06] 
        transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 flex-shrink-0 flex flex-col font-[Orbitron]
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Logo Area (Desktop) */}
        <div className="hidden md:flex h-[76px] items-center justify-between px-6 border-b border-slate-200 dark:border-white/[0.06] bg-white/[0.01]">
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-blue-500/25 blur-lg rounded-xl" />
              <div className="relative h-9 w-9 bg-white dark:bg-white/[0.06] border border-slate-200 dark:border-white/10 rounded-xl flex items-center justify-center shadow-sm">
                <img src="/minerva_logo.png" alt="Minerva" className="h-6 w-6 object-contain dark:invert" />
              </div>
            </div>
            <div>
              <span className="font-black text-slate-900 dark:text-white text-lg leading-none tracking-tight uppercase">Minerva</span>
              <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold tracking-[0.2em] uppercase mt-0.5">Portal</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Mobile Header (Side Overlay) */}
        <div className="md:hidden flex items-center justify-between p-6 border-b border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <img src="/minerva_logo.png" alt="Minerva" className="h-6 w-6 dark:invert" />
            <span className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">Minerva</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {filteredLinks.map((link, idx) => (
            <div key={link.href}>
              {link.section && (
                <p className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  {link.section}
                </p>
              )}
              <Link 
                href={link.href}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-bold uppercase tracking-wide transition-all duration-200
                  ${pathname === link.href 
                    ? "bg-blue-600/10 text-blue-600 border border-blue-500/20 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 shadow-sm" 
                    : "text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white"
                  }
                `}
              >
                <link.icon className={`w-4 h-4 flex-shrink-0 ${pathname === link.href ? "opacity-100" : "opacity-50"}`} />
                {link.label}
              </Link>
            </div>
          ))}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/30 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-xs flex-shrink-0 shadow-lg">
              {(session?.name || session?.email)?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate uppercase">{session?.name || session?.email.split('@')[0]}</p>
              <p className="text-[9px] text-blue-600 dark:text-blue-400 font-extrabold tracking-widest uppercase">{session.role}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-xs font-black uppercase tracking-widest text-red-500 bg-red-500/8 rounded-xl hover:bg-red-500/15 border border-red-500/10 transition-all shadow-sm"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
