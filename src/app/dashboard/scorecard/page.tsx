"use client";

import { useState, useEffect, useMemo } from "react";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";
import { ScrollText, CheckCircle2, ShieldCheck, Clock } from "lucide-react";

type ScorecardDetails = {
  courseName: string;
  rank: number | null;
  section_rank: number | null;
  rank_change: number;
  grade: string;
  total: number;
  components: { name: string; score: number; max: number; weight: number }[];
  stats?: { avg: number | null, max: number | null, median: number | null, min: number | null };
  credits?: number;
};

type TermStatus = {
  term: number;
  is_locked: boolean;
  is_published: boolean;
};

const gradeToGP: Record<string, number> = {
  "A+": 10, "A": 9, "A-": 8, "B+": 7, "B": 6, "B-": 5, "C+": 4, "C": 3, "C-": 2, "D": 1, "F": 0
};

function gradeColor(grade: string) {
  if (!grade || grade === "N/A" || grade === "?") return { ring: "border-slate-500/30", badge: "bg-slate-500/15 text-slate-400 border border-slate-500/20", bar: "from-slate-500 to-slate-400" };
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return { ring: "border-emerald-500/40", badge: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30", bar: "from-emerald-500 to-teal-400" };
  if (g.startsWith("B")) return { ring: "border-blue-500/40", badge: "bg-blue-500/15 text-blue-300 border border-blue-500/30", bar: "from-blue-600 to-indigo-500" };
  if (g.startsWith("C")) return { ring: "border-amber-500/40", badge: "bg-amber-500/15 text-amber-300 border border-amber-500/30", bar: "from-amber-600 to-orange-500" };
  return { ring: "border-red-500/40", badge: "bg-red-500/15 text-red-400 border border-red-500/30", bar: "from-red-600 to-rose-500" };
}

export default function ScorecardPage() {
  const [scorecards, setScorecards] = useState<(ScorecardDetails & { term: number })[]>([]);
  const [termStatuses, setTermStatuses] = useState<TermStatus[]>([]);
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
      }

      const tRes = await fetch("/api/admin/terms");
      if (tRes.ok) {
        const tData = await tRes.json();
        setTermStatuses(tData.terms);
      }
    } catch {
      toast.error("Network error while loading transcripts");
    } finally {
      setLoading(false);
    }
  };

  const { terms, cgpa, totalCredits } = useMemo(() => {
    const termGroups: Record<number, { cards: ScorecardDetails[], gpa: string, credits: number }> = {};
    let totalGpSum = 0;
    let totalCredSum = 0;

    scorecards.forEach(card => {
      const term = card.term || 1;
      if (!termGroups[term]) termGroups[term] = { cards: [], gpa: "0.00", credits: 0 };
      termGroups[term].cards.push(card);
      
      if (card.grade && card.grade !== "N/A") {
        const gp = gradeToGP[card.grade] ?? 0;
        const c = card.credits ?? 1.0;
        termGroups[term].credits += c;
        termGroups[term].gpa = (parseFloat(termGroups[term].gpa) + gp * c).toString();
        
        totalGpSum += gp * c;
        totalCredSum += c;
      }
    });

    Object.keys(termGroups).forEach(t => {
      const term = parseInt(t);
      const sum = parseFloat(termGroups[term].gpa);
      const creds = termGroups[term].credits;
      termGroups[term].gpa = creds > 0 ? (sum / creds).toFixed(2) : "0.00";
    });

    return { 
      terms: termGroups, 
      cgpa: totalCredSum > 0 ? (totalGpSum / totalCredSum).toFixed(2) : "N/A", 
      totalCredits: totalCredSum 
    };
  }, [scorecards]);

  if (loading) return <LoadingPopup message="Crunching numbers for your personal scorecard..." />;

  const sortedTermIds = Object.keys(terms).map(Number).sort((a, b) => a - b);
  const getTermStatus = (t: number) => termStatuses.find(ts => ts.term === t);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-12 animate-fade-in-up font-[Orbitron]">
      
      {/* Header + Profile Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-8">
        <div className="flex flex-col">
          <span className="text-[8px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] md:tracking-[0.3em] uppercase">Academic Record</span>
          <h1 className="mt-2 text-3xl md:text-5xl font-black tracking-tighter uppercase flex items-start md:items-center gap-3 md:gap-4">
            <span className="w-1.5 md:w-2.5 h-10 md:h-14 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] mt-1 md:mt-0" />
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
              <span className="text-slate-900 dark:text-white">Performance</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Scorecard</span>
            </div>
          </h1>
          <p className="mt-4 text-[9px] md:text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-4 md:pl-5">View your clinical grades, rankings, and cumulative performance metrics.</p>
        </div>

        {studentDetails && (
          <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-3xl rounded-3xl md:rounded-[2.5rem] p-5 md:p-8 flex flex-col sm:flex-row items-center gap-6 md:gap-8 min-w-0 lg:min-w-[380px] shadow-sm dark:shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="flex items-center gap-5 md:gap-8 w-full sm:w-auto">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/40 blur-2xl rounded-full scale-110 animate-pulse" />
                <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg border border-white/20">
                  <span className="text-white font-black text-xl md:text-2xl">{studentDetails.name?.charAt(0)}</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg uppercase tracking-wider truncate">{studentDetails.name}</h3>
                <p className="text-[11px] md:text-sm font-mono font-black text-blue-600 dark:text-blue-400 mt-1">{studentDetails.student_id}</p>
                <div className="flex items-center gap-2 mt-3 md:mt-4 flex-wrap">
                  <span className="text-[8px] md:text-[10px] uppercase tracking-widest font-black bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-slate-200 dark:border-white/[0.05]">{studentDetails.batch}</span>
                  <span className="text-[8px] md:text-[10px] uppercase tracking-widest font-black bg-blue-500/15 text-blue-600 dark:text-blue-300 px-2.5 py-1 md:px-3 md:py-1.5 rounded-lg md:rounded-xl border border-blue-500/20">Sec {studentDetails.section}</span>
                </div>
              </div>
            </div>
            <div className="flex flex-row sm:flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/[0.1] pt-5 sm:pt-0 sm:pl-8 w-full sm:w-auto flex-shrink-0 gap-4 sm:gap-0">
              <div className="flex flex-col items-center">
                <span className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 mb-1 md:mb-2">Cumulative GPA</span>
                <span className="text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">{cgpa}</span>
              </div>
              <span className="text-[8px] md:text-[9px] text-slate-500 dark:text-slate-600 font-bold mt-1 md:mt-2 tracking-[.15em] md:tracking-[.2em] uppercase">{totalCredits} Total Credits</span>
            </div>
          </div>
        )}
      </div>

      {/* Term Grouping */}
      <div className="space-y-10 md:space-y-16">
        {sortedTermIds.map((termId) => {
          const termData = terms[termId];
          const status = getTermStatus(termId);
          return (
            <section key={termId} className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between border-b border-slate-200 dark:border-white/[0.06] pb-4 px-2 gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border flex items-center justify-center font-black text-sm md:text-base transition-all ${status?.is_locked ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm dark:shadow-[0_0_20px_rgba(16,185,129,0.1)]" : "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400 shadow-sm dark:shadow-[0_0_20px_rgba(37,99,235,0.1)]"}`}>
                    {termId}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 md:gap-4">
                        <h2 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Term {termId}</h2>
                        {status?.is_locked ? (
                             <span className="flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[.15em] md:tracking-[.2em]">
                                <ShieldCheck className="w-2.5 h-2.5 md:w-3 md:h-3" /> Published
                            </span>
                        ) : (
                             <span className="flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-[.15em] md:tracking-[.2em]">
                                <Clock className="w-2.5 h-2.5 md:w-3 md:h-3" /> In Progress
                            </span>
                        )}
                    </div>
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-[.15em] md:tracking-[.2em] uppercase mt-1 md:mt-2">{termData.cards.length} Courses · {termData.credits} Credits</p>
                  </div>
                </div>
                <div className="sm:text-right flex items-baseline sm:flex-col gap-3 sm:gap-1">
                    <p className="text-[8px] md:text-[9px] uppercase tracking-[.2em] md:tracking-[.3em] font-black text-slate-400 dark:text-slate-600">Term GPA</p>
                    <p className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{termData.gpa}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:gap-8">
                {termData.cards.map((card, idx) => {
                  const colors = gradeColor(card.grade);
                  return (
                    <div key={card.courseName} className={`relative overflow-hidden rounded-3xl md:rounded-[2rem] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.06] hover:bg-slate-50 dark:hover:bg-white/[0.05] hover:border-blue-500/20 dark:hover:border-white/[0.12] transition-all duration-300 group shadow-sm dark:shadow-xl`}
                      style={{ animationDelay: `${idx * 80}ms` }}>
                      {/* colored left border accent */}
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b ${colors.bar} rounded-l-2xl opacity-70 group-hover:opacity-100 transition-opacity`} />

                      {/* Course header */}
                      <div className="pl-6 md:pl-10 pr-6 md:pr-10 pt-6 md:pt-8 pb-5 md:pb-6 border-b border-slate-100 dark:border-white/[0.04] flex flex-col md:flex-row md:justify-between md:items-center bg-slate-50/30 dark:bg-white/[0.01] gap-4">
                        <div className="flex items-center gap-4 md:gap-6">
                            <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">{card.courseName}</h3>
                            <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-lg md:rounded-xl border border-slate-200 dark:border-white/[0.05] uppercase tracking-widest whitespace-nowrap">{card.credits} Credits</span>
                        </div>
                        <span className={`text-[13px] md:text-base font-black px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-md md:shadow-lg border uppercase tracking-wider text-center ${colors.badge}`}>
                            {card.grade === "N/A" ? "Calculating" : (card.grade || "Waiting")}
                        </span>
                      </div>

                      <div className="px-6 md:px-8 py-6 md:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                        {/* Left: Rank + Score + Stats */}
                        <div className="lg:col-span-4 space-y-6 md:space-y-8">
                          {/* Ranks */}
                           <div className="grid grid-cols-2 gap-3 md:gap-4">
                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-2xl md:rounded-3xl p-4 md:p-6 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors relative group/stat">
                              <p className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 dark:text-slate-600 mb-2 md:mb-3">Section Rank</p>
                              <p className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">{card.section_rank ? `#${card.section_rank}` : "—"}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-2xl md:rounded-3xl p-4 md:p-6 hover:bg-slate-100 dark:hover:bg-white/[0.04] transition-colors relative group/stat">
                              <p className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 dark:text-slate-600 mb-2 md:mb-3">Course Rank</p>
                              <p className="text-3xl md:text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">{card.rank ? `#${card.rank}` : "—"}</p>
                            </div>
                          </div>

                          {/* Total */}
                          <div className="px-1">
                            <p className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 dark:text-slate-600 mb-1 md:mb-2">Final Score</p>
                            <div className="flex items-baseline gap-2">
                              <span className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white">{card.total.toFixed(2)}</span>
                              <span className="text-slate-400 dark:text-slate-600 font-black text-lg md:text-xl tracking-tighter">/ 100.00</span>
                            </div>
                          </div>

                          {/* Cohort Stats */}
                          {card.stats && card.stats.avg !== null && (
                            <div className="pt-2">
                              <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-600 mb-3 md:mb-4 px-1">Cohort Distribution</p>
                              <div className="grid grid-cols-3 gap-2 md:gap-3">
                                {[["Avg", card.stats.avg, "text-slate-600 dark:text-slate-400"], ["Med", card.stats.median, "text-slate-600 dark:text-slate-400"], ["Min", card.stats.min, "text-slate-600 dark:text-slate-400"], ["Best", card.stats.max, "text-emerald-600 dark:text-emerald-400"]].map(([label, val, cls]) => (
                                  <div key={label as string} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-xl md:rounded-2xl p-2.5 md:p-3.5 text-center shadow-inner">
                                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-600 font-black mb-1 md:mb-1.5">{label}</p>
                                    <p className={`text-[11px] md:text-sm font-black ${cls}`}>{val ?? "—"}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Right: Component bars */}
                        <div className="lg:col-span-8 flex flex-col justify-center">
                          <p className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 dark:text-slate-600 mb-6 md:mb-8 px-1">Score Breakdown</p>
                          <div className="space-y-6 md:space-y-8">
                            {card.components.map((comp, i) => (
                              <div key={comp.name} className="group/item">
                                <div className="flex justify-between items-center mb-2 md:mb-3 px-1">
                                  <div className="flex items-center gap-3 md:gap-4">
                                    <div className="w-2 md:w-2.5 h-2 md:h-2.5 rounded-full bg-blue-500/50 shadow-[0_0_8px_rgba(59,130,246,0.3)]" />
                                    <span className="font-black text-slate-900 dark:text-white text-[11px] md:text-sm uppercase tracking-wide">{comp.name}</span>
                                    {comp.weight > 0 && (
                                      <span className="hidden sm:inline-block text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg md:rounded-xl border border-blue-500/20 uppercase tracking-widest">{comp.weight}% Weight</span>
                                    )}
                                  </div>
                                  <div className="flex items-baseline gap-1.5 md:gap-2">
                                    <span className="font-black text-slate-900 dark:text-white text-base md:text-xl font-mono">{comp.score}</span>
                                    <span className="text-slate-400 dark:text-slate-600 font-bold text-[9px] md:text-[10px] uppercase tracking-tighter">/ {comp.max}</span>
                                  </div>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-white/[0.03] rounded-full h-2.5 md:h-3 overflow-hidden border border-slate-200 dark:border-white/[0.05] p-[2px] md:p-[3px]">
                                  <div
                                    className={`bg-gradient-to-r ${colors.bar} h-full rounded-full transition-all duration-1000 ease-out shadow-sm dark:shadow-[0_0_12px_rgba(0,0,0,0.5)]`}
                                    style={{ width: `${comp.max > 0 ? (comp.score / comp.max) * 100 : 0}%`, animationDelay: `${i * 150}ms` }}
                                  />
                                </div>
                              </div>
                            ))}
                            {card.components.length === 0 && (
                              <div className="flex flex-col items-center justify-center py-10 md:py-12 bg-slate-50 dark:bg-white/[0.01] rounded-[1.5rem] md:rounded-[2rem] border border-dashed border-slate-300 dark:border-white/[0.08]">
                                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-[10px] md:text-xs italic">Awaiting Component Release</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {scorecards.length === 0 && (
        <div className="rounded-[4rem] bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] p-32 text-center animate-scale-up shadow-sm dark:shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-600/5 to-transparent opacity-50" />
          <div className="relative z-10">
            <div className="w-24 h-24 rounded-[2.5rem] bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center mx-auto mb-10 shadow-lg dark:shadow-2xl group-hover:scale-110 transition-transform">
              <ScrollText className="w-12 h-12 text-slate-400 dark:text-slate-600" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">No Published Results</h3>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-sm mx-auto mt-6 italic leading-loose">
              Your grades have not been released by the Office Administrator yet. Please check back later.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
