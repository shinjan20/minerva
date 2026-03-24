"use client";

import { useState, useEffect, useMemo } from "react";
import * as xlsx from "xlsx";
import { TableSkeleton } from "@/components/Skeleton";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, BarChart3, ScrollText } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

type Scorecard = {
  student_id: string;
  name: string;
  section: string;
  components: Record<string, number | "AB" | "ME">;
  total: number;
  grade: string;
  rank: number;
  section_rank?: number | null;
  rank_change: number;
};

function gradeChip(grade: string) {
  if (!grade || grade === "?") return "bg-slate-500/15 text-slate-400 border border-slate-500/20";
  const g = grade.toUpperCase();
  if (g.startsWith("A")) return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/25";
  if (g.startsWith("B")) return "bg-sky-500/15 text-sky-300 border border-sky-500/25";
  if (g.startsWith("C")) return "bg-amber-500/15 text-amber-300 border border-amber-500/25";
  return "bg-red-500/15 text-red-400 border border-red-500/25";
}

export default function MarksTablePage() {
  const { id } = useParams();
  const router = useRouter();

  const [scores, setScores] = useState<Scorecard[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [courseName, setCourseName] = useState("");
  const [courseTerm, setCourseTerm] = useState<number | string>("");
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);
  const [finalizing, setFinalizing] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [visibleComponents, setVisibleComponents] = useState<string[]>([]);
  const [togglingVisibility, setTogglingVisibility] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmFinalize, setConfirmFinalize] = useState(false);

  useEffect(() => {
    fetchMarks();
  }, [id]);

  const fetchMarks = async () => {
    try {
      const res = await fetch(`/api/marks/${id}`);
      const data = await res.json();
      if (res.ok) {
        setScores(data.scores || []);
        setColumns(data.columns || []);
        setCourseName(data.courseName || "");
        setCourseTerm(data.courseTerm || "");
        setRole(data.role);
        setIsLocked(data.is_locked || false);
        
        // Fetch current visibility state
        const visRes = await fetch(`/api/visibility/${id}`); // Assuming a GET exists or I'll just use the courseId route
        // Wait, I should check if I need to implement a GET for visibility or if it comes with the marks.
        // The /api/marks/[courseId] route I checked doesn't return ALL visibility rules, only for the logged in student.
        // But if I am OFFICE_STAFF, I want to see everything.
      }
      
      if (data.role === "OFFICE_STAFF") {
          const visRes = await fetch(`/api/visibility/${id}`);
          if (visRes.ok) {
              const visData = await visRes.json();
              setVisibleComponents(visData.visibleComponents || []);
          }
      }
    } catch (err) {
      toast.error("Failed to load marks matrix");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMarksheet = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marks/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Marksheet removed successfully");
        fetchMarks();
      } else {
        toast.error("Failed to remove marksheet");
        setLoading(false);
      }
    } catch {
      toast.error("Network error");
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (component: string) => {
    if (isLocked) return;
    const isVisible = visibleComponents.includes(component);
    setTogglingVisibility(component);
    
    try {
      const res = await fetch(`/api/visibility/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ component, isVisible: !isVisible })
      });
      
      if (res.ok) {
        if (!isVisible) {
          setVisibleComponents(prev => [...prev, component]);
          toast.success(`${component} released to students`);
        } else {
          setVisibleComponents(prev => prev.filter(c => c !== component));
          toast.success(`${component} hidden from students`);
        }
      } else {
        toast.error("Failed to update visibility");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setTogglingVisibility(null);
    }
  };

  const handleFinalize = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/marks/${id}/finalize`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsLocked(true);
        fetchMarks();
      } else {
        toast.error(data.error || "Failed to finalize course.");
      }
    } catch {
      toast.error("Network error trying to finalize.");
    } finally {
      setLoading(false);
    }
  };

  const processedScores = useMemo(() => {
    const sorted = [...scores].sort((a, b) => (b.total || 0) - (a.total || 0) || a.name.localeCompare(b.name));
    
    // Group by section for section ranks
    const sectionGroups: Record<string, typeof scores> = {};
    sorted.forEach(s => {
      const sec = s.section || "N/A";
      if (!sectionGroups[sec]) sectionGroups[sec] = [];
      sectionGroups[sec].push(s);
    });

    return sorted.map((row, index) => {
      // Calculate global rank if missing
      const globalRank = row.rank || (row.total !== null ? index + 1 : null);
      
      // Calculate section rank if missing
      let secRank = row.section_rank;
      if (!secRank && row.total !== null) {
        const sec = row.section || "N/A";
        const secIndex = sectionGroups[sec].findIndex(s => s.student_id === row.student_id);
        secRank = secIndex + 1;
      }

      return { ...row, calculatedRank: globalRank, calculatedSectionRank: secRank };
    });
  }, [scores]);

  const getRankChange = (change: number) => {
    if (change === 999 || change === null) return null;
    if (change > 0) return <span className="text-emerald-500 dark:text-emerald-400 font-bold text-xs">↑{change}</span>;
    if (change < 0) return <span className="text-red-500 dark:text-red-400 font-bold text-xs">↓{Math.abs(change)}</span>;
    return <span className="text-slate-400 dark:text-slate-600 text-xs">—</span>;
  };

  if (loading) return (
    <div className="p-8 max-w-full mx-auto space-y-7 animate-fade-in-up font-[Orbitron]">
      <div className="h-[120px] bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2rem] p-8">
        <div className="flex justify-between items-center">
          <div className="space-y-4">
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
            <div className="h-10 w-64 bg-slate-200 dark:bg-white/10 rounded animate-pulse" />
          </div>
          <div className="flex gap-3">
             <div className="h-12 w-32 bg-slate-200 dark:bg-white/10 rounded-2xl animate-pulse" />
             <div className="h-12 w-48 bg-slate-200 dark:bg-white/10 rounded-2xl animate-pulse" />
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2rem] p-10">
        <TableSkeleton rows={10} cols={8} />
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-full mx-auto space-y-6 md:space-y-7 animate-fade-in-up font-[Orbitron]">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 md:pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Security Level: Terminal Access</span>
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase flex items-start md:items-center gap-3 md:gap-4">
            <span className="w-1.5 md:w-2.5 h-8 md:h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)] mt-1 md:mt-0" />
            <div className="flex flex-col">
              <div className="flex items-center gap-2 md:gap-3">
                <span className="text-slate-900 dark:text-white">Marks</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-blue-600">Table</span>
              </div>
              {courseName && (
                <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-[11px] sm:text-lg md:text-2xl font-black tracking-tight md:tracking-tighter">
                  <span className="text-blue-600 dark:text-blue-400 truncate max-w-[240px] sm:max-w-none">Subject : {courseName}</span>
                  <span className="hidden sm:inline text-slate-300 dark:text-white/20">|</span>
                  <span className="text-slate-500 dark:text-slate-400">Term : {courseTerm}</span>
                </div>
              )}
            </div>
          </h1>
          <p className="text-[9px] md:text-[10px] text-slate-600 dark:text-slate-400 font-black uppercase tracking-widest pl-4 md:pl-7">Live ranking and aggregated performance breakdown.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 md:gap-3 relative z-10">
          {role === "OFFICE_STAFF" && !isLocked && (
            <>
              <button
                onClick={() => setConfirmRemove(true)}
                className="group flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-red-500/5 dark:bg-red-500/10 border border-slate-200 dark:border-white/[0.08] hover:border-red-500 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-slate-400 group-hover:bg-red-500" />
                Remove Marksheet
              </button>
              <button
                onClick={() => setConfirmFinalize(true)}
                className="group flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 bg-red-500/5 dark:bg-red-500/10 border border-red-500/20 hover:border-red-500 text-red-600 dark:text-red-400 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shadow-sm"
              >
                <div className="w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-red-500 animate-pulse" />
                Finalize
              </button>
              <button
                onClick={() => router.push(`/dashboard/marks/${id}/upload`)}
                className="px-5 md:px-8 py-2.5 md:py-3 bg-blue-600 text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all duration-200 flex items-center gap-2 shadow-lg dark:shadow-[0_8px_20px_rgba(37,99,235,0.3)]"
              >
                <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload
              </button>
            </>
          )}
          <button
            onClick={() => router.back()}
            className="px-4 md:px-6 py-2.5 md:py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.08] text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-200 shadow-sm"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2rem] overflow-hidden shadow-sm dark:shadow-2xl">
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Course Rank</th>
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Section Rank</th>
                <th className="hidden sm:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">Section</th>
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Chg</th>
                <th className="hidden md:table-cell px-6 py-4 text-left text-[10px] font-black text-slate-500 uppercase tracking-widest">ID</th>
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Name</th>
                {columns.map(col => {
                  const isVisible = visibleComponents.includes(col);
                  return (
                    <th key={col} className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest group/col">
                      <div className="flex items-center gap-2">
                        {col}
                        {role === "OFFICE_STAFF" && !isLocked && (
                          <button
                            onClick={() => handleToggleVisibility(col)}
                            disabled={togglingVisibility === col}
                            className={`p-1 rounded-md transition-all ${isVisible ? 'text-blue-500 bg-blue-500/10' : 'text-slate-400 bg-slate-100 dark:bg-white/5 opacity-0 group-hover/col:opacity-100 hover:text-blue-500'}`}
                            title={isVisible ? "Visible to Students" : "Hidden from Students"}
                          >
                            {togglingVisibility === col ? (
                              <div className="w-2.5 h-2.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            ) : isVisible ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <EyeOff className="w-3 h-3" />
                            )}
                          </button>
                        )}
                      </div>
                    </th>
                  );
                })}
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">Total</th>
                <th className="px-3 md:px-6 py-4 text-left text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
              {processedScores.map((score) => (
                <tr key={score.student_id} className="hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-colors group">
                  <td className="px-3 md:px-6 py-4 md:py-6 whitespace-nowrap text-[12px] md:text-sm font-black text-blue-600 dark:text-blue-400">
                    #{score.calculatedRank}
                  </td>
                  <td className="px-3 md:px-6 py-4 md:py-6 whitespace-nowrap text-[12px] md:text-sm font-black text-slate-900 dark:text-white">
                    #{score.calculatedSectionRank}
                  </td>
                  <td className="hidden sm:table-cell px-6 py-6 whitespace-nowrap text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase">
                    {score.section || "A"}
                  </td>
                  <td className="px-3 md:px-6 py-4 md:py-6 whitespace-nowrap text-[9px] md:text-[10px] font-black text-slate-400">
                    {score.rank_change === 0 ? "—" : score.rank_change > 0 ? `+${score.rank_change}` : score.rank_change}
                  </td>
                  <td className="hidden md:table-cell px-6 py-6 whitespace-nowrap text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase">
                    {score.student_id}
                  </td>
                  <td className="px-3 md:px-6 py-4 md:py-6 whitespace-nowrap">
                    <div className="text-[12px] md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight truncate max-w-[80px] md:max-w-[150px]">{score.name}</div>
                  </td>
                  {columns.map(col => (
                    <td key={col} className="px-3 md:px-6 py-4 md:py-6 whitespace-nowrap text-[12px] md:text-sm font-bold text-slate-600 dark:text-slate-300">
                      {score.components[col] !== undefined ? (
                        <span className={String(score.components[col]) === "AB" ? "text-red-500" : String(score.components[col]) === "ME" ? "text-amber-500" : ""}>
                          {score.components[col]}
                        </span>
                      ) : (
                        <span className="text-slate-300 dark:text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-3 md:px-5 py-3 md:py-4 whitespace-nowrap text-center bg-blue-50/30 dark:bg-blue-500/5">
                    <span className="text-sm md:text-base font-black text-blue-700 dark:text-white">
                      {score.total !== null && score.total !== undefined ? score.total.toFixed(1) : <span className="text-slate-500 dark:text-slate-400 italic text-xs font-normal">Pending</span>}
                    </span>
                  </td>
                  <td className="px-3 md:px-5 py-3 md:py-4 whitespace-nowrap text-center text-[10px]">
                    <span className={`inline-flex items-center px-2 py-0.5 md:px-2.5 md:py-1 rounded-md md:rounded-lg text-[10px] md:text-xs font-bold ${gradeChip(score.grade)}`}>
                      {score.grade || "?"}
                    </span>
                  </td>
                </tr>
              ))}
              {processedScores.length === 0 && (
                <tr>
                  <td colSpan={7 + columns.length} className="px-6 py-16 text-center text-slate-500 font-medium">
                    No marks data uploaded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <ConfirmModal 
        isOpen={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={handleRemoveMarksheet}
        title="Remove Marksheet"
        message="Are you sure you want to remove all uploaded marks for this course? This will clear the marksheet but keep the course itself. This cannot be undone."
      />
      <ConfirmModal 
        isOpen={confirmFinalize}
        onClose={() => setConfirmFinalize(false)}
        onConfirm={handleFinalize}
        title="Finalize Course"
        message="Finalize this course? This permanently locks all scores and calculates final cohort ranks. This cannot be undone."
      />
    </div>
  );
}
