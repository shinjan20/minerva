"use client";

import { useState, useEffect } from "react";
import LoadingPopup from "@/components/LoadingPopup";

import toast from "react-hot-toast";
import * as xlsx from "xlsx";

type AuditEntry = {
  id: string;
  action_type: string;
  course_id: string | null;
  component: string | null;
  rows_processed: number | null;
  upload_type: string | null;
  outcome: string;
  created_at: string;
  users: { name: string; role: string; email: string } | null;
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const res = await fetch(`/api/audit/all`);
      const data = await res.json();
      if (res.ok) {
        setLogs(data.logs || []);
      } else {
        toast.error("Failed to load audit logs");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const exportExcel = () => {
    const ws = xlsx.utils.json_to_sheet(
      logs.map(log => ({
        "Timestamp": new Date(log.created_at).toLocaleString(),
        "Action Type": log.action_type,
        "User": log.users?.name || "System",
        "Role": log.users?.role || "-",
        "Email": log.users?.email || "-",
        "Component": log.component || "N/A",
        "Upload Type": log.upload_type || "N/A",
        "Rows": log.rows_processed || 0,
        "Outcome": log.outcome
      }))
    );
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, "Audit Log");
    xlsx.writeFile(wb, "System_Audit_Log.xlsx");
  };

  if (loading) return <LoadingPopup message="Retrieving institutional audit matrix..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in-up font-[Orbitron]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-slate-200 dark:border-white/[0.08] pb-10">
        <div>
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Security Operations</span>
          <h1 className="mt-2 text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
            <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex items-center gap-3">
              <span className="text-slate-900 dark:text-white">System</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">Audit Trail</span>
            </div>
          </h1>
          <p className="mt-4 text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5 opacity-80">Permanent ledger of all marks uploads, modifications, and administrative actions.</p>
        </div>
        <button 
          onClick={exportExcel}
          className="px-8 py-4 bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] rounded-2xl text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/[0.08] hover:scale-105 active:scale-95 transition-all shadow-sm dark:shadow-xl flex items-center gap-3 group"
        >
          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
          Export Ledger
        </button>
      </div>

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] shadow-sm dark:shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30"></div>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/[0.06]">
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Timestamp</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Agent</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operation</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Parameters</th>
                <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.03]">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group border-b border-slate-100 dark:border-white/[0.02]">
                  <td className="px-8 py-6 whitespace-nowrap text-[11px] font-mono font-black text-slate-400 dark:text-slate-500" title={log.created_at}>
                    {new Date(log.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <div className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{log.users?.name || "System"}</div>
                    <div className="text-[9px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest mt-1 opacity-60">{log.users?.role || "SYSTEM_EVENT"}</div>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 rounded-lg text-[10px] font-black font-mono">
                      {log.action_type}
                    </span>
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                    {log.component && <span className="text-slate-900 dark:text-slate-200">Unit: {log.component} </span>}
                    {log.upload_type && <span className="ml-2 text-blue-600 dark:text-blue-400/80">({log.upload_type}) </span>}
                    {log.rows_processed && <span className="ml-2 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded text-slate-500">Vol: {log.rows_processed}</span>}
                  </td>
                  <td className="px-8 py-6 whitespace-nowrap">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      log.outcome === "SUCCESS" 
                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]" 
                        : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]"
                    }`}>
                      {log.outcome}
                    </span>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest animate-pulse">
                    No logs recorded in the current epoch.
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
