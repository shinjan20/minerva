"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";
import { BarChart3, ScrollText } from "lucide-react";

type Course = {
  id: string;
  name: string;
  section: string;
  batch: string;
};

export default function MarksIndexPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSection, setSelectedSection] = useState("ALL");
  const [selectedBatch, setSelectedBatch] = useState("ALL");

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses);
      }
    } catch (err) {
      toast.error("Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  const sections = Array.from(new Set(courses.map(c => c.section))).sort();
  const batches = Array.from(new Set(courses.map(c => c.batch))).sort();

  const filteredCourses = courses.filter(c => {
    const secMatch = selectedSection === "ALL" || c.section === selectedSection;
    const batchMatch = selectedBatch === "ALL" || c.batch === selectedBatch;
    return secMatch && batchMatch;
  });

  if (loading) return <LoadingPopup message="Fetching course directories..." />;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-12 animate-fade-in-up">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8 font-[Orbitron]">
        <div className="space-y-2">
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
          <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white">Marks &</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">Points Table</span>
          </div>
        </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] opacity-80">Institutional Marks Management · Bi-Directional Ledger Sync</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-slate-100 dark:bg-white/[0.03] p-2 rounded-3xl border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2 px-4">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Section</span>
             <select 
               value={selectedSection}
               onChange={(e) => setSelectedSection(e.target.value)}
               className="bg-transparent text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest outline-none cursor-pointer p-2"
             >
               <option value="ALL">All Sections</option>
               {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
             </select>
          </div>
          <div className="w-px h-6 bg-slate-200 dark:bg-white/10 hidden sm:block" />
          <div className="flex items-center gap-2 px-4">
             <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Batch</span>
             <select 
               value={selectedBatch}
               onChange={(e) => setSelectedBatch(e.target.value)}
               className="bg-transparent text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest outline-none cursor-pointer p-2"
             >
               <option value="ALL">All Cohorts</option>
               {batches.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 font-[Orbitron]">
        {filteredCourses.map((course, idx) => (
          <div key={course.id} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] backdrop-blur-3xl hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500 rounded-[2rem] overflow-hidden group shadow-sm dark:shadow-2xl relative" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="px-8 py-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase leading-tight">{course.name}</h3>
              
              <div className="flex gap-3">
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] border border-blue-500/20">
                  Sec {course.section}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-[10px] font-black bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] border border-slate-200 dark:border-white/10">
                  Batch {course.batch}
                </span>
              </div>
            </div>
            
            <div className="px-8 py-8 border-t border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-4">
              <a 
                href={`/dashboard/marks/${course.id}`} 
                className="w-full flex justify-center items-center gap-3 px-6 py-4 border border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-xl text-[11px] font-black uppercase tracking-widest rounded-2xl text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.1] hover:text-blue-600 dark:hover:text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-blue-500/50" />
                View Points Table
              </a>
              <a 
                href={`/dashboard/marks/${course.id}/upload`} 
                className="w-full flex justify-center items-center gap-3 px-6 py-4 border border-transparent shadow-lg dark:shadow-[0_12px_24px_rgba(37,99,235,0.25)] text-[11px] font-black uppercase tracking-widest rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95"
              >
                <ScrollText className="w-4 h-4 text-white/50" />
                Upload Spreadsheets
              </a>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full bg-white dark:bg-white/[0.03] backdrop-blur-3xl border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] rounded-[2.5rem] p-24 text-center animate-scale-up group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-transparent to-purple-500/10 opacity-30 group-hover:opacity-50 transition-opacity duration-1000"></div>
            <div className="relative z-10 space-y-8">
              <div className="w-32 h-32 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-3xl flex items-center justify-center mx-auto shadow-sm dark:shadow-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-700">
                <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                <svg className="w-14 h-14 text-blue-600 dark:text-blue-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div className="space-y-3">
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">No Courses Initialized</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium max-w-lg mx-auto text-lg leading-relaxed">
                  No active academic courses have been provisioned for your cohort. 
                  <span className="block mt-2 text-blue-600 dark:text-indigo-400/80">Office Staff must securely originate course definitions before marks can be mapped.</span>
                </p>
              </div>
              <div className="pt-6">
                <button 
                  onClick={() => window.location.reload()} 
                  className="px-8 py-4 bg-slate-100 dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] rounded-2xl text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all hover:scale-105 active:scale-95 shadow-sm dark:shadow-xl"
                >
                  Refresh Database Sync
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
