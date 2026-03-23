"use client";

import { useState, useEffect, useMemo } from "react";
import LoadingPopup from "@/components/LoadingPopup";

import toast from "react-hot-toast";

type ScorecardDetails = {
  courseName: string;
  rank: number | null;
  section_rank: number | null;
  rank_change: number;
  grade: string;
  total: number;
  components: { name: string; score: number; max: number; weight: number }[];
  stats?: { avg: number | null, max: number | null, median: number | null };
  credits?: number;
};

const gradeToGP: Record<string, number> = {
    "A+": 10, "A": 9, "A-": 8, "B+": 7, "B": 6, "B-": 5, "C+": 4, "C": 3, "C-": 2, "D": 1, "F": 0
};

export default function ScorecardPage() {
  const [scorecards, setScorecards] = useState<ScorecardDetails[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScorecards();
  }, []);

  const fetchScorecards = async () => {
    try {
      const res = await fetch("/api/marks/me");
      const data = await res.json();
      
      if (res.ok) {
        if (data.scorecards) setScorecards(data.scorecards);
        if (data.student) setStudentDetails(data.student);
      } else {
        toast.error(data.error || "Failed to parse scorecard data");
      }
    } catch (err) {
      toast.error("Network error while loading scorecards");
    } finally {
      setLoading(false);
    }
  };

  const { termGPA, totalCredits } = useMemo(() => {
     let gpSum = 0;
     let credSum = 0;
     scorecards.forEach(card => {
         if (card.grade && card.grade !== "N/A") {
             const gp = gradeToGP[card.grade] ?? 0;
             const c = card.credits ?? 1.0;
             gpSum += (gp * c);
             credSum += c;
         }
     });
     return { 
         termGPA: credSum > 0 ? (gpSum / credSum).toFixed(2) : "N/A",
         totalCredits: credSum
     };
  }, [scorecards]);

  const downloadMarksheet = () => {
    toast.success("Marksheet PDF downloading...");
    // Mock PDF logic via React-PDF/html2canvas would go here.
  };

  if (loading) return <LoadingPopup message="Crunching numbers for your personal automated scorecard..." />;

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-800 tracking-tight">Your Academic Scorecard</h1>
          <p className="mt-2 text-base text-gray-500 font-medium">Detailed tracking of your ranks, performance breakdowns, and finalized component grades.</p>
        </div>
        
        {/* Student Profile Card */}
        {studentDetails && (
          <div className="bg-white/80 backdrop-blur-xl border border-white shadow-xl shadow-primary/5 rounded-2xl p-5 min-w-[320px] flex justify-between items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-inner flex-shrink-0">
                <span className="text-white font-bold tracking-widest text-lg">{studentDetails.name?.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{studentDetails.name}</h3>
                <p className="text-sm font-medium text-primary mt-0.5">{studentDetails.student_id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-gray-100 text-gray-600 px-2.5 py-1 rounded-md">Batch: {studentDetails.batch}</span>
                  <span className="text-[10px] uppercase tracking-widest font-bold bg-purple-100 text-purple-700 px-2.5 py-1 rounded-md">Sec: {studentDetails.section}</span>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col items-center justify-center pl-6 border-l border-gray-200">
               <span className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-1">Term GPA</span>
               <span className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-br from-primary to-purple-800">{termGPA}</span>
            </div>
          </div>
        )}
      </div>

      {scorecards.map((card, idx) => (
        <div key={card.courseName} className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(124,58,237,0.1)] transition-all duration-500 rounded-3xl border border-white/80 overflow-hidden group">
          <div className="px-8 py-6 border-b border-gray-100/50 bg-gradient-to-r from-white/40 to-white/10 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
              <span className="w-2 h-8 bg-gradient-to-b from-primary to-purple-500 rounded-full inline-block"></span>
              {card.courseName}
            </h3>
            <button onClick={downloadMarksheet} className="text-sm font-semibold text-primary px-4 py-2 rounded-full bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export PDF
            </button>
          </div>
          
          <div className="p-8 grid grid-cols-1 md:grid-cols-12 gap-10">
            <div className="md:col-span-12 lg:col-span-4 border-r border-gray-100/60 pr-8 space-y-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Cohort Rank</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-600">
                      {card.rank ? `#${card.rank}` : "-"}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-2">Section Rank</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-black text-gray-900 bg-clip-text text-transparent bg-gradient-to-br from-purple-800 to-primary">
                      {card.section_rank ? `#${card.section_rank}` : "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-2">Total Score</p>
                <div className="flex items-baseline">
                  <span className="text-4xl font-extrabold text-primary drop-shadow-sm">{card.total.toFixed(1)}</span>
                  <span className="text-lg font-semibold text-gray-300 ml-1">/100</span>
                </div>
              </div>

              <div>
                <p className="text-xs font-bold tracking-widest text-gray-400 uppercase mb-3">Final Grade</p>
                <span className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl text-3xl font-black shadow-inner
                  ${card.grade.includes('A') ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-500/30' : 
                    card.grade.includes('B') ? 'bg-gradient-to-br from-blue-400 to-blue-600 text-white shadow-blue-500/30' : 
                    'bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-amber-500/30'}
                `}>
                  {card.grade}
                </span>
              </div>

              {card.stats && card.stats.avg !== null && (
                <div className="pt-4 border-t border-gray-100/80">
                  <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-3">Cohort Statistics</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50/80 rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Avg</p>
                      <p className="text-sm font-black text-gray-800">{card.stats.avg}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Med</p>
                      <p className="text-sm font-black text-gray-800">{card.stats.median}</p>
                    </div>
                    <div className="bg-gray-50/80 rounded-lg p-2 text-center">
                      <p className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1">Max</p>
                      <p className="text-sm font-black text-emerald-600">{card.stats.max}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-center">
              <h4 className="text-sm font-bold tracking-widest text-gray-400 uppercase mb-6">Component Breakdown</h4>
              <div className="space-y-6">
                {card.components.map((comp, i) => (
                  <div key={comp.name} className="flex flex-col gap-2 group/bar">
                    <div className="flex justify-between items-end">
                      <span className="font-semibold text-gray-800 text-base">{comp.name} <span className="text-xs font-bold text-primary ml-2 bg-primary/5 px-2 py-0.5 rounded-md">{comp.weight}% WT</span></span>
                      <div className="flex items-baseline gap-1">
                        <span className="font-bold text-gray-900 text-lg">{comp.score}</span>
                        <span className="text-sm font-semibold text-gray-400">/ {comp.max}</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100/80 rounded-full h-3 overflow-hidden shadow-inner">
                      <div 
                        className="bg-gradient-to-r from-primary to-purple-400 h-full rounded-full transition-all duration-1000 ease-out relative group-hover/bar:brightness-110" 
                        style={{ width: `${(comp.score / comp.max) * 100}%`, animationDelay: `${i * 150}ms` }}
                      >
                         <div className="absolute inset-0 bg-white/20 w-full h-full animate-[shimmer_2s_infinite]"></div>
                      </div>
                    </div>
                  </div>
                ))}
                {card.components.length === 0 && (
                   <p className="text-gray-400 italic text-sm">No visible marks have been released for this course yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {scorecards.length === 0 && (
        <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-16 text-center animate-scale-up group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-purple-500/5 opacity-50 group-hover:scale-110 transition-transform duration-1000"></div>
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-tr from-primary/10 to-purple-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-white/50 group-hover:shadow-primary/20 transition-all duration-500">
              <svg className="w-12 h-12 text-primary/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-900 tracking-tight mb-2">No Published Scores</h3>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">
              You currently have no active course scorecards. Marks and grades will populate here immediately once the faculty finalizes and releases them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
