"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";


type CRUser = {
  id: string;
  name: string;
  email: string;
  status: string;
  section: string;
  batch: string;
  created_at: string;
};

export default function ManageCRsPage() {
  const [crs, setCrs] = useState<CRUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCRs();
  }, []);

  const fetchCRs = async () => {
    try {
      const res = await fetch("/api/admin/cr");
      const data = await res.json();
      if (res.ok) {
        setCrs(data.crs);
      }
    } catch (err) {
      toast.error("Failed to load CRs");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id: string, action: "approve" | "reject" | "revoke") => {
    try {
      const res = await fetch(`/api/admin/cr/${id}/${action}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action === "reject" ? { reason: "Manual rejection" } : {}),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`CR ${action}d successfully`);
        fetchCRs();
      } else {
        toast.error(data.error || `Failed to ${action}`);
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  if (loading) return <LoadingPopup message="Retrieving delegated authorization roles..." />;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
          <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white">Manage</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">Class Representatives</span>
          </div>
        </h1>
        <p className="text-sm text-slate-400 font-bold uppercase tracking-widest opacity-80">Approve pending applications or revoke active access from delegated student authorities.</p>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] overflow-hidden shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-50"></div>
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-white/[0.02]">
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Authority / Identity</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Assignment</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocol Status</th>
              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Directives</th>
            </tr>
          </thead>
          <tbody className="bg-transparent divide-y divide-white/[0.03]">
            {crs.map((cr) => (
              <tr key={cr.id} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{cr.name}</div>
                  <div className="text-[11px] font-mono text-slate-500 mt-1">{cr.email}</div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-[10px] font-black">SEC {cr.section}</span>
                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-white/[0.05] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/10 rounded-md text-[10px] font-black">{cr.batch}</span>
                  </div>
                </td>
                <td className="px-8 py-6 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border
                    ${cr.status === "ACTIVE" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : 
                      cr.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                      "bg-red-500/10 text-red-400 border-red-500/20"}`}>
                    <span className={`w-1 h-1 rounded-full mr-2 animate-pulse ${cr.status === "ACTIVE" ? "bg-emerald-400" : cr.status === "PENDING" ? "bg-amber-400" : "bg-red-400"}`} />
                    {cr.status}
                  </span>
                </td>
                <td className="px-8 py-6 whitespace-nowrap text-sm font-medium space-x-3">
                  {cr.status === "PENDING" && (
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest italic opacity-50">Awaiting Student Sync</span>
                  )}
                  {cr.status === "ACTIVE" && (
                    <button 
                      onClick={() => handleAction(cr.id, "revoke")} 
                      className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      Revoke Access
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {crs.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No CR records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
