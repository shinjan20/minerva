import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Users, UserCog, BookOpen, BarChart3, GraduationCap, ScrollText } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row relative transition-colors duration-300">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-600/5 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-50 dark:bg-[#05070a] border-r border-slate-200 dark:border-white/[0.06] flex-shrink-0 z-10 flex flex-col relative font-[Orbitron] transition-colors duration-300">
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

        {/* Logo Area */}
        <div className="h-[76px] flex items-center justify-between px-5 border-b border-slate-200 dark:border-white/[0.06] bg-white/[0.01]">
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

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          <Link href="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-black uppercase tracking-wider bg-blue-600/10 text-blue-600 border border-blue-500/20 dark:bg-blue-600/20 dark:text-blue-400 dark:border-blue-500/30 shadow-sm dark:shadow-[0_0_15px_rgba(59,130,246,0.15)] transition-all duration-200">
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            Dashboard
          </Link>

          {session.role === "OFFICE_STAFF" && (
            <>
              <p className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Administration</p>
              <Link href="/dashboard/students" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <Users className="w-4 h-4 flex-shrink-0 opacity-50" />
                Student Roster
              </Link>
              <Link href="/dashboard/admin/cr" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <UserCog className="w-4 h-4 flex-shrink-0 opacity-50" />
                Manage CRs
              </Link>
              <Link href="/dashboard/courses" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <BookOpen className="w-4 h-4 flex-shrink-0 opacity-50" />
                Courses & Breakup
              </Link>
            </>
          )}

          {(session.role === "OFFICE_STAFF" || session.role === "CR") && (
            <>
              <p className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Marks</p>
              <Link href="/dashboard/marks" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <BarChart3 className="w-4 h-4 flex-shrink-0 opacity-50" />
                Marks Table
              </Link>
            </>
          )}

          {(session.role === "STUDENT" || session.role === "CR") && (
            <>
              <p className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">Academic</p>
              <Link href="/dashboard/scorecard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <GraduationCap className="w-4 h-4 flex-shrink-0 opacity-50" />
                My Scorecard
              </Link>
            </>
          )}

          {session.role === "OFFICE_STAFF" && (
            <>
              <p className="px-4 pt-6 pb-2 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-colors">System</p>
              <Link href="/dashboard/audit" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold text-slate-600 dark:text-slate-400 hover:bg-blue-500/5 dark:hover:bg-white/[0.05] hover:text-blue-600 dark:hover:text-white transition-all duration-200 uppercase tracking-wide">
                <ScrollText className="w-4 h-4 flex-shrink-0 opacity-50" />
                Audit Log
              </Link>
            </>
          )}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-slate-200 dark:border-white/[0.06] bg-slate-100/30 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-[0_0_12px_rgba(124,58,237,0.5)]">
              {session?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">{session.email}</p>
              <p className="text-xs text-blue-600 dark:text-violet-400 font-medium tracking-wide">{session.role}</p>
            </div>
          </div>
          <form action="/api/auth/logout" method="POST">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-semibold text-red-400 bg-red-500/8 rounded-xl hover:bg-red-500/15 border border-red-500/10 hover:border-red-500/25 transition-all duration-200"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="flex-1 overflow-auto relative z-10">
        {children}
      </main>
    </div>
  );
}
