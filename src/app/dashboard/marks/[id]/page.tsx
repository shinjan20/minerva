"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";

type Scorecard = {
  student_id: string;
  name: string;
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

export default function PointsTablePage() {
  const { id } = useParams();
  const router = useRouter();

  const [scores, setScores] = useState<Scorecard[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [role, setRole] = useState("STUDENT");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTable(); }, [id]);

  const fetchTable = async () => {
    try {
      const res = await fetch(`/api/marks/${id}`);
      const data = await res.json();
      if (res.ok) {
        setScores(data.scores || []);
        setColumns(data.columns || []);
        setRole(data.role);
        setIsLocked(data.is_locked || false);
      } else {
        toast.error(data.error || "Failed to load marks");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Finalize this course? This permanently locks all scores and calculates final cohort ranks. This cannot be undone.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/marks/${id}/finalize`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIsLocked(true);
        fetchTable();
      } else {
        toast.error(data.error || "Failed to finalize course.");
      }
    } catch {
      toast.error("Network error trying to finalize.");
    } finally {
      setLoading(false);
    }
  };

  const sortedScores = useMemo(() =>
    [...scores].sort((a, b) => (b.total || 0) - (a.total || 0) || a.name.localeCompare(b.name)),
    [scores]
  );

  const getRankChange = (change: number) => {
    if (change === 999 || change === null) return null;
    if (change > 0) return <span className="text-emerald-400 font-bold text-xs">↑{change}</span>;
    if (change < 0) return <span className="text-red-400 font-bold text-xs">↓{Math.abs(change)}</span>;
    return <span className="text-slate-600 text-xs">—</span>;
  };

  if (loading) return <LoadingPopup message="Assembling the cohort grading table..." />;

  return (
    <div className="p-8 max-w-full mx-auto space-y-7 animate-fade-in-up">

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-white/[0.06]">
        <div>
          <span className="text-xs font-bold text-violet-400 tracking-widest uppercase">Course Results</span>
          <h1 className="mt-1 text-4xl font-black text-white tracking-tight" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Points <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-400">Table</span>
          </h1>
          <p className="mt-1 text-sm text-slate-400">Live ranking and aggregated performance breakdown.</p>
        </div>

        <div className="flex gap-3 flex-wrap">
          {role !== "STUDENT" && isLocked && (
            <span className="px-5 py-2.5 bg-white/[0.04] text-slate-500 rounded-xl text-sm font-bold flex items-center gap-2 border border-white/[0.06]">
              🔒 Finalized
            </span>
          )}
          {role !== "STUDENT" && !isLocked && (
            <>
              <button
                onClick={handleFinalize}
                className="px-5 py-2.5 bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.1)] hover:shadow-[0_0_30px_rgba(239,68,68,0.2)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                Finish Uploads
              </button>
              <button
                onClick={() => router.push(`/dashboard/marks/${id}/upload`)}
                className="px-5 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-violet-500 hover:to-indigo-500 transition-all duration-200 flex items-center gap-2 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)]"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Marks
              </button>
            </>
          )}
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-white/[0.05] border border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.08] rounded-xl text-sm font-semibold transition-all duration-200"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Rank</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sec.</th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chg</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Student ID</th>
                <th className="px-5 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Name</th>
                {columns.map(col => (
                  <th key={col} className="px-5 py-4 text-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                    {col === '_total' ? 'Total' : col}
                  </th>
                ))}
                <th className="px-5 py-4 text-center text-[10px] font-bold text-violet-400 uppercase tracking-widest">Agg. Total</th>
                <th className="px-5 py-4 text-center text-[10px] font-bold text-violet-400 uppercase tracking-widest">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {sortedScores.map((row, index) => (
                <tr key={row.student_id} className="hover:bg-white/[0.04] transition-colors group">
                  <td className="px-5 py-4 whitespace-nowrap">
                    {row.total !== null ? (
                      <span className="text-lg font-black text-white">#{row.rank || (index + 1)}</span>
                    ) : (
                      <span className="text-slate-600 italic text-sm">Unranked</span>
                    )}
                    {row.rank_change === 999 && (
                      <span className="ml-2 text-[9px] uppercase font-black tracking-widest bg-sky-500/15 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded">New</span>
                    )}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-bold text-violet-400">
                    {row.section_rank ? `#${row.section_rank}` : "—"}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm text-center">
                    {row.rank_change !== 999 ? getRankChange(row.rank_change) : ""}
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-mono font-bold text-violet-300/80">{row.student_id}</td>
                  <td className="px-5 py-4 whitespace-nowrap text-sm font-semibold text-white">{row.name}</td>
                  {columns.map(col => (
                    <td key={col} className="px-5 py-4 whitespace-nowrap text-sm text-center font-mono font-bold text-slate-300">
                      {row.components[col] !== undefined ? (
                        <span className={String(row.components[col]) === "AB" ? "text-red-400" : String(row.components[col]) === "ME" ? "text-amber-400" : ""}>
                          {row.components[col]}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className="text-base font-black text-white">
                      {row.total !== null && row.total !== undefined ? row.total.toFixed(1) : <span className="text-slate-600 italic text-sm font-normal">Pending</span>}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${gradeChip(row.grade)}`}>
                      {row.grade || "?"}
                    </span>
                  </td>
                </tr>
              ))}
              {sortedScores.length === 0 && (
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
    </div>
  );
}
