import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LogOut } from "lucide-react";

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
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row relative">
      {/* Absolute background element for extra depth */}
      <div className="absolute inset-0 bg-grid-slate-100/[0.04] bg-[length:16px_16px] pointer-events-none -z-10" />
      
      <aside className="w-full md:w-72 bg-white/70 backdrop-blur-xl border-r border-gray-200/60 flex-shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.1)] z-10 flex flex-col">
        <div className="h-20 flex items-center px-8 border-b border-gray-100/80 gap-4 bg-white/40">
          <img 
            src="/minerva_logo.png" 
            alt="Minerva Logo" 
            className="h-12 w-auto drop-shadow-sm hover:scale-105 transition-transform"
          />
          <div className="flex flex-col justify-center">
            <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-600 leading-tight tracking-tight">Minerva</span>
            <span className="text-[10px] text-gray-400 font-bold tracking-widest uppercase mt-0.5">IIM Lucknow</span>
          </div>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5">
            <Link href="/dashboard" className="block px-4 py-2.5 text-sm font-semibold rounded-xl text-gray-700 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
              Dashboard
            </Link>
            {session.role === "OFFICE_STAFF" && (
              <>
                <Link href="/dashboard/students" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                  Student Roster
                </Link>
                <Link href="/dashboard/admin/cr" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                  Manage CRs
                </Link>
                <Link href="/dashboard/courses" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                  Courses & Breakup
                </Link>
              </>
            )}
            {(session.role === "OFFICE_STAFF" || session.role === "CR") && (
              <Link href="/dashboard/marks" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                Marks Table Data
              </Link>
            )}
            {(session.role === "STUDENT" || session.role === "CR") && (
              <Link href="/dashboard/scorecard" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-primary bg-primary/5 hover:bg-primary/10 border border-primary/10 transition-all font-semibold shadow-sm">
                My Scorecard
              </Link>
            )}
            {session.role === "OFFICE_STAFF" && (
              <Link href="/dashboard/audit" className="block px-4 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-white hover:text-primary hover:shadow-sm transition-all border border-transparent hover:border-gray-100">
                Audit Log
              </Link>
            )}
          </nav>
          
          <div className="p-6 border-t border-gray-100/80 bg-white/40">
            <div className="flex items-center gap-3 px-2 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-purple-400 text-white flex items-center justify-center font-bold text-lg shadow-inner">
                {session?.email?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {session.email}
                </p>
                <p className="text-xs text-primary font-medium tracking-wide truncate">{session.role}</p>
              </div>
            </div>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-red-600 bg-red-50/50 rounded-xl hover:bg-red-50 border border-red-100/50 hover:border-red-200 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </form>
          </div>
      </aside>
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
}
