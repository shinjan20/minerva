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

export default function PointsTablePage() {
  const { id } = useParams();
  const router = useRouter();

  const [scores, setScores] = useState<Scorecard[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [role, setRole] = useState("STUDENT");
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTable();
  }, [id]);

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
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!window.confirm("Are you sure you want to finalize this course? This permanently locks the scorecard and calculates final cohort rankings. No more marks can be uploaded.")) return;
    
    setLoading(true);
    try {
        const res = await fetch(`/api/marks/${id}/finalize`, { method: "POST" });
        const data = await res.json();
        if (res.ok) {
            toast.success(data.message);
            setIsLocked(true);
            fetchTable(); // Refresh table entirely to pull accurate calculated ranks natively 
        } else {
            toast.error(data.error || "Failed to finalize course.");
        }
    } catch (e) {
        toast.error("Network error trying to finalize.");
    } finally {
        setLoading(false);
    }
  };

  const sortedScores = useMemo(() => {
    return [...scores].sort((a, b) => {
       const totalA = a.total || 0;
       const totalB = b.total || 0;
       return totalB - totalA || a.name.localeCompare(b.name);
    });
  }, [scores]);

  const getRankBadge = (change: number) => {
    if (change === 999 || change === null) return null;
    if (change > 0) return <span className="text-green-600 font-bold">↑{change}</span>;
    if (change < 0) return <span className="text-red-600 font-bold">↓{Math.abs(change)}</span>;
    return <span className="text-gray-400">—</span>;
  };

  if (loading) return <LoadingPopup message="Evaluating and assembling dynamic grading tables..." />;

  const hasAggregatedData = scores.some(s => s.rank !== null && s.total !== null);

  return (
    <div className="p-10 max-w-7xl mx-auto space-y-10 animate-fade-in-up">
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-gray-200/50">
        <div>
          <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-800 tracking-tight">Points Table</h1>
          <p className="mt-2 text-base text-gray-500 font-medium">Live ranking and aggregated performance breakdown.</p>
        </div>
        <div className="flex gap-4">
          {role !== "STUDENT" && isLocked && (
             <span className="px-6 py-2.5 bg-gray-100/50 text-gray-500 rounded-xl text-sm font-bold flex items-center gap-2 border border-gray-200 cursor-not-allowed">
                🔒 Marks Finalized
             </span>
          )}
          {role !== "STUDENT" && !isLocked && (
            <>
              <button onClick={handleFinalize} className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-bold hover:shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                Finish Uploads
              </button>
              <button onClick={() => router.push(`/dashboard/marks/${id}/upload`)} className="px-6 py-2.5 bg-gradient-to-r from-primary to-purple-600 text-white rounded-xl text-sm font-bold hover:shadow-[0_8px_20px_rgba(107,33,168,0.3)] transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Upload Marks
              </button>
            </>
          )}
          <button onClick={() => router.back()} className="px-6 py-2.5 bg-white border border-gray-200 shadow-sm text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-95">
            Back
          </button>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-white/80 overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-md">
              <tr>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest sticky left-0 bg-gray-50/90 backdrop-blur-md z-10 w-20 border-r border-gray-100/50">Rank</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest bg-gray-50/90 backdrop-blur-md z-10 w-20 border-r border-gray-100/50">S. Rank</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-500 uppercase tracking-widest w-20">Chg</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Student ID</th>
                <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Target Details</th>
                
                {columns.map(col => (
                  <th key={col} className="px-6 py-5 text-center text-xs font-black text-gray-500 uppercase tracking-widest">
                    {col === '_total' ? 'Raw Sum' : col}
                  </th>
                ))}
                
                <th className="px-6 py-5 text-center text-xs font-black text-gray-800 uppercase tracking-widest bg-gray-100/50">Agg. Total</th>
                <th className="px-6 py-5 text-center text-xs font-black text-gray-800 uppercase tracking-widest bg-gray-100/50">L. Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100/80">
              {sortedScores.map((row, index) => (
                <tr key={row.student_id} className="hover:bg-primary/5 transition-colors group">
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-gray-900 sticky left-0 bg-white/90 group-hover:bg-purple-50/90 backdrop-blur border-r border-gray-100/50 shadow-[2px_0_5px_rgba(0,0,0,0.01)] transition-colors">
                    {row.total !== null ? (
                        <>
                           <span className="bg-clip-text text-transparent bg-gradient-to-br from-gray-900 to-gray-500 text-lg">#{row.rank || (index + 1)}</span>
                           {row.rank_change === 999 && <span className="ml-3 px-2 py-0.5 text-[10px] uppercase font-black tracking-widest bg-blue-100 text-blue-700 rounded-md">New</span>}
                        </>
                    ) : ( <span className="text-gray-400 font-normal italic pr-2">Unranked</span> )}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-black text-purple-700 bg-white/90 group-hover:bg-purple-50/90 backdrop-blur border-r border-gray-100/50 transition-colors">
                     {row.section_rank ? `#${row.section_rank}` : "-"}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-center">
                    {row.rank_change !== 999 ? getRankBadge(row.rank_change) : ""}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm font-bold font-mono text-primary/80">{row.student_id}</td>
                  <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-900 font-bold">{row.name}</td>
                  
                  {columns.map(col => (
                    <td key={col} className="px-6 py-5 whitespace-nowrap text-sm text-center font-bold font-mono text-gray-600">
                      {row.components[col] !== undefined ? row.components[col] : <span className="text-gray-300">-</span>}
                    </td>
                  ))}

                  <td className="px-6 py-5 whitespace-nowrap text-base text-center font-black text-primary bg-gray-50/30 group-hover:bg-primary/5 transition-colors">
                    {row.total !== null && row.total !== undefined ? row.total.toFixed(2) : <span className="text-gray-400 font-normal italic text-sm">Pending</span>}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-base text-center font-black text-gray-900 bg-gray-50/30 group-hover:bg-primary/5 transition-colors">
                    {row.grade || "?"}
                  </td>
                </tr>
              ))}
              {sortedScores.length === 0 && (
                <tr>
                  <td colSpan={7 + columns.length} className="px-6 py-16 text-center">
                     <p className="text-gray-400 font-medium">No marks data exists.</p>
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
