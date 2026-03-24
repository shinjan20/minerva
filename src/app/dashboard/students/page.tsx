"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import * as xlsx from "xlsx";
import UploadWizard from "@/components/dashboard/students/UploadWizard";
import PreviewModal from "@/components/dashboard/students/PreviewModal";
import StudentTable from "@/components/dashboard/students/StudentTable";

export default function StudentRosterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [rosterData, setRosterData] = useState<any[]>([]);
  const [rosterLoading, setRosterLoading] = useState(true);

  const loadRoster = async () => {
    setRosterLoading(true);
    try {
      const res = await fetch("/api/students/roster");
      const data = await res.json();
      if (res.ok) setRosterData(data.roster);
    } catch (err) {
      console.error("Failed to fetch roster", err);
    } finally {
      setRosterLoading(false);
    }
  };

  useEffect(() => {
    loadRoster();
  }, []);

  const processFileForPreview = async (selectedFile: File) => {
    try {
      const buffer = await selectedFile.arrayBuffer();
      const workbook = xlsx.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
      setPreviewData(rawData);
    } catch (err) {
      toast.error("Failed to read Excel file. Please check the format.");
      setFile(null);
      setPreviewData(null);
    }
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    processFileForPreview(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("selectedSection", selectedSection);

    try {
      const res = await fetch("/api/students/bulk", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Successfully loaded ${data.insertedRows} students into Section ${selectedSection}`);
        setFile(null);
        setPreviewData(null);
        setStep(1);
        setSelectedSection("");
        loadRoster();
      } else {
        toast.error(data.error || "Upload failed");
      }
    } catch (err) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendInvite = async (email: string, name: string) => {
    const loadingToast = toast.loading(`Resending invitation to ${name}...`);
    try {
      const res = await fetch('/api/students/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (res.ok) {
        toast.success(`Invitation sent to ${email}`, { id: loadingToast });
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to resend invite", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Network error", { id: loadingToast });
    }
  };

  const handleRemoveStudent = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from the active roster?`)) return;
    
    const loadingToast = toast.loading(`Removing ${name}...`);
    try {
      const res = await fetch(`/api/students/roster?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success(`${name} removed from roster`, { id: loadingToast });
        setRosterData(prev => prev.filter(s => s.id !== id));
      } else {
        toast.error("Failed to remove student", { id: loadingToast });
      }
    } catch (err) {
      toast.error("Network error", { id: loadingToast });
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-10 animate-fade-in-up font-[Orbitron]">
      <div className="pb-8 border-b border-slate-200 dark:border-white/[0.08]">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-[0.3em] uppercase">Status: Ready</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter uppercase flex items-center gap-4">
          <span className="w-2.5 h-12 bg-blue-600 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.8)]" />
          <div className="flex items-center gap-3">
            <span className="text-slate-900 dark:text-white">Student</span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-600 dark:from-blue-400 dark:to-blue-600">Management</span>
          </div>
        </h1>
        <p className="mt-3 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-80 pl-5">Upload student lists and manage the active database records.</p>
      </div>

      <UploadWizard
        step={step}
        setStep={setStep}
        selectedSection={selectedSection}
        setSelectedSection={setSelectedSection}
        file={file}
        setFile={setFile}
        onFileSelect={handleFileSelect}
        loading={loading}
      />

      {previewData && (
        <PreviewModal
          previewData={previewData}
          rosterData={rosterData}
          file={file}
          loading={loading}
          onClose={() => { setPreviewData(null); setFile(null); }}
          onUpload={handleUpload}
        />
      )}

      <StudentTable
        rosterData={rosterData}
        rosterLoading={rosterLoading}
        onResendInvite={handleResendInvite}
        onRemoveStudent={handleRemoveStudent}
      />
    </div>
  );
}
