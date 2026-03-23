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

function gradeColor(grade: string) {
  if (!grade) return { ring: "border-slate-500/30", badge: "bg-slate-500/15 text-slate-300", bar: "from-slate-500 to-slate-400" };
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return { ring: "border-emerald-500/40", badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", bar: "from-emerald-500 to-teal-400" };
  if (g.startsWith("B")) return { ring: "border-sky-500/40", badge: "bg-sky-500/15 text-sky-300 border border-sky-500/30", bar: "from-sky-500 to-blue-400" };
  if (g.startsWith("C")) return { ring: "border-amber-500/40", badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30", bar: "from-amber-500 to-orange-400" };
  return { ring: "border-red-500/40", badge: "bg-red-500/15 text-red-400 border border-red-500/30", bar: "from-red-500 to-rose-400" };
}

export default function ScorecardPage() {
  const [scorecards, setScorecards] = useState<ScorecardDetails[]>([]);
  const [studentDetails, setStudentDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchScorecards(); }, []);

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
    } catch {
      toast.error("Network error while loading scorecards");
    } finally {
      setLoading(false);
    }
  };

  const { termGPA, totalCredits } = useMemo(() => {
    let gpSum = 0, credSum = 0;
    scorecards.forEach(card => {
      if (card.grade && card.grade !== "N/A") {
        const gp = gradeToGP[card.grade] ?? 0;
        const c = card.credits ?? 1.0;
        gpSum += gp * c;
        credSum += c;
      }
    });
    return { termGPA: credSum > 0 ? (gpSum / credSum).toFixed(2) : "N/A", totalCredits: credSum };
  }, [scorecards]);

  if (loading) return <LoadingPopup message="Crunching numbers for your personal scorecard..." />;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      
      {/* Header + Profile Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Academic Records</span>
          <h1 className="mt-1 text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Scorecard</span>
          </h1>
          <p className="mt-2 text-slate-400 text-sm">Finalized grades, cohort ranks, and component breakdowns.</p>
        </div>

        {studentDetails && (
          <div className="bg-white/[0.04] border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 flex items-center gap-5 min-w-[320px]">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 bg-violet-500/40 blur-xl rounded-full scale-110" />
              <div className="relative w-14 h-14 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)]">
                <span className="text-white font-bold text-xl">{studentDetails.name?.charAt(0)}</span>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white text-base leading-tight truncate">{studentDetails.name}</h3>
              <p className="text-sm font-mono text-violet-400 mt-0.5">{studentDetails.student_id}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className="text-[10px] uppercase tracking-widest font-bold bg-white/[0.06] text-slate-400 px-2 py-1 rounded-lg">{studentDetails.batch}</span>
                <span className="text-[10px] uppercase tracking-widest font-bold bg-violet-500/10 text-violet-400 px-2 py-1 rounded-lg">Sec {studentDetails.section}</span>
              </div>
            </div>
            {/* GPA pill */}
            <div className="flex flex-col items-center justify-center border-l border-white/[0.08] pl-5 flex-shrink-0">
              <span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">Term GPA</span>
              <span className="text-3xl font-black text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.4)]">{termGPA}</span>
              <span className="text-[10px] text-slate-600 mt-1">{totalCredits} credits</span>
            </div>
          </div>
        )}
      </div>

      {/* Course Cards */}
      {scorecards.map((card, idx) => {
        const colors = gradeColor(card.grade);
        return (
          <div key={card.courseName} className={`relative overflow-hidden rounded-2xl bg-white/[0.04] border border-white/[0.07] hover:border-white/[0.12] transition-all duration-300 animate-fade-in-up`}
            style={{ animationDelay: `${idx * 80}ms` }}>
            {/* colored left border accent */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.bar} rounded-l-2xl`} />

            {/* Course header */}
            <div className="pl-6 pr-6 pt-5 pb-4 border-b border-white/[0.06] flex justify-between items-center">
              <h3 className="text-xl font-bold text-white" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{card.courseName}</h3>
              <span className={`text-sm font-bold px-3 py-1 rounded-xl ${colors.badge}`}>{card.grade || "Pending"}</span>
            </div>

            <div className="pl-6 pr-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Left: Rank + Score + Stats */}
              <div className="lg:col-span-4 space-y-6">
                {/* Ranks */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Cohort Rank</p>
                    <p className="text-3xl font-black text-white">{card.rank ? `#${card.rank}` : "—"}</p>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-4">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Section Rank</p>
                    <p className="text-3xl font-black text-violet-300">{card.section_rank ? `#${card.section_rank}` : "—"}</p>
                  </div>
                </div>

                {/* Total */}
                <div>
                  <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Total Score</p>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">{card.total.toFixed(1)}</span>
                    <span className="text-slate-500 font-semibold text-lg">/100</span>
                  </div>
                </div>

                {/* Cohort Stats */}
                {card.stats && card.stats.avg !== null && (
                  <div>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-3">Cohort Statistics</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[["Avg", card.stats.avg, "text-slate-300"], ["Med", card.stats.median, "text-slate-300"], ["Best", card.stats.max, "text-emerald-400"]].map(([label, val, cls]) => (
                        <div key={label as string} className="bg-white/[0.03] border border-white/[0.05] rounded-xl p-3 text-center">
                          <p className="text-[9px] uppercase tracking-widest text-slate-600 font-bold mb-1">{label}</p>
                          <p className={`text-sm font-black ${cls}`}>{val ?? "—"}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: Component bars */}
              <div className="lg:col-span-8">
                <p className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-5">Component Breakdown</p>
                <div className="space-y-5">
                  {card.components.map((comp, i) => (
                    <div key={comp.name} className="group">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-white text-sm">{comp.name}</span>
                          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-md">{comp.weight}%</span>
                        </div>
                        <div className="flex items-baseline gap-1">
                          <span className="font-bold text-white">{comp.score}</span>
                          <span className="text-slate-500 text-sm">/ {comp.max}</span>
                        </div>
                      </div>
                      <div className="w-full bg-white/[0.05] rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`bg-gradient-to-r ${colors.bar} h-full rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${comp.max > 0 ? (comp.score / comp.max) * 100 : 0}%`, animationDelay: `${i * 100}ms` }}
                        />
                      </div>
                    </div>
                  ))}
                  {card.components.length === 0 && (
                    <p className="text-slate-500 italic text-sm">No visible marks released for this course yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Empty state */}
      {scorecards.length === 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-16 text-center animate-scale-up">
          <div className="w-20 h-20 rounded-2xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center mx-auto mb-5">
            <svg className="w-10 h-10 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Published Scores</h3>
          <p className="text-slate-500 max-w-sm mx-auto text-sm">Your scorecard is empty for now. Grades will appear once the instructor finalizes and releases your results.</p>
        </div>
      )}
    </div>
  );
}
