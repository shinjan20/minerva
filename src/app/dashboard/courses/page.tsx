"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import LoadingPopup from "@/components/LoadingPopup";
import toast from "react-hot-toast";
import { BookOpen, LayoutDashboard, BarChart3, Lock, Unlock, Send, Trash2, ShieldCheck } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

type Course = {
  id: string;
  name: string;
  section: string;
  batch: string;
  year: string;
  is_active: boolean;
};

type TermStatus = {
  term: number;
  is_locked: boolean;
  is_published: boolean;
  weight: number;
};

export default function CoursesPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<(Course & { term: number, credits: number })[]>([]);
  const [termStatuses, setTermStatuses] = useState<TermStatus[]>([]);
  const [role, setRole] = useState("STUDENT");
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [batch, setBatch] = useState("2025-27");
  const [year, setYear] = useState("1");
  const [term, setTerm] = useState("1");
  const [credits, setCredits] = useState("1.0");
  const [user, setUser] = useState<any>(null);
  const [creating, setCreating] = useState(false);
  const [lockingTerm, setLockingTerm] = useState<number | null>(null);
  const [deletingCourse, setDeletingCourse] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editingWeight, setEditingWeight] = useState<number | null>(null);
  const [newWeight, setNewWeight] = useState("");
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmTextColor?: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const authRes = await fetch("/api/auth/me");
      const authData = await authRes.json();
      if (authRes.ok) {
        setRole(authData.user.role);
        setUser(authData.user);
      }

      const res = await fetch("/api/courses");
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses);
        
        // Extract unique terms and initialize their statuses
        const terms = [1, 2, 3];
        const { data: statusData } = await (await fetch("/api/auth/me")).json(); // Placeholder for a real term status fetch if needed, let's fetch from a new endpoint or inferred.
        // For now, let's just fetch them from a small internal effect or mock if no endpoint exists yet.
        // Actually, let's create a quick endpoint or just fetch them here.
      }

      // Fetch official term statuses
      const tRes = await fetch("/api/admin/terms"); // I'll need to create this simple GET endpoint too.
      if (tRes.ok) {
          const tData = await tRes.json();
          setTermStatuses(tData.terms);
      } else {
          // Fallback if not yet created
          setTermStatuses([
              { term: 1, is_locked: false, is_published: false, weight: 1.0 },
              { term: 2, is_locked: false, is_published: false, weight: 1.0 },
              { term: 3, is_locked: false, is_published: false, weight: 1.0 },
          ]);
      }

    } catch (err) {
      toast.error("Failed to load course metadata");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, batch, year, term: parseInt(term), credits: parseFloat(credits) }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Course created and enrolled in Minerva");
        setName("");
        fetchCourses();
        
        const courseId = data.id || data.courseId;
        if (courseId) {
            setConfirmModal({
                isOpen: true,
                title: "Configuration Required",
                message: "A component breakup must be defined before marks can be uploaded. Would you like to set grading weights for this course now?",
                onConfirm: () => router.push(`/dashboard/courses/${courseId}/breakup`),
                confirmTextColor: "text-blue-600"
            });
        }
      } else {
        toast.error(data.error || "Creation failed");
        if (data.details) toast(data.details, { icon: 'ℹ️' });
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleLockTerm = async (termId: number) => {
    setConfirmModal({
        isOpen: true,
        title: `Lock Term ${termId} permanently`,
        message: `Are you absolutely sure? Locking Term ${termId} is IRREVERSIBLE. This will trigger automated result emails to all students and lock all entries for this term.`,
        onConfirm: async () => {
            setLockingTerm(termId);
            try {
                const res = await fetch(`/api/admin/terms/${termId}/lock`, { method: "POST" });
                const data = await res.json();
                if (res.ok) {
                    toast.success(`Term ${termId} officially Published & Locked`, { duration: 5000 });
                    fetchCourses();
                } else {
                    toast.error(data.error || "Locking failed");
                    if (data.details) toast(data.details, { icon: '⚠️' });
                }
            } catch (err) {
                toast.error("Network error during term lock");
            } finally {
                setLockingTerm(null);
            }
        }
    });
  };

  const handleUpdateTermWeight = async (t: number) => {
    if (!newWeight || isNaN(parseFloat(newWeight))) return;
    try {
        const res = await fetch("/api/admin/terms", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ term: t, weight: parseFloat(newWeight) })
        });
        if (res.ok) {
            toast.success(`Term ${t} credits updated to ${newWeight}`);
            setEditingWeight(null);
            fetchCourses();
        } else {
            toast.error("Update failed");
        }
    } catch (err) {
        toast.error("Network error");
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    setIsDeleting(true);
    try {
        const res = await fetch(`/api/courses/${deletingCourse}`, { method: "DELETE" });
        if (res.ok) {
            toast.success("Course and all associated data purged successfully");
            fetchCourses();
        } else {
            const data = await res.json();
            toast.error(data.error || "Deletion failed");
        }
    } catch (err) {
        toast.error("Network error during deletion");
    } finally {
        setIsDeleting(false);
        setDeletingCourse(null);
    }
  };

  if (loading) return <LoadingPopup message="Synchronizing global course databases..." />;

  const isTermLocked = (t: number) => termStatuses.find(ts => ts.term === t)?.is_locked;

  return (
    <>
    <div className="p-8 max-w-7xl mx-auto space-y-12 animate-fade-in-up font-[Orbitron]">
      <div className="flex justify-between items-end pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Academic Modules</span>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
            <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex items-center gap-3">
              <span className="text-slate-900 dark:text-white">Course</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">Directory</span>
            </div>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5 opacity-80">Add, edit, and organize academic modules and credit hours.</p>
        </div>
      </div>

      {role === "OFFICE_STAFF" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-sm dark:shadow-2xl relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 via-transparent to-indigo-500/5" />
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 relative z-10 flex items-center gap-3 uppercase tracking-wider">
                    <span className="w-2 h-6 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.4)]" />
                    Add New Course
                </h2>
                <form onSubmit={handleCreate} className="relative z-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Detailed Course Title</label>
                            <input
                                type="text" required
                                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                                value={name} onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Behavioral Economics & Game Theory"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Target Batch</label>
                            <input
                                type="text" required
                                className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold"
                                value={batch} onChange={(e) => setBatch(e.target.value)}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Term</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold appearance-none cursor-pointer"
                                    value={term} onChange={(e) => setTerm(e.target.value)}
                                >
                                    <option value="1">Term 1</option>
                                    <option value="2">Term 2</option>
                                    <option value="3">Term 3</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Credits</label>
                                <select
                                    required
                                    className="w-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/[0.1] rounded-2xl px-6 py-4 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500/50 transition-all font-bold appearance-none cursor-pointer"
                                    value={credits} onChange={(e) => setCredits(e.target.value)}
                                >
                                    <option value="1.0">1.0 Credit</option>
                                    <option value="0.75">0.75 Credit</option>
                                    <option value="0.5">0.5 Credit</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6">
                        <button
                            type="submit" disabled={creating}
                            className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg dark:shadow-[0_12px_24px_rgba(37,99,235,0.3)] disabled:opacity-50 uppercase tracking-widest text-[10px]"
                        >
                            {creating ? "Saving to system..." : "Initialize Course"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] p-10 shadow-sm dark:shadow-2xl relative overflow-hidden">
                <h2 className="text-xl font-black text-slate-900 dark:text-white mb-8 flex items-center gap-3 uppercase tracking-wider">
                    <Lock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    Term Controls
                </h2>
                <div className="space-y-5">
                    {[1, 2, 3].map(t => {
                        const locked = isTermLocked(t);
                        return (
                            <div key={t} className="p-5 rounded-3xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.05] flex items-center justify-between group transform transition-all hover:bg-slate-100 dark:hover:bg-white/[0.04]">
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tighter">Term {t}</p>
                                    <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${locked ? "text-emerald-600 dark:text-emerald-400" : "text-amber-600 dark:text-amber-400"}`}>
                                        {locked ? "Published & Locked" : "Lifecycle Open"}
                                    </p>
                                    <div className="mt-2 flex items-center gap-2">
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Max Load:</span>
                                        {editingWeight === t ? (
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" step="0.25" 
                                                    className="w-16 bg-white dark:bg-white/[0.05] border border-blue-500/30 rounded px-2 py-0.5 text-[11px] font-black outline-none"
                                                    value={newWeight} onChange={(e) => setNewWeight(e.target.value)}
                                                    autoFocus
                                                />
                                                <button onClick={() => handleUpdateTermWeight(t)} className="text-[10px] font-black text-blue-500 uppercase">Save</button>
                                                <button onClick={() => setEditingWeight(null)} className="text-[10px] font-black text-slate-400 uppercase">×</button>
                                            </div>
                                        ) : (
                                            <button 
                                                onClick={() => { setEditingWeight(t); setNewWeight(termStatuses.find(ts => ts.term === t)?.weight?.toString() || "1.0"); }}
                                                className="text-[11px] font-black text-slate-900 dark:text-white hover:text-blue-500 transition-colors"
                                            >
                                                {termStatuses.find(ts => ts.term === t)?.weight || "1.0"} Credits
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {!locked ? (
                                        <button
                                            onClick={() => handleLockTerm(t)}
                                            disabled={lockingTerm === t}
                                            className="p-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 hover:text-amber-500 border border-amber-500/20 rounded-2xl transition-all"
                                            title="Lock Term & Notify Students"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded-2xl shadow-sm dark:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
                <p className="mt-6 text-[10px] text-slate-500 leading-relaxed uppercase font-bold tracking-wider">
                    Caution: Locking a term triggers automated result emails and renders all associated data immutable for both CRs and Admin.
                </p>
            </div>
        </div>
      )}

      <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-sm dark:shadow-2xl relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 opacity-50"></div>
        <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
            <thead>
                <tr className="border-b border-slate-200 dark:border-white/[0.06] bg-slate-50 dark:bg-white/[0.02]">
                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Course Name</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Batch/Year</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Term/Credits</th>
                    <th className="px-10 py-6 text-left text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Status</th>
                    <th className="px-10 py-6 text-right text-[10px] font-black text-slate-500 uppercase tracking-[.2em]">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.05]">
                {courses.map((course) => {
                const locked = isTermLocked(course.term);
                return (
                <tr key={course.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors group">
                    <td className="px-10 py-8 whitespace-nowrap">
                        <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.08] flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-all group-hover:bg-blue-600/5 dark:group-hover:bg-blue-600/10 group-hover:border-blue-500/20">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="text-base font-black text-slate-900 dark:text-white tracking-widest uppercase group-hover:text-blue-600 dark:group-hover:text-blue-300 transition-colors">{course.name}</span>
                        </div>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                        <div className="space-y-1">
                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Batch {course.batch}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Year {course.year}</p>
                        </div>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                            <span className={`px-4 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-widest ${locked ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"}`}>Term {course.term || 1}</span>
                            <span className="px-4 py-1.5 bg-slate-100 dark:bg-white/[0.05] text-slate-500 border border-slate-200 dark:border-white/[0.08] rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">{course.credits || 1.0} CR</span>
                        </div>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap">
                    <span className={`px-4 py-1.5 inline-flex text-[10px] font-black rounded-full uppercase tracking-[0.15em] border ${course.is_active ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"}`}>
                        <span className={`w-1 h-1 rounded-full mr-2 animate-pulse ${course.is_active ? "bg-emerald-600 dark:bg-emerald-400" : "bg-red-600 dark:bg-red-400"}`} />
                        {course.is_active ? "Lifecycle Active" : "Archived"}
                    </span>
                    </td>
                    <td className="px-10 py-8 whitespace-nowrap text-right">
                    {role === "OFFICE_STAFF" ? (
                        <div className="flex items-center justify-end gap-3">
                            <span 
                                className={`inline-flex items-center gap-3 px-6 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-400 cursor-not-allowed`}
                            >
                                Read Only <ShieldCheck className="w-3 h-3 text-emerald-600/50 dark:text-emerald-400/50" />
                            </span>
                            {!locked && (
                                <button
                                    onClick={() => {
                                        setDeletingCourse(course.id);
                                        setConfirmModal({
                                            isOpen: true,
                                            title: "Purge Course Data",
                                            message: "Are you absolutely sure? This will permanently delete the course, all associated marks, component breakups, and historical logs. This action IS IRREVERSIBLE.",
                                            onConfirm: handleDeleteCourse
                                        });
                                    }}
                                    className="p-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 hover:border-red-500 text-red-500/70 hover:text-red-500 rounded-2xl transition-all shadow-sm hover:scale-105"
                                    title="Delete Entire Course"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    ) : role === "CR" && user?.section === course.section && user?.batch === course.batch ? (
                        <div className="flex items-center justify-end gap-3">
                           <a 
                                href={`/dashboard/courses/${course.id}/breakup`} 
                                className={`inline-flex items-center gap-3 px-6 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${locked ? "bg-slate-100 dark:bg-white/[0.02] border-slate-200 dark:border-white/[0.05] text-slate-400 cursor-not-allowed" : "bg-white dark:bg-white/[0.05] border-slate-200 dark:border-white/[0.1] hover:border-blue-500/50 hover:bg-blue-600/5 dark:hover:bg-blue-600/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white shadow-sm dark:shadow-xl hover:scale-105"}`}
                                onClick={(e) => locked && e.preventDefault()}
                            >
                                {locked ? "Locked" : "Manage Breakup"} {locked ? <Lock className="w-3 h-3 text-emerald-600/50 dark:text-emerald-400/50" /> : <LayoutDashboard className="w-3 h-3 text-blue-600/50 dark:text-blue-500/50" />}
                            </a>
                            <a href={`/dashboard/marks/${course.id}`} className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] hover:border-blue-500/50 hover:bg-blue-600/5 dark:hover:bg-blue-600/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-xl hover:scale-105">
                                Marks Table <BarChart3 className="w-3 h-3 text-blue-600/50 dark:text-blue-500/50" />
                            </a>
                        </div>
                    ) : (
                        <a href={`/dashboard/marks/${course.id}`} className="inline-flex items-center gap-3 px-6 py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] hover:border-blue-500/50 hover:bg-blue-600/5 dark:hover:bg-blue-600/10 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm dark:shadow-xl hover:scale-105">
                            Points Table <BarChart3 className="w-3 h-3 text-blue-600/50 dark:text-blue-500/50" />
                        </a>
                    )}
                    </td>
                </tr>
                )})}
            </tbody>
            </table>
        </div>
        {courses.length === 0 && (
            <div className="py-20 text-center">
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Vault Empty · Awaiting course initiation</p>
            </div>
        )}
      </div>
    </div>

    <ConfirmModal 
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmTextColor={confirmModal.confirmTextColor}
    />
    </>
  );
}
