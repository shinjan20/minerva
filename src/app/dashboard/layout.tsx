import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut, LayoutDashboard, Users, UserCog, BookOpen, BarChart3, GraduationCap, ScrollText } from "lucide-react";

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
    <div className="min-h-screen bg-[#060b14] flex flex-col md:flex-row relative">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-[40%] h-[40%] rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[40%] h-[40%] rounded-full bg-indigo-700/8 blur-[120px]" />
      </div>

      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-[#0a0f1c] border-r border-white/[0.06] flex-shrink-0 z-10 flex flex-col relative">
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent" />

        {/* Logo Area */}
        <div className="h-[72px] flex items-center px-5 border-b border-white/[0.06] gap-3">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 bg-violet-500/25 blur-lg rounded-xl" />
            <div className="relative h-9 w-9 bg-white/[0.06] border border-white/10 rounded-xl flex items-center justify-center">
              <img src="/minerva_logo.png" alt="Minerva" className="h-6 w-6 object-contain invert" />
            </div>
          </div>
          <div>
            <span className="font-black text-white text-lg leading-none tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>Minerva</span>
            <p className="text-[10px] text-violet-400/80 font-semibold tracking-widest uppercase mt-0.5">Academic Portal</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <Link href="/dashboard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-white/[0.07] border border-white/[0.07] transition-all duration-200">
            <LayoutDashboard className="w-4 h-4 text-violet-400 flex-shrink-0" />
            Dashboard
          </Link>

          {session.role === "OFFICE_STAFF" && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Administration</p>
              <Link href="/dashboard/students" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <Users className="w-4 h-4 flex-shrink-0" />
                Student Roster
              </Link>
              <Link href="/dashboard/admin/cr" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <UserCog className="w-4 h-4 flex-shrink-0" />
                Manage CRs
              </Link>
              <Link href="/dashboard/courses" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <BookOpen className="w-4 h-4 flex-shrink-0" />
                Courses & Breakup
              </Link>
            </>
          )}

          {(session.role === "OFFICE_STAFF" || session.role === "CR") && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Marks</p>
              <Link href="/dashboard/marks" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <BarChart3 className="w-4 h-4 flex-shrink-0" />
                Marks Table Data
              </Link>
            </>
          )}

          {(session.role === "STUDENT" || session.role === "CR") && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Academic</p>
              <Link href="/dashboard/scorecard" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <GraduationCap className="w-4 h-4 flex-shrink-0" />
                My Scorecard
              </Link>
            </>
          )}

          {session.role === "OFFICE_STAFF" && (
            <>
              <p className="px-3 pt-4 pb-1 text-[10px] font-bold text-slate-600 uppercase tracking-widest">System</p>
              <Link href="/dashboard/audit" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:bg-white/[0.05] hover:text-white transition-all duration-200">
                <ScrollText className="w-4 h-4 flex-shrink-0" />
                Audit Log
              </Link>
            </>
          )}
        </nav>

        {/* User card */}
        <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-3 mb-3 px-1">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center font-bold text-white text-sm flex-shrink-0 shadow-[0_0_12px_rgba(124,58,237,0.5)]">
              {session?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{session.email}</p>
              <p className="text-xs text-violet-400 font-medium tracking-wide">{session.role}</p>
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
