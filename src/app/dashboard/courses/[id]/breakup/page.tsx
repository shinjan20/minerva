"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";


type Breakup = {
  quiz_attempts: number;
  quiz_aggregation: "BEST_N" | "AVERAGE" | "SUM";
  quiz_best_n: number | null;
  quiz_pct: number;
  midterm_pct: number;
  project_pct: number;
  endterm_pct: number;
  cp_pct: number;
  is_locked: boolean;
};

export default function ScoreBreakupPage() {
  const { id } = useParams();
  const router = useRouter();

  const [breakup, setBreakup] = useState<Breakup>({
    quiz_attempts: 1,
    quiz_aggregation: "SUM",
    quiz_best_n: null,
    quiz_pct: 0,
    midterm_pct: 0,
    project_pct: 0,
    endterm_pct: 0,
    cp_pct: 0,
    is_locked: false,
  });

  const [courseName, setCourseName] = useState("");
  const [courseTerm, setCourseTerm] = useState<number | string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBreakup();
  }, []);

  const fetchBreakup = async () => {
    try {
      const res = await fetch(`/api/courses/${id}/breakup`);
      const data = await res.json();
      if (res.ok) {
        if (data.breakup) setBreakup(data.breakup);
        setCourseName(data.courseName || "");
        setCourseTerm(data.courseTerm || "");
      }
    } catch (err) {
      toast.error("Failed to load breakup config");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sum = Number(breakup.quiz_pct) + Number(breakup.midterm_pct) + Number(breakup.project_pct) + Number(breakup.endterm_pct) + Number(breakup.cp_pct);
    if (sum !== 100) {
      toast.error(`Weights must sum precisely to 100. Current sum: ${sum}`);
      return;
    }

    setSaving(true);

    try {
      const res = await fetch(`/api/courses/${id}/breakup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(breakup),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Score breakup saved successfully");
        setTimeout(() => router.push("/dashboard/courses"), 1200);
      } else {
        toast.error(data.error || "Failed to save breakup");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingPopup message="Retrieving configuration and grading thresholds..." />;

  const currentSum = (Number(breakup.quiz_pct) + Number(breakup.midterm_pct) + Number(breakup.project_pct) + Number(breakup.endterm_pct) + Number(breakup.cp_pct));
  const isSumValid = currentSum === 100;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-12 animate-fade-in-up font-[Orbitron]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Policy Configuration</span>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
            <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-slate-900 dark:text-white">Grading</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-blue-600">Breakup</span>
              </div>
              {courseName && (
                <div className="mt-1 flex items-center gap-3 text-lg sm:text-2xl font-black tracking-tighter">
                  <span className="text-blue-600 dark:text-blue-400">Subject : {courseName}</span>
                  <span className="text-slate-300 dark:text-white/20">|</span>
                  <span className="text-slate-500 dark:text-slate-400">Term : {courseTerm}</span>
                </div>
              )}
            </div>
          </h1>
          <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest pl-7 opacity-80 mt-2">Define evaluation weights and automated aggregation logic.</p>
        </div>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          ← Back
        </button>
      </div>

      {breakup.is_locked && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-3xl flex items-start gap-4 animate-pulse">
          <div className="p-2 bg-amber-500/10 rounded-xl">
             <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <div>
            <p className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Configuration Immutably Locked</p>
            <p className="text-[10px] text-amber-600/70 font-bold uppercase mt-1">Institutional records have been ingested. Parameters are now frozen to maintain audit integrity.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] p-10 shadow-sm dark:shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-blue-600/30"></div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 uppercase tracking-[0.2em]">Component Weights (%)</h3>
            
            <div className="grid grid-cols-1 gap-6">
              {[
                { label: "Quizzes & Assignments", key: "quiz_pct" },
                { label: "Class Participation", key: "cp_pct" },
                { label: "Mid-Term Examination", key: "midterm_pct" },
                { label: "Major Project / Viva", key: "project_pct" },
                { label: "Term End Examination", key: "endterm_pct" }
              ].map((comp) => (
                <div key={comp.key}>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">{comp.label}</label>
                  <div className="relative">
                    <input 
                      type="number" step="any" min="0" max="100" required disabled={breakup.is_locked}
                      className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg disabled:opacity-50"
                      value={(breakup as any)[comp.key]} 
                      onChange={(e) => setBreakup({...breakup, [comp.key]: parseFloat(e.target.value) || 0})}
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black">%</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className={`p-6 rounded-2xl flex justify-between items-center transition-all ${
              isSumValid ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-red-500/10 text-red-600 border border-red-500/20'
            }`}>
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Validated Aggregate Sum:</span>
              <span className="text-xl font-black">{currentSum.toFixed(2)}%</span>
            </div>
          </div>

          <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] p-10 shadow-sm dark:shadow-2xl space-y-8 relative overflow-hidden group">
            <div className="absolute top-0 inset-x-0 h-1 bg-indigo-600/30"></div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white border-b border-slate-100 dark:border-white/5 pb-4 uppercase tracking-[0.2em]">Aggregation Mechanics</h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Quiz Attempt Quota</label>
                <input 
                  type="number" min="1" max="20" required disabled={breakup.is_locked}
                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg disabled:opacity-50"
                  value={breakup.quiz_attempts} 
                  onChange={(e) => setBreakup({...breakup, quiz_attempts: parseInt(e.target.value) || 1})}
                />
              </div>
              
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Aggregation Strategy</label>
                <select 
                  required disabled={breakup.is_locked}
                  className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-black appearance-none cursor-pointer disabled:opacity-50"
                  value={breakup.quiz_aggregation} 
                  onChange={(e) => setBreakup({...breakup, quiz_aggregation: e.target.value as any})}
                >
                  <option value="SUM">Arithmetical Sum (Total)</option>
                  <option value="AVERAGE">Mean Average (Global)</option>
                  <option value="BEST_N">Selective Filter (Best N)</option>
                </select>
              </div>

              {breakup.quiz_aggregation === "BEST_N" && (
                <div className="animate-fade-in-up">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Best N Parameter</label>
                  <input 
                    type="number" min="1" max={breakup.quiz_attempts} required disabled={breakup.is_locked}
                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-black text-lg disabled:opacity-50"
                    value={breakup.quiz_best_n || ""} 
                    onChange={(e) => setBreakup({...breakup, quiz_best_n: parseInt(e.target.value) || 1})}
                    placeholder="e.g. 3"
                  />
                </div>
              )}
            </div>

            <div className="p-8 bg-blue-500/5 border border-blue-500/10 rounded-3xl">
               <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                 Institutional Note: Changes here will trigger a full background re-aggregation of the points table once marks are finalized.
               </p>
            </div>
          </div>
        </div>

        {!breakup.is_locked && (
          <div className="flex justify-end pt-4">
            <button
              type="submit" disabled={saving || !isSumValid}
              className="px-12 py-5 bg-blue-600 text-white font-black rounded-2xl shadow-lg dark:shadow-[0_12px_24px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50 uppercase tracking-[0.2em] text-[11px]"
            >
              {saving ? "Updating System..." : "Apply Configuration"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
