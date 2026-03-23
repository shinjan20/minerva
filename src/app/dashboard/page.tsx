import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (session?.role === "STUDENT") {
    redirect("/dashboard/scorecard");
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Dashboard</span>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
          Welcome to{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 via-purple-300 to-indigo-400">
            Minerva
          </span>
        </h1>
        <p className="mt-2 text-slate-400 font-medium">Your central command hub for academic administration and performance tracking.</p>
      </div>

      {/* Announcement Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-br from-indigo-900/40 via-violet-900/30 to-slate-900/60 backdrop-blur-xl p-7 group">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex items-start gap-5">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white mb-1">College Announcements</h2>
            <p className="text-slate-400 leading-relaxed">
              No active administrative broadcasts at the moment. Check back later for system updates or scheduling changes.
            </p>
          </div>
        </div>
      </div>

      {/* Identity Cards */}
      <div>
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 inline-block" />
          Identity & Access
        </h3>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Role card */}
          <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.07] p-6 group hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-300 hover:shadow-[0_4px_30px_rgba(124,58,237,0.12)]">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-violet-500 to-indigo-500" />
            <dt className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">System Role</dt>
            <dd className="text-2xl font-black text-white">{session?.role}</dd>
            <div className="mt-3 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-400 font-medium">Active session</span>
            </div>
          </div>

          {/* Section card */}
          {session?.section && (
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.07] p-6 group hover:bg-white/[0.07] hover:border-indigo-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-sky-500" />
              <dt className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Assigned Section</dt>
              <dd className="text-2xl font-black text-white">Section {session.section}</dd>
              <div className="mt-3 text-xs text-slate-500 font-medium">{session.batch}</div>
            </div>
          )}

          {/* Batch card */}
          {session?.batch && (
            <div className="relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.07] p-6 group hover:bg-white/[0.07] hover:border-emerald-500/30 transition-all duration-300">
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-teal-500" />
              <dt className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-3">Cohort Batch</dt>
              <dd className="text-2xl font-black text-white">{session.batch}</dd>
              <div className="mt-3 text-xs text-slate-500 font-medium">PGP Programme</div>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
