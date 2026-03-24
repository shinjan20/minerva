"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";
import { BarChart3, ScrollText } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

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
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false, id: "", name: ""
  });

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

  const deleteCourse = async () => {
    const { id, name } = deleteModal;
    try {
      const res = await fetch(`/api/courses/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Course deleted successfully");
        fetchCourses();
      } else {
        toast.error("Failed to delete course");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setDeleteModal({ isOpen: false, id: "", name: "" });
    }
  };

  const filteredCourses = courses.filter(c => {
    const secMatch = selectedSection === "ALL" || c.section === selectedSection;
    const batchMatch = selectedBatch === "ALL" || c.batch === selectedBatch;
    return secMatch && batchMatch;
  });

  const [session, setSession] = useState<any>(null);
  useEffect(() => {
    fetch("/api/auth/session").then(res => res.json()).then(data => setSession(data));
  }, []);

  if (loading) return <LoadingPopup message="Fetching course directories..." />;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto space-y-8 md:space-y-12 animate-fade-in-up">
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8 font-[Orbitron]">
        <div className="space-y-1 md:space-y-2">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-center gap-3 md:gap-4">
            <span className="w-1.5 md:w-2.5 h-8 md:h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex flex-wrap items-center gap-x-2 md:gap-x-3">
              <span className="text-slate-900 dark:text-white">Marks &</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">Points Table</span>
            </div>
          </h1>
          <p className="text-[8px] md:text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.15em] md:tracking-[0.2em] opacity-80 pl-4 md:pl-5">Institutional Marks Management · Bi-Directional Ledger Sync</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-4 bg-slate-100 dark:bg-white/[0.03] p-1.5 md:p-2 rounded-2xl md:rounded-3xl border border-slate-200 dark:border-white/[0.08]">
          <div className="flex items-center gap-2 px-3 md:px-4">
             <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Section</span>
             <select 
               value={selectedSection}
               onChange={(e) => setSelectedSection(e.target.value)}
               className="bg-transparent text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest outline-none cursor-pointer p-1.5 md:p-2"
             >
               <option value="ALL">All</option>
               {sections.map(s => <option key={s} value={s}>{s}</option>)}
             </select>
          </div>
          <div className="w-px h-5 md:h-6 bg-slate-200 dark:bg-white/10" />
          <div className="flex items-center gap-2 px-3 md:px-4">
             <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Batch</span>
             <select 
               value={selectedBatch}
               onChange={(e) => setSelectedBatch(e.target.value)}
               className="bg-transparent text-[10px] md:text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest outline-none cursor-pointer p-1.5 md:p-2"
             >
               <option value="ALL">All</option>
               {batches.map(b => <option key={b} value={b}>{b}</option>)}
             </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8 font-[Orbitron]">
        {filteredCourses.map((course, idx) => (
          <div key={course.id} className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] backdrop-blur-3xl hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:border-blue-500/30 transition-all duration-500 rounded-2xl md:rounded-[2rem] overflow-hidden group shadow-sm dark:shadow-2xl relative" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="px-6 md:px-8 py-8 md:py-10">
              <div className="flex justify-between items-start mb-4 md:mb-6">
                <h3 className="text-lg md:text-xl font-black text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase leading-tight line-clamp-2 h-12 md:h-14 flex-1">{course.name}</h3>
                {session?.role === "OFFICE_STAFF" && (
                   <button 
                    onClick={() => setDeleteModal({ isOpen: true, id: course.id, name: course.name })}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                   </button>
                )}
              </div>
              
              <div className="flex gap-2 md:gap-3">
                <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black bg-blue-500/10 text-blue-600 dark:text-blue-400 uppercase tracking-[0.15em] border border-blue-500/20">
                  Sec {course.section}
                </span>
                <span className="inline-flex items-center px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 uppercase tracking-[0.15em] border border-slate-200 dark:border-white/10">
                  {course.batch}
                </span>
              </div>
            </div>
            
            <div className="px-6 md:px-8 py-6 md:py-8 border-t border-slate-100 dark:border-white/[0.05] bg-slate-50/50 dark:bg-white/[0.01] flex flex-col gap-3 md:gap-4">
              <Link 
                href={`/dashboard/marks/${course.id}`} 
                className="w-full flex justify-center items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border border-slate-200 dark:border-white/[0.1] shadow-sm dark:shadow-xl text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl text-slate-600 dark:text-slate-300 bg-white dark:bg-white/[0.05] hover:bg-slate-50 dark:hover:bg-white/[0.1] hover:text-blue-600 dark:hover:text-white transition-all hover:scale-[1.02] active:scale-95"
              >
                <BarChart3 className="w-4 h-4 text-blue-500/50" />
                View Points Table
              </Link>
              <Link 
                href={`/dashboard/marks/${course.id}/upload`} 
                className="w-full flex justify-center items-center gap-2 md:gap-3 px-4 md:px-6 py-3 md:py-4 border border-transparent shadow-lg dark:shadow-[0_12px_24px_rgba(37,99,235,0.25)] text-[10px] md:text-[11px] font-black uppercase tracking-widest rounded-xl md:rounded-2xl text-white bg-blue-600 hover:bg-blue-500 transition-all hover:scale-[1.02] active:scale-95"
              >
                <ScrollText className="w-4 h-4 text-white/50" />
                Upload Data
              </Link>
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
      <ConfirmModal 
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
        onConfirm={deleteCourse}
        title="Delete Course"
        message={`Are you sure you want to permanently delete "${deleteModal.name}"? This will also remove all associated marks and rankings. This action cannot be undone.`}
      />
    </div>
  );
}
