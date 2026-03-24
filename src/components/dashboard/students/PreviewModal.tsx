"use client";

import { getStudentId, getIsCR } from "@/lib/student-utils";

interface PreviewModalProps {
  previewData: any[];
  rosterData: any[];
  file: File | null;
  loading: boolean;
  onClose: () => void;
  onUpload: () => void;
}

export default function PreviewModal({
  previewData,
  rosterData,
  file,
  loading,
  onClose,
  onUpload
}: PreviewModalProps) {
  if (!previewData || previewData.length === 0) return null;

  const existingCount = previewData.filter(row => {
    const id = getStudentId(row);
    return rosterData.some(r => r.student_id === id);
  }).length;

  const crRows = previewData.filter(row => getIsCR(row));
  const crCount = crRows.length;
  const crCollision = crCount > 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-900/40 dark:bg-[#020617]/90 backdrop-blur-2xl animate-fade-in font-[Orbitron]">
      <div className="bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/[0.1] rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] dark:shadow-[0_0_100px_rgba(0,0,0,0.8)] w-full max-w-6xl flex flex-col overflow-hidden max-h-[90vh] animate-scale-up relative">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600"></div>
        
        <div className="px-10 py-8 border-b border-slate-200 dark:border-white/[0.05] flex justify-between items-center bg-slate-50 dark:bg-white/[0.02]">
          <div className="space-y-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-3">
               <span className="w-2 h-6 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.6)]" />
               Review Student Data
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] pl-5">Viewing data from: <span className="text-blue-400">{file?.name}</span></p>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 text-slate-500 hover:text-white hover:bg-white/[0.05] rounded-2xl transition-all"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-white/[0.01]">
          <div className="space-y-4">
            <div className="space-y-3">
              {existingCount > 0 && (
                <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                      <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-amber-400 uppercase tracking-widest">
                        DUPLICATE DETECTION: {existingCount} Students Already Enrolled
                      </p>
                      <p className="text-[10px] text-amber-400/60 mt-1 font-bold uppercase">
                        Redundant records will be skipped to avoid duplicate entries.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {crCollision && (
                <div className="bg-red-500/5 border border-red-500/20 p-5 rounded-2xl">
                  <div className="flex items-start gap-4">
                    <div className="mt-1">
                       <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    </div>
                    <div>
                      <p className="text-[11px] font-black text-red-400 uppercase tracking-widest">
                        ERROR: MULTIPLE CLASS REPRESENTATIVES FOUND
                      </p>
                      <p className="text-[10px] text-red-400/60 mt-1 font-bold uppercase">
                        Each section must have only one Class Representative. Please fix the file.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead className="bg-slate-100 dark:bg-[#020617] border-b border-slate-200 dark:border-white/[0.06]">
                    <tr>
                      {Object.keys(previewData[0] || {}).slice(0, 7).map((key, i) => (
                        <th key={key + i} className="px-8 py-5 text-left text-[10px] font-black text-slate-500 dark:text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.03]">
                    {previewData.slice(0, 10).map((row, idx) => {
                      const sId = getStudentId(row);
                      const isExisting = rosterData.some(r => r.student_id === sId);
                      const isCrRow = getIsCR(row);
                      const highlightClass = isCrRow ? 'bg-blue-600/10 hover:bg-blue-600/20' : (isExisting ? 'bg-amber-500/5' : 'hover:bg-white/[0.02]');
                      
                      return (
                        <tr key={idx} className={`transition-all duration-300 ${highlightClass}`}>
                          {Object.keys(previewData[0] || {}).slice(0, 7).map((key, i) => {
                            const isIdCol = key.trim().toLowerCase().replace(/\s+/g, '') === 'studentid' || key.trim().toLowerCase().replace(/\s+/g, '') === 'id';
                            const isRoleCol = key.trim().toLowerCase().includes('cr') || key.trim().toLowerCase().includes('role');
                            return (
                              <td key={key + i} className="px-8 py-4 text-sm text-slate-600 dark:text-slate-400 font-bold uppercase truncate max-w-[200px] relative">
                                <span className={isIdCol ? "text-blue-600 dark:text-blue-400 font-mono font-black" : "text-slate-800 dark:text-slate-300"}>
                                  {String(row[key] || "")}
                                </span>
                                {isExisting && isIdCol && (
                                  <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.1)]">
                                    Exists
                                  </span>
                                )}
                                {isCrRow && isRoleCol && (
                                   <span className="ml-3 inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(37,99,235,0.1)] animate-pulse">
                                    CR
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {previewData.length > 10 && (
                <div className="bg-white/[0.02] px-10 py-4 text-[10px] text-slate-500 font-black uppercase tracking-[0.2em] text-center border-t border-white/[0.06]">
                  + {previewData.length - 10} more rows found in the file
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-10 py-8 border-t border-white/[0.05] bg-white/[0.02] flex justify-end gap-5">
          <button 
            type="button"
            onClick={onClose}
            className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.1] transition-all border border-slate-200 dark:border-white/[0.1]"
            disabled={loading}
          >
            Abort
          </button>
          <button 
            onClick={onUpload}
            disabled={loading}
            className="px-10 py-4 bg-blue-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-[0_12px_24px_rgba(37,99,235,0.3)] disabled:opacity-50 flex items-center justify-center min-w-[200px]"
          >
            {loading ? "Saving Students..." : "Upload Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
