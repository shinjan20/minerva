"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import LoadingPopup from "@/components/LoadingPopup";
import { fireConfetti } from "@/lib/confetti";


export default function MarksUploadPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [scores, setScores] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);
  
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  // Multi-step Flow State
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // OTP Modal State (Now part of Step 3)
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otp, setOtp] = useState("");
  const [targetColumn, setTargetColumn] = useState<string>("TOTAL");

  useEffect(() => {
    fetchCourseInfo();
    fetchTable();
  }, [params.id]);

  const fetchTable = async () => {
    try {
      const res = await fetch(`/api/marks/${params.id}`);
      const data = await res.json();
      if (res.ok) {
        setScores(data.scores || []);
        setColumns(data.columns || []);
      }
    } catch (err) {
      console.error("Failed to fetch roster", err);
    } finally {
      setRosterLoading(false);
    }
  };

  const fetchCourseInfo = async () => {
    try {
      const res = await fetch(`/api/courses`);
      const data = await res.json();
      if (res.ok) {
        const found = data.courses.find((c: any) => c.id === params.id);
        if (found) setCourse(found);
      }
    } catch(err) {
      toast.error("Failed to fetch course details");
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return toast.error("Please select an Excel file.");
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("preview", "true"); // Request visual intercept, skip DB

    try {
      const res = await fetch(`/api/marks/${params.id}/upload`, { method: "POST", body: formData });
      const data = await res.json();
      
      if (res.ok && data.preview) {
        setPreviewData(data.preview);
        setStep(2);
        toast.success("Spreadsheet parsed successfully. Please review the extracted data.");
      } else {
        toast.error(data.error || "Failed to parse preview data.");
      }
    } catch (err) {
      toast.error("Network error during file parsing.");
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmUpload = async (providedOtp?: string) => {
    if (!file) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    if (providedOtp) formData.append("otp", providedOtp);

    try {
      const res = await fetch(`/api/marks/${params.id}/upload`, { method: "POST", body: formData });
      const data = await res.json();

      if (res.status === 403 && data.error === "OTP_REQUIRED") {
        setStep(3);
        toast.error("Re-upload detected. Security OTP sent to Office Staff.");
      } else if (res.ok) {
        toast.success(data.message || `Successfully ingested ${data.insertedRows} scores!`);
        fireConfetti();
        setShowOtpModal(false);
        setOtp("");
        router.push(`/dashboard/marks/${params.id}`);
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Network error during final upload.");
    } finally {
      setUploading(false);
    }
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) return toast.error("Please enter a valid 6-digit OTP");
    handleConfirmUpload(otp);
  };

  if (loading) return <LoadingPopup message="Loading course details..." />;
  if (!course) return <div className="p-8 text-red-500 font-bold uppercase tracking-widest">Course Not Found</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-12 relative animate-fade-in-up font-[Orbitron]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Data Ingestion Engine</span>
          <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
            <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <span className="text-slate-900 dark:text-white">Marks</span>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-blue-600">Upload</span>
              </div>
              {course && (
                <div className="mt-1 flex items-center gap-3 text-lg sm:text-2xl font-black tracking-tighter">
                  <span className="text-blue-600 dark:text-blue-400">Subject : {course.name}</span>
                  <span className="text-slate-300 dark:text-white/20">|</span>
                  <span className="text-slate-500 dark:text-slate-400">Term : {course.term || 1}</span>
                </div>
              )}
            </div>
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest pl-5 opacity-80 mt-2">Securely process academic spreadsheets into the Minerva ledger.</p>
        </div>
        <button 
          onClick={() => router.back()} 
          className="px-6 py-3 bg-white dark:bg-white/[0.05] border border-slate-200 dark:border-white/[0.1] text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
        >
          ← Back
        </button>
      </div>

      {/* Visual Stepper */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-16">
        {[
          { s: 1, label: "Select File" },
          { s: 2, label: "Preview Data" },
          { s: 3, label: "Security Verification" }
        ].map((item, idx) => (
          <div key={item.s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black transition-all duration-500 shadow-[0_0_20px_rgba(37,99,235,0.1)] border ${
                step === item.s ? "bg-blue-600 text-white border-blue-400 scale-110 shadow-[0_0_30px_rgba(37,99,235,0.4)]" : 
                step > item.s ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/[0.03] text-slate-600 border-white/[0.06]"
              }`}>
                {step > item.s ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : item.s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${step >= item.s ? "text-blue-400" : "text-slate-600"}`}>{item.label}</span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-[1px] mx-6 transition-all duration-1000 ${step > item.s ? "bg-emerald-500/50" : "bg-white/[0.08]"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.08]">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase">Status: In Progress</span>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <span className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
            {step === 1 ? "Upload Marks" : step === 2 ? "Preview Data" : "Security Check"}
          </h1>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-5">
            Uploading marks for <strong className="text-blue-400 font-black">{course.name}</strong> (Batch: {course.batch}).
          </p>
        </div>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] p-12 shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <form onSubmit={handlePreview} className="space-y-10 relative z-10">
            <div className="space-y-4">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Select Upload File</label>
              <div className="flex justify-center px-10 pt-12 pb-14 border-2 border-white/5 border-dashed rounded-[2rem] bg-white/[0.01] hover:bg-blue-600/[0.03] hover:border-blue-500/30 transition-all group/upload cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="space-y-6 text-center relative z-10">
                  <div className="p-8 bg-white/[0.03] rounded-3xl border border-white/5 shadow-inner group-hover/upload:scale-110 transition-transform duration-500">
                    <svg className="h-16 w-16 text-slate-600 group-hover/upload:text-blue-400 transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex text-sm text-slate-400 justify-center">
                    <label className="relative cursor-pointer bg-white text-blue-600 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_8px_25px_rgba(255,255,255,0.1)] hover:shadow-white/20 transition-all focus-within:outline-none hover:scale-105 active:scale-95">
                      <span>Choose Excel or PDF File</span>
                      <input type="file" required accept=".xlsx,.xls,.csv,application/pdf,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <p className="text-[10px] text-slate-600 font-black uppercase tracking-[0.15em]">Supports Excel spreadsheets and scanned PDF marks sheets.</p>
                  
                  {file && <div className="mt-8 py-5 px-10 bg-blue-500/10 border border-blue-500/20 rounded-2xl inline-block animate-fade-in-up shadow-[0_0_20px_rgba(59,130,246,0.05)]">
                     <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-3">
                       <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                       File Attached: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                     </p>
                  </div>}
                </div>
              </div>
            </div>

            <div className="pt-10 flex items-center justify-end gap-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="py-4 px-10 bg-white/[0.05] border border-white/[0.08] rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-all hover:scale-105"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="py-4 px-12 bg-blue-600 text-white rounded-2xl shadow-[0_12px_30px_rgba(37,99,235,0.3)] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              >
                {uploading ? "Processing..." : "Preview Marks"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: REVIEW & VALIDATE */}
      {step === 2 && previewData && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-blue-500/30 group-hover:h-full transition-all duration-500 opacity-20"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 relative z-10">Total Students in File</p>
                <p className="text-4xl font-black text-white relative z-10 tracking-tighter">{previewData.rows.length}</p>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-emerald-500/30 group-hover:h-full transition-all duration-500 opacity-20"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 relative z-10">Matched with Database</p>
                <div className="flex items-end gap-2 relative z-10">
                    <p className="text-4xl font-black text-emerald-400 tracking-tighter">{previewData.rows.filter((r: any) => r.validation.is_enrolled).length}</p>
                    <p className="text-[10px] font-black text-slate-600 pb-2 uppercase tracking-widest">/ {previewData.rows.length}</p>
                </div>
            </div>
            <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 inset-x-0 h-1 bg-amber-500/30 group-hover:h-full transition-all duration-500 opacity-20"></div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-2 relative z-10">New Student Records</p>
                <p className="text-4xl font-black text-amber-500 relative z-10 tracking-tighter">{previewData.rows.filter((r: any) => !r.validation.is_registered).length}</p>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/[0.06] rounded-[2.5rem] overflow-hidden shadow-2xl relative">
            <div className="p-10 border-b border-white/[0.06] bg-white/[0.01] flex justify-between items-center sticky top-0 z-20 backdrop-blur-3xl">
              <div className="space-y-1">
                <h2 className="text-xl font-black tracking-widest text-white uppercase flex items-center gap-3">
                  <span className="w-2 h-6 bg-blue-600 rounded-full" />
                  Data Preview
                </h2>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] pl-5">Found {previewData.columns.length} columns in the uploaded file.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="py-4 px-8 rounded-2xl border border-white/[0.1] bg-white/[0.05] text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-all hover:scale-105">
                  Change File
                </button>
                <button onClick={() => handleConfirmUpload()} disabled={uploading} className="py-4 px-10 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-[0_12px_24px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                  {uploading ? "Saving Data..." : "Save All Marks"}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#020617] sticky top-0 z-10 border-b border-white/[0.06]">
                  <tr>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student Name</th>
                    {previewData.columns.map((col: any, idx: number) => (
                      <th key={idx} className="px-8 py-5 text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] text-right">
                        {col.name} <span className="text-[10px] text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md ml-1 uppercase">{col.maxScore}PT</span>
                      </th>
                    ))}
                  </tr>
                </thead>
               <tbody className="divide-y divide-white/[0.05]">
                  {previewData.rows.length === 0 ? (
                    <tr><td colSpan={previewData.columns.length + 3} className="p-20 text-center text-slate-500 italic">No valid row data extracted.</td></tr>
                  ) : (
                    previewData.rows.map((row: any, i: number) => (
                      <tr key={i} className={`hover:bg-white/[0.02] transition-colors border-b border-white/[0.03] ${!row.validation.is_enrolled ? "bg-amber-500/5" : ""}`}>
                        <td className="px-8 py-6 whitespace-nowrap">
                           {!row.validation.is_registered ? (
                             <span className="px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-black border border-red-500/20 uppercase tracking-widest">NEW STUDENT</span>
                           ) : !row.validation.is_enrolled ? (
                             <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-black border border-amber-500/20 uppercase tracking-widest">NOT ENROLLED</span>
                           ) : row.validation.name_mismatch ? (
                             <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black border border-blue-500/20 uppercase tracking-widest">NAME MISMATCH</span>
                           ) : (
                             <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">READY</span>
                           )}
                        </td>
                       <td className="px-8 py-6 whitespace-nowrap text-[12px] font-black text-blue-300/60 font-mono tracking-tight">{row.student_id}</td>
                        <td className="px-8 py-6 whitespace-nowrap">
                           <div className="flex flex-col">
                              <span className="text-sm font-bold text-white uppercase">{row.student_name}</span>
                              {row.validation.name_mismatch && (
                                <span className="text-[9px] text-blue-500 uppercase font-black tracking-widest mt-0.5 opacity-80">System: {row.validation.db_name}</span>
                              )}
                           </div>
                        </td>
                        {previewData.columns.map((col: any, idx: number) => {
                          const score = row.components[col.name];
                          return (
                            <td key={idx} className="px-8 py-6 whitespace-nowrap text-right">
                               <span className={`text-sm font-black font-mono ${score === "AB" ? "text-red-400" : "text-white"}`}>
                                 {score === "AB" ? "AB" : score ?? "—"}
                               </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: AUTHORIZATION (Re-upload Overwrite) */}
      {step === 3 && (
        <div className="flex flex-col items-center justify-center py-16 animate-fade-in">
          <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden group relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 opacity-50"></div>
            <div className="p-16">
              <div className="w-28 h-28 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-10 shadow-[0_0_30px_rgba(239,68,68,0.1)] group-hover:scale-110 transition-transform duration-500">
                <svg className="w-14 h-14 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-11a9 9 0 11-12 11 9 9 0 0112-11zm-5.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 13h-6m6 0a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-4z" />
                </svg>
              </div>
               <h3 className="text-3xl font-black text-center text-white tracking-tighter uppercase">Permission Required</h3>
               <p className="text-[11px] text-slate-500 text-center mt-6 font-bold uppercase tracking-widest px-10 leading-loose">
                 Marks already exist for some students in this course. This upload will <strong className="text-red-400">update</strong> the existing scores with the new values from your file.
                 <br /><br />
                 A security OTP has been sent to the Office Administrator's email to authorize this change.
               </p>
                            <form onSubmit={handleOtpSubmit} className="mt-12 space-y-10">
                <div className="space-y-4 text-center">
                   <label className="block text-[10px] font-black tracking-[0.4em] text-slate-500 uppercase">Enter OTP (6-Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    className="w-full text-center text-6xl font-black tracking-widest px-8 py-10 bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] shadow-inner text-white focus:outline-none focus:border-red-500/50 transition-all placeholder:text-white/5"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="000000"
                  />
                </div>
                <div className="flex gap-6 pt-4">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setUploading(false); setOtp(""); }}
                    className="flex-1 py-5 px-8 bg-white/[0.05] border border-white/[0.1] rounded-2xl text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all hover:scale-105"
                  >
                    Back to Preview
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || otp.length !== 6}
                    className="flex-[1.8] py-5 px-10 bg-red-600 text-white rounded-2xl shadow-[0_12px_24px_rgba(220,38,38,0.3)] text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {uploading ? "Verifying..." : "Confirm & Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER: Existing Roster / Status Panel (Only Step 1) */}
      {step === 1 && (
        <div className="bg-white/[0.02] border border-white/[0.06] backdrop-blur-3xl rounded-[2.5rem] shadow-2xl relative overflow-hidden animate-fade-in-up mt-16">
           <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30"></div>
            <div className="p-10 border-b border-white/[0.06]">
              <h2 className="text-xl font-black uppercase tracking-widest text-white flex items-center gap-3">
                <span className="w-2 h-6 bg-blue-600 rounded-full" />
                Current Scores in System
              </h2>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2 pl-5">Viewing the scores currently saved in the database for this course.</p>
            </div>
           <div className="overflow-x-auto max-h-[500px]">
             {rosterLoading ? (
                <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest animate-pulse">Loading current scores...</div>
             ) : scores.length === 0 ? (
                <div className="p-20 text-center text-slate-500 font-black uppercase tracking-widest">No scores found for this course.</div>
             ) : (
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-white/[0.02] border-b border-white/[0.06]">
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Rank</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student ID</th>
                      <th className="px-8 py-5 text-left text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Student Name</th>
                      {columns.map((col: string) => (
                        <th key={col} className="px-8 py-5 text-center text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] whitespace-nowrap">{col}</th>
                      ))}
                      <th className="px-8 py-5 text-center text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Total Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {scores.map((row, index) => (
                      <tr key={row.student_id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-5 whitespace-nowrap text-sm font-black text-blue-400">#{index + 1}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-[12px] font-black font-mono text-blue-300/60 tracking-tight">{row.student_id}</td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-white font-bold uppercase">{row.name}</td>
                        {columns.map((col: string) => (
                          <td key={col} className="px-8 py-5 whitespace-nowrap text-sm text-center font-black font-mono text-slate-300">
                            {row.components[col] !== undefined ? row.components[col] : <span className="text-slate-700">-</span>}
                          </td>
                        ))}
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-center font-black text-blue-400 bg-blue-500/5">
                          {row.total.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
             )}
           </div>
        </div>
      )}
    </div>
  );
}
