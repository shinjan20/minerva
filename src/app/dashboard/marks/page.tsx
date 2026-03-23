"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";

type Course = {
  id: string;
  name: string;
  section: string;
  batch: string;
};

export default function MarksIndexPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <LoadingPopup message="Fetching course directories..." />;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-800 tracking-tight">Marks & Points Table</h1>
          <p className="mt-2 text-base text-gray-500 font-medium">Select an active course directory to view student ranks, upload spreadsheet scores, or construct grading rubrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
        {courses.map((course, idx) => (
          <div key={course.id} className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.12)] transition-all duration-500 rounded-3xl border border-white/80 overflow-hidden group flex flex-col relative" style={{ animationDelay: `${idx * 100}ms` }}>
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
            
            <div className="px-8 py-8 flex-1">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-4 group-hover:text-primary transition-colors">{course.name}</h3>
              
              <div className="flex gap-3 mb-2">
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary uppercase tracking-widest border border-primary/20">
                  Sec {course.section}
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 uppercase tracking-widest border border-gray-200">
                  Batch {course.batch}
                </span>
              </div>
            </div>
            
            <div className="px-8 py-6 border-t border-gray-100/50 bg-gradient-to-br from-gray-50/50 to-white/50 flex flex-col gap-3">
              <a 
                href={`/dashboard/marks/${course.id}`} 
                className="w-full flex justify-center items-center gap-2 px-5 py-3 border border-gray-200 shadow-sm text-sm font-semibold rounded-xl text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                View Points Table
              </a>
              <a 
                href={`/dashboard/marks/${course.id}/upload`} 
                className="w-full flex justify-center items-center gap-2 px-5 py-3 border border-transparent shadow-[0_4px_14px_0_rgba(107,33,168,0.39)] text-sm font-semibold rounded-xl text-white bg-primary hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-95"
              >
                <svg className="w-4 h-4 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Spreadsheets
              </a>
            </div>
          </div>
        ))}

        {courses.length === 0 && (
          <div className="col-span-full bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-16 text-center animate-scale-up group overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-purple-500/5 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
            <div className="relative z-10">
              <div className="w-24 h-24 bg-gradient-to-tr from-gray-100 to-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/50 group-hover:shadow-gray-200/50 transition-all duration-500">
                <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
              </div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">No Courses Initialized</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">
                No active academic courses have been provisioned for your cohort. Office Staff must securely originate the course definitions before marks can be mapped.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
