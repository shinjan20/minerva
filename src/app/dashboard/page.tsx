import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getSession();

  if (session?.role === "STUDENT") {
    redirect("/dashboard/scorecard");
  }

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <div className="relative z-10">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-800 tracking-tight">Welcome to Minerva</h1>
        <p className="mt-2 text-base text-gray-500 font-medium">Your central command hub for academic administration and performance tracking.</p>
      </div>
      
      {/* Premium Announcements Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/20 group animate-scale-up">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-transform duration-1000 group-hover:scale-150"></div>
        <div className="relative z-10 p-8 sm:p-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner border border-white/30">
             <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-bold tracking-tight mb-2">College Announcements</h2>
            <p className="text-blue-100 text-lg font-medium leading-relaxed max-w-2xl">
              No active administrative broadcasts at the moment. Check back later for system updates or scheduling changes.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
          <span className="w-2 h-6 bg-gradient-to-b from-primary to-purple-500 rounded-full inline-block"></span>
          Identity & Access Footprint
        </h3>
        
        <dl className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {/* Stat Card 1 */}
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(107,33,168,0.08)] transition-all duration-300 group overflow-hidden relative">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors"></div>
            <dt className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">System Role</dt>
            <dd className="mt-1 text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">{session?.role}</dd>
          </div>
          
          {/* Stat Card 2 */}
          {session?.section && (
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(107,33,168,0.08)] transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-colors"></div>
              <dt className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Assigned Section</dt>
              <dd className="mt-1 text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">{session.section}</dd>
            </div>
          )}
          
          {/* Stat Card 3 */}
          {session?.batch && (
            <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-8 border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(107,33,168,0.08)] transition-all duration-300 group overflow-hidden relative">
              <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
              <dt className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Cohort Batch</dt>
              <dd className="mt-1 text-3xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">{session.batch}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
