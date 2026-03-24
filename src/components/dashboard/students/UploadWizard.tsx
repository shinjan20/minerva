"use client";

import { useState } from "react";
import toast from "react-hot-toast";

interface UploadWizardProps {
  step: 1 | 2;
  setStep: (step: 1 | 2) => void;
  selectedSection: string;
  setSelectedSection: (section: string) => void;
  file: File | null;
  setFile: (file: File | null) => void;
  onFileSelect: (file: File) => void;
  loading: boolean;
}

export default function UploadWizard({
  step,
  setStep,
  selectedSection,
  setSelectedSection,
  file,
  setFile,
  onFileSelect,
  loading
}: UploadWizardProps) {
  const sectionOptions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) onFileSelect(selectedFile);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (!droppedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        toast.error("Please drop a valid Excel file (.xlsx or .xls)");
        return;
      }
      onFileSelect(droppedFile);
    }
  };

  const handleNextStep1 = () => {
    if (!selectedSection) {
      toast.error("Please select a section to proceed.");
      return;
    }
    setStep(2);
  };

  return (
    <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/[0.06] backdrop-blur-3xl p-10 rounded-[2.5rem] shadow-sm dark:shadow-2xl relative overflow-hidden">
      <div className="mb-12">
        <div className="flex items-center justify-center max-w-lg mx-auto relative z-10">
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ${step >= 1 ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.1]'}`}>01</div>
            <span className={`text-[10px] mt-3 font-black uppercase tracking-widest ${step >= 1 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>Section</span>
          </div>
          <div className={`w-32 h-1 mx-4 rounded-full transition-all duration-500 ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200 dark:bg-white/10'}`}></div>
          <div className="flex flex-col items-center">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 ${step >= 2 ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-white/[0.1]'}`}>02</div>
            <span className={`text-[10px] mt-3 font-black uppercase tracking-widest ${step >= 2 ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-600'}`}>Upload</span>
          </div>
        </div>
      </div>

      <div className="min-h-[200px] flex flex-col justify-center">
        {step === 1 && (
          <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Select Section</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Which section's roster are you uploading right now?</p>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-4 py-4">
              {sectionOptions.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setSelectedSection(letter)}
                  className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-xl font-black transition-all border-2
                    ${selectedSection === letter 
                      ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-110' 
                      : 'bg-white dark:bg-white/[0.03] border-slate-200 dark:border-white/[0.05] text-slate-400 dark:text-slate-500 hover:border-blue-500/50 hover:bg-slate-50 dark:hover:bg-white/[0.08]'
                    }`}
                >
                  {letter}
                </button>
              ))}
            </div>
            
            <div className="flex justify-center pt-6">
              <button
                onClick={handleNextStep1}
                disabled={!selectedSection}
                className="w-full sm:w-2/3 py-4 px-6 rounded-2xl shadow-xl text-[11px] font-black uppercase tracking-[0.2em] text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:scale-100 transition-all hover:scale-[1.02] active:scale-95"
              >
                Continue to Upload
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-fade-in max-w-2xl mx-auto w-full">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">Upload Data for Section {selectedSection}</h2>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Provide an Excel file containing the student records.</p>
            </div>

            <div 
              className="relative border-2 border-dashed border-slate-200 dark:border-white/[0.1] rounded-[2rem] p-12 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.04] hover:border-blue-500/50 transition-all group overflow-hidden shadow-inner"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-3xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:rotate-6 transition-all border border-blue-500/20 shadow-[0_0_30px_rgba(37,99,235,0.1)]">
                  <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Click or drag Excel file here</p>
                  <p className="text-[10px] text-slate-500 mt-2 font-bold uppercase tracking-widest">A preview will be generated automatically</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-white/[0.05] hover:bg-slate-200 dark:hover:bg-white/[0.08] transition-all border border-slate-200 dark:border-white/[0.1]"
              >
                ← Previous Stage
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
