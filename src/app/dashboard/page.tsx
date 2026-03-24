import { getSession } from "@/lib/auth";
import Link from "next/link";
import { GraduationCap, BarChart3, Clock, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) return null;

  const isStudent = session.role === "STUDENT" || session.role === "CR";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8 animate-fade-in-up font-[Orbitron]">
      
      {/* Header */}
      <div className="pb-6 md:pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">System Status: Nominal</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-start md:items-center gap-3 md:gap-4">
          <span className="w-1.5 md:w-2.5 h-8 md:h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] mt-1 md:mt-0" />
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
            <span className="text-slate-900 dark:text-white">Welcome back,</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 dark:from-blue-400 dark:via-blue-200 dark:to-indigo-500 truncate max-w-[280px] md:max-w-none">
              {session.name || session.email.split('@')[0]}
            </span>
          </div>
        </h1>
        <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-4 md:pl-5">
          {session.role === "OFFICE_STAFF" 
            ? "Your central command hub for academic administration." 
            : "Monitor your academic performance and manage your course profile."}
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Stats/Actions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Announcement Banner */}
          <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] backdrop-blur-3xl p-6 md:p-10 group shadow-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative z-10 flex flex-col md:flex-row items-start gap-6 md:gap-8">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 md:w-7 md:h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">Administrative Broadcasts</h2>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 leading-relaxed opacity-80 uppercase font-bold tracking-tight">
                  No active announcements for your section at this time. Stay tuned for updates regarding upcoming term schedules.
                </p>
              </div>
            </div>
          </div>

          {/* Student Specific Quick Links */}
          {isStudent && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link href="/dashboard/scorecard" className="flex items-center gap-4 p-6 rounded-2xl bg-blue-600/10 border border-blue-500/20 hover:bg-blue-600/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">View Scorecard</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Check Term Marks & GPA</p>
                </div>
              </Link>
              <Link href="/dashboard/marks" className="flex items-center gap-4 p-6 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 hover:bg-indigo-600/20 transition-all group">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">Marks Table</h4>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight mt-1">Raw Marks Data Stream</p>
                </div>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: Identity/Status */}
        <div className="space-y-6">
          {/* Profile Quick Card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-6 group hover:border-blue-500/30 transition-all duration-300 shadow-xl">
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
             <div className="flex items-center gap-4 mb-6">
                <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center font-black text-white text-lg">
                  {(session.name || session.email).charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">{session.name || "Student"}</h4>
                  <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em]">{session.role}</p>
                </div>
             </div>
             
             {isStudent && (
               <div className="space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-400">Section</span>
                    <span className="text-slate-900 dark:text-white">{session.section || "N/A"}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-black uppercase">
                    <span className="text-slate-400">Batch</span>
                    <span className="text-slate-900 dark:text-white">{session.batch || "N/A"}</span>
                  </div>
               </div>
             )}
             
             <div className="space-y-4 mt-4">
                <div className="flex justify-between items-center text-[10px] font-black uppercase border-t border-white/5 pt-4">
                  <span className="text-slate-400">Login Time</span>
                  <span className="text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
