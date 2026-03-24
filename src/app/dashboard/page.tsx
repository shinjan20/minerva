import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (session?.role === "STUDENT") {
    redirect("/dashboard/scorecard");
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up font-[Orbitron]">
      
      {/* Header */}
      <div className="pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">System Status: Nominal</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
          <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white">Welcome to</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-blue-400 to-indigo-500 dark:from-blue-400 dark:via-blue-200 dark:to-indigo-500">
              Minerva
            </span>
          </div>
        </h1>
        <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-5">Your central command hub for academic administration and performance tracking.</p>
      </div>

      {/* Announcement Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-slate-200 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] backdrop-blur-3xl p-10 group shadow-sm dark:shadow-none">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5 dark:from-blue-600/10 dark:to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-500/10 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
        <div className="relative z-10 flex items-start gap-8">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wider">College Announcements</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-loose opacity-80 uppercase font-bold tracking-tight">
              No active administrative broadcasts at the moment. Check back later for system updates or scheduling changes.
            </p>
          </div>
        </div>
      </div>

      {/* Identity Cards */}
      <div>
        <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.6)]" />
          Identity & Access
        </h3>

        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Role card */}
          <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-8 group hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-blue-500/30 transition-all duration-300 shadow-sm dark:shadow-xl">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <dt className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-4">System Role</dt>
            <dd className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{session?.role}</dd>
            <div className="mt-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Active session</span>
            </div>
          </div>

          {/* Section card */}
          {session?.section && (
            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-8 group hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-indigo-500/30 transition-all duration-300 shadow-sm dark:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
              <dt className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-4">Assigned Section</dt>
              <dd className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Section {session.section}</dd>
              <div className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">{session.batch}</div>
            </div>
          )}

          {/* Batch card */}
          {session?.batch && (
            <div className="relative overflow-hidden rounded-[2rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-8 group hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-emerald-500/30 transition-all duration-300 shadow-sm dark:shadow-xl">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <dt className="text-[10px] font-black tracking-[0.2em] text-slate-500 uppercase mb-4">Cohort Batch</dt>
              <dd className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{session.batch}</dd>
              <div className="mt-4 text-[10px] text-slate-500 font-black uppercase tracking-widest">PGP Programme</div>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
