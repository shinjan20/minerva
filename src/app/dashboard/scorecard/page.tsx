"use client";

import { useState, useEffect, useMemo } from "react";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";
import { ScrollText, CheckCircle2, ShieldCheck, Clock, TrendingUp, Calculator, MousePointer2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

type ScorecardDetails = {
  courseId: string;
  courseName: string;
  rank: number | null;
  section_rank: number | null;
  rank_change: number;
  grade: string;
  is_locked?: boolean;
  total: number;
  components: { name: string; score: number; max: number; weight: number, cohortAvg?: number | null }[];
  distribution?: { bin: number; label: string; count: number; avg: number; density: number }[];
  cohortSize?: number;
  hasPending?: boolean;
  stats?: { avg: number | null, max: number | null, median: number | null, min: number | null, cutoffs?: any };
  credits?: number;
};

type TermStatus = {
  term: number;
  is_locked: boolean;
  is_published: boolean;
  weight: number;
};

function formatNumber(val: any) {
  if (val === null || val === undefined || isNaN(val)) return "—";
  const num = Number(val);
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
}

const gradeToGP: Record<string, number> = {
  "A+": 10, "A": 9, "A-": 8, "B+": 7, "B": 6, "B-": 5, "C+": 4, "C": 3, "C-": 2, "D": 1, "F": 0
};

function gradeColor(grade: string) {
  if (!grade || grade === "N/A" || grade === "?" || grade === "Calculating" || grade === "Waiting") return { ring: "border-slate-500/30", badge: "bg-slate-500/15 text-slate-400 border border-slate-500/20", bar: "from-slate-500 to-slate-400" };
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
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulatorMode, setSimulatorMode] = useState<Record<string, boolean>>({});
  const [simValues, setSimValues] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => { fetchScorecards(); }, []);

  const fetchScorecards = async () => {
    try {
      const res = await fetch(`/api/marks/me?t=${Date.now()}`);
      const data = await res.json();
      if (res.ok) {
        if (data.scorecards) setScorecards(data.scorecards);
        if (data.student) setStudentDetails(data.student);
        if (data.trends) setTrends(data.trends);
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
    const termGroups: Record<number, { cards: ScorecardDetails[], gpa: string, gradedCredits: number, totalCredits: number, termPoints: number }> = {};
    
    // Step 1: Group by term and calculate total possible credits per term
    scorecards.forEach(card => {
      const termId = card.term || 1;
      if (!termGroups[termId]) {
        termGroups[termId] = { cards: [], gpa: "0.00", gradedCredits: 0, totalCredits: 0, termPoints: 0 };
      }
      termGroups[termId].cards.push(card);
      termGroups[termId].totalCredits += (card.credits || 1.0);
      
      if (card.grade && card.grade !== "N/A" && card.grade !== "Waiting") {
        const gp = gradeToGP[card.grade] ?? 0;
        const c = card.credits ?? 1.0;
        termGroups[termId].gradedCredits += c;
        termGroups[termId].termPoints += (gp * c);
      }
    });

    // Step 2: Calculate Term GPA and Overall CGPA using Term-Level Weighting
    let totalWeightedTermGPA = 0;
    let totalTermWeights = 0;

    Object.keys(termGroups).forEach(t => {
      const termId = parseInt(t);
      const group = termGroups[termId];
      
      // Get the institutional weight (Max Credits) for this term
      const termMeta = termStatuses.find(ts => ts.term === termId);
      const termWeight = termMeta?.weight || group.totalCredits; // Fallback to course sum if no metadata
      
      // Update the group's total credit view to reflect the institutional cap
      group.totalCredits = termWeight;

      // Term GPA calculation (based on graded courses only)
      if (group.gradedCredits > 0) {
        const tGpa = group.termPoints / group.gradedCredits;
        group.gpa = tGpa.toFixed(2);
        
        // CGPA Logic: weighted average of Term GPAs using the Global Term Weights
        totalWeightedTermGPA += (tGpa * termWeight);
        totalTermWeights += termWeight;
      } else {
        group.gpa = "0.00";
      }
    });

    const finalCGPA = totalTermWeights > 0 ? (totalWeightedTermGPA / totalTermWeights).toFixed(2) : "N/A";

    return { 
      terms: termGroups, 
      cgpa: finalCGPA,
      totalCredits: totalTermWeights 
    };
  }, [scorecards]);

  if (loading) return <LoadingPopup message="Crunching numbers for your personal scorecard..." />;

  const sortedTermIds = Object.keys(terms).map(Number).sort((a, b) => a - b);
  const getTermStatus = (t: number) => termStatuses.find(ts => ts.term === t);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8 md:space-y-12 animate-fade-in-up font-[Orbitron]">
      
      {/* Header + Profile Card */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 md:gap-10">
        <div className="flex flex-col flex-1 min-w-0">
          <span className="text-[8px] md:text-[9px] font-black text-blue-600 dark:text-blue-400 tracking-[0.2em] md:tracking-[0.3em] uppercase">Academic Record</span>
          <h1 className="mt-2 text-2xl md:text-3xl lg:text-4xl font-black tracking-tighter uppercase flex flex-wrap items-center gap-2 md:gap-3">
            <span className="w-1.5 md:w-2 h-8 md:h-10 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <span className="text-slate-900 dark:text-white">Performance</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Scorecard</span>
            </div>
          </h1>
          <p className="mt-3 text-[8px] md:text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-4 md:pl-5 max-w-xl">View your clinical grades, rankings, and cumulative performance metrics.</p>
        </div>

        {studentDetails && (
          <div className="bg-white dark:bg-white/[0.04] border border-slate-200 dark:border-white/[0.08] backdrop-blur-3xl rounded-3xl md:rounded-[2.5rem] p-5 md:p-7 flex flex-col sm:flex-row items-center gap-6 md:gap-10 w-full lg:w-auto lg:max-w-[550px] shadow-sm dark:shadow-2xl relative group flex-shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[2.5rem]" />
            
            {/* Left: Avatar + Name/Details */}
            <div className="flex items-center gap-5 md:gap-6 flex-1 min-w-0 relative z-10">
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-blue-500/30 blur-2xl rounded-full scale-110" />
                <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg border border-white/20">
                  <span className="text-white font-black text-xl md:text-2xl">{studentDetails.name?.charAt(0)}</span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-black text-slate-900 dark:text-white text-base md:text-lg uppercase tracking-wider truncate">{studentDetails.name}</h3>
                <p className="text-[11px] md:text-sm font-mono font-black text-blue-600 dark:text-blue-400 mt-1">{studentDetails.student_id}</p>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black bg-slate-100 dark:bg-white/[0.06] text-slate-500 dark:text-slate-400 px-2 py-1 rounded-lg border border-slate-200 dark:border-white/[0.05]">{studentDetails.batch}</span>
                  <span className="text-[8px] md:text-[9px] uppercase tracking-widest font-black bg-blue-500/15 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-lg border border-blue-500/20">Sec {studentDetails.section}</span>
                </div>
              </div>
            </div>

            {/* Right: Cumulative GPA */}
            <div className="flex flex-row sm:flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-slate-200 dark:border-white/[0.1] pt-5 sm:pt-0 sm:pl-8 flex-shrink-0 relative z-10">
              <div className="flex flex-col items-center sm:items-end">
                <span className="text-[8px] md:text-[10px] uppercase tracking-widest font-black text-slate-500 dark:text-slate-400 mb-1">Cumulative GPA</span>
                <span className="text-4xl md:text-5xl font-black text-emerald-500 dark:text-emerald-400 drop-shadow-[0_0_20px_rgba(16,185,129,0.4)]">{cgpa}</span>
                <span className="text-[8px] md:text-[9px] text-slate-500 dark:text-slate-400 font-bold mt-1 tracking-widest uppercase">{totalCredits} Total Credits</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feature 1: Trend Analysis Visualization */}
      {trends.length > 1 && (
        <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] p-6 md:p-10 shadow-sm dark:shadow-2xl">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wider">Performance Trajectory</h3>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-70">Historical Rank & Score Movement Across Snapshots</p>
            </div>
          </div>
          <div className="h-[300px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorGpa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => new Date(val).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                   yAxisId="left"
                   tick={{ fontSize: 10, fontWeight: 900, fill: '#3b82f6' }}
                   axisLine={false}
                   tickLine={false}
                   domain={[0, 100]}
                />
                <YAxis 
                   yAxisId="right"
                   orientation="right"
                   reversed
                   tick={{ fontSize: 10, fontWeight: 900, fill: '#f59e0b' }}
                   axisLine={false}
                   tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '1rem', fontSize: '12px' }}
                  itemStyle={{ fontWeight: 900 }}
                  labelStyle={{ marginBottom: '4px', opacity: 0.6 }}
                />
                <Area yAxisId="left" type="monotone" dataKey="gpa" stroke="#3b82f6" fillOpacity={1} fill="url(#colorGpa)" strokeWidth={3} name="Score" />
                <Line yAxisId="right" type="monotone" dataKey="rank" stroke="#f59e0b" strokeWidth={3} name="Rank" dot={{ r: 4, fill: '#f59e0b' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

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
                    <p className="text-[9px] md:text-[10px] text-slate-500 font-bold tracking-[.15em] md:tracking-[.2em] uppercase mt-1 md:mt-2">
                        {termData.cards.length} Courses · {termData.gradedCredits === termData.totalCredits ? `${termData.totalCredits} Credits` : `${termData.gradedCredits} / ${termData.totalCredits} Credits Graded`}
                    </p>
                  </div>
                </div>
                <div className="sm:text-right flex items-baseline sm:flex-col gap-3 sm:gap-1">
                    <p className="text-[8px] md:text-[9px] uppercase tracking-[.2em] md:tracking-[0.3em] font-black text-slate-400 dark:text-slate-600">
                        {status?.is_locked ? "Term GPA" : "Potential Term GPA"}
                    </p>
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
                        <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                            <div className="flex items-center gap-4 md:gap-6">
                                <h3 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                                    <span className="text-blue-600 dark:text-blue-400 mr-2 md:mr-3">{card.courseName}</span>
                                </h3>
                                <span className="text-[9px] md:text-[10px] font-black text-slate-500 dark:text-slate-600 bg-slate-100 dark:bg-white/[0.05] px-2.5 py-1 rounded-lg md:rounded-xl border border-slate-200 dark:border-white/[0.05] uppercase tracking-widest whitespace-nowrap">{card.credits} Credits</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {card.is_locked ? (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        <CheckCircle2 className="w-3 h-3" /> Locked
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
                                        <Clock className="w-3 h-3" /> In Progress
                                    </span>
                                )}
                                {!card.is_locked && card.hasPending && (
                                  <button 
                                    onClick={() => setSimulatorMode(prev => ({ ...prev, [card.courseId]: !prev[card.courseId] }))}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${simulatorMode[card.courseId] ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-500 hover:bg-blue-500/10 hover:text-blue-500 border border-slate-200 dark:border-white/[0.05]'}`}
                                  >
                                    <Calculator className="w-3 h-3" /> {simulatorMode[card.courseId] ? 'Exit Simulator' : 'Grade Simulator'}
                                  </button>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-center md:items-end gap-1">
                            <span className={`text-[13px] md:text-base font-black px-4 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-md md:shadow-lg border uppercase tracking-wider text-center ${(() => {
                                if (simulatorMode[card.courseId]) {
                                  const simTotal = card.components.reduce((acc, comp) => acc + ((simValues[card.courseId]?.[comp.name] ?? comp.score) / comp.max) * comp.weight, 0);
                                  const cutoffs = card.stats?.cutoffs || {};
                                  let projected = "F";
                                  const sortedKeys = Object.keys(cutoffs).filter(k => !k.startsWith("_")).sort((a,b) => cutoffs[b] - cutoffs[a]);
                                  for (const g of sortedKeys) {
                                      if (simTotal >= (cutoffs[g] || 0)) { projected = g; break; }
                                  }
                                  return gradeColor(projected).badge;
                                }
                                return gradeColor(card.grade).badge;
                            })()} ${simulatorMode[card.courseId] ? 'animate-pulse' : ''}`}>
                                {simulatorMode[card.courseId] ? (() => {
                                    const simTotal = card.components.reduce((acc, comp) => acc + ((simValues[card.courseId]?.[comp.name] ?? comp.score) / comp.max) * comp.weight, 0);
                                    const cutoffs = card.stats?.cutoffs || {};
                                    let projected = "F";
                                    const sortedKeys = Object.keys(cutoffs).filter(k => !k.startsWith("_")).sort((a,b) => cutoffs[b] - cutoffs[a]);
                                    for (const g of sortedKeys) {
                                        if (simTotal >= (cutoffs[g] || 0)) { projected = g; break; }
                                    }
                                    return `Projected ${projected}`;
                                })() : (card.grade === "N/A" ? "Calculating" : 
                                 (!card.is_locked && card.grade !== "N/A" ? `Potential ${card.grade}` : (card.grade || "Waiting")))}
                            </span>
                            {(simulatorMode[card.courseId] || (card.grade && card.grade !== "N/A" && card.grade !== "Waiting")) && (
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{simulatorMode[card.courseId] ? "Hypothetical Outcome" : (card.is_locked ? "Final GPA" : "Draft Grade")}</p>
                            )}
                        </div>
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
                            <p className="text-[8px] md:text-[9px] uppercase tracking-[.15em] md:tracking-[.2em] font-black text-slate-500 dark:text-slate-600 mb-1 md:mb-2">{simulatorMode[card.courseId] ? "Projected Score" : "Final Score"}</p>
                            <div className="flex items-baseline gap-2">
                              <span className={`text-4xl md:text-6xl font-black ${simulatorMode[card.courseId] ? 'text-blue-500' : 'text-slate-900 dark:text-white'}`}>
                                {(simulatorMode[card.courseId] 
                                  ? card.components.reduce((acc, comp) => acc + ((simValues[card.courseId]?.[comp.name] ?? comp.score) / comp.max) * comp.weight, 0)
                                  : card.total).toFixed(2)}
                              </span>
                            </div>
                          </div>

                          {/* Feature 3: Interactive Bell Curve (Cohort Position) */}
                          {card.distribution && card.distribution.length > 0 && (
                            <div className="pt-4 border-t border-slate-100 dark:border-white/[0.04]">
                              <div className="flex items-center justify-between mb-4">
                                <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-600">Cohort Distribution</p>
                                <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">You are here</span>
                              </div>
                              <div className="h-24 w-full relative group/curve">
                                <ResponsiveContainer width="100%" height="100%">
                                  <AreaChart data={card.distribution}>
                                    <defs>
                                      <linearGradient id="colorCurve" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.6}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                      </linearGradient>
                                    </defs>
                                    <YAxis hide domain={[0, 45]} />
                                    <Tooltip 
                                      content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                          const data = payload[0].payload;
                                          return (
                                            <div className="bg-slate-900 border border-blue-500/30 p-2 rounded-lg shadow-2xl backdrop-blur-md">
                                              <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">{data.label} Percentile</p>
                                              <p className="text-[11px] font-black text-white uppercase tracking-wider">Avg Marks: {data.avg.toFixed(2)}</p>
                                              <p className="text-[7px] font-bold text-slate-500 uppercase mt-1">Cohort Performance Band</p>
                                            </div>
                                          );
                                        }
                                        return null;
                                      }}
                                    />
                                    <Area 
                                      type="monotone" 
                                      dataKey="density" 
                                      stroke="#3b82f6" 
                                      strokeOpacity={1}
                                      fillOpacity={1} 
                                      fill="url(#colorCurve)" 
                                      strokeWidth={3}
                                      isAnimationActive={true}
                                    />
                                  </AreaChart>
                                </ResponsiveContainer>
                                {/* Pulsing Dot Indicator for Student Position (Rank-based) */}
                                {card.rank && card.cohortSize ? (
                                  <div 
                                    className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10 transition-all duration-1000 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                                    style={{ left: `${((card.cohortSize - card.rank + 0.5) / card.cohortSize) * 100}%` }}
                                  >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1.5 w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_#3b82f6] animate-pulse border-2 border-white dark:border-slate-900" />
                                    <div className="absolute top-4 left-4 whitespace-nowrap bg-blue-600 text-white text-[7px] font-black uppercase px-2 py-0.5 rounded shadow-lg pointer-events-none">
                                      Rank #{card.rank} / {card.cohortSize}
                                    </div>
                                  </div>
                                ) : (
                                  /* Fallback to score-based if rank missing */
                                  <div 
                                    className="absolute top-0 bottom-0 w-1 bg-blue-500 z-10 transition-all duration-1000"
                                    style={{ left: `${Math.min(Math.max(card.total, 0), 100)}%` }}
                                  >
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_10px_#3b82f6] animate-pulse" />
                                  </div>
                                )}
                              </div>
                              <div className="flex justify-between mt-2 px-1">
                                <span className="text-[8px] font-black text-slate-400">0</span>
                                <span className="text-[8px] font-black text-slate-400">50</span>
                                <span className="text-[8px] font-black text-slate-400">100</span>
                              </div>
                            </div>
                          )}

                          {/* Cohort Stats */}
                          {card.stats && card.stats.avg !== null && (
                            <div className="pt-2">
                              <p className="text-[9px] md:text-[10px] uppercase tracking-widest font-black text-slate-700 dark:text-slate-600 mb-3 md:mb-4 px-1">Cohort Distribution</p>
                              <div className="grid grid-cols-3 gap-2 md:gap-3">
                                {[["Avg", card.stats.avg, "text-slate-600 dark:text-slate-400"], ["Med", card.stats.median, "text-slate-600 dark:text-slate-400"], ["Min", card.stats.min, "text-slate-600 dark:text-slate-400"], ["Best", card.stats.max, "text-emerald-600 dark:text-emerald-400"]].map(([label, val, cls]) => (
                                  <div key={label as string} className="bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.04] rounded-xl md:rounded-2xl p-2.5 md:p-3.5 text-center shadow-inner">
                                    <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-slate-500 dark:text-slate-600 font-black mb-1 md:mb-1.5">{label}</p>
                                    <p className={`text-[11px] md:text-sm font-black ${cls}`}>{formatNumber(val)}</p>
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
                                    {comp.cohortAvg !== undefined && comp.cohortAvg !== null && (
                                      <span className={`hidden sm:inline-block text-[8px] md:text-[9px] font-black px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg md:rounded-xl border uppercase tracking-widest ${comp.score >= comp.cohortAvg ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border-rose-500/20'}`}>
                                        Avg: {formatNumber(comp.cohortAvg)}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    {simulatorMode[card.courseId] ? (
                                      <div className="flex items-center gap-2">
                                        <input 
                                          type="number" 
                                          max={comp.max}
                                          min={0}
                                          value={simValues[card.courseId]?.[comp.name] ?? comp.score}
                                          onChange={(e) => setSimValues(prev => ({
                                              ...prev,
                                              [card.courseId]: {
                                                  ...(prev[card.courseId] || {}),
                                                  [comp.name]: parseFloat(e.target.value) || 0
                                              }
                                          }))}
                                          className="w-16 h-8 bg-blue-500/10 border border-blue-500/30 rounded-lg text-center font-black text-blue-600 dark:text-blue-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                        />
                                        <span className="text-[10px] font-black text-slate-400">/ {comp.max}</span>
                                      </div>
                                    ) : (
                                      <span className="font-black text-slate-900 dark:text-white text-base md:text-xl font-mono">{formatNumber(comp.score)}</span>
                                    )}
                                  </div>
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
