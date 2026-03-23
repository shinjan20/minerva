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

  if (loading) return <LoadingPopup message="Establishing secure connection to course pipeline..." />;
  if (!course) return <div className="p-8 text-red-500">Course not found.</div>;

  return (
    <div className="p-10 max-w-5xl mx-auto space-y-10 relative animate-fade-in-up">
      {/* Visual Stepper */}
      <div className="flex items-center justify-between max-w-2xl mx-auto mb-12">
        {[
          { s: 1, label: "Select File" },
          { s: 2, label: "Review & Validate" },
          { s: 3, label: "Authorization" }
        ].map((item, idx) => (
          <div key={item.s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all duration-500 shadow-lg ${
                step === item.s ? "bg-primary text-white scale-110 ring-4 ring-primary/20" : 
                step > item.s ? "bg-green-500 text-white" : "bg-gray-200 text-gray-400"
              }`}>
                {step > item.s ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : item.s}
              </div>
              <span className={`text-[10px] font-black uppercase tracking-widest ${step >= item.s ? "text-gray-900" : "text-gray-400"}`}>{item.label}</span>
            </div>
            {idx < 2 && (
              <div className={`flex-1 h-0.5 mx-4 transition-all duration-1000 ${step > item.s ? "bg-green-500" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 flex flex-col gap-2 pb-6 border-b border-gray-200/50">
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-primary to-purple-800 tracking-tight">
          {step === 1 ? "Upload Marks" : step === 2 ? "Review Analytical Data" : "Security Lock Override"}
        </h1>
        <p className="text-lg text-gray-500 font-medium">Processing <strong className="text-primary">{course.name}</strong> (Batch: {course.batch}).</p>
      </div>

      {/* STEP 1: UPLOAD */}
      {step === 1 && (
        <div className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-white/80 p-10 relative overflow-hidden group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary to-purple-500 opacity-70 group-hover:opacity-100 transition-opacity"></div>
          <form onSubmit={handlePreview} className="space-y-8 relative z-10">
            <div className="space-y-3">
              <label className="block text-xs font-bold tracking-widest text-gray-500 uppercase">Input Raw Data Document</label>
              <div className="flex justify-center px-6 pt-10 pb-12 border-2 border-gray-200 border-dashed rounded-2xl bg-gray-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all group/upload cursor-pointer relative overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover/upload:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="space-y-5 text-center relative z-10">
                  <div className="p-6 bg-white rounded-3xl shadow-sm inline-block group-hover/upload:scale-110 transition-transform duration-500 border border-gray-50">
                    <svg className="h-12 w-12 text-gray-400 group-hover/upload:text-primary transition-colors" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label className="relative cursor-pointer bg-white px-6 py-3 rounded-2xl font-black text-primary shadow-md hover:shadow-xl border border-primary/10 hover:border-primary/30 transition-all focus-within:outline-none hover:scale-105 active:scale-95">
                      <span>Select Spreadsheet or PDF</span>
                      <input type="file" required accept=".xlsx,.xls,.csv,application/pdf,.pdf" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                  </div>
                  <p className="text-sm text-gray-400 font-medium">Compatible with PGP 'Faculty Results Template' & Scanned PDFs.</p>
                  
                  {file && <div className="mt-6 py-4 px-8 bg-green-500/10 border border-green-500/20 rounded-2xl inline-block animate-fade-in-up">
                     <p className="text-sm font-black text-green-700 flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                       Attached: {file.name} ({(file.size / 1024).toFixed(1)} KB)
                     </p>
                  </div>}
                </div>
              </div>
            </div>

            <div className="pt-8 flex items-center justify-end gap-5">
              <button
                type="button"
                onClick={() => router.back()}
                className="py-4 px-8 border border-gray-200 rounded-2xl shadow-sm text-sm font-black text-gray-700 bg-white hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-95"
              >
                Abort
              </button>
              <button
                type="submit"
                disabled={uploading || !file}
                className="flex justify-center py-4 px-10 border border-transparent rounded-2xl shadow-[0_8px_20px_0_rgba(79,70,229,0.3)] text-sm font-black text-white bg-gradient-to-r from-primary to-purple-600 hover:opacity-90 disabled:opacity-50 disabled:hover:scale-100 transition-all hover:scale-[1.02] active:scale-95"
              >
                {uploading ? "Ingesting analytical data..." : "Start Validation Sequence"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: REVIEW & VALIDATE */}
      {step === 2 && previewData && (
        <div className="space-y-8 animate-fade-in-up">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Total Payload Rows</p>
                <p className="text-3xl font-black text-gray-900">{previewData.rows.length}</p>
            </div>
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Enrolled Match</p>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-black text-green-600">{previewData.rows.filter((r: any) => r.validation.is_enrolled).length}</p>
                    <p className="text-sm font-bold text-gray-400 pb-1">/ {previewData.rows.length}</p>
                </div>
            </div>
            <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">New System Profiles</p>
                <p className="text-3xl font-black text-orange-500">{previewData.rows.filter((r: any) => !r.validation.is_registered).length}</p>
            </div>
          </div>

          <div className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-white/80 overflow-hidden relative">
            <div className="p-8 border-b border-gray-100 bg-white/40 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-gray-900 border-l-4 border-primary pl-3">Verification Matrix</h2>
                <p className="text-sm text-gray-500 mt-1 pl-4">Detected {previewData.columns.length} analytical components.</p>
              </div>
              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="py-3 px-6 rounded-2xl border border-gray-200 bg-white text-gray-700 font-black text-sm shadow-sm hover:bg-gray-50 transition-all hover:scale-[1.02]">
                  Discard & Re-upload
                </button>
                <button onClick={() => handleConfirmUpload()} disabled={uploading} className="py-3 px-8 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-black text-sm shadow-[0_8px_20px_0_rgba(16,185,129,0.3)] hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all">
                  {uploading ? "Flushing to Database..." : "Looks Perfect, Commit Mark"}
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-[600px]">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50/80 sticky top-0 z-10 backdrop-blur-md shadow-sm">
                  <tr>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Status</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">ID</th>
                    <th className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Student Name</th>
                    {previewData.columns.map((col: any, idx: number) => (
                      <th key={idx} className="p-5 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">
                        {col.name} <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded-full ml-1 uppercase">{col.maxScore}pt</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {previewData.rows.length === 0 ? (
                    <tr><td colSpan={previewData.columns.length + 3} className="p-20 text-center text-gray-500 italic">No valid row data extracted.</td></tr>
                  ) : (
                    previewData.rows.map((row: any, i: number) => (
                      <tr key={i} className={`hover:bg-primary/5 transition-colors ${!row.validation.is_enrolled ? "bg-orange-50/30" : ""}`}>
                        <td className="p-5 border-r border-gray-50">
                           {!row.validation.is_registered ? (
                             <span className="px-2 py-1 rounded-md bg-red-100 text-red-600 text-[9px] font-black uppercase tracking-tighter">NEW_USER</span>
                           ) : !row.validation.is_enrolled ? (
                             <span className="px-2 py-1 rounded-md bg-orange-100 text-orange-600 text-[9px] font-black uppercase tracking-tighter">UNENROLLED</span>
                           ) : row.validation.name_mismatch ? (
                             <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-700 text-[9px] font-black uppercase tracking-tighter">MISMATCH</span>
                           ) : (
                             <span className="px-2 py-1 rounded-md bg-green-100 text-green-600 text-[9px] font-black uppercase tracking-tighter">VALID</span>
                           )}
                        </td>
                        <td className="p-5 text-sm font-black text-gray-900 border-r border-gray-50 font-mono tracking-tight">{row.student_id}</td>
                        <td className="p-5 text-sm font-bold text-gray-700 border-r border-gray-50">
                           <div className="flex flex-col">
                              <span>{row.student_name}</span>
                              {row.validation.name_mismatch && (
                                <span className="text-[9px] text-yellow-600 uppercase font-black tracking-tight">System: {row.validation.db_name}</span>
                              )}
                           </div>
                        </td>
                        {previewData.columns.map((col: any, idx: number) => {
                          const score = row.components[col.name];
                          return (
                            <td key={idx} className="p-5 text-sm text-right font-black font-mono text-gray-900">
                               {score === "AB" ? <span className="text-red-500">AB</span> : score ?? <span className="text-gray-300">—</span>}
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
        <div className="flex flex-col items-center justify-center py-12 animate-fade-in">
          <div className="bg-white/70 backdrop-blur-2xl rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white group relative">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-red-500 to-orange-500 animate-pulse"></div>
            <div className="p-12">
              <div className="w-24 h-24 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-8 shadow-inner border border-red-100 group-hover:scale-110 transition-transform duration-500">
                <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m2-11a9 9 0 11-12 11 9 9 0 0112-11zm-5.5 13.5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM15 13h-6m6 0a2 2 0 00-2 2v4a2 2 0 002 2h4a2 2 0 002-2v-4a2 2 0 00-2-2h-4z" />
                </svg>
              </div>
              <h3 className="text-3xl font-black text-center text-gray-900 tracking-tight">Authorization Required</h3>
              <p className="text-base text-gray-500 text-center mt-5 font-medium px-6 leading-relaxed">
                Detected a PGP marks conflict. This procedure will <strong>permanently overwrite</strong> existing component milestones for matched student records. 
                <br /><br />
                A secure authorization PIN has been broadcast to the primary Office Administrator.
              </p>
              
              <form onSubmit={handleOtpSubmit} className="mt-10 space-y-8">
                <div>
                   <label className="block text-[10px] font-black tracking-[0.3em] text-gray-400 uppercase text-center mb-4">Verification PIN (6-Digits)</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    className="mt-1 block w-full text-center text-5xl font-black tracking-[0.4em] px-4 py-8 border-4 border-gray-100/50 rounded-3xl shadow-inner bg-gray-50/30 focus:outline-none focus:ring-8 focus:ring-red-500/10 focus:border-red-400/50 transition-all placeholder:text-gray-200"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="------"
                  />
                </div>
                <div className="flex gap-6 pt-2">
                  <button
                    type="button"
                    onClick={() => { setStep(2); setUploading(false); setOtp(""); }}
                    className="flex-1 py-5 px-6 border-2 border-gray-100 rounded-2xl shadow-sm text-sm font-black text-gray-600 bg-white hover:bg-gray-50 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    Back to Preview
                  </button>
                  <button
                    type="submit"
                    disabled={uploading || otp.length !== 6}
                    className="flex-[1.5] flex justify-center items-center py-5 px-6 border border-transparent rounded-2xl shadow-[0_12px_24px_0_rgba(239,68,68,0.3)] text-sm font-black text-white bg-red-500 hover:bg-red-600 transition-all hover:scale-[1.02] active:scale-95"
                  >
                    {uploading ? "Verifying..." : "Confirm & Execute Override"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER: Existing Roster / Status Panel (Only Step 1) */}
      {step === 1 && (
        <div className="bg-white/60 backdrop-blur-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-3xl border border-white/80 overflow-hidden relative animate-fade-in-up mt-12">
           <div className="p-8 border-b border-gray-100 bg-white/40">
              <h2 className="text-xl font-bold tracking-tight text-gray-900 border-l-4 border-gray-900 pl-3">Existing Student Roster & Status</h2>
              <p className="text-sm text-gray-500 mt-1 pl-4">Live snapshot of currently registered marks and rankings for verification.</p>
           </div>
           
           <div className="overflow-x-auto max-h-[500px]">
             {rosterLoading ? (
                <div className="p-12 text-center text-gray-500 font-bold animate-pulse">Synchronizing roster telemetrics...</div>
             ) : scores.length === 0 ? (
                <div className="p-12 text-center text-gray-500">No scoring data has been logged for this module.</div>
             ) : (
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-gray-50/80 to-white/80 backdrop-blur-md sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest border-r border-gray-100/50">Rank</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Student ID</th>
                      <th className="px-6 py-5 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Target Details</th>
                      {columns.map((col: string) => (
                        <th key={col} className="px-6 py-5 text-center text-xs font-black text-gray-500 uppercase tracking-widest">{col}</th>
                      ))}
                      <th className="px-6 py-5 text-center text-xs font-black text-gray-800 uppercase tracking-widest bg-gray-100/50">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100/80">
                    {scores.map((row, index) => (
                      <tr key={row.student_id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 bg-white/90 border-r border-gray-100/50">#{index + 1}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold font-mono text-primary/80">{row.student_id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">{row.name}</td>
                        {columns.map((col: string) => (
                          <td key={col} className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold font-mono text-gray-600">
                            {row.components[col] !== undefined ? row.components[col] : <span className="text-gray-300">-</span>}
                          </td>
                        ))}
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-black text-primary bg-gray-50/30">
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
